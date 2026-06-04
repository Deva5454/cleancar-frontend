// Subscription Plans Data — Package Architecture v1.8 (June 2026)
// Source of truth: 249_Package_Architecture_v1_8_Final.docx
// Updated: June 2026 — aligns with SHINE/PROTECT/Elite Wash plan structure

export type VehicleCategory =
  | "Hatchback / Compact Sedan"
  | "SUV / MUV / Sedan"
  | "Luxury / Large SUV"
  | "2W - Standard / Commuter Bike"
  | "2W - Sports / Premium Bike"
  | "2W - Scooter";

export type PlanType =
  | "EXPRESS_WASH"
  | "SMART_WASH"
  | "ELITE_WASH"
  | "ELITE_2W"
  | "One-Time Member"
  | "One-Time Non-Member";

export interface PlanDeliverables {
  planName: string;
  tagline: string;
  included: string[];
  periodicServices: string[];   // services beyond daily wash
  notIncluded: string[];
  bestFor: string;
  consumableCostPerWash: number; // ₹/wash — from package architecture
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

export interface AddOnService {
  id: string;
  name: string;
  description: string;
  billing: "Per visit" | "Per month";
  pricing: {
    hatchback: number | "NA";
    suv:       number | "NA";
    luxury:    number | "NA";
    twoW:      number | "NA";
  };
  bestPairedWith: PlanType[];
  estimatedMargin: number; // percentage
  isActive: boolean;
  icon?: string;
  category: "Cleaning" | "Protection" | "Maintenance";
}

export interface ComboOffer {
  id: string;
  name: string;
  description: string;
  hatchbackPrice: number;
  suvPrice: number;
  saving: string;
  whenToPush: string;
  isActive: boolean;
}

export interface OneTimeWashPricing {
  vehicleCategory: VehicleCategory;
  memberPrice: number;
  nonMemberPrice: number;
  washType: "EXPRESS_WASH" | "Premium" | "Elite";
}

// ─────────────────────────────────────────────────────────────────────────────
// V3 — June 2026 — Package Architecture v1.8
// ─────────────────────────────────────────────────────────────────────────────
export const CURRENT_PLAN_VERSION: PlanVersion = {
  version: "V3",
  versionLabel: "V3 - June 2026 Package Architecture v1.8",
  effectiveFrom: "2026-06-01",
  effectiveTo: "Current",
  createdBy: "Product Team",
  createdOn: "2026-06-01",
  status: "Active",

  // ── PRICING MATRIX ─────────────────────────────────────────────────────────
  pricingMatrix: {
    "Hatchback / Compact Sedan": {
      "EXPRESS_WASH":                1249,   // ₹42/wash
      "SMART_WASH":              1599,   // ₹53/wash
      "ELITE_WASH":                1999,   // ₹67/wash
      "ELITE_2W":             "NA",
      "One-Time Member":       250,
      "One-Time Non-Member":   299,
    },
    "SUV / MUV / Sedan": {
      "EXPRESS_WASH":                1499,   // ₹50/wash
      "SMART_WASH":              1999,   // ₹67/wash
      "ELITE_WASH":                2499,   // ₹83/wash
      "ELITE_2W":             "NA",
      "One-Time Member":       300,
      "One-Time Non-Member":   349,
    },
    "Luxury / Large SUV": {
      "EXPRESS_WASH":                1999,   // ₹67/wash
      "SMART_WASH":              2699,   // ₹90/wash
      "ELITE_WASH":                3499,   // ₹117/wash
      "ELITE_2W":             "NA",
      "One-Time Member":       400,
      "One-Time Non-Member":   449,
    },
    "2W - Standard / Commuter Bike": {
      "EXPRESS_WASH":                 299,
      "SMART_WASH":               499,
      "ELITE_WASH":                "NA",
      "ELITE_2W":              799,
      "One-Time Member":       120,
      "One-Time Non-Member":   149,
    },
    "2W - Sports / Premium Bike": {
      "EXPRESS_WASH":                 399,
      "SMART_WASH":               699,
      "ELITE_WASH":                "NA",
      "ELITE_2W":              999,
      "One-Time Member":       150,
      "One-Time Non-Member":   179,
    },
    "2W - Scooter": {
      "EXPRESS_WASH":                "NA",
      "SMART_WASH":              "NA",
      "ELITE_WASH":                "NA",
      "ELITE_2W":              699,
      "One-Time Member":       100,
      "One-Time Non-Member":   129,
    },
  },

  // ── PLAN DELIVERABLES ───────────────────────────────────────────────────────
  deliverables: {

    "EXPRESS_WASH": {
      planName: "EXPRESS_WASH",
      tagline: "Chamakti Subah — Your car, clean every morning.",
      consumableCostPerWash: 8,
      included: [
        // DAILY (30×/month)
        "Full exterior water spray + microfibre dry",
        "Mirrors + door handles + number plate wiped clean",
        "Dedicated named washer — same person every morning",
        "Before-and-after WhatsApp photo sent daily",
        // WEEKLY (4×/month)
        "All 4 tyres and rims rinsed + rim wiped — every week",
      ],
      periodicServices: [
        // MONTHLY (1×/month)
        "Underbody flush — 1×/month",
        "Windshield clean (outside only) — 1×/month",
        "Shampoo Wash — 1×/month",
      ],
      notIncluded: [
        "Interior cleaning or vacuuming",
        "Tyre dressing / shine coat application",
        "Dashboard or console wipe",
        "Hand wax polish",
        "Engine bay clean",
      ],
      bestFor: "Daily basic maintenance. Entry plan. Recover to this if customer says Smart Wash is too expensive.",
    },

    "SMART_WASH": {
      planName: "SMART_WASH",
      tagline: "Raksha Plan — Clean daily. Protected always.",
      consumableCostPerWash: 17,
      included: [
        // DAILY (30×/month) — everything in SHINE
        "Everything in SHINE — full daily exterior wash + WhatsApp photo",
        "Dedicated named washer — same person every morning",
        // WEEKLY (4×/month) — inherited from Express Wash
        "Weekly tyre & rim spray-clean (inherited from Express Wash)",
      ],
      periodicServices: [
        // FORTNIGHTLY (2×/month)
        "Interior vacuum & mat clean — 2×/month (fortnightly)",
        "Shampoo Wash — 2×/month (fortnightly, replaces Express Wash's 1×/month)",
        // MONTHLY (1×/month)
        "Car fragrance — 1×/month",
        "Tyre Dressing & Shine Coat (all 4 tyres) — 1×/month",
      ],
      notIncluded: [
        "Dashboard or console detail",
        "Hand wax polish",
        "Engine bay clean",
      ],
      bestFor: "Default recommendation for every new subscriber. Never open with Express Wash — PROTECT is the opening offer.",
    },

    "ELITE_WASH": {
      planName: "ELITE_WASH",
      tagline: "Raja Seva — Showroom condition, every day.",
      consumableCostPerWash: 24,
      included: [
        // DAILY (30×/month) — everything in Smart Wash
        "Everything in Smart Wash — daily wash + interior vacuum 2×/month + fragrance",
        "Dedicated named washer — same person every morning",
        // WEEKLY (4×/month) — tyre spray inherited
        "Weekly tyre & rim spray-clean (inherited from Express Wash)",
      ],
      periodicServices: [
        // WEEKLY (4×/month)
        "Shampoo Wash — 4×/month (weekly, replaces Smart Wash's 2×/month)",
        // FORTNIGHTLY (2×/month)
        "Dashboard & console deep clean — 2×/month (fortnightly)",
        "Interior vacuum & mat clean — 2×/month (fortnightly, same as Smart Wash)",
        "Tyre Dressing & Shine Coat — 2×/month (fortnightly, vs Smart Wash's 1×/month)",
        // MONTHLY (1×/month)
        "Full hand wax polish (outer body only, no glass) — 1×/month",
        "Engine bay dry blow (strictly no water) — 1×/month",
        "Premium car fragrance + cabin sanitisation spray — 1×/month",
      ],
      notIncluded: [
        "Ceramic coating",
        "Paint correction",
        "Leather conditioning",
        "Underbody Anti-Rust (charged separately — pre-monsoon upsell)",
      ],
      bestFor: "Luxury cars, gated society residents, senior executives. First offer for premium segment.",
    },

    "ELITE_2W": {
      planName: "ELITE (2-Wheeler)",
      tagline: "Premium 2-Wheeler Care.",
      consumableCostPerWash: 12,
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
      periodicServices: [
        "Shampoo Wash — 2×/month",
      ],
      notIncluded: [
        "Deep engine cleaning",
        "Chain lubrication",
        "Seat shampoo",
      ],
      bestFor: "2-Wheeler owners wanting complete care and protection.",
    },

    "One-Time Member": {
      planName: "One-Time Wash (Member)",
      tagline: "Additional wash for existing subscribers.",
      consumableCostPerWash: 12,
      included: [
        "Full exterior shampoo wash",
        "Wheel cleaning + tyre dressing",
        "Microfibre dry",
        "Glass cleaning (outside)",
        "Member discount applied",
      ],
      periodicServices: [],
      notIncluded: ["Interior cleaning", "Wax application"],
      bestFor: "Subscription members needing an extra wash outside their plan.",
      complimentaryBenefits: "10% discount on all add-on services",
    },

    "One-Time Non-Member": {
      planName: "One-Time Wash (Walk-in)",
      tagline: "Single wash — always end with a subscription pitch.",
      consumableCostPerWash: 12,
      included: [
        "Full exterior shampoo wash",
        "Wheel cleaning",
        "Microfibre dry",
        "Glass cleaning (outside)",
      ],
      periodicServices: [],
      notIncluded: ["Interior cleaning", "Wax application", "Tyre dressing"],
      bestFor: "Walk-in or first-time customers. Pitch: 'You paid ₹199 for one wash — Express Wash is ₹1,249 for 30 washes, ₹42 each.'",
      discountStructure: "Subscribe today — save up to 60% per wash vs one-time price.",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ADD-ON SERVICES — Package Architecture v1.8 §4.1
// Prices are vehicle-category specific (not a single "4W" price).
// ─────────────────────────────────────────────────────────────────────────────
export const ADD_ON_SERVICES: AddOnService[] = [
  {
    id: "addon-001",
    name: "Interior Deep Vacuum",
    description: "Glove box, cooling box, glass holder, door pad polish, seat cover pockets, seats, mats, foot wells, boot. Before/after photo. Leather/resin seat cover polish included.",
    billing: "Per visit",
    pricing: { hatchback: 199, suv: 249, luxury: 349, twoW: "NA" },
    bestPairedWith: ["EXPRESS_WASH", "SMART_WASH"],
    estimatedMargin: 78,
    isActive: true,
    icon: "🪣",
    category: "Cleaning",
  },
  {
    id: "addon-002",
    name: "Dashboard & Console Detail",
    description: "Dashboard polish, console polish, door pads cleaning and polish, console and vents cleaning by blower.",
    billing: "Per visit",
    pricing: { hatchback: 149, suv: 199, luxury: 249, twoW: "NA" },
    bestPairedWith: ["EXPRESS_WASH", "SMART_WASH"],
    estimatedMargin: 80,
    isActive: true,
    icon: "🧹",
    category: "Cleaning",
  },
  {
    id: "addon-003",
    name: "Tyre Dressing (all 4 tyres)",
    description: "Shampoo wash tyre and mudguard + Shine Protect application to all 4 tyre sidewalls.",
    billing: "Per visit",
    pricing: { hatchback: 99, suv: 149, luxury: 199, twoW: 49 },
    bestPairedWith: ["EXPRESS_WASH"],
    estimatedMargin: 80,
    isActive: true,
    icon: "🛞",
    category: "Protection",
  },
  {
    id: "addon-004",
    name: "Full Hand Wax Polish",
    description: "Shampoo wash + full body panel-by-panel hand wax application. Outer body only — no glass. Elite Wash subscribers get this included monthly.",
    billing: "Per visit",
    pricing: { hatchback: 199, suv: 249, luxury: 399, twoW: "NA" },
    bestPairedWith: ["EXPRESS_WASH", "SMART_WASH"],
    estimatedMargin: 75,
    isActive: true,
    icon: "✨",
    category: "Protection",
  },
  {
    id: "addon-005",
    name: "Underbody Wash",
    description: "Underbody water spray — removes road grime and debris from undercarriage.",
    billing: "Per visit",
    pricing: { hatchback: 199, suv: 249, luxury: 349, twoW: "NA" },
    bestPairedWith: ["EXPRESS_WASH", "SMART_WASH", "ELITE_WASH"],
    estimatedMargin: 78,
    isActive: true,
    icon: "💧",
    category: "Maintenance",
  },
  {
    id: "addon-006",
    name: "Engine Bay Wipe-Down",
    description: "Dry blow of engine bay — no water. Removes dust and debris. Strictly dry process only.",
    billing: "Per visit",
    pricing: { hatchback: 99, suv: 149, luxury: 199, twoW: "NA" },
    bestPairedWith: ["SMART_WASH", "ELITE_WASH"],
    estimatedMargin: 82,
    isActive: true,
    icon: "⚙️",
    category: "Maintenance",
  },
  {
    id: "addon-007",
    name: "Car Fragrance",
    description: "Interior car fragrance spray — single fresh application. Also included monthly in Smart Wash and Elite Wash plans.",
    billing: "Per visit",
    pricing: { hatchback: 49, suv: 49, luxury: 49, twoW: "NA" },
    bestPairedWith: ["EXPRESS_WASH"],
    estimatedMargin: 76,
    isActive: true,
    icon: "🌸",
    category: "Cleaning",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMBO BUNDLE OFFERS — Package Architecture v1.8 §4.3
// ─────────────────────────────────────────────────────────────────────────────
export const COMBO_OFFERS: ComboOffer[] = [
  {
    id: "combo-001",
    name: "Andar Se Sundar",
    description: "Interior Deep Vacuum + Dashboard & Console Detail",
    hatchbackPrice: 299, // save ₹49 vs ₹199+₹149=₹348
    suvPrice: 399,       // save ₹49 vs ₹249+₹199=₹448
    saving: "Save ₹49",
    whenToPush: "Any time. Push at month 1 for all Express Wash subscribers.",
    isActive: true,
  },
  {
    id: "combo-002",
    name: "Showroom Shine Pack",
    description: "Full Hand Wax Polish + Interior Deep Vacuum + Dashboard & Console Detail",
    hatchbackPrice: 849,  // save ₹198 vs ₹199+₹199+₹149=₹547... check: ₹199+199+149=₹547? No: ₹199+₹199+₹149=₹547. Save=₹547-₹849<0. Recalculate: ₹199wax+₹199vacuum+₹149dash=₹547. Bundle ₹849 is more. Must be ₹349 save: ₹199+₹249+₹199+₹199=₹846? Per pkg doc §4.3: H₹849 save₹198. So individual = ₹1047. Means SUV prices: ₹249+₹249+₹249+₹199+some addon. Keeping as per pkg doc.
    suvPrice: 1099,
    saving: "Save ₹198 (Hatchback) / Save ₹248 (SUV)",
    whenToPush: "Diwali / festive / gifting. 'Gift your family a showroom car.'",
    isActive: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ONE-TIME & REPEAT VISIT PRICING — Package Architecture v1.8 §5
// ─────────────────────────────────────────────────────────────────────────────
export const ONE_TIME_PRICING = {
  waterWash:   { hatchback: 199, suv: 299, luxury: 399 },
  shampooWash: { hatchback: 299, suv: 349, luxury: 499 },
  shampooWax:  { hatchback: 399, suv: 499, luxury: 699 },
} as const;

export const REPEAT_PACK_PRICING = {
  packOf2: {
    waterWash:   { hatchback: 370,  suv: 550,  luxury: 730  },
    shampooWash: { hatchback: 550,  suv: 640,  luxury: 920  },
    shampooWax:  { hatchback: 730,  suv: 920,  luxury: 1290 },
    savingPct: 8,
    validityDays: 60,
  },
  packOf4: {
    waterWash:   { hatchback: 680,  suv: 1020, luxury: 1360 },
    shampooWash: { hatchback: 1020, suv: 1180, luxury: 1700 },
    shampooWax:  { hatchback: 1360, suv: 1700, luxury: 2380 },
    savingPct: 15,
    validityDays: 60,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// UPSELL PATH — Package Architecture v1.8 §6
// ─────────────────────────────────────────────────────────────────────────────
export const UPSELL_SCRIPTS = {
  oneTimeToSHINE: `You paid ₹199 for one wash. Express Wash is ₹1,249 for 30 washes — ₹42 each. If you wash 7 times this month you've already saved money. Want me to send the link now?`,
  shineToVacuum:  `Can I do your full interior this Saturday? ₹199 for hatchback, we clean everything inside with a photo after. Shall I schedule it?`,
  shineToPROTECT: `You paid ₹199 for the interior vacuum. Smart Wash costs ₹350 more/month for Hatchback, ₹500 more for SUV, ₹700 more for Luxury — and includes interior vacuum 2× a month plus car fragrance. You're already spending ₹199 — upgrade to Smart Wash and it's included every month. Shall I switch you?`,
  protectToWax:   `Shall we do a full hand wax this month? ₹199 for hatchback — your car will look brand new. Elite Wash subscribers get this free every month — but you can add it once for ₹199.`,
  protectToELITE: `You paid ₹199 for the wax. ELITE costs ₹400 more/month for Hatchback, ₹500 more for SUV, ₹800 more for Luxury — and includes hand wax every month, dashboard clean twice a month, tyre dressing fortnightly (vs monthly in Smart Wash), and premium fragrance with cabin sanitisation every month. If you want the wax done monthly, ELITE pays for itself. Want me to upgrade you?`,
  eliteReferral:  `You're getting our best plan — the car must be looking great! Do you have a neighbour or colleague whose car we should be washing? We'll give you one month free if you refer someone who subscribes.`,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// OBJECTION RESPONSES — Package Architecture v1.8 §7
// ─────────────────────────────────────────────────────────────────────────────
export const OBJECTION_SCRIPTS = {
  hooraIsCheaper:    `Hoora is a good service — we respect them. The difference is in how we operate. Hoora works on a booking-based model — you call, they come when available. We work on a subscription model — same person, same time, every single morning, without you doing anything. No booking. No follow-up. Just a WhatsApp photo every day confirming your car is done. Washing centre mein ek shampoo wash ₹500–800 leta hai — hum subscription mein ₹53 per wash kar rahe hain, ghar par, roz. The question is not who is cheaper — it is whether you want to manage a booking every time, or want it done automatically.`,
  localBhaiya:       `"Tumhari gaadi tumhari pehchaan hai." Local bhaiya charges ₹300 but misses days with zero accountability. Washing centre mein ek shampoo wash ₹500–800 leta hai — hum subscription mein ₹53 per wash kar rahe hain, ghar par, roz. With us, you get a WhatsApp before-and-after photo with timestamp every morning — that photo is your daily service proof.`,
  noNeedDailyWash:   `In Surat's dust, construction sites, and humidity, even a parked car collects a visible film overnight. Our plan is not about washing because the car is dirty — it is about not having to think about it at all. Same time every morning, same person, same result. Subscription is month-to-month — cancel anytime after the first month with 7 days' notice. Try it for one month and judge for yourself.`,
  willDamage:        `Great question — we use the gentlest method. Daily washing is always a plain water spray and microfibre dry — no chemicals on the paint every day. Express Wash includes one shampoo wash per month on the car body. Smart Wash upgrades that to fortnightly (2×/month). ELITE upgrades it further to weekly (4×/month). So the body only gets shampoo once a week at most — not daily.`,
  letMeThink:        `Of course. Can I send you a WhatsApp with the plan details and some reviews from customers in your society? You can also book directly on WhatsApp — no app download needed. Just send "Hello 249" to our number.`,
  noContract:        `No long-term contract. Our subscription is month-to-month. You can cancel after the first month by giving 7 days' written notice via WhatsApp. The first month's payment is non-refundable once service has started — this covers washer assignment and scheduling. After the first month, there is no penalty for leaving.`,
  randomParking:     `We do need working space around the vehicle to wash it properly — our washer needs to move around all four sides. If your parking is not fixed, the vehicle needs to be parked in an accessible bay where the washer can work without obstruction. Our team will call you within 24 hours to check the location and confirm the slot.`,
  notJustHome:       `We are not a home-only service. We visit homes, offices, commercial premises, and any other location where your vehicle is parked — wherever you need us, that is where we come. Our service window runs from 5 AM to 9 AM. If your car is parked at your office, we can schedule the wash for your office parking slot.`,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — get subscription price for a given plan + vehicle category
// ─────────────────────────────────────────────────────────────────────────────
export function getSubscriptionPrice(
  vehicleCategory: VehicleCategory,
  plan: PlanType,
): number | "NA" {
  return CURRENT_PLAN_VERSION.pricingMatrix[vehicleCategory][plan];
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — get add-on price by id + vehicle category
// ─────────────────────────────────────────────────────────────────────────────
export function getAddonPrice(
  addonId: string,
  vehicleCategory: VehicleCategory,
): number | "NA" {
  const addon = ADD_ON_SERVICES.find(a => a.id === addonId);
  if (!addon) return "NA";
  if (vehicleCategory.includes("Luxury")) return addon.pricing.luxury;
  if (vehicleCategory.includes("SUV"))    return addon.pricing.suv;
  if (vehicleCategory.includes("2W"))     return addon.pricing.twoW;
  return addon.pricing.hatchback; // default hatchback / compact sedan
}

// ─────────────────────────────────────────────────────────────────────────────
// PITCH ANCHOR — use this at the opening of EVERY price conversation
// ─────────────────────────────────────────────────────────────────────────────
export const PITCH_ANCHOR =
  `Washing centre mein ek shampoo wash ₹500–800 leta hai. ` +
  `Hum kar rahe hain ₹53 per wash — ghar par, roz, 30 din.`;


// ─────────────────────────────────────────────────────────────────────────────
// LEGACY COMPATIBILITY EXPORTS
// Required by subscriptionPlansService.ts — derived from CURRENT_PLAN_VERSION
// ─────────────────────────────────────────────────────────────────────────────

export const WASHES_PER_MONTH = 30;

export const PLAN_TIER_NAMES: Record<string, string> = {
  EXPRESS_WASH: "EXPRESS_WASH",
  SMART_WASH:   "SMART_WASH",
  ELITE:        "ELITE_WASH",
  ELITE_2W:     "ELITE (2-Wheeler)",
};

export const VEHICLE_CATEGORIES_CONFIG: Record<string, {
  displayName: string;
  examples: string[];
  type: "4W" | "2W";
}> = {
  "Hatchback / Compact Sedan": {
    displayName: "Hatchback / Compact Sedan",
    examples: ["Maruti Swift", "Hyundai i20", "Tata Nexon", "Honda Amaze"],
    type: "4W",
  },
  "SUV / MUV / Sedan": {
    displayName: "SUV / MUV / Sedan",
    examples: ["Hyundai Creta", "Kia Seltos", "Honda City", "Toyota Innova"],
    type: "4W",
  },
  "Luxury / Large SUV": {
    displayName: "Luxury / Large SUV",
    examples: ["Toyota Fortuner", "Mercedes GLC", "BMW X5", "Audi Q7"],
    type: "4W",
  },
  "2W - Standard / Commuter Bike": {
    displayName: "Standard / Commuter Bike",
    examples: ["Honda Activa", "Bajaj Pulsar 150", "Hero Splendor"],
    type: "2W",
  },
  "2W - Sports / Premium Bike": {
    displayName: "Sports / Premium Bike",
    examples: ["Royal Enfield", "KTM Duke", "Bajaj Dominar"],
    type: "2W",
  },
  "2W - Scooter": {
    displayName: "Scooter",
    examples: ["Honda Activa", "TVS Jupiter", "Suzuki Access"],
    type: "2W",
  },
};

// Base prices indexed by vehicle category name — used by subscriptionPlansService
export const PLAN_BASE_PRICES: Record<string, Record<string, number>> = {};
for (const [category, plans] of Object.entries(CURRENT_PLAN_VERSION.pricingMatrix)) {
  PLAN_BASE_PRICES[category] = {};
  for (const [plan, price] of Object.entries(plans)) {
    if (typeof price === "number") {
      PLAN_BASE_PRICES[category][plan] = price;
    }
  }
}

export const BILLING_DURATIONS: Array<{
  id: string;
  label: string;
  months: number;
  discount: number;
  perks: string[];
}> = [
  { id: "monthly",  label: "Month to Month", months: 1,  discount: 0,  perks: ["Cancel anytime. 7 days' notice."] },
  { id: "3month",   label: "3 Months",       months: 3,  discount: 5,  perks: ["5% off on renewal."] },
  { id: "6month",   label: "6 Months",       months: 6,  discount: 10, perks: ["10% off + free interior vacuum every month."] },
  { id: "12month",  label: "12 Months",      months: 12, discount: 18, perks: ["18% off + vacuum + tyre dressing monthly + priority slots."] },
];

// Alias for ADD_ON_SERVICES — subscriptionPlansService imports as ADDON_SERVICES
export const ADDON_SERVICES = ADD_ON_SERVICES;

// Alias for CURRENT_PLAN_VERSION — used by getActivePlanVersion()
export function getActivePlanVersion() {
  return CURRENT_PLAN_VERSION;
}

// Vehicle category list for dropdowns
export const VEHICLE_CATEGORIES = Object.keys(VEHICLE_CATEGORIES_CONFIG) as VehicleCategory[];

// Plan type list
export const PLAN_TYPES = Object.keys(CURRENT_PLAN_VERSION.pricingMatrix["Hatchback / Compact Sedan"]) as PlanType[];

// Format price helper
export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ONE_TIME_WASH_PRICING alias — used by PlanDefinitionContext and PricingOverview
export const ONE_TIME_WASH_PRICING = {
  hatchback: ONE_TIME_PRICING.waterWash.hatchback,
  suv:       ONE_TIME_PRICING.waterWash.suv,
  luxury:    ONE_TIME_PRICING.waterWash.luxury,
  // Full breakdown
  waterWash:   ONE_TIME_PRICING.waterWash,
  shampooWash: ONE_TIME_PRICING.shampooWash,
  shampooWax:  ONE_TIME_PRICING.shampooWax,
} as const;

export const AVG_WASHES_PER_MONTH = WASHES_PER_MONTH; // alias

export const ALL_PLAN_VERSIONS = [CURRENT_PLAN_VERSION]; // single version list

export const TARGET_EBITDA_MARGIN = 0.30; // 30% blended EBITDA target

// Helper: get plan price for a vehicle category + plan type
export function getPlanPrice(
  vehicleCategory: string,
  planType: string,
): number {
  const matrix = CURRENT_PLAN_VERSION.pricingMatrix;
  const catPrices = matrix[vehicleCategory as VehicleCategory];
  if (!catPrices) return 0;
  const price = catPrices[planType as PlanType];
  return typeof price === "number" ? price : 0;
}

// Helper: get all one-time wash options for a vehicle category
export function getAllOneTimeWashOptions(vehicleCategory: string): {
  type: string; label: string; price: number;
}[] {
  const isLux = vehicleCategory.toLowerCase().includes("luxury");
  const isSuv = vehicleCategory.toLowerCase().includes("suv");
  const tier  = isLux ? "luxury" : isSuv ? "suv" : "hatchback";
  return [
    { type: "waterWash",   label: "EXPRESS_WASH",    price: ONE_TIME_PRICING.waterWash[tier]   },
    { type: "shampooWash", label: "SMART_WASH",  price: ONE_TIME_PRICING.shampooWash[tier] },
    { type: "shampooWax",  label: "ELITE_WASH", price: ONE_TIME_PRICING.shampooWax[tier]  },
  ];
}

// Helper: get one-time wash price
export function getOneTimeWashPrice(
  vehicleCategory: string,
  washType: "waterWash" | "shampooWash" | "shampooWax" = "waterWash",
): number {
  const isLux = vehicleCategory.toLowerCase().includes("luxury");
  const isSuv = vehicleCategory.toLowerCase().includes("suv");
  const tier  = isLux ? "luxury" : isSuv ? "suv" : "hatchback";
  return ONE_TIME_PRICING[washType][tier];
}

// Helper: pricing summary for a plan + vehicle
export function getPricingSummary(vehicleCategory: string, planType: string) {
  const price = getPlanPrice(vehicleCategory, planType);
  const perWash = price > 0 ? Math.round(price / WASHES_PER_MONTH) : 0;
  return {
    monthlyPrice: price,
    perWash,
    washesPerMonth: WASHES_PER_MONTH,
    planName: { SHINE: "SHINE | Chamakti Subah", PROTECT: "PROTECT | Raksha Plan", ELITE: "ELITE | Raja Seva" }[planType] || planType,
    vehicleCategory,
  };
}

// Previous plan version — returns current (no previous version exists yet)
export function getPreviousPlanVersion() {
  return CURRENT_PLAN_VERSION;
}

// SUBSCRIPTION_PLANS — flat array of all plan+vehicle combinations for plan editors
export const SUBSCRIPTION_PLANS = Object.entries(CURRENT_PLAN_VERSION.pricingMatrix).flatMap(
  ([category, plans]) =>
    Object.entries(plans)
      .filter(([, price]) => typeof price === "number" && price > 0)
      .map(([planType, price]) => ({
        id: `${planType}-${category.replace(/[^a-zA-Z]/g, "-").toLowerCase()}`,
        planType: planType as PlanType,
        vehicleCategory: category as VehicleCategory,
        planName: { SHINE: "SHINE | Chamakti Subah", PROTECT: "PROTECT | Raksha Plan", ELITE: "ELITE | Raja Seva" }[planType] || planType,
        monthlyPrice: price as number,
        perWashPrice: Math.round((price as number) / WASHES_PER_MONTH),
        washesPerMonth: WASHES_PER_MONTH,
      }))
);


export const ROLE_PERMISSIONS = null as any; // TODO: implement


export const PLAN_TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  EXPRESS_WASH: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  SMART_WASH:   { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  ELITE:        { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  ELITE_2W:     { bg: "#F5F3FF", text: "#5B21B6", border: "#DDD6FE" },
};
