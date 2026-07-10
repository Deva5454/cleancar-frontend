/**
 * Attendance Detail Modal
 *
 * Shown when HR/Admin clicks "View" on an employee's attendance card.
 * Thin modal wrapper — all the actual report content (day-by-day table,
 * monthly summary, payslip) lives in the shared AttendanceReportPanel,
 * also used by the Payroll Review "View" modal, so both screens are
 * guaranteed to render identically.
 *
 * Data honesty note: this screen operates on seedAttendanceData.ts's
 * demo/seed employees — this whole tool is explicitly an "Admin Tool ...
 * dummy attendance data" screen. See attendanceReportCore.ts for the full
 * data-honesty notes on the salary figures shown.
 */
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { X, Download } from "lucide-react";
import { toast } from "sonner";
import type { EmployeeAttendanceRecord } from "../../services/seedAttendanceData";
import { buildAttendanceExcelBlob } from "../../utils/attendanceExcelBuilder";
import { AttendanceReportPanel } from "../shared/AttendanceReportPanel";

export type { CanonicalCode } from "../../utils/attendanceReportCore";
export { CODE_LABELS, CODE_COLORS, normalizeCode, dayOfWeekName, computeWorkingHours, illustrativeGrossForRole, remarksFor } from "../../utils/attendanceReportCore";

interface Props {
  employee: EmployeeAttendanceRecord;
  onClose: () => void;
}

export function AttendanceDetailModal({ employee, onClose }: Props) {
  const { currentRole } = useRole();
  const canDownload = currentRole === "Super Admin" || currentRole === "HR";

  const handleDownloadExcel = async () => {
    if (!canDownload) { toast.error("Only Super Admin or HR can download attendance data"); return; }
    try {
      const { blob, filename } = await buildAttendanceExcelBlob(employee);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Attendance & salary report exported to Excel");
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-5xl my-8">
        <CardHeader className="border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{employee.employeeName} ({employee.empCode})</CardTitle>
              <p className="text-sm text-gray-500">{employee.role}</p>
            </div>
            <div className="flex gap-2">
              {canDownload && (
                <Button size="sm" variant="outline" onClick={handleDownloadExcel}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Excel
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <AttendanceReportPanel employee={employee} />
        </CardContent>
      </Card>
    </div>
  );
}

export default AttendanceDetailModal;
