/**
 * Navigation Builder - Dynamic Sidebar Generation
 *
 * Builds the navigation tree dynamically based on user permissions.
 * Integrates with MC-11 Permission Engine to ensure users only see
 * navigation items they have access to.
 *
 * CORE PRINCIPLE:
 * - Navigation config defines WHAT navigation items exist
 * - Permission engine defines WHO can see them
 * - Navigation builder combines both to create personalized UI
 */

import type { NavItem } from "../config/navigationConfig";
import { NAV_CONFIG, QUICK_ACTIONS } from "../config/navigationConfig";
import { hasPermission } from "./permissionEngine";
import type { Role } from "../lib/roleConfig";
import { attachCityToPath, type CityId } from "../contexts/CityContext";
import { permissionMatrix, type City } from "../config/permissionMatrix";

/**
 * Minimal employee shape for permission checking.
 * Replaces the full hr-types Employee — permissionEngine only
 * reads role + cityId, never the nested personal/employment info.
 */
export interface NavEmployee {
  role: Role;
  cityId?: string;
  customPermissions?: Record<string, string[]>;
}

/**
 * Build personalized navigation tree for a user
 *
 * This function:
 * 1. Takes the master navigation config (all possible items)
 * 2. Filters based on user's permissions
 * 3. Recursively processes children
 * 4. Removes empty parent items
 * 5. Injects city context into paths
 *
 * @param employee - Current user's employee record
 * @param city - Optional city context to inject into paths
 * @returns Filtered navigation tree for this specific user
 */
export function buildNavigation(employee: NavEmployee | null, city?: CityId): NavItem[] {
  if (!employee) {
    // Guest/unauthenticated users only see dashboard
    return [NAV_CONFIG[0]]; // Dashboard only
  }

  const filterNavItem = (item: NavItem): NavItem | null => {
    // Check if user has permission to view this module
    const hasAccess = hasPermission(employee, item.module, "view");

    if (!hasAccess) {
      return null; // User cannot see this item
    }

    // If item has children, recursively filter them
    if (item.children && item.children.length > 0) {
      const filteredChildren = item.children
        .map(filterNavItem)
        .filter((child): child is NavItem => child !== null);

      // If all children were filtered out, check if we should keep the parent
      if (filteredChildren.length === 0) {
        // Keep parent if it has its own path, otherwise remove it
        if (item.path && item.path !== "#") {
          return {
            ...item,
            path: city ? attachCityToPath(item.path, city) : item.path,
            children: undefined
          };
        }
        return null;
      }

      // Return parent with filtered children and city-injected path
      return {
        ...item,
        path: city ? attachCityToPath(item.path, city) : item.path,
        children: filteredChildren
      };
    }

    // Leaf item - user has access, inject city into path
    return {
      ...item,
      path: city ? attachCityToPath(item.path, city) : item.path
    };
  };

  // Filter the master navigation config
  const filteredNav = NAV_CONFIG
    .map(filterNavItem)
    .filter((item): item is NavItem => item !== null);

  // Single filter via hasPermission() above — double filter removed (F-NAV-01)
  return filteredNav;
}

/**
 * Build quick actions menu for a user
 *
 * Quick actions are personal shortcuts that appear separately
 * from the main navigation. Same filtering logic applies.
 *
 * @param employee - Current user's employee record
 * @param city - Optional city context to inject into paths
 * @returns Filtered quick actions for this user
 */
export function buildQuickActions(employee: NavEmployee | null, city?: CityId): NavItem[] {
  if (!employee) {
    return [];
  }

  const filteredActions = QUICK_ACTIONS.filter((action) => {
    return hasPermission(employee, action.module, "view");
  }).map((action) => ({
    ...action,
    path: city ? attachCityToPath(action.path, city) : action.path
  }));

  return filteredActions;
}

/**
 * Check if a specific path is accessible to a user
 *
 * Used for route protection - prevents URL hacking by checking
 * if the requested path exists in the user's permitted navigation.
 *
 * @param employee - Current user's employee record
 * @param path - Route path to check
 * @returns true if user can access this path
 */
export function canAccessPath(employee: NavEmployee | null, path: string): boolean {
  if (!employee) {
    return path === "/"; // Only dashboard for unauthenticated
  }

  // Build the user's navigation tree
  const userNav = buildNavigation(employee);

  // Recursively search for the path
  const findPath = (items: NavItem[]): boolean => {
    for (const item of items) {
      // Exact match
      if (item.path === path) {
        return true;
      }

      // Partial match (e.g., /analytics matches /analytics/dashboard)
      if (path.startsWith(item.path) && item.path !== "/") {
        return true;
      }

      // Check children
      if (item.children) {
        if (findPath(item.children)) {
          return true;
        }
      }
    }
    return false;
  };

  return findPath(userNav);
}

/**
 * Get all accessible paths for a user
 *
 * Useful for debugging and testing - returns flat list of all
 * paths the user can access.
 *
 * @param employee - Current user's employee record
 * @returns Array of accessible paths
 */
export function getAccessiblePaths(employee: NavEmployee | null): string[] {
  if (!employee) {
    return ["/"];
  }

  const userNav = buildNavigation(employee);
  const paths: string[] = [];

  const collectPaths = (items: NavItem[]) => {
    for (const item of items) {
      if (item.path && item.path !== "#") {
        paths.push(item.path);
      }
      if (item.children) {
        collectPaths(item.children);
      }
    }
  };

  collectPaths(userNav);
  return paths;
}

/**
 * Get navigation item by path
 *
 * Finds a specific navigation item in the user's permitted navigation.
 * Useful for breadcrumb generation and active state detection.
 *
 * @param employee - Current user's employee record
 * @param path - Path to find
 * @returns Navigation item or null if not found
 */
export function getNavItemByPath(employee: NavEmployee | null, path: string): NavItem | null {
  if (!employee) {
    return null;
  }

  const userNav = buildNavigation(employee);

  const findItem = (items: NavItem[]): NavItem | null => {
    for (const item of items) {
      if (item.path === path) {
        return item;
      }
      if (item.children) {
        const found = findItem(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  return findItem(userNav);
}

/**
 * Build breadcrumb trail for a path
 *
 * Creates a breadcrumb trail showing the navigation hierarchy
 * for the current path.
 *
 * @param employee - Current user's employee record
 * @param currentPath - Current route path
 * @returns Array of navigation items forming the breadcrumb trail
 */
export function buildBreadcrumbs(employee: NavEmployee | null, currentPath: string): NavItem[] {
  if (!employee) {
    return [];
  }

  const userNav = buildNavigation(employee);
  const breadcrumbs: NavItem[] = [];

  const findBreadcrumbs = (items: NavItem[], trail: NavItem[]): boolean => {
    for (const item of items) {
      const currentTrail = [...trail, item];

      if (item.path === currentPath) {
        breadcrumbs.push(...currentTrail);
        return true;
      }

      if (item.children) {
        if (findBreadcrumbs(item.children, currentTrail)) {
          return true;
        }
      }
    }
    return false;
  };

  findBreadcrumbs(userNav, []);
  return breadcrumbs;
}
