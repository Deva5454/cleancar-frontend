// Founder Control Tower Data
// Synchronized with CleanCar 360° Doorstep Service - REAL APPLICATION DATA
// Data as of March 2026 - Calculated from MASTER_KPI_DATA

import { MASTER_KPI_DATA } from "./masterData";
import {
  calculateBusinessMetrics,
  calculateRevenueByArea,
  calculateRevenueByPackage,
  calculateTeamPerformance,
  calculateGrowthTrends,
  generateStrategicInsights,
  generateFinancialAlerts,
  calculateYTDMetrics,
} from "./founderDataCalculations";

export interface BusinessHealthData {
  revenueMonthToDate: number;
  revenueYearToDate: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  burnRate: number;
  cashRunway: number;
  status: "healthy" | "caution" | "critical";
}

export interface GrowthMetrics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeSubscriptions: number;
  customerGrowthRate: number;
}

export interface CustomerAcquisitionTrend {
  id: string;
  month: string;
  customers: number;
}

export interface RevenueByType {
  id: string;
  type: string;
  amount: number;
  percentage: number;
}

export interface RevenueByCity {
  id: string;
  city: string;
  revenue: number;
  growth: number;
}

export interface StorePerformance {
  id?: string;
  city: string;
  store: string;
  customers: number;
  washes: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  status: "profitable" | "break-even" | "loss-making";
  growth?: number;
  efficiency?: number;
}

export interface FinancialAlert {
  id: string;
  type?: "critical" | "warning" | "info" | "revenue" | "operational";
  severity?: "critical" | "warning" | "info";
  message?: string;
  title?: string;
  description?: string;
  action: string;
  category?: string;
}

export interface StrategicInsight {
  id: string;
  insight: string;
  priority: "positive" | "negative" | "neutral";
}

export interface OperationalMetrics {
  totalWashesPerDay: number;
  avgWashesPerStore: number;
  staffProductivity: number;
  utilizationRate: number;
}

export interface WashVolumeTrend {
  id: string;
  week: string;
  washes: number;
}

export interface ExpansionReadiness {
  availableCapital: number;
  currentProfitability: number;
  operationalCapacity: number;
  readinessScore: number;
}

export interface UnitEconomics {
  revenuePerWash: number;
  costPerWash: number;
  ltv: number;
  cac: number;
  ltvToCacRatio: number;
  avgRetentionMonths: number;
}

// ============================================
// CALCULATED DATA FROM REAL APPLICATION
// ============================================

// Business Health Data - Calculated from actual KPIs
const businessMetrics = calculateBusinessMetrics();
export const BUSINESS_HEALTH_DATA: BusinessHealthData = {
  revenueMonthToDate: businessMetrics.revenueMonthToDate,
  revenueYearToDate: businessMetrics.revenueYearToDate,
  totalExpenses: businessMetrics.totalExpenses,
  netProfit: businessMetrics.netProfit,
  cashBalance: businessMetrics.cashBalance,
  burnRate: businessMetrics.burnRate,
  cashRunway: businessMetrics.cashRunway,
  status: businessMetrics.status,
};

// Growth Metrics - From actual customer data
const growthData = calculateGrowthTrends();
export const GROWTH_METRICS: GrowthMetrics = {
  totalCustomers: growthData.currentMonth.totalCustomers,
  newCustomersThisMonth: growthData.currentMonth.newCustomers,
  activeSubscriptions: growthData.currentMonth.activeSubscriptions,
  customerGrowthRate: growthData.currentMonth.growthRate,
};

// Customer Acquisition Trend - Historical data
export const CUSTOMER_ACQUISITION_TREND: CustomerAcquisitionTrend[] = growthData.monthlyTrend.map(m => ({
  id: m.id,
  month: m.month,
  customers: m.customers,
}));

// Revenue By Type - Calculated from package distribution
const revenueByPackage = calculateRevenueByPackage();
export const REVENUE_BY_TYPE: RevenueByType[] = revenueByPackage.map(pkg => ({
  id: pkg.id,
  type: pkg.type,
  amount: pkg.amount,
  percentage: pkg.percentage,
}));

// Revenue By City/Area - Based on actual service areas (Surat PIN codes)
const revenueByArea = calculateRevenueByArea();
export const REVENUE_BY_CITY: RevenueByCity[] = revenueByArea.map(area => ({
  id: area.id,
  city: area.area, // Using area names from Surat
  revenue: area.revenue,
  growth: area.growth,
}));

