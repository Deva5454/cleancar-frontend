/**
 * ============================================================================
 * CENTRAL COST ENGINE REACT HOOK
 * ============================================================================
 *
 * PHASE 2: Primary cost calculation hook for all modules
 *
 * Purpose:
 * - Provides React hook wrapper around central cost engine
 * - Memoizes results to prevent unnecessary recalculations
 * - Simplifies integration into components
 *
 * Usage:
 * const { calculate, result } = useCentralCostEngine();
 * calculate(inputs);
 *
 * ============================================================================
 */

import { useState, useCallback, useMemo } from "react";
import {
  calculateCostPerWash,
  type CostCalculationInputs,
  type CostCalculationResult,
} from "../services/centralCostEngine";

export interface UseCentralCostEngineOptions {
  /** Period identifier (e.g., "April 2026", "2026-04") */
  period?: string;

  /** Auto-calculate on input change */
  autoCalculate?: boolean;
}

export function useCentralCostEngine(options: UseCentralCostEngineOptions = {}) {
  const { period = new Date().toISOString().substring(0, 7), autoCalculate = false } = options;

  const [result, setResult] = useState<CostCalculationResult | null>(null);
  const [inputs, setInputs] = useState<CostCalculationInputs | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Calculate cost per wash from inputs
   */
  const calculate = useCallback((newInputs: CostCalculationInputs) => {
    try {
      const calculationResult = calculateCostPerWash(newInputs, period);
      setResult(calculationResult);
      setInputs(newInputs);
      setError(null);
      return calculationResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[useCentralCostEngine] Calculation error:", error);
      return null;
    }
  }, [period]);

  /**
   * Recalculate with current inputs
   */
  const recalculate = useCallback(() => {
    if (inputs) {
      return calculate(inputs);
    }
    return null;
  }, [inputs, calculate]);

  /**
   * Reset calculation
   */
  const reset = useCallback(() => {
    setResult(null);
    setInputs(null);
    setError(null);
  }, []);

  /**
   * Memoized cost per wash value
   */
  const costPerWash = useMemo(() => result?.costPerWash ?? 0, [result]);

  /**
   * Memoized breakdown
   */
  const breakdown = useMemo(() => result?.breakdown ?? null, [result]);

  /**
   * Memoized total cost
   */
  const totalCost = useMemo(() => result?.totalCost ?? 0, [result]);

  /**
   * Check if calculated
   */
  const isCalculated = useMemo(() => result !== null, [result]);

  return {
    // Calculation functions
    calculate,
    recalculate,
    reset,

    // Results
    result,
    costPerWash,
    breakdown,
    totalCost,
    inputs,

    // Status
    isCalculated,
    error,
  };
}

/**
 * Helper: Convert monthly costs to per-wash costs
 */
export function monthlyCostsToPerWash(
  monthlyCosts: {
    labour: number;
    consumables: number;
    utilities: number;
    fixedCosts: number;
    maintenance: number;
    transport?: number;
  },
  totalWashes: number
): CostCalculationInputs {
  return {
    labourCost: monthlyCosts.labour,
    consumablesCost: monthlyCosts.consumables,
    utilitiesCost: monthlyCosts.utilities,
    fixedCosts: monthlyCosts.fixedCosts,
    maintenanceCost: monthlyCosts.maintenance,
    transportCost: monthlyCosts.transport,
    totalWashes,
  };
}

/**
 * Helper: Convert per-wash costs to monthly costs
 */
export function perWashCostsToMonthly(
  perWashCosts: {
    materials: number;
    labour: number;
    overhead: number;
    equipment: number;
    variables: number;
  },
  totalWashes: number
): CostCalculationInputs {
  return {
    labourCost: perWashCosts.labour * totalWashes,
    consumablesCost: perWashCosts.materials * totalWashes,
    utilitiesCost: perWashCosts.overhead * totalWashes,
    fixedCosts: 0, // Included in overhead
    maintenanceCost: perWashCosts.equipment * totalWashes,
    transportCost: perWashCosts.variables * totalWashes,
    totalWashes,
  };
}
