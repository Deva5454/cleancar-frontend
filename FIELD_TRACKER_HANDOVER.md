# Field Tracker Module — Developer Handover

**Branch:** `claude/audit-report-review-lzffz3`
**Scope:** GPS field check-in/checkout, live location tracking, and the downstream travel-reimbursement approval → payroll → payment pipeline it feeds.
**Audience:** the engineer picking this up to continue development or merge this branch.
**Status:** ✅ All known issues resolved. No open contradictions or backlog items. See §8 for the full resolution log.

---

## 1. What this module does

An employee in a field role (Supervisor, Sales Manager, Sales Head) checks in with a selfie + GPS at the start of the day. Their location is tracked continuously (GPS breadcrumbs) until they check out (manually, automatically at 23:59, or forced if location access is revoked). On checkout, a travel reimbursement claim is **auto-created from the GPS distance travelled** — no manual entry, no odometer photos. That claim then flows through manager → HR → (conditionally) City Manager approval, gets attached to payroll, and is paid out by Accounts.

Two audiences, two screens:
- **Employee** — a check-in/checkout widget embedded in their own role app (`FieldCheckIn.tsx`).
- **Admin/Super Admin** — a live map + timeline dashboard to watch everyone in the field in real time (`LiveLocationDashboard.tsx`).

Everything is **client-side only** — no backend. All state lives in `localStorage`, wrapped by two thin service singletons (`fieldTrackingService`, `travelReimbursementService`) that components call directly (not via React Context/hooks for the data layer, only for role/session).

---

## 2. Architecture at a glance

### Core services (no React, plain TS singletons — safe to unit test in isolation)
| File | Responsibility |
|---|---|
| `src/app/services/fieldTrackingService.ts` | GPS session lifecycle: check-in, trail recording, checkout (manual/auto/forced), offline GPS queue, reinstatement requests. Owns `localStorage` keys `field_sessions_v1`, `field_active_session_id`, `field_watcher_active`, `field_offline_gps_queue`. |
| `src/app/services/travelReimbursementService.ts` | Travel claim CRUD + approval state machine (`TripStatus`), rates/exceptions/permissions, City Manager threshold, notifications. Owns `DataService` keys `TRAVEL_TRIPS`, `TRAVEL_RATES`, `TRAVEL_EXCEPTIONS`, `TRAVEL_PERMISSIONS`, `TRAVEL_PHOTOS`, `TRAVEL_NOTIFICATIONS`, `TRAVEL_CITY_MANAGER_THRESHOLD`. |
| `src/app/services/employeeDatabaseService.ts` | The **real** employee record source used for login, role resolution, and reporting-manager lookups. `localStorage` key `EMPLOYEE_DATABASE_RECORDS`. Populated by `seedAllData()` (see §2.1) on first load; `demoEmployees.ts` (`HISTORIC_EMPLOYEE_DB`) is only a cold-start fallback if that hasn't run. IDs look like `EDB-SUP-SUR1`. |
| `src/app/contexts/FinanceContext.tsx` | `Payable` CRUD + double-entry ledger posting. Travel claims become `Payable` records with a dedicated `type: "Travel"` (own ledger accounts, separate from `"Salary"` — see §8, `9.8`). |
| `src/app/hooks/useTravelPayableBridge.ts` | Shared `finalizeTravelApproval(trip, opts)` — the single "claim approved → create Payable → mark Added to Payroll" bridge, used by both `TravelHRView` and `TravelAdminSettings` so the sequence isn't duplicated. |

### UI — Employee side
| File | Responsibility |
|---|---|
| `src/app/components/field/FieldCheckIn.tsx` | Check-in/checkout widget (selfie capture, GPS permission handling, live trail, day summary, travel-claim status card with 30s polling + notifications). Embedded (not routed) inside role apps — see §6. |

### UI — Admin/Super Admin side
| File | Responsibility |
|---|---|
| `src/app/components/field/LiveLocationDashboard.tsx` | Route: `/field-tracker`. Two-panel (staff list + journey detail) dashboard: live GPS trail rendered as an SVG route map, transport-mode inference (walk/auto/BRTS/bike/car from speed), stop/halt detection, travel-claim summary. Responsive: collapses to single-column drill-down below `md`. |

