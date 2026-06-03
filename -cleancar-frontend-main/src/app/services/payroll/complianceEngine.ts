/**
 * Compliance Engine - Statutory Calculation Layer
 *
 * Calculates PF, ESI, LWF, PT, TDS based on state rules and salary structure.
 * Provides validation and compliance status for payroll entries.
 *
 * NON-DISRUPTIVE: Works alongside existing salary structure without breaking UI
 */

import type { IndianState, ComplianceRules } from "./complianceRules";
import { getStateRules } from "./complianceRules";

// ========== SALARY STRUCTURE ==========

/**
 * Minimal salary structure for compliance calculations
 * Maps to existing payroll forms without requiring changes
 */
export interface SalaryStructure {
  basic: number;
  hra: number;
  conveyance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowances: number;
}

// ========== COMPLIANCE RESULTS ==========

export interface StatutoryDeductions {
  pf: {
    applicable: boolean;
    employee: number;
    employer: number;
    reason?: string;
  };
  esi: {
    applicable: boolean;
    employee: number;
    employer: number;
    reason?: string;
  };
  lwf: {
    applicable: boolean;
    employee: number;
    employer: number;
    frequency: "monthly" | "yearly" | "half-yearly";
    reason?: string;
  };
  pt: {
    applicable: boolean;
    amount: number;
    reason?: string;
  };
  tds: {
    applicable: boolean;
    monthly: number;
    annual: number;
    reason?: string;
  };
}

export interface ComplianceStatus {
  status: "compliant" | "warning" | "non-compliant";
  errors: string[];
  warnings: string[];
  deductions: StatutoryDeductions;
}

// ========== CALCULATION ENGINE ==========

/**
 * Calculate all statutory deductions for a salary structure
 *
 * @param state - Employee's state
 * @param salary - Salary structure
 * @param annualCtc - Optional: For TDS calculation (defaults to monthly * 12)
 * @returns Complete compliance status with deductions
 */
export function calculateStatutoryDeductions(
  state: IndianState,
  salary: SalaryStructure,
  annualCtc?: number
): ComplianceStatus {
  const rules = getStateRules(state);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Calculate gross salary
  const grossSalary =
    salary.basic +
    salary.hra +
    salary.conveyance +
    salary.medicalAllowance +
    salary.specialAllowance +
    salary.otherAllowances;

  // Calculate PF
  const pf = calculatePF(rules, salary.basic, grossSalary);
  if (pf.applicable && salary.basic === 0) {
    errors.push("Basic salary required for PF calculation");
  }

  // Calculate ESI
  const esi = calculateESI(rules, grossSalary);

  // Calculate LWF
  const lwf = calculateLWF(rules, grossSalary);

  // Calculate PT
  const pt = calculatePT(rules, grossSalary);

  // Calculate TDS
  const annual = annualCtc || grossSalary * 12;
  const tds = calculateTDS(rules, annual);

  // Validation checks
  if (pf.applicable && esi.applicable) {
    warnings.push(
      "Both PF and ESI are applicable. Verify employee eligibility."
    );
  }

  if (salary.basic === 0 && grossSalary > 0) {
    errors.push("Basic salary cannot be zero when other components exist");
  }

  if (salary.basic > grossSalary * 0.7) {
    warnings.push("Basic salary exceeds 70% of gross. This may affect tax optimization.");
  }

  // Determine overall status
  let status: "compliant" | "warning" | "non-compliant" = "compliant";
  if (errors.length > 0) {
    status = "non-compliant";
  } else if (warnings.length > 0) {
    status = "warning";
  }

  return {
    status,
    errors,
    warnings,
    deductions: {
      pf,
      esi,
      lwf,
      pt,
      tds,
    },
  };
}

/**
 * Calculate EPF (Employee Provident Fund)
 *
 * Rule: 12% employee + 12% employer on basic (capped at threshold)
 * Applicable when basic <= threshold
 */
function calculatePF(
  rules: ComplianceRules,
  basic: number,
  gross: number
): StatutoryDeductions["pf"] {
  if (!rules.pf.enabled) {
    return {
      applicable: false,
      employee: 0,
      employer: 0,
      reason: "PF not enabled in this state",
    };
  }

  // PF applies when basic <= threshold OR if already enrolled
  const applicableBasic = Math.min(basic, rules.pf.threshold);

  if (basic > rules.pf.threshold) {
    return {
      applicable: true,
      employee: Math.round(applicableBasic * rules.pf.employeeRate),
      employer: Math.round(applicableBasic * rules.pf.employerRate),
      reason: `Basic capped at ₹${rules.pf.threshold} for PF calculation`,
    };
  }

  return {
    applicable: true,
    employee: Math.round(basic * rules.pf.employeeRate),
    employer: Math.round(basic * rules.pf.employerRate),
  };
}

/**
 * Calculate ESI (Employee State Insurance)
 *
 * Rule: 0.75% employee + 3.25% employer on gross
 * Applicable when gross <= threshold
 */
function calculateESI(
  rules: ComplianceRules,
  gross: number
): StatutoryDeductions["esi"] {
  if (!rules.esi.enabled) {
    return {
      applicable: false,
      employee: 0,
      employer: 0,
      reason: "ESI not enabled in this state",
    };
  }

  if (gross > rules.esi.threshold) {
    return {
      applicable: false,
      employee: 0,
      employer: 0,
      reason: `Gross salary exceeds ESI threshold of ₹${rules.esi.threshold}`,
    };
  }

  return {
    applicable: true,
    employee: Math.round(gross * rules.esi.employeeRate),
    employer: Math.round(gross * rules.esi.employerRate),
  };
}

