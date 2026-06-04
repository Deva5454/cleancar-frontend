/**
 * City Manager Constants
 * P&L Control System Configuration
 * 
 * Philosophy: CEO-level business parameters
 * All thresholds, targets, and rules defined here
 */

// ============================================
// KPI TARGETS & THRESHOLDS
// ============================================

export const CITY_KPI_TARGETS = {
  REVENUE_ACHIEVEMENT: 100, // Percentage
  EBITDA_MINIMUM: 25, // Percentage
  EBITDA_TARGET: 30, // Percentage
  RETENTION_90DAY: 80, // Percentage
  CUSTOMER_GROWTH_MONTHLY: 5, // Percentage
} as const;

// ============================================
// CLUSTER HEALTH THRESHOLDS
// ============================================

export const CLUSTER_HEALTH_THRESHOLDS = {
  GREEN: {
    REVENUE_MIN: 90, // % of target
    EBITDA_MIN: 25, // %
    RETENTION_MIN: 80, // %
  },
  AMBER: {
    REVENUE_MIN: 75,
    EBITDA_MIN: 20,
    RETENTION_MIN: 70,
  },
  // Below AMBER = RED
} as const;

// ============================================
// INTERVENTION TRIGGERS
// ============================================

export const INTERVENTION_TRIGGERS = {
  REVENUE_DROP: {
    THRESHOLD: 75, // % of target
    CRITICAL_THRESHOLD: 65,
  },
  EBITDA_DROP: {
    THRESHOLD: 20, // %
    CRITICAL_THRESHOLD: 15,
  },
  RETENTION_FAILURE: {
    THRESHOLD: 70, // %
    CRITICAL_THRESHOLD: 60,
  },
  MULTI_OM_FAILURE: {
    COUNT: 3, // Number of underperforming OMs in a cluster
  },
  COST_SPIKE: {
    THRESHOLD: 15, // % increase month-over-month
  },
} as const;

// ============================================
// AUTO-ESCALATION RULES
// ============================================

export const ESCALATION_RULES = {
  TO_MD: {
    REVENUE_THRESHOLD: 60, // % of target
    MULTI_CLUSTER_FAILURE: 3, // Number of clusters
    LEGAL_BRAND_RISK: true, // Always escalate
    DAYS_UNRESOLVED: 7,
  },
  TO_HR: {
    CM_PERFORMANCE_FAILURE: true,
    COMPLIANCE_BREACH: true,
  },
} as const;

// ============================================
// INCENTIVE CONFIGURATION
// ============================================

export const CITY_INCENTIVE_CONFIG = {
  BASE_INCENTIVE: 100000, // ₹1,00,000
  KPI_WEIGHTAGE: {
    REVENUE: 40, // %
    EBITDA: 30, // %
    RETENTION: 20, // %
    GROWTH: 10, // %
  },
  EBITDA_MANDATORY_THRESHOLD: 25, // % - Below this = Zero payout
  PAYOUT_TIERS: {
    EXCELLENT: {
      MIN_SCORE: 90,
      MULTIPLIER: 2.0,
    },
    GOOD: {
      MIN_SCORE: 80,
      MULTIPLIER: 1.5,
    },
    AVERAGE: {
      MIN_SCORE: 70,
      MULTIPLIER: 1.0,
    },
    BELOW_PAR: {
      MIN_SCORE: 60,
      MULTIPLIER: 0.5,
    },
    // Below 60 = Zero
  },
  GROWTH_BONUS: {
    NEW_CLUSTER_LAUNCHED: 25000, // Bonus per cluster
    REVENUE_GROWTH_10_PERCENT: 15000,
  },
} as const;

// ============================================
// REVENUE & EBITDA BENCHMARKS
// ============================================

export const FINANCIAL_BENCHMARKS = {
  COST_DISTRIBUTION: {
    WASHER_COST: 35, // % of revenue
    SUPERVISOR_COST: 8,
    CONSUMABLES: 12,
    OPERATIONAL_OVERHEAD: 15,
    MARKETING: 5,
    OTHER: 5,
  },
  COST_SPIKE_THRESHOLD: 15, // % increase month-over-month
  UNIT_ECONOMICS: {
    AVG_PRICE_PER_UNIT: 350, // ₹350
    TARGET_UNITS_PER_DAY: 500,
  },
} as const;

