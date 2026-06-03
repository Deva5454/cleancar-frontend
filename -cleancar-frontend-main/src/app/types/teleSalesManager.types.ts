/**
 * TELE SALES MANAGER (TSM) - TYPE DEFINITIONS
 * Pipeline Control + Revenue Conversion Governance System
 *
 * Role: TSM controls funnel performance, does NOT execute sales
 * Philosophy: Monitor → Intervene → Control → Report
 */

// ============================================
// CORE TSM METRICS
// ============================================

export interface TSMCommandMetrics {
  leadStages: {
    new: number;
    attempted: number;
    followUp: number;
    converted: number;
    lost: number;
  };
  teamConversionRate: number;
  teamConversionTarget: number;
  slaBreachesToday: number;
  revenue: {
    mtd: number;
    target: number;
    percentage: number;
  };
  openAlerts: {
    critical: number;
    warning: number;
    info: number;
  };
}

// ============================================
// TSE (TELE SALES EXECUTIVE) PERFORMANCE
// ============================================

export interface TSEPerformanceCard {
  id: string;
  name: string;
  status: "ACTIVE" | "OFFLINE" | "ON_CALL";
  overallHealth: "GREEN" | "AMBER" | "RED";
  kpis: {
    callsMade: {
      today: number;
      target: number;
      percentage: number;
    };
    conversionRate: {
      rate: number;
      target: number;
      status: "GREEN" | "AMBER" | "RED";
    };
    crmCompliance: {
      score: number;
      target: number;
      status: "GREEN" | "AMBER" | "RED";
    };
    revenueGenerated: {
      mtd: number;
      target: number;
      percentage: number;
    };
  };
  bundleMix: {
    base: number;
    addOn: number;
    bundleMID: number;
    bundleLOW: number;
  };
  renewalBonus: number;
  incentiveForecast: number;
  alerts: number;
  lastActivity: Date;
}

// ============================================
// LEAD PIPELINE & CRM MONITORING
// ============================================

export type LeadStage = "NEW" | "ATTEMPTED" | "FOLLOW_UP" | "CONVERTED" | "LOST";
// Aligned with teleSalesExecutive.types.ts LeadSource
export type LeadSource = "DIGITAL" | "BTL_REFERRAL" | "WALK_IN" | "SOCIAL_MEDIA" | "PARTNER";

export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  source: LeadSource;
  stage: LeadStage;
  assignedTSE: string;
  tseName: string;
  createdAt: Date;
  lastContactedAt?: Date;
  attemptCount: number;
  slaStatus: "MET" | "AT_RISK" | "BREACHED";
  slaMinutesRemaining?: number;
  crmCompliant: boolean;
  estimatedValue: number;
  nextFollowUpDate?: Date;
  lostReason?: string;
  approvedBy?: string;
  // Plan context — critical for TSM to see pipeline value by plan tier
  planSelected?: "SHINE" | "PROTECT" | "ELITE" | "ELITE_2W";
  vehicleCategory?: "Hatchback / Compact Sedan" | "SUV / MUV / Sedan" | "Luxury / Large SUV";
  estimatedMonthlyValue?: number; // actual plan price, not a free-form estimate
}

export interface LeadPipelineFilters {
  stage?: LeadStage;
  source?: LeadSource;
  tseId?: string;
  slaStatus?: "MET" | "AT_RISK" | "BREACHED";
  dateFrom?: Date;
  dateTo?: Date;
}

// ============================================
// PRICING AUDIT
// ============================================

export type DealType = "BASE" | "ADD_ON" | "BUNDLE_MID" | "BUNDLE_LOW";

export interface PricingAuditEntry {
  id: string;
  leadId: string;
  customerName: string;
  tseId: string;
  tseName: string;
  dealType: DealType;
  dealValue: number;
  ebitdaPercentage: number;
  ebitdaStatus: "HEALTHY" | "WARNING" | "CRITICAL";
  addOnUsed: boolean;
  systemBlockEvent: boolean;
  blockReason?: string;
  overrideApproved: boolean;
  approvedBy?: string;
  closedAt: Date;
  flags: string[];
}

