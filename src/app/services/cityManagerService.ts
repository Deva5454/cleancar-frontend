/**
 * City Manager Data Service
 * P&L Control System - Strategic Decision Layer
 *
 * ✅ UPDATED: Now uses City → Cluster → Pincode hierarchy
 * ✅ INTEGRATED: organizationHierarchyService for geographic data
 * ✅ INTEGRATED: hierarchyFinancialService for P&L data
 *
 * Philosophy:
 * - City Manager = CEO of city business
 * - Works through Cluster Managers (NOT OMs/Supervisors/Washers)
 * - Revenue + EBITDA + Retention + Expansion ownership
 * - All data flows through centralized hierarchy services
 */

import type {
  CityKPIs,
  ClusterCard,
  ClusterPerformanceDetail,
  ClusterIntervention,
  RevenueEBITDADashboard,
  RetentionCustomerHealth,
  ExpansionPlanning,
  CityAlert,
  CityManagerIncentive,
  CityReport,
  CityAuditLog,
} from "../types/cityManager.types";

import {
  CITY_KPI_TARGETS,
  CLUSTER_HEALTH_THRESHOLDS,
  INTERVENTION_TRIGGERS,
  CITY_INCENTIVE_CONFIG,
  FINANCIAL_BENCHMARKS,
  RETENTION_BENCHMARKS,
  EXPANSION_CONFIG,
  CURRENT_CITY_MANAGER,
} from "../constants/cityManager.constants";

import { organizationHierarchyService } from "./organizationHierarchyService";
import { hierarchyFinancialService } from "./hierarchyFinancialService";
import { pincodeAwareLeadService } from "./pincodeAwareLeadService";

// Mock cluster manager names
const CLUSTER_MANAGER_NAMES: Record<string, string> = {
  'CLM-001': 'Amit Kumar',
  'CLM-002': 'Priya Sharma',
};

class CityManagerService {
  // ============================================
  // 1️⃣ CITY KPI DASHBOARD
  // ============================================

