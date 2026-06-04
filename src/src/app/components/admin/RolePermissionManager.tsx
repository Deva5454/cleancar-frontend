/**
 * Role Permission Manager
 *
 * Super Admin interface for managing role permissions.
 * Two modes:
 * 1. Base Role Overrides - Edit permissions for existing system roles
 * 2. Custom Sub-Roles - Create and manage custom role variations
 */

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Plus, Trash2, Edit, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import { PermissionMatrixEditor } from "./PermissionMatrixEditor";
import { useCustomRoles } from "../../contexts/AppProvider";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import type { Role } from "../../lib/roleConfig";
import type { PermissionMatrix, Module, Action } from "../../types/permissions";
import { permissionMatrix } from "../../config/permissionMatrix";
import type { CustomRole, PermissionChangeEntry } from "../../services/rolePermissionService";

const BASE_ROLES: Role[] = [
  "Admin",
  "HR",
  "Payroll Manager",
  "Cluster Manager",
  "Operations Manager",
  "Store Manager",
  "Finance Manager",
  "Inventory Manager",
  "Sales Manager",
  "Customer Care Manager",
  "Customer Care Executive",
  "Tele Sales Executive",
  "Car Washer",
  "Supervisor",
  "Accountant",
  "Marketing Agency",
];

const COLOR_OPTIONS = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#6B7280", label: "Gray" },
];

const ICON_OPTIONS = [
  "UserCog", "Shield", "Award", "Briefcase", "Users", "Star", "Zap", "Crown"
];

