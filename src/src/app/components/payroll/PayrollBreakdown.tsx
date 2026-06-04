/**
 * Payroll Breakdown Component - Shows detailed calculation breakdown
 *
 * Displays:
 * - Attendance summary
 * - Basic salary calculation
 * - Allowances
 * - Incentives
 * - Deductions
 * - Penalties
 * - Net pay
 */

import React from "react";
import type { PayrollCalculation } from "../../services/PayrollAutomationEngine";

interface PayrollBreakdownProps {
  calculation: PayrollCalculation;
  className?: string;
}

export function PayrollBreakdown({ calculation, className = "" }: PayrollBreakdownProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Payroll Breakdown - {calculation.month} {calculation.year}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Automated calculation • Calculated at {new Date(calculation.calculatedAt).toLocaleString()}
        </p>
      </div>

      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Attendance Summary */}
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Attendance Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total Working Days</p>
              <p className="text-2xl font-bold text-gray-900">{calculation.totalWorkingDays}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600">Present Days</p>
              <p className="text-2xl font-bold text-green-900">{calculation.presentDays}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-red-600">Absent Days</p>
              <p className="text-2xl font-bold text-red-900">{calculation.absentDays}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-xs text-yellow-600">Late Days</p>
              <p className="text-2xl font-bold text-yellow-900">{calculation.lateDays}</p>
            </div>
          </div>
        </section>

        {/* Basic Salary Calculation */}
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Basic Salary Calculation</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Monthly Basic Salary</span>
              <span className="text-sm font-medium text-gray-900">₹{(calculation?.basicSalary ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Per Day Rate</span>
              <span className="text-sm font-medium text-gray-900">₹{(calculation?.perDayRate ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded">
              <span className="text-sm font-medium text-blue-900">Earned Basic Salary</span>
              <span className="text-sm font-bold text-blue-900">₹{(calculation?.earnedBasicSalary ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Allowances */}
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Allowances</h4>
          <div className="space-y-2">
            {calculation.allowances.map((allowance, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{allowance.name}</span>
                <span className="text-sm font-medium text-green-600">+₹{(allowance?.amount ?? 0).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded">
              <span className="text-sm font-medium text-green-900">Total Allowances</span>
              <span className="text-sm font-bold text-green-900">+₹{(calculation?.totalAllowances ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Incentives */}
        {calculation.incentives.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Incentives</h4>
            <div className="space-y-2">
              {calculation.incentives.map((incentive, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{incentive.type}</span>
                  <span className="text-sm font-medium text-green-600">+₹{(incentive?.amount ?? 0).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded">
                <span className="text-sm font-medium text-green-900">Total Incentives</span>
                <span className="text-sm font-bold text-green-900">+₹{(calculation?.totalIncentives ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </section>
        )}

        {/* Gross Pay */}
        <section>
          <div className="flex justify-between items-center py-3 bg-blue-100 px-4 rounded-lg">
            <span className="text-base font-semibold text-blue-900">Gross Pay</span>
            <span className="text-lg font-bold text-blue-900">₹{(calculation?.grossPay ?? 0).toLocaleString()}</span>
          </div>
        </section>

        {/* Deductions */}
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Deductions</h4>
          <div className="space-y-2">
            {calculation.deductions.map((deduction, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{deduction.name}</span>
                <span className="text-sm font-medium text-red-600">-₹{(deduction?.amount ?? 0).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 bg-red-50 px-3 rounded">
              <span className="text-sm font-medium text-red-900">Total Deductions</span>
              <span className="text-sm font-bold text-red-900">-₹{(calculation?.totalDeductions ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Penalties */}
        {calculation.penalties.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Penalties</h4>
            <div className="space-y-2">
              {calculation.penalties.map((penalty, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{penalty.type}</span>
                  <span className="text-sm font-medium text-red-600">-₹{(penalty?.amount ?? 0).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 bg-red-50 px-3 rounded">
                <span className="text-sm font-medium text-red-900">Total Penalties</span>
                <span className="text-sm font-bold text-red-900">-₹{(calculation?.totalPenalties ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </section>
        )}

        {/* Net Pay */}
        <section className="pt-4 border-t-2 border-gray-300">
          <div className="flex justify-between items-center py-4 bg-green-100 px-6 rounded-lg">
            <div>
              <p className="text-sm text-green-700 mb-1">Net Pay</p>
              <p className="text-2xl font-bold text-green-900">₹{(calculation?.netPay ?? 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                Automated
              </span>
            </div>
          </div>
        </section>

        {/* Calculation Details */}
        <section className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Calculation Formula</h4>
          <div className="text-xs text-gray-600 space-y-1 font-mono">
            <p>Earned Basic = (Present Days × Per Day Rate)</p>
            <p>Gross Pay = Earned Basic + Allowances + Incentives</p>
            <p>Net Pay = Gross Pay - Deductions - Penalties</p>
          </div>
        </section>
      </div>
    </div>
  );
}

interface PayrollBreakdownCardProps {
  payrollId: string;
  calculation: PayrollCalculation;
  onClose?: () => void;
  className?: string;
}

export function PayrollBreakdownCard({
  payrollId,
  calculation,
  onClose,
  className = "",
}: PayrollBreakdownCardProps) {
  return (
    <div className={`relative ${className}`}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}

      <PayrollBreakdown calculation={calculation} />

      <div className="mt-4 flex items-center justify-between px-6 py-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-500">
          Payroll ID: <span className="font-mono font-medium text-gray-700">{payrollId}</span>
        </div>
        <button
          onClick={() => window.print()}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Print Breakdown
        </button>
      </div>
    </div>
  );
}
