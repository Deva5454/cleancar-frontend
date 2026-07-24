import { BackButton } from "../ui/back-button";
// Material Requisition System Component
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "../ui/dialog";
import { Plus, FileText, Package, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { mockMRFs } from "../../lib/materialRequisition";
import type { PurchaseRequest } from "../../lib/materialRequisition";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useEmployee } from "../../contexts/EmployeeContext";

export function MaterialRequisition() {
  const { currentRole, currentUser } = useRole();
  const { stockTransactions, getPendingTransactions, procureInventory,
          getCentralStock, inventory, createTransaction, approveTransaction, fulfillRequestQuantity } = useInventory();
  const { city, cityInfo } = useCity();
  const { employees } = useEmployee();

  const [showNewMRF, setShowNewMRF] = useState(false);
  const [mrfItemId, setMrfItemId] = useState("");
  const [mrfQuantity, setMrfQuantity] = useState("");
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [fulfillQty, setFulfillQty] = useState("");

  const handleCreateMRF = () => {
    if (!mrfItemId || !mrfQuantity) {
      toast.error("Select an item and enter a quantity");
      return;
    }
    const qty = parseFloat(mrfQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    // Real MRF - creates a genuine Pending transaction, the same real
    // record type this screen already reads its list from. Previously
    // this button had no handler at all.
    createTransaction({
      itemId: mrfItemId,
      type: "Transfer",
      quantity: qty,
      quantityRequested: qty,
      quantityFulfilled: 0,
      fromLocation: "Central",
      toLocation: "Supervisor",
      status: "Pending",
      requestedBy: currentUser?.name || currentRole,
      cityId: city,
    });
    toast.success("Material Requisition Form submitted");
    setShowNewMRF(false);
    setMrfItemId(""); setMrfQuantity("");
  };

  const handleApproveMRF = (transactionId: string) => {
    approveTransaction(transactionId, currentUser?.name || currentRole);
    toast.success("MRF approved");
  };

  const handleFulfillQuantity = (transactionId: string, owed: number, fromLocation: string) => {
    const qty = parseInt(fulfillQty, 10);
    if (!qty || qty <= 0) {
      toast.error("Enter a real quantity to issue now");
      return;
    }
    if (qty > owed) {
      toast.error(`Only ${owed} is genuinely owed on this request`);
      return;
    }
    const ok = fulfillRequestQuantity(transactionId, qty);
    if (ok) {
      const remaining = owed - qty;
      toast.success(remaining > 0 ? `Issued ${qty} — ${remaining} still owed on this request` : `Issued ${qty} — request fully complete`);
      setFulfillingId(null);
      setFulfillQty("");
    } else {
      const guidance = fromLocation === "Supervisor"
        ? " — request more from Branch first, then try again"
        : fromLocation === "Branch"
        ? " — request more from Central first, then try again"
        : "";
      toast.error(`Not enough real stock to issue that amount right now${guidance}`);
    }
  };

  // Derive MRFs from pending stock transactions
  const liveMRFs = getPendingTransactions(city).map((t: any) => {
    const item = inventory.find((i: any) => i.itemId === t.itemId && i.cityId === city);
    const requested = t.quantityRequested ?? t.quantity;
    const fulfilled = t.quantityFulfilled || 0;
    return {
      id: t.transactionId,
      itemName: item?.itemName || t.itemId,
      unit: item?.unit || "",
      quantity: t.quantity,
      quantityRequested: requested,
      quantityFulfilled: fulfilled,
      quantityOwed: Math.max(0, requested - fulfilled),
      requestedBy: t.requestedBy || "Unknown",
      status: t.status,
      createdAt: t.createdAt,
      type: t.type,
      fromLocation: t.fromLocation,
    };
  });

  // Previously fell back to mockMRFs when empty, which would make a city
  // with no real requisitions yet look like it had them. An empty list is
  // the honest state; the UI shows a proper "no requisitions yet" message.
  const displayMRFs = liveMRFs;

  const realActivePOCount = (() => {
    try {
      const pos = JSON.parse(localStorage.getItem("cleancar_purchase_orders") || "[]");
      return pos.filter((po: any) => po.status !== "Delivered" && po.status !== "Rejected").length;
    } catch { return 0; }
  })();
  
  const canCreateMRF = ["Supervisor", "Operations Manager", "Store Manager"].includes(currentRole);
  const canApproveMRF = ["Store Manager"].includes(currentRole);
  const canCreatePR = ["Store Manager"].includes(currentRole);
  const canApprovePR = ["Super Admin", "Admin"].includes(currentRole);

  // Real fix: previously this whole section only ever showed one
  // hardcoded example, clearly labeled as fake. Now reads real,
  // persisted purchase requests, and both real actions below (create,
  // approve) genuinely create and update them.
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => {
    try { return JSON.parse(localStorage.getItem("cleancar_purchase_requests") || "[]"); } catch { return []; }
  });
  const [showNewPR, setShowNewPR] = useState(false);
  const [prItems, setPrItems] = useState([{ itemName: "", quantity: "", unit: "", estimatedCost: "", vendorSuggestion: "" }]);
  const [prPriority, setPrPriority] = useState<"High" | "Medium" | "Low">("Medium");

  const addPrItemRow = () => setPrItems((prev) => [...prev, { itemName: "", quantity: "", unit: "", estimatedCost: "", vendorSuggestion: "" }]);
  const removePrItemRow = (idx: number) => setPrItems((prev) => prev.filter((_, i) => i !== idx));
  const updatePrItemRow = (idx: number, field: string, value: string) => {
    setPrItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const handleCreatePR = () => {
    const validItems = prItems.filter((i) => i.itemName.trim() && i.quantity && parseFloat(i.quantity) > 0);
    if (validItems.length === 0) {
      toast.error("Add at least one item with a real name and quantity");
      return;
    }
    const items = validItems.map((i) => ({
      itemName: i.itemName.trim(), quantity: parseFloat(i.quantity), unit: i.unit.trim() || "Pcs",
      estimatedCost: Math.max(0, parseFloat(i.estimatedCost) || 0), vendorSuggestion: i.vendorSuggestion.trim() || undefined,
    }));
    const newPR: PurchaseRequest = {
      id: `PR-${new Date().getFullYear()}-${String(purchaseRequests.length + 1).padStart(3, "0")}-${Date.now().toString().slice(-4)}`,
      requestedBy: currentUser?.name || currentRole,
      dateRequested: new Date().toISOString().split("T")[0],
      priority: prPriority,
      status: "Pending",
      items,
      totalEstimatedCost: items.reduce((s, i) => s + i.estimatedCost, 0),
    };
    const updated = [newPR, ...purchaseRequests];
    setPurchaseRequests(updated);
    localStorage.setItem("cleancar_purchase_requests", JSON.stringify(updated));
    toast.success(`${newPR.id} submitted`);
    setShowNewPR(false);
    setPrItems([{ itemName: "", quantity: "", unit: "", estimatedCost: "", vendorSuggestion: "" }]);
    setPrPriority("Medium");
  };

  const handleApprovePR = (pr: PurchaseRequest) => {
    // Real approval - genuinely creates a real Purchase Order in the
    // same real system Procurement and GRN already read from, not a
    // separate, disconnected record.
    const existingPOs = JSON.parse(localStorage.getItem("cleancar_purchase_orders") || "[]");
    const poNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const newPO = {
      id: Date.now(),
      po: poNumber,
      vendor: pr.items[0]?.vendorSuggestion || "Multiple Vendors",
      items: pr.items.length,
      amount: pr.totalEstimatedCost,
      status: "Pending Procurement Review",
      date: new Date().toISOString().split("T")[0],
    };
    localStorage.setItem("cleancar_purchase_orders", JSON.stringify([...existingPOs, newPO]));

    const updated = purchaseRequests.map((r) =>
      r.id === pr.id
        ? { ...r, status: "PO Issued" as const, approvedByAdmin: currentUser?.name || currentRole, poNumber, poIssuedOn: new Date().toISOString().split("T")[0] }
        : r
    );
    setPurchaseRequests(updated);
    localStorage.setItem("cleancar_purchase_requests", JSON.stringify(updated));
    toast.success(`${poNumber} created from ${pr.id}`);
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Material Requisition System</h2>
          <p className="text-sm text-gray-600 mt-1">Request and track material requirements</p>
        </div>
        {canCreateMRF && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNewMRF(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New MRF
          </Button>
        )}
      </div>

      {/* Material Requisition Forms (MRF) */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Material Requisition Forms (MRF)
          </h3>
          <div className="space-y-3">
            {displayMRFs.length === 0 && (
              <p className="text-sm text-gray-400 italic py-4 text-center">No requisitions yet.</p>
            )}
            {displayMRFs.map((mrf: any) => (
              <div 
                key={mrf.id} 
                className={`p-4 rounded-lg border-2 ${
                  mrf.status === "Pending" ? "bg-orange-50 border-orange-200" :
                  mrf.status === "Partially Fulfilled" ? "bg-amber-50 border-amber-300" :
                  mrf.status === "Approved" ? "bg-green-50 border-green-200" :
                  mrf.status === "Completed" ? "bg-blue-50 border-blue-200" :
                  "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">{mrf.itemName}</p>
                      <Badge variant={mrf.status === "Pending" ? "default" : mrf.status === "Partially Fulfilled" ? "secondary" : "outline"}>
                        {mrf.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Requested by: <span className="font-medium">{mrf.requestedBy}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Date: {new Date(mrf.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {canApproveMRF && mrf.status === "Pending" && (
                    <Button size="sm" onClick={() => handleApproveMRF(mrf.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  {canApproveMRF && (mrf.status === "Approved" || mrf.status === "Partially Fulfilled") && fulfillingId !== mrf.id && (
                    <Button size="sm" variant="outline" onClick={() => { setFulfillingId(mrf.id); setFulfillQty(String(mrf.quantityOwed)); }}>
                      <Package className="w-4 h-4 mr-1" />
                      Fulfill
                    </Button>
                  )}
                </div>
                <div className="bg-white/50 p-3 rounded space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Requested</span>
                    <span className="font-medium">{mrf.quantityRequested} {mrf.unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Fulfilled so far</span>
                    <span className="font-medium">{mrf.quantityFulfilled} {mrf.unit}</span>
                  </div>
                  {mrf.quantityOwed > 0 && (
                    <div className="flex items-center justify-between text-sm text-amber-700 font-medium">
                      <span>Still owed</span>
                      <span>{mrf.quantityOwed} {mrf.unit}</span>
                    </div>
                  )}
                </div>
                {fulfillingId === mrf.id && (
                  <div className="mt-3 flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max={mrf.quantityOwed}
                      value={fulfillQty}
                      onChange={(e) => setFulfillQty(e.target.value)}
                      className="w-28"
                      placeholder="Qty now"
                    />
                    <Button size="sm" onClick={() => handleFulfillQuantity(mrf.id, mrf.quantityOwed, mrf.fromLocation)}>Confirm Issue</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setFulfillingId(null); setFulfillQty(""); }}>Cancel</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Purchase Requests */}
      {(canCreatePR || canApprovePR) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Purchase Requests
              </h3>
              {canCreatePR && (
                <Button size="sm" variant="outline" onClick={() => setShowNewPR(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  New Purchase Request
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {purchaseRequests.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No purchase requests yet.</p>
              )}
              {purchaseRequests.map((pr) => (
                <div 
                  key={pr.id} 
                  className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{pr.id}</p>
                        <Badge variant={pr.priority === "High" ? "destructive" : "default"}>
                          {pr.priority}
                        </Badge>
                        <Badge variant="default">{pr.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Requested by: <span className="font-medium">{pr.requestedBy}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Date: {new Date(pr.dateRequested).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Estimated Cost</p>
                      <p className="text-xl font-bold text-purple-600">
                        ₹{(pr?.totalEstimatedCost ?? 0).toLocaleString()}
                      </p>
                      {canApprovePR && pr.status === "Pending" && (
                        <Button size="sm" className="mt-2" onClick={() => handleApprovePR(pr)}>
                          Approve & Issue PO
                        </Button>
                      )}
                      {pr.status === "PO Issued" && pr.poNumber && (
                        <p className="text-xs text-green-600 mt-1">{pr.poNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/50 p-3 rounded">
                    <p className="text-sm font-medium mb-2">Items:</p>
                    {pr.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-sm border-b last:border-0">
                        <div className="flex-1">
                          <span className="text-gray-700">{item.itemName}</span>
                          {item.vendorSuggestion && (
                            <p className="text-xs text-gray-500">Vendor: {item.vendorSuggestion}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{item.quantity} {item.unit}</span>
                          <p className="text-xs text-gray-600">₹{(item?.estimatedCost ?? 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consumption Analytics */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Material Consumption Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-400">Not tracked yet</p>
              <p className="text-xs text-gray-500 mt-1">Material consumed</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Pending MRFs</p>
              <p className="text-2xl font-bold text-green-600">{displayMRFs.filter((m: any) => m.status === "Pending").length}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Active POs</p>
              <p className="text-2xl font-bold text-purple-600">{realActivePOCount}</p>
              <p className="text-xs text-gray-500 mt-1">Not yet delivered</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New MRF Dialog - real form, previously the button had no handler at all */}
      <Dialog open={showNewMRF} onOpenChange={setShowNewMRF}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Material Requisition</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Item</Label>
              <Select value={mrfItemId} onValueChange={setMrfItemId}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {inventory.filter((i: any) => i.cityId === city).map((i: any) => (
                    <SelectItem key={i.itemId} value={i.itemId}>{i.itemName} ({i.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" min="0" value={mrfQuantity} onChange={(e) => setMrfQuantity(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMRF(false)}>Cancel</Button>
            <Button onClick={handleCreateMRF}>Submit MRF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Purchase Request Dialog - real form, previously the button had no handler at all */}
      <Dialog open={showNewPR} onOpenChange={setShowNewPR}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Purchase Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Priority</Label>
              <Select value={prPriority} onValueChange={(v) => setPrPriority(v as "High" | "Medium" | "Low")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Items</Label>
              {prItems.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Item name" value={item.itemName} onChange={(e) => updatePrItemRow(idx, "itemName", e.target.value)} />
                    <Input placeholder="Vendor suggestion (optional)" value={item.vendorSuggestion} onChange={(e) => updatePrItemRow(idx, "vendorSuggestion", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input type="number" min="0" placeholder="Quantity" value={item.quantity} onChange={(e) => updatePrItemRow(idx, "quantity", e.target.value)} />
                    <Input placeholder="Unit (Pcs, Litre, Kg...)" value={item.unit} onChange={(e) => updatePrItemRow(idx, "unit", e.target.value)} />
                    <Input type="number" min="0" placeholder="Est. cost (₹)" value={item.estimatedCost} onChange={(e) => updatePrItemRow(idx, "estimatedCost", e.target.value)} />
                  </div>
                  {prItems.length > 1 && (
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removePrItemRow(idx)}>Remove item</Button>
                  )}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addPrItemRow}><Plus className="w-4 h-4 mr-1" /> Add Another Item</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPR(false)}>Cancel</Button>
            <Button onClick={handleCreatePR}>Submit Purchase Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MaterialRequisition;
