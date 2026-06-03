FIGMA MAKE:
Create a new file: src/app/services/rolePermissionService.ts
 
This service manages all dynamic permission operations for the Super Admin.
It persists custom role permissions and sub-roles to DataService.
 
Add "CUSTOM_ROLES" and "ROLE_PERMISSION_OVERRIDES" to DataService STORAGE_KEYS
by opening src/app/services/DataService.ts and adding:
  CUSTOM_ROLES: "custom_roles",
  ROLE_PERMISSION_OVERRIDES: "role_permission_overrides",
 
Now create the service file with these TypeScript interfaces and exports:
 
import type { Role, RoleConfig } from "../lib/roleConfig";
import type { Module, Action, PermissionMatrix, City } from "../types/permissions";
import { DataService } from "./DataService";
import { logger } from "./logger";
 
// A custom sub-role created by Super Admin
export interface CustomRole {
  customRoleId: string;         // e.g. "CUSTOM-001"
  name: string;                 // e.g. "HR Executive"
  displayName: string;          // e.g. "HR Executive"
  parentRole: Role;             // e.g. "HR" — which base role this extends
  description: string;          // e.g. "Limited HR access for junior staff"
  permissions: PermissionMatrix; // Module → Action[] map
  cityId: string;               // Which city this sub-role applies to
  createdBy: string;            // Super Admin employeeId
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  // Visual
  color: string;                // hex color for badge e.g. "#8B5CF6"
  icon: string;                 // lucide icon name e.g. "UserCog"
}
 
// A per-role permission override (modifies an existing base role)
export interface RolePermissionOverride {
  overrideId: string;
  targetRole: Role;             // Which base role is being overridden
  cityId: string;
  permissions: PermissionMatrix; // Full replacement permission set for this role
  modifiedBy: string;           // Super Admin employeeId
  modifiedAt: string;
  changeLog: PermissionChangeEntry[]; // Audit trail of all changes
  isActive: boolean;
}
 
export interface PermissionChangeEntry {
  changedAt: string;
  changedBy: string;
  module: Module;
  action: Action;
  previousValue: boolean;       // was it allowed before?
  newValue: boolean;            // is it allowed now?
  reason?: string;
}
 
class RolePermissionServiceClass {
 
  // ── CUSTOM ROLES ────────────────────────────────────────
 
  getAllCustomRoles(cityId?: string): CustomRole[] {
    const all = DataService.get<CustomRole>("CUSTOM_ROLES");
    return cityId ? all.filter(r => r.cityId === cityId && r.isActive) : all.filter(r => r.isActive);
  }
 
  getCustomRole(customRoleId: string): CustomRole | null {
    return DataService.get<CustomRole>("CUSTOM_ROLES").find(r => r.customRoleId === customRoleId) || null;
  }
 
  createCustomRole(params: {
    name: string;
    parentRole: Role;
    description: string;
    permissions: PermissionMatrix;
    cityId: string;
    createdBy: string;
    color?: string;
    icon?: string;
  }): CustomRole {
    const newRole: CustomRole = {
      customRoleId: `CUSTOM-${Date.now()}`,
      name: params.name,
      displayName: params.name,
      parentRole: params.parentRole,
      description: params.description,
      permissions: params.permissions,
      cityId: params.cityId,
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      color: params.color || "#6B7280",
      icon: params.icon || "UserCog",
    };
    DataService.insert("CUSTOM_ROLES", newRole);
    logger.log(`[RolePermissionService] Custom role created: ${newRole.name}`);
    return newRole;
  }
 
  updateCustomRole(customRoleId: string, updates: Partial<CustomRole>, updatedBy: string): CustomRole | null {
    const existing = this.getCustomRole(customRoleId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    DataService.update("CUSTOM_ROLES", customRoleId, updated, "customRoleId");
    return updated;
  }
 
  deactivateCustomRole(customRoleId: string): void {
    this.updateCustomRole(customRoleId, { isActive: false }, "system");
  }
 
  // ── BASE ROLE PERMISSION OVERRIDES ──────────────────────
 
  getRoleOverride(role: Role, cityId: string): RolePermissionOverride | null {
    return DataService.get<RolePermissionOverride>("ROLE_PERMISSION_OVERRIDES")
      .find(o => o.targetRole === role && o.cityId === cityId && o.isActive) || null;
  }
 
  saveRoleOverride(params: {
    targetRole: Role;
    cityId: string;
    permissions: PermissionMatrix;
    modifiedBy: string;
    changeLog: PermissionChangeEntry[];
  }): RolePermissionOverride {
    const existing = this.getRoleOverride(params.targetRole, params.cityId);
    if (existing) {
      const updated = {
        ...existing,
        permissions: params.permissions,
        modifiedBy: params.modifiedBy,
        modifiedAt: new Date().toISOString(),
        changeLog: [...existing.changeLog, ...params.changeLog],
      };
      DataService.update("ROLE_PERMISSION_OVERRIDES", existing.overrideId, updated, "overrideId");
      return updated;
    }
    const newOverride: RolePermissionOverride = {
      overrideId: `RPO-${Date.now()}`,
      targetRole: params.targetRole,
      cityId: params.cityId,
      permissions: params.permissions,
      modifiedBy: params.modifiedBy,
      modifiedAt: new Date().toISOString(),
      changeLog: params.changeLog,
      isActive: true,
    };
    DataService.insert("ROLE_PERMISSION_OVERRIDES", newOverride);
    return newOverride;
  }
 
  resetRoleToDefault(role: Role, cityId: string): void {
    const existing = this.getRoleOverride(role, cityId);
    if (existing) {
      DataService.update("ROLE_PERMISSION_OVERRIDES", existing.overrideId,
        { ...existing, isActive: false }, "overrideId");
    }
  }
 
  // ── EFFECTIVE PERMISSIONS ────────────────────────────────
 
  // Returns the currently active permission matrix for a base role
  // (override if exists, otherwise falls back to default permissionMatrix)
  getEffectivePermissions(role: Role, cityId: string): PermissionMatrix {
    const override = this.getRoleOverride(role, cityId);
    if (override) return override.permissions;
    // Fall back to default — import and return from permissionMatrix.ts
    const { permissionMatrix } = require("../config/permissionMatrix");
    return permissionMatrix[cityId]?.[role] || {};
  }
}
 
export const rolePermissionService = new RolePermissionServiceClass();
