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
