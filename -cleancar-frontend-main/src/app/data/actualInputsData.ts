// Actual Consumed Amount Input Data - Mock Data
// Manual input layer for recording actual costs that differ from standard calculations

import {
  type ConsumableActualInput,
  type EquipmentActualInput,
  type SalaryActualInput,
  type OverheadActualInput,
  type CustomCostElement,
} from "./costData";

// ============================================
// SECTION 1: CONSUMABLE ACTUAL INPUTS
// ============================================

export const CONSUMABLE_ACTUAL_INPUTS: ConsumableActualInput[] = [
  {
    id: "cons-act-001",
    washerId: "washer-001",
    date: "2026-03-15",
    materialId: "1", // Foam Shampoo
    quantityConsumed: 150,
    unit: "ml",
    reason: "Additional Usage — Heavily Soiled Vehicle",
    jobReference: "JOB-2026-03-15-142",
    recordedBy: "Suresh Kumar (Washer)",
    createdAt: "2026-03-15T16:30:00Z",
    batchCostPerUnit: 0.82, // FIFO batch cost
    totalCost: 123, // 150 × 0.82
  },
  {
    id: "cons-act-002",
    washerId: "washer-002",
    date: "2026-03-14",
    materialId: "2", // Wax Coating
    quantityConsumed: 50,
    unit: "ml",
    reason: "Product Applied Incorrectly — Wastage",
    recordedBy: "Ramesh Patel (Washer)",
    createdAt: "2026-03-14T18:15:00Z",
    batchCostPerUnit: 2.5,
    totalCost: 125, // 50 × 2.5
  },
  {
    id: "cons-act-003",
    washerId: "washer-003",
    date: "2026-03-10",
    materialId: "1", // Foam Shampoo
    quantityConsumed: 200,
    unit: "ml",
    reason: "Training Demonstration",
    recordedBy: "Karthik Menon (Supervisor)",
    createdAt: "2026-03-10T14:00:00Z",
    batchCostPerUnit: 0.8,
    totalCost: 160, // 200 × 0.8
  },
  {
    id: "cons-act-004",
    washerId: "washer-001",
    date: "2026-03-12",
    materialId: "7", // Glass Cleaner
    quantityConsumed: 100,
    unit: "ml",
    reason: "Equipment Cleaning",
    recordedBy: "Suresh Kumar (Washer)",
    createdAt: "2026-03-12T19:00:00Z",
    batchCostPerUnit: 0.6,
    totalCost: 60, // 100 × 0.6
  },
  {
    id: "cons-act-005",
    washerId: "washer-004",
    date: "2026-03-16",
    materialId: "8", // Wheel Cleaner
    quantityConsumed: 75,
    unit: "ml",
    reason: "Additional Usage — Heavily Soiled Vehicle",
    jobReference: "JOB-2026-03-16-089",
    recordedBy: "Vijay Singh (Washer)",
    createdAt: "2026-03-16T17:45:00Z",
    batchCostPerUnit: 0.9,
    totalCost: 67.5, // 75 × 0.9
  },
];

// ============================================
// SECTION 2: EQUIPMENT ACTUAL INPUTS
// ============================================

