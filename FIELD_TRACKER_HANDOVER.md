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

Six were flagged in the first pass of this document. Five are now resolved (§9 has the fix details); one remains open by design — it's a large, cross-module architectural change that shouldn't be done as a drive-by fix.

| # | Issue | Status |
|---|---|---|
| 7.1 | Two non-overlapping employee ID spaces (`EDB-...` vs `EMP-...`) | **Open — see below.** Not touched; too large/risky to fix as part of this pass. |
| 7.2 | `TravelAdminSettings.tsx` read employee data from the wrong source (`useEmployee()` instead of `employeeDatabaseService`), so Permissions/Exceptions tabs got `undefined` fields | ✅ Resolved — §9.2 |
| 7.3 | `SalaryPaymentScreen` intentionally sources two tables from two employee ID spaces | Not a bug, no action needed (documented for awareness) |
| 7.4 | Payable-creation bridge duplicated in `TravelHRView` and `TravelAdminSettings` | ✅ Resolved — extracted to `useTravelPayableBridge()`, §9.3 |
| 7.5 | Operations Manager's "Field Check-In" tab referenced `FieldCheckIn` without importing it (`TS2304`, would crash at runtime) | ✅ Resolved — §9.1 |
| 7.6 | No loggable Sales Manager/Sales Head employee, blocking manual QA of those roles | ✅ Resolved — turned out to be more than a missing-seed-data gap, see §9.4 |

### 7.1 — Two non-overlapping employee datasets, different ID spaces (HIGH — architectural, still open)
- `EmployeeContext`/`HRDataContext` (`DataService` key `EMPLOYEES`, seeded from `seedEmployees.ts`) uses IDs like `EMP-<timestamp>-<random>` and fields `employeeId`, `firstName`, `lastName`, `bankDetails`.
- `employeeDatabaseService` (`localStorage` key `EMPLOYEE_DATABASE_RECORDS`, seeded from `seedAllData.ts`/`demoEmployees.ts`) uses IDs like `EDB-SUP-SUR1` and fields `id`, `fullName`, `designation`, `reportingManager`, `workLocation`, `pinCodes`.
- **`RoleContext.currentUser.employeeId` is always in the `EDB-...` space** (`RoleContext.tsx:219`, matched from `EMPLOYEE_DATABASE_RECORDS`). Any code that does `useEmployee().employees.find(e => e.employeeId === currentUser.employeeId)` will **never match** — this is exactly the bug this branch fixed for `reportingManagerId` (§6, item 1), and it's the same root cause behind §7.2 (now fixed) and §9.4's discovery.
- **Why this wasn't fixed this round:** doing so properly means either migrating login/`RoleContext` to the `EMP-...` space, migrating `HRDataContext`/`PayrollContext`/Payroll screens to the `EDB-...` space, or building and maintaining an explicit ID-mapping layer — any of which touches Payroll, HR, Onboarding, and Employee Database screens that are outside this module and untested in this pass. Attempting it as a side effect of a Field Tracker cleanup risked silently breaking those. It needs its own scoped project with its own test pass.
- **Action needed:** decide on a target architecture (unify vs. bridge) and schedule it as its own piece of work.

---

## 8. Suggested next steps (not blockers, just backlog)

- Resolve §7.1 (the two employee datasets) — this is the highest-leverage fix in the whole module; almost everything else found in this document was a symptom of it.
- Make `CITY_MANAGER_APPROVAL_THRESHOLD` a Super-Admin-configurable value alongside `TRAVEL_RATES`, rather than a hardcoded constant.
- Add a dedicated `"Travel"` `Payable.type` (currently travel claims are typed generically `"Salary"`, distinguished only by the presence of `travelTripId`) so Finance reporting can filter travel reimbursements without a nullability check.
- Confirm whether `FieldCheckIn`'s "Field Day Complete" summary view survives a hard page refresh after checkout (see §4) — the polling/notification logic added this branch assumes `state.session` stays populated, but `_rehydrate()` only restores *active* sessions.
- `seedAllData.ts:1586` (`EXT-2026-010`, an Exit Management demo record) references `employeeId:"EDB-SM-SUR1"` with `employeeName:"Rahul Desai"` — a **third** conflicting identity for that ID (real identity is Nayan Desai, Store Manager; see §9.4). Left untouched this round since it's Exit Management, not Field Tracker — same pattern, same fix approach as §9.4 if someone picks it up.

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

**Not fixed (out of scope):** `seedAllData.ts:1586`, an Exit Management demo record, has the same `EDB-SM-SUR1` ID pointing at a *third* name ("Rahul Desai"). Left alone — see §8.
