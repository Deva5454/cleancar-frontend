// Role-based access control configuration with enhanced hierarchy
// IMPORTANT: Data visibility rules defined in dataVisibilityRules.ts
// This file defines MODULE access, dataVisibilityRules.ts defines DATA visibility

export type Role =
  | "Super Admin"
  | "Admin"
  | "City Manager"
  | "Cluster Manager"
  | "Sr Operations Manager"
  | "Operations Manager"
  | "Manager"
  | "Supervisor"
  | "Car Washer"
  | "TSM"
  | "TSE"
  | "CCE"
  | "Store Manager"
  | "Procurement Manager"
  | "Accounts"
  | "HR"
  | "Marketing Agency"
  | "Sales Head"
  | "Sales Manager";

export interface WorkingHours {
  start: string;
  end: string;
}

export interface RoleConfig {
  name: Role;
  modules: string[];
  dashboardType: string;
  canApprove: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canSeeFinancials: boolean;
  canSeeAuditTrail: boolean;
  workingHours: WorkingHours;
  reportsTo?: Role[];
  targets?: {
    daily?: Record<string, number>;
    monthly?: Record<string, number>;
  };
  // Enhanced leave and approval permissions
  canApproveLeaves?: boolean;
  canSeeTeamLeaves?: boolean;
  canManageOnboarding?: boolean;
  canProcessExitSettlement?: boolean;
  canRaiseMaterialRequisition?: boolean;
  canApproveRequisitions?: boolean;

  // NEW: Data visibility configuration (references dataVisibilityRules.ts)
  dataGranularity?: "INDIVIDUAL" | "TEAM" | "CLUSTER" | "CITY";
  showRawData?: boolean;           // Show individual-level raw data by default
  showAggregatedView?: boolean;    // Show aggregated/summary view by default
}

