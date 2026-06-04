/**
 * useWorkflow Hook
 * 
 * React hook for managing workflows in components.
 * Provides simplified interface to WorkflowEngine.
 * 
 * @module useWorkflow
 */

import { useState, useCallback, useEffect } from "react";
import {
  workflowEngine,
  WorkflowInstance,
  WorkflowDefinition,
  getWorkflowDefinition,
  canApproveStep,
  getNextApprover,
  getWorkflowProgress,
  WORKFLOW_REGISTRY,
} from "../core/WorkflowEngine";
import { useRole } from "../contexts/RoleContext";
import { toast } from "sonner";
import type { Role } from "../lib/roleConfig";

/**
 * Workflow hook return type
 */
export interface UseWorkflowReturn {
  // Actions
  startWorkflow: (
    workflowId: string,
    entityType: string,
    entityId: string,
    data: Record<string, any>
  ) => WorkflowInstance;
  approve: (instanceId: string, comments?: string) => void;
  reject: (instanceId: string, reason: string) => void;

  // Queries
  getInstance: (instanceId: string) => WorkflowInstance | undefined;
  getPendingApprovals: () => WorkflowInstance[];
  canApprove: (instanceId: string) => boolean;
  getProgress: (instanceId: string) => number;
  getDefinition: (workflowId: string) => WorkflowDefinition | undefined;

  // State
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for workflow management
 * 
 * @example
 * ```tsx
 * function LeaveApproval() {
 *   const { approve, reject, getPendingApprovals } = useWorkflow();
 *   const pendingLeaves = getPendingApprovals();
 *   
 *   return pendingLeaves.map(leave => (
 *     <ApprovalCard
 *       onApprove={() => approve(leave.id, "Approved")}
 *       onReject={() => reject(leave.id, "Not enough balance")}
 *     />
 *   ));
 * }
 * ```
 */
export function useWorkflow(): UseWorkflowReturn {
  const { currentUser, currentRole } = useRole();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Start a new workflow
   */
  const startWorkflow = useCallback(
    (
      workflowId: string,
      entityType: string,
      entityId: string,
      data: Record<string, any>
    ): WorkflowInstance => {
      setLoading(true);
      setError(null);

      try {
        const instance = workflowEngine.startWorkflow(
          workflowId,
          entityType,
          entityId,
          data,
          currentUser.name
        );

        toast.success(`Workflow started: ${workflowId}`);
        return instance;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error(`Failed to start workflow: ${errorMessage}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentUser.name]
  );

  /**
   * Approve current workflow step
   */
  const approve = useCallback(
    (instanceId: string, comments?: string): void => {
      setLoading(true);
      setError(null);

      try {
        workflowEngine.approve(
          instanceId,
          currentUser.name,
          currentRole as Role,
          comments
        );

        toast.success("Approved successfully");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error(`Approval failed: ${errorMessage}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentUser.name, currentRole]
  );

  /**
   * Reject current workflow step
   */
  const reject = useCallback(
    (instanceId: string, reason: string): void => {
      setLoading(true);
      setError(null);

      try {
        workflowEngine.reject(
          instanceId,
          currentUser.name,
          currentRole as Role,
          reason
        );

        toast.success("Rejected");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error(`Rejection failed: ${errorMessage}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentUser.name, currentRole]
  );

  /**
   * Get workflow instance by ID
   */
  const getInstance = useCallback((instanceId: string): WorkflowInstance | undefined => {
    return workflowEngine.getInstance(instanceId);
  }, []);

  /**
   * Get all pending approvals for current user's role
   */
  const getPendingApprovals = useCallback((): WorkflowInstance[] => {
    return workflowEngine.getPendingApprovals(currentRole as Role);
  }, [currentRole]);

  /**
   * Check if current user can approve a specific instance
   */
  const canApprove = useCallback(
    (instanceId: string): boolean => {
      const instance = workflowEngine.getInstance(instanceId);
      if (!instance) return false;

      return canApproveStep(instance, currentRole as Role);
    },
    [currentRole]
  );

  /**
   * Get workflow progress percentage
   */
  const getProgress = useCallback((instanceId: string): number => {
    const instance = workflowEngine.getInstance(instanceId);
    if (!instance) return 0;

    return getWorkflowProgress(instance);
  }, []);

  /**
   * Get workflow definition
   */
  const getDefinition = useCallback((workflowId: string): WorkflowDefinition | undefined => {
    return getWorkflowDefinition(workflowId);
  }, []);

  return {
    startWorkflow,
    approve,
    reject,
    getInstance,
    getPendingApprovals,
    canApprove,
    getProgress,
    getDefinition,
    loading,
    error,
  };
}

/**
 * Hook for specific workflow type
 * 
 * @example
 * ```tsx
 * const { pendingLeaves, approveLeave, rejectLeave } = useLeaveWorkflow();
 * ```
 */
export function useLeaveWorkflow() {
  const workflow = useWorkflow();

  const pendingLeaves = workflow.getPendingApprovals().filter(
    (instance) => instance.workflowId === "leave"
  );

  const approveLeave = (instanceId: string, comments?: string) => {
    workflow.approve(instanceId, comments);
  };

  const rejectLeave = (instanceId: string, reason: string) => {
    workflow.reject(instanceId, reason);
  };

  return {
    pendingLeaves,
    approveLeave,
    rejectLeave,
    ...workflow,
  };
}

/**
 * Hook for purchase requisition workflow
 */
export function usePurchaseWorkflow() {
  const workflow = useWorkflow();

  const pendingPurchases = workflow.getPendingApprovals().filter(
    (instance) => instance.workflowId === "purchase_requisition"
  );

  const approvePurchase = (instanceId: string, comments?: string) => {
    workflow.approve(instanceId, comments);
  };

  const rejectPurchase = (instanceId: string, reason: string) => {
    workflow.reject(instanceId, reason);
  };

  return {
    pendingPurchases,
    approvePurchase,
    rejectPurchase,
    ...workflow,
  };
}

/**
 * Hook for expense approval workflow
 */
export function useExpenseWorkflow() {
  const workflow = useWorkflow();

  const pendingExpenses = workflow.getPendingApprovals().filter(
    (instance) => instance.workflowId === "expense"
  );

  const approveExpense = (instanceId: string, comments?: string) => {
    workflow.approve(instanceId, comments);
  };

  const rejectExpense = (instanceId: string, reason: string) => {
    workflow.reject(instanceId, reason);
  };

  return {
    pendingExpenses,
    approveExpense,
    rejectExpense,
    ...workflow,
  };
}
