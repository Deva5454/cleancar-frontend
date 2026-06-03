/**
 * Payroll Workflow Engine (MC-22)
 *
 * Implements state-driven payroll pipeline:
 * Draft → Under Review → Approved → Disbursed
 *
 * RULES:
 * - Every transition must be validated
 * - Role-based action restrictions
 * - Once disbursed → immutable
 * - Full audit trail
 */

import type { Role } from "../lib/roleConfig";

// ========== PAYROLL STATUS ==========

export type PayrollStatus =
  | "draft"           // Initial state - being prepared
  | "under_review"    // Submitted for review
  | "approved"        // Approved and ready for disbursement
  | "disbursed";      // Paid out - IMMUTABLE

// ========== WORKFLOW TRANSITIONS ==========

/**
 * Valid state transitions
 * Each status can only transition to specific next states
 */
const VALID_TRANSITIONS: Record<PayrollStatus, PayrollStatus[]> = {
  draft: ["under_review"],
  under_review: ["draft", "approved"], // Can reject back to draft
  approved: ["disbursed"],
  disbursed: [], // Terminal state - no transitions allowed
};

/**
 * Role-based permissions for each status
 * Defines which roles can act on payroll in each state
 */
const ROLE_PERMISSIONS: Record<PayrollStatus, Role[]> = {
  draft: ["HR", "Accounts", "Super Admin", "Admin"],
  under_review: ["HR", "Super Admin", "Admin"],
  approved: ["Accounts", "Super Admin", "Admin"],
  disbursed: [], // No one can modify disbursed payroll
};

// ========== WORKFLOW VALIDATION ==========

/**
 * Check if a role can transition payroll from current to next status
 *
 * @param role - User's role
 * @param currentStatus - Current payroll status
 * @param nextStatus - Desired next status
 * @returns true if transition is allowed
 */
export function canTransition(
  role: Role,
  currentStatus: PayrollStatus,
  nextStatus: PayrollStatus
): boolean {
  // Check if transition is valid
  const validNextStates = VALID_TRANSITIONS[currentStatus] || [];
  if (!validNextStates.includes(nextStatus)) {
    return false;
  }

  // Check if role has permission to act on current status
  const allowedRoles = ROLE_PERMISSIONS[currentStatus] || [];
  if (!allowedRoles.includes(role)) {
    return false;
  }

  return true;
}

/**
 * Check if a role can edit payroll in current status
 *
 * @param role - User's role
 * @param status - Payroll status
 * @returns true if editing is allowed
 */
export function canEdit(role: Role, status: PayrollStatus): boolean {
  // Disbursed payroll is immutable
  if (status === "disbursed") {
    return false;
  }

  // Only draft payroll can be edited
  if (status !== "draft") {
    return false;
  }

  const allowedRoles: Role[] = ["HR", "Accounts", "Super Admin", "Admin"];
  return allowedRoles.includes(role);
}

/**
 * Get available actions for a role on a payroll status
 *
 * @param role - User's role
 * @param status - Current payroll status
 * @returns List of available action labels
 */
export function getAvailableActions(role: Role, status: PayrollStatus): string[] {
  const actions: string[] = [];

  if (canTransition(role, status, "under_review")) {
    actions.push("Send to Review");
  }

  if (canTransition(role, status, "approved")) {
    actions.push("Approve");
  }

  if (canTransition(role, status, "disbursed")) {
    actions.push("Disburse");
  }

  if (canTransition(role, status, "draft")) {
    actions.push("Reject to Draft");
  }

  if (canEdit(role, status)) {
    actions.push("Edit");
  }

  return actions;
}

/**
 * Get next status for an action
 *
 * @param action - Action label
 * @returns Corresponding next status
 */
export function getNextStatus(action: string): PayrollStatus | null {
  const actionMap: Record<string, PayrollStatus> = {
    "Send to Review": "under_review",
    "Approve": "approved",
    "Disburse": "disbursed",
    "Reject to Draft": "draft",
  };

  return actionMap[action] || null;
}

/**
 * Validate if payroll can be transitioned
 *
 * @param role - User's role
 * @param currentStatus - Current status
 * @param nextStatus - Desired status
 * @returns Validation result with error message if invalid
 */
export function validateTransition(
  role: Role,
  currentStatus: PayrollStatus,
  nextStatus: PayrollStatus
): { valid: boolean; error?: string } {
  if (!canTransition(role, currentStatus, nextStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${nextStatus} with role ${role}`,
    };
  }

  return { valid: true };
}

/**
 * Get status display information
 *
 * @param status - Payroll status
 * @returns Display info with label and color
 */
export function getStatusDisplay(status: PayrollStatus): {
  label: string;
  color: "gray" | "yellow" | "green" | "blue";
} {
  const displays = {
    draft: { label: "Draft", color: "gray" as const },
    under_review: { label: "Under Review", color: "yellow" as const },
    approved: { label: "Approved", color: "green" as const },
    disbursed: { label: "Disbursed", color: "blue" as const },
  };

  return displays[status];
}
