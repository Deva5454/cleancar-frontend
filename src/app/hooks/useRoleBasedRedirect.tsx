import { useEffect } from "react";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Role } from "../lib/roleConfig";

const ROLE_REDIRECTS: Partial<Record<Role, { defaultPath: string; allowedPrefixes: string[] }>> = {
  TSE:             { defaultPath: "/tse-app",           allowedPrefixes: ["/tse-app", "/tse-diagnostics", "/leads", "/my-account", "/hr/"] },
  TSM:             { defaultPath: "/tsm-app",           allowedPrefixes: ["/tsm-app", "/tele-sales-manager", "/leads", "/customers", "/complaints", "/hr/", "/performance", "/my-account"] },
  "Sales Head":    { defaultPath: "/sh-app",            allowedPrefixes: ["/sh-app", "/leads", "/customers", "/complaints", "/analytics", "/hr/", "/performance", "/my-account"] },
  "Sales Manager": { defaultPath: "/sm-app-alliance",   allowedPrefixes: ["/sm-app-alliance", "/leads", "/customers", "/hr/", "/performance", "/my-account"] },
  "Marketing Agency": { defaultPath: "/", allowedPrefixes: [] },
  CCE:             { defaultPath: "/cce-app",           allowedPrefixes: ["/cce-app", "/customer-care", "/leads", "/customers", "/complaints", "/my-account"] },
  "Car Washer":    { defaultPath: "/washer-core-screens", allowedPrefixes: ["/washer-core-screens", "/car-washer", "/cloth-tracking/exchange", "/advance", "/hr/", "/performance", "/my-account"] },
  Supervisor:      { defaultPath: "/supervisor-app/dashboard", allowedPrefixes: ["/supervisor-app", "/washer-jobs", "/service-zones", "/complaints", "/inventory", "/cloth-tracking", "/advance", "/hr/", "/performance", "/my-account"] },
  "Operations Manager":    { defaultPath: "/operations", allowedPrefixes: ["/operations", "/washer-jobs", "/service-zones", "/supervisor", "/complaints", "/car-washer", "/hr/", "/approvals", "/performance", "/my-account"] },
  "Sr Operations Manager": { defaultPath: "/operations", allowedPrefixes: ["/operations", "/washer-jobs", "/service-zones", "/supervisor", "/complaints", "/car-washer", "/hr/", "/approvals", "/performance", "/analytics", "/my-account"] },
  "Cluster Manager": { defaultPath: "/cm-app",   allowedPrefixes: ["/cm-app", "/operations", "/washer-jobs", "/service-zones", "/complaints", "/users", "/leads", "/customers", "/finance", "/hr/", "/performance", "/analytics", "/my-account"] },
  "City Manager":    { defaultPath: "/city-app",  allowedPrefixes: ["/city-app", "/city", "/complaints", "/users", "/leads", "/customers", "/operations", "/washer-jobs", "/service-zones", "/finance", "/hr/", "/performance", "/analytics", "/my-account"] },
  "Store Manager":       { defaultPath: "/store",       allowedPrefixes: ["/store", "/inventory", "/my-account"] },
  "Procurement Manager": { defaultPath: "/procurement", allowedPrefixes: ["/procurement", "/store", "/my-account"] },
  "Super Admin": { defaultPath: "/", allowedPrefixes: [] },
  Admin:         { defaultPath: "/", allowedPrefixes: [] },
  HR:            { defaultPath: "/hr",      allowedPrefixes: [] },
  Accounts:      { defaultPath: "/finance", allowedPrefixes: [] },
};

export function useRoleBasedRedirect(currentRole: Role, enabled: boolean = true) {
  const navigate    = useNavigate();
  const location    = useLocation();
  const prevRoleRef = React.useRef<Role>(currentRole);

  useEffect(() => {
    if (!enabled) return;

    const prevRole    = prevRoleRef.current;
    const roleChanged = prevRole !== currentRole;
    prevRoleRef.current = currentRole;

    if (!roleChanged) return;

    const config = ROLE_REDIRECTS[currentRole];
    if (!config) return;
    if (config.allowedPrefixes.length === 0) return; // unrestricted

    const currentPath = location.pathname;
    const alreadyCorrect = config.allowedPrefixes.some(p =>
      currentPath === p || currentPath.startsWith(p + "/") || currentPath.startsWith(p)
    );

    if (!alreadyCorrect) {
      navigate(config.defaultPath, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole]);
}

export function getRoleDefaultPath(role: Role): string {
  return ROLE_REDIRECTS[role]?.defaultPath || "/";
}

export function isPathAllowedForRole(role: Role, path: string): boolean {
  const config = ROLE_REDIRECTS[role];
  if (!config || config.allowedPrefixes.length === 0) return true;
  return config.allowedPrefixes.some(p => path === p || path.startsWith(p + "/") || path.startsWith(p));
}
