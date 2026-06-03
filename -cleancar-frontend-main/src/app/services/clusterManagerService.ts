/**
 * Cluster Manager Data Service
 * Performance oversight and intervention management
 * 
 * ⚠️ CURRENT STATE: Using mock/sample data for demonstration
 * 🔄 PRODUCTION READY: All methods have API endpoint comments
 * 📝 TO INTEGRATE: Replace mock data with actual API calls (see "In production:" comments)
 * 
 * Philosophy:
 * - CM works through OMs, not directly with ground staff
 * - Alert-driven intervention system
 * - All actions logged and auditable
 * - System-calculated incentives
 * 
 * Architecture:
 * - All data flows through this centralized service
 * - No hard-coded data in components
 * - Ready for backend integration via simple API replacement
 */

import type {
  ClusterKPIs,
  ClusterSummary,
  OMPerformanceCard,
  OMDetailedPerformance,
  CMEscalation,
  CMIntervention,
  CMInterventionAction,
  CustomerEscalation,
  ClusterRevenue,
  ClusterRetention,
  ClusterAnalytics,
  CMAuditLog,
  CMIncentiveTracker,
  CMIncentiveKPI,
  CMAlert,
  TerritoryProposal,
  NextDayReadiness,
  EODSummary,
  DataState,
  ConversionQualityMetrics,
  EarlyChurnMetrics,
  SalesQualityFlag,
  ConversionFunnel,
  RenewalMetrics,
  InsightSuggestion,
  TSMFunnelMetrics,
  SLAImpactMetrics,
  FunnelStageMetrics,
  RenewalFunnelStage,
  RenewalHealthMetrics,
  StartOfDaySummary,
  AtRiskTodayPanel,
  LivePerformanceIndicator,
} from "../types/clusterManager.types";
import {
  KPI_TARGETS,
  KPI_THRESHOLDS,
  INCENTIVE_KPI_WEIGHTAGE,
  INCENTIVE_PAYOUT_THRESHOLDS,
  TEAM_MULTIPLIER_CONDITIONS,
  BASE_CM_INCENTIVE,
  CURRENT_CM_ID,
  CURRENT_CM_NAME,
  CLUSTER_NAME,
} from "../constants/clusterManager.constants";

class ClusterManagerService {
  // ============================================
  // 1️⃣ CLUSTER COMMAND DASHBOARD
  // ============================================

  getClusterKPIs(revenueTarget?: number): ClusterKPIs {
    // In production: GET /api/cm/cluster/kpis
    const target = revenueTarget ?? KPI_TARGETS.REVENUE_MTD;
    return {
      revenue: {
        mtd: 9856000,
        target,
        percentage: (9856000 / target) * 100,
        trend: "UP",
      },
      unitProductivity: {
        avgPerWasher: 23.4,
        target: KPI_TARGETS.UNITS_PER_WASHER_DAY,
        percentage: 93.6,
      },
      conversion: {
        rate: 42.3,
        target: KPI_TARGETS.CONVERSION_RATE,
        percentage: 94.0,
      },
      retention: {
        rate: 87.2,
        target: KPI_TARGETS.RETENTION_RATE,
        percentage: 102.6,
      },
      compliance: {
        score: 86,
        target: KPI_TARGETS.COMPLIANCE_SCORE,
        issues: 7,
      },
      activeCustomers: {
        current: 1247,
        lastMonth: 1189,
        change: 58,
      },
      openEscalations: {
        total: 18,
        critical: 4,
        overdue: 2,
      },
      churnRisk: {
        high: 12,
        medium: 28,
        low: 45,
      },
    };
  }

  getClusterSummary(): ClusterSummary {
    // In production: GET /api/cm/cluster/summary
    return {
      totalUnitsToday: {
        fourW: 5234.8,
        twoW: 2145.6,
        addOn: 892.3,
        total: 8272.7,
        target: 10200,
      },
      supervisorsActive: {
        present: 59,
        expected: 62,
        percentage: 95.2,
      },
      washersActive: {
        present: 312,
        expected: 368,
        percentage: 84.8,
      },
      omsOnline: {
        active: 5,
        total: 6,
      },
    };
  }

  getOMPerformanceCards(): OMPerformanceCard[] {
    // In production: GET /api/cm/oms/performance-cards
    const oms: OMPerformanceCard[] = [
      {
        id: "OM-001",
        name: "Rajesh Kumar",
        location: "Ahmedabad Central",
        status: "ACTIVE",
        overallHealth: "GREEN",
        kpis: {
          revenue: { mtd: 2145000, target: 2000000, percentage: 107.3, status: "GREEN" },
          units: { today: 1847, target: 1700, percentage: 108.6, status: "GREEN" },
          conversion: { rate: 46.5, target: 45, status: "GREEN" },
          retention: { rate: 91.2, target: 85, status: "GREEN" },
          compliance: { score: 94, issues: 1, status: "GREEN" },
        },
        alerts: 1,
        lastActivity: new Date(Date.now() - 5 * 60 * 1000),
        teamsSummary: { teams: 6, washers: 102, activeWashers: 96 },
      },
      {
        id: "OM-002",
        name: "Amit Patel",
        location: "Gandhinagar",
        status: "FIELD",
        overallHealth: "GREEN",
        kpis: {
          revenue: { mtd: 1890000, target: 2000000, percentage: 94.5, status: "AMBER" },
          units: { today: 1654, target: 1700, percentage: 97.3, status: "GREEN" },
          conversion: { rate: 44.2, target: 45, status: "AMBER" },
          retention: { rate: 88.5, target: 85, status: "GREEN" },
          compliance: { score: 91, issues: 2, status: "GREEN" },
        },
        alerts: 2,
        lastActivity: new Date(Date.now() - 25 * 60 * 1000),
        teamsSummary: { teams: 6, washers: 102, activeWashers: 92 },
      },
      {
        id: "OM-003",
        name: "Suresh Shah",
        location: "Surat",
        status: "ISSUES",
        overallHealth: "RED",
        kpis: {
          revenue: { mtd: 1456000, target: 2000000, percentage: 72.8, status: "RED" },
          units: { today: 1234, target: 1700, percentage: 72.6, status: "RED" },
          conversion: { rate: 38.7, target: 45, status: "RED" },
          retention: { rate: 79.4, target: 85, status: "AMBER" },
          compliance: { score: 82, issues: 5, status: "AMBER" },
        },
        alerts: 8,
        lastActivity: new Date(Date.now() - 90 * 60 * 1000),
        teamsSummary: { teams: 6, washers: 102, activeWashers: 78 },
      },
      {
        id: "OM-004",
        name: "Prakash Joshi",
        location: "Vadodara",
        status: "ACTIVE",
        overallHealth: "AMBER",
        kpis: {
          revenue: { mtd: 1723000, target: 2000000, percentage: 86.2, status: "AMBER" },
          units: { today: 1512, target: 1700, percentage: 88.9, status: "AMBER" },
          conversion: { rate: 42.1, target: 45, status: "AMBER" },
          retention: { rate: 86.7, target: 85, status: "GREEN" },
          compliance: { score: 88, issues: 2, status: "AMBER" },
        },
        alerts: 3,
        lastActivity: new Date(Date.now() - 15 * 60 * 1000),
        teamsSummary: { teams: 6, washers: 102, activeWashers: 87 },
      },
      {
        id: "OM-005",
        name: "Dinesh Mehta",
        location: "Ahmedabad West",
        status: "ACTIVE",
        overallHealth: "GREEN",
        kpis: {
          revenue: { mtd: 1912000, target: 2000000, percentage: 95.6, status: "GREEN" },
          units: { today: 1678, target: 1700, percentage: 98.7, status: "GREEN" },
          conversion: { rate: 45.8, target: 45, status: "GREEN" },
          retention: { rate: 89.3, target: 85, status: "GREEN" },
          compliance: { score: 92, issues: 1, status: "GREEN" },
        },
        alerts: 1,
        lastActivity: new Date(Date.now() - 8 * 60 * 1000),
        teamsSummary: { teams: 6, washers: 102, activeWashers: 94 },
      },
      {
        id: "OM-006",
        name: "Vikas Sharma",
        location: "Ahmedabad East",
        status: "IDLE",
        overallHealth: "AMBER",
        kpis: {
          revenue: { mtd: 1730000, target: 2000000, percentage: 86.5, status: "AMBER" },
          units: { today: 1347, target: 1700, percentage: 79.2, status: "RED" },
          conversion: { rate: 41.5, target: 45, status: "AMBER" },
          retention: { rate: 84.8, target: 85, status: "AMBER" },
          compliance: { score: 87, issues: 3, status: "AMBER" },
        },
        alerts: 4,
        lastActivity: new Date(Date.now() - 65 * 60 * 1000),
        teamsSummary: { teams: 6, washers: 102, activeWashers: 85 },
      },
    ];

    return oms;
  }

  // ============================================
  // 2️⃣ OM PERFORMANCE VIEW (DETAILED)
  // ============================================

  getOMDetailedPerformance(omId: string): OMDetailedPerformance {
    // In production: GET /api/cm/oms/:omId/detailed
    const omCards = this.getOMPerformanceCards();
    const om = omCards.find((o) => o.id === omId) || omCards[0];

    return {
      om,
      trends: {
        revenue: {
          last7Days: [1800000, 1850000, 1920000, 1880000, 1950000, 2000000, 2145000],
          growth: 19.2,
          sparkline: [
            { day: "Mon", value: 1800000 },
            { day: "Tue", value: 1850000 },
            { day: "Wed", value: 1920000 },
            { day: "Thu", value: 1880000 },
            { day: "Fri", value: 1950000 },
            { day: "Sat", value: 2000000 },
            { day: "Sun", value: 2145000 },
          ],
        },
        conversion: {
          last7Days: [43.2, 44.5, 45.8, 44.1, 46.2, 47.1, 46.5],
          average: 45.3,
          sparkline: [
            { day: "Mon", value: 43.2 },
            { day: "Tue", value: 44.5 },
            { day: "Wed", value: 45.8 },
            { day: "Thu", value: 44.1 },
            { day: "Fri", value: 46.2 },
            { day: "Sat", value: 47.1 },
            { day: "Sun", value: 46.5 },
          ],
        },
        retention: {
          last7Days: [89.5, 90.2, 91.1, 90.8, 91.5, 91.8, 91.2],
          average: 90.9,
          sparkline: [
            { day: "Mon", value: 89.5 },
            { day: "Tue", value: 90.2 },
            { day: "Wed", value: 91.1 },
            { day: "Thu", value: 90.8 },
            { day: "Fri", value: 91.5 },
            { day: "Sat", value: 91.8 },
            { day: "Sun", value: 91.2 },
          ],
        },
        compliance: {
          last7Days: [92, 93, 94, 93, 95, 94, 94],
          average: 93.6,
          sparkline: [
            { day: "Mon", value: 92 },
            { day: "Tue", value: 93 },
            { day: "Wed", value: 94 },
            { day: "Thu", value: 93 },
            { day: "Fri", value: 95 },
            { day: "Sat", value: 94 },
            { day: "Sun", value: 94 },
          ],
        },
      },
      openComplaints: 2,
      pendingApprovals: 3,
      lastFieldVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      pipeline: {
        leads: 15,
        demos: 8,
        negotiations: 5,
        value: 1250000,
      },
      teamStatus: {
        supervisorCount: 6,
        washerCount: 102,
        attendanceRate: 94.1,
        avgUnitsPerWasher: 24.8,
      },
    };
  }

