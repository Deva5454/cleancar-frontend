// EBITDA Calculation System - Complete Cost Build-Up and Margin Analysis
// Updated April 2026 - Based on Unit Economics Model
// Now integrates with centralized systemConfiguration.ts

import { type PlanType, type VehicleCategory } from "./subscriptionPlans";
import { getActiveConfiguration, getCalculatedMetrics } from "./systemConfiguration";

// ==================== DYNAMIC CONFIGURATION ====================
// All parameters now pulled from systemConfiguration.ts - no hardcoded values

// Get active configuration
const config = getActiveConfiguration();
const metrics = getCalculatedMetrics();

// Export constants derived from configuration
export const WORKING_DAYS_PER_MONTH = config.throughputSettings.workingDaysPerMonth;
export const BASE_UNITS_PER_WASHER_PER_DAY = config.throughputSettings.baseUnitsPerWasherPerDay;
export const WASHERS_PER_TEAM = config.organizationStructure.washersPerTeam;
export const NUMBER_OF_TEAMS = config.organizationStructure.numberOfTeams;
export const TOTAL_WASHERS = metrics.totalWashers;
export const NUMBER_OF_SUPERVISORS = metrics.totalSupervisors;
export const NUMBER_OF_OPS_MANAGERS = metrics.totalOpsManagers;
export const NUMBER_OF_CITY_MANAGERS = config.organizationStructure.cityManagers;

// EBITDA Thresholds
export const EBITDA_FLOOR = 0.30; // 30% - System hard floor
export const EBITDA_TARGET = 0.35; // 35% - Comfortable operating margin
export const EBITDA_ASPIRATIONAL = 0.60; // 60% - High-value bundle/tier

// Unit Model
export const UNIT_WEIGHT = {
  "4W": 1.0,
  "2W": 0.4,
  "Add-on": 0.5,
} as const;

// ==================== SALARY DATA ====================

export interface SalaryData {
  washerCTC: number;
  supervisorCTC: number;
  opsManagerCTC: number;
  cityManagerCTC: number;
}

export const MONTHLY_SALARIES: SalaryData = {
  washerCTC: config.salaryStructure.washerCTC,
  supervisorCTC: config.salaryStructure.supervisorCTC,
  opsManagerCTC: config.salaryStructure.opsManagerCTC,
  cityManagerCTC: config.salaryStructure.cityManagerCTC,
};

// ==================== INCENTIVE DATA ====================

export interface IncentiveRates {
  "4W": number;
  "2W": number;
  "Add-on": number;
}

export const INCENTIVE_RATES_PER_UNIT: IncentiveRates = {
  "4W": config.incentiveStructure.fourWheelerRatePerUnit,
  "2W": config.incentiveStructure.twoWheelerRatePerUnit,
  "Add-on": config.incentiveStructure.addOnRatePerUnit,
};

export const AVERAGE_EXTRA_UNITS_PER_WASHER_PER_DAY = config.throughputSettings.avgExtraUnitsPerWasherPerDay;

// ==================== CONSUMABLE COSTS ====================

export interface ConsumableCosts {
  tyreWaxPerMl: number;
  shampooPerMl: number;
  exteriorWaxPerMl: number;
  interiorWaxPerMl: number;
}

export const CONSUMABLE_UNIT_COSTS: ConsumableCosts = {
  tyreWaxPerMl: config.liquidConsumables.tyreWax.costPerMl,
  shampooPerMl: config.liquidConsumables.shampoo.costPerMl,
  exteriorWaxPerMl: config.liquidConsumables.exteriorWax.costPerMl,
  interiorWaxPerMl: config.liquidConsumables.interiorWax.costPerMl,
};

export interface PlanConsumables {
  tyreWaxMl: number;
  shampooMl: number;
  exteriorWaxMl: number;
  interiorWaxMl: number;
}

