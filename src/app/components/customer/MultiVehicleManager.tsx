import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Car, Plus, Trash2, Star, CheckCircle } from "lucide-react";
import { DataService } from "../../services/DataService";

const VEHICLE_CATEGORIES = ["Hatchback","Sedan","SUV","Luxury","2-Wheeler"];
const BRANDS = ["Maruti Suzuki","Hyundai","Tata","Mahindra","Honda","Toyota","Kia","MG","BMW","Mercedes","Audi","Royal Enfield","Other"];

export interface Vehicle { vehicleId:string; category:string; brand:string; model?:string; color:string; registrationNumber:string; isPrimary:boolean; addedAt:string; activeSubscriptionId?:string; }
interface Props { customerId:string; customerName:string; onVehicleSelect?:(v:Vehicle)=>void; mode?:"manage"|"select"; }

function genId(cid:string){return `VEH-${cid}-${Date.now().toString(36).toUpperCase()}`;}

function saveVehicles(customerId:string, vehicles:Vehicle[]) {
  const customers = DataService.get<any>("CUSTOMERS")||[];
  const idx = customers.findIndex((c:any)=>c.customerId===customerId);
  if(idx>=0){customers[idx].vehicles=vehicles; DataService.setAll("CUSTOMERS",customers);}
}

export function MultiVehicleManager({customerId,customerName,onVehicleSelect,mode="manage"}:Props){
  const raw = (DataService.get<any>("CUSTOMERS")||[]).find((c:any)=>c.customerId===customerId);
  const init:Vehicle[] = raw?.vehicles||(raw?.vehicleDetails?[{vehicleId:genId(customerId),category:raw.vehicleDetails.category||"Hatchback",brand:raw.vehicleDetails.brand||"",color:raw.vehicleDetails.color||"",registrationNumber:raw.vehicleDetails.registrationNumber||"",isPrimary:true,addedAt:raw.createdAt||new Date().toISOString()}]:[]);
  const [vehicles,setVehicles]=useState<Vehicle[]>(init);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({category:"Hatchback",brand:"",model:"",color:"",reg:""});
  const [error,setError]=useState("");
  const [saved,setSaved]=useState(false);

  const save=(updated:Vehicle[])=>{setVehicles(updated);saveVehicles(customerId,updated);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const add=()=>{
    if(!form.brand||!form.reg||!form.color){setError("Brand, registration and color required.");return;}
    const regN=form.reg.toUpperCase().replace(/\s/g,"");
    if(vehicles.find(v=>v.registrationNumber===regN)){setError("Registration already added.");return;}
    save([...vehicles,{vehicleId:genId(customerId),category:form.category,brand:form.brand,model:form.model,color:form.color,registrationNumber:regN,isPrimary:vehicles.length===0,addedAt:new Date().toISOString()}]);
    setForm({category:"Hatchback",brand:"",model:"",color:"",reg:""});setShowAdd(false);setError("");
  };
  const remove=(id:string)=>{
    const v=vehicles.find(x=>x.vehicleId===id);
    if(v?.isPrimary&&vehicles.length>1){setError("Set another vehicle as primary first.");return;}
    save(vehicles.filter(x=>x.vehicleId!==id));
  };

  return(<div className="space-y-4">
    <div className="flex items-center justify-between">
      <div><h3 className="text-lg font-semibold">{mode==="select"?"Select Vehicle":"My Vehicles"}</h3><p className="text-sm text-gray-500">{customerName} · {vehicles.length} vehicle(s)</p></div>
      {mode==="manage"&&<Button size="sm" onClick={()=>setShowAdd(true)}><Plus className="w-4 h-4 mr-1"/>Add</Button>}
    </div>
    {saved&&<div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm"><CheckCircle className="w-4 h-4"/>Saved.</div>}
    {error&&<div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">{error}</div>}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {vehicles.map(v=>(
        <Card key={v.vehicleId} className={`cursor-pointer ${v.isPrimary?"border-blue-300 bg-blue-50/30":""}`} onClick={()=>mode==="select"&&onVehicleSelect?.(v)}>
          <CardContent className="p-4 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg"><Car className="w-5 h-5 text-gray-600"/></div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{v.brand} {v.model||""}</span>
                  {v.isPrimary&&<Badge className="bg-blue-100 text-blue-800 text-xs"><Star className="w-3 h-3 mr-1"/>Primary</Badge>}
                  <Badge className="bg-gray-100 text-gray-700 text-xs">{v.category}</Badge>
                </div>
                <p className="text-sm text-gray-600">{v.registrationNumber}</p>
                <p className="text-xs text-gray-400">{v.color}</p>
              </div>
            </div>
            {mode==="manage"&&<div className="flex gap-1">
              {!v.isPrimary&&<Button variant="ghost" size="sm" onClick={e=>{e.stopPropagation();save(vehicles.map(x=>({...x,isPrimary:x.vehicleId===v.vehicleId})));}}><Star className="w-4 h-4 text-gray-400"/></Button>}
              <Button variant="ghost" size="sm" onClick={e=>{e.stopPropagation();remove(v.vehicleId);}}><Trash2 className="w-4 h-4 text-red-400"/></Button>
            </div>}
          </CardContent>
        </Card>
      ))}
      {vehicles.length===0&&<div className="col-span-2 text-center py-8 text-gray-400"><Car className="w-10 h-10 mx-auto mb-2 opacity-30"/><p>No vehicles added.</p></div>}
    </div>
    {showAdd&&<Card className="border-blue-200"><CardHeader><CardTitle className="text-base">Add Vehicle</CardTitle></CardHeader><CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Category</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{VEHICLE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Brand *</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))}><option value="">Select</option>{BRANDS.map(b=><option key={b}>{b}</option>)}</select></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Color *</label><input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. White" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))}/></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Registration *</label><input className="w-full border rounded-lg px-3 py-2 text-sm uppercase" placeholder="GJ05MD1234" value={form.reg} onChange={e=>setForm(f=>({...f,reg:e.target.value.toUpperCase().replace(/\s/g,"")}))}/></div>
      </div>
      <div className="flex gap-2"><Button onClick={add} size="sm">Save</Button><Button variant="outline" size="sm" onClick={()=>{setShowAdd(false);setError("");}}>Cancel</Button></div>
    </CardContent></Card>}
  </div>);
}
export default MultiVehicleManager;
