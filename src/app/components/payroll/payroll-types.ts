// Shared Payroll Data Types for unified data flow across all payroll components

export interface PayComponent {
  id: string;
  name: string;
  compliance: {
    pf: boolean;
    esic: boolean;
    pt: boolean;
  };
  operations: {
    ot: boolean;
    bonus: boolean;
    leave: boolean;
    gratuity: boolean;
    minWage: boolean;
    adjustment: boolean;
  };
  tds: "100% Taxable" | "Conditional" | "Non-Taxable";
  sourceType: "System" | "Manual" | "Formula";
  payType: "Earning" | "Deduction" | "Employer Contribution";
  status: "Active" | "Inactive";
  order: number;
  affectedEmployees?: number;
  affectedStructures?: number;
}

export interface SalaryStructureComponent {
  id: string;
  name: string;
  enabled: boolean;
  type: "fixed" | "formula" | "system";
  value?: number;
  formula?: string;
  payType: "Earning" | "Deduction" | "Contribution";
}

export interface SalaryStructure {
  id: string;
  name: string;
  description?: string;
  components: SalaryStructureComponent[];
  active: boolean;
  createdDate: string;
  modifiedDate: string;
}

export interface EmployeeSalaryAssignment {
  employeeId: string;
  structureId: string;
  effectiveDate: string;
  overrides: {
    componentId: string;
    value: number;
  }[];
  status: "Active" | "Inactive" | "Pending";
}