### UI — Travel approval workflow
| File | Responsibility |
|---|---|
| `src/app/components/travel/TravelReimbursementModule.tsx` | Route: `/travel`. **Role dispatcher** — picks which of the 4 views below to render (see §6 table). |
| `src/app/components/travel/TravelEmployeeView.tsx` | Employee's own trip history (also embedded directly in `src/app/components/hr/MyAccountPage.tsx`, outside the dispatcher). |
| `src/app/components/travel/TravelManagerView.tsx` | Reporting-manager approval queue (`managerApprove()` / `reject()`). |
| `src/app/components/travel/TravelHRView.tsx` | HR review, "Pay immediately" (ad-hoc) option, bridges approval → `FinanceContext.createPayable()` + `markAddedToPayroll()`. |
| `src/app/components/travel/TravelAdminSettings.tsx` | Rates/Permissions/Exceptions (Super Admin), City Manager approvals tab + cross-city trip ledger tab. |

### UI — Payment
| File | Responsibility |
|---|---|
| `src/app/components/payroll/SalaryPaymentScreen.tsx` | Accounts screen. Shows two tables side by side: regular payroll (`EmployeeContext`/`EMP-...` space) and travel reimbursements (`getTravelPayables()`/`EDB-...` space) — see §7.3. This split is intentional, not a bug. |

### 2.1 Seed data (know which one you're editing)
| File | Feeds | ID space |
|---|---|---|
| `src/app/utils/seedAllData.ts` (`seedAllData()`) | **Authoritative — this is what actually runs.** Called from `main.tsx:31` on every fresh load, before React mounts. Writes `EMPLOYEE_DATABASE_RECORDS` directly (guarded by a `SEED_FLAG` so it only runs once per browser), and — critically — also seeds the `EMPLOYEES` `DataService` key that `EmployeeContext`/`HRDataContext` read (see §8, §7.1). Also seeds `TRAVEL_PERMISSIONS`, `TRAVEL_TRIPS`, `field_sessions_v1`, plus unrelated Inventory/Stock/Payroll demo data. | `EDB-...` |
| `src/app/utils/demoEmployees.ts` (`HISTORIC_EMPLOYEE_DB`) | `employeeDatabaseService`'s fallback — only used if `EMPLOYEE_DATABASE_RECORDS` is empty, i.e. `seedAllData()` never ran or threw before setting its flag. In normal usage this file is dead code, kept in sync with `seedAllData.ts` for safety. | `EDB-...` |
| `src/app/data/seedEmployees.ts` (`SEED_EMPLOYEES`) | `EmployeeContext`/`HRDataContext`'s fallback if `EMPLOYEE_DATABASE_RECORDS` is *also* empty. Now derives from `employeeDatabaseService.getAll()` when possible, falling back to its own built-in roster only as a last resort — see §8, §7.1. | `EDB-...` (derived) or `EMP-...` (last-resort fallback only) |

All employee data in the live app resolves to a single `EDB-...` ID space end to end — login, `RoleContext.currentUser.employeeId`, `EmployeeContext`/`HRDataContext`, and `employeeDatabaseService` all agree. This was investigated and hardened this round (§8, §7.1/§9.9) — treat `seedAllData.ts` as the one source of truth going forward.

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
  │    ├─ amount ≤ threshold (default ₹2,000, Super-Admin-configurable) → status "Approved" directly
  │    └─ amount >  threshold                                           → status "Pending City Manager"
  │  IF status became "Approved" here:
  │    action: useTravelPayableBridge().finalizeTravelApproval(trip)
  │              → FinanceContext.createPayable({ type:"Travel", travelTripId, ... })
  │              → travelReimbursementService.markAddedToPayroll() → status "Added to Payroll"
  ▼ (only if amount > threshold)
TravelAdminSettings — Approvals tab (City Manager, cityManagerMode, at /travel)
  │  reads:  TRAVEL_TRIPS where status === "Pending City Manager" && cityId matches
  │  action: cityManagerApprove() → status "Approved"
  │  action: useTravelPayableBridge().finalizeTravelApproval(trip) — same bridge as above, no duplication
  ▼
