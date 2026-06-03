/**
 * ATTENDANCE PENALTY SERVICE
 * Manages PLRG/HPLRG adjustments and LWP conversions
 */

import {
  type AttendanceViolation,
  type ViolationType,
  type PenaltyType,
  shouldApplyPenalty,
  getViolationDescription,
  getMonthlySummary,
} from "../config/attendancePenaltyPolicy";
import { leaveBalanceService } from "./leaveBalanceService";

// Re-export types for convenience
export type { AttendanceViolation, ViolationType, PenaltyType } from "../config/attendancePenaltyPolicy";

class AttendancePenaltyService {
  private violations: AttendanceViolation[] = [];
  private penaltyCounter = 1;

  constructor() {
    this.initializeSampleData();
  }

  /**
   * Initialize with sample violation data
   */
  private initializeSampleData() {
    // Sample violations for demonstration
    const sampleViolations: AttendanceViolation[] = [
      {
        id: "VIOL-001",
        employeeId: "CW-001",
        employeeName: "Rajesh Kumar",
        date: "2026-04-01",
        violationType: "LATE_COMING",
        details: "Arrived at 9:25 AM (25 mins late)",
        penaltyApplied: "HPLRG",
        penaltyDays: 0.5,
        plBalanceBefore: 10,
        plBalanceAfter: 9.5,
        convertedToLWP: false,
        status: "Applied",
        appliedBy: "System",
        appliedOn: "2026-04-01",
      },
      {
        id: "VIOL-002",
        employeeId: "CW-001",
        employeeName: "Rajesh Kumar",
        date: "2026-04-03",
        violationType: "MISS_PUNCH",
        details: "Missing OUT punch",
        penaltyApplied: "HPLRG",
        penaltyDays: 0.5,
        plBalanceBefore: 9.5,
        plBalanceAfter: 9,
        convertedToLWP: false,
        status: "Applied",
        appliedBy: "System",
        appliedOn: "2026-04-03",
      },
      {
        id: "VIOL-003",
        employeeId: "SUP-001",
        employeeName: "Amit Verma",
        date: "2026-04-05",
        violationType: "SHORT_HOURS",
        details: "Worked only 4 hours (< 4.5 hrs minimum)",
        penaltyApplied: "HPLRG",
        penaltyDays: 0.5,
        plBalanceBefore: 8,
        plBalanceAfter: 7.5,
        convertedToLWP: false,
        status: "Applied",
        appliedBy: "System",
        appliedOn: "2026-04-05",
      },
    ];

    this.violations = sampleViolations;
  }

  /**
   * Record attendance violation and apply penalty
   */
  recordViolation(params: {
    employeeId: string;
    employeeName: string;
    date: string;
    violationType: ViolationType;
    details: string;
    appliedBy: string;
  }): {
    success: boolean;
    violation?: AttendanceViolation;
    message: string;
  } {
    // Get employee's current PL balance
    const employeeBalance = leaveBalanceService.getEmployeeBalance(params.employeeId);
    if (!employeeBalance) {
      return {
        success: false,
        message: "Employee not found",
      };
    }

    const currentPLBalance = employeeBalance.balances.PL?.available || 0;

    // Count violations of this type in current month
    const currentMonth = params.date.substring(0, 7); // YYYY-MM
    const monthViolations = this.violations.filter(
      v => v.employeeId === params.employeeId &&
           v.violationType === params.violationType &&
           v.date.startsWith(currentMonth) &&
           v.status === "Applied"
    );

    const violationCount = monthViolations.length + 1; // +1 for current violation

    // Check if penalty should be applied
    const penaltyCheck = shouldApplyPenalty(
      params.violationType,
      violationCount,
      currentPLBalance
    );

    if (!penaltyCheck.shouldApply) {
      return {
        success: false,
        message: penaltyCheck.reason,
      };
    }

    // Create violation record
    const newViolation: AttendanceViolation = {
      id: `VIOL-${String(this.penaltyCounter++).padStart(3, "0")}`,
      employeeId: params.employeeId,
      employeeName: params.employeeName,
      date: params.date,
      violationType: params.violationType,
      details: params.details,
      penaltyApplied: penaltyCheck.penaltyType,
      penaltyDays: penaltyCheck.penaltyDays,
      plBalanceBefore: currentPLBalance,
      plBalanceAfter: penaltyCheck.convertToLWP 
        ? currentPLBalance 
        : currentPLBalance - penaltyCheck.penaltyDays,
      convertedToLWP: penaltyCheck.convertToLWP,
      status: "Applied",
      appliedBy: params.appliedBy,
      appliedOn: new Date().toISOString().split('T')[0],
    };

    // Apply the penalty deduction
    if (!penaltyCheck.convertToLWP) {
      // Deduct from PL
      const deductResult = leaveBalanceService.deductLeave(
        params.employeeId,
        "PL",
        penaltyCheck.penaltyDays,
        `Attendance Penalty: ${getViolationDescription(params.violationType)} on ${params.date}`
      );

      if (!deductResult.success) {
        return {
          success: false,
          message: "Failed to deduct PL: " + deductResult.error,
        };
      }
    } else {
      // Record as LWP
      // Note: LWP is unlimited, so we just record the usage
      leaveBalanceService.recordLWPUsage(
        params.employeeId,
        penaltyCheck.penaltyDays,
        `Attendance Penalty (Converted from PLRG): ${params.details}`
      );
    }

    this.violations.push(newViolation);

    return {
      success: true,
      violation: newViolation,
      message: penaltyCheck.convertToLWP
        ? `Penalty applied as LWP (${penaltyCheck.penaltyDays} days) - Insufficient PL balance`
        : `Penalty applied: ${penaltyCheck.penaltyType} (${penaltyCheck.penaltyDays} days)`,
    };
  }

