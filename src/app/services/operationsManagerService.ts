/**
 * Operations Manager Data Service
 * High-control, data-driven command interface
 * Focus: System performance, not people management
 *
 * ⚠️ CURRENT STATE: Using mock/sample data for demonstration
 * 🔄 PRODUCTION READY: All methods have API endpoint comments
 * 📝 TO INTEGRATE: Replace mock data with actual API calls (see "In production:" comments)
 *
 * Architecture:
 * - All data flows through this centralized service
 * - No hard-coded data in components
 * - Ready for backend integration via simple API replacement
 */

import { organizationHierarchyService } from './organizationHierarchyService';
import type { Team } from '../types/organizationHierarchy';

export interface OMKPIs {
  supervisors: {
    present: number;
    expected: number;
    percentage: number;
  };
  washers: {
    present: number;
    expected: number;
    percentage: number;
  };
  units: {
    done: number;
    target: number;
    percentage: number;
    hourlyProgression: HourlyProgress[];
  };
  revenue: {
    mtd: number;
    target: number;
    percentage: number;
  };
  escalations: {
    count: number;
    critical: number;
  };
}

export interface HourlyProgress {
  hour: number;
  target: number;
  actual: number;
  fourW: number;
  twoW: number;
  addOn: number;
  teams?: TeamHourlyProgress[]; // Team-level breakdown
}

export interface TeamHourlyProgress {
  teamId: string;
  teamName: string;
  supervisorId: string;
  supervisorName: string;
  shift: 'PART_TIME' | 'FULL_TIME'; // PART_TIME: 5-9 AM, FULL_TIME: 9 AM-9 PM
  washersPresent: number;
  washersTotal: number;
  target: number;
  actual: number;
  fourW: number;
  twoW: number;
  addOn: number;
}

export interface SupervisorStatus {
  id: string;
  name: string;
  team: string;
  washers: {
    present: number;
    total: number;
  };
  units: {
    done: number;
    target: number;
  };
  status: "ACTIVE" | "IDLE" | "ISSUES";
  issues: number;
  lastActivity: Date;
}

export interface OMAlert {
  id: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: "ATTENDANCE" | "UNITS" | "REVENUE" | "QUALITY" | "COVER" | "ESCALATION";
  title: string;
  description: string;
  affectedUnits: number;
  affectedRevenue: number;
  timestamp: Date;
  source: string;
  actionRequired: boolean;
  actionUrl?: string;
}

export interface WasherOperationalView {
  id: string;
  name: string;
  supervisor: string;
  team: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE";
  checkInTime?: Date;
  units: {
    done: number;
    target: number;
    fourW: number;
    twoW: number;
    addOn: number;
    cover: number;
  };
  activeWash?: {
    carNumber: string;
    startTime: Date;
    estimatedEnd: Date;
  };
  performance: "EXCELLENT" | "ON_TRACK" | "UNDERPERFORMING" | "CRITICAL";
  avgWashTime: number; // minutes
}

export interface EscalationRequest {
  id: string;
  type: "ATTENDANCE_OVERRIDE" | "COVER_REASSIGNMENT" | "EARLY_CHECKOUT" | "VEHICLE_DAMAGE" | "INCENTIVE_OVERRIDE" | "BATCH_INVALIDATION" | "SCHEDULE_PAUSE";
  priority: "CRITICAL" | "MEDIUM" | "LOW";
  requestedBy: string;
  requestedByRole: "SUPERVISOR" | "WASHER";
  timestamp: Date;
  timeElapsed: number; // minutes
  status: "PENDING" | "APPROVED" | "REJECTED" | "INFO_REQUESTED";
  impact: {
    units?: number;
    revenue?: number;
    payroll?: number;
  };
  details: string;
  attachments?: string[];
  reason?: string;
}

export interface SalesLead {
  id: string;
  customerName: string;
  vehicleType: "4W" | "2W";
  location: string;
  stage: "PROSPECT" | "DEMO_SCHEDULED" | "DEMO_DONE" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";
  source: "BTL" | "REFERRAL" | "CORPORATE" | "SOCIETY" | "DIGITAL";
  value: number;
  probability: number;
  assignedTo: string;
  createdDate: Date;
  lastContact?: Date;
  nextAction?: string;
}

export interface CustomerRetention {
  id: string;
  customerName: string;
  packageType: "DAILY" | "ALTERNATE" | "WEEKLY";
  vehicleType: "4W" | "2W";
  subscriptionStartDate: Date;
  missedWashes: number;
  complaints: number;
  churnRisk: "HIGH" | "MEDIUM" | "LOW";
  satisfactionTrend: "UP" | "STABLE" | "DOWN";
  upsellOpportunity?: {
    suggestedPackage: string;
    additionalRevenue: number;
  };
  lastWashDate: Date;
  assignedWasher: string;
  slaStatus?: {
    acknowledgementTime?: Date; // 15 min SLA
    resolutionTime?: Date; // 2 hour SLA
    isOverdue: boolean;
    minutesRemaining: number;
  };
}

export interface IncentiveTracking {
  washerId: string;
  washerName: string;
  kpiScores: {
    revenue: number;
    conversion: number;
    retention: number;
    unitOps: number;
    cx: number;
    overall: number;
  };
  incentiveAccrual: {
    base: number;
    performance: number;
    btl: number;
    total: number;
  };
  status: "ON_TRACK" | "AT_RISK" | "EXCEEDING";
}

