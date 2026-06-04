/**
 * Data Synchronization Utilities
 * Ensures data consistency across HR, Payroll, and Attendance modules
 */

import {
  Employee,
  AttendanceRecord,
  MonthlyAttendanceSummary,
  PayrollRun,
  SalaryCalculation,
  ComponentCalculation,
} from "../types/hr-types";

/**
 * Calculate salary components based on attendance and employee data
 */
export function calculateSalaryFromAttendance(
  employee: Employee,
  attendanceSummary: MonthlyAttendanceSummary
): SalaryCalculation {
  const { salaryInfo, employmentInfo } = employee;
  const { paidDays, totalDays } = attendanceSummary;

  // Calculate proration ratio
  const prorationRatio = paidDays / totalDays;
  const isProratedSalary = prorationRatio < 1;

  // Calculate basic salary (prorated if needed)
  const basicSalary = isProratedSalary
    ? Math.round(salaryInfo.basicSalary * prorationRatio)
    : salaryInfo.basicSalary;

  // Calculate earnings
  const earnings: ComponentCalculation[] = [];
  let grossSalary = 0;

  // First pass: Calculate fixed and basic-based percentage components
  const fixedComponents = salaryInfo.earnings.filter((c) => c.type === "Fixed");
  const basicPercentComponents = salaryInfo.earnings.filter(
    (c) => c.type === "%" && c.baseOn === "Basic"
  );
  const grossPercentComponents = salaryInfo.earnings.filter(
    (c) => c.type === "%" && c.baseOn === "Gross"
  );

  let fixedTotal = 0;
  fixedComponents.forEach((comp) => {
    const value =
      comp.name === "Basic Salary"
        ? basicSalary
        : Math.round(parseFloat(comp.value) * (isProratedSalary ? prorationRatio : 1));
    earnings.push({
      componentName: comp.name,
      componentType: comp.type,
      baseValue: comp.value,
      baseOn: comp.baseOn,
      calculatedAmount: value,
    });
    fixedTotal += value;
  });

  let basicPercentTotal = 0;
  basicPercentComponents.forEach((comp) => {
    const value = Math.round((basicSalary * parseFloat(comp.value)) / 100);
    earnings.push({
      componentName: comp.name,
      componentType: comp.type,
      baseValue: comp.value,
      baseOn: comp.baseOn,
      calculatedAmount: value,
    });
    basicPercentTotal += value;
  });

  // Calculate gross salary considering gross-based components (circular dependency resolution)
  const grossPercentSum = grossPercentComponents.reduce(
    (sum, comp) => sum + parseFloat(comp.value) / 100,
    0
  );

  const baseAmount = fixedTotal + basicPercentTotal;
  if (grossPercentSum >= 1) {
    grossSalary = baseAmount;
  } else {
    grossSalary = Math.round(baseAmount / (1 - grossPercentSum));
  }

  // Calculate gross-based components
  grossPercentComponents.forEach((comp) => {
    const value = Math.round((grossSalary * parseFloat(comp.value)) / 100);
    earnings.push({
      componentName: comp.name,
      componentType: comp.type,
      baseValue: comp.value,
      baseOn: comp.baseOn,
      calculatedAmount: value,
    });
  });

  // Calculate deductions
  const deductions: ComponentCalculation[] = [];
  let totalDeductions = 0;

  salaryInfo.deductions.forEach((comp) => {
    let value = 0;
    if (comp.type === "Fixed") {
      value = parseFloat(comp.value);
    } else if (comp.type === "%") {
      const base = comp.baseOn === "Basic" ? basicSalary : grossSalary;
      value = Math.round((base * parseFloat(comp.value)) / 100);
    }

    deductions.push({
      componentName: comp.name,
      componentType: comp.type,
      baseValue: comp.value,
      baseOn: comp.baseOn,
      calculatedAmount: value,
    });
    totalDeductions += value;
  });

  // Calculate employer contributions
  const employerContributions: ComponentCalculation[] = [];

  salaryInfo.employerContributions.forEach((comp) => {
    let value = 0;
    if (comp.type === "Fixed") {
      value = parseFloat(comp.value);
    } else if (comp.type === "%") {
      const base = comp.baseOn === "Basic" ? basicSalary : grossSalary;
      value = Math.round((base * parseFloat(comp.value)) / 100);
    }

    employerContributions.push({
      componentName: comp.name,
      componentType: comp.type,
      baseValue: comp.value,
      baseOn: comp.baseOn,
      calculatedAmount: value,
    });
  });

  const netSalary = grossSalary - totalDeductions;

  return {
    basicSalary,
    earnings,
    grossSalary,
    deductions,
    employerContributions,
    totalDeductions,
    netSalary,
    daysWorked: paidDays,
    daysInMonth: totalDays,
    proratedSalary: isProratedSalary,
    adjustments: [],
  };
}

/**
 * Validate employee data completeness
 */
