import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { ClipboardCheck, Plus, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";

const INVENTORY_ITEMS = [
  { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",         unit:"L",   systemQty:45 },
  { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", unit:"Pcs", systemQty:120 },
  { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",       unit:"L",   systemQty:30 },
  { itemId:"INV-SUR-004", itemName:"Dashboard Polish",       unit:"L",   systemQty:8 },
  { itemId:"INV-SUR-005", itemName:"Pressure Washer Nozzle", unit:"Pcs", systemQty:6 },
  { itemId:"INV-SUR-006", itemName:"Washer Uniform Set",     unit:"Pcs", systemQty:25 },
  { itemId:"INV-SUR-007", itemName:"Wheel Cleaner 1L",       unit:"L",   systemQty:18 },
  { itemId:"INV-SUR-008", itemName:"Glass Cleaner 500ml",    unit:"L",   systemQty:0 },
];

interface VerificationLine { itemId: string; itemName: string; unit: string; systemQty: number; physicalQty: number; variance: number; status: "Match" | "Excess" | "Short"; notes?: string; }
interface Verification {
  verificationId: string; verificationDate: string; type: "Monthly" | "Spot Check" | "Annual";
  status: "In Progress" | "Completed" | "Approved";
  lines: VerificationLine[]; conductedBy: string; approvedBy?: string; approvedDate?: string;
  totalVariance: number; createdAt: string; notes?: string;
}

const SEED: Verification[] = [
  { verificationId:"SV-202604-001", verificationDate:"2026-04-30", type:"Monthly",     status:"Approved", conductedBy:"Nilesh Chauhan", approvedBy:"Amit Desai", approvedDate:"2026-05-01", totalVariance:-3, createdAt:"2026-04-30T17:00:00.000Z", notes:"End of month count", lines:[
    { itemId:"INV-SUR-001",itemName:"Car Shampoo 5L",        unit:"L",  systemQty:18,physicalQty:18,variance:0, status:"Match"},
    { itemId:"INV-SUR-002",itemName:"Microfiber Cloth Large",unit:"Pcs",systemQty:55,physicalQty:52,variance:-3,status:"Short",notes:"3 cloths found damaged and disposed"},
    { itemId:"INV-SUR-003",itemName:"Tyre Shine 500ml",      unit:"L",  systemQty:12,physicalQty:12,variance:0, status:"Match"},
    { itemId:"INV-SUR-004",itemName:"Dashboard Polish",      unit:"L",  systemQty:3, physicalQty:3, variance:0, status:"Match"},
    { itemId:"INV-SUR-005",itemName:"Pressure Washer Nozzle",unit:"Pcs",systemQty:2, physicalQty:2, variance:0, status:"Match"},
    { itemId:"INV-SUR-006",itemName:"Washer Uniform Set",    unit:"Pcs",systemQty:8, physicalQty:8, variance:0, status:"Match"},
    { itemId:"INV-SUR-007",itemName:"Wheel Cleaner 1L",      unit:"L",  systemQty:5, physicalQty:5, variance:0, status:"Match"},
  ]},
  { verificationId:"SV-202605-001", verificationDate:"2026-05-31", type:"Monthly",     status:"Approved", conductedBy:"Nilesh Chauhan", approvedBy:"Amit Desai", approvedDate:"2026-06-01", totalVariance:2, createdAt:"2026-05-31T17:00:00.000Z", lines:[
    { itemId:"INV-SUR-001",itemName:"Car Shampoo 5L",        unit:"L",  systemQty:45, physicalQty:47, variance:2, status:"Excess", notes:"2L found unlabelled — added to stock"},
    { itemId:"INV-SUR-002",itemName:"Microfiber Cloth Large",unit:"Pcs",systemQty:120,physicalQty:120,variance:0, status:"Match"},
    { itemId:"INV-SUR-003",itemName:"Tyre Shine 500ml",      unit:"L",  systemQty:30, physicalQty:30, variance:0, status:"Match"},
    { itemId:"INV-SUR-004",itemName:"Dashboard Polish",      unit:"L",  systemQty:8,  physicalQty:8,  variance:0, status:"Match"},
    { itemId:"INV-SUR-005",itemName:"Pressure Washer Nozzle",unit:"Pcs",systemQty:6,  physicalQty:6,  variance:0, status:"Match"},
    { itemId:"INV-SUR-006",itemName:"Washer Uniform Set",    unit:"Pcs",systemQty:25, physicalQty:25, variance:0, status:"Match"},
    { itemId:"INV-SUR-007",itemName:"Wheel Cleaner 1L",      unit:"L",  systemQty:18, physicalQty:18, variance:0, status:"Match"},
    { itemId:"INV-SUR-008",itemName:"Glass Cleaner 500ml",   unit:"L",  systemQty:0,  physicalQty:0,  variance:0, status:"Match"},
  ]},
  { verificationId:"SV-202606-001", verificationDate:"2026-06-15", type:"Spot Check", status:"Approved", conductedBy:"Nilesh Chauhan", approvedBy:"Amit Desai", approvedDate:"2026-06-16", totalVariance:0, createdAt:"2026-06-15T11:00:00.000Z", notes:"Spot check — pressure washers and nozzles", lines:[
    { itemId:"INV-SUR-005",itemName:"Pressure Washer Nozzle",unit:"Pcs",systemQty:6,physicalQty:6,variance:0,status:"Match"},
  ]},
];

const seed = () => { try { if (!localStorage.getItem("cleancar_stock_verifications")) localStorage.setItem("cleancar_stock_verifications", JSON.stringify(SEED)); } catch {} };
const load = (): Verification[] => { seed(); try { const r = localStorage.getItem("cleancar_stock_verifications"); return r ? JSON.parse(r) : SEED; } catch { return SEED; } };
const persist = (d: Verification[]) => { try { localStorage.setItem("cleancar_stock_verifications", JSON.stringify(d)); } catch {} };

export function StockVerification() {
  const [verifications, setVerifications] = useState<Verification[]>(load);
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [activeVerif, setActiveVerif]     = useState<Verification | null>(null);
  const [verType, setVerType]             = useState<"Monthly"|"Spot Check"|"Annual">("Monthly");
  const [lines, setLines]                 = useState<VerificationLine[]>([]);

  const startVerification = () => {
    const initLines: VerificationLine[] = INVENTORY_ITEMS.map(i => ({ itemId:i.itemId, itemName:i.itemName, unit:i.unit, systemQty:i.systemQty, physicalQty:i.systemQty, variance:0, status:"Match" as const }));
    setLines(initLines); setDialogOpen(true);
  };

  const updatePhysical = (itemId: string, physical: number) => {
    setLines(ls => ls.map(l => {
      if (l.itemId !== itemId) return l;
      const v = physical - l.systemQty;
      return { ...l, physicalQty: physical, variance: v, status: v===0?"Match":v>0?"Excess":"Short" as any };
    }));
  };

  const handleSave = (submit: boolean) => {
    const id = `SV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,"0")}-${String(Math.floor(Math.random()*900)+100).padStart(3,"0")}`;
    const totalVar = lines.reduce((s,l)=>s+l.variance,0);
    const v: Verification = { verificationId:id, verificationDate: new Date().toISOString().split("T")[0], type:verType, status: submit?"Completed":"In Progress", conductedBy:"Nilesh Chauhan", lines, totalVariance:totalVar, createdAt:new Date().toISOString() };
    const updated = [v, ...verifications]; setVerifications(updated); persist(updated);
    toast.success(`Verification ${id} ${submit?"completed":"saved"}`);
    setDialogOpen(false); setLines([]);
  };

  const statusColor: Record<string,string> = { "In Progress":"bg-yellow-100 text-yellow-800", "Completed":"bg-blue-100 text-blue-800", "Approved":"bg-green-100 text-green-800" };
  const totalShorts = verifications.filter(v=>v.status==="Approved").reduce((s,v)=>s+v.lines.filter(l=>l.status==="Short").length,0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-900">Stock Verification</h2><p className="text-sm text-gray-500 mt-1">Periodic physical counts — track variances</p></div>
        <Button onClick={startVerification}><Plus className="w-4 h-4 mr-2"/>Start Verification</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[["Total Counts",verifications.length,"text-gray-900"],["Approved",verifications.filter(v=>v.status==="Approved").length,"text-green-700"],["In Progress",verifications.filter(v=>v.status==="In Progress").length,"text-yellow-700"],["Total Shorts",totalShorts,"text-red-600"]].map(([l,v,c])=>(
          <div key={l as string} className="bg-white border rounded-lg p-4 text-center"><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-xs text-gray-500 mt-1">{l}</p></div>
        ))}
      </div>

      <Card>
        <CardHeader><div className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-green-600"/><CardTitle className="text-base">Verification History</CardTitle></div></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {verifications.map(v=>(
              <div key={v.verificationId} className="border rounded-lg px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={()=>setActiveVerif(activeVerif?.verificationId===v.verificationId?null:v)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{v.verificationId} <span className="text-xs font-normal text-gray-500">({v.type})</span></p>
                    <p className="text-xs text-gray-500">{v.verificationDate} · {v.conductedBy} · {v.lines.length} items</p>
                    <p className={`text-xs font-medium ${v.totalVariance===0?"text-green-600":v.totalVariance>0?"text-blue-600":"text-red-600"}`}>
                      Total variance: {v.totalVariance>0?"+":""}{v.totalVariance} units
                      {v.lines.filter(l=>l.status==="Short").length>0 && ` · ${v.lines.filter(l=>l.status==="Short").length} shorts`}
                    </p>
                    {v.approvedBy && <p className="text-xs text-green-600">Approved by {v.approvedBy} on {v.approvedDate}</p>}
                  </div>
                  <Badge className={`text-xs ${statusColor[v.status]}`}>{v.status}</Badge>
                </div>
                {activeVerif?.verificationId===v.verificationId && (
                  <div className="mt-3 pt-3 border-t space-y-1">
                    {v.lines.map(l=>(
                      <div key={l.itemId} className={`flex items-center justify-between text-xs rounded px-2 py-1 ${l.status==="Match"?"bg-gray-50":l.status==="Excess"?"bg-blue-50":"bg-red-50"}`}>
                        <span className="font-medium">{l.itemName}</span>
                        <span className="text-gray-500">System: {l.systemQty} | Physical: {l.physicalQty}</span>
                        <span className={`font-semibold ${l.status==="Match"?"text-gray-600":l.status==="Excess"?"text-blue-700":"text-red-700"}`}>{l.variance>0?"+":""}{l.variance} {l.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={o=>{if(!o)setDialogOpen(false)}}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Physical Stock Count</DialogTitle><DialogDescription>Enter actual physical quantities — system quantities pre-filled</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Verification Type</Label>
              <div className="flex gap-2">{(["Monthly","Spot Check","Annual"] as const).map(t=>(
                <button key={t} onClick={()=>setVerType(t)} className={`text-xs px-3 py-1.5 rounded border ${verType===t?"bg-green-600 text-white border-green-600":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{t}</button>
              ))}</div>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-500 px-2">
                <span className="col-span-2">Item</span><span className="text-center">System</span><span className="text-center">Physical Count</span>
              </div>
              {lines.map(l=>(
                <div key={l.itemId} className={`grid grid-cols-4 gap-2 items-center border rounded px-2 py-2 ${l.variance!==0?(l.variance>0?"bg-blue-50 border-blue-200":"bg-red-50 border-red-200"):"bg-gray-50"}`}>
                  <div className="col-span-2"><p className="text-sm font-medium">{l.itemName}</p><p className="text-xs text-gray-400">{l.unit}</p></div>
                  <p className="text-sm text-center text-gray-600">{l.systemQty}</p>
                  <Input type="number" min={0} value={l.physicalQty} onChange={e=>updatePhysical(l.itemId,parseInt(e.target.value)||0)} className={`text-center font-semibold ${l.variance!==0?"border-2":""} ${l.variance<0?"border-red-400":l.variance>0?"border-blue-400":""}`}/>
                </div>
              ))}
            </div>
            {lines.some(l=>l.variance!==0) && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3 text-xs text-orange-800">
                <p className="font-semibold">Variances detected:</p>
                {lines.filter(l=>l.variance!==0).map(l=><p key={l.itemId}>{l.itemName}: {l.variance>0?"+":""}{l.variance} {l.unit} ({l.status})</p>)}
              </div>
            )}
            <div className="flex gap-3 pt-2 border-t">
              <Button variant="outline" onClick={()=>setDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button variant="outline" onClick={()=>handleSave(false)} className="flex-1">Save Draft</Button>
              <Button onClick={()=>handleSave(true)} className="flex-1 bg-green-600 hover:bg-green-700">Complete Count</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