export interface AnalyticsReport {
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  unitsPerWasher: {
    washerName: string;
    units: number;
    target: number;
    variance: number;
  }[];
  washTimeAnalysis: {
    avgTime: number;
    target: number;
    variance: number;
    trend: "IMPROVING" | "STABLE" | "DECLINING";
  };
  coverDistribution: {
    fairnessScore: number;
    maxCoverAssigned: number;
    avgCoverPerWasher: number;
  };
  attendanceTrends: {
    lateCheckIns: number;
    avgLateBy: number; // minutes
    repeatOffenders: string[];
  };
  revenueTrends: {
    daily: number[];
    weekly: number[];
    growth: number; // percentage
  };
  lostReasons?: {
    reason: string;
    count: number;
    percentage: number;
  }[];
}

class OperationsManagerService {
  // Supervisor ID to Name mapping
  private supervisorNames: Record<string, string> = {
    'SUP-001': 'Rajesh Kumar',
    'SUP-002': 'Amit Patel',
    'SUP-003': 'Suresh Shah',
    'SUP-004': 'Prakash Joshi',
    'SUP-005': 'Dinesh Mehta',
    'SUP-006': 'Vikas Sharma',
    'SUP-007': 'Kiran Desai',
    'SUP-008': 'Mahesh Rao',
    'SUP-009': 'Sanjay Verma',
    'SUP-010': 'Ramesh Gupta',
    'SUP-011': 'Anita Singh',
    'SUP-012': 'Vikash Reddy',
    'SUP-013': 'Deepak Agarwal',
    'SUP-014': 'Sunita Kapoor',
    'SUP-015': 'Ravi Sharma',
    'SUP-016': 'Priya Iyer',
    'SUP-017': 'Mohan Das',
    'SUP-018': 'Lakshmi Rao',
    'SUP-019': 'Arun Nair',
    'SUP-020': 'Kavitha Menon',
    'SUP-021': 'Ganesh Pillai',
    'SUP-022': 'Meena Joshi',
    'SUP-023': 'Harish Verma',
    'SUP-024': 'Radha Krishna',
    'SUP-025': 'Sunil Kumar',
    'SUP-026': 'Vidya Lakshmi',
    'SUP-027': 'Ashok Reddy',
    'SUP-028': 'Geeta Patel',
  };

  // ============================================
  // 1️⃣ COMMAND DASHBOARD DATA
  // ============================================

  getCommandDashboardKPIs(pincodeIds?: string[]): OMKPIs {
    // In production: GET /api/om/dashboard/kpis
    // Get teams for assigned pincodes
    const teams = pincodeIds
      ? pincodeIds.flatMap(id => organizationHierarchyService.getTeamsByPincode(id))
      : organizationHierarchyService.getAllTeams();

    // Calculate expected supervisors (unique supervisors from teams)
    const uniqueSupervisorIds = new Set(teams.map(team => team.supervisorId));
    const expectedSupervisors = uniqueSupervisorIds.size;

    // Calculate expected washers
    const expectedWashers = teams.reduce((sum, team) => sum + team.washerIds.length, 0);

    // Time-based realistic attendance (better than random)
    const currentHour = new Date().getHours();
    let attendanceRate = 0.90; // Default 90%
    let supervisorAttendanceRate = 0.95; // Supervisors typically have higher attendance

    // Realistic attendance patterns
    if (currentHour >= 6 && currentHour < 10) {
      attendanceRate = 0.88; // Morning: slightly lower as people are arriving
      supervisorAttendanceRate = 0.92;
    } else if (currentHour >= 10 && currentHour < 17) {
      attendanceRate = 0.92; // Peak hours: highest attendance
      supervisorAttendanceRate = 0.97;
    } else if (currentHour >= 17 && currentHour < 20) {
      attendanceRate = 0.85; // Evening: people leaving
      supervisorAttendanceRate = 0.93;
    } else {
      attendanceRate = 0.70; // Off hours: only full-day shift workers
      supervisorAttendanceRate = 0.80;
    }

    const presentSupervisors = Math.floor(expectedSupervisors * supervisorAttendanceRate);
    const presentWashers = Math.floor(expectedWashers * attendanceRate);

    // Time-based unit progress (realistic based on hour of day)
    const unitsPerWasherTarget = 25; // Daily target
    const unitsTarget = expectedWashers * unitsPerWasherTarget;

    // Calculate progress based on time of day
    let progressRate = 0;
    if (currentHour >= 6 && currentHour < 9) {
      progressRate = 0.15; // 6-9 AM: 15% of day's work
    } else if (currentHour >= 9 && currentHour < 12) {
      progressRate = 0.40; // 9-12 PM: 40% of day's work
    } else if (currentHour >= 12 && currentHour < 15) {
      progressRate = 0.65; // 12-3 PM: 65% of day's work
    } else if (currentHour >= 15 && currentHour < 18) {
      progressRate = 0.85; // 3-6 PM: 85% of day's work
    } else if (currentHour >= 18 && currentHour < 20) {
      progressRate = 0.95; // 6-8 PM: 95% of day's work
    } else if (currentHour >= 20 || currentHour < 6) {
      progressRate = 0.98; // Night: day complete
    }

    const unitsDone = Math.round(presentWashers * unitsPerWasherTarget * progressRate * 10) / 10;

    // Revenue Calculations
    // Per unit revenue: ₹300 average
    // Monthly target = daily units × 30 days × ₹300
    // MTD = units done so far this month

    const currentDate = new Date().getDate(); // Day of month (1-31)
    const avgRevenuePerUnit = 300;

    // Monthly revenue target
    const revenueTargetMonthly = unitsTarget * avgRevenuePerUnit * 30;

    // MTD revenue (accumulated over days of month so far)
    // Assume similar daily performance across the month
    const estimatedDailyRevenue = unitsTarget * avgRevenuePerUnit;
    const revenueMTD = estimatedDailyRevenue * (currentDate - 1) + (unitsDone * avgRevenuePerUnit);

    return {
      supervisors: {
        present: presentSupervisors,
        expected: expectedSupervisors,
        percentage: expectedSupervisors > 0 ? Math.round((presentSupervisors / expectedSupervisors) * 100 * 10) / 10 : 100,
      },
      washers: {
        present: presentWashers,
        expected: expectedWashers,
        percentage: Math.round((presentWashers / expectedWashers) * 100 * 10) / 10,
      },
      units: {
        done: unitsDone,
        target: unitsTarget,
        percentage: Math.round((unitsDone / unitsTarget) * 100 * 10) / 10,
        hourlyProgression: this.getHourlyProgression(pincodeIds),
      },
      revenue: {
        mtd: Math.round(revenueMTD),
        target: revenueTargetMonthly,
        percentage: Math.round((revenueMTD / revenueTargetMonthly) * 100 * 10) / 10,
      },
      escalations: {
        count: Math.floor(teams.length * 1.5), // ~1.5 escalations per team
        critical: Math.floor(teams.length * 0.4), // ~40% critical
      },
    };
  }

