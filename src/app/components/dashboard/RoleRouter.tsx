/**
 * RoleRouter — renders immediately at "/" with zero flash
 *
 * The flash bug: Dashboard rendered at "/" → useRoleBasedRedirect fired in
 * useEffect (after render) → navigate() called → Dashboard unmounted.
 * User saw Dashboard appear and disappear in ~16ms.
 *
 * Fix: Navigate synchronously during render using <Navigate replace />.
 * No Dashboard renders, no flash. The redirect happens at route-match time.
 *
 * Roles that land on "/":
 *   Super Admin / Admin / Manager / City Manager / Cluster Manager /
 *   Sr Ops Manager / Operations Manager / Supervisor / Car Washer /
 *   TSM / Marketing Agency → show Executive/role dashboard (correct)
 *
 *   TSE / HR / Accounts / Store Manager / Procurement Manager →
 *   redirect to their defaultPath synchronously (was causing the flash)
 */

import { Navigate } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { RoleDashboard } from "./RoleDashboard";

// Roles that should NOT land on "/" — redirect them immediately
const ROLE_HOME_REDIRECTS: Partial<Record<string, string>> = {
  TSE:                  "/tse-app",
  HR:                   "/hr",
  Accounts:             "/accounts",
  "Store Manager":      "/store",
  "Procurement Manager":"/procurement",
};

export function RoleRouter() {
  const { currentRole } = useRole();
  const redirectTo = ROLE_HOME_REDIRECTS[currentRole];

  // Synchronous redirect — no render flash
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  // All other roles: show their role-specific dashboard
  return <RoleDashboard />;
}
