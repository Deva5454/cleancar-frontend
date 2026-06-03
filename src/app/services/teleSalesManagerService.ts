/**
 * Tele Sales Manager Data Service
 * Pipeline control and governance - NOT a calling interface
 *
 * ⚠️ CURRENT STATE: Using mock/sample data for demonstration
 * 🔄 PRODUCTION READY: All methods have API endpoint comments
 * 📝 TO INTEGRATE: Replace mock data with actual API calls
 *
 * Philosophy:
 * - TSM controls funnel performance, does NOT execute sales
 * - Monitor → Intervene → Control → Report
 * - All data flows through this centralized service
 */

import type {
  TSMCommandMetrics,
  TSEPerformanceCard,
  Lead,
  LeadPipelineFilters,
  PricingAuditEntry,
  RenewalLead,
  RenewalMetricsTSM,
  TSEIncentiveBreakdown,
  TeamIncentiveMetrics,
  TSMAlert,
  TSMAnalytics,
  TSMAuditLog,
  LeadStage,
  LeadSource,
  DealType,
} from "../types/teleSalesManager.types";

function getTSMConversionBonus(teamRate: number): number {
  const achievement = (teamRate / 22) * 100;  // 22% is business target
  if (achievement > 150) return 20000;
  if (achievement > 125) return 15000;
  if (achievement > 100) return 10000;
  return 5000;
}
function getTSMRenewalBonus(renewalRate: number): number {
  if (renewalRate > 95) return 10000;
  if (renewalRate > 85) return 8500;
  if (renewalRate > 75) return 7000;
  if (renewalRate >= 70) return 3000;
  return 0;
}

class TeleSalesManagerService {
  // ============================================
  // 1️⃣ COMMAND DASHBOARD
  // ============================================

  getCommandMetrics(): TSMCommandMetrics {
    // In production: GET /api/tsm/command-metrics
    const tseCards = this.getTSEPerformanceCards();
    const derivedRate = Math.round(
      tseCards.reduce((s, t) => s + t.kpis.conversionRate.rate, 0) / tseCards.length * 10
    ) / 10;
    return {
      leadStages: {
        new: 45, attempted: 78, followUp: 112, converted: 35, lost: 23,
      },
      teamConversionRate: derivedRate,
      teamConversionTarget: 22,  // B1 FIX: business rule
      slaBreachesToday: 12,
      revenue: {
        mtd: 4850000,
        target: 5500000,
        percentage: 88.2,
      },
      openAlerts: {
        critical: 3,
        warning: 7,
        info: 12,
      },
    };
  }

  // ============================================
  // 2️⃣ TEAM PERFORMANCE VIEW
  // ============================================

