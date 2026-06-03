/**
 * CLUSTER MANAGER - CONSTANTS & BUSINESS RULES
 * Configuration for control tower interface
 */

import type { CMTimeModeConfig } from "../types/clusterManager.types";

// ============================================
// CLUSTER MANAGER IDENTITY
// ============================================

export const CURRENT_CM_ID = "CM-001";
export const CURRENT_CM_NAME = "Priya Sharma";
export const CLUSTER_NAME = "Gujarat Central Cluster";
export const CLUSTER_LOCATIONS = ["Ahmedabad", "Gandhinagar", "Surat", "Vadodara"];

// ============================================
// KPI TARGETS & THRESHOLDS
// ============================================

export const KPI_TARGETS = {
  REVENUE_MTD: 12000000, // ₹1.2 Cr per month per cluster
  UNITS_PER_WASHER_DAY: 25,
  CONVERSION_RATE: 45, // percentage
  RETENTION_RATE: 85, // percentage
  COMPLIANCE_SCORE: 90, // out of 100
};

export const KPI_THRESHOLDS = {
  REVENUE: {
    GREEN: 95, // >= 95% of target
    AMBER: 80, // >= 80% of target
    RED: 0,    // < 80% of target
  },
  UNITS: {
    GREEN: 95,
    AMBER: 85,
    RED: 0,
  },
  CONVERSION: {
    GREEN: 95,
    AMBER: 85,
    RED: 0,
  },
  RETENTION: {
    GREEN: 95,
    AMBER: 85,
    RED: 0,
  },
  COMPLIANCE: {
    GREEN: 90,
    AMBER: 75,
    RED: 0,
  },
};

// ============================================
// ESCALATION RULES
// ============================================

export const ESCALATION_SLA = {
  COMPLAINT_ACKNOWLEDGEMENT: 15, // minutes
  COMPLAINT_RESOLUTION: 120, // minutes
  CRITICAL_RESPONSE: 30, // minutes
  HIGH_RESPONSE: 60, // minutes
  MEDIUM_RESPONSE: 240, // minutes
};

export const ESCALATION_PRIORITIES = {
  CRITICAL: {
    label: "Critical",
    color: "bg-red-600",
    textColor: "text-red-600",
    borderColor: "border-red-600",
    autoEscalateAfter: 60, // minutes
  },
  HIGH: {
    label: "High",
    color: "bg-orange-600",
    textColor: "text-orange-600",
    borderColor: "border-orange-600",
    autoEscalateAfter: 120,
  },
  MEDIUM: {
    label: "Medium",
    color: "bg-yellow-600",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-600",
    autoEscalateAfter: 240,
  },
  LOW: {
    label: "Low",
    color: "bg-blue-600",
    textColor: "text-blue-600",
    borderColor: "border-blue-600",
    autoEscalateAfter: 480,
  },
};

// ============================================
// PERFORMANCE STATUS
// ============================================

export const HEALTH_STATUS = {
  GREEN: {
    label: "Healthy",
    color: "bg-green-600",
    textColor: "text-green-600",
    borderColor: "border-green-600",
    dotColor: "bg-green-500",
  },
  AMBER: {
    label: "At Risk",
    color: "bg-amber-600",
    textColor: "text-amber-600",
    borderColor: "border-amber-600",
    dotColor: "bg-amber-500",
  },
  RED: {
    label: "Critical",
    color: "bg-red-600",
    textColor: "text-red-600",
    borderColor: "border-red-600",
    dotColor: "bg-red-500",
  },
};

// ============================================
// TIME-BASED MODES
// ============================================

