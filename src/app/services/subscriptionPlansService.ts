/**
 * Subscription Plans Service
 * Central service for all subscription plan data and calculations.
 *
 * SOURCE OF TRUTH: src/app/data/subscriptionPlans.ts
 * All plan names, prices, add-ons, combos, and vehicle categories are
 * defined there. This service reads from that file only — never from
 * constants/subscriptionPlans.constants.ts for plan data.
 *
 * constants/subscriptionPlans.constants.ts now contains only:
 * - ROLE_PERMISSIONS (permission engine config)
 * - PLAN_TIER_COLORS (UI display only)
 *
 * @module subscriptionPlansService
 */

import type {
  VehicleCategory,
  PlanTier,
  PlanFeature,
  DurationPrice,
  Addon,
  ComboOffer,
  CompletePlan,
  BillingDurationType,
  VehicleCategoryName,
  PlanTierName,
} from "../types/subscriptionPlans.types";

import {
  VEHICLE_CATEGORIES_CONFIG,
  PLAN_BASE_PRICES,
  PLAN_TIER_NAMES,
  BILLING_DURATIONS,
  WASHES_PER_MONTH,
  ADDON_SERVICES,
  COMBO_OFFERS,
} from "../data/subscriptionPlans";

// ─── SINGLE SOURCE OF TRUTH bridge ───────────────────────────────────────────
// Prices now come from planSyncService (which reads cleancar_plan_page_config)
// so Admin Plan Editor changes propagate to TSE, TSM, Car Washer, and Buy Page
import { planSyncService } from "./planSyncService";


class SubscriptionPlansService {
  // ============================================
  // 1️⃣ VEHICLE CATEGORIES
  // ============================================

  /**
   * Get all vehicle categories
   * In production: GET /api/vehicle-categories
   */
  getVehicleCategories(vehicleType?: "4W" | "2W"): VehicleCategory[] {
    const categories: VehicleCategory[] = Object.entries(VEHICLE_CATEGORIES_CONFIG).map(
      ([key, value], index) => ({
        id: `vc-${index + 1}`,
        name: key as VehicleCategoryName,
        displayName: value.displayName,
        examples: value.examples,
        type: value.type,
        isActive: true,
      })
    );

    if (vehicleType) {
      return categories.filter((cat) => cat.type === vehicleType);
    }

    return categories;
  }

  /**
   * Get vehicle category by ID
   */
  getVehicleCategoryById(id: string): VehicleCategory | null {
    const categories = this.getVehicleCategories();
    return categories.find((cat) => cat.id === id) || null;
  }

  // ============================================
  // 2️⃣ PLAN TIERS
  // ============================================

  /**
   * Get all plan tiers for a vehicle category
   * In production: GET /api/plan-tiers?vehicleCategoryId=:id
   */
  getPlanTiersByCategory(vehicleCategoryId: string): PlanTier[] {
    const category = this.getVehicleCategoryById(vehicleCategoryId);
    if (!category) return [];

    const categoryPrices = PLAN_BASE_PRICES[category.name];
    if (!categoryPrices) return [];

    const tiers: PlanTier[] = Object.entries(categoryPrices).map(
      ([tierKey, price], index) => {
        const tierName = tierKey as PlanTierName;
        return {
          id: `pt-${vehicleCategoryId}-${index + 1}`,
          name: tierName,
          displayName: PLAN_TIER_NAMES[tierName],
          vehicleCategoryId,
          baseMonthlyPrice: price,
          costPerWash: Number((price / WASHES_PER_MONTH).toFixed(2)),
          washesPerMonth: WASHES_PER_MONTH,
          isActive: true,
          sortOrder: index,
        };
      }
    );

    // ── LIVE PRICE OVERRIDE from planSyncService (single source of truth) ──
    const livePrices = planSyncService.getPlanBasePrices();
    const liveForCat = livePrices[category.name];

    return tiers;
  }

