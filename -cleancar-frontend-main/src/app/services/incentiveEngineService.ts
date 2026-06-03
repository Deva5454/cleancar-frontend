/**
 * Incentive Engine Service
 * System-controlled earnings calculation
 * ZERO washer manipulation allowed
 */

import type {
  IncentiveConfig,
  WasherProgress,
  IncentiveEligibilityStatus,
  TimeBand,
  AddOnService,
  IncentiveTrackerState,
  EarningsBreakdown,
  IncentiveValidation,
} from "../types/incentiveEngine";

class IncentiveEngineService {
  // Configuration (loaded from backend, NOT hardcoded)
  // ⚠️ WARNING: These are DEFAULT VALUES ONLY for demo purposes
  // In production: ALL values MUST come from backend API
  private config: IncentiveConfig = {
    baseQuota: 25, // ⚠️ From backend API
    maxDailyLimit: 33, // ⚠️ From backend API
    incentivePerUnit: 50, // ⚠️ From backend API - ₹50 per unit after base
    timeBands: [
      // ⚠️ From backend API
      {
        id: "BAND-1",
        name: "Morning Shift",
        startTime: "06:00",
        endTime: "12:00",
        isActive: true,
      },
      {
        id: "BAND-2",
        name: "Evening Shift",
        startTime: "16:00",
        endTime: "20:00",
        isActive: true,
      },
    ],
    addOnRates: {
      // ⚠️ From backend API
      INTERIOR_VACUUM: 30,
      ENGINE_CLEANING: 50,
      UNDERBODY_WASH: 40,
    },
    monthlyBaseTarget: 750, // ⚠️ From backend API - 25/day × 30-day window
    avgWorkingDaysPerMonth: 30, // 30-day rolling subscription window (not calendar 26-day)
  };

  // W2 FIX: per-washer progress map — prevents shared state across washer sessions
  private progressMap: Map<string, WasherProgress> = new Map();
  private currentWasherId: string = "";

  private getProgress_internal(washerId?: string): WasherProgress {
    const id = washerId || this.currentWasherId || "WASHER-UNKNOWN";
    if (!this.progressMap.has(id)) {
      this.progressMap.set(id, this.createEmptyProgress());
    }
    return this.progressMap.get(id)!;
  }

  private createEmptyProgress(): WasherProgress {
    return {
    baseUnitsCompleted: 0,
    baseUnitsTarget: 25,
    isBaseComplete: false,
    incentiveUnitsCompleted: 0,
    incentiveUnitsInBand: 0,
    incentiveUnitsOutOfBand: 0,
    addOnsCompleted: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    monthlyEarnings: 0,
    baseEarnings: 0,
    incentiveEarnings: 0,
    addOnEarnings: 0,
    eligibilityStatus: "NOT_ELIGIBLE",
    isInTimeBand: false,
    currentTimeBand: null,
    timeBandStatus: "CLOSED",
    totalUnitsToday: 0,
    maxDailyLimit: 33,
    isNearLimit: false,
    isAtLimit: false,
    unitsUntilLimit: 33,
    unitsOutsideBand: 0,
    isLateCheckIn: false,
    isWeekOff: false,
    isCoverDay: false,
    };
  }

  // Set active washer for this session
  setWasherId(washerId: string): void {
    this.currentWasherId = washerId;
    if (!this.progressMap.has(washerId)) {
      this.progressMap.set(washerId, this.createEmptyProgress());
    }
  }

  private animationTriggers = {
    shouldAnimateUnlock: false,
    shouldAnimateEarning: false,
    lastEarningAmount: 0,
  };

  private eventLogs: any[] = [];

  // ==================== CONFIGURATION (Backend-driven) ====================

  loadConfig(config: Partial<IncentiveConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): IncentiveConfig {
    return { ...this.config };
  }

  // ==================== TIME BAND VALIDATION ====================

  private isInTimeBand(): { inBand: boolean; currentBand: TimeBand | null } {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    for (const band of this.config.timeBands) {
      if (!band.isActive) continue;

      if (currentTime >= band.startTime && currentTime <= band.endTime) {
        return { inBand: true, currentBand: band };
      }
    }

    return { inBand: false, currentBand: null };
  }

