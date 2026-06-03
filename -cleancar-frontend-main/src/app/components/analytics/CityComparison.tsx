/**
 * City Comparison Analytics
 *
 * Derived metrics:
 * - Revenue comparison across cities
 * - Cost structure comparison
 * - Efficiency metrics comparison
 * - Profitability analysis by city
 *
 * All data from analyticsEngine
 *
 * @component
 */

import { useState, useMemo, useCallback, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { BackButton } from "../ui/back-button";
import { BarChartWrapper, ComposedChartWrapper, RadarChartWrapper } from "./RechartsWrapper";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Database,
  Users,
  Award,
  AlertCircle,
  Target,
  Activity,
  Building2,
} from "lucide-react";
import { useFinance } from "../../contexts/FinanceContext";
import { usePayroll } from "../../contexts/PayrollContext";
import { useJobs } from "../../contexts/JobContext";
import { useCustomers } from "../../contexts/CustomerContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";

// City data - From analyticsEngine
interface CityComparisonData {
  city: string;
  totalRevenue: number;           // From financeEngine
  totalRefunds: number;            // From financeEngine
  netRevenue: number;              // Derived: Revenue - Refunds
  totalExpenses: number;           // From financeEngine
  labourCost: number;              // From payrollEngine
  materialCost: number;            // From financeEngine
  overheadCost: number;            // From financeEngine
  netIncome: number;               // Derived: Net Revenue - Expenses
  profitMargin: number;            // Derived: (Net Income / Net Revenue) × 100
  unitsCompleted: number;          // From operationsEngine
  activeCustomers: number;         // From subscriptionEngine
  employeeCount: number;           // From payrollEngine
  refundRate: number;              // Derived: (Refunds / Revenue) × 100
  revenuePerUnit: number;          // Derived: Revenue / Units
  revenuePerCustomer: number;      // Derived: Revenue / Customers
  revenuePerEmployee: number;      // Derived: Revenue / Employees
  costPerUnit: number;             // Derived: Expenses / Units
  labourCostPerUnit: number;       // Derived: Labour Cost / Units
}

