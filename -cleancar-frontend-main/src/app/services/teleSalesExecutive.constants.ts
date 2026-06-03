/**
 * TELE SALES EXECUTIVE (TSE) - CONSTANTS & CONFIGURATION
 * System-Enforced Business Rules
 */

// ============================================
// TARGETS & THRESHOLDS
// ============================================

/** Daily call volume targets */
export const DAILY_CALL_TARGET = {
  MIN: 80,
  MAX: 120,
  IDEAL: 100,
} as const;

/** Conversion rate targets */
export const CONVERSION_TARGETS = {
  MIN: 15, // 15%
  TARGET: 18, // 18%
  EXCELLENT: 22, // 22%
} as const;

/** SLA thresholds */
export const SLA_THRESHOLDS = {
  FIRST_CALL_MINUTES: 10, // Must call within 10 minutes
  AT_RISK_MINUTES: 7, // Warning at 7 minutes
  CRITICAL_MINUTES: 9, // Critical at 9 minutes
} as const;

/** Lead attempt limits */
export const LEAD_ATTEMPT_LIMITS = {
  MIN_BEFORE_LOST: 15, // Minimum 15 attempts before marking Lost
  TYPICAL: 8, // Typical conversion happens by attempt 8
} as const;

/** CRM compliance */
export const CRM_COMPLIANCE = {
  REQUIRED: 100, // 100% mandatory
  WARNING_THRESHOLD: 95, // Warning below 95%
  PENALTY_THRESHOLD: 100, // 20% penalty if below 100%
  PENALTY_PERCENT: 20, // 20% reduction in variable payout
} as const;

// ============================================
// PRICING ENGINE
// ============================================

/** EBITDA floor - hard system limit */
export const EBITDA_FLOOR = {
  MINIMUM_PERCENT: 30, // 30% minimum EBITDA
  SAFE_PERCENT: 35, // 35%+ is safe zone
  WARNING_PERCENT: 32, // 32-34% is warning zone
  BLOCKED_PERCENT: 29, // Below 30% is blocked
} as const;

/** Add-on options */
// v1.9 add-on pricing — all 7 add-ons with per-vehicle prices
// Issue 5 FIX: prices object added so TSE quotes correct SUV/Luxury amounts
// Issue 6 FIX: Full Hand Wax + Underbody Wash added (were missing)
export const ADD_ON_OPTIONS = [
  {
    id: "addon-vacuum",
    name: "Interior Deep Vacuum",
    internalCost: 40,
    perceivedValue: 199,
    prices: { H: 199, SUV: 249, Lux: 349 },
    description: "Glove box, cooling box, door pad polish, seats, mats, footwells, boot. Before+after photo.",
    marginPercent: 79,
  },
  {
    id: "addon-dashboard",
    name: "Dashboard & Console Detail",
    internalCost: 30,
    perceivedValue: 149,
    prices: { H: 149, SUV: 199, Lux: 249 },
    description: "Dashboard polish, console polish, door pads cleaning + polish, vents cleaned by blower.",
    marginPercent: 80,
  },
  {
    id: "addon-tyre",
    name: "Tyre Dressing (all 4 tyres)",
    internalCost: 25,
    perceivedValue: 99,
    prices: { H: 99, SUV: 149, Lux: 199 },
    description: "Shampoo wash tyre + mud guard + shine protect application. All 4 tyres.",
    marginPercent: 75,
  },
  {
    id: "addon-wax",
    name: "Full Hand Wax Polish",
    internalCost: 55,
    perceivedValue: 199,
    prices: { H: 199, SUV: 249, Lux: 399 },
    description: "Shampoo wash + full body panel-by-panel wax application. Outer body only — no glass.",
    marginPercent: 73,
  },
  {
    id: "addon-underbody",
    name: "Underbody Wash",
    internalCost: 58,
    perceivedValue: 199,
    prices: { H: 199, SUV: 249, Lux: 349 },
    description: "Under body water spray — removes mud, road grime, salt.",
    marginPercent: 71,
  },
  {
    id: "addon-enginebay",
    name: "Engine Bay Wipe-Down",
    internalCost: 25,
    perceivedValue: 99,
    prices: { H: 99, SUV: 149, Lux: 199 },
    description: "Dry blow of engine bay — no water. Strictly dry process only.",
    marginPercent: 75,
  },
  {
    id: "addon-fragrance",
    name: "Car Fragrance",
    internalCost: 8,
    perceivedValue: 49,
    prices: { H: 49, SUV: 49, Lux: 49 },
    description: "Interior car fragrance spray — single fresh application. All vehicle types ₹49.",
    marginPercent: 85,
  },
] as const;

