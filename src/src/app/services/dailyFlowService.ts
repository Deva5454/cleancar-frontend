/**
 * Daily Process Flow Service
 * Tracks supervisor's daily workflow from pre-day to midnight
 */

export type FlowStageStatus = "COMPLETED" | "PENDING" | "MISSED" | "UPCOMING";

export interface FlowStage {
  id: string;
  time: string;
  label: string;
  description: string;
  status: FlowStageStatus;
  isCritical: boolean;
  completedAt?: Date;
  actions: FlowAction[];
}

export interface FlowAction {
  id: string;
  label: string;
  completed: boolean;
  isMandatory: boolean;
}

export interface DailyFlowSummary {
  completedStages: number;
  totalStages: number;
  missedCritical: number;
  currentStage: string;
  overallProgress: number; // Percentage
}

class DailyFlowService {
  // ========== DAILY FLOW STAGES ==========

  getDailyFlow(supervisorId: string, currentTime: Date = new Date()): FlowStage[] {
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    const stages: FlowStage[] = [
      {
        id: "pre-day",
        time: "Night Before",
        label: "🌙 Pre-Day Preparation",
        description: "Schedule review & unit validation",
        status: this.getStageStatus("pre-day", currentTime),
        isCritical: true,
        actions: [
          { id: "schedule", label: "Review tomorrow's schedule", completed: true, isMandatory: true },
          { id: "validate", label: "Validate ≤33 units per washer", completed: true, isMandatory: true },
          { id: "cover", label: "Check cover arrangements", completed: true, isMandatory: false },
        ],
      },
      {
        id: "sup-checkin",
        time: "4:55 AM",
        label: "🌅 Supervisor Check-In",
        description: "Check-in with GPS & selfie",
        status: this.getStageStatus("sup-checkin", currentTime),
        isCritical: true,
        actions: [
          { id: "checkin", label: "Complete check-in", completed: currentHour >= 5, isMandatory: true },
          { id: "gps", label: "GPS verified", completed: currentHour >= 5, isMandatory: true },
        ],
      },
      {
        id: "attendance",
        time: "5:00 - 5:30 AM",
        label: "👥 Attendance Monitoring",
        description: "Monitor team check-ins & cover",
        status: this.getStageStatus("attendance", currentTime),
        isCritical: true,
        actions: [
          { id: "monitor", label: "Monitor all check-ins", completed: currentHour >= 6, isMandatory: true },
          { id: "cover", label: "Trigger cover if needed", completed: currentHour >= 6, isMandatory: true },
          { id: "absent", label: "Report absences", completed: currentHour >= 6, isMandatory: true },
        ],
      },
      {
        id: "morning-ops",
        time: "5:30 - 8:30 AM",
        label: "🔍 Morning Operations",
        description: "Audits, issue resolution, 7:45 checkpoint",
        status: this.getStageStatus("morning-ops", currentTime),
        isCritical: true,
        actions: [
          { id: "audits", label: "Conduct field audits (≥4)", completed: currentHour >= 8, isMandatory: true },
          { id: "issues", label: "Resolve open issues", completed: currentHour >= 8, isMandatory: true },
          { id: "checkpoint", label: "7:45 unit checkpoint", completed: currentHour >= 8, isMandatory: true },
        ],
      },
      {
        id: "band-close",
        time: "9:00 AM",
        label: "📊 Band Close & Shift 1 Report",
        description: "Close band & submit report",
        status: this.getStageStatus("band-close", currentTime),
        isCritical: true,
        actions: [
          { id: "close", label: "Close morning band", completed: currentHour >= 9, isMandatory: true },
          { id: "report", label: "Submit Shift 1 report", completed: currentHour >= 9, isMandatory: true },
        ],
      },
      {
        id: "shift2-start",
        time: "2:00 PM",
        label: "🌇 Shift 2 Start",
        description: "Afternoon shift begins",
        status: this.getStageStatus("shift2-start", currentTime),
        isCritical: false,
        actions: [
          { id: "briefing", label: "Team briefing", completed: currentHour >= 14, isMandatory: true },
        ],
      },
      {
        id: "cloth",
        time: "2:00 - 2:30 PM",
        label: "🧺 Cloth Collection & Dispatch",
        description: "Collect used cloths & dispatch",
        status: this.getStageStatus("cloth", currentTime),
        isCritical: true,
        actions: [
          { id: "collect", label: "Collect all batches", completed: currentHour >= 15, isMandatory: true },
          { id: "dispatch", label: "Dispatch for cleaning", completed: currentHour >= 15, isMandatory: true },
          { id: "issue", label: "Issue fresh batches", completed: currentHour >= 15, isMandatory: true },
        ],
      },
      {
        id: "btl-leads",
        time: "2:30 - 4:30 PM",
        label: "📍 BTL Lead Generation",
        description: "Field lead generation",
        status: this.getStageStatus("btl-leads", currentTime),
        isCritical: false,
        actions: [
          { id: "generate", label: "Generate leads", completed: currentHour >= 17, isMandatory: false },
          { id: "submit", label: "Submit to telesales", completed: currentHour >= 17, isMandatory: false },
        ],
      },
      {
        id: "review",
        time: "4:30 - 5:30 PM",
        label: "📊 Review & Planning",
        description: "Daily review & next-day planning",
        status: this.getStageStatus("review", currentTime),
        isCritical: true,
        actions: [
          { id: "kpi", label: "Review KPIs", completed: currentHour >= 18, isMandatory: true },
          { id: "plan", label: "Plan tomorrow", completed: currentHour >= 18, isMandatory: true },
        ],
      },
      {
        id: "shift2-report",
        time: "5:30 - 6:00 PM",
        label: "📝 Shift 2 Report",
        description: "End of day report",
        status: this.getStageStatus("shift2-report", currentTime),
        isCritical: true,
        actions: [
          { id: "report", label: "Submit Shift 2 report", completed: currentHour >= 18, isMandatory: true },
          { id: "handover", label: "Handover notes", completed: currentHour >= 18, isMandatory: false },
        ],
      },
      {
        id: "data-lock",
        time: "Midnight",
        label: "🌙 Data Lock",
        description: "All data locked for the day",
        status: this.getStageStatus("data-lock", currentTime),
        isCritical: false,
        actions: [
          { id: "lock", label: "Auto data lock", completed: currentHour >= 24 || currentHour < 5, isMandatory: true },
        ],
      },
    ];

    return stages;
  }

