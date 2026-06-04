// Subscription Plans Data - Complete Plan Management System
// Updated April 2026 - V2 (New Plan Structure per Developer Handoff)

export type VehicleCategory =
  | "Hatchback / Compact Sedan"
  | "SUV / MUV / Sedan"
  | "Luxury / Large SUV"
  | "2W - Standard / Commuter Bike"
  | "2W - Sports / Premium Bike"
  | "2W - Scooter";

export type PlanType =
  | "SHINE"
  | "PROTECT"
  | "ELITE"
  | "ELITE_2W"
  | "One-Time Member"
  | "One-Time Non-Member";

export interface PlanDeliverables {
  planName: string;
  tagline: string;
  included: string[];
  notIncluded: string[];
  bestFor: string;
  complimentaryBenefits?: string;
  discountStructure?: string;
}

export interface PlanVersion {
  version: string;
  versionLabel: string;
  effectiveFrom: string;
  effectiveTo: string | "Current";
  createdBy: string;
  createdOn: string;
  status: "Active" | "Superseded" | "Draft" | "Scheduled";
  goLiveDate?: string;
  pricingMatrix: Record<VehicleCategory, Record<PlanType, number | "NA">>;
  deliverables: Record<PlanType, PlanDeliverables>;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
  approvedBy?: string;
  approvedOn?: string;
  rejectionReason?: string;
}

// Add-On Services
export interface AddOnService {
  id: string;
  name: string;
  description: string;
  billing: "Per visit" | "Per month";
  pricing: {
    "4W": number | "NA";
    "2W": number | "NA";
  };
  bestPairedWith: PlanType[];
  estimatedMargin: number; // percentage
  isActive: boolean;
  icon?: string;
  category: "Cleaning" | "Protection" | "Maintenance";
}

// Combo Offers
export interface ComboOffer {
  id: string;
  name: string;
  description: string;
  planCombination: {
    vehicle1: {
      category: VehicleCategory;
      plan: PlanType;
      individualPrice: number;
    };
    vehicle2?: {
      category: VehicleCategory;
      plan: PlanType;
      individualPrice: number;
    };
  };
  totalIndividualPrice: number;
  comboPrice: number;
  savings: number;
  savingsPercentage: number;
  isActive: boolean;
  validUntil?: string;
}

// One-Time Wash Pricing
export interface OneTimeWashPricing {
  vehicleCategory: VehicleCategory;
  memberPrice: number;
  nonMemberPrice: number;
  washType: "Basic" | "Premium" | "Elite";
}