  getTSEPerformanceCards(): TSEPerformanceCard[] {
    // In production: GET /api/tsm/tse-performance
    return [
      {
        id: "TSE-001",
        name: "Rahul Sharma",
        status: "ON_CALL",
        overallHealth: "GREEN",
        kpis: {
          callsMade: { today: 45, target: 50, percentage: 90 },
          conversionRate: { rate: 48.5, target: 25, status: "GREEN" },
          crmCompliance: { score: 95, target: 100, status: "AMBER" },
          revenueGenerated: { mtd: 1250000, target: 1200000, percentage: 104.2 },
        },
        bundleMix: {
          base: 40,
          addOn: 30,
          bundleMID: 20,
          bundleLOW: 10,
        },
        renewalBonus: 15000,
        incentiveForecast: 45000,
        alerts: 0,
        lastActivity: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: "TSE-002",
        name: "Priya Patel",
        status: "ACTIVE",
        overallHealth: "GREEN",
        kpis: {
          callsMade: { today: 52, target: 50, percentage: 104 },
          conversionRate: { rate: 46.2, target: 25, status: "GREEN" },
          crmCompliance: { score: 92, target: 100, status: "AMBER" },
          revenueGenerated: { mtd: 1180000, target: 1200000, percentage: 98.3 },
        },
        bundleMix: {
          base: 45,
          addOn: 25,
          bundleMID: 25,
          bundleLOW: 5,
        },
        renewalBonus: 18000,
        incentiveForecast: 42000,
        alerts: 1,
        lastActivity: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        id: "TSE-003",
        name: "Amit Kumar",
        status: "ACTIVE",
        overallHealth: "AMBER",
        kpis: {
          callsMade: { today: 38, target: 50, percentage: 76 },
          conversionRate: { rate: 38.7, target: 25, status: "GREEN" },
          crmCompliance: { score: 78, target: 100, status: "RED" },
          revenueGenerated: { mtd: 920000, target: 1200000, percentage: 76.7 },
        },
        bundleMix: {
          base: 30,
          addOn: 20,
          bundleMID: 15,
          bundleLOW: 35, // High LOW bundle dependency
        },
        renewalBonus: 8000,
        incentiveForecast: 28000,
        alerts: 5,
        lastActivity: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        id: "TSE-004",
        name: "Sneha Desai",
        status: "ACTIVE",
        overallHealth: "GREEN",
        kpis: {
          callsMade: { today: 48, target: 50, percentage: 96 },
          conversionRate: { rate: 44.1, target: 25, status: "GREEN" },
          crmCompliance: { score: 93, target: 100, status: "AMBER" },
          revenueGenerated: { mtd: 1150000, target: 1200000, percentage: 95.8 },
        },
        bundleMix: {
          base: 50,
          addOn: 30,
          bundleMID: 15,
          bundleLOW: 5,
        },
        renewalBonus: 12000,
        incentiveForecast: 38000,
        alerts: 2,
        lastActivity: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        id: "TSE-005",
        name: "Karan Singh",
        status: "OFFLINE",
        overallHealth: "RED",
        kpis: {
          callsMade: { today: 0, target: 50, percentage: 0 },
          conversionRate: { rate: 32.5, target: 25, status: "GREEN" },
          crmCompliance: { score: 65, target: 100, status: "RED" },
          revenueGenerated: { mtd: 750000, target: 1200000, percentage: 62.5 },
        },
        bundleMix: {
          base: 25,
          addOn: 15,
          bundleMID: 10,
          bundleLOW: 50, // Very high LOW bundle dependency
        },
        renewalBonus: 5000,
        incentiveForecast: 18000,
        alerts: 8,
        lastActivity: new Date(Date.now() - 180 * 60 * 1000),
      },
    ];
  }

  // ============================================
  // 3️⃣ LEAD PIPELINE & CRM MONITORING
  // ============================================

  getLeadPipeline(filters?: LeadPipelineFilters): Lead[] {
    // In production: GET /api/tsm/leads with query params
    const allLeads: Lead[] = [
      {
        id: "LEAD-001",
        customerName: "Rajesh Patel",
        phone: "+91 98765 43210",
        source: "WEBSITE",
        stage: "NEW",
        assignedTSE: "TSE-001",
        tseName: "Rahul Sharma",
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        attemptCount: 0,
        slaStatus: "AT_RISK",
        slaMinutesRemaining: 5,
        crmCompliant: true,
        estimatedValue: 8500,
      },
      {
        id: "LEAD-002",
        customerName: "Meera Shah",
        phone: "+91 98123 45678",
        source: "REFERRAL",
        stage: "ATTEMPTED",
        assignedTSE: "TSE-002",
        tseName: "Priya Patel",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        lastContactedAt: new Date(Date.now() - 30 * 60 * 1000),
        attemptCount: 3,
        slaStatus: "MET",
        crmCompliant: true,
        estimatedValue: 12000,
        nextFollowUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        id: "LEAD-003",
        customerName: "Vikram Reddy",
        phone: "+91 99887 65432",
        source: "MARKETING",
        stage: "FOLLOW_UP",
        assignedTSE: "TSE-003",
        tseName: "Amit Kumar",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastContactedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        attemptCount: 14,
        slaStatus: "BREACHED",
        crmCompliant: false,
        estimatedValue: 9500,
        nextFollowUpDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        id: "LEAD-004",
        customerName: "Anjali Verma",
        phone: "+91 97654 32109",
        source: "WALK_IN",
        stage: "CONVERTED",
        assignedTSE: "TSE-001",
        tseName: "Rahul Sharma",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastContactedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        attemptCount: 5,
        slaStatus: "MET",
        crmCompliant: true,
        estimatedValue: 15000,
      },
      {
        id: "LEAD-005",
        customerName: "Suresh Menon",
        phone: "+91 98000 11223",
        source: "MARKETING",
        stage: "LOST",
        assignedTSE: "TSE-005",
        tseName: "Karan Singh",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastContactedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        attemptCount: 15,
        slaStatus: "BREACHED",
        crmCompliant: false,
        estimatedValue: 7000,
        lostReason: "Price too high",
        approvedBy: "TSM-001",
      },
    ];

    // Apply filters
    let filtered = allLeads;

    if (filters?.stage) {
      filtered = filtered.filter(lead => lead.stage === filters.stage);
    }
    if (filters?.source) {
      filtered = filtered.filter(lead => lead.source === filters.source);
    }
    if (filters?.tseId) {
      filtered = filtered.filter(lead => lead.assignedTSE === filters.tseId);
    }
    if (filters?.slaStatus) {
      filtered = filtered.filter(lead => lead.slaStatus === filters.slaStatus);
    }

    return filtered;
  }