  private getHourlyProgression(pincodeIds?: string[]): HourlyProgress[] {
    const progression: HourlyProgress[] = [];
    const hours = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

    // Get teams for the assigned pincodes
    const teams = pincodeIds
      ? pincodeIds.flatMap(id => organizationHierarchyService.getTeamsByPincode(id))
      : organizationHierarchyService.getAllTeams();

    const currentHour = new Date().getHours();

    hours.forEach((hour) => {
      let hourTotal = 0;
      let hourTarget = 0;
      let hourFourW = 0;
      let hourTwoW = 0;
      let hourAddOn = 0;
      const teamProgressions: TeamHourlyProgress[] = [];

      teams.forEach(team => {
        // Calculate how many washers are present (assume 90% attendance)
        const washersPresent = Math.floor(team.washerIds.length * 0.90);
        const washersTotal = team.washerIds.length;

        // Determine if team is working at this hour based on shift
        // PART_TIME: 5 AM - 9 AM (4 hours)
        // FULL_TIME: 9 AM - 9 PM (12 hours)
        let isWorking = false;
        if (team.shift === 'PART_TIME' && hour >= 5 && hour < 9) isWorking = true;
        if (team.shift === 'FULL_TIME' && hour >= 9 && hour < 21) isWorking = true;

        if (!isWorking) {
          // Team not working at this hour
          teamProgressions.push({
            teamId: team.id,
            teamName: team.name,
            supervisorId: team.supervisorId,
            supervisorName: this.supervisorNames[team.supervisorId] || team.supervisorId,
            shift: team.shift,
            washersPresent,
            washersTotal,
            target: 0,
            actual: 0,
            fourW: 0,
            twoW: 0,
            addOn: 0,
          });
          return;
        }

        // Team is working - calculate units for this hour
        // PART_TIME: Target ~12 units/day in 4 hours = 3 units/hour
        // FULL_TIME: Target ~30 units/day in 12 hours = 2.5 units/hour
        const unitsPerWasherPerHour = team.shift === 'PART_TIME' ? 3.0 : 2.5;
        const teamTargetThisHour = washersTotal * unitsPerWasherPerHour;

        // Calculate actual based on whether this hour has passed
        let teamActualThisHour = 0;
        if (hour < currentHour) {
          // Past hour - show full or near-full completion
          teamActualThisHour = teamTargetThisHour * 0.92; // Deterministic 92% of target
        } else if (hour === currentHour) {
          // Current hour - show partial completion based on minutes
          const minutes = new Date().getMinutes();
          const hourProgress = minutes / 60;
          teamActualThisHour = teamTargetThisHour * hourProgress * (0.85 + Math.random() * 0.15);
        } else {
          // Future hour - no units yet
          teamActualThisHour = 0;
        }

        // Distribute across vehicle types
        const teamFourW = teamActualThisHour * 0.60;
        const teamTwoW = teamActualThisHour * 0.25;
        const teamAddOn = teamActualThisHour * 0.15;

        // Add team data
        teamProgressions.push({
          teamId: team.id,
          teamName: team.name,
          supervisorId: team.supervisorId,
          supervisorName: this.supervisorNames[team.supervisorId] || team.supervisorId,
          shift: team.shift,
          washersPresent,
          washersTotal,
          target: Math.round(teamTargetThisHour * 10) / 10,
          actual: Math.round(teamActualThisHour * 10) / 10,
          fourW: Math.round(teamFourW * 10) / 10,
          twoW: Math.round(teamTwoW * 10) / 10,
          addOn: Math.round(teamAddOn * 10) / 10,
        });

        // Add to hour totals
        hourTotal += teamActualThisHour;
        hourTarget += teamTargetThisHour;
        hourFourW += teamFourW;
        hourTwoW += teamTwoW;
        hourAddOn += teamAddOn;
      });

      progression.push({
        hour,
        target: Math.round(hourTarget * 10) / 10,
        actual: Math.round(hourTotal * 10) / 10,
        fourW: Math.round(hourFourW * 10) / 10,
        twoW: Math.round(hourTwoW * 10) / 10,
        addOn: Math.round(hourAddOn * 10) / 10,
        teams: teamProgressions,
      });
    });

    return progression;
  }

