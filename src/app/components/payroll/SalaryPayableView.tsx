import { useNavigate } from "react-router-dom";
/**
 * Salary Payable View - Shows approved salaries awaiting payment
 *
 * Displays employees with approved salaries that need to be paid
 * Integrates with finance module (Accounts Payable)
 *
 * @component
 */

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Calendar,
  Search,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { usePayroll } from "../../contexts/PayrollContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { getStateRules, type IndianState } from "../../services/payroll/complianceRules";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SalaryPayable {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  employerContributions: number;
  totalExpense: number;
  dueDate: string;
  status: "approved" | "paid";
  payrollMonth: string;
  payrollYear: string;
  expenseId: string;
}

interface PayableSummary {
  totalEmployees: number;
  totalNetSalary: number;
  totalGrossSalary: number;
  totalEmployerContributions: number;
  totalExpense: number;
  dueDate: string;
  daysUntilDue: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function formatDate(dateString: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SalaryPayableView() {
  const navigate = useNavigate();
  const { payrollRuns } = usePayroll();
  const { employees } = useEmployee();

  // Only runs that have actually crystallized into a real liability
  // ("approved" — ready to pay — or "disbursed" — already paid) belong on
  // an "approved salaries awaiting payment" screen. Previously this
  // included every run regardless of status (draft/under_review included)
  // and compared against "Disbursed" (capitalized), which never matched
  // the real lowercase PayrollStatus values, so every row silently fell
  // into an invalid "pending" status not even in this screen's own type.
  const payables: SalaryPayable[] = payrollRuns
    .filter(run => run.status === "approved" || run.status === "disbursed")
    .map(run => {
      const emp = employees.find(e => e.employeeId === run.employeeId);
      // Employer-side PF/ESIC aren't stored directly on PayrollRun — derive
      // them the same way statutoryChallanService does, from the real
      // employee-side pf/esic amounts and each run's own state's rate
      // ratio, so these numbers stay internally consistent with how
      // payroll itself was computed (previously read run.employerPF /
      // run.totalEmployerCost, neither of which exist on PayrollRun, so
      // both were always 0/gross-only).
      const rules = getStateRules((run.stateCode as IndianState) || "GJ");
      const employerPF = rules.pf.employeeRate > 0
        ? (run.pf || 0) * (rules.pf.employerRate / rules.pf.employeeRate)
        : 0;
      const employerESIC = rules.esi.employeeRate > 0
        ? (run.esic || 0) * (rules.esi.employerRate / rules.esi.employeeRate)
        : 0;
      const employerContributions = Math.round(employerPF + employerESIC);
      return {
        employeeId: run.employeeId,
        employeeName: emp ? emp.firstName + " " + emp.lastName : run.employeeId,
        role: emp?.role || "Employee",
        department: emp?.department || "Operations",
        grossSalary: run.grossSalary,
        deductions: run.totalDeductions || 0,
        netSalary: run.netSalary,
        employerContributions,
        totalExpense: run.grossSalary + employerContributions,
        dueDate: run.period?.endDate || "",
        status: (run.status === "disbursed" ? "paid" : "approved") as SalaryPayable["status"],
        payrollMonth: run.month?.split("-")[1] || "",
        payrollYear: run.month?.split("-")[0] || "",
        expenseId: "EXP-" + run.payrollId,
      };
    });
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState("04");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayables = payables.filter((payable) =>
    payable.payrollMonth === selectedMonth &&
    payable.payrollYear === selectedYear &&
    (selectedDepartment === "ALL" || payable.department === selectedDepartment) &&
    (payable.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payable.employeeId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Summary is derived directly from the filtered set — previously this was
  // a separate useState initialized to all zeros and never updated by
  // anything (loadPayables() was a setTimeout no-op), so the summary card
  // and the "Payment Due Soon" banner permanently showed 0/₹0/"Invalid
  // Date" regardless of the real data rendered in the table below it.
  const summary: PayableSummary = (() => {
    const dueDate = filteredPayables[0]?.dueDate || "";
    const daysUntilDue = dueDate
      ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
      : Infinity;
    return {
      totalEmployees: filteredPayables.length,
      totalNetSalary: filteredPayables.reduce((s, p) => s + p.netSalary, 0),
      totalGrossSalary: filteredPayables.reduce((s, p) => s + p.grossSalary, 0),
      totalEmployerContributions: filteredPayables.reduce((s, p) => s + p.employerContributions, 0),
      totalExpense: filteredPayables.reduce((s, p) => s + p.totalExpense, 0),
      dueDate,
      daysUntilDue,
    };
  })();

  const getStatusBadge = (status: SalaryPayable["status"]) => {
    const styles = {
      approved: "bg-green-100 text-green-700 border-green-300",
      paid: "bg-purple-100 text-purple-700 border-purple-300",
    };

    const labels = {
      approved: "Approved",
      paid: "Paid",
    };

    return (
      <Badge className={`${styles[status]} border`}>
        {labels[status]}
      </Badge>
    );
  };

  const handleBulkPayment = () => {
    // Navigate to payment screen
    navigate(`/payroll/salary-payment?month=${selectedMonth}&year=${selectedYear}`);
  };

  const handleExport = () => {
    if (filteredPayables.length === 0) {
      toast.error("No payables to export for this period");
      return;
    }
    const header = ["Employee ID", "Employee Name", "Department", "Gross Salary", "Deductions", "Net Salary", "Employer Contributions", "Total Expense", "Due Date", "Status"];
    const rows = filteredPayables.map(p => [
      p.employeeId, p.employeeName, p.department, p.grossSalary, p.deductions,
      p.netSalary, p.employerContributions, p.totalExpense, p.dueDate, p.status,
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `salary-payables-${selectedYear}-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Salary payables exported");
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/payroll/processing" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Salary Payables</h1>
          <p className="text-gray-600">
            Approved salaries awaiting payment
          </p>
        </div>
        <Button onClick={handleBulkPayment} className="bg-purple-600 hover:bg-purple-700">
          <DollarSign className="w-4 h-4 mr-2" />
          Process Payments
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-white">
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Employees</div>
              <div className="text-2xl font-bold text-gray-900">{summary.totalEmployees}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Gross Salary</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalGrossSalary)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Net Payable</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.totalNetSalary)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Employer Contributions</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.totalEmployerContributions)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Due Date</div>
              <div className="text-lg font-bold text-gray-900">{formatDate(summary.dueDate)}</div>
              <div className="text-sm text-gray-600">
                {summary.dueDate ? `${summary.daysUntilDue} days remaining` : "No payables for this period"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Due Date Alert */}
      {summary.dueDate && summary.daysUntilDue <= 7 && (
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">Payment Due Soon</p>
                <p className="text-sm text-orange-700">
                  Salaries are due in {summary.daysUntilDue} days ({formatDate(summary.dueDate)}).
                  Please process payments before due date.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, idx) => (
                    <SelectItem key={month} value={String(idx + 1).padStart(2, "0")}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payables Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Employee Salary Payables</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading payables...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Gross Salary</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead className="text-right">Employer Contrib.</TableHead>
                  <TableHead className="text-right">Total Expense</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayables.map((payable) => (
                  <TableRow key={payable.employeeId}>
                    <TableCell>
                      <div className="font-medium">{payable.employeeName}</div>
                      <div className="text-xs text-gray-500">{payable.employeeId}</div>
                    </TableCell>
                    <TableCell className="text-sm">{payable.department}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payable.grossSalary)}</TableCell>
                    <TableCell className="text-right text-red-600">
                      -{formatCurrency(payable.deductions)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payable.netSalary)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatCurrency(payable.employerContributions)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">
                      {formatCurrency(payable.totalExpense)}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(payable.dueDate)}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(payable.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          (navigate(`/payroll/salary-payment?employeeId=${payable.employeeId}`))
                        }
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SalaryPayableView;
