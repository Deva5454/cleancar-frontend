// CustomerPlanPage.tsx — Premium Redesign v2
// Classy, colorful, interactive checkout with glassmorphism, gradients & animations

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useFinance } from "../../contexts/FinanceContext";
import { useCustomers } from "../../contexts/AppProvider";
import { useCustomerSubscriptions } from "../../contexts/AppProvider";
import { useCity } from "../../contexts/CityContext";
import { planSyncService } from "../../services/planSyncService";

// ─── CONFIG TYPES ─────────────────────────────────────────────────────────────
export interface PlanPageConfig {
  brand: { name: string; tagline: string; phone: string; whatsappNumber: string };
  hero: { badge: string; headline: string; headlineAccent: string; subheadline: string };
  trustItems: string[]; trustStrip: string[];
  vehicleCategories: VehicleCategoryConfig[];
  carModelMap: Record<string, string>;
  serviceablePincodes: { code: string; label: string }[];
  monthlyPlans: MonthlyPlanConfig[];
  packs: PackConfig[];
  commitments: CommitmentConfig[];
  addons: AddonConfig[];
  timeSlots: string[];
  postPaymentSteps: string[];
  comboBundles?: any[];
}
export interface VehicleCategoryConfig { id: string; label: string; icon: string; }
export interface MonthlyPlanConfig { id: string; name: string; icon: string; tagline: string; popular?: boolean; features: { text: string; included: boolean }[]; prices: Record<string, number>; }
export interface PackConfig { id: string; name: string; icon: string; price?: number; perLabel?: string; discount?: string; prices?: any; description?: string; validityDays?: number | null; perVisitLabel?: string; }
export interface CommitmentConfig { id: string; term: string; discountLabel: string; perk: string; highlight?: "best" | "great"; }
export interface AddonConfig { id: string; name: string; price: number; unit: string; description: string; prices?: Record<string, number>; }

export const DEFAULT_CONFIG: PlanPageConfig = {
  brand: { name: "249 Carwashing", tagline: "Daily car wash at your doorstep", phone: "+91 82387 05601", whatsappNumber: "918238705601" },
  hero: { badge: "🚗 Surat's #1 Daily Car Wash", headline: "Your car, clean", headlineAccent: "every single day.", subheadline: "Professional doorstep car wash — photos after every wash on WhatsApp." },
  trustItems: ["📸 Before & after photos","🔄 Free re-wash 24h","🏠 We come to you","📞 Cancel anytime"],
  trustStrip: ["🔒 Razorpay secured","📸 Before & after photos","🔄 Free re-wash 24h","📞 7-day cancellation","🏠 Home, office, society"],
  vehicleCategories: [
    { id: "hatchback", label: "Hatchback", icon: "🚗" },
    { id: "suv", label: "SUV / Sedan", icon: "🚙" },
    { id: "luxury", label: "Luxury SUV", icon: "🏎️" },
  ],
  carModelMap: {
    swift:"hatchback",baleno:"hatchback",i20:"hatchback",tiago:"hatchback",dzire:"hatchback",alto:"hatchback",wagon:"hatchback",figo:"hatchback",polo:"hatchback",jazz:"hatchback",amaze:"hatchback",tigor:"hatchback",
    creta:"suv",innova:"suv",ertiga:"suv",thar:"suv",xuv300:"suv",seltos:"suv",venue:"suv",nexon:"suv",ecosport:"suv",city:"suv",ciaz:"suv",verna:"suv",brezza:"suv",kushaq:"suv",slavia:"suv",
    fortuner:"luxury",xuv700:"luxury",meridian:"luxury",scorpio:"luxury",endeavour:"luxury",harrier:"luxury",safari:"luxury",gloster:"luxury",hilux:"luxury",crysta:"luxury",
  },
  serviceablePincodes: [
    {code:"395007",label:"Vesu / Pal"},{code:"395005",label:"Piplod / Citylight"},
    {code:"395009",label:"Adajan"},{code:"395010",label:"Bhatar / Katargam"},
    {code:"395004",label:"Varachha"},{code:"395006",label:"Udhna / Sagrampura"},
    {code:"395003",label:"Athwa / Ring Road"},{code:"395001",label:"Nanpura / Ghod Dod"},
    {code:"395002",label:"Rander / Jahangirpura"},{code:"394510",label:"Althan / Dumas Road"},
  ],
  monthlyPlans: [
    { id:"water", name:"Express Wash", icon:"⚡", tagline:"Clean every morning before you wake up",
      popular:false, features:[{text:"Exterior rinse & wipe",included:true},{text:"Tyre & rim wipe",included:true},{text:"Wiper fluid top-up",included:true},{text:"Before & after photo",included:true},{text:"Shampoo wash",included:false},{text:"Interior clean",included:false}],
      prices:{hatchback:1249,suv:1499,luxury:1999} },
    { id:"shampoo", name:"Smart Wash", icon:"✨", tagline:"Full shampoo wash, showroom fresh daily",
      popular:true, features:[{text:"Full shampoo exterior",included:true},{text:"Tyre & rim scrub",included:true},{text:"Wiper fluid top-up",included:true},{text:"Before & after photo",included:true},{text:"Interior wipe-down",included:true},{text:"Wax polish",included:false}],
      prices:{hatchback:1599,suv:1999,luxury:2699} },
    { id:"wax", name:"Elite Wash", icon:"👑", tagline:"Premium daily care — showroom feel every day",
      popular:false, features:[{text:"Full shampoo wash",included:true},{text:"Hand wax polish",included:true},{text:"Interior deep wipe",included:true},{text:"Before & after photo",included:true},{text:"Priority time slot",included:true},{text:"Monthly tyre dressing",included:true}],
      prices:{hatchback:1999,suv:2499,luxury:3499} },
  ],
  packs: [
    { id:"onetime", name:"One-Time", icon:"1️⃣", description:"Single visit. No expiry. Pay & book on the day.", prices:{waterWash:{hatchback:199,suv:299,luxury:399},shampoo:{hatchback:299,suv:349,luxury:499},shampooWax:{hatchback:399,suv:499,luxury:699}}, discount:"Standard rate", validityDays:null },
    { id:"pack2",   name:"Pack of 2", icon:"🔁", description:"2 visits · 8% off single price · Valid 20 days · Mix wash types · 1 car only", prices:{waterWash:{hatchback:370,suv:550,luxury:730},shampoo:{hatchback:550,suv:640,luxury:920},shampooWax:{hatchback:730,suv:920,luxury:1290}}, discount:"8% off", validityDays:20 },
    { id:"pack4",   name:"Pack of 4", icon:"📅", description:"4 visits · 15% off single price · Valid 30 days · Mix wash types · 1 car only", prices:{waterWash:{hatchback:680,suv:1020,luxury:1360},shampoo:{hatchback:1020,suv:1180,luxury:1700},shampooWax:{hatchback:1360,suv:1700,luxury:2380}}, discount:"15% off", validityDays:30 },
  ],
  commitments: [
    {id:"monthly",  term:"Month to Month",discountLabel:"No lock-in", perk:"Cancel anytime. 7 days' notice."},
    {id:"3month",   term:"3 Months",      discountLabel:"5% off",     perk:"₹225 saving on Hatchback Shampoo."},
    {id:"6month",   term:"6 Months",      discountLabel:"10% off",    perk:"Renewal + free vacuum monthly.", highlight:"great"},
    {id:"12month",  term:"12 Months",     discountLabel:"18% off",    perk:"Vacuum + tyre dressing + priority.", highlight:"best"},
  ],
  comboBundles: [
    {id:"andar-se-sundar", name:"Andar Se Sundar 🌟", addonIds:["vacuum","dashboard"], prices:{hatchback:299,suv:399,luxury:549}, savings:{hatchback:49,suv:49,luxury:49}},
    {id:"showroom-shine",  name:"Showroom Shine Pack ✨", addonIds:["waxpolish","vacuum","dashboard"], prices:{hatchback:849,suv:1099,luxury:1399}, savings:{hatchback:198,suv:248,luxury:348}},
  ],
  addons: [
    {id:"vacuum",    name:"Interior Deep Vacuum",     price:199,unit:"per visit",prices:{hatchback:199,suv:249,luxury:349},description:"Seats, mats, footwells & boot area cleaned"},
    {id:"dashboard", name:"Dashboard & Console",      price:149,unit:"per visit",prices:{hatchback:149,suv:199,luxury:249},description:"Dashboard polish, console & door pads"},
    {id:"tyre",      name:"Tyre Dressing (all 4)",    price:99, unit:"per visit",prices:{hatchback:99,suv:149,luxury:199},description:"Shine & protect all 4 tyres & mudguards"},
    {id:"waxpolish", name:"Full Hand Wax Polish",     price:199,unit:"per visit",prices:{hatchback:199,suv:249,luxury:399},description:"Panel-by-panel wax. Outer body only."},
    {id:"underbody", name:"Underbody Wash",           price:199,unit:"per visit",prices:{hatchback:199,suv:249,luxury:349},description:"Removes mud, grime & road salt"},
    {id:"enginebay", name:"Engine Bay Wipe-Down",     price:99, unit:"per visit",prices:{hatchback:99,suv:149,luxury:199},description:"Dry blow — removes dust safely"},
    {id:"fragrance", name:"Car Fragrance",            price:49, unit:"per visit",prices:{hatchback:49,suv:49,luxury:49},  description:"Fresh interior fragrance spray"},
  ],
  timeSlots: ["Early morning (5am – 7am)","Morning (7am – 9am)","Late morning (9am – 11am)","Afternoon (11am – 1pm)","Evening (5pm – 7pm)"],
  postPaymentSteps: ["Receipt on WhatsApp immediately","Confirmation call within 1 working day","Service starts within 2 working days","Before & after photos after every wash"],
};