function CityComparison() {
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "profit" | "efficiency">("revenue");

  const { getRevenueByCity, getPayablesByCity } = useFinance();
  const { payrollRuns } = usePayroll();
  const { allJobs } = useJobs();
  const { customers } = useCustomers();
  const { employees } = useEmployee();
  const { availableCities } = useCity();

  const CITY_DATA: CityComparisonData[] = useMemo(() => {
    return availableCities.map(cityDef => {
      const cityId = cityDef.id;
      const cityName = cityDef.displayName.toUpperCase();

      const revenues     = getRevenueByCity(cityId).filter(r => r.status === "Received");
      const payables     = getPayablesByCity(cityId).filter(p => p.status === "Paid");
      const cityJobs     = allJobs.filter(j => j.cityId === cityId && (j.status === "Completed" || j.status === "Verified"));
      const cityCustomers= customers.filter(c => c.cityId === cityId && c.status === "Active");
      const cityEmployees= employees.filter(e => (e.workLocation === cityId || e.cityId === cityId) && e.status === "Active");
      const cityPayroll  = payrollRuns.filter(r => r.cityId === cityId);

      const totalRevenue  = revenues.reduce((s, r) => s + r.amount, 0);
      const totalExpenses = payables.reduce((s, p) => s + p.amount, 0);
      const labourCost    = payables.filter(p => p.type === "Salary").reduce((s, p) => s + p.amount, 0);
      const materialCost  = payables.filter(p => p.type === "Vendor").reduce((s, p) => s + p.amount, 0);
      const netRevenue    = totalRevenue;
      const netIncome     = netRevenue - totalExpenses;

      return {
        city: cityName,
        totalRevenue, totalRefunds: 0, netRevenue,
        totalExpenses, labourCost, materialCost,
        overheadCost: totalExpenses - labourCost - materialCost,
        netIncome,
        profitMargin: netRevenue > 0 ? Math.round((netIncome / netRevenue) * 1000) / 10 : 0,
        unitsCompleted:      cityJobs.length,
        activeCustomers:     cityCustomers.length,
        employeeCount:       cityEmployees.length,
        refundRate:          0,
        revenuePerUnit:      cityJobs.length > 0 ? Math.round(totalRevenue / cityJobs.length) : 0,
        revenuePerCustomer:  cityCustomers.length > 0 ? Math.round(totalRevenue / cityCustomers.length) : 0,
        revenuePerEmployee:  cityEmployees.length > 0 ? Math.round(totalRevenue / cityEmployees.length) : 0,
        costPerUnit:         cityJobs.length > 0 ? Math.round(totalExpenses / cityJobs.length) : 0,
        labourCostPerUnit:   cityJobs.length > 0 ? Math.round(labourCost / cityJobs.length) : 0,
      };
    });
  }, [availableCities, getRevenueByCity, getPayablesByCity, allJobs, customers, employees, payrollRuns]);

  // Calculate totals for benchmarking
  const totals = useMemo(() => ({
    totalRevenue: CITY_DATA.reduce((sum, city) => sum + city.totalRevenue, 0),
    totalUnits: CITY_DATA.reduce((sum, city) => sum + city.unitsCompleted, 0),
    totalCustomers: CITY_DATA.reduce((sum, city) => sum + city.activeCustomers, 0),
    avgProfitMargin:
      CITY_DATA.reduce((sum, city) => sum + city.profitMargin, 0) / CITY_DATA.length,
    avgRefundRate:
      CITY_DATA.reduce((sum, city) => sum + city.refundRate, 0) / CITY_DATA.length,
  }), []);

  // Revenue comparison data
  const revenueComparisonData = useMemo(() => CITY_DATA.map((city, idx) => ({
    id: `revenue-${city.city}`,
    city: city.city,
    revenue: city.totalRevenue / 100000, // Convert to lakhs
    netRevenue: city.netRevenue / 100000,
    refunds: city.totalRefunds / 100000,
  })), []);

  // Profitability comparison data
  const profitabilityData = useMemo(() => CITY_DATA.map((city, idx) => ({
    id: `profit-${city.city}`,
    city: city.city,
    netIncome: city.netIncome / 100000,
    profitMargin: city.profitMargin,
  })), []);

  // Cost structure comparison
  const costStructureData = useMemo(() => CITY_DATA.map((city, idx) => ({
    id: `cost-${city.city}`,
    city: city.city,
    labour: city.labourCost / 1000,
    material: city.materialCost / 1000,
    overhead: city.overheadCost / 1000,
  })), []);

  // Efficiency metrics comparison
  const efficiencyData = useMemo(() => CITY_DATA.map((city, idx) => ({
    id: `efficiency-${city.city}`,
    city: city.city,
    revenuePerUnit: city.revenuePerUnit,
    costPerUnit: city.costPerUnit,
    revenuePerCustomer: city.revenuePerCustomer / 1000,
  })), []);

  // Radar chart data for overall city performance
  const getRadarData = useCallback((cityName: string) => {
    const city = CITY_DATA.find((c) => c.city === cityName)!;
    return [
      {
        id: `${cityName}-revenue`,
        metric: "Revenue",
        value: (city.totalRevenue / totals.totalRevenue) * 100,
        fullMark: 100,
      },
      {
        id: `${cityName}-profit`,
        metric: "Profit Margin",
        value: (city.profitMargin / 60) * 100, // Max 60% margin
        fullMark: 100,
      },
      {
        id: `${cityName}-units`,
        metric: "Units",
        value: (city.unitsCompleted / totals.totalUnits) * 100,
        fullMark: 100,
      },
      {
        id: `${cityName}-customers`,
        metric: "Customers",
        value: (city.activeCustomers / totals.totalCustomers) * 100,
        fullMark: 100,
      },
      {
        id: `${cityName}-refund`,
        metric: "Refund Rate",
        value: Math.max(100 - city.refundRate * 5, 0), // Lower is better
        fullMark: 100,
      },
    ];
  }, [totals]);

  // Format currency

  return (
    <div className="space-y-6 p-6">
      <BackButton />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">City Comparison</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Comprehensive city-by-city performance analysis
        </p>
      </div>

      {/* Engine Label */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Database className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Data Source: analyticsEngine</p>
          <p className="text-xs text-blue-700">
            Aggregated from financeEngine, payrollEngine, operationsEngine, and subscriptionEngine
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CITY_DATA.map((city) => {
          const isTopRevenue = city.totalRevenue === Math.max(...CITY_DATA.map((c) => c.totalRevenue));
          const isTopProfit = city.profitMargin === Math.max(...CITY_DATA.map((c) => c.profitMargin));
          const isLowRefund = city.refundRate === Math.min(...CITY_DATA.map((c) => c.refundRate));

          return (
            <Card key={city.city} className={isTopRevenue ? "border-2 border-blue-500" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{city.city}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    {isTopRevenue && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        <Award className="w-3 h-3 mr-1" />
                        Top Revenue
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Revenue */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="font-medium">{formatCurrency(city.totalRevenue)}</span>
                </div>
                <Separator />

                {/* Net Income */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Net Income</span>
                  <span className="font-medium text-green-700">{formatCurrency(city.netIncome)}</span>
                </div>

                {/* Profit Margin */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Profit Margin</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{(city?.profitMargin ?? 0).toFixed(1)}%</span>
                    {isTopProfit && <Star className="w-4 h-4 text-yellow-500" />}
                  </div>
                </div>

                {/* Refund Rate */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Refund Rate</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        city.refundRate < 7
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : city.refundRate < 12
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                          : "bg-red-100 text-red-700 hover:bg-red-100"
                      }
                    >
                      {(city?.refundRate ?? 0).toFixed(1)}%
                    </Badge>
                    {isLowRefund && <Award className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
                <Separator />

                {/* Units & Customers */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Units</p>
                    <p className="font-medium">{(city?.unitsCompleted ?? 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Customers</p>
                    <p className="font-medium">{city.activeCustomers}</p>
                  </div>
                </div>

                {/* Per Unit Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Rev/Unit</p>
                    <p className="font-medium">₹{city.revenuePerUnit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost/Unit</p>
                    <p className="font-medium">₹{city.costPerUnit}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Metric Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-sm font-medium">Compare by:</span>
            <div className="flex gap-2">
              <Button
                variant={selectedMetric === "revenue" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMetric("revenue")}
              >
                Revenue
              </Button>
              <Button
                variant={selectedMetric === "profit" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMetric("profit")}
              >
                Profitability
              </Button>
              <Button
                variant={selectedMetric === "efficiency" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMetric("efficiency")}
              >
                Efficiency
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Comparison */}
      {selectedMetric === "revenue" && (
        <Fragment key="revenue-section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card key="revenue-refunds-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Revenue & Refunds Comparison</CardTitle>
                <Badge variant="outline">analyticsEngine</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <BarChartWrapper
                key="revenue-refunds-wrapper"
                data={revenueComparisonData}
                bars={[
                  { dataKey: "revenue", fill: "#3b82f6", name: "Total Revenue" },
                  { dataKey: "netRevenue", fill: "#10b981", name: "Net Revenue" },
                  { dataKey: "refunds", fill: "#ef4444", name: "Refunds" },
                ]}
                chartId="revenue-refunds"
              />
            </CardContent>
          </Card>

          <Card key="per-unit-revenue-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Per-Unit Revenue Comparison</CardTitle>
                <Badge variant="outline">analyticsEngine</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ComposedChartWrapper
                key="per-unit-revenue-wrapper"
                data={efficiencyData}
                bars={[
                  { dataKey: "revenuePerUnit", fill: "#3b82f6", name: "Revenue/Unit" },
                ]}
                lines={[
                  { dataKey: "costPerUnit", stroke: "#ef4444", strokeWidth: 2, name: "Cost/Unit" },
                ]}
                chartId="per-unit-revenue"
              />
            </CardContent>
          </Card>
        </div>
        </Fragment>
      )}

      {/* Profitability Comparison */}
      {selectedMetric === "profit" && (
        <Fragment key="profit-section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card key="net-income-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Net Income Comparison</CardTitle>
                <Badge variant="outline">analyticsEngine</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <BarChartWrapper
                key="net-income-wrapper"
                data={profitabilityData}
                bars={[
                  { dataKey: "netIncome", fill: "#10b981", name: "Net Income (₹L)" },
                ]}
                chartId="net-income"
              />
            </CardContent>
          </Card>

          <Card key="cost-structure-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Cost Structure Breakdown</CardTitle>
                <Badge variant="outline">analyticsEngine</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <BarChartWrapper
                key="cost-structure-wrapper"
                data={costStructureData}
                layout="vertical"
                bars={[
                  { dataKey: "labour", fill: "#3b82f6", name: "Labour", stackId: "a" },
                  { dataKey: "material", fill: "#10b981", name: "Material", stackId: "a" },
                  { dataKey: "overhead", fill: "#f59e0b", name: "Overhead", stackId: "a" },
                ]}
                chartId="cost-structure"
              />
            </CardContent>
          </Card>
        </div>
        </Fragment>
      )}

      {/* Efficiency Comparison */}
      {selectedMetric === "efficiency" && (
        <Fragment key="efficiency-section">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CITY_DATA.map((city) => (
            <Card key={`efficiency-card-${city.city}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{city.city} Performance</CardTitle>
                  <Badge variant="outline">analyticsEngine</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <RadarChartWrapper
                  key={`radar-wrapper-${city.city}`}
                  data={getRadarData(city.city)}
                  dataKey="value"
                  name={city.city}
                  chartId={`radar-${city.city}`}
                />
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue/Employee</span>
                    <span className="font-medium">{formatCurrency(city.revenuePerEmployee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue/Customer</span>
                    <span className="font-medium">{formatCurrency(city.revenuePerCustomer)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Labour Cost/Unit</span>
                    <span className="font-medium">₹{city.labourCostPerUnit}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </Fragment>
      )}

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Top Revenue City */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Award className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Top Revenue City</p>
              <p className="text-xs text-blue-700 mt-1">
                {CITY_DATA.reduce((max, city) => (city.totalRevenue > max.totalRevenue ? city : max)).city}{" "}
                leads with{" "}
                {formatCurrency(Math.max(...CITY_DATA.map((c) => c.totalRevenue)))} in total revenue
              </p>
            </div>
          </div>

          {/* Best Profit Margin */}
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Target className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Best Profit Margin</p>
              <p className="text-xs text-green-700 mt-1">
                {CITY_DATA.reduce((max, city) => (city.profitMargin > max.profitMargin ? city : max)).city}{" "}
                achieves {Math.max(...CITY_DATA.map((c) => c.profitMargin)).toFixed(1)}% profit margin
              </p>
            </div>
          </div>

          {/* Highest Refund Rate Alert */}
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Attention Required</p>
              <p className="text-xs text-red-700 mt-1">
                {CITY_DATA.reduce((max, city) => (city.refundRate > max.refundRate ? city : max)).city}{" "}
                has highest refund rate at {Math.max(...CITY_DATA.map((c) => c.refundRate)).toFixed(1)}%
                - investigate root causes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CityComparison;

// Import Star icon
import { Star } from "lucide-react";
import { formatCurrency } from "../../lib/formatters";
