/**
 * Payroll Master - Unified Payroll Structure
 *
 * Single source of truth for payroll data
 * Links to EmployeeMaster via employeeId
 */

import { DataService } from "./DataService";
import { logger } from "./logger";

// ========== TYPES ==========

export type PayrollStatus = "Draft" | "Processed" | "Approved" | "Paid" | "Rejected";

/**
 * Unified Payroll Master Record
 * All payroll processing should reference employeeId from EmployeeMaster
 */
export interface PayrollMaster {
  // Core Identity
  payrollId: string;             // Primary key
  employeeId: string;            // FK to EmployeeMaster (MANDATORY)

  // Period
  month: string;                 // "April"
  year: number;                  // 2026
  payPeriodStart: string;        // YYYY-MM-DD
  payPeriodEnd: string;          // YYYY-MM-DD

  // Earnings
  basicSalary: number;
  allowances: {
    name: string;
    amount: number;
  }[];
  bonuses: {
    name: string;
    amount: number;
  }[];
  overtimePay: number;
  grossPay: number;              // Total earnings

  // Deductions
  deductions: {
    name: string;
    amount: number;
    type: "Statutory" | "Voluntary" | "Advance";
  }[];
  totalDeductions: number;

  // Statutory
  epf: {
    employeeContribution: number;
    employerContribution: number;
  };
  esic: {
    employeeContribution: number;
    employerContribution: number;
  };
  professionalTax: number;
  tds: number;

  // Net Pay
  netPay: number;                // Gross - Total Deductions

  // Attendance Impact
  payDays: number;
  totalDays: number;
  lop: number;                   // Loss of Pay days
  lopAmount: number;

  // Status & Approval
  status: PayrollStatus;
  processedBy?: string;
  processedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  // Payment
  paymentDate?: string;
  paymentMode?: "Bank Transfer" | "Cash" | "Cheque";
  paymentReference?: string;
  utr?: string;

  // Metadata
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Legacy payroll record for backward compatibility
 */
export interface LegacyPayrollRecord {
  payrollId?: string;
  employeeId: string;
  month: number;
  year: number;
  earnings: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status?: string;
  paymentDate?: string;
}

// ========== SERVICE ==========

class PayrollMasterService {
  private readonly STORAGE_KEY = "PAYROLL_MASTER";

  /**
   * Get all payroll master records
   */
  getAll(): PayrollMaster[] {
    return DataService.get<PayrollMaster>(this.STORAGE_KEY);
  }

  /**
   * Get payroll by ID
   */
  getById(payrollId: string): PayrollMaster | null {
    const records = this.getAll();
    return records.find(rec => rec.payrollId === payrollId) || null;
  }

  /**
   * Get payroll records by employee
   */
  getByEmployee(employeeId: string): PayrollMaster[] {
    return this.getAll().filter(rec => rec.employeeId === employeeId);
  }

  /**
   * Get payroll records for period
   */
  getByPeriod(month: string, year: number): PayrollMaster[] {
    return this.getAll().filter(rec => rec.month === month && rec.year === year);
  }

  /**
   * Get payroll for specific employee and period
   */
  getByEmployeeAndPeriod(employeeId: string, month: string, year: number): PayrollMaster | null {
    const records = this.getAll();
    return records.find(rec =>
      rec.employeeId === employeeId &&
      rec.month === month &&
      rec.year === year
    ) || null;
  }

  /**
   * Get payroll by status
   */
  getByStatus(status: PayrollStatus): PayrollMaster[] {
    return this.getAll().filter(rec => rec.status === status);
  }

  /**
   * Create payroll master record
   */
  create(data: Omit<PayrollMaster, "payrollId" | "createdAt">): PayrollMaster {
    // VALIDATION: employeeId is mandatory
    if (!data.employeeId) {
      throw new Error("PayrollMaster: employeeId is required");
    }

    const now = new Date().toISOString();
    const newRecord: PayrollMaster = {
      ...data,
      payrollId: this.generatePayrollId(),
      createdAt: now,
    };

    const records = this.getAll();
    DataService.setAll(this.STORAGE_KEY, [...records, newRecord]);

    logger.log("PayrollMaster: Created payroll record", {
      payrollId: newRecord.payrollId,
      employeeId: newRecord.employeeId
    });
    return newRecord;
  }

  /**
   * Update payroll master record
   */
  update(payrollId: string, updates: Partial<Omit<PayrollMaster, "payrollId" | "createdAt">>): PayrollMaster | null {
    const records = this.getAll();
    const index = records.findIndex(rec => rec.payrollId === payrollId);

    if (index === -1) {
      logger.error("PayrollMaster: Record not found", { payrollId });
      return null;
    }

    const updatedRecord: PayrollMaster = {
      ...records[index],
      ...updates,
      payrollId, // Prevent ID change
      createdAt: records[index].createdAt, // Preserve creation time
      updatedAt: new Date().toISOString(),
    };

    records[index] = updatedRecord;
    DataService.setAll(this.STORAGE_KEY, records);

    logger.log("PayrollMaster: Updated payroll record", { payrollId });
    return updatedRecord;
  }

  /**
   * Approve payroll
   */
  approve(payrollId: string, approvedBy: string): PayrollMaster | null {
    return this.update(payrollId, {
      status: "Approved",
      approvedBy,
      approvedAt: new Date().toISOString(),
    });
  }

  /**
   * Mark as paid
   */
  markAsPaid(payrollId: string, paymentDetails: {
    paymentDate: string;
    paymentMode: PayrollMaster["paymentMode"];
    paymentReference?: string;
    utr?: string;
  }): PayrollMaster | null {
    return this.update(payrollId, {
      status: "Paid",
      ...paymentDetails,
    });
  }

