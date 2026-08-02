import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  AlertCircle, AlertTriangle, BarChart3, FileText, Package,
  ShoppingCart, TrendingUp, TrendingDown, Users, Search,
  Edit2, Check, X, CheckCircle, Clock, Truck, Shirt, Recycle, Sparkles, Layers, Wrench,
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
function getLiveInventory(cityId: string) {
  try {
    // Real fix: previously called without cityId, silently defaulting to
    // CITY-SURAT regardless of which city is actually active.
    const items = DataService.get<any>("INVENTORY_ITEMS", cityId);
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

// MOQManagement.tsx (the dedicated /store-manager/moq screen) persists real
// MOQ overrides to this same key as an id->moq map ({ itemId: number }).
// This function used to trust whatever it read from that key directly and
// treat it as a full array of product objects — so after any real edit made
// on the dedicated MOQ screen, this dashboard's "moq" tab received an
// object, not an array, and every .filter()/.map() call on it below crashed
// the whole module. Always normalize to an id->moq override map here, and
// derive the full product list fresh from the real inventory items, the
// same way MOQManagement.tsx does.
function loadMOQOverrides(): Record<string, number> {
  try {
    const raw = JSON.parse(localStorage.getItem("cleancar_moq_settings") || "{}");
    if (Array.isArray(raw)) {
      return raw.reduce((acc: Record<string, number>, r: any) => { acc[r.id] = r.moq; return acc; }, {});
    }
    return raw && typeof raw === "object" ? raw : {};
  } catch { return {}; }
}

function buildMoqProducts(inventoryItems: any[]) {
  const overrides = loadMOQOverrides();
  return inventoryItems.map((i: any) => {
    const moq = overrides[i.itemId] ?? i.reorderLevel ?? 0;
    const status = i.centralStock === 0 ? "critical" : i.centralStock <= moq ? "below-moq" : "normal";
    return {
      id: i.itemId, name: i.itemName, category: i.category, unit: i.unit,
      currentStock: i.centralStock, moq, status,
      lastUpdated: i.updatedAt ? i.updatedAt.split("T")[0] : new Date().toISOString().split("T")[0],
      supplier: i.supplier ?? "—",
    };
  });
}

const WEEKLY_CONSUMPTION = [
  { week:"Week 1", consumption:38, id:"w1" },
  { week:"Week 2", consumption:44, id:"w2" },
  { week:"Week 3", consumption:29, id:"w3" },
  { week:"Week 4", consumption:48, id:"w4" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Cleaning Supplies": "#3b82f6", "Equipment": "#10b981", "Consumables": "#f59e0b",
  "Tools": "#8b5cf6", "Pressure Washer Parts": "#ef4444",
};

// 6-month issued/received history — real fix: this was previously a
// permanent hardcoded constant that never reflected real activity.
// Derived from the same real cleancar_issuance_records / cleancar_grn_records
// sources liveWeekly already reads below. No real historical stock-level
// snapshots exist, so (unlike the old fake data) this doesn't invent a
// "stock" figure — only real issued/received counts per month.
function buildConsumptionHistory(): Array<{ month: string; issued: number; received: number; id: string }> {
  try {
    const iss  = JSON.parse(localStorage.getItem("cleancar_issuance_records") || "[]");
    const grns = JSON.parse(localStorage.getItem("cleancar_grn_records")      || "[]");
    const now = new Date();
    const months: Array<{ key: string; label: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      });
    }
    return months.map(({ key, label }) => ({
      month: label,
      issued: iss.filter((r: any) => String(r.issuanceDate ?? r.createdAt ?? "").startsWith(key))
        .reduce((s: number, r: any) => s + (r.totalQty ?? 0), 0),
      received: grns.filter((g: any) => String(g.grnDate ?? g.createdAt ?? "").startsWith(key))
        .reduce((s: number, g: any) => s + (g.totalAccepted ?? 0), 0),
      id: key,
    }));
  } catch { return []; }
}

// Real category breakdown — % of total issued quantity by item category,
// across every real issuance record on file, cross-referenced against the
// real inventory item list for each item's category.
function buildCategoryBreakdown(inventoryItems: any[]): Array<{ name: string; value: number; color: string }> {
  try {
    const iss = JSON.parse(localStorage.getItem("cleancar_issuance_records") || "[]");
    const categoryByItemId: Record<string, string> = {};
    inventoryItems.forEach((i: any) => { categoryByItemId[i.itemId] = i.category ?? "Other"; });
    const totals: Record<string, number> = {};
    iss.forEach((r: any) => {
      (r.items || []).forEach((line: any) => {
        const cat = categoryByItemId[line.itemId] || "Other";
        totals[cat] = (totals[cat] || 0) + (line.quantity ?? 0);
      });
    });
    const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);
    if (grandTotal === 0) return [];
    return Object.entries(totals).map(([name, qty]) => ({
      name, value: Math.round((qty / grandTotal) * 100),
      color: CATEGORY_COLORS[name] || "#94a3b8",
    }));
  } catch { return []; }
}

