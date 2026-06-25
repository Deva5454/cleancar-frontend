import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "../ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Package, Plus, CheckCircle, Clock, Truck, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { DataService } from "../../services/DataService";

// ── Live inventory helpers ────────────────────────────────────────────────────
function getLiveItems() {
  try {
    const items = DataService.get<any>("INVENTORY_ITEMS");
    return items.length > 0 ? items : [];
  } catch { return []; }
}

function deductFromInventory(issuedItems: IssuanceItem[], issuanceId: string) {
  try {
    const liveItems = getLiveItems();
    if (!liveItems.length) return;
    const updated = liveItems.map((inv: any) => {
      const line = issuedItems.find(i => i.itemId === inv.itemId);
      if (!line) return inv;
      const newStock = Math.max(0, (inv.centralStock ?? 0) - line.quantity);
      return { ...inv, centralStock: newStock, updatedAt: new Date().toISOString() };
    });
    DataService.setAll("INVENTORY_ITEMS", updated);
    try { localStorage.setItem("cleancar_CITY-SURAT_inventory_items", JSON.stringify(updated)); } catch {}
    console.log(`[Issuance] ${issuanceId} — inventory deducted`);
  } catch (e) { console.error("[Issuance] Failed to deduct inventory:", e); }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface IssuanceItem { itemId: string; itemName: string; quantity: number; unit: string; batchNo?: string; }
interface Issuance {
  issuanceId:   string;
  issuanceDate: string;
  issuedTo:     string;
  issuedToId:   string;
  recipientType:"Supervisor" | "Car Washer";
  purpose:      string;
  items:        IssuanceItem[];
  status:       "Completed" | "Pending" | "Partial";
  issuedBy:     string;
  createdAt:    string;
  totalItems:   number;
  totalQty:     number;
}

// ── Reference data — loaded live from DataService, fallback to seed ──────────
const INVENTORY_SEED = [
  { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",         unit:"L",   centralStock:45 },
  { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", unit:"Pcs", centralStock:120 },
  { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",       unit:"L",   centralStock:30 },
  { itemId:"INV-SUR-004", itemName:"Dashboard Polish",       unit:"L",   centralStock:8  },
  { itemId:"INV-SUR-005", itemName:"Pressure Washer Nozzle", unit:"Pcs", centralStock:6  },
  { itemId:"INV-SUR-006", itemName:"Washer Uniform Set",     unit:"Pcs", centralStock:25 },
  { itemId:"INV-SUR-007", itemName:"Wheel Cleaner 1L",       unit:"L",   centralStock:18 },
];

const RECIPIENTS = [
  { id:"EDB-SUP-SUR1", name:"Harish Solanki",  type:"Supervisor" as const, pincode:"395001" },
  { id:"EDB-SUP-SUR2", name:"Bhavesh Modi",    type:"Supervisor" as const, pincode:"395007" },
  { id:"EDB-CW-SUR1A", name:"Mahesh Bharwad",  type:"Car Washer" as const, pincode:"395001" },
  { id:"EDB-CW-SUR1B", name:"Ramesh Koli",     type:"Car Washer" as const, pincode:"395001" },
  { id:"EDB-CW-SUR1C", name:"Sunil Thakor",    type:"Car Washer" as const, pincode:"395001" },
  { id:"EDB-CW-SUR2A", name:"Nilesh Chauhan",  type:"Car Washer" as const, pincode:"395007" },
  { id:"EDB-CW-SUR2C", name:"Arvind Vasava",   type:"Car Washer" as const, pincode:"395007" },
];

// ── Historic seed data (in sync with stock transactions in seedAllData.ts) ────
const HISTORIC_ISSUANCES: Issuance[] = [
  {
    issuanceId:"ISS-202605-001", issuanceDate:"2026-05-01", createdAt:"2026-05-01T08:00:00.000Z",
    issuedTo:"Harish Solanki", issuedToId:"EDB-SUP-SUR1", recipientType:"Supervisor",
    purpose:"Monthly stock replenishment — Zone 395001",
    items:[
      { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",         quantity:5,  unit:"L",   batchNo:"BATCH-CAR-20260501-001" },
      { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large",  quantity:20, unit:"Pcs", batchNo:"BATCH-MICR-20260501-001" },
      { itemId:"INV-SUR-007", itemName:"Wheel Cleaner 1L",        quantity:4,  unit:"L",   batchNo:"BATCH-WHEE-20260501-001" },
    ],
    status:"Completed", issuedBy:"Nilesh Chauhan (Store Manager)", totalItems:3, totalQty:29,
  },
  {
    issuanceId:"ISS-202605-002", issuanceDate:"2026-05-01", createdAt:"2026-05-01T08:30:00.000Z",
    issuedTo:"Bhavesh Modi", issuedToId:"EDB-SUP-SUR2", recipientType:"Supervisor",
    purpose:"Monthly stock replenishment — Zone 395007",
    items:[
      { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",         quantity:4,  unit:"L",   batchNo:"BATCH-CAR-20260501-001" },
      { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large",  quantity:15, unit:"Pcs", batchNo:"BATCH-MICR-20260501-001" },
      { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",        quantity:3,  unit:"L",   batchNo:"BATCH-TYRE-20260501-001" },
    ],
    status:"Completed", issuedBy:"Nilesh Chauhan (Store Manager)", totalItems:3, totalQty:22,
  },
  {
    issuanceId:"ISS-202605-003", issuanceDate:"2026-05-08", createdAt:"2026-05-08T09:00:00.000Z",
    issuedTo:"Mahesh Bharwad", issuedToId:"EDB-CW-SUR1A", recipientType:"Car Washer",
    purpose:"Daily consumables top-up",
    items:[
      { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", quantity:3, unit:"Pcs", batchNo:"BATCH-MICR-20260501-001" },
      { itemId:"INV-SUR-004", itemName:"Dashboard Polish",       quantity:1, unit:"L",   batchNo:"BATCH-DASH-20260508-001" },
    ],
    status:"Completed", issuedBy:"Harish Solanki (Supervisor)", totalItems:2, totalQty:4,
  },
  {
    issuanceId:"ISS-202605-004", issuanceDate:"2026-05-15", createdAt:"2026-05-15T10:00:00.000Z",
    issuedTo:"Harish Solanki", issuedToId:"EDB-SUP-SUR1", recipientType:"Supervisor",
    purpose:"Uniform distribution — new joinees",
    items:[
      { itemId:"INV-SUR-006", itemName:"Washer Uniform Set", quantity:3, unit:"Pcs", batchNo:"BATCH-WASH-20260515-001" },
    ],
    status:"Completed", issuedBy:"Nilesh Chauhan (Store Manager)", totalItems:1, totalQty:3,
  },
  {
    issuanceId:"ISS-202605-005", issuanceDate:"2026-05-22", createdAt:"2026-05-22T08:00:00.000Z",
    issuedTo:"Ramesh Koli", issuedToId:"EDB-CW-SUR1B", recipientType:"Car Washer",
    purpose:"Equipment replacement — nozzle worn",
    items:[
      { itemId:"INV-SUR-005", itemName:"Pressure Washer Nozzle", quantity:1, unit:"Pcs", batchNo:"BATCH-PRES-20260522-001" },
    ],
    status:"Completed", issuedBy:"Harish Solanki (Supervisor)", totalItems:1, totalQty:1,
  },
  {
    issuanceId:"ISS-202606-001", issuanceDate:"2026-06-01", createdAt:"2026-06-01T08:00:00.000Z",
    issuedTo:"Harish Solanki", issuedToId:"EDB-SUP-SUR1", recipientType:"Supervisor",
    purpose:"Monthly stock replenishment — Zone 395001",
    items:[
      { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",        quantity:5,  unit:"L",   batchNo:"BATCH-CAR-20260602-001" },
      { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", quantity:20, unit:"Pcs", batchNo:"BATCH-MICR-20260602-001" },
      { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",       quantity:4,  unit:"L",   batchNo:"BATCH-TYRE-20260602-001" },
      { itemId:"INV-SUR-007", itemName:"Wheel Cleaner 1L",       quantity:4,  unit:"L",   batchNo:"BATCH-WHEE-20260602-001" },
    ],
    status:"Completed", issuedBy:"Nilesh Chauhan (Store Manager)", totalItems:4, totalQty:33,
  },
  {
    issuanceId:"ISS-202606-002", issuanceDate:"2026-06-01", createdAt:"2026-06-01T08:30:00.000Z",
    issuedTo:"Bhavesh Modi", issuedToId:"EDB-SUP-SUR2", recipientType:"Supervisor",
    purpose:"Monthly stock replenishment — Zone 395007",
    items:[
      { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",        quantity:4,  unit:"L",   batchNo:"BATCH-CAR-20260602-001" },
      { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", quantity:15, unit:"Pcs", batchNo:"BATCH-MICR-20260602-001" },
    ],
    status:"Completed", issuedBy:"Nilesh Chauhan (Store Manager)", totalItems:2, totalQty:19,
  },
  {
    issuanceId:"ISS-202606-003", issuanceDate:"2026-06-10", createdAt:"2026-06-10T09:30:00.000Z",
    issuedTo:"Sunil Thakor", issuedToId:"EDB-CW-SUR1C", recipientType:"Car Washer",
    purpose:"Daily consumables top-up",
    items:[
      { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", quantity:2, unit:"Pcs", batchNo:"BATCH-MICR-20260602-001" },
      { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",       quantity:1, unit:"L",   batchNo:"BATCH-TYRE-20260602-001" },
    ],
    status:"Completed", issuedBy:"Harish Solanki (Supervisor)", totalItems:2, totalQty:3,
  },
  {
    issuanceId:"ISS-202606-004", issuanceDate:"2026-06-18", createdAt:"2026-06-18T08:00:00.000Z",
    issuedTo:"Nilesh Chauhan", issuedToId:"EDB-CW-SUR2A", recipientType:"Car Washer",
    purpose:"Equipment replacement — nozzle damaged",
    items:[
      { itemId:"INV-SUR-005", itemName:"Pressure Washer Nozzle", quantity:1, unit:"Pcs", batchNo:"BATCH-PRES-20260620-001" },
    ],
    status:"Completed", issuedBy:"Bhavesh Modi (Supervisor)", totalItems:1, totalQty:1,
  },
  {
    issuanceId:"ISS-202606-005", issuanceDate:"2026-06-24", createdAt:"2026-06-24T08:00:00.000Z",
    issuedTo:"Arvind Vasava", issuedToId:"EDB-CW-SUR2C", recipientType:"Car Washer",
    purpose:"New joiner kit",
    items:[
      { itemId:"INV-SUR-006", itemName:"Washer Uniform Set",     quantity:1, unit:"Pcs", batchNo:"BATCH-WASH-20260624-001" },
      { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", quantity:3, unit:"Pcs", batchNo:"BATCH-MICR-20260602-001" },
    ],
    status:"Completed", issuedBy:"Nilesh Chauhan (Store Manager)", totalItems:2, totalQty:4,
  },
];

// Seed once
const seedIssuances = () => {
  try {
    if (!localStorage.getItem("cleancar_issuance_records")) {
      localStorage.setItem("cleancar_issuance_records", JSON.stringify(HISTORIC_ISSUANCES));
    }
  } catch {}
};

const loadIssuances = (): Issuance[] => {
  seedIssuances();
  try {
    const raw = localStorage.getItem("cleancar_issuance_records");
    return raw ? JSON.parse(raw) : HISTORIC_ISSUANCES;
  } catch { return HISTORIC_ISSUANCES; }
};

// ── Empty form ─────────────────────────────────────────────────────────────────
const emptyForm = () => ({
  issuanceDate: new Date().toISOString().split("T")[0],
  recipientId:  "",
  purpose:      "",
  newItemId:    "",
  newQty:       1,
  items:        [] as IssuanceItem[],
});

// ── Component ─────────────────────────────────────────────────────────────────
export function StoreIssuances() {
  const [issuances, setIssuances] = useState<Issuance[]>(loadIssuances);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [filter, setFilter] = useState<"All" | "Supervisor" | "Car Washer">("All");

  // ✅ C2 FIX: Load live inventory on every dialog open so stock values are current
  const [liveInventory, setLiveInventory] = useState<any[]>([]);

  // Reset form on open + refresh live inventory
  useEffect(() => {
    if (dialogOpen) {
      setForm(emptyForm());
      const live = getLiveItems();
      setLiveInventory(live.length > 0 ? live : INVENTORY_SEED);
    }
  }, [dialogOpen]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const selectedRecipient = RECIPIENTS.find(r => r.id === form.recipientId);

  const handleAddItem = () => {
    // ✅ C2 FIX: Use liveInventory so stock values are real
    const inv = liveInventory.find((i: any) => i.itemId === form.newItemId);
    if (!inv) { toast.error("Select an item first"); return; }
    if (form.items.find(i => i.itemId === form.newItemId)) { toast.error("Item already added"); return; }
    if (form.newQty < 1) { toast.error("Quantity must be at least 1"); return; }
    if (form.newQty > (inv.centralStock ?? 0)) {
      toast.error(`Only ${inv.centralStock} ${inv.unit} in stock`);
      return;
    }
    setForm(f => ({
      ...f,
      newItemId: "",
      newQty: 1,
      items: [...f.items, {
        itemId:   inv.itemId,
        itemName: inv.itemName,
        unit:     inv.unit,
        quantity: f.newQty,
        batchNo:  `BATCH-${inv.itemName.substring(0, 4).toUpperCase()}-${f.issuanceDate.replace(/-/g, "")}-001`,
      }],
    }));
  };

  const removeItem = (itemId: string) =>
    setForm(f => ({ ...f, items: f.items.filter(i => i.itemId !== itemId) }));

  const handleSubmit = () => {
    if (!form.recipientId) { toast.error("Select a recipient"); return; }
    if (!form.purpose.trim()) { toast.error("Enter purpose"); return; }
    if (form.items.length === 0) { toast.error("Add at least one item"); return; }

    const id = `ISS-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(
      Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;

    const record: Issuance = {
      issuanceId:    id,
      issuanceDate:  form.issuanceDate,
      createdAt:     new Date().toISOString(),
      issuedTo:      selectedRecipient!.name,
      issuedToId:    form.recipientId,
      recipientType: selectedRecipient!.type,
      purpose:       form.purpose,
      items:         form.items,
      status:        "Completed",
      issuedBy:      "Nilesh Chauhan (Store Manager)",
      totalItems:    form.items.length,
      totalQty:      form.items.reduce((s, i) => s + i.quantity, 0),
    };

    try {
      const updated = [record, ...issuances];
      localStorage.setItem("cleancar_issuance_records", JSON.stringify(updated));
      setIssuances(updated);
    } catch {}

    // ✅ C2 FIX: Deduct issued quantities from live centralStock
    deductFromInventory(form.items, id);

    toast.success("Materials issued successfully!", {
      description: `${id} — ${record.totalQty} units issued to ${record.issuedTo}`,
    });
    setDialogOpen(false);
  };

  const visible = filter === "All" ? issuances : issuances.filter(i => i.recipientType === filter);
  const totalQtyIssued = issuances.reduce((s, i) => s + i.totalQty, 0);
  const supervisorCount = issuances.filter(i => i.recipientType === "Supervisor").length;
  const washerCount = issuances.filter(i => i.recipientType === "Car Washer").length;

  const statusColor: Record<string, string> = {
    Completed: "bg-green-100 text-green-800",
    Partial:   "bg-yellow-100 text-yellow-800",
    Pending:   "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Material Issuances</h2>
          <p className="text-sm text-gray-500 mt-1">Issue materials to washers and supervisors with FIFO enforcement</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Issue Materials
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{issuances.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Issuances</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{totalQtyIssued}</p>
          <p className="text-xs text-gray-500 mt-1">Units Issued</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{supervisorCount}</p>
          <p className="text-xs text-gray-500 mt-1">To Supervisors</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{washerCount}</p>
          <p className="text-xs text-gray-500 mt-1">To Car Washers</p>
        </div>
      </div>

      {/* Filter + List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base">Issuance Records</CardTitle>
            </div>
            <div className="flex gap-1">
              {(["All","Supervisor","Car Washer"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    filter === f ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No issuance records</p>
              <p className="text-xs text-gray-400 mt-1">Click <strong>Issue Materials</strong> to create one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map(iss => (
                <div key={iss.issuanceId} className="border rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        iss.recipientType === "Supervisor" ? "bg-blue-100" : "bg-orange-100"
                      }`}>
                        {iss.recipientType === "Supervisor"
                          ? <Truck className="w-4 h-4 text-blue-600" />
                          : <User  className="w-4 h-4 text-orange-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{iss.issuanceId}</p>
                        <p className="text-xs text-gray-600">{iss.issuedTo} · {iss.recipientType}</p>
                        <p className="text-xs text-gray-400">{iss.purpose}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {iss.items.map(i => `${i.itemName} ×${i.quantity}`).join(" · ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className={`text-xs ${statusColor[iss.status]}`}>
                        {iss.status === "Completed" ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {iss.status}
                      </Badge>
                      <p className="text-xs text-gray-500">{iss.issuanceDate}</p>
                      <p className="text-xs font-medium text-purple-700">{iss.totalQty} units</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Materials Dialog */}
      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Materials</DialogTitle>
            <DialogDescription>Issue stock to a supervisor or car washer — FIFO batch allocation applied</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">

            {/* Recipient + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Issue Date</Label>
                <Input type="date" value={form.issuanceDate} onChange={e => set("issuanceDate", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Issue To *</Label>
                <Select value={form.recipientId} onValueChange={v => set("recipientId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select recipient…" /></SelectTrigger>
                  <SelectContent>
                    <p className="text-xs text-gray-400 px-2 py-1 font-medium">Supervisors</p>
                    {RECIPIENTS.filter(r => r.type === "Supervisor").map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name} — Zone {r.pincode}</SelectItem>
                    ))}
                    <p className="text-xs text-gray-400 px-2 py-1 font-medium mt-1">Car Washers</p>
                    {RECIPIENTS.filter(r => r.type === "Car Washer").map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name} — Zone {r.pincode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-1.5">
              <Label className="text-xs">Purpose / Reason *</Label>
              <Input
                value={form.purpose}
                onChange={e => set("purpose", e.target.value)}
                placeholder="e.g. Monthly replenishment, Equipment replacement, New joiner kit"
              />
            </div>

            {/* Add items */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-gray-700">Items to Issue *</Label>

              {form.items.length === 0 && (
                <div className="text-center py-4 border-2 border-dashed rounded-lg text-xs text-gray-400">
                  No items added — select an item below and click Add
                </div>
              )}

              {form.items.map(item => (
                <div key={item.itemId} className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
                    <p className="text-xs text-gray-500">{item.batchNo} · Qty: <strong>{item.quantity} {item.unit}</strong></p>
                  </div>
                  <button onClick={() => removeItem(item.itemId)} className="text-red-400 hover:text-red-600 text-xs px-2">✕</button>
                </div>
              ))}

              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Item</Label>
                  <Select value={form.newItemId} onValueChange={v => set("newItemId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select item…" /></SelectTrigger>
                    <SelectContent>
                      {liveInventory.map((i: any) => (
                        <SelectItem key={i.itemId} value={i.itemId} disabled={!!form.items.find(f => f.itemId === i.itemId) || (i.centralStock ?? 0) === 0}>
                          {i.itemName} (Stock: {i.centralStock ?? 0} {i.unit}){(i.centralStock ?? 0) === 0 ? " — Out of Stock" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min={1} value={form.newQty} onChange={e => set("newQty", parseInt(e.target.value) || 1)} />
                </div>
                <Button variant="outline" onClick={handleAddItem} disabled={!form.newItemId}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Summary */}
            {form.items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between text-sm">
                <span className="text-gray-600">{form.items.length} item{form.items.length !== 1 ? "s" : ""}</span>
                <span className="font-semibold text-purple-700">
                  Total: {form.items.reduce((s, i) => s + i.quantity, 0)} units
                </span>
              </div>
            )}

            {/* FIFO note */}
            <div className="flex gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>FIFO batch allocation applied automatically — oldest batch used first. Batch numbers are pre-filled based on receipt date.</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t pt-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-purple-600 hover:bg-purple-700">
                ✓ Confirm Issuance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