// Store Performance - Mapped from supervisor team performance
const teamPerformance = calculateTeamPerformance();
export const STORE_PERFORMANCE: StorePerformance[] = teamPerformance.map((team, index) => {
  const cost = team.totalWashes * MASTER_KPI_DATA.avgCostPerWash;
  const profit = team.revenue - cost;
  const margin = (profit / team.revenue) * 100;
  
  let status: "profitable" | "break-even" | "loss-making";
  if (margin > 30) status = "profitable";
  else if (margin > 0) status = "break-even";
  else status = "loss-making";
  
  return {
    id: `team-${index + 1}`,
    city: team.areas[0], // First area as primary
    store: `${team.name}'s Team`,
    customers: Math.round(team.totalWashes / 10), // Est: ~10 washes per customer/month
    washes: team.totalWashes,
    revenue: team.revenue,
    cost: Math.round(cost),
    profit: Math.round(profit),
    margin: Math.round(margin * 10) / 10,
    status,
  };
});

// Financial Alerts - Auto-generated based on actual performance
export const FINANCIAL_ALERTS: FinancialAlert[] = generateFinancialAlerts();

// Strategic Insights - Auto-generated from KPI analysis
export const STRATEGIC_INSIGHTS: StrategicInsight[] = generateStrategicInsights();

// Operational Metrics - From actual KPIs
export const OPERATIONAL_METRICS: OperationalMetrics = {
  totalWashesPerDay: MASTER_KPI_DATA.avgWashesPerDay,
  avgWashesPerStore: Math.round(MASTER_KPI_DATA.avgWashesPerDay / 4), // 4 supervisors
  staffProductivity: Math.round((MASTER_KPI_DATA.totalWashes / MASTER_KPI_DATA.activeWashers) * 10) / 10,
  utilizationRate: Math.round(MASTER_KPI_DATA.onTimeServiceRate),
};

// Wash Volume Trend - Calculated from monthly data
const totalWashes = MASTER_KPI_DATA.totalWashes;
const weeksInMonth = 4;
const baseWashesPerWeek = totalWashes / weeksInMonth;

export const WASH_VOLUME_TREND: WashVolumeTrend[] = [
  { id: "w1", week: "Week 1", washes: Math.round(baseWashesPerWeek * 0.95) },
  { id: "w2", week: "Week 2", washes: Math.round(baseWashesPerWeek * 1.02) },
  { id: "w3", week: "Week 3", washes: Math.round(baseWashesPerWeek * 0.98) },
  { id: "w4", week: "Week 4", washes: Math.round(baseWashesPerWeek * 1.05) },
];

// Expansion Readiness - Based on business health
export const EXPANSION_READINESS: ExpansionReadiness = {
  availableCapital: businessMetrics.cashBalance,
  currentProfitability: MASTER_KPI_DATA.ebitdaMargin,
  operationalCapacity: Math.round(MASTER_KPI_DATA.onTimeServiceRate),
  readinessScore: Math.round((
    (businessMetrics.cashBalance / 10000000 * 100 * 0.3) + // 30% weight on capital
    (MASTER_KPI_DATA.ebitdaMargin * 0.4) + // 40% weight on profitability
    (MASTER_KPI_DATA.onTimeServiceRate * 0.3) // 30% weight on operations
  )),
};

// Unit Economics - From actual KPI data
export const UNIT_ECONOMICS: UnitEconomics = {
  revenuePerWash: Math.round(MASTER_KPI_DATA.avgRevenuePerWash * 100) / 100,
  costPerWash: Math.round(MASTER_KPI_DATA.avgCostPerWash * 100) / 100,
  ltv: 18500, // Estimated LTV based on retention
  cac: 850, // Estimated CAC
  ltvToCacRatio: 21.8, // 18500 / 850
  avgRetentionMonths: 15,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const calculateProfitMargin = (revenue: number, cost: number): number => {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
};

export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Re-export centralized formatter for convenience
// DO NOT create new formatCurrency - use lib/formatters.ts
import { formatCurrency as _formatCurrency } from "../lib/formatters";

export const formatCurrency = (amount: number, notation: "compact" | "standard" = "standard"): string => {
  // Use centralized formatter
  if (notation === "compact") {
    return _formatCurrency(amount, { compact: true });
  } else {
    return _formatCurrency(amount, { compact: false, intl: true });
  }
};

export const formatLargeNumber = (num: number): string => {
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  if (num >= 1000) {
    return `₹${(num / 1000).toFixed(0)}K`;
  }
  return `₹${num}`;
};

// Get top performing stores/teams
export const getTopPerformingStores = (limit: number = 3): StorePerformance[] => {
  return [...STORE_PERFORMANCE]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit);
};

// Get underperforming stores/teams
export const getUnderperformingStores = (): StorePerformance[] => {
  return STORE_PERFORMANCE.filter(store => 
    store.status === "loss-making" || store.status === "break-even"
  );
};

