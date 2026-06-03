/**
 * LEAVE BALANCE SERVICE
 * Manages leave balances, accrual, and validation based on leave policy configuration
 * 
 * CORE PRINCIPLE:
 * - All leave balances are maintained in DAYS (single source)
 * - Half-day is NOT a leave type - it's only a MODE of applying leave
 * - System deducts: 1.0 for full day, 0.5 for half day
 * - Comp Off uses FIFO (First In First Out) deduction via compOffService
 */

import {
  CURRENT_LEAVE_POLICY,
  type LeaveType,
  type LeaveTypePolicy,
  type EmployeeStatus
} from "../config/leavePolicyConfiguration";
import { compOffService } from "./compOffService";

export interface EmployeeLeaveBalance {
  employeeId: string;
  employeeName: string;
  employeeStatus: EmployeeStatus;
  joiningDate: string;
  balances: {
    [key in LeaveType]?: {
      available: number;
      used: number;
      quota: number;
      accrued: number;
      carriedForward: number;
    };
  };
  lastUpdated: string;
}

export interface LeaveBalanceUpdate {
  leaveType: LeaveType;
  amount: number;
  reason: string;
  date: string;
}

class LeaveBalanceService {
  private balances: Map<string, EmployeeLeaveBalance> = new Map();
  private storageKey = "leave_balances_v1";

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.balances = new Map(Object.entries(data));
      } catch (error) {
        console.error("Error loading leave balances:", error);
      }
    }
  }

  private saveToStorage(): void {
    const data = Object.fromEntries(this.balances);
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  /**
   * Initialize leave balance for an employee
   */
  initializeEmployeeBalance(
    employeeId: string,
    employeeName: string,
    employeeStatus: EmployeeStatus,
    joiningDate: string
  ): EmployeeLeaveBalance {
    const balances: EmployeeLeaveBalance["balances"] = {};

    // Initialize balances for each leave type based on policy
    CURRENT_LEAVE_POLICY.forEach((policy) => {
      const config = employeeStatus === "Probation" ? policy.probation : policy.confirmed;

      if (config.enabled) {
        // Special handling for Comp Off - start with 0, earned by working on week offs/holidays
        if (policy.type === "COMP OFF") {
          balances[policy.type] = {
            available: 0,
            used: 0,
            quota: 0, // Dynamic - based on what's earned
            accrued: 0,
            carriedForward: 0,
          };
        } else {
          balances[policy.type] = {
            available: config.annualQuota,
            used: 0,
            quota: config.annualQuota,
            accrued: config.annualQuota,
            carriedForward: 0,
          };
        }
      }
    });

    const employeeBalance: EmployeeLeaveBalance = {
      employeeId,
      employeeName,
      employeeStatus,
      joiningDate,
      balances,
      lastUpdated: new Date().toISOString(),
    };

    this.balances.set(employeeId, employeeBalance);
    this.saveToStorage();

    return employeeBalance;
  }

  /**
   * Get leave balance for an employee
   */
  getEmployeeBalance(employeeId: string): EmployeeLeaveBalance | null {
    const balance = this.balances.get(employeeId);
    if (!balance) return null;

    // Ensure all enabled leave types are present in balance
    // This handles cases where new leave types are added to policy
    let updated = false;
    CURRENT_LEAVE_POLICY.forEach((policy) => {
      const config = balance.employeeStatus === "Probation" ? policy.probation : policy.confirmed;

      if (config.enabled && !balance.balances[policy.type]) {
        // Add missing leave type with special handling for Comp Off
        if (policy.type === "COMP OFF") {
          balance.balances[policy.type] = {
            available: 0,
            used: 0,
            quota: 0,
            accrued: 0,
            carriedForward: 0,
          };
        } else {
          balance.balances[policy.type] = {
            available: config.annualQuota,
            used: 0,
            quota: config.annualQuota,
            accrued: config.annualQuota,
            carriedForward: 0,
          };
        }
        updated = true;
      }
    });

    if (updated) {
      balance.lastUpdated = new Date().toISOString();
      this.saveToStorage();
    }

    return balance;
  }

  /**
   * Get all employee balances
   */
  getAllBalances(): EmployeeLeaveBalance[] {
    return Array.from(this.balances.values());
  }

  /**
   * Update employee status (Probation to Confirmed)
   */
  updateEmployeeStatus(employeeId: string, newStatus: EmployeeStatus): void {
    const balance = this.balances.get(employeeId);
    if (!balance) return;

    balance.employeeStatus = newStatus;
    balance.lastUpdated = new Date().toISOString();

    // Recalculate quotas based on new status
    CURRENT_LEAVE_POLICY.forEach((policy) => {
      const config = newStatus === "Probation" ? policy.probation : policy.confirmed;

      if (config.enabled && balance.balances[policy.type]) {
        const currentBalance = balance.balances[policy.type]!;
        currentBalance.quota = config.annualQuota;
        currentBalance.available = config.annualQuota - currentBalance.used + currentBalance.carriedForward;
      }
    });

    this.saveToStorage();
  }

  /**
   * Deduct leave from balance
   * @param days - can be 1.0 for full day or 0.5 for half day
   * 
   * COMP OFF SPECIAL HANDLING:
   * - Uses FIFO (First In First Out) logic via compOffService
   * - Automatically consumes oldest expiring Comp Off first
   */
  deductLeave(
    employeeId: string,
    leaveType: LeaveType,
    days: number,
    reason: string
  ): { success: boolean; error?: string } {
    const balance = this.balances.get(employeeId);
    if (!balance) {
      return { success: false, error: "Employee balance not found" };
    }

    const leaveBalance = balance.balances[leaveType];
    if (!leaveBalance) {
      return { success: false, error: `Leave type ${leaveType} not available for this employee` };
    }

    // Check if sufficient balance (except for LWP and UPL which have no limit)
    if (leaveType !== "LWP" && leaveType !== "UPL" && leaveBalance.available < days) {
      return {
        success: false,
        error: `Insufficient balance. Available: ${leaveBalance.available}, Requested: ${days}`
      };
    }

    // 🔥 SPECIAL HANDLING FOR COMP OFF - Use FIFO logic
    if (leaveType === "COMP OFF") {
      const compOffDeducted = compOffService.deductCompOff(employeeId, days);
      if (!compOffDeducted) {
        return {
          success: false,
          error: "Could not deduct from Comp Off entries (may be expired or insufficient)"
        };
      }
      
      // Update balance summary
      leaveBalance.used += days;
      leaveBalance.available -= days;
      balance.lastUpdated = new Date().toISOString();
      this.saveToStorage();
      return { success: true };
    }

    // Standard deduction for other leave types (supports 0.5 for half-day, 1.0 for full day)
    leaveBalance.used += days;
    leaveBalance.available -= days;
    balance.lastUpdated = new Date().toISOString();

    this.saveToStorage();
    return { success: true };
  }

  /**
   * Credit leave to balance
   * 
   * COMP OFF SPECIAL HANDLING:
   * - Uses reverse FIFO logic via compOffService
   * - Credits back to most recently consumed entries
   */
  creditLeave(
    employeeId: string,
    leaveType: LeaveType,
    days: number,
    reason: string
  ): { success: boolean; error?: string } {
    const balance = this.balances.get(employeeId);
    if (!balance) {
      return { success: false, error: "Employee balance not found" };
    }

    const leaveBalance = balance.balances[leaveType];
    if (!leaveBalance) {
      return { success: false, error: `Leave type ${leaveType} not available for this employee` };
    }

    // 🔄 SPECIAL HANDLING FOR COMP OFF - Credit back to entries
    if (leaveType === "COMP OFF") {
      compOffService.creditBackCompOff(employeeId, days);
      
      // Update balance summary
      leaveBalance.used = Math.max(0, leaveBalance.used - days);
      leaveBalance.available += days;
      balance.lastUpdated = new Date().toISOString();
      this.saveToStorage();
      return { success: true };
    }

    // Standard credit for other leave types
    leaveBalance.used = Math.max(0, leaveBalance.used - days);
    leaveBalance.available += days;
    balance.lastUpdated = new Date().toISOString();

    this.saveToStorage();
    return { success: true };
  }

  /**
   * Earn Comp Off by working on week off or public holiday
   */
  earnCompOff(
    employeeId: string,
    days: number,
    reason: string
  ): { success: boolean; error?: string } {
    const balance = this.balances.get(employeeId);
    if (!balance) {
      return { success: false, error: "Employee balance not found" };
    }

    const compOffBalance = balance.balances["COMP OFF"];
    if (!compOffBalance) {
      return { success: false, error: "Comp Off not available for this employee" };
    }

    // Add earned Comp Off days
    compOffBalance.quota += days;
    compOffBalance.accrued += days;
    compOffBalance.available += days;
    balance.lastUpdated = new Date().toISOString();

    this.saveToStorage();
    return { success: true };
  }

  /**
   * Record LWP usage (for attendance penalties when PL = 0)
   * 
   * NOTE: LWP has unlimited balance, so we just track usage
   * This is used when PLRG/HPLRG penalties convert to LWP
   */
  recordLWPUsage(
    employeeId: string,
    days: number,
    reason: string
  ): { success: boolean; error?: string } {
    const balance = this.balances.get(employeeId);
    if (!balance) {
      return { success: false, error: "Employee balance not found" };
    }

    const lwpBalance = balance.balances["LWP"];
    if (!lwpBalance) {
      return { success: false, error: "LWP not available for this employee" };
    }

    // LWP is unlimited, so we just track usage (no available deduction)
    lwpBalance.used += days;
    balance.lastUpdated = new Date().toISOString();

    this.saveToStorage();
    return { success: true };
  }

  /**
   * Validate leave application against policy rules
   */
  validateLeaveApplication(
    employeeId: string,
    leaveType: LeaveType,
    days: number,
    fromDate: Date,
    toDate: Date
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const balance = this.balances.get(employeeId);
    if (!balance) {
      errors.push("Employee balance not found");
      return { valid: false, errors, warnings };
    }

    // Get policy for this leave type
    const policy = CURRENT_LEAVE_POLICY.find(p => p.type === leaveType);
    if (!policy) {
      errors.push(`Leave type ${leaveType} not found in policy`);
      return { valid: false, errors, warnings };
    }

    const config = balance.employeeStatus === "Probation" ? policy.probation : policy.confirmed;

    // Check if leave type is enabled for this employee status
    if (!config.enabled) {
      errors.push(`${policy.fullName} is not available for ${balance.employeeStatus} employees`);
      return { valid: false, errors, warnings };
    }

    // Check balance (except for LWP)
    if (leaveType !== "LWP") {
      const leaveBalance = balance.balances[leaveType];
      if (!leaveBalance || leaveBalance.available < days) {
        errors.push(
          `Insufficient ${policy.fullName} balance. Available: ${leaveBalance?.available || 0}, Requested: ${days}`
        );
      }
    }

    // Check max consecutive days
    if (days > config.maxConsecutiveDays) {
      errors.push(
        `Cannot apply for more than ${config.maxConsecutiveDays} consecutive days of ${policy.fullName}`
      );
    }

    // Check prior approval requirement
    if (policy.rules.priorApprovalRequired) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntilLeave = Math.ceil((fromDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilLeave < policy.rules.priorApprovalDays) {
        warnings.push(
          `${policy.fullName} requires ${policy.rules.priorApprovalDays} days prior notice. You are applying with ${daysUntilLeave} days notice.`
        );
      }
    }

    // Check medical certificate requirement
    if (policy.rules.medicalCertificateRequired && days >= policy.rules.medicalCertificateAfterDays) {
      warnings.push(
        `Medical certificate is required for ${policy.fullName} of ${policy.rules.medicalCertificateAfterDays} or more days`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get leave policy for a specific leave type
   */
  getLeavePolicy(leaveType: LeaveType): LeaveTypePolicy | null {
    return CURRENT_LEAVE_POLICY.find(p => p.type === leaveType) || null;
  }

  /**
   * Get all available leave types for an employee
   */
  getAvailableLeaveTypes(employeeId: string): LeaveTypePolicy[] {
    const balance = this.balances.get(employeeId);
    if (!balance) return [];

    return CURRENT_LEAVE_POLICY.filter(policy => {
      const config = balance.employeeStatus === "Probation" ? policy.probation : policy.confirmed;
      return config.enabled;
    });
  }

  /**
   * Clear all balances (for testing)
   */
  clearAllBalances(): void {
    this.balances.clear();
    this.saveToStorage();
  }

  /**
   * Check if a leave type should display balance number
   * LWP/UPL are conditional leaves without pre-allocated balance
   */
  shouldShowBalance(leaveType: LeaveType): boolean {
    const policy = CURRENT_LEAVE_POLICY.find(p => p.type === leaveType);
    if (!policy) return true;
    
    // Hide balance for unpaid leave types (LWP/UPL)
    return policy.specialRules?.lwp?.showBalance !== false;
  }

  /**
   * Check if a leave type is unpaid
   */
  isUnpaidLeave(leaveType: LeaveType): boolean {
    const policy = CURRENT_LEAVE_POLICY.find(p => p.type === leaveType);
    return policy?.salaryImpact.isPaid === false;
  }

  /**
   * Get salary deduction formula for unpaid leave
   */
  getSalaryDeductionFormula(leaveType: LeaveType): string | null {
    const policy = CURRENT_LEAVE_POLICY.find(p => p.type === leaveType);
    if (!policy || policy.salaryImpact.isPaid) return null;
    return policy.salaryImpact.deductionFormula || null;
  }
}

// Export singleton instance
export const leaveBalanceService = new LeaveBalanceService();