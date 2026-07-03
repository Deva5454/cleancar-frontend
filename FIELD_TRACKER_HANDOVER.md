# Field Tracker Module — Developer Handover

**Branch:** `claude/audit-report-review-lzffz3`
**Scope:** GPS field check-in/checkout, live location tracking, and the downstream travel-reimbursement approval → payroll → payment pipeline it feeds.
**Audience:** the engineer picking this up to continue development or merge this branch.

---

## 1. What this module does

An employee in a field role (Supervisor, Sales Manager, Sales Head) checks in with a selfie + GPS at the start of the day. Their location is tracked continuously (GPS breadcrumbs) until they check out (manually, automatically at 23:59, or forced if location access is revoked). On checkout, a travel reimbursement claim is **auto-created from the GPS distance travelled** — no manual entry, no odometer photos. That claim then flows through manager → HR → (conditionally) City Manager approval, gets attached to payroll, and is paid out by Accounts.

Two audiences, two screens:
- **Employee** — a check-in/checkout widget embedded in their own role app (`FieldCheckIn.tsx`).
- **Admin/Super Admin** — a live map + timeline dashboard to watch everyone in the field in real time (`LiveLocationDashboard.tsx`).

Everything is **client-side only** — no backend. All state lives in `localStorage`, wrapped by two thin service singletons (`fieldTrackingService`, `travelReimbursementService`) that components call directly (not via React Context/hooks for the data layer, only for role/session).

---

## 2. File map

### Core services (no React, plain TS singletons — safe to unit test in isolation)
| File | Responsibility |
|---|---|
| `src/app/services/fieldTrackingService.ts` | GPS session lifecycle: check-in, trail recording, checkout (manual/auto/forced), offline GPS queue, reinstatement requests. Owns `localStorage` keys `field_sessions_v1`, `field_active_session_id`, `field_watcher_active`, `field_offline_gps_queue`. |
| `src/app/services/travelReimbursementService.ts` | Travel claim CRUD + approval state machine (`TripStatus`), rates/exceptions/permissions, notifications. Owns `DataService` keys `TRAVEL_TRIPS`, `TRAVEL_RATES`, `TRAVEL_EXCEPTIONS`, `TRAVEL_PERMISSIONS`, `TRAVEL_PHOTOS`, `TRAVEL_NOTIFICATIONS`. |
| `src/app/services/employeeDatabaseService.ts` | The **real** employee record source used for login, role resolution, and reporting-manager lookups. `localStorage` key `EMPLOYEE_DATABASE_RECORDS`. Populated by `seedAllData()` (see §2.1) on first load; `demoEmployees.ts` (`HISTORIC_EMPLOYEE_DB`) is only a cold-start fallback if that hasn't run. IDs look like `EDB-SUP-SUR1`. |
| `src/app/contexts/FinanceContext.tsx` | `Payable` CRUD + double-entry ledger posting. Travel claims become `Payable` records here (`type: "Salary"`, `travelTripId` cross-reference). |
| `src/app/hooks/useTravelPayableBridge.ts` | Shared `finalizeTravelApproval(trip, opts)` — the "claim approved → create Payable → mark Added to Payroll" bridge, used by both `TravelHRView` and `TravelAdminSettings` so the sequence isn't duplicated (was §7.4, now resolved). |

### UI — Employee side
| File | Responsibility |
|---|---|
| `src/app/components/field/FieldCheckIn.tsx` | Check-in/checkout widget (selfie capture, GPS permission handling, live trail, day summary, travel-claim status card with 30s polling + notifications). Embedded (not routed) inside role apps — see §5. |

### UI — Admin/Super Admin side
| File | Responsibility |
|---|---|
| `src/app/components/field/LiveLocationDashboard.tsx` | Route: `/field-tracker`. Two-panel (staff list + journey detail) dashboard: live GPS trail rendered as an SVG route map, transport-mode inference (walk/auto/BRTS/bike/car from speed), stop/halt detection, travel-claim summary. Responsive: collapses to single-column drill-down below `md`. |

### UI — Travel approval workflow
| File | Responsibility |
|---|---|
| `src/app/components/travel/TravelReimbursementModule.tsx` | Route: `/travel`. **Role dispatcher** — picks which of the 4 views below to render (see §5 table). |
| `src/app/components/travel/TravelEmployeeView.tsx` | Employee's own trip history (also embedded directly in `src/app/components/hr/MyAccountPage.tsx`, outside the dispatcher). |
| `src/app/components/travel/TravelManagerView.tsx` | Reporting-manager approval queue (`managerApprove()` / `reject()`). |
| `src/app/components/travel/TravelHRView.tsx` | HR review, "Pay immediately" (ad-hoc) option, bridges approval → `FinanceContext.createPayable()` + `markAddedToPayroll()`. |
| `src/app/components/travel/TravelAdminSettings.tsx` | Rates/Permissions/Exceptions (Super Admin), City Manager approvals tab + cross-city trip ledger tab. |

### UI — Payment
| File | Responsibility |
|---|---|
| `src/app/components/payroll/SalaryPaymentScreen.tsx` | Accounts screen. Two **separately sourced** tables on one screen — see §7.3. |