  getCityKPIs(cityId: string = 'CITY-SURAT'): CityKPIs {
    // In production: GET /api/city-manager/kpis

    // Calculate attendance across the city hierarchy
    const clusters = organizationHierarchyService.getClustersByCity(cityId);
    const allTeams = organizationHierarchyService.getAllTeams();

    // Cluster Managers attendance
    const expectedClusterManagers = clusters.length;
    const currentHour = new Date().getHours();
    let cmAttendanceRate = 0.97; // CMs typically have very high attendance
    if (currentHour >= 9 && currentHour < 18) {
      cmAttendanceRate = 0.98; // Peak hours
    } else if (currentHour < 9 || currentHour >= 20) {
      cmAttendanceRate = 0.85; // Off hours
    }
    const presentClusterManagers = Math.floor(expectedClusterManagers * cmAttendanceRate);

    // Operations Managers attendance (unique pincodes, each pincode has one OM)
    const allPincodes = organizationHierarchyService.getAllPincodes();
    const activePincodes = allPincodes.filter(p => p.isActive);
    const expectedOperationsManagers = activePincodes.length;
    let omAttendanceRate = 0.96; // OMs have high attendance
    if (currentHour >= 9 && currentHour < 18) {
      omAttendanceRate = 0.97; // Peak hours
    } else if (currentHour < 9 || currentHour >= 20) {
      omAttendanceRate = 0.85; // Off hours
    }
    const presentOperationsManagers = Math.floor(expectedOperationsManagers * omAttendanceRate);

    // Supervisors attendance (unique supervisors from all teams)
    const uniqueSupervisorIds = new Set(allTeams.map(team => team.supervisorId));
    const expectedSupervisors = uniqueSupervisorIds.size;
    let supervisorAttendanceRate = 0.95;
    if (currentHour >= 6 && currentHour < 10) {
      supervisorAttendanceRate = 0.92;
    } else if (currentHour >= 10 && currentHour < 17) {
      supervisorAttendanceRate = 0.97;
    } else if (currentHour >= 17 && currentHour < 20) {
      supervisorAttendanceRate = 0.93;
    } else {
      supervisorAttendanceRate = 0.80;
    }
    const presentSupervisors = Math.floor(expectedSupervisors * supervisorAttendanceRate);

    // Washers attendance
    const expectedWashers = allTeams.reduce((sum, team) => sum + team.washerIds.length, 0);
    let washerAttendanceRate = 0.90;
    if (currentHour >= 6 && currentHour < 10) {
      washerAttendanceRate = 0.88;
    } else if (currentHour >= 10 && currentHour < 17) {
      washerAttendanceRate = 0.92;
    } else if (currentHour >= 17 && currentHour < 20) {
      washerAttendanceRate = 0.85;
    } else {
      washerAttendanceRate = 0.70;
    }
    const presentWashers = Math.floor(expectedWashers * washerAttendanceRate);

    return {
      revenue: {
        mtd: 8520000,
        target: 10000000,
        percentage: 85.2,
        trend: "UP",
        growth: 12.5,
      },
      ebitda: {
        percentage: 28.5,
        target: CITY_KPI_TARGETS.EBITDA_TARGET,
        trend: "STABLE",
        amount: 2428200,
      },
      retention: {
        percentage: 82.3,
        target: CITY_KPI_TARGETS.RETENTION_90DAY,
        trend: "UP",
        churnRate: 8.5,
      },
      units: {
        today: 485,
        todayTarget: 500,
        mtd: 12400,
        mtdTarget: 15000,
      },
      activeCustomers: {
        total: 2850,
        growth: 5.2,
        highValue: 320,
      },
      attendance: {
        clusterManagers: {
          present: presentClusterManagers,
          expected: expectedClusterManagers,
          percentage: expectedClusterManagers > 0 ? Math.round((presentClusterManagers / expectedClusterManagers) * 100 * 10) / 10 : 100,
        },
        operationsManagers: {
          present: presentOperationsManagers,
          expected: expectedOperationsManagers,
          percentage: expectedOperationsManagers > 0 ? Math.round((presentOperationsManagers / expectedOperationsManagers) * 100 * 10) / 10 : 100,
        },
        supervisors: {
          present: presentSupervisors,
          expected: expectedSupervisors,
          percentage: expectedSupervisors > 0 ? Math.round((presentSupervisors / expectedSupervisors) * 100 * 10) / 10 : 100,
        },
        washers: {
          present: presentWashers,
          expected: expectedWashers,
          percentage: expectedWashers > 0 ? Math.round((presentWashers / expectedWashers) * 100 * 10) / 10 : 100,
        },
      },
    };
  }

  // ============================================
  // 2️⃣ CLUSTER CARDS (GRID VIEW)
  // ============================================

