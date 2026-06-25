import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Plus, TrendingDown, CheckCircle, Truck, Camera, Trash2,
  Package, FileText, AlertTriangle, IndianRupee,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReturnItem {
  name: string; qty: number; unit: string;
  reason: string; condition: string; unitValue: number;
}
interface ReturnRecord {
  returnNumber: string; grnNumber: string; supplier: string;
  items: number; itemsList?: ReturnItem[];
  reason: string; status: string; date: string; amount: number;
  supplierAddress?: string; debitNoteNumber?: string;
  pickupArrangement?: string; freightBearing?: string;
  description?: string; internalNotes?: string;
}

// ── Seed data with full detail ─────────────────────────────────────────────────
const INITIAL_RETURNS: ReturnRecord[] = [
  {
    returnNumber: "RET-2026-003", grnNumber: "GRN-2026-012",
    supplier: "ChemClean Industries", items: 2,
    reason: "Damaged in Transit", status: "Pending Pickup", date: "Mar 17, 2026", amount: 8500,
    supplierAddress: "Plot 45, GIDC Industrial Estate, Surat - 395010",
    pickupArrangement: "Supplier Arranges Pickup", freightBearing: "Supplier Bears Cost",
    description: "2 boxes of Car Wash Shampoo 5L received with broken seals. Packaging crushed. Product has leaked partially. Unusable.",
    itemsList: [
      { name:"Car Wash Shampoo 5L",    qty:10, unit:"L",   reason:"Damaged in Transit", condition:"Crushed packaging, product leaked",       unitValue:450 },
      { name:"Foam Gun Professional",  qty:1,  unit:"Pcs", reason:"Damaged in Transit", condition:"Nozzle snapped, unusable",                unitValue:2800 },
    ],
  },
  {
    returnNumber: "RET-2026-002", grnNumber: "GRN-2026-010",
    supplier: "ChemClean Industries", items: 1,
    reason: "Wrong Item Delivered", status: "Picked Up", date: "Mar 15, 2026", amount: 12000,
    supplierAddress: "Plot 45, GIDC Industrial Estate, Surat - 395010",
    pickupArrangement: "Supplier Arranges Pickup", freightBearing: "Supplier Bears Cost",
    description: "PO was for 'Interior Cleaner 5L (pH neutral)' but supplier sent 'Engine Degreaser 5L'. Completely wrong product. Returned in original sealed condition.",
    itemsList: [
      { name:"Engine Degreaser 5L (wrong item)", qty:20, unit:"L", reason:"Wrong Item Delivered", condition:"Sealed, unopened, not our requirement", unitValue:600 },
    ],
  },
  {
    returnNumber: "RET-2026-001", grnNumber: "GRN-2026-008",
    supplier: "AutoCare Solutions", items: 3,
    reason: "Quality Issue", status: "Debit Note Issued", date: "Mar 12, 2026", amount: 15000,
    supplierAddress: "Unit 12, Industrial Park, Pune - 411001",
    debitNoteNumber: "DN-2026-0045",
    pickupArrangement: "Supplier Arranges Pickup", freightBearing: "Supplier Bears Cost",
    description: "Microfiber towels supplied are below specified 300 GSM. Lab test shows 220 GSM only. Quality report attached. Supplier acknowledged defect.",
    itemsList: [
      { name:"Microfiber Towel Premium (sub-standard)", qty:150, unit:"Pcs", reason:"Quality Issue", condition:"Below spec GSM — lab tested at 220 GSM vs required 300", unitValue:100 },
    ],
  },
];

// ── Create Return form items ────────────────────────────────────────────────────
const EMPTY_ITEM = () => ({ id: Date.now(), itemName:"", receivedQty:0, returnQty:0, reason:"", condition:"" });