### 2.1 Seed data (know which one you're editing)
| File | Feeds | ID space |
|---|---|---|
| `src/app/utils/seedAllData.ts` (`seedAllData()`) | **Authoritative.** Called from `main.tsx:31` on every fresh load, before React mounts. Writes `EMPLOYEE_DATABASE_RECORDS` directly (guarded by a `SEED_FLAG` so it only runs once per browser). Also seeds `TRAVEL_PERMISSIONS`, `TRAVEL_TRIPS`, `field_sessions_v1`, plus unrelated Inventory/Stock/Payroll demo data. | `EDB-...` |
| `src/app/utils/demoEmployees.ts` (`HISTORIC_EMPLOYEE_DB`) | `employeeDatabaseService`'s fallback — **only used if `EMPLOYEE_DATABASE_RECORDS` is empty**, i.e. `seedAllData()` never ran or threw before setting its flag. In normal usage this file is dead code. | `EDB-...` (kept in sync with `seedAllData.ts`'s IDs where they overlap) |
| `src/app/data/seedEmployees.ts` (`SEED_EMPLOYEES`) | `EmployeeContext`/`HRDataContext` → `DataService` key `EMPLOYEES` — a **third, unrelated** employee list for HR/Payroll screens. | `EMP-<timestamp>-<random>` |

These are **two unrelated ID spaces** (`EDB-...` vs `EMP-...`) — see the critical contradiction in §7.1 before you add any new cross-references between field-tracker/travel code and HR/payroll code. `seedAllData.ts` and `demoEmployees.ts` share the `EDB-...` space and were reconciled this round (§9), but treat `seedAllData.ts` as the source of truth going forward — it's what actually runs.

---

## 3. End-to-end data flow

```
Employee checks out (FieldCheckIn.tsx)
  │
  ▼
fieldTrackingService.checkOut() / auto-checkout timer / location-revoked handler
  │  writes: field_sessions_v1 (session.checkOutTime, totalDistanceKm, trail)
  │  [dynamic import to avoid a hard circular dependency]
  ▼
travelReimbursementService.autoSubmitFromSession(session)
  │  reads:  TRAVEL_PERMISSIONS   (is employee enabled? vehicle type?)
  │  reads:  TRAVEL_RATES / TRAVEL_EXCEPTIONS (effective ₹/km)
  │  reads:  EMPLOYEE_DATABASE_RECORDS (resolves reportingManagerId/Name
  │           by matching emp.reportingManager [a name string] against
  │           another record's fullName)
  │  writes: TRAVEL_TRIPS (new trip, status "Pending Manager")
  ▼
TravelManagerView (reporting manager, at /travel)
  │  reads:  TRAVEL_TRIPS where reportingManagerId === currentUser.employeeId
  │  action: managerApprove() → status "Pending HR" + push notification
  ▼
TravelHRView (HR, at /travel)
  │  reads:  TRAVEL_TRIPS where status === "Pending HR"
  │  action: hrApprove()
  │    ├─ amount ≤ ₹2,000 → status "Approved" directly
  │    └─ amount >  ₹2,000 → status "Pending City Manager" (see §7.2 — new gate)
  │  IF status became "Approved" here:
  │    action: FinanceContext.createPayable({ type:"Salary", travelTripId, ... })
  │    action: travelReimbursementService.markAddedToPayroll() → status "Added to Payroll"
  ▼ (only if amount > ₹2,000)
TravelAdminSettings — Approvals tab (City Manager, cityManagerMode, at /travel)
  │  reads:  TRAVEL_TRIPS where status === "Pending City Manager" && cityId matches
  │  action: cityManagerApprove() → status "Approved"
  │  action: (duplicated) createPayable() + markAddedToPayroll() — see §7.4
  ▼
SalaryPaymentScreen (Accounts, at /finance)
  │  reads:  FinanceContext.getSalaryPayables() filtered by travelTripId present
  │  action: markAsPaid(payableId, UTR, "Bank Transfer") → Payable.status "Paid"
  │          + ledger entries + "cc360_payment_made" DOM event
  ▼
Employee sees "Paid" — FieldCheckIn.tsx polls TRAVEL_TRIPS + TRAVEL_NOTIFICATIONS every 30s
```

**Parallel oversight path (read-only, no state mutation):**
`LiveLocationDashboard.tsx` (`/field-tracker`) independently reads `field_sessions_v1` (live + historical GPS sessions) and cross-references `TRAVEL_TRIPS` by `fieldSessionId` to show the claim status inline with the route map. It does not participate in the approval chain.

### 3.1 Storage key reference — every key, who writes it, who reads it

`fieldTrackingService.ts`'s keys are **raw `localStorage`** (no wrapper). `travelReimbursementService.ts` and `FinanceContext.tsx`'s keys go through **`DataService`**, which internally adds a `cleancar_` prefix and (for some keys) per-city scoping — call `DataService.get("KEY_NAME")` / `DataService.setAll("KEY_NAME", ...)` with the logical name below; don't touch `localStorage` for these directly.

