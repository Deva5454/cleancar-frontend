// Equipment & Salary History Data - Mock Data
// This file contains comprehensive historical tracking for equipment and salaries

import {
  type EquipmentCategory,
  type EquipmentUsefulLifeHistory,
  type Equipment,
  type SalaryHistoryRecord,
  type IdealParameterHistory,
  type WorkingDaysCalendar,
} from "./costData";

// ============================================
// EQUIPMENT CATEGORIES
// ============================================

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  {
    id: "eq-cat-1",
    categoryName: "Foam Gun",
    subCategory: "Washing Equipment",
    defaultUsefulLifeMonths: 24,
    defaultResidualValuePercent: 10,
    averagePurchaseCost: 2500,
    status: "Active",
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "Admin Setup",
  },
  {
    id: "eq-cat-2",
    categoryName: "Pressure Washer",
    subCategory: "Washing Equipment",
    defaultUsefulLifeMonths: 36,
    defaultResidualValuePercent: 15,
    averagePurchaseCost: 15000,
    status: "Active",
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "Admin Setup",
  },
  {
    id: "eq-cat-3",
    categoryName: "Vacuum Cleaner",
    subCategory: "Interior Cleaning",
    defaultUsefulLifeMonths: 30,
    defaultResidualValuePercent: 10,
    averagePurchaseCost: 8500,
    status: "Active",
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "Admin Setup",
  },
  {
    id: "eq-cat-4",
    categoryName: "Water Tank",
    subCategory: "Storage Equipment",
    defaultUsefulLifeMonths: 60,
    defaultResidualValuePercent: 20,
    averagePurchaseCost: 5000,
    status: "Active",
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "Admin Setup",
  },
  {
    id: "eq-cat-5",
    categoryName: "Bucket Set",
    subCategory: "Washing Equipment",
    defaultUsefulLifeMonths: 12,
    defaultResidualValuePercent: 0,
    averagePurchaseCost: 800,
    status: "Active",
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "Admin Setup",
  },
  {
    id: "eq-cat-6",
    categoryName: "Microfiber Towel Set",
    subCategory: "Cleaning Materials",
    defaultUsefulLifeMonths: 6,
    defaultResidualValuePercent: 0,
    averagePurchaseCost: 1200,
    status: "Active",
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "Admin Setup",
  },
  {
    id: "eq-cat-7",
    categoryName: "Polishing Machine",
    subCategory: "Finishing Equipment",
    defaultUsefulLifeMonths: 24,
    defaultResidualValuePercent: 12,
    averagePurchaseCost: 6500,
    status: "Active",
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "Admin Setup",
  },
];

// ============================================
// EQUIPMENT USEFUL LIFE HISTORY
// ============================================

export const EQUIPMENT_USEFUL_LIFE_HISTORY: EquipmentUsefulLifeHistory[] = [
  {
    id: "eul-1",
    categoryId: "eq-cat-1",
    effectiveDate: "2025-01-01",
    newUsefulLifeMonths: 24,
    applyTo: "New Equipment Only",
    reason: "Initial Setup",
    approvedBy: "Rajesh Kumar (SA)",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "eul-2",
    categoryId: "eq-cat-1",
    effectiveDate: "2025-09-01",
    newUsefulLifeMonths: 30,
    applyTo: "All Active Equipment",
    reason: "Durability Improvement Observed",
    approvedBy: "Priya Sharma (Admin)",
    notes: "New supplier foam guns showing better durability - extending useful life from 24 to 30 months based on 8 months of field data",
    createdAt: "2025-08-25T14:30:00Z",
  },
  {
    id: "eul-3",
    categoryId: "eq-cat-3",
    effectiveDate: "2025-06-15",
    newUsefulLifeMonths: 30,
    applyTo: "New Equipment Only",
    reason: "Initial Setup",
    approvedBy: "Amit Patel (SA)",
    createdAt: "2025-06-15T00:00:00Z",
  },
  {
    id: "eul-4",
    categoryId: "eq-cat-3",
    effectiveDate: "2025-11-01",
    newUsefulLifeMonths: 36,
    applyTo: "New Equipment Only",
    reason: "Supplier Product Change",
    approvedBy: "Vikram Reddy (SA)",
    notes: "New industrial-grade vacuum cleaners from Karcher - manufacturer warranty 3 years",
    createdAt: "2025-10-28T11:15:00Z",
  },
  {
    id: "eul-5",
    categoryId: "eq-cat-6",
    effectiveDate: "2025-07-01",
    newUsefulLifeMonths: 6,
    applyTo: "New Equipment Only",
    reason: "Initial Setup",
    approvedBy: "Neha Singh (Admin)",
    createdAt: "2025-07-01T00:00:00Z",
  },
  {
    id: "eul-6",
    categoryId: "eq-cat-6",
    effectiveDate: "2026-01-10",
    newUsefulLifeMonths: 4,
    applyTo: "All Active Equipment",
    reason: "Quality Degradation Observed",
    approvedBy: "Rajesh Kumar (SA)",
    notes: "Microfiber towels wearing out faster than expected due to daily use intensity - reducing from 6 to 4 months",
    createdAt: "2026-01-05T16:20:00Z",
  },
];

