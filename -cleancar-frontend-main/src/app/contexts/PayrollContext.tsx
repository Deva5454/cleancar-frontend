/**
 * PayrollContext - Payroll Management
 * PHASE 4: Domain-specific context for payroll data
 *
 * Owns:
 * - Payroll runs
 * - Salary structures
 * - Payroll processing
 *
 * Single source of truth for payroll
 */

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef} from "react";
import { DataService } from "../services/DataService";
import { logger } from "../services/logger";
import { useRole } from "./RoleContext";
// REMOVED: circular import useFinance from FinanceContext
import { useAttendance } from "./AttendanceContext"; // ✅ Attendance-aware payroll
import { calculateStatutoryDeductions, type ComplianceStatus } from "../services/payroll/complianceEngine";
import { type PayrollStatus, canTransition, canEdit } from "../utils/payrollWorkflow";

// ========== TYPES ==========

export interface PayrollRun {
  payrollId: string;
  employeeId: string;
  month: string; // YYYY-MM
  period: {
    startDate: string;
    endDate: string;
  };

  // ✅ NEW: Multi-city isolation + compliance
  cityId: string; // REQUIRED: Payroll city scope
  stateCode?: string; // OPTIONAL: State-based statutory rules (GJ, MH, KA, etc.)

  // Earnings
  baseSalary: number;
  incentiveAmount: number;
  addOnEarnings: number;
  allowances: number;
  grossSalary: number;

  // Deductions
  pf: number;
  esic: number;
  pt: number; // ✅ NEW: Professional Tax (state-specific)
  tds: number;
  advances: number;
  penalties: number;
  totalDeductions: number;

  // Attendance
  daysWorked?: number;  // Days present in the pay period
  totalDays?: number;   // Total working days in the pay period

  // Net
  netSalary: number;

  // ✅ MC-22: Workflow Engine Status
  status: PayrollStatus; // "draft" | "under_review" | "approved" | "disbursed"

  // Workflow audit trail
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  disbursedBy?: string;
  disbursedAt?: string;
  paymentReference?: string;

  // Legacy fields (deprecated - kept for backward compatibility)
  hrApprovedBy?: string;
  hrApprovedAt?: string;
  financeApprovedBy?: string;
  financeApprovedAt?: string;
  paidAt?: string;

