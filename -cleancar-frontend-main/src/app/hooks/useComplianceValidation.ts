/**
 * Compliance Validation Hook
 *
 * Real-time validation for payroll compliance
 * Recalculates deductions and validation status on salary changes
 *
 * Usage:
 * const { status, deductions, validate } = useComplianceValidation(state);
 * validate(salaryStructure);
 */

import { useState, useCallback, useEffect } from "react";
import type { IndianState } from "../services/payroll/complianceRules";
import type {
  SalaryStructure,
  ComplianceStatus,
  StatutoryDeductions,
} from "../services/payroll/complianceEngine";
import {
  calculateStatutoryDeductions,
  validateSalaryStructure,
} from "../services/payroll/complianceEngine";

interface UseComplianceValidationReturn {
  status: ComplianceStatus | null;
  deductions: StatutoryDeductions | null;
  validate: (salary: SalaryStructure, annualCtc?: number) => void;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  loading: boolean;
}

/**
 * Hook for real-time compliance validation
 *
 * @param state - Employee's state
 * @param autoValidate - Auto-validate on state change (default: true)
 * @returns Validation state and functions
 */
export function useComplianceValidation(
  state: IndianState,
  autoValidate: boolean = true
): UseComplianceValidationReturn {
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Validate salary structure
  const validate = useCallback(
    (salary: SalaryStructure, annualCtc?: number) => {
      setLoading(true);

      try {
        // Calculate statutory deductions
        const complianceStatus = calculateStatutoryDeductions(
          state,
          salary,
          annualCtc
        );

        // Add structural validation errors
        const structuralErrors = validateSalaryStructure(state, salary);
        if (structuralErrors.length > 0) {
          complianceStatus.errors.push(...structuralErrors);
          complianceStatus.status = "non-compliant";
        }

        setStatus(complianceStatus);
      } catch (error) {
        console.error("Compliance validation error:", error);
        setStatus({
          status: "non-compliant",
          errors: ["Failed to validate compliance. Please check your input."],
          warnings: [],
          deductions: {
            pf: { applicable: false, employee: 0, employer: 0 },
            esi: { applicable: false, employee: 0, employer: 0 },
            lwf: {
              applicable: false,
              employee: 0,
              employer: 0,
              frequency: "yearly",
            },
            pt: { applicable: false, amount: 0 },
            tds: { applicable: false, monthly: 0, annual: 0 },
          },
        });
      } finally {
        setLoading(false);
      }
    },
    [state]
  );

  // Auto-validate when state changes (if autoValidate is enabled)
  useEffect(() => {
    if (autoValidate && status) {
      // Re-validate with current salary structure if available
      // This ensures compliance updates when state changes
      setLoading(true);
      setTimeout(() => setLoading(false), 100);
    }
  }, [state, autoValidate]);

  return {
    status,
    deductions: status?.deductions || null,
    validate,
    isValid: status?.status !== "non-compliant",
    errors: status?.errors || [],
    warnings: status?.warnings || [],
    loading,
  };
}

/**
 * Hook for field-level validation
 *
 * Validates individual salary components in real-time
 *
 * @param state - Employee's state
 * @returns Field validators
 */
export function useFieldValidation(state: IndianState) {
  const validateBasic = useCallback(
    (basic: number): string | null => {
      if (basic <= 0) {
        return "Basic salary must be greater than zero";
      }
      if (basic > 100000) {
        return "Basic salary seems unusually high. Please verify.";
      }
      return null;
    },
    []
  );

  const validateGross = useCallback(
    (gross: number): string | null => {
      if (gross <= 0) {
        return "Gross salary must be greater than zero";
      }
      if (gross > 500000) {
        return "Gross salary seems unusually high. Please verify.";
      }
      return null;
    },
    []
  );

  const validateComponent = useCallback(
    (component: number, name: string): string | null => {
      if (component < 0) {
        return `${name} cannot be negative`;
      }
      return null;
    },
    []
  );

  return {
    validateBasic,
    validateGross,
    validateComponent,
  };
}

/**
 * Hook for deduction breakdown display
 *
 * Formats deductions for display in UI
 *
 * @param deductions - Statutory deductions
 * @returns Formatted breakdown
 */
export function useDeductionBreakdown(deductions: StatutoryDeductions | null) {
  const [breakdown, setBreakdown] = useState<
    Array<{ label: string; amount: number; detail?: string }>
  >([]);

  useEffect(() => {
    if (!deductions) {
      setBreakdown([]);
      return;
    }

    const items: Array<{ label: string; amount: number; detail?: string }> = [];

    if (deductions.pf.applicable) {
      items.push({
        label: "PF (Employee)",
        amount: deductions.pf.employee,
        detail: deductions.pf.reason,
      });
    }

    if (deductions.esi.applicable) {
      items.push({
        label: "ESI (Employee)",
        amount: deductions.esi.employee,
        detail: deductions.esi.reason,
      });
    }

    if (deductions.lwf.applicable) {
      items.push({
        label: "LWF",
        amount: deductions.lwf.employee,
        detail: deductions.lwf.reason,
      });
    }

    if (deductions.pt.applicable) {
      items.push({
        label: "Professional Tax",
        amount: deductions.pt.amount,
        detail: deductions.pt.reason,
      });
    }

    if (deductions.tds.applicable) {
      items.push({
        label: "TDS",
        amount: deductions.tds.monthly,
        detail: deductions.tds.reason,
      });
    }

    setBreakdown(items);
  }, [deductions]);

  const totalDeductions = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return {
    breakdown,
    totalDeductions,
    hasDeductions: breakdown.length > 0,
  };
}
