import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  AlertTriangle, Clock, Truck, ClipboardList, Package,
  FileText, Wrench, TrendingDown, Plus, Eye, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { MaterialRequisitionDrawer } from "./MaterialRequisitionDrawer";
import { GRNCreationDialog } from "./GRNCreationDialog";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";

export function StoreDashboard() {
  // ✅ FIX: Read live data from InventoryContext — no more hardcoded arrays
  const { inventory, stockTransactions, getPendingTransactions } = useInventory();
  const { city } = useCity();

  const [mrDrawerOpen, setMrDrawerOpen]       = useState(false);
  const [selectedItemForMR, setSelectedItemForMR] = useState<any>(null);
  const [grnDialogOpen, setGrnDialogOpen]     = useState(false);
  const [selectedPOForGRN, setSelectedPOForGRN] = useState<any>(null);

  // ── Derived data from live InventoryContext ──────────────────────────────

  // Reorder alerts: items at or below reorder level for this city
  const reorderAlerts = useMemo(() =>
    inventory
      .filter(i => i.cityId === city && i.centralStock <= i.reorderLevel)
      .map(i => ({
        itemId:       i.itemId,
        itemName:     i.itemName,
        category:     i.category,
        currentStock: i.centralStock,
        unit:         i.unit,
        reorderLevel: i.reorderLevel,
        deficit:      Math.max(0, i.reorderLevel - i.centralStock),
        status:       i.centralStock === 0 ? "zero" : "low",
        lastIssued:   stockTransactions
          .filter(t => t.itemId === i.itemId && t.type === "Issue" && t.status === "Completed")
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt?.slice(0, 10) ?? "—",
      }))
      .sort((a, b) => a.currentStock - b.currentStock),
    [inventory, stockTransactions, city]
  );

  // Pending transactions (issuance requests) for this city
  const pendingIssuanceRequests = useMemo(() =>
    getPendingTransactions(city)
      .filter(t => t.type === "Issue")
      .map(t => {
        const item = inventory.find(i => i.itemId === t.itemId);
        return {
          transactionId:         t.transactionId,
          requestingSupervisor:  t.requestedBy ?? "Supervisor",
          itemName:              item?.itemName ?? t.itemId,
          quantity:              t.quantity,
          unit:                  item?.unit ?? "",
          urgency:               t.quantity > 20 ? "Urgent" : "Normal",
          requestDate:           t.createdAt.slice(0, 10),
        };
      }),
    [getPendingTransactions, inventory, city]
  );

  // Today's stock movement summary
  const today = new Date().toISOString().slice(0, 10);
  const todayTxns = useMemo(() =>
    stockTransactions.filter(t => t.cityId === city && t.createdAt?.slice(0, 10) === today && t.status === "Completed"),
    [stockTransactions, city, today]
  );
  const dailyMovement = useMemo(() => ({
    received: {
      items: todayTxns.filter(t => t.type === "Procurement").length,
      units:  todayTxns.filter(t => t.type === "Procurement").reduce((s, t) => s + t.quantity, 0),
    },
    issued: {
      items: todayTxns.filter(t => t.type === "Issue").length,
      units:  todayTxns.filter(t => t.type === "Issue").reduce((s, t) => s + t.quantity, 0),
    },
    adjusted: { entries: todayTxns.filter(t => t.type === "Adjustment").length },
    equipmentAssigned: { items: todayTxns.filter(t => t.type === "Transfer" && t.toLocation === "Washer").length },
    equipmentReceived: { items: todayTxns.filter(t => t.type === "Return").length },
  }), [todayTxns]);

  // Handlers
  const handleRaiseMR = (item: any) => { setSelectedItemForMR(item); setMrDrawerOpen(true); };
  const handleViewStockHistory = (item: any) => toast.info(`Opening ledger for ${item.itemName}`);
  const handleCreateGRN = (po: any) => { setSelectedPOForGRN(po); setGrnDialogOpen(true); };
  const handleProcessIssuance = (req: any) =>
    toast.success("Issuance queued", { description: `Request from ${req.requestingSupervisor} queued for processing` });
  const handleMarkDispatched = (ret: any) =>
    toast.success("Dispatched", { description: `${ret.returnNumber} marked as dispatched` });

  return (
    <div className="space-y-6">

      {/* Row 1: Reorder Alerts + Pending Issuance Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Reorder Alerts — live from InventoryContext */}
        <Card className={
          reorderAlerts.some(a => a.status === "zero")
            ? "border-red-300 bg-red-50"
            : reorderAlerts.length > 0
            ? "border-amber-300 bg-amber-50"
            : ""
        }>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${reorderAlerts.some(a => a.status === "zero") ? "text-red-600" : "text-amber-600"}`} />
                Reorder Alerts
              </CardTitle>
              <Badge variant={reorderAlerts.some(a => a.status === "zero") ? "destructive" : "default"}>
                {reorderAlerts.length}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">Materials at or below reorder level</p>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {reorderAlerts.length === 0 ? (
              <p className="text-sm text-green-700 font-medium py-4 text-center">✅ All items above reorder level</p>
            ) : reorderAlerts.map(alert => (
              <div key={alert.itemId} className={`border rounded-md p-3 ${alert.status === "zero" ? "bg-red-100 border-red-300" : "bg-white border-amber-200"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{alert.itemName}</p>
                    <p className="text-xs text-gray-600">{alert.category}</p>
                  </div>
                  {alert.status === "zero" && <Badge variant="destructive" className="text-xs">ZERO STOCK</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div><span className="text-gray-500">Current:</span>
                    <span className={`ml-1 font-bold ${alert.status === "zero" ? "text-red-600" : "text-amber-600"}`}>
                      {alert.currentStock} {alert.unit}
                    </span>
                  </div>
                  <div><span className="text-gray-500">Reorder at:</span>
                    <span className="ml-1 font-medium">{alert.reorderLevel} {alert.unit}</span>
                  </div>
                  <div><span className="text-gray-500">Deficit:</span>
                    <span className="ml-1 font-medium text-red-600">{alert.deficit} {alert.unit}</span>
                  </div>
                  <div><span className="text-gray-500">Last issued:</span>
                    <span className="ml-1 font-medium">{alert.lastIssued}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleRaiseMR(alert)}>
                    <Plus className="w-3 h-3 mr-1" />Raise MR
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewStockHistory(alert)}>
                    <Eye className="w-3 h-3 mr-1" />Stock History
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Issuance Requests — live from InventoryContext */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                Pending Issuance Requests
              </CardTitle>
              <Badge variant="secondary">{pendingIssuanceRequests.length}</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">Supervisor requests awaiting processing</p>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {pendingIssuanceRequests.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No pending issuance requests.</p>
            ) : pendingIssuanceRequests.map(req => (
              <div key={req.transactionId} className={`border rounded-md p-3 ${req.urgency === "Urgent" ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{req.requestingSupervisor}</p>
                    <p className="text-xs text-gray-600">{req.itemName} — {req.quantity} {req.unit}</p>
                  </div>
                  <Badge variant={req.urgency === "Urgent" ? "destructive" : "outline"} className="text-xs">
                    {req.urgency}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  Request Date: {req.requestDate}
                </div>
                <Button size="sm" className="w-full" onClick={() => handleProcessIssuance(req)}>
                  <CheckCircle className="w-3 h-3 mr-1" />Process Issuance
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Pending Deliveries (static) + Equipment Tasks (static) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending Deliveries — static until PO module is built */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />Pending Deliveries
              </CardTitle>
              <Badge variant="secondary">0</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">Expected deliveries from open POs</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-sm text-gray-500">
              No pending deliveries. Create a Purchase Order to track incoming stock.
            </div>
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => handleCreateGRN(null)}>
              <FileText className="w-4 h-4 mr-2" />Create GRN Directly
            </Button>
          </CardContent>
        </Card>

        {/* Equipment Tasks (static — real data once equipment module built) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-5 h-5 text-teal-600" />Equipment Tasks
              </CardTitle>
              <Badge variant="secondary">0</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">Pending kit assignments and returns</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-sm text-gray-500">
              No equipment tasks pending.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Purchase Return Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600" />Purchase Return Dispatch
              </CardTitle>
              <Badge variant="secondary">0</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">Returns ready for physical dispatch</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-sm text-gray-500">No returns pending dispatch.</div>
          </CardContent>
        </Card>

        {/* Daily Stock Movement — live from today's transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Stock Movement — Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Received (GRNs)", value: dailyMovement.received.items, sub: `${dailyMovement.received.units} units`, color: "bg-green-50 border-green-200 text-green-700" },
                { label: "Issued",          value: dailyMovement.issued.items,   sub: `${dailyMovement.issued.units} units`,   color: "bg-blue-50  border-blue-200  text-blue-700"  },
                { label: "Adjusted",        value: dailyMovement.adjusted.entries, sub: "entries",                             color: "bg-amber-50 border-amber-200 text-amber-700" },
                { label: "Kits Assigned",   value: dailyMovement.equipmentAssigned.items, sub: "items",                       color: "bg-purple-50 border-purple-200 text-purple-700" },
                { label: "Equip. Received", value: dailyMovement.equipmentReceived.items, sub: "items",                       color: "bg-teal-50 border-teal-200 text-teal-700"   },
              ].map(s => (
                <div key={s.label} className={`rounded-md border p-3 text-center ${s.color}`}>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs font-medium mt-0.5">{s.label}</p>
                  <p className="text-xs text-gray-500">{s.sub}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drawers / Dialogs */}
      <MaterialRequisitionDrawer
        open={mrDrawerOpen}
        onClose={() => { setMrDrawerOpen(false); setSelectedItemForMR(null); }}
        prefilledItem={selectedItemForMR}
      />
      <GRNCreationDialog
        open={grnDialogOpen}
        onClose={() => { setGrnDialogOpen(false); setSelectedPOForGRN(null); }}
        linkedPO={selectedPOForGRN}
      />
    </div>
  );
}