export const roleConfigurations: Record<Role, RoleConfig> = {
  "Super Admin": {
    name: "Super Admin",
    modules: [
      "dashboard",
      "analytics",          // Analytics section
      "crm",                // CRM section
      "inventory",          // Inventory section
      "admin",              // Admin section
      "jobs",               // Jobs
      "users",
      "leads",
      "customers",
      "car-washer",
      "supervisor",
      "operations",
      "complaints",
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
      "payroll",
      "payroll-self-service",  // Employee payslip access
      "reports",
      "accounts"
    ],
    dashboardType: "executive",
    canApprove: true,
    canCreate: true,
    canDelete: true,
    canExport: true,
    canSeeFinancials: true,
    canSeeAuditTrail: true,
    workingHours: { start: "10:00", end: "19:00" },
    targets: {},
    canApproveLeaves: true,
    canSeeTeamLeaves: true,
    canManageOnboarding: true,
    canProcessExitSettlement: true,
    canRaiseMaterialRequisition: true,
    canApproveRequisitions: true,
  },
  "Admin": {
    name: "Admin",
    modules: [
      "dashboard",
      "analytics",          // Analytics section
      "crm",                // CRM section
      "inventory",          // Inventory section
      "admin",              // Admin section
      "jobs",               // Jobs
      "users",
      "leads",
      "customers",
      "car-washer",
      "supervisor",
      "operations",
      "complaints",
      "store",
      "procurement",
      "cloth-tracking",
      "finance",
      "hr",
      "leave",
      "approvals",
      "audit-trail",
      "performance",
      "payroll",
      "payroll-self-service",  // Employee payslip access
      "reports",
      "accounts"
    ],
    dashboardType: "executive",
    canApprove: true,
    canCreate: true,
    canDelete: true,
    canExport: true,
    canSeeFinancials: true,
    canSeeAuditTrail: true,
    workingHours: { start: "10:00", end: "19:00" },
    targets: {},
    canApproveLeaves: true,
    canSeeTeamLeaves: true,
    canManageOnboarding: true,
    canProcessExitSettlement: true,
    canRaiseMaterialRequisition: true,
    canApproveRequisitions: true,
  },
  "City Manager": {
    name: "City Manager",
    modules: [
      "dashboard",
      "analytics",          // Analytics section
      "crm",                // CRM section
      "users",
      "leads",
      "customers",
      "operations",
      "complaints",
      "finance",
      "payroll",            // Payroll visibility for P&L control
      "leave",
      "payroll-self-service",  // Employee payslip access
      "performance",
      "reports"
    ],
    dashboardType: "city",
    canApprove: true,
    canCreate: true,
    canDelete: false,
    canExport: true,
    canSeeFinancials: true,  // ✅ CHANGED: City Manager can see financials (P&L control)
    canSeeAuditTrail: true,  // ✅ CHANGED: City Manager has audit trail access
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["Super Admin", "Admin"],
    targets: {},
    canApproveLeaves: true,
    canSeeTeamLeaves: true,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
    // DATA VISIBILITY: City Manager sees CITY-wide strategic aggregates only
    dataGranularity: "CITY",
    showRawData: false,
    showAggregatedView: true,
  },
  "Cluster Manager": {
    name: "Cluster Manager",
    modules: [
      "dashboard",
      "analytics",          // Analytics section
      "crm",                // CRM section
      "users",
      "leads",
      "customers",
      "operations",
      "complaints",
      "finance",
      "leave",
      "payroll-self-service",  // Employee payslip access
      "performance",
      "reports"
    ],
    dashboardType: "city",
    canApprove: true,
    canCreate: true,
    canDelete: false,
    canExport: true,
    canSeeFinancials: false,
    canSeeAuditTrail: false,
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["Super Admin", "Admin"],
    targets: {},
    canApproveLeaves: true,
    canSeeTeamLeaves: true,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
    // DATA VISIBILITY: Cluster Manager sees CLUSTER-level aggregates, not individual teams
    dataGranularity: "CLUSTER",
    showRawData: false,
    showAggregatedView: true,
  },
  "Sr Operations Manager": {
    name: "Sr Operations Manager",
    modules: [
      "dashboard",
      "jobs",               // Jobs
      "car-washer",
      "supervisor",
      "operations",
      "complaints",
      "leave",
      "payroll-self-service",  // Employee payslip access
      "approvals",
      "performance"
    ],
    dashboardType: "operations",
    canApprove: true,
    canCreate: true,
    canDelete: false,
    canExport: true,
    canSeeFinancials: false,
    canSeeAuditTrail: false,
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["City Manager", "Super Admin", "Admin"],
    targets: {
      monthly: { teamTarget: 100 }
    },
    canApproveLeaves: true,
    canSeeTeamLeaves: true,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
  },
  "Operations Manager": {
    name: "Operations Manager",
    modules: [
      "dashboard",
      "jobs",               // Jobs
      "car-washer",
      "supervisor",
      "operations",
      "complaints",
      "leave",
      "payroll-self-service",  // Employee payslip access
      "approvals",
      "performance"
    ],
    dashboardType: "operations",
    canApprove: true,
    canCreate: true,
    canDelete: false,
    canExport: true,
    canSeeFinancials: false,
    canSeeAuditTrail: false,
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["Sr Operations Manager", "City Manager", "Super Admin", "Admin"],
    targets: {
      monthly: { btlActivities: 5, societyTieups: 3 }
    },
    canApproveLeaves: true,
    canSeeTeamLeaves: true,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
    // DATA VISIBILITY: OM sees TEAM summaries, not individual washer raw data
    dataGranularity: "TEAM",
    showRawData: false,
    showAggregatedView: true,
  },
  "Supervisor": {
    name: "Supervisor",
    modules: [
      "dashboard",
      "jobs",               // Jobs
      "car-washer",
      "supervisor",
      "complaints",
      "cloth-tracking",
      "advance",
      "leave",
      "payroll-self-service",  // Employee payslip access
      "performance"
    ],
    dashboardType: "supervisor",
    canApprove: false,
    canCreate: true,
    canDelete: false,
    canExport: false,
    canSeeFinancials: false,
    canSeeAuditTrail: false,
    workingHours: { start: "04:00", end: "09:00" },
    reportsTo: ["Operations Manager", "Sr Operations Manager", "Super Admin", "Admin"],
    targets: {},
    canApproveLeaves: true, // ADDED: Can approve team member leaves
    canSeeTeamLeaves: true,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: true, // ADDED: Can raise material requisitions
    canApproveRequisitions: false,
    // DATA VISIBILITY: Supervisor sees INDIVIDUAL washer data (operational level)
    dataGranularity: "INDIVIDUAL",
    showRawData: true,
    showAggregatedView: false,
  },
  // ==================== OPERATIONS ROLES ====================
  // Field service delivery and execution

  "Car Washer": {
    name: "Car Washer",
    modules: [
      "dashboard",
      "jobs",               // Jobs
      "car-washer",
      "cloth-tracking",
      "advance",
      "leave",
      "performance"
    ],
    dashboardType: "washer",
    canApprove: false,
    canCreate: true,
    canDelete: false,
    canExport: false,
    canSeeFinancials: false,
    canSeeAuditTrail: false,
    workingHours: { start: "04:00", end: "09:00" },
    reportsTo: ["Supervisor", "Operations Manager"],
    targets: {
      daily: { washes: 15 }
    },
    canApproveLeaves: false,
    canSeeTeamLeaves: false,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: true, // ADDED: Can raise material requisitions
    canApproveRequisitions: false,
  },
  // ==================== SALES ROLES ====================
  // Revenue generation and lead conversion

  "TSM": {
    name: "TSM",
    modules: [
      "dashboard",
      "crm",                // CRM section
      "leads",
      "customers",
      "complaints",
      "leave",
      "performance"
    ],
    dashboardType: "sales",
    canApprove: false,
    canCreate: true,
    canDelete: false,
    canExport: true,
    canSeeFinancials: false,
    canSeeAuditTrail: false,
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["City Manager", "Super Admin", "Admin"],
    targets: {
      daily: { calls: 80 },
      monthly: { conversions: 20, teamConversions: 100 }
    },
    canApproveLeaves: true, // ADDED: Can approve TSE leaves
    canSeeTeamLeaves: true,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
  },
  "TSE": {
    name: "TSE",
    modules: [
      "dashboard",
      "crm",                // CRM section
      "leads",
      "customers",
      "leave",
      "performance"
    ],
    dashboardType: "sales",
    canApprove: false,
    canCreate: true,
    canDelete: false,
    canExport: false,
    canSeeFinancials: false,
    canSeeAuditTrail: false,
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["TSM", "City Manager", "Super Admin", "Admin"],
    targets: {
      daily: { calls: 80 },
      monthly: { conversions: 15 }
    },
    canApproveLeaves: false,
    canSeeTeamLeaves: false,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
  },
  // ==================== CUSTOMER EXPERIENCE ROLE ====================
  // Post-sale support and satisfaction

  "CCE": {
    name: "CCE",
    modules: [
      "dashboard",
      "crm",                // CRM section
      "complaints",
      "customers",
      "leave",
      "performance"
    ],
    dashboardType: "customer-care",
    canApprove: false,
    canCreate: true,
    canDelete: false,
    canExport: false,
    canSeeFinancials: false,
    canSeeAuditTrail: false,
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["City Manager", "Super Admin", "Admin"],
    targets: {
      daily: { resolutions: 5 }
    },
    canApproveLeaves: false,
    canSeeTeamLeaves: false,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
  },
  // ==================== SUPPORT FUNCTIONS ====================
  // Inventory, procurement, finance, HR

  "Store Manager": {
    name: "Store Manager",
    modules: [
      "dashboard",
      "inventory",
      "store",  // ADDED: Store module
      "store-manager",  // ADDED: Store Manager module
      "cloth-tracking",
      "leave",
      "payroll-self-service",  // Employee payslip access
      "approvals",
      "performance"
    ],
    dashboardType: "inventory",
    canApprove: false,
    canCreate: true,
    canDelete: false,
    canExport: true,
    canSeeFinancials: false,
    canSeeAuditTrail: false,
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["City Manager", "Super Admin", "Admin"],
    targets: {},
    canApproveLeaves: false,
    canSeeTeamLeaves: false,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: true,
    canApproveRequisitions: true, // ADDED: Can approve material requisitions
  },
  "Procurement Manager": {
    name: "Procurement Manager",
    modules: [
      "dashboard",
      "procurement",  // ADDED: Procurement module
      "inventory",
      "leave",
      "payroll-self-service",  // Employee payslip access
      "approvals"
    ],
    dashboardType: "procurement",
    canApprove: true,
    canCreate: true,
    canDelete: false,
    canExport: true,
    canSeeFinancials: true,  // Can see procurement costs
    canSeeAuditTrail: false,
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["Store Manager", "Super Admin", "Admin"],
    targets: {},
    canApproveLeaves: false,
    canSeeTeamLeaves: false,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: true,  // Can raise requisitions directly
    canApproveRequisitions: true, // ADDED: Can approve purchase requests
  },
  "Accounts": {
    name: "Accounts",
    modules: [
      "dashboard",
      "finance",
      "accounts",
      "payroll",
      "reports",
      "customers",
      "leave",
      "payroll-self-service",  // Employee payslip access
      "approvals",
      "performance"
    ],
    dashboardType: "finance",
    canApprove: true,
    canCreate: true,
    canDelete: false,
    canExport: true,
    canSeeFinancials: true,
    canSeeAuditTrail: false,
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["Super Admin", "Admin"],
    targets: {},
    canApproveLeaves: false,
    canSeeTeamLeaves: false,
    canManageOnboarding: false,
    canProcessExitSettlement: true, // ADDED: Can process F&F settlement
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
  },
  "HR": {
    name: "HR",
    modules: [
      "dashboard",
      "users",
      "hr",
      "advance",
      "payroll",  // ✅ Full payroll access (processing, structures, history)
      "leave",
      "payroll-self-service",  // Employee payslip access
      "approvals",
      "performance"
      // ❌ REMOVED: "finance" - HR should NOT see Finance/Revenue/Accounting
    ],
    dashboardType: "hr",
    canApprove: true,
    canCreate: true,
    canDelete: false,
    canExport: true,
    canSeeFinancials: true,  // ENABLED: HR can view payroll data
    canSeeAuditTrail: false,
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["Super Admin", "Admin"],
    targets: {},
    canApproveLeaves: true,
    canSeeTeamLeaves: true,
    canManageOnboarding: true,
    canProcessExitSettlement: true,
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
  },
  "Manager": {
    name: "Manager",
    modules: [
      "dashboard",
      "users",
      "leads",
      "customers",
      "operations",
      "complaints",
      "leave",
      "payroll-self-service",  // Employee payslip access
      "approvals",
      "performance",
      "analytics"
    ],
    dashboardType: "operational",
    canApprove: true,
    canCreate: true,
    canDelete: false,
    canExport: true,
    canSeeFinancials: false,
    canSeeAuditTrail: false,
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["Sr Operations Manager", "Super Admin", "Admin"],
    targets: {},
    canApproveLeaves: true,
    canSeeTeamLeaves: true,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
  },
  "Sales Head": {
    name: "Sales Head",
    modules: ["dashboard","crm","leads","customers","complaints","leave","performance","analytics"],
    dashboardType: "sales",
    canApprove: true,
    canCreate: true,
    canDelete: false,
    canExport: true,
    canSeeFinancials: true,
    canSeeAuditTrail: false,
    workingHours: { start: "10:00", end: "19:00" },
    reportsTo: ["City Manager", "Super Admin", "Admin"],
    targets: { daily: { calls: 20 }, monthly: { conversions: 10, teamConversions: 75 } },
    canApproveLeaves: true,
    canSeeTeamLeaves: true,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
  },

  "Sales Manager": {
    name: "Sales Manager",
    modules: ["dashboard","crm","leads","customers","leave","performance"],
    dashboardType: "sales",
    canApprove: false,
    canCreate: true,
    canDelete: false,
    canExport: true,
    canSeeFinancials: false,
    canSeeAuditTrail: false,
    workingHours: { start: "08:00", end: "18:30" },
    reportsTo: ["Sales Head", "City Manager", "Super Admin"],
    targets: { monthly: { locations: 5, leads: 30, conversions: 5 } },
    canApproveLeaves: false,
    canSeeTeamLeaves: false,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
  },

  "Marketing Agency": {
    name: "Marketing Agency",
    modules: [
      "dashboard",
      "crm",           // Lead pipeline view (sanitized)
      "leads",         // Lead source breakdown
      "performance",   // Team performance metrics
      "analytics",     // Funnel analytics
      "reports",       // Exportable reports
    ],
    dashboardType: "marketing",
    canApprove: false,
    canCreate: false,
    canDelete: false,
    canExport: true,    // Can export lead reports as CSV
    canSeeFinancials: false,  // CRITICAL: no financial visibility
    canSeeAuditTrail: false,
    workingHours: { start: "09:00", end: "18:00" },
    reportsTo: ["Super Admin", "Admin"],
    targets: {},
    canApproveLeaves: false,
    canSeeTeamLeaves: false,
    canManageOnboarding: false,
    canProcessExitSettlement: false,
    canRaiseMaterialRequisition: false,
    canApproveRequisitions: false,
    dataGranularity: "CITY",
    showRawData: false,
    showAggregatedView: true,
  },
};