  // ============================================
  // 3️⃣ ESCALATION & INTERVENTION QUEUE
  // ============================================

  getEscalations(): CMEscalation[] {
    // In production: GET /api/cm/escalations
    return [
      {
        id: "ESC-CM-001",
        type: "COMPLAINT_SLA",
        severity: "CRITICAL",
        omId: "OM-003",
        omName: "Suresh Shah",
        timePending: 145,
        createdAt: new Date(Date.now() - 145 * 60 * 1000),
        description: "Customer complaint pending resolution for 2.5 hours. SLA breached.",
        impact: { customers: 1, revenue: 25000 },
        status: "PENDING",
        requiredAction: "Immediate resolution or escalate to City Manager",
        attachments: ["complaint-screenshot.png"],
      },
      {
        id: "ESC-CM-002",
        type: "REVENUE_GAP",
        severity: "CRITICAL",
        omId: "OM-003",
        omName: "Suresh Shah",
        timePending: 90,
        createdAt: new Date(Date.now() - 90 * 60 * 1000),
        description: "Revenue at 72.8% of target. Significant underperformance.",
        impact: { revenue: 544000 },
        status: "PENDING",
        requiredAction: "Request action plan from OM or initiate intervention",
      },
      {
        id: "ESC-CM-003",
        type: "OM_INACTIVITY",
        severity: "HIGH",
        omId: "OM-006",
        omName: "Vikas Sharma",
        timePending: 65,
        createdAt: new Date(Date.now() - 65 * 60 * 1000),
        description: "OM inactive for 65 minutes during operational hours.",
        impact: {},
        status: "PENDING",
        requiredAction: "Contact OM or reassign urgent tasks",
      },
      {
        id: "ESC-CM-004",
        type: "RETENTION_FAILURE",
        severity: "HIGH",
        omId: "OM-003",
        omName: "Suresh Shah",
        timePending: 120,
        createdAt: new Date(Date.now() - 120 * 60 * 1000),
        description: "3 high-value customers churned this week. Retention rate below target.",
        impact: { customers: 3, revenue: 95000 },
        status: "PENDING",
        requiredAction: "Conduct retention review with OM",
      },
      {
        id: "ESC-CM-005",
        type: "COVER_CAPACITY",
        severity: "MEDIUM",
        omId: "OM-004",
        omName: "Prakash Joshi",
        timePending: 45,
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
        description: "Insufficient cover capacity due to high absenteeism.",
        impact: { units: 125 },
        status: "PENDING",
        requiredAction: "Approve inter-team cover redistribution",
      },
      {
        id: "ESC-CM-006",
        type: "INCENTIVE_REQUEST",
        severity: "MEDIUM",
        omId: "OM-002",
        omName: "Amit Patel",
        timePending: 30,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        description: "OM requesting approval for exception-based incentive.",
        impact: {},
        status: "PENDING",
        requiredAction: "Review and approve/reject",
      },
      {
        id: "ESC-CM-007",
        type: "COMPLIANCE_BREACH",
        severity: "HIGH",
        omId: "OM-003",
        omName: "Suresh Shah",
        timePending: 75,
        createdAt: new Date(Date.now() - 75 * 60 * 1000),
        description: "5 compliance issues detected. Action required.",
        impact: {},
        status: "PENDING",
        requiredAction: "Audit and corrective action plan",
      },
    ];
  }

  recordIntervention(intervention: Omit<CMIntervention, "id" | "timestamp">): void {
    // In production: POST /api/cm/interventions
    console.log("✅ CM Intervention recorded:", intervention);
  }

  resolveEscalation(escalationId: string, cmId: string, notes: string): void {
    // In production: POST /api/cm/escalations/:id/resolve
    console.log(`✅ Escalation ${escalationId} resolved by ${cmId}:`, notes);
  }

  assignToOM(escalationId: string, omId: string, deadline: Date, notes: string): void {
    // In production: POST /api/cm/escalations/:id/assign
    console.log(`📤 Escalation ${escalationId} assigned to ${omId}. Deadline:`, deadline, notes);
  }

  escalateToCityManager(escalationId: string, cmId: string, notes: string): void {
    // In production: POST /api/cm/escalations/:id/escalate-up
    console.log(`⬆️ Escalation ${escalationId} escalated to City Manager by ${cmId}:`, notes);
  }

  // ============================================
  // 4️⃣ REVENUE & PIPELINE DASHBOARD
  // ============================================

  getClusterRevenue(): ClusterRevenue {
    // In production: GET /api/cm/revenue
    const omCards = this.getOMPerformanceCards();

    return {
      cluster: {
        mtd: 10856000,
        target: 12000000,
        percentage: 90.5,
      },
      byOM: omCards.map((om) => ({
        omId: om.id,
        omName: om.name,
        revenue: om.kpis.revenue.mtd,
        target: om.kpis.revenue.target,
        percentage: om.kpis.revenue.percentage,
        status: om.kpis.revenue.status,
      })),
      funnel: {
        leads: 145,
        demos: 78,
        negotiations: 42,
        closedWon: 35,
        closedLost: 12,
        conversionRate: 42.3,
      },
      stalledPipeline: [
        {
          leadId: "LEAD-CR-001",
          customerName: "Raj Society - 120 units",
          omName: "Suresh Shah",
          daysStuck: 15,
          stage: "Negotiation",
          value: 850000,
        },
        {
          leadId: "LEAD-CR-002",
          customerName: "Tech Corp Ltd",
          omName: "Prakash Joshi",
          daysStuck: 12,
          stage: "Demo Done",
          value: 450000,
        },
        {
          leadId: "LEAD-CR-003",
          customerName: "Green Valley Apartments",
          omName: "Vikas Sharma",
          daysStuck: 11,
          stage: "Negotiation",
          value: 320000,
        },
      ],
    };
  }

  // ============================================
  // 5️⃣ RETENTION & CUSTOMER HEALTH
  // ============================================

  getClusterRetention(): ClusterRetention {
    // In production: GET /api/cm/retention
    return {
      churnRisk: [
        {
          customerId: "CUST-001",
          customerName: "Mr. Ramesh Patel",
          omId: "OM-003",
          omName: "Suresh Shah",
          risk: "HIGH",
          missedWashes: 4,
          complaints: 2,
          lastWashDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          subscriptionValue: 8500,
          recommendedAction: "Immediate retention call + discount offer",
        },
        {
          customerId: "CUST-002",
          customerName: "Tech Solutions Pvt Ltd",
          omId: "OM-003",
          omName: "Suresh Shah",
          risk: "HIGH",
          missedWashes: 3,
          complaints: 1,
          lastWashDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          subscriptionValue: 45000,
          recommendedAction: "OM field visit + service quality review",
        },
        {
          customerId: "CUST-003",
          customerName: "Silver Oak Society",
          omId: "OM-004",
          omName: "Prakash Joshi",
          risk: "MEDIUM",
          missedWashes: 2,
          complaints: 0,
          lastWashDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          subscriptionValue: 125000,
          recommendedAction: "Proactive check-in call",
        },
      ],
      slaTracker: [
        {
          complaintId: "CMP-001",
          customerName: "Mr. Sharma",
          omName: "Suresh Shah",
          createdAt: new Date(Date.now() - 150 * 60 * 1000),
          acknowledgementTime: new Date(Date.now() - 140 * 60 * 1000),
          resolutionTime: undefined,
          slaStatus: "BREACHED",
          minutesRemaining: -30,
        },
        {
          complaintId: "CMP-002",
          customerName: "ABC Corp",
          omName: "Amit Patel",
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
          acknowledgementTime: new Date(Date.now() - 38 * 60 * 1000),
          resolutionTime: undefined,
          slaStatus: "AT_RISK",
          minutesRemaining: 35,
        },
      ],
      upsellOpportunities: [
        {
          customerId: "CUST-UP-001",
          customerName: "Vista Apartments",
          omName: "Rajesh Kumar",
          currentPackage: "4W Alternate Day",
          suggestedPackage: "4W Daily + Interior",
          additionalRevenue: 15000,
        },
        {
          customerId: "CUST-UP-002",
          customerName: "TechPark Ltd",
          omName: "Dinesh Mehta",
          currentPackage: "4W Daily",
          suggestedPackage: "4W Daily + Detailing",
          additionalRevenue: 8500,
        },
      ],
      retentionByOM: this.getOMPerformanceCards().map((om) => ({
        omId: om.id,
        omName: om.name,
        retentionRate: om.kpis.retention.rate,
        churnCount: Math.floor(0.6 * 5),
        satisfactionTrend: om.kpis.retention.rate > 88 ? "UP" : om.kpis.retention.rate > 85 ? "STABLE" : "DOWN",
      })),
    };
  }

  // ============================================
  // 6️⃣ REPORTS & ANALYTICS
  // ============================================

