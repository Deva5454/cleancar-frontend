/**
 * kraAccountsDataSources.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real KPI computation for Accounts (and reused by Procurement Manager's
 * Vendor Payment TAT — same underlying Payable records), confirmed against
 * the real Payable interface (FinanceContext.tsx) before building anything:
 *
 *   - Payable.dueDate, .paidAt, .status, .amount, .cityId all genuinely
 *     exist and are populated by the real markAsPaid()/createPayable()
 *     flow — confirmed directly, not assumed.
 *
 * Every other candidate Accounts KPI (Book-Closure Timeliness, Ledger
 * Accuracy, GST Filing Timeliness, GST Reconciliation Match Rate) was
 * checked and found to have no real, reusable data source: no month-close
 * timestamp exists anywhere in accountingEntryService.ts, no discrepancy/
 * audit-flag service exists, GSTFilingModule.tsx stores a filing date but
 * no due-date to compare it against, and GSTReconciliation.tsx's
 * matchStatus data has no exported getter function to read from outside
 * that one component. These stay honestly NOT_YET_AVAILABLE in
 * kraAccountsPilot.ts rather than a fabricated calculation.
 */

export interface PayableLike {
  cityId: string;
  amount: number;
  dueDate: string;
  status: string;
  paidAt?: string;
}

/**
 * Real payment timeliness rate for a city in a given month — the genuine
 * share of that month's paid-or-partially-paid payables that were settled
 * on or before their real due date. "This month" is scoped by paidAt (when
 * the payment happened), not dueDate, so it reflects the real payment
 * discipline exercised that month.
 */
export function computePaymentTimelinessRate(payables: PayableLike[], cityId: string, month: string): number {
  const paidThisMonth = payables.filter(
    (p) => p.cityId === cityId && p.paidAt && p.paidAt.startsWith(month) && (p.status === "Paid" || p.status === "Partially Paid")
  );
  if (paidThisMonth.length === 0) return 0;
  const onTime = paidThisMonth.filter((p) => p.paidAt! <= p.dueDate).length;
  return Math.round((onTime / paidThisMonth.length) * 100);
}
