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
| `src/app/services/employeeDatabaseService.ts` | The **real** employee record source used for login, role resolution, and reporting-manager lookups. `localStorage` key `EMPLOYEE_DATABASE_RECORDS`, seeded from `src/app/utils/demoEmployees.ts` (`HISTORIC_EMPLOYEE_DB`). IDs look like `EDB-SUP-SUR1`. |
| `src/app/contexts/FinanceContext.tsx` | `Payable` CRUD + double-entry ledger posting. Travel claims become `Payable` records here (`type: "Salary"`, `travelTripId` cross-reference). |

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

### Seed data (know which one you're editing)
| File | Feeds | ID space |
|---|---|---|
| `src/app/utils/demoEmployees.ts` (`HISTORIC_EMPLOYEE_DB`) | `employeeDatabaseService` → `EMPLOYEE_DATABASE_RECORDS` | `EDB-...` |
| `src/app/data/seedEmployees.ts` (`SEED_EMPLOYEES`) | `EmployeeContext`/`HRDataContext` → `DataService` key `EMPLOYEES` | `EMP-<timestamp>-<random>` |

These are **two unrelated employee datasets** — see the critical contradiction in §7.1 before you add any new cross-references between field-tracker/travel code and HR/payroll code.

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

Full detail and file:line references for items 1-6 are in the git history on this branch (two commits: the 8-gap audit fix, and the field-tracker polish/responsiveness commit).

---

## 7. Contradictions / issues to resolve before merging

Ranked by how likely they are to bite you.

### 7.1 — Two non-overlapping employee datasets, different ID spaces (HIGH — architectural)
- `EmployeeContext`/`HRDataContext` (`DataService` key `EMPLOYEES`, seeded from `seedEmployees.ts`) uses IDs like `EMP-<timestamp>-<random>` and fields `employeeId`, `firstName`, `lastName`, `bankDetails`.
- `employeeDatabaseService` (`localStorage` key `EMPLOYEE_DATABASE_RECORDS`, seeded from `demoEmployees.ts`) uses IDs like `EDB-SUP-SUR1` and fields `id`, `fullName`, `designation`, `reportingManager`, `workLocation`, `pinCodes`.
- **`RoleContext.currentUser.employeeId` is always in the `EDB-...` space** (`RoleContext.tsx:219`, matched from `EMPLOYEE_DATABASE_RECORDS`). Any code that does `useEmployee().employees.find(e => e.employeeId === currentUser.employeeId)` will **never match** — this is exactly the bug this branch fixed for `reportingManagerId` (§6, item 1), and it's the same root cause behind item 4.
- **Action needed:** before merging further field/travel/HR work, decide whether these two datasets get unified (one source of truth) or a documented bridge/lookup table is introduced. Right now every new feature that needs "the employee" has to know which of the two ID spaces it's in, by inspection, per call site.

### 7.2 — `TravelAdminSettings.tsx` reads the wrong employee source (HIGH — live bug)
- It calls `useEmployee()` (→ `EmployeeContext`, the `EMP-...` dataset) but then accesses `emp.id`, `emp.fullName`, `emp.designation`, `emp.workLocation`, `emp.pinCodes` — fields that only exist on `EmployeeDatabaseRecord` (the `EDB-...` dataset), not on `EmployeeContext.Employee`.
- **Why `tsc` doesn't catch it:** `useEmployee()`'s fallback branches are cast `as any` (`EmployeeContext.tsx:294-305`), which collapses the whole function's return type to `any`. Confirmed via `tsc --noEmit`: every `.filter(e => ...)` callback in `TravelAdminSettings.tsx` reports `TS7006: Parameter 'e' implicitly has an 'any' type` — proof `employees` is untyped at the call site, which is why the mismatched property names compile without error.
- **Runtime effect:** the Permissions tab's city filter (`cityEmps`, line 42-44, filters on `e.workLocation === city`) can only ever match via the `cityId` fallback, never `workLocation` (always `undefined`); `emp.fullName`/`emp.designation`/`emp.id` are `undefined` everywhere they're used in this file (permission toggles, exception policy assignment, City Manager approvals list of employees).
- **This branch did not touch this file's employee source** — the City Manager approvals tab added in this branch reads trips (`travelReimbursementService.getPendingCityManagerApproval()`), not employees, so it isn't affected by this bug, but the pre-existing Permissions/Exceptions tabs are.
- **Action needed:** decide whether `TravelAdminSettings.tsx` should switch to `employeeDatabaseService.getAll()` (matching the ID space `TRAVEL_PERMISSIONS`/`TRAVEL_EXCEPTIONS` already use for `employeeId`), or whether `EmployeeContext.Employee` should gain the missing fields. Given `TRAVEL_PERMISSIONS.employeeId` values come from wherever `setPermission()` is called with — check that call site's ID space before choosing.

