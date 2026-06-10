import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Phone, CheckCircle, Clock, Package, UserX, UserCheck, RefreshCw } from "lucide-react";
import { DataService } from "../../services/DataService";
import { tsmAbsenceService } from "../../services/tsmAbsenceService";
import { useRole } from "../../contexts/RoleContext";

interface UpsellTask { taskId:string; type:string; customerId:string; customerName:string; customerPhone:string; jobId?:string; subscriptionId?:string; packageName?:string; planLabel?:string; followUpDate:string; status:"PENDING"|"CALLED"|"CONVERTED"|"NOT_INTERESTED"|"NO_ANSWER"; notes?:string; cityId:string; createdAt:string; }
interface ExpiryReminder { key:string; subscriptionId:string; customerId:string; daysLeft:number; sentAt:string; message:string; }

const TYPE_LABELS:Record<string,{label:string;color:string;icon:string}> = {
  UPSELL_ONETIME_TO_MONTHLY:{label:"One-Time → Monthly",color:"bg-blue-100 text-blue-800",icon:"📞"},
  UPSELL_PACK_LAST_VISIT:{label:"Pack: 1 Visit Left",color:"bg-orange-100 text-orange-800",icon:"⚡"},
  UPSELL_PACK_EXHAUSTED:{label:"Pack: Exhausted",color:"bg-red-100 text-red-800",icon:"🔴"},
};
const STATUS_COLORS:Record<string,string> = { PENDING:"bg-yellow-100 text-yellow-800", CALLED:"bg-blue-100 text-blue-800", CONVERTED:"bg-green-100 text-green-800", NOT_INTERESTED:"bg-gray-100 text-gray-600", NO_ANSWER:"bg-orange-100 text-orange-800" };