  // ========== STAGE STATUS CALCULATION ==========

  private getStageStatus(stageId: string, currentTime: Date): FlowStageStatus {
    const hour = currentTime.getHours();

    // Simplified logic based on time
    const stageTimeMap: Record<string, { start: number; end: number }> = {
      "pre-day": { start: 0, end: 5 },
      "sup-checkin": { start: 4.9, end: 5 },
      "attendance": { start: 5, end: 5.5 },
      "morning-ops": { start: 5.5, end: 8.5 },
      "band-close": { start: 9, end: 9.5 },
      "shift2-start": { start: 14, end: 14.5 },
      "cloth": { start: 14, end: 14.5 },
      "btl-leads": { start: 14.5, end: 16.5 },
      "review": { start: 16.5, end: 17.5 },
      "shift2-report": { start: 17.5, end: 18 },
      "data-lock": { start: 0, end: 5 },
    };

    const times = stageTimeMap[stageId];
    if (!times) return "PENDING";

    const currentDecimal = hour + currentTime.getMinutes() / 60;

    if (currentDecimal < times.start) {
      return "UPCOMING";
    } else if (currentDecimal >= times.start && currentDecimal <= times.end) {
      return "PENDING";
    } else if (currentDecimal > times.end) {
      // Check if it was actually completed (simplified: assume yes for now)
      return "COMPLETED";
    }

    return "PENDING";
  }

  // ========== SUMMARY ==========

  getDailyFlowSummary(supervisorId: string): DailyFlowSummary {
    const flow = this.getDailyFlow(supervisorId);

    const completedStages = flow.filter((s) => s.status === "COMPLETED").length;
    const totalStages = flow.length;
    const missedCritical = flow.filter((s) => s.status === "MISSED" && s.isCritical).length;

    const currentStage =
      flow.find((s) => s.status === "PENDING")?.label ||
      flow.find((s) => s.status === "UPCOMING")?.label ||
      "All Complete";

    const overallProgress = Math.round((completedStages / totalStages) * 100);

    return {
      completedStages,
      totalStages,
      missedCritical,
      currentStage,
      overallProgress,
    };
  }

  // ========== MARK STAGE COMPLETE ==========

  completeStage(stageId: string, supervisorId: string): { success: boolean } {
    console.log("Stage marked complete:", stageId, "by", supervisorId);
    // In production: POST /api/daily-flow/:stageId/complete
    return { success: true };
  }

  completeAction(stageId: string, actionId: string, supervisorId: string): { success: boolean } {
    console.log("Action marked complete:", stageId, actionId, "by", supervisorId);
    // In production: POST /api/daily-flow/:stageId/actions/:actionId/complete
    return { success: true };
  }
}

// Singleton instance
export const dailyFlowService = new DailyFlowService();