  getClusterCards(cityId: string = 'CITY-SURAT'): ClusterCard[] {
    // ✅ UPDATED: Now uses real City → Cluster → Pincode hierarchy
    const clusters = organizationHierarchyService.getClustersByCity(cityId);
    const period = {
      startDate: new Date(2026, 3, 1), // April 2026
      endDate: new Date(2026, 3, 30),
    };

    return clusters.map((cluster, index) => {
      const pincodes = organizationHierarchyService.getPincodesByCluster(cluster.id);
      const pincodeCount = pincodes.length;
      const teams = organizationHierarchyService.getTeamsByCluster(cluster.id);
      const teamCount = teams.length;
      const washerCount = teams.reduce((sum, team) => sum + team.washerIds.length, 0);

      // Get financial data from hierarchy service
      // For assigned clusters, use cluster manager ID
      // For unassigned clusters (City Control), aggregate pincodes directly
      let revenue = 0;
      let expenses = 0;

      if (cluster.clusterManagerId) {
        const financialSummary = hierarchyFinancialService.getClusterFinancialSummary(cluster.clusterManagerId, period);
        revenue = financialSummary.totalIncome;
        expenses = financialSummary.totalExpenses;
      } else {
        // Unassigned cluster - aggregate pincode data
        const pincodeIds = pincodes.map(p => p.id);
        const mockUser = {
          id: 'CM-SURAT-001',
          name: 'City Manager',
          email: 'cm@cleancar360.com',
          phone: '',
          role: 'City Manager' as any,
          cityId: 'CITY-SURAT',
          isActive: true,
          joiningDate: new Date(),
        };

        const incomeRecords = hierarchyFinancialService.getIncomeForUser(mockUser, {
          startDate: period.startDate,
          endDate: period.endDate,
        });
        const expenseRecords = hierarchyFinancialService.getExpensesForUser(mockUser, {
          startDate: period.startDate,
          endDate: period.endDate,
        });

        revenue = incomeRecords
          .filter(inc => pincodeIds.includes(inc.pincodeId))
          .reduce((sum, inc) => sum + inc.amount, 0);

        expenses = expenseRecords
          .filter(exp => exp.pincodeId && pincodeIds.includes(exp.pincodeId))
          .reduce((sum, exp) => sum + exp.amount, 0);
      }

      // FIX: This inline formula should migrate to FinanceContext.calculateEBITDAMargin()
      // for consistency with all other EBITDA calculations across the app.
      // Formula standardized: EBITDA% = ((revenue - expenses) / revenue) * 100
      const ebitda = revenue > 0 ? Math.round(((revenue - expenses) / revenue) * 1000) / 10 : 0;

      // Calculate realistic targets based on pincode count and market potential
      const targetPerPincode = 100000; // ₹1L target per pincode per month
      const target = pincodeCount * targetPerPincode;
      const percentage = target > 0 ? (revenue / target) * 100 : 0;

      // Determine status based on performance
      let status: 'GREEN' | 'AMBER' | 'RED';
      if (percentage >= 90 && ebitda >= 28) {
        status = 'GREEN';
      } else if (percentage >= 75 && ebitda >= 20) {
        status = 'AMBER';
      } else if (percentage >= 50 || ebitda >= 15) {
        status = 'AMBER';
      } else {
        status = 'RED';
      }

      return {
        id: cluster.id,
        clusterName: cluster.name,
        cmName: cluster.clusterManagerId
          ? (CLUSTER_MANAGER_NAMES[cluster.clusterManagerId] || `Manager ${cluster.clusterManagerId}`)
          : 'Unassigned (City Control)',
        cmPhoto: undefined,
        pincodeDetails: pincodes.map(p => ({
          pincodeId: p.id,
          pincode: p.pincode,
          areaName: p.areaName,
        })),
        revenue: {
          mtd: revenue,
          target: target,
          percentage: Math.min(percentage, 100),
        },
        ebitda: {
          percentage: ebitda,
          contribution: revenue - expenses,
        },
        retention: {
          percentage: 82.0 + 0.5 * 8, // Mock retention
          customersAtRisk: Math.floor(0.7 * 15),
        },
        unitProductivity: {
          avgPerOM: 48 + Math.floor(0.5 * 8),
          total: teamCount * 25, // Mock productivity per team
        },
        status,
        omCount: 0, // No more OM layer in new hierarchy
        teamCount, // ✅ UPDATED: Now showing number of teams instead of supervisors
        washerCount, // ✅ UPDATED: Actual count from teams
        activeAlerts: status === 'RED' ? 3 : status === 'AMBER' ? 1 : 0,
      };
    });
  }