export const CM_TIME_MODE_CONFIGS: CMTimeModeConfig[] = [
  {
    mode: "PRE_DAY",
    startHour: 20,
    endHour: 24,
    label: "Pre-Day Planning",
    color: "bg-indigo-600",
    priorities: [
      "Next-day projections",
      "OM revenue trajectory",
      "Coverage/capacity flags",
      "Churn risk preview",
    ],
  },
  {
    mode: "MORNING_REVIEW",
    startHour: 10,
    endHour: 11.5,
    label: "Morning Review",
    color: "bg-blue-600",
    priorities: [
      "Attendance issues",
      "Previous day performance",
      "Pending escalations",
      "OM status check",
    ],
  },
  {
    mode: "FIELD_MODE",
    startHour: 11.5,
    endHour: 15,
    label: "Field Mode",
    color: "bg-green-600",
    priorities: [
      "Quick access to OM profiles",
      "Audit logging",
      "GPS tracking",
      "Minimal UI",
    ],
  },
  {
    mode: "PROBLEM_SOLVING",
    startHour: 15,
    endHour: 17,
    label: "Problem Solving",
    color: "bg-orange-600",
    priorities: [
      "Underperforming OMs",
      "Unit gaps analysis",
      "Critical escalations",
      "Intervention planning",
    ],
  },
  {
    mode: "PLANNING",
    startHour: 17,
    endHour: 20,
    label: "Planning Mode",
    color: "bg-purple-600",
    priorities: [
      "Next-day coverage",
      "Leave conflicts",
      "Report generation",
      "Strategic planning",
    ],
  },
];

// ============================================
// PIPELINE STAGES
// ============================================

export const PIPELINE_STAGES = {
  PROSPECT: { label: "Prospect", color: "bg-slate-400" },
  DEMO_SCHEDULED: { label: "Demo Scheduled", color: "bg-blue-400" },
  DEMO_DONE: { label: "Demo Done", color: "bg-indigo-400" },
  NEGOTIATION: { label: "Negotiation", color: "bg-purple-400" },
  CLOSED_WON: { label: "Closed Won", color: "bg-green-500" },
  CLOSED_LOST: { label: "Closed Lost", color: "bg-red-400" },
};

export const STALLED_PIPELINE_THRESHOLD = 10; // days

// ============================================
// CHURN RISK LEVELS
// ============================================

export const CHURN_RISK_LEVELS = {
  HIGH: {
    label: "High Risk",
    color: "bg-red-100",
    textColor: "text-red-700",
    borderColor: "border-red-300",
    criteria: "≥3 missed washes OR ≥2 complaints",
  },
  MEDIUM: {
    label: "Medium Risk",
    color: "bg-yellow-100",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-300",
    criteria: "≥2 missed washes OR 1 complaint",
  },
  LOW: {
    label: "Low Risk",
    color: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-300",
    criteria: "Active & satisfied",
  },
};

// ============================================
// INTERVENTION TYPES
// ============================================

export const INTERVENTION_TRIGGERS = {
  REVENUE_DROP: {
    label: "Revenue < 80%",
    color: "bg-red-600",
    textColor: "text-red-600",
    borderColor: "border-red-600",
    bgLight: "bg-red-50",
    condition: "OM revenue < 80% of MTD target",
    icon: "DollarSign",
  },
  RETENTION_FAILURE: {
    label: "Retention < 60%",
    color: "bg-orange-600",
    textColor: "text-orange-600",
    borderColor: "border-orange-600",
    bgLight: "bg-orange-50",
    condition: "Customer retention rate < 60%",
    icon: "UserMinus",
  },
  COMPLAINT_DELAY: {
    label: "Complaint > 24 hrs",
    color: "bg-amber-600",
    textColor: "text-amber-600",
    borderColor: "border-amber-600",
    bgLight: "bg-amber-50",
    condition: "Unresolved complaints > 24 hours",
    icon: "AlertTriangle",
  },
  COMPLIANCE_FAILURE: {
    label: "Compliance < 85%",
    color: "bg-purple-600",
    textColor: "text-purple-600",
    borderColor: "border-purple-600",
    bgLight: "bg-purple-50",
    condition: "GPS/Selfie compliance < 85%",
    icon: "Shield",
  },
  CLUSTER_RISK: {
    label: "Multi-OM Risk",
    color: "bg-red-700",
    textColor: "text-red-700",
    borderColor: "border-red-700",
    bgLight: "bg-red-100",
    condition: "3+ OMs underperforming simultaneously",
    icon: "AlertCircle",
  },
  OVERRIDE_PATTERN: {
    label: "Override Pattern Risk",
    color: "bg-pink-600",
    textColor: "text-pink-600",
    borderColor: "border-pink-600",
    bgLight: "bg-pink-50",
    condition: "3+ overrides per month",
    icon: "Key",
  },
  // V8: Sales Quality Integration
  EARLY_CHURN: {
    label: "Early Churn Issue",
    color: "bg-rose-600",
    textColor: "text-rose-600",
    borderColor: "border-rose-600",
    bgLight: "bg-rose-50",
    condition: "High 7-30 day churn rate",
    icon: "UserMinus",
  },
  SALES_QUALITY: {
    label: "Sales Quality Issue",
    color: "bg-indigo-600",
    textColor: "text-indigo-600",
    borderColor: "border-indigo-600",
    bgLight: "bg-indigo-50",
    condition: "Poor conversion quality or SLA breach pattern",
    icon: "TrendingDown",
  },
  CRM_DISCIPLINE: {
    label: "CRM Discipline Gap",
    color: "bg-amber-700",
    textColor: "text-amber-700",
    borderColor: "border-amber-700",
    bgLight: "bg-amber-100",
    condition: "Missed follow-ups or compliance issues",
    icon: "FileText",
  },
  // V11: Renewal Integration
  RENEWAL_FAILURE: {
    label: "Renewal Failure",
    color: "bg-red-700",
    textColor: "text-red-700",
    borderColor: "border-red-700",
    bgLight: "bg-red-100",
    condition: "Renewal rate < 65% or high lapse pattern",
    icon: "ArrowUpCircle",
  },
};

