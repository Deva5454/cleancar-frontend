import { useNavigate } from "react-router-dom";
/**
 * Salary Payable View - Shows approved salaries awaiting payment
 *
 * Displays employees with approved salaries that need to be paid
 * Integrates with finance module (Accounts Payable)
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
  status: "approved" | "partially_paid" | "paid";
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
  const { payrollRuns } = usePayroll();
  const { employees } = useEmployee();

  const payables = payrollRuns.map(run => {
    const emp = employees.find(e => e.employeeId === run.employeeId);
    return { employeeId: run.employeeId, employeeName: emp ? emp.firstName+" "+emp.lastName : run.employeeId, role: emp?.role||"Employee", department: emp?.department||"Operations", grossSalary:run.grossSalary, deductions:run.deductions?.total||0, netSalary:run.netSalary, employerContributions:run.employerPF||0, totalExpense:run.totalEmployerCost||run.grossSalary, dueDate:run.period?.endDate||"", status:run.status==="Disbursed"?"approved":"pending", payrollMonth:run.month?.split("-")[1]||"", payrollYear:run.month?.split("-")[0]||"", expenseId:"EXP-"+run.payrollId };
  });
  const [summary, setSummary] = useState<PayableSummary>({
    totalEmployees: 0,
    totalNetSalary: 0,
    totalGrossSalary: 0,
    totalEmployerContributions: 0,
    totalExpense: 0,
    dueDate: "",
    daysUntilDue: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState("04");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPayables();
  }, [selectedMonth, selectedYear, selectedDepartment]);

  async function loadPayables() {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      // In production:
      // const data = await payrollEngine.getSalaryPayables({
      //   month: selectedMonth,
      //   year: selectedYear,
      //   department: selectedDepartment,
      //   status: 'approved'
      // });

      // Data now loaded from PayrollContext
    } catch (error) {
      toast.error("Failed to load salary payables");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPayables = payables.filter((payable) =>
    payable.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payable.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: SalaryPayable["status"]) => {
    const styles = {
      approved: "bg-green-100 text-green-700 border-green-300",
      partially_paid: "bg-blue-100 text-blue-700 border-blue-300",
      paid: "bg-purple-100 text-purple-700 border-purple-300",
    };

    const labels = {
      approved: "Approved",
      partially_paid: "Partially Paid",
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
              <div className="text-sm text-gray-600">{summary.daysUntilDue} days remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Due Date Alert */}
      {summary.daysUntilDue <= 7 && (
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
            <Button variant="outline" size="sm">
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
