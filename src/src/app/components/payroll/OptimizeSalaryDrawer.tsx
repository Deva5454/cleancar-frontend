/**
 * Optimize Salary Drawer
 *
 * Side drawer that shows tax optimization suggestions
 * Opens from salary screens with "⚡ Optimize Salary" button
 *
 * NON-DISRUPTIVE: Overlay only - does not navigate away
 */

import { useState, useEffect } from "react";
import type { IndianState } from "../../services/payroll/complianceRules";
import type { SalaryStructure } from "../../services/payroll/complianceEngine";
import {
  compareTaxRegimes,
  suggestSalaryOptimizations,
  getTaxSavingTips,
} from "../../services/payroll/taxOptimizationEngine";
import { X, Zap, TrendingUp, TrendingDown, Lightbulb, ArrowRight } from "lucide-react";

interface OptimizeSalaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  state: IndianState;
  salary: SalaryStructure;
  onApplyOptimization?: (optimizedSalary: SalaryStructure) => void;
}

export function OptimizeSalaryDrawer({
  isOpen,
  onClose,
  state,
  salary,
  onApplyOptimization,
}: OptimizeSalaryDrawerProps) {
  const [activeTab, setActiveTab] = useState<"comparison" | "suggestions">("comparison");

  // Calculate optimizations
  const regimeComparison = compareTaxRegimes(state, salary);
  const optimization = suggestSalaryOptimizations(state, salary);
  const tips = getTaxSavingTips(state, salary);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (onApplyOptimization) {
      onApplyOptimization(optimization.optimized.structure);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Optimize Your Salary
              </h2>
              <p className="text-sm text-gray-500">
                Maximize take-home with tax-efficient structuring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("comparison")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "comparison"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Tax Regime Comparison
            </button>
            <button
              onClick={() => setActiveTab("suggestions")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "suggestions"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Optimization Suggestions
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {activeTab === "comparison" && (
            <>
              {/* Recommendation Banner */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-green-900">
                      {regimeComparison.recommendation.betterRegime === "old"
                        ? "Old Regime Recommended"
                        : "New Regime Recommended"}
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      {regimeComparison.recommendation.reason}
                    </div>
                    <div className="text-lg font-bold text-green-600 mt-2">
                      Annual Savings: ₹
                      {(regimeComparison?.recommendation?.savings ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Component
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Old Regime
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        New Regime
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Taxable Income
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        ₹{(regimeComparison?.oldRegime?.taxableIncome ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        ₹{(regimeComparison?.newRegime?.taxableIncome ?? 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Total Deductions
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">
                        -₹{(regimeComparison?.oldRegime?.deductions ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-400">
                        -₹{(regimeComparison?.newRegime?.deductions ?? 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Tax Payable
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        ₹{(regimeComparison?.oldRegime?.taxPayable ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        ₹{(regimeComparison?.newRegime?.taxPayable ?? 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-blue-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-blue-900">
                        Annual Take-Home
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-900">
                        ₹{(regimeComparison?.oldRegime?.takeHome ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-900">
                        ₹{(regimeComparison?.newRegime?.takeHome ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "suggestions" && (
            <>
              {/* Savings Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-700">Current Take-Home</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    ₹{(optimization?.current?.netTakeHome ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">per month</div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-700">Optimized Take-Home</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    ₹{(optimization?.optimized?.netTakeHome ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    +₹{(optimization?.savings?.monthly ?? 0).toLocaleString()} per month
                  </div>
                </div>
              </div>

              {/* Component Suggestions */}
              {optimization.suggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Restructuring Suggestions
                  </h3>

                  {optimization.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {suggestion.component}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {suggestion.reason}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500">Current</div>
                          <div className="text-sm font-medium text-gray-900">
                            ₹{(suggestion?.current ?? 0).toLocaleString()}
                          </div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-gray-400" />

                        <div className="flex-1">
                          <div className="text-xs text-gray-500">Suggested</div>
                          <div className="text-sm font-medium text-green-600">
                            ₹{(suggestion?.suggested ?? 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Tips */}
              {tips.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Tax-Saving Tips
                    </h3>
                  </div>

                  {tips.map((tip, index) => (
                    <div
                      key={index}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-gray-900">{tip.tip}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {tip.category}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          Save ₹{(tip?.savings ?? 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Apply Button */}
              {optimization.savings.monthly > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleApply}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Apply Optimized Structure
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    This will update the salary structure with suggested values
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
