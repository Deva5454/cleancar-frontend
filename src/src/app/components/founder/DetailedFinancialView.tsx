import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BackButton } from "../ui/back-button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
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

const profitLossStatement = {
  revenue: {
    subscriptions: 1845000,
    oneTimeWashes: 485000,
    corporateContracts: 385000,
    addOns: 130000,
    total: 2845000,
  },
  expenses: {
    salaries: 685000,
    rent: 245000,
    utilities: 125000,
    chemicals: 95000,
    equipment: 45000,
    marketing: 50000,
    total: 1245000,
  },
  grossProfit: 1600000,
  grossMargin: 56.2,
  netProfit: 1600000,
  netMargin: 56.2,
};

const monthlyPnL = [
  { id: "jan", month: "Jan", revenue: 2145000, expenses: 985000, profit: 1160000 },
  { id: "feb", month: "Feb", revenue: 2285000, expenses: 1045000, profit: 1240000 },
  { id: "mar", month: "Mar", revenue: 2450000, expenses: 1125000, profit: 1325000 },
  { id: "apr", month: "Apr", revenue: 2585000, expenses: 1165000, profit: 1420000 },
  { id: "may", month: "May", revenue: 2745000, expenses: 1215000, profit: 1530000 },
  { id: "jun", month: "Jun", revenue: 2845000, expenses: 1245000, profit: 1600000 },
];

const cashFlowData = [
  { id: "w1", week: "Week 1", inflow: 685000, outflow: 285000, net: 400000 },
  { id: "w2", week: "Week 2", inflow: 725000, outflow: 325000, net: 400000 },
  { id: "w3", week: "Week 3", inflow: 695000, outflow: 295000, net: 400000 },
  { id: "w4", week: "Week 4", inflow: 740000, outflow: 340000, net: 400000 },
];

const expenseBreakdown = [
  { id: "exp-1", category: "Salaries & Wages", amount: 685000, percentage: 55.0, trend: "+2.5%" },
  { id: "exp-2", category: "Rent & Facilities", amount: 245000, percentage: 19.7, trend: "0%" },
  { id: "exp-3", category: "Utilities", amount: 125000, percentage: 10.0, trend: "+5.2%" },
  { id: "exp-4", category: "Chemicals & Supplies", amount: 95000, percentage: 7.6, trend: "-3.1%" },
  { id: "exp-5", category: "Marketing", amount: 50000, percentage: 4.0, trend: "+12.5%" },
  { id: "exp-6", category: "Equipment & Maintenance", amount: 45000, percentage: 3.6, trend: "-1.8%" },
];

const revenueGrowth = [
  { id: "rev-1", category: "Subscriptions", current: 1845000, previous: 1625000, growth: 13.5 },
  { id: "rev-2", category: "One-time Washes", current: 485000, previous: 465000, growth: 4.3 },
  { id: "rev-3", category: "Corporate Contracts", current: 385000, previous: 325000, growth: 18.5 },
  { id: "rev-4", category: "Add-ons", current: 130000, previous: 115000, growth: 13.0 },
];