| Storage key | Written by | Read by | What's in it |
|---|---|---|---|
| `field_active_session_id` | `fieldTrackingService.checkIn()` (sets it) / `checkOut()` (clears it) | `fieldTrackingService._rehydrate()` on every page load, to restore an in-progress session | A single session ID string, or absent if nobody's checked in |
| `field_sessions_v1` | `fieldTrackingService.checkIn()` (new session) / trail-recording timer (appends GPS points) / `checkOut()` (sets `checkOutTime`, `totalDistanceKm`) / `seedAllData.ts` (demo sessions) | `FieldCheckIn.tsx` (own session, via `getState()`), `LiveLocationDashboard.tsx` (`getLiveLocations()`, `getSessionsForEmployee()`, `getSessionsForDate()`) | Array of `FieldSession` — check-in/out times, selfies, full GPS trail, attendance regularisation state |
| `field_offline_gps_queue` | `fieldTrackingService`'s GPS watcher, when a point can't be saved live (no signal) | `fieldTrackingService.flushOfflineQueue()`, on network-`online` event or the 30s poll in `FieldCheckIn.tsx` | Buffered `GeoPoint`s waiting to be merged into a session's trail |
| `field_watcher_active` | `fieldTrackingService` internal flag | `fieldTrackingService` internal flag | Whether the GPS watcher is currently registered — housekeeping only |
| `TRAVEL_TRIPS` | `travelReimbursementService.autoSubmitFromSession()` (new trip) / `managerApprove()` / `hrApprove()` / `cityManagerApprove()` / `reject()` / `markAddedToPayroll()` (status transitions) / `seedAllData.ts` (demo trips) | `TravelManagerView`, `TravelHRView`, `TravelAdminSettings` (approvals + ledger tabs), `TravelEmployeeView`, `FieldCheckIn.tsx` (own trip via `fieldSessionId`), `LiveLocationDashboard.tsx` (claim summary) | Array of `TravelTrip` — the claim itself, GPS distance, rate, amount, and full approval audit trail (who approved, when, at each stage) |
| `TRAVEL_PERMISSIONS` | `TravelAdminSettings.togglePermission()` / `.updateVehicleType()` (Super Admin/City Manager) / `seedAllData.ts` (demo) | `travelReimbursementService.isEmployeeEnabled()` (gates `autoSubmitFromSession`), `TravelAdminSettings` Permissions tab | Which employees can submit travel claims, and their vehicle type (2W/4W) |
| `TRAVEL_RATES` | `TravelAdminSettings.saveRate()` (Super Admin only) | `travelReimbursementService.getEffectiveRate()`, used by `autoSubmitFromSession()` to price the claim | Global ₹/km for 2W and 4W |
| `TRAVEL_EXCEPTIONS` | `TravelAdminSettings.addException()` / `.deleteException()` | `travelReimbursementService.getEffectiveRate()` (checked before falling back to `TRAVEL_RATES`) | Per-employee or uniform rate overrides |
| `TRAVEL_PHOTOS` | `travelReimbursementService.savePhoto()` (only used by the legacy manual-entry `startTrip`/`endTrip` flow, not the GPS auto-submit path) | `TravelHRView`'s photo comparison view | Base64 odometer photos — GPS-auto-submitted trips never populate this |
| `TRAVEL_NOTIFICATIONS` | `travelReimbursementService.pushNotification()`, called from `managerApprove()`/`hrApprove()`/`cityManagerApprove()`/`reject()` | `FieldCheckIn.tsx`'s 30s poll (`getNotificationsForEmployee()`, then `markNotificationRead()`) | Per-employee approval/rejection notifications, read/unread |
| `EMPLOYEE_DATABASE_RECORDS` | `seedAllData()` on first load (authoritative — see §2.1); `demoEmployees.ts` fallback only if this key is empty | `employeeDatabaseService.getAll()`/`.getById()` — used by `RoleContext` (login, `currentUser.employeeId`), `autoSubmitFromSession()` (reporting-manager lookup), `TravelAdminSettings` (Permissions/Exceptions employee list), `SalaryPaymentScreen` (bank details for travel payables) | All login-capable employees, `EDB-...` ID space |
| `FINANCE_PAYABLES` | `FinanceContext.createPayable()` (called by `useTravelPayableBridge().finalizeTravelApproval()`) / `.markAsPaid()` (status → "Paid") | `SalaryPaymentScreen` (`getSalaryPayables()`, filtered by `travelTripId` for the travel-linked table) | `Payable` records — one per travel claim that reached "Approved", cross-referenced back to `TRAVEL_TRIPS` via `travelTripId` |
| `EMPLOYEES` (`DataService`) | `seedEmployees.ts` via `EmployeeContext`/`HRDataContext` | `EmployeeContext`'s `useEmployee()` — used by `SalaryPaymentScreen`'s *regular payroll* table (not the travel one) | A **separate, unrelated** employee list, `EMP-...` ID space — see §7.1 |

---

## 4. State machines

### `FieldSession` (fieldTrackingService.ts)
```
(no session) → checkIn() → isCheckedIn=true, session live, trail recording
                    │
                    ├─ checkOut() [manual]         → checkOutTime set, isCheckedIn=false
                    ├─ auto-checkout @ 23:59         → checkOutReason="auto_23_59", isAutoCheckout=true
                    └─ location permission revoked   → checkOutReason="location_revoked", isAutoCheckout=true
                                │
                                ▼ (if auto/forced)
                    attendanceReg: null → submitAttendanceReg() → "Pending" → Approved/Rejected
```
Only an **active** (not-yet-checked-out) session survives a page reload (`_rehydrate()`, `fieldTrackingService.ts:191-199`, matches `field_active_session_id` against a session with no `checkOutTime`). A same-day *completed* session shown by `FieldCheckIn.tsx`'s "Field Day Complete" view is otherwise only kept in the service's in-memory `state` for the remainder of that page load — **verify this still renders correctly after a hard refresh post-checkout** before shipping; it wasn't something this session's changes touched, but it's adjacent to the polling logic that was added (§6).

