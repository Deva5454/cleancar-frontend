/**
 * HRDataContext - INTERNAL DATA LAYER
 *
 * ⚠️ PHASE 3: DO NOT IMPORT THIS DIRECTLY IN COMPONENTS
 *
 * This context is now an INTERNAL implementation detail.
 * ALL components must access employee data through:
 *
 *   import { useEmployeeData } from "../hooks/useEmployeeData"
 *
 * Direct imports of useHRData are DEPRECATED and will be removed.
 *
 * Data Flow: UI → useEmployeeData → HRDataContext → DataService → localStorage
 */

import { createContext, useContext, useState, ReactNode, useEffect, useMemo} from "react";
import { DataService } from "../services/DataService";
import { seedEmployeesIfEmpty } from "../data/seedEmployees";
import { eventBus } from "../utils/eventBus";
import { EVENTS } from "../constants/events";
import { employeeDatabaseService, type EmployeeDatabaseRecord } from "../services/employeeDatabaseService";
import type { EmployeeRole } from "./OrgContext";
// Auto-roster sync for new washers/supervisors
import { shiftRosterService } from "../services/shiftRosterService";
import { jobRoutingService  } from "../services/jobRoutingService";

// ============================================
// EMPLOYEE TYPES
// ============================================

// EmployeeRole type moved to OrgContext.tsx
export type { EmployeeRole } from "./OrgContext";

export type EmployeeStatus = "Active" | "On Leave" | "Inactive" | "Terminated";

export interface Employee {
  // Identity (GLOBAL)
  employeeId: string; // CRITICAL: Same as washerId in jobs, supervisorId, etc.

  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: EmployeeRole;

  // Organizational
  department: string;
  city: string;
  unit?: string;
  status: EmployeeStatus;
  joiningDate: string;

  // Shift assignment (for washers and supervisors)
  defaultShift?:  "Morning" | "Split" | "Evening";  // which 9-hr shift they work
  weekOffDay?:    "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

  // Hierarchy & Geography
  cityId?: string; // Links to city hierarchy
  clusterId?: string; // Links to cluster hierarchy
  assignedPincodes?: string[]; // Geographic assignments

  // Compensation (Legacy - kept for backward compatibility)
  baseSalary: number;
  incentiveEligible: boolean;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };

  // ============================================
  // PHASE 1 UPGRADE — NEW OPTIONAL FIELDS
  // ============================================

  // Enhanced Salary Structure (Optional)
  salary?: {
    type?: "fixed" | "hourly" | "per_car" | "hybrid";
    base?: number; // If different from baseSalary
    structureId?: string; // Reference to salary structure template
    components?: {
      basic?: number;
      hra?: number;
      allowances?: number;
      deductions?: number;
    };
    paymentCycle?: "weekly" | "monthly";
  };

  // Incentive Plan Configuration (Optional)
  incentives?: {
    planId?: string; // Reference to incentive plan template
    type?: "per_car" | "target_based" | "revenue_share";
    target?: number; // Monthly target (e.g., 150 cars)
    achieved?: number; // Current achievement
    payoutRules?: any; // JSON rules for calculation
  };

  // Performance Metrics (Optional, auto-calculated)
  performance?: {
    totalCarsWashed?: number;
    rating?: number; // 1-5 star rating
    attendanceScore?: number; // Percentage
    lastUpdated?: string;
  };

  // Profile Completion Flag
  isProfileComplete?: boolean; // True if salary + incentives exist

  // ============================================

  // Documents
  documents?: Array<{
    type: string;
    url: string;
    uploadedAt: string;
  }>;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ATTENDANCE TYPES
// ============================================

export interface AttendanceRecord {
  attendanceId: string;
  employeeId: string; // GLOBAL IDENTITY
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: "Present" | "Absent" | "Late" | "Half Day" | "Leave" | "Week Off";
  hoursWorked?: number;
  lateMinutes?: number;
  createdAt: string;
}

// ============================================
// PAYROLL TYPES
// ============================================

