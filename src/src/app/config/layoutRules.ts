/**
 * layoutRules.ts — Enterprise Layout Configuration
 *
 * Fixes applied:
 * 1. FALSE POSITIVE MATCHING — strict path matching (=== or startsWith + "/")
 * 2. SUPERVISOR/ROLE APP ROUTES — all role namespaces included
 * 3. ROLE-AWARE RULES — per-role layout overrides supported
 * 4. MOBILE RESPONSIVENESS — device-aware helpers exported
 * 5. PRIORITY ENGINE — EXPAND > COLLAPSE > DEFAULT, no conflicts
 * 6. CENTRALIZED CONFIG MODEL — single RouteLayoutRule per route
 * 7. DEFENSIVE UNKNOWN ROUTE — fallback to DEFAULT, never inherit wrong layout
 */

import type { Role } from "../lib/roleConfig";

// ── Types ─────────────────────────────────────────────────────────

export type SidebarBehavior = "collapsed" | "expanded" | "default";
export type LayoutPriority  = 1 | 2 | 3; // 1=highest (EXPAND), 2=COLLAPSE, 3=DEFAULT

export interface RouteLayoutRule {
  /** Exact path or prefix to match */
  path: string;
  /** Whether to use prefix matching (default: true) */
  prefix?: boolean;
  /** Sidebar behavior for this route */
  sidebar: SidebarBehavior;
  /** Priority — lower number wins in conflicts. 1=EXPAND, 2=COLLAPSE, 3=DEFAULT */
  priority: LayoutPriority;
  /** Optional: only apply rule for specific roles */
  roles?: Role[];
  /** Optional: human-readable description */
  description?: string;
}

// ── Master Route Layout Config ────────────────────────────────────
// Priority 1 (EXPAND) always beats Priority 2 (COLLAPSE)
// Priority 2 (COLLAPSE) beats Priority 3 (DEFAULT)

