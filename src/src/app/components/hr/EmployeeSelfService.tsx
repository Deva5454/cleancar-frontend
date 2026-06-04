/**
 * Employee Self-Service Portal
 * Shows employees their own attendance, grace period usage, and leave information
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { BackButton } from "../ui/back-button";
import {
  Clock,
  Calendar,
  AlertCircle,
  ShieldAlert,
  TrendingUp,
  Award,
  CheckCircle,
  FileText,
  DollarSign,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  History,
} from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import {
  ATTENDANCE_TYPES,
  ATTENDANCE_TYPE_LABELS,
  ATTENDANCE_TYPE_COLORS,
  SALARY_HOLD_STATUS,
} from "../../constants/payrollConstants";
import { gracePeriodService } from "../../services/gracePeriodService";
import { salaryHoldService } from "../../services/salaryHoldService";
import { useRole } from "../../contexts/RoleContext";
import { generateEmployeeId, generateEmployeeCode, getEmployeeStatusFromRole } from "../../utils/employeeUtils";
import { leaveBalanceService, type EmployeeLeaveBalance } from "../../services/leaveBalanceService";
import { MASTER_EMPLOYEES } from "../../data/employeeData";

// Historical Payslip Data Type
interface MonthlyPayslipData {
  month: string; // YYYY-MM format
  hasDeduction: boolean;
  deductionAmount: number;
  deductionDays: number;
  lateComingCount: number;
  autoLogoutCount: number;
  perDayRate: number;
  netPayable: number;
  grossSalary: number;
  attendanceSummary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    paidLeaveDays: number;
    weeklyOffs: number;
  };
  adjustmentRequest?: {
    status: "none" | "pending" | "approved" | "rejected";
    plDaysRequested: number;
    deductionAmount: number;
    requestedAt?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
  };
}

// Generate mock historical data from joining date to current month
const generateHistoricalPayslipData = (employeeName: string, joiningDate: string): MonthlyPayslipData[] => {
  const history: MonthlyPayslipData[] = [];
  const startDate = new Date(joiningDate);
  const currentDate = new Date("2026-04-08"); // Current date in the system

  let date = new Date(startDate);

  while (date <= currentDate) {
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthNum = date.getMonth();

    // Varying deduction patterns based on month
    const hasDeduction = Math.random() > 0.6; // 40% chance of having deduction
    const lateComingCount = hasDeduction ? Math.floor(Math.random() * 5) + 1 : 0;
    const autoLogoutCount = hasDeduction ? Math.floor(Math.random() * 3) : 0;
    const deductionDays = hasDeduction ? parseFloat((lateComingCount * 0.5 + autoLogoutCount * 0.5).toFixed(1)) : 0;
    const perDayRate = 215;
    const deductionAmount = Math.round(deductionDays * perDayRate);
    const grossSalary = 18000;
    const netPayable = grossSalary - deductionAmount;

    const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const absentDays = Math.floor(Math.random() * 2);
    const paidLeaveDays = Math.floor(Math.random() * 3);
    const weeklyOffs = Math.floor(totalDays / 7) * 1; // Assuming 1 weekly off
    const presentDays = totalDays - absentDays - paidLeaveDays - weeklyOffs;

    history.push({
      month: monthStr,
      hasDeduction,
      deductionAmount,
      deductionDays,
      lateComingCount,
      autoLogoutCount,
      perDayRate,
      netPayable,
      grossSalary,
      attendanceSummary: {
        totalDays,
        presentDays,
        absentDays,
        paidLeaveDays,
        weeklyOffs,
      },
      adjustmentRequest: hasDeduction && Math.random() > 0.7 ? {
        status: ["pending", "approved", "rejected"][Math.floor(Math.random() * 3)] as any,
        plDaysRequested: deductionDays,
        deductionAmount,
        requestedAt: `${monthStr}-15`,
        approvedBy: hasDeduction ? "HR Manager" : undefined,
        approvedAt: hasDeduction ? `${monthStr}-20` : undefined,
      } : undefined,
    });

    // Move to next month
    date.setMonth(date.getMonth() + 1);
  }

  return history.reverse(); // Most recent first
};

export function EmployeeSelfService() {
  const { currentRole, currentUser } = useRole();

  // ✅ MC-23: Strict access control - Only HR/Admin can view other employees
  const isHR = currentRole === "HR" || currentRole === "Super Admin" || currentRole === "Admin";

  // Generate employee ID from current user context
  const currentEmployee = {
    id: generateEmployeeId(currentUser.name, currentRole),
    empCode: generateEmployeeCode(currentUser.name, currentRole),
    name: currentUser.name,
    role: currentRole,
    department: currentUser.city,
    joiningDate: "2024-01-15", // Mock joining date
  };

  const [graceStats, setGraceStats] = useState<any>(null);
  const [salaryHoldRecord, setSalaryHoldRecord] = useState<any>(null);
  const [employeeBalance, setEmployeeBalance] = useState<EmployeeLeaveBalance | null>(null);

  // Historical Data States
  // ✅ MC-23: Non-admin users can ONLY view their own data (no employee selector)
  const [selectedEmployee, setSelectedEmployee] = useState(currentEmployee.name);
  const [selectedMonth, setSelectedMonth] = useState("2026-04"); // Current month
  const [historicalData, setHistoricalData] = useState<MonthlyPayslipData[]>([]);
  const [viewMode, setViewMode] = useState<"current" | "history">("current");

  // Leave Adjustment States
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentDays, setAdjustmentDays] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentRequest, setAdjustmentRequest] = useState<{
    status: "none" | "pending" | "approved" | "rejected";
    plDaysRequested: number;
    deductionAmount: number;
    requestedAt?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
  }>({
    status: "none",
    plDaysRequested: 0,
    deductionAmount: 0,
  });

  // Get payslip data for selected month
  const selectedMonthData = historicalData.find(d => d.month === selectedMonth);
  const mockPayslip = selectedMonthData || {
    hasDeduction: true,
    deductionAmount: 322,
    deductionDays: 1.5,
    lateComingCount: 3,
    autoLogoutCount: 2,
    perDayRate: 215,
    netPayable: 17678,
    grossSalary: 18000,
    attendanceSummary: {
      totalDays: 30,
      presentDays: 26,
      absentDays: 1,
      paidLeaveDays: 2,
      weeklyOffs: 4,
    },
  };

  // Policy config
  const policyConfig = {
    enablePLAdjustment: true,
    maxMonthlyLimit: 2,
    maxPerRequest: 1,
  };

  // Handlers for leave adjustment
  const handleRequestAdjustment = () => {
    const plDays = parseFloat(adjustmentDays);

    if (!plDays || plDays <= 0) {
      toast.error("Please enter valid PL days");
      return;
    }

    if (!adjustmentReason.trim()) {
      toast.error("Please provide a reason for adjustment");
      return;
    }

    setAdjustmentRequest({
      status: "pending",
      plDaysRequested: plDays,
      deductionAmount: mockPayslip.deductionAmount,
      requestedAt: new Date().toLocaleString(),
    });

    setShowAdjustmentModal(false);
    setAdjustmentDays("");
    setAdjustmentReason("");
    toast.success("Leave adjustment request submitted for HR approval");
  };

  const handleCancelAdjustment = () => {
    setShowAdjustmentModal(false);
    setAdjustmentDays("");
    setAdjustmentReason("");
  };

  useEffect(() => {
    try {
      // ✅ MC-23: Strict identity filtering - employees can ONLY see their own data
      const employeeToLoad = isHR ? selectedEmployee : currentEmployee.name;
      const employeeId = generateEmployeeId(employeeToLoad, currentRole);

      // 🔐 SECURITY: Log access for audit trail
      if (!isHR && employeeToLoad !== currentEmployee.name) {
        console.error("⛔ Unauthorized payslip access attempt", {
          attemptedEmployee: employeeToLoad,
          loggedInUser: currentEmployee.name,
          role: currentRole
        });
        return; // Block access
      }

      // Load grace period statistics
      const stats = gracePeriodService.getGraceStatistics(employeeId);
      setGraceStats(stats);

      // Check for salary hold
      const holdRecord = salaryHoldService.getHoldRecord(employeeId);
      setSalaryHoldRecord(holdRecord || null);

      // Load leave balance
      let balance = leaveBalanceService.getEmployeeBalance(employeeId);

      // Initialize if not exists
      if (!balance) {
        const employeeStatus = getEmployeeStatusFromRole(currentRole);
        balance = leaveBalanceService.initializeEmployeeBalance(
          employeeId,
          employeeToLoad,
          employeeStatus,
          "2024-01-01"
        );
      }
      setEmployeeBalance(balance);

      // Load historical payslip data
      const history = generateHistoricalPayslipData(employeeToLoad, currentEmployee.joiningDate);
      setHistoricalData(history);

      // Subscribe to updates
      const unsubscribe = salaryHoldService.subscribe((records) => {
        const record = records.find((r) => r.employeeId === employeeId);
        setSalaryHoldRecord(record || null);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error loading employee data:", error);
    }
  }, [selectedEmployee, currentEmployee.name, currentRole, isHR]);

  // Mock recent attendance data
  const recentAttendance = [
    { date: "2026-04-08", day: "Tue", status: ATTENDANCE_TYPES.PRESENT },
    { date: "2026-04-07", day: "Mon", status: ATTENDANCE_TYPES.PRESENT },
    { date: "2026-04-06", day: "Sun", status: ATTENDANCE_TYPES.WEEKLY_OFF },
    { date: "2026-04-05", day: "Sat", status: ATTENDANCE_TYPES.PAID_LEAVE },
    { date: "2026-04-04", day: "Fri", status: ATTENDANCE_TYPES.FIRST_HALF },
    { date: "2026-04-03", day: "Thu", status: ATTENDANCE_TYPES.WEEKLY_OFF },
    { date: "2026-04-02", day: "Wed", status: ATTENDANCE_TYPES.PRESENT },
    { date: "2026-04-01", day: "Tue", status: ATTENDANCE_TYPES.PRESENT },
  ];

  // Calculate leave balance from employee balance
  const getTotalAvailable = () => {
    if (!employeeBalance) return 0;
    return Object.values(employeeBalance.balances).reduce((sum, bal) => sum + (bal?.available || 0), 0);
  };

  const getLeaveByType = (type: string) => {
    if (!employeeBalance) return 0;
    return employeeBalance.balances[type as keyof typeof employeeBalance.balances]?.available || 0;
  };

  return (
    <div className="space-y-6 p-6">
      <BackButton to="/hr" />

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isHR ? "Employee Attendance & Payslip Records" : "My Attendance & Leave"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isHR ? "View attendance, deductions, and leave adjustments for all employees" : `${currentEmployee.name} • ${currentEmployee.empCode} • ${currentEmployee.role}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              Joined: {new Date(currentEmployee.joiningDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </Badge>
          </div>
        </div>

        {/* HR Employee Selector and Month Selector */}
        <div className="flex flex-wrap items-end gap-4">
          {/* ✅ MC-23: ONLY HR/Admin can switch employees - Regular users locked to own data */}
          {isHR && (
            <div className="flex-1 min-w-[250px]">
              <Label htmlFor="employee-select" className="text-xs text-gray-600 mb-1 block">
                <User className="w-3 h-3 inline mr-1" />
                Select Employee (Admin Only)
              </Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MASTER_EMPLOYEES.map((emp) => (
                    <SelectItem key={emp.id} value={emp.name}>
                      {emp.name} ({emp.empCode}) - {emp.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 🔐 Regular employees see their identity locked */}
          {!isHR && (
            <div className="flex-1 min-w-[250px] p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Viewing As</p>
              <p className="font-semibold text-blue-900">{currentEmployee.name}</p>
              <p className="text-xs text-blue-600 mt-1">🔒 You can only view your own records</p>
            </div>
          )}

          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="month-select" className="text-xs text-gray-600 mb-1 block">
              <Calendar className="w-3 h-3 inline mr-1" />
              Select Month
            </Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {historicalData.map((data) => (
                  <SelectItem key={data.month} value={data.month}>
                    {new Date(data.month + "-01").toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    {data.hasDeduction && " 🔴 Deduction"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "current" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("current")}
              className="flex items-center gap-1"
            >
              <FileText className="w-4 h-4" />
              Current View
            </Button>
            <Button
              variant={viewMode === "history" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("history")}
              className="flex items-center gap-1"
            >
              <History className="w-4 h-4" />
              Full History
            </Button>
          </div>
        </div>

        {/* Month Info Banner - Show for selected month */}
        {viewMode === "current" && selectedMonthData && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {new Date(selectedMonth + "-01").toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Viewing: {isHR ? selectedEmployee : currentEmployee.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Present Days</p>
                  <p className="text-lg font-bold text-green-600">{selectedMonthData.attendanceSummary.presentDays}/{selectedMonthData.attendanceSummary.totalDays}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Deduction</p>
                  <p className="text-lg font-bold text-red-600">
                    {selectedMonthData.hasDeduction ? `₹${selectedMonthData.deductionAmount}` : '₹0'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Net Payable</p>
                  <p className="text-lg font-bold text-blue-600">₹{(selectedMonthData?.netPayable ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Month View - Only show when in current view mode */}
      {viewMode === "current" && (
        <>
          {/* Salary Hold Alert (if applicable) */}
          {salaryHoldRecord &&
            salaryHoldRecord.status !== SALARY_HOLD_STATUS.RELEASED &&
            salaryHoldRecord.status !== SALARY_HOLD_STATUS.ACTIVE && (
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <ShieldAlert className="w-5 h-5" />
                ⚠️ Salary Hold Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 text-lg">
                    Your salary has been put ON HOLD
                  </p>
                  <p className="text-sm text-red-700 mt-1">{salaryHoldRecord.holdReason}</p>
                  <div className="mt-3 p-3 bg-white rounded border border-red-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-red-600">Consecutive Absent Days</p>
                        <p className="font-semibold text-red-900">
                          {salaryHoldRecord.consecutiveAbsentDays} days
                        </p>
                      </div>
                      <div>
                        <p className="text-red-600">Hold Date</p>
                        <p className="font-semibold text-red-900">
                          {new Date(salaryHoldRecord.holdDate).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    {salaryHoldRecord.overrideRequest && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-xs text-red-600 font-semibold">Override Request Status</p>
                        <p className="text-sm text-gray-900 mt-1">
                          Your supervisor has submitted an override request which is currently pending
                          approval at the{" "}
                          {
                            salaryHoldRecord.overrideRequest.approvalChain[
                              salaryHoldRecord.overrideRequest.currentLevel
                            ]?.level
                          }{" "}
                          level.
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-red-800 mt-3 font-medium">
                    → Please contact your supervisor immediately to resolve this issue.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">Grace Period Quota</p>
                <p className="text-3xl font-bold text-blue-900">
                  {graceStats ? graceStats.remainingQuota : 3}/3
                </p>
                <p className="text-xs text-blue-600 mt-1">Remaining this month</p>
              </div>
              <Clock className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Leave Balance</p>
                <p className="text-3xl font-bold text-green-900">{getTotalAvailable()}</p>
                <p className="text-xs text-green-600 mt-1">Days available</p>
              </div>
              <Calendar className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 mb-1">This Month</p>
                <p className="text-3xl font-bold text-purple-900">26</p>
                <p className="text-xs text-purple-600 mt-1">Days present</p>
              </div>
              <Award className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grace Period Usage Card */}
      {graceStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              10-Minute Grace Period Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Monthly Quota Status</h4>
                <Badge
                  variant={graceStats.remainingQuota === 0 ? "destructive" : "default"}
                  className={graceStats.remainingQuota === 0 ? "bg-red-600" : "bg-blue-600"}
                >
                  {graceStats.currentUsage}/{graceStats.totalQuota} Used
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                <div
                  className={`h-4 rounded-full transition-all flex items-center justify-end pr-2 ${
                    graceStats.usagePercentage >= 100
                      ? "bg-red-600"
                      : graceStats.usagePercentage >= 66
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(graceStats.usagePercentage, 100)}%` }}
                >
                  <span className="text-xs text-white font-semibold">
                    {Math.round(graceStats.usagePercentage)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded">
                  <p className="text-gray-600 text-xs">Remaining</p>
                  <p className="font-bold text-lg text-green-600">{graceStats.remainingQuota}</p>
                  <p className="text-gray-500 text-xs">times</p>
                </div>
                <div className="text-center p-3 bg-white rounded">
                  <p className="text-gray-600 text-xs">Used</p>
                  <p className="font-bold text-lg text-blue-600">{graceStats.currentUsage}</p>
                  <p className="text-gray-500 text-xs">times</p>
                </div>
                <div className="text-center p-3 bg-white rounded">
                  <p className="text-gray-600 text-xs">Last Used</p>
                  <p className="font-semibold text-sm text-gray-900">
                    {graceStats.lastUsed
                      ? new Date(graceStats.lastUsed).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : "Never"}
                  </p>
                </div>
              </div>

              {graceStats.remainingQuota === 0 && (
                <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> You have exhausted your grace period quota for this month.
                    Any further late arrivals will result in half-day (0.5 days) PL deduction.
                  </p>
                </div>
              )}

              {graceStats.history && graceStats.history.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Usage History</p>
                  <div className="space-y-2">
                    {graceStats.history
                      .slice()
                      .reverse()
                      .map((usage: any) => (
                        <div
                          key={usage.id}
                          className="flex items-center justify-between p-2 bg-white rounded border"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">
                              {new Date(usage.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="text-xs text-gray-600">Arrived at {usage.time}</span>
                            <Badge variant="outline" className="text-xs">
                              {usage.minutesLate} min late
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border rounded-lg">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">
                📋 Grace Period Policy
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>10-minute grace period for late arrivals</li>
                <li>Available 3 times per month (resets on 1st)</li>
                <li>Applicable Mon-Sat, 09:00 AM - 07:00 PM only</li>
                <li>Exceeding quota triggers Half Day (0.5 days) PL deduction</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Recent Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recentAttendance.map((record, idx) => (
              <div key={idx} className="text-center">
                <p className="text-xs text-gray-500 mb-1">{record.day}</p>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {new Date(record.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <div
                  className={`p-3 rounded border text-sm font-semibold ${
                    ATTENDANCE_TYPE_COLORS[record.status]
                  }`}
                  title={ATTENDANCE_TYPE_LABELS[record.status]}
                >
                  {record.status}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {ATTENDANCE_TYPE_LABELS[record.status]}
                </p>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="pt-4 border-t">
            <p className="text-xs font-semibold text-gray-600 mb-2">Status Legend</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
                <span className="text-gray-700">Full Pay (No Deduction)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200" />
                <span className="text-gray-700">Half Pay (0.5 Day)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
                <span className="text-gray-700">Unpaid (Deducted)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-100 border border-purple-200" />
                <span className="text-gray-700">Adjustment (Leave Used)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balance Breakdown */}
      {employeeBalance && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Leave Balance Breakdown
              </CardTitle>
              <Badge variant="outline">{employeeBalance.employeeStatus}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(employeeBalance.balances)
                .filter(([_, balance]) => balance && balance.quota > 0)
                .map(([leaveType, balance], idx) => {
                  const policy = leaveBalanceService.getLeavePolicy(leaveType as any);
                  const colors = [
                    { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", bold: "text-green-900" },
                    { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", bold: "text-blue-900" },
                    { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", bold: "text-purple-900" },
                    { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", bold: "text-orange-900" },
                  ];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={leaveType} className={`p-4 ${color.bg} border ${color.border} rounded-lg`}>
                      <p className={`text-sm ${color.text} mb-1`}>{policy?.name || leaveType}</p>
                      <p className={`text-3xl font-bold ${color.bold}`}>{balance?.available || 0}</p>
                      <p className={`text-xs ${color.text} mt-1`}>Days available</p>
                      {balance && balance.carriedForward > 0 && (
                        <p className="text-xs text-gray-500 mt-1">+{balance.carriedForward} CF</p>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">📌 Leave Policy Notes</h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>PL (Privilege Leave) accrues monthly and can be used for planned absences</li>
                <li>CSL (Casual/Sick Leave) can be used for emergencies and illness</li>
                <li>Comp Off is earned for working on weekly offs or public holidays</li>
                <li>Half-day leaves deduct 0.5 days from leave balance</li>
                <li>Status: {employeeBalance.employeeStatus} - {employeeBalance.employeeStatus === "Probation" ? "Limited quotas apply" : "Full benefits available"}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

          {/* Payslip Summary & Leave Adjustment */}
          {mockPayslip.hasDeduction && (
            <Card className="border-orange-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Current Month Payslip Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Attendance Deduction Alert */}
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-orange-900">Attendance Deduction Applied</p>
                      <p className="text-sm text-orange-700 mt-1">
                        Your payslip has deductions due to late coming and auto-logout violations.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deduction Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Late Coming Count</p>
                    <p className="text-2xl font-bold text-gray-900">{mockPayslip.lateComingCount}</p>
                    <p className="text-xs text-gray-500 mt-1">times this month</p>
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Auto-Logout Count</p>
                    <p className="text-2xl font-bold text-gray-900">{mockPayslip.autoLogoutCount}</p>
                    <p className="text-xs text-gray-500 mt-1">times this month</p>
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Days Deducted</p>
                    <p className="text-2xl font-bold text-red-600">{mockPayslip.deductionDays}</p>
                    <p className="text-xs text-gray-500 mt-1">from salary</p>
                  </div>
                </div>

                {/* Financial Impact */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-red-900">Total Deduction Amount</p>
                    <DollarSign className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">₹{mockPayslip.deductionAmount}</p>
                  <p className="text-xs text-red-700 mt-1">
                    {mockPayslip.deductionDays} days × ₹{mockPayslip.perDayRate} per day
                  </p>
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-700">Net Payable After Deduction:</span>
                      <span className="font-bold text-red-900">₹{(mockPayslip?.netPayable ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Leave Adjustment Option */}
                {policyConfig.enablePLAdjustment && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900 mb-1">
                          💡 Option: Adjust with Leave Balance
                        </p>
                        <p className="text-sm text-blue-700 mb-3">
                          You can request to adjust attendance deductions by using your PL (Privilege Leave) balance instead of salary deduction. This requires HR approval.
                        </p>
                        <div className="text-sm text-blue-600 space-y-1 mb-3">
                          <p>• Available PL Balance: <strong>{getLeaveByType("PL")} days</strong></p>
                          <p>• Days needed for adjustment: <strong>{mockPayslip.deductionDays} days</strong></p>
                          <p>• Monthly adjustment limit: <strong>{policyConfig.maxMonthlyLimit} days</strong></p>
                        </div>

                        {(!mockPayslip.adjustmentRequest || mockPayslip.adjustmentRequest.status === "none") && (
                          <Button
                            onClick={() => setShowAdjustmentModal(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={getLeaveByType("PL") < mockPayslip.deductionDays}
                          >
                            Request Leave Adjustment
                          </Button>
                        )}

                        {mockPayslip.adjustmentRequest?.status === "pending" && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-sm font-semibold text-yellow-900 mb-1">
                              ⏳ Adjustment Request Pending
                            </p>
                            <p className="text-xs text-yellow-700">
                              Your request to adjust {mockPayslip.adjustmentRequest.plDaysRequested} days of PL for ₹{mockPayslip.adjustmentRequest.deductionAmount} deduction is awaiting HR approval.
                            </p>
                            <p className="text-xs text-yellow-600 mt-1">
                              Submitted: {mockPayslip.adjustmentRequest.requestedAt}
                            </p>
                          </div>
                        )}

                        {mockPayslip.adjustmentRequest?.status === "approved" && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <p className="text-sm font-semibold text-green-900">
                                ✅ Adjustment Approved
                              </p>
                            </div>
                            <p className="text-xs text-green-700 mt-1">
                              Approved by {mockPayslip.adjustmentRequest.approvedBy} on {mockPayslip.adjustmentRequest.approvedAt}
                            </p>
                          </div>
                        )}

                        {mockPayslip.adjustmentRequest?.status === "rejected" && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm font-semibold text-red-900 mb-1">
                              ❌ Adjustment Request Rejected
                            </p>
                            <p className="text-xs text-red-700">
                              Reason: {mockPayslip.adjustmentRequest.rejectionReason || "Not specified"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Historical View - Full History Table */}
      {viewMode === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              Complete Payslip & Deduction History
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Showing all records from {new Date(currentEmployee.joiningDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} to present
            </p>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 mb-1">Total Months</p>
                <p className="text-2xl font-bold text-blue-900">{historicalData.length}</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 mb-1">Months with Deductions</p>
                <p className="text-2xl font-bold text-red-900">
                  {historicalData.filter(d => d.hasDeduction).length}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700 mb-1">Total Deduction Amount</p>
                <p className="text-2xl font-bold text-yellow-900">
                  ₹{historicalData.reduce((sum, d) => sum + d.deductionAmount, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 mb-1">Adjustment Requests</p>
                <p className="text-2xl font-bold text-green-900">
                  {historicalData.filter(d => d.adjustmentRequest).length}
                </p>
              </div>
            </div>

            {/* Historical Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Month</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Attendance</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Late Coming</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Auto Logout</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Days Deducted</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">Deduction ₹</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">Net Payable ₹</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Adjustment</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalData.map((record, idx) => (
                    <tr
                      key={record.month}
                      className={`border-b hover:bg-gray-50 cursor-pointer ${record.month === selectedMonth ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        setSelectedMonth(record.month);
                        setViewMode("current");
                      }}
                    >
                      <td className="p-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {new Date(record.month + "-01").toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </span>
                          {record.month === "2026-04" && (
                            <Badge variant="outline" className="text-xs w-fit mt-1">Current</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-green-600">{record.attendanceSummary.presentDays}</span>
                          <span className="text-xs text-gray-500">/ {record.attendanceSummary.totalDays} days</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-center">
                        <Badge variant={record.lateComingCount > 0 ? "destructive" : "outline"}>
                          {record.lateComingCount}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-center">
                        <Badge variant={record.autoLogoutCount > 0 ? "destructive" : "outline"}>
                          {record.autoLogoutCount}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-center">
                        {record.hasDeduction ? (
                          <span className="font-semibold text-red-600">{record.deductionDays}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-right">
                        {record.hasDeduction ? (
                          <span className="font-semibold text-red-600">₹{(record?.deductionAmount ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-right">
                        <span className="font-semibold text-gray-900">₹{(record?.netPayable ?? 0).toLocaleString()}</span>
                      </td>
                      <td className="p-3 text-sm text-center">
                        {record.adjustmentRequest ? (
                          record.adjustmentRequest.status === "approved" ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          ) : record.adjustmentRequest.status === "pending" ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                              Rejected
                            </Badge>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>💡 Tip:</strong> Click on any month row to view detailed breakdown in the Current View tab.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Adjustment Request Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Request Leave Adjustment</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelAdjustment}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-semibold mb-2">Current Deduction Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-blue-600">Days Deducted:</p>
                    <p className="font-bold text-blue-900">{mockPayslip.deductionDays} days</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Amount:</p>
                    <p className="font-bold text-blue-900">₹{mockPayslip.deductionAmount}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plDays">PL Days to Use</Label>
                <Input
                  id="plDays"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max={Math.min(getLeaveByType("PL"), policyConfig.maxPerRequest)}
                  value={adjustmentDays}
                  onChange={(e) => setAdjustmentDays(e.target.value)}
                  placeholder={`Max ${policyConfig.maxPerRequest} days per request`}
                />
                <p className="text-xs text-gray-600">
                  Available PL Balance: {getLeaveByType("PL")} days
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Adjustment</Label>
                <Textarea
                  id="reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Explain why you need this adjustment..."
                  rows={3}
                />
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> This request requires HR approval. Once approved, the specified PL days will be deducted from your balance and the salary deduction will be reversed.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleRequestAdjustment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Submit Request
                </Button>
                <Button
                  onClick={handleCancelAdjustment}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}