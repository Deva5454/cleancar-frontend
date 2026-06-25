import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Camera, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface GRNItem {
  id: number;
  itemName: string;
  poQuantity: number;
  previouslyReceived: number;
  receivedThisDelivery: number;
  condition: string;
  acceptedQuantity: number;
  rejectedQuantity: number;
  storageLocation: string;
  comments?: string;
}

interface GRNCreationDialogProps {
  open: boolean;
  onClose: () => void;
  linkedPO?: any;
}

const emptyState = () => ({
  grnDate:        new Date().toISOString().split("T")[0],
  challanNumber:  "",
  vehicleNumber:  "",
  deliveryPerson: "",
  newItemName:    "",
  items:          [] as GRNItem[],
});

export function GRNCreationDialog({ open, onClose, linkedPO }: GRNCreationDialogProps) {
  const [form, setForm] = useState(emptyState);

  // Reset form every time the dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        ...emptyState(),
        items: linkedPO
          ? [
              { id: 1, itemName: "Car Wash Shampoo 5L",    poQuantity: 100, previouslyReceived: 0, receivedThisDelivery: 100, condition: "Good", acceptedQuantity: 100, rejectedQuantity: 0, storageLocation: "Main Store Shelf 1" },
              { id: 2, itemName: "Microfiber Towel Premium",poQuantity: 200, previouslyReceived: 0, receivedThisDelivery: 200, condition: "Good", acceptedQuantity: 200, rejectedQuantity: 0, storageLocation: "Main Store Shelf 2" },
            ]
          : [],
      });
    }
  }, [open]);

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleAddItem = () => {
    if (!form.newItemName.trim()) return;
    setForm(f => ({
      ...f,
      newItemName: "",
      items: [...f.items, {
        id: Date.now(),
        itemName: f.newItemName.trim(),
        poQuantity: 0, previouslyReceived: 0,
        receivedThisDelivery: 1,
        condition: "Good",
        acceptedQuantity: 1,
        rejectedQuantity: 0,
        storageLocation: "Main Store",
      }],
    }));
  };

  const updateItem = (id: number, patch: Partial<GRNItem>) =>
    setForm(f => ({ ...f, items: f.items.map(i => i.id === id ? { ...i, ...patch } : i) }));

  const removeItem = (id: number) =>
    setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));

  const handleConditionChange = (id: number, condition: string) => {
    const item = form.items.find(i => i.id === id);
    if (!item) return;
    const accepted = condition === "Good" ? item.receivedThisDelivery : Math.floor(item.receivedThisDelivery * 0.9);
    updateItem(id, { condition, acceptedQuantity: accepted, rejectedQuantity: item.receivedThisDelivery - accepted });
  };

  const handleQtyChange = (id: number, qty: number) =>
    updateItem(id, { receivedThisDelivery: qty, acceptedQuantity: qty, rejectedQuantity: 0 });

  const handleSubmit = () => {
    if (!form.challanNumber.trim()) {
      toast.error("Please enter Delivery Challan Number");
      return;
    }
    if (form.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const grnNumber = `GRN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(
      Math.floor(Math.random() * 900) + 100
    ).padStart(3, "0")}`;

    const totalAccepted = form.items.reduce((s, i) => s + i.acceptedQuantity, 0);
    const totalRejected = form.items.reduce((s, i) => s + i.rejectedQuantity, 0);

    const grnRecord = {
      grnNumber,
      grnDate:        form.grnDate,
      challanNumber:  form.challanNumber,
      vehicleNumber:  form.vehicleNumber,
      deliveryPerson: form.deliveryPerson,
      supplierName:   linkedPO?.supplierName ?? "Walk-in / Direct",
      status:         totalRejected === 0 ? "Accepted" : totalAccepted === 0 ? "Rejected" : "Partially Accepted",
      totalAccepted,
      totalRejected,
      items:          form.items,
      createdAt:      new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("cleancar_grn_records") || "[]");
      localStorage.setItem("cleancar_grn_records", JSON.stringify([grnRecord, ...existing]));
    } catch { /* quota guard */ }

    toast.success("GRN created successfully!", {
      description: `${grnNumber} — ${totalAccepted} units accepted${totalRejected > 0 ? `, ${totalRejected} rejected` : ""}.`,
    });

    onClose();
  };

  const totalAccepted = form.items.reduce((s, i) => s + i.acceptedQuantity, 0);
  const totalRejected = form.items.reduce((s, i) => s + i.rejectedQuantity, 0);

  return (
    <Dialog open={open} onOpenChange={isOpen => { if (!isOpen) onClose(); }}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Goods Receipt Note (GRN)</DialogTitle>
          <DialogDescription>
            {linkedPO ? `Linked to ${linkedPO.poNumber} — ${linkedPO.supplierName}` : "Create new GRN — enter delivery details and items received"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">

          {/* ── Header fields ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1.5">
              <Label className="text-xs">GRN Date</Label>
              <Input type="date" value={form.grnDate} onChange={e => set("grnDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Delivery Challan No. *</Label>
              <Input value={form.challanNumber} onChange={e => set("challanNumber", e.target.value)} placeholder="DC-2026-XXX" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Supplier</Label>
              <Input value={linkedPO?.supplierName ?? ""} disabled placeholder="Walk-in / Direct" className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Delivery Person</Label>
              <Input value={form.deliveryPerson} onChange={e => set("deliveryPerson", e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Vehicle Number</Label>
              <Input value={form.vehicleNumber} onChange={e => set("vehicleNumber", e.target.value)} placeholder="GJ-XX-XXXX" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Received By</Label>
              <Input value="Store Manager" disabled className="bg-white" />
            </div>
          </div>

          {/* ── Items ── */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Receipt Items</h3>

            {form.items.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed rounded-lg text-sm text-gray-400">
                No items added yet — use the field below to add items
              </div>
            )}

            {form.items.map(item => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.itemName}</p>
                    {item.poQuantity > 0 && (
                      <p className="text-xs text-gray-500">
                        PO Qty: {item.poQuantity} | Previously Received: {item.previouslyReceived}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={item.condition === "Good" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {item.condition}
                    </Badge>
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Qty Received</Label>
                    <Input
                      type="number" min={0}
                      value={item.receivedThisDelivery}
                      onChange={e => handleQtyChange(item.id, parseInt(e.target.value) || 0)}
                      className="font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Condition</Label>
                    <Select value={item.condition} onValueChange={val => handleConditionChange(item.id, val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Damaged">Damaged</SelectItem>
                        <SelectItem value="Short Expiry">Short Expiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Accepted</Label>
                    <Input type="number" value={item.acceptedQuantity} readOnly className="font-medium text-green-700 bg-green-50" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rejected</Label>
                    <Input type="number" value={item.rejectedQuantity} readOnly className="font-medium text-red-600 bg-red-50" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Storage Location</Label>
                    <Input value={item.storageLocation} onChange={e => updateItem(item.id, { storageLocation: e.target.value })} />
                  </div>
                </div>

                {/* Batch Details */}
                {item.acceptedQuantity > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-xs font-medium text-blue-900 mb-2">Batch Details</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-blue-900">Batch Number</Label>
                        <Input className="text-xs" value={`BATCH-${item.itemName.substring(0, 4).toUpperCase()}-${form.grnDate.replace(/-/g, "")}-001`} readOnly />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-blue-900">Mfg Date</Label>
                        <Input type="date" className="text-xs" defaultValue={form.grnDate} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-blue-900">Expiry Date</Label>
                        <Input type="date" className="text-xs" />
                      </div>
                    </div>
                  </div>
                )}

                <Button variant="outline" size="sm" className="w-full text-xs">
                  <Camera className="w-4 h-4 mr-2" />
                  {item.condition !== "Good" ? "Add Photos (Required)" : "Add Photos (Optional)"}
                </Button>
              </div>
            ))}

            {/* Add item row */}
            <div className="flex gap-2">
              <Input
                placeholder="Type item name and press Enter or click Add…"
                value={form.newItemName}
                onChange={e => set("newItemName", e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddItem()}
              />
              <Button variant="outline" onClick={handleAddItem} disabled={!form.newItemName.trim()}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* ── Summary ── */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">GRN Summary</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Total Items</p>
                <p className="font-bold text-xl">{form.items.length}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Units Received</p>
                <p className="font-bold text-xl">{form.items.reduce((s, i) => s + i.receivedThisDelivery, 0)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Units Accepted</p>
                <p className="font-bold text-xl text-green-700">{totalAccepted}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Units Rejected</p>
                <p className="font-bold text-xl text-red-600">{totalRejected}</p>
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Save GRN
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
