/**
 * Exit Workflow Service - Employee Exit Management
 *
 * Exit Stages:
 * 1. Initiate → Employee/HR initiates exit
 * 2. Notice Period → Employee serves notice
 * 3. Clearance → Collect items, clear dues
 * 4. F&F → Final settlement calculation
 * 5. Exit → Employee marked as exited
 *
 * When exited, employee is LOCKED:
 * - Cannot mark attendance
 * - Cannot assign tasks
 * - Cannot process payroll
 */

import { employeeMasterService } from "./employeeMaster";
import { employeeDatabaseService } from "./employeeDatabaseService";
import { logger } from "./logger";
import { auditLogService } from "./auditLogService";
import { DataService } from "./DataService";
import { getProbationTermsForDesignation, resolveProbationMonths } from "../config/offerLetterPolicyConfig";

// ========== TYPES ==========

export type ExitStage =
  | "Pending Manager Approval"
  | "Initiated"
  | "Notice Period"
  | "Clearance"
  | "F&F Settlement"
  | "Exited"
  | "Rejected";

export interface ExitWorkflow {
  exitWorkflowId: string;
  employeeId: string;
  employeeName: string;
  roleId: string;
  cityId: string;

  // Exit details
  exitReason: string;
  resignationType: "Voluntary" | "Termination" | "Retirement" | "Abscond";
  initiatedDate: string; // YYYY-MM-DD
  initiatedBy: string; // User ID

  // Notice period
  noticePeriodDays: number;
  lastWorkingDate: string; // YYYY-MM-DD

  // Self-service resignation → reporting-manager approval gate
  requestedByEmployee?: boolean;
  reportingManagerId?: string;
  reportingManagerName?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  // Current stage
  currentStage: ExitStage;
  stageHistory: {
    stage: ExitStage;
    completedAt: string;
    completedBy: string;
    notes?: string;
  }[];

  // Clearance
  clearanceItems: {
    item: string;
    status: "Pending" | "Returned" | "Not Applicable";
    returnedDate?: string;
    notes?: string;
  }[];

  // F&F Settlement
  settlement?: {
    pendingSalary: number;
    leaveEncashment: number;
    bonus: number;
    otherPayments: number;
    deductions: number;
    netSettlement: number;
    settlementDate?: string;
    paidDate?: string;
  };

