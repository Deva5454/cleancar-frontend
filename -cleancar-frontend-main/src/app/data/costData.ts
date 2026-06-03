// Centralized Cost Data - Single Source of Truth
// All cost calculations should reference this file for consistency

import { CURRENT_PLAN_VERSION, type VehicleCategory, type PlanType } from "./subscriptionPlans";

// ============================================
// PRICE HISTORY & STANDARD USAGE RATE HISTORY
// ============================================

export type PriceChangeReason = 
  | "GRN Batch Receipt"
  | "Supplier Price Revision"
  | "Market Rate Change"
  | "New Supplier"
  | "Bulk Discount Negotiated"
  | "Other";

export interface PriceHistoryRecord {
  id: string;
  materialId: string;
  effectiveDate: string; // ISO date string
  costPerUnit: number;
  source: "GRN" | "Manual";
  // GRN-specific fields
  batchNumber?: string;
  quantityReceived?: number;
  supplier?: string;
  grnId?: string;
  // Manual entry fields
  reason?: PriceChangeReason;
  reference?: string; // Supplier communication or contract reference
  approvedBy?: string;
  isScheduled?: boolean; // Future-dated price change
  notes?: string;
  createdAt: string;
}

export type UsageRateChangeReason =
  | "Optimized for Quality"
  | "Supplier Product Strength Change"
  | "Quality Complaint Investigation"
  | "Seasonal Adjustment"
  | "Cost Reduction Initiative"
  | "Other";

export interface StandardUsageRateHistory {
  id: string;
  materialId: string;
  packageName: string;
  effectiveDate: string; // ISO date string
  standardQuantity: number;
  reason: UsageRateChangeReason;
  approvedBy: string;
  notes?: string;
  createdAt: string;
}

// ============================================
// EQUIPMENT COST TRACKING
// ============================================

export type EquipmentUsefulLifeReason =
  | "Initial Setup"
  | "Durability Improvement Observed"
  | "Quality Degradation Observed"
  | "Supplier Product Change"
  | "Maintenance Practice Change"
  | "Other";

export interface EquipmentCategory {
  id: string;
  categoryName: string;
  subCategory: string;
  defaultUsefulLifeMonths: number;
  defaultResidualValuePercent: number;
  averagePurchaseCost: number;
  status: "Active" | "Inactive";
  createdAt: string;
  createdBy: string;
}

export interface EquipmentUsefulLifeHistory {
  id: string;
  categoryId: string;
  effectiveDate: string;
  newUsefulLifeMonths: number;
  applyTo: "New Equipment Only" | "All Active Equipment";
  reason: EquipmentUsefulLifeReason;
  approvedBy: string;
  notes?: string;
  createdAt: string;
}

export interface Equipment {
  id: string;
  categoryId: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  usefulLifeMonths: number; // Can be different from category default
  residualValuePercent: number;
  assignedToWasherId?: string;
  assignmentDate?: string;
  status: "Active" | "Retired" | "Under Repair";
  retirementDate?: string;
  retirementReason?: string;
  retirementBookValue?: number;
}

// ============================================
// SALARY & MANPOWER TRACKING
// ============================================

export type SalaryChangeReason =
  | "Joining Salary"
  | "Annual Increment"
  | "Performance Revision"
  | "Promotion"
  | "Market Correction"
  | "Special Recognition"
  | "Other";

export interface SalaryHistoryRecord {
  id: string;
  employeeId: string;
  effectiveDate: string;
  monthlyGrossSalary: number;
  reason: SalaryChangeReason;
  approvedBy: string;
  reference?: string; // HR letter number or appraisal reference
  notes?: string;
  createdAt: string;
  recordedBy: string;
}

export type IdealParameterType =
  | "Cars Per Washer Per Day"
  | "Washers Per Supervisor"
  | "Working Days Per Month";

export interface IdealParameterHistory {
  id: string;
  parameterType: IdealParameterType;
  effectiveDate: string;
  newValue: number;
  reason: string;
  approvedBy: string; // SA only
  notes?: string;
  createdAt: string;
}

