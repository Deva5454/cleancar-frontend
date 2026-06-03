/**
 * Employee Lifecycle Engine
 *
 * Manages employee lifecycle states and transitions with workflow automation
 * States: Draft → Active → Probation → Confirmed → Exit Initiated → Exited
 */

import { DataService } from "./DataService";
import { logger } from "./logger";

// ========== TYPES ==========

export type LifecycleState =
  | "Draft"           // Initial state - employee created but not onboarded
  | "Active"          // Onboarding complete, employee working
  | "Probation"       // Under probation period
  | "Confirmed"       // Probation complete, permanent employee
  | "Exit Initiated"  // Exit process started
  | "Exited";         // Employment ended

export type WorkflowStep =
  | "Basic Info"
  | "Document Upload"
  | "Role Assignment"
  | "Shift Assignment";

export type ApprovalStatus = "Pending" | "Approved" | "Rejected";

/**
 * Employee Lifecycle Record - Enhanced Employee Master with lifecycle tracking
 */
export interface EmployeeLifecycle {
  employeeId: string;
  currentState: LifecycleState;
  previousState?: LifecycleState;

  // Onboarding workflow
  onboardingProgress: {
    currentStep: number;           // 1-4
    completedSteps: WorkflowStep[];
    basicInfoComplete: boolean;
    documentsComplete: boolean;
    roleAssignmentComplete: boolean;
    shiftAssignmentComplete: boolean;
  };

  // Probation tracking
  probationStartDate?: string;
  probationEndDate?: string;
  probationDurationDays?: number;

  // Exit tracking
  exitInitiatedDate?: string;
  exitInitiatedBy?: string;
  exitReason?: string;
  lastWorkingDate?: string;
  exitCompletedDate?: string;

  // Approvals
  hrApproval?: {
    status: ApprovalStatus;
    approvedBy?: string;
    approvedAt?: string;
    comments?: string;
  };
  cityManagerApproval?: {
    status: ApprovalStatus;
    approvedBy?: string;
    approvedAt?: string;
    comments?: string;
  };

  // Validation status
  validationStatus: {
    hasBasicInfo: boolean;
    hasDocuments: boolean;
    hasRole: boolean;
    hasShift: boolean;
    canActivate: boolean;
    canRunPayroll: boolean;
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastStateChange?: string;
  lastUpdatedBy?: string;
}

/**
 * State transition event
 */
export interface StateTransition {
  transitionId: string;
  employeeId: string;
  fromState: LifecycleState;
  toState: LifecycleState;
  triggeredBy: string;
  triggeredAt: string;
  reason?: string;
  approvalRequired: boolean;
  approvalStatus?: ApprovalStatus;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  rule: string;
  passed: boolean;
  message: string;
  blocksActivation?: boolean;
  blocksPayroll?: boolean;
}

// ========== SERVICE ==========

class EmployeeLifecycleEngine {
  private readonly STORAGE_KEY = "EMPLOYEE_LIFECYCLE";
  private readonly TRANSITIONS_KEY = "LIFECYCLE_TRANSITIONS";

  /**
   * Get all lifecycle records
   */
  getAll(): EmployeeLifecycle[] {
    return DataService.get<EmployeeLifecycle>(this.STORAGE_KEY);
  }

  /**
   * Get lifecycle record by employee ID
   */
  getById(employeeId: string): EmployeeLifecycle | null {
    const records = this.getAll();
    return records.find(rec => rec.employeeId === employeeId) || null;
  }

  /**
   * Get employees by state
   */
  getByState(state: LifecycleState): EmployeeLifecycle[] {
    return this.getAll().filter(rec => rec.currentState === state);
  }

  /**
   * Get employees pending approval
   */
  getPendingApprovals(approvalType?: "hr" | "cityManager"): EmployeeLifecycle[] {
    const records = this.getAll();
    if (approvalType === "hr") {
      return records.filter(rec => rec.hrApproval?.status === "Pending");
    }
    if (approvalType === "cityManager") {
      return records.filter(rec => rec.cityManagerApproval?.status === "Pending");
    }
    return records.filter(rec =>
      rec.hrApproval?.status === "Pending" ||
      rec.cityManagerApproval?.status === "Pending"
    );
  }