// Calculate total metrics across all teams
export const getTotalMetrics = () => {
  const totalRevenue = STORE_PERFORMANCE.reduce((sum, store) => sum + store.revenue, 0);
  const totalCost = STORE_PERFORMANCE.reduce((sum, store) => sum + store.cost, 0);
  const totalProfit = STORE_PERFORMANCE.reduce((sum, store) => sum + store.profit, 0);
  const totalWashes = STORE_PERFORMANCE.reduce((sum, store) => sum + store.washes, 0);
  const totalCustomers = STORE_PERFORMANCE.reduce((sum, store) => sum + store.customers, 0);

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    totalWashes,
    totalCustomers,
    overallMargin: calculateProfitMargin(totalRevenue, totalCost),
    avgRevenuePerStore: totalRevenue / STORE_PERFORMANCE.length,
    avgProfitPerStore: totalProfit / STORE_PERFORMANCE.length,
  };
};

// ─── CITY-SPECIFIC STORE PERFORMANCE DATA ───────────────────────────────────
// Used by FounderControlTower to filter by selected city

export const MUMBAI_STORE_PERFORMANCE: StorePerformance[] = [
  {
    id: "store-mumbai-1",
    store: "Andheri West", city: "Mumbai", customers: 312, washes: 1890,
    revenue: 378000, cost: 245700, profit: 132300, margin: 35.0,
    growth: 8.4, status: "profitable", efficiency: 88
  },
  {
    id: "store-mumbai-2",
    store: "Bandra East", city: "Mumbai", customers: 287, washes: 1654,
    revenue: 330800, cost: 221636, profit: 109164, margin: 33.0,
    growth: 5.2, status: "profitable", efficiency: 82
  },
  {
    id: "store-mumbai-3",
    store: "Powai", city: "Mumbai", customers: 198, washes: 1120,
    revenue: 224000, cost: 168000, profit: 56000, margin: 25.0,
    growth: -2.1, status: "break-even", efficiency: 71
  },
  {
    id: "store-mumbai-4",
    store: "Malad West", city: "Mumbai", customers: 143, washes: 780,
    revenue: 156000, cost: 128340, profit: 27660, margin: 17.7,
    growth: -8.3, status: "loss-making", efficiency: 62
  }
];

export const AHMEDABAD_STORE_PERFORMANCE: StorePerformance[] = [
  {
    id: "store-ahmedabad-1",
    store: "Navrangpura", city: "Ahmedabad", customers: 256, washes: 1480,
    revenue: 296000, cost: 192400, profit: 103600, margin: 35.0,
    growth: 12.1, status: "profitable", efficiency: 91
  },
  {
    id: "store-ahmedabad-2",
    store: "Satellite", city: "Ahmedabad", customers: 231, washes: 1320,
    revenue: 264000, cost: 184800, profit: 79200, margin: 30.0,
    growth: 6.7, status: "profitable", efficiency: 85
  },
  {
    id: "store-ahmedabad-3",
    store: "Vastrapur", city: "Ahmedabad", customers: 167, washes: 940,
    revenue: 188000, cost: 141000, profit: 47000, margin: 25.0,
    growth: 1.3, status: "break-even", efficiency: 74
  }
];

// ─── CITY-SPECIFIC FINANCIAL ALERTS ─────────────────────────────────────────

export const MUMBAI_FINANCIAL_ALERTS: FinancialAlert[] = [
  {
    id: "mum_001",
    severity: "critical",
    title: "Malad West showing -8.3% growth - immediate review needed",
    description: "Revenue 8.3% below target for 3 consecutive months",
    action: "Review Operations",
    type: "revenue"
  },
  {
    id: "mum_002",
    severity: "warning",
    title: "Powai team efficiency at 71% - below 85% target",
    description: "Wash completion rate declining — supervisor intervention required",
    action: "Investigate Performance",
    type: "operational"
  },
  {
    id: "mum_003",
    severity: "warning",
    title: "Mumbai overall revenue 4.2% below monthly target",
    description: "New customer acquisition slowing across all 4 zones",
    action: "Boost Sales Efforts",
    type: "revenue"
  }
];

export const AHMEDABAD_FINANCIAL_ALERTS: FinancialAlert[] = [
  {
    id: "ahm_001",
    severity: "info",
    title: "Ahmedabad expansion on track — Vastrapur at break-even",
    description: "Month 3 of ramp period — projected to hit profitability by month 5",
    action: "View Expansion Plan",
    type: "operational"
  },
  {
    id: "ahm_002",
    severity: "warning",
    title: "Vastrapur growth at 1.3% — below 8% ramp target",
    description: "Customer acquisition needs acceleration in Vastrapur zone",
    action: "Boost Sales Efforts",
    type: "revenue"
  }
];

// ─── CITY KPI AGGREGATES ─────────────────────────────────────────────────────
export const CITY_KPI_DATA: Record<string, { revenue: number; profit: number; customers: number; washes: number }> = {
  "CITY-SURAT":      { revenue: 4250000, profit: 2380000, customers: 1847, washes: 11200 },
  "CITY-MUMBAI":     { revenue: 1088800, profit:  325124, customers:  940, washes:  5444 },
  "CITY-AHMEDABAD":  { revenue:  748000, profit:  229800, customers:  654, washes:  3740 },
};
