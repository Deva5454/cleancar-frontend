/**
 * LEAVE POLICY CONFIGURATION ENGINE
 * Centralized system for managing all leave policies, rules, and accrual logic
 * All changes here automatically reflect across the entire application
 * 
 * CORE PRINCIPLE:
 * - All leave balances are maintained in DAYS (single source)
 * - Half-day is NOT a leave type - it's only a MODE of applying leave
 * - System deducts: 1.0 for full day, 0.5 for half day
 */

export type LeaveType =
  | "PL"           // Privilege Leave
  | "CL"           // Casual Leave
  | "CSL"          // Casual/Sick Leave (combined)
  | "LWP"          // Leave Without Pay
  | "COMP OFF"     // Compensatory Off
  | "MTL"          // Maternity Leave
  | "UPL";         // Unpaid Leave

export type EmployeeStatus = "Probation" | "Confirmed";

// Global leave enablement settings
export interface LeaveGlobalSettings {
  PL: {
    globallyEnabled: boolean;
    applyTo: "all" | "specific";
    specificEmployeeId?: string;
  };
  CL: {
    globallyEnabled: boolean;
    applyTo: "all" | "specific";
    specificEmployeeId?: string;
  };
  "COMP OFF": {
    globallyEnabled: boolean;
    applyTo: "all" | "specific";
    specificEmployeeId?: string;
  };
}

// Global settings instance (can be modified via settings panel)
export let LEAVE_GLOBAL_SETTINGS: LeaveGlobalSettings = {
  PL: { globallyEnabled: true, applyTo: "all" },
  CL: { globallyEnabled: true, applyTo: "all" },
  "COMP OFF": { globallyEnabled: true, applyTo: "all" },
};

// Function to update global settings
export function updateLeaveGlobalSettings(newSettings: LeaveGlobalSettings): void {
  LEAVE_GLOBAL_SETTINGS = { ...newSettings };
}

// Function to check if a leave type is enabled for a specific employee
export function isLeaveTypeEnabledForEmployee(
  leaveType: "PL" | "CL" | "COMP OFF",
  employeeId: string
): boolean {
  const settings = LEAVE_GLOBAL_SETTINGS[leaveType];

  if (!settings.globallyEnabled) {
    return false;
  }

  if (settings.applyTo === "all") {
    return true;
  }

  if (settings.applyTo === "specific" && settings.specificEmployeeId === employeeId) {
    return true;
  }

  return false;
}

export interface LeaveRule {
  id: string;
  leaveType: LeaveType;
  ruleName: string;
  value: number | string | boolean;
  description: string;
  applicableFor: EmployeeStatus[];
}

export interface LeaveTypePolicy {
  type: LeaveType;
  name: string;
  fullName: string;
  description: string;
  icon: string;
  
  // Probation Period Settings
  probation: {
    enabled: boolean;
    annualQuota: number;
    accrualRule: string;
    accrualDays: number; // Days after which 1 leave is credited
    accrualAmount: number; // Amount credited per accrual period
    carryForward: boolean;
    encashment: boolean;
    maxConsecutiveDays: number;
  };
  
  // Post-Confirmation Settings
  confirmed: {
    enabled: boolean;
    annualQuota: number;
    accrualRule: string;
    accrualDays: number;
    accrualAmount: number;
    carryForward: boolean;
    carryForwardLimit: number; // Max days that can be carried forward
    encashment: boolean;
    encashmentRules: string[];
    maxConsecutiveDays: number;
  };
  
  // Common Rules
  rules: {
    priorApprovalRequired: boolean;
    priorApprovalDays: number;
    medicalCertificateRequired: boolean;
    medicalCertificateAfterDays: number;
    canClubWith: LeaveType[];
    cannotClubWith: LeaveType[];
    canClubWithPublicHoliday: boolean;
    allowSandwiching: boolean; // Can apply leave before/after public holiday
    allowHalfDay?: boolean; // Default: true, false for maternity
    mustBeContinuous?: boolean; // Default: false, true for maternity
  };
  