  // Keep old mock method for other screens (to be updated later)
  getClusterCards_OLD(): ClusterCard[] {
    return [
      {
        id: "CL-001",
        clusterName: "North Zone (OLD)",
        cmName: "Amit Kumar",
        cmPhoto: undefined,
        revenue: {
          mtd: 1920000,
          target: 2600000,
          percentage: 73.8,
        },
        ebitda: {
          percentage: 22.5,
          contribution: 432000,
        },
        retention: {
          percentage: 68.3,
          customersAtRisk: 18,
        },
        unitProductivity: {
          avgPerOM: 42,
          total: 336,
        },
        status: "RED",
        omCount: 8,
        teamCount: 16, // ✅ UPDATED: Changed from supervisorCount
        washerCount: 48,
        activeAlerts: 5,
      },
      {
        id: "CL-004",
        clusterName: "West Zone",
        cmName: "Neha Patel",
        cmPhoto: undefined,
        revenue: {
          mtd: 1350000,
          target: 1600000,
          percentage: 84.4,
        },
        ebitda: {
          percentage: 26.8,
          contribution: 361800,
        },
        retention: {
          percentage: 81.7,
          customersAtRisk: 6,
        },
        unitProductivity: {
          avgPerOM: 46,
          total: 276,
        },
        status: "AMBER",
        omCount: 6,
        teamCount: 12, // ✅ UPDATED: Changed from supervisorCount
        washerCount: 36,
        activeAlerts: 1,
      },
    ];
  }

  // ============================================
  // 3️⃣ CLUSTER PERFORMANCE DETAIL
  // ============================================

  getClusterPerformanceDetail(clusterId: string): ClusterPerformanceDetail {
    // In production: GET /api/city-manager/clusters/:id/performance
    const cluster = this.getClusterCards().find((c) => c.id === clusterId);
    if (!cluster) throw new Error("Cluster not found");

    return {
      cluster,
      kpiBreakdown: {
        revenue: {
          mtd: cluster.revenue.mtd,
          target: cluster.revenue.target,
          percentage: cluster.revenue.percentage,
          trend7Days: [82, 84, 83, 85, 86, 85, 85.7],
          trend30Days: Array.from({ length: 30 }, (_, i) => 75 + i * 0.5),
        },
        ebitda: {
          percentage: cluster.ebitda.percentage,
          amount: cluster.ebitda.contribution,
          trend7Days: [28, 27, 28.5, 29, 28, 27.5, 28.2],
        },
        retention: {
          percentage: cluster.retention.percentage,
          churnedThisMonth: 12,
          activeCustomers: 720,
        },
        conversion: {
          rate: 18.5,
          target: 20,
        },
        compliance: {
          score: 92,
          issues: 3,
        },
      },
      omDistribution: {
        total: cluster.omCount,
        green: Math.floor(cluster.omCount * 0.6),
        amber: Math.floor(cluster.omCount * 0.3),
        red: Math.floor(cluster.omCount * 0.1),
      },
      interventionHistory: this.getClusterInterventions(clusterId),
    };
  }

  // ============================================
  // 4️⃣ CLUSTER INTERVENTIONS (GOVERNANCE)
  // ============================================