export function validateEmployeeData(employee: Employee): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // Check personal info
  if (!employee.personalInfo.fullName) missingFields.push("Full Name");
  if (!employee.personalInfo.dateOfBirth) missingFields.push("Date of Birth");
  if (!employee.personalInfo.contactInfo.email) missingFields.push("Email");
  if (!employee.personalInfo.contactInfo.phone) missingFields.push("Phone");

  // Check employment info
  if (!employee.employmentInfo.department) missingFields.push("Department");
  if (!employee.employmentInfo.designation) missingFields.push("Designation");
  if (!employee.employmentInfo.role) missingFields.push("Role");
  if (!employee.employmentInfo.dateOfJoining) missingFields.push("Date of Joining");

  // Check salary info
  if (!employee.salaryInfo.salaryStructureId) missingFields.push("Salary Structure");
  if (employee.salaryInfo.basicSalary <= 0) missingFields.push("Basic Salary");

  // Check bank details
  if (!employee.salaryInfo.bankDetails.accountNumber)
    missingFields.push("Bank Account Number");
  if (!employee.salaryInfo.bankDetails.ifscCode) missingFields.push("IFSC Code");

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Sync employee salary changes to all related records
 */
export function syncSalaryChanges(
  employeeId: string,
  newSalaryInfo: Employee["salaryInfo"],
  payrollRuns: PayrollRun[]
): PayrollRun[] {
  // Update any pending payroll runs with new salary info
  return payrollRuns.map((run) => {
    if (run.status === "Draft" || run.status === "Processing") {
      const updatedEmployees = run.employees.map((emp) => {
        if (emp.employeeId === employeeId) {
          // Recalculate salary with new info
          // This would typically call calculateSalaryFromAttendance
          return { ...emp };
        }
        return emp;
      });
      return { ...run, employees: updatedEmployees };
    }
    return run;
  });
}

/**
 * Generate attendance records for a month with weekly offs and holidays
 */
export function generateMonthlyAttendanceTemplate(
  employee: Employee,
  month: number,
  year: number,
  publicHolidays: { date: string; name: string }[]
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];

    const isSunday = date.getDay() === 0;
    const holiday = publicHolidays.find((h) => h.date === dateStr);

    const record: AttendanceRecord = {
      id: `att-${employee.id}-${dateStr}`,
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.personalInfo.fullName,
      date: dateStr,
      day: dayName,
      attendanceType: isSunday ? "WOFF" : holiday ? "PH" : "P",
      inTime: isSunday || holiday ? null : "09:00",
      outTime: isSunday || holiday ? null : "18:00",
      workingHours: isSunday || holiday ? 0 : employee.employmentInfo.workingHoursPerDay,
      lateComingCount: 0,
      autoLogoutCount: 0,
      isSunday,
      isPublicHoliday: !!holiday,
      publicHolidayName: holiday?.name,
      overtimeHours: 0,
    };

    records.push(record);
  }

  return records;
}

/**
 * Calculate leave deductions based on leave policy
 */
export function calculateLeaveDeductions(
  casualLeave: number,
  sickLeave: number,
  lwp: number,
  lateCount: number,
  autoLogoutCount: number
): {
  totalDeduction: number;
  breakdown: { type: string; count: number; deduction: number }[];
} {
  const breakdown: { type: string; count: number; deduction: number }[] = [];

  // Late coming: 3 lates = 0.5 day
  const lateDeduction = Math.floor(lateCount / 3) * 0.5;
  if (lateDeduction > 0) {
    breakdown.push({
      type: "Late Coming",
      count: lateCount,
      deduction: lateDeduction,
    });
  }

  // Auto logout: 1 = 0.5 day
  const autoLogoutDeduction = autoLogoutCount * 0.5;
  if (autoLogoutDeduction > 0) {
    breakdown.push({
      type: "Auto Logout",
      count: autoLogoutCount,
      deduction: autoLogoutDeduction,
    });
  }

  // LWP: 1 = 1 day
  if (lwp > 0) {
    breakdown.push({
      type: "Leave Without Pay",
      count: lwp,
      deduction: lwp,
    });
  }

  const totalDeduction = lateDeduction + autoLogoutDeduction + lwp;

  return { totalDeduction, breakdown };
}

/**
 * Export data for external systems
 */
export function exportToPayrollSystem(payrollRun: PayrollRun): {
  format: "csv" | "json" | "excel";
  data: any;
} {
  // Convert payroll run to export format
  const exportData = {
    runId: payrollRun.id,
    runName: payrollRun.runName,
    month: payrollRun.month,
    year: payrollRun.year,
    employees: payrollRun.employees.map((emp) => ({
      employeeCode: emp.employeeCode,
      employeeName: emp.employeeName,
      department: emp.department,
      designation: emp.designation,
      daysWorked: emp.salaryCalculation.daysWorked,
      basicSalary: emp.salaryCalculation.basicSalary,
      grossSalary: emp.salaryCalculation.grossSalary,
      deductions: emp.salaryCalculation.totalDeductions,
      netSalary: emp.salaryCalculation.netSalary,
      earnings: emp.salaryCalculation.earnings,
      deductionDetails: emp.salaryCalculation.deductions,
    })),
  };

  return {
    format: "json",
    data: exportData,
  };
}
