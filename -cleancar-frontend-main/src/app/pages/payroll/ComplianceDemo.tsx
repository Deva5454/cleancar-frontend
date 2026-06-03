/**
 * Compliance Demo Page
 *
 * Demonstrates the non-disruptive compliance layer integration
 * Shows salary structure form with real-time compliance validation
 *
 * Route: /payroll/compliance-demo
 */

import { SalaryStructureForm } from "../../components/payroll/SalaryStructureForm";
import { Info, CheckCircle } from "lucide-react";
import type { SalaryStructure } from "../../services/payroll/complianceEngine";
import type { IndianState } from "../../services/payroll/complianceRules";

export default function ComplianceDemo() {
  const handleSave = (salary: SalaryStructure, state: IndianState) => {
    console.log("Saving salary structure:", salary, "for state:", state);
    alert(`Salary structure saved for state: ${state}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Compliance Layer Demo
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time statutory compliance validation for Indian payroll
              </p>
            </div>
          </div>

          {/* Feature List */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-blue-900">
                  State-Specific Rules
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  PF, ESI, LWF, PT, TDS calculations for 10 Indian states
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-green-900">
                  Real-Time Validation
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Instant feedback with error detection and warnings
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-purple-900">
                  Non-Disruptive
                </div>
                <div className="text-xs text-purple-700 mt-1">
                  Integrates seamlessly without changing existing forms
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Form */}
        <SalaryStructureForm
          employeeId="EMP-DEMO-001"
          initialState="GJ"
          initialSalary={{
            basic: 18000,
            hra: 7200,
            conveyance: 1600,
            medicalAllowance: 1250,
            specialAllowance: 4950,
            otherAllowances: 0,
          }}
          city="Surat"
          onSave={handleSave}
        />

        {/* Implementation Notes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Implementation Highlights
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                ✅ Core Files Created
              </h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">complianceRules.ts</code> - State-specific statutory rules for 10 states</li>
                <li>• <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">complianceEngine.ts</code> - Calculation and validation engine</li>
                <li>• <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">useComplianceValidation.ts</code> - React hooks for real-time validation</li>
                <li>• <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">CompliancePanel.tsx</code> - Reusable compliance UI component</li>
                <li>• <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">StateSelector.tsx</code> - State selection dropdown with auto-detection</li>
                <li>• <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">ComplianceStatusBadge.tsx</code> - Status indicator component</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                ✅ Supported Statutory Components
              </h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• <strong>PF (Provident Fund)</strong>: 12% employee + 12% employer on basic (capped at ₹15,000)</li>
                <li>• <strong>ESI (Employee State Insurance)</strong>: 0.75% employee + 3.25% employer when gross ≤ ₹21,000</li>
                <li>• <strong>LWF (Labour Welfare Fund)</strong>: State-specific flat amounts (monthly/yearly/half-yearly)</li>
                <li>• <strong>PT (Professional Tax)</strong>: State-specific slab-based calculation</li>
                <li>• <strong>TDS (Tax Deducted at Source)</strong>: Progressive tax slabs on annual income</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                ✅ Supported States
              </h3>
              <div className="text-sm text-gray-600">
                Gujarat (GJ), Maharashtra (MH), Karnataka (KA), Delhi (DL), Tamil Nadu (TN),
                Uttar Pradesh (UP), Rajasthan (RJ), West Bengal (WB), Andhra Pradesh (AP),
                Telangana (TG)
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                ✅ Integration Pattern
              </h3>
              <div className="text-sm text-gray-600">
                The compliance panel is a standalone component that can be added to any salary
                form as a sidebar. It requires only <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">state</code>,{" "}
                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">salary</code>, and{" "}
                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">onStateChange</code> props.
                No modifications to existing form logic required.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
