import { useNavigate } from "react-router-dom";
/**
 * Payroll Processing - Employee-Driven Workspace
 *
 * HR-style table interface for payroll execution
 * All data auto-fetched from payrollEngine
 * No manual inputs or configuration
 *
 * @component
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Calendar,
  MapPin,
  Building2,
  Database,
  PlayCircle,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Download,
  Users,
  RefreshCw,
  FileText,
  DollarSign,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessFlows } from "../../hooks/useBusinessFlows";
import { formatCurrency } from "../../lib/formatters";
import { otherAdjustmentsService } from "../../services/otherAdjustmentsService";
import { usePayroll } from "../../contexts/PayrollContext";
import { useEmployee } from "../../contexts/EmployeeContext";

// Employee payroll status
type PayrollStatus = "pending" | "processing" | "completed" | "failed";

// Payroll run status (NEW)
type PayrollRunStatus = "draft" | "hr_approved" | "finance_approved" | "paid";

// Employee payroll record
interface EmployeePayroll {
  employeeId: string;
  employeeName: string;
  role: string;
  units: number;
  validUnits: number;
  complianceScore: number;
  basePay: number;
  incentive: number;
  complianceAdjustment: number;
  totalPay: number;
  status: PayrollStatus;
  processedAt?: string;
  errorMessage?: string;
  otherEarningsBreakdown?: Array<{ category: string; amount: number; reason: string }>;
  otherDeductionsBreakdown?: Array<{ category: string; amount: number; reason: string }>;
}

export function PayrollProcessingAdvanced() {
  // CRITICAL: Use Business Flows for orchestrated payroll processing
  const { processPayrollWithPayable } = useBusinessFlows();
  const { payrollRuns } = usePayroll();
  const { employees } = useEmployee();

  // Filter State
  const [selectedMonth, setSelectedMonth] = useState("04");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [selectedCluster, setSelectedCluster] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Data State
  const employeePayroll = payrollRuns.map(run => {
    const emp = employees.find(e => e.employeeId === run.employeeId);
    return { employeeId: run.employeeId, employeeName: emp ? emp.firstName+" "+emp.lastName : run.employeeId, role: emp?.role||"Employee", units:0, validUnits:0, complianceScore:95, basePay:run.baseSalary, incentive:run.incentiveAmount||0, complianceAdjustment:0, totalPay:run.grossSalary, status:run.status==="Disbursed"?"completed":"pending", processedAt:run.disbursedAt||"" };
  });
  const [loading, setLoading] = useState(false);

  // UI State
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePayroll | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [processingEmployeeId, setProcessingEmployeeId] = useState<string | null>(null);

  // Payroll Run Status
  const [payrollRunStatus, setPayrollRunStatus] = useState<PayrollRunStatus>("draft");
  const [payrollRunId, setPayrollRunId] = useState<string>(`PR-${selectedYear}-${selectedMonth}`);

  // Finance processing state
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);

  // Auto-load data when filters change
  useEffect(() => {
    loadEmployeePayrollData();
  }, [selectedMonth, selectedYear, selectedCity, selectedCluster]);

  const loadEmployeePayrollData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In production: const data = await payrollEngine.getEmployeePayroll({ month, year, city, cluster })
      // Data now loaded from PayrollContext
    } catch (error) {
      toast.error("Failed to load employee payroll data");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSingle = async (employee: EmployeePayroll) => {
    setProcessingEmployeeId(employee.employeeId);

    try {
      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In production: await payrollEngine.processEmployee({ employeeId, month, year })

      // Update would go to PayrollContext

      toast.success(`Payroll processed for ${employee.employeeName}`);
    } catch (error) {
      // Update would go to PayrollContext
      toast.error("Processing failed");
    } finally {
      setProcessingEmployeeId(null);
    }
  };

  const handleProcessAll = async () => {
    const pendingEmployees = employeePayroll.filter(emp => emp.status === "pending");

    if (pendingEmployees.length === 0) {
      toast.info("No pending employees to process");
      return;
    }

    setLoading(true);

    try {
      // Simulate batch processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In production: await payrollEngine.processBatch({ employeeIds, month, year })
      // Updates would go to PayrollContext

      toast.success(`Processed payroll for ${pendingEmployees.length} employees`);
    } catch (error) {
      toast.error("Batch processing failed");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (employee: EmployeePayroll) => {
    // Fetch adjustments for this employee and current payroll period
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentPayrollMonth = monthNames[parseInt(selectedMonth) - 1];
    const currentPayrollYear = parseInt(selectedYear);

    const approvedEarnings = otherAdjustmentsService
      .getApprovedForPayrollMonth(currentPayrollMonth, currentPayrollYear)
      .filter(r => r.type === "OtherEarning" && r.employeeId === employee.employeeId);

    const approvedDeductions = otherAdjustmentsService
      .getApprovedForPayrollMonth(currentPayrollMonth, currentPayrollYear)
      .filter(r => r.type === "OtherDeduction" && r.employeeId === employee.employeeId);

    // Enrich employee data with breakdown
    const enrichedEmployee: EmployeePayroll = {
      ...employee,
      otherEarningsBreakdown: approvedEarnings.map(e => ({
        category: e.category,
        amount: e.amount,
        reason: e.reason,
      })),
      otherDeductionsBreakdown: approvedDeductions.map(d => ({
        category: d.category,
        amount: d.amount,
        reason: d.reason,
      })),
    };

    setSelectedEmployee(enrichedEmployee);
    setShowDetailDialog(true);
  };

  // ============================================================================
  // APPROVAL WORKFLOW HANDLERS (NEW)
  // ============================================================================

  const handleHRApproval = async () => {
    if (stats.pending > 0 || stats.processing > 0) {
      toast.error("Cannot approve. All employees must be processed first.");
      return;
    }

    if (stats.completed === 0) {
      toast.error("No payroll data to approve");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In production: await payrollEngine.hrApproval({ payrollRunId })

      setPayrollRunStatus("hr_approved");
      toast.success("Payroll approved by HR");
    } catch (error) {
      toast.error("HR approval failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFinanceApproval = async () => {
    if (payrollRunStatus !== "hr_approved") {
      toast.error("Payroll must be HR approved first");
      return;
    }

    const completedEmployees = employeePayroll.filter(e => e.status === "completed");

    if (completedEmployees.length === 0) {
      toast.error("No completed employees to process");
      return;
    }

    setIsProcessingPayroll(true);
    let processedCount = 0;
    const failedEmployees: string[] = [];

    try {
      // CRITICAL: Use Business Flow Hook for real financial processing
      // Process each employee and create corresponding payables in FinanceContext

      const startDate = `${selectedYear}-${selectedMonth}-01`;
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).toISOString().split('T')[0];

      // Map month number to month name for adjustments
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentPayrollMonth = monthNames[parseInt(selectedMonth) - 1];
      const currentPayrollYear = parseInt(selectedYear);

      for (const emp of completedEmployees) {
        try {
          // Fetch approved other earnings and deductions for this employee and payroll period
          const approvedEarnings = otherAdjustmentsService
            .getApprovedForPayrollMonth(currentPayrollMonth, currentPayrollYear)
            .filter(r => r.type === "OtherEarning" && r.employeeId === emp.employeeId);

          const approvedDeductions = otherAdjustmentsService
            .getApprovedForPayrollMonth(currentPayrollMonth, currentPayrollYear)
            .filter(r => r.type === "OtherDeduction" && r.employeeId === emp.employeeId);

          const totalOtherEarnings = approvedEarnings.reduce((sum, r) => sum + r.amount, 0);
          const totalOtherDeductions = approvedDeductions.reduce((sum, r) => sum + r.amount, 0);

          // Map employee payroll data to PayrollRun format (per employee)
          const payrollData = {
            employeeId: emp.employeeId,
            month: `${selectedYear}-${selectedMonth}`,
            period: {
              startDate,
              endDate,
            },
            // Earnings
            baseSalary: emp.basePay,
            incentiveAmount: emp.incentive,
            addOnEarnings: totalOtherEarnings,
            allowances: 0,
            grossSalary: emp.basePay + emp.incentive + totalOtherEarnings,
            // Deductions
            pf: 0,
            esic: 0,
            tds: 0,
            advances: 0,
            otherDeductions: Math.abs(emp.complianceAdjustment) + totalOtherDeductions,
            totalDeductions: Math.abs(emp.complianceAdjustment) + totalOtherDeductions,
            // Net
            netSalary: emp.totalPay + totalOtherEarnings - totalOtherDeductions,
            status: "Pending Approval" as const,
          };

          // Call business flow hook - creates payable in FinanceContext
          const result = processPayrollWithPayable(payrollData);

          if (result.success) {
            processedCount++;

            // Mark adjustments as applied in this payroll run
            const payrollRunId = `PAYROLL-${selectedYear}-${selectedMonth}`;
            approvedEarnings.forEach(record => {
              otherAdjustmentsService.markApplied(record.id, payrollRunId);
            });
            approvedDeductions.forEach(record => {
              otherAdjustmentsService.markApplied(record.id, payrollRunId);
            });
          } else {
            failedEmployees.push(emp.employeeName);
            console.error(`Failed to process payroll for ${emp.employeeName}:`, result.error);
          }
        } catch (error) {
          failedEmployees.push(emp.employeeName);
          console.error(`Error processing payroll for ${emp.employeeName}:`, error);
        }
      }

      // Update status based on results
      if (processedCount === completedEmployees.length) {
        setPayrollRunStatus("finance_approved");
        toast.success("Payroll processed successfully!", {
          description: `${processedCount} payables created in Finance`,
          duration: 5000,
        });
      } else if (processedCount > 0) {
        setPayrollRunStatus("finance_approved");
        toast.warning("Payroll partially processed", {
          description: `${processedCount} succeeded, ${failedEmployees.length} failed`,
          duration: 6000,
        });
      } else {
        throw new Error("All payroll processing failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Finance approval failed";
      toast.error("Payroll Processing Failed", {
        description: failedEmployees.length > 0
          ? `Failed employees: ${failedEmployees.join(", ")}`
          : errorMessage,
        duration: 6000,
      });
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const getTotalPayroll = () => {
    return employeePayroll
      .filter(e => e.status === "completed")
      .reduce((sum, emp) => sum + emp.totalPay, 0);
  };

  const getStatusBadge = (status: PayrollStatus) => {
    const styles = {
      pending: "bg-gray-100 text-gray-700",
      processing: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    };

    const icons = {
      pending: Clock,
      processing: RefreshCw,
      completed: CheckCircle,
      failed: XCircle,
    };

    const Icon = icons[status];

    return (
      <Badge className={styles[status]}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getComplianceBadge = (score: number) => {
    if (score >= 90) {
      return <Badge className="bg-green-100 text-green-700">{score}%</Badge>;
    } else if (score >= 75) {
      return <Badge className="bg-yellow-100 text-yellow-700">{score}%</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-700">{score}%</Badge>;
    }
  };

  const getPayrollRunStatusBadge = (status: PayrollRunStatus) => {
    const styles = {
      draft: "bg-gray-100 text-gray-700 border-gray-300",
      hr_approved: "bg-blue-100 text-blue-700 border-blue-300",
      finance_approved: "bg-green-100 text-green-700 border-green-300",
      paid: "bg-purple-100 text-purple-700 border-purple-300",
    };

    const labels = {
      draft: "Draft",
      hr_approved: "HR Approved",
      finance_approved: "Finance Approved",
      paid: "Paid",
    };

    return (
      <Badge className={`${styles[status]} border px-3 py-1`}>
        {labels[status]}
      </Badge>
    );
  };

  const filteredEmployees = employeePayroll.filter((emp) =>
    emp.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: employeePayroll.length,
    pending: employeePayroll.filter(e => e.status === "pending").length,
    processing: employeePayroll.filter(e => e.status === "processing").length,
    completed: employeePayroll.filter(e => e.status === "completed").length,
    failed: employeePayroll.filter(e => e.status === "failed").length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Processing</h2>
          <p className="text-sm text-gray-600 mt-1">
            Employee-driven payroll workspace
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-sm">{stats.total} Employees</span>
        </Badge>
      </div>

      {/* Engine Label */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Database className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Data Source: payrollEngine</p>
          <p className="text-xs text-blue-700">
            All employee payroll data auto-fetched from system • No manual inputs
          </p>
        </div>
      </div>

      {/* Payroll Run Summary (NEW) */}
      <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-white">
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="bg-blue-600 text-white p-3 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Payroll Run: {payrollRunId}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedMonth}/{selectedYear} • {employeePayroll.length} Employees
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Payroll</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(getTotalPayroll())}
                </div>
              </div>
              <div>
                {getPayrollRunStatusBadge(payrollRunStatus)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.processing}</div>
            <div className="text-xs text-gray-600">Processing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Month
              </Label>
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
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Year
              </Label>
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

            {/* City */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                City
              </Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Cities</SelectItem>
                  <SelectItem value="CITY-SURAT">Surat</SelectItem>
                  <SelectItem value="CITY-MUMBAI">Mumbai</SelectItem>
                  <SelectItem value="CITY-AHMEDABAD">Ahmedabad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cluster */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Cluster
              </Label>
              <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Clusters</SelectItem>
                  <SelectItem value="ADAJAN">Adajan</SelectItem>
                  <SelectItem value="VESU">Vesu</SelectItem>
                  <SelectItem value="RANDER">Rander</SelectItem>
                  <SelectItem value="KATARGAM">Katargam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by employee name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {filteredEmployees.length} of {employeePayroll.length} employees
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadEmployeePayrollData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleProcessAll}
            disabled={loading || stats.pending === 0 || payrollRunStatus !== "draft"}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Run Payroll for All ({stats.pending} Pending)
          </Button>
        </div>
      </div>

      {/* Approval Actions (NEW) */}
      {stats.completed > 0 && (
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">Payroll Approval Required</p>
                  <p className="text-sm text-orange-700">
                    {stats.completed} employees processed. Approve to proceed with payment.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {payrollRunStatus === "draft" && (
                  <Button
                    onClick={handleHRApproval}
                    disabled={loading || stats.pending > 0 || stats.processing > 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    HR Approve
                  </Button>
                )}
                {payrollRunStatus === "hr_approved" && (
                  <Button
                    onClick={handleFinanceApproval}
                    disabled={isProcessingPayroll}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessingPayroll ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing payroll...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Finance Approve & Create Payable
                      </>
                    )}
                  </Button>
                )}
                {payrollRunStatus === "finance_approved" && (
                  <Button
                    onClick={() => (navigate("/payroll/salary-payables"))}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Go to Salary Payables
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[800px] sm:min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Valid Units</TableHead>
                    <TableHead className="text-center">Compliance</TableHead>
                    <TableHead className="text-right">Total Pay</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Loading employee data...</p>
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">No employees found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.employeeId}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{employee.employeeName}</div>
                      <div className="text-xs text-gray-500">{employee.employeeId}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{employee.role}</TableCell>
                    <TableCell className="text-right text-sm text-gray-700">{employee.units}</TableCell>
                    <TableCell className="text-right text-sm text-gray-700">{employee.validUnits}</TableCell>
                    <TableCell className="text-center">
                      {getComplianceBadge(employee.complianceScore)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {formatCurrency(employee.totalPay)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(employee.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(employee)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {employee.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProcessSingle(employee)}
                            disabled={processingEmployeeId === employee.employeeId}
                          >
                            {processingEmployeeId === employee.employeeId ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <PlayCircle className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.employeeName} ({selectedEmployee?.employeeId})
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4">
              {/* Engine Label */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Database className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-900">Calculated by Payroll Engine</p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-600 mb-1">Base Pay</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(selectedEmployee.basePay)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">From salary structure</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-600 mb-1">Incentive</div>
                    <div className="text-2xl font-bold text-green-700">
                      +{formatCurrency(selectedEmployee.incentive)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Performance-based</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-600 mb-1">Compliance Adjustment</div>
                    <div className="text-2xl font-bold text-orange-700">
                      {selectedEmployee.complianceAdjustment >= 0 ? "+" : ""}
                      {formatCurrency(Math.abs(selectedEmployee.complianceAdjustment))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Score: {selectedEmployee.complianceScore}%</div>
                  </CardContent>
                </Card>

                {selectedEmployee.otherEarningsBreakdown && selectedEmployee.otherEarningsBreakdown.length > 0 && (
                  <Card className="border-teal-200">
                    <CardContent className="p-4">
                      <div className="text-xs text-teal-700 mb-1">Other Earnings</div>
                      <div className="text-2xl font-bold text-teal-600">
                        +{formatCurrency(selectedEmployee.otherEarningsBreakdown.reduce((sum, e) => sum + e.amount, 0))}
                      </div>
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        {selectedEmployee.otherEarningsBreakdown.map((earning, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-2">
                            <span className="font-medium">{earning.category}:</span>
                            <span className="text-right">
                              ₹{(earning?.amount ?? 0).toLocaleString()}
                              <br />
                              <span className="text-xs italic text-gray-400">{earning.reason}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedEmployee.otherDeductionsBreakdown && selectedEmployee.otherDeductionsBreakdown.length > 0 && (
                  <Card className="border-amber-200">
                    <CardContent className="p-4">
                      <div className="text-xs text-amber-700 mb-1">Other Deductions</div>
                      <div className="text-2xl font-bold text-amber-600">
                        -{formatCurrency(selectedEmployee.otherDeductionsBreakdown.reduce((sum, d) => sum + d.amount, 0))}
                      </div>
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        {selectedEmployee.otherDeductionsBreakdown.map((deduction, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-2">
                            <span className="font-medium">{deduction.category}:</span>
                            <span className="text-right">
                              ₹{(deduction?.amount ?? 0).toLocaleString()}
                              <br />
                              <span className="text-xs italic text-gray-400">{deduction.reason}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-2 border-blue-500">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-600 mb-1">Total Pay</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {formatCurrency(selectedEmployee.totalPay)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Final amount</div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <div className="text-xs text-gray-600">Total Units</div>
                      <div className="text-lg font-semibold text-gray-900">{selectedEmployee.units}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Valid Units</div>
                      <div className="text-lg font-semibold text-gray-900">{selectedEmployee.validUnits}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Compliance Score</div>
                      <div className="text-lg font-semibold text-gray-900">{selectedEmployee.complianceScore}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedEmployee.processedAt && (
                <div className="text-xs text-gray-500 text-center">
                  Processed at: {selectedEmployee.processedAt}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
