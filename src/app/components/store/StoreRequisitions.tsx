import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { FileText, Plus, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface RequisitionItem { itemId: string; itemName: string; unit: string; currentStock: number; reorderLevel: number; qtyRequired: number; }
interface Requisition {
  mrId: string; mrDate: string; raisedBy: string; urgency: "Normal" | "Urgent" | "Critical";
  status: "Draft" | "Submitted" | "Approved" | "Ordered" | "Partially Received" | "Completed" | "Rejected";
  items: RequisitionItem[]; notes?: string; approvedBy?: string; approvedDate?: string; expectedDate?: string; createdAt: string;
}

const INVENTORY_ITEMS = [
  { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",         unit:"L",   centralStock:45, reorderLevel:20 },
  { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", unit:"Pcs", centralStock:120,reorderLevel:50 },
  { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",       unit:"L",   centralStock:30, reorderLevel:15 },
  { itemId:"INV-SUR-004", itemName:"Dashboard Polish",       unit:"L",   centralStock:8,  reorderLevel:20 },
  { itemId:"INV-SUR-005", itemName:"Pressure Washer Nozzle", unit:"Pcs", centralStock:6,  reorderLevel:4  },
  { itemId:"INV-SUR-006", itemName:"Washer Uniform Set",     unit:"Pcs", centralStock:25, reorderLevel:15 },
  { itemId:"INV-SUR-007", itemName:"Wheel Cleaner 1L",       unit:"L",   centralStock:18, reorderLevel:12 },
  { itemId:"INV-SUR-008", itemName:"Glass Cleaner 500ml",    unit:"L",   centralStock:0,  reorderLevel:10 },
];

const SEED: Requisition[] = [
  { mrId:"MR-202604-001", mrDate:"2026-04-28", raisedBy:"Nilesh Chauhan (Store Manager)", urgency:"Normal",   status:"Completed",         approvedBy:"Amit Desai", approvedDate:"2026-04-29", expectedDate:"2026-05-05", createdAt:"2026-04-28T09:00:00.000Z", notes:"Monthly replenishment", items:[{ itemId:"INV-SUR-001",itemName:"Car Shampoo 5L",unit:"L",currentStock:12,reorderLevel:20,qtyRequired:50},{itemId:"INV-SUR-002",itemName:"Microfiber Cloth Large",unit:"Pcs",currentStock:40,reorderLevel:50,qtyRequired:100},{itemId:"INV-SUR-007",itemName:"Wheel Cleaner 1L",unit:"L",currentStock:5,reorderLevel:12,qtyRequired:20}] },
  { mrId:"MR-202605-001", mrDate:"2026-05-20", raisedBy:"Nilesh Chauhan (Store Manager)", urgency:"Urgent",   status:"Completed",         approvedBy:"Amit Desai", approvedDate:"2026-05-21", expectedDate:"2026-05-28", createdAt:"2026-05-20T10:30:00.000Z", notes:"Dashboard polish critically low", items:[{itemId:"INV-SUR-004",itemName:"Dashboard Polish",unit:"L",currentStock:3,reorderLevel:20,qtyRequired:25},{itemId:"INV-SUR-003",itemName:"Tyre Shine 500ml",unit:"L",currentStock:8,reorderLevel:15,qtyRequired:30}] },
  { mrId:"MR-202605-002", mrDate:"2026-05-30", raisedBy:"Nilesh Chauhan (Store Manager)", urgency:"Normal",   status:"Completed",         approvedBy:"Amit Desai", approvedDate:"2026-05-31", expectedDate:"2026-06-07", createdAt:"2026-05-30T09:00:00.000Z", items:[{itemId:"INV-SUR-006",itemName:"Washer Uniform Set",unit:"Pcs",currentStock:8,reorderLevel:15,qtyRequired:20},{itemId:"INV-SUR-005",itemName:"Pressure Washer Nozzle",unit:"Pcs",currentStock:2,reorderLevel:4,qtyRequired:10}] },
  { mrId:"MR-202606-001", mrDate:"2026-06-18", raisedBy:"Nilesh Chauhan (Store Manager)", urgency:"Critical", status:"Approved",          approvedBy:"Amit Desai", approvedDate:"2026-06-18", expectedDate:"2026-06-25", createdAt:"2026-06-18T08:00:00.000Z", notes:"Glass cleaner completely out of stock", items:[{itemId:"INV-SUR-008",itemName:"Glass Cleaner 500ml",unit:"L",currentStock:0,reorderLevel:10,qtyRequired:30}] },
  { mrId:"MR-202606-002", mrDate:"2026-06-23", raisedBy:"Nilesh Chauhan (Store Manager)", urgency:"Normal",   status:"Submitted",         createdAt:"2026-06-23T09:00:00.000Z", items:[{itemId:"INV-SUR-001",itemName:"Car Shampoo 5L",unit:"L",currentStock:45,reorderLevel:20,qtyRequired:50},{itemId:"INV-SUR-002",itemName:"Microfiber Cloth Large",unit:"Pcs",currentStock:120,reorderLevel:50,qtyRequired:100}] },
];

const belowReorder = INVENTORY_ITEMS.filter(i => i.centralStock <= i.reorderLevel);

const seed = () => { try { if (!localStorage.getItem("cleancar_requisitions")) localStorage.setItem("cleancar_requisitions", JSON.stringify(SEED)); } catch {} };
const load = (): Requisition[] => { seed(); try { const r = localStorage.getItem("cleancar_requisitions"); return r ? JSON.parse(r) : SEED; } catch { return SEED; } };
const persist = (d: Requisition[]) => { try { localStorage.setItem("cleancar_requisitions", JSON.stringify(d)); } catch {} };

const emptyForm = () => ({ mrDate: new Date().toISOString().split("T")[0], urgency:"Normal" as const, notes:"", newItemId:"", newQty:10, items:[] as RequisitionItem[] });

export function StoreRequisitions() {
  const [requisitions, setRequisitions] = useState<Requisition[]>(load);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState(emptyForm());

  useEffect(() => { if (dialogOpen) setForm(emptyForm()); }, [dialogOpen]);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleAddItem = () => {
    const inv = INVENTORY_ITEMS.find(i => i.itemId === form.newItemId);
    if (!inv) { toast.error("Select an item"); return; }
    if (form.items.find(i => i.itemId === form.newItemId)) { toast.error("Already added"); return; }
    setForm(f => ({ ...f, newItemId:"", newQty:10, items:[...f.items,{itemId:inv.itemId,itemName:inv.itemName,unit:inv.unit,currentStock:inv.centralStock,reorderLevel:inv.reorderLevel,qtyRequired:f.newQty}] }));
  };

  const handleAutoFill = () => {
    const autoItems = belowReorder.map(i => ({ itemId:i.itemId, itemName:i.itemName, unit:i.unit, currentStock:i.centralStock, reorderLevel:i.reorderLevel, qtyRequired: i.reorderLevel * 3 }));
    setForm(f => ({ ...f, items: autoItems, urgency: belowReorder.some(i=>i.centralStock===0) ? "Critical" : "Urgent" as any }));
    toast.success(`Auto-filled ${autoItems.length} items below reorder level`);
  };

  const handleSubmit = (asDraft: boolean) => {
    if (form.items.length === 0) { toast.error("Add at least one item"); return; }
    const id = `MR-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,"0")}-${String(Math.floor(Math.random()*900)+100).padStart(3,"0")}`;
    const rec: Requisition = { mrId:id, mrDate:form.mrDate, raisedBy:"Nilesh Chauhan (Store Manager)", urgency:form.urgency, status: asDraft ? "Draft" : "Submitted", items:form.items, notes:form.notes, createdAt:new Date().toISOString() };
    const updated = [rec, ...requisitions];
    setRequisitions(updated); persist(updated);
    toast.success(`MR ${id} ${asDraft ? "saved as draft" : "submitted for approval"}`);
    setDialogOpen(false);
  };

  const handleApprove = (mr: Requisition) => {
    const updated = requisitions.map(r => r.mrId===mr.mrId ? {...r, status:"Approved" as const, approvedBy:"Amit Desai", approvedDate: new Date().toISOString().split("T")[0]} : r);
    setRequisitions(updated); persist(updated);
    toast.success(`MR ${mr.mrId} approved`);
  };

  const statusColor: Record<string,string> = { Draft:"bg-gray-100 text-gray-600", Submitted:"bg-blue-100 text-blue-800", Approved:"bg-green-100 text-green-800", Ordered:"bg-purple-100 text-purple-800", "Partially Received":"bg-yellow-100 text-yellow-800", Completed:"bg-teal-100 text-teal-800", Rejected:"bg-red-100 text-red-800" };
  const urgencyColor: Record<string,string> = { Normal:"text-gray-600", Urgent:"text-orange-600", Critical:"text-red-600" };
  const statuses = ["All","Draft","Submitted","Approved","Ordered","Completed"];
  const visible = filter==="All" ? requisitions : requisitions.filter(r=>r.status===filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-900">Material Requisitions</h2><p className="text-sm text-gray-500 mt-1">Raise MRs for central store replenishment</p></div>
        <Button onClick={()=>setDialogOpen(true)}><Plus className="w-4 h-4 mr-2"/>Raise Requisition</Button>
      </div>

      {/* Reorder alerts */}
      {belowReorder.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0"/>
          <div className="flex-1"><p className="text-sm font-semibold text-orange-800">{belowReorder.length} item{belowReorder.length!==1?"s":""} at or below reorder level</p><p className="text-xs text-orange-700">{belowReorder.map(i=>`${i.itemName} (${i.centralStock} ${i.unit})`).join(" · ")}</p></div>
          <Button size="sm" variant="outline" onClick={()=>{setDialogOpen(true);}} className="shrink-0 border-orange-300 text-orange-700 hover:bg-orange-100">Raise MR</Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[["Total",requisitions.length,"text-gray-900"],["Pending",requisitions.filter(r=>["Submitted","Approved","Ordered"].includes(r.status)).length,"text-blue-700"],["Completed",requisitions.filter(r=>r.status==="Completed").length,"text-teal-700"],["Alerts",belowReorder.length,"text-orange-600"]].map(([l,v,c])=>(
          <div key={l as string} className="bg-white border rounded-lg p-4 text-center"><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-xs text-gray-500 mt-1">{l}</p></div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600"/><CardTitle className="text-base">My Requisitions</CardTitle></div>
            <div className="flex gap-1 flex-wrap">{statuses.map(s=>(
              <button key={s} onClick={()=>setFilter(s)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter===s?"bg-blue-600 text-white border-blue-600":"bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>{s}</button>
            ))}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {visible.map(mr=>(
              <div key={mr.mrId} className="border rounded-lg px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><p className="text-sm font-semibold">{mr.mrId}</p><span className={`text-xs font-semibold ${urgencyColor[mr.urgency]}`}>⚑ {mr.urgency}</span></div>
                    <p className="text-xs text-gray-500">{mr.mrDate} · {mr.items.length} items · {mr.items.reduce((s,i)=>s+i.qtyRequired,0)} units total</p>
                    <p className="text-xs text-gray-400">{mr.items.map(i=>`${i.itemName} ×${i.qtyRequired}`).join(" · ")}</p>
                    {mr.approvedBy && <p className="text-xs text-green-600">Approved by {mr.approvedBy} on {mr.approvedDate}</p>}
                    {mr.notes && <p className="text-xs text-gray-400 italic">{mr.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge className={`text-xs ${statusColor[mr.status]}`}>{mr.status}</Badge>
                    {mr.status === "Submitted" && <button onClick={()=>handleApprove(mr)} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5 hover:bg-green-100">Approve</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={o=>{if(!o)setDialogOpen(false)}}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Raise Material Requisition</DialogTitle><DialogDescription>Request stock replenishment for central store</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">MR Date</Label><Input type="date" value={form.mrDate} onChange={e=>set("mrDate",e.target.value)}/></div>
              <div className="space-y-1.5"><Label className="text-xs">Urgency</Label>
                <Select value={form.urgency} onValueChange={v=>set("urgency",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem><SelectItem value="Urgent">Urgent</SelectItem><SelectItem value="Critical">Critical</SelectItem>
                </SelectContent></Select>
              </div>
              <div className="space-y-1.5 col-span-2"><Label className="text-xs">Notes / Reason</Label><Input value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="e.g. Monthly replenishment, Stock-out alert"/></div>
            </div>

            {belowReorder.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleAutoFill} className="w-full border-orange-300 text-orange-700">
                <AlertTriangle className="w-4 h-4 mr-2"/> Auto-fill {belowReorder.length} items below reorder level
              </Button>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Items *</Label>
              {form.items.length===0 && <div className="text-center py-4 border-2 border-dashed rounded-lg text-xs text-gray-400">No items added</div>}
              {form.items.map(item=>(
                <div key={item.itemId} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2">
                  <div><p className="text-sm font-medium">{item.itemName}</p><p className="text-xs text-gray-500">Current: {item.currentStock} {item.unit} | Reorder: {item.reorderLevel} | Requesting: <strong>{item.qtyRequired}</strong></p></div>
                  <button onClick={()=>setForm(f=>({...f,items:f.items.filter(i=>i.itemId!==item.itemId)}))} className="text-red-400 hover:text-red-600 px-2 text-xs">✕</button>
                </div>
              ))}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1"><Label className="text-xs">Item</Label>
                  <Select value={form.newItemId} onValueChange={v=>set("newItemId",v)}><SelectTrigger><SelectValue placeholder="Select item…"/></SelectTrigger><SelectContent>
                    {INVENTORY_ITEMS.map(i=><SelectItem key={i.itemId} value={i.itemId} disabled={!!form.items.find(f=>f.itemId===i.itemId)}>{i.itemName} (Stock: {i.centralStock})</SelectItem>)}
                  </SelectContent></Select>
                </div>
                <div className="w-24 space-y-1"><Label className="text-xs">Qty</Label><Input type="number" min={1} value={form.newQty} onChange={e=>set("newQty",parseInt(e.target.value)||1)}/></div>
                <Button variant="outline" onClick={handleAddItem} disabled={!form.newItemId}><Plus className="w-4 h-4 mr-1"/>Add</Button>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t">
              <Button variant="outline" onClick={()=>setDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button variant="outline" onClick={()=>handleSubmit(true)} className="flex-1">Save Draft</Button>
              <Button onClick={()=>handleSubmit(false)} className="flex-1 bg-blue-600 hover:bg-blue-700">Submit for Approval</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
