/**
 * Payroll Service - Mock API Layer
 * Simulates backend API responses with config-driven data
 */

import {
  ATTENDANCE_TYPES,
  DEDUCTION_RULES,
  STATUTORY_RULES,
  WORKING_HOURS,
} from "../constants/payrollConstants";

// ==================== TYPE DEFINITIONS ====================

export interface PunchLog {
  time: string;
  type: "in" | "out";
}

export interface DailyAttendance {
  date: string;
  status: string;
  inTime: string | null;
  outTime: string | null;
  workingHours: number;
  isLate: boolean;
  isAutoLogout: boolean;
  isSunday: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  payDays: number;
  weeklyOff: number;
  presentDays: number;
  absentDays: number;
  leaveWithPay: number;
  leaveWithoutPay: number;
  halfDays: number;
  lateComingCount: number;
  autoLogoutCount: number;
  deductionDays: number;
}

export interface EarningComponent {
  name: string;
  amount: number;
  formula: string;
}

export interface DeductionComponent {
  name: string;
  amount: number;
  formula: string;
}

export interface PayrollData {
  earnings: EarningComponent[];
  deductions: DeductionComponent[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  employerContribution: {
    epf: number;
    esic: number;
    total: number;
  };
}

export interface EmployeeInfo {
  id: string;
  name: string;
  code: string;
  department: string;
  designation: string;
  branch: string;
  dateOfJoining: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  uan: string;
  esicNumber: string;
}

export interface MonthlyPayrollResponse {
  employee: EmployeeInfo;
  attendance: {
    dailyLogs: DailyAttendance[];
    summary: AttendanceSummary;
  };
  payroll: PayrollData;
  month: number;
  year: number;
  status: string;
}

// ==================== MOCK DATA GENERATION ====================

function generateDailyAttendance(month: number, year: number): DailyAttendance[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const logs: DailyAttendance[] = [];

  // Define holidays for January 2022
  const holidays = [
    { date: "2022-01-26", name: "Republic Day" },
  ];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getDay();
    const isSunday = dayOfWeek === 0;

    const holiday = holidays.find((h) => h.date === dateStr);
    const isHoliday = !!holiday;

    let status = ATTENDANCE_TYPES.PRESENT;
    let inTime: string | null = "09:05";
    let outTime: string | null = "18:10";
    let workingHours = 9;
    let isLate = false;
    let isAutoLogout = false;

    if (isSunday) {
      status = ATTENDANCE_TYPES.WEEKLY_OFF;
      inTime = null;
      outTime = null;
      workingHours = 0;
    } else if (isHoliday) {
      status = ATTENDANCE_TYPES.PUBLIC_HOLIDAY;
      inTime = null;
      outTime = null;
      workingHours = 0;
    } else {
      // Simulate some variations
      const random = 0.88;

      if (random < 0.05) {
        // 5% absent
        status = ATTENDANCE_TYPES.ABSENT;
        inTime = null;
        outTime = null;
        workingHours = 0;
      } else if (random < 0.1) {
        // 5% half day
        status = ATTENDANCE_TYPES.HALF_DAY;
        inTime = "09:00";
        outTime = "13:30";
        workingHours = 4.5;
      } else if (random < 0.15) {
        // 5% late coming
        isLate = true;
        inTime = "10:15";
        outTime = "19:20";
        workingHours = 9;
      } else if (random < 0.18) {
        // 3% auto logout
        isAutoLogout = true;
        inTime = "09:00";
        outTime = "17:00";
        workingHours = 8;
      }
    }

    logs.push({
      date: dateStr,
      status,
      inTime,
      outTime,
      workingHours,
      isLate,
      isAutoLogout,
      isSunday,
      isHoliday,
      holidayName: holiday?.name,
    });
  }

  return logs;
}

