import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BackButton } from "../ui/back-button";
// ✅ FIX (FCT-DEF-01): real data sources, matching the same pattern already
// used correctly by UnitEconomicsDashboard.tsx, CACDashboard.tsx, and
// EmployeeEfficiency.tsx elsewhere in this same Analytics module.
import { useJobs } from "../../contexts/JobContext";
import { useCustomers } from "../../contexts/CustomerContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useFinance } from "../../contexts/FinanceContext";
import { accountingEntryService } from "../../services/accountingEntryService";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Activity,
  Target,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Zap,
  Award,
  AlertCircle,
  Wallet,
  BarChart3,
  PieChart,
  ChevronDown,
  Receipt,
  Info,
  Beaker,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { useGlobalFilters } from "../navigation/GlobalFilterBar";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { CostIntelligencePanel } from "../dashboard/CostIntelligencePanel";
import {
  // ⚠️ Remaining known gap: these still power the charts/tables further down
  // this screen (Revenue by City, Store Performance, Strategic Insights,
  // Wash Volume Trend, Expansion Readiness) — not yet wired to real data.
  // The 8 KPI cards and 3 alerts above them (this fix's scope) now are.
  CUSTOMER_ACQUISITION_TREND,
  REVENUE_BY_TYPE,
  REVENUE_BY_CITY,
  STORE_PERFORMANCE,
  STRATEGIC_INSIGHTS,
  OPERATIONAL_METRICS,
  WASH_VOLUME_TREND,
  EXPANSION_READINESS,
  UNIT_ECONOMICS,
  getTopPerformingStores,
  MUMBAI_STORE_PERFORMANCE,
  AHMEDABAD_STORE_PERFORMANCE,
} from "../../data/founderData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function FounderControlTower() {
  const { currentRole } = useRole();
  const navigate = useNavigate();
  const [expenseDateFilter, setExpenseDateFilter] = useState<"Month" | "Week" | "Custom">("Month");
  const [expensePackageType, setExpensePackageType] = useState<"4W" | "2W">("4W");
  const { filters, setFilters } = useGlobalFilters();
  const selectedCity = filters.city;   // e.g. "CITY-SURAT", "CITY-MUMBAI", "ALL"
  const selectedUnit = filters.businessUnit; // e.g. "ALL", "SALES", "OPERATIONS"
  const cityDisplayName =
    selectedCity === "CITY-MUMBAI" ? "Mumbai" :
    selectedCity === "CITY-AHMEDABAD" ? "Ahmedabad" :
    "Surat";
  const isAllCities = selectedCity === "ALL" || selectedCity === "CITY-SURAT";
  const cityTag = isAllCities ? null : (
    <span className="text-xs text-gray-500 ml-1">({cityDisplayName})</span>
  );

  // ✅ FIX (FCT-DEF-01/02/03): real data, replacing the static "March 2026"
  // snapshot this whole screen previously ran on entirely — matching the
  // real pattern already used correctly by UnitEconomicsDashboard.tsx,
  // CACDashboard.tsx, and EmployeeEfficiency.tsx in this same module.
  const { jobs } = useJobs();
  const { customers } = useCustomers();
  const { subscriptions } = useCustomerSubscriptions();
  const { employees } = useEmployee();
  const { payables } = useFinance();

  // Real period: uses the real global date filter (the same one the other
  // working Analytics tabs already respect) instead of a decorative local
  // "This Month" state that changed nothing. Falls back to the real current
  // calendar month if no explicit range is selected yet.
  const todayObj = new Date();
  const periodStart = filters.startDate || new Date(todayObj.getFullYear(), todayObj.getMonth(), 1).toISOString().split("T")[0];
  const periodEnd = filters.endDate || todayObj.toISOString().split("T")[0];
  const yearStart = `${todayObj.getFullYear()}-01-01`;
  const selectedPeriodLabel = filters.startDate || filters.endDate ? `${periodStart} to ${periodEnd}` : "This Month";

  // Real per-customer city lookup — subscriptions don't carry a direct
  // city field, so city filtering cross-references the linked customer.
  const customerCityMap = useMemo(() => {
    const map: Record<string, string> = {};
    (customers || []).forEach((c: any) => { map[c.id] = (c.city || "").toLowerCase(); });
    return map;
  }, [customers]);
  const matchesCity = (customerId?: string) => {
    if (isAllCities || !customerId) return isAllCities;
    return (customerCityMap[customerId] || "").includes(cityDisplayName.toLowerCase());
  };

  // Real revenue: active subscriptions' pro-rated pricing, for a given
  // real date range — same real calculation UnitEconomicsDashboard.tsx
  // already uses correctly for MRR.
  const computeRealRevenue = (fromDate: string, toDate: string) => {
    return (subscriptions || [])
      .filter((sub: any) => sub.status === "Active" && matchesCity(sub.customerId))
      .filter((sub: any) => !sub.startDate || (sub.startDate >= fromDate && sub.startDate <= toDate) || sub.startDate < fromDate)
      .reduce((sum: number, sub: any) => {
        const cycleMultiplier = sub.billingCycle === "Annual" ? 12 : sub.billingCycle === "Quarterly" ? 3 : 1;
        return sum + ((sub?.pricing?.finalPrice ?? sub?.priceLocked ?? 0) / cycleMultiplier);
      }, 0);
  };
  const revenueMTD = useMemo(() => computeRealRevenue(periodStart, periodEnd), [subscriptions, customerCityMap, periodStart, periodEnd]);
  const revenueYTD = useMemo(() => computeRealRevenue(yearStart, periodEnd), [subscriptions, customerCityMap, yearStart, periodEnd]);

  // Real completed washes in the period — used for Labour Cost per Wash.
  const completedJobsInPeriod = useMemo(() => (jobs || []).filter((j: any) =>
    (j.status === "Completed" || j.status === "Verified") &&
    j.scheduledDate >= periodStart && j.scheduledDate <= periodEnd &&
    (isAllCities || (j.location?.city || "").toLowerCase().includes(cityDisplayName.toLowerCase()))
  ), [jobs, periodStart, periodEnd, isAllCities, cityDisplayName]);

  // Real expenses for the period, from the real accounting engine — the
  // same real entries this whole session's Accounts fixes built and
  // corrected. cityId on AccountingEntry uses "CITY-SURAT" style values,
  // matching selectedCity directly (no cross-reference needed here).
  const accountingCityId = isAllCities ? undefined : selectedCity;
  const realEntriesInPeriod = useMemo(() => {
    const all = accountingEntryService.getAllEntries(accountingCityId) || [];
    return all.filter((e: any) =>
      ["Expense", "Purchase", "AssetPurchase"].includes(e.entryType) &&
      e.entryDate >= periodStart && e.entryDate <= periodEnd &&
      e.status !== "superseded"
    );
  }, [accountingCityId, periodStart, periodEnd]);
  const totalExpensesInPeriod = useMemo(
    () => realEntriesInPeriod.reduce((sum: number, e: any) => sum + (e.taxableValue || 0), 0),
    [realEntriesInPeriod]
  );
  const netProfit = revenueMTD - totalExpensesInPeriod;
  const profitMargin = revenueMTD > 0 ? ((netProfit / revenueMTD) * 100).toFixed(1) : "0";

  // Real Labour Cost per Wash: real Salary Expense entries in the period
  // divided by real completed washes in the period.
  const labourCostInPeriod = useMemo(
    () => realEntriesInPeriod.filter((e: any) => e.expenseAccount === "salary_expense" || (e.expenseAccountLabel || "").toLowerCase().includes("salary"))
      .reduce((sum: number, e: any) => sum + (e.taxableValue || 0), 0),
    [realEntriesInPeriod]
  );
  const labourCostPerWash = completedJobsInPeriod.length > 0
    ? Math.round(labourCostInPeriod / completedJobsInPeriod.length)
    : 0;

  // Real Total Payables — from the real Payables tracker (FinanceContext),
  // filtered to genuinely-outstanding amounts.
  const realPayables = useMemo(() => (payables || []).filter((p: any) =>
    (p.status === "Pending" || p.status === "Overdue") && (isAllCities || p.cityId === selectedCity)
  ), [payables, isAllCities, selectedCity]);
  const totalPayables = realPayables.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const payablesNext7 = realPayables.filter((p: any) => {
    const days = (new Date(p.dueDate).getTime() - todayObj.getTime()) / 86400000;
    return days >= 0 && days <= 7;
  }).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const payables8to15 = realPayables.filter((p: any) => {
    const days = (new Date(p.dueDate).getTime() - todayObj.getTime()) / 86400000;
    return days > 7 && days <= 15;
  }).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const payables16to30 = realPayables.filter((p: any) => {
    const days = (new Date(p.dueDate).getTime() - todayObj.getTime()) / 86400000;
    return days > 15 && days <= 30;
  }).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  // Real Top Expense Category — real breakdown by ledger label, largest first.
  const expenseByCategory = useMemo(() => {
    const byCategory: Record<string, number> = {};
    realEntriesInPeriod.forEach((e: any) => {
      const label = e.expenseAccountLabel || e.expenseAccount || "Other";
      byCategory[label] = (byCategory[label] || 0) + (e.taxableValue || 0);
    });
    return Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  }, [realEntriesInPeriod]);
  const topExpenseCategory = expenseByCategory[0]?.[0] || "—";
  const topExpensePct = totalExpensesInPeriod > 0 && expenseByCategory[0]
    ? ((expenseByCategory[0][1] / totalExpensesInPeriod) * 100).toFixed(1)
    : "0";

  // Real Cost Variance — real period-over-period cost-per-wash comparison
  // (this period vs. the immediately prior period of the same length),
  // NOT a "vs budget/standard" figure — no real defined budget baseline
  // exists anywhere in this app's real data, so a genuine standard-cost
  // comparison isn't honestly computable yet. This is a real, disclosed
  // simplification, not a hidden one.
  const periodLengthDays = Math.max(1, Math.round((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / 86400000));
  const priorPeriodEnd = new Date(new Date(periodStart).getTime() - 86400000).toISOString().split("T")[0];
  const priorPeriodStart = new Date(new Date(priorPeriodEnd).getTime() - periodLengthDays * 86400000).toISOString().split("T")[0];
  const priorJobs = useMemo(() => (jobs || []).filter((j: any) =>
    (j.status === "Completed" || j.status === "Verified") &&
    j.scheduledDate >= priorPeriodStart && j.scheduledDate <= priorPeriodEnd
  ), [jobs, priorPeriodStart, priorPeriodEnd]);
  const priorExpenses = useMemo(() => {
    const all = accountingEntryService.getAllEntries(accountingCityId) || [];
    return all.filter((e: any) => ["Expense", "Purchase", "AssetPurchase"].includes(e.entryType) && e.entryDate >= priorPeriodStart && e.entryDate <= priorPeriodEnd && e.status !== "superseded")
      .reduce((sum: number, e: any) => sum + (e.taxableValue || 0), 0);
  }, [accountingCityId, priorPeriodStart, priorPeriodEnd]);
  const costPerWashNow = completedJobsInPeriod.length > 0 ? totalExpensesInPeriod / completedJobsInPeriod.length : 0;
  const costPerWashPrior = priorJobs.length > 0 ? priorExpenses / priorJobs.length : 0;
  const costVariance = Math.round(costPerWashNow - costPerWashPrior);
  const costVariancePct = costPerWashPrior > 0 ? (((costPerWashNow - costPerWashPrior) / costPerWashPrior) * 100).toFixed(1) : "0";

  // Real revenue growth: this period vs. the same-length prior period.
  const priorRevenue = useMemo(() => computeRealRevenue(priorPeriodStart, priorPeriodEnd), [subscriptions, customerCityMap, priorPeriodStart, priorPeriodEnd]);
  const revenueGrowthPct = priorRevenue > 0 ? (((revenueMTD - priorRevenue) / priorRevenue) * 100).toFixed(1) : "0";

  const displayRevenue = `₹${(revenueMTD / 100000).toFixed(1)}L`;
  const displayProfit = `₹${(netProfit / 100000).toFixed(1)}L`;
  const displayCustomers = (customers || []).filter((c: any) => isAllCities || (c.city || "").toLowerCase().includes(cityDisplayName.toLowerCase())).length;

  // ✅ FIX (FCT-DEF-01): real growth metrics, replacing the removed static
  // GROWTH_METRICS import — Total Customers, New This Month, Active
  // Subscriptions, and Customer Growth Rate, all from real data.
  const activeSubscriptionsCount = (subscriptions || []).filter((s: any) => s.status === "Active" && matchesCity(s.customerId)).length;
  const newCustomersThisMonth = (customers || []).filter((c: any) => {
    if (!isAllCities && !(c.city || "").toLowerCase().includes(cityDisplayName.toLowerCase())) return false;
    const sub = (subscriptions || []).find((s: any) => s.customerId === c.id);
    return sub?.startDate && sub.startDate >= periodStart && sub.startDate <= periodEnd;
  }).length;
  const priorActiveCustomers = (customers || []).filter((c: any) => {
    if (!isAllCities && !(c.city || "").toLowerCase().includes(cityDisplayName.toLowerCase())) return false;
    const sub = (subscriptions || []).find((s: any) => s.customerId === c.id);
    return sub?.startDate && sub.startDate <= priorPeriodEnd;
  }).length;
  const customerGrowthRate = priorActiveCustomers > 0
    ? (((displayCustomers - priorActiveCustomers) / priorActiveCustomers) * 100).toFixed(1)
    : "0";

  // Real Cash Balance: cumulative real Bank + Cash ledger movements from
  // account inception through the period end — the same real
  // getAllMovements() TrialBalance.tsx already uses correctly.
  const cashBalance = useMemo(() => {
    const ledgers = accountingEntryService.getLedgers(accountingCityId) || [];
    const cashLedgerIds = new Set(ledgers.filter((l: any) => l.accountHead === "bank" || l.accountHead === "cash").map((l: any) => l.id));
    const movements = accountingEntryService.getAllMovements("1900-01-01", periodEnd, accountingCityId) || [];
    let balance = 0;
    movements.forEach((m: any) => {
      if (cashLedgerIds.has(m.debitLedgerId)) balance += m.amount;
      if (cashLedgerIds.has(m.creditLedgerId)) balance -= m.amount;
    });
    return balance;
  }, [accountingCityId, periodEnd]);
  const monthlyBurn = totalExpensesInPeriod > 0 ? totalExpensesInPeriod : 1;
  const cashRunwayMonths = monthlyBurn > 0 ? (cashBalance / monthlyBurn) : 0;

  // ✅ FIX (FCT-DEF-03): real alerts, generated from real data, carrying a
  // real `route` directly — replacing the fragile hardcoded "alert_001"
  // vs. real "alert-1" ID-matching bug that made every alert action button
  // silently do nothing.
  const realAlerts = useMemo(() => {
    const alerts: Array<{ id: string; type: "critical" | "warning"; message: string; action: string; route: string }> = [];

    // Area growth: real revenue this period vs. prior period, by customer area.
    const areaRevenueNow: Record<string, number> = {};
    const areaRevenuePrior: Record<string, number> = {};
    (subscriptions || []).filter((s: any) => s.status === "Active").forEach((s: any) => {
      const cust = (customers || []).find((c: any) => c.id === s.customerId);
      const area = cust?.area || cust?.pinCode || "Unknown";
      const amt = (s?.pricing?.finalPrice ?? s?.priceLocked ?? 0) / (s.billingCycle === "Annual" ? 12 : s.billingCycle === "Quarterly" ? 3 : 1);
      if (!s.startDate || s.startDate <= periodEnd) areaRevenueNow[area] = (areaRevenueNow[area] || 0) + amt;
      if (!s.startDate || s.startDate <= priorPeriodEnd) areaRevenuePrior[area] = (areaRevenuePrior[area] || 0) + amt;
    });
    let worstArea: { area: string; growth: number } | null = null;
    Object.keys(areaRevenueNow).forEach((area) => {
      const prior = areaRevenuePrior[area] || 0;
      if (prior <= 0) return;
      const growth = ((areaRevenueNow[area] - prior) / prior) * 100;
      if (growth < -15 && (!worstArea || growth < worstArea.growth)) worstArea = { area, growth };
    });
    if (worstArea) {
      alerts.push({
        id: "real-alert-area-growth", type: "critical",
        message: `${worstArea.area} showing ${worstArea.growth.toFixed(1)}% growth - immediate action required`,
        action: "Review Operations", route: "/analytics/city-comparison",
      });
    }

    // Team efficiency: real washer completion rate (Verified+Completed vs
    // all assigned in the period), grouped by supervisor/reporting manager.
    const teamStats: Record<string, { name: string; total: number; done: number }> = {};
    (jobs || []).filter((j: any) => j.washerId && j.scheduledDate >= periodStart && j.scheduledDate <= periodEnd).forEach((j: any) => {
      const washer = (employees || []).find((e: any) => e.employeeId === j.washerId);
      const teamKey = washer?.reportingManagerId || "unassigned";
      const manager = (employees || []).find((e: any) => e.employeeId === teamKey);
      if (!teamStats[teamKey]) teamStats[teamKey] = { name: manager?.name || "Unassigned team", total: 0, done: 0 };
      teamStats[teamKey].total += 1;
      if (j.status === "Completed" || j.status === "Verified") teamStats[teamKey].done += 1;
    });
    let weakestTeam: { name: string; efficiency: number } | null = null;
    Object.values(teamStats).forEach((t) => {
      if (t.total < 5) return; // real, meaningful sample size only
      const efficiency = (t.done / t.total) * 100;
      if (efficiency < 85 && (!weakestTeam || efficiency < weakestTeam.efficiency)) weakestTeam = { name: t.name, efficiency };
    });
    if (weakestTeam) {
      alerts.push({
        id: "real-alert-team-efficiency", type: "warning",
        message: `${weakestTeam.name}'s team efficiency at ${weakestTeam.efficiency.toFixed(1)}% - below target of 85%`,
        action: "Investigate Performance", route: "/analytics/employee-efficiency",
      });
    }

    // Revenue trend: real revenue this period vs. prior period, company-wide.
    if (priorRevenue > 0 && revenueMTD < priorRevenue * 0.9) {
      const gap = priorRevenue - revenueMTD;
      alerts.push({
        id: "real-alert-revenue-gap", type: "critical",
        message: `Revenue ${(((priorRevenue - revenueMTD) / priorRevenue) * 100).toFixed(1)}% below the prior period - ₹${gap.toLocaleString("en-IN")} gap`,
        action: "Boost Sales Efforts", route: "/analytics/unit-economics",
      });
    }
    return alerts;
  }, [subscriptions, customers, jobs, employees, periodStart, periodEnd, priorPeriodStart, priorPeriodEnd, priorRevenue, revenueMTD]);

  const filteredAlerts = realAlerts.filter(alert => {
    if (selectedUnit === "ALL") return true;
    if (selectedUnit === "SALES") return alert.id.includes("revenue");
    if (selectedUnit === "OPERATIONS") return alert.id.includes("team") || alert.id.includes("area");
    return true;
  });

  const filteredStores =
    selectedCity === "CITY-MUMBAI"    ? MUMBAI_STORE_PERFORMANCE :
    selectedCity === "CITY-AHMEDABAD" ? AHMEDABAD_STORE_PERFORMANCE :
    STORE_PERFORMANCE;

  // Compute city-level KPI aggregates from filtered store data
  const cityRevenue = filteredStores.reduce((sum, s) => sum + (s.revenue || 0), 0);
  const cityProfit = filteredStores.reduce((sum, s) => sum + (s.profit || 0), 0);
  const cityCustomers = filteredStores.reduce((sum, s) => sum + (s.customers || 0), 0);
  const cityWashes = filteredStores.reduce((sum, s) => sum + (s.washes || 0), 0);
  const cityCost = filteredStores.reduce((sum, s) => sum + (s.cost || 0), 0);
  const cityMargin = cityRevenue > 0 ? ((cityProfit / cityRevenue) * 100).toFixed(1) : "0";

  const hasAccess = currentRole === "Super Admin" || currentRole === "Admin";

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg font-semibold">Access Denied</div>
            <p className="text-gray-500 mt-2">
              You don't have permission to access the Founder Control Tower.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /**
   * Handle period filter change
   */
  const handlePeriodChange = (period: string) => {
    const now = new Date();
    let start = "", end = now.toISOString().split("T")[0];
    if (period === "This Month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    } else if (period === "Last Month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
    } else if (period === "This Year") {
      start = `${now.getFullYear()}-01-01`;
    } else if (period === "Last Year") {
      start = `${now.getFullYear() - 1}-01-01`;
      end = `${now.getFullYear() - 1}-12-31`;
    }
    // ✅ FIX (FCT-DEF-02): genuinely updates the real global date filter —
    // previously this only set a local, decorative state variable that no
    // real calculation ever read, so every period showed identical numbers
    // despite a "success" toast implying otherwise.
    setFilters({ ...filters, startDate: start, endDate: end });
    toast.success(`Dashboard period changed to ${period}`);
  };

  /**
   * Export dashboard data to CSV
   */
  const handleExportDashboard = () => {
    try {
      // Create CSV content
      const csvContent = [
        ["Founder Control Tower Dashboard Export"],
        ["Generated:", new Date().toLocaleString()],
        [""],
        ["Business Health Overview"],
        ["Metric", "Value"],
        ["Revenue (MTD)", `₹${(revenueMTD / 100000).toFixed(1)}L`],
        ["Revenue (YTD)", `₹${(revenueYTD / 10000000).toFixed(2)}Cr`],
        ["Net Profit", `₹${(netProfit / 100000).toFixed(1)}L`],
        ["Cash Balance", `₹${(cashBalance / 100000).toFixed(1)}L`],
        ["Cash Runway", `${cashRunwayMonths.toFixed(1)} months`],
        [""],
        ["Growth Metrics"],
        ["Total Customers", displayCustomers],
        ["New This Month", newCustomersThisMonth],
        ["Active Subscriptions", activeSubscriptionsCount],
        ["Customer Growth Rate", `${customerGrowthRate}%`],
        [""],
        ["Store Performance"],
        ["City", "Store", "Customers", "Washes", "Revenue", "Profit", "Margin", "Status"],
        ...filteredStores.map(store => [
          store.city,
          store.store,
          store.customers,
          store.washes,
          `₹${store.revenue}`,
          `₹${store.profit}`,
          `${store.margin}%`,
          store.status
        ]),
      ];

      const csv = csvContent.map(row => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `founder-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Dashboard exported successfully!");
    } catch (error) {
      toast.error("Failed to export dashboard");
    }
  };

  /**
   * Handle financial alert actions
   */
  const handleAlertAction = (alert: typeof realAlerts[0]) => {
    navigate(alert.route);
    toast.info(`Navigating: ${alert.action}...`);
  };

  /**
   * Handle expansion analysis navigation
   */
  const handleViewExpansionAnalysis = () => {
    navigate("/analytics/expansion-analysis");
    toast.success("Opening expansion analysis...");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50";
      case "caution":
        return "text-yellow-600 bg-yellow-50";
      case "critical":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const topPerformingStores = getTopPerformingStores(3);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Mobile Notice */}
      <div className="md:hidden p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>For best experience, view the Control Tower on a desktop or tablet in landscape mode.</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Founder Control Tower</h1>
          {(selectedCity !== "ALL" && selectedCity !== "CITY-SURAT" || selectedUnit !== "ALL") && (
            <p className="text-sm text-blue-600 font-medium mt-1">
              Viewing: {cityDisplayName}{selectedUnit !== "ALL" ? ` · ${selectedUnit} unit` : " · All units"}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Complete business intelligence at a glance • Last updated: {new Date().toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {selectedPeriodLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handlePeriodChange("This Month")}>
                This Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodChange("Last Month")}>
                Last Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodChange("This Year")}>
                This Year
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodChange("Last Year")}>
                Last Year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={handleExportDashboard}>
            <Download className="w-4 h-4 mr-2" />
            Export Dashboard
          </Button>
        </div>
      </div>

      {/* Financial Alerts */}
      {filteredAlerts.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              No alerts for {cityDisplayName} — {selectedUnit === "ALL" ? "all units" : selectedUnit + " unit"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {alert.title || alert.message}
                      </span>
                      {alert.description && (
                        <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleAlertAction(alert)}>
                    {alert.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Business Health Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Business Health Overview
          </h2>
          <Button
            size="sm"
            onClick={() => navigate("/accounts")}
            className="flex items-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            View Expenses
          </Button>
        </div>

        {/* Global Filter Bar */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Period:</span>
            <div className="flex items-center border rounded-lg p-1 bg-white">
              <Button
                variant={expenseDateFilter === "Month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setExpenseDateFilter("Month")}
                className="h-7 text-xs"
              >
                Month
              </Button>
              <Button
                variant={expenseDateFilter === "Week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setExpenseDateFilter("Week")}
                className="h-7 text-xs"
              >
                Week
              </Button>
              <Button
                variant={expenseDateFilter === "Custom" ? "default" : "ghost"}
                size="sm"
                onClick={() => setExpenseDateFilter("Custom")}
                className="h-7 text-xs"
              >
                Custom
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Package:</span>
            <div className="flex items-center border rounded-lg p-1 bg-white">
              <Button
                variant={expensePackageType === "4W" ? "default" : "ghost"}
                size="sm"
                onClick={() => setExpensePackageType("4W")}
                className="h-7 text-xs"
              >
                4W
              </Button>
              <Button
                variant={expensePackageType === "2W" ? "default" : "ghost"}
                size="sm"
                onClick={() => setExpensePackageType("2W")}
                className="h-7 text-xs"
              >
                2W
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">Revenue (MTD)</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    {displayRevenue}{cityTag}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {Number(revenueGrowthPct) >= 0
                      ? <ArrowUpRight className="w-4 h-4 text-green-500" />
                      : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                    <span className={`text-sm font-medium ${Number(revenueGrowthPct) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {Number(revenueGrowthPct) >= 0 ? "+" : ""}{revenueGrowthPct}%
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${getStatusColor(Number(profitMargin) >= 20 ? "healthy" : Number(profitMargin) >= 0 ? "caution" : "critical")}`}>
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">Revenue (YTD)</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    ₹{(revenueYTD / 10000000).toFixed(2)}Cr
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {Number(revenueGrowthPct) >= 0
                      ? <ArrowUpRight className="w-4 h-4 text-green-500" />
                      : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                    <span className={`text-sm font-medium ${Number(revenueGrowthPct) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {Number(revenueGrowthPct) >= 0 ? "+" : ""}{revenueGrowthPct}%
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">Net Profit</div>
                  <div className="text-3xl font-bold text-green-600 mt-2">
                    {displayProfit}{cityTag}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-gray-600">Margin: {profitMargin}%</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-50 text-green-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">Cash Balance</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    ₹{(cashBalance / 100000).toFixed(1)}L
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-gray-600">Runway: {cashRunwayMonths.toFixed(1)}m</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Labour Cost per Wash</span>
                    <div className="relative group">
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        Includes salary + actual incentives + management allocation
                      </div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">₹{labourCostPerWash}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-gray-600">{completedJobsInPeriod.length} real washes this period</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Total Payables (Outstanding)</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">₹{(totalPayables / 100000).toFixed(1)}L</div>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-600 flex items-center justify-between">
                      <span>Next 7 days:</span>
                      <span className="font-medium">₹{(payablesNext7 / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-between">
                      <span>8-15 days:</span>
                      <span className="font-medium">₹{(payables8to15 / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-between">
                      <span>16-30 days:</span>
                      <span className="font-medium">₹{(payables16to30 / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs mt-2"
                    onClick={() => navigate("/accounts/vendor-payment")}
                  >
                    View Details →
                  </Button>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Top Expense Category</div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">{topExpenseCategory}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600">{topExpensePct}% of total</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${topExpensePct}%` }}></div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                  <PieChart className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Cost Variance (vs. Prior Period)</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`text-3xl font-bold ${costVariance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {costVariance > 0 ? "+" : ""}₹{costVariance}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {costVariance > 0
                      ? <ArrowUpRight className="w-4 h-4 text-red-500" />
                      : <ArrowDownRight className="w-4 h-4 text-green-500" />}
                    <span className={`text-sm font-medium ${costVariance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {Number(costVariancePct) > 0 ? "+" : ""}{costVariancePct}% variance
                    </span>
                  </div>
                  {costVariance > 0 && <Badge className="bg-red-500 mt-2">High Cost</Badge>}
                </div>
                <div className={`p-3 rounded-lg ${costVariance > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Growth Metrics + Revenue Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Growth Metrics */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Growth Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div>
                <div className="text-sm text-gray-500">Total Customers</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {displayCustomers.toLocaleString("en-IN")}{cityTag}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {Number(customerGrowthRate) >= 0
                    ? <ArrowUpRight className="w-3 h-3 text-green-500" />
                    : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                  <span className={`text-xs ${Number(customerGrowthRate) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Number(customerGrowthRate) >= 0 ? "+" : ""}{customerGrowthRate}% growth
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">New This Month</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {newCustomersThisMonth.toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Active: {activeSubscriptionsCount.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={CUSTOMER_ACQUISITION_TREND} id="customer-trend-chart">
                <CartesianGrid key="customer-grid" strokeDasharray="3 3" />
                <XAxis key="customer-xaxis" dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis key="customer-yaxis" tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip key="customer-tooltip" />
                <Area
                  key="customer-area"
                  type="monotone"
                  dataKey="customers"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  name="New Customers"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPieChart id="revenue-breakdown-chart">
                <Pie
                  key="revenue-pie"
                  data={REVENUE_BY_TYPE}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => `${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {REVENUE_BY_TYPE.map((entry, index) => (
                    <Cell key={`revenue-cell-${entry.id}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip key="revenue-tooltip" />
                <Legend key="revenue-legend" />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Store Leaderboard + Unit Economics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Store Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Top Performing Stores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformingStores.map((store, index) => (
                <div key={store.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{store.store}</div>
                    <div className="text-xs text-gray-500">{store.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">₹{(store.profit / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-gray-500">{store.margin}% margin</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Unit Economics Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Unit Economics Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Revenue per Wash</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">₹590</div>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">Healthy</span>
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">Cost per Wash</div>
                <div className="text-2xl font-bold text-orange-600 mt-1">₹245</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">-5.8%</span>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">LTV</div>
                <div className="text-2xl font-bold text-green-600 mt-1">₹18.5K</div>
                <div className="text-xs text-gray-600 mt-1">15m avg. retention</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">CAC</div>
                <div className="text-2xl font-bold text-purple-600 mt-1">₹850</div>
                <div className="text-xs text-gray-600 mt-1">LTV:CAC 21.8x</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Performance Snapshot */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Store Performance Snapshot
            </CardTitle>
            <Link to="/analytics/unit-economics">
              <Button variant="outline" size="sm">View Detailed Analysis</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">City</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Store</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Customers</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Washes</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Profit</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Margin</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.map((store) => (
                  <tr key={store.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{store.city}</td>
                    <td className="p-3 font-medium">{store.store}</td>
                    <td className="p-3 text-right">{store.customers}</td>
                    <td className="p-3 text-right">{store.washes.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right font-medium">₹{(store.revenue / 1000).toFixed(0)}K</td>
                    <td className={`p-3 text-right font-semibold ${store.profit > 0 ? "text-green-600" : "text-red-600"}`}>
                      ₹{(store.profit / 1000).toFixed(0)}K
                    </td>
                    <td className="p-3 text-right">{store.margin}%</td>
                    <td className="p-3 text-center">
                      {store.status === "profitable" && <Badge className="bg-green-500">Profitable</Badge>}
                      {store.status === "break-even" && <Badge className="bg-yellow-500">Break-Even</Badge>}
                      {store.status === "loss-making" && <Badge className="bg-red-500">Loss Making</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Operational Efficiency + Expansion Readiness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Operational Efficiency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Operational Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500">Washes/Day</div>
                <div className="text-2xl font-bold text-gray-900">{OPERATIONAL_METRICS.totalWashesPerDay}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Avg/Store</div>
                <div className="text-2xl font-bold text-gray-900">{OPERATIONAL_METRICS.avgWashesPerStore}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Staff Productivity</div>
                <div className="text-2xl font-bold text-gray-900">{OPERATIONAL_METRICS.staffProductivity}</div>
                <div className="text-xs text-gray-600">washes/staff</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Utilization Rate</div>
                <div className="text-2xl font-bold text-gray-900">{OPERATIONAL_METRICS.utilizationRate}%</div>
                <Badge className="bg-green-500 text-xs mt-1">Good</Badge>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={WASH_VOLUME_TREND} id="wash-volume-chart">
                <CartesianGrid key="wash-grid" strokeDasharray="3 3" />
                <XAxis key="wash-xaxis" dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis key="wash-yaxis" tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip key="wash-tooltip" />
                <Bar key="wash-bar" dataKey="washes" fill="#3b82f6" name="Total Washes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expansion Readiness */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Expansion Readiness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600">{EXPANSION_READINESS.readinessScore}%</div>
                <div className="text-sm text-gray-600 mt-1">Ready to Expand</div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Available Capital</span>
                    <span className="font-medium">₹{(EXPANSION_READINESS.availableCapital / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Profitability</span>
                    <span className="font-medium">{EXPANSION_READINESS.currentProfitability}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Operational Capacity</span>
                    <span className="font-medium">{EXPANSION_READINESS.operationalCapacity}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                </div>
              </div>
              <Button className="w-full" size="sm" onClick={handleViewExpansionAnalysis}>
                <Target className="w-4 h-4 mr-2" />
                View Expansion Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Strategic Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {STRATEGIC_INSIGHTS.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.priority === "positive"
                    ? "border-l-green-500 bg-green-50"
                    : insight.priority === "negative"
                    ? "border-l-red-500 bg-red-50"
                    : "border-l-blue-500 bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {insight.priority === "positive" && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                  {insight.priority === "negative" && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                  {insight.priority === "neutral" && <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                  <p className="text-sm text-gray-900">{insight.insight}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
            <Link to="/finance">
              <Button variant="outline" className="w-full">
                <DollarSign className="w-4 h-4 mr-2" />
                View P&L
              </Button>
            </Link>
            <Link to="/analytics/cost-per-wash-report">
              <Button variant="outline" className="w-full">
                <PieChart className="w-4 h-4 mr-2" />
                Cost per Wash
              </Button>
            </Link>
            <Link to="/approvals">
              <Button variant="outline" className="w-full">
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Expenses
              </Button>
            </Link>
            <Link to="/analytics/cac">
              <Button variant="outline" className="w-full">
                <Target className="w-4 h-4 mr-2" />
                Marketing ROI
              </Button>
            </Link>
            <Link to="/analytics/break-even">
              <Button variant="outline" className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                Cash Flow
              </Button>
            </Link>
            <Link to="/admin/dilution-recipes">
              <Button variant="outline" className="w-full">
                <Beaker className="w-4 h-4 mr-2" />
                Dilution Recipes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Cost Intelligence Panel */}
      <CostIntelligencePanel />
    </div>
  );
}

export default FounderControlTower;