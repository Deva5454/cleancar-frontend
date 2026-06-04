/**
 * Shift Management Page (MC-10)
 *
 * Admin UI for creating and managing work shifts:
 * - City-scoped shift templates
 * - Configure shift timing, grace period, overtime thresholds
 * - Assign shifts to employees
 *
 * ROLE PROTECTION: Super Admin / Admin only
 */

import { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useShift } from "../../contexts/ShiftContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { toast } from "sonner";
import type { Shift } from "../../types/hr-types";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { BackButton } from "../ui/back-button";

export function ShiftManagementPage() {
  const { currentUser } = useRole();
  const { shifts, addShift, updateShift, deleteShift, getShiftsByCity } = useShift();
  const { employees, updateEmployee } = useEmployee();

  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    startTime: "09:00",
    endTime: "18:00",
    graceMinutes: 15,
    overtimeThresholdMinutes: 30,
  });

  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // Role protection
  if (!currentUser || !["Super Admin", "Admin"].includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">Only Super Admin and Admin can manage shifts.</p>
        </div>
      </div>
    );
  }

  const cityShifts = getShiftsByCity(currentUser.cityId);

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Shift name is required");
      return;
    }

    if (formData.graceMinutes < 0) {
      toast.error("Grace minutes cannot be negative");
      return;
    }

    if (formData.overtimeThresholdMinutes < 0) {
      toast.error("Overtime threshold cannot be negative");
      return;
    }

    addShift({
      name: formData.name,
      cityId: currentUser.cityId,
      startTime: formData.startTime,
      endTime: formData.endTime,
      graceMinutes: formData.graceMinutes,
      overtimeThresholdMinutes: formData.overtimeThresholdMinutes,
      isActive: true,
    });

    toast.success("Shift created successfully");
    setFormData({
      name: "",
      startTime: "09:00",
      endTime: "18:00",
      graceMinutes: 15,
      overtimeThresholdMinutes: 30,
    });
    setIsCreating(false);
  };

  const handleUpdate = () => {
    if (!editingShift) return;

    updateShift(editingShift.id, {
      name: formData.name,
      startTime: formData.startTime,
      endTime: formData.endTime,
      graceMinutes: formData.graceMinutes,
      overtimeThresholdMinutes: formData.overtimeThresholdMinutes,
    });

    toast.success("Shift updated successfully");
    setEditingShift(null);
  };

  const handleDelete = (shiftId: string) => {
    const employeesWithShift = employees.filter((e) => e.shiftId === shiftId);
    if (employeesWithShift.length > 0) {
      toast.error(
        `Cannot delete shift: ${employeesWithShift.length} employee(s) still assigned`
      );
      return;
    }

    setConfirmState({
      open: true,
      title: "Delete Shift",
      description: "Are you sure you want to delete this shift?",
      onConfirm: () => {
        deleteShift(shiftId);
        toast.success("Shift deleted successfully");
        setConfirmState(s => ({ ...s, open: false }));
      }
    });
  };

  const handleToggleActive = (shift: Shift) => {
    updateShift(shift.id, { isActive: !shift.isActive });
    toast.success(`Shift ${shift.isActive ? "deactivated" : "activated"}`);
  };

  const startEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      graceMinutes: shift.graceMinutes,
      overtimeThresholdMinutes: shift.overtimeThresholdMinutes,
    });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingShift(null);
    setIsCreating(false);
    setFormData({
      name: "",
      startTime: "09:00",
      endTime: "18:00",
      graceMinutes: 15,
      overtimeThresholdMinutes: 30,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <BackButton />
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage work shifts for {currentUser.cityId}
              </p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Create Shift
            </button>
          </div>

          {/* Create/Edit Form */}
          {(isCreating || editingShift) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingShift ? "Edit Shift" : "Create New Shift"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Morning Shift"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grace Period (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.graceMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, graceMinutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Late tolerance before marking as "Late"
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overtime Threshold (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.overtimeThresholdMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        overtimeThresholdMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minutes after shift before OT kicks in
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={editingShift ? handleUpdate : handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingShift ? "Update Shift" : "Create Shift"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Shifts List */}
          <div className="space-y-4">
            {cityShifts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No shifts configured yet. Create your first shift to get started.
              </div>
            ) : (
              cityShifts.map((shift) => {
                const assignedCount = employees.filter((e) => e.shiftId === shift.id).length;

                return (
                  <div
                    key={shift.id}
                    className={`border rounded-lg p-4 ${
                      shift.isActive ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{shift.name}</h3>
                          {!shift.isActive && (
                            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Timing:</span>
                            <span className="ml-2 font-medium">
                              {shift.startTime} - {shift.endTime}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Grace Period:</span>
                            <span className="ml-2 font-medium">{shift.graceMinutes} min</span>
                          </div>
                          <div>
                            <span className="text-gray-600">OT Threshold:</span>
                            <span className="ml-2 font-medium">
                              {shift.overtimeThresholdMinutes} min
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Assigned Employees:</span>
                            <span className="ml-2 font-medium">{assignedCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleToggleActive(shift)}
                          className={`px-3 py-1 text-sm rounded ${
                            shift.isActive
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {shift.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => startEdit(shift)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(shift.id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                          disabled={assignedCount > 0}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
        variant="destructive"
      />
    </div>
  );
}
