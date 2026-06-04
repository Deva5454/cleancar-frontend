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
import { logger } from "./logger";
import { auditLogService } from "./auditLogService";
import { DataService } from "./DataService";

// ========== TYPES ==========

export type ExitStage = "Initiated" | "Notice Period" | "Clearance" | "F&F Settlement" | "Exited";

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
      auditLogService.logAction({
        action: "INITIATE_EXIT",
        entityType: "EXIT_WORKFLOW",
        entityId: exitWorkflowId,
        performedBy: request.initiatedBy,
        details: {
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
      auditLogService.logAction({
        action: "EXIT_STAGE_CHANGE",
        entityType: "EXIT_WORKFLOW",
        entityId: exitWorkflowId,
        performedBy: completedBy,
        details: {
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
