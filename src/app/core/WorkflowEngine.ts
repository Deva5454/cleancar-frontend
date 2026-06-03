/**
 * Centralized Workflow Engine
 * 
 * Handles all approval workflows, state transitions, and business process flows.
 * Eliminates duplicate workflow logic across modules.
 * 
 * @module WorkflowEngine
 */

import { ApprovalStatus, isValidTransition, APPROVAL_TRANSITIONS } from "./StatusSystem";
import type { Role } from "../lib/roleConfig";

// ==================== WORKFLOW TYPES ====================

/**
 * Workflow step configuration
 */
export interface WorkflowStep {
  id: string;
  name: string;
  approverRole: Role | Role[];
  status: ApprovalStatus;
  nextStatus: ApprovalStatus;
  rejectionStatus: ApprovalStatus;
  autoApprove?: (data: any) => boolean;
  notifyOnApproval?: boolean;
  notifyOnRejection?: boolean;
  canSkip?: boolean;
  timeoutHours?: number;
}

/**
 * Complete workflow definition
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  initialStatus: ApprovalStatus;
  finalStatus: ApprovalStatus;
  failureStatus: ApprovalStatus;
}

/**
 * Workflow instance tracking
 */
export interface WorkflowInstance {
  id: string;
  workflowId: string;
  entityType: string;
  entityId: string;
  currentStep: number;
  currentStatus: ApprovalStatus;
  history: WorkflowHistoryEntry[];
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Workflow history entry
 */
export interface WorkflowHistoryEntry {
  timestamp: Date;
  actor: string;
  actorRole: Role;
  action: "approve" | "reject" | "skip" | "timeout";
  fromStatus: ApprovalStatus;
  toStatus: ApprovalStatus;
  stepId: string;
  comments?: string;
  metadata?: Record<string, any>;
}

// ==================== PREDEFINED WORKFLOWS ====================

/**
 * Leave approval workflow (2-level)
 */
export const LEAVE_WORKFLOW: WorkflowDefinition = {
  id: "leave_approval",
  name: "Leave Request Approval",
  description: "Two-level approval for leave requests: Supervisor → HR",
  initialStatus: ApprovalStatus.PENDING,
  finalStatus: ApprovalStatus.APPROVED,
  failureStatus: ApprovalStatus.REJECTED,
  steps: [
    {
      id: "supervisor_approval",
      name: "Supervisor Approval",
      approverRole: "Supervisor",
      status: ApprovalStatus.PENDING_L1,
      nextStatus: ApprovalStatus.APPROVED_L1,
      rejectionStatus: ApprovalStatus.REJECTED_L1,
      notifyOnApproval: true,
      notifyOnRejection: true,
      timeoutHours: 24,
    },
    {
      id: "hr_approval",
      name: "HR Approval",
      approverRole: "HR",
      status: ApprovalStatus.PENDING_L2,
      nextStatus: ApprovalStatus.APPROVED_L2,
      rejectionStatus: ApprovalStatus.REJECTED_L2,
      notifyOnApproval: true,
      notifyOnRejection: true,
      timeoutHours: 48,
    },
  ],
};

/**
 * Purchase requisition workflow (3-level)
 */
export const PURCHASE_REQUISITION_WORKFLOW: WorkflowDefinition = {
  id: "purchase_requisition",
  name: "Purchase Requisition Approval",
  description: "Three-level approval: Supervisor → Manager → Accounts",
  initialStatus: ApprovalStatus.PENDING,
  finalStatus: ApprovalStatus.APPROVED,
  failureStatus: ApprovalStatus.REJECTED,
  steps: [
    {
      id: "supervisor_approval",
      name: "Supervisor Approval",
      approverRole: "Supervisor",
      status: ApprovalStatus.PENDING_L1,
      nextStatus: ApprovalStatus.APPROVED_L1,
      rejectionStatus: ApprovalStatus.REJECTED_L1,
      autoApprove: (data) => data.amount < 1000,
      timeoutHours: 24,
    },
    {
      id: "manager_approval",
      name: "Operations Manager Approval",
      approverRole: "Operations Manager",
      status: ApprovalStatus.PENDING_L2,
      nextStatus: ApprovalStatus.APPROVED_L2,
      rejectionStatus: ApprovalStatus.REJECTED_L2,
      autoApprove: (data) => data.amount < 5000,
      timeoutHours: 48,
    },
    {
      id: "accounts_approval",
      name: "Accounts Approval",
      approverRole: "Accounts",
      status: ApprovalStatus.APPROVED,
      nextStatus: ApprovalStatus.APPROVED,
      rejectionStatus: ApprovalStatus.REJECTED,
      timeoutHours: 72,
    },
  ],
};

/**
 * Expense approval workflow
 */
export const EXPENSE_APPROVAL_WORKFLOW: WorkflowDefinition = {
  id: "expense_approval",
  name: "Expense Approval",
  description: "Expense claims approval workflow",
  initialStatus: ApprovalStatus.PENDING,
  finalStatus: ApprovalStatus.APPROVED,
  failureStatus: ApprovalStatus.REJECTED,
  steps: [
    {
      id: "manager_approval",
      name: "Manager Approval",
      approverRole: ["Supervisor", "Operations Manager"],
      status: ApprovalStatus.PENDING_L1,
      nextStatus: ApprovalStatus.APPROVED_L1,
      rejectionStatus: ApprovalStatus.REJECTED_L1,
      autoApprove: (data) => data.amount < 500,
      timeoutHours: 24,
    },
    {
      id: "accounts_approval",
      name: "Accounts Approval",
      approverRole: "Accounts",
      status: ApprovalStatus.PENDING_L2,
      nextStatus: ApprovalStatus.APPROVED,
      rejectionStatus: ApprovalStatus.REJECTED,
      timeoutHours: 48,
    },
  ],
};

/**
 * Onboarding approval workflow
 */
export const ONBOARDING_WORKFLOW: WorkflowDefinition = {
  id: "onboarding_approval",
  name: "Employee Onboarding",
  description: "New employee onboarding approval",
  initialStatus: ApprovalStatus.PENDING,
  finalStatus: ApprovalStatus.APPROVED,
  failureStatus: ApprovalStatus.REJECTED,
  steps: [
    {
      id: "hr_approval",
      name: "HR Document Verification",
      approverRole: "HR",
      status: ApprovalStatus.PENDING_L1,
      nextStatus: ApprovalStatus.APPROVED_L1,
      rejectionStatus: ApprovalStatus.REJECTED_L1,
      timeoutHours: 48,
    },
    {
      id: "manager_approval",
      name: "Reporting Manager Approval",
      approverRole: ["Supervisor", "Operations Manager"],
      status: ApprovalStatus.PENDING_L2,
      nextStatus: ApprovalStatus.APPROVED,
      rejectionStatus: ApprovalStatus.REJECTED,
      timeoutHours: 24,
    },
  ],
};

// ==================== WORKFLOW REGISTRY ====================

/**
 * Central registry of all workflows
 */
export const WORKFLOW_REGISTRY: Record<string, WorkflowDefinition> = {
  leave: LEAVE_WORKFLOW,
  purchase_requisition: PURCHASE_REQUISITION_WORKFLOW,
  expense: EXPENSE_APPROVAL_WORKFLOW,
  onboarding: ONBOARDING_WORKFLOW,
};

// ==================== WORKFLOW ENGINE ====================

/**
 * Workflow Engine Class
 * Handles workflow execution, state transitions, and approvals
 */
export class WorkflowEngine {
  private workflows: Map<string, WorkflowInstance> = new Map();