// V2 - Current Active Plan (April 2026) - New Structure
export const CURRENT_PLAN_VERSION: PlanVersion = {
  version: "V2",
  versionLabel: "V2 - April 2026 Plan Restructure",
  effectiveFrom: "2026-04-11",
  effectiveTo: "Current",
  createdBy: "Product Team",
  createdOn: "2026-04-11",
  status: "Active",
  pricingMatrix: {
    "Hatchback / Compact Sedan": {
      "SHINE": 1199,
      "PROTECT": 1599,
      "ELITE": 1999,
      "ELITE_2W": "NA",
      "One-Time Member": 250,
      "One-Time Non-Member": 299,
    },
    "SUV / MUV / Sedan": {
      "SHINE": 1499,
      "PROTECT": 1999,
      "ELITE": 2499,
      "ELITE_2W": "NA",
      "One-Time Member": 300,
      "One-Time Non-Member": 349,
    },
    "Luxury / Large SUV": {
      "SHINE": 1999,
      "PROTECT": 2699,
      "ELITE": 3499,
      "ELITE_2W": "NA",
      "One-Time Member": 400,
      "One-Time Non-Member": 449,
    },
    "2W - Standard / Commuter Bike": {
      "SHINE": 299,
      "PROTECT": 499,
      "ELITE": "NA",
      "ELITE_2W": 799,
      "One-Time Member": 120,
      "One-Time Non-Member": 149,
    },
    "2W - Sports / Premium Bike": {
      "SHINE": 399,
      "PROTECT": 699,
      "ELITE": "NA",
      "ELITE_2W": 999,
      "One-Time Member": 150,
      "One-Time Non-Member": 179,
    },
    "2W - Scooter": {
      "SHINE": "NA",
      "PROTECT": "NA",
      "ELITE": "NA",
      "ELITE_2W": 699,
      "One-Time Member": 100,
      "One-Time Non-Member": 129,
    },
  },
  deliverables: {
    "SHINE": {
      planName: "SHINE",
      tagline: "Essential Daily Cleaning. Perfect for routine maintenance.",
      included: [
        "Full exterior water rinse (pressure gun)",
        "Wheel rim rinse",
        "Tyre & mudguard pressure spray",
        "Roof + running boards / step-board clean",
        "Exterior glass wipe / clean",
        "Wiper blade clean",
        "Under-body water flush (monthly)",
      ],
      notIncluded: [
        "Car-safe shampoo foam wash",
        "Microfibre dry + glass polish",
        "Tyre dressing application",
        "Interior cleaning",
        "Wax protection",
      ],
      bestFor: "Daily basic maintenance and dust removal",
    },
    "PROTECT": {
      planName: "PROTECT",
      tagline: "Deep Cleaning with Foam Shampoo. Most popular choice.",
      included: [
        "Everything in Water Wash",
        "Car-safe shampoo foam wash",
        "Microfibre dry + glass polish",
        "Tyre dressing application (weekly)",
      ],
      notIncluded: [
        "Wax paint protection coating",
        "Interior dashboard wipe",
        "Interior vacuum",
      ],
      bestFor: "Regular professional cleaning with enhanced finish",
    },
    "ELITE": {
      planName: "ELITE",
      tagline: "Complete Care with Wax Protection. Premium exterior & interior service.",
      included: [
        "Everything in Shampoo Wash",
        "Interior dashboard wipe (weekly)",
        "Interior full vacuum (weekly)",
        "Interior vacuum deep clean (monthly)",
        "Full hand wax polish whole body (monthly)",
        "Door sill & boot area clean (monthly)",
      ],
      notIncluded: [
        "Ceramic coating",
        "Paint correction",
        "Leather conditioning",
      ],
      bestFor: "Complete vehicle care - exterior shine + interior cleanliness",
    },
    "ELITE_2W": {
      planName: "ELITE (2-Wheeler)",
      tagline: "Premium 2-Wheeler Care. Complete shine and protection for bikes and scooters.",
      included: [
        "Full body water rinse (pressure gun)",
        "Tyre & mudguard pressure spray",
        "Bike/scooter shampoo wash",
        "Chain & sprocket water rinse",
        "Seat + headlight / instrument wipe",
        "Full dry + microfibre wipe",
        "Spoke & rim scrub (weekly)",
        "Engine bay surface wipe (monthly)",
        "Full body spray wax / liquid polish (monthly)",
      ],
      notIncluded: [
        "Deep engine cleaning",
        "Chain lubrication",
        "Seat shampoo",
      ],
      bestFor: "2-Wheeler owners wanting complete care and protection",
    },
    "One-Time Member": {
      planName: "One-Time Wash (Member)",
      tagline: "Single wash service for existing subscription members",
      included: [
        "Full exterior shampoo wash",
        "Wheel cleaning & tyre dressing",
        "Microfibre dry",
        "Glass cleaning",
        "Member discount applied",
      ],
      notIncluded: [
        "Interior cleaning",
        "Wax application",
        "Subscription benefits",
      ],
      bestFor: "Subscription members needing additional one-time service",
      complimentaryBenefits: "10% discount on all add-on services",
    },
    "One-Time Non-Member": {
      planName: "One-Time Wash (Walk-in)",
      tagline: "Single wash service for walk-in customers",
      included: [
        "Full exterior shampoo wash",
        "Wheel cleaning",
        "Microfibre dry",
        "Glass cleaning",
      ],
      notIncluded: [
        "Interior cleaning",
        "Wax application",
        "Tyre dressing",
        "Member discounts",
      ],
      bestFor: "First-time customers or occasional wash needs",
      discountStructure: "Subscribe today and save up to 60% on per-wash cost",
    },
  },
};