SalaryPaymentScreen (Accounts, at /finance)
  │  reads:  FinanceContext.getTravelPayables(cityId)
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
| `TRAVEL_CITY_MANAGER_THRESHOLD` | `TravelAdminSettings`'s Rates tab (Super Admin only), via `setCityManagerApprovalThreshold()` | `travelReimbursementService.hrApprove()`, via `getCityManagerApprovalThreshold()` | The ₹ amount above which a claim needs City Manager approval (default 2,000 if unset) |
| `TRAVEL_PHOTOS` | `travelReimbursementService.savePhoto()` (only used by the legacy manual-entry `startTrip`/`endTrip` flow, not the GPS auto-submit path) | `TravelHRView`'s photo comparison view | Base64 odometer photos — GPS-auto-submitted trips never populate this |
| `TRAVEL_NOTIFICATIONS` | `travelReimbursementService.pushNotification()`, called from `managerApprove()`/`hrApprove()`/`cityManagerApprove()`/`reject()` | `FieldCheckIn.tsx`'s 30s poll (`getNotificationsForEmployee()`, then `markNotificationRead()`) | Per-employee approval/rejection notifications, read/unread |
| `EMPLOYEE_DATABASE_RECORDS` | `seedAllData()` on first load (authoritative — see §2.1); `demoEmployees.ts` fallback only if this key is empty | `employeeDatabaseService.getAll()`/`.getById()` — used by `RoleContext` (login, `currentUser.employeeId`), `autoSubmitFromSession()` (reporting-manager lookup), `TravelAdminSettings` (Permissions/Exceptions employee list), `SalaryPaymentScreen` (bank details for travel payables) | All login-capable employees, `EDB-...` ID space |
| `FINANCE_PAYABLES` | `FinanceContext.createPayable()` (called by `useTravelPayableBridge().finalizeTravelApproval()`) / `.markAsPaid()` (status → "Paid") | `SalaryPaymentScreen` (`getTravelPayables()` for the travel table, `getSalaryPayables()` for the regular payroll table) | `Payable` records. Travel claims get `type: "Travel"`, their own ledger accounts (5150/2150), and a `travelTripId` cross-reference back to `TRAVEL_TRIPS` |
| `EMPLOYEES` (`DataService`) | `seedAllData()` (authoritative — see §2.1) / `seedEmployees.ts` (fallback only) via `EmployeeContext`/`HRDataContext` | `EmployeeContext`'s `useEmployee()` — used by `SalaryPaymentScreen`'s *regular payroll* table and general HR/Payroll screens | Same `EDB-...`-keyed employee roster as `EMPLOYEE_DATABASE_RECORDS` in normal operation — see §8, §7.1 |

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
`_rehydrate()` (`fieldTrackingService.ts`, called once on page load) restores **either** an active session (not yet checked out) **or**, if none exists, today's most recently completed session — so both the live check-in state and the "Field Day Complete" summary survive a hard refresh.

### `TripStatus` (travelReimbursementService.ts)
```
Draft → Pending Manager → Pending HR ─┬─(≤ threshold)──────────────→ Approved → Added to Payroll
                                       └─(> threshold)→ Pending City Manager → Approved → Added to Payroll
        (any stage) ──────────────────────────────────────────────────────────────────→ Rejected
```
The threshold defaults to ₹2,000 and is Super-Admin-configurable in `TravelAdminSettings`'s Rates tab (`TRAVEL_CITY_MANAGER_THRESHOLD`, §3.1).

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

| App | Renders? |
|---|---|
| `sm/SalesManagerApp.tsx` | ✅ "Field Day" tab |
| `sh/SalesHeadApp.tsx` | ✅ "Field Day" tab |
| `supervisor/SupervisorAppConnected.tsx` | ✅ "Field Day" tab, `/supervisor-app/field` |
| `om/OperationsManagerApp.tsx` | Not applicable — Operations Manager isn't a GPS field-tracking role; it has its own separate `OMFieldMode` visit-logging feature instead |

**`/field-tracker`** (`routes.tsx:596`) → `LiveLocationDashboard`, Super Admin only, top-level route (not nested under `/travel`).

---

## 6. Role/employee reference

Seeded employees currently enabled for GPS travel claims (`TRAVEL_PERMISSIONS`), for manual QA login:

| Employee ID | Name | Designation | Vehicle |
|---|---|---|---|
| `EDB-SH-SUR1` | Priya Nair | Sales Head | 4W |
| `EDB-SH-SUR2` | Ravi Shah | Sales Head | 4W |
| `EDB-SMGR-SUR1` | Nayan Joshi | Sales Manager | 2W |
| `EDB-SMGR-SUR2` | Kalpesh Rathod | Sales Manager | 2W |
| `EDB-SMGR-SUR3` | Amit Trivedi | Sales Manager | 2W |
| `EDB-SUP-SUR1` | Harish Solanki | Supervisor | 2W |
| `EDB-SUP-SUR2` | Bhavesh Modi | Supervisor | 2W |

