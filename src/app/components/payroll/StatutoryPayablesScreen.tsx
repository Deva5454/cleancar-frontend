/**
 * Statutory Payables Screen - Compliance payments view
 *
 * Shows statutory liabilities (PF, ESIC, PT, TDS, LWF) awaiting payment to authorities
 * Combines employee deductions + employer contributions per statutory type
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
  FileText,
  Building,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { usePayroll } from "../../contexts/PayrollContext";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface StatutoryPayable {
  statutoryType: "PF" | "ESIC" | "PT" | "TDS" | "LWF";
  employeeContribution: number;
  employerContribution: number;
  totalAmount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  payrollMonth: string;
  payrollYear: string;
  paymentReference?: string;
  paidDate?: string;
  challanNumber?: string;
}

interface StatutorySummary {
  totalPending: number;
  totalPaid: number;
  totalOverdue: number;
  nearestDueDate: string;
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

export function StatutoryPayablesScreen() {
  const { payrollRuns } = usePayroll();

  const payables = payrollRuns.map(run => ({ month:run.month, employeeId:run.employeeId, employeePF:run.deductions?.pf_employee||0, employerPF:run.employerPF||0, totalPF:(run.deductions?.pf_employee||0)+(run.employerPF||0), esic:run.deductions?.esic||0, pt:run.deductions?.pt||0, lwf:0, totalStatutory:(run.deductions?.pf_employee||0)+(run.employerPF||0)+(run.deductions?.esic||0)+(run.deductions?.pt||0), status:run.status==="Disbursed"?"paid":"due" }));

  const [summary, setSummary] = useState<StatutorySummary>({
    totalPending: 0,
    totalPaid: 0,
    totalOverdue: 0,
    nearestDueDate: "",
    daysUntilDue: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState("04");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  useEffect(() => {
    loadStatutoryPayables();
  }, [selectedMonth, selectedYear, selectedStatus, selectedType]);

  async function loadStatutoryPayables() {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      // In production:
      // const data = await payrollEngine.getStatutoryPayables({
      //   month: selectedMonth,
      //   year: selectedYear,
      //   status: selectedStatus,
      //   type: selectedType
      // });

      // Data now loaded from PayrollContext
    } catch (error) {
      toast.error("Failed to load statutory payables");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPayables = payables.filter((payable) => {
    const statusMatch = selectedStatus === "ALL" || payable.status === selectedStatus;
    const typeMatch = selectedType === "ALL" || payable.statutoryType === selectedType;
    const monthMatch = payable.payrollMonth === selectedMonth && payable.payrollYear === selectedYear;
    return statusMatch && typeMatch && monthMatch;
  });

  const getStatusBadge = (status: StatutoryPayable["status"]) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
      paid: "bg-green-100 text-green-700 border-green-300",
      overdue: "bg-red-100 text-red-700 border-red-300",
    };

    const labels = {
      pending: "Pending",
      paid: "Paid",
      overdue: "Overdue",
    };

    return (
      <Badge className={`${styles[status]} border`}>
        {labels[status]}
      </Badge>
    );
  };

  const getStatutoryTypeLabel = (type: StatutoryPayable["statutoryType"]) => {
    const labels = {
      PF: "Provident Fund",
      ESIC: "Employee State Insurance",
      PT: "Professional Tax",
      TDS: "Tax Deducted at Source",
      LWF: "Labour Welfare Fund",
    };
    return labels[type];
  };

  const handleRecordPayment = (payable: StatutoryPayable) => {
    toast.info(`Opening payment form for ${payable.statutoryType}`);
    // In production: Navigate to payment recording screen
  };

  const handleDownloadChallan = (payable: StatutoryPayable) => {
    toast.success(`Downloading challan for ${payable.statutoryType}`);
    // In production: Generate and download challan
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/payroll/processing" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Statutory Payables</h1>
          <p className="text-gray-600">
            Compliance payments to government authorities (PF, ESIC, PT, TDS, LWF)
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Building className="w-4 h-4 mr-2" />
          Bulk Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-yellow-300 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {formatCurrency(summary.totalPending)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(summary.totalOverdue)}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid (This Period)</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(summary.totalPaid)}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next Due Date</p>
                <p className="text-lg font-bold text-blue-700">
                  {formatDate(summary.nearestDueDate)}
                </p>
                <p className="text-xs text-blue-600">{summary.daysUntilDue} days</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {summary.totalOverdue > 0 && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Overdue Payments Detected</p>
                <p className="text-sm text-red-700">
                  {formatCurrency(summary.totalOverdue)} in statutory payments are overdue.
                  Please remit immediately to avoid penalties.
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
              <Label>Statutory Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="PF">PF - Provident Fund</SelectItem>
                  <SelectItem value="ESIC">ESIC - Employee Insurance</SelectItem>
                  <SelectItem value="PT">PT - Professional Tax</SelectItem>
                  <SelectItem value="TDS">TDS - Tax Deducted at Source</SelectItem>
                  <SelectItem value="LWF">LWF - Labour Welfare Fund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statutory Payables Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Statutory Compliance Payments</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading statutory payables...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statutory Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Employee Contribution</TableHead>
                  <TableHead className="text-right">Employer Contribution</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Payment Details</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayables.map((payable, index) => (
                  <TableRow key={index} className={payable.status === "overdue" ? "bg-red-50" : ""}>
                    <TableCell>
                      <div className="font-medium">{payable.statutoryType}</div>
                      <div className="text-xs text-gray-500">
                        {getStatutoryTypeLabel(payable.statutoryType)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {payable.payrollMonth}/{payable.payrollYear}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(payable.employeeContribution)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatCurrency(payable.employerContribution)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-purple-600">
                      {formatCurrency(payable.totalAmount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(payable.dueDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(payable.status)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {payable.status === "paid" ? (
                        <div>
                          <div>Ref: {payable.paymentReference}</div>
                          <div>Paid: {payable.paidDate && formatDate(payable.paidDate)}</div>
                          <div>Challan: {payable.challanNumber}</div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2">
                        {payable.status === "pending" || payable.status === "overdue" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRecordPayment(payable)}
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadChallan(payable)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Integration Notice */}
      <Card className="border border-blue-300 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Statutory Payment Information</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-blue-800">
                <li><strong>PF & ESIC:</strong> Due by 15th of following month</li>
                <li><strong>PT:</strong> Due by 7th of following month (varies by state)</li>
                <li><strong>TDS:</strong> Due by 7th of following month</li>
                <li><strong>LWF:</strong> Due half-yearly (Jun 30 & Dec 31)</li>
              </ul>
              <p className="mt-2">
                Recording payment will update ledger: Dr: Statutory Payable, Cr: Bank Account
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
