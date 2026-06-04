/**
 * Payroll Auto Engine
 *
 * AI-powered automatic payroll calculation
 * Inputs: Attendance + Incentives + Penalties
 * Outputs: Complete payroll with breakdown
 */

import { DataService } from "./DataService";
import { attendanceMaster } from "./attendanceMaster";
import { otherAdjustmentsService } from "./otherAdjustmentsService";
import { logger } from "./logger";

// ========== TYPES ==========

export interface PayrollInput {
  employeeId: string;
  employeeName: string;
  month: string; // "April"
  year: number;
  cityId: string;
  roleId: string;

  // Salary structure
  baseSalary: number;
  allowances?: Record<string, number>; // HRA, DA, etc.

  // Rate-based (for hourly/daily workers)
  dailyRate?: number;
  hourlyRate?: number;
}

export interface PayrollOutput {
  payrollId: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  generatedAt: string;
  generatedBy: string;

  // Earnings
  earnings: {
    baseSalary: number;
    allowances: Record<string, number>;
    otherEarnings: Record<string, number>; // From OtherEarnings module
    incentives: Record<string, number>;
    overtimePay: number;
    totalEarnings: number;
  };

  // Deductions
  deductions: {
    otherDeductions: Record<string, number>; // From OtherDeductions module
    penalties: Record<string, number>;
    advances: number;
    tax: number;
    totalDeductions: number;
  };

  // Attendance metrics
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    totalHoursWorked: number;
    overtimeHours: number;
  };

  // Final amounts
  grossPay: number;
  netPay: number;

  // Validation
  isValid: boolean;
  validationErrors: string[];
  warnings: string[];

  // Auto-calculated flags
  autoCalculated: boolean;
  calculationNotes: string[];
}

export interface IncentiveRule {
  ruleId: string;
  name: string;
  type: "Performance" | "Attendance" | "Punctuality" | "Sales" | "Custom";
  condition: string;
  amount: number | "percentage";
  percentage?: number;
  enabled: boolean;
}

export interface PenaltyRule {
  ruleId: string;
  name: string;
  type: "Late" | "Absent" | "MissingCheckout" | "Custom";
  condition: string;
  amount: number;
  enabled: boolean;
}

// ========== SERVICE ==========

class PayrollAutoEngine {
  private readonly STORAGE_KEY = "AUTO_PAYROLL_OUTPUTS";
  private readonly INCENTIVE_RULES_KEY = "INCENTIVE_RULES";
  private readonly PENALTY_RULES_KEY = "PENALTY_RULES";

