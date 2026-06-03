/**
 * subscriptionPlans.constants.ts
 *
 * UI display constants and role permission config ONLY.
 *
 * ⚠️  PLAN DATA IS NOT HERE.
 * All plan names, prices, vehicle categories, add-ons, combos, and
 * billing durations live in one place only:
 *
 *   src/app/data/subscriptionPlans.ts  ← SINGLE SOURCE OF TRUTH
 *
 * Do not re-add PLAN_BASE_PRICES, VEHICLE_CATEGORIES, PLAN_TIER_NAMES,
 * BILLING_DURATIONS, ADDON_SERVICES, or COMBO_OFFERS here.
 * subscriptionPlansService now imports those from the data file directly.
 */

// Re-export UI constants from the data file so existing imports of
// PLAN_TIER_COLORS and ROLE_PERMISSIONS from this path still compile.
export {
  PLAN_TIER_COLORS,
  ROLE_PERMISSIONS,
  SERVICE_FREQUENCIES,
  MIN_BASE_PRICE,
  MAX_BASE_PRICE,
  MIN_DISCOUNT_PERCENT,
  MAX_DISCOUNT_PERCENT,
  MIN_MARGIN_PERCENT,
  MAX_MARGIN_PERCENT,
  BEST_VALUE_BADGE,
  PLANS_PER_ROW,
} from "../data/subscriptionPlans";
