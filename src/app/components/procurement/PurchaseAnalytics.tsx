import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, IndianRupee, Package, ShoppingCart, AlertTriangle } from "lucide-react";

// Historic procurement data — 6 months
const MONTHLY_SPEND = [
  { month:"Jan 2026", spend:320000, budget:400000, orders:8,  id:"jan" },
  { month:"Feb 2026", spend:280000, budget:400000, orders:6,  id:"feb" },
  { month:"Mar 2026", spend:385000, budget:400000, orders:11, id:"mar" },
  { month:"Apr 2026", spend:410000, budget:420000, orders:9,  id:"apr" },
  { month:"May 2026", spend:295000, budget:420000, orders:7,  id:"may" },
  { month:"Jun 2026", spend:225000, budget:420000, orders:5,  id:"jun" },
];

const CATEGORY_SPEND = [
  { name:"Cleaning Supplies", value:42, color:"#3b82f6" },
  { name:"Equipment",         value:28, color:"#10b981" },
  { name:"Consumables",       value:18, color:"#f59e0b" },
  { name:"Safety & PPE",      value:12, color:"#8b5cf6" },
];

const SUPPLIER_PERFORMANCE = [
  { supplier:"HUL",        orders:28, value:1250000, onTime:96, quality:98, id:"s1" },
  { supplier:"3M India",   orders:15, value:650000,  onTime:93, quality:95, id:"s2" },
  { supplier:"Pidilite",   orders:22, value:880000,  onTime:90, quality:92, id:"s3" },
  { supplier:"Bosch India",orders:8,  value:420000,  onTime:100,quality:99, id:"s4" },
  { supplier:"Local Vendor",orders:42, value:315000, onTime:78, quality:85, id:"s5" },
];

const LEAD_TIME = [
  { month:"Jan", hul:3, mm:5, pidilite:4, bosch:7, id:"jan" },
  { month:"Feb", hul:4, mm:5, pidilite:3, bosch:8, id:"feb" },
  { month:"Mar", hul:3, mm:4, pidilite:4, bosch:6, id:"mar" },
  { month:"Apr", hul:3, mm:6, pidilite:5, bosch:7, id:"apr" },
  { month:"May", hul:4, mm:5, pidilite:3, bosch:6, id:"may" },
  { month:"Jun", hul:2, mm:4, pidilite:3, bosch:5, id:"jun" },
];

