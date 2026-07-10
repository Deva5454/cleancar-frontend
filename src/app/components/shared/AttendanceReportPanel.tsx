/**
 * Attendance Report Panel
 *
 * The shared on-screen report — summary badges, code legend, day-by-day
 * table, monthly summary, and compact payslip — used identically by both
 * the Attendance View modal and the Payroll Review "View" modal. Extracted
 * so the two screens can never visually drift apart again; they render
 * this exact same component.
 */
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Info } from "lucide-react";
import type { EmployeeAttendanceRecord } from "../../services/seedAttendanceData";
import { computeAttendanceReport, CODE_LABELS, CODE_COLORS, type CanonicalCode } from "../../utils/attendanceReportCore";

export function AttendanceReportPanel({ employee }: { employee: EmployeeAttendanceRecord }) {
  const [showLegend, setShowLegend] = useState(false);
  const [showSalary, setShowSalary] = useState(true);

  const {
    displayRows, counts, monthLabel, totalDays, weeklyOff, publicHoliday, workingDays,
    presentDays, absentDays, leaveWithSalary, leaveWithoutPay, maternityLeave, paidDays,
    lateComingCount, autoLogoutCount, leaveAdjusted, daysToDeduct, typeCounts,
    gross, earnBasic, earnHRA, earnConveyance, earnMedical, earnSpecial, totalEarning,
    compliance, employeePF, employeeESIC, employerEPS, employerEPFResidual, employerESIC,
    attendanceDeduction, totalDeduction, netPayable,
  } = computeAttendanceReport(employee);

  return (
    <div className="space-y-4">
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

          {/* Salary & Deduction breakdown (Part B) — compact payslip layout */}
          <div>
            <button
              type="button"
              onClick={() => setShowSalary((v) => !v)}
              className="flex items-center gap-1 text-sm font-semibold text-purple-700 hover:underline mb-2"
            >
              {showSalary ? "▾" : "▸"} Salary &amp; Deduction Breakdown
            </button>
            {showSalary && (
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden text-xs">
                {/* Payslip header strip */}
                <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{employee.employeeName} ({employee.empCode})</p>
                    <p className="text-gray-300">{employee.role} · {monthLabel}</p>
                  </div>
                  <div className="text-right text-gray-300">
                    <p>Paid Days: {paidDays}/{totalDays}</p>
                    <p title="Illustrative example gross — no real salary record on file for this seeded demo employee">
                      Gross (Fix): ₹{gross.toLocaleString("en-IN")} ⓘ
                    </p>
                  </div>
                </div>

                {/* Earnings | Deductions side by side */}
                <div className="grid grid-cols-2 divide-x divide-gray-300">
                  <div>
                    <div className="bg-green-50 px-3 py-1 font-semibold text-green-800 border-b border-gray-300">EARNINGS</div>
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-100"><td className="px-3 py-1">Basic</td><td className="px-3 py-1 text-right">₹{earnBasic.toLocaleString("en-IN")}</td></tr>
                        <tr className="border-b border-gray-100"><td className="px-3 py-1">HRA</td><td className="px-3 py-1 text-right">₹{earnHRA.toLocaleString("en-IN")}</td></tr>
                        <tr className="border-b border-gray-100"><td className="px-3 py-1">Conveyance</td><td className="px-3 py-1 text-right">₹{earnConveyance.toLocaleString("en-IN")}</td></tr>
                        <tr className="border-b border-gray-100"><td className="px-3 py-1">Medical</td><td className="px-3 py-1 text-right">₹{earnMedical.toLocaleString("en-IN")}</td></tr>
                        <tr><td className="px-3 py-1">Special Allowance</td><td className="px-3 py-1 text-right">₹{earnSpecial.toLocaleString("en-IN")}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <div className="bg-red-50 px-3 py-1 font-semibold text-red-800 border-b border-gray-300">DEDUCTIONS</div>
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-100"><td className="px-3 py-1">EPF</td><td className="px-3 py-1 text-right">₹{employeePF.toLocaleString("en-IN")}</td></tr>
                        <tr className="border-b border-gray-100"><td className="px-3 py-1">ESIC</td><td className="px-3 py-1 text-right">₹{employeeESIC.toLocaleString("en-IN")}</td></tr>
                        <tr className="border-b border-gray-100"><td className="px-3 py-1">Professional Tax</td><td className="px-3 py-1 text-right">₹{compliance.deductions.pt.amount.toLocaleString("en-IN")}</td></tr>
                        <tr className="border-b border-gray-100"><td className="px-3 py-1">TDS / LWF</td><td className="px-3 py-1 text-right">₹{(compliance.deductions.tds.monthly + compliance.deductions.lwf.employee).toLocaleString("en-IN")}</td></tr>
                        <tr><td className="px-3 py-1">Attendance Ded. ({daysToDeduct}d)</td><td className="px-3 py-1 text-right">₹{attendanceDeduction.toLocaleString("en-IN")}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Gross / Total Deduction subtotal strip */}
                <div className="grid grid-cols-2 divide-x divide-gray-300 border-t-2 border-gray-300 font-semibold bg-gray-50">
                  <div className="px-3 py-1.5 flex justify-between"><span>Gross Earnings</span><span>₹{totalEarning.toLocaleString("en-IN")}</span></div>
                  <div className="px-3 py-1.5 flex justify-between"><span>Total Deductions</span><span>₹{totalDeduction.toLocaleString("en-IN")}</span></div>
                </div>

                {/* Net pay bar */}
                <div className="bg-purple-700 text-white px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold">NET PAY</span>
                  <span className="text-lg font-bold">₹{netPayable.toLocaleString("en-IN")}</span>
                </div>

                {/* Compact footnotes */}
                <div className="px-3 py-1.5 text-[10px] text-gray-500 bg-gray-50 border-t border-gray-200 space-y-0.5">
                  <p>Employer's part (not deducted): EPS ₹{employerEPS.toLocaleString("en-IN")} · EPF ₹{employerEPFResidual.toLocaleString("en-IN")} · ESIC ₹{employerESIC.toLocaleString("en-IN")} · LWF ₹{compliance.deductions.lwf.employer.toLocaleString("en-IN")}</p>
                  <p>Type counts — CSL {typeCounts.fullCSL}F/{typeCounts.halfCSL}H · PL {typeCounts.fullPL}F/{typeCounts.halfHPL}H · COFF {typeCounts.fullCOFF}F/{typeCounts.halfCOFF}H · PH {typeCounts.publicHoliday} · LWP {typeCounts.fullLWP}F/{typeCounts.halfLWP}H</p>
                  <p>Illustrative demo figures — no real salary/bank record on file for this seeded employee.</p>
                </div>
              </div>
            )}
          </div>

    </div>
  );
}

export default AttendanceReportPanel;
