// Comprehensive Washer Performance Data for Cost Per Wash Analysis
// Synchronized with Suresh Kumar's March 2026 performance from recommendations

export interface WasherPerformanceRecord {
  id: string;
  washerName: string;
  pinCodes: string[];
  supervisorId: string;
  supervisorName: string;
  
  // March 2026 Performance
  period: string;
  totalWashes: number;
  idealWashes: number; // 21 jobs/day × 26 working days = 546 (minus sick days)
  
  // Actual Costs
  actualMaterialCost: number;
  actualEquipmentCost: number;
  actualSalaryCost: number;
  actualSupervisorCost: number;
  actualOverheadCost: number;
  actualTotalCost: number;
  actualCostPerWash: number;
  
  // Standard/Ideal Costs
  standardMaterialCost: number;
  standardEquipmentCost: number;
  standardSalaryCost: number;
  standardSupervisorCost: number;
  standardOverheadCost: number;
  standardTotalCost: number;
  standardCostPerWash: number;
  
  // Variance
  varianceTotal: number;
  variancePerWash: number;
  
  // Package Distribution
  topPackages: string[];
  basicWashes: number;
  premiumWashes: number;
  eliteWashes: number;
  elitePlusWashes: number;
  
  // Operational Metrics
  avgDurationMinutes: number;
  qualityScore: number;
  zeroWashDays: number;
  
  // Detailed Breakdown (for drill-down)
  details: {
    // Material Breakdown
    foamShampooUsed: number; // ml
    wheelCleanerUsed: number;
    glassCleanerUsed: number;
    tireShineUsed: number;
    
    // Equipment Events
    equipmentRepairs: number;
    equipmentReplacementCost: number;
    
    // Salary Details
    baseSalary: number;
    overtime: number;
    incentives: number;
    deductions: number;
    
    // Overhead Details
    vehicleMaintenance: number;
    fuelCost: number;
  };
}