  // Status
  isLocked: boolean; // Employee locked when exit workflow active
  completedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface InitiateExitRequest {
  employeeId: string;
  exitReason: string;
  resignationType: "Voluntary" | "Termination" | "Retirement" | "Abscond";
  noticePeriodDays: number;
  lastWorkingDate: string;
  initiatedBy: string;
}

export interface ResignationRequest {
  employeeId: string;
  exitReason: string;
  requestedBy: string; // the employee's own name — resignation is always self-initiated
}

/** Real, live-derived notice period for one employee — designation + confirmation status,
 * resolved against the same tiered policy table offer letters use, never a flat hardcode. */
export interface DerivedNoticePeriod {
  days: number;
  months: number;
  tier: string;
  isConfirmed: boolean;
}

export interface ExitWorkflowResult {
  success: boolean;
  exitWorkflowId?: string;
  exitWorkflow?: ExitWorkflow;
  errors?: string[];
}

const STORAGE_KEY = "EXIT_WORKFLOWS";

// ========== EXIT WORKFLOW SERVICE ==========

class ExitWorkflowServiceClass {
  /**
   * Initiate exit workflow for employee
   */
  initiateExit(request: InitiateExitRequest): ExitWorkflowResult {
    logger.log(`[ExitWorkflow] Initiating exit for ${request.employeeId}`);

    try {
      // Validate employee exists and is active
      const employee = employeeMasterService.getById(request.employeeId);
      if (!employee) {
        return {
          success: false,
          errors: ["Employee not found"],
        };
      }

      if (employee.status === "Exit") {
        return {
          success: false,
          errors: ["Employee already exited"],
        };
      }

      // Voluntary resignations must come from the employee themselves
      // (My Account → Resign), so the reporting-manager approval gate and
      // the live, per-employee notice period actually apply. HR initiating
      // it on the employee's behalf would skip both.
      if (request.resignationType === "Voluntary") {
        return {
          success: false,
          errors: ["Voluntary resignations must be submitted by the employee via My Account → Resign, not initiated by HR."],
        };
      }

      // Check if exit workflow already exists
      const existing = this.getByEmployee(request.employeeId);
      if (existing && !existing.completedAt) {
        return {
          success: false,
          errors: ["Exit workflow already in progress"],
        };
      }

      // Create exit workflow
      const exitWorkflowId = `EXIT-${Date.now()}`;
      const now = new Date().toISOString();

      const exitWorkflow: ExitWorkflow = {
        exitWorkflowId,
        employeeId: request.employeeId,
        employeeName: employee.name,
        roleId: employee.roleId,
        cityId: employee.cityId,

        exitReason: request.exitReason,
        resignationType: request.resignationType,
        initiatedDate: now.split("T")[0],
        initiatedBy: request.initiatedBy,

        noticePeriodDays: request.noticePeriodDays,
        lastWorkingDate: request.lastWorkingDate,

        currentStage: "Initiated",
        stageHistory: [
          {
            stage: "Initiated",
            completedAt: now,
            completedBy: request.initiatedBy,
            notes: request.exitReason,
          },
        ],

        clearanceItems: this.getDefaultClearanceItems(),

        isLocked: true, // Lock employee immediately

        createdAt: now,
        updatedAt: now,
      };

      // Save workflow
      const workflows = DataService.get<ExitWorkflow>(STORAGE_KEY) || [];
      workflows.push(exitWorkflow);
      DataService.setAll(STORAGE_KEY, workflows);

      // Update employee status to Draft (exit in progress)
      employeeMasterService.update(request.employeeId, {
        status: "Draft", // Mark as draft during exit process
        exitDate: request.lastWorkingDate,
      });

      // Audit log
      // ✅ FIX (QA finding — blocker): auditLogService never exposed a
      // "logAction" method, only "log" — every call here threw, which
      // aborted the whole function before it could report success, even
      // though the workflow record itself had already been created above.
      // Shaped to auditLogService's real AuditLogEntry fields instead of
      // the ad-hoc {action, entityType: "EXIT_WORKFLOW", details} shape
      // that method never accepted.
      auditLogService.log({
        eventType: "Exit Initiated",
        severity: "Info",
        entityType: "Employee",
        entityId: exitWorkflowId,
        action: "INITIATE_EXIT",
        description: `Exit initiated for ${employee.name} (${request.employeeId})`,
        performedBy: request.initiatedBy,
        metadata: {
          employeeId: request.employeeId,
          resignationType: request.resignationType,
          lastWorkingDate: request.lastWorkingDate,
        },
      });

      logger.log(`[ExitWorkflow] Exit initiated: ${exitWorkflowId}`);

      return {
        success: true,
        exitWorkflowId,
        exitWorkflow,
      };
    } catch (error) {
      logger.error(`[ExitWorkflow] Failed to initiate exit for ${request.employeeId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Real, live notice period for one employee — read at resignation time
   * from the same role-tiered policy table offer letters use
   * (offerLetterPolicyConfig.TIER_TERMS), based on the employee's real
   * designation and whether they're still on probation or confirmed. No
   * flat hardcode, no new persisted field on the employee record — this
   * always reflects the current, editable policy config.
   */
  deriveNoticePeriod(employeeId: string): DerivedNoticePeriod | null {
    const record = employeeDatabaseService.getById(employeeId);
    if (!record) return null;

    const designation = record.designation || record.role || "";
    const terms = getProbationTermsForDesignation(designation);
    const probationMonths = resolveProbationMonths(designation, record.probationPeriod);

    // Confirmed if a confirmation date is on record and it has passed;
    // otherwise treat as still on probation (the more conservative, real
    // policy reading) even past the nominal probation window if HR never
    // recorded a confirmation date.
    const isConfirmed = !!record.confirmationDate && new Date(record.confirmationDate) <= new Date();
    const months = isConfirmed ? terms.noticeAfterConfirmationMonths : terms.noticeDuringProbationMonths;

    return {
      days: Math.round(months * 30),
      months,
      tier: `${designation} (${isConfirmed ? "Confirmed" : `Probation, ${probationMonths}mo`})`,
      isConfirmed,
    };
  }

  /**
   * Employee self-service resignation. This — not HR's initiateExit() —
   * is the real entry point for a Voluntary exit: the employee submits
   * it themselves, and it sits at "Pending Manager Approval" until their
   * real reporting manager approves it. The notice-period counter does
   * NOT start yet; that only happens on approval (see approveResignation).
   */
  requestResignation(request: ResignationRequest): ExitWorkflowResult {
    logger.log(`[ExitWorkflow] Resignation requested by ${request.employeeId}`);

    try {
      const employee = employeeMasterService.getById(request.employeeId);
      if (!employee) {
        return { success: false, errors: ["Employee not found"] };
      }
      if (employee.status === "Exit") {
        return { success: false, errors: ["Employee already exited"] };
      }

      const existing = this.getByEmployee(request.employeeId);
      if (existing && !existing.completedAt) {
        return { success: false, errors: ["An exit workflow is already in progress for this employee"] };
      }

      const notice = this.deriveNoticePeriod(request.employeeId);
      if (!notice) {
        return { success: false, errors: ["Could not determine notice period — employee record not found"] };
      }

      const dbRecord = employeeDatabaseService.getById(request.employeeId);
      const exitWorkflowId = `EXIT-${Date.now()}`;
      const now = new Date().toISOString();
      const today = now.split("T")[0];

      // Placeholder last working date, shown to the employee for reference
      // only — it's recomputed for real from the actual approval date once
      // the reporting manager approves, since that's when the notice
      // period genuinely starts counting.
      const provisionalLastWorkingDate = new Date(Date.now() + notice.days * 86400000).toISOString().split("T")[0];

      const exitWorkflow: ExitWorkflow = {
        exitWorkflowId,
        employeeId: request.employeeId,
        employeeName: employee.name,
        roleId: employee.roleId,
        cityId: employee.cityId,

        exitReason: request.exitReason,
        resignationType: "Voluntary",
        initiatedDate: today,
        initiatedBy: request.requestedBy,

        noticePeriodDays: notice.days,
        lastWorkingDate: provisionalLastWorkingDate,

        requestedByEmployee: true,
        reportingManagerId: dbRecord?.reportingManagerId,
        reportingManagerName: dbRecord?.reportingManager,

        currentStage: "Pending Manager Approval",
        stageHistory: [
          {
            stage: "Pending Manager Approval",
            completedAt: now,
            completedBy: request.requestedBy,
            notes: request.exitReason,
          },
        ],

        clearanceItems: this.getDefaultClearanceItems(),

        isLocked: false, // not locked yet — resignation isn't approved

        createdAt: now,
        updatedAt: now,
      };

      const workflows = DataService.get<ExitWorkflow>(STORAGE_KEY) || [];
      workflows.push(exitWorkflow);
      DataService.setAll(STORAGE_KEY, workflows);

      auditLogService.log({
        eventType: "Exit Initiated",
        severity: "Info",
        entityType: "Employee",
        entityId: exitWorkflowId,
        action: "RESIGNATION_REQUESTED",
        description: `${employee.name} (${request.employeeId}) submitted their resignation — pending approval from ${dbRecord?.reportingManager || "their reporting manager"}`,
        performedBy: request.requestedBy,
        metadata: {
          employeeId: request.employeeId,
          derivedNoticeDays: notice.days,
          reportingManagerId: dbRecord?.reportingManagerId,
        },
      });

      logger.log(`[ExitWorkflow] Resignation requested: ${exitWorkflowId}`);

      return { success: true, exitWorkflowId, exitWorkflow };
    } catch (error) {
      logger.error(`[ExitWorkflow] Failed to request resignation for ${request.employeeId}`, error as Error);
      return { success: false, errors: [error instanceof Error ? error.message : "Unknown error"] };
    }
  }

  /**
   * Reporting-manager approval of a pending resignation. This is what
   * actually starts the exit: employee gets locked, notice period is
   * (re)computed from today (the real approval date), not the day they
   * happened to submit the request.
   */
  approveResignation(exitWorkflowId: string, approvedBy: string, notes?: string): ExitWorkflowResult {
    try {
      const workflow = this.getById(exitWorkflowId);
      if (!workflow) return { success: false, errors: ["Exit workflow not found"] };
      if (workflow.currentStage !== "Pending Manager Approval") {
        return { success: false, errors: [`Cannot approve — workflow is at "${workflow.currentStage}", not "Pending Manager Approval"`] };
      }

      const now = new Date().toISOString();
      const today = now.split("T")[0];
      const lastWorkingDate = new Date(Date.now() + workflow.noticePeriodDays * 86400000).toISOString().split("T")[0];

      workflow.currentStage = "Initiated";
      workflow.initiatedDate = today; // notice period officially starts today
      workflow.lastWorkingDate = lastWorkingDate;
      workflow.approvedBy = approvedBy;
      workflow.approvedAt = now;
      workflow.isLocked = true;
      workflow.stageHistory.push({ stage: "Initiated", completedAt: now, completedBy: approvedBy, notes });
      workflow.updatedAt = now;

      this.update(exitWorkflowId, workflow);

      employeeMasterService.update(workflow.employeeId, {
        status: "Draft",
        exitDate: lastWorkingDate,
      });

      auditLogService.log({
        eventType: "Exit Initiated",
        severity: "Info",
        entityType: "Employee",
        entityId: exitWorkflowId,
        action: "RESIGNATION_APPROVED",
        description: `${workflow.employeeName}'s resignation approved by ${approvedBy} — notice period of ${workflow.noticePeriodDays} days starts today, last working day ${lastWorkingDate}`,
        performedBy: approvedBy,
        metadata: { employeeId: workflow.employeeId, noticePeriodDays: workflow.noticePeriodDays, lastWorkingDate },
      });

      return { success: true, exitWorkflow: workflow };
    } catch (error) {
      logger.error(`[ExitWorkflow] Failed to approve resignation ${exitWorkflowId}`, error as Error);
      return { success: false, errors: [error instanceof Error ? error.message : "Unknown error"] };
    }
  }