  /**
   * Start a new workflow instance
   */
  startWorkflow(
    workflowId: string,
    entityType: string,
    entityId: string,
    data: Record<string, any>,
    createdBy: string
  ): WorkflowInstance {
    const definition = WORKFLOW_REGISTRY[workflowId];
    if (!definition) {
      throw new Error(`Workflow definition not found: ${workflowId}`);
    }

    const instance: WorkflowInstance = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      entityType,
      entityId,
      currentStep: 0,
      currentStatus: definition.initialStatus,
      history: [
        {
          timestamp: new Date(),
          actor: createdBy,
          actorRole: "Super Admin", // Would come from user context
          action: "approve",
          fromStatus: definition.initialStatus,
          toStatus: definition.steps[0].status,
          stepId: "init",
        },
      ],
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    // Check for auto-approval on first step
    const firstStep = definition.steps[0];
    if (firstStep.autoApprove && firstStep.autoApprove(data)) {
      instance.currentStatus = ApprovalStatus.AUTO_APPROVED;
      instance.currentStep = definition.steps.length;
    } else {
      instance.currentStatus = firstStep.status;
    }

    this.workflows.set(instance.id, instance);
    return instance;
  }

  /**
   * Approve current workflow step
   */
  approve(
    instanceId: string,
    actor: string,
    actorRole: Role,
    comments?: string
  ): WorkflowInstance {
    const instance = this.workflows.get(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }

    const definition = WORKFLOW_REGISTRY[instance.workflowId];
    if (!definition) {
      throw new Error(`Workflow definition not found: ${instance.workflowId}`);
    }

    const currentStep = definition.steps[instance.currentStep];
    if (!currentStep) {
      throw new Error(`Invalid workflow step: ${instance.currentStep}`);
    }

    // Validate approver role
    const allowedRoles = Array.isArray(currentStep.approverRole)
      ? currentStep.approverRole
      : [currentStep.approverRole];
    if (!allowedRoles.includes(actorRole)) {
      throw new Error(`User role ${actorRole} not authorized to approve this step`);
    }

    // Record history
    instance.history.push({
      timestamp: new Date(),
      actor,
      actorRole,
      action: "approve",
      fromStatus: instance.currentStatus,
      toStatus: currentStep.nextStatus,
      stepId: currentStep.id,
      comments,
    });

    // Move to next step
    instance.currentStep++;
    if (instance.currentStep < definition.steps.length) {
      // More steps remaining
      const nextStep = definition.steps[instance.currentStep];
      instance.currentStatus = nextStep.status;

      // Check for auto-approval
      if (nextStep.autoApprove && nextStep.autoApprove(instance.data)) {
        return this.approve(instanceId, "System", "Super Admin", "Auto-approved");
      }
    } else {
      // Workflow complete
      instance.currentStatus = definition.finalStatus;
    }

    instance.updatedAt = new Date();
    return instance;
  }

