/**
 * Custom Role Context
 *
 * This context makes custom roles and role overrides available throughout the app.
 * It integrates with the existing permissionEngine so that when hasPermission() is
 * called, custom roles and overrides are automatically respected.
 */

import { createContext, useContext, useState, useEffect, ReactNode, useMemo} from "react";
import { rolePermissionService, CustomRole, RolePermissionOverride } from "../services/rolePermissionService";
import { useCity } from "./CityContext";
import type { Role } from "../lib/roleConfig";
import type { PermissionMatrix, Module, Action } from "../types/permissions";

interface CustomRoleContextType {
  customRoles: CustomRole[];
  getCustomRolesForParent: (parentRole: Role) => CustomRole[];
  createCustomRole: (params: Parameters<typeof rolePermissionService.createCustomRole>[0]) => CustomRole;
  updateCustomRole: (id: string, updates: Partial<CustomRole>) => void;
  deactivateCustomRole: (id: string) => void;
  // Role permission overrides
  getRoleEffectivePermissions: (role: Role) => PermissionMatrix;
  saveRolePermissions: (role: Role, permissions: PermissionMatrix, changeLog: any[]) => void;
  resetRoleToDefault: (role: Role) => void;
  hasRoleOverride: (role: Role) => boolean;
  // Refresh
  refresh: () => void;
}

const CustomRoleContext = createContext<CustomRoleContextType | undefined>(undefined);

export function CustomRoleProvider({ children }: { children: ReactNode }) {
  const { city } = useCity();
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);

  const loadData = () => {
    setCustomRoles(rolePermissionService.getAllCustomRoles(city));
  };

  useEffect(() => { loadData(); }, [city]);

  const getCustomRolesForParent = (parentRole: Role) =>
    customRoles.filter(r => r.parentRole === parentRole);

  const createCustomRole = (params: Parameters<typeof rolePermissionService.createCustomRole>[0]) => {
    const role = rolePermissionService.createCustomRole({ ...params, cityId: city });
    loadData();
    return role;
  };

  const updateCustomRole = (id: string, updates: Partial<CustomRole>) => {
    rolePermissionService.updateCustomRole(id, updates, "super-admin");
    loadData();
  };

  const deactivateCustomRole = (id: string) => {
    rolePermissionService.deactivateCustomRole(id);
    loadData();
  };

  const getRoleEffectivePermissions = (role: Role) =>
    rolePermissionService.getEffectivePermissions(role, city);

  const saveRolePermissions = (role: Role, permissions: PermissionMatrix, changeLog: any[]) => {
    rolePermissionService.saveRoleOverride({
      targetRole: role, cityId: city, permissions,
      modifiedBy: "super-admin", changeLog,
    });
    loadData();
  };

  const resetRoleToDefault = (role: Role) => {
    rolePermissionService.resetRoleToDefault(role, city);
    loadData();
  };

  const hasRoleOverride = (role: Role) =>
    !!rolePermissionService.getRoleOverride(role, city);

  const contextValue = useMemo(() => ({
      customRoles, getCustomRolesForParent, createCustomRole,
      updateCustomRole, deactivateCustomRole, getRoleEffectivePermissions,
      saveRolePermissions, resetRoleToDefault, hasRoleOverride, refresh: loadData,
    }),
  [customRoles, updateCustomRole, saveRolePermissions]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CustomRoleContext.Provider value={contextValue}>
      {children}
    </CustomRoleContext.Provider>
  );
}

export function useCustomRoles() {
  const ctx = useContext(CustomRoleContext);
  if (!ctx) { console.warn("[useCustomRoles] outside CustomRoleProvider - fallback"); return context as any; }
  return ctx;
}
