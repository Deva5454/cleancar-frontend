/**
 * Grace Period Tracking Service
 *
 * Manages 10-minute grace period quota for employees
 * - 3 times per month limit
 * - Auto-reset on 1st of every month
 * - Active Mon-Sat, 09:00 AM - 07:00 PM
 * - Triggers HPLRG (Half Day PL Adjustment) on violation
 */

import { GRACE_PERIOD_RULES, GRACE_PERIOD_APPLICATIONS } from "../constants/payrollConstants";

export interface GraceUsage {
  employeeId: string;
  month: string; // Format: "YYYY-MM"
  usageCount: number; // Times used this month
  usageHistory: GraceUsageRecord[];
  lastReset: string; // ISO date of last reset
}

export interface GraceUsageRecord {
  id: string;
  date: string; // ISO date
  time: string; // HH:mm format
  applicationType: typeof GRACE_PERIOD_APPLICATIONS[keyof typeof GRACE_PERIOD_APPLICATIONS];
  minutesLate: number;
  approvedBy?: string;
}

export interface GraceCheckResult {
  allowed: boolean;
  reason?: string;
  remainingQuota: number;
  currentUsage: number;
  violationType?: "QUOTA_EXCEEDED" | "TIME_EXCEEDED" | "NON_BUSINESS_HOURS";
}

class GracePeriodService {
  private graceUsageStore: Map<string, GraceUsage> = new Map();
  private readonly STORAGE_KEY = "grace_period_usage";

  constructor() {
    this.loadFromStorage();
    this.scheduleMonthlyReset();
  }

  /**
   * Load grace usage data from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data: GraceUsage[] = JSON.parse(stored);
        data.forEach(usage => {
          const key = this.getStorageKey(usage.employeeId, usage.month);
          this.graceUsageStore.set(key, usage);
        });
      }
    } catch (error) {
      console.error("Error loading grace usage from storage:", error);
    }
  }

  /**
   * Save grace usage data to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.graceUsageStore.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving grace usage to storage:", error);
    }
  }

  /**
   * Generate storage key for employee and month
   */
  private getStorageKey(employeeId: string, month: string): string {
    return `${employeeId}_${month}`;
  }

  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  /**
   * Check if current time is within business hours
   */
  private isBusinessHours(date: Date = new Date()): boolean {
    const day = date.getDay();
    const hour = date.getHours();

    // Check if day is in working days (Mon-Sat)
    if (!GRACE_PERIOD_RULES.WORKING_DAYS.includes(day)) {
      return false;
    }

    // Check if hour is within business hours (09:00 - 19:00)
    return hour >= GRACE_PERIOD_RULES.BUSINESS_HOURS_START &&
           hour < GRACE_PERIOD_RULES.BUSINESS_HOURS_END;
  }

  /**
   * Get grace usage for employee in current month
   */
  getGraceUsage(employeeId: string, month?: string): GraceUsage {
    const targetMonth = month || this.getCurrentMonth();
    const key = this.getStorageKey(employeeId, targetMonth);

    let usage = this.graceUsageStore.get(key);

    if (!usage) {
      usage = {
        employeeId,
        month: targetMonth,
        usageCount: 0,
        usageHistory: [],
        lastReset: new Date().toISOString(),
      };
      this.graceUsageStore.set(key, usage);
      this.saveToStorage();
    }

    return usage;
  }

  /**
   * Check if employee can use grace period
   */
  checkGraceEligibility(
    employeeId: string,
    minutesLate: number,
    applicationType: typeof GRACE_PERIOD_APPLICATIONS[keyof typeof GRACE_PERIOD_APPLICATIONS],
    checkDate: Date = new Date()
  ): GraceCheckResult {
    // Check if within business hours
    if (!this.isBusinessHours(checkDate)) {
      return {
        allowed: false,
        reason: "Grace period only applies during business hours (Mon-Sat, 09:00 AM - 07:00 PM)",
        remainingQuota: 0,
        currentUsage: 0,
        violationType: "NON_BUSINESS_HOURS",
      };
    }

    const usage = this.getGraceUsage(employeeId);

    // Check if late time exceeds 10 minutes
    if (minutesLate > GRACE_PERIOD_RULES.GRACE_MINUTES) {
      return {
        allowed: false,
        reason: `Late by ${minutesLate} minutes. Grace period is only ${GRACE_PERIOD_RULES.GRACE_MINUTES} minutes.`,
        remainingQuota: GRACE_PERIOD_RULES.MONTHLY_QUOTA - usage.usageCount,
        currentUsage: usage.usageCount,
        violationType: "TIME_EXCEEDED",
      };
    }

    // Check if quota is exhausted
    if (usage.usageCount >= GRACE_PERIOD_RULES.MONTHLY_QUOTA) {
      return {
        allowed: false,
        reason: `Monthly grace quota exhausted (${usage.usageCount}/${GRACE_PERIOD_RULES.MONTHLY_QUOTA} used)`,
        remainingQuota: 0,
        currentUsage: usage.usageCount,
        violationType: "QUOTA_EXCEEDED",
      };
    }

    // Grace allowed
    return {
      allowed: true,
      remainingQuota: GRACE_PERIOD_RULES.MONTHLY_QUOTA - usage.usageCount,
      currentUsage: usage.usageCount,
    };
  }

