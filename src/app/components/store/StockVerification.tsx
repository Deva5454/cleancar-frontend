import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { ClipboardCheck, Plus, CheckCircle, AlertTriangle, Clock, ArrowRight, FileText, TrendingDown, TrendingUp } from "lucide-react";
import { DataService } from "../../services/DataService";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
interface VerificationLine {
  itemId: string; itemName: string; unit: string;
  systemQty: number; physicalQty: number; variance: number;
  status: "Match" | "Excess" | "Short"; notes?: string;
}
interface Verification {
  verificationId: string; verificationDate: string;
  type: "Monthly" | "Spot Check" | "Annual";
  status: "In Progress" | "Completed" | "Pending Approval" | "Approved";
  lines: VerificationLine[]; conductedBy: string;
  approvedBy?: string; approvedDate?: string;
  stockAdjusted?: boolean;
  autoMRRaised?: string;
  totalVariance: number; createdAt: string; notes?: string;
}
interface StockAdjustment {
  adjustmentId: string; verificationRef: string; itemId: string; itemName: string;
  before: number; after: number; variance: number; unit: string;
  reason: string; approvedBy: string; adjustedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Read live inventory from DataService (same source as InventoryContext) */
const getLiveInventory = (): any[] => {
  try {
    const items = DataService.get<any>("INVENTORY_ITEMS");
    if (items.length > 0) return items;
    // fallback: raw localStorage
    const raw = localStorage.getItem("cleancar_CITY-SURAT_inventory_items");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

/** Write updated inventory back through DataService */
const saveLiveInventory = (items: any[]) => {
  try { DataService.setAll("INVENTORY_ITEMS", items); } catch {}
  try { localStorage.setItem("cleancar_CITY-SURAT_inventory_items", JSON.stringify(items)); } catch {}
};

/** Read current stock for all items (for pre-filling count dialog) */
const getLiveStockMap = (): Record<string, number> => {
  const items = getLiveInventory();
  const map: Record<string, number> = {};
  items.forEach((i: any) => { map[i.itemId] = i.centralStock ?? 0; });
  return map;
};

const ITEM_DEFS = [
  { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",         unit:"L",   reorderLevel:20 },
  { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", unit:"Pcs", reorderLevel:50 },
  { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",       unit:"L",   reorderLevel:15 },
  { itemId:"INV-SUR-004", itemName:"Dashboard Polish",       unit:"L",   reorderLevel:20 },
  { itemId:"INV-SUR-005", itemName:"Pressure Washer Nozzle", unit:"Pcs", reorderLevel:4  },
  { itemId:"INV-SUR-006", itemName:"Washer Uniform Set",     unit:"Pcs", reorderLevel:15 },
  { itemId:"INV-SUR-007", itemName:"Wheel Cleaner 1L",       unit:"L",   reorderLevel:12 },
  { itemId:"INV-SUR-008", itemName:"Glass Cleaner 500ml",    unit:"L",   reorderLevel:10 },
];

// ── Seed ─────────────────────────────────────────────────────────────────────
const SEED: Verification[] = [
  { verificationId:"SV-202604-001", verificationDate:"2026-04-30", type:"Monthly", status:"Approved", conductedBy:"Nilesh Chauhan", approvedBy:"Amit Desai", approvedDate:"2026-05-01", totalVariance:-3, stockAdjusted:true, createdAt:"2026-04-30T17:00:00.000Z", notes:"End of month count", lines:[
    {itemId:"INV-SUR-001",itemName:"Car Shampoo 5L",        unit:"L",  systemQty:18, physicalQty:18, variance:0,  status:"Match"},
    {itemId:"INV-SUR-002",itemName:"Microfiber Cloth Large",unit:"Pcs",systemQty:55, physicalQty:52, variance:-3, status:"Short", notes:"3 cloths found damaged and disposed"},
    {itemId:"INV-SUR-003",itemName:"Tyre Shine 500ml",      unit:"L",  systemQty:12, physicalQty:12, variance:0,  status:"Match"},
    {itemId:"INV-SUR-004",itemName:"Dashboard Polish",      unit:"L",  systemQty:3,  physicalQty:3,  variance:0,  status:"Match"},
    {itemId:"INV-SUR-005",itemName:"Pressure Washer Nozzle",unit:"Pcs",systemQty:2,  physicalQty:2,  variance:0,  status:"Match"},
    {itemId:"INV-SUR-006",itemName:"Washer Uniform Set",    unit:"Pcs",systemQty:8,  physicalQty:8,  variance:0,  status:"Match"},
    {itemId:"INV-SUR-007",itemName:"Wheel Cleaner 1L",      unit:"L",  systemQty:5,  physicalQty:5,  variance:0,  status:"Match"},
  ]},
  { verificationId:"SV-202605-001", verificationDate:"2026-05-31", type:"Monthly", status:"Approved", conductedBy:"Nilesh Chauhan", approvedBy:"Amit Desai", approvedDate:"2026-06-01", totalVariance:2, stockAdjusted:true, createdAt:"2026-05-31T17:00:00.000Z", lines:[
    {itemId:"INV-SUR-001",itemName:"Car Shampoo 5L",        unit:"L",  systemQty:45, physicalQty:47, variance:2,  status:"Excess", notes:"2L found unlabelled — added to stock"},
    {itemId:"INV-SUR-002",itemName:"Microfiber Cloth Large",unit:"Pcs",systemQty:120,physicalQty:120,variance:0,  status:"Match"},
    {itemId:"INV-SUR-003",itemName:"Tyre Shine 500ml",      unit:"L",  systemQty:30, physicalQty:30, variance:0,  status:"Match"},
    {itemId:"INV-SUR-004",itemName:"Dashboard Polish",      unit:"L",  systemQty:8,  physicalQty:8,  variance:0,  status:"Match"},
    {itemId:"INV-SUR-005",itemName:"Pressure Washer Nozzle",unit:"Pcs",systemQty:6,  physicalQty:6,  variance:0,  status:"Match"},
    {itemId:"INV-SUR-006",itemName:"Washer Uniform Set",    unit:"Pcs",systemQty:25, physicalQty:25, variance:0,  status:"Match"},
    {itemId:"INV-SUR-007",itemName:"Wheel Cleaner 1L",      unit:"L",  systemQty:18, physicalQty:18, variance:0,  status:"Match"},
    {itemId:"INV-SUR-008",itemName:"Glass Cleaner 500ml",   unit:"L",  systemQty:0,  physicalQty:0,  variance:0,  status:"Match"},
  ]},
  { verificationId:"SV-202606-001", verificationDate:"2026-06-15", type:"Spot Check", status:"Approved", conductedBy:"Nilesh Chauhan", approvedBy:"Amit Desai", approvedDate:"2026-06-16", totalVariance:0, stockAdjusted:true, createdAt:"2026-06-15T11:00:00.000Z", notes:"Spot check — pressure washers and nozzles", lines:[
    {itemId:"INV-SUR-005",itemName:"Pressure Washer Nozzle",unit:"Pcs",systemQty:6,physicalQty:6,variance:0,status:"Match"},
  ]},
];

const seedFn = () => { try { if (!localStorage.getItem("cleancar_stock_verifications")) localStorage.setItem("cleancar_stock_verifications", JSON.stringify(SEED)); } catch {} };
const loadFn = (): Verification[] => { seedFn(); try { const r = localStorage.getItem("cleancar_stock_verifications"); return r ? JSON.parse(r) : SEED; } catch { return SEED; } };
const persistFn = (d: Verification[]) => { try { localStorage.setItem("cleancar_stock_verifications", JSON.stringify(d)); } catch {} };

const loadAdjustments = (): StockAdjustment[] => { try { const r = localStorage.getItem("cleancar_stock_adjustments"); return r ? JSON.parse(r) : []; } catch { return []; } };
const persistAdjustments = (d: StockAdjustment[]) => { try { localStorage.setItem("cleancar_stock_adjustments", JSON.stringify(d)); } catch {} };

// ── Component ─────────────────────────────────────────────────────────────────
export function StockVerification() {
  const [verifications, setVerifications]   = useState<Verification[]>(loadFn);
  const [adjustments, setAdjustments]       = useState<StockAdjustment[]>(loadAdjustments);
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [approvalDialog, setApprovalDialog] = useState<Verification | null>(null);
  const [activeVerif, setActiveVerif]       = useState<string | null>(null);
  const [verType, setVerType]               = useState<"Monthly"|"Spot Check"|"Annual">("Monthly");
  const [lines, setLines]                   = useState<VerificationLine[]>([]);
  const [countNotes, setCountNotes]         = useState("");

  const startVerification = () => {
    const stockMap = getLiveStockMap();
    const initLines: VerificationLine[] = ITEM_DEFS.map(i => {
      const live = stockMap[i.itemId] ?? 0;
      return { itemId:i.itemId, itemName:i.itemName, unit:i.unit, systemQty:live, physicalQty:live, variance:0, status:"Match" as const };
    });
    setLines(initLines);
    setCountNotes("");
    setDialogOpen(true);
  };

  const updatePhysical = (itemId: string, physical: number) => {
    setLines(ls => ls.map(l => {
      if (l.itemId !== itemId) return l;
      const v = physical - l.systemQty;
      return { ...l, physicalQty: physical, variance: v, status: v===0 ? "Match" : v>0 ? "Excess" : "Short" as any };
    }));
  };

  const handleSave = (submit: boolean) => {
    const id = `SV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,"0")}-${String(Math.floor(Math.random()*900)+100).padStart(3,"0")}`;
    const totalVar = lines.reduce((s,l) => s+l.variance, 0);
    const hasVariance = lines.some(l => l.variance !== 0);
    const v: Verification = {
      verificationId: id,
      verificationDate: new Date().toISOString().split("T")[0],
      type: verType,
      // If no variances, go straight to Approved; otherwise needs approval
      status: submit ? (hasVariance ? "Pending Approval" : "Approved") : "In Progress",
      conductedBy: "Nilesh Chauhan",
      lines,
      totalVariance: totalVar,
      createdAt: new Date().toISOString(),
      notes: countNotes || undefined,
      // If no variances on completion, auto-approve and adjust (nothing to adjust)
      stockAdjusted: submit && !hasVariance,
      approvedBy: submit && !hasVariance ? "System (Auto — No Variance)" : undefined,
      approvedDate: submit && !hasVariance ? new Date().toISOString().split("T")[0] : undefined,
    };
    const updated = [v, ...verifications];
    setVerifications(updated);
    persistFn(updated);

    if (submit && hasVariance) {
      toast.success(`Verification ${id} submitted for approval`, {
        description: `${lines.filter(l=>l.variance!==0).length} variances detected — awaiting City Manager approval`,
      });
    } else if (submit) {
      toast.success(`Verification ${id} complete — no variances, auto-approved`);
    } else {
      toast.success(`Verification ${id} saved as draft`);
    }
    setDialogOpen(false);
    setLines([]);
  };

  // ── APPROVAL + STOCK ADJUSTMENT ───────────────────────────────────────────
  const handleApprove = (verif: Verification) => {
    const now = new Date();
    const approvedDate = now.toISOString().split("T")[0];
    const approvedBy = "Amit Desai (City Manager)";

    // 1. Apply stock adjustments to live inventory
    const liveItems = getLiveInventory();
    const newAdjustments: StockAdjustment[] = [];
    const belowReorderAfter: typeof ITEM_DEFS = [];

    const updatedItems = liveItems.map((item: any) => {
      const line = verif.lines.find(l => l.itemId === item.itemId);
      if (!line || line.variance === 0) return item;

      const before = item.centralStock;
      const after  = line.physicalQty; // set to physical count
      const def    = ITEM_DEFS.find(d => d.itemId === item.itemId);

      newAdjustments.push({
        adjustmentId:    `ADJ-${verif.verificationId}-${item.itemId}`,
        verificationRef: verif.verificationId,
        itemId:          item.itemId,
        itemName:        item.itemName,
        before,
        after,
        variance:        line.variance,
        unit:            item.unit,
        reason:          `Physical verification ${verif.verificationId} — ${line.status === "Short" ? "shortage" : "excess"} confirmed`,
        approvedBy,
        adjustedAt:      now.toISOString(),
      });

      // Check if adjustment causes reorder breach
      if (def && after <= def.reorderLevel) belowReorderAfter.push(def);

      return { ...item, centralStock: after, updatedAt: now.toISOString() };
    });

    saveLiveInventory(updatedItems);

    // 2. Write adjustment log
    const allAdj = [...newAdjustments, ...adjustments];
    setAdjustments(allAdj);
    persistAdjustments(allAdj);

    // 3. Auto-raise MR if items fell below reorder level
    let autoMRId: string | undefined;
    if (belowReorderAfter.length > 0) {
      const mrId = `MR-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}-AUTO-${verif.verificationId.slice(-3)}`;
      const autoMR = {
        mrId,
        mrDate:    approvedDate,
        raisedBy:  "System (Auto — Post Verification)",
        urgency:   belowReorderAfter.some(i => {
          const live = updatedItems.find((u:any) => u.itemId === i.itemId);
          return live && live.centralStock === 0;
        }) ? "Critical" : "Urgent",
        status:    "Submitted",
        notes:     `Auto-raised after verification ${verif.verificationId} — ${belowReorderAfter.length} item(s) fell below reorder level after stock adjustment`,
        createdAt: now.toISOString(),
        items: belowReorderAfter.map(i => {
          const live = updatedItems.find((u:any) => u.itemId === i.itemId);
          return { itemId:i.itemId, itemName:i.itemName, unit:i.unit, currentStock: live?.centralStock??0, reorderLevel:i.reorderLevel, qtyRequired: i.reorderLevel * 3 };
        }),
      };
      try {
        const existingMRs = JSON.parse(localStorage.getItem("cleancar_requisitions") || "[]");
        localStorage.setItem("cleancar_requisitions", JSON.stringify([autoMR, ...existingMRs]));
        autoMRId = mrId;
      } catch {}
    }

    // 4. Update verification status
    const updatedVerifs = verifications.map(v =>
      v.verificationId === verif.verificationId
        ? { ...v, status: "Approved" as const, approvedBy, approvedDate, stockAdjusted: true, autoMRRaised: autoMRId }
        : v
    );
    setVerifications(updatedVerifs);
    persistFn(updatedVerifs);
    setApprovalDialog(null);

    // 5. Show result
    const shorts  = verif.lines.filter(l => l.variance < 0);
    const excesses= verif.lines.filter(l => l.variance > 0);
    let msg = `Stock adjusted — ${newAdjustments.length} item(s) updated.`;
    if (shorts.length)   msg += ` ${shorts.length} shortage(s) corrected.`;
    if (excesses.length) msg += ` ${excesses.length} excess(es) added.`;
    if (autoMRId)        msg += ` Auto-MR ${autoMRId} raised for ${belowReorderAfter.length} items below reorder.`;

    toast.success("✅ Verification approved — stock adjusted", { description: msg });
  };

  const handleReject = (verif: Verification) => {
    const updated = verifications.map(v =>
      v.verificationId === verif.verificationId
        ? { ...v, status: "In Progress" as const, notes: (v.notes ?? "") + " [Returned for recount]" }
        : v
    );
    setVerifications(updated);
    persistFn(updated);
    setApprovalDialog(null);
    toast.error(`Verification ${verif.verificationId} returned for recount`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const statusColor: Record<string,string> = {
    "In Progress":     "bg-yellow-100 text-yellow-800",
    "Completed":       "bg-blue-100 text-blue-800",
    "Pending Approval":"bg-orange-100 text-orange-800",
    "Approved":        "bg-green-100 text-green-800",
  };
  const totalShorts = verifications.filter(v=>v.status==="Approved").reduce((s,v)=>s+v.lines.filter(l=>l.status==="Short").length,0);
  const pendingApproval = verifications.filter(v=>v.status==="Pending Approval");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-900">Stock Verification</h2><p className="text-sm text-gray-500 mt-1">Periodic physical counts — variances trigger stock adjustment + auto MR</p></div>
        <Button onClick={startVerification}><Plus className="w-4 h-4 mr-2"/>Start Verification</Button>
      </div>

      {/* Pending approval alert */}
      {pendingApproval.length > 0 && (
        <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0"/>
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900">{pendingApproval.length} verification{pendingApproval.length>1?"s":""} pending approval</p>
              <p className="text-xs text-orange-700">{pendingApproval.map(v=>`${v.verificationId} (${v.lines.filter(l=>l.variance!==0).length} variances)`).join(" · ")}</p>
              <p className="text-xs text-orange-600 mt-0.5">Approval will adjust live inventory + auto-raise MR for items below reorder</p>
            </div>
            <Button size="sm" onClick={()=>setApprovalDialog(pendingApproval[0])} className="bg-orange-600 hover:bg-orange-700 shrink-0">Review & Approve</Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[["Total Counts",verifications.length,"text-gray-900"],["Approved",verifications.filter(v=>v.status==="Approved").length,"text-green-700"],["Pending Approval",pendingApproval.length,"text-orange-600"],["Adjustments Made",adjustments.length,"text-blue-700"]].map(([l,v,c])=>(
          <div key={l as string} className="bg-white border rounded-lg p-4 text-center"><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-xs text-gray-500 mt-1">{l}</p></div>
        ))}
      </div>

      {/* Verification history */}
      <Card>
        <CardHeader><div className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-green-600"/><CardTitle className="text-base">Verification History</CardTitle></div></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {verifications.map(v=>(
              <div key={v.verificationId} className="border rounded-lg overflow-hidden">
                <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={()=>setActiveVerif(activeVerif===v.verificationId?null:v.verificationId)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{v.verificationId} <span className="text-xs font-normal text-gray-500">({v.type})</span></p>
                      <p className="text-xs text-gray-500">{v.verificationDate} · {v.conductedBy} · {v.lines.length} items</p>
                      <p className={`text-xs font-medium ${v.totalVariance===0?"text-green-600":v.totalVariance>0?"text-blue-600":"text-red-600"}`}>
                        Total variance: {v.totalVariance>0?"+":""}{v.totalVariance} units
                        {v.lines.filter(l=>l.status==="Short").length>0 && ` · ${v.lines.filter(l=>l.status==="Short").length} shorts`}
                      </p>
                      {v.approvedBy && <p className="text-xs text-green-600">Approved by {v.approvedBy} on {v.approvedDate}</p>}
                      {v.stockAdjusted && <p className="text-xs text-blue-600">✓ Stock adjusted in inventory</p>}
                      {v.autoMRRaised  && <p className="text-xs text-purple-600">✓ Auto-MR raised: {v.autoMRRaised}</p>}
                      {v.notes && <p className="text-xs text-gray-400 italic">{v.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge className={`text-xs ${statusColor[v.status]}`}>{v.status}</Badge>
                      {v.status==="Pending Approval" && (
                        <button onClick={e=>{e.stopPropagation();setApprovalDialog(v);}} className="text-xs bg-orange-50 text-orange-700 border border-orange-300 rounded px-2 py-0.5 hover:bg-orange-100">Approve</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded line detail */}
                {activeVerif===v.verificationId && (
                  <div className="border-t bg-gray-50 px-4 py-3 space-y-1">
                    <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-400 px-1 mb-1">
                      <span className="col-span-2">Item</span><span className="text-center">System → Physical</span><span className="text-right">Variance</span>
                    </div>
                    {v.lines.map(l=>(
                      <div key={l.itemId} className={`grid grid-cols-4 gap-2 items-center text-xs rounded px-2 py-1.5 ${l.status==="Short" ? "bg-red-50 border border-red-200" : l.status==="Excess" ? "bg-blue-50 border border-blue-200" : "bg-white border"}`}>
                        <div className="col-span-2"><span className="font-medium">{l.itemName}</span>{l.notes&&<span className="text-gray-400 ml-1">· {l.notes}</span>}</div>
                        <div className="text-center text-gray-600">{l.systemQty} <ArrowRight className="w-3 h-3 inline"/> {l.physicalQty} {l.unit}</div>
                        <div className={`text-right font-semibold ${l.status==="Match"?"text-gray-500":l.status==="Excess"?"text-blue-700":"text-red-700"}`}>
                          {l.variance>0?"+":""}{l.variance} {l.unit}
                          {l.status!=="Match" && <span className="ml-1 text-gray-400 font-normal">({l.status})</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Adjustment log */}
      {adjustments.length > 0 && (
        <Card>
          <CardHeader><div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600"/><CardTitle className="text-base">Stock Adjustment Log</CardTitle></div></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {adjustments.slice(0,15).map(adj=>(
                <div key={adj.adjustmentId} className={`flex items-center justify-between text-xs border rounded px-3 py-2 ${adj.variance<0?"bg-red-50 border-red-200":adj.variance>0?"bg-blue-50 border-blue-200":"bg-gray-50"}`}>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{adj.itemName}</p>
                    <p className="text-gray-400">{adj.verificationRef} · {adj.adjustedAt.split("T")[0]} · {adj.approvedBy}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-semibold">{adj.before} <ArrowRight className="w-3 h-3 inline text-gray-400"/> {adj.after} {adj.unit}</p>
                    <p className={`font-bold ${adj.variance<0?"text-red-600":"text-blue-600"}`}>{adj.variance>0?"+":""}{adj.variance}</p>
                  </div>
                </div>
              ))}
              {adjustments.length>15 && <p className="text-xs text-gray-400 text-center">{adjustments.length-15} more adjustments — check audit log</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Count Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={o=>{if(!o)setDialogOpen(false)}}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Physical Stock Count</DialogTitle>
            <DialogDescription>Enter actual quantities — system quantities pulled live from inventory. Variances will go for City Manager approval before stock is adjusted.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Verification Type</Label>
                <div className="flex gap-2">{(["Monthly","Spot Check","Annual"] as const).map(t=>(
                  <button key={t} onClick={()=>setVerType(t)} className={`text-xs px-3 py-1.5 rounded border ${verType===t?"bg-green-600 text-white border-green-600":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{t}</button>
                ))}</div>
              </div>
            </div>

            {/* Count table */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 px-2">
                <span className="col-span-5">Item</span><span className="col-span-2 text-center">System Qty</span><span className="col-span-3 text-center">Physical Count</span><span className="col-span-2 text-right">Variance</span>
              </div>
              {lines.map(l=>(
                <div key={l.itemId} className={`grid grid-cols-12 gap-2 items-center border rounded px-2 py-2 ${l.variance!==0?(l.variance>0?"bg-blue-50 border-blue-200":"bg-red-50 border-red-200"):"bg-gray-50"}`}>
                  <div className="col-span-5"><p className="text-sm font-medium">{l.itemName}</p><p className="text-xs text-gray-400">{l.unit}</p></div>
                  <p className="col-span-2 text-sm text-center text-gray-600 font-mono">{l.systemQty}</p>
                  <div className="col-span-3">
                    <Input type="number" min={0} value={l.physicalQty} onChange={e=>updatePhysical(l.itemId,parseInt(e.target.value)||0)}
                      className={`text-center font-semibold ${l.variance!==0?"border-2":""} ${l.variance<0?"border-red-400 text-red-700":l.variance>0?"border-blue-400 text-blue-700":""}`}/>
                  </div>
                  <div className={`col-span-2 text-right text-sm font-bold ${l.status==="Match"?"text-gray-400":l.status==="Excess"?"text-blue-700":"text-red-700"}`}>
                    {l.variance===0?"—":(l.variance>0?"+":"")+l.variance}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes / Remarks</Label>
              <Input value={countNotes} onChange={e=>setCountNotes(e.target.value)} placeholder="e.g. 3 cloths found torn, excluded from count"/>
            </div>

            {/* Variance summary */}
            {lines.some(l=>l.variance!==0) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-orange-900 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/>Variances detected — will be sent for City Manager approval:</p>
                {lines.filter(l=>l.variance!==0).map(l=>(
                  <div key={l.itemId} className="flex items-center justify-between text-xs">
                    <span className="text-orange-800">{l.itemName}</span>
                    <span className={`font-semibold ${l.variance<0?"text-red-700":"text-blue-700"}`}>
                      {l.variance>0?<TrendingUp className="w-3 h-3 inline mr-0.5"/>:<TrendingDown className="w-3 h-3 inline mr-0.5"/>}
                      {l.variance>0?"+":""}{l.variance} {l.unit} ({l.status})
                    </span>
                  </div>
                ))}
                <p className="text-xs text-orange-600 pt-1">Inventory will only be adjusted <strong>after City Manager approves</strong>.</p>
              </div>
            )}

            {lines.length > 0 && !lines.some(l=>l.variance!==0) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-xs text-green-800">
                <CheckCircle className="w-4 h-4 shrink-0"/>No variances — completing this will auto-approve without requiring City Manager sign-off.
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t">
              <Button variant="outline" onClick={()=>setDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button variant="outline" onClick={()=>handleSave(false)} className="flex-1">Save Draft</Button>
              <Button onClick={()=>handleSave(true)} className="flex-1 bg-green-600 hover:bg-green-700">
                {lines.some(l=>l.variance!==0) ? "Submit for Approval" : "Complete Count"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Approval Dialog ────────────────────────────────────────────────── */}
      <Dialog open={!!approvalDialog} onOpenChange={o=>{if(!o)setApprovalDialog(null)}}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve Stock Verification</DialogTitle>
            <DialogDescription>{approvalDialog?.verificationId} — {approvalDialog?.verificationDate} · Conducted by: {approvalDialog?.conductedBy}</DialogDescription>
          </DialogHeader>
          {approvalDialog && (
            <div className="space-y-4">
              {/* What will happen */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-900">On approval, the following will happen automatically:</p>
                <div className="space-y-1 text-xs text-blue-800">
                  {approvalDialog.lines.filter(l=>l.variance!==0).map(l=>(
                    <div key={l.itemId} className="flex items-center gap-2">
                      {l.variance<0 ? <TrendingDown className="w-3.5 h-3.5 text-red-600 shrink-0"/> : <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0"/>}
                      <span className="font-medium">{l.itemName}:</span>
                      <span>{l.systemQty} → {l.physicalQty} {l.unit}</span>
                      <span className={`font-semibold ${l.variance<0?"text-red-700":"text-blue-700"}`}>({l.variance>0?"+":""}{l.variance})</span>
                      <span className="text-blue-600">({l.status})</span>
                    </div>
                  ))}
                  {approvalDialog.lines.every(l=>l.variance===0) && <p>✅ No variances — stock levels unchanged</p>}
                </div>
                <div className="pt-2 border-t border-blue-200 space-y-1 text-xs text-blue-700">
                  <p className="font-medium">After adjustment, items below reorder level:</p>
                  {(() => {
                    const stockMap = getLiveStockMap();
                    const below = approvalDialog.lines
                      .filter(l => l.variance !== 0)
                      .map(l => ({ ...l, afterStock: l.physicalQty }))
                      .filter(l => {
                        const def = ITEM_DEFS.find(d=>d.itemId===l.itemId);
                        return def && l.afterStock <= def.reorderLevel;
                      });
                    if (below.length===0) return <p>✅ None — no auto-MR needed</p>;
                    return <>
                      {below.map(l=>{const def=ITEM_DEFS.find(d=>d.itemId===l.itemId)!; return <p key={l.itemId} className="text-orange-700">⚠ {l.itemName}: {l.afterStock} {l.unit} (reorder: {def.reorderLevel}) → Auto-MR will be raised</p>;})}
                    </>;
                  })()}
                </div>
              </div>

              {/* Variance lines */}
              <div className="space-y-1.5">
                {approvalDialog.lines.map(l=>(
                  <div key={l.itemId} className={`flex items-center justify-between text-xs border rounded px-3 py-2 ${l.status==="Match"?"bg-gray-50":l.status==="Excess"?"bg-blue-50 border-blue-200":"bg-red-50 border-red-200"}`}>
                    <span className="font-medium">{l.itemName}</span>
                    <span className="text-gray-500 font-mono">{l.systemQty} → {l.physicalQty} {l.unit}</span>
                    <span className={`font-bold ${l.status==="Match"?"text-gray-400":l.status==="Excess"?"text-blue-700":"text-red-700"}`}>
                      {l.variance===0?"Match":(l.variance>0?"+":"")+l.variance+" "+l.unit}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2 border-t">
                <Button variant="outline" onClick={()=>setApprovalDialog(null)} className="flex-1">Cancel</Button>
                <Button variant="outline" onClick={()=>handleReject(approvalDialog)} className="flex-1 border-red-300 text-red-700 hover:bg-red-50">Return for Recount</Button>
                <Button onClick={()=>handleApprove(approvalDialog)} className="flex-1 bg-green-600 hover:bg-green-700">✓ Approve & Adjust Stock</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