// Add-On Services Data
// All add-ons carry 74-80% EBITDA margin (from EBITDA calculations)
export const ADD_ON_SERVICES: AddOnService[] = [
  {
    id: "addon-001",
    name: "Interior Deep Vacuum",
    description: "Thorough vacuum cleaning of seats, floor mats, and trunk area",
    billing: "Per visit",
    pricing: {
      "4W": 199,
      "2W": "NA",
    },
    bestPairedWith: ["SHINE", "PROTECT"],
    estimatedMargin: 77.9, // Actual EBITDA: ₹155/₹199 = 77.9%
    isActive: true,
    category: "Cleaning",
  },
  {
    id: "addon-002",
    name: "Dashboard Clean",
    description: "Complete dashboard, console, and door panel wipe & polish",
    billing: "Per visit",
    pricing: {
      "4W": 149,
      "2W": 99,
    },
    bestPairedWith: ["SHINE", "PROTECT"],
    estimatedMargin: 79.9, // Actual EBITDA: 4W ₹119/₹149 = 79.9%
    isActive: true,
    category: "Cleaning",
  },
  {
    id: "addon-003",
    name: "Tyre Dressing",
    description: "Professional tyre shine & rubber protection coating",
    billing: "Per visit",
    pricing: {
      "4W": 99,
      "2W": 49,
    },
    bestPairedWith: ["SHINE"],
    estimatedMargin: 79.8, // Actual EBITDA: ₹79/₹99 = 79.8%
    isActive: true,
    category: "Protection",
  },
  {
    id: "addon-004",
    name: "Glass Coating",
    description: "Hydrophobic glass coating (RainX) for improved visibility in rain",
    billing: "Per visit",
    pricing: {
      "4W": 349,
      "2W": 249,
    },
    bestPairedWith: ["PROTECT", "ELITE"],
    estimatedMargin: 77.1, // Actual EBITDA: ₹269/₹349 = 77.1%
    isActive: true,
    category: "Protection",
  },
  {
    id: "addon-005",
    name: "One-Time Wax Polish",
    description: "Full body hand wax application for showroom-like shine",
    billing: "Per visit",
    pricing: {
      "4W": 599,
      "2W": 399,
    },
    bestPairedWith: ["PROTECT"],
    estimatedMargin: 74.9, // Actual EBITDA: ₹449/₹599 = 74.9%
    isActive: true,
    category: "Protection",
  },
  {
    id: "addon-006",
    name: "Underbody Anti-Rust Spray",
    description: "High-pressure underbody cleaning & anti-rust protection spray",
    billing: "Per visit",
    pricing: {
      "4W": 799,
      "2W": "NA",
    },
    bestPairedWith: ["PROTECT", "ELITE"],
    estimatedMargin: 74.9, // Actual EBITDA: ₹599/₹799 = 74.9%
    isActive: false, // ⚠ PENDING OPERATIONAL CONFIRMATION
    category: "Maintenance",
  },
];

