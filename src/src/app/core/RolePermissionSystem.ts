/**
 * Centralized Role & Permission System
 * 
 * Single source of truth for all roles, permissions, and access control.
 * Eliminates role duplication and inconsistent permission checks.
 * 
 * @module RolePermissionSystem
 */

// ==================== ROLE DEFINITIONS ====================

/**
 * All system roles (centralized enum)
 */
export enum SystemRole {
  SUPER_ADMIN = "Super Admin",
  ADMIN = "Admin",
  CITY_MANAGER = "City Manager",
  SR_OPERATIONS_MANAGER = "Sr Operations Manager",
  OPERATIONS_MANAGER = "Operations Manager",
  SUPERVISOR = "Supervisor",
  CAR_WASHER = "Car Washer",
  TSM = "TSM",
  TSE = "TSE",
  CCE = "CCE",
  STORE_MANAGER = "Store Manager",
  PROCUREMENT_MANAGER = "Procurement Manager",
  ACCOUNTS = "Accounts",
  HR = "HR",
}

/**
 * Permission categories
 */
export enum Permission {
  // User Management
  CREATE_USER = "create_user",
  EDIT_USER = "edit_user",
  DELETE_USER = "delete_user",
  VIEW_USER = "view_user",

  // Leave Management
  APPLY_LEAVE = "apply_leave",
  APPROVE_LEAVE_L1 = "approve_leave_l1",
  APPROVE_LEAVE_L2 = "approve_leave_l2",
  VIEW_TEAM_LEAVES = "view_team_leaves",
  VIEW_OWN_LEAVES = "view_own_leaves",

  // Financial
  VIEW_FINANCIALS = "view_financials",
  APPROVE_EXPENSE = "approve_expense",
  CREATE_INVOICE = "create_invoice",
  VIEW_REPORTS = "view_reports",
  EXPORT_REPORTS = "export_reports",

  // Inventory
  CREATE_REQUISITION = "create_requisition",
  APPROVE_REQUISITION_L1 = "approve_requisition_l1",
  APPROVE_REQUISITION_L2 = "approve_requisition_l2",
  MANAGE_INVENTORY = "manage_inventory",
  VIEW_INVENTORY = "view_inventory",

  // Operations
  ASSIGN_TASKS = "assign_tasks",
  VERIFY_WORK = "verify_work",
  MANAGE_SCHEDULE = "manage_schedule",
  VIEW_OPERATIONS = "view_operations",

  // HR
  MANAGE_ONBOARDING = "manage_onboarding",
  PROCESS_EXIT = "process_exit",
  MANAGE_PAYROLL = "manage_payroll",
  VIEW_HR_DATA = "view_hr_data",

  // CRM
  MANAGE_LEADS = "manage_leads",
  MANAGE_CUSTOMERS = "manage_customers",
  SCHEDULE_DEMO = "schedule_demo",
  VIEW_CRM = "view_crm",

  // Complaints
  CREATE_COMPLAINT = "create_complaint",
  RESOLVE_COMPLAINT = "resolve_complaint",
  VIEW_COMPLAINTS = "view_complaints",

  // Analytics
  VIEW_ANALYTICS = "view_analytics",
  VIEW_AUDIT_TRAIL = "view_audit_trail",
  VIEW_PERFORMANCE = "view_performance",

  // System
  SYSTEM_SETTINGS = "system_settings",
  MANAGE_ROLES = "manage_roles",
}

// ==================== ROLE HIERARCHY ====================

/**
 * Role hierarchy levels (higher number = higher authority)
 */
export const ROLE_HIERARCHY: Record<SystemRole, number> = {
  [SystemRole.SUPER_ADMIN]: 100,
  [SystemRole.ADMIN]: 90,
  [SystemRole.CITY_MANAGER]: 80,
  [SystemRole.SR_OPERATIONS_MANAGER]: 70,
  [SystemRole.OPERATIONS_MANAGER]: 60,
  [SystemRole.SUPERVISOR]: 50,
  [SystemRole.TSM]: 45,
  [SystemRole.TSE]: 40,
  [SystemRole.CCE]: 40,
  [SystemRole.STORE_MANAGER]: 40,
  [SystemRole.PROCUREMENT_MANAGER]: 40,
  [SystemRole.ACCOUNTS]: 40,
  [SystemRole.HR]: 40,
  [SystemRole.CAR_WASHER]: 10,
};

/**
 * Reporting structure
 */