export interface WorkingDaysCalendar {
  id: string;
  year: number;
  month: number; // 1-12
  workingDays: number;
  reason?: string; // Holiday details
  updatedBy: string;
  updatedAt: string;
}

// ============================================
// OVERHEAD COST TRACKING
// ============================================

export type OverheadCostType =
  | "Fixed Monthly Amount"
  | "Per Washer Per Month"
  | "Per Zone Per Month"
  | "Per Wash Direct";

export type OverheadAllocationMethod =
  | "Divide by Total Company Washes"
  | "Divide by Zone Washes"
  | "Divide by Washer Washes"
  | "Direct per Wash";

export type OverheadApplicability =
  | "All Washers"
  | "Specific Zone"
  | "Specific Washers";

export interface OverheadItemDynamic {
  id: string;
  itemName: string;
  description: string;
  costType: OverheadCostType;
  
  // Amount fields - only relevant one is used based on costType
  fixedMonthlyAmount?: number; // For Fixed Monthly Amount
  perWasherAmount?: number; // For Per Washer Per Month
  perZoneAmount?: number; // For Per Zone Per Month
  perWashAmount?: number; // For Per Wash Direct
  
  allocationMethod: OverheadAllocationMethod;
  effectiveDate: string; // ISO date string
  
  // Applicability
  applicability: OverheadApplicability;
  specificZone?: string; // If applicability is "Specific Zone"
  specificWashers?: string[]; // If applicability is "Specific Washers"
  
  status: "Active" | "Inactive";
  createdBy: string;
  createdAt: string;
}

export type OverheadRevisionReason =
  | "Price Increase from Vendor"
  | "Price Decrease from Vendor"
  | "Usage Pattern Change"
  | "New Service Provider"
  | "Regulatory Change"
  | "Business Decision"
  | "Other";

export interface OverheadRevisionHistory {
  id: string;
  overheadItemId: string;
  effectiveDate: string;
  previousAmount: number;
  newAmount: number;
  reason: OverheadRevisionReason;
  approvedBy: string;
  notes?: string;
  createdAt: string;
}

// ============================================
// ACTUAL CONSUMED AMOUNT INPUT SYSTEM
// ============================================

// Section 1: Consumable Actual Input
export type ConsumableConsumptionReason =
  | "Standard Usage"
  | "Additional Usage — Heavily Soiled Vehicle"
  | "Product Applied Incorrectly — Wastage"
  | "Training Demonstration"
  | "Equipment Cleaning"
  | "Other";

export interface ConsumableActualInput {
  id: string;
  washerId: string;
  date: string; // ISO date
  materialId: string;
  quantityConsumed: number;
  unit: string;
  reason: ConsumableConsumptionReason;
  jobReference?: string; // Job ID if linked to specific job
  recordedBy: string;
  createdAt: string;
  // Automatically calculated from FIFO
  batchCostPerUnit: number;
  totalCost: number;
}

// Section 2: Equipment Wear Actual Input
export type EquipmentEventType =
  | "Part Replacement"
  | "Premature Wear — Replaced Before End of Useful Life"
  | "Accidental Damage — Non-F&F"
  | "External Repair Cost";

export interface EquipmentActualInput {
  id: string;
  washerId: string;
  date: string;
  equipmentId: string;
  eventType: EquipmentEventType;
  actualCostIncurred: number;
  description: string;
  reference?: string; // Maintenance log or purchase record
  recordedBy: string;
  createdAt: string;
}

// Section 3: Salary Actual Input
export type SalaryAdjustmentType =
  | "Overtime"
  | "Special Allowance"
  | "Bonus"
  | "Advance Recovery"
  | "Other Deduction"
  | "Other Addition";

export interface SalaryActualInput {
  id: string;
  employeeId: string;
  date: string;
  adjustmentType: SalaryAdjustmentType;
  amount: number; // Positive for additions, negative for deductions
  reason: string;
  reference?: string; // Payroll reference number
  recordedBy: string;
  createdAt: string;
}

