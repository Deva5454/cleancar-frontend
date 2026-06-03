/**
 * Tax Planner Page
 *
 * Standalone tax planning and optimization tool
 * Accessible from Employee Dashboard → Tax Planner
 *
 * Features:
 * - Tax regime comparison
 * - Investment planning (80C, 80D, NPS)
 * - HRA calculator
 * - Annual tax projection
 */

import { useState } from "react";
import type { IndianState } from "../../services/payroll/complianceRules";
import type { SalaryStructure } from "../../services/payroll/complianceEngine";
import { StateSelector } from "../../components/payroll/StateSelector";
import {
  compareTaxRegimes,
  calculateInvestmentSavings,
  getTaxSavingTips,
} from "../../services/payroll/taxOptimizationEngine";
import {
  Calculator,
  TrendingUp,
  PiggyBank,
  FileText,
  Download,
  Lightbulb,
} from "lucide-react";
import { SavingsInsightCard } from "../../components/payroll/SavingsInsightCard";

export default function TaxPlannerPage() {
  // State
  const [state, setState] = useState<IndianState>("GJ");
  const [annualIncome, setAnnualIncome] = useState<number>(600000);
  const [currentInvestments, setCurrentInvestments] = useState<number>(50000);

  // Mock salary structure (in production, fetch from user's actual data)
  const salary: SalaryStructure = {
    basic: Math.round((annualIncome / 12) * 0.4),
    hra: Math.round((annualIncome / 12) * 0.5),
    conveyance: 1600,
    medicalAllowance: 1250,
    specialAllowance: Math.round((annualIncome / 12) * 0.1) - 2850,
    otherAllowances: 0,
  };

  // Calculations
  const regimeComparison = compareTaxRegimes(state, salary, annualIncome);
  const investmentSavings = calculateInvestmentSavings(annualIncome, currentInvestments);
  const tips = getTaxSavingTips(state, salary);

  const handleDownloadReport = () => {
    alert("Tax planning report downloaded!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tax Planner</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Optimize your taxes and maximize take-home salary
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Annual Income */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Income (CTC)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">₹</span>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                min="0"
                step="10000"
              />
            </div>
          </div>

          {/* Current Investments */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Investments (80C)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">₹</span>
              <input
                type="number"
                value={currentInvestments}
                onChange={(e) => setCurrentInvestments(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                min="0"
                step="10000"
                max="150000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Max limit: ₹1,50,000
            </p>
          </div>

          {/* State Selection */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <StateSelector
              value={state}
              onChange={setState}
              label="Your State"
            />
          </div>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SavingsInsightCard
            type="savings"
            title="Recommended Regime"
            value={regimeComparison.recommendation.savings}
            description={`${regimeComparison.recommendation.betterRegime === "old" ? "Old" : "New"} regime saves you more`}
            compact
          />

          <SavingsInsightCard
            type="tip"
            title="Investment Opportunity"
            value={investmentSavings.potentialSavings}
            description={`Invest ₹${investmentSavings.remaining.toLocaleString()} more to save taxes`}
            compact
          />

          <SavingsInsightCard
            type="info"
            title="Annual Tax (Old Regime)"
            value={regimeComparison.oldRegime.taxPayable}
            description="Based on current salary structure"
            compact
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tax Regime Comparison */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Tax Regime Comparison
              </h2>
            </div>

            <div className="space-y-4">
              {/* Old Regime */}
              <div
                className={`p-4 border-2 rounded-lg ${
                  regimeComparison.recommendation.betterRegime === "old"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">Old Tax Regime</div>
                    <div className="text-xs text-gray-600">With deductions</div>
                  </div>
                  {regimeComparison.recommendation.betterRegime === "old" && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Taxable Income</span>
                    <span className="font-medium">
                      ₹{regimeComparison.oldRegime.taxableIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Deductions</span>
                    <span className="font-medium text-green-600">
                      -₹{regimeComparison.oldRegime.deductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold text-gray-900">Tax Payable</span>
                    <span className="font-bold text-red-600">
                      ₹{regimeComparison.oldRegime.taxPayable.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Take-Home</span>
                    <span className="font-bold text-green-600">
                      ₹{regimeComparison.oldRegime.takeHome.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* New Regime */}
              <div
                className={`p-4 border-2 rounded-lg ${
                  regimeComparison.recommendation.betterRegime === "new"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">New Tax Regime</div>
                    <div className="text-xs text-gray-600">Lower slabs, no deductions</div>
                  </div>
                  {regimeComparison.recommendation.betterRegime === "new" && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Taxable Income</span>
                    <span className="font-medium">
                      ₹{regimeComparison.newRegime.taxableIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Deductions</span>
                    <span className="font-medium text-gray-400">
                      ₹{regimeComparison.newRegime.deductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold text-gray-900">Tax Payable</span>
                    <span className="font-bold text-red-600">
                      ₹{regimeComparison.newRegime.taxPayable.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Take-Home</span>
                    <span className="font-bold text-green-600">
                      ₹{regimeComparison.newRegime.takeHome.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Investment Planning */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PiggyBank className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Investment Planning (80C)
              </h2>
            </div>

            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Investment Progress</span>
                  <span className="font-medium">
                    ₹{currentInvestments.toLocaleString()} / ₹
                    {investmentSavings.maxLimit.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                    style={{
                      width: `${(currentInvestments / investmentSavings.maxLimit) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-700">Remaining Limit</div>
                  <div className="text-lg font-bold text-blue-900">
                    ₹{investmentSavings.remaining.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs text-green-700">Potential Savings</div>
                  <div className="text-lg font-bold text-green-900">
                    ₹{investmentSavings.potentialSavings.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Suggestion */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-900">
                    {investmentSavings.suggestion}
                  </div>
                </div>
              </div>

              {/* Investment Options */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Popular Investment Options
                </div>
                {[
                  { name: "ELSS Mutual Funds", lock: "3 years", returns: "12-15%" },
                  { name: "PPF", lock: "15 years", returns: "7-8%" },
                  { name: "NPS (Tier I)", lock: "Till retirement", returns: "9-12%" },
                  { name: "Tax Saver FD", lock: "5 years", returns: "6-7%" },
                ].map((option, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {option.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          Lock-in: {option.lock}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-green-600">
                        {option.returns}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tax-Saving Tips */}
        {tips.length > 0 && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Personalized Tax-Saving Tips
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tips.map((tip, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs font-medium text-purple-700 uppercase">
                      {tip.category}
                    </div>
                    <div className="text-sm font-bold text-green-600">
                      Save ₹{tip.savings.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-900">{tip.tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
