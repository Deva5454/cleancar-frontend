/**
 * useExportPermission — RBAC for data exports.
 *
 * PHASE 1 FIX: Restrict exports by role.
 * Previously any logged-in user could download any data CSV.
 *
 * Usage:
 *   const { canExport, canExportFinance, canExportHR } = useExportPermission();
 */
import { useRole } from "../contexts/RoleContext";

const FINANCE_EXPORT_ROLES = ["Super Admin", "Admin", "Finance", "Accounts", "City Manager"];
const HR_EXPORT_ROLES = ["Super Admin", "Admin", "HR", "HR Manager", "City Manager"];
const ANALYTICS_EXPORT_ROLES = ["Super Admin", "Admin", "Finance", "City Manager", "Cluster Manager", "Sr Operations Manager"];
const OPERATIONS_EXPORT_ROLES = ["Super Admin", "Admin", "City Manager", "Cluster Manager", "Sr Operations Manager", "Operations Manager"];

export function useExportPermission() {
  const { currentRole } = useRole();
  const role = currentRole as string;

  return {
    canExportFinance:    FINANCE_EXPORT_ROLES.includes(role),
    canExportHR:         HR_EXPORT_ROLES.includes(role),
    canExportAnalytics:  ANALYTICS_EXPORT_ROLES.includes(role),
    canExportOperations: OPERATIONS_EXPORT_ROLES.includes(role),
    // Any of the above
    canExportAny: FINANCE_EXPORT_ROLES.includes(role)
      || HR_EXPORT_ROLES.includes(role)
      || ANALYTICS_EXPORT_ROLES.includes(role)
      || OPERATIONS_EXPORT_ROLES.includes(role),
    currentRole: role,
  };
}
