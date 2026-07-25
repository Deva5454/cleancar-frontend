import { useState, useMemo } from "react";
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
import { useGlobalFilters } from "../navigation/GlobalFilterBar";
import { accountingEntryService } from "../../services/accountingEntryService";
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

function CashFlowDashboard() {
  const { currentRole } = useRole();
  const { filters } = useGlobalFilters();

  // ✅ FIX (FCT-DEF-04): real cash flow, replacing 100% hardcoded inline
  // data (openingBalance: 7450000, dates literally "Jun 1", etc.) with
  // real computations from the accounting engine — same real
  // getAllMovements()/getLedgers() functions TrialBalance.tsx and the
  // now-fixed FounderControlTower.tsx already use correctly.
  const accountingCityId = (filters.city === "ALL" || !filters.city) ? undefined : filters.city;
  const todayObj = new Date();
  const periodStart = filters.startDate || new Date(todayObj.getFullYear(), todayObj.getMonth(), 1).toISOString().split("T")[0];
  const periodEnd = filters.endDate || todayObj.toISOString().split("T")[0];

  const cashLedgerIds = useMemo(() => {
    const ledgers = accountingEntryService.getLedgers(accountingCityId) || [];
    return new Set(ledgers.filter((l: any) => l.accountHead === "bank" || l.accountHead === "cash").map((l: any) => l.id));
  }, [accountingCityId]);

  const balanceAsOf = (asOfDate: string) => {
    const movements = accountingEntryService.getAllMovements("1900-01-01", asOfDate, accountingCityId) || [];
    let balance = 0;
    movements.forEach((m: any) => {
      if (cashLedgerIds.has(m.debitLedgerId)) balance += m.amount;
      if (cashLedgerIds.has(m.creditLedgerId)) balance -= m.amount;
    });
    return balance;
  };

  const dayBefore = (dateStr: string) => new Date(new Date(dateStr).getTime() - 86400000).toISOString().split("T")[0];

  const periodMovements = useMemo(
    () => accountingEntryService.getAllMovements(periodStart, periodEnd, accountingCityId) || [],
    [periodStart, periodEnd, accountingCityId]
  );

  const openingBalance = useMemo(() => balanceAsOf(dayBefore(periodStart)), [cashLedgerIds, periodStart, accountingCityId]);
  const closingBalance = useMemo(() => balanceAsOf(periodEnd), [cashLedgerIds, periodEnd, accountingCityId]);

  const totalInflow = periodMovements.filter((m: any) => cashLedgerIds.has(m.debitLedgerId)).reduce((s: number, m: any) => s + m.amount, 0);
  const totalOutflow = periodMovements.filter((m: any) => cashLedgerIds.has(m.creditLedgerId)).reduce((s: number, m: any) => s + m.amount, 0);
  const netCashFlow = totalInflow - totalOutflow;

  const periodDays = Math.max(1, Math.round((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / 86400000) + 1);
  const burnRate = Math.round((totalOutflow / periodDays) * 30); // real, period-normalised to a 30-day rate
  const cashRunway = burnRate > 0 ? closingBalance / burnRate : 0;

  const cashFlowSummary = { openingBalance, totalInflow, totalOutflow, closingBalance, netCashFlow, burnRate, cashRunway };

  // Real day-by-day cash flow within the period, from real movements.
  const dailyCashFlow = useMemo(() => {
    const byDate: Record<string, { inflow: number; outflow: number }> = {};
    periodMovements.forEach((m: any) => {
      if (!byDate[m.date]) byDate[m.date] = { inflow: 0, outflow: 0 };
      if (cashLedgerIds.has(m.debitLedgerId)) byDate[m.date].inflow += m.amount;
      if (cashLedgerIds.has(m.creditLedgerId)) byDate[m.date].outflow += m.amount;
    });
    let runningBalance = openingBalance;
    return Object.keys(byDate).sort().map((date) => {
      const { inflow, outflow } = byDate[date];
      runningBalance += inflow - outflow;
      return { id: date, date, inflow, outflow, net: inflow - outflow, balance: runningBalance };
    });
  }, [periodMovements, cashLedgerIds, openingBalance]);

  // Real last 6 months of revenue/expenses/burn — walking back from the period end.
  const monthlyBurnRate = useMemo(() => {
    const months: Array<{ id: string; month: string; burnRate: number; revenue: number; expenses: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(todayObj.getFullYear(), todayObj.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
      const mMovements = accountingEntryService.getAllMovements(mStart, mEnd, accountingCityId) || [];
      const mInflow = mMovements.filter((m: any) => cashLedgerIds.has(m.debitLedgerId)).reduce((s: number, m: any) => s + m.amount, 0);
      const mOutflow = mMovements.filter((m: any) => cashLedgerIds.has(m.creditLedgerId)).reduce((s: number, m: any) => s + m.amount, 0);
      months.push({ id: `m${6 - i}`, month: d.toLocaleString("en-IN", { month: "short" }), burnRate: mOutflow, revenue: mInflow, expenses: mOutflow });
    }
    return months;
  }, [accountingCityId, cashLedgerIds]);

  // Real inflow breakdown — grouped by which real ledger the money came
  // from, for movements that actually debited Bank/Cash.
  const cashInflowBreakdown = useMemo(() => {
    const bySource: Record<string, number> = {};
    periodMovements.filter((m: any) => cashLedgerIds.has(m.debitLedgerId)).forEach((m: any) => {
      bySource[m.creditLedgerName] = (bySource[m.creditLedgerName] || 0) + m.amount;
    });
    return Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([source, amount], i) => ({
      id: `in-${i}`, source, amount, percentage: totalInflow > 0 ? Number(((amount / totalInflow) * 100).toFixed(1)) : 0,
    }));
  }, [periodMovements, cashLedgerIds, totalInflow]);

  // Real outflow breakdown — grouped by which real ledger the money went to.
  const cashOutflowBreakdown = useMemo(() => {
    const byCategory: Record<string, number> = {};
    periodMovements.filter((m: any) => cashLedgerIds.has(m.creditLedgerId)).forEach((m: any) => {
      byCategory[m.debitLedgerName] = (byCategory[m.debitLedgerName] || 0) + m.amount;
    });
    return Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([category, amount], i) => ({
      id: `out-${i}`, category, amount, percentage: totalOutflow > 0 ? Number(((amount / totalOutflow) * 100).toFixed(1)) : 0,
    }));
  }, [periodMovements, cashLedgerIds, totalOutflow]);

  // Real runway projection — a simple, disclosed linear projection from
  // the real current balance and real burn rate, NOT a forecast model.
  const cashRunwayProjection = useMemo(() => {
    const points = [0, 1, 2, 3, 6, 9, 12, 15, 18];
    return points.map((m, i) => ({
      id: `proj-${i}`,
      month: m === 0 ? "Current" : `Month ${m}`,
      balance: Math.max(0, Math.round(closingBalance - burnRate * m)),
    }));
  }, [closingBalance, burnRate]);

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
                  {cashFlowSummary.netCashFlow >= 0
                    ? <ArrowUpRight className="w-4 h-4 text-green-500" />
                    : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                  <span className={`text-sm ${cashFlowSummary.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {cashFlowSummary.openingBalance > 0
                      ? `${cashFlowSummary.netCashFlow >= 0 ? "+" : ""}${((cashFlowSummary.netCashFlow / cashFlowSummary.openingBalance) * 100).toFixed(1)}%`
                      : `₹${(Math.abs(cashFlowSummary.netCashFlow) / 100000).toFixed(1)}L`}
                  </span>
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