// Helper function to get dynamic combo offers with real-time pricing
function generateComboOffers(): ComboOffer[] {
  const getPriceFromMatrix = (category: VehicleCategory, plan: PlanType): number => {
    const price = CURRENT_PLAN_VERSION.pricingMatrix[category][plan];
    return price === "NA" ? 0 : price as number;
  };

  const hatchbackShampoo = getPriceFromMatrix("Hatchback / Compact Sedan", "PROTECT");
  const hatchbackWax = getPriceFromMatrix("Hatchback / Compact Sedan", "ELITE");
  const suvShampoo = getPriceFromMatrix("SUV / MUV / Sedan", "PROTECT");
  const suvWax = getPriceFromMatrix("SUV / MUV / Sedan", "ELITE");
  const bikePolish = getPriceFromMatrix("2W - Standard / Commuter Bike", "ELITE");

  const combo1Total = hatchbackShampoo + bikePolish;
  const combo1Price = Math.round(combo1Total * 0.905); // 9.5% discount

  const combo2Total = suvShampoo + hatchbackShampoo;
  const combo2Price = Math.round(combo2Total * 0.90); // 10% discount

  const combo3Total = hatchbackWax + (199 * 4); // Interior vacuum 4x/month
  const combo3Price = Math.round(combo3Total * 0.894); // ~10.6% discount

  const combo4Total = suvWax + 349; // Glass coating monthly
  const combo4Price = Math.round(combo4Total * 0.951); // ~4.9% discount

  const combo5Total = hatchbackShampoo * 5;
  const combo5Price = Math.round(combo5Total * 0.90); // 10% discount

  const combo6Total = suvShampoo * 10;
  const combo6Price = Math.round(combo6Total * 0.853); // 14.7% discount

  return [
    {
      id: "combo-001",
      name: "Car + Bike Bundle",
      description: "Subscribe to both car and bike plans at discounted rates",
      planCombination: {
        vehicle1: {
          category: "Hatchback / Compact Sedan",
          plan: "PROTECT",
          individualPrice: hatchbackShampoo,
        },
        vehicle2: {
          category: "2W - Standard / Commuter Bike",
          plan: "ELITE",
          individualPrice: bikePolish,
        },
      },
      totalIndividualPrice: combo1Total,
      comboPrice: combo1Price,
      savings: combo1Total - combo1Price,
      savingsPercentage: parseFloat((((combo1Total - combo1Price) / combo1Total) * 100).toFixed(1)),
      isActive: true,
    },
    {
      id: "combo-002",
      name: "Dual Car Bundle",
      description: "Two cars, one subscription - save on your second vehicle",
      planCombination: {
        vehicle1: {
          category: "SUV / MUV / Sedan",
          plan: "PROTECT",
          individualPrice: suvShampoo,
        },
        vehicle2: {
          category: "Hatchback / Compact Sedan",
          plan: "PROTECT",
          individualPrice: hatchbackShampoo,
        },
      },
      totalIndividualPrice: combo2Total,
      comboPrice: combo2Price,
      savings: combo2Total - combo2Price,
      savingsPercentage: parseFloat((((combo2Total - combo2Price) / combo2Total) * 100).toFixed(1)),
      isActive: true,
    },
    {
      id: "combo-003",
      name: "Premium Care Pack - Hatchback",
      description: "Shampoo+Wax plan + Interior Deep Vacuum (weekly)",
      planCombination: {
        vehicle1: {
          category: "Hatchback / Compact Sedan",
          plan: "ELITE",
          individualPrice: hatchbackWax,
        },
      },
      totalIndividualPrice: combo3Total,
      comboPrice: combo3Price,
      savings: combo3Total - combo3Price,
      savingsPercentage: parseFloat((((combo3Total - combo3Price) / combo3Total) * 100).toFixed(1)),
      isActive: true,
    },
    {
      id: "combo-004",
      name: "Premium Care Pack - SUV",
      description: "Shampoo+Wax plan + Glass Coating (monthly)",
      planCombination: {
        vehicle1: {
          category: "SUV / MUV / Sedan",
          plan: "ELITE",
          individualPrice: suvWax,
        },
      },
      totalIndividualPrice: combo4Total,
      comboPrice: combo4Price,
      savings: combo4Total - combo4Price,
      savingsPercentage: parseFloat((((combo4Total - combo4Price) / combo4Total) * 100).toFixed(1)),
      isActive: true,
    },
    {
      id: "combo-005",
      name: "Society Package - 5 Cars",
      description: "Bulk subscription for housing societies - minimum 5 vehicles",
      planCombination: {
        vehicle1: {
          category: "Hatchback / Compact Sedan",
          plan: "PROTECT",
          individualPrice: combo5Total,
        },
      },
      totalIndividualPrice: combo5Total,
      comboPrice: combo5Price,
      savings: combo5Total - combo5Price,
      savingsPercentage: parseFloat((((combo5Total - combo5Price) / combo5Total) * 100).toFixed(1)),
      isActive: true,
    },
    {
      id: "combo-006",
      name: "Fleet Package - 10+ Vehicles",
      description: "Corporate fleet discount - customize your plan mix",
      planCombination: {
        vehicle1: {
          category: "SUV / MUV / Sedan",
          plan: "PROTECT",
          individualPrice: combo6Total,
        },
      },
      totalIndividualPrice: combo6Total,
      comboPrice: combo6Price,
      savings: combo6Total - combo6Price,
      savingsPercentage: parseFloat((((combo6Total - combo6Price) / combo6Total) * 100).toFixed(1)),
      isActive: true,
      validUntil: "2026-12-31",
    },
  ];
}

// Combo Offers Data - Generated dynamically from pricing matrix
export const COMBO_OFFERS: ComboOffer[] = generateComboOffers();

