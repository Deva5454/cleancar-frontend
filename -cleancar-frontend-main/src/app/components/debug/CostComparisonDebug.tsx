/**
 * ============================================================================
 * COST COMPARISON DEBUG COMPONENT (DEV MODE ONLY)
 * ============================================================================
 *
 * PHASE 1: Shows side-by-side comparison of old vs new cost calculations
 *
 * Purpose:
 * - Validate central cost engine against existing module calculations
 * - Display differences for debugging
 * - Only visible in development mode
 *
 * Usage:
 * <CostComparisonDebug
 *   moduleName="CostPerWashModule"
 *   oldCost={245}
 *   newResult={centralEngineResult}
 * />
 *
 * ============================================================================
 */

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertCircle, CheckCircle, Info, TrendingDown, TrendingUp } from "lucide-react";
import type { CostCalculationResult, CostComparison } from "../../services/centralCostEngine";
import { compareCosts } from "../../services/centralCostEngine";

interface CostComparisonDebugProps {
  moduleName: string;
  oldCost: number;
  newResult: CostCalculationResult;
  threshold?: number; // % difference allowed (default 1%)
}

export function CostComparisonDebug({
  moduleName,
  oldCost,
  newResult,
  threshold = 1.0,
}: CostComparisonDebugProps) {
  // Only show in development mode
  const isDevelopment = import.meta.env.MODE === "development" || import.meta.env.DEV;

  if (!isDevelopment) {
    return null;
  }

  // Compare costs
  const comparison: CostComparison = compareCosts(oldCost, newResult, moduleName, threshold);

  // Determine status
  const isMatch = comparison.isMatch;
  const hasIncrease = newResult.costPerWash > oldCost;

  return (
    <Card className="border-2 border-dashed border-purple-300 bg-purple-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-600" />
            Cost Comparison Debug ({moduleName})
          </CardTitle>
          <Badge variant="outline" className="bg-purple-100 text-purple-700">
            DEV MODE ONLY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isMatch ? (
            <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Match (within {threshold}%)
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 border-red-300 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Mismatch (exceeds {threshold}%)
            </Badge>
          )}
        </div>

        {/* Cost Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Old Cost */}
          <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
            <p className="text-xs text-gray-600 mb-1">Old Calculation</p>
            <p className="text-2xl font-bold text-gray-900">₹{oldCost.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Existing module logic</p>
          </div>

          {/* New Cost */}
          <div className="p-3 bg-purple-100 rounded-lg border border-purple-300">
            <p className="text-xs text-purple-600 mb-1">New Calculation</p>
            <p className="text-2xl font-bold text-purple-900">₹{newResult.costPerWash.toFixed(2)}</p>
            <p className="text-xs text-purple-600 mt-1">Central cost engine</p>
          </div>
        </div>

        {/* Difference */}
        <div
          className={`p-3 rounded-lg border ${
            isMatch
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasIncrease ? (
                <TrendingUp className={`w-4 h-4 ${isMatch ? "text-green-600" : "text-red-600"}`} />
              ) : (
                <TrendingDown className={`w-4 h-4 ${isMatch ? "text-green-600" : "text-red-600"}`} />
              )}
              <span className={`text-sm font-medium ${isMatch ? "text-green-900" : "text-red-900"}`}>
                Difference
              </span>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isMatch ? "text-green-700" : "text-red-700"}`}>
                {hasIncrease ? "+" : "-"}₹{comparison.difference.toFixed(2)}
              </p>
              <p className={`text-xs ${isMatch ? "text-green-600" : "text-red-600"}`}>
                ({hasIncrease ? "+" : "-"}{comparison.differencePercent.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="border-t border-purple-200 pt-3">
          <p className="text-xs font-medium text-purple-900 mb-2">New Engine Breakdown:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Labour:</span>
              <span className="font-medium">₹{newResult.breakdown.labourCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Consumables:</span>
              <span className="font-medium">₹{newResult.breakdown.consumablesCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Utilities:</span>
              <span className="font-medium">₹{newResult.breakdown.utilitiesCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fixed Costs:</span>
              <span className="font-medium">₹{newResult.breakdown.fixedCosts.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maintenance:</span>
              <span className="font-medium">₹{newResult.breakdown.maintenanceCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transport:</span>
              <span className="font-medium">₹{(newResult.breakdown.transportCost || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-purple-200">
            <span className="text-gray-700 font-medium">Total Washes:</span>
            <span className="font-bold text-purple-900">{newResult.totalWashes}</span>
          </div>
        </div>

        {/* Warning if mismatch */}
        {!isMatch && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-3">
            <p className="text-xs text-red-900 font-medium mb-1">⚠️ Investigation Required</p>
            <p className="text-xs text-red-700">
              Cost difference exceeds threshold. Check calculation logic in {moduleName} or
              verify central engine inputs.
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 border-t border-purple-200 pt-2">
          <p>Period: {newResult.period}</p>
          <p>Calculated: {new Date(newResult._calculatedAt).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
