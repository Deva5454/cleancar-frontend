/**
 * Attendance Muster Roll Modal
 *
 * Shows all seeded employees together in one consolidated register —
 * E-Code | Name | Department | Category | DOJ | day-by-day columns (1-31)
 * | P | HD | Total | WO | ALWP | UA | Total — matching the reference
 * "Attendance_template.xlsx" muster roll layout exactly, plus a
 * company-wide totals row and Excel export.
 *
 * Data note: DOJ and Category have no real source for these seeded demo
 * employees (EmployeeAttendanceRecord doesn't track either) — DOJ defaults
 * to the first date in the employee's attendance record, and Category to
 * "Surat Office" (this admin tool is Surat-scoped), both clearly
 * reasonable defaults rather than invented specifics.
 */
import { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { X, Download } from "lucide-react";
import { toast } from "sonner";
import type { EmployeeAttendanceRecord } from "../../services/seedAttendanceData";
import { normalizeCode, type CanonicalCode } from "./AttendanceDetailModal";

/** Maps our 16-code taxonomy to the muster roll's cell symbols. */
function toMusterSymbol(code: CanonicalCode): string {
  switch (code) {
    case "P": return "P";
    case "A": return "A";
    case "WOFF": return "W/O";
    case "PH": return "P/H";
    case "H": case "HPL": case "HCSL": case "HCOFF": case "HPLRG": return "H/D";
    default: return "P"; // PL, CSL, COFF, LWP, HLWP, MTL, PLRG — treated as a paid/approved day present in the register
  }
}

interface EmployeeRow {
  code: string;
  name: string;
  department: string;
  category: string;
  doj: string;
  days: Record<number, string>; // day-of-month -> symbol
  pCount: number;
  hdCount: number;
  total: number;
  woCount: number;
  alwpCount: number;
  uaCount: number;
}

export function AttendanceMusterRollModal({
  employees, onClose,
}: {
  employees: EmployeeAttendanceRecord[];
  onClose: () => void;
}) {
  const { currentRole } = useRole();
  const canDownload = currentRole === "Super Admin" || currentRole === "HR";

  const rows: EmployeeRow[] = employees.map((emp) => {
    const sorted = emp.dailyAttendance.slice().sort((a, b) => a.date.localeCompare(b.date));
    const days: Record<number, string> = {};
    let pCount = 0, hdCount = 0, woCount = 0, alwpCount = 0, uaCount = 0;

    sorted.forEach((d) => {
      const dayOfMonth = new Date(d.date).getDate();
      const code = normalizeCode(d.status);
      const symbol = toMusterSymbol(code);
      days[dayOfMonth] = symbol;
      if (symbol === "P") pCount++;
      else if (symbol === "H/D") hdCount++;
      else if (symbol === "W/O") woCount++;
      else if (symbol === "A") uaCount++;
      else if (code === "LWP" || code === "HLWP") alwpCount++;
    });

    const total = pCount + 0.5 * hdCount;

    return {
      code: emp.empCode,
      name: emp.employeeName,
      department: emp.role,
      category: "Surat Office",
      doj: sorted[0]?.date || "",
      days, pCount, hdCount, total, woCount, alwpCount, uaCount,
    };
  });

  const companyTotals = rows.reduce((acc, r) => ({
    p: acc.p + r.pCount, hd: acc.hd + r.hdCount, total: acc.total + r.total,
    wo: acc.wo + r.woCount, alwp: acc.alwp + r.alwpCount, ua: acc.ua + r.uaCount,
  }), { p: 0, hd: 0, total: 0, wo: 0, alwp: 0, ua: 0 });

  const daysInMonth = 31;
  const dayCols = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const symbolColor: Record<string, string> = {
    P: "text-green-700", "W/O": "text-blue-600", "H/D": "text-amber-600",
    A: "text-red-600 font-semibold", "P/H": "text-purple-600",
  };

  const handleDownloadExcel = async () => {
    if (!canDownload) { toast.error("Only Super Admin or HR can download attendance data"); return; }
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Attendance");

      const headerRow1: any[] = new Array(36).fill("");
      headerRow1[36] = companyTotals.p; headerRow1[37] = companyTotals.hd; headerRow1[38] = companyTotals.total;
      headerRow1[39] = companyTotals.wo; headerRow1[40] = companyTotals.alwp; headerRow1[41] = companyTotals.ua; headerRow1[42] = companyTotals.total;
      ws.addRow(headerRow1);

      const headerRow2 = ["E-Code", "Name", "Department", "Category", "DOJ", ...dayCols.map(String), "P", "HD", "Total", "WO", "ALWP", "UA", "Total"];
      ws.addRow(headerRow2);

      rows.forEach((r) => {
        ws.addRow([
          r.code, r.name, r.department, r.category, r.doj,
          ...dayCols.map((d) => r.days[d] || ""),
          r.pCount, r.hdCount, r.total, r.woCount, r.alwpCount, r.uaCount, r.total,
        ]);
      });

      ws.columns.forEach((c, idx) => { c.width = idx < 5 ? 16 : 5; });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Attendance_Muster_Roll.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Muster roll exported to Excel");
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-[95vw] my-8">
        <CardHeader className="border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Muster Roll — All Employees</CardTitle>
            <div className="flex gap-2">
              {canDownload && (
                <Button size="sm" variant="outline" onClick={handleDownloadExcel}>
                  <Download className="w-4 h-4 mr-2" /> Download Excel
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="border rounded-lg overflow-auto max-h-[70vh]">
            <table className="text-xs w-max">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-2 py-1.5 sticky left-0 bg-gray-100">E-Code</th>
                  <th className="text-left px-2 py-1.5 sticky left-16 bg-gray-100">Name</th>
                  <th className="text-left px-2 py-1.5">Department</th>
                  <th className="text-left px-2 py-1.5">Category</th>
                  <th className="text-left px-2 py-1.5">DOJ</th>
                  {dayCols.map((d) => <th key={d} className="text-center px-1 py-1.5 w-6">{d}</th>)}
                  <th className="text-center px-2 py-1.5 bg-green-50">P</th>
                  <th className="text-center px-2 py-1.5 bg-amber-50">HD</th>
                  <th className="text-center px-2 py-1.5 bg-blue-50 font-semibold">Total</th>
                  <th className="text-center px-2 py-1.5">WO</th>
                  <th className="text-center px-2 py-1.5">ALWP</th>
                  <th className="text-center px-2 py-1.5 bg-red-50">UA</th>
                  <th className="text-center px-2 py-1.5 bg-blue-50 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.code} className="border-t hover:bg-gray-50">
                    <td className="px-2 py-1 sticky left-0 bg-white font-medium">{r.code}</td>
                    <td className="px-2 py-1 sticky left-16 bg-white">{r.name}</td>
                    <td className="px-2 py-1 text-gray-500">{r.department}</td>
                    <td className="px-2 py-1 text-gray-500">{r.category}</td>
                    <td className="px-2 py-1 text-gray-500">{r.doj}</td>
                    {dayCols.map((d) => (
                      <td key={d} className={`text-center px-1 py-1 ${symbolColor[r.days[d]] || "text-gray-300"}`}>
                        {r.days[d] || "·"}
                      </td>
                    ))}
                    <td className="text-center px-2 py-1 bg-green-50">{r.pCount}</td>
                    <td className="text-center px-2 py-1 bg-amber-50">{r.hdCount}</td>
                    <td className="text-center px-2 py-1 bg-blue-50 font-semibold">{r.total}</td>
                    <td className="text-center px-2 py-1">{r.woCount}</td>
                    <td className="text-center px-2 py-1">{r.alwpCount}</td>
                    <td className="text-center px-2 py-1 bg-red-50">{r.uaCount}</td>
                    <td className="text-center px-2 py-1 bg-blue-50 font-semibold">{r.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-400 font-bold bg-gray-50">
                  <td className="px-2 py-1.5" colSpan={5}>Company Total</td>
                  <td colSpan={daysInMonth}></td>
                  <td className="text-center px-2 py-1.5 bg-green-100">{companyTotals.p}</td>
                  <td className="text-center px-2 py-1.5 bg-amber-100">{companyTotals.hd}</td>
                  <td className="text-center px-2 py-1.5 bg-blue-100">{companyTotals.total}</td>
                  <td className="text-center px-2 py-1.5">{companyTotals.wo}</td>
                  <td className="text-center px-2 py-1.5">{companyTotals.alwp}</td>
                  <td className="text-center px-2 py-1.5 bg-red-100">{companyTotals.ua}</td>
                  <td className="text-center px-2 py-1.5 bg-blue-100">{companyTotals.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            P = Present · A = Absent (Unauthorized) · W/O = Weekly Off · P/H = Public Holiday · H/D = Half Day ·
            ALWP = Approved Leave Without Pay · UA = Unauthorized Absence
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AttendanceMusterRollModal;