  // HR Override
  hrOverride?: {
    originalAmount: number;
    overrideAmount: number;
    reason: string;
    approvedBy: string;
    approvalDate: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructure {
  structureId: string;
  name: string;
  description?: string;
  type: "fixed" | "hourly" | "per_car" | "hybrid";
  components: {
    basic: number;
    hra: number;
    allowances: number;
    deductions: number;
  };
  applicableRoles: string[];

  // ✅ NEW: Multi-city isolation + compliance
  cityId: string; // REQUIRED: Structure city scope
  stateCode?: string; // OPTIONAL: State-based statutory rules

  createdAt: string;
  updatedAt?: string;
}

// ========== CONTEXT TYPE ==========

interface PayrollContextType {
  // Payroll Runs
  payrollRuns: PayrollRun[];
  processPayroll: (payroll: Omit<PayrollRun, "payrollId" | "createdAt" | "updatedAt">) => PayrollRun;

  // ✅ MC-22: Workflow Engine Actions
  transitionPayroll: (payrollId: string, nextStatus: PayrollStatus, userId: string) => boolean;
  sendToReview: (payrollId: string, userId: string) => boolean;
  approvePayroll: (payrollId: string, userId: string) => boolean;
  disbursePayroll: (payrollId: string, userId: string, paymentReference: string) => boolean;
  rejectToDraft: (payrollId: string, userId: string) => boolean;

  // Legacy actions (deprecated - use workflow actions instead)
  updatePayrollStatus: (payrollId: string, status: PayrollRun["status"]) => void;
  approvePayrollByHR: (payrollId: string, approvedBy: string) => void;
  approvePayrollByFinance: (payrollId: string, approvedBy: string) => void;
  markPayrollAsPaid: (payrollId: string, paymentReference: string) => void;
  applyHROverride: (payrollId: string, overrideAmount: number, reason: string, approvedBy: string) => void;

  // Queries
  getPayrollByEmployee: (employeeId: string) => PayrollRun[];
  getPayrollForMonth: (month: string) => PayrollRun[];
  getPendingPayrolls: () => PayrollRun[];
  getPayrollById: (payrollId: string) => PayrollRun | undefined;

  // ✅ NEW: City filter methods
  getPayrollByCity: (cityId: string) => PayrollRun[];
  getPayrollForMonthByCity: (month: string, cityId: string) => PayrollRun[];

  // Salary Structures
  salaryStructures: SalaryStructure[];
  addSalaryStructure: (structure: Omit<SalaryStructure, "structureId" | "createdAt">) => SalaryStructure;
  updateSalaryStructure: (structureId: string, updates: Partial<SalaryStructure>) => void;
  deleteSalaryStructure: (structureId: string) => void;
  getSalaryStructure: (structureId: string) => SalaryStructure | undefined;
  getSalaryStructuresByCity: (cityId: string) => SalaryStructure[];

  // ✅ NEW: Auto Compliance Engine
  calculateStatutoryDeductions: (grossSalary: number, stateCode?: string) => ComplianceStatus;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

const DEFAULT_CITY = "CITY-SURAT"; // Backward compatibility default

// ✅ SAFETY FALLBACK: Prevents crash for old data without cityId
const withCityFallback = <T extends { cityId?: string }>(item: T, defaultCityId: string): T & { cityId: string } => ({
  ...item,
  cityId: item.cityId || defaultCityId,
});

// ========== PROVIDER ==========

export function PayrollProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useRole();
  // NOTE: useAttendance is called here — PayrollProvider is nested inside AttendanceProvider
  // in AppProvider. If AttendanceProvider is somehow missing, we get a safe fallback.
  const attendanceCtx = useAttendance();
  const computeDaysPresent = attendanceCtx?.computeDaysPresent ?? (() => 0);
  const currentCityId = currentUser.cityId || DEFAULT_CITY;
  // Defensive: FinanceProvider must be above PayrollProvider in AppProvider (now fixed).
  // This guard prevents crashes if provider order is ever changed again.
  // useFinance removed — salary payable fires via cc360_payroll_approved event

  const _dbSalaryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => {
    const stored = DataService.get<PayrollRun>("PAYROLL_RUNS");
    logger.debug("PayrollContext loaded", { count: stored.length });
    // Apply city fallback for old data
    return stored.map(run => withCityFallback(run, currentCityId));
  });

  const _dbPayrolTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>(() => {
    const stored = DataService.get<SalaryStructure>("SALARY_STRUCTURES");
    // Apply city fallback for old data
    return stored.map(structure => withCityFallback(structure, currentCityId));
  });

  // Persist to storage
    // Re-hydrate from localStorage after Supabase data loads
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored_payrollRuns = DataService.get<PayrollRun>("PAYROLL_RUNS");
      if (stored_payrollRuns.length > payrollRuns.length) { setPayrollRuns(stored_payrollRuns); }
    }, 1000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (_dbPayrolTimer.current) clearTimeout(_dbPayrolTimer.current);
    _dbPayrolTimer.current = setTimeout(() => DataService.setAll("PAYROLL_RUNS", payrollRuns), 500);
  }, [payrollRuns]);

  useEffect(() => {
    if (_dbSalaryTimer.current) clearTimeout(_dbSalaryTimer.current);
    _dbSalaryTimer.current = setTimeout(() => DataService.setAll("SALARY_STRUCTURES", salaryStructures), 500);
  }, [salaryStructures]);

  // ========== PAYROLL ACTIONS ==========

  const processPayroll = useCallback((
    payroll: Omit<PayrollRun, "payrollId" | "createdAt" | "updatedAt">
  ): PayrollRun => {
    const now = new Date().toISOString();

    // ── Attendance-aware salary computation ───────────────────────────────────
    // If daysWorked was not explicitly provided by the caller, compute it from
    // AttendanceContext (computeDaysPresent handles Present=1, Late=1, Half Day=0.5)
    const computedDaysWorked = (payroll.daysWorked != null)
      ? payroll.daysWorked
      : computeDaysPresent(payroll.employeeId, payroll.month);

    // Standard working days for the month (26 = industry standard, excluding Sundays)
    const totalWorkingDays = payroll.totalDays ?? 26;

    // Prorate gross salary if daysWorked < totalWorkingDays (LOP / attendance deduction)
    // Guard: if no attendance data exists (computedDaysWorked = 0) keep full salary
    //        to avoid accidentally zeroing pay on first use before attendance is recorded
    const hasAttendanceData = computedDaysWorked > 0;
    const attendanceFactor = (hasAttendanceData && computedDaysWorked < totalWorkingDays)
      ? computedDaysWorked / totalWorkingDays
      : 1;

    const adjustedGross = hasAttendanceData
      ? Math.round(payroll.grossSalary * attendanceFactor)
      : payroll.grossSalary;

    const lopDeduction = payroll.grossSalary - adjustedGross;

    const newPayroll: PayrollRun = {
      ...payroll,
      cityId:       payroll.cityId || currentCityId,
      status:       payroll.status || "draft",
      payrollId:    `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt:    now,
      updatedAt:    now,
      daysWorked:   computedDaysWorked,
      totalDays:    totalWorkingDays,
      grossSalary:  adjustedGross,
      // Carry forward any existing penalties + add LOP on top
      penalties:    (payroll.penalties || 0) + lopDeduction,
    };

    setPayrollRuns((prev) => [...prev, newPayroll]);
    logger.log("Payroll processed", {
      payrollId: newPayroll.payrollId,
      employeeId: newPayroll.employeeId,
      month: newPayroll.month,
      cityId: newPayroll.cityId,
      daysWorked: computedDaysWorked,
      totalDays: totalWorkingDays,
      lopDeduction,
      adjustedGross,
      status: newPayroll.status,
    });
    return newPayroll;
  }, [currentCityId, computeDaysPresent]);

  // ✅ MC-22: Workflow Engine Actions

  const transitionPayroll = useCallback((
    payrollId: string,
    nextStatus: PayrollStatus,
    userId: string
  ): boolean => {
    const payroll = payrollRuns.find(p => p.payrollId === payrollId);
    if (!payroll) {
      logger.error("Payroll not found", { payrollId });
      return false;
    }

    // ❌ BLOCK CROSS-CITY ACCESS (MC-24)
    if (payroll.cityId !== currentCityId) {
      logger.error("Unauthorized payroll access - city mismatch", {
        payrollId,
        payrollCity: payroll.cityId,
        userCity: currentCityId
      });
      console.error("⛔ Cannot access payroll from different city");
      return false;
    }

    // Get current user role for permission check
    const userRole = currentUser?.role;
    if (!userRole) {
      logger.error("No user role found", { userId });
      return false;
    }

    // Validate transition
    if (!canTransition(userRole, payroll.status, nextStatus)) {
      logger.error("Invalid workflow transition", {
        payrollId,
        currentStatus: payroll.status,
        nextStatus,
        role: userRole
      });
      return false;
    }

    // Apply transition
    const now = new Date().toISOString();
    setPayrollRuns((prev) =>
      prev.map((p) => {
        if (p.payrollId === payrollId) {
          const updated: PayrollRun = { ...p, status: nextStatus, updatedAt: now };

          // Update audit trail based on status
          if (nextStatus === "under_review") {
            updated.reviewedBy = userId;
            updated.reviewedAt = now;
          } else if (nextStatus === "approved") {
            updated.approvedBy = userId;
            updated.approvedAt = now;

            // Fire cc360_payroll_approved — FinanceContext listener creates the payable
            try {
              const _evt = {
                type: "Salary",
                employeeId: p.employeeId,
                amount: p.netSalary,
                dueDate: p.month + "-28",
                status: "Pending",
                description: `Salary — ${p.employeeId} — ${p.month}`,
                cityId: p.cityId,
              };
              window.dispatchEvent(new CustomEvent("cc360_payroll_approved", { detail: _evt }));
            } catch (_e) { /* non-critical */ }
          } else if (nextStatus === "disbursed") {
            updated.disbursedBy = userId;
            updated.disbursedAt = now;
          }

          logger.log("Payroll workflow transition", {
            payrollId,
            from: p.status,
            to: nextStatus,
            userId,
            cityId: p.cityId
          });

          return updated;
        }
        return p;
      })
    );

    return true;
  }, [payrollRuns, currentCityId, currentUser]);

  const sendToReview = useCallback((payrollId: string, userId: string): boolean => {
    return transitionPayroll(payrollId, "under_review", userId);
  }, [transitionPayroll]);

  const approvePayroll = useCallback((payrollId: string, userId: string): boolean => {
    return transitionPayroll(payrollId, "approved", userId);
  }, [transitionPayroll]);

  const disbursePayroll = useCallback((
    payrollId: string,
    userId: string,
    paymentReference: string
  ): boolean => {
    const success = transitionPayroll(payrollId, "disbursed", userId);

    if (success) {
      setPayrollRuns((prev) =>
        prev.map((p) =>
          p.payrollId === payrollId
            ? { ...p, paymentReference }
            : p
        )
      );
    }

    return success;
  }, [transitionPayroll]);

  const rejectToDraft = useCallback((payrollId: string, userId: string): boolean => {
    return transitionPayroll(payrollId, "draft", userId);
  }, [transitionPayroll]);

  const updatePayrollStatus = useCallback((payrollId: string, status: PayrollRun["status"]) => {
    setPayrollRuns((prev) =>
      prev.map((payroll) =>
        payroll.payrollId === payrollId
          ? { ...payroll, status, updatedAt: new Date().toISOString() }
          : payroll
      )
    );
  }, []);

  const approvePayrollByHR = useCallback((payrollId: string, approvedBy: string) => {
    setPayrollRuns((prev) =>
      prev.map((payroll) => {
        if (payroll.payrollId === payrollId) {
          // ❌ BLOCK CROSS-CITY APPROVAL
          if (payroll.cityId !== currentCityId) {
            logger.error("Unauthorized payroll approval attempt", {
              payrollId,
              payrollCity: payroll.cityId,
              userCity: currentCityId,
              approver: approvedBy
            });
            console.error("⛔ Cannot approve payroll from different city");
            return payroll;
          }

          return {
            ...payroll,
            status: "HR Approved",
            hrApprovedBy: approvedBy,
            hrApprovedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return payroll;
      })
    );
  }, [currentCityId]);

  const approvePayrollByFinance = useCallback((payrollId: string, approvedBy: string) => {
    setPayrollRuns((prev) =>
      prev.map((payroll) => {
        if (payroll.payrollId === payrollId) {
          // ❌ BLOCK CROSS-CITY APPROVAL
          if (payroll.cityId !== currentCityId) {
            logger.error("Unauthorized payroll approval attempt", {
              payrollId,
              payrollCity: payroll.cityId,
              userCity: currentCityId,
              approver: approvedBy
            });
            console.error("⛔ Cannot approve payroll from different city");
            return payroll;
          }

          return {
            ...payroll,
            status: "Finance Approved",
            financeApprovedBy: approvedBy,
            financeApprovedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return payroll;
      })
    );
  }, [currentCityId]);

  const markPayrollAsPaid = useCallback((payrollId: string, paymentReference: string) => {
    setPayrollRuns((prev) =>
      prev.map((payroll) =>
        payroll.payrollId === payrollId
          ? {
              ...payroll,
              status: "Paid",
              paidAt: new Date().toISOString(),
              paymentReference,
              updatedAt: new Date().toISOString(),
            }
          : payroll
      )
    );
  }, []);

  const applyHROverride = useCallback((
    payrollId: string,
    overrideAmount: number,
    reason: string,
    approvedBy: string
  ) => {
    setPayrollRuns((prev) =>
      prev.map((payroll) => {
        if (payroll.payrollId === payrollId) {
          return {
            ...payroll,
            hrOverride: {
              originalAmount: payroll.netSalary,
              overrideAmount,
              reason,
              approvedBy,
              approvalDate: new Date().toISOString(),
            },
            netSalary: overrideAmount,
            updatedAt: new Date().toISOString(),
          };
        }
        return payroll;
      })
    );
  }, []);

  // ========== PAYROLL QUERIES ==========

  const getPayrollByEmployee = useCallback((employeeId: string): PayrollRun[] => {
    return payrollRuns.filter((payroll) => payroll.employeeId === employeeId);
  }, [payrollRuns]);

  const getPayrollForMonth = useCallback((month: string): PayrollRun[] => {
    // ✅ STRICT CITY FILTER: Only return payroll for current user's city
    return payrollRuns.filter((payroll) =>
      payroll.month === month &&
      payroll.cityId === currentCityId
    );
  }, [payrollRuns, currentCityId]);

  const getPendingPayrolls = useCallback((): PayrollRun[] => {
    return payrollRuns.filter((payroll) => payroll.status !== "Paid");
  }, [payrollRuns]);

  const getPayrollById = useCallback((payrollId: string): PayrollRun | undefined => {
    return payrollRuns.find((payroll) => payroll.payrollId === payrollId);
  }, [payrollRuns]);

  // ✅ NEW: City filter methods
  const getPayrollByCity = useCallback((cityId: string): PayrollRun[] => {
    return payrollRuns.filter((payroll) => payroll.cityId === cityId);
  }, [payrollRuns]);

  const getPayrollForMonthByCity = useCallback((month: string, cityId: string): PayrollRun[] => {
    return payrollRuns.filter((payroll) =>
      payroll.month === month &&
      payroll.cityId === cityId
    );
  }, [payrollRuns]);

  // ========== SALARY STRUCTURE ACTIONS ==========

  const addSalaryStructure = useCallback((
    structure: Omit<SalaryStructure, "structureId" | "createdAt">
  ): SalaryStructure => {
    const newStructure: SalaryStructure = {
      ...structure,
      cityId: structure.cityId || currentCityId, // ✅ AUTO ATTACH current city if not provided
      structureId: `SAL-STR-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSalaryStructures((prev) => [...prev, newStructure]);
    logger.log("Salary structure added", { structureId: newStructure.structureId, cityId: newStructure.cityId });
    return newStructure;
  }, [currentCityId]);

  const updateSalaryStructure = useCallback((structureId: string, updates: Partial<SalaryStructure>) => {
    setSalaryStructures((prev) =>
      prev.map((structure) =>
        structure.structureId === structureId
          ? { ...structure, ...updates, updatedAt: new Date().toISOString() }
          : structure
      )
    );
  }, []);

  const deleteSalaryStructure = useCallback((structureId: string) => {
    setSalaryStructures((prev) => prev.filter((structure) => structure.structureId !== structureId));
  }, []);

  const getSalaryStructure = useCallback((structureId: string): SalaryStructure | undefined => {
    return salaryStructures.find((structure) => structure.structureId === structureId);
  }, [salaryStructures]);

  const getSalaryStructuresByCity = useCallback((cityId: string): SalaryStructure[] => {
    return salaryStructures.filter((structure) => structure.cityId === cityId);
  }, [salaryStructures]);

  // ✅ AUTO COMPLIANCE ENGINE
  const calculateStatutoryDeductionsWrapper = useCallback(
    (grossSalary: number, stateCode?: string): ComplianceStatus => {
      // Create minimal salary structure from gross salary
      // Assume 40% basic, 50% HRA, rest in allowances
      const basic = grossSalary * 0.4;
      const hra = grossSalary * 0.5;
      const remaining = grossSalary * 0.1;

      const salaryStructure = {
        basic,
        hra,
        conveyance: Math.min(1600, remaining * 0.3),
        medicalAllowance: Math.min(1250, remaining * 0.2),
        specialAllowance: remaining * 0.5,
        otherAllowances: 0
      };

      // Default to Gujarat if no state code provided
      const state = (stateCode || "GJ") as string;

      return calculateStatutoryDeductions(state, salaryStructure);
    },
    []
  );

  // ========== CONTEXT VALUE ==========

  const contextValue = useMemo((): PayrollContextType => ({
    payrollRuns,
    processPayroll,

    // ✅ MC-22: Workflow Engine Actions
    transitionPayroll,
    sendToReview,
    approvePayroll,
    disbursePayroll,
    rejectToDraft,

    // Legacy actions (deprecated)
    updatePayrollStatus,
    approvePayrollByHR,
    approvePayrollByFinance,
    markPayrollAsPaid,
    applyHROverride,

    getPayrollByEmployee,
    getPayrollForMonth,
    getPendingPayrolls,
    getPayrollById,
    // ✅ NEW: City filter methods
    getPayrollByCity,
    getPayrollForMonthByCity,
    salaryStructures,
    addSalaryStructure,
    updateSalaryStructure,
    deleteSalaryStructure,
    getSalaryStructure,
    getSalaryStructuresByCity,
    // ✅ NEW: Auto Compliance Engine
    calculateStatutoryDeductions: calculateStatutoryDeductionsWrapper,
  }), [payrollRuns, processPayroll, transitionPayroll, sendToReview, approvePayroll, disbursePayroll, rejectToDraft, updatePayrollStatus, approvePayrollByHR, approvePayrollByFinance]);

    return <PayrollContext.Provider value={contextValue}>{children}</PayrollContext.Provider>;
}

// ========== HOOK ==========

export function usePayroll() {
  const context = useContext(PayrollContext);
  if (!context) {
    console.warn("[usePayroll] Called outside PayrollProvider — returning fallback"); return context as any;
  }
  return context;
}

// ========== RE-EXPORT TYPES ==========

export type { ComplianceStatus } from "../services/payroll/complianceEngine";
