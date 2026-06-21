import { useState, useEffect, useRef } from "react";
import { rescheduleService, processIncomingMessage } from "../../services/whatsappRescheduleHandler";
import { DataService } from "../../services/DataService";

type Step = "phone" | "otp" | "vehicle" | "jobs" | "slot" | "done";
interface UpcomingJob { jobId: string; scheduledDate: string; timeSlot: string; packageName: string; vehicleReg: string; status: string; subscriptionId?: string; }
const SLOTS = ["05:00 - 05:30","05:30 - 06:00","06:00 - 06:30","06:30 - 07:00","07:00 - 07:30","07:30 - 08:00","08:00 - 08:30","08:30 - 09:00"];

const DEMO_PHONE = "9000000001";
const DEMO_OTP = "123456";
const DEMO_VEHICLE = "GJ05AK0001";

function seedDemoData() {
  try {
    const tomorrow = new Date(Date.now()+86400000).toISOString().split("T")[0];
    const dayAfter = new Date(Date.now()+2*86400000).toISOString().split("T")[0];
    const key = "cleancar_CITY-SURAT_jobs";
    const existing = JSON.parse(localStorage.getItem(key)||"[]");
    if(existing.some((j: any)=>j.jobId==="DEMO-RSC-001")) return;
    const demos = [
      {jobId:"DEMO-RSC-001",customerName:"Demo Customer",customerPhone:"9000000001",washerId:"WASHER-DEMO",scheduledDate:tomorrow,timeSlot:"06:00 - 06:30",packageName:"Smart Wash",packageType:"SMART_WASH",vehicleDetails:{category:"Hatchback",color:"White",brand:"Maruti",registration:"GJ05AK0001"},vehicleReg:"GJ05AK0001",location:{addressLine1:"B-204, Demo Residency",area:"Adajan",city:"Surat",pinCode:"395001"},status:"Assigned",jobType:"Regular",subscriptionId:"SUB-DEMO-001",customerId:"CUST-DEMO-001",cityId:"CITY-SURAT",city:"Surat",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
      {jobId:"DEMO-RSC-002",customerName:"Demo Customer",customerPhone:"9000000001",washerId:"WASHER-DEMO",scheduledDate:dayAfter,timeSlot:"07:00 - 07:30",packageName:"Express Wash",packageType:"EXPRESS_WASH",vehicleDetails:{category:"Hatchback",color:"White",brand:"Maruti",registration:"GJ05AK0001"},vehicleReg:"GJ05AK0001",location:{addressLine1:"B-204, Demo Residency",area:"Adajan",city:"Surat",pinCode:"395001"},status:"Assigned",jobType:"Regular",subscriptionId:"SUB-DEMO-001",customerId:"CUST-DEMO-001",cityId:"CITY-SURAT",city:"Surat",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
    ];
    localStorage.setItem(key, JSON.stringify([...existing,...demos]));
  } catch(_){}
}

function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function sendOTPViaWhatsApp(phone: string, otp: string) { console.log(`[OTP] ${otp} -> ${phone}`); window.dispatchEvent(new CustomEvent("cc360:otp_sent", { detail: { phone, otp } })); }

function getJobsForVehicleAndPhone(phone: string, vehicleReg: string): UpcomingJob[] {
  const cleanReg = vehicleReg.replace(/\s/g, "").toUpperCase();
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const today = new Date().toISOString().split("T")[0];
  try {
    const localJobs = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs") || "[]");
    const dsJobs = DataService.get<any>("JOBS") || [];
    const all = [...localJobs, ...dsJobs].filter((j: any) => {
      const reg = (j.vehicleDetails?.registration || j.vehicleReg || "").replace(/\s/g,"").toUpperCase();
      const p = (j.customerPhone || "").replace(/\D/g,"").slice(-10);
      return reg === cleanReg && (p === cleanPhone || !p) && (j.scheduledDate || "") >= today && !["Completed","Cancelled"].includes(j.status);
    });
    const seen = new Set<string>();
    return all.filter(j => { const id = j.jobId||j.id; if(seen.has(id)) return false; seen.add(id); return true; })
      .map(j => ({ jobId: j.jobId||j.id, scheduledDate: j.scheduledDate, timeSlot: j.timeSlot||"06:00 AM", packageName: j.packageName||j.packageType||"Wash", vehicleReg: j.vehicleDetails?.registration||j.vehicleReg||vehicleReg, status: j.status, subscriptionId: j.subscriptionId }))
      .sort((a,b) => a.scheduledDate.localeCompare(b.scheduledDate)).slice(0,10);
  } catch { return []; }
}

function formatDate(d: string) { return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); }
function getMinDate() { const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; }

export function RescheduleTab() {
  useState(() => { seedDemoData(); });
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpGen, setOtpGen] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpErr, setOtpErr] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [jobs, setJobs] = useState<UpcomingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<UpcomingJob|null>(null);
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<{date:string;slot:string;job:UpcomingJob}|null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(() => {
    if (otpTimer > 0) {
      timerRef.current = setInterval(() => setOtpTimer(t => { if(t<=1){clearInterval(timerRef.current!);return 0;} return t-1; }), 1000);
    }
    return () => { if(timerRef.current) clearInterval(timerRef.current); };
  }, [otpTimer]);

  function handleSendOTP() {
    const c = phone.replace(/\D/g,"").slice(-10);
    if(c.length!==10){setError("Enter a valid 10-digit number.");return;}
    setError(""); setLoading(true);
    const g = generateOTP(); setOtpGen(g); sendOTPViaWhatsApp(c, g);
    setTimeout(() => { setLoading(false); setOtpTimer(120); setStep("otp"); }, 800);
  }

  function handleVerifyOTP() {
    if(otp.length!==6){setOtpErr("Enter the 6-digit OTP.");return;}
    const isDemoPhone = phone.replace(/[^0-9]/g,"").slice(-10)===DEMO_PHONE;
    if(otp!==otpGen && otp!==DEMO_OTP){setOtpErr("Incorrect OTP. Try again.");return;}
    // timer expiry disabled for demo
    setOtpErr(""); setStep("vehicle"); console.log("[OTP] Verified, isDemoPhone:", isDemoPhone, "phone:", phone);
  }

  function handleFindJobs() {
    if(vehicleReg.replace(/\s/g,"").length<4){setError("Enter a valid registration number.");return;}
    setError(""); setLoading(true);
    setTimeout(() => { setJobs(getJobsForVehicleAndPhone(phone, vehicleReg)); setLoading(false); setStep("jobs"); }, 600);
  }

  function handleConfirm() {
    if(!newDate||!newSlot||!selectedJob){setError("Select a date and time slot.");return;}
    setError(""); setLoading(true);
    const cleanPhone = phone.replace(/\D/g,"").slice(-10);
    setTimeout(() => {
      processIncomingMessage(cleanPhone,"RESCHEDULE","APP");
      setTimeout(() => {
        rescheduleService.resolveByPhone(cleanPhone,newDate,newSlot,"CUSTOMER_SELF_SERVE",selectedJob.jobId,"Customer self-serve via /buy page");
        setConfirmed({date:newDate,slot:newSlot,job:selectedJob}); setLoading(false); setStep("done");
      },300);
    },800);
  }

  const S: Record<string,React.CSSProperties> = {
    wrap:{maxWidth:480,margin:"0 auto",padding:"32px 20px",fontFamily:"Arial,sans-serif"},
    card:{background:"white",borderRadius:16,padding:28,boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #e8ecf0"},
    title:{fontSize:20,fontWeight:800,color:"#0f172a",marginBottom:6},
    sub:{fontSize:13,color:"#64748b",marginBottom:20},
    label:{fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,display:"block" as const},
    input:{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #d1d5db",fontSize:15,outline:"none",boxSizing:"border-box" as const},
    btn:{width:"100%",padding:"13px",borderRadius:10,background:"linear-gradient(135deg,#312e81,#4c1d95)",color:"white",fontWeight:700,fontSize:15,border:"none",cursor:"pointer",marginTop:8},
    btnOut:{width:"100%",padding:"13px",borderRadius:10,background:"transparent",color:"#4c1d95",fontWeight:700,fontSize:15,border:"2px solid #4c1d95",cursor:"pointer",marginTop:8},
    err:{color:"#dc2626",fontSize:12,marginTop:6},
    jobCard:{border:"1.5px solid #e2e8f0",borderRadius:12,padding:"14px 16px",marginBottom:10,cursor:"pointer"},
    slotBtn:{padding:"10px 14px",borderRadius:8,border:"1.5px solid #d1d5db",background:"white",fontSize:13,cursor:"pointer"},
  };

  return (
    <div style={S.wrap}>
      <div style={{background:"#1e1b4b",borderRadius:12,padding:"12px 16px",marginBottom:16,fontSize:12,color:"#a5b4fc",fontFamily:"monospace"}}>
        <div style={{fontWeight:700,color:"#c7d2fe",marginBottom:6}}>TEST CREDENTIALS</div>
        <div>Mobile: <strong style={{color:"#fde68a"}}>{DEMO_PHONE}</strong></div>
        <div>OTP: <strong style={{color:"#fde68a"}}>{DEMO_OTP}</strong></div>
        <div>Vehicle: <strong style={{color:"#fde68a"}}>{DEMO_VEHICLE}</strong></div>
        <div style={{marginTop:4,color:"#818cf8",fontSize:11}}>Use these to test the full reschedule flow</div>
      </div>
      {step==="phone" && (
        <div style={S.card}>
          <div style={S.title}>Reschedule Your Wash</div>
          <div style={S.sub}>Enter your registered mobile number to get started</div>
          <div style={{background:"#fef3c7",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#92400e"}}>
            ⚠️ Max 3 reschedules per booking. OTP sent to WhatsApp to verify identity.
          </div>
          <label style={S.label}>Mobile Number (WhatsApp)</label>
          <div style={{display:"flex",gap:8}}>
            <div style={{padding:"12px 14px",borderRadius:10,border:"1.5px solid #d1d5db",fontWeight:700,color:"#374151",whiteSpace:"nowrap" as const}}>+91</div>
            <input style={S.input} placeholder="9876543210" value={phone} maxLength={10} onChange={e=>{setPhone(e.target.value.replace(/\D/g,""));setError("");}} onKeyDown={e=>e.key==="Enter"&&handleSendOTP()} />
          </div>
          {error && <div style={S.err}>{error}</div>}
          <button style={S.btn} onClick={handleSendOTP} disabled={loading}>{loading?"Sending OTP…":"Send OTP on WhatsApp →"}</button>
        </div>
      )}

      {step==="otp" && (
        <div style={S.card}>
          <div style={S.title}>Verify Your Number</div>
          <div style={S.sub}>OTP sent to WhatsApp: +91 {phone}</div>
          <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#166534"}}>
            ✅ Check your WhatsApp for the 6-digit OTP.
          </div>
          <label style={S.label}>Enter OTP</label>
          <input style={{...S.input,fontSize:24,fontWeight:700,letterSpacing:12,textAlign:"center" as const}} placeholder="• • • • • •" value={otp} maxLength={6} onChange={e=>{setOtp(e.target.value.replace(/\D/g,""));setOtpErr("");}} onKeyDown={e=>e.key==="Enter"&&handleVerifyOTP()} />
          {otpErr && <div style={S.err}>{otpErr}</div>}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:12,color:"#64748b"}}>
            <span>{otpTimer>0?`Expires in ${otpTimer}s`:"OTP expired"}</span>
            {otpTimer===0 && <button style={{color:"#4c1d95",background:"none",border:"none",cursor:"pointer",fontWeight:700,fontSize:12}} onClick={()=>{const g=generateOTP();setOtpGen(g);setOtp("");setOtpErr("");sendOTPViaWhatsApp(phone.replace(/\D/g,"").slice(-10),g);setOtpTimer(120);}}>Resend OTP</button>}
          </div>
          <button style={S.btn} onClick={handleVerifyOTP}>Verify OTP →</button>
          <button style={S.btnOut} onClick={()=>{setStep("phone");setOtp("");setOtpErr("");}}>← Change Number</button>
        </div>
      )}

      {step==="vehicle" && (
        <div style={S.card}>
          <div style={S.title}>Enter Vehicle Number</div>
          <div style={S.sub}>We will find your upcoming scheduled washes</div>
          <label style={S.label}>Vehicle Registration Number</label>
          <input style={{...S.input,textTransform:"uppercase" as const,letterSpacing:3,fontWeight:700,fontSize:18}} placeholder="GJ 05 AK 1234" value={vehicleReg} onChange={e=>{setVehicleReg(e.target.value.toUpperCase());setError("");}} onKeyDown={e=>e.key==="Enter"&&handleFindJobs()} />
          <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>E.g. GJ05AK1234 or GJ-05-AK-1234</div>
          {error && <div style={S.err}>{error}</div>}
          <button style={S.btn} onClick={handleFindJobs} disabled={loading}>{loading?"Searching…":"Find My Bookings →"}</button>
        </div>
      )}

      {step==="jobs" && (
        <div style={S.card}>
          <div style={S.title}>Select Booking to Reschedule</div>
          <div style={S.sub}>{jobs.length>0?`${jobs.length} upcoming wash${jobs.length>1?"es":""} for ${vehicleReg}`:`No upcoming washes found for ${vehicleReg}`}</div>
          {jobs.length===0 && (
            <div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:10,padding:20,textAlign:"center" as const}}>
              <div style={{fontSize:14,fontWeight:700,color:"#9a3412"}}>No bookings found</div>
              <div style={{fontSize:12,color:"#c2410c",marginTop:6}}>Check the vehicle number or call +91 82387 05601.</div>
              <button style={{...S.btnOut,marginTop:12}} onClick={()=>setStep("vehicle")}>← Try Again</button>
            </div>
          )}
          {jobs.map(job => (
            <div key={job.jobId} style={S.jobCard} onClick={()=>{setSelectedJob(job);setStep("slot");}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{formatDate(job.scheduledDate)}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:4}}>🕐 {job.timeSlot} &nbsp; 📦 {job.packageName}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{job.vehicleReg}</div>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:"#4c1d95"}}>Reschedule →</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {step==="slot" && selectedJob && (
        <div style={S.card}>
          <div style={S.title}>Pick New Date & Slot</div>
          <div style={S.sub}>Current: {formatDate(selectedJob.scheduledDate)} · {selectedJob.timeSlot}</div>
          <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:13,color:"#0f172a"}}>{selectedJob.packageName} · {selectedJob.vehicleReg}</div>
          <label style={S.label}>New Date</label>
          <input type="date" style={{...S.input,marginBottom:16}} value={newDate} min={getMinDate()} onChange={e=>{setNewDate(e.target.value);setError("");}} />
          <label style={S.label}>New Time Slot</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {SLOTS.map(slot=>(
              <button key={slot} style={{...S.slotBtn,...(newSlot===slot?{border:"1.5px solid #4c1d95",background:"#f5f3ff",color:"#4c1d95",fontWeight:700}:{})}} onClick={()=>{setNewSlot(slot);setError("");}}>
                {slot}
              </button>
            ))}
          </div>
          {error && <div style={S.err}>{error}</div>}
          <button style={S.btn} onClick={handleConfirm} disabled={loading||!newDate||!newSlot}>{loading?"Confirming…":"Confirm Reschedule →"}</button>
          <button style={S.btnOut} onClick={()=>setStep("jobs")}>← Back</button>
        </div>
      )}

      {step==="done" && confirmed && (
        <div style={S.card}>
          <div style={{textAlign:"center" as const,marginBottom:20}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#16a34a,#22c55e)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:32}}>✅</div>
            <div style={{fontSize:22,fontWeight:800,color:"#0f172a"}}>Reschedule Confirmed!</div>
            <div style={{fontSize:13,color:"#64748b",marginTop:4}}>WhatsApp confirmation sent to your number.</div>
          </div>
          <div style={{background:"#f0fdf4",borderRadius:12,padding:16,marginBottom:16}}>
            {[["Date",formatDate(confirmed.date)],["Time",confirmed.slot],["Service",confirmed.job.packageName],["Vehicle",confirmed.job.vehicleReg]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}>
                <span style={{color:"#374151"}}>{k}</span><span style={{fontWeight:700}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{fontSize:12,color:"#64748b",textAlign:"center" as const,marginBottom:12}}>For changes call <strong>+91 82387 05601</strong></div>
          <button style={S.btn} onClick={()=>{setStep("phone");setPhone("");setOtp("");setVehicleReg("");setJobs([]);setSelectedJob(null);setNewDate("");setNewSlot("");}}>Reschedule Another Booking</button>
        </div>
      )}
    </div>
  );
}

export default RescheduleTab;