function DetailedFinancialView() {
  const { currentRole } = useRole();

  const hasAccess = currentRole === "Super Admin" || currentRole === "Admin";

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg font-semibold">Access Denied</div>
            <p className="text-gray-500 mt-2">
              You don't have permission to access Detailed Financial View.
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
          <h1 className="text-2xl font-bold text-gray-900">Detailed Financial View</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive P&L, Cash Flow, and Expense Analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            This Month
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Jun 2026
          </Button>
          <Button size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export P&L
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Revenue</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{(profitLossStatement.revenue.total / 100000).toFixed(1)}L
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+15.2%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Expenses</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{(profitLossStatement.expenses.total / 100000).toFixed(1)}L
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">+8.5%</span>
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Gross Profit</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  ₹{(profitLossStatement.grossProfit / 100000).toFixed(1)}L
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm text-gray-600">Margin: {profitLossStatement.grossMargin}%</span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
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
                  ₹{(profitLossStatement.netProfit / 100000).toFixed(1)}L
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm text-gray-600">Margin: {profitLossStatement.netMargin}%</span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly P&L Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Profit & Loss Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={monthlyPnL} id="monthly-pnl-chart">
              <CartesianGrid key="pnl-grid" strokeDasharray="3 3" />
              <XAxis key="pnl-xaxis" dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis key="pnl-yaxis" tick={{ fontSize: 11 }} width={50} />
              <RechartsTooltip key="pnl-tooltip" />
              <Legend key="pnl-legend" />
              <Bar key="pnl-revenue-bar" dataKey="revenue" fill="#3b82f6" name="Revenue" />
              <Bar key="pnl-expenses-bar" dataKey="expenses" fill="#ef4444" name="Expenses" />
              <Line key="pnl-profit-line" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name="Net Profit" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue & Expense Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Subscriptions</span>
                <span className="text-lg font-bold text-blue-600">₹{(profitLossStatement.revenue.subscriptions / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">One-time Washes</span>
                <span className="text-lg font-bold text-green-600">₹{(profitLossStatement.revenue.oneTimeWashes / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">Corporate Contracts</span>
                <span className="text-lg font-bold text-purple-600">₹{(profitLossStatement.revenue.corporateContracts / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">Add-ons</span>
                <span className="text-lg font-bold text-orange-600">₹{(profitLossStatement.revenue.addOns / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                <span className="font-bold">Total Revenue</span>
                <span className="text-xl font-bold text-gray-900">₹{(profitLossStatement.revenue.total / 100000).toFixed(1)}L</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-semibold text-gray-700">Category</th>
                    <th className="text-right p-2 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="text-right p-2 text-sm font-semibold text-gray-700">%</th>
                    <th className="text-right p-2 text-sm font-semibold text-gray-700">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseBreakdown.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-sm">{expense.category}</td>
                      <td className="p-2 text-right font-medium">₹{(expense.amount / 1000).toFixed(0)}K</td>
                      <td className="p-2 text-right">{expense.percentage}%</td>
                      <td className="p-2 text-right">
                        <span className={expense.trend.startsWith("+") ? "text-red-600" : "text-green-600"}>
                          {expense.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-bold">
                    <td className="p-2">Total</td>
                    <td className="p-2 text-right">₹{(profitLossStatement.expenses.total / 100000).toFixed(1)}L</td>
                    <td className="p-2 text-right">100%</td>
                    <td className="p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowData} id="cashflow-chart">
              <CartesianGrid key="cashflow-grid" strokeDasharray="3 3" />
              <XAxis key="cashflow-xaxis" dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis key="cashflow-yaxis" tick={{ fontSize: 11 }} width={50} />
              <RechartsTooltip key="cashflow-tooltip" />
              <Legend key="cashflow-legend" />
              <Bar key="cashflow-inflow-bar" dataKey="inflow" fill="#10b981" name="Cash Inflow" />
              <Bar key="cashflow-outflow-bar" dataKey="outflow" fill="#ef4444" name="Cash Outflow" />
              <Line key="cashflow-net-line" type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net Cash Flow" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Growth Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Category Growth Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Current Month</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Previous Month</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Growth</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {revenueGrowth.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{item.category}</td>
                    <td className="p-3 text-right font-semibold">₹{(item.current / 1000).toFixed(0)}K</td>
                    <td className="p-3 text-right text-gray-600">₹{(item.previous / 1000).toFixed(0)}K</td>
                    <td className="p-3 text-right">
                      <span className="text-green-600 font-medium">+{item.growth}%</span>
                    </td>
                    <td className="p-3 text-center">
                      {item.growth > 10 ? (
                        <Badge className="bg-green-500">Strong Growth</Badge>
                      ) : (
                        <Badge className="bg-blue-500">Stable</Badge>
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

export default DetailedFinancialView;