export const REPORTS_TO: Record<SystemRole, SystemRole[]> = {
  [SystemRole.SUPER_ADMIN]: [],
  [SystemRole.ADMIN]: [SystemRole.SUPER_ADMIN],
  [SystemRole.CITY_MANAGER]: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
  [SystemRole.SR_OPERATIONS_MANAGER]: [SystemRole.CITY_MANAGER, SystemRole.ADMIN],
  [SystemRole.OPERATIONS_MANAGER]: [SystemRole.SR_OPERATIONS_MANAGER, SystemRole.CITY_MANAGER],
  [SystemRole.SUPERVISOR]: [SystemRole.OPERATIONS_MANAGER, SystemRole.SR_OPERATIONS_MANAGER],
  [SystemRole.CAR_WASHER]: [SystemRole.SUPERVISOR],
  [SystemRole.TSM]: [SystemRole.CITY_MANAGER],
  [SystemRole.TSE]: [SystemRole.TSM],
  [SystemRole.CCE]: [SystemRole.TSM],
  [SystemRole.STORE_MANAGER]: [SystemRole.OPERATIONS_MANAGER],
  [SystemRole.PROCUREMENT_MANAGER]: [SystemRole.CITY_MANAGER],
  [SystemRole.ACCOUNTS]: [SystemRole.CITY_MANAGER],
  [SystemRole.HR]: [SystemRole.CITY_MANAGER],
};

// ==================== PERMISSION MATRIX ====================

/**
 * Role-Permission mapping
 */
export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  [SystemRole.SUPER_ADMIN]: Object.values(Permission), // All permissions

  [SystemRole.ADMIN]: [
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.VIEW_USER,
    Permission.VIEW_FINANCIALS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_AUDIT_TRAIL,
    Permission.VIEW_PERFORMANCE,
    Permission.APPROVE_LEAVE_L2,
    Permission.VIEW_TEAM_LEAVES,
    Permission.APPROVE_REQUISITION_L2,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_OPERATIONS,
    Permission.MANAGE_SCHEDULE,
    Permission.VIEW_CRM,
    Permission.VIEW_COMPLAINTS,
    Permission.SYSTEM_SETTINGS,
  ],

  [SystemRole.CITY_MANAGER]: [
    Permission.VIEW_USER,
    Permission.VIEW_FINANCIALS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_PERFORMANCE,
    Permission.APPROVE_LEAVE_L2,
    Permission.VIEW_TEAM_LEAVES,
    Permission.APPROVE_REQUISITION_L2,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_OPERATIONS,
    Permission.MANAGE_SCHEDULE,
    Permission.VIEW_CRM,
    Permission.VIEW_COMPLAINTS,
  ],

  [SystemRole.SR_OPERATIONS_MANAGER]: [
    Permission.VIEW_USER,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_PERFORMANCE,
    Permission.APPROVE_LEAVE_L1,
    Permission.VIEW_TEAM_LEAVES,
    Permission.APPROVE_REQUISITION_L1,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_OPERATIONS,
    Permission.MANAGE_SCHEDULE,
    Permission.ASSIGN_TASKS,
    Permission.VERIFY_WORK,
    Permission.VIEW_CRM,
    Permission.VIEW_COMPLAINTS,
    Permission.RESOLVE_COMPLAINT,
  ],

  [SystemRole.OPERATIONS_MANAGER]: [
    Permission.VIEW_USER,
    Permission.VIEW_REPORTS,
    Permission.VIEW_PERFORMANCE,
    Permission.APPROVE_LEAVE_L1,
    Permission.VIEW_TEAM_LEAVES,
    Permission.APPROVE_REQUISITION_L1,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_OPERATIONS,
    Permission.MANAGE_SCHEDULE,
    Permission.ASSIGN_TASKS,
    Permission.VERIFY_WORK,
    Permission.VIEW_CRM,
    Permission.VIEW_COMPLAINTS,
    Permission.RESOLVE_COMPLAINT,
  ],

  [SystemRole.SUPERVISOR]: [
    Permission.VIEW_USER,
    Permission.APPLY_LEAVE,
    Permission.APPROVE_LEAVE_L1,
    Permission.VIEW_TEAM_LEAVES,
    Permission.VIEW_OWN_LEAVES,
    Permission.CREATE_REQUISITION,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_OPERATIONS,
    Permission.ASSIGN_TASKS,
    Permission.VERIFY_WORK,
    Permission.VIEW_CRM,
    Permission.VIEW_COMPLAINTS,
    Permission.CREATE_COMPLAINT,
  ],

  [SystemRole.CAR_WASHER]: [
    Permission.APPLY_LEAVE,
    Permission.VIEW_OWN_LEAVES,
    Permission.VIEW_OPERATIONS,
    Permission.CREATE_COMPLAINT,
  ],

  [SystemRole.TSM]: [
    Permission.VIEW_USER,
    Permission.MANAGE_LEADS,
    Permission.MANAGE_CUSTOMERS,
    Permission.SCHEDULE_DEMO,
    Permission.VIEW_CRM,
    Permission.VIEW_REPORTS,
    Permission.VIEW_PERFORMANCE,
    Permission.VIEW_COMPLAINTS,
    Permission.RESOLVE_COMPLAINT,
  ],

  [SystemRole.TSE]: [
    Permission.MANAGE_LEADS,
    Permission.MANAGE_CUSTOMERS,
    Permission.SCHEDULE_DEMO,
    Permission.VIEW_CRM,
    Permission.CREATE_COMPLAINT,
    Permission.VIEW_COMPLAINTS,
  ],

  [SystemRole.CCE]: [
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_COMPLAINTS,
    Permission.CREATE_COMPLAINT,
    Permission.RESOLVE_COMPLAINT,
  ],

  [SystemRole.STORE_MANAGER]: [
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_INVENTORY,
    Permission.CREATE_REQUISITION,
    Permission.APPROVE_REQUISITION_L1,
    Permission.VIEW_REPORTS,
  ],

  [SystemRole.PROCUREMENT_MANAGER]: [
    Permission.VIEW_INVENTORY,
    Permission.APPROVE_REQUISITION_L2,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
  ],

  [SystemRole.ACCOUNTS]: [
    Permission.VIEW_FINANCIALS,
    Permission.APPROVE_EXPENSE,
    Permission.CREATE_INVOICE,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.APPROVE_REQUISITION_L2,
  ],

  [SystemRole.HR]: [
    Permission.MANAGE_ONBOARDING,
    Permission.PROCESS_EXIT,
    Permission.MANAGE_PAYROLL,
    Permission.VIEW_HR_DATA,
    Permission.APPROVE_LEAVE_L2,
    Permission.VIEW_TEAM_LEAVES,
    Permission.VIEW_USER,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.VIEW_REPORTS,
  ],
};

