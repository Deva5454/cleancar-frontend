/**
 * Salary Component Configuration System
 * Config-driven architecture - HR configures components, system calculates
 */

// ==================== COMPONENT TYPES ====================

export type ComponentType = "percentage" | "fixed" | "manual" | "rule_based";
export type ComponentCategory = "earning_fixed" | "earning_variable" | "deduction" | "company_contribution";
export type ComponentScope = "global" | "role" | "employee";
export type CalculationBase = "basic" | "gross" | "hra" | "none";

// ==================== COMPONENT CONFIGURATION ====================

export interface SalaryComponent {
  id: string;
  name: string;
  shortCode: string;
  type: ComponentType;
  category: ComponentCategory;
  value: number; // Percentage or fixed amount
  base: CalculationBase;
  scope: ComponentScope;
  applicableRoles?: string[]; // If scope = role
  isActive: boolean;
  order: number;
  description?: string;
  tooltip?: string;
  isProrated: boolean; // Whether to apply shift proration
  isTaxable: boolean;
  isStatutory: boolean;
}

// ==================== PRORATION CONFIG ====================

export type ProrationType = "none" | "shift_based" | "days_based";

export interface ProrationConfig {
  type: ProrationType;
  shiftType: "full_time" | "part_time";
  shiftHours: number;
  fullShiftHours: number;
  prorationFactor: number;
  // For mid-month joiners
  workingDays?: number; // Actual working days in the month
  totalDaysInMonth?: number; // Total days in the month
  dateOfJoining?: string; // Date when employee joined (for mid-month joiners)
}

// ==================== COMPONENT REGISTRY ====================

/**
 * Master component configuration
 * HR can add/edit/remove components via admin panel
 */