  /**
   * Get all active plan tiers (all categories)
   */
  getAllPlanTiers(): PlanTier[] {
    const categories = this.getVehicleCategories();
    const allTiers: PlanTier[] = [];

    categories.forEach((category) => {
      const tiers = this.getPlanTiersByCategory(category.id);
      allTiers.push(...tiers);
    });

    return allTiers;
  }

  // ============================================
  // 3️⃣ BILLING DURATION CALCULATIONS
  // ============================================

  /**
   * Calculate prices for all billing durations for a plan tier
   * Implements: base_price × months × (1 - discount_percent / 100)
   */
  calculateDurationPrices(
    baseMonthlyPrice: number,
    customDiscounts?: Partial<Record<BillingDurationType, number>>
  ): DurationPrice[] {
    const prices: DurationPrice[] = BILLING_DURATIONS.map((duration) => {
      const discountPercent =
        customDiscounts?.[duration.type] ?? duration.discountPercent;

      const totalAmount = Math.round(
        baseMonthlyPrice * duration.months * (1 - discountPercent / 100)
      );

      const effectiveMonthlyPrice = Math.round(totalAmount / duration.months);

      const amountSaved =
        baseMonthlyPrice * duration.months - totalAmount;

      return {
        duration: duration.type,
        label: duration.label,
        months: duration.months,
        baseMonthlyPrice,
        discountPercent,
        totalAmount,
        effectiveMonthlyPrice,
        amountSaved,
        isBestValue: false, // Will be set below
      };
    });

    // Mark the duration with highest discount as "Best Value"
    if (prices.length > 0) {
      const maxDiscountIndex = prices.reduce(
        (maxIdx, curr, idx, arr) =>
          curr.discountPercent > arr[maxIdx].discountPercent ? idx : maxIdx,
        0
      );
      prices[maxDiscountIndex].isBestValue = true;
    }

    return prices;
  }

  // ============================================
  // 4️⃣ PLAN FEATURES
  // ============================================

  /**
   * Get features for a specific plan tier
   * In production: GET /api/plan-features?planTierId=:id
   */
  getPlanFeatures(planTierId: string): PlanFeature[] {
    // This would come from database in production
    // For now, returning sample features based on plan tier name
    const planTier = this.getAllPlanTiers().find((pt) => pt.id === planTierId);
    if (!planTier) return [];

    return this.getFeaturesByTierName(planTierId, planTier.name);
  }

