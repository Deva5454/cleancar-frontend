/**
 * Tax Optimization Engine
 *
 * Analyzes salary structures and suggests tax-saving optimizations
 * Compares Old vs New tax regime
 * Identifies restructuring opportunities
 *
 * NON-DISRUPTIVE: Suggestion layer only - does not modify actual payroll
 */

import type { SalaryStructure } from "./complianceEngine";
import type { IndianState } from "./complianceRules";
import { calculateStatutoryDeductions } from "./complianceEngine";

// ========== TAX REGIME TYPES ==========

export type TaxRegime = "old" | "new";

export interface TaxRegimeComparison {
  oldRegime: {
    taxableIncome: number;
    deductions: number;
    taxPayable: number;
    takeHome: number;
  };
  newRegime: {
    taxableIncome: number;
    deductions: number;
    taxPayable: number;
    takeHome: number;
  };
  recommendation: {
    betterRegime: TaxRegime;
    savings: number;
    reason: string;
  };
}

export interface SalaryOptimization {
  current: {
    gross: number;
    netTakeHome: number;
    taxPayable: number;
  };
  optimized: {
    gross: number;
    netTakeHome: number;
    taxPayable: number;
    structure: SalaryStructure;
  };
  savings: {
    monthly: number;
    annual: number;
  };
  suggestions: Array<{
    component: string;
    current: number;
    suggested: number;
    impact: number;
    reason: string;
  }>;
}

// ========== TAX SLABS ==========

/**
 * Old Tax Regime Slabs (with deductions)
 */
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250001, max: 500000, rate: 0.05 },
  { min: 500001, max: 1000000, rate: 0.2 },
  { min: 1000001, max: Infinity, rate: 0.3 },
];

/**
 * New Tax Regime Slabs (no deductions)
 */
const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300001, max: 600000, rate: 0.05 },
  { min: 600001, max: 900000, rate: 0.1 },
  { min: 900001, max: 1200000, rate: 0.15 },
  { min: 1200001, max: 1500000, rate: 0.2 },
  { min: 1500001, max: Infinity, rate: 0.3 },
];

/**
 * Tax exemptions available in Old Regime
 */
const OLD_REGIME_EXEMPTIONS = {
  standardDeduction: 50000,
  hra: 0.5, // 50% of HRA is exempt
  section80C: 150000, // Max PF + other investments
  section80D: 25000, // Health insurance
  nps: 50000, // NPS additional deduction
};

// ========== TAX CALCULATION ==========

/**
 * Calculate tax under Old Regime (with deductions)
 */
function calculateOldRegimeTax(
  annualGross: number,
  salary: SalaryStructure,
  pfContribution: number
): { taxableIncome: number; taxPayable: number; deductions: number } {
  const annualHRA = salary.hra * 12;

  // Calculate total deductions
  let deductions = 0;
  deductions += OLD_REGIME_EXEMPTIONS.standardDeduction; // Standard deduction
  deductions += Math.min(annualHRA * OLD_REGIME_EXEMPTIONS.hra, 100000); // HRA exemption (capped)
  deductions += Math.min(pfContribution * 12, OLD_REGIME_EXEMPTIONS.section80C); // PF under 80C

  const taxableIncome = Math.max(0, annualGross - deductions);

  // Calculate tax
  let tax = 0;
  let remaining = taxableIncome;

  for (let i = 0; i < OLD_REGIME_SLABS.length; i++) {
    const slab = OLD_REGIME_SLABS[i];
    const nextSlab = OLD_REGIME_SLABS[i + 1];

    if (remaining <= 0) break;

    const slabMax = nextSlab ? nextSlab.min - 1 : Infinity;
    const taxableInSlab = Math.min(remaining, slabMax - slab.min + 1);

    tax += taxableInSlab * slab.rate;
    remaining -= taxableInSlab;
  }

  return {
    taxableIncome,
    taxPayable: Math.round(tax),
    deductions: Math.round(deductions),
  };
}

/**
 * Calculate tax under New Regime (no deductions)
 */
function calculateNewRegimeTax(annualGross: number): {
  taxableIncome: number;
  taxPayable: number;
  deductions: number;
} {
  const taxableIncome = annualGross;

  // Calculate tax
  let tax = 0;
  let remaining = taxableIncome;

  for (let i = 0; i < NEW_REGIME_SLABS.length; i++) {
    const slab = NEW_REGIME_SLABS[i];
    const nextSlab = NEW_REGIME_SLABS[i + 1];

    if (remaining <= 0) break;

    const slabMax = nextSlab ? nextSlab.min - 1 : Infinity;
    const taxableInSlab = Math.min(remaining, slabMax - slab.min + 1);

    tax += taxableInSlab * slab.rate;
    remaining -= taxableInSlab;
  }

  return {
    taxableIncome,
    taxPayable: Math.round(tax),
    deductions: 0, // New regime doesn't allow deductions
  };
}

