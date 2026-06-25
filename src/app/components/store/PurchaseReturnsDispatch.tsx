import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { TrendingDown, Plus, Truck, CheckCircle, Clock, Package } from "lucide-react";
import { toast } from "sonner";

interface ReturnItem { itemName: string; qty: number; unit: string; reason: string; }
interface PurchaseReturn {
  returnId: string; returnDate: string; supplier: string; grnRef: string;
  status: "Pending Dispatch" | "Dispatched" | "Acknowledged" | "Credit Note Received";
  items: ReturnItem[]; totalQty: number;
  dispatchDate?: string; trackingNo?: string; creditNoteNo?: string;
  raisedBy: string; notes?: string; createdAt: string;
}

const SEED: PurchaseReturn[] = [
  { returnId:"PR-202605-001", returnDate:"2026-05-12", supplier:"3M India Ltd",    grnRef:"GRN-202605-002", status:"Credit Note Received", items:[{itemName:"Wax Applicator Pads",qty:20,unit:"Pcs",reason:"Damaged on delivery — torn edges"}], totalQty:20, dispatchDate:"2026-05-14", trackingNo:"DTDC-789012", creditNoteNo:"CN-3M-2026-045", raisedBy:"Nilesh Chauhan", createdAt:"2026-05-12T10:00:00.000Z" },
  { returnId:"PR-202606-001", returnDate:"2026-06-21", supplier:"Bosch India",     grnRef:"GRN-202606-003", status:"Dispatched",           items:[{itemName:"Foam Cannon Attachment",qty:2,unit:"Pcs",reason:"Seal cracked — manufacturing defect"}], totalQty:2,  dispatchDate:"2026-06-23", trackingNo:"BLUEDART-445566", raisedBy:"Nilesh Chauhan", createdAt:"2026-06-21T09:00:00.000Z" },
  { returnId:"PR-202606-002", returnDate:"2026-06-24", supplier:"Pidilite Industries", grnRef:"GRN-202605-003", status:"Pending Dispatch", items:[{itemName:"Dashboard Polish 250ml",qty:5,unit:"Pcs",reason:"Short expiry — expires within 30 days"}], totalQty:5, raisedBy:"Nilesh Chauhan", createdAt:"2026-06-24T11:00:00.000Z", notes:"Supplier agreed to replace with fresh stock" },
];

const seed = () => { try { if (!localStorage.getItem("cleancar_purchase_returns")) localStorage.setItem("cleancar_purchase_returns", JSON.stringify(SEED)); } catch {} };
const load = (): PurchaseReturn[] => { seed(); try { const r = localStorage.getItem("cleancar_purchase_returns"); return r ? JSON.parse(r) : SEED; } catch { return SEED; } };
const persist = (d: PurchaseReturn[]) => { try { localStorage.setItem("cleancar_purchase_returns", JSON.stringify(d)); } catch {} };

const emptyForm = () => ({ returnDate: new Date().toISOString().split("T")[0], supplier:"", grnRef:"", notes:"", items:[] as ReturnItem[], newItem:"", newQty:1, newUnit:"Pcs", newReason:"" });

