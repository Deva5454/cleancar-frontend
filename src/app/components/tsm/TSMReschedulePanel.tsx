import { useState } from "react";
import { rescheduleService, processIncomingMessage } from "../../services/whatsappRescheduleHandler";
import { DataService } from "../../services/DataService";
import { useRole } from "../../contexts/RoleContext";
import { RefreshCw, Search, CheckCircle2, User, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { toast } from "sonner";

interface FoundCustomer { customerId: string; name: string; phone: string; vehicleReg: string; area: string; }
interface UpcomingJob { jobId: string; scheduledDate: string; timeSlot: string; packageName: string; vehicleReg: string; status: string; subscriptionId?: string; }
type Step = "search" | "jobs" | "slot" | "done";

const SLOTS = ["05:00 - 05:30","05:30 - 06:00","06:00 - 06:30","06:30 - 07:00","07:00 - 07:30","07:30 - 08:00","08:00 - 08:30","08:30 - 09:00"];

function findCustomerByPhone(phone: string): FoundCustomer | null {
  const clean = phone.replace(/\D/g,"").slice(-10);
  const customers = DataService.get<any>("CUSTOMERS") || [];
  const c = customers.find((x: any) => (x.phone||x.mobile||"").replace(/\D/g,"").slice(-10) === clean);
  if (!c) return null;
  const v = c.vehicles?.[0] || c.vehicleDetails;
  return { customerId: c.customerId, name: `${c.firstName||""} ${c.lastName||""}`.trim()||"Customer", phone: c.phone||phone, vehicleReg: v?.registration||v?.registrationNumber||"", area: c.area||c.address?.area||"" };
}

function getJobsForCustomer(customerId: string, phone: string): UpcomingJob[] {
  const today = new Date().toISOString().split("T")[0];
  const cleanPhone = phone.replace(/\D/g,"").slice(-10);
  const dsJobs = DataService.get<any>("JOBS") || [];
  const localJobs = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs")||"[]");
  const all = [...dsJobs, ...localJobs].filter((j: any) =>
    (j.customerId===customerId || (j.customerPhone||"").replace(/\D/g,"").slice(-10)===cleanPhone) &&
    (j.scheduledDate||"") >= today && !["Completed","Cancelled","Failed"].includes(j.status)
  );
  const seen = new Set<string>();
  return all.filter(j => { const id=j.jobId||j.id; if(seen.has(id)) return false; seen.add(id); return true; })
    .map(j => ({ jobId: j.jobId||j.id, scheduledDate: j.scheduledDate, timeSlot: j.timeSlot||"06:00 AM", packageName: j.packageName||j.packageType||"Wash", vehicleReg: j.vehicleReg||j.vehicleDetails?.registration||"", status: j.status, subscriptionId: j.subscriptionId }))
    .sort((a,b) => a.scheduledDate.localeCompare(b.scheduledDate)).slice(0,10);
}

function formatDate(d: string) { return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"}); }
function getMinDate() { const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; }

export function TSMReschedulePanel() {
  const { currentUser } = useRole();
  const [step, setStep] = useState<Step>("search");
  const [phoneInput, setPhoneInput] = useState("");
  const [customer, setCustomer] = useState<FoundCustomer|null>(null);
  const [jobs, setJobs] = useState<UpcomingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<UpcomingJob|null>(null);
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState<{date:string;slot:string;job:UpcomingJob;customer:FoundCustomer}|null>(null);

  function handleSearch() {
    const clean = phoneInput.replace(/\D/g,"").slice(-10);
    if(clean.length!==10){setError("Enter a valid 10-digit number.");return;}
    setError(""); setLoading(true);
    setTimeout(() => {
      const found = findCustomerByPhone(clean);
      if(!found){setError("No customer found with this number.");setLoading(false);return;}
      setCustomer(found); setJobs(getJobsForCustomer(found.customerId,clean)); setLoading(false); setStep("jobs");
    },500);
  }

  function handleConfirm() {
    if(!newDate||!newSlot||!selectedJob||!customer){setError("Select a date and time slot.");return;}
    setError(""); setLoading(true);
    setTimeout(() => {
      processIncomingMessage(customer.phone,"RESCHEDULE","IVR");
      setTimeout(() => {
        const ok = rescheduleService.resolveByPhone(customer.phone,newDate,newSlot,currentUser?.employeeId||"TSM",selectedJob.jobId,note||"TSM rescheduled after IVR call");
        if(ok){setConfirmed({date:newDate,slot:newSlot,job:selectedJob,customer});toast.success(`Rescheduled for ${customer.name}`);setLoading(false);setStep("done");}
        else{setError("Could not process. Please try again.");setLoading(false);}
      },300);
    },600);
  }

  function handleReset() { setStep("search");setPhoneInput("");setCustomer(null);setJobs([]);setSelectedJob(null);setNewDate("");setNewSlot("");setNote("");setError("");setConfirmed(null); }

  return (
    <Card className="border-blue-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-600" />
          Reschedule for Customer
          <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 ml-auto">IVR / Call</Badge>
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">Customer called via IVR. Search by phone to reschedule their booking.</p>
      </CardHeader>
      <CardContent className="space-y-3">

        {step==="search" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Customer Phone Number</label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 border rounded-lg bg-gray-50 text-sm font-bold text-gray-600">+91</div>
                <input className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="9876543210" value={phoneInput} maxLength={10} onChange={e=>{setPhoneInput(e.target.value.replace(/\D/g,""));setError("");}} onKeyDown={e=>e.key==="Enter"&&handleSearch()} />
                <Button onClick={handleSearch} disabled={loading} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                  {loading?<RefreshCw className="w-3 h-3 animate-spin"/>:<Search className="w-3 h-3"/>}
                </Button>
              </div>
            </div>
            {error && <div className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</div>}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
              <strong>IVR Flow:</strong> Customer selected reschedule on IVR. Enter their number to pull up bookings and confirm the new slot agreed on the call.
            </div>
          </div>
        )}

        {step==="jobs" && customer && (
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-blue-600"/></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900">{customer.name}</div>
                <div className="text-xs text-gray-500">{customer.phone}{customer.area&&` · ${customer.area}`}</div>
              </div>
              <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600">Change</button>
            </div>
            <div className="text-xs font-semibold text-gray-700">{jobs.length>0?`${jobs.length} upcoming booking${jobs.length>1?"s":""} — select one:`:"No upcoming bookings found."}</div>
            {jobs.length===0 && <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">No upcoming washes scheduled for this customer.</div>}
            {jobs.map(job=>(
              <div key={job.jobId} className="border rounded-lg p-3 cursor-pointer hover:border-blue-300 hover:bg-gray-50 transition-all" onClick={()=>{setSelectedJob(job);setStep("slot");}}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{formatDate(job.scheduledDate)}</div>
                    <div className="text-xs text-gray-500 mt-1">🕐 {job.timeSlot} &nbsp; 📦 {job.packageName}</div>
                    {job.vehicleReg&&<div className="text-xs text-gray-400 mt-1">🚗 {job.vehicleReg}</div>}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{job.status}</Badge>
                </div>
              </div>
            ))}
            {jobs.length===0&&<Button variant="outline" size="sm" className="w-full" onClick={handleReset}>← Search Again</Button>}
          </div>
        )}

        {step==="slot" && selectedJob && customer && (
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
              <div className="font-bold text-gray-800 mb-1">{customer.name} · {customer.phone}</div>
              <div className="text-gray-500">Current: {formatDate(selectedJob.scheduledDate)} · {selectedJob.timeSlot}</div>
              <div className="text-gray-500">{selectedJob.packageName} · {selectedJob.vehicleReg}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">New Date</label>
              <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={newDate} min={getMinDate()} onChange={e=>{setNewDate(e.target.value);setError("");}} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">New Time Slot</label>
              <div className="grid grid-cols-2 gap-2">
                {SLOTS.map(slot=>(
                  <button key={slot} className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${newSlot===slot?"border-blue-500 bg-blue-50 text-blue-700":"border-gray-200 hover:border-blue-300"}`} onClick={()=>{setNewSlot(slot);setError("");}}>
                    {slot}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Note (optional)</label>
              <textarea className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} placeholder="e.g. Customer travelling, requested morning slot" value={note} onChange={e=>setNote(e.target.value)} />
            </div>
            {error&&<div className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</div>}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={()=>setStep("jobs")}>← Back</Button>
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirm} disabled={loading||!newDate||!newSlot}>
                {loading?<><RefreshCw className="w-3 h-3 mr-1 animate-spin"/>Saving…</>:"Confirm Reschedule"}
              </Button>
            </div>
          </div>
        )}

        {step==="done" && confirmed && (
          <div className="space-y-3">
            <div className="flex flex-col items-center py-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3"><CheckCircle2 className="w-6 h-6 text-green-600"/></div>
              <div className="text-base font-bold text-gray-900">Reschedule Confirmed</div>
              <div className="text-xs text-gray-500 mt-1">WhatsApp sent to customer</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2 text-xs">
              {[["Customer",confirmed.customer.name],["New Date",formatDate(confirmed.date)],["New Slot",confirmed.slot],["Service",confirmed.job.packageName],["Vehicle",confirmed.job.vehicleReg]].map(([k,v])=>(
                <div key={k} className="flex justify-between"><span className="text-gray-600">{k}</span><span className="font-bold">{v}</span></div>
              ))}
            </div>
            <div className="text-xs text-gray-500 text-center">Supervisor and washer notified in real time.</div>
            <Button onClick={handleReset} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm">Reschedule Another Customer</Button>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

export default TSMReschedulePanel;
