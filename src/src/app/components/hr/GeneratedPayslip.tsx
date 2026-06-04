/**
 * Generated Payslip Component
 * Auto-generates payslip from attendance data
 * Includes HR approval workflow
 */

import React, { useState } from "react";
import {
  FileText,
  Info,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Shield,
  X,
  Clock,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { DataService } from "../../services/DataService";

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

interface EmployeeAttendanceData {
  employeeCode: string;
  employeeName: string;
  department: string;
  summary: AttendanceSummary;
  adjustment: AdjustmentSummary;
}

interface GeneratedPayslipProps {
  data: EmployeeAttendanceData;
  month: number;
  year: number;
  // Optional: passed from parent to avoid circular import of RoleContext in lazy chunk
  currentRole?: string;
  currentUser?: { name?: string; fullName?: string; };
}

export function GeneratedPayslip({ data, month, year, currentRole: currentRoleProp, currentUser: currentUserProp }: GeneratedPayslipProps) {
  const [payslipStatus, setPayslipStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [hrComment, setHRComment] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // State for attendance drill-down
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideRequest, setOverrideRequest] = useState<{
    status: "none" | "pending" | "approved" | "rejected";
    requestedBy?: string;
    requestedAt?: string;
    approvedBy?: string;
    approvedAt?: string;
    reason?: string;
    overrides: {
      lateComingRule?: string; // e.g., "5 lates = 0.5 day" instead of "3 lates = 0.5 day"
      autoLogoutRule?: string;
      customAdjustment?: number; // Manual adjustment in days
      overrideAttendanceDeduction?: number; // Override the calculated deduction
    };
  }>({
    status: "none",
    overrides: {},
  });
  const [overrideReason, setOverrideReason] = useState("");
  const [customLateRule, setCustomLateRule] = useState("3"); // How many lates = 0.5 day
  const [customAutoLogoutRule, setCustomAutoLogoutRule] = useState("0.5"); // Deduction per auto logout
  const [customAdjustmentDays, setCustomAdjustmentDays] = useState("0");
  const [manualAttendanceDeduction, setManualAttendanceDeduction] = useState("");

  // Role and user from props (passed by parent to avoid circular import in lazy chunk)
  // Falls back to localStorage session if not provided
  const currentRole: string = currentRoleProp || (() => {
    try {
      const s = localStorage.getItem("cc360_session");
      return s ? (JSON.parse(s).role || "HR") : "HR";
    } catch { return "HR"; }
  })();
  const currentUserName: string = currentUserProp?.name || currentUserProp?.fullName || (() => {
    try {
      const s = localStorage.getItem("cc360_session");
      return s ? (JSON.parse(s).employeeName || currentRole) : currentRole;
    } catch { return currentRole; }
  })();

  // Load persisted approval status on mount
  React.useEffect(() => {
    const key = `payslip_status_${data.employeeCode}_${year}_${month}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.status) setPayslipStatus(parsed.status as any);
        if (parsed.comment) setHRComment(parsed.comment);
      }
    } catch { /* ignore */ }
  }, [data.employeeCode, month, year]);

  // Leave Adjustment Against Salary Deduction States
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentRequest, setAdjustmentRequest] = useState<{
    status: "none" | "pending" | "approved" | "rejected";
    requestedBy?: string;
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
    hrOverride?: boolean;
    hrOverrideReason?: string;
  }>({
    status: "none",
    plDaysRequested: 0,
    deductionAmount: 0,
  });
  const [adjustmentDays, setAdjustmentDays] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Live employee leave and tenure data
  const employeePLBalance: number = (() => {
    try {
      const saved = localStorage.getItem(`leave_balance_${data.employeeCode}`);
      if (saved) { const b = JSON.parse(saved); return b.PL ?? b.pl ?? b.paidLeave ?? 12; }
      return 12;
    } catch { return 12; }
  })();
  const employeeMonthlyAdjustmentUsed: number = (() => {
    try {
      const saved = localStorage.getItem(`leave_adjustments_${data.employeeCode}_${year}_${month}`);
      return saved ? (JSON.parse(saved).used ?? 0) : 0;
    } catch { return 0; }
  })();
  const employeeTenureMonths: number = (() => {
    if (!empRecord?.joiningDate) return 12;
    const j = new Date(empRecord.joiningDate);
    return Math.floor((Date.now() - j.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  })();
  const isProbationCompleted = employeeTenureMonths >= 3;
  const isFullTime = empRecord?.employmentType !== "part-time";

  // Policy Configuration — read from shared admin config (falls back to defaults)
  const policyConfig = (() => {
    try {
      const saved = localStorage.getItem("cc360_leaveAdjustmentPolicy");
      if (saved) {
        const p = JSON.parse(saved);
        return {
          enablePLAdjustment: p.enablePLAdjustment ?? true,
          maxMonthlyLimit: p.maxMonthlyLimit ?? 2,
          maxPerRequest: p.maxPerRequest ?? 1,
          minDeductionEligible: p.minDeductionEligible ?? 0.5,
          minTenureMonths: p.minTenureMonths ?? 3,
          lateThreshold: p.lateThreshold ?? 10,
          autoLogoutThreshold: p.autoLogoutThreshold ?? 3,
          allowedDeductionTypes: p.allowedDeductionTypes ?? ["attendance", "late_coming", "miss_punch"],
          blockedDeductionTypes: p.blockedDeductionTypes ?? ["epf", "esic", "pt", "tds", "loan", "advance"],
        };
      }
    } catch { /* use defaults */ }
    return {
      enablePLAdjustment: true, maxMonthlyLimit: 2, maxPerRequest: 1,
      minDeductionEligible: 0.5, minTenureMonths: 3, lateThreshold: 10,
      autoLogoutThreshold: 3,
      allowedDeductionTypes: ["attendance", "late_coming", "miss_punch"],
      blockedDeductionTypes: ["epf", "esic", "pt", "tds", "loan", "advance"],
    };
  })();

  // ✅ FIXED: Salary lookup from DataService("EMPLOYEES") — canonical key for all employee data
  // Falls back to EMPLOYEE_DATABASE_RECORDS (employeeDatabaseService writes here on Supabase load)
  // Legacy keys cc360_hrdata_employees / cleancar_employees are dead on fresh installs
  const empRecord = (() => {
    try {
      const matchId = (e: any) =>
        e.employeeId === data.employeeCode ||
        e.employeeId === data.employeeId ||
        e.empCode    === data.employeeCode ||
        e.id         === data.employeeCode;

      // Source 1: EmployeeContext / HRDataContext canonical key
      const fromMain: any[] = DataService.get("EMPLOYEES");
      const foundMain = fromMain.find(matchId);
      if (foundMain) return foundMain;

      // Source 2: employeeDatabaseService (Supabase-loaded slim records)
      const fromDb: any[] = DataService.get("EMPLOYEE_DATABASE_RECORDS");
      const foundDb = fromDb.find(matchId);
      if (foundDb) return foundDb;

      // Source 3: Legacy keys — for users who haven't refreshed since migration
      const legacy1 = localStorage.getItem("cc360_hrdata_employees");
      const legacy2 = localStorage.getItem("cleancar_employees");
      const raw = legacy1 || legacy2;
      if (raw) {
        const all: any[] = JSON.parse(raw);
        return all.find(matchId) || null;
      }
      return null;
    } catch { return null; }
  })();

  const WORKING_DAYS = 26; // Standard working days per month

  if (!empRecord || (!empRecord.baseSalary && !empRecord.grossSalary)) {
    return (
      <div className="border-2 border-red-400 rounded-lg p-6 bg-red-50 text-center m-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-900 mb-2">Cannot Generate Payslip</h3>
        <p className="text-sm text-red-700 mb-1">
          Salary data not found for employee <strong>{data.employeeCode} — {data.employeeName}</strong>.
        </p>
        <p className="text-xs text-red-600 mt-2">
          Please ensure this employee has a valid salary structure assigned in the Employee Database before generating a payslip.
        </p>
      </div>
    );
  }

  const baseSalary: number = empRecord.baseSalary || empRecord.grossSalary || empRecord.ctc || 0;
  const calendarDays = data.summary.totalDays; // Calendar days (30/31) for basic proration
  
  // ✅ FIXED: Attendance deduction uses WORKING days (26) as per 24/9 pay policy
  const perDayRateForDeduction = baseSalary / WORKING_DAYS;
  const attendanceDeductionAmount = Math.round(data.adjustment.daysDeducted * perDayRateForDeduction);
  
  // Fixed Earnings Calculation — basic prorated on calendar days (matches screen)
  const basicSalary = Math.round(baseSalary * 0.4); // 40% of gross as basic
  const basicActual = Math.round((basicSalary / calendarDays) * data.summary.payDays);
  const statutoryBonus = baseSalary <= 21000 ? 1000 : 0; // Only for gross ≤ ₹21,000
  
  // Variable Earnings
  const salesIncentive = 0;
  const performanceIncentive = 0;
  const overtime = 0;
  
  // Deductions
  // EPF statutory basis: full-month basic capped at ₹15,000 (EPFO rule — proration does not affect contribution basis)
  const epfBasis = Math.min(basicSalary, 15000);
  const epf = Math.round(epfBasis * 0.12);
  // ESIC gross = total gross wages per ESIC Act (all earnings)
  const grossForESIC = basicActual + statutoryBonus + salesIncentive + performanceIncentive + overtime;
  const esic = grossForESIC <= 21000 ? Math.round(grossForESIC * 0.0075) : 0;
  // ✅ FIXED: Gujarat PT slabs (was: baseSalary>=15000 → 200, missing ₹80 and ₹150 slabs)
  const totalGross = basicActual + statutoryBonus + salesIncentive + performanceIncentive;
  const pt = totalGross < 6000 ? 0 : totalGross < 9000 ? 80 : totalGross < 12000 ? 150 : 200;
  // LWF ₹6 Gujarat mandatory
  const lwf = 6;
  // TDS: New Tax Regime FY 2024-25 with Section 87A rebate
  const annualGross = baseSalary * 12;
  const standardDeduction = 75000;
  const taxableIncome = Math.max(0, annualGross - standardDeduction);
  const annualTax = (() => {
    if (taxableIncome <= 300000) return 0;
    if (taxableIncome <= 700000) return Math.round((taxableIncome - 300000) * 0.05);
    if (taxableIncome <= 1000000) return 20000 + Math.round((taxableIncome - 700000) * 0.10);
    if (taxableIncome <= 1200000) return 50000 + Math.round((taxableIncome - 1000000) * 0.15);
    if (taxableIncome <= 1500000) return 80000 + Math.round((taxableIncome - 1200000) * 0.20);
    return 140000 + Math.round((taxableIncome - 1500000) * 0.30);
  })();
  // Section 87A: zero tax if taxable income ≤ ₹7L under new regime
  const tds = taxableIncome <= 700000 ? 0 : Math.round(annualTax / 12);
  // Advance EMI from active loan
  const advanceEMI: number = (() => {
    try {
      const saved = localStorage.getItem(`advance_emi_${data.employeeCode}`);
      if (saved) { const e = JSON.parse(saved); return (e.isActive && e.outstandingBalance > 0) ? (e.monthlyEMI || 0) : 0; }
      return 0;
    } catch { return 0; }
  })();
  const advance = advanceEMI;
  const otherDeduction = 0;
  
  // Company Contribution
  const pfGross = epfBasis;
  const eps = Math.min(Math.round(epfBasis * 0.0833), 1250);
  const epfEmployer = Math.round(epfBasis * 0.0367);
  const esicGross = grossForESIC;
  const esicEmployer = esicGross <= 21000 ? Math.round(esicGross * 0.0325) : 0;
  const lwfEmployer = 12; // Employer LWF contribution Gujarat
  
  // Totals
  const totalEarnings = basicActual + statutoryBonus + salesIncentive + performanceIncentive + overtime;
  const totalDeductions = epf + esic + pt + lwf + tds + advance + attendanceDeductionAmount + otherDeduction;
  const netPayable = totalEarnings - totalDeductions;

  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];

  const handleApprove = () => {
    const key = `payslip_status_${data.employeeCode}_${year}_${month}`;
    const record = { status: "pending_superadmin", approvedByHR: currentUserName, approvedAtHR: new Date().toISOString(), netPayable: finalNetPayable };
    try { localStorage.setItem(key, JSON.stringify(record)); } catch { /* ignore */ }
    setPayslipStatus("pending_superadmin" as any);
    toast.success(`Payslip approved by ${currentUserName}. Forwarded to Super Admin for final approval.`);
    logAuditEvent("HR_APPROVED", { netPayable: finalNetPayable, overrideApplied: overrideRequest.status === "approved" });
  };

  const handleReject = () => {
    if (!hrComment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    const key = `payslip_status_${data.employeeCode}_${year}_${month}`;
    const record = { status: "rejected", rejectedBy: currentUserName, rejectedAt: new Date().toISOString(), comment: hrComment };
    try { localStorage.setItem(key, JSON.stringify(record)); } catch { /* ignore */ }
    setPayslipStatus("rejected");
    setShowRejectModal(false);
    toast.error("Payslip rejected and sent back for corrections");
    logAuditEvent("HR_REJECTED", { reason: hrComment });
  };

  const handleSubmitOverride = () => {
    if (!overrideReason.trim()) {
      toast.error("Please provide a reason for override request");
      return;
    }

    // Create override request
    setOverrideRequest({
      status: "pending",
      requestedBy: "HR Manager",
      requestedAt: new Date().toLocaleString(),
      reason: overrideReason,
      overrides: {
        lateComingRule: `${customLateRule} lates = 0.5 day`,
        autoLogoutRule: `${customAutoLogoutRule} day per auto logout`,
        customAdjustment: parseFloat(customAdjustmentDays) || 0,
        overrideAttendanceDeduction: manualAttendanceDeduction ? parseFloat(manualAttendanceDeduction) : undefined,
      },
    });

    setShowOverrideModal(false);
    toast.success("Override request submitted to Admin/Super Admin for approval");
    logAuditEvent("OVERRIDE_REQUESTED", { rules: overrideRequest.overrides, reason: overrideReason });
  };

  const handleCancelOverride = () => {
    setShowOverrideModal(false);
    setOverrideReason("");
    setCustomLateRule("3");
    setCustomAutoLogoutRule("0.5");
    setCustomAdjustmentDays("0");
    setManualAttendanceDeduction("");
  };

  // Calculate final deduction based on override status
  const calculateFinalDeduction = () => {
    if (overrideRequest.status === "approved" && overrideRequest.overrides.overrideAttendanceDeduction !== undefined) {
      return Math.round(overrideRequest.overrides.overrideAttendanceDeduction * perDayRateForDeduction);
    }
    return attendanceDeductionAmount;
  };

  const finalAttendanceDeduction = calculateFinalDeduction();
  const finalTotalDeductions = epf + esic + pt + lwf + tds + advance + finalAttendanceDeduction + otherDeduction;
  const finalNetPayable = totalEarnings - finalTotalDeductions;

  // Policy Validation Function for Leave Adjustment
  const validateAdjustmentPolicy = (plDays: number) => {
    const issues: string[] = [];
    let isEligible = true;
    let withinMonthlyLimit = true;
    let withinRequestLimit = true;
    let hasSufficientPL = true;
    let behaviorCheck = true;

    // Check eligibility
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

    // Check PL balance
    if (plDays > employeePLBalance) {
      hasSufficientPL = false;
      issues.push(`Insufficient PL balance (Available: ${employeePLBalance} days)`);
    }

    // Check monthly limit
    if (employeeMonthlyAdjustmentUsed + plDays > policyConfig.maxMonthlyLimit) {
      withinMonthlyLimit = false;
      issues.push(`Exceeds monthly limit (Max: ${policyConfig.maxMonthlyLimit} days, Used: ${employeeMonthlyAdjustmentUsed} days)`);
    }

    // Check per request limit
    if (plDays > policyConfig.maxPerRequest) {
      withinRequestLimit = false;
      issues.push(`Exceeds per request limit (Max: ${policyConfig.maxPerRequest} day per request)`);
    }

    // Check minimum deduction
    if (data.adjustment.daysDeducted < policyConfig.minDeductionEligible) {
      isEligible = false;
      issues.push(`Deduction too small (Min: ${policyConfig.minDeductionEligible} days)`);
    }

    // Behavior-based restrictions
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

    // Validate policy
    const validation = validateAdjustmentPolicy(plDays);

    // Create adjustment request
    setAdjustmentRequest({
      status: "pending",
      requestedBy: data.employeeName,
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
    logAuditEvent("ADJUSTMENT_REQUESTED", { plDays, policyIssues: validation.issues.length });
    }
  };

  const handleCancelAdjustment = () => {
    setShowAdjustmentModal(false);
    setAdjustmentDays("");
    setAdjustmentReason("");
  };

  const logAuditEvent = (action: string, details: Record<string, unknown> = {}) => {
    try {
      const key = `payslip_audit_${data.employeeCode}_${year}_${month}`;
      const existing: unknown[] = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push({ action, actor: currentUserName, role: currentRole, timestamp: new Date().toISOString(), ...details });
      localStorage.setItem(key, JSON.stringify(existing));
    } catch { /* audit failure must not crash payslip */ }
  };

  return (
    <>
      {/* Generated Payslip Section */}
      <div className="border-t-4 border-blue-500 pt-6">
        <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Generated Payslip (For HR Review)
                </CardTitle>
                <p className="text-sm text-blue-100 mt-1">
                  Auto-generated from attendance-driven calculations
                </p>
              </div>
              <Badge 
                className={
                  payslipStatus === "approved" 
                    ? "bg-green-500 text-white px-4 py-2 text-sm" 
                    : payslipStatus === "rejected"
                    ? "bg-red-500 text-white px-4 py-2 text-sm"
                    : "bg-orange-500 text-white px-4 py-2 text-sm"
                }
              >
                {payslipStatus === "approved" ? "✓ Approved" : payslipStatus === "rejected" ? "✗ Rejected" : "⏳ Pending Approval"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            {/* Attendance Finalization Warning */}
            {!(() => {
              try { return localStorage.getItem(`attendance_closed_${year}_${month}`) === "true"; }
              catch { return false; }
            })() && (
              <div className="flex items-start gap-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-900">Attendance Not Finalized</p>
                  <p className="text-xs text-yellow-800 mt-1">
                    Attendance for {monthNames[month - 1]} {year} has not been officially closed.
                    Deduction figures may change. HR should finalize attendance before approving this payslip.
                  </p>
                </div>
              </div>
            )}

            {/* Payslip Header */}
            <div className="text-center border-b-2 pb-4">
              <h3 className="text-2xl font-bold text-gray-900">Payslip Summary – {monthNames[month - 1]} {year}</h3>
              <p className="text-sm text-gray-600 mt-1">Employee: {data.employeeName} ({data.employeeCode})</p>
              <p className="text-xs text-gray-500">Department: {data.department}</p>
            </div>

            {/* Info Banner */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">🔁 Attendance → Payslip Flow:</p>
                    <p>Attendance Logged → Calculations Applied (Green Fields) → Payslip Auto-Generated → HR Reviews → Approves/Rejects → Super Admin Final Approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Payslip Table */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Fixed Earnings */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="bg-green-100 border-b border-green-200 p-4">
                  <CardTitle className="text-sm font-bold text-green-900">FIXED EARNINGS</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="text-left p-2 font-semibold">Pay Head</th>
                        <th className="text-right p-2 font-semibold">Fix Amount</th>
                        <th className="text-right p-2 font-semibold">Earning</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr className="border-b">
                        <td className="p-2">Basic</td>
                        <td className="text-right p-2">{basicSalary.toLocaleString()}</td>
                        <td className="text-right p-2 font-semibold text-green-700">{basicActual.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">HRA</td>
                        <td className="text-right p-2">—</td>
                        <td className="text-right p-2">0</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Uniform Allowance</td>
                        <td className="text-right p-2">—</td>
                        <td className="text-right p-2">0</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Washing Allowance</td>
                        <td className="text-right p-2">0</td>
                        <td className="text-right p-2">0</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Conveyance</td>
                        <td className="text-right p-2">0</td>
                        <td className="text-right p-2">0</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Helper Allowance</td>
                        <td className="text-right p-2">0</td>
                        <td className="text-right p-2">0</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Statutory Bonus</td>
                        <td className="text-right p-2">{statutoryBonus}</td>
                        <td className="text-right p-2 font-semibold text-green-700">{statutoryBonus}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">LTA</td>
                        <td className="text-right p-2">0</td>
                        <td className="text-right p-2">0</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Education Allowance</td>
                        <td className="text-right p-2">0</td>
                        <td className="text-right p-2">0</td>
                      </tr>
                      <tr>
                        <td className="p-2">Stipend</td>
                        <td className="text-right p-2">0</td>
                        <td className="text-right p-2">0</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Variable Earnings */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="bg-purple-100 border-b border-purple-200 p-4">
                  <CardTitle className="text-sm font-bold text-purple-900">VARIABLE EARNINGS</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead className="bg-purple-100">
                      <tr>
                        <th className="text-left p-2 font-semibold">Variable Pay Head</th>
                        <th className="text-right p-2 font-semibold">Earning</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr className="border-b">
                        <td className="p-2">Traveling & Misc</td>
                        <td className="text-right p-2">0</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Sales Incentive</td>
                        <td className="text-right p-2">{salesIncentive}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Performance Incentive</td>
                        <td className="text-right p-2">—</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Overtime</td>
                        <td className="text-right p-2">—</td>
                      </tr>
                      <tr>
                        <td className="p-2">Commission</td>
                        <td className="text-right p-2">—</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Deductions */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="bg-red-100 border-b border-red-200 p-4">
                  <CardTitle className="text-sm font-bold text-red-900">DEDUCTIONS</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead className="bg-red-100">
                      <tr>
                        <th className="text-left p-2 font-semibold">Deduction Head</th>
                        <th className="text-right p-2 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr className="border-b">
                        <td className="p-2">EPF</td>
                        <td className="text-right p-2 font-semibold text-red-700">{epf.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">ESIC</td>
                        <td className="text-right p-2 font-semibold text-red-700">{esic.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">PT</td>
                        <td className="text-right p-2">{pt}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">LWF</td>
                        <td className="text-right p-2 font-medium text-red-800">{lwf.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">TDS
                          {tds === 0 && <span className="text-xs text-gray-400 block">Below threshold</span>}
                        </td>
                        <td className="text-right p-2 font-semibold text-red-700">{tds > 0 ? tds.toLocaleString() : "—"}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Other Deduction</td>
                        <td className="text-right p-2">—</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Advance</td>
                        <td className="text-right p-2">{advance}</td>
                      </tr>
                      <tr className="bg-yellow-50 border-2 border-yellow-300">
                        <td className="p-2 font-semibold">
                          <div className="flex items-center gap-1">
                            Attendance Deduction
                            <button 
                              className="text-blue-600 hover:text-blue-800"
                              title={`Derived from:\nLate Coming: ${data.adjustment.lateComingCount}\nAuto Logout: ${data.adjustment.autoLogoutCount}\nAbsent: ${data.summary.absentDays}\nLWP: ${data.summary.leaveWithoutPay}\nTotal Days Deducted: ${(data?.adjustment?.daysDeducted ?? 0).toFixed(1)}`}
                            >
                              <Info className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="text-right p-2 font-bold text-red-800">
                          {finalAttendanceDeduction.toLocaleString()}
                          {overrideRequest.status === "approved" && finalAttendanceDeduction !== attendanceDeductionAmount && (
                            <span className="text-xs text-purple-600 block">(overridden from ₹{attendanceDeductionAmount.toLocaleString()})</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Company Contribution */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="bg-blue-100 border-b border-blue-200 p-4">
                  <CardTitle className="text-sm font-bold text-blue-900">COMPANY'S PART</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="text-left p-2 font-semibold">Contribution</th>
                        <th className="text-right p-2 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr className="border-b">
                        <td className="p-2">PF Gross</td>
                        <td className="text-right p-2">{pfGross.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">EPS</td>
                        <td className="text-right p-2 font-semibold text-blue-700">{eps.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">EPF</td>
                        <td className="text-right p-2 font-semibold text-blue-700">{epfEmployer.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">ESIC Gross</td>
                        <td className="text-right p-2">{esicGross.toLocaleString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">ESIC</td>
                        <td className="text-right p-2 font-semibold text-blue-700">{esicEmployer.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="p-2">LWF</td>
                        <td className="text-right p-2 text-blue-700">{lwfEmployer}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* Totals Summary */}
            <Card className="border-2 border-gray-900 bg-gradient-to-r from-gray-50 to-gray-100">
              <CardContent className="p-3 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-green-700">₹{totalEarnings.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
                    <p className="text-3xl font-bold text-red-700">₹{finalTotalDeductions.toLocaleString()}</p>
                  </div>
                  <div className="text-center bg-blue-600 text-white rounded-lg p-4">
                    <p className="text-sm mb-1">Net Payable</p>
                    <p className="text-4xl font-bold">₹{finalNetPayable.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Link Breakdown */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="bg-orange-100 border-b border-orange-200">
                <CardTitle className="text-sm text-orange-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Attendance Deduction Breakdown (Fully Traceable)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                <div className="mt-4 pt-4 border-t-2 border-orange-300">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-orange-900">Total Days Deducted:</p>
                    <p className="text-2xl font-bold text-red-800">{(data?.adjustment?.daysDeducted ?? 0).toFixed(1)} days</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="font-semibold text-orange-900">Converted to Amount:</p>
                    <p className="text-2xl font-bold text-red-800">₹{attendanceDeductionAmount.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Calculation: {(data?.adjustment?.daysDeducted ?? 0).toFixed(1)} days × ₹{perDayRateForDeduction.toFixed(2)}/day = ₹{attendanceDeductionAmount}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Leave Adjustment Against Salary Deduction - EMPLOYEE SECTION */}
            {policyConfig.enablePLAdjustment && attendanceDeductionAmount > 0 && adjustmentRequest.status === "none" && (
              <Card className="border-2 border-cyan-400 bg-gradient-to-r from-cyan-50 to-blue-50">
                <CardHeader className="bg-gradient-to-r from-cyan-100 to-blue-100 border-b border-cyan-300">
                  <CardTitle className="text-base text-cyan-900 flex items-center gap-2">
                    💡 Smart Suggestion: Use Leave to Offset Deduction
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Info Banner */}
                  <div className="bg-white p-4 rounded-lg border-2 border-cyan-300 shadow-sm">
                    <p className="text-sm text-gray-800 mb-2">
                      <strong className="text-cyan-900">You have ₹{attendanceDeductionAmount.toLocaleString()}</strong> attendance deduction ({(data?.adjustment?.daysDeducted ?? 0).toFixed(1)} days).
                    </p>
                    <p className="text-sm text-gray-700 mb-3">
                      💼 You can use your <strong>Paid Leave (PL)</strong> to avoid this salary loss.
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm bg-cyan-50 p-3 rounded border border-cyan-200">
                      <div>
                        <p className="text-gray-600">Available PL Balance:</p>
                        <p className="text-lg font-bold text-cyan-700">{employeePLBalance} days</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Monthly Limit:</p>
                        <p className="text-lg font-bold text-gray-700">{policyConfig.maxMonthlyLimit} days</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Policy Check */}
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 mb-2">Policy Status:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        {employeePLBalance > 0 ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-600" />
                        )}
                        <span>PL Available: {employeePLBalance > 0 ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {employeeMonthlyAdjustmentUsed < policyConfig.maxMonthlyLimit ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-600" />
                        )}
                        <span>Within Monthly Limit</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isFullTime && isProbationCompleted ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-600" />
                        )}
                        <span>Eligible Employee</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {data.adjustment.lateComingCount <= policyConfig.lateThreshold ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-600" />
                        )}
                        <span>Behavior Check</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => setShowAdjustmentModal(true)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white w-full py-6 text-base font-semibold"
                  >
                    🎯 Request Leave Adjustment (Use PL to Offset Deduction)
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    ⚠️ All adjustment requests require HR approval
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Leave Adjustment Request Status - PENDING */}
            {adjustmentRequest.status === "pending" && (
              <Card className="border-2 border-amber-400 bg-amber-50">
                <CardHeader className="bg-amber-100 border-b border-amber-300">
                  <CardTitle className="text-base text-amber-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    ⏳ Adjustment Request Pending HR Approval
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <div className="bg-white p-4 rounded-lg border border-amber-300">
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-600">Requested PL Adjustment:</p>
                        <p className="text-lg font-bold text-amber-800">{adjustmentRequest.plDaysRequested} days</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Deduction Amount:</p>
                        <p className="text-lg font-bold text-red-700">₹{(adjustmentRequest?.deductionAmount ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-amber-200">
                      <p className="text-xs text-gray-600">Requested At:</p>
                      <p className="text-sm font-semibold text-gray-800">{adjustmentRequest.requestedAt}</p>
                    </div>
                  </div>

                  {/* Policy Validation Results */}
                  {adjustmentRequest.policyValidation && (
                    <div className="bg-amber-50 p-3 rounded border border-amber-300">
                      <p className="text-xs font-semibold text-amber-900 mb-2">Policy Check Results:</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          {adjustmentRequest.policyValidation.isEligible ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span>Employee Eligibility</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {adjustmentRequest.policyValidation.withinMonthlyLimit ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span>Within Monthly Limit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {adjustmentRequest.policyValidation.hasSufficientPL ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span>Sufficient PL Balance</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {adjustmentRequest.policyValidation.behaviorCheck ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span>Behavior Check</span>
                        </div>
                      </div>
                      {adjustmentRequest.policyValidation.issues.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-amber-300">
                          <p className="text-xs font-semibold text-red-700 mb-1">Policy Issues:</p>
                          <ul className="text-xs text-red-600 space-y-0.5 ml-4 list-disc">
                            {adjustmentRequest.policyValidation.issues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-blue-50 p-3 rounded border border-blue-200 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-900">
                      Waiting for HR approval... You will be notified once reviewed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leave Adjustment Request Status - APPROVED */}
            {adjustmentRequest.status === "approved" && (
              <Card className="border-2 border-green-400 bg-green-50">
                <CardHeader className="bg-green-100 border-b border-green-300">
                  <CardTitle className="text-base text-green-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    ✅ Adjustment Request Approved!
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <div className="bg-white p-4 rounded-lg border border-green-300">
                    <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-600">PL Deducted:</p>
                        <p className="text-lg font-bold text-green-700">{adjustmentRequest.plDaysRequested} days</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Salary Saved:</p>
                        <p className="text-lg font-bold text-green-700">₹{(adjustmentRequest?.deductionAmount ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">New PL Balance:</p>
                        <p className="text-lg font-bold text-cyan-700">{employeePLBalance - adjustmentRequest.plDaysRequested} days</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-green-200">
                      <p className="text-xs text-gray-600">Approved By:</p>
                      <p className="text-sm font-semibold text-gray-800">{adjustmentRequest.approvedBy || "HR Manager"}</p>
                      <p className="text-xs text-gray-600 mt-1">Approved At:</p>
                      <p className="text-sm font-semibold text-gray-800">{adjustmentRequest.approvedAt || new Date().toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-green-100 p-3 rounded border border-green-300">
                    <p className="text-sm text-green-900 font-semibold">
                      🎉 Your salary deduction has been waived! The {adjustmentRequest.plDaysRequested} days have been deducted from your PL balance and your net salary has been updated.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leave Adjustment Request Status - REJECTED */}
            {adjustmentRequest.status === "rejected" && (
              <Card className="border-2 border-red-400 bg-red-50">
                <CardHeader className="bg-red-100 border-b border-red-300">
                  <CardTitle className="text-base text-red-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    ❌ Adjustment Request Rejected
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
                        <p className="text-lg font-bold text-red-700">₹{(adjustmentRequest?.deductionAmount ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-red-200">
                      <p className="text-xs text-gray-600">Rejected By:</p>
                      <p className="text-sm font-semibold text-gray-800">{adjustmentRequest.approvedBy || "HR Manager"}</p>
                    </div>
                  </div>

                  {adjustmentRequest.rejectionReason && (
                    <div className="bg-red-100 p-3 rounded border border-red-300">
                      <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-800">{adjustmentRequest.rejectionReason}</p>
                    </div>
                  )}

                  <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
                    <p className="text-sm text-yellow-900">
                      ⚠️ Your PL balance remains unchanged ({employeePLBalance} days), and the salary deduction of ₹{(adjustmentRequest?.deductionAmount ?? 0).toLocaleString()} will be applied as per attendance records.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* HR Action Panel */}
            {payslipStatus === "pending" && !["HR", "HR Manager", "Admin", "Super Admin"].includes(currentRole as string) && (
              <Card className="border border-gray-200 bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-5 h-5" />
                    <p className="text-sm">This payslip is pending HR review and approval.</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {payslipStatus === "pending" && ["HR", "HR Manager", "Admin", "Super Admin"].includes(currentRole as string) && (
              <Card className="border-2 border-blue-400 bg-blue-50">
                <CardHeader className="bg-blue-100 border-b border-blue-300">
                  <CardTitle className="text-base text-blue-900">HR Action Panel</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 gap-2"
                    >
                      <ThumbsUp className="w-5 h-5" />
                      Approve Payslip
                    </Button>
                    <Button
                      onClick={() => setShowRejectModal(true)}
                      variant="destructive"
                      className="px-6 py-2 gap-2"
                    >
                      <ThumbsDown className="w-5 h-5" />
                      Reject & Send Back
                    </Button>
                    <Button
                      variant="outline"
                      className="px-6 py-2 gap-2"
                      onClick={() => setShowOverrideModal(true)}
                    >
                      <Edit className="w-5 h-5" />
                      Edit Adjustments
                    </Button>
                    <Button
                      onClick={() => setShowOverrideModal(true)}
                      variant="outline"
                      className="border-purple-500 text-purple-700 hover:bg-purple-50 px-6 py-2 gap-2"
                    >
                      <Shield className="w-5 h-5" />
                      <div className="flex flex-col items-start">
                        <span>Override Deduction Rules</span>
                        <span className="text-[10px] font-normal">(Requires Admin Approval)</span>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* pending_superadmin — waiting for Super Admin */}
            {(payslipStatus as string) === "pending_superadmin" && (currentRole as string) === "Super Admin" && (
              <Card className="border-2 border-indigo-400 bg-indigo-50">
                <CardHeader className="bg-indigo-100 border-b border-indigo-300">
                  <CardTitle className="text-base text-indigo-900 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Super Admin Final Approval Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-indigo-900">HR has reviewed and approved this payslip. Your final approval will release it for salary processing.</p>
                  <div className="flex gap-3">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                      onClick={() => {
                        const key = `payslip_status_${data.employeeCode}_${year}_${month}`;
                        try {
                          const ex = JSON.parse(localStorage.getItem(key) || "{}");
                          ex.status = "approved"; ex.superAdminApprovedBy = currentUserName; ex.superAdminApprovedAt = new Date().toISOString();
                          localStorage.setItem(key, JSON.stringify(ex));
                        } catch { /* ignore */ }
                        setPayslipStatus("approved");
                        toast.success("Payslip finally approved by Super Admin. Ready for salary processing.");
                      }}>
                      <CheckCircle className="w-5 h-5" />
                      Final Approve & Release
                    </Button>
                    <Button variant="destructive" onClick={() => { setPayslipStatus("pending" as any); toast.error("Sent back to HR for revision."); }}>
                      Send Back to HR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {(payslipStatus as string) === "pending_superadmin" && (currentRole as string) !== "Super Admin" && (
              <Card className="border-2 border-indigo-300 bg-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-indigo-900">
                    <Clock className="w-5 h-5" />
                    <div>
                      <p className="font-bold text-sm">Awaiting Super Admin Final Approval</p>
                      <p className="text-xs text-indigo-700 mt-1">HR has approved. Super Admin review is pending before processing.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {payslipStatus === "approved" && (
              <Card className="border-2 border-green-400 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-green-900">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div className="flex-1">
                      <p className="font-bold">Payslip Fully Approved — Ready for Processing</p>
                      <p className="text-sm mt-1">Final approval complete. Net payable: ₹{finalNetPayable.toLocaleString()}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="gap-2 border-green-500 text-green-700"
                          onClick={() => window.print()}>
                          🖨 Print
                        </Button>
                        <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            const content = `PAYSLIP\n${data.employeeName} (${data.employeeCode})\n${monthNames[month-1]} ${year}\n\nNet Payable: Rs.${finalNetPayable.toLocaleString()}\nTotal Earnings: Rs.${totalEarnings.toLocaleString()}\nTotal Deductions: Rs.${finalTotalDeductions.toLocaleString()}\n\nBasic: Rs.${basicActual.toLocaleString()}\nEPF: Rs.${epf.toLocaleString()}\nESIC: Rs.${esic.toLocaleString()}\nPT: Rs.${pt}\nLWF: Rs.${lwf}\nTDS: Rs.${tds}\nAttendance Deduction: Rs.${finalAttendanceDeduction.toLocaleString()}`;
                            const blob = new Blob([content], {type:"text/plain"});
                            const a = Object.assign(document.createElement("a"), {href:URL.createObjectURL(blob), download:`Payslip_${data.employeeCode}_${monthNames[month-1]}_${year}.txt`});
                            a.click();
                          }}>
                          ⬇ Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {payslipStatus === "rejected" && (
              <Card className="border-2 border-red-400 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 text-red-900">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div className="flex-1">
                      <p className="font-bold">Payslip Rejected by HR</p>
                      <p className="text-sm mt-1">Reason: {hrComment}</p>
                      <p className="text-xs text-gray-600 mt-2">Sent back for corrections</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* System Statement */}
            <Card className="border-2 border-purple-300 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="text-sm text-purple-900">
                    <p className="font-bold mb-2">🔥 SYSTEM STATEMENT:</p>
                    <p className="italic">
                      "Payslip is auto-generated from attendance-driven calculations, variable inputs, and statutory deductions, 
                      and must be reviewed and approved by HR before finalization. After HR approval, it is submitted to Super Admin for final approval."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="bg-red-100 border-b">
              <CardTitle className="text-red-900">Reject Payslip</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Reason for Rejection *
                </label>
                <Textarea
                  value={hrComment}
                  onChange={(e) => setHRComment(e.target.value)}
                  placeholder="e.g., Incorrect attendance deduction, Missing incentive data..."
                  rows={4}
                  className="w-full"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!hrComment.trim()}
                >
                  Confirm Rejection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leave Adjustment Request Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-cyan-100 border-b sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-cyan-900 flex items-center gap-2">
                    🎯 Request Leave Adjustment Against Salary Deduction
                  </CardTitle>
                  <p className="text-sm text-cyan-700 mt-1">Use your PL to offset attendance deduction</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelAdjustment}
                >
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
                    All leave adjustment requests require <strong>HR approval</strong>. Your PL will only be deducted after approval.
                  </p>
                </CardContent>
              </Card>

              {/* Current Deduction Summary */}
              <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                <p className="text-sm font-semibold text-orange-900 mb-3">Current Attendance Deduction:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Total Days Deducted:</p>
                    <p className="text-2xl font-bold text-red-700">{(data?.adjustment?.daysDeducted ?? 0).toFixed(1)} days</p>
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Absent:</span>
                      <span className="font-semibold">{data.summary.absentDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">LWP:</span>
                      <span className="font-semibold">{data.summary.leaveWithoutPay} days</span>
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
                    placeholder="e.g., 1.5"
                    className="w-32 text-lg"
                    min="0"
                    max={Math.min(data.adjustment.daysDeducted, employeePLBalance, policyConfig.maxPerRequest)}
                  />
                  <span className="text-sm text-gray-600">days</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Max allowed per request: <strong>{policyConfig.maxPerRequest} day</strong> | 
                  Your deduction: <strong>{(data?.adjustment?.daysDeducted ?? 0).toFixed(1)} days</strong>
                </p>
              </div>

              {/* Real-time Policy Validation */}
              {adjustmentDays && parseFloat(adjustmentDays) > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                  <p className="text-xs font-semibold text-blue-900 mb-2">Policy Check (Real-time):</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      {parseFloat(adjustmentDays) <= employeePLBalance ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>
                        Sufficient PL Balance 
                        {parseFloat(adjustmentDays) <= employeePLBalance ? 
                          ` (${adjustmentDays} ≤ ${employeePLBalance})` : 
                          ` (Need: ${adjustmentDays}, Have: ${employeePLBalance})`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(employeeMonthlyAdjustmentUsed + parseFloat(adjustmentDays)) <= policyConfig.maxMonthlyLimit ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>
                        Within Monthly Limit 
                        ({employeeMonthlyAdjustmentUsed + parseFloat(adjustmentDays)} ≤ {policyConfig.maxMonthlyLimit})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {parseFloat(adjustmentDays) <= policyConfig.maxPerRequest ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>
                        Within Request Limit ({adjustmentDays} ≤ {policyConfig.maxPerRequest})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {data.adjustment.lateComingCount <= policyConfig.lateThreshold ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>
                        Behavior Check 
                        (Late: {data.adjustment.lateComingCount} ≤ {policyConfig.lateThreshold})
                      </span>
                    </div>
                  </div>
                  
                  {/* Calculation Preview */}
                  <div className="mt-3 pt-3 border-t border-blue-300 bg-white p-2 rounded">
                    <p className="text-xs font-semibold text-gray-700 mb-1">If Approved:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">PL After Deduction:</span>
                        <span className="ml-2 font-bold text-cyan-700">
                          {(employeePLBalance - parseFloat(adjustmentDays)).toFixed(1)} days
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Salary Saved:</span>
                        <span className="ml-2 font-bold text-green-700">
                          ₹{Math.round(parseFloat(adjustmentDays) * perDayRateForDeduction).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason Field */}
              <div className="border-t pt-4">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Reason for Adjustment Request *
                </label>
                <Textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Had medical emergency, Family circumstances, System glitch verified..."
                  rows={4}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  * Required: Provide clear justification for HR review
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancelAdjustment}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestAdjustment}
                  disabled={!adjustmentDays || !adjustmentReason.trim() || parseFloat(adjustmentDays) <= 0}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  🎯 Submit Request to HR
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Override Deduction Rules Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-purple-100 border-b sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-purple-900 flex items-center gap-2">
                    <Shield className="w-6 h-6" />
                    Override Deduction Rules
                  </CardTitle>
                  <p className="text-sm text-purple-700 mt-1">Requires Admin/Super Admin Approval</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelOverride}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Info Banner */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-3">
                  <p className="text-sm text-blue-900">
                    <Info className="w-4 h-4 inline mr-1" />
                    You can customize deduction rules for this specific employee. All changes require approval from Admin or Super Admin.
                  </p>
                </CardContent>
              </Card>

              {/* Current Attendance Summary */}
              <div className="bg-gray-50 p-4 rounded border">
                <p className="text-sm font-semibold text-gray-700 mb-2">Current Attendance Status:</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Late Coming:</span>
                    <span className="ml-2 font-semibold">{data.adjustment.lateComingCount} times</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Auto Logout:</span>
                    <span className="ml-2 font-semibold">{data.adjustment.autoLogoutCount} times</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Absent Days:</span>
                    <span className="ml-2 font-semibold">{data.summary.absentDays} days</span>
                  </div>
                  <div>
                    <span className="text-gray-600">LWP Days:</span>
                    <span className="ml-2 font-semibold">{data.summary.leaveWithoutPay} days</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <span className="text-gray-600">Current Deduction:</span>
                  <span className="ml-2 font-bold text-red-700">{(data?.adjustment?.daysDeducted ?? 0).toFixed(1)} days (₹{attendanceDeductionAmount})</span>
                </div>
              </div>

              {/* Override Form Fields */}
              <div className="space-y-4">
                {/* Late Coming Rule */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Late Coming Deduction Rule
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={customLateRule}
                      onChange={(e) => setCustomLateRule(e.target.value)}
                      className="w-20"
                      min="1"
                    />
                    <span className="text-sm text-gray-600">late coming instances = 0.5 day deduction</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Standard: 3 lates = 0.5 day deduction
                  </p>
                </div>

                {/* Auto Logout Rule */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Auto Logout Deduction (days per occurrence)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={customAutoLogoutRule}
                      onChange={(e) => setCustomAutoLogoutRule(e.target.value)}
                      className="w-24"
                      min="0"
                    />
                    <span className="text-sm text-gray-600">days per auto logout</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Standard: 1 auto logout = 0.5 day deduction
                  </p>
                </div>

                {/* Custom Adjustment */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Custom Adjustment (in days)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.5"
                      value={customAdjustmentDays}
                      onChange={(e) => setCustomAdjustmentDays(e.target.value)}
                      className="w-24"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-600">days (use negative to reduce, positive to add)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Additional days to add (+) or subtract (-) from the final calculation
                  </p>
                </div>

                {/* Manual Override */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Manually Set Attendance Deduction (days)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={manualAttendanceDeduction}
                      onChange={(e) => setManualAttendanceDeduction(e.target.value)}
                      className="w-24"
                      placeholder="Leave empty"
                      min="0"
                    />
                    <span className="text-sm text-gray-600">days</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Completely override the calculated deduction (leave empty to use above rules)
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t pt-4">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Reason for Override Request *
                  </label>
                  <Textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g., Medical emergency with doctor's note, System glitch confirmed by IT, Special approval from management..."
                    rows={4}
                    className="w-full"
                  />
                  <p className="text-xs text-red-600 mt-1">
                    * Required: Provide detailed justification for admin review
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancelOverride}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitOverride}
                  disabled={!overrideReason.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Submit Override Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Override Request Status Display */}
      {overrideRequest.status !== "none" && (
        <div className="border-t-4 border-purple-500 pt-6">
          {overrideRequest.status === "pending" && (
            <Card className="border-2 border-amber-400 bg-amber-50">
              <CardHeader className="bg-amber-100 border-b">
                <CardTitle className="text-amber-900 flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Override Request Pending Admin Approval
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-900 mb-2">
                      <strong>Requested by:</strong> {overrideRequest.requestedBy}
                    </p>
                    <p className="text-sm text-amber-900 mb-3">
                      <strong>Requested at:</strong> {overrideRequest.requestedAt}
                    </p>
                    
                    <div className="bg-white p-3 rounded border border-amber-300 mb-3">
                      <p className="text-xs font-semibold mb-2">Requested Changes:</p>
                      <ul className="text-xs space-y-1 text-gray-700">
                        {overrideRequest.overrides.lateComingRule && (
                          <li>• Late Coming Rule: <strong>{overrideRequest.overrides.lateComingRule}</strong></li>
                        )}
                        {overrideRequest.overrides.autoLogoutRule && (
                          <li>• Auto Logout Rule: <strong>{overrideRequest.overrides.autoLogoutRule}</strong></li>
                        )}
                        {overrideRequest.overrides.customAdjustment !== undefined && overrideRequest.overrides.customAdjustment !== 0 && (
                          <li>• Custom Adjustment: <strong>{overrideRequest.overrides.customAdjustment > 0 ? '+' : ''}{overrideRequest.overrides.customAdjustment} days</strong></li>
                        )}
                        {overrideRequest.overrides.overrideAttendanceDeduction !== undefined && (
                          <li>• Manual Attendance Deduction: <strong>{overrideRequest.overrides.overrideAttendanceDeduction} days</strong></li>
                        )}
                      </ul>
                    </div>

                    <div className="bg-amber-100 p-3 rounded border border-amber-300">
                      <p className="text-xs font-semibold mb-1">Justification:</p>
                      <p className="text-sm text-gray-800 italic">{overrideRequest.reason}</p>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-amber-800">
                      <Clock className="w-4 h-4" />
                      <p className="text-xs">Awaiting approval from Admin/Super Admin...</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {overrideRequest.status === "approved" && (
            <Card className="border-2 border-green-400 bg-green-50">
              <CardHeader className="bg-green-100 border-b">
                <CardTitle className="text-green-900 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  ✓ Override Approved by Super Admin
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-green-900 mb-1">
                      <strong>Approved by:</strong> {overrideRequest.approvedBy || "Super Admin"}
                    </p>
                    <p className="text-sm text-green-900 mb-3">
                      <strong>Approved at:</strong> {overrideRequest.approvedAt || new Date().toLocaleString()}
                    </p>
                    
                    <Badge className="bg-green-600 text-white">
                      Custom Rules Applied
                    </Badge>

                    <div className="mt-3 bg-white p-3 rounded border border-green-300">
                      <p className="text-xs font-semibold mb-2">Applied Changes:</p>
                      <ul className="text-xs space-y-1 text-gray-700">
                        {overrideRequest.overrides.lateComingRule && (
                          <li>• Late Coming Rule: <strong>{overrideRequest.overrides.lateComingRule}</strong></li>
                        )}
                        {overrideRequest.overrides.autoLogoutRule && (
                          <li>• Auto Logout Rule: <strong>{overrideRequest.overrides.autoLogoutRule}</strong></li>
                        )}
                        {overrideRequest.overrides.customAdjustment !== undefined && overrideRequest.overrides.customAdjustment !== 0 && (
                          <li>• Custom Adjustment: <strong>{overrideRequest.overrides.customAdjustment > 0 ? '+' : ''}{overrideRequest.overrides.customAdjustment} days</strong></li>
                        )}
                        {overrideRequest.overrides.overrideAttendanceDeduction !== undefined && (
                          <li>• Manual Attendance Deduction: <strong>{overrideRequest.overrides.overrideAttendanceDeduction} days</strong></li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {overrideRequest.status === "rejected" && (
            <Card className="border-2 border-red-400 bg-red-50">
              <CardHeader className="bg-red-100 border-b">
                <CardTitle className="text-red-900 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  ✗ Override Request Rejected
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-red-900 mb-1">
                      <strong>Rejected by:</strong> {overrideRequest.approvedBy || "Admin"}
                    </p>
                    <p className="text-sm text-red-900 mb-3">
                      Standard deduction rules will continue to apply
                    </p>
                    
                    {overrideRequest.reason && (
                      <div className="bg-white p-3 rounded border border-red-300">
                        <p className="text-xs font-semibold mb-1">Rejection Reason:</p>
                        <p className="text-sm text-gray-800">{overrideRequest.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {/* Audit Trail — visible to HR and above */}
      {["HR", "HR Manager", "Admin", "Super Admin"].includes(currentRole as string) && (() => {
        try {
          const trail = JSON.parse(localStorage.getItem(`payslip_audit_${data.employeeCode}_${year}_${month}`) || "[]");
          if (!trail.length) return null;
          return (
            <div className="border-t-2 border-gray-200 pt-4 mt-4 px-1">
              <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Audit Trail</p>
              <div className="space-y-1">
                {trail.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-gray-500 py-1 border-b border-gray-100">
                    <span className="font-mono text-gray-400 flex-shrink-0">{new Date(e.timestamp).toLocaleString()}</span>
                    <span className="font-semibold text-gray-700">{e.actor} ({e.role})</span>
                    <span className="text-gray-600">{e.action?.replace(/_/g," ")}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        } catch { return null; }
      })()}

    </>
  );
}