  getClusterAnalytics(): ClusterAnalytics {
    // In production: GET /api/cm/analytics
    const omCards = this.getOMPerformanceCards();

    const omRanking = omCards
      .map((om, index) => ({
        rank: 0,
        omId: om.id,
        omName: om.name,
        overallScore:
          om.kpis.revenue.percentage * 0.4 +
          om.kpis.conversion.rate +
          om.kpis.retention.rate * 0.3 +
          om.kpis.compliance.score * 0.3,
        revenue: om.kpis.revenue.percentage,
        conversion: om.kpis.conversion.rate,
        retention: om.kpis.retention.rate,
        compliance: om.kpis.compliance.score,
        trend: om.overallHealth === "GREEN" ? "UP" : om.overallHealth === "AMBER" ? "STABLE" : "DOWN",
      }))
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((om, index) => ({ ...om, rank: index + 1 }));

    return {
      omRanking,
      unitProductivity: omCards.map((om) => {
        const avgUnits = om.kpis.units.today / om.teamsSummary.activeWashers;
        return {
          omName: om.name,
          avgUnitsPerWasher: Math.round(avgUnits * 10) / 10,
          target: 25,
          variance: Math.round((avgUnits - 25) * 10) / 10,
          trend: avgUnits >= 25 ? "IMPROVING" : avgUnits >= 22 ? "STABLE" : "DECLINING",
        };
      }),
      complianceTrends: [
        { week: "Week 1", score: 88, issues: 12, resolved: 10 },
        { week: "Week 2", score: 90, issues: 8, resolved: 7 },
        { week: "Week 3", score: 87, issues: 15, resolved: 13 },
        { week: "Week 4", score: 86, issues: 18, resolved: 14 },
      ],
      attritionHeatmap: omCards.map((om) => ({
        omName: om.name,
        washerAttrition: Math.floor(0.6 * 15),
        teamAttrition: Math.floor(0.6 * 3),
        severity: om.overallHealth === "RED" ? "HIGH" : om.overallHealth === "AMBER" ? "MEDIUM" : "LOW",
      })),
      territoryCoverage: [
        { area: "Ahmedabad Central", omName: "Rajesh Kumar", customers: 425, coverage: 78, potential: 125 },
        { area: "Gandhinagar", omName: "Amit Patel", customers: 312, coverage: 65, potential: 168 },
        { area: "Surat", omName: "Suresh Shah", customers: 198, coverage: 45, potential: 242 },
        { area: "Vadodara", omName: "Prakash Joshi", customers: 285, coverage: 58, potential: 205 },
      ],
      incentiveForecast: [
        { month: "January", projected: 425000, actual: 438000, variance: 13000 },
        { month: "February", projected: 445000, actual: 452000, variance: 7000 },
        { month: "March", projected: 465000, actual: 461000, variance: -4000 },
        { month: "April", projected: 485000 },
      ],
      territoryProposals: this.getTerritoryProposals(), // V6: Expansion planning
    };
  }

  // ============================================
  // 🆕 V6: EXPANSION SUPPORT (TERRITORY PROPOSALS)
  // ============================================

  getTerritoryProposals(): TerritoryProposal[] {
    // In production: GET /api/cm/territory-proposals
    return [
      {
        id: "TP-001",
        proposedBy: CURRENT_CM_ID,
        proposedByName: CURRENT_CM_NAME,
        territoryName: "Rajkot Central",
        location: "Rajkot, Gujarat",
        expectedRevenue: 1800000, // ₹18L per month
        requiredWashers: 85,
        requiredTeams: 5,
        clusterAssignment: CLUSTER_NAME,
        customerDensity: 450,
        rationale: "High-density residential area with limited competitor presence. Strong demand from apartment complexes.",
        competitorPresence: "LOW",
        infrastructureReady: true,
        estimatedSetupCost: 2500000, // ₹25L
        estimatedBreakeven: 14, // months
        status: "SUBMITTED",
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: "TP-002",
        proposedBy: CURRENT_CM_ID,
        proposedByName: CURRENT_CM_NAME,
        territoryName: "Anand District",
        location: "Anand, Gujarat",
        expectedRevenue: 950000, // ₹9.5L per month
        requiredWashers: 45,
        requiredTeams: 3,
        clusterAssignment: CLUSTER_NAME,
        customerDensity: 220,
        rationale: "Growing IT hub with increasing vehicle ownership. Opportunity for corporate partnerships.",
        competitorPresence: "MEDIUM",
        infrastructureReady: false,
        estimatedSetupCost: 1800000, // ₹18L
        estimatedBreakeven: 19, // months
        status: "DRAFT",
      },
      {
        id: "TP-003",
        proposedBy: CURRENT_CM_ID,
        proposedByName: CURRENT_CM_NAME,
        territoryName: "Bhavnagar Port Area",
        location: "Bhavnagar, Gujarat",
        expectedRevenue: 1200000, // ₹12L per month
        requiredWashers: 60,
        requiredTeams: 4,
        clusterAssignment: CLUSTER_NAME,
        customerDensity: 310,
        rationale: "Port city with commercial vehicle demand. Untapped market with high potential.",
        competitorPresence: "LOW",
        infrastructureReady: true,
        estimatedSetupCost: 2000000, // ₹20L
        estimatedBreakeven: 16, // months
        status: "UNDER_REVIEW",
        submittedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        reviewedBy: "CITY-MGR-001",
        reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        reviewNotes: "Strong business case. Awaiting final budget approval from MD.",
      },
    ];
  }

  submitTerritoryProposal(proposal: Omit<TerritoryProposal, "id" | "proposedBy" | "proposedByName" | "submittedAt">): void {
    // In production: POST /api/cm/territory-proposals
    console.log("✅ Territory Proposal submitted by CM:", {
      ...proposal,
      proposedBy: CURRENT_CM_ID,
      proposedByName: CURRENT_CM_NAME,
    });
  }

  updateTerritoryProposal(proposalId: string, updates: Partial<TerritoryProposal>): void {
    // In production: PUT /api/cm/territory-proposals/:id
    console.log(`✅ Territory Proposal ${proposalId} updated:`, updates);
  }

  deleteTerritoryProposal(proposalId: string): void {
    // In production: DELETE /api/cm/territory-proposals/:id
    console.log(`🗑️ Territory Proposal ${proposalId} deleted`);
  }

  // ============================================
  // AUDIT & LOGGING
  // ============================================

  getAuditLog(filters?: { startDate?: Date; endDate?: Date }): CMAuditLog[] {
    // In production: GET /api/cm/audit-log
    return [
      {
        id: "AUDIT-CM-001",
        action: "RESOLVE_ESCALATION",
        cmId: "CM-001",
        cmName: "Priya Sharma",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        targetOM: "Amit Patel",
        description: "Resolved incentive request escalation",
        impact: "Approved ₹2,500 exception-based incentive",
        metadata: { escalationId: "ESC-CM-006", amount: 2500 },
      },
      {
        id: "AUDIT-CM-002",
        action: "ESCALATE_UP",
        cmId: "CM-001",
        cmName: "Priya Sharma",
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        targetOM: "Suresh Shah",
        description: "Escalated revenue gap issue to City Manager",
        impact: "Critical performance issue requiring higher intervention",
        metadata: { escalationId: "ESC-CM-002", revenueGap: 544000 },
      },
      {
        id: "AUDIT-CM-003",
        action: "INTERVENTION",
        cmId: "CM-001",
        cmName: "Priya Sharma",
        timestamp: new Date(Date.now() - 120 * 60 * 1000),
        targetOM: "Vikas Sharma",
        description: "Initiated performance review session",
        impact: "Scheduled intervention meeting for tomorrow",
      },
      {
        id: "AUDIT-CM-004",
        action: "REPORT_DOWNLOAD",
        cmId: "CM-001",
        cmName: "Priya Sharma",
        timestamp: new Date(Date.now() - 180 * 60 * 1000),
        description: "Downloaded cluster summary report",
      },
    ];
  }

  logCMAction(action: Omit<CMAuditLog, "id" | "timestamp">): void {
    // In production: POST /api/cm/audit-log
    console.log("📝 CM Action logged:", action);
  }

  // ============================================
  // 7️⃣ OM INTERVENTION CENTER (NEW - PRIMARY SCREEN)
  // ============================================