// Issue 7: Add-on combo bundles for TSE upsell (Section 4.3 Package Architecture v1.9)
export const ADD_ON_COMBOS_TSE = [
  {
    id: "andar-se-sundar",
    name: "Andar Se Sundar",
    addonIds: ["addon-vacuum", "addon-dashboard"],
    prices: { H: 299, SUV: 399, Lux: 549 },
    savings:  { H: 49,  SUV: 49,  Lux: 49  },
    pitch: "Sir, vacuum + dashboard clean together — H ₹299, SUV ₹399. Save ₹49 vs booking separately.",
    whenToSell: "Push at month 1 for every Express Wash subscriber.",
  },
  {
    id: "showroom-shine",
    name: "Showroom Shine Pack",
    addonIds: ["addon-wax", "addon-vacuum", "addon-dashboard"],
    prices: { H: 499, SUV: 647, Lux: 949 },
    savings:  { H: 47,  SUV: 51,  Lux: 47  },
    pitch: "Wax + interior + dashboard together — H ₹499. Car looks showroom-new. Perfect for Diwali.",
    whenToSell: "Festive / Diwali / gifting occasions.",
  },
] as const;

/**
 * Bundle discount tiers (applied as % of the base plan price)
 * HIGH = full price (no discount), MID = 5% off, LOW = at 30% EBITDA floor
 * These are discount percentages — not hardcoded prices.
 * calculateBundleOptions() applies these to the actual lead plan price.
 */
export const BUNDLE_DISCOUNT_TIERS = {
  HIGH: { discountPercent: 0,  label: "Full Price",    description: "Complete package at full price" },
  MID:  { discountPercent: 5,  label: "Best Value",    description: "Recommended — 5% off, same incentive" },
  LOW:  { discountPercent: 10, label: "Lowest Price",  description: "10% off — use only if customer resists. Incentive reduced." },
} as const;

/**
 * Add-on bundle combos — extra add-ons bundled with subscription at a combined price
 * Vehicle-specific prices driven by v1.9 pricing document
 * High = full plan + add-on price, Mid = ~5% off, Low = ~10% off (EBITDA floor)
 */
export const ADDON_BUNDLE_PRICES = {
  // Vacuum + Subscription bundle prices (most popular add-on)
  VACUUM_BUNDLE: {
    HATCHBACK: { HIGH: 1448, MID: 1376, LOW: 1303 }, // Smart Wash ₹1,599 × tiers… placeholder shown
    SUV:       { HIGH: 1848, MID: 1756, LOW: 1663 },
    LUXURY:    { HIGH: 2848, MID: 2706, LOW: 2563 },
  },
} as const;

/** Incentive multipliers by deal type */
export const INCENTIVE_MULTIPLIERS = {
  BASE_PRICE: 70, // 70% of standard commission
  ADD_ON: 90, // 90% of standard commission
  BUNDLE_HIGH: 100, // 100% - not commonly used
  BUNDLE_MID: 100, // 100% - ideal target ⭐
  BUNDLE_LOW: 60, // 60% - discouraged ⚠️
} as const;

// ============================================
// COMPENSATION
// ============================================