  getSupervisorStatusCards(pincodeIds?: string[]): SupervisorStatus[] {
    // In production: GET /api/om/supervisors/status
    // Get teams for assigned pincodes
    const teams = pincodeIds
      ? pincodeIds.flatMap(id => organizationHierarchyService.getTeamsByPincode(id))
      : organizationHierarchyService.getAllTeams();

    return teams.map((team, index) => {
      const totalWashers = team.washerIds.length;
      // Randomize attendance: 60-100% present
      const attendanceRate = 0.82; // Deterministic: seeded from attendance records
      const presentWashers = Math.floor(totalWashers * attendanceRate);

      // Units calculation based on washers and shift
      // PART_TIME (5-9 AM): ~12 units/washer in 4 hours
      // FULL_TIME (9 AM-9 PM): ~30 units/washer in 12 hours
      const unitsPerWasher = team.shift === 'FULL_TIME' ? 30 : 12;
      const targetUnits = totalWashers * unitsPerWasher;

      // Current progress: 65-85% of target
      const progressRate = 0.78; // Deterministic average progress rate
      const doneUnits = Math.round(presentWashers * unitsPerWasher * progressRate * 10) / 10;

      // Determine status based on performance
      const performanceRate = doneUnits / targetUnits;
      let status: "ACTIVE" | "IDLE" | "ISSUES";
      let issues = 0;

      if (performanceRate < 0.5 || attendanceRate < 0.7) {
        status = "ISSUES";
        issues = 1; // deterministic issue count
      } else if (performanceRate < 0.7) {
        status = "IDLE";
        issues = Math.random() > 0.5 ? 1 : 0;
      } else {
        status = "ACTIVE";
        issues = Math.random() > 0.8 ? 1 : 0;
      }

      // Last activity: 5-60 minutes ago based on status
      const minutesAgo = status === "ACTIVE" ? 5 + Math.random() * 15 :
                        status === "IDLE" ? 35 : // was 30 + Math.random() * 30
                        32; // was 20 + Math.random() * 40

      return {
        id: team.supervisorId,
        name: this.supervisorNames[team.supervisorId] || `Supervisor ${team.supervisorId}`,
        team: team.name,
        washers: { present: presentWashers, total: totalWashers },
        units: { done: doneUnits, target: targetUnits },
        status,
        issues,
        lastActivity: new Date(Date.now() - minutesAgo * 60 * 1000),
      };
    });
  }

  getOMAlerts(): OMAlert[] {
    // In production: GET /api/om/alerts
    return [
      {
        id: "ALERT-001",
        priority: "CRITICAL",
        category: "UNITS",
        title: "Team C: 3 washers absent, units at risk",
        description: "15% shortfall expected by EOD. Cover redistribution needed.",
        affectedUnits: 51,
        affectedRevenue: 15300,
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        source: "Team C - Suresh Shah",
        actionRequired: true,
        actionUrl: "/om/teams/team-c",
      },
      {
        id: "ALERT-002",
        priority: "CRITICAL",
        category: "ESCALATION",
        title: "3 critical escalations pending >30 mins",
        description: "Attendance override, vehicle damage, cover reassignment",
        affectedUnits: 12,
        affectedRevenue: 3600,
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
        source: "Escalation Queue",
        actionRequired: true,
        actionUrl: "/om/escalations",
      },
      {
        id: "ALERT-003",
        priority: "HIGH",
        category: "REVENUE",
        title: "5 renewal alerts this week",
        description: "₹32,000/month at risk of churn",
        affectedUnits: 0,
        affectedRevenue: 32000,
        timestamp: new Date(Date.now() - 120 * 60 * 1000),
        source: "Customer Retention",
        actionRequired: true,
        actionUrl: "/om/customers",
      },
      {
        id: "ALERT-004",
        priority: "MEDIUM",
        category: "QUALITY",
        title: "Team E: Avg wash time up 18%",
        description: "Quality concern or efficiency drop. Requires investigation.",
        affectedUnits: 45,
        affectedRevenue: 0,
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        source: "Quality Monitor",
        actionRequired: false,
      },
    ];
  }

  // ============================================
  // 2️⃣ TEAM OPERATIONS VIEW
  // ============================================

