/**
 * Employee Master - Unified Employee Structure
 *
 * Single source of truth for employee data across HR, Payroll, and Attendance.
 *
 * ⚠️ This is a live adapter over employeeDatabaseService (the real single
 * source of truth), not a separate store. It used to keep its own
 * "EMPLOYEE_MASTER" snapshot, populated ONCE per browser by hrDataSync on
 * first app load (gated by a "HR_MASTER_INITIALIZED" flag) and never
 * refreshed again — so exitWorkflowService, PayrollAutomationEngine,
 * DataExportService, and EmployeeService (all real, live consumers) were
 * reading an increasingly stale snapshot that never reflected new hires,
 * onboarding changes, or exits after that first sync. Reading/writing
 * through employeeDatabaseService directly means every consumer here now
 * always sees current data, with no separate sync step required.
 */

import { logger } from "./logger";
import { employeeDatabaseService, type EmployeeDatabaseRecord } from "./employeeDatabaseService";
import type { EmployeeRole } from "../contexts/OrgContext";

// ========== TYPES ==========

export type EmployeeStatus = "Draft" | "Active" | "Exit";

/**
 * Unified Employee Master Record
 * All employee references across modules should use employeeId to link to this master
 */
export interface EmployeeMaster {
  // Core Identity
  employeeId: string;           // Primary key - used across all systems
  name: string;                 // Full name
  phone: string;                // Contact number

  // Organizational
  roleId: string;               // Designation/role text (see note on EmployeeDatabaseRecord.designation)
  cityId: string;               // References city in city master

  // Employment Status
  status: EmployeeStatus;       // Draft | Active | Exit
  joiningDate: string;          // YYYY-MM-DD
  exitDate?: string;            // YYYY-MM-DD (only for Exit status)

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Legacy employee structure for backward compatibility
 * Maps to EmployeeMaster via adapter
 */
export interface LegacyEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  status: "Active" | "On Leave" | "Inactive" | "Terminated";
  joiningDate: string;
  department: string;
  city: string;
  cityId?: string;
  clusterId?: string;
}

// ========== STATUS MAPPING ==========

function masterStatusToDbStatus(status: EmployeeStatus): EmployeeDatabaseRecord["status"] {
  switch (status) {
    case "Draft": return "Inactive";
    case "Active": return "Active";
    case "Exit": return "Exited";
  }
}

function dbStatusToMasterStatus(status: EmployeeDatabaseRecord["status"]): EmployeeStatus {
  switch (status) {
    case "Active": return "Active";
    case "On Leave": return "Active";
    case "Inactive": return "Draft";
    case "Exited": return "Exit";
    default: return "Draft";
  }
}

function recordToMaster(record: EmployeeDatabaseRecord): EmployeeMaster {
  const id = record.id && record.id !== "PENDING" && record.id !== "NOT-CONVERTED" ? record.id : record.tempId;
  return {
    employeeId: id,
    name: record.fullName,
    phone: record.mobile,
    roleId: record.designation,
    cityId: record.cityId || "",
    status: dbStatusToMasterStatus(record.status),
    joiningDate: record.dateOfJoining,
    exitDate: record.status === "Exited" ? record.confirmationDate : undefined,
    createdAt: record.tempIdAssignedDate || new Date().toISOString(),
    updatedAt: record.confirmationDate || record.tempIdAssignedDate || new Date().toISOString(),
  };
}

// ========== SERVICE ==========

class EmployeeMasterService {
  /**
   * Get all employee master records
   */
  getAll(): EmployeeMaster[] {
    return employeeDatabaseService.getAll().map(recordToMaster);
  }

  /**
   * Get employee by ID
   */
  getById(employeeId: string): EmployeeMaster | null {
    const record = employeeDatabaseService.getById(employeeId);
    return record ? recordToMaster(record) : null;
  }

  /**
   * Get employees by status
   */
  getByStatus(status: EmployeeStatus): EmployeeMaster[] {
    return this.getAll().filter(emp => emp.status === status);
  }

  /**
   * Get employees by city
   */
  getByCity(cityId: string): EmployeeMaster[] {
    return this.getAll().filter(emp => emp.cityId === cityId);
  }

  /**
   * Get employees by role
   */
  getByRole(roleId: string): EmployeeMaster[] {
    return this.getAll().filter(emp => emp.roleId === roleId);
  }

  /**
   * Create new employee master record — writes through to
   * employeeDatabaseService, the real source of truth.
   */
  create(data: Omit<EmployeeMaster, "employeeId" | "createdAt" | "updatedAt">): EmployeeMaster {
    const now = new Date().toISOString();
    const tempId = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const [firstName, ...rest] = data.name.split(" ");
    const record: EmployeeDatabaseRecord = {
      id: "PENDING",
      tempId,
      tempIdAssignedDate: now,
      conversionDueDate: now,
      daysInTempStatus: 0,
      isOverdue: false,
      employmentStage: "Temporary",
      skillLevel: "Skilled",
      firstName: firstName || data.name,
      lastName: rest.join(" "),
      fullName: data.name,
      fatherFirstName: "", fatherLastName: "", fatherName: "",
      dob: "", gender: "",
      mobile: data.phone,
      email: "",
      permanentAddress: "", currentAddress: "", emergencyContact: "",
      designation: data.roleId,
      department: "",
      reportingManager: "",
      workLocation: "",
      pinCodes: [],
      employeeType: "Full Time",
      dateOfJoining: data.joiningDate,
      probationPeriod: "3 months",
      status: masterStatusToDbStatus(data.status),
      onboardingPasswordSet: false,
      accountStatus: "pending_onboarding",
      failedLoginAttempts: 0,
      cityId: data.cityId,
      role: data.roleId,
      employeeId: tempId,
    };
    employeeDatabaseService.add(record);
    logger.log("EmployeeMaster: Created employee", { employeeId: tempId });
    return recordToMaster(record);
  }

