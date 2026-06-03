/**
 * Hierarchy Visibility Service
 * Shows what data is visible to each management level
 */

export type VisibilityLevel = "FULL" | "SUMMARY" | "AGGREGATE" | "NONE";
export type ManagementRole = "SUPERVISOR" | "OPS_MANAGER" | "CITY_MANAGER";

export interface DataVisibility {
  dataPoint: string;
  supervisor: VisibilityLevel;
  opsManager: VisibilityLevel;
  cityManager: VisibilityLevel;
  supervisorDetail?: string;
  opsManagerDetail?: string;
  cityManagerDetail?: string;
}

export interface HierarchyView {
  role: ManagementRole;
  label: string;
  canSee: string[];
  viewType: string;
  color: string;
}

export interface SupervisorPerformanceData {
  supervisorId: string;
  supervisorName: string;
  teamSize: number;
  attendance: {
    present: number;
    total: number;
    percentage: number;
  };
  unitsDone: {
    completed: number;
    target: number;
    percentage: number;
  };
  auditScores: {
    average: number;
    todayCount: number;
    target: number;
  };
  clothStatus: {
    activeWashers: number;
    overdueCollections: number;
  };
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
  };
  retention: {
    rate: number;
    activeCustomers: number;
  };
  incentives: {
    month: number;
    earned: number;
    pending: number;
  };
  kpi: {
    score: number;
    threshold: number;
    status: "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL";
  };
}

export interface KPIComparison {
  metric: string;
  supervisorValue: number;
  teamAverage: number;
  cityAverage: number;
  rank?: number;
  totalSupervisors?: number;
}

export interface EscalationVisibility {
  activeEscalations: number;
  visibleToOpsManager: boolean;
  visibleToCityManager: boolean;
  oldestUnresolvedHours: number;
  escalationWarning?: string;
}

class HierarchyVisibilityService {
  // ========== DATA VISIBILITY MAPPING ==========

  getDataVisibilityMap(): DataVisibility[] {
    return [
      {
        dataPoint: "Individual Washer Attendance",
        supervisor: "FULL",
        opsManager: "SUMMARY",
        cityManager: "AGGREGATE",
        supervisorDetail: "Real-time check-in/out, GPS, selfies",
        opsManagerDetail: "Team summary (12/15 present)",
        cityManagerDetail: "City-wide percentage only",
      },
      {
        dataPoint: "Audit Scores",
        supervisor: "FULL",
        opsManager: "FULL",
        cityManager: "SUMMARY",
        supervisorDetail: "Individual washer scores + photos",
        opsManagerDetail: "All audit logs + trends",
        cityManagerDetail: "Supervisor average scores",
      },
      {
        dataPoint: "Lead Details",
        supervisor: "FULL",
        opsManager: "FULL",
        cityManager: "SUMMARY",
        supervisorDetail: "Customer names, contact, notes",
        opsManagerDetail: "All leads + conversion tracking",
        cityManagerDetail: "Lead counts + conversion %",
      },
      {
        dataPoint: "Retention Rate",
        supervisor: "FULL",
        opsManager: "FULL",
        cityManager: "FULL",
        supervisorDetail: "Per-customer retention status",
        opsManagerDetail: "Team retention + churn reasons",
        cityManagerDetail: "City-wide retention benchmarks",
      },
      {
        dataPoint: "KPI Score",
        supervisor: "FULL",
        opsManager: "FULL",
        cityManager: "FULL",
        supervisorDetail: "Personal KPI breakdown",
        opsManagerDetail: "All supervisor KPIs + comparison",
        cityManagerDetail: "Rankings + bottom performers",
      },
      {
        dataPoint: "Incentive Earnings",
        supervisor: "FULL",
        opsManager: "SUMMARY",
        cityManager: "AGGREGATE",
        supervisorDetail: "Per-lead incentive breakdown",
        opsManagerDetail: "Total earned by supervisor",
        cityManagerDetail: "City-wide incentive budget",
      },
      {
        dataPoint: "Escalations",
        supervisor: "FULL",
        opsManager: "FULL",
        cityManager: "SUMMARY",
        supervisorDetail: "All escalations + status",
        opsManagerDetail: "Real-time escalation feed",
        cityManagerDetail: ">1hr unresolved only",
      },
      {
        dataPoint: "Cloth Inventory",
        supervisor: "FULL",
        opsManager: "SUMMARY",
        cityManager: "NONE",
        supervisorDetail: "Batch-level tracking (A/B/C/D)",
        opsManagerDetail: "Overdue collections only",
        cityManagerDetail: "Not visible",
      },
    ];
  }