// One-Time Wash Pricing Data
export const ONE_TIME_WASH_PRICING: OneTimeWashPricing[] = [
  // Basic One-Time Wash
  {
    vehicleCategory: "Hatchback / Compact Sedan",
    memberPrice: 150,
    nonMemberPrice: 199,
    washType: "Basic",
  },
  {
    vehicleCategory: "SUV / MUV / Sedan",
    memberPrice: 200,
    nonMemberPrice: 249,
    washType: "Basic",
  },
  {
    vehicleCategory: "Luxury / Large SUV",
    memberPrice: 250,
    nonMemberPrice: 299,
    washType: "Basic",
  },
  {
    vehicleCategory: "2W - Standard / Commuter Bike",
    memberPrice: 80,
    nonMemberPrice: 99,
    washType: "Basic",
  },
  {
    vehicleCategory: "2W - Sports / Premium Bike",
    memberPrice: 100,
    nonMemberPrice: 129,
    washType: "Basic",
  },
  {
    vehicleCategory: "2W - Scooter",
    memberPrice: 70,
    nonMemberPrice: 89,
    washType: "Basic",
  },
  // Premium One-Time Wash (with shampoo)
  {
    vehicleCategory: "Hatchback / Compact Sedan",
    memberPrice: 250,
    nonMemberPrice: 299,
    washType: "Premium",
  },
  {
    vehicleCategory: "SUV / MUV / Sedan",
    memberPrice: 300,
    nonMemberPrice: 349,
    washType: "Premium",
  },
  {
    vehicleCategory: "Luxury / Large SUV",
    memberPrice: 400,
    nonMemberPrice: 449,
    washType: "Premium",
  },
  {
    vehicleCategory: "2W - Standard / Commuter Bike",
    memberPrice: 120,
    nonMemberPrice: 149,
    washType: "Premium",
  },
  {
    vehicleCategory: "2W - Sports / Premium Bike",
    memberPrice: 150,
    nonMemberPrice: 179,
    washType: "Premium",
  },
  {
    vehicleCategory: "2W - Scooter",
    memberPrice: 100,
    nonMemberPrice: 129,
    washType: "Premium",
  },
  // Elite One-Time Wash (with shampoo + wax)
  {
    vehicleCategory: "Hatchback / Compact Sedan",
    memberPrice: 450,
    nonMemberPrice: 549,
    washType: "Elite",
  },
  {
    vehicleCategory: "SUV / MUV / Sedan",
    memberPrice: 550,
    nonMemberPrice: 649,
    washType: "Elite",
  },
  {
    vehicleCategory: "Luxury / Large SUV",
    memberPrice: 700,
    nonMemberPrice: 799,
    washType: "Elite",
  },
  {
    vehicleCategory: "2W - Standard / Commuter Bike",
    memberPrice: 200,
    nonMemberPrice: 249,
    washType: "Elite",
  },
  {
    vehicleCategory: "2W - Sports / Premium Bike",
    memberPrice: 250,
    nonMemberPrice: 299,
    washType: "Elite",
  },
  {
    vehicleCategory: "2W - Scooter",
    memberPrice: 180,
    nonMemberPrice: 229,
    washType: "Elite",
  },
];

// All Plan Versions (includes current and historical)
export const ALL_PLAN_VERSIONS: PlanVersion[] = [CURRENT_PLAN_VERSION];

// Helper function to get plan price
export function getPlanPrice(
  version: PlanVersion,
  vehicleCategory: VehicleCategory,
  planType: PlanType
): number | "NA" {
  return version.pricingMatrix[vehicleCategory][planType];
}

// Helper function to format price
export function formatPrice(price: number | "NA"): string {
  if (price === "NA") return "NA";
  return `₹${price.toLocaleString("en-IN")}`;
}

// Helper function to get active plan version
export function getActivePlanVersion(): PlanVersion {
  return ALL_PLAN_VERSIONS.find((v) => v.status === "Active") || CURRENT_PLAN_VERSION;
}

// Helper function to get previous plan version (for TSM/TSE)
export function getPreviousPlanVersion(): PlanVersion | null {
  const sortedVersions = [...ALL_PLAN_VERSIONS]
    .filter((v) => v.status === "Superseded")
    .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());

  return sortedVersions[0] || null;
}

// Vehicle categories list
export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  "Hatchback / Compact Sedan",
  "SUV / MUV / Sedan",
  "Luxury / Large SUV",
  "2W - Standard / Commuter Bike",
  "2W - Sports / Premium Bike",
  "2W - Scooter",
];

// Plan types list
export const PLAN_TYPES: PlanType[] = [
  "SHINE",
  "PROTECT",
  "ELITE",
  "ELITE_2W",
  "One-Time Member",
  "One-Time Non-Member",
];

// Subscription plans (all plans in new structure)
export const SUBSCRIPTION_PLANS: PlanType[] = [
  "SHINE",
  "PROTECT",
  "ELITE",
  "ELITE_2W",
];