  /**
   * Initialize lifecycle for new employee
   */
  initializeLifecycle(employeeId: string, createdBy: string): EmployeeLifecycle {
    const now = new Date().toISOString();
    const lifecycle: EmployeeLifecycle = {
      employeeId,
      currentState: "Draft",
      onboardingProgress: {
        currentStep: 1,
        completedSteps: [],
        basicInfoComplete: false,
        documentsComplete: false,
        roleAssignmentComplete: false,
        shiftAssignmentComplete: false,
      },
      validationStatus: {
        hasBasicInfo: false,
        hasDocuments: false,
        hasRole: false,
        hasShift: false,
        canActivate: false,
        canRunPayroll: false,
      },
      createdAt: now,
      updatedAt: now,
      lastUpdatedBy: createdBy,
    };

    const records = this.getAll();
    DataService.setAll(this.STORAGE_KEY, [...records, lifecycle]);

    logger.log("EmployeeLifecycle: Initialized", { employeeId });
    return lifecycle;
  }

  /**
   * Update onboarding progress
   */
  updateOnboardingProgress(
    employeeId: string,
    step: WorkflowStep,
    completed: boolean,
    updatedBy: string
  ): EmployeeLifecycle | null {
    const lifecycle = this.getById(employeeId);
    if (!lifecycle) {
      logger.error("EmployeeLifecycle: Record not found", { employeeId });
      return null;
    }

    const progress = lifecycle.onboardingProgress;

    // Update step completion
    if (completed && !progress.completedSteps.includes(step)) {
      progress.completedSteps.push(step);
    }

    // Update specific flags
    switch (step) {
      case "Basic Info":
        progress.basicInfoComplete = completed;
        break;
      case "Document Upload":
        progress.documentsComplete = completed;
        break;
      case "Role Assignment":
        progress.roleAssignmentComplete = completed;
        break;
      case "Shift Assignment":
        progress.shiftAssignmentComplete = completed;
        break;
    }

    // Update current step (1-4)
    progress.currentStep = Math.min(progress.completedSteps.length + 1, 4);

    // Update validation status
    lifecycle.validationStatus.hasBasicInfo = progress.basicInfoComplete;
    lifecycle.validationStatus.hasDocuments = progress.documentsComplete;
    lifecycle.validationStatus.hasRole = progress.roleAssignmentComplete;
    lifecycle.validationStatus.hasShift = progress.shiftAssignmentComplete;
    lifecycle.validationStatus.canActivate =
      progress.basicInfoComplete &&
      progress.documentsComplete &&
      progress.roleAssignmentComplete;

    return this.updateLifecycle(employeeId, {
      onboardingProgress: progress,
      validationStatus: lifecycle.validationStatus,
      lastUpdatedBy: updatedBy,
    });
  }