  // ========== HIERARCHY VIEWS ==========

  getHierarchyViews(): HierarchyView[] {
    return [
      {
        role: "SUPERVISOR",
        label: "Supervisor",
        canSee: [
          "Full team visibility",
          "Individual washer details",
          "Real-time attendance",
          "Audit execution",
          "Lead generation",
          "Cloth management",
        ],
        viewType: "Operational Dashboard",
        color: "blue",
      },
      {
        role: "OPS_MANAGER",
        label: "Ops Manager",
        canSee: [
          "All teams (aggregate)",
          "Audit logs + trends",
          "Lead counts + conversion",
          "KPI comparison",
          "Escalation feed",
          "Supervisor performance",
        ],
        viewType: "Multi-Team Overview",
        color: "purple",
      },
      {
        role: "CITY_MANAGER",
        label: "City Manager",
        canSee: [
          "City-wide dashboard",
          "Rankings",
          "Bottom performers",
          "Escalation delays (>1hr)",
          "Budget vs actuals",
          "Strategic metrics",
        ],
        viewType: "Strategic Dashboard",
        color: "emerald",
      },
    ];
  }

  // ========== SUPERVISOR PERFORMANCE DATA ==========

  getSupervisorPerformance(supervisorId: string): SupervisorPerformanceData {
    // In production: GET /api/supervisor/:id/performance
    return {
      supervisorId,
      supervisorName: "Rohit Mehta",
      teamSize: 15,
      attendance: {
        present: 12,
        total: 15,
        percentage: 80,
      },
      unitsDone: {
        completed: 145,
        target: 180,
        percentage: 81,
      },
      auditScores: {
        average: 4.2,
        todayCount: 5,
        target: 4,
      },
      clothStatus: {
        activeWashers: 12,
        overdueCollections: 2,
      },
      leads: {
        total: 8,
        converted: 3,
        conversionRate: 37.5,
      },
      retention: {
        rate: 75,
        activeCustomers: 6,
      },
      incentives: {
        month: 4500,
        earned: 3150,
        pending: 1350,
      },
      kpi: {
        score: 78,
        threshold: 70,
        status: "GOOD",
      },
    };
  }

  // ========== KPI COMPARISON ==========

  getKPIComparison(supervisorId: string): KPIComparison[] {
    return [
      {
        metric: "Attendance %",
        supervisorValue: 80,
        teamAverage: 85,
        cityAverage: 82,
        rank: 8,
        totalSupervisors: 12,
      },
      {
        metric: "Units/Day",
        supervisorValue: 145,
        teamAverage: 150,
        cityAverage: 155,
        rank: 9,
        totalSupervisors: 12,
      },
      {
        metric: "Audit Score",
        supervisorValue: 4.2,
        teamAverage: 4.0,
        cityAverage: 4.1,
        rank: 3,
        totalSupervisors: 12,
      },
      {
        metric: "Conversion %",
        supervisorValue: 37.5,
        teamAverage: 32,
        cityAverage: 35,
        rank: 2,
        totalSupervisors: 12,
      },
      {
        metric: "Retention %",
        supervisorValue: 75,
        teamAverage: 70,
        cityAverage: 72,
        rank: 4,
        totalSupervisors: 12,
      },
      {
        metric: "KPI Score",
        supervisorValue: 78,
        teamAverage: 72,
        cityAverage: 75,
        rank: 5,
        totalSupervisors: 12,
      },
    ];
  }

  // ========== ESCALATION VISIBILITY ==========

  getEscalationVisibility(supervisorId: string): EscalationVisibility {
    const activeEscalations = 2;
    const oldestUnresolvedHours = 1.5;

    let escalationWarning: string | undefined;
    if (oldestUnresolvedHours > 1) {
      escalationWarning = ">1 hr unresolved → Now visible to City Manager";
    }

    return {
      activeEscalations,
      visibleToOpsManager: activeEscalations > 0,
      visibleToCityManager: oldestUnresolvedHours > 1,
      oldestUnresolvedHours,
      escalationWarning,
    };
  }
}

// Singleton instance
export const hierarchyVisibilityService = new HierarchyVisibilityService();
