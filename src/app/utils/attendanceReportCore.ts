/**
 * Attendance Report Core
 *
 * Single source of truth for the attendance/salary report's data model,
 * constants, and computation pipeline. Used by:
 * - AttendanceReportPanel.tsx (the shared on-screen render, used by both
 *   the Attendance View modal and the Payroll Review "View" modal)
 * - attendanceExcelBuilder.ts (the Excel export, used by Download and the
 *   Web Share "Send" feature)
 *
 * Keeping the math in exactly one place means the screen and the exported
 * file — and now both screens that show this report — can never drift
 * apart from each other again.
 */
import type { EmployeeAttendanceRecord } from "../services/seedAttendanceData";
import { calculateCTCFromGross } from "../config/salaryComponentConfiguration";
import { calculateStatutoryDeductions } from "../services/payroll/complianceEngine";
import { detectStateFromCity } from "../services/payroll/complianceRules";

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

export function illustrativeGrossForRole(role: string): number {
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

export function remarksFor(code: CanonicalCode): string {
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

export interface AttendanceReportData {
  employee: EmployeeAttendanceRecord;
  displayRows: Array<{
    sr: number; date: string; day: string; code: CanonicalCode;
    checkIn: string; checkOut: string; workingHours: string;
    lateCount?: number; autoLogoutCount?: number; sundayPH: string; remarks: string;
  }>;
  counts: Partial<Record<CanonicalCode, number>>;
  monthLabel: string; fromDate: string; toDate: string;
  totalDays: number; weeklyOff: number; publicHoliday: number; workingDays: number;
  presentDays: number; absentDays: number; leaveWithSalary: number; leaveWithoutPay: number;
  maternityLeave: number; paidDays: number; lateComingCount: number; autoLogoutCount: number;
  leaveAdjusted: number; daysToDeduct: number;
  typeCounts: {
    fullCSL: number; halfCSL: number; fullPL: number; halfHPL: number;
    fullCOFF: number; halfCOFF: number; publicHoliday: number; fullLWP: number; halfLWP: number;
  };
  gross: number;
  fix: ReturnType<typeof calculateCTCFromGross>;
  earnBasic: number; earnHRA: number; earnConveyance: number; earnMedical: number; earnSpecial: number;
  totalEarning: number;
  compliance: ReturnType<typeof calculateStatutoryDeductions>;
  employeePF: number; employeeESIC: number; employerEPS: number; employerEPFResidual: number; employerESIC: number;
  attendanceDeduction: number; totalDeduction: number; netPayable: number;
}

export function computeAttendanceReport(employee: EmployeeAttendanceRecord): AttendanceReportData {
  const rows = employee.dailyAttendance
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, code: normalizeCode(d.status) }));

  let lateRunning = 0;
  let autoLogoutRunning = 0;
  const displayRows = rows.map((r, idx) => {
    const workingHours = computeWorkingHours(r.checkIn, r.checkOut);
    const isLate = (r.lateMinutes || 0) > 0;
    if (isLate) lateRunning += 1;
    const isAutoLogout = !!r.checkIn && !r.checkOut;
    if (isAutoLogout) autoLogoutRunning += 1;
    return {
      sr: idx + 1, date: r.date, day: dayOfWeekName(r.date), code: r.code,
      checkIn: r.checkIn || "", checkOut: r.checkOut || "", workingHours,
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

  const counts: Partial<Record<CanonicalCode, number>> = {};
  rows.forEach((r) => { counts[r.code] = (counts[r.code] || 0) + 1; });

  const totalDays = rows.length;
  const weeklyOff = counts.WOFF || 0;
  const publicHoliday = counts.PH || 0;
  const workingDays = totalDays - weeklyOff - publicHoliday;
  const presentDays = (counts.P || 0) + 0.5 * (counts.H || 0) + 0.5 * (counts.HPL || 0) + 0.5 * (counts.HCSL || 0) + 0.5 * (counts.HCOFF || 0);
  const absentDays = counts.A || 0;
  const leaveWithSalary = (counts.PL || 0) + (counts.CSL || 0) + (counts.COFF || 0) + (counts.MTL || 0);
  const leaveWithoutPay = (counts.LWP || 0) + 0.5 * (counts.HLWP || 0);
  const maternityLeave = counts.MTL || 0;
  const paidDays = totalDays - leaveWithoutPay - absentDays;
  const lateComingCount = lateRunning;
  const autoLogoutCount = autoLogoutRunning;
  const leaveAdjusted = (counts.PLRG || 0) + 0.5 * (counts.HPLRG || 0);
  const daysToDeduct = absentDays + leaveWithoutPay;

  const typeCounts = {
    fullCSL: counts.CSL || 0, halfCSL: counts.HCSL || 0,
    fullPL: counts.PL || 0, halfHPL: counts.HPL || 0,
    fullCOFF: counts.COFF || 0, halfCOFF: counts.HCOFF || 0,
    publicHoliday: counts.PH || 0,
    fullLWP: counts.LWP || 0, halfLWP: counts.HLWP || 0,
  };

  const gross = illustrativeGrossForRole(employee.role);
  const fix = calculateCTCFromGross(gross);
  const paidRatio = totalDays > 0 ? paidDays / totalDays : 1;

  const earnBasic = Math.round(fix.basic * paidRatio);
  const earnHRA = Math.round(fix.hra * paidRatio);
  const earnConveyance = Math.round(fix.conveyance * paidRatio);
  const earnMedical = Math.round(fix.medical * paidRatio);
  const earnSpecial = Math.round(fix.specialAllowance * paidRatio);
  const totalEarning = earnBasic + earnHRA + earnConveyance + earnMedical + earnSpecial;

  const state = detectStateFromCity("surat");
  const compliance = calculateStatutoryDeductions(
    state,
    { basic: earnBasic, hra: earnHRA, conveyance: earnConveyance, medicalAllowance: earnMedical, specialAllowance: earnSpecial, otherAllowances: 0 },
    totalEarning * 12
  );
  const employeePF = Math.round(earnBasic * 0.12);
  const employeeESIC = Math.round(totalEarning * 0.0075);
  const employerEPS = Math.round(earnBasic * 0.0833);
  const employerEPFResidual = Math.round(earnBasic * 0.0367);
  const employerESIC = Math.round(totalEarning * 0.0325);

  const perDayGross = totalDays > 0 ? gross / totalDays : 0;
  const attendanceDeduction = Math.round(perDayGross * daysToDeduct);
  const totalDeduction = employeePF + employeeESIC + compliance.deductions.pt.amount + compliance.deductions.tds.monthly + compliance.deductions.lwf.employee + attendanceDeduction;
  const netPayable = totalEarning - totalDeduction;

  return {
    employee, displayRows, counts, monthLabel, fromDate, toDate,
    totalDays, weeklyOff, publicHoliday, workingDays, presentDays, absentDays,
    leaveWithSalary, leaveWithoutPay, maternityLeave, paidDays, lateComingCount,
    autoLogoutCount, leaveAdjusted, daysToDeduct, typeCounts,
    gross, fix, earnBasic, earnHRA, earnConveyance, earnMedical, earnSpecial, totalEarning,
    compliance, employeePF, employeeESIC, employerEPS, employerEPFResidual, employerESIC,
    attendanceDeduction, totalDeduction, netPayable,
  };
}