### 7.3 — `SalaryPaymentScreen` sources two tables from two different employee ID spaces (MEDIUM)
- Regular payroll rows: `PayrollContext.payrollRuns` matched against `EmployeeContext` employees (`EMP-...` space) — correct, both sides agree.
- Travel-linked payables (added this branch): `FinanceContext.getSalaryPayables()` filtered by `travelTripId`, bank details resolved via `employeeDatabaseService.getById()` (`EDB-...` space) — also correct, because `Payable.employeeId` for travel claims originates from `trip.employeeId` = `session.employeeId`, which is in the `EDB-...` space.
- This is **not a bug** — it's a deliberate accommodation of §7.1's split, done by matching each `Payable`'s `employeeId` against whichever dataset it actually came from. But it means the screen has two parallel employee lookups and a future refactor of §7.1 needs to update both call sites, not just one.

### 7.4 — Payable-creation bridge is duplicated (MEDIUM — maintainability)
- The exact three-step sequence — `createPayable({ type:"Salary", travelTripId, ... })` → `markAddedToPayroll()` → success toast — is implemented **twice**: once in `TravelHRView.handleApprove()` (for claims ≤ ₹2,000, or as the terminal step of the HR flow) and once in `TravelAdminSettings.approveTrip()` (for the City Manager gate, added this branch).
- No shared helper exists because `createPayable` comes from the `useFinance()` React hook, which can't be called from the non-React `travelReimbursementService` singleton.
- **Action needed:** if a third approval surface is ever added, this bridge will need a third copy unless someone extracts a shared hook (e.g. `useTravelPayableBridge()`) both components import.

### 7.5 — Operations Manager's "Field Check-In" tab does not compile (HIGH — will fail CI/build if that tab is ever hit)
- `src/app/components/om/OperationsManagerApp.tsx` lines 2108-2113 render `<FieldCheckIn />` **twice**, with **no import of `FieldCheckIn` anywhere in the file**. Confirmed via `tsc --noEmit`: `TS2304: Cannot find name 'FieldCheckIn'` at both lines.
- The corresponding tab trigger (`TabsTrigger value="field-checkin"`) is also duplicated (lines ~1750-1755).
- This means Operations Manager's app currently either (a) fails to build entirely if this file is part of the eagerly-checked build, or (b) is silently excluded from typecheck and would throw at runtime the moment that tab renders. Either way it's broken today.
- **Action needed:** either import `FieldCheckIn` properly (deduplicating the two identical `TabsContent`/`TabsTrigger` pairs down to one), or remove the tab if Operations Manager isn't meant to have field check-in.

### 7.6 — `FIELD_TRACKING_ROLES` seed data mismatch (MEDIUM — blocks manual QA)
- `fieldTrackingService.ts:144-148` defines `FIELD_TRACKING_ROLES = ["Sales Head", "Sales Manager", "Supervisor"]`.
- `demoEmployees.ts` (the seed data behind login) currently has **no employee with designation "Sales Head" or "Sales Manager"** — only `"Supervisor"` exists (e.g. `EDB-SUP-SUR1`, mobile `9100000009`).
- You cannot log in as a real Sales Manager or Sales Head today to manually test the field-tracker/travel-claim flow end-to-end; you can only test as Supervisor.
- Also note: `Supervisor` is claimed by the `/travel` dispatcher's manager-role list (`TravelManagerView`, §5) *before* the field-tracking auto-enable check ever runs (`TravelReimbursementModule.tsx:24-26` vs `31-32`) — so a Supervisor always lands on the manager approval queue at `/travel`, never the auto-enable branch. Not confirmed whether this is intentional (Supervisors approve Car Washer claims *and* submit their own field claims via the separate `FieldCheckIn` tab) — worth a 5-minute product-side confirmation before relying on it.
- **Action needed:** add Sales Manager/Sales Head seed employees to `demoEmployees.ts` if end-to-end QA of this module is required before merge.

---

## 8. Suggested next steps (not blockers, just backlog)

- Make `CITY_MANAGER_APPROVAL_THRESHOLD` a Super-Admin-configurable value alongside `TRAVEL_RATES`, rather than a hardcoded constant.
- Add a dedicated `"Travel"` `Payable.type` (currently travel claims are typed generically `"Salary"`, distinguished only by the presence of `travelTripId`) so Finance reporting can filter travel reimbursements without a nullability check.
- Confirm whether `FieldCheckIn`'s "Field Day Complete" summary view survives a hard page refresh after checkout (see §4) — the polling/notification logic added this branch assumes `state.session` stays populated, but `_rehydrate()` only restores *active* sessions.
- Resolve §7.1 (the two employee datasets) — this is the highest-leverage fix in the whole module; almost everything else here is a symptom of it.