// ============================================
// EQUIPMENT RECORDS
// ============================================

export const EQUIPMENT_RECORDS: Equipment[] = [
  // Foam Guns
  {
    id: "eq-fg-001",
    categoryId: "eq-cat-1",
    serialNumber: "FG-2025-001",
    purchaseDate: "2025-03-01",
    purchaseCost: 2400,
    usefulLifeMonths: 30, // Updated from 24 after Sep 2025 revision
    residualValuePercent: 10,
    assignedToWasherId: "washer-001",
    assignmentDate: "2025-03-01",
    status: "Active",
  },
  {
    id: "eq-fg-002",
    categoryId: "eq-cat-1",
    serialNumber: "FG-2025-002",
    purchaseDate: "2025-03-15",
    purchaseCost: 2500,
    usefulLifeMonths: 30,
    residualValuePercent: 10,
    assignedToWasherId: "washer-002",
    assignmentDate: "2025-03-15", // Mid-month assignment
    status: "Active",
  },
  {
    id: "eq-fg-003",
    categoryId: "eq-cat-1",
    serialNumber: "FG-2025-003",
    purchaseDate: "2025-06-10",
    purchaseCost: 2550,
    usefulLifeMonths: 30,
    residualValuePercent: 10,
    assignedToWasherId: "washer-003",
    assignmentDate: "2025-06-10",
    status: "Active",
  },
  {
    id: "eq-fg-004",
    categoryId: "eq-cat-1",
    serialNumber: "FG-2024-015",
    purchaseDate: "2024-08-01",
    purchaseCost: 2300,
    usefulLifeMonths: 24, // Original useful life before Sep 2025
    residualValuePercent: 10,
    assignedToWasherId: "washer-004",
    assignmentDate: "2024-08-01",
    status: "Retired",
    retirementDate: "2025-10-20",
    retirementReason: "Motor failure - beyond repair",
    retirementBookValue: 580,
  },

  // Pressure Washers
  {
    id: "eq-pw-001",
    categoryId: "eq-cat-2",
    serialNumber: "PW-2025-001",
    purchaseDate: "2025-02-15",
    purchaseCost: 14500,
    usefulLifeMonths: 36,
    residualValuePercent: 15,
    assignedToWasherId: "washer-001",
    assignmentDate: "2025-02-15",
    status: "Active",
  },
  {
    id: "eq-pw-002",
    categoryId: "eq-cat-2",
    serialNumber: "PW-2025-002",
    purchaseDate: "2025-04-01",
    purchaseCost: 15200,
    usefulLifeMonths: 36,
    residualValuePercent: 15,
    assignedToWasherId: "washer-002",
    assignmentDate: "2025-04-01",
    status: "Active",
  },

  // Vacuum Cleaners
  {
    id: "eq-vc-001",
    categoryId: "eq-cat-3",
    serialNumber: "VC-2025-001",
    purchaseDate: "2025-07-05",
    purchaseCost: 8200,
    usefulLifeMonths: 30,
    residualValuePercent: 10,
    assignedToWasherId: "washer-001",
    assignmentDate: "2025-07-05",
    status: "Active",
  },
  {
    id: "eq-vc-002",
    categoryId: "eq-cat-3",
    serialNumber: "VC-2025-002",
    purchaseDate: "2025-11-15", // New Karcher model
    purchaseCost: 9500,
    usefulLifeMonths: 36,
    residualValuePercent: 10,
    assignedToWasherId: "washer-002",
    assignmentDate: "2025-11-15",
    status: "Active",
  },

  // Water Tanks
  {
    id: "eq-wt-001",
    categoryId: "eq-cat-4",
    serialNumber: "WT-2025-001",
    purchaseDate: "2025-01-10",
    purchaseCost: 4800,
    usefulLifeMonths: 60,
    residualValuePercent: 20,
    assignedToWasherId: "washer-001",
    assignmentDate: "2025-01-10",
    status: "Active",
  },

  // Bucket Sets
  {
    id: "eq-bs-001",
    categoryId: "eq-cat-5",
    serialNumber: "BS-2025-001",
    purchaseDate: "2025-03-01",
    purchaseCost: 750,
    usefulLifeMonths: 12,
    residualValuePercent: 0,
    assignedToWasherId: "washer-001",
    assignmentDate: "2025-03-01",
    status: "Active",
  },
  {
    id: "eq-bs-002",
    categoryId: "eq-cat-5",
    serialNumber: "BS-2025-002",
    purchaseDate: "2025-05-20",
    purchaseCost: 800,
    usefulLifeMonths: 12,
    residualValuePercent: 0,
    assignedToWasherId: "washer-002",
    assignmentDate: "2025-05-20", // Mid-month assignment
    status: "Active",
  },

  // Microfiber Towel Sets
  {
    id: "eq-mt-001",
    categoryId: "eq-cat-6",
    serialNumber: "MT-2025-001",
    purchaseDate: "2025-08-01",
    purchaseCost: 1200,
    usefulLifeMonths: 4, // Updated from 6 after Jan 2026 revision
    residualValuePercent: 0,
    assignedToWasherId: "washer-001",
    assignmentDate: "2025-08-01",
    status: "Active",
  },
];