  /**
   * Reporting-manager rejection of a pending resignation. The employee was
   * never locked while pending, so nothing needs to be undone on their
   * record — they simply carry on as Active.
   */
  rejectResignation(exitWorkflowId: string, rejectedBy: string, reason: string): ExitWorkflowResult {
    try {
      const workflow = this.getById(exitWorkflowId);
      if (!workflow) return { success: false, errors: ["Exit workflow not found"] };
      if (workflow.currentStage !== "Pending Manager Approval") {
        return { success: false, errors: [`Cannot reject — workflow is at "${workflow.currentStage}", not "Pending Manager Approval"`] };
      }

      const now = new Date().toISOString();
      workflow.currentStage = "Rejected";
      workflow.rejectedBy = rejectedBy;
      workflow.rejectedAt = now;
      workflow.rejectionReason = reason;
      workflow.completedAt = now;
      workflow.stageHistory.push({ stage: "Rejected", completedAt: now, completedBy: rejectedBy, notes: reason });
      workflow.updatedAt = now;

      this.update(exitWorkflowId, workflow);

      auditLogService.log({
        eventType: "State Transition",
        severity: "Warning",
        entityType: "Employee",
        entityId: exitWorkflowId,
        action: "RESIGNATION_REJECTED",
        description: `${workflow.employeeName}'s resignation rejected by ${rejectedBy}: ${reason}`,
        performedBy: rejectedBy,
        metadata: { employeeId: workflow.employeeId, reason },
      });

      return { success: true, exitWorkflow: workflow };
    } catch (error) {
      logger.error(`[ExitWorkflow] Failed to reject resignation ${exitWorkflowId}`, error as Error);
      return { success: false, errors: [error instanceof Error ? error.message : "Unknown error"] };
    }
  }

