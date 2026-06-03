/**
 * Compliance Panel Component
 *
 * NON-DISRUPTIVE compliance overlay for payroll forms
 * Shows real-time statutory calculations and validation
 *
 * Usage:
 * <CompliancePanel
 *   state={state}
 *   salary={salaryStructure}
 *   onStateChange={setState}
 * />
 */

import { useEffect } from "react";
import type { IndianState } from "../../services/payroll/complianceRules";
import type { SalaryStructure } from "../../services/payroll/complianceEngine";
import { ComplianceStatusBadge } from "./ComplianceStatusBadge";
import { StateSelector } from "./StateSelector";
import {
  useComplianceValidation,
  useDeductionBreakdown,
} from "../../hooks/useComplianceValidation";
import { Info, TrendingDown, TrendingUp } from "lucide-react";

interface CompliancePanelProps {
  state: IndianState;
  salary: SalaryStructure;
  onStateChange: (state: IndianState) => void;
  city?: string;
  annualCtc?: number;
  compact?: boolean; // Compact mode for side panel
}

export function CompliancePanel({
  state,
  salary,
  onStateChange,
  city,
  annualCtc,
  compact = false,
}: CompliancePanelProps) {
  const { status, deductions, validate, loading } = useComplianceValidation(state);
  const { breakdown, totalDeductions, hasDeductions } = useDeductionBreakdown(deductions);

  // Validate on mount and when inputs change
  useEffect(() => {
    validate(salary, annualCtc);
  }, [salary, annualCtc, validate]);

  const grossSalary =
    salary.basic +
    salary.hra +
    salary.conveyance +
    salary.medicalAllowance +
    salary.specialAllowance +
    salary.otherAllowances;

  const netSalary = grossSalary - totalDeductions;

  if (compact) {
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {/* State Selector */}
        <StateSelector
          value={state}
          onChange={onStateChange}
          city={city}
          label="Employee State"
        />

        {/* Compliance Status */}
        {status && (
          <div>
            <ComplianceStatusBadge status={status} showDetails />
          </div>
        )}

        {/* Quick Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Gross Salary</span>
            <span className="font-medium">₹{grossSalary.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Deductions</span>
            <span className="font-medium text-red-600">
              -₹{totalDeductions.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-300">
            <span className="font-medium text-gray-900">Net Salary</span>
            <span className="font-bold text-green-600">
              ₹{netSalary.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Statutory Compliance
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Auto-calculated based on state rules
          </p>
        </div>
        {status && <ComplianceStatusBadge status={status} />}
      </div>

      {/* State Selector */}
      <StateSelector
        value={state}
        onChange={onStateChange}
        city={city}
        label="Employee State"
      />

      {/* Deductions Breakdown */}
      {hasDeductions && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <TrendingDown className="w-4 h-4" />
            <span>Statutory Deductions</span>
          </div>

          <div className="space-y-2">
            {breakdown.map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {item.label}
                  </div>
                  {item.detail && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.detail}
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold text-red-600">
                  -₹{(item?.amount ?? 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Total Deductions */}
          <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg border border-red-100">
            <span className="text-sm font-medium text-red-900">
              Total Deductions
            </span>
            <span className="text-sm font-bold text-red-700">
              -₹{totalDeductions.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Employer Contributions (Info) */}
      {deductions && (deductions.pf.applicable || deductions.esi.applicable || deductions.lwf.applicable) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <TrendingUp className="w-4 h-4" />
            <span>Employer Contributions</span>
          </div>

          <div className="space-y-2">
            {deductions.pf.applicable && (
              <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg text-sm">
                <span className="text-blue-900">PF (Employer)</span>
                <span className="font-semibold text-blue-700">
                  ₹{(deductions?.pf?.employer ?? 0).toLocaleString()}
                </span>
              </div>
            )}

            {deductions.esi.applicable && (
              <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg text-sm">
                <span className="text-blue-900">ESI (Employer)</span>
                <span className="font-semibold text-blue-700">
                  ₹{(deductions?.esi?.employer ?? 0).toLocaleString()}
                </span>
              </div>
            )}

            {deductions.lwf.applicable && (
              <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg text-sm">
                <span className="text-blue-900">LWF (Employer)</span>
                <span className="font-semibold text-blue-700">
                  ₹{(deductions?.lwf?.employer ?? 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Net Salary Summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Gross Salary</span>
            <span className="font-medium">₹{grossSalary.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Deductions</span>
            <span className="font-medium text-red-600">
              -₹{totalDeductions.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-base pt-2 border-t border-gray-300">
            <span className="font-semibold text-gray-900">Net Salary</span>
            <span className="font-bold text-green-600 text-lg">
              ₹{netSalary.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {status && (
        <div className="pt-4 border-t border-gray-200">
          <ComplianceStatusBadge status={status} showDetails />
        </div>
      )}

      {/* Info Note */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Statutory deductions are calculated automatically based on state-specific
          rules (PF, ESI, LWF, PT, TDS). Net salary updates in real-time as you
          modify the salary structure.
        </p>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-sm text-gray-600">Recalculating...</div>
        </div>
      )}
    </div>
  );
}