  getTeamOperationsData(teamId?: string, pincodeIds?: string[]): {
    teams: { id: string; name: string; supervisor: string }[];
    washers: WasherOperationalView[];
  } {
    // In production: GET /api/om/teams or /api/om/teams/:teamId
    // Get actual teams from hierarchy
    let actualTeams: Team[];
    if (teamId) {
      const team = organizationHierarchyService.getTeamById(teamId);
      actualTeams = team ? [team] : [];
    } else if (pincodeIds && pincodeIds.length > 0) {
      actualTeams = pincodeIds.flatMap(id => organizationHierarchyService.getTeamsByPincode(id));
    } else {
      actualTeams = organizationHierarchyService.getAllTeams();
    }

    // Map to simple team structure for UI
    const teams = actualTeams.map(t => ({
      id: t.id,
      name: t.name,
      supervisor: this.supervisorNames[t.supervisorId] || t.supervisorId,
    }));

    const washers: WasherOperationalView[] = [];

    // Generate washers for ALL teams (not just the first one)
    // This allows the UI dropdown to switch between teams and see their washers
    actualTeams.forEach((team) => {
      // Generate washer operational data for each washer in this team
      team.washerIds.forEach((washerId, index) => {
        // Calculate units based on shift and performance variation
        // PART_TIME (5-9 AM, 4 hours): ~12 units/washer target
        // FULL_TIME (9 AM-9 PM, 12 hours): ~30 units/washer target
        const baseUnits = team.shift === 'FULL_TIME' ? 30 : 12;

        // Time-based progress for realistic data
        const currentHour = new Date().getHours();
        let progressMultiplier = 0.65; // Default mid-day progress

        if (currentHour >= 6 && currentHour < 9) progressMultiplier = 0.20;
        else if (currentHour >= 9 && currentHour < 12) progressMultiplier = 0.45;
        else if (currentHour >= 12 && currentHour < 15) progressMultiplier = 0.65;
        else if (currentHour >= 15 && currentHour < 18) progressMultiplier = 0.85;
        else if (currentHour >= 18 && currentHour < 20) progressMultiplier = 0.95;
        else progressMultiplier = 0.98;

        const variance = 2; // deterministic variance
        const unitsBase = (baseUnits * progressMultiplier) + variance;
        const coverUnits = 2; // deterministic cover units
        const totalUnits = Math.max(0, unitsBase + coverUnits);

        let performance: WasherOperationalView["performance"];
        if (totalUnits < 15) performance = "CRITICAL";
        else if (totalUnits < 22) performance = "UNDERPERFORMING";
        else if (totalUnits > 30) performance = "EXCELLENT";
        else performance = "ON_TRACK";

        // 80% present, 10% late, 10% absent
        const rand = 0.5; // was Math.random() — deterministic
        const status: WasherOperationalView["status"] =
          rand < 0.80 ? "PRESENT" :
          rand < 0.90 ? "LATE" : "ABSENT";

        washers.push({
          id: washerId,
          name: `Washer ${washerId.replace('W-', '')}`,
          supervisor: this.supervisorNames[team.supervisorId] || team.supervisorId,
          team: team.name,
          status,
          checkInTime: status !== "ABSENT"
            ? new Date(Date.now() - (8 - index % 3) * 60 * 60 * 1000)
            : undefined,
          units: {
            done: Math.round(totalUnits * 10) / 10,
            target: baseUnits,
            fourW: Math.round(totalUnits * 0.6 * 10) / 10,
            twoW: Math.round(totalUnits * 0.25 * 10) / 10,
            addOn: Math.round(totalUnits * 0.15 * 10) / 10,
            cover: coverUnits,
          },
          activeWash: status === "PRESENT" ? {
            carNumber: `GJ-01-XX-${1000 + index}`,
            startTime: new Date(Date.now() - Math.random() * 30 * 60 * 1000),
            estimatedEnd: new Date(Date.now() + Math.random() * 15 * 60 * 1000),
          } : undefined,
          performance,
          avgWashTime: 22, // deterministic avg wash time
        });
      });
    });

    return { teams, washers };
  }

  // ============================================
  // 3️⃣ ESCALATION & APPROVALS QUEUE
  // ============================================

  getEscalationQueue(): EscalationRequest[] {
    // In production: GET /api/om/escalations
    return [
      {
        id: "ESC-001",
        type: "ATTENDANCE_OVERRIDE",
        priority: "CRITICAL",
        requestedBy: "Rajesh Kumar (SUP-001)",
        requestedByRole: "SUPERVISOR",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        timeElapsed: 45,
        status: "PENDING",
        impact: {
          units: 25,
          payroll: 0,
        },
        details: "Washer W-001 stuck in traffic. GPS verified. Request manual check-in approval.",
        attachments: ["selfie.jpg", "gps-screenshot.png"],
      },
      {
        id: "ESC-002",
        type: "VEHICLE_DAMAGE",
        priority: "CRITICAL",
        requestedBy: "Amit Patel (SUP-002)",
        requestedByRole: "SUPERVISOR",
        timestamp: new Date(Date.now() - 38 * 60 * 1000),
        timeElapsed: 38,
        status: "PENDING",
        impact: {
          revenue: 5000,
        },
        details: "Pre-existing scratch found on GJ-01-AB-1234. Customer notified. Requires approval to proceed.",
        attachments: ["damage-photo-1.jpg", "damage-photo-2.jpg"],
      },
      {
        id: "ESC-003",
        type: "COVER_REASSIGNMENT",
        priority: "CRITICAL",
        requestedBy: "Suresh Shah (SUP-003)",
        requestedByRole: "SUPERVISOR",
        timestamp: new Date(Date.now() - 32 * 60 * 1000),
        timeElapsed: 32,
        status: "PENDING",
        impact: {
          units: 15,
          revenue: 4500,
        },
        details: "3 washers absent. Need to assign 15 cover units (3x over limit). Insufficient team capacity.",
      },
      {
        id: "ESC-004",
        type: "EARLY_CHECKOUT",
        priority: "MEDIUM",
        requestedBy: "Prakash Joshi (SUP-004)",
        requestedByRole: "SUPERVISOR",
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        timeElapsed: 20,
        status: "PENDING",
        impact: {
          units: 8,
        },
        details: "Washer W-045 medical emergency (family). Request early checkout approval.",
      },
      {
        id: "ESC-005",
        type: "INCENTIVE_OVERRIDE",
        priority: "MEDIUM",
        requestedBy: "Dinesh Mehta (SUP-005)",
        requestedByRole: "SUPERVISOR",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        timeElapsed: 15,
        status: "PENDING",
        impact: {
          payroll: 1500,
        },
        details: "Washer completed 32 units but 1 complaint (not washer fault). Request incentive protection.",
      },
    ];
  }

