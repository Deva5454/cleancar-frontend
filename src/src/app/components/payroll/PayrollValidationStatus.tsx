/**
 * Payroll Validation Status Component
 *
 * Shows validation status before payroll can be processed
 * Displays missing data, errors, and warnings
 */

import React from "react";
import type { PayrollValidationResult } from "../../services/PayrollAutomationEngine";

interface PayrollValidationStatusProps {
  validation: PayrollValidationResult;
  employeeId: string;
  month: string;
  year: number;
  onRetry?: () => void;
  className?: string;
}

export function PayrollValidationStatus({
  validation,
  employeeId,
  month,
  year,
  onRetry,
  className = "",
}: PayrollValidationStatusProps) {
  const { valid, errors, warnings, missingData } = validation;

  if (valid) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-green-900">Ready to Process</h4>
            <p className="text-sm text-green-700 mt-1">
              All required data is available for {employeeId} ({month} {year})
            </p>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-xs font-medium text-green-800 mb-2">Warnings:</p>
            <ul className="space-y-1">
              {warnings.map((warning, idx) => (
                <li key={idx} className="text-xs text-green-700 flex items-start gap-2">
                  <span className="text-yellow-500">⚠</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-900">Cannot Process Payroll</h4>
          <p className="text-sm text-red-700 mt-1">
            Missing required data for {employeeId} ({month} {year})
          </p>
        </div>
      </div>

      {/* Missing Data */}
      {missingData.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-red-800 mb-2">Missing Data:</p>
          <ul className="space-y-1">
            {missingData.map((missing, idx) => (
              <li key={idx} className="text-xs text-red-700 flex items-start gap-2">
                <span className="text-red-500">✕</span>
                <span>{missing}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-red-800 mb-2">Errors:</p>
          <ul className="space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-xs text-red-700 flex items-start gap-2">
                <span className="text-red-500">!</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-yellow-800 mb-2">Warnings:</p>
          <ul className="space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx} className="text-xs text-yellow-700 flex items-start gap-2">
                <span className="text-yellow-500">⚠</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Required */}
      <div className="mt-4 pt-4 border-t border-red-200">
        <p className="text-xs font-medium text-red-900 mb-2">Action Required:</p>
        <ul className="space-y-2 text-xs text-red-800">
          {missingData.includes("No attendance records found for the month") && (
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>Mark attendance for all working days in {month} {year}</span>
            </li>
          )}
          {errors.some((e) => e.includes("already processed")) && (
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>Payroll already exists. Delete existing payroll to reprocess.</span>
            </li>
          )}
        </ul>

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
          >
            Retry Validation
          </button>
        )}
      </div>
    </div>
  );
}

interface PayrollValidationListProps {
  validations: {
    employeeId: string;
    employeeName?: string;
    validation: PayrollValidationResult;
  }[];
  month: string;
  year: number;
  className?: string;
}

export function PayrollValidationList({
  validations,
  month,
  year,
  className = "",
}: PayrollValidationListProps) {
  const validCount = validations.filter((v) => v.validation.valid).length;
  const invalidCount = validations.filter((v) => !v.validation.valid).length;

  return (
    <div className={className}>
      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Validation Summary - {month} {year}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{validations.length}</p>
            <p className="text-xs text-gray-500">Total Employees</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{validCount}</p>
            <p className="text-xs text-green-600">Ready</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
            <p className="text-xs text-red-600">Blocked</p>
          </div>
        </div>
      </div>

      {/* Invalid Validations First */}
      {invalidCount > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-red-900 mb-3">Blocked Employees</h4>
          <div className="space-y-3">
            {validations
              .filter((v) => !v.validation.valid)
              .map((item) => (
                <PayrollValidationStatus
                  key={item.employeeId}
                  validation={item.validation}
                  employeeId={item.employeeId}
                  month={month}
                  year={year}
                />
              ))}
          </div>
        </div>
      )}

      {/* Valid Validations */}
      {validCount > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-green-900 mb-3">Ready to Process</h4>
          <div className="space-y-2">
            {validations
              .filter((v) => v.validation.valid)
              .map((item) => (
                <div
                  key={item.employeeId}
                  className="bg-green-50 border border-green-200 rounded px-4 py-2 flex items-center justify-between"
                >
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        {item.employeeName || item.employeeId}
                      </p>
                      {item.validation.warnings.length > 0 && (
                        <p className="text-xs text-yellow-600">
                          {item.validation.warnings.length} warning(s)
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-green-700 font-medium">Ready</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