  // ==================== EDGE CASE SETTERS ====================

  setLateCheckIn(isLate: boolean, reason?: string): void {
    this.progress.isLateCheckIn = isLate;
    if (isLate) {
      this.progress.eligibilityStatus = "LATE_PENALTY";
      this.progress.penaltyReason = reason;
      this.logEvent("LATE_PENALTY", reason || "Late check-in penalty applied", 0);
    }
  }

  setWeekOff(isWeekOff: boolean): void {
    this.progress.isWeekOff = isWeekOff;
    if (isWeekOff) {
      this.progress.eligibilityStatus = "WEEK_OFF";
      this.logEvent("WEEK_OFF", "Week-off day - no incentives", 0);
    }
  }

  setCoverDay(isCover: boolean): void {
    this.progress.isCoverDay = isCover;
    if (isCover) {
      this.progress.eligibilityStatus = "COVER_DAY";
      this.logEvent("COVER_DAY", "Cover day - incentives after base completion", 0);
    }
  }

  // ==================== UNIT COMPLETION (System-triggered) ====================

  completeUnit(jobId: string): {
    success: boolean;
    earningsAdded: number;
    message: string;
    newStatus: WasherProgress;
  } {
    const p = this.getProgress_internal();
    // Check if at max limit
    if (p.totalUnitsToday >= this.config.maxDailyLimit) {
      return {
        success: false,
        earningsAdded: 0,
        message: "❌ Daily limit reached. No more jobs available.",
        newStatus: { ...this.progress },
      };
    }

    // Check edge cases that block earnings
    if (this.progress.isWeekOff) {
      return {
        success: false,
        earningsAdded: 0,
        message: "❌ No work allowed on week-off",
        newStatus: { ...this.progress },
      };
    }

    if (this.progress.isLateCheckIn) {
      // Late check-in blocks incentives but allows base work
      this.progress.totalUnitsToday++;
      this.progress.baseUnitsCompleted++;
      this.updateLimits();

      return {
        success: true,
        earningsAdded: 0,
        message: "⚠️ Unit counted - Incentives disabled due to late check-in",
        newStatus: { ...this.progress },
      };
    }

    const bandStatus = this.isInTimeBand();
    this.progress.timeBandStatus = bandStatus.inBand ? "ACTIVE" : "CLOSED";

    // Check if base is complete
    if (!this.progress.isBaseComplete) {
      this.progress.baseUnitsCompleted++;
      this.progress.totalUnitsToday++;
      this.updateLimits();

      if (this.progress.baseUnitsCompleted >= this.config.baseQuota) {
        this.progress.isBaseComplete = true;
        this.progress.eligibilityStatus = bandStatus.inBand ? "ELIGIBLE" : "OUTSIDE_BAND";
        this.animationTriggers.shouldAnimateUnlock = true;

        this.logEvent("BASE_COMPLETE", "Base quota reached. Incentives unlocked.", 0);

        return {
          success: true,
          earningsAdded: 0,
          message: "🎉 Base quota complete! Incentives now active.",
          newStatus: { ...this.progress },
        };
      }

      return {
        success: true,
        earningsAdded: 0,
        message: `Base unit ${this.progress.baseUnitsCompleted}/${this.config.baseQuota} completed`,
        newStatus: { ...this.progress },
      };
    }

    // After base - incentive units
    this.progress.incentiveUnitsCompleted++;
    this.progress.totalUnitsToday++;
    this.updateLimits();

    // Check if in earning band
    if (bandStatus.inBand) {
      const earning = this.config.incentivePerUnit;
      this.progress.incentiveUnitsInBand++;
      this.progress.incentiveEarnings += earning;
      this.progress.totalEarnings += earning;
      this.progress.todayEarnings += earning;
      this.progress.monthlyEarnings += earning;
      this.progress.eligibilityStatus = this.progress.isCoverDay ? "COVER_DAY" : "ELIGIBLE";
      this.progress.currentTimeBand = bandStatus.currentBand;

      this.animationTriggers.shouldAnimateEarning = true;
      this.animationTriggers.lastEarningAmount = earning;

      this.logEvent("INCENTIVE_UNIT", `Unit completed in ${bandStatus.currentBand?.name}`, earning);

      return {
        success: true,
        earningsAdded: earning,
        message: `✅ Earned ₹${earning}`,
        newStatus: { ...this.progress },
      };
    } else {
      // Outside band - unit counted but no earnings
      this.progress.incentiveUnitsOutOfBand++;
      this.progress.unitsOutsideBand++;
      this.progress.eligibilityStatus = "OUTSIDE_BAND";
      this.progress.currentTimeBand = null;

      this.logEvent("UNIT_OUTSIDE_BAND", "Unit completed outside earning window", 0);

      return {
        success: true,
        earningsAdded: 0,
        message: "⚠️ Completed outside earning window",
        newStatus: { ...this.progress },
      };
    }
  }

