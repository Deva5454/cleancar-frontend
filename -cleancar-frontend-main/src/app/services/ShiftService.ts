/**
 * Shift Service - Single Point of Execution for Shift Operations
 *
 * All shift assignments and modifications flow through this service
 * PRIMARY OWNER: HR (only HR assigns shifts, Supervisor requests changes)
 */

import { logger } from "./logger";
import { auditLogService } from "./auditLogService";
import { ActionOwnershipHelper } from "./ActionOwnershipModel";

// ========== TYPES ==========

export interface AssignShiftRequest {
  employeeId: string;
  shiftId: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  sourceModule: "HR"; // ONLY HR assigns shifts
  assignedBy: string;
}

export interface ShiftChangeRequest {
  employeeId: string;
  currentShiftId: string;
  requestedShiftId: string;
  reason: string;
  sourceModule: "Supervisor"; // Supervisor can only request
  requestedBy: string;
  approvalRequired: boolean;
}

export interface ShiftOperationResult {
  success: boolean;
  shiftAssignmentId?: string;
  errors?: string[];
  requiresApproval?: boolean;
}

// ========== SHIFT SERVICE ==========

class ShiftServiceClass {
  /**
   * Assign shift to employee - SINGLE POINT OF EXECUTION
   * PRIMARY OWNER: HR (only HR assigns shifts)
   */
  assignShift(request: AssignShiftRequest): ShiftOperationResult {
    logger.log(`[ShiftService] Assigning shift ${request.shiftId} to employee ${request.employeeId} from ${request.sourceModule}`);

    // Enforce ownership: Only HR can assign shifts
    const validation = ActionOwnershipHelper.validateOperation(
      "ASSIGN_SHIFT",
      request.sourceModule
    );

    if (!validation.allowed) {
      logger.warn(`[ShiftService] ${validation.message}`);
      return {
        success: false,
        errors: [validation.message || "Operation not allowed. Supervisor must use shift change requests."],
      };
    }

    try {
      // TODO: Integrate with actual shift assignment logic
      // For now, just log and audit

      const assignmentId = `SHIFT-${Date.now()}`;

      // Audit log
      auditLogService.logAction({
        action: "ASSIGN_SHIFT",
        entityType: "SHIFT",
        entityId: assignmentId,
        performedBy: request.assignedBy,
        details: {
          sourceModule: request.sourceModule,
          employeeId: request.employeeId,
          shiftId: request.shiftId,
          startDate: request.startDate,
        },
      });

      logger.log(`[ShiftService] Shift assigned: ${assignmentId} from ${request.sourceModule}`);

      return {
        success: true,
        shiftAssignmentId: assignmentId,
      };
    } catch (error) {
      logger.error(`[ShiftService] Failed to assign shift for ${request.employeeId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Request shift change - Supervisor requests, HR approves
   */
  requestShiftChange(request: ShiftChangeRequest): ShiftOperationResult {
    logger.log(`[ShiftService] Shift change requested for ${request.employeeId} from ${request.sourceModule}`);

    try {
      // Create shift change request (stored in separate approval system)
      auditLogService.logAction({
        action: "REQUEST_SHIFT_CHANGE",
        entityType: "SHIFT",
        entityId: request.employeeId,
        performedBy: request.requestedBy,
        details: {
          sourceModule: request.sourceModule,
          currentShiftId: request.currentShiftId,
          requestedShiftId: request.requestedShiftId,
          reason: request.reason,
          requiresApproval: request.approvalRequired,
        },
      });

      logger.log(`[ShiftService] Shift change request logged for ${request.employeeId} from ${request.sourceModule}`);

      return {
        success: true,
        requiresApproval: request.approvalRequired,
      };
    } catch (error) {
      logger.error(`[ShiftService] Failed to request shift change for ${request.employeeId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Apply approved shift change - Only called after HR approval
   */
  applyApprovedShiftChange(
    employeeId: string,
    newShiftId: string,
    approvedBy: string
  ): ShiftOperationResult {
    logger.log(`[ShiftService] Applying approved shift change for ${employeeId}`);

    return this.assignShift({
      employeeId,
      shiftId: newShiftId,
      startDate: new Date().toISOString().split("T")[0],
      sourceModule: "HR",
      assignedBy: approvedBy,
    });
  }
}

// ========== EXPORT ==========

export const ShiftService = new ShiftServiceClass();