export const EQUIPMENT_ACTUAL_INPUTS: EquipmentActualInput[] = [
  {
    id: "equip-act-001",
    washerId: "washer-001",
    date: "2026-03-10",
    equipmentId: "eq-fg-001", // Foam Gun
    eventType: "Part Replacement",
    actualCostIncurred: 180,
    description: "Foam gun nozzle replaced - worn out threads causing leakage",
    reference: "Maintenance Log ML-2026-03-10",
    recordedBy: "Karthik Menon (Supervisor)",
    createdAt: "2026-03-10T15:30:00Z",
  },
  {
    id: "equip-act-002",
    washerId: "washer-002",
    date: "2026-03-12",
    equipmentId: "eq-mt-001", // Microfiber Towel Set
    eventType: "Premature Wear — Replaced Before End of Useful Life",
    actualCostIncurred: 1200,
    description: "Microfiber towel set replaced after 3 months - heavy daily use caused rapid degradation",
    reference: "Purchase Order PO-2026-03-12-015",
    recordedBy: "Priya Sharma (Admin)",
    createdAt: "2026-03-12T11:00:00Z",
  },
  {
    id: "equip-act-003",
    washerId: "washer-004",
    date: "2026-03-14",
    equipmentId: "eq-pw-002", // Pressure Washer
    eventType: "External Repair Cost",
    actualCostIncurred: 850,
    description: "Pressure washer motor repair - authorized service center",
    reference: "Service Invoice SI-2026-03-14-42",
    recordedBy: "Vikram Reddy (Admin)",
    createdAt: "2026-03-14T16:45:00Z",
  },
  {
    id: "equip-act-004",
    washerId: "washer-003",
    date: "2026-03-08",
    equipmentId: "eq-bs-002", // Bucket Set
    eventType: "Accidental Damage — Non-F&F",
    actualCostIncurred: 400,
    description: "Bucket damaged in transit - fell from vehicle during route change",
    recordedBy: "Dinesh Sharma (Washer)",
    createdAt: "2026-03-08T18:30:00Z",
  },
  {
    id: "equip-act-005",
    washerId: "washer-001",
    date: "2026-03-17",
    equipmentId: "eq-vc-001", // Vacuum Cleaner
    eventType: "Part Replacement",
    actualCostIncurred: 320,
    description: "Vacuum cleaner filter and hose replaced - regular maintenance",
    reference: "Maintenance Schedule MS-Q1-2026",
    recordedBy: "Karthik Menon (Supervisor)",
    createdAt: "2026-03-17T14:15:00Z",
  },
];

// ============================================
// SECTION 3: SALARY ACTUAL INPUTS
// ============================================

export const SALARY_ACTUAL_INPUTS: SalaryActualInput[] = [
  {
    id: "sal-act-001",
    employeeId: "washer-001",
    date: "2026-03-10",
    adjustmentType: "Overtime",
    amount: 800,
    reason: "Sunday overtime - emergency customer request for 4 additional washes",
    reference: "Overtime Approval OT-2026-03-10",
    recordedBy: "Karthik Menon (Supervisor)",
    createdAt: "2026-03-10T20:00:00Z",
  },
  {
    id: "sal-act-002",
    employeeId: "washer-002",
    date: "2026-03-05",
    adjustmentType: "Special Allowance",
    amount: 500,
    reason: "Conveyance allowance for extended zone coverage",
    reference: "Payroll Note PN-2026-03-05",
    recordedBy: "Neha Singh (Admin)",
    createdAt: "2026-03-05T11:30:00Z",
  },
  {
    id: "sal-act-003",
    employeeId: "washer-004",
    date: "2026-03-15",
    adjustmentType: "Bonus",
    amount: 1500,
    reason: "Customer excellence bonus - 10+ 5-star ratings in March",
    reference: "Performance Bonus PB-2026-03",
    recordedBy: "Rajesh Kumar (SA)",
    createdAt: "2026-03-15T16:00:00Z",
  },
  {
    id: "sal-act-004",
    employeeId: "washer-003",
    date: "2026-03-08",
    adjustmentType: "Advance Recovery",
    amount: -1000,
    reason: "Salary advance recovery - 2nd installment of ₹5,000 advance",
    reference: "Advance Agreement ADV-2026-02-15",
    recordedBy: "Priya Sharma (Admin)",
    createdAt: "2026-03-08T09:15:00Z",
  },
  {
    id: "sal-act-005",
    employeeId: "supervisor-001",
    date: "2026-03-12",
    adjustmentType: "Other Addition",
    amount: 2000,
    reason: "Training program completion incentive - Advanced Customer Service",
    reference: "Training Certificate TC-2026-03-12",
    recordedBy: "Amit Patel (SA)",
    createdAt: "2026-03-12T14:45:00Z",
  },
  {
    id: "sal-act-006",
    employeeId: "washer-001",
    date: "2026-03-14",
    adjustmentType: "Overtime",
    amount: 600,
    reason: "Extended hours for large vehicle fleet service - corporate client",
    reference: "Overtime Approval OT-2026-03-14",
    recordedBy: "Karthik Menon (Supervisor)",
    createdAt: "2026-03-14T19:30:00Z",
  },
];