// Vehicle examples for each category
export const VEHICLE_EXAMPLES: Record<VehicleCategory, string[]> = {
  "Hatchback / Compact Sedan": ["Swift", "i20", "Baleno", "Dzire", "Tiago"],
  "SUV / MUV / Sedan": ["Creta", "Innova", "City", "Thar", "Ertiga"],
  "Luxury / Large SUV": ["Fortuner", "XUV700", "Meridian", "Scorpio N"],
  "2W - Standard / Commuter Bike": ["Splendor", "Passion", "CT100", "HF Deluxe"],
  "2W - Sports / Premium Bike": ["Pulsar", "Apache", "Dominar", "Duke", "R15"],
  "2W - Scooter": ["Activa", "Jupiter", "Dio", "NTorq", "Burgman"],
};

// ============================================================
// SERVICE COMPATIBILITY LAYER
// Single source of truth for subscriptionPlansService.
// These replace the equivalent exports from
// constants/subscriptionPlans.constants.ts which is now
// deprecated for all plan-data concerns.
// ============================================================

/** Standard number of washes per month */
export const WASHES_PER_MONTH = 26;

/** Currency */
export const CURRENCY = "INR" as const;
export const CURRENCY_SYMBOL = "₹";

/** Billing duration discount rates */
export const DEFAULT_DURATION_DISCOUNTS = {
  MONTHLY:     0,
  QUARTERLY:   5,
  HALF_YEARLY: 10,
  NINE_MONTHS: 12,
  ANNUAL:      15,
} as const;

/** Billing duration configs — used by subscriptionPlansService.calculateDurationPrices() */
export const BILLING_DURATIONS = [
  { type: "MONTHLY"     as const, label: "Monthly",     months: 1,  discountPercent: DEFAULT_DURATION_DISCOUNTS.MONTHLY },
  { type: "QUARTERLY"   as const, label: "Quarterly",   months: 3,  discountPercent: DEFAULT_DURATION_DISCOUNTS.QUARTERLY },
  { type: "HALF_YEARLY" as const, label: "Half-Yearly", months: 6,  discountPercent: DEFAULT_DURATION_DISCOUNTS.HALF_YEARLY },
  { type: "NINE_MONTHS" as const, label: "9 Months",    months: 9,  discountPercent: DEFAULT_DURATION_DISCOUNTS.NINE_MONTHS },
  { type: "ANNUAL"      as const, label: "Annual",      months: 12, discountPercent: DEFAULT_DURATION_DISCOUNTS.ANNUAL },
] as const;

/**
 * Plan tier display names — single source of truth.
 * Maps the new SHINE/PROTECT/ELITE naming to human-readable labels.
 * WATER_WASH / SHAMPOO_WASH / SHAMPOO_WAX keys are retired — do not add back.
 */
export const PLAN_TIER_NAMES = {
  SHINE:    "SHINE — Chamakti Subah",
  PROTECT:  "PROTECT — Raksha Plan",
  ELITE:    "ELITE — Raja Seva",
  ELITE_2W: "ELITE (2-Wheeler)",
} as const;

/**
 * Vehicle category configs — used by subscriptionPlansService.getVehicleCategories().
 * Keys match VehicleCategoryName in types/subscriptionPlans.types.ts.
 */
export const VEHICLE_CATEGORIES_CONFIG = {
  HATCHBACK_COMPACT_SEDAN: {
    displayName: "Hatchback / Compact Sedan",
    examples:    ["Swift", "i20", "Baleno", "Dzire", "Tiago"],
    type:        "4W" as const,
  },
  SUV_MUV_SEDAN: {
    displayName: "SUV / MUV / Sedan",
    examples:    ["Creta", "Innova", "City", "Thar", "Ertiga"],
    type:        "4W" as const,
  },
  LUXURY_LARGE_SUV: {
    displayName: "Luxury / Large SUV",
    examples:    ["Fortuner", "XUV700", "Meridian", "Scorpio N"],
    type:        "4W" as const,
  },
  STANDARD_COMMUTER_BIKE: {
    displayName: "Standard / Commuter Bike",
    examples:    ["Splendor", "Passion", "CT100", "HF Deluxe"],
    type:        "2W" as const,
  },
  SPORTS_PREMIUM_BIKE: {
    displayName: "Sports / Premium Bike",
    examples:    ["Pulsar", "Apache", "Dominar", "Duke", "R15"],
    type:        "2W" as const,
  },
  SCOOTER: {
    displayName: "Scooter",
    examples:    ["Activa", "Jupiter", "Dio", "NTorq", "Burgman"],
    type:        "2W" as const,
  },
} as const;

