/**
 * Payroll Engine - Single Point of Execution for Payroll Operations
 *
 * All payroll processing, updates, and approvals flow through this service
 * Prevents duplicate execution from different modules (HR, Finance, Auto-processing)
 *
 * ⚠️ IMPORTANT: Manual payroll processing is DISABLED
 * Use PayrollAutomationEngine.autoProcessPayroll() instead
 * All payroll is now calculated from system inputs (attendance, incentives, penalties)
 */

import { payrollMasterService } from "./payrollMaster";
import { hrMasterValidator } from "./hrMasterValidator";
import { logger } from "./logger";
import { auditLogService } from "./auditLogService";

// ========== TYPES ==========

export interface ProcessPayrollRequest {
  employeeId: string;
  month: string; // "April"
  year: number;
  payPeriodStart: string; // YYYY-MM-DD
  payPeriodEnd: string;
  basicSalary: number;
  allowances: { name: string; amount: number }[];
  deductions?: { name: string; amount: number }[];
  incentives?: number;
  sourceModule: "Auto" | "HR" | "Finance";
  processedBy: string;
}

export interface PayrollCorrectionRequest {
  payrollId: string;
  employeeId: string;
  corrections: {
    basicSalary?: number;
    allowances?: { name: string; amount: number }[];
    deductions?: { name: string; amount: number }[];
  };
  reason: string;
  sourceModule: "HR Request" | "Finance Request";
  requestedBy: string;
}

export interface BulkProcessPayrollRequest {
  records: Omit<ProcessPayrollRequest, "sourceModule" | "processedBy">[];
  sourceModule: "Auto" | "Bulk Import";
  processedBy: string;
}

export interface PayrollOperationResult {
  success: boolean;
  payrollId?: string;
  errors?: string[];
  requiresApproval?: boolean;
}

// ========== PAYROLL ENGINE ==========

