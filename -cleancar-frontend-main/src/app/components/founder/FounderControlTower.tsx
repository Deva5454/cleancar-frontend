import { Link } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BackButton } from "../ui/back-button";
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
  TrendingUp as GrowthIcon,
  Award,
  AlertCircle,
  Wallet,
  BarChart3,
  PieChart,
  ChevronDown,
  Receipt,
  Info,
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
  BUSINESS_HEALTH_DATA,
  GROWTH_METRICS,
  CUSTOMER_ACQUISITION_TREND,
  REVENUE_BY_TYPE,
  REVENUE_BY_CITY,
  STORE_PERFORMANCE,
  FINANCIAL_ALERTS,
  STRATEGIC_INSIGHTS,
  OPERATIONAL_METRICS,
  WASH_VOLUME_TREND,
  EXPANSION_READINESS,
  UNIT_ECONOMICS,
  getTopPerformingStores,
  MUMBAI_STORE_PERFORMANCE,
  AHMEDABAD_STORE_PERFORMANCE,
  MUMBAI_FINANCIAL_ALERTS,
  AHMEDABAD_FINANCIAL_ALERTS,
  CITY_KPI_DATA,
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
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");
  const [expenseDateFilter, setExpenseDateFilter] = useState<"Month" | "Week" | "Custom">("Month");
  const [expensePackageType, setExpensePackageType] = useState<"4W" | "2W">("4W");
  const { filters } = useGlobalFilters();
  const selectedCity = filters.city;   // e.g. "CITY-SURAT", "CITY-MUMBAI", "ALL"
  const selectedUnit = filters.businessUnit; // e.g. "ALL", "SALES", "OPERATIONS"
  const cityDisplayName =
    selectedCity === "CITY-MUMBAI" ? "Mumbai" :
    selectedCity === "CITY-AHMEDABAD" ? "Ahmedabad" :
    "Surat";

  const isAllCities = selectedCity === "ALL" || selectedCity === "CITY-SURAT";
  const cityKPI = (selectedCity && CITY_KPI_DATA[selectedCity]) || CITY_KPI_DATA["CITY-SURAT"];
  const displayRevenue = isAllCities
    ? `₹${(BUSINESS_HEALTH_DATA.revenueMonthToDate / 100000).toFixed(1)}L`
    : `₹${((cityKPI?.revenue || 0) / 100000).toFixed(1)}L`;
  const displayProfit = isAllCities
    ? `₹${(BUSINESS_HEALTH_DATA.netProfit / 100000).toFixed(1)}L`
    : `₹${((cityKPI?.profit || 0) / 100000).toFixed(1)}L`;
  const displayCustomers = isAllCities
    ? GROWTH_METRICS.totalCustomers
    : (cityKPI?.customers || 0);
  const cityTag = isAllCities ? null : (
    <span className="text-xs text-gray-500 ml-1">({cityDisplayName})</span>
  );

  const cityAlerts =
    selectedCity === "CITY-MUMBAI"    ? MUMBAI_FINANCIAL_ALERTS :
    selectedCity === "CITY-AHMEDABAD" ? AHMEDABAD_FINANCIAL_ALERTS :
    FINANCIAL_ALERTS;

  const filteredAlerts = cityAlerts.filter(alert => {
    if (selectedUnit === "ALL") return true;
    if (selectedUnit === "SALES") return (alert as any).type === "revenue";
    if (selectedUnit === "OPERATIONS") return (alert as any).type === "operational";
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
    setSelectedPeriod(period);
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
        ["Revenue (MTD)", `₹${(BUSINESS_HEALTH_DATA.revenueMonthToDate / 100000).toFixed(1)}L`],
        ["Revenue (YTD)", `₹${(BUSINESS_HEALTH_DATA.revenueYearToDate / 10000000).toFixed(2)}Cr`],
        ["Net Profit", `₹${(BUSINESS_HEALTH_DATA.netProfit / 100000).toFixed(1)}L`],
        ["Cash Balance", `₹${(BUSINESS_HEALTH_DATA.cashBalance / 100000).toFixed(1)}L`],
        ["Cash Runway", `${BUSINESS_HEALTH_DATA.cashRunway.toFixed(1)} months`],
        [""],
        ["Growth Metrics"],
        ["Total Customers", GROWTH_METRICS.totalCustomers],
        ["New This Month", GROWTH_METRICS.newCustomersThisMonth],
        ["Active Subscriptions", GROWTH_METRICS.activeSubscriptions],
        ["Customer Growth Rate", `${GROWTH_METRICS.customerGrowthRate}%`],
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
  const handleAlertAction = (alert: typeof FINANCIAL_ALERTS[0]) => {
    switch (alert.id) {
      case "alert_001":
        navigate("/finance/collections");
        toast.info("Navigating to collections...");
        break;
      case "alert_002":
        navigate("/inventory");
        toast.info("Navigating to inventory...");
        break;
      case "alert_003":
        navigate("/finance/cash-flow");
        toast.info("Navigating to cash flow...");
        break;
      default:
        toast.info(`Action: ${alert.action}`);
    }
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
                {selectedPeriod}
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
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">+15.2%</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${getStatusColor(BUSINESS_HEALTH_DATA.status)}`}>
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
                    ₹{(BUSINESS_HEALTH_DATA.revenueYearToDate / 10000000).toFixed(2)}Cr
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">+28.5%</span>
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
                    <span className="text-sm text-gray-600">Margin: {isAllCities ? "56.2" : cityMargin}%</span>
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
                    ₹{(BUSINESS_HEALTH_DATA.cashBalance / 100000).toFixed(1)}L
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-gray-600">Runway: {BUSINESS_HEALTH_DATA.cashRunway.toFixed(1)}m</span>
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
                  <div className="text-3xl font-bold text-gray-900 mt-2">₹95</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowDownRight className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">-3.2% vs last month</span>
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
                  <div className="text-sm text-gray-500">Total Payables (Next 30 Days)</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">₹8.2L</div>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-600 flex items-center justify-between">
                      <span>Next 7 days:</span>
                      <span className="font-medium">₹2.1L</span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-between">
                      <span>8-15 days:</span>
                      <span className="font-medium">₹3.5L</span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-between">
                      <span>16-30 days:</span>
                      <span className="font-medium">₹2.6L</span>
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
                  <div className="text-2xl font-bold text-gray-900 mt-2">Labour</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600">38.8% of total</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "38.8%" }}></div>
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
                  <div className="text-sm text-gray-500">Cost Variance (Std vs Actual)</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-3xl font-bold text-red-600">+₹25</div>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">+11.4% variance</span>
                  </div>
                  <Badge className="bg-red-500 mt-2">High Cost</Badge>
                </div>
                <div className="p-3 rounded-lg bg-red-50 text-red-600">
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
              <GrowthIcon className="w-5 h-5" />
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
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">+{GROWTH_METRICS.customerGrowthRate}% growth</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">New This Month</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {GROWTH_METRICS.newCustomersThisMonth.toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Active: {GROWTH_METRICS.activeSubscriptions.toLocaleString("en-IN")}
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
          </div>
        </CardContent>
      </Card>

      {/* Cost Intelligence Panel */}
      <CostIntelligencePanel />
    </div>
  );
}

export default FounderControlTower;