  reassignLead(leadId: string, newTSEId: string, reason: string): void {
    // In production: POST /api/tsm/leads/:leadId/reassign
    console.log(`✅ Lead ${leadId} reassigned to ${newTSEId}. Reason: ${reason}`);
  }

  approveLostLead(leadId: string, tsmId: string, notes: string): void {
    // In production: POST /api/tsm/leads/:leadId/approve-lost
    console.log(`✅ Lost lead ${leadId} approved by ${tsmId}. Notes: ${notes}`);
  }

  // ============================================
  // 4️⃣ PRICING AUDIT LOG
  // ============================================

  getPricingAuditLog(): PricingAuditEntry[] {
    // In production: GET /api/tsm/pricing-audit
    return [
      {
        id: "AUDIT-001",
        leadId: "LEAD-004",
        customerName: "Anjali Verma",
        tseId: "TSE-001",
        tseName: "Rahul Sharma",
        dealType: "BASE",
        dealValue: 15000,
        ebitdaPercentage: 45.2,
        ebitdaStatus: "HEALTHY",
        addOnUsed: false,
        systemBlockEvent: false,
        overrideApproved: false,
        closedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        flags: [],
      },
      {
        id: "AUDIT-002",
        leadId: "LEAD-006",
        customerName: "Ramesh Iyer",
        tseId: "TSE-003",
        tseName: "Amit Kumar",
        dealType: "BUNDLE_LOW",
        dealValue: 6500,
        ebitdaPercentage: 18.5,
        ebitdaStatus: "CRITICAL",
        addOnUsed: true,
        systemBlockEvent: true,
        blockReason: "EBITDA 18.5% — below 30% floor (E4 FIX: floor is 30%)",
        overrideApproved: true,
        approvedBy: "TSM-001",
        closedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        flags: ["HIGH_DISCOUNT", "LOW_EBITDA", "OVERRIDE_USED"],
      },
      {
        id: "AUDIT-003",
        leadId: "LEAD-007",
        customerName: "Kavita Joshi",
        tseId: "TSE-002",
        tseName: "Priya Patel",
        dealType: "ADD_ON",
        dealValue: 12000,
        ebitdaPercentage: 38.1,
        ebitdaStatus: "HEALTHY",
        addOnUsed: true,
        systemBlockEvent: false,
        overrideApproved: false,
        closedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        flags: [],
      },
    ];
  }

  flagPricingAnomaly(auditId: string, tseId: string, reason: string): void {
    // In production: POST /api/tsm/pricing-audit/:auditId/flag
    console.log(`🚩 Pricing anomaly flagged for audit ${auditId}, TSE ${tseId}. Reason: ${reason}`);
  }