export function PurchaseReturnsDispatch() {
  const [returns, setReturns] = useState<PurchaseReturn[]>(load);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dispatchDialog, setDispatchDialog] = useState<PurchaseReturn | null>(null);
  const [trackingNo, setTrackingNo] = useState("");
  const [form, setForm] = useState(emptyForm());

  useEffect(() => { if (dialogOpen) setForm(emptyForm()); }, [dialogOpen]);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleAddItem = () => {
    if (!form.newItem || !form.newReason) { toast.error("Fill item name and reason"); return; }
    setForm(f => ({ ...f, newItem:"", newQty:1, newReason:"", items:[...f.items,{itemName:f.newItem,qty:f.newQty,unit:f.newUnit,reason:f.newReason}] }));
  };

  const handleSubmit = () => {
    if (!form.supplier || !form.grnRef || form.items.length===0) { toast.error("Fill supplier, GRN ref and add items"); return; }
    const id = `PR-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,"0")}-${String(Math.floor(Math.random()*900)+100).padStart(3,"0")}`;
    const rec: PurchaseReturn = { returnId:id, returnDate:form.returnDate, supplier:form.supplier, grnRef:form.grnRef, status:"Pending Dispatch", items:form.items, totalQty:form.items.reduce((s,i)=>s+i.qty,0), raisedBy:"Nilesh Chauhan", notes:form.notes, createdAt:new Date().toISOString() };
    const updated = [rec, ...returns]; setReturns(updated); persist(updated);
    toast.success(`Return ${id} raised`); setDialogOpen(false);
  };

  const handleDispatch = (pr: PurchaseReturn) => {
    if (!trackingNo.trim()) { toast.error("Enter tracking number"); return; }
    const updated = returns.map(r => r.returnId===pr.returnId ? {...r, status:"Dispatched" as const, dispatchDate: new Date().toISOString().split("T")[0], trackingNo} : r);
    setReturns(updated); persist(updated);
    toast.success(`Return dispatched — Tracking: ${trackingNo}`);
    setDispatchDialog(null); setTrackingNo("");
  };

  const handleAcknowledge = (pr: PurchaseReturn) => {
    const updated = returns.map(r => r.returnId===pr.returnId ? {...r, status:"Acknowledged" as const} : r);
    setReturns(updated); persist(updated);
    toast.success("Return acknowledged by supplier");
  };

  const statusColor: Record<string,string> = { "Pending Dispatch":"bg-orange-100 text-orange-800", "Dispatched":"bg-blue-100 text-blue-800", "Acknowledged":"bg-purple-100 text-purple-800", "Credit Note Received":"bg-green-100 text-green-800" };
  const pending = returns.filter(r=>r.status==="Pending Dispatch");
  const dispatched = returns.filter(r=>r.status==="Dispatched");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-900">Purchase Returns Dispatch</h2><p className="text-sm text-gray-500 mt-1">Physical dispatch of goods being returned to suppliers</p></div>
        <Button onClick={()=>setDialogOpen(true)}><Plus className="w-4 h-4 mr-2"/>Raise Return</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[["Total",returns.length,"text-gray-900"],["Pending",pending.length,"text-orange-600"],["Dispatched",dispatched.length,"text-blue-700"],["Completed",returns.filter(r=>r.status==="Credit Note Received").length,"text-green-700"]].map(([l,v,c])=>(
          <div key={l as string} className="bg-white border rounded-lg p-4 text-center"><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-xs text-gray-500 mt-1">{l}</p></div>
        ))}
      </div>

      <Card>
        <CardHeader><div className="flex items-center gap-2"><TrendingDown className="w-5 h-5 text-orange-600"/><CardTitle className="text-base">Returns Pending Dispatch</CardTitle></div></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {returns.map(pr=>(
              <div key={pr.returnId} className="border rounded-lg px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{pr.returnId}</p>
                    <p className="text-xs text-gray-600">{pr.supplier} · GRN: {pr.grnRef} · {pr.returnDate}</p>
                    <p className="text-xs text-gray-400">{pr.items.map(i=>`${i.itemName} ×${i.qty} (${i.reason})`).join(" · ")}</p>
                    {pr.dispatchDate && <p className="text-xs text-blue-600">Dispatched: {pr.dispatchDate} · {pr.trackingNo}</p>}
                    {pr.creditNoteNo && <p className="text-xs text-green-600">Credit Note: {pr.creditNoteNo}</p>}
                    {pr.notes && <p className="text-xs text-gray-400 italic">{pr.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge className={`text-xs ${statusColor[pr.status]}`}>{pr.status}</Badge>
                    <div className="flex gap-1">
                      {pr.status==="Pending Dispatch" && <button onClick={()=>{setDispatchDialog(pr);setTrackingNo("");}} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-100">Dispatch</button>}
                      {pr.status==="Dispatched"       && <button onClick={()=>handleAcknowledge(pr)} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-0.5 hover:bg-purple-100">Mark Acknowledged</button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Raise Return Dialog */}
      <Dialog open={dialogOpen} onOpenChange={o=>{if(!o)setDialogOpen(false)}}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Raise Purchase Return</DialogTitle><DialogDescription>Initiate return of goods to supplier</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Return Date</Label><Input type="date" value={form.returnDate} onChange={e=>set("returnDate",e.target.value)}/></div>
              <div className="space-y-1.5"><Label className="text-xs">GRN Reference *</Label><Input value={form.grnRef} onChange={e=>set("grnRef",e.target.value)} placeholder="GRN-202606-XXX"/></div>
              <div className="space-y-1.5 col-span-2"><Label className="text-xs">Supplier *</Label><Input value={form.supplier} onChange={e=>set("supplier",e.target.value)} placeholder="e.g. 3M India Ltd"/></div>
              <div className="space-y-1.5 col-span-2"><Label className="text-xs">Notes</Label><Input value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Reason or special instructions"/></div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Return Items *</Label>
              {form.items.map(item=>(
                <div key={item.itemName} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded px-3 py-2">
                  <div><p className="text-sm font-medium">{item.itemName}</p><p className="text-xs text-gray-500">Qty: {item.qty} {item.unit} · Reason: {item.reason}</p></div>
                  <button onClick={()=>setForm(f=>({...f,items:f.items.filter(i=>i.itemName!==item.itemName)}))} className="text-red-400 hover:text-red-600 px-2 text-xs">✕</button>
                </div>
              ))}
              <div className="grid grid-cols-4 gap-2 items-end">
                <div className="space-y-1 col-span-2"><Label className="text-xs">Item Name</Label><Input value={form.newItem} onChange={e=>set("newItem",e.target.value)} placeholder="Item name…"/></div>
                <div className="space-y-1"><Label className="text-xs">Qty</Label><Input type="number" min={1} value={form.newQty} onChange={e=>set("newQty",parseInt(e.target.value)||1)}/></div>
                <div className="space-y-1"><Label className="text-xs">Unit</Label>
                  <Select value={form.newUnit} onValueChange={v=>set("newUnit",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                    <SelectItem value="Pcs">Pcs</SelectItem><SelectItem value="L">L</SelectItem><SelectItem value="Kg">Kg</SelectItem>
                  </SelectContent></Select>
                </div>
                <div className="space-y-1 col-span-3"><Label className="text-xs">Reason *</Label><Input value={form.newReason} onChange={e=>set("newReason",e.target.value)} placeholder="e.g. Damaged, Short expiry, Wrong item"/></div>
                <Button variant="outline" onClick={handleAddItem} disabled={!form.newItem||!form.newReason}><Plus className="w-4 h-4 mr-1"/>Add</Button>
              </div>
            </div>
            <div className="flex gap-3 pt-2 border-t"><Button variant="outline" onClick={()=>setDialogOpen(false)} className="flex-1">Cancel</Button><Button onClick={handleSubmit} className="flex-1 bg-orange-600 hover:bg-orange-700">Raise Return</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispatch Dialog */}
      <Dialog open={!!dispatchDialog} onOpenChange={o=>{if(!o){setDispatchDialog(null);setTrackingNo("");}}}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Mark as Dispatched</DialogTitle><DialogDescription>{dispatchDialog?.returnId} → {dispatchDialog?.supplier}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Tracking / Docket Number *</Label><Input value={trackingNo} onChange={e=>setTrackingNo(e.target.value)} placeholder="e.g. DTDC-123456"/></div>
            <div className="flex gap-3 pt-2 border-t"><Button variant="outline" onClick={()=>{setDispatchDialog(null);setTrackingNo("");}} className="flex-1">Cancel</Button><Button onClick={()=>dispatchDialog && handleDispatch(dispatchDialog)} disabled={!trackingNo.trim()} className="flex-1">Confirm Dispatch</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
