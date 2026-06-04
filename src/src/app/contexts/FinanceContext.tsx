/**
 * FinanceContext - SINGLE SOURCE OF TRUTH for all financial data
 * Used across: Finance Module, Revenue, Payables, MRR, Cash Flow, Reports
 *
 * CRITICAL: MRR reads from CustomerSubscriptionContext (real subscriptions), NOT from plan definitions
 * RULE: Finance displays subscription data via subscriptionId lookup
 */

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from "react";
import { useEventListener, useEvents } from "./EventSystem";
import { DataService } from "../services/DataService";
import { logger } from "../services/logger";
import { useSync } from "../hooks/useSync";

// Types
export interface MRRData {
  mrrId: string;
  month: string; // "2026-04"
  subscriptionId: string;
  customerId: string; // GLOBAL IDENTITY
  revenue: number;
  status: "Active" | "Churned" | "Paused";
  cityId: string; // ✅ REQUIRED: Multi-city isolation
  createdAt: string;
  updatedAt: string;
}

export interface Payable {
  payableId: string;
  type: "Salary" | "Vendor" | "Statutory";
  // For Salary Payables
  employeeId?: string; // GLOBAL IDENTITY - links to HRDataContext
  payrollId?: string; // Links to PayrollRun in HRDataContext
  employeeName?: string; // Denormalised for display without join
  department?: "Sales" | "Operations" | "Admin"; // Drives which salary expense ledger to debit
  // Salary breakdown — stored so P&L and balance sheet can show correct split
  grossSalary?: number; // = basic + HRA + DA
  basicSalary?: number;
  pfEmployee?: number; // 12% of basic — deducted from employee
  esicEmployee?: number; // 0.75% of gross — deducted from employee
  pt?: number; // Professional tax — deducted from employee
  tdsDeducted?: number; // TDS deducted from employee
  netSalaryPayable?: number; // = grossSalary - pfEmployee - esicEmployee - pt - tdsDeducted
  pfEmployer?: number; // 12% of basic — additional employer cost (NOT deducted from employee)
  esicEmployer?: number; // 3.25% of gross — additional employer cost
  // For Vendor Payables
  vendorId?: string;
  vendorName?: string; // REQUIRED for vendor-wise AP on balance sheet
  invoiceNumber?: string;
  invoiceDate?: string;
  // For Statutory Payables
  statutoryType?: "PF" | "ESIC" | "TDS" | "GST" | "PT";
  // Common fields
  amount: number;
  dueDate: string;
  status: "Pending" | "Approved" | "Paid" | "Overdue";
  description: string;
  cityId: string; // ✅ REQUIRED: Multi-city isolation
  // Payment details
  paidAt?: string;
  paymentReference?: string;
  paymentMethod?: "Bank Transfer" | "UPI" | "Cash" | "Cheque";
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Revenue {
  revenueId: string;
  customerId: string; // GLOBAL IDENTITY
  subscriptionId?: string;
  jobId?: string; // Links to JobContext if from job completion
  type: "Subscription" | "One-Time" | "Add-on";
  amount: number;
  receivedDate: string;
  paymentMethod: "UPI" | "Card" | "Bank Transfer" | "Cash";
  invoiceNumber?: string;
  status: "Received" | "Pending" | "Failed";
  cityId: string; // ✅ REQUIRED: Multi-city isolation (was optional, now required)
  createdAt: string;
  // ── Denormalised fields for display (populated by seedAllData) ────────────
  customerName?: string;  // Stored directly so invoice list never needs a join
  packageName?: string;   // e.g. "Water Wash", "Shampoo Wash", "Shampoo+Wax"
  source?: string;        // "web-buy-page" | "subscription" | "one-time"
}

export interface LedgerEntry {
  ledgerEntryId: string;
  entryDate: string;
  accountCode: string; // 1000-1999: Assets, 2000-2999: Liabilities, 4000-4999: Revenue, 5000-5999: Expenses
  accountName: string;
  entryType: "DEBIT" | "CREDIT";
  amount: number;
  description: string;
  referenceType?: "Invoice" | "Payment" | "Payroll" | "Expense" | "Adjustment";
  referenceId?: string;
  cityId: string; // ✅ REQUIRED: Multi-city isolation (was optional "city", now required "cityId")
  serviceType?: string;
  createdAt: string;
}

interface FinanceContextType {
  // MRR Data
  mrrData: MRRData[];
  addMRREntry: (mrr: Omit<MRRData, "mrrId" | "createdAt" | "updatedAt">) => MRRData;
  updateMRR: (mrrId: string, updates: Partial<MRRData>) => void;
  removeMRREntry: (subscriptionId: string) => void;
  getMRRForMonth: (month: string) => MRRData[];
  getTotalMRR: (month: string, cityId?: string) => number;

  // Payables
  payables: Payable[];
  createPayable: (payable: Omit<Payable, "payableId" | "createdAt" | "updatedAt">) => Payable;
  updatePayable: (payableId: string, updates: Partial<Payable>) => void;
  markAsPaid: (payableId: string, paymentReference: string, paymentMethod: Payable["paymentMethod"]) => void;
  approvePayable: (payableId: string, approvedBy: string) => void;
  getSalaryPayables: (cityId?: string) => Payable[];
  getVendorPayables: (cityId?: string) => Payable[];
  getStatutoryPayables: (cityId?: string) => Payable[];
  getPendingPayables: (cityId?: string) => Payable[];
  getOverduePayables: (cityId?: string) => Payable[];

  // Revenue
  revenues: Revenue[];
  recordRevenue: (revenue: Omit<Revenue, "revenueId" | "createdAt">) => Revenue;
  getRevenueForMonth: (month: string) => Revenue[];
  getTotalRevenue: (month: string) => number;

  // Ledger Entries
  ledgerEntries: LedgerEntry[];
  createLedgerEntry: (entry: Omit<LedgerEntry, "ledgerEntryId" | "createdAt">) => LedgerEntry;
  getLedgerEntriesByAccount: (accountCode: string) => LedgerEntry[];
  getLedgerEntriesForPeriod: (startDate: string, endDate: string) => LedgerEntry[];
  getRevenueFromLedger: (startDate: string, endDate: string) => number; // Accounts 4000-4999
  getExpensesFromLedger: (startDate: string, endDate: string) => number; // Accounts 5000-5999

  // ✅ NEW: City Filter Methods (Multi-city isolation)
  getMRRByCity: (cityId: string) => MRRData[];
  getRevenueByCity: (cityId: string) => Revenue[];
  getPayablesByCity: (cityId: string) => Payable[];
  getLedgerEntriesByCity: (cityId: string) => LedgerEntry[];

  // ✅ NEW: EBITDA + Margin Analytics (MC-06)
  calculateEBITDA: (cityId: string, month?: string) => number;
  calculateMargin: (cityId: string, month?: string) => number;
  getCityFinancialSnapshot: (cityId: string, month?: string) => CityFinancialSnapshot;
  getMultiCityDashboard: (cityIds: string[]) => CityFinancialSnapshot[];
  getRevenueBreakdown: (cityId: string) => Record<string, number>;
  getExpenseBreakdown: (cityId: string) => Record<string, number>;
  getMonthlyTrend: (cityId: string) => Record<string, number>;

