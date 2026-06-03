/**
 * useRevenueMetrics
 * Single source of truth for revenue and EBITDA calculations.
 *
 * FIX: 37 components were computing revenue independently with different
 * formulas and filters, causing KPI mismatches across screens.
 * All components must use this hook for financial metrics.
 */
import { useMemo } from "react";
import { useFinanceForCurrentUser } from "./useFinanceForCurrentUser";

export interface RevenueMetrics {
  totalRevenue: number;       // All received revenue
  mrrRevenue: number;         // Subscription-based MRR
  oneTimeRevenue: number;     // One-time wash revenue
  totalExpenses: number;      // All approved/paid expenses
  ebitdaAmount: number;       // EBITDA in ₹
  ebitdaMargin: number;       // EBITDA as % (1 decimal place)
  activeCustomers: number;    // Unique customers with received revenue
  totalTransactions: number;  // Count of revenue entries
}

export function useRevenueMetrics(month?: string, cityId?: string): RevenueMetrics {
  const { getRevenues, getPayables } = useFinanceForCurrentUser();

  return useMemo(() => {
    const revenues = getRevenues(month);
    const payables = getPayables(month);

    const receivedRevenues = revenues.filter((r: any) => r.status === "Received");
    const mrrRevenue = receivedRevenues
      .filter((r: any) => r.type === "Subscription" || r.subscriptionId)
      .reduce((s: number, r: any) => s + (r.amount || 0), 0);

    const oneTimeRevenue = receivedRevenues
      .filter((r: any) => r.type === "One-Time" || (!r.subscriptionId && r.type !== "Subscription"))
      .reduce((s: number, r: any) => s + (r.amount || 0), 0);

    const totalRevenue = Math.round(receivedRevenues.reduce((s: number, r: any) => s + (r.amount || 0), 0));

    const totalExpenses = Math.round(
      payables
        .filter((p: any) => p.status === "Approved" || p.status === "Paid")
        .reduce((s: number, p: any) => s + (p.amount || 0), 0)
    );

    const ebitdaAmount = totalRevenue - totalExpenses;
    const ebitdaMargin = totalRevenue > 0
      ? Math.round((ebitdaAmount / totalRevenue) * 1000) / 10
      : 0;

    const activeCustomers = new Set(
      receivedRevenues.map((r: any) => r.customerId).filter(Boolean)
    ).size;

    return {
      totalRevenue,
      mrrRevenue: Math.round(mrrRevenue),
      oneTimeRevenue: Math.round(oneTimeRevenue),
      totalExpenses,
      ebitdaAmount: Math.round(ebitdaAmount),
      ebitdaMargin,
      activeCustomers,
      totalTransactions: receivedRevenues.length,
    };
  }, [getRevenues, getPayables, month, cityId]);
}