  /**
   * Update employee master record — writes through to
   * employeeDatabaseService, the real source of truth.
   */
  update(employeeId: string, updates: Partial<Omit<EmployeeMaster, "employeeId" | "createdAt">>): EmployeeMaster | null {
    const existing = employeeDatabaseService.getById(employeeId);
    if (!existing) {
      logger.error("EmployeeMaster: Employee not found", { employeeId });
      return null;
    }

    const recordUpdates: Partial<EmployeeDatabaseRecord> = {};
    if (updates.name !== undefined) {
      recordUpdates.fullName = updates.name;
      const [firstName, ...rest] = updates.name.split(" ");
      recordUpdates.firstName = firstName || updates.name;
      recordUpdates.lastName = rest.join(" ");
    }
    if (updates.phone !== undefined) recordUpdates.mobile = updates.phone;
    if (updates.roleId !== undefined) { recordUpdates.designation = updates.roleId; recordUpdates.role = updates.roleId; }
    if (updates.cityId !== undefined) recordUpdates.cityId = updates.cityId;
    if (updates.status !== undefined) recordUpdates.status = masterStatusToDbStatus(updates.status);
    if (updates.joiningDate !== undefined) recordUpdates.dateOfJoining = updates.joiningDate;
    if (updates.exitDate !== undefined) recordUpdates.confirmationDate = updates.exitDate;

    employeeDatabaseService.update(employeeId, recordUpdates);
    logger.log("EmployeeMaster: Updated employee", { employeeId });

    const updated = employeeDatabaseService.getById(employeeId);
    return updated ? recordToMaster(updated) : null;
  }

  /**
   * Mark employee as exited
   */
  markAsExit(employeeId: string, exitDate: string): EmployeeMaster | null {
    return this.update(employeeId, {
      status: "Exit",
      exitDate,
    });
  }

  /**
   * Activate employee (from Draft to Active)
   */
  activate(employeeId: string): EmployeeMaster | null {
    return this.update(employeeId, {
      status: "Active",
    });
  }

  /**
   * Delete employee master record (soft delete by marking as Exit)
   */
  delete(employeeId: string): void {
    this.markAsExit(employeeId, new Date().toISOString().split('T')[0]);
  }

  /**
   * Count employees by status
   */
  getStatusCounts(): Record<EmployeeStatus, number> {
    const employees = this.getAll();
    return {
      Draft: employees.filter(e => e.status === "Draft").length,
      Active: employees.filter(e => e.status === "Active").length,
      Exit: employees.filter(e => e.status === "Exit").length,
    };
  }
}

// ========== ADAPTER LAYER ==========

/**
 * Adapter to convert legacy employee format to EmployeeMaster.
 * Kept for backward compatibility with hrDataSync.ts and any other code
 * still constructing LegacyEmployee-shaped objects — no longer load-bearing
 * for the master service itself, which now reads/writes employeeDatabaseService
 * directly, but harmless to keep for existing callers.
 */
export class EmployeeAdapter {
  /**
   * Convert legacy employee to EmployeeMaster
   */
  static toMaster(legacy: LegacyEmployee, roleId: string = "ROLE-DEFAULT"): EmployeeMaster {
    // Map legacy status to new status
    const statusMap: Record<string, EmployeeStatus> = {
      "Active": "Active",
      "On Leave": "Active",
      "Inactive": "Draft",
      "Terminated": "Exit",
    };

    return {
      employeeId: legacy.employeeId,
      name: `${legacy.firstName} ${legacy.lastName}`.trim(),
      phone: legacy.phone,
      roleId: roleId,
      cityId: legacy.cityId || legacy.city,
      status: statusMap[legacy.status] || "Draft",
      joiningDate: legacy.joiningDate,
      exitDate: legacy.status === "Terminated" ? new Date().toISOString().split('T')[0] : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Convert EmployeeMaster to legacy employee format
   */
  static toLegacy(master: EmployeeMaster, additionalData?: Partial<LegacyEmployee>): LegacyEmployee {
    // Split name into first and last
    const nameParts = master.name.split(' ');
    const firstName = nameParts[0] || master.name;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Map new status to legacy status
    const statusMap: Record<EmployeeStatus, LegacyEmployee['status']> = {
      "Draft": "Inactive",
      "Active": "Active",
      "Exit": "Terminated",
    };

    return {
      employeeId: master.employeeId,
      firstName,
      lastName,
      email: additionalData?.email || "",
      phone: master.phone,
      role: additionalData?.role || "Car Washer",
      status: statusMap[master.status],
      joiningDate: master.joiningDate,
      department: additionalData?.department || "Operations",
      city: additionalData?.city || master.cityId,
      cityId: master.cityId,
      clusterId: additionalData?.clusterId,
    };
  }

  /**
   * Batch convert legacy employees to EmployeeMaster
   */
  static batchToMaster(legacyEmployees: LegacyEmployee[]): EmployeeMaster[] {
    return legacyEmployees.map(emp => this.toMaster(emp));
  }

  /**
   * Batch convert EmployeeMaster to legacy employees
   */
  static batchToLegacy(masters: EmployeeMaster[]): LegacyEmployee[] {
    return masters.map(emp => this.toLegacy(emp));
  }
}

// ========== EXPORT ==========

export const employeeMasterService = new EmployeeMasterService();
