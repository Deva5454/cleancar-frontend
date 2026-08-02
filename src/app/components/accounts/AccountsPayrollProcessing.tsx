import { BackButton } from "../ui/back-button";
/**
 * Accounts Payroll Processing Screen
 *
 * Shows LIMITED snapshot data only:
 * - Employee Name
 * - Bank Details (Bank Name, Account Number, IFSC Code)
 * - Total Pay
 *
 * Action: Mark as Paid
 *
 * @component
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { DollarSign, CheckCircle2, ArrowRight, PlusCircle, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { otherAdjustmentsService } from "../../services/otherAdjustmentsService";
import { useCity } from "../../contexts/CityContext";
import { usePayroll } from "../../contexts/PayrollContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { accountingEntryService } from "../../services/accountingEntryService";
import { useRole } from "../../contexts/RoleContext";


export function AccountsPayrollProcessing() {
  const navigate = useNavigate();
  const { city, cityInfo } = useCity();
  const { currentUser } = useRole();
  const { payrollRuns, disbursePayroll } = usePayroll();
  const { employees } = useEmployee();

  // Real PayrollRun records are one-per-employee, keyed by cityId/status/month
  // (there's no single "run" object with a nested .employees array — that
  // shape never existed on the real type, so this screen used to always
  // render its "no approved payroll runs" empty state regardless of what
  // was actually approved). Group every "approved" run for this city in
  // the most recent approved month into one snapshot for display.
  const approvedRuns = payrollRuns.filter(r => r.cityId === city && r.status === "approved");
  const latestMonth = [...approvedRuns].sort((a, b) => b.month.localeCompare(a.month))[0]?.month;
  const monthRuns = latestMonth ? approvedRuns.filter(r => r.month === latestMonth) : [];

  const snapshot = monthRuns.length > 0 ? {
    id: `SNAP-${latestMonth}-${city}`,
    month: latestMonth,
    year: latestMonth.split("-")[0],
    city: cityInfo.displayName,
    status: "approved" as const,
    employees: monthRuns.map((run) => {
      const empDetails = employees.find(e => e.employeeId === run.employeeId);
      return {
        snapshotId: `SNAP-${run.payrollId}`,
        employeeId: run.employeeId,
        employeeName: empDetails ? `${empDetails.firstName} ${empDetails.lastName}` : run.employeeId,
        role: empDetails?.designation || "Employee",
        bankName: empDetails?.bankDetails?.bankName || "",
        accountNumber: empDetails?.bankDetails?.accountNumber || "",
        ifscCode: empDetails?.bankDetails?.ifscCode || "",
        basePay: run.baseSalary || 0,
        incentive: run.incentiveAmount || 0,
        deductions: run.totalDeductions || 0,
        totalPay: run.netSalary || 0,
        generatedAt: run.approvedAt || run.createdAt,
        generatedBy: "Payroll Engine",
        units: 0,
        validUnits: 0,
        complianceScore: 0,
        complianceAdjustment: 0,
      };
    }),
    totalEmployees: monthRuns.length,
    totalPayout: monthRuns.reduce((sum, run) => sum + (run.netSalary || 0), 0),
    generatedAt: monthRuns[0]?.approvedAt || monthRuns[0]?.createdAt,
    generatedBy: "Payroll Processing Engine",
  } : null;

  const [adjustmentsSummary, setAdjustmentsSummary] = useState({
    advances: 0,
    otherEarnings: 0,
    otherDeductions: 0,
    netImpact: 0,
  });

  // Calculate adjustments for this month
  useEffect(() => {
    if (!snapshot) return;
    // Real advances already deducted in these payroll runs — PayrollRun.tsx
    // wires the real EMI/short-term-advance amount into run.advances at
    // generation time, so summing it here reflects what was actually
    // deducted, rather than re-querying advanceManagementService fresh
    // (which risks double-counting or diverging from what the run used).
    const advances = monthRuns.reduce((sum, run) => sum + (run.advances || 0), 0);

    // Get current month adjustments
    const allEarnings = otherAdjustmentsService.getAllEarnings();
    const allDeductions = otherAdjustmentsService.getAllDeductions();

    // Filter for current month (April 2026 from snapshot)
    const currentMonthEarnings = allEarnings.filter(
      r => r.payrollMonth === `${snapshot.month} ${snapshot.year}`
    );
    const currentMonthDeductions = allDeductions.filter(
      r => r.payrollMonth === `${snapshot.month} ${snapshot.year}`
    );

    const totalEarnings = currentMonthEarnings.reduce((sum, r) => sum + r.amount, 0);
    const totalDeductions = currentMonthDeductions.reduce((sum, r) => sum + r.amount, 0);

    setAdjustmentsSummary({
      advances,
      otherEarnings: totalEarnings,
      otherDeductions: totalDeductions,
      netImpact: totalEarnings - totalDeductions,
    });
  }, [snapshot]);

  const handleMarkAsPaid = () => {
    if (!snapshot) return;

    // ── Resolve ledgers needed for payroll posting ──────────────────────────
    const allLedgers = accountingEntryService.getLedgers(city);

    const salaryLedger = allLedgers.find(
      l => l.name === "Salaries and Employee Wages" && l.nature === "expense"
    );
    const bankLedger = allLedgers.find(
      l => l.name === "Axis Bank" && l.type === "bank"
    );
    const tdsLedger = allLedgers.find(
      l => l.name === "TDS Payable"
    );
    const pfLedger = allLedgers.find(l => l.name === "PF Payable (Employee + Employer)");
    const esicLedger = allLedgers.find(l => l.name === "ESIC Payable (Employee + Employer)");
    const ptLedger = allLedgers.find(l => l.name === "PT Payable");

    if (!salaryLedger || !bankLedger) {
      toast.error(
        "Required ledgers not found (Salaries and Employee Wages / Axis Bank). " +
        "Please initialize system ledgers in Ledger Master before processing payroll."
      );
      return;
    }

    const payDate = new Date().toISOString().split("T")[0];
    const monthYear = `${snapshot.month} ${snapshot.year}`;

    // ── Journal 1: Salary expense accrual ───────────────────────────────────
    // DR Salaries & Wages (gross), CR Axis Bank (net), CR TDS Payable (if any)
    const totalGross = snapshot?.employees?.reduce(
      (sum, e) => sum + (e.basePay + (e.incentive ?? 0) + (e.complianceAdjustment ?? 0)),
      0
    );
    const totalDeductions = snapshot?.employees?.reduce(
      (sum, e) => sum + (e.deductions ?? 0),
      0
    );
    const totalNet = snapshot.totalPayout;

    // Real per-employee PF/ESIC/PT/TDS split — these already exist as
    // separate fields on every real PayrollRun record. Previously the
    // entire combined `deductions` total was credited to the generic TDS
    // Payable ledger as a "proxy" for all four, so PF/ESIC/PT liability
    // never landed on its own real ledger.
    const totalPF  = monthRuns.reduce((sum, run) => sum + (run.pf  || 0), 0);
    const totalESIC = monthRuns.reduce((sum, run) => sum + (run.esic || 0), 0);
    const totalPT  = monthRuns.reduce((sum, run) => sum + (run.pt  || 0), 0);
    const totalTDS = monthRuns.reduce((sum, run) => sum + (run.tds || 0), 0);

    const accrualLines: Array<{ accountHead: string; accountLabel: string; debit: number; credit: number }> = [
      {
        accountHead: salaryLedger.id,
        accountLabel: salaryLedger.name,
        debit: totalGross,
        credit: 0,
      },
    ];

    // Credit each real statutory deduction to its own real ledger, not a
    // single generic proxy.
    if (totalPF > 0 && pfLedger) {
      accrualLines.push({ accountHead: pfLedger.id, accountLabel: pfLedger.name, debit: 0, credit: totalPF });
    }
    if (totalESIC > 0 && esicLedger) {
      accrualLines.push({ accountHead: esicLedger.id, accountLabel: esicLedger.name, debit: 0, credit: totalESIC });
    }
    if (totalPT > 0 && ptLedger) {
      accrualLines.push({ accountHead: ptLedger.id, accountLabel: ptLedger.name, debit: 0, credit: totalPT });
    }
    if (totalTDS > 0 && tdsLedger) {
      accrualLines.push({ accountHead: tdsLedger.id, accountLabel: tdsLedger.name, debit: 0, credit: totalTDS });
    }
    // Any deduction amount not covered by the four real statutory fields
    // above (e.g. advances/penalties baked into `deductions`) still needs
    // a home so the entry balances — falls back to TDS Payable as the
    // closest existing generic liability bucket, same as before, but only
    // for the genuine remainder instead of the whole amount.
    const unaccountedDeductions = totalDeductions - totalPF - totalESIC - totalPT - totalTDS;
    if (unaccountedDeductions > 0.01 && tdsLedger) {
      accrualLines.push({ accountHead: tdsLedger.id, accountLabel: tdsLedger.name, debit: 0, credit: unaccountedDeductions });
    }

    // Credit net pay to bank
    accrualLines.push({
      accountHead: bankLedger.id,
      accountLabel: bankLedger.name,
      debit: 0,
      credit: totalNet,
    });

    // TDS Payable module detects which section (194C/194J/192 etc.) a TDS
    // credit belongs to by scanning this narration for the section code —
    // salary TDS is real income-tax TDS too, just under section 192 rather
    // than a vendor-invoice section, so it needs the same real tag or it
    // falls into an unlabelled "Other" bucket there.
    const tdsSectionTag = (totalTDS > 0 || unaccountedDeductions > 0.01) && tdsLedger ? " | TDS u/s 192" : "";

    accountingEntryService.createJournal(
      {
        date: payDate,
        narration: `Payroll disbursement — ${monthYear} | ${snapshot.city} | ${snapshot.totalEmployees} employees | Gross ₹${totalGross.toLocaleString()} | Net ₹${totalNet.toLocaleString()}${tdsSectionTag}`,
        lines: accrualLines,
        city: cityInfo.displayName,
        cityId: city,
        createdBy: currentUser?.name || "Accounts",
      },
      cityInfo.displayName
    );

    // ── Also write to FinanceContext via the existing CustomEvent bridge ─────
    // FinanceContext listens for "payroll-approved" to create a Payable of
    // type "Salary" — this is what feeds CityComparison, BreakEvenAnalysis,
    // and UnitEconomicsDashboard cost breakdown with real labour cost.
    // We dispatch one event per employee so FinanceContext can track individually.
    snapshot?.employees?.forEach(emp => {
      window.dispatchEvent(new CustomEvent("payroll-approved", {
        detail: {
          employeeId:  emp.employeeId,
          amount:      emp.totalPay,
          dueDate:     payDate,
          cityId:      city,
          description: `Salary — ${emp.employeeName} | ${monthYear}`,
        },
      }));
    });

    // Disburse every run in this snapshot through the typed workflow engine
    // (approved -> disbursed) — this is the same engine PayrollReviewScreen/
    // SuperAdminPayrollApproval use, so status stays consistent and the run
    // becomes immutable per payrollWorkflow's VALID_TRANSITIONS. The old
    // updatePayrollStatus(latestRun.id, ...) call referenced a payrollId
    // that never existed on the real type (latestRun.id), so it silently
    // updated nothing.
    const paymentReference = `PAY-${payDate}-${Date.now().toString(36)}`;
    let failed = 0;
    monthRuns.forEach((run) => {
      if (!disbursePayroll(run.payrollId, currentUser?.name || "Accounts", paymentReference)) failed++;
    });

    // Note: `snapshot` is a derived value recomputed from `payrollRuns` each
    // render (see its definition above), not React state — it will
    // recompute with the new "disbursed" status on next render since
    // disbursePayroll() above updates PayrollContext's real state.
    if (failed > 0) {
      toast.error(`${failed} of ${monthRuns.length} payroll(s) could not be disbursed — check role permissions`);
      return;
    }

    toast.success(
      `Payroll of ₹${totalNet.toLocaleString()} posted to ledger and marked as paid. ` +
      `Journal entry created for ${snapshot.totalEmployees} employees.`
    );
  };

  if (!snapshot) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Accounts Payroll Processing</h2>
            <p className="text-sm text-gray-600 mt-1">
              Process approved payroll payments
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No approved payroll runs found for this city.</p>
            <p className="text-sm text-gray-400 mt-2">Approved payroll runs will appear here for processing.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <BackButton />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accounts Payroll Processing</h2>
          <p className="text-sm text-gray-600 mt-1">
            Process approved payroll payments
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="text-sm">Accounts View</span>
        </Badge>
      </div>

      {/* Snapshot Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Snapshot ID</p>
              <p className="text-base font-semibold text-gray-900">{snapshot.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Period</p>
              <p className="text-base font-semibold text-gray-900">{snapshot.month} {snapshot.year}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-base font-semibold text-gray-900">{snapshot.totalEmployees}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Payout</p>
              <p className="text-base font-semibold text-green-600">₹{(snapshot?.totalPayout ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Adjustments This Month */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-blue-900">Payroll Adjustments This Month</h3>
            <button
              onClick={() => navigate("/advance/adjustments-report")}
              className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium"
            >
              View full adjustments report
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <DollarSign className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600">Advances</p>
                <p className="text-lg font-semibold text-gray-900">
                  ₹{(adjustmentsSummary?.advances ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-teal-200">
              <PlusCircle className="w-5 h-5 text-teal-600 mt-0.5" />
              <div>
                <p className="text-xs text-teal-700">Other Earnings</p>
                <p className="text-lg font-semibold text-teal-600">
                  +₹{(adjustmentsSummary?.otherEarnings ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
              <MinusCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs text-amber-700">Other Deductions</p>
                <p className="text-lg font-semibold text-amber-600">
                  -₹{(adjustmentsSummary?.otherDeductions ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-300">
              <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-xs text-blue-700">Net Adjustment Impact</p>
                <p className={`text-lg font-semibold ${adjustmentsSummary.netImpact >= 0 ? "text-teal-600" : "text-red-600"}`}>
                  {adjustmentsSummary.netImpact >= 0 ? "+" : ""}₹{(adjustmentsSummary?.netImpact ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Visibility Notice */}
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <DollarSign className="w-5 h-5 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900">Limited Data Visibility</p>
          <p className="text-xs text-green-700">
            Accounts view shows only payment-relevant data: Employee Name, Bank Details, Total Pay
          </p>
        </div>
      </div>

      {/* Payment Data Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
            <Badge className={
              snapshot.status === "approved"
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            }>
              {snapshot.status === "approved" ? "Ready for Payment" : "Paid"}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employee Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Bank Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Account Number</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">IFSC Code</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Pay</th>
                </tr>
              </thead>
              <tbody>
                {snapshot?.employees?.map((emp) => (
                  <tr key={emp.snapshotId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{emp.employeeName}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{emp.bankName || "N/A"}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 font-mono">{emp.accountNumber || "N/A"}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 font-mono">{emp.ifscCode || "N/A"}</td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                      ₹{(emp?.totalPay ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td colSpan={4} className="py-3 px-4 text-sm font-semibold text-gray-900">Total Payout</td>
                  <td className="py-3 px-4 text-sm text-right font-bold text-green-600">
                    ₹{(snapshot?.totalPayout ?? 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {snapshot.status === "approved" && (
        <div className="flex justify-end gap-3">
          <button
            onClick={handleMarkAsPaid}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark as Paid
          </button>
        </div>
      )}

      {/* Payment History */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment History</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Generated:</span>
              <span className="font-medium">{snapshot.generatedAt} by {snapshot.generatedBy}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Info */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Workflow</h4>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge>1</Badge>
              <span className="text-sm">Payroll Processing generates snapshot</span>
              <Badge className="bg-green-100 text-green-700">Completed</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge>2</Badge>
              <span className="text-sm">HR reviews and sends to Super Admin</span>
              <Badge className="bg-green-100 text-green-700">Completed</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge>3</Badge>
              <span className="text-sm">Super Admin approves</span>
              <Badge className="bg-green-100 text-green-700">Completed</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge>4</Badge>
              <span className="text-sm">Accounts processes payment</span>
              <Badge className={snapshot.status === "paid" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                {snapshot.status === "paid" ? "Completed" : "In Progress"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AccountsPayrollProcessing;
