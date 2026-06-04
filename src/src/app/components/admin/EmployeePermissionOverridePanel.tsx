/**
 * Employee Permission Override Panel
 *
 * Super Admin interface for managing individual employee permissions.
 * Allows assigning custom sub-roles and adding specific permission overrides.
 */

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Info, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { PermissionMatrixEditor } from "./PermissionMatrixEditor";
import { useEmployee, useCustomRoles } from "../../contexts/AppProvider";
import { useCity } from "../../contexts/CityContext";
import type { Role } from "../../lib/roleConfig";
import type { PermissionMatrix, Module, Action } from "../../types/permissions";
import type { Employee } from "../../contexts/EmployeeContext";
import { logger } from "../../services/logger";

interface EmployeePermissionOverridePanelProps {
  employeeId: string;
  employeeName: string;
  currentRole: Role;
  onClose: () => void;
}

export function EmployeePermissionOverridePanel({
  employeeId,
  employeeName,
  currentRole,
  onClose,
}: EmployeePermissionOverridePanelProps) {
  const { city } = useCity();
  const { employees, updateEmployee } = useEmployee();
  const { customRoles, getCustomRolesForParent, getRoleEffectivePermissions } = useCustomRoles();

  const employee = employees.find((e) => e.id === employeeId);

  const [overridesExpanded, setOverridesExpanded] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [pendingOverrides, setPendingOverrides] = useState<PermissionMatrix>({});
  const [overrideReason, setOverrideReason] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const availableSubRoles = getCustomRolesForParent(currentRole);
  const assignedSubRoleId = (employee as any)?.subRoleId;
  const assignedSubRole = assignedSubRoleId
    ? customRoles.find((r) => r.customRoleId === assignedSubRoleId)
    : null;

  // Load current employee custom permissions
  useEffect(() => {
    if (employee?.customPermissions) {
      setPendingOverrides(employee.customPermissions);
    }
  }, [employee]);

  const handleAssignSubRole = (subRoleId: string) => {
    const subRole = customRoles.find((r) => r.customRoleId === subRoleId);
    if (!subRole || !employee) return;

    updateEmployee(employeeId, {
      customPermissions: subRole.permissions,
      subRoleId: subRoleId,
    } as Partial<Employee>);

    toast.success(`Assigned sub-role '${subRole.name}' to ${employeeName}`);
  };

  const handleRemoveSubRole = () => {
    if (!employee || !assignedSubRole) return;

    updateEmployee(employeeId, {
      customPermissions: undefined,
      subRoleId: undefined,
    } as Partial<Employee>);

    setPendingOverrides({});
    toast.success(`Removed sub-role '${assignedSubRole.name}' from ${employeeName}`);
  };

  const handlePermissionToggle = (module: Module, action: Action, granted: boolean) => {
    setPendingOverrides((prev) => {
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
    setHasUnsavedChanges(true);
  };

  const handleSaveOverrides = () => {
    if (!employee) return;

    if (hasUnsavedChanges && !overrideReason.trim()) {
      toast.error("Please provide a reason for the permission override");
      return;
    }

    const updates: Partial<Employee> = {
      customPermissions: pendingOverrides,
    };

    if (expiryDate) {
      (updates as any).permissionExpiresAt = expiryDate;
    }

    updateEmployee(employeeId, updates);

    // TODO: Log to audit trail via auditLogService
    logger.log("[Audit] Permission override saved", {
      employeeId,
      employeeName,
      reason: overrideReason,
      expiresAt: expiryDate || null,
      permissions: pendingOverrides,
      modifiedBy: "super-admin",
      modifiedAt: new Date().toISOString(),
    });

    toast.success(`Permission overrides saved for ${employeeName}`);
    setHasUnsavedChanges(false);
    setOverrideReason("");
    setExpiryDate("");
  };

  const handleClearOverrides = () => {
    if (!employee) return;

    if (
      window.confirm(
        `Clear all permission overrides for ${employeeName}?\n\nThis will restore their standard role permissions.`
      )
    ) {
      updateEmployee(employeeId, {
        customPermissions: undefined,
        subRoleId: undefined,
      } as Partial<Employee>);

      setPendingOverrides({});
      setHasUnsavedChanges(false);
      toast.success("All permission overrides cleared");
    }
  };

  const getEffectivePermissions = (): PermissionMatrix => {
    if (!employee) return {};

    // Layer 1: Base role permissions
    const basePerms = getRoleEffectivePermissions(currentRole);

    // Layer 2: Sub-role permissions (if assigned)
    if (assignedSubRole) {
      return assignedSubRole.permissions;
    }

    // Layer 3: Individual overrides
    if (employee.customPermissions) {
      return employee.customPermissions;
    }

    return basePerms;
  };

  const countModules = (perms: PermissionMatrix): number => {
    return Object.keys(perms).filter((m) => perms[m as Module]?.length > 0).length;
  };

  const countActions = (perms: PermissionMatrix): number => {
    return Object.values(perms).reduce((sum, actions) => sum + (actions?.length || 0), 0);
  };

  if (!employee) {
    return (
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent className="w-full sm:w-[600px] max-w-[90vw]">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="text-gray-600">Employee not found</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const defaultPermissions = getRoleEffectivePermissions(currentRole);
  const effectivePermissions = getEffectivePermissions();

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[600px] max-w-[90vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Permissions: {employeeName}</SheetTitle>
          <SheetDescription>
            Current role: <span className="font-semibold">{currentRole}</span> · {city}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* SECTION 1: Assign Custom Sub-Role */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Assign Sub-Role</h3>
              <div className="group relative">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Sub-roles are custom permission sets. When assigned, the sub-role permissions
                  replace this employee's standard role permissions.
                </div>
              </div>
            </div>

            {availableSubRoles.length > 0 ? (
              <div className="space-y-2">
                {availableSubRoles.map((subRole) => {
                  const isAssigned = assignedSubRoleId === subRole.customRoleId;

                  return (
                    <div
                      key={subRole.customRoleId}
                      className={`p-3 rounded-lg border transition-all ${
                        isAssigned
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: subRole.color }}
                            />
                            <span className="font-semibold text-sm text-gray-900">
                              {subRole.name}
                            </span>
                            {isAssigned && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                Currently Assigned
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{subRole.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {countModules(subRole.permissions)} modules ·{" "}
                            {countActions(subRole.permissions)} permissions
                          </p>
                        </div>
                        <div className="ml-3">
                          {isAssigned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveSubRole}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignSubRole(subRole.customRoleId)}
                            >
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  No custom sub-roles defined for {currentRole} yet.
                </p>
                <a
                  href="/admin/role-permissions"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create Sub-Role →
                </a>
              </div>
            )}
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* SECTION 2: Individual Permission Overrides */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="border-t pt-6">
            <button
              onClick={() => setOverridesExpanded(!overridesExpanded)}
              className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity"
            >
              <h3 className="text-sm font-semibold text-gray-900">Individual Overrides</h3>
              {overridesExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            <p className="text-xs text-gray-600 mb-4">
              Grant or restrict specific permissions for this employee only. These override the
              role and sub-role permissions.
            </p>

            {overridesExpanded && (
              <div className="space-y-4">
                <PermissionMatrixEditor
                  role={currentRole}
                  roleName={employeeName}
                  currentPermissions={pendingOverrides}
                  defaultPermissions={defaultPermissions}
                  onChange={handlePermissionToggle}
                  showDiff={true}
                />

                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <Label htmlFor="override-reason">Reason for override *</Label>
                    <Textarea
                      id="override-reason"
                      rows={2}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Temporary access for project X"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expiry-date">Expiry date (optional)</Label>
                    <Input
                      id="expiry-date"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for permanent override
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveOverrides}
                      disabled={!hasUnsavedChanges}
                      className="flex-1"
                    >
                      Save Overrides
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleClearOverrides}
                      disabled={!employee.customPermissions && !assignedSubRoleId}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* SECTION 3: Permission Preview */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="border-t pt-6">
            <button
              onClick={() => setPreviewExpanded(!previewExpanded)}
              className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity"
            >
              <h3 className="text-sm font-semibold text-gray-900">Final Effective Permissions</h3>
              {previewExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            <p className="text-xs text-gray-600 mb-4">
              Preview of actual permissions after all layers (role + sub-role + overrides)
            </p>

            {previewExpanded && (
              <div className="space-y-2">
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>
                      <span className="font-semibold">Modules:</span>{" "}
                      {countModules(effectivePermissions)}
                    </div>
                    <div>
                      <span className="font-semibold">Total Actions:</span>{" "}
                      {countActions(effectivePermissions)}
                    </div>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-1 border rounded-lg p-2">
                  {Object.entries(effectivePermissions)
                    .filter(([_, actions]) => actions && actions.length > 0)
                    .map(([module, actions]) => (
                      <div
                        key={module}
                        className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200"
                      >
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {module.replace(/-/g, " ")}
                        </span>
                        <div className="flex gap-1">
                          {actions.map((action) => (
                            <span
                              key={action}
                              className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}

                  {Object.keys(effectivePermissions).length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No permissions granted
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
