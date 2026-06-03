// System Configuration - All user-configurable parameters
// This is the single source of truth for all cost model inputs

import { getSalaryStatistics } from './employeeData';

export interface OrganizationStructure {
  numberOfTeams: number;
  washersPerTeam: number;
  supervisorsPerTeam: number; // Always 1
  opsManagersThreshold: number; // 1 per 4 supervisors
  cityManagers: number;
}

export interface ThroughputSettings {
  workingDaysPerMonth: number;
  baseUnitsPerWasherPerDay: number;
  maxAdditionalUnitsPerWasherPerDay: number;
  avgExtraUnitsPerWasherPerDay: number; // Conservative avg for incentive calc
}

export interface SalaryStructure {
  washerCTC: number; // Monthly CTC in INR
  supervisorCTC: number;
  opsManagerCTC: number;
  cityManagerCTC: number;
}

export interface IncentiveStructure {
  fourWheelerRatePerUnit: number; // INR per incentive unit above base
  twoWheelerRatePerUnit: number; // INR per incentive unit
  addOnRatePerUnit: number; // INR per add-on incentive unit
  // Unit mix percentages (must sum to 1.0)
  incentiveUnitMix: {
    fourWheeler: number; // e.g., 0.7 = 70%
    twoWheeler: number; // e.g., 0.2 = 20%
    addOn: number; // e.g., 0.1 = 10%
  };
}

export interface ClothRotationSystem {
  clothCostPerPiece: number;
  clothsPerCarPerWash: number; // Sets of 3: glass + shampoo + dry
  clothLifeWashes: number; // Washes per cloth before replacement
  batchesNeededForRotation: number; // 4 batches for 3-day rotation
}

export interface SpongeAndInteriorCloth {
  waxSpongeCost: number;
  waxSpongeLifeMonths: number; // 1 per washer per month
  interiorClothCost: number;
  interiorClothLifeMonths: number; // 1 per washer per month
}

export interface LiquidConsumables {
  shampoo: {
    quantityPerWash: number;
    costPerMl: number;
  };
  tyreWax: {
    quantityPerWash: number;
    costPerMl: number;
  };
  interiorWax: {
    quantityPerWash: number;
    costPerMl: number;
  };
  exteriorWax: {
    quantityPerWash: number;
    costPerMl: number;
  };
}

export interface EquipmentSettings {
  waterSprayGun: {
    purchaseCost: number;
    usefulLifeMonths: number;
  };
  vacuumCleaner: {
    purchaseCost: number;
    usefulLifeMonths: number;
  };
}

export interface FixedOverheads {
  officeAndStationery: number; // Monthly INR
  erpSystem: {
    oneTimeCapex: number; // One-time CAPEX
    amortizationPeriodMonths: number; // 60 months = 5 years
    annualAMC: number; // Annual AMC
  };
}

export interface LaundrySettings {
  bulkWashingMachineMonthlyDepreciation: number;
  disinfectantSuppliesPerMonth: number;
  transportLogisticsPerMonth: number;
  packagedBagsLabellingPerMonth: number;
}

export interface SystemConfiguration {
  organizationStructure: OrganizationStructure;
  throughputSettings: ThroughputSettings;
  salaryStructure: SalaryStructure;
  incentiveStructure: IncentiveStructure;
  clothRotationSystem: ClothRotationSystem;
  spongeAndInteriorCloth: SpongeAndInteriorCloth;
  liquidConsumables: LiquidConsumables;
  equipmentSettings: EquipmentSettings;
  fixedOverheads: FixedOverheads;
  laundrySettings: LaundrySettings;
  lastUpdatedBy: string;
  lastUpdatedOn: string;
  version: string;
}

// Get salary structure from actual employee data
const employeeSalaries = getSalaryStatistics();