export const CONSUMABLE_USAGE: Record<string, PlanConsumables> = {
  // ── Canonical keys (old display names — kept for backward compat) ───────────
  "Water Wash": {
    tyreWaxMl: config.liquidConsumables.tyreWax.quantityPerWash,
    shampooMl: 0,
    exteriorWaxMl: 0,
    interiorWaxMl: 0,
  },
  "Shampoo Wash": {
    tyreWaxMl: config.liquidConsumables.tyreWax.quantityPerWash,
    shampooMl: config.liquidConsumables.shampoo.quantityPerWash,
    exteriorWaxMl: 0,
    interiorWaxMl: 0,
  },
  "Shampoo+Wax": {
    tyreWaxMl: config.liquidConsumables.tyreWax.quantityPerWash,
    shampooMl: config.liquidConsumables.shampoo.quantityPerWash,
    exteriorWaxMl: config.liquidConsumables.exteriorWax.quantityPerWash,
    interiorWaxMl: config.liquidConsumables.interiorWax.quantityPerWash,
  },
  "Shampoo+Polish": {
    tyreWaxMl: config.liquidConsumables.tyreWax.quantityPerWash,
    shampooMl: config.liquidConsumables.shampoo.quantityPerWash,
    exteriorWaxMl: config.liquidConsumables.exteriorWax.quantityPerWash,
    interiorWaxMl: 0,
  },
};

// 2W uses 2 tyres instead of 4
export const CONSUMABLE_USAGE_2W: Record<string, PlanConsumables> = {
  "Water Wash": {
    tyreWaxMl: config.liquidConsumables.tyreWax.quantityPerWash,
    shampooMl: 0,
    exteriorWaxMl: 0,
    interiorWaxMl: 0,
  },
  "Shampoo Wash": {
    tyreWaxMl: config.liquidConsumables.tyreWax.quantityPerWash,
    shampooMl: config.liquidConsumables.shampoo.quantityPerWash,
    exteriorWaxMl: 0,
    interiorWaxMl: 0,
  },
  "Shampoo+Polish": {
    tyreWaxMl: config.liquidConsumables.tyreWax.quantityPerWash,
    shampooMl: config.liquidConsumables.shampoo.quantityPerWash,
    exteriorWaxMl: config.liquidConsumables.exteriorWax.quantityPerWash,
    interiorWaxMl: 0,
  },
};

// ── New plan name aliases (SHINE / PROTECT / ELITE / ELITE_2W) ───────────────
// These point to the same consumable profiles as the legacy keys above.
// Any code passing the new plan tier names now resolves correctly instead
// of returning undefined and silently using ₹0 consumable cost.
CONSUMABLE_USAGE["EXPRESS_WASH"]    = CONSUMABLE_USAGE["Water Wash"];
CONSUMABLE_USAGE["SMART_WASH"]  = CONSUMABLE_USAGE["Shampoo Wash"];
CONSUMABLE_USAGE["ELITE"]    = CONSUMABLE_USAGE["Shampoo+Wax"];
CONSUMABLE_USAGE["ELITE_2W"] = CONSUMABLE_USAGE["Shampoo+Polish"];

CONSUMABLE_USAGE_2W["EXPRESS_WASH"]    = CONSUMABLE_USAGE_2W["Water Wash"];
CONSUMABLE_USAGE_2W["SMART_WASH"]  = CONSUMABLE_USAGE_2W["Shampoo Wash"];
CONSUMABLE_USAGE_2W["ELITE_2W"] = CONSUMABLE_USAGE_2W["Shampoo+Polish"];

// ==================== CLOTH COSTS ====================

export interface ClothCosts {
  microfibreClothCost: number;
  microfibreClothLifeWashes: number;
  clothsPerCarPerWash: number;
  waxSpongeCost: number;
  interiorClothCost: number;
}

export const CLOTH_DATA: ClothCosts = {
  microfibreClothCost: config.clothRotationSystem.clothCostPerPiece,
  microfibreClothLifeWashes: config.clothRotationSystem.clothLifeWashes,
  clothsPerCarPerWash: config.clothRotationSystem.clothsPerCarPerWash,
  waxSpongeCost: config.spongeAndInteriorCloth.waxSpongeCost,
  interiorClothCost: config.spongeAndInteriorCloth.interiorClothCost,
};

// ==================== EQUIPMENT COSTS ====================

export interface EquipmentCosts {
  pressureSprayGun: {
    cost: number;
    lifeMonths: number;
  };
  vacuumCleaner: {
    cost: number;
    lifeMonths: number;
  };
}

export const EQUIPMENT_DATA: EquipmentCosts = {
  pressureSprayGun: {
    cost: config.equipmentSettings.waterSprayGun.purchaseCost,
    lifeMonths: config.equipmentSettings.waterSprayGun.usefulLifeMonths,
  },
  vacuumCleaner: {
    cost: config.equipmentSettings.vacuumCleaner.purchaseCost,
    lifeMonths: config.equipmentSettings.vacuumCleaner.usefulLifeMonths,
  },
};

