/**
 * Attendance Detail Modal
 *
 * Shown when HR/Admin clicks "View" on an employee's attendance card.
 * Rebuilt to match the reference "Attendance View" Excel exactly — both
 * the day-by-day Attendance Report (letterhead, employee info, SR NO/DATE/
 * TYPE/IN/OUT/HOURS/LATE COUNT/AUTO LOGOUT/SUNDAY-PH/REMARKS, monthly
 * summary) and the Salary & Deduction breakdown (bank/employee info, pay
 * heads, deduction heads, employer contributions, net payable).
 *
 * Data honesty notes:
 * - This screen operates on seedAttendanceData.ts's demo/seed employees
 *   (Priya Sharma, Amit Kumar, etc.) — this whole tool is explicitly an
 *   "Admin Tool ... dummy attendance data" screen, and these seeded people
 *   don't exist in the real employeeDatabaseService/salaryStructureService.
 *   Salary figures below are computed with the app's real payroll formula
 *   (calculateCTCFromGross + calculateStatutoryDeductions — the same
 *   functions used for actual employees elsewhere), fed by a role-based
 *   illustrative gross, exactly the way the reference Excel itself uses a
 *   fictional "Mr. ABC" with example numbers. Nothing here is fabricated
 *   math — it's real calculation logic applied to a stated demo salary.
 * - Bank details, incentives/overtime/commission, and LWF have no reliable
 *   per-employee source for these seed records, so they're shown as
 *   "Not on file" / 0 rather than invented.
 */
import { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { X, Download, Info } from "lucide-react";
import { toast } from "sonner";
import type { EmployeeAttendanceRecord } from "../../services/seedAttendanceData";
import { calculateCTCFromGross } from "../../config/salaryComponentConfiguration";
import { calculateStatutoryDeductions } from "../../services/payroll/complianceEngine";
import { detectStateFromCity } from "../../services/payroll/complianceRules";

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

export const CODE_COLORS: Record<CanonicalCode, string> = {
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

export function normalizeCode(rawStatus: string): CanonicalCode {
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

export function dayOfWeekName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" });
}

/** Working hours as HH:MM:SS from check-in/check-out, matching the reference format. */
export function computeWorkingHours(checkIn?: string, checkOut?: string): string {
  if (!checkIn || !checkOut) return "00:00:00";
  const parse = (t: string) => {
    const m = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (m[3]?.toUpperCase() === "PM" && h !== 12) h += 12;
    if (m[3]?.toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + min;
  };
  const inMin = parse(checkIn);
  const outMin = parse(checkOut);
  if (inMin === null || outMin === null) return "00:00:00";
  const diff = Math.max(0, outMin - inMin);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

/** Illustrative monthly gross by role, for this admin/demo tool's seeded
 *  employees only — see the file header note on data honesty. */
function illustrativeGrossForRole(role: string): number {
  const map: Record<string, number> = {
    "Sales Executive": 18000,
    "Finance Manager": 45000,
    "Car Washer / Technician": 13600,
    "Field Supervisor": 20000,
    "HR Coordinator": 25000,
    "Tele Sales Executive": 16000,
    "Marketing Executive": 22000,
    "Cluster Manager": 40000,
  };
  return map[role] || 15000;
}

function remarksFor(code: CanonicalCode): string {
  switch (code) {
    case "A": return "IN CASE NO PUNCH OR NO LEAVE APPLIED";
    case "H": return "IF LEAVE NOT APPLIED IT WILL BE CONSIDERED AS HALF DAY";
    case "LWP": return "IN CASE EMPLOYEE NOT HAVING LEAVE BALANCE AND APPLIED LWP LEAVE";
    case "HLWP": return "IN CASE EMPLOYEE APPLIED LEAVE";
    case "PH": return "AS PER ANNUAL LEAVE CALENDAR";
    case "COFF": return "EMPLOYEE HAS TO MAKE REQUEST FOR COFF GENERATION";
    case "HPL": case "HCSL": case "HCOFF": case "CSL": case "PL":
      return "IN CASE EMPLOYEE APPLIED LEAVE AND APPROVED";
    default: return "";
  }
}

interface Props {
  employee: EmployeeAttendanceRecord;
  onClose: () => void;
}

export function AttendanceDetailModal({ employee, onClose }: Props) {
  const { currentRole } = useRole();
  const canDownload = currentRole === "Super Admin" || currentRole === "HR";
  const [showLegend, setShowLegend] = useState(false);
  const [showSalary, setShowSalary] = useState(true);

  const rows = employee.dailyAttendance
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, code: normalizeCode(d.status) }));

  // Running cumulative counters, as in the reference (only shown on the day they tick up)
  let lateRunning = 0;
  let autoLogoutRunning = 0;
  const displayRows = rows.map((r, idx) => {
    const workingHours = computeWorkingHours(r.checkIn, r.checkOut);
    const isLate = (r.lateMinutes || 0) > 0;
    if (isLate) lateRunning += 1;
    const isAutoLogout = !!r.checkIn && !r.checkOut;
    if (isAutoLogout) autoLogoutRunning += 1;
    return {
      sr: idx + 1,
      date: r.date,
      day: dayOfWeekName(r.date),
      code: r.code,
      checkIn: r.checkIn || "",
      checkOut: r.checkOut || "",
      workingHours,
      lateCount: isLate ? lateRunning : undefined,
      autoLogoutCount: isAutoLogout ? autoLogoutRunning : undefined,
      sundayPH: r.code === "WOFF" || r.code === "PH" ? "YES" : "NO",
      remarks: remarksFor(r.code),
    };
  });

  const monthLabel = rows.length > 0
    ? new Date(rows[0].date).toLocaleDateString("en-IN", { month: "long", year: "numeric" }).toUpperCase()
    : "";
  const fromDate = rows[0]?.date || "";
  const toDate = rows[rows.length - 1]?.date || "";

  // ── Monthly summary (Part A) ────────────────────────────────────────
  const counts: Partial<Record<CanonicalCode, number>> = {};
  rows.forEach((r) => { counts[r.code] = (counts[r.code] || 0) + 1; });

  const totalDays = rows.length;
  const weeklyOff = counts.WOFF || 0;
  const publicHoliday = counts.PH || 0;
  const workingDays = totalDays - weeklyOff - publicHoliday;
  const presentDays =
    (counts.P || 0) + 0.5 * (counts.H || 0) + 0.5 * (counts.HPL || 0) + 0.5 * (counts.HCSL || 0) + 0.5 * (counts.HCOFF || 0);
  const absentDays = counts.A || 0;
  const leaveWithSalary = (counts.PL || 0) + (counts.CSL || 0) + (counts.COFF || 0) + (counts.MTL || 0);
  const leaveWithoutPay = (counts.LWP || 0) + 0.5 * (counts.HLWP || 0);
  const maternityLeave = counts.MTL || 0;
  const paidDays = totalDays - leaveWithoutPay - absentDays;
  const lateComingCount = lateRunning;
  const autoLogoutCount = autoLogoutRunning;
  const leaveAdjusted = (counts.PLRG || 0) + 0.5 * (counts.HPLRG || 0);
  const daysToDeduct = absentDays + leaveWithoutPay;

  // ── Salary & Deduction breakdown (Part B) — see file header note ───
  const gross = illustrativeGrossForRole(employee.role);
  const salary = calculateCTCFromGross(gross);
  const state = detectStateFromCity("surat"); // this admin tool is Surat-scoped (?city=surat)
  const compliance = calculateStatutoryDeductions(
    state,
    {
      basic: salary.basic, hra: salary.hra, conveyance: salary.conveyance,
      medicalAllowance: salary.medical, specialAllowance: salary.specialAllowance, otherAllowances: 0,
    },
    salary.annualCTC
  );
  const perDayGross = gross / 30;
  const attendanceDeduction = Math.round(perDayGross * daysToDeduct);
  const totalDeduction = salary.employeePF + salary.employeeESIC + salary.professionalTax + compliance.deductions.tds.monthly + compliance.deductions.lwf.employee;
  const netPayable = gross - totalDeduction - attendanceDeduction;

  const handleDownloadExcel = async () => {
    if (!canDownload) { toast.error("Only Super Admin or HR can download attendance data"); return; }
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();

      // ── Sheet 1: Attendance Report (Part A) ──
      const ws = wb.addWorksheet("Attendance Report");
      ws.addRow(["24/9 CAR WASHING PRIVATE LIMITED"]);
      ws.addRow(["132, Silver Plaza, Near Kim Chokdi, Olpad, Surat."]);
      ws.addRow([`ATTENDANCE REPORT FOR THE MONTH OF ${monthLabel}`]);
      ws.addRow(["EMPLOYEE CODE:", employee.empCode]);
      ws.addRow(["EMPLOYEE NAME:", employee.employeeName]);
      ws.addRow(["EMPLOYEE DEPARTMENT:", employee.role, "FROM DATE", fromDate, "TO DATE", toDate, "REPORT DATE:", new Date().toISOString().split("T")[0]]);
      ws.addRow([]);
      ws.addRow(["SR NO.", "DATE", "ATTENDANCE TYPE", "IN TIME", "OUT TIME", "WORKING HOURS", "LATE COMING COUNT", "AUTO LOGOUT COUNT", "SUNDAY / PH", "REMARKS"]);
      displayRows.forEach((r) => {
        ws.addRow([r.sr, r.date, r.code, r.checkIn, r.checkOut, r.workingHours, r.lateCount ?? "", r.autoLogoutCount ?? "", r.sundayPH, r.remarks]);
      });
      ws.addRow([]);
      ws.addRow(["TOTAL DAYS", totalDays, "PAID DAYS", paidDays, "WEEKLY OFF", weeklyOff, "PUBLIC HOLIDAY", publicHoliday]);
      ws.addRow(["WORKING DAYS", workingDays]);
      ws.addRow(["PRESENT DAYS", presentDays, "ABSENT DAYS", absentDays, "LEAVE WITH SALARY", leaveWithSalary, "LEAVE WITHOUT PAY", leaveWithoutPay]);
      ws.addRow([]);
      ws.addRow(["MATERNITY LEAVE", maternityLeave, "LATE COMING COUNT", lateComingCount, "AUTO LOGOUT COUNT", autoLogoutCount, "ATTENDANCE - DAYS TO BE DEDUCT", daysToDeduct, "LEAVE ADJUSTED", leaveAdjusted]);
      ws.columns.forEach((c) => { c.width = 16; });

      // ── Sheet 2: Salary & Deduction (Part B) ──
      const ws2 = wb.addWorksheet("Salary Breakdown");
      ws2.addRow(["YEAR", new Date(fromDate || Date.now()).getFullYear(), "MONTH", monthLabel, "BANK NAME", "Not on file", "BANK ACC NUMBER", "Not on file"]);
      ws2.addRow(["EMPLOYEE CODE", employee.empCode, "BRANCH", "Surat", "DEPARTMENT", employee.role, "DESIGNATION", employee.role]);
      ws2.addRow(["EMPLOYEE NAME", employee.employeeName, "ACTUAL GROSS", gross, "EMPLOYEE CATEGORY", "ATTENDANCE FIX", "GENDER", "Not on file"]);
      ws2.addRow([]);
      ws2.addRow(["PAY HEAD", "ACTUAL FIX AMOUNT", "EARNING AMOUNT", "VARIABLE PAY HEAD", "EARNING AMOUNT", "DEDUCTION HEAD", "AMOUNT", "COMPANY'S PART", "AMOUNT"]);
      ws2.addRow(["Basic", salary.basic, salary.basic, "Traveling & Misc Expenses Reimbursement", 0, "EPF", salary.employeePF, "PF GROSS", salary.basic]);
      ws2.addRow(["HRA", salary.hra, salary.hra, "Sales Incentive", 0, "ESIC", salary.employeeESIC, "EPS", Math.round(salary.employerPF * 0.6389)]);
      ws2.addRow(["Conveyance Allowance", salary.conveyance, salary.conveyance, "Performance / Production Incentive", 0, "PT", salary.professionalTax, "EPF", Math.round(salary.employerPF * 0.3611)]);
      ws2.addRow(["Medical Allowance", salary.medical, salary.medical, "Overtime", 0, "LWF", compliance.deductions.lwf.employee, "ESIC GROSS", gross]);
      ws2.addRow(["Special Allowance", salary.specialAllowance, salary.specialAllowance, "Commission", 0, "TDS", compliance.deductions.tds.monthly, "ESIC (Employer)", salary.employerESIC]);
      ws2.addRow(["Uniform Allowance", 0, 0, "", "", "", "", "LWF (Employer)", compliance.deductions.lwf.employer]);
      ws2.addRow(["Washing Allowance", 0, 0]);
      ws2.addRow(["Helper Allowance", 0, 0]);
      ws2.addRow(["LTA", 0, 0]);
      ws2.addRow(["Education Allowance", 0, 0]);
      ws2.addRow(["STIPEND", 0, 0, "", "", "ATTENDANCE DEDUCTION", attendanceDeduction]);
      ws2.addRow([]);
      ws2.addRow(["EARNING", gross, "TOTAL EARNING", gross, "TOTAL DEDUCTION", totalDeduction + attendanceDeduction, "NET PAYABLE", netPayable]);
      ws2.addRow([]);
      ws2.addRow(["Note: Uniform/Washing/Helper Allowance, LTA, Education Allowance, Stipend, and variable pay (Incentive/Overtime/Commission)"]);
      ws2.addRow(["are not tracked as separate components in the current salary structure for this employee — shown as 0, not fabricated."]);
      ws2.columns.forEach((c) => { c.width = 22; });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Attendance_${employee.empCode}_${monthLabel.replace(" ", "_")}.xlsx`;
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

          {/* Day-by-day table — matches the reference column set */}
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-right px-2 py-2">SR</th>
                  <th className="text-left px-2 py-2">Date</th>
                  <th className="text-left px-2 py-2">Day</th>
                  <th className="text-center px-2 py-2">Type</th>
                  <th className="text-left px-2 py-2">In</th>
                  <th className="text-left px-2 py-2">Out</th>
                  <th className="text-left px-2 py-2">Hours</th>
                  <th className="text-right px-2 py-2">Late Count</th>
                  <th className="text-right px-2 py-2">Auto Logout</th>
                  <th className="text-center px-2 py-2">Sun/PH</th>
                  <th className="text-left px-2 py-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((r) => (
                  <tr key={r.date} className="border-t">
                    <td className="px-2 py-1 text-right text-gray-400">{r.sr}</td>
                    <td className="px-2 py-1">{r.date}</td>
                    <td className="px-2 py-1 text-gray-500">{r.day}</td>
                    <td className="px-2 py-1 text-center"><Badge className={CODE_COLORS[r.code]}>{r.code}</Badge></td>
                    <td className="px-2 py-1">{r.checkIn || "—"}</td>
                    <td className="px-2 py-1">{r.checkOut || "—"}</td>
                    <td className="px-2 py-1">{r.workingHours}</td>
                    <td className="px-2 py-1 text-right">{r.lateCount ?? ""}</td>
                    <td className="px-2 py-1 text-right">{r.autoLogoutCount ?? ""}</td>
                    <td className="px-2 py-1 text-center">{r.sundayPH}</td>
                    <td className="px-2 py-1 text-gray-500">{r.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Monthly summary block */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">Monthly Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><p className="text-gray-500">Total Days</p><p className="font-semibold">{totalDays}</p></div>
              <div><p className="text-gray-500">Working Days</p><p className="font-semibold">{workingDays}</p></div>
              <div><p className="text-gray-500">Paid Days</p><p className="font-semibold">{paidDays}</p></div>
              <div><p className="text-gray-500">Weekly Off</p><p className="font-semibold">{weeklyOff}</p></div>
              <div><p className="text-gray-500">Public Holiday</p><p className="font-semibold">{publicHoliday}</p></div>
              <div><p className="text-gray-500">Present Days</p><p className="font-semibold text-green-700">{presentDays}</p></div>
              <div><p className="text-gray-500">Absent Days</p><p className="font-semibold text-red-700">{absentDays}</p></div>
              <div><p className="text-gray-500">Leave With Salary</p><p className="font-semibold">{leaveWithSalary}</p></div>
              <div><p className="text-gray-500">Leave Without Pay</p><p className="font-semibold">{leaveWithoutPay}</p></div>
              <div><p className="text-gray-500">Maternity Leave</p><p className="font-semibold">{maternityLeave}</p></div>
              <div><p className="text-gray-500">Late Coming Count</p><p className="font-semibold">{lateComingCount}</p></div>
              <div><p className="text-gray-500">Auto Logout Count</p><p className="font-semibold">{autoLogoutCount}</p></div>
              <div><p className="text-gray-500">Days to be Deducted</p><p className="font-semibold text-red-700">{daysToDeduct}</p></div>
              <div><p className="text-gray-500">Leave Adjusted</p><p className="font-semibold">{leaveAdjusted}</p></div>
            </div>
          </div>

          {/* Salary & Deduction breakdown (Part B) */}
          <div>
            <button
              type="button"
              onClick={() => setShowSalary((v) => !v)}
              className="flex items-center gap-1 text-sm font-semibold text-purple-700 hover:underline mb-2"
            >
              {showSalary ? "▾" : "▸"} Salary &amp; Deduction Breakdown
            </button>
            {showSalary && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                <p className="text-xs text-purple-700">
                  Illustrative — this admin tool's seeded demo employees have no real salary/bank record on file.
                  Figures below are computed with the app's real payroll formulas from a role-based example gross
                  (₹{gross.toLocaleString("en-IN")}/month), the same way the reference template uses a fictional
                  "Mr. ABC". Bank details, incentives, and overtime show as blank/0 since there's nothing to pull.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div><p className="text-gray-500">Basic</p><p className="font-semibold">₹{salary.basic.toLocaleString("en-IN")}</p></div>
                  <div><p className="text-gray-500">HRA</p><p className="font-semibold">₹{salary.hra.toLocaleString("en-IN")}</p></div>
                  <div><p className="text-gray-500">Conveyance</p><p className="font-semibold">₹{salary.conveyance.toLocaleString("en-IN")}</p></div>
                  <div><p className="text-gray-500">Medical</p><p className="font-semibold">₹{salary.medical.toLocaleString("en-IN")}</p></div>
                  <div><p className="text-gray-500">Special Allowance</p><p className="font-semibold">₹{salary.specialAllowance.toLocaleString("en-IN")}</p></div>
                  <div><p className="text-gray-500">EPF (Employee)</p><p className="font-semibold text-red-600">-₹{salary.employeePF.toLocaleString("en-IN")}</p></div>
                  <div><p className="text-gray-500">ESIC (Employee)</p><p className="font-semibold text-red-600">-₹{salary.employeeESIC.toLocaleString("en-IN")}</p></div>
                  <div><p className="text-gray-500">Professional Tax</p><p className="font-semibold text-red-600">-₹{salary.professionalTax.toLocaleString("en-IN")}</p></div>
                  <div><p className="text-gray-500">TDS</p><p className="font-semibold text-red-600">-₹{compliance.deductions.tds.monthly.toLocaleString("en-IN")}</p></div>
                  <div><p className="text-gray-500">LWF (Employee)</p><p className="font-semibold text-red-600">-₹{compliance.deductions.lwf.employee.toLocaleString("en-IN")}</p></div>
                  <div><p className="text-gray-500">Attendance Deduction</p><p className="font-semibold text-red-600">-₹{attendanceDeduction.toLocaleString("en-IN")} ({daysToDeduct} days)</p></div>
                  <div className="col-span-2 sm:col-span-1"><p className="text-gray-500">Net Payable</p><p className="font-bold text-green-700">₹{netPayable.toLocaleString("en-IN")}</p></div>
                </div>
                <div className="border-t border-purple-200 pt-2 text-xs text-gray-500">
                  <p><strong>Employer's Part (not deducted from employee):</strong> EPF ₹{salary.employerPF.toLocaleString("en-IN")} · ESIC ₹{salary.employerESIC.toLocaleString("en-IN")} · LWF ₹{compliance.deductions.lwf.employer.toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AttendanceDetailModal;
