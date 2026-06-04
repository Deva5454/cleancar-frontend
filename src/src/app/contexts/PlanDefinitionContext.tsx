/**
 * PlanDefinitionContext - PLAN TEMPLATES AND PRICING DEFINITIONS
 *
 * ⚠️ DO NOT CONFUSE WITH CustomerSubscriptionContext ⚠️
 *
 * THIS CONTEXT:
 * - Stores plan templates (Express Wash, Smart Wash, ELITE)
 * - Manages pricing matrix by vehicle category and plan type
 * - Provides add-on services, combo offers, one-time wash pricing
 * - Used for admin plan management and pricing updates
 *
 * CustomerSubscriptionContext (DIFFERENT):
 * - Stores customer subscription instances (who subscribed to what)
 * - Tracks active subscriptions, billing status, payment tracking
 * - NOT for plan definitions or pricing templates
 *
 * NAMING CONVENTION:
 * - "Plan" = Plan definition/template
 * - "Subscription" = Customer subscription instance
 *
 * Used for: Pricing screens, plan editors, finance calculations
 */

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from "react";
import { DataService } from "../services/DataService";
import { PlanApiService } from "../services/PlanApiService";
import type { PlanTier, Addon, ComboOffer as ComboOfferType } from "../types/subscriptionPlans.types";
import { subscriptionPlansService } from "../services/subscriptionPlansService";
import {
  CURRENT_PLAN_VERSION,
  getActivePlanVersion,
  VEHICLE_CATEGORIES,
  PLAN_TYPES,
  formatPrice,
  ADD_ON_SERVICES,
  COMBO_OFFERS,
  ONE_TIME_WASH_PRICING,
  type PlanVersion,
  type VehicleCategory,
  type PlanType,
  type PlanDeliverables,
  type AddOnService,
  type ComboOffer,
  type OneTimeWashPricing,
} from "../data/subscriptionPlans";

interface PlanDefinitionContextType {
  // Core Plan Data
  activePlan: PlanVersion;
  CURRENT_PLAN_VERSION: PlanVersion;
  vehicleCategories: VehicleCategory[];
  VEHICLE_CATEGORIES: VehicleCategory[];
  planTypes: PlanType[];
  PLAN_TYPES: PlanType[];

  // Plan Functions
  getPlanPrice: (vehicle: VehicleCategory, plan: PlanType) => number | "NA";
  getPlanDeliverables: (plan: PlanType) => PlanDeliverables | null;
  getVehicleCategoryPlans: (vehicle: VehicleCategory) => Array<{ planType: PlanType; monthlyPrice: number }>;
  formatPrice: (price: number | "NA") => string;

  // Add-On Services
  ADD_ON_SERVICES: AddOnService[];
  getAddOnById: (id: string) => AddOnService | undefined;
  getAddOnsByCategory: (category: "Cleaning" | "Protection" | "Maintenance") => AddOnService[];
  getAddOnsForPlan: (planType: PlanType) => AddOnService[];
  getAddOnPrice: (addonId: string, vehicleType: "4W" | "2W") => number | "NA";

  // Combo Offers
  COMBO_OFFERS: ComboOffer[];
  getComboById: (id: string) => ComboOffer | undefined;
  getActiveComboOffers: () => ComboOffer[];
  getCombosByVehicleCategory: (category: VehicleCategory) => ComboOffer[];

  // One-Time Wash Pricing
  ONE_TIME_WASH_PRICING: OneTimeWashPricing[];
  getOneTimeWashPrice: (vehicle: VehicleCategory, memberType: "member" | "nonMember") => number;
}

const PlanDefinitionContext = createContext<PlanDefinitionContextType | undefined>(
  undefined
);

