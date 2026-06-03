// TSM incentive values — see incentiveStructureV6.ts TSM_PERSONAL_3M, TSM_CONVERSION_BONUS etc.
/**
 * Tele Sales Manager Constants
 * Centralized configuration values and thresholds for TSM module
 */

// SLA Thresholds (in minutes)
export const SLA_THRESHOLDS = {
  FIRST_CALL: 10,
  CRM_UPDATE: 30,
  CALLBACK_RESPONSE: 60,
} as const;

// Attempt Limits
export const ATTEMPT_LIMITS = {
  MAX_ATTEMPTS: 15,
  WARNING_THRESHOLD: 10,
} as const;

// Conversion Rate Thresholds (percentage)
// TSM Target: 18-25% (per workflow document)
export const CONVERSION_THRESHOLDS = {
  TARGET: 22, // Team target: mid-point of 18-25% range
  WARNING: 18, // Lower bound of acceptable range
  CRITICAL: 15, // Below TSE minimum (15-18%)
} as const;

// EBITDA Thresholds (percentage)
// EBITDA floor: ≥ 30% on every deal (per workflow document)
export const EBITDA_THRESHOLDS = {
  FLOOR: 30, // Non-negotiable minimum
  SAFE: 35, // Healthy margin
  WARNING: 32, // Approaching floor
} as const;

// Renewal Rate Thresholds (percentage)
export const RENEWAL_THRESHOLDS = {
  TARGET: 70,
  WARNING: 60,
  CRITICAL: 50,
} as const;

// CRM Compliance Thresholds (percentage)
// CRM update compliance: 100% (non-negotiable per workflow document)
export const CRM_COMPLIANCE_THRESHOLDS = {
  TARGET: 100, // Non-negotiable requirement
  WARNING: 95, // Any drop triggers immediate alert
  CRITICAL: 90, // Incentive eligibility at risk
} as const;

// Revenue Achievement Thresholds (percentage)
export const REVENUE_THRESHOLDS = {
  ON_TRACK: 100,
  WARNING: 85,
  CRITICAL: 80,
} as const;

// Bundle Mix Thresholds (percentage)
export const BUNDLE_MIX_THRESHOLDS = {
  LOW_BUNDLE_WARNING: 30,
  LOW_BUNDLE_CRITICAL: 40,
} as const;

// Alert Auto-Escalation Times (in minutes)
export const AUTO_ESCALATION_TIMES = {
  CRITICAL: 30,
  WARNING: 120,
  INFO: 480,
} as const;

// UI Refresh Intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  ALERTS: 30000, // 30 seconds
  METRICS: 60000, // 1 minute
  DASHBOARD: 120000, // 2 minutes
} as const;

// Maximum Items to Display
export const DISPLAY_LIMITS = {
  VISIBLE_ALERTS: 5,
  LEADS_PER_PAGE: 25,
  AUDIT_ENTRIES_PER_PAGE: 20,
  RENEWALS_PER_PAGE: 30,
} as const;

// Time Mode Hours
export const TIME_MODE_HOURS = {
  MORNING_START: 9,
  MORNING_END: 12,
  MIDDAY_START: 12,
  MIDDAY_END: 15,
  AFTERNOON_START: 15,
  AFTERNOON_END: 18,
  EVENING_START: 18,
  EVENING_END: 20,
} as const;

// Deal Value Defaults (in rupees)
export const DEAL_VALUE_DEFAULTS = {
  AVERAGE: 25000,
  BASE_MIN: 15000,
  BUNDLE_MID_MIN: 30000,
  BUNDLE_LOW_MIN: 20000,
} as const;

// Lead Source Labels
export const LEAD_SOURCE_LABELS = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  MARKETING: "Marketing",
  WALK_IN: "Walk-In",
  OTHER: "Other",
} as const;

// Deal Type Labels
export const DEAL_TYPE_LABELS = {
  BASE: "Base",
  ADD_ON: "Add-On",
  BUNDLE_MID: "Bundle MID",
  BUNDLE_LOW: "Bundle LOW",
} as const;

// Status Health Colors
export const STATUS_COLORS = {
  GREEN: {
    bg: "bg-green-600",
    border: "border-green-600",
    text: "text-green-600",
  },
  AMBER: {
    bg: "bg-amber-600",
    border: "border-amber-600",
    text: "text-amber-600",
  },
  RED: {
    bg: "bg-red-600",
    border: "border-red-600",
    text: "text-red-600",
  },
} as const;

// Severity Colors
export const SEVERITY_COLORS = {
  CRITICAL: {
    bg: "bg-red-600",
    border: "border-red-500",
    cardBg: "bg-red-50",
  },
  WARNING: {
    bg: "bg-amber-600",
    border: "border-amber-500",
    cardBg: "bg-amber-50",
  },
  INFO: {
    bg: "bg-blue-600",
    border: "border-blue-500",
    cardBg: "bg-blue-50",
  },
} as const;

// Touch Target Minimum Size (for mobile accessibility)
export const TOUCH_TARGET_MIN_SIZE = 44; // pixels

// Grid System
export const GRID_UNIT = 8; // pixels (8px grid system)

// ============================================
// TSM INCENTIVE STRUCTURE (per workflow document)
// ============================================

// Fixed Salary Range (in rupees)
export const TSM_SALARY = {
  MIN: 35000,
  MAX: 50000,
  TYPICAL: 42500, // Mid-point
} as const;

// Team Revenue Bonus Tiers (in rupees)
export const TEAM_REVENUE_BONUS = {
  TIER_1: { threshold: 1000000, bonus: 10000 }, // ₹10L → ₹10K
  TIER_2: { threshold: 1500000, bonus: 20000 }, // ₹15L → ₹20K
  TIER_3: { threshold: 2000000, bonus: 40000 }, // ₹20L+ → ₹40K
} as const;

// Conversion Bonus
export const CONVERSION_BONUS = {
  THRESHOLD: 22, // Team conversion rate > 22%
  AMOUNT: 15000, // ₹15K bonus
} as const;

// Renewal Bonus
export const RENEWAL_BONUS = {
  THRESHOLD: 75, // Team renewal rate > 75%
  AMOUNT: 10000, // ₹10K bonus
} as const;

// Maximum Variable Potential
export const TSM_VARIABLE = {
  MAX_MONTHLY: 65000, // Maximum ₹65K/month
  MAX_TOTAL_CTC: 115000, // ₹50K fixed + ₹65K variable
} as const;

// Incentive Eligibility Rules
export const INCENTIVE_ELIGIBILITY = {
  CRM_COMPLIANCE_MIN: 100, // Team must maintain 100% CRM compliance
  CRM_PENALTY_PERCENT: 20, // 20% reduction if compliance < 100%
  EBITDA_BREACH_FORFEIT: true, // Forfeit incentive on EBITDA bypass
} as const;
