import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Building2, Car, Users, Plus, Phone, MapPin, TrendingUp, FileText } from "lucide-react";
import { DataService } from "../../services/DataService";
import { useCity } from "../../contexts/CityContext";

export interface CorporateAccount { corporateId:string; companyName:string; gstNumber?:string; contactName:string; contactPhone:string; contactEmail?:string; address:string; pincode:string; cityId:string; fleetSize:number; accountType:"OFFICE"|"HOUSING_SOCIETY"|"FLEET_OPERATOR"|"OTHER"; status:"ACTIVE"|"PROSPECT"|"INACTIVE"; vehicles:CorporateVehicle[]; subscriptionIds:string[]; billingCycle:"Monthly"|"Quarterly"|"Annual"; totalMRR:number; notes?:string; createdAt:string; }
export interface CorporateVehicle { vehicleId:string; corporateId:string; registrationNumber:string; category:string; brand:string; model?:string; driverName?:string; driverPhone?:string; subscriptionId?:string; status:"ACTIVE"|"INACTIVE"; }

const CORP_KEY = "cleancar_corporate_accounts";
function genId(){return "CORP-"+Date.now().toString(36).toUpperCase();}
function load():CorporateAccount[]{return DataService.get<CorporateAccount>(CORP_KEY)||[];}
function save(a:CorporateAccount[]){DataService.setAll(CORP_KEY,a);}

export function CorporateB2BPortal(){
  const {city}=useCity();
  const [accounts,setAccounts]=useState(()=>load().filter(a=>a.cityId===city));
  const [view,setView]=useState<"list"|"add"|"detail">("list");
  const [selId,setSelId]=useState<string|null>(null);
  const refresh=()=>setAccounts(load().filter(a=>a.cityId===city));
  const sel=useMemo(()=>accounts.find(a=>a.corporateId===selId),[accounts,selId]);
  const totalMRR=accounts.filter(a=>a.status==="ACTIVE").reduce((s,a)=>s+a.totalMRR,0);
  const totalVeh=accounts.filter(a=>a.status==="ACTIVE").reduce((s,a)=>s+a.fleetSize,0);

  return(<div className="p-4 md:p-6 space-y-5">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div><h1 className="text-2xl font-bold text-gray-900">Corporate / B2B Accounts</h1><p className="text-sm text-gray-500">Fleet bookings for offices and housing societies</p></div>
      <Button onClick={()=>setView("add")} size="sm"><Plus className="w-4 h-4 mr-1"/>New Account</Button>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{accounts.filter(a=>a.status==="ACTIVE").length}</p><p className="text-xs text-gray-500 mt-1">Active Accounts</p></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{totalVeh}</p><p className="text-xs text-gray-500 mt-1">Fleet Vehicles</p></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">₹{totalMRR.toLocaleString("en-IN")}</p><p className="text-xs text-gray-500 mt-1">Corp MRR</p></CardContent></Card>
    </div>
    {view==="list"&&<div className="space-y-3">
      {accounts.length===0&&<div className="text-center py-12 text-gray-400"><Building2 className="w-12 h-12 mx-auto mb-3 opacity-30"/><p>No corporate accounts yet.</p></div>}
      {accounts.map(acc=><Card key={acc.corporateId} className="cursor-pointer hover:shadow-md" onClick={()=>{setSelId(acc.corporateId);setView("detail");}}>
        <CardContent className="p-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl"><Building2 className="w-5 h-5 text-blue-600"/></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{acc.companyName}</span>
                <Badge className={acc.status==="ACTIVE"?"bg-green-100 text-green-800":acc.status==="PROSPECT"?"bg-yellow-100 text-yellow-800":"bg-gray-100 text-gray-600"}>{acc.status}</Badge>
                <Badge className="bg-blue-100 text-blue-800 text-xs">{acc.accountType.replace(/_/g," ")}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{acc.contactPhone}</span>
                <span className="flex items-center gap-1"><Car className="w-3 h-3"/>{acc.fleetSize} vehicles</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{acc.pincode}</span>
              </div>
              {acc.gstNumber&&<p className="text-xs text-gray-400">GST: {acc.gstNumber}</p>}
            </div>
          </div>
          <div className="text-right"><p className="font-bold text-green-700">₹{acc.totalMRR.toLocaleString("en-IN")}/mo</p><p className="text-xs text-gray-400">{acc.vehicles.length} vehicles</p></div>
        </CardContent>
      </Card>)}
    </div>}
    {view==="add"&&<AddForm cityId={city} onSave={a=>{const all=load();all.push(a);save(all);refresh();setView("list");}} onCancel={()=>setView("list")}/>}
    {view==="detail"&&sel&&<Detail account={sel} onBack={()=>setView("list")} onUpdate={u=>{save(load().map(a=>a.corporateId===u.corporateId?u:a));refresh();}}/>}
  </div>);
}

