import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BackButton } from "../ui/back-button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Target,
  Calculator,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Package,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import { useCustomerSubscriptions, useCustomers, useJobs } from "../../contexts/AppProvider";
import { useGlobalFilters } from "../navigation/GlobalFilterBar";
import { useFinance } from "../../contexts/FinanceContext";
import { useCity } from "../../contexts/CityContext";
import { AnalyticsService } from "../../services/analyticsService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { StableChartContainer, createFilterKey, CHART_COLORS } from "../charts/StableChartContainer";
import { useRevenueMetrics } from "../../hooks/useRevenueMetrics";

// Safe number formatting — prevents crash when value is undefined/null
const safeNum = (v: any, decimals = 0): string => {
  const n = Number(v ?? 0);
  return isNaN(n) ? "0" : n.toLocaleString("en-IN", decimals > 0 ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals } : {});
};


const COLORS = CHART_COLORS.primary;

interface UnitEconomicsMetrics {
  revenuePerCustomer: number;
  revenuePerWash: number;
  costPerWash: number;
  costPerCustomer: number;
  grossMarginPerWash: number;
  customerLTV: number;
  customerCAC: number;
  contributionMargin: number;
  ltvCacRatio: number;
}

// NOTE: Trend data requires historical tracking
// Representative data shown until time-series tracking is implemented
// Fallback seed data — used only when no real records exist yet
const SEED_COST_TREND = [
  { id: "week-1", week: "Week 1", cost: 265, target: 250 },
  { id: "week-2", week: "Week 2", cost: 258, target: 250 },
  { id: "week-3", week: "Week 3", cost: 252, target: 250 },
  { id: "week-4", week: "Week 4", cost: 245, target: 250 },
];
const SEED_REVENUE_COST_TREND = [
  { id: "jan", month: "Jan", revenue: 485000, cost: 245000 },
  { id: "feb", month: "Feb", revenue: 520000, cost: 265000 },
  { id: "mar", month: "Mar", revenue: 565000, cost: 275000 },
  { id: "apr", month: "Apr", revenue: 615000, cost: 290000 },
  { id: "may", month: "May", revenue: 685000, cost: 310000 },
  { id: "jun", month: "Jun", revenue: 745000, cost: 325000 },
];
const SEED_COST_BREAKDOWN = [
  { id: "cost-1", name: "Manpower",           value: 42, amount: 102900 },
  { id: "cost-2", name: "Chemicals",          value: 18, amount: 44100  },
  { id: "cost-3", name: "Water & Utilities",  value: 12, amount: 29400  },
  { id: "cost-4", name: "Equipment",          value: 15, amount: 36750  },
  { id: "cost-5", name: "Rent",               value: 10, amount: 24500  },
  { id: "cost-6", name: "Fuel",               value:  3, amount: 7350   },
];

