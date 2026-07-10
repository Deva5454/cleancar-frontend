/**
 * Attendance Excel Builder
 *
 * Builds the attendance + salary Excel workbook from the shared
 * computeAttendanceReport() pipeline (see attendanceReportCore.ts) — the
 * same computation the on-screen AttendanceReportPanel renders, so the
 * downloaded/shared file always matches what's on screen exactly.
 */
import type { EmployeeAttendanceRecord } from "../services/seedAttendanceData";
import { computeAttendanceReport } from "./attendanceReportCore";

export async function buildAttendanceExcelBlob(employee: EmployeeAttendanceRecord): Promise<{ blob: Blob; filename: string }> {
  const r = computeAttendanceReport(employee);

  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();

  const ws = wb.addWorksheet("Attendance Report");
  ws.addRow(["24/9 CAR WASHING PRIVATE LIMITED"]);
  ws.addRow(["132, Silver Plaza, Near Kim Chokdi, Olpad, Surat."]);
  ws.addRow([`ATTENDANCE REPORT FOR THE MONTH OF ${r.monthLabel}`]);
  ws.addRow(["EMPLOYEE CODE:", r.employee.empCode]);
  ws.addRow(["EMPLOYEE NAME:", r.employee.employeeName]);
  ws.addRow(["EMPLOYEE DEPARTMENT:", r.employee.role, "FROM DATE", r.fromDate, "TO DATE", r.toDate, "REPORT DATE:", new Date().toISOString().split("T")[0]]);
  ws.addRow([]);
  ws.addRow(["SR NO.", "DATE", "ATTENDANCE TYPE", "IN TIME", "OUT TIME", "WORKING HOURS", "LATE COMING COUNT", "AUTO LOGOUT COUNT", "SUNDAY / PH", "REMARKS"]);
  r.displayRows.forEach((row) => {
    ws.addRow([row.sr, row.date, row.code, row.checkIn, row.checkOut, row.workingHours, row.lateCount ?? "", row.autoLogoutCount ?? "", row.sundayPH, row.remarks]);
  });
  ws.addRow([]);
  ws.addRow(["TOTAL DAYS", r.totalDays, "PAID DAYS", r.paidDays, "WEEKLY OFF", r.weeklyOff, "PUBLIC HOLIDAY", r.publicHoliday]);
  ws.addRow(["WORKING DAYS", r.workingDays]);
  ws.addRow(["PRESENT DAYS", r.presentDays, "ABSENT DAYS", r.absentDays, "LEAVE WITH SALARY", r.leaveWithSalary, "LEAVE WITHOUT PAY", r.leaveWithoutPay]);
  ws.addRow([]);
  ws.addRow(["MATERNITY LEAVE", r.maternityLeave, "LATE COMING COUNT", r.lateComingCount, "AUTO LOGOUT COUNT", r.autoLogoutCount, "ATTENDANCE - DAYS TO BE DEDUCT", r.daysToDeduct, "LEAVE ADJUSTED", r.leaveAdjusted]);
  ws.addRow(["ATTENDANCE - DAYS DEDUCTED", r.daysToDeduct]);
  ws.addRow([]);
  ws.addRow(["FULL CSL", "HALF CSL", "FULL PL", "HALF HPL", "FULL COFF", "HALF COFF", "PUBLIC HOLIDAY", "FULL LWP", "HALF LWP"]);
  ws.addRow([r.typeCounts.fullCSL, r.typeCounts.halfCSL, r.typeCounts.fullPL, r.typeCounts.halfHPL, r.typeCounts.fullCOFF, r.typeCounts.halfCOFF, r.typeCounts.publicHoliday, r.typeCounts.fullLWP, r.typeCounts.halfLWP]);
  ws.columns.forEach((c) => { c.width = 16; });

  const ws2 = wb.addWorksheet("Salary Breakdown");
  ws2.addRow(["YEAR", new Date(r.fromDate || Date.now()).getFullYear(), "MONTH", r.monthLabel, "BANK NAME", "Not on file", "BANK ACC NUMBER", "Not on file"]);
  ws2.addRow(["EMPLOYEE CODE", r.employee.empCode, "BRANCH", "Surat", "DEPARTMENT", r.employee.role, "DESIGNATION", r.employee.role]);
  ws2.addRow(["EMPLOYEE NAME", r.employee.employeeName, "ACTUAL GROSS", r.gross, "EMPLOYEE CATEGORY", "ATTENDANCE FIX", "GENDER", "Not on file"]);
  ws2.addRow([]);
  ws2.addRow(["PAY HEAD", "ACTUAL FIX AMOUNT", "EARNING AMOUNT", "VARIABLE PAY HEAD", "EARNING AMOUNT", "DEDUCTION HEAD", "AMOUNT", "COMPANY'S PART", "AMOUNT"]);
  ws2.addRow(["Basic", r.fix.basic, r.earnBasic, "Traveling & Misc Expenses Reimbursement", 0, "EPF", r.employeePF, "PF GROSS", r.earnBasic, "IN CASE EMPLOYEE'S PF FLAG IS YES"]);
  ws2.addRow(["HRA", r.fix.hra, r.earnHRA, "Sales Incentive", 0, "ESIC", r.employeeESIC, "EPS", r.employerEPS]);
  ws2.addRow(["Uniform Allowance", 0, 0, "Performance / Production Incentive", 0, "PT", r.compliance.deductions.pt.amount, "EPF", r.employerEPFResidual]);
  ws2.addRow(["Washing Allowance", 0, 0, "Overtime", 0, "LWF", r.compliance.deductions.lwf.employee, "ESIC GROSS", r.totalEarning, "IN CASE EMPLOYEE'S ESIC FLAG IS YES"]);
  ws2.addRow(["Conveyance Allowance", r.fix.conveyance, r.earnConveyance, "Commission", 0, "TDS", r.compliance.deductions.tds.monthly, "ESIC", r.employerESIC]);
  ws2.addRow(["Medical Allowance", r.fix.medical, r.earnMedical, "OTHER DEDUCTION", 0, "SUR CHARGE", 0, "LWF", r.compliance.deductions.lwf.employer]);
  ws2.addRow(["Special Allowance", r.fix.specialAllowance, r.earnSpecial, "", "", "EDU CESS", 0]);
  ws2.addRow(["Helper Allowance", 0, 0, "", "", "LOAN", 0]);
  ws2.addRow(["LTA", 0, 0, "", "", "ADVANCE", 0]);
  ws2.addRow(["Education Allowance", 0, 0]);
  ws2.addRow(["STIPEND", 0, 0, "", "", "ATTENDANCE DEDUCTION", r.attendanceDeduction]);
  ws2.addRow([]);
  ws2.addRow(["EARNING", r.totalEarning, "TOTAL EARNING", r.totalEarning, "TOTAL DEDUCTION", r.totalDeduction, "NET PAYABLE", r.netPayable]);
  ws2.addRow([]);
  ws2.addRow(["Note: Uniform/Washing/Helper Allowance, LTA, Education Allowance, Stipend, and variable pay (Incentive/Overtime/Commission)"]);
  ws2.addRow(["are not tracked as separate components in the current salary structure for this employee — shown as 0, not fabricated."]);
  ws2.columns.forEach((c) => { c.width = 22; });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const filename = `Attendance_${r.employee.empCode}_${r.monthLabel.replace(" ", "_")}.xlsx`;
  return { blob, filename };
}
