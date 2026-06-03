// Add-On Services EBITDA Data
// All add-ons carry 74-80% EBITDA margin

export interface AddOnEBITDAData {
  id: string;
  name: string;
  whatsIncluded: string;
  price4W: number;
  directCost4W: number;
  ebitdaAmount4W: number;
  ebitdaPercentage4W: number;
  price2W?: number;
  directCost2W?: number;
  ebitdaAmount2W?: number;
  ebitdaPercentage2W?: number;
  status: "Active" | "Pending";
  notes?: string;
}

export const ADD_ON_EBITDA_DATA: AddOnEBITDAData[] = [
  {
    id: "addon-001",
    name: "Interior Deep Vacuum",
    whatsIncluded: "Seats, mats, footwells, boot",
    price4W: 199,
    directCost4W: 44,
    ebitdaAmount4W: 155,
    ebitdaPercentage4W: 0.779, // 77.9%
    status: "Active",
  },
  {
    id: "addon-002",
    name: "Dashboard & Console Clean",
    whatsIncluded: "Dash, console, door pads",
    price4W: 149,
    directCost4W: 30,
    ebitdaAmount4W: 119,
    ebitdaPercentage4W: 0.799, // 79.9%
    price2W: 99,
    directCost2W: 20,
    ebitdaAmount2W: 79,
    ebitdaPercentage2W: 0.798, // 79.8%
    status: "Active",
  },
  {
    id: "addon-003",
    name: "Tyre Dressing",
    whatsIncluded: "Shine & protect all 4 tyres",
    price4W: 99,
    directCost4W: 20,
    ebitdaAmount4W: 79,
    ebitdaPercentage4W: 0.798, // 79.8%
    price2W: 49,
    directCost2W: 10,
    ebitdaAmount2W: 39,
    ebitdaPercentage2W: 0.796, // 79.6%
    status: "Active",
  },
  {
    id: "addon-004",
    name: "Glass Coating (RainX)",
    whatsIncluded: "Applied 1×/month all glass",
    price4W: 349,
    directCost4W: 80,
    ebitdaAmount4W: 269,
    ebitdaPercentage4W: 0.771, // 77.1%
    price2W: 249,
    directCost2W: 60,
    ebitdaAmount2W: 189,
    ebitdaPercentage2W: 0.759, // 75.9%
    status: "Active",
  },
  {
    id: "addon-005",
    name: "One-Time Wax Polish",
    whatsIncluded: "Full body for Water/Shampoo users",
    price4W: 599,
    directCost4W: 150,
    ebitdaAmount4W: 449,
    ebitdaPercentage4W: 0.749, // 74.9%
    price2W: 399,
    directCost2W: 100,
    ebitdaAmount2W: 299,
    ebitdaPercentage2W: 0.749, // 74.9%
    status: "Active",
  },
  {
    id: "addon-006",
    name: "Underbody Anti-Rust Spray",
    whatsIncluded: "Protective coating quarterly",
    price4W: 799,
    directCost4W: 200,
    ebitdaAmount4W: 599,
    ebitdaPercentage4W: 0.749, // 74.9%
    status: "Pending",
    notes: "⚠ PENDING OPERATIONAL CONFIRMATION - Do not activate until operations sign-off",
  },
];

/**
 * Get add-on EBITDA data by ID
 */
export function getAddOnEBITDAById(id: string): AddOnEBITDAData | undefined {
  return ADD_ON_EBITDA_DATA.find((addon) => addon.id === id);
}

/**
 * Get all active add-ons
 */
export function getActiveAddOnEBITDA(): AddOnEBITDAData[] {
  return ADD_ON_EBITDA_DATA.filter((addon) => addon.status === "Active");
}

/**
 * Calculate combined EBITDA when add-on is paired with a base plan
 */
export function calculateCombinedEBITDA(
  basePlanPrice: number,
  basePlanCost: number,
  addOnPrice: number,
  addOnCost: number
): {
  combinedRevenue: number;
  combinedCost: number;
  combinedEBITDA: number;
  combinedEBITDAPercentage: number;
} {
  const combinedRevenue = basePlanPrice + addOnPrice;
  const combinedCost = basePlanCost + addOnCost;
  const combinedEBITDA = combinedRevenue - combinedCost;
  const combinedEBITDAPercentage = combinedEBITDA / combinedRevenue;

  return {
    combinedRevenue,
    combinedCost,
    combinedEBITDA,
    combinedEBITDAPercentage,
  };
}

/**
 * TSE Incentive Multipliers based on deal type
 */
export interface TSEIncentiveMultiplier {
  dealType: string;
  multiplier: number;
  note: string;
}

export const TSE_INCENTIVE_MULTIPLIERS: TSEIncentiveMultiplier[] = [
  {
    dealType: "Base price — no add-on",
    multiplier: 0.70,
    note: "Lowest multiplier — deal closed without upsell",
  },
  {
    dealType: "Base + 1 add-on giveaway",
    multiplier: 0.90,
    note: "Add-on improves perceived value without revenue drop",
  },
  {
    dealType: "Bundle at MID price ⭐",
    multiplier: 1.00,
    note: "Best outcome — highest value stacking for company and customer",
  },
  {
    dealType: "Bundle at LOW price ⚠",
    multiplier: 0.60,
    note: "Low price is last resort — only enabled if EBITDA ≥ 30%",
  },
];
