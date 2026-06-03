/**
 * Incentive Ledger - Unified Incentive Structure
 *
 * Single source of truth for incentive/bonus data
 * Links to EmployeeMaster via employeeId
 */

import { DataService } from "./DataService";
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

/**
 * Unified Incentive Ledger Record
 * All incentive/bonus records should reference employeeId from EmployeeMaster
 */
export interface IncentiveLedger {
  // Core Identity
  incentiveId: string;           // Primary key
  employeeId: string;            // FK to EmployeeMaster (MANDATORY)

  // Period
  month: string;                 // "April"
  year: number;                  // 2026

  // Incentive Details
  type: IncentiveType;
  amount: number;
  reason: string;
  calculatedBy: "Auto" | "Manual";

  // Auto-calculation metrics (when calculatedBy = "Auto")
  metrics?: {
    attendancePercentage?: number;
    punctualityScore?: number;
    performanceRating?: number;
    salesAchieved?: number;
    salesTarget?: number;
    overtimeHours?: number;
    customMetric?: string;
  };

  // Approval Workflow
  status: IncentiveStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  // Payment
  paidAt?: string;
  paymentReference?: string;
  payrollId?: string;             // FK to PayrollMaster (if paid via payroll)

  // Metadata
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Legacy incentive record for backward compatibility
 */
export interface LegacyIncentiveRecord {
  incentiveId?: string;
  employeeId: string;
  employeeName?: string;
  month: string;
  year: number;
  type: IncentiveType;
  amount: number;
  reason: string;
  calculatedBy?: "Auto" | "Manual";
  status?: IncentiveStatus;
  createdAt?: string;
}

// ========== SERVICE ==========

class IncentiveLedgerService {
  private readonly STORAGE_KEY = "INCENTIVE_LEDGER";

  /**
   * Get all incentive ledger records
   */
  getAll(): IncentiveLedger[] {
    return DataService.get<IncentiveLedger>(this.STORAGE_KEY);
  }

  /**
   * Get incentive by ID
   */
  getById(incentiveId: string): IncentiveLedger | null {
    const records = this.getAll();
    return records.find(rec => rec.incentiveId === incentiveId) || null;
  }

  /**
   * Get incentive records by employee
   */
  getByEmployee(employeeId: string): IncentiveLedger[] {
    return this.getAll().filter(rec => rec.employeeId === employeeId);
  }

  /**
   * Get incentive records for period
   */
  getByPeriod(month: string, year: number): IncentiveLedger[] {
    return this.getAll().filter(rec => rec.month === month && rec.year === year);
  }

  /**
   * Get incentive for specific employee and period
   */
  getByEmployeeAndPeriod(employeeId: string, month: string, year: number): IncentiveLedger[] {
    return this.getAll().filter(rec =>
      rec.employeeId === employeeId &&
      rec.month === month &&
      rec.year === year
    );
  }

  /**
   * Get incentive by status
   */
  getByStatus(status: IncentiveStatus): IncentiveLedger[] {
    return this.getAll().filter(rec => rec.status === status);
  }

  /**
   * Get incentive by type
   */
  getByType(type: IncentiveType): IncentiveLedger[] {
    return this.getAll().filter(rec => rec.type === type);
  }

  /**
   * Create incentive ledger record
   */
  create(data: Omit<IncentiveLedger, "incentiveId" | "createdAt">): IncentiveLedger {
    // VALIDATION: employeeId is mandatory
    if (!data.employeeId) {
      throw new Error("IncentiveLedger: employeeId is required");
    }

    const now = new Date().toISOString();
    const newRecord: IncentiveLedger = {
      ...data,
      incentiveId: this.generateIncentiveId(),
      createdAt: now,
    };

    const records = this.getAll();
    DataService.setAll(this.STORAGE_KEY, [...records, newRecord]);

    logger.log("IncentiveLedger: Created incentive record", {
      incentiveId: newRecord.incentiveId,
      employeeId: newRecord.employeeId
    });
    return newRecord;
  }

  /**
   * Update incentive ledger record
   */
  update(incentiveId: string, updates: Partial<Omit<IncentiveLedger, "incentiveId" | "createdAt">>): IncentiveLedger | null {
    const records = this.getAll();
    const index = records.findIndex(rec => rec.incentiveId === incentiveId);

    if (index === -1) {
      logger.error("IncentiveLedger: Record not found", { incentiveId });
      return null;
    }

    const updatedRecord: IncentiveLedger = {
      ...records[index],
      ...updates,
      incentiveId, // Prevent ID change
      createdAt: records[index].createdAt, // Preserve creation time
      updatedAt: new Date().toISOString(),
    };

    records[index] = updatedRecord;
    DataService.setAll(this.STORAGE_KEY, records);

    logger.log("IncentiveLedger: Updated incentive record", { incentiveId });
    return updatedRecord;
  }

  /**
   * Approve incentive
   */
  approve(incentiveId: string, approvedBy: string): IncentiveLedger | null {
    return this.update(incentiveId, {
      status: "Approved",
      approvedBy,
      approvedAt: new Date().toISOString(),
    });
  }

  /**
   * Reject incentive
   */
  reject(incentiveId: string, rejectedBy: string, rejectionReason: string): IncentiveLedger | null {
    return this.update(incentiveId, {
      status: "Rejected",
      rejectedBy,
      rejectedAt: new Date().toISOString(),
      rejectionReason,
    });
  }

