// Material Price History and Standard Usage Rate History - Mock Data
// This file extends the base materials with comprehensive historical tracking

import {
  type PriceHistoryRecord,
  type StandardUsageRateHistory,
  MATERIALS,
} from "./costData";

// ============================================
// PRICE HISTORY MOCK DATA
// ============================================

export const PRICE_HISTORY_RECORDS: PriceHistoryRecord[] = [
  // Foam Shampoo - Material ID: 1
  {
    id: "ph-1-1",
    materialId: "1",
    effectiveDate: "2025-08-15",
    costPerUnit: 0.75,
    source: "GRN",
    batchNumber: "FS-2025-08-001",
    quantityReceived: 5000,
    supplier: "ChemClean Suppliers",
    grnId: "GRN-2025-1234",
    createdAt: "2025-08-15T10:30:00Z",
  },
  {
    id: "ph-1-2",
    materialId: "1",
    effectiveDate: "2025-10-20",
    costPerUnit: 0.78,
    source: "Manual",
    reason: "Supplier Price Revision",
    reference: "Email dated 2025-10-18",
    approvedBy: "Rajesh Kumar (SA)",
    notes: "Supplier notified 5% increase due to raw material costs",
    createdAt: "2025-10-18T14:20:00Z",
  },
  {
    id: "ph-1-3",
    materialId: "1",
    effectiveDate: "2025-12-01",
    costPerUnit: 0.80,
    source: "GRN",
    batchNumber: "FS-2025-12-002",
    quantityReceived: 8000,
    supplier: "ChemClean Suppliers",
    grnId: "GRN-2025-2456",
    createdAt: "2025-12-01T09:15:00Z",
  },
  {
    id: "ph-1-4",
    materialId: "1",
    effectiveDate: "2026-04-01",
    costPerUnit: 0.82,
    source: "Manual",
    reason: "Supplier Price Revision",
    reference: "Contract renewal - CNT-2026-04",
    approvedBy: "Priya Sharma (Admin)",
    isScheduled: true,
    notes: "Annual contract renewal with 2.5% increase",
    createdAt: "2026-03-10T11:00:00Z",
  },

  // Wax Coating - Material ID: 2
  {
    id: "ph-2-1",
    materialId: "2",
    effectiveDate: "2025-07-10",
    costPerUnit: 2.40,
    source: "GRN",
    batchNumber: "WC-2025-07-001",
    quantityReceived: 3000,
    supplier: "Premium Auto Care",
    grnId: "GRN-2025-0987",
    createdAt: "2025-07-10T15:45:00Z",
  },
  {
    id: "ph-2-2",
    materialId: "2",
    effectiveDate: "2025-11-15",
    costPerUnit: 2.50,
    source: "GRN",
    batchNumber: "WC-2025-11-002",
    quantityReceived: 4500,
    supplier: "Premium Auto Care",
    grnId: "GRN-2025-3421",
    createdAt: "2025-11-15T08:30:00Z",
  },
  {
    id: "ph-2-3",
    materialId: "2",
    effectiveDate: "2026-02-01",
    costPerUnit: 2.45,
    source: "Manual",
    reason: "Bulk Discount Negotiated",
    reference: "Purchase agreement PA-2026-002",
    approvedBy: "Amit Patel (SA)",
    notes: "Negotiated 2% discount for annual commitment of 50L ml",
    createdAt: "2026-01-25T10:15:00Z",
  },

  // Tyre Polish - Material ID: 3
  {
    id: "ph-3-1",
    materialId: "3",
    effectiveDate: "2025-09-05",
    costPerUnit: 1.15,
    source: "GRN",
    batchNumber: "TP-2025-09-001",
    quantityReceived: 2500,
    supplier: "TyreShine Ltd",
    grnId: "GRN-2025-1876",
    createdAt: "2025-09-05T13:20:00Z",
  },
  {
    id: "ph-3-2",
    materialId: "3",
    effectiveDate: "2026-01-10",
    costPerUnit: 1.20,
    source: "GRN",
    batchNumber: "TP-2026-01-002",
    quantityReceived: 3200,
    supplier: "TyreShine Ltd",
    grnId: "GRN-2026-0234",
    createdAt: "2026-01-10T09:45:00Z",
  },

  // Microfiber Cloth - Material ID: 4
  {
    id: "ph-4-1",
    materialId: "4",
    effectiveDate: "2025-06-20",
    costPerUnit: 14.50,
    source: "GRN",
    batchNumber: "MC-2025-06-001",
    quantityReceived: 1000,
    supplier: "Textile Supplies Co",
    grnId: "GRN-2025-0654",
    createdAt: "2025-06-20T11:30:00Z",
  },
  {
    id: "ph-4-2",
    materialId: "4",
    effectiveDate: "2025-10-05",
    costPerUnit: 15.00,
    source: "GRN",
    batchNumber: "MC-2025-10-002",
    quantityReceived: 1500,
    supplier: "Textile Supplies Co",
    grnId: "GRN-2025-2987",
    createdAt: "2025-10-05T14:00:00Z",
  },
  {
    id: "ph-4-3",
    materialId: "4",
    effectiveDate: "2026-02-15",
    costPerUnit: 14.80,
    source: "Manual",
    reason: "New Supplier",
    reference: "Supplier evaluation report SE-2026-02",
    approvedBy: "Neha Singh (Admin)",
    notes: "Switched to new supplier with better quality-price ratio",
    createdAt: "2026-02-10T16:20:00Z",
  },

  // Interior Fragrance - Material ID: 5
  {
    id: "ph-5-1",
    materialId: "5",
    effectiveDate: "2025-08-22",
    costPerUnit: 2.90,
    source: "GRN",
    batchNumber: "IF-2025-08-001",
    quantityReceived: 1800,
    supplier: "AromaFresh India",
    grnId: "GRN-2025-1543",
    createdAt: "2025-08-22T10:10:00Z",
  },
  {
    id: "ph-5-2",
    materialId: "5",
    effectiveDate: "2025-12-15",
    costPerUnit: 3.00,
    source: "GRN",
    batchNumber: "IF-2025-12-002",
    quantityReceived: 2200,
    supplier: "AromaFresh India",
    grnId: "GRN-2025-4123",
    createdAt: "2025-12-15T12:30:00Z",
  },

  // Dashboard Polish - Material ID: 6
  {
    id: "ph-6-1",
    materialId: "6",
    effectiveDate: "2025-07-28",
    costPerUnit: 1.75,
    source: "GRN",
    batchNumber: "DP-2025-07-001",
    quantityReceived: 2000,
    supplier: "CarCare Plus",
    grnId: "GRN-2025-1098",
    createdAt: "2025-07-28T09:00:00Z",
  },
  {
    id: "ph-6-2",
    materialId: "6",
    effectiveDate: "2025-11-20",
    costPerUnit: 1.80,
    source: "GRN",
    batchNumber: "DP-2025-11-002",
    quantityReceived: 2500,
    supplier: "CarCare Plus",
    grnId: "GRN-2025-3654",
    createdAt: "2025-11-20T11:15:00Z",
  },

  // Glass Cleaner - Material ID: 7
  {
    id: "ph-7-1",
    materialId: "7",
    effectiveDate: "2025-06-15",
    costPerUnit: 0.58,
    source: "GRN",
    batchNumber: "GC-2025-06-001",
    quantityReceived: 6000,
    supplier: "ClearView Solutions",
    grnId: "GRN-2025-0567",
    createdAt: "2025-06-15T14:45:00Z",
  },
  {
    id: "ph-7-2",
    materialId: "7",
    effectiveDate: "2025-09-30",
    costPerUnit: 0.60,
    source: "GRN",
    batchNumber: "GC-2025-09-002",
    quantityReceived: 7500,
    supplier: "ClearView Solutions",
    grnId: "GRN-2025-2234",
    createdAt: "2025-09-30T10:20:00Z",
  },
  {
    id: "ph-7-3",
    materialId: "7",
    effectiveDate: "2026-01-20",
    costPerUnit: 0.59,
    source: "Manual",
    reason: "Market Rate Change",
    reference: "Market analysis report MAR-2026-01",
    approvedBy: "Vikram Reddy (SA)",
    notes: "Market rates decreased due to increased competition",
    createdAt: "2026-01-15T15:30:00Z",
  },

  // Wheel Cleaner - Material ID: 8
  {
    id: "ph-8-1",
    materialId: "8",
    effectiveDate: "2025-07-05",
    costPerUnit: 0.88,
    source: "GRN",
    batchNumber: "WCL-2025-07-001",
    quantityReceived: 4000,
    supplier: "AutoChem Industries",
    grnId: "GRN-2025-0876",
    createdAt: "2025-07-05T08:50:00Z",
  },
  {
    id: "ph-8-2",
    materialId: "8",
    effectiveDate: "2025-10-15",
    costPerUnit: 0.90,
    source: "GRN",
    batchNumber: "WCL-2025-10-002",
    quantityReceived: 5500,
    supplier: "AutoChem Industries",
    grnId: "GRN-2025-3012",
    createdAt: "2025-10-15T13:10:00Z",
  },
  {
    id: "ph-8-3",
    materialId: "8",
    effectiveDate: "2026-02-28",
    costPerUnit: 0.92,
    source: "Manual",
    reason: "Supplier Price Revision",
    reference: "Notification ref: SP-2026-02-WCL",
    approvedBy: "Sunita Gupta (Admin)",
    notes: "Raw material cost increase from supplier",
    createdAt: "2026-02-20T09:40:00Z",
  },
];

