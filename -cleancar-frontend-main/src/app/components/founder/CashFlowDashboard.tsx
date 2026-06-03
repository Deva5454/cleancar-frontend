import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BackButton } from "../ui/back-button";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
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
  Legend,
  ComposedChart,
} from "recharts";

const cashFlowSummary = {
  openingBalance: 7450000,
  totalInflow: 2845000,
  totalOutflow: 1795000,
  closingBalance: 8500000,
  netCashFlow: 1050000,
  burnRate: 450000,
  cashRunway: 18.9,
};

const dailyCashFlow = [
  { id: "d1", date: "Jun 1", inflow: 95000, outflow: 58000, net: 37000, balance: 7487000 },
  { id: "d2", date: "Jun 2", inflow: 98000, outflow: 62000, net: 36000, balance: 7523000 },
  { id: "d3", date: "Jun 3", inflow: 102000, outflow: 59000, net: 43000, balance: 7566000 },
  { id: "d4", date: "Jun 4", inflow: 89000, outflow: 61000, net: 28000, balance: 7594000 },
  { id: "d5", date: "Jun 5", inflow: 105000, outflow: 63000, net: 42000, balance: 7636000 },
  { id: "d6", date: "Jun 6", inflow: 92000, outflow: 57000, net: 35000, balance: 7671000 },
  { id: "d7", date: "Jun 7", inflow: 110000, outflow: 65000, net: 45000, balance: 7716000 },
];

const monthlyBurnRate = [
  { id: "m1", month: "Jan", burnRate: 385000, revenue: 2145000, expenses: 985000 },
  { id: "m2", month: "Feb", burnRate: 395000, revenue: 2285000, expenses: 1045000 },
  { id: "m3", month: "Mar", burnRate: 410000, revenue: 2450000, expenses: 1125000 },
  { id: "m4", month: "Apr", burnRate: 425000, revenue: 2585000, expenses: 1165000 },
  { id: "m5", month: "May", burnRate: 435000, revenue: 2745000, expenses: 1215000 },
  { id: "m6", month: "Jun", burnRate: 450000, revenue: 2845000, expenses: 1245000 },
];

const cashInflowBreakdown = [
  { id: "in-1", source: "Subscription Payments", amount: 1845000, percentage: 64.8 },
  { id: "in-2", source: "One-time Services", amount: 485000, percentage: 17.0 },
  { id: "in-3", source: "Corporate Payments", amount: 385000, percentage: 13.5 },
  { id: "in-4", source: "Add-on Services", amount: 130000, percentage: 4.6 },
];

const cashOutflowBreakdown = [
  { id: "out-1", category: "Salaries & Wages", amount: 685000, percentage: 38.2 },
  { id: "out-2", category: "Rent & Facilities", amount: 245000, percentage: 13.7 },
  { id: "out-3", category: "Operational Costs", amount: 425000, percentage: 23.7 },
  { id: "out-4", category: "Marketing", amount: 185000, percentage: 10.3 },
  { id: "out-5", category: "Equipment & Maintenance", amount: 125000, percentage: 7.0 },
  { id: "out-6", category: "Other Expenses", amount: 130000, percentage: 7.2 },
];

const cashRunwayProjection = [
  { id: "proj-1", month: "Current", balance: 8500000 },
  { id: "proj-2", month: "Month 1", balance: 8050000 },
  { id: "proj-3", month: "Month 2", balance: 7600000 },
  { id: "proj-4", month: "Month 3", balance: 7150000 },
  { id: "proj-5", month: "Month 6", balance: 5700000 },
  { id: "proj-6", month: "Month 9", balance: 4250000 },
  { id: "proj-7", month: "Month 12", balance: 2800000 },
  { id: "proj-8", month: "Month 15", balance: 1350000 },
  { id: "proj-9", month: "Month 18", balance: 100000 },
];