export function getRoleConfig(role: Role): RoleConfig {
  const config = roleConfigurations[role];

  if (!config) {
    console.error(`❌ Invalid role requested: "${role}"`);
    throw new Error(`Invalid role: ${role}. Valid roles: ${Object.keys(roleConfigurations).join(", ")}`);
  }

  return config;
}

export function hasModuleAccess(role: Role, module: string): boolean {
  const config = roleConfigurations[role];
  if (!config) return false;
  return config.modules.includes(module);
}

export function canPerformAction(role: Role, action: "approve" | "create" | "delete" | "export"): boolean {
  const config = roleConfigurations[role];
  if (!config) return false;
  switch (action) {
    case "approve": return config.canApprove;
    case "create": return config.canCreate;
    case "delete": return config.canDelete;
    case "export": return config.canExport;
    default: return false;
  }
}

export function canSeeFinancials(role: Role): boolean {
  const config = roleConfigurations[role];
  return config ? config.canSeeFinancials : false;
}

export function canSeeAuditTrail(role: Role): boolean {
  const config = roleConfigurations[role];
  return config ? config.canSeeAuditTrail : false;
}

export function getReportingChain(role: Role): Role[] {
  const config = roleConfigurations[role];
  return config ? (config.reportsTo || []) : [];
}

