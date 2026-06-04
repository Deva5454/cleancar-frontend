/**
 * Analytics Utilities
 * Shared calculation logic for analytics components
 */

import type { CustomerSubscription } from "../contexts/AppProvider";

/**
 * LTV Thresholds for badge classification
 */
export const LTV_THRESHOLDS = {
  HIGH_VALUE: 20000,
  GOOD_VALUE: 15000,
} as const;

/**
 * Package retention estimates (in months)
 * Based on historical customer retention patterns
 */
export const PACKAGE_RETENTION_MONTHS: Record<string, number> = {
  "Water Wash": 12,
  "Water + Shampoo": 15,
  "Water + Shampoo + Wax": 18,
  // Legacy aliases
  Basic: 12, Standard: 15, Premium: 18, Deluxe: 18,
};

/**
 * Calculate effective monthly price from subscription billing cycle
 */
export function calculateEffectiveMonthlyPrice(subscription: CustomerSubscription): number {
  const cycleMultiplier =
    subscription.billingCycle === "Annual" ? 12 :
    subscription.billingCycle === "Quarterly" ? 3 : 1;

  const price = subscription?.pricing?.finalPrice ?? (subscription as any)?.priceLocked ?? 0;
  return price / cycleMultiplier;
}

/**
 * Calculate LTV for a single subscription
 */
export function calculateSubscriptionLTV(subscription: CustomerSubscription): number {
  const retentionMonths = PACKAGE_RETENTION_MONTHS[subscription.packageType] || 12;
  const effectiveMonthlyPrice = calculateEffectiveMonthlyPrice(subscription);
  return effectiveMonthlyPrice * retentionMonths;
}

/**
 * Calculate average LTV for a group of subscriptions
 */
export function calculateAverageLTV(subscriptions: CustomerSubscription[]): number {
  if (subscriptions.length === 0) return 0;

  const totalLTV = subscriptions.reduce((sum, sub) => {
    return sum + calculateSubscriptionLTV(sub);
  }, 0);

  return Math.round(totalLTV / subscriptions.length);
}

/**
 * Classify LTV value for badge display
 */
export function classifyLTVValue(ltv: number): "high" | "good" | "average" {
  if (ltv > LTV_THRESHOLDS.HIGH_VALUE) return "high";
  if (ltv > LTV_THRESHOLDS.GOOD_VALUE) return "good";
  return "average";
}

/**
 * Format currency in Indian Rupees
 */
export function formatINR(amount: number, options?: { decimals?: number; compact?: boolean }): string {
  const { decimals = 0, compact = false } = options || {};

  if (compact && amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }

  if (compact && amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }

  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: decimals })}`;
}
