/**
 * Access Control System
 *
 * Defines view and edit permissions for UI elements
 * Aligned with backend engines: payrollEngine, incentiveEngine, financeEngine, analyticsEngine, operationsEngine
 *
 * NO HARDCODING: All rules dynamic based on role
 */

import { Role } from "./roleConfig";

// ==================== PERMISSION TYPES ====================

export type Permission = "view" | "edit" | "create" | "delete" | "approve" | "export";

export type EngineType =
  | "payrollEngine"
  | "incentiveEngine"
  | "financeEngine"
  | "analyticsEngine"
  | "operationsEngine"
  | "subscriptionEngine"
  | "inventoryEngine"
  | "hrEngine";

export type DataScope =
  | "OWN"           // Only own data (e.g., washer sees own washes)
  | "TEAM"          // Team-level data (e.g., supervisor sees team)
  | "CLUSTER"       // Cluster-level data
  | "CITY"          // City-level data
  | "ALL";          // All data (admin only)

// ==================== PERMISSION MATRIX ====================

interface AccessRule {
  view: boolean;
  edit: boolean;
  create: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
  scope: DataScope;
}

// Default deny-all rule
const DENY_ALL: AccessRule = {
  view: false,
  edit: false,
  create: false,
  delete: false,
  approve: false,
  export: false,
  scope: "OWN",
};

// ==================== ENGINE ACCESS RULES ====================

/**
 * Analytics Engine Access
 * Dashboard, reports, metrics
 */
const ANALYTICS_ACCESS: Record<Role, AccessRule> = {
  "Super Admin": {
    view: true,
    edit: false,     // Analytics are derived, not editable
    create: false,
    delete: false,
    approve: false,
    export: true,
    scope: "ALL",
  },
  "Admin": {
    view: true,
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: true,
    scope: "ALL",
  },
  "City Manager": {
    view: true,
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: true,
    scope: "CITY",   // Only their city
  },
  "Cluster Manager": {
    view: true,
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: true,
    scope: "CLUSTER",
  },
  "Sr Operations Manager": {
    view: true,
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: true,
    scope: "CLUSTER",
  },
  "Operations Manager": {
    view: true,
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: false,
    scope: "TEAM",   // Only their team
  },
  "Supervisor": {
    view: true,      // Can view team analytics
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: false,
    scope: "TEAM",
  },
  "Car Washer": {
    view: true,      // Can view OWN performance
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: false,
    scope: "OWN",
  },
  "TSM": { ...DENY_ALL, view: true, export: true, scope: "TEAM" },
  "TSE": { ...DENY_ALL, view: true, scope: "OWN" },
  "CCE": { ...DENY_ALL, view: true, scope: "OWN" },
  "Store Manager": { ...DENY_ALL, view: true, export: true, scope: "CITY" },
  "Procurement Manager": { ...DENY_ALL, view: true, export: true, scope: "CITY" },
  "Accounts": { ...DENY_ALL, view: true, export: true, scope: "ALL" },
  "HR": { ...DENY_ALL, view: true, export: true, scope: "ALL" },
};

/**
 * Operations Engine Access
 * Unit entry, shift data, wash execution
 */
const OPERATIONS_ACCESS: Record<Role, AccessRule> = {
  "Super Admin": {
    view: true,
    edit: true,
    create: true,
    delete: true,
    approve: true,
    export: true,
    scope: "ALL",
  },
  "Admin": {
    view: true,
    edit: true,
    create: true,
    delete: true,
    approve: true,
    export: true,
    scope: "ALL",
  },
  "City Manager": {
    view: true,
    edit: false,     // Read-only for strategic oversight
    create: false,
    delete: false,
    approve: true,
    export: true,
    scope: "CITY",
  },
  "Cluster Manager": {
    view: true,
    edit: false,
    create: false,
    delete: false,
    approve: true,
    export: true,
    scope: "CLUSTER",
  },
  "Sr Operations Manager": {
    view: true,
    edit: true,
    create: true,
    delete: false,
    approve: true,
    export: true,
    scope: "CLUSTER",
  },
  "Operations Manager": {
    view: true,
    edit: true,
    create: true,
    delete: false,
    approve: true,
    export: true,
    scope: "TEAM",
  },
  "Supervisor": {
    view: true,
    edit: true,      // Can edit team washes
    create: true,    // Can create wash entries
    delete: false,
    approve: false,
    export: false,
    scope: "TEAM",
  },
  "Car Washer": {
    view: true,      // Can view own washes
    edit: true,      // Can edit own incomplete washes
    create: true,    // Can create wash entries
    delete: false,
    approve: false,
    export: false,
    scope: "OWN",
  },
  "TSM": { ...DENY_ALL },
  "TSE": { ...DENY_ALL },
  "CCE": { ...DENY_ALL, view: true, scope: "CITY" }, // Can view to handle complaints
  "Store Manager": { ...DENY_ALL, view: true, scope: "CITY" },
  "Procurement Manager": { ...DENY_ALL },
  "Accounts": { ...DENY_ALL, view: true, scope: "ALL" },
  "HR": { ...DENY_ALL, view: true, scope: "ALL" },
};

