// Overhead Dynamic Data - Comprehensive Overhead Management
// This file contains all overhead items with revision history and allocation logic

import {
  type OverheadItemDynamic,
  type OverheadRevisionHistory,
} from "./costData";

// ============================================
// DYNAMIC OVERHEAD ITEMS
// ============================================

export const OVERHEAD_ITEMS_DYNAMIC: OverheadItemDynamic[] = [
  {
    id: "oh-001",
    itemName: "Vehicle / Transport per Washer",
    description: "Monthly vehicle rental and fuel costs allocated per washer",
    costType: "Per Washer Per Month",
    perWasherAmount: 3200,
    allocationMethod: "Divide by Washer Washes",
    effectiveDate: "2026-01-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Rajesh Kumar (SA)",
    createdAt: "2025-12-15T10:00:00Z",
  },
  {
    id: "oh-002",
    itemName: "Mobile Data Plan",
    description: "Monthly mobile data charges for app connectivity and GPS tracking",
    costType: "Per Washer Per Month",
    perWasherAmount: 299,
    allocationMethod: "Divide by Washer Washes",
    effectiveDate: "2025-01-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Priya Sharma (Admin)",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "oh-003",
    itemName: "Uniform Amortization",
    description: "Monthly amortization of washer uniforms (2 sets per year @ ₹2,640)",
    costType: "Per Washer Per Month",
    perWasherAmount: 220,
    allocationMethod: "Divide by Washer Washes",
    effectiveDate: "2025-01-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Neha Singh (Admin)",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "oh-004",
    itemName: "ERP Software Fee",
    description: "CleanCar 360° ERP monthly subscription - company-wide allocation",
    costType: "Fixed Monthly Amount",
    fixedMonthlyAmount: 8000,
    allocationMethod: "Divide by Total Company Washes",
    effectiveDate: "2025-01-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Amit Patel (SA)",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "oh-005",
    itemName: "Insurance — Washer Personal Accident",
    description: "Personal accident insurance coverage for all washers",
    costType: "Per Washer Per Month",
    perWasherAmount: 180,
    allocationMethod: "Divide by Washer Washes",
    effectiveDate: "2026-02-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Rajesh Kumar (SA)",
    createdAt: "2026-01-20T14:30:00Z",
  },
  {
    id: "oh-006",
    itemName: "Water Charges",
    description: "Per-wash water consumption charges (usage-based billing)",
    costType: "Per Wash Direct",
    perWashAmount: 1.2,
    allocationMethod: "Direct per Wash",
    effectiveDate: "2025-01-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Neha Singh (Admin)",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "oh-007",
    itemName: "Electricity",
    description: "Per-wash electricity consumption for equipment (usage-based)",
    costType: "Per Wash Direct",
    perWashAmount: 0.8,
    allocationMethod: "Direct per Wash",
    effectiveDate: "2025-01-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Priya Sharma (Admin)",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "oh-008",
    itemName: "Foam Gun Cleaning Chemicals",
    description: "Monthly chemicals required for foam gun maintenance and cleaning",
    costType: "Per Washer Per Month",
    perWasherAmount: 150,
    allocationMethod: "Divide by Washer Washes",
    effectiveDate: "2025-03-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Vikram Reddy (Admin)",
    createdAt: "2025-02-25T11:00:00Z",
  },
  {
    id: "oh-009",
    itemName: "Customer Support Helpline",
    description: "Toll-free customer support number charges - company allocation",
    costType: "Fixed Monthly Amount",
    fixedMonthlyAmount: 2500,
    allocationMethod: "Divide by Total Company Washes",
    effectiveDate: "2025-06-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Amit Patel (SA)",
    createdAt: "2025-05-28T16:45:00Z",
  },
  {
    id: "oh-010",
    itemName: "Payment Gateway Charges",
    description: "Transaction fees for online payments (2% average)",
    costType: "Fixed Monthly Amount",
    fixedMonthlyAmount: 5400,
    allocationMethod: "Divide by Total Company Washes",
    effectiveDate: "2025-01-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Neha Singh (Admin)",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "oh-011",
    itemName: "Zone Marketing — Mumbai",
    description: "Zone-specific marketing and promotion costs for Mumbai",
    costType: "Per Zone Per Month",
    perZoneAmount: 12000,
    allocationMethod: "Divide by Zone Washes",
    effectiveDate: "2025-04-01",
    applicability: "Specific Zone",
    specificZone: "Mumbai",
    status: "Active",
    createdBy: "Priya Sharma (Admin)",
    createdAt: "2025-03-28T10:15:00Z",
  },
  {
    id: "oh-012",
    itemName: "Zone Marketing — Ahmedabad",
    description: "Zone-specific marketing and promotion costs for Ahmedabad",
    costType: "Per Zone Per Month",
    perZoneAmount: 8000,
    allocationMethod: "Divide by Zone Washes",
    effectiveDate: "2025-04-01",
    applicability: "Specific Zone",
    specificZone: "Ahmedabad",
    status: "Active",
    createdBy: "Vikram Reddy (Admin)",
    createdAt: "2025-03-28T10:20:00Z",
  },
  {
    id: "oh-013",
    itemName: "Equipment GPS Tracker",
    description: "Monthly GPS tracker subscription for equipment monitoring",
    costType: "Per Washer Per Month",
    perWasherAmount: 120,
    allocationMethod: "Divide by Washer Washes",
    effectiveDate: "2025-08-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Amit Patel (SA)",
    createdAt: "2025-07-25T13:30:00Z",
  },
  {
    id: "oh-014",
    itemName: "Quality Control Inspections",
    description: "Monthly quality control and random inspection costs",
    costType: "Fixed Monthly Amount",
    fixedMonthlyAmount: 4000,
    allocationMethod: "Divide by Total Company Washes",
    effectiveDate: "2025-02-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Rajesh Kumar (SA)",
    createdAt: "2025-01-28T09:00:00Z",
  },
  {
    id: "oh-015",
    itemName: "Training & Development",
    description: "Monthly training programs and skill development for washers",
    costType: "Fixed Monthly Amount",
    fixedMonthlyAmount: 6000,
    allocationMethod: "Divide by Total Company Washes",
    effectiveDate: "2025-01-01",
    applicability: "All Washers",
    status: "Active",
    createdBy: "Neha Singh (Admin)",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "oh-016",
    itemName: "COVID-19 Safety Supplies",
    description: "Masks, sanitizers, and safety equipment for pandemic precautions",
    costType: "Per Washer Per Month",
    perWasherAmount: 80,
    allocationMethod: "Divide by Washer Washes",
    effectiveDate: "2025-01-01",
    applicability: "All Washers",
    status: "Inactive", // Discontinued as pandemic measures relaxed
    createdBy: "Priya Sharma (Admin)",
    createdAt: "2025-01-01T00:00:00Z",
  },
];