function calculateAttendanceSummary(dailyLogs: DailyAttendance[]): AttendanceSummary {
  const totalDays = dailyLogs.length;
  const weeklyOff = dailyLogs.filter((log) => log.status === ATTENDANCE_TYPES.WEEKLY_OFF).length;
  const presentDays = dailyLogs.filter((log) => log.status === ATTENDANCE_TYPES.PRESENT).length;
  const absentDays = dailyLogs.filter((log) => log.status === ATTENDANCE_TYPES.ABSENT).length;
  const halfDays = dailyLogs.filter((log) => log.status === ATTENDANCE_TYPES.HALF_DAY).length;
  const leaveWithPay = dailyLogs.filter(
    (log) =>
      log.status === ATTENDANCE_TYPES.PAID_LEAVE ||
      log.status === ATTENDANCE_TYPES.CASUAL_LEAVE ||
      log.status === ATTENDANCE_TYPES.SICK_LEAVE ||
      log.status === ATTENDANCE_TYPES.PUBLIC_HOLIDAY
  ).length;
  const leaveWithoutPay = dailyLogs.filter(
    (log) => log.status === ATTENDANCE_TYPES.LEAVE_WITHOUT_PAY
  ).length;
  const lateComingCount = dailyLogs.filter((log) => log.isLate).length;
  const autoLogoutCount = dailyLogs.filter((log) => log.isAutoLogout).length;

  // Calculate deduction days based on rules
  let deductionDays = 0;
  deductionDays += absentDays * DEDUCTION_RULES.ABSENT_DEDUCTION;
  deductionDays += halfDays * DEDUCTION_RULES.HALF_DAY_DEDUCTION;
  deductionDays += leaveWithoutPay * DEDUCTION_RULES.LWP_DEDUCTION;

  if (lateComingCount >= DEDUCTION_RULES.LATE_COMING_THRESHOLD) {
    deductionDays += Math.floor(lateComingCount / DEDUCTION_RULES.LATE_COMING_THRESHOLD) *
                     DEDUCTION_RULES.LATE_COMING_DEDUCTION;
  }

  if (autoLogoutCount >= DEDUCTION_RULES.AUTO_LOGOUT_THRESHOLD) {
    deductionDays += Math.floor(autoLogoutCount / DEDUCTION_RULES.AUTO_LOGOUT_THRESHOLD) *
                     DEDUCTION_RULES.AUTO_LOGOUT_DEDUCTION;
  }

  const payDays = totalDays - weeklyOff - deductionDays;

  return {
    totalDays,
    payDays: Math.max(0, payDays),
    weeklyOff,
    presentDays,
    absentDays,
    leaveWithPay,
    leaveWithoutPay,
    halfDays,
    lateComingCount,
    autoLogoutCount,
    deductionDays,
  };
}

function calculatePayroll(
  basicSalary: number,
  attendanceSummary: AttendanceSummary,
  totalDaysInMonth: number
): PayrollData {
  // Calculate per-day salary
  const perDaySalary = basicSalary / totalDaysInMonth;

  // Calculate adjusted basic based on pay days
  const adjustedBasic = (basicSalary * attendanceSummary.payDays) / totalDaysInMonth;

  // Calculate earnings
  const hra = adjustedBasic * 0.4; // 40% of basic
  const conveyance = 1600;
  const medical = 1250;
  const specialAllowance = adjustedBasic * 0.2; // 20% of basic

  const grossPay = adjustedBasic + hra + conveyance + medical + specialAllowance;

  // Calculate deductions
  const epf = adjustedBasic * (STATUTORY_RULES.EPF_PERCENTAGE / 100);
  const esic = grossPay <= STATUTORY_RULES.ESIC_THRESHOLD
    ? grossPay * (STATUTORY_RULES.ESIC_PERCENTAGE / 100)
    : 0;

  // Calculate PT based on slabs
  let pt = 0;
  for (const slab of STATUTORY_RULES.PT_SLABS) {
    if (grossPay >= slab.min && grossPay <= slab.max) {
      pt = slab.amount;
      break;
    }
  }

  const attendanceDeduction = attendanceSummary.deductionDays * perDaySalary;

  const totalDeductions = epf + esic + pt + attendanceDeduction;
  const netPay = grossPay - totalDeductions;

  // Employer contributions
  const employerEPF = adjustedBasic * (STATUTORY_RULES.EPF_EMPLOYER_PERCENTAGE / 100);
  const employerESIC = grossPay <= STATUTORY_RULES.ESIC_THRESHOLD
    ? grossPay * (STATUTORY_RULES.ESIC_EMPLOYER_PERCENTAGE / 100)
    : 0;

  return {
    earnings: [
      {
        name: "Basic Salary",
        amount: adjustedBasic,
        formula: `₹${basicSalary.toFixed(2)} × ${attendanceSummary.payDays} / ${totalDaysInMonth} days`,
      },
      {
        name: "HRA",
        amount: hra,
        formula: `40% of Basic = ₹${adjustedBasic.toFixed(2)} × 0.40`,
      },
      {
        name: "Conveyance",
        amount: conveyance,
        formula: "Fixed amount",
      },
      {
        name: "Medical Allowance",
        amount: medical,
        formula: "Fixed amount",
      },
      {
        name: "Special Allowance",
        amount: specialAllowance,
        formula: `20% of Basic = ₹${adjustedBasic.toFixed(2)} × 0.20`,
      },
    ],
    deductions: [
      {
        name: "EPF",
        amount: epf,
        formula: `12% of Basic = ₹${adjustedBasic.toFixed(2)} × 0.12`,
      },
      esic > 0 ? {
        name: "ESIC",
        amount: esic,
        formula: `0.75% of Gross = ₹${grossPay.toFixed(2)} × 0.0075`,
      } : null,
      pt > 0 ? {
        name: "Professional Tax",
        amount: pt,
        formula: `As per slab (Gross: ₹${grossPay.toFixed(2)})`,
      } : null,
      attendanceDeduction > 0 ? {
        name: "Attendance Deduction",
        amount: attendanceDeduction,
        formula: `${attendanceSummary.deductionDays} days × ₹${perDaySalary.toFixed(2)}`,
      } : null,
    ].filter(Boolean) as DeductionComponent[],
    grossPay,
    totalDeductions,
    netPay,
    employerContribution: {
      epf: employerEPF,
      esic: employerESIC,
      total: employerEPF + employerESIC,
    },
  };
}

