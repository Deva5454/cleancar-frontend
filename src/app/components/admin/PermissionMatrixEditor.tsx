/**
 * Permission Matrix Editor
 *
 * Visual grid editor for role permissions.
 * Displays modules × actions matrix with toggle controls.
 * Supports diff mode to highlight changes from default permissions.
 */

import React from "react";
import { CheckSquare, Square } from "lucide-react";
import type { Role } from "../../lib/roleConfig";
import type { Module, Action, PermissionMatrix } from "../../types/permissions";

interface PermissionMatrixEditorProps {
  role: Role;
  roleName: string;
  currentPermissions: PermissionMatrix;
  defaultPermissions: PermissionMatrix;
  onChange: (module: Module, action: Action, granted: boolean) => void;
  readOnly?: boolean;
  showDiff?: boolean;
}

const ALL_MODULES: { key: Module; label: string; category: string }[] = [
  { key: "dashboard",    label: "Dashboard",        category: "Core" },
  { key: "analytics",    label: "Analytics",        category: "Core" },
  { key: "reports",      label: "Reports",          category: "Core" },
  { key: "users",        label: "User Management",  category: "Admin" },
  { key: "approvals",    label: "Approvals",        category: "Admin" },
  { key: "audit-trail",  label: "Audit Trail",      category: "Admin" },
  { key: "hr",           label: "HR Module",        category: "HR & Payroll" },
  { key: "payroll",      label: "Payroll",          category: "HR & Payroll" },
  { key: "leave",        label: "Leave Management", category: "HR & Payroll" },
  { key: "advance",      label: "Advance Mgmt",     category: "HR & Payroll" },
  { key: "performance",  label: "Performance",      category: "HR & Payroll" },
  { key: "leads",        label: "Leads",            category: "Sales" },
  { key: "customers",    label: "Customers",        category: "Sales" },
  { key: "complaints",   label: "Complaints",       category: "Sales" },
  { key: "finance",      label: "Finance",          category: "Finance" },
  { key: "accounts",     label: "Accounts",         category: "Finance" },
  { key: "inventory",    label: "Inventory",        category: "Operations" },
  { key: "store",        label: "Store",            category: "Operations" },
  { key: "procurement",  label: "Procurement",      category: "Operations" },
  { key: "cloth-tracking", label: "Cloth Tracking", category: "Operations" },
  { key: "car-washer",   label: "Washer App",       category: "Field" },
  { key: "supervisor",   label: "Supervisor App",   category: "Field" },
  { key: "operations",   label: "Operations",       category: "Field" },
];

const ALL_ACTIONS: { key: Action; label: string }[] = [
  { key: "view",   label: "View" },
  { key: "create", label: "Create" },
  { key: "edit",   label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "approve",label: "Approve" },
  { key: "export", label: "Export" },
  { key: "audit",  label: "Audit" },
];

export function PermissionMatrixEditor({
  role,
  roleName,
  currentPermissions,
  defaultPermissions,
  onChange,
  readOnly = false,
  showDiff = false,
}: PermissionMatrixEditorProps) {
  const hasPermission = (module: Module, action: Action): boolean => {
    return currentPermissions[module]?.includes(action) ?? false;
  };

  const isModified = (module: Module, action: Action): boolean => {
    if (!showDiff) return false;
    const current = hasPermission(module, action);
    const defaultVal = defaultPermissions[module]?.includes(action) ?? false;
    return current !== defaultVal;
  };

  const handleToggle = (module: Module, action: Action) => {
    if (readOnly) return;
    const current = hasPermission(module, action);
    onChange(module, action, !current);
  };

  // Calculate summary stats
  const accessibleModules = Object.keys(currentPermissions).filter(
    (module) => currentPermissions[module as Module]?.length > 0
  ).length;

  const totalActions = Object.values(currentPermissions).reduce(
    (sum, actions) => sum + (actions?.length || 0),
    0
  );

  // Group modules by category
  const categories = Array.from(new Set(ALL_MODULES.map((m) => m.category)));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="sticky left-0 z-20 bg-gray-50 px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b border-r border-gray-200 w-[200px]">
                  Module
                </th>
                {ALL_ACTIONS.map((action) => (
                  <th
                    key={action.key}
                    className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b border-gray-200 w-[80px]"
                  >
                    {action.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const categoryModules = ALL_MODULES.filter((m) => m.category === category);

                return (
                  <React.Fragment key={category}>
                    {/* Category Header */}
                    <tr className="bg-gray-100">
                      <td
                        colSpan={ALL_ACTIONS.length + 1}
                        className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {category}
                      </td>
                    </tr>

                    {/* Module Rows */}
                    {categoryModules.map((module) => (
                      <tr
                        key={module.key}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="sticky left-0 z-10 bg-white px-4 py-2 text-xs text-gray-900 border-b border-r border-gray-200">
                          {module.label}
                        </td>
                        {ALL_ACTIONS.map((action) => {
                          const granted = hasPermission(module.key, action.key);
                          const modified = isModified(module.key, action.key);

                          return (
                            <td
                              key={action.key}
                              className={`px-2 py-2 text-center border-b border-gray-200 ${
                                modified ? "bg-amber-50 ring-1 ring-amber-300" : ""
                              }`}
                            >
                              <button
                                onClick={() => handleToggle(module.key, action.key)}
                                disabled={readOnly}
                                className={`inline-flex items-center justify-center transition-colors ${
                                  readOnly ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-70"
                                }`}
                                title={`${granted ? "Revoke" : "Grant"} ${action.label} permission for ${module.label}`}
                              >
                                {granted ? (
                                  <CheckSquare className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Square className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                              {modified && (
                                <div className="mt-0.5">
                                  <span className="inline-block px-1 py-0.5 text-[9px] font-medium text-amber-700 bg-amber-100 rounded">
                                    Modified
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>
            <span className="font-semibold text-gray-900">{accessibleModules}</span> modules accessible
          </span>
          <span className="text-gray-300">·</span>
          <span>
            <span className="font-semibold text-gray-900">{totalActions}</span> actions granted
          </span>
        </div>
        {showDiff && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-50 ring-1 ring-amber-300 rounded" />
            <span className="text-xs text-gray-600">Modified from default</span>
          </div>
        )}
      </div>
    </div>
  );
}