/**
 * Compare Old vs New tax regime for a salary structure
 *
 * @param state - Employee's state
 * @param salary - Salary structure
 * @param annualCtc - Optional: Annual CTC (defaults to monthly gross * 12)
 * @returns Comparison of both regimes with recommendation
 */
export function compareTaxRegimes(
  state: IndianState,
  salary: SalaryStructure,
  annualCtc?: number
): TaxRegimeComparison {
  const monthlyGross =
    salary.basic +
    salary.hra +
    salary.conveyance +
    salary.medicalAllowance +
    salary.specialAllowance +
    salary.otherAllowances;

  const annualGross = annualCtc || monthlyGross * 12;

  // Get statutory deductions
  const compliance = calculateStatutoryDeductions(state, salary, annualGross);
  const monthlyPF = compliance.deductions.pf.employee;
  const monthlyPT = compliance.deductions.pt.amount;
  const monthlyESI = compliance.deductions.esi.employee;
  const monthlyLWF = compliance.deductions.lwf.employee;

  const annualStatutoryDeductions =
    (monthlyPF + monthlyPT + monthlyESI + monthlyLWF) * 12;

  // Calculate Old Regime
  const oldRegime = calculateOldRegimeTax(annualGross, salary, monthlyPF);
  const oldRegimeTakeHome =
    annualGross - oldRegime.taxPayable - annualStatutoryDeductions;

  // Calculate New Regime
  const newRegime = calculateNewRegimeTax(annualGross);
  const newRegimeTakeHome =
    annualGross - newRegime.taxPayable - annualStatutoryDeductions;

  // Recommendation
  const betterRegime: TaxRegime = oldRegimeTakeHome > newRegimeTakeHome ? "old" : "new";
  const savings = Math.abs(oldRegimeTakeHome - newRegimeTakeHome);

  let reason = "";
  if (betterRegime === "old") {
    reason = `Old regime saves ₹${savings.toLocaleString()} annually due to deductions (HRA, PF, 80C).`;
  } else {
    reason = `New regime saves ₹${savings.toLocaleString()} annually due to lower tax slabs.`;
  }

  return {
    oldRegime: {
      taxableIncome: oldRegime.taxableIncome,
      deductions: oldRegime.deductions,
      taxPayable: oldRegime.taxPayable,
      takeHome: oldRegimeTakeHome,
    },
    newRegime: {
      taxableIncome: newRegime.taxableIncome,
      deductions: newRegime.deductions,
      taxPayable: newRegime.taxPayable,
      takeHome: newRegimeTakeHome,
    },
    recommendation: {
      betterRegime,
      savings,
      reason,
    },
  };
}

/**
 * Suggest salary structure optimizations for tax efficiency
 *
 * @param state - Employee's state
 * @param salary - Current salary structure
 * @returns Optimization suggestions
 */
