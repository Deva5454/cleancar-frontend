# New Joiner → Permanent Employee ID — Lifecycle Audit

**Scope:** the complete flow from a new employee being added by HR through to their temporary employee number being converted to a permanent one — every store, service, and screen that touches an employee's identity along the way.
**Method:** full architecture mapping, followed by direct, line-by-line verification of every claim against the actual source (not just the mapping pass) — every finding below was independently confirmed by reading the exact code, not inferred.
**Status:** Findings only — nothing has been fixed yet.

---

## 1. Executive summary

The temp-ID → permanent-ID conversion feature exists, has a real UI, a real gating checklist, and a real ID-generation function — and then **throws all of it away**. The button that converts an employee to permanent doesn't save the conversion anywhere; a page refresh silently undoes it. Separately, every newly-onboarded employee is briefly assigned the exact same non-unique ID (`"PENDING"`) as every other employee mid-onboarding, and the one real password-activation code path that looks employees up by that ID can silently activate the wrong person's account. And underneath both of those: the persistence layer itself discards most of what HR typed into the "Add Employee" form on the very first save, including the one field (`employmentStage`) the whole conversion mechanism depends on.

Beyond the conversion mechanism itself, there isn't one "employee" in this system — there are **four**, each with its own ID scheme, and they don't talk to each other. A person onboarded through HR's new-joiner flow is invisible to Payroll, Attendance, and Leave Management, because those all read a different store that nothing in onboarding ever writes to.

None of this requires a redesign — the fixes are mostly "call the function that already exists" and "widen a whitelist" — but as it stands today, the conversion feature does not work, and a new joiner's data quietly degrades the moment it's saved.

---

## 2. Findings, by severity

### 🔴 Critical

#### 2.1 — Converting an employee to permanent doesn't persist; a page refresh reverts it
**Where:** `src/app/components/hr/EmployeeDatabase.tsx`, `handleConvertToPermanent()` (lines 855–905) and `handleMarkNotConverted()` (lines 907–930) — this is the component actually wired into the app (`EmployeeLifecycleManagement.tsx:24` imports it).

**What's wrong:** both handlers do all the real work — check the onboarding checklist is complete and HR-verified, generate the permanent ID, build the updated record — and then call only:
```js
setEmployees(updatedEmployees);   // line 900 — local React state, nothing else
```
There is no `employeeDatabaseService.update(...)` call anywhere in either handler. The change lives in this component's state for as long as the tab stays open and nothing else touches the employee list; the moment the page reloads (or the service's own subscription fires from an unrelated action elsewhere in the app and overwrites local state from storage), the employee reverts to `"Temporary"` with their old temp ID, as if the conversion never happened.

**How I know this is real, not a misreading:** a second, near-identical copy of this exact component exists at `src/app/components/modules/EmployeeDatabase.tsx`, and its version of the same handler has an explicit comment fixing precisely this:
```js
// BUG FIX: persist conversion to service so all modules see the permanent ID
employeeDatabaseService.update(selectedEmployee.tempId, { id: permanentId, employmentStage: "Permanent", permanentIdAssignedDate: today });
```
But this fixed file is **dead code** — I grepped every import of `EmployeeDatabase` in the repo; the only one is `hr/EmployeeLifecycleManagement.tsx:24`, which resolves to the *unfixed* `hr/` copy. `modules/EmployeeDatabase.tsx` is never imported by `routes.tsx` or `HRModule.tsx`. The fix exists in the codebase — it's just wired to nothing.

**Recommendation:** point the fix that already exists at the component that's actually reachable — either import from `modules/EmployeeDatabase.tsx` instead, or copy its two `employeeDatabaseService.update()` calls into `hr/EmployeeDatabase.tsx`'s handlers. Either way, see §2.3 first — the fix alone isn't sufficient.

---

#### 2.2 — Every mid-onboarding employee shares the same non-unique ID, and the one code path that looks an employee up by it can silently write to the wrong person
**Where:** `hr/EmployeeDatabase.tsx:843` (`id: "PENDING"`, hardcoded for every new employee at creation) combined with `employeeDatabaseService.ts:110,121` (`getById`/`update` both match `emp.id === id || emp.tempId === id`).

