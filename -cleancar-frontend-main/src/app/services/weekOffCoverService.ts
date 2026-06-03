/**
 * Week-Off & Cover Job Service
 * System-driven redistribution with progressive disclosure
 * ZERO washer control - all automatic
 */

import type {
  DayStatus,
  DayTypeInfo,
  WeekOffSchedule,
  CoverJobAssignment,
  CoverJobSummary,
  CoverJob,
  CoverNotification,
  WasherDayContext,
  CoverJobVisibilityState,
  CoverJobVisibility,
} from "../types/weekOffCover";

class WeekOffCoverService {
  // ==================== WEEK-OFF SCHEDULES (Backend-driven) ====================

  // ⚠️ In production: Load from backend API
  private weekOffSchedules: Map<string, WeekOffSchedule> = new Map([
    [
      "WASHER-001",
      {
        washerId: "WASHER-001",
        washerName: "Rajesh Kumar",
        assignedWeekOffDay: "Monday",
        isRotational: true,
        nextWeekOff: new Date("2026-04-14"), // Next Monday
        previousWeekOff: new Date("2026-04-07"),
      },
    ],
    [
      "WASHER-002",
      {
        washerId: "WASHER-002",
        washerName: "Amit Shah",
        assignedWeekOffDay: "Tuesday",
        isRotational: true,
        nextWeekOff: new Date("2026-04-15"),
      },
    ],
  ]);

  // Cover job assignments (simulated)
  private coverAssignments: CoverJobAssignment[] = [];
  private coverJobs: CoverJob[] = [];
  private notifications: CoverNotification[] = [];

  // Current state
  private currentWasherId: string = "WASHER-001";
  private checkInTime: Date | null = null;
  private baseUnitsCompleted: number = 0;

  // ==================== DAY STATUS DETECTION ====================

