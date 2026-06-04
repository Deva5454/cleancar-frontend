/**
 * CLUSTER MANAGER - TYPE DEFINITIONS
 * Control Tower Interface for Performance Oversight
 * 
 * Hierarchy: CM → OMs → Teams (indirect)
 * Focus: Monitoring, intervention, escalation, planning
 */

// ============================================
// CORE CLUSTER METRICS
// ============================================

export interface ClusterKPIs {
  revenue: {
    mtd: number;
    target: number;
    percentage: number;
    trend: "UP" | "STABLE" | "DOWN";
  };
  unitProductivity: {
    avgPerWasher: number;
    target: number; // 25 units/washer/day
    percentage: number;
  };
  conversion: {
    rate: number;
    target: number;
    percentage: number;
  };
  retention: {
    rate: number;
    target: number;
    percentage: number;
  };
  compliance: {
    score: number;
    target: number;
    issues: number;
  };
  activeCustomers: {
    current: number;
    lastMonth: number;
    change: number;
  };
  openEscalations: {
    total: number;
    critical: number;
    overdue: number;
  };
  churnRisk: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface ClusterSummary {
  totalUnitsToday: {
    fourW: number;
    twoW: number;
    addOn: number;
    total: number;
    target: number;
  };
  supervisorsActive: {
    present: number;
    expected: number;
    percentage: number;
  };
  washersActive: {
    present: number;
    expected: number;
    percentage: number;
  };
  omsOnline: {
    active: number;
    total: number;
  };
}

// ============================================
// OM PERFORMANCE TRACKING
// ============================================

export interface OMPerformanceCard {
  id: string;
  name: string;
  location: string;
  status: "ACTIVE" | "FIELD" | "IDLE" | "ISSUES";
  overallHealth: "GREEN" | "AMBER" | "RED";
  kpis: {
    revenue: {
      mtd: number;
      target: number;
      percentage: number;
      status: "GREEN" | "AMBER" | "RED";
    };
    units: {
      today: number;
      target: number;
      percentage: number;
      status: "GREEN" | "AMBER" | "RED";
    };
    conversion: {
      rate: number;
      target: number;
      status: "GREEN" | "AMBER" | "RED";
    };
    retention: {
      rate: number;
      target: number;
      status: "GREEN" | "AMBER" | "RED";
    };
    compliance: {
      score: number;
      issues: number;
      status: "GREEN" | "AMBER" | "RED";
    };
  };
  alerts: number;
  lastActivity: Date;
  teamsSummary: {
    teams: number; // ✅ UPDATED: Changed from supervisors to teams
    washers: number;
    activeWashers: number;
  };
}

export interface OMDetailedPerformance {
  om: OMPerformanceCard;
  trends: {
    revenue: {
      last7Days: number[];
      growth: number;
      sparkline: { day: string; value: number }[];
    };
    conversion: {
      last7Days: number[];
      average: number;
      sparkline: { day: string; value: number }[];
    };
    retention: {
      last7Days: number[];
      average: number;
      sparkline: { day: string; value: number }[];
    };
    compliance: {
      last7Days: number[];
      average: number;
      sparkline: { day: string; value: number }[];
    };
  };
  openComplaints: number;
  pendingApprovals: number;
  lastFieldVisit: Date | null;
  pipeline: {
    leads: number;
    demos: number;
    negotiations: number;
    value: number;
  };
  teamStatus: {
    teamCount: number; // ✅ UPDATED: Changed from supervisorCount to teamCount
    washerCount: number;
    attendanceRate: number;
    avgUnitsPerWasher: number;
  };
}

// ============================================
// ESCALATIONS & INTERVENTIONS
// ============================================

export interface CMIntervention {
  id: string;
  omId: string;
  omName: string;
  triggerType:
    | "REVENUE_DROP"
    | "RETENTION_FAILURE"
    | "COMPLAINT_DELAY"
    | "COMPLIANCE_FAILURE"
    | "CLUSTER_RISK"
    | "OVERRIDE_PATTERN"
    | "EARLY_CHURN" // V8
    | "SALES_QUALITY" // V8
    | "CRM_DISCIPLINE" // V8
    | "RENEWAL_FAILURE"; // V11
  severity: "CRITICAL" | "WARNING" | "STABLE";
  daysSinceTrigger: number;
  triggeredAt: Date;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED_TO_CITY_MANAGER";
  issueSource: IssueSource; // V8: OPS, SALES, CRM, MIXED
  kpiSnapshot: {
    revenue?: number;
    retention?: number;
    compliance?: number;
    complaints?: number;
    overrides?: number;
    earlyChurn?: number; // V8
    conversionQuality?: number; // V8
  };
  problemSummary: string;
  rootCause?: string;
  rootCauseCategory?: IssueSource; // V8: Categorized root cause
  actionPlan?: {
    task: string;
    deadline: Date;
    notes: string;
  };
  followUp?: {
    nextReviewDate: Date;
    lastUpdate: Date;
  };
  escalationDetails?: {
    reason: string;
    escalatedAt: Date;
    escalatedBy: string;
    attachments?: string[];
    recommendation?: "APPROVE" | "REJECT" | "REVIEW";
  };
}

export interface CustomerEscalation {
  id: string;
  customerId: string;
  customerName: string;
  omId: string;
  omName: string;
  escalationType: 
    | "CRITICAL_COMPLAINT"
    | "HIGH_VALUE_RISK"
    | "AREA_FAILURE"
    | "LEGAL_BRAND_RISK";
  severity: "CRITICAL" | "HIGH";
  slaTimer: {
    remainingMinutes: number;
    deadline: Date;
  };
  details: {
    complaintCount?: number;
    vehicleCount?: number;
    areaAffected?: string;
    legalThreat?: boolean;
    socialMedia?: boolean;
  };
  description: string;
  createdAt: Date;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  actionLog?: {
    action: string;
    takenAt: Date;
    takenBy: string;
  }[];
}

export interface CMEscalation {
  id: string;
  type: "COMPLAINT_SLA" | "REVENUE_GAP" | "RETENTION_FAILURE" | "INCENTIVE_REQUEST" | "COVER_CAPACITY" | "COMPLIANCE_BREACH" | "OM_INACTIVITY";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  omId: string;
  omName: string;
  timePending: number; // minutes
  createdAt: Date;
  description: string;
  impact: {
    revenue?: number;
    customers?: number;
    units?: number;
  };
  status: "PENDING" | "ASSIGNED" | "RESOLVED" | "ESCALATED_UP";
  requiredAction: string;
  attachments?: string[];
}

export interface CMInterventionAction {
  id: string;
  interventionId: string;
  action: "RESOLVED" | "ASSIGNED_TO_OM" | "ESCALATED_TO_CITY_MANAGER";
  takenBy: string; // CM ID
  timestamp: Date;
  notes: string;
  deadline?: Date;
  followUpRequired: boolean;
}

// ============================================
// REVENUE & PIPELINE
// ============================================

export interface ClusterRevenue {
  cluster: {
    mtd: number;
    target: number;
    percentage: number;
  };
  byOM: {
    omId: string;
    omName: string;
    revenue: number;
    target: number;
    percentage: number;
    status: "GREEN" | "AMBER" | "RED";
  }[];
  funnel: {
    leads: number;
    demos: number;
    negotiations: number;
    closedWon: number;
    closedLost: number;
    conversionRate: number;
  };
  stalledPipeline: {
    leadId: string;
    customerName: string;
    omName: string;
    daysStuck: number;
    stage: string;
    value: number;
  }[];
}

// ============================================
// RETENTION & CUSTOMER HEALTH
// ============================================

export interface ClusterRetention {
  churnRisk: {
    customerId: string;
    customerName: string;
    omId: string;
    omName: string;
    risk: "HIGH" | "MEDIUM" | "LOW";
    missedWashes: number;
    complaints: number;
    lastWashDate: Date;
    subscriptionValue: number;
    recommendedAction: string;
  }[];
  slaTracker: {
    complaintId: string;
    customerName: string;
    omName: string;
    createdAt: Date;
    acknowledgementTime?: Date;
    resolutionTime?: Date;
    slaStatus: "MET" | "AT_RISK" | "BREACHED";
    minutesRemaining: number;
  }[];
  upsellOpportunities: {
    customerId: string;
    customerName: string;
    omName: string;
    currentPackage: string;
    suggestedPackage: string;
    additionalRevenue: number;
  }[];
  retentionByOM: {
    omId: string;
    omName: string;
    retentionRate: number;
    churnCount: number;
    satisfactionTrend: "UP" | "STABLE" | "DOWN";
  }[];
}

// ============================================
// REPORTS & ANALYTICS (INCLUDING EXPANSION PLANNING - V6)
// ============================================

export interface ClusterAnalytics {
  omRanking: {
    rank: number;
    omId: string;
    omName: string;
    overallScore: number;
    revenue: number;
    conversion: number;
    retention: number;
    compliance: number;
    trend: "UP" | "STABLE" | "DOWN";
  }[];
  unitProductivity: {
    omName: string;
    avgUnitsPerWasher: number;
    target: number;
    variance: number;
    trend: "IMPROVING" | "STABLE" | "DECLINING";
  }[];
  complianceTrends: {
    week: string;
    score: number;
    issues: number;
    resolved: number;
  }[];
  attritionHeatmap: {
    omName: string;
    washerAttrition: number;
    teamAttrition: number; // ✅ UPDATED: Changed from supervisorAttrition to teamAttrition
    severity: "LOW" | "MEDIUM" | "HIGH";
  }[];
  territoryCoverage: {
    area: string;
    omName: string;
    customers: number;
    coverage: number; // percentage
    potential: number;
  }[];
  incentiveForecast: {
    month: string;
    projected: number;
    actual?: number;
    variance?: number;
  }[];
  territoryProposals: TerritoryProposal[]; // V6: Expansion planning
}

// ============================================
// TIME-BASED MODES
// ============================================

export type CMTimeMode =
  | "PRE_DAY"             // 8:00 PM - Midnight (Previous evening)
  | "MORNING_REVIEW"      // 10:00 AM
  | "FIELD_MODE"          // 11:30 AM - 3:00 PM
  | "PROBLEM_SOLVING"     // 3:00 PM
  | "PLANNING"            // 5:00 PM (EOD)
  | "NORMAL";

export interface CMTimeModeConfig {
  mode: CMTimeMode;
  startHour: number;
  endHour: number;
  label: string;
  color: string;
  priorities: string[];
}

// ============================================
// DATA STATE & SYSTEM BEHAVIOR (V7)
// ============================================

export type DataState = "LIVE" | "ESTIMATED" | "LOCKED";

export interface DataStateTag {
  state: DataState;
  label: string;
  color: string;
  icon: string;
}

// V12: DAILY FLOW INTEGRATION
export interface StartOfDaySummary {
  date: Date;
  yesterday: {
    revenue: number;
    revenueTarget: number;
    percentage: number;
    unitsCompleted: number;
    conversions: number;
    renewals: number;
    lapses: number;
  };
  today: {
    revenueTarget: number;
    expectedConversions: number;
    renewalsDue: number;
    highRiskRenewals: number;
    criticalAlertsCarriedForward: number;
  };
  conversionToRetentionDropOff: {
    conversions: number;
    activeAfter7Days: number;
    dropOffCount: number;
    dropOffPercentage: number;
  };
  topPriorities: {
    category: string;
    count: number;
    urgency: "CRITICAL" | "HIGH" | "MEDIUM";
  }[];
}

export interface AtRiskTodayPanel {
  lowConversionClusters: {
    omId: string;
    omName: string;
    conversionRate: number;
    target: number;
    gapPercentage: number;
  }[];
  followUpGaps: {
    omId: string;
    omName: string;
    missedFollowUps: number;
    crmComplianceScore: number;
  }[];
  revenuePacing: {
    current: number;
    target: number;
    percentage: number;
    projectedShortfall: number;
    status: "ON_TRACK" | "AT_RISK" | "CRITICAL";
  };
  pipelineRisks: {
    stalledDeals: number;
    slaBreaches: number;
    highValueAtRisk: number;
  };
}

export interface LivePerformanceIndicator {
  intraDayConversionTrend: "IMPROVING" | "STABLE" | "DECLINING";
  conversionsSoFar: number;
  conversionTarget: number;
  revenueSoFar: number;
  revenueTarget: number;
  slaBreachesToday: number;
  earlyChurnSignals: number;
  lastUpdated: Date;
}

export interface NextDayReadiness {
  date: Date;
  omProjections: {
    omId: string;
    omName: string;
    projectedRevenue: number;
    projectedUnits: number;
    capacityStatus: "GOOD" | "AT_RISK" | "CRITICAL";
    openEscalations: number;
  }[];
  clusterCapacity: {
    expectedWashers: number;
    confirmedWashers: number;
    leaveRequests: number;
    coverageGaps: string[]; // Areas with coverage issues
  };
  churnRiskList: {
    customerId: string;
    customerName: string;
    omName: string;
    risk: "HIGH" | "MEDIUM";
    actionRequired: string;
  }[];
  pendingActions: {
    category: string;
    count: number;
    mustClearBy?: Date;
  }[];
}

export interface EODSummary {
  date: Date;
  cmId: string;
  cmName: string;
  todayPerformance: {
    revenueAchieved: number;
    revenueTarget: number;
    unitsCompleted: number;
    unitsTarget: number;
  };
  escalationsHandled: number;
  interventionsTaken: number;
  nextDayPlanning: {
    expectedRevenue: number;
    expectedUnits: number;
    coverageConfirmed: boolean;
    knownIssues: string[];
  };
  submittedAt?: Date;
  status: "DRAFT" | "SUBMITTED";
}

// ============================================
// AUDIT & LOGGING
// ============================================

export interface CMAuditLog {
  id: string;
  action: "RESOLVE_ESCALATION" | "ASSIGN_TO_OM" | "ESCALATE_UP" | "FLAG_OM" | "INTERVENTION" | "REPORT_DOWNLOAD";
  cmId: string;
  cmName: string;
  timestamp: Date;
  targetOM?: string;
  description: string;
  impact?: string;
  metadata?: Record<string, any>;
}

// ============================================
// INCENTIVE TRACKER (NEW - CRITICAL)
// ============================================

export interface CMIncentiveKPI {
  name: string;
  weightage: number; // percentage
  current: number; // percentage achieved
  target: number;
  status: "FULL_PAYOUT" | "PARTIAL_PAYOUT" | "ZERO_PAYOUT";
  payoutMultiplier: number; // 0 to 1
}

export interface CMIncentiveTracker {
  month: string;
  kpis: {
    revenue: CMIncentiveKPI;
    conversion: CMIncentiveKPI;
    retention: CMIncentiveKPI;
    omPerformance: CMIncentiveKPI;
    compliance: CMIncentiveKPI;
    customerExperience: CMIncentiveKPI;
  };
  currentEarnings: {
    baseIncentive: number;
    kpiBonus: number;
    teamMultiplier: number;
    totalProjected: number;
  };
  teamMultiplierStatus: {
    eligible: boolean;
    condition1: { met: boolean; label: string; current: number; target: number }; // All OMs ≥90%
    condition2: { met: boolean; label: string; current: number; target: number }; // Retention ≥80%
    multiplierValue: number; // 1.0 or 1.2
  };
  revenueBreakdown: {
    clusterTotal: number;
    clusterTarget: number;
    percentage: number;
    omRanking: {
      rank: number;
      omName: string;
      revenue: number;
      percentage: number;
    }[];
  };
  historicalReference: {
    lastMonthPayout: number;
    trend: "UP" | "STABLE" | "DOWN";
    percentageChange: number;
  };
  projectedPayout: {
    optimistic: number; // If all targets met
    realistic: number; // Current trajectory
    pessimistic: number; // If trends continue
  };
  auditLog: {
    lastRecalculated: Date;
    systemGenerated: boolean;
  };
}

// ============================================
// SYSTEM ALERTS (GLOBAL LAYER)
// ============================================

export interface CMAlert {
  id: string;
  type:
    | "REVENUE_DROP"
    | "MULTI_OM_UNDERPERFORMANCE"
    | "COMPLAINT_SLA_BREACH"
    | "RETENTION_CRITICAL"
    | "COMPLIANCE_FAILURE"
    | "HIGH_VALUE_CHURN"
    | "KPI_FORECAST_MISS"
    | "ESCALATION_PENDING"
    | "EARLY_CHURN_7DAY" // V8
    | "EARLY_CHURN_30DAY" // V8
    | "LOW_RENEWAL_RATE" // V8
    | "CRM_DISCIPLINE_GAP" // V8
    | "EBITDA_RISK_PATTERN" // V8
    | "SALES_QUALITY_ISSUE" // V8
    | "SLA_BREACH_SPIKE" // V10
    | "RENEWAL_RATE_CRITICAL" // V11
    | "RENEWAL_DECLINE_TREND"; // V11
  priority: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  impact: string;
  timeElapsed: number; // minutes since alert created
  createdAt: Date;
  escalationLevel: "OM" | "CM" | "CITY_MANAGER" | "MD";
  actionRequired: string;
  autoEscalateIn?: number; // minutes until auto-escalation
  relatedOM?: string;
  dataSource?: string; // V8: "CRM", "Sales", "Operations", "Mixed"
}

// ============================================
// SALES QUALITY INTEGRATION (V8)
// ============================================

export type IssueSource = "OPS" | "SALES" | "CRM" | "FUNNEL" | "RENEWAL" | "MIXED";

export interface ConversionQualityMetrics {
  totalConversions: number;
  conversionRate: number; // percentage
  dealMix: {
    base: { count: number; percentage: number };
    addOn: { count: number; percentage: number };
    bundleMID: { count: number; percentage: number };
    bundleLOW: { count: number; percentage: number };
  };
  averageDealValue: number;
  monthOverMonth: {
    conversions: number; // change percentage
    avgValue: number; // change percentage
  };
}

export interface EarlyChurnMetrics {
  churn7Days: {
    count: number;
    percentage: number;
    topReasons: string[];
  };
  churn30Days: {
    count: number;
    percentage: number;
    topReasons: string[];
  };
  churn90Days: {
    count: number;
    percentage: number;
    topReasons: string[];
  };
  byDealType: {
    base: number; // churn percentage
    addOn: number;
    bundleMID: number;
    bundleLOW: number;
  };
}

export interface SalesQualityFlag {
  id: string;
  type:
    | "HIGH_LOW_BUNDLE_DEPENDENCY"
    | "HIGH_ADDON_USAGE"
    | "LOW_RETENTION_PATTERN"
    | "EBITDA_RISK"
    | "PRICE_SENSITIVITY"
    | "CRM_DISCIPLINE_GAP";
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  impact: string;
  omId?: string;
  omName?: string;
  metric: {
    current: number;
    threshold: number;
    unit: string;
  };
  actionRequired: string;
}

export interface ConversionFunnel {
  leads: number;
  demos: number;
  conversions: number;
  active: number;
  retained: number;
  renewed: number;
  dropOffPoints: {
    stage: string;
    dropCount: number;
    dropPercentage: number;
    topReasons: string[];
  }[];
}

export interface RenewalMetrics {
  totalDueForRenewal: number;
  renewed: number;
  renewalRate: number;
  lostReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  avgRenewalValue: number;
  upgradedCount: number; // V11: Customers who upgraded at renewal
  upgradeRate: number; // V11: Percentage who upgraded
  basicRenewalCount: number; // V11: Customers who renewed same plan
  lapsedCount: number; // V11: Customers who did not renew
}

// V11: RENEWAL LIFECYCLE TRACKING
export interface RenewalFunnelStage {
  stage: "ACTIVE" | "EXPIRING" | "RENEWED" | "UPGRADED" | "LAPSED";
  count: number;
  dropOff?: number; // count dropped from previous stage
  dropOffPercentage?: number;
  topReasons?: string[];
  value?: number; // Total revenue value at this stage
}

export interface RenewalHealthMetrics {
  renewalRate: number; // Overall renewal rate
  upgradeRate: number; // Percentage who upgraded
  retentionValue: number; // Total revenue retained through renewals
  lapsedValue: number; // Total revenue lost through lapses
  expiringNext30Days: {
    count: number;
    value: number;
    highRiskCount: number; // At-risk for lapse
  };
  renewalTrend: "IMPROVING" | "STABLE" | "DECLINING";
  byOM: {
    omId: string;
    omName: string;
    renewalRate: number;
    upgradeRate: number;
    status: "GREEN" | "AMBER" | "RED";
  }[];
  lapsedReasonBreakdown: {
    reason: string;
    count: number;
    percentage: number;
    revenueImpact: number;
  }[];
}

export interface InsightSuggestion {
  id: string;
  type: "CONVERSION" | "RETENTION" | "REVENUE" | "OPS" | "CRM";
  severity: "ACTION_REQUIRED" | "ATTENTION" | "INFORMATIONAL";
  title: string;
  insight: string;
  recommendation: string;
  dataSource: string; // "CRM", "Operations", "Sales", "Mixed"
  relatedOM?: string;
}

// ============================================
// TSM INTEGRATION (V10 - FUNNEL GOVERNANCE)
// ============================================

export interface TSMFunnelMetrics {
  totalLeads: number;
  firstCallAttempts: number;
  firstCallConnects: number;
  demos: number;
  conversions: number;
  conversionRate: number;
  slaBreaches: {
    firstCall24h: number; // Missed first call within 24 hours
    demoSchedule: number; // Demo not scheduled within SLA
    followUp: number; // Missed follow-ups
    total: number;
  };
  crmCompliance: {
    score: number; // percentage
    issues: {
      missedFollowUps: number;
      incompleteData: number;
      lateUpdates: number;
    };
  };
  bundleMix: {
    mid: { count: number; percentage: number };
    low: { count: number; percentage: number };
  };
  renewalRate: number;
}

export interface SLAImpactMetrics {
  slaBreachRate: number; // percentage of leads with SLA breach
  conversionImpact: {
    withSLA: number; // conversion rate when SLA met
    withoutSLA: number; // conversion rate when SLA breached
    gap: number; // difference
  };
  revenueImpact: {
    estimatedLoss: number; // revenue lost due to SLA breaches
    affectedDeals: number;
  };
  breachTrend: "IMPROVING" | "STABLE" | "WORSENING";
  byOM: {
    omId: string;
    omName: string;
    breachCount: number;
    conversionRate: number;
    impact: "HIGH" | "MEDIUM" | "LOW";
  }[];
}

export interface FunnelStageMetrics {
  stage: "LEADS" | "ATTEMPTS" | "CONVERSIONS" | "ACTIVE" | "RETAINED" | "RENEWED";
  count: number;
  dropOff: number; // count dropped from previous stage
  dropOffPercentage: number;
  slaBreachImpact?: number; // how many dropped due to SLA breach
  topReasons: string[];
}

// ============================================
// EXPANSION SUPPORT (V6)
// ============================================

export interface TerritoryProposal {
  id: string;
  proposedBy: string; // CM ID
  proposedByName: string; // CM Name
  territoryName: string;
  location: string;
  expectedRevenue: number; // Monthly revenue projection
  requiredWashers: number;
  requiredTeams: number; // ✅ UPDATED: Changed from requiredSupervisors to requiredTeams
  clusterAssignment: string; // Which cluster this territory belongs to
  customerDensity: number; // Estimated customers in area
  rationale: string; // Why this territory should be expanded to
  competitorPresence: "HIGH" | "MEDIUM" | "LOW";
  infrastructureReady: boolean;
  estimatedSetupCost: number;
  estimatedBreakeven: number; // months
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  submittedAt?: Date;
  reviewedBy?: string; // City Manager ID
  reviewedAt?: Date;
  reviewNotes?: string;
  approvalStatus?: {
    approvedBy: string;
    approvedAt: Date;
    implementationTimeline: string;
  };
}