---

## 7. Known pre-existing issues — out of scope, not caused by this branch

Flagging these so they aren't mistaken for regressions introduced by the field-tracker work:

- **Console warning on every page load:** `"Payroll sync errors: Invalid employeeId for payroll: EDB-..."` — some part of `PayrollContext`/`payrollFinanceService` validates employee IDs against a format that doesn't accept the `EDB-...` space. Reproducible on a plain root-page load with no navigation; unrelated to field-tracker or travel code.
- **React warning on every page load:** `"Maximum update depth exceeded"` originating around `ApprovalProvider`/`FinanceProvider`/`PayrollProvider` in the context tree. Also reproducible on a plain root-page load; not touched as part of this branch.
- **Ledger account mismatch on `"Salary"`-typed payables:** `FinanceContext.markAsPaid()`'s settlement entry for `"Salary"` payables credits account 2100 on accrual but debits generic "Accounts Payable" (2000) on payment, instead of the matching 2100. This was noticed while adding the dedicated `"Travel"` type (which does **not** have this mismatch — it correctly uses 2150 on both sides), but fixing the pre-existing `"Salary"` mismatch was out of scope (risks changing existing Salary P&L numbers) and was left untouched.

---

## 8. Resolution log

Every contradiction and backlog item identified across two audit passes and a final sign-off check is resolved. Summary, most recent first:

| # | Issue | Resolution |
|---|---|---|
| 8.1 | Supervisors were enabled for GPS travel claims in seed data but had no `FieldCheckIn` UI anywhere — no way to actually check in | Added a "Field Day" tab to `SupervisorAppConnected.tsx` (same pattern as Sales Manager/Sales Head) and a `/supervisor-app/field` route. Found during final sign-off — the gap was documented in this doc's file map but never carried into the issues list in earlier passes. |
| 8.2 | `EmployeeRole` (used by `EmployeeContext`/`HRDataContext`) didn't include `"Sales Head"`, `"Sales Manager"`, or `"Marketing Agency"`, even though `RoleContext.tsx` already assumed they were valid — silently dropped Sales Head/Sales Manager from `HRDataContext.getManagers()` and any other manager-role query | Widened `EmployeeRole` (`OrgContext.tsx`) to include all three; filled in the missing `"Marketing Agency"` entries in `RoleContext.tsx`'s three `Record<Role,...>` lookup tables; fixed `getManagers()`. Verified via a full `tsc` error-count diff (3027→3023, only the 4 targeted errors disappeared, zero new ones). |
| 8.3 | Two disjoint employee ID spaces (`EDB-...` vs `EMP-...`) suspected between `EmployeeContext`/`HRDataContext` and `employeeDatabaseService` | Investigated and confirmed **not an active bug** — `seedAllData()` runs before React mounts and populates both sides with the same `EDB-...` IDs, so they already agree in the live app. The real, narrower risk was a *dormant* fallback (`seedEmployeesIfEmpty()`) that would mint a second, incompatible `EMP-...` roster if `EMPLOYEES` were ever cleared independently of `EMPLOYEE_DATABASE_RECORDS`. Fixed by making that fallback derive from `employeeDatabaseService.getAll()` instead of its own divergent roster. Also found and fixed a genuine duplicate-entries bug in `seedAllData.ts` (5 employees listed twice, inflating the employee count 42→37 after dedup) while in the area. |
| 8.4 | `Payable.type` had no dedicated `"Travel"` value — travel reimbursements posted to the same ledger accounts as real salary, inflating labour-cost totals on 4 analytics dashboards | Added `"Travel"` type with its own ledger accounts (5150/2150, both accrual and settlement sides), `getTravelPayables()` on `FinanceContext`, and a dedicated filter/icon on `PayablesDashboard`. Intentional, visible side effect: labour-cost dashboards now correctly exclude travel reimbursement — flagged for whoever monitors those numbers. |
| 8.5 | `City Manager` approval threshold (₹2,000) was a hardcoded constant | Made it Super-Admin-configurable via a new `TRAVEL_CITY_MANAGER_THRESHOLD` key and a Rates-tab card in `TravelAdminSettings`, same pattern as the existing 2W/4W rates. |
| 8.6 | `FieldCheckIn`'s "Field Day Complete" summary reverted to "Not Checked In" after a hard refresh, once already checked out for the day | `fieldTrackingService._rehydrate()` only restored an *active* session; now also restores today's most recently completed one when there's no active session. |
| 8.7 | Demo/seed data cross-referenced the wrong identities: two orphaned Sales Manager/Sales Head names in `TRAVEL_PERMISSIONS`/`TRAVEL_TRIPS`/`field_sessions_v1`, two Supervisor trips pointed at the wrong reporting manager, and two Exit Management records aliased real active employees under wrong names | Corrected all denormalized `employeeId`/`employeeName`/`reportingManagerId` fields in `seedAllData.ts` to reference real, loggable identities; gave the two Exit Management records synthetic non-colliding IDs instead of aliasing real employees. |
| 8.8 | `TravelAdminSettings.tsx` read employee data from the wrong source (`useEmployee()`/`EmployeeContext`, wrong field names), leaving Permissions/Exceptions tabs blank | Switched to `employeeDatabaseService.getAll()`, matching the ID space `TRAVEL_PERMISSIONS`/`TRAVEL_EXCEPTIONS` already use. |
| 8.9 | Payable-creation logic ("approved → create Payable → mark Added to Payroll") was duplicated between `TravelHRView` and `TravelAdminSettings` | Extracted into a single shared `useTravelPayableBridge().finalizeTravelApproval()`. |
| 8.10 | Operations Manager's app had a "Field Check-In" tab referencing `FieldCheckIn` without importing it — a `TS2304` that would crash at runtime | Confirmed this was leftover copy-paste cruft (Operations Manager has its own separate `OMFieldMode` feature and isn't a GPS field-tracking role) and removed the duplicate/broken tab entirely rather than wiring up an unwanted import. |
| 8.11 | `autoSubmitFromSession()` left `reportingManagerId: ""` (dead-code stub) — claims silently never reached any manager's approval queue | Now resolves the reporting manager via `employeeDatabaseService` + name match. |
| 8.12 | `SalaryPaymentScreen` showed hardcoded fake bank details (`XXXX1234`) and had no visibility into travel-linked payables | Now reads real `Employee.bankDetails`; travel payables show in their own section with a working "mark as paid" flow. |
| 8.13 | `LiveLocationDashboard`'s two-panel layout was fixed-width at every viewport, unusable on phone screens | Collapses to a single-column drill-down (list → detail, with a back button) below the `md` breakpoint. Also given a PagarBook-style visual pass (icon-badge headers, accented stat tiles, avatar status dots) across `LiveLocationDashboard` and `FieldCheckIn`. |

Every item above traces back to a specific commit on this branch; `git log` on the branch has full file:line diffs if you need the exact change.

---

## 9. If you're extending this module

A few things worth knowing before you build on top of this:

- **The two service singletons are the only source of truth for their state.** Don't read/write `TRAVEL_TRIPS`, `field_sessions_v1`, etc. directly from a component — go through `travelReimbursementService`/`fieldTrackingService` so approval-chain side effects (notifications, ledger posting) stay consistent.
- **`useTravelPayableBridge().finalizeTravelApproval()` is the only place a travel claim should become a `Payable`.** If you add a new approval path (e.g. a bulk-approve action), call this instead of duplicating the create-Payable-then-mark-Added-to-Payroll sequence.
- **New employee roles need to be added in three places** to avoid the kind of split that caused §8.2: the `Role` union (`lib/roleConfig.ts`), the `EmployeeRole` union (`contexts/OrgContext.tsx`), and `RoleContext.tsx`'s three `Record<Role,...>` lookup tables (`roleToEmployeeRole`, `DEFAULT_EMPLOYEE_IDS`, `DEFAULT_NAMES`) — `tsc` will catch a missing entry in the latter (`TS2741`), but not a mismatch between the two role unions unless something tries to cross-assign them.
- **If you add a new field-tracking-enabled role**, remember it needs a `FieldCheckIn` tab wired into that role's own app shell (see §5's embedding table) — being listed in `TRAVEL_PERMISSIONS` seed data alone doesn't give the employee a way to actually check in (this is exactly what §8.1 was).