/**
 * Calculate LWF (Labour Welfare Fund)
 *
 * Rule: Flat amount per frequency (state-specific)
 */
function calculateLWF(
  rules: ComplianceRules,
  gross: number
): StatutoryDeductions["lwf"] {
  if (!rules.lwf.enabled) {
    return {
      applicable: false,
      employee: 0,
      employer: 0,
      frequency: "yearly",
      reason: "LWF not applicable in this state",
    };
  }

  // Convert to monthly equivalent for display
  let monthlyEmployee = rules.lwf.employeeAmount;
  let monthlyEmployer = rules.lwf.employerAmount;

  if (rules.lwf.frequency === "half-yearly") {
    monthlyEmployee = Math.round(rules.lwf.employeeAmount / 6);
    monthlyEmployer = Math.round(rules.lwf.employerAmount / 6);
  } else if (rules.lwf.frequency === "yearly") {
    monthlyEmployee = Math.round(rules.lwf.employeeAmount / 12);
    monthlyEmployer = Math.round(rules.lwf.employerAmount / 12);
  }

  return {
    applicable: true,
    employee: monthlyEmployee,
    employer: monthlyEmployer,
    frequency: rules.lwf.frequency,
    reason: `Deducted ${rules.lwf.frequency}`,
  };
}

/**
 * Calculate PT (Professional Tax)
 *
 * Rule: Slab-based on gross salary (state-specific)
 */
function calculatePT(
  rules: ComplianceRules,
  gross: number
): StatutoryDeductions["pt"] {
  if (!rules.pt.enabled) {
    return {
      applicable: false,
      amount: 0,
      reason: "Professional Tax not applicable in this state",
    };
  }

  // Find applicable slab
  for (const slab of rules.pt.slabs) {
    if (gross >= slab.min && gross <= slab.max) {
      return {
        applicable: slab.amount > 0,
        amount: slab.amount,
        reason: slab.amount === 0 ? "Below PT threshold" : undefined,
      };
    }
  }

  // Fallback to highest slab
  const highestSlab = rules.pt.slabs[rules.pt.slabs.length - 1];
  return {
    applicable: true,
    amount: highestSlab?.amount || 0,
  };
}

/**
 * Calculate TDS (Tax Deducted at Source)
 *
 * Rule: Progressive slabs on annual income after deductions
 */
function calculateTDS(
  rules: ComplianceRules,
  annualGross: number
): StatutoryDeductions["tds"] {
  if (!rules.tds.enabled) {
    return {
      applicable: false,
      monthly: 0,
      annual: 0,
      reason: "TDS not enabled",
    };
  }

  // Apply standard deduction
  const taxableIncome = annualGross - rules.tds.standardDeduction;

  if (taxableIncome <= rules.tds.threshold) {
    return {
      applicable: false,
      monthly: 0,
      annual: 0,
      reason: `Annual income below tax threshold of ₹${rules.tds.threshold}`,
    };
  }

  // Calculate tax by slabs
  let totalTax = 0;
  let remainingIncome = taxableIncome;

  for (let i = 0; i < rules.tds.slabs.length; i++) {
    const slab = rules.tds.slabs[i];
    const nextSlab = rules.tds.slabs[i + 1];

    if (remainingIncome <= 0) break;

    const slabMax = nextSlab ? nextSlab.min - 1 : Infinity;
    const taxableInSlab = Math.min(
      remainingIncome,
      slabMax - slab.min + 1
    );

    totalTax += taxableInSlab * slab.rate;
    remainingIncome -= taxableInSlab;
  }

  return {
    applicable: true,
    monthly: Math.round(totalTax / 12),
    annual: Math.round(totalTax),
  };
}

/**
 * Validate salary structure against compliance rules
 *
 * @param state - Employee's state
 * @param salary - Salary structure to validate
 * @returns Array of validation errors
 */
export function validateSalaryStructure(
  state: IndianState,
  salary: SalaryStructure
): string[] {
  const errors: string[] = [];
  const rules = getStateRules(state);

  const gross =
    salary.basic +
    salary.hra +
    salary.conveyance +
    salary.medicalAllowance +
    salary.specialAllowance +
    salary.otherAllowances;

  // Basic validations
  if (salary.basic <= 0) {
    errors.push("Basic salary must be greater than zero");
  }

  if (gross <= 0) {
    errors.push("Total gross salary must be greater than zero");
  }

  if (salary.basic > gross) {
    errors.push("Basic salary cannot exceed gross salary");
  }

  // Statutory validations
  if (rules.pf.enabled && salary.basic > rules.pf.threshold * 1.5) {
    errors.push(
      `High basic salary (₹${salary.basic}). Consider restructuring to optimize PF contribution.`
    );
  }

  if (rules.esi.enabled && gross > rules.esi.threshold && gross < rules.esi.threshold * 1.1) {
    errors.push(
      `Gross salary slightly exceeds ESI limit. Employee will lose ESI benefits.`
    );
  }

  return errors;
}

/**
 * Get compliance summary for display
 *
 * @param status - Compliance status
 * @returns Human-readable summary
 */
export function getComplianceSummary(status: ComplianceStatus): string {
  const { deductions } = status;
  const applicable: string[] = [];

  if (deductions.pf.applicable) applicable.push("PF");
  if (deductions.esi.applicable) applicable.push("ESI");
  if (deductions.lwf.applicable) applicable.push("LWF");
  if (deductions.pt.applicable) applicable.push("PT");
  if (deductions.tds.applicable) applicable.push("TDS");

  if (applicable.length === 0) {
    return "No statutory deductions applicable";
  }

  return `Applicable: ${applicable.join(", ")}`;
}