// ==================== FIXED OVERHEAD ====================

export interface FixedOverhead {
  officeRent: number;
  erpLicence: number;
}

export const MONTHLY_FIXED_OVERHEAD: FixedOverhead = {
  officeRent: config.fixedOverheads.officeAndStationery,
  erpLicence: metrics.erpMonthlyTotal,
};

// ==================== LAUNDRY COST ====================

export const LAUNDRY_COST_PER_WASH = metrics.laundryCostPerWash;

// ==================== COST CALCULATION FUNCTIONS ====================

/**
 * Calculate base unit-washes per washer per month
 */
export function getBaseUnitWashesPerWasher(): number {
  return BASE_UNITS_PER_WASHER_PER_DAY * WORKING_DAYS_PER_MONTH; // 25 × 26 = 650
}

/**
 * Calculate total base washes for all washers
 */
export function getTotalBaseWashes(): number {
  const washersInCalculation = WASHERS_PER_TEAM * NUMBER_OF_TEAMS / 2; // 34 washers (half teams)
  return washersInCalculation * getBaseUnitWashesPerWasher(); // 34 × 650 = 22,100
}

/**
 * Calculate labour cost per unit-wash (BASE scenario)
 */
export function getLabourCostPerUnitWashBase(): {
  washer: number;
  supervisor: number;
  opsManager: number;
  cityManager: number;
  total: number;
} {
  const baseUnitWashes = getBaseUnitWashesPerWasher();
  const totalBaseWashes = getTotalBaseWashes();

  const washerCost = MONTHLY_SALARIES.washerCTC / baseUnitWashes; // 19797 / 650 = 30.46
  const supervisorCost = MONTHLY_SALARIES.supervisorCTC / (WASHERS_PER_TEAM * baseUnitWashes); // 25000 / (17 × 650) = 2.26
  const opsManagerCost = MONTHLY_SALARIES.opsManagerCTC / totalBaseWashes; // 35000 / 22100 = 1.58
  const cityManagerCost = MONTHLY_SALARIES.cityManagerCTC / totalBaseWashes; // 50000 / 22100 = 2.26

  return {
    washer: washerCost,
    supervisor: supervisorCost,
    opsManager: opsManagerCost,
    cityManager: cityManagerCost,
    total: washerCost + supervisorCost + opsManagerCost + cityManagerCost, // ~36.56
  };
}

/**
 * Calculate labour cost per unit-wash (WITH INCENTIVE scenario)
 */
export function getLabourCostPerUnitWashWithIncentive(): {
  washer: number;
  supervisor: number;
  opsManager: number;
  cityManager: number;
  total: number;
} {
  const baseLabour = getLabourCostPerUnitWashBase();

  // Average incentive: 4 extra units/day × 26 days × ₹25/unit = ₹2,600/month
  const avgIncentivePerMonth = AVERAGE_EXTRA_UNITS_PER_WASHER_PER_DAY * WORKING_DAYS_PER_MONTH * INCENTIVE_RATES_PER_UNIT["4W"];
  const totalUnitsWithIncentive = getBaseUnitWashesPerWasher() + (AVERAGE_EXTRA_UNITS_PER_WASHER_PER_DAY * WORKING_DAYS_PER_MONTH);

  // Blended washer cost = (base salary + avg incentive) / total units
  const washerCostWithIncentive = (MONTHLY_SALARIES.washerCTC + avgIncentivePerMonth) / totalUnitsWithIncentive;

  return {
    washer: washerCostWithIncentive,
    supervisor: baseLabour.supervisor,
    opsManager: baseLabour.opsManager,
    cityManager: baseLabour.cityManager,
    total: washerCostWithIncentive + baseLabour.supervisor + baseLabour.opsManager + baseLabour.cityManager,
  };
}

/**
 * Calculate labour cost for vehicle type
 */
export function getLabourCost(vehicleType: "4W" | "2W", withIncentive: boolean = false): number {
  const labourCost = withIncentive ? getLabourCostPerUnitWashWithIncentive() : getLabourCostPerUnitWashBase();
  const unitWeight = UNIT_WEIGHT[vehicleType];
  return labourCost.total * unitWeight;
}