  /**
   * Reject current workflow step
   */
  reject(
    instanceId: string,
    actor: string,
    actorRole: Role,
    reason: string
  ): WorkflowInstance {
    const instance = this.workflows.get(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }

    const definition = WORKFLOW_REGISTRY[instance.workflowId];
    const currentStep = definition.steps[instance.currentStep];

    // Validate approver role
    const allowedRoles = Array.isArray(currentStep.approverRole)
      ? currentStep.approverRole
      : [currentStep.approverRole];
    if (!allowedRoles.includes(actorRole)) {
      throw new Error(`User role ${actorRole} not authorized to reject this step`);
    }

    // Record history
    instance.history.push({
      timestamp: new Date(),
      actor,
      actorRole,
      action: "reject",
      fromStatus: instance.currentStatus,
      toStatus: currentStep.rejectionStatus,
      stepId: currentStep.id,
      comments: reason,
    });

    instance.currentStatus = definition.failureStatus;
    instance.updatedAt = new Date();
    return instance;
  }

  /**
   * Get workflow instance
   */
  getInstance(instanceId: string): WorkflowInstance | undefined {
    return this.workflows.get(instanceId);
  }

  /**
   * Get all instances for an entity
   */
  getInstancesByEntity(entityType: string, entityId: string): WorkflowInstance[] {
    return Array.from(this.workflows.values()).filter(
      (instance) => instance.entityType === entityType && instance.entityId === entityId
    );
  }

  /**
   * Get pending approvals for a role
   */
  getPendingApprovals(role: Role): WorkflowInstance[] {
    return Array.from(this.workflows.values()).filter((instance) => {
      const definition = WORKFLOW_REGISTRY[instance.workflowId];
      if (!definition) return false;

      const currentStep = definition.steps[instance.currentStep];
      if (!currentStep) return false;

      const allowedRoles = Array.isArray(currentStep.approverRole)
        ? currentStep.approverRole
        : [currentStep.approverRole];

      return (
        allowedRoles.includes(role) &&
        instance.currentStatus.includes("Pending")
      );
    });
  }
}

// ==================== SINGLETON INSTANCE ====================

/**
 * Global workflow engine instance
 */
export const workflowEngine = new WorkflowEngine();

// ==================== HELPER FUNCTIONS ====================

/**
 * Get workflow definition by ID
 */
export function getWorkflowDefinition(workflowId: string): WorkflowDefinition | undefined {
  return WORKFLOW_REGISTRY[workflowId];
}

/**
 * Check if user can approve a workflow step
 */
export function canApproveStep(
  workflowInstance: WorkflowInstance,
  userRole: Role
): boolean {
  const definition = WORKFLOW_REGISTRY[workflowInstance.workflowId];
  if (!definition) return false;

  const currentStep = definition.steps[workflowInstance.currentStep];
  if (!currentStep) return false;

  const allowedRoles = Array.isArray(currentStep.approverRole)
    ? currentStep.approverRole
    : [currentStep.approverRole];

  return allowedRoles.includes(userRole);
}

/**
 * Get next approver role(s) for a workflow instance
 */
export function getNextApprover(workflowInstance: WorkflowInstance): Role | Role[] | null {
  const definition = WORKFLOW_REGISTRY[workflowInstance.workflowId];
  if (!definition) return null;

  const currentStep = definition.steps[workflowInstance.currentStep];
  return currentStep ? currentStep.approverRole : null;
}

/**
 * Calculate workflow progress percentage
 */
export function getWorkflowProgress(workflowInstance: WorkflowInstance): number {
  const definition = WORKFLOW_REGISTRY[workflowInstance.workflowId];
  if (!definition) return 0;

  return Math.round((workflowInstance.currentStep / definition.steps.length) * 100);
}