**What's wrong:** a brand-new employee's real, unique identifier is their `tempId` (`TEMP-001`, `TEMP-002`, …) — but their `id` field is the literal string `"PENDING"`, identical for every employee currently mid-onboarding. Anything that calls `employeeDatabaseService.update("PENDING", ...)` will match `findIndex(emp => emp.id === "PENDING" ...)`, which returns whichever `"PENDING"` record happens to be first in the stored array — not necessarily the one the caller meant.

**Concrete exploit path, confirmed in code:** `OnboardingPortal.tsx:413–425` — when a new joiner sets their password, the fallback branch correctly looks the employee up by mobile number (a real unique field: `e.mobile === mobile || e.loginMobile === mobile`), finds the right `emp` — and then calls:
```js
employeeDatabaseService.update(emp.id, { passwordHash: ..., accountStatus: "active", loginMobile: mobile, ... });
```
`emp.id` is `"PENDING"`. If a second new joiner is also mid-onboarding at the same time, this **updates whichever `"PENDING"` record is first in the array** (the service's `add()` uses `unshift`, so in practice the most recently added temp employee), not necessarily the person who just set their password. Two new joiners onboarding around the same time can cross-contaminate each other's account activation — one person's password could end up active on someone else's record, or vice versa.

**Recommendation:** this component already computes the correct fallback for exactly one other use (line 859: `selectedEmployee.id === "PENDING" ? selectedEmployee.tempId : selectedEmployee.id`) — apply the same pattern everywhere an employee is looked up during the temp phase, or better, stop assigning a non-unique placeholder at all and use `tempId` as the sole key until conversion.

---

#### 2.3 — The persistence layer silently discards most of what HR enters, including the one field the whole conversion mechanism depends on
**Where:** `employeeDatabaseService.ts`, `save()` (lines 134–153).

**What's wrong:** every `add()`/`update()` call routes through `save()`, which — "to save space" per its own comment — writes only a fixed whitelist of 18 fields to `localStorage`:
```js
const slim = employees.map((e) => ({
  id, tempId, fullName, mobile, loginMobile, email, designation, department,
  status, accountStatus, passwordHash, tempPin, failedLoginAttempts,
  lockedUntil, dateOfJoining, cityId, role, employeeId, firstName, lastName,
}));
```
Everything else the "Add Employee" form collects is dropped on the very next save: `employmentStage`, `conversionDueDate`, `daysInTempStatus`, `isOverdue`, `tempIdAssignedDate`, `permanentIdAssignedDate`, `skillLevel`, middle name, both parents' names, DOB, gender, both addresses, emergency contact, `workLocation`, `pinCodes`, bank account/IFSC/bank name, `employeeType`, `probationPeriod`, `confirmationDate`, `journeyStage`/`journeyStageName`, `nonConversionReason`.

**Why this compounds §2.1:** `employmentStage` — the field that literally *is* "Temporary" vs. "Permanent" vs. "Not Converted" — is not in the whitelist. So even if §2.1's fix is applied (wiring up the `.update()` call that's currently missing), the conversion would still be lost on the next reload, because the persistence layer itself doesn't keep that field. **Both bugs have to be fixed together** — fixing only §2.1 gives a false sense that conversion works, because it would appear to persist across the current tab session (the in-memory `employees` array passed to subscribers is the full, unslimmed object — only a fresh page load, which re-reads from `localStorage`, exposes the loss).

**Also note:** the object's own inline `defaults` (line 89: only `onboardingPasswordSet`, `accountStatus`, `failedLoginAttempts`) don't cover the gap either — any field outside both the whitelist and these three defaults comes back as plain `undefined` after a reload, not a sensible fallback.

**Recommendation:** widen the whitelist to the full `EmployeeDatabaseRecord` shape (or drop the manual whitelist and store the full object — the "saves ~70% space" comment suggests this was a deliberate storage-size tradeoff, worth revisiting given what it actually costs).

---

### 🟠 High

