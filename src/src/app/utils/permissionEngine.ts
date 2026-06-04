/**
 * Permission Engine (MC-11)
 *
 * Dynamic permission checking with 4-tier priority:
 * 1. Employee-level custom permissions (highest)
 * 1.5. Role-level override (from Super Admin role editor)
 * 2. City + Role permissions
 * 3. Fallback to deny
 *
 * USAGE:
 * ```typescript
 * if (hasPermission(employee, "finance", "edit")) {
 *   // Show edit button
 * }
 * ```
 */

import type { Role } from "../lib/roleConfig";
import type { Module, Action, City, PermissionMatrix } from "../types/permissions";
import { permissionMatrix, getDefaultCity } from "../config/permissionMatrix";
import { rolePermissionService } from "../services/rolePermissionService";

/**
 * Employee interface (minimal for permission checking)
 */
interface PermissionCheckEmployee {
  role: Role;
  cityId?: string;
  customPermissions?: PermissionMatrix;
}

/**
 * Check if employee has permission for module + action
 *
 * @param employee - Employee with role, cityId, and optional custom permissions
 * @param module - Module to check access for
 * @param action - Action to check (view, create, edit, delete, approve, export, audit)
 * @returns true if employee has permission, false otherwise
 */
export function hasPermission(
  employee: PermissionCheckEmployee,
  module: Module,
  action: Action
): boolean {
  // 🔥 PRIORITY 1: Employee custom permissions override
  if (employee.customPermissions?.[module]?.includes(action)) {
    return true;
  }

  // 🔥 PRIORITY 1.5: Role-level override (from Super Admin role editor)
  const city = (employee.cityId as City) || getDefaultCity();
  const roleOverride = rolePermissionService.getRoleOverride(employee.role, city);
  if (roleOverride?.permissions?.[module]?.includes(action)) return true;
  if (roleOverride?.permissions?.[module] && !roleOverride.permissions[module]?.includes(action)) return false;

  // 🔥 PRIORITY 2: City + Role permissions
  const rolePermissions = permissionMatrix[city]?.[employee.role];

  if (!rolePermissions) {
    // Unknown role — show dashboard only so nav never goes completely blank
    if (module === "dashboard") return action === "view";
    return false;
  }

  return rolePermissions[module]?.includes(action) ?? false;
}

/**
 * Check if employee can view module
 * Convenience function for most common permission check
 */
export function canViewModule(employee: PermissionCheckEmployee, module: Module): boolean {
  return hasPermission(employee, module, "view");
}

/**
 * Check if employee can create in module
 */
export function canCreate(employee: PermissionCheckEmployee, module: Module): boolean {
  return hasPermission(employee, module, "create");
}

/**
 * Check if employee can edit in module
 */
export function canEdit(employee: PermissionCheckEmployee, module: Module): boolean {
  return hasPermission(employee, module, "edit");
}

/**
 * Check if employee can delete in module
 */
export function canDelete(employee: PermissionCheckEmployee, module: Module): boolean {
  return hasPermission(employee, module, "delete");
}

/**
 * Check if employee can approve in module
 */
export function canApprove(employee: PermissionCheckEmployee, module: Module): boolean {
  return hasPermission(employee, module, "approve");
}

/**
 * Check if employee can export from module
 */
export function canExport(employee: PermissionCheckEmployee, module: Module): boolean {
  return hasPermission(employee, module, "export");
}

/**
 * Check if employee can view audit trail
 */
export function canAudit(employee: PermissionCheckEmployee, module: Module): boolean {
  return hasPermission(employee, module, "audit");
}

/**
 * Get all permissions for employee in a module
 * Useful for showing which buttons to display
 */
export function getModulePermissions(
  employee: PermissionCheckEmployee,
  module: Module
): Action[] {
  const allActions: Action[] = ["view", "create", "edit", "delete", "approve", "export", "audit"];

  return allActions.filter((action) => hasPermission(employee, module, action));
}

/**
 * Get all accessible modules for employee
 * Useful for building navigation menus
 */
export function getAccessibleModules(employee: PermissionCheckEmployee): Module[] {
  const allModules: Module[] = [
    "dashboard",
    "users",
    "leads",
    "customers",
    "car-washer",
    "supervisor",
    "operations",
    "complaints",
    "inventory",
    "store",
    "procurement",
    "cloth-tracking",
    "advance",
    "finance",
    "hr",
    "leave",
    "approvals",
    "audit-trail",
    "performance",
    "analytics",
    "payroll",
    "reports",
    "accounts",
    "store-manager",
  ];

  return allModules.filter((module) => canViewModule(employee, module));
}

/**
 * Check if employee has ANY permission in module
 * Returns true if employee has at least one action permission
 */
export function hasAnyPermission(employee: PermissionCheckEmployee, module: Module): boolean {
  return getModulePermissions(employee, module).length > 0;
}

/**
 * Get permission summary for employee
 * Useful for debugging or admin panels
 */
export function getPermissionSummary(employee: PermissionCheckEmployee): {
  role: Role;
  city: City;
  accessibleModules: Module[];
  hasCustomPermissions: boolean;
  totalModules: number;
} {
  const city = (employee.cityId as City) || getDefaultCity();
  const accessibleModules = getAccessibleModules(employee);

  return {
    role: employee.role,
    city,
    accessibleModules,
    hasCustomPermissions: !!employee.customPermissions,
    totalModules: accessibleModules.length,
  };
}
