/**
 * City Insights Dashboard - Integration Example
 * Shows how to integrate decision engine with city performance data
 */

import { useMemo } from "react";
import { useBusinessRules } from "../../contexts/BusinessRulesContext";
import { useRole } from "../../contexts/RoleContext";
import { generateCitySuggestions } from "../../services/decisionEngine";
import { SmartInsightsPanel } from "./SmartInsightsPanel";
import type { CityPerformanceInput } from "../../services/decisionEngine";

export function CityInsightsDashboard() {
  const { currentUser } = useRole();
  const {
    getRevenueTarget,
    getCostPerJob,
    getTargetMargin,
    getIncentiveMultiplier,
  } = useBusinessRules();

  // Mock performance data - replace with actual service calls
  const totalJobs = 10000;
  const avgSellingPrice = 200;
  const revenue = totalJobs * avgSellingPrice; // ₹2,000,000

  // City-specific values
  const revenueTarget = getRevenueTarget(currentUser.cityId);
  const costPerJob = getCostPerJob(currentUser.cityId);
  const targetMargin = getTargetMargin(currentUser.cityId);
  const incentiveMultiplier = getIncentiveMultiplier(currentUser.cityId);

  // Calculate financial metrics
  const totalCost = totalJobs * costPerJob;
  const profit = revenue - totalCost;
  const actualMargin = (profit / revenue) * 100;

  // Prepare input for decision engine
  const performanceInput: CityPerformanceInput = useMemo(() => ({
    cityId: currentUser.cityId,
    cityName: currentUser.cityId.replace("CITY-", ""),
    revenue,
    revenueTarget,
    cost: totalCost,
    margin: actualMargin,
    targetMargin,
    totalJobs,
    incentiveMultiplier,
  }), [
    currentUser.cityId,
    revenue,
    revenueTarget,
    totalCost,
    actualMargin,
    targetMargin,
    totalJobs,
    incentiveMultiplier,
  ]);

  // Generate insights
  const insights = useMemo(
    () => generateCitySuggestions(performanceInput),
    [performanceInput]
  );

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-lg border">
          <div className="text-sm text-gray-600">Revenue</div>
          <div className="text-2xl font-bold">₹{(revenue / 100000).toFixed(1)}L</div>
          <div className="text-xs text-gray-500">
            {((revenue / revenueTarget) * 100).toFixed(0)}% of target
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border">
          <div className="text-sm text-gray-600">Cost</div>
          <div className="text-2xl font-bold text-red-600">₹{(totalCost / 100000).toFixed(1)}L</div>
          <div className="text-xs text-gray-500">
            {((totalCost / revenue) * 100).toFixed(0)}% of revenue
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border">
          <div className="text-sm text-gray-600">Margin</div>
          <div className="text-2xl font-bold text-green-600">{actualMargin.toFixed(1)}%</div>
          <div className="text-xs text-gray-500">
            Target: {targetMargin}%
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border">
          <div className="text-sm text-gray-600">Jobs</div>
          <div className="text-2xl font-bold">{totalJobs.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            Avg ₹{avgSellingPrice}/job
          </div>
        </div>
      </div>

      {/* Smart Insights */}
      <SmartInsightsPanel result={insights} />
    </div>
  );
}
