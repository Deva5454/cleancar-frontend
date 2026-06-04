/**
 * Finance Data Hook
 * Combines Finance and Subscription contexts for accurate MRR/Revenue calculations
 *
 * CRITICAL: Finance MUST read from CustomerSubscriptionContext, not plan definitions
 */

import { useMemo } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { useCustomerSubscriptions } from "../contexts/CustomerSubscriptionContext";
import { useCustomers } from "../contexts/CustomerContext";

export interface MRRDataWithDetails {
  mrrId: string;
  month: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  planName: string;
  revenue: number;
  priceLocked: number;
  frequency: string;
  status: "Active" | "Churned" | "Paused";
}

/**
 * Hook to get MRR data enriched with subscription and customer details
 */
export function useEnrichedMRR() {
  const { mrrData, getTotalMRR, getMRRForMonth } = useFinance();
  const { getSubscriptionById } = useCustomerSubscriptions();
  const { getCustomerById } = useCustomers();

  const enrichedMRR = useMemo(() => {
    return mrrData.map((mrr) => {
      const subscription = getSubscriptionById(mrr.subscriptionId);
      const customer = getCustomerById(mrr.customerId);

      return {
        ...mrr,
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Unknown",
        planName: subscription?.packageName || "Unknown",
        priceLocked: subscription?.priceLocked || mrr.revenue,
        frequency: subscription?.frequency || "Unknown",
      } as MRRDataWithDetails;
    });
  }, [mrrData, getSubscriptionById, getCustomerById]);

  const getMRRWithDetails = (month: string): MRRDataWithDetails[] => {
    return enrichedMRR.filter((m) => m.month === month);
  };

  return {
    mrrData: enrichedMRR,
    getTotalMRR,
    getMRRForMonth,
    getMRRWithDetails,
  };
}

/**
 * Hook to calculate MRR from active subscriptions
 * Useful for verifying MRR data consistency
 */
export function useCalculatedMRR() {
  const { subscriptions } = useCustomerSubscriptions();

  const calculateMonthlyRevenue = (subscription: any): number => {
    switch (subscription.billingCycle) {
      case "Monthly":
        return subscription.priceLocked;
      case "Quarterly":
        return subscription.priceLocked / 3;
      case "Annual":
        return subscription.priceLocked / 12;
      default:
        return subscription.priceLocked;
    }
  };

  const totalMRR = useMemo(() => {
    return subscriptions
      .filter((sub) => sub.status === "Active")
      .reduce((sum, sub) => sum + calculateMonthlyRevenue(sub), 0);
  }, [subscriptions]);

  const activeSubscriptionsCount = useMemo(() => {
    return subscriptions.filter((sub) => sub.status === "Active").length;
  }, [subscriptions]);

  return {
    totalMRR,
    activeSubscriptionsCount,
    calculateMonthlyRevenue,
  };
}
