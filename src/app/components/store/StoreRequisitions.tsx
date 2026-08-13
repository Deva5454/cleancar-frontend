import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { FileText, Plus, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { useInventory } from "../../contexts/InventoryContext";
import { purchaseRequestService } from "../../services/purchaseRequestService";
import type { PurchaseRequest } from "../../lib/materialRequisition";

type FormItem = { itemId: string; itemName: string; unit: string; currentStock: number; reorderLevel: number; qtyRequired: number };
type Urgency = "Normal" | "Urgent" | "Critical";

const emptyForm = () => ({ urgency: "Normal" as Urgency, notes: "", newItemId: "", newQty: 10, items: [] as FormItem[] });

const statusColor: Record<string, string> = {
  Pending: "bg-blue-100 text-blue-800",
  "PO Issued": "bg-teal-100 text-teal-800",
  Rejected: "bg-red-100 text-red-800",
};

/**
 * Store's own upward requisition to Procurement — "we need to restock
 * Central." Real, previously-disconnected screen (its own localStorage
 * key, hardcoded requester/approver names regardless of who was
 * actually logged in) now built on the same real
 * purchaseRequestService the Inventory module's Material Requisition
 * screen and Procurement's own Material Requisitions screen share, so
 * a request raised here shows up identically on both.
 */
export function StoreRequisitions() {
  const { currentUser, currentRole } = useRole();
  const { city } = useCity();
  const { inventory } = useInventory();

  const [requests, setRequests] = useState<PurchaseRequest[]>(() => purchaseRequestService.getAll());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"All" | PurchaseRequest["status"]>("All");
  const [form, setForm] = useState(emptyForm());

  const canRaise = ["Store Manager"].includes(currentRole);
  const canApprove = ["Procurement Manager", "Super Admin", "Admin"].includes(currentRole);

  const centralItems = inventory.filter((i: any) => i.cityId === city);
  const belowReorder = centralItems.filter((i: any) => (i.centralStock || 0) <= i.reorderLevel);

  const openDialog = () => {
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const handleAddItem = () => {
    const inv = centralItems.find((i: any) => i.itemId === form.newItemId);
    if (!inv) { toast.error("Select an item"); return; }
    if (form.items.find((i) => i.itemId === form.newItemId)) { toast.error("Already added"); return; }
    setForm((f) => ({
      ...f, newItemId: "", newQty: 10,
      items: [...f.items, { itemId: inv.itemId, itemName: inv.itemName, unit: inv.unit, currentStock: inv.centralStock || 0, reorderLevel: inv.reorderLevel, qtyRequired: f.newQty }],
    }));
  };

  const handleAutoFill = () => {
    const autoItems = belowReorder.map((i: any) => ({
      itemId: i.itemId, itemName: i.itemName, unit: i.unit, currentStock: i.centralStock || 0, reorderLevel: i.reorderLevel, qtyRequired: i.reorderLevel * 3,
    }));
    setForm((f) => ({ ...f, items: autoItems, urgency: belowReorder.some((i: any) => (i.centralStock || 0) === 0) ? "Critical" : "Urgent" }));
    toast.success(`Auto-filled ${autoItems.length} items below reorder level`);
  };

  const handleSubmit = () => {
    if (form.items.length === 0) { toast.error("Add at least one item"); return; }
    const priority = form.urgency === "Normal" ? "Medium" : "High";
    const pr = purchaseRequestService.create({
      requestedBy: currentUser?.name || currentRole,
      priority,
      items: form.items.map((i) => ({ itemName: i.itemName, quantity: i.qtyRequired, unit: i.unit, estimatedCost: 0 })),
      remarks: `[${form.urgency}] Central Store restock${form.notes ? ` — ${form.notes}` : ""}`,
    });
    setRequests(purchaseRequestService.getAll());
    toast.success(`${pr.id} submitted for approval`);
    setDialogOpen(false);
  };

  const handleApprove = (pr: PurchaseRequest) => {
    const result = purchaseRequestService.approveAndIssuePO(pr.id, currentUser?.name || currentRole);
    if (!result) { toast.error("Could not approve — it may have already been actioned"); return; }
    setRequests(purchaseRequestService.getAll());
    toast.success(`${pr.id} approved — ${result.poNumber} created`);
  };

  const handleReject = (pr: PurchaseRequest) => {
    const reason = window.prompt(`Reason for rejecting ${pr.id}:`);
    if (!reason) return;
    purchaseRequestService.reject(pr.id, currentUser?.name || currentRole, reason);
    setRequests(purchaseRequestService.getAll());
    toast.success(`${pr.id} rejected`);
  };

  const statuses: Array<"All" | PurchaseRequest["status"]> = ["All", "Pending", "PO Issued", "Rejected"];
  const visible = filter === "All" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-900">Material Requisitions</h2><p className="text-sm text-gray-500 mt-1">Raise requests for Central Store replenishment</p></div>
        {canRaise && <Button onClick={openDialog}><Plus className="w-4 h-4 mr-2" />Raise Requisition</Button>}
      </div>

      {belowReorder.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">{belowReorder.length} item{belowReorder.length !== 1 ? "s" : ""} at or below reorder level</p>
            <p className="text-xs text-orange-700">{belowReorder.map((i: any) => `${i.itemName} (${i.centralStock || 0} ${i.unit})`).join(" · ")}</p>
          </div>
          {canRaise && <Button size="sm" variant="outline" onClick={openDialog} className="shrink-0 border-orange-300 text-orange-700 hover:bg-orange-100">Raise Requisition</Button>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ["Total", requests.length, "text-gray-900"],
          ["Pending", requests.filter((r) => r.status === "Pending").length, "text-blue-700"],
          ["PO Issued", requests.filter((r) => r.status === "PO Issued").length, "text-teal-700"],
          ["Alerts", belowReorder.length, "text-orange-600"],
        ].map(([l, v, c]) => (
          <div key={l as string} className="bg-white border rounded-lg p-4 text-center"><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-xs text-gray-500 mt-1">{l}</p></div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /><CardTitle className="text-base">Requisitions</CardTitle></div>
            <div className="flex gap-1 flex-wrap">
              {statuses.map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>{s}</button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-4 text-center">No requisitions yet.</p>
          ) : (
            <div className="space-y-2">
              {visible.map((r) => (
                <div key={r.id} className="border rounded-lg px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{r.id}</p>
                      <p className="text-xs text-gray-500">{r.dateRequested} · {r.items.length} item{r.items.length !== 1 ? "s" : ""} · {r.items.reduce((s, i) => s + i.quantity, 0)} units total</p>
                      <p className="text-xs text-gray-400">{r.items.map((i) => `${i.itemName} ×${i.quantity}`).join(" · ")}</p>
                      <p className="text-xs text-gray-500">Requested by {r.requestedBy}</p>
                      {r.remarks && <p className="text-xs text-gray-400 italic">{r.remarks}</p>}
                      {r.poNumber && <p className="text-xs text-teal-600">{r.poNumber} — {r.poIssuedOn}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge className={`text-xs ${statusColor[r.status] || "bg-gray-100 text-gray-600"}`}>{r.status}</Badge>
                      {canApprove && r.status === "Pending" && (
                        <div className="flex gap-1">
                          <button onClick={() => handleApprove(r)} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5 hover:bg-green-100 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={() => handleReject(r)} className="text-xs bg-red-50 text-red-700 border border-red-200 rounded px-2 py-0.5 hover:bg-red-100 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Raise Material Requisition</DialogTitle><DialogDescription>Request stock replenishment for Central Store</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Urgency</Label>
              <Select value={form.urgency} onValueChange={(v) => setForm((f) => ({ ...f, urgency: v as Urgency }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Notes / Reason</Label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="e.g. Monthly replenishment, Stock-out alert" /></div>

            {belowReorder.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleAutoFill} className="w-full border-orange-300 text-orange-700">
                <AlertTriangle className="w-4 h-4 mr-2" /> Auto-fill {belowReorder.length} items below reorder level
              </Button>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Items *</Label>
              {form.items.length === 0 && <div className="text-center py-4 border-2 border-dashed rounded-lg text-xs text-gray-400">No items added</div>}
              {form.items.map((item) => (
                <div key={item.itemId} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2">
                  <div><p className="text-sm font-medium">{item.itemName}</p><p className="text-xs text-gray-500">Current: {item.currentStock} {item.unit} | Reorder: {item.reorderLevel} | Requesting: <strong>{item.qtyRequired}</strong></p></div>
                  <button onClick={() => setForm((f) => ({ ...f, items: f.items.filter((i) => i.itemId !== item.itemId) }))} className="text-red-400 hover:text-red-600 px-2 text-xs">✕</button>
                </div>
              ))}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Item</Label>
                  <Select value={form.newItemId} onValueChange={(v) => setForm((f) => ({ ...f, newItemId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select item…" /></SelectTrigger>
                    <SelectContent>
                      {centralItems.map((i: any) => (
                        <SelectItem key={i.itemId} value={i.itemId} disabled={!!form.items.find((f) => f.itemId === i.itemId)}>
                          {i.itemName} (Stock: {i.centralStock || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1"><Label className="text-xs">Qty</Label><Input type="number" min={1} value={form.newQty} onChange={(e) => setForm((f) => ({ ...f, newQty: parseInt(e.target.value) || 1 }))} /></div>
                <Button variant="outline" onClick={handleAddItem} disabled={!form.newItemId}><Plus className="w-4 h-4 mr-1" />Add</Button>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700">Submit for Approval</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
