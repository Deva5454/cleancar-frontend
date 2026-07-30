/**
 * kraOMDataSources.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real KPI computations for Operations Manager, built against genuinely
 * real data - confirmed directly before building anything:
 *
 *   - Revenue: real AccountingEntry records with entryType "Sales",
 *     triggered on every actual transaction (confirmed via
 *     accountingEntryService.ts's own comment: called from RazorpayFlow,
 *     InvoiceManagement, and RevenueCaptureSystem on every real sale).
 *     operationsManagerService.ts's own "revenue" was a flat
 *     ₹300/unit × estimated-units guess - this replaces that with the
 *     real, actual billed amount.
 *
 *   - Retention: real CustomerSubscription records with a genuine
 *     status field ("Active"/"Cancelled"/etc.), joined to real Customer
 *     records for city scoping (subscriptions don't carry cityId
 *     directly - confirmed by checking the real interface).
 *     operationsManagerService.ts's own "churn risk" used
 *     Math.random() - this replaces that with real subscription status.
 *
 * Lead Conversion, Operational Compliance, and Customer Experience are
 * NOT included here - confirmed directly that no real data source
 * exists for any of them yet (operationsManagerService.ts's own
 * comments say "In production: GET /api/om/sales" for conversion, and
 * the other two have no computation logic at all, real or mock).
 * These are represented honestly as unavailable in kraOMPilot.ts rather
 * than invented.
 */

export interface AccountingEntryLike {
  entryType: string;
  cityId: string;
  date: string;
  totalBillValue: number;
}

export interface SubscriptionLike {
  subscriptionId: string;
  customerId: string;
  status: string;
}

export interface CustomerLike {
  customerId: string;
  cityId?: string;
  city?: string;
}

/**
 * Real revenue for a city in a given month - sums the actual, real
 * billed value of every genuine Sales entry, not an estimate.
 */
export function computeOMRealRevenue(entries: AccountingEntryLike[], cityId: string, month: string): number {
  return entries
    .filter((e) => e.entryType === "Sales" && e.cityId === cityId && e.date.startsWith(month))
    .reduce((sum, e) => sum + (e.totalBillValue || 0), 0);
}

/**
 * Real retention rate for a city - the genuine share of that city's
 * real subscriptions that are still Active, out of every subscription
 * that reached a real outcome (Active or Cancelled). Paused, Expired,
 * and Exhausted are deliberately excluded from the denominator - a
 * pause can resume, and expiry/exhaustion is a natural pack completion,
 * neither is genuine churn.
 */
export function computeOMRealRetentionRate(
  subscriptions: SubscriptionLike[], customers: CustomerLike[], cityId: string
): number {
  const cityCustomerIds = new Set(
    customers.filter((c) => c.cityId === cityId || c.city === cityId).map((c) => c.customerId)
  );
  const citySubs = subscriptions.filter((s) => cityCustomerIds.has(s.customerId));
  const active = citySubs.filter((s) => s.status === "Active").length;
  const cancelled = citySubs.filter((s) => s.status === "Cancelled").length;
  const denominator = active + cancelled;
  return denominator > 0 ? Math.round((active / denominator) * 100) : 0;
}