// ==================== PERMISSION UTILITIES ====================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: SystemRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Check if a role has any of the given permissions
 */
export function hasAnyPermission(role: SystemRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the given permissions
 */
export function hasAllPermissions(role: SystemRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: SystemRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role A is senior to role B
 */
export function isSeniorRole(roleA: SystemRole, roleB: SystemRole): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}

/**
 * Check if role A reports to role B (directly or indirectly)
 */
export function reportsTo(roleA: SystemRole, roleB: SystemRole): boolean {
  const directReports = REPORTS_TO[roleA];
  if (!directReports) return false;

  // Direct reporting
  if (directReports.includes(roleB)) return true;

  // Indirect reporting (recursive check)
  return directReports.some((intermediateRole) => reportsTo(intermediateRole, roleB));
}

/**
 * Get all subordinate roles for a given role
 */
export function getSubordinateRoles(role: SystemRole): SystemRole[] {
  return Object.entries(REPORTS_TO)
    .filter(([_, managers]) => managers.includes(role))
    .map(([subordinateRole]) => subordinateRole as SystemRole);
}

/**
 * Check if a user can approve a specific workflow step based on their role
 */
export function canApproveWorkflowLevel(
  role: SystemRole,
  level: "L1" | "L2"
): boolean {
  const permission =
    level === "L1"
      ? [
          Permission.APPROVE_LEAVE_L1,
          Permission.APPROVE_REQUISITION_L1,
          Permission.APPROVE_EXPENSE,
        ]
      : [Permission.APPROVE_LEAVE_L2, Permission.APPROVE_REQUISITION_L2];

  return hasAnyPermission(role, permission);
}

// ==================== MODULE ACCESS CONTROL ====================

/**
 * Module access configuration
 */
export const MODULE_ACCESS: Record<
  string,
  { requiredPermissions: Permission[]; allowedRoles: SystemRole[] }
> = {
  dashboard: {
    requiredPermissions: [],
    allowedRoles: Object.values(SystemRole),
  },
  users: {
    requiredPermissions: [Permission.VIEW_USER],
    allowedRoles: [
      SystemRole.SUPER_ADMIN,
      SystemRole.ADMIN,
      SystemRole.CITY_MANAGER,
      SystemRole.HR,
    ],
  },
  leads: {
    requiredPermissions: [Permission.VIEW_CRM],
    allowedRoles: [
      SystemRole.SUPER_ADMIN,
      SystemRole.ADMIN,
      SystemRole.TSM,
      SystemRole.TSE,
    ],
  },
  customers: {
    requiredPermissions: [Permission.VIEW_CRM],
    allowedRoles: [
      SystemRole.SUPER_ADMIN,
      SystemRole.ADMIN,
      SystemRole.TSM,
      SystemRole.TSE,
      SystemRole.CCE,
    ],
  },
  "car-washer": {
    requiredPermissions: [Permission.VIEW_OPERATIONS],
    allowedRoles: [
      SystemRole.SUPER_ADMIN,
      SystemRole.ADMIN,
      SystemRole.OPERATIONS_MANAGER,
      SystemRole.SR_OPERATIONS_MANAGER,
      SystemRole.SUPERVISOR,
      SystemRole.CAR_WASHER,
    ],
  },
  finance: {
    requiredPermissions: [Permission.VIEW_FINANCIALS],
    allowedRoles: [
      SystemRole.SUPER_ADMIN,
      SystemRole.ADMIN,
      SystemRole.CITY_MANAGER,
      SystemRole.ACCOUNTS,
    ],
  },
  hr: {
    requiredPermissions: [Permission.VIEW_HR_DATA],
    allowedRoles: [SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.HR],
  },
  inventory: {
    requiredPermissions: [Permission.VIEW_INVENTORY],
    allowedRoles: [
      SystemRole.SUPER_ADMIN,
      SystemRole.ADMIN,
      SystemRole.STORE_MANAGER,
      SystemRole.PROCUREMENT_MANAGER,
    ],
  },
  analytics: {
    requiredPermissions: [Permission.VIEW_ANALYTICS],
    allowedRoles: [
      SystemRole.SUPER_ADMIN,
      SystemRole.ADMIN,
      SystemRole.CITY_MANAGER,
      SystemRole.ACCOUNTS,
    ],
  },
};

/**
 * Check if a role can access a specific module
 */
export function canAccessModule(role: SystemRole, moduleName: string): boolean {
  const moduleConfig = MODULE_ACCESS[moduleName];
  if (!moduleConfig) return false;

  // Check if role is allowed
  if (!moduleConfig.allowedRoles.includes(role)) return false;

  // Check if role has required permissions
  if (moduleConfig.requiredPermissions.length === 0) return true;
  return hasAnyPermission(role, moduleConfig.requiredPermissions);
}

// ==================== FIELD-LEVEL PERMISSIONS ====================

/**
 * Field-level access control
 */
export interface FieldPermission {
  read: SystemRole[];
  write: SystemRole[];
}

/**
 * Example: Financial data field permissions
 */
export const FINANCIAL_FIELD_PERMISSIONS: Record<string, FieldPermission> = {
  revenue: {
    read: [SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.ACCOUNTS],
    write: [SystemRole.SUPER_ADMIN, SystemRole.ACCOUNTS],
  },
  salary: {
    read: [SystemRole.SUPER_ADMIN, SystemRole.HR],
    write: [SystemRole.SUPER_ADMIN, SystemRole.HR],
  },
  cost: {
    read: [
      SystemRole.SUPER_ADMIN,
      SystemRole.ADMIN,
      SystemRole.ACCOUNTS,
      SystemRole.OPERATIONS_MANAGER,
    ],
    write: [SystemRole.SUPER_ADMIN, SystemRole.ACCOUNTS],
  },
};

/**
 * Check if role can read a specific field
 */
export function canReadField(
  role: SystemRole,
  fieldName: string,
  permissions: Record<string, FieldPermission>
): boolean {
  const fieldPermission = permissions[fieldName];
  return fieldPermission ? fieldPermission.read.includes(role) : false;
}

/**
 * Check if role can write to a specific field
 */
export function canWriteField(
  role: SystemRole,
  fieldName: string,
  permissions: Record<string, FieldPermission>
): boolean {
  const fieldPermission = permissions[fieldName];
  return fieldPermission ? fieldPermission.write.includes(role) : false;
}
