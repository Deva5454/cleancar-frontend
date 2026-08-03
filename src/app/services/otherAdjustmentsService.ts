/**
 * Other Adjustments Service
 *
 * Manages Other Earnings and Other Deductions for payroll adjustments.
 * These are ad-hoc additions/deductions applied to employee net pay during payroll processing.
 * Approved records ARE wired into PayrollRun.tsx's real per-employee net-pay
 * math (getApprovedForPayrollMonth, consumed there and marked "Applied").
 *
 * Real fix: this used to bypass DataService entirely, reading/writing a
 * single hardcoded global localStorage key with no per-city namespacing —
 * every city's requests shared one bucket despite each record carrying its
 * own real .city field, so HR in one city could see and approve another
 * city's pending requests. Now backed by DataService's registered
 * OTHER_ADJUSTMENTS entity type, city-scoped like every other service.
 *
 * Also adds the same "auto-reject if still pending when payroll closes"
 * policy already built for attendance regularization / comp-off leave /
 * travel reimbursement (autoRejectPendingForPayrollPeriod), called from
 * both PayrollRun.tsx (generation) and PayrollReviewApproval.tsx (HR
 * approval) — previously a still-Pending Other Earning/Deduction was
 * silently ignored with no flag of any kind.
 */

import { DataService } from "./DataService";

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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

class OtherAdjustmentsService {
  private getAll(cityId?: string): OtherAdjustment[] {
    return cityId
      ? DataService.get<OtherAdjustment>("OTHER_ADJUSTMENTS", cityId)
      : DataService.getAllCities<OtherAdjustment>("OTHER_ADJUSTMENTS");
  }

  private save(cityId: string, records: OtherAdjustment[]): void {
    DataService.setAll("OTHER_ADJUSTMENTS", records, cityId);
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
    const cityId = data.city;
    this.save(cityId, [...this.getAll(cityId), record]);
    return record;
  }

  approve(id: string, approvedBy: string): void {
    const all = this.getAll();
    const record = all.find(r => r.id === id);
    if (!record) return;
    const cityRecords = this.getAll(record.city).map(r =>
      r.id === id ? { ...r, status: "Approved" as AdjustmentStatus, approvedBy, approvedAt: new Date().toISOString() } : r
    );
    this.save(record.city, cityRecords);
  }

  reject(id: string, reason: string): void {
    const all = this.getAll();
    const record = all.find(r => r.id === id);
    if (!record) return;
    const cityRecords = this.getAll(record.city).map(r =>
      r.id === id ? { ...r, status: "Rejected" as AdjustmentStatus, rejectedReason: reason } : r
    );
    this.save(record.city, cityRecords);
  }

  markApplied(id: string, payrollRunId: string): void {
    const all = this.getAll();
    const record = all.find(r => r.id === id);
    if (!record) return;
    const cityRecords = this.getAll(record.city).map(r =>
      r.id === id ? { ...r, status: "Applied" as AdjustmentStatus, appliedInPayrollRunId: payrollRunId } : r
    );
    this.save(record.city, cityRecords);
  }

  getAllEarnings(cityId?: string): OtherAdjustment[] {
    return this.getAll(cityId).filter(r => r.type === "OtherEarning");
  }

  getAllDeductions(cityId?: string): OtherAdjustment[] {
    return this.getAll(cityId).filter(r => r.type === "OtherDeduction");
  }

  getByEmployee(employeeId: string): OtherAdjustment[] {
    return this.getAll().filter(r => r.employeeId === employeeId);
  }

  getApprovedForPayrollMonth(month: string, year: number, cityId?: string): OtherAdjustment[] {
    return this.getAll(cityId).filter(r =>
      r.status === "Approved" &&
      r.payrollMonth === `${month} ${year}`
    );
  }

  getPending(cityId?: string): OtherAdjustment[] {
    return this.getAll(cityId).filter(r => r.status === "Pending");
  }

  private monthYearValue(payrollMonth: string, payrollYear: number): number {
    const idx = MONTH_NAMES.indexOf((payrollMonth || "").split(" ")[0]);
    return payrollYear * 100 + (idx >= 0 ? idx + 1 : 0);
  }

  /**
   * Real, confirmed policy — same as regularization/comp-off/travel: any
   * Other Earning/Deduction still Pending for this city, for this payroll
   * month or any earlier one, auto-rejects the instant payroll closes for
   * that month rather than being silently ignored forever.
   */
  autoRejectPendingForPayrollPeriod(cityId: string, month: string, year: number): number {
    const closingValue = this.monthYearValue(month, year);
    const cityRecords = this.getAll(cityId);
    let count = 0;
    const updated = cityRecords.map(r => {
      if (r.status === "Pending" && this.monthYearValue(r.payrollMonth, r.payrollYear) <= closingValue) {
        count++;
        return {
          ...r,
          status: "Rejected" as AdjustmentStatus,
          rejectedReason: "Auto-rejected: payroll approved before this request was resolved",
        };
      }
      return r;
    });
    if (count > 0) this.save(cityId, updated);
    return count;
  }
}

export const otherAdjustmentsService = new OtherAdjustmentsService();
