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
import { mockMRFs, mockPurchaseRequests } from "../../lib/materialRequisition";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useEmployee } from "../../contexts/EmployeeContext";

export function MaterialRequisition() {
  const { currentRole, currentUser } = useRole();
  const { stockTransactions, getPendingTransactions, procureInventory,
          getCentralStock, inventory, createTransaction, approveTransaction, completeTransaction } = useInventory();
  const { city, cityInfo } = useCity();
  const { employees } = useEmployee();

  const [showNewMRF, setShowNewMRF] = useState(false);
  const [mrfItemId, setMrfItemId] = useState("");
  const [mrfQuantity, setMrfQuantity] = useState("");

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

  const handleIssueMRF = (transactionId: string) => {
    // Real fix: previously this button had no handler - stock never
    // actually moved even after an MRF was "approved."
    completeTransaction(transactionId);
    toast.success("Material issued for this MRF");
  };

  // Derive MRFs from pending stock transactions
  const liveMRFs = getPendingTransactions(city).map((t: any) => {
    const item = inventory.find((i: any) => i.itemId === t.itemId && i.cityId === city);
    return {
      id: t.transactionId,
      itemName: item?.itemName || t.itemId,
      quantity: t.quantity,
      requestedBy: t.requestedBy || "Unknown",
      status: t.status,
      createdAt: t.createdAt,
      type: t.type,
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
                  mrf.status === "Approved" ? "bg-green-50 border-green-200" :
                  mrf.status === "Issued" ? "bg-blue-50 border-blue-200" :
                  "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">{mrf.id}</p>
                      <Badge variant={mrf.priority === "High" ? "destructive" : "default"}>
                        {mrf.priority}
                      </Badge>
                      <Badge variant={
                        mrf.status === "Pending" ? "default" :
                        mrf.status === "Approved" ? "secondary" :
                        mrf.status === "Issued" ? "outline" :
                        "destructive"
                      }>
                        {mrf.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Requested by: <span className="font-medium">{mrf.requestedBy}</span> ({mrf.requestedByRole})
                    </p>
                    <p className="text-xs text-gray-500">
                      Date: {new Date(mrf.dateRequested).toLocaleDateString()}
                    </p>
                  </div>
                  {canApproveMRF && mrf.status === "Pending" && (
                    <Button size="sm" onClick={() => handleApproveMRF(mrf.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  {canApproveMRF && mrf.status === "Approved" && (
                    <Button size="sm" variant="outline" onClick={() => handleIssueMRF(mrf.id)}>
                      <Package className="w-4 h-4 mr-1" />
                      Issue Material
                    </Button>
                  )}
                </div>
                <div className="bg-white/50 p-3 rounded">
                  <p className="text-sm font-medium mb-2">Requested Items:</p>
                  {mrf.items.map((item: any, idx: any) => (
                    <div key={idx} className="flex items-center justify-between py-1 text-sm">
                      <span className="text-gray-700">{item.itemName}</span>
                      <span className="font-medium">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
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
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  New Purchase Request
                </Button>
              )}
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                Purchase Request tracking isn't connected to real data yet — the list below and the "New Purchase Request" button don't create or show anything real. This needs a real backend before it's usable.
              </div>
              {mockPurchaseRequests.map((pr) => (
                <div 
                  key={pr.id} 
                  className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg opacity-60"
                >
                  <div className="text-xs text-purple-600 font-medium mb-1">EXAMPLE — not real data</div>
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
                        <Button size="sm" className="mt-2">
                          Approve & Issue PO
                        </Button>
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
              <Input type="number" value={mrfQuantity} onChange={(e) => setMrfQuantity(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMRF(false)}>Cancel</Button>
            <Button onClick={handleCreateMRF}>Submit MRF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MaterialRequisition;
