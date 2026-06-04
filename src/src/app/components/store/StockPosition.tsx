import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "../ui/dialog";
import { Search, Eye, FileText, AlertTriangle, TrendingDown, Package } from "lucide-react";
import { toast } from "sonner";
import { useInventory, type InventoryItem } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";

// ── Derived view type ────────────────────────────────────────────────────────
interface EnrichedItem extends InventoryItem {
  stockStatus: "In Stock" | "Low Stock" | "Critical" | "Out of Stock";
  closingStock: number;
  openingStock: number;
  receivedMonth: number;
  issuedMonth: number;
  adjustmentsMonth: number;
}

function enrichItem(item: InventoryItem, txns: ReturnType<typeof useInventory>["stockTransactions"]): EnrichedItem {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Calculate month movements from transaction log
  const itemTxns = txns.filter(t => t.itemId === item.itemId && t.createdAt >= monthStart && t.status === "Completed");
  const receivedMonth = itemTxns.filter(t => t.type === "Procurement").reduce((s, t) => s + t.quantity, 0);
  const issuedMonth   = itemTxns.filter(t => t.type === "Issue").reduce((s, t) => s + t.quantity, 0);
  const adjustmentsMonth = itemTxns.filter(t => t.type === "Adjustment").reduce((s, t) => s + t.quantity, 0);

  const closingStock = item.centralStock;
  const openingStock = Math.max(0, closingStock - receivedMonth + issuedMonth - adjustmentsMonth);

  const stockStatus: EnrichedItem["stockStatus"] =
    closingStock === 0               ? "Out of Stock" :
    closingStock <= item.reorderLevel * 0.5 ? "Critical"     :
    closingStock <= item.reorderLevel       ? "Low Stock"    : "In Stock";

  return { ...item, stockStatus, closingStock, openingStock, receivedMonth, issuedMonth, adjustmentsMonth };
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StockStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "In Stock":    return <Badge className="bg-green-600 text-white">In Stock</Badge>;
    case "Low Stock":   return <Badge className="bg-amber-500 text-white">Low Stock</Badge>;
    case "Critical":    return <Badge variant="destructive">Critical</Badge>;
    case "Out of Stock":return <Badge variant="destructive" className="animate-pulse">Out of Stock</Badge>;
    default:            return <Badge variant="outline">{status}</Badge>;
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export function StockPosition() {
  // ✅ FIX 1: use `inventory` (correct export name) not `items`
  const { inventory, stockTransactions } = useInventory();
  const { city } = useCity();

  const [viewMode, setViewMode]         = useState<"item" | "location">("item");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm]     = useState("");
  const [showLedger, setShowLedger]     = useState(false);
  const [selectedItem, setSelectedItem] = useState<EnrichedItem | null>(null);

  // ✅ FIX 2: Compute derived fields (stockStatus, closingStock, etc.)
  //    Filter by current city so we never show another city's stock
  const cityItems: EnrichedItem[] = useMemo(() => {
    const cityFiltered = inventory.filter(i => i.cityId === city);
    return cityFiltered.map(i => enrichItem(i, stockTransactions));
  }, [inventory, stockTransactions, city]);

  // ✅ FIX 3: Category list is dynamic from actual data (no hardcoded mismatches)
  const categories = useMemo(() =>
    [...new Set(cityItems.map(i => i.category))].sort(), [cityItems]);

  const filtered = useMemo(() => {
    return cityItems
      .filter(item => filterCategory === "all" || item.category === filterCategory)
      .filter(item => filterStatus   === "all" || item.stockStatus === filterStatus)
      .filter(item => !searchTerm || item.itemName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const ord = { "Out of Stock": 0, Critical: 1, "Low Stock": 2, "In Stock": 3 };
        return (ord[a.stockStatus] ?? 4) - (ord[b.stockStatus] ?? 4);
      });
  }, [cityItems, filterCategory, filterStatus, searchTerm]);

  // Summary stats
  const totalItems   = cityItems.length;
  const lowCount     = cityItems.filter(i => i.stockStatus === "Low Stock" || i.stockStatus === "Critical").length;
  const outCount     = cityItems.filter(i => i.stockStatus === "Out of Stock").length;
  const inStockCount = cityItems.filter(i => i.stockStatus === "In Stock").length;

  // Item ledger — shows transaction history for selected item
  const ledgerTxns = useMemo(() => {
    if (!selectedItem) return [];
    return stockTransactions
      .filter(t => t.itemId === selectedItem.itemId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50);
  }, [selectedItem, stockTransactions]);

  // Dead stock = no transaction in last 60 days
  const deadStock = useMemo(() => {
    const cutoff = new Date(Date.now() - 60 * 86400000).toISOString();
    return cityItems.filter(item => {
      const lastTxn = stockTransactions
        .filter(t => t.itemId === item.itemId && t.status === "Completed")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      return !lastTxn || lastTxn.createdAt < cutoff;
    });
  }, [cityItems, stockTransactions]);

  // Empty state when no items seeded yet
  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
        <Package className="w-12 h-12 text-gray-300" />
        <p className="text-lg font-medium">No inventory items found for {city}</p>
        <p className="text-sm">Items will appear here once stock is seeded or added via GRN.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Stock Position</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time inventory status — quantities only</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.info("Export coming soon")}>
          <FileText className="w-4 h-4 mr-2" />Export
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Items",  value: totalItems,   color: "bg-blue-50  border-blue-200  text-blue-700"  },
          { label: "In Stock",     value: inStockCount, color: "bg-green-50 border-green-200 text-green-700" },
          { label: "Low / Critical",value: lowCount,    color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Out of Stock", value: outCount,     color: "bg-red-50   border-red-200   text-red-700"   },
        ].map(s => (
          <div key={s.label} className={`rounded-lg border p-4 text-center ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-3">
        <Label className="font-medium text-sm">View:</Label>
        {(["item", "location"] as const).map(v => (
          <Button key={v} variant={viewMode === v ? "default" : "outline"} size="sm"
            onClick={() => setViewMode(v)}>
            {v === "item" ? "Item View" : "Location View"}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Item name…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item View Table */}
      {viewMode === "item" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Position — {filtered.length} Items</CardTitle>
            <p className="text-xs text-gray-500">No prices or values shown</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">No items match the current filters.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item ID</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Issued</TableHead>
                    <TableHead className="text-right">Adjustments</TableHead>
                    <TableHead className="text-right">Closing Stock</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(item => (
                    <TableRow key={item.itemId} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-xs">{item.itemId}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-gray-400">{item.category}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-gray-600">{item.openingStock} {item.unit}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">+{item.receivedMonth}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">-{item.issuedMonth}</TableCell>
                      <TableCell className="text-right text-gray-600">
                        {item.adjustmentsMonth > 0 ? `+${item.adjustmentsMonth}` : item.adjustmentsMonth}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <span className={
                          item.stockStatus === "Out of Stock" || item.stockStatus === "Critical"
                            ? "text-red-600"
                            : item.stockStatus === "Low Stock"
                            ? "text-amber-600"
                            : "text-gray-900"
                        }>
                          {item.closingStock} {item.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-gray-500">{item.reorderLevel}</TableCell>
                      <TableCell><StockStatusBadge status={item.stockStatus} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setShowLedger(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location View */}
      {viewMode === "location" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location View — Central Store ({city})</CardTitle>
            <p className="text-xs text-gray-500">Stock breakdown by storage location</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Central stock summary */}
            <div className="border rounded-md p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />Central Store
              </h3>
              <div className="space-y-2">
                {cityItems.map(item => (
                  <div key={item.itemId} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">{item.itemName}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{item.centralStock} {item.unit}</span>
                      <StockStatusBadge status={item.stockStatus} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dead Stock Section */}
      {deadStock.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />Dead Stock
              </CardTitle>
              <Badge variant="outline">{deadStock.length} Items</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">No movement in last 60 days</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty in Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadStock.map(item => (
                  <TableRow key={item.itemId}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                    <TableCell className="text-right">{item.closingStock} {item.unit}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm"
                        onClick={() => toast.info(`Flagging ${item.itemName} for review`)}>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Stock Ledger Dialog */}
      <Dialog open={showLedger} onOpenChange={setShowLedger}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Ledger — {selectedItem?.itemName}</DialogTitle>
            <DialogDescription>
              Transaction history · Current stock: {selectedItem?.closingStock} {selectedItem?.unit}
            </DialogDescription>
          </DialogHeader>
          {ledgerTxns.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No transactions recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerTxns.map(txn => (
                  <TableRow key={txn.transactionId}>
                    <TableCell className="text-xs">{txn.createdAt.slice(0, 10)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{txn.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {txn.fromLocation}{txn.fromId ? ` (${txn.fromId.slice(0, 8)}…)` : ""}
                      {" → "}
                      {txn.toLocation}{txn.toId ? ` (${txn.toId.slice(0, 8)}…)` : ""}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {txn.type === "Issue" ? `-${txn.quantity}` : `+${txn.quantity}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={txn.status === "Completed" ? "default" : "outline"} className="text-xs">
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">
                      {txn.transactionId.slice(0, 16)}…
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
