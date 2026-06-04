/**
 * Payroll Automation Engine - Automated Payroll Processing
 *
 * Processes payroll automatically from system inputs:
 * - Attendance records
 * - Incentives
 * - Penalties
 *
 * NO MANUAL EDITS ALLOWED - All payroll is system-calculated
 */

import { attendanceMasterService } from "./attendanceMaster";
import { incentiveLedgerService } from "./incentiveLedger";
import { payrollMasterService } from "./payrollMaster";
import { employeeMasterService } from "./employeeMaster";
import { hrMasterValidator } from "./hrMasterValidator";
import { logger } from "./logger";
import { auditLogService } from "./auditLogService";
import { exitWorkflowService } from "./ExitWorkflowService";

// ========== TYPES ==========

export interface PayrollInputs {
  employeeId: string;
  month: string;
  year: number;
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    leaveDays: number;
    weekOffs: number;
  };
  incentives: {
    total: number;
    breakdown: { type: string; amount: number }[];
  };
  penalties: {
    total: number;
    breakdown: { type: string; amount: number }[];
  };
  basicSalary: number;
}

export interface PayrollCalculation {
  employeeId: string;
  month: string;
  year: number;

  // Inputs
  basicSalary: number;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;

  // Calculations
  perDayRate: number;
  earnedBasicSalary: number; // Based on attendance

  // Allowances
  allowances: { name: string; amount: number }[];
  totalAllowances: number;

  // Incentives
  incentives: { type: string; amount: number }[];
  totalIncentives: number;

  // Deductions
  deductions: { name: string; amount: number }[];
  totalDeductions: number;

  // Penalties
  penalties: { type: string; amount: number }[];
  totalPenalties: number;

  // Totals
  grossPay: number;
  netPay: number;

  // Metadata
  calculatedAt: string;
  calculatedBy: "system";
  isAutomated: true;
}

export interface PayrollValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingData: string[];
}

export interface AutoProcessPayrollResult {
  success: boolean;
  payrollId?: string;
  calculation?: PayrollCalculation;
  errors?: string[];
}

// ========== PAYROLL AUTOMATION ENGINE ==========

class PayrollAutomationEngineClass {
  /**
   * Validate payroll can be processed for employee
   */
  validatePayrollInputs(
    employeeId: string,
    month: string,
    year: number
  ): PayrollValidationResult {
    const result: PayrollValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      missingData: [],
    };

    // Validate employee exists
    const empValidation = hrMasterValidator.validateEmployeeId(employeeId);
    if (!empValidation.valid) {
      result.valid = false;
      result.errors.push(...empValidation.errors);
      return result;
    }

    // Check if employee is active
    const employee = employeeMasterService.getById(employeeId);
    if (!employee) {
      result.valid = false;
      result.errors.push("Employee not found");
      return result;
    }

    if (employee.status !== "Active") {
      result.valid = false;
      result.errors.push(`Employee status is ${employee.status}, must be Active`);
      return result;
    }

    // Check if employee is locked (exit workflow active)
    if (exitWorkflowService.isEmployeeLocked(employeeId)) {
      result.valid = false;
      result.errors.push("Employee is locked due to active exit workflow. Cannot process payroll.");
      return result;
    }

    // Check attendance data exists
    const monthStart = `${year}-${String(this.getMonthNumber(month)).padStart(2, "0")}-01`;
    const monthEnd = this.getMonthEndDate(year, month);

    const attendanceRecords = attendanceMasterService.getByDateRange(
      employeeId,
      monthStart,
      monthEnd
    );

    if (attendanceRecords.length === 0) {
      result.valid = false;
      result.missingData.push("No attendance records found for the month");
      result.errors.push("Cannot process payroll without attendance data");
    }

    // Check if payroll already processed
    const existingPayroll = payrollMasterService.getByEmployee(employeeId);
    const duplicate = existingPayroll.find(
      (p) => p.month === month && p.year === year
    );

    if (duplicate) {
      result.valid = false;
      result.errors.push("Payroll already processed for this period");
    }

    // Warnings for incomplete data
    const incentiveRecords = incentiveLedgerService.getByEmployee(employeeId);
    const monthIncentives = incentiveRecords.filter(
      (i) => i.month === month && i.year === year
    );

    if (monthIncentives.length === 0) {
      result.warnings.push("No incentives found for this month");
    }

