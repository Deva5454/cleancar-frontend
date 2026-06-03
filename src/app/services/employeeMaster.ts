/**
 * Employee Master - Unified Employee Structure
 *
 * Single source of truth for employee data across HR, Payroll, and Attendance
 * Replaces scattered employee definitions with a unified structure
 */

import { DataService } from "./DataService";
import { logger } from "./logger";
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
  roleId: string;               // References role in role master
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

// ========== SERVICE ==========

class EmployeeMasterService {
  private readonly STORAGE_KEY = "EMPLOYEE_MASTER";

  /**
   * Get all employee master records
   */
  getAll(): EmployeeMaster[] {
    return DataService.get<EmployeeMaster>(this.STORAGE_KEY);
  }

  /**
   * Get employee by ID
   */
  getById(employeeId: string): EmployeeMaster | null {
    const employees = this.getAll();
    return employees.find(emp => emp.employeeId === employeeId) || null;
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
   * Create new employee master record
   */
  create(data: Omit<EmployeeMaster, "employeeId" | "createdAt" | "updatedAt">): EmployeeMaster {
    const now = new Date().toISOString();
    const newEmployee: EmployeeMaster = {
      ...data,
      employeeId: this.generateEmployeeId(),
      createdAt: now,
      updatedAt: now,
    };

    const employees = this.getAll();
    DataService.setAll(this.STORAGE_KEY, [...employees, newEmployee]);

    logger.log("EmployeeMaster: Created employee", { employeeId: newEmployee.employeeId });
    return newEmployee;
  }

  /**
   * Update employee master record
   */
  update(employeeId: string, updates: Partial<Omit<EmployeeMaster, "employeeId" | "createdAt">>): EmployeeMaster | null {
    const employees = this.getAll();
    const index = employees.findIndex(emp => emp.employeeId === employeeId);

    if (index === -1) {
      logger.error("EmployeeMaster: Employee not found", { employeeId });
      return null;
    }

    const updatedEmployee: EmployeeMaster = {
      ...employees[index],
      ...updates,
      employeeId, // Prevent ID change
      createdAt: employees[index].createdAt, // Preserve creation time
      updatedAt: new Date().toISOString(),
    };

    employees[index] = updatedEmployee;
    DataService.setAll(this.STORAGE_KEY, employees);

    logger.log("EmployeeMaster: Updated employee", { employeeId });
    return updatedEmployee;
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
   * Generate unique employee ID
   */
  private generateEmployeeId(): string {
    const employees = this.getAll();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `EMP-${timestamp}-${random}`;
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
 * Adapter to convert legacy employee format to EmployeeMaster
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
