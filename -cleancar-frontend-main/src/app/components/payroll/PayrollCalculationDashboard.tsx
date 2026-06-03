import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  AlertCircle,
  Download,
  Play,
  RefreshCw,
  FileText,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { salaryHoldService, SalaryHoldRecord } from "../../services/salaryHoldService";
import { SALARY_HOLD_STATUS } from "../../constants/payrollConstants";
import { usePayroll } from "../../contexts/PayrollContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface CalculationSummary {
  month: string;
  totalEmployees: number;
  totalFixedSalary: number;
  totalIncentives: number;
  totalBonuses: number;
  totalDeductions: number;
  netPayable: number;
  status: "pending" | "calculated" | "approved" | "processed";
}

interface EmployeeCalculation {
  id: string;
  name: string;
  empId: string;
  role: string;
  fixedSalary: number;
  incentivesEarned: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  attendanceDays: number;
  performance: number;
  salaryHoldStatus?: "ACTIVE" | "ON_HOLD" | "OVERRIDE_PENDING" | "RELEASED";
}

export function PayrollCalculationDashboard() {
  const { payrollRuns } = usePayroll();
  const { employees } = useEmployee();
  const { city } = useCity();

  const activeEmployees = employees.filter(emp =>
    emp.status === "Active" &&
    (emp.city === city || emp.cityId === city || emp.city?.toLowerCase() === city.replace("CITY-", "").toLowerCase())
  );

  const calculations = payrollRuns.map(run => { const emp = employees.find(e => e.employeeId === run.employeeId); return { employeeId:run.employeeId, employeeName:emp?emp.firstName+" "+emp.lastName:run.employeeId, basic:Math.round((run.grossSalary||0)*0.5), hra:Math.round((run.grossSalary||0)*0.2), incentive:run.incentiveAmount||0, pf:run.deductions?.pf_employee||0, esic:run.deductions?.esic||0, pt:run.deductions?.pt||200, gross:run.grossSalary, net:run.netSalary }; });

  const [employeeFilter, setEmployeeFilter] = useState("all");

  const filteredCalculations = employeeFilter === "all"
    ? calculations
    : calculations.filter(c => c.employeeId === employeeFilter);

  const [summary, setSummary] = useState<CalculationSummary>({
    month: "March 2026",
    totalEmployees: 0,
    totalFixedSalary: 0,
    totalIncentives: 0,
    totalBonuses: 0,
    totalDeductions: 0,
    netPayable: 0,
    status: "calculated",
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [salaryHoldRecords, setSalaryHoldRecords] = useState<Map<string, SalaryHoldRecord>>(new Map());

  // Sync employee count whenever city or employees change
  useEffect(() => {
    setSummary(prev => ({ ...prev, totalEmployees: activeEmployees.length }));
  }, [activeEmployees.length]);

  // Load salary hold records on mount
  useEffect(() => {
    const records = salaryHoldService.getAllRecords();
    const recordMap = new Map<string, SalaryHoldRecord>();
    records.forEach((record) => {
      recordMap.set(record.employeeId, record);
    });
    setSalaryHoldRecords(recordMap);

    // Subscribe to changes
    const unsubscribe = salaryHoldService.subscribe((updatedRecords) => {
      const updatedMap = new Map<string, SalaryHoldRecord>();
      updatedRecords.forEach((record) => {
        updatedMap.set(record.employeeId, record);
      });
      setSalaryHoldRecords(updatedMap);
    });

    return unsubscribe;
  }, []);

  const runCalculation = () => {
    setIsCalculating(true);
    toast.loading("Calculating payroll...");
    
    setTimeout(() => {
      setIsCalculating(false);
      toast.dismiss();
      toast.success("Payroll calculated successfully for 127 employees");
      setSummary({ ...summary, status: "calculated" });
    }, 2000);
  };

  const recalculate = () => {
    toast.info("Re-calculating payroll with latest data...");
    runCalculation();
  };

  const exportData = () => {
    toast.success("Payroll data exported to Excel");
  };

  const isPayslipGenerationAllowed = (empId: string): boolean => {
    const holdRecord = salaryHoldRecords.get(empId);
    if (!holdRecord) return true;

    return holdRecord.status === SALARY_HOLD_STATUS.RELEASED ||
           holdRecord.status === SALARY_HOLD_STATUS.ACTIVE;
  };

  const getSalaryHoldStatus = (empId: string) => {
    return salaryHoldRecords.get(empId);
  };

  const generatePayslip = (emp: EmployeeCalculation) => {
    if (!isPayslipGenerationAllowed(emp.empId)) {
      const holdRecord = salaryHoldRecords.get(emp.empId);
      toast.error(
        `Cannot generate payslip: ${holdRecord?.status === SALARY_HOLD_STATUS.ON_HOLD
          ? "Salary is ON HOLD due to ghosting detection"
          : "Salary hold override request is pending approval"}`,
        { duration: 5000 }
      );
      return;
    }

    toast.success(`Generating payslip for ${emp.name}...`);
  };

  const blockedEmployees = filteredCalculations.filter((emp) => !isPayslipGenerationAllowed(emp.empId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Calculation Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Automated monthly salary calculation for {summary.month}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees ({activeEmployees.length})</SelectItem>
              {activeEmployees.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.fullName} — {e.designation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={recalculate}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalculate
          </Button>
          <Button onClick={runCalculation} className="bg-blue-600 hover:bg-blue-700">
            <Play className="w-4 h-4 mr-2" />
            Run Calculation
          </Button>
        </div>
      </div>

      {/* Salary Hold Warning Banner */}
      {blockedEmployees.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 text-lg">
                  ⚠️ Salary Hold Alert - {blockedEmployees.length} Employee{blockedEmployees.length > 1 ? "s" : ""} Blocked
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  The following employees have salary holds and cannot have payslips generated until the hold is resolved:
                </p>
                <div className="mt-2 space-y-1">
                  {blockedEmployees.map((emp) => {
                    const holdRecord = getSalaryHoldStatus(emp.empId);
                    return (
                      <div key={emp.id} className="text-sm text-red-800 flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        <span className="font-medium">{emp.name} ({emp.empId})</span>
                        <span className="text-red-600">- {holdRecord?.holdReason}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-red-600 mt-3 font-medium">
                  → Go to Approval Center to process override requests or contact supervisors for resolution.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="p-3 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold mb-1">Payroll Status: {summary.status.toUpperCase()}</h3>
              <p className="text-blue-100">
                {summary.status === "calculated"
                  ? "Ready for review and approval"
                  : summary.status === "pending"
                  ? "Awaiting calculation"
                  : "Processing complete"}
              </p>
            </div>
            <Calendar className="w-16 h-16 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-blue-900">{summary.totalEmployees}</p>
                <p className="text-xs text-blue-600 mt-1">Active in payroll</p>
              </div>
              <Users className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Fixed Salary</p>
                <p className="text-3xl font-bold text-green-900">
                  ₹{(summary.totalFixedSalary / 100000).toFixed(1)}L
                </p>
                <p className="text-xs text-green-600 mt-1">Base payroll</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 mb-1">Incentives</p>
                <p className="text-3xl font-bold text-purple-900">
                  ₹{(summary.totalIncentives / 100000).toFixed(1)}L
                </p>
                <p className="text-xs text-purple-600 mt-1">Performance pay</p>
              </div>
              <Award className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 mb-1">Bonuses</p>
                <p className="text-3xl font-bold text-orange-900">
                  ₹{(summary.totalBonuses / 100000).toFixed(1)}L
                </p>
                <p className="text-xs text-orange-600 mt-1">Special bonuses</p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 mb-1">Deductions</p>
                <p className="text-3xl font-bold text-red-900">
                  ₹{(summary.totalDeductions / 100000).toFixed(1)}L
                </p>
                <p className="text-xs text-red-600 mt-1">PF, ESI, Tax</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-900 bg-gray-900 text-white">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-1">Net Payable</p>
                <p className="text-3xl font-bold">
                  ₹{(summary.netPayable / 100000).toFixed(2)}L
                </p>
                <p className="text-xs text-gray-400 mt-1">Total payout</p>
              </div>
              <DollarSign className="w-12 h-12 text-white opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Calculations Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Employee-wise Calculation</CardTitle>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 text-sm font-semibold">Employee</th>
                  <th className="text-left p-3 text-sm font-semibold">Role</th>
                  <th className="text-right p-3 text-sm font-semibold">Fixed</th>
                  <th className="text-right p-3 text-sm font-semibold">Incentives</th>
                  <th className="text-right p-3 text-sm font-semibold">Bonus</th>
                  <th className="text-right p-3 text-sm font-semibold">Deductions</th>
                  <th className="text-right p-3 text-sm font-semibold">Net Salary</th>
                  <th className="text-center p-3 text-sm font-semibold">Days</th>
                  <th className="text-center p-3 text-sm font-semibold">Status</th>
                  <th className="text-center p-3 text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalculations.map((emp) => {
                  const holdRecord = getSalaryHoldStatus(emp.empId);
                  const isBlocked = !isPayslipGenerationAllowed(emp.empId);

                  return (
                    <tr
                      key={emp.id}
                      className={`border-b hover:bg-gray-50 ${isBlocked ? "bg-red-50" : ""}`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {isBlocked && <Lock className="w-4 h-4 text-red-600" />}
                          <div>
                            <p className="font-medium text-sm">{emp.name}</p>
                            <p className="text-xs text-gray-500">{emp.empId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {emp.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-right text-sm">₹{(emp?.fixedSalary ?? 0).toLocaleString()}</td>
                      <td className="p-3 text-right text-sm text-purple-600 font-medium">
                        +₹{(emp?.incentivesEarned ?? 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-sm text-orange-600 font-medium">
                        +₹{(emp?.bonuses ?? 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-sm text-red-600">
                        -₹{(emp?.deductions ?? 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`font-bold ${isBlocked ? "text-gray-400 line-through" : "text-blue-600"}`}>
                          ₹{(emp?.netSalary ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3 text-center text-sm">{emp.attendanceDays}</td>
                      <td className="p-3 text-center">
                        {holdRecord && holdRecord.status !== SALARY_HOLD_STATUS.ACTIVE && holdRecord.status !== SALARY_HOLD_STATUS.RELEASED ? (
                          <Badge
                            variant="destructive"
                            className="text-xs bg-red-600 hover:bg-red-700"
                            title={holdRecord.holdReason}
                          >
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            {holdRecord.status === SALARY_HOLD_STATUS.ON_HOLD ? "BLOCKED" : "PENDING"}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant={isBlocked ? "outline" : "default"}
                          disabled={isBlocked}
                          onClick={() => generatePayslip(emp)}
                          className={isBlocked ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          {isBlocked ? "Locked" : "Generate"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Calculation Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm font-semibold text-gray-900">Attendance System</p>
              <p className="text-xs text-gray-600 mt-1">Days worked, leaves</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm font-semibold text-gray-900">Performance Data</p>
              <p className="text-xs text-gray-600 mt-1">Ratings, reviews</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm font-semibold text-gray-900">CRM Revenue</p>
              <p className="text-xs text-gray-600 mt-1">Sales, conversions</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm font-semibold text-gray-900">Operations</p>
              <p className="text-xs text-gray-600 mt-1">Jobs, quality metrics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