export function UpsellTasksPanel({cityId}:{cityId:string}){
  const [tasks,setTasks]=useState<UpsellTask[]>([]);
  const [reminders,setReminders]=useState<ExpiryReminder[]>([]);
  const [filter,setFilter]=useState<"ALL"|"PENDING"|"TODAY">("PENDING");

  const load=()=>{
    setTasks((DataService.get<any>("TSM_UPSELL_TASKS")||[]).filter((t:any)=>!cityId||t.cityId===cityId));
    setReminders(DataService.get<any>("PACK_EXPIRY_REMINDERS")||[]);
  };

  useEffect(()=>{
    load();
    const h=()=>load();
    window.addEventListener("cc360:upsell_task_created",h);
    window.addEventListener("cc360:pack_expiry_warning",h);
    return()=>{window.removeEventListener("cc360:upsell_task_created",h);window.removeEventListener("cc360:pack_expiry_warning",h);};
  },[cityId]);

  const update=(taskId:string,status:UpsellTask["status"])=>{
    const all=DataService.get<any>("TSM_UPSELL_TASKS")||[];
    const idx=all.findIndex((t:any)=>t.taskId===taskId);
    if(idx>=0){all[idx].status=status;all[idx].updatedAt=new Date().toISOString();DataService.setAll("TSM_UPSELL_TASKS",all);}
    load();
  };

  const today=new Date().toISOString().split("T")[0];
  const filtered=tasks.filter(t=>filter==="PENDING"?t.status==="PENDING":filter==="TODAY"?t.followUpDate<=today&&t.status==="PENDING":true);
  const pendingCount=tasks.filter(t=>t.status==="PENDING").length;
  const dueTodayCount=tasks.filter(t=>t.followUpDate<=today&&t.status==="PENDING").length;

  return(<div className="space-y-4">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div><h2 className="text-xl font-bold text-gray-900">Upsell Tasks</h2><p className="text-sm text-gray-500">Call customers to convert to monthly subscription</p></div>
      <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1"/>Refresh</Button>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-gray-800">{tasks.length}</p><p className="text-xs text-gray-500">Total</p></CardContent></Card>
      <Card className="border-yellow-200"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-yellow-600">{pendingCount}</p><p className="text-xs text-gray-500">Pending</p></CardContent></Card>
      <Card className="border-red-200"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-red-600">{dueTodayCount}</p><p className="text-xs text-gray-500">Due Today</p></CardContent></Card>
    </div>
    <div className="flex gap-2">
      {(["PENDING","TODAY","ALL"] as const).map(f=><button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter===f?"bg-blue-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{f==="TODAY"?"Due Today":f==="PENDING"?"Pending":"All"}</button>)}
    </div>
    {reminders.length>0&&<div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">📦 Pack Expiry Reminders</h3>
      <div className="space-y-2">{reminders.slice(0,5).map(r=><Card key={r.key} className="border-orange-200 bg-orange-50/30"><CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="text-lg">{r.daysLeft===1?"🚨":r.daysLeft===3?"⚠️":"⏰"}</span><div><p className="text-sm font-medium">Pack expiry in <strong>{r.daysLeft} day{r.daysLeft!==1?"s":""}</strong></p></div></div>
        <Badge className={r.daysLeft===1?"bg-red-100 text-red-800":"bg-orange-100 text-orange-800"}>{r.daysLeft===1?"Last Day":r.daysLeft===3?"3 Days":"7 Days"}</Badge>
      </CardContent></Card>)}</div>
    </div>}
    <div className="space-y-3">
      {filtered.length===0&&<div className="text-center py-10 text-gray-400"><CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30"/><p>No {filter==="PENDING"?"pending":filter==="TODAY"?"due today":""} tasks.</p></div>}
      {filtered.map(task=>{
        const ti=TYPE_LABELS[task.type]||{label:task.type,color:"bg-gray-100 text-gray-700",icon:"📋"};
        const overdue=task.followUpDate<today&&task.status==="PENDING";
        return(<Card key={task.taskId} className={overdue?"border-red-200":""}><CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{ti.icon}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-900">{task.customerName}</span>
                  <Badge className={ti.color+" text-xs"}>{ti.label}</Badge>
                  <Badge className={STATUS_COLORS[task.status]+" text-xs"}>{task.status.replace(/_/g," ")}</Badge>
                  {overdue&&<Badge className="bg-red-100 text-red-700 text-xs">⚠️ Overdue</Badge>}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{task.customerPhone}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>Follow up: {task.followUpDate}</span>
                  {task.packageName&&<span className="flex items-center gap-1"><Package className="w-3 h-3"/>{task.packageName}</span>}
                </div>
                {task.notes&&<p className="text-xs text-gray-400 mt-1">{task.notes}</p>}
              </div>
            </div>
            {task.status==="PENDING"&&<div className="flex flex-col gap-1.5 min-w-[120px]">
              <a href={`tel:${task.customerPhone}`} className="w-full"><Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-xs"><Phone className="w-3 h-3 mr-1"/>Call Now</Button></a>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={()=>update(task.taskId,"CONVERTED")}>✅ Converted</Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={()=>update(task.taskId,"NO_ANSWER")}>📵 No Answer</Button>
              </div>
              <Button size="sm" variant="ghost" className="text-xs text-gray-400" onClick={()=>update(task.taskId,"NOT_INTERESTED")}>Not Interested</Button>
            </div>}
            {task.status!=="PENDING"&&<Badge className={STATUS_COLORS[task.status]}>{task.status.replace(/_/g," ")}</Badge>}
          </div>
        </CardContent></Card>);
      })}
    </div>
  </div>);
}

export function TSMSettingsPanel(){
  const {currentUser}=useRole();
  const tsmId=currentUser?.id||"";
  const [isAbsent,setIsAbsent]=useState(()=>tsmAbsenceService.isAbsentToday(tsmId));
  const toggle=()=>{
    if(isAbsent){tsmAbsenceService.markPresent(tsmId);setIsAbsent(false);}
    else{tsmAbsenceService.markAbsent(tsmId,"Manual — TSM marked self absent");setIsAbsent(true);}
  };
  return(<div className="space-y-4 max-w-lg">
    <div><h2 className="text-xl font-bold text-gray-900">TSM Settings</h2><p className="text-sm text-gray-500">Manage your availability</p></div>
    <Card className={isAbsent?"border-red-200 bg-red-50/30":"border-green-200 bg-green-50/30"}>
      <CardHeader><CardTitle className="text-base flex items-center gap-2">{isAbsent?<UserX className="w-5 h-5 text-red-600"/>:<UserCheck className="w-5 h-5 text-green-600"/>}Availability Status</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div><p className="font-medium text-gray-900">{isAbsent?"🔴 You are marked ABSENT today":"🟢 You are marked PRESENT today"}</p>
        <p className="text-sm text-gray-500 mt-0.5">{isAbsent?"All bookings routing to Admin and Super Admin.":"You are primary handler for working hours (10:30 AM – 6:30 PM)."}</p></div>
        <Button onClick={toggle} className={isAbsent?"bg-green-600 hover:bg-green-700":"bg-red-600 hover:bg-red-700"}>{isAbsent?"✅ Mark Myself Present":"❌ Mark Myself Absent"}</Button>
        <p className="text-xs text-gray-400">System auto-marks absent if no check-in by 10:30 AM.</p>
      </CardContent>
    </Card>
    <Card><CardContent className="p-4 space-y-2"><h3 className="font-medium text-gray-900">Your Working Hours</h3>
      <div className="text-sm text-gray-600 space-y-1"><p>📅 Mon–Fri: 10:30 AM – 6:30 PM</p><p>🌙 After 6:30 PM: Admin / Super Admin handle</p><p>🗓️ Weekends: Admin / Super Admin handle</p><p>📞 IVR: <strong>080 48 79 45 45</strong></p></div>
    </CardContent></Card>
  </div>);
}