  getClusterInterventions(cityIdOrClusterId?: string): ClusterIntervention[] {
    // In production: GET /api/city-manager/interventions?clusterId=xxx
    const allInterventions: ClusterIntervention[] = [
      {
        id: "INT-001",
        clusterId: "CL-003",
        clusterName: "East Zone",
        cmName: "Vikram Singh",
        issueType: "REVENUE_DROP",
        severity: "CRITICAL",
        status: "IN_PROGRESS",
        triggeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        daysSinceTrigger: 3,
        problemSummary: "Revenue at 73.8% of target, dropped 12% from last week. Multiple OMs underperforming.",
        autoGeneratedAnalysis: {
          rootCause: "3 OMs showing consistent underperformance. High customer churn in premium segment.",
          impactMetrics: {
            revenueImpact: 680000,
            customersAffected: 85,
          },
          trendAnalysis: "Declining trend for past 2 weeks. Projected month-end: 68% if no action taken.",
        },
        cmActionsHistory: [
          {
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            action: "Initiated OM performance review. Identified skill gaps in sales pitch.",
            takenBy: "Vikram Singh",
            outcome: "Training session scheduled for 3 underperforming OMs",
          },
          {
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            action: "Conducted customer retention calls for premium segment.",
            takenBy: "Vikram Singh",
          },
        ],
        cityManagerActions: {
          strategicPlan: "Monitor for 2 more days. If no improvement, escalate to MD for resource reallocation.",
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          followUpScheduled: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        },
        auditLog: {
          createdBy: "SYSTEM",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          lastModifiedBy: CURRENT_CITY_MANAGER.NAME,
          lastModifiedAt: new Date(),
        },
      },
      {
        id: "INT-002",
        clusterId: "CL-002",
        clusterName: "South Zone",
        cmName: "Priya Sharma",
        issueType: "RETENTION_FAILURE",
        severity: "HIGH",
        status: "CM_ACTION_PENDING",
        triggeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        daysSinceTrigger: 5,
        problemSummary: "Retention dropped to 79.5%. 12 high-value customers at churn risk.",
        autoGeneratedAnalysis: {
          rootCause: "Service quality complaints increased 40%. Washer consistency issues reported.",
          impactMetrics: {
            revenueImpact: 420000,
            customersAffected: 12,
          },
          trendAnalysis: "Churn rate increased from 8% to 12% this month.",
        },
        cmActionsHistory: [
          {
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            action: "Raised issue with supervisor team. Field audits increased to daily.",
            takenBy: "Priya Sharma",
          },
        ],
        cityManagerActions: {
          strategicPlan: "Require CM to submit retention action plan by EOD. Consider quality incentive restructuring.",
          deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        },
        auditLog: {
          createdBy: "SYSTEM",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          lastModifiedBy: CURRENT_CITY_MANAGER.NAME,
          lastModifiedAt: new Date(),
        },
      },
    ];

    if (cityIdOrClusterId) {
      // Check if it's a city ID (starts with "CITY-") or cluster ID
      if (cityIdOrClusterId.startsWith('CITY-')) {
        // Filter by city - get all clusters for this city
        const clusters = organizationHierarchyService.getClustersByCity(cityIdOrClusterId);
        const clusterIds = clusters.map(c => c.id);
        return allInterventions.filter((i) => clusterIds.includes(i.clusterId));
      } else {
        // Filter by specific cluster ID
        return allInterventions.filter((i) => i.clusterId === cityIdOrClusterId);
      }
    }
    return allInterventions;
  }

  // ============================================
  // 5️⃣ REVENUE & EBITDA DASHBOARD
  // ============================================

  getRevenueEBITDADashboard(cityId: string = 'CITY-SURAT'): RevenueEBITDADashboard {
    // In production: GET /api/city-manager/financials
    const clusters = this.getClusterCards(cityId);
    const totalRevenue = clusters.reduce((sum, c) => sum + c.revenue.mtd, 0);
    const totalTarget = clusters.reduce((sum, c) => sum + c.revenue.target, 0);

    return {
      revenue: {
        total: totalRevenue,
        target: totalTarget,
        percentage: (totalRevenue / totalTarget) * 100,
        clusterContributions: clusters.map((c) => ({
          clusterName: c.clusterName,
          amount: c.revenue.mtd,
          percentage: (c.revenue.mtd / totalRevenue) * 100,
        })),
        unitEconomics: {
          totalUnits: 12400,
          avgPricePerUnit: 687,
          revenue: totalRevenue,
        },
        trend: [
          { month: "Jan", amount: 7200000 },
          { month: "Feb", amount: 7800000 },
          { month: "Mar", amount: 8520000 },
        ],
      },
      ebitda: {
        percentage: 28.5,
        amount: totalRevenue * 0.285,
        target: CITY_KPI_TARGETS.EBITDA_TARGET,
        costBreakdown: {
          washerCost: totalRevenue * 0.35,
          supervisorCost: totalRevenue * 0.08,
          consumables: totalRevenue * 0.12,
          operationalOverhead: totalRevenue * 0.15,
          marketing: totalRevenue * 0.05,
          other: totalRevenue * 0.05,
        },
        trend: [
          { month: "Jan", percentage: 27.2 },
          { month: "Feb", percentage: 28.0 },
          { month: "Mar", percentage: 28.5 },
        ],
      },
      insights: {
        revenueGrowthTrend: "ACCELERATING",
        costSpikeAlerts: [
          {
            category: "Consumables",
            increase: 18,
            threshold: 15,
          },
        ],
        profitabilityWarnings: [
          "East Zone EBITDA below 25% - intervention required",
        ],
      },
    };
  }