  // ============================================
  // 5️⃣ RENEWAL DASHBOARD
  // ============================================

  getRenewalLeads(): RenewalLead[] {
    // In production: GET /api/tsm/renewals
    return [
      {
        id: "REN-001",
        customerId: "CUST-001",
        customerName: "Deepak Mehta",
        assignedTSE: "TSE-001",
        tseName: "Rahul Sharma",
        currentPlan: "Smart Wash - Hatchback",
        monthlyValue: 1599,
        expiryDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
        daysUntilExpiry: 0,
        urgency: "TODAY",
        status: "CONTACTED",
        upgraded: false,
      },
      {
        id: "REN-002",
        customerId: "CUST-002",
        customerName: "Ritu Bansal",
        assignedTSE: "TSE-002",
        tseName: "Priya Patel",
        currentPlan: "Express Wash - Standard Bike",
        monthlyValue: 699,
        expiryDate: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: 1,
        urgency: "2_DAYS",
        status: "PENDING",
        upgraded: false,
      },
      {
        id: "REN-003",
        customerId: "CUST-003",
        customerName: "Arun Kapoor",
        assignedTSE: "TSE-004",
        tseName: "Sneha Desai",
        currentPlan: "Elite Wash - Hatchback",
        monthlyValue: 1999,
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: 5,
        urgency: "7_DAYS",
        status: "RENEWED",
        renewalValue: 10500,
        upgraded: true,
      },
      {
        id: "REN-004",
        customerId: "CUST-004",
        customerName: "Neha Gupta",
        assignedTSE: "TSE-005",
        tseName: "Karan Singh",
        currentPlan: "Smart Wash - SUV",
        monthlyValue: 1999,
        expiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: -2,
        urgency: "TODAY",
        status: "LAPSED",
        lapsedReason: "Price increase",
        upgraded: false,
      },
    ];
  }

  getRenewalMetrics(): RenewalMetricsTSM {
    // In production: GET /api/tsm/renewal-metrics
    return {
      expiringToday: 3,
      expiring2Days: 5,
      expiring7Days: 12,
      renewalRate: 68.5,
      renewalTarget: 70.0,
      upgradeConversions: 8,
      lapsedCount: 15,
      lapsedReasons: [
        { reason: "Price increase", count: 6, percentage: 40 },
        { reason: "Service quality", count: 4, percentage: 26.7 },
        { reason: "Competitor offer", count: 3, percentage: 20 },
        { reason: "Financial constraints", count: 2, percentage: 13.3 },
      ],
    };
  }

  // ============================================
  // 6️⃣ INCENTIVE & PAYROLL
  // ============================================

  getTeamIncentiveMetrics(): TeamIncentiveMetrics {
    // In production: GET /api/tsm/incentive-metrics
    const tseCards = this.getTSEPerformanceCards();

    // G3+G4+J1 FIX: per-sub pool share + derived conversion counts
    const AVG_DEAL_VALUE = 1599;
    const TSE_POOL_PER_SUB_3M = 79.5;
    const tseBreakdowns: TSEIncentiveBreakdown[] = tseCards.map((tse) => {
      const conversionsCount = Math.max(1, Math.round(tse.kpis.revenueGenerated.mtd / (AVG_DEAL_VALUE * 3)));
      const renewalsCount    = Math.max(0, Math.round(conversionsCount * (tse.renewalBonus > 0 ? 0.65 : 0.4)));
      const baseIncentive    = Math.round(conversionsCount * TSE_POOL_PER_SUB_3M);
      const conversionBonus  = tse.kpis.conversionRate.rate >= 25 ? Math.round(conversionsCount * 10) : 0;
      const qualityBonus     = tse.kpis.crmCompliance.score >= 100 ? 5000 :
                               tse.kpis.crmCompliance.score >= 95  ? 2500 : 0;
      const totalProjected   = baseIncentive + conversionBonus + tse.renewalBonus + qualityBonus;
      return {
        tseId: tse.id, tseName: tse.name,
        baseIncentive, conversionBonus,
        renewalBonus: tse.renewalBonus, qualityBonus, totalProjected,
        month: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        revenueGenerated: tse.kpis.revenueGenerated.mtd,
        conversionsCount, renewalsCount,
      };
    });

    return {
      totalTeamRevenue: tseCards.reduce((sum, tse) => sum + tse.kpis.revenueGenerated.mtd, 0),
      teamConversionRate: 42.3,
      teamRenewalRate: 68.5,
      totalBonusForecast: tseBreakdowns.reduce((sum, breakdown) => sum + breakdown.totalProjected, 0),
      tseBreakdowns,
    };
  }

