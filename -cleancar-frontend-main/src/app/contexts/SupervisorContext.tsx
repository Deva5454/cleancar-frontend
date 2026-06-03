/**
 * Supervisor Context - Centralized State Management
 * Provides global state for supervisor operations
 *
 * REFACTORED: Uses currentUser.employeeId from RoleContext instead of hardcoded SUP-001
 * PHASE 3: Uses useEmployeeData (single source of truth) for employee and attendance data
 */

import { createContext, useContext, useState, useEffect, ReactNode, useMemo} from "react";
import { useRole } from "./RoleContext";
import { useEmployeeData } from "../hooks/useEmployeeData";
import { useEvents, useEventListener } from "./EventSystem";
import { useJobs } from "./JobContext";
import { supervisorDataService } from "../services/supervisorDataService";
import type {
  WasherTeamMember,
  TeamSummary,
  SupervisorAlert,
  AuditTask,
  AuditSubmission,
  ClothBatch,
  BTLLead,
  SupervisorIncentive,
  IssueTicket,
  ScheduleEntry,
} from "../services/supervisorDataService";

// ========== CONTEXT TYPE ==========

interface SupervisorContextType {
  // Summary
  summary: TeamSummary;
  
  // Team
  team: WasherTeamMember[];
  
  // Alerts
  alerts: SupervisorAlert[];
  unreadAlertsCount: number;
  
  // Audits
  auditTasks: AuditTask[];
  
  // Cloth
  clothBatches: ClothBatch[];
  
  // Schedule
  schedule: ScheduleEntry[];
  
  // Leads
  leads: BTLLead[];
  
  // Incentive
  incentive: SupervisorIncentive;
  
  // Issues
  issues: IssueTicket[];
  
  // Actions
  markAlertRead: (alertId: string) => void;
  submitAudit: (submission: AuditSubmission) => Promise<{ success: boolean }>;
  issueNewBatch: (washerId: string) => Promise<{ success: boolean; batchId?: string }>;
  collectBatch: (batchId: string) => Promise<{ success: boolean }>;
  reassignJob: (jobId: string, from: string, to: string) => Promise<{ success: boolean }>;
  submitLead: (lead: Omit<BTLLead, "id" | "captureDate">) => Promise<{ success: boolean }>;
  submitIssue: (issue: Omit<IssueTicket, "id" | "reportedAt">) => Promise<{ success: boolean }>;
  resolveIssue: (issueId: string, resolution: string) => Promise<{ success: boolean }>;
  escalateIssue: (issueId: string, toManagerId: string) => Promise<{ success: boolean }>;
  refreshData: () => void;
  
  // Shift context
  currentShift: 1 | 2;
  shiftFocusAreas: string[];
  
  // Loading
  isLoading: boolean;
  error: string | null;
}

const SupervisorContext = createContext<SupervisorContextType | undefined>(undefined);

// ========== PROVIDER ==========

interface SupervisorProviderProps {
  children: ReactNode;
}

