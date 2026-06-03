/**
 * Incentive Engine - Type Definitions
 * System-controlled earnings logic with zero washer manipulation
 */

// Eligibility Status (Extended with edge cases)
export type IncentiveEligibilityStatus =
  | "NOT_ELIGIBLE"
  | "ELIGIBLE"
  | "OUTSIDE_BAND"
  | "LATE_PENALTY"
  | "WEEK_OFF"
  | "COVER_DAY";

// Time Band Status
export type TimeBandStatus = "ACTIVE" | "CLOSED";

// Time Band
export interface TimeBand {
  id: string;
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive: boolean;
}

// Incentive Configuration (Backend-driven, NO hardcoding)
export interface IncentiveConfig {
  baseQuota: number; // From backend - NOT hardcoded
  maxDailyLimit: number; // Max units per day - from backend
  incentivePerUnit: number; // ₹ per unit after base - from backend
  timeBands: TimeBand[]; // From backend
  addOnRates: Record<string, number>; // Service name -> ₹ rate - from backend
  monthlyBaseTarget: number; // For monthly potential calc - from backend
  avgWorkingDaysPerMonth: number; // For monthly potential calc - from backend
}

// Washer Progress
export interface WasherProgress {
  // Base Units
  baseUnitsCompleted: number;
  baseUnitsTarget: number;
  isBaseComplete: boolean;

  // Incentive Units (after base)
  incentiveUnitsCompleted: number;
  incentiveUnitsInBand: number; // Units earning
  incentiveUnitsOutOfBand: number; // Units not earning

  // Add-ons (system-assigned only)
  addOnsCompleted: number;

  // Earnings (calculated by system)
  totalEarnings: number;
  todayEarnings: number; // Today's total
  monthlyEarnings: number; // Month-to-date
  baseEarnings: number;
  incentiveEarnings: number;
  addOnEarnings: number;

  // Eligibility
  eligibilityStatus: IncentiveEligibilityStatus;
  isInTimeBand: boolean;
  currentTimeBand: TimeBand | null;
  timeBandStatus: TimeBandStatus;

  // Limits
  totalUnitsToday: number;
  maxDailyLimit: number;
  isNearLimit: boolean; // 80% of max
  isAtLimit: boolean; // Reached max
  unitsUntilLimit: number;

  // Blocked Info (for transparency)
  unitsOutsideBand: number; // Units completed but not earning

  // Edge Cases
  isLateCheckIn: boolean;
  isWeekOff: boolean;
  isCoverDay: boolean;
  penaltyReason?: string;
}

// Add-on Service (Pre-assigned ONLY)
export interface AddOnService {
  id: string;
  serviceCode: string;
  serviceName: string;
  description: string;

  // Assignment (NOT washer-initiated)
  isAssigned: boolean;
  assignedBy: "SYSTEM" | "TELECALLER" | "ADMIN" | "SUPERVISOR";
  assignedAt: string;
  assignmentReason: string;

  // Execution
  isCompleted: boolean;
  completedAt?: string;

  // Earnings (system-calculated)
  earningAmount: number;
  isEarningEligible: boolean;

  // Visual identifier
  badge: string; // "Add-on Service"
  color: string; // Different color for UI
}

// Job with Incentive Info
export interface IncentiveEligibleJob {
  jobId: string;
  vehicleRegNo: string;
  packageType: string;
  isIncentiveEligible: boolean; // TRUE after base completion
  addOns: AddOnService[]; // Pre-assigned add-ons only
  estimatedEarnings: number; // System-calculated
}

// Incentive Tracker State
export interface IncentiveTrackerState {
  config: IncentiveConfig;
  progress: WasherProgress;

  // UI States
  progressBarPercent: number;
  progressMessage: string;
  eligibilityBadge: {
    text: string;
    color: string;
    icon: string;
  };

  // Time Band Status
  timeBandIndicator: {
    status: TimeBandStatus;
    color: string;
    icon: string;
    message: string;
  };

  // Messages (NO calculation logic exposed)
  displayMessages: {
    belowBase?: string;
    outsideBand?: string;
    ineligible?: string;
    eligible?: string;
    weekOff?: string;
    latePenalty?: string;
    coverDay?: string;
    nearLimit?: string;
    atLimit?: string;
  };

  // Monthly Potential (Dynamic)
  monthlyPotential: {
    estimated: number;
    isRealistic: boolean;
    note: string;
  };

  // Animation Triggers
  shouldAnimateUnlock: boolean;
  shouldAnimateEarning: boolean;
}

// Job Visibility Control
export interface JobVisibilityControl {
  baseJobsVisible: boolean;
  incentiveJobsVisible: boolean; // Only after base completion
  incentiveJobsCount: number;
  unlockMessage: string;
}

// Earnings Breakdown (View-only for washer)
export interface EarningsBreakdown {
  // What washer sees
  totalUnits: number;
  totalEarnings: number;

  // Breakdown (simplified)
  breakdown: {
    baseUnits: number;
    incentiveUnits: number;
    addOnServices: number;
  };

  // What washer DOES NOT see
  // - Per unit rate
  // - Formula
  // - Calculation logic
}

// System Event Log (for admin/supervisor only)
export interface IncentiveEventLog {
  id: string;
  washerId: string;
  eventType:
    | "BASE_COMPLETE"
    | "INCENTIVE_UNIT"
    | "ADD_ON_ASSIGNED"
    | "ADD_ON_COMPLETED"
    | "BAND_ENTERED"
    | "BAND_EXITED"
    | "UNIT_OUTSIDE_BAND";
  timestamp: string;
  details: string;
  earningsImpact: number;
}

// Validation Result
export interface IncentiveValidation {
  canEarn: boolean;
  blockingReasons: string[];
  warnings: string[];
}
