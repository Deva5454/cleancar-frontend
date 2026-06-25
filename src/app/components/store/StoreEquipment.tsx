import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Wrench, Plus, CheckCircle, AlertTriangle, Clock, User, Tool } from "lucide-react";
import { toast } from "sonner";

interface Equipment {
  equipmentId: string; serialNo: string; name: string; category: string;
  status: "In Store" | "Assigned" | "Under Maintenance" | "Retired";
  assignedTo?: string; assignedToId?: string; assignedDate?: string;
  purchaseDate: string; condition: "Good" | "Fair" | "Poor";
  lastServiceDate?: string; nextServiceDate?: string; notes?: string;
}

const SEED_EQUIPMENT: Equipment[] = [
  { equipmentId:"EQ-001", serialNo:"PW-KARCHER-001", name:"Pressure Washer K5",     category:"Washing Equipment", status:"Assigned",           assignedTo:"Harish Solanki", assignedToId:"EDB-SUP-SUR1", assignedDate:"2026-01-10", purchaseDate:"2025-12-01", condition:"Good",  lastServiceDate:"2026-04-01", nextServiceDate:"2026-07-01" },
  { equipmentId:"EQ-002", serialNo:"PW-KARCHER-002", name:"Pressure Washer K5",     category:"Washing Equipment", status:"Assigned",           assignedTo:"Bhavesh Modi",   assignedToId:"EDB-SUP-SUR2", assignedDate:"2026-01-10", purchaseDate:"2025-12-01", condition:"Good",  lastServiceDate:"2026-04-01", nextServiceDate:"2026-07-01" },
  { equipmentId:"EQ-003", serialNo:"PW-KARCHER-003", name:"Pressure Washer K5",     category:"Washing Equipment", status:"Under Maintenance",  lastServiceDate:"2026-06-20", purchaseDate:"2025-12-15", condition:"Poor",  notes:"Pump seal replaced — returning 28 Jun" },
  { equipmentId:"EQ-004", serialNo:"VC-BOSCH-001",   name:"Wet & Dry Vacuum",       category:"Cleaning Equipment",status:"Assigned",           assignedTo:"Mahesh Bharwad", assignedToId:"EDB-CW-SUR1A", assignedDate:"2026-02-01", purchaseDate:"2026-01-15", condition:"Good" },
  { equipmentId:"EQ-005", serialNo:"VC-BOSCH-002",   name:"Wet & Dry Vacuum",       category:"Cleaning Equipment",status:"In Store",           purchaseDate:"2026-01-15", condition:"Good" },
  { equipmentId:"EQ-006", serialNo:"FC-001",         name:"Foam Cannon Pro",        category:"Washing Equipment", status:"Assigned",           assignedTo:"Ramesh Koli",    assignedToId:"EDB-CW-SUR1B", assignedDate:"2026-02-05", purchaseDate:"2026-01-20", condition:"Good" },
  { equipmentId:"EQ-007", serialNo:"FC-002",         name:"Foam Cannon Pro",        category:"Washing Equipment", status:"In Store",           purchaseDate:"2026-01-20", condition:"Good" },
  { equipmentId:"EQ-008", serialNo:"DM-001",         name:"Demineraliser Unit",     category:"Water Treatment",   status:"Assigned",           assignedTo:"Harish Solanki", assignedToId:"EDB-SUP-SUR1", assignedDate:"2026-01-15", purchaseDate:"2025-11-01", condition:"Fair",  lastServiceDate:"2026-03-01", nextServiceDate:"2026-09-01" },
  { equipmentId:"EQ-009", serialNo:"BKT-TROLLEY-001",name:"Bucket & Trolley Set",   category:"Accessories",       status:"Assigned",           assignedTo:"Sunil Thakor",   assignedToId:"EDB-CW-SUR1C", assignedDate:"2026-02-10", purchaseDate:"2026-01-25", condition:"Good" },
  { equipmentId:"EQ-010", serialNo:"BKT-TROLLEY-002",name:"Bucket & Trolley Set",   category:"Accessories",       status:"Assigned",           assignedTo:"Nilesh Chauhan", assignedToId:"EDB-CW-SUR2A", assignedDate:"2026-02-10", purchaseDate:"2026-01-25", condition:"Fair" },
  { equipmentId:"EQ-011", serialNo:"BKT-TROLLEY-003",name:"Bucket & Trolley Set",   category:"Accessories",       status:"In Store",           purchaseDate:"2026-01-25", condition:"Good" },
  { equipmentId:"EQ-012", serialNo:"PW-KARCHER-004", name:"Pressure Washer K2",     category:"Washing Equipment", status:"Retired",            purchaseDate:"2025-06-01", condition:"Poor",  notes:"Beyond repair — motor failure Jun 2026" },
];