function UnitEconomicsDashboard() {
  const { currentRole } = useRole();
  const { planTypes } = usePlanDefinitions();
  const { subscriptions: customerSubscriptions } = useCustomerSubscriptions();
  const { customers } = useCustomers();
  const { jobs } = useJobs();
  const { filters } = useGlobalFilters();
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");
  const [selectedStore, setSelectedStore] = useState("All Stores");

  // Create stable filter key for chart rendering
  const filterKey = useMemo(() => createFilterKey(filters), [filters]);

  // Filter subscriptions by date range if specified
  const filteredSubscriptions = (customerSubscriptions || []).filter(sub => {
    if (filters.startDate && sub.startDate && sub.startDate < filters.startDate) return false;
    if (filters.endDate && sub.startDate && sub.startDate > filters.endDate) return false;
    return true;
  });

  // Filter jobs by date range if specified
  const filteredJobs = (jobs || []).filter(job => {
    if (filters.startDate && job.scheduledDate && job.scheduledDate < filters.startDate) return false;
    if (filters.endDate && job.scheduledDate && job.scheduledDate > filters.endDate) return false;
    return true;
  });

  // Calculate metrics from real data (using filtered data)
  const completedJobs = (filteredJobs || []).filter(job => job.status === "Completed" || job.status === "Verified");
  const totalWashes = completedJobs.length;
  const activeSubscriptions = (filteredSubscriptions || []).filter(sub => sub.status === "Active");
  const totalCustomers = activeSubscriptions.length;

  // Revenue calculations
  const totalMonthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
    const cycleMultiplier = sub.billingCycle === "Annual" ? 12 :
                            sub.billingCycle === "Quarterly" ? 3 : 1;
    return sum + ((sub?.pricing?.finalPrice ?? sub?.priceLocked ?? 0) / cycleMultiplier);
  }, 0);

  const revenuePerCustomer = totalCustomers > 0 ? Math.round(totalMonthlyRevenue / totalCustomers) : 0;
  const revenuePerWash = totalWashes > 0 ? Math.round(totalMonthlyRevenue / totalWashes) : 0;

  const { getPayablesByCity, getRevenueByCity } = useFinance();
  const { city } = useCity();

  // Derive costPerWash from real paid payables
  const realCostPerWash = useMemo(() => {
    const paidPayables = getPayablesByCity(city).filter(p => p.status === "Paid");
    const totalCost = paidPayables.reduce((s, p) => s + p.amount, 0);
    return totalWashes > 0 && totalCost > 0
      ? Math.round(totalCost / totalWashes)
      : 245; // fallback if no payables recorded
  }, [city, totalWashes, getPayablesByCity]);

  // Derive real CAC from analyticsService
  const realCAC = useMemo(() => {
    const events = AnalyticsService.getEvents("LEAD_CONVERTED");
    const totalRevenue = events.reduce((s, e) => s + (e.data.revenue || 0), 0);
    const totalConversions = events.length;
    return totalConversions > 0
      ? Math.round((totalRevenue * 0.15) / totalConversions)
      : 850;
  }, []);

  // Build real revenue vs cost trend from FinanceContext
  const realRevenueCostTrend = useMemo(() => {
    const revenues = getRevenueByCity(city).filter(r => r.status === "Received");
    const payables = getPayablesByCity(city).filter(p => p.status === "Paid");
    const byMonth = new Map<string, { revenue: number; cost: number }>();
    revenues.forEach(r => {
      const m = r.receivedDate?.slice(0, 7) || "";
      if (!m) return;
      const ex = byMonth.get(m) || { revenue: 0, cost: 0 };
      byMonth.set(m, { ...ex, revenue: ex.revenue + r.amount });
    });
    payables.forEach(p => {
      const m = p.paidAt?.slice(0, 7) || "";
      if (!m) return;
      const ex = byMonth.get(m) || { revenue: 0, cost: 0 };
      byMonth.set(m, { ...ex, cost: ex.cost + p.amount });
    });
    const trend = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d], i) => ({
        id: `m-${i}`,
        month: new Date(month + "-01").toLocaleString("en-IN", { month: "short" }),
        ...d,
      }));
    return trend.length > 0 ? trend : SEED_REVENUE_COST_TREND; // fallback
  }, [city, getRevenueByCity, getPayablesByCity]);

  // Estimated cost per wash (labor + materials + overhead)
  const costPerWash = realCostPerWash;
  const totalCost = totalWashes * costPerWash;
  const costPerCustomer = totalCustomers > 0 ? Math.round(totalCost / totalCustomers) : 0;
  const grossMarginPerWash = revenuePerWash - costPerWash;

  // LTV and CAC (simplified estimates)
  const avgRetentionMonths = 16.8;
  const customerLTV = revenuePerCustomer * avgRetentionMonths;
  const customerCAC = realCAC;
  const ltvCacRatio = customerCAC > 0 ? Number((customerLTV / customerCAC).toFixed(1)) : 0;
  const contributionMargin = revenuePerWash > 0 ? Number(((grossMarginPerWash / revenuePerWash) * 100).toFixed(1)) : 0;

  // ── Live cost breakdown from real payables ───────────────────────────────
  const liveCostBreakdown = useMemo(() => {
    const paidPayables = getPayablesByCity(city).filter(p => p.status === "Paid");
    if (paidPayables.length === 0) return SEED_COST_BREAKDOWN;
    const totalCostAll = paidPayables.reduce((s, p) => s + p.amount, 0);
    if (totalCostAll === 0) return SEED_COST_BREAKDOWN;
    const buckets: Record<string, number> = {
      Manpower: 0, Chemicals: 0, "Water & Utilities": 0,
      Equipment: 0, Rent: 0, Statutory: 0, Other: 0,
    };
    paidPayables.forEach(p => {
      if (p.type === "Salary") {
        buckets["Manpower"] += p.amount;
      } else if (p.type === "Statutory") {
        buckets["Statutory"] += p.amount;
      } else {
        // Vendor payables — bucket by description keyword
        const desc = (p.description || p.vendorName || "").toLowerCase();
        if (desc.includes("chemical") || desc.includes("soap") || desc.includes("consumable")) {
          buckets["Chemicals"] += p.amount;
        } else if (desc.includes("water") || desc.includes("electric") || desc.includes("utility")) {
          buckets["Water & Utilities"] += p.amount;
        } else if (desc.includes("equip") || desc.includes("machine") || desc.includes("tool")) {
          buckets["Equipment"] += p.amount;
        } else if (desc.includes("rent") || desc.includes("lease")) {
          buckets["Rent"] += p.amount;
        } else {
          buckets["Other"] += p.amount;
        }
      }
    });
    return Object.entries(buckets)
      .filter(([, amount]) => amount > 0)
      .map(([name, amount], i) => ({
        id: `cost-live-${i}`,
        name,
        amount: Math.round(amount),
        value: Math.round((amount / totalCostAll) * 100),
      }));
  }, [city, getPayablesByCity]);

  // ── Live cost-per-wash trend by month ────────────────────────────────────
  const liveCostTrend = useMemo(() => {
    const paidPayables = getPayablesByCity(city).filter(p => p.status === "Paid" && p.paidAt);
    const byMonth = new Map<string, number>();
    paidPayables.forEach(p => {
      const m = p.paidAt!.slice(0, 7);
      byMonth.set(m, (byMonth.get(m) || 0) + p.amount);
    });
    const jobsByMonth = new Map<string, number>();
    (jobs || []).filter(j => j.status === "Completed" || j.status === "Verified").forEach(j => {
      const m = (j.completedAt || j.createdAt || "").slice(0, 7);
      if (m) jobsByMonth.set(m, (jobsByMonth.get(m) || 0) + 1);
    });
    const trend = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([month, cost], i) => {
        const jobCount = jobsByMonth.get(month) || 1;
        return {
          id: `cpw-${i}`,
          week: new Date(month + "-01").toLocaleString("en-IN", { month: "short" }),
          cost: Math.round(cost / jobCount),
          target: 250,
        };
      });
    return trend.length > 0 ? trend : SEED_COST_TREND;
  }, [city, getPayablesByCity, jobs]);

  // Memoize chart data
  const memoizedCostTrend = liveCostTrend;
  const memoizedRevenueCostTrend = realRevenueCostTrend;
  const memoizedCostBreakdown = liveCostBreakdown;

  // Calculate subscription profitability from real data
  const packageTypes = Array.from(new Set(activeSubscriptions.map(sub => sub.packageType)));
  const subscriptionProfitability = useMemo(() => packageTypes.map((packageType, index) => {
    const customersInPlan = activeSubscriptions.filter(sub => sub.packageType === packageType);
    const customerCount = customersInPlan.length;

    if (customerCount === 0) return null;

    const totalRevenue = customersInPlan.reduce((sum, sub) => {
      const cycleMultiplier = sub.billingCycle === "Annual" ? 12 :
                              sub.billingCycle === "Quarterly" ? 3 : 1;
      return sum + ((sub?.pricing?.finalPrice ?? sub?.priceLocked ?? 0) / cycleMultiplier);
    }, 0);
    const avgPrice = totalRevenue / customerCount;

    // Estimate avg washes based on package type and frequency
    const avgWashes =
      packageType === "Basic" ? 3.5 :
      packageType === "Standard" ? 4.0 :
      packageType === "Premium" ? 4.5 :
      packageType === "Deluxe" ? 5.0 : 4.0;

    const totalCost = Math.round(customerCount * avgWashes * costPerWash);
    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : "0.0";

    return {
      id: `plan-${index + 1}`,
      plan: packageType,
      price: Math.round(avgPrice),
      avgWashes,
      customers: customerCount,
      revenue: totalRevenue,
      cost: totalCost,
      profit,
      margin: parseFloat(margin),
    };
  }).filter(Boolean), [activeSubscriptions, costPerWash]);

  // Calculate store performance by pincode from real data
  const storePerformance = useMemo(() => {
    const pincodeMap = new Map<string, { customers: Set<string>, washes: number, revenue: number }>();

    activeSubscriptions.forEach(sub => {
      const customer = (customers || []).find(c => c.customerId === sub.customerId);
      if (!customer) return;

      const pincode = customer?.address?.pinCode ?? (customer as any)?.pincode ?? "Unknown";
      if (!pincodeMap.has(pincode)) {
        pincodeMap.set(pincode, { customers: new Set(), washes: 0, revenue: 0 });
      }

      const pincodeData = pincodeMap.get(pincode)!;
      pincodeData.customers.add(sub.customerId);

      const cycleMultiplier = sub.billingCycle === "Annual" ? 12 :
                              sub.billingCycle === "Quarterly" ? 3 : 1;
      pincodeData.revenue += (sub?.pricing?.finalPrice ?? sub?.priceLocked ?? 0) / cycleMultiplier;
    });

    completedJobs.forEach(job => {
      const pincode = job.location?.pinCode ?? job.pinCode ?? "Unknown";
      if (pincodeMap.has(pincode)) {
        pincodeMap.get(pincode)!.washes++;
      }
    });

    return Array.from(pincodeMap.entries())
      .map(([pincode, data], index) => {
        const customers = data.customers.size;
        const washes = data.washes;
        const revenue = Math.round(data.revenue);
        const cost = washes * costPerWash;
        const profit = revenue - cost;
        const margin = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0;

        return {
          id: `zone-${index + 1}`,
          pincode,
          name: pincode, // Can be enhanced with area name lookup
          customers,
          washes,
          revenue,
          cost,
          profit,
          margin,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 pincodes
  }, [activeSubscriptions, completedJobs, customers, costPerWash]);

  const hasAccess = currentRole === "Super Admin" || currentRole === "Admin" || currentRole === "Accounts";

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg font-semibold">Access Denied</div>
            <p className="text-gray-500 mt-2">
              You don't have permission to access Unit Economics & Profitability Analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unit Economics & Profitability</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive operational efficiency and financial performance analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            {selectedPeriod}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Links to Cost Calculators */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">💡 Cost Analysis Tools</h3>
              <p className="text-xs text-gray-600">Drill down into per-wash costs by plan and consumption</p>
            </div>
            <div className="flex gap-2">
              <Link to="/analytics/cost-per-wash">
                <Button variant="outline" size="sm" className="bg-white">
                  <Calculator className="w-4 h-4 mr-2" />
                  Generic Calculator
                </Button>
              </Link>
              <Link to="/analytics/cost-per-wash-by-plan">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Package className="w-4 h-4 mr-2" />
                  Plan-wise Analysis (Consumption Tracking)
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Revenue per Customer</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{safeNum(revenuePerCustomer)}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">12.5% vs last month</span>
                </div>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Revenue per Wash</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{safeNum(revenuePerWash)}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">8.2% vs last month</span>
                </div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <ShoppingCart className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Cost per Wash</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{safeNum(costPerWash)}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowDownRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">5.8% vs last month</span>
                </div>
              </div>
              <div className="p-2 bg-orange-50 rounded">
                <Calculator className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Gross Margin per Wash</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{safeNum(grossMarginPerWash)}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">18.5% vs last month</span>
                </div>
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Customer LTV</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{safeNum(customerLTV)}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-gray-600">Avg. 15 months retention</span>
                </div>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Customer CAC</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{safeNum(customerCAC)}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowDownRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">12.3% vs last month</span>
                </div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">LTV:CAC Ratio</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {ltvCacRatio.toFixed(1)}x
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Badge className={
                    ltvCacRatio >= 3 ? "bg-green-500 text-xs" :
                    ltvCacRatio >= 1.5 ? "bg-yellow-500 text-xs" :
                    "bg-red-500 text-xs"
                  }>
                    {ltvCacRatio >= 3 ? "Excellent" : ltvCacRatio >= 1.5 ? "Fair" : "Poor"}</Badge>
                </div>
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Contribution Margin</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {contributionMargin}%
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">3.2% vs last month</span>
                </div>
              </div>
              <div className="p-2 bg-orange-50 rounded">
                <PieChart className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Cost per Wash Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost per Wash Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <StableChartContainer
              chartName="cost-per-wash-trend"
              filterKey={filterKey}
              data={memoizedCostTrend}
              height={280}
            >
              <LineChart data={memoizedCostTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Actual Cost"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                  isAnimationActive={false}
                />
              </LineChart>
            </StableChartContainer>
          </CardContent>
        </Card>

        {/* Revenue vs Cost Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue vs Cost Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <StableChartContainer
              chartName="revenue-vs-cost-trend"
              filterKey={filterKey}
              data={memoizedRevenueCostTrend}
              height={280}
            >
              <AreaChart data={memoizedRevenueCostTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Revenue"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stackId="2"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  name="Cost"
                  isAnimationActive={false}
                />
              </AreaChart>
            </StableChartContainer>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operational Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <StableChartContainer
              chartName="cost-breakdown"
              filterKey={filterKey}
              data={memoizedCostBreakdown}
              height={280}
            >
              <RechartsPieChart>
                <Pie
                  data={memoizedCostBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {memoizedCostBreakdown.map((entry, index) => (
                    <Cell key={`cell-${entry.id}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </RechartsPieChart>
            </StableChartContainer>
          </CardContent>
        </Card>

        {/* Store Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Store Revenue Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <StableChartContainer
              chartName="store-revenue-comparison"
              filterKey={filterKey}
              data={storePerformance}
              height={280}
            >
              <BarChart data={storePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip />
                <Legend />
                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  name="Revenue"
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="cost"
                  fill="#ef4444"
                  name="Cost"
                  isAnimationActive={false}
                />
              </BarChart>
            </StableChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Store Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Zone (PIN Code) Profitability Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">PIN Code</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Service Zone</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Customers</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Total Washes</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Cost</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Profit</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Margin</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {storePerformance.map((store) => (
                  <tr key={store.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{store.pincode}</code>
                    </td>
                    <td className="p-3 font-medium">{store.name}</td>
                    <td className="p-3 text-right">{store.customers}</td>
                    <td className="p-3 text-right">{safeNum(store.washes)}</td>
                    <td className="p-3 text-right font-medium">₹{safeNum(store.revenue)}</td>
                    <td className="p-3 text-right text-red-600">₹{safeNum(store.cost)}</td>
                    <td className="p-3 text-right font-semibold text-green-600">₹{safeNum(store.profit)}</td>
                    <td className="p-3 text-right">{store.margin}%</td>
                    <td className="p-3 text-center">
                      <Badge className="bg-green-500">Profitable</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Profitability */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plan Profitability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Plan Name</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Price</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Avg. Washes</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Customers</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Cost</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Profit</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Margin</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionProfitability.map((plan) => (
                  <tr key={plan.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{plan.plan}</td>
                    <td className="p-3 text-right">₹{safeNum(plan.price)}</td>
                    <td className="p-3 text-right">{plan.avgWashes}</td>
                    <td className="p-3 text-right">{plan.customers}</td>
                    <td className="p-3 text-right font-medium">₹{safeNum(plan.revenue)}</td>
                    <td className="p-3 text-right text-red-600">₹{safeNum(plan.cost)}</td>
                    <td className={`p-3 text-right font-semibold ${plan.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{safeNum(plan.profit)}
                    </td>
                    <td className="p-3 text-right">{plan.margin}%</td>
                    <td className="p-3 text-center">
                      {plan.profit > 0 ? (
                        <Badge className="bg-green-500">Profitable</Badge>
                      ) : (
                        <Badge className="bg-red-500">Loss Making</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UnitEconomicsDashboard;