function AddForm({cityId,onSave,onCancel}:{cityId:string;onSave:(a:CorporateAccount)=>void;onCancel:()=>void}){
  const [f,setF]=useState({companyName:"",gstNumber:"",contactName:"",contactPhone:"",address:"",pincode:"",fleetSize:"1",accountType:"OFFICE" as CorporateAccount["accountType"],billingCycle:"Monthly" as CorporateAccount["billingCycle"]});
  const [err,setErr]=useState("");
  const submit=()=>{
    if(!f.companyName||!f.contactName||!f.contactPhone||!f.pincode){setErr("Company name, contact, phone and pincode required.");return;}
    onSave({corporateId:genId(),...f,fleetSize:parseInt(f.fleetSize)||1,status:"PROSPECT",vehicles:[],subscriptionIds:[],totalMRR:0,createdAt:new Date().toISOString()});
  };
  return(<Card><CardHeader><CardTitle className="text-base">New Corporate Account</CardTitle></CardHeader><CardContent className="space-y-3">
    {err&&<div className="text-red-600 text-sm">{err}</div>}
    <div className="grid grid-cols-2 gap-3">
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Company Name *</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={f.companyName} onChange={e=>setF(p=>({...p,companyName:e.target.value}))}/></div>
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Account Type</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={f.accountType} onChange={e=>setF(p=>({...p,accountType:e.target.value as any}))}>{["OFFICE","HOUSING_SOCIETY","FLEET_OPERATOR","OTHER"].map(t=><option key={t}>{t.replace(/_/g," ")}</option>)}</select></div>
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Contact Name *</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={f.contactName} onChange={e=>setF(p=>({...p,contactName:e.target.value}))}/></div>
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Contact Phone *</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={f.contactPhone} onChange={e=>setF(p=>({...p,contactPhone:e.target.value}))}/></div>
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">GST Number</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={f.gstNumber} onChange={e=>setF(p=>({...p,gstNumber:e.target.value}))}/></div>
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Fleet Size</label><input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={f.fleetSize} onChange={e=>setF(p=>({...p,fleetSize:e.target.value}))}/></div>
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Pincode *</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={f.pincode} onChange={e=>setF(p=>({...p,pincode:e.target.value}))}/></div>
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Billing Cycle</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={f.billingCycle} onChange={e=>setF(p=>({...p,billingCycle:e.target.value as any}))}>{["Monthly","Quarterly","Annual"].map(b=><option key={b}>{b}</option>)}</select></div>
      <div className="col-span-2"><label className="text-xs font-medium text-gray-600 mb-1 block">Address</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={f.address} onChange={e=>setF(p=>({...p,address:e.target.value}))}/></div>
    </div>
    <div className="flex gap-2"><Button onClick={submit}>Create Account</Button><Button variant="outline" onClick={onCancel}>Cancel</Button></div>
  </CardContent></Card>);
}

