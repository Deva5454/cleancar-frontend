/**
 * Permissions Hook
 *
 * Provides access to permission checks based on current user role
 * Connects to accessControl.ts for engine-based permissions
 */

import { useMemo } from "react";
import { useRole } from "../contexts/RoleContext";
import {
  hasEnginePermission,
  getEngineDataScope,
  getEnginePermissions,
  canViewEngine,
  canEditEngine,
  canCreateEngine,
  canDeleteEngine,
  canApproveEngine,
  canExportEngine,
  isAdmin,
  isManager,
  isFieldWorker,
  type Permission,
  type EngineType,
  type DataScope,
} from "../lib/accessControl";

export interface PermissionHelpers {
  // Engine-specific permissions
  can: (engine: EngineType, permission: Permission) => boolean;
  canView: (engine: EngineType) => boolean;
  canEdit: (engine: EngineType) => boolean;
  canCreate: (engine: EngineType) => boolean;
  canDelete: (engine: EngineType) => boolean;
  canApprove: (engine: EngineType) => boolean;
  canExport: (engine: EngineType) => boolean;

  // Data scope
  getScope: (engine: EngineType) => DataScope;
  hasScope: (engine: EngineType, scope: DataScope) => boolean;
  hasScopeOrBetter: (engine: EngineType, minScope: DataScope) => boolean;

  // Role groups
  isAdmin: boolean;
  isManager: boolean;
  isFieldWorker: boolean;

  // Current user context
  currentCity: string;
  currentCluster?: string;
  currentPincodes?: string[];
}

/**
 * Custom hook for permission checks
 */
export function usePermissions(): PermissionHelpers {
  const { currentRole, currentUser } = useRole();

  const helpers = useMemo<PermissionHelpers>(() => {
    // Scope hierarchy: OWN < TEAM < CLUSTER < CITY < ALL
    const scopeHierarchy: Record<DataScope, number> = {
      OWN: 0,
      TEAM: 1,
      CLUSTER: 2,
      CITY: 3,
      ALL: 4,
    };

    return {
      // Engine-specific permission checks
      can: (engine: EngineType, permission: Permission) =>
        hasEnginePermission(currentRole, engine, permission),

      canView: (engine: EngineType) => canViewEngine(currentRole, engine),

      canEdit: (engine: EngineType) => canEditEngine(currentRole, engine),

      canCreate: (engine: EngineType) => canCreateEngine(currentRole, engine),

      canDelete: (engine: EngineType) => canDeleteEngine(currentRole, engine),

      canApprove: (engine: EngineType) => canApproveEngine(currentRole, engine),

      canExport: (engine: EngineType) => canExportEngine(currentRole, engine),

      // Data scope helpers
      getScope: (engine: EngineType) => getEngineDataScope(currentRole, engine),

      hasScope: (engine: EngineType, scope: DataScope) => {
        const userScope = getEngineDataScope(currentRole, engine);
        return userScope === scope;
      },

      hasScopeOrBetter: (engine: EngineType, minScope: DataScope) => {
        const userScope = getEngineDataScope(currentRole, engine);
        return scopeHierarchy[userScope] >= scopeHierarchy[minScope];
      },

      // Role group checks
      isAdmin: isAdmin(currentRole),
      isManager: isManager(currentRole),
      isFieldWorker: isFieldWorker(currentRole),

      // Current user context
      currentCity: currentUser.city,
      currentCluster: currentUser.clusterId,
      currentPincodes: currentUser.assignedPincodes,
    };
  }, [currentRole, currentUser]);

  return helpers;
}

/**
 * Hook to check if user has specific permission
 * Simplified version for single checks
 */
export function useHasPermission(engine: EngineType, permission: Permission): boolean {
  const { can } = usePermissions();
  return can(engine, permission);
}

/**
 * Hook to get data scope for engine
 */
export function useDataScope(engine: EngineType): DataScope {
  const { getScope } = usePermissions();
  return getScope(engine);
}
