/**
 * OPERATIONS MANAGER - CONSTANTS
 * Configuration and static data for OM module
 */

import type { TimeModeConfig } from "../types/operationsManager.types";

// ============================================
// TIME MODE CONFIGURATIONS
// ============================================

export const TIME_MODE_CONFIGS: TimeModeConfig[] = [
  {
    mode: "PRE_DAY",
    startHour: 0,
    endHour: 10,
    displayName: "Pre-Day Preview",
    description: "Plan your day based on projections",
    primaryColor: "indigo"
  },
  {
    mode: "PERFORMANCE_REVIEW",
    startHour: 10,
    endHour: 12,
    displayName: "Performance Review",
    description: "Review team performance and clear approvals",
    primaryColor: "blue"
  },
  {
    mode: "FIELD_MODE",
    startHour: 12,
    endHour: 17,
    displayName: "Field Mode",
    description: "Execute field visits and customer interactions",
    primaryColor: "green"
  },
  {
    mode: "TEAM_REVIEW",
    startHour: 17,
    endHour: 18,
    displayName: "Team Review",
    description: "Review team performance and plan next day",
    primaryColor: "purple"
  },
  {
    mode: "DAY_CLOSE",
    startHour: 19,
    endHour: 23,
    displayName: "Day Close",
    description: "Close day operations and sign off",
    primaryColor: "gray"
  }
];

// ============================================
// UNIT CONTROL LIMITS
// ============================================

export const UNIT_CONTROL = {
  MIN_TARGET: 25,
  MAX_CAPACITY: 33,
  DEFAULT_COVER_LIMIT: 5,
  MAX_COVER_WITH_OM_OVERRIDE: 8,
  MAX_COVER_WITH_CM_APPROVAL: 15
} as const;

// ============================================
// DISCOUNT AUTHORITY LIMITS
// ============================================

export const DISCOUNT_LIMITS = {
  OM_AUTHORITY: 15, // Percentage
  CITY_MANAGER_AUTHORITY: 25, // Percentage
  HEAD_OFFICE_APPROVAL_REQUIRED: 25 // Above this requires HO approval
} as const;

// ============================================
// SLA TIMINGS (in minutes)
// ============================================

export const SLA_TIMINGS = {
  COMPLAINT_ACKNOWLEDGEMENT: 15,
  COMPLAINT_RESOLUTION: 120,
  ESCALATION_RESPONSE: 120,
  CHURN_RISK_CONTACT: 1440, // 24 hours
  PIPELINE_STAGNATION: 14400 // 10 days
} as const;

// ============================================
// KPI WEIGHTS
// ============================================

export const KPI_WEIGHTS = {
  REVENUE: 40,
  CONVERSION: 20,
  RETENTION: 20,
  OPERATIONS: 10,
  CX: 10
} as const;

// ============================================
// KPI SCORE BANDS
// ============================================

export const KPI_SCORE_BANDS = {
  EXCELLENT: { min: 100, score: 100 },
  GOOD: { min: 90, max: 99.99, score: 70 },
  POOR: { min: 0, max: 89.99, score: 0 }
} as const;

// ============================================
// TEAM BONUS CONDITIONS
// ============================================

export const TEAM_BONUS = {
  REVENUE_THRESHOLD: 100, // Percentage
  RETENTION_THRESHOLD: 80, // Percentage
  BONUS_PERCENTAGE: 20 // Additional bonus
} as const;

// ============================================
// PAYROLL TIMELINE
// ============================================

export const PAYROLL_TIMELINE = {
  KPI_CALCULATION_DAY: "Month-End Midnight",
  INCENTIVE_VISIBLE_DAY: "2nd of Next Month",
  PAYROLL_APPLIED_DAY: "5th of Next Month"
} as const;

// ============================================
// VISIBILITY LEVELS
// ============================================

export const VISIBILITY_LEVELS = {
  OM_ONLY: ["OM"],
  CITY_LEVEL: ["OM", "City Manager"],
  HEAD_OFFICE: ["OM", "City Manager", "Head Office", "HR", "Finance"],
  FULL_AUDIT: ["OM", "City Manager", "Head Office", "HR", "Finance", "Audit Team"]
} as const;

// ============================================
// DATA LOCK MODULES
// ============================================

export const LOCKABLE_MODULES = [
  "Attendance",
  "Units",
  "Revenue",
  "Incentives",
  "Payroll",
  "KPI Scores",
  "Performance Data",
  "Financial Reports"
] as const;

// ============================================
// ESCALATION APPROVAL AUTHORITY
// ============================================

export const ESCALATION_AUTHORITY = {
  OM_CAN_APPROVE: [
    "ATTENDANCE_OVERRIDE",
    "INCENTIVE_OVERRIDE",
    "COMPLAINT_ESCALATION",
    "QUALITY_ISSUE"
  ],
  REQUIRES_CITY_MANAGER: [
    "VEHICLE_DAMAGE",
    "BATCH_INVALIDATION",
    "POLICY_EXCEPTION"
  ],
  COVER_REASSIGNMENT_CM_THRESHOLD: 8 // Units - above this needs CM approval
} as const;

// ============================================
// PRIORITY ORDER (for sorting)
// ============================================

export const PRIORITY_ORDER = {
  CRITICAL: 0,
  MEDIUM: 1,
  LOW: 2
} as const;

// ============================================
// PIPELINE STAGNATION
// ============================================

export const PIPELINE_RULES = {
  NEGOTIATION_STAGNATION_DAYS: 10,
  FOLLOW_UP_REQUIRED_DAYS: 7,
  PROSPECT_EXPIRY_DAYS: 30
} as const;

// ============================================
// DEFAULT GPS LOCATION (for mock data)
// ============================================

export const DEFAULT_LOCATION = {
  LAT: 23.0225,
  LNG: 72.5714,
  CITY: "Gandhinagar"
} as const;

// ============================================
// ACTOR ID (temporary for development)
// ============================================

export const CURRENT_OM_ID = "OM-001" as const;