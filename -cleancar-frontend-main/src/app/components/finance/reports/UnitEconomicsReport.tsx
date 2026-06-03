/**
 * Unit Economics Report - Per-wash financial metrics
 *
 * Data Source: ledger_entries table + wash_count metadata
 *
 * Logic:
 * - Total Revenue = SUM(credit) WHERE account IN (4000-4999) from ledger
 * - Total Costs = SUM(debit) WHERE account IN (5000-5999) from ledger
 * - Total Washes = COUNT from wash transactions metadata
 * - Revenue per Wash = Total Revenue / Total Washes
 * - Cost per Wash = Total Costs / Total Washes
 * - Profit per Wash = Revenue per Wash - Cost per Wash
 *
 * Breakdown by:
 * - Service type (Subscription, On-Demand, Deep Clean)
 * - City
 * - Time trend
 *
 * @component
 */

import { useState, useEffect } from "react";
import { formatCurrency } from "../../../lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Activity,
} from "lucide-react";
import { ReportFilters } from "../FinancialReportsModule";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UnitEconomics {
  serviceType: string;
  totalWashes: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  revenuePerWash: number;
  costPerWash: number;
  profitPerWash: number;
  profitMargin: number;
}

interface UnitEconomicsSummary {
  totalWashes: number;
  avgRevenuePerWash: number;
  avgCostPerWash: number;
  avgProfitPerWash: number;
  overallMargin: number;
}

interface MonthlyUnitEconomics {
  month: string;
  washes: number;
  revenuePerWash: number;
  costPerWash: number;
  profitPerWash: number;
}