// ==================== API SIMULATION ====================

/**
 * Fetch monthly payroll data for an employee
 * This simulates: GET /employee/{id}/monthly-payroll?month=01&year=2022
 */
export async function fetchMonthlyPayroll(
  employeeId: string,
  month: number,
  year: number
): Promise<MonthlyPayrollResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock employee data
  const employee: EmployeeInfo = {
    id: employeeId,
    name: "Rajesh Kumar",
    code: "CW0001",
    department: "Operations",
    designation: "Car Washer",
    branch: "Ahmedabad - Satellite",
    dateOfJoining: "2021-06-15",
    bankName: "HDFC Bank",
    accountNumber: "50100123456789",
    ifscCode: "HDFC0001234",
    uan: "101234567890",
    esicNumber: "1234567890123456",
  };

  // Generate attendance data
  const dailyLogs = generateDailyAttendance(month, year);
  const summary = calculateAttendanceSummary(dailyLogs);

  // Calculate payroll (using basic salary of ₹12,000)
  const basicSalary = 12000;
  const payroll = calculatePayroll(basicSalary, summary, dailyLogs.length);

  return {
    employee,
    attendance: {
      dailyLogs,
      summary,
    },
    payroll,
    month,
    year,
    status: "draft",
  };
}

/**
 * Get deduction explanation with breakdown
 */
export function getDeductionExplanation(
  attendanceSummary: AttendanceSummary,
  perDaySalary: number
): {
  reason: string;
  days: number;
  amount: number;
  formula: string;
}[] {
  const explanations: {
    reason: string;
    days: number;
    amount: number;
    formula: string;
  }[] = [];

  if (attendanceSummary.absentDays > 0) {
    explanations.push({
      reason: "Absent Days",
      days: attendanceSummary.absentDays,
      amount: attendanceSummary.absentDays * perDaySalary,
      formula: `${attendanceSummary.absentDays} days × ₹${perDaySalary.toFixed(2)}`,
    });
  }

  if (attendanceSummary.halfDays > 0) {
    const deductionDays = attendanceSummary.halfDays * 0.5;
    explanations.push({
      reason: "Half Days",
      days: deductionDays,
      amount: deductionDays * perDaySalary,
      formula: `${attendanceSummary.halfDays} half days × 0.5 × ₹${perDaySalary.toFixed(2)}`,
    });
  }

  if (attendanceSummary.leaveWithoutPay > 0) {
    explanations.push({
      reason: "Leave Without Pay",
      days: attendanceSummary.leaveWithoutPay,
      amount: attendanceSummary.leaveWithoutPay * perDaySalary,
      formula: `${attendanceSummary.leaveWithoutPay} days × ₹${perDaySalary.toFixed(2)}`,
    });
  }

  if (attendanceSummary.lateComingCount >= DEDUCTION_RULES.LATE_COMING_THRESHOLD) {
    const deductionDays =
      Math.floor(attendanceSummary.lateComingCount / DEDUCTION_RULES.LATE_COMING_THRESHOLD) *
      DEDUCTION_RULES.LATE_COMING_DEDUCTION;
    explanations.push({
      reason: `Late Coming (${attendanceSummary.lateComingCount} times)`,
      days: deductionDays,
      amount: deductionDays * perDaySalary,
      formula: `${attendanceSummary.lateComingCount} late marks ÷ ${DEDUCTION_RULES.LATE_COMING_THRESHOLD} × ${DEDUCTION_RULES.LATE_COMING_DEDUCTION} days × ₹${perDaySalary.toFixed(2)}`,
    });
  }

  if (attendanceSummary.autoLogoutCount >= DEDUCTION_RULES.AUTO_LOGOUT_THRESHOLD) {
    const deductionDays =
      Math.floor(attendanceSummary.autoLogoutCount / DEDUCTION_RULES.AUTO_LOGOUT_THRESHOLD) *
      DEDUCTION_RULES.AUTO_LOGOUT_DEDUCTION;
    explanations.push({
      reason: `Auto Logout (${attendanceSummary.autoLogoutCount} times)`,
      days: deductionDays,
      amount: deductionDays * perDaySalary,
      formula: `${attendanceSummary.autoLogoutCount} auto logouts ÷ ${DEDUCTION_RULES.AUTO_LOGOUT_THRESHOLD} × ${DEDUCTION_RULES.AUTO_LOGOUT_DEDUCTION} day × ₹${perDaySalary.toFixed(2)}`,
    });
  }

  return explanations;
}