// Default pay components configuration (Based on standard payslip structure)
export const DEFAULT_PAY_COMPONENTS: PayComponent[] = [
  // EARNINGS - Fixed Pay
  {
    id: "basic",
    name: "Basic Salary",
    compliance: { pf: true, esic: true, pt: false },
    operations: { ot: true, bonus: false, leave: true, gratuity: true, minWage: true, adjustment: false },
    tds: "100% Taxable",
    sourceType: "System",
    payType: "Earning",
    status: "Active",
    order: 1,
    affectedEmployees: 247,
    affectedStructures: 12,
  },
  {
    id: "hra",
    name: "HRA",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Conditional",
    sourceType: "Formula",
    payType: "Earning",
    status: "Active",
    order: 2,
    affectedEmployees: 247,
    affectedStructures: 12,
  },
  {
    id: "uniform-allowance",
    name: "Uniform Allowance",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Earning",
    status: "Active",
    order: 3,
    affectedEmployees: 150,
    affectedStructures: 8,
  },
  {
    id: "washing-allowance",
    name: "Washing Allowance",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Earning",
    status: "Active",
    order: 4,
    affectedEmployees: 120,
    affectedStructures: 6,
  },
  {
    id: "conveyance",
    name: "Conveyance Allowance",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Earning",
    status: "Active",
    order: 5,
    affectedEmployees: 200,
    affectedStructures: 10,
  },
  {
    id: "helper-allowance",
    name: "Helper Allowance",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "100% Taxable",
    sourceType: "System",
    payType: "Earning",
    status: "Active",
    order: 6,
    affectedEmployees: 50,
    affectedStructures: 3,
  },
  {
    id: "lta",
    name: "LTA",
    compliance: { pf: false, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: true, gratuity: false, minWage: false, adjustment: false },
    tds: "Conditional",
    sourceType: "Manual",
    payType: "Earning",
    status: "Active",
    order: 7,
    affectedEmployees: 180,
    affectedStructures: 9,
  },
  {
    id: "education-allowance",
    name: "Education Allowance",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Earning",
    status: "Active",
    order: 8,
    affectedEmployees: 90,
    affectedStructures: 5,
  },
  {
    id: "stipend",
    name: "Stipend",
    compliance: { pf: false, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "100% Taxable",
    sourceType: "System",
    payType: "Earning",
    status: "Active",
    order: 9,
    affectedEmployees: 30,
    affectedStructures: 2,
  },

  // EARNINGS - Variable Pay
  {
    id: "travel-reimbursement",
    name: "Traveling & Misc Expenses Reimbursement",
    compliance: { pf: false, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "Manual",
    payType: "Earning",
    status: "Active",
    order: 10,
    affectedEmployees: 100,
    affectedStructures: 6,
  },
  {
    id: "sales-incentive",
    name: "Sales Incentive",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: false, bonus: true, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "100% Taxable",
    sourceType: "System",
    payType: "Earning",
    status: "Active",
    order: 11,
    affectedEmployees: 80,
    affectedStructures: 4,
  },
  {
    id: "performance-production",
    name: "Performance / Production",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: false, bonus: true, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "100% Taxable",
    sourceType: "System",
    payType: "Earning",
    status: "Active",
    order: 12,
    affectedEmployees: 156,
    affectedStructures: 9,
  },
  {
    id: "overtime",
    name: "Overtime",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: true, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "100% Taxable",
    sourceType: "System",
    payType: "Earning",
    status: "Active",
    order: 13,
    affectedEmployees: 120,
    affectedStructures: 7,
  },
  {
    id: "commission",
    name: "Commission",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: false, bonus: true, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "100% Taxable",
    sourceType: "System",
    payType: "Earning",
    status: "Active",
    order: 14,
    affectedEmployees: 60,
    affectedStructures: 3,
  },

  // DEDUCTIONS
  {
    id: "epf",
    name: "EPF",
    compliance: { pf: true, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Deduction",
    status: "Active",
    order: 15,
    affectedEmployees: 247,
    affectedStructures: 12,
  },
  {
    id: "esic",
    name: "ESIC",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Deduction",
    status: "Active",
    order: 16,
    affectedEmployees: 142,
    affectedStructures: 7,
  },
  {
    id: "pt",
    name: "PT",
    compliance: { pf: false, esic: false, pt: true },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Deduction",
    status: "Active",
    order: 17,
    affectedEmployees: 247,
    affectedStructures: 12,
  },
  {
    id: "lwf",
    name: "LWF",
    compliance: { pf: false, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Deduction",
    status: "Active",
    order: 18,
    affectedEmployees: 200,
    affectedStructures: 10,
  },
  {
    id: "tds",
    name: "TDS",
    compliance: { pf: false, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Deduction",
    status: "Active",
    order: 19,
    affectedEmployees: 78,
    affectedStructures: 5,
  },
  {
    id: "sur-charge",
    name: "SUR CHARGE",
    compliance: { pf: false, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Deduction",
    status: "Active",
    order: 20,
    affectedEmployees: 50,
    affectedStructures: 3,
  },
  {
    id: "edu-cess",
    name: "EDU CESS",
    compliance: { pf: false, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Deduction",
    status: "Active",
    order: 21,
    affectedEmployees: 50,
    affectedStructures: 3,
  },
  {
    id: "loan",
    name: "LOAN",
    compliance: { pf: false, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "Manual",
    payType: "Deduction",
    status: "Active",
    order: 22,
    affectedEmployees: 30,
    affectedStructures: 2,
  },
  {
    id: "advance",
    name: "ADVANCE",
    compliance: { pf: false, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "Manual",
    payType: "Deduction",
    status: "Active",
    order: 23,
    affectedEmployees: 40,
    affectedStructures: 3,
  },
  {
    id: "other-deduction",
    name: "OTHER DEDUCTION",
    compliance: { pf: false, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: true },
    tds: "Non-Taxable",
    sourceType: "Manual",
    payType: "Deduction",
    status: "Active",
    order: 24,
    affectedEmployees: 60,
    affectedStructures: 4,
  },
  {
    id: "attendance-deduction",
    name: "ATTENDANCE DEDUCTION",
    compliance: { pf: false, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: true, gratuity: false, minWage: false, adjustment: true },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Deduction",
    status: "Active",
    order: 25,
    affectedEmployees: 100,
    affectedStructures: 6,
  },

  // EMPLOYER CONTRIBUTIONS
  {
    id: "pf-gross",
    name: "PF GROSS",
    compliance: { pf: true, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Employer Contribution",
    status: "Active",
    order: 26,
    affectedEmployees: 247,
    affectedStructures: 12,
  },
  {
    id: "eps",
    name: "EPS",
    compliance: { pf: true, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Employer Contribution",
    status: "Active",
    order: 27,
    affectedEmployees: 247,
    affectedStructures: 12,
  },
  {
    id: "epf-employer",
    name: "EPF",
    compliance: { pf: true, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Employer Contribution",
    status: "Active",
    order: 28,
    affectedEmployees: 247,
    affectedStructures: 12,
  },
  {
    id: "esic-gross",
    name: "ESIC GROSS",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Employer Contribution",
    status: "Active",
    order: 29,
    affectedEmployees: 142,
    affectedStructures: 7,
  },
  {
    id: "esic-employer",
    name: "ESIC",
    compliance: { pf: false, esic: true, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Employer Contribution",
    status: "Active",
    order: 30,
    affectedEmployees: 142,
    affectedStructures: 7,
  },
  {
    id: "lwf-employer",
    name: "LWF",
    compliance: { pf: false, esic: false, pt: false },
    operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
    tds: "Non-Taxable",
    sourceType: "System",
    payType: "Employer Contribution",
    status: "Active",
    order: 31,
    affectedEmployees: 200,
    affectedStructures: 10,
  },
];

// Convert PayComponent to SalaryStructureComponent
export function convertToStructureComponent(
  payComponent: PayComponent,
  value?: number,
  formula?: string
): SalaryStructureComponent {
  return {
    id: payComponent.id,
    name: payComponent.name,
    enabled: payComponent.status === "Active",
    type: payComponent.sourceType === "System" && payComponent.id === "incentive"
      ? "system"
      : payComponent.sourceType === "Formula"
      ? "formula"
      : "fixed",
    value,
    formula,
    payType: payComponent.payType,
  };
}