/** Fixed salary range */
export const FIXED_SALARY = {
  MIN: 15000,
  MAX: 20000,
  TYPICAL: 17500,
} as const;

/** Commission tiers */
export const COMMISSION_TIERS = [
  {
    tier: "TIER_1" as const,
    min: 0,
    max: 100000,
    rate: 3,
    label: "Up to ₹1 lakh",
  },
  {
    tier: "TIER_2" as const,
    min: 100000,
    max: 200000,
    rate: 5,
    label: "₹1-2 lakh",
  },
  {
    tier: "TIER_3" as const,
    min: 200000,
    max: Infinity,
    rate: 7,
    label: "Above ₹2 lakh",
  },
] as const;

/** Renewal bonus */
export const RENEWAL_BONUS = {
  PER_RENEWAL: 100, // ₹100 per confirmed renewal
  PER_UPGRADE: 100, // ₹100 per upgrade
  NO_CAP: true, // No limit on renewal count
} as const;

/** Maximum variable potential */
export const MAX_VARIABLE = {
  COMMISSION: 25000, // Max ₹25,000 from commission
  RENEWAL_BONUS: Infinity, // No cap on renewals
  TOTAL_CTC_POTENTIAL: 45000, // ₹45,000 total (₹20k fixed + ₹25k variable)
} as const;

// ============================================
// AUTOMATION & ALERTS
// ============================================

/** Alert timing */
export const ALERT_TIMING = {
  SLA_BREACH_AT_MINUTES: 10,
  CRM_UPDATE_WARNING_MINUTES: 30,
  PAYMENT_LINK_EXPIRY_HOURS: 24,
  RENEWAL_ADVANCE_DAYS: 7,
  RENEWAL_SECOND_CALL_DAYS: 2,
} as const;

/** Refresh intervals (milliseconds) */
export const REFRESH_INTERVALS = {
  LEAD_QUEUE: 30000, // 30 seconds
  SLA_COUNTDOWN: 1000, // 1 second
  CALL_TIMER: 1000, // 1 second
  INCENTIVE_TRACKER: 300000, // 5 minutes
} as const;

// ============================================
// UI CONFIGURATION
// ============================================

/** Color coding */
export const STATUS_COLORS = {
  GREEN: {
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-700",
    badge: "bg-green-600",
  },
  YELLOW: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-700",
    badge: "bg-yellow-600",
  },
  RED: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    badge: "bg-red-600",
  },
  BLUE: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
    badge: "bg-blue-600",
  },
} as const;

/** Priority icons */
export const PRIORITY_CONFIG = {
  URGENT: {
    label: "URGENT",
    color: "red",
    icon: "AlertTriangle",
  },
  HIGH: {
    label: "HIGH",
    color: "orange",
    icon: "AlertCircle",
  },
  NORMAL: {
    label: "NORMAL",
    color: "blue",
    icon: "Info",
  },
} as const;

// ============================================
// PAYMENT LINK
// ============================================

/** Payment link configuration */
export const PAYMENT_LINK_CONFIG = {
  EXPIRY_HOURS: 24,
  MAX_REGENERATIONS: 2, // Alert TSM if > 2 regenerations
  AUTO_FOLLOW_UP_HOURS: 12, // Follow-up reminder if unpaid after 12 hours
} as const;

// ============================================
// SYSTEM MESSAGES
// ============================================