// ============================================
// SALARY HISTORY
// ============================================

export const SALARY_HISTORY: SalaryHistoryRecord[] = [
  // Washer 1 - Suresh Kumar
  {
    id: "sal-1-1",
    employeeId: "washer-001",
    effectiveDate: "2024-08-01",
    monthlyGrossSalary: 14000,
    reason: "Joining Salary",
    approvedBy: "HR - Recruitment",
    reference: "Appointment Letter AL-2024-001",
    createdAt: "2024-07-28T00:00:00Z",
    recordedBy: "Neha Singh (Admin)",
  },
  {
    id: "sal-1-2",
    employeeId: "washer-001",
    effectiveDate: "2025-08-01",
    monthlyGrossSalary: 15000,
    reason: "Annual Increment",
    approvedBy: "Rajesh Kumar (SA)",
    reference: "Appraisal Letter APR-2025-001",
    notes: "Annual increment - 7.14% increase for good performance",
    createdAt: "2025-07-25T14:30:00Z",
    recordedBy: "Priya Sharma (Admin)",
  },
  {
    id: "sal-1-3",
    employeeId: "washer-001",
    effectiveDate: "2026-03-16",
    monthlyGrossSalary: 16500,
    reason: "Performance Revision",
    approvedBy: "Amit Patel (SA)",
    reference: "Performance Review PR-2026-Q1-001",
    notes: "Mid-year performance revision for exceptional customer ratings",
    createdAt: "2026-03-10T10:15:00Z",
    recordedBy: "Vikram Reddy (Admin)",
  },

  // Washer 2 - Ramesh Patel
  {
    id: "sal-2-1",
    employeeId: "washer-002",
    effectiveDate: "2025-01-15",
    monthlyGrossSalary: 15000,
    reason: "Joining Salary",
    approvedBy: "HR - Recruitment",
    reference: "Appointment Letter AL-2025-002",
    createdAt: "2025-01-10T00:00:00Z",
    recordedBy: "Neha Singh (Admin)",
  },
  {
    id: "sal-2-2",
    employeeId: "washer-002",
    effectiveDate: "2025-07-01",
    monthlyGrossSalary: 15500,
    reason: "Performance Revision",
    approvedBy: "Priya Sharma (Admin)",
    reference: "H1 Performance Review H1-2025-002",
    notes: "Mid-year performance adjustment",
    createdAt: "2025-06-25T16:45:00Z",
    recordedBy: "Rajesh Kumar (SA)",
  },

  // Washer 3 - Dinesh Sharma
  {
    id: "sal-3-1",
    employeeId: "washer-003",
    effectiveDate: "2025-03-01",
    monthlyGrossSalary: 14500,
    reason: "Joining Salary",
    approvedBy: "HR - Recruitment",
    reference: "Appointment Letter AL-2025-003",
    createdAt: "2025-02-25T00:00:00Z",
    recordedBy: "Neha Singh (Admin)",
  },
  {
    id: "sal-3-2",
    employeeId: "washer-003",
    effectiveDate: "2025-10-01",
    monthlyGrossSalary: 15000,
    reason: "Market Correction",
    approvedBy: "Vikram Reddy (SA)",
    reference: "Market Survey MS-2025-Q3",
    notes: "Salary adjustment to match market rates and retain talent",
    createdAt: "2025-09-28T11:30:00Z",
    recordedBy: "Amit Patel (Admin)",
  },

  // Washer 4 - Vijay Singh
  {
    id: "sal-4-1",
    employeeId: "washer-004",
    effectiveDate: "2024-06-01",
    monthlyGrossSalary: 13500,
    reason: "Joining Salary",
    approvedBy: "HR - Recruitment",
    reference: "Appointment Letter AL-2024-004",
    createdAt: "2024-05-28T00:00:00Z",
    recordedBy: "Neha Singh (Admin)",
  },
  {
    id: "sal-4-2",
    employeeId: "washer-004",
    effectiveDate: "2025-06-01",
    monthlyGrossSalary: 14500,
    reason: "Annual Increment",
    approvedBy: "Rajesh Kumar (SA)",
    reference: "Appraisal Letter APR-2025-004",
    notes: "Annual increment - 7.4% increase",
    createdAt: "2025-05-28T14:00:00Z",
    recordedBy: "Priya Sharma (Admin)",
  },
  {
    id: "sal-4-3",
    employeeId: "washer-004",
    effectiveDate: "2025-12-01",
    monthlyGrossSalary: 16000,
    reason: "Promotion",
    approvedBy: "Amit Patel (SA)",
    reference: "Promotion Letter PR-2025-004",
    notes: "Promoted to Senior Washer - exceptional performance",
    createdAt: "2025-11-28T09:20:00Z",
    recordedBy: "Vikram Reddy (Admin)",
  },

  // Supervisor 1 - Karthik Menon
  {
    id: "sal-sup-1-1",
    employeeId: "supervisor-001",
    effectiveDate: "2024-07-01",
    monthlyGrossSalary: 23000,
    reason: "Joining Salary",
    approvedBy: "HR - Recruitment",
    reference: "Appointment Letter AL-2024-SUP-001",
    createdAt: "2024-06-25T00:00:00Z",
    recordedBy: "Neha Singh (Admin)",
  },
  {
    id: "sal-sup-1-2",
    employeeId: "supervisor-001",
    effectiveDate: "2025-07-01",
    monthlyGrossSalary: 25000,
    reason: "Annual Increment",
    approvedBy: "Rajesh Kumar (SA)",
    reference: "Appraisal Letter APR-2025-SUP-001",
    notes: "Annual increment - 8.7% increase for strong team management",
    createdAt: "2025-06-25T15:30:00Z",
    recordedBy: "Priya Sharma (Admin)",
  },
  {
    id: "sal-sup-1-3",
    employeeId: "supervisor-001",
    effectiveDate: "2026-02-01",
    monthlyGrossSalary: 27000,
    reason: "Special Recognition",
    approvedBy: "Amit Patel (SA)",
    reference: "Excellence Award EA-2026-001",
    notes: "Special increment for achieving 98% customer satisfaction rating",
    createdAt: "2026-01-28T10:45:00Z",
    recordedBy: "Vikram Reddy (Admin)",
  },
];