### `TripStatus` (travelReimbursementService.ts)
```
Draft → Pending Manager → Pending HR ─┬─(≤ ₹2,000)──────────────→ Approved → Added to Payroll
                                       └─(> ₹2,000)→ Pending City Manager → Approved → Added to Payroll
        (any stage) ──────────────────────────────────────────────────────→ Rejected
```
`CITY_MANAGER_APPROVAL_THRESHOLD = 2000` is a hardcoded constant exported from `travelReimbursementService.ts` — not yet exposed as a Super-Admin-configurable rate like `TRAVEL_RATES`. Flagged as a natural follow-up, not a blocker.

---

## 5. Role → route/component map

**`/travel`** dispatch logic (`TravelReimbursementModule.tsx:9-51`):

| `currentRole` | Component rendered |
|---|---|
| `Super Admin`, `Admin` | `TravelAdminSettings` |
| `City Manager` | `TravelAdminSettings cityManagerMode` |
| `HR` | `TravelHRView` |
| `Operations Manager`, `Sr Operations Manager`, `Cluster Manager`, `Supervisor`, `TSM`, `TSE`, `Store Manager` | `TravelManagerView` |
| everything else, if travel-enabled | `TravelEmployeeView` |
| everything else, if not enabled | disabled placeholder |

**`FieldCheckIn` embedding** (it is **not** a routed page — it's a tab inside each role's own app shell):

| App | Import | Renders? |
|---|---|---|
| `sm/SalesManagerApp.tsx` | line 18 | ✅ line 850 |
| `sh/SalesHeadApp.tsx` | line 40 | ✅ line 703 |
| `supervisor/SupervisorAppConnected.tsx` | — | ❌ not present at all |
| `om/OperationsManagerApp.tsx` | — | ❌ **broken, see §7.5** |

**`/field-tracker`** (`routes.tsx:596`) → `LiveLocationDashboard`, Super Admin only, top-level route (not nested under `/travel`).

---

## 6. What changed in this branch (already merged into this branch's history)

1. **Fixed:** `autoSubmitFromSession()` previously left `reportingManagerId: ""` (dead-code stub) — claims silently never reached any manager's queue. Now resolves via `employeeDatabaseService` + `reportingManager` name match.
2. **Added:** City Manager approval gate for claims > ₹2,000 (`Pending City Manager` status, `cityManagerApprove()`, approvals tab in `TravelAdminSettings`).
3. **Added:** Super Admin cross-city, cross-employee trip ledger tab in `TravelAdminSettings`.
4. **Fixed:** `SalaryPaymentScreen` showed hardcoded fake bank numbers (`XXXX1234`); now reads real `Employee.bankDetails`, and travel-linked payables (previously invisible on this screen) now show with a working "mark as paid" flow.
5. **Added:** `Payable` type gained `travelTripId`/`taxAmount`/`tdsAmount`/`isAdhoc` as proper typed fields (previously passed as untyped excess properties).
6. **Added:** "Pay immediately" (ad-hoc) option in `TravelHRView` for urgent claims.
7. **Added:** Live travel-claim status card + 30s polling in `FieldCheckIn.tsx`; persisted notifications (`TRAVEL_NOTIFICATIONS`) on manager/HR/city-manager approve/reject.
8. **Fixed:** `LiveLocationDashboard`'s two-panel layout was fixed-width at every viewport, crushing both panels on phone screens. Now collapses to single-column drill-down below `md`.
9. **Fixed (unrelated, blocking):** duplicate `useState`/`useEffect` import in `src/app/components/procurement/PurchaseOrders.tsx` was crashing the entire Vite dev server on every route — not a field-tracker file, but you can't run the app at all without this fix.

Full detail and file:line references for items 1-6 are in the git history on this branch (two commits: the 8-gap audit fix, and the field-tracker polish/responsiveness commit). A second round of fixes resolving the contradictions originally flagged in §7 is covered in §9.

---

## 7. Contradictions / issues — status

All six items flagged in the first pass are now resolved, including §7.1, which turned out to be a different (and smaller) problem than originally diagnosed once actually tested empirically in the browser — see below.

| # | Issue | Status |
|---|---|---|
| 7.1 | Two non-overlapping employee ID spaces (`EDB-...` vs `EMP-...`) | ✅ Resolved — turned out to already be a non-issue in the live app; the real gap was a dormant fallback path, now closed. See §9.9. |
| 7.2 | `TravelAdminSettings.tsx` read employee data from the wrong source (`useEmployee()` instead of `employeeDatabaseService`), so Permissions/Exceptions tabs got `undefined` fields | ✅ Resolved — §9.2 |
| 7.3 | `SalaryPaymentScreen` intentionally sources two tables from two employee ID spaces | Not a bug, no action needed (documented for awareness) |
| 7.4 | Payable-creation bridge duplicated in `TravelHRView` and `TravelAdminSettings` | ✅ Resolved — extracted to `useTravelPayableBridge()`, §9.3 |
| 7.5 | Operations Manager's "Field Check-In" tab referenced `FieldCheckIn` without importing it (`TS2304`, would crash at runtime) | ✅ Resolved — §9.1 |
| 7.6 | No loggable Sales Manager/Sales Head employee, blocking manual QA of those roles | ✅ Resolved — turned out to be more than a missing-seed-data gap, see §9.4 |

### 7.1 — Two employee ID spaces — corrected diagnosis, see §9.9
The original diagnosis (below, kept for the record) was based on reading `seedEmployees.ts`/`EmployeeContext.tsx` code in isolation. Testing it empirically in a real browser session revealed it doesn't actually happen in the live app — see §9.9 for what's really going on and what was fixed.

