import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import {
  DollarSign, TrendingUp, TrendingDown, RefreshCcw, Percent,
  AlertTriangle, UserPlus, ArrowUpRight, ArrowDownRight, Download,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { useRole }     from "../../contexts/RoleContext";
import { useFinance }  from "../../contexts/FinanceContext";
import { useCity }     from "../../contexts/CityContext";
import { useJobs }     from "../../contexts/JobContext";
import { useCustomers } from "../../contexts/CustomerContext";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { BackButton } from "../ui/back-button";
import { toast } from "sonner";
import { useRevenueMetrics } from "../../hooks/useRevenueMetrics";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"];

// ── Pincode → Area map ────────────────────────────────────────────────────────
const PIN_AREA: Record<string,string> = {
  "395001":"Adajan","395002":"Varachha","395003":"Katargam",
  "395005":"Althan","395006":"Dumas","395007":"Vesu",
  "395008":"Piplod","395009":"Athwa",
  "400001":"Bandra","400002":"Andheri","400003":"Dadar",
  "400004":"Thane","400005":"Borivali","400006":"Malad",
  "400007":"Powai","400008":"Kurla",
  "380001":"Navrangpura","380002":"Satellite","380003":"Vastrapur",
  "380004":"Bopal","380005":"Prahlad Nagar","380006":"Thaltej",
  "380007":"SG Highway","380008":"Maninagar",
};

const CITY_PINS: Record<string, string[]> = {
  "CITY-SURAT":     ["395001","395002","395003","395005","395006","395007","395008","395009"],
  "CITY-MUMBAI":    ["400001","400002","400003","400004","400005","400006","400007","400008"],
  "CITY-AHMEDABAD": ["380001","380002","380003","380004","380005","380006","380007","380008"],
};

const MONTHS = [
  { value:"2026-04", label:"April 2026" },
  { value:"2026-03", label:"March 2026" },
  { value:"2026-02", label:"February 2026" },
  { value:"2026-01", label:"January 2026" },
];

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ title, value, change, trend, icon: Icon }: any) {
  const isPositive = change >= 0;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{value}</h3>
            <div className="flex items-center gap-1">
              {isPositive
                ? <ArrowUpRight className="w-4 h-4 text-green-600" />
                : <ArrowDownRight className="w-4 h-4 text-red-600" />}
              <span className={`text-sm font-medium ${isPositive?"text-green-600":"text-red-600"}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500">vs {trend}</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function RevenueCaptureSystem() {
  const { currentRole } = useRole();
  const { getRevenueByCity } = useFinance();
  const { city, cityInfo, availableCities } = useCity();
  const { allJobs } = useJobs();
  const { cityCustomers } = useCustomers();
  const allEmps = employeeDatabaseService.getAll();

  // ── Filters ────────────────────────────────────────────────────────────────
  const [selectedMonth,    setSelectedMonth]    = useState("2026-04");
  const [prevMonth,        setPrevMonth]        = useState("2026-03");
  const [filterCityId,     setFilterCityId]     = useState(city);
  const [filterPincode,    setFilterPincode]    = useState("All");
  const [filterWasherId,   setFilterWasherId]   = useState("All");
  const [filterType,       setFilterType]       = useState("All");
  const [chartToggle,      setChartToggle]      = useState("Total");

  // ── Derived data ───────────────────────────────────────────────────────────
  const allRevenues = getRevenueByCity(filterCityId);

  // Current month revenues filtered
  const revenues = useMemo(() =>
    allRevenues.filter(r => {
      if (!r.receivedDate?.startsWith(selectedMonth)) return false;
      if (filterPincode !== "All") {
        // Match via job pincode
        const job = (allJobs || []).find(j => j.jobId === r.jobId);
        if (job?.pinCode !== filterPincode) return false;
      }
      if (filterType !== "All" && r.type !== filterType) return false;
      return true;
    }),
    [allRevenues, selectedMonth, filterPincode, filterType, allJobs]
  );

  // Previous month revenues for comparison
  const prevRevenues = useMemo(() =>
    allRevenues.filter(r => r.receivedDate?.startsWith(prevMonth)),
    [allRevenues, prevMonth]
  );

  // Washers for this city
  const cityWashers = useMemo(() =>
    allEmps.filter(e =>
      e.designation === "Car Washer Full Time" &&
      e.status === "Active" &&
      (e.workLocation === filterCityId || e.cityId === filterCityId)
    ),
    [allEmps, filterCityId]
  );

  // Supervisors for this city
  const citySupervisors = useMemo(() =>
    allEmps.filter(e =>
      e.designation === "Supervisor" &&
      e.status === "Active" &&
      (e.workLocation === filterCityId || e.cityId === filterCityId)
    ),
    [allEmps, filterCityId]
  );

  // ── KPI Metrics ────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalRevenue      = (revenues || []).reduce((s,r) => s + r.amount, 0);
    const prevTotalRevenue  = (prevRevenues || []).reduce((s,r) => s + r.amount, 0);
    const subRevenue        = (revenues || []).filter(r => r.type === "Subscription").reduce((s,r) => s+r.amount, 0);
    const prevSubRevenue    = prevRevenues.filter(r => r.type === "Subscription").reduce((s,r) => s+r.amount, 0);
    const onetimeRevenue    = (revenues || []).filter(r => r.type === "One-Time").reduce((s,r) => s+r.amount, 0);

    const uniqueCusts       = new Set((revenues || []).map(r => r.customerId));
    const prevUniqueCusts   = new Set(prevRevenues.map(r => r.customerId));
    const retainedCusts     = [...uniqueCusts].filter(id => prevUniqueCusts.has(id));
    const newCusts          = [...uniqueCusts].filter(id => !prevUniqueCusts.has(id)).length;
    const retentionRate     = prevUniqueCusts.size > 0
      ? (retainedCusts.length / prevUniqueCusts.size) * 100 : 0;

    const avgTicket         = revenues.length > 0 ? totalRevenue / revenues.length : 0;
    const prevAvgTicket     = prevRevenues.length > 0 ? prevTotalRevenue / prevRevenues.length : 0;

    const pct = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0;

    return {
      totalRevenue, prevTotalRevenue,
      subRevenue, prevSubRevenue, onetimeRevenue,
      uniqueCusts: uniqueCusts.size, newCusts,
      retainedCusts: retainedCusts.length,
      retentionRate,
      avgTicket, prevAvgTicket,
      revGrowth:  pct(totalRevenue, prevTotalRevenue),
      subGrowth:  pct(subRevenue, prevSubRevenue),
      custGrowth: pct(uniqueCusts.size, prevUniqueCusts.size),
      ticketGrowth: pct(avgTicket, prevAvgTicket),
    };
  }, [revenues, prevRevenues]);

  // ── Revenue Trend by day ───────────────────────────────────────────────────
  const revenueTrendData = useMemo(() => {
    const daily: Record<string,{total:number;subscription:number;onetime:number}> = {};
    revenues.forEach(r => {
      const d = r.receivedDate?.slice(0,10) || "";
      if (!d) return;
      if (!daily[d]) daily[d] = { total:0, subscription:0, onetime:0 };
      daily[d].total       += r.amount;
      if (r.type === "Subscription") daily[d].subscription += r.amount;
      else                           daily[d].onetime       += r.amount;
    });
    return Object.entries(daily)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([date, d], i) => ({
        id: `t${i}`,
        date: new Date(date).toLocaleDateString("en-IN",{day:"numeric",month:"short"}),
        ...d,
      }));
  }, [revenues]);

  // ── Revenue Split by type ─────────────────────────────────────────────────
  const revenueSplitData = useMemo(() => {
    const typeMap: Record<string,number> = {};
    revenues.forEach(r => { typeMap[r.type] = (typeMap[r.type]||0) + r.amount; });
    return Object.entries(typeMap).map(([name,value],i) => ({
      id:`sp${i}`, name, value, color: COLORS[i % COLORS.length],
    })).filter(x => x.value > 0);
  }, [revenues]);

  // ── Monthly comparison ─────────────────────────────────────────────────────
  const monthCompareData = useMemo(() => {
    const curr = (revenues || []).reduce((s,r) => s+r.amount, 0);
    const prev = (prevRevenues || []).reduce((s,r) => s+r.amount, 0);
    return [
      { id:"mc1", month: MONTHS.find(m=>m.value===prevMonth)?.label||prevMonth, revenue: prev },
      { id:"mc2", month: MONTHS.find(m=>m.value===selectedMonth)?.label||selectedMonth, revenue: curr },
    ];
  }, [revenues, prevRevenues, selectedMonth, prevMonth]);

  // ── Location performance by pincode ───────────────────────────────────────
  const locationData = useMemo(() => {
    const byPin: Record<string,{revenue:number;count:number}> = {};
    revenues.forEach(r => {
      const job = (allJobs || []).find(j => j.jobId === r.jobId);
      const pin = job?.pinCode || "Unknown";
      if (!byPin[pin]) byPin[pin] = { revenue:0, count:0 };
      byPin[pin].revenue += r.amount;
      byPin[pin].count   += 1;
    });
    return Object.entries(byPin)
      .map(([pin,d]) => ({
        location: pin === "Unknown" ? pin : `${pin} — ${PIN_AREA[pin]||pin}`,
        pinCode: pin,
        revenue: d.revenue,
        orders: d.count,
        avgTicket: d.count > 0 ? Math.round(d.revenue/d.count) : 0,
      }))
      .sort((a,b) => b.revenue - a.revenue)
      .slice(0,8);
  }, [revenues, allJobs]);

  // ── Washer performance ─────────────────────────────────────────────────────
  const washerData = useMemo(() => {
    const byWasher: Record<string,{name:string;revenue:number;jobs:number}> = {};
    allJobs
      .filter(j =>
        j.cityId === filterCityId &&
        j.status === "Completed" &&
        j.scheduledDate?.startsWith(selectedMonth) &&
        (filterWasherId === "All" || j.washerId === filterWasherId)
      )
      .forEach(j => {
        const wid = j.washerId || "Unknown";
        if (!byWasher[wid]) {
          const emp = allEmps.find(e => e.id === wid);
          byWasher[wid] = { name: emp?.fullName || j.washerName || wid, revenue:0, jobs:0 };
        }
        byWasher[wid].revenue += j.amount || 0;
        byWasher[wid].jobs    += 1;
      });
    return Object.entries(byWasher)
      .map(([wid,d]) => ({
        washerId: wid,
        name: d.name,
        jobs: d.jobs,
        revenue: d.revenue,
        avgTicket: d.jobs > 0 ? Math.round(d.revenue/d.jobs) : 0,
      }))
      .sort((a,b) => b.jobs - a.jobs)
      .slice(0,8);
  }, [allJobs, filterCityId, selectedMonth, filterWasherId, allEmps]);

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (revenues.length === 0) { toast.error("No data to export"); return; }
    const rows = [
      ["Revenue ID","Date","Customer ID","Type","Taxable Value","CGST (9%)","SGST (9%)","IGST","Total Value","Payment Method","Status","City"],
      ...(revenues || []).map(r => {
        const taxable = r.amount;
        // Inter-state if cityId is Mumbai (Maharashtra=27) vs company state Gujarat=24
        const isInter = r.supplyType === "INTER_STATE" ||
          (r.cityId === "CITY-MUMBAI") ||
          (r.vendorStateCode && r.vendorStateCode !== "24");
        const cgst   = isInter ? 0 : parseFloat((taxable * 0.09).toFixed(2));
        const sgst   = isInter ? 0 : parseFloat((taxable * 0.09).toFixed(2));
        const igst   = isInter ? parseFloat((taxable * 0.18).toFixed(2)) : 0;
        const total  = parseFloat((taxable + cgst + sgst + igst).toFixed(2));
        return [
          r.revenueId, r.receivedDate, r.customerId,
          r.type, taxable, cgst, sgst, igst, total,
          r.paymentMethod, r.status, cityInfo.displayName,
        ];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `revenue_${filterCityId}_${selectedMonth}.csv`;
    a.click();
    toast.success(`Exported ${revenues.length} revenue records with tax breakup`);
  };

  const hasAccess = ["Super Admin","Admin","Accounts","City Manager"].includes(currentRole);
  if (!hasAccess) {
    return (
      <div className="p-6">
        <BackButton to="/finance" />
        <Card><CardContent className="p-8 text-center">
          <div className="text-red-500 text-lg font-semibold">Access Denied</div>
          <p className="text-gray-500 mt-2">You don't have permission to access the Revenue Dashboard.</p>
        </CardContent></Card>
      </div>
    );
  }

  const cityPins = CITY_PINS[filterCityId] || [];

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/finance" />

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Live data from Supabase · {revenues.length} records · {cityInfo.displayName}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* FILTER BAR */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            {/* City */}
            <Select value={filterCityId} onValueChange={v => { setFilterCityId(v); setFilterPincode("All"); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent>
                {availableCities.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Month */}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Month" /></SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Compare with */}
            <Select value={prevMonth} onValueChange={setPrevMonth}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Compare with" /></SelectTrigger>
              <SelectContent>
                {MONTHS.filter(m => m.value !== selectedMonth).map(m => (
                  <SelectItem key={m.value} value={m.value}>vs {m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Pincode — city-aware */}
            <Select value={filterPincode} onValueChange={setFilterPincode}>
              <SelectTrigger className="w-44"><SelectValue placeholder="PIN Code" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All PIN Codes</SelectItem>
                {cityPins.map(pin => (
                  <SelectItem key={pin} value={pin}>{pin} — {PIN_AREA[pin]||pin}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Washer */}
            <Select value={filterWasherId} onValueChange={setFilterWasherId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Washer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Washers</SelectItem>
                {cityWashers.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Revenue Type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Subscription">Subscription</SelectItem>
                <SelectItem value="One-Time">One-Time</SelectItem>
                <SelectItem value="Add-on">Add-on</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard title="Total Revenue"       value={`₹${metrics.totalRevenue.toLocaleString("en-IN")}`}   change={metrics.revGrowth}  trend={MONTHS.find(m=>m.value===prevMonth)?.label||prevMonth} icon={DollarSign} />
        <KPICard title="Subscription Revenue" value={`₹${metrics.subRevenue.toLocaleString("en-IN")}`}    change={metrics.subGrowth}  trend="prev month" icon={RefreshCcw} />
        <KPICard title="Avg Ticket Size"     value={`₹${Math.round(metrics.avgTicket).toLocaleString("en-IN")}`} change={metrics.ticketGrowth} trend="prev month" icon={Percent} />
        <KPICard title="Active Customers"    value={metrics.uniqueCusts.toString()}                        change={metrics.custGrowth} trend="prev month" icon={UserPlus} />
        <KPICard title="New Customers"       value={metrics.newCusts.toString()}                           change={0}  trend="prev month" icon={TrendingUp} />
        <KPICard title="Retained Customers"  value={metrics.retainedCusts.toString()}                      change={metrics.retentionRate > 80 ? 5 : -3} trend="prev month" icon={TrendingUp} />
        <KPICard title="Retention Rate"      value={`${(metrics?.retentionRate ?? 0).toFixed(1)}%`}                change={metrics.retentionRate > 80 ? 2.1 : -1.5} trend="prev month" icon={Percent} />
        <KPICard title="One-Time Revenue"    value={`₹${metrics.onetimeRevenue.toLocaleString("en-IN")}`} change={0}  trend="prev month" icon={DollarSign} />
      </div>

      {/* REVENUE TREND CHART */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Revenue Trend — {MONTHS.find(m=>m.value===selectedMonth)?.label}</CardTitle>
            <div className="flex gap-2">
              {["Total","Subscription","One-time"].map(t => (
                <Button key={t} size="sm"
                  variant={chartToggle === t ? "default" : "outline"}
                  onClick={() => setChartToggle(t)}>
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {revenueTrendData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No revenue data for {MONTHS.find(m=>m.value===selectedMonth)?.label}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} width={60}
                  tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <RechartsTooltip formatter={(v:any) => `₹${Number(v).toLocaleString("en-IN")}`} />
                <Legend />
                {chartToggle==="Total"        && <Line type="monotone" dataKey="total"        stroke="#3b82f6" strokeWidth={2} name="Total Revenue" dot={false} />}
                {chartToggle==="Subscription" && <Line type="monotone" dataKey="subscription" stroke="#10b981" strokeWidth={2} name="Subscription"  dot={false} />}
                {chartToggle==="One-time"     && <Line type="monotone" dataKey="onetime"      stroke="#f59e0b" strokeWidth={2} name="One-time"       dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* SECONDARY CHARTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Revenue Split */}
        <Card>
          <CardHeader><CardTitle>Revenue by Type</CardTitle></CardHeader>
          <CardContent>
            {revenueSplitData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-gray-400">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={revenueSplitData} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                    label={({name,percent}) => `${name}: ${(percent*100).toFixed(1)}%`}>
                    {revenueSplitData.map(e => <Cell key={e.id} fill={e.color} />)}
                  </Pie>
                  <RechartsTooltip formatter={(v:any) => `₹${Number(v).toLocaleString("en-IN")}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Month Comparison */}
        <Card>
          <CardHeader><CardTitle>Month Comparison</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthCompareData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} width={60}
                  tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <RechartsTooltip formatter={(v:any) => `₹${Number(v).toLocaleString("en-IN")}`} />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue"
                   />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* LOCATION PERFORMANCE */}
      <Card>
        <CardHeader>
          <CardTitle>Location Performance by PIN Code</CardTitle>
        </CardHeader>
        <CardContent>
          {locationData.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">
              No location data — revenue records need job references to map to pincodes
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area / PIN</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Avg Ticket</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationData.map((row,i) => (
                  <TableRow key={i} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{row.location}</TableCell>
                    <TableCell className="text-right">₹{row.revenue.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">{row.orders}</TableCell>
                    <TableCell className="text-right">₹{row.avgTicket.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CUSTOMER INSIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader><CardTitle>Customer Retention</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Retention Rate</p>
              <h3 className="text-3xl font-bold text-gray-900">{(metrics?.retentionRate ?? 0).toFixed(1)}%</h3>
              <p className="text-xs text-gray-400 mt-1">
                {metrics.retainedCusts} of {metrics.uniqueCusts} customers were also active in {MONTHS.find(m=>m.value===prevMonth)?.label}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">New Customers This Month</p>
              <h3 className="text-2xl font-bold text-blue-600">{metrics.newCusts}</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>{metrics.revGrowth >= 0 ? "+" : ""}{metrics.revGrowth}% revenue vs {MONTHS.find(m=>m.value===prevMonth)?.label}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue Mix</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label:"Subscription", amount: metrics.subRevenue,     color:"text-green-600" },
              { label:"One-Time",      amount: metrics.onetimeRevenue, color:"text-blue-600" },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{item.label}</span>
                <div className="text-right">
                  <span className={`font-bold ${item.color}`}>₹{item.amount.toLocaleString("en-IN")}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {metrics.totalRevenue > 0
                      ? `${((item.amount/metrics.totalRevenue)*100).toFixed(1)}%`
                      : "0%"}
                  </span>
                </div>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>₹{metrics.totalRevenue.toLocaleString("en-IN")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WASHER PERFORMANCE */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Washer Performance — {MONTHS.find(m=>m.value===selectedMonth)?.label}</CardTitle>
            <Select value={filterWasherId} onValueChange={setFilterWasherId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Washers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Washers</SelectItem>
                {cityWashers.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {washerData.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">
              No completed jobs for this month and city
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Washer</TableHead>
                  <TableHead className="text-right">Jobs Done</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Avg per Job</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {washerData.map((row,i) => (
                  <TableRow key={i} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-blue-100 text-blue-700">{row.jobs}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700">
                      ₹{row.revenue.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      ₹{row.avgTicket.toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
