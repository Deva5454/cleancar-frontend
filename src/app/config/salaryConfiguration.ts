/**
 * Centralized Salary Configuration
 * 
 * ⚠️ IMPORTANT: This is the SINGLE SOURCE OF TRUTH for all salary calculations
 * 
 * All salary components, percentages, and calculations across the entire system
 * (Offer Letter, Appointment Letter, Salary Structure, Payroll, etc.) MUST use
 * this configuration.
 * 
 * To modify salary structure:
 * - Go to: Payroll Configuration → Salary Structure
 * - Route: /payroll/configuration
 * 
 * DO NOT hardcode salary percentages anywhere else in the application!
 */

export interface SalaryComponent {
  name: string;
  type: "earning" | "deduction";
  isPercentage: boolean;
  percentage?: number;
  fixedAmount?: number;
  description: string;
}

export interface SalaryConfiguration {
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];
}

/**
 * Default Salary Structure Configuration
 * Used across the entire application for consistency
 */
export const DEFAULT_SALARY_CONFIGURATION: SalaryConfiguration = {
  earnings: [
    {
      name: "Basic Salary",
      type: "earning",
      isPercentage: true,
      percentage: 50,
      description: "Base salary component (50% of gross)",
    },
    {
      name: "HRA",
      type: "earning",
      isPercentage: true,
      percentage: 40,
      description: "House Rent Allowance (40% of basic)",
    },
    {
      name: "Conveyance",
      type: "earning",
      isPercentage: false,
      fixedAmount: 1600,
      description: "Fixed conveyance allowance",
    },
    {
      name: "Special Allowance",
      type: "earning",
      isPercentage: true,
      percentage: 20,
      description: "Special/Other allowance (20% of basic)",
    },
  ],
  deductions: [
    {
      name: "PF",
      type: "deduction",
      isPercentage: true,
      percentage: 12,
      description: "Provident Fund (12% of basic)",
    },
    {
      name: "ESIC",
      type: "deduction",
      isPercentage: true,
      percentage: 0.75,
      description: "Employee State Insurance (0.75% of gross)",
    },
  ],
};

/**
 * Calculate CTC Breakdown based on Gross Salary (RECOMMENDED METHOD)
 * This matches the Payroll Configuration system exactly
 * 
 * Formula: Gross is provided → Calculate all components from Gross
 * - Gross: Given input
 * - Basic: 40% of Gross
 * - HRA: 40% of Basic (non-metro) or 50% of Basic (metro)
 * - Conveyance: ₹1,600 (fixed)
 * - Medical: ₹1,250 (fixed)
 * - Special Allowance: Gross - (Basic + HRA + Conveyance + Medical)
 * 
 * @param gross - Monthly Gross Salary amount
 * @param isMetro - Whether the location is metro (affects HRA calculation)
 * @returns Complete CTC breakdown with all components matching SalaryComponents interface
 */
export function calculateCTCFromGross(gross: number, isMetro: boolean = false) {
  // Calculate Basic from Gross (40% of Gross as per Payroll Configuration)
  const basic = Math.round(gross * 0.4);
  
  // Calculate HRA based on Basic
  const hraRate = isMetro ? 0.5 : 0.4; // 50% for metro, 40% for non-metro
  const hra = Math.round(basic * hraRate);
  
  // Fixed allowances
  const conveyance = 1600;
  const medical = 1250;
  
  // Special Allowance is the balancing figure
  const specialAllowance = Math.max(0, gross - (basic + hra + conveyance + medical));
  
  const monthlyGross = gross;

  // Calculate deductions using Payroll Configuration logic
  // PF: 12% of basic (with cap of ₹1,800 if applicable)
  const pfBase = basic;
  const pfRate = 0.12;
  const pfCap = 1800;
  const pfActual = Math.round(pfBase * pfRate);
  const employeePF = pfActual; // For now, no cap applied (can be added with parameter)
  const employerPF = employeePF; // Employer contributes same as employee
  
  // ESIC: 0.75% of gross (applicable only if gross <= ₹21,000)
  const esicApplicable = monthlyGross <= 21000;
  const employeeESIC = esicApplicable ? Math.round(monthlyGross * 0.0075) : 0;
  const employerESIC = esicApplicable ? Math.round(monthlyGross * 0.0325) : 0;
  
  // Professional Tax (PT) - slab-based
  const professionalTax = calculatePT(monthlyGross);

  const totalDeductions = employeePF + employeeESIC + professionalTax;
  const netTakeHome = monthlyGross - totalDeductions;

  // Calculate employer cost and CTC
  const totalEmployerCost = employerPF + employerESIC;
  const totalCTC = monthlyGross + totalEmployerCost;
  const annualCTC = totalCTC * 12;

  return {
    monthlyGross,
    annualCTC,
    basic,
    hra,
    conveyance,
    medical,
    specialAllowance,
    employeePF,
    employerPF,
    employeeESIC,
    employerESIC,
    professionalTax,
    totalDeductions,
    netTakeHome,
    totalEmployerCost,
    totalCTC,
    // Legacy support - kept for backwards compatibility
    gross: monthlyGross,
    pf: employeePF,
    esic: employeeESIC,
  };
}

