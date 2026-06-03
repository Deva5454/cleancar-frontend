/**
 * Incentive Engine
 *
 * Performance-based reward calculation system
 * Supports multiple incentive types and custom rules
 */

import { DataService } from "./DataService";
import { attendanceMaster } from "./attendanceMaster";
import { attendanceTrustScoreService } from "./attendanceTrustScore";
import { logger } from "./logger";

// ========== TYPES ==========

export type IncentiveType =
  | "Attendance Bonus"
  | "Punctuality Bonus"
  | "Performance Bonus"
  | "Sales Target"
  | "Overtime Bonus"
  | "Retention Bonus"
  | "Referral Bonus"
  | "Custom";

export type IncentiveStatus = "Pending" | "Approved" | "Paid" | "Rejected";

export interface IncentiveRecord {
  incentiveId: string;
  employeeId: string;
  employeeName: string;
  month: string; // "April 2026"
  year: number;

  // Incentive details
  type: IncentiveType;
  amount: number;
  reason: string;
  calculatedBy: "Auto" | "Manual";

  // Auto-calculation metrics
  metrics?: {
    attendancePercentage?: number;
    punctualityScore?: number;
    performanceRating?: number;
    salesAchieved?: number;
    salesTarget?: number;
    overtimeHours?: number;
  };

  // Approval
  status: IncentiveStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  // Payment
  paidAt?: string;
  paymentReference?: string;

  // Metadata
  createdAt: string;
  createdBy: string;
}

export interface IncentiveRule {
  ruleId: string;
  name: string;
  type: IncentiveType;
  enabled: boolean;
  priority: number; // Higher priority rules apply first

  // Conditions
  conditions: IncentiveCondition[];

  // Calculation
  calculationType: "Fixed" | "Percentage" | "Formula";
  fixedAmount?: number;
  percentage?: number; // % of base salary
  formula?: string; // e.g., "basePerDay * daysPresent * 0.1"

  // Limits
  minAmount?: number;
  maxAmount?: number;

  // Applicability
  applicableRoles?: string[];
  applicableCities?: string[];

  // Metadata
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface IncentiveCondition {
  field: string; // "attendancePercentage", "punctualityScore", etc.
  operator: ">" | ">=" | "<" | "<=" | "==" | "!=";
  value: number | string;
}

export interface IncentiveSummary {
  totalIncentives: number;
  totalAmount: number;
  byType: Record<IncentiveType, { count: number; amount: number }>;
  byStatus: Record<IncentiveStatus, { count: number; amount: number }>;
  topEmployees: Array<{ employeeId: string; name: string; totalAmount: number }>;
}

// ========== SERVICE ==========

class IncentiveEngine {
  private readonly STORAGE_KEY = "INCENTIVE_RECORDS";
  private readonly RULES_KEY = "INCENTIVE_RULES";

  /**
   * Auto-calculate incentives for employee
   */
  autoCalculateIncentives(
    employeeId: string,
    employeeName: string,
    month: string,
    year: number,
    baseSalary: number,
    cityId: string,
    roleId: string
  ): IncentiveRecord[] {
    const incentives: IncentiveRecord[] = [];
    const rules = this.getApplicableRules(cityId, roleId);

    // Get attendance data
    const monthStr = `${year}-${String(this.getMonthNumber(month)).padStart(2, '0')}`;
    const attendanceRecords = attendanceMaster.getByMonth(employeeId, monthStr);

    if (attendanceRecords.length === 0) {
      logger.warn("IncentiveEngine: No attendance data", { employeeId, month });
      return [];
    }

    // Calculate metrics
    const totalDays = this.getDaysInMonth(month, year);
    const presentDays = attendanceRecords.filter(r => r.status === "Present").length;
    const attendancePercentage = (presentDays / totalDays) * 100;

    const lateDays = attendanceRecords.filter(r => r.lateMinutes && r.lateMinutes > 15).length;
    const punctualityScore = ((presentDays - lateDays) / presentDays) * 100;

    const overtimeHours = attendanceRecords.reduce(
      (sum, r) => sum + ((r.overtimeMinutes || 0) / 60),
      0
    );

    const metrics = {
      attendancePercentage,
      punctualityScore,
      overtimeHours,
    };

    // Apply rules
    rules.forEach(rule => {
      if (this.evaluateConditions(rule.conditions, metrics)) {
        const amount = this.calculateAmount(rule, baseSalary, metrics);

        if (amount > 0) {
          incentives.push({
            incentiveId: this.generateIncentiveId(),
            employeeId,
            employeeName,
            month: `${month} ${year}`,
            year,
            type: rule.type,
            amount,
            reason: `Auto-calculated: ${rule.name}`,
            calculatedBy: "Auto",
            metrics,
            status: "Pending",
            createdAt: new Date().toISOString(),
            createdBy: "System",
          });
        }
      }
    });

    // Save incentives
    incentives.forEach(inc => this.saveIncentive(inc));

    logger.log("IncentiveEngine: Auto-calculated", {
      employeeId,
      month,
      count: incentives.length,
      totalAmount: incentives.reduce((sum, i) => sum + i.amount, 0),
    });

    return incentives;
  }

