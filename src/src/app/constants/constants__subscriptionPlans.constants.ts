/**
 * Subscription Plans - Constants & Configuration
 *
 * Default values, thresholds, and configuration for subscription management.
 * All values here are DEFAULTS and should be admin-editable in production.
 *
 * @module subscriptionPlans.constants
 */

// ============================================
// BILLING CONFIGURATION
// ============================================

/** Standard number of washes per month (Mon-Sat, ~26 days) */
export const WASHES_PER_MONTH = 26;

/** Currency code */
export const CURRENCY = "INR" as const;

/** Currency symbol */
export const CURRENCY_SYMBOL = "₹";

// ============================================
// BILLING DURATION DEFAULTS
// ============================================

/**
 * Default Discount Rates by Duration
 * Admin can override these values
 */
export const DEFAULT_DURATION_DISCOUNTS = {
  MONTHLY: 0, // 0% - no discount
  QUARTERLY: 5, // 5% off
  HALF_YEARLY: 10, // 10% off
  NINE_MONTHS: 12, // 12% off
  ANNUAL: 15, // 15% off
} as const;

/**
 * Billing Duration Configurations
 */
export const BILLING_DURATIONS = [
  {
    type: "MONTHLY" as const,
    label: "Monthly",
    months: 1,
    discountPercent: DEFAULT_DURATION_DISCOUNTS.MONTHLY,
  },
  {
    type: "QUARTERLY" as const,
    label: "Quarterly",
    months: 3,
    discountPercent: DEFAULT_DURATION_DISCOUNTS.QUARTERLY,
  },
  {
    type: "HALF_YEARLY" as const,
    label: "Half-Yearly",
    months: 6,
    discountPercent: DEFAULT_DURATION_DISCOUNTS.HALF_YEARLY,
  },
  {
    type: "NINE_MONTHS" as const,
    label: "9 Months",
    months: 9,
    discountPercent: DEFAULT_DURATION_DISCOUNTS.NINE_MONTHS,
  },
  {
    type: "ANNUAL" as const,
    label: "Annual",
    months: 12,
    discountPercent: DEFAULT_DURATION_DISCOUNTS.ANNUAL,
  },
] as const;

// ============================================
// VEHICLE CATEGORY MAPPINGS
// ============================================

/**
 * Vehicle Category Display Names and Examples
 */
export const VEHICLE_CATEGORIES = {
  // 4-Wheeler Categories
  HATCHBACK_COMPACT_SEDAN: {
    displayName: "Hatchback / Compact Sedan",
    examples: ["Swift", "i20", "Baleno", "Dzire", "Tiago"],
    type: "4W" as const,
  },
  SUV_MUV_SEDAN: {
    displayName: "SUV / MUV / Sedan",
    examples: ["Creta", "Innova", "City", "Thar", "Ertiga"],
    type: "4W" as const,
  },
  LUXURY_LARGE_SUV: {
    displayName: "Luxury / Large SUV",
    examples: ["Fortuner", "XUV700", "Meridian", "Scorpio N"],
    type: "4W" as const,
  },
  // 2-Wheeler Categories
  STANDARD_COMMUTER_BIKE: {
    displayName: "Standard / Commuter Bike",
    examples: ["Splendor", "Passion", "CT100", "HF Deluxe"],
    type: "2W" as const,
  },
  SPORTS_PREMIUM_BIKE: {
    displayName: "Sports / Premium Bike",
    examples: ["Pulsar", "Apache", "Dominar", "Duke", "R15"],
    type: "2W" as const,
  },
  SCOOTER: {
    displayName: "Scooter",
    examples: ["Activa", "Jupiter", "Dio", "NTorq", "Burgman"],
    type: "2W" as const,
  },
} as const;

// ============================================
// PLAN TIER PRICING (BASE MONTHLY)
// ============================================

/**
 * Base Monthly Prices by Vehicle Category and Plan Tier
 * Source of truth for all billing calculations
 */