// ============================================
// IDEAL PARAMETERS HISTORY
// ============================================

export const IDEAL_PARAMETERS_HISTORY: IdealParameterHistory[] = [
  {
    id: "ip-1",
    parameterType: "Cars Per Washer Per Day",
    effectiveDate: "2025-01-01",
    newValue: 21,
    reason: "Initial business setup based on industry benchmarks",
    approvedBy: "Rajesh Kumar (SA)",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "ip-2",
    parameterType: "Cars Per Washer Per Day",
    effectiveDate: "2025-10-01",
    newValue: 24,
    reason: "Business maturity - observed higher productivity with streamlined processes",
    approvedBy: "Amit Patel (SA)",
    notes: "After 9 months of operations, washers consistently achieving 24 cars/day with new SOPs",
    createdAt: "2025-09-25T14:00:00Z",
  },
  {
    id: "ip-3",
    parameterType: "Washers Per Supervisor",
    effectiveDate: "2025-01-01",
    newValue: 17,
    reason: "Initial business setup based on span of control analysis",
    approvedBy: "Rajesh Kumar (SA)",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "ip-4",
    parameterType: "Washers Per Supervisor",
    effectiveDate: "2026-01-01",
    newValue: 20,
    reason: "Improved coordination with mobile app and automated scheduling",
    approvedBy: "Priya Sharma (SA)",
    notes: "Technology improvements allow supervisor to manage more washers effectively",
    createdAt: "2025-12-28T11:30:00Z",
  },
  {
    id: "ip-5",
    parameterType: "Working Days Per Month",
    effectiveDate: "2025-01-01",
    newValue: 26,
    reason: "Standard working days configuration",
    approvedBy: "Rajesh Kumar (SA)",
    createdAt: "2025-01-01T00:00:00Z",
  },
];