export function PurchaseAnalytics() {
  const totalSpend6M = MONTHLY_SPEND.reduce((s, m) => s + m.spend, 0);
  const totalBudget6M = MONTHLY_SPEND.reduce((s, m) => s + m.budget, 0);
  const totalOrders6M = MONTHLY_SPEND.reduce((s, m) => s + m.orders, 0);
  const avgOrderValue = Math.round(totalSpend6M / totalOrders6M);
  const budgetUtil = Math.round((totalSpend6M / totalBudget6M) * 100);
  const lastMonth = MONTHLY_SPEND[MONTHLY_SPEND.length - 1];
  const prevMonth = MONTHLY_SPEND[MONTHLY_SPEND.length - 2];
  const spendTrend = lastMonth.spend < prevMonth.spend ? "down" : "up";

  // Load live PO data
  const livePOs = (() => {
    try { return JSON.parse(localStorage.getItem("cleancar_purchase_orders") || "[]"); }
    catch { return []; }
  })();
  const pendingApproval = livePOs.filter((p: any) => p.status === "Pending Approval").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Purchase Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">6-month procurement performance overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:"Total Spend (6mo)", value:`₹${(totalSpend6M/100000).toFixed(1)}L`, sub:`vs ₹${(totalBudget6M/100000).toFixed(1)}L budget`,  color:"text-gray-900", icon:<IndianRupee className="w-4 h-4 text-blue-500"/> },
          { label:"Total Orders (6mo)", value:totalOrders6M,                            sub:`Avg ₹${(avgOrderValue/1000).toFixed(0)}K per order`, color:"text-blue-700", icon:<ShoppingCart className="w-4 h-4 text-blue-500"/> },
          { label:"Budget Utilisation",  value:`${budgetUtil}%`,                        sub:budgetUtil >= 90 ? "⚠ Near limit" : "Within budget",  color:budgetUtil >= 90 ? "text-orange-600" : "text-green-700", icon:<TrendingUp className="w-4 h-4 text-green-500"/> },
          { label:"Pending Approvals",   value:pendingApproval,                         sub:"POs awaiting approval",                               color:pendingApproval > 0 ? "text-orange-600" : "text-gray-900", icon:<AlertTriangle className="w-4 h-4 text-orange-400"/> },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">{k.label}</p>{k.icon}
              </div>
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly spend vs budget */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Monthly Spend vs Budget</CardTitle>
            <div className="flex items-center gap-1 text-sm">
              {spendTrend === "down"
                ? <><TrendingDown className="w-4 h-4 text-green-600"/><span className="text-green-600">Spend down this month</span></>
                : <><TrendingUp className="w-4 h-4 text-orange-500"/><span className="text-orange-500">Spend up this month</span></>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={MONTHLY_SPEND}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="month" tick={{fontSize:10}}/>
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} tick={{fontSize:10}}/>
              <Tooltip formatter={(v: any) => `₹${(v/1000).toFixed(0)}K`}/>
              <Legend/>
              <Bar dataKey="budget" fill="#e5e7eb" name="Budget" radius={[2,2,0,0]}/>
              <Bar dataKey="spend"  fill="#3b82f6" name="Actual Spend" radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Spend by Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={CATEGORY_SPEND} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({name, value}) => `${name} ${value}%`} labelLine={false}>
                  {CATEGORY_SPEND.map(e => <Cell key={e.name} fill={e.color}/>)}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-1">
              {CATEGORY_SPEND.map(c => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{background:c.color}}/>
                  {c.name} ({c.value}%)
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order count trend */}
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Order Count</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={MONTHLY_SPEND}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="month" tick={{fontSize:10}}/>
                <YAxis tick={{fontSize:10}}/>
                <Tooltip/>
                <Line type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} dot={{r:4}} name="Orders"/>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Supplier performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Supplier Performance Scorecard</CardTitle>
            <Badge variant="secondary">{SUPPLIER_PERFORMANCE.length} active suppliers</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Supplier","Total Orders","Total Value","On-Time Delivery","Quality Score","Rating"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {SUPPLIER_PERFORMANCE.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">{s.supplier}</td>
                    <td className="px-4 py-2.5 text-gray-600">{s.orders}</td>
                    <td className="px-4 py-2.5 font-medium">₹{(s.value/100000).toFixed(1)}L</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
                          <div className={`h-1.5 rounded-full ${s.onTime >= 95 ? "bg-green-500" : s.onTime >= 85 ? "bg-yellow-400" : "bg-red-400"}`} style={{width:`${s.onTime}%`}}/>
                        </div>
                        <span className={`text-xs font-medium ${s.onTime >= 95 ? "text-green-700" : s.onTime >= 85 ? "text-yellow-700" : "text-red-600"}`}>{s.onTime}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
                          <div className={`h-1.5 rounded-full ${s.quality >= 95 ? "bg-green-500" : s.quality >= 88 ? "bg-yellow-400" : "bg-red-400"}`} style={{width:`${s.quality}%`}}/>
                        </div>
                        <span className={`text-xs font-medium ${s.quality >= 95 ? "text-green-700" : s.quality >= 88 ? "text-yellow-700" : "text-red-600"}`}>{s.quality}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-sm font-bold ${s.onTime >= 95 && s.quality >= 95 ? "text-green-700" : s.onTime >= 85 && s.quality >= 88 ? "text-yellow-700" : "text-red-600"}`}>
                        {((s.onTime + s.quality) / 20).toFixed(1)} ⭐
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lead time trend */}
      <Card>
        <CardHeader><CardTitle className="text-base">Supplier Lead Time Trend (Days)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={LEAD_TIME}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="month" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}} label={{value:"Days", angle:-90, position:"insideLeft", style:{fontSize:10}}}/>
              <Tooltip/>
              <Legend/>
              <Line type="monotone" dataKey="hul"      stroke="#3b82f6" strokeWidth={2} dot={{r:3}} name="HUL"/>
              <Line type="monotone" dataKey="mm"       stroke="#10b981" strokeWidth={2} dot={{r:3}} name="3M India"/>
              <Line type="monotone" dataKey="pidilite" stroke="#f59e0b" strokeWidth={2} dot={{r:3}} name="Pidilite"/>
              <Line type="monotone" dataKey="bosch"    stroke="#8b5cf6" strokeWidth={2} dot={{r:3}} name="Bosch"/>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