export const INTERVENTION_SEVERITY = {
  CRITICAL: {
    label: "Critical",
    color: "bg-red-600",
    textColor: "text-red-600",
    borderColor: "border-red-600",
    actionRequired: "Immediate action required within 1 hour",
  },
  WARNING: {
    label: "Warning",
    color: "bg-amber-600",
    textColor: "text-amber-600",
    borderColor: "border-amber-600",
    actionRequired: "Action required within 24 hours",
  },
  STABLE: {
    label: "Stable",
    color: "bg-green-600",
    textColor: "text-green-600",
    borderColor: "border-green-600",
    actionRequired: "Monitoring only",
  },
};

export const CUSTOMER_ESCALATION_TYPES = {
  CRITICAL_COMPLAINT: {
    label: "Critical Complaint",
    color: "bg-red-600",
    textColor: "text-red-600",
    slaMinutes: 60,
    description: "24 hrs unresolved, CM must act within 1 hour",
  },
  HIGH_VALUE_RISK: {
    label: "High Value Customer Risk",
    color: "bg-orange-600",
    textColor: "text-orange-600",
    slaMinutes: 120,
    description: "3+ vehicles / premium plan with multiple complaints",
  },
  AREA_FAILURE: {
    label: "Area Failure",
    color: "bg-amber-600",
    textColor: "text-amber-600",
    slaMinutes: 240,
    description: "3+ complaints in same area",
  },
  LEGAL_BRAND_RISK: {
    label: "Legal / Brand Risk",
    color: "bg-red-700",
    textColor: "text-red-700",
    slaMinutes: 30,
    description: "Legal threat or social media escalation",
  },
};

export const INTERVENTION_TYPES = {
  RESOLVE: {
    label: "Resolve Immediately",
    action: "RESOLVED",
    requiresNotes: true,
  },
  ASSIGN_TO_OM: {
    label: "Assign to OM",
    action: "ASSIGNED_TO_OM",
    requiresDeadline: true,
    requiresNotes: true,
  },
  ESCALATE_UP: {
    label: "Escalate to City Manager",
    action: "ESCALATED_TO_CITY_MANAGER",
    requiresNotes: true,
  },
};

// ============================================
// REPORT TYPES
// ============================================

export const REPORT_TYPES = [
  { id: "OM_RANKING", label: "OM Performance Ranking", format: "PDF" },
  { id: "REVENUE_ANALYSIS", label: "Revenue Analysis", format: "Excel" },
  { id: "RETENTION_REPORT", label: "Customer Retention Report", format: "PDF" },
  { id: "COMPLIANCE_AUDIT", label: "Compliance Audit Trail", format: "PDF" },
  { id: "ESCALATION_LOG", label: "Escalation Log", format: "Excel" },
  { id: "CLUSTER_SUMMARY", label: "Cluster Summary Report", format: "PDF" },
];

