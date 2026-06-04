/**
 * Payroll System Constants
 * Config-driven architecture - All values fetched from config tables
 */

// ==================== ATTENDANCE TYPES ====================

export const ATTENDANCE_TYPES = {
  // Full Pay Statuses (Green)
  PRESENT: "P",
  WEEKLY_OFF: "WOFF",
  PUBLIC_HOLIDAY: "PH",
  PAID_LEAVE: "PL",
  CASUAL_LEAVE: "CSL",
  COMP_OFF: "COMP OFF",
  MATERNITY_LEAVE: "MTL",

  // Half Pay Statuses (Yellow)
  FIRST_HALF: "1H",
  SECOND_HALF: "2H",
  FIRST_HALF_PL: "1_HPL",
  SECOND_HALF_PL: "2_HPL",
  FIRST_HALF_CSL: "1_HCSL",
  SECOND_HALF_CSL: "2_HCSL",

  // Unpaid Statuses (Red)
  ABSENT: "A",
  LEAVE_WITHOUT_PAY: "LWP",
  FIRST_HALF_LWP: "1_HLWP",
  SECOND_HALF_LWP: "2_HLWP",

  // Adjustment Statuses (Purple)
  HALF_PL_GRACE_ADJUSTMENT: "HPLRG",
  PL_GRACE_ADJUSTMENT: "PLRG",

  // Legacy
  SICK_LEAVE: "SL",
  HALF_DAY: "H",
} as const;

export const ATTENDANCE_TYPE_LABELS = {
  // Full Pay
  [ATTENDANCE_TYPES.PRESENT]: "Present",
  [ATTENDANCE_TYPES.WEEKLY_OFF]: "Weekly Off",
  [ATTENDANCE_TYPES.PUBLIC_HOLIDAY]: "Public Holiday",
  [ATTENDANCE_TYPES.PAID_LEAVE]: "Paid Leave",
  [ATTENDANCE_TYPES.CASUAL_LEAVE]: "Casual/Sick Leave",
  [ATTENDANCE_TYPES.COMP_OFF]: "Comp Off",
  [ATTENDANCE_TYPES.MATERNITY_LEAVE]: "Maternity Leave",

  // Half Pay
  [ATTENDANCE_TYPES.FIRST_HALF]: "1st Half Present",
  [ATTENDANCE_TYPES.SECOND_HALF]: "2nd Half Present",
  [ATTENDANCE_TYPES.FIRST_HALF_PL]: "1st Half PL",
  [ATTENDANCE_TYPES.SECOND_HALF_PL]: "2nd Half PL",
  [ATTENDANCE_TYPES.FIRST_HALF_CSL]: "1st Half CSL",
  [ATTENDANCE_TYPES.SECOND_HALF_CSL]: "2nd Half CSL",

  // Unpaid
  [ATTENDANCE_TYPES.ABSENT]: "Absent",
  [ATTENDANCE_TYPES.LEAVE_WITHOUT_PAY]: "Leave Without Pay",
  [ATTENDANCE_TYPES.FIRST_HALF_LWP]: "1st Half LWP",
  [ATTENDANCE_TYPES.SECOND_HALF_LWP]: "2nd Half LWP",

  // Adjustment
  [ATTENDANCE_TYPES.HALF_PL_GRACE_ADJUSTMENT]: "Half Day PL Grace Adjustment",
  [ATTENDANCE_TYPES.PL_GRACE_ADJUSTMENT]: "PL Grace Adjustment",

  // Legacy
  [ATTENDANCE_TYPES.SICK_LEAVE]: "Sick Leave",
  [ATTENDANCE_TYPES.HALF_DAY]: "Half Day",
} as const;

// Salary Impact Categories
export const SALARY_IMPACT = {
  FULL_PAY: "FULL_PAY",
  HALF_PAY: "HALF_PAY",
  UNPAID: "UNPAID",
  ADJUSTMENT: "ADJUSTMENT",
} as const;