    return result;
  }

  /**
   * Gather all inputs needed for payroll calculation
   */
  private gatherPayrollInputs(
    employeeId: string,
    month: string,
    year: number
  ): PayrollInputs | null {
    const employee = employeeMasterService.getById(employeeId);
    if (!employee) return null;

    // Get attendance for the month
    const monthStart = `${year}-${String(this.getMonthNumber(month)).padStart(2, "0")}-01`;
    const monthEnd = this.getMonthEndDate(year, month);

    const attendanceRecords = attendanceMasterService.getByDateRange(
      employeeId,
      monthStart,
      monthEnd
    );

    // Calculate attendance summary
    const attendance = {
      totalDays: attendanceRecords.length,
      presentDays: attendanceRecords.filter((a) => a.status === "Present").length,
      absentDays: attendanceRecords.filter((a) => a.status === "Absent").length,
      lateDays: attendanceRecords.filter((a) => a.status === "Late").length,
      halfDays: attendanceRecords.filter((a) => a.status === "Half Day").length,
      leaveDays: attendanceRecords.filter((a) => a.status === "Leave").length,
      weekOffs: attendanceRecords.filter((a) => a.status === "Week Off").length,
    };

    // Get incentives for the month
    const incentiveRecords = incentiveLedgerService.getByEmployee(employeeId);
    const monthIncentives = incentiveRecords.filter(
      (i) => i.month === month && i.year === year && i.status === "Approved"
    );

    const incentives = {
      total: monthIncentives.reduce((sum, i) => sum + i.amount, 0),
      breakdown: monthIncentives.map((i) => ({
        type: i.type,
        amount: i.amount,
      })),
    };

    // Get penalties (from attendance flags and other sources)
    const penalties = this.calculatePenalties(attendanceRecords);

    // Get basic salary from employee record (would normally come from salary master)
    const basicSalary = 25000; // TODO: Get from salary structure

    return {
      employeeId,
      month,
      year,
      attendance,
      incentives,
      penalties,
      basicSalary,
    };
  }

  /**
   * Calculate penalties from attendance and other sources
   */
  private calculatePenalties(attendanceRecords: any[]): {
    total: number;
    breakdown: { type: string; amount: number }[];
  } {
    const breakdown: { type: string; amount: number }[] = [];

    // Late penalty: ₹100 per late day
    const lateDays = attendanceRecords.filter((a) => a.status === "Late").length;
    if (lateDays > 0) {
      breakdown.push({
        type: "Late Arrival Penalty",
        amount: lateDays * 100,
      });
    }

    // GPS mismatch penalty: ₹200 per occurrence
    const gpsMismatches = attendanceRecords.filter(
      (a) => a.flag === "GPS_MISMATCH"
    ).length;
    if (gpsMismatches > 0) {
      breakdown.push({
        type: "GPS Mismatch Penalty",
        amount: gpsMismatches * 200,
      });
    }

    // Time anomaly penalty: ₹150 per occurrence
    const timeAnomalies = attendanceRecords.filter(
      (a) => a.flag === "TIME_ANOMALY"
    ).length;
    if (timeAnomalies > 0) {
      breakdown.push({
        type: "Time Anomaly Penalty",
        amount: timeAnomalies * 150,
      });
    }

    const total = breakdown.reduce((sum, p) => sum + p.amount, 0);

    return { total, breakdown };
  }

  /**
   * Calculate payroll from inputs
   */
  private calculatePayroll(inputs: PayrollInputs): PayrollCalculation {
    // Calculate working days (exclude week offs)
    const totalWorkingDays = inputs.attendance.totalDays - inputs.attendance.weekOffs;

    // Calculate per-day rate
    const perDayRate = inputs.basicSalary / totalWorkingDays;

    // Calculate earned basic salary based on attendance
    // Present days + Leave days (paid) + Half days (50%)
    const paidDays =
      inputs.attendance.presentDays +
      inputs.attendance.leaveDays +
      inputs.attendance.lateDays + // Late still gets paid
      inputs.attendance.halfDays * 0.5;

    const earnedBasicSalary = paidDays * perDayRate;

    // Allowances (example: 40% of basic salary)
    const hraAmount = inputs.basicSalary * 0.4;
    const allowances = [
      { name: "HRA", amount: hraAmount },
    ];
    const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);

    // Deductions (PF, Tax, etc.)
    const pfAmount = inputs.basicSalary * 0.12;
    const professionalTax = 200;
    const deductions = [
      { name: "PF", amount: pfAmount },
      { name: "Professional Tax", amount: professionalTax },
    ];
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    // Absent deduction
    if (inputs.attendance.absentDays > 0) {
      const absentDeduction = inputs.attendance.absentDays * perDayRate;
      deductions.push({
        name: `Absent (${inputs.attendance.absentDays} days)`,
        amount: absentDeduction,
      });
    }

    // Calculate totals
    const grossPay = earnedBasicSalary + totalAllowances + inputs.incentives.total;
    const netPay = grossPay - totalDeductions - inputs.penalties.total;

    return {
      employeeId: inputs.employeeId,
      month: inputs.month,
      year: inputs.year,

      basicSalary: inputs.basicSalary,
      totalWorkingDays,
      presentDays: inputs.attendance.presentDays,
      absentDays: inputs.attendance.absentDays,
      lateDays: inputs.attendance.lateDays,
      halfDays: inputs.attendance.halfDays,

      perDayRate,
      earnedBasicSalary,

      allowances,
      totalAllowances,

      incentives: inputs.incentives.breakdown,
      totalIncentives: inputs.incentives.total,

      deductions,
      totalDeductions,

      penalties: inputs.penalties.breakdown,
      totalPenalties: inputs.penalties.total,

      grossPay,
      netPay,

      calculatedAt: new Date().toISOString(),
      calculatedBy: "system",
      isAutomated: true,
    };
  }

  /**
   * Auto-process payroll for an employee
   * FULLY AUTOMATED - No manual edits allowed
   */
  autoProcessPayroll(
    employeeId: string,
    month: string,
    year: number
  ): AutoProcessPayrollResult {
    logger.log(`[PayrollAutomation] Auto-processing payroll for ${employeeId} (${month} ${year})`);

    // Step 1: Validate inputs
    const validation = this.validatePayrollInputs(employeeId, month, year);
    if (!validation.valid) {
      logger.error(`[PayrollAutomation] Validation failed for ${employeeId}`, {
        errors: validation.errors,
      });
      return {
        success: false,
        errors: validation.errors,
      };
    }

    // Log warnings
    if (validation.warnings.length > 0) {
      logger.warn(`[PayrollAutomation] Warnings for ${employeeId}`, {
        warnings: validation.warnings,
      });
    }

    try {
      // Step 2: Gather inputs
      const inputs = this.gatherPayrollInputs(employeeId, month, year);
      if (!inputs) {
        return {
          success: false,
          errors: ["Failed to gather payroll inputs"],
        };
      }

      // Step 3: Calculate payroll
      const calculation = this.calculatePayroll(inputs);

      // Step 4: Create payroll record
      const payPeriodStart = `${year}-${String(this.getMonthNumber(month)).padStart(2, "0")}-01`;
      const payPeriodEnd = this.getMonthEndDate(year, month);

      const payroll = payrollMasterService.create({
        employeeId,
        month,
        year,
        payPeriodStart,
        payPeriodEnd,
        basicSalary: calculation.basicSalary,
        allowances: calculation.allowances,
        deductions: calculation.deductions,
        grossPay: calculation.grossPay,
        totalDeductions: calculation.totalDeductions + calculation.totalPenalties,
        netPay: calculation.netPay,
        status: "Processed",
        processedBy: "system",
        processedAt: new Date().toISOString(),
        metadata: {
          isAutomated: true,
          calculation,
        },
      });

      // Audit log
      auditLogService.logAction({
        action: "AUTO_PROCESS_PAYROLL",
        entityType: "PAYROLL",
        entityId: payroll.payrollId,
        performedBy: "system",
        details: {
          employeeId,
          month,
          year,
          netPay: calculation.netPay,
          inputs: {
            presentDays: inputs.attendance.presentDays,
            incentives: inputs.incentives.total,
            penalties: inputs.penalties.total,
          },
        },
      });

      logger.log(`[PayrollAutomation] Payroll auto-processed: ${payroll.payrollId}`);

      return {
        success: true,
        payrollId: payroll.payrollId,
        calculation,
      };
    } catch (error) {
      logger.error(`[PayrollAutomation] Failed to auto-process payroll for ${employeeId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Bulk auto-process payroll for all active employees
   */
  bulkAutoProcessPayroll(
    month: string,
    year: number
  ): {
    success: boolean;
    processed: number;
    failed: number;
    skipped: number;
    errors: string[];
    results: { employeeId: string; payrollId?: string; error?: string }[];
  } {
    logger.log(`[PayrollAutomation] Bulk auto-processing payroll for ${month} ${year}`);

    const allEmployees = employeeMasterService.getAll();
    const activeEmployees = allEmployees.filter((e) => e.status === "Active");

    const results = {
      success: true,
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
      results: [] as { employeeId: string; payrollId?: string; error?: string }[],
    };

    activeEmployees.forEach((employee) => {
      const result = this.autoProcessPayroll(employee.employeeId, month, year);

      if (result.success && result.payrollId) {
        results.processed++;
        results.results.push({
          employeeId: employee.employeeId,
          payrollId: result.payrollId,
        });
      } else {
        results.failed++;
        const error = result.errors?.join(", ") || "Unknown error";
        results.errors.push(`${employee.employeeId}: ${error}`);
        results.results.push({
          employeeId: employee.employeeId,
          error,
        });
      }
    });

    if (results.failed > 0) {
      results.success = false;
    }

    logger.log(`[PayrollAutomation] Bulk processing complete: ${results.processed} processed, ${results.failed} failed`);

    return results;
  }

  /**
   * Get payroll calculation breakdown
   */
  getPayrollBreakdown(payrollId: string): PayrollCalculation | null {
    const payroll = payrollMasterService.getById(payrollId);
    if (!payroll) return null;

    // Check if payroll has calculation metadata
    if (payroll.metadata?.calculation) {
      return payroll.metadata.calculation as PayrollCalculation;
    }

    // If no metadata, reconstruct from payroll record
    return null;
  }

  // ========== HELPER METHODS ==========

  private getMonthNumber(month: string): number {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return months.indexOf(month) + 1;
  }

  private getMonthEndDate(year: number, month: string): string {
    const monthNum = this.getMonthNumber(month);
    const lastDay = new Date(year, monthNum, 0).getDate();
    return `${year}-${String(monthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }
}

// ========== EXPORT ==========

export const PayrollAutomationEngine = new PayrollAutomationEngineClass();
