/**
 * Permission Management Page (MC-11)
 *
 * Admin UI for managing employee permissions:
 * - View role-based permissions by city
 * - Grant custom permissions to individual employees
 * - View permission summary for employees
 *
 * ROLE PROTECTION: Super Admin only
 */

import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { toast } from "sonner";
import type { Module, Action, PermissionMatrix } from "../../types/permissions";
import { hasPermission, getAccessibleModules, getModulePermissions } from "../../utils/permissionEngine";
import { permissionMatrix } from "../../config/permissionMatrix";
import { BackButton } from "../ui/back-button";

export function PermissionManagementPage() {
  const { currentUser } = useRole();
  const { employees, updateEmployee } = useEmployee();

  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [customPermissions, setCustomPermissions] = useState<PermissionMatrix>({});

  // Role protection
  if (!currentUser || currentUser.role !== "Super Admin") {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            Only Super Admin can manage permissions.
          </p>
        </div>
      </div>
    );
  }

  const cityEmployees = employees.filter((e) => e.cityId === currentUser.cityId);
  const employee = cityEmployees.find((e) => e.employeeId === selectedEmployee);

  const allModules: Module[] = [
    "dashboard",
    "users",
    "leads",
    "customers",
    "car-washer",
    "supervisor",
    "operations",
    "complaints",
    "inventory",
    "store",
    "procurement",
    "cloth-tracking",
    "advance",
    "finance",
    "hr",
    "leave",
    "approvals",
    "audit-trail",
    "performance",
    "analytics",
    "payroll",
    "reports",
    "accounts",
    "store-manager",
  ];

  const allActions: Action[] = ["view", "create", "edit", "delete", "approve", "export", "audit"];

  const handleGrantPermission = (module: Module, action: Action, grant: boolean) => {
    setCustomPermissions((prev) => {
      const modulePerms = prev[module] || [];
      if (grant) {
        return { ...prev, [module]: [...modulePerms, action] };
      } else {
        return { ...prev, [module]: modulePerms.filter((a) => a !== action) };
      }
    });
  };

  const handleSavePermissions = () => {
    if (!employee) {
      toast.error("No employee selected");
      return;
    }

    updateEmployee(employee.employeeId, {
      customPermissions,
      permissionGrantedBy: currentUser.employeeId,
      permissionGrantedAt: new Date().toISOString(),
      permissionReason: "Custom permissions granted by Super Admin",
    });

    toast.success("Custom permissions saved successfully");
  };

  const handleClearPermissions = () => {
    if (!employee) return;

    updateEmployee(employee.employeeId, {
      customPermissions: undefined,
      permissionGrantedBy: undefined,
      permissionGrantedAt: undefined,
      permissionReason: undefined,
    });

    setCustomPermissions({});
    toast.success("Custom permissions cleared");
  };

  // Load employee's current custom permissions when selected
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    const emp = cityEmployees.find((e) => e.employeeId === employeeId);
    if (emp?.customPermissions) {
      setCustomPermissions(emp.customPermissions);
    } else {
      setCustomPermissions({});
    }
  };

  const accessibleModules = employee
    ? getAccessibleModules({
        role: employee.role as any,
        cityId: employee.cityId,
        customPermissions: employee.customPermissions,
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <BackButton />
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Permission Management</h1>
          <p className="text-sm text-gray-600">
            Grant custom permissions to individual employees (overrides role-based permissions)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Employee Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Select Employee</h2>
            <div className="space-y-2">
              {cityEmployees.map((emp) => (
                <button
                  key={emp.employeeId}
                  onClick={() => handleEmployeeSelect(emp.employeeId)}
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedEmployee === emp.employeeId
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                  <div className="text-xs text-gray-600">{emp.role}</div>
                  {emp.customPermissions && (
                    <div className="text-xs text-blue-600 mt-1">Has custom permissions</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Permission Grid */}
          <div className="col-span-2 bg-white rounded-lg shadow p-6">
            {!employee ? (
              <div className="text-center py-12 text-gray-500">
                Select an employee to manage permissions
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {employee.firstName} {employee.lastName}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Role: {employee.role} | City: {employee.cityId}
                    </p>
                    {employee.customPermissions && (
                      <p className="text-xs text-blue-600 mt-1">
                        Granted by {employee.permissionGrantedBy} on{" "}
                        {new Date(employee.permissionGrantedAt!).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearPermissions}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleSavePermissions}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save Permissions
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Module</th>
                        {allActions.map((action) => (
                          <th key={action} className="px-2 py-2 text-center font-medium text-gray-700 text-xs">
                            {action}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {allModules.map((module) => {
                        const rolePerms = getModulePermissions(
                          {
                            role: employee.role as any,
                            cityId: employee.cityId,
                          },
                          module
                        );
                        const customPerms = customPermissions[module] || [];

                        return (
                          <tr key={module} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-900">{module}</td>
                            {allActions.map((action) => {
                              const hasRolePerm = rolePerms.includes(action);
                              const hasCustomPerm = customPerms.includes(action);

                              return (
                                <td key={action} className="px-2 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={hasCustomPerm}
                                    onChange={(e) =>
                                      handleGrantPermission(module, action, e.target.checked)
                                    }
                                    className={`${
                                      hasRolePerm ? "accent-green-600" : "accent-blue-600"
                                    }`}
                                    title={
                                      hasRolePerm
                                        ? "Granted by role"
                                        : hasCustomPerm
                                        ? "Custom permission"
                                        : "No permission"
                                    }
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-xs text-gray-600">
                  <p>
                    <span className="inline-block w-3 h-3 bg-green-600 rounded mr-1"></span>
                    Green = Permission from role
                  </p>
                  <p>
                    <span className="inline-block w-3 h-3 bg-blue-600 rounded mr-1"></span>
                    Blue = Custom permission override
                  </p>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Accessible Modules</h3>
                  <div className="flex flex-wrap gap-2">
                    {accessibleModules.map((module) => (
                      <span
                        key={module}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                      >
                        {module}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
