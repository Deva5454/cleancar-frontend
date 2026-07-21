import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  AlertCircle, AlertTriangle, BarChart3, FileText, Package,
  ShoppingCart, TrendingUp, TrendingDown, Users, Search,
  Edit2, Check, X, CheckCircle, Clock,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { BackButton } from "../ui/back-button";
import { DataService } from "../../services/DataService";
import { toast } from "sonner";

// ── Data helpers ──────────────────────────────────────────────────────────────
function getLiveInventory() {
  try {
    const items = DataService.get<any>("INVENTORY_ITEMS");
    if (items.length > 0) return items;
  } catch {}
  return [
    { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",         category:"Cleaning Supplies", unit:"L",   centralStock:45,  reorderLevel:20, unitCost:480  },
    { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", category:"Equipment",         unit:"Pcs", centralStock:120, reorderLevel:50, unitCost:85   },
    { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",       category:"Cleaning Supplies", unit:"L",   centralStock:30,  reorderLevel:15, unitCost:220  },
    { itemId:"INV-SUR-004", itemName:"Dashboard Polish",       category:"Cleaning Supplies", unit:"L",   centralStock:8,   reorderLevel:20, unitCost:150  },
    { itemId:"INV-SUR-005", itemName:"Pressure Washer Nozzle", category:"Equipment",         unit:"Pcs", centralStock:6,   reorderLevel:4,  unitCost:350  },
    { itemId:"INV-SUR-006", itemName:"Washer Uniform Set",     category:"Consumables",       unit:"Pcs", centralStock:25,  reorderLevel:15, unitCost:650  },
    { itemId:"INV-SUR-007", itemName:"Wheel Cleaner 1L",       category:"Cleaning Supplies", unit:"L",   centralStock:18,  reorderLevel:12, unitCost:185  },
    { itemId:"INV-SUR-008", itemName:"Glass Cleaner 500ml",    category:"Cleaning Supplies", unit:"L",   centralStock:0,   reorderLevel:10, unitCost:120  },
  ];
}

// Historic MOQ seed — in sync with inventory items
const MOQ_SEED = [
  { id:"INV-SUR-001", name:"Car Shampoo 5L",         category:"Cleaning Supplies", unit:"L",   currentStock:45,  moq:50,  status:"below-moq" as const, lastUpdated:"2026-06-01", supplier:"Hindustan Unilever" },
  { id:"INV-SUR-002", name:"Microfiber Cloth Large", category:"Equipment",         unit:"Pcs", currentStock:120, moq:100, status:"normal"    as const, lastUpdated:"2026-06-01", supplier:"3M India" },
  { id:"INV-SUR-003", name:"Tyre Shine 500ml",       category:"Cleaning Supplies", unit:"L",   currentStock:30,  moq:40,  status:"below-moq" as const, lastUpdated:"2026-05-15", supplier:"Pidilite Industries" },
  { id:"INV-SUR-004", name:"Dashboard Polish",       category:"Cleaning Supplies", unit:"L",   currentStock:8,   moq:25,  status:"critical"  as const, lastUpdated:"2026-05-15", supplier:"Pidilite Industries" },
  { id:"INV-SUR-005", name:"Pressure Washer Nozzle", category:"Equipment",         unit:"Pcs", currentStock:6,   moq:10,  status:"below-moq" as const, lastUpdated:"2026-06-01", supplier:"Bosch India" },
  { id:"INV-SUR-006", name:"Washer Uniform Set",     category:"Consumables",       unit:"Pcs", currentStock:25,  moq:20,  status:"normal"    as const, lastUpdated:"2026-06-10", supplier:"Local Vendor" },
  { id:"INV-SUR-007", name:"Wheel Cleaner 1L",       category:"Cleaning Supplies", unit:"L",   currentStock:18,  moq:20,  status:"below-moq" as const, lastUpdated:"2026-05-20", supplier:"Pidilite Industries" },
  { id:"INV-SUR-008", name:"Glass Cleaner 500ml",    category:"Cleaning Supplies", unit:"L",   currentStock:0,   moq:15,  status:"critical"  as const, lastUpdated:"2026-04-30", supplier:"Hindustan Unilever" },
];

function loadMOQ() {
  try { const r = localStorage.getItem("cleancar_moq_settings"); return r ? JSON.parse(r) : MOQ_SEED; }
  catch { return MOQ_SEED; }
}

// 6-month historic consumption data aligned with issuance records
const CONSUMPTION_HISTORY = [
  { month:"Jan 2026", issued:112, received:150, stock:280, id:"jan" },
  { month:"Feb 2026", issued:128, received:120, stock:272, id:"feb" },
  { month:"Mar 2026", issued:145, received:200, stock:327, id:"mar" },
  { month:"Apr 2026", issued:138, received:100, stock:289, id:"apr" },
  { month:"May 2026", issued:162, received:270, stock:397, id:"may" },
  { month:"Jun 2026", issued:119, received:60,  stock:338, id:"jun" },
];

const WEEKLY_CONSUMPTION = [
  { week:"Week 1", consumption:38, id:"w1" },
  { week:"Week 2", consumption:44, id:"w2" },
  { week:"Week 3", consumption:29, id:"w3" },
  { week:"Week 4", consumption:48, id:"w4" },
];

const CATEGORY_BREAKDOWN = [
  { name:"Cleaning Supplies", value:58, color:"#3b82f6" },
  { name:"Equipment",         value:22, color:"#10b981" },
  { name:"Consumables",       value:20, color:"#f59e0b" },
];

const SUPERVISOR_CONSUMPTION = [
  { supervisor:"Harish Solanki", zone:"395001", issued:89, id:"sup1" },
  { supervisor:"Bhavesh Modi",   zone:"395007", issued:74, id:"sup2" },
];

export function StoreManagerModule() {
  // ── Live data ──────────────────────────────────────────────────────────────
  const [inventory, setInventory] = useState(getLiveInventory);
  const [moqProducts, setMoqProducts] = useState(loadMOQ);
  const [moqSearch, setMoqSearch] = useState("");
  const [invSearch, setInvSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);

  // Derived stats
  const totalItems      = inventory.reduce((s: number, i: any) => s + (i.centralStock ?? 0), 0);
  const belowReorder    = inventory.filter((i: any) => (i.centralStock ?? 0) <= (i.reorderLevel ?? 0));
  const outOfStock      = inventory.filter((i: any) => (i.centralStock ?? 0) === 0);
  const pendingPOs      = (() => { try { return JSON.parse(localStorage.getItem("cleancar_purchase_orders") || "[]").filter((p: any) => p.status === "Pending Procurement Review").length; } catch { return 5; } })();
  const thisWeekIssued  = WEEKLY_CONSUMPTION.reduce((s, w) => s + w.consumption, 0);

  // Build live consumption from issuance records
  const liveWeekly = (() => {
    try {
      const iss = JSON.parse(localStorage.getItem("cleancar_issuance_records") || "[]");
      const now = new Date();
      const weeks = [0,0,0,0];
      iss.forEach((r: any) => {
        const d = new Date(r.issuanceDate ?? r.createdAt);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          const w = Math.min(3, Math.floor((d.getDate() - 1) / 7));
          weeks[w] += r.totalQty ?? 0;
        }
      });
      const result = weeks.map((v, i) => ({ week:`Week ${i+1}`, consumption: v || WEEKLY_CONSUMPTION[i].consumption, id:`w${i+1}` }));
      return result.some(r => r.consumption > 0) ? result : WEEKLY_CONSUMPTION;
    } catch { return WEEKLY_CONSUMPTION; }
  })();

  // MOQ handlers
  const handleMOQSave = (id: string) => {
    const updated = moqProducts.map((p: any) => p.id === id ? {
      ...p, moq: editValue, lastUpdated: new Date().toISOString().split("T")[0],
      status: p.currentStock === 0 ? "critical" : p.currentStock <= editValue ? "below-moq" : "normal",
    } : p);
    setMoqProducts(updated);
    setEditingId(null);
    try { localStorage.setItem("cleancar_moq_settings", JSON.stringify(updated)); } catch {}
    toast.success("MOQ updated successfully");
  };

  const statusColor = (s: string) =>
    s === "critical"  ? "bg-red-100 text-red-800" :
    s === "below-moq" ? "bg-orange-100 text-orange-800" :
                        "bg-green-100 text-green-800";

  const stockStatus = (item: any) =>
    item.centralStock === 0            ? { label:"Out of Stock", cls:"bg-red-100 text-red-800 animate-pulse" } :
    item.centralStock <= item.reorderLevel * 0.5 ? { label:"Critical",     cls:"bg-red-100 text-red-700" } :
    item.centralStock <= item.reorderLevel       ? { label:"Low Stock",    cls:"bg-orange-100 text-orange-800" } :
                                                   { label:"In Stock",     cls:"bg-green-100 text-green-800" };

  const filteredInv = inventory.filter((i: any) =>
    i.itemName?.toLowerCase().includes(invSearch.toLowerCase()) ||
    i.category?.toLowerCase().includes(invSearch.toLowerCase())
  );
  const filteredMOQ = moqProducts.filter((p: any) =>
    p.name?.toLowerCase().includes(moqSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(moqSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Manager Module</h1>
          <p className="text-sm text-gray-500 mt-1">Inventory management and purchase operations</p>
        </div>
        <div className="flex gap-2">
          <Link to="/store-manager/purchase-order">
            <Button size="sm" variant="outline"><ShoppingCart className="w-4 h-4 mr-2"/>Create PO</Button>
          </Link>
          <Link to="/store-manager/grn-entry">
            <Button size="sm"><FileText className="w-4 h-4 mr-2"/>GRN Entry</Button>
          </Link>
        </div>
      </div>

      {/* Alert banner */}
      {belowReorder.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-300">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 shrink-0"/>
              <div>
                <p className="font-bold text-yellow-900">⚠ {outOfStock.length > 0 ? `${outOfStock.length} item${outOfStock.length>1?"s":""} out of stock — ` : ""}${belowReorder.length} item{belowReorder.length>1?"s":""} below reorder level</p>
                <p className="text-sm text-yellow-700 mt-1">{belowReorder.slice(0,4).map((i: any) => `${i.itemName} (${i.centralStock} ${i.unit})`).join(" · ")}{belowReorder.length > 4 ? ` +${belowReorder.length - 4} more` : ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Inventory Status", value: totalItems, sub:"Units in stock",        icon:<Package    className="w-4 h-4 text-gray-400"/>, color:"text-gray-900" },
          { label:"Below Min Qty",    value: belowReorder.length, sub:"Reorder needed", icon:<AlertTriangle className="w-4 h-4 text-orange-500"/>, color:"text-orange-600" },
          { label:"Pending PO",       value: pendingPOs,  sub:"Awaiting approval",    icon:<ShoppingCart className="w-4 h-4 text-blue-500"/>, color:"text-blue-700" },
          { label:"Issued This Week", value: liveWeekly.reduce((s,w)=>s+w.consumption,0), sub:"Units issued", icon:<TrendingUp className="w-4 h-4 text-purple-500"/>, color:"text-purple-700" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">{k.label}</p>{k.icon}
              </div>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Monitoring</TabsTrigger>
          <TabsTrigger value="moq">Min Order Quantity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Weekly Consumption Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={liveWeekly}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="week" tick={{fontSize:11}}/>
                    <YAxis tick={{fontSize:11}}/>
                    <Tooltip/>
                    <Area type="monotone" dataKey="consumption" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Units Issued"/>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Supervisor Consumption</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={SUPERVISOR_CONSUMPTION}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="supervisor" tick={{fontSize:10}}/>
                    <YAxis tick={{fontSize:11}}/>
                    <Tooltip/>
                    <Bar dataKey="issued" fill="#10b981" name="Units Issued"/>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { to:"/store-manager/inventory", icon:<Package className="w-4 h-4 mr-2"/>, label:"View Inventory" },
                  { to:"/store-manager/moq",       icon:<BarChart3 className="w-4 h-4 mr-2"/>, label:"Manage MOQ" },
                  { to:"/store-manager/purchase-order", icon:<ShoppingCart className="w-4 h-4 mr-2"/>, label:"Create PO" },
                  { to:"/store-manager/vendor-request", icon:<Users className="w-4 h-4 mr-2"/>, label:"Request Vendor" },
                  { to:"/store-manager/branch-transfer", icon:<Package className="w-4 h-4 mr-2"/>, label:"Send to Branch" },
                  { to:"/store-manager/branch-store", icon:<Package className="w-4 h-4 mr-2"/>, label:"Branch Store" },
                ].map(a => (
                  <Link key={a.to} to={a.to}>
                    <Button variant="outline" className="w-full">{a.icon}{a.label}</Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Inventory Monitoring ── */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <Input placeholder="Search items or category…" className="pl-9" value={invSearch} onChange={e => setInvSearch(e.target.value)}/>
            </div>
            <div className="flex gap-2 text-xs shrink-0">
              <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-medium">{outOfStock.length} Out of Stock</span>
              <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 font-medium">{belowReorder.length - outOfStock.length} Low Stock</span>
              <span className="px-2 py-1 rounded bg-green-100 text-green-700 font-medium">{inventory.length - belowReorder.length} OK</span>
            </div>
          </div>

          <div className="space-y-2">
            {filteredInv.map((item: any) => {
              const st = stockStatus(item);
              const pct = item.reorderLevel > 0 ? Math.min(100, Math.round((item.centralStock / (item.reorderLevel * 2)) * 100)) : 100;
              const issuedThisMonth = (() => {
                try {
                  const iss = JSON.parse(localStorage.getItem("cleancar_issuance_records") || "[]");
                  const now = new Date();
                  return iss.filter((r: any) => {
                    const d = new Date(r.issuanceDate ?? r.createdAt);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() &&
                      r.items?.some((i: any) => i.itemId === item.itemId);
                  }).reduce((s: number, r: any) => {
                    const line = r.items?.find((i: any) => i.itemId === item.itemId);
                    return s + (line?.quantity ?? 0);
                  }, 0);
                } catch { return 0; }
              })();
              return (
                <div key={item.itemId} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-gray-900">{item.itemName}</p>
                        <Badge className={`text-xs ${st.cls}`}>{st.label}</Badge>
                      </div>
                      <p className="text-xs text-gray-500">{item.category} · Reorder at: {item.reorderLevel} {item.unit}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${item.centralStock === 0 ? "bg-red-500" : item.centralStock <= item.reorderLevel ? "bg-orange-400" : "bg-green-500"}`} style={{width:`${pct}%`}}/>
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{pct}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xl font-bold ${item.centralStock === 0 ? "text-red-600" : item.centralStock <= item.reorderLevel ? "text-orange-600" : "text-gray-900"}`}>{item.centralStock}</p>
                      <p className="text-xs text-gray-400">{item.unit} in store</p>
                      {issuedThisMonth > 0 && <p className="text-xs text-blue-600 mt-0.5">−{issuedThisMonth} issued this month</p>}
                    </div>
                  </div>
                  {(item.centralStock ?? 0) <= (item.reorderLevel ?? 0) && (
                    <div className="mt-3 flex items-center justify-between bg-orange-50 border border-orange-200 rounded p-2">
                      <p className="text-xs text-orange-800 font-medium">⚠ Below reorder level — suggest ordering {item.reorderLevel * 3} {item.unit}</p>
                      <Link to="/store-manager/purchase-order">
                        <button className="text-xs bg-orange-600 text-white rounded px-2 py-1 hover:bg-orange-700">Create PO</button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredInv.length === 0 && (
              <div className="text-center py-10 text-sm text-gray-400">No items match "{invSearch}"</div>
            )}
          </div>
        </TabsContent>

        {/* ── Min Order Quantity ── */}
        <TabsContent value="moq" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <Input placeholder="Search products…" className="pl-9" value={moqSearch} onChange={e => setMoqSearch(e.target.value)}/>
            </div>
            <div className="flex gap-2 text-xs shrink-0">
              <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-medium">{moqProducts.filter((p: any) => p.status === "critical").length} Critical</span>
              <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 font-medium">{moqProducts.filter((p: any) => p.status === "below-moq").length} Below MOQ</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["Product","Category","Supplier","Current Stock","MOQ","Status","Last Updated","Action"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMOQ.map((p: any) => (
                    <tr key={p.id} className={`hover:bg-gray-50 ${p.status === "critical" ? "bg-red-50" : p.status === "below-moq" ? "bg-orange-50" : ""}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.category}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.supplier ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${p.currentStock === 0 ? "text-red-600" : p.currentStock <= p.moq ? "text-orange-600" : "text-gray-900"}`}>
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {editingId === p.id ? (
                          <div className="flex items-center gap-1">
                            <Input type="number" min={1} value={editValue} onChange={e => setEditValue(parseInt(e.target.value)||1)} className="w-20 h-7 text-xs"/>
                            <button onClick={() => handleMOQSave(p.id)} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4"/></button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
                          </div>
                        ) : (
                          <span className="font-medium">{p.moq} {p.unit}</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge className={`text-xs ${statusColor(p.status)}`}>{p.status === "below-moq" ? "Below MOQ" : p.status === "critical" ? "Critical" : "Normal"}</Badge></td>
                      <td className="px-4 py-3 text-xs text-gray-400">{p.lastUpdated}</td>
                      <td className="px-4 py-3">
                        {editingId !== p.id && (
                          <button onClick={() => { setEditingId(p.id); setEditValue(p.moq); }} className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1">
                            <Edit2 className="w-3.5 h-3.5"/>Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="text-xs text-gray-400 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-500"/>
            MOQ changes save automatically and persist across sessions.
          </div>
        </TabsContent>

        {/* ── Analytics ── */}
        <TabsContent value="analytics" className="space-y-4">
          {/* 6-month stock movement */}
          <Card>
            <CardHeader><CardTitle className="text-base">6-Month Stock Movement — Issued vs Received</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CONSUMPTION_HISTORY}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="month" tick={{fontSize:10}}/>
                  <YAxis tick={{fontSize:11}}/>
                  <Tooltip/>
                  <Legend/>
                  <Bar dataKey="received" fill="#10b981" name="Received (GRN)"/>
                  <Bar dataKey="issued"   fill="#3b82f6" name="Issued"/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Stock level trend */}
            <Card>
              <CardHeader><CardTitle className="text-base">Stock Level Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={CONSUMPTION_HISTORY}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="month" tick={{fontSize:10}}/>
                    <YAxis tick={{fontSize:11}}/>
                    <Tooltip/>
                    <Line type="monotone" dataKey="stock" stroke="#8b5cf6" strokeWidth={2} dot={{r:4}} name="Stock Units"/>
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category breakdown pie */}
            <Card>
              <CardHeader><CardTitle className="text-base">Consumption by Category</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={CATEGORY_BREAKDOWN} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}) => `${name} ${value}%`} labelLine={false}>
                      {CATEGORY_BREAKDOWN.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {CATEGORY_BREAKDOWN.map(c => (
                    <div key={c.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{background:c.color}}/>
                      {c.name} ({c.value}%)
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reorder analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Reorder Analysis</CardTitle>
                <Badge className="bg-orange-100 text-orange-800">{belowReorder.length} items need attention</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inventory
                  .filter((i: any) => (i.centralStock ?? 0) <= (i.reorderLevel ?? 0))
                  .sort((a: any, b: any) => (a.centralStock ?? 0) - (b.centralStock ?? 0))
                  .map((item: any) => {
                    const suggestQty = (item.reorderLevel ?? 0) * 3;
                    return (
                      <div key={item.itemId} className="flex items-center justify-between border rounded p-3">
                        <div>
                          <p className="text-sm font-medium">{item.itemName}</p>
                          <p className="text-xs text-gray-500">Current: <span className={item.centralStock === 0 ? "text-red-600 font-semibold" : "text-orange-600 font-semibold"}>{item.centralStock} {item.unit}</span> · Reorder at: {item.reorderLevel} · Suggest ordering: {suggestQty}</p>
                        </div>
                        <Link to="/store-manager/purchase-order">
                          <button className="text-xs bg-blue-600 text-white rounded px-3 py-1.5 hover:bg-blue-700 shrink-0">Create PO</button>
                        </Link>
                      </div>
                    );
                  })}
                {belowReorder.length === 0 && <p className="text-sm text-gray-500 text-center py-4">✅ All items are above reorder level</p>}
              </div>
            </CardContent>
          </Card>

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:"Avg Weekly Issue",   value: Math.round(liveWeekly.reduce((s,w)=>s+w.consumption,0)/4),  unit:"units/week", color:"text-blue-700" },
              { label:"Total Issued (6mo)", value: CONSUMPTION_HISTORY.reduce((s,m)=>s+m.issued,0),            unit:"units",       color:"text-purple-700" },
              { label:"Total Received",     value: CONSUMPTION_HISTORY.reduce((s,m)=>s+m.received,0),          unit:"units",       color:"text-green-700" },
              { label:"Items Out of Stock", value: outOfStock.length,                                           unit:"items",       color:"text-red-600" },
            ].map(m => (
              <div key={m.label} className="bg-white border rounded-lg p-4 text-center">
                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.unit}</p>
                <p className="text-xs text-gray-500 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StoreManagerModule;