  /**
   * Transition to new state
   */
  transitionState(
    employeeId: string,
    toState: LifecycleState,
    triggeredBy: string,
    reason?: string
  ): { success: boolean; lifecycle?: EmployeeLifecycle; error?: string } {
    const lifecycle = this.getById(employeeId);
    if (!lifecycle) {
      return { success: false, error: "Employee lifecycle not found" };
    }

    const fromState = lifecycle.currentState;

    // Validate transition
    const validation = this.validateTransition(lifecycle, toState);
    if (!validation.isValid) {
      return { success: false, error: validation.reason };
    }

    // Record transition
    const transition: StateTransition = {
      transitionId: `TRANS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      employeeId,
      fromState,
      toState,
      triggeredBy,
      triggeredAt: new Date().toISOString(),
      reason,
      approvalRequired: validation.requiresApproval,
    };

    this.recordTransition(transition);

    // Update lifecycle
    const updates: Partial<EmployeeLifecycle> = {
      currentState: toState,
      previousState: fromState,
      lastStateChange: new Date().toISOString(),
      lastUpdatedBy: triggeredBy,
    };

    // State-specific updates
    if (toState === "Probation") {
      const probationDays = 90; // Default probation period
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + probationDays);

      updates.probationStartDate = startDate.toISOString().split('T')[0];
      updates.probationEndDate = endDate.toISOString().split('T')[0];
      updates.probationDurationDays = probationDays;
    }

    if (toState === "Exit Initiated") {
      updates.exitInitiatedDate = new Date().toISOString().split('T')[0];
      updates.exitInitiatedBy = triggeredBy;
      updates.exitReason = reason;
    }

    if (toState === "Exited") {
      updates.exitCompletedDate = new Date().toISOString().split('T')[0];
      updates.lastWorkingDate = new Date().toISOString().split('T')[0];
    }

    const updated = this.updateLifecycle(employeeId, updates);
    if (!updated) {
      return { success: false, error: "Failed to update lifecycle" };
    }

    logger.log("EmployeeLifecycle: State transition", {
      employeeId,
      fromState,
      toState,
      triggeredBy
    });

    return { success: true, lifecycle: updated };
  }

  /**
   * Validate state transition
   */
  private validateTransition(
    lifecycle: EmployeeLifecycle,
    toState: LifecycleState
  ): { isValid: boolean; reason?: string; requiresApproval: boolean } {
    const fromState = lifecycle.currentState;

    // Define valid transitions
    const validTransitions: Record<LifecycleState, LifecycleState[]> = {
      "Draft": ["Active"],
      "Active": ["Probation", "Exit Initiated"],
      "Probation": ["Confirmed", "Exit Initiated"],
      "Confirmed": ["Exit Initiated"],
      "Exit Initiated": ["Exited"],
      "Exited": [], // Terminal state
    };

    if (!validTransitions[fromState].includes(toState)) {
      return {
        isValid: false,
        reason: `Invalid transition from ${fromState} to ${toState}`,
        requiresApproval: false,
      };
    }

    // Check activation requirements
    if (toState === "Active") {
      if (!lifecycle.validationStatus.canActivate) {
        return {
          isValid: false,
          reason: "Cannot activate: Missing required onboarding steps",
          requiresApproval: false,
        };
      }
      return { isValid: true, requiresApproval: true }; // HR + City Manager approval
    }

    // Probation → Confirmed requires approval
    if (fromState === "Probation" && toState === "Confirmed") {
      return { isValid: true, requiresApproval: true };
    }

    // Exit requires approval
    if (toState === "Exit Initiated" || toState === "Exited") {
      return { isValid: true, requiresApproval: true };
    }

    return { isValid: true, requiresApproval: false };
  }

  /**
   * Request approval
   */
  requestApproval(
    employeeId: string,
    approvalType: "hr" | "cityManager",
    requestedBy: string
  ): EmployeeLifecycle | null {
    const lifecycle = this.getById(employeeId);
    if (!lifecycle) return null;

    const approval = {
      status: "Pending" as ApprovalStatus,
      approvedBy: undefined,
      approvedAt: undefined,
      comments: `Approval requested by ${requestedBy}`,
    };

    const updates: Partial<EmployeeLifecycle> = {};
    if (approvalType === "hr") {
      updates.hrApproval = approval;
    } else {
      updates.cityManagerApproval = approval;
    }

    return this.updateLifecycle(employeeId, updates);
  }

  /**
   * Approve/reject request
   */
  processApproval(
    employeeId: string,
    approvalType: "hr" | "cityManager",
    status: "Approved" | "Rejected",
    approvedBy: string,
    comments?: string
  ): EmployeeLifecycle | null {
    const lifecycle = this.getById(employeeId);
    if (!lifecycle) return null;

    const approval = {
      status,
      approvedBy,
      approvedAt: new Date().toISOString(),
      comments: comments || `${status} by ${approvedBy}`,
    };

    const updates: Partial<EmployeeLifecycle> = { lastUpdatedBy: approvedBy };
    if (approvalType === "hr") {
      updates.hrApproval = approval;
    } else {
      updates.cityManagerApproval = approval;
    }

    return this.updateLifecycle(employeeId, updates);
  }

  /**
   * Validate employee for payroll
   */
  validateForPayroll(employeeId: string, month: string): ValidationRule[] {
    const lifecycle = this.getById(employeeId);
    const rules: ValidationRule[] = [];

    if (!lifecycle) {
      rules.push({
        rule: "Employee exists",
        passed: false,
        message: "Employee lifecycle record not found",
        blocksPayroll: true,
      });
      return rules;
    }

    // Must be Active or higher
    rules.push({
      rule: "Employee activated",
      passed: ["Active", "Probation", "Confirmed"].includes(lifecycle.currentState),
      message: lifecycle.currentState === "Draft"
        ? "Employee must be activated before payroll can run"
        : "Employee is active",
      blocksPayroll: !["Active", "Probation", "Confirmed"].includes(lifecycle.currentState),
    });

    // Must have completed onboarding
    rules.push({
      rule: "Onboarding complete",
      passed: lifecycle.onboardingProgress.completedSteps.length === 4,
      message: `Onboarding: ${lifecycle.onboardingProgress.completedSteps.length}/4 steps complete`,
      blocksPayroll: lifecycle.onboardingProgress.completedSteps.length < 4,
    });

    // Must have role assignment
    rules.push({
      rule: "Role assigned",
      passed: lifecycle.validationStatus.hasRole,
      message: lifecycle.validationStatus.hasRole
        ? "Role assigned"
        : "No role assigned to employee",
      blocksPayroll: !lifecycle.validationStatus.hasRole,
    });

    // Check attendance (placeholder - would integrate with AttendanceMaster)
    const hasAttendance = true; // TODO: Check actual attendance
    rules.push({
      rule: "Attendance recorded",
      passed: hasAttendance,
      message: hasAttendance
        ? `Attendance recorded for ${month}`
        : `No attendance found for ${month}`,
      blocksPayroll: !hasAttendance,
    });

    return rules;
  }

  /**
   * Update lifecycle record
   */
  private updateLifecycle(
    employeeId: string,
    updates: Partial<EmployeeLifecycle>
  ): EmployeeLifecycle | null {
    const records = this.getAll();
    const index = records.findIndex(rec => rec.employeeId === employeeId);

    if (index === -1) {
      logger.error("EmployeeLifecycle: Record not found", { employeeId });
      return null;
    }

    const updated: EmployeeLifecycle = {
      ...records[index],
      ...updates,
      employeeId, // Prevent ID change
      createdAt: records[index].createdAt, // Preserve creation time
      updatedAt: new Date().toISOString(),
    };

    records[index] = updated;
    DataService.setAll(this.STORAGE_KEY, records);

    return updated;
  }

  /**
   * Record state transition
   */
  private recordTransition(transition: StateTransition): void {
    const transitions = DataService.get<StateTransition>(this.TRANSITIONS_KEY);
    DataService.setAll(this.TRANSITIONS_KEY, [...transitions, transition]);
  }

  /**
   * Get transition history
   */
  getTransitionHistory(employeeId: string): StateTransition[] {
    const transitions = DataService.get<StateTransition>(this.TRANSITIONS_KEY);
    return transitions
      .filter(t => t.employeeId === employeeId)
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  }

  /**
   * Get lifecycle statistics
   */
  getStatistics(): Record<LifecycleState, number> {
    const records = this.getAll();
    return {
      "Draft": records.filter(r => r.currentState === "Draft").length,
      "Active": records.filter(r => r.currentState === "Active").length,
      "Probation": records.filter(r => r.currentState === "Probation").length,
      "Confirmed": records.filter(r => r.currentState === "Confirmed").length,
      "Exit Initiated": records.filter(r => r.currentState === "Exit Initiated").length,
      "Exited": records.filter(r => r.currentState === "Exited").length,
    };
  }
}

// ========== EXPORT ==========

export const employeeLifecycleEngine = new EmployeeLifecycleEngine();
