/**
 * ATTENDANCE PENALTY POLICY CONFIGURATION
 * System-driven PL adjustments for attendance violations
 * 
 * CORE PRINCIPLE:
 * - PLRG/HPLRG are NOT separate leave types
 * - They are automatic deductions from PL balance
 * - PLRG = 1 day deduction, HPLRG = 0.5 day deduction
 * - If PL = 0, converts to LWP with salary deduction
 */

export type PenaltyType = "PLRG" | "HPLRG" | "LWP_PENALTY";

export type ViolationType = 
  | "LATE_COMING"
  | "MISS_PUNCH"
  | "SHORT_HOURS"
  | "EARLY_DEPARTURE"
  | "UNAUTHORIZED_ABSENCE";

export interface AttendanceViolation {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  violationType: ViolationType;
  details: string;
  penaltyApplied: PenaltyType;
  penaltyDays: number; // 0.5 or 1
  plBalanceBefore: number;
  plBalanceAfter: number;
  convertedToLWP: boolean;
  status: "Pending" | "Applied" | "Waived" | "Overridden";
  appliedBy: string;
  appliedOn: string;
  waivedBy?: string;
  waivedOn?: string;
  waiverReason?: string;
  hrNotes?: string;
}

export interface PenaltyRule {
  violationType: ViolationType;
  threshold: number; // Number of occurrences before penalty
  penaltyDays: number; // 0.5 or 1
  penaltyType: PenaltyType;
  description: string;
  resetPeriod: "Daily" | "Weekly" | "Monthly";
}

/**
 * ATTENDANCE PENALTY RULES
 * Configurable thresholds and penalties
 */
export const ATTENDANCE_PENALTY_RULES: PenaltyRule[] = [
  {
    violationType: "LATE_COMING",
    threshold: 3,
    penaltyDays: 0.5,
    penaltyType: "HPLRG",
    description: "3 late marks in a month = 0.5 day deduction (HPLRG)",
    resetPeriod: "Monthly",
  },
  {
    violationType: "LATE_COMING",
    threshold: 6,
    penaltyDays: 1,
    penaltyType: "PLRG",
    description: "6 late marks in a month = 1 day deduction (PLRG)",
    resetPeriod: "Monthly",
  },
  {
    violationType: "MISS_PUNCH",
    threshold: 1,
    penaltyDays: 0.5,
    penaltyType: "HPLRG",
    description: "1 miss punch = 0.5 day deduction (HPLRG)",
    resetPeriod: "Daily",
  },
  {
    violationType: "MISS_PUNCH",
    threshold: 3,
    penaltyDays: 1,
    penaltyType: "PLRG",
    description: "3 miss punches in a month = 1 day deduction (PLRG)",
    resetPeriod: "Monthly",
  },
  {
    violationType: "SHORT_HOURS",
    threshold: 1,
    penaltyDays: 0.5,
    penaltyType: "HPLRG",
    description: "Working < 4.5 hours = 0.5 day deduction (HPLRG)",
    resetPeriod: "Daily",
  },
  {
    violationType: "EARLY_DEPARTURE",
    threshold: 2,
    penaltyDays: 0.5,
    penaltyType: "HPLRG",
    description: "2 early departures in a month = 0.5 day deduction (HPLRG)",
    resetPeriod: "Monthly",
  },
  {
    violationType: "UNAUTHORIZED_ABSENCE",
    threshold: 1,
    penaltyDays: 1,
    penaltyType: "PLRG",
    description: "Unauthorized absence = 1 day deduction (PLRG)",
    resetPeriod: "Daily",
  },
];

/**
 * POLICY CONFIGURATION
 */
export const ATTENDANCE_POLICY_CONFIG = {
  // Late Coming
  lateComing: {
    gracePeriodMinutes: 15, // Up to 15 mins is grace
    lateThresholdMinutes: 16, // 16+ mins = late mark
    monthlyThreshold: 3, // 3 late marks triggers penalty
  },

  // Miss Punch
  missPunch: {
    autoMarkAsHalfDay: true,
    requiresHRApproval: true,
  },

  // Working Hours
  workingHours: {
    minimumFullDay: 9, // 9 hours for full day
    minimumHalfDay: 4.5, // 4.5 hours for half day
  },

  // Penalty Conversion
  penaltyConversion: {
    convertToLWPIfNoPL: true, // Auto convert to LWP if PL = 0
    allowHRWaiver: true, // HR can waive penalties
    notifyEmployee: true, // Send notification when penalty applied
  },
};

/**
 * Get penalty for violation type and count
 */
export function calculatePenalty(
  violationType: ViolationType,
  count: number
): { penaltyDays: number; penaltyType: PenaltyType } | null {
  // Get applicable rules for this violation type
  const rules = ATTENDANCE_PENALTY_RULES
    .filter(rule => rule.violationType === violationType)
    .sort((a, b) => b.threshold - a.threshold); // Highest threshold first

  // Find the first rule where count meets threshold
  for (const rule of rules) {
    if (count >= rule.threshold) {
      return {
        penaltyDays: rule.penaltyDays,
        penaltyType: rule.penaltyType,
      };
    }
  }

  return null; // No penalty applicable
}

/**
 * Get violation description
 */
