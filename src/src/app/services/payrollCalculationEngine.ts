/**
 * Advanced Payroll Calculation Engine
 * Config-driven, shift-aware, dynamic calculation system
 */

import {
  SALARY_COMPONENT_REGISTRY,
  getComponentsByCategory,
  type SalaryComponent,
  type ProrationConfig,
  type ComponentCategory,
} from "../config/salaryComponentConfiguration";
import { STATUTORY_RULES } from "../constants/payrollConstants";
import type { AttendanceSummary } from "./payrollService";

// ==================== CALCULATION RESULT TYPES ====================

export interface CalculatedComponent {
  componentId: string;
  name: string;
  shortCode: string;
  category: ComponentCategory;
  type: string;
  actualFixAmount: number; // Full amount before proration
  finalAmount: number; // After proration (if applicable)
  formula: string;
  tooltip: string;
  isEditable: boolean;
  isProrated: boolean;
}

export interface PayrollCalculationResult {
  basicSalary: number;
  prorationConfig: ProrationConfig;
  components: {
    earningFixed: CalculatedComponent[];
    earningVariable: CalculatedComponent[];
    deductions: CalculatedComponent[];
    companyContribution: CalculatedComponent[];
  };
  totals: {
    earningsFixed: number;
    earningsVariable: number;
    totalEarnings: number;
    totalDeductions: number;
    netPay: number;
    companyContribution: number;
    ctc: number;
  };
  fullSalaryTotals: {
    // Before proration
    totalEarnings: number;
    netPay: number;
  };
}

export interface ManualInputs {
  bonus?: number;
  incentive?: number;
  overtime?: number;
  advance?: number;
  loan?: number;
  [key: string]: number | undefined;
}

// ==================== CALCULATION ENGINE ====================

export class PayrollCalculationEngine {
  private basicSalary: number;
  private prorationConfig: ProrationConfig;
  private manualInputs: ManualInputs;
  private attendanceSummary: AttendanceSummary;
  private totalDaysInMonth: number;

  constructor(
    basicSalary: number,
    prorationConfig: ProrationConfig,
    attendanceSummary: AttendanceSummary,
    totalDaysInMonth: number,
    manualInputs: ManualInputs = {}
  ) {
    this.basicSalary = basicSalary;
    this.prorationConfig = prorationConfig;
    this.manualInputs = manualInputs;
    this.attendanceSummary = attendanceSummary;
    this.totalDaysInMonth = totalDaysInMonth;
  }

  /**
   * Main calculation method - calculates full salary then applies proration
   */
  calculate(): PayrollCalculationResult {
    // Step 1: Calculate all components at FULL SHIFT level
    const fullSalaryComponents = this.calculateFullSalaryComponents();

    // Step 2: Apply proration factor at FINAL STAGE
    const proratedComponents = this.applyProrationToComponents(fullSalaryComponents);

    // Step 3: Calculate totals
    const totals = this.calculateTotals(proratedComponents);
    const fullSalaryTotals = this.calculateFullSalaryTotals(fullSalaryComponents);

    return {
      basicSalary: this.basicSalary,
      prorationConfig: this.prorationConfig,
      components: {
        earningFixed: proratedComponents.filter((c) => c.category === "earning_fixed"),
        earningVariable: proratedComponents.filter((c) => c.category === "earning_variable"),
        deductions: proratedComponents.filter((c) => c.category === "deduction"),
        companyContribution: proratedComponents.filter(
          (c) => c.category === "company_contribution"
        ),
      },
      totals,
      fullSalaryTotals,
    };
  }

  /**
   * Calculate all components based on full shift
   */
  private calculateFullSalaryComponents(): CalculatedComponent[] {
    const components: CalculatedComponent[] = [];

    // Get all active components
    const activeComponents = SALARY_COMPONENT_REGISTRY.filter((comp) => comp.isActive);

    // Calculate gross for percentage-based calculations
    let grossSalary = 0;

    // First pass: Calculate all non-gross-dependent components
    for (const config of activeComponents) {
      if (config.base !== "gross") {
        const calculated = this.calculateComponent(config, grossSalary);
        components.push(calculated);

        // Add to gross if it's an earning
        if (
          config.category === "earning_fixed" ||
          config.category === "earning_variable"
        ) {
          grossSalary += calculated.actualFixAmount;
        }
      }
    }

    // Second pass: Calculate gross-dependent components
    for (const config of activeComponents) {
      if (config.base === "gross") {
        const calculated = this.calculateComponent(config, grossSalary);
        components.push(calculated);
      }
    }

    return components;
  }