export function SupervisorProvider({ children }: SupervisorProviderProps) {
  // CRITICAL: Get supervisorId from logged-in user instead of hardcoded value
  const { currentUser, currentRole } = useRole();

  // PHASE 3: Get team members from useEmployeeData (single source of truth)
  // IMPORTANT: All hooks must be called BEFORE any conditional returns (Rules of Hooks)
  const { employees, attendanceRecords } = useEmployeeData();
  const { emit } = useEvents();
  const { getAssignedByCity, getCompletedByCity, getUnassignedByCity } = useJobs();

  // State - ALL useState hooks must be declared before any conditional returns
  const [summary, setSummary] = useState<TeamSummary>({
    totalWashers: 0,
    checkedIn: 0,
    late: 0,
    notYet: 0,
    onLeave: 0,
    completedJobs: 0,
    pendingJobs: 0,
  });
  const [team, setTeam] = useState<WasherTeamMember[]>([]);
  const [alerts, setAlerts] = useState<SupervisorAlert[]>([]);
  const [auditTasks, setAuditTasks] = useState<AuditTask[]>([]);
  const [clothBatches, setClothBatches] = useState<ClothBatch[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [leads, setLeads] = useState<BTLLead[]>([]);
  const [incentive, setIncentive] = useState<SupervisorIncentive>({
    currentMonth: { earned: 0, projected: 0, qualificationRate: 0, kpis: [] },
    recentMonths: [],
    rankingPosition: 0,
    totalSupervisors: 0,
  });
  const [issues, setIssues] = useState<IssueTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // VALIDATION: Only activate for Supervisor role
  const isSupervisorRole = currentRole === "Supervisor";
  const supervisorId = currentUser?.employeeId || "";
  const hasValidSetup = isSupervisorRole && supervisorId;

  // Derived state
  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;
  const shiftContext = supervisorDataService.getShiftContext();
  const currentShift = shiftContext.shift;
  const shiftFocusAreas = shiftContext.focusAreas;

  // ========== LOAD DATA ==========

  const loadData = () => {
    if (!hasValidSetup) return;
    try {
      setIsLoading(true);
      setError(null);

      // ========== TEAM DATA FROM EMPLOYEECONTEXT (SINGLE SOURCE OF TRUTH) ==========
      // NO mock data - all team members derived from EmployeeContext
      // Real-time updates when HR adds/modifies employees
      // Filter by: (1) washer roles, (2) active status, (3) matching pincodes
      const supervisorPincodes = currentUser.assignedPincodes || [];
      const teamMembers = employees
        .filter(emp => {
          const isWasher = emp.role === "Car Washer Full Time" || emp.role === "Car Washer Part Time";
          const isActive = emp.status === "Active";
          const hasMatchingPincode = supervisorPincodes.length === 0 ||
            supervisorPincodes.some(pincode => emp.assignedPincodes?.includes(pincode));

          return isWasher && isActive && hasMatchingPincode;
        })
        .map(emp => {
          // Get today's attendance for this employee
          const today = new Date().toISOString().split('T')[0];
          const todayAttendance = attendanceRecords.find(
            a => a.employeeId === emp.employeeId && a.date === today
          );

          return {
            id: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`,
            phone: emp.phone,
            status: todayAttendance
              ? (todayAttendance.status === "Late" ? "LATE" : "CHECKED_IN")
              : "NOT_YET",
            checkInTime: todayAttendance?.checkInTime || null,
            location: emp.assignedPincodes?.[0] || "Unknown",
            todayJobs: 0, // Can be calculated from JobContext
            completedJobs: 0, // Can be calculated from JobContext
            isOnLeave: emp.status === "On Leave",
          } as WasherTeamMember;
        });

      setTeam(teamMembers);

      // Log team info for debugging
      if (import.meta.env.DEV) {
        console.log(`[SupervisorContext] Team loaded: ${teamMembers.length} washers`);
        if (teamMembers.length === 0) {
          console.warn(
            `[SupervisorContext] No team members found. ` +
            `Supervisor pincodes: ${supervisorPincodes.join(", ") || "none"}`
          );
        }
      }

      // Calculate summary from real team data (derived from EmployeeContext)
      // Get supervisor's city
      const supervisorCityId = currentUser.cityId || "CITY-SURAT";

      const summary: TeamSummary = {
        totalWashers: teamMembers.length,
        checkedIn: teamMembers.filter(m => m.status === "CHECKED_IN" || m.status === "LATE").length,
        late: teamMembers.filter(m => m.status === "LATE").length,
        notYet: teamMembers.filter(m => m.status === "NOT_YET").length,
        onLeave: teamMembers.filter(m => m.isOnLeave).length,
        todayJobs:     getAssignedByCity(supervisorCityId).filter(j =>
                         j.scheduledDate === new Date().toISOString().split("T")[0]).length,
        completedJobs: getCompletedByCity(supervisorCityId).filter(j =>
                         j.completedAt?.startsWith(new Date().toISOString().split("T")[0])).length,
        pendingJobs: getUnassignedByCity(supervisorCityId).filter(j =>
          j.scheduledDate === new Date().toISOString().split("T")[0]).length,
      };
      setSummary(summary);

      // Load other data from service (these are still mock, but team is real)
      setAlerts(supervisorDataService.getAlerts(supervisorId));
      setAuditTasks(supervisorDataService.getAuditTasks(supervisorId));
      setClothBatches(supervisorDataService.getClothBatches(supervisorId));
      setSchedule(supervisorDataService.getTeamSchedule(supervisorId));
      setLeads(supervisorDataService.getBTLLeads(supervisorId));
      setIncentive(supervisorDataService.getIncentiveData(supervisorId));
      setIssues(supervisorDataService.getIssues(supervisorId));

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load supervisor data");
      setIsLoading(false);
    }
  };

  // Load on mount and when supervisorId, employees, or attendance changes
  useEffect(() => {
    if (hasValidSetup) {
      loadData();
    } else {
      // No valid supervisor session — resolve loading immediately so the UI
      // shows an empty/role-check state instead of an infinite spinner.
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValidSetup, supervisorId]);
  // Removed `employees` and `attendanceRecords` from deps — those are full arrays
  // that change on every employee edit anywhere in the app. supervisorId is stable
  // and hasValidSetup covers the meaningful initialization condition.

  // Auto-refresh every 30 seconds for real-time feel
  useEffect(() => {
    if (!hasValidSetup) return;

    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, [hasValidSetup]);

  // Real-time team updates via events
  useEventListener("EMPLOYEE_CREATED", () => {
    console.log("[SupervisorContext] Employee created - refreshing team");
    loadData();
  });

  useEventListener("EMPLOYEE_UPDATED", () => {
    console.log("[SupervisorContext] Employee updated - refreshing team");
    loadData();
  });

  useEventListener("ATTENDANCE_CHECKED_IN", () => {
    console.log("[SupervisorContext] Attendance check-in - refreshing team status");
    loadData();
  });

  useEventListener("ATTENDANCE_CHECKED_OUT", () => {
    console.log("[SupervisorContext] Attendance check-out - refreshing team status");
    loadData();
  });

  // ========== ACTIONS ==========

  const markAlertRead = (alertId: string) => {
    supervisorDataService.markAlertRead(alertId);
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  const submitAudit = async (submission: AuditSubmission) => {
    const result = supervisorDataService.submitAudit(submission);
    if (result.success) {
      loadData(); // Refresh audit tasks
    }
    return result;
  };

  const issueNewBatch = async (washerId: string) => {
    const result = supervisorDataService.issueNewBatch(washerId);
    if (result.success) {
      loadData(); // Refresh cloth batches
    }
    return result;
  };

  const collectBatch = async (batchId: string) => {
    const result = supervisorDataService.collectBatch(batchId);
    if (result.success) {
      loadData(); // Refresh cloth batches
    }
    return result;
  };

  const reassignJob = async (jobId: string, from: string, to: string) => {
    const result = supervisorDataService.reassignJob(jobId, from, to);
    if (result.success) {
      loadData(); // Refresh schedule
    }
    return result;
  };

  const submitLead = async (lead: Omit<BTLLead, "id" | "captureDate">) => {
    const result = supervisorDataService.submitLead(lead);
    if (result.success) {
      loadData(); // Refresh leads
    }
    return result;
  };

  const submitIssue = async (issue: Omit<IssueTicket, "id" | "reportedAt">) => {
    const result = supervisorDataService.submitIssue(issue);
    if (result.success) {
      loadData(); // Refresh issues
    }
    return result;
  };

  const resolveIssue = async (issueId: string, resolution: string) => {
    const result = supervisorDataService.resolveIssue(issueId, resolution);
    if (result.success) {
      loadData(); // Refresh issues
    }
    return result;
  };

  const escalateIssue = async (issueId: string, toManagerId: string) => {
    const result = supervisorDataService.escalateIssue(issueId, toManagerId);
    if (result.success) {
      loadData(); // Refresh issues
    }
    return result;
  };

  const refreshData = () => {
    loadData();
  };

  // ========== CONTEXT VALUE ==========

  const contextValue: SupervisorContextType = useMemo(() => ({
    summary,
    team,
    alerts,
    unreadAlertsCount,
    auditTasks,
    clothBatches,
    schedule,
    leads,
    incentive,
    issues,
    markAlertRead,
    submitAudit,
    issueNewBatch,
    collectBatch,
    reassignJob,
    submitLead,
    submitIssue,
    resolveIssue,
    escalateIssue,
    refreshData,
    currentShift,
    shiftFocusAreas,
    isLoading,
    error,
  }),
  [summary, team, alerts, unreadAlertsCount, auditTasks, clothBatches, schedule, leads, incentive, issues]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SupervisorContext.Provider value={contextValue}>
      {children}
    </SupervisorContext.Provider>
  );
}

// ========== HOOK ==========

export function useSupervisor() {
  const context = useContext(SupervisorContext);
  if (context === undefined) {
    throw new Error(
      "useSupervisor must be used within a SupervisorProvider. " +
      "Make sure: (1) You're logged in as a 'Supervisor' role, and (2) The component is wrapped with AppProvider."
    );
  }
  return context;
}

// ========== HELPER HOOKS ==========

export function useSupervisorAlerts() {
  const { alerts, unreadAlertsCount, markAlertRead } = useSupervisor();
  
  return {
    allAlerts: alerts,
    unreadAlerts: alerts.filter(a => !a.isRead),
    criticalAlerts: alerts.filter(a => a.priority === "CRITICAL"),
    unreadCount: unreadAlertsCount,
    markRead: markAlertRead,
  };
}

export function useSupervisorTeam() {
  const { team, summary } = useSupervisor();
  
  return {
    team,
    checkedIn: team.filter(m => m.status === "CHECKED_IN"),
    late: team.filter(m => m.status === "LATE"),
    notYet: team.filter(m => m.status === "NOT_YET"),
    onLeave: team.filter(m => m.isOnLeave || m.status === "WEEK_OFF"),
    summary,
  };
}