// ============================================
// SECTION 4: OVERHEAD ACTUAL INPUTS
// ============================================

export const OVERHEAD_ACTUAL_INPUTS: OverheadActualInput[] = [
  {
    id: "oh-act-001",
    overheadCategoryId: "oh-001", // Vehicle / Transport per Washer
    scope: "Washer",
    scopeId: "washer-001",
    date: "2026-03-11",
    actualAmount: 350,
    description: "Motorbike flat tyre repair - emergency roadside assistance",
    reference: "Service Receipt SR-2026-03-11",
    recordedBy: "Suresh Kumar (Washer)",
    createdAt: "2026-03-11T17:00:00Z",
  },
  {
    id: "oh-act-002",
    overheadCategoryId: "oh-003", // Uniform Amortization
    scope: "Washer",
    scopeId: "washer-002",
    date: "2026-03-08",
    actualAmount: 450,
    description: "Extra uniform shirt purchased - previous one damaged during wash",
    reference: "Purchase Bill PB-2026-03-08",
    recordedBy: "Ramesh Patel (Washer)",
    createdAt: "2026-03-08T16:30:00Z",
  },
  {
    id: "oh-act-003",
    overheadCategoryId: "oh-011", // Zone Marketing — Surat
    scope: "Zone",
    scopeId: "395001",
    date: "2026-03-05",
    actualAmount: 5000,
    description: "Additional local newspaper advertisement for festive season",
    reference: "Marketing Invoice MI-2026-03-05",
    recordedBy: "Priya Sharma (Admin)",
    createdAt: "2026-03-05T12:00:00Z",
  },
  {
    id: "oh-act-004",
    overheadCategoryId: "oh-001", // Vehicle / Transport per Washer
    scope: "Washer",
    scopeId: "washer-004",
    date: "2026-03-13",
    actualAmount: 280,
    description: "Extra fuel cost due to extended service area coverage",
    recordedBy: "Vijay Singh (Washer)",
    createdAt: "2026-03-13T18:45:00Z",
  },
  {
    id: "oh-act-005",
    overheadCategoryId: "oh-002", // Mobile Data Plan
    scope: "Company",
    date: "2026-03-10",
    actualAmount: 800,
    description: "Additional data pack purchased for route optimization app testing",
    reference: "Telecom Bill TB-2026-03-10",
    recordedBy: "Amit Patel (SA)",
    createdAt: "2026-03-10T11:30:00Z",
  },
];

// ============================================
// SECTION 5: CUSTOM COST ELEMENTS
// ============================================