// ============================================
// STANDARD USAGE RATE HISTORY MOCK DATA
// ============================================

export const USAGE_RATE_HISTORY: StandardUsageRateHistory[] = [
  // Foam Shampoo - Material ID: 1
  {
    id: "urh-1-1",
    materialId: "1",
    packageName: "Water + Shampoo + Wax",
    effectiveDate: "2025-07-01",
    standardQuantity: 55,
    reason: "Optimized for Quality",
    approvedBy: "Karthik Menon (SA)",
    notes: "Initial usage rate - pilot phase",
    createdAt: "2025-07-01T10:00:00Z",
  },
  {
    id: "urh-1-2",
    materialId: "1",
    packageName: "Water + Shampoo + Wax",
    effectiveDate: "2025-09-15",
    standardQuantity: 50,
    reason: "Cost Reduction Initiative",
    approvedBy: "Rajesh Kumar (SA)",
    notes: "Reduced to 50ml after quality testing confirmed no impact",
    createdAt: "2025-09-10T14:30:00Z",
  },
  {
    id: "urh-1-3",
    materialId: "1",
    packageName: "Elite Plus",
    effectiveDate: "2025-11-01",
    standardQuantity: 65,
    reason: "Quality Complaint Investigation",
    approvedBy: "Priya Sharma (Admin)",
    notes: "Increased from 60ml to 65ml due to customer feedback on foam quality",
    createdAt: "2025-10-28T11:15:00Z",
  },
  {
    id: "urh-1-4",
    materialId: "1",
    packageName: "Elite Plus",
    effectiveDate: "2026-01-15",
    standardQuantity: 60,
    reason: "Supplier Product Strength Change",
    approvedBy: "Amit Patel (SA)",
    notes: "Supplier improved formula concentration - reverted to 60ml",
    createdAt: "2026-01-10T09:20:00Z",
  },

  // Wax Coating - Material ID: 2
  {
    id: "urh-2-1",
    materialId: "2",
    packageName: "Water + Shampoo + Wax",
    effectiveDate: "2025-08-01",
    standardQuantity: 22,
    reason: "Optimized for Quality",
    approvedBy: "Vikram Reddy (SA)",
    notes: "Initial standard - testing phase",
    createdAt: "2025-08-01T10:30:00Z",
  },
  {
    id: "urh-2-2",
    materialId: "2",
    packageName: "Water + Shampoo + Wax",
    effectiveDate: "2025-11-10",
    standardQuantity: 20,
    reason: "Cost Reduction Initiative",
    approvedBy: "Neha Singh (Admin)",
    notes: "Optimized application technique - reduced wastage",
    createdAt: "2025-11-05T15:45:00Z",
  },
  {
    id: "urh-2-3",
    materialId: "2",
    packageName: "Elite Plus",
    effectiveDate: "2025-12-20",
    standardQuantity: 25,
    reason: "Optimized for Quality",
    approvedBy: "Rajesh Kumar (SA)",
    notes: "Premium package requires better coverage",
    createdAt: "2025-12-15T13:00:00Z",
  },

  // Tyre Polish - Material ID: 3
  {
    id: "urh-3-1",
    materialId: "3",
    packageName: "Water + Shampoo + Wax",
    effectiveDate: "2025-09-10",
    standardQuantity: 18,
    reason: "Optimized for Quality",
    approvedBy: "Karthik Menon (SA)",
    notes: "Initial standard quantity",
    createdAt: "2025-09-10T11:00:00Z",
  },
  {
    id: "urh-3-2",
    materialId: "3",
    packageName: "Water + Shampoo + Wax",
    effectiveDate: "2025-12-01",
    standardQuantity: 15,
    reason: "Supplier Product Strength Change",
    approvedBy: "Priya Sharma (Admin)",
    notes: "New formula more concentrated - reduced quantity needed",
    createdAt: "2025-11-28T14:20:00Z",
  },

  // Glass Cleaner - Material ID: 7
  {
    id: "urh-7-1",
    materialId: "7",
    packageName: "Water + Shampoo + Wax",
    effectiveDate: "2025-06-20",
    standardQuantity: 25,
    reason: "Seasonal Adjustment",
    approvedBy: "Amit Patel (SA)",
    notes: "Monsoon season requires more glass cleaner",
    createdAt: "2025-06-15T09:30:00Z",
  },
  {
    id: "urh-7-2",
    materialId: "7",
    packageName: "Water + Shampoo + Wax",
    effectiveDate: "2025-10-01",
    standardQuantity: 20,
    reason: "Seasonal Adjustment",
    approvedBy: "Vikram Reddy (SA)",
    notes: "Post-monsoon normalization",
    createdAt: "2025-09-25T10:15:00Z",
  },

  // Wheel Cleaner - Material ID: 8
  {
    id: "urh-8-1",
    materialId: "8",
    packageName: "Elite Plus",
    effectiveDate: "2025-08-15",
    standardQuantity: 35,
    reason: "Quality Complaint Investigation",
    approvedBy: "Neha Singh (Admin)",
    notes: "Increased quantity to ensure thorough cleaning of alloy wheels",
    createdAt: "2025-08-10T12:40:00Z",
  },
  {
    id: "urh-8-2",
    materialId: "8",
    packageName: "Elite Plus",
    effectiveDate: "2025-11-25",
    standardQuantity: 30,
    reason: "Cost Reduction Initiative",
    approvedBy: "Rajesh Kumar (SA)",
    notes: "Improved application method - reduced wastage",
    createdAt: "2025-11-20T16:00:00Z",
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get price history for a specific material, sorted by effective date (newest first)
 */
export function getPriceHistory(materialId: string): PriceHistoryRecord[] {
  return PRICE_HISTORY_RECORDS.filter((record) => record.materialId === materialId)
    .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
}

/**
 * Get current active price for a material (most recent effective date <= today)
 */
export function getCurrentPrice(materialId: string, asOfDate?: Date): number {
  const targetDate = asOfDate || new Date();
  const history = PRICE_HISTORY_RECORDS.filter(
    (record) => 
      record.materialId === materialId && 
      new Date(record.effectiveDate) <= targetDate
  ).sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

  return history[0]?.costPerUnit || 0;
}

/**
 * Get usage rate history for a specific material and package
 */
export function getUsageRateHistory(
  materialId: string,
  packageName?: string
): StandardUsageRateHistory[] {
  let history = USAGE_RATE_HISTORY.filter((record) => record.materialId === materialId);
  
  if (packageName) {
    history = history.filter((record) => record.packageName === packageName);
  }
  
  return history.sort(
    (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
  );
}

/**
 * Get current active standard usage rate for a material and package
 */
export function getCurrentUsageRate(
  materialId: string,
  packageName: string,
  asOfDate?: Date
): number {
  const targetDate = asOfDate || new Date();
  const history = USAGE_RATE_HISTORY.filter(
    (record) =>
      record.materialId === materialId &&
      record.packageName === packageName &&
      new Date(record.effectiveDate) <= targetDate
  ).sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

  if (history[0]) {
    return history[0].standardQuantity;
  }

  // Fallback to base material data
  const material = MATERIALS.find((m) => m.id === materialId);
  const mapping = material?.usageMapping.find((m) => m.package === packageName);
  return mapping?.quantityPerWash || 0;
}

/**
 * Get scheduled (future) price changes
 */
export function getScheduledPriceChanges(materialId?: string): PriceHistoryRecord[] {
  const today = new Date();
  let scheduled = PRICE_HISTORY_RECORDS.filter(
    (record) => record.isScheduled && new Date(record.effectiveDate) > today
  );

  if (materialId) {
    scheduled = scheduled.filter((record) => record.materialId === materialId);
  }

  return scheduled.sort(
    (a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
  );
}

/**
 * Calculate price variance over time
 */
export function getPriceVariance(materialId: string): {
  latestPrice: number;
  oldestPrice: number;
  variance: number;
  variancePercent: number;
} {
  const history = getPriceHistory(materialId);
  
  if (history.length === 0) {
    return { latestPrice: 0, oldestPrice: 0, variance: 0, variancePercent: 0 };
  }

  const latestPrice = history[0].costPerUnit;
  const oldestPrice = history[history.length - 1].costPerUnit;
  const variance = latestPrice - oldestPrice;
  const variancePercent = oldestPrice > 0 ? (variance / oldestPrice) * 100 : 0;

  return { latestPrice, oldestPrice, variance, variancePercent };
}