  private updateLimits(): void {
    this.progress.maxDailyLimit = this.config.maxDailyLimit;
    this.progress.unitsUntilLimit = this.config.maxDailyLimit - this.progress.totalUnitsToday;
    this.progress.isNearLimit = this.progress.totalUnitsToday >= this.config.maxDailyLimit * 0.8;
    this.progress.isAtLimit = this.progress.totalUnitsToday >= this.config.maxDailyLimit;
  }

  // ==================== ADD-ON HANDLING (System-assigned ONLY) ====================

  assignAddOn(
    jobId: string,
    serviceCode: string,
    serviceName: string,
    assignedBy: "SYSTEM" | "TELECALLER" | "ADMIN" | "SUPERVISOR",
    reason: string
  ): AddOnService {
    const addOn: AddOnService = {
      id: `ADDON-${Date.now()}`,
      serviceCode,
      serviceName,
      description: `Add-on service: ${serviceName}`,
      isAssigned: true,
      assignedBy,
      assignedAt: new Date().toISOString(),
      assignmentReason: reason,
      isCompleted: false,
      earningAmount: this.config.addOnRates[serviceCode] || 0,
      isEarningEligible: this.progress.isBaseComplete,
      badge: "Add-on Service",
      color: "purple",
    };

    this.logEvent("ADD_ON_ASSIGNED", `${serviceName} assigned by ${assignedBy}`, 0);

    return addOn;
  }

  completeAddOn(addOn: AddOnService): {
    success: boolean;
    earningsAdded: number;
    message: string;
  } {
    if (addOn.isCompleted) {
      return { success: false, earningsAdded: 0, message: "Add-on already completed" };
    }

    addOn.isCompleted = true;
    addOn.completedAt = new Date().toISOString();

    this.progress.addOnsCompleted++;

    // Check if eligible for earnings
    if (
      this.progress.isBaseComplete &&
      this.isInTimeBand().inBand &&
      !this.progress.isLateCheckIn &&
      !this.progress.isWeekOff
    ) {
      const earning = addOn.earningAmount;
      this.progress.addOnEarnings += earning;
      this.progress.totalEarnings += earning;
      this.progress.todayEarnings += earning;
      this.progress.monthlyEarnings += earning;

      this.logEvent("ADD_ON_COMPLETED", `${addOn.serviceName} completed`, earning);

      return {
        success: true,
        earningsAdded: earning,
        message: `✅ Add-on completed. Earned ₹${earning}`,
      };
    } else {
      this.logEvent("ADD_ON_COMPLETED", `${addOn.serviceName} completed (no earnings)`, 0);

      let message = "⚠️ Add-on completed (no earnings)";
      if (!this.progress.isBaseComplete) {
        message = "⚠️ Add-on completed (earnings start after base)";
      } else if (!this.isInTimeBand().inBand) {
        message = "⚠️ Add-on completed outside earning window";
      } else if (this.progress.isLateCheckIn) {
        message = "⚠️ Add-on completed (incentives disabled due to late check-in)";
      } else if (this.progress.isWeekOff) {
        message = "⚠️ Add-on completed (no earnings on week-off)";
      }

      return {
        success: true,
        earningsAdded: 0,
        message,
      };
    }
  }

