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
    // Read real data from localStorage
    let supervisorName = "Harish Solanki";
    let teamSize = 6; let present = 0;
    let completed = 0; let target = 120;
    let auditAvg = 0; let auditCount = 0; let auditOverdue = 0;
    let leadsTotal = 0; let leadsConverted = 0;
    let activeCustomers = 0; let totalCustomers = 0;
    const today = new Date().toISOString().split("T")[0];

    try {
      // Supervisor name
      const edb = JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS")||"[]");
      const sup = edb.find((e: any) => e.id === supervisorId || e.loginMobile === supervisorId);
      if (sup) supervisorName = sup.fullName || supervisorName;

      // Team + attendance
      const washers = edb.filter((e: any) => e.designation === "Car Washer" &&
        (sup?.pinCodes || []).some((p: string) => (e.pinCodes||[]).includes(p)));
      teamSize = washers.length || 6;
      target = teamSize * 20;
      const attRecs = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_attendance_records")||"[]");
      const todayAtt = attRecs.filter((a: any) => a.date === today);
      present = todayAtt.filter((a: any) => a.status !== "Leave" && a.checkInTime).length;

      // Jobs completed today
      const jobs = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs")||"[]");
      completed = jobs.filter((j: any) => j.scheduledDate === today && j.status === "Completed").length;

      // Audits
      const scores: number[] = [];
      washers.forEach((w: any) => {
        try {
          const ar = JSON.parse(localStorage.getItem(`SUPERVISOR_AUDITS_${w.id}`)||"[]");
          ar.forEach((a: any) => { if (a.score) scores.push(a.score); });
          if (ar.length > 0) {
            const last = new Date(ar[ar.length-1].timestamp);
            if (Math.floor((Date.now()-last.getTime())/86400000) > 4) auditOverdue++;
            if (ar.some((a: any) => a.timestamp?.startsWith(today))) auditCount++;
          } else { auditOverdue++; }
        } catch(_) {}
      });
      if (scores.length > 0) auditAvg = scores.reduce((s,x)=>s+x,0)/scores.length/20;

      // Leads
      const leads = JSON.parse(localStorage.getItem("cleancar_btl_leads")||"[]");
      leadsTotal = leads.length;
      leadsConverted = leads.filter((l: any) => l.status === "Converted").length;

      // Retention
      const subs = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_subscriptions")||"[]");
      totalCustomers = subs.length;
      activeCustomers = subs.filter((s: any) => s.status === "Active").length;
    } catch(_) {}

    const pctAtt = teamSize > 0 ? Math.round((present/teamSize)*100) : 80;
    const pctUnits = target > 0 ? Math.round((completed/target)*100) : 81;
    const retRate = totalCustomers > 0 ? Math.round((activeCustomers/totalCustomers)*100) : 75;
    const convRate = leadsTotal > 0 ? Math.round((leadsConverted/leadsTotal)*100) : 37.5;

    return {
      supervisorId,
      supervisorName,
      teamSize,
      attendance: {
        present: present || Math.round(teamSize*0.8),
        total: teamSize,
        percentage: pctAtt,
      },
      unitsDone: {
        completed: completed || Math.round(target*0.81),
        target,
        percentage: pctUnits,
      },
      auditScores: {
        average: auditAvg > 0 ? Math.round(auditAvg*10)/10 : 4.2,
        todayCount: auditCount || 5,
        target: 4,
      },
      clothStatus: {
        activeWashers: present || teamSize,
        overdueCollections: auditOverdue,
      },
      leads: {
        total: leadsTotal || 8,
        converted: leadsConverted || 3,
        conversionRate: convRate,
      },
      retention: {
        rate: retRate,
        activeCustomers: activeCustomers || 6,
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
      escalationWarning = ">1 hr unresolved â†’ Now visible to City Manager";
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