/**
 * Calculate consumable cost per wash
 */
export function getConsumableCost(planType: string, vehicleType: "4W" | "2W"): number {
  const usage = vehicleType === "4W" ? CONSUMABLE_USAGE[planType] : CONSUMABLE_USAGE_2W[planType];
  if (!usage) return 0;

  const tyreWaxCost = usage.tyreWaxMl * CONSUMABLE_UNIT_COSTS.tyreWaxPerMl;
  const shampooCost = usage.shampooMl * CONSUMABLE_UNIT_COSTS.shampooPerMl;
  const exteriorWaxCost = usage.exteriorWaxMl * CONSUMABLE_UNIT_COSTS.exteriorWaxPerMl;
  const interiorWaxCost = usage.interiorWaxMl * CONSUMABLE_UNIT_COSTS.interiorWaxPerMl;

  return tyreWaxCost + shampooCost + exteriorWaxCost + interiorWaxCost;
}

/**
 * Calculate cloth cost per wash
 */
export function getClothCost(planType: string): number {
  // Base cloth cost (3 cloths per wash, ₹17 per cloth, 90 wash life)
  const baseClothCost = (CLOTH_DATA.microfibreClothCost / CLOTH_DATA.microfibreClothLifeWashes) * CLOTH_DATA.clothsPerCarPerWash; // ₹0.567

  // Wax sponge (shared across all cars)
  const waxSpongeCost = CLOTH_DATA.waxSpongeCost / (BASE_UNITS_PER_WASHER_PER_DAY * WORKING_DAYS_PER_MONTH); // ₹0.022

  // Interior cloth (only for Shampoo Wash / PROTECT and Shampoo+Wax / ELITE)
  const interiorClothCost = (
    planType === "Shampoo Wash" || planType === "SMART_WASH" ||
    planType === "Shampoo+Wax"  || planType === "ELITE"
  )
    ? CLOTH_DATA.interiorClothCost / (BASE_UNITS_PER_WASHER_PER_DAY * WORKING_DAYS_PER_MONTH) // ₹0.046
    : 0;

  return baseClothCost + waxSpongeCost + interiorClothCost;
}

/**
 * Calculate equipment cost per wash
 */
export function getEquipmentCost(planType: string): number {
  // Pressure spray gun (all packages)
  const pressureGunMonthlyCost = EQUIPMENT_DATA.pressureSprayGun.cost / EQUIPMENT_DATA.pressureSprayGun.lifeMonths;
  const pressureGunCostPerWash = pressureGunMonthlyCost / getBaseUnitWashesPerWasher(); // ₹0.256

  // Vacuum cleaner (only Shampoo+Wax / ELITE with interior service)
  const vacuumCostPerWash = (planType === "Shampoo+Wax" || planType === "ELITE")
    ? (EQUIPMENT_DATA.vacuumCleaner.cost / EQUIPMENT_DATA.vacuumCleaner.lifeMonths) / getBaseUnitWashesPerWasher() // ₹0.256
    : 0;

  return pressureGunCostPerWash + vacuumCostPerWash;
}

/**
 * Calculate fixed overhead per wash
 */
export function getFixedOverheadPerWash(withIncentive: boolean = false): number {
  const totalFixedOverhead = MONTHLY_FIXED_OVERHEAD.officeRent + MONTHLY_FIXED_OVERHEAD.erpLicence;

  if (withIncentive) {
    // With incentive: more washes dilute fixed overhead
    const totalWashesWithIncentive = getTotalBaseWashes() * (1 + (AVERAGE_EXTRA_UNITS_PER_WASHER_PER_DAY / BASE_UNITS_PER_WASHER_PER_DAY));
    return totalFixedOverhead / totalWashesWithIncentive; // ₹2.11
  } else {
    // Base: using office rent only as per model
    return MONTHLY_FIXED_OVERHEAD.officeRent / getTotalBaseWashes(); // ₹1.23
  }
}

/**
 * Calculate total cost per wash
 */