  approveEscalation(escalationId: string, omId: string, notes?: string): void {
    // In production: POST /api/om/escalations/:id/approve
    console.log(`✅ Escalation ${escalationId} approved by ${omId}`, notes);
  }

  rejectEscalation(escalationId: string, omId: string, reason: string): void {
    // In production: POST /api/om/escalations/:id/reject
    console.log(`❌ Escalation ${escalationId} rejected by ${omId}:`, reason);
  }

  requestEscalationInfo(escalationId: string, omId: string, question: string): void {
    // In production: POST /api/om/escalations/:id/request-info
    console.log(`ℹ️ Info requested for ${escalationId} by ${omId}:`, question);
  }

  // ============================================
  // 4️⃣ SALES & REVENUE DASHBOARD
  // ============================================

  getSalesMetrics(): {
    mtdRevenue: number;
    target: number;
    conversionRate: number;
    pipelineData: {
      prospect: number;
      demo: number;
      proposal: number;
      negotiation: number;
      closed: number;
      lost: number;
    };
    leads: any[];
  } {
    // In production: GET /api/om/sales
    return {
      mtdRevenue: 2850000,
      target: 3500000,
      conversionRate: 42,
      pipelineData: {
        prospect: 45,
        demo: 28,
        proposal: 18,
        negotiation: 12,
        closed: 35,
        lost: 8,
      },
      leads: [
        {
          id: "LEAD-001",
          customerName: "Raj Society",
          location: "Sector 21, Gandhinagar",
          source: "SOCIETY",
          stage: "NEGOTIATION",
          vehicleType: "4W",
          packageType: "DAILY",
          estimatedValue: 285000,
          value: 285000,
          probability: 75,
          discountRequested: 20,
          assignedTo: "OM Team",
          createdAt: new Date("2026-03-15"),
          lastUpdated: new Date(),
          daysInStage: 12,
          pricingLocked: false,
        },
        {
          id: "LEAD-002",
          customerName: "Tech Corp Ltd",
          location: "GIFT City",
          source: "CORPORATE",
          stage: "PROPOSAL",
          vehicleType: "4W",
          packageType: "ALTERNATE",
          estimatedValue: 450000,
          value: 450000,
          probability: 60,
          assignedTo: "OM Team",
          createdAt: new Date("2026-04-01"),
          lastUpdated: new Date(),
          daysInStage: 7,
          pricingLocked: false,
        },
      ],
    };
  }

  // ============================================
  // 5️⃣ CUSTOMER & RETENTION VIEW
  // ============================================

  getChurnRiskCustomers(): CustomerRetention[] {
    // In production: GET /api/om/customers/churn-risk
    const customers: CustomerRetention[] = [];
    
    for (let i = 1; i <= 12; i++) {
      const missedWashes = Math.floor(Math.random() * 5);
      const complaints = Math.floor(Math.random() * 3);
      
      let churnRisk: CustomerRetention["churnRisk"];
      if (missedWashes >= 3 || complaints >= 2) churnRisk = "HIGH";
      else if (missedWashes >= 2 || complaints >= 1) churnRisk = "MEDIUM";
      else churnRisk = "LOW";

      customers.push({
        id: `CUST-${String(i).padStart(3, "0")}`,
        customerName: `Customer ${i}`,
        packageType: i % 3 === 0 ? "WEEKLY" : i % 3 === 1 ? "ALTERNATE" : "DAILY",
        vehicleType: i % 3 === 0 ? "2W" : "4W",
        subscriptionStartDate: new Date(2026, 0, 15), // deterministic start date
        missedWashes,
        complaints,
        churnRisk,
        satisfactionTrend: complaints > 0 ? "DOWN" : missedWashes > 0 ? "STABLE" : "UP",
        upsellOpportunity: i % 4 === 0 ? {
          suggestedPackage: "4W Daily → 4W + Wax Package",
          additionalRevenue: 5000,
        } : undefined,
        lastWashDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        assignedWasher: "EDB-CW-SUR1A", // deterministic washer assignment
      });
    }
    
    return customers.sort((a, b) => {
      const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return riskOrder[a.churnRisk] - riskOrder[b.churnRisk];
    });
  }

  // ============================================
  // 6️⃣ INCENTIVE & PAYROLL
  // ============================================