  /**
   * Get employee violations for a specific month
   */
  getEmployeeViolations(employeeId: string, month?: string): AttendanceViolation[] {
    let filtered = this.violations.filter(v => v.employeeId === employeeId);

    if (month) {
      filtered = filtered.filter(v => v.date.startsWith(month));
    }

    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Get all violations (for HR/Admin)
   */
  getAllViolations(filters?: {
    status?: AttendanceViolation["status"];
    violationType?: ViolationType;
    fromDate?: string;
    toDate?: string;
  }): AttendanceViolation[] {
    let filtered = [...this.violations];

    if (filters?.status) {
      filtered = filtered.filter(v => v.status === filters.status);
    }

    if (filters?.violationType) {
      filtered = filtered.filter(v => v.violationType === filters.violationType);
    }

    if (filters?.fromDate) {
      filtered = filtered.filter(v => v.date >= filters.fromDate!);
    }

    if (filters?.toDate) {
      filtered = filtered.filter(v => v.date <= filters.toDate!);
    }

    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Get monthly summary for employee
   */
  getEmployeeMonthlySummary(employeeId: string, month: string) {
    const monthViolations = this.getEmployeeViolations(employeeId, month);
    return getMonthlySummary(monthViolations);
  }

  /**
   * HR Waiver - Waive a penalty
   */
  waiverPenalty(
    violationId: string,
    waivedBy: string,
    waiverReason: string
  ): { success: boolean; message: string } {
    const violation = this.violations.find(v => v.id === violationId);

    if (!violation) {
      return {
        success: false,
        message: "Violation not found",
      };
    }

    if (violation.status === "Waived") {
      return {
        success: false,
        message: "Penalty already waived",
      };
    }

    // Credit back the PL if it was deducted
    if (!violation.convertedToLWP) {
      leaveBalanceService.creditLeave(
        violation.employeeId,
        "PL",
        violation.penaltyDays,
        `Penalty Waived: ${waiverReason}`
      );
    }

    // Update violation status
    violation.status = "Waived";
    violation.waivedBy = waivedBy;
    violation.waivedOn = new Date().toISOString().split('T')[0];
    violation.waiverReason = waiverReason;

    return {
      success: true,
      message: `Penalty waived successfully. ${!violation.convertedToLWP ? violation.penaltyDays + ' days credited back to PL.' : ''}`,
    };
  }

  /**
   * Get PL adjustments for display in leave balance card
   */
  getPLAdjustments(employeeId: string, month: string): {
    plrgCount: number;
    hplrgCount: number;
    totalDeducted: number;
    violations: AttendanceViolation[];
  } {
    const monthViolations = this.getEmployeeViolations(employeeId, month)
      .filter(v => v.status === "Applied" && !v.convertedToLWP);

    const plrgCount = monthViolations.filter(v => v.penaltyApplied === "PLRG").length;
    const hplrgCount = monthViolations.filter(v => v.penaltyApplied === "HPLRG").length;
    const totalDeducted = monthViolations.reduce((sum, v) => sum + v.penaltyDays, 0);

    return {
      plrgCount,
      hplrgCount,
      totalDeducted,
      violations: monthViolations,
    };
  }

  /**
   * Get LWP penalties (converted from PLRG when PL = 0)
   */
  getLWPPenalties(employeeId: string, month: string): {
    count: number;
    totalDays: number;
    violations: AttendanceViolation[];
  } {
    const lwpViolations = this.getEmployeeViolations(employeeId, month)
      .filter(v => v.status === "Applied" && v.convertedToLWP);

    return {
      count: lwpViolations.length,
      totalDays: lwpViolations.reduce((sum, v) => sum + v.penaltyDays, 0),
      violations: lwpViolations,
    };
  }

  /**
   * Get violation statistics
   */
  getViolationStats(params?: {
    employeeId?: string;
    month?: string;
  }): {
    totalViolations: number;
    byType: Record<ViolationType, number>;
    byPenalty: Record<PenaltyType, number>;
    totalPenaltyDays: number;
    convertedToLWP: number;
  } {
    let violations = [...this.violations];

    if (params?.employeeId) {
      violations = violations.filter(v => v.employeeId === params.employeeId);
    }

    if (params?.month) {
      violations = violations.filter(v => v.date.startsWith(params.month!));
    }

    const applied = violations.filter(v => v.status === "Applied");

    const byType: Record<ViolationType, number> = {
      LATE_COMING: 0,
      MISS_PUNCH: 0,
      SHORT_HOURS: 0,
      EARLY_DEPARTURE: 0,
      UNAUTHORIZED_ABSENCE: 0,
    };

    const byPenalty: Record<PenaltyType, number> = {
      PLRG: 0,
      HPLRG: 0,
      LWP_PENALTY: 0,
    };

    applied.forEach(v => {
      byType[v.violationType]++;
      byPenalty[v.penaltyApplied]++;
    });

    return {
      totalViolations: applied.length,
      byType,
      byPenalty,
      totalPenaltyDays: applied.reduce((sum, v) => sum + v.penaltyDays, 0),
      convertedToLWP: applied.filter(v => v.convertedToLWP).length,
    };
  }

  /**
   * Bulk import violations (for system integration)
   */
  bulkImportViolations(
    violations: Array<{
      employeeId: string;
      employeeName: string;
      date: string;
      violationType: ViolationType;
      details: string;
    }>
  ): {
    success: boolean;
    processed: number;
    failed: number;
    results: Array<{ employeeId: string; success: boolean; message: string }>;
  } {
    const results: Array<{ employeeId: string; success: boolean; message: string }> = [];
    let processed = 0;
    let failed = 0;

    violations.forEach(v => {
      const result = this.recordViolation({
        ...v,
        appliedBy: "System (Bulk Import)",
      });

      results.push({
        employeeId: v.employeeId,
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        processed++;
      } else {
        failed++;
      }
    });

    return {
      success: true,
      processed,
      failed,
      results,
    };
  }

  /**
   * Get violation by ID
   */
  getViolationById(violationId: string): AttendanceViolation | null {
    return this.violations.find(v => v.id === violationId) || null;
  }

  /**
   * Add HR notes to violation
   */
  addHRNotes(
    violationId: string,
    notes: string,
    addedBy: string
  ): { success: boolean; message: string } {
    const violation = this.violations.find(v => v.id === violationId);

    if (!violation) {
      return {
        success: false,
        message: "Violation not found",
      };
    }

    violation.hrNotes = `${notes} (Added by ${addedBy} on ${new Date().toISOString().split('T')[0]})`;

    return {
      success: true,
      message: "Notes added successfully",
    };
  }
}

// Export singleton instance
export const attendancePenaltyService = new AttendancePenaltyService();