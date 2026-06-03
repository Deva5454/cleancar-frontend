/**
 * Auto-Protected Route Component
 *
 * Automatically detects required module from route configuration
 * and wraps children with ProtectedRoute.
 *
 * Usage:
 * ```tsx
 * <Route path="/admin/permissions" element={<Auto><PermissionPage /></Auto>} />
 * ```
 *
 * This is shorthand for:
 * ```tsx
 * <Route path="/admin/permissions" element={<ProtectedRoute module="admin"><PermissionPage /></ProtectedRoute>} />
 * ```
 */

import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { getRouteConfig } from "../../config/routeConfig";

interface AutoProtectedRouteProps {
  children: ReactNode;
}

export function AutoProtectedRoute({ children }: AutoProtectedRouteProps) {
  const location = useLocation();

  // Auto-detect required module from route configuration
  const routeConfig = getRouteConfig(location.pathname);

  // If route has a module requirement, protect it
  if (routeConfig?.module) {
    return (
      <ProtectedRoute module={routeConfig.module}>
        {children}
      </ProtectedRoute>
    );
  }

  // No protection needed (public route or not in config)
  return <>{children}</>;
}

// Export a shorter alias for convenience
export const Auto = AutoProtectedRoute;