const RECIPIENTS = [
  { id:"EDB-SUP-SUR1", name:"Harish Solanki", type:"Supervisor" },
  { id:"EDB-SUP-SUR2", name:"Bhavesh Modi",   type:"Supervisor" },
  { id:"EDB-CW-SUR1A", name:"Mahesh Bharwad", type:"Car Washer" },
  { id:"EDB-CW-SUR1B", name:"Ramesh Koli",    type:"Car Washer" },
  { id:"EDB-CW-SUR1C", name:"Sunil Thakor",   type:"Car Washer" },
  { id:"EDB-CW-SUR2A", name:"Nilesh Chauhan", type:"Car Washer" },
  { id:"EDB-CW-SUR2C", name:"Arvind Vasava",  type:"Car Washer" },
];

const seed = () => { try { if (!localStorage.getItem("cleancar_equipment")) localStorage.setItem("cleancar_equipment", JSON.stringify(SEED_EQUIPMENT)); } catch {} };
const load = (): Equipment[] => { seed(); try { const r = localStorage.getItem("cleancar_equipment"); return r ? JSON.parse(r) : SEED_EQUIPMENT; } catch { return SEED_EQUIPMENT; } };
const persist = (data: Equipment[]) => { try { localStorage.setItem("cleancar_equipment", JSON.stringify(data)); } catch {} };

const emptyForm = () => ({ name:"", serialNo:"", category:"Washing Equipment", purchaseDate: new Date().toISOString().split("T")[0], condition:"Good" as const, assignTo:"", notes:"" });