// v1.9 pricing — updated May 2026
// Plan IDs: EXPRESS_WASH (SHINE), SMART_WASH (PROTECT), ELITE_WASH (ELITE)
export const PLAN_BASE_PRICES = {
  HATCHBACK_COMPACT_SEDAN: {
    EXPRESS_WASH: 1249,   // was WATER_WASH — "Express Wash"
    SMART_WASH:   1599,   // was WATER_SHAMPOO — "Smart Wash"
    ELITE_WASH:   1999,   // was WATER_SHAMPOO_WAX — "Elite Wash"
  },
  SUV_MUV_SEDAN: {
    EXPRESS_WASH: 1499,
    SMART_WASH:   1999,
    ELITE_WASH:   2499,
  },
  LUXURY_LARGE_SUV: {
    EXPRESS_WASH: 1999,
    SMART_WASH:   2699,
    ELITE_WASH:   3499,
  },
  STANDARD_COMMUTER_BIKE: {
    WATER_WASH:  299,
    WATER_SHAMPOO: 699,
  },
  SPORTS_PREMIUM_BIKE: {
    WATER_WASH:  399,
    WATER_SHAMPOO: 899,
  },
  SCOOTER: {
    WATER_SHAMPOO: 599,
  },
} as const;

// ============================================
// PLAN TIER DISPLAY NAMES
// ============================================

export const PLAN_TIER_NAMES = {
  // Legacy keys — kept for backward compatibility
  WATER_WASH: "Water Wash",
  WATER_SHAMPOO: "Water + Shampoo",
  WATER_SHAMPOO_WAX: "Water + Shampoo + Wax",
} as const;

// v1.9 display names — use these in all UI
export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  EXPRESS_WASH: "Express Wash",   // internal ID: SHINE
  SMART_WASH:   "Smart Wash",     // internal ID: PROTECT
  ELITE_WASH:   "Elite Wash",     // internal ID: ELITE
  // Backward compat
  WATER_WASH:        "Express Wash",
  WATER_SHAMPOO:     "Smart Wash",
  WATER_SHAMPOO_WAX: "Elite Wash",
  SHINE:             "Express Wash",
  PROTECT:           "Smart Wash",
  ELITE:             "Elite Wash",
};

// ============================================
// ADD-ON SERVICES
// ============================================

/**
 * Add-On Service Configurations
 */