/**
 * Finance Engine Access
 * Revenue, expenses, refunds, transactions
 */
const FINANCE_ACCESS: Record<Role, AccessRule> = {
  "Super Admin": {
    view: true,
    edit: true,
    create: true,
    delete: true,
    approve: true,
    export: true,
    scope: "ALL",
  },
  "Admin": {
    view: true,
    edit: true,
    create: true,
    delete: true,
    approve: true,
    export: true,
    scope: "ALL",
  },
  "City Manager": {
    view: true,      // Can view city P&L
    edit: false,
    create: false,
    delete: false,
    approve: true,   // Can approve city expenses
    export: true,
    scope: "CITY",
  },
  "Cluster Manager": {
    view: false,     // No financial access
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: false,
    scope: "CLUSTER",
  },
  "Sr Operations Manager": {
    view: false,
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: false,
    scope: "CLUSTER",
  },
  "Operations Manager": {
    view: false,
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: false,
    scope: "TEAM",
  },
  "Supervisor": {
    view: false,
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: false,
    scope: "TEAM",
  },
  "Car Washer": {
    view: false,     // No financial access
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: false,
    scope: "OWN",
  },
  "TSM": { ...DENY_ALL },
  "TSE": { ...DENY_ALL },
  "CCE": { ...DENY_ALL },
  "Store Manager": { ...DENY_ALL, view: true, create: true, scope: "CITY" }, // Can create expense entries
  "Procurement Manager": { ...DENY_ALL, view: true, create: true, scope: "CITY" },
  "Accounts": {
    view: true,
    edit: true,
    create: true,
    delete: false,
    approve: true,
    export: true,
    scope: "ALL",
  },
  "HR": {
    view: true,      // Can view for payroll
    edit: false,
    create: true,    // Can create salary transactions
    delete: false,
    approve: false,
    export: true,
    scope: "ALL",
  },
};

/**
 * Payroll Engine Access
 * Salary structures, payroll processing
 */
const PAYROLL_ACCESS: Record<Role, AccessRule> = {
  "Super Admin": {
    view: true,
    edit: true,
    create: true,
    delete: true,
    approve: true,
    export: true,
    scope: "ALL",
  },
  "Admin": {
    view: true,
    edit: true,
    create: true,
    delete: true,
    approve: true,
    export: true,
    scope: "ALL",
  },
  "City Manager": {
    view: true,      // Can view city payroll
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: false,
    scope: "CITY",
  },
  "Cluster Manager": { ...DENY_ALL },
  "Sr Operations Manager": { ...DENY_ALL },
  "Operations Manager": { ...DENY_ALL },
  "Supervisor": { ...DENY_ALL },
  "Car Washer": {
    view: true,      // Can view OWN salary slip
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: false,
    scope: "OWN",
  },
  "TSM": { ...DENY_ALL, view: true, scope: "OWN" },
  "TSE": { ...DENY_ALL, view: true, scope: "OWN" },
  "CCE": { ...DENY_ALL, view: true, scope: "OWN" },
  "Store Manager": { ...DENY_ALL, view: true, scope: "OWN" },
  "Procurement Manager": { ...DENY_ALL, view: true, scope: "OWN" },
  "Accounts": {
    view: true,
    edit: false,
    create: false,
    delete: false,
    approve: true,   // Can approve payroll
    export: true,
    scope: "ALL",
  },
  "HR": {
    view: true,
    edit: true,
    create: true,
    delete: false,
    approve: true,
    export: true,
    scope: "ALL",
  },
};

/**
 * Incentive Engine Access
 * Incentive configuration and processing
 */
const INCENTIVE_ACCESS: Record<Role, AccessRule> = {
  "Super Admin": {
    view: true,
    edit: true,
    create: true,
    delete: true,
    approve: true,
    export: true,
    scope: "ALL",
  },
  "Admin": {
    view: true,
    edit: true,
    create: true,
    delete: true,
    approve: true,
    export: true,
    scope: "ALL",
  },
  "City Manager": {
    view: true,
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: true,
    scope: "CITY",
  },
  "Cluster Manager": { ...DENY_ALL, view: true, scope: "CLUSTER" },
  "Sr Operations Manager": { ...DENY_ALL, view: true, scope: "CLUSTER" },
  "Operations Manager": { ...DENY_ALL, view: true, scope: "TEAM" },
  "Supervisor": { ...DENY_ALL, view: true, scope: "TEAM" },
  "Car Washer": {
    view: true,      // Can view OWN incentive breakdown
    edit: false,
    create: false,
    delete: false,
    approve: false,
    export: false,
    scope: "OWN",
  },
  "TSM": { ...DENY_ALL, view: true, scope: "OWN" },
  "TSE": { ...DENY_ALL, view: true, scope: "OWN" },
  "CCE": { ...DENY_ALL, view: true, scope: "OWN" },
  "Store Manager": { ...DENY_ALL, view: true, scope: "OWN" },
  "Procurement Manager": { ...DENY_ALL, view: true, scope: "OWN" },
  "Accounts": { ...DENY_ALL, view: true, export: true, scope: "ALL" },
  "HR": {
    view: true,
    edit: true,
    create: true,
    delete: false,
    approve: true,
    export: true,
    scope: "ALL",
  },
};