export function suggestSalaryOptimizations(
  state: IndianState,
  salary: SalaryStructure
): SalaryOptimization {
  const currentGross =
    salary.basic +
    salary.hra +
    salary.conveyance +
    salary.medicalAllowance +
    salary.specialAllowance +
    salary.otherAllowances;

  // Calculate current tax
  const currentCompliance = calculateStatutoryDeductions(state, salary);
  const currentTax = compareTaxRegimes(state, salary);

  // Optimize: Increase HRA if under-utilized
  const optimizedSalary = { ...salary };
  const suggestions: SalaryOptimization["suggestions"] = [];

  // Suggestion 1: Optimize Basic to HRA ratio (40:50)
  const idealBasic = Math.round(currentGross * 0.4);
  const idealHRA = Math.round(currentGross * 0.5);

  if (Math.abs(salary.basic - idealBasic) > 1000) {
    suggestions.push({
      component: "Basic Salary",
      current: salary.basic,
      suggested: idealBasic,
      impact: 0, // Calculate later
      reason: "Optimal 40% of gross for PF cap and tax planning",
    });
    optimizedSalary.basic = idealBasic;
  }

  if (Math.abs(salary.hra - idealHRA) > 1000) {
    suggestions.push({
      component: "HRA",
      current: salary.hra,
      suggested: idealHRA,
      impact: 0,
      reason: "Maximize HRA exemption (50% of HRA is tax-free)",
    });
    optimizedSalary.hra = idealHRA;
  }

  // Suggestion 2: Optimize allowances (keep medical at limit)
  if (salary.medicalAllowance < 1250) {
    suggestions.push({
      component: "Medical Allowance",
      current: salary.medicalAllowance,
      suggested: 1250,
      impact: 0,
      reason: "Utilize full monthly medical allowance limit",
    });
    optimizedSalary.medicalAllowance = 1250;
  }

  // Adjust special allowance to maintain gross
  const optimizedComponents =
    optimizedSalary.basic +
    optimizedSalary.hra +
    optimizedSalary.conveyance +
    optimizedSalary.medicalAllowance +
    optimizedSalary.otherAllowances;

  optimizedSalary.specialAllowance = Math.max(0, currentGross - optimizedComponents);

  // Calculate optimized tax
  const optimizedTax = compareTaxRegimes(state, optimizedSalary);

  const monthlySavings = Math.round(
    (optimizedTax.oldRegime.takeHome - currentTax.oldRegime.takeHome) / 12
  );

  return {
    current: {
      gross: currentGross,
      netTakeHome: Math.round(currentTax.oldRegime.takeHome / 12),
      taxPayable: Math.round(currentTax.oldRegime.taxPayable / 12),
    },
    optimized: {
      gross: currentGross,
      netTakeHome: Math.round(optimizedTax.oldRegime.takeHome / 12),
      taxPayable: Math.round(optimizedTax.oldRegime.taxPayable / 12),
      structure: optimizedSalary,
    },
    savings: {
      monthly: monthlySavings,
      annual: monthlySavings * 12,
    },
    suggestions,
  };
}

/**
 * Calculate potential tax savings from investments
 *
 * @param annualIncome - Annual gross income
 * @param currentInvestments - Current 80C investments
 * @returns Savings breakdown
 */
export function calculateInvestmentSavings(
  annualIncome: number,
  currentInvestments: number = 0
): {
  maxLimit: number;
  current: number;
  remaining: number;
  potentialSavings: number;
  suggestion: string;
} {
  const maxLimit = OLD_REGIME_EXEMPTIONS.section80C;
  const remaining = Math.max(0, maxLimit - currentInvestments);

  // Tax saved = investment amount * marginal tax rate
  let marginalRate = 0;
  for (const slab of OLD_REGIME_SLABS) {
    if (annualIncome >= slab.min && annualIncome <= slab.max) {
      marginalRate = slab.rate;
      break;
    }
  }

  const potentialSavings = Math.round(remaining * marginalRate);

  let suggestion = "";
  if (remaining > 0) {
    suggestion = `Invest ₹${remaining.toLocaleString()} more in ELSS/PPF/NPS to save ₹${potentialSavings.toLocaleString()} in taxes`;
  } else {
    suggestion = "You've maxed out 80C deductions. Consider NPS for additional ₹50k deduction.";
  }

  return {
    maxLimit,
    current: currentInvestments,
    remaining,
    potentialSavings,
    suggestion,
  };
}

/**
 * Get quick tax-saving tips based on salary structure
 *
 * @param state - Employee's state
 * @param salary - Salary structure
 * @returns Array of actionable tips
 */
export function getTaxSavingTips(
  state: IndianState,
  salary: SalaryStructure
): Array<{ tip: string; savings: number; category: string }> {
  const tips: Array<{ tip: string; savings: number; category: string }> = [];

  const gross =
    salary.basic +
    salary.hra +
    salary.conveyance +
    salary.medicalAllowance +
    salary.specialAllowance +
    salary.otherAllowances;

  const annual = gross * 12;

  // Tip 1: HRA optimization
  if (salary.hra < gross * 0.5) {
    tips.push({
      tip: "Increase HRA to 50% of gross to maximize tax exemption",
      savings: Math.round((gross * 0.5 - salary.hra) * 12 * 0.3),
      category: "Structure",
    });
  }

  // Tip 2: Medical allowance
  if (salary.medicalAllowance < 1250) {
    tips.push({
      tip: "Claim full medical allowance of ₹1,250/month",
      savings: Math.round((1250 - salary.medicalAllowance) * 12 * 0.3),
      category: "Structure",
    });
  }

  // Tip 3: 80C investments
  if (annual > 500000) {
    tips.push({
      tip: "Invest ₹1.5L in ELSS/PPF to save ₹46,800 in taxes",
      savings: 46800,
      category: "Investment",
    });
  }

  // Tip 4: NPS additional deduction
  if (annual > 700000) {
    tips.push({
      tip: "Invest ₹50k in NPS for additional tax deduction",
      savings: 15000,
      category: "Investment",
    });
  }

  return tips;
}
