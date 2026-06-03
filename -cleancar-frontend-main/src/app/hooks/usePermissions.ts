/**
 * usePermissions Hook
 * 
 * React hook for permission checks in components.
 * Provides simplified interface to RolePermissionSystem.
 * 
 * @module usePermissions
 */

import { useMemo, useCallback } from "react";
import {
  SystemRole,
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  isSeniorRole,
  reportsTo,
  getSubordinateRoles,
  canAccessModule,
  canApproveWorkflowLevel,
} from "../core/RolePermissionSystem";
import { useRole } from "../contexts/RoleContext";

/**
 * Permission hook return type
 */
export interface UsePermissionsReturn {
  // Permission checks
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  
  // Role checks
  isSenior: (otherRole: SystemRole) => boolean;
  isSubordinate: (otherRole: SystemRole) => boolean;
  canApproveLevel: (level: "L1" | "L2") => boolean;
  
  // Module access
  canAccessModule: (moduleName: string) => boolean;
  
  // Data
  permissions: Permission[];
  role: SystemRole;
  subordinates: SystemRole[];
}

/**
 * Custom hook for permission management
 * 
 * @example
 * ```tsx
 * function FinanceModule() {
 *   const { can, canAccessModule } = usePermissions();
 *   
 *   if (!canAccessModule('finance')) {
 *     return <AccessDenied />;
 *   }
 *   
 *   return (
 *     <div>
 *       {can(Permission.VIEW_FINANCIALS) && <RevenueChart />}
 *       {can(Permission.APPROVE_EXPENSE) && <ExpenseApprovals />}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  const { currentRole } = useRole();
  const role = currentRole as SystemRole;

  /**
   * Check if current user has a specific permission
   */
  const can = useCallback(
    (permission: Permission): boolean => {
      return hasPermission(role, permission);
    },
    [role]
  );

  /**
   * Check if current user has any of the given permissions
   */
  const canAny = useCallback(
    (permissions: Permission[]): boolean => {
      return hasAnyPermission(role, permissions);
    },
    [role]
  );

  /**
   * Check if current user has all of the given permissions
   */
  const canAll = useCallback(
    (permissions: Permission[]): boolean => {
      return hasAllPermissions(role, permissions);
    },
    [role]
  );

  /**
   * Check if current role is senior to another role
   */
  const isSenior = useCallback(
    (otherRole: SystemRole): boolean => {
      return isSeniorRole(role, otherRole);
    },
    [role]
  );

  /**
   * Check if another role is subordinate to current role
   */
  const isSubordinate = useCallback(
    (otherRole: SystemRole): boolean => {
      return reportsTo(otherRole, role);
    },
    [role]
  );

  /**
   * Check if current role can approve at specific level
   */
  const canApproveLevel = useCallback(
    (level: "L1" | "L2"): boolean => {
      return canApproveWorkflowLevel(role, level);
    },
    [role]
  );

  /**
   * Check if current role can access a module
   */
  const canAccessModuleCheck = useCallback(
    (moduleName: string): boolean => {
      return canAccessModule(role, moduleName);
    },
    [role]
  );

  /**
   * Get all permissions for current role
   */
  const permissions = useMemo(() => {
    return getRolePermissions(role);
  }, [role]);

  /**
   * Get all subordinate roles
   */
  const subordinates = useMemo(() => {
    return getSubordinateRoles(role);
  }, [role]);

  return {
    can,
    canAny,
    canAll,
    isSenior,
    isSubordinate,
    canApproveLevel,
    canAccessModule: canAccessModuleCheck,
    permissions,
    role,
    subordinates,
  };
}

/**
 * Hook for common permission patterns
 */
export function useCommonPermissions() {
  const perms = usePermissions();

  return {
    ...perms,
    
    // Financial permissions
    canViewFinancials: perms.can(Permission.VIEW_FINANCIALS),
    canApproveExpense: perms.can(Permission.APPROVE_EXPENSE),
    canExportReports: perms.can(Permission.EXPORT_REPORTS),
    
    // Leave permissions
    canApproveLeave: perms.canAny([
      Permission.APPROVE_LEAVE_L1,
      Permission.APPROVE_LEAVE_L2,
    ]),
    canViewTeamLeaves: perms.can(Permission.VIEW_TEAM_LEAVES),
    
    // Inventory permissions
    canManageInventory: perms.can(Permission.MANAGE_INVENTORY),
    canApproveRequisition: perms.canAny([
      Permission.APPROVE_REQUISITION_L1,
      Permission.APPROVE_REQUISITION_L2,
    ]),
    
    // HR permissions
    canManageOnboarding: perms.can(Permission.MANAGE_ONBOARDING),
    canProcessExit: perms.can(Permission.PROCESS_EXIT),
    
    // CRM permissions
    canManageLeads: perms.can(Permission.MANAGE_LEADS),
    canScheduleDemo: perms.can(Permission.SCHEDULE_DEMO),
    
    // Operations permissions
    canAssignTasks: perms.can(Permission.ASSIGN_TASKS),
    canVerifyWork: perms.can(Permission.VERIFY_WORK),
    
    // Analytics permissions
    canViewAnalytics: perms.can(Permission.VIEW_ANALYTICS),
    canViewAuditTrail: perms.can(Permission.VIEW_AUDIT_TRAIL),
    
    // System permissions
    canManageUsers: perms.canAny([
      Permission.CREATE_USER,
      Permission.EDIT_USER,
      Permission.DELETE_USER,
    ]),
    canManageSystem: perms.can(Permission.SYSTEM_SETTINGS),
  };
}

/**
 * Hook to restrict component rendering based on permissions
 * 
 * @example
 * ```tsx
 * function AdminPanel() {
 *   useRequirePermission(Permission.VIEW_ANALYTICS);
 *   // Component only renders if permission exists
 *   return <AnalyticsDashboard />;
 * }
 * ```
 */
export function useRequirePermission(permission: Permission): void {
  const { can } = usePermissions();
  
  if (!can(permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Hook to restrict component rendering based on multiple permissions
 */
export function useRequireAnyPermission(permissions: Permission[]): void {
  const { canAny } = usePermissions();
  
  if (!canAny(permissions)) {
    throw new Error(`Permissions denied: ${permissions.join(", ")}`);
  }
}

/**
 * Hook to restrict component rendering based on role
 */
export function useRequireRole(allowedRoles: SystemRole[]): void {
  const { role } = usePermissions();
  
  if (!allowedRoles.includes(role)) {
    throw new Error(`Role not allowed: ${role}`);
  }
}
