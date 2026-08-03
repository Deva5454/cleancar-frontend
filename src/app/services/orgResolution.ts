/**
 * orgResolution.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Small, shared real-employee lookups used by more than one approval-chain
 * service (attendance regularization, comp-off leave, ...) so the same
 * resolution logic doesn't drift between copies.
 */

import { employeeDatabaseService } from "./employeeDatabaseService";

/**
 * Real resolution of a city's City Manager - by designation + city against
 * the real employee database, not the disconnected
 * organizationHierarchyService (its seed cityManagerId values, e.g.
 * "CM-SURAT-001", use a different ID scheme than real employees and would
 * never match any real logged-in user).
 *
 * Real fix: EmployeeDatabaseRecord.cityId is confirmed NOT populated by
 * the primary seed path (seedAllData.ts writes EMPLOYEES_RAW — the
 * un-mapped array — to EMPLOYEE_DATABASE_RECORDS, not the cityId-mapped
 * EMPLOYEES array) — every real record's city only reliably lives in its
 * workLocation field (e.g. "CITY-SURAT"), which happens to use the exact
 * same value format as cityId elsewhere. Checking both keeps this working
 * regardless of which field a given employee record actually has set.
 */
export function findCityManagerForCity(cityId: string): { id: string; name: string } | null {
  const emp = employeeDatabaseService.getAll().find(
    (e: any) => (e.cityId === cityId || e.workLocation === cityId) && e.designation === "City Manager" && e.status !== "Inactive"
  );
  return emp ? { id: emp.id, name: emp.fullName } : null;
}

/**
 * Real resolution of a city's TSM (Territory Sales Manager) - same
 * designation+city pattern as findCityManagerForCity. Used to route
 * Car Washer travel reimbursement claims to their TSM for first
 * approval (a policy-driven routing, not the washer's actual
 * operational reporting line — real seed data has washers reporting to
 * their Supervisor, not a TSM).
 */
export function findTSMForCity(cityId: string): { id: string; name: string } | null {
  const emp = employeeDatabaseService.getAll().find(
    (e: any) => (e.cityId === cityId || e.workLocation === cityId) && e.designation === "TSM" && e.status !== "Inactive"
  );
  return emp ? { id: emp.id, name: emp.fullName } : null;
}

/**
 * Real resolution of a city's Sales Head - same pattern. Used to route
 * Supervisor travel reimbursement claims to their Sales Head for first
 * approval (again a policy-driven routing, not the real operational
 * reporting line — Supervisors report to Operations Managers).
 */
export function findSalesHeadForCity(cityId: string): { id: string; name: string } | null {
  const emp = employeeDatabaseService.getAll().find(
    (e: any) => (e.cityId === cityId || e.workLocation === cityId) && e.designation === "Sales Head" && e.status !== "Inactive"
  );
  return emp ? { id: emp.id, name: emp.fullName } : null;
}