  // Salary Impact
  salaryImpact: {
    isPaid: boolean;
    deductionFormula?: string;
  };
  
  // Special Configurations
  specialRules?: {
    // Maternity Leave specific
    maternity?: {
      eligibilityDays: number; // Must have worked X days in last 12 months
      standardEntitlement: number; // 182 days (26 weeks) for first 2 children
      reducedEntitlement: number; // 84 days (12 weeks) for 3rd+ child
      adoptionEntitlement: number; // 84 days for adoption (child < 3 months)
      surrogacyEntitlement: number; // 84 days for commissioning mother (surrogacy)
      trackingType: "calendar" | "working"; // Calendar includes weekends/holidays
      applicableGender: "Female" | "Male" | "All";
    };
    // LWP specific
    lwp?: {
      isUnlimited: boolean; // true = no balance tracking
      isFallback: boolean; // true = applied when other leaves exhausted
      showBalance: boolean; // false = don't show balance number
      autoTrigger: boolean; // true = auto-applied when no balance
    };
  };
}

export interface LeavePolicyVersion {
  version: string;
  effectiveDate: string;
  modifiedBy: string;
  modifiedOn: string;
  changelog: string[];
  policyData: LeaveTypePolicy[];
}

/**
 * CURRENT LEAVE POLICY (v1.0)
 * This is the single source of truth for all leave-related configurations
 */