// ============================================
// RENEWAL DASHBOARD
// ============================================

export interface RenewalLead {
  id: string;
  customerId: string;
  customerName: string;
  assignedTSE: string;
  tseName: string;
  currentPlan: string;
  monthlyValue: number;
  expiryDate: Date;
  daysUntilExpiry: number;
  urgency: "TODAY" | "2_DAYS" | "7_DAYS" | "LATER" | "LAPSED";
  status: "PENDING" | "CONTACTED" | "RENEWED" | "UPGRADED" | "LAPSED";
  renewalValue?: number;
  upgraded: boolean;
  lapsedReason?: string;
}

export interface RenewalMetricsTSM {
  expiringToday: number;
  expiring2Days: number;
  expiring7Days: number;
  renewalRate: number;
  renewalTarget: number;
  upgradeConversions: number;
  lapsedCount: number;
  lapsedReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
}

// ============================================
// INCENTIVE & PAYROLL
// ============================================

export interface TSEIncentiveBreakdown {
  tseId: string;
  tseName: string;
  baseIncentive: number;
  conversionBonus: number;
  renewalBonus: number;
  qualityBonus: number;
  totalProjected: number;
  month: string;
  revenueGenerated: number;
  conversionsCount: number;
  renewalsCount: number;
}

export interface TeamIncentiveMetrics {
  totalTeamRevenue: number;
  teamConversionRate: number;
  teamRenewalRate: number;
  totalBonusForecast: number;
  tseBreakdowns: TSEIncentiveBreakdown[];
}

// ============================================
// ALERTS & NOTIFICATIONS
// ============================================

export interface TSMAlert {
  id: string;
  type:
    | "LEAD_NOT_CALLED_10MIN"
    | "CRM_NOT_UPDATED_30MIN"
    | "15_ATTEMPTS_REACHED"
    | "EBITDA_BREACH_ATTEMPT"
    | "CONVERSION_DROP"
    | "RENEWAL_DROP"
    | "SLA_BREACH_SPIKE";
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  tseId?: string;
  tseName?: string;
  leadId?: string;
  createdAt: Date;
  actionRequired: string;
  autoEscalateIn?: number; // minutes
}

// ============================================
// REPORTS & ANALYTICS
// ============================================

export interface LeadSourcePerformance {
  source: LeadSource;
  totalLeads: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  avgDealValue: number;
}

export interface ConversionRatio {
  stage: string;
  count: number;
  percentage: number;
  dropOff: number;
}

export interface TSERevenueRanking {
  rank: number;
  tseId: string;
  tseName: string;
  revenue: number;
  conversions: number;
  avgDealValue: number;
  conversionRate: number;
}

export interface BundleTrend {
  dealType: DealType;
  count: number;
  percentage: number;
  revenue: number;
  avgEBITDA: number;
}

export interface TSMAnalytics {
  leadSourcePerformance: LeadSourcePerformance[];
  conversionFunnel: ConversionRatio[];
  tseRevenueRanking: TSERevenueRanking[];
  bundleTrends: BundleTrend[];
  crmComplianceByTSE: {
    tseId: string;
    tseName: string;
    score: number;
    status: "GREEN" | "AMBER" | "RED";
  }[];
  renewalRateByTSE: {
    tseId: string;
    tseName: string;
    renewalRate: number;
    renewalsCount: number;
  }[];
}

// ============================================
// AUDIT & LOGGING
// ============================================

export interface TSMAuditLog {
  id: string;
  action:
    | "LEAD_REASSIGNED"
    | "LOST_APPROVED"
    | "PRICING_OVERRIDE"
    | "CALL_AUDIT"
    | "DAILY_REPORT_SUBMITTED";
  tsmId: string;
  tsmName: string;
  timestamp: Date;
  targetTSE?: string;
  leadId?: string;
  description: string;
  metadata?: Record<string, any>;
}