  /**
   * Calculate individual component
   */
  private calculateComponent(
    config: SalaryComponent,
    currentGross: number
  ): CalculatedComponent {
    let actualFixAmount = 0;
    let formula = "";
    let tooltip = config.tooltip || "";

    switch (config.type) {
      case "manual":
        if (config.id === "comp_basic") {
          actualFixAmount = this.basicSalary;
          formula = "Entered by HR";
        } else {
          actualFixAmount = this.manualInputs[config.shortCode.toLowerCase()] || 0;
          formula = actualFixAmount > 0 ? "Manual entry" : "Not entered";
        }
        break;

      case "percentage":
        if (config.base === "basic") {
          actualFixAmount = (this.basicSalary * config.value) / 100;
          formula = `${config.value}% of Basic = ₹${this.basicSalary} × ${config.value / 100}`;
        } else if (config.base === "gross") {
          actualFixAmount = (currentGross * config.value) / 100;
          formula = `${config.value}% of Gross = ₹${currentGross.toFixed(2)} × ${config.value / 100}`;
        }
        break;

      case "fixed":
        actualFixAmount = config.value;
        formula = `Fixed amount: ₹${config.value}`;
        break;

      case "rule_based":
        actualFixAmount = this.calculateRuleBased(config, currentGross);
        formula = this.getRuleBasedFormula(config, currentGross);
        break;
    }

    return {
      componentId: config.id,
      name: config.name,
      shortCode: config.shortCode,
      category: config.category,
      type: config.type,
      actualFixAmount,
      finalAmount: actualFixAmount, // Will be updated with proration
      formula,
      tooltip,
      isEditable: config.type === "manual" && config.id !== "comp_basic",
      isProrated: config.isProrated,
    };
  }

  /**
   * Calculate rule-based components (EPF, ESIC, PT, Attendance Deduction)
   */
  private calculateRuleBased(config: SalaryComponent, currentGross: number): number {
    switch (config.id) {
      case "comp_epf": {
        // EPF: 12% of basic (capped at ₹15,000 basic)
        const cappedBasic = Math.min(this.basicSalary, 15000);
        return (cappedBasic * STATUTORY_RULES.EPF_PERCENTAGE) / 100;
      }

      case "comp_esic": {
        // ESIC: 0.75% of gross (only if gross ≤ ₹21,000)
        if (currentGross <= STATUTORY_RULES.ESIC_THRESHOLD) {
          return (currentGross * STATUTORY_RULES.ESIC_PERCENTAGE) / 100;
        }
        return 0;
      }

      case "comp_pt": {
        // Professional Tax: Slab-based
        for (const slab of STATUTORY_RULES.PT_SLABS) {
          if (currentGross >= slab.min && currentGross <= slab.max) {
            return slab.amount;
          }
        }
        return 0;
      }

      case "comp_attendance_deduction": {
        // Attendance deduction based on deduction days
        const perDaySalary = this.basicSalary / this.totalDaysInMonth;
        return this.attendanceSummary.deductionDays * perDaySalary;
      }

      case "comp_employer_pf": {
        // Employer PF: 13.61% of basic (capped)
        const cappedBasic = Math.min(this.basicSalary, 15000);
        return (cappedBasic * STATUTORY_RULES.EPF_EMPLOYER_PERCENTAGE) / 100;
      }

      case "comp_employer_esic": {
        // Employer ESIC: 3.25% of gross (only if gross ≤ ₹21,000)
        if (currentGross <= STATUTORY_RULES.ESIC_THRESHOLD) {
          return (currentGross * STATUTORY_RULES.ESIC_EMPLOYER_PERCENTAGE) / 100;
        }
        return 0;
      }

      default:
        return 0;
    }
  }

  /**
   * Get formula string for rule-based components
   */
  private getRuleBasedFormula(config: SalaryComponent, currentGross: number): string {
    switch (config.id) {
      case "comp_epf": {
        const cappedBasic = Math.min(this.basicSalary, 15000);
        return `12% of Basic (capped) = ₹${cappedBasic} × 0.12`;
      }

      case "comp_esic": {
        if (currentGross <= STATUTORY_RULES.ESIC_THRESHOLD) {
          return `0.75% of Gross = ₹${currentGross.toFixed(2)} × 0.0075`;
        }
        return `Not applicable (Gross > ₹${STATUTORY_RULES.ESIC_THRESHOLD})`;
      }

      case "comp_pt": {
        for (const slab of STATUTORY_RULES.PT_SLABS) {
          if (currentGross >= slab.min && currentGross <= slab.max) {
            return `PT Slab: Gross ₹${currentGross.toFixed(2)} → ₹${slab.amount}`;
          }
        }
        return "PT calculation";
      }

      case "comp_attendance_deduction": {
        const perDaySalary = this.basicSalary / this.totalDaysInMonth;
        return `${this.attendanceSummary.deductionDays.toFixed(1)} days × ₹${perDaySalary.toFixed(2)}`;
      }

      case "comp_employer_pf": {
        const cappedBasic = Math.min(this.basicSalary, 15000);
        return `13.61% of Basic (capped) = ₹${cappedBasic} × 0.1361`;
      }

      case "comp_employer_esic": {
        if (currentGross <= STATUTORY_RULES.ESIC_THRESHOLD) {
          return `3.25% of Gross = ₹${currentGross.toFixed(2)} × 0.0325`;
        }
        return `Not applicable (Gross > ₹${STATUTORY_RULES.ESIC_THRESHOLD})`;
      }

      default:
        return "Auto-calculated";
    }
  }