Original write-up: `EmployeeContext`/`HRDataContext` (`DataService` key `EMPLOYEES`, seeded from `seedEmployees.ts`) uses IDs like `EMP-<timestamp>-<random>`; `employeeDatabaseService` (`localStorage` key `EMPLOYEE_DATABASE_RECORDS`) uses IDs like `EDB-SUP-SUR1`; `RoleContext.currentUser.employeeId` is always in the `EDB-...` space, so `useEmployee().employees.find(e => e.employeeId === currentUser.employeeId)` would "never match." **This assumed `EmployeeContext`'s `employees` array actually gets seeded from `seedEmployees.ts` in normal operation — it doesn't (see §9.9).**

---

## 8. Suggested next steps (not blockers, just backlog)

- ~~Resolve §7.1 (the two employee datasets)~~ — turned out to be a smaller, different problem than diagnosed; fixed, §9.9.
- ~~Add a dedicated `"Travel"` `Payable.type`~~ — done, §9.8.
- ~~Make `CITY_MANAGER_APPROVAL_THRESHOLD` a Super-Admin-configurable value~~ — done, §9.5.
- ~~Confirm `FieldCheckIn`'s "Field Day Complete" summary survives a hard refresh~~ — was actually broken; fixed, §9.6.
- ~~`seedAllData.ts:1586` Exit Management stray reference~~ — fixed, §9.7.
- ~~Reconcile `EmployeeRole` vs `Role` enum split (Sales Head/Sales Manager/Marketing Agency missing from `EmployeeRole`)~~ — fixed, §9.10.

---

## 9. What was fixed in the second pass (resolving §7.2, 7.4, 7.5, 7.6)

### 9.1 — Operations Manager's broken Field Check-In tab (§7.5)
`OperationsManagerApp.tsx` had two byte-for-byte duplicate `TabsTrigger value="field-checkin"` entries and two duplicate `TabsContent` blocks rendering `<FieldCheckIn />` with no import anywhere in the file. Investigated whether to fix the import or remove the tab: Operations Manager already has its own distinct, fully-wired field feature — `OMFieldMode` (imported at line 110, rendered via `currentScreen === "field"` at line ~1518, a full-screen visit-logging mode, unrelated to GPS check-in). Operations Manager is also not one of `FIELD_TRACKING_ROLES`. Concluded this was copy-paste cruft from another role's app file, not a missing feature — removed both duplicate tab entries entirely rather than wiring up an import for a tab that doesn't belong here.

### 9.2 — `TravelAdminSettings.tsx` employee source (§7.2)
Switched from `useEmployee()` (`EmployeeContext`, wrong ID space, was silently typed `any`) to `employeeDatabaseService.getAll()`, matching the `EDB-...` space that `TRAVEL_PERMISSIONS`/`TRAVEL_EXCEPTIONS` already use. Also dropped a now-dead `e.cityId === city` fallback (`EmployeeDatabaseRecord` has no `cityId` field — `tsc` caught this immediately once the array was properly typed, confirming the fix). Verified in-browser: the Permissions tab now shows real names/designations/pincodes instead of blank fields.

### 9.3 — Duplicated payable-creation bridge (§7.4)
Extracted the "approved → `createPayable()` → `markAddedToPayroll()`" sequence into `src/app/hooks/useTravelPayableBridge.ts` (`finalizeTravelApproval(trip, { isAdhoc? })`). Both `TravelHRView.handleApprove()` and `TravelAdminSettings.approveTrip()` now call this one function instead of duplicating the sequence.

### 9.4 — The Sales Manager/Sales Head gap was deeper than missing seed data (§7.6)
Investigating "add Sales Manager/Sales Head to seed data" surfaced a bigger, pre-existing problem: **`demoEmployees.ts` is not what actually runs.** `seedAllData()` (`src/app/utils/seedAllData.ts`) is called from `main.tsx:31` on every fresh browser load, before React mounts, and writes `EMPLOYEE_DATABASE_RECORDS` directly (behind a one-time `SEED_FLAG` guard). `employeeDatabaseService`'s fallback to `demoEmployees.ts` only ever triggers if that key is empty — which in practice it never is. So the actual, live seed data was `seedAllData.ts`'s, not `demoEmployees.ts`'s.

`seedAllData.ts` **did** already define real, loggable Sales Head/Sales Manager employees in its authoritative employee list (`EDB-SH-SUR1`/`EDB-SH-SUR2` = Priya Nair/Ravi Shah, Sales Head; `EDB-SMGR-SUR1/2/3` = Nayan Joshi/Kalpesh Rathod/Amit Trivedi, Sales Manager — all with real login mobiles, `9100000023`–`9100000027`). So the original conclusion ("no Sales Manager/Sales Head exist") was **wrong** — it was based on checking `demoEmployees.ts`, the inert fallback, instead of `seedAllData.ts`.

The real bug: `seedAllData.ts`'s own **demo GPS/travel data** (a separate section seeding `TRAVEL_PERMISSIONS` and `TRAVEL_TRIPS`/`field_sessions_v1` for the "3 live sessions" shown in `LiveLocationDashboard`) referenced a Sales Manager named **"Arvind Mehta"** at ID `EDB-SM-SUR1`, and a Sales Head named **"Pooja Sharma"** at ID `EDB-SH-SUR1`. Neither name matches that ID's real identity:
- `EDB-SM-SUR1` is actually **Nayan Desai, Store Manager** (confirmed correct and consistent everywhere in Inventory/Stock demo data — `STOCK_TRANSACTIONS` `requestedBy`/`approvedBy` fields, untouched).
- `EDB-SH-SUR1` is actually **Priya Nair, Sales Head** (a real employee — just the wrong denormalized name was stored on the permission/trip records).
- "Pooja Sharma" is a real person too, but she's `EDB-TSE-SUR1` (a TSE, correctly referenced everywhere else — `salesHeadService.ts`, `IncentiveTrackerScreen.tsx`).