// Default Configuration - Based on Car Wash Cost Model v7
export const DEFAULT_SYSTEM_CONFIGURATION: SystemConfiguration = {
  organizationStructure: {
    numberOfTeams: 4,
    washersPerTeam: 17,
    supervisorsPerTeam: 1,
    opsManagersThreshold: 4, // 1 per 4 supervisors
    cityManagers: 1,
  },
  throughputSettings: {
    workingDaysPerMonth: 26, // 6 days/week × ~4.33 weeks
    baseUnitsPerWasherPerDay: 25, // Salary covers this
    maxAdditionalUnitsPerWasherPerDay: 8, // Max 33 total units/day
    avgExtraUnitsPerWasherPerDay: 4, // Mid-point of 0-8 range
  },
  salaryStructure: {
    washerCTC: employeeSalaries.washerCTC || 7752, // From actual employee data
    supervisorCTC: employeeSalaries.supervisorCTC || 25000, // From actual employee data
    opsManagerCTC: employeeSalaries.opsManagerCTC || 35000, // From actual employee data
    cityManagerCTC: employeeSalaries.cityManagerCTC || 50000, // From actual employee data
  },
  incentiveStructure: {
    fourWheelerRatePerUnit: 25, // ₹25 per 4W unit above base
    twoWheelerRatePerUnit: 10, // ₹10 per 2W unit
    addOnRatePerUnit: 15, // ₹15 per add-on unit
    incentiveUnitMix: {
      fourWheeler: 0.7, // 70%
      twoWheeler: 0.2, // 20%
      addOn: 0.1, // 10%
    },
  },
  clothRotationSystem: {
    clothCostPerPiece: 17,
    clothsPerCarPerWash: 3, // Glass + shampoo + dry
    clothLifeWashes: 90,
    batchesNeededForRotation: 4,
  },
  spongeAndInteriorCloth: {
    waxSpongeCost: 14,
    waxSpongeLifeMonths: 1,
    interiorClothCost: 30,
    interiorClothLifeMonths: 1,
  },
  liquidConsumables: {
    shampoo: {
      quantityPerWash: 5,
      costPerMl: 0.30,
    },
    tyreWax: {
      quantityPerWash: 3,
      costPerMl: 0.50,
    },
    interiorWax: {
      quantityPerWash: 3,
      costPerMl: 0.50,
    },
    exteriorWax: {
      quantityPerWash: 10,
      costPerMl: 0.15,
    },
  },
  equipmentSettings: {
    waterSprayGun: {
      purchaseCost: 2000,
      usefulLifeMonths: 12,
    },
    vacuumCleaner: {
      purchaseCost: 2000,
      usefulLifeMonths: 12,
    },
  },
  fixedOverheads: {
    officeAndStationery: 25000, // Monthly
    erpSystem: {
      oneTimeCapex: 750000, // One-time CAPEX
      amortizationPeriodMonths: 60, // 5 years
      annualAMC: 200000,
    },
  },
  laundrySettings: {
    bulkWashingMachineMonthlyDepreciation: 3000, // ₹1.8L / 60 months
    disinfectantSuppliesPerMonth: 2000,
    transportLogisticsPerMonth: 1500,
    packagedBagsLabellingPerMonth: 1000,
  },
  lastUpdatedBy: "System",
  lastUpdatedOn: "2026-04-11",
  version: "v7",
};

// Active configuration - can be updated by admin
let activeConfiguration: SystemConfiguration = { ...DEFAULT_SYSTEM_CONFIGURATION };

// Configuration Management Functions
export function getActiveConfiguration(): SystemConfiguration {
  return { ...activeConfiguration };
}

export function updateConfiguration(
  updates: Partial<SystemConfiguration>,
  updatedBy: string = "System"
): SystemConfiguration {
  activeConfiguration = {
    ...activeConfiguration,
    ...updates,
    lastUpdatedBy: updatedBy,
    lastUpdatedOn: new Date().toISOString(),
  };
  return { ...activeConfiguration };
}

export function resetToDefaultConfiguration(resetBy: string = "System"): SystemConfiguration {
  activeConfiguration = {
    ...DEFAULT_SYSTEM_CONFIGURATION,
    lastUpdatedBy: resetBy,
    lastUpdatedOn: new Date().toISOString(),
  };
  return { ...activeConfiguration };
}

