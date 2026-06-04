/**
 * Salary Structure Form with Integrated Compliance
 *
 * Example integration of CompliancePanel into existing payroll form
 * NON-DISRUPTIVE: Existing form fields remain unchanged
 *
 * Usage:
 * <SalaryStructureForm employeeId="EMP-001" />
 */

import { useState } from "react";
import type { IndianState } from "../../services/payroll/complianceRules";
import type { SalaryStructure } from "../../services/payroll/complianceEngine";
import { CompliancePanel } from "./CompliancePanel";
import { useFieldValidation } from "../../hooks/useComplianceValidation";
import { DollarSign } from "lucide-react";

interface SalaryStructureFormProps {
  employeeId: string;
  initialState?: IndianState;
  initialSalary?: Partial<SalaryStructure>;
  onSave?: (salary: SalaryStructure, state: IndianState) => void;
  city?: string;
}

export function SalaryStructureForm({
  employeeId,
  initialState = "GJ",
  initialSalary,
  onSave,
  city,
}: SalaryStructureFormProps) {
  // State
  const [state, setState] = useState<IndianState>(initialState);
  const [salary, setSalary] = useState<SalaryStructure>({
    basic: initialSalary?.basic || 0,
    hra: initialSalary?.hra || 0,
    conveyance: initialSalary?.conveyance || 0,
    medicalAllowance: initialSalary?.medicalAllowance || 0,
    specialAllowance: initialSalary?.specialAllowance || 0,
    otherAllowances: initialSalary?.otherAllowances || 0,
  });

  // Field validation
  const { validateBasic, validateComponent } = useFieldValidation(state);

  // Handle field changes
  const handleFieldChange = (field: keyof SalaryStructure, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSalary((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  // Calculate gross
  const grossSalary = Object.values(salary).reduce((sum, val) => sum + val, 0);

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(salary, state);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Salary Components (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Form Header */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Salary Structure
            </h2>
            <p className="text-sm text-gray-500">
              Employee ID: {employeeId}
            </p>
          </div>
        </div>

        {/* Salary Components Form */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Salary Components
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Basic Salary <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                <input
                  type="number"
                  value={salary.basic || ""}
                  onChange={(e) => handleFieldChange("basic", e.target.value)}
                  className={`
                    w-full pl-8 pr-3 py-2 border rounded-lg
                    ${
                      validateBasic(salary.basic)
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                    }
                    focus:outline-none focus:ring-2
                  `}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
              {validateBasic(salary.basic) && (
                <p className="text-xs text-red-600 mt-1">
                  {validateBasic(salary.basic)}
                </p>
              )}
            </div>

            {/* HRA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House Rent Allowance (HRA)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                <input
                  type="number"
                  value={salary.hra || ""}
                  onChange={(e) => handleFieldChange("hra", e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            {/* Conveyance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conveyance Allowance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                <input
                  type="number"
                  value={salary.conveyance || ""}
                  onChange={(e) => handleFieldChange("conveyance", e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            {/* Medical Allowance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical Allowance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                <input
                  type="number"
                  value={salary.medicalAllowance || ""}
                  onChange={(e) =>
                    handleFieldChange("medicalAllowance", e.target.value)
                  }
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            {/* Special Allowance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Allowance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                <input
                  type="number"
                  value={salary.specialAllowance || ""}
                  onChange={(e) =>
                    handleFieldChange("specialAllowance", e.target.value)
                  }
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            {/* Other Allowances */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Allowances
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                <input
                  type="number"
                  value={salary.otherAllowances || ""}
                  onChange={(e) =>
                    handleFieldChange("otherAllowances", e.target.value)
                  }
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>

          {/* Gross Salary Display */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">
                Gross Salary (Monthly)
              </span>
              <span className="text-lg font-bold text-gray-900">
                ₹{grossSalary.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Salary Structure
          </button>
          <button
            type="button"
            className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Right Column: Compliance Panel (1/3 width) */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-6">
          <CompliancePanel
            state={state}
            salary={salary}
            onStateChange={setState}
            city={city}
          />
        </div>
      </div>
    </div>
  );
}