  // ============================================
  // 7️⃣ ALERTS & NOTIFICATIONS
  // ============================================

  getSystemAlerts(): TSMAlert[] {
    // In production: GET /api/tsm/alerts
    return [
      {
        id: "ALERT-TSM-001",
        type: "LEAD_NOT_CALLED_10MIN",
        severity: "CRITICAL",
        title: "New Lead Not Contacted",
        description: "Lead LEAD-001 (Rajesh Patel) created 5 minutes ago, not yet contacted",
        tseId: "TSE-001",
        tseName: "Rahul Sharma",
        leadId: "LEAD-001",
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        actionRequired: "Contact lead immediately or reassign",
        autoEscalateIn: 5,
      },
      {
        id: "ALERT-TSM-002",
        type: "CRM_NOT_UPDATED_30MIN",
        severity: "WARNING",
        title: "CRM Update Pending",
        description: "Lead LEAD-003 contacted 48h ago but CRM not updated",
        tseId: "TSE-003",
        tseName: "Amit Kumar",
        leadId: "LEAD-003",
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        actionRequired: "Update CRM or flag for review",
      },
      {
        id: "ALERT-TSM-004",
        type: "SLA_BREACH_SPIKE",
        severity: "CRITICAL",
        title: "High-Risk Lead — 14/15 Attempts, CRM Non-Compliant",
        description: "Lead LEAD-003 (Vikram Reddy, TSE Amit Kumar): 14/15 attempts used, SLA breached, CRM not updated in 48h, follow-up was 12h ago. Requires immediate TSM intervention.",
        tseId: "TSE-003",
        tseName: "Amit Kumar",
        leadId: "LEAD-003",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        actionRequired: "Reassign lead or intervene directly — 1 attempt remains before max",
        autoEscalateIn: 15,
      },
      {
        id: "ALERT-TSM-003",
        type: "15_ATTEMPTS_REACHED",
        severity: "CRITICAL",
        title: "Max Attempts Reached",
        description: "Lead LEAD-005 has reached 15 attempts. Approval required to mark as Lost.",
        tseId: "TSE-005",
        tseName: "Karan Singh",
        leadId: "LEAD-005",
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        actionRequired: "Review and approve Lost status or reassign",
      },
    ];
  }

  // ============================================
  // 8️⃣ REPORTS & ANALYTICS
  // ============================================

