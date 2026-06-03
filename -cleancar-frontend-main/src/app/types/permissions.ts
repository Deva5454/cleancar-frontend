/**
 * Permission System Types (MC-11)
 *
 * Defines granular permissions for role-based access control
 * with city-level variations and employee-level overrides
 */

// All available modules in the system
// IMPORTANT: Each module key should be unique to prevent permission leakage
export type Module =
  | "dashboard"
  | "analytics"          // Analytics section (executive reports, insights)
  | "crm"                // CRM section (leads, customers, sales)
  | "inventory"          // Inventory section (stock, store, procurement)
  | "admin"              // Admin section (settings, audit trail, city management)
  | "users"
  | "leads"
  | "customers"
  | "car-washer"
  | "supervisor"
  | "operations"
  | "complaints"
  | "jobs"               // Job management
  | "store"
  | "procurement"
  | "cloth-tracking"
  | "advance"
  | "finance"
  | "hr"
  | "leave"
  | "approvals"
  | "audit-trail"
  | "performance"
  | "payroll"
  | "payroll-self-service"  // Employee payslip access (scoped, non-admin)
  | "reports"
  | "accounts"
  | "store-manager"
  | "travel"
  | "field-tracking";

// Available actions per module
export type Action =
  | "view"       // Can view the module
  | "create"     // Can create new records
  | "edit"       // Can modify existing records
  | "delete"     // Can delete records
  | "approve"    // Can approve workflows
  | "export"     // Can export data
  | "audit";     // Can view audit trails

// Permission matrix for a role (maps modules to allowed actions)
export type PermissionMatrix = {
  [module in Module]?: Action[];
};

// City identifier for permission scoping
export type City = "CITY-SURAT" | "CITY-MUMBAI";

// Permission override for individual employees
export interface EmployeePermissionOverride {
  employeeId: string;
  customPermissions: PermissionMatrix;
  grantedBy: string;
  grantedAt: string;
  reason?: string;
  expiresAt?: string; // Optional expiration for temporary permissions
}
