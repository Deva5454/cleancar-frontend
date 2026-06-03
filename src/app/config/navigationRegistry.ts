/**
 * Central Navigation Registry
 * Single source of truth for role-to-route mapping.
 * Replaces scattered role checks across components.
 *
 * PHASE 1 FIX: Route registry — every role's default landing page,
 * allowed paths, and redirect logic defined in one place.
 */
import type { Role } from "../lib/roleConfig";

export interface RoleRouteConfig {
  defaultRoute: string;        // Where to land after login
  appRoute?: string;           // Role-specific app route (supervisor-app, washer-app etc.)
  label: string;               // Human-readable role label
  modules: string[];           // Permitted module identifiers
  mobileFirst: boolean;        // Whether this role primarily uses mobile UI
}

export const ROLE_ROUTE_REGISTRY: Record<string, RoleRouteConfig> = {
  "Super Admin": {
    defaultRoute: "/",
    label: "Super Admin",
    modules: ["*"], // all modules
    mobileFirst: false,
  },
  "Admin": {
    defaultRoute: "/",
    label: "Admin",
    modules: ["*"],
    mobileFirst: false,
  },
  "City Manager": {
    defaultRoute: "/",
    label: "City Manager",
    modules: ["dashboard", "hr", "finance", "analytics", "crm", "operations", "inventory"],
    mobileFirst: false,
  },
  "Cluster Manager": {
    defaultRoute: "/",
    label: "Cluster Manager",
    modules: ["dashboard", "analytics", "crm", "operations"],
    mobileFirst: false,
  },
  "Sr Operations Manager": {
    defaultRoute: "/",
    label: "Sr. Operations Manager",
    modules: ["dashboard", "operations", "hr", "analytics"],
    mobileFirst: false,
  },
  "Operations Manager": {
    defaultRoute: "/om-app",
    appRoute: "/om-app",
    label: "Operations Manager",
    modules: ["dashboard", "operations", "hr"],
    mobileFirst: true,
  },
  "Supervisor": {
    defaultRoute: "/supervisor-app",
    appRoute: "/supervisor-app",
    label: "Supervisor",
    modules: ["dashboard", "operations", "leads"],
    mobileFirst: true,
  },
  "Car Washer": {
    defaultRoute: "/washer-app",
    appRoute: "/washer-app",
    label: "Car Washer",
    modules: ["dashboard"],
    mobileFirst: true,
  },
  "TSE": {
    defaultRoute: "/",
    label: "Tele Sales Executive",
    modules: ["dashboard", "crm", "leads"],
    mobileFirst: false,
  },
  "TSM": {
    defaultRoute: "/",
    label: "Tele Sales Manager",
    modules: ["dashboard", "crm", "leads", "analytics"],
    mobileFirst: false,
  },
  "CCE": {
    defaultRoute: "/",
    label: "Customer Care Executive",
    modules: ["dashboard", "crm", "complaints"],
    mobileFirst: false,
  },
  "Store Manager": {
    defaultRoute: "/store",
    label: "Store Manager",
    modules: ["dashboard", "inventory", "procurement"],
    mobileFirst: false,
  },
  "Procurement Manager": {
    defaultRoute: "/procurement",
    label: "Procurement Manager",
    modules: ["dashboard", "procurement", "inventory"],
    mobileFirst: false,
  },
  "Accounts": {
    defaultRoute: "/accounts",
    label: "Accounts",
    modules: ["dashboard", "finance", "accounts", "gst"],
    mobileFirst: false,
  },
  "Finance": {
    defaultRoute: "/finance",
    label: "Finance",
    modules: ["dashboard", "finance", "accounts"],
    mobileFirst: false,
  },
};

/**
 * Get the default landing route for a role
 */
export function getDefaultRouteForRole(role: string): string {
  return ROLE_ROUTE_REGISTRY[role]?.defaultRoute || "/";
}

/**
 * Get the role-specific app route (for mobile-first roles)
 */
export function getAppRouteForRole(role: string): string | undefined {
  return ROLE_ROUTE_REGISTRY[role]?.appRoute;
}

/**
 * Check if a role is mobile-first
 */
export function isMobileFirstRole(role: string): boolean {
  return ROLE_ROUTE_REGISTRY[role]?.mobileFirst || false;
}

/**
 * Get all roles that are allowed in the given module
 */
export function getRolesForModule(module: string): string[] {
  return Object.entries(ROLE_ROUTE_REGISTRY)
    .filter(([, config]) => config.modules.includes("*") || config.modules.includes(module))
    .map(([role]) => role);
}