  // ✅ NEW: Budget, Forecast, Variance (MC-07)
  budgets: Budget[];
  setBudget: (budget: Omit<Budget, "budgetId" | "createdAt" | "updatedAt">) => Budget;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => void;
  getBudget: (cityId: string, month: string) => Budget | undefined;
  getForecast: (cityId: string, month: string) => Forecast;
  getVariance: (cityId: string, month: string) => Variance | null;

  // ✅ NEW: Automated Alert System (MC-08)
  alerts: FinanceAlert[];
  runAlertEngine: (cityId: string) => void;
  acknowledgeAlert: (alertId: string, acknowledgedBy: string) => void;
  getActiveAlerts: (cityId: string) => FinanceAlert[];

  // ✅ NEW: Decision Engine / AI Recommendations (MC-09)
  recommendations: Recommendation[];
  runDecisionEngine: (cityId: string) => void;
  getRecommendations: (cityId: string) => Recommendation[];
}

// ✅ NEW: City Financial Snapshot Type
export interface CityFinancialSnapshot {
  cityId: string;
  totalRevenue: number;
  totalMRR: number;
  totalExpenses: number;
  ebitda: number;
  margin: number;
}

// ✅ NEW: Budget, Forecast, Variance Types (MC-07)
export interface Budget {
  budgetId: string;
  cityId: string;
  month: string; // YYYY-MM
  revenueTarget: number;
  expenseBudget: number;
  profitTarget: number;
  createdAt: string;
  updatedAt: string;
}

export interface Forecast {
  cityId: string;
  month: string;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedProfit: number;
  confidence: number; // 0-100 based on data availability
}

export interface Variance {
  cityId: string;
  month: string;
  revenueVariance: number;
  revenueVariancePercent: number;
  expenseVariance: number;
  expenseVariancePercent: number;
  profitVariance: number;
  profitVariancePercent: number;
}

// ✅ NEW: Automated Alert System (MC-08)
export interface FinanceAlert {
  alertId: string;
  cityId: string;
  type: "VARIANCE" | "EXPENSE_SPIKE" | "LOW_REVENUE" | "NEGATIVE_MARGIN" | "BUDGET_MISS";
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
  acknowledged?: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

// ✅ NEW: Decision Engine / AI Recommendations (MC-09)
export interface Recommendation {
  id: string;
  cityId: string;
  type: "COST_OPTIMIZATION" | "REVENUE_GROWTH" | "RISK_ALERT";
  message: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const DEFAULT_CITY = "CITY-SURAT"; // Backward compatibility default

// ✅ SAFETY FALLBACK: Prevents crash for old data without cityId
const withCityFallback = <T extends { cityId?: string; city?: string }>(item: T): T & { cityId: string } => ({
  ...item,
  cityId: item.cityId || (item as any).city || DEFAULT_CITY,
});

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { subscribe } = useEvents();
  const [mrrData, setMRRData] = useState<MRRData[]>(() => {
    const stored = DataService.get<MRRData>("FINANCE_MRR");
    logger.debug("FinanceContext MRR loaded", { count: stored.length });
    return stored.map(withCityFallback); // ✅ Apply cityId fallback
  });

  const [payables, setPayables] = useState<Payable[]>(() => {
    const stored = DataService.get<Payable>("FINANCE_PAYABLES");
    logger.debug("FinanceContext Payables loaded", { count: stored.length });
    return stored.map(withCityFallback); // ✅ Apply cityId fallback
  });

  const [revenues, setRevenues] = useState<Revenue[]>(() => {
    const stored = DataService.get<Revenue>("FINANCE_REVENUES");
    logger.debug("FinanceContext Revenues loaded", { count: stored.length });
    return stored.map(withCityFallback); // ✅ Apply cityId fallback
  });

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(() => {
    const stored = DataService.get<LedgerEntry>("FINANCE_LEDGER");
    logger.debug("FinanceContext Ledger loaded", { count: stored.length });
    return stored.map(withCityFallback); // ✅ Apply cityId fallback
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const stored = DataService.get<Budget>("FINANCE_BUDGETS");
    logger.debug("FinanceContext Budgets loaded", { count: stored.length });
    return stored;
  });

  const [alerts, setAlerts] = useState<FinanceAlert[]>(() => {
    const stored = DataService.get<FinanceAlert>("FINANCE_ALERTS");
    logger.debug("FinanceContext Alerts loaded", { count: stored.length });
    return stored;
  });

  const [recommendations, setRecommendations] = useState<Recommendation[]>(() => {
    const stored = DataService.get<Recommendation>("FINANCE_RECOMMENDATIONS");
    logger.debug("FinanceContext Recommendations loaded", { count: stored.length });
    return stored;
  });

