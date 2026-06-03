/**
 * useEmployeeData Hook - PHASE 4 AGGREGATOR
 *
 * Unified employee data interface that aggregates all domain contexts
 * Provides enriched employee data with salary, incentives, attendance, and performance
 *
 * ARCHITECTURAL PATTERN:
 * This hook is an AGGREGATOR that combines:
 * - EmployeeContext (core identity)
 * - PayrollContext (salary, payroll runs)
 * - IncentiveContext (incentive plans, calculations)
 * - AttendanceContext (attendance records)
 * - OrgContext (roles, departments, designations)
 *
 * Single source of truth: Each domain context owns its data
 * This hook provides a convenient unified API for components
 */

import { useMemo, useCallback } from "react";
import { useEmployee, type Employee as CoreEmployee, type EmployeeStatus } from "../contexts/EmployeeContext";
import { usePayroll } from "../contexts/PayrollContext";
import { useIncentive } from "../contexts/IncentiveContext";
import { useAttendance } from "../contexts/AttendanceContext";
import { useOrg, type EmployeeRole } from "../contexts/OrgContext";

// ========== ENRICHED EMPLOYEE TYPE ==========

/**
 * Enriched Employee with computed fields and domain data
 */
export interface EnrichedEmployee extends CoreEmployee {
  // Computed fields
  fullName: string;
  isProfileComplete: boolean;
  completionScore: number; // 0-100
  missingFields: string[];

  // Domain data (aggregated from other contexts)
  salary?: {
    type?: "fixed" | "hourly" | "per_car" | "hybrid";
    base?: number;
    structureId?: string;
    components?: {
      basic?: number;
      hra?: number;
      allowances?: number;
      deductions?: number;
    };
    paymentCycle?: "weekly" | "monthly";
  };

  incentives?: {
    planId?: string;
    type?: "per_car" | "target_based" | "revenue_share" | "tiered";
    target?: number;
    achieved?: number;
    calculatedAmount?: number;
    status?: string;
  };

  performance?: {
    totalCarsWashed?: number;
    rating?: number;
    attendanceScore?: number;
    lastUpdated?: string;
  };
}

// ========== PROFILE COMPLETION LOGIC ==========

function calculateProfileCompletion(employee: CoreEmployee): {
  isComplete: boolean;
  score: number;
  missing: string[];
} {
  const missing: string[] = [];
  let score = 0;

  // Base fields (always present) - 40 points
  score += 40;

  // Salary configuration - 30 points
  if (employee.salaryStructureId || employee.baseSalary) {
    score += 30;
  } else {
    missing.push("Salary Configuration");
  }

  // Incentive plan - 20 points
  if (employee.incentivePlanId || employee.incentiveEligible) {
    score += 20;
  } else {
    missing.push("Incentive Plan");
  }

  // Bank details - 10 points
  if (employee.bankDetails && employee.bankDetails.accountNumber) {
    score += 10;
  } else {
    missing.push("Bank Details");
  }

  return {
    isComplete: score === 100,
    score,
    missing,
  };
}

// ========== MAIN HOOK ==========