  getInterventions(): CMIntervention[] {
    // In production: GET /api/cm/interventions
    const omCards = this.getOMPerformanceCards();

    const interventions: CMIntervention[] = [
      // Revenue Drop - OM-003 (Suresh Shah)
      {
        id: "INT-CM-001",
        omId: "OM-003",
        omName: "Suresh Shah",
        triggerType: "REVENUE_DROP",
        severity: "CRITICAL",
        daysSinceTrigger: 3,
        triggeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: "PENDING",
        issueSource: "FUNNEL", // V10: Funnel issue
        kpiSnapshot: {
          revenue: 72.8,
        },
        problemSummary: "OM revenue at 72.8% of MTD target. Pipeline stalled with 3 major deals inactive for >15 days.",
        rootCauseCategory: "FUNNEL", // V10: Poor lead handling
      },
      // Retention Failure - OM-003 (Suresh Shah)
      {
        id: "INT-CM-002",
        omId: "OM-003",
        omName: "Suresh Shah",
        triggerType: "RETENTION_FAILURE",
        severity: "CRITICAL",
        daysSinceTrigger: 2,
        triggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: "IN_PROGRESS",
        issueSource: "OPS", // V8: Operations issue
        kpiSnapshot: {
          retention: 79.4,
        },
        problemSummary: "3 high-value customers churned this week. Retention rate dropped to 79.4% (target: 85%).",
        rootCause: "Service quality issues reported. Repeated complaints about washer punctuality and incomplete washes.",
        rootCauseCategory: "OPS", // V8: Execution gap
        actionPlan: {
          task: "Conduct customer retention audit with OM. Assign dedicated supervisor to at-risk accounts.",
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          notes: "Focus on 5 high-risk accounts totaling ₹2.5L monthly revenue. Implement daily quality checks.",
        },
        followUp: {
          nextReviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          lastUpdate: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
      },
      // Complaint Delay - OM-003 (Suresh Shah)
      {
        id: "INT-CM-003",
        omId: "OM-003",
        omName: "Suresh Shah",
        triggerType: "COMPLAINT_DELAY",
        severity: "CRITICAL",
        daysSinceTrigger: 1,
        triggeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: "PENDING",
        issueSource: "CRM", // V8: CRM discipline issue
        kpiSnapshot: {
          complaints: 5,
        },
        problemSummary: "5 complaints unresolved for >24 hours. SLA breach on 2 critical customer accounts.",
        rootCauseCategory: "CRM", // V8: Follow-up gap
      },
      // V10: SLA Breach Pattern - OM-003 (Funnel Issue)
      {
        id: "INT-CM-007",
        omId: "OM-003",
        omName: "Suresh Shah",
        triggerType: "SALES_QUALITY",
        severity: "CRITICAL",
        daysSinceTrigger: 4,
        triggeredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        status: "PENDING",
        issueSource: "FUNNEL", // V10: TSM/Funnel issue
        kpiSnapshot: {
          conversionQuality: 24.1, // Low conversion rate
        },
        problemSummary: "28 SLA breaches in past 30 days. Conversion rate dropped to 24.1% (vs. 48.5% when SLA met).",
        rootCause: "First-call SLA breaches causing 20.3% conversion gap. Poor lead follow-up discipline.",
        rootCauseCategory: "FUNNEL", // V10: SLA breach / lead handling
        actionPlan: {
          task: "Review TSE first-call discipline. Implement mandatory 24h first-call tracking with alerts.",
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          notes: "Coordinate with TSM. Focus on leads >24h without contact. High revenue impact (₹12.5L estimated loss).",
        },
        followUp: {
          nextReviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          lastUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
      },
      // V11: Renewal Failure - OM-003 (Renewal Issue)
      {
        id: "INT-CM-008",
        omId: "OM-003",
        omName: "Suresh Shah",
        triggerType: "RENEWAL_FAILURE",
        severity: "CRITICAL",
        daysSinceTrigger: 2,
        triggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: "PENDING",
        issueSource: "RENEWAL", // V11: Renewal lifecycle issue
        kpiSnapshot: {
          retention: 79.4,
          earlyChurn: 5.4,
        },
        problemSummary: "Renewal rate at 52.3% - critical threshold breach. 47 customers lapsed this month (₹4.29L revenue lost).",
        rootCause: "High lapse rate driven by price increase communication issues and service quality concerns. Top lapse reason: Price increase (38.3%).",
        rootCauseCategory: "RENEWAL", // V11: Renewal/pricing issue
        actionPlan: {
          task: "Review TSM renewal protocols and pricing communication. Focus on 23 high-risk renewals in next 30 days. Implement proactive value communication 60 days before renewal.",
          deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          notes: "Critical: ₹7.95L at risk in next 30 days. Consider retention incentives for at-risk accounts. Coordinate with TSM on renewal approach timing.",
        },
        followUp: {
          nextReviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          lastUpdate: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
      },
      // Compliance Failure - OM-003 (Suresh Shah)
      {
        id: "INT-CM-004",
        omId: "OM-003",
        omName: "Suresh Shah",
        triggerType: "COMPLIANCE_FAILURE",
        severity: "WARNING",
        daysSinceTrigger: 5,
        triggeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "IN_PROGRESS",
        issueSource: "OPS", // V8: Operations issue
        kpiSnapshot: {
          compliance: 82,
        },
        problemSummary: "GPS/Selfie compliance at 82% (target: 90%). Audit detected 18% non-compliant washes.",
        rootCause: "Washers skipping GPS tagging during peak hours. Supervisor oversight insufficient.",
        rootCauseCategory: "OPS", // V8: Execution gap
        actionPlan: {
          task: "Implement mandatory GPS check at job start. Daily compliance report review with OM.",
          deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          notes: "OM must submit daily compliance report. Non-compliance results in incentive hold.",
        },
        followUp: {
          nextReviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      },
      // Override Pattern - OM-004 (Prakash Joshi)
      {
        id: "INT-CM-005",
        omId: "OM-004",
        omName: "Prakash Joshi",
        triggerType: "OVERRIDE_PATTERN",
        severity: "WARNING",
        daysSinceTrigger: 7,
        triggeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: "RESOLVED",
        issueSource: "OPS", // V8: Operations issue
        kpiSnapshot: {
          overrides: 4,
        },
        problemSummary: "4 system overrides in past 30 days. Pattern indicates process circumvention.",
        rootCause: "OM bypassing approval workflow for incentive exceptions. No documented justification.",
        rootCauseCategory: "OPS", // V8: Process circumvention
        actionPlan: {
          task: "Implement mandatory override justification form. All overrides require CM approval.",
          deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          notes: "Override privileges revoked. Future exceptions require written request to CM.",
        },
        followUp: {
          nextReviewDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      },
      // Cluster Risk - Multi-OM
      {
        id: "INT-CM-006",
        omId: "CLUSTER",
        omName: "Cluster-Wide Issue",
        triggerType: "CLUSTER_RISK",
        severity: "CRITICAL",
        daysSinceTrigger: 1,
        triggeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: "ESCALATED_TO_CITY_MANAGER",
        issueSource: "MIXED", // V8: Mixed ops + external issue
        kpiSnapshot: {
          revenue: 82.1,
          retention: 87.2,
          compliance: 86,
        },
        problemSummary: "3 OMs underperforming simultaneously. Cluster MTD revenue at 82.1% of target.",
        rootCause: "Monsoon season impact. Increased cancellations + washer absenteeism + coverage gaps.",
        rootCauseCategory: "MIXED", // V8: External + ops factors
        actionPlan: {
          task: "Deploy inter-cluster cover washers. Activate backup supervisor teams.",
          deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          notes: "City Manager approved emergency budget for temp hires.",
        },
        escalationDetails: {
          reason: "Cluster-level resource shortage. Requires inter-cluster coordination.",
          escalatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          escalatedBy: "CM-001",
          recommendation: "APPROVE",
        },
        followUp: {
          nextReviewDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          lastUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
      },
    ];

    return interventions;
  }

  getCustomerEscalations(): CustomerEscalation[] {
    // In production: GET /api/cm/customer-escalations
    return [
      {
        id: "CUST-ESC-001",
        customerId: "CUST-001",
        customerName: "Mr. Ramesh Patel",
        omId: "OM-003",
        omName: "Suresh Shah",
        escalationType: "CRITICAL_COMPLAINT",
        severity: "CRITICAL",
        slaTimer: {
          remainingMinutes: 25,
          deadline: new Date(Date.now() + 25 * 60 * 1000),
        },
        details: {
          complaintCount: 3,
        },
        description: "Customer complaint unresolved for 26 hours. Threatening contract cancellation.",
        createdAt: new Date(Date.now() - 35 * 60 * 1000),
        status: "PENDING",
        actionLog: [
          {
            action: "Escalated to CM by OM",
            takenAt: new Date(Date.now() - 35 * 60 * 1000),
            takenBy: "OM-003",
          },
        ],
      },
      {
        id: "CUST-ESC-002",
        customerId: "CUST-HV-001",
        customerName: "Silver Oak Society (Premium - 8 vehicles)",
        omId: "OM-003",
        omName: "Suresh Shah",
        escalationType: "HIGH_VALUE_RISK",
        severity: "HIGH",
        slaTimer: {
          remainingMinutes: 95,
          deadline: new Date(Date.now() + 95 * 60 * 1000),
        },
        details: {
          complaintCount: 2,
          vehicleCount: 8,
        },
        description: "Premium customer (₹45K/month) with 2 quality complaints in 1 week.",
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
        status: "IN_PROGRESS",
        actionLog: [
          {
            action: "CM assigned dedicated supervisor",
            takenAt: new Date(Date.now() - 15 * 60 * 1000),
            takenBy: "CM-001",
          },
          {
            action: "Escalated to CM",
            takenAt: new Date(Date.now() - 25 * 60 * 1000),
            takenBy: "OM-003",
          },
        ],
      },
      {
        id: "CUST-ESC-003",
        customerId: "AREA-SURAT-01",
        customerName: "Surat West Area (4 customers)",
        omId: "OM-003",
        omName: "Suresh Shah",
        escalationType: "AREA_FAILURE",
        severity: "HIGH",
        slaTimer: {
          remainingMinutes: 215,
          deadline: new Date(Date.now() + 215 * 60 * 1000),
        },
        details: {
          complaintCount: 4,
          areaAffected: "Surat West",
        },
        description: "4 complaints from same area in 48 hours. Pattern indicates coverage issue.",
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
        status: "PENDING",
      },
    ];
  }

  updateInterventionStatus(
    interventionId: string,
    status: CMIntervention["status"],
    updates: Partial<Pick<CMIntervention, "rootCause" | "actionPlan" | "followUp">>
  ): void {
    // In production: PUT /api/cm/interventions/:id
    console.log(`✅ Intervention ${interventionId} updated to ${status}:`, updates);
  }

  escalateInterventionToCityManager(
    interventionId: string,
    reason: string,
    attachments: string[],
    recommendation: "APPROVE" | "REJECT" | "REVIEW"
  ): void {
    // In production: POST /api/cm/interventions/:id/escalate
    console.log(`⬆️ Intervention ${interventionId} escalated to City Manager:`, {
      reason,
      attachments,
      recommendation,
    });
  }

  resolveCustomerEscalation(
    escalationId: string,
    resolution: string,
    compensationOffered?: string
  ): void {
    // In production: POST /api/cm/customer-escalations/:id/resolve
    console.log(`✅ Customer escalation ${escalationId} resolved:`, {
      resolution,
      compensationOffered,
    });
  }

  // ============================================
  // 8️⃣ INCENTIVE TRACKER (NEW - CRITICAL)
  // ============================================

  getCMIncentiveTracker(): CMIncentiveTracker {
    // In production: GET /api/cm/incentive-tracker
    const clusterKPIs = this.getClusterKPIs();
    const omCards = this.getOMPerformanceCards();

    // Calculate KPI statuses
    const calculateKPIStatus = (percentage: number): CMIncentiveKPI["status"] => {
      if (percentage >= INCENTIVE_PAYOUT_THRESHOLDS.FULL_PAYOUT) return "FULL_PAYOUT";
      if (percentage >= INCENTIVE_PAYOUT_THRESHOLDS.PARTIAL_PAYOUT) return "PARTIAL_PAYOUT";
      return "ZERO_PAYOUT";
    };

    const calculatePayoutMultiplier = (status: CMIncentiveKPI["status"]): number => {
      if (status === "FULL_PAYOUT") return 1.0;
      if (status === "PARTIAL_PAYOUT") return 0.5;
      return 0.0;
    };

    const revenuePercentage = clusterKPIs.revenue.percentage;
    const conversionPercentage = (clusterKPIs.conversion.rate / clusterKPIs.conversion.target) * 100;
    const retentionPercentage = clusterKPIs.retention.percentage;
    const omPerformance = (omCards.filter(om => om.kpis.revenue.percentage >= 90).length / omCards.length) * 100;
    const compliancePercentage = (clusterKPIs.compliance.score / clusterKPIs.compliance.target) * 100;
    const cxPercentage = 92; // Mock CX score

    const revenueKPI: CMIncentiveKPI = {
      name: "Revenue",
      weightage: INCENTIVE_KPI_WEIGHTAGE.REVENUE,
      current: revenuePercentage,
      target: 100,
      status: calculateKPIStatus(revenuePercentage),
      payoutMultiplier: calculatePayoutMultiplier(calculateKPIStatus(revenuePercentage)),
    };

    const conversionKPI: CMIncentiveKPI = {
      name: "Conversion",
      weightage: INCENTIVE_KPI_WEIGHTAGE.CONVERSION,
      current: conversionPercentage,
      target: 100,
      status: calculateKPIStatus(conversionPercentage),
      payoutMultiplier: calculatePayoutMultiplier(calculateKPIStatus(conversionPercentage)),
    };

    const retentionKPI: CMIncentiveKPI = {
      name: "Retention",
      weightage: INCENTIVE_KPI_WEIGHTAGE.RETENTION,
      current: retentionPercentage,
      target: 100,
      status: calculateKPIStatus(retentionPercentage),
      payoutMultiplier: calculatePayoutMultiplier(calculateKPIStatus(retentionPercentage)),
    };

    const omPerformanceKPI: CMIncentiveKPI = {
      name: "OM Performance",
      weightage: INCENTIVE_KPI_WEIGHTAGE.OM_PERFORMANCE,
      current: omPerformance,
      target: 100,
      status: calculateKPIStatus(omPerformance),
      payoutMultiplier: calculatePayoutMultiplier(calculateKPIStatus(omPerformance)),
    };

    const complianceKPI: CMIncentiveKPI = {
      name: "Compliance",
      weightage: INCENTIVE_KPI_WEIGHTAGE.COMPLIANCE,
      current: compliancePercentage,
      target: 100,
      status: calculateKPIStatus(compliancePercentage),
      payoutMultiplier: calculatePayoutMultiplier(calculateKPIStatus(compliancePercentage)),
    };

    const cxKPI: CMIncentiveKPI = {
      name: "Customer Experience",
      weightage: INCENTIVE_KPI_WEIGHTAGE.CUSTOMER_EXPERIENCE,
      current: cxPercentage,
      target: 100,
      status: calculateKPIStatus(cxPercentage),
      payoutMultiplier: calculatePayoutMultiplier(calculateKPIStatus(cxPercentage)),
    };

    // Calculate earnings
    const kpiBonus =
      (revenueKPI.weightage * revenueKPI.payoutMultiplier +
        conversionKPI.weightage * conversionKPI.payoutMultiplier +
        retentionKPI.weightage * retentionKPI.payoutMultiplier +
        omPerformanceKPI.weightage * omPerformanceKPI.payoutMultiplier +
        complianceKPI.weightage * complianceKPI.payoutMultiplier +
        cxKPI.weightage * cxKPI.payoutMultiplier) / 100 * BASE_CM_INCENTIVE;

    // Team multiplier conditions
    const allOMsAboveTarget = omCards.every(om => om.kpis.revenue.percentage >= TEAM_MULTIPLIER_CONDITIONS.ALL_OMS_TARGET);
    const retentionAboveTarget = clusterKPIs.retention.rate >= TEAM_MULTIPLIER_CONDITIONS.RETENTION_TARGET;
    const teamMultiplierEligible = allOMsAboveTarget && retentionAboveTarget;
    const teamMultiplierValue = teamMultiplierEligible ? TEAM_MULTIPLIER_CONDITIONS.MULTIPLIER_VALUE : 1.0;

    const teamMultiplierBonus = teamMultiplierEligible ? (BASE_CM_INCENTIVE + kpiBonus) * 0.2 : 0;

    return {
      month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      kpis: {
        revenue: revenueKPI,
        conversion: conversionKPI,
        retention: retentionKPI,
        omPerformance: omPerformanceKPI,
        compliance: complianceKPI,
        customerExperience: cxKPI,
      },
      currentEarnings: {
        baseIncentive: BASE_CM_INCENTIVE,
        kpiBonus: Math.round(kpiBonus),
        teamMultiplier: Math.round(teamMultiplierBonus),
        totalProjected: Math.round(BASE_CM_INCENTIVE + kpiBonus + teamMultiplierBonus),
      },
      teamMultiplierStatus: {
        eligible: teamMultiplierEligible,
        condition1: {
          met: allOMsAboveTarget,
          label: "All OMs ≥90%",
          current: Math.round(omPerformance),
          target: TEAM_MULTIPLIER_CONDITIONS.ALL_OMS_TARGET,
        },
        condition2: {
          met: retentionAboveTarget,
          label: "Cluster Retention ≥80%",
          current: clusterKPIs.retention.rate,
          target: TEAM_MULTIPLIER_CONDITIONS.RETENTION_TARGET,
        },
        multiplierValue: teamMultiplierValue,
      },
      revenueBreakdown: {
        clusterTotal: clusterKPIs.revenue.mtd,
        clusterTarget: clusterKPIs.revenue.target,
        percentage: clusterKPIs.revenue.percentage,
        omRanking: omCards
          .map((om, index) => ({
            rank: index + 1,
            omName: om.name,
            revenue: om.kpis.revenue.mtd,
            percentage: om.kpis.revenue.percentage,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .map((om, index) => ({ ...om, rank: index + 1 })),
      },
      historicalReference: {
        lastMonthPayout: 68500,
        trend: "UP",
        percentageChange: 12.3,
      },
      projectedPayout: {
        optimistic: Math.round(BASE_CM_INCENTIVE * 2.2), // All KPIs green + team multiplier
        realistic: Math.round(BASE_CM_INCENTIVE + kpiBonus + teamMultiplierBonus),
        pessimistic: Math.round(BASE_CM_INCENTIVE * 0.6), // Current trajectory worsens
      },
      auditLog: {
        lastRecalculated: new Date(),
        systemGenerated: true,
      },
    };
  }

  // ============================================
  // 9️⃣ SYSTEM ALERTS (NEW - CRITICAL)
  // ============================================

  getSystemAlerts(): CMAlert[] {
    // In production: GET /api/cm/alerts
    const clusterKPIs = this.getClusterKPIs();
    const omCards = this.getOMPerformanceCards();
    const customerEscalations = this.getCustomerEscalations();
    const interventions = this.getInterventions();

    const alerts: CMAlert[] = [];

    // 1. Multi-OM Underperformance
    const underperformingOMs = omCards.filter(om => om.overallHealth === "RED" || om.kpis.revenue.percentage < 85);
    if (underperformingOMs.length >= 3) {
      const revenueGap = underperformingOMs.reduce((sum, om) => {
        return sum + (om.kpis.revenue.target - om.kpis.revenue.mtd);
      }, 0);
      
      alerts.push({
        id: `ALERT-${Date.now()}-001`,
        type: "MULTI_OM_UNDERPERFORMANCE",
        priority: "CRITICAL",
        title: `Cluster Risk: ${underperformingOMs.length} OMs Underperforming`,
        description: `${underperformingOMs.map(om => om.name).join(", ")} all below 85% revenue target`,
        impact: `₹${(revenueGap / 100000).toFixed(1)}L revenue gap this month`,
        timeElapsed: 125,
        createdAt: new Date(Date.now() - 125 * 60 * 1000),
        escalationLevel: "CM",
        actionRequired: "Immediate intervention required",
        autoEscalateIn: 35,
      });
    }

    // 2. Critical Customer Escalations
    const criticalEscalations = customerEscalations.filter(e => e.severity === "CRITICAL");
    criticalEscalations.forEach(escalation => {
      alerts.push({
        id: `ALERT-${escalation.id}`,
        type: "COMPLAINT_SLA_BREACH",
        priority: "CRITICAL",
        title: "SLA Breach: Critical Complaint",
        description: `${escalation.customerName} complaint unresolved`,
        impact: "High-value customer threatening cancellation",
        timeElapsed: Math.floor((Date.now() - escalation.createdAt.getTime()) / 60000),
        createdAt: escalation.createdAt,
        escalationLevel: "CM",
        actionRequired: "Resolve within 1 hour",
        autoEscalateIn: escalation.slaTimer?.remainingMinutes || 60,
        relatedOM: escalation.omName,
      });
    });

    // 3. Revenue Drop Alert
    if (clusterKPIs.revenue.percentage < 80) {
      alerts.push({
        id: `ALERT-${Date.now()}-002`,
        type: "REVENUE_DROP",
        priority: "CRITICAL",
        title: "Revenue Below 80% (Mid-Month)",
        description: `Cluster MTD revenue at ${clusterKPIs.revenue.percentage.toFixed(1)}% of target`,
        impact: `₹${((clusterKPIs.revenue.target - clusterKPIs.revenue.mtd) / 100000).toFixed(1)}L shortfall projected by month-end`,
        timeElapsed: 45,
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
        escalationLevel: "CM",
        actionRequired: "Activate recovery plan",
      });
    }

    // 4. Retention Critical
    const highRiskCustomers = clusterKPIs.churnRisk.high;
    if (highRiskCustomers >= 10) {
      alerts.push({
        id: `ALERT-${Date.now()}-003`,
        type: "RETENTION_CRITICAL",
        priority: "WARNING",
        title: "Retention Rate Declining",
        description: `${highRiskCustomers} high-value customers at churn risk`,
        impact: "High revenue loss potential",
        timeElapsed: 120,
        createdAt: new Date(Date.now() - 120 * 60 * 1000),
        escalationLevel: "CM",
        actionRequired: "Review retention strategy",
      });
    }

    // 5. Compliance Failure
    if (clusterKPIs.compliance.score < 85) {
      alerts.push({
        id: `ALERT-${Date.now()}-004`,
        type: "COMPLIANCE_FAILURE",
        priority: "WARNING",
        title: "Compliance Score Below 85%",
        description: `GPS/Selfie compliance at ${clusterKPIs.compliance.score}%`,
        impact: `${clusterKPIs.compliance.issues} non-compliant issues detected`,
        timeElapsed: 90,
        createdAt: new Date(Date.now() - 90 * 60 * 1000),
        escalationLevel: "OM",
        actionRequired: "Audit required",
      });
    }

    // 6. Escalation Pending (from interventions)
    const pendingEscalations = interventions.filter(i => i.status === "ESCALATED_TO_CITY_MANAGER");
    pendingEscalations.forEach(intervention => {
      alerts.push({
        id: `ALERT-ESC-${intervention.id}`,
        type: "ESCALATION_PENDING",
        priority: "HIGH",
        title: "City Manager Escalation Pending",
        description: `${intervention.problemSummary.substring(0, 80)}...`,
        impact: "Awaiting higher-level decision",
        timeElapsed: intervention.daysSinceTrigger * 24 * 60,
        createdAt: intervention.triggeredAt,
        escalationLevel: "CITY_MANAGER",
        actionRequired: "Track escalation status",
      });
    });

    // 7. V10: SLA Breach Spike (Funnel Issue)
    const slaImpact = this.getSLAImpactMetrics();
    if (slaImpact.slaBreachRate > 25 && slaImpact.conversionImpact.gap > 15) {
      alerts.push({
        id: `ALERT-${Date.now()}-005`,
        type: "SLA_BREACH_SPIKE",
        priority: "CRITICAL",
        title: "SLA Breach Impact on Conversion",
        description: `${slaImpact.slaBreachRate.toFixed(1)}% SLA breach rate causing ${slaImpact.conversionImpact.gap.toFixed(1)}% conversion gap`,
        impact: `₹${(slaImpact.revenueImpact.estimatedLoss / 100000).toFixed(1)}L estimated revenue loss from ${slaImpact.revenueImpact.affectedDeals} affected deals`,
        timeElapsed: 180,
        createdAt: new Date(Date.now() - 180 * 60 * 1000),
        escalationLevel: "CM",
        actionRequired: "Review TSM funnel discipline and SLA compliance",
        dataSource: "TSM / Funnel",
      });
    }

    // 8. V11: Renewal Rate Critical
    const renewalHealth = this.getRenewalHealthMetrics();
    if (renewalHealth.renewalRate < 65) {
      alerts.push({
        id: `ALERT-${Date.now()}-006`,
        type: "RENEWAL_RATE_CRITICAL",
        priority: "CRITICAL",
        title: "Renewal Rate Below Critical Threshold",
        description: `Only ${renewalHealth.renewalRate.toFixed(1)}% renewal rate - below 65% threshold`,
        impact: `₹${(renewalHealth.lapsedValue / 100000).toFixed(1)}L revenue lost this month. ${renewalHealth.expiringNext30Days.highRiskCount} high-risk renewals in next 30 days`,
        timeElapsed: 240,
        createdAt: new Date(Date.now() - 240 * 60 * 1000),
        escalationLevel: "CM",
        actionRequired: "Immediate renewal intervention required. Review TSM renewal protocols",
        dataSource: "Renewal / CRM",
      });
    }

    // 9. V11: Renewal Decline Trend
    if (renewalHealth.renewalTrend === "DECLINING" && renewalHealth.renewalRate < 70) {
      const lowPerformingOMs = renewalHealth.byOM.filter(om => om.status === "RED" || om.renewalRate < 60);
      if (lowPerformingOMs.length > 0) {
        alerts.push({
          id: `ALERT-${Date.now()}-007`,
          type: "RENEWAL_DECLINE_TREND",
          priority: "WARNING",
          title: "Renewal Rate Declining Trend",
          description: `Renewal trend declining. ${lowPerformingOMs.length} OM(s) with renewal rate <60%: ${lowPerformingOMs.map(om => om.omName).join(", ")}`,
          impact: "Revenue retention risk. Upgrade rate also affected",
          timeElapsed: 360,
          createdAt: new Date(Date.now() - 360 * 60 * 1000),
          escalationLevel: "CM",
          actionRequired: "Review renewal strategy and customer satisfaction",
          dataSource: "Renewal / Operations",
          relatedOM: lowPerformingOMs[0]?.omName,
        });
      }
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
      const aPriority = priorityOrder[a.priority] ?? 3;
      const bPriority = priorityOrder[b.priority] ?? 3;
      return aPriority - bPriority;
    });
  }

  // ============================================
  // 🆕 V7: TIME-BASED FLOWS & SYSTEM BEHAVIOR
  // ============================================

  getNextDayReadiness(): NextDayReadiness {
    // In production: GET /api/cm/next-day-readiness
    const omCards = this.getOMPerformanceCards();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      date: tomorrow,
      omProjections: omCards.map((om) => ({
        omId: om.id,
        omName: om.name,
        projectedRevenue: om.kpis.revenue.mtd * 1.05, // 5% growth projection
        projectedUnits: om.kpis.units.today * 0.98, // slight decline expected
        capacityStatus: om.overallHealth === "GREEN" ? "GOOD" : om.overallHealth === "AMBER" ? "AT_RISK" : "CRITICAL",
        openEscalations: om.alerts,
      })),
      clusterCapacity: {
        expectedWashers: 368,
        confirmedWashers: 342,
        leaveRequests: 26,
        coverageGaps: ["Surat West", "Vadodara North"],
      },
      churnRiskList: [
        {
          customerId: "CUST-001",
          customerName: "Mr. Ramesh Patel",
          omName: "Suresh Shah",
          risk: "HIGH",
          actionRequired: "Retention call tomorrow AM",
        },
        {
          customerId: "CUST-002",
          customerName: "Tech Solutions Pvt Ltd",
          omName: "Suresh Shah",
          risk: "HIGH",
          actionRequired: "OM field visit scheduled",
        },
      ],
      pendingActions: [
        {
          category: "Critical Escalations",
          count: 4,
          mustClearBy: new Date(Date.now() + 12 * 60 * 60 * 1000), // Tomorrow 11:30 AM
        },
        {
          category: "SLA Breaches",
          count: 2,
          mustClearBy: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
        {
          category: "OM Performance Reviews",
          count: 3,
        },
      ],
    };
  }

  getEODSummary(): EODSummary {
    // In production: GET /api/cm/eod-summary/today
    const clusterKPIs = this.getClusterKPIs();
    const clusterSummary = this.getClusterSummary();
    const interventions = this.getInterventions();
    const escalations = this.getEscalations();

    return {
      date: new Date(),
      cmId: CURRENT_CM_ID,
      cmName: CURRENT_CM_NAME,
      todayPerformance: {
        revenueAchieved: clusterKPIs.revenue.mtd,
        revenueTarget: clusterKPIs.revenue.target,
        unitsCompleted: clusterSummary.totalUnitsToday.total,
        unitsTarget: clusterSummary.totalUnitsToday.target,
      },
      escalationsHandled: escalations.filter((e) => e.status === "RESOLVED").length,
      interventionsTaken: interventions.filter((i) => i.status === "RESOLVED" || i.status === "IN_PROGRESS").length,
      nextDayPlanning: {
        expectedRevenue: clusterKPIs.revenue.target * 1.05,
        expectedUnits: clusterSummary.totalUnitsToday.target,
        coverageConfirmed: true,
        knownIssues: ["Surat West coverage gap", "2 OMs below target"],
      },
      status: "DRAFT",
    };
  }

  submitEODSummary(summary: EODSummary): void {
    // In production: POST /api/cm/eod-summary
    console.log("✅ EOD Summary submitted:", {
      ...summary,
      submittedAt: new Date(),
      status: "SUBMITTED",
    });
  }

  getCurrentDataState(): DataState {
    // In production: GET /api/cm/data-state
    const currentHour = new Date().getHours();

    // Data is locked after midnight until morning
    if (currentHour >= 0 && currentHour < 6) {
      return "LOCKED";
    }

    // Data is estimated during late evening
    if (currentHour >= 20) {
      return "ESTIMATED";
    }

    return "LIVE";
  }

  getPendingActionCount(): number {
    // In production: GET /api/cm/pending-actions/count
    const escalations = this.getEscalations();
    const interventions = this.getInterventions();

    const pendingEscalations = escalations.filter((e) => e.status === "PENDING").length;
    const pendingInterventions = interventions.filter((i) => i.status === "PENDING").length;

    return pendingEscalations + pendingInterventions;
  }

  // ============================================
  // 🆕 V8: SALES QUALITY INTEGRATION
  // ============================================

  getConversionQualityMetrics(): ConversionQualityMetrics {
    // In production: GET /api/cm/conversion-quality
    return {
      totalConversions: 147,
      conversionRate: 42.3,
      dealMix: {
        base: { count: 45, percentage: 30.6 },
        addOn: { count: 38, percentage: 25.9 },
        bundleMID: { count: 42, percentage: 28.6 },
        bundleLOW: { count: 22, percentage: 15.0 },
      },
      averageDealValue: 8450,
      monthOverMonth: {
        conversions: 12.5, // 12.5% increase
        avgValue: -3.2, // 3.2% decrease (red flag)
      },
    };
  }

  getEarlyChurnMetrics(): EarlyChurnMetrics {
    // In production: GET /api/cm/early-churn
    return {
      churn7Days: {
        count: 8,
        percentage: 5.4,
        topReasons: ["Wrong plan sold", "Price shock", "Service not as promised"],
      },
      churn30Days: {
        count: 18,
        percentage: 12.2,
        topReasons: ["Quality issues", "Price concerns", "Expectations mismatch"],
      },
      churn90Days: {
        count: 32,
        percentage: 21.8,
        topReasons: ["Service quality", "Better competitor offer", "Financial constraints"],
      },
      byDealType: {
        base: 8.5,
        addOn: 15.2,
        bundleMID: 10.1,
        bundleLOW: 24.7, // High churn on LOW bundles
      },
    };
  }

  getSalesQualityFlags(): SalesQualityFlag[] {
    // In production: GET /api/cm/sales-quality-flags
    return [
      {
        id: "SQF-001",
        type: "HIGH_LOW_BUNDLE_DEPENDENCY",
        severity: "WARNING",
        title: "High LOW Bundle Dependency",
        description: "24.7% of LOW bundle customers churning within 90 days",
        impact: "Revenue stability risk",
        metric: {
          current: 24.7,
          threshold: 15.0,
          unit: "%",
        },
        actionRequired: "Review LOW bundle value proposition with TSE team",
      },
      {
        id: "SQF-002",
        type: "LOW_RETENTION_PATTERN",
        severity: "CRITICAL",
        title: "Poor Early Retention (7-Day)",
        description: "5.4% churn within first 7 days indicates sales quality issues",
        impact: "High customer acquisition cost waste",
        omId: "OM-003",
        omName: "Suresh Shah",
        metric: {
          current: 5.4,
          threshold: 2.0,
          unit: "%",
        },
        actionRequired: "Immediate review of recent conversions and service delivery",
      },
      {
        id: "SQF-003",
        type: "CRM_DISCIPLINE_GAP",
        severity: "WARNING",
        title: "CRM Follow-up Gap Detected",
        description: "18% of churned customers had missed follow-ups in CRM",
        impact: "Retention opportunity loss",
        metric: {
          current: 18,
          threshold: 10,
          unit: "%",
        },
        actionRequired: "Strengthen CRM discipline and follow-up protocols",
      },
    ];
  }

  getConversionFunnel(): ConversionFunnel {
    // In production: GET /api/cm/conversion-funnel
    return {
      leads: 348,
      demos: 232,
      conversions: 147,
      active: 132,
      retained: 118,
      renewed: 95,
      dropOffPoints: [
        {
          stage: "Lead → Demo",
          dropCount: 116,
          dropPercentage: 33.3,
          topReasons: ["Not interested", "Price concerns", "Timing issues"],
        },
        {
          stage: "Demo → Conversion",
          dropCount: 85,
          dropPercentage: 36.6,
          topReasons: ["Price objection", "Competitor chosen", "Need more features"],
        },
        {
          stage: "Conversion → Active",
          dropCount: 15,
          dropPercentage: 10.2,
          topReasons: ["Wrong plan", "Service quality", "Price shock"],
        },
        {
          stage: "Active → Retained (30d)",
          dropCount: 14,
          dropPercentage: 10.6,
          topReasons: ["Quality issues", "Price concerns", "Expectations mismatch"],
        },
      ],
    };
  }

  getRenewalMetrics(): RenewalMetrics {
    // In production: GET /api/cm/renewal-metrics
    return {
      totalDueForRenewal: 142,
      renewed: 95,
      renewalRate: 66.9,
      lostReasons: [
        { reason: "Price increase", count: 18, percentage: 38.3 },
        { reason: "Service quality", count: 12, percentage: 25.5 },
        { reason: "Competitor offer", count: 10, percentage: 21.3 },
        { reason: "Financial constraints", count: 7, percentage: 14.9 },
      ],
      avgRenewalValue: 9120,
      upgradedCount: 28, // V11: 28 customers upgraded
      upgradeRate: 29.5, // V11: 29.5% upgrade rate
      basicRenewalCount: 67, // V11: 67 renewed same plan
      lapsedCount: 47, // V11: 47 did not renew
    };
  }

  // ============================================
  // 🆕 V12: DAILY FLOW INTEGRATION
  // ============================================

  getStartOfDaySummary(): StartOfDaySummary {
    // In production: GET /api/cm/start-of-day
    const clusterKPIs = this.getClusterKPIs();
    const alerts = this.getSystemAlerts();
    const renewalHealth = this.getRenewalHealthMetrics();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return {
      date: today,
      yesterday: {
        revenue: 9856000,
        revenueTarget: 10200000,
        percentage: 96.6,
        unitsCompleted: 8272,
        conversions: 35,
        renewals: 12,
        lapses: 8,
      },
      today: {
        revenueTarget: 10200000,
        expectedConversions: 38,
        renewalsDue: 15,
        highRiskRenewals: 5,
        criticalAlertsCarriedForward: alerts.filter(a => a.priority === "CRITICAL").length,
      },
      conversionToRetentionDropOff: {
        conversions: 35,
        activeAfter7Days: 32,
        dropOffCount: 3,
        dropOffPercentage: 8.6,
      },
      topPriorities: [
        {
          category: "SLA Breach Recovery",
          count: alerts.filter(a => a.type === "SLA_BREACH_SPIKE").length,
          urgency: "CRITICAL",
        },
        {
          category: "Renewal Risk Mitigation",
          count: renewalHealth.expiringNext30Days.highRiskCount,
          urgency: "HIGH",
        },
        {
          category: "OM Performance Issues",
          count: alerts.filter(a => a.type === "MULTI_OM_UNDERPERFORMANCE").length,
          urgency: "HIGH",
        },
        {
          category: "Customer Escalations",
          count: this.getCustomerEscalations().filter(e => e.severity === "CRITICAL").length,
          urgency: "CRITICAL",
        },
      ].filter(p => p.count > 0),
    };
  }

  getAtRiskTodayPanel(): AtRiskTodayPanel {
    // In production: GET /api/cm/at-risk-today
    const omCards = this.getOMPerformanceCards();
    const slaImpact = this.getSLAImpactMetrics();
    const tsmMetrics = this.getTSMFunnelMetrics();
    const revenue = this.getClusterRevenue();

    return {
      lowConversionClusters: omCards
        .filter(om => om.kpis.conversion.rate < om.kpis.conversion.target)
        .map(om => ({
          omId: om.id,
          omName: om.name,
          conversionRate: om.kpis.conversion.rate,
          target: om.kpis.conversion.target,
          gapPercentage: ((om.kpis.conversion.target - om.kpis.conversion.rate) / om.kpis.conversion.target) * 100,
        }))
        .sort((a, b) => b.gapPercentage - a.gapPercentage)
        .slice(0, 3),
      followUpGaps: slaImpact.byOM
        .filter(om => om.breachCount > 15)
        .map(om => ({
          omId: om.omId,
          omName: om.omName,
          missedFollowUps: om.breachCount,
          crmComplianceScore: Math.max(0, 100 - (om.breachCount * 2)), // Estimated
        }))
        .slice(0, 3),
      revenuePacing: {
        current: revenue.cluster.mtd,
        target: revenue.cluster.target,
        percentage: revenue.cluster.percentage,
        projectedShortfall: revenue.cluster.target - revenue.cluster.mtd,
        status: revenue.cluster.percentage >= 95 ? "ON_TRACK" :
                revenue.cluster.percentage >= 85 ? "AT_RISK" : "CRITICAL",
      },
      pipelineRisks: {
        stalledDeals: revenue.stalledPipeline.length,
        slaBreaches: tsmMetrics.slaBreaches.total,
        highValueAtRisk: revenue.stalledPipeline.reduce((sum, deal) => sum + deal.value, 0),
      },
    };
  }

  getLivePerformanceIndicator(): LivePerformanceIndicator {
    // In production: GET /api/cm/live-performance
    const clusterKPIs = this.getClusterKPIs();
    const tsmMetrics = this.getTSMFunnelMetrics();
    const earlyChurn = this.getEarlyChurnMetrics();

    // Simulate intra-day data
    const currentHour = new Date().getHours();
    const dayProgress = currentHour >= 9 && currentHour <= 18 ? (currentHour - 9) / 9 : 0;

    return {
      intraDayConversionTrend: clusterKPIs.conversion.trend === "UP" ? "IMPROVING" :
                                clusterKPIs.conversion.trend === "DOWN" ? "DECLINING" : "STABLE",
      conversionsSoFar: Math.floor(tsmMetrics.conversions * dayProgress),
      conversionTarget: Math.floor(tsmMetrics.totalLeads * 0.42), // Target 42% conversion
      revenueSoFar: Math.floor(clusterKPIs.revenue.mtd * dayProgress),
      revenueTarget: clusterKPIs.revenue.target,
      slaBreachesToday: Math.floor(tsmMetrics.slaBreaches.total * 0.3), // Estimate today's portion
      earlyChurnSignals: earlyChurn.churn7Days.count,
      lastUpdated: new Date(),
    };
  }

  // ============================================
  // 🆕 V11: RENEWAL LIFECYCLE TRACKING
  // ============================================

  getRenewalFunnelData(): RenewalFunnelStage[] {
    // In production: GET /api/cm/renewal-funnel
    return [
      {
        stage: "ACTIVE",
        count: 1247, // Total active customers
        value: 11450000, // ₹1.145 Cr monthly recurring
      },
      {
        stage: "EXPIRING",
        count: 142, // Due for renewal this month
        dropOff: 0,
        dropOffPercentage: 0,
        value: 1295000, // ₹12.95L at risk
      },
      {
        stage: "RENEWED",
        count: 95, // Successfully renewed
        dropOff: 47,
        dropOffPercentage: 33.1,
        topReasons: ["Price concerns", "Service quality", "Competitor offer"],
        value: 866000, // ₹8.66L retained
      },
      {
        stage: "UPGRADED",
        count: 28, // Upgraded at renewal
        dropOff: 0,
        dropOffPercentage: 0,
        value: 312000, // ₹3.12L additional revenue
      },
      {
        stage: "LAPSED",
        count: 47, // Did not renew
        dropOff: 47,
        dropOffPercentage: 33.1,
        topReasons: ["Price increase", "Service quality", "Competitor offer", "Financial constraints"],
        value: 429000, // ₹4.29L revenue lost
      },
    ];
  }

  getRenewalHealthMetrics(): RenewalHealthMetrics {
    // In production: GET /api/cm/renewal-health
    const omCards = this.getOMPerformanceCards();
    const renewalMetrics = this.getRenewalMetrics();

    return {
      renewalRate: renewalMetrics.renewalRate,
      upgradeRate: renewalMetrics.upgradeRate,
      retentionValue: 866000, // ₹8.66L retained
      lapsedValue: 429000, // ₹4.29L lost
      expiringNext30Days: {
        count: 87, // 87 renewals due next 30 days
        value: 795000, // ₹7.95L at risk
        highRiskCount: 23, // 23 high-risk for lapse
      },
      renewalTrend: "DECLINING", // Warning signal
      byOM: [
        {
          omId: "OM-001",
          omName: "Rajesh Kumar",
          renewalRate: 78.5,
          upgradeRate: 35.2,
          status: "GREEN",
        },
        {
          omId: "OM-002",
          omName: "Amit Patel",
          renewalRate: 72.1,
          upgradeRate: 28.5,
          status: "AMBER",
        },
        {
          omId: "OM-003",
          omName: "Suresh Shah",
          renewalRate: 52.3, // Critical
          upgradeRate: 15.8,
          status: "RED",
        },
        {
          omId: "OM-004",
          omName: "Prakash Joshi",
          renewalRate: 68.9,
          upgradeRate: 25.1,
          status: "AMBER",
        },
        {
          omId: "OM-005",
          omName: "Dinesh Mehta",
          renewalRate: 74.2,
          upgradeRate: 31.5,
          status: "GREEN",
        },
        {
          omId: "OM-006",
          omName: "Vikas Sharma",
          renewalRate: 65.4,
          upgradeRate: 22.8,
          status: "AMBER",
        },
      ],
      lapsedReasonBreakdown: renewalMetrics.lostReasons.map(reason => ({
        reason: reason.reason,
        count: reason.count,
        percentage: reason.percentage,
        revenueImpact: Math.floor((reason.count / renewalMetrics.lapsedCount) * 429000),
      })),
    };
  }

  getInsightSuggestions(): InsightSuggestion[] {
    // In production: GET /api/cm/insights
    const conversionMetrics = this.getConversionQualityMetrics();
    const churnMetrics = this.getEarlyChurnMetrics();
    const renewalMetrics = this.getRenewalMetrics();
    const slaImpact = this.getSLAImpactMetrics(); // V10
    const clusterKPIs = this.getClusterKPIs(); // V11 - For retention rate insights

    const insights: InsightSuggestion[] = [];

    // Insight 1: High conversion but low retention
    if (conversionMetrics.conversionRate > 40 && churnMetrics.churn30Days.percentage > 10) {
      insights.push({
        id: "INS-001",
        type: "CONVERSION",
        severity: "ACTION_REQUIRED",
        title: "High Conversion but Low Early Retention",
        insight: `Conversion rate is strong at ${conversionMetrics.conversionRate.toFixed(1)}%, but ${churnMetrics.churn30Days.percentage.toFixed(1)}% churn within 30 days indicates sales quality issues.`,
        recommendation: "Review recent conversions for wrong plan selling or over-promising. Focus on matching customer needs to appropriate packages.",
        dataSource: "Sales + Operations",
      });
    }

    // Insight 2: LOW bundle churn pattern
    if (churnMetrics.byDealType.bundleLOW > 20) {
      insights.push({
        id: "INS-002",
        type: "RETENTION",
        severity: "ACTION_REQUIRED",
        title: "HIGH LOW Bundle Churn Risk",
        insight: `LOW bundle customers churning at ${churnMetrics.byDealType.bundleLOW.toFixed(1)}% - significantly above threshold.`,
        recommendation: "Either improve LOW bundle value proposition or reduce dependency on this tier. Consider upsell strategies.",
        dataSource: "CRM + Sales",
      });
    }

    // Insight 3: Renewal rate concerns
    if (renewalMetrics.renewalRate < 70) {
      insights.push({
        id: "INS-003",
        type: "REVENUE",
        severity: "ATTENTION",
        title: "Renewal Rate Below Target",
        insight: `Only ${renewalMetrics.renewalRate.toFixed(1)}% renewal rate. Top loss reason: ${renewalMetrics.lostReasons[0].reason} (${renewalMetrics.lostReasons[0].percentage.toFixed(1)}%).`,
        recommendation: "Address price sensitivity through early value communication and consider retention discounts for at-risk renewals.",
        dataSource: "CRM",
      });
    }

    // Insight 4: CRM discipline impact
    const crmFlag = this.getSalesQualityFlags().find(f => f.type === "CRM_DISCIPLINE_GAP");
    if (crmFlag && crmFlag.metric.current > 15) {
      insights.push({
        id: "INS-004",
        type: "CRM",
        severity: "ATTENTION",
        title: "CRM Follow-up Gap Impacting Retention",
        insight: `${crmFlag.metric.current}% of churned customers had missed CRM follow-ups, suggesting discipline issues.`,
        recommendation: "Strengthen TSE accountability on follow-up completion. Consider automated reminders and manager oversight.",
        dataSource: "CRM",
      });
    }

    // V10 Insight 5: SLA breach impact on conversion
    if (slaImpact.slaBreachRate > 25 && slaImpact.conversionImpact.gap > 15) {
      insights.push({
        id: "INS-005",
        type: "CONVERSION",
        severity: "ACTION_REQUIRED",
        title: "SLA Breaches Destroying Conversion Rate",
        insight: `${slaImpact.slaBreachRate.toFixed(1)}% SLA breach rate causing ${slaImpact.conversionImpact.gap.toFixed(1)}% conversion gap. Leads contacted within 24h convert at ${slaImpact.conversionImpact.withSLA.toFixed(1)}% vs ${slaImpact.conversionImpact.withoutSLA.toFixed(1)}% when breached.`,
        recommendation: `Immediate action required: Implement mandatory 24h first-call tracking with TSM. Focus on ${slaImpact.byOM.filter(om => om.impact === "HIGH").map(om => om.omName).join(", ")} who have highest breach counts.`,
        dataSource: "TSM / Funnel",
        relatedOM: slaImpact.byOM.find(om => om.impact === "HIGH")?.omName,
      });
    }

    // V10 Insight 6: Funnel drop-off pattern
    const funnelData = this.getFunnelVisualizationData();
    const attemptStage = funnelData.find(s => s.stage === "ATTEMPTS");
    if (attemptStage && attemptStage.slaBreachImpact && attemptStage.slaBreachImpact > 30) {
      insights.push({
        id: "INS-006",
        type: "CONVERSION",
        severity: "ACTION_REQUIRED",
        title: "Critical Lead Drop-off at First Call Stage",
        insight: `${attemptStage.slaBreachImpact} leads lost at first-call stage due to SLA breaches. This represents ₹${(slaImpact.revenueImpact.estimatedLoss / 100000).toFixed(1)}L in estimated revenue loss.`,
        recommendation: "Review TSM first-call discipline. Implement real-time alerts for leads >24h without contact. Consider TSE performance review.",
        dataSource: "TSM / Funnel",
      });
    }

    // V11 Insight 7: Low renewal rate
    const renewalHealth = this.getRenewalHealthMetrics();
    if (renewalHealth.renewalRate < 65) {
      insights.push({
        id: "INS-007",
        type: "REVENUE",
        severity: "ACTION_REQUIRED",
        title: "Critical Renewal Rate - Revenue Retention Risk",
        insight: `Renewal rate at ${renewalHealth.renewalRate.toFixed(1)}% (target: 70%+). Losing ₹${(renewalHealth.lapsedValue / 100000).toFixed(1)}L monthly. Top lapse reason: ${renewalHealth.lapsedReasonBreakdown[0].reason} (${renewalHealth.lapsedReasonBreakdown[0].percentage.toFixed(1)}%).`,
        recommendation: "Immediate action: Review renewal outreach timing and TSM renewal protocols. Consider retention incentives for at-risk accounts. Focus on price sensitivity if primary issue.",
        dataSource: "Renewal / CRM",
      });
    }

    // V11 Insight 8: Good retention but poor renewals
    const retentionRate = clusterKPIs.retention.rate;
    if (retentionRate > 85 && renewalHealth.renewalRate < 70) {
      insights.push({
        id: "INS-008",
        type: "RETENTION",
        severity: "ATTENTION",
        title: "Retention Strong but Renewals Weak - Disconnect",
        insight: `Retention rate is healthy at ${retentionRate.toFixed(1)}%, but renewal rate only ${renewalHealth.renewalRate.toFixed(1)}%. This suggests customers stay until renewal, then leave.`,
        recommendation: "Gap indicates renewal communication or pricing issue, not service quality. Review TSM renewal approach: timing of outreach, price increase communication, upgrade offers. Consider proactive value communication 60 days before renewal.",
        dataSource: "Retention + Renewal",
      });
    }

    // V11 Insight 9: Low upgrade rate opportunity
    if (renewalHealth.upgradeRate < 25 && renewalHealth.renewalRate > 60) {
      insights.push({
        id: "INS-009",
        type: "REVENUE",
        severity: "INFORMATIONAL",
        title: "Upgrade Opportunity at Renewal",
        insight: `Only ${renewalHealth.upgradeRate.toFixed(1)}% upgrade rate at renewal. Customers are renewing but not upgrading - missed revenue opportunity.`,
        recommendation: "TSM should strengthen upgrade proposals at renewal touchpoints. Review bundle value proposition and pricing incentives for upgrades.",
        dataSource: "Renewal",
      });
    }

    return insights;
  }

  // ============================================
  // 🆕 V10: TSM INTEGRATION (FUNNEL GOVERNANCE)
  // ============================================

  getTSMFunnelMetrics(): TSMFunnelMetrics {
    // In production: GET /api/cm/tsm/funnel-metrics
    return {
      totalLeads: 348,
      firstCallAttempts: 312,
      firstCallConnects: 265,
      demos: 232,
      conversions: 147,
      conversionRate: 42.3,
      slaBreaches: {
        firstCall24h: 36, // 36 leads not called within 24h
        demoSchedule: 18, // 18 demos not scheduled within SLA
        followUp: 47, // 47 missed follow-ups
        total: 101,
      },
      crmCompliance: {
        score: 82.5, // CRM discipline at 82.5%
        issues: {
          missedFollowUps: 47,
          incompleteData: 23,
          lateUpdates: 31,
        },
      },
      bundleMix: {
        mid: { count: 42, percentage: 28.6 },
        low: { count: 22, percentage: 15.0 },
      },
      renewalRate: 66.9,
    };
  }

  getSLAImpactMetrics(): SLAImpactMetrics {
    // In production: GET /api/cm/tsm/sla-impact
    const omCards = this.getOMPerformanceCards();

    return {
      slaBreachRate: 29.0, // 29% of leads have SLA breach
      conversionImpact: {
        withSLA: 48.5, // 48.5% conversion when SLA met
        withoutSLA: 28.2, // 28.2% conversion when SLA breached
        gap: 20.3, // 20.3% gap - CRITICAL
      },
      revenueImpact: {
        estimatedLoss: 1250000, // ₹12.5L estimated revenue loss
        affectedDeals: 36,
      },
      breachTrend: "WORSENING",
      byOM: [
        {
          omId: "OM-003",
          omName: "Suresh Shah",
          breachCount: 28,
          conversionRate: 24.1,
          impact: "HIGH",
        },
        {
          omId: "OM-004",
          omName: "Prakash Joshi",
          breachCount: 18,
          conversionRate: 38.5,
          impact: "MEDIUM",
        },
        {
          omId: "OM-006",
          omName: "Vikas Sharma",
          breachCount: 15,
          conversionRate: 35.2,
          impact: "MEDIUM",
        },
        {
          omId: "OM-002",
          omName: "Amit Patel",
          breachCount: 12,
          conversionRate: 42.8,
          impact: "LOW",
        },
        {
          omId: "OM-001",
          omName: "Rajesh Kumar",
          breachCount: 8,
          conversionRate: 48.2,
          impact: "LOW",
        },
        {
          omId: "OM-005",
          omName: "Dinesh Mehta",
          breachCount: 9,
          conversionRate: 46.5,
          impact: "LOW",
        },
      ],
    };
  }

  getFunnelVisualizationData(): FunnelStageMetrics[] {
    // In production: GET /api/cm/tsm/funnel-visualization
    const tsmMetrics = this.getTSMFunnelMetrics();

    return [
      {
        stage: "LEADS",
        count: tsmMetrics.totalLeads,
        dropOff: 0,
        dropOffPercentage: 0,
        topReasons: [],
      },
      {
        stage: "ATTEMPTS",
        count: tsmMetrics.firstCallAttempts,
        dropOff: 36,
        dropOffPercentage: 10.3,
        slaBreachImpact: 36, // All 36 were SLA breaches
        topReasons: ["SLA breach (24h)", "Lead unqualified", "Contact failed"],
      },
      {
        stage: "CONVERSIONS",
        count: tsmMetrics.conversions,
        dropOff: 165,
        dropOffPercentage: 52.9,
        slaBreachImpact: 47, // 47 lost due to SLA issues
        topReasons: ["Price objection", "SLA breach impact", "Competitor chosen"],
      },
      {
        stage: "ACTIVE",
        count: 132,
        dropOff: 15,
        dropOffPercentage: 10.2,
        topReasons: ["Wrong plan", "Service quality", "Price shock"],
      },
      {
        stage: "RETAINED",
        count: 118,
        dropOff: 14,
        dropOffPercentage: 10.6,
        topReasons: ["Quality issues", "Price concerns", "Expectations mismatch"],
      },
      {
        stage: "RENEWED",
        count: 95,
        dropOff: 23,
        dropOffPercentage: 19.5,
        topReasons: ["Price increase", "Service quality", "Competitor offer"],
      },
    ];
  }
}

// Singleton instance
export const clusterManagerService = new ClusterManagerService();