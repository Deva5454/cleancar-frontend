/**
 * EmployeeContext - Core Employee Data (READ-ONLY)
 * PHASE 4: Domain-specific context for employee identity
 *
 * ⚠️ SINGLE SOURCE OF TRUTH:
 * This context now reads from employeeDatabaseService (the same store used
 * by Add Employee, Onboarding, Offer/Appointment Letters, Exit Management,
 * and My Account self-service). It used to maintain its own, entirely
 * separate seed dataset under a different storage key ("EMPLOYEES"), with
 * no bridge to the real HR data — meaning any employee added through actual
 * onboarding never appeared here, and vice versa. See employeeDatabaseService
 * for the canonical record shape; this file just adapts it into the shape
 * the many existing consumers of useEmployee() already expect, so none of
 * them need to change.
 *
 * WRITE OPERATIONS:
 * ❌ DO NOT use EmployeeContext.addEmployee/updateEmployee/deleteEmployee
 * ✅ USE HRDataContext.addEmployee/updateEmployee/deleteEmployee instead —
 *    which now also writes through to employeeDatabaseService.
 *
 * Owns:
 * - Employee identity (ID, name, contact)
 * - Employment status
 * - Organizational assignment
 * - REFERENCES to other domains (NOT full objects)
 */

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";
import { employeeDatabaseService, type EmployeeDatabaseRecord } from "../services/employeeDatabaseService";
import { logger } from "../services/logger";
import { eventBus } from "../utils/eventBus";
import { EVENTS } from "../constants/events";
import type { EmployeeRole } from "./OrgContext";
import { useCity } from "./CityContext";

// ========== TYPES ==========

export type EmployeeStatus = "Active" | "On Leave" | "Inactive" | "Terminated";

/**
 * PHASE 4 Employee Model - Lean and Reference-based
 * Adapted live from EmployeeDatabaseRecord (see adaptRecord below).
 * Field names are kept stable for the ~40 existing components that consume
 * useEmployee() — id/fullName/reportingManagerId are additive fields on top
 * of the original shape, added to fix real lookup bugs (several components,
 * including ones built on top of this context, were comparing against
 * fields that never existed here, such as `.id` or `.reportingManager`).
 */
export interface Employee {
  // ===== CORE IDENTITY =====
  employeeId: string; // Primary key, used across all systems (= EmployeeDatabaseRecord.id/tempId)
  id?: string;          // Alias of employeeId — several existing components look up by `.id`
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string;

  // ===== EMPLOYMENT =====
  role: EmployeeRole;
  designation?: string;
  status: EmployeeStatus;
  joiningDate: string;
  employmentStage?: "Temporary" | "Permanent" | "Not Converted";

  // ===== ORGANIZATIONAL ASSIGNMENT =====
  department: string;
  city: string;
  unit?: string;

  // ===== HIERARCHY & GEOGRAPHY =====
  cityId?: string;
  clusterId?: string;
  assignedPincodes?: string[];

  // ===== REPORTING LINE =====
  reportingManager?: string;   // Display label, kept for backward compat — not a reliable key
  reportingManagerId?: string; // Resolved employeeId of the manager, when known — use this for lookups

  // ===== REFERENCES TO OTHER DOMAINS (IDs only, not full objects) =====
  salaryStructureId?: string;
  incentivePlanId?: string;

  // ===== PERMISSION OVERRIDES (MC-11) =====
  customPermissions?: import("../types/permissions").PermissionMatrix;
  permissionGrantedBy?: string;
  permissionGrantedAt?: string;
  permissionReason?: string;
  subRoleId?: string;
  permissionOverrideReason?: string;
  permissionOverrideExpiresAt?: string;

  // ===== LEGACY FIELDS (for backward compatibility during migration) =====
  baseSalary?: number;
  incentiveEligible?: boolean;

  // ===== BANK DETAILS =====
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };

  // ===== DOCUMENTS =====
  documents?: Array<{
    type: string;
    url: string;
    uploadedAt: string;
  }>;

  // ===== METADATA =====
  createdAt: string;
  updatedAt: string;
}