  /**
   * Get features based on tier name (helper method with actual data)
   */
  private getFeaturesByTierName(
    planTierId: string,
    tierName: PlanTierName
  ): PlanFeature[] {
    const commonEveryWash: Partial<PlanFeature>[] = [
      {
        featureName: "Full exterior water rinse (pressure gun)",
        frequency: "EVERY_WASH" as const,
      },
      {
        featureName: "Wheel rim rinse",
        frequency: "EVERY_WASH" as const,
      },
      {
        featureName: "Tyre & mudguard pressure spray",
        frequency: "EVERY_WASH" as const,
      },
      {
        featureName: "Roof + running boards / step-board clean",
        frequency: "EVERY_WASH" as const,
      },
      {
        featureName: "Exterior glass wipe / clean",
        frequency: "EVERY_WASH" as const,
      },
      {
        featureName: "Wiper blade clean",
        frequency: "EVERY_WASH" as const,
      },
    ];

    const commonMonthly: Partial<PlanFeature>[] = [
      {
        featureName: "Under-body water flush",
        frequency: "MONTHLY" as const,
      },
    ];

    let features: Partial<PlanFeature>[] = [];

    // v1.9 display name map — use PLAN_DISPLAY_NAMES from constants for UI rendering
    // Internal IDs (SHINE/PROTECT/ELITE) kept for backward compat — do NOT rename
    // Display: SHINE → "Express Wash", PROTECT → "Smart Wash", ELITE → "Elite Wash"

    switch (tierName) {
      case "SHINE":
        // Express Wash — v1.9 contents
        features = [
          ...commonEveryWash,
          // WEEKLY (4×/month)
          {
            featureName: "Tyre & rim spray-clean",
            frequency: "WEEKLY" as const,
          },
          // MONTHLY (1×/month)
          ...commonMonthly,  // underbody flush
          {
            featureName: "Windshield clean (outside)",
            frequency: "MONTHLY" as const,
          },
          {
            featureName: "Shampoo wash",
            frequency: "MONTHLY" as const,
          },
        ];
        break;

      case "PROTECT":
        // Smart Wash — v1.9 contents
        features = [
          ...commonEveryWash,
          {
            featureName: "Microfibre dry + glass polish",
            frequency: "EVERY_WASH" as const,
          },
          // FORTNIGHTLY (2×/month)
          {
            featureName: "Shampoo foam wash",
            frequency: "FORTNIGHTLY" as const,
          },
          {
            featureName: "Interior vacuum & mat clean",
            frequency: "FORTNIGHTLY" as const,
          },
          // MONTHLY (1×/month)
          ...commonMonthly,  // underbody flush
          {
            featureName: "Tyre dressing & shine coat (full 4)",
            frequency: "MONTHLY" as const,
          },
          {
            featureName: "Car fragrance",
            frequency: "MONTHLY" as const,
          },
        ];
        break;

      case "ELITE":
        // Elite Wash — v1.9 contents
        features = [
          ...commonEveryWash,
          {
            featureName: "Microfibre dry + glass polish",
            frequency: "EVERY_WASH" as const,
          },
          // WEEKLY (4×/month)
          {
            featureName: "Shampoo foam wash",
            frequency: "WEEKLY" as const,
          },
          // FORTNIGHTLY (2×/month)
          {
            featureName: "Dashboard & console deep clean",
            frequency: "FORTNIGHTLY" as const,
          },
          {
            featureName: "Interior vacuum & mat clean",
            frequency: "FORTNIGHTLY" as const,
          },
          // MONTHLY (1×/month)
          ...commonMonthly,  // underbody flush
          {
            featureName: "Full hand wax polish (outer body)",
            frequency: "MONTHLY" as const,
          },
          {
            featureName: "Engine bay dry blow (no water)",
            frequency: "MONTHLY" as const,
          },
          {
            featureName: "Tyre dressing & shine coat (full 4)",
            frequency: "FORTNIGHTLY" as const,   // 2×/month
          },
          {
            featureName: "Premium fragrance + cabin sanitisation spray",
            frequency: "MONTHLY" as const,
          },
        ];
        break;

      case "ELITE_2W":
        features = [
          ...commonEveryWash,
          {
            featureName: "Bike/scooter shampoo wash",
            frequency: "EVERY_WASH" as const,
          },
          {
            featureName: "Spoke & rim scrub",
            frequency: "WEEKLY" as const,
          },
          {
            featureName: "Engine bay surface wipe",
            frequency: "MONTHLY" as const,
          },
          {
            featureName: "Full body spray wax / liquid polish",
            frequency: "MONTHLY" as const,
          },
        ];
        break;
    }

    return features.map((feature, index) => ({
      id: `pf-${planTierId}-${index + 1}`,
      planTierId,
      featureName: feature.featureName!,
      frequency: feature.frequency!,
      isIncluded: true,
      sortOrder: index,
    }));
  }

  // ============================================
  // 5️⃣ ADD-ONS
  // ============================================

  /**
   * Get all add-on services
   * In production: GET /api/addons?isActive=true
   */
  getAddons(includeInactive = false): Addon[] {
    return ADDON_SERVICES.map((addon, index) => ({
      id: `addon-${index + 1}`,
      name: addon.name,
      description: addon.description,
      price: addon.price, // Hatchback default — use prices object for vehicle-aware pricing
      // FIX 3: expose full vehicle-category pricing so AddonSelector shows correct price
      prices: (addon as any).pricing
        ? {
            hatchback: (addon as any).pricing.hatchback ?? addon.price,
            suv:       (addon as any).pricing.suv       ?? addon.price,
            luxury:    (addon as any).pricing.luxury     ?? addon.price,
            twoW:      (addon as any).pricing.twoW       ?? 0,
          }
        : { hatchback: addon.price, suv: addon.price, luxury: addon.price, twoW: 0 },
      billingType: addon.billingType,
      bestPairedWith: addon.bestPairedWith as PlanTierName[],
      marginPercent: addon.marginPercent,
      isActive: addon.isOperationallyConfirmed,
      isOperationallyConfirmed: addon.isOperationallyConfirmed,
      sortOrder: index,
    })).filter((addon) => includeInactive || addon.isActive);
  }