function loadConfig(): PlanPageConfig {
  try { const r = localStorage.getItem("cleancar_plan_page_config"); if (r) return {...DEFAULT_CONFIG,...JSON.parse(r)}; } catch {}
  return DEFAULT_CONFIG;
}

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');

  .cpp-root * { box-sizing: border-box; }
  .cpp-root { font-family: 'Sora', sans-serif; }

  .cpp-input {
    width: 100%; padding: 14px 16px; border-radius: 12px; font-size: 15px;
    font-family: 'Sora', sans-serif; transition: all 0.2s; background: rgba(255,255,255,0.9);
    border: 2px solid rgba(148,163,184,0.3); color: #0f172a; outline: none;
    backdrop-filter: blur(8px);
  }
  .cpp-input:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.15); }

  .cpp-card {
    border-radius: 18px; padding: 20px; cursor: pointer;
    border: 2px solid transparent; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    background: rgba(255,255,255,0.85); backdrop-filter: blur(12px);
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .cpp-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.12); }
  .cpp-card.selected {
    border-color: #6366f1; background: linear-gradient(135deg, #eef2ff 0%, #f0fdff 100%);
    box-shadow: 0 0 0 4px rgba(99,102,241,0.2), 0 8px 24px rgba(99,102,241,0.15);
    transform: translateY(-2px);
  }
  .cpp-card.gold-selected {
    border-color: #f59e0b; background: linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%);
    box-shadow: 0 0 0 4px rgba(245,158,11,0.2), 0 8px 24px rgba(245,158,11,0.15);
  }

  .cpp-btn-primary {
    padding: 15px 36px; border-radius: 50px; border: none; cursor: pointer;
    font-family: 'Sora', sans-serif; font-weight: 700; font-size: 15px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; transition: all 0.2s;
    box-shadow: 0 6px 20px rgba(99,102,241,0.4);
  }
  .cpp-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(99,102,241,0.5); }
  .cpp-btn-primary:active:not(:disabled) { transform: translateY(0); }
  .cpp-btn-primary:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; }

  .cpp-btn-ghost {
    padding: 14px 24px; border-radius: 50px; font-family: 'Sora', sans-serif;
    font-weight: 600; font-size: 14px; cursor: pointer;
    background: transparent; color: #64748b;
    border: 2px solid rgba(148,163,184,0.4); transition: all 0.2s;
  }
  .cpp-btn-ghost:hover { background: rgba(99,102,241,0.06); border-color: #6366f1; color: #6366f1; }

  .cpp-step-in { animation: stepIn 0.35s cubic-bezier(0.34, 1.2, 0.64, 1); }
  @keyframes stepIn { from { opacity: 0; transform: translateX(24px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }

  .cpp-pulse { animation: pulse-glow 2s infinite; }
  @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 0 8px rgba(99,102,241,0); } }

  .cpp-shimmer { position: relative; overflow: hidden; }
  .cpp-shimmer::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shimmer 2s infinite;
  }
  @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }

  .cpp-price-change { animation: priceFlash 0.4s ease; }
  @keyframes priceFlash { 0% { transform: scale(1.2); color: #10b981; } 100% { transform: scale(1); } }

  .cpp-checkbox-custom {
    width: 20px; height: 20px; border-radius: 6px; border: 2px solid #cbd5e1;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    transition: all 0.2s; flex-shrink: 0; background: white;
  }
  .cpp-checkbox-custom.checked { background: linear-gradient(135deg,#6366f1,#8b5cf6); border-color: #6366f1; }

  .cpp-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }

  .cpp-modal-enter { animation: modalIn 0.25s cubic-bezier(0.34, 1.3, 0.64, 1); }
  @keyframes modalIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

  .cpp-confetti-piece {
    position: fixed; width: 10px; height: 10px; border-radius: 2px;
    animation: confettiFall 3s ease-out forwards;
  }
  @keyframes confettiFall {
    0% { transform: translateY(-20px) rotate(0); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }

  @media (max-width: 900px) {
    .cpp-layout { grid-template-columns: 1fr !important; }
    .cpp-cost-panel { position: static !important; margin-bottom: 24px; }
    .cpp-plan-grid { grid-template-columns: 1fr !important; }
    .cpp-commit-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 600px) {
    .cpp-commit-grid { grid-template-columns: 1fr !important; }
    .cpp-vehicle-grid { grid-template-columns: 1fr !important; }
    .cpp-addon-grid { grid-template-columns: 1fr !important; }
  }
`;

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
function Confetti() {
  const colours = ["#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4","#f97316"];
  const pieces = Array.from({length:60},(_,i) => ({
    id:i, left:`${Math.random()*100}vw`, delay:`${Math.random()*2}s`,
    color:colours[i%colours.length], size:`${6+Math.random()*10}px`,
  }));
  return (
    <>
      {pieces.map(p => (
        <div key={p.id} className="cpp-confetti-piece" style={{left:p.left,top:"-20px",animationDelay:p.delay,width:p.size,height:p.size,background:p.color}} />
      ))}
    </>
  );
}

// ─── STEP BAR ─────────────────────────────────────────────────────────────────
const STEPS = ["Your Car","Area","Plan","Add-ons","Details","Review"];
function StepBar({step, goTo}: {step:number; goTo:(n:number)=>void}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:0,padding:"12px 24px",overflowX:"auto"}}>
      {STEPS.map((label,i) => {
        const n=i+1, done=n<step, active=n===step;
        return (
          <React.Fragment key={n}>
            <button onClick={()=>done&&goTo(n)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"none",border:"none",cursor:done?"pointer":"default",borderRadius:10,transition:"all 0.2s",opacity:done||active?1:0.45}}>
              <div style={{
                width:28,height:28,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:12,fontWeight:800,transition:"all 0.3s",
                background:done?"linear-gradient(135deg,#10b981,#059669)":active?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(148,163,184,0.25)",
                color:(done||active)?"white":"#94a3b8",
                boxShadow:active?"0 4px 12px rgba(99,102,241,0.4)":done?"0 4px 12px rgba(16,185,129,0.35)":"none",
              }}>
                {done?"✓":n}
              </div>
              <span style={{fontSize:12,fontWeight:active?700:500,whiteSpace:"nowrap",color:active?"#4f46e5":done?"#059669":"#94a3b8"}}>{label}</span>
            </button>
            {i<STEPS.length-1 && (
              <div style={{flex:1,height:2,minWidth:12,borderRadius:2,background:n<step?"linear-gradient(90deg,#10b981,#6366f1)":"rgba(148,163,184,0.2)",transition:"all 0.5s"}} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── LIVE COST PANEL ─────────────────────────────────────────────────────────
function CostPanel({step,activeCat,vehicleCategories,selectedPlan,planMode,selectedPack,planPrice,packPrice,addons,addonTotal,total,commitment,commitments,cfg,vehicleCat,basePrice,couponDiscount=0,referralDiscount=0,promoDiscount=0,couponCode,referralCode,commitMonths=1,addonFreqMonth=4,addonGrandTotal=0}: any) {
  const planObj = cfg.monthlyPlans.find((p:any)=>p.id===selectedPlan);
  const catIcon = vehicleCategories.find((c:any)=>c.id===activeCat)?.icon||"🚗";
  const catLabel = vehicleCategories.find((c:any)=>c.id===activeCat)?.label;
  const commitObj = commitments.find((c:any)=>c.id===commitment);
  const discountPct = commitment==="3month"?5:commitment==="6month"?10:commitment==="12month"?18:0;
  const discountAmt = planMode==="monthly"?Math.round(planPrice*discountPct/100):0;
  const finalTotal = Math.max(0, total - discountAmt - (couponDiscount||0) - (referralDiscount||0) - (promoDiscount||0));
  const grandTotal = Math.round(finalTotal*1.18);
  const hasContent = activeCat||selectedPlan||addons.length>0;
  const prevTotal = useRef(grandTotal);
  const priceChanged = prevTotal.current !== grandTotal;
  useEffect(() => { prevTotal.current = grandTotal; }, [grandTotal]);

  return (
    <div className="cpp-cost-panel" style={{position:"sticky",top:80,borderRadius:24,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
      {/* Gradient header */}
      <div style={{background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)",padding:"24px 22px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}} />
        <div style={{position:"absolute",bottom:-20,left:-20,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}} />
        <div style={{fontSize:11,color:"rgba(199,210,254,0.7)",letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Order Summary</div>
        <div key={grandTotal} className={priceChanged?"cpp-price-change":""} style={{fontSize:36,fontWeight:800,color:"white",fontFamily:"'Playfair Display',serif",lineHeight:1}}>
          {inr(grandTotal>0?grandTotal:0)}
          {planMode==="monthly" && <span style={{fontSize:14,fontWeight:400,opacity:0.6,fontFamily:"'Sora',sans-serif"}}>{commitMonths>1?` total (${commitMonths} mo)`:"/month"}</span>}{planMode==="pack" && <span style={{fontSize:14,fontWeight:400,opacity:0.6,fontFamily:"'Sora',sans-serif"}}>{selectedPack==="onetime"?" (1 visit)":selectedPack==="pack2"?" (2 visits)":selectedPack==="pack4"?" (4 visits)":""}</span>}
        </div>
        {discountAmt>0 && (
          <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:6,background:"rgba(16,185,129,0.2)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:20,padding:"4px 10px"}}>
            <span style={{color:"#6ee7b7",fontSize:12,fontWeight:600}}>🎉 Saving {inr(discountAmt)} with {commitObj?.term}</span>
          </div>
        )}
        {finalTotal>0 && (
          <div style={{marginTop:8,fontSize:12,color:"rgba(199,210,254,0.6)"}}>incl. {inr(Math.round(finalTotal*0.18))} GST</div>
        )}
      </div>

      <div style={{background:"rgba(255,255,255,0.97)",backdropFilter:"blur(20px)",padding:"18px 22px"}}>
        {!hasContent && step<3 && (
          <div style={{textAlign:"center",padding:"28px 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>🛒</div>
            <div style={{color:"#94a3b8",fontSize:13}}>Your selections appear here</div>
          </div>
        )}

        {activeCat && (
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"linear-gradient(135deg,#f0f9ff,#eff6ff)",borderRadius:12,marginBottom:10}}>
            <span style={{fontSize:22}}>{catIcon}</span>
            <div>
              <div style={{fontSize:11,color:"#64748b"}}>Vehicle</div>
              <div style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{catLabel}</div>
            </div>
          </div>
        )}

        {planMode==="monthly" && selectedPlan && planPrice>0 && (
          <div style={{padding:"10px 12px",background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",borderRadius:12,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:11,color:"#64748b"}}>{commitMonths>1?`${commitMonths}-Month Subscription`:"Monthly Plan"}</div>
                <div style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{planObj?.icon} {planObj?.name}</div>
                {planMode==="monthly" && <div style={{fontSize:11,color:"#7c3aed"}}>₹{inr(planPrice)}/mo × {commitMonths} mo{commitMonths>1?` = ${inr(planPrice*commitMonths)}`:""}</div>}
              </div>
              <div style={{fontSize:16,fontWeight:800,color:"#4f46e5"}}>{inr(planMode==="monthly"?planPrice*commitMonths:planPrice)}</div>
            </div>
          </div>
        )}

        {planMode==="pack" && selectedPack && packPrice>0 && (
          <div style={{padding:"10px 12px",background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:12,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:11,color:"#64748b"}}>Visit Pack</div>
                <div style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{cfg.packs.find((p:any)=>p.id===selectedPack)?.name}</div>
              </div>
              <div style={{fontSize:16,fontWeight:800,color:"#059669"}}>{inr(packPrice)}</div>
            </div>
          </div>
        )}

        {planMode==="monthly" && commitment!=="monthly" && (
          <div style={{padding:"8px 12px",background:"linear-gradient(135deg,#fffbeb,#fef3c7)",borderRadius:12,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:"#78350f"}}>{commitObj?.term}</span>
            <span className="cpp-badge" style={{background:"rgba(245,158,11,0.15)",color:"#b45309"}}>{commitObj?.discountLabel}</span>
          </div>
        )}

        {addons.length>0 && (
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>
              {planMode==="monthly"&&commitMonths>1?`Add-ons (${addonFreqMonth}×/mo × ${commitMonths} mo)`:"Add-ons"}
            </div>
            {addons.map((id:string)=>{
              const a=cfg.addons.find((x:any)=>x.id===id);
              const p=a?.prices?.[vehicleCat]??a?.price??0;
              // For monthly: multiply by visits/month × total months
              // For pack (one-time/pack2/pack4): just 1 visit price
              const totalP = planMode==="monthly" ? p*addonFreqMonth*commitMonths : p;
              return (
                <div key={id} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:"1px dashed rgba(148,163,184,0.2)"}}>
                  <span style={{color:"#475569"}}>+ {a?.name}{planMode==="monthly"&&commitMonths>1?` (${inr(p)}/visit)`:""}</span>
                  <span style={{color:"#1e293b",fontWeight:600}}>{inr(totalP)}</span>
                </div>
              );
            })}
            {planMode==="monthly"&&commitMonths>1 && <div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>Based on {addonFreqMonth} visit{addonFreqMonth>1?"s":""}/month over {commitMonths} months</div>}
          </div>
        )}

        {couponDiscount>0 && (
          <div style={{padding:"8px 12px",background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:12,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:"#065f46",fontWeight:600}}>🎟 Coupon {couponCode}</span>
            <span style={{fontSize:13,fontWeight:800,color:"#10b981"}}>-{inr(couponDiscount)}</span>
          </div>
        )}
        {referralDiscount>0 && (
          <div style={{padding:"8px 12px",background:"linear-gradient(135deg,#eff6ff,#dbeafe)",borderRadius:12,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:"#1e40af",fontWeight:600}}>🔗 Referral {referralCode}</span>
            <span style={{fontSize:13,fontWeight:800,color:"#3b82f6"}}>-{inr(referralDiscount)}</span>
          </div>
        )}
        {promoDiscount>0 && (
          <div style={{padding:"8px 12px",background:"linear-gradient(135deg,#fffbeb,#fef3c7)",borderRadius:12,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:"#92400e",fontWeight:600}}>🔥 Promo offer</span>
            <span style={{fontSize:13,fontWeight:800,color:"#d97706"}}>-{inr(promoDiscount)}</span>
          </div>
        )}
        {(planPrice>0||packPrice>0) && (
          <>
            <div style={{borderTop:"2px dashed rgba(148,163,184,0.2)",margin:"12px 0"}} />
            {discountAmt>0 && (
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,color:"#059669"}}>Commitment discount</span>
                <span style={{fontSize:12,color:"#059669",fontWeight:700}}>−{inr(discountAmt)}</span>
              </div>
            )}
            {/* Subtotal = base plan + addons before discounts */}
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:"#94a3b8"}}>Subtotal</span>
              <span style={{fontSize:12,color:"#64748b"}}>{inr(total)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:12,color:"#94a3b8"}}>GST (18%)</span>
              <span style={{fontSize:12,color:"#64748b"}}>{inr(Math.round(finalTotal*0.18))}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:"linear-gradient(135deg,#1e1b4b,#4c1d95)",borderRadius:12}}>
              <span style={{fontSize:14,color:"white",fontWeight:700}}>Grand Total</span>
              <span style={{fontSize:20,color:"white",fontWeight:800,fontFamily:"'Playfair Display',serif"}}>{inr(grandTotal)}</span>
            </div>
          </>
        )}
      </div>

      {/* Trust footer */}
      <div style={{background:"#f8fafc",padding:"12px 22px",borderTop:"1px solid #f1f5f9"}}>
        {["🔒 Razorpay secured payment","📸 Before & after photos","🔄 Free re-wash within 24h"].map(t=>(
          <div key={t} style={{fontSize:11,color:"#94a3b8",marginBottom:3,display:"flex",alignItems:"center",gap:4}}>{t}</div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION HEADING ─────────────────────────────────────────────────────────
function SectionHead({n,total,title,sub}: {n:number;total:number;title:string;sub:string}) {
  return (
    <div style={{marginBottom:28}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(99,102,241,0.35)"}}>{n}</div>
        <div style={{fontSize:11,color:"#6366f1",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Step {n} of {total}</div>
      </div>
      <h2 style={{fontSize:28,fontWeight:800,color:"#0f172a",margin:"0 0 6px",fontFamily:"'Playfair Display',serif",lineHeight:1.2}}>{title}</h2>
      <p style={{color:"#64748b",fontSize:14,margin:0,lineHeight:1.5}}>{sub}</p>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function CustomerPlanPage() {
  const [cfg, setCfg] = useState<PlanPageConfig>(loadConfig);
  const [step, setStep] = useState(1);
  const [carModel, setCarModel] = useState("");
  const [detectedCat, setDetectedCat] = useState<string|null>(null);
  const [catConfirmed, setCatConfirmed] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<"ok"|"waitlist"|null>(null);
  const [planMode, setPlanMode] = useState<"monthly"|"pack">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string|null>(null);
  const [selectedPack, setSelectedPack] = useState<string|null>(null);
  const [commitment, setCommitment] = useState("monthly");
  const [addons, setAddons] = useState<string[]>([]);
  const [addonFreq, setAddonFreq] = useState<Record<string,string>>({});
  const [addonFreqMonth, setAddonFreqMonth] = useState<number>(4); // visits/month for add-ons

  const [bundleFreq, setBundleFreq] = useState<Record<string,string>>({});
  const _washRef = useRef<string>("shampoo");
  const [, _forceWashRender] = useState(0);
  const setSelectedWashType = useCallback((v:string)=>{ _washRef.current=v; _forceWashRender(n=>n+1); },[]);
  const [custName,setCustName]=useState(""); const [custMobile,setCustMobile]=useState("");
  const [custEmail,setCustEmail]=useState(""); const [custReg,setCustReg]=useState("");
  const [custAddress,setCustAddress]=useState(""); const [prefTime,setPrefTime]=useState("");
  const [oneTimeDate,setOneTimeDate]=useState(""); const [oneTimeHour,setOneTimeHour]=useState("");
  const [parking,setParking]=useState<"dedicated"|"random">("dedicated");
  const [notifyPref,setNotifyPref]=useState<"whatsapp"|"email"|"both">("whatsapp");
  const [consentTerms,setConsentTerms]=useState(false); const [consentRefund,setConsentRefund]=useState(false); const [consentCancel,setConsentCancel]=useState(false);
  const [showTnC,setShowTnC]=useState<"terms"|"refund"|"cancel"|null>(null);
  const [isProcessing,setIsProcessing]=useState(false);
  const [generatedInvoice,setGeneratedInvoice]=useState<any>(null);
  const [showConfetti,setShowConfetti]=useState(false);
  // Coupon & referral
  const [couponInput,setCouponInput]=useState("");
  const [couponResult,setCouponResult]=useState<{valid:boolean;discount:number;error?:string;code?:string}|null>(null);
  const [referralInput,setReferralInput]=useState("");
  const [referralResult,setReferralResult]=useState<{valid:boolean;discount:number;error?:string;code?:string}|null>(null);
  // Auto-apply active promotions
  const activePromos = planSyncService.getActiveAutoPromotions();
  const promoDiscount = activePromos.reduce((s,p)=>{
    if(p.type==="percent") return s + Math.round((planMode==="monthly"?planPrice:packPrice)*p.value/100);
    if(p.type==="flat") return s + p.value;
    return s;
  }, 0);

  const { recordRevenue } = useFinance();
  const { addCustomer, customers } = useCustomers();
  const { createSubscription } = useCustomerSubscriptions();
  const { city } = useCity();

  useEffect(()=>{ const fn=()=>setCfg(loadConfig()); window.addEventListener("storage",fn); window.addEventListener("planConfigUpdated",fn); return()=>{ window.removeEventListener("storage",fn); window.removeEventListener("planConfigUpdated",fn); }; },[]);
  useEffect(()=>{ if(carModel.trim().length<2){setDetectedCat(null);setCatConfirmed(false);return;} const v=carModel.toLowerCase().trim(); let f:string|null=null; for(const[k,c] of Object.entries(cfg.carModelMap)){if(v.includes(k)){f=c;break;}} setDetectedCat(f||(carModel.trim().length>=3?"hatchback":null)); setCatConfirmed(false); },[carModel,cfg.carModelMap]);
  useEffect(()=>{ if(pincode.length!==6){setPincodeStatus(null);return;} setPincodeStatus(cfg.serviceablePincodes.some(p=>p.code===pincode)?"ok":"waitlist"); },[pincode,cfg.serviceablePincodes]);

  const activeCat = detectedCat;
  const catLabel = cfg.vehicleCategories.find(c=>c.id===activeCat)?.label||"";
  const vehicleCat = (()=>{ const c=(activeCat||"").toLowerCase(); if(c.includes("luxury")||c.includes("lux"))return"luxury"; if(c.includes("suv")||c.includes("muv")||c.includes("sedan"))return"suv"; return"hatchback"; })();
  const getAddonPrice=(id:string)=>{ const a=cfg.addons.find(a=>a.id===id); if(!a)return 0; const p=(a as any).prices; return p?(p[vehicleCat]??a.price):a.price; };
  const planPrice=useMemo(()=>{ if(!selectedPlan||!activeCat)return 0; return cfg.monthlyPlans.find(p=>p.id===selectedPlan)?.prices[activeCat]??0; },[selectedPlan,activeCat,cfg.monthlyPlans]);
  const packPrice=useMemo(()=>{ const p=cfg.packs.find(p=>p.id===selectedPack); if(!p)return 0; const n=(p as any).prices; if(n){const w=n[_washRef.current]??n.shampoo??n.waterWash??Object.values(n)[0]; if(w&&typeof w==="object"){const _c=vehicleCat; const cp=(w as any)[_c]??(w as any).hatchback??0; return typeof cp==="number"?cp:0;}} return typeof(p as any).price==="number"?(p as any).price:0; },[selectedPack,_washRef.current,cfg.packs,activeCat]);
  const addonTotal=useMemo(()=>{ const ind=addons.reduce((s,id)=>{ const inB=(cfg as any).comboBundles?.some((b:any)=>b.addonIds.includes(id)&&b.addonIds.every((bid:string)=>addons.includes(bid))); if(inB)return s; const f=addonFreq[id]?parseInt(addonFreq[id]):1; return s+getAddonPrice(id)*(isNaN(f)?1:f); },0); const bt=((cfg as any).comboBundles||[]).reduce((s:number,b:any)=>{ const aS=b.addonIds.every((id:string)=>addons.includes(id)); if(!aS)return s; const bp=b.prices?.[vehicleCat]??b.prices?.hatchback??0; const f=bundleFreq[b.id]?parseInt(bundleFreq[b.id]):1; return s+bp*(isNaN(f)?1:f); },0); return ind+bt; },[addons,addonFreq,bundleFreq,cfg.addons,selectedPlan,activeCat]);
  // Commitment duration only applies to monthly subscriptions, not visit packs
  const commitMonths = planMode==="monthly" ? (commitment==="3month"?3:commitment==="6month"?6:commitment==="12month"?12:1) : 1;
  // Monthly billing: total is planPrice × months (before discount)
  // Add-ons per visit × 4 washes/month × months = monthly addon cost × months
  const basePrice = planMode==="monthly" ? planPrice*commitMonths : packPrice;
  // Add-ons: user chooses visits/month; default 4 washes/month for monthly plans
  // Add-on billing:
  // Monthly plan: addon price/visit × visits/month × total months
  // Pack (one-time / pack2 / pack4): addon price × 1 (per visit, no month multiplier)
  const addonVisitsPerMonth = planMode==="monthly" ? (addonFreqMonth || 4) : 1;
  const addonGrandTotal = planMode==="monthly"
    ? addonTotal * addonVisitsPerMonth * commitMonths
    : addonTotal; // packs: just the per-visit addon price
  const total = basePrice + addonGrandTotal;
  const isOneTime=planMode==="pack"&&selectedPack==="onetime";
  const discountPct=commitment==="3month"?5:commitment==="6month"?10:commitment==="12month"?18:0;
  // Discount applies to base plan price only (not add-ons)
  const discountAmt=planMode==="monthly"?Math.round(planPrice*commitMonths*discountPct/100):0;
  const couponDiscount = couponResult?.valid ? (couponResult.discount||0) : 0;
  const referralDiscount = referralResult?.valid ? (referralResult.discount||0) : 0;
  const finalTotal = Math.max(0, total - discountAmt - couponDiscount - referralDiscount - promoDiscount);
  const step1Ok=!!activeCat&&carModel.trim().length>=2;
  const step2Ok = pincodeStatus !== null;
  const step2OkForPlanning = pincodeStatus === "ok" || pincodeStatus === "waitlist";
  const step3Ok=planMode==="monthly"?!!selectedPlan:!!selectedPack;
  const step5Ok=!!(custName&&custMobile&&custAddress&&(isOneTime?(oneTimeDate&&oneTimeHour):!!prefTime));
  const step6Ok=consentTerms&&consentRefund&&consentCancel;

  const PUBLIC_HOLIDAYS:string[]=useMemo(()=>{ try{const s=localStorage.getItem("cleancar_public_holidays");if(s)return JSON.parse(s);}catch{} return["2026-01-26","2026-03-25","2026-04-06","2026-04-14","2026-04-15","2026-05-01","2026-08-15","2026-10-02","2026-10-20","2026-11-01","2026-12-25"]; },[]);
  const isHoliday=(d:Date)=>d.getDay()===0||PUBLIC_HOLIDAYS.includes(d.toISOString().slice(0,10));
  const nextWorkingDay=(from:Date):Date=>{ const d=new Date(from); d.setDate(d.getDate()+1); while(isHoliday(d))d.setDate(d.getDate()+1); return d; };
  const nowCutoffInfo=()=>{ const n=new Date(),h=n.getHours(),m=n.getMinutes(),t=h*60+m; if(isHoliday(n)||t>=18*60+30)return{nextOnly:true,nwdMinHour:13}; if(t>=16*60)return{nextOnly:true,nwdMinHour:18}; return{nextOnly:false,nwdMinHour:13}; };
  const minOneTimeDate=useMemo(()=>{ const{nextOnly}=nowCutoffInfo(); return nextOnly?nextWorkingDay(new Date()).toISOString().slice(0,10):new Date().toISOString().slice(0,10); },[PUBLIC_HOLIDAYS]);
  const getOneTimeSlots=(ds:string):string[]=>{ if(!ds)return[]; const now=new Date(),nh=now.getHours(),ts=now.toISOString().slice(0,10),iT=ds===ts; const sl:string[]=[]; for(let h=5;h<=21;h++){const pH=String(h).padStart(2,"0")+":00"; if(iT){if(nh<10){if(h>=12)sl.push(pH);}else if(nh<16){if(h>=nh+4)sl.push(pH);}}else{const{nextOnly,nwdMinHour}=nowCutoffInfo();const nS=nextWorkingDay(now).toISOString().slice(0,10);if(nextOnly&&ds===nS){if(h>=nwdMinHour)sl.push(pH);}else{sl.push(pH);}}} return sl; };
  const handleOneTimeDateChange=(ds:string)=>{ setOneTimeDate(ds); const{nextOnly,nwdMinHour}=nowCutoffInfo(),nS=nextWorkingDay(new Date()).toISOString().slice(0,10); if(nextOnly&&ds===nS){setOneTimeHour(`${String(nwdMinHour).padStart(2,"0")}:00`);}else{setOneTimeHour("");} };

  const scrollRef=useRef<HTMLDivElement>(null);
  const goTo=useCallback((n:number)=>{ setStep(n); setTimeout(()=>scrollRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),50); },[]);

  const handleApplyCoupon = () => {
    const result = planSyncService.validateCoupon(couponInput.trim(), total, selectedPlan||undefined);
    setCouponResult(result.valid ? {...result, code:couponInput.trim().toUpperCase()} : result);
  };
  const handleApplyReferral = () => {
    const result = planSyncService.validateReferralCode(referralInput.trim(), total);
    setReferralResult(result.valid ? {...result, code:referralInput.trim().toUpperCase()} : result);
  };
  
  const handleSubmit=async()=>{
    setIsProcessing(true);
    try {
      const now=new Date();
      const invNum=`INV-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${Date.now().toString().slice(-6)}`;
      const nameParts=custName.trim().split(" "),firstName=nameParts[0]||custName,lastName=nameParts.slice(1).join(" ")||"—";
      const existing=customers.find(c=>c.phone===custMobile||(custEmail&&c.email===custEmail));
      let customerId:string;
      if(existing){customerId=existing.customerId;}
      else{const nc=addCustomer({firstName,lastName,email:custEmail||"",phone:custMobile,address:{line1:custAddress,area:cfg.serviceablePincodes.find(p=>p.code===pincode)?.label||pincode,city:"Surat",pinCode:pincode},vehicleDetails:activeCat?{category:activeCat,brand:carModel.split(" ")[0]||carModel,color:"",registrationNumber:custReg.toUpperCase()}:undefined,leadSource:"Website — Buy Page",status:"Active",tags:["web-signup"]}); customerId=nc.customerId;}
      const planObj=cfg.monthlyPlans.find(p=>p.id===selectedPlan),packObj=cfg.packs.find(p=>p.id===selectedPack);
      const renewalDate=new Date(now);renewalDate.setMonth(renewalDate.getMonth()+1);
      const sub=createSubscription({customerId,packageType:selectedPlan==="wax"?"Premium":selectedPlan==="shampoo"?"Standard":"Basic",packageName:planMode==="monthly"?(planObj?.name||selectedPlan||"Plan"):(packObj?.name||selectedPack||"Pack"),frequency:isOneTime?"One-Time":selectedPack==="pack2"?"Pack of 2":selectedPack==="pack4"?"Pack of 4":"One-time",status:"Active",startDate:now.toISOString().split("T")[0],renewalDate:renewalDate.toISOString().split("T")[0],pricing:{basePrice,discount:discountAmt,finalPrice:finalTotal,currency:"INR"},serviceDetails:{vehicleType:activeCat||"hatchback",addOns:addons,preferredTimeSlot:isOneTime?`${oneTimeDate} ${oneTimeHour}`:prefTime},billingCycle:"Monthly",paymentStatus:"Paid"});
      recordRevenue({customerId,subscriptionId:sub.subscriptionId,type:planMode==="monthly"?"Subscription":"One-Time",amount:finalTotal,receivedDate:now.toISOString().split("T")[0],paymentMethod:"UPI",invoiceNumber:invNum,status:"Received",cityId:city||"CITY-SURAT"});
      const invoice={invoiceNumber:invNum,invoiceDate:now.toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}),customerName:custName,customerPhone:custMobile,customerEmail:custEmail,vehicleReg:custReg,address:custAddress,pincode,items:[...(planMode==="monthly"?[{name:`${planObj?.name||selectedPlan} — Monthly Subscription (${catLabel})`,qty:1,rate:planPrice,amount:planPrice}]:[{name:`${packObj?.name||selectedPack} Pack`,qty:1,rate:packPrice,amount:packPrice}]),...addons.map(id=>{const a=cfg.addons.find(x=>x.id===id);return{name:a?.name||id,qty:1,rate:a?.price||0,amount:a?.price||0};})],subtotal:finalTotal,cgst:parseFloat((finalTotal*0.09).toFixed(2)),sgst:parseFloat((finalTotal*0.09).toFixed(2)),grandTotal:parseFloat((finalTotal*1.18).toFixed(2)),paymentMethod:"Razorpay (UPI/Card/NetBanking)",subscriptionId:sub.subscriptionId,customerId,notifyPref,commitment:planMode==="monthly"?(cfg.commitments.find(c=>c.id===commitment)?.term||commitment):"N/A"};
      setGeneratedInvoice(invoice);
      try{const st=JSON.parse(localStorage.getItem("cleancar_web_invoices")||"[]");st.unshift({...invoice,createdAt:now.toISOString(),status:"PAID"});localStorage.setItem("cleancar_web_invoices",JSON.stringify(st.slice(0,500)));}catch(_){}
      const waMsg=encodeURIComponent(`Hi ${firstName}! 🎉\n\nYour ${invoice.items[0].name} is confirmed!\n\nInvoice: ${invNum}\nAmount Paid: ₹${(invoice?.grandTotal??0).toLocaleString("en-IN")} (incl. GST)\n\nThank you for choosing ${cfg.brand.name}! 🚗✨`);
      if(notifyPref==="whatsapp"||notifyPref==="both"){(window as any)._pendingWAInvoice=`https://wa.me/${cfg.brand.whatsappNumber}?text=${waMsg}`;}
      // Redeem coupon/referral
      if(couponResult?.valid && couponResult.code) planSyncService.redeemCoupon(couponResult.code);
      if(referralResult?.valid && referralResult.code) planSyncService.convertReferral(referralResult.code, customerId, custName, finalTotal);
      setIsProcessing(false);
      setShowConfetti(true);
      setTimeout(()=>setShowConfetti(false),4000);
      goTo(7);
    } catch(err){setIsProcessing(false);alert("Something went wrong. Please try again.");}
  };

  // ── SUCCESS ──────────────────────────────────────────────────────────────
  if (step===7) {
    const inv = generatedInvoice;
    const custFirstName = inv?.customerName?.split(" ")[0] || "there";
    const planLine = inv?.items?.[0]?.name || "your plan";
    const isMonthly = planMode === "monthly";
    const isPack = planMode === "pack" && selectedPack !== "onetime";
    const isOneTimeBooked = planMode === "pack" && selectedPack === "onetime";
    const packVisits = selectedPack === "pack2" ? 2 : selectedPack === "pack4" ? 4 : 1;
    const packValidity = selectedPack === "pack2" ? 20 : selectedPack === "pack4" ? 30 : 0;
    const commitLabel = commitment === "3month" ? "3-Month" : commitment === "6month" ? "6-Month" : commitment === "12month" ? "12-Month" : "";
    const grandTotalRounded = Math.round(inv?.grandTotal ?? 0);

    // ── Contextual headline & subtitle
    const headline = isMonthly
      ? `${commitLabel ? commitLabel + " " : ""}Subscription Confirmed!`
      : isPack ? `Pack of ${packVisits} Activated!`
      : "One-Time Wash Booked!";

    const subheadline = isMonthly
      ? `Your ${planLine} starts within 2 working days`
      : isPack ? `Valid for ${packValidity} days · ${packVisits} visits to use`
      : `Scheduled for ${oneTimeDate} at ${oneTimeHour}`;

    const heroEmoji = isMonthly ? "🚗" : isPack ? "📦" : "🪣";
    const heroBg = isMonthly ? "linear-gradient(135deg,#1e40af,#6366f1)"
      : isPack ? "linear-gradient(135deg,#059669,#10b981)"
      : "linear-gradient(135deg,#d97706,#f59e0b)";

    // ── Contextual next steps
    const nextSteps: {icon:string;title:string;detail:string;color:string}[] =
      isMonthly ? [
        {icon:"📲",title:"Receipt on WhatsApp",detail:"Invoice sent immediately to your number",color:"#25d366"},
        {icon:"📞",title:"Confirmation call",detail:"Our team calls within 1 working day to confirm your time slot",color:"#6366f1"},
        {icon:"🚗",title:"Service begins",detail:`Your washer starts within 2 working days at your preferred time: ${prefTime}`,color:"#f59e0b"},
        {icon:"📸",title:"Before & after photos",detail:"WhatsApp photo after every wash. Ask for a re-wash within 24h if unsatisfied.",color:"#06b6d4"},
        {icon:"🔄",title:"Auto-renewal",detail:`Renews ${commitLabel ? "after " + commitLabel.toLowerCase().replace("-","").trim() : "monthly"}. Cancel anytime with 7 days notice.`,color:"#8b5cf6"},
      ] : isPack ? [
        {icon:"📲",title:"Pack receipt on WhatsApp",detail:"Invoice and pack details sent immediately",color:"#25d366"},
        {icon:"✅",title:`Pack of ${packVisits} is active`,detail:`Valid for ${packValidity} days from today. No rollover after expiry.`,color:"#10b981"},
        {icon:"📅",title:"Book each visit",detail:"WhatsApp us at least 2 hours before your preferred time. One visit per day.",color:"#6366f1"},
        {icon:"📸",title:"Photos after every visit",detail:"Before & after photos on WhatsApp when done",color:"#06b6d4"},
        {icon:"⚠️",title:"Pack rules",detail:"One vehicle only. Mix wash types freely. Pack cannot be split or shared.",color:"#f59e0b"},
      ] : [
        {icon:"📲",title:"Booking confirmed on WhatsApp",detail:"Full details sent immediately to your number",color:"#25d366"},
        {icon:"🚗",title:"Washer arrives",detail:`We'll be at your address on ${oneTimeDate} at ${oneTimeHour}`,color:"#6366f1"},
        {icon:"📸",title:"Before & after photos",detail:"Photos sent on WhatsApp when the wash is complete",color:"#06b6d4"},
        {icon:"🔄",title:"Free re-wash guarantee",detail:"Not satisfied? We redo it within 24 hours at no extra charge",color:"#10b981"},
      ];

    // ── WhatsApp message (contextual)
    const waServiceLine = isMonthly
      ? "\u23F0 Service starts within *2 working days* at your preferred time."
      : isPack
      ? `\u{1F4E6} Pack valid for *${packValidity} days*. WhatsApp us 2 hrs before each visit to book.`
      : `\u{1F4C5} Washer arrives on *${oneTimeDate} at ${oneTimeHour}*.`;

    const waMsg = encodeURIComponent(
      `Hi ${custFirstName}! \u{1F389}\n\n`
      + `Your booking with *${cfg.brand.name}* is confirmed!\n\n`
      + `\u{1F4CB} *Invoice:* ${inv?.invoiceNumber}\n`
      + `\u{1F697} *Vehicle:* ${inv?.vehicleReg || catLabel}\n`
      + `\u{1F4E6} *Plan:* ${planLine}\n`
      + `\u{1F4B0} *Amount Paid:* \u20B9${grandTotalRounded.toLocaleString("en-IN")} (incl. GST)\n`
      + `\u{1F4CD} *Address:* ${inv?.address}\n\n`
      + waServiceLine + `\n`
      + `\u{1F4F8} Before & after photos after every wash.\n\n`
      + `Thank you for choosing *${cfg.brand.name}*! \u{1F697}\u2728\n\n`
      + `For queries: ${cfg.brand.phone}`
    );

    return (
      <div className="cpp-root" style={{minHeight:"100vh",background:"linear-gradient(160deg,#0f172a,#1e1b4b 50%,#0c4a6e)",display:"flex",alignItems:"center",justifyContent:"center",padding:"32px 20px",position:"relative",overflow:"hidden"}}>
        <style>{GLOBAL_CSS}</style>
        {showConfetti && <Confetti />}
        <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"28px 28px"}} />

        <div style={{maxWidth:560,width:"100%",borderRadius:24,overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,0.4)"}}>
          {/* Hero band — colour changes per plan type */}
          <div style={{background:heroBg,padding:"28px 24px",textAlign:"center"}}>
            <div style={{width:68,height:68,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 12px",border:"2px solid rgba(255,255,255,0.3)"}}>{heroEmoji}</div>
            <h1 style={{fontSize:22,fontWeight:800,color:"white",margin:"0 0 6px",fontFamily:"'Playfair Display',serif"}}>{headline}</h1>
            <p style={{color:"rgba(255,255,255,0.82)",fontSize:13,margin:"0 0 16px"}}>{subheadline}</p>
            {/* Key summary strip */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[
                {label:"Invoice",value:inv?.invoiceNumber},
                {label:"Amount paid",value:`₹${grandTotalRounded.toLocaleString("en-IN")} incl. GST`},
                {label:"Vehicle",value:inv?.vehicleReg||catLabel},
                {label:isMonthly?(commitLabel?"Commitment":"Plan"):isPack?"Valid":"Date",value:isMonthly?(commitLabel||"Month-to-Month"):isPack?`${packValidity} days`:oneTimeDate},
              ].map(({label,value})=>(
                <div key={label} style={{background:"rgba(0,0,0,0.18)",borderRadius:8,padding:"7px 10px",textAlign:"left"}}>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",marginBottom:2,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>
                  <div style={{fontSize:11,fontWeight:700,color:"white"}}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Next steps */}
          <div style={{background:"rgba(255,255,255,0.97)",padding:"18px 22px"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#64748b",letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>What happens next</div>
            {nextSteps.map((st,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 12px",borderRadius:10,marginBottom:5,background:i===0?"linear-gradient(135deg,#f0fdf4,#dcfce7)":"#f8fafc",border:`1px solid ${i===0?"#86efac":"#f1f5f9"}`}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:st.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{st.icon}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{st.title}</div>
                  <div style={{fontSize:11,color:"#64748b",marginTop:2,lineHeight:1.4}}>{st.detail}</div>
                </div>
              </div>
            ))}

            {/* CTA buttons */}
            <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
              <a href={`https://wa.me/${cfg.brand.whatsappNumber}?text=${waMsg}`} target="_blank" rel="noreferrer"
                style={{flex:1,padding:"12px 16px",background:"linear-gradient(135deg,#25d366,#128c7e)",color:"white",borderRadius:50,fontWeight:700,fontSize:13,textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 6px 16px rgba(37,211,102,0.3)"}}>
                📲 WhatsApp Receipt
              </a>
              <button onClick={()=>{setStep(1);setCarModel("");setDetectedCat(null);setSelectedPlan(null);setSelectedPack(null);setAddons([]);setGeneratedInvoice(null);setCouponResult(null);setReferralResult(null);}}
                style={{flex:1,padding:"12px 16px",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",borderRadius:50,fontWeight:700,fontSize:13,border:"none",cursor:"pointer",boxShadow:"0 6px 16px rgba(99,102,241,0.3)"}}>
                {isOneTimeBooked?"Book Another Wash":"Buy Another Plan"}
              </button>
            </div>
            <div style={{textAlign:"center",marginTop:10,fontSize:11,color:"#94a3b8"}}>
              Queries? Call <a href={`tel:${cfg.brand.phone}`} style={{color:"#6366f1",fontWeight:600,textDecoration:"none"}}>{cfg.brand.phone}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ── PAGE BACKGROUND ───────────────────────────────────────────────────────
  return (
    <div ref={scrollRef} className="cpp-root" style={{minHeight:"100vh",background:"linear-gradient(160deg,#f0f4ff 0%,#faf5ff 35%,#f0fdff 70%,#fefce8 100%)"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Top bar */}
      <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)",padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 20px rgba(30,27,75,0.3)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#f59e0b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🚗</div>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"white",fontFamily:"'Playfair Display',serif"}}>249 Carwashing</div>
            <div style={{fontSize:10,color:"rgba(199,210,254,0.6)",letterSpacing:0.5}}>SECURE CHECKOUT</div>
          </div>
        </div>
        <div style={{display:"flex",gap:20,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"rgba(255,255,255,0.1)",borderRadius:20,border:"1px solid rgba(255,255,255,0.15)"}}>
            <span style={{fontSize:12}}>🔒</span>
            <span style={{fontSize:11,color:"rgba(199,210,254,0.8)",fontWeight:600}}>Razorpay Secured</span>
          </div>
          <a href={`tel:${cfg.brand.phone}`} style={{fontSize:13,color:"#a5b4fc",textDecoration:"none",fontWeight:700}}>{cfg.brand.phone}</a>
        </div>
      </div>

      {/* Step bar */}
      <div style={{background:"rgba(255,255,255,0.85)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(148,163,184,0.15)",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <StepBar step={step} goTo={goTo} />
        </div>
      </div>

      {/* Main layout */}
      <div className="cpp-layout" style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px",display:"grid",gridTemplateColumns:"1fr 380px",gap:32,alignItems:"start"}}>

        {/* Step content */}
        <div className="cpp-step-in" key={step}>

          {/* ── STEP 1 ────────────────────────────────────────────────────── */}
          {step===1 && (
            <div style={{background:"rgba(255,255,255,0.8)",backdropFilter:"blur(16px)",borderRadius:24,padding:"32px",border:"1px solid rgba(255,255,255,0.8)",boxShadow:"0 8px 32px rgba(99,102,241,0.08)"}}>
              <SectionHead n={1} total={6} title="Tell us about your car" sub="We'll detect your vehicle type automatically from the model name." />

              {/* Model input with glow */}
              <div style={{marginBottom:24}}>
                <label style={{display:"block",fontSize:13,fontWeight:700,color:"#374151",marginBottom:8}}>Car model or brand name</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:18}}>🚗</span>
                  <input className="cpp-input" value={carModel} onChange={e=>setCarModel(e.target.value)}
                    placeholder="Swift, Creta, Fortuner, Innova…"
                    style={{paddingLeft:48,border:`2px solid ${detectedCat?"#6366f1":"rgba(148,163,184,0.3)"}`,boxShadow:detectedCat?"0 0 0 4px rgba(99,102,241,0.1)":undefined}} />
                </div>
                {detectedCat && (
                  <div style={{marginTop:12,padding:"12px 16px",background:"linear-gradient(135deg,#eff6ff,#f5f3ff)",border:"2px solid #c7d2fe",borderRadius:14,display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:28}}>{cfg.vehicleCategories.find(c=>c.id===detectedCat)?.icon}</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#4338ca"}}>Detected: {cfg.vehicleCategories.find(c=>c.id===detectedCat)?.label}</div>
                      <div style={{fontSize:12,color:"#6366f1"}}>Tap below to change if incorrect</div>
                    </div>
                    <div style={{marginLeft:"auto",fontSize:20}}>✅</div>
                  </div>
                )}
              </div>

              {/* Vehicle type cards */}
              <div style={{marginBottom:24}}>
                <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:12}}>Or select your vehicle type</div>
                <div className="cpp-vehicle-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                  {cfg.vehicleCategories.map((cat,i)=>{
                    const gradients=["linear-gradient(135deg,#eff6ff,#dbeafe)","linear-gradient(135deg,#f0fdf4,#dcfce7)","linear-gradient(135deg,#fffbeb,#fef3c7)"];
                    const borders=["#6366f1","#10b981","#f59e0b"];
                    const selected=activeCat===cat.id;
                    return (
                      <div key={cat.id} className={`cpp-card ${selected?"selected":""}`}
                        onClick={()=>{setDetectedCat(cat.id);setCatConfirmed(true);setCarModel(prev=>prev||cat.id);}}
                        style={selected?{}:{background:gradients[i]}}>
                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:40,marginBottom:10,filter:selected?"drop-shadow(0 4px 8px rgba(99,102,241,0.4))":undefined}}>{cat.icon}</div>
                          <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{cat.label}</div>
                          {activeCat===cat.id && selectedPlan===null && (
                            <div style={{marginTop:8}}>
                              {cfg.monthlyPlans.map(p=>(
                                <div key={p.id} style={{fontSize:11,color:"#6366f1",fontWeight:600}}>{p.icon} from {inr(p.prices[cat.id])}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price preview banner */}
              {activeCat && (
                <div style={{marginBottom:28,padding:"16px 20px",background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:16,display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{fontSize:13,color:"rgba(199,210,254,0.8)",fontWeight:600,flexShrink:0}}>💡 Plans for your {catLabel}:</div>
                  {cfg.monthlyPlans.map(p=>(
                    <div key={p.id} style={{textAlign:"center"}}>
                      <div style={{fontSize:12,color:"rgba(199,210,254,0.7)"}}>{p.icon} {p.name}</div>
                      <div style={{fontSize:18,fontWeight:800,color:"white",fontFamily:"'Playfair Display',serif"}}>{inr(p.prices[activeCat])}</div>
                      <div style={{fontSize:10,color:"rgba(199,210,254,0.5)"}}>/month</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{display:"flex",justifyContent:"flex-end"}}>
                <button className="cpp-btn-primary" onClick={()=>goTo(2)} disabled={!step1Ok}>
                  Continue → {step1Ok&&<span style={{marginLeft:4}}>✓</span>}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 ────────────────────────────────────────────────────── */}
          {step===2 && (
            <div style={{background:"rgba(255,255,255,0.8)",backdropFilter:"blur(16px)",borderRadius:24,padding:"32px",border:"1px solid rgba(255,255,255,0.8)",boxShadow:"0 8px 32px rgba(99,102,241,0.08)"}}>
              <SectionHead n={2} total={6} title="Check your area" sub="Enter your 6-digit pincode to confirm we serve your location." />

              <div style={{marginBottom:28}}>
                <label style={{display:"block",fontSize:13,fontWeight:700,color:"#374151",marginBottom:8}}>Your Pincode</label>
                <div style={{position:"relative",maxWidth:300}}>
                  <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:18}}>📍</span>
                  <input className="cpp-input" value={pincode} onChange={e=>setPincode(e.target.value.replace(/\D/g,"").slice(0,6))}
                    placeholder="6-digit pincode"
                    style={{paddingLeft:48,fontSize:22,fontWeight:800,letterSpacing:6,border:`2px solid ${pincodeStatus==="ok"?"#10b981":pincodeStatus==="waitlist"?"#ef4444":"rgba(148,163,184,0.3)"}`,boxShadow:pincodeStatus==="ok"?"0 0 0 4px rgba(16,185,129,0.1)":pincodeStatus==="waitlist"?"0 0 0 4px rgba(239,68,68,0.1)":undefined}} />
                </div>
                {pincodeStatus==="ok" && (
                  <div style={{marginTop:14,padding:"14px 18px",background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"2px solid #86efac",borderRadius:14,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>✅</div>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:"#065f46"}}>Great news — we serve your area!</div>
                      <div style={{fontSize:12,color:"#059669",marginTop:2}}>{cfg.serviceablePincodes.find(p=>p.code===pincode)?.label}</div>
                    </div>
                  </div>
                )}
                {pincodeStatus==="waitlist" && (
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:"linear-gradient(135deg,#fff7ed,#ffedd5)",border:"2px solid #fed7aa",borderRadius:14}}>
                      <div style={{fontSize:28,flexShrink:0}}>⏳</div>
                      <div>
                        <div style={{fontSize:15,fontWeight:700,color:"#9a3412"}}>Monthly subscription not available here yet</div>
                        <div style={{fontSize:12,color:"#c2410c",marginTop:4}}>{"We're expanding soon! You'll be notified when monthly plans reach your area."}</div>
                      </div>
                    </div>
                    <div style={{marginTop:10,padding:"10px 14px",background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:10,border:"1px solid #86efac"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#065f46"}}>{"✅ One-time wash IS available at your location!"}</div>
                      <div style={{fontSize:12,color:"#059669",marginTop:2}}>{"We provide one-time washes all across Surat. Continue to choose a visit pack."}</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{marginBottom:28}}>
                <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:12}}>Tap your area</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {cfg.serviceablePincodes.map(p=>{
                    const sel=pincode===p.code;
                    return (
                      <button key={p.code} onClick={()=>setPincode(p.code)}
                        style={{padding:"8px 14px",borderRadius:50,border:`2px solid ${sel?"#6366f1":"rgba(148,163,184,0.3)"}`,background:sel?"linear-gradient(135deg,#eff6ff,#f5f3ff)":"rgba(255,255,255,0.8)",color:sel?"#4338ca":"#475569",fontSize:12,fontWeight:sel?700:500,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all 0.2s",boxShadow:sel?"0 4px 12px rgba(99,102,241,0.2)":undefined}}>
                        {sel?"📍 ":""}{p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{display:"flex",justifyContent:"space-between"}}>
                <button className="cpp-btn-ghost" onClick={()=>goTo(1)}>← Back</button>
                <button className="cpp-btn-primary" onClick={()=>goTo(3)} disabled={!step2OkForPlanning}>Continue → Plan</button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ────────────────────────────────────────────────────── */}
          {step===3 && (
            <div style={{background:"rgba(255,255,255,0.8)",backdropFilter:"blur(16px)",borderRadius:24,padding:"32px",border:"1px solid rgba(255,255,255,0.8)",boxShadow:"0 8px 32px rgba(99,102,241,0.08)"}}>
              <SectionHead n={3} total={6} title="Choose your plan" sub={pincodeStatus==="waitlist"?"Your area gets one-time visit washes now — monthly subscription launching soon!":"Monthly subscription for daily washes, or a visit pack."} />

              {pincodeStatus==="waitlist" && (
                <div style={{marginBottom:16,padding:"12px 16px",background:"linear-gradient(135deg,#fff7ed,#ffedd5)",border:"2px solid #fed7aa",borderRadius:14}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#9a3412"}}>📍 Monthly subscription not available in your pincode yet</div>
                  <div style={{fontSize:12,color:"#c2410c",marginTop:4}}>We only serve selected pincodes for monthly plans. One-time visit packs are available all across Surat — select Visit Packs below.</div>
                </div>
              )}
              {/* Mode toggle */}
              <div style={{display:"inline-flex",background:"rgba(241,245,249,0.8)",borderRadius:50,padding:4,marginBottom:28,gap:4,border:"1px solid rgba(148,163,184,0.2)"}}>
                {(["monthly","pack"] as const).map(m=>(
                  <button key={m} onClick={()=>setPlanMode(m)}
                    style={{padding:"10px 28px",borderRadius:50,border:"none",background:planMode===m?"linear-gradient(135deg,#6366f1,#8b5cf6)":"none",color:planMode===m?"white":"#64748b",fontWeight:planMode===m?700:500,fontSize:14,cursor:"pointer",fontFamily:"'Sora',sans-serif",boxShadow:planMode===m?"0 4px 14px rgba(99,102,241,0.35)":undefined,transition:"all 0.25s"}}>
                    {m==="monthly"?"🔄 Monthly Subscription":"📦 Visit Packs"}
                  </button>
                ))}
              </div>

              {/* Monthly plans */}
              {planMode==="monthly" && (
                <>
                  <div className="cpp-plan-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28,alignItems:"start"}}>
                    {cfg.monthlyPlans.map((plan,i)=>{
                      const price=plan.prices[activeCat||"hatchback"]||0;
                      const pw=Math.round(price/30);
                      const colors=[["#6366f1","#eff6ff","#c7d2fe"],["#8b5cf6","#f5f3ff","#ddd6fe"],["#f59e0b","#fffbeb","#fde68a"]];
                      const[ac,bg,br]=colors[i];
                      const sel=selectedPlan===plan.id;
                      return (
                        <div key={plan.id} className={`cpp-card ${sel?"selected":""}`}
                          onClick={()=>setSelectedPlan(plan.id)}
                          style={sel?{}:{background:`linear-gradient(160deg,${bg},white)`}}>
                          {plan.popular && <div style={{position:"absolute",top:-1,left:"50%",transform:"translateX(-50%)",background:`linear-gradient(135deg,${ac},#f59e0b)`,color:"white",fontSize:10,fontWeight:800,padding:"4px 14px",borderRadius:"0 0 10px 10px",letterSpacing:0.5,whiteSpace:"nowrap"}}>⭐ MOST POPULAR</div>}
                          <div style={{textAlign:"center",paddingTop:plan.popular?12:0}}>
                            <div style={{fontSize:36,marginBottom:8,filter:`drop-shadow(0 4px 8px ${ac}40)`}}>{plan.icon}</div>
                            <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:4}}>{plan.name}</div>
                            <div style={{fontSize:26,fontWeight:800,color:sel?"#4f46e5":ac,marginBottom:2,fontFamily:"'Playfair Display',serif"}}>{inr(price)}</div>
                            <div style={{fontSize:11,color:"#94a3b8",marginBottom:14}}>₹{pw}/wash · 30 washes/month</div>
                            <div style={{borderTop:`1px dashed ${br}`,paddingTop:10}}>
                              {plan.features.slice(0,5).map((f,fi)=>(
                                <div key={fi} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                                  <div style={{width:16,height:16,borderRadius:"50%",background:f.included?`linear-gradient(135deg,${ac},${ac}99)`:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                    <span style={{fontSize:9,color:f.included?"white":"#cbd5e1",fontWeight:800}}>{f.included?"✓":"×"}</span>
                                  </div>
                                  <span style={{fontSize:11,color:f.included?"#374151":"#94a3b8",textAlign:"left"}}>{f.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Commitment */}
                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#374151",marginBottom:12}}>How long will you commit?</div>
                    <div className="cpp-commit-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      {cfg.commitments.map(c=>{
                        const sel=commitment===c.id;
                        const isBest=c.highlight==="best";
                        return (
                          <div key={c.id} className={`cpp-card ${sel?(isBest?"gold-selected":"selected"):""}`}
                            onClick={()=>setCommitment(c.id)}
                            style={!sel&&isBest?{background:"linear-gradient(135deg,#fffbeb,#fff7ed)",border:"2px dashed #fcd34d"}:{}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                              <div style={{flex:1}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                                  <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{c.term}</div>
                                  {selectedPlan&&planPrice>0&&(()=>{const m=c.id==="3month"?3:c.id==="6month"?6:c.id==="12month"?12:1;const d=c.id==="3month"?5:c.id==="6month"?10:c.id==="12month"?18:0;const gross=planPrice*m;const disc=Math.round(gross*d/100);return m>1?(<div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:13,fontWeight:800,color:"#4f46e5"}}>{inr(gross-disc)}</div><div style={{fontSize:10,color:"#94a3b8",textDecoration:"line-through"}}>{inr(gross)}</div></div>):null;})()}
                                </div>
                                <div style={{fontSize:11,color:"#64748b",marginTop:2,lineHeight:1.4}}>{c.perk}</div>
                              </div>
                              <div style={{flexShrink:0,marginLeft:8}}>
                                <span className="cpp-badge" style={{background:isBest?"rgba(245,158,11,0.15)":sel?"rgba(99,102,241,0.15)":"rgba(148,163,184,0.1)",color:isBest?"#b45309":sel?"#4f46e5":"#64748b",fontWeight:700}}>
                                  {c.discountLabel}
                                </span>
                              </div>
                            </div>
                            {isBest && <div style={{marginTop:6,fontSize:10,fontWeight:800,color:"#d97706",letterSpacing:0.5}}>🏆 BEST VALUE</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Pack mode */}
              {planMode==="pack" && (
                <>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24,alignItems:"start"}}>
                    {cfg.packs.map((pack,i)=>{
                      const nested=(pack as any).prices;
                      let dp=0;
                      if(nested){const w=nested[_washRef.current]??nested.shampoo??nested.waterWash??Object.values(nested)[0]; if(w&&typeof w==="object")dp=(w as any)[vehicleCat]??(w as any).hatchback??0;}
                      if(!dp&&typeof(pack as any).price==="number")dp=(pack as any).price;
                      const colors=["#6366f1","#10b981","#f59e0b"];
                      const sel=selectedPack===pack.id;
                      return (
                        <div key={pack.id} className={`cpp-card ${sel?"selected":""}`} onClick={()=>setSelectedPack(pack.id)}>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontSize:32,marginBottom:8}}>{pack.icon}</div>
                            <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>{pack.name}</div>
                            {dp>0&&<div style={{fontSize:22,fontWeight:800,color:colors[i],fontFamily:"'Playfair Display',serif",margin:"6px 0"}}>{inr(dp)}</div>}
                            {dp>0&&pack.id!=="onetime"&&(
                              <div style={{fontSize:11,fontWeight:600,marginBottom:4,opacity:0.85,color:colors[i]}}>
                                {_washRef.current==="waterWash"?"💧 Water Wash":_washRef.current==="shampooWax"?"✨ Shampoo+Wax":"🧴 Shampoo"}
                              </div>
                            )}
                            {(pack as any).discount&&<span className="cpp-badge" style={{background:"rgba(16,185,129,0.12)",color:"#059669"}}>{(pack as any).discount}</span>}
                            {pack.id==="onetime"&&activeCat&&(
                              <div style={{marginTop:10,borderTop:"1px dashed #e2e8f0",paddingTop:8}}>
                                <div style={{fontSize:10,color:"#94a3b8",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>For your {vehicleCat==="suv"?"SUV / Sedan":vehicleCat==="luxury"?"Luxury SUV":"Hatchback"}</div>
                                {[["waterWash","💧 Water Wash"],["shampoo","🧴 Shampoo"],["shampooWax","✨ Shampoo+Wax"]].map(([wt,wlbl])=>{
                                  const np=(pack as any).prices;const wObj=np?.[wt];const p=wObj?.[vehicleCat]??wObj?.hatchback??0;
                                  const isSel=_washRef.current===wt;
                                  return p>0?(<div key={wt} onClick={(e)=>{e.stopPropagation();setSelectedWashType(wt as string);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px",borderRadius:6,background:isSel?"rgba(99,102,241,0.1)":"transparent",cursor:"pointer"}}><span style={{fontSize:11,color:isSel?"#4f46e5":"#64748b",fontWeight:isSel?700:400}}>{isSel?"✓ ":""}{wlbl}</span><span style={{fontSize:12,fontWeight:800,color:isSel?"#4f46e5":"#0f172a"}}>{inr(p)}</span></div>):null;
                                })}
                              </div>
                            )}
                            {pack.id!=="onetime"&&(
                              <div style={{marginTop:8}}>
                                {/* Full price table for pack2/pack4 */}
                                <div style={{fontSize:10,fontWeight:700,color:"#64748b",marginBottom:6,letterSpacing:0.3}}>
                                  {pack.id==="pack2"?"8% SAVING VS SINGLE VISIT":"15% SAVING VS SINGLE VISIT"}
                                </div>
                                {/* Prices for selected vehicle only */}
                                <div style={{fontSize:10,color:"#94a3b8",marginBottom:4,fontStyle:"italic"}}>
                                  For your {vehicleCat==="suv"?"SUV / Sedan":vehicleCat==="luxury"?"Luxury SUV":"Hatchback"}:
                                </div>
                                {[
                                  {wt:"waterWash", label:"💧 Water Wash",    icon:"💧"},
                                  {wt:"shampoo",   label:"🧴 Shampoo",        icon:"🧴"},
                                  {wt:"shampooWax",label:"✨ Shampoo + Wax",  icon:"✨"},
                                ].map(({wt,label})=>{
                                  const pr=(pack as any).prices?.[wt];
                                  const p=vehicleCat==="suv"?pr?.suv:vehicleCat==="luxury"?pr?.luxury:pr?.hatchback;
                                  if(!p) return null;
                                  const n=pack.id==="pack2"?2:4;
                                  const isSel=_washRef.current===wt;
                                  return (
                                    <div key={wt}
                                      onClick={(e)=>{e.stopPropagation();setSelectedWashType(wt);}}
                                      style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",marginBottom:3,borderRadius:6,cursor:"pointer",background:isSel?"rgba(99,102,241,0.1)":"rgba(0,0,0,0.03)",border:isSel?"1.5px solid #6366f1":"1.5px solid transparent",transition:"all 0.15s"}}>
                                      <span style={{fontSize:11,fontWeight:isSel?700:500,color:isSel?"#4338ca":"#374151"}}>
                                        {isSel&&<span style={{marginRight:4}}>✓</span>}{label}
                                      </span>
                                      <div style={{textAlign:"right"}}>
                                        <div style={{fontSize:13,fontWeight:800,color:isSel?"#4338ca":colors[i]}}>{inr(p)}</div>
                                        <div style={{fontSize:9,color:"#94a3b8"}}>{inr(Math.round(p/n))}/visit</div>
                                      </div>
                                    </div>
                                  );
                                })}
                                {/* Per-visit for selected */}
                                {(()=>{
                                  const pr=(pack as any).prices?.[_washRef.current];
                                  const pv=vehicleCat==="suv"?pr?.suv:vehicleCat==="luxury"?pr?.luxury:pr?.hatchback;
                                  const n=pack.id==="pack2"?2:4;
                                  const days=pack.id==="pack2"?20:30;
                                  return pv?(
                                    <div style={{marginTop:6,padding:"5px 8px",background:"rgba(16,185,129,0.08)",borderRadius:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                      <span style={{fontSize:10,color:"#065f46",fontWeight:600}}>{inr(Math.round(pv/n))}/visit · {pack.id==="pack2"?"2 visits":"4 visits"}</span>
                                      <span style={{fontSize:10,color:"#94a3b8"}}>Valid {days}d</span>
                                    </div>
                                  ):null;
                                })()}
                                <div style={{fontSize:9,color:"#94a3b8",marginTop:5,lineHeight:1.4}}>{(pack as any).description}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Pack T&C note */}
                  <div style={{marginTop:10,padding:"10px 14px",background:"rgba(248,250,252,0.9)",border:"1px solid #e2e8f0",borderRadius:10,fontSize:11,color:"#64748b",lineHeight:1.6}}>
                    <strong style={{color:"#374151"}}>Pack terms:</strong> Packs expire after validity period. No rollover. Visits can be mixed — e.g. one Water Wash + one Shampoo Wash. One visit per day. Pack is for <strong>one vehicle only</strong> and cannot be split.
                  </div>
                  {selectedPack&&(
                    <div style={{padding:"16px 20px",background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",borderRadius:16,marginBottom:24,border:"2px solid #ddd6fe"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#4338ca",marginBottom:10}}>Select wash type for this pack</div>
                      <div style={{display:"flex",gap:10}}>
                        {[["waterWash","💧 Water Wash"],["shampoo","🧴 Shampoo"],["shampooWax","✨ Shampoo + Wax"]].map(([id,lbl])=>(
                          <button key={id} onClick={()=>setSelectedWashType(id as string)}
                            style={{flex:1,padding:"10px 8px",borderRadius:10,border:`2px solid ${_washRef.current===id?"#6366f1":"rgba(148,163,184,0.3)"}`,background:_washRef.current===id?"white":"transparent",color:"#0f172a",fontWeight:_washRef.current===id?700:500,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",boxShadow:_washRef.current===id?"0 4px 12px rgba(99,102,241,0.2)":undefined,transition:"all 0.2s"}}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div style={{display:"flex",justifyContent:"space-between"}}>
                <button className="cpp-btn-ghost" onClick={()=>goTo(2)}>← Back</button>
                <button className="cpp-btn-primary" onClick={()=>goTo(4)} disabled={!step3Ok}>Continue → Add-ons</button>
              </div>
            </div>
          )}

          {/* ── STEP 4 ────────────────────────────────────────────────────── */}
          {step===4 && (
            <div style={{background:"rgba(255,255,255,0.8)",backdropFilter:"blur(16px)",borderRadius:24,padding:"32px",border:"1px solid rgba(255,255,255,0.8)",boxShadow:"0 8px 32px rgba(99,102,241,0.08)"}}>
              <SectionHead n={4} total={6} title="Enhance your wash" sub="Optional add-ons. For monthly plans, choose how many visits per month." />
              {planMode==="monthly" && addons.length>0 && (
                <div style={{marginBottom:20,padding:"14px 18px",background:"linear-gradient(135deg,#eff6ff,#f5f3ff)",border:"2px solid #c7d2fe",borderRadius:14}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#4338ca",marginBottom:10}}>📅 How many visits per month should add-ons apply?</div>
                  <div style={{fontSize:12,color:"#6366f1",marginBottom:12}}>Your plan includes 30 washes/month. Add-ons are billed per visit based on your selection below.</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {[1,2,4,8,15,30].map(v=>(
                      <button key={v} onClick={()=>setAddonFreqMonth(v)}
                        style={{padding:"8px 16px",borderRadius:50,border:`2px solid ${addonFreqMonth===v?"#6366f1":"rgba(148,163,184,0.3)"}`,background:addonFreqMonth===v?"linear-gradient(135deg,#6366f1,#8b5cf6)":"white",color:addonFreqMonth===v?"white":"#374151",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all 0.2s"}}>
                        {v}×/mo
                      </button>
                    ))}
                  </div>
                  <div style={{marginTop:10,fontSize:12,color:"#4338ca"}}>
                    Add-ons billed: <strong>{addonFreqMonth} visit{addonFreqMonth>1?"s":""}/month × {commitMonths} month{commitMonths>1?"s":""} = {addonFreqMonth*commitMonths} total visits</strong>
                  </div>
                </div>
              )}


              {/* Combos */}
              {(cfg as any).comboBundles && (
                <div style={{marginBottom:28}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <span style={{fontSize:16}}>🔥</span>
                    <span style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>Bundle Deals — Save More</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {((cfg as any).comboBundles||[]).map((b:any)=>{
                      const allSel=b.addonIds.every((id:string)=>addons.includes(id));
                      const bp=b.prices?.[vehicleCat]??b.prices?.hatchback??0;
                      const sv=b.savings?.[vehicleCat]??b.savings?.hatchback??0;
                      return (
                        <div key={b.id} className={`cpp-card ${allSel?"gold-selected":""}`}
                          onClick={()=>{ if(allSel){setAddons(p=>p.filter(id=>!b.addonIds.includes(id)));}else{setAddons(p=>[...new Set([...p,...b.addonIds])]);} }}
                          style={!allSel?{background:"linear-gradient(135deg,#fffbeb,#fff7ed)",border:"2px dashed #fcd34d"}:{}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                            <div>
                              <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{b.name}</div>
                              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{b.addonIds.join(" + ")}</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                              <div style={{fontSize:18,fontWeight:800,color:"#d97706",fontFamily:"'Playfair Display',serif"}}>{inr(bp)}</div>
                              <div style={{fontSize:11,fontWeight:700,color:"#10b981"}}>Save {inr(sv)}</div>
                            </div>
                          </div>
                          <div style={{marginTop:10,fontSize:12,color:allSel?"#4338ca":"#64748b",fontWeight:allSel?700:400}}>
                            {allSel?"✅ Bundle applied — tap to remove":"Tap to add both together"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Individual addons */}
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"#374151",marginBottom:12}}>Individual Add-ons</div>
                <div style={{display:"grid",gap:10}}>
                  {cfg.addons.map((addon,i)=>{
                    const price=addon.prices?.[vehicleCat]??addon.price;
                    const sel=addons.includes(addon.id);
                    const accentColors=["#6366f1","#8b5cf6","#ec4899","#06b6d4","#10b981","#f59e0b","#ef4444"];
                    const ac=accentColors[i%accentColors.length];
                    return (
                      <div key={addon.id}
                        onClick={()=>setAddons(p=>p.includes(addon.id)?p.filter(a=>a!==addon.id):[...p,addon.id])}
                        style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",border:`2px solid ${sel?ac:"rgba(148,163,184,0.25)"}`,borderRadius:14,cursor:"pointer",background:sel?`linear-gradient(135deg,${ac}10,${ac}06)`:"rgba(255,255,255,0.9)",transition:"all 0.2s",boxShadow:sel?`0 4px 16px ${ac}25`:"0 1px 4px rgba(0,0,0,0.04)"}}>
                        {/* Custom checkbox */}
                        <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${sel?ac:"rgba(148,163,184,0.4)"}`,background:sel?`linear-gradient(135deg,${ac},${ac}cc)`:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",boxShadow:sel?`0 2px 8px ${ac}40`:undefined}}>
                          {sel&&<span style={{color:"white",fontSize:13,fontWeight:800}}>✓</span>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{addon.name}</div>
                          <div style={{fontSize:11,color:"#64748b",marginTop:1}}>{addon.description}</div>
                          <div style={{fontSize:10,color:"#94a3b8",marginTop:2,textTransform:"uppercase",letterSpacing:0.5}}>{addon.unit}</div>
                        </div>
                        <div style={{fontSize:18,fontWeight:800,color:sel?ac:"#0f172a",fontFamily:"'Playfair Display',serif",flexShrink:0}}>{inr(price)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {addons.length===0&&<div style={{textAlign:"center",padding:"16px",color:"#94a3b8",fontSize:13,marginTop:12}}>No add-ons selected. You can skip this step.</div>}

              <div style={{display:"flex",justifyContent:"space-between",marginTop:28}}>
                <button className="cpp-btn-ghost" onClick={()=>goTo(3)}>← Back</button>
                <button className="cpp-btn-primary" onClick={()=>goTo(5)}>
                  Continue → Details {addons.length>0&&`(+${addons.length} add-on${addons.length>1?"s":""})`}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5 ────────────────────────────────────────────────────── */}
          {step===5 && (
            <div style={{background:"rgba(255,255,255,0.8)",backdropFilter:"blur(16px)",borderRadius:24,padding:"32px",border:"1px solid rgba(255,255,255,0.8)",boxShadow:"0 8px 32px rgba(99,102,241,0.08)"}}>
              <SectionHead n={5} total={6} title="Your details" sub="We'll confirm your booking and send updates to these contacts." />

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                {[
                  {label:"Full name *",value:custName,onChange:setCustName,placeholder:"Rajesh Patel",icon:"👤"},
                  {label:"Mobile number *",value:custMobile,onChange:setCustMobile,placeholder:"10-digit number",type:"tel",icon:"📱"},
                  {label:"Email address",value:custEmail,onChange:setCustEmail,placeholder:"Optional",type:"email",icon:"✉️"},
                  {label:"Vehicle registration",value:custReg,onChange:setCustReg,placeholder:"GJ05AB1234",icon:"🔢"},
                ].map(({label,value,onChange,placeholder,type,icon})=>(
                  <div key={label}>
                    <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6}}>{label}</label>
                    <div style={{position:"relative"}}>
                      <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15}}>{icon}</span>
                      <input className="cpp-input" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type||"text"} style={{paddingLeft:42}} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6}}>Full address *</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:14,top:14,fontSize:15}}>🏠</span>
                  <textarea className="cpp-input" value={custAddress} onChange={e=>setCustAddress(e.target.value)} placeholder="Building name, street, landmark…" rows={2} style={{paddingLeft:42,resize:"vertical",paddingTop:14}} />
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:8}}>Parking</label>
                  <div style={{display:"flex",gap:8}}>
                    {[["dedicated","🅿️ Dedicated"],["random","🔀 Shared"]].map(([val,lbl])=>(
                      <button key={val} onClick={()=>setParking(val as any)}
                        style={{flex:1,padding:"10px 8px",borderRadius:10,border:`2px solid ${parking===val?"#6366f1":"rgba(148,163,184,0.3)"}`,background:parking===val?"linear-gradient(135deg,#eff6ff,#f5f3ff)":"white",color:"#0f172a",fontWeight:parking===val?700:500,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all 0.2s"}}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:8}}>Updates via</label>
                  <div style={{display:"flex",gap:6}}>
                    {[["whatsapp","📲 WA"],["email","📧 Email"],["both","Both"]].map(([val,lbl])=>(
                      <button key={val} onClick={()=>setNotifyPref(val as any)}
                        style={{flex:1,padding:"10px 6px",borderRadius:10,border:`2px solid ${notifyPref===val?"#6366f1":"rgba(148,163,184,0.3)"}`,background:notifyPref===val?"linear-gradient(135deg,#eff6ff,#f5f3ff)":"white",color:"#0f172a",fontWeight:notifyPref===val?700:500,fontSize:11,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all 0.2s"}}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {!isOneTime?(
                <div style={{marginBottom:16}}>
                  <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:8}}>Preferred wash time *</label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {cfg.timeSlots.map(slot=>(
                      <button key={slot} onClick={()=>setPrefTime(slot)}
                        style={{padding:"11px 14px",borderRadius:10,border:`2px solid ${prefTime===slot?"#6366f1":"rgba(148,163,184,0.3)"}`,background:prefTime===slot?"linear-gradient(135deg,#eff6ff,#f5f3ff)":"rgba(255,255,255,0.9)",color:"#0f172a",fontWeight:prefTime===slot?700:500,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",textAlign:"left",transition:"all 0.2s",boxShadow:prefTime===slot?"0 4px 12px rgba(99,102,241,0.2)":undefined}}>
                        {prefTime===slot?"✓ ":""}{slot}
                      </button>
                    ))}
                  </div>
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                  <div>
                    <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6}}>Date *</label>
                    <input type="date" min={minOneTimeDate} value={oneTimeDate} onChange={e=>handleOneTimeDateChange(e.target.value)} className="cpp-input" />
                  {(()=>{
                    const now=new Date(),h=now.getHours(),dow=now.getDay();
                    if(dow===0){return <div style={{marginTop:8,padding:"10px 14px",background:"linear-gradient(135deg,#fff7ed,#ffedd5)",border:"2px solid #fed7aa",borderRadius:10,fontSize:12,color:"#9a3412"}}>🌞 <strong>Sunday:</strong> Orders placed today will be confirmed and scheduled from <strong>Monday morning</strong>. We'll call you to confirm your time slot.</div>;}
                    if(dow===6&&h>=14){return <div style={{marginTop:8,padding:"10px 14px",background:"linear-gradient(135deg,#fff7ed,#ffedd5)",border:"2px solid #fed7aa",borderRadius:10,fontSize:12,color:"#9a3412"}}>🌅 <strong>Saturday afternoon:</strong> Orders placed now will be confirmed on <strong>Monday</strong>. We'll call you to confirm the slot.</div>;}
                    if(h>=18){return <div style={{marginTop:8,padding:"10px 14px",background:"linear-gradient(135deg,#eff6ff,#dbeafe)",border:"2px solid #bfdbfe",borderRadius:10,fontSize:12,color:"#1e40af"}}>🌙 <strong>After-hours booking:</strong> Orders after 6:30 PM are scheduled for the <strong>next working day</strong>. We'll confirm your slot in the morning.</div>;}
                    if(h>=14){return <div style={{marginTop:8,padding:"10px 14px",background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"2px solid #86efac",borderRadius:10,fontSize:12,color:"#065f46"}}>✅ Same-day and next-day slots available for today.</div>;}
                    return null;
                  })()}
                  </div>
                  <div>
                    <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6}}>Time slot *</label>
                    <select value={oneTimeHour} onChange={e=>setOneTimeHour(e.target.value)} className="cpp-input">
                      <option value="">Select time</option>
                      {getOneTimeSlots(oneTimeDate).map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}


              {/* Coupon / Referral codes */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:12}}>🎟️ Have a coupon or referral code?</div>
                
                {/* Active auto-promotions banner */}
                {activePromos.length>0&&(
                  <div style={{marginBottom:12,padding:"10px 14px",background:"linear-gradient(135deg,#fffbeb,#fef3c7)",border:"2px solid #fcd34d",borderRadius:12}}>
                    {activePromos.map(p=>(
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}>
                        <span style={{fontSize:18}}>{p.badge}</span>
                        <div>
                          <div style={{fontWeight:700,color:"#92400e"}}>{p.name}</div>
                          <div style={{fontSize:12,color:"#d97706"}}>{p.type==="percent"?`${p.value}% off applied automatically`:p.type==="flat"?`₹${p.value} off applied automatically`:"Offer applied"} — {p.description}</div>
                        </div>
                        <div style={{marginLeft:"auto",fontWeight:800,color:"#d97706",fontSize:15}}>-₹{p.type==="percent"?Math.round((planMode==="monthly"?planPrice:packPrice)*p.value/100):p.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Coupon code */}
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <div style={{position:"relative",flex:1}}>
                    <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14}}>🎟️</span>
                    <input className="cpp-input" value={couponInput} onChange={e=>setCouponInput(e.target.value.toUpperCase())} placeholder="Coupon code (e.g. SAVE20)" style={{paddingLeft:36,fontFamily:"monospace",fontWeight:700,letterSpacing:2,border:`2px solid ${couponResult?.valid?"#10b981":couponResult?.error?"#ef4444":"rgba(148,163,184,0.3)"}`}} />
                  </div>
                  <button onClick={handleApplyCoupon} disabled={!couponInput.trim()} style={{padding:"12px 20px",background:couponResult?.valid?"#10b981":"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",border:"none",borderRadius:12,fontWeight:700,fontSize:13,cursor:couponInput.trim()?"pointer":"not-allowed",fontFamily:"'Sora',sans-serif",opacity:couponInput.trim()?1:0.6}}>Apply</button>
                </div>
                {couponResult&&(
                  <div style={{padding:"8px 12px",background:couponResult.valid?"#f0fdf4":"#fef2f2",border:`1px solid ${couponResult.valid?"#86efac":"#fca5a5"}`,borderRadius:8,fontSize:13,display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span>{couponResult.valid?"✅":"❌"}</span>
                    <span style={{color:couponResult.valid?"#065f46":"#991b1b",fontWeight:600}}>
                      {couponResult.valid?`Coupon applied — ₹${couponResult.discount} off your order`:couponResult.error}
                    </span>
                    {couponResult.valid&&<button onClick={()=>{setCouponResult(null);setCouponInput("");}} style={{marginLeft:"auto",background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:14}}>✕</button>}
                  </div>
                )}

                {/* Referral code */}
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <div style={{position:"relative",flex:1}}>
                    <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14}}>🔗</span>
                    <input className="cpp-input" value={referralInput} onChange={e=>setReferralInput(e.target.value.toUpperCase())} placeholder="Friend's referral code (e.g. RAHUL1234)" style={{paddingLeft:36,fontFamily:"monospace",fontWeight:700,letterSpacing:1,border:`2px solid ${referralResult?.valid?"#10b981":referralResult?.error?"#ef4444":"rgba(148,163,184,0.3)"}`}} />
                  </div>
                  <button onClick={handleApplyReferral} disabled={!referralInput.trim()} style={{padding:"12px 20px",background:referralResult?.valid?"#10b981":"linear-gradient(135deg,#f59e0b,#d97706)",color:"white",border:"none",borderRadius:12,fontWeight:700,fontSize:13,cursor:referralInput.trim()?"pointer":"not-allowed",fontFamily:"'Sora',sans-serif",opacity:referralInput.trim()?1:0.6}}>Apply</button>
                </div>
                {referralResult&&(
                  <div style={{padding:"8px 12px",background:referralResult.valid?"#f0fdf4":"#fef2f2",border:`1px solid ${referralResult.valid?"#86efac":"#fca5a5"}`,borderRadius:8,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
                    <span>{referralResult.valid?"🎁":"❌"}</span>
                    <span style={{color:referralResult.valid?"#065f46":"#991b1b",fontWeight:600}}>
                      {referralResult.valid?`Referral applied — ₹${referralResult.discount} off! You and your friend both benefit 🎉`:referralResult.error}
                    </span>
                    {referralResult.valid&&<button onClick={()=>{setReferralResult(null);setReferralInput("");}} style={{marginLeft:"auto",background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:14}}>✕</button>}
                  </div>
                )}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                <button className="cpp-btn-ghost" onClick={()=>goTo(4)}>← Back</button>
                <button className="cpp-btn-primary" onClick={()=>goTo(6)} disabled={!step5Ok}>Continue → Review</button>
              </div>
            </div>
          )}

          {/* ── STEP 6 ────────────────────────────────────────────────────── */}
          {step===6 && (
            <div style={{background:"rgba(255,255,255,0.8)",backdropFilter:"blur(16px)",borderRadius:24,padding:"32px",border:"1px solid rgba(255,255,255,0.8)",boxShadow:"0 8px 32px rgba(99,102,241,0.08)"}}>
              <SectionHead n={6} total={6} title="Review & Pay" sub="Confirm your order details and complete the payment." />

              {/* Order card */}
              <div style={{borderRadius:18,overflow:"hidden",marginBottom:24,boxShadow:"0 4px 20px rgba(0,0,0,0.08)"}}>
                {[
                  {icon:"🚗",label:"Vehicle",value:`${cfg.vehicleCategories.find(c=>c.id===activeCat)?.icon} ${catLabel}`,bg:"#eff6ff"},
                  {icon:"📍",label:"Area",value:`${cfg.serviceablePincodes.find(p=>p.code===pincode)?.label} — ${pincode}`,bg:"#f0fdf4"},
                  {icon:"📋",label:"Plan",value:selectedPlan?`${cfg.monthlyPlans.find(p=>p.id===selectedPlan)?.icon} ${cfg.monthlyPlans.find(p=>p.id===selectedPlan)?.name} — ${inr(planPrice)}/mo${commitMonths>1?" × "+commitMonths+"mo = "+inr(planPrice*commitMonths):""}`:`${cfg.packs.find(p=>p.id===selectedPack)?.name} — ${inr(packPrice)}`,bg:"#f5f3ff"},
                  ...(addons.length>0?[{icon:"✨",label:"Add-ons",value:addons.map(id=>cfg.addons.find(a=>a.id===id)?.name).join(", "),bg:"#fffbeb"}]:[]),
                  {icon:"👤",label:"Name",value:custName,bg:"#f8fafc"},
                  {icon:"📱",label:"Mobile",value:custMobile,bg:"#f8fafc"},
                  {icon:"⏰",label:"Time",value:isOneTime?`${oneTimeDate} at ${oneTimeHour}`:prefTime,bg:"#f8fafc"},
                ].map((row,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 18px",background:row.bg,borderBottom:"1px solid rgba(148,163,184,0.1)"}}>
                    <span style={{fontSize:18,flexShrink:0}}>{row.icon}</span>
                    <span style={{fontSize:12,color:"#64748b",width:70,flexShrink:0}}>{row.label}</span>
                    <span style={{fontSize:13,color:"#0f172a",fontWeight:600}}>{row.value}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",background:"linear-gradient(135deg,#1e1b4b,#4c1d95)"}}>
                  <div>
                    <div style={{fontSize:12,color:"rgba(199,210,254,0.6)"}}>Grand Total (incl. 18% GST)</div>
                    <div style={{fontSize:13,color:"rgba(199,210,254,0.5)"}}>Base {inr(finalTotal)} + Tax {inr(Math.round(finalTotal*0.18))}</div>
                  </div>
                  <div style={{fontSize:30,fontWeight:800,color:"white",fontFamily:"'Playfair Display',serif"}}>{inr(Math.round(finalTotal*1.18))}</div>
                </div>
              </div>

              {/* T&C */}
              <div style={{marginBottom:28}}>
                <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:12}}>Please confirm to proceed</div>
                {([
                  [consentTerms,setConsentTerms,"I accept the","Terms & Conditions","terms" as const,"#6366f1"],
                  [consentRefund,setConsentRefund,"I accept the","Refund Policy","refund" as const,"#10b981"],
                  [consentCancel,setConsentCancel,"I accept the","Cancellation Policy","cancel" as const,"#f59e0b"],
                ] as [boolean, React.Dispatch<React.SetStateAction<boolean>>, string, string, "terms"|"refund"|"cancel", string][]).map(([val,setter,pre,linkText,key,ac])=>(
                  <div key={key}
                    onClick={()=>setter(!val)}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:val?`linear-gradient(135deg,${ac}10,${ac}06)`:"rgba(248,250,252,0.8)",borderRadius:12,marginBottom:8,border:`2px solid ${val?ac+"60":"rgba(148,163,184,0.2)"}`,cursor:"pointer",transition:"all 0.2s"}}>
                    <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${val?ac:"rgba(148,163,184,0.4)"}`,background:val?`linear-gradient(135deg,${ac},${ac}cc)`:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                      {val&&<span style={{color:"white",fontSize:12,fontWeight:800}}>✓</span>}
                    </div>
                    <span style={{fontSize:13,color:"#374151"}} onClick={e=>e.stopPropagation()}>
                      {pre}{" "}
                      <button onClick={e=>{e.stopPropagation();setShowTnC(key);}}
                        style={{color:ac,fontWeight:700,background:"none",border:"none",cursor:"pointer",fontSize:13,fontFamily:"'Sora',sans-serif",padding:0,textDecoration:"underline"}}>
                        {linkText}
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <button className="cpp-btn-ghost" onClick={()=>goTo(5)}>← Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={!step6Ok||isProcessing}
                  style={{padding:"16px 44px",borderRadius:50,border:"none",cursor:(!step6Ok||isProcessing)?"not-allowed":"pointer",fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:16,background:(!step6Ok||isProcessing)?"#cbd5e1":"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",boxShadow:(!step6Ok||isProcessing)?"none":"0 8px 24px rgba(99,102,241,0.45)",transition:"all 0.2s",display:"flex",alignItems:"center",gap:10}}>
                  {isProcessing?(
                    <><div style={{width:18,height:18,border:"2px solid rgba(255,255,255,0.35)",borderTopColor:"white",borderRadius:"50%",animation:"spin 0.7s linear infinite"}} /> Processing…</>
                  ):(
                    <>🔒 Pay {inr(Math.round(finalTotal*1.18))} Securely</>
                  )}
                </button>
              </div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
        </div>

        {/* Right: Cost panel */}
        <div>
          <CostPanel step={step} activeCat={activeCat} vehicleCategories={cfg.vehicleCategories} selectedPlan={selectedPlan} planMode={planMode} selectedPack={selectedPack} planPrice={planPrice} packPrice={packPrice} addons={addons} addonTotal={addonTotal} total={total} commitment={commitment} commitments={cfg.commitments} cfg={cfg} vehicleCat={vehicleCat} basePrice={basePrice} couponDiscount={couponDiscount} referralDiscount={referralDiscount} promoDiscount={promoDiscount} couponCode={couponResult?.valid?couponResult.code:undefined} referralCode={referralResult?.valid?referralResult.code:undefined} commitMonths={commitMonths} addonFreqMonth={addonFreqMonth} addonGrandTotal={addonGrandTotal} />
        </div>
      </div>

      {/* T&C Modal */}
      {showTnC && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.7)",backdropFilter:"blur(6px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowTnC(null)}>
          <div className="cpp-modal-enter" style={{background:"white",borderRadius:24,padding:32,maxWidth:500,width:"100%",maxHeight:"75vh",overflow:"auto",boxShadow:"0 40px 80px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
            <h3 style={{marginTop:0,color:"#0f172a",fontFamily:"'Playfair Display',serif",fontSize:22}}>
              {showTnC==="terms"?"📋 Terms & Conditions":showTnC==="refund"?"💰 Refund Policy":"❌ Cancellation Policy"}
            </h3>
            <p style={{color:"#64748b",fontSize:14,lineHeight:1.7}}>
              {showTnC==="terms"&&"By subscribing to 249 Carwashing services, you agree to our service standards, usage policies, and payment terms. Services are subject to availability in your area. We reserve the right to reschedule in case of weather or operational constraints."}
              {showTnC==="refund"&&"Refunds are processed within 7 working days for cancelled subscriptions. Pro-rated refunds apply based on services already rendered. No refunds after 30 days from purchase. Add-ons are non-refundable once the visit has occurred."}
              {showTnC==="cancel"&&"You may cancel your subscription with 7 days' written notice via WhatsApp or email. No cancellation fee applies to month-to-month plans. Lock-in plans (3, 6, 12 months) may have different terms as specified at the time of purchase."}
            </p>
            <button onClick={()=>setShowTnC(null)} className="cpp-btn-primary" style={{marginTop:8}}>Got it, close</button>
          </div>
        </div>
      )}
    </div>
  );
}