export const WASHER_PERFORMANCE_DATA: WasherPerformanceRecord[] = [
  // Suresh Kumar - March 2026 (from Part 11 recommendations)
  {
    id: "washer-001",
    washerName: "Suresh Kumar",
    pinCodes: ["395005"],
    supervisorId: "supervisor-ramesh",
    supervisorName: "Ramesh Patel",
    
    period: "March 2026",
    totalWashes: 477, // Actual jobs completed
    idealWashes: 546, // 21 jobs/day × 26 working days
    
    // Actual Costs (from recommendations)
    actualMaterialCost: 6.24, // Per wash
    actualEquipmentCost: 4.15,
    actualSalaryCost: 31.45, // ₹15,000 ÷ 477 jobs
    actualSupervisorCost: 10.70, // High due to team underutilization
    actualOverheadCost: 8.50,
    actualTotalCost: 61.04,
    actualCostPerWash: 61.04,
    
    // Standard/Ideal Costs
    standardMaterialCost: 6.24, // Same (consumption matches for this washer)
    standardEquipmentCost: 4.15,
    standardSalaryCost: 27.47, // ₹15,000 ÷ 546 ideal jobs
    standardSupervisorCost: 2.69, // At ideal team size of 17 washers
    standardOverheadCost: 8.50,
    standardTotalCost: 49.05,
    standardCostPerWash: 49.05,
    
    // Variance
    varianceTotal: 11.99, // 61.04 - 49.05
    variancePerWash: 11.99,
    
    // Package Distribution
    topPackages: ["Premium", "Elite"],
    basicWashes: 177, // 37.1%
    premiumWashes: 180, // 37.7%
    eliteWashes: 120, // 25.2%
    elitePlusWashes: 0,
    
    // Operational Metrics
    avgDurationMinutes: 28,
    qualityScore: 4.7,
    zeroWashDays: 1, // 16 Mar - sick leave
    
    // Detailed Breakdown
    details: {
      // Material (from Part 11 - 1,035ml foam shampoo)
      foamShampooUsed: 1035, // ml - severe under-consumption
      wheelCleanerUsed: 2800,
      glassCleanerUsed: 1200,
      tireShineUsed: 850,
      
      // Equipment
      equipmentRepairs: 2,
      equipmentReplacementCost: 450,
      
      // Salary (March 2026)
      baseSalary: 15000,
      overtime: 1400,
      incentives: 0,
      deductions: -400,
      
      // Overhead
      vehicleMaintenance: 350, // Flat tyre repair
      fuelCost: 3700,
    },
  },
  
  // Ramesh K. - High performer
  {
    id: "washer-002",
    washerName: "Ramesh K.",
    pinCodes: ["395001", "395002"],
    supervisorId: "supervisor-ramesh",
    supervisorName: "Ramesh Patel",
    
    period: "March 2026",
    totalWashes: 532,
    idealWashes: 546,
    
    actualMaterialCost: 6.85,
    actualEquipmentCost: 4.20,
    actualSalaryCost: 28.20,
    actualSupervisorCost: 10.70,
    actualOverheadCost: 8.80,
    actualTotalCost: 58.75,
    actualCostPerWash: 58.75,
    
    standardMaterialCost: 6.50,
    standardEquipmentCost: 4.20,
    standardSalaryCost: 27.47,
    standardSupervisorCost: 2.69,
    standardOverheadCost: 8.80,
    standardTotalCost: 49.66,
    standardCostPerWash: 49.66,
    
    varianceTotal: 9.09,
    variancePerWash: 9.09,
    
    topPackages: ["Premium", "Elite"],
    basicWashes: 120,
    premiumWashes: 240,
    eliteWashes: 160,
    elitePlusWashes: 12,
    
    avgDurationMinutes: 32,
    qualityScore: 4.8,
    zeroWashDays: 0,
    
    details: {
      foamShampooUsed: 11200,
      wheelCleanerUsed: 8900,
      glassCleanerUsed: 4200,
      tireShineUsed: 3100,
      
      equipmentRepairs: 1,
      equipmentReplacementCost: 280,
      
      baseSalary: 15000,
      overtime: 800,
      incentives: 200,
      deductions: 0,
      
      vehicleMaintenance: 250,
      fuelCost: 4200,
    },
  },
  
  // Mahesh S. - Good performer
  {
    id: "washer-003",
    washerName: "Mahesh S.",
    pinCodes: ["395004", "395005"],
    supervisorId: "supervisor-ramesh",
    supervisorName: "Ramesh Patel",
    
    period: "March 2026",
    totalWashes: 498,
    idealWashes: 546,
    
    actualMaterialCost: 6.50,
    actualEquipmentCost: 4.10,
    actualSalaryCost: 30.12,
    actualSupervisorCost: 10.70,
    actualOverheadCost: 8.60,
    actualTotalCost: 60.02,
    actualCostPerWash: 60.02,
    
    standardMaterialCost: 6.50,
    standardEquipmentCost: 4.10,
    standardSalaryCost: 27.47,
    standardSupervisorCost: 2.69,
    standardOverheadCost: 8.60,
    standardTotalCost: 49.36,
    standardCostPerWash: 49.36,
    
    varianceTotal: 10.66,
    variancePerWash: 10.66,
    
    topPackages: ["Elite", "Elite Plus"],
    basicWashes: 80,
    premiumWashes: 180,
    eliteWashes: 200,
    elitePlusWashes: 38,
    
    avgDurationMinutes: 35,
    qualityScore: 4.6,
    zeroWashDays: 0,
    
    details: {
      foamShampooUsed: 10500,
      wheelCleanerUsed: 8200,
      glassCleanerUsed: 4500,
      tireShineUsed: 3400,
      
      equipmentRepairs: 1,
      equipmentReplacementCost: 320,
      
      baseSalary: 15000,
      overtime: 600,
      incentives: 0,
      deductions: 0,
      
      vehicleMaintenance: 180,
      fuelCost: 4100,
    },
  },
  
  // Dinesh P. - Average performer
  {
    id: "washer-004",
    washerName: "Dinesh P.",
    pinCodes: ["395003"],
    supervisorId: "supervisor-priya",
    supervisorName: "Priya Mehta",
    
    period: "March 2026",
    totalWashes: 445,
    idealWashes: 546,
    
    actualMaterialCost: 7.20,
    actualEquipmentCost: 4.30,
    actualSalaryCost: 33.71,
    actualSupervisorCost: 15.20, // Even higher - only 3 washers under Priya
    actualOverheadCost: 9.20,
    actualTotalCost: 69.61,
    actualCostPerWash: 69.61,
    
    standardMaterialCost: 6.50,
    standardEquipmentCost: 4.30,
    standardSalaryCost: 27.47,
    standardSupervisorCost: 2.69,
    standardOverheadCost: 9.20,
    standardTotalCost: 50.16,
    standardCostPerWash: 50.16,
    
    varianceTotal: 19.45,
    variancePerWash: 19.45,
    
    topPackages: ["Basic", "Premium"],
    basicWashes: 220,
    premiumWashes: 180,
    eliteWashes: 45,
    elitePlusWashes: 0,
    
    avgDurationMinutes: 26,
    qualityScore: 4.5,
    zeroWashDays: 2, // Lower productivity
    
    details: {
      foamShampooUsed: 9800,
      wheelCleanerUsed: 7200,
      glassCleanerUsed: 3500,
      tireShineUsed: 2200,
      
      equipmentRepairs: 3,
      equipmentReplacementCost: 580,
      
      baseSalary: 15000,
      overtime: 500,
      incentives: 0,
      deductions: 0,
      
      vehicleMaintenance: 420,
      fuelCost: 3800,
    },
  },
  
  // Kiran M. - Under Ramesh
  {
    id: "washer-005",
    washerName: "Kiran M.",
    pinCodes: ["395006"],
    supervisorId: "supervisor-ramesh",
    supervisorName: "Ramesh Patel",
    
    period: "March 2026",
    totalWashes: 512,
    idealWashes: 546,
    
    actualMaterialCost: 6.40,
    actualEquipmentCost: 4.05,
    actualSalaryCost: 29.30,
    actualSupervisorCost: 10.70,
    actualOverheadCost: 8.70,
    actualTotalCost: 59.15,
    actualCostPerWash: 59.15,
    
    standardMaterialCost: 6.40,
    standardEquipmentCost: 4.05,
    standardSalaryCost: 27.47,
    standardSupervisorCost: 2.69,
    standardOverheadCost: 8.70,
    standardTotalCost: 49.31,
    standardCostPerWash: 49.31,
    
    varianceTotal: 9.84,
    variancePerWash: 9.84,
    
    topPackages: ["Premium", "Elite"],
    basicWashes: 140,
    premiumWashes: 220,
    eliteWashes: 140,
    elitePlusWashes: 12,
    
    avgDurationMinutes: 30,
    qualityScore: 4.7,
    zeroWashDays: 0,
    
    details: {
      foamShampooUsed: 10800,
      wheelCleanerUsed: 8500,
      glassCleanerUsed: 4100,
      tireShineUsed: 2900,
      
      equipmentRepairs: 1,
      equipmentReplacementCost: 220,
      
      baseSalary: 15000,
      overtime: 600,
      incentives: 0,
      deductions: 0,
      
      vehicleMaintenance: 200,
      fuelCost: 4250,
    },
  },
];

