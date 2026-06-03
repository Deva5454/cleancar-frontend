/**
 * Employee Self-Service Payslip Component
 * Allows employees to view their payslip and request leave adjustments
 * This is the EMPLOYEE-FACING view (not HR view)
 */

import React, { useState } from "react";
import {
  FileText,
  Info,
  AlertCircle,
  CheckCircle,
  X,
  Clock,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { toast } from "sonner";

interface AttendanceSummary {
  totalDays: number;
  payDays: number;
  weeklyOff: number;
  publicHoliday: number;
  presentDays: number;
  absentDays: number;
  leaveWithSalary: number;
  leaveWithoutPay: number;
}

interface AdjustmentSummary {
  lateComingCount: number;
  autoLogoutCount: number;
  attendanceDeduction: number;
  daysDeducted: number;
}

interface EmployeeData {
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  joiningDate: string;
  summary: AttendanceSummary;
  adjustment: AdjustmentSummary;
}

interface EmployeeSelfServicePayslipProps {
  month: number;
  year: number;
}

export function EmployeeSelfServicePayslip({ month, year }: EmployeeSelfServicePayslipProps) {
  // Mock employee data - in real app, fetch from API based on logged-in user
  const data: EmployeeData = {
    employeeCode: "EMP12345",
    employeeName: "Rajesh Kumar",
    department: "Car Washing Operations",
    designation: "Senior Car Washer",
    joiningDate: "2023-01-15",
    summary: {
      totalDays: 31,
      payDays: 28.5,
      weeklyOff: 4,
      publicHoliday: 2,
      presentDays: 25,
      absentDays: 0,
      leaveWithSalary: 1,
      leaveWithoutPay: 0,
    },
    adjustment: {
      lateComingCount: 3,
      autoLogoutCount: 2,
      attendanceDeduction: 322,
      daysDeducted: 1.5,
    },
  };

  // Leave Adjustment States
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentRequest, setAdjustmentRequest] = useState<{
    status: "none" | "pending" | "approved" | "rejected";
    requestedAt?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    plDaysRequested: number;
    deductionAmount: number;
    policyValidation?: {
      isEligible: boolean;
      withinMonthlyLimit: boolean;
      withinRequestLimit: boolean;
      hasSufficientPL: boolean;
      behaviorCheck: boolean;
      issues: string[];
    };
  }>({
    status: "none",
    plDaysRequested: 0,
    deductionAmount: 0,
  });
  const [adjustmentDays, setAdjustmentDays] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Mock Employee Leave Data (from API)
  const employeePLBalance = 12;
  const employeeMonthlyAdjustmentUsed = 0;
  const employeeTenureMonths = 15;
  const isProbationCompleted = true;
  const isFullTime = true;

  // Policy Configuration
  const policyConfig = {
    enablePLAdjustment: true,
    maxMonthlyLimit: 2,
    maxPerRequest: 1,
    minDeductionEligible: 0.5,
    minTenureMonths: 3,
    lateThreshold: 10,
    autoLogoutThreshold: 3,
  };

  // Salary calculations
  const baseSalary = 20000;
  const monthlyDays = data.summary.totalDays;
  const perDayRate = baseSalary / monthlyDays;
  const attendanceDeductionAmount = Math.round(data.adjustment.daysDeducted * perDayRate);

  // Payslip calculations
  const basicSalary = Math.round(baseSalary * 0.4);
  const basicActual = Math.round((basicSalary / monthlyDays) * data.summary.payDays);
  const statutoryBonus = 1000;
  const epf = Math.round(basicActual * 0.12);
  const esic = Math.round((basicActual + statutoryBonus) * 0.0075);
  const pt = basicSalary >= 15000 ? 200 : 0;

  const totalEarnings = basicActual + statutoryBonus;
  const totalDeductions = epf + esic + pt + attendanceDeductionAmount;
  const netPayable = totalEarnings - totalDeductions;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Policy Validation
  const validateAdjustmentPolicy = (plDays: number) => {
    const issues: string[] = [];
    let isEligible = true;
    let withinMonthlyLimit = true;
    let withinRequestLimit = true;
    let hasSufficientPL = true;
    let behaviorCheck = true;

    if (!isFullTime) {
      isEligible = false;
      issues.push("Employee must be full-time");
    }
    if (!isProbationCompleted) {
      isEligible = false;
      issues.push("Employee must complete probation");
    }
    if (employeeTenureMonths < policyConfig.minTenureMonths) {
      isEligible = false;
      issues.push(`Minimum tenure requirement: ${policyConfig.minTenureMonths} months`);
    }

    if (plDays > employeePLBalance) {
      hasSufficientPL = false;
      issues.push(`Insufficient PL balance (Available: ${employeePLBalance} days)`);
    }

    if (employeeMonthlyAdjustmentUsed + plDays > policyConfig.maxMonthlyLimit) {
      withinMonthlyLimit = false;
      issues.push(`Exceeds monthly limit (Max: ${policyConfig.maxMonthlyLimit} days, Used: ${employeeMonthlyAdjustmentUsed} days)`);
    }

    if (plDays > policyConfig.maxPerRequest) {
      withinRequestLimit = false;
      issues.push(`Exceeds per request limit (Max: ${policyConfig.maxPerRequest} day per request)`);
    }

    if (data.adjustment.daysDeducted < policyConfig.minDeductionEligible) {
      isEligible = false;
      issues.push(`Deduction too small (Min: ${policyConfig.minDeductionEligible} days)`);
    }

    if (data.adjustment.lateComingCount > policyConfig.lateThreshold) {
      behaviorCheck = false;
      issues.push(`Late coming count exceeds threshold (${data.adjustment.lateComingCount} > ${policyConfig.lateThreshold})`);
    }

    if (data.adjustment.autoLogoutCount > policyConfig.autoLogoutThreshold) {
      behaviorCheck = false;
      issues.push(`Auto logout abuse detected (${data.adjustment.autoLogoutCount} > ${policyConfig.autoLogoutThreshold}) - Only 50% adjustment allowed`);
    }

    return {
      isEligible,
      withinMonthlyLimit,
      withinRequestLimit,
      hasSufficientPL,
      behaviorCheck,
      issues,
    };
  };

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

    const validation = validateAdjustmentPolicy(plDays);

    setAdjustmentRequest({
      status: "pending",
      requestedAt: new Date().toLocaleString(),
      plDaysRequested: plDays,
      deductionAmount: attendanceDeductionAmount,
      policyValidation: validation,
    });

    setShowAdjustmentModal(false);
    setAdjustmentDays("");
    setAdjustmentReason("");

    if (validation.issues.length > 0) {
      toast.warning("Adjustment request submitted with policy issues - Requires HR review");
    } else {
      toast.success("Leave adjustment request submitted for HR approval");
    }
  };

  const handleCancelAdjustment = () => {
    setShowAdjustmentModal(false);
    setAdjustmentDays("");
    setAdjustmentReason("");
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileText className="w-7 h-7" />
                  My Payslip - {monthNames[month - 1]} {year}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  {data.employeeName} ({data.employeeCode}) | {data.designation}
                </p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Salary Summary Card */}
        <Card className="border-2 border-green-400 bg-green-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-green-700">₹{totalEarnings.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
                <p className="text-3xl font-bold text-red-700">₹{totalDeductions.toLocaleString()}</p>
              </div>
              <div className="text-center bg-blue-600 text-white rounded-lg p-4">
                <p className="text-sm mb-1">Net Payable</p>
                <p className="text-4xl font-bold">₹{netPayable.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Days</p>
                <p className="text-xl font-bold">{data.summary.totalDays}</p>
              </div>
              <div>
                <p className="text-gray-600">Pay Days</p>
                <p className="text-xl font-bold text-green-700">{data.summary.payDays}</p>
              </div>
              <div>
                <p className="text-gray-600">Present Days</p>
                <p className="text-xl font-bold text-blue-700">{data.summary.presentDays}</p>
              </div>
              <div>
                <p className="text-gray-600">Weekly Off</p>
                <p className="text-xl font-bold">{data.summary.weeklyOff}</p>
              </div>
              <div>
                <p className="text-gray-600">Public Holiday</p>
                <p className="text-xl font-bold">{data.summary.publicHoliday}</p>
              </div>
              <div>
                <p className="text-gray-600">Leave (With Salary)</p>
                <p className="text-xl font-bold text-cyan-700">{data.summary.leaveWithSalary}</p>
              </div>
              <div>
                <p className="text-gray-600">Absent Days</p>
                <p className="text-xl font-bold text-red-700">{data.summary.absentDays}</p>
              </div>
              <div>
                <p className="text-gray-600">LWP Days</p>
                <p className="text-xl font-bold text-orange-700">{data.summary.leaveWithoutPay}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Deduction Breakdown */}
        {attendanceDeductionAmount > 0 && (
          <Card className="border-2 border-orange-300 bg-orange-50">
            <CardHeader className="bg-orange-100 border-b">
              <CardTitle className="text-base text-orange-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Attendance Deduction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-600">Late Coming Count</p>
                  <p className="text-lg font-bold text-yellow-700">{data.adjustment.lateComingCount}</p>
                </div>
                <div>
                  <p className="text-gray-600">Auto Logout Count</p>
                  <p className="text-lg font-bold text-red-700">{data.adjustment.autoLogoutCount}</p>
                </div>
                <div>
                  <p className="text-gray-600">Absent Days</p>
                  <p className="text-lg font-bold text-red-700">{data.summary.absentDays}</p>
                </div>
                <div>
                  <p className="text-gray-600">LWP Days</p>
                  <p className="text-lg font-bold text-orange-700">{data.summary.leaveWithoutPay}</p>
                </div>
              </div>
              <div className="pt-4 border-t-2 border-orange-300">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-orange-900">Total Days Deducted:</p>
                  <p className="text-2xl font-bold text-red-800">{data.adjustment.daysDeducted.toFixed(1)} days</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="font-semibold text-orange-900">Salary Deduction:</p>
                  <p className="text-2xl font-bold text-red-800">₹{attendanceDeductionAmount.toLocaleString()}</p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Calculation: {data.adjustment.daysDeducted.toFixed(1)} days × ₹{perDayRate.toFixed(2)}/day = ₹{attendanceDeductionAmount}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leave Adjustment Request Section - EMPLOYEE VIEW */}
        {policyConfig.enablePLAdjustment && attendanceDeductionAmount > 0 && adjustmentRequest.status === "none" && (
          <Card className="border-2 border-cyan-400 bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardHeader className="bg-gradient-to-r from-cyan-100 to-blue-100 border-b border-cyan-300">
              <CardTitle className="text-base text-cyan-900 flex items-center gap-2">
                💡 Save Your Salary: Use Leave to Offset Deduction
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-cyan-300 shadow-sm">
                <p className="text-base text-gray-800 mb-2">
                  You have a <strong className="text-red-700">₹{attendanceDeductionAmount.toLocaleString()}</strong> salary deduction ({data.adjustment.daysDeducted.toFixed(1)} days).
                </p>
                <p className="text-sm text-gray-700 mb-3">
                  💼 You can use your <strong>Paid Leave (PL)</strong> to avoid this salary loss!
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm bg-cyan-50 p-3 rounded border border-cyan-200">
                  <div>
                    <p className="text-gray-600">Your Available PL:</p>
                    <p className="text-xl font-bold text-cyan-700">{employeePLBalance} days</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Monthly Limit:</p>
                    <p className="text-xl font-bold text-gray-700">{policyConfig.maxMonthlyLimit} days</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-xs font-semibold text-blue-900 mb-2">✅ Eligibility Check:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    {employeePLBalance > 0 ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-red-600" />
                    )}
                    <span>PL Available: {employeePLBalance > 0 ? 'Yes ✓' : 'No ✗'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {employeeMonthlyAdjustmentUsed < policyConfig.maxMonthlyLimit ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-red-600" />
                    )}
                    <span>Within Monthly Limit ✓</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isFullTime && isProbationCompleted ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-red-600" />
                    )}
                    <span>Eligible Employee ✓</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {data.adjustment.lateComingCount <= policyConfig.lateThreshold ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-red-600" />
                    )}
                    <span>Good Attendance ✓</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowAdjustmentModal(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white w-full py-6 text-base font-semibold"
              >
                🎯 Request Leave Adjustment (Save ₹{attendanceDeductionAmount.toLocaleString()})
              </Button>

              <p className="text-xs text-gray-500 text-center">
                ⚠️ Your request will be sent to HR for approval. PL will only be deducted after HR approval.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Request Status - PENDING */}
        {adjustmentRequest.status === "pending" && (
          <Card className="border-2 border-amber-400 bg-amber-50">
            <CardHeader className="bg-amber-100 border-b border-amber-300">
              <CardTitle className="text-base text-amber-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                ⏳ Your Adjustment Request is Pending HR Approval
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="bg-white p-4 rounded-lg border border-amber-300">
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">PL Days Requested:</p>
                    <p className="text-lg font-bold text-amber-800">{adjustmentRequest.plDaysRequested} days</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Salary to Save:</p>
                    <p className="text-lg font-bold text-green-700">₹{adjustmentRequest.deductionAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-amber-200">
                  <p className="text-xs text-gray-600">Submitted At:</p>
                  <p className="text-sm font-semibold text-gray-800">{adjustmentRequest.requestedAt}</p>
                </div>
              </div>

              {adjustmentRequest.policyValidation && adjustmentRequest.policyValidation.issues.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
                  <p className="text-xs font-semibold text-yellow-900 mb-1">⚠️ Policy Notes:</p>
                  <ul className="text-xs text-yellow-800 space-y-0.5 ml-4 list-disc">
                    {adjustmentRequest.policyValidation.issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-yellow-900 mt-2">
                    Don't worry! HR can still approve your request if there's a valid reason.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded border border-blue-200 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-900 font-semibold">
                    Waiting for HR to review your request...
                  </p>
                  <p className="text-xs text-blue-700">
                    You will be notified once HR approves or rejects your request.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Status - APPROVED */}
        {adjustmentRequest.status === "approved" && (
          <Card className="border-2 border-green-400 bg-green-50">
            <CardHeader className="bg-green-100 border-b border-green-300">
              <CardTitle className="text-base text-green-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                🎉 Great News! Your Request was Approved
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="bg-white p-4 rounded-lg border border-green-300">
                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">PL Deducted:</p>
                    <p className="text-lg font-bold text-orange-700">{adjustmentRequest.plDaysRequested} days</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Salary Saved:</p>
                    <p className="text-lg font-bold text-green-700">₹{adjustmentRequest.deductionAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">New PL Balance:</p>
                    <p className="text-lg font-bold text-cyan-700">{(employeePLBalance - adjustmentRequest.plDaysRequested).toFixed(1)} days</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-green-200">
                  <p className="text-xs text-gray-600">Approved By:</p>
                  <p className="text-sm font-semibold text-gray-800">{adjustmentRequest.approvedBy || "HR Department"}</p>
                  <p className="text-xs text-gray-600 mt-1">Approved At:</p>
                  <p className="text-sm font-semibold text-gray-800">{adjustmentRequest.approvedAt || new Date().toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-green-100 p-4 rounded-lg border border-green-300 text-center">
                <p className="text-base text-green-900 font-semibold">
                  🎉 Your salary deduction has been waived!
                </p>
                <p className="text-sm text-green-800 mt-2">
                  {adjustmentRequest.plDaysRequested} days of PL have been deducted from your balance, and your net salary has been updated. Check the updated net payable above!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Status - REJECTED */}
        {adjustmentRequest.status === "rejected" && (
          <Card className="border-2 border-red-400 bg-red-50">
            <CardHeader className="bg-red-100 border-b border-red-300">
              <CardTitle className="text-base text-red-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                ❌ Your Adjustment Request was Rejected
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="bg-white p-4 rounded-lg border border-red-300">
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Requested Adjustment:</p>
                    <p className="text-lg font-bold text-gray-800">{adjustmentRequest.plDaysRequested} days</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Deduction Amount:</p>
                    <p className="text-lg font-bold text-red-700">₹{adjustmentRequest.deductionAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {adjustmentRequest.rejectionReason && (
                <div className="bg-red-100 p-3 rounded border border-red-300">
                  <p className="text-xs font-semibold text-red-900 mb-1">Reason for Rejection:</p>
                  <p className="text-sm text-red-800">{adjustmentRequest.rejectionReason}</p>
                </div>
              )}

              <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
                <p className="text-sm text-yellow-900">
                  ⚠️ Your PL balance remains unchanged at <strong>{employeePLBalance} days</strong>. The salary deduction of <strong>₹{adjustmentRequest.deductionAmount.toLocaleString()}</strong> will be applied as per attendance records.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Payslip Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Salary Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings */}
              <div>
                <h3 className="font-semibold text-green-800 mb-3 text-sm">EARNINGS</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary</span>
                    <span className="font-semibold">₹{basicActual.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Statutory Bonus</span>
                    <span className="font-semibold">₹{statutoryBonus.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold text-green-700">
                    <span>Total Earnings</span>
                    <span>₹{totalEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="font-semibold text-red-800 mb-3 text-sm">DEDUCTIONS</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>EPF (Employee)</span>
                    <span className="font-semibold">₹{epf.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ESIC</span>
                    <span className="font-semibold">₹{esic.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Professional Tax</span>
                    <span className="font-semibold">₹{pt}</span>
                  </div>
                  <div className="flex justify-between bg-red-50 p-2 rounded">
                    <span className="font-semibold">Attendance Deduction</span>
                    <span className="font-bold text-red-700">₹{attendanceDeductionAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold text-red-700">
                    <span>Total Deductions</span>
                    <span>₹{totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Need Help?</p>
                <p>
                  If you have questions about your payslip or the leave adjustment process, please contact your HR department or supervisor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Adjustment Request Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-cyan-100 border-b sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-cyan-900 flex items-center gap-2">
                    🎯 Request Leave Adjustment
                  </CardTitle>
                  <p className="text-sm text-cyan-700 mt-1">Use your PL to offset salary deduction</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCancelAdjustment}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Info Banner */}
              <Card className="border-cyan-200 bg-cyan-50">
                <CardContent className="p-3">
                  <p className="text-sm text-cyan-900">
                    <Info className="w-4 h-4 inline mr-1" />
                    Your request will be sent to HR for approval. Your PL will only be deducted <strong>after HR approves</strong> your request.
                  </p>
                </CardContent>
              </Card>

              {/* Current Deduction Summary */}
              <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                <p className="text-sm font-semibold text-orange-900 mb-3">Your Current Deduction:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Days Deducted:</p>
                    <p className="text-2xl font-bold text-red-700">{data.adjustment.daysDeducted.toFixed(1)} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Deduction Amount:</p>
                    <p className="text-2xl font-bold text-red-700">₹{attendanceDeductionAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-orange-300">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Breakdown:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Late Coming:</span>
                      <span className="font-semibold">{data.adjustment.lateComingCount} times</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Auto Logout:</span>
                      <span className="font-semibold">{data.adjustment.autoLogoutCount} times</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PL Balance Display */}
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-300">
                <p className="text-sm font-semibold text-cyan-900 mb-3">Your Leave Balance:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Available PL:</p>
                    <p className="text-xl font-bold text-cyan-700">{employeePLBalance} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Monthly Limit:</p>
                    <p className="text-xl font-bold text-gray-700">{policyConfig.maxMonthlyLimit} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Used This Month:</p>
                    <p className="text-xl font-bold text-gray-700">{employeeMonthlyAdjustmentUsed} days</p>
                  </div>
                </div>
              </div>

              {/* Input Field */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  How many PL days do you want to use? *
                </label>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Input
                    type="number"
                    step="0.5"
                    value={adjustmentDays}
                    onChange={(e) => setAdjustmentDays(e.target.value)}
                    placeholder="e.g., 1.0"
                    className="w-32 text-lg"
                    min="0"
                    max={Math.min(data.adjustment.daysDeducted, employeePLBalance, policyConfig.maxPerRequest)}
                  />
                  <span className="text-sm text-gray-600">days</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Max per request: <strong>{policyConfig.maxPerRequest} day</strong> | Your deduction: <strong>{data.adjustment.daysDeducted.toFixed(1)} days</strong>
                </p>
              </div>

              {/* Real-time Validation */}
              {adjustmentDays && parseFloat(adjustmentDays) > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                  <p className="text-xs font-semibold text-blue-900 mb-2">✅ Policy Check:</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      {parseFloat(adjustmentDays) <= employeePLBalance ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>
                        PL Balance Check: {parseFloat(adjustmentDays) <= employeePLBalance ? '✓ Sufficient' : '✗ Insufficient'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {parseFloat(adjustmentDays) <= policyConfig.maxPerRequest ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>
                        Request Limit: {parseFloat(adjustmentDays) <= policyConfig.maxPerRequest ? '✓ Within limit' : `✗ Max ${policyConfig.maxPerRequest} day`}
                      </span>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-3 pt-3 border-t border-blue-300 bg-white p-3 rounded">
                    <p className="text-xs font-semibold text-gray-700 mb-2">💰 If Approved:</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-600">New PL Balance:</span>
                        <p className="font-bold text-cyan-700 text-base">
                          {(employeePLBalance - parseFloat(adjustmentDays)).toFixed(1)} days
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Salary Saved:</span>
                        <p className="font-bold text-green-700 text-base">
                          ₹{Math.round(parseFloat(adjustmentDays) * perDayRate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason Field */}
              <div className="border-t pt-4">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Why are you requesting this adjustment? *
                </label>
                <Textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Had medical emergency, Family circumstances, Unavoidable situation..."
                  rows={4}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  * Required: Provide a clear reason for HR to review
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={handleCancelAdjustment}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestAdjustment}
                  disabled={!adjustmentDays || !adjustmentReason.trim() || parseFloat(adjustmentDays) <= 0}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  🎯 Submit to HR
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