export function StoreEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>(load);
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [assignDialog, setAssignDialog] = useState<Equipment | null>(null);
  const [assignTo, setAssignTo] = useState("");
  const [filter, setFilter]     = useState<string>("All");
  const [form, setForm]         = useState(emptyForm());

  useEffect(() => { if (dialogOpen) setForm(emptyForm()); }, [dialogOpen]);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.name || !form.serialNo) { toast.error("Name and Serial No are required"); return; }
    const eq: Equipment = { equipmentId:`EQ-${String(equipment.length + 1).padStart(3,"0")}`, ...form, status:"In Store", condition: form.condition as any };
    const updated = [eq, ...equipment];
    setEquipment(updated); persist(updated);
    toast.success(`Equipment "${form.name}" added to store`);
    setDialogOpen(false);
  };

  const handleAssign = () => {
    if (!assignTo || !assignDialog) return;
    const rec = RECIPIENTS.find(r => r.id === assignTo);
    const updated = equipment.map(e => e.equipmentId === assignDialog.equipmentId
      ? { ...e, status:"Assigned" as const, assignedTo: rec!.name, assignedToId: assignTo, assignedDate: new Date().toISOString().split("T")[0] } : e);
    setEquipment(updated); persist(updated);
    toast.success(`${assignDialog.name} assigned to ${rec!.name}`);
    setAssignDialog(null); setAssignTo("");
  };

  const handleReturn = (eq: Equipment) => {
    const updated = equipment.map(e => e.equipmentId === eq.equipmentId ? { ...e, status:"In Store" as const, assignedTo: undefined, assignedToId: undefined } : e);
    setEquipment(updated); persist(updated);
    toast.success(`${eq.name} returned to store`);
  };

  const handleMaintenance = (eq: Equipment) => {
    const updated = equipment.map(e => e.equipmentId === eq.equipmentId ? { ...e, status:"Under Maintenance" as const, lastServiceDate: new Date().toISOString().split("T")[0] } : e);
    setEquipment(updated); persist(updated);
    toast.success(`${eq.name} sent for maintenance`);
  };

  const statusColor: Record<string,string> = { "In Store":"bg-green-100 text-green-800", "Assigned":"bg-blue-100 text-blue-800", "Under Maintenance":"bg-yellow-100 text-yellow-800", "Retired":"bg-gray-100 text-gray-500" };
  const condColor:  Record<string,string> = { Good:"text-green-600", Fair:"text-yellow-600", Poor:"text-red-600" };
  const statuses = ["All","In Store","Assigned","Under Maintenance","Retired"];
  const visible = filter === "All" ? equipment : equipment.filter(e => e.status === filter);
  const counts = { total: equipment.length, inStore: equipment.filter(e=>e.status==="In Store").length, assigned: equipment.filter(e=>e.status==="Assigned").length, maintenance: equipment.filter(e=>e.status==="Under Maintenance").length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-900">Equipment Management</h2><p className="text-sm text-gray-500 mt-1">Track, assign, and maintain equipment in central store</p></div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2"/>Assign Equipment</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[["Total",counts.total,"text-gray-900"],["In Store",counts.inStore,"text-green-700"],["Assigned",counts.assigned,"text-blue-700"],["Maintenance",counts.maintenance,"text-yellow-700"]].map(([l,v,c])=>(
          <div key={l as string} className="bg-white border rounded-lg p-4 text-center"><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-xs text-gray-500 mt-1">{l}</p></div>
        ))}
      </div>

      {/* Filter + List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Wrench className="w-5 h-5 text-teal-600"/><CardTitle className="text-base">Equipment Register</CardTitle></div>
            <div className="flex gap-1 flex-wrap">{statuses.map(s=>(
              <button key={s} onClick={()=>setFilter(s)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter===s?"bg-teal-600 text-white border-teal-600":"bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>{s}</button>
            ))}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {visible.map(eq=>(
              <div key={eq.equipmentId} className="border rounded-lg px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><p className="text-sm font-semibold text-gray-900">{eq.name}</p><span className={`text-xs font-medium ${condColor[eq.condition]}`}>● {eq.condition}</span></div>
                    <p className="text-xs text-gray-500">S/N: {eq.serialNo} · {eq.category} · ID: {eq.equipmentId}</p>
                    {eq.assignedTo && <p className="text-xs text-blue-600">Assigned to: {eq.assignedTo} since {eq.assignedDate}</p>}
                    {eq.nextServiceDate && <p className="text-xs text-orange-600">Next service: {eq.nextServiceDate}</p>}
                    {eq.notes && <p className="text-xs text-gray-400 italic">{eq.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge className={`text-xs ${statusColor[eq.status]}`}>{eq.status}</Badge>
                    <div className="flex gap-1">
                      {eq.status === "In Store" && <button onClick={()=>{setAssignDialog(eq);setAssignTo("");}} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-100">Assign</button>}
                      {eq.status === "Assigned" && <><button onClick={()=>handleReturn(eq)} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5 hover:bg-green-100">Return</button><button onClick={()=>handleMaintenance(eq)} className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded px-2 py-0.5 hover:bg-yellow-100">Maintenance</button></>}
                      {eq.status === "Under Maintenance" && <button onClick={()=>handleReturn(eq)} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5 hover:bg-green-100">Mark Ready</button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Equipment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={o=>{if(!o)setDialogOpen(false)}}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Equipment to Store</DialogTitle><DialogDescription>Register new equipment in the central store inventory</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label className="text-xs">Equipment Name *</Label><Input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Pressure Washer K5"/></div>
              <div className="space-y-1.5"><Label className="text-xs">Serial Number *</Label><Input value={form.serialNo} onChange={e=>set("serialNo",e.target.value)} placeholder="e.g. PW-XXX-001"/></div>
              <div className="space-y-1.5"><Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v=>set("category",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                  {["Washing Equipment","Cleaning Equipment","Water Treatment","Accessories","Tools"].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Purchase Date</Label><Input type="date" value={form.purchaseDate} onChange={e=>set("purchaseDate",e.target.value)}/></div>
              <div className="space-y-1.5"><Label className="text-xs">Condition</Label>
                <Select value={form.condition} onValueChange={v=>set("condition",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                  {["Good","Fair","Poor"].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent></Select>
              </div>
              <div className="space-y-1.5 col-span-2"><Label className="text-xs">Notes</Label><Input value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Optional"/></div>
            </div>
            <div className="flex gap-3 pt-2 border-t"><Button variant="outline" onClick={()=>setDialogOpen(false)} className="flex-1">Cancel</Button><Button onClick={handleAdd} className="flex-1">Add to Store</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={o=>{if(!o){setAssignDialog(null);setAssignTo("");}}}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Equipment</DialogTitle><DialogDescription>{assignDialog?.name} (S/N: {assignDialog?.serialNo})</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Assign To *</Label>
              <Select value={assignTo} onValueChange={setAssignTo}><SelectTrigger><SelectValue placeholder="Select recipient…"/></SelectTrigger><SelectContent>
                {RECIPIENTS.map(r=><SelectItem key={r.id} value={r.id}>{r.name} ({r.type})</SelectItem>)}
              </SelectContent></Select>
            </div>
            <div className="flex gap-3 pt-2 border-t"><Button variant="outline" onClick={()=>{setAssignDialog(null);setAssignTo("");}} className="flex-1">Cancel</Button><Button onClick={handleAssign} disabled={!assignTo} className="flex-1">Confirm Assign</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
