/**
 * useActionPermission Hook - Check user's permission for an action
 *
 * Makes it easy to conditionally render UI based on user's permission level
 */

import { useMemo } from "react";
import {
  ActionOwnershipHelper,
  type ActionPermission,
  type ActionOwner,
} from "../services/ActionOwnershipModel";

interface ActionPermissionState {
  permission: ActionPermission | null;
  primaryOwner: ActionOwner | null;
  canPerform: boolean;
  canRequest: boolean;
  isViewOnly: boolean;
  hasAccess: boolean;
}

/**
 * Check user's permission for a specific action
 *
 * @param action - The action to check (e.g., "CREATE_EMPLOYEE", "MARK_ATTENDANCE")
 * @param userModule - The user's module/role (e.g., "HR", "Supervisor", "Finance")
 * @returns Permission state for the action
 *
 * @example
 * ```tsx
 * const { canPerform, permission } = useActionPermission("CREATE_EMPLOYEE", "HR");
 *
 * if (canPerform) {
 *   return <button onClick={createEmployee}>Create Employee</button>;
 * }
 *
 * return <ActionPermissionBadge permission={permission} />;
 * ```
 */
export function useActionPermission(
  action: string,
  userModule: string
): ActionPermissionState {
  const state = useMemo(() => {
    const permission = ActionOwnershipHelper.getPermission(action, userModule);
    const primaryOwner = ActionOwnershipHelper.getPrimaryOwner(action);

    return {
      permission,
      primaryOwner,
      canPerform: ActionOwnershipHelper.canPerform(action, userModule),
      canRequest: ActionOwnershipHelper.canRequest(action, userModule),
      isViewOnly: permission === "View Only",
      hasAccess: ActionOwnershipHelper.hasAccess(action, userModule),
    };
  }, [action, userModule]);

  return state;
}

/**
 * Get all actions available to a user's module
 *
 * @param userModule - The user's module/role
 * @returns All actions grouped by permission level
 *
 * @example
 * ```tsx
 * const { primary, request, viewOnly } = useModuleActions("HR");
 *
 * // primary: ["CREATE_EMPLOYEE", "ASSIGN_ROLE", ...]
 * // request: ["CORRECT_ATTENDANCE", ...]
 * // viewOnly: ["MARK_PAYROLL_PAID", ...]
 * ```
 */
export function useModuleActions(userModule: string) {
  return useMemo(
    () => ActionOwnershipHelper.getModuleActions(userModule),
    [userModule]
  );
}

/**
 * Validate if an operation is allowed
 *
 * @param action - The action to validate
 * @param userModule - The user's module/role
 * @returns Validation result with message if not allowed
 *
 * @example
 * ```tsx
 * const validation = useOperationValidation("CREATE_EMPLOYEE", currentUser.module);
 *
 * if (!validation.allowed) {
 *   toast.error(validation.message);
 *   return;
 * }
 *
 * // Proceed with operation
 * ```
 */
export function useOperationValidation(action: string, userModule: string) {
  return useMemo(
    () => ActionOwnershipHelper.validateOperation(action, userModule),
    [action, userModule]
  );
}