// ============================================
// REFRESH INTERVALS
// ============================================

export const REFRESH_INTERVALS = {
  DASHBOARD: 60000, // 1 minute
  OM_CARDS: 120000, // 2 minutes
  ESCALATIONS: 30000, // 30 seconds
  ANALYTICS: 300000, // 5 minutes
};

// ============================================
// UI CONSTANTS
// ============================================

export const MAX_OM_CARDS_PER_ROW = 3;
export const MAX_ESCALATIONS_VISIBLE = 20;
export const MAX_CHURN_CUSTOMERS_VISIBLE = 15;
export const SPARKLINE_DAYS = 7;

// ============================================
// NOTIFICATION SETTINGS
// ============================================

export const NOTIFICATION_TRIGGERS = {
  ESCALATION_CRITICAL: true,
  ESCALATION_OVERDUE: true,
  REVENUE_BELOW_80: true,
  COMPLIANCE_BREACH: true,
  OM_INACTIVE_60MIN: true,
  CHURN_HIGH_RISK: false, // CM monitors actively
};

// ============================================
// INCENTIVE TRACKER RULES (NEW - CRITICAL)
// ============================================

export const INCENTIVE_KPI_WEIGHTAGE = {
  REVENUE: 35,
  CONVERSION: 15,
  RETENTION: 20,
  OM_PERFORMANCE: 15,
  COMPLIANCE: 10,
  CUSTOMER_EXPERIENCE: 5,
};

export const INCENTIVE_PAYOUT_THRESHOLDS = {
  FULL_PAYOUT: 95, // >= 95% = Full payout (1.0 multiplier)
  PARTIAL_PAYOUT: 80, // >= 80% = Partial payout (0.5 multiplier)
  ZERO_PAYOUT: 0, // < 80% = Zero payout (0.0 multiplier)
};

export const TEAM_MULTIPLIER_CONDITIONS = {
  ALL_OMS_TARGET: 90, // All OMs must be >= 90%
  RETENTION_TARGET: 80, // Cluster retention >= 80%
  MULTIPLIER_VALUE: 1.2, // 20% bonus if both conditions met
};

export const BASE_CM_INCENTIVE = 50000; // ₹50,000 base monthly incentive

export const INCENTIVE_STATUS_CONFIG = {
  FULL_PAYOUT: {
    label: "Full Payout",
    color: "bg-green-600",
    textColor: "text-green-600",
    borderColor: "border-green-600",
    bgLight: "bg-green-50",
  },
  PARTIAL_PAYOUT: {
    label: "Partial Payout",
    color: "bg-amber-600",
    textColor: "text-amber-600",
    borderColor: "border-amber-600",
    bgLight: "bg-amber-50",
  },
  ZERO_PAYOUT: {
    label: "Zero Payout",
    color: "bg-red-600",
    textColor: "text-red-600",
    borderColor: "border-red-600",
    bgLight: "bg-red-50",
  },
};

// ============================================
// DATA STATE CONFIGURATION (V7)
// ============================================

export const DATA_STATE_CONFIG = {
  LIVE: {
    label: "Live",
    color: "bg-green-600",
    textColor: "text-green-600",
    borderColor: "border-green-600",
    icon: "Activity",
  },
  ESTIMATED: {
    label: "Estimated",
    color: "bg-amber-600",
    textColor: "text-amber-600",
    borderColor: "border-amber-600",
    icon: "TrendingUp",
  },
  LOCKED: {
    label: "Data Locked",
    color: "bg-red-600",
    textColor: "text-red-600",
    borderColor: "border-red-600",
    icon: "Lock",
  },
};

// ============================================
// TIME-BASED BEHAVIOR RULES (V7)
// ============================================

export const MORNING_DEADLINE_HOUR = 11.5; // 11:30 AM
export const DATA_LOCK_HOUR = 0; // Midnight
export const PRE_DAY_START_HOUR = 20; // 8:00 PM
export const EOD_SUBMISSION_HOUR = 17; // 5:00 PM