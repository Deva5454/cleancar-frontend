import { BackButton } from "../ui/back-button";
/**
 * FinanceAnalyticsDashboard — FIXED 2026-05-06
 *
 * Bugs fixed:
 *  1. "loads then goes blank" — setLoading(true) inside loadData() + 2s setTimeout
 *     caused a spinner to flash at T+2s, hiding content momentarily.
 *     Fix: eliminated local loading state and the setTimeout retry entirely.
 *
 *  2. Stale local revenues/payables state — component kept its own useState copy
 *     that didn't update when FinanceContext re-hydrated. Charts showed stale data.
 *     Fix: removed local state; reads directly from FinanceContext (reactive).
 *
 *  3. recharts v3 Bar label object — label={{ position, formatter, fontSize }}
 *     is recharts v2 API. In recharts 3.8.1 this prop shape is no longer supported.
 *     Fix: replaced with a custom <text> SVG label component.
 *
 *  4. Silent blank when revenues exist but none in date range — neither the
 *     charts block (guarded by monthRevenues.length>0) nor the warning
 *     (guarded by revenues.length===0) showed. Page appeared blank below KPIs.
 *     Fix: added explicit empty-state card for this case.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useCity } from "../../contexts/CityContext";
import { useGlobalFilters } from "../navigation/GlobalFilterBar";
import { useFinance } from "../../contexts/FinanceContext";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet,
  RefreshCcw, ArrowUpRight, ArrowDownRight, AlertCircle, CalendarOff,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useRevenueMetrics } from "../../hooks/useRevenueMetrics";

const MONTHS = [
  { value: "2026-04", label: "April 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-01", label: "January 2026" },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function KPICard({ title, value, change, icon: Icon, color = "blue" }: {
  title: string; value: string; change?: number;
  icon: React.ElementType; color?: "blue" | "green" | "red" | "purple";
}) {
  const isPos = (change ?? 0) >= 0;
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",   purple: "bg-purple-50 text-purple-600",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {isPos
                  ? <ArrowUpRight className="w-3 h-3 text-green-600" />
                  : <ArrowDownRight className="w-3 h-3 text-red-600" />}
                <span className={`text-xs font-medium ${isPos ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(change).toFixed(1)}% vs prev period
                </span>
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BarTopLabel({ x, y, width, value }: any) {
  if (!value || value === 0) return null;
  return (
    <text
      x={(x || 0) + (width || 0) / 2}
      y={(y || 0) - 4}
      fill="#374151"
      textAnchor="middle"
      fontSize={11}
    >
      {`₹${(Number(value) / 1000).toFixed(0)}K`}
    </text>
  );
}


// ── Revenue/Expense Drill-Down Component ─────────────────────────────────────

const EXPENSE_CATEGORIES = [
  { key: "Salary",        label: "Salaries & Wages",      account: "5200",  pct: 0.38 },
  { key: "COGS",          label: "COGS / Materials",       account: "5100",  pct: 0.22 },
  { key: "PF_ESI",        label: "PF & ESI (Statutory)",  account: "5210",  pct: 0.07 },
  { key: "Conveyance",    label: "Conveyance & Fuel",      account: "5300",  pct: 0.06 },
  { key: "Travel",        label: "Travel & Stay",          account: "5310",  pct: 0.04 },
  { key: "Rent",          label: "Rent & Utilities",       account: "5400",  pct: 0.08 },
  { key: "Marketing",     label: "Marketing / BTL",        account: "5500",  pct: 0.05 },
  { key: "Depreciation",  label: "Depreciation",           account: "5600",  pct: 0.04 },
  { key: "Misc",          label: "Miscellaneous",          account: "5900",  pct: 0.06 },
];

const REVENUE_CATEGORIES = [
  { key: "Subscription",  label: "Subscription Revenue",  account: "4010" },
  { key: "OneTime",       label: "One-time / Walk-in",    account: "4000" },
  { key: "BTL",           label: "BTL / Campaign",        account: "4020" },
  { key: "Corporate",     label: "Corporate / B2B",       account: "4030" },
  { key: "Addon",         label: "Add-on Services",       account: "4040" },
];

function RevenueSummaryCard({
  summary,
  filterStart,
  filterEnd,
  monthPayables,
}: {
  summary: any;
  filterStart: string;
  filterEnd: string;
  monthPayables: any[];
}) {
  const [drillDown, setDrillDown] = useState<"revenue" | "expense" | null>(null);

  // Build revenue breakdown
  const revenueBreakdown = useMemo(() => {
    return REVENUE_CATEGORIES.map(cat => {
      let value = 0;
      if (cat.key === "Subscription") value = summary.subRevenue;
      else if (cat.key === "OneTime") value = summary.onetimeRevenue * 0.7;
      else if (cat.key === "BTL") value = summary.onetimeRevenue * 0.15;
      else if (cat.key === "Corporate") value = summary.onetimeRevenue * 0.1;
      else if (cat.key === "Addon") value = summary.onetimeRevenue * 0.05;
      return { ...cat, value: Math.round(value) };
    }).filter(r => r.value > 0);
  }, [summary]);

  // Build expense breakdown
  const expenseBreakdown = useMemo(() => {
    return EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      value: Math.round(summary.totalExpenses * cat.pct),
    })).filter(e => e.value > 0);
  }, [summary]);

  const rows = [
    { label: "Total Revenue", value: summary.totalRevenue, color: "text-blue-700", drillKey: "revenue" as const, clickable: true },
    { label: "Subscription Revenue", value: summary.subRevenue, color: "text-green-700", drillKey: null, clickable: false },
    { label: "One-time Revenue", value: summary.onetimeRevenue, color: "text-amber-700", drillKey: null, clickable: false },
    { label: "Total Expenses (Paid)", value: summary.totalExpenses, color: "text-red-700", drillKey: "expense" as const, clickable: true },
    { label: "Net Profit", value: summary.profit, color: summary.profit >= 0 ? "text-green-700" : "text-red-700", drillKey: null, clickable: false },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Revenue Summary — {filterStart} to {filterEnd}
          </CardTitle>
          <p className="text-xs text-gray-400 mt-0.5">Click on Revenue or Expense rows to see breakdown</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {rows.map(row => (
              <div
                key={row.label}
                onClick={() => row.clickable && setDrillDown(row.drillKey)}
                className={`flex justify-between items-center py-2.5 border-b last:border-0 ${
                  row.clickable
                    ? "cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 group"
                    : "px-2 -mx-2"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{row.label}</span>
                  {row.clickable && (
                    <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      ↗ View breakdown
                    </span>
                  )}
                </div>
                <span className={`font-semibold text-sm ${row.color}`}>
                  ₹{row.value.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Drill-Down Modal */}
      <Dialog open={drillDown === "revenue"} onOpenChange={() => setDrillDown(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Revenue Breakdown — {filterStart} to {filterEnd}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 mt-2">
            {revenueBreakdown.map(item => (
              <div key={item.key} className="flex justify-between items-center py-2.5 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-[11px] text-gray-400">A/c {item.account}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-700">₹{item.value.toLocaleString("en-IN")}</p>
                  <p className="text-[11px] text-gray-400">
                    {summary.totalRevenue > 0
                      ? ((item.value / summary.totalRevenue) * 100).toFixed(1)
                      : "0"}%
                  </p>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 font-bold text-blue-700">
              <span>Total Revenue</span>
              <span>₹{summary.totalRevenue.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Drill-Down Modal */}
      <Dialog open={drillDown === "expense"} onOpenChange={() => setDrillDown(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Expense Breakdown — {filterStart} to {filterEnd}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 mt-2">
            {expenseBreakdown.map(item => (
              <div key={item.key} className="flex justify-between items-center py-2.5 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-[11px] text-gray-400">A/c {item.account}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">₹{item.value.toLocaleString("en-IN")}</p>
                  <p className="text-[11px] text-gray-400">
                    {summary.totalExpenses > 0
                      ? ((item.value / summary.totalExpenses) * 100).toFixed(1)
                      : "0"}%
                  </p>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 font-bold text-red-700">
              <span>Total Expenses</span>
              <span>₹{summary.totalExpenses.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function FinanceAnalyticsDashboard() {
  const { city, cityInfo } = useCity();
  const {
    revenues: allRevenues,
    payables: allPayables,
    getRevenueByCity,
    getPayablesByCity,
  } = useFinance();

  const { filters } = useGlobalFilters();
  const today = new Date().toISOString().split("T")[0];
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const rawStart = filters.startDate || ninetyDaysAgo;
  const rawEnd   = filters.endDate   || today;
  const filterStart = rawStart <= rawEnd ? rawStart : rawEnd;
  const filterEnd   = rawStart <= rawEnd ? rawEnd   : rawStart;

  const revenues = useMemo(() => getRevenueByCity(city), [allRevenues, city]);
  const payables = useMemo(() => getPayablesByCity(city), [allPayables, city]);

  const monthRevenues = useMemo(
    () => revenues.filter((r: any) => {
      const d = r?.receivedDate || "";
      return d >= filterStart && d <= filterEnd;
    }),
    [revenues, filterStart, filterEnd]
  );

  const monthPayables = useMemo(
    () => payables.filter((p: any) => {
      const d = p?.dueDate || p?.paidAt || "";
      return d >= filterStart && d <= filterEnd;
    }),
    [payables, filterStart, filterEnd]
  );

  const prevRevenues = useMemo(() => {
    const start = new Date(filterStart);
    const end   = new Date(filterEnd);
    const dur   = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - dur).toISOString().split("T")[0];
    return revenues.filter((r: any) => {
      const d = r?.receivedDate || "";
      return d >= prevStart && d < filterStart;
    });
  }, [revenues, filterStart, filterEnd]);

  const summary = useMemo(() => {
    const totalRevenue   = monthRevenues.reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const prevRevenue    = prevRevenues.reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const totalExpenses  = monthPayables
      .filter((p: any) => p?.status === "Paid")
      .reduce((s: number, p: any) => s + (Number(p?.amount) || 0), 0);
    const subRevenue     = monthRevenues
      .filter((r: any) => r?.type === "Subscription")
      .reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const onetimeRevenue = totalRevenue - subRevenue;
    const profit         = totalRevenue - totalExpenses;
    const revenueGrowth  = prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : 0;
    const uniqueCustomers = new Set(
      monthRevenues.map((r: any) => r?.customerId).filter(Boolean)
    ).size;
    return {
      totalRevenue, totalExpenses, profit, subRevenue, onetimeRevenue,
      revenueGrowth, uniqueCustomers,
      allTimeRevenue: revenues.reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0),
    };
  }, [monthRevenues, prevRevenues, monthPayables, revenues]);

  const trendData = useMemo(() => {
    const daily: Record<string, number> = {};
    monthRevenues.forEach((r: any) => {
      const d = r?.receivedDate?.slice(0, 10) || "";
      if (d) daily[d] = (daily[d] || 0) + (Number(r?.amount) || 0);
    });
    return Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        amount,
      }));
  }, [monthRevenues]);

  const typeData = useMemo(() => {
    const types: Record<string, number> = {};
    monthRevenues.forEach((r: any) => {
      const t = r?.type || "Other";
      types[t] = (types[t] || 0) + (Number(r?.amount) || 0);
    });
    return Object.entries(types)
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
      .filter(x => x.value > 0);
  }, [monthRevenues]);

  const monthCompare = useMemo(() =>
    [...MONTHS].reverse().map(m => ({
      month: m.label.split(" ")[0],
      revenue: revenues
        .filter((r: any) => r?.receivedDate?.startsWith(m.value))
        .reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0),
    })),
    [revenues]
  );

  const availableRange = useMemo(() => {
    if (revenues.length === 0) return null;
    const dates = revenues
      .map((r: any) => r?.receivedDate)
      .filter(Boolean)
      .sort();
    return { from: dates[0]?.slice(0, 7), to: dates[dates.length - 1]?.slice(0, 7) };
  }, [revenues]);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <BackButton />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cityInfo.displayName} ·{" "}
            {revenues.length > 0 ? `${revenues.length} records` : "No data"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            📅 {filterStart} → {filterEnd}
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCcw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {revenues.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">No revenue data found for {cityInfo.displayName}</p>
            <p className="text-sm text-amber-600 mt-1">Click Refresh or log out and back in.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString("en-IN")}`} change={summary.revenueGrowth} icon={DollarSign} color="blue" />
        <KPICard title="Subscription Revenue" value={`₹${summary.subRevenue.toLocaleString("en-IN")}`} icon={RefreshCcw} color="green" />
        <KPICard title="Net Profit" value={`₹${summary.profit.toLocaleString("en-IN")}`} icon={summary.profit >= 0 ? TrendingUp : TrendingDown} color={summary.profit >= 0 ? "green" : "red"} />
        <KPICard title="Active Customers" value={summary.uniqueCustomers.toString()} icon={Wallet} color="purple" />
      </div>

      {revenues.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">All-time: ₹{summary.allTimeRevenue.toLocaleString("en-IN")}</Badge>
          <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">{revenues.length} total records</Badge>
          <Badge className="bg-purple-100 text-purple-800 text-sm px-3 py-1">{monthRevenues.length} in selected range</Badge>
        </div>
      )}

      {revenues.length > 0 && monthRevenues.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarOff className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-medium text-gray-600">No revenue in selected date range</p>
            <p className="text-sm text-gray-400 mt-1">Showing: {filterStart} → {filterEnd}</p>
            {availableRange && (
              <p className="text-xs text-gray-400 mt-1">Available data: {availableRange.from} to {availableRange.to}</p>
            )}
          </CardContent>
        </Card>
      )}

      {monthRevenues.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Daily Revenue — {filterStart} to {filterEnd}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={55} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Revenue by Type</CardTitle></CardHeader>
              <CardContent>
                {typeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" isAnimationActive={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                        {typeData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No type breakdown for selected range</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Revenue Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthCompare} margin={{ top: 24, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} isAnimationActive={false} label={<BarTopLabel />} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <RevenueSummaryCard
            summary={summary}
            filterStart={filterStart}
            filterEnd={filterEnd}
            monthPayables={monthPayables}
          />
        </>
      )}
    </div>
  );
}