  // ============================================
  // 6️⃣ RETENTION & CUSTOMER HEALTH
  // ============================================

  getRetentionCustomerHealth(cityId: string = 'CITY-SURAT'): RetentionCustomerHealth {
    // In production: GET /api/city-manager/retention
    const clusters = this.getClusterCards(cityId);

    return {
      retention90Day: {
        percentage: 82.3,
        target: RETENTION_BENCHMARKS.CHURN_RATE_ACCEPTABLE,
        trend: "UP",
      },
      churnTrend: [
        { month: "Jan", churnRate: 9.5, customersLost: 85 },
        { month: "Feb", churnRate: 8.8, customersLost: 78 },
        { month: "Mar", churnRate: 8.5, customersLost: 72 },
      ],
      clusterRetentionComparison: clusters.map((c) => ({
        clusterName: c.clusterName,
        retentionRate: c.retention.percentage,
        customersAtRisk: c.retention.customersAtRisk,
      })),
      highRiskSegments: [
        {
          segment: "Premium Plan (₹4999/month)",
          customersCount: 28,
          churnRisk: "HIGH",
          reasons: ["Price sensitivity", "Competition offers"],
        },
        {
          segment: "4-Wheeler Standard",
          customersCount: 15,
          churnRisk: "MEDIUM",
          reasons: ["Service quality", "Scheduling issues"],
        },
      ],
      rootCausePatterns: {
        pricing: 25,
        quality: 45,
        service: 20,
        competition: 10,
      },
      retentionActions: {
        suggested: [
          "Launch loyalty program for premium customers",
          "Increase field audit frequency in East Zone",
          "Competitive pricing review",
        ],
        inProgress: 2,
        completed: 1,
      },
    };
  }

  // ============================================
  // 7️⃣ EXPANSION & TERRITORY PLANNING
  // ============================================

  getExpansionPlanning(cityId: string = 'CITY-SURAT'): ExpansionPlanning {
    // In production: GET /api/city-manager/expansion
    return {
      cityOverview: {
        totalTerritories: 20,
        activeTerritories: 16,
        coveragePercentage: 80,
      },
      territories: [
        {
          id: "T-001",
          name: "Adajan",
          status: "ACTIVE",
          coverage: 95,
          potentialCustomers: 2500,
          estimatedRevenue: 1800000,
        },
        {
          id: "T-002",
          name: "Vesu",
          status: "UNCOVERED",
          coverage: 0,
          potentialCustomers: 1800,
          estimatedRevenue: 1200000,
          requiredInvestment: 650000,
        },
        {
          id: "T-003",
          name: "Citylight",
          status: "PROPOSED",
          coverage: 0,
          potentialCustomers: 2200,
          estimatedRevenue: 1500000,
          requiredInvestment: 800000,
        },
      ],
      proposedExpansionZones: [
        {
          id: "EXP-001",
          name: "Vesu Expansion",
          priority: "HIGH",
          potentialRevenue: 1200000,
          investmentRequired: 650000,
          timelineMonths: 3,
          status: "PROPOSED",
        },
        {
          id: "EXP-002",
          name: "Citylight Launch",
          priority: "MEDIUM",
          potentialRevenue: 1500000,
          investmentRequired: 800000,
          timelineMonths: 4,
          status: "PLANNING",
        },
      ],
      clusterPipeline: {
        proposedClusters: 1,
        approvalPending: 0,
        inSetup: 0,
      },
      infrastructureRequirements: [
        {
          item: "New Cluster Manager",
          quantity: 1,
          estimatedCost: 50000,
          priority: "HIGH",
        },
        {
          item: "Operations Managers",
          quantity: 3,
          estimatedCost: 120000,
          priority: "HIGH",
        },
        {
          item: "Supervisors",
          quantity: 6,
          estimatedCost: 150000,
          priority: "MEDIUM",
        },
      ],
    };
  }

  // ============================================
  // 8️⃣ ALERTS & STRATEGIC ESCALATIONS
  // ============================================

