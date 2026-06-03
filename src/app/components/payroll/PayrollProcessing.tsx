import React, { useState, useEffect } from "react";
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
import {
  CalendarDays,
  User,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  Banknote,
  CreditCard,
  ShieldCheck,
  FileText,
  Download,
  HelpCircle,
  Loader2,
} from "lucide-react";
import {
  fetchMonthlyPayroll,
  type MonthlyPayrollResponse,
} from "../../services/payrollService";
import {
  ATTENDANCE_TYPE_LABELS,
  ATTENDANCE_TYPE_COLORS,
} from "../../constants/payrollConstants";
import { ExplainSalaryModal } from "./ExplainSalaryModal";

export function PayrollProcessing() {
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState<MonthlyPayrollResponse | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("01");
  const [selectedYear, setSelectedYear] = useState("2022");
  const [showExplainModal, setShowExplainModal] = useState(false);

  useEffect(() => {
    loadPayrollData();
  }, [selectedMonth, selectedYear]);

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const data = await fetchMonthlyPayroll(
        "CW0001",
        parseInt(selectedMonth),
        parseInt(selectedYear)
      );
      setPayrollData(data);
    } catch (error) {
      console.error("Error loading payroll data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  if (!payrollData) {
    return (
      <div className="p-6">
        <div className="text-center space-y-4">
          <FileText className="w-16 h-16 text-gray-400 mx-auto" />
          <p className="text-gray-600">No payroll data available</p>
        </div>
      </div>
    );
  }

  const { employee, attendance, payroll } = payrollData;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monthly Payroll Processing</h1>
          <p className="text-gray-600 mt-2">
            Complete attendance and salary calculation for {employee.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="01">January</SelectItem>
              <SelectItem value="02">February</SelectItem>
              <SelectItem value="03">March</SelectItem>
              <SelectItem value="04">April</SelectItem>
              <SelectItem value="05">May</SelectItem>
              <SelectItem value="06">June</SelectItem>
              <SelectItem value="07">July</SelectItem>
              <SelectItem value="08">August</SelectItem>
              <SelectItem value="09">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employee Master Data */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Employee Code</p>
              <p className="font-semibold text-gray-900">{employee.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Name</p>
              <p className="font-semibold text-gray-900">{employee.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Department</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <Building2 className="w-4 h-4 text-gray-500" />
                {employee.department}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Designation</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-gray-500" />
                {employee.designation}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Branch</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                {employee.branch}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Date of Joining</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                {new Date(employee.dateOfJoining).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Bank Name</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <Banknote className="w-4 h-4 text-gray-500" />
                {employee.bankName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Number</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-gray-500" />
                {employee.accountNumber}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Days</p>
            <p className="text-2xl font-bold text-gray-900">{attendance.summary.totalDays}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-green-700 mb-1">Pay Days</p>
            <p className="text-2xl font-bold text-green-900">{attendance.summary.payDays}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700 mb-1">Present Days</p>
            <p className="text-2xl font-bold text-blue-900">{attendance.summary.presentDays}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <p className="text-sm text-orange-700 mb-1">Deduction Days</p>
            <p className="text-2xl font-bold text-orange-900">
              {(attendance?.summary?.deductionDays ?? 0).toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <p className="text-sm text-purple-700 mb-1">Net Pay</p>
            <p className="text-2xl font-bold text-purple-900">
              ₹{(payroll?.netPay ?? 0).toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader className="bg-blue-50 border-b border-blue-200">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Attendance Details - {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Attendance Type</TableHead>
                  <TableHead className="font-semibold">In Time</TableHead>
                  <TableHead className="font-semibold">Out Time</TableHead>
                  <TableHead className="font-semibold">Working Hours</TableHead>
                  <TableHead className="font-semibold">Indicators</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.dailyLogs.map((log, index) => (
                  <TableRow
                    key={index}
                    className={log.isSunday || log.isHoliday ? "bg-gray-50" : ""}
                  >
                    <TableCell className="font-medium">
                      {new Date(log.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {log.isSunday && (
                        <span className="text-xs text-gray-500 ml-2">(Sun)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={ATTENDANCE_TYPE_COLORS[log.status as keyof typeof ATTENDANCE_TYPE_COLORS]}
                      >
                        {ATTENDANCE_TYPE_LABELS[log.status as keyof typeof ATTENDANCE_TYPE_LABELS] || log.status}
                      </Badge>
                      {log.holidayName && (
                        <span className="text-xs text-gray-600 ml-2 block mt-1">
                          {log.holidayName}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{log.inTime || "-"}</TableCell>
                    <TableCell>{log.outTime || "-"}</TableCell>
                    <TableCell>
                      {log.workingHours > 0 ? `${log.workingHours}h` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {log.isLate && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                            Late
                          </Badge>
                        )}
                        {log.isAutoLogout && (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                            Auto Logout
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Calculation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings */}
        <Card className="border-green-200">
          <CardHeader className="bg-green-50 border-b border-green-200">
            <CardTitle className="text-lg text-green-900">Earnings</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payroll.earnings.map((earning, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{earning.name}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{(earning?.amount ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-green-50 border-t-2 border-green-300">
                  <TableCell className="font-bold text-green-900">Gross Pay</TableCell>
                  <TableCell className="text-right font-bold text-green-900">
                    ₹{(payroll?.grossPay ?? 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card className="border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <CardTitle className="text-lg text-red-900">Deductions</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payroll.deductions.map((deduction, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{deduction.name}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{(deduction?.amount ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-red-50 border-t-2 border-red-300">
                  <TableCell className="font-bold text-red-900">Total Deductions</TableCell>
                  <TableCell className="text-right font-bold text-red-900">
                    ₹{(payroll?.totalDeductions ?? 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Net Pay & Actions */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-purple-700 mb-2">Net Salary</p>
              <p className="text-4xl font-bold text-purple-900">
                ₹{(payroll?.netPay ?? 0).toFixed(2)}
              </p>
              <p className="text-sm text-purple-600 mt-2">
                Employer Contribution: EPF ₹{(payroll?.employerContribution?.epf ?? 0).toFixed(2)} + ESIC ₹
                {(payroll?.employerContribution?.esic ?? 0).toFixed(2)} = ₹
                {(payroll?.employerContribution?.total ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
                onClick={() => setShowExplainModal(true)}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Explain Salary
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Download className="w-4 h-4 mr-2" />
                Download Payslip
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explain Salary Modal */}
      {showExplainModal && payrollData && (
        <ExplainSalaryModal
          open={showExplainModal}
          onClose={() => setShowExplainModal(false)}
          payrollData={payrollData}
        />
      )}
    </div>
  );
}