/**
 * Get washer performance by ID
 */
export function getWasherPerformance(washerId: string): WasherPerformanceRecord | undefined {
  return WASHER_PERFORMANCE_DATA.find(w => w.id === washerId);
}

/**
 * Get all washers under a supervisor
 */
export function getWashersBySupervisor(supervisorId: string): WasherPerformanceRecord[] {
  return WASHER_PERFORMANCE_DATA.filter(w => w.supervisorId === supervisorId);
}

/**
 * Get supervisor aggregate data
 */
export function getSupervisorPerformance(supervisorId: string) {
  const washers = getWashersBySupervisor(supervisorId);
  
  if (washers.length === 0) return null;
  
  const totalWashes = washers.reduce((sum, w) => sum + w.totalWashes, 0);
  const idealWashes = washers.reduce((sum, w) => sum + w.idealWashes, 0);
  
  return {
    supervisorId,
    supervisorName: washers[0].supervisorName,
    washerCount: washers.length,
    idealWasherCount: 17,
    totalWashes,
    idealWashes,
    avgActualCostPerWash: washers.reduce((sum, w) => sum + w.actualCostPerWash, 0) / washers.length,
    avgStandardCostPerWash: washers.reduce((sum, w) => sum + w.standardCostPerWash, 0) / washers.length,
    washers,
  };
}