So the pre-built "Arvind Mehta — 32.1km" and "Pooja Sharma — 8.7km" demo sessions you may have seen in `LiveLocationDashboard` were cosmetically labeled but **orphaned** — not backed by any loggable employee with that name. Logging into `EDB-SM-SUR1` (mobile `9100000022`) gets you Nayan Desai, Store Manager — not a Sales Manager, and not routed anywhere near the travel/field-tracker flow.

**Fix applied:** corrected the denormalized `employeeId`/`employeeName`/`reportingManagerId`/`reportingManagerName` fields across `seedAllData.ts`'s `TRAVEL_PERMISSIONS` array, `TRAVEL_TRIPS` array (4 demo trips), and `field_sessions_v1` array (3 demo sessions) to reference the real `EDB-SMGR-SUR1`/Nayan Joshi and `EDB-SH-SUR1`/Priya Nair identities instead. Also removed one entirely bogus `TRAVEL_PERMISSIONS` entry that enabled `EDB-SM-SUR1` (Nayan Desai/Store Manager) for Sales Manager travel claims — redundant since `EDB-SMGR-SUR1/2/3` already have their own correct entries. Also fixed two Supervisor demo trips (Harish Solanki, Bhavesh Modi) whose `reportingManagerId` pointed at the wrong Sales Manager instead of their real Operations Manager (`Neha Rana`/`Ravi Pandya`). Brought `demoEmployees.ts` (the fallback) in line with the same corrected identities for consistency, in case it's ever actually reached.

**Verified in-browser after the fix:** `LiveLocationDashboard`'s live session list now shows "Nayan Joshi" and "Priya Nair" (real, loggable identities) instead of the orphaned names.

### 9.5 — `CITY_MANAGER_APPROVAL_THRESHOLD` is now Super-Admin-configurable
Added `getCityManagerApprovalThreshold()`/`setCityManagerApprovalThreshold(value, setBy)` to `travelReimbursementService.ts`, backed by a new `TRAVEL_CITY_MANAGER_THRESHOLD` key (same one-record pattern as `TRAVEL_RATES`, falls back to the `CITY_MANAGER_APPROVAL_THRESHOLD` constant if unset). `hrApprove()` now reads the threshold dynamically instead of the hardcoded constant. Added a "City Manager Approval Threshold" card to `TravelAdminSettings`'s Rates tab (Super Admin only), matching the existing 2W/4W rate-editing pattern. **Verified in-browser:** changed the threshold to ₹3,000, confirmed it persists across a full page reload.

### 9.6 — `FieldCheckIn`'s "Field Day Complete" summary did not survive a hard refresh (confirmed real, now fixed)
This was flagged as "confirm whether..." in the first pass — turned out to be a genuine bug. `fieldTrackingService._rehydrate()` (called once on page load) only ever restored an **active** (not-yet-checked-out) session; if you'd already checked out today and hard-refreshed the page, `state.session` came back `null` and `FieldCheckIn.tsx` fell through to "Not Checked In" instead of "Field Day Complete" — even though the employee's day was already done and recorded. Fixed `_rehydrate()` to also restore today's most recently completed session when there's no active one. **Verified in-browser:** seeded a checked-out session for today, reloaded the page, confirmed "Field Day Complete" (with correct check-in/out times and distance) now renders instead of "Not Checked In".

### 9.7 — Exit Management's stray third identity for `EDB-SM-SUR1` (and a second one found alongside it)
While in `seedAllData.ts`, also fixed the Exit Management demo record flagged in the previous pass (`EXT-2026-010`, `employeeId:"EDB-SM-SUR1"`, `employeeName:"Rahul Desai"` — a third conflicting identity for that ID, whose real identity is Nayan Desai/Store Manager, see §9.4). Investigating it surfaced a second, previously-unflagged instance of the same pattern in the same block: `EXT-2026-009` used `employeeId:"EDB-TSE-SUR1"` with `employeeName:"Priya Sharma"` — but `EDB-TSE-SUR1`'s real identity is Pooja Sharma (correct everywhere else — `salesHeadService.ts`, `IncentiveTrackerScreen.tsx`). Both exit records represent employees who are *resigning* — using a real active employee's ID for a departing person is semantically wrong regardless of the name mismatch (it would imply Nayan Desai / Pooja Sharma actually resigned). Rather than force these two fictional "resigning employee" records to alias real active employees, gave them their own non-colliding synthetic IDs (`EDB-EXT-SUR009`, `EDB-EXT-SUR010`), keeping the same demo names. `ExitManagement.tsx`'s employee-lookup (`allEmployees.find(e => e.id === employeeId)`) degrades gracefully to its existing "no match" fallback for these two records, same as it already does for `form.employeeId` when nothing matches — not a regression.

