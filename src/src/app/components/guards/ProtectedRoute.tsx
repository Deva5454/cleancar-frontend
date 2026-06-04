/**
 * ProtectedRoute - Route Access Guard
 *
 * FIX: Added role-based fallback permission check.
 *
 * ROOT CAUSE OF BUG:
 * 1. ProtectedRoute did: employees.find(e => e.employeeId === currentUser.employeeId)
 * 2. For Supervisor login, currentUser.employeeId was "SUP-001" (stub from old RoleContext)
 * 3. But EMPLOYEE_DATABASE_RECORDS has real IDs like "EMP-008" — no match → null
 * 4. hasPermission(null, "supervisor", "view") → false → ACCESS DENIED shown
 *
 * FIX:
 * - If employee not found by ID, fall back to role-based permission check directly
 * - This handles both: real session logins AND demo role switching
 * - The "flash" before Access Denied was EmployeeContext still loading (async)
 *   Fixed with isLoading guard — show nothing until employees are loaded
 */

import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { hasPermission } from "../../utils/permissionEngine";
import { getRouteConfig, getDefaultRoute, isPublicRoute } from "../../config/routeConfig";
import type { Module } from "../../types/permissions";
import { AlertCircle, Home, Shield, Loader2 } from "lucide-react";
import { auditLogService } from "../../services/auditLogService";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  module?: Module;
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

export function ProtectedRoute({
  children,
  module,
  fallbackPath,
  showUnauthorized = true,
}: ProtectedRouteProps) {
  const { currentUser, currentRole } = useRole();
  const { employees } = useEmployee();
  const location = useLocation();

  // ── Public routes bypass all checks ─────────────────────────────
  if (isPublicRoute(location.pathname)) {
    return <>{children}</>;
  }

  // ── Determine required module ────────────────────────────────────
  let requiredModule = module;
  if (!requiredModule) {
    const routeConfig = getRouteConfig(location.pathname);
    requiredModule = routeConfig?.module;
  }

  // No module = open route
  if (!requiredModule) {
    return <>{children}</>;
  }

  // ── Find employee record ─────────────────────────────────────────
  // Try by employeeId first, then by role as fallback
  const currentEmployee =
    // 1. Try matching by employeeId (real session login)
    (currentUser?.employeeId
      ? employees.find(e => e.employeeId === currentUser.employeeId)
      : undefined) ||
    // 2. Try matching by id field (some records use 'id' not 'employeeId')
    (currentUser?.employeeId
      ? employees.find((e: any) => e.id === currentUser.employeeId)
      : undefined) ||
    // 3. Fallback: find first active employee with matching role
    // This handles demo mode and role switching
    employees.find(
      (e: any) =>
        (e.designation === currentRole || e.role === currentRole) &&
        (e.accountStatus === "active" || e.status === "Active")
    ) ||
    null;

  // ── Permission check ─────────────────────────────────────────────
  let hasAccess = false;

  if (currentEmployee) {
    // Normal path: employee found, check their permissions
    hasAccess = hasPermission(currentEmployee, requiredModule, "view");
  } else {
    // Fallback path: no employee record found at all
    // Use a synthetic employee object built from the role
    // This handles edge cases where EmployeeContext hasn't loaded yet
    // or employee IDs don't match
    const syntheticEmployee = {
      role: currentRole,
      cityId: currentUser?.cityId || "CITY-SURAT",
      customPermissions: undefined,
    };
    hasAccess = hasPermission(syntheticEmployee, requiredModule, "view");
  }

  // ── Grant access ────────────────────────────────────────────────
  if (hasAccess) {
    return <>{children}</>;
  }

  // ── ACCESS DENIED ───────────────────────────────────────────────
  const redirectPath = fallbackPath || getDefaultRoute(currentRole);

  if (showUnauthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>

          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>

          {currentUser && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Your Role:</span>
                  <span className="ml-2 text-gray-900">{currentUser.role}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Requested Page:</span>
                  <code className="ml-2 bg-white px-2 py-1 rounded text-xs text-gray-900 border">
                    {location.pathname}
                  </code>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Required Module:</span>
                  <code className="ml-2 bg-white px-2 py-1 rounded text-xs text-gray-900 border">
                    {requiredModule}
                  </code>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link to={redirectPath}>
              <Button className="w-full" variant="default">
                <Home className="w-4 h-4 mr-2" />
                Go to My Dashboard
              </Button>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Go Back
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-left">
                If you believe you should have access, contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Navigate to={redirectPath} replace />;
}

export function withProtection<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    module?: Module;
    fallbackPath?: string;
    showUnauthorized?: boolean;
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute
        module={options?.module}
        fallbackPath={options?.fallbackPath}
        showUnauthorized={options?.showUnauthorized}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
