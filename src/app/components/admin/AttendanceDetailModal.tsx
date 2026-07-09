/**
 * Attendance Detail Modal
 *
 * Shown when HR/Admin clicks "View" on an employee's attendance card.
 * Displays the full day-by-day attendance for the month using the
 * company's canonical 16-code attendance taxonomy, plus a legend and an
 * Excel export (Super Admin / HR only).
 *
 * Note: the underlying seed data (seedAttendanceData.ts) and the shared
 * ATTENDANCE_TYPES constants elsewhere in payroll still use a slightly
 * different code set (split 1st/2nd-half variants like "1H"/"2H", and
 * "COMP OFF" instead of "COFF"). Rather than renaming those shared
 * constants — which are also read by payroll salary-impact calculations
 * elsewhere and risk wider breakage — this view normalizes codes to the
 * canonical list at the display/export layer only.
 */
import { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { X, Download, Info } from "lucide-react";
import { toast } from "sonner";
import type { EmployeeAttendanceRecord } from "../../services/seedAttendanceData";

export type CanonicalCode =
  | "P" | "A" | "H" | "WOFF" | "PH" | "LWP" | "HLWP" | "PL" | "HPL"
  | "CSL" | "HCSL" | "COFF" | "HCOFF" | "MTL" | "HPLRG" | "PLRG";

export const CODE_LABELS: Record<CanonicalCode, string> = {
  P: "Present",
  A: "Absent",
  H: "Half Day Present",
  WOFF: "Weekly Off / Sunday",
  PH: "Public Holiday",
  LWP: "Leave Without Pay",
  HLWP: "Half Day Leave Without Pay",
  PL: "Privilege Leave",
  HPL: "Half Day Present + Privilege Leave",
  CSL: "Casual + Sick Leave",
  HCSL: "Half Day Casual + Sick Leave",
  COFF: "Compensatory Off",
  HCOFF: "Half Day Compensatory Off",
  MTL: "Maternity Leave",
  HPLRG: "Half Day Privilege Leave Adjusted Against Late Coming / Miss Punch",
  PLRG: "Full Day Privilege Leave Adjusted Against Late Coming / Miss Punch",
};

const CODE_COLORS: Record<CanonicalCode, string> = {
  P: "bg-green-100 text-green-800 border-green-300",
  WOFF: "bg-green-100 text-green-800 border-green-300",
  PH: "bg-green-100 text-green-800 border-green-300",
  PL: "bg-green-100 text-green-800 border-green-300",
  CSL: "bg-green-100 text-green-800 border-green-300",
  COFF: "bg-green-100 text-green-800 border-green-300",
  MTL: "bg-green-100 text-green-800 border-green-300",
  H: "bg-yellow-100 text-yellow-800 border-yellow-300",
  HPL: "bg-yellow-100 text-yellow-800 border-yellow-300",
  HCSL: "bg-yellow-100 text-yellow-800 border-yellow-300",
  HCOFF: "bg-yellow-100 text-yellow-800 border-yellow-300",
  A: "bg-red-100 text-red-800 border-red-300",
  LWP: "bg-red-100 text-red-800 border-red-300",
  HLWP: "bg-red-100 text-red-800 border-red-300",
  HPLRG: "bg-purple-100 text-purple-800 border-purple-300",
  PLRG: "bg-purple-100 text-purple-800 border-purple-300",
};

/** Maps whatever the underlying seed/payroll data uses to the canonical 16-code list. */
function normalizeCode(rawStatus: string): CanonicalCode {
  const map: Record<string, CanonicalCode> = {
    "P": "P", "A": "A", "WOFF": "WOFF", "PH": "PH", "LWP": "LWP",
    "PL": "PL", "CSL": "CSL", "SL": "CSL", "MTL": "MTL",
    "H": "H", "1H": "H", "2H": "H",
    "1_HLWP": "HLWP", "2_HLWP": "HLWP", "HLWP": "HLWP",
    "1_HPL": "HPL", "2_HPL": "HPL", "HPL": "HPL",
    "1_HCSL": "HCSL", "2_HCSL": "HCSL", "HCSL": "HCSL",
    "COMP OFF": "COFF", "COFF": "COFF",
    "HCOFF": "HCOFF",
    "HPLRG": "HPLRG", "PLRG": "PLRG",
  };
  return map[rawStatus] || "P";
}

function dayOfWeekName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" });
}