export function getRoleTargets(role: Role): { daily?: Record<string, number>; monthly?: Record<string, number> } {
  const config = roleConfigurations[role];
  return config ? (config.targets || {}) : {};
}

// ADDED: New helper functions for enhanced permissions
export function canApproveLeaves(role: Role): boolean {
  const config = roleConfigurations[role];
  return config ? (config.canApproveLeaves || false) : false;
}

export function canSeeTeamLeaves(role: Role): boolean {
  const config = roleConfigurations[role];
  return config ? (config.canSeeTeamLeaves || false) : false;
}

export function canManageOnboarding(role: Role): boolean {
  const config = roleConfigurations[role];
  return config ? (config.canManageOnboarding || false) : false;
}

export function canProcessExitSettlement(role: Role): boolean {
  const config = roleConfigurations[role];
  return config ? (config.canProcessExitSettlement || false) : false;
}

export function canRaiseMaterialRequisition(role: Role): boolean {
  const config = roleConfigurations[role];
  return config ? (config.canRaiseMaterialRequisition || false) : false;
}

export function canApproveRequisitions(role: Role): boolean {
  const config = roleConfigurations[role];
  return config ? (config.canApproveRequisitions || false) : false;
}

// ==================== NEW: DATA VISIBILITY HELPERS ====================

/**
 * Get data granularity level for role
 */
export function getDataGranularity(role: Role): "INDIVIDUAL" | "TEAM" | "CLUSTER" | "CITY" | undefined {
  const config = roleConfigurations[role];
  return config?.dataGranularity;
}

/**
 * Check if role should see raw individual-level data by default
 */
export function shouldShowRawData(role: Role): boolean {
  const config = roleConfigurations[role];
  return config?.showRawData || false;
}

/**
 * Check if role should see aggregated view by default
 */
export function shouldShowAggregatedView(role: Role): boolean {
  const config = roleConfigurations[role];
  return config?.showAggregatedView || false;
}