// v1.9 add-on pricing — prices are for HATCHBACK
// SUV prices: Interior +₹50, Dashboard +₹50, Tyre +₹50, Wax +₹50, Underbody +₹50, EngBay +₹50
// Luxury prices: Interior +₹150, Dashboard +₹100, Tyre +₹100, Wax +₹200, Underbody +₹150, EngBay +₹100
export const ADDON_SERVICES = [
  {
    id: "vacuum",
    name: "Interior Deep Vacuum",
    description: "Glove box, door pad polish, seats, mats, footwells, boot. Before+after photo.",
    prices: { hatchback: 199, suv: 249, luxury: 349 },
    price: 199,  // hatchback base, kept for backward compat
    billingType: "PER_VISIT" as const,
    bestPairedWith: ["EXPRESS_WASH", "SMART_WASH", "SHINE", "PROTECT"],
    marginPercent: 79,
    isOperationallyConfirmed: true,
  },
  {
    id: "dashboard",
    name: "Dashboard & Console Detail",
    description: "Dashboard polish, console polish, door pads, vents cleaned by blower.",
    prices: { hatchback: 149, suv: 199, luxury: 249 },
    price: 149,
    billingType: "PER_VISIT" as const,
    bestPairedWith: ["EXPRESS_WASH", "SMART_WASH", "ELITE_WASH", "SHINE", "PROTECT", "ELITE"],
    marginPercent: 80,
    isOperationallyConfirmed: true,
  },
  {
    id: "tyre",
    name: "Tyre Dressing (all 4 tyres)",
    description: "Shampoo wash tyre + mud guard + shine protect application.",
    prices: { hatchback: 99, suv: 149, luxury: 199 },
    price: 99,
    billingType: "PER_VISIT" as const,
    bestPairedWith: ["EXPRESS_WASH", "SMART_WASH", "SHINE", "PROTECT"],
    marginPercent: 75,
    isOperationallyConfirmed: true,
  },
  {
    id: "waxpolish",
    name: "Full Hand Wax Polish",
    description: "Shampoo wash + full body panel-by-panel wax application. Outer body only — no glass.",
    prices: { hatchback: 199, suv: 249, luxury: 399 },
    price: 199,
    billingType: "PER_VISIT" as const,
    bestPairedWith: ["EXPRESS_WASH", "SMART_WASH", "SHINE", "PROTECT"],
    marginPercent: 73,
    isOperationallyConfirmed: true,
  },
  {
    id: "underbody",
    name: "Underbody Wash",
    description: "Under body water spray — removes mud, road grime, salt.",
    prices: { hatchback: 199, suv: 249, luxury: 349 },
    price: 199,
    billingType: "PER_VISIT" as const,
    bestPairedWith: ["EXPRESS_WASH", "SMART_WASH", "ELITE_WASH"],
    marginPercent: 70,
    isOperationallyConfirmed: true,
  },
  {
    id: "enginebay",
    name: "Engine Bay Wipe-Down",
    description: "Dry blow of engine bay — no water. Removes dust and debris. Strictly dry process only.",
    prices: { hatchback: 99, suv: 149, luxury: 199 },
    price: 99,
    billingType: "PER_VISIT" as const,
    bestPairedWith: ["SMART_WASH", "ELITE_WASH", "PROTECT", "ELITE"],
    marginPercent: 72,
    isOperationallyConfirmed: true,
  },
  {
    id: "fragrance",
    name: "Car Fragrance (standalone)",
    description: "Interior car fragrance spray — single fresh application.",
    prices: { hatchback: 49, suv: 49, luxury: 49 },
    price: 49,
    billingType: "PER_VISIT" as const,
    bestPairedWith: ["EXPRESS_WASH", "SMART_WASH", "ELITE_WASH"],
    marginPercent: 85,
    isOperationallyConfirmed: true,
  },
  // REMOVED: Glass Coating (RainX) ₹349 — not in v1.9 pricing
] as const;

// ============================================
// ADD-ON COMBO BUNDLES (Section 4.3 of Package Architecture v1.9)
// Bundles increase per-transaction value — push at month 1 for Express Wash subscribers
// ============================================
export const ADD_ON_COMBO_BUNDLES = [
  {
    id: "andar-se-sundar",
    name: "Andar Se Sundar",
    nameEnglish: "Clean Inside Out",
    includes: ["vacuum", "dashboard"],
    description: "Interior Deep Vacuum + Dashboard & Console Detail",
    whenToSell: "Any time. Push at month 1 for all Express Wash subscribers.",
    prices: { hatchback: 299, suv: 399, luxury: 549 },
    savings:  { hatchback: 49,  suv: 49,  luxury: 49  },
  },
  {
    id: "showroom-shine",
    name: "Showroom Shine Pack",
    nameEnglish: "Complete Showroom Finish",
    includes: ["waxpolish", "vacuum", "dashboard"],
    description: "Full Hand Wax Polish + Interior Deep Vacuum + Dashboard & Console Detail",
    whenToSell: "Diwali / festive / gifting. \'Gift your family a showroom car.\'",
    prices: { hatchback: 499, suv: 647,  luxury: 949 },
    savings:  { hatchback: 47,  suv: 51,   luxury: 47  },
  },
] as const;

// ============================================
// COMBO OFFERS
// ============================================

/**
 * Combo Offer Bundles
 */