  /**
   * Mark as paid
   */
  markAsPaid(incentiveId: string, paymentDetails: {
    paidAt: string;
    paymentReference?: string;
    payrollId?: string;
  }): IncentiveLedger | null {
    return this.update(incentiveId, {
      status: "Paid",
      ...paymentDetails,
    });
  }

  /**
   * Delete incentive ledger record
   */
  delete(incentiveId: string): void {
    const records = this.getAll();
    const filtered = records.filter(rec => rec.incentiveId !== incentiveId);
    DataService.setAll(this.STORAGE_KEY, filtered);
    logger.log("IncentiveLedger: Deleted incentive record", { incentiveId });
  }

  /**
   * Generate unique incentive ID
   */
  private generateIncentiveId(): string {
    const timestamp = Date.now();
    const random = (0.72).toString(36).substr(2, 6).toUpperCase();
    return `INC-${timestamp}-${random}`;
  }

  /**
   * Get summary statistics
   */
  getSummary(month: string, year: number): {
    totalIncentives: number;
    totalAmount: number;
    byStatus: Record<IncentiveStatus, { count: number; amount: number }>;
    byType: Record<IncentiveType, { count: number; amount: number }>;
    topEmployees: { employeeId: string; totalAmount: number }[];
  } {
    const records = this.getByPeriod(month, year);

    // Status breakdown
    const byStatus: Record<IncentiveStatus, { count: number; amount: number }> = {
      Pending: { count: 0, amount: 0 },
      Approved: { count: 0, amount: 0 },
      Paid: { count: 0, amount: 0 },
      Rejected: { count: 0, amount: 0 },
    };

    records.forEach(rec => {
      byStatus[rec.status].count++;
      byStatus[rec.status].amount += rec.amount;
    });

    // Type breakdown
    const byTypeMap = new Map<IncentiveType, { count: number; amount: number }>();
    records.forEach(rec => {
      if (!byTypeMap.has(rec.type)) {
        byTypeMap.set(rec.type, { count: 0, amount: 0 });
      }
      const current = byTypeMap.get(rec.type)!;
      current.count++;
      current.amount += rec.amount;
    });
    const byType = Object.fromEntries(byTypeMap) as Record<IncentiveType, { count: number; amount: number }>;

    // Top employees
    const employeeMap = new Map<string, number>();
    records
      .filter(rec => rec.status === "Approved" || rec.status === "Paid")
      .forEach(rec => {
        employeeMap.set(rec.employeeId, (employeeMap.get(rec.employeeId) || 0) + rec.amount);
      });

    const topEmployees = Array.from(employeeMap.entries())
      .map(([employeeId, totalAmount]) => ({ employeeId, totalAmount }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    return {
      totalIncentives: records.length,
      totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
      byStatus,
      byType,
      topEmployees,
    };
  }

  /**
   * Bulk create incentives for multiple employees
   */
  bulkCreate(records: Omit<IncentiveLedger, "incentiveId" | "createdAt">[]): IncentiveLedger[] {
    return records.map(rec => this.create(rec));
  }

  /**
   * Bulk approve incentives
   */
  bulkApprove(incentiveIds: string[], approvedBy: string): IncentiveLedger[] {
    return incentiveIds
      .map(id => this.approve(id, approvedBy))
      .filter(rec => rec !== null) as IncentiveLedger[];
  }
}

// ========== ADAPTER LAYER ==========

/**
 * Adapter to convert legacy incentive format to IncentiveLedger
 */
export class IncentiveAdapter {
  /**
   * Convert legacy incentive to IncentiveLedger
   */
  static toMaster(legacy: LegacyIncentiveRecord, createdBy: string = "system"): IncentiveLedger {
    return {
      incentiveId: legacy.incentiveId || `INC-LEGACY-${Date.now()}`,
      employeeId: legacy.employeeId,
      month: legacy.month,
      year: legacy.year,
      type: legacy.type,
      amount: legacy.amount,
      reason: legacy.reason,
      calculatedBy: legacy.calculatedBy || "Manual",
      status: legacy.status || "Pending",
      createdAt: legacy.createdAt || new Date().toISOString(),
      createdBy,
    };
  }

  /**
   * Convert IncentiveLedger to legacy format
   */
  static toLegacy(master: IncentiveLedger, employeeName?: string): LegacyIncentiveRecord {
    return {
      incentiveId: master.incentiveId,
      employeeId: master.employeeId,
      employeeName,
      month: master.month,
      year: master.year,
      type: master.type,
      amount: master.amount,
      reason: master.reason,
      calculatedBy: master.calculatedBy,
      status: master.status,
      createdAt: master.createdAt,
    };
  }

  /**
   * Batch convert legacy to master
   */
  static batchToMaster(legacy: LegacyIncentiveRecord[], createdBy: string = "system"): IncentiveLedger[] {
    return legacy.map(rec => this.toMaster(rec, createdBy));
  }

  /**
   * Batch convert master to legacy
   */
  static batchToLegacy(masters: IncentiveLedger[]): LegacyIncentiveRecord[] {
    return masters.map(rec => this.toLegacy(rec));
  }
}

// ========== EXPORT ==========

export const incentiveLedgerService = new IncentiveLedgerService();

// Alias for backward compatibility
export const incentiveLedger = incentiveLedgerService;
