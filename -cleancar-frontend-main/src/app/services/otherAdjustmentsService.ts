/**
 * Other Adjustments Service
 *
 * Manages Other Earnings and Other Deductions for payroll adjustments.
 * These are ad-hoc additions/deductions applied to employee net pay during payroll processing.
 */

export type AdjustmentType = "OtherEarning" | "OtherDeduction";
export type AdjustmentStatus = "Pending" | "Approved" | "Rejected" | "Applied";

export interface OtherAdjustment {
  id: string;                    // e.g. "OE-2026-0001" / "OD-2026-0001"
  type: AdjustmentType;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  city: string;
  amount: number;                // Always positive. Type determines add/deduct.
  reason: string;               // Free-text reason entered by HR
  category: string;             // See category lists below
  payrollMonth: string;         // "April 2026" — the month it applies to
  payrollYear: number;
  createdBy: string;            // HR user who entered it
  createdAt: string;            // ISO date string
  status: AdjustmentStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  appliedInPayrollRunId?: string; // Set when payroll is processed
}

// Categories for earnings
export const EARNING_CATEGORIES = [
  "Performance bonus",
  "Festival bonus",
  "Attendance incentive",
  "Referral bonus",
  "Special allowance",
  "Retention bonus",
  "Back pay / arrears",
  "Other",
];

// Categories for deductions
export const DEDUCTION_CATEGORIES = [
  "Loan repayment",
  "Uniform / equipment cost recovery",
  "Damage recovery",
  "Absence without leave",
  "Disciplinary deduction",
  "Voluntary deduction",
  "Other",
];

class OtherAdjustmentsService {
  private readonly STORAGE_KEY = "cleancar_other_adjustments";

  private getAll(): OtherAdjustment[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private save(records: OtherAdjustment[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
  }

  private generateId(type: AdjustmentType): string {
    const prefix = type === "OtherEarning" ? "OE" : "OD";
    const existing = this.getAll().filter(r => r.type === type).length;
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${String(existing + 1).padStart(4, "0")}`;
  }

  create(data: Omit<OtherAdjustment, "id" | "createdAt" | "status">): OtherAdjustment {
    const record: OtherAdjustment = {
      ...data,
      id: this.generateId(data.type),
      createdAt: new Date().toISOString(),
      status: "Pending",
    };
    this.save([...this.getAll(), record]);
    return record;
  }

  approve(id: string, approvedBy: string): void {
    this.save(this.getAll().map(r =>
      r.id === id ? { ...r, status: "Approved" as AdjustmentStatus, approvedBy, approvedAt: new Date().toISOString() } : r
    ));
  }

  reject(id: string, reason: string): void {
    this.save(this.getAll().map(r =>
      r.id === id ? { ...r, status: "Rejected" as AdjustmentStatus, rejectedReason: reason } : r
    ));
  }

  markApplied(id: string, payrollRunId: string): void {
    this.save(this.getAll().map(r =>
      r.id === id ? { ...r, status: "Applied" as AdjustmentStatus, appliedInPayrollRunId: payrollRunId } : r
    ));
  }

  getAllEarnings(): OtherAdjustment[] {
    return this.getAll().filter(r => r.type === "OtherEarning");
  }

  getAllDeductions(): OtherAdjustment[] {
    return this.getAll().filter(r => r.type === "OtherDeduction");
  }

  getByEmployee(employeeId: string): OtherAdjustment[] {
    return this.getAll().filter(r => r.employeeId === employeeId);
  }

  getApprovedForPayrollMonth(month: string, year: number): OtherAdjustment[] {
    return this.getAll().filter(r =>
      r.status === "Approved" &&
      r.payrollMonth === `${month} ${year}`
    );
  }

  getPending(): OtherAdjustment[] {
    return this.getAll().filter(r => r.status === "Pending");
  }
}

export const otherAdjustmentsService = new OtherAdjustmentsService();