  /**
   * Delete payroll master record
   */
  delete(payrollId: string): void {
    const records = this.getAll();
    const filtered = records.filter(rec => rec.payrollId !== payrollId);
    DataService.setAll(this.STORAGE_KEY, filtered);
    logger.log("PayrollMaster: Deleted payroll record", { payrollId });
  }

  /**
   * Generate unique payroll ID
   */
  private generatePayrollId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  /**
   * Get summary statistics
   */
  getSummary(month: string, year: number): {
    totalEmployees: number;
    totalGrossPay: number;
    totalNetPay: number;
    totalDeductions: number;
    byStatus: Record<PayrollStatus, number>;
  } {
    const records = this.getByPeriod(month, year);

    return {
      totalEmployees: records.length,
      totalGrossPay: records.reduce((sum, r) => sum + r.grossPay, 0),
      totalNetPay: records.reduce((sum, r) => sum + r.netPay, 0),
      totalDeductions: records.reduce((sum, r) => sum + r.totalDeductions, 0),
      byStatus: {
        Draft: records.filter(r => r.status === "Draft").length,
        Processed: records.filter(r => r.status === "Processed").length,
        Approved: records.filter(r => r.status === "Approved").length,
        Paid: records.filter(r => r.status === "Paid").length,
        Rejected: records.filter(r => r.status === "Rejected").length,
      },
    };
  }
}

// ========== ADAPTER LAYER ==========

/**
 * Adapter to convert legacy payroll format to PayrollMaster
 */
export class PayrollAdapter {
  /**
   * Convert legacy payroll to PayrollMaster
   */
  static toMaster(legacy: LegacyPayrollRecord): PayrollMaster {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    const month = monthNames[legacy.month - 1] || "January";

    // Calculate period dates
    const periodStart = `${legacy.year}-${String(legacy.month).padStart(2, '0')}-01`;
    const lastDay = new Date(legacy.year, legacy.month, 0).getDate();
    const periodEnd = `${legacy.year}-${String(legacy.month).padStart(2, '0')}-${lastDay}`;

    // Separate earnings into categories
    const basicSalary = legacy.earnings.find(e => e.name.includes("Basic"))?.amount || 0;
    const allowances = legacy.earnings.filter(e =>
      !e.name.includes("Basic") && !e.name.includes("Bonus")
    );
    const bonuses = legacy.earnings.filter(e => e.name.includes("Bonus"));

    // Categorize deductions
    const deductions = legacy.deductions.map(d => ({
      name: d.name,
      amount: d.amount,
      type: (d.name.includes("EPF") || d.name.includes("ESIC") || d.name.includes("TDS") ? "Statutory" : "Voluntary") as const,
    }));

    return {
      payrollId: legacy.payrollId || `PAY-LEGACY-${Date.now()}`,
      employeeId: legacy.employeeId,
      month,
      year: legacy.year,
      payPeriodStart: periodStart,
      payPeriodEnd: periodEnd,
      basicSalary,
      allowances,
      bonuses,
      overtimePay: 0,
      grossPay: legacy.grossPay,
      deductions,
      totalDeductions: legacy.totalDeductions,
      epf: {
        employeeContribution: legacy.deductions.find(d => d.name.includes("EPF"))?.amount || 0,
        employerContribution: 0,
      },
      esic: {
        employeeContribution: legacy.deductions.find(d => d.name.includes("ESIC"))?.amount || 0,
        employerContribution: 0,
      },
      professionalTax: legacy.deductions.find(d => d.name.includes("PT"))?.amount || 0,
      tds: legacy.deductions.find(d => d.name.includes("TDS"))?.amount || 0,
      netPay: legacy.netPay,
      payDays: 0,
      totalDays: 0,
      lop: 0,
      lopAmount: 0,
      status: (legacy.status as PayrollStatus) || "Draft",
      paymentDate: legacy.paymentDate,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Convert PayrollMaster to legacy format
   */
  static toLegacy(master: PayrollMaster): LegacyPayrollRecord {
    const monthNumber = new Date(`${master.month} 1, ${master.year}`).getMonth() + 1;

    const earnings = [
      { name: "Basic Salary", amount: master.basicSalary },
      ...master.allowances,
      ...master.bonuses,
      ...(master.overtimePay > 0 ? [{ name: "Overtime Pay", amount: master.overtimePay }] : []),
    ];

    const deductions = master.deductions.map(d => ({
      name: d.name,
      amount: d.amount,
    }));

    return {
      payrollId: master.payrollId,
      employeeId: master.employeeId,
      month: monthNumber,
      year: master.year,
      earnings,
      deductions,
      grossPay: master.grossPay,
      totalDeductions: master.totalDeductions,
      netPay: master.netPay,
      status: master.status,
      paymentDate: master.paymentDate,
    };
  }

  /**
   * Batch convert legacy to master
   */
  static batchToMaster(legacy: LegacyPayrollRecord[]): PayrollMaster[] {
    return legacy.map(rec => this.toMaster(rec));
  }

  /**
   * Batch convert master to legacy
   */
  static batchToLegacy(masters: PayrollMaster[]): LegacyPayrollRecord[] {
    return masters.map(rec => this.toLegacy(rec));
  }
}

// ========== EXPORT ==========

export const payrollMasterService = new PayrollMasterService();

// Alias for backward compatibility
export const payrollMaster = payrollMasterService;
