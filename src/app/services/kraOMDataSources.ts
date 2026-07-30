/**
 * kraOMDataSources.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real KPI computations for Operations Manager, built against genuinely
 * real data - confirmed directly before building anything:
 *
 *   - Revenue: real Revenue records from FinanceContext (DataService key
 *     "FINANCE_REVENUES") - confirmed the true, primary real source.
 *
 *     A real correction, made after this was first built: this
 *     originally summed AccountingEntry records with entryType "Sales".
 *     Checked directly and confirmed that value is only ever written by
 *     seed/test data files, never by any real, live transaction flow -
 *     in real, live use it always returned zero regardless of actual
 *     revenue. AccountingEntry/journal postings turned out to be a
 *     derived, secondary accounting representation of this same
 *     Revenue data (confirmed via RevenueCaptureSystem.tsx, which reads
 *     real Revenue records and posts a corresponding journal entry from
 *     them afterward - the journal is downstream of Revenue, not the
 *     other way around). operationsManagerService.ts's own "revenue"
 *     was a separate, flat ₹300/unit × estimated-units guess - this
 *     replaces both wrong sources with the real, actual received amount.
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

export interface RevenueLike {
  cityId: string;
  amount: number;
  receivedDate: string;
  status: string;
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
 * received amount from genuine Revenue records. Only counts revenue
 * that's genuinely Received, not Pending or Failed.
 */
export function computeOMRealRevenue(entries: RevenueLike[], cityId: string, month: string): number {
  return entries
    .filter((e) => e.status === "Received" && e.cityId === cityId && e.receivedDate.startsWith(month))
    .reduce((sum, e) => sum + (e.amount || 0), 0);
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
