/**
 * Attendance Excel Builder
 *
 * Single source of truth for building an employee's attendance + salary
 * Excel workbook. Extracted from AttendanceDetailModal.tsx so the
 * "Download Excel" button there and the "Send" (Web Share) feature in
 * AttendanceDataManager.tsx always produce the exact same file — no risk
 * of the two drifting apart into different formats over time.
 */
import type { EmployeeAttendanceRecord } from "../services/seedAttendanceData";
import {
  normalizeCode, dayOfWeekName, computeWorkingHours, illustrativeGrossForRole, remarksFor,
  type CanonicalCode,
} from "../components/admin/AttendanceDetailModal";
import { calculateCTCFromGross } from "../config/salaryComponentConfiguration";
import { calculateStatutoryDeductions } from "../services/payroll/complianceEngine";
import { detectStateFromCity } from "../services/payroll/complianceRules";

export async function buildAttendanceExcelBlob(employee: EmployeeAttendanceRecord): Promise<{ blob: Blob; filename: string }> {
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

  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();

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
  ws.addRow(["ATTENDANCE - DAYS DEDUCTED", daysToDeduct]);
  ws.addRow([]);
  ws.addRow(["FULL CSL", "HALF CSL", "FULL PL", "HALF HPL", "FULL COFF", "HALF COFF", "PUBLIC HOLIDAY", "FULL LWP", "HALF LWP"]);
  ws.addRow([typeCounts.fullCSL, typeCounts.halfCSL, typeCounts.fullPL, typeCounts.halfHPL, typeCounts.fullCOFF, typeCounts.halfCOFF, typeCounts.publicHoliday, typeCounts.fullLWP, typeCounts.halfLWP]);
  ws.columns.forEach((c) => { c.width = 16; });

  const ws2 = wb.addWorksheet("Salary Breakdown");
  ws2.addRow(["YEAR", new Date(fromDate || Date.now()).getFullYear(), "MONTH", monthLabel, "BANK NAME", "Not on file", "BANK ACC NUMBER", "Not on file"]);
  ws2.addRow(["EMPLOYEE CODE", employee.empCode, "BRANCH", "Surat", "DEPARTMENT", employee.role, "DESIGNATION", employee.role]);
  ws2.addRow(["EMPLOYEE NAME", employee.employeeName, "ACTUAL GROSS", gross, "EMPLOYEE CATEGORY", "ATTENDANCE FIX", "GENDER", "Not on file"]);
  ws2.addRow([]);
  ws2.addRow(["PAY HEAD", "ACTUAL FIX AMOUNT", "EARNING AMOUNT", "VARIABLE PAY HEAD", "EARNING AMOUNT", "DEDUCTION HEAD", "AMOUNT", "COMPANY'S PART", "AMOUNT"]);
  ws2.addRow(["Basic", fix.basic, earnBasic, "Traveling & Misc Expenses Reimbursement", 0, "EPF", employeePF, "PF GROSS", earnBasic, "IN CASE EMPLOYEE'S PF FLAG IS YES"]);
  ws2.addRow(["HRA", fix.hra, earnHRA, "Sales Incentive", 0, "ESIC", employeeESIC, "EPS", employerEPS]);
  ws2.addRow(["Uniform Allowance", 0, 0, "Performance / Production Incentive", 0, "PT", compliance.deductions.pt.amount, "EPF", employerEPFResidual]);
  ws2.addRow(["Washing Allowance", 0, 0, "Overtime", 0, "LWF", compliance.deductions.lwf.employee, "ESIC GROSS", totalEarning, "IN CASE EMPLOYEE'S ESIC FLAG IS YES"]);
  ws2.addRow(["Conveyance Allowance", fix.conveyance, earnConveyance, "Commission", 0, "TDS", compliance.deductions.tds.monthly, "ESIC", employerESIC]);
  ws2.addRow(["Medical Allowance", fix.medical, earnMedical, "OTHER DEDUCTION", 0, "SUR CHARGE", 0, "LWF", compliance.deductions.lwf.employer]);
  ws2.addRow(["Special Allowance", fix.specialAllowance, earnSpecial, "", "", "EDU CESS", 0]);
  ws2.addRow(["Helper Allowance", 0, 0, "", "", "LOAN", 0]);
  ws2.addRow(["LTA", 0, 0, "", "", "ADVANCE", 0]);
  ws2.addRow(["Education Allowance", 0, 0]);
  ws2.addRow(["STIPEND", 0, 0, "", "", "ATTENDANCE DEDUCTION", attendanceDeduction]);
  ws2.addRow([]);
  ws2.addRow(["EARNING", totalEarning, "TOTAL EARNING", totalEarning, "TOTAL DEDUCTION", totalDeduction, "NET PAYABLE", netPayable]);
  ws2.addRow([]);
  ws2.addRow(["Note: Uniform/Washing/Helper Allowance, LTA, Education Allowance, Stipend, and variable pay (Incentive/Overtime/Commission)"]);
  ws2.addRow(["are not tracked as separate components in the current salary structure for this employee — shown as 0, not fabricated."]);
  ws2.columns.forEach((c) => { c.width = 22; });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const filename = `Attendance_${employee.empCode}_${monthLabel.replace(" ", "_")}.xlsx`;
  return { blob, filename };
}