export const CURRENT_LEAVE_POLICY: LeaveTypePolicy[] = [
  {
    type: "PL",
    name: "PL",
    fullName: "Privilege Leave",
    description: "Annual earned leave for planned vacations and personal time",
    icon: "🌿",
    
    probation: {
      enabled: false,
      annualQuota: 0,
      accrualRule: "Not applicable during probation",
      accrualDays: 0,
      accrualAmount: 0,
      carryForward: false,
      encashment: false,
      maxConsecutiveDays: 0,
    },
    
    confirmed: {
      enabled: true,
      annualQuota: 12,
      accrualRule: "1 leave credited after every 20 working days",
      accrualDays: 20,
      accrualAmount: 1,
      carryForward: true,
      carryForwardLimit: 700,
      encashment: true,
      encashmentRules: [
        "Mandatory payout at resignation/exit",
        "Optional yearly encashment allowed",
      ],
      maxConsecutiveDays: 3,
    },
    
    rules: {
      priorApprovalRequired: true,
      priorApprovalDays: 3,
      medicalCertificateRequired: false,
      medicalCertificateAfterDays: 0,
      canClubWith: ["SL"],
      cannotClubWith: ["CL"],
      canClubWithPublicHoliday: false,
      allowSandwiching: false,
    },
    
    salaryImpact: {
      isPaid: true,
    },
  },
  
  {
    type: "CSL",
    name: "CSL",
    fullName: "Casual / Sick Leave",
    description: "Combined leave for urgent matters and medical emergencies",
    icon: "📅",

    probation: {
      enabled: true,
      annualQuota: 0, // Not fixed, accrual-based
      accrualRule: "1 leave credited after every 20 working days",
      accrualDays: 20,
      accrualAmount: 1,
      carryForward: false,
      encashment: false,
      maxConsecutiveDays: 2,
    },

    confirmed: {
      enabled: true,
      annualQuota: 7,
      accrualRule: "Full quota available from day 1 post confirmation",
      accrualDays: 0,
      accrualAmount: 0,
      carryForward: false,
      carryForwardLimit: 0,
      encashment: false,
      encashmentRules: [],
      maxConsecutiveDays: 7,
    },

    rules: {
      priorApprovalRequired: false,
      priorApprovalDays: 0,
      medicalCertificateRequired: true,
      medicalCertificateAfterDays: 2,
      canClubWith: ["PL"],
      cannotClubWith: [],
      canClubWithPublicHoliday: true,
      allowSandwiching: true,
    },

    salaryImpact: {
      isPaid: true,
    },
  },

  {
    type: "COMP OFF",
    name: "COMP OFF",
    fullName: "Compensatory Off",
    description: "Earned by working on weekly offs or public holidays. Must be availed within 90 days.",
    icon: "⚡",

    probation: {
      enabled: true,
      annualQuota: 999, // No limit, earned based
      accrualRule: "Earned when working on WOFF/Public Holidays. Valid for 90 days from date of earning.",
      accrualDays: 0,
      accrualAmount: 0,
      carryForward: false, // Cannot carry forward, must use within 90 days
      encashment: false,
      maxConsecutiveDays: 3,
    },

    confirmed: {
      enabled: true,
      annualQuota: 999, // No limit, earned based
      accrualRule: "Earned when working on WOFF/Public Holidays. Valid for 90 days from date of earning.",
      accrualDays: 0,
      accrualAmount: 0,
      carryForward: false, // Cannot carry forward, must use within 90 days
      carryForwardLimit: 0,
      encashment: false,
      encashmentRules: [],
      maxConsecutiveDays: 5,
    },

    rules: {
      priorApprovalRequired: true,
      priorApprovalDays: 1,
      medicalCertificateRequired: false,
      medicalCertificateAfterDays: 0,
      canClubWith: ["PL", "CSL"],
      cannotClubWith: [],
      canClubWithPublicHoliday: true,
      allowSandwiching: true,
    },

    salaryImpact: {
      isPaid: true,
    },
  },

  {
    type: "MTL",
    name: "MTL",
    fullName: "Maternity Leave",
    description: "Statutory maternity benefit as per law",
    icon: "🤱",

    probation: {
      enabled: true,
      annualQuota: 182, // 26 weeks (182 days)
      accrualRule: "As per Maternity Benefit Act, 1961",
      accrualDays: 0,
      accrualAmount: 0,
      carryForward: false,
      encashment: false,
      maxConsecutiveDays: 182,
    },

    confirmed: {
      enabled: true,
      annualQuota: 182, // 26 weeks
      accrualRule: "As per Maternity Benefit Act, 1961",
      accrualDays: 0,
      accrualAmount: 0,
      carryForward: false,
      carryForwardLimit: 0,
      encashment: false,
      encashmentRules: [],
      maxConsecutiveDays: 182,
    },

    rules: {
      priorApprovalRequired: true,
      priorApprovalDays: 30,
      medicalCertificateRequired: true,
      medicalCertificateAfterDays: 0,
      canClubWith: [],
      cannotClubWith: ["PL", "CSL", "LWP"],
      canClubWithPublicHoliday: true,
      allowSandwiching: false,
      allowHalfDay: false,
      mustBeContinuous: true,
    },

    salaryImpact: {
      isPaid: true,
      deductionFormula: "Full salary as per Maternity Benefit Act",
    },

    specialRules: {
      maternity: {
        eligibilityDays: 80, // Must have worked 80 days in last 12 months
        standardEntitlement: 182, // 182 days (26 weeks) for first 2 children
        reducedEntitlement: 84, // 84 days (12 weeks) for 3rd+ child
        adoptionEntitlement: 84, // 84 days for adoption (child < 3 months)
        surrogacyEntitlement: 84, // 84 days for commissioning mother (surrogacy)
        trackingType: "calendar", // Calendar includes weekends/holidays
        applicableGender: "Female", // Applicable only to females
      },
    },
  },
  
  {
    type: "LWP",
    name: "LWP",
    fullName: "Leave Without Pay",
    description: "Unpaid leave when all other leave balances are exhausted",
    icon: "⏸️",

    probation: {
      enabled: true,
      annualQuota: 999, // No limit
      accrualRule: "Available when other leaves exhausted",
      accrualDays: 0,
      accrualAmount: 0,
      carryForward: false,
      encashment: false,
      maxConsecutiveDays: 30,
    },

    confirmed: {
      enabled: true,
      annualQuota: 999,
      accrualRule: "Available when other leaves exhausted",
      accrualDays: 0,
      accrualAmount: 0,
      carryForward: false,
      carryForwardLimit: 0,
      encashment: false,
      encashmentRules: [],
      maxConsecutiveDays: 30,
    },

    rules: {
      priorApprovalRequired: true,
      priorApprovalDays: 7,
      medicalCertificateRequired: false,
      medicalCertificateAfterDays: 0,
      canClubWith: [],
      cannotClubWith: [],
      canClubWithPublicHoliday: true,
      allowSandwiching: true,
    },

    salaryImpact: {
      isPaid: false,
      deductionFormula: "(Monthly Salary / 30) × LWP Days",
    },

    specialRules: {
      lwp: {
        isUnlimited: true, // true = no balance tracking
        isFallback: true, // true = applied when other leaves exhausted
        showBalance: false, // false = don't show balance number
        autoTrigger: true, // true = auto-applied when no balance
      },
    },
  },

  {
    type: "UPL",
    name: "UPL",
    fullName: "Unpaid Leave",
    description: "Unpaid leave for special circumstances",
    icon: "🚫",

    probation: {
      enabled: true,
      annualQuota: 999, // No limit
      accrualRule: "Available for special circumstances",
      accrualDays: 0,
      accrualAmount: 0,
      carryForward: false,
      encashment: false,
      maxConsecutiveDays: 30,
    },

    confirmed: {
      enabled: true,
      annualQuota: 999,
      accrualRule: "Available for special circumstances",
      accrualDays: 0,
      accrualAmount: 0,
      carryForward: false,
      carryForwardLimit: 0,
      encashment: false,
      encashmentRules: [],
      maxConsecutiveDays: 30,
    },

    rules: {
      priorApprovalRequired: true,
      priorApprovalDays: 7,
      medicalCertificateRequired: false,
      medicalCertificateAfterDays: 0,
      canClubWith: [],
      cannotClubWith: [],
      canClubWithPublicHoliday: true,
      allowSandwiching: true,
    },

    salaryImpact: {
      isPaid: false,
      deductionFormula: "(Monthly Salary / 30) × UPL Days",
    },

    specialRules: {
      lwp: {
        isUnlimited: true, // true = no balance tracking
        isFallback: false, // false = can be chosen explicitly
        showBalance: false, // false = don't show balance number
        autoTrigger: false, // false = must be requested explicitly
      },
    },
  },
];

