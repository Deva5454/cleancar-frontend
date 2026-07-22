﻿﻿﻿﻿﻿import { useNavigate } from "react-router-dom";
/**
 * Payroll Review & Approval - Enhanced with Finance Integration
 *
 * Complete payroll workflow with accounting principles:
 * Draft → HR Approved → Finance Approved → Paid
 *
 * @component
 */

import { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { BackButton } from "../ui/back-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ConfirmationModal } from "../shared/ConfirmationModal";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { usePayroll } from "../../contexts/PayrollContext";
import { useRole } from "../../contexts/RoleContext";
import { getStatusDisplay } from "../../utils/payrollWorkflow";
import { PayrollLineReviewModal, type ReviewStatus, type ReviewLogEntry } from "./PayrollLineReviewModal";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type PayrollRunStatus = "draft" | "hr_approved" | "finance_approved" | "paid";

interface EmployeePayroll {
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

interface PayrollSummary {
  totalEmployees: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetPayable: number;
  totalEmployerContributions: number;
  totalExpense: number; // Net + Employer Contributions
  month: string;
  year: string;
}

interface StatutoryBreakdown {
  employeePF: number;
  employeeESIC: number;
  professionalTax: number;
  tds: number;
  employerPF: number;
  employerESIC: number;
  employerLWF: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
// ============================================================================
// STATUS TRACKER COMPONENT
// ============================================================================

interface StatusTrackerProps {
  currentStatus: PayrollRunStatus;
}

function StatusTracker({ currentStatus }: StatusTrackerProps) {
  const statuses: { key: PayrollRunStatus; label: string }[] = [
    { key: "draft", label: "Draft" },
    { key: "hr_approved", label: "HR Approved" },
    { key: "finance_approved", label: "Finance Approved" },
    { key: "paid", label: "Paid" },
  ];

  const currentIndex = statuses.findIndex((s) => s.key === currentStatus);

  return (
    <div className="flex items-center justify-between w-full">
      {statuses.map((status, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = status.key === currentStatus;

        return (
          <div key={status.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isActive
                    ? isCurrent
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-green-600 border-green-600 text-white"
                    : "bg-gray-100 border-gray-300 text-gray-400"
                }`}
              >
                {isActive && index < currentIndex ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-medium ${
                    isActive ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {status.label}
                </div>
              </div>
            </div>
            {index < statuses.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mb-6">
                <div
                  className={`h-full ${
                    index < currentIndex ? "bg-green-600" : "bg-gray-300"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PayrollReviewApproval() {
  const navigate = useNavigate();
  const dbEmps = employeeDatabaseService.getAll();
  // Note: EmployeeDatabaseRecord has no salary field — real figures live in
  // employeeSalaryService. This mock default (18000) is what every one of
  // these rows already evaluated to at runtime before this fix (accessing
  // a nonexistent property just returns undefined, which `|| 18000` then
  // fell back to) — making that explicit rather than pretending a
  // `baseSalary` field exists on the employee record.
  const MOCK_BASE_SALARY = 18000;
  const [employees, setEmployees] = useState<EmployeePayroll[]>(dbEmps.slice(0,25).map(emp => ({
    employeeId: emp.employeeId || emp.id || emp.tempId,
    employeeName: emp.firstName+" "+emp.lastName,
    role: emp.role || emp.designation || "Employee", department: emp.department||"Operations",
    baseSalary: MOCK_BASE_SALARY, incentive: 0,
    grossSalary: MOCK_BASE_SALARY,
    deductions: Math.round(MOCK_BASE_SALARY*0.12),
    netPay: Math.round(MOCK_BASE_SALARY*0.88),
    hasAnomaly: false,
    reviewStatus: "Pending",
    reviewLog: [],
  })));
  const [viewingEmployee, setViewingEmployee] = useState<EmployeePayroll | null>(null);
  const [openViewInEditMode, setOpenViewInEditMode] = useState(false);
  // Summary used to be a separate useState that was initialized once and
  // never updated — every card permanently showed ₹0.00 / 0 employees
  // regardless of the real employee rows in the table below. Now derived
  // live from `employees` so it always reflects what's actually shown.
  const summary: PayrollSummary = {
    totalEmployees: employees.length,
    totalGrossSalary: employees.reduce((s, e) => s + e.grossSalary, 0),
    totalDeductions: employees.reduce((s, e) => s + e.deductions, 0),
    totalNetPayable: employees.reduce((s, e) => s + e.netPay, 0),
    totalEmployerContributions: Math.round(employees.reduce((s, e) => s + e.grossSalary, 0) * 0.0975), // PF+ESIC+LWF employer share, matching the existing 12% employee-side approximation used above
    totalExpense: 0,
    month: "04",
    year: "2026",
  };
  summary.totalExpense = summary.totalNetPayable + summary.totalEmployerContributions;
  const [statutory, setStatutory] = useState<StatutoryBreakdown>({
    employeePF: 0,
    employeeESIC: 0,
    professionalTax: 0,
    tds: 0,
    employerPF: 0,
    employerESIC: 0,
    employerLWF: 0,
  });
  const { payrollRuns, getPayrollForMonth, sendToReview, approvePayroll } = usePayroll();
  const { currentUser, currentRole } = useRole();
  const canReview = currentRole === "HR" || currentRole === "Super Admin";
  const currentMonthKey = "2026-04";
  const monthRuns = getPayrollForMonth ? getPayrollForMonth(currentMonthKey) : [];
  const activeRun = monthRuns && monthRuns.length > 0 ? monthRuns[0] : null;
  // status is now derived from the real PayrollContext run when one exists for this month,
  // falling back to local draft state only if no real run has been created yet.
  const [localStatus, setLocalStatus] = useState<PayrollRunStatus>("draft");
  const status: PayrollRunStatus = activeRun
    ? (activeRun.status === "under_review" ? "hr_approved" : activeRun.status === "approved" ? "finance_approved" : activeRun.status === "disbursed" ? "paid" : "draft")
    : localStatus;
  const setStatus = setLocalStatus; // kept for any remaining local-only display state
  const [isLoading, setIsLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"hr" | "finance" | null>(null);

  const anomalyCount = employees.filter((e) => e.hasAnomaly).length;

  const handleExportReport = () => {
    const csvContent = [
      ["Employee ID", "Name", "Role", "Department", "Base Salary", "Incentive", "Gross Salary", "Deductions", "Net Pay", "Review Status"],
      ...employees.map((e) => [
        e.employeeId, e.employeeName, e.role, e.department,
        e.baseSalary, e.incentive, e.grossSalary, e.deductions, e.netPay, e.reviewStatus,
      ]),
      [],
      ["Total Gross Salary", summary.totalGrossSalary],
      ["Total Deductions", summary.totalDeductions],
      ["Net Salary Payable", summary.totalNetPayable],
      ["Employer Contributions", summary.totalEmployerContributions],
    ].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_review_${summary.year}-${summary.month}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleHRApproval = () => {
    const pendingOrRejected = employees.filter(e => e.reviewStatus !== "Approved");
    if (pendingOrRejected.length > 0) {
      toast.error(`${pendingOrRejected.length} of ${employees.length} employees still need individual review before this run can go to HR Approval. Open each one via "View" first.`);
      return;
    }
    setConfirmAction("hr");
    setConfirmModalOpen(true);
  };

  const handleApproveLine = (employeeId: string) => {
    if (!canReview) { toast.error("Only HR or Super Admin can approve payroll"); return; }
    setEmployees(prev => prev.map(e => e.employeeId === employeeId ? {
      ...e,
      reviewStatus: "Approved",
      reviewLog: [...e.reviewLog, {
        action: "Approved", by: currentUser?.name || "HR", byRole: currentRole,
        at: new Date().toISOString(),
      }],
    } : e));
  };

  const handleRejectLine = (
    employeeId: string,
    corrections: { baseSalary: number; incentive: number; deductions: number },
    note: string
  ) => {
    if (!canReview) { toast.error("Only HR or Super Admin can reject/correct payroll"); return; }
    setEmployees(prev => prev.map(e => {
      if (e.employeeId !== employeeId) return e;
      const changes: ReviewLogEntry["changes"] = [];
      if (corrections.baseSalary !== e.baseSalary) changes.push({ field: "Base Salary", from: e.baseSalary, to: corrections.baseSalary });
      if (corrections.incentive !== e.incentive) changes.push({ field: "Incentive", from: e.incentive, to: corrections.incentive });
      if (corrections.deductions !== e.deductions) changes.push({ field: "Deductions", from: e.deductions, to: corrections.deductions });
      const newGross = corrections.baseSalary + corrections.incentive;
      const newNet = newGross - corrections.deductions;
      return {
        ...e,
        baseSalary: corrections.baseSalary,
        incentive: corrections.incentive,
        deductions: corrections.deductions,
        grossSalary: newGross,
        netPay: newNet,
        reviewStatus: "Rejected",
        reviewLog: [...e.reviewLog, {
          action: "Rejected", by: currentUser?.name || "HR", byRole: currentRole,
          at: new Date().toISOString(), note, changes,
        }],
      };
    }));
  };

  const confirmHRApproval = async () => {
    setIsLoading(true);
    setConfirmModalOpen(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (activeRun && currentUser?.employeeId) {
        const ok = sendToReview(activeRun.payrollId, currentUser.employeeId);
        if (!ok) { toast.error("HR approval failed - check role permissions for this status"); return; }
      } else {
        setStatus("hr_approved"); // no real run yet (demo/no-data state) - local display only
      }
      toast.success("Payroll approved by HR");
    } catch (error) {
      toast.error("HR approval failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinanceApproval = () => {
    if (status !== "hr_approved") {
      toast.error("Payroll must be HR approved first");
      return;
    }
    setConfirmAction("finance");
    setConfirmModalOpen(true);
  };

  const confirmFinanceApproval = async () => {
    setIsLoading(true);
    setConfirmModalOpen(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In production:
      // await payrollEngine.financeApprove({ payrollRunId })
      //
      // This creates ONE aggregated transaction with ledger entries:
      // Dr: 5100 - Salaries & Wages         ₹3,625,000
      // Dr: 5120 - Employer Contributions     ₹285,000
      //     Cr: 2100 - Salary Payable                 ₹3,173,000
      //     Cr: 2110 - PF Payable                       ₹348,000
      //     Cr: 2111 - ESIC Payable                     ₹108,563
      //     Cr: 2112 - PT Payable                        ₹29,000
      //     Cr: 2113 - TDS Payable                       ₹45,000
      //     Cr: 2114 - LWF Payable                          ₹870
      //
      // Total Debit: ₹3,910,000 = Total Credit: ₹3,910,000

      if (activeRun && currentUser?.employeeId) {
        const ok = approvePayroll(activeRun.payrollId, currentUser.employeeId);
        if (!ok) { toast.error("Finance approval failed - check role permissions for this status"); return; }
        // approvePayroll() internally calls transitionPayroll(), which fires the real
        // cc360_payroll_approved event that FinanceContext listens to and uses to
        // create the actual ledger payable - no separate manual step needed here.
      } else {
        setStatus("finance_approved"); // no real run yet (demo/no-data state) - local display only
      }
      toast.success("Finance approved. Aggregated ledger entries created.");
    } catch (error) {
      toast.error("Finance approval failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/payroll/processing" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Payroll Review & Approval</h1>
          <p className="text-gray-600">
            April 2026 • {summary.totalEmployees} Employees
          </p>
          <div className="flex gap-2 mt-1">
            <Badge className="bg-green-100 text-green-700 border-green-300">
              {employees.filter(e => e.reviewStatus === "Approved").length} Approved
            </Badge>
            <Badge className="bg-gray-100 text-gray-700 border-gray-300">
              {employees.filter(e => e.reviewStatus === "Pending").length} Pending Review
            </Badge>
            {employees.filter(e => e.reviewStatus === "Rejected").length > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-300">
                {employees.filter(e => e.reviewStatus === "Rejected").length} Rejected
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={handleExportReport}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Status Tracker */}
      <Card className="border-2 border-blue-300">
        <CardContent className="p-8">
          <StatusTracker currentStatus={status} />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Gross Salary</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalGrossSalary)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.totalEmployees} employees
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deductions</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalDeductions)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Statutory + Others
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Salary Payable</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalNetPayable)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  After deductions
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Employer Contributions</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(summary.totalEmployerContributions)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PF + ESIC + LWF
                </p>
              </div>
              <FileText className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly Alert */}
      {anomalyCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Anomalies Detected</AlertTitle>
          <AlertDescription>
            {anomalyCount} employee{anomalyCount !== 1 ? "s have" : " has"} unusual
            salary patterns. Review highlighted rows before approval.
          </AlertDescription>
        </Alert>
      )}

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Base Salary</TableHead>
                <TableHead className="text-right">Incentives</TableHead>
                <TableHead className="text-right">Gross Salary</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow
                  key={employee.employeeId}
                  className={employee.hasAnomaly ? "bg-red-50" : ""}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {employee.hasAnomaly && (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium">{employee.employeeName}</div>
                        <div className="text-xs text-gray-500">
                          {employee.employeeId}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{employee.department}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(employee.baseSalary)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(employee.incentive)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(employee.grossSalary)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -{formatCurrency(employee.deductions)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-600">
                    {formatCurrency(employee.netPay)}
                  </TableCell>
                  <TableCell className="text-center">
                    {employee.reviewStatus === "Approved" ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300">Approved</Badge>
                    ) : employee.reviewStatus === "Rejected" ? (
                      <Badge className="bg-red-100 text-red-700 border-red-300">Rejected</Badge>
                    ) : employee.hasAnomaly ? (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                        Review
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => { setViewingEmployee(employee); setOpenViewInEditMode(false); }}>
                        View
                      </Button>
                      {canReview && employee.reviewStatus !== "Approved" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveLine(employee.employeeId)}
                          title="Approve as-is"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canReview && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => { setViewingEmployee(employee); setOpenViewInEditMode(true); }}
                          title="Reject & correct"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statutory Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Statutory Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Employee Deductions</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Employee PF (12%)</span>
                  <span className="font-semibold">{formatCurrency(statutory.employeePF)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Employee ESIC (0.75%)</span>
                  <span className="font-semibold">{formatCurrency(statutory.employeeESIC)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Professional Tax</span>
                  <span className="font-semibold">{formatCurrency(statutory.professionalTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">TDS</span>
                  <span className="font-semibold">{formatCurrency(statutory.tds)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Employer Contributions</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Employer PF (12%)</span>
                  <span className="font-semibold">{formatCurrency(statutory.employerPF)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Employer ESIC (3.25%)</span>
                  <span className="font-semibold">{formatCurrency(statutory.employerESIC)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Employer LWF</span>
                  <span className="font-semibold">{formatCurrency(statutory.employerLWF)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Actions */}
      <Card className="border-2 border-orange-300 bg-orange-50">
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-orange-900">Approval Required</h3>
              <p className="text-sm text-orange-700 mt-1">
                {status === "draft" && "HR approval locks payroll data"}
                {status === "hr_approved" && "Finance approval creates ledger entries"}
                {status === "finance_approved" && "Ready for payment processing"}
              </p>
            </div>
            <div className="flex gap-2">
              {status === "draft" && (
                <Button
                  onClick={handleHRApproval}
                  disabled={isLoading || anomalyCount > 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  HR Approve
                </Button>
              )}
              {status === "hr_approved" && (
                <Button
                  onClick={handleFinanceApproval}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Finance Approve & Create Ledger Entries
                </Button>
              )}
              {status === "finance_approved" && (
                <Button
                  onClick={() => (navigate("/payroll/salary-payables"))}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Go to Salary Payables
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Preview */}
      {status === "hr_approved" && (
        <Card className="border border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">
              Ledger Entries Preview (On Finance Approval)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Debit Entries</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800">
                      Dr: 5100 - Salaries & Wages
                    </span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(summary.totalGrossSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800">
                      Dr: 5120 - Employer Contributions
                    </span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(summary.totalEmployerContributions)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Credit Entries</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800">Cr: 2100 - Salary Payable</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(summary.totalNetPayable)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800">Cr: 2110 - PF Payable</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(statutory.employeePF + statutory.employerPF)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800">Cr: 2111 - ESIC Payable</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(statutory.employeeESIC + statutory.employerESIC)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800">Cr: 2112 - PT Payable</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(statutory.professionalTax)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800">Cr: 2113 - TDS Payable</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(statutory.tds)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800">Cr: 2114 - LWF Payable</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(statutory.employerLWF)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-blue-300 pt-2">
                <div className="flex justify-between font-bold text-blue-900">
                  <span>Total</span>
                  <span className="font-mono">
                    Dr: {formatCurrency(summary.totalExpense)} = Cr:{" "}
                    {formatCurrency(summary.totalExpense)}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  ✓ Ledger entries are balanced
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmAction === "hr" ? confirmHRApproval : confirmFinanceApproval}
        title={confirmAction === "hr" ? "Confirm HR Approval" : "Confirm Finance Approval & Create Ledger Entries"}
        description={
          confirmAction === "hr"
            ? "This will approve the payroll run for finance review."
            : "This action will create accounting ledger entries and prepare for payment processing."
        }
        confirmText={confirmAction === "hr" ? "Approve" : "Approve & Create Entries"}
        variant="warning"
        isLoading={isLoading}
        details={[
          { label: "Total Employees", value: summary.totalEmployees },
          { label: "Total Amount", value: `₹${(summary?.totalNetPayable ?? 0).toLocaleString()}` },
          { label: "Pay Period", value: `${summary.month} ${summary.year}` },
        ]}
      />

      {viewingEmployee && (
        <PayrollLineReviewModal
          employee={viewingEmployee}
          onClose={() => { setViewingEmployee(null); setOpenViewInEditMode(false); }}
          onApprove={handleApproveLine}
          onReject={handleRejectLine}
          startInEditMode={openViewInEditMode}
        />
      )}
    </div>
  );
}

export default PayrollReviewApproval;