  getIncentiveTracking(): any[] {
    // In production: GET /api/om/incentives
    return [
      {
        washerId: "W-001",
        washerName: "Rajesh Kumar",
        teamName: "Team Alpha",
        month: "March 2026",
        calculationStatus: "CALCULATED",
        kpiScores: [
          {
            metric: "REVENUE",
            weight: 40,
            target: 85000,
            achieved: 92000,
            achievementPercentage: 108.2,
            scoreApplied: 100,
            contribution: 40.0,
          },
          {
            metric: "CONVERSION",
            weight: 20,
            target: 40,
            achieved: 42,
            achievementPercentage: 105.0,
            scoreApplied: 100,
            contribution: 20.0,
          },
          {
            metric: "RETENTION",
            weight: 20,
            target: 80,
            achieved: 87,
            achievementPercentage: 108.75,
            scoreApplied: 100,
            contribution: 20.0,
          },
          {
            metric: "OPERATIONS",
            weight: 10,
            target: 25,
            achieved: 27.3,
            achievementPercentage: 109.2,
            scoreApplied: 100,
            contribution: 10.0,
          },
          {
            metric: "CX",
            weight: 10,
            target: 4.5,
            achieved: 4.7,
            achievementPercentage: 104.4,
            scoreApplied: 100,
            contribution: 10.0,
          },
        ],
        totalScore: 100,
        incentiveAmount: 12000,
        teamBonusEligible: true,
        teamBonusAmount: 2400, // 20% of 12000
      },
      {
        washerId: "W-002",
        washerName: "Amit Patel",
        teamName: "Team Beta",
        month: "March 2026",
        calculationStatus: "CALCULATED",
        kpiScores: [
          {
            metric: "REVENUE",
            weight: 40,
            target: 85000,
            achieved: 78500,
            achievementPercentage: 92.4,
            scoreApplied: 70,
            contribution: 28.0,
          },
          {
            metric: "CONVERSION",
            weight: 20,
            target: 40,
            achieved: 37,
            achievementPercentage: 92.5,
            scoreApplied: 70,
            contribution: 14.0,
          },
          {
            metric: "RETENTION",
            weight: 20,
            target: 80,
            achieved: 75,
            achievementPercentage: 93.75,
            scoreApplied: 70,
            contribution: 14.0,
          },
          {
            metric: "OPERATIONS",
            weight: 10,
            target: 25,
            achieved: 23.1,
            achievementPercentage: 92.4,
            scoreApplied: 70,
            contribution: 7.0,
          },
          {
            metric: "CX",
            weight: 10,
            target: 4.5,
            achieved: 4.2,
            achievementPercentage: 93.3,
            scoreApplied: 70,
            contribution: 7.0,
          },
        ],
        totalScore: 70,
        incentiveAmount: 8400,
        teamBonusEligible: false,
      },
    ];
  }

  // ============================================
  // 7️⃣ REPORTS & ANALYTICS
  // ============================================

  getAnalyticsReport(period: "DAILY" | "WEEKLY" | "MONTHLY"): AnalyticsReport {
    // In production: GET /api/om/analytics?period=
    return {
      period,
      unitsPerWasher: Array.from({ length: 15 }, (_, i) => ({
        washerName: `Washer ${i + 1}`,
        units: 22, // deterministic units
        target: 25,
        variance: -3, // deterministic variance
      })),
      washTimeAnalysis: {
        avgTime: 22.5,
        target: 20,
        variance: 2.5,
        trend: "DECLINING",
      },
      coverDistribution: {
        fairnessScore: 78,
        maxCoverAssigned: 7,
        avgCoverPerWasher: 2.3,
      },
      attendanceTrends: {
        lateCheckIns: 23,
        avgLateBy: 18,
        repeatOffenders: ["W-012", "W-034", "W-056"],
      },
      revenueTrends: {
        daily: [75000,82000,91000,88000,95000,78000,85000],  // deterministic daily revenue
        weekly: [520000,580000,610000,595000], // deterministic weekly revenue
        growth: 12.5,
      },
      lostReasons: [
        { reason: "Price", count: 8, percentage: 32 },
        { reason: "Competitor", count: 6, percentage: 24 },
        { reason: "No Interest", count: 5, percentage: 20 },
        { reason: "Timing", count: 4, percentage: 16 },
        { reason: "Other", count: 2, percentage: 8 },
      ],
    };
  }

  // ============================================
  // FIELD MODE (12:00 PM - 5:00 PM)
  // ============================================

  getFieldVisits(): any[] {
    // In production: GET /api/om/field/visits
    return [
      {
        id: "VISIT-001",
        customerName: "Raj Society",
        location: "Sector 21, Gandhinagar",
        visitType: "SOCIETY",
        scheduledTime: new Date(Date.now() + 30 * 60 * 1000),
        status: "PENDING",
      },
      {
        id: "VISIT-002",
        customerName: "Tech Corp Ltd",
        location: "GIFT City",
        visitType: "CORPORATE",
        scheduledTime: new Date(Date.now() + 90 * 60 * 1000),
        status: "PENDING",
      },
      {
        id: "VISIT-003",
        customerName: "Mr. Sharma",
        location: "Bodakdev",
        visitType: "DEMO",
        scheduledTime: new Date(Date.now() - 30 * 60 * 1000),
        status: "COMPLETED",
      },
    ];
  }

  // ============================================
  // DAY CLOSE MODE (7:00 PM+)
  // ============================================

  getDayCloseSummary(): any {
    // In production: GET /api/om/day-close/summary
    return {
      date: new Date(),
      units: {
        total: 1847.6,
        fourW: 1108.5,
        twoW: 462.0,
        addOn: 277.1,
        target: 2550,
      },
      revenue: {
        total: 285000,
        target: 350000,
      },
      attendance: {
        present: 85,
        expected: 102,
      },
      escalations: {
        resolved: 9,
        pending: 3,
      },
      incentives: {
        totalAccrued: 425000,
        washersEligible: 72,
      },
      issues: {
        complaints: 2,
        qualityIssues: 1,
      },
    };
  }

  // ============================================
  // AUDIT TRAIL
  // ============================================

