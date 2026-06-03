/**
 * HR System - Central Export
 * Import everything you need from this single file
 *
 * PHASE 3: Export useEmployeeData instead of useHRData (single source of truth)
 */

// Type Definitions
export type {
  Employee,
  PersonalInfo,
  ContactInfo,
  Address,
  EmergencyContact,
  IdentityProof,
  EmploymentInfo,
  SalaryInfo,
  SalaryComponent,
  BankDetails,
  PFDetails,
  ESICDetails,
  AttendanceInfo,
  WorkSchedule,
  DaySchedule,
  LeaveInfo,
  LeaveBalance,
  LeaveRecord,
  DocumentInfo,
  OnboardingStatus,
  AttendanceRecord,
  MonthlyAttendanceSummary,
  LeaveAdjustment,
  SalaryStructure,
  SalaryRule,
  PayrollRun,
  PayrollEmployee,
  SalaryCalculation,
  ComponentCalculation,
  SalaryAdjustment,
  LeavePolicy,
  LeavePolicyType,
  LeavePolicyRule,
  PublicHoliday,
  Department,
  Designation,
  Role,
  AuditLog,
  SystemConfiguration,
} from "../types/hr-types";

// Context and Hooks
export { HRDataProvider } from "../contexts/HRDataContext";
export { useEmployeeData } from "../hooks/useEmployeeData";

// Data Initialization
export {
  getInitialDepartments,
  getInitialDesignations,
  getInitialRoles,
  getInitialPublicHolidays,
  getInitialLeavePolicies,
  getInitialSalaryStructures,
  initializeHRData,
} from "../utils/hr-data-initializer";

// Data Synchronization Utilities
export {
  calculateSalaryFromAttendance,
  validateEmployeeData,
  syncSalaryChanges,
  generateMonthlyAttendanceTemplate,
  calculateLeaveDeductions,
  exportToPayrollSystem,
} from "../utils/data-sync";