export const CUSTOM_COST_ELEMENTS: CustomCostElement[] = [
  {
    id: "custom-001",
    costName: "Annual Vehicle Fitness Certificate",
    scope: "Per Washer",
    scopeId: "washer-001",
    amount: 3600,
    amortizationMethod: "Spread over months",
    amortizationMonths: 12,
    effectivePeriodStart: "2026-03-01",
    effectivePeriodEnd: "2027-02-28",
    description: "Annual RTO fitness certificate for washer's service vehicle - amortized monthly",
    approvedBy: "Rajesh Kumar (SA)",
    createdAt: "2026-03-01T10:00:00Z",
    createdBy: "Priya Sharma (Admin)",
  },
  {
    id: "custom-002",
    costName: "Zone Launch Marketing Cost — Surat 395003",
    scope: "Per Zone",
    scopeId: "395003",
    amount: 45000,
    amortizationMethod: "Spread over months",
    amortizationMonths: 6,
    effectivePeriodStart: "2026-03-01",
    effectivePeriodEnd: "2026-08-31",
    description: "One-time marketing blitz for Surat 395003 zone launch - spread over 6 months",
    approvedBy: "Amit Patel (SA)",
    createdAt: "2026-02-28T14:30:00Z",
    createdBy: "Vikram Reddy (Admin)",
  },
  {
    id: "custom-003",
    costName: "Washer Training Program Fee — Advanced Detailing",
    scope: "Company-Wide",
    amount: 24000,
    amortizationMethod: "Spread over months",
    amortizationMonths: 3,
    effectivePeriodStart: "2026-03-01",
    effectivePeriodEnd: "2026-05-31",
    description: "External training program for all washers - 3-month certification course",
    approvedBy: "Rajesh Kumar (SA)",
    createdAt: "2026-02-25T16:00:00Z",
    createdBy: "Neha Singh (Admin)",
  },
  {
    id: "custom-004",
    costName: "Premium Customer Welcome Kit",
    scope: "Per Zone",
    scopeId: "395005",
    amount: 18000,
    amortizationMethod: "One-Time in this period",
    effectivePeriodStart: "2026-03-01",
    effectivePeriodEnd: "2026-03-31",
    description: "Welcome kits for new Elite Plus subscribers in March - promotional campaign",
    approvedBy: "Priya Sharma (Admin)",
    createdAt: "2026-03-01T09:30:00Z",
    createdBy: "Neha Singh (Admin)",
  },
  {
    id: "custom-005",
    costName: "Equipment Insurance — Annual Premium",
    scope: "Per Supervisor",
    scopeId: "supervisor-001",
    amount: 12000,
    amortizationMethod: "Spread over months",
    amortizationMonths: 12,
    effectivePeriodStart: "2026-01-01",
    effectivePeriodEnd: "2026-12-31",
    description: "Annual equipment insurance for all assets under Karthik's supervision",
    approvedBy: "Amit Patel (SA)",
    createdAt: "2026-01-01T10:00:00Z",
    createdBy: "Rajesh Kumar (SA)",
  },
  {
    id: "custom-006",
    costName: "Customer Retention Gift Vouchers",
    scope: "Company-Wide",
    amount: 15000,
    amortizationMethod: "One-Time in this period",
    effectivePeriodStart: "2026-03-01",
    effectivePeriodEnd: "2026-03-31",
    description: "Gift vouchers for customers completing 1 year subscription - March batch",
    approvedBy: "Rajesh Kumar (SA)",
    createdAt: "2026-03-01T11:45:00Z",
    createdBy: "Priya Sharma (Admin)",
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get consumable actual inputs for a specific washer and date range
 */
export function getConsumableActualInputs(
  washerId: string,
  startDate: Date,
  endDate: Date
): ConsumableActualInput[] {
  return CONSUMABLE_ACTUAL_INPUTS.filter(
    (input) =>
      input.washerId === washerId &&
      new Date(input.date) >= startDate &&
      new Date(input.date) <= endDate
  );
}

/**
 * Get equipment actual inputs for a specific washer and date range
 */
export function getEquipmentActualInputs(
  washerId: string,
  startDate: Date,
  endDate: Date
): EquipmentActualInput[] {
  return EQUIPMENT_ACTUAL_INPUTS.filter(
    (input) =>
      input.washerId === washerId &&
      new Date(input.date) >= startDate &&
      new Date(input.date) <= endDate
  );
}

/**
 * Get salary actual inputs for a specific employee and date range
 */
export function getSalaryActualInputs(
  employeeId: string,
  startDate: Date,
  endDate: Date
): SalaryActualInput[] {
  return SALARY_ACTUAL_INPUTS.filter(
    (input) =>
      input.employeeId === employeeId &&
      new Date(input.date) >= startDate &&
      new Date(input.date) <= endDate
  );
}

/**
 * Get overhead actual inputs for a specific scope and date range
 */
export function getOverheadActualInputs(
  scope: "Washer" | "Zone" | "Company",
  scopeId: string | undefined,
  startDate: Date,
  endDate: Date
): OverheadActualInput[] {
  return OVERHEAD_ACTUAL_INPUTS.filter((input) => {
    const dateMatch =
      new Date(input.date) >= startDate && new Date(input.date) <= endDate;
    
    if (scope === "Company") {
      return dateMatch && input.scope === "Company";
    }
    
    return (
      dateMatch && input.scope === scope && input.scopeId === scopeId
    );
  });
}

/**
 * Get custom cost elements applicable to a scope
 */
export function getCustomCostElements(
  scope: "Company-Wide" | "Per City" | "Per Zone" | "Per Supervisor" | "Per Washer",
  scopeId?: string,
  asOfDate?: Date
): CustomCostElement[] {
  const targetDate = asOfDate || new Date();
  
  return CUSTOM_COST_ELEMENTS.filter((element) => {
    // Check if element is active for the target date
    const start = new Date(element.effectivePeriodStart);
    const end = new Date(element.effectivePeriodEnd);
    const isActive = targetDate >= start && targetDate <= end;
    
    if (!isActive) return false;
    
    // Check scope match
    if (element.scope === "Company-Wide") return true;
    if (element.scope !== scope) return false;
    if (scopeId && element.scopeId !== scopeId) return false;
    
    return true;
  });
}

/**
 * Calculate monthly cost for a custom element
 */
export function calculateCustomElementMonthlyCost(element: CustomCostElement): number {
  if (element.amortizationMethod === "One-Time in this period") {
    // One-time cost for the single month/period
    return element.amount;
  } else if (element.amortizationMethod === "Spread over months" && element.amortizationMonths) {
    // Spread over multiple months
    return element.amount / element.amortizationMonths;
  }
  
  return 0;
}

/**
 * Calculate total actual consumable cost for a washer in a period
 */
export function calculateActualConsumableCost(
  washerId: string,
  startDate: Date,
  endDate: Date
): number {
  const inputs = getConsumableActualInputs(washerId, startDate, endDate);
  return inputs.reduce((sum, input) => sum + input.totalCost, 0);
}

/**
 * Calculate total actual equipment cost for a washer in a period
 */
export function calculateActualEquipmentCost(
  washerId: string,
  startDate: Date,
  endDate: Date
): number {
  const inputs = getEquipmentActualInputs(washerId, startDate, endDate);
  return inputs.reduce((sum, input) => sum + input.actualCostIncurred, 0);
}

/**
 * Calculate total salary adjustments for an employee in a period
 */
export function calculateSalaryAdjustments(
  employeeId: string,
  startDate: Date,
  endDate: Date
): number {
  const inputs = getSalaryActualInputs(employeeId, startDate, endDate);
  return inputs.reduce((sum, input) => sum + input.amount, 0);
}

/**
 * Calculate total overhead actual costs for a scope in a period
 */
export function calculateOverheadActualCost(
  scope: "Washer" | "Zone" | "Company",
  scopeId: string | undefined,
  startDate: Date,
  endDate: Date
): number {
  const inputs = getOverheadActualInputs(scope, scopeId, startDate, endDate);
  return inputs.reduce((sum, input) => sum + input.actualAmount, 0);
}

/**
 * Calculate total custom cost per wash for a scope
 */
export function calculateCustomCostPerWash(
  scope: "Company-Wide" | "Per City" | "Per Zone" | "Per Supervisor" | "Per Washer",
  scopeId: string | undefined,
  monthlyWashes: number,
  asOfDate?: Date
): number {
  const elements = getCustomCostElements(scope, scopeId, asOfDate);
  const totalMonthlyCost = elements.reduce(
    (sum, element) => sum + calculateCustomElementMonthlyCost(element),
    0
  );
  
  return monthlyWashes > 0 ? totalMonthlyCost / monthlyWashes : 0;
}

/**
 * Get reason badge color for consumable consumption
 */
export function getConsumableReasonColor(reason: string): string {
  switch (reason) {
    case "Standard Usage":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "Additional Usage — Heavily Soiled Vehicle":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Product Applied Incorrectly — Wastage":
      return "bg-red-100 text-red-800 border-red-200";
    case "Training Demonstration":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Equipment Cleaning":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-purple-100 text-purple-800 border-purple-200";
  }
}

/**
 * Get event type badge color for equipment
 */
export function getEquipmentEventColor(eventType: string): string {
  switch (eventType) {
    case "Part Replacement":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Premature Wear — Replaced Before End of Useful Life":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Accidental Damage — Non-F&F":
      return "bg-red-100 text-red-800 border-red-200";
    case "External Repair Cost":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Get adjustment type badge color for salary
 */
export function getSalaryAdjustmentColor(adjustmentType: string): string {
  switch (adjustmentType) {
    case "Overtime":
    case "Special Allowance":
    case "Bonus":
    case "Other Addition":
      return "bg-green-100 text-green-800 border-green-200";
    case "Advance Recovery":
    case "Other Deduction":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}