/**
 * Plan base prices — derived from CURRENT_PLAN_VERSION.pricingMatrix so there
 * is exactly one place where prices are defined.
 * subscriptionPlansService reads this instead of the old constants file.
 */
export const PLAN_BASE_PRICES = {
  HATCHBACK_COMPACT_SEDAN: {
    SHINE:    CURRENT_PLAN_VERSION.pricingMatrix["Hatchback / Compact Sedan"]["SHINE"],
    PROTECT:  CURRENT_PLAN_VERSION.pricingMatrix["Hatchback / Compact Sedan"]["PROTECT"],
    ELITE:    CURRENT_PLAN_VERSION.pricingMatrix["Hatchback / Compact Sedan"]["ELITE"],
  },
  SUV_MUV_SEDAN: {
    SHINE:    CURRENT_PLAN_VERSION.pricingMatrix["SUV / MUV / Sedan"]["SHINE"],
    PROTECT:  CURRENT_PLAN_VERSION.pricingMatrix["SUV / MUV / Sedan"]["PROTECT"],
    ELITE:    CURRENT_PLAN_VERSION.pricingMatrix["SUV / MUV / Sedan"]["ELITE"],
  },
  LUXURY_LARGE_SUV: {
    SHINE:    CURRENT_PLAN_VERSION.pricingMatrix["Luxury / Large SUV"]["SHINE"],
    PROTECT:  CURRENT_PLAN_VERSION.pricingMatrix["Luxury / Large SUV"]["PROTECT"],
    ELITE:    CURRENT_PLAN_VERSION.pricingMatrix["Luxury / Large SUV"]["ELITE"],
  },
  STANDARD_COMMUTER_BIKE: {
    SHINE:    CURRENT_PLAN_VERSION.pricingMatrix["2W - Standard / Commuter Bike"]["SHINE"],
    PROTECT:  CURRENT_PLAN_VERSION.pricingMatrix["2W - Standard / Commuter Bike"]["PROTECT"],
    ELITE_2W: CURRENT_PLAN_VERSION.pricingMatrix["2W - Standard / Commuter Bike"]["ELITE_2W"],
  },
  SPORTS_PREMIUM_BIKE: {
    SHINE:    CURRENT_PLAN_VERSION.pricingMatrix["2W - Sports / Premium Bike"]["SHINE"],
    PROTECT:  CURRENT_PLAN_VERSION.pricingMatrix["2W - Sports / Premium Bike"]["PROTECT"],
    ELITE_2W: CURRENT_PLAN_VERSION.pricingMatrix["2W - Sports / Premium Bike"]["ELITE_2W"],
  },
  SCOOTER: {
    ELITE_2W: CURRENT_PLAN_VERSION.pricingMatrix["2W - Scooter"]["ELITE_2W"],
  },
} as const;

/**
 * Add-on services — re-exported under the name subscriptionPlansService expects.
 * ADD_ON_SERVICES is the canonical list; ADDON_SERVICES_COMPAT is the alias.
 * subscriptionPlansService imports ADDON_SERVICES — point it here.
 */
export const ADDON_SERVICES = ADD_ON_SERVICES.map(a => ({
  ...a,
  billingType:               a.billing === "Per visit" ? "PER_VISIT" as const : "PER_MONTH" as const,
  isOperationallyConfirmed:  a.isActive,
  price:                     typeof a.pricing["4W"] === "number" ? a.pricing["4W"] as number : 0,
  bestPairedWith:            a.bestPairedWith as string[],
}));

/**
 * Combo offers — re-exported for subscriptionPlansService compat.
 * Uses the dynamically generated COMBO_OFFERS from this file (already live).
 */
 // COMBO_OFFERS already exported above
/** Validation constants */
export const MIN_BASE_PRICE      = 100;
export const MAX_BASE_PRICE      = 10000;
export const MIN_DISCOUNT_PERCENT = 0;
export const MAX_DISCOUNT_PERCENT = 50;
export const MIN_MARGIN_PERCENT   = 0;
export const MAX_MARGIN_PERCENT   = 100;

/** UI constants — display only, no plan data */
export const BEST_VALUE_BADGE = "Best Value";
export const PLANS_PER_ROW    = 3;