// ============================================
// RETENTION BENCHMARKS
// ============================================

export const RETENTION_BENCHMARKS = {
  CHURN_RATE_ACCEPTABLE: 10, // % monthly
  CHURN_RATE_CRITICAL: 15,
  HIGH_RISK_CUSTOMER_THRESHOLD: 20, // Number of customers
  RETENTION_ACTION_TRIGGERS: {
    PRICING_ISSUE: 30, // % of churned customers citing pricing
    QUALITY_ISSUE: 40,
    SERVICE_ISSUE: 50,
  },
} as const;

// ============================================
// EXPANSION PARAMETERS
// ============================================

export const EXPANSION_CONFIG = {
  MIN_INVESTMENT_PER_CLUSTER: 500000, // ₹5L
  PAYBACK_PERIOD_MONTHS: 12,
  TERRITORY_COVERAGE_TARGET: 80, // %
  PRIORITY_SCORING: {
    HIGH_PRIORITY: {
      MIN_POTENTIAL_REVENUE: 2000000, // ₹20L monthly
      MIN_CUSTOMER_DENSITY: 500,
    },
    MEDIUM_PRIORITY: {
      MIN_POTENTIAL_REVENUE: 1000000,
      MIN_CUSTOMER_DENSITY: 300,
    },
  },
} as const;

// ============================================
// ALERT CONFIGURATION
// ============================================

export const ALERT_CONFIG = {
  AUTO_ESCALATION_MINUTES: {
    CRITICAL: 120, // 2 hours
    WARNING: 240, // 4 hours
  },
  CLUSTER_REVENUE_CRITICAL_THRESHOLD: 65, // % of target
  MULTI_CLUSTER_FAILURE_COUNT: 3,
  MASS_SERVICE_FAILURE_THRESHOLD: 50, // Number of customers affected
} as const;

// ============================================
// TIME-BASED BEHAVIOR
// ============================================

export const TIME_BASED_CONFIG = {
  MORNING_REVIEW_TIME: "10:00",
  STRATEGIC_BAND_START: "12:00",
  STRATEGIC_BAND_END: "16:00",
  EVENING_REPORT_TIME: "17:00",
} as const;

// ============================================
// REPORTS CONFIGURATION
// ============================================

export const REPORT_TYPES = {
  MONTHLY_PL: "Monthly P&L Report",
  CLUSTER_PERFORMANCE: "Cluster Performance Report",
  RETENTION_ANALYSIS: "Retention Analysis Report",
  EXPANSION_FEASIBILITY: "Expansion Feasibility Report",
} as const;

// ============================================
// UI CONSTANTS
// ============================================

export const UI_CONFIG = {
  CLUSTERS_PER_PAGE: 12,
  INTERVENTIONS_PER_PAGE: 10,
  ALERTS_VISIBLE_COUNT: 5,
  TREND_DAYS_DEFAULT: 30,
} as const;

// ============================================
// CURRENT CITY MANAGER
// ============================================

export const CURRENT_CITY_MANAGER = {
  NAME: "Rajesh Mehta",
  EMPLOYEE_ID: "CM-001",
  CITY: "Surat",
  CLUSTERS_MANAGED: 4,
  START_DATE: "2024-01-01",
} as const;

// ============================================
// STATUS COLORS
// ============================================

export const STATUS_COLORS = {
  GREEN: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  AMBER: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  RED: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
} as const;

// ============================================
// VALIDATION MESSAGES
// ============================================

export const VALIDATION_MESSAGES = {
  INTERVENTION_REQUIRED: "Intervention plan required before saving",
  EBITDA_BELOW_THRESHOLD: "EBITDA below mandatory threshold - Zero payout",
  ESCALATION_REQUIRED: "Escalation to MD required for this severity",
  EXPANSION_APPROVAL_NEEDED: "Expansion requires MD approval",
} as const;
