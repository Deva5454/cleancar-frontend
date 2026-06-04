/**
 * Employee Salary Service
 *
 * Single source of truth for actual employee salaries.
 * This service stores the salary assigned to each employee after they join.
 *
 * IMPORTANT DISTINCTION:
 * - salaryStructureService: Templates/structures by ROLE (used for offers)
 * - employeeSalaryService: Actual salary for INDIVIDUAL EMPLOYEES (after joining)
 */

import type { SalaryComponents } from "./salaryStructureService";

export interface EmployeeSalaryRecord {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  salaryStructureId: string; // Reference to the salary structure used
  salaryComponents: SalaryComponents; // Actual salary components for this employee
  effectiveFrom: string; // When this salary became effective
  effectiveTo?: string; // If salary changed, when it ended
  isActive: boolean;
  createdBy: string;
  createdDate: string;
  lastUpdated: string;
}

export interface EmployeeSalaryHistory {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  salaryRecords: EmployeeSalaryRecord[];
}

// In-memory storage (replace with API/database in production)
class EmployeeSalaryStore {
  private salaryRecords: EmployeeSalaryRecord[] = [];
  private listeners: Array<(records: EmployeeSalaryRecord[]) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("employeeSalaries");
      if (stored) {
        try {
          this.salaryRecords = JSON.parse(stored);
        } catch (e) {
          console.error("Error loading employee salaries:", e);
          this.salaryRecords = [];
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem("employeeSalaries", JSON.stringify(this.salaryRecords));
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.salaryRecords));
  }

  // Subscribe to changes
  subscribe(listener: (records: EmployeeSalaryRecord[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Get all salary records
  getAll(): EmployeeSalaryRecord[] {
    return [...this.salaryRecords];
  }

  // Get active salary for an employee
  getActiveEmployeeSalary(employeeId: string): EmployeeSalaryRecord | undefined {
    return this.salaryRecords.find(
      (record) => record.employeeId === employeeId && record.isActive
    );
  }

  // Get salary history for an employee
  getSalaryHistory(employeeId: string): EmployeeSalaryRecord[] {
    return this.salaryRecords
      .filter((record) => record.employeeId === employeeId)
      .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
  }

  // Get employees with active salaries
  getEmployeesWithSalaries(): EmployeeSalaryHistory[] {
    const employeeMap = new Map<string, EmployeeSalaryHistory>();

    this.salaryRecords.forEach((record) => {
      if (!employeeMap.has(record.employeeId)) {
        employeeMap.set(record.employeeId, {
          employeeId: record.employeeId,
          employeeCode: record.employeeCode,
          employeeName: record.employeeName,
          salaryRecords: [],
        });
      }
      employeeMap.get(record.employeeId)!.salaryRecords.push(record);
    });

    return Array.from(employeeMap.values());
  }

  // Create or update employee salary (when employee joins or salary changes)
  createOrUpdateEmployeeSalary(record: Omit<EmployeeSalaryRecord, "createdDate" | "lastUpdated">): EmployeeSalaryRecord {
    // Deactivate any existing active salary for this employee
    this.salaryRecords.forEach((existing) => {
      if (existing.employeeId === record.employeeId && existing.isActive) {
        existing.isActive = false;
        existing.effectiveTo = new Date().toISOString().split("T")[0];
      }
    });

    const newRecord: EmployeeSalaryRecord = {
      ...record,
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    this.salaryRecords.push(newRecord);
    this.saveToStorage();
    this.notify();

    return newRecord;
  }

  // Update employee salary (salary revision)
  updateEmployeeSalary(
    employeeId: string,
    newSalaryComponents: SalaryComponents,
    salaryStructureId: string,
    effectiveFrom: string,
    updatedBy: string
  ): EmployeeSalaryRecord | undefined {
    const currentSalary = this.getActiveEmployeeSalary(employeeId);
    if (!currentSalary) {
      console.error("No active salary found for employee:", employeeId);
      return undefined;
    }

    // Deactivate current salary
    currentSalary.isActive = false;
    currentSalary.effectiveTo = effectiveFrom;

    // Create new salary record
    const newRecord: EmployeeSalaryRecord = {
      employeeId: currentSalary.employeeId,
      employeeCode: currentSalary.employeeCode,
      employeeName: currentSalary.employeeName,
      designation: currentSalary.designation,
      department: currentSalary.department,
      dateOfJoining: currentSalary.dateOfJoining,
      salaryStructureId,
      salaryComponents: newSalaryComponents,
      effectiveFrom,
      isActive: true,
      createdBy: updatedBy,
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    this.salaryRecords.push(newRecord);
    this.saveToStorage();
    this.notify();

    return newRecord;
  }

  // Check if employee has salary record (has joined)
  hasEmployeeSalary(employeeId: string): boolean {
    return this.salaryRecords.some(
      (record) => record.employeeId === employeeId && record.isActive
    );
  }

  // Delete salary record (for testing/admin purposes)
  deleteEmployeeSalary(employeeId: string): boolean {
    const initialLength = this.salaryRecords.length;
    this.salaryRecords = this.salaryRecords.filter(
      (record) => record.employeeId !== employeeId
    );

    if (this.salaryRecords.length < initialLength) {
      this.saveToStorage();
      this.notify();
      return true;
    }

    return false;
  }

  // Get salary for a specific date (for historical payroll)
  getSalaryForDate(employeeId: string, date: string): EmployeeSalaryRecord | undefined {
    const records = this.getSalaryHistory(employeeId);

    for (const record of records) {
      const effectiveFromDate = new Date(record.effectiveFrom);
      const effectiveToDate = record.effectiveTo ? new Date(record.effectiveTo) : new Date();
      const checkDate = new Date(date);

      if (checkDate >= effectiveFromDate && checkDate <= effectiveToDate) {
        return record;
      }
    }

    return undefined;
  }
}

// Export singleton instance
export const employeeSalaryService = new EmployeeSalaryStore();
