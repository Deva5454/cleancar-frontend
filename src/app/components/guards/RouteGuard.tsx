import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { hasPermission } from "../../utils/permissionEngine";
import { getRouteConfig, getDefaultRoute, isPublicRoute } from "../../config/routeConfig";
import { logger } from "../../services/logger";

export function RouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, currentRole } = useRole();
  const { employees } = useEmployee();

  useEffect(() => {
    // Skip ALL permission checks on Vercel preview deployments (same behaviour as cleancar-prodt)
    const isPreview = typeof window !== "undefined" && (
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("vercel.app") ||
      window.location.hostname.includes("figma") ||
      import.meta.env.MODE === "development"
    );
    if (isPreview) return;

    if (isPublicRoute(location.pathname)) return;

    const routeConfig = getRouteConfig(location.pathname);
    if (!routeConfig) return;

    // My Account and Travel are self-service — all authenticated users can access them
    const SELF_SERVICE = ["dashboard", "travel"];
    if (SELF_SERVICE.includes(routeConfig.module) && currentUser) return;

    // Build permission check object from currentUser directly (role-based).
    // Searching employees[] by employeeId is unreliable in preview/demo mode
    // because stub IDs (EMP-001) never match seeded IDs (EDB-SA-01).
    // Role-based check is sufficient — employee lookup is only needed for
    // custom per-employee overrides which are rare.
    const empForCheck = currentUser ? {
      role: currentUser.role,
      cityId: currentUser.cityId || "CITY-SURAT",
      customPermissions: (currentUser as any).customPermissions,
    } : null;

    const hasAccess = empForCheck
      ? hasPermission(empForCheck, routeConfig.module, "view")
      : false;

    if (!hasAccess) {
      const defaultRoute = getDefaultRoute(currentRole);
      logger.warn(`Access denied: ${location.pathname} for ${currentRole}`);
      navigate(defaultRoute, { replace: true });
    }
  // NOTE: "employees" intentionally removed from deps.
  // RouteGuard should NOT re-run permission checks on every HR edit elsewhere in the app.
  // It only needs to check on route change, role change, user change, or initial load.
  }, [location.pathname, currentUser, currentRole, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