export const SALARY_COMPONENT_REGISTRY: SalaryComponent[] = [
  // ==================== FIXED EARNINGS ====================
  {
    id: "comp_basic",
    name: "Basic Salary",
    shortCode: "BASIC",
    type: "manual",
    category: "earning_fixed",
    value: 0,
    base: "none",
    scope: "employee",
    isActive: true,
    order: 1,
    description: "Base salary entered by HR",
    tooltip: "Primary salary component - entered manually by HR",
    isProrated: true,
    isTaxable: true,
    isStatutory: false,
  },
  {
    id: "comp_hra",
    name: "HRA",
    shortCode: "HRA",
    type: "percentage",
    category: "earning_fixed",
    value: 40, // 40% of basic
    base: "basic",
    scope: "global",
    isActive: true,
    order: 2,
    description: "House Rent Allowance",
    tooltip: "HRA = 40% of Basic Salary",
    isProrated: true,
    isTaxable: true,
    isStatutory: false,
  },
  {
    id: "comp_conveyance",
    name: "Conveyance",
    shortCode: "CONV",
    type: "fixed",
    category: "earning_fixed",
    value: 1600,
    base: "none",
    scope: "global",
    isActive: true,
    order: 3,
    description: "Transport allowance",
    tooltip: "Fixed conveyance allowance",
    isProrated: true,
    isTaxable: true,
    isStatutory: false,
  },
  {
    id: "comp_medical",
    name: "Medical Allowance",
    shortCode: "MED",
    type: "fixed",
    category: "earning_fixed",
    value: 1250,
    base: "none",
    scope: "global",
    isActive: true,
    order: 4,
    description: "Medical reimbursement",
    tooltip: "Fixed medical allowance",
    isProrated: true,
    isTaxable: false,
    isStatutory: false,
  },
  {
    id: "comp_special",
    name: "Special Allowance",
    shortCode: "SPCL",
    type: "percentage",
    category: "earning_fixed",
    value: 20, // 20% of basic
    base: "basic",
    scope: "global",
    isActive: true,
    order: 5,
    description: "Special allowance",
    tooltip: "Special Allowance = 20% of Basic Salary",
    isProrated: true,
    isTaxable: true,
    isStatutory: false,
  },

  // ==================== VARIABLE EARNINGS ====================
  {
    id: "comp_bonus",
    name: "Bonus",
    shortCode: "BONUS",
    type: "manual",
    category: "earning_variable",
    value: 0,
    base: "none",
    scope: "employee",
    isActive: true,
    order: 10,
    description: "Performance bonus",
    tooltip: "Bonus amount entered manually by HR",
    isProrated: false, // Configurable - not prorated by default
    isTaxable: true,
    isStatutory: false,
  },
  {
    id: "comp_incentive",
    name: "Incentive",
    shortCode: "INCV",
    type: "manual",
    category: "earning_variable",
    value: 0,
    base: "none",
    scope: "employee",
    isActive: true,
    order: 11,
    description: "Sales/KPI incentive",
    tooltip: "Incentive based on KPIs - entered manually",
    isProrated: false, // Not prorated
    isTaxable: true,
    isStatutory: false,
  },
  {
    id: "comp_overtime",
    name: "Overtime",
    shortCode: "OT",
    type: "manual",
    category: "earning_variable",
    value: 0,
    base: "none",
    scope: "employee",
    isActive: true,
    order: 12,
    description: "Overtime pay",
    tooltip: "Overtime amount calculated separately",
    isProrated: false,
    isTaxable: true,
    isStatutory: false,
  },

  // ==================== DEDUCTIONS ====================
  {
    id: "comp_epf",
    name: "EPF",
    shortCode: "EPF",
    type: "rule_based",
    category: "deduction",
    value: 12, // 12% of basic
    base: "basic",
    scope: "global",
    isActive: true,
    order: 20,
    description: "Employee Provident Fund",
    tooltip: "EPF = 12% of Basic Salary (capped at ₹15,000 basic)",
    isProrated: true,
    isTaxable: false,
    isStatutory: true,
  },
  {
    id: "comp_esic",
    name: "ESIC",
    shortCode: "ESIC",
    type: "rule_based",
    category: "deduction",
    value: 0.75, // 0.75% of gross
    base: "gross",
    scope: "global",
    isActive: true,
    order: 21,
    description: "Employee State Insurance",
    tooltip: "ESIC = 0.75% of Gross (applicable if gross ≤ ₹21,000)",
    isProrated: true,
    isTaxable: false,
    isStatutory: true,
  },
  {
    id: "comp_pt",
    name: "Professional Tax",
    shortCode: "PT",
    type: "rule_based",
    category: "deduction",
    value: 0, // Slab-based
    base: "gross",
    scope: "global",
    isActive: true,
    order: 22,
    description: "Professional Tax",
    tooltip: "PT calculated based on gross salary slab",
    isProrated: false,
    isTaxable: false,
    isStatutory: true,
  },
  {
    id: "comp_attendance_deduction",
    name: "Attendance Deduction",
    shortCode: "ATT_DED",
    type: "rule_based",
    category: "deduction",
    value: 0,
    base: "basic",
    scope: "global",
    isActive: true,
    order: 23,
    description: "Deduction due to attendance",
    tooltip: "Calculated based on absent days, late marks, etc.",
    isProrated: false,
    isTaxable: false,
    isStatutory: false,
  },
  {
    id: "comp_advance",
    name: "Advance",
    shortCode: "ADV",
    type: "manual",
    category: "deduction",
    value: 0,
    base: "none",
    scope: "employee",
    isActive: true,
    order: 24,
    description: "Salary advance recovery",
    tooltip: "Advance amount to be deducted",
    isProrated: false,
    isTaxable: false,
    isStatutory: false,
  },
  {
    id: "comp_loan",
    name: "Loan EMI",
    shortCode: "LOAN",
    type: "manual",
    category: "deduction",
    value: 0,
    base: "none",
    scope: "employee",
    isActive: true,
    order: 25,
    description: "Loan EMI deduction",
    tooltip: "Monthly loan EMI",
    isProrated: false,
    isTaxable: false,
    isStatutory: false,
  },

  // ==================== COMPANY CONTRIBUTION ====================
  {
    id: "comp_employer_pf",
    name: "Employer PF",
    shortCode: "EMPF",
    type: "rule_based",
    category: "company_contribution",
    value: 13.61, // 12% PF + 1.61% admin
    base: "basic",
    scope: "global",
    isActive: true,
    order: 30,
    description: "Employer PF contribution",
    tooltip: "Employer PF = 13.61% of Basic (12% + 1.61% admin charges)",
    isProrated: true,
    isTaxable: false,
    isStatutory: true,
  },
  {
    id: "comp_employer_esic",
    name: "Employer ESIC",
    shortCode: "EESIC",
    type: "rule_based",
    category: "company_contribution",
    value: 3.25, // 3.25% of gross
    base: "gross",
    scope: "global",
    isActive: true,
    order: 31,
    description: "Employer ESIC contribution",
    tooltip: "Employer ESIC = 3.25% of Gross (if gross ≤ ₹21,000)",
    isProrated: true,
    isTaxable: false,
    isStatutory: true,
  },
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Get components by category
 */
export function getComponentsByCategory(category: ComponentCategory): SalaryComponent[] {
  return SALARY_COMPONENT_REGISTRY.filter(
    (comp) => comp.category === category && comp.isActive
  ).sort((a, b) => a.order - b.order);
}

/**
 * Get component by ID
 */
export function getComponentById(id: string): SalaryComponent | undefined {
  return SALARY_COMPONENT_REGISTRY.find((comp) => comp.id === id);
}

/**
 * Get all active components
 */
export function getActiveComponents(): SalaryComponent[] {
  return SALARY_COMPONENT_REGISTRY.filter((comp) => comp.isActive).sort(
    (a, b) => a.order - b.order
  );
}

/**
 * Get editable components (manual input)
 */
export function getEditableComponents(): SalaryComponent[] {
  return SALARY_COMPONENT_REGISTRY.filter(
    (comp) => comp.type === "manual" && comp.isActive
  );
}


// ==================== CTC CALCULATION UTILITIES ====================
// Moved from salaryConfiguration.ts (that file is now deprecated)
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