// Section 4: Overhead Actual Input
export interface OverheadActualInput {
  id: string;
  overheadCategoryId: string; // Links to overhead item
  scope: "Washer" | "Zone" | "Company";
  scopeId?: string; // Washer ID or Zone name if not company-wide
  date: string;
  actualAmount: number;
  description: string;
  reference?: string;
  recordedBy: string;
  createdAt: string;
}

// Section 5: Custom Cost Element
export type CustomCostScope =
  | "Company-Wide"
  | "Per City"
  | "Per Zone"
  | "Per Supervisor"
  | "Per Washer";

export type AmortizationMethod = "One-Time in this period" | "Spread over months";

export interface CustomCostElement {
  id: string;
  costName: string;
  scope: CustomCostScope;
  scopeId?: string; // City/Zone/Supervisor/Washer ID
  amount: number;
  amortizationMethod: AmortizationMethod;
  amortizationMonths?: number; // Required if "Spread over months"
  effectivePeriodStart: string; // ISO date
  effectivePeriodEnd: string; // ISO date
  description: string;
  approvedBy: string; // Admin/SA only
  createdAt: string;
  createdBy: string;
}

// ============================================
// MATERIAL COSTS
// ============================================

export interface Material {
  id: string;
  name: string;
  unitOfMeasure: string;
  costPerUnit: number;
  shelfLife: number;
  supplier: string;
  status: "Active" | "Inactive";
  usageMapping: {
    package: string;
    quantityPerWash: number;
  }[];
  // New fields for dynamic cost tracking
  priceHistory?: PriceHistoryRecord[];
  usageRateHistory?: StandardUsageRateHistory[];
}

export const MATERIALS: Material[] = [
  {
    id: "1",
    name: "Foam Shampoo",
    unitOfMeasure: "ml",
    costPerUnit: 0.8,
    shelfLife: 365,
    supplier: "ChemClean Suppliers",
    status: "Active",
    usageMapping: [
      { package: "Shampoo Wash", quantityPerWash: 50 },
      { package: "Shampoo+Wax", quantityPerWash: 50 },
      { package: "Shampoo+Polish", quantityPerWash: 40 },
    ],
  },
  {
    id: "2",
    name: "Wax Coating",
    unitOfMeasure: "ml",
    costPerUnit: 2.5,
    shelfLife: 180,
    supplier: "Premium Auto Care",
    status: "Active",
    usageMapping: [
      { package: "Shampoo+Wax", quantityPerWash: 20 },
    ],
  },
  {
    id: "3",
    name: "Tyre Polish",
    unitOfMeasure: "ml",
    costPerUnit: 1.2,
    shelfLife: 240,
    supplier: "TyreShine Ltd",
    status: "Active",
    usageMapping: [
      { package: "Shampoo Wash", quantityPerWash: 15 },
      { package: "Shampoo+Wax", quantityPerWash: 15 },
      { package: "Shampoo+Polish", quantityPerWash: 12 },
    ],
  },
  {
    id: "4",
    name: "Microfiber Cloth",
    unitOfMeasure: "pcs",
    costPerUnit: 15,
    shelfLife: 90,
    supplier: "Textile Supplies Co",
    status: "Active",
    usageMapping: [
      { package: "Water Wash", quantityPerWash: 1 },
      { package: "Shampoo Wash", quantityPerWash: 1 },
      { package: "Shampoo+Wax", quantityPerWash: 2 },
      { package: "Shampoo+Polish", quantityPerWash: 1 },
    ],
  },
  {
    id: "5",
    name: "Interior Fragrance",
    unitOfMeasure: "ml",
    costPerUnit: 3.0,
    shelfLife: 365,
    supplier: "AromaFresh India",
    status: "Active",
    usageMapping: [
      { package: "Shampoo+Wax", quantityPerWash: 5 },
    ],
  },
  {
    id: "6",
    name: "Dashboard Polish",
    unitOfMeasure: "ml",
    costPerUnit: 1.8,
    shelfLife: 300,
    supplier: "CarCare Plus",
    status: "Active",
    usageMapping: [
      { package: "Shampoo+Wax", quantityPerWash: 10 },
    ],
  },
  {
    id: "7",
    name: "Glass Cleaner",
    unitOfMeasure: "ml",
    costPerUnit: 0.6,
    shelfLife: 365,
    supplier: "ClearView Solutions",
    status: "Active",
    usageMapping: [
      { package: "Water Wash", quantityPerWash: 15 },
      { package: "Shampoo Wash", quantityPerWash: 20 },
      { package: "Shampoo+Wax", quantityPerWash: 20 },
      { package: "Shampoo+Polish", quantityPerWash: 15 },
    ],
  },
  {
    id: "8",
    name: "Wheel Cleaner",
    unitOfMeasure: "ml",
    costPerUnit: 0.9,
    shelfLife: 365,
    supplier: "AutoChem Industries",
    status: "Active",
    usageMapping: [
      { package: "Shampoo Wash", quantityPerWash: 30 },
      { package: "Shampoo+Wax", quantityPerWash: 30 },
      { package: "Shampoo+Polish", quantityPerWash: 25 },
    ],
  },
];