  /**
   * Get add-ons recommended for a specific plan tier
   */
  getRecommendedAddons(planTierName: PlanTierName): Addon[] {
    const allAddons = this.getAddons();
    return allAddons.filter((addon) =>
      addon.bestPairedWith.includes(planTierName)
    );
  }

  // ============================================
  // 6️⃣ COMBO OFFERS
  // ============================================

  /**
   * Get all combo offers
   * In production: GET /api/combo-offers?isActive=true
   */
  getComboOffers(): ComboOffer[] {
    return COMBO_OFFERS.map((combo, index) => ({
      id: `combo-${index + 1}`,
      name: combo.name,
      description: combo.description,
      includedPlanIds: [], // Would be actual plan IDs in production
      normalPrice: combo.normalPrice,
      comboPrice: combo.comboPrice,
      savingAmount: combo.normalPrice - combo.comboPrice,
      savingPercent:
        combo.normalPrice > 0
          ? Math.round(
              ((combo.normalPrice - combo.comboPrice) / combo.normalPrice) * 100
            )
          : 0,
      validityRule: combo.validityRule,
      isActive: true,
      sortOrder: index,
    }));
  }

  // ============================================
  // 7️⃣ COMPLETE PLAN (FOR CUSTOMER DISPLAY)
  // ============================================

  /**
   * Get complete plan with all details for customer-facing display
   */
  getCompletePlan(planTierId: string): CompletePlan | null {
    const allTiers = this.getAllPlanTiers();
    const tier = allTiers.find((t) => t.id === planTierId);
    if (!tier) return null;

    const vehicleCategory = this.getVehicleCategoryById(tier.vehicleCategoryId);
    if (!vehicleCategory) return null;

    const features = this.getPlanFeatures(planTierId);
    const prices = this.calculateDurationPrices(tier.baseMonthlyPrice);
    const addons = this.getRecommendedAddons(tier.name);

    return {
      tier,
      vehicleCategory,
      features,
      prices,
      addons,
    };
  }

  /**
   * Get all complete plans for a vehicle category
   */
  getCompletePlansByCategory(vehicleCategoryId: string): CompletePlan[] {
    const tiers = this.getPlanTiersByCategory(vehicleCategoryId);
    const completePlans: CompletePlan[] = [];

    tiers.forEach((tier) => {
      const plan = this.getCompletePlan(tier.id);
      if (plan) {
        completePlans.push(plan);
      }
    });

    return completePlans;
  }

  // ============================================
  // 8️⃣ PRICING UTILITIES
  // ============================================

  /**
   * Format price with currency symbol
   */
  formatPrice(amount: number): string {
    return `₹${amount.toLocaleString("en-IN")}`;
  }

  /**
   * Calculate total for combo with discount
   */
  calculateComboTotal(planIds: string[], comboDiscountPercent: number): number {
    const allTiers = this.getAllPlanTiers();
    const selectedTiers = allTiers.filter((t) => planIds.includes(t.id));

    const totalBeforeDiscount = selectedTiers.reduce(
      (sum, tier) => sum + tier.baseMonthlyPrice,
      0
    );

    const totalAfterDiscount = Math.round(
      totalBeforeDiscount * (1 - comboDiscountPercent / 100)
    );

    return totalAfterDiscount;
  }
}

// Export singleton instance
export const subscriptionPlansService = new SubscriptionPlansService();

// Export class for testing
export { SubscriptionPlansService };
