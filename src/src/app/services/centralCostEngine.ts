/**
 * ============================================================================
 * CENTRAL COST-PER-WASH CALCULATION ENGINE
 * ============================================================================
 *
 * PHASE 1: PARALLEL VALIDATION (NO BEHAVIOR CHANGE)
 *
 * Purpose:
 * - Unified cost calculation logic across all modules
 * - Single source of truth for cost-per-wash computation
 * - Runs IN PARALLEL with existing module calculations
 * - Validates accuracy before migration
 *
 * Current Status: DEV MODE ONLY - COMPARISON ONLY
 *
 * Data Sources:
 * - FinanceContext: Revenue, expenses, payroll
 * - InventoryContext: Consumables usage
 * - JobContext: Total washes completed
 * - EmployeeContext: Labor costs
 *
 * ============================================================================
 */

import { logger } from "./logger";

/**
 * Cost breakdown structure
 */
export interface CostBreakdown {
  labourCost: number;
  consumablesCost: number;
  utilitiesCost: number;
  fixedCosts: number;
  maintenanceCost: number;
  transportCost?: number;
  totalCost: number;
}

/**
 * Cost calculation inputs
 */
export interface CostCalculationInputs {
  // Labour (from FinanceContext / EmployeeData)
  labourCost: number;                    // Total labour cost for period

  // Consumables (from InventoryContext)
  consumablesCost: number;               // Materials used in period

  // Utilities (from FinanceContext)
  utilitiesCost: number;                 // Water, electricity, etc.

  // Fixed Costs (from FinanceContext)
  fixedCosts: number;                    // Rent, insurance, etc.

  // Maintenance (from FinanceContext)
  maintenanceCost: number;               // Equipment maintenance

  // Optional: Transport (from FinanceContext)
  transportCost?: number;                // Fuel, vehicle costs

  // Volume (from JobContext)
  totalWashes: number;                   // Total washes in period
}

/**
 * Cost calculation result with comparison
 */
export interface CostCalculationResult {
  costPerWash: number;
  breakdown: CostBreakdown;
  totalCost: number;
  totalWashes: number;
  period: string;

  // Validation fields (Phase 1 only)
  _isNewEngine: true;
  _calculatedAt: string;
}

/**
 * Central cost-per-wash calculation engine
 *
 * @param inputs - Cost calculation inputs from contexts
 * @param period - Period identifier (e.g., "April 2026", "2026-04")
 * @returns Cost calculation result
 */
export function calculateCostPerWash(
  inputs: CostCalculationInputs,
  period: string = new Date().toISOString().substring(0, 7)
): CostCalculationResult {
  const {
    labourCost,
    consumablesCost,
    utilitiesCost,
    fixedCosts,
    maintenanceCost,
    transportCost = 0,
    totalWashes,
  } = inputs;

  // Validate inputs
  if (totalWashes <= 0) {
    logger.warn('CentralCostEngine: Invalid totalWashes', { totalWashes });
    throw new Error('totalWashes must be greater than 0');
  }

  // Calculate total cost
  const totalCost =
    labourCost +
    consumablesCost +
    utilitiesCost +
    fixedCosts +
    maintenanceCost +
    transportCost;

  // Calculate cost per wash
  const costPerWash = totalCost / totalWashes;

  // Build breakdown
  const breakdown: CostBreakdown = {
    labourCost,
    consumablesCost,
    utilitiesCost,
    fixedCosts,
    maintenanceCost,
    transportCost,
    totalCost,
  };

  // Return result
  return {
    costPerWash: Math.round(costPerWash * 100) / 100, // Round to 2 decimals
    breakdown,
    totalCost: Math.round(totalCost * 100) / 100,
    totalWashes,
    period,
    _isNewEngine: true,
    _calculatedAt: new Date().toISOString(),
  };
}

/**
 * Compare old calculation with new engine
 * (Phase 1: Validation only)
 *
 * @param oldCost - Cost from existing module calculation
 * @param newResult - Result from central engine
 * @param moduleName - Name of module for logging
 * @returns Comparison summary
 */
export interface CostComparison {
  oldCost: number;
  newCost: number;
  difference: number;
  differencePercent: number;
  isMatch: boolean;
  threshold: number;
}

export function compareCosts(
  oldCost: number,
  newResult: CostCalculationResult,
  moduleName: string,
  threshold: number = 1.0 // Allow 1% difference
): CostComparison {
  const newCost = newResult.costPerWash;
  const difference = Math.abs(newCost - oldCost);
  const differencePercent = (difference / oldCost) * 100;
  const isMatch = differencePercent <= threshold;

  // Log comparison
  logger.debug(`CentralCostEngine: ${moduleName} comparison`, {
    oldCost,
    newCost,
    difference: difference.toFixed(2),
    differencePercent: differencePercent.toFixed(2) + '%',
    isMatch,
  });

  // Warn on mismatch
  if (!isMatch) {
    logger.warn(`CentralCostEngine: Cost mismatch in ${moduleName}`, {
      oldCost,
      newCost,
      difference: difference.toFixed(2),
      differencePercent: differencePercent.toFixed(2) + '%',
      threshold: threshold + '%',
    });
  }

  return {
    oldCost,
    newCost,
    difference,
    differencePercent,
    isMatch,
    threshold,
  };
}

/**
 * Calculate cost-per-wash from context data
 * Helper that extracts data from contexts and calls central engine
 *
 * @param contexts - Object containing context data
 * @param period - Period identifier
 * @returns Cost calculation result
 */
export interface ContextData {
  totalLabourCost: number;
  totalConsumablesCost: number;
  totalUtilitiesCost: number;
  totalFixedCosts: number;
  totalMaintenanceCost: number;
  totalTransportCost?: number;
  totalWashes: number;
}

export function calculateCostPerWashFromContexts(
  contexts: ContextData,
  period: string = new Date().toISOString().substring(0, 7)
): CostCalculationResult {
  const inputs: CostCalculationInputs = {
    labourCost: contexts.totalLabourCost,
    consumablesCost: contexts.totalConsumablesCost,
    utilitiesCost: contexts.totalUtilitiesCost,
    fixedCosts: contexts.totalFixedCosts,
    maintenanceCost: contexts.totalMaintenanceCost,
    transportCost: contexts.totalTransportCost || 0,
    totalWashes: contexts.totalWashes,
  };

  return calculateCostPerWash(inputs, period);
}

/**
 * Extract mock data for development comparison
 * (Phase 1: Until contexts are fully integrated)
 *
 * @param totalWashes - Total washes from module
 * @returns Mock context data
 */
export function getMockContextData(totalWashes: number): ContextData {
  // Mock data aligned with existing modules
  return {
    totalLabourCost: 40000,      // 1 washer (15000) + 1 supervisor allocation (25000)
    totalConsumablesCost: 18000,  // Materials + consumables
    totalUtilitiesCost: 2500,     // Water, minimal electricity
    totalFixedCosts: 6499,        // Insurance + software + uniforms
    totalMaintenanceCost: 6100,   // Equipment depreciation + maintenance
    totalTransportCost: 3750,     // Fuel/transport per 250 washes @ ₹15/wash
    totalWashes,
  };
}