// ==================== ACCESS CONTROL MAP ====================

const ENGINE_ACCESS_MAP: Record<EngineType, Record<Role, AccessRule>> = {
  analyticsEngine: ANALYTICS_ACCESS,
  operationsEngine: OPERATIONS_ACCESS,
  financeEngine: FINANCE_ACCESS,
  payrollEngine: PAYROLL_ACCESS,
  incentiveEngine: INCENTIVE_ACCESS,
  subscriptionEngine: ANALYTICS_ACCESS,  // Same as analytics
  inventoryEngine: OPERATIONS_ACCESS,    // Same as operations
  hrEngine: PAYROLL_ACCESS,              // Same as payroll
};

// ==================== PUBLIC API ====================

/**
 * Check if role has permission for engine
 */
export function hasEnginePermission(
  role: Role,
  engine: EngineType,
  permission: Permission
): boolean {
  const accessRules = ENGINE_ACCESS_MAP[engine];
  if (!accessRules) return false;

  const rule = accessRules[role];
  if (!rule) return false;

  switch (permission) {
    case "view":
      return rule.view;
    case "edit":
      return rule.edit;
    case "create":
      return rule.create;
    case "delete":
      return rule.delete;
    case "approve":
      return rule.approve;
    case "export":
      return rule.export;
    default:
      return false;
  }
}

/**
 * Get data scope for role and engine
 */
export function getEngineDataScope(role: Role, engine: EngineType): DataScope {
  const accessRules = ENGINE_ACCESS_MAP[engine];
  if (!accessRules) return "OWN";

  const rule = accessRules[role];
  return rule?.scope || "OWN";
}

/**
 * Get all permissions for role and engine
 */
export function getEnginePermissions(role: Role, engine: EngineType): AccessRule {
  const accessRules = ENGINE_ACCESS_MAP[engine];
  if (!accessRules) return DENY_ALL;

  return accessRules[role] || DENY_ALL;
}

/**
 * Check if role can view engine data
 */
export function canViewEngine(role: Role, engine: EngineType): boolean {
  return hasEnginePermission(role, engine, "view");
}

/**
 * Check if role can edit engine data
 */
export function canEditEngine(role: Role, engine: EngineType): boolean {
  return hasEnginePermission(role, engine, "edit");
}

/**
 * Check if role can create engine data
 */
export function canCreateEngine(role: Role, engine: EngineType): boolean {
  return hasEnginePermission(role, engine, "create");
}

/**
 * Check if role can delete engine data
 */
export function canDeleteEngine(role: Role, engine: EngineType): boolean {
  return hasEnginePermission(role, engine, "delete");
}

/**
 * Check if role can approve engine data
 */
export function canApproveEngine(role: Role, engine: EngineType): boolean {
  return hasEnginePermission(role, engine, "approve");
}

/**
 * Check if role can export engine data
 */
export function canExportEngine(role: Role, engine: EngineType): boolean {
  return hasEnginePermission(role, engine, "export");
}

// ==================== SIMPLIFIED ROLE GROUPS ====================

/**
 * Map common role aliases to actual roles
 */
export function normalizeRole(role: string): Role {
  const roleMap: Record<string, Role> = {
    "admin": "Admin",
    "manager": "Operations Manager",
    "washer": "Car Washer",
    "supervisor": "Supervisor",
    "citymanager": "City Manager",
    "clustermanager": "Cluster Manager",
  };

  const normalized = roleMap[role.toLowerCase().replace(/\s+/g, "")];
  return normalized || (role as Role);
}

/**
 * Check if role is in admin group
 */
export function isAdmin(role: Role): boolean {
  return role === "Super Admin" || role === "Admin";
}

/**
 * Check if role is in manager group
 */
export function isManager(role: Role): boolean {
  return role === "City Manager"
    || role === "Cluster Manager"
    || role === "Sr Operations Manager"
    || role === "Operations Manager";
}

/**
 * Check if role is in field worker group
 */
export function isFieldWorker(role: Role): boolean {
  return role === "Car Washer" || role === "Supervisor";
}