/**
 * LEAVE POLICY VERSION HISTORY
 * Maintains complete audit trail of all policy changes
 */
export const LEAVE_POLICY_HISTORY: LeavePolicyVersion[] = [
  {
    version: "1.0",
    effectiveDate: "2026-04-01",
    modifiedBy: "Rajesh Patel (Super Admin)",
    modifiedOn: "2026-03-26",
    changelog: [
      "Initial leave policy configuration",
      "PL: 12 days/year, carry forward up to 700 days",
      "CL: 7 days/year during probation (accrual-based), 7 days/year post confirmation",
      "SL: Not applicable during probation, 7 days/year post confirmation",
      "LWP: Always available when other leaves exhausted",
    ],
    policyData: CURRENT_LEAVE_POLICY,
  },
];

/**
 * Get leave policy for specific leave type and employee status
 */
export function getLeavePolicy(leaveType: LeaveType, employeeStatus: EmployeeStatus): LeaveTypePolicy | null {
  const policy = CURRENT_LEAVE_POLICY.find(p => p.type === leaveType);
  if (!policy) return null;
  
  // Check if leave type is enabled for this employee status
  const settings = employeeStatus === "Probation" ? policy.probation : policy.confirmed;
  if (!settings.enabled && leaveType !== "LWP") return null;
  
  return policy;
}

/**
 * Get all available leave types for employee status
 */
export function getAvailableLeaveTypes(employeeStatus: EmployeeStatus): LeaveTypePolicy[] {
  return CURRENT_LEAVE_POLICY.filter(policy => {
    const settings = employeeStatus === "Probation" ? policy.probation : policy.confirmed;
    return settings.enabled;
  });
}

/**
 * Calculate annual leave quota for employee
 */
export function calculateAnnualQuota(leaveType: LeaveType, employeeStatus: EmployeeStatus): number {
  const policy = getLeavePolicy(leaveType, employeeStatus);
  if (!policy) return 0;
  
  const settings = employeeStatus === "Probation" ? policy.probation : policy.confirmed;
  return settings.annualQuota;
}