  getDayStatus(washerId: string, date: Date = new Date()): DayStatus {
    const schedule = this.weekOffSchedules.get(washerId);
    if (!schedule) return "WORKING";

    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });

    // Check if today is week-off day
    if (dayOfWeek === schedule.assignedWeekOffDay) {
      return "WEEK_OFF";
    }

    // Check if washer has cover jobs assigned
    const hasCoverJobs = this.coverAssignments.some(
      (a) => a.coverWasherId === washerId && this.isSameDay(new Date(a.assignedAt), date)
    );

    if (hasCoverJobs) {
      return "COVER";
    }

    return "WORKING";
  }

  getDayTypeInfo(status: DayStatus): DayTypeInfo {
    switch (status) {
      case "WORKING":
        return {
          status: "WORKING",
          message: "Today: Working Day",
          color: "bg-blue-50 text-blue-900 border-blue-200",
          icon: "✅",
          isExecutionAllowed: true,
        };
      case "WEEK_OFF":
        return {
          status: "WEEK_OFF",
          message: "Today: Week-Off",
          color: "bg-purple-50 text-purple-900 border-purple-200",
          icon: "🌙",
          isExecutionAllowed: false,
        };
      case "COVER":
        return {
          status: "COVER",
          message: "You have additional cover jobs today",
          color: "bg-teal-50 text-teal-900 border-teal-200",
          icon: "🔁",
          isExecutionAllowed: true,
        };
    }
  }

  // ==================== COVER JOB ASSIGNMENT (System-driven) ====================

  assignCoverJobs(
    originalWasherId: string,
    coverWasherId: string,
    jobIds: string[],
    reason: "WEEK_OFF" | "LEAVE" | "ABSENCE"
  ): void {
    const originalSchedule = this.weekOffSchedules.get(originalWasherId);
    const coverSchedule = this.weekOffSchedules.get(coverWasherId);

    if (!originalSchedule || !coverSchedule) {
      console.error("Washer schedules not found");
      return;
    }

    // Create cover assignments
    jobIds.forEach((jobId) => {
      const assignment: CoverJobAssignment = {
        id: `COVER-${Date.now()}-${0.75}`,
        originalWasherId,
        originalWasherName: originalSchedule.washerName,
        coverWasherId,
        coverWasherName: coverSchedule.washerName,
        jobId,
        assignedAt: new Date(),
        reason,
        isRevealed: false, // Start hidden
      };

      this.coverAssignments.push(assignment);
    });

    // Create notification
    const notification: CoverNotification = {
      id: `NOTIF-${Date.now()}`,
      washerId: coverWasherId,
      washerName: coverSchedule.washerName,
      coverJobCount: jobIds.length,
      assignedAt: new Date(),
      isRead: false,
      message: `You have been assigned ${jobIds.length} cover job${jobIds.length > 1 ? "s" : ""} for today`,
    };

    this.notifications.push(notification);
  }

  // ==================== PROGRESSIVE DISCLOSURE ====================

  getCoverJobVisibility(washerId: string): CoverJobVisibility {
    const hasCoverJobs = this.coverAssignments.some((a) => a.coverWasherId === washerId);

    // State 1: Not checked in
    if (!this.checkInTime) {
      return {
        state: "NOT_CHECKED_IN",
        message: "Check in to see your schedule",
        showCount: false,
        showDetails: false,
      };
    }

    // State 2: Checked in but before 5:15 AM
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const isBefore515 = currentHour < 5 || (currentHour === 5 && currentMinute < 15);

    if (isBefore515) {
      return {
        state: "CHECKED_IN_EARLY",
        message: "Additional jobs will be assigned shortly",
        showCount: false,
        showDetails: false,
      };
    }

    // State 3: No cover jobs assigned
    if (!hasCoverJobs) {
      return {
        state: "NO_COVER",
        message: "No additional jobs assigned today",
        showCount: false,
        showDetails: false,
      };
    }

    // State 4: Cover assigned but base not complete
    if (this.baseUnitsCompleted < 25) {
      const count = this.coverAssignments.filter((a) => a.coverWasherId === washerId).length;
      return {
        state: "ASSIGNED_LOCKED",
        message: `+${count} Cover Units Assigned`,
        showCount: true,
        showDetails: false,
      };
    }

    // State 5: Base complete - unlock details
    return {
      state: "UNLOCKED",
      message: "Cover jobs unlocked",
      showCount: true,
      showDetails: true,
    };
  }

  getCoverJobSummary(washerId: string): CoverJobSummary | null {
    const assignments = this.coverAssignments.filter((a) => a.coverWasherId === washerId);

    if (assignments.length === 0) return null;

    const fromWashers = Array.from(new Set(assignments.map((a) => a.originalWasherName)));

    return {
      totalCoverUnits: assignments.length,
      fromWashers,
      message: `+${assignments.length} Cover Units Assigned`,
      isLocked: this.baseUnitsCompleted < 25,
    };
  }

  getCoverJobs(washerId: string): CoverJob[] {
    // Only return if base complete
    if (this.baseUnitsCompleted < 25) return [];

    const assignments = this.coverAssignments.filter((a) => a.coverWasherId === washerId);

    // In real app: fetch full job details from backend
    return assignments.map((assignment) => ({
      id: assignment.id,
      jobId: assignment.jobId,
      isCoverJob: true,
      originalWasher: assignment.originalWasherName,
      coverReason: assignment.reason,

      // Mock job details
      timeSlot: "07:00 - 07:30",
      customerFirstName: "Cover Customer",
      area: "Adajan",
      pinCode: "395009",
      city: "Surat",
      addressLine1: "B-204, Cover Address",
      vehicleCategory: "Mid-Size Sedan",
      vehicleColor: "White",
      vehicleBrand: "Honda",
      vehicleRegistration: "GJ-05-XX-0000",
      packageName: "Standard Wash",
      packageType: "Standard",
      status: "Assigned",
      specialNotes: `Cover job from ${assignment.originalWasherName} (${assignment.reason})`,
    }));
  }

  // ==================== WASHER DAY CONTEXT (Complete state) ====================

  getWasherDayContext(washerId: string): WasherDayContext {
    const today = new Date();
    const dayStatus = this.getDayStatus(washerId, today);
    const dayInfo = this.getDayTypeInfo(dayStatus);
    const weekOffSchedule = this.weekOffSchedules.get(washerId)!;

    const hasCoverJobs = this.coverAssignments.some((a) => a.coverWasherId === washerId);
    const coverSummary = this.getCoverJobSummary(washerId);
    const coverJobs = this.getCoverJobs(washerId);

    const isBaseComplete = this.baseUnitsCompleted >= 25;
    const canSeeCoverDetails = isBaseComplete && hasCoverJobs;

    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const isCoverAssignmentTime = currentHour > 5 || (currentHour === 5 && currentMinute >= 15);

    // Calculate total units (including cover jobs if unlocked)
    const baseUnitsToday = this.baseUnitsCompleted;
    const coverUnitsToday = canSeeCoverDetails ? coverJobs.length : 0;
    const totalUnitsToday = baseUnitsToday + coverUnitsToday;

    return {
      washerId,
      washerName: weekOffSchedule.washerName,
      today,

      dayStatus,
      dayInfo,

      weekOffSchedule,

      hasCoverJobs,
      coverSummary,
      coverJobs,

      baseUnitsCompleted: this.baseUnitsCompleted,
      baseQuota: 25,
      isBaseComplete,
      canSeeCoverDetails,

      isCheckedIn: this.checkInTime !== null,
      checkInTime: this.checkInTime,
      isCoverAssignmentTime,

      totalUnitsToday,
      maxDailyLimit: 33,
      isAtLimit: totalUnitsToday >= 33,
    };
  }

  // ==================== CHECK-IN / BASE COMPLETION ====================

  checkIn(washerId: string): void {
    this.checkInTime = new Date();
    this.currentWasherId = washerId;

    // Simulate cover assignment after 5:15 AM
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    if (currentHour > 5 || (currentHour === 5 && currentMinute >= 15)) {
      // Auto-assign cover jobs (in real app: backend does this)
      // For demo: assign 3 cover jobs
      this.assignCoverJobs("WASHER-002", washerId, ["JOB-C1", "JOB-C2", "JOB-C3"], "WEEK_OFF");
    }
  }

  completeBaseUnit(): void {
    this.baseUnitsCompleted++;

    // Trigger unlock notification at base completion
    if (this.baseUnitsCompleted === 25) {
      const hasCoverJobs = this.coverAssignments.some((a) => a.coverWasherId === this.currentWasherId);
      if (hasCoverJobs) {
        // Reveal cover jobs
        this.coverAssignments.forEach((a) => {
          if (a.coverWasherId === this.currentWasherId) {
            a.isRevealed = true;
          }
        });
      }
    }
  }

  // ==================== NOTIFICATIONS ====================

  getUnreadNotifications(washerId: string): CoverNotification[] {
    return this.notifications.filter((n) => n.washerId === washerId && !n.isRead);
  }

  markNotificationRead(notificationId: string): void {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  // ==================== UTILITIES ====================

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  // ==================== RESET (For testing) ====================

  reset(): void {
    this.coverAssignments = [];
    this.coverJobs = [];
    this.notifications = [];
    this.checkInTime = null;
    this.baseUnitsCompleted = 0;
  }
}

// Singleton instance
export const weekOffCoverService = new WeekOffCoverService();
