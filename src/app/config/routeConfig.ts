/**
 * Route Configuration — Single Source of Truth
 * Maps all routes to permission modules for access control
 */
import type { Module } from "../types/permissions";

export interface AppRoute {
  path: string;
  module: Module;
  description?: string;
}

export const ROUTES: AppRoute[] = [
  { path: "/", module: "dashboard" },
  { path: "/analytics", module: "analytics" },
  { path: "/analytics/*", module: "analytics" },
  { path: "/founder/*", module: "analytics" },
  { path: "/crm/*", module: "crm" },
  { path: "/leads", module: "leads" },
  { path: "/customers", module: "customers" },
  { path: "/operations", module: "jobs" },
  { path: "/operations/*", module: "jobs" },
  { path: "/washer-jobs", module: "jobs" },
  { path: "/service-zones", module: "jobs" },
  { path: "/users", module: "users" },
  { path: "/complaints", module: "complaints" },
  { path: "/performance", module: "performance" },
  { path: "/expansion-opportunities", module: "operations" },
  { path: "/hr", module: "hr" },
  { path: "/hr/*", module: "hr" },
  { path: "/hr/professional-leave", module: "leave" },
  { path: "/hr/self-service", module: "payroll-self-service" },
  { path: "/payroll/run", module: "payroll" },
  { path: "/payroll/*", module: "payroll" },
  { path: "/finance", module: "finance" },
  { path: "/finance/*", module: "finance" },
  { path: "/accounts", module: "accounts" },
  { path: "/accounts/*", module: "accounts" },
  { path: "/gst", module: "accounts" },
  { path: "/gst/*", module: "accounts" },
  { path: "/inventory", module: "inventory" },
  { path: "/inventory/*", module: "inventory" },
  { path: "/store", module: "store" },
  { path: "/store-manager/*", module: "store-manager" },
  { path: "/procurement", module: "procurement" },
  { path: "/procurement/*", module: "procurement" },
  { path: "/cloth-tracking/*", module: "cloth-tracking" },
  { path: "/advance", module: "advance" },
  { path: "/advance/*", module: "advance" },
  { path: "/travel", module: "travel" },
  { path: "/travel/*", module: "travel" },
  { path: "/my-account", module: "dashboard" },
  { path: "/my-account/*", module: "dashboard" },
  { path: "/admin/*", module: "admin" },
  { path: "/settings/*", module: "admin" },
  { path: "/subscription/*", module: "admin" },
  { path: "/workforce/*", module: "admin" },
  { path: "/approvals", module: "approvals" },
  { path: "/audit-trail", module: "audit-trail" },
  { path: "/system-audit", module: "audit-trail" },
  { path: "/reports/*", module: "reports" },
  { path: "/washer-core-screens", module: "car-washer" },
  { path: "/washer/*", module: "car-washer" },
  { path: "/supervisor-app/*", module: "supervisor" },
  { path: "/om-app", module: "operations" },
  { path: "/cm-app", module: "operations" },
  { path: "/city-app", module: "operations" },
  { path: "/tsm-app", module: "crm" },
  { path: "/tse-app", module: "crm" },
  { path: "/cce-app", module: "crm" },
  { path: "/incentives/configuration", module: "hr" },
  { path: "/incentives/*", module: "payroll" },
  { path: "/hierarchy-dashboard", module: "operations" },
  { path: "/onboard/:empId", module: "public" },
  { path: "/onboarding/:empId", module: "public" },
  // ── Added: routes present in routes.tsx but missing from this map ──
  // Without these, RouteGuard skips permission checks for these paths,
  // allowing any role to access them regardless of permissions.
  { path: "/cloth-tracking/exchange",  module: "cloth-tracking" },
  { path: "/workforce/working-hours",  module: "admin" },
  { path: "/advance/hr-management",    module: "hr" },
];

export function getRouteConfig(path: string): AppRoute | undefined {
  const p = path.split("?")[0];
  const exact = ROUTES.find(r => r.path === p);
  if (exact) return exact;
  for (const route of ROUTES) {
    if (route.path.endsWith("/*")) {
      if (p.startsWith(route.path.slice(0, -2))) return route;
    }
    if (route.path.includes(":")) {
      const pattern = route.path.replace(/:[^/]+/g, "[^/]+");
      if (new RegExp(`^${pattern}$`).test(p)) return route;
    }
  }
  return undefined;
}

export function isPublicRoute(path: string): boolean {
  const p = path.split("?")[0];
  return ["/onboarding", "/onboard", "/unauthorized", "/login"].some(r => p.startsWith(r));
}

export function getDefaultRoute(role: string): string {
  const defaults: Record<string, string> = {
    "Super Admin": "/",
    "Admin": "/",
    "City Manager": "/analytics/dashboard",
    "Cluster Manager": "/cm-app",
    "Sr Operations Manager": "/operations",
    "Operations Manager": "/om-app",
    "Manager": "/operations",
    "Supervisor": "/supervisor-app",
    "Car Washer": "/washer-core-screens",
    "TSM": "/tsm-app",
    "TSE": "/tse-app",
    "CCE": "/cce-app",
    "Store Manager": "/store-manager",
    "Procurement Manager": "/procurement",
    "Accounts": "/accounts",
    "HR": "/hr",
    "Sales Head":    "/sh-app",
    "Sales Manager": "/sm-app-alliance",
  };
  return defaults[role] || "/";
}