export const SALARY_IMPACT_MAP = {
  // Full Pay (No Deduction)
  [ATTENDANCE_TYPES.PRESENT]: SALARY_IMPACT.FULL_PAY,
  [ATTENDANCE_TYPES.WEEKLY_OFF]: SALARY_IMPACT.FULL_PAY,
  [ATTENDANCE_TYPES.PUBLIC_HOLIDAY]: SALARY_IMPACT.FULL_PAY,
  [ATTENDANCE_TYPES.PAID_LEAVE]: SALARY_IMPACT.FULL_PAY,
  [ATTENDANCE_TYPES.CASUAL_LEAVE]: SALARY_IMPACT.FULL_PAY,
  [ATTENDANCE_TYPES.COMP_OFF]: SALARY_IMPACT.FULL_PAY,
  [ATTENDANCE_TYPES.MATERNITY_LEAVE]: SALARY_IMPACT.FULL_PAY,

  // Half Pay (0.5 Day Paid)
  [ATTENDANCE_TYPES.FIRST_HALF]: SALARY_IMPACT.HALF_PAY,
  [ATTENDANCE_TYPES.SECOND_HALF]: SALARY_IMPACT.HALF_PAY,
  [ATTENDANCE_TYPES.FIRST_HALF_PL]: SALARY_IMPACT.HALF_PAY,
  [ATTENDANCE_TYPES.SECOND_HALF_PL]: SALARY_IMPACT.HALF_PAY,
  [ATTENDANCE_TYPES.FIRST_HALF_CSL]: SALARY_IMPACT.HALF_PAY,
  [ATTENDANCE_TYPES.SECOND_HALF_CSL]: SALARY_IMPACT.HALF_PAY,

  // Unpaid (0.5/1 Day Cut)
  [ATTENDANCE_TYPES.ABSENT]: SALARY_IMPACT.UNPAID,
  [ATTENDANCE_TYPES.LEAVE_WITHOUT_PAY]: SALARY_IMPACT.UNPAID,
  [ATTENDANCE_TYPES.FIRST_HALF_LWP]: SALARY_IMPACT.UNPAID,
  [ATTENDANCE_TYPES.SECOND_HALF_LWP]: SALARY_IMPACT.UNPAID,

  // Adjustment (Use Leave Balance)
  [ATTENDANCE_TYPES.HALF_PL_GRACE_ADJUSTMENT]: SALARY_IMPACT.ADJUSTMENT,
  [ATTENDANCE_TYPES.PL_GRACE_ADJUSTMENT]: SALARY_IMPACT.ADJUSTMENT,

  // Legacy
  [ATTENDANCE_TYPES.SICK_LEAVE]: SALARY_IMPACT.FULL_PAY,
  [ATTENDANCE_TYPES.HALF_DAY]: SALARY_IMPACT.HALF_PAY,
} as const;

export const ATTENDANCE_TYPE_COLORS = {
  // Full Pay - Green
  [ATTENDANCE_TYPES.PRESENT]: "bg-green-100 text-green-800 border-green-200",
  [ATTENDANCE_TYPES.WEEKLY_OFF]: "bg-green-100 text-green-800 border-green-200",
  [ATTENDANCE_TYPES.PUBLIC_HOLIDAY]: "bg-green-100 text-green-800 border-green-200",
  [ATTENDANCE_TYPES.PAID_LEAVE]: "bg-green-100 text-green-800 border-green-200",
  [ATTENDANCE_TYPES.CASUAL_LEAVE]: "bg-green-100 text-green-800 border-green-200",
  [ATTENDANCE_TYPES.COMP_OFF]: "bg-green-100 text-green-800 border-green-200",
  [ATTENDANCE_TYPES.MATERNITY_LEAVE]: "bg-green-100 text-green-800 border-green-200",

  // Half Pay - Yellow
  [ATTENDANCE_TYPES.FIRST_HALF]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [ATTENDANCE_TYPES.SECOND_HALF]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [ATTENDANCE_TYPES.FIRST_HALF_PL]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [ATTENDANCE_TYPES.SECOND_HALF_PL]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [ATTENDANCE_TYPES.FIRST_HALF_CSL]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [ATTENDANCE_TYPES.SECOND_HALF_CSL]: "bg-yellow-100 text-yellow-800 border-yellow-200",

  // Unpaid - Red
  [ATTENDANCE_TYPES.ABSENT]: "bg-red-100 text-red-800 border-red-200",
  [ATTENDANCE_TYPES.LEAVE_WITHOUT_PAY]: "bg-red-100 text-red-800 border-red-200",
  [ATTENDANCE_TYPES.FIRST_HALF_LWP]: "bg-red-100 text-red-800 border-red-200",
  [ATTENDANCE_TYPES.SECOND_HALF_LWP]: "bg-red-100 text-red-800 border-red-200",

  // Adjustment - Purple
  [ATTENDANCE_TYPES.HALF_PL_GRACE_ADJUSTMENT]: "bg-purple-100 text-purple-800 border-purple-200",
  [ATTENDANCE_TYPES.PL_GRACE_ADJUSTMENT]: "bg-purple-100 text-purple-800 border-purple-200",

  // Legacy
  [ATTENDANCE_TYPES.SICK_LEAVE]: "bg-green-100 text-green-800 border-green-200",
  [ATTENDANCE_TYPES.HALF_DAY]: "bg-yellow-100 text-yellow-800 border-yellow-200",
} as const;

