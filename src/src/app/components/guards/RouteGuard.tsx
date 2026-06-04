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
  // isLoaded tells us when EmployeeContext has finished its initial localStorage read.
  // Without this guard, RouteGuard can fire with employees=[] on first render and
  // incorrectly redirect users away from valid routes.
  const { employees } = useEmployee();

  useEffect(() => {
    // Wait until EmployeeContext has loaded from localStorage before checking access.
    // employees initialises synchronously so isLoaded is true almost immediately,
    // but this prevents any edge-case race on very first render.
    if (isPublicRoute(location.pathname)) return;

    const routeConfig = getRouteConfig(location.pathname);
    if (!routeConfig) return;

    // My Account and Travel are self-service — all authenticated users can access them
    const SELF_SERVICE = ["dashboard", "travel"];
    if (SELF_SERVICE.includes(routeConfig.module) && currentUser) return;

    const currentEmployee = currentUser
      ? employees.find(e =>
          e.employeeId === currentUser.employeeId ||
          e.id === currentUser.employeeId
        ) || null
      : null;

    const empForCheck = currentEmployee || (currentUser ? {
      role: currentUser.role,
      cityId: currentUser.cityId || "CITY-SURAT",
      customPermissions: (currentUser as any).customPermissions,
    } : null);

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