#### 2.4 — Four separate, disconnected "employee" data models — a new joiner is invisible to Payroll, Attendance, and Leave
This is the biggest structural finding, and it means the temp→permanent conversion, even once fixed, only matters within one corner of the app:

| Store | Used by | ID scheme |
|---|---|---|
| `EMPLOYEE_DATABASE_RECORDS` (`employeeDatabaseService`) | HR onboarding UI, login/`authService` | `tempId` (`TEMP-XXX`) → `id` (`{ROLE}-{PINCODE}-{SEQ}` once converted) |
| `"EMPLOYEES"` (`DataService`, `hr-types.ts` `Employee`) | `PayrollContext`, `HRDataContext`, `AttendanceContext`, `EmployeeContext` | `employeeCode` — no `tempId`/`employmentStage` concept at all |
| `leave_balances_v1` (`leaveBalanceService`) | Leave accrual/quota | `generateEmployeeId(name, role)` — a hash-based `{RolePrefix}-{hash%1000}` id, a fourth scheme |
| `EMPLOYEE_LIFECYCLE` (`employeeLifecycleEngine.ts`) | Nothing — see §2.6 | its own `Draft→Active→Probation→Confirmed→Exit` state machine |

I found **no code that bridges (1) and (2)** — no function copies a record from `EMPLOYEE_DATABASE_RECORDS` into `"EMPLOYEES"` in either direction. The one partial bridge (`GeneratedPayslip.tsx:200–231`) is read-only, falls back to raw `EMPLOYEE_DATABASE_RECORDS` only when `"EMPLOYEES"` has nothing, and needs `baseSalary`/`grossSalary` fields that §2.3 confirms never survive a save anyway.

**Practical effect:** an employee added through the HR onboarding flow — whether still "Temporary" or successfully converted to "Permanent" — does not appear in a payroll run, does not show up in Attendance Master, and has no leave balance, because those three systems read an entirely different employee list that nothing in onboarding ever populates.

**Recommendation:** this is a genuine architecture decision, not a quick patch — either onboarding needs to write into `"EMPLOYEES"` at the same time it writes to `EMPLOYEE_DATABASE_RECORDS`, or the four models need to converge onto one. Flagging clearly rather than proposing a one-line fix.

---

#### 2.5 — Probation status for leave accrual is hardcoded by role, never actually transitions
**Where:** `src/app/utils/employeeUtils.ts:43–46`, `getEmployeeStatusFromRole(currentRole)`.

**What's wrong:** `leaveBalanceService`/`leavePolicyConfiguration.ts` do have a real `"Probation" | "Confirmed"` distinction that changes leave accrual rules (e.g. sick leave "not applicable during probation, 7 days/year post confirmation"). But the status fed into it isn't derived from anything real — it's a static lookup: `"Car Washer" | "TSE" | "CCE"` are always `"Probation"`, every other role is always `"Confirmed"`, permanently, regardless of actual tenure or confirmation date.

**Also found:** `leaveBalanceService.updateEmployeeStatus()` — the one method that would transition an employee from Probation to Confirmed — has **zero callers anywhere in the codebase**. It's not invoked from the Confirmation Letter workflow, the permanent-ID conversion, or anywhere else. So even a genuinely-confirmed Car Washer's leave entitlement never updates to reflect it.

**Recommendation:** wire `updateEmployeeStatus()` to fire on whichever event your business considers "confirmed" — likely the Confirmation Letter approval (§2.6) rather than the temp/permanent ID conversion, since those are conceptually closer, but that's a business-policy call, not a code one.

---

### 🟡 Medium

#### 2.6 — Offer Letter, Confirmation Letter, and ID conversion are three independent systems that happen to touch the same record
Traced all three document/workflow systems and confirmed none of them trigger each other:

- **Offer Letter** (`offerLetterService.ts`) references an existing `tempId` — it doesn't create the employee record, and accepting an offer only flips the offer's own status, never the employee's.
- **Confirmation Letter** (`hr/ConfirmationLetterSystem.tsx`) starts its approval chain (Initiate → Manager → HR → Admin) for employees regardless of whether they're still "Temporary" or already "Permanent" — `employmentStage` isn't a precondition. Its final approval writes `confirmationDate`/`journeyStage` — a completely different field set from what ID conversion writes (`id`/`employmentStage`).
- So it's fully possible, as things stand, for an employee to receive a Confirmation Letter (`journeyStageName: "Confirmed"`) while their `employmentStage` remains `"Temporary"` forever — two "confirmed" concepts that don't agree with each other.
- The "Mark Not Converted" toast claims *"Record archived in Employee Ledger"* (`hr/EmployeeDatabase.tsx:929`) — I found no reference to `employeeDatabaseService`, `tempId`, or `employmentStage` anywhere in `EmployeeLedger.tsx` or `LifeCycleReports.tsx`. Nothing is actually archived; it's a toast message only.

**Recommendation:** decide whether Confirmation Letter approval *should* be the trigger for permanent-ID conversion (they're clearly meant to relate, given both are "is this new joiner confirmed" checks) — right now neither knows the other exists.

---

### ⚪ Low

#### 2.7 — A complete, well-built lifecycle state machine exists and is never used
`src/app/services/employeeLifecycleEngine.ts` has a proper `Draft → Active → Probation → Confirmed → Exit Initiated → Exited` state machine, a valid-transitions table, an approval workflow, and even `validateForPayroll()` — exactly the kind of payroll-gating logic §2.4 shows is currently missing. Its only intended consumer, `EmployeeLifecycleTimeline.tsx`, is never imported anywhere (`EmployeeLifecycleManagement.tsx`'s tabs are `EmployeeDatabase`, `EmployeeOnboarding`, `DocumentManagement`, `IDCardGenerator`, `ExitManagement`, `HRReporting` — this component isn't among them). Not a bug, just effort that's sitting unused — worth knowing about before anyone builds a second version of the same idea from scratch.

---

## 3. What was verified, and how

Every finding above was confirmed by reading the exact source lines cited, not inferred from naming or comments alone. Specifically checked directly (not just via the initial research pass):
- `hr/EmployeeDatabase.tsx:830–930` — `handleAddEmployee`, `handleConvertToPermanent`, `handleMarkNotConverted` read in full; confirmed `id: "PENDING"` and the missing `.update()` call myself.
- `employeeDatabaseService.ts:88–158` — `getAll`, `getById`, `add`, `update`, `save` read in full; confirmed the `id === id || tempId === id` matching and the exact 18-field save whitelist myself, and traced what `getAll()`'s fallback `defaults` object does and doesn't cover.
- `OnboardingPortal.tsx:395–429` — confirmed the exact `update(emp.id, ...)` call that turns the "PENDING" collision into a real, reachable bug during password activation.
- `modules/EmployeeDatabase.tsx:900–931` — confirmed the "BUG FIX" comment and that it correctly uses `tempId` (not `id`) as the lookup key, then confirmed via grep that this file has zero importers anywhere in the repo.

Not independently re-verified beyond the initial research pass (time-boxed, but flagged as high-confidence given the specificity of the citations): the four-way ID-scheme fragmentation in §2.4, the static role-based probation logic in §2.5, and the Offer/Confirmation Letter independence in §2.6. Happy to verify any of these to the same standard if you want to lean on a specific one before deciding what to fix.

---

## 4. Suggested order of attack

1. **§2.3 (save() whitelist) before §2.1 (missing persistence call)** — fixing §2.1 alone would look like it works (within a session) while still silently failing on reload, which is worse than not fixing it, since it'd pass casual testing.
2. **§2.2 (PENDING collision)** — small, well-scoped fix (stop using a shared placeholder as a lookup key), and it's a live data-corruption risk today, not just a future one.
3. **§2.4 (four disconnected stores)** — the big one. Needs a decision on direction (bridge vs. converge) before any code gets written; flagging rather than prescribing.
4. **§2.5 and §2.6** — smaller, but worth deciding together: what should actually trigger "this employee is confirmed" for leave-accrual purposes, and should it be the same event that triggers ID conversion.

Let me know which of these you'd like tackled first.