  getCityAlerts(cityId: string = 'CITY-SURAT'): CityAlert[] {
    // ✅ UPDATED: Now uses real cluster names
    const clusters = organizationHierarchyService.getClustersByCity(cityId);
    const clusterNames = clusters.map(c => c.name);

    return [
      {
        id: "ALERT-CM-001",
        type: "CLUSTER_REVENUE_CRITICAL",
        priority: "CRITICAL",
        title: `${clusterNames[2] || 'Central Surat'} Revenue Critical`,
        description: "Revenue at 73.8% - below critical threshold of 75%",
        impact: "₹6.8L revenue gap, 85 customers affected",
        affectedClusters: [clusterNames[2] || 'Central Surat'],
        timeElapsed: 72 * 60,
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        autoEscalateIn: 48 * 60,
        actions: {
          initiateIntervention: true,
          requiresDecision: true,
        },
      },
      {
        id: "ALERT-CM-002",
        type: "RETENTION_CRISIS",
        priority: "CRITICAL",
        title: "Premium Segment Churn Spike",
        description: "28 premium customers at high churn risk",
        impact: "₹4.2L monthly revenue at risk",
        affectedClusters: [clusterNames[0] || 'South Surat', clusterNames[1] || 'North Surat'],
        timeElapsed: 120 * 60,
        createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000),
        actions: {
          initiateIntervention: true,
        },
      },
      {
        id: "ALERT-CM-003",
        type: "COST_ANOMALY",
        priority: "WARNING",
        title: "Consumable Cost Spike",
        description: "18% increase in consumable costs month-over-month",
        impact: "EBITDA compression by 2%",
        affectedClusters: [clusterNames[0] || 'South Surat', clusterNames[1] || 'North Surat'],
        timeElapsed: 48 * 60,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        actions: {
          requiresDecision: true,
        },
      },
    ];
  }

  // ============================================
  // 9️⃣ INCENTIVE TRACKER (CITY LEVEL)
  // ============================================

  getCityManagerIncentive(): CityManagerIncentive {
    // In production: GET /api/city-manager/incentive
    const cityKPIs = this.getCityKPIs();
    const financials = this.getRevenueEBITDADashboard();

    const revenueAchievement = cityKPIs.revenue.percentage;
    const ebitdaAchievement = financials.ebitda.percentage;
    const retentionAchievement = cityKPIs.retention.percentage;
    const growthAchievement = cityKPIs.revenue.growth;

    const revenueScore = (revenueAchievement / 100) * CITY_INCENTIVE_CONFIG.KPI_WEIGHTAGE.REVENUE;
    const ebitdaScore = (ebitdaAchievement / CITY_KPI_TARGETS.EBITDA_TARGET) * CITY_INCENTIVE_CONFIG.KPI_WEIGHTAGE.EBITDA;
    const retentionScore = (retentionAchievement / CITY_KPI_TARGETS.RETENTION_90DAY) * CITY_INCENTIVE_CONFIG.KPI_WEIGHTAGE.RETENTION;
    const growthScore = (growthAchievement / 10) * CITY_INCENTIVE_CONFIG.KPI_WEIGHTAGE.GROWTH;

    const totalScore = revenueScore + ebitdaScore + retentionScore + growthScore;
    const ebitdaThresholdMet = ebitdaAchievement >= CITY_INCENTIVE_CONFIG.EBITDA_MANDATORY_THRESHOLD;

    let multiplier = 0;
    if (ebitdaThresholdMet) {
      if (totalScore >= 90) multiplier = CITY_INCENTIVE_CONFIG.PAYOUT_TIERS.EXCELLENT.MULTIPLIER;
      else if (totalScore >= 80) multiplier = CITY_INCENTIVE_CONFIG.PAYOUT_TIERS.GOOD.MULTIPLIER;
      else if (totalScore >= 70) multiplier = CITY_INCENTIVE_CONFIG.PAYOUT_TIERS.AVERAGE.MULTIPLIER;
      else if (totalScore >= 60) multiplier = CITY_INCENTIVE_CONFIG.PAYOUT_TIERS.BELOW_PAR.MULTIPLIER;
    }

    const kpiBonus = CITY_INCENTIVE_CONFIG.BASE_INCENTIVE * multiplier;
    const growthBonus = cityKPIs.revenue.growth >= 10 ? CITY_INCENTIVE_CONFIG.GROWTH_BONUS.REVENUE_GROWTH_10_PERCENT : 0;

    return {
      month: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      kpiScoring: {
        revenue: {
          weightage: CITY_INCENTIVE_CONFIG.KPI_WEIGHTAGE.REVENUE,
          achievement: revenueAchievement,
          score: revenueScore,
        },
        ebitda: {
          weightage: CITY_INCENTIVE_CONFIG.KPI_WEIGHTAGE.EBITDA,
          achievement: ebitdaAchievement,
          score: ebitdaScore,
          mandatoryThreshold: CITY_INCENTIVE_CONFIG.EBITDA_MANDATORY_THRESHOLD,
          thresholdMet: ebitdaThresholdMet,
        },
        retention: {
          weightage: CITY_INCENTIVE_CONFIG.KPI_WEIGHTAGE.RETENTION,
          achievement: retentionAchievement,
          score: retentionScore,
        },
        growth: {
          weightage: CITY_INCENTIVE_CONFIG.KPI_WEIGHTAGE.GROWTH,
          achievement: growthAchievement,
          score: growthScore,
        },
      },
      incentiveForecast: {
        baseIncentive: CITY_INCENTIVE_CONFIG.BASE_INCENTIVE,
        kpiBonus: Math.round(kpiBonus),
        growthBonus: growthBonus,
        totalProjected: Math.round(CITY_INCENTIVE_CONFIG.BASE_INCENTIVE + kpiBonus + growthBonus),
      },
      lastMonthPayout: 185000,
      trend: "UP",
      auditLog: {
        systemGenerated: true,
        lastRecalculated: new Date(),
      },
    };
  }

  // ============================================
  // 🔟 REPORTS & ANALYTICS
  // ============================================

  getCityReports(): CityReport[] {
    // In production: GET /api/city-manager/reports
    return [
      {
        id: "REP-001",
        reportType: "MONTHLY_P&L",
        month: "March 2026",
        generatedAt: new Date(),
        generatedBy: "SYSTEM",
        summary: "Monthly P&L showing 12.5% revenue growth with 28.5% EBITDA",
      },
      {
        id: "REP-002",
        reportType: "CLUSTER_PERFORMANCE",
        month: "March 2026",
        generatedAt: new Date(),
        generatedBy: "SYSTEM",
        summary: "Cluster performance analysis - East Zone requires intervention",
      },
      {
        id: "REP-003",
        reportType: "RETENTION_ANALYSIS",
        month: "March 2026",
        generatedAt: new Date(),
        generatedBy: "SYSTEM",
        summary: "Retention analysis showing quality issues as primary churn driver",
      },
    ];
  }

  // ============================================
  // 1️⃣1️⃣ AUDIT LOG (MANAGEMENT VISIBILITY)
  // ============================================

  getCityAuditLog(): CityAuditLog[] {
    // In production: GET /api/city-manager/audit-log
    return [
      {
        id: "AUDIT-001",
        timestamp: new Date(),
        action: "Strategic Plan Updated",
        performedBy: CURRENT_CITY_MANAGER.NAME,
        affectedEntity: "East Zone",
        entityType: "INTERVENTION",
        details: "Added 2-day monitoring period before MD escalation",
        visibleToMD: true,
        visibleToBoard: false,
      },
      {
        id: "AUDIT-002",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        action: "Expansion Approved",
        performedBy: CURRENT_CITY_MANAGER.NAME,
        affectedEntity: "Vesu Expansion",
        entityType: "EXPANSION",
        details: "Approved Vesu expansion with ₹6.5L investment",
        visibleToMD: true,
        visibleToBoard: true,
      },
    ];
  }
}

// Singleton instance
export const cityManagerService = new CityManagerService();