// ============================================
// LEGACY OVERHEAD ITEMS (for backward compatibility)
// ============================================

export interface OverheadItem {
  id: string;
  name: string;
  monthlyCost: number;
  excludeFromCalculation?: boolean;
}

// Legacy overhead items - kept for backward compatibility with existing components
export const OVERHEAD_ITEMS: OverheadItem[] = [
  { id: "1", name: "Vehicle / Transport", monthlyCost: 3200, excludeFromCalculation: false },
  { id: "2", name: "Mobile Data Plan", monthlyCost: 299, excludeFromCalculation: false },
  { id: "3", name: "Uniform Amortization", monthlyCost: 220, excludeFromCalculation: false },
  { id: "4", name: "ERP Software Fee", monthlyCost: 8000, excludeFromCalculation: false },
  { id: "5", name: "Insurance", monthlyCost: 180, excludeFromCalculation: false },
  { id: "6", name: "Water Charges", monthlyCost: 624, excludeFromCalculation: false },
  { id: "7", name: "Electricity", monthlyCost: 416, excludeFromCalculation: false },
  { id: "8", name: "Foam Gun Cleaning", monthlyCost: 150, excludeFromCalculation: false },
];

// ============================================
// CONSUMABLES
// ============================================

export interface Consumable {
  id: string;
  name: string;
  unitOfMeasure: string;
  costPerUnit: number;
  avgUsagePerWash: number;
  status: "Active" | "Inactive";
}

export const CONSUMABLES: Consumable[] = [
  {
    id: "1",
    name: "Water",
    unitOfMeasure: "litres",
    costPerUnit: 0.05,
    avgUsagePerWash: 20,
    status: "Active",
  },
  {
    id: "2",
    name: "Electricity",
    unitOfMeasure: "kWh",
    costPerUnit: 8.0,
    avgUsagePerWash: 0.5,
    status: "Active",
  },
  {
    id: "3",
    name: "Foam Gun Wear",
    unitOfMeasure: "amortized",
    costPerUnit: 2.0,
    avgUsagePerWash: 1,
    status: "Active",
  },
  {
    id: "4",
    name: "Bucket & Equipment Wear",
    unitOfMeasure: "amortized",
    costPerUnit: 1.5,
    avgUsagePerWash: 1,
    status: "Active",
  },
  {
    id: "5",
    name: "Plastic Gloves",
    unitOfMeasure: "pair",
    costPerUnit: 3.0,
    avgUsagePerWash: 1,
    status: "Active",
  },
  {
    id: "6",
    name: "Microfiber Drying Towel",
    unitOfMeasure: "amortized",
    costPerUnit: 4.0,
    avgUsagePerWash: 1,
    status: "Active",
  },
];

