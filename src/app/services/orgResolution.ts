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