// ==================== GRACE PERIOD RULES ====================

export const GRACE_PERIOD_RULES = {
  GRACE_MINUTES: 10, // 10-minute grace period
  MONTHLY_QUOTA: 3, // 3 times per month
  BUSINESS_HOURS_START: 9, // 09:00 AM
  BUSINESS_HOURS_END: 19, // 07:00 PM (19:00)
  WORKING_DAYS: [1, 2, 3, 4, 5, 6], // Mon-Sat (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  RESET_DAY: 1, // Reset on 1st of every month
} as const;

export const GRACE_PERIOD_APPLICATIONS = {
  SHIFT_START: "SHIFT_START",
  LUNCH_RETURN: "LUNCH_RETURN",
} as const;

// ==================== GHOSTING DETECTION RULES ====================

export const GHOSTING_RULES = {
  CONSECUTIVE_ABSENT_DAYS: 3, // 3 consecutive days of A or LWP
  ABSENT_STATUSES: ["A", "LWP"], // Statuses that count towards ghosting
  ESCALATION_TIMEOUT_HOURS: 4, // 4 business hours for escalation
  BUSINESS_HOURS_START: 9, // 09:00 AM
  BUSINESS_HOURS_END: 19, // 07:00 PM (19:00)
  EXCLUDED_DAYS: [0], // Sunday excluded from business hour calculation
} as const;

export const SALARY_HOLD_STATUS = {
  ACTIVE: "ACTIVE", // Normal payroll processing
  ON_HOLD: "ON_HOLD", // Salary blocked due to ghosting
  OVERRIDE_PENDING: "OVERRIDE_PENDING", // Override request submitted
  RELEASED: "RELEASED", // Override approved, salary released
} as const;

// ==================== APPROVAL LEVELS ====================

export const APPROVAL_LEVELS = {
  SUPERVISOR: "SUPERVISOR",
  CLUSTER_MANAGER: "CLUSTER_MANAGER",
  OPERATIONS_MANAGER: "OPERATIONS_MANAGER",
  HR_MANAGER: "HR_MANAGER",
} as const;

export const APPROVAL_LEVEL_ORDER = [
  APPROVAL_LEVELS.SUPERVISOR,
  APPROVAL_LEVELS.CLUSTER_MANAGER,
  APPROVAL_LEVELS.OPERATIONS_MANAGER,
  APPROVAL_LEVELS.HR_MANAGER,
] as const;

export const APPROVAL_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  OVERDUE: "OVERDUE", // Exceeded 4 business hours
  AUTO_ESCALATED: "AUTO_ESCALATED",
} as const;

// ==================== DEDUCTION RULES ====================

export const DEDUCTION_RULES = {
  LATE_COMING_THRESHOLD: 3, // After 3 late marks, deduct 0.5 day
  LATE_COMING_DEDUCTION: 0.5,
  AUTO_LOGOUT_THRESHOLD: 2, // After 2 auto logouts, deduct 1 day
  AUTO_LOGOUT_DEDUCTION: 1,
  HALF_DAY_DEDUCTION: 0.5,
  ABSENT_DEDUCTION: 1,
  LWP_DEDUCTION: 1,
  GRACE_VIOLATION_DEDUCTION: 0.5, // HPLRG - Half day deduction for grace violation
} as const;