// Real per-supervisor issued quantity, from every real issuance record's
// own issuedBy field — replaces two permanently hardcoded named supervisors
// that never reflected who actually issued anything.
function buildSupervisorConsumption(): Array<{ supervisor: string; issued: number; id: string }> {
  try {
    const iss = JSON.parse(localStorage.getItem("cleancar_issuance_records") || "[]");
    const totals: Record<string, number> = {};
    iss.forEach((r: any) => {
      const by = r.issuedBy || "Unknown";
      totals[by] = (totals[by] || 0) + (r.totalQty ?? 0);
    });
    return Object.entries(totals).map(([supervisor, issued]) => ({ supervisor, issued, id: supervisor }));
  } catch { return []; }
}

export function StoreManagerModule() {
  const { city } = useCity();
  // ── Live data ──────────────────────────────────────────────────────────────
  const [inventory, setInventory] = useState(() => getLiveInventory(city));
  const [moqProducts, setMoqProducts] = useState(() => buildMoqProducts(inventory));
  const [moqSearch, setMoqSearch] = useState("");
  const [invSearch, setInvSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const consumptionHistory = buildConsumptionHistory();
  const categoryBreakdown = buildCategoryBreakdown(inventory);
  const supervisorConsumption = buildSupervisorConsumption();

  // Real access gate: the main store hub is for the main store manager
  // only (no assignedBranchId) - a branch-assigned manager is redirected
  // to their own real, restricted screen instead. Placed after every
  // hook above so React's hooks rules are never violated.
  const { currentUser } = useRole();
  const { getEmployeeById } = useEmployee();
  const assignedEmployee = currentUser?.employeeId ? getEmployeeById(currentUser.employeeId) : undefined;
  if (assignedEmployee?.assignedBranchId) {
    return <Navigate to="/store-manager/branch-store" replace />;
  }

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
    // Persist as the same id->moq override map MOQManagement.tsx reads/writes
    // — writing the full array back here is exactly what broke that screen.
    try {
      const overrides = loadMOQOverrides();
      localStorage.setItem("cleancar_moq_settings", JSON.stringify({ ...overrides, [id]: editValue }));
    } catch {}
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
                {supervisorConsumption.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
                    No real issuance records yet
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={supervisorConsumption}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="supervisor" tick={{fontSize:10}}/>
                    <YAxis tick={{fontSize:11}}/>
                    <Tooltip/>
                    <Bar dataKey="issued" fill="#10b981" name="Units Issued"/>
                  </BarChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Inventory &amp; Procurement</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { to:"/store-manager/inventory", icon:<Package className="w-4 h-4 mr-2"/>, label:"View Inventory" },
                    { to:"/store-manager/moq",       icon:<BarChart3 className="w-4 h-4 mr-2"/>, label:"Manage MOQ" },
                    { to:"/store-manager/purchase-order", icon:<ShoppingCart className="w-4 h-4 mr-2"/>, label:"Create PO" },
                    { to:"/store-manager/vendor-request", icon:<Users className="w-4 h-4 mr-2"/>, label:"Request Vendor" },
                  ].map(a => (
                    <Link key={a.to} to={a.to}>
                      <Button variant="outline" className="w-full">{a.icon}{a.label}</Button>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Branch Supply Chain</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { to:"/store-manager/branch-transfer", icon:<Truck className="w-4 h-4 mr-2"/>, label:"Send to Branch" },
                    { to:"/store-manager/branch-store", icon:<Truck className="w-4 h-4 mr-2"/>, label:"Branch Store" },
                    { to:"/store-manager/bottling", icon:<Sparkles className="w-4 h-4 mr-2"/>, label:"Bottling" },
                    { to:"/store-manager/uniform-receipt", icon:<Shirt className="w-4 h-4 mr-2"/>, label:"Uniform Receipt" },
                    { to:"/store-manager/procurement", icon:<ShoppingCart className="w-4 h-4 mr-2"/>, label:"Receive Stock (Procurement)" },
                    { to:"/store-manager/pressure-washer-assembly", icon:<Wrench className="w-4 h-4 mr-2"/>, label:"Pressure Washer Assembly" },
                    { to:"/store-manager/equipment-repair-queue", icon:<Wrench className="w-4 h-4 mr-2"/>, label:"Equipment Repair Queue" },
                    { to:"/store-manager/equipment-serial-registry", icon:<Layers className="w-4 h-4 mr-2"/>, label:"Equipment Serial Registry" },
                  ].map(a => (
                    <Link key={a.to} to={a.to}>
                      <Button variant="outline" className="w-full">{a.icon}{a.label}</Button>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cloth Tracking</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { to:"/cloth-tracking/receive-fabric", icon:<Shirt className="w-4 h-4 mr-2"/>, label:"Receive Fabric" },
                    { to:"/cloth-tracking/chain-movement", icon:<Truck className="w-4 h-4 mr-2"/>, label:"Cloth Chain Movement" },
                    { to:"/cloth-tracking/return-journey", icon:<Recycle className="w-4 h-4 mr-2"/>, label:"Cloth Return Journey" },
                    { to:"/cloth-tracking/laundry", icon:<Sparkles className="w-4 h-4 mr-2"/>, label:"Laundry" },
                    { to:"/cloth-tracking/fleet", icon:<Layers className="w-4 h-4 mr-2"/>, label:"Cloth Fleet" },
                  ].map(a => (
                    <Link key={a.to} to={a.to}>
                      <Button variant="outline" className="w-full">{a.icon}{a.label}</Button>
                    </Link>
                  ))}
                </div>
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
                <BarChart data={consumptionHistory}>
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

          {/* Category breakdown pie — no real historical stock-level
              snapshots exist (unlike issued/received above), so there's no
              honest "Stock Level Trend" chart to show; only this real
              category breakdown remains. */}
          <Card>
            <CardHeader><CardTitle className="text-base">Consumption by Category</CardTitle></CardHeader>
            <CardContent>
              {categoryBreakdown.length === 0 ? (
                <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
                  No real issuance records yet
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={categoryBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}) => `${name} ${value}%`} labelLine={false}>
                        {categoryBreakdown.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2 flex-wrap">
                    {categoryBreakdown.map(c => (
                      <div key={c.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{background:c.color}}/>
                        {c.name} ({c.value}%)
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

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
              { label:"Total Issued (6mo)", value: consumptionHistory.reduce((s,m)=>s+m.issued,0),              unit:"units",       color:"text-purple-700" },
              { label:"Total Received",     value: consumptionHistory.reduce((s,m)=>s+m.received,0),            unit:"units",       color:"text-green-700" },
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