  /**
   * Auto-calculate payroll
   */
  calculatePayroll(input: PayrollInput, generatedBy: string): PayrollOutput {
    const calculationNotes: string[] = [];
    const warnings: string[] = [];
    const validationErrors: string[] = [];

    // 1. Fetch attendance data
    const monthStr = `${input.month} ${input.year}`;
    const attendanceData = this.fetchAttendanceData(input.employeeId, input.month, input.year);

    if (attendanceData.presentDays === 0) {
      warnings.push("No attendance records found for this month");
    }

    // 2. Calculate base earnings
    let baseSalary = input.baseSalary;

    // Pro-rate if absent days
    if (attendanceData.absentDays > 0 && input.baseSalary > 0) {
      const workingDays = attendanceData.totalDays;
      const prorateRatio = attendanceData.presentDays / workingDays;
      baseSalary = Math.round(input.baseSalary * prorateRatio);
      calculationNotes.push(
        `Base salary pro-rated: ${attendanceData.presentDays}/${workingDays} days = ₹${baseSalary}`
      );
    }

    // 3. Calculate overtime pay
    let overtimePay = 0;
    if (attendanceData.overtimeHours > 0) {
      const hourlyRate = input.hourlyRate || (input.baseSalary / (26 * 9)); // 26 days, 9 hours/day
      overtimePay = Math.round(attendanceData.overtimeHours * hourlyRate * 1.5); // 1.5x for OT
      calculationNotes.push(
        `Overtime: ${attendanceData.overtimeHours}h @ ₹${Math.round(hourlyRate * 1.5)}/hr = ₹${overtimePay}`
      );
    }

    // 4. Fetch other earnings (approved)
    const otherEarnings: Record<string, number> = {};
    const earningsRecords = otherAdjustmentsService.getApprovedForPayrollMonth(
      input.employeeId,
      input.month,
      input.year,
      "OtherEarning"
    );

    earningsRecords.forEach(record => {
      otherEarnings[record.category] = record.amount;
      calculationNotes.push(`Other Earning: ${record.category} = ₹${record.amount}`);
    });

    // 5. Calculate incentives
    const incentives = this.calculateIncentives(input, attendanceData);
    Object.entries(incentives).forEach(([name, amount]) => {
      if (amount > 0) {
        calculationNotes.push(`Incentive: ${name} = ₹${amount}`);
      }
    });

    // 6. Calculate total earnings
    const allowancesTotal = Object.values(input.allowances || {}).reduce((a, b) => a + b, 0);
    const otherEarningsTotal = Object.values(otherEarnings).reduce((a, b) => a + b, 0);
    const incentivesTotal = Object.values(incentives).reduce((a, b) => a + b, 0);

    const totalEarnings =
      baseSalary + allowancesTotal + otherEarningsTotal + incentivesTotal + overtimePay;

    // 7. Fetch other deductions (approved)
    const otherDeductions: Record<string, number> = {};
    const deductionsRecords = otherAdjustmentsService.getApprovedForPayrollMonth(
      input.employeeId,
      input.month,
      input.year,
      "OtherDeduction"
    );

    deductionsRecords.forEach(record => {
      otherDeductions[record.category] = record.amount;
      calculationNotes.push(`Other Deduction: ${record.category} = ₹${record.amount}`);
    });

    // 8. Calculate penalties
    const penalties = this.calculatePenalties(input, attendanceData);
    Object.entries(penalties).forEach(([name, amount]) => {
      if (amount > 0) {
        calculationNotes.push(`Penalty: ${name} = ₹${amount}`);
      }
    });

    // 9. Calculate tax (simple 10% on earnings > 50000)
    let tax = 0;
    if (totalEarnings > 50000) {
      tax = Math.round(totalEarnings * 0.1);
      calculationNotes.push(`Tax: 10% of ₹${totalEarnings} = ₹${tax}`);
    }

    // 10. Calculate total deductions
    const otherDeductionsTotal = Object.values(otherDeductions).reduce((a, b) => a + b, 0);
    const penaltiesTotal = Object.values(penalties).reduce((a, b) => a + b, 0);
    const advances = 0; // TODO: Integrate with advance management

    const totalDeductions = otherDeductionsTotal + penaltiesTotal + advances + tax;

    // 11. Calculate net pay
    const grossPay = totalEarnings;
    const netPay = grossPay - totalDeductions;

    // 12. Validation
    if (netPay < 0) {
      validationErrors.push("Net pay is negative - check deductions");
    }

    if (attendanceData.presentDays === 0) {
      validationErrors.push("No attendance records - cannot calculate payroll");
    }

    const payrollOutput: PayrollOutput = {
      payrollId: this.generatePayrollId(input.employeeId, input.month, input.year),
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      month: input.month,
      year: input.year,
      generatedAt: new Date().toISOString(),
      generatedBy,
      earnings: {
        baseSalary,
        allowances: input.allowances || {},
        otherEarnings,
        incentives,
        overtimePay,
        totalEarnings,
      },
      deductions: {
        otherDeductions,
        penalties,
        advances,
        tax,
        totalDeductions,
      },
      attendance: attendanceData,
      grossPay,
      netPay,
      isValid: validationErrors.length === 0,
      validationErrors,
      warnings,
      autoCalculated: true,
      calculationNotes,
    };

    this.savePayrollOutput(payrollOutput);

    logger.log("PayrollAutoEngine: Calculated payroll", {
      employeeId: input.employeeId,
      month: monthStr,
      netPay,
    });

    return payrollOutput;
  }

  /**
   * Batch calculate for all employees
   */
  batchCalculatePayroll(
    inputs: PayrollInput[],
    generatedBy: string
  ): PayrollOutput[] {
    return inputs.map(input => this.calculatePayroll(input, generatedBy));
  }

  /**
   * Get payroll output
   */
  getPayrollOutput(payrollId: string): PayrollOutput | null {
    const outputs = DataService.get<PayrollOutput>(this.STORAGE_KEY);
    return outputs.find(o => o.payrollId === payrollId) || null;
  }

  /**
   * Get all outputs
   */
  getAllOutputs(): PayrollOutput[] {
    return DataService.get<PayrollOutput>(this.STORAGE_KEY);
  }

  /**
   * Get outputs by employee
   */
  getByEmployee(employeeId: string): PayrollOutput[] {
    return this.getAllOutputs().filter(o => o.employeeId === employeeId);
  }

  /**
   * Get outputs by month
   */
  getByMonth(month: string, year: number): PayrollOutput[] {
    return this.getAllOutputs().filter(o => o.month === month && o.year === year);
  }

  // ========== INCENTIVE MANAGEMENT ==========

  /**
   * Get incentive rules
   */
  getIncentiveRules(): IncentiveRule[] {
    return DataService.get<IncentiveRule>(this.INCENTIVE_RULES_KEY);
  }

