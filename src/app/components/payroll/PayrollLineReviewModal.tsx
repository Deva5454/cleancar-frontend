/**
 * Payroll Line Review Modal
 *
 * Per-employee review gate shown before a payroll run can move to
 * "HR Approved". HR/Super Admin views each employee's calculated payroll,
 * then either Approves it as-is, or Rejects it — which opens inline
 * correction fields (Base Salary / Incentive / Deductions). Every action
 * is logged (who, what, when, old→new values for corrections) and shown
 * as an audit trail in the same modal.
 *
 * The attendance + salary report section above the approval controls is
 * the exact same shared AttendanceReportPanel used by the Attendance View
 * modal — same computation, same layout, pixel for pixel — so the two
 * screens can't drift apart from each other.
 */
import { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { X, CheckCircle2, XCircle, History, Lock, Download } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "../../lib/formatters";
import { useHRData } from "../../contexts/HRDataContext";
import { AttendanceReportPanel } from "../shared/AttendanceReportPanel";
import { buildAttendanceExcelBlob } from "../../utils/attendanceExcelBuilder";
import type { EmployeeAttendanceRecord } from "../../services/seedAttendanceData";
import { generateIllustrativeMonth } from "../../utils/generateIllustrativeAttendance";

export type ReviewStatus = "Pending" | "Approved" | "Rejected";

export interface ReviewLogEntry {
  action: "Approved" | "Rejected" | "Corrected";
  by: string;
  byRole: string;
  at: string;
  note?: string;
  changes?: Array<{ field: string; from: number; to: number }>;
}

export interface ReviewableEmployeePayroll {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  baseSalary: number;
  incentive: number;
  grossSalary: number;
  deductions: number;
  netPay: number;
  hasAnomaly: boolean;
  anomalyReason?: string;
  reviewStatus: ReviewStatus;
  reviewLog: ReviewLogEntry[];
}

export function PayrollLineReviewModal({
  employee, onClose, onApprove, onReject,
}: {
  employee: ReviewableEmployeePayroll;
  onClose: () => void;
  onApprove: (employeeId: string) => void;
  onReject: (employeeId: string, corrections: { baseSalary: number; incentive: number; deductions: number }, note: string) => void;
}) {
  const { currentUser, currentRole } = useRole();
  const canReview = currentRole === "HR" || currentRole === "Super Admin";
  const { getAttendanceByEmployeeId } = useHRData();

  const [editing, setEditing] = useState(false);
  const [draftBase, setDraftBase] = useState(employee.baseSalary);
  const [draftIncentive, setDraftIncentive] = useState(employee.incentive);
  const [draftDeductions, setDraftDeductions] = useState(employee.deductions);
  const [note, setNote] = useState("");

  // Real attendance first (ATTENDANCE_RECORDS, via HRDataContext); falls
  // back to an illustrative month when — as is the case for every employee
  // today — there's no real data on file yet. See generateIllustrativeAttendance.ts.
  const year = 2026, month = 4; // matches this screen's fixed "April 2026" period
  const realRecords = getAttendanceByEmployeeId(employee.employeeId).filter((r: any) => r.date.startsWith(`${year}-${String(month).padStart(2, "0")}`));
  const isIllustrative = realRecords.length === 0;
  const dailyAttendance = isIllustrative
    ? generateIllustrativeMonth(employee.employeeId, year, month)
    : realRecords.map((r: any) => ({
        date: r.date as string,
        status: (r.status === "Present" ? "P" : r.status === "Absent" ? "A" : r.status === "Half Day" ? "H" : r.status === "Week Off" ? "WOFF" : r.status === "Leave" ? "CSL" : "P") as string,
        checkIn: r.checkInTime as string | undefined, checkOut: r.checkOutTime as string | undefined, lateMinutes: r.lateMinutes as number | undefined,
      }));

  // Feeds the exact same shared panel/report the Attendance View uses.
  const attendanceRecord: EmployeeAttendanceRecord = {
    employeeId: employee.employeeId,
    employeeName: employee.employeeName,
    empCode: employee.employeeId,
    role: employee.role,
    dailyAttendance,
    graceUsageCount: 0,
    hasGhosting: false,
  };

  const handleDownloadExcel = async () => {
    if (!canReview) { toast.error("Only Super Admin or HR can download attendance data"); return; }
    try {
      const { blob, filename } = await buildAttendanceExcelBlob(attendanceRecord);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success("Attendance & salary report exported to Excel");
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  const statusColor: Record<ReviewStatus, string> = {
    Pending: "bg-gray-100 text-gray-700 border-gray-300",
    Approved: "bg-green-100 text-green-800 border-green-300",
    Rejected: "bg-red-100 text-red-800 border-red-300",
  };

  const handleApprove = () => {
    if (!canReview) { toast.error("Only HR or Super Admin can review payroll"); return; }
    onApprove(employee.employeeId);
    toast.success(`${employee.employeeName}'s payroll approved`);
    onClose();
  };

  const handleStartReject = () => {
    if (!canReview) { toast.error("Only HR or Super Admin can review payroll"); return; }
    setEditing(true);
  };

  const handleSaveRejection = () => {
    if (!note.trim()) { toast.error("Add a note explaining the correction before saving"); return; }
    onReject(employee.employeeId, { baseSalary: draftBase, incentive: draftIncentive, deductions: draftDeductions }, note);
    toast.success(`${employee.employeeName}'s payroll rejected and corrected`);
    setEditing(false);
    onClose();
  };

  const newGross = draftBase + draftIncentive;
  const newNet = newGross - draftDeductions;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-5xl my-8">
        <CardHeader className="border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{employee.employeeName} ({employee.employeeId})</CardTitle>
              <p className="text-sm text-gray-500">{employee.role} — {employee.department}</p>
            </div>
            <div className="flex gap-2">
              {canReview && (
                <Button size="sm" variant="outline" onClick={handleDownloadExcel}>
                  <Download className="w-4 h-4 mr-2" /> Download Excel
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <Badge className={statusColor[employee.reviewStatus]}>{employee.reviewStatus}</Badge>
            {employee.hasAnomaly && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                Anomaly: {employee.anomalyReason || "Flagged"}
              </Badge>
            )}
          </div>

          {!canReview && (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <Lock className="w-4 h-4 flex-shrink-0" />
              Only HR and Super Admin can approve, reject, or correct payroll lines. You can view but not act.
            </div>
          )}

          {isIllustrative && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              No real attendance is on file for this employee yet (the attendance store isn't populated for
              real employees) — showing an illustrative month so the pattern is there when real punches start
              flowing in. This is not this employee's actual attendance.
            </p>
          )}

          {/* Same shared report as the Attendance View — day-by-day table,
              monthly summary, and payslip, identical layout and math. */}
          <AttendanceReportPanel employee={attendanceRecord} />

          {!editing ? (
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden text-sm">
              <div className="bg-gray-800 text-white px-3 py-1.5 text-xs font-semibold">PAYROLL SUMMARY (editable — HR/Super Admin approval figures)</div>
              <div className="grid grid-cols-4 divide-x divide-gray-200">
                <div className="px-3 py-2"><p className="text-gray-500 text-xs">Base Salary</p><p className="font-semibold">{formatCurrency(employee.baseSalary)}</p></div>
                <div className="px-3 py-2"><p className="text-gray-500 text-xs">Incentives</p><p className="font-semibold text-green-600">{formatCurrency(employee.incentive)}</p></div>
                <div className="px-3 py-2"><p className="text-gray-500 text-xs">Gross Salary</p><p className="font-semibold">{formatCurrency(employee.grossSalary)}</p></div>
                <div className="px-3 py-2"><p className="text-gray-500 text-xs">Deductions</p><p className="font-semibold text-red-600">-{formatCurrency(employee.deductions)}</p></div>
              </div>
              <div className="bg-purple-700 text-white px-4 py-2 flex items-center justify-between border-t-2 border-gray-300">
                <span className="font-semibold text-sm">NET PAY</span>
                <span className="text-lg font-bold">{formatCurrency(employee.netPay)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800">Correcting payroll — enter the right figures</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Base Salary</Label>
                  <Input type="number" value={draftBase} onChange={(e) => setDraftBase(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="text-xs">Incentives</Label>
                  <Input type="number" value={draftIncentive} onChange={(e) => setDraftIncentive(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="text-xs">Deductions</Label>
                  <Input type="number" value={draftDeductions} onChange={(e) => setDraftDeductions(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div className="text-sm">
                <p>New Gross: <strong>{formatCurrency(newGross)}</strong> — New Net: <strong className="text-blue-600">{formatCurrency(newNet)}</strong></p>
              </div>
              <div>
                <Label className="text-xs">Reason for correction (required)</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. Incentive miscalculated — TSE closed 3 not 5 deals this month" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveRejection} className="bg-red-600 hover:bg-red-700">
                  Save Rejection &amp; Correction
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {!editing && canReview && employee.reviewStatus !== "Approved" && (
            <div className="flex gap-2">
              <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button onClick={handleStartReject} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                <XCircle className="w-4 h-4 mr-2" /> Reject &amp; Correct
              </Button>
            </div>
          )}
          {!editing && canReview && employee.reviewStatus === "Approved" && (
            <Button onClick={handleStartReject} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              <XCircle className="w-4 h-4 mr-2" /> Reject &amp; Correct
            </Button>
          )}

          {employee.reviewLog.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <History className="w-4 h-4" /> Review Log ({employee.reviewLog.length})
              </h4>
              <div className="space-y-2">
                {employee.reviewLog.slice().reverse().map((entry, idx) => (
                  <div key={idx} className="text-xs bg-gray-50 border rounded p-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">{entry.action}</span>
                      <span className="text-gray-400">{new Date(entry.at).toLocaleString("en-IN")}</span>
                    </div>
                    <p className="text-gray-500">{entry.by} ({entry.byRole})</p>
                    {entry.note && <p className="text-gray-600 mt-1">"{entry.note}"</p>}
                    {entry.changes && entry.changes.length > 0 && (
                      <ul className="mt-1 text-gray-600 list-disc list-inside">
                        {entry.changes.map((c, i) => (
                          <li key={i}>{c.field}: {formatCurrency(c.from)} → {formatCurrency(c.to)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PayrollLineReviewModal;