export const COMBO_OFFERS = [
  {
    name: "Car + Bike Bundle",
    description:
      "Shampoo wash — 1 hatchback + 1 standard bike (same address)",
    normalPrice: 1798, // 1299 + 499
    comboPrice: 1499,
    validityRule: "Same address",
  },
  {
    name: "Dual Car Bundle",
    description: "Shampoo wash — 2 hatchbacks / sedans, same household",
    normalPrice: 2598, // 1299 × 2
    comboPrice: 2249,
    validityRule: "Same household",
  },
  {
    name: "Premium Care Pack (Car)",
    description:
      "Shampoo+Wax + Interior vacuum 4x/mo + Tyre dressing 2x/mo + Fragrance",
    normalPrice: 2893, // 1999 + (199×4) + (99×2)
    comboPrice: 2549,
    validityRule: "Hatchback/Sedan",
  },
  {
    name: "Premium Care Pack (SUV)",
    description:
      "Shampoo+Wax + Interior vacuum 4x/mo + Tyre dressing 2x/mo + Fragrance",
    normalPrice: 3489, // 2699 + (199×4) + (99×2)
    comboPrice: 2999,
    validityRule: "SUV / MUV",
  },
  {
    name: "Bike Full Care Pack",
    description: "Premium bike wash + Engine clean 1x/mo + Tyre dressing 2x/mo",
    normalPrice: 1245, // 699 + (149×1) + (99×2) + adjustments
    comboPrice: 1049,
    validityRule: "Sports/Premium bike",
  },
  {
    name: "Society / Fleet Block (5+ vehicles)",
    description:
      "Any 5+ vehicles same address — flat 15% off each vehicle plan",
    normalPrice: 0, // Variable based on vehicles
    comboPrice: 0, // Calculated as 15% off
    validityRule: "Same society/fleet, minimum 5 vehicles",
  },
] as const;

// ============================================
// SERVICE FREQUENCIES
// ============================================

export const SERVICE_FREQUENCIES = {
  EVERY_WASH: "Every Wash (Daily)",
  WEEKLY: "Weekly (1x per week)",
  MONTHLY: "Monthly (1x per month)",
} as const;

// ============================================
// ADMIN ROLE PERMISSIONS
// ============================================

/**
 * Default Permissions by Role
 */
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    canCreatePlan: true,
    canEditPlan: true,
    canEditPricing: true,
    canEditFeatures: true,
    canEditDurationDiscounts: true,
    canDisablePlan: true,
    canDeletePlan: true,
    canManageAddons: true,
    canManageCombos: true,
    canViewAuditLog: true,
  },
  ADMIN: {
    canCreatePlan: true,
    canEditPlan: true,
    canEditPricing: true,
    canEditFeatures: true,
    canEditDurationDiscounts: false, // Read only for ADMIN
    canDisablePlan: true,
    canDeletePlan: false, // Cannot delete
    canManageAddons: true,
    canManageCombos: true,
    canViewAuditLog: true, // Can view audit logs
  },
  MANAGER: {
    canCreatePlan: false,
    canEditPlan: false,
    canEditPricing: false,
    canEditFeatures: false,
    canEditDurationDiscounts: false,
    canDisablePlan: false,
    canDeletePlan: false,
    canManageAddons: false,
    canManageCombos: false,
    canViewAuditLog: false,
  },
  VIEWER: {
    canCreatePlan: false,
    canEditPlan: false,
    canEditPricing: false,
    canEditFeatures: false,
    canEditDurationDiscounts: false,
    canDisablePlan: false,
    canDeletePlan: false,
    canManageAddons: false,
    canManageCombos: false,
    canViewAuditLog: false,
  },
} as const;

// ============================================
// UI DISPLAY CONSTANTS
// ============================================

/** Badge for best value duration */
export const BEST_VALUE_BADGE = "Best Value";

/** Maximum number of plans to show per row on desktop */
export const PLANS_PER_ROW = 3;

/** Colors for plan tier highlights */
export const PLAN_TIER_COLORS = {
  WATER_WASH: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  
} as const;

// ============================================
// VALIDATION CONSTANTS
// ============================================

/** Minimum base monthly price (in rupees) */
export const MIN_BASE_PRICE = 100;

/** Maximum base monthly price (in rupees) */
export const MAX_BASE_PRICE = 10000;

/** Minimum discount percentage */
export const MIN_DISCOUNT_PERCENT = 0;

/** Maximum discount percentage */
export const MAX_DISCOUNT_PERCENT = 50;

/** Minimum margin percentage for add-ons */
export const MIN_MARGIN_PERCENT = 0;

/** Maximum margin percentage for add-ons */
export const MAX_MARGIN_PERCENT = 100;
