/**
 * Attendance Service - Single Point of Execution for Attendance Operations
 *
 * All attendance marking, updates, and corrections flow through this service
 * Prevents duplicate execution from different modules (Supervisor App, HR, Bulk)
 */

import { attendanceMasterService } from "./attendanceMaster";
import { hrMasterValidator } from "./hrMasterValidator";
import { logger } from "./logger";
import { auditLogService } from "./auditLogService";
import { ActionOwnershipHelper } from "./ActionOwnershipModel";
import { exitWorkflowService } from "./ExitWorkflowService";

// ========== TYPES ==========

export interface MarkAttendanceRequest {
  employeeId: string;
  date: string; // YYYY-MM-DD
  cityId: string;
  checkInTime?: string; // HH:MM:SS
  checkOutTime?: string;
  status: "Present" | "Absent" | "Late" | "Half Day" | "Leave" | "Week Off";
  hoursWorked?: number;
  flag?: "NONE" | "GPS_MISMATCH" | "TIME_ANOMALY" | "DUPLICATE" | "MULTI_DEVICE";
  sourceModule: "Supervisor" | "Auto"; // ONLY Supervisor marks, HR uses requests
  markedBy: string;
}

export interface AttendanceCorrectionRequest {
  attendanceId: string;
  employeeId: string;
  corrections: {
    checkInTime?: string;
    checkOutTime?: string;
    status?: "Present" | "Absent" | "Late" | "Half Day" | "Leave" | "Week Off";
    hoursWorked?: number;
  };
  reason: string;
  sourceModule: "HR Request" | "Supervisor Request";
  requestedBy: string;
  approvalRequired: boolean;
}

export interface BulkMarkAttendanceRequest {
  records: Omit<MarkAttendanceRequest, "sourceModule" | "markedBy">[];
  sourceModule: "Bulk Import" | "Migration";
  markedBy: string;
}

export interface AttendanceOperationResult {
  success: boolean;
  attendanceId?: string;
  errors?: string[];
  requiresApproval?: boolean;
}

// ========== ATTENDANCE SERVICE ==========

