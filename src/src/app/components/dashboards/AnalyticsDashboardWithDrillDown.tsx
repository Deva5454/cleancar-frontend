/**
 * ============================================================================
 * ANALYTICS DASHBOARD - SINGLE SOURCE OF TRUTH
 * ============================================================================
 *
 * ⚠️ CRITICAL: THIS IS THE ONLY MAIN ANALYTICS DASHBOARD
 *
 * DO NOT CREATE:
 * - AnalyticsDashboard.tsx (DELETED - was duplicate without drill-down)
 * - Any other general analytics dashboard components
 *
 * ROUTE: /analytics/dashboard (and /analytics redirects here)
 *
 * FEATURES:
 * - City-level aggregated metrics
 * - Drill-down to cluster level with breadcrumb navigation
 * - Click any city card to view its clusters
 * - Cluster selector when city is selected
 * - Real-time data from analyticsEngine
 * - Revenue, jobs, conversions tracking
 * - Growth indicators and comparisons
 *
 * DATA SOURCE:
 * - MOCK_CITY_DATA and MOCK_CLUSTER_DATA from analytics engine
 * - Aggregation functions for city and cluster summaries
 * - Consistent with system-wide metrics
 *
 * INTEGRATION:
 * - Used by: Main analytics section, role-based views
 * - Navigation: Accessible via /analytics or /analytics/dashboard
 * - Related: Finance analytics (separate), specialized reports (separate)
 *
 * OTHER DASHBOARDS (SEPARATE, NOT DUPLICATES):
 * - FinanceAnalyticsDashboard.tsx - Finance-specific metrics (KEEP)
 * - RoleBasedAnalyticsDashboard.tsx - Example/demo dashboard (KEEP)
 * - Specialized reports in /analytics/* routes (KEEP)
 *
 * LAST CONSOLIDATED: 2026-04-23
 * ============================================================================
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MapPin,
  Database,
  Eye,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { DrillDownBreadcrumb } from "../analytics/DrillDownBreadcrumb";
import { formatCurrency } from "../../lib/formatters";
import {
  type CityAnalyticsData,
  type ClusterAnalyticsData,
} from "../../lib/mockData";
import { CITIES, CLUSTERS, CITY_LABELS, CLUSTER_LABELS, type City, type ClusterId } from "../../lib/constants";
import { useFinance } from "../../contexts/FinanceContext";
import { useCustomers } from "../../contexts/CustomerContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";
import { useJobs } from "../../contexts/JobContext";

type DrillDownLevel = "all" | "city" | "cluster";

export function AnalyticsDashboardWithDrillDown() {
  // Drill-down state
  const [level, setLevel] = useState<DrillDownLevel>("all");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusterId | null>(null);

  // Live context hooks
  const { getRevenueByCity, getPayablesByCity } = useFinance();
  const { customers } = useCustomers();
  const { employees } = useEmployee();
  const { availableCities } = useCity();
  const { allJobs } = useJobs();

  // Build live city-level analytics for all available cities
  const liveCityData: CityAnalyticsData[] = useMemo(() => {
    return availableCities.map(cityDef => {
      const cityId = cityDef.id;
      const cityName = cityDef.displayName.toUpperCase() as typeof CITIES[number];

      const revenues  = getRevenueByCity(cityId).filter(r => r.status === "Received");
      const payables  = getPayablesByCity(cityId).filter(p => p.status === "Paid");
      const cityJobs  = (allJobs || []).filter(j =>
        j.cityId === cityId && (j.status === "Completed" || j.status === "Verified")
      );
      const cityCustomers = (customers || []).filter(
        c => (c as any).cityId === cityId && c.status === "Active"
      );
      const cityEmployees = (employees || []).filter(
        e => (e.workLocation === cityId || (e as any).cityId === cityId) && e.status === "Active"
      );

      const totalRevenue  = revenues.reduce((s, r) => s + r.amount, 0);
      const totalExpenses = payables.reduce((s, p) => s + p.amount, 0);
      const labourCost    = payables.filter(p => p.type === "Salary").reduce((s, p) => s + p.amount, 0);
      const materialCost  = payables.filter(p => p.type === "Vendor").reduce((s, p) => s + p.amount, 0);
      const overheadCost  = totalExpenses - labourCost - materialCost;
      const netRevenue    = totalRevenue;
      const netIncome     = netRevenue - totalExpenses;

      return {
        city: cityName,
        totalRevenue,
        totalRefunds: 0,
        netRevenue,
        totalExpenses,
        labourCost,
        materialCost,
        overheadCost: Math.max(0, overheadCost),
        netIncome,
        profitMargin: netRevenue > 0 ? Math.round((netIncome / netRevenue) * 1000) / 10 : 0,
        unitsCompleted: cityJobs.length,
        activeCustomers: cityCustomers.length,
        employeeCount: cityEmployees.length,
        refundRate: 0,
      };
    });
  }, [availableCities, getRevenueByCity, getPayablesByCity, allJobs, customers, employees]);

  // Aggregated "all cities" view
  const aggregatedData: CityAnalyticsData = useMemo(() => {
    const totalRevenue  = liveCityData.reduce((s, c) => s + c.totalRevenue, 0);
    const totalRefunds  = 0;
    const totalExpenses = liveCityData.reduce((s, c) => s + c.totalExpenses, 0);
    const netRevenue    = totalRevenue - totalRefunds;
    const netIncome     = netRevenue - totalExpenses;
    return {
      city: "ALL" as any,
      totalRevenue, totalRefunds, netRevenue, totalExpenses,
      labourCost:   liveCityData.reduce((s, c) => s + c.labourCost, 0),
      materialCost: liveCityData.reduce((s, c) => s + c.materialCost, 0),
      overheadCost: liveCityData.reduce((s, c) => s + c.overheadCost, 0),
      netIncome,
      profitMargin: netRevenue > 0 ? Math.round((netIncome / netRevenue) * 1000) / 10 : 0,
      unitsCompleted:  liveCityData.reduce((s, c) => s + c.unitsCompleted, 0),
      activeCustomers: liveCityData.reduce((s, c) => s + c.activeCustomers, 0),
      employeeCount:   liveCityData.reduce((s, c) => s + c.employeeCount, 0),
      refundRate: 0,
    };
  }, [liveCityData]);

  // Cluster-level data: split each city's totals proportionally across its clusters
  // (real cluster-level job/customer data can replace this when cluster IDs are on records)
  const liveClusterData: ClusterAnalyticsData[] = useMemo(() => {
    return liveCityData.flatMap(cityData => {
      const cityKey = cityData.city as City;
      const clusters = CLUSTERS[cityKey] || [];
      if (clusters.length === 0) return [];
      const share = 1 / clusters.length;
      return clusters.map(clusterId => ({
        city: cityKey,
        cluster: clusterId,
        totalRevenue:    Math.round(cityData.totalRevenue  * share),
        totalRefunds:    0,
        netRevenue:      Math.round(cityData.netRevenue    * share),
        totalExpenses:   Math.round(cityData.totalExpenses * share),
        labourCost:      Math.round(cityData.labourCost    * share),
        materialCost:    Math.round(cityData.materialCost  * share),
        overheadCost:    Math.round(cityData.overheadCost  * share),
        netIncome:       Math.round(cityData.netIncome     * share),
        profitMargin:    cityData.profitMargin,
        unitsCompleted:  Math.round(cityData.unitsCompleted  * share),
        activeCustomers: Math.round(cityData.activeCustomers * share),
        employeeCount:   Math.round(cityData.employeeCount   * share),
        refundRate:      0,
      }));
    });
  }, [liveCityData]);

  // Helper functions (replacing mockData helpers)
  const getLiveCityData = (city: City) =>
    liveCityData.find(c => c.city === city);

  const getLiveClusterData = (city: City, cluster: ClusterId) =>
    liveClusterData.find(c => c.city === city && c.cluster === cluster);

  const getLiveCityClusters = (city: City) =>
    liveClusterData.filter(c => c.city === city);

  const getLiveAggregatedClusterData = (city: City): CityAnalyticsData => {
    const cityRaw = liveCityData.find(c => c.city === city);
    return cityRaw || aggregatedData;
  };

  // Get current data based on drill-down level
  const getCurrentData = (): CityAnalyticsData | ClusterAnalyticsData => {
    if (level === "cluster" && selectedCity && selectedCluster) {
      return getLiveClusterData(selectedCity, selectedCluster) || aggregatedData;
    } else if (level === "city" && selectedCity) {
      return getLiveCityData(selectedCity) || getLiveAggregatedClusterData(selectedCity);
    } else {
      return aggregatedData;
    }
  };

  const currentData = getCurrentData();

  // Navigation handlers
  const handleNavigateToAll = () => {
    setLevel("all");
    setSelectedCity(null);
    setSelectedCluster(null);
  };

  const handleNavigateToCity = (city: City) => {
    setLevel("city");
    setSelectedCity(city);
    setSelectedCluster(null);
  };

  const handleNavigateToCluster = (cluster: ClusterId) => {
    setLevel("cluster");
    setSelectedCluster(cluster);
  };

  // Get available clusters for selected city
  const availableClusters = selectedCity ? CLUSTERS[selectedCity] : [];

  // Get city clusters data for comparison
  const cityClusters = selectedCity ? getLiveCityClusters(selectedCity) : [];

  // Revenue breakdown by source
  const revenueSources = [
    {
      source: "Subscriptions",
      amount: currentData.totalRevenue * 0.65,
      percentage: 65,
      color: "bg-green-500",
    },
    {
      source: "One-time Washes",
      amount: currentData.totalRevenue * 0.25,
      percentage: 25,
      color: "bg-blue-500",
    },
    {
      source: "Add-ons",
      amount: currentData.totalRevenue * 0.10,
      percentage: 10,
      color: "bg-purple-500",
    },
  ];

  // Expense breakdown
  const expenseSources = [
    {
      source: "Salaries",
      amount: currentData.totalExpenses * 0.60,
      percentage: 60,
      color: "bg-red-500",
    },
    {
      source: "Materials",
      amount: currentData.totalExpenses * 0.25,
      percentage: 25,
      color: "bg-orange-500",
    },
    {
      source: "Overhead",
      amount: currentData.totalExpenses * 0.15,
      percentage: 15,
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          {level === "cluster" && (
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
              Cluster View
            </Badge>
          )}
          {level === "city" && (
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
              City View
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Multi-level analytics with city and cluster drill-down
        </p>
      </div>

      {/* Breadcrumb Navigation */}
      <DrillDownBreadcrumb
        level={level}
        city={selectedCity || undefined}
        cluster={selectedCluster || undefined}
        onNavigateToAll={handleNavigateToAll}
        onNavigateToCity={handleNavigateToCity}
      />

      {/* Engine Label */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Database className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Data Source: analyticsEngine</p>
          <p className="text-xs text-blue-700">
            {level === "cluster"
              ? `Cluster-level data for ${selectedCluster ? CLUSTER_LABELS[selectedCluster as ClusterId] : ""}`
              : level === "city"
              ? `City-level data for ${selectedCity ? CITY_LABELS[selectedCity] : ""}`
              : "Multi-city aggregated data"}
          </p>
        </div>
      </div>

      {/* City/Cluster Selector */}
      {level === "city" && selectedCity && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Cluster Selector</CardTitle>
              </div>
              <Badge variant="outline">
                {availableClusters.length} clusters available
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Select
                value={selectedCluster || "ALL"}
                onValueChange={(value) => {
                  if (value === "ALL") {
                    setLevel("city");
                    setSelectedCluster(null);
                  } else {
                    handleNavigateToCluster(value as ClusterId);
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Clusters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Clusters</SelectItem>
                  {availableClusters.map((cluster) => (
                    <SelectItem key={cluster} value={cluster}>
                      {CLUSTER_LABELS[cluster as ClusterId]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCluster && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLevel("city");
                    setSelectedCluster(null);
                  }}
                >
                  View All Clusters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <ArrowUpCircle className="w-8 h-8 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                analyticsEngine
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(currentData.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
            <p className="text-xs text-blue-600 mt-1">From financeEngine</p>
          </CardContent>
        </Card>

        {/* Total Refunds */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <RotateCcw className="w-8 h-8 text-orange-600" />
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                analyticsEngine
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {formatCurrency(currentData.totalRefunds)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Refunds</p>
            <p className="text-xs text-orange-600 mt-1">
              {currentData.refundRate.toFixed(1)}% of revenue
            </p>
          </CardContent>
        </Card>

        {/* Net Revenue */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                analyticsEngine
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(currentData.netRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Net Revenue</p>
            <p className="text-xs text-green-600 mt-1">Revenue - Refunds</p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <ArrowDownCircle className="w-8 h-8 text-red-600" />
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                analyticsEngine
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(currentData.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Expenses</p>
            <p className="text-xs text-red-600 mt-1">All expenses</p>
          </CardContent>
        </Card>

        {/* Net Income */}
        <Card
          className={`border-l-4 ${
            currentData.netIncome >= 0 ? "border-l-green-500" : "border-l-red-500"
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              {currentData.netIncome >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
              <Badge
                className={
                  currentData.netIncome >= 0
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : "bg-red-100 text-red-700 hover:bg-red-100"
                }
              >
                analyticsEngine
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                currentData.netIncome >= 0 ? "text-green-700" : "text-red-700"
              }`}
            >
              {formatCurrency(currentData.netIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Net Income</p>
            <p
              className={`text-xs mt-1 ${
                currentData.netIncome >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              Net Rev - Expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* City/Cluster Comparison - Only show in All or City view */}
      {level === "all" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">City Comparison</CardTitle>
              <Badge variant="outline">Click to drill down</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {liveCityData.map((city) => {
                const refundBadgeColor =
                  city.refundRate < 7
                    ? "bg-green-100 text-green-700"
                    : city.refundRate < 12
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700";

                return (
                  <div
                    key={city.city}
                    onClick={() => handleNavigateToCity(city.city)}
                    className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{CITY_LABELS[city.city]}</h3>
                      <Badge className={`${refundBadgeColor} hover:${refundBadgeColor}`}>
                        {city.refundRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium">{formatCurrency(city.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Net Income</span>
                        <span className="font-medium text-green-700">{formatCurrency(city.netIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Units</span>
                        <span className="font-medium">{city.unitsCompleted.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
                      <span>View clusters</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cluster Comparison - Only show in City view */}
      {level === "city" && selectedCity && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {CITY_LABELS[selectedCity]} - Cluster Breakdown
              </CardTitle>
              <Badge variant="outline">Click to drill down</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cityClusters.map((cluster) => (
                <div
                  key={cluster.cluster}
                  onClick={() => handleNavigateToCluster(cluster.cluster as ClusterId)}
                  className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">
                      {CLUSTER_LABELS[cluster.cluster as ClusterId]}
                    </h3>
                    <MapPin className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium">{formatCurrency(cluster.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Units</span>
                      <span className="font-medium">{cluster.unitsCompleted}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
                    <span>View details</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operational Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Operational Metrics</CardTitle>
            <Badge variant="outline">analyticsEngine</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Units Completed</p>
              <p className="text-2xl font-bold">{currentData.unitsCompleted.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <p className="text-2xl font-bold">{currentData.activeCustomers}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue per Unit</p>
              <p className="text-2xl font-bold">
                ₹{Math.round(currentData.totalRevenue / currentData.unitsCompleted)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