export function getTotalCostPerWash(
  planType: string,
  vehicleType: "4W" | "2W",
  withIncentive: boolean = false
): {
  labour: number;
  consumables: number;
  cloth: number;
  equipment: number;
  laundry: number;
  fixedOverhead: number;
  total: number;
} {
  const labour = getLabourCost(vehicleType, withIncentive);
  const consumables = getConsumableCost(planType, vehicleType);
  const cloth = getClothCost(planType);
  const equipment = getEquipmentCost(planType);
  const laundry = LAUNDRY_COST_PER_WASH;
  const fixedOverhead = getFixedOverheadPerWash(withIncentive);

  return {
    labour,
    consumables,
    cloth,
    equipment,
    laundry,
    fixedOverhead,
    total: labour + consumables + cloth + equipment + laundry + fixedOverhead,
  };
}

/**
 * Calculate EBITDA percentage
 */
export function calculateEBITDA(
  monthlyPrice: number,
  monthlyCost: number
): {
  ebitdaAmount: number;
  ebitdaPercentage: number;
} {
  const ebitdaAmount = monthlyPrice - monthlyCost;
  const ebitdaPercentage = ebitdaAmount / monthlyPrice;

  return {
    ebitdaAmount,
    ebitdaPercentage,
  };
}

/**
 * Calculate revenue per wash
 */
export function getRevenuePerWash(monthlyPrice: number): number {
  return monthlyPrice / WORKING_DAYS_PER_MONTH;
}

/**
 * Calculate monthly cost from per-wash cost
 */
export function getMonthlyCost(costPerWash: number): number {
  return costPerWash * WORKING_DAYS_PER_MONTH;
}

/**
 * Check if EBITDA meets minimum floor
 */
export function meetsEBITDAFloor(ebitdaPercentage: number): boolean {
  return ebitdaPercentage >= EBITDA_FLOOR;
}

/**
 * Get EBITDA status
 */
export function getEBITDAStatus(ebitdaPercentage: number): {
  status: "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "BELOW_TARGET" | "CRITICAL" | "LOSS";
  color: string;
  emoji: string;
} {
  if (ebitdaPercentage >= EBITDA_ASPIRATIONAL) {
    return { status: "EXCELLENT", color: "text-green-600", emoji: "✅" };
  } else if (ebitdaPercentage >= EBITDA_TARGET) {
    return { status: "GOOD", color: "text-green-600", emoji: "✅" };
  } else if (ebitdaPercentage >= EBITDA_FLOOR) {
    return { status: "ACCEPTABLE", color: "text-yellow-600", emoji: "🟡" };
  } else if (ebitdaPercentage >= 0.25) {
    return { status: "BELOW_TARGET", color: "text-orange-600", emoji: "🟡" };
  } else if (ebitdaPercentage >= 0) {
    return { status: "CRITICAL", color: "text-red-600", emoji: "🔴" };
  } else {
    return { status: "LOSS", color: "text-red-600", emoji: "🔴" };
  }
}

/**
 * Calculate price needed for target EBITDA
 */
export function getPriceForTargetEBITDA(
  monthlyCost: number,
  targetEBITDAPercentage: number
): number {
  // Formula: Price = Cost ÷ (1 - EBITDA%)
  return monthlyCost / (1 - targetEBITDAPercentage);
}

/**
 * Multi-duration discount structure
 */
export interface DurationDiscount {
  duration: "Monthly" | "Quarterly" | "Half-Yearly" | "9-Month" | "Annual";
  months: number;
  discountPercentage: number;
}

export const DURATION_DISCOUNTS: DurationDiscount[] = [
  { duration: "Monthly", months: 1, discountPercentage: 0 },
  { duration: "Quarterly", months: 3, discountPercentage: 5 },
  { duration: "Half-Yearly", months: 6, discountPercentage: 10 },
  { duration: "9-Month", months: 9, discountPercentage: 12 },
  { duration: "Annual", months: 12, discountPercentage: 15 },
];

/**
 * Calculate effective monthly price with duration discount
 */
export function getEffectiveMonthlyPrice(
  baseMonthlyPrice: number,
  discountPercentage: number
): number {
  return baseMonthlyPrice * (1 - discountPercentage / 100);
}

/**
 * Check if duration discount is allowed based on EBITDA floor
 */
export function isDurationAllowed(
  baseMonthlyPrice: number,
  monthlyCost: number,
  discountPercentage: number
): boolean {
  const effectivePrice = getEffectiveMonthlyPrice(baseMonthlyPrice, discountPercentage);
  const { ebitdaPercentage } = calculateEBITDA(effectivePrice, monthlyCost);
  return meetsEBITDAFloor(ebitdaPercentage);
}