export function AttendanceDetailModal({
  employee, onClose,
}: {
  employee: EmployeeAttendanceRecord;
  onClose: () => void;
}) {
  const { currentRole } = useRole();
  const canDownload = currentRole === "Super Admin" || currentRole === "HR";
  const [showLegend, setShowLegend] = useState(false);

  const rows = employee.dailyAttendance
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, code: normalizeCode(d.status) }));

  const counts: Partial<Record<CanonicalCode, number>> = {};
  rows.forEach((r) => { counts[r.code] = (counts[r.code] || 0) + 1; });

  const monthLabel = rows.length > 0
    ? new Date(rows[0].date).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "";

  const handleDownloadExcel = async () => {
    if (!canDownload) { toast.error("Only Super Admin or HR can download attendance data"); return; }
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Attendance");

      ws.addRow([`Attendance Register — ${employee.employeeName} (${employee.empCode})`]);
      ws.addRow([`Role: ${employee.role}`]);
      ws.addRow([`Period: ${monthLabel}`]);
      ws.addRow([]);
      ws.addRow(["Date", "Day", "Code", "Description", "Check-In", "Check-Out", "Late (min)"]);

      rows.forEach((r) => {
        ws.addRow([
          r.date, dayOfWeekName(r.date), r.code, CODE_LABELS[r.code],
          r.checkIn || "", r.checkOut || "", r.lateMinutes ?? "",
        ]);
      });

      ws.addRow([]);
      ws.addRow(["Summary"]);
      (Object.keys(CODE_LABELS) as CanonicalCode[]).forEach((code) => {
        if (counts[code]) ws.addRow([code, CODE_LABELS[code], counts[code]]);
      });

      ws.addRow([]);
      ws.addRow(["Legend"]);
      (Object.keys(CODE_LABELS) as CanonicalCode[]).forEach((code) => {
        ws.addRow([code, CODE_LABELS[code]]);
      });

      ws.columns.forEach((col) => { col.width = 22; });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Attendance_${employee.empCode}_${monthLabel.replace(" ", "_")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Attendance exported to Excel");
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader className="border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{employee.employeeName} ({employee.empCode})</CardTitle>
              <p className="text-sm text-gray-500">{employee.role} — {monthLabel}</p>
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
        <CardContent className="p-6 space-y-4">
          {/* Summary counts */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CODE_LABELS) as CanonicalCode[])
              .filter((code) => counts[code])
              .map((code) => (
                <Badge key={code} className={CODE_COLORS[code]}>
                  {code}: {counts[code]}
                </Badge>
              ))}
          </div>

          <button
            type="button"
            onClick={() => setShowLegend((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
          >
            <Info className="w-3.5 h-3.5" /> {showLegend ? "Hide" : "Show"} code legend
          </button>
          {showLegend && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs bg-gray-50 border rounded-lg p-3">
              {(Object.keys(CODE_LABELS) as CanonicalCode[]).map((code) => (
                <div key={code} className="flex gap-2">
                  <span className="font-mono font-semibold w-16">{code}</span>
                  <span className="text-gray-600">{CODE_LABELS[code]}</span>
                </div>
              ))}
            </div>
          )}

          {/* Day-by-day table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-left px-3 py-2">Day</th>
                  <th className="text-center px-3 py-2">Code</th>
                  <th className="text-left px-3 py-2">Description</th>
                  <th className="text-left px-3 py-2">Check-In</th>
                  <th className="text-left px-3 py-2">Check-Out</th>
                  <th className="text-right px-3 py-2">Late (min)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.date} className="border-t">
                    <td className="px-3 py-1.5">{r.date}</td>
                    <td className="px-3 py-1.5 text-gray-500">{dayOfWeekName(r.date)}</td>
                    <td className="px-3 py-1.5 text-center">
                      <Badge className={CODE_COLORS[r.code]}>{r.code}</Badge>
                    </td>
                    <td className="px-3 py-1.5 text-gray-600">{CODE_LABELS[r.code]}</td>
                    <td className="px-3 py-1.5">{r.checkIn || "—"}</td>
                    <td className="px-3 py-1.5">{r.checkOut || "—"}</td>
                    <td className="px-3 py-1.5 text-right">{r.lateMinutes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AttendanceDetailModal;
