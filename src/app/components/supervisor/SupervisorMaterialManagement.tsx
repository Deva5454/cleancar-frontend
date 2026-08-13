/**
 * SupervisorMaterialManagement.tsx — Buffer Stock, Washers, and Refills,
 * for the logged-in Supervisor.
 *
 * ✅ MIGRATED off unifiedMaterialService.ts (a separate, in-memory-only
 * data system with a hardcoded identity — SUP-001/Rajesh Kumar — shown
 * to every supervisor regardless of who was actually logged in) onto
 * the real InventoryContext every other stock screen in this app uses.
 * Numbers here now match Supervisor Stock Receipt, My Stock, and every
 * other real screen, and persist across a refresh.
 *
 * One real, deliberate scope change: unifiedMaterialService tracked
 * individual, barcoded items with per-unit condition and usage-count
 * (e.g. "Nozzle #4821, Condition: Fair, Used 12/50 times"). The real
 * InventoryContext data model doesn't track stock at that granularity
 * anywhere in the app — every other screen (My Stock, Washer
 * Issuances, Stock Receipt) works with aggregate quantities per
 * bucket. This screen now matches that same real granularity rather
 * than being the one screen in the app pretending to have individual
 * asset tracking that doesn't actually exist anywhere else. If
 * genuine per-unit/serial tracking is wanted, that's a real feature
 * to scope separately — see the Inventory Module handover doc.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Package, ArrowUpCircle, AlertTriangle, RefreshCw, Wrench, AlertCircle,
} from "lucide-react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { getBranchesForCity } from "../../config/branchStores";
import { toast } from "sonner";

export function SupervisorMaterialManagement() {
  const {
    inventory, getSupervisorStock, getWasherStock, transferInventory,
    reportBrokenEquipment, createTransaction, getActionableTransactions,
    getWasherRequestsPendingSupervisorApproval, approveTransaction, rejectTransaction,
  } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const { getEmployeesByRole, getEmployeeById } = useEmployee();
  const branch = getBranchesForCity(city)[0];

  // Real, currently-logged-in supervisor — not a hardcoded ID.
  const supervisorId = currentUser?.employeeId || "";
  const supervisorName = currentUser?.name || "Supervisor";

  const [activeTab, setActiveTab] = useState<"buffer" | "washers" | "approvals" | "refills">("buffer");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Real buffer stock — this supervisor's actual held quantities,
  // split into Equipment (the closest real match to the old
  // "Individual Items" section) and everything else (Consumables).
  const bufferStock = supervisorId ? getSupervisorStock(supervisorId, city) : [];
  const equipmentItems = bufferStock.filter((i: any) => i.category === "Equipment");
  const consumableItems = bufferStock.filter((i: any) => i.category !== "Equipment");
  const lowStockItems = bufferStock.filter((i: any) => {
    const qty = i.supervisorStock[supervisorId] || 0;
    return qty <= i.reorderLevel;
  });

  // Real washers reporting to this supervisor.
  const myWashers = useMemo(() => {
    if (!supervisorId) return [];
    return getEmployeesByRole(["Car Washer Full Time", "Car Washer Part Time"])
      .filter((w: any) => (w.reportingManagerId || getEmployeeById(w.employeeId || w.id)?.reportingManagerId) === supervisorId);
  }, [supervisorId, getEmployeesByRole, getEmployeeById]);

  // Real pending refill requests this supervisor has sent toward
  // Central/Branch, using the same real MRF mechanism Material
  // Requisition already reads from — so a request made here shows up
  // in the same real place a Store Manager already fulfills from.
  const myRefillRequests = getActionableTransactions(city).filter(
    (t: any) => t.toLocation === "Supervisor" && t.toId === supervisorId
  );

  // Real washer replenishment requests waiting on this specific
  // supervisor's approval — there is no pre-stocked "supervisor
  // buffer" these draw from; the real source is the Branch Store,
  // fulfilled by the Store Manager once approved here.
  const pendingWasherApprovals = getWasherRequestsPendingSupervisorApproval(supervisorId, city);

  const selectedItem = bufferStock.find((i: any) => i.itemId === selectedItemId);

  const handleIssueToWasher = (washerId: string, quantity: number) => {
    if (!selectedItem || !supervisorId) return;
    const held = selectedItem.supervisorStock[supervisorId] || 0;
    if (quantity <= 0 || quantity > held) {
      toast.error(`You only have ${held} of ${selectedItem.itemName} — enter a real quantity`);
      return;
    }
    transferInventory(selectedItem.itemId, quantity, "Supervisor", supervisorId, "Washer", washerId, city);
    toast.success(`${quantity} ${selectedItem.itemName} issued to washer`);
    setShowIssueModal(false);
    setSelectedItemId(null);
  };

  const handleReportBreakdown = (reason: string) => {
    if (!selectedItem || !supervisorId) return;
    if (!branch) {
      toast.error("No real branch store found for this city");
      return;
    }
    const result = reportBrokenEquipment(selectedItem.itemId, "Supervisor", supervisorId, branch.id, supervisorName, reason, city);
    if (result.success) {
      toast.success(result.spareIssued
        ? `${selectedItem.itemName} sent toward Kim via the Branch Store — a spare was issued from real Branch stock`
        : `${selectedItem.itemName} sent toward Kim via the Branch Store — no spare was on hand, you'll be short this item until repair completes or a spare arrives`);
    } else {
      toast.error(result.error || "Could not report — check you actually hold this item");
    }
    setShowBreakdownModal(false);
    setSelectedItemId(null);
  };

  const handleRequestRefill = (itemId: string, quantity: number, reason: string) => {
    const item = inventory.find((i: any) => i.itemId === itemId && i.cityId === city);
    if (!item || quantity <= 0) {
      toast.error("Select a real item and enter a real quantity");
      return;
    }
    createTransaction({
      itemId,
      type: "Transfer",
      quantity,
      quantityRequested: quantity,
      quantityFulfilled: 0,
      fromLocation: "Central",
      toLocation: "Supervisor",
      toId: supervisorId,
      status: "Pending",
      requestedBy: supervisorName,
      cityId: city,
      reason: reason || undefined,
    });
    toast.success("Refill request submitted — visible in Material Requisition for fulfillment");
    setShowRefillModal(false);
  };

  const handleApproveWasherRequest = (transactionId: string) => {
    approveTransaction(transactionId, supervisorName);
    toast.success("Approved — Store Manager can now fulfill it from Branch stock");
  };

  const handleRejectWasherRequest = (transactionId: string) => {
    const reason = window.prompt("Reason for rejecting this request:");
    if (!reason) return;
    rejectTransaction(transactionId, supervisorName, reason);
    toast.success("Request rejected");
  };

  if (!supervisorId) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Could not identify the logged-in supervisor — please log in again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-teal-600 to-teal-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Material Management</h1>
          <p className="text-sm text-teal-100">Buffer Stock & Distribution — {supervisorName}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-teal-100">Equipment Items</p>
              <p className="text-2xl font-bold">{equipmentItems.length}</p>
            </div>
            <div>
              <p className="text-teal-100">Consumables</p>
              <p className="text-2xl font-bold">{consumableItems.length}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-teal-100">Low Stock Alerts</p>
              <p className={`text-lg font-bold ${lowStockItems.length > 0 ? "text-red-300" : ""}`}>
                {lowStockItems.length}
              </p>
            </div>
            <div>
              <p className="text-teal-100">Pending Refills</p>
              <p className="text-lg font-bold">{myRefillRequests.length}</p>
            </div>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="mt-3 bg-amber-600 border-2 border-amber-400 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold">🟠 {lowStockItems.length} MATERIALS LOW ON STOCK</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="buffer">
              Buffer Stock
              {lowStockItems.length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">{lowStockItems.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="washers">Washers</TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals
              {pendingWasherApprovals.length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">{pendingWasherApprovals.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="refills">
              Refills
              {myRefillRequests.length > 0 && <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs bg-blue-100">{myRefillRequests.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BUFFER STOCK */}
          <TabsContent value="buffer" className="space-y-3">
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full h-12 flex items-center justify-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => setShowRefillModal(true)}
                >
                  <RefreshCw className="h-5 w-5" /> Request Refill from Store
                </Button>
              </CardContent>
            </Card>

            {lowStockItems.length > 0 && (
              <Card className="border-2 border-red-300 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-bold text-red-900">Low Stock Alerts</h3>
                  </div>
                  <div className="space-y-2">
                    {lowStockItems.map((item: any) => (
                      <div key={item.itemId} className="bg-white rounded p-2 border border-red-200">
                        <p className="font-semibold text-sm">{item.itemName}</p>
                        <p className="text-xs text-gray-600">
                          Current: {item.supervisorStock[supervisorId] || 0} {item.unit} | Reorder at: {item.reorderLevel} {item.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 px-1">Equipment ({equipmentItems.length})</h3>
              {equipmentItems.length === 0 ? (
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6 text-center text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No equipment in your buffer</p>
                  </CardContent>
                </Card>
              ) : (
                equipmentItems.map((item: any) => {
                  const qty = item.supervisorStock[supervisorId] || 0;
                  return (
                    <Card key={item.itemId} className="border-2 border-gray-200">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900">{item.itemName}</p>
                            <p className="text-xs text-gray-600">On hand: {qty}</p>
                          </div>
                          <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-300">{item.category}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedItemId(item.itemId); setShowIssueModal(true); }}>
                            <ArrowUpCircle className="h-4 w-4 mr-1" /> Issue
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => { setSelectedItemId(item.itemId); setShowBreakdownModal(true); }}>
                            <Wrench className="h-4 w-4 mr-1" /> Report Broken
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 px-1">Consumables ({consumableItems.length})</h3>
              {consumableItems.map((item: any) => {
                const qty = item.supervisorStock[supervisorId] || 0;
                const isLow = qty <= item.reorderLevel;
                return (
                  <Card key={item.itemId} className={`border-2 ${isLow ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-gray-900">{item.itemName}</p>
                        {isLow && <Badge variant="destructive">Low Stock</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-gray-600">Current</p>
                          <p className={`text-lg font-bold ${isLow ? "text-red-600" : "text-gray-900"}`}>{qty}</p>
                          <p className="text-gray-500">{item.unit}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-gray-600">Reorder Level</p>
                          <p className="text-lg font-bold text-gray-900">{item.reorderLevel}</p>
                          <p className="text-gray-500">{item.unit}</p>
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedItemId(item.itemId); setShowIssueModal(true); }}>
                        <ArrowUpCircle className="h-4 w-4 mr-1" /> Issue to Washer
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 2: WASHERS */}
          <TabsContent value="washers" className="space-y-3">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-3">
                <p className="text-sm text-green-900 font-semibold">Real stock currently held by each washer reporting to you</p>
              </CardContent>
            </Card>

            {myWashers.length === 0 ? (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6 text-center text-gray-500">
                  <p className="text-sm">No washers reporting to you on record</p>
                </CardContent>
              </Card>
            ) : (
              myWashers.map((w: any) => {
                const washerId = w.employeeId || w.id;
                const stock = getWasherStock(washerId, city);
                return (
                  <Card key={washerId} className="border-2 border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900">{w.fullName || `${w.firstName} ${w.lastName}`}</p>
                          <p className="text-xs text-gray-600">{washerId}</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">{stock.length} item{stock.length !== 1 ? "s" : ""}</Badge>
                      </div>
                      {stock.length === 0 ? (
                        <p className="text-xs text-gray-400">No real stock currently held.</p>
                      ) : (
                        stock.map((item: any) => (
                          <div key={item.itemId} className="bg-gray-50 rounded p-2 mb-1 text-xs flex items-center justify-between">
                            <span className="font-semibold">{item.itemName}</span>
                            <span className="text-gray-700">{item.washerStock[washerId] || 0} {item.unit}</span>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* TAB 3: APPROVALS — washer replenishment requests waiting on
              this specific supervisor, sourced from the real Branch
              Store, not a supervisor buffer. */}
          <TabsContent value="approvals" className="space-y-3">
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-3">
                <p className="text-sm text-orange-900 font-semibold">Washer requests waiting on your approval — once approved, the Store Manager fulfills it from Branch stock</p>
              </CardContent>
            </Card>

            {pendingWasherApprovals.length === 0 ? (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6 text-center text-gray-500">
                  <p className="text-sm">No requests pending your approval</p>
                </CardContent>
              </Card>
            ) : (
              pendingWasherApprovals.map((request: any) => {
                const item = inventory.find((i: any) => i.itemId === request.itemId);
                const washer = myWashers.find((w: any) => (w.employeeId || w.id) === request.toId);
                return (
                  <Card key={request.transactionId} className="border-2 border-orange-200">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{item?.itemName || request.itemId}</p>
                          <p className="text-xs text-gray-600">
                            {washer?.fullName || `${washer?.firstName ?? ""} ${washer?.lastName ?? ""}`.trim() || request.toId} · Requested {request.quantityRequested ?? request.quantity} {item?.unit || ""}
                          </p>
                          {request.reason && <p className="text-xs text-gray-500 italic">"{request.reason}"</p>}
                        </div>
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 shrink-0">Pending</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveWasherRequest(request.transactionId)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => handleRejectWasherRequest(request.transactionId)}>
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* TAB 4: REFILLS */}
          <TabsContent value="refills" className="space-y-3">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <p className="text-sm text-blue-900 font-semibold">Real refill requests sent toward Store — same list Material Requisition fulfills from</p>
              </CardContent>
            </Card>

            {myRefillRequests.length === 0 ? (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6 text-center text-gray-500">
                  <p className="text-sm">No refill requests</p>
                </CardContent>
              </Card>
            ) : (
              myRefillRequests.map((request: any) => {
                const item = inventory.find((i: any) => i.itemId === request.itemId);
                return (
                  <Card key={request.transactionId} className="border-2 border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900">{item?.itemName || request.itemId}</p>
                          <p className="text-xs text-gray-600">Requested: {request.quantityRequested ?? request.quantity} {item?.unit || ""}</p>
                        </div>
                        <Badge variant="outline" className={
                          request.status === "Completed" ? "bg-green-100 text-green-700 border-green-300"
                          : request.status === "Partially Fulfilled" ? "bg-blue-100 text-blue-700 border-blue-300"
                          : "bg-amber-100 text-amber-700 border-amber-300"
                        }>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Issue to Washer Modal */}
      {showIssueModal && selectedItem && (
        <IssueToWasherModal
          itemName={selectedItem.itemName}
          unit={selectedItem.unit}
          available={selectedItem.supervisorStock[supervisorId] || 0}
          washers={myWashers}
          onConfirm={handleIssueToWasher}
          onCancel={() => { setShowIssueModal(false); setSelectedItemId(null); }}
        />
      )}

      {/* Breakdown Modal */}
      {showBreakdownModal && selectedItem && (
        <BreakdownReportModal
          itemName={selectedItem.itemName}
          onConfirm={handleReportBreakdown}
          onCancel={() => { setShowBreakdownModal(false); setSelectedItemId(null); }}
        />
      )}

      {/* Refill Request Modal */}
      {showRefillModal && (
        <RefillRequestModal
          items={consumableItems.length > 0 ? consumableItems : bufferStock}
          supervisorId={supervisorId}
          onConfirm={handleRequestRefill}
          onCancel={() => setShowRefillModal(false)}
        />
      )}
    </div>
  );
}

// ========== ISSUE TO WASHER MODAL ==========

function IssueToWasherModal({
  itemName, unit, available, washers, onConfirm, onCancel,
}: {
  itemName: string; unit: string; available: number; washers: any[];
  onConfirm: (washerId: string, quantity: number) => void; onCancel: () => void;
}) {
  const [washerId, setWasherId] = useState("");
  const [quantity, setQuantity] = useState("1");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-green-600" /> Issue {itemName} to Washer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">You have <strong>{available} {unit}</strong> on hand.</p>
          <div>
            <Label>Washer</Label>
            <Select value={washerId} onValueChange={setWasherId}>
              <SelectTrigger><SelectValue placeholder="Select washer" /></SelectTrigger>
              <SelectContent>
                {washers.map((w: any) => (
                  <SelectItem key={w.employeeId || w.id} value={w.employeeId || w.id}>
                    {w.fullName || `${w.firstName} ${w.lastName}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantity</Label>
            <Input type="number" min="1" max={available} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={!washerId || !quantity}
              onClick={() => onConfirm(washerId, parseInt(quantity, 10) || 0)}
            >
              Issue to Washer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== BREAKDOWN REPORT MODAL ==========

function BreakdownReportModal({
  itemName, onConfirm, onCancel,
}: { itemName: string; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-red-600" /> Report {itemName} Broken
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">This sends the real unit to Kim for repair and removes it from your buffer stock until it's marked fixed.</p>
          <div>
            <Label>What happened</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the issue" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button variant="destructive" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>Report Broken</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== REFILL REQUEST MODAL ==========

function RefillRequestModal({
  items, onConfirm, onCancel,
}: { items: any[]; supervisorId: string; onConfirm: (itemId: string, quantity: number, reason: string) => void; onCancel: () => void }) {
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const selected = items.find((i: any) => i.itemId === itemId);
  const canSubmit = itemId !== "" && parseInt(quantity, 10) > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-md my-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" /> Request Material Refill
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Material</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger><SelectValue placeholder="Select a material" /></SelectTrigger>
              <SelectContent>
                {items.map((i: any) => <SelectItem key={i.itemId} value={i.itemId}>{i.itemName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selected && (
            <div className="bg-gray-50 border rounded p-3 text-sm">
              <p className="text-gray-600">Current on hand: <strong>{selected.supervisorStock?.[selected.itemId] ?? 0} {selected.unit}</strong></p>
            </div>
          )}
          <div>
            <Label>Quantity to Request</Label>
            <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why do you need this refill?" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" disabled={!canSubmit} onClick={() => onConfirm(itemId, parseInt(quantity, 10), reason)}>
              Submit Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SupervisorMaterialManagement;