// Best-effort designation -> EmployeeRole mapping. EmployeeDatabaseRecord
// doesn't store a clean role enum, only a free-text designation, so this
// covers every designation value actually seen in seed/live data. Unmapped
// designations fall back to the lowest-privilege role rather than silently
// granting broader access.
const DESIGNATION_TO_ROLE: Record<string, EmployeeRole> = {
  "Car Washer": "Car Washer Full Time",
  "Tele Sales Executive": "TSE",
  "TSE": "TSE",
  "TSM": "TSM",
  "CCE": "CCE",
  "Supervisor": "Supervisor",
  "Operations Manager": "Operations Manager",
  "Sr Operations Manager": "Sr Operations Manager",
  "City Manager": "City Manager",
  "Cluster Manager": "Cluster Manager",
  "Store Manager": "Store Manager",
  "Procurement Manager": "Procurement Manager",
  "Accounts": "Accounts",
  "HR": "HR",
  "Admin": "Admin",
  "Super Admin": "Super Admin",
};

function resolveRole(designation: string): EmployeeRole {
  return DESIGNATION_TO_ROLE[designation] || "Car Washer Full Time";
}

function resolveStatus(status: EmployeeDatabaseRecord["status"]): EmployeeStatus {
  if (status === "Exited") return "Terminated";
  return status as EmployeeStatus;
}

/** Adapts a raw EmployeeDatabaseRecord (the real, single source of truth) into
 *  the Employee shape this context's existing consumers expect. */
function adaptRecord(record: EmployeeDatabaseRecord): Employee {
  const id = record.id && record.id !== "PENDING" && record.id !== "NOT-CONVERTED" ? record.id : record.tempId;
  return {
    employeeId: id,
    id,
    firstName: record.firstName,
    lastName: record.lastName,
    fullName: record.fullName,
    email: record.email,
    phone: record.mobile,
    role: resolveRole(record.designation),
    designation: record.designation,
    status: resolveStatus(record.status),
    joiningDate: record.dateOfJoining,
    employmentStage: record.employmentStage,
    department: record.department,
    city: record.workLocation,
    cityId: record.cityId,
    assignedPincodes: record.pinCodes,
    reportingManager: record.reportingManager,
    reportingManagerId: record.reportingManagerId,
    bankDetails: (record as any).bankAccountNumber ? {
      accountNumber: (record as any).bankAccountNumber || "",
      ifscCode: (record as any).bankIFSC || "",
      bankName: (record as any).bankName || "",
    } : undefined,
    createdAt: record.tempIdAssignedDate || new Date().toISOString(),
    updatedAt: record.confirmationDate || record.tempIdAssignedDate || new Date().toISOString(),
  };
}

// ========== CONTEXT TYPE ==========

interface EmployeeContextType {
  // Data (READ-ONLY)
  employees: Employee[];
  cityEmployees: Employee[];  // Auto-filtered to current city — use this in components

  // Queries
  getEmployeeById: (employeeId: string) => Employee | undefined;
  getEmployeesByRole: (role: EmployeeRole | EmployeeRole[]) => Employee[];
  getEmployeesByStatus: (status: EmployeeStatus) => Employee[];
  getEmployeesByCity: (city: string) => Employee[];
  getEmployeesByPincode: (pincode: string) => Employee[];
  getEmployeesByCluster: (clusterId: string) => Employee[];
  getActiveEmployees: () => Employee[];
  getDirectReports: (managerId: string) => Employee[];

  // Statistics
  getEmployeeCount: () => number;
  getEmployeeCountByRole: (role: EmployeeRole) => number;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

// ========== PROVIDER ==========

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(() =>
    employeeDatabaseService.getAll().map(adaptRecord)
  );

  const { city, cityInfo } = useCity();

  // Pre-filtered employees for the selected city — used by all components
  const cityEmployees = useMemo(() => {
    const cityName = cityInfo.displayName.toLowerCase();
    const cityId   = city;
    return employees.filter(emp =>
      emp.city?.toLowerCase() === cityName ||
      emp.cityId === cityId ||
      emp.city === cityId
    );
  }, [employees, city, cityInfo]);

  const loadEmployees = useCallback(() => {
    const data = employeeDatabaseService.getAll().map(adaptRecord);
    setEmployees(data);
    logger.debug("EmployeeContext reloaded from employeeDatabaseService", { count: data.length });
  }, []);