  // Persist to storage — only when data is non-empty to avoid overwriting Supabase data with []
  // ── Debounced localStorage persistence (500 ms) ──────────────────────────
  // Writing synchronously on every state change blocks the main thread.
  // We debounce so rapid sequential updates only write once.
  const mrrTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const payTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ledgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const budgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const altTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mrrData.length) return;
    if (mrrTimerRef.current) clearTimeout(mrrTimerRef.current);
    mrrTimerRef.current = setTimeout(() => DataService.setAll("FINANCE_MRR", mrrData), 500);
  }, [mrrData]);

  useEffect(() => {
    if (!payables.length) return;
    if (payTimerRef.current) clearTimeout(payTimerRef.current);
    payTimerRef.current = setTimeout(() => DataService.setAll("FINANCE_PAYABLES", payables), 500);
  }, [payables]);

  useEffect(() => {
    // Persist revenues to localStorage so entries survive page refresh
    // (Supabase will re-sync on next load if online — this is a fallback)
    if (!revenues.length) return;
    if (revTimerRef.current) clearTimeout(revTimerRef.current);
    revTimerRef.current = setTimeout(() => DataService.setAll("FINANCE_REVENUES", revenues), 500);
  }, [revenues]);

  useEffect(() => {
    if (!ledgerEntries.length) return;
    if (ledgTimerRef.current) clearTimeout(ledgTimerRef.current);
    ledgTimerRef.current = setTimeout(() => DataService.setAll("FINANCE_LEDGER", ledgerEntries), 500);
  }, [ledgerEntries]);

  useEffect(() => {
    if (!budgets.length) return;
    if (budgTimerRef.current) clearTimeout(budgTimerRef.current);
    budgTimerRef.current = setTimeout(() => DataService.setAll("FINANCE_BUDGETS", budgets), 500);
  }, [budgets]);

  useEffect(() => {
    if (!alerts.length) return;
    if (altTimerRef.current) clearTimeout(altTimerRef.current);
    altTimerRef.current = setTimeout(() => DataService.setAll("FINANCE_ALERTS", alerts), 500);
  }, [alerts]);

  useEffect(() => {
    if (!recommendations.length) return;
    if (recTimerRef.current) clearTimeout(recTimerRef.current);
    recTimerRef.current = setTimeout(() => DataService.setAll("FINANCE_RECOMMENDATIONS", recommendations), 500);
  }, [recommendations]);

  // Backend sync (background, non-blocking)
  useSync("FINANCE_MRR", mrrData);
  useSync("FINANCE_PAYABLES", payables);
  useSync("FINANCE_REVENUES", revenues);
  useSync("FINANCE_LEDGER", ledgerEntries);
  useSync("FINANCE_BUDGETS", budgets);
  useSync("FINANCE_ALERTS", alerts);
  useSync("FINANCE_RECOMMENDATIONS", recommendations);

  // Auto-update Overdue status for past-due unpaid payables
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const toUpdate = payables.filter(
      p => p.status === "Pending" && p.dueDate < today
    );
    if (toUpdate.length > 0) {
      setPayables(prev => prev.map(p =>
        p.status === "Pending" && p.dueDate < today
          ? { ...p, status: "Overdue" as const, updatedAt: new Date().toISOString() }
          : p
      ));
    }
  }, []); // Run on mount only

  // Cross-context event bus listeners
  // PayrollContext and CustomerSubscriptionContext fire these events instead of
  // statically importing useFinance (which caused ES module circular TDZ crash)
  useEffect(() => {
    const handlePayrollApproved = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d?.amount) return;
      try {
        addPayable({
          type: "Salary" as any,
          employeeId: d.employeeId,
          employeeName: d.employeeName,
          department: d.department || "Admin",
          amount: d.grossSalary ?? d.amount, // amount = gross for the expense side
          grossSalary: d.grossSalary ?? d.amount,
          basicSalary: d.basicSalary,
          netSalaryPayable: d.netSalaryPayable ?? d.amount,
          pfEmployee: d.pfEmployee ?? 0,
          pfEmployer: d.pfEmployer ?? 0,
          esicEmployee: d.esicEmployee ?? 0,
          esicEmployer: d.esicEmployer ?? 0,
          pt: d.pt ?? 0,
          tdsDeducted: d.tdsDeducted ?? 0,
          dueDate: d.dueDate || "",
          status: "Pending" as any,
          description: d.description || `Salary — ${d.employeeName || d.employeeId}`,
          cityId: d.cityId,
        });
      } catch { /* context may not be ready yet */ }
    };
    const handleMRRAdd = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d?.subscriptionId) return;
      try { addMRREntry(d as any); } catch { /* ignore */ }
    };
    const handleMRRRemove = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d?.subscriptionId) return;
      try { updateMRRForCancellation(d.subscriptionId, new Date().toISOString()); } catch { /* ignore */ }
    };
    // Listener: accounting entries (Expense/Purchase) → create payable in FinanceContext
    const handleAccountingEntry = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d?.amount || !d?.cityId) return;
      try {
        createPayable({
          type: "Vendor",
          description: d.description || `${d.entryType} entry`,
          vendorId: d.vendorId,
          vendorName: d.vendorName || d.vendorId || undefined, // ✅ carry vendor name for vendor-wise AP
          invoiceNumber: d.invoiceNumber,
          invoiceDate: d.date,
          amount: d.amount,
          dueDate: d.date
            ? new Date(new Date(d.date).getTime() + 30 * 86400000).toISOString().split("T")[0]
            : new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          status: "Pending",
          cityId: d.cityId,
        });
      } catch { /* non-critical */ }
    };
    window.addEventListener("cc360_payroll_approved", handlePayrollApproved);
    // G14 FIX: bridge EventSystem PAYROLL_APPROVED → window cc360_payroll_approved
    // so modules using EventSystem.emit() still reach FinanceContext
    const unsubPayroll = subscribe("PAYROLL_APPROVED", (data: any) => {
      if (data?.amount) handlePayrollApproved({ detail: data } as any);
    });
    const unsubSubscriptionCancelled = subscribe("SUBSCRIPTION_CANCELLED" as any, (data: any) => {
      if (data?.subscriptionId) {
        window.dispatchEvent(new CustomEvent("cc360_mrr_remove", { detail: data }));
      }
    });
    window.addEventListener("cc360_mrr_add", handleMRRAdd);
    window.addEventListener("cc360_mrr_remove", handleMRRRemove);
    window.addEventListener("cc360_accounting_entry_created", handleAccountingEntry);
    return () => {
      window.removeEventListener("cc360_payroll_approved", handlePayrollApproved);
    unsubPayroll(); unsubSubscriptionCancelled();
      window.removeEventListener("cc360_mrr_add", handleMRRAdd);
      window.removeEventListener("cc360_mrr_remove", handleMRRRemove);
      window.removeEventListener("cc360_accounting_entry_created", handleAccountingEntry);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-hydrate from localStorage after Supabase data loads
  // Run at 1s and 3s to catch slow Supabase responses
  useEffect(() => {
    const rehydrate = () => {
      // Read all cities combined (no cityId = reads CITY-SURAT key as default, falls back to legacy)
      const storedRevenues = DataService.get<Revenue>("FINANCE_REVENUES");
      if (storedRevenues.length > revenues.length) {
        logger.debug("FinanceContext re-hydrating revenues", { count: storedRevenues.length });
        setRevenues(storedRevenues.map(withCityFallback));
      }
      const storedPayables = DataService.get<Payable>("FINANCE_PAYABLES");
      if (storedPayables.length > payables.length) {
        setPayables(storedPayables);
      }
      const storedMRR = DataService.get<MRRData>("FINANCE_MRR");
      if (storedMRR.length > mrrData.length) {
        setMRRData(storedMRR);
      }
    };
    // Single rehydration at 1s — removed the 3s duplicate which caused a second re-render cascade
    const t1 = setTimeout(rehydrate, 1000);
    return () => { clearTimeout(t1); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-run alert engine when financial data changes — debounced to max once per 30s
  const alertEngineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (alertEngineTimerRef.current) clearTimeout(alertEngineTimerRef.current);
    alertEngineTimerRef.current = setTimeout(() => {
      const cities = [...new Set([...revenues.map(r => r.cityId), ...payables.map(p => p.cityId)])];
      cities.forEach(cityId => { if (cityId) runAlertEngine(cityId); });
    }, 30000); // 30 second debounce — alerts don't need to be instant
    return () => { if (alertEngineTimerRef.current) clearTimeout(alertEngineTimerRef.current); };
  }, [revenues.length, payables.length, budgets.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // MRR Operations
  const addMRREntry = (mrrEntryData: Omit<MRRData, "mrrId" | "createdAt" | "updatedAt">): MRRData => {
    const newMRR: MRRData = {
      ...mrrEntryData,
      mrrId: `MRR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMRRData((prev) => [...prev, newMRR]);
    return newMRR;
  };

  const updateMRR = (mrrId: string, updates: Partial<MRRData>) => {
    setMRRData((prev) =>
      prev.map((mrr) =>
        mrr.mrrId === mrrId ? { ...mrr, ...updates, updatedAt: new Date().toISOString() } : mrr
      )
    );
  };

  const removeMRREntry = (subscriptionId: string) => {
    setMRRData((prev) => prev.filter((mrr) => mrr.subscriptionId !== subscriptionId));
  };

  const getMRRForMonth = (month: string): MRRData[] => {
    return mrrData.filter((m) => m.month === month);
  };

  const getTotalMRR = (month: string, cityId?: string): number => {
    return mrrData
      .filter((m) => m.month === month && m.status === "Active" && (!cityId || m.cityId === cityId))
      .reduce((sum, m) => sum + m.revenue, 0);
  };

  // Payables Operations
  const createPayable = (
    payableData: Omit<Payable, "payableId" | "createdAt" | "updatedAt">
  ): Payable => {
    const newPayable: Payable = {
      ...payableData,
      payableId: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPayables((prev) => [...prev, newPayable]);

    const entryBase = {
      entryDate: payableData.dueDate,
      referenceType: "Expense" as const,
      referenceId: newPayable.payableId,
      cityId: payableData.cityId,
      createdAt: new Date().toISOString(),
    };

    if (payableData.type === "Salary") {
      // ── SALARY JOURNAL ENTRY ──────────────────────────────────────────────
      // The correct double-entry for salary accrual:
      //   Dr  Salary Expense — [Dept]          (gross salary)
      //   Dr  Statutory Expense — PF Employer  (12% of basic — employer cost on top of gross)
      //   Dr  Statutory Expense — ESIC Employer(3.25% of gross — employer cost on top of gross)
      //   Cr  Salary Payable — [Dept]           (net payable = gross - employee deductions)
      //   Cr  Statutory Payable — PF            (EE 12% + ER 12% of basic)
      //   Cr  Statutory Payable — ESIC          (EE 0.75% + ER 3.25% of gross)
      //   Cr  Statutory Payable — PT            (₹200/employee)
      //   Cr  TDS Payable                       (TDS deducted)
      const dept = payableData.department || "Admin";
      const deptLabel = `Salary — ${dept} Team`;
      const gross   = payableData.grossSalary ?? payableData.amount;
      const net     = payableData.netSalaryPayable ?? payableData.amount;
      const pfEE    = payableData.pfEmployee ?? 0;
      const pfER    = payableData.pfEmployer ?? 0;
      const esicEE  = payableData.esicEmployee ?? 0;
      const esicER  = payableData.esicEmployer ?? 0;
      const ptAmt   = payableData.pt ?? 0;
      const tdsAmt  = payableData.tdsDeducted ?? 0;
      const entries: Parameters<typeof setLedgerEntries>[0] extends (prev: infer P) => P ? never : any[] = [];
      // Debits — Expense side
      entries.push({ ...entryBase, ledgerEntryId: `LED-${Date.now()}-SAL-DR`, accountCode: "5100", accountName: deptLabel, entryType: "DEBIT" as const, amount: gross, description: `${deptLabel} — ${payableData.description}` });
      if (pfER > 0)   entries.push({ ...entryBase, ledgerEntryId: `LED-${Date.now()}-PFER-DR`, accountCode: "5200", accountName: "PF Employer Contribution (12% of Basic)", entryType: "DEBIT" as const, amount: pfER, description: `PF Employer — ${payableData.description}` });
      if (esicER > 0) entries.push({ ...entryBase, ledgerEntryId: `LED-${Date.now()}-ESIER-DR`, accountCode: "5201", accountName: "ESIC Employer Contribution (3.25% of Gross)", entryType: "DEBIT" as const, amount: esicER, description: `ESIC Employer — ${payableData.description}` });
      // Credits — Liability side
      entries.push({ ...entryBase, ledgerEntryId: `LED-${Date.now()}-SAL-CR`, accountCode: "2100", accountName: `Salary Payable — ${dept}`, entryType: "CREDIT" as const, amount: net, description: `Net salary payable — ${payableData.description}` });
      if (pfEE + pfER > 0)     entries.push({ ...entryBase, ledgerEntryId: `LED-${Date.now()}-PF-CR`,   accountCode: "2200", accountName: "PF Payable (Employee + Employer)",   entryType: "CREDIT" as const, amount: pfEE + pfER,   description: `PF payable (EE ₹${pfEE} + ER ₹${pfER})` });
      if (esicEE + esicER > 0) entries.push({ ...entryBase, ledgerEntryId: `LED-${Date.now()}-ESIC-CR`, accountCode: "2201", accountName: "ESIC Payable (Employee + Employer)", entryType: "CREDIT" as const, amount: esicEE + esicER, description: `ESIC payable (EE ₹${esicEE} + ER ₹${esicER})` });
      if (ptAmt > 0)   entries.push({ ...entryBase, ledgerEntryId: `LED-${Date.now()}-PT-CR`,   accountCode: "2202", accountName: "PT Payable",  entryType: "CREDIT" as const, amount: ptAmt,   description: "Professional Tax deducted" });
      if (tdsAmt > 0)  entries.push({ ...entryBase, ledgerEntryId: `LED-${Date.now()}-TDS-CR`,  accountCode: "2300", accountName: "TDS Payable", entryType: "CREDIT" as const, amount: tdsAmt,  description: "TDS deducted from salary" });
      setLedgerEntries(prev => [...prev, ...entries]);

    } else if (payableData.type === "Statutory") {
      // ── STATUTORY JOURNAL ENTRY (standalone — e.g. advance tax, GST) ──────
      setLedgerEntries(prev => [...prev,
        { ...entryBase, ledgerEntryId: `LED-${Date.now()}-STAT-DR`, accountCode: "5200", accountName: "Statutory Contributions", entryType: "DEBIT" as const, amount: payableData.amount, description: `Statutory — ${payableData.description}` },
        { ...entryBase, ledgerEntryId: `LED-${Date.now()}-STAT-CR`, accountCode: "2200", accountName: "Statutory Payable", entryType: "CREDIT" as const, amount: payableData.amount, description: `Statutory payable — ${payableData.description}` },
      ]);

    } else {
      // ── VENDOR / AP JOURNAL ENTRY ─────────────────────────────────────────
      // Dr  Expense Account (5300 — vendor expense)
      // Cr  AP — [Vendor Name]  (vendor-wise liability so BS shows vendor-wise breakdown)
      const vendorLedgerName = payableData.vendorName
        ? `AP — ${payableData.vendorName}`
        : "Accounts Payable";
      setLedgerEntries(prev => [...prev,
        { ...entryBase, ledgerEntryId: `LED-${Date.now()}-VND-DR`, accountCode: "5300", accountName: "Vendor Expenses", entryType: "DEBIT" as const, amount: payableData.amount, description: `${payableData.description}${payableData.vendorName ? ` (${payableData.vendorName})` : ""}` },
        { ...entryBase, ledgerEntryId: `LED-${Date.now()}-VND-CR`, accountCode: "2000", accountName: vendorLedgerName, entryType: "CREDIT" as const, amount: payableData.amount, description: vendorLedgerName },
      ]);
    }

    return newPayable;
  };

  const updatePayable = (payableId: string, updates: Partial<Payable>) => {
    setPayables((prev) =>
      prev.map((p) =>
        p.payableId === payableId
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const markAsPaid = (
    payableId: string,
    paymentReference: string,
    paymentMethod: Payable["paymentMethod"]
  ) => {
    const payable = payables.find(p => p.payableId === payableId);
    updatePayable(payableId, {
      status: "Paid",
      paidAt: new Date().toISOString(),
      paymentReference,
      paymentMethod,
    });
    // Settlement entry: DR Payable (clears liability), CR Bank
    if (payable) {
      const today = new Date().toISOString().split("T")[0];
      const entryBase = {
        entryDate: today,
        description: `Payment — ${payable.description} (Ref: ${paymentReference})`,
        referenceType: "Payment" as const,
        referenceId: payableId,
        cityId: payable.cityId,
        createdAt: new Date().toISOString(),
      };
      setLedgerEntries(prev => [...prev,
        { ...entryBase, ledgerEntryId: `LED-${Date.now()}-DR`, accountCode: "2000", accountName: payable.vendorName ? `AP — ${payable.vendorName}` : "Accounts Payable", entryType: "DEBIT" as const, amount: payable.amount },
        { ...entryBase, ledgerEntryId: `LED-${Date.now() + 1}-CR`, accountCode: "1000", accountName: "Bank Account", entryType: "CREDIT" as const, amount: payable.amount },
      ]);
      // G9 FIX: fire PAYMENT_MADE so downstream modules (Supervisor, Reports) can react
      window.dispatchEvent(new CustomEvent("cc360_payment_made", {
        detail: {
          payableId, type: payable.type, amount: payable.amount,
          vendorName: payable.vendorName, cityId: payable.cityId,
          paymentMethod, paidAt: new Date().toISOString(),
        }
      }));
    }
  };

  const approvePayable = (payableId: string, approvedBy: string) => {
    updatePayable(payableId, {
      status: "Approved",
      approvedBy,
      approvedAt: new Date().toISOString(),
    });
  };

  const getSalaryPayables = (cityId?: string): Payable[] => {
    return payables.filter((p) => p.type === "Salary" && (!cityId || p.cityId === cityId));
  };

  const getVendorPayables = (cityId?: string): Payable[] => {
    return payables.filter((p) => p.type === "Vendor" && (!cityId || p.cityId === cityId));
  };

  const getStatutoryPayables = (cityId?: string): Payable[] => {
    return payables.filter((p) => p.type === "Statutory" && (!cityId || p.cityId === cityId));
  };

  const getPendingPayables = (cityId?: string): Payable[] => {
    return payables.filter((p) => ["Pending","Approved"].includes(p.status) && (!cityId || p.cityId === cityId));
  };

  const getOverduePayables = (cityId?: string): Payable[] => {
    const today = new Date().toISOString().split("T")[0];
    return payables.filter((p) => p.status !== "Paid" && p.dueDate < today && (!cityId || p.cityId === cityId));
  };

  // Revenue Operations
  const recordRevenue = (revenueData: Omit<Revenue, "revenueId" | "createdAt">): Revenue => {
    const newRevenue: Revenue = {
      ...revenueData,
      revenueId: `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setRevenues((prev) => [...prev, newRevenue]);

    // Auto-post double-entry ledger entries
    const entryBase = {
      entryDate: revenueData.receivedDate,
      description: `Revenue — ${revenueData.type} (${revenueData.invoiceNumber || newRevenue.revenueId})`,
      referenceType: "Invoice" as const,
      referenceId: newRevenue.revenueId,
      cityId: revenueData.cityId,
      serviceType: revenueData.type,
      createdAt: new Date().toISOString(),
    };
    setLedgerEntries(prev => [...prev,
      // DR Bank/Receivable (Account 1100)
      { ...entryBase, ledgerEntryId: `LED-${Date.now()}-DR`, accountCode: "1100", accountName: "Accounts Receivable", entryType: "DEBIT" as const, amount: revenueData.amount },
      // CR Revenue (Account 4100)
      { ...entryBase, ledgerEntryId: `LED-${Date.now() + 1}-CR`, accountCode: "4100", accountName: "Service Revenue", entryType: "CREDIT" as const, amount: revenueData.amount },
    ]);

    return newRevenue;
  };

  const getRevenueForMonth = (month: string): Revenue[] => {
    return revenues.filter((r) => r.receivedDate.startsWith(month));
  };

  const getTotalRevenue = (month: string): number => {
    return revenues
      .filter((r) => r.receivedDate.startsWith(month) && r.status === "Received")
      .reduce((sum, r) => sum + r.amount, 0);
  };

  // Ledger Operations
  const createLedgerEntry = (
    entryData: Omit<LedgerEntry, "ledgerEntryId" | "createdAt">
  ): LedgerEntry => {
    const newEntry: LedgerEntry = {
      ...entryData,
      ledgerEntryId: `LED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setLedgerEntries((prev) => [...prev, newEntry]);
    return newEntry;
  };

  const getLedgerEntriesByAccount = (accountCode: string): LedgerEntry[] => {
    return ledgerEntries.filter((e) => e.accountCode === accountCode);
  };

  const getLedgerEntriesForPeriod = (startDate: string, endDate: string): LedgerEntry[] => {
    return ledgerEntries.filter(
      (e) => e.entryDate >= startDate && e.entryDate <= endDate
    );
  };

  const getRevenueFromLedger = (startDate: string, endDate: string): number => {
    return ledgerEntries
      .filter(
        (e) =>
          e.entryDate >= startDate &&
          e.entryDate <= endDate &&
          e.accountCode >= "4000" &&
          e.accountCode <= "4999" &&
          e.entryType === "CREDIT"
      )
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getExpensesFromLedger = (startDate: string, endDate: string): number => {
    return ledgerEntries
      .filter(
        (e) =>
          e.entryDate >= startDate &&
          e.entryDate <= endDate &&
          e.accountCode >= "5000" &&
          e.accountCode <= "5999" &&
          e.entryType === "DEBIT"
      )
      .reduce((sum, e) => sum + e.amount, 0);
  };

  // ✅ CITY FILTER METHODS (Multi-city isolation)
  const getMRRByCity = (cityId: string): MRRData[] => {
    return mrrData.filter(item => item.cityId === cityId);
  };

  const getRevenueByCity = useCallback((cityId: string): Revenue[] => {
    return revenues.filter(item => item.cityId === cityId);
  }, [revenues]);

  const getPayablesByCity = useCallback((cityId: string): Payable[] => {
    return payables.filter(item => item.cityId === cityId);
  }, [payables]);

  const getLedgerEntriesByCity = useCallback((cityId: string): LedgerEntry[] => {
    return ledgerEntries.filter(item => item.cityId === cityId);
  }, [ledgerEntries]);

  // ✅ EBITDA + MARGIN ANALYTICS (MC-06)
  const calculateEBITDA = (cityId: string, month?: string): number => {
    const cityRevenues = getRevenueByCity(cityId)
      .filter(r => r.status === "Received" && (!month || r.receivedDate.startsWith(month)));
    const cityPayables = getPayablesByCity(cityId)
      .filter(p => p.status === "Paid" && (!month || p.paidAt?.startsWith(month)));

    const totalRevenue = cityRevenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = cityPayables.reduce((sum, p) => sum + p.amount, 0);
    return totalRevenue - totalExpenses;
  };

  const calculateMargin = (cityId: string, month?: string): number => {
    const cityRevenues = getRevenueByCity(cityId)
      .filter(r => r.status === "Received" && (!month || r.receivedDate.startsWith(month)));
    const totalRevenue = cityRevenues.reduce((sum, r) => sum + r.amount, 0);

    if (totalRevenue === 0) return 0;

    const ebitda = calculateEBITDA(cityId, month);
    return (ebitda / totalRevenue) * 100;
  };

  const getCityFinancialSnapshot = (cityId: string, month?: string): CityFinancialSnapshot => {
    const cityRevenues = getRevenueByCity(cityId)
      .filter(r => r.status === "Received" && (!month || r.receivedDate.startsWith(month)));
    const cityMRR = getMRRByCity(cityId)
      .filter(m => !month || m.month === month);
    const cityPayables = getPayablesByCity(cityId)
      .filter(p => p.status === "Paid" && (!month || p.paidAt?.startsWith(month)));

    const totalRevenue = cityRevenues.reduce((sum, r) => sum + r.amount, 0);
    const totalMRR = cityMRR.reduce((sum, m) => sum + m.revenue, 0);
    const totalExpenses = cityPayables.reduce((sum, p) => sum + p.amount, 0);

    const ebitda = totalRevenue - totalExpenses;
    const margin = totalRevenue ? (ebitda / totalRevenue) * 100 : 0;

    return {
      cityId,
      totalRevenue,
      totalMRR,
      totalExpenses,
      ebitda,
      margin,
    };
  };

  const getMultiCityDashboard = (cityIds: string[]): CityFinancialSnapshot[] => {
    return cityIds.map(cityId => getCityFinancialSnapshot(cityId));
  };

  const getRevenueBreakdown = (cityId: string): Record<string, number> => {
    const cityRevenues = getRevenueByCity(cityId);
    const breakdown: Record<string, number> = {};

    cityRevenues.forEach(r => {
      const source = r.type || "Unknown";
      breakdown[source] = (breakdown[source] || 0) + r.amount;
    });

    return breakdown;
  };

  const getExpenseBreakdown = (cityId: string): Record<string, number> => {
    const cityPayables = getPayablesByCity(cityId);
    const breakdown: Record<string, number> = {};

    cityPayables.forEach(p => {
      const category = p.type || "Unknown";
      breakdown[category] = (breakdown[category] || 0) + p.amount;
    });

    return breakdown;
  };

  const getMonthlyTrend = (cityId: string): Record<string, number> => {
    const cityRevenues = getRevenueByCity(cityId);
    const monthly: Record<string, number> = {};

    cityRevenues.forEach(r => {
      const month = r.receivedDate.slice(0, 7); // Extract YYYY-MM
      monthly[month] = (monthly[month] || 0) + r.amount;
    });

    return monthly;
  };

  // ✅ BUDGET, FORECAST, VARIANCE (MC-07)
  const setBudget = (budgetData: Omit<Budget, "budgetId" | "createdAt" | "updatedAt">): Budget => {
    // Remove existing budget for same city + month
    setBudgets(prev => {
      const filtered = prev.filter(
        b => !(b.cityId === budgetData.cityId && b.month === budgetData.month)
      );

      const newBudget: Budget = {
        ...budgetData,
        budgetId: `BDG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return [...filtered, newBudget];
    });

    // Return the budget (though it's async in state)
    return {
      ...budgetData,
      budgetId: `BDG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const updateBudget = (budgetId: string, updates: Partial<Budget>) => {
    setBudgets(prev =>
      prev.map(budget =>
        budget.budgetId === budgetId
          ? { ...budget, ...updates, updatedAt: new Date().toISOString() }
          : budget
      )
    );
  };

  const getBudget = (cityId: string, month: string): Budget | undefined => {
    return budgets.find(b => b.cityId === cityId && b.month === month);
  };

  const getForecast = (cityId: string, month: string): Forecast => {
    const cityRevenues = getRevenueByCity(cityId);
    const cityPayables = getPayablesByCity(cityId);

    // Filter data for the specified month
    const currentMonthRevenues = cityRevenues.filter(r =>
      r.receivedDate.startsWith(month)
    );

    const currentMonthPayables = cityPayables.filter(p =>
      p.dueDate.startsWith(month)
    );

    // Calculate days elapsed in month
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    const daysElapsed = currentMonth === month ? today.getDate() : 30;

    // Calculate totals so far
    const revenueSoFar = currentMonthRevenues.reduce((sum, r) => sum + r.amount, 0);
    const expensesSoFar = currentMonthPayables.reduce((sum, p) => sum + p.amount, 0);

    // Project to full month (30 days)
    const projectedRevenue = daysElapsed > 0 ? (revenueSoFar / daysElapsed) * 30 : 0;
    const projectedExpenses = daysElapsed > 0 ? (expensesSoFar / daysElapsed) * 30 : 0;

    // Calculate confidence based on data availability
    const confidence = Math.min((daysElapsed / 30) * 100, 100);

    return {
      cityId,
      month,
      projectedRevenue,
      projectedExpenses,
      projectedProfit: projectedRevenue - projectedExpenses,
      confidence,
    };
  };

  const getVariance = (cityId: string, month: string): Variance | null => {
    const budget = getBudget(cityId, month);
    if (!budget) return null;

    const snapshot = getCityFinancialSnapshot(cityId);

    const revenueVariance = snapshot.totalRevenue - budget.revenueTarget;
    const expenseVariance = snapshot.totalExpenses - budget.expenseBudget;
    const profitVariance = snapshot.ebitda - budget.profitTarget;

    return {
      cityId,
      month,
      revenueVariance,
      revenueVariancePercent: budget.revenueTarget ? (revenueVariance / budget.revenueTarget) * 100 : 0,
      expenseVariance,
      expenseVariancePercent: budget.expenseBudget ? (expenseVariance / budget.expenseBudget) * 100 : 0,
      profitVariance,
      profitVariancePercent: budget.profitTarget ? (profitVariance / budget.profitTarget) * 100 : 0,
    };
  };

  // ✅ AUTOMATED ALERT SYSTEM (MC-08)

  // WhatsApp notification hook (placeholder for future integration)
  const triggerNotification = (alert: FinanceAlert) => {
    logger.log("Finance Alert Triggered", {
      type: alert.type,
      severity: alert.severity,
      cityId: alert.cityId
    });
    console.log(`📱 WhatsApp Alert: [${alert.severity}] ${alert.message}`);

    // Future: Integrate with WhatsApp Business API
    // sendToWhatsAppAPI({
    //   to: getCityManagerPhone(alert.cityId),
    //   message: `⚠️ ${alert.severity} Alert: ${alert.message}`,
    // });
  };

  const runAlertEngine = (cityId: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const variance = getVariance(cityId, currentMonth);
    const snapshot = getCityFinancialSnapshot(cityId);

    // Skip if no budget (can't calculate variance)
    if (!variance) {
      logger.debug("Alert engine skipped - no budget set", { cityId, month: currentMonth });
      return;
    }

    const newAlerts: FinanceAlert[] = [];
    const now = new Date().toISOString();

    // RULE 1: Profit significantly below target (>₹50K or >20%)
    if (variance.profitVariance < -50000 || variance.profitVariancePercent < -20) {
      newAlerts.push({
        alertId: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        cityId,
        type: "VARIANCE",
        message: `Profit is significantly below target: ₹${Math.abs(variance.profitVariance / 1000).toFixed(1)}K (${variance.profitVariancePercent.toFixed(1)}%)`,
        severity: variance.profitVariancePercent < -30 ? "HIGH" : "MEDIUM",
        createdAt: now,
      });
    }

    // RULE 2: Expenses exceeding budget (>₹50K or >15%)
    if (variance.expenseVariance > 50000 || variance.expenseVariancePercent > 15) {
      newAlerts.push({
        alertId: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        cityId,
        type: "EXPENSE_SPIKE",
        message: `Expenses exceeding budget: +₹${(variance.expenseVariance / 1000).toFixed(1)}K (${variance.expenseVariancePercent.toFixed(1)}%)`,
        severity: variance.expenseVariancePercent > 25 ? "HIGH" : "MEDIUM",
        createdAt: now,
      });
    }

    // RULE 3: Revenue significantly below target (>₹100K or >15%)
    if (variance.revenueVariance < -100000 || variance.revenueVariancePercent < -15) {
      newAlerts.push({
        alertId: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        cityId,
        type: "LOW_REVENUE",
        message: `Revenue significantly below target: -₹${Math.abs(variance.revenueVariance / 1000).toFixed(1)}K (${variance.revenueVariancePercent.toFixed(1)}%)`,
        severity: variance.revenueVariancePercent < -25 ? "HIGH" : "MEDIUM",
        createdAt: now,
      });
    }

    // RULE 4: Negative margin (profit < 0)
    if (snapshot.margin < 0) {
      newAlerts.push({
        alertId: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        cityId,
        type: "NEGATIVE_MARGIN",
        message: `Negative profit margin detected: ${snapshot.margin.toFixed(1)}% (EBITDA: ₹${(snapshot.ebitda / 1000).toFixed(1)}K)`,
        severity: "HIGH",
        createdAt: now,
      });
    }

    // RULE 5: Budget miss projected (forecast shows will miss target by >20%)
    const forecast = getForecast(cityId, currentMonth);
    const projectedMiss = forecast.projectedProfit - variance.profitVariance;
    if (forecast.confidence > 50 && projectedMiss < -40000) {
      newAlerts.push({
        alertId: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        cityId,
        type: "BUDGET_MISS",
        message: `Forecast shows likely budget miss: Projected profit ₹${(forecast.projectedProfit / 1000).toFixed(1)}K vs target ₹${(variance.profitVariance / 1000).toFixed(1)}K`,
        severity: "MEDIUM",
        createdAt: now,
      });
    }

    // RULE 6: No revenue recorded this month (possible data entry gap)
    const thisMonthRevenue = getRevenueByCity(cityId)
      .filter(r => r.receivedDate.startsWith(currentMonth));
    if (thisMonthRevenue.length === 0) {
      newAlerts.push({
        alertId: `ALERT-${Date.now()}-norev`,
        cityId, type: "LOW_REVENUE",
        message: `No revenue recorded for ${currentMonth}. Check if subscription payments have been entered.`,
        severity: "HIGH", createdAt: now,
      });
    }

    // RULE 7: Overdue payables exist
    const overduePayables = getOverduePayables(cityId);
    if (overduePayables.length > 0) {
      const totalOverdue = overduePayables.reduce((s, p) => s + p.amount, 0);
      newAlerts.push({
        alertId: `ALERT-${Date.now()}-overdue`,
        cityId, type: "EXPENSE_SPIKE",
        message: `${overduePayables.length} overdue payables totalling ₹${(totalOverdue / 1000).toFixed(1)}K. Immediate payment required.`,
        severity: overduePayables.length > 3 ? "HIGH" : "MEDIUM", createdAt: now,
      });
    }

    // Prevent duplicate alerts (check for same type in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentAlertTypes = alerts
      .filter(a => a.cityId === cityId && a.createdAt > oneHourAgo && !a.acknowledged)
      .map(a => a.type);

    const uniqueNewAlerts = newAlerts.filter(
      alert => !recentAlertTypes.includes(alert.type)
    );

    if (uniqueNewAlerts.length > 0) {
      setAlerts(prev => [...prev, ...uniqueNewAlerts]);
      uniqueNewAlerts.forEach(triggerNotification);
      logger.log("Finance alerts generated", {
        cityId,
        count: uniqueNewAlerts.length,
        types: uniqueNewAlerts.map(a => a.type)
      });
    }
  };

  const acknowledgeAlert = (alertId: string, acknowledgedBy: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.alertId === alertId
          ? {
              ...alert,
              acknowledged: true,
              acknowledgedAt: new Date().toISOString(),
              acknowledgedBy,
            }
          : alert
      )
    );
  };

  const getActiveAlerts = (cityId: string): FinanceAlert[] => {
    return alerts.filter(a => a.cityId === cityId && !a.acknowledged);
  };

  // ✅ DECISION ENGINE / AI RECOMMENDATIONS (MC-09)
  const runDecisionEngine = (cityId: string) => {
    const snapshot = getCityFinancialSnapshot(cityId);
    const expenseBreakdown = getExpenseBreakdown(cityId);
    const revenueBreakdown = getRevenueBreakdown(cityId);
    const cityPayables = getPayablesByCity(cityId);

    const newRecs: Recommendation[] = [];

    // RULE 1: High expense vendor concentration
    // Group by vendor name for better detection
    const vendorExpenses: Record<string, number> = {};
    cityPayables.forEach(p => {
      if (p.type === "Vendor" && p.vendorName) {
        vendorExpenses[p.vendorName] = (vendorExpenses[p.vendorName] || 0) + p.amount;
      }
    });

    Object.entries(vendorExpenses).forEach(([vendor, amount]) => {
      if (snapshot.totalExpenses > 0 && amount > snapshot.totalExpenses * 0.4) {
        newRecs.push({
          id: crypto.randomUUID(),
          cityId,
          type: "COST_OPTIMIZATION",
          message: `Vendor ${vendor} contributes ${((amount / snapshot.totalExpenses) * 100).toFixed(1)}% of expenses. Consider renegotiation or diversification.`,
          impact: "HIGH",
          createdAt: new Date().toISOString()
        });
      }
    });

    // RULE 2: Low margin warning
    if (snapshot.margin < 15 && snapshot.totalRevenue > 0) {
      newRecs.push({
        id: crypto.randomUUID(),
        cityId,
        type: "RISK_ALERT",
        message: `Profit margin ${snapshot.margin.toFixed(1)}% is below healthy threshold (15%). Review pricing or reduce costs.`,
        impact: "HIGH",
        createdAt: new Date().toISOString()
      });
    }

    // RULE 3: Revenue concentration
    Object.entries(revenueBreakdown).forEach(([source, amount]) => {
      if (snapshot.totalRevenue > 0 && amount > snapshot.totalRevenue * 0.6) {
        newRecs.push({
          id: crypto.randomUUID(),
          cityId,
          type: "REVENUE_GROWTH",
          message: `Revenue heavily dependent on ${source} (${((amount / snapshot.totalRevenue) * 100).toFixed(1)}%). Diversify revenue sources.`,
          impact: "MEDIUM",
          createdAt: new Date().toISOString()
        });
      }
    });

    // RULE 4: High salary-to-revenue ratio
    const salaryExpenses = Object.entries(expenseBreakdown)
      .filter(([category]) => category === "Salary")
      .reduce((sum, [, amount]) => sum + amount, 0);

    if (snapshot.totalRevenue > 0 && salaryExpenses > snapshot.totalRevenue * 0.5) {
      newRecs.push({
        id: crypto.randomUUID(),
        cityId,
        type: "COST_OPTIMIZATION",
        message: `Salary expenses are ${((salaryExpenses / snapshot.totalRevenue) * 100).toFixed(1)}% of revenue. Consider automation or process optimization.`,
        impact: "MEDIUM",
        createdAt: new Date().toISOString()
      });
    }

    // RULE 5: Expense imbalance (one category dominates)
    Object.entries(expenseBreakdown).forEach(([category, amount]) => {
      if (snapshot.totalExpenses > 0 && amount > snapshot.totalExpenses * 0.7) {
        newRecs.push({
          id: crypto.randomUUID(),
          cityId,
          type: "COST_OPTIMIZATION",
          message: `${category} expenses dominate at ${((amount / snapshot.totalExpenses) * 100).toFixed(1)}%. Review cost structure balance.`,
          impact: "MEDIUM",
          createdAt: new Date().toISOString()
        });
      }
    });

    // Prevent duplicate recommendations (check for same type+cityId in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentRecTypes = recommendations
      .filter(r => r.cityId === cityId && r.createdAt > oneDayAgo)
      .map(r => r.type);

    const uniqueNewRecs = newRecs.filter(
      rec => !recentRecTypes.includes(rec.type)
    );

    if (uniqueNewRecs.length > 0) {
      setRecommendations(prev => [...prev, ...uniqueNewRecs]);
      logger.log("Decision engine recommendations generated", {
        cityId,
        count: uniqueNewRecs.length,
        types: uniqueNewRecs.map(r => r.type)
      });
    }
  };

  const getRecommendations = (cityId: string): Recommendation[] => {
    return recommendations.filter(r => r.cityId === cityId);
  };

  // ─── C01 FIX: Subscribe to JOB_COMPLETED → auto-create revenue entry ────────
  useEventListener("JOB_COMPLETED", (event: any) => {
    const { jobId, customerId, cityId, amount, jobType, subscriptionId, completedAt } = event.data || event;
    if (!amount || amount <= 0) return; // skip zero-amount jobs

    // Map job type to revenue type
    const revenueType: Revenue["type"] =
      jobType === "Add-on"                           ? "Add-on" :
      subscriptionId                                 ? "Subscription" :
      (jobType === "One-Time Demo" || jobType === "Regular") ? "One-Time" :
      "One-Time";

    // Avoid duplicate: check if a revenue entry for this jobId already exists
    setRevenues(prev => {
      if (prev.some(r => r.jobId === jobId)) return prev;
      const newRevenue: Revenue = {
        revenueId:     `REV-JOB-${jobId}`,
        customerId:    customerId || "",
        subscriptionId: subscriptionId,
        jobId,
        type:          revenueType,
        amount,
        receivedDate:  (completedAt || new Date().toISOString()).split("T")[0],
        paymentMethod: "UPI",           // default — can be updated by Accounts
        status:        "Received",
        cityId:        cityId || "CITY-SURAT",
        createdAt:     new Date().toISOString(),
      };
      return [...prev, newRevenue];
    });
  }, []);

  const contextValue = useMemo(() => ({
    mrrData,
    addMRREntry,
    updateMRR,
    removeMRREntry,
    getMRRForMonth,
    getTotalMRR,
    payables,
    createPayable,
    updatePayable,
    markAsPaid,
    approvePayable,
    getSalaryPayables,
    getVendorPayables,
    getStatutoryPayables,
    getPendingPayables,
    getOverduePayables,
    revenues,
    recordRevenue,
    getRevenueForMonth,
    getTotalRevenue,
    ledgerEntries,
    createLedgerEntry,
    getLedgerEntriesByAccount,
    getLedgerEntriesForPeriod,
    getRevenueFromLedger,
    getExpensesFromLedger,
    getMRRByCity,
    getRevenueByCity,
    getPayablesByCity,
    getLedgerEntriesByCity,
    calculateEBITDA,
    calculateMargin,
    getCityFinancialSnapshot,
    getMultiCityDashboard,
    getRevenueBreakdown,
    getExpenseBreakdown,
    getMonthlyTrend,
    budgets,
    setBudget,
    updateBudget,
    getBudget,
    getForecast,
    getVariance,
    alerts,
    runAlertEngine,
    acknowledgeAlert,
    getActiveAlerts,
    recommendations,
    runDecisionEngine,
    getRecommendations,
  }), [
    // DATA ARRAYS only — all functions are closures over these arrays.
    // Do NOT add plain function refs here: they are recreated every render,
    // which would invalidate contextValue every render → infinite re-render loop.
    // useCallback functions (getRevenueByCity, getPayablesByCity, getLedgerEntriesByCity)
    // are stable and safe to include.
    mrrData, payables, revenues, ledgerEntries, budgets, alerts, recommendations,
    getRevenueByCity, getPayablesByCity, getLedgerEntriesByCity,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    // PREVIEW FALLBACK: Safe no-op defaults for Figma Make iframe and dev HMR
    const noop = (): any => { console.warn("FinanceContext not available"); return {}; };
    const noopArray = () => [];
    const noopNumber = () => 0;
    return {
      mrrData: [], addMRREntry: noop, updateMRR: noop, removeMRREntry: noop,
      getMRRForMonth: noopArray, getTotalMRR: noopNumber,
      payables: [], createPayable: noop, updatePayable: noop, markAsPaid: noop,
      approvePayable: noop, getSalaryPayables: noopArray, getVendorPayables: noopArray,
      getStatutoryPayables: noopArray, getPendingPayables: noopArray, getOverduePayables: noopArray,
      revenues: [], recordRevenue: noop, getRevenueForMonth: noopArray, getTotalRevenue: noopNumber,
      ledgerEntries: [], createLedgerEntry: noop, getLedgerEntriesByAccount: noopArray,
      getLedgerEntriesForPeriod: noopArray, getRevenueFromLedger: noopNumber, getExpensesFromLedger: noopNumber,
      getMRRByCity: noopArray, getRevenueByCity: noopArray, getPayablesByCity: noopArray, getLedgerEntriesByCity: noopArray,
      calculateEBITDA: noopNumber, calculateMargin: noopNumber,
      getCityFinancialSnapshot: () => ({ cityId: '', totalRevenue: 0, totalMRR: 0, totalExpenses: 0, ebitda: 0, margin: 0 }),
      getMultiCityDashboard: noopArray, getRevenueBreakdown: () => ({}), getExpenseBreakdown: () => ({}), getMonthlyTrend: () => ({}),
      budgets: [], setBudget: noop, updateBudget: noop, getBudget: () => undefined,
      getForecast: () => ({ cityId: '', month: '', projectedRevenue: 0, projectedExpenses: 0, projectedProfit: 0, confidence: 0 }),
      getVariance: () => null,
      alerts: [], runAlertEngine: noop, acknowledgeAlert: noop, getActiveAlerts: noopArray,
      recommendations: [], runDecisionEngine: noop, getRecommendations: noopArray,
    } as any;
  }
  return context;
}