### 9.8 — Dedicated `"Travel"` `Payable.type`
Added `"Travel"` to the `Payable["type"]` union in `FinanceContext.tsx`. `useTravelPayableBridge.ts` now creates travel payables with `type: "Travel"` instead of `"Salary"`. Added:
- A dedicated ledger-posting branch in `createPayable()`: `Dr 5150 "Travel Reimbursement Expense" / Cr 2150 "Travel Reimbursement Payable"` (previously travel claims posted to the same accounts as real salary — 5100/2100 — inflating those balances).
- A matching branch in `markAsPaid()`'s settlement entry, so the debit on payment (2150) matches the credit on accrual (2150) instead of generically debiting "Accounts Payable" (2000) — the pre-existing "Salary" settlement entry has this same account mismatch (credits 2100, debits 2000 on payment), but that's a separate pre-existing issue left untouched since fixing it wasn't in scope and risked altering existing Salary P&L numbers.
- `getTravelPayables(cityId?)` on `FinanceContext`, mirroring `getSalaryPayables()`. `SalaryPaymentScreen.tsx` now calls this instead of `getSalaryPayables().filter(p => p.travelTripId)`.
- `PayablesDashboard.tsx` (`/accounts/payables`) gained a "Travel" filter pill and a dedicated icon/badge color (teal), instead of falling into the generic Vendor-styled bucket.

**Why this was flagged as risky, and why it turned out to be safe:** `"Salary"`-typed payables feed labour-cost totals in `AnalyticsDashboardWithDrillDown.tsx`, `CityComparison.tsx`, `UnitEconomicsDashboard.tsx`, and `payrollFinanceService.ts` (all `payables.filter(p => p.type === "Salary")`). The concern was that splitting travel into its own type would silently change those totals. On reflection, that's actually the **correct** outcome, not a risk to route around: travel reimbursement is a business expense, not wages — it was only ever counted as "Salary" because that's the type `useTravelPayableBridge` happened to use before this fix, not because it's genuinely a labour cost. None of those four files needed code changes — they'll now correctly stop including travel reimbursements in labour-cost figures, with no null-checks or extra logic required. **This is an intentional, visible behavior change:** "labour cost" on those dashboards will now read slightly lower than before (by however much travel reimbursement was previously miscounted there). Worth a heads-up to whoever monitors those dashboards, but not a code risk.

**Verified:** typecheck shows no new errors beyond this codebase's existing (pre-existing, unrelated) `DataService`/`useCity` typing gaps; `vite build` succeeds; `/accounts/payables` renders the new "Travel" filter pill with no console errors; `/payroll/salary-payment` still loads cleanly. Not verified end-to-end with a populated Travel payable (would require walking the full manager → HR approval UI across multiple role logins) — the code path is a straightforward mirror of the already-proven `getSalaryPayables()`/Salary-branch pattern, so this is lower-risk than most of the rest of this document, but a developer picking this up should still walk one claim through to Approved and confirm it shows up correctly on both screens before considering it fully signed off.

### 9.9 — §7.1's employee-ID-space split: what's actually true, and what was fixed

Before touching this, I had a research pass done specifically on `PayrollContext`/`HRDataContext`'s dependency on the `Employee` shape (since a wrong move here risks breaking Payroll and login — the two highest-blast-radius systems in the app). That research surfaced something that changes the whole picture, which I then confirmed empirically in a real browser session (not just by reading code):

**`main.tsx:31` calls `seedAllData()` synchronously *before* `createRoot(...).render(...)`.** That function writes an EDB-ID-based employee roster directly into the exact same `localStorage` keys (`cleancar_CITY-SURAT_employees`, `cleancar_employees`, etc.) that `DataService.get("EMPLOYEES", cityId)` reads — i.e. the same keys `EmployeeContext`/`HRDataContext` read on mount. Because this always runs first, `EmployeeContext`'s own fallback seeding path (`seedEmployeesIfEmpty()`, which mints `EMP-<timestamp>-<random>` IDs from the separate `seedEmployees.ts` roster) never fires in normal operation — `DataService.count("EMPLOYEES")` is never `0` by the time it's checked.

**I confirmed this directly in the browser:** `localStorage.getItem("cleancar_CITY-SURAT_employees")` in a running session shows `employeeId: "EDB-SA-01"` etc. — the *same* IDs as `EMPLOYEE_DATABASE_RECORDS`, and matching `cc360_session.employeeId` exactly. So **in the live app, `EmployeeContext`'s employees and `RoleContext.currentUser.employeeId` already share the same ID space.** The original §7.1 write-up was accurate about the *code* (reading `seedEmployees.ts` in isolation genuinely does describe a divergent roster) but wrong about what actually executes, because it didn't account for `main.tsx`'s load order beating that fallback to the punch. (For what it's worth, the earlier §7.2 fix — switching `TravelAdminSettings.tsx` to `employeeDatabaseService.getAll()` — was still correct and worth keeping: the real bug there was a *field-name* mismatch, `emp.fullName`/`emp.designation`/`emp.id` vs `EmployeeContext.Employee`'s actual field names, not an ID-space mismatch.)