export const PLAN_TIER_COLORS = {
  SHINE:    { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700"   },
  PROTECT:  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  ELITE:    { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700"  },
  ELITE_2W: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700"  },
} as const;

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    canCreatePlan: true,  canEditPlan: true,  canEditPricing: true,
    canEditFeatures: true, canEditDurationDiscounts: true,
    canDisablePlan: true, canDeletePlan: true,
    canManageAddons: true, canManageCombos: true, canViewAuditLog: true,
  },
  ADMIN: {
    canCreatePlan: true,  canEditPlan: true,  canEditPricing: true,
    canEditFeatures: true, canEditDurationDiscounts: false,
    canDisablePlan: true, canDeletePlan: false,
    canManageAddons: true, canManageCombos: true, canViewAuditLog: true,
  },
  MANAGER: {
    canCreatePlan: false, canEditPlan: false, canEditPricing: false,
    canEditFeatures: false, canEditDurationDiscounts: false,
    canDisablePlan: false, canDeletePlan: false,
    canManageAddons: false, canManageCombos: false, canViewAuditLog: false,
  },
  VIEWER: {
    canCreatePlan: false, canEditPlan: false, canEditPricing: false,
    canEditFeatures: false, canEditDurationDiscounts: false,
    canDisablePlan: false, canDeletePlan: false,
    canManageAddons: false, canManageCombos: false, canViewAuditLog: false,
  },
} as const;

export const SERVICE_FREQUENCIES = {
  EVERY_WASH: "Every Wash (Daily)",
  WEEKLY:     "Weekly (1x per week)",
  MONTHLY:    "Monthly (1x per month)",
} as const;

export function calculateCostPerWash(monthlyPrice: number): number {
  return monthlyPrice / WASHES_PER_MONTH;
}

// Add-On Helper Functions
export function getAddOnById(id: string): AddOnService | undefined {
  return ADD_ON_SERVICES.find(addon => addon.id === id);
}

export function getAddOnsByCategory(category: "Cleaning" | "Protection" | "Maintenance"): AddOnService[] {
  return ADD_ON_SERVICES.filter(addon => addon.category === category && addon.isActive);
}

export function getAddOnsForPlan(planType: PlanType): AddOnService[] {
  return ADD_ON_SERVICES.filter(addon =>
    addon.isActive && addon.bestPairedWith.includes(planType)
  );
}

export function getAddOnPrice(addonId: string, vehicleType: "4W" | "2W"): number | "NA" {
  const addon = getAddOnById(addonId);
  return addon ? addon.pricing[vehicleType] : "NA";
}

// Combo Offer Helper Functions
export function getComboById(id: string): ComboOffer | undefined {
  return COMBO_OFFERS.find(combo => combo.id === id);
}

export function getActiveComboOffers(): ComboOffer[] {
  return COMBO_OFFERS.filter(combo => combo.isActive);
}

export function getCombosByVehicleCategory(category: VehicleCategory): ComboOffer[] {
  return COMBO_OFFERS.filter(combo =>
    combo.isActive &&
    (combo.planCombination.vehicle1.category === category ||
     combo.planCombination.vehicle2?.category === category)
  );
}

// One-Time Wash Helper Functions
export function getOneTimeWashPrice(
  vehicleCategory: VehicleCategory,
  washType: "Basic" | "Premium" | "Elite",
  isMember: boolean
): number {
  const pricing = ONE_TIME_WASH_PRICING.find(
    p => p.vehicleCategory === vehicleCategory && p.washType === washType
  );

  if (!pricing) return 0;
  return isMember ? pricing.memberPrice : pricing.nonMemberPrice;
}

export function getAllOneTimeWashOptions(vehicleCategory: VehicleCategory): OneTimeWashPricing[] {
  return ONE_TIME_WASH_PRICING.filter(p => p.vehicleCategory === vehicleCategory);
}

// Pricing Summary Helper
export function getPricingSummary(vehicleCategory: VehicleCategory) {
  const activePlan = getActivePlanVersion();
  const subscriptionPrices = PLAN_TYPES.filter(
    plan => !plan.includes("One-Time")
  ).map(plan => ({
    plan,
    price: getPlanPrice(activePlan, vehicleCategory, plan),
  }));

  const oneTimeWashes = getAllOneTimeWashOptions(vehicleCategory);
  const recommendedAddOns = ADD_ON_SERVICES.filter(addon => addon.isActive).slice(0, 3);

  return {
    subscriptionPrices,
    oneTimeWashes,
    recommendedAddOns,
  };
}