export function useEmployeeData() {
  // PHASE 4: Import all domain contexts
  const employeeCtx = useEmployee();
  const payrollCtx = usePayroll();
  const incentiveCtx = useIncentive();
  const attendanceCtx = useAttendance();
  const orgCtx = useOrg();

  // ========== ENRICH EMPLOYEES ==========

  // ── Stable primitive deps to prevent unnecessary recomputes ─────────────
  const employees       = employeeCtx.employees;
  const payrollRuns     = payrollCtx.payrollRuns;
  const salaryStructures = payrollCtx.salaryStructures;
  const incentivePlans  = incentiveCtx.incentivePlans;
  const employeeIncentives = incentiveCtx.employeeIncentives;

  const enrichedEmployees = useMemo((): EnrichedEmployee[] => {
    return employees.map((employee) => {
      const { isComplete, score, missing } = calculateProfileCompletion(employee);

      // Salary — from structure or legacy baseSalary
      let salary = undefined;
      if (employee.salaryStructureId) {
        const structure = salaryStructures.find(s => s.structureId === employee.salaryStructureId);
        if (structure) {
          salary = {
            type: structure.type,
            base: structure.components.basic,
            structureId: structure.structureId,
            components: structure.components,
            paymentCycle: "monthly" as const,
          };
        }
      } else if (employee.baseSalary) {
        salary = { type: "fixed" as const, base: employee.baseSalary, paymentCycle: "monthly" as const };
      }

      // Incentives — from plan or legacy flag
      let incentives = undefined;
      if (employee.incentivePlanId) {
        const employeeIncentive = employeeIncentives.find(i => i.employeeId === employee.employeeId);
        const plan = incentivePlans.find(p => p.planId === employee.incentivePlanId);
        if (employeeIncentive && plan) {
          incentives = {
            planId: plan.planId,
            type: plan.type,
            target: employeeIncentive.target,
            achieved: employeeIncentive.achieved,
            calculatedAmount: employeeIncentive.calculatedAmount,
            status: employeeIncentive.status,
          };
        }
      } else if (employee.incentiveEligible) {
        incentives = { type: "per_car" as const, target: 0, achieved: 0 };
      }

      // ✅ PERFORMANCE FIX: Attendance is NOT computed here for all employees.
      // getAttendanceByEmployee + getMonthlyAttendanceSummary per employee = O(n²).
      // Components that need attendance for a specific employee should call
      // attendanceCtx.getAttendanceByEmployee(employeeId) directly.
      const performance = {
        totalCarsWashed: 0,
        rating: 4.5,
        attendanceScore: 0, // Computed on-demand per employee, not bulk here
        lastUpdated: new Date().toISOString(),
      };

      return {
        ...employee,
        fullName: `${employee.firstName} ${employee.lastName}`,
        isProfileComplete: isComplete,
        completionScore: score,
        missingFields: missing,
        salary,
        incentives,
        performance,
      };
    });
  // ✅ Stable primitive deps — avoids recompute when unrelated context state changes
  }, [employees, salaryStructures, incentivePlans, employeeIncentives]);

  // ========== HELPER FUNCTIONS ==========

  const getEnrichedEmployee = useCallback((employeeId: string): EnrichedEmployee | undefined => {
    return enrichedEmployees.find((emp) => emp.employeeId === employeeId);
  }, [enrichedEmployees]);

  const getIncompleteProfiles = useCallback((): EnrichedEmployee[] => {
    return enrichedEmployees.filter((emp) => !emp.isProfileComplete);
  }, [enrichedEmployees]);

  const getCompleteProfiles = useCallback((): EnrichedEmployee[] => {
    return enrichedEmployees.filter((emp) => emp.isProfileComplete);
  }, [enrichedEmployees]);

  // ========== DOMAIN-SPECIFIC UPDATE HELPERS ==========

  const updateEmployeeWithSalary = useCallback((
    employeeId: string,
    salaryData: {
      type: "fixed" | "hourly" | "per_car" | "hybrid";
      base: number;
      components?: {
        basic?: number;
        hra?: number;
        allowances?: number;
        deductions?: number;
      };
      paymentCycle?: "weekly" | "monthly";
    }
  ): void => {
    // Create salary structure if it doesn't exist
    const structure = payrollCtx.addSalaryStructure({
      name: `Salary Structure - ${employeeId}`,
      type: salaryData.type,
      components: salaryData.components || {
        basic: salaryData.base,
        hra: 0,
        allowances: 0,
        deductions: 0,
      },
      applicableRoles: [],
      isActive: true,
    });

    // Update employee reference
    employeeCtx.updateEmployee(employeeId, {
      salaryStructureId: structure.structureId,
      baseSalary: salaryData.base, // Keep for backward compatibility
    });
  }, [employeeCtx, payrollCtx]);

  const updateEmployeeWithIncentives = useCallback((
    employeeId: string,
    incentiveData: {
      planId?: string;
      type?: "per_car" | "target_based" | "revenue_share" | "tiered";
      target?: number;
    }
  ): void => {
    if (incentiveData.planId) {
      // Assign existing plan
      incentiveCtx.assignIncentivePlan(employeeId, incentiveData.planId);
    }

    // Update employee reference
    employeeCtx.updateEmployee(employeeId, {
      incentivePlanId: incentiveData.planId,
      incentiveEligible: true, // Keep for backward compatibility
    });
  }, [employeeCtx, incentiveCtx]);

  const updateEmployeePerformance = useCallback((
    employeeId: string,
    performanceData: {
      totalCarsWashed?: number;
      rating?: number;
    }
  ): void => {
    // Performance is calculated, not stored directly
    // Update achievement in incentive context
    if (performanceData.totalCarsWashed !== undefined) {
      incentiveCtx.updateAchievement(employeeId, performanceData.totalCarsWashed);
    }
  }, [incentiveCtx]);

  // ========== UNIFIED API ==========

  return {
    // PHASE 4: Core employee data (enriched)
    employees: enrichedEmployees,
    getEmployeeById: getEnrichedEmployee,
    enrichedEmployees,
    getEnrichedEmployee,

    // Profile filtering
    getIncompleteProfiles,
    getCompleteProfiles,

    // Employee operations (pass-through to EmployeeContext)
    addEmployee: employeeCtx.addEmployee,
    updateEmployee: employeeCtx.updateEmployee,
    deleteEmployee: employeeCtx.deleteEmployee,
    getEmployeesByRole: employeeCtx.getEmployeesByRole,

    // Domain-specific updates
    updateEmployeeWithSalary,
    updateEmployeeWithIncentives,
    updateEmployeePerformance,

    // Organizational data (pass-through from OrgContext)
    roles: orgCtx.roles,
    departments: orgCtx.departments,
    designations: orgCtx.designations,
    publicHolidays: orgCtx.publicHolidays,

    // Attendance data (pass-through from AttendanceContext)
    attendanceRecords: attendanceCtx.attendanceRecords,
    addAttendanceRecord: attendanceCtx.addAttendanceRecord,
    updateAttendance: attendanceCtx.updateAttendance,
    getEmployeeAttendance: attendanceCtx.getAttendanceForDate, // Renamed for consistency
    getAttendanceByEmployee: attendanceCtx.getAttendanceByEmployee,
    getMonthlyAttendanceSummary: attendanceCtx.getMonthlyAttendanceSummary,

    // Payroll data (pass-through from PayrollContext)
    payrollRuns: payrollCtx.payrollRuns,
    getPayrollForMonth: payrollCtx.getPayrollForMonth,
    processPayroll: payrollCtx.processPayroll,
    applyHROverride: payrollCtx.applyHROverride,
    approvePayrollByHR: payrollCtx.approvePayrollByHR,
    approvePayrollByFinance: payrollCtx.approvePayrollByFinance,
    markPayrollAsPaid: payrollCtx.markPayrollAsPaid,

    // Incentive data (pass-through from IncentiveContext)
    incentivePlans: incentiveCtx.incentivePlans,
    getIncentivePlan: incentiveCtx.getIncentivePlan,

    // Statistics
    profileCompletionRate:
      employeeCtx.employees.length > 0
        ? (enrichedEmployees.filter((e) => e.isProfileComplete).length /
            employeeCtx.employees.length) *
          100
        : 0,
  };
}

/**
 * Backward Compatibility: Migration helper
 * (Not needed in Phase 4 - all data in proper domains)
 */
export function migrateEmployeeToNewStructure(employee: CoreEmployee): Partial<CoreEmployee> {
  const updates: Partial<CoreEmployee> = {};

  // Already handled by domain contexts
  return updates;
}