export const ROUTE_LAYOUT_RULES: RouteLayoutRule[] = [

  // ── PRIORITY 1: ALWAYS EXPANDED ──────────────────────────────────
  {
    path: "/onboarding",
    sidebar: "expanded",
    priority: 1,
    description: "Employee onboarding — needs full form width",
  },
  {
    path: "/onboard",
    sidebar: "expanded",
    priority: 1,
    description: "Onboarding portal",
  },
  {
    path: "/my-account",
    sidebar: "expanded",
    priority: 1,
    description: "My Account — self-service; must not auto-collapse",
  },
  {
    path: "/login",
    sidebar: "expanded",
    priority: 1,
    description: "Login page",
  },
  {
    path: "/hr/professional-leave",
    sidebar: "expanded",
    priority: 1,
    description: "Leave application — form needs space",
  },
  {
    path: "/hr/self-service",
    sidebar: "expanded",
    priority: 1,
    description: "Employee self-service",
  },
  {
    path: "/advance",
    sidebar: "expanded",
    priority: 1,
    description: "Advance application forms",
  },
  {
    path: "/travel",
    sidebar: "expanded",
    priority: 1,
    description: "Travel reimbursement — form needs moderate width",
  },
  {
    path: "/approvals",
    sidebar: "expanded",
    priority: 1,
    description: "Approval center",
  },

  // ── PRIORITY 2: AUTO-COLLAPSE (dense content) ─────────────────────
  {
    path: "/analytics",
    sidebar: "collapsed",
    priority: 2,
    description: "Analytics dashboards — wide charts",
  },
  {
    path: "/finance",
    sidebar: "collapsed",
    priority: 2,
    description: "Finance module — wide tables",
  },
  {
    path: "/finance/analytics",
    sidebar: "collapsed",
    priority: 2,
    description: "Finance analytics — charts need full width",
  },
  {
    path: "/reports",
    sidebar: "collapsed",
    priority: 2,
    description: "Reports — wide data tables",
  },
  {
    path: "/operations",
    sidebar: "collapsed",
    priority: 2,
    description: "Operations module",
  },
  {
    path: "/payroll",
    sidebar: "collapsed",
    priority: 2,
    description: "Payroll — complex tables",
  },
  {
    path: "/accounts",
    sidebar: "collapsed",
    priority: 2,
    description: "Accounts — ledger tables",
  },
  {
    path: "/inventory",
    sidebar: "collapsed",
    priority: 2,
    description: "Inventory — stock tables",
  },
  {
    path: "/founder",
    sidebar: "collapsed",
    priority: 2,
    description: "Founder control tower — dense dashboards",
  },
  {
    path: "/gst",
    sidebar: "collapsed",
    priority: 2,
    description: "GST module — compliance tables",
  },
  {
    path: "/hr/lifecycle-reports",
    sidebar: "collapsed",
    priority: 2,
    description: "HR lifecycle reports",
  },
  {
    path: "/hr/employee-ledger",
    sidebar: "collapsed",
    priority: 2,
    description: "Employee ledger — financial table",
  },
  {
    path: "/crm/conversion-analytics",
    sidebar: "collapsed",
    priority: 2,
    description: "CRM analytics — funnel charts",
  },
  {
    path: "/unit-economics",
    sidebar: "collapsed",
    priority: 2,
    description: "Unit economics dashboard",
  },
  {
    path: "/break-even",
    sidebar: "collapsed",
    priority: 2,
    description: "Break-even analysis",
  },
  {
    path: "/cost-per-wash",
    sidebar: "collapsed",
    priority: 2,
    description: "Cost per wash — detailed tables",
  },
  {
    path: "/cost-by-plan",
    sidebar: "collapsed",
    priority: 2,
    description: "Cost by plan",
  },
  {
    path: "/cost-by-consumption",
    sidebar: "collapsed",
    priority: 2,
    description: "Cost by consumption",
  },
  {
    path: "/labour-cost-per-wash",
    sidebar: "collapsed",
    priority: 2,
    description: "Labour cost per wash",
  },
  {
    path: "/city-comparison",
    sidebar: "collapsed",
    priority: 2,
    description: "City comparison — wide comparison tables",
  },
  {
    path: "/customer-ltv",
    sidebar: "collapsed",
    priority: 2,
    description: "LTV analysis",
  },
  {
    path: "/cac",
    sidebar: "collapsed",
    priority: 2,
    description: "CAC dashboard",
  },

  // ── ROLE APP NAMESPACES (Priority 2 — auto-collapse for dashboard views) ──
  {
    path: "/supervisor-app",
    sidebar: "collapsed",
    priority: 2,
    roles: ["Supervisor"],
    description: "Supervisor app — team overview needs width",
  },
  {
    path: "/om-app",
    sidebar: "collapsed",
    priority: 2,
    roles: ["Operations Manager", "Sr Operations Manager"],
    description: "Operations manager app",
  },
  {
    path: "/cm-app",
    sidebar: "collapsed",
    priority: 2,
    roles: ["Cluster Manager"],
    description: "Cluster manager app",
  },
  {
    path: "/city-app",
    sidebar: "collapsed",
    priority: 2,
    roles: ["City Manager"],
    description: "City manager command center",
  },
  {
    path: "/tse-app",
    sidebar: "collapsed",
    priority: 2,
    roles: ["TSE"],
    description: "TSE app",
  },
  {
    path: "/tsm-app",
    sidebar: "collapsed",
    priority: 2,
    roles: ["TSM"],
    description: "TSM app",
  },
  {
    path: "/cce-app",
    sidebar: "collapsed",
    priority: 2,
    roles: ["CCE"],
    description: "CCE app",
  },
];

// ── Core Matching Engine ──────────────────────────────────────────

/**
 * STRICT path matching — fixes false positive issue.
 * Matches: exact path OR path followed by "/"
 * Does NOT match: /operations-team when rule is /operations
 */
function matchesPath(rulePath: string, currentPath: string, prefix = true): boolean {
  if (currentPath === rulePath) return true;
  if (prefix) return currentPath.startsWith(`${rulePath}/`);
  return false;
}