  /**
   * Record grace usage
   */
  recordGraceUsage(
    employeeId: string,
    minutesLate: number,
    applicationType: typeof GRACE_PERIOD_APPLICATIONS[keyof typeof GRACE_PERIOD_APPLICATIONS],
    date: Date = new Date()
  ): GraceUsageRecord {
    const usage = this.getGraceUsage(employeeId);

    const record: GraceUsageRecord = {
      id: `grace_${employeeId}_${Date.now()}`,
      date: date.toISOString().split("T")[0],
      time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
      applicationType,
      minutesLate,
    };

    usage.usageHistory.push(record);
    usage.usageCount += 1;

    this.saveToStorage();

    return record;
  }

  /**
   * Reset grace usage for an employee
   */
  resetGraceUsage(employeeId: string, month?: string): void {
    const targetMonth = month || this.getCurrentMonth();
    const key = this.getStorageKey(employeeId, targetMonth);

    const usage: GraceUsage = {
      employeeId,
      month: targetMonth,
      usageCount: 0,
      usageHistory: [],
      lastReset: new Date().toISOString(),
    };

    this.graceUsageStore.set(key, usage);
    this.saveToStorage();
  }

  /**
   * Reset all grace usage (Called on 1st of every month)
   */
  resetAllGraceUsage(): void {
    const currentMonth = this.getCurrentMonth();

    // Clear old month data and create fresh records for current month
    const allEmployeeIds = new Set<string>();
    this.graceUsageStore.forEach(usage => allEmployeeIds.add(usage.employeeId));

    this.graceUsageStore.clear();

    allEmployeeIds.forEach(employeeId => {
      this.resetGraceUsage(employeeId, currentMonth);
    });

    console.log(`[Grace Period] All grace usage reset for ${currentMonth}`);
  }

  /**
   * Schedule monthly reset (CRON-like behavior)
   * In production, this should be a server-side CRON job
   */
  private scheduleMonthlyReset(): void {
    // Check every hour if it's the 1st day and past midnight
    setInterval(() => {
      const now = new Date();
      if (now.getDate() === GRACE_PERIOD_RULES.RESET_DAY && now.getHours() === 0) {
        this.resetAllGraceUsage();
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Get grace statistics for employee
   */
  getGraceStatistics(employeeId: string, month?: string) {
    const usage = this.getGraceUsage(employeeId, month);

    return {
      currentUsage: usage.usageCount,
      remainingQuota: GRACE_PERIOD_RULES.MONTHLY_QUOTA - usage.usageCount,
      totalQuota: GRACE_PERIOD_RULES.MONTHLY_QUOTA,
      usagePercentage: (usage.usageCount / GRACE_PERIOD_RULES.MONTHLY_QUOTA) * 100,
      lastUsed: usage.usageHistory.length > 0
        ? usage.usageHistory[usage.usageHistory.length - 1].date
        : null,
      history: usage.usageHistory,
    };
  }

  /**
   * Get all employees with grace violations this month
   */
  getGraceViolations(month?: string): Array<{
    employeeId: string;
    violationsCount: number;
    lastViolation: string;
  }> {
    const targetMonth = month || this.getCurrentMonth();
    const violations: Array<{
      employeeId: string;
      violationsCount: number;
      lastViolation: string;
    }> = [];

    this.graceUsageStore.forEach((usage) => {
      if (usage.month === targetMonth && usage.usageCount > GRACE_PERIOD_RULES.MONTHLY_QUOTA) {
        const excessUsage = usage.usageCount - GRACE_PERIOD_RULES.MONTHLY_QUOTA;
        violations.push({
          employeeId: usage.employeeId,
          violationsCount: excessUsage,
          lastViolation: usage.usageHistory[usage.usageHistory.length - 1]?.date || "",
        });
      }
    });

    return violations;
  }

  /**
   * Get all grace usage records
   */
  getAllGraceUsage(): GraceUsage[] {
    return Array.from(this.graceUsageStore.values());
  }
}

// Singleton instance
export const gracePeriodService = new GracePeriodService();
