/**
 * Salary Hold/Block Management Service
 *
 * Manages salary holds for ghosting (job abandonment) detection
 * - Detects 3 consecutive days of A or LWP
 * - Auto-blocks salary and triggers notifications
 * - Manages multi-level override approval workflow
 */

import {
  GHOSTING_RULES,
  SALARY_HOLD_STATUS,
  APPROVAL_LEVELS,
  APPROVAL_LEVEL_ORDER,
  APPROVAL_STATUS,
} from "../constants/payrollConstants";

export interface SalaryHoldRecord {
  employeeId: string;
  employeeName: string;
  status: typeof SALARY_HOLD_STATUS[keyof typeof SALARY_HOLD_STATUS];
  holdReason: string;
  holdDate: string; // ISO date
  consecutiveAbsentDays: number;
  absentDates: string[]; // Array of ISO dates
  overrideRequest?: OverrideRequest;
  notifications: NotificationLog[];
  releasedDate?: string;
  releasedBy?: string;
}

export interface OverrideRequest {
  id: string;
  requestedBy: string; // Supervisor name/ID
  requestedDate: string; // ISO date
  reason: string;
  evidence?: string; // File path or evidence text
  approvalChain: ApprovalStep[];
  currentLevel: number; // Index in APPROVAL_LEVEL_ORDER
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface ApprovalStep {
  level: typeof APPROVAL_LEVELS[keyof typeof APPROVAL_LEVELS];
  approverName?: string;
  approverId?: string;
  status: typeof APPROVAL_STATUS[keyof typeof APPROVAL_STATUS];
  actionDate?: string; // ISO timestamp
  comments?: string;
  escalatedAt?: string; // ISO timestamp when escalation timer started
  overdueAt?: string; // ISO timestamp when it became overdue
}

export interface NotificationLog {
  id: string;
  type: "EMPLOYEE_WARNING" | "SUPERVISOR_ALERT" | "ESCALATION" | "APPROVAL" | "RELEASE";
  recipient: string;
  channel: "WHATSAPP" | "EMAIL" | "PUSH";
  message: string;
  sentAt: string; // ISO timestamp
  status: "SENT" | "FAILED" | "PENDING";
}

class SalaryHoldService {
  private holdRecords: Map<string, SalaryHoldRecord> = new Map();
  private readonly STORAGE_KEY = "salary_hold_records";
  private listeners: Array<(records: SalaryHoldRecord[]) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const records: SalaryHoldRecord[] = JSON.parse(stored);
        records.forEach(record => {
          this.holdRecords.set(record.employeeId, record);
        });
      }
    } catch (error) {
      console.error("Error loading salary hold records:", error);
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const records = Array.from(this.holdRecords.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
      this.notifyListeners();
    } catch (error) {
      console.error("Error saving salary hold records:", error);
    }
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: (records: SalaryHoldRecord[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const records = Array.from(this.holdRecords.values());
    this.listeners.forEach(listener => listener(records));
  }

  /**
   * Check attendance for ghosting pattern
   * Returns true if ghosting detected (3 consecutive days of A or LWP)
   */
  checkForGhosting(
    employeeId: string,
    employeeName: string,
    attendanceRecords: Array<{ date: string; status: string }>
  ): boolean {
    // Filter only absent statuses excluding weekly offs
    const sortedRecords = attendanceRecords
      .filter(record => GHOSTING_RULES.ABSENT_STATUSES.includes(record.status))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedRecords.length < GHOSTING_RULES.CONSECUTIVE_ABSENT_DAYS) {
      return false;
    }

    // Check for consecutive days
    let consecutiveCount = 1;
    const consecutiveDates: string[] = [sortedRecords[0].date];

    for (let i = 1; i < sortedRecords.length; i++) {
      const prevDate = new Date(sortedRecords[i - 1].date);
      const currDate = new Date(sortedRecords[i].date);
      const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        consecutiveCount++;
        consecutiveDates.push(sortedRecords[i].date);

        if (consecutiveCount >= GHOSTING_RULES.CONSECUTIVE_ABSENT_DAYS) {
          // Ghosting detected - create hold record
          this.createHoldRecord(employeeId, employeeName, consecutiveDates.slice(-3));
          return true;
        }
      } else {
        consecutiveCount = 1;
        consecutiveDates.length = 0;
        consecutiveDates.push(sortedRecords[i].date);
      }
    }

    return false;
  }

  /**
   * Create salary hold record
   */
  private createHoldRecord(employeeId: string, employeeName: string, absentDates: string[]): void {
    const existingHold = this.holdRecords.get(employeeId);

    // Don't create duplicate hold
    if (existingHold && existingHold.status === SALARY_HOLD_STATUS.ON_HOLD) {
      return;
    }

    const record: SalaryHoldRecord = {
      employeeId,
      employeeName,
      status: SALARY_HOLD_STATUS.ON_HOLD,
      holdReason: `Consecutive absence detected for ${absentDates.length} days`,
      holdDate: new Date().toISOString(),
      consecutiveAbsentDays: absentDates.length,
      absentDates,
      notifications: [],
    };

    // Send notifications
    this.sendEmployeeWarning(record);
    this.sendSupervisorAlert(record);

    this.holdRecords.set(employeeId, record);
    this.saveToStorage();
  }

  /**
   * Send WhatsApp warning to employee
   */
  private sendEmployeeWarning(record: SalaryHoldRecord): void {
    const notification: NotificationLog = {
      id: `notif_${Date.now()}_employee`,
      type: "EMPLOYEE_WARNING",
      recipient: record.employeeName,
      channel: "WHATSAPP",
      message: `⚠️ WARNING: Your salary has been put ON HOLD due to ${record.consecutiveAbsentDays} consecutive days of absence. Please contact your supervisor immediately to avoid job abandonment proceedings.`,
      sentAt: new Date().toISOString(),
      status: "SENT", // Mock status
    };

    record.notifications.push(notification);
  }

  /**
   * Send push alert to supervisor
   */
  private sendSupervisorAlert(record: SalaryHoldRecord): void {
    const notification: NotificationLog = {
      id: `notif_${Date.now()}_supervisor`,
      type: "SUPERVISOR_ALERT",
      recipient: "Supervisor",
      channel: "PUSH",
      message: `🚨 ALERT: Employee ${record.employeeName} (ID: ${record.employeeId}) has been absent for ${record.consecutiveAbsentDays} consecutive days. Salary is now ON HOLD. Please initiate follow-up.`,
      sentAt: new Date().toISOString(),
      status: "SENT",
    };

    record.notifications.push(notification);
  }

  /**
   * Submit override request (by Supervisor)
   */
  submitOverrideRequest(
    employeeId: string,
    supervisorName: string,
    reason: string,
    evidence?: string
  ): OverrideRequest | null {
    const record = this.holdRecords.get(employeeId);

    if (!record || record.status !== SALARY_HOLD_STATUS.ON_HOLD) {
      return null;
    }

    const overrideRequest: OverrideRequest = {
      id: `override_${employeeId}_${Date.now()}`,
      requestedBy: supervisorName,
      requestedDate: new Date().toISOString(),
      reason,
      evidence,
      approvalChain: this.initializeApprovalChain(),
      currentLevel: 0,
      status: "PENDING",
    };

    // Mark first step (Supervisor) as approved
    overrideRequest.approvalChain[0].status = APPROVAL_STATUS.APPROVED;
    overrideRequest.approvalChain[0].approverName = supervisorName;
    overrideRequest.approvalChain[0].actionDate = new Date().toISOString();

    // Start timer for Cluster Manager
    overrideRequest.approvalChain[1].escalatedAt = new Date().toISOString();
    overrideRequest.currentLevel = 1;

    record.overrideRequest = overrideRequest;
    record.status = SALARY_HOLD_STATUS.OVERRIDE_PENDING;

    this.saveToStorage();

    return overrideRequest;
  }

  /**
   * Initialize approval chain with all levels
   */
  private initializeApprovalChain(): ApprovalStep[] {
    return APPROVAL_LEVEL_ORDER.map(level => ({
      level,
      status: APPROVAL_STATUS.PENDING,
    }));
  }

  /**
   * Approve override at current level
   */
  approveOverride(
    employeeId: string,
    approverName: string,
    approverId: string,
    comments?: string
  ): boolean {
    const record = this.holdRecords.get(employeeId);

    if (!record || !record.overrideRequest) {
      return false;
    }

    const currentStep = record.overrideRequest.approvalChain[record.overrideRequest.currentLevel];

    currentStep.status = APPROVAL_STATUS.APPROVED;
    currentStep.approverName = approverName;
    currentStep.approverId = approverId;
    currentStep.actionDate = new Date().toISOString();
    currentStep.comments = comments;

    // Move to next level or complete
    if (record.overrideRequest.currentLevel < APPROVAL_LEVEL_ORDER.length - 1) {
      record.overrideRequest.currentLevel++;

      // Start escalation timer for next level
      const nextStep = record.overrideRequest.approvalChain[record.overrideRequest.currentLevel];
      nextStep.escalatedAt = new Date().toISOString();
    } else {
      // All levels approved - release salary
      record.overrideRequest.status = "APPROVED";
      record.status = SALARY_HOLD_STATUS.RELEASED;
      record.releasedDate = new Date().toISOString();
      record.releasedBy = approverName;

      this.sendReleaseNotification(record);
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Reject override request
   */
  rejectOverride(
    employeeId: string,
    approverName: string,
    approverId: string,
    comments: string
  ): boolean {
    const record = this.holdRecords.get(employeeId);

    if (!record || !record.overrideRequest) {
      return false;
    }

    const currentStep = record.overrideRequest.approvalChain[record.overrideRequest.currentLevel];

    currentStep.status = APPROVAL_STATUS.REJECTED;
    currentStep.approverName = approverName;
    currentStep.approverId = approverId;
    currentStep.actionDate = new Date().toISOString();
    currentStep.comments = comments;

    record.overrideRequest.status = "REJECTED";
    // Salary remains ON_HOLD

    this.saveToStorage();
    return true;
  }

  /**
   * Check for overdue approvals (> 4 business hours)
   * Returns list of overdue requests
   */
  checkOverdueApprovals(): Array<{
    employeeId: string;
    employeeName: string;
    currentLevel: string;
    overdueHours: number;
  }> {
    const overdueList: Array<{
      employeeId: string;
      employeeName: string;
      currentLevel: string;
      overdueHours: number;
    }> = [];

    this.holdRecords.forEach((record) => {
      if (record.overrideRequest && record.status === SALARY_HOLD_STATUS.OVERRIDE_PENDING) {
        const currentStep = record.overrideRequest.approvalChain[record.overrideRequest.currentLevel];

        if (currentStep.escalatedAt) {
          const businessHours = this.calculateBusinessHours(currentStep.escalatedAt);

          if (businessHours >= GHOSTING_RULES.ESCALATION_TIMEOUT_HOURS) {
            if (currentStep.status !== APPROVAL_STATUS.OVERDUE) {
              currentStep.status = APPROVAL_STATUS.OVERDUE;
              currentStep.overdueAt = new Date().toISOString();

              // Auto-escalate to next level
              this.autoEscalate(record);
            }

            overdueList.push({
              employeeId: record.employeeId,
              employeeName: record.employeeName,
              currentLevel: currentStep.level,
              overdueHours: businessHours,
            });
          }
        }
      }
    });

    if (overdueList.length > 0) {
      this.saveToStorage();
    }

    return overdueList;
  }

  /**
   * Auto-escalate to next level when current level is inactive
   */
  private autoEscalate(record: SalaryHoldRecord): void {
    if (!record.overrideRequest) return;

    const currentStep = record.overrideRequest.approvalChain[record.overrideRequest.currentLevel];
    currentStep.status = APPROVAL_STATUS.AUTO_ESCALATED;

    // Move to next level
    if (record.overrideRequest.currentLevel < APPROVAL_LEVEL_ORDER.length - 1) {
      record.overrideRequest.currentLevel++;

      const nextStep = record.overrideRequest.approvalChain[record.overrideRequest.currentLevel];
      nextStep.escalatedAt = new Date().toISOString();

      // Send escalation notification
      this.sendEscalationNotification(record, nextStep.level);
    }
  }

  /**
   * Calculate business hours between two timestamps
   * Excludes Sundays and hours outside 09:00-19:00
   */
  private calculateBusinessHours(startTime: string): number {
    const start = new Date(startTime);
    const now = new Date();

    let businessHours = 0;
    let current = new Date(start);

    while (current < now) {
      const day = current.getDay();
      const hour = current.getHours();

      // Skip Sundays
      if (!GHOSTING_RULES.EXCLUDED_DAYS.includes(day)) {
        // Count only business hours (09:00 - 19:00)
        if (hour >= GHOSTING_RULES.BUSINESS_HOURS_START && hour < GHOSTING_RULES.BUSINESS_HOURS_END) {
          businessHours += 1;
        }
      }

      // Move to next hour
      current.setHours(current.getHours() + 1);
    }

    return businessHours;
  }

  /**
   * Send escalation notification
   */
  private sendEscalationNotification(record: SalaryHoldRecord, escalatedTo: string): void {
    const notification: NotificationLog = {
      id: `notif_${Date.now()}_escalation`,
      type: "ESCALATION",
      recipient: escalatedTo,
      channel: "PUSH",
      message: `⏰ AUTO-ESCALATED: Override request for ${record.employeeName} has been escalated to your level due to ${GHOSTING_RULES.ESCALATION_TIMEOUT_HOURS}-hour timeout.`,
      sentAt: new Date().toISOString(),
      status: "SENT",
    };

    record.notifications.push(notification);
  }

  /**
   * Send release notification
   */
  private sendReleaseNotification(record: SalaryHoldRecord): void {
    const notification: NotificationLog = {
      id: `notif_${Date.now()}_release`,
      type: "RELEASE",
      recipient: record.employeeName,
      channel: "WHATSAPP",
      message: `✅ SALARY RELEASED: Your salary hold has been lifted. Payroll processing will continue normally.`,
      sentAt: new Date().toISOString(),
      status: "SENT",
    };

    record.notifications.push(notification);
  }

  /**
   * Get all hold records
   */
  getAllRecords(): SalaryHoldRecord[] {
    return Array.from(this.holdRecords.values());
  }

  /**
   * Get hold record for employee
   */
  getHoldRecord(employeeId: string): SalaryHoldRecord | undefined {
    return this.holdRecords.get(employeeId);
  }

  /**
   * Check if employee salary is blocked
   */
  isSalaryBlocked(employeeId: string): boolean {
    const record = this.holdRecords.get(employeeId);
    return record?.status === SALARY_HOLD_STATUS.ON_HOLD ||
           record?.status === SALARY_HOLD_STATUS.OVERRIDE_PENDING;
  }

  /**
   * Get pending approval requests by level
   */
  getPendingApprovalsByLevel(level: string): SalaryHoldRecord[] {
    const pending: SalaryHoldRecord[] = [];

    this.holdRecords.forEach((record) => {
      if (record.status === SALARY_HOLD_STATUS.OVERRIDE_PENDING && record.overrideRequest) {
        const currentStep = record.overrideRequest.approvalChain[record.overrideRequest.currentLevel];
        if (currentStep.level === level && currentStep.status === APPROVAL_STATUS.PENDING) {
          pending.push(record);
        }
      }
    });

    return pending;
  }
}

// Singleton instance
export const salaryHoldService = new SalaryHoldService();