export function getViolationDescription(type: ViolationType): string {
  const descriptions: Record<ViolationType, string> = {
    LATE_COMING: "Late Coming (>15 mins after shift start)",
    MISS_PUNCH: "Missing IN/OUT Punch",
    SHORT_HOURS: "Short Working Hours (<4.5 hrs)",
    EARLY_DEPARTURE: "Early Departure (before shift end)",
    UNAUTHORIZED_ABSENCE: "Unauthorized Absence",
  };
  return descriptions[type];
}

/**
 * Get penalty type display name
 */
export function getPenaltyTypeDisplay(type: PenaltyType): string {
  const displays: Record<PenaltyType, string> = {
    PLRG: "PLRG (1 Day)",
    HPLRG: "HPLRG (0.5 Day)",
    LWP_PENALTY: "LWP (No PL)",
  };
  return displays[type];
}

/**
 * Validate if penalty should be applied
 */
export function shouldApplyPenalty(
  violationType: ViolationType,
  currentMonthCount: number,
  employeePLBalance: number
): {
  shouldApply: boolean;
  penaltyDays: number;
  penaltyType: PenaltyType;
  convertToLWP: boolean;
  reason: string;
} {
  const penalty = calculatePenalty(violationType, currentMonthCount);

  if (!penalty) {
    return {
      shouldApply: false,
      penaltyDays: 0,
      penaltyType: "HPLRG",
      convertToLWP: false,
      reason: "Threshold not met",
    };
  }

  // Check if PL balance is sufficient
  const hasSufficientPL = employeePLBalance >= penalty.penaltyDays;

  if (!hasSufficientPL && ATTENDANCE_POLICY_CONFIG.penaltyConversion.convertToLWPIfNoPL) {
    return {
      shouldApply: true,
      penaltyDays: penalty.penaltyDays,
      penaltyType: "LWP_PENALTY",
      convertToLWP: true,
      reason: `Insufficient PL balance (${employeePLBalance} days). Converting to LWP.`,
    };
  }

  return {
    shouldApply: true,
    penaltyDays: penalty.penaltyDays,
    penaltyType: penalty.penaltyType,
    convertToLWP: false,
    reason: `${getViolationDescription(violationType)} - ${currentMonthCount} occurrences`,
  };
}

/**
 * Format penalty for display
 */
export function formatPenaltyDisplay(penalty: AttendanceViolation): string {
  const typeDisplay = getViolationDescription(penalty.violationType);
  const penaltyDisplay = getPenaltyTypeDisplay(penalty.penaltyApplied);
  
  return `${typeDisplay} → ${penaltyDisplay}`;
}

/**
 * Get monthly penalty summary
 */
export function getMonthlySummary(violations: AttendanceViolation[]): {
  totalPenaltyDays: number;
  plrgCount: number;
  hplrgCount: number;
  lwpPenaltyCount: number;
  waivedCount: number;
} {
  const applied = violations.filter(v => v.status === "Applied");
  const waived = violations.filter(v => v.status === "Waived");

  return {
    totalPenaltyDays: applied.reduce((sum, v) => sum + v.penaltyDays, 0),
    plrgCount: applied.filter(v => v.penaltyApplied === "PLRG").length,
    hplrgCount: applied.filter(v => v.penaltyApplied === "HPLRG").length,
    lwpPenaltyCount: applied.filter(v => v.convertedToLWP).length,
    waivedCount: waived.length,
  };
}

/**
 * Generate policy document
 */
export function generateAttendancePenaltyPolicy(): string {
  return `
================================================================================
CLEANCAR 360° - ATTENDANCE PENALTY POLICY
================================================================================

This policy outlines automatic PL adjustments for attendance violations.

CORE PRINCIPLE:
• PLRG/HPLRG are NOT separate leave types
• They are automatic deductions from Privilege Leave (PL) balance
• If PL balance is insufficient, penalty converts to LWP with salary deduction

================================================================================
PENALTY TYPES
================================================================================

PLRG  - Privilege Leave Reduced (Full Day = 1.0)
HPLRG - Half Privilege Leave Reduced (Half Day = 0.5)
LWP   - Leave Without Pay (when PL = 0)

================================================================================
VIOLATION RULES
================================================================================

${ATTENDANCE_PENALTY_RULES.map((rule, i) => `
${i + 1}. ${getViolationDescription(rule.violationType)}
   Threshold: ${rule.threshold} occurrence(s)
   Penalty: ${rule.penaltyDays} day(s) (${rule.penaltyType})
   Reset: ${rule.resetPeriod}
   Description: ${rule.description}
`).join('\n')}

================================================================================
SYSTEM BEHAVIOR
================================================================================

CASE 1: PL Balance Available
• System deducts from PL balance automatically
• No salary impact
• Adjustment shown in leave card

CASE 2: PL Balance = 0
• System converts penalty to LWP
• Salary deduction applied: (Monthly Salary / 30) × Penalty Days
• Employee notified

================================================================================
HR OVERRIDE
================================================================================

HR can:
• View all pending penalties
• Waive penalties with justification
• Override automatic conversion
• Add manual adjustments

================================================================================
EMPLOYEE VISIBILITY
================================================================================

Employees can view:
• Violation history
• Penalties applied
• Current month violations
• PL balance adjustments
• LWP conversions

================================================================================
END OF POLICY
================================================================================
`;
}