export interface PayrollRun {
  payrollId: string;
  employeeId: string; // GLOBAL IDENTITY
  month: string; // "2026-04"
  period: { startDate: string; endDate: string };
  // Earnings
  baseSalary: number;
  incentiveAmount: number;
  addOnEarnings: number;
  allowances: number;
  grossSalary: number;
  // Deductions
  pf: number;
  esic: number;
  tds: number;
  advances: number;
  penalties: number;
  totalDeductions: number;
  // Net
  netSalary: number;
  // Status
  status: "Draft" | "HR Approved" | "Finance Approved" | "Paid";
  hrApprovedBy?: string;
  hrApprovedAt?: string;
  financeApprovedBy?: string;
  financeApprovedAt?: string;
  paidAt?: string;
  paymentReference?: string;
  // HR Override
  hrOverride?: {
    originalAmount: number;
    overrideAmount: number;
    reason: string;
    approvedBy: string;
    approvalDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CONTEXT TYPE
// ============================================

interface HRDataContextType {
  // Employee Management
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, "employeeId" | "createdAt" | "updatedAt">) => Employee;
  updateEmployee: (employeeId: string, updates: Partial<Employee>) => void;
  deleteEmployee: (employeeId: string) => void;
  getEmployeeById: (employeeId: string) => Employee | undefined;
  getEmployeesByRole: (role: EmployeeRole | EmployeeRole[]) => Employee[];
  getEmployeesByStatus: (status: EmployeeStatus) => Employee[];
  getEmployeesByCity: (city: string) => Employee[];
  getEmployeesByPincode: (pincode: string) => Employee[];
  getEmployeesByCluster: (clusterId: string) => Employee[];
  getWashers: () => Employee[];
  getSupervisors: () => Employee[];
  getManagers: () => Employee[];
  getActiveEmployees: () => Employee[];
  getEmployeeCount: () => number;
  getEmployeeCountByRole: (role: EmployeeRole) => number;

  // Attendance Management
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: Omit<AttendanceRecord, "attendanceId" | "createdAt">) => AttendanceRecord;
  updateAttendanceRecord: (attendanceId: string, updates: Partial<AttendanceRecord>) => AttendanceRecord | null;
  getAttendanceByEmployeeId: (employeeId: string) => AttendanceRecord[];
  getAttendanceForDate: (date: string) => AttendanceRecord[];
  getAttendanceForMonth: (employeeId: string, month: string) => AttendanceRecord[];

  // Payroll Management
  payrollRuns: PayrollRun[];
  processPayroll: (payroll: Omit<PayrollRun, "payrollId" | "createdAt" | "updatedAt">) => PayrollRun;
  updatePayrollStatus: (payrollId: string, status: PayrollRun["status"]) => void;
  approvePayrollByHR: (payrollId: string, approvedBy: string) => void;
  approvePayrollByFinance: (payrollId: string, approvedBy: string) => void;
  markPayrollAsPaid: (payrollId: string, paymentReference: string) => void;
  applyHROverride: (payrollId: string, overrideAmount: number, reason: string, approvedBy: string) => void;
  getPayrollByEmployeeId: (employeeId: string) => PayrollRun[];
  getPayrollForMonth: (month: string) => PayrollRun[];
  getPendingPayrolls: () => PayrollRun[];
}

// ============================================
// CONTEXT CREATION
// ============================================

const HRDataContext = createContext<HRDataContextType | undefined>(undefined);

/**
 * Adapts an EmployeeDatabaseRecord (the single source of truth) into this
 * context's Employee shape. Mirrors the adapter in EmployeeContext.tsx —
 * kept local here since HRDataContext predates that file and several
 * legacy consumers (UserManagement.tsx) still import useHRData directly.
 */
function adaptDatabaseRecord(record: EmployeeDatabaseRecord): Employee {
  const id = record.id && record.id !== "PENDING" && record.id !== "NOT-CONVERTED" ? record.id : record.tempId;
  return {
    employeeId: id,
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    phone: record.mobile,
    role: (record.role || record.designation) as EmployeeRole,
    department: record.department,
    city: record.workLocation,
    status: record.status === "Exited" ? "Terminated" : (record.status as EmployeeStatus),
    joiningDate: record.dateOfJoining,
    cityId: record.cityId,
    assignedPincodes: record.pinCodes,
    baseSalary: 0,
    incentiveEligible: false,
    createdAt: record.tempIdAssignedDate || new Date().toISOString(),
    updatedAt: record.confirmationDate || record.tempIdAssignedDate || new Date().toISOString(),
  };
}