export function PlanDefinitionProvider({ children }: { children: ReactNode }) {
  // ✅ FIX: reload overridden tiers from DataService when admin makes changes
  const [overriddenTiers, setOverriddenTiers] = useState<PlanTier[]>(() => {
    const stored = DataService.get<PlanTier>("PLAN_TIERS");
    return stored.length > 0 ? stored : [];
  });

  const reloadTiers = useCallback(() => {
    const stored = DataService.get<PlanTier>("PLAN_TIERS");
    if (stored.length > 0) setOverriddenTiers(stored);
  }, []);

  useEffect(() => {
    window.addEventListener("cc360_plan_price_changed", reloadTiers);
    return () => window.removeEventListener("cc360_plan_price_changed", reloadTiers);
  }, [reloadTiers]);

  // ── Load plan tiers from Railway PostgreSQL on mount ──────────────────────
  // This is the single source of truth fix: API data overwrites localStorage
  // so every device sees the same admin-edited prices.
  // Falls back to localStorage silently if API is unreachable.
  useEffect(() => {
    let cancelled = false;
    PlanApiService.getTiers().then(apiTiers => {
      if (cancelled || apiTiers.length === 0) return;
      // Map API tiers into the shape DataService expects, then save
      DataService.setAll("PLAN_TIERS", apiTiers.map(t => ({
        id: t.id,
        name: t.name,
        displayName: t.displayName,
        vehicleCategoryId: t.vehicleCategory,
        baseMonthlyPrice: t.baseMonthlyPrice,
        costPerWash: t.costPerWash,
        sortOrder: t.sortOrder,
        washesPerMonth: 26,
        isActive: t.isActive,
      })));
      if (!cancelled) reloadTiers();
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build a merged pricingMatrix: start from CURRENT_PLAN_VERSION then overlay
  // any admin-edited prices stored in DataService
  const activePlan = useMemo((): PlanVersion => {
    if (overriddenTiers.length === 0) return getActivePlanVersion();
    const base = getActivePlanVersion();
    // Deep-clone pricingMatrix so we don't mutate the constant
    const matrix = JSON.parse(JSON.stringify(base.pricingMatrix)) as typeof base.pricingMatrix;
    overriddenTiers.forEach(tier => {
      const cat = subscriptionPlansService.getVehicleCategoryById(tier.vehicleCategoryId);
      if (!cat) return;
      const catKey = cat.displayName as VehicleCategory;
      if (!matrix[catKey]) return;
      // Map enum tier name back to display plan type
      const planKey = tier.displayName as PlanType;
      if (planKey in matrix[catKey]) {
        (matrix[catKey] as any)[planKey] = tier.baseMonthlyPrice;
      }
    });
    return { ...base, pricingMatrix: matrix };
  }, [overriddenTiers]);

  const getPlanPrice = (vehicle: VehicleCategory, plan: PlanType): number | "NA" => {
    return activePlan.pricingMatrix[vehicle][plan];
  };

  const getPlanDeliverables = (plan: PlanType): PlanDeliverables | null => {
    return activePlan.deliverables[plan] || null;
  };

  const getVehicleCategoryPlans = (vehicle: VehicleCategory) => {
    // Safety check: ensure the vehicle category exists in the pricing matrix
    if (!activePlan.pricingMatrix[vehicle]) {
      console.warn(`Vehicle category "${vehicle}" not found in pricing matrix`);
      return [];
    }

    return PLAN_TYPES.map(planType => {
      const price = getPlanPrice(vehicle, planType);
      return {
        planType,
        monthlyPrice: price
      };
    }).filter(plan => plan.monthlyPrice !== "NA") as Array<{ planType: PlanType; monthlyPrice: number }>;
  };

  // Add-On Helper Functions
  const getAddOnById = (id: string): AddOnService | undefined => {
    return ADD_ON_SERVICES.find((addon) => addon.id === id);
  };

  const getAddOnsByCategory = (
    category: "Cleaning" | "Protection" | "Maintenance"
  ): AddOnService[] => {
    return ADD_ON_SERVICES.filter((addon) => addon.category === category && addon.isActive);
  };

  const getAddOnsForPlan = (planType: PlanType): AddOnService[] => {
    return ADD_ON_SERVICES.filter(
      (addon) => addon.isActive && addon.bestPairedWith.includes(planType)
    );
  };

  const getAddOnPrice = (addonId: string, vehicleType: "4W" | "2W"): number | "NA" => {
    const addon = getAddOnById(addonId);
    return addon ? addon.pricing[vehicleType] : "NA";
  };

  // Combo Offer Helper Functions
  const getComboById = (id: string): ComboOffer | undefined => {
    return COMBO_OFFERS.find((combo) => combo.id === id);
  };

  const getActiveComboOffers = (): ComboOffer[] => {
    return COMBO_OFFERS.filter((combo) => combo.isActive);
  };

  const getCombosByVehicleCategory = (category: VehicleCategory): ComboOffer[] => {
    return COMBO_OFFERS.filter(
      (combo) =>
        combo.planCombination.vehicle1.category === category ||
        combo.planCombination.vehicle2?.category === category
    );
  };

  // One-Time Wash Helper Function
  const getOneTimeWashPrice = (
    vehicle: VehicleCategory,
    memberType: "member" | "nonMember"
  ): number => {
    const pricing = ONE_TIME_WASH_PRICING.find((p) => p.vehicleCategory === vehicle);
    if (!pricing) return 0;
    return memberType === "member" ? pricing.memberPrice : pricing.nonMemberPrice;
  };

  // Filter plan types for subscription-only (exclude One-Time)
  const subscriptionPlanTypes = PLAN_TYPES.filter((plan) => !plan.includes("One-Time"));

  const contextValue: PlanDefinitionContextType = useMemo(() => ({
    // Core Plan Data
    activePlan,
    CURRENT_PLAN_VERSION,
    vehicleCategories: VEHICLE_CATEGORIES,
    VEHICLE_CATEGORIES,
    planTypes: subscriptionPlanTypes,
    PLAN_TYPES,

    // Plan Functions
    getPlanPrice,
    getPlanDeliverables,
    getVehicleCategoryPlans,
    formatPrice,

    // Add-On Services
    ADD_ON_SERVICES,
    getAddOnById,
    getAddOnsByCategory,
    getAddOnsForPlan,
    getAddOnPrice,

    // Combo Offers
    COMBO_OFFERS,
    getComboById,
    getActiveComboOffers,
    getCombosByVehicleCategory,

    // One-Time Wash Pricing
    ONE_TIME_WASH_PRICING,
    getOneTimeWashPrice,
  }),
  [activePlan, getPlanPrice, getPlanDeliverables, getVehicleCategoryPlans, formatPrice, getAddOnById, getAddOnsByCategory, getAddOnsForPlan, getAddOnPrice, getComboById]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PlanDefinitionContext.Provider value={contextValue}>
      {children}
    </PlanDefinitionContext.Provider>
  );
}

export function usePlanDefinitions() {
  const context = useContext(PlanDefinitionContext);
  if (context === undefined) {
    console.warn("[usePlanDefinitions] outside PlanDefinitionProvider - fallback"); return context as any;
  }
  return context;
}