interface CostBreakdown {
  category: string;
  totalCost: number;
  costPerWash: number;
  percentage: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockUnitEconomics: UnitEconomics[] = [
  {
    serviceType: "Subscription",
    totalWashes: 24500,
    totalRevenue: 2850000,
    totalCost: 2205000,
    totalProfit: 645000,
    revenuePerWash: 116.33,
    costPerWash: 90.00,
    profitPerWash: 26.33,
    profitMargin: 22.6,
  },
  {
    serviceType: "On-Demand",
    totalWashes: 4200,
    totalRevenue: 980000,
    totalCost: 672000,
    totalProfit: 308000,
    revenuePerWash: 233.33,
    costPerWash: 160.00,
    profitPerWash: 73.33,
    profitMargin: 31.4,
  },
  {
    serviceType: "Deep Clean",
    totalWashes: 1100,
    totalRevenue: 520000,
    totalCost: 418000,
    totalProfit: 102000,
    revenuePerWash: 472.73,
    costPerWash: 380.00,
    profitPerWash: 92.73,
    profitMargin: 19.6,
  },
];

const mockMonthlyTrend: MonthlyUnitEconomics[] = [
  { month: "Jan", washes: 26800, revenuePerWash: 119.40, costPerWash: 115.67, profitPerWash: 3.73 },
  { month: "Feb", washes: 28200, revenuePerWash: 120.57, costPerWash: 111.70, profitPerWash: 8.87 },
  { month: "Mar", washes: 29500, revenuePerWash: 123.73, costPerWash: 111.19, profitPerWash: 12.54 },
  { month: "Apr", washes: 29800, revenuePerWash: 146.00, costPerWash: 120.64, profitPerWash: 25.36 },
];

const mockCostBreakdown: CostBreakdown[] = [
  { category: "Labour", totalCost: 1910000, costPerWash: 64.09, percentage: 53.1 },
  { category: "Materials", totalCost: 450000, costPerWash: 15.10, percentage: 12.5 },
  { category: "Vehicle", totalCost: 320000, costPerWash: 10.74, percentage: 8.9 },
  { category: "Overheads", totalCost: 915000, costPerWash: 30.71, percentage: 25.5 },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface UnitEconomicsReportProps {
  filters: ReportFilters;
}

export function UnitEconomicsReport({ filters }: UnitEconomicsReportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [unitEconomics, setUnitEconomics] = useState<UnitEconomics[]>(mockUnitEconomics);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyUnitEconomics[]>(mockMonthlyTrend);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>(mockCostBreakdown);

  useEffect(() => {
    loadUnitEconomicsData();
  }, [filters]);

  async function loadUnitEconomicsData() {
    setIsLoading(true);
    try {
      // In production: Query ledger_entries + wash metadata
      /*
      const unitEconData = await financeEngine.getUnitEconomics({
        city: filters.city,
        startDate: filters.startDate,
        endDate: filters.endDate,
        serviceType: filters.serviceType
      });

      // SQL Query example:
      // WITH revenue AS (
      //   SELECT
      //     service_type,
      //     SUM(amount) as total_revenue
      //   FROM ledger_entries
      //   WHERE account_code BETWEEN '4000' AND '4999'
      //     AND posting_date BETWEEN ? AND ?
      //   GROUP BY service_type
      // ),
      // costs AS (
      //   SELECT
      //     service_type,
      //     SUM(amount) as total_cost
      //   FROM ledger_entries
      //   WHERE account_code BETWEEN '5000' AND '5999'
      //     AND posting_date BETWEEN ? AND ?
      //   GROUP BY service_type
      // ),
      // washes AS (
      //   SELECT
      //     service_type,
      //     COUNT(*) as total_washes
      //   FROM transactions_metadata
      //   WHERE transaction_date BETWEEN ? AND ?
      //   GROUP BY service_type
      // )
      // SELECT
      //   r.service_type,
      //   w.total_washes,
      //   r.total_revenue,
      //   c.total_cost,
      //   r.total_revenue / w.total_washes as revenue_per_wash,
      //   c.total_cost / w.total_washes as cost_per_wash
      // FROM revenue r
      // JOIN costs c ON r.service_type = c.service_type
      // JOIN washes w ON r.service_type = w.service_type
      */

      await new Promise((resolve) => setTimeout(resolve, 800));

      setUnitEconomics(mockUnitEconomics);
      setMonthlyTrend(mockMonthlyTrend);
      setCostBreakdown(mockCostBreakdown);
    } catch (error) {
      console.error("Failed to load unit economics data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const summary: UnitEconomicsSummary = {
    totalWashes: unitEconomics.reduce((sum, item) => sum + item.totalWashes, 0),
    avgRevenuePerWash: 0,
    avgCostPerWash: 0,
    avgProfitPerWash: 0,
    overallMargin: 0,
  };

  const totalRevenue = unitEconomics.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalCost = unitEconomics.reduce((sum, item) => sum + item.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;

  summary.avgRevenuePerWash = totalRevenue / summary.totalWashes;
  summary.avgCostPerWash = totalCost / summary.totalWashes;
  summary.avgProfitPerWash = totalProfit / summary.totalWashes;
  summary.overallMargin = (totalProfit / totalRevenue) * 100;

  const isProfitablePerWash = summary.avgProfitPerWash > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading unit economics data from ledger...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Total Washes</p>
              <p className="text-2xl font-bold text-gray-700">
                {formatNumber(summary.totalWashes)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filters.startDate} to {filters.endDate}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Revenue / Wash</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(summary.avgRevenuePerWash)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Average per wash</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Cost / Wash</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(summary.avgCostPerWash)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Average per wash</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${isProfitablePerWash ? 'border-blue-300 bg-blue-50' : 'border-orange-300 bg-orange-50'}`}>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Profit / Wash</p>
              <p className={`text-2xl font-bold ${isProfitablePerWash ? 'text-blue-700' : 'text-orange-700'}`}>
                {formatCurrency(summary.avgProfitPerWash)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Average per wash</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-300 bg-purple-50">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Profit Margin</p>
              <p className="text-2xl font-bold text-purple-700">
                {summary.overallMargin.toFixed(1)}%
              </p>
              <Badge className={`mt-2 ${isProfitablePerWash ? 'bg-green-600' : 'bg-red-600'}`}>
                {isProfitablePerWash ? 'Healthy' : 'Low'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Unit Economics Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tickFormatter={(value) => `₹${value}`} />
              <YAxis yAxisId="right" orientation="right"  tick={{ fontSize: 11 }} width={50} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar yAxisId="left" dataKey="revenuePerWash" fill="#10b981" name="Revenue/Wash" />
              <Bar yAxisId="left" dataKey="costPerWash" fill="#ef4444" name="Cost/Wash" />
              <Line yAxisId="left" type="monotone" dataKey="profitPerWash" stroke="#3b82f6" strokeWidth={3} name="Profit/Wash" />
              <Line yAxisId="right" type="monotone" dataKey="washes" stroke="#8b5cf6" strokeWidth={2} name="Total Washes" strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Unit Economics by Service Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Unit Economics by Service Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Type</TableHead>
                <TableHead className="text-right">Total Washes</TableHead>
                <TableHead className="text-right">Revenue/Wash</TableHead>
                <TableHead className="text-right">Cost/Wash</TableHead>
                <TableHead className="text-right">Profit/Wash</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unitEconomics.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.serviceType}</TableCell>
                  <TableCell className="text-right">{formatNumber(item.totalWashes)}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatCurrency(item.revenuePerWash)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {formatCurrency(item.costPerWash)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${item.profitPerWash >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(item.profitPerWash)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={`${item.profitMargin >= 20 ? 'bg-green-600' : item.profitMargin >= 10 ? 'bg-yellow-600' : 'bg-red-600'}`}>
                      {item.profitMargin.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-bold">
                <TableCell>Overall Average</TableCell>
                <TableCell className="text-right">{formatNumber(summary.totalWashes)}</TableCell>
                <TableCell className="text-right text-green-700">
                  {formatCurrency(summary.avgRevenuePerWash)}
                </TableCell>
                <TableCell className="text-right text-red-700">
                  {formatCurrency(summary.avgCostPerWash)}
                </TableCell>
                <TableCell className={`text-right ${isProfitablePerWash ? 'text-blue-700' : 'text-orange-700'}`}>
                  {formatCurrency(summary.avgProfitPerWash)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge className={`${summary.overallMargin >= 20 ? 'bg-green-600' : summary.overallMargin >= 10 ? 'bg-yellow-600' : 'bg-red-600'}`}>
                    {summary.overallMargin.toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cost Breakdown per Wash */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost Breakdown per Wash</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cost Category</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Cost per Wash</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costBreakdown.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {formatCurrency(item.costPerWash)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-gray-600">
                    {item.percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ledger Query Info */}
      <Card className="border-blue-300 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Data Source: ledger_entries + wash metadata</p>
              <p className="mt-1">
                Revenue per Wash = SUM(revenue from ledger) / COUNT(washes from metadata)<br />
                Cost per Wash = SUM(expenses from ledger) / COUNT(washes from metadata)<br />
                Profit per Wash = Revenue per Wash - Cost per Wash<br />
                <br />
                <strong>Note:</strong> Wash count comes from transaction metadata, all financial data from ledger_entries
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
