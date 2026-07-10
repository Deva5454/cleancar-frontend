import { BackButton } from "../ui/back-button";
/**
 * Admin Tool: Attendance Data Manager
 * Allows seeding, viewing, and clearing dummy attendance data
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Database,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Users,
  Clock,
  ShieldAlert,
  Download,
  Eye,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  seedMarchAttendanceData,
  clearAllAttendanceData,
  getDataSummary,
  type EmployeeAttendanceRecord,
} from "../../services/seedAttendanceData";
import { ATTENDANCE_TYPE_LABELS, ATTENDANCE_TYPE_COLORS } from "../../constants/payrollConstants";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { AttendanceDetailModal } from "./AttendanceDetailModal";
import { AttendanceMusterRollModal } from "./AttendanceMusterRollModal";
import { buildAttendanceExcelBlob } from "../../utils/attendanceExcelBuilder";
import { useRole } from "../../contexts/RoleContext";

export function AttendanceDataManager() {
  const { currentRole } = useRole();
  const canSend = currentRole === "HR" || currentRole === "Super Admin";
  const [seededData, setSeededData] = useState<EmployeeAttendanceRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<EmployeeAttendanceRecord | null>(null);
  const [showMusterRoll, setShowMusterRoll] = useState(false);
  const [sendingEmployeeId, setSendingEmployeeId] = useState<string | null>(null);
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);

  const canShareFiles = typeof navigator !== "undefined" && !!navigator.share && !!navigator.canShare;

  const handleSendEmployee = async (emp: EmployeeAttendanceRecord) => {
    if (!canSend) { toast.error("Only HR or Super Admin can send attendance reports"); return; }
    setSendingEmployeeId(emp.employeeId);
    try {
      const { blob, filename } = await buildAttendanceExcelBlob(emp);
      const file = new File([blob], filename, { type: blob.type });

      if (canShareFiles && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Attendance Report — ${emp.employeeName}`,
          text: `Attendance & salary report for ${emp.employeeName} (${emp.empCode})`,
        });
        toast.success(`Share sheet opened for ${emp.employeeName} — pick WhatsApp, Email, or any app`);
      } else {
        // No file-sharing support on this browser/device — fall back to a
        // plain download so the file is at least obtained, rather than
        // silently failing or faking a "sent" state.
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
        toast.warning(`This browser can't share files directly — downloaded "${filename}" instead. Attach it manually to WhatsApp/Email.`);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") { // user closing the share sheet isn't an error
        toast.error(`Couldn't prepare report for ${emp.employeeName}: ${err.message}`);
      }
    } finally {
      setSendingEmployeeId(null);
    }
  };

  const handleToggleBulkSelect = (employeeId: string) => {
    setSelectedForBulk((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) next.delete(employeeId); else next.add(employeeId);
      return next;
    });
  };

  const handleBulkSend = async () => {
    if (!canSend) { toast.error("Only HR or Super Admin can send attendance reports"); return; }
    const targets = seededData.filter((e) => selectedForBulk.has(e.employeeId));
    if (targets.length === 0) { toast.error("Select at least one employee first"); return; }
    setBulkSending(true);
    for (const emp of targets) {
      // Sequential and awaited — each share sheet only ever contains that
      // one employee's own file, so there's no risk of cross-delivery even
      // when sending to many people in one batch.
      await handleSendEmployee(emp);
    }
    setBulkSending(false);
    setSelectedForBulk(new Set());
  };

  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const handleSeedData = () => {
    setIsLoading(true);
    toast.loading("Seeding March 2026 attendance data...");

    setTimeout(() => {
      const employees = seedMarchAttendanceData();
      const dataSummary = getDataSummary();

      setSeededData(employees);
      setSummary(dataSummary);
      setIsLoading(false);

      toast.dismiss();
      toast.success(
        `✅ Successfully seeded data for ${employees.length} employees with ${dataSummary.graceRecords} grace records and ${dataSummary.holdRecords} salary holds`,
        { duration: 5000 }
      );
    }, 1000);
  };

  const handleClearData = () => {
    setConfirmState({
      open: true,
      title: "Clear All Attendance Data",
      description: "Are you sure you want to clear all attendance data? This action cannot be undone.",
      onConfirm: () => {
        clearAllAttendanceData();
        setSeededData([]);
        setSummary(null);
        toast.success("All attendance data cleared successfully");
        setConfirmState(s => ({ ...s, open: false }));
      }
    });
  };

  const handleRefreshSummary = () => {
    const dataSummary = getDataSummary();
    setSummary(dataSummary);
    toast.success("Summary refreshed");
  };

  return (
    <div className="space-y-6 p-6">
      <BackButton />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Data Manager</h2>
          <p className="text-sm text-gray-600 mt-1">
            Seed and manage dummy attendance data for testing
          </p>
        </div>
        <div className="flex items-center gap-2">
          {seededData.length > 0 && (
            <Button onClick={() => setShowMusterRoll(true)} className="bg-blue-600 hover:bg-blue-700">
              <Eye className="w-4 h-4 mr-2" />
              View All Employees
            </Button>
          )}
          <Badge variant="outline" className="text-sm">
            Admin Tool
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Data Management Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleSeedData}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Seed March 2026 Data
            </Button>

            <Button onClick={handleRefreshSummary} variant="outline">
              <CheckCircle className="w-4 h-4 mr-2" />
              Refresh Summary
            </Button>

            <Button onClick={handleClearData} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>ℹ️ Note:</strong> Seeding data will populate grace period usage and salary
              hold records for 8 employees with various March 2026 attendance scenarios. This data
              is stored in localStorage and will persist across sessions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <p className="text-sm text-purple-700">Total Employees</p>
                </div>
                <p className="text-3xl font-bold text-purple-900">{summary.totalEmployees}</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-700">Grace Period Records</p>
                </div>
                <p className="text-3xl font-bold text-blue-900">{summary.graceRecords}</p>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-700">Salary Holds (ON_HOLD)</p>
                </div>
                <p className="text-3xl font-bold text-red-900">{summary.holdStatuses.onHold}</p>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <p className="text-sm text-orange-700">Override Pending</p>
                </div>
                <p className="text-3xl font-bold text-orange-900">
                  {summary.holdStatuses.overridePending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seeded Employees Details */}
      {seededData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Seeded Employee Data</CardTitle>
              {canSend && (
                <Button
                  size="sm"
                  onClick={handleBulkSend}
                  disabled={selectedForBulk.size === 0 || bulkSending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {bulkSending ? "Sending…" : `Send Selected (${selectedForBulk.size})`}
                </Button>
              )}
            </div>
            {canSend && !canShareFiles && (
              <p className="text-xs text-amber-600 mt-1">
                This browser doesn't support sharing files directly — Send will download each report instead, for you to attach manually.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seededData.map((emp) => (
                <div
                  key={emp.employeeId}
                  className={`p-4 border rounded-lg ${
                    emp.hasGhosting ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {canSend && (
                        <input
                          type="checkbox"
                          checked={selectedForBulk.has(emp.employeeId)}
                          onChange={() => handleToggleBulkSelect(emp.employeeId)}
                          className="mt-1.5 w-4 h-4"
                          aria-label={`Select ${emp.employeeName} for bulk send`}
                        />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {emp.employeeName}{" "}
                          <span className="text-sm font-normal text-gray-600">
                            ({emp.empCode})
                          </span>
                        </h4>
                        <p className="text-sm text-gray-600">{emp.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant={emp.graceUsageCount === 0 ? "default" : "outline"}
                        className={
                          emp.graceUsageCount === 3
                            ? "bg-red-100 text-red-800 border-red-300"
                            : emp.graceUsageCount >= 2
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                            : "bg-green-100 text-green-800 border-green-300"
                        }
                      >
                        Grace: {emp.graceUsageCount}/3
                      </Badge>
                      {emp.hasGhosting && (
                        <Badge variant="destructive" className="bg-red-600">
                          {emp.salaryHoldStatus === "ON_HOLD" ? "🔒 BLOCKED" : "⏳ PENDING"}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingEmployee(emp)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                      {canSend && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendEmployee(emp)}
                          disabled={sendingEmployeeId === emp.employeeId || bulkSending}
                        >
                          <Send className="w-3.5 h-3.5 mr-1" />
                          {sendingEmployeeId === emp.employeeId ? "Sending…" : "Send"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Total Days</p>
                      <p className="font-semibold">{emp.dailyAttendance.length} days</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Present</p>
                      <p className="font-semibold text-green-600">
                        {emp.dailyAttendance.filter((d) => d.status === "P").length} days
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Leaves</p>
                      <p className="font-semibold text-blue-600">
                        {
                          emp.dailyAttendance.filter(
                            (d) => d.status === "PL" || d.status === "CSL" || d.status === "LWP"
                          ).length
                        }{" "}
                        days
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Absences</p>
                      <p className="font-semibold text-red-600">
                        {emp.dailyAttendance.filter((d) => d.status === "A").length} days
                      </p>
                    </div>
                  </div>

                  {/* Show special attendance statuses */}
                  {emp.dailyAttendance.some(
                    (d) =>
                      d.status !== "P" &&
                      d.status !== "WOFF" &&
                      d.status !== "PH" &&
                      d.graceUsed !== true
                  ) && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Special Status Days:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {emp.dailyAttendance
                          .filter(
                            (d) =>
                              d.status !== "P" &&
                              d.status !== "WOFF" &&
                              d.status !== "PH" &&
                              !d.graceUsed
                          )
                          .slice(0, 10)
                          .map((day, idx) => (
                            <div
                              key={idx}
                              className={`px-2 py-1 rounded border text-xs font-semibold ${
                                ATTENDANCE_TYPE_COLORS[day.status] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {new Date(day.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                              : {day.status}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Grace usage details */}
                  {emp.graceUsageCount > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Grace Period Usage:
                      </p>
                      <div className="space-y-1">
                        {emp.dailyAttendance
                          .filter((d) => d.graceUsed)
                          .map((day, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs p-2 bg-white rounded border"
                            >
                              <span>
                                {new Date(day.date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="text-gray-600">
                                Arrived at {day.checkIn} ({day.lateMinutes} min late)
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Ghosting warning */}
                  {emp.hasGhosting && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                      <p className="text-sm text-red-900 font-semibold">
                        ⚠️ Ghosting Detected - 3 Consecutive Absent Days
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Status: {emp.salaryHoldStatus === "ON_HOLD" ? "Salary BLOCKED" : "Override Request Pending Approval"}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">📚 Data Scenarios Included</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-900">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
              <p>
                <strong>Employee 1 (CW0001):</strong> Perfect attendance - 0/3 grace used
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
              <p>
                <strong>Employee 2 (CW0002):</strong> 2/3 grace period used - within quota
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
              <p>
                <strong>Employee 3 (CW0003):</strong> 3/3 grace exhausted - quota fully used
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 text-red-600" />
              <p>
                <strong>Employee 4 (CW0004):</strong> Ghosting detected (3 consecutive absences) - Salary ON_HOLD
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
              <p>
                <strong>Employee 5 (CW0005):</strong> Mixed attendance (half-days, PL, casual leave, comp-off)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 text-orange-600" />
              <p>
                <strong>Employee 6 (CW0006):</strong> Ghosting with OVERRIDE_PENDING status
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
              <p>
                <strong>Employee 7 (CW0007):</strong> Multiple LWP (Leave Without Pay) days
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
              <p>
                <strong>Employee 8 (CW0008):</strong> Grace quota exceeded - 4th late arrival triggers automatic 0.5 day PL deduction
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
        variant="destructive"
      />

      {viewingEmployee && (
        <AttendanceDetailModal
          employee={viewingEmployee}
          onClose={() => setViewingEmployee(null)}
        />
      )}

      {showMusterRoll && (
        <AttendanceMusterRollModal
          employees={seededData}
          onClose={() => setShowMusterRoll(false)}
        />
      )}
    </div>
  );
}

export default AttendanceDataManager;