/** Script templates */
export const SCRIPTS = {
  INTRODUCTION: "This is [Name] from [Company]. I'm calling about the car wash subscription you enquired about...",
  VEHICLE_DISCOVERY: "To recommend the right plan, could you tell me about your vehicle? Is it a car or bike? What model?",
  PRICING_INTRO: "For your [vehicle], our [plan] is ₹[price]/month - that's ₹[per_wash] per wash including [benefits].",
  ADD_ON_OFFER: "Sir, instead of a discount, I'll include [add-on] complimentary for you - that's ₹[value] of value added.",
  BUNDLE_MID: "Sir, instead of cutting the price, I'm giving you ₹[normal] worth of services at ₹[bundle] - three services together.",
  BUNDLE_LOW: "₹[price] is the absolute best I can do - this is our lowest possible price.",
  PAYMENT_LINK: "Perfect! I'm sending you the payment link on WhatsApp right now. It's valid for 24 hours.",
  RENEWAL_FIRST: "Your subscription renews in [days] days - shall I process renewal now so there's no gap in service?",
  RENEWAL_UPGRADE: "You've been on [current_plan] for [months] months - would you like to try [upgrade_plan] this cycle? It's only ₹[diff] more.",
} as const;

/** System safeguard messages */
export const SAFEGUARD_MESSAGES = {
  NO_DISCOUNT_BUTTON: "System does not allow direct price reduction. Use add-on or bundle instead.",
  ADD_ON_LIMIT_REACHED: "Up to 3 add-ons can be added per subscription deal.",  // Business allows multiple add-ons
  EBITDA_BLOCKED: "EBITDA is below 30% floor. Cannot proceed with this price. Consider bundle MID instead.",
  CRM_UPDATE_REQUIRED: "CRM update required before accessing next lead. Please complete all mandatory fields.",
  SLA_BREACH_WARNING: "This lead is approaching 10-minute SLA. Call immediately.",
  LOST_ATTEMPT_LIMIT: "15 attempts not reached. Cannot mark as Lost. Current attempts: [count]",
} as const;

// ============================================
// TAGS & CATEGORIES
// ============================================

/** Quick tags for CRM notes */
export const QUICK_TAGS = [
  "Price Concern",
  "Interested",
  "Needs Follow-up",
  "Competitor Mention",
  "Quality Question",
  "Timing Issue",
  "Budget Constraint",
  "Decision Maker Not Available",
  "Wants Trial",
  "Premium Customer",
] as const;

/** Lead sources */
export const LEAD_SOURCES = {
  DIGITAL: "Website / App",
  BTL_REFERRAL: "Below-the-Line Referral",
  WALK_IN: "Walk-in Enquiry",
  SOCIAL_MEDIA: "Social Media",
  PARTNER: "Partner Channel",
} as const;

// ============================================
// KPI THRESHOLDS
// ============================================

/** KPI color coding thresholds */
export const KPI_THRESHOLDS = {
  CALLS: {
    GREEN: 90, // 90+ calls = green
    AMBER: 70, // 70-89 = amber
    RED: 69, // < 70 = red
  },
  CONVERSION_RATE: {
    GREEN: 18, // 18%+ = green
    AMBER: 15, // 15-17.9% = amber
    RED: 14.9, // < 15% = red
  },
  CRM_COMPLIANCE: {
    GREEN: 100, // 100% = green
    AMBER: 95, // 95-99% = amber
    RED: 94, // < 95% = red
  },
  REVENUE: {
    GREEN: 100, // 100%+ of target = green
    AMBER: 80, // 80-99% = amber
    RED: 79, // < 80% = red
  },
} as const;

// BUNDLE_TEMPLATES — WhatsApp pitch script templates for bundle upsells
// Used by teleSalesExecutiveService.calculateBundleOptions()
export const BUNDLE_TEMPLATES = {
  SUV_COMBO: "For your SUV, our [plan] + Interior Vacuum is ₹[price]/month — that's ₹[value] of value in one package. Shall I set it up for you right now?",
  HATCHBACK_COMBO: "For your [car], our [plan] + Interior Vacuum is ₹[price]/month — cleaner inside and out every day.",
  LUXURY_COMBO: "For your [car], our Elite Wash + Vacuum + Dashboard Detail is ₹[price]/month — showroom condition daily.",
  DEFAULT: "Our [plan] + [addon] bundle is ₹[price]/month — ₹[saving] saving vs booking separately.",
} as const;