// ============================================
// MANPOWER COSTS
// ============================================

export interface ManpowerRole {
  id: string;
  role: string;
  monthlySalary: number;
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
  washesPerHour: number;
}

export const MANPOWER_ROLES: ManpowerRole[] = [
  {
    id: "1",
    role: "Washer",
    monthlySalary: 15000,
    workingDaysPerMonth: 26,
    workingHoursPerDay: 8,
    washesPerHour: 2,
  },
  {
    id: "2",
    role: "Senior Washer",
    monthlySalary: 18000,
    workingDaysPerMonth: 26,
    workingHoursPerDay: 8,
    washesPerHour: 1.5,
  },
  {
    id: "3",
    role: "Supervisor",
    monthlySalary: 25000,
    workingDaysPerMonth: 26,
    workingHoursPerDay: 8,
    washesPerHour: 0, // Allocated across team
  },
];

// ============================================
// CONFIGURATION
// ============================================

export const TARGET_EBITDA_MARGIN = 60; // 60%
export const AVG_WASHES_PER_MONTH = 520; // Zone average

// ============================================
// CALCULATION FUNCTIONS
// ============================================

// Calculate material cost for a specific package
export function calculateMaterialCost(packageName: string): number {
  let totalCost = 0;
  
  MATERIALS.filter(m => m.status === "Active").forEach((material) => {
    const mapping = material.usageMapping.find((m) => m.package === packageName);
    if (mapping) {
      totalCost += mapping.quantityPerWash * material.costPerUnit;
    }
  });
  
  return totalCost;
}

// Calculate consumables cost (same for all packages)
export function calculateConsumablesCost(): number {
  return CONSUMABLES.filter(c => c.status === "Active").reduce(
    (sum, c) => sum + c.costPerUnit * c.avgUsagePerWash,
    0
  );
}

// Calculate manpower cost per wash
export function calculateManpowerCost(washesPerHour: number = 2): number {
  const washerRole = MANPOWER_ROLES.find((r) => r.role === "Washer");
  const supervisorRole = MANPOWER_ROLES.find((r) => r.role === "Supervisor");
  
  if (!washerRole || !supervisorRole) return 0;
  
  // Washer cost per wash
  const washerCost =
    washerRole.monthlySalary /
    (washerRole.workingDaysPerMonth * washerRole.workingHoursPerDay * washesPerHour);
  
  // Supervisor cost allocated across average monthly washes
  const supervisorCost = supervisorRole.monthlySalary / AVG_WASHES_PER_MONTH;
  
  return washerCost + supervisorCost;
}

// Calculate overhead cost per wash
export function calculateOverheadCost(): number {
  const activeOverheads = OVERHEAD_ITEMS.filter((o) => !o.excludeFromCalculation);
  const totalMonthlyCost = activeOverheads.reduce((sum, o) => sum + o.monthlyCost, 0);
  return totalMonthlyCost / AVG_WASHES_PER_MONTH;
}

// Calculate total company cost per wash for a package
export function calculateTotalCompanyCost(packageName: string, washesPerHour: number = 2): number {
  const materialCost = calculateMaterialCost(packageName);
  const consumablesCost = calculateConsumablesCost();
  const manpowerCost = calculateManpowerCost(washesPerHour);
  const overheadCost = calculateOverheadCost();
  
  return materialCost + consumablesCost + manpowerCost + overheadCost;
}

// Get customer price from subscription plans
export function getCustomerPrice(
  vehicleCategory: VehicleCategory,
  planType: PlanType
): number {
  const price = CURRENT_PLAN_VERSION.pricingMatrix[vehicleCategory]?.[planType];
  return typeof price === "number" ? price : 0;
}