  getAuditTrail(filters?: {
    startDate?: Date;
    endDate?: Date;
    actionTypes?: string[];
    actorId?: string;
  }): any[] {
    // In production: GET /api/om/audit-trail
    return [
      {
        id: "AUDIT-001",
        action: "APPROVAL",
        actor: {
          id: "OM-001",
          name: "Rajesh Kumar",
          role: "OM",
        },
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        location: {
          lat: 23.0225,
          lng: 72.5714,
          address: "OM Office, Gandhinagar",
        },
        actionTaken: "Approved attendance override for Washer W-001",
        reason: "GPS verified - stuck in traffic, genuine case",
        impactedEntity: {
          type: "Escalation",
          id: "ESC-001",
          name: "Attendance Override Request",
        },
        metadata: {
          originalCheckIn: "09:30 AM",
          approvedCheckIn: "08:00 AM",
          impactOnPayroll: "No deduction applied",
        },
      },
      {
        id: "AUDIT-002",
        action: "VISIT",
        actor: {
          id: "OM-001",
          name: "Rajesh Kumar",
          role: "OM",
        },
        timestamp: new Date(Date.now() - 120 * 60 * 1000),
        location: {
          lat: 23.0356,
          lng: 72.5661,
          address: "Tech Corp Ltd, GIFT City",
        },
        actionTaken: "Completed corporate demo visit",
        reason: "New lead conversion - 4W Daily package proposed",
        impactedEntity: {
          type: "Lead",
          id: "LEAD-002",
          name: "Tech Corp Ltd",
        },
        metadata: {
          visitDuration: "45 minutes",
          outcome: "Proposal sent",
          estimatedValue: "₹450,000",
          nextAction: "Follow-up in 3 days",
        },
      },
      {
        id: "AUDIT-003",
        action: "DISCOUNT",
        actor: {
          id: "OM-001",
          name: "Rajesh Kumar",
          role: "OM",
        },
        timestamp: new Date(Date.now() - 180 * 60 * 1000),
        actionTaken: "Applied 12% discount to Raj Society proposal",
        reason: "Bulk society deal - 45 vehicles, competitive pricing required",
        impactedEntity: {
          type: "Lead",
          id: "LEAD-001",
          name: "Raj Society",
        },
        metadata: {
          discountApplied: "12%",
          authorityLimit: "15%",
          approvalRequired: "No",
          originalValue: "₹285,000",
          discountedValue: "₹250,800",
        },
      },
      {
        id: "AUDIT-004",
        action: "REJECTION",
        actor: {
          id: "OM-001",
          name: "Rajesh Kumar",
          role: "OM",
        },
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        actionTaken: "Rejected incentive override request",
        reason: "Washer complaint was validated - incentive deduction is correct per policy",
        impactedEntity: {
          type: "Escalation",
          id: "ESC-005",
          name: "Incentive Override Request",
        },
        metadata: {
          requestedBy: "Supervisor Dinesh Mehta",
          originalIncentive: "₹3,500",
          deductionApplied: "₹1,500",
          finalIncentive: "₹2,000",
        },
      },
      {
        id: "AUDIT-005",
        action: "EOD_SIGNOFF",
        actor: {
          id: "OM-001",
          name: "Rajesh Kumar",
          role: "OM",
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        actionTaken: "Completed day close and signed off",
        impactedEntity: {
          type: "Daily Report",
          id: "REPORT-2026-04-07",
          name: "Daily Operations Summary",
        },
        metadata: {
          unitsAchieved: "1847.6",
          revenueAchieved: "₹285,000",
          attendanceRate: "83.3%",
          escalationsResolved: "9/12",
        },
      },
    ];
  }

  getTodayAuditSummary(): {
    todayActions: number;
    approvals: number;
    rejections: number;
    fieldVisits: number;
  } {
    // In production: GET /api/om/audit-trail/summary/today
    return {
      todayActions: 23,
      approvals: 12,
      rejections: 3,
      fieldVisits: 8,
    };
  }

  // ============================================
  // PRE-DAY PREVIEW
  // ============================================

  getPreDayPreview(date: Date): any {
    // In production: GET /api/om/pre-day-preview?date=
    return {
      date,
      attendance: {
        expected: 102,
        projected: 89,
        confirmed: 82,
        leavePlanned: 7,
        uncertainty: 13,
      },
      coverRequirement: {
        estimatedUnits: 325,
        coverWashersNeeded: 13,
        currentCoverPool: 10,
        shortfall: 3,
      },
      scheduledVisits: [
        {
          id: "VISIT-001",
          customerName: "Raj Society",
          location: "Sector 21, Gandhinagar",
          type: "SOCIETY",
          scheduledTime: "11:00 AM",
          priority: "HIGH",
        },
        {
          id: "VISIT-002",
          customerName: "Tech Corp Ltd",
          location: "GIFT City",
          type: "CORPORATE",
          scheduledTime: "2:30 PM",
          priority: "HIGH",
        },
        {
          id: "VISIT-003",
          customerName: "Mr. Sharma",
          location: "Bodakdev",
          type: "DEMO",
          scheduledTime: "4:00 PM",
          priority: "MEDIUM",
        },
      ],
      openEscalations: {
        critical: 2,
        high: 3,
        medium: 4,
        total: 9,
      },
      yesterdayPerformance: {
        unitsAchieved: 2234.8,
        unitsTarget: 2550,
        percentage: 87.6,
      },
    };
  }
}

// Singleton instance
export const operationsManagerService = new OperationsManagerService();