  /**
   * Apply proration factor at FINAL STAGE (KEY PRINCIPLE)
   */
  private applyProrationToComponents(
    components: CalculatedComponent[]
  ): CalculatedComponent[] {
    return components.map((comp) => {
      if (comp.isProrated && this.prorationConfig.prorationFactor < 1) {
        return {
          ...comp,
          finalAmount: comp.actualFixAmount * this.prorationConfig.prorationFactor,
        };
      }
      return comp;
    });
  }

  /**
   * Calculate final totals (after proration)
   */
  private calculateTotals(components: CalculatedComponent[]) {
    const earningsFixed = components
      .filter((c) => c.category === "earning_fixed")
      .reduce((sum, c) => sum + c.finalAmount, 0);

    const earningsVariable = components
      .filter((c) => c.category === "earning_variable")
      .reduce((sum, c) => sum + c.finalAmount, 0);

    const totalEarnings = earningsFixed + earningsVariable;

    const totalDeductions = components
      .filter((c) => c.category === "deduction")
      .reduce((sum, c) => sum + c.finalAmount, 0);

    const companyContribution = components
      .filter((c) => c.category === "company_contribution")
      .reduce((sum, c) => sum + c.finalAmount, 0);

    const netPay = totalEarnings - totalDeductions;
    const ctc = totalEarnings + companyContribution;

    return {
      earningsFixed,
      earningsVariable,
      totalEarnings,
      totalDeductions,
      netPay,
      companyContribution,
      ctc,
    };
  }

  /**
   * Calculate totals before proration (for comparison)
   */
  private calculateFullSalaryTotals(components: CalculatedComponent[]) {
    const totalEarnings = components
      .filter(
        (c) => c.category === "earning_fixed" || c.category === "earning_variable"
      )
      .reduce((sum, c) => sum + c.actualFixAmount, 0);

    const totalDeductions = components
      .filter((c) => c.category === "deduction")
      .reduce((sum, c) => sum + c.actualFixAmount, 0);

    return {
      totalEarnings,
      netPay: totalEarnings - totalDeductions,
    };
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Create default proration config (full-time, full month)
 */
export function createDefaultProrationConfig(): ProrationConfig {
  return {
    type: "none",
    shiftType: "full_time",
    shiftHours: 8,
    fullShiftHours: 8,
    prorationFactor: 1,
  };
}

/**
 * Create part-time proration config (shift-based proration)
 */
export function createPartTimeProrationConfig(
  shiftHours: number,
  fullShiftHours: number = 8
): ProrationConfig {
  return {
    type: "shift_based",
    shiftType: "part_time",
    shiftHours,
    fullShiftHours,
    prorationFactor: shiftHours / fullShiftHours,
  };
}

/**
 * Create mid-month joiner proration config (days-based proration)
 * For employees who join mid-month
 */
export function createMidMonthJoinerProrationConfig(
  dateOfJoining: string,
  totalDaysInMonth: number
): ProrationConfig {
  const joiningDate = new Date(dateOfJoining);
  const joiningDay = joiningDate.getDate();

  // Calculate working days from joining date to end of month
  const workingDays = totalDaysInMonth - joiningDay + 1;

  return {
    type: "days_based",
    shiftType: "full_time",
    shiftHours: 8,
    fullShiftHours: 8,
    prorationFactor: workingDays / totalDaysInMonth,
    workingDays,
    totalDaysInMonth,
    dateOfJoining,
  };
}

/**
 * Create combined proration config (both shift-based and days-based)
 * For part-time employees who also joined mid-month
 */
export function createCombinedProrationConfig(
  shiftHours: number,
  fullShiftHours: number,
  dateOfJoining: string,
  totalDaysInMonth: number
): ProrationConfig {
  const joiningDate = new Date(dateOfJoining);
  const joiningDay = joiningDate.getDate();
  const workingDays = totalDaysInMonth - joiningDay + 1;

  const shiftFactor = shiftHours / fullShiftHours;
  const daysFactor = workingDays / totalDaysInMonth;
  const combinedFactor = shiftFactor * daysFactor;

  return {
    type: "days_based",
    shiftType: "part_time",
    shiftHours,
    fullShiftHours,
    prorationFactor: combinedFactor,
    workingDays,
    totalDaysInMonth,
    dateOfJoining,
  };
}

/**
 * Calculate proration factor for shift-based
 */
export function calculateProrationFactor(
  shiftHours: number,
  fullShiftHours: number
): number {
  return shiftHours / fullShiftHours;
}

/**
 * Calculate proration factor for mid-month joiners
 */
export function calculateMidMonthProrationFactor(
  dateOfJoining: string,
  totalDaysInMonth: number
): number {
  const joiningDate = new Date(dateOfJoining);
  const joiningDay = joiningDate.getDate();
  const workingDays = totalDaysInMonth - joiningDay + 1;
  return workingDays / totalDaysInMonth;
}