// ============================================
// OVERHEAD REVISION HISTORY
// ============================================

export const OVERHEAD_REVISION_HISTORY: OverheadRevisionHistory[] = [
  // Vehicle/Transport revisions
  {
    id: "oh-rev-001",
    overheadItemId: "oh-001",
    effectiveDate: "2026-01-01",
    previousAmount: 2800,
    newAmount: 3200,
    reason: "Price Increase from Vendor",
    approvedBy: "Rajesh Kumar (SA)",
    notes: "Fuel price increase + vehicle rental rate hike from transport vendor",
    createdAt: "2025-12-15T10:00:00Z",
  },

  // Mobile Data Plan revisions
  {
    id: "oh-rev-002",
    overheadItemId: "oh-002",
    effectiveDate: "2025-07-01",
    previousAmount: 349,
    newAmount: 299,
    reason: "Price Decrease from Vendor",
    approvedBy: "Priya Sharma (Admin)",
    notes: "Negotiated bulk discount with Jio for company-wide plan",
    createdAt: "2025-06-25T14:20:00Z",
  },

  // Uniform Amortization revisions
  {
    id: "oh-rev-003",
    overheadItemId: "oh-003",
    effectiveDate: "2025-09-01",
    previousAmount: 200,
    newAmount: 220,
    reason: "Price Increase from Vendor",
    approvedBy: "Neha Singh (Admin)",
    notes: "Uniform supplier increased prices - higher quality fabric",
    createdAt: "2025-08-28T11:30:00Z",
  },

  // ERP Software Fee revisions
  {
    id: "oh-rev-004",
    overheadItemId: "oh-004",
    effectiveDate: "2025-06-01",
    previousAmount: 6500,
    newAmount: 8000,
    reason: "Price Increase from Vendor",
    approvedBy: "Amit Patel (SA)",
    notes: "Annual renewal with expanded features and additional user licenses",
    createdAt: "2025-05-28T15:45:00Z",
  },

  // Water Charges revisions
  {
    id: "oh-rev-005",
    overheadItemId: "oh-006",
    effectiveDate: "2025-07-01",
    previousAmount: 1.0,
    newAmount: 1.2,
    reason: "Regulatory Change",
    approvedBy: "Neha Singh (Admin)",
    notes: "Municipal water tariff increased by 20% - effective monsoon season",
    createdAt: "2025-06-30T09:15:00Z",
  },
  {
    id: "oh-rev-006",
    overheadItemId: "oh-006",
    effectiveDate: "2026-01-01",
    previousAmount: 1.2,
    newAmount: 1.35,
    reason: "Regulatory Change",
    approvedBy: "Rajesh Kumar (SA)",
    notes: "Annual water tariff revision by municipal corporation",
    createdAt: "2025-12-28T10:00:00Z",
  },

  // Electricity revisions
  {
    id: "oh-rev-007",
    overheadItemId: "oh-007",
    effectiveDate: "2025-04-01",
    previousAmount: 0.75,
    newAmount: 0.8,
    reason: "Regulatory Change",
    approvedBy: "Priya Sharma (Admin)",
    notes: "Electricity tariff increased - state energy policy update",
    createdAt: "2025-03-30T16:00:00Z",
  },

  // Payment Gateway Charges revisions
  {
    id: "oh-rev-008",
    overheadItemId: "oh-010",
    effectiveDate: "2025-08-01",
    previousAmount: 4800,
    newAmount: 5400,
    reason: "Usage Pattern Change",
    approvedBy: "Amit Patel (SA)",
    notes: "Higher transaction volume with increased customer base",
    createdAt: "2025-07-28T12:30:00Z",
  },

  // Zone Marketing Mumbai
  {
    id: "oh-rev-009",
    overheadItemId: "oh-011",
    effectiveDate: "2025-10-01",
    previousAmount: 10000,
    newAmount: 12000,
    reason: "Business Decision",
    approvedBy: "Priya Sharma (Admin)",
    notes: "Festive season campaign - increased marketing spend for Diwali",
    createdAt: "2025-09-28T11:00:00Z",
  },

  // Equipment GPS Tracker
  {
    id: "oh-rev-010",
    overheadItemId: "oh-013",
    effectiveDate: "2026-01-01",
    previousAmount: 140,
    newAmount: 120,
    reason: "New Service Provider",
    approvedBy: "Amit Patel (SA)",
    notes: "Switched to new GPS vendor with better pricing and features",
    createdAt: "2025-12-20T14:45:00Z",
  },

  // Training & Development
  {
    id: "oh-rev-011",
    overheadItemId: "oh-015",
    effectiveDate: "2025-09-01",
    previousAmount: 5000,
    newAmount: 6000,
    reason: "Business Decision",
    approvedBy: "Rajesh Kumar (SA)",
    notes: "Expanded training program to include advanced detailing techniques",
    createdAt: "2025-08-28T10:30:00Z",
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get current overhead amount for an item on a specific date
 */
export function getCurrentOverheadAmount(
  overheadItemId: string,
  asOfDate?: Date
): number {
  const targetDate = asOfDate || new Date();
  const item = OVERHEAD_ITEMS_DYNAMIC.find((oh) => oh.id === overheadItemId);
  
  if (!item) return 0;

  // Get the amount that was active on this date
  const history = OVERHEAD_REVISION_HISTORY.filter(
    (rev) =>
      rev.overheadItemId === overheadItemId &&
      new Date(rev.effectiveDate) <= targetDate
  ).sort(
    (a, b) =>
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
  );

  // If we have history, return the latest amount
  if (history.length > 0) {
    return history[0].newAmount;
  }

  // Otherwise return the current amount from the item
  return (
    item.fixedMonthlyAmount ||
    item.perWasherAmount ||
    item.perZoneAmount ||
    item.perWashAmount ||
    0
  );
}

/**
 * Get overhead revision history for an item
 */
export function getOverheadRevisionHistory(
  overheadItemId: string
): OverheadRevisionHistory[] {
  return OVERHEAD_REVISION_HISTORY.filter(
    (rev) => rev.overheadItemId === overheadItemId
  ).sort(
    (a, b) =>
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
  );
}

/**
 * Calculate overhead allocation per wash for a specific washer
 */
export function calculateOverheadPerWash(
  overheadItem: OverheadItemDynamic,
  context: {
    washerWashesPerMonth: number;
    zoneWashesPerMonth: number;
    companyWashesPerMonth: number;
    numberOfWashersInZone: number;
    asOfDate?: Date;
  }
): number {
  if (overheadItem.status === "Inactive") return 0;

  const amount = getCurrentOverheadAmount(overheadItem.id, context.asOfDate);

  switch (overheadItem.costType) {
    case "Fixed Monthly Amount":
      // Allocate based on allocation method
      if (overheadItem.allocationMethod === "Divide by Total Company Washes") {
        return amount / context.companyWashesPerMonth;
      } else if (overheadItem.allocationMethod === "Divide by Zone Washes") {
        return amount / context.zoneWashesPerMonth;
      }
      return 0;

    case "Per Washer Per Month":
      // Per washer amount divided by that washer's washes
      if (overheadItem.allocationMethod === "Divide by Washer Washes") {
        return amount / context.washerWashesPerMonth;
      }
      return 0;

    case "Per Zone Per Month":
      // Per zone amount divided by zone washes
      if (overheadItem.allocationMethod === "Divide by Zone Washes") {
        return amount / context.zoneWashesPerMonth;
      }
      return 0;

    case "Per Wash Direct":
      // Direct per wash charge
      return amount;

    default:
      return 0;
  }
}

/**
 * Get all active overhead items
 */
export function getActiveOverheadItems(): OverheadItemDynamic[] {
  return OVERHEAD_ITEMS_DYNAMIC.filter((item) => item.status === "Active");
}

/**
 * Get overhead items applicable to a specific washer/zone
 */
export function getApplicableOverheadItems(
  washerId?: string,
  zone?: string
): OverheadItemDynamic[] {
  return OVERHEAD_ITEMS_DYNAMIC.filter((item) => {
    if (item.status === "Inactive") return false;

    if (item.applicability === "All Washers") return true;

    if (item.applicability === "Specific Zone" && zone) {
      return item.specificZone === zone;
    }

    if (item.applicability === "Specific Washers" && washerId) {
      return item.specificWashers?.includes(washerId);
    }

    return false;
  });
}

/**
 * Calculate total overhead allocation per wash
 */
export function calculateTotalOverheadPerWash(context: {
  washerId?: string;
  zone?: string;
  washerWashesPerMonth: number;
  zoneWashesPerMonth: number;
  companyWashesPerMonth: number;
  numberOfWashersInZone: number;
  asOfDate?: Date;
}): {
  items: Array<{
    id: string;
    name: string;
    perWashAmount: number;
    costType: string;
  }>;
  totalOverhead: number;
} {
  const applicableItems = getApplicableOverheadItems(
    context.washerId,
    context.zone
  );

  const items = applicableItems.map((item) => ({
    id: item.id,
    name: item.itemName,
    perWashAmount: calculateOverheadPerWash(item, context),
    costType: item.costType,
  }));

  const totalOverhead = items.reduce(
    (sum, item) => sum + item.perWashAmount,
    0
  );

  return {
    items,
    totalOverhead,
  };
}

/**
 * Get overhead cost type badge color
 */
export function getOverheadCostTypeBadgeColor(
  costType: string
): string {
  switch (costType) {
    case "Fixed Monthly Amount":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Per Washer Per Month":
      return "bg-green-100 text-green-800 border-green-200";
    case "Per Zone Per Month":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Per Wash Direct":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Get overhead allocation method description
 */
export function getOverheadAllocationDescription(
  costType: string,
  allocationMethod: string
): string {
  if (costType === "Per Wash Direct") {
    return "Charged directly per wash";
  }

  switch (allocationMethod) {
    case "Divide by Total Company Washes":
      return "Allocated across all company washes";
    case "Divide by Zone Washes":
      return "Allocated within zone washes";
    case "Divide by Washer Washes":
      return "Allocated to washer's washes";
    default:
      return allocationMethod;
  }
}