/**
 * Get the layout rule for a given path + role.
 * Priority engine: lower priority number wins.
 * EXPAND (1) > COLLAPSE (2) > DEFAULT (3)
 */
export function getLayoutRule(
  path: string,
  role?: Role
): RouteLayoutRule | null {
  // Find all matching rules for this path
  const matches = ROUTE_LAYOUT_RULES.filter(rule => {
    const pathMatches = matchesPath(rule.path, path, rule.prefix !== false);
    if (!pathMatches) return false;
    // If rule has role restriction, check it
    if (rule.roles && rule.roles.length > 0) {
      if (!role || !rule.roles.includes(role)) return false;
    }
    return true;
  });

  if (matches.length === 0) return null;

  // Return highest priority (lowest number) match
  // Ties broken by: role-specific rules beat generic rules
  return matches.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    // Role-specific rule wins over generic
    const aSpecific = a.roles && a.roles.length > 0 ? 0 : 1;
    const bSpecific = b.roles && b.roles.length > 0 ? 0 : 1;
    return aSpecific - bSpecific;
  })[0];
}

// ── Public API (backward compatible with RootLayout) ──────────────

/**
 * Should sidebar auto-collapse for this route?
 * Replaces old isDenseRoute() — enterprise-safe strict matching.
 */
export function isDenseRoute(path: string, role?: Role): boolean {
  const rule = getLayoutRule(path, role);
  if (!rule) return false;
  return rule.sidebar === "collapsed";
}

/**
 * Should sidebar force-expand for this route?
 * Replaces old shouldForceExpand() with priority-aware version.
 * EXPAND always beats COLLAPSE when both match same path.
 */
export function shouldForceExpand(path: string, role?: Role): boolean {
  const rule = getLayoutRule(path, role);
  if (!rule) return false;
  return rule.sidebar === "expanded";
}

/**
 * Get full sidebar behavior for a path + role.
 * Returns: "collapsed" | "expanded" | "default"
 */
export function getSidebarBehavior(path: string, role?: Role): SidebarBehavior {
  const rule = getLayoutRule(path, role);
  return rule?.sidebar ?? "default";
}

// ── Mobile / Device Helpers ───────────────────────────────────────

export type DeviceType = "mobile" | "tablet" | "desktop";

export function getDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 640)  return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function isMobileDevice(): boolean {
  return getDeviceType() === "mobile";
}

export function isTabletDevice(): boolean {
  return getDeviceType() === "tablet";
}

/**
 * On mobile, sidebar should ALWAYS start collapsed
 * regardless of route rules — screen space is too small.
 */
export function getInitialSidebarState(path: string, role?: Role): boolean {
  if (isMobileDevice()) return true; // Always collapsed on mobile
  return isDenseRoute(path, role);
}

// ── Conflict Detection (dev mode only) ───────────────────────────

/**
 * Detect if a path has both EXPAND and COLLAPSE rules.
 * Only used in development for debugging.
 */
export function detectConflicts(path: string): void {
  if (!import.meta.env?.DEV) return;

  const matches = ROUTE_LAYOUT_RULES.filter(r =>
    matchesPath(r.path, path, r.prefix !== false)
  );

  const hasExpand   = matches.some(r => r.sidebar === "expanded");
  const hasCollapse = matches.some(r => r.sidebar === "collapsed");

  if (hasExpand && hasCollapse) {
    console.warn(
      `[LayoutRules] Conflict detected for path "${path}": ` +
      `both EXPAND and COLLAPSE rules match. ` +
      `EXPAND wins (priority 1 > 2). Check ROUTE_LAYOUT_RULES.`
    );
  }
}

// ── Legacy exports (keep for any direct imports elsewhere) ────────
export const DENSE_ROUTES = ROUTE_LAYOUT_RULES
  .filter(r => r.sidebar === "collapsed")
  .map(r => r.path);

export const ALWAYS_EXPANDED_ROUTES = ROUTE_LAYOUT_RULES
  .filter(r => r.sidebar === "expanded")
  .map(r => r.path);