  // ==================== PROGRESS TRACKING ====================

  getProgress(): WasherProgress {
    return { ...this.progress };
  }

  getTrackerState(): IncentiveTrackerState {
    const progressPercent = Math.min(
      (this.progress.baseUnitsCompleted / this.config.baseQuota) * 100,
      100
    );

    let progressMessage = "";
    if (!this.progress.isBaseComplete) {
      const remaining = this.config.baseQuota - this.progress.baseUnitsCompleted;
      progressMessage = `Complete ${remaining} more to unlock incentives`;
    } else {
      progressMessage = "Incentives unlocked ✅";
    }

    // Eligibility Badge
    let eligibilityBadge = {
      text: "Not Eligible",
      color: "bg-gray-500",
      icon: "❌",
    };

    if (this.progress.eligibilityStatus === "ELIGIBLE") {
      eligibilityBadge = { text: "Eligible", color: "bg-green-600", icon: "✅" };
    } else if (this.progress.eligibilityStatus === "OUTSIDE_BAND") {
      eligibilityBadge = { text: "Outside Band", color: "bg-amber-600", icon: "⏱" };
    } else if (this.progress.eligibilityStatus === "LATE_PENALTY") {
      eligibilityBadge = { text: "Not Eligible (Late)", color: "bg-red-600", icon: "🚫" };
    } else if (this.progress.eligibilityStatus === "WEEK_OFF") {
      eligibilityBadge = { text: "Week-off", color: "bg-purple-600", icon: "📅" };
    } else if (this.progress.eligibilityStatus === "COVER_DAY") {
      eligibilityBadge = { text: "Cover Day", color: "bg-blue-600", icon: "🔄" };
    }

    // Time Band Indicator
    const bandStatus = this.isInTimeBand();
    const timeBandIndicator = {
      status: bandStatus.inBand ? ("ACTIVE" as const) : ("CLOSED" as const),
      color: bandStatus.inBand ? "bg-green-500" : "bg-gray-400",
      icon: bandStatus.inBand ? "🟢" : "⚪",
      message: bandStatus.inBand ? "Earnings active" : "Outside earning window",
    };

    // Display Messages
    const displayMessages: any = {};

    if (!this.progress.isBaseComplete && !this.progress.isWeekOff && !this.progress.isLateCheckIn) {
      displayMessages.belowBase = "Earnings start after base completion";
    }

    if (this.progress.isWeekOff) {
      displayMessages.weekOff = "No incentives on week-off";
    }

    if (this.progress.isLateCheckIn) {
      displayMessages.latePenalty = this.progress.penaltyReason || "Incentives disabled due to late check-in";
    }

    if (this.progress.isCoverDay && this.progress.isBaseComplete) {
      displayMessages.coverDay = "Cover work eligible for incentives after base completion";
    }

    if (this.progress.eligibilityStatus === "OUTSIDE_BAND" && this.progress.isBaseComplete) {
      displayMessages.outsideBand = "Completed outside earning window";
    }

    if (this.progress.eligibilityStatus === "ELIGIBLE" && !this.progress.isLateCheckIn) {
      displayMessages.eligible = "Earning per unit completed";
    }

    if (this.progress.isNearLimit && !this.progress.isAtLimit) {
      displayMessages.nearLimit = `Maximum daily limit approaching (${this.progress.unitsUntilLimit} remaining)`;
    }

    if (this.progress.isAtLimit) {
      displayMessages.atLimit = "Daily limit reached. No more jobs available.";
    }

    // Monthly Potential (Dynamic Calculation)
    const avgIncentiveUnitsPerDay = this.progress.isBaseComplete
      ? this.progress.incentiveUnitsInBand / 1
      : 0; // Simple estimate
    const monthlyPotential = {
      estimated: Math.round(avgIncentiveUnitsPerDay * this.config.avgWorkingDaysPerMonth * this.config.incentivePerUnit),
      isRealistic: avgIncentiveUnitsPerDay > 0,
      note: "Based on current pace",
    };

    // Animation Triggers
    const shouldAnimateUnlock = this.animationTriggers.shouldAnimateUnlock;
    const shouldAnimateEarning = this.animationTriggers.shouldAnimateEarning;

    // Reset animation triggers after reading
    this.animationTriggers.shouldAnimateUnlock = false;
    this.animationTriggers.shouldAnimateEarning = false;

    return {
      config: this.config,
      progress: this.progress,
      progressBarPercent: progressPercent,
      progressMessage,
      eligibilityBadge,
      timeBandIndicator,
      displayMessages,
      monthlyPotential,
      shouldAnimateUnlock,
      shouldAnimateEarning,
    };
  }