export function PurchaseReturns() {
  const [returns, setReturns]               = useState<ReturnRecord[]>(INITIAL_RETURNS);
  const [viewReturn, setViewReturn]         = useState<ReturnRecord | null>(null);
  const [dnReturn, setDnReturn]             = useState<ReturnRecord | null>(null);
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  // Create return form
  const [selectedGRN, setSelectedGRN]       = useState("");
  const [returnItems, setReturnItems]       = useState([EMPTY_ITEM()]);

  // Debit note form
  const [dnAmount, setDnAmount]             = useState("");
  const [dnNotes, setDnNotes]               = useState("");

  const recentGRNs = [
    { grnNumber:"GRN-2026-012", supplier:"ChemClean Industries", date:"Mar 17, 2026", items:5 },
    { grnNumber:"GRN-2026-011", supplier:"ProWash Equipment",    date:"Mar 15, 2026", items:2 },
    { grnNumber:"GRN-2026-010", supplier:"ChemClean Industries", date:"Mar 14, 2026", items:7 },
  ];

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleIssueDebitNote = (ret: ReturnRecord) => {
    if (!dnAmount || isNaN(Number(dnAmount))) { toast.error("Enter a valid debit note amount"); return; }
    const dnNumber = `DN-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
    const updated = returns.map(r =>
      r.returnNumber === ret.returnNumber
        ? { ...r, status:"Debit Note Issued", debitNoteNumber:dnNumber }
        : r
    );
    setReturns(updated);
    // Persist to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem("cleancar_purchase_returns") || "[]");
      const merged = existing.map((e: any) => e.returnId === ret.returnNumber ? { ...e, status:"Credit Note Received", creditNoteNo:dnNumber } : e);
      localStorage.setItem("cleancar_purchase_returns", JSON.stringify(merged));
    } catch {}
    toast.success(`Debit Note ${dnNumber} issued for ₹${Number(dnAmount).toLocaleString()}`, {
      description: `${ret.supplier} will be notified. Amount will be deducted from next invoice.`,
    });
    setDnReturn(null);
    setDnAmount("");
    setDnNotes("");
  };

  const handleSubmitReturn = () => {
    if (!selectedGRN) { toast.error("Select a GRN"); return; }
    if (!returnItems[0].itemName) { toast.error("Add at least one item"); return; }
    const retNum = `RET-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100).padStart(3,"0")}`;
    const grn = recentGRNs.find(g => g.grnNumber === selectedGRN);
    const newRet: ReturnRecord = {
      returnNumber: retNum, grnNumber: selectedGRN,
      supplier: grn?.supplier ?? "Unknown",
      items: returnItems.filter(i => i.itemName).length,
      reason: returnItems[0].reason || "Quality Issue",
      status: "Pending Pickup",
      date: new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }),
      amount: returnItems.reduce((s, i) => s + (i.returnQty * 500), 0), // approximate
      itemsList: returnItems.filter(i => i.itemName).map(i => ({
        name:i.itemName, qty:i.returnQty, unit:"Pcs",
        reason:i.reason, condition:i.condition, unitValue:500,
      })),
    };
    setReturns([newRet, ...returns]);
    try {
      const existing = JSON.parse(localStorage.getItem("cleancar_purchase_returns") || "[]");
      existing.unshift({ returnId:retNum, supplier:grn?.supplier, grnRef:selectedGRN, status:"Pending Dispatch", totalQty:newRet.items, createdAt:new Date().toISOString() });
      localStorage.setItem("cleancar_purchase_returns", JSON.stringify(existing));
    } catch {}
    toast.success(`Return ${retNum} created — supplier notified`);
    setShowReturnDialog(false);
    setSelectedGRN("");
    setReturnItems([EMPTY_ITEM()]);
  };

  // Stats
  const pending    = returns.filter(r => r.status === "Pending Pickup").length;
  const pickedUp   = returns.filter(r => r.status === "Picked Up").length;
  const dnIssued   = returns.filter(r => r.status === "Debit Note Issued").length;
  const totalVal   = returns.reduce((s, r) => s + r.amount, 0);

  const statusVariant = (s: string): "destructive"|"default"|"outline"|"secondary" =>
    s === "Pending Pickup"     ? "destructive" :
    s === "Picked Up"          ? "default" :
    s === "Debit Note Issued"  ? "outline" : "secondary";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Purchase Returns</h2>
          <p className="text-sm text-gray-500 mt-1">Handle rejected or defective items returned to suppliers with debit notes</p>
        </div>
        <Button onClick={() => setShowReturnDialog(true)}>
          <Plus className="w-4 h-4 mr-2"/>Create Return
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{pending}</p><p className="text-xs text-gray-500">Pending Pickup</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{pickedUp}</p><p className="text-xs text-gray-500">Picked Up</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{dnIssued}</p><p className="text-xs text-gray-500">Debit Note Issued</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">₹{(totalVal/1000).toFixed(1)}K</p><p className="text-xs text-gray-500">Total Value</p></CardContent></Card>
      </div>

      {/* Returns list */}
      <Card>
        <CardHeader><CardTitle className="text-base">Active Returns</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {returns.map(ret => (
              <div key={ret.returnNumber} className={`flex items-center justify-between p-4 border rounded-lg ${ret.status === "Pending Pickup" ? "border-orange-200 bg-orange-50" : ret.status === "Debit Note Issued" ? "border-green-200" : ""}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <TrendingDown className="w-5 h-5 text-red-600 shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{ret.returnNumber}</p>
                      <Badge variant={statusVariant(ret.status)}>{ret.status}</Badge>
                      {ret.debitNoteNumber && <Badge variant="outline" className="text-green-700 border-green-400">{ret.debitNoteNumber}</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 flex-wrap">
                      <span>{ret.supplier}</span><span>·</span>
                      <span>GRN: {ret.grnNumber}</span><span>·</span>
                      <span>{ret.items} item{ret.items !== 1 ? "s" : ""}</span><span>·</span>
                      <span>{ret.date}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Reason: {ret.reason}</p>
                  </div>
                  <p className="font-bold text-lg text-red-600 mr-4 shrink-0">₹{ret.amount.toLocaleString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {ret.status === "Picked Up" && (
                    <Button size="sm" onClick={() => { setDnReturn(ret); setDnAmount(String(ret.amount)); setDnNotes(""); }}>
                      <CheckCircle className="w-4 h-4 mr-1"/>Issue DN
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setViewReturn(ret)}>View</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── VIEW RETURN DIALOG ───────────────────────────────────────────────── */}
      <Dialog open={!!viewReturn} onOpenChange={o => { if (!o) setViewReturn(null); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Return Details — {viewReturn?.returnNumber}</DialogTitle>
            <DialogDescription>{viewReturn?.supplier} · GRN: {viewReturn?.grnNumber} · {viewReturn?.date}</DialogDescription>
          </DialogHeader>
          {viewReturn && (
            <div className="space-y-5">
              {/* Header info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
                <div><p className="text-xs text-gray-400">Supplier</p><p className="font-medium">{viewReturn.supplier}</p>{viewReturn.supplierAddress && <p className="text-xs text-gray-400 mt-0.5">{viewReturn.supplierAddress}</p>}</div>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-xs text-gray-400">Status</span><Badge variant={statusVariant(viewReturn.status)}>{viewReturn.status}</Badge></div>
                  <div className="flex justify-between"><span className="text-xs text-gray-400">Primary Reason</span><span className="text-xs font-medium">{viewReturn.reason}</span></div>
                  {viewReturn.debitNoteNumber && <div className="flex justify-between"><span className="text-xs text-gray-400">Debit Note</span><span className="text-xs font-medium text-green-700">{viewReturn.debitNoteNumber}</span></div>}
                  {viewReturn.pickupArrangement && <div className="flex justify-between"><span className="text-xs text-gray-400">Pickup</span><span className="text-xs">{viewReturn.pickupArrangement}</span></div>}
                </div>
              </div>

              {/* Items */}
              {viewReturn.itemsList && viewReturn.itemsList.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Return Items</p>
                  <div className="space-y-2">
                    {viewReturn.itemsList.map((item, i) => (
                      <div key={i} className="border rounded-lg p-3 bg-red-50 border-red-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-red-600 shrink-0"/>
                              <p className="font-medium text-sm">{item.name}</p>
                            </div>
                            <div className="mt-1 flex gap-4 text-xs text-gray-600">
                              <span>Qty: <strong>{item.qty} {item.unit}</strong></span>
                              <span>·</span>
                              <span>Unit Value: ₹{item.unitValue}</span>
                              <span>·</span>
                              <span className="text-red-700">Reason: {item.reason}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 italic">{item.condition}</p>
                          </div>
                          <p className="font-bold text-red-700 text-sm shrink-0 ml-3">₹{(item.qty * item.unitValue).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {viewReturn.description && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-yellow-900 mb-1">Issue Description</p>
                  <p className="text-sm text-yellow-800">{viewReturn.description}</p>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-gray-500"/><span className="text-sm font-medium text-gray-700">Total Return Value</span></div>
                <p className="text-xl font-bold text-red-700">₹{viewReturn.amount.toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewReturn(null)}>Close</Button>
            {viewReturn?.status === "Picked Up" && (
              <Button onClick={() => { setDnReturn(viewReturn); setDnAmount(String(viewReturn.amount)); setDnNotes(""); setViewReturn(null); }}>
                <CheckCircle className="w-4 h-4 mr-2"/>Issue Debit Note
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ISSUE DEBIT NOTE DIALOG ──────────────────────────────────────────── */}
      <Dialog open={!!dnReturn} onOpenChange={o => { if (!o) { setDnReturn(null); setDnAmount(""); setDnNotes(""); } }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue Debit Note — {dnReturn?.returnNumber}</DialogTitle>
            <DialogDescription>{dnReturn?.supplier} · Reason: {dnReturn?.reason}</DialogDescription>
          </DialogHeader>
          {dnReturn && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="text-xs font-semibold text-blue-900 mb-2">Return Summary</p>
                <div className="space-y-1 text-xs text-blue-800">
                  <div className="flex justify-between"><span>GRN Reference</span><span className="font-medium">{dnReturn.grnNumber}</span></div>
                  <div className="flex justify-between"><span>Items Returned</span><span className="font-medium">{dnReturn.items}</span></div>
                  <div className="flex justify-between"><span>Return Value</span><span className="font-bold">₹{dnReturn.amount.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Pickup Status</span><span className="font-medium text-green-700">✓ Goods Picked Up by Supplier</span></div>
                </div>
              </div>

              {/* DN amount */}
              <div className="space-y-2">
                <Label>Debit Note Amount (₹) *</Label>
                <Input
                  type="number" value={dnAmount} onChange={e => setDnAmount(e.target.value)}
                  placeholder="Enter amount to debit from supplier"
                />
                <p className="text-xs text-gray-400">This amount will be deducted from the next invoice payment to {dnReturn.supplier}</p>
              </div>

              {/* Payment treatment */}
              <div className="space-y-2">
                <Label>Payment Treatment</Label>
                <Select defaultValue="deduct-next">
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deduct-next">Deduct from Next Invoice</SelectItem>
                    <SelectItem value="direct-credit">Request Direct Credit Transfer</SelectItem>
                    <SelectItem value="replacement">Request Replacement Goods</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Debit Note Notes</Label>
                <Textarea value={dnNotes} onChange={e => setDnNotes(e.target.value)} rows={2}
                  placeholder="Additional notes for the debit note (optional)…"/>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 border rounded-lg p-3 space-y-1 text-xs text-gray-600">
                <p className="font-semibold text-gray-800">Debit Note Preview</p>
                <div className="flex justify-between"><span>Supplier</span><span>{dnReturn.supplier}</span></div>
                <div className="flex justify-between"><span>Reference</span><span>{dnReturn.returnNumber}</span></div>
                <div className="flex justify-between font-semibold text-gray-800"><span>Amount</span><span>₹{Number(dnAmount || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Date</span><span>{new Date().toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})}</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDnReturn(null); setDnAmount(""); setDnNotes(""); }}>Cancel</Button>
            <Button onClick={() => dnReturn && handleIssueDebitNote(dnReturn)} className="bg-green-600 hover:bg-green-700"
              disabled={!dnAmount || isNaN(Number(dnAmount)) || Number(dnAmount) <= 0}>
              <CheckCircle className="w-4 h-4 mr-2"/>Issue Debit Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CREATE RETURN DIALOG (existing, now with save) ──────────────────── */}
      <Dialog open={showReturnDialog} onOpenChange={o => { if (!o) setShowReturnDialog(false); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Return</DialogTitle>
            <DialogDescription>Create return documentation for rejected or defective items</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label className="text-xs">Select GRN *</Label>
                <Select value={selectedGRN} onValueChange={setSelectedGRN}>
                  <SelectTrigger><SelectValue placeholder="Select GRN…"/></SelectTrigger>
                  <SelectContent>{recentGRNs.map(g => <SelectItem key={g.grnNumber} value={g.grnNumber}>{g.grnNumber} — {g.supplier}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Return Date *</Label><Input type="date" defaultValue={new Date().toISOString().split("T")[0]}/></div>
              <div className="space-y-1.5"><Label className="text-xs">Primary Reason *</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select reason"/></SelectTrigger><SelectContent>
                  <SelectItem value="damaged">Damaged in Transit</SelectItem>
                  <SelectItem value="defective">Defective Items</SelectItem>
                  <SelectItem value="wrong">Wrong Item Delivered</SelectItem>
                  <SelectItem value="quality">Quality Issue</SelectItem>
                  <SelectItem value="expired">Expired/Near Expiry</SelectItem>
                </SelectContent></Select>
              </div>
            </div>

            {/* Items table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Items to Return</p>
                <Button size="sm" variant="outline" onClick={() => setReturnItems([...returnItems, EMPTY_ITEM()])}><Plus className="w-3.5 h-3.5 mr-1"/>Add Item</Button>
              </div>
              <div className="space-y-2">
                {returnItems.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-start border rounded-lg p-3 bg-gray-50">
                    <div className="col-span-3 space-y-1"><Label className="text-xs">Item</Label><Input value={item.itemName} onChange={e => setReturnItems(r => r.map(i => i.id===item.id?{...i,itemName:e.target.value}:i))} placeholder="Item name" className="h-8 text-sm"/></div>
                    <div className="col-span-1 space-y-1"><Label className="text-xs">Rcvd</Label><Input type="number" value={item.receivedQty||""} onChange={e => setReturnItems(r => r.map(i => i.id===item.id?{...i,receivedQty:+e.target.value||0}:i))} className="h-8 text-sm"/></div>
                    <div className="col-span-1 space-y-1"><Label className="text-xs">Return</Label><Input type="number" value={item.returnQty||""} onChange={e => setReturnItems(r => r.map(i => i.id===item.id?{...i,returnQty:+e.target.value||0}:i))} className="h-8 text-sm"/></div>
                    <div className="col-span-3 space-y-1"><Label className="text-xs">Reason</Label>
                      <Select value={item.reason} onValueChange={v => setReturnItems(r => r.map(i => i.id===item.id?{...i,reason:v}:i))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select"/></SelectTrigger>
                        <SelectContent><SelectItem value="damaged">Damaged</SelectItem><SelectItem value="defective">Defective</SelectItem><SelectItem value="wrong">Wrong Item</SelectItem><SelectItem value="quality">Quality Issue</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 space-y-1"><Label className="text-xs">Condition</Label><Input value={item.condition} onChange={e => setReturnItems(r => r.map(i => i.id===item.id?{...i,condition:e.target.value}:i))} placeholder="Physical condition" className="h-8 text-sm"/></div>
                    <div className="col-span-1 flex items-end pb-0.5">{returnItems.length > 1 && <Button size="sm" variant="ghost" onClick={() => setReturnItems(r => r.filter(i => i.id!==item.id))} className="h-8 w-8 p-0"><Trash2 className="w-4 h-4 text-red-500"/></Button>}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5"><Label className="text-xs">Issue Description *</Label><Textarea rows={2} placeholder="Describe the defect, damage or issue in detail…"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitReturn}><CheckCircle className="w-4 h-4 mr-2"/>Create Return & Notify Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