/**
 * Calculate CTC Breakdown based on Basic Salary (LEGACY METHOD)
 * This is the ONLY function that should calculate salary components
 * Returns the full SalaryComponents structure matching salaryStructureService
 * 
 * NOTE: This function uses BASIC salary as input and applies the SAME calculation
 * logic as the Payroll Configuration module for consistency.
 * 
 * ⚠️ DEPRECATED: Use calculateCTCFromGross() instead for consistency with Payroll Configuration
 * 
 * Formula: Basic is provided → Calculate Gross and other components
 * - Basic: Given input
 * - HRA: 40% of Basic (non-metro) or 50% of Basic (metro)
 * - Conveyance: ₹1,600 (fixed)
 * - Medical: ₹1,250 (fixed)
 * - Special Allowance: Balancing figure to reach desired gross
 * - Gross: Basic + HRA + Conveyance + Medical + Special Allowance
 * 
 * @param basic - Basic salary amount
 * @param isMetro - Whether the location is metro (affects HRA calculation)
 * @returns Complete CTC breakdown with all components matching SalaryComponents interface
 */
export function calculateCTCFromBasic(basic: number, isMetro: boolean = false) {
  // Calculate earnings using the SAME logic as Payroll Configuration
  const hraRate = isMetro ? 0.5 : 0.4; // 50% for metro, 40% for non-metro
  const hra = Math.round(basic * hraRate);
  const conveyance = 1600; // Fixed
  const medical = 1250; // Fixed
  
  // Calculate gross
  const monthlyGross = basic + hra + conveyance + medical;
  
  // Special allowance is 0 when we calculate from basic (not needed)
  const specialAllowance = 0;

  // Calculate deductions using Payroll Configuration logic
  // PF: 12% of basic (with cap of ₹1,800 if applicable)
  const pfBase = basic;
  const pfRate = 0.12;
  const pfCap = 1800;
  const pfActual = Math.round(pfBase * pfRate);
  const employeePF = pfActual; // For now, no cap applied (can be added with parameter)
  const employerPF = employeePF; // Employer contributes same as employee
  
  // ESIC: 0.75% of gross (applicable only if gross <= ₹21,000)
  const esicApplicable = monthlyGross <= 21000;
  const employeeESIC = esicApplicable ? Math.round(monthlyGross * 0.0075) : 0;
  const employerESIC = esicApplicable ? Math.round(monthlyGross * 0.0325) : 0;
  
  // Professional Tax (PT) - slab-based
  const professionalTax = calculatePT(monthlyGross);

  const totalDeductions = employeePF + employeeESIC + professionalTax;
  const netTakeHome = monthlyGross - totalDeductions;

  // Calculate employer cost and CTC
  const totalEmployerCost = employerPF + employerESIC;
  const totalCTC = monthlyGross + totalEmployerCost;
  const annualCTC = totalCTC * 12;

  return {
    monthlyGross,
    annualCTC,
    basic,
    hra,
    conveyance,
    medical,
    specialAllowance,
    employeePF,
    employerPF,
    employeeESIC,
    employerESIC,
    professionalTax,
    totalDeductions,
    netTakeHome,
    totalEmployerCost,
    totalCTC,
    // Legacy support - kept for backwards compatibility
    gross: monthlyGross,
    pf: employeePF,
    esic: employeeESIC,
  };
}

/**
 * Calculate Professional Tax based on gross salary (PT slab)
 * Matches the logic in Payroll Configuration
 */
function calculatePT(gross: number): number {
  // Gujarat PT slabs — matches payrollConstants.ts STATUTORY_RULES.PT_SLABS
  if (gross < 6000)  return 0;
  if (gross < 9000)  return 80;
  if (gross < 12000) return 150;
  return 200; // Gross >= ₹12,000 — max PT in Gujarat is ₹200
}

/**
 * Get salary configuration for display
 * Use this to show salary structure details in UI
 */
export function getSalaryConfiguration() {
  return DEFAULT_SALARY_CONFIGURATION;
}

/**
 * Get configuration summary as text
 * Useful for displaying in UI
 */
export function getSalaryConfigurationSummary(): string {
  const config = DEFAULT_SALARY_CONFIGURATION;
  const lines = [
    "Current Salary Structure:",
    "",
    "Earnings:",
    ...config.earnings.map(
      (e) =>
        `  • ${e.name}: ${
          e.isPercentage ? `${e.percentage}% of basic` : `₹${e.fixedAmount} (fixed)`
        }`
    ),
    "",
    "Deductions:",
    ...config.deductions.map(
      (d) =>
        `  • ${d.name}: ${
          d.isPercentage
            ? `${d.percentage}% of ${d.name === "PF" ? "basic" : "gross"}`
            : `₹${d.fixedAmount} (fixed)`
        }`
    ),
  ];
  return lines.join("\n");
}

/**
 * Validation: Check if basic salary is valid
 */
export function validateBasicSalary(basic: number): { valid: boolean; error?: string } {
  if (basic <= 0) {
    return { valid: false, error: "Basic salary must be greater than 0" };
  }
  if (basic < 5000) {
    return { valid: false, error: "Basic salary cannot be less than ₹5,000" };
  }
  if (basic > 500000) {
    return { valid: false, error: "Basic salary cannot exceed ₹5,00,000" };
  }
  return { valid: true };
}