/**
 * Calculate prorated leave for mid-month joining
 */
export function calculateProratedLeave(
  leaveType: LeaveType,
  joiningDate: string,
  employeeStatus: EmployeeStatus
): number {
  const policy = getLeavePolicy(leaveType, employeeStatus);
  if (!policy) return 0;
  
  const joining = new Date(joiningDate);
  const yearEnd = new Date(joining.getFullYear(), 11, 31);
  const monthsRemaining = Math.ceil((yearEnd.getTime() - joining.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  const settings = employeeStatus === "Probation" ? policy.probation : policy.confirmed;
  const annualQuota = settings.annualQuota;
  
  // Prorated calculation
  return Math.round((annualQuota / 12) * monthsRemaining);
}

/**
 * Calculate LWP deduction amount
 */
export function calculateLWPDeduction(monthlySalary: number, lwpDays: number): number {
  return Math.round((monthlySalary / 30) * lwpDays);
}

/**
 * Validate leave clubbing rule - NO CLUBBING ALLOWED
 */
export function validateLeaveClubbing(params: {
  requestedLeaveType: LeaveType;
  requestedFromDate: string;
  requestedToDate: string;
  existingLeaves: Array<{
    leaveType: LeaveType;
    fromDate: string;
    toDate: string;
    status: string;
  }>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const reqFrom = new Date(params.requestedFromDate);
  const reqTo = new Date(params.requestedToDate);

  // Check each existing approved leave
  params.existingLeaves
    .filter(leave => leave.status === "Approved")
    .forEach(existingLeave => {
      // Skip if same leave type
      if (existingLeave.leaveType === params.requestedLeaveType) {
        return;
      }

      const existFrom = new Date(existingLeave.fromDate);
      const existTo = new Date(existingLeave.toDate);

      // Check if dates are adjacent (no working day gap)
      // Calculate days between end of one leave and start of another
      const daysBetween1 = Math.ceil((reqFrom.getTime() - existTo.getTime()) / (1000 * 60 * 60 * 24));
      const daysBetween2 = Math.ceil((existFrom.getTime() - reqTo.getTime()) / (1000 * 60 * 60 * 24));

      // If leaves are adjacent (within 1 day)
      if (daysBetween1 === 1 || daysBetween2 === 1) {
        const existEndDate = existTo.toLocaleDateString("en-IN");
        const reqStartDate = reqFrom.toLocaleDateString("en-IN");
        errors.push(
          `Leave types cannot be clubbed. Your ${existingLeave.leaveType} ends on ${existEndDate} and the requested ${params.requestedLeaveType} begins on ${reqStartDate}. Please ensure there is at least one working day gap between different leave types.`
        );
      }
    });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate prorated CL from confirmation date
 * CL accrual: 1.2 days/month, starts from confirmation date, credited on 1st of next month
 */
export function calculateProratedCL(confirmationDate: string): {
  proratedAmount: number;
  nextCreditDate: string;
  remainingDays: number;
  formula: string;
} {
  const confirmDate = new Date(confirmationDate);
  const year = confirmDate.getFullYear();
  const month = confirmDate.getMonth();

  // Get total days in the confirmation month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Get remaining days in the confirmation month (including confirmation date)
  const remainingDays = totalDaysInMonth - confirmDate.getDate() + 1;

  // Calculate prorated CL for first partial month
  const monthlyRate = 1.2;
  const proratedAmount = parseFloat(((remainingDays / totalDaysInMonth) * monthlyRate).toFixed(2));

  // Next credit date is 1st of next month
  const nextCreditDate = new Date(year, month + 1, 1);
  const nextCreditDateStr = nextCreditDate.toISOString().split("T")[0];

  // Formula display
  const formula = `(${remainingDays} remaining days ÷ ${totalDaysInMonth} days in month) × ${monthlyRate} = ${proratedAmount} days`;

  return {
    proratedAmount,
    nextCreditDate: nextCreditDateStr,
    remainingDays,
    formula,
  };
}

/**
 * Validate leave application against policy rules
 */
export function validateLeaveApplication(params: {
  leaveType: LeaveType;
  employeeStatus: EmployeeStatus;
  fromDate: string;
  toDate: string;
  currentBalance: number;
  hasPublicHolidayAdjacent?: boolean;
  medicalCertificateAttached?: boolean;
  employeeId?: string;
  existingLeaves?: Array<{
    leaveType: LeaveType;
    fromDate: string;
    toDate: string;
    status: string;
  }>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const policy = getLeavePolicy(params.leaveType, params.employeeStatus);

  if (!policy) {
    errors.push(`${params.leaveType} is not available for ${params.employeeStatus} employees`);
    return { valid: false, errors };
  }

  // Check global enablement for PL, CL, COMP OFF
  if (params.employeeId && (params.leaveType === "PL" || params.leaveType === "CL" || params.leaveType === "COMP OFF")) {
    if (!isLeaveTypeEnabledForEmployee(params.leaveType, params.employeeId)) {
      errors.push(`${params.leaveType} is currently disabled for this employee`);
      return { valid: false, errors };
    }
  }

  // Validate no-clubbing rule
  if (params.existingLeaves && params.existingLeaves.length > 0) {
    const clubbingValidation = validateLeaveClubbing({
      requestedLeaveType: params.leaveType,
      requestedFromDate: params.fromDate,
      requestedToDate: params.toDate,
      existingLeaves: params.existingLeaves,
    });

    if (!clubbingValidation.valid) {
      errors.push(...clubbingValidation.errors);
    }
  }

  const settings = params.employeeStatus === "Probation" ? policy.probation : policy.confirmed;

  // Calculate number of days
  const from = new Date(params.fromDate);
  const to = new Date(params.toDate);
  const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Check balance
  if (params.leaveType !== "LWP" && days > params.currentBalance) {
    errors.push(`Insufficient leave balance. Available: ${params.currentBalance} days, Requested: ${days} days`);
  }

  // Check max consecutive days
  if (days > settings.maxConsecutiveDays && settings.maxConsecutiveDays > 0) {
    errors.push(`Maximum ${settings.maxConsecutiveDays} consecutive days allowed for ${params.leaveType}`);
  }

  // Check medical certificate requirement
  if (policy.rules.medicalCertificateRequired &&
      days > policy.rules.medicalCertificateAfterDays &&
      !params.medicalCertificateAttached) {
    errors.push(`Medical certificate required for ${params.leaveType} > ${policy.rules.medicalCertificateAfterDays} days`);
  }

  // Check public holiday sandwiching
  if (!policy.rules.allowSandwiching && params.hasPublicHolidayAdjacent) {
    errors.push(`${params.leaveType} cannot be applied before/after public holidays`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get policy summary for display
 */
export function getLeavePolicySummary(): string {
  const version = LEAVE_POLICY_HISTORY[LEAVE_POLICY_HISTORY.length - 1];
  return `Leave Policy v${version.version} (Effective: ${version.effectiveDate})`;
}

/**
 * Generate leave policy document
 */
export function generateLeavePolicyDocument(): string {
  const version = LEAVE_POLICY_HISTORY[LEAVE_POLICY_HISTORY.length - 1];
  
  let document = `
CLEANCAR 360° - LEAVE POLICY
Version: ${version.version}
Effective Date: ${version.effectiveDate}
Last Modified: ${version.modifiedOn} by ${version.modifiedBy}

================================================================================
OVERVIEW
================================================================================

This document outlines the leave policy for all employees of CleanCar 360°.
The policy differentiates between employees in probation period and confirmed employees.

================================================================================
LEAVE POLICY DURING PROBATION
================================================================================

During probation period, employees have limited leave entitlements:
`;

  CURRENT_LEAVE_POLICY.forEach(policy => {
    if (policy.probation.enabled) {
      document += `\n${policy.icon} ${policy.fullName} (${policy.name})\n`;
      document += `   • Annual Quota: ${policy.probation.annualQuota > 100 ? 'No Limit' : policy.probation.annualQuota + ' days'}\n`;
      document += `   • Accrual: ${policy.probation.accrualRule}\n`;
      document += `   • Max Consecutive Days: ${policy.probation.maxConsecutiveDays}\n`;
      document += `   • Carry Forward: ${policy.probation.carryForward ? 'Yes' : 'No'}\n`;
      document += `   • Encashment: ${policy.probation.encashment ? 'Yes' : 'No'}\n`;
    } else {
      document += `\n${policy.icon} ${policy.fullName} (${policy.name}): NOT APPLICABLE\n`;
    }
  });

  document += `\n
================================================================================
LEAVE POLICY AFTER CONFIRMATION
================================================================================

Once confirmed, employees are eligible for full leave structure:
`;

  CURRENT_LEAVE_POLICY.forEach(policy => {
    if (policy.confirmed.enabled) {
      document += `\n${policy.icon} ${policy.fullName} (${policy.name})\n`;
      document += `   • Annual Quota: ${policy.confirmed.annualQuota > 100 ? 'No Limit' : policy.confirmed.annualQuota + ' days'}\n`;
      document += `   • Accrual: ${policy.confirmed.accrualRule}\n`;
      document += `   • Max Consecutive Days: ${policy.confirmed.maxConsecutiveDays}\n`;
      document += `   • Carry Forward: ${policy.confirmed.carryForward ? 'Yes (Max: ' + policy.confirmed.carryForwardLimit + ' days)' : 'No - Lapses at year end'}\n`;
      document += `   • Encashment: ${policy.confirmed.encashment ? 'Yes' : 'No'}\n`;
      
      if (policy.confirmed.encashmentRules.length > 0) {
        document += `   • Encashment Rules:\n`;
        policy.confirmed.encashmentRules.forEach(rule => {
          document += `     - ${rule}\n`;
        });
      }
      
      document += `\n   RULES:\n`;
      document += `   • Prior Approval: ${policy.rules.priorApprovalRequired ? 'Required (' + policy.rules.priorApprovalDays + ' days before)' : 'Not required'}\n`;
      
      if (policy.rules.medicalCertificateRequired) {
        document += `   • Medical Certificate: Required if > ${policy.rules.medicalCertificateAfterDays} days\n`;
      }
      
      if (policy.rules.canClubWith.length > 0) {
        document += `   • Can Club With: ${policy.rules.canClubWith.join(', ')}\n`;
      }
      
      if (policy.rules.cannotClubWith.length > 0) {
        document += `   • Cannot Club With: ${policy.rules.cannotClubWith.join(', ')}\n`;
      }
      
      document += `   • Public Holiday Clubbing: ${policy.rules.canClubWithPublicHoliday ? 'Allowed' : 'Not Allowed'}\n`;
      
      if (!policy.salaryImpact.isPaid) {
        document += `   • Salary Impact: ${policy.salaryImpact.deductionFormula}\n`;
      }
    }
  });

  document += `\n
================================================================================
APPROVAL WORKFLOW
================================================================================

All leave applications follow this approval workflow:
1. Employee submits leave application
2. Reporting Manager reviews and approves/rejects
3. HR has override capability for special cases

================================================================================
AUTO LWP TRIGGER
================================================================================

If an employee's leave balance reaches zero and they still need leave:
• The system will automatically suggest LWP
• LWP requires manager approval
• Salary deduction will be applied as per policy

================================================================================
YEAR-END CARRY FORWARD
================================================================================

At the end of each calendar year:
• PL: Carried forward up to maximum limit
• CL: Resets to 0 (no carry forward)
• SL: Resets to 0 (no carry forward)
• LWP: Not applicable

================================================================================
CHANGE LOG
================================================================================

${version.changelog.map((change, i) => `${i + 1}. ${change}`).join('\n')}

================================================================================
END OF DOCUMENT
================================================================================

This policy is subject to change. Employees will be notified of any updates.
For questions, please contact HR Department.
`;

  return document;
}