/**
 * Active Route Matching Utility
 *
 * Determines if a navigation item should be highlighted as active
 * based on the current route path and the item's matching strategy.
 *
 * PROBLEM SOLVED:
 * - Before: Using startsWith() everywhere caused multiple items to highlight
 * - Example: On /operations/data-capture, both "Operations" and "Data Capture" were active
 * - Result: Confusing UX with multiple highlighted items
 *
 * SOLUTION:
 * - Overview pages use exact match: /operations only highlights on /operations
 * - Child pages use prefix match: /operations/data-capture highlights when path starts with it
 * - Only ONE item can be active at a time
 */

/**
 * Check if a navigation item should be highlighted as active
 *
 * @param currentPath - Current browser path (location.pathname)
 * @param currentSearch - Current query string (location.search)
 * @param itemPath - Navigation item's path (may include query params)
 * @param match - Matching strategy: "exact" or "prefix" (default: "prefix")
 * @returns true if item should be highlighted
 *
 * @example
 * // Overview page - exact match
 * isActiveRoute("/operations", "", "/operations", "exact") // → true
 * isActiveRoute("/operations/data-capture", "", "/operations", "exact") // → false
 *
 * // Child page - prefix match
 * isActiveRoute("/operations/data-capture", "", "/operations/data-capture", "prefix") // → true
 * isActiveRoute("/operations/data-capture/edit", "", "/operations/data-capture", "prefix") // → true
 *
 * // Query param-based tabs
 * isActiveRoute("/tse-app", "?tab=leads", "/tse-app?tab=leads", "exact") // → true
 * isActiveRoute("/tse-app", "?tab=incentives", "/tse-app?tab=leads", "exact") // → false
 *
 * // Dashboard special case - exact match always
 * isActiveRoute("/", "", "/", "exact") // → true
 * isActiveRoute("/analytics", "", "/", "exact") // → false
 */
export function isActiveRoute(
  currentPath: string,
  currentSearch: string,
  itemPath: string,
  match: "exact" | "prefix" = "prefix"
): boolean {
  // Split itemPath into path and query parts
  const [path, queryString] = itemPath.split("?");

  // Dashboard special case - always exact match
  if (path === "/") {
    return currentPath === "/";
  }

  // Check path match first
  const pathMatch = match === "exact"
    ? currentPath === path
    : currentPath.startsWith(path);

  // If path doesn't match, return false
  if (!pathMatch) {
    return false;
  }

  // If no query string in itemPath, just return path match
  if (!queryString) {
    return pathMatch;
  }

  // Query param match - check if currentSearch contains the query param
  // Normalize query strings (remove leading ?)
  const normalizedCurrent = currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch;
  const normalizedItem = queryString.startsWith("?") ? queryString.slice(1) : queryString;

  // For exact match with query params, both path AND query must match
  return pathMatch && normalizedCurrent.includes(normalizedItem);
}

/**
 * Check if any child of a navigation item is active
 *
 * Used to determine if a parent section should be expanded (but not highlighted)
 * when one of its children is active.
 *
 * @param currentPath - Current browser path
 * @param currentSearch - Current query string
 * @param children - Array of child navigation items
 * @returns true if any child is active
 *
 * @example
 * const children = [
 *   { path: "/operations/data-capture", match: "prefix" },
 *   { path: "/operations/team", match: "prefix" }
 * ];
 * hasActiveChild("/operations/data-capture", "", children) // → true
 * hasActiveChild("/hr", "", children) // → false
 */
export function hasActiveChild(
  currentPath: string,
  currentSearch: string,
  children?: Array<{ path: string; match?: "exact" | "prefix"; children?: any[] }>
): boolean {
  if (!children || children.length === 0) {
    return false;
  }

  return children.some((child) => {
    // Check if this child is active
    const childActive = isActiveRoute(currentPath, currentSearch, child.path, child.match);
    if (childActive) return true;

    // Recursively check nested children
    if (child.children) {
      return hasActiveChild(currentPath, currentSearch, child.children);
    }

    return false;
  });
}

/**
 * Determine if a parent item should be highlighted
 *
 * Parent items (overview pages) should only highlight on exact match,
 * never when a child is active. This prevents double-highlighting.
 *
 * @param currentPath - Current browser path
 * @param currentSearch - Current query string
 * @param itemPath - Parent item's path
 * @param hasChildren - Whether the item has children
 * @returns true if parent should be highlighted
 *
 * @example
 * // On /operations (overview page)
 * isParentActive("/operations", "", "/operations", true) // → true
 *
 * // On /operations/data-capture (child page)
 * isParentActive("/operations/data-capture", "", "/operations", true) // → false
 */
export function isParentActive(
  currentPath: string,
  currentSearch: string,
  itemPath: string,
  hasChildren: boolean
): boolean {
  if (!hasChildren) {
    // No children - use normal matching
    return isActiveRoute(currentPath, currentSearch, itemPath, "prefix");
  }

  // Has children - only highlight on exact match (overview page)
  return isActiveRoute(currentPath, currentSearch, itemPath, "exact");
}
