/**
 * Optimization Layer Demo
 *
 * Demonstrates all employee optimization features:
 * 1. Optimize Salary button with side drawer
 * 2. Savings insight cards
 * 3. Payslip explainer drawer
 * 4. Tax planner link
 *
 * Route: /payroll/optimization-demo
 */

import { useState } from "react";
import type { IndianState } from "../../services/payroll/complianceRules";
import type { SalaryStructure } from "../../services/payroll/complianceEngine";
import { OptimizeSalaryDrawer } from "../../components/payroll/OptimizeSalaryDrawer";
import { PayslipExplainerDrawer } from "../../components/payroll/PayslipExplainerDrawer";
import {
  SavingsInsightCard,
  TaxSavingsCard,
  RegimeSwitchCard,
  InvestmentTipCard,
} from "../../components/payroll/SavingsInsightCard";
import { Zap, HelpCircle, Calculator, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function OptimizationLayerDemo() {
  const [state] = useState<IndianState>("GJ");
  const [salary, setSalary] = useState<SalaryStructure>({
    basic: 18000,
    hra: 7200,
    conveyance: 1600,
    medicalAllowance: 1250,
    specialAllowance: 4950,
    otherAllowances: 0,
  });

  const [optimizeDrawerOpen, setOptimizeDrawerOpen] = useState(false);
  const [explainerDrawerOpen, setExplainerDrawerOpen] = useState(false);

  const gross =
    salary.basic +
    salary.hra +
    salary.conveyance +
    salary.medicalAllowance +
    salary.specialAllowance +
    salary.otherAllowances;

  // Mock payslip data
  const payslipData = {
    earnings: {
      basic: salary.basic,
      hra: salary.hra,
      conveyance: salary.conveyance,
      medical: salary.medicalAllowance,
      special: salary.specialAllowance,
      other: salary.otherAllowances,
    },
    deductions: {
      pf: Math.round(salary.basic * 0.12),
      esi: gross <= 21000 ? Math.round(gross * 0.0075) : 0,
      pt: 200,
      lwf: 1,
      tds: Math.round(gross * 0.03),
      advance: 0,
    },
    gross,
    totalDeductions:
      Math.round(salary.basic * 0.12) +
      (gross <= 21000 ? Math.round(gross * 0.0075) : 0) +
      200 +
      1 +
      Math.round(gross * 0.03),
    netPay:
      gross -
      (Math.round(salary.basic * 0.12) +
        (gross <= 21000 ? Math.round(gross * 0.0075) : 0) +
        200 +
        1 +
        Math.round(gross * 0.03)),
  };

  const handleApplyOptimization = (optimizedSalary: SalaryStructure) => {
    setSalary(optimizedSalary);
    alert("Salary structure optimized successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Employee Optimization Layer</h1>
              <p className="text-purple-100 mt-2">
                Intelligent features to maximize your take-home salary and tax savings
              </p>
            </div>
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-900">Optimize Salary</h3>
            </div>
            <p className="text-sm text-gray-600">
              Side drawer with tax-efficient restructuring suggestions
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Payslip Explainer</h3>
            </div>
            <p className="text-sm text-gray-600">
              Understand every component of your salary in simple terms
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Calculator className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Tax Planner</h3>
            </div>
            <p className="text-sm text-gray-600">
              Comprehensive tax planning and investment suggestions
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Visual Insights</h3>
            </div>
            <p className="text-sm text-gray-600">
              Smart cards showing savings opportunities at a glance
            </p>
          </div>
        </div>

        {/* Demo Section 1: Optimize Salary */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Current Salary Structure
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Click "Optimize Salary" to see tax-saving suggestions
              </p>
            </div>
            <button
              onClick={() => setOptimizeDrawerOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all"
            >
              <Zap className="w-5 h-5" />
              Optimize Salary
            </button>
          </div>

          {/* Salary Table */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Basic Salary", value: salary.basic },
              { label: "HRA", value: salary.hra },
              { label: "Conveyance", value: salary.conveyance },
              { label: "Medical", value: salary.medicalAllowance },
              { label: "Special", value: salary.specialAllowance },
              { label: "Other", value: salary.otherAllowances },
            ].map((item, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{item.label}</div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  ₹{item.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">
                Gross Salary
              </span>
              <span className="text-2xl font-bold text-blue-600">
                ₹{gross.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Demo Section 2: Savings Insights */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">
            Smart Savings Insights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TaxSavingsCard
              savings={24000}
              onOptimize={() => setOptimizeDrawerOpen(true)}
            />

            <RegimeSwitchCard
              savings={18000}
              regime="old"
              onLearnMore={() => alert("Learn more about tax regimes")}
            />

            <InvestmentTipCard
              amount={100000}
              savings={30000}
              onInvest={() => window.open("/payroll/tax-planner", "_blank")}
            />
          </div>
        </div>

        {/* Demo Section 3: Payslip */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Monthly Payslip</h2>
              <p className="text-sm text-gray-500 mt-1">
                Click "Explain My Payslip" to understand each component
              </p>
            </div>
            <button
              onClick={() => setExplainerDrawerOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              <HelpCircle className="w-5 h-5" />
              Explain My Payslip
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Earnings
              </h3>
              <div className="space-y-2">
                {Object.entries(payslipData.earnings).map(([key, value]) => (
                  value > 0 && (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="font-medium text-gray-900">
                        ₹{value.toLocaleString()}
                      </span>
                    </div>
                  )
                ))}
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between font-semibold">
                  <span className="text-gray-900">Gross</span>
                  <span className="text-green-600">
                    ₹{payslipData.gross.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Deductions
              </h3>
              <div className="space-y-2">
                {Object.entries(payslipData.deductions).map(([key, value]) => (
                  value > 0 && (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600 uppercase">{key}</span>
                      <span className="font-medium text-red-600">
                        -₹{value.toLocaleString()}
                      </span>
                    </div>
                  )
                ))}
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between font-semibold">
                  <span className="text-gray-900">Total Deductions</span>
                  <span className="text-red-600">
                    -₹{payslipData.totalDeductions.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t-2 border-gray-300 bg-green-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">Net Pay</span>
              <span className="text-3xl font-bold text-green-600">
                ₹{payslipData.netPay.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Demo Section 4: Tax Planner Link */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-6 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calculator className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Need More Tax Planning Help?
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Use our comprehensive Tax Planner tool to compare regimes, plan
                  investments, and maximize your take-home salary with expert
                  suggestions.
                </p>
                <Link
                  to="/payroll/tax-planner"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                >
                  <Calculator className="w-5 h-5" />
                  Open Tax Planner
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Implementation Highlights
          </h2>

          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>
                <strong>Non-Disruptive Design:</strong> All features open as drawers/overlays,
                never navigating away from current screen
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>
                <strong>Tax Optimization Engine:</strong> Compares Old vs New regime,
                suggests optimal salary structure
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>
                <strong>Employee-Friendly:</strong> Simple explanations for complex
                statutory components
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>
                <strong>Visual Insights:</strong> Compact cards show savings opportunities
                at a glance
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>
                <strong>Investment Planning:</strong> 80C, NPS, and HRA optimization
                suggestions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Drawers */}
      <OptimizeSalaryDrawer
        isOpen={optimizeDrawerOpen}
        onClose={() => setOptimizeDrawerOpen(false)}
        state={state}
        salary={salary}
        onApplyOptimization={handleApplyOptimization}
      />

      <PayslipExplainerDrawer
        isOpen={explainerDrawerOpen}
        onClose={() => setExplainerDrawerOpen(false)}
        payslipData={payslipData}
      />
    </div>
  );
}