export function RolePermissionManager() {
  const { currentRole } = useRole();
  const { city } = useCity();
  const {
    customRoles,
    getRoleEffectivePermissions,
    saveRolePermissions,
    resetRoleToDefault,
    hasRoleOverride,
    createCustomRole,
    updateCustomRole,
    deactivateCustomRole,
    getCustomRolesForParent,
  } = useCustomRoles();

  // Tab 1: Base Role Editor State
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<PermissionMatrix>({});
  const [defaultPermissions, setDefaultPermissions] = useState<PermissionMatrix>({});
  const [changeLogs, setChangeLogs] = useState<PermissionChangeEntry[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Tab 2: Custom Role Manager State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCustomRole, setEditingCustomRole] = useState<CustomRole | null>(null);
  const [customRoleForm, setCustomRoleForm] = useState({
    name: "",
    parentRole: "" as Role,
    description: "",
    color: "#3B82F6",
    icon: "UserCog",
    permissions: {} as PermissionMatrix,
  });

  // Load role permissions when selection changes
  useEffect(() => {
    if (selectedRole) {
      const effective = getRoleEffectivePermissions(selectedRole);
      const systemDefault = permissionMatrix[city]?.[selectedRole] || {};
      setEditingPermissions(effective);
      setDefaultPermissions(systemDefault);
      setChangeLogs([]);
      setHasUnsavedChanges(false);
    }
  }, [selectedRole, city, getRoleEffectivePermissions]);

  const handlePermissionToggle = (module: Module, action: Action, granted: boolean) => {
    setEditingPermissions((prev) => {
      const updated = { ...prev };
      if (!updated[module]) {
        updated[module] = [];
      }
      if (granted) {
        if (!updated[module].includes(action)) {
          updated[module] = [...updated[module], action];
        }
      } else {
        updated[module] = updated[module].filter((a) => a !== action);
      }
      return updated;
    });

    const previousValue = editingPermissions[module]?.includes(action) ?? false;
    setChangeLogs((prev) => [
      ...prev,
      {
        changedAt: new Date().toISOString(),
        changedBy: "super-admin",
        module,
        action,
        previousValue,
        newValue: granted,
      },
    ]);

    setHasUnsavedChanges(true);
  };

  const handleSaveRolePermissions = () => {
    if (!selectedRole) return;
    saveRolePermissions(selectedRole, editingPermissions, changeLogs);
    toast.success(`Permissions updated for ${selectedRole}`);
    setHasUnsavedChanges(false);
    setChangeLogs([]);
  };

  const handleResetRole = () => {
    if (!selectedRole) return;
    if (window.confirm(
      `Reset Role Permissions\n\nThis will restore all permissions for ${selectedRole} to the system default. Any custom overrides will be permanently removed.\n\nContinue?`
    )) {
      resetRoleToDefault(selectedRole);
      const systemDefault = permissionMatrix[city]?.[selectedRole] || {};
      setEditingPermissions(systemDefault);
      setHasUnsavedChanges(false);
      setChangeLogs([]);
      toast.success("Reset to system defaults");
    }
  };

  const handleDiscardChanges = () => {
    if (selectedRole) {
      const effective = getRoleEffectivePermissions(selectedRole);
      setEditingPermissions(effective);
      setChangeLogs([]);
      setHasUnsavedChanges(false);
    }
  };

  const handleLoadParentDefaults = () => {
    if (customRoleForm.parentRole) {
      const parentPerms = getRoleEffectivePermissions(customRoleForm.parentRole);
      setCustomRoleForm((prev) => ({ ...prev, permissions: parentPerms }));
      toast.success(`Loaded permissions from ${customRoleForm.parentRole}`);
    }
  };

  const handleCustomRolePermissionChange = (module: Module, action: Action, granted: boolean) => {
    setCustomRoleForm((prev) => {
      const updated = { ...prev.permissions };
      if (!updated[module]) {
        updated[module] = [];
      }
      if (granted) {
        if (!updated[module].includes(action)) {
          updated[module] = [...updated[module], action];
        }
      } else {
        updated[module] = updated[module].filter((a) => a !== action);
      }
      return { ...prev, permissions: updated };
    });
  };

  const handleSaveCustomRole = () => {
    if (!customRoleForm.name || !customRoleForm.parentRole) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingCustomRole) {
      updateCustomRole(editingCustomRole.customRoleId, {
        name: customRoleForm.name,
        displayName: customRoleForm.name,
        description: customRoleForm.description,
        permissions: customRoleForm.permissions,
        color: customRoleForm.color,
        icon: customRoleForm.icon,
      });
      toast.success(`Sub-role '${customRoleForm.name}' updated`);
    } else {
      createCustomRole({
        name: customRoleForm.name,
        parentRole: customRoleForm.parentRole,
        description: customRoleForm.description,
        permissions: customRoleForm.permissions,
        cityId: city,
        createdBy: "super-admin",
        color: customRoleForm.color,
        icon: customRoleForm.icon,
      });
      toast.success(`Sub-role '${customRoleForm.name}' created`);
    }

    setSheetOpen(false);
    resetCustomRoleForm();
  };

  const handleEditCustomRole = (role: CustomRole) => {
    setEditingCustomRole(role);
    setCustomRoleForm({
      name: role.name,
      parentRole: role.parentRole,
      description: role.description,
      color: role.color,
      icon: role.icon,
      permissions: role.permissions,
    });
    setSheetOpen(true);
  };

  const handleDeleteCustomRole = (role: CustomRole) => {
    if (window.confirm(`Delete custom role '${role.name}'?\n\nThis action cannot be undone.`)) {
      deactivateCustomRole(role.customRoleId);
      toast.success(`Deleted '${role.name}'`);
    }
  };

  const resetCustomRoleForm = () => {
    setEditingCustomRole(null);
    setCustomRoleForm({
      name: "",
      parentRole: "" as Role,
      description: "",
      color: "#3B82F6",
      icon: "UserCog",
      permissions: {},
    });
  };

  const countModules = (perms: PermissionMatrix): number => {
    return Object.keys(perms).filter((m) => perms[m as Module]?.length > 0).length;
  };

  const countActions = (perms: PermissionMatrix): number => {
    return Object.values(perms).reduce((sum, actions) => sum + (actions?.length || 0), 0);
  };

  // Restrict to Super Admin only
  if (currentRole !== "Super Admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Access restricted to Super Admin only.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Role Permission Manager</h1>
        <p className="text-sm text-gray-600 mt-1">
          Edit base role permissions or create custom sub-roles with specific access levels
        </p>
      </div>

      <Tabs defaultValue="base-roles" className="w-full">
        <TabsList>
          <TabsTrigger value="base-roles">Base Roles</TabsTrigger>
          <TabsTrigger value="custom-roles">Custom Sub-Roles</TabsTrigger>
        </TabsList>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 1: Base Role Editor */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <TabsContent value="base-roles" className="mt-6">
          <div className="flex gap-6">
            {/* Left Panel: Role List */}
            <div className="w-[300px] flex-shrink-0 space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
              {BASE_ROLES.map((role) => {
                const isOverridden = hasRoleOverride(role);
                const isSelected = selectedRole === role;
                const moduleCount = countModules(permissionMatrix[city]?.[role] || {});

                return (
                  <div
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{role}</div>
                        <div className="text-xs text-gray-500 mt-1">{moduleCount} modules</div>
                      </div>
                      {isOverridden && (
                        <div className="w-2 h-2 rounded-full bg-amber-500" title="Custom override active" />
                      )}
                    </div>
                    {isOverridden && isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetRole();
                        }}
                        className="mt-2 w-full text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Panel: Permission Editor */}
            <div className="flex-1">
              {selectedRole ? (
                <div className="space-y-4">
                  {/* Header Bar */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h2 className="text-xl font-bold text-gray-900">{selectedRole}</h2>
                        {hasRoleOverride(selectedRole) && (
                          <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                            Custom Override Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasUnsavedChanges && (
                          <Button variant="ghost" size="sm" onClick={handleDiscardChanges}>
                            Discard
                          </Button>
                        )}
                        {hasRoleOverride(selectedRole) && (
                          <Button variant="destructive" size="sm" onClick={handleResetRole}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset to System Default
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={handleSaveRolePermissions}
                          disabled={!hasUnsavedChanges}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>

                    {/* Permission Matrix */}
                    <PermissionMatrixEditor
                      role={selectedRole}
                      roleName={selectedRole}
                      currentPermissions={editingPermissions}
                      defaultPermissions={defaultPermissions}
                      onChange={handlePermissionToggle}
                      showDiff={true}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Select a role to edit permissions</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 2: Custom Sub-Roles */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <TabsContent value="custom-roles" className="mt-6">
          <div className="space-y-4">
            {/* Create Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  resetCustomRoleForm();
                  setSheetOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Sub-Role
              </Button>
            </div>

            {/* Custom Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customRoles.map((role) => (
                <div
                  key={role.customRoleId}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        Based on: {role.parentRole}
                      </span>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: role.color }}
                    />
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{role.description}</p>

                  <div className="space-y-1 mb-4">
                    <div className="text-xs text-gray-500">
                      {countModules(role.permissions)} of 27 modules
                    </div>
                    <div className="text-xs text-gray-500">
                      {countActions(role.permissions)} permissions
                    </div>
                    <div className="text-xs text-gray-500">City: {role.cityId}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCustomRole(role)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCustomRole(role)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {customRoles.length === 0 && (
                <div className="col-span-full flex items-center justify-center h-[300px] bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No custom sub-roles created yet</p>
                    <p className="text-xs text-gray-500 mt-1">Click "Create New Sub-Role" to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Custom Role Creation/Edit Sheet */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:w-[700px] max-w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingCustomRole ? `Edit: ${editingCustomRole.name}` : "Create Custom Sub-Role"}
            </SheetTitle>
            <SheetDescription>
              Define a custom role with specific permission grants
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">Sub-Role Name *</Label>
                <Input
                  id="role-name"
                  value={customRoleForm.name}
                  onChange={(e) => setCustomRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. HR Executive"
                />
              </div>

              <div>
                <Label htmlFor="parent-role">Parent Role *</Label>
                <Select
                  value={customRoleForm.parentRole}
                  onValueChange={(value) =>
                    setCustomRoleForm((prev) => ({ ...prev, parentRole: value as Role }))
                  }
                  disabled={!!editingCustomRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select base role" />
                  </SelectTrigger>
                  <SelectContent>
                    {BASE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={2}
                  value={customRoleForm.description}
                  onChange={(e) =>
                    setCustomRoleForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="e.g. Junior HR with limited payroll access"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setCustomRoleForm((prev) => ({ ...prev, color: color.value }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          customRoleForm.color === color.value
                            ? "border-gray-900 scale-110"
                            : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex-1">
                  <Label>Icon</Label>
                  <Select
                    value={customRoleForm.icon}
                    onValueChange={(value) => setCustomRoleForm((prev) => ({ ...prev, icon: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleLoadParentDefaults}
                disabled={!customRoleForm.parentRole}
                className="w-full"
              >
                Load Parent Defaults
              </Button>
            </div>

            {/* Permission Matrix */}
            <div>
              <Label className="mb-3 block">Permissions</Label>
              <PermissionMatrixEditor
                role={customRoleForm.parentRole || "Admin"}
                roleName={customRoleForm.name || "Custom Role"}
                currentPermissions={customRoleForm.permissions}
                defaultPermissions={{}}
                onChange={handleCustomRolePermissionChange}
                showDiff={false}
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setSheetOpen(false);
                  resetCustomRoleForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveCustomRole} className="flex-1 bg-green-600 hover:bg-green-700">
                Save Sub-Role
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