  getAnalytics(): TSMAnalytics {
    // In production: GET /api/tsm/analytics
    const tseCards = this.getTSEPerformanceCards();

    return {
      leadSourcePerformance: [
        { source: "WEBSITE", totalLeads: 145, conversions: 62, conversionRate: 42.8, revenue: 1850000, avgDealValue: 29839 },
        { source: "REFERRAL", totalLeads: 78, conversions: 42, conversionRate: 53.8, revenue: 1250000, avgDealValue: 29762 },
        { source: "MARKETING", totalLeads: 112, conversions: 45, conversionRate: 40.2, revenue: 1320000, avgDealValue: 29333 },
        { source: "WALK_IN", totalLeads: 35, conversions: 18, conversionRate: 51.4, revenue: 580000, avgDealValue: 32222 },
        { source: "OTHER", totalLeads: 23, conversions: 8, conversionRate: 34.8, revenue: 220000, avgDealValue: 27500 },
      ],
      conversionFunnel: [
        { stage: "New Leads", count: 393, percentage: 100, dropOff: 0 },
        { stage: "Attempted", count: 312, percentage: 79.4, dropOff: 81 },
        { stage: "Follow-up", count: 235, percentage: 59.8, dropOff: 77 },
        { stage: "Converted", count: 175, percentage: 44.5, dropOff: 60 },
      ],
      tseRevenueRanking: tseCards
        // H2 FIX: derive conversions per TSE (was hardcoded 23 for all)
        .map((tse) => {
          const conversions = Math.max(1, Math.round(tse.kpis.revenueGenerated.mtd / (1599 * 3)));
          return {
            rank: 0,
            tseId: tse.id, tseName: tse.name,
            revenue: tse.kpis.revenueGenerated.mtd,
            conversions,
            avgDealValue: Math.round(tse.kpis.revenueGenerated.mtd / conversions),
            conversionRate: tse.kpis.conversionRate.rate,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .map((tse, idx) => ({ ...tse, rank: idx + 1 })),
      bundleTrends: [
        { dealType: "BASE", count: 65, percentage: 37.1, revenue: 1950000, avgEBITDA: 42.5 },
        { dealType: "ADD_ON", count: 48, percentage: 27.4, revenue: 1440000, avgEBITDA: 38.2 },
        { dealType: "BUNDLE_MID", count: 38, percentage: 21.7, revenue: 1140000, avgEBITDA: 35.8 },
        { dealType: "BUNDLE_LOW", count: 24, percentage: 13.7, revenue: 720000, avgEBITDA: 22.1 },
      ],
      crmComplianceByTSE: tseCards.map((tse) => ({
        tseId: tse.id,
        tseName: tse.name,
        score: tse.kpis.crmCompliance.score,
        status: tse.kpis.crmCompliance.status,
      })),
      // H1 FIX: varied per-TSE renewal rates derived from performance data
      renewalRateByTSE: tseCards.map((tse, i) => {
        const base = tse.kpis.conversionRate.rate * 1.3 + tse.kpis.crmCompliance.score * 0.2;
        const renewalRate = Math.min(95, Math.max(40, Math.round(base * 10) / 10));
        const conversions = Math.max(1, Math.round(tse.kpis.revenueGenerated.mtd / (1599 * 3)));
        const renewalsCount = Math.max(1, Math.round(conversions * renewalRate / 100));
        return { tseId: tse.id, tseName: tse.name, renewalRate, renewalsCount };
      }),
    };
  }

  // ============================================
  // 9️⃣ AUDIT & LOGGING
  // ============================================

  getAuditLog(): TSMAuditLog[] {
    // In production: GET /api/tsm/audit-log
    return [
      {
        id: "LOG-001",
        action: "LEAD_REASSIGNED",
        tsmId: "TSM-001",
        tsmName: "Vikram Malhotra",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        targetTSE: "TSE-002",
        leadId: "LEAD-003",
        description: "Lead reassigned from Amit Kumar to Priya Patel due to SLA breach",
      },
      {
        id: "LOG-002",
        action: "LOST_APPROVED",
        tsmId: "TSM-001",
        tsmName: "Vikram Malhotra",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        targetTSE: "TSE-005",
        leadId: "LEAD-005",
        description: "Lost status approved after 15 attempts",
      },
      {
        id: "LOG-003",
        action: "PRICING_OVERRIDE",
        tsmId: "TSM-001",
        tsmName: "Vikram Malhotra",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        targetTSE: "TSE-003",
        leadId: "LEAD-006",
        description: "LOW bundle with 18.5% EBITDA approved - strategic customer acquisition",
      },
    ];
  }

  logTSMAction(action: Omit<TSMAuditLog, "id" | "timestamp">): void {
    // In production: POST /api/tsm/audit-log
    console.log("📝 TSM Action logged:", action);
  }
}

// Singleton instance
export const teleSalesManagerService = new TeleSalesManagerService();