// ==================== STATUTORY RULES ====================

export const STATUTORY_RULES = {
  EPF_PERCENTAGE: 12, // 12% of basic
  ESIC_PERCENTAGE: 0.75, // 0.75% of gross
  ESIC_THRESHOLD: 21000, // ESIC applicable only if gross <= 21000
  EPF_EMPLOYER_PERCENTAGE: 13.61, // Employer contribution (12% PF + 1.61% admin charges)
  ESIC_EMPLOYER_PERCENTAGE: 3.25, // Employer contribution 3.25% of gross
  PT_SLABS: [
    { min: 0, max: 5999, amount: 0 },
    { min: 6000, max: 8999, amount: 80 },
    { min: 9000, max: 11999, amount: 150 },
    { min: 12000, max: Infinity, amount: 200 },
  ],
} as const;

// ==================== SALARY COMPONENTS ====================

export const SALARY_COMPONENTS = {
  // Earnings
  BASIC: "Basic Salary",
  HRA: "HRA",
  CONVEYANCE: "Conveyance",
  MEDICAL: "Medical Allowance",
  SPECIAL: "Special Allowance",
  BONUS: "Bonus",
  INCENTIVE: "Incentive",
  OVERTIME: "Overtime",

  // Deductions
  EPF: "EPF",
  ESIC: "ESIC",
  PT: "Professional Tax",
  TDS: "TDS",
  ATTENDANCE_DEDUCTION: "Attendance Deduction",
  ADVANCE: "Advance",
  LOAN: "Loan",
} as const;

// ==================== WORKING HOURS ====================

export const WORKING_HOURS = {
  FULL_DAY: 9,
  HALF_DAY: 4.5,
  MINIMUM_HOURS: 8.5, // Minimum hours to be considered full day
} as const;

// ==================== DATE FORMATS ====================

export const DATE_FORMATS = {
  DISPLAY: "DD MMM YYYY",
  API: "YYYY-MM-DD",
  MONTH_YEAR: "MMM YYYY",
  TIME: "hh:mm A",
} as const;

// ==================== API ENDPOINTS (Mock) ====================

export const API_ENDPOINTS = {
  MONTHLY_PAYROLL: "/employee/:id/monthly-payroll",
  ATTENDANCE_LOGS: "/attendance/logs",
  EMPLOYEE_MASTER: "/employee/:id",
  SALARY_STRUCTURE: "/salary-structure/:roleId",
  LEAVE_BALANCE: "/leave/balance/:empId",
  DEDUCTION_RULES: "/config/deduction-rules",
  STATUTORY_CONFIG: "/config/statutory",
} as const;

// ==================== PAYROLL STATUS ====================

export const PAYROLL_STATUS = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  PROCESSED: "processed",
  PAID: "paid",
} as const;

export const PAYROLL_STATUS_LABELS = {
  [PAYROLL_STATUS.DRAFT]: "Draft",
  [PAYROLL_STATUS.PENDING_REVIEW]: "Pending Review",
  [PAYROLL_STATUS.APPROVED]: "Approved",
  [PAYROLL_STATUS.PROCESSED]: "Processed",
  [PAYROLL_STATUS.PAID]: "Paid",
} as const;

export const PAYROLL_STATUS_COLORS = {
  [PAYROLL_STATUS.DRAFT]: "bg-gray-100 text-gray-800",
  [PAYROLL_STATUS.PENDING_REVIEW]: "bg-yellow-100 text-yellow-800",
  [PAYROLL_STATUS.APPROVED]: "bg-blue-100 text-blue-800",
  [PAYROLL_STATUS.PROCESSED]: "bg-green-100 text-green-800",
  [PAYROLL_STATUS.PAID]: "bg-purple-100 text-purple-800",
} as const;

// ==================== ERROR MESSAGES ====================

export const ERROR_MESSAGES = {
  NO_SALARY_STRUCTURE: "Salary structure not defined for this role",
  ATTENDANCE_NOT_FOUND: "Attendance data not available for this period",
  EMPLOYEE_NOT_FOUND: "Employee record not found",
  INVALID_MONTH: "Invalid month or year",
} as const;