class PayrollEngineClass {
  /**
   * Process payroll - DEPRECATED: Manual processing disabled
   * Use PayrollAutomationEngine.autoProcessPayroll() instead
   *
   * @deprecated Manual payroll processing is disabled. All payroll must be auto-calculated.
   */
  processPayroll(request: ProcessPayrollRequest): PayrollOperationResult {
    logger.warn(`[PayrollEngine] DEPRECATED: Manual payroll processing attempted for ${request.employeeId}`);

    // Block manual processing - enforce automation
    if (request.sourceModule !== "Auto") {
      return {
        success: false,
        errors: [
          "Manual payroll processing is disabled.",
          "Use PayrollAutomationEngine.autoProcessPayroll() instead.",
          "All payroll must be calculated from system inputs (attendance, incentives, penalties).",
        ],
      };
    }

    logger.log(`[PayrollEngine] Processing payroll for ${request.employeeId} (${request.month} ${request.year}) from ${request.sourceModule}`);

    try {
      // Validate employee exists
      const validation = hrMasterValidator.validateEmployeeId(request.employeeId);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Validate payroll data
      const payrollValidation = hrMasterValidator.validatePayroll({
        employeeId: request.employeeId,
        month: request.month,
        year: request.year,
        basicSalary: request.basicSalary,
      });

      if (!payrollValidation.valid) {
        return {
          success: false,
          errors: payrollValidation.errors,
        };
      }

      // Check for duplicate payroll
      const existing = payrollMasterService.getByEmployee(request.employeeId);
      const duplicate = existing.find(
        (p) => p.month === request.month && p.year === request.year
      );

      if (duplicate) {
        logger.warn(`[PayrollEngine] Duplicate payroll detected for ${request.employeeId} (${request.month} ${request.year})`);
        return {
          success: false,
          errors: ["Payroll already processed for this period"],
        };
      }

      // Calculate totals
      const allowanceTotal = request.allowances.reduce((sum, a) => sum + a.amount, 0);
      const deductionTotal = (request.deductions || []).reduce((sum, d) => sum + d.amount, 0);
      const grossPay = request.basicSalary + allowanceTotal + (request.incentives || 0);
      const netPay = grossPay - deductionTotal;

      // Create payroll record
      const payroll = payrollMasterService.create({
        employeeId: request.employeeId,
        month: request.month,
        year: request.year,
        payPeriodStart: request.payPeriodStart,
        payPeriodEnd: request.payPeriodEnd,
        basicSalary: request.basicSalary,
        allowances: request.allowances,
        deductions: request.deductions || [],
        grossPay,
        totalDeductions: deductionTotal,
        netPay,
        status: "Draft",
        processedBy: request.processedBy,
        processedAt: new Date().toISOString(),
      });

      // Audit log
      auditLogService.logAction({
        action: "PROCESS_PAYROLL",
        entityType: "PAYROLL",
        entityId: payroll.payrollId,
        performedBy: request.processedBy,
        details: {
          sourceModule: request.sourceModule,
          employeeId: request.employeeId,
          month: request.month,
          year: request.year,
          netPay,
        },
      });

      logger.log(`[PayrollEngine] Payroll processed: ${payroll.payrollId} from ${request.sourceModule}`);

      return {
        success: true,
        payrollId: payroll.payrollId,
      };
    } catch (error) {
      logger.error(`[PayrollEngine] Failed to process payroll for ${request.employeeId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Request payroll correction - REPLACES direct edits
   * HR/Finance can no longer directly edit - must submit request
   */
  requestPayrollCorrection(request: PayrollCorrectionRequest): PayrollOperationResult {
    logger.log(`[PayrollEngine] Payroll correction requested for ${request.payrollId} from ${request.sourceModule}`);

    try {
      // Validate employee exists
      const validation = hrMasterValidator.validateEmployeeId(request.employeeId);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Get existing payroll
      const payroll = payrollMasterService.getById(request.payrollId);
      if (!payroll) {
        return {
          success: false,
          errors: ["Payroll record not found"],
        };
      }

      // Check if payroll is already paid
      if (payroll.status === "Paid") {
        return {
          success: false,
          errors: ["Cannot correct payroll that has already been paid"],
        };
      }

      // Create correction request (stored in separate approval system)
      auditLogService.logAction({
        action: "REQUEST_PAYROLL_CORRECTION",
        entityType: "PAYROLL",
        entityId: request.payrollId,
        performedBy: request.requestedBy,
        details: {
          sourceModule: request.sourceModule,
          corrections: request.corrections,
          reason: request.reason,
        },
      });

      logger.log(`[PayrollEngine] Correction request logged for ${request.payrollId} from ${request.sourceModule}`);

      return {
        success: true,
        payrollId: request.payrollId,
        requiresApproval: true,
      };
    } catch (error) {
      logger.error(`[PayrollEngine] Failed to request correction for ${request.payrollId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Apply approved correction - Only called after approval workflow
   */
  applyApprovedCorrection(
    payrollId: string,
    corrections: PayrollCorrectionRequest["corrections"],
    approvedBy: string
  ): PayrollOperationResult {
    logger.log(`[PayrollEngine] Applying approved correction for ${payrollId}`);

    try {
      // Get existing payroll
      const payroll = payrollMasterService.getById(payrollId);
      if (!payroll) {
        return {
          success: false,
          errors: ["Payroll record not found"],
        };
      }

      // Calculate new totals
      const basicSalary = corrections.basicSalary ?? payroll.basicSalary;
      const allowances = corrections.allowances ?? payroll.allowances;
      const deductions = corrections.deductions ?? payroll.deductions;

      const allowanceTotal = allowances.reduce((sum, a) => sum + a.amount, 0);
      const deductionTotal = deductions.reduce((sum, d) => sum + d.amount, 0);
      const grossPay = basicSalary + allowanceTotal;
      const netPay = grossPay - deductionTotal;

      // Update payroll record
      const updated = payrollMasterService.update(payrollId, {
        basicSalary,
        allowances,
        deductions,
        grossPay,
        totalDeductions: deductionTotal,
        netPay,
      });

      if (!updated) {
        return {
          success: false,
          errors: ["Failed to update payroll"],
        };
      }

      // Audit log
      auditLogService.logAction({
        action: "APPLY_PAYROLL_CORRECTION",
        entityType: "PAYROLL",
        entityId: payrollId,
        performedBy: approvedBy,
        details: {
          corrections,
          newNetPay: netPay,
        },
      });

      logger.log(`[PayrollEngine] Approved correction applied: ${payrollId}`);

      return {
        success: true,
        payrollId,
      };
    } catch (error) {
      logger.error(`[PayrollEngine] Failed to apply correction for ${payrollId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Approve payroll - SINGLE POINT OF EXECUTION
   */
  approvePayroll(
    payrollId: string,
    approvedBy: string,
    sourceModule: "HR" | "Finance"
  ): PayrollOperationResult {
    logger.log(`[PayrollEngine] Approving payroll ${payrollId} from ${sourceModule}`);

    try {
      const payroll = payrollMasterService.approve(payrollId, approvedBy);

      if (!payroll) {
        return {
          success: false,
          errors: ["Payroll record not found"],
        };
      }

      // Audit log
      auditLogService.logAction({
        action: "APPROVE_PAYROLL",
        entityType: "PAYROLL",
        entityId: payrollId,
        performedBy: approvedBy,
        details: {
          sourceModule,
        },
      });

      logger.log(`[PayrollEngine] Payroll approved: ${payrollId} from ${sourceModule}`);

      return {
        success: true,
        payrollId,
      };
    } catch (error) {
      logger.error(`[PayrollEngine] Failed to approve payroll ${payrollId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Mark payroll as paid - SINGLE POINT OF EXECUTION
   */
  markPayrollPaid(
    payrollId: string,
    paidBy: string,
    paymentDate: string,
    sourceModule: "Finance"
  ): PayrollOperationResult {
    logger.log(`[PayrollEngine] Marking payroll ${payrollId} as paid from ${sourceModule}`);

    try {
      const payroll = payrollMasterService.getById(payrollId);

      if (!payroll) {
        return {
          success: false,
          errors: ["Payroll record not found"],
        };
      }

      if (payroll.status !== "Approved") {
        return {
          success: false,
          errors: ["Payroll must be approved before marking as paid"],
        };
      }

      const updated = payrollMasterService.update(payrollId, {
        status: "Paid",
        paidAt: paymentDate,
        paidBy,
      });

      if (!updated) {
        return {
          success: false,
          errors: ["Failed to update payroll"],
        };
      }

      // Audit log
      auditLogService.logAction({
        action: "MARK_PAYROLL_PAID",
        entityType: "PAYROLL",
        entityId: payrollId,
        performedBy: paidBy,
        details: {
          sourceModule,
          paymentDate,
        },
      });

      logger.log(`[PayrollEngine] Payroll marked as paid: ${payrollId} from ${sourceModule}`);

      return {
        success: true,
        payrollId,
      };
    } catch (error) {
      logger.error(`[PayrollEngine] Failed to mark payroll paid ${payrollId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Bulk process payroll - SINGLE POINT OF EXECUTION
   */
  bulkProcessPayroll(request: BulkProcessPayrollRequest): {
    success: boolean;
    processed: number;
    failed: number;
    errors: string[];
    payrollIds: string[];
  } {
    logger.log(`[PayrollEngine] Bulk processing ${request.records.length} payroll records from ${request.sourceModule}`);

    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [] as string[],
      payrollIds: [] as string[],
    };

    request.records.forEach((payrollData, index) => {
      const result = this.processPayroll({
        ...payrollData,
        sourceModule: request.sourceModule,
        processedBy: request.processedBy,
      });

      if (result.success && result.payrollId) {
        results.processed++;
        results.payrollIds.push(result.payrollId);
      } else {
        results.failed++;
        results.errors.push(`Row ${index + 1}: ${result.errors?.join(", ")}`);
      }
    });

    if (results.failed > 0) {
      results.success = false;
    }

    logger.log(`[PayrollEngine] Bulk process complete: ${results.processed} processed, ${results.failed} failed from ${request.sourceModule}`);

    return results;
  }
}

// ========== EXPORT ==========

export const PayrollEngine = new PayrollEngineClass();