  /**
   * Resignations pending approval from a specific reporting manager
   * (matched by their real employee ID against the resolved
   * reportingManagerId captured at resignation time).
   */
  getPendingApprovalsForManager(managerEmployeeId: string): ExitWorkflow[] {
    if (!managerEmployeeId) return [];
    return this.getAll().filter(
      (w) => w.currentStage === "Pending Manager Approval" && w.reportingManagerId === managerEmployeeId
    );
  }

  /**
   * Move to next stage
   */
  moveToNextStage(
    exitWorkflowId: string,
    completedBy: string,
    notes?: string
  ): ExitWorkflowResult {
    logger.log(`[ExitWorkflow] Moving ${exitWorkflowId} to next stage`);

    try {
      const workflow = this.getById(exitWorkflowId);
      if (!workflow) {
        return {
          success: false,
          errors: ["Exit workflow not found"],
        };
      }

      if (workflow.currentStage === "Pending Manager Approval") {
        return {
          success: false,
          errors: ["Waiting for reporting-manager approval — use Approve/Reject, not Move to Next Stage."],
        };
      }
      if (workflow.currentStage === "Rejected") {
        return {
          success: false,
          errors: ["This resignation was rejected by the reporting manager."],
        };
      }

      // Determine next stage
      const stageOrder: ExitStage[] = [
        "Initiated",
        "Notice Period",
        "Clearance",
        "F&F Settlement",
        "Exited",
      ];

      const currentIndex = stageOrder.indexOf(workflow.currentStage);
      if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
        return {
          success: false,
          errors: ["Already at final stage"],
        };
      }

      const nextStage = stageOrder[currentIndex + 1];
      const now = new Date().toISOString();

      // Update workflow
      workflow.currentStage = nextStage;
      workflow.stageHistory.push({
        stage: nextStage,
        completedAt: now,
        completedBy,
        notes,
      });
      workflow.updatedAt = now;

      // If reached Exited stage, complete the workflow
      if (nextStage === "Exited") {
        workflow.completedAt = now;
        workflow.isLocked = true;

        // Update employee to Exit status
        employeeMasterService.update(workflow.employeeId, {
          status: "Exit",
        });
      }

      // Save
      this.update(exitWorkflowId, workflow);

      // Audit log
      // ✅ FIX (QA finding — blocker): same wrong-method-name bug as
      // initiateExit() above — this threw on every single stage advance
      // (Initiated → Notice Period → Clearance → F&F Settlement →
      // Exited), which is why no exit could ever progress past
      // "Initiated" through the real UI.
      auditLogService.log({
        eventType: nextStage === "Exited" ? "Exit Completed" : "State Transition",
        severity: "Info",
        entityType: "Employee",
        entityId: exitWorkflowId,
        action: "EXIT_STAGE_CHANGE",
        description: `${workflow.employeeName} moved from ${stageOrder[currentIndex]} to ${nextStage}`,
        performedBy: completedBy,
        metadata: {
          employeeId: workflow.employeeId,
          fromStage: stageOrder[currentIndex],
          toStage: nextStage,
          notes,
        },
      });

      logger.log(`[ExitWorkflow] Moved to ${nextStage}: ${exitWorkflowId}`);

      return {
        success: true,
        exitWorkflow: workflow,
      };
    } catch (error) {
      logger.error(`[ExitWorkflow] Failed to move stage for ${exitWorkflowId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Update clearance items
   */
  updateClearance(
    exitWorkflowId: string,
    clearanceItems: ExitWorkflow["clearanceItems"]
  ): ExitWorkflowResult {
    logger.log(`[ExitWorkflow] Updating clearance for ${exitWorkflowId}`);

    try {
      const workflow = this.getById(exitWorkflowId);
      if (!workflow) {
        return {
          success: false,
          errors: ["Exit workflow not found"],
        };
      }

      workflow.clearanceItems = clearanceItems;
      workflow.updatedAt = new Date().toISOString();

      this.update(exitWorkflowId, workflow);

      return {
        success: true,
        exitWorkflow: workflow,
      };
    } catch (error) {
      logger.error(`[ExitWorkflow] Failed to update clearance for ${exitWorkflowId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Calculate and save F&F settlement
   */
  calculateSettlement(
    exitWorkflowId: string,
    settlement: ExitWorkflow["settlement"]
  ): ExitWorkflowResult {
    logger.log(`[ExitWorkflow] Calculating settlement for ${exitWorkflowId}`);

    try {
      const workflow = this.getById(exitWorkflowId);
      if (!workflow) {
        return {
          success: false,
          errors: ["Exit workflow not found"],
        };
      }

      workflow.settlement = settlement;
      workflow.updatedAt = new Date().toISOString();

      this.update(exitWorkflowId, workflow);

      return {
        success: true,
        exitWorkflow: workflow,
      };
    } catch (error) {
      logger.error(`[ExitWorkflow] Failed to calculate settlement for ${exitWorkflowId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Check if employee is locked (cannot perform actions)
   */
  isEmployeeLocked(employeeId: string): boolean {
    const workflow = this.getByEmployee(employeeId);
    return workflow ? workflow.isLocked : false;
  }

  /**
   * Get exit workflow by ID
   */
  getById(exitWorkflowId: string): ExitWorkflow | null {
    const workflows = DataService.get<ExitWorkflow>(STORAGE_KEY) || [];
    return workflows.find((w) => w.exitWorkflowId === exitWorkflowId) || null;
  }

  /**
   * Get exit workflow by employee
   */
  getByEmployee(employeeId: string): ExitWorkflow | null {
    const workflows = DataService.get<ExitWorkflow>(STORAGE_KEY) || [];
    // Return the latest workflow for this employee
    const employeeWorkflows = workflows.filter((w) => w.employeeId === employeeId);
    if (employeeWorkflows.length === 0) return null;

    return employeeWorkflows.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }

  /**
   * Get all exit workflows
   */
  getAll(): ExitWorkflow[] {
    return DataService.get<ExitWorkflow>(STORAGE_KEY) || [];
  }

  /**
   * Get active exit workflows (not completed)
   */
  getActive(): ExitWorkflow[] {
    const workflows = this.getAll();
    return workflows.filter((w) => !w.completedAt);
  }

  /**
   * Update exit workflow
   */
  private update(exitWorkflowId: string, updatedWorkflow: ExitWorkflow): void {
    const workflows = DataService.get<ExitWorkflow>(STORAGE_KEY) || [];
    const index = workflows.findIndex((w) => w.exitWorkflowId === exitWorkflowId);

    if (index !== -1) {
      workflows[index] = updatedWorkflow;
      DataService.setAll(STORAGE_KEY, workflows);
    }
  }

  /**
   * Get default clearance items
   */
  private getDefaultClearanceItems(): ExitWorkflow["clearanceItems"] {
    return [
      { item: "ID Card", status: "Pending" },
      { item: "Laptop", status: "Not Applicable" },
      { item: "Mobile Device", status: "Not Applicable" },
      { item: "Access Cards", status: "Pending" },
      { item: "Uniforms", status: "Pending" },
      { item: "Equipment", status: "Pending" },
      { item: "Documents", status: "Pending" },
    ];
  }
}

// ========== EXPORT ==========

export const exitWorkflowService = new ExitWorkflowServiceClass();