// ============================================
// WORKING DAYS CALENDAR
// ============================================

export const WORKING_DAYS_CALENDAR: WorkingDaysCalendar[] = [
  // 2025 Calendar
  { id: "wdc-2025-01", year: 2025, month: 1, workingDays: 26, updatedBy: "System", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "wdc-2025-02", year: 2025, month: 2, workingDays: 26, updatedBy: "System", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "wdc-2025-03", year: 2025, month: 3, workingDays: 25, reason: "Holi holiday", updatedBy: "Neha Singh (Admin)", updatedAt: "2025-02-28T10:00:00Z" },
  { id: "wdc-2025-04", year: 2025, month: 4, workingDays: 26, updatedBy: "System", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "wdc-2025-05", year: 2025, month: 5, workingDays: 26, updatedBy: "System", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "wdc-2025-06", year: 2025, month: 6, workingDays: 26, updatedBy: "System", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "wdc-2025-07", year: 2025, month: 7, workingDays: 26, updatedBy: "System", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "wdc-2025-08", year: 2025, month: 8, workingDays: 25, reason: "Independence Day + Raksha Bandhan", updatedBy: "Priya Sharma (Admin)", updatedAt: "2025-07-30T14:30:00Z" },
  { id: "wdc-2025-09", year: 2025, month: 9, workingDays: 26, updatedBy: "System", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "wdc-2025-10", year: 2025, month: 10, workingDays: 24, reason: "Dussehra festival period", updatedBy: "Amit Patel (Admin)", updatedAt: "2025-09-28T11:15:00Z" },
  { id: "wdc-2025-11", year: 2025, month: 11, workingDays: 25, reason: "Diwali celebrations", updatedBy: "Vikram Reddy (Admin)", updatedAt: "2025-10-29T09:45:00Z" },
  { id: "wdc-2025-12", year: 2025, month: 12, workingDays: 25, reason: "Christmas holiday", updatedBy: "Neha Singh (Admin)", updatedAt: "2025-11-28T16:00:00Z" },

  // 2026 Calendar (partial)
  { id: "wdc-2026-01", year: 2026, month: 1, workingDays: 25, reason: "Republic Day + Makar Sankranti", updatedBy: "Rajesh Kumar (SA)", updatedAt: "2025-12-30T10:30:00Z" },
  { id: "wdc-2026-02", year: 2026, month: 2, workingDays: 26, updatedBy: "System", updatedAt: "2025-12-30T10:30:00Z" },
  { id: "wdc-2026-03", year: 2026, month: 3, workingDays: 26, updatedBy: "System", updatedAt: "2025-12-30T10:30:00Z" },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate monthly depreciation for equipment
 */
export function calculateMonthlyDepreciation(equipment: Equipment): number {
  const depreciableValue = equipment.purchaseCost * (1 - equipment.residualValuePercent / 100);
  return depreciableValue / equipment.usefulLifeMonths;
}

/**
 * Calculate prorated depreciation for mid-month assignment
 */
export function calculateProratedDepreciation(
  equipment: Equipment,
  assignmentDate: Date,
  workingDaysInMonth: number = 26
): number {
  const monthlyDepreciation = calculateMonthlyDepreciation(equipment);
  const dayOfMonth = assignmentDate.getDate();
  
  // Calculate remaining working days from assignment date
  const totalDaysInMonth = new Date(
    assignmentDate.getFullYear(),
    assignmentDate.getMonth() + 1,
    0
  ).getDate();
  
  const remainingDays = totalDaysInMonth - dayOfMonth + 1;
  const remainingWorkingDays = Math.ceil((remainingDays / totalDaysInMonth) * workingDaysInMonth);
  
  return (monthlyDepreciation / workingDaysInMonth) * remainingWorkingDays;
}

/**
 * Calculate equipment write-off amount
 */
export function calculateWriteOffAmount(
  equipment: Equipment,
  retirementDate: Date
): number {
  const purchaseDate = new Date(equipment.purchaseDate);
  const monthsUsed = Math.floor(
    (retirementDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  
  const monthlyDepreciation = calculateMonthlyDepreciation(equipment);
  const totalDepreciation = monthlyDepreciation * monthsUsed;
  const bookValue = equipment.purchaseCost - totalDepreciation;
  
  return Math.max(0, bookValue);
}

/**
 * Get current salary for an employee on a specific date
 */
export function getCurrentSalary(employeeId: string, asOfDate?: Date): number {
  const targetDate = asOfDate || new Date();
  const history = SALARY_HISTORY.filter(
    (record) =>
      record.employeeId === employeeId &&
      new Date(record.effectiveDate) <= targetDate
  ).sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

  return history[0]?.monthlyGrossSalary || 0;
}

/**
 * Get salary history for an employee
 */
export function getSalaryHistory(employeeId: string): SalaryHistoryRecord[] {
  return SALARY_HISTORY.filter((record) => record.employeeId === employeeId).sort(
    (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
  );
}

/**
 * Calculate split salary for mid-month revision
 */
export function calculateSplitSalary(
  employeeId: string,
  year: number,
  month: number // 1-12
): {
  totalSalary: number;
  periods: Array<{
    startDate: Date;
    endDate: Date;
    dailySalary: number;
    days: number;
    periodSalary: number;
    monthlySalary: number;
  }>;
} {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  
  // Get working days for this month
  const workingDaysRecord = WORKING_DAYS_CALENDAR.find(
    (wdc) => wdc.year === year && wdc.month === month
  );
  const workingDays = workingDaysRecord?.workingDays || 26;

  // Get all salary changes in this month
  const salaryChanges = SALARY_HISTORY.filter((record) => {
    const effectiveDate = new Date(record.effectiveDate);
    return (
      record.employeeId === employeeId &&
      effectiveDate >= monthStart &&
      effectiveDate <= monthEnd
    );
  }).sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());

  // If no changes in this month, use the salary active at month start
  if (salaryChanges.length === 0) {
    const salary = getCurrentSalary(employeeId, monthStart);
    return {
      totalSalary: salary,
      periods: [
        {
          startDate: monthStart,
          endDate: monthEnd,
          dailySalary: salary / workingDays,
          days: workingDays,
          periodSalary: salary,
          monthlySalary: salary,
        },
      ],
    };
  }

  // Build periods
  const periods: Array<{
    startDate: Date;
    endDate: Date;
    dailySalary: number;
    days: number;
    periodSalary: number;
    monthlySalary: number;
  }> = [];

  let currentDate = monthStart;
  
  // First period (start of month to first change)
  const firstChange = new Date(salaryChanges[0].effectiveDate);
  const firstChangeDayOfMonth = firstChange.getDate();
  const daysInFirstPeriod = firstChangeDayOfMonth - 1;
  
  if (daysInFirstPeriod > 0) {
    const salaryBeforeChange = getCurrentSalary(
      employeeId,
      new Date(firstChange.getTime() - 24 * 60 * 60 * 1000) // Day before
    );
    const workingDaysInFirstPeriod = Math.ceil((daysInFirstPeriod / monthEnd.getDate()) * workingDays);
    
    periods.push({
      startDate: monthStart,
      endDate: new Date(year, month - 1, firstChangeDayOfMonth - 1),
      dailySalary: salaryBeforeChange / workingDays,
      days: workingDaysInFirstPeriod,
      periodSalary: (salaryBeforeChange / workingDays) * workingDaysInFirstPeriod,
      monthlySalary: salaryBeforeChange,
    });
  }

  // Subsequent periods
  for (let i = 0; i < salaryChanges.length; i++) {
    const change = salaryChanges[i];
    const startDate = new Date(change.effectiveDate);
    const endDate =
      i < salaryChanges.length - 1
        ? new Date(new Date(salaryChanges[i + 1].effectiveDate).getTime() - 24 * 60 * 60 * 1000)
        : monthEnd;

    const daysInPeriod = endDate.getDate() - startDate.getDate() + 1;
    const workingDaysInPeriod = Math.ceil((daysInPeriod / monthEnd.getDate()) * workingDays);

    periods.push({
      startDate,
      endDate,
      dailySalary: change.monthlyGrossSalary / workingDays,
      days: workingDaysInPeriod,
      periodSalary: (change.monthlyGrossSalary / workingDays) * workingDaysInPeriod,
      monthlySalary: change.monthlyGrossSalary,
    });
  }

  const totalSalary = periods.reduce((sum, period) => sum + period.periodSalary, 0);

  return {
    totalSalary,
    periods,
  };
}

/**
 * Get current ideal parameter value
 */
export function getCurrentIdealParameter(
  parameterType: IdealParameterType,
  asOfDate?: Date
): number {
  const targetDate = asOfDate || new Date();
  const history = IDEAL_PARAMETERS_HISTORY.filter(
    (record) =>
      record.parameterType === parameterType &&
      new Date(record.effectiveDate) <= targetDate
  ).sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

  return history[0]?.newValue || 0;
}

/**
 * Get working days for a specific month
 */
export function getWorkingDays(year: number, month: number): number {
  const record = WORKING_DAYS_CALENDAR.find(
    (wdc) => wdc.year === year && wdc.month === month
  );
  return record?.workingDays || 26;
}

/**
 * Get equipment by washer ID
 */
export function getEquipmentByWasher(washerId: string): Equipment[] {
  return EQUIPMENT_RECORDS.filter(
    (eq) => eq.assignedToWasherId === washerId && eq.status === "Active"
  );
}

/**
 * Get equipment category by ID
 */
export function getEquipmentCategory(categoryId: string): EquipmentCategory | undefined {
  return EQUIPMENT_CATEGORIES.find((cat) => cat.id === categoryId);
}

/**
 * Get current useful life for an equipment category
 */
export function getCurrentUsefulLife(categoryId: string, asOfDate?: Date): number {
  const targetDate = asOfDate || new Date();
  const history = EQUIPMENT_USEFUL_LIFE_HISTORY.filter(
    (record) =>
      record.categoryId === categoryId &&
      new Date(record.effectiveDate) <= targetDate
  ).sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

  if (history[0]) {
    return history[0].newUsefulLifeMonths;
  }

  // Fallback to category default
  const category = getEquipmentCategory(categoryId);
  return category?.defaultUsefulLifeMonths || 24;
}