function Detail({account,onBack,onUpdate}:{account:CorporateAccount;onBack:()=>void;onUpdate:(a:CorporateAccount)=>void}){
  const [showAdd,setShowAdd]=useState(false);
  const [vf,setVf]=useState({reg:"",category:"Hatchback",brand:"",driver:""});
  const addVehicle=()=>{
    if(!vf.reg||!vf.brand){return;}
    const v:CorporateVehicle={vehicleId:"CVEH-"+Date.now().toString(36).toUpperCase(),corporateId:account.corporateId,registrationNumber:vf.reg.toUpperCase().replace(/\s/g,""),category:vf.category,brand:vf.brand,driverName:vf.driver||undefined,status:"ACTIVE"};
    onUpdate({...account,vehicles:[...account.vehicles,v],fleetSize:Math.max(account.fleetSize,account.vehicles.length+1)});
    setVf({reg:"",category:"Hatchback",brand:"",driver:""});setShowAdd(false);
  };
  return(<div className="space-y-4">
    <Button variant="outline" size="sm" onClick={onBack}>← Back</Button>
    <Card><CardContent className="p-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-blue-50 rounded-xl"><Building2 className="w-6 h-6 text-blue-600"/></div>
          <div>
            <h2 className="text-xl font-bold">{account.companyName}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={account.status==="ACTIVE"?"bg-green-100 text-green-800":account.status==="PROSPECT"?"bg-yellow-100 text-yellow-800":"bg-gray-100 text-gray-600"}>{account.status}</Badge>
              <Badge className="bg-blue-100 text-blue-800 text-xs">{account.accountType.replace(/_/g," ")}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-6 mt-2 text-sm text-gray-600">
              <span><Users className="w-3 h-3 inline mr-1"/>{account.contactName}</span>
              <span><Phone className="w-3 h-3 inline mr-1"/>{account.contactPhone}</span>
              {account.gstNumber&&<span><FileText className="w-3 h-3 inline mr-1"/>GST: {account.gstNumber}</span>}
              <span><TrendingUp className="w-3 h-3 inline mr-1"/>₹{account.totalMRR.toLocaleString("en-IN")}/mo</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">{(["PROSPECT","ACTIVE","INACTIVE"] as const).map(s=><Button key={s} size="sm" variant={account.status===s?"default":"outline"} onClick={()=>onUpdate({...account,status:s})}>{s}</Button>)}</div>
      </div>
    </CardContent></Card>
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">Fleet Vehicles ({account.vehicles.length})</h3>
      <Button size="sm" onClick={()=>setShowAdd(true)}><Plus className="w-4 h-4 mr-1"/>Add Vehicle</Button>
    </div>
    {showAdd&&<Card className="border-blue-200"><CardContent className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Registration *</label><input className="w-full border rounded-lg px-3 py-2 text-sm uppercase" value={vf.reg} onChange={e=>setVf(p=>({...p,reg:e.target.value.toUpperCase()}))}/></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Brand *</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={vf.brand} onChange={e=>setVf(p=>({...p,brand:e.target.value}))}/></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Category</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={vf.category} onChange={e=>setVf(p=>({...p,category:e.target.value}))}>{["Hatchback","Sedan","SUV","Luxury","2-Wheeler"].map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Driver Name</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={vf.driver} onChange={e=>setVf(p=>({...p,driver:e.target.value}))}/></div>
      </div>
      <div className="flex gap-2"><Button size="sm" onClick={addVehicle}>Save</Button><Button variant="outline" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Button></div>
    </CardContent></Card>}
    <div className="space-y-2">
      {account.vehicles.map(v=><Card key={v.vehicleId}><CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3"><Car className="w-4 h-4 text-gray-400"/><div><span className="font-medium text-sm">{v.registrationNumber}</span><span className="text-gray-500 text-sm"> — {v.brand} ({v.category})</span>{v.driverName&&<span className="text-xs text-gray-400 ml-2">Driver: {v.driverName}</span>}</div></div>
        <Badge className={v.status==="ACTIVE"?"bg-green-100 text-green-800":"bg-gray-100 text-gray-600"}>{v.status}</Badge>
      </CardContent></Card>)}
      {account.vehicles.length===0&&<div className="text-center py-6 text-gray-400 text-sm">No vehicles added.</div>}
    </div>
  </div>);
}
export default CorporateB2BPortal;