  getEarningsBreakdown(): EarningsBreakdown {
    return {
      totalUnits: this.progress.baseUnitsCompleted + this.progress.incentiveUnitsCompleted,
      totalEarnings: this.progress.totalEarnings,
      breakdown: {
        baseUnits: this.progress.baseUnitsCompleted,
        incentiveUnits: this.progress.incentiveUnitsCompleted,
        addOnServices: this.progress.addOnsCompleted,
      },
    };
  }

  // ==================== VALIDATION ====================

  validateEarningEligibility(): IncentiveValidation {
    const reasons: string[] = [];
    const warnings: string[] = [];

    if (!this.progress.isBaseComplete) {
      reasons.push(`Complete ${this.config.baseQuota - this.progress.baseUnitsCompleted} more base units`);
    }

    const bandStatus = this.isInTimeBand();
    if (!bandStatus.inBand) {
      warnings.push("Currently outside earning time band");
    }

    return {
      canEarn: this.progress.isBaseComplete && bandStatus.inBand,
      blockingReasons: reasons,
      warnings,
    };
  }

  // ==================== EVENT LOGGING ====================

  private logEvent(eventType: string, details: string, earningsImpact: number): void {
    this.eventLogs.push({
      id: `EVENT-${Date.now()}`,
      washerId: this.currentWasherId || "WASHER-UNKNOWN",
      eventType,
      timestamp: new Date().toISOString(),
      details,
      earningsImpact,
    });
  }

  getEventLogs() {
    return [...this.eventLogs];
  }


  // W1 FIX: processJobCompletion — called by WasherContext on job completion
  processJobCompletion(data: {
    washerId: string;
    jobId: string;
    cityId: string;
    packageName: string;
    completedAt: string;
  }): { success: boolean; earningsAdded: number; message: string } {
    // Set the washer context for this operation
    this.setWasherId(data.washerId);
    // Delegate to completeUnit which handles all eligibility rules
    const result = this.completeUnit(data.jobId);
    return result;
  }

  // ==================== RESET (For testing) ====================

  reset(): void {
    this.progress = {
      baseUnitsCompleted: 0,
      baseUnitsTarget: this.config.baseQuota,
      isBaseComplete: false,
      incentiveUnitsCompleted: 0,
      incentiveUnitsInBand: 0,
      incentiveUnitsOutOfBand: 0,
      addOnsCompleted: 0,
      totalEarnings: 0,
      todayEarnings: 0,
      monthlyEarnings: 0,
      baseEarnings: 0,
      incentiveEarnings: 0,
      addOnEarnings: 0,
      eligibilityStatus: "NOT_ELIGIBLE",
      isInTimeBand: false,
      currentTimeBand: null,
      timeBandStatus: "CLOSED",
      totalUnitsToday: 0,
      maxDailyLimit: this.config.maxDailyLimit,
      isNearLimit: false,
      isAtLimit: false,
      unitsUntilLimit: this.config.maxDailyLimit,
      unitsOutsideBand: 0,
      isLateCheckIn: false,
      isWeekOff: false,
      isCoverDay: false,
    };
    this.animationTriggers = {
      shouldAnimateUnlock: false,
      shouldAnimateEarning: false,
      lastEarningAmount: 0,
    };
    this.eventLogs = [];
  }
}

// Singleton instance
export const incentiveEngineService = new IncentiveEngineService();