// Calculated Values - Derived from configuration
export function getCalculatedMetrics(config: SystemConfiguration = activeConfiguration) {
  const {
    organizationStructure,
    throughputSettings,
    salaryStructure,
    incentiveStructure,
    clothRotationSystem,
    spongeAndInteriorCloth,
    equipmentSettings,
    fixedOverheads,
    laundrySettings,
  } = config;

  // A. Organization calculations
  const totalWashers = organizationStructure.numberOfTeams * organizationStructure.washersPerTeam;
  const totalSupervisors = organizationStructure.numberOfTeams * organizationStructure.supervisorsPerTeam;
  const totalOpsManagers = Math.ceil(totalSupervisors / organizationStructure.opsManagersThreshold);

  // B. Throughput calculations
  const baseUnitsPerWasherPerMonth =
    throughputSettings.baseUnitsPerWasherPerDay * throughputSettings.workingDaysPerMonth;
  const maxAdditionalUnitsPerWasherPerMonth =
    throughputSettings.maxAdditionalUnitsPerWasherPerDay * throughputSettings.workingDaysPerMonth;
  const baseTotalUnitWashesPerMonth = totalWashers * baseUnitsPerWasherPerMonth;
  const maxTotalUnitWashesPerMonth =
    totalWashers * (baseUnitsPerWasherPerMonth + maxAdditionalUnitsPerWasherPerMonth);

  // C. Labor cost calculations - BASE
  const washerLaborCostPerWashBase = salaryStructure.washerCTC / baseUnitsPerWasherPerMonth;
  const supervisorCostPerWash =
    salaryStructure.supervisorCTC /
    (organizationStructure.washersPerTeam * baseUnitsPerWasherPerMonth);
  const opsManagerCostPerWash = salaryStructure.opsManagerCTC / baseTotalUnitWashesPerMonth;
  const cityManagerCostPerWash = salaryStructure.cityManagerCTC / baseTotalUnitWashesPerMonth;
  const totalManagementOverheadPerWash =
    supervisorCostPerWash + opsManagerCostPerWash + cityManagerCostPerWash;
  const totalLaborPerWashBase = washerLaborCostPerWashBase + totalManagementOverheadPerWash;

  // C. Labor cost calculations - WITH INCENTIVE
  const blendedIncentiveRate =
    incentiveStructure.incentiveUnitMix.fourWheeler * incentiveStructure.fourWheelerRatePerUnit +
    incentiveStructure.incentiveUnitMix.twoWheeler * incentiveStructure.twoWheelerRatePerUnit +
    incentiveStructure.incentiveUnitMix.addOn * incentiveStructure.addOnRatePerUnit;

  const avgAdditionalIncentivePerWasherPerMonth =
    blendedIncentiveRate *
    throughputSettings.avgExtraUnitsPerWasherPerDay *
    throughputSettings.workingDaysPerMonth;

  const avgTotalUnitWashesPerWasherPerMonth =
    baseUnitsPerWasherPerMonth +
    throughputSettings.avgExtraUnitsPerWasherPerDay * throughputSettings.workingDaysPerMonth;

  const washerTotalCostPerWashWithIncentive =
    (salaryStructure.washerCTC + avgAdditionalIncentivePerWasherPerMonth) /
    avgTotalUnitWashesPerWasherPerMonth;

  const totalLaborPerWashWithIncentive =
    washerTotalCostPerWashWithIncentive + totalManagementOverheadPerWash;

  // D. Cloth cost calculations
  const clothCostPerWashAmortised =
    (clothRotationSystem.clothCostPerPiece / clothRotationSystem.clothLifeWashes) *
    clothRotationSystem.clothsPerCarPerWash;

  const totalClothsInSystemPerWasher =
    throughputSettings.baseUnitsPerWasherPerDay *
    clothRotationSystem.clothsPerCarPerWash *
    clothRotationSystem.batchesNeededForRotation;

  const clothReplacedPerWasherPerMonth =
    (throughputSettings.baseUnitsPerWasherPerDay *
      clothRotationSystem.clothsPerCarPerWash *
      throughputSettings.workingDaysPerMonth) /
    clothRotationSystem.clothLifeWashes;

  const monthlyClothReplacementCostPerWasher =
    clothReplacedPerWasherPerMonth * clothRotationSystem.clothCostPerPiece;

  // E. Sponge & Interior cloth
  const spongeCostPerWash =
    spongeAndInteriorCloth.waxSpongeCost /
    (throughputSettings.baseUnitsPerWasherPerDay * throughputSettings.workingDaysPerMonth);

  const interiorClothCostPerWash =
    spongeAndInteriorCloth.interiorClothCost /
    (throughputSettings.baseUnitsPerWasherPerDay * throughputSettings.workingDaysPerMonth);

  // G. Equipment costs
  const sprayGunCostPerWash =
    equipmentSettings.waterSprayGun.purchaseCost /
    equipmentSettings.waterSprayGun.usefulLifeMonths /
    (throughputSettings.baseUnitsPerWasherPerDay * throughputSettings.workingDaysPerMonth);

  const vacuumCleanerCostPerWash =
    equipmentSettings.vacuumCleaner.purchaseCost /
    equipmentSettings.vacuumCleaner.usefulLifeMonths /
    (throughputSettings.baseUnitsPerWasherPerDay * throughputSettings.workingDaysPerMonth);

  // H. Fixed overhead calculations
  const erpMonthlyAmortisation =
    fixedOverheads.erpSystem.oneTimeCapex / fixedOverheads.erpSystem.amortizationPeriodMonths;
  const erpMonthlyAMC = fixedOverheads.erpSystem.annualAMC / 12;
  const totalERPMonthlyCost = erpMonthlyAmortisation + erpMonthlyAMC;
  const totalFixedOverheadPerMonth = fixedOverheads.officeAndStationery + totalERPMonthlyCost;
  const fixedOverheadPerWashBase = totalFixedOverheadPerMonth / baseTotalUnitWashesPerMonth;
  const totalMonthlyUnitWashesWithIncentive = totalWashers * avgTotalUnitWashesPerWasherPerMonth;
  const fixedOverheadPerWashWithIncentive =
    totalFixedOverheadPerMonth / totalMonthlyUnitWashesWithIncentive;

  // I. Laundry costs
  const totalMonthlyLaundryCost =
    laundrySettings.bulkWashingMachineMonthlyDepreciation +
    laundrySettings.disinfectantSuppliesPerMonth +
    laundrySettings.transportLogisticsPerMonth +
    laundrySettings.packagedBagsLabellingPerMonth;
  const laundryCostPerWashBase = totalMonthlyLaundryCost / baseTotalUnitWashesPerMonth;

  return {
    // Organization
    totalWashers,
    totalSupervisors,
    totalOpsManagers,

    // Throughput
    baseUnitsPerWasherPerMonth,
    maxAdditionalUnitsPerWasherPerMonth,
    baseTotalUnitWashesPerMonth,
    maxTotalUnitWashesPerMonth,
    avgTotalUnitWashesPerWasherPerMonth,
    totalMonthlyUnitWashesWithIncentive,

    // Labor costs
    washerLaborCostPerWashBase,
    supervisorCostPerWash,
    opsManagerCostPerWash,
    cityManagerCostPerWash,
    totalManagementOverheadPerWash,
    totalLaborPerWashBase,
    blendedIncentiveRate,
    avgAdditionalIncentivePerWasherPerMonth,
    washerTotalCostPerWashWithIncentive,
    totalLaborPerWashWithIncentive,

    // Cloth
    clothCostPerWashAmortised,
    totalClothsInSystemPerWasher,
    clothReplacedPerWasherPerMonth,
    monthlyClothReplacementCostPerWasher,

    // Sponge & Interior
    spongeCostPerWash,
    interiorClothCostPerWash,

    // Equipment
    sprayGunCostPerWash,
    vacuumCleanerCostPerWash,
    vacuumCostPerWash: vacuumCleanerCostPerWash, // Alias

    // Fixed overhead
    erpMonthlyAmortisation,
    erpMonthlyAmortization: erpMonthlyAmortisation, // Alias (US spelling)
    erpMonthlyAMC,
    totalERPMonthlyCost,
    erpMonthlyTotal: totalERPMonthlyCost, // Alias
    totalFixedOverheadPerMonth,
    fixedOverheadPerWashBase,
    fixedOverheadPerWashWithIncentive,

    // Laundry
    totalMonthlyLaundryCost,
    totalLaundryCostPerMonth: totalMonthlyLaundryCost, // Alias
    laundryCostPerWashBase,
    laundryCostPerWash: laundryCostPerWashBase, // Alias
  };
}