/**
 * Initialize employees from employeeDatabaseService — the single source of
 * truth. This used to read/seed a completely separate "EMPLOYEES"
 * DataService key that no onboarding/offer/exit screen ever wrote to, so
 * this context's employee list was permanently disconnected from the real
 * HR data (and vice versa — nothing here was ever visible in Onboarding).
 */
function initializeEmployees(): Employee[] {
  const records = employeeDatabaseService.getAll();
  console.log(`[HRDataContext] Loaded ${records.length} employees from employeeDatabaseService`);
  return records.map(adaptDatabaseRecord);
}

/**
 * Initialize attendance from DataService
 */
function initializeAttendance(): AttendanceRecord[] {
  const loaded = DataService.get<AttendanceRecord>("ATTENDANCE_RECORDS");
  console.log(`[HRDataContext] Loaded ${loaded.length} attendance records`);
  return loaded;
}

/**
 * Initialize payroll from DataService
 */
function initializePayroll(): PayrollRun[] {
  const loaded = DataService.get<PayrollRun>("PAYROLL_RUNS");
  console.log(`[HRDataContext] Loaded ${loaded.length} payroll runs`);
  return loaded;
}

export function HRDataProvider({ children }: { children: ReactNode }) {
  // Initialize all data synchronously
  const [employees, setEmployees] = useState<Employee[]>(() => initializeEmployees());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => initializeAttendance());
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => initializePayroll());

  // Re-sync whenever employeeDatabaseService changes — from this context's
  // own writes, or from onboarding/offer/exit screens writing directly.
  useEffect(() => {
    const unsubscribe = employeeDatabaseService.subscribe((records) => {
      setEmployees(records.map(adaptDatabaseRecord));
    });
    return unsubscribe;
  }, []);

  // Re-hydrate from localStorage after Supabase data loads (1s and 3s attempts)
  useEffect(() => {
    const rehydrate = () => {
      const stored = employeeDatabaseService.getAll().map(adaptDatabaseRecord);
      if (stored.length > employees.length) {
        console.log(`[HRDataContext] Re-hydrating ${stored.length} employees from employeeDatabaseService`);
        setEmployees(stored);
      }
      const storedAtt = DataService.get<AttendanceRecord>("ATTENDANCE_RECORDS");
      if (storedAtt.length > attendanceRecords.length) {
        setAttendanceRecords(storedAtt);
      }
      const storedPay = DataService.get<PayrollRun>("PAYROLL_RUNS");
      if (storedPay.length > payrollRuns.length) {
        setPayrollRuns(storedPay);
      }
    };
    const t1 = setTimeout(rehydrate, 1000);
    // Removed duplicate rehydration timeout — single 1s fetch is sufficient
    return () => { clearTimeout(t1); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // EMPLOYEE OPERATIONS
  // ============================================

  const addEmployee = (employeeData: Omit<Employee, "employeeId" | "createdAt" | "updatedAt">): Employee => {
    const now = new Date().toISOString();
    const tempId = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newEmployee: Employee = {
      ...employeeData,
      employeeId: tempId,
      createdAt: now,
      updatedAt: now,
    };

    // Writes through employeeDatabaseService — the single source of truth
    // also used by Add Employee, Onboarding, Offer Letters, and Exit
    // Management. This used to write to a separate DataService "EMPLOYEES"
    // key that no other part of the HR module ever read, so anything added
    // here was invisible everywhere else in the app.
    const record: EmployeeDatabaseRecord = {
      id: "PENDING",
      tempId,
      tempIdAssignedDate: now,
      conversionDueDate: now,
      daysInTempStatus: 0,
      isOverdue: false,
      employmentStage: "Temporary",
      skillLevel: "Skilled",
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      fullName: `${employeeData.firstName} ${employeeData.lastName}`,
      fatherFirstName: "",
      fatherLastName: "",
      fatherName: "",
      dob: "",
      gender: "",
      mobile: employeeData.phone,
      email: employeeData.email,
      permanentAddress: "",
      currentAddress: "",
      emergencyContact: "",
      designation: employeeData.role,
      department: employeeData.department,
      reportingManager: "",
      workLocation: employeeData.city,
      pinCodes: employeeData.assignedPincodes || [],
      employeeType: "Full Time",
      dateOfJoining: employeeData.joiningDate,
      probationPeriod: "3 months",
      status: employeeData.status === "Terminated" ? "Exited" : (employeeData.status as any) || "Active",
      onboardingPasswordSet: false,
      accountStatus: "pending_onboarding",
      failedLoginAttempts: 0,
      cityId: employeeData.cityId,
      role: employeeData.role,
      employeeId: tempId,
    };
    employeeDatabaseService.add(record);

    const updated = employeeDatabaseService.getAll().map(adaptDatabaseRecord);
    setEmployees(updated);
    eventBus.publish(EVENTS.EMPLOYEES_UPDATED);

    // ── AUTO-ROSTER: add washer/supervisor to current week's roster immediately ──
    const rosterRoles = ["Car Washer", "Car Washer Full Time", "Car Washer Part Time", "Supervisor"];
    if (rosterRoles.includes(newEmployee.role)) {
      try {
        const cityId = newEmployee.cityId ?? "CITY-SURAT";
        const normRole = newEmployee.role === "Supervisor" ? "Supervisor" : "Car Washer";

        // Determine default shift from role:
        // Supervisors default to Morning; Washers default based on existing team balance
        const existingRoster = shiftRosterService.getCurrentRoster(cityId);
        let defaultShift: "Morning" | "Split" | "Evening" = "Morning";
        if (existingRoster) {
          // Count how many are on each shift — assign new joiner to least-staffed
          const shiftCounts = { Morning: 0, Split: 0, Evening: 0 };
          existingRoster.slots
            .filter(s => s.role === normRole && !s.isWeekOff && s.date === new Date().toISOString().slice(0,10))
            .forEach(s => { shiftCounts[s.shiftType] = (shiftCounts[s.shiftType] || 0) + 1; });
          defaultShift = (Object.entries(shiftCounts).sort((a,b) => a[1]-b[1])[0][0]) as any;
        }

        jobRoutingService.onboardEmployee({
          cityId,
          employeeId:   newEmployee.employeeId,
          employeeName: `${newEmployee.firstName} ${newEmployee.lastName}`,
          role:         normRole,
          supervisorId: (newEmployee as any).reportingManagerId ?? "",
          zone:         (newEmployee as any).zone ?? (newEmployee as any).area ?? "",
          joiningDate:  newEmployee.joiningDate ?? new Date().toISOString().slice(0,10),
          defaultShift,
          weekOffDay:   (newEmployee as any).weekOffDay ?? "Sun",
        });

        console.log(
          `[HRDataContext] Auto-added ${newEmployee.firstName} ${newEmployee.lastName} ` +
          `to ${defaultShift} shift roster for ${cityId}`
        );
      } catch (e) {
        console.warn("[HRDataContext] Roster auto-add failed (non-fatal):", e);
      }
    }

    console.log(`[HRDataContext] Added employee: ${newEmployee.employeeId} (${newEmployee.firstName} ${newEmployee.lastName})`);
    return newEmployee;
  };

  const updateEmployee = (employeeId: string, updates: Partial<Employee>): void => {
    const recordUpdates: Partial<EmployeeDatabaseRecord> = {};
    if (updates.firstName !== undefined) recordUpdates.firstName = updates.firstName;
    if (updates.lastName !== undefined) recordUpdates.lastName = updates.lastName;
    if (updates.firstName || updates.lastName) {
      const existing = employeeDatabaseService.getById(employeeId);
      recordUpdates.fullName = `${updates.firstName ?? existing?.firstName ?? ""} ${updates.lastName ?? existing?.lastName ?? ""}`.trim();
    }
    if (updates.email !== undefined) recordUpdates.email = updates.email;
    if (updates.phone !== undefined) recordUpdates.mobile = updates.phone;
    if (updates.role !== undefined) { recordUpdates.designation = updates.role; recordUpdates.role = updates.role; }
    if (updates.department !== undefined) recordUpdates.department = updates.department;
    if (updates.city !== undefined) recordUpdates.workLocation = updates.city;
    if (updates.cityId !== undefined) recordUpdates.cityId = updates.cityId;
    if (updates.assignedPincodes !== undefined) recordUpdates.pinCodes = updates.assignedPincodes;
    if (updates.status !== undefined) recordUpdates.status = updates.status === "Terminated" ? "Exited" : (updates.status as any);
    if (updates.joiningDate !== undefined) recordUpdates.dateOfJoining = updates.joiningDate;

    employeeDatabaseService.update(employeeId, recordUpdates);

    const updated = employeeDatabaseService.getAll().map(adaptDatabaseRecord);
    setEmployees(updated);
    eventBus.publish(EVENTS.EMPLOYEES_UPDATED);

    // ── ROSTER SYNC: handle termination / reactivation ───────────────────────
    try {
      const emp = updated.find(e => e.employeeId === employeeId);
      if (!emp) return;
      const rosterRoles = ["Car Washer", "Car Washer Full Time", "Car Washer Part Time", "Supervisor"];
      if (!rosterRoles.includes(emp.role)) return;

      const cityId = (emp as any).cityId ?? "CITY-SURAT";
      const today  = new Date().toISOString().slice(0,10);

      if (updates.status === "Terminated" || updates.status === "Inactive") {
        // Mark all future slots as week-off so no jobs get routed to this person
        const allRosters = shiftRosterService.getRosters(cityId);
        allRosters.forEach(roster => {
          roster.slots.forEach(slot => {
            if (slot.employeeId === employeeId && slot.date >= today) {
              slot.isWeekOff = true;
            }
          });
          shiftRosterService.saveRoster(roster);
        });
        // Notify HR
        shiftRosterService["_pushNotif"]("HR", "HR", "no_show_alert",
          `${emp.firstName} ${emp.lastName} marked ${updates.status}. All future roster slots cleared. Replacement needed.`,
          employeeId);
        console.log(`[HRDataContext] Cleared future roster slots for terminated employee ${employeeId}`);
      } else if (updates.status === "Active" && emp.status !== "Active") {
        // Reactivating — add back to current week roster
        const normRole = emp.role === "Supervisor" ? "Supervisor" : "Car Washer";
        jobRoutingService.onboardEmployee({
          cityId,
          employeeId:   emp.employeeId,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          role:         normRole,
          supervisorId: (emp as any).reportingManagerId ?? "",
          zone:         (emp as any).zone ?? "",
          joiningDate:  today,
          defaultShift: "Morning",
          weekOffDay:   (emp as any).weekOffDay ?? "Sun",
        });
        console.log(`[HRDataContext] Re-added reactivated employee ${employeeId} to roster`);
      }
    } catch (e) {
      console.warn("[HRDataContext] Roster sync on update failed (non-fatal):", e);
    }

    console.log(`[HRDataContext] Updated employee: ${employeeId}`);
  };

  const deleteEmployee = (employeeId: string): void => {
    updateEmployee(employeeId, { status: "Terminated" });
    // Note: updateEmployee already publishes EMPLOYEES_UPDATED event
    console.log(`[HRDataContext] Deleted (soft) employee: ${employeeId}`);
  };

  const getEmployeeById = (employeeId: string): Employee | undefined => {
    return employees.find((emp) => emp.employeeId === employeeId);
  };

  const getEmployeesByRole = (role: EmployeeRole | EmployeeRole[]): Employee[] => {
    const roles = Array.isArray(role) ? role : [role];
    return employees.filter((emp) => roles.includes(emp.role));
  };

  const getEmployeesByStatus = (status: EmployeeStatus): Employee[] => {
    return employees.filter((emp) => emp.status === status);
  };

  const getEmployeesByCity = (city: string): Employee[] => {
    return employees.filter((emp) => emp.city === city);
  };

  const getEmployeesByPincode = (pincode: string): Employee[] => {
    return employees.filter((emp) => emp.assignedPincodes?.includes(pincode));
  };

  const getEmployeesByCluster = (clusterId: string): Employee[] => {
    return employees.filter((emp) => emp.clusterId === clusterId);
  };

  const getWashers = (): Employee[] => {
    return getEmployeesByRole(["Car Washer Full Time", "Car Washer Part Time"]);
  };

  const getSupervisors = (): Employee[] => {
    return getEmployeesByRole("Supervisor");
  };

  const getManagers = (): Employee[] => {
    return getEmployeesByRole([
      "Manager",
      "City Manager",
      "Sr Operations Manager",
      "Operations Manager",
      "Cluster Manager",
    ]);
  };

  const getActiveEmployees = (): Employee[] => {
    return getEmployeesByStatus("Active");
  };

  const getEmployeeCount = (): number => {
    return employees.length;
  };

  const getEmployeeCountByRole = (role: EmployeeRole): number => {
    return getEmployeesByRole(role).length;
  };

  // ============================================
  // ATTENDANCE OPERATIONS
  // ============================================

  const addAttendanceRecord = (
    recordData: Omit<AttendanceRecord, "attendanceId" | "createdAt">
  ): AttendanceRecord => {
    const newRecord: AttendanceRecord = {
      ...recordData,
      attendanceId: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    DataService.insert("ATTENDANCE_RECORDS", newRecord);
    const updated = DataService.get<AttendanceRecord>("ATTENDANCE_RECORDS");
    setAttendanceRecords(updated);

    console.log(`[HRDataContext] Added attendance: ${newRecord.attendanceId}`);
    return newRecord;
  };

  const getAttendanceByEmployeeId = (employeeId: string): AttendanceRecord[] => {
    return attendanceRecords.filter((a) => a.employeeId === employeeId);
  };

  const getAttendanceForDate = (date: string): AttendanceRecord[] => {
    return attendanceRecords.filter((a) => a.date === date);
  };

  const getAttendanceForMonth = (employeeId: string, month: string): AttendanceRecord[] => {
    return attendanceRecords.filter((a) => a.employeeId === employeeId && a.date.startsWith(month));
  };

  const updateAttendanceRecord = (
    attendanceId: string,
    updates: Partial<AttendanceRecord>
  ): AttendanceRecord | null => {
    const existingRecord = attendanceRecords.find((a) => a.attendanceId === attendanceId);
    if (!existingRecord) {
      console.error(`[HRDataContext] Attendance record not found: ${attendanceId}`);
      return null;
    }

    const updatedRecord: AttendanceRecord = {
      ...existingRecord,
      ...updates,
      attendanceId: existingRecord.attendanceId, // Prevent ID change
      createdAt: existingRecord.createdAt, // Prevent createdAt change
    };

    DataService.update("ATTENDANCE_RECORDS", attendanceId, updatedRecord);
    const updated = DataService.get<AttendanceRecord>("ATTENDANCE_RECORDS");
    setAttendanceRecords(updated);

    console.log(`[HRDataContext] Updated attendance: ${attendanceId}`);
    return updatedRecord;
  };

  // ============================================
  // PAYROLL OPERATIONS
  // ============================================

  const processPayroll = (
    payrollData: Omit<PayrollRun, "payrollId" | "createdAt" | "updatedAt">
  ): PayrollRun => {
    const newPayroll: PayrollRun = {
      ...payrollData,
      payrollId: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DataService.insert("PAYROLL_RUNS", newPayroll);
    const updated = DataService.get<PayrollRun>("PAYROLL_RUNS");
    setPayrollRuns(updated);

    console.log(`[HRDataContext] Processed payroll: ${newPayroll.payrollId}`);
    return newPayroll;
  };

  const updatePayrollStatus = (payrollId: string, status: PayrollRun["status"]): void => {
    DataService.update("PAYROLL_RUNS", payrollId, { status, updatedAt: new Date().toISOString() }, "payrollId");
    const updated = DataService.get<PayrollRun>("PAYROLL_RUNS");
    setPayrollRuns(updated);
    console.log(`[HRDataContext] Updated payroll status: ${payrollId} → ${status}`);
  };

  const approvePayrollByHR = (payrollId: string, approvedBy: string): void => {
    const updates = {
      status: "HR Approved" as const,
      hrApprovedBy: approvedBy,
      hrApprovedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    DataService.update("PAYROLL_RUNS", payrollId, updates, "payrollId");
    const updated = DataService.get<PayrollRun>("PAYROLL_RUNS");
    setPayrollRuns(updated);
    console.log(`[HRDataContext] HR approved payroll: ${payrollId} by ${approvedBy}`);
  };

  const approvePayrollByFinance = (payrollId: string, approvedBy: string): void => {
    const updates = {
      status: "Finance Approved" as const,
      financeApprovedBy: approvedBy,
      financeApprovedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    DataService.update("PAYROLL_RUNS", payrollId, updates, "payrollId");
    const updated = DataService.get<PayrollRun>("PAYROLL_RUNS");
    setPayrollRuns(updated);
    console.log(`[HRDataContext] Finance approved payroll: ${payrollId} by ${approvedBy}`);
  };

  const markPayrollAsPaid = (payrollId: string, paymentReference: string): void => {
    const updates = {
      status: "Paid" as const,
      paidAt: new Date().toISOString(),
      paymentReference,
      updatedAt: new Date().toISOString(),
    };
    DataService.update("PAYROLL_RUNS", payrollId, updates, "payrollId");
    const updated = DataService.get<PayrollRun>("PAYROLL_RUNS");
    setPayrollRuns(updated);
    console.log(`[HRDataContext] Marked payroll as paid: ${payrollId} (${paymentReference})`);
  };

  const applyHROverride = (
    payrollId: string,
    overrideAmount: number,
    reason: string,
    approvedBy: string
  ): void => {
    const payroll = payrollRuns.find((p) => p.payrollId === payrollId);
    if (!payroll) return;

    const hrOverride = {
      originalAmount: payroll.netSalary,
      overrideAmount,
      reason,
      approvedBy,
      approvalDate: new Date().toISOString(),
    };

    const updates = {
      hrOverride,
      netSalary: overrideAmount,
      updatedAt: new Date().toISOString(),
    };

    DataService.update("PAYROLL_RUNS", payrollId, updates, "payrollId");
    const updated = DataService.get<PayrollRun>("PAYROLL_RUNS");
    setPayrollRuns(updated);
    console.log(`[HRDataContext] Applied HR override: ${payrollId} (${overrideAmount})`);
  };

  const getPayrollByEmployeeId = (employeeId: string): PayrollRun[] => {
    return payrollRuns.filter((p) => p.employeeId === employeeId);
  };

  const getPayrollForMonth = (month: string): PayrollRun[] => {
    return payrollRuns.filter((p) => p.month === month);
  };

  const getPendingPayrolls = (): PayrollRun[] => {
    return payrollRuns.filter((p) => p.status === "Draft" || p.status === "HR Approved");
  };

  // ============================================
  // PROVIDER
  // ============================================

  const contextValue = useMemo(() => ({
    // Employees
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    getEmployeesByRole,
    getEmployeesByStatus,
    getEmployeesByCity,
    getEmployeesByPincode,
    getEmployeesByCluster,
    getWashers,
    getSupervisors,
    getManagers,
    getActiveEmployees,
    getEmployeeCount,
    getEmployeeCountByRole,
    // Attendance
    attendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    getAttendanceByEmployeeId,
    getAttendanceForDate,
    getAttendanceForMonth,
    // Payroll
    payrollRuns,
    processPayroll,
    updatePayrollStatus,
    approvePayrollByHR,
    approvePayrollByFinance,
    markPayrollAsPaid,
    applyHROverride,
    getPayrollByEmployeeId,
    getPayrollForMonth,
    getPendingPayrolls,
  }),
  [employees, addEmployee, updateEmployee, deleteEmployee, getEmployeeById, getEmployeesByRole, getEmployeesByStatus, getEmployeesByCity, getEmployeesByPincode, getEmployeesByCluster]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HRDataContext.Provider
      value={contextValue}
    >
      {children}
    </HRDataContext.Provider>
  );
}

/**
 * ⚠️ DEPRECATED - DO NOT USE DIRECTLY
 *
 * This hook is for INTERNAL use only by useEmployeeData.
 * Components should import useEmployeeData instead.
 *
 * @deprecated Use useEmployeeData from "../hooks/useEmployeeData" instead
 * @internal
 */
export function useHRData() {
  const context = useContext(HRDataContext);
  if (!context) {
    console.warn("[useHRData] outside HRDataProvider - fallback"); return {} as any; // safe fallback
  }

  // PHASE 3: No console warning - only useEmployeeData calls this internally
  // JSDoc @deprecated tag still warns in IDE if someone tries to import directly

  return context;
}
