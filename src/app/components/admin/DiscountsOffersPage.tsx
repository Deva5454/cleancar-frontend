import { useState } from "react";

export function DiscountsOffersPage() {
  const [tab, setTab] = useState("coupons");
  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{margin:0,fontSize:20,fontWeight:800,color:"#111827"}}>Discounts and Offers</h1>
        <p style={{margin:"4px 0 0",fontSize:13,color:"#6B7280"}}>Manage coupons, promotions, referrals and price sync</p>
      </div>
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5E7EB",display:"flex",marginBottom:24}}>
        {["coupons","promotions","referrals","sync"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{padding:"14px 20px",border:"none",background:"transparent",cursor:"pointer",fontWeight:tab===t?700:500,fontSize:13,color:tab===t?"#2196F3":"#6B7280",borderBottom:tab===t?"3px solid #2196F3":"3px solid transparent",textTransform:"capitalize"}}>{t}</button>
        ))}
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:32,textAlign:"center",color:"#6B7280"}}>
        <div style={{fontSize:40,marginBottom:12}}>{tab==="coupons"?"🎟️":tab==="promotions"?"🔥":tab==="referrals"?"🔗":"🔄"}</div>
        <h2 style={{margin:"0 0 8px",color:"#111827",textTransform:"capitalize"}}>{tab}</h2>
        <p>Full {tab} management coming soon.</p>
      </div>
    </div>
  );
}