function CashFlowDashboard() {
  const { currentRole } = useRole();

  const hasAccess = currentRole === "Super Admin" || currentRole === "Admin";

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg font-semibold">Access Denied</div>
            <p className="text-gray-500 mt-2">
              You don't have permission to access Cash Flow Dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Flow Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor cash position, burn rate, and runway projections
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            This Month
          </Button>
          <Button size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Cash Flow Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Closing Balance</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{(cashFlowSummary.closingBalance / 100000).toFixed(1)}L
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+{((cashFlowSummary.netCashFlow / cashFlowSummary.openingBalance) * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Inflow</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  ₹{(cashFlowSummary.totalInflow / 100000).toFixed(1)}L
                </div>
                <div className="text-xs text-gray-600 mt-2">This month</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Outflow</div>
                <div className="text-3xl font-bold text-red-600 mt-2">
                  ₹{(cashFlowSummary.totalOutflow / 100000).toFixed(1)}L
                </div>
                <div className="text-xs text-gray-600 mt-2">This month</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Cash Runway</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">
                  {cashFlowSummary.cashRunway.toFixed(1)}m
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600">Healthy</span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <span className="font-medium text-gray-900">Positive Cash Flow Trend</span>
              <span className="text-sm text-gray-600 ml-2">• Net cash flow of ₹{(cashFlowSummary.netCashFlow / 1000).toFixed(0)}K this month</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Cash Flow Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Cash Flow (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={dailyCashFlow} id="daily-cashflow-chart">
              <CartesianGrid key="daily-grid" strokeDasharray="3 3" />
              <XAxis key="daily-xaxis" dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis key="daily-yaxis" yAxisId="left" />
              <YAxis key="daily-yaxis-right" yAxisId="right" orientation="right" />
              <RechartsTooltip key="daily-tooltip" />
              <Legend key="daily-legend" />
              <Bar key="daily-inflow-bar" yAxisId="left" dataKey="inflow" fill="#10b981" name="Cash Inflow" />
              <Bar key="daily-outflow-bar" yAxisId="left" dataKey="outflow" fill="#ef4444" name="Cash Outflow" />
              <Line key="daily-balance-line" yAxisId="right" type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Closing Balance" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Inflow & Outflow Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Cash Inflow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cash Inflow Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cashInflowBreakdown.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">{item.source}</span>
                    <span className="text-sm font-semibold">₹{(item.amount / 1000).toFixed(0)}K ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Inflow</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{(cashFlowSummary.totalInflow / 100000).toFixed(1)}L
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Outflow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cash Outflow Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-xs font-semibold text-gray-700">Category</th>
                    <th className="text-right p-2 text-xs font-semibold text-gray-700">Amount</th>
                    <th className="text-right p-2 text-xs font-semibold text-gray-700">%</th>
                  </tr>
                </thead>
                <tbody>
                  {cashOutflowBreakdown.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-sm">{item.category}</td>
                      <td className="p-2 text-right text-sm font-medium">₹{(item.amount / 1000).toFixed(0)}K</td>
                      <td className="p-2 text-right text-sm">{item.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-bold">
                    <td className="p-2">Total</td>
                    <td className="p-2 text-right text-red-600">₹{(cashFlowSummary.totalOutflow / 100000).toFixed(1)}L</td>
                    <td className="p-2 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Burn Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Burn Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyBurnRate} id="burnrate-chart">
              <CartesianGrid key="burn-grid" strokeDasharray="3 3" />
              <XAxis key="burn-xaxis" dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis key="burn-yaxis" tick={{ fontSize: 11 }} width={50} />
              <RechartsTooltip key="burn-tooltip" />
              <Legend key="burn-legend" />
              <Area
                key="burn-area"
                type="monotone"
                dataKey="burnRate"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
                name="Burn Rate"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-orange-900">Current Monthly Burn Rate</div>
                <div className="text-sm text-orange-800 mt-1">
                  ₹{(cashFlowSummary.burnRate / 1000).toFixed(0)}K per month • Based on current expenses, cash will last {cashFlowSummary.cashRunway.toFixed(1)} months
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Runway Projection */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Runway Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cashRunwayProjection} id="runway-chart">
              <CartesianGrid key="runway-grid" strokeDasharray="3 3" />
              <XAxis key="runway-xaxis" dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis key="runway-yaxis" tick={{ fontSize: 11 }} width={50} />
              <RechartsTooltip key="runway-tooltip" />
              <Area
                key="runway-area"
                type="monotone"
                dataKey="balance"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
                name="Projected Cash Balance"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 font-medium">Safe Zone</div>
              <div className="text-xs text-green-600 mt-1">0-12 months</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-700 font-medium">Caution Zone</div>
              <div className="text-xs text-yellow-600 mt-1">12-18 months</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-700 font-medium">Critical Zone</div>
              <div className="text-xs text-red-600 mt-1">18+ months</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CashFlowDashboard;
