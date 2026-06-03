import React, { useState } from "react";
import { planSyncService } from "../services/planSyncService";
import { toast } from "sonner";

export function DiscountsOffersPage() {
  const [activeTab, setActiveTab] = useState<"coupons"|"promotions"|"referrals"|"sync">("coupons");
  const tabs = [
    { id: "coupons", label: "Coupons" },
    { id: "promotions", label: "Promotions" },
    { id: "referrals", label: "Referrals" },
    { id: "sync", label: "Price Sync" },
  ] as const;
  return (
    <div style={{ fontFamily: "inherit", background: "#F3F4F6", minHeight: "100vh" }}>
      <div style={{ background: "#fff", borderBottom: "1.5px solid #E5E7EB", padding: "16px 24px" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Discounts & Offers</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>Manage coupons, promotions, referrals and price sync</p>
      </div>
      <div style={{ background: "#fff", borderBottom: "1.5px solid #E5E7EB", padding: "0 24px", display: "flex", gap: 0, overflowX: "auto" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: "14px 20px", border: "none", background: "transparent", cursor: "pointer", fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 13, color: activeTab === tab.id ? "#2196F3" : "#6B7280", borderBottom: activeTab === tab.id ? "3px solid #2196F3" : "3px solid transparent", whiteSpace: "nowrap" }}>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 24px 60px" }}>
        {activeTab === "coupons" && <div style={{ background: "#fff", borderRadius: 12, padding: 24 }}><h2>Coupon Codes</h2><p style={{ color: "#6B7280" }}>Coming soon - coupon management</p></div>}
        {activeTab === "promotions" && <div style={{ background: "#fff", borderRadius: 12, padding: 24 }}><h2>Promotions</h2><p style={{ color: "#6B7280" }}>Coming soon - promotions management</p></div>}
        {activeTab === "referrals" && <div style={{ background: "#fff", borderRadius: 12, padding: 24 }}><h2>Referral Program</h2><p style={{ color: "#6B7280" }}>Coming soon - referral management</p></div>}
        {activeTab === "sync" && <div style={{ background: "#fff", borderRadius: 12, padding: 24 }}><h2>Price Sync</h2><p style={{ color: "#6B7280" }}>Coming soon - price sync status</p></div>}
      </div>
    </div>
  );
}