// Calculate EBITDA margin
export function calculateEBITDA(
  customerPricePerWash: number,
  companyCostPerWash: number
): { ebitdaAmount: number; ebitdaPercent: number } {
  const ebitdaAmount = customerPricePerWash - companyCostPerWash;
  const ebitdaPercent = (ebitdaAmount / customerPricePerWash) * 100;
  
  return {
    ebitdaAmount: isNaN(ebitdaAmount) ? 0 : ebitdaAmount,
    ebitdaPercent: isNaN(ebitdaPercent) ? 0 : ebitdaPercent,
  };
}

// Calculate required price to achieve target EBITDA
export function calculateRequiredPrice(
  companyCostPerWash: number,
  targetEBITDAPercent: number = TARGET_EBITDA_MARGIN
): number {
  return companyCostPerWash / (1 - targetEBITDAPercent / 100);
}

// Get average washes per month by package
export function getAvgWashesPerMonth(packageName: string): number {
  const washFrequency: Record<string, number> = {
    "Water Wash": 26, // Daily (Mon-Sat)
    "Shampoo Wash": 26, // Daily (Mon-Sat)
    "Shampoo+Wax": 26, // Daily (Mon-Sat) with weekly interior
    "Shampoo+Polish": 26, // Daily (Mon-Sat) for 2-wheelers
  };

  return washFrequency[packageName] || 26;
}

// Calculate cost per wash to customer (monthly price / washes)
export function calculateCostPerWashToCustomer(
  monthlyPrice: number,
  packageName: string
): number {
  const washesPerMonth = getAvgWashesPerMonth(packageName);
  return monthlyPrice / washesPerMonth;
}

// ============================================
// PACKAGE COST BREAKDOWN
// ============================================

export interface PackageCostBreakdown {
  package: string;
  materialCost: number;
  consumableCost: number;
  manpowerCost: number;
  overheadCost: number;
  totalCompanyCost: number;
  customerMonthlyPrice: number;
  avgWashesPerMonth: number;
  costPerWashToCustomer: number;
  ebitdaPerWash: number;
  ebitdaPercent: number;
  status: "Above Target" | "Near Target" | "Below Target";
}

export function getPackageCostBreakdown(
  vehicleCategory: VehicleCategory
): PackageCostBreakdown[] {
  const packages: PlanType[] = [
    "Water Wash",
    "Shampoo Wash",
    "Shampoo+Wax",
    "Shampoo+Polish",
  ];

  return packages.map((pkg) => {
    const materialCost = calculateMaterialCost(pkg);
    const consumableCost = calculateConsumablesCost();

    // Adjust manpower based on package complexity
    let washesPerHour = 2;
    if (pkg === "Shampoo+Wax") washesPerHour = 1.5; // Includes interior + wax
    if (pkg === "Shampoo+Polish") washesPerHour = 1.5; // 2-wheeler polish work
    
    const manpowerCost = calculateManpowerCost(washesPerHour);
    const overheadCost = calculateOverheadCost();
    const totalCompanyCost = materialCost + consumableCost + manpowerCost + overheadCost;
    
    const customerMonthlyPrice = getCustomerPrice(vehicleCategory, pkg);
    const avgWashesPerMonth = getAvgWashesPerMonth(pkg);
    const costPerWashToCustomer = calculateCostPerWashToCustomer(
      customerMonthlyPrice,
      pkg
    );
    
    const { ebitdaAmount, ebitdaPercent } = calculateEBITDA(
      costPerWashToCustomer,
      totalCompanyCost
    );
    
    let status: "Above Target" | "Near Target" | "Below Target";
    if (ebitdaPercent >= TARGET_EBITDA_MARGIN) {
      status = "Above Target";
    } else if (ebitdaPercent >= TARGET_EBITDA_MARGIN - 5) {
      status = "Near Target";
    } else {
      status = "Below Target";
    }
    
    return {
      package: pkg,
      materialCost,
      consumableCost,
      manpowerCost,
      overheadCost,
      totalCompanyCost,
      customerMonthlyPrice,
      avgWashesPerMonth,
      costPerWashToCustomer,
      ebitdaPerWash: ebitdaAmount,
      ebitdaPercent,
      status,
    };
  });
}