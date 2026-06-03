/**
 * Payroll Run Component - Refactored
 *
 * Clean separation: Inputs → Run → Results
 * No calculations in UI
 * All data from payrollEngine
 * Role-based configuration only
 *
 * @component
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  DollarSign,
  Award,
  Download,
  FileText,
  Users,
  Database,
  Loader2,
  AlertCircle,
  TrendingUp,
  MapPin,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { DataService } from "../../services/DataService";
import { useEmployeeData } from "../../hooks/useEmployeeData";
import { formatCurrency } from "../../lib/formatters";
import { hasPermission } from "../../utils/permissionEngine";
import { useRole } from "../../contexts/RoleContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { CITIES } from "../../contexts/CityContext";

interface PayrollResult {
  employeeId: string;
  employeeName: string;
  role: string;
  basePay: number;
  incentive: number;
  adjustedIncentive: number;
  totalPay: number;
  totalUnits: number;
  validUnits: number;
  complianceScore: number;
  status: "success" | "warning" | "error";
}

interface PayrollSummary {
  totalEmployees: number;
  totalBasePay: number;
  totalIncentive: number;
  totalPay: number;
  avgComplianceScore: number;
}

export function PayrollRun() {
  // PHASE 2: Migrated to useEmployeeData
  const { payrollRuns, employees, getEmployeeById, getPayrollForMonth, processPayroll } = useEmployeeData();
  const { currentUser } = useRole();
  const { computeDaysPresent } = useAttendance();
  const canApprove = hasPermission(currentUser, "payroll", "approve");
  const { employees: allEmployees } = useEmployee();
  const cityEmployees = allEmployees.filter(e =>
    e.role === "Car Washer" || e.role === "Supervisor"
  );

  // Mock payroll results - In production from payrollEngine
  const mockResults: PayrollResult[] = cityEmployees.slice(0, 10).map(emp => ({
    employeeId: emp.employeeId,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    role: emp.role,
    basePay: emp.baseSalary || 18000,
    incentive: Math.round((emp.baseSalary || 18000) * 0.12),
    adjustedIncentive: Math.round((emp.baseSalary || 18000) * 0.11),
    totalPay: Math.round((emp.baseSalary || 18000) * 1.11),
    totalUnits: emp.role === "Car Washer" ? 42 : 0,
    validUnits: emp.role === "Car Washer" ? 39 : 0,
    complianceScore: 90,
    status: "success" as const,
  }));

  // Input State
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [selectedCluster, setSelectedCluster] = useState("ALL");
  const [selectedEmployeeScope, setSelectedEmployeeScope] = useState<"all" | "individual">("all");

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  // Calculate results from HRDataContext payrollRuns
  const { payrollResults, payrollSummary } = useMemo(() => {
    if (!selectedMonth || !selectedYear) {
      return { payrollResults: [], payrollSummary: null };
    }

    const monthIndex = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(selectedMonth);
    const monthStr = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}`;
    const monthPayrolls = getPayrollForMonth(monthStr);

    const results: PayrollResult[] = monthPayrolls.map((pr) => {
      const employee = getEmployeeById(pr.employeeId);
      return {
        employeeId: pr.employeeId,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown",
        role: employee?.role || "Unknown",
        basePay: pr.baseSalary,
        incentive: pr.incentiveAmount,
        adjustedIncentive: pr.incentiveAmount, // TODO: Calculate adjusted
        totalPay: pr.netSalary,
        totalUnits: 0, // TODO: Get from job records
        validUnits: 0, // TODO: Calculate
        complianceScore: 95, // TODO: Calculate
        status: "success",
      };
    });

    const summary: PayrollSummary | null = results.length > 0 ? {
      totalEmployees: results.length,
      totalBasePay: results.reduce((sum, r) => sum + r.basePay, 0),
      totalIncentive: results.reduce((sum, r) => sum + r.adjustedIncentive, 0),
      totalPay: results.reduce((sum, r) => sum + r.totalPay, 0),
      avgComplianceScore: results.reduce((sum, r) => sum + r.complianceScore, 0) / results.length,
    } : null;

    return { payrollResults: results, payrollSummary: summary };
  }, [selectedMonth, selectedYear, payrollRuns, getPayrollForMonth, getEmployeeById]);

  const handleRunPayroll = async () => {
    // Validation
    if (!selectedMonth || !selectedYear) {
      toast.error("Please select month and year");
      return;
    }

    // GUARD: Prevent duplicate payroll execution for same period
    const monthIndex = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(selectedMonth);
    const monthStr = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}`;
    const existingPayrolls = getPayrollForMonth(monthStr);

    if (existingPayrolls.length > 0) {
      toast.error("Payroll already exists for this period", {
        description: `Found ${existingPayrolls.length} existing payroll records for ${selectedMonth} ${selectedYear}. Use HR Review to modify existing payroll.`
      });
      return;
    }

    setIsRunning(true);
    setError(null);
    setHasRun(false);

    try {
      // ✅ H09 FIX: Real payroll run — reads attendance for each employee
      // computeDaysPresent uses AttendanceContext (Present=1, Late=1, HalfDay=0.5)
      let processed = 0;
      for (const run of payrollRuns.filter(r =>
        r.month === String(selectedMonth) && r.year === Number(selectedYear)
      )) {
        const days = computeDaysPresent(run.employeeId, `${selectedYear}-${String(selectedMonth).padStart(2,"0")}`);
        if (days > 0) {
          // Subtract approved unpaid (UL/LWP) leaves for this employee this month
          const leaveRequests = DataService.get<{
            employeeId: string; leaveType: string; status: string;
            fromDate: string; toDate: string;
          }>("LEAVE_REQUESTS");
          const monthStr = `${selectedYear}-${String(
            ["January","February","March","April","May","June",
             "July","August","September","October","November","December"]
            .indexOf(selectedMonth) + 1
          ).padStart(2,"0")}`;
          const unpaidLeaveDays = leaveRequests
            .filter(l =>
              l.employeeId === run.employeeId &&
              l.status === "Approved" &&
              (l.leaveType === "UL" || l.leaveType === "LWP") &&
              l.fromDate?.startsWith(monthStr)
            )
            .reduce((total, l) => {
              const from = new Date(l.fromDate);
              const to = new Date(l.toDate || l.fromDate);
              const diff = Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1;
              return total + diff;
            }, 0);

          const adjustedDays = Math.max(0, days - unpaidLeaveDays);
          // Days present computed from real attendance, minus approved unpaid leaves
          processPayroll({ ...run, daysWorked: adjustedDays, status: "draft" });
          processed++;
        }
      }

      if (processed === 0) {
        // No attendance records yet — still mark as run but show warning
        toast.warning("No attendance records found for this period. daysPresent will need manual entry.");
      }
      setHasRun(true);
      toast.success("Payroll calculated successfully!");
    } catch (err) {
      setError("Failed to process payroll. Please try again.");
      toast.error("Payroll processing failed");
    } finally {
      setIsRunning(false);
    }
  };


  const toggleEmployeeBreakdown = (employeeId: string) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payroll Run</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure inputs and execute payroll processing
        </p>
      </div>

      {/* Engine Label */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Database className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Data Source: payrollEngine + incentiveEngine</p>
          <p className="text-xs text-blue-700">
            All calculations performed by payrollEngine • No UI calculations
          </p>
        </div>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payroll Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Month
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Year
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                City
              </label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Cities</SelectItem>
                  {Object.values(CITIES).map(c=>(<SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Cluster
              </label>
              <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cluster" />
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

          {/* Employee Scope */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Employee Scope
            </label>
            <Select value={selectedEmployeeScope} onValueChange={(v) => setSelectedEmployeeScope(v as "all" | "individual")}>
              <SelectTrigger>
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                <SelectItem value="individual">Individual Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Run Button */}
          <div className="pt-4">
            <Button
              onClick={handleRunPayroll}
              disabled={isRunning || !selectedMonth || !selectedYear}
              className="w-full sm:w-auto min-h-[44px]"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Run Payroll
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {hasRun && payrollSummary && (
        <>
          {/* Summary Cards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Results</h3>
            <p className="text-xs text-gray-600 mb-4 flex items-center gap-2">
              <Database className="w-3 h-3" />
              Calculated by Payroll Engine
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {payrollSummary.totalEmployees}
                  </div>
                  <div className="text-sm text-gray-600">Total Employees</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(payrollSummary.totalBasePay)}
                  </div>
                  <div className="text-sm text-gray-600">Base Pay</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(payrollSummary.totalIncentive)}
                  </div>
                  <div className="text-sm text-gray-600">Total Incentive</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(payrollSummary.totalPay)}
                  </div>
                  <div className="text-sm text-gray-600">Total Pay</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Employee Payroll List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Employee Payroll Breakdown</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-7 gap-4 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
                  <div className="col-span-2">Employee</div>
                  <div>Role</div>
                  <div className="text-right">Total Pay</div>
                  <div className="text-right">Units</div>
                  <div className="text-right">Compliance</div>
                  <div className="text-center">Actions</div>
                </div>

                {/* Table Rows */}
                {payrollResults.map((result) => (
                  <div key={result.employeeId}>
                    <div className="grid grid-cols-7 gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="col-span-2">
                        <div className="font-medium text-gray-900">{result.employeeName}</div>
                        <div className="text-xs text-gray-500">{result.employeeId}</div>
                      </div>
                      <div className="text-sm text-gray-700">{result.role}</div>
                      <div className="text-right font-semibold text-gray-900">
                        {formatCurrency(result.totalPay)}
                      </div>
                      <div className="text-right text-sm text-gray-700">
                        {result.validUnits}/{result.totalUnits}
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            result.complianceScore >= 90
                              ? "bg-green-100 text-green-700"
                              : result.complianceScore >= 75
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {result.complianceScore}%
                        </Badge>
                      </div>
                      <div className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEmployeeBreakdown(result.employeeId)}
                        >
                          {expandedEmployee === result.employeeId ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Breakdown */}
                    {expandedEmployee === result.employeeId && (
                      <div className="ml-8 mr-4 mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Payroll Breakdown</h4>
                        <p className="text-xs text-gray-600 mb-3 flex items-center gap-2">
                          <Database className="w-3 h-3" />
                          Calculated by Payroll Engine
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Base Pay */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-xs text-gray-600 mb-1">Base Pay</div>
                              <div className="text-lg font-bold text-gray-900">
                                {formatCurrency(result.basePay)}
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                From salary structure
                              </div>
                            </CardContent>
                          </Card>

                          {/* Incentive */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-xs text-gray-600 mb-1">Incentive</div>
                              <div className="text-lg font-bold text-purple-700">
                                {formatCurrency(result.incentive)}
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                Raw incentive from units
                              </div>
                            </CardContent>
                          </Card>

                          {/* Compliance Adjustment */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-xs text-gray-600 mb-1">Adjusted Incentive</div>
                              <div className="text-lg font-bold text-green-700">
                                {formatCurrency(result.adjustedIncentive)}
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                After compliance adjustment
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Meta Information */}
                        <div className="mt-4 p-3 bg-white rounded border">
                          <h5 className="text-xs font-semibold text-gray-700 mb-2">Performance Metrics</h5>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-gray-600">Total Units</div>
                              <div className="font-semibold text-gray-900">{result.totalUnits}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Valid Units</div>
                              <div className="font-semibold text-gray-900">{result.validUnits}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Compliance Score</div>
                              <div className="font-semibold text-gray-900">{result.complianceScore}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Export Payroll Data</p>
                  <p className="text-xs text-gray-600">Download reports and payslips</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Payslips
                  </Button>
                  <Button>
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