**What this means the real, narrower risk is:** `seedEmployeesIfEmpty()`'s divergent `EMP-...` fallback is dead code today, but it's a *latent trap* — if `EMPLOYEES` is ever cleared independently of `EMPLOYEE_DATABASE_RECORDS` (a partial data reset, a test harness that mounts `EmployeeProvider` without running `seedAllData()` first, or a future refactor of `main.tsx`'s init order), that fallback would silently reintroduce the split by minting a second, incompatible roster.

**Fixed:**
- `src/app/data/seedEmployees.ts`'s `seedEmployeesIfEmpty()` now derives its fallback data from `employeeDatabaseService.getAll()` (mapping each `EmployeeDatabaseRecord` to an `Employee`-shaped object, preserving `employeeId: record.id`) instead of the separate, divergent `SEED_EMPLOYEES` roster. `SEED_EMPLOYEES` is kept only as a last-resort fallback if `EMPLOYEE_DATABASE_RECORDS` is *also* empty (extremely unlikely — that would mean login itself has no seed data either).
- `EmployeeContext.tsx:141` and `HRDataContext.tsx:237`'s `addEmployee` closures now preserve a pre-supplied `employeeId` (`emp.employeeId || `EMP-${Date.now()}-...``) instead of always minting a fresh one — needed so the derived-from-`EmployeeDatabaseRecord` data actually keeps its `EDB-...` ID through the seeding call.
- **Bonus find while in `seedAllData.ts`:** its `EMPLOYEES_RAW` array (the one now confirmed to be the actual live seed source) had the entire "Sales Head & Sales Manager (Surat)" block of 5 employees (`EDB-SH-SUR1/2`, `EDB-SMGR-SUR1/2/3`) duplicated verbatim (once at the point they were originally added, again in an apparent copy-paste a few lines later). Removed the duplicate block. This was inflating the live employee count (42 → 37 after dedup) and would have caused these 5 employees to appear twice in any UI that lists/maps over `EmployeeContext.employees` (dropdowns, employee lists) — unrelated to anything else in this document, just discovered while reading the surrounding lines for this fix.

**Verified:**
- Typecheck/build clean (no new errors beyond pre-existing ones).
- Normal load: employee data unchanged, still `EDB-...`-keyed, count now correctly 37 (not 42) after the dedup fix.
- **The actual failure scenario, reproduced and confirmed fixed:** cleared `cleancar_employees`/`cleancar_CITY-SURAT_employees`/`cleancar_CITY-MUMBAI_employees` from `localStorage` while leaving `EMPLOYEE_DATABASE_RECORDS` intact (simulating the exact partial-reset scenario this fix targets), then reloaded. Before this fix, this would have triggered `seedEmployeesIfEmpty()`'s old fallback and reintroduced an `EMP-...`-keyed roster disconnected from login. After the fix: the fallback correctly re-derives all employees from `EMPLOYEE_DATABASE_RECORDS`, every `employeeId` is `EDB-...`-prefixed, zero console errors.

**Update — the `EmployeeRole`/`Role` split flagged above is now fixed too, see §9.10.**

### 9.10 — `EmployeeRole` vs `Role` enum split (was §9.9's last open item) — fixed

**Root cause confirmed, not just theorized:** `RoleContext.tsx`'s `roleToEmployeeRole: Record<Role, EmployeeRole>` map was already trying to assign `"Sales Head"` and `"Sales Manager"` as `EmployeeRole` values (mapping each to itself) — proof the two enums were always meant to line up, they just drifted. Running `npx tsc --noEmit | grep RoleContext.tsx` before any fix showed exactly 4 live errors:
```
RoleContext.tsx(68,3): error TS2322: Type '"Sales Head"' is not assignable to type 'EmployeeRole'.
RoleContext.tsx(69,3): error TS2322: Type '"Sales Manager"' is not assignable to type 'EmployeeRole'.
RoleContext.tsx(104,7): error TS2741: Property '"Marketing Agency"' is missing in type ... but required in type 'Record<Role, string>'.
RoleContext.tsx(125,7): error TS2741: Property '"Marketing Agency"' is missing in type ... but required in type 'Record<Role, string>'.
```

**Fixed:**
- `src/app/contexts/OrgContext.tsx` — widened the `EmployeeRole` union to add `"Sales Head" | "Sales Manager" | "Marketing Agency"`, and added the same 3 roles to `DEFAULT_ROLES` (so they show up in role-selection dropdowns, not just internally).
- `src/app/contexts/RoleContext.tsx` — added the missing `"Marketing Agency"` key to all 3 `Record<Role, ...>` object literals that the widened union now requires: `roleToEmployeeRole`, `DEFAULT_EMPLOYEE_IDS` (`"EMP-MKT-001"`), `DEFAULT_NAMES` (`"Marketing Agency"`).
- `src/app/contexts/HRDataContext.tsx` — `getManagers()` now includes `"Sales Head"` and `"Sales Manager"` in its role filter list. This is the actual functional bug the enum split caused: any "get all managers" query (approval routing, manager pickers) was silently dropping Sales Head/Sales Manager, even though 5 such employees exist in the live seed data.
- Confirmed `src/app/components/payroll/OrgContext.tsx` (a second file that also defines an `EmployeeRole` type) is dead, unimported duplicate code — `grep -rln` for importers found none. Left untouched; not in scope.

**Verified:**
- `npx tsc --noEmit | grep RoleContext.tsx` after the fix: zero results (was 4).
- Full-repo `tsc --noEmit` error count: 3027 before this fix → 3023 after. Diffed both error lists line-for-line (normalizing line/column numbers): the only 4 errors that disappeared are exactly the 4 above; zero new errors appeared anywhere else in the codebase — so widening the `EmployeeRole` union introduced no exhaustiveness-check regressions in any `switch`/mapping keyed off that type.
- `npx vite build` — production build still succeeds.
- Browser check: `EMPLOYEE_DATABASE_RECORDS` has 5 Sales Head/Sales Manager employees (`EDB-SH-SUR1/2`, `EDB-SMGR-SUR1/2/3`); confirmed they match `HRDataContext.getManagers()`'s updated role filter, zero console errors.

This closes out the last open item from §9.9 and from the original contradictions table (§7). No further known contradictions remain.