class AttendanceServiceClass {
  /**
   * Mark attendance - SINGLE POINT OF EXECUTION
   * PRIMARY OWNER: Supervisor (only supervisors mark attendance)
   * HR must use requestAttendanceCorrection instead
   */
  markAttendance(request: MarkAttendanceRequest): AttendanceOperationResult {
    logger.log(`[AttendanceService] Marking attendance for ${request.employeeId} from ${request.sourceModule}`);

    // Enforce ownership: Only Supervisor can mark attendance
    const validation = ActionOwnershipHelper.validateOperation(
      "MARK_ATTENDANCE",
      request.sourceModule
    );

    if (!validation.allowed) {
      logger.warn(`[AttendanceService] ${validation.message}`);
      return {
        success: false,
        errors: [validation.message || "Operation not allowed. HR must use correction requests."],
      };
    }

    try {
      // Validate employee exists
      const validation = hrMasterValidator.validateEmployeeId(request.employeeId);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Check if employee is locked (exit workflow active)
      if (exitWorkflowService.isEmployeeLocked(request.employeeId)) {
        logger.warn(`[AttendanceService] Employee ${request.employeeId} is locked (exit workflow active)`);
        return {
          success: false,
          errors: ["Employee is locked due to active exit workflow. Cannot mark attendance."],
        };
      }

      // Validate attendance data
      const attValidation = hrMasterValidator.validateAttendance({
        employeeId: request.employeeId,
        date: request.date,
        cityId: request.cityId,
        status: request.status,
      });

      if (!attValidation.valid) {
        return {
          success: false,
          errors: attValidation.errors,
        };
      }

      // Check for duplicate attendance
      const existing = attendanceMasterService.getByDateRange(
        request.employeeId,
        request.date,
        request.date
      );

      if (existing.length > 0) {
        logger.warn(`[AttendanceService] Duplicate attendance detected for ${request.employeeId} on ${request.date}`);
        return {
          success: false,
          errors: ["Attendance already marked for this date"],
        };
      }

      // Create attendance record
      const attendance = attendanceMasterService.create({
        employeeId: request.employeeId,
        cityId: request.cityId,
        date: request.date,
        checkInTime: request.checkInTime,
        checkOutTime: request.checkOutTime,
        status: request.status,
        hoursWorked: request.hoursWorked,
        flag: request.flag || "NONE",
      });

      // Audit log
      auditLogService.logAction({
        action: "MARK_ATTENDANCE",
        entityType: "ATTENDANCE",
        entityId: attendance.attendanceId,
        performedBy: request.markedBy,
        details: {
          sourceModule: request.sourceModule,
          employeeId: request.employeeId,
          date: request.date,
          status: request.status,
        },
      });

      logger.log(`[AttendanceService] Attendance marked: ${attendance.attendanceId} from ${request.sourceModule}`);

      return {
        success: true,
        attendanceId: attendance.attendanceId,
      };
    } catch (error) {
      logger.error(`[AttendanceService] Failed to mark attendance for ${request.employeeId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Request attendance correction - REPLACES direct HR edits
   * HR can no longer directly edit - must submit request for approval
   */
  requestAttendanceCorrection(request: AttendanceCorrectionRequest): AttendanceOperationResult {
    logger.log(`[AttendanceService] Attendance correction requested for ${request.attendanceId} from ${request.sourceModule}`);

    try {
      // Validate employee exists
      const validation = hrMasterValidator.validateEmployeeId(request.employeeId);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Get existing attendance
      const attendance = attendanceMasterService.getById(request.attendanceId);
      if (!attendance) {
        return {
          success: false,
          errors: ["Attendance record not found"],
        };
      }

      // Create correction request (stored in separate system)
      // This would integrate with approval workflow
      auditLogService.logAction({
        action: "REQUEST_ATTENDANCE_CORRECTION",
        entityType: "ATTENDANCE",
        entityId: request.attendanceId,
        performedBy: request.requestedBy,
        details: {
          sourceModule: request.sourceModule,
          corrections: request.corrections,
          reason: request.reason,
          requiresApproval: request.approvalRequired,
        },
      });

      logger.log(`[AttendanceService] Correction request logged for ${request.attendanceId} from ${request.sourceModule}`);

      return {
        success: true,
        attendanceId: request.attendanceId,
        requiresApproval: request.approvalRequired,
      };
    } catch (error) {
      logger.error(`[AttendanceService] Failed to request correction for ${request.attendanceId}`, error as Error);

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
    attendanceId: string,
    corrections: AttendanceCorrectionRequest["corrections"],
    approvedBy: string
  ): AttendanceOperationResult {
    logger.log(`[AttendanceService] Applying approved correction for ${attendanceId}`);

    try {
      // Update attendance record
      const attendance = attendanceMasterService.update(attendanceId, corrections);

      if (!attendance) {
        return {
          success: false,
          errors: ["Attendance record not found"],
        };
      }

      // Audit log
      auditLogService.logAction({
        action: "APPLY_ATTENDANCE_CORRECTION",
        entityType: "ATTENDANCE",
        entityId: attendanceId,
        performedBy: approvedBy,
        details: {
          corrections,
        },
      });

      logger.log(`[AttendanceService] Approved correction applied: ${attendanceId}`);

      return {
        success: true,
        attendanceId,
      };
    } catch (error) {
      logger.error(`[AttendanceService] Failed to apply correction for ${attendanceId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Bulk mark attendance - SINGLE POINT OF EXECUTION
   */
  bulkMarkAttendance(request: BulkMarkAttendanceRequest): {
    success: boolean;
    marked: number;
    failed: number;
    errors: string[];
    attendanceIds: string[];
  } {
    logger.log(`[AttendanceService] Bulk marking ${request.records.length} attendance records from ${request.sourceModule}`);

    const results = {
      success: true,
      marked: 0,
      failed: 0,
      errors: [] as string[],
      attendanceIds: [] as string[],
    };

    request.records.forEach((attData, index) => {
      const result = this.markAttendance({
        ...attData,
        sourceModule: request.sourceModule,
        markedBy: request.markedBy,
      });

      if (result.success && result.attendanceId) {
        results.marked++;
        results.attendanceIds.push(result.attendanceId);
      } else {
        results.failed++;
        results.errors.push(`Row ${index + 1}: ${result.errors?.join(", ")}`);
      }
    });

    if (results.failed > 0) {
      results.success = false;
    }

    logger.log(`[AttendanceService] Bulk mark complete: ${results.marked} marked, ${results.failed} failed from ${request.sourceModule}`);

    return results;
  }

  /**
   * Auto-mark week offs - SINGLE POINT OF EXECUTION
   */
  autoMarkWeekOffs(
    employeeIds: string[],
    date: string,
    cityId: string
  ): { marked: number; skipped: number } {
    logger.log(`[AttendanceService] Auto-marking week offs for ${employeeIds.length} employees on ${date}`);

    const results = {
      marked: 0,
      skipped: 0,
    };

    employeeIds.forEach((employeeId) => {
      const result = this.markAttendance({
        employeeId,
        date,
        cityId,
        status: "Week Off",
        sourceModule: "Auto",
        markedBy: "system",
      });

      if (result.success) {
        results.marked++;
      } else {
        results.skipped++;
      }
    });

    logger.log(`[AttendanceService] Auto-mark complete: ${results.marked} marked, ${results.skipped} skipped`);

    return results;
  }
}

// ========== EXPORT ==========

export const AttendanceService = new AttendanceServiceClass();