  /**
   * Add incentive rule
   */
  addIncentiveRule(rule: Omit<IncentiveRule, "ruleId">): IncentiveRule {
    const newRule: IncentiveRule = {
      ...rule,
      ruleId: `INC-${Date.now()}`,
    };

    const rules = this.getIncentiveRules();
    DataService.setAll(this.INCENTIVE_RULES_KEY, [...rules, newRule]);

    return newRule;
  }

  // ========== PENALTY MANAGEMENT ==========

  /**
   * Get penalty rules
   */
  getPenaltyRules(): PenaltyRule[] {
    return DataService.get<PenaltyRule>(this.PENALTY_RULES_KEY);
  }

  /**
   * Add penalty rule
   */
  addPenaltyRule(rule: Omit<PenaltyRule, "ruleId">): PenaltyRule {
    const newRule: PenaltyRule = {
      ...rule,
      ruleId: `PEN-${Date.now()}`,
    };

    const rules = this.getPenaltyRules();
    DataService.setAll(this.PENALTY_RULES_KEY, [...rules, newRule]);

    return newRule;
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Fetch attendance data
   */
  private fetchAttendanceData(employeeId: string, month: string, year: number) {
    const monthStr = `${year}-${String(this.getMonthNumber(month)).padStart(2, '0')}`;
    const records = attendanceMaster.getByMonth(employeeId, monthStr);

    const presentDays = records.filter(r => r.status === "Present").length;
    const absentDays = records.filter(r => r.status === "Absent").length;
    const halfDays = records.filter(r => r.status === "Half Day").length;
    const lateDays = records.filter(r => r.lateMinutes && r.lateMinutes > 15).length;

    const totalHoursWorked = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    const overtimeHours = records.reduce((sum, r) => sum + ((r.overtimeMinutes || 0) / 60), 0);

    return {
      totalDays: this.getDaysInMonth(month, year),
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
    };
  }

  /**
   * Calculate incentives
   */
  private calculateIncentives(
    input: PayrollInput,
    attendance: ReturnType<typeof this.fetchAttendanceData>
  ): Record<string, number> {
    const incentives: Record<string, number> = {};
    const rules = this.getIncentiveRules().filter(r => r.enabled);

    rules.forEach(rule => {
      let shouldApply = false;
      let amount = 0;

      switch (rule.type) {
        case "Attendance":
          // 100% attendance bonus
          if (attendance.absentDays === 0 && attendance.presentDays >= 26) {
            shouldApply = true;
            amount = rule.amount === "percentage"
              ? Math.round(input.baseSalary * (rule.percentage || 0) / 100)
              : rule.amount;
          }
          break;

        case "Punctuality":
          // No late days bonus
          if (attendance.lateDays === 0 && attendance.presentDays >= 20) {
            shouldApply = true;
            amount = rule.amount === "percentage"
              ? Math.round(input.baseSalary * (rule.percentage || 0) / 100)
              : rule.amount;
          }
          break;

        case "Performance":
          // Placeholder - would need performance metrics
          break;
      }

      if (shouldApply && amount > 0) {
        incentives[rule.name] = amount;
      }
    });

    return incentives;
  }

  /**
   * Calculate penalties
   */
  private calculatePenalties(
    input: PayrollInput,
    attendance: ReturnType<typeof this.fetchAttendanceData>
  ): Record<string, number> {
    const penalties: Record<string, number> = {};
    const rules = this.getPenaltyRules().filter(r => r.enabled);

    rules.forEach(rule => {
      let amount = 0;

      switch (rule.type) {
        case "Absent":
          if (attendance.absentDays > 0) {
            amount = rule.amount * attendance.absentDays;
          }
          break;

        case "Late":
          if (attendance.lateDays > 0) {
            amount = rule.amount * attendance.lateDays;
          }
          break;

        case "MissingCheckout":
          // Would need to fetch from attendance flags
          break;
      }

      if (amount > 0) {
        penalties[rule.name] = amount;
      }
    });

    return penalties;
  }

  /**
   * Get month number
   */
  private getMonthNumber(month: string): number {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months.indexOf(month) + 1;
  }

  /**
   * Get days in month
   */
  private getDaysInMonth(month: string, year: number): number {
    const monthNum = this.getMonthNumber(month);
    return new Date(year, monthNum, 0).getDate();
  }

  /**
   * Generate payroll ID
   */
  private generatePayrollId(employeeId: string, month: string, year: number): string {
    return `PAY-${employeeId}-${month.toUpperCase()}-${year}`;
  }

  /**
   * Save payroll output
   */
  private savePayrollOutput(output: PayrollOutput): void {
    const outputs = this.getAllOutputs();
    const index = outputs.findIndex(o => o.payrollId === output.payrollId);

    if (index >= 0) {
      outputs[index] = output;
    } else {
      outputs.push(output);
    }

    DataService.setAll(this.STORAGE_KEY, outputs);
  }
}

// ========== EXPORT ==========

export const payrollAutoEngine = new PayrollAutoEngine();