  // Stay in sync with the single source of truth whenever it changes —
  // whether from HRDataContext, onboarding, offer acceptance, exit, etc.
  useEffect(() => {
    const unsubscribe = employeeDatabaseService.subscribe(() => loadEmployees());
    return unsubscribe;
  }, [loadEmployees]);

  // Back-compat: some code still fires the legacy EMPLOYEES_UPDATED event
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(EVENTS.EMPLOYEES_UPDATED, () => loadEmployees());
    return () => unsubscribe();
  }, [loadEmployees]);

  // CROSS-TAB SYNC
  useEffect(() => {
    const handleStorageChange = () => {
      loadEmployees();
      logger.debug("EmployeeContext synced from other tab");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadEmployees]);

  // ========== QUERIES (READ-ONLY) ==========

  const getEmployeeById = useCallback((employeeId: string): Employee | undefined => {
    return employees.find((emp) => emp.employeeId === employeeId || emp.id === employeeId);
  }, [employees]);

  const getEmployeesByRole = useCallback((role: EmployeeRole | EmployeeRole[]): Employee[] => {
    const roles = Array.isArray(role) ? role : [role];
    return employees.filter((emp) => roles.includes(emp.role));
  }, [employees]);

  const getEmployeesByStatus = useCallback((status: EmployeeStatus): Employee[] => {
    return employees.filter((emp) => emp.status === status);
  }, [employees]);

  const getEmployeesByCity = useCallback((city: string): Employee[] => {
    return employees.filter((emp) => emp.city === city);
  }, [employees]);

  const getEmployeesByPincode = useCallback((pincode: string): Employee[] => {
    return employees.filter((emp) => emp.assignedPincodes?.includes(pincode));
  }, [employees]);

  const getEmployeesByCluster = useCallback((clusterId: string): Employee[] => {
    return employees.filter((emp) => emp.clusterId === clusterId);
  }, [employees]);

  const getActiveEmployees = useCallback((): Employee[] => {
    return employees.filter((emp) => emp.status === "Active");
  }, [employees]);

  // NEW: reliable manager -> direct reports lookup, using the resolved
  // reportingManagerId rather than fragile name-string matching. This is
  // what ManagerReviewView, ClaimManagerView, etc. should use instead of
  // filtering on `.reportingManager` (a display label) directly.
  const getDirectReports = useCallback((managerId: string): Employee[] => {
    return employees.filter((emp) => emp.reportingManagerId === managerId);
  }, [employees]);

  // ========== STATISTICS ==========

  const getEmployeeCount = useCallback((): number => employees.length, [employees]);

  const getEmployeeCountByRole = useCallback((role: EmployeeRole): number => {
    return employees.filter((emp) => emp.role === role).length;
  }, [employees]);

  // ========== CONTEXT VALUE (READ-ONLY) ==========

  const contextValue: EmployeeContextType = useMemo(() => ({
    employees,
    cityEmployees,
    getEmployeeById,
    getEmployeesByRole,
    getEmployeesByStatus,
    getEmployeesByCity,
    getEmployeesByPincode,
    getEmployeesByCluster,
    getActiveEmployees,
    getDirectReports,
    getEmployeeCount,
    getEmployeeCountByRole,
  }),
  // eslint-disable-line react-hooks/exhaustive-deps
  [employees, cityEmployees, getEmployeeById, getEmployeesByRole, getEmployeesByStatus, getEmployeesByCity, getEmployeesByPincode, getEmployeesByCluster, getActiveEmployees, getDirectReports, getEmployeeCount]);

  return <EmployeeContext.Provider value={contextValue}>{children}</EmployeeContext.Provider>;
}

// ========== HOOK ==========

export function useEmployee() {
  const context = useContext(EmployeeContext);

  if (!context) {
    // PREVIEW MODE FALLBACK: Detect if running in preview/standalone mode
    // Always return safe fallback in all environments
    {
      return {
        employees: [],
        cityEmployees: [],
        getEmployeeById: () => undefined,
        getEmployeesByRole: () => [],
        // Write methods intentionally removed — use HRDataContext instead
        getEmployeesByCity: () => [],
        getEmployeesByDepartment: () => [],
        getDirectReports: () => [],
      } as any;
    }

    console.warn("[useEmployee] Called outside EmployeeProvider — returning fallback"); return {} as any; // safe fallback
  }
  return context;
}