  /**
   * Create manual incentive
   */
  createManualIncentive(data: {
    employeeId: string;
    employeeName: string;
    month: string;
    year: number;
    type: IncentiveType;
    amount: number;
    reason: string;
    createdBy: string;
  }): IncentiveRecord {
    const incentive: IncentiveRecord = {
      incentiveId: this.generateIncentiveId(),
      ...data,
      month: `${data.month} ${data.year}`,
      calculatedBy: "Manual",
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    this.saveIncentive(incentive);

    logger.log("IncentiveEngine: Manual incentive created", {
      incentiveId: incentive.incentiveId,
      amount: incentive.amount,
    });

    return incentive;
  }

  /**
   * Approve incentive
   */
  approveIncentive(incentiveId: string, approvedBy: string): IncentiveRecord | null {
    const incentives = this.getAllIncentives();
    const index = incentives.findIndex(i => i.incentiveId === incentiveId);

    if (index === -1) return null;

    incentives[index].status = "Approved";
    incentives[index].approvedBy = approvedBy;
    incentives[index].approvedAt = new Date().toISOString();

    DataService.setAll(this.STORAGE_KEY, incentives);
    return incentives[index];
  }

  /**
   * Reject incentive
   */
  rejectIncentive(
    incentiveId: string,
    rejectedBy: string,
    reason: string
  ): IncentiveRecord | null {
    const incentives = this.getAllIncentives();
    const index = incentives.findIndex(i => i.incentiveId === incentiveId);

    if (index === -1) return null;

    incentives[index].status = "Rejected";
    incentives[index].rejectedBy = rejectedBy;
    incentives[index].rejectedAt = new Date().toISOString();
    incentives[index].rejectionReason = reason;

    DataService.setAll(this.STORAGE_KEY, incentives);
    return incentives[index];
  }

  /**
   * Mark as paid
   */
  markAsPaid(incentiveId: string, paymentReference: string): IncentiveRecord | null {
    const incentives = this.getAllIncentives();
    const index = incentives.findIndex(i => i.incentiveId === incentiveId);

    if (index === -1) return null;

    incentives[index].status = "Paid";
    incentives[index].paidAt = new Date().toISOString();
    incentives[index].paymentReference = paymentReference;

    DataService.setAll(this.STORAGE_KEY, incentives);
    return incentives[index];
  }

  /**
   * Get all incentives
   */
  getAllIncentives(): IncentiveRecord[] {
    return DataService.get<IncentiveRecord>(this.STORAGE_KEY);
  }

  /**
   * Get by employee
   */
  getByEmployee(employeeId: string): IncentiveRecord[] {
    return this.getAllIncentives().filter(i => i.employeeId === employeeId);
  }

  /**
   * Get by month
   */
  getByMonth(month: string, year: number): IncentiveRecord[] {
    const monthStr = `${month} ${year}`;
    return this.getAllIncentives().filter(i => i.month === monthStr);
  }

  /**
   * Get by status
   */
  getByStatus(status: IncentiveStatus): IncentiveRecord[] {
    return this.getAllIncentives().filter(i => i.status === status);
  }

  /**
   * Get approved for payroll
   */
  getApprovedForPayroll(employeeId: string, month: string, year: number): IncentiveRecord[] {
    const monthStr = `${month} ${year}`;
    return this.getAllIncentives().filter(
      i =>
        i.employeeId === employeeId &&
        i.month === monthStr &&
        i.status === "Approved"
    );
  }

  /**
   * Get summary
   */
  getSummary(month?: string, year?: number): IncentiveSummary {
    let incentives = this.getAllIncentives();

    if (month && year) {
      const monthStr = `${month} ${year}`;
      incentives = incentives.filter(i => i.month === monthStr);
    }

    const summary: IncentiveSummary = {
      totalIncentives: incentives.length,
      totalAmount: incentives.reduce((sum, i) => sum + i.amount, 0),
      byType: {} as any,
      byStatus: {} as any,
      topEmployees: [],
    };

    // By type
    incentives.forEach(inc => {
      if (!summary.byType[inc.type]) {
        summary.byType[inc.type] = { count: 0, amount: 0 };
      }
      summary.byType[inc.type].count++;
      summary.byType[inc.type].amount += inc.amount;
    });

    // By status
    incentives.forEach(inc => {
      if (!summary.byStatus[inc.status]) {
        summary.byStatus[inc.status] = { count: 0, amount: 0 };
      }
      summary.byStatus[inc.status].count++;
      summary.byStatus[inc.status].amount += inc.amount;
    });

    // Top employees
    const employeeMap: Record<string, { name: string; totalAmount: number }> = {};
    incentives.forEach(inc => {
      if (!employeeMap[inc.employeeId]) {
        employeeMap[inc.employeeId] = { name: inc.employeeName, totalAmount: 0 };
      }
      employeeMap[inc.employeeId].totalAmount += inc.amount;
    });

    summary.topEmployees = Object.entries(employeeMap)
      .map(([employeeId, data]) => ({
        employeeId,
        name: data.name,
        totalAmount: data.totalAmount,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    return summary;
  }

  // ========== RULE MANAGEMENT ==========

  /**
   * Get all rules
   */
  getAllRules(): IncentiveRule[] {
    return DataService.get<IncentiveRule>(this.RULES_KEY);
  }

  /**
   * Create rule
   */
  createRule(data: Omit<IncentiveRule, "ruleId" | "createdAt" | "updatedAt">): IncentiveRule {
    const rule: IncentiveRule = {
      ...data,
      ruleId: `RULE-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const rules = this.getAllRules();
    DataService.setAll(this.RULES_KEY, [...rules, rule]);

    return rule;
  }

  /**
   * Create default rules
   */
  createDefaultRules(): void {
    const defaultRules: Omit<IncentiveRule, "ruleId" | "createdAt" | "updatedAt">[] = [
      {
        name: "Perfect Attendance Bonus",
        type: "Attendance Bonus",
        enabled: true,
        priority: 1,
        conditions: [{ field: "attendancePercentage", operator: ">=", value: 100 }],
        calculationType: "Fixed",
        fixedAmount: 2000,
        createdBy: "System",
      },
      {
        name: "Excellent Punctuality Bonus",
        type: "Punctuality Bonus",
        enabled: true,
        priority: 2,
        conditions: [{ field: "punctualityScore", operator: ">=", value: 95 }],
        calculationType: "Percentage",
        percentage: 5,
        createdBy: "System",
      },
      {
        name: "Overtime Bonus",
        type: "Overtime Bonus",
        enabled: true,
        priority: 3,
        conditions: [{ field: "overtimeHours", operator: ">", value: 10 }],
        calculationType: "Fixed",
        fixedAmount: 1500,
        createdBy: "System",
      },
    ];

    defaultRules.forEach(rule => this.createRule(rule));
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Get applicable rules
   */
  private getApplicableRules(cityId: string, roleId: string): IncentiveRule[] {
    return this.getAllRules()
      .filter(rule => rule.enabled)
      .filter(rule => {
        if (rule.applicableCities && !rule.applicableCities.includes(cityId)) {
          return false;
        }
        if (rule.applicableRoles && !rule.applicableRoles.includes(roleId)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(
    conditions: IncentiveCondition[],
    metrics: Record<string, any>
  ): boolean {
    return conditions.every(condition => {
      const actualValue = metrics[condition.field];
      if (actualValue === undefined) return false;

      switch (condition.operator) {
        case ">":
          return actualValue > condition.value;
        case ">=":
          return actualValue >= condition.value;
        case "<":
          return actualValue < condition.value;
        case "<=":
          return actualValue <= condition.value;
        case "==":
          return actualValue == condition.value;
        case "!=":
          return actualValue != condition.value;
        default:
          return false;
      }
    });
  }

  /**
   * Calculate amount
   */
  private calculateAmount(
    rule: IncentiveRule,
    baseSalary: number,
    metrics: Record<string, any>
  ): number {
    let amount = 0;

    switch (rule.calculationType) {
      case "Fixed":
        amount = rule.fixedAmount || 0;
        break;

      case "Percentage":
        amount = (baseSalary * (rule.percentage || 0)) / 100;
        break;

      case "Formula":
        // Simplified formula evaluation (would need proper parser for production)
        amount = 0;
        break;
    }

    // Apply limits
    if (rule.minAmount !== undefined) {
      amount = Math.max(amount, rule.minAmount);
    }
    if (rule.maxAmount !== undefined) {
      amount = Math.min(amount, rule.maxAmount);
    }

    return Math.round(amount);
  }

  /**
   * Get month number
   */
  private getMonthNumber(month: string): number {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return months.indexOf(month) + 1;
  }

  /**
   * Get days in month
   */
  private getDaysInMonth(month: string, year: number): number {
    const monthNum = this.getMonthNumber(month);
    return new Date(year, monthNum, 0).getDate();
  }

  /**
   * Generate incentive ID
   */
  private generateIncentiveId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `INC-${timestamp}-${random}`;
  }

  /**
   * Save incentive
   */
  private saveIncentive(incentive: IncentiveRecord): void {
    const incentives = this.getAllIncentives();
    incentives.push(incentive);
    DataService.setAll(this.STORAGE_KEY, incentives);
  }
}

// ========== EXPORT ==========

export const incentiveEngine = new IncentiveEngine();