// Export helper for components
export function getConfigurationSummary(config: SystemConfiguration = activeConfiguration) {
  const calculated = getCalculatedMetrics(config);

  return {
    organization: {
      teams: config.organizationStructure.numberOfTeams,
      totalWashers: calculated.totalWashers,
      totalSupervisors: calculated.totalSupervisors,
      totalOpsManagers: calculated.totalOpsManagers,
      cityManagers: config.organizationStructure.cityManagers,
    },
    throughput: {
      workingDaysPerMonth: config.throughputSettings.workingDaysPerMonth,
      baseUnitsPerWasherPerDay: config.throughputSettings.baseUnitsPerWasherPerDay,
      totalBaseWashesPerMonth: calculated.baseTotalUnitWashesPerMonth,
      maxTotalWashesPerMonth: calculated.maxTotalUnitWashesPerMonth,
    },
    costs: {
      washerCostPerWashBase: calculated.washerLaborCostPerWashBase,
      managementOverheadPerWash: calculated.totalManagementOverheadPerWash,
      totalLabourCostPerWashBase: calculated.totalLaborPerWashBase,
      clothCostPerWash: calculated.clothCostPerWashAmortised,
      sprayGunCostPerWash: calculated.sprayGunCostPerWash,
      vacuumCostPerWash: calculated.vacuumCleanerCostPerWash,
      laundryCostPerWash: calculated.laundryCostPerWashBase,
      fixedOverheadPerWashBase: calculated.fixedOverheadPerWashBase,
    },
    incentives: {
      fourWheelerRate: config.incentiveStructure.fourWheelerRatePerUnit,
      twoWheelerRate: config.incentiveStructure.twoWheelerRatePerUnit,
      addOnRate: config.incentiveStructure.addOnRatePerUnit,
      blendedRate: calculated.blendedIncentiveRate,
    },
    overhead: {
      officeAndStationery: config.fixedOverheads.officeAndStationery,
      erpMonthlyTotal: calculated.totalERPMonthlyCost,
      totalMonthlyOverhead: calculated.totalFixedOverheadPerMonth,
    },
  };
}
