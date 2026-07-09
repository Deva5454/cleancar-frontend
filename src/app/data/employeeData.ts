/**
 * Centralized Employee Data
 * 
 * This file contains the master employee data used across the entire CleanCar 360° system.
 * All modules (HR, Payroll, Leave Management, Performance, etc.) should import from this file
 * to ensure data consistency.
 */

// Extended Employee Interface
export interface Employee {
  id: string;
  empCode: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  cluster?: string;
  city: string;
  baseSalary: number;
  joiningDate: string;
  confirmationDate?: string | null;
  leavingDate?: string;
  lastWorkingDay?: string | null;
  status: "Active" | "On Leave" | "Notice Period" | "Resigned" | "Terminated";
  workingHours: string;
  reportingTo: string;
  address: string;
  emergencyContact: string;
  bloodGroup: string;
  dateOfBirth: string;
  aadhaar: string;
  pan: string;
  bankAccount: string;
  pfNumber: string;
  esiNumber: string;
  documents: {
    name: string;
    status: "Verified" | "Pending" | "Missing";
    uploadedDate?: string;
  }[];
}

// Document Types Required
export const requiredDocuments = [
  "Aadhaar Card",
  "PAN Card",
  "Bank Account Details",
  "Educational Certificates",
  "Experience Letters",
  "Address Proof",
  "Passport Size Photo",
  "Police Verification",
  "Medical Fitness Certificate",
  "Form 11 (PF Declaration)",
  "Form 2 (Pension Scheme)",
  "Appointment Letter (Signed)",
];

/**
 * Master Employee Data
 * These 10 employees are used consistently across:
 * - HR Module
 * - Payroll System
 * - Leave Management
 * - Performance Tracking
 * - Onboarding
 * - Exit & F&F Settlement
 */
/**
 * MASTER_EMPLOYEES — now derived live from employeeDatabaseService (the
 * single source of truth also used by Add Employee, Onboarding, Offer
 * Letters, and Exit Management), instead of a hardcoded array of 19 fake
 * employees. This file's own docstring always claimed to be "the master
 * employee data used across the entire system," but until now it was a
 * fifth, completely disconnected employee list — none of the 6+ components
 * that import MASTER_EMPLOYEES (HRModule, LifeCycleReports,
 * EmployeeSelfService, EmployeeLedger, ProfessionalLeaveManagement,
 * CostPerWashByConsumption) ever saw a real employee.
 *
 * This is a snapshot taken at module load time, not a live subscription —
 * consistent with how these components already used it (a plain imported
 * array, not a hook), so nothing about their reactivity contract changes.
 * Refreshing the page picks up the latest data.
 *
 * Fields not tracked anywhere in the real system yet (aadhaar, PAN, blood
 * group, PF/ESI numbers, working hours, cluster, document verification
 * status) are left as empty/default values rather than invented — they
 * were never real before either, just hardcoded placeholders.
 */
import { employeeDatabaseService, type EmployeeDatabaseRecord } from "../services/employeeDatabaseService";

function mapStatus(status: EmployeeDatabaseRecord["status"]): Employee["status"] {
  switch (status) {
    case "Active": return "Active";
    case "On Leave": return "On Leave";
    case "Inactive": return "Terminated";
    case "Exited": return "Resigned";
    default: return "Active";
  }
}

function adaptToLegacyEmployee(record: EmployeeDatabaseRecord): Employee {
  const id = record.id && record.id !== "PENDING" && record.id !== "NOT-CONVERTED" ? record.id : record.tempId;
  return {
    id,
    empCode: record.tempId || id,
    name: record.fullName,
    email: record.email,
    phone: record.mobile,
    role: record.designation,
    department: record.department,
    city: record.workLocation,
    baseSalary: 0, // Not tracked in employeeDatabaseService — see salaryStructureService for real figures
    joiningDate: record.dateOfJoining,
    confirmationDate: record.confirmationDate || null,
    lastWorkingDay: null,
    status: mapStatus(record.status),
    workingHours: "",
    reportingTo: record.reportingManager || "",
    address: record.currentAddress || record.permanentAddress || "",
    emergencyContact: record.emergencyContact || "",
    bloodGroup: "",
    dateOfBirth: record.dob || "",
    aadhaar: "",
    pan: "",
    bankAccount: (record as any).bankAccountNumber || "",
    pfNumber: "",
    esiNumber: "",
    documents: [],
  };
}

export const MASTER_EMPLOYEES: Employee[] = employeeDatabaseService.getAll().map(adaptToLegacyEmployee);

/**
 * Helper function to get employee by ID
 */
export function getEmployeeById(id: string): Employee | undefined {
  return MASTER_EMPLOYEES.find(emp => emp.id === id);
}

/**
 * Helper function to get employee by empCode
 */
export function getEmployeeByCode(empCode: string): Employee | undefined {
  return MASTER_EMPLOYEES.find(emp => emp.empCode === empCode);
}

/**
 * Helper function to get employees by department
 */
export function getEmployeesByDepartment(department: string): Employee[] {
  return MASTER_EMPLOYEES.filter(emp => emp.department === department);
}

/**
 * Helper function to get active employees
 */
export function getActiveEmployees(): Employee[] {
  return MASTER_EMPLOYEES.filter(emp => emp.status === "Active" || emp.status === "On Leave");
}

/**
 * Helper function to get employees by status
 */
export function getEmployeesByStatus(status: Employee["status"]): Employee[] {
  return MASTER_EMPLOYEES.filter(emp => emp.status === status);
}

/**
 * Helper function to get employees by role
 */
export function getEmployeesByRole(role: string): Employee[] {
  return MASTER_EMPLOYEES.filter(emp => emp.role === role && (emp.status === "Active" || emp.status === "On Leave"));
}

/**
 * Calculate average salary for a specific role from actual employee data
 */
export function getAverageSalaryByRole(role: string): number {
  const employees = getEmployeesByRole(role);
  if (employees.length === 0) return 0;

  const totalSalary = employees.reduce((sum, emp) => sum + emp.baseSalary, 0);
  return Math.round(totalSalary / employees.length);
}

/**
 * Get all salary statistics from actual employee data
 */
export function getSalaryStatistics() {
  return {
    washerCTC: getAverageSalaryByRole("Car Washer / Technician"),
    supervisorCTC: getAverageSalaryByRole("Operations Supervisor"),
    opsManagerCTC: getAverageSalaryByRole("Operations Manager"),
    cityManagerCTC: getAverageSalaryByRole("City Manager"),
  };
}

/**
 * Get headcount by role
 */
export function getHeadcountByRole(role: string): number {
  return getEmployeesByRole(role).length;
}

/**
 * Get all headcount statistics
 */
export function getHeadcountStatistics() {
  return {
    washers: getHeadcountByRole("Car Washer / Technician"),
    supervisors: getHeadcountByRole("Operations Supervisor"),
    opsManagers: getHeadcountByRole("Operations Manager"),
    cityManagers: getHeadcountByRole("City Manager"),
  };
}
