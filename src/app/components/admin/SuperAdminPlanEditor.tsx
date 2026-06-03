import React, { useState, useEffect } from "react";
/**
 * SuperAdminPlanEditor.tsx
 * Full editor for the customer-facing plan page.
 * Accessible only to Super Admin.
 *
 * Route: /admin/plan-page-editor
 *
 * Editable sections:
 *  1. Brand & Contact
 *  2. Hero (badge, headline, subheadline, trust items)
 *  3. Serviceable Pincodes
 *  4. Vehicle Categories
 *  5. Monthly Plan Prices (per category)
 *  6. Pack Prices
 *  7. Commitment Options
 *  8. Add-ons
 *  9. Time Slots
 * 10. Post-payment Steps
 * 11. Trust Strip Items
 *
 * Saves to localStorage key "cleancar_plan_page_config"
 * and dispatches "planConfigUpdated" event so CustomerPlanPage hot-reloads.
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { DEFAULT_CONFIG, type PlanPageConfig, type MonthlyPlanConfig, type AddonConfig, type PackConfig } from "../subscription/CustomerPlanPage";
import { BackButton } from "../ui/back-button";
import { planSyncService } from "../../services/planSyncService";

const STORAGE_KEY = "cleancar_plan_page_config";

function loadConfig(): PlanPageConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(cfg: PlanPageConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event("planConfigUpdated"));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

// â”€â”€â”€ Small reusable field components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Field = ({ label, value, onChange, type = "text", hint }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string;
}) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
    {hint && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>{hint}</p>}
  </div>
);

const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", cursor: "pointer", background: "#F9FAFB", borderBottom: open ? "1px solid #E5E7EB" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 15, color: "#111827" }}>
          <span>{icon}</span>{title}
        </div>
        <span style={{ color: "#6B7280", fontSize: 18 }}>{open ? "â–²" : "â–¼"}</span>
      </div>
      {open && <div style={{ padding: "20px" }}>{children}</div>}
    </div>
  );
};

// â”€â”€â”€ AddModelRow: small inline form to add a new car model â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AddModelRow({ categories, onAdd }: {
  categories: { id: string; label: string; icon: string }[];
  onAdd: (keyword: string, categoryId: string) => void;
}) {
  const [kw, setKw] = useState("");
  const [cat, setCat] = useState(categories[0]?.id || "hatchback");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const clean = kw.trim().toLowerCase().replace(/\s+/g, "");
    if (!clean) { setError("Enter a keyword"); return; }
    if (clean.length < 2) { setError("Keyword must be at least 2 characters"); return; }
    onAdd(clean, cat);
    setKw("");
    setError("");
    toast.success(`Added "${clean}" â†’ ${categories.find(c => c.id === cat)?.label}`);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px auto", gap: 8, alignItems: "center" }}>
        <div>
          <input
            value={kw}
            onChange={e => { setKw(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="e.g. punch, taisor, curvv"
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${error ? "#FCA5A5" : "#E5E7EB"}`, borderRadius: 8, fontSize: 14, fontFamily: "monospace", background: "#fff" }}
          />
          {error && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 3 }}>{error}</p>}
        </div>
        <select value={cat} onChange={e => setCat(e.target.value)}
          style={{ padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, background: "#fff", fontWeight: 600 }}>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
        <button onClick={handleAdd}
          style={{ padding: "9px 20px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          + Add
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAIN COMPONENT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function SuperAdminPlanEditor() {
  const { currentRole } = useRole();
  const [cfg, setCfg] = useState<PlanPageConfig>(loadConfig);
  const [activeTab, setActiveTab] = useState<"editor" | "preview" | "coupons" | "promotions" | "referral" | "sync">("editor");
  const [isDirty, setIsDirty] = useState(false);

  // Guard: Super Admin only
  if (currentRole !== "Super Admin") {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>ðŸ”’</div>
        <h2 style={{ fontFamily: "inherit", marginBottom: 8 }}>Super Admin Only</h2>
        <p style={{ color: "#6B7280" }}>This editor is restricted to Super Admins.</p>
      </div>
    );
  }

  const update = (updater: (prev: PlanPageConfig) => PlanPageConfig) => {
    setCfg(updater);
    setIsDirty(true);
  };

  const handleSave = () => {
    saveConfig(cfg);
    setIsDirty(false);
    toast.success("Plan page configuration saved & published live!");
  };

  const handleReset = () => {
    if (!confirm("Reset all settings to factory defaults? This cannot be undone.")) return;
    setCfg(DEFAULT_CONFIG);
    saveConfig(DEFAULT_CONFIG);
    setIsDirty(false);
    toast.success("Configuration reset to defaults.");
  };

  const inr = (n: number) => "â‚¹" + n.toLocaleString("en-IN");

  const CATEGORIES = cfg.vehicleCategories;

  // â”€â”€ Helpers for list editing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const updateStringList = (list: string[], idx: number, val: string): string[] =>
    list.map((item, i) => i === idx ? val : item);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif, system-ui", background: "#F3F4F6", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: "1.5px solid #E5E7EB", padding: "14px 24px", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BackButton />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>Plan Page Editor</h1>
            <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Super Admin Â· Customer-facing plan purchase page</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isDirty && <span style={{ fontSize: 12, color: "#F59E0B", background: "#FEF3C7", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>â— Unsaved changes</span>}
          <a href="/buy" target="_blank" rel="noreferrer"
            style={{ padding: "8px 16px", background: "#F3F4F6", color: "#374151", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1.5px solid #E5E7EB" }}>
            ðŸ‘ Preview Page
          </a>
          <button onClick={handleReset}
            style={{ padding: "8px 14px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Reset
          </button>
          <button onClick={handleSave}
            style={{ padding: "9px 22px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            ðŸ’¾ Save & Publish
          </button>
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div style={{ background: "#fff", borderBottom: "1.5px solid #E5E7EB", padding: "0 24px", display: "flex", gap: 4 }}>
        {([["editor","✏️ Editor"],["coupons","🎟️ Coupons"],["promotions","📢 Promotions"],["referral","🤝 Referrals"],["sync","🔄 Price Sync"]] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: "12px 16px", border: "none", borderBottom: activeTab === tab ? "3px solid #2196F3" : "3px solid transparent", background: "none", fontWeight: activeTab === tab ? 700 : 500, color: activeTab === tab ? "#2196F3" : "#6B7280", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
            {label}
      {/* ── TAB BAR ──────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1.5px solid #E5E7EB", padding: "0 24px", display: "flex", gap: 0, overflowX: "auto" }}>
        {([
          { id: "editor",     label: "📋 Plan Editor",   color: "#2196F3" },
          { id: "coupons",    label: "🎟️ Coupons",       color: "#10b981" },
          { id: "promotions", label: "🔥 Promotions",     color: "#f59e0b" },
          { id: "referral",   label: "🔗 Referrals",      color: "#6366f1" },
          { id: "sync",       label: "🔄 Price Sync",     color: "#7c3aed" },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            style={{ padding: "14px 20px", border: "none", background: "transparent", cursor: "pointer", fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 13, fontFamily: "inherit", color: activeTab === tab.id ? tab.color : "#6B7280", borderBottom: activeTab === tab.id ? `3px solid ${tab.color}` : "3px solid transparent", whiteSpace: "nowrap", transition: "all 0.15s" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────────────────── */}
      {activeTab === "coupons" && (
        <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 24px 60px" }}>
          <CouponManagementTab monthlyPlans={cfg.monthlyPlans.map(p => ({ id: p.id, name: p.name }))} />
        </div>
      )}
      {activeTab === "promotions" && (
        <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 24px 60px" }}>
          <PromotionsTab monthlyPlans={cfg.monthlyPlans.map(p => ({ id: p.id, name: p.name }))} />
        </div>
      )}
      {activeTab === "referral" && (
        <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 24px 60px" }}>
          <ReferralTab />
        </div>
      )}
      {activeTab === "sync" && (
        <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 24px 60px" }}>
          <PlanSyncStatus />
        </div>
      )}
      {activeTab === "editor" && (

      <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 24px 60px" }}>

        {/* â”€â”€ Â§1 BRAND â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Brand & Contact" icon="ðŸ¢">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <Field label="Brand Name" value={cfg.brand.name} onChange={v => update(c => ({ ...c, brand: { ...c.brand, name: v } }))} />
            <Field label="Phone (displayed in nav)" value={cfg.brand.phone} onChange={v => update(c => ({ ...c, brand: { ...c.brand, phone: v } }))} />
            <Field label="WhatsApp Number (digits only, no +)" value={cfg.brand.whatsappNumber} onChange={v => update(c => ({ ...c, brand: { ...c.brand, whatsappNumber: v } }))} hint="e.g. 918238705601" />
            <Field label="Tagline (meta)" value={cfg.brand.tagline} onChange={v => update(c => ({ ...c, brand: { ...c.brand, tagline: v } }))} />
          </div>
        </Section>

        {/* â”€â”€ Â§2 HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Hero Section" icon="ðŸŽ¯">
          <Field label="Badge Text (top pill)" value={cfg.hero.badge} onChange={v => update(c => ({ ...c, hero: { ...c.hero, badge: v } }))} hint="e.g. ðŸš— Surat's #1 Daily Car Wash Service" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <Field label="Headline (plain part)" value={cfg.hero.headline} onChange={v => update(c => ({ ...c, hero: { ...c.hero, headline: v } }))} hint="e.g. Your car, clean" />
            <Field label="Headline Accent (yellow highlight)" value={cfg.hero.headlineAccent} onChange={v => update(c => ({ ...c, hero: { ...c.hero, headlineAccent: v } }))} hint="e.g. every single day." />
          </div>
          <Field label="Subheadline" value={cfg.hero.subheadline} onChange={v => update(c => ({ ...c, hero: { ...c.hero, subheadline: v } }))} />
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#374151" }}>Trust Items (shown under hero headline)</label>
            {cfg.trustItems.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input value={item} onChange={e => update(c => ({ ...c, trustItems: updateStringList(c.trustItems, i, e.target.value) }))}
                  style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
                <button onClick={() => update(c => ({ ...c, trustItems: c.trustItems.filter((_, j) => j !== i) }))}
                  style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>âœ•</button>
              </div>
            ))}
            <button onClick={() => update(c => ({ ...c, trustItems: [...c.trustItems, "ðŸš€ New trust item"] }))}
              style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Item</button>
          </div>
        </Section>

        {/* â”€â”€ Â§3 PINCODES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Serviceable Pincodes" icon="ðŸ“">
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>These appear as clickable chips and determine if a customer sees "âœ… Serviceable" or "âš ï¸ Waitlist".</p>
          {cfg.serviceablePincodes.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={p.code} maxLength={6} onChange={e => update(c => ({ ...c, serviceablePincodes: c.serviceablePincodes.map((pp, j) => j === i ? { ...pp, code: e.target.value.replace(/\D/g,"").slice(0,6) } : pp) }))}
                style={{ width: 100, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontFamily: "inherit", letterSpacing: 2, fontWeight: 700 }} placeholder="395007" />
              <input value={p.label} onChange={e => update(c => ({ ...c, serviceablePincodes: c.serviceablePincodes.map((pp, j) => j === i ? { ...pp, label: e.target.value } : pp) }))}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }} placeholder="Vesu / Pal" />
              <button onClick={() => update(c => ({ ...c, serviceablePincodes: c.serviceablePincodes.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>âœ•</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, serviceablePincodes: [...c.serviceablePincodes, { code: "", label: "" }] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Pincode</button>
        </Section>

        {/* â”€â”€ Â§3.5 VEHICLE CATEGORIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Vehicle Categories" icon="ðŸš—">
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>
            These are the 3 tiers customers choose from on the buy page. Each category has its own pricing column in the plan table.
          </p>
          <div style={{ background: "#FEF9C3", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#92400E" }}>
            âš ï¸ <strong>Important:</strong> If you add or remove a category, go to <strong>Â§4 Monthly Plan Prices</strong> and set prices for the new category. Car models in Â§12 assigned to a deleted category will fall back to the first category.
          </div>

          {cfg.vehicleCategories.map((cat, i) => (
            <div key={cat.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 2fr auto", gap: 10, marginBottom: 10, alignItems: "center" }}>
              {/* Emoji icon */}
              <input
                value={cat.icon}
                onChange={e => update(c => ({ ...c, vehicleCategories: c.vehicleCategories.map((cc, j) => j !== i ? cc : { ...cc, icon: e.target.value }) }))}
                style={{ padding: "8px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 22, textAlign: "center", fontFamily: "inherit" }}
                placeholder="ðŸš—"
                title="Emoji icon"
              />
              {/* ID (slug, used in carModelMap) */}
              <div>
                <input
                  value={cat.id}
                  onChange={e => {
                    const newId = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"");
                    if (!newId) return;
                    update(c => {
                      // Also remap all carModelMap entries that used the old id
                      const newMap: Record<string,string> = {};
                      for (const [kw, cid] of Object.entries(c.carModelMap)) {
                        newMap[kw] = cid === cat.id ? newId : cid;
                      }
                      return {
                        ...c,
                        vehicleCategories: c.vehicleCategories.map((cc, j) => j !== i ? cc : { ...cc, id: newId }),
                        carModelMap: newMap,
                        // Update plan prices keys
                        monthlyPlans: c.monthlyPlans.map(p => {
                          const prices = { ...p.prices };
                          if (cat.id in prices) { prices[newId] = prices[cat.id]; delete prices[cat.id]; }
                          return { ...p, prices };
                        }),
                      };
                    });
                  }}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "monospace", background: "#F9FAFB" }}
                  placeholder="hatchback"
                  title="Category ID â€” used in car model map"
                />
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>ID (slug)</p>
              </div>
              {/* Display label */}
              <div>
                <input
                  value={cat.label}
                  onChange={e => update(c => ({ ...c, vehicleCategories: c.vehicleCategories.map((cc, j) => j !== i ? cc : { ...cc, label: e.target.value }) }))}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}
                  placeholder="Hatchback / Compact Sedan"
                />
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Display label (shown to customer)</p>
              </div>
              {/* Delete â€” only if more than 1 category */}
              <button
                disabled={cfg.vehicleCategories.length <= 1}
                onClick={() => {
                  if (!confirm(`Remove category "${cat.label}"? All car models mapped to "${cat.id}" will be reassigned to "${cfg.vehicleCategories[0]?.id}".`)) return;
                  update(c => {
                    const fallback = c.vehicleCategories.find((cc, j) => j !== i)?.id || "";
                    const newMap: Record<string,string> = {};
                    for (const [kw, cid] of Object.entries(c.carModelMap)) {
                      newMap[kw] = cid === cat.id ? fallback : cid;
                    }
                    return {
                      ...c,
                      vehicleCategories: c.vehicleCategories.filter((_, j) => j !== i),
                      carModelMap: newMap,
                      monthlyPlans: c.monthlyPlans.map(p => {
                        const prices = { ...p.prices };
                        delete prices[cat.id];
                        return { ...p, prices };
                      }),
                    };
                  });
                }}
                style={{ padding: "8px 12px", background: cfg.vehicleCategories.length <= 1 ? "#F9FAFB" : "#FEF2F2", color: cfg.vehicleCategories.length <= 1 ? "#D1D5DB" : "#DC2626", border: `1.5px solid ${cfg.vehicleCategories.length <= 1 ? "#E5E7EB" : "#FECACA"}`, borderRadius: 8, cursor: cfg.vehicleCategories.length <= 1 ? "not-allowed" : "pointer" }}
                title={cfg.vehicleCategories.length <= 1 ? "Need at least 1 category" : "Remove this category"}>
                âœ•
              </button>
            </div>
          ))}

          <button
            onClick={() => update(c => ({
              ...c,
              vehicleCategories: [...c.vehicleCategories, { id: `cat${Date.now()}`, label: "New Category", icon: "ðŸš˜" }],
              monthlyPlans: c.monthlyPlans.map(p => ({ ...p, prices: { ...p.prices, [`cat${Date.now()}`]: 0 } })),
            }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, marginTop: 6 }}>
            + Add Category
          </button>
        </Section>

        {/* â”€â”€ Â§4 MONTHLY PLAN PRICES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Monthly Plan Prices" icon="ðŸ’°">
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>Set prices per plan per vehicle category. Leave at 0 if plan is not available for that category.</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1.5px solid #E5E7EB" }}>Plan</th>
                  {CATEGORIES.map(cat => (
                    <th key={cat.id} style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600, color: "#374151", borderBottom: "1.5px solid #E5E7EB" }}>
                      {cat.icon} {cat.label}
                    </th>
                  ))}
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1.5px solid #E5E7EB" }}>Popular?</th>
                </tr>
              </thead>
              <tbody>
                {cfg.monthlyPlans.map((plan, pi) => (
                  <tr key={plan.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", align: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{plan.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700 }}>{plan.name}</div>
                          <div style={{ fontSize: 12, color: "#6B7280" }}>{plan.tagline}</div>
                        </div>
                      </div>
                    </td>
                    {CATEGORIES.map(cat => (
                      <td key={cat.id} style={{ padding: "10px 14px", textAlign: "center" }}>
                        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                          <span style={{ position: "absolute", left: 10, color: "#6B7280", fontWeight: 600, fontSize: 13 }}>â‚¹</span>
                          <input type="number" value={plan.prices[cat.id] ?? 0}
                            onChange={e => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, prices: { ...p.prices, [cat.id]: parseInt(e.target.value) || 0 } }) }))}
                            style={{ width: 90, padding: "8px 8px 8px 22px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, textAlign: "right", fontWeight: 700 }} />
                        </div>
                      </td>
                    ))}
                    <td style={{ padding: "10px 14px" }}>
                      <input type="checkbox" checked={!!plan.popular}
                        onChange={e => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, popular: e.target.checked }) }))}
                        style={{ width: 18, height: 18, cursor: "pointer" }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* â”€â”€ Â§5 PLAN FEATURES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Monthly Plan Features & Names" icon="ðŸ“‹">
          {cfg.monthlyPlans.map((plan, pi) => (
            <div key={plan.id} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: pi < cfg.monthlyPlans.length - 1 ? "1px solid #E5E7EB" : "none" }}>
              <div style={{ display: "flex", align: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{plan.icon}</span>
                <strong style={{ fontSize: 15 }}>{plan.name}</strong>
              </div>
              <Field label="Plan Name" value={plan.name} onChange={v => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, name: v }) }))} />
              <Field label="Tagline" value={plan.tagline} onChange={v => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, tagline: v }) }))} />
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#374151" }}>Features</label>
              {plan.features.map((f, fi) => (
                <div key={fi} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <input type="checkbox" checked={f.included}
                    onChange={e => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, features: p.features.map((ff, ffi) => ffi !== fi ? ff : { ...ff, included: e.target.checked }) }) }))}
                    style={{ width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} />
                  <input value={f.text}
                    onChange={e => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, features: p.features.map((ff, ffi) => ffi !== fi ? ff : { ...ff, text: e.target.value }) }) }))}
                    style={{ flex: 1, padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }} />
                  <button onClick={() => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, features: p.features.filter((_, ffi) => ffi !== fi) }) }))}
                    style={{ padding: "6px 10px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 7, cursor: "pointer", fontSize: 13 }}>âœ•</button>
                </div>
              ))}
              <button onClick={() => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, features: [...p.features, { text: "New feature", included: true }] }) }))}
                style={{ padding: "6px 12px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600, marginTop: 6 }}>+ Feature</button>
            </div>
          ))}
        </Section>

        {/* â”€â”€ Â§6 PACKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Repeat / One-Time Packs" icon="ðŸŽŸï¸">
          {cfg.packs.map((pack, i) => (
            <div key={pack.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 1fr auto", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <input value={pack.name} onChange={e => update(c => ({ ...c, packs: c.packs.map((p, j) => j !== i ? p : { ...p, name: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="Pack name" />
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: 10, color: "#6B7280", fontSize: 13 }}>â‚¹</span>
                <input type="number" value={pack.price} onChange={e => update(c => ({ ...c, packs: c.packs.map((p, j) => j !== i ? p : { ...p, price: parseInt(e.target.value) || 0 }) }))}
                  style={{ width: "100%", padding: "8px 8px 8px 22px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontWeight: 700 }} />
              </div>
              <input value={pack.perLabel} onChange={e => update(c => ({ ...c, packs: c.packs.map((p, j) => j !== i ? p : { ...p, perLabel: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="e.g. 2Ã— per month Â· â‚¹186/wash" />
              <input value={pack.discount} onChange={e => update(c => ({ ...c, packs: c.packs.map((p, j) => j !== i ? p : { ...p, discount: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="7% off" />
              <button onClick={() => update(c => ({ ...c, packs: c.packs.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>âœ•</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, packs: [...c.packs, { id: `pack-${Date.now()}`, name: "New Pack", icon: "ðŸ“¦", price: 0, perLabel: "", discount: "" }] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Pack</button>
        </Section>

        {/* â”€â”€ Â§7 COMMITMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Commitment / Loyalty Options" icon="ðŸ¤">
          {cfg.commitments.map((c, i) => (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 3fr auto", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <input value={c.term} onChange={e => update(cfg => ({ ...cfg, commitments: cfg.commitments.map((cc, j) => j !== i ? cc : { ...cc, term: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="e.g. 3 Months" />
              <input value={c.discountLabel} onChange={e => update(cfg => ({ ...cfg, commitments: cfg.commitments.map((cc, j) => j !== i ? cc : { ...cc, discountLabel: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="5% off" />
              <input value={c.perk} onChange={e => update(cfg => ({ ...cfg, commitments: cfg.commitments.map((cc, j) => j !== i ? cc : { ...cc, perk: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="Perk description" />
              <button onClick={() => update(cfg => ({ ...cfg, commitments: cfg.commitments.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>âœ•</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, commitments: [...c.commitments, { id: `commit-${Date.now()}`, term: "New Option", discountLabel: "0%", perk: "" }] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Option</button>
        </Section>

        {/* â”€â”€ Â§8 ADD-ONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Add-ons" icon="âž•">
          {cfg.addons.map((addon, i) => (
            <div key={addon.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, marginBottom: 10, alignItems: "center" }}>
                <input value={addon.name} onChange={e => update(c => ({ ...c, addons: c.addons.map((a, j) => j !== i ? a : { ...a, name: e.target.value }) }))}
                  style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="Add-on name" />
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: 10, color: "#6B7280", fontSize: 13 }}>â‚¹</span>
                  <input type="number" value={addon.price} onChange={e => update(c => ({ ...c, addons: c.addons.map((a, j) => j !== i ? a : { ...a, price: parseInt(e.target.value) || 0 }) }))}
                    style={{ width: "100%", padding: "8px 8px 8px 22px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontWeight: 700 }} />
                </div>
                <input value={addon.unit} onChange={e => update(c => ({ ...c, addons: c.addons.map((a, j) => j !== i ? a : { ...a, unit: e.target.value }) }))}
                  style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="per visit" />
                <button onClick={() => update(c => ({ ...c, addons: c.addons.filter((_, j) => j !== i) }))}
                  style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>âœ•</button>
              </div>
              <input value={addon.description} onChange={e => update(c => ({ ...c, addons: c.addons.map((a, j) => j !== i ? a : { ...a, description: e.target.value }) }))}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="Short description" />
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, addons: [...c.addons, { id: `addon-${Date.now()}`, name: "New Add-on", price: 0, unit: "per visit", description: "" }] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Add-on</button>
        </Section>

        {/* â”€â”€ Â§9 TIME SLOTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Preferred Time Slots" icon="â°">
          {cfg.timeSlots.map((slot, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={slot} onChange={e => update(c => ({ ...c, timeSlots: updateStringList(c.timeSlots, i, e.target.value) }))}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
              <button onClick={() => update(c => ({ ...c, timeSlots: c.timeSlots.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>âœ•</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, timeSlots: [...c.timeSlots, "New slot"] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Slot</button>
        </Section>

        {/* â”€â”€ Â§10 POST-PAYMENT STEPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Post-Payment Steps (shown on success page)" icon="âœ…">
          {cfg.postPaymentSteps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#2196F3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
              <input value={step} onChange={e => update(c => ({ ...c, postPaymentSteps: updateStringList(c.postPaymentSteps, i, e.target.value) }))}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
              <button onClick={() => update(c => ({ ...c, postPaymentSteps: c.postPaymentSteps.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>âœ•</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, postPaymentSteps: [...c.postPaymentSteps, "New step"] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Step</button>
        </Section>

        {/* â”€â”€ Â§11 TRUST STRIP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Trust Strip (bottom bar)" icon="ðŸ”µ">
          {cfg.trustStrip.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={item} onChange={e => update(c => ({ ...c, trustStrip: updateStringList(c.trustStrip, i, e.target.value) }))}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
              <button onClick={() => update(c => ({ ...c, trustStrip: c.trustStrip.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>âœ•</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, trustStrip: [...c.trustStrip, "ðŸŒŸ New trust item"] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Item</button>
        </Section>

        {/* â”€â”€ Â§12 CAR MODEL MAP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Section title="Car Model â†’ Category Mapping" icon="ðŸš—">
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>
            Each row is a <strong>keyword</strong> (matched against what the customer types) mapped to a <strong>vehicle category</strong>.
            Matching is case-insensitive and partial â€” e.g. keyword <code style={{ background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>swift</code> will match "Maruti Swift", "Swift Dzire", etc.
          </p>
          <p style={{ fontSize: 12, color: "#F59E0B", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px", marginBottom: 16 }}>
            âš ï¸ Keep keywords <strong>short and unique</strong>. Avoid generic words like "car" or "new" â€” they'll match everything.
          </p>

          {/* Search/filter */}
          <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              placeholder="Filter models..."
              id="modelSearch"
              onChange={e => {
                const q = e.target.value.toLowerCase();
                document.querySelectorAll<HTMLElement>(".model-row").forEach(row => {
                  row.style.display = !q || row.dataset.kw?.includes(q) || row.dataset.cat?.includes(q) ? "" : "none";
                });
              }}
              style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, width: 200 }}
            />
            <span style={{ fontSize: 12, color: "#6B7280" }}>{Object.keys(cfg.carModelMap).length} models</span>
            {/* Per-category counts */}
            {cfg.vehicleCategories.map(cat => (
              <span key={cat.id} style={{ fontSize: 12, background: cat.id === "hatchback" ? "#DBEAFE" : cat.id === "suv" ? "#DCFCE7" : "#FEF9C3", color: cat.id === "hatchback" ? "#1D4ED8" : cat.id === "suv" ? "#15803D" : "#A16207", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                {cat.icon} {cat.label.split(" /")[0]}: {Object.values(cfg.carModelMap).filter(v => v === cat.id).length}
              </span>
            ))}
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px auto", gap: 8, marginBottom: 6, padding: "0 4px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 }}>Keyword (what customer types)</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 }}>Category</span>
            <span />
          </div>

          {/* Rows */}
          <div style={{ maxHeight: 420, overflowY: "auto", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "8px" }}>
            {Object.entries(cfg.carModelMap).map(([kw, cat]) => (
              <div key={kw} className="model-row" data-kw={kw} data-cat={cat}
                style={{ display: "grid", gridTemplateColumns: "1fr 180px auto", gap: 8, marginBottom: 6, alignItems: "center" }}>
                <input
                  value={kw}
                  onChange={e => {
                    const newKw = e.target.value.toLowerCase().replace(/\s+/g, "");
                    if (!newKw || newKw === kw) return;
                    update(c => {
                      const next = { ...c.carModelMap };
                      delete next[kw];
                      next[newKw] = cat;
                      return { ...c, carModelMap: next };
                    });
                  }}
                  style={{ padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 7, fontSize: 13, fontFamily: "monospace", background: "#F9FAFB" }}
                />
                <select
                  value={cat}
                  onChange={e => update(c => ({ ...c, carModelMap: { ...c.carModelMap, [kw]: e.target.value } }))}
                  style={{ padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 7, fontSize: 13, background: cat === "hatchback" ? "#EFF6FF" : cat === "suv" ? "#F0FDF4" : "#FEFCE8", fontWeight: 600 }}
                >
                  {cfg.vehicleCategories.map(vc => (
                    <option key={vc.id} value={vc.id}>{vc.icon} {vc.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => update(c => { const next = { ...c.carModelMap }; delete next[kw]; return { ...c, carModelMap: next }; })}
                  style={{ padding: "7px 10px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 7, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
                  âœ•
                </button>
              </div>
            ))}
          </div>

          {/* Add new model row */}
          <div style={{ marginTop: 14, padding: "14px 16px", background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#166534", marginBottom: 10 }}>âž• Add New Car Model</p>
            <AddModelRow
              categories={cfg.vehicleCategories}
              onAdd={(kw, cat) => update(c => ({ ...c, carModelMap: { ...c.carModelMap, [kw]: cat } }))}
            />
          </div>

          {/* Bulk add hint */}
          <div style={{ marginTop: 12, fontSize: 12, color: "#6B7280" }}>
            ðŸ’¡ <strong>Tip:</strong> Add the main model name only â€” e.g. <code style={{ background: "#F3F4F6", padding: "1px 4px", borderRadius: 3 }}>creta</code> not "Hyundai Creta 2024 Facelift". The match is partial so it covers all variants.
          </div>
        </Section>

        {/* SAVE BAR */}
        <div style={{ position: "sticky", bottom: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          {isDirty && (
            <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "14px 24px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>You have unsaved changes</span>
              <button onClick={handleSave}
                style={{ padding: "10px 28px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                ðŸ’¾ Save & Publish Now
              </button>
            </div>
          )}
        </div>
      )} {/* end editor */}
      </div>
    </div>
  );
}

// â”€â”€â”€ INJECTED TAB COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Coupon, Promotion, Referral, PlanSync tabs
import type { CouponCode, Promotion, ReferralProgram, ReferralRecord } from "../../services/planSyncService";

// ─── COUPON MANAGEMENT TAB ────────────────────────────────────────────────────
function CouponManagementTab({ monthlyPlans }: { monthlyPlans: { id: string; name: string }[] }) {
  const [coupons, setCoupons] = React.useState<CouponCode[]>(() => planSyncService.getCoupons());
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string|null>(null);
  const blank = { code:"", type:"percent" as "percent"|"flat", value:10, minOrderValue:0, maxUses:0, validFrom:"", validTo:"", applicablePlans:[] as string[], active:true, description:"", createdBy:"Admin" };
  const [form, setForm] = React.useState(blank);
  const today = new Date().toISOString().slice(0,10);
  const reload = () => setCoupons(planSyncService.getCoupons());

  const openEdit = (c: CouponCode) => {
    setForm({ code:c.code, type:c.type, value:c.value, minOrderValue:c.minOrderValue, maxUses:c.maxUses, validFrom:c.validFrom, validTo:c.validTo, applicablePlans:c.applicablePlans, active:c.active, description:c.description, createdBy:c.createdBy });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.code.trim()) { toast.error("Coupon code is required"); return; }
    if (form.value <= 0) { toast.error("Discount value must be greater than 0"); return; }
    if (form.type === "percent" && form.value > 100) { toast.error("Percentage cannot exceed 100%"); return; }
    if (editId) {
      planSyncService.updateCoupon(editId, { ...form, code: form.code.toUpperCase().trim() });
      toast.success("Coupon updated");
    } else {
      const exists = planSyncService.getCoupons().find(c => c.code.toUpperCase() === form.code.toUpperCase().trim());
      if (exists) { toast.error("Coupon code already exists"); return; }
      planSyncService.addCoupon({ ...form, code: form.code.toUpperCase().trim() });
      toast.success(`Coupon ${form.code.toUpperCase()} created`);
    }
    setShowForm(false); setEditId(null); setForm(blank); reload();
  };

  const activeCount = coupons.filter(c => c.active && (!c.validTo || today <= c.validTo)).length;
  const expiredCount = coupons.filter(c => c.validTo && today > c.validTo).length;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div><h3 style={{ margin:0, fontSize:18, fontWeight:700, color:"#0f172a" }}>ðŸŽŸï¸ Coupon Codes</h3><p style={{ margin:"4px 0 0", fontSize:13, color:"#64748b" }}>{coupons.length} coupons Â· {coupons.filter(c=>c.active).length} active</p></div>
        <button onClick={()=>setShowForm(!showForm)} style={{ padding:"10px 20px", background:"linear-gradient(135deg,#10b981,#059669)", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" }}>+ New Coupon</button>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <h3 style={{margin:0,fontSize:18,fontWeight:700,color:"#0f172a"}}>🎟️ Coupon Codes</h3>
          <p style={{margin:"4px 0 0",fontSize:13,color:"#64748b"}}>
            {coupons.length} total · <span style={{color:"#10b981",fontWeight:600}}>{activeCount} active</span> · <span style={{color:"#ef4444"}}>{expiredCount} expired</span>
          </p>
        </div>
        <button onClick={()=>{setForm(blank);setEditId(null);setShowForm(!showForm);}}
          style={{padding:"10px 20px",background:"linear-gradient(135deg,#10b981,#059669)",color:"white",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          + Create Coupon
        </button>
      </div>

      {/* Quick stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {[
          {label:"Total Coupons",value:coupons.length,color:"#6366f1",bg:"#eff6ff",icon:"🎟️"},
          {label:"Active",value:activeCount,color:"#10b981",bg:"#f0fdf4",icon:"✅"},
          {label:"Total Used",value:coupons.reduce((s,c)=>s+c.usedCount,0),color:"#f59e0b",bg:"#fffbeb",icon:"🛒"},
          {label:"Expired",value:expiredCount,color:"#ef4444",bg:"#fef2f2",icon:"⏰"},
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:12,padding:"12px 14px",border:`1px solid ${s.color}20`}}>
            <div style={{fontSize:20}}>{s.icon}</div>
            <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#64748b"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div style={{ background:"#f0fdf4", borderRadius:14, padding:20, marginBottom:20, border:"2px solid #86efac" }}>
          <h4 style={{ margin:"0 0 14px", color:"#065f46" }}>Create Coupon</h4>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
            {[["Code *","code","SAVE20","text"],["Description","description","e.g. Welcome offer","text"],["Min Order â‚¹","minOrderValue","500","number"],["Max Uses (0=âˆž)","maxUses","100","number"],["Valid From","validFrom","","date"],["Valid To","validTo","","date"]] .map(([lbl,k,ph,tp]: any)=>(
              <div key={k}><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>{lbl}</label>
              <input type={tp} value={(form as any)[k]} onChange={e=>setForm(p=>({...p,[k]:tp==="number"?Number(e.target.value):e.target.value}))} placeholder={ph} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #d1fae5",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>
            ))}
          </div>
          <div style={{ display:"flex",gap:10,marginBottom:10 }}>
            <div style={{ flex:1 }}><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>Type</label><select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value as any}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #d1fae5",borderRadius:8,fontSize:13,fontFamily:"inherit" }}><option value="percent">% off</option><option value="flat">â‚¹ flat off</option></select></div>
            <div style={{ flex:1 }}><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>Value</label><input type="number" value={form.value} onChange={e=>setForm(p=>({...p,value:Number(e.target.value)}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #d1fae5",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>
        <div style={{background:"#f8fafc",borderRadius:14,padding:20,marginBottom:20,border:"2px solid #e0e7ff"}}>
          <h4 style={{margin:"0 0 16px",color:"#4338ca",fontSize:15}}>{editId?"✏️ Edit Coupon":"➕ Create New Coupon"}</h4>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
            {[
              {label:"Coupon Code *",key:"code",ph:"e.g. SAVE20",type:"text",upper:true},
              {label:"Description",key:"description",ph:"e.g. Welcome offer for new users",type:"text"},
              {label:"Min Order Value (₹)",key:"minOrderValue",ph:"0",type:"number"},
              {label:"Max Uses (0 = unlimited)",key:"maxUses",ph:"100",type:"number"},
              {label:"Valid From",key:"validFrom",ph:"",type:"date"},
              {label:"Valid To",key:"validTo",ph:"",type:"date"},
            ].map(({label,key,ph,type,upper}:any)=>(
              <div key={key}>
                <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>{label}</label>
                <input type={type} value={(form as any)[key]}
                  onChange={e=>setForm(p=>({...p,[key]:type==="number"?Number(e.target.value):upper?e.target.value.toUpperCase():e.target.value}))}
                  placeholder={ph}
                  style={{width:"100%",padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} />
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>Discount Type</label>
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value as any}))}
                style={{width:"100%",padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit"}}>
                <option value="percent">Percentage off (%)</option>
                <option value="flat">Flat amount off (₹)</option>
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>
                {form.type==="percent"?"Discount Percentage (%)":"Discount Amount (₹)"}
              </label>
              <input type="number" value={form.value} min={1} max={form.type==="percent"?100:undefined}
                onChange={e=>setForm(p=>({...p,value:Number(e.target.value)}))}
                style={{width:"100%",padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} />
            </div>
          </div>
          {/* Preview box */}
          {form.code && form.value > 0 && (
            <div style={{marginBottom:12,padding:"10px 14px",background:"linear-gradient(135deg,#eff6ff,#f5f3ff)",borderRadius:10,border:"1px solid #c7d2fe",display:"flex",alignItems:"center",gap:12}}>
              <div style={{padding:"6px 14px",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",borderRadius:8,fontFamily:"monospace",fontWeight:800,fontSize:14,letterSpacing:2}}>
                {form.code||"CODE"}
              </div>
              <div style={{fontSize:13,color:"#4338ca"}}>
                <strong>{form.type==="percent"?`${form.value}% off`:`₹${form.value} off`}</strong>
                {form.minOrderValue>0&&` on orders above ₹${form.minOrderValue}`}
                {form.maxUses>0&&` · Max ${form.maxUses} uses`}
                {form.validTo&&` · Expires ${form.validTo}`}
              </div>
            </div>
          )}
          {/* Applicable plans */}
          <div style={{marginBottom:12}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Applicable Plans (leave blank = all plans)</label>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {monthlyPlans.map(p=>(
                <label key={p.id} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,padding:"6px 12px",borderRadius:20,border:`2px solid ${form.applicablePlans.includes(p.id)?"#6366f1":"#e2e8f0"}`,background:form.applicablePlans.includes(p.id)?"#eff6ff":"white",fontWeight:form.applicablePlans.includes(p.id)?700:400,color:form.applicablePlans.includes(p.id)?"#4338ca":"#374151"}}>
                  <input type="checkbox" checked={form.applicablePlans.includes(p.id)} style={{display:"none"}}
                    onChange={e=>setForm(prev=>({...prev,applicablePlans:e.target.checked?[...prev.applicablePlans,p.id]:prev.applicablePlans.filter(x=>x!==p.id)}))} />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={handleSave}
              style={{padding:"10px 28px",background:"linear-gradient(135deg,#10b981,#059669)",color:"white",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13}}>
              {editId?"Update Coupon":"Create Coupon"}
            </button>
            <button onClick={()=>{setShowForm(false);setEditId(null);setForm(blank);}}
              style={{padding:"10px 20px",background:"#f1f5f9",color:"#475569",border:"none",borderRadius:8,cursor:"pointer",fontSize:13}}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <div style={{ display:"grid",gap:8 }}>
        {coupons.length===0&&<div style={{ textAlign:"center",padding:40,color:"#94a3b8",background:"#f8fafc",borderRadius:12,fontSize:14 }}>No coupons yet. Create your first one above.</div>}
        {coupons.map(c=>{ const exp=c.validTo&&today>c.validTo; return(
          <div key={c.id} style={{ background:"white",border:`2px solid ${c.active&&!exp?"#d1fae5":"#f1f5f9"}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ padding:"7px 14px",background:`linear-gradient(135deg,${c.active&&!exp?"#10b981":"#94a3b8"},${c.active&&!exp?"#059669":"#cbd5e1"})`,color:"white",borderRadius:10,fontWeight:800,fontSize:14,letterSpacing:1,minWidth:100,textAlign:"center",fontFamily:"monospace" }}>{c.code}</div>
            <div style={{ flex:1 }}><div style={{ fontWeight:700,color:"#0f172a",fontSize:14 }}>{c.type==="percent"?`${c.value}% off`:`â‚¹${c.value} off`}{c.description&&<span style={{ fontWeight:400,color:"#64748b",marginLeft:8 }}>Â· {c.description}</span>}</div><div style={{ fontSize:12,color:"#94a3b8",marginTop:2 }}>{c.maxUses>0?`${c.usedCount}/${c.maxUses} used`:`${c.usedCount} used`}{c.validTo&&` Â· Expires ${c.validTo}`}{c.minOrderValue>0&&` Â· Min â‚¹${c.minOrderValue}`}</div></div>
            <div style={{ display:"flex",gap:8,flexShrink:0 }}>
              {exp&&<span style={{ fontSize:11,background:"#fef2f2",color:"#ef4444",padding:"3px 8px",borderRadius:6,fontWeight:600 }}>EXPIRED</span>}
              {!exp&&c.active&&<span style={{ fontSize:11,background:"#f0fdf4",color:"#10b981",padding:"3px 8px",borderRadius:6,fontWeight:600 }}>ACTIVE</span>}
              <button onClick={()=>{planSyncService.updateCoupon(c.id,{active:!c.active});reload();}} style={{ padding:"5px 12px",background:c.active?"#fef2f2":"#f0fdf4",color:c.active?"#ef4444":"#10b981",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600 }}>{c.active?"Disable":"Enable"}</button>
              <button onClick={()=>{planSyncService.deleteCoupon(c.id);reload();}} style={{ padding:"5px 10px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer",fontSize:12 }}>ðŸ—‘</button>
            </div>
          </div>
        );})}
      </div>

      {/* Coupon list */}
      {coupons.length===0 ? (
        <div style={{textAlign:"center",padding:48,color:"#94a3b8",background:"#f8fafc",borderRadius:16,border:"2px dashed #e2e8f0"}}>
          <div style={{fontSize:40,marginBottom:12}}>🎟️</div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:4}}>No coupons yet</div>
          <div style={{fontSize:13}}>Create your first coupon to offer discounts to customers</div>
        </div>
      ) : (
        <div style={{display:"grid",gap:8}}>
          {coupons.map(coup=>{
            const isExpired = coup.validTo && today > coup.validTo;
            const notStarted = coup.validFrom && today < coup.validFrom;
            const isActive = coup.active && !isExpired && !notStarted;
            const usagePct = coup.maxUses > 0 ? Math.round((coup.usedCount/coup.maxUses)*100) : 0;
            return (
              <div key={coup.id} style={{background:"white",border:`2px solid ${isActive?"#e0e7ff":"#f1f5f9"}`,borderRadius:12,padding:"14px 18px"}}>
                <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                  {/* Code badge */}
                  <div style={{padding:"8px 16px",background:`linear-gradient(135deg,${isActive?"#6366f1":"#94a3b8"},${isActive?"#8b5cf6":"#cbd5e1"})`,color:"white",borderRadius:10,fontWeight:800,fontSize:14,letterSpacing:2,fontFamily:"monospace",flexShrink:0,minWidth:120,textAlign:"center"}}>
                    {coup.code}
                  </div>
                  {/* Details */}
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{fontWeight:700,color:"#0f172a",fontSize:14}}>
                      {coup.type==="percent"?`${coup.value}% off`:`₹${coup.value} off`}
                      {coup.description&&<span style={{fontWeight:400,color:"#64748b",marginLeft:8,fontSize:13}}>— {coup.description}</span>}
                    </div>
                    <div style={{fontSize:12,color:"#94a3b8",marginTop:3,display:"flex",gap:10,flexWrap:"wrap"}}>
                      {coup.minOrderValue>0&&<span>Min ₹{coup.minOrderValue}</span>}
                      {coup.maxUses>0?<span>{coup.usedCount}/{coup.maxUses} used</span>:<span>{coup.usedCount} used (unlimited)</span>}
                      {coup.validTo&&<span>Expires {coup.validTo}</span>}
                      {coup.applicablePlans.length>0&&<span>{coup.applicablePlans.join(", ")} only</span>}
                    </div>
                    {/* Usage bar */}
                    {coup.maxUses > 0 && (
                      <div style={{marginTop:6,height:4,background:"#f1f5f9",borderRadius:2,overflow:"hidden",maxWidth:200}}>
                        <div style={{height:"100%",width:`${usagePct}%`,background:usagePct>80?"#ef4444":"#10b981",borderRadius:2,transition:"width 0.3s"}} />
                      </div>
                    )}
                  </div>
                  {/* Status + actions */}
                  <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                    {isExpired&&<span style={{fontSize:11,background:"#fef2f2",color:"#ef4444",padding:"3px 8px",borderRadius:6,fontWeight:600}}>EXPIRED</span>}
                    {notStarted&&<span style={{fontSize:11,background:"#fffbeb",color:"#d97706",padding:"3px 8px",borderRadius:6,fontWeight:600}}>SCHEDULED</span>}
                    {isActive&&<span style={{fontSize:11,background:"#f0fdf4",color:"#10b981",padding:"3px 8px",borderRadius:6,fontWeight:600}}>ACTIVE</span>}
                    {!isActive&&!isExpired&&!notStarted&&<span style={{fontSize:11,background:"#f1f5f9",color:"#64748b",padding:"3px 8px",borderRadius:6,fontWeight:600}}>PAUSED</span>}
                    <button onClick={()=>openEdit(coup)}
                      style={{padding:"5px 12px",background:"#f1f5f9",color:"#374151",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>✏️ Edit</button>
                    <button onClick={()=>{planSyncService.updateCoupon(coup.id,{active:!coup.active});reload();}}
                      style={{padding:"5px 12px",background:coup.active?"#fef2f2":"#f0fdf4",color:coup.active?"#ef4444":"#10b981",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>
                      {coup.active?"Pause":"Resume"}
                    </button>
                    <button onClick={()=>{if(window.confirm(`Delete coupon ${coup.code}?`)){planSyncService.deleteCoupon(coup.id);reload();}}}
                      style={{padding:"5px 10px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer",fontSize:12}}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PROMOTIONS TAB ────────────────────────────────────────────────────────────
function PromotionsTab({ monthlyPlans }: { monthlyPlans: { id: string; name: string }[] }) {
  const [promos, setPromos] = React.useState<Promotion[]>(() => planSyncService.getPromotions());
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ name:"",description:"",type:"percent" as any,value:10,applicablePlans:[] as string[],startDate:"",endDate:"",active:true,autoApply:false,badge:"ðŸŽ‰",createdBy:"Admin" });
  const [editId, setEditId] = React.useState<string|null>(null);
  const blank = { name:"", description:"", type:"percent" as any, value:10, applicablePlans:[] as string[], startDate:"", endDate:"", active:true, autoApply:true, badge:"🎉", createdBy:"Admin" };
  const [form, setForm] = React.useState(blank);
  const today = new Date().toISOString().slice(0,10);
  const reload = () => setPromos(planSyncService.getPromotions());

  const liveNow = promos.filter(p=>p.active&&today>=p.startDate&&today<=p.endDate).length;

  const openEdit = (p: Promotion) => {
    setForm({name:p.name,description:p.description,type:p.type,value:p.value,applicablePlans:p.applicablePlans,startDate:p.startDate,endDate:p.endDate,active:p.active,autoApply:p.autoApply,badge:p.badge,createdBy:p.createdBy});
    setEditId(p.id); setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Promotion name required"); return; }
    if (!form.startDate || !form.endDate) { toast.error("Start and end dates required"); return; }
    if (form.startDate > form.endDate) { toast.error("End date must be after start date"); return; }
    if (editId) { planSyncService.updatePromotion(editId, form); toast.success("Promotion updated"); }
    else { planSyncService.addPromotion(form); toast.success("Promotion created"); }
    setShowForm(false); setEditId(null); setForm(blank); reload();
  };

  const BADGES = ["🎉","🔥","⚡","🎄","🪔","🎊","🏷️","💥","🌟","🎁","❄️","🌺"];

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div><h3 style={{ margin:0,fontSize:18,fontWeight:700,color:"#0f172a" }}>ðŸ”¥ Offers & Promotions</h3><p style={{ margin:"4px 0 0",fontSize:13,color:"#64748b" }}>{promos.filter(p=>p.active&&today>=p.startDate&&today<=p.endDate).length} currently live</p></div>
        <button onClick={()=>setShowForm(!showForm)} style={{ padding:"10px 20px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"white",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer" }}>+ New Promotion</button>
      </div>
      {showForm&&(
        <div style={{ background:"#fffbeb",borderRadius:14,padding:20,marginBottom:20,border:"2px solid #fcd34d" }}>
          <h4 style={{ margin:"0 0 12px",color:"#92400e" }}>Create Promotion</h4>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
            {[["Name *","name","Diwali Special"],["Badge","badge","ðŸŽ„"],["Description","description","Shown on buy page"],["Type â€” Value (e.g. 20 for 20%/â‚¹200)","","",""]] .slice(0,3).map(([lbl,k,ph]: any)=>(<div key={k}><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>{lbl}</label><input value={(form as any)[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>))}
            <div><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>Type</label><select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit" }}><option value="percent">% Discount</option><option value="flat">â‚¹ Flat Off</option><option value="bogo">Buy 1 Get 1</option></select></div>
            <div><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>Value</label><input type="number" value={form.value} onChange={e=>setForm(p=>({...p,value:Number(e.target.value)}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>
            <div><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>Start</label><input type="date" value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>
            <div><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>End</label><input type="date" value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <h3 style={{margin:0,fontSize:18,fontWeight:700,color:"#0f172a"}}>🔥 Offers & Promotions</h3>
          <p style={{margin:"4px 0 0",fontSize:13,color:"#64748b"}}>
            {promos.length} total · <span style={{color:"#d97706",fontWeight:600}}>{liveNow} live now</span>
          </p>
        </div>
        <button onClick={()=>{setForm(blank);setEditId(null);setShowForm(!showForm);}}
          style={{padding:"10px 20px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"white",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>
          + Create Promotion
        </button>
      </div>

      {showForm && (
        <div style={{background:"#fffbeb",borderRadius:14,padding:20,marginBottom:20,border:"2px solid #fcd34d"}}>
          <h4 style={{margin:"0 0 14px",color:"#92400e"}}>{editId?"✏️ Edit Promotion":"➕ Create Promotion"}</h4>
          {/* Badge picker */}
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Badge / Emoji</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {BADGES.map(b=>(
                <button key={b} onClick={()=>setForm(p=>({...p,badge:b}))}
                  style={{width:38,height:38,borderRadius:8,border:`2px solid ${form.badge===b?"#d97706":"#e2e8f0"}`,background:form.badge===b?"#fffbeb":"white",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            {[
              {label:"Promotion Name *",key:"name",ph:"e.g. Diwali Special Offer",type:"text"},
              {label:"Tagline (shown to customers)",key:"description",ph:"e.g. Celebrate with 20% off all plans!",type:"text"},
            ].map(({label,key,ph,type}:any)=>(
              <div key={key}>
                <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>{label}</label>
                <input value={(form as any)[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} placeholder={ph}
                  style={{width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} />
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>Discount Type</label>
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}
                style={{width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit"}}>
                <option value="percent">% Percentage</option>
                <option value="flat">₹ Flat Amount</option>
                <option value="bogo">Buy 1 Get 1</option>
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>
                {form.type==="percent"?"Discount %":"Discount ₹"}
              </label>
              <input type="number" value={form.value} onChange={e=>setForm(p=>({...p,value:Number(e.target.value)}))}
                style={{width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} />
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))}
                style={{width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} />
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>End Date</label>
              <input type="date" value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))}
                style={{width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} />
            </div>
          </div>
          <div style={{display:"flex",gap:20,marginBottom:12,flexWrap:"wrap"}}>
            <label onClick={()=>setForm(p=>({...p,autoApply:!p.autoApply}))} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none"}}>
              <div style={{width:44,height:24,borderRadius:12,background:form.autoApply?"#f59e0b":"#e2e8f0",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:form.autoApply?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}} />
              </div>
              <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>Auto-apply <span style={{color:"#64748b",fontWeight:400}}>(shows banner on buy page automatically)</span></span>
            </label>
            <label onClick={()=>setForm(p=>({...p,active:!p.active}))} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none"}}>
              <div style={{width:44,height:24,borderRadius:12,background:form.active?"#10b981":"#e2e8f0",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:form.active?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}} />
              </div>
              <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>Active immediately</span>
            </label>
          </div>
          {/* Live preview */}
          {form.name && (
            <div style={{marginBottom:14,padding:"10px 16px",background:"linear-gradient(135deg,#fffbeb,#fef3c7)",border:"2px solid #fcd34d",borderRadius:10,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:28}}>{form.badge}</span>
              <div>
                <div style={{fontWeight:700,color:"#92400e",fontSize:14}}>{form.name}</div>
                <div style={{fontSize:12,color:"#d97706"}}>{form.description}</div>
                <div style={{fontSize:11,color:"#b45309",marginTop:2}}>
                  {form.type==="percent"?`${form.value}% off`:form.type==="flat"?`₹${form.value} off`:"Buy 1 Get 1"}
                  {form.startDate&&form.endDate&&` · ${form.startDate} to ${form.endDate}`}
                  {form.autoApply&&" · Auto-applies on buy page"}
                </div>
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:10}}>
            <button onClick={handleSave}
              style={{padding:"10px 24px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"white",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13}}>
              {editId?"Update Promotion":"Create Promotion"}
            </button>
            <button onClick={()=>{setShowForm(false);setEditId(null);setForm(blank);}}
              style={{padding:"10px 20px",background:"#f1f5f9",color:"#475569",border:"none",borderRadius:8,cursor:"pointer",fontSize:13}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display:"grid",gap:8 }}>
        {promos.length===0&&<div style={{ textAlign:"center",padding:40,color:"#94a3b8",background:"#f8fafc",borderRadius:12,fontSize:14 }}>No promotions yet.</div>}
        {promos.map(p=>{ const live=p.active&&today>=p.startDate&&today<=p.endDate; return(
          <div key={p.id} style={{ background:"white",border:`2px solid ${live?"#fcd34d":"#f1f5f9"}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ fontSize:28,flexShrink:0 }}>{p.badge}</div>
            <div style={{ flex:1 }}><div style={{ fontWeight:700,color:"#0f172a",fontSize:14 }}>{p.name}</div><div style={{ fontSize:12,color:"#64748b",marginTop:2 }}>{p.description}</div><div style={{ fontSize:11,color:"#94a3b8",marginTop:2 }}>{p.type==="percent"?`${p.value}% off`:p.type==="flat"?`â‚¹${p.value} off`:"Buy 1 Get 1"} Â· {p.startDate} â†’ {p.endDate}{p.autoApply?" Â· Auto-apply":""}</div></div>
            <div style={{ display:"flex",gap:8,flexShrink:0 }}>
              {live&&<span style={{ fontSize:11,background:"#fffbeb",color:"#d97706",padding:"3px 8px",borderRadius:6,fontWeight:600 }}>ðŸ”¥ LIVE</span>}
              <button onClick={()=>{planSyncService.updatePromotion(p.id,{active:!p.active});reload();}} style={{ padding:"5px 12px",background:p.active?"#fef2f2":"#f0fdf4",color:p.active?"#ef4444":"#10b981",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600 }}>{p.active?"Pause":"Resume"}</button>
              <button onClick={()=>{planSyncService.deletePromotion(p.id);reload();}} style={{ padding:"5px 10px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer",fontSize:12 }}>ðŸ—‘</button>
            </div>
          </div>
        );})}
      </div>

      {promos.length===0 ? (
        <div style={{textAlign:"center",padding:48,color:"#94a3b8",background:"#f8fafc",borderRadius:16,border:"2px dashed #e2e8f0"}}>
          <div style={{fontSize:40,marginBottom:12}}>🔥</div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:4}}>No promotions yet</div>
          <div style={{fontSize:13}}>Create time-limited offers that auto-apply on the buy page</div>
        </div>
      ) : (
        <div style={{display:"grid",gap:8}}>
          {promos.map(p=>{
            const live = p.active && today>=p.startDate && today<=p.endDate;
            const ended = p.endDate && today > p.endDate;
            const upcoming = p.startDate && today < p.startDate;
            return (
              <div key={p.id} style={{background:"white",border:`2px solid ${live?"#fcd34d":"#f1f5f9"}`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <div style={{fontSize:32,flexShrink:0}}>{p.badge}</div>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontWeight:700,color:"#0f172a",fontSize:15}}>{p.name}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{p.description}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:3,display:"flex",gap:8,flexWrap:"wrap"}}>
                    <span>{p.type==="percent"?`${p.value}% off`:p.type==="flat"?`₹${p.value} off`:"Buy 1 Get 1"}</span>
                    <span>·</span><span>{p.startDate} → {p.endDate}</span>
                    {p.autoApply&&<span>· 🤖 Auto-apply</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                  {live&&<span style={{fontSize:11,background:"#fffbeb",color:"#d97706",padding:"3px 8px",borderRadius:6,fontWeight:700}}>🔥 LIVE NOW</span>}
                  {ended&&<span style={{fontSize:11,background:"#fef2f2",color:"#ef4444",padding:"3px 8px",borderRadius:6,fontWeight:600}}>ENDED</span>}
                  {upcoming&&<span style={{fontSize:11,background:"#eff6ff",color:"#3b82f6",padding:"3px 8px",borderRadius:6,fontWeight:600}}>UPCOMING</span>}
                  {!live&&!ended&&!upcoming&&<span style={{fontSize:11,background:"#f1f5f9",color:"#64748b",padding:"3px 8px",borderRadius:6,fontWeight:600}}>PAUSED</span>}
                  <button onClick={()=>openEdit(p)}
                    style={{padding:"5px 12px",background:"#f1f5f9",color:"#374151",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>✏️ Edit</button>
                  <button onClick={()=>{planSyncService.updatePromotion(p.id,{active:!p.active});reload();}}
                    style={{padding:"5px 12px",background:p.active?"#fef2f2":"#f0fdf4",color:p.active?"#ef4444":"#10b981",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>
                    {p.active?"Pause":"Resume"}
                  </button>
                  <button onClick={()=>{if(window.confirm(`Delete "${p.name}"?`)){planSyncService.deletePromotion(p.id);reload();}}}
                    style={{padding:"5px 10px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer",fontSize:12}}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── REFERRAL PROGRAM TAB ─────────────────────────────────────────────────────
function ReferralTab() {
  const [prog, setProg] = React.useState<ReferralProgram>(() => planSyncService.getReferralProgram());
  const [records, setRecords] = React.useState<ReferralRecord[]>(() => planSyncService.getReferralRecords());
  const [saved, setSaved] = React.useState(false);
  const [filter, setFilter] = React.useState<"all"|"pending"|"converted"|"rewarded">("all");

  const handleSave = () => {
    planSyncService.saveReferralProgram(prog);
    setSaved(true); setTimeout(()=>setSaved(false),2000);
    toast.success("Referral program saved");
  };

  const stats = {
    total: records.length,
    pending: records.filter(r=>r.status==="pending").length,
    converted: records.filter(r=>r.status==="converted").length,
    rewarded: records.filter(r=>r.status==="rewarded").length,
    totalDiscount: records.filter(r=>r.status!=="pending").reduce((s,r)=>s+r.refereeDiscountAmount,0),
    totalRewards: records.filter(r=>r.status==="rewarded").reduce((s,r)=>s+r.referrerRewardAmount,0),
  };

  const filtered = records.filter(r=>filter==="all"||r.status===filter);

  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24 }}>
        {[["ðŸ”—","Total Referrals",stats.total,"#6366f1","#eff6ff"],["âœ…","Converted",stats.converted,"#10b981","#f0fdf4"],["ðŸŽ","Discounts Given",`â‚¹${stats.discounts.toLocaleString("en-IN")}` ,"#f59e0b","#fffbeb"]].map(([icon,lbl,val,color,bg]: any)=>(
          <div key={lbl} style={{ background:bg,borderRadius:12,padding:"16px 18px",border:`1px solid ${color}30` }}><div style={{ fontSize:24,marginBottom:4 }}>{icon}</div><div style={{ fontSize:22,fontWeight:800,color }}>{val}</div><div style={{ fontSize:12,color:"#64748b" }}>{lbl}</div></div>
        ))}
      </div>
      <div style={{ background:"white",border:"2px solid #e0e7ff",borderRadius:14,padding:20,marginBottom:20 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h4 style={{ margin:0,fontSize:16,fontWeight:700 }}>ðŸ“£ Referral Program</h4>
          <div onClick={()=>setProg(p=>({...p,enabled:!p.enabled}))} style={{ width:44,height:24,borderRadius:12,background:prog.enabled?"#10b981":"#e2e8f0",position:"relative",transition:"background 0.2s",cursor:"pointer" }}>
            <div style={{ width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:prog.enabled?22:3,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
          </div>
        </div>
        <div style={{ background:"linear-gradient(135deg,#eff6ff,#f5f3ff)",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:13,color:"#4338ca",lineHeight:1.6 }}>
          ðŸ‘¤ <strong>Referrer</strong> earns <strong>â‚¹{prog.referrerReward}</strong> when friend subscribes &nbsp;Â·&nbsp;
          ðŸŽ <strong>Referee</strong> gets <strong>â‚¹{prog.refereeDiscount} off</strong> first order
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
          {[["Referrer Reward â‚¹","referrerReward"],["Referee Discount â‚¹","refereeDiscount"],["Min Order â‚¹","minRefereeOrderValue"],["Max Rewards/Person","maxRewardsPerReferrer"],["Validity (days)","rewardValidity"]].map(([lbl,k]: any)=>(
            <div key={k}><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>{lbl}</label><input type="number" value={(prog as any)[k]} onChange={e=>setProg(p=>({...p,[k]:Number(e.target.value)}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:24}}>
        {[
          {icon:"🔗",label:"Total Referrals",value:stats.total,color:"#6366f1",bg:"#eff6ff"},
          {icon:"⏳",label:"Pending",value:stats.pending,color:"#f59e0b",bg:"#fffbeb"},
          {icon:"✅",label:"Converted",value:stats.converted,color:"#10b981",bg:"#f0fdf4"},
          {icon:"🎁",label:"Discounts Given",value:`₹${stats.totalDiscount.toLocaleString("en-IN")}`,color:"#8b5cf6",bg:"#f5f3ff"},
          {icon:"💰",label:"Rewards Paid",value:`₹${stats.totalRewards.toLocaleString("en-IN")}`,color:"#ec4899",bg:"#fdf2f8"},
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:12,padding:"12px 14px",border:`1px solid ${s.color}20`}}>
            <div style={{fontSize:20}}>{s.icon}</div>
            <div style={{fontSize:18,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#64748b"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Program settings */}
      <div style={{background:"white",border:"2px solid #e0e7ff",borderRadius:16,padding:20,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h4 style={{margin:0,fontSize:16,fontWeight:700,color:"#0f172a"}}>📣 Referral Program Settings</h4>
            <p style={{margin:"4px 0 0",fontSize:12,color:"#64748b"}}>Both the referrer and referee get rewarded</p>
          </div>
          <div onClick={()=>setProg(p=>({...p,enabled:!p.enabled}))}
            style={{width:52,height:28,borderRadius:14,background:prog.enabled?"#10b981":"#e2e8f0",position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:"white",position:"absolute",top:3,left:prog.enabled?27:3,transition:"left 0.2s",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"}} />
          </div>
        </div>

        {/* How it works preview */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div style={{background:"linear-gradient(135deg,#eff6ff,#dbeafe)",borderRadius:12,padding:"14px 16px",border:"1px solid #bfdbfe"}}>
            <div style={{fontSize:24,marginBottom:6}}>👤</div>
            <div style={{fontSize:13,fontWeight:700,color:"#1e40af",marginBottom:4}}>Referrer gets</div>
            <div style={{fontSize:22,fontWeight:800,color:"#1e40af"}}>₹{prog.referrerReward}</div>
            <div style={{fontSize:11,color:"#3b82f6"}}>{prog.referrerRewardType==="flat"?"flat credit":"% off next renewal"} · valid {prog.rewardValidity} days</div>
          </div>
          <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:12,padding:"14px 16px",border:"1px solid #86efac"}}>
            <div style={{fontSize:24,marginBottom:6}}>🎁</div>
            <div style={{fontSize:13,fontWeight:700,color:"#065f46",marginBottom:4}}>Referee gets</div>
            <div style={{fontSize:22,fontWeight:800,color:"#065f46"}}>₹{prog.refereeDiscount}</div>
            <div style={{fontSize:11,color:"#10b981"}}>{prog.refereeDiscountType==="flat"?"flat off first order":"% off first order"} · min ₹{prog.minRefereeOrderValue}</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
          {[
            {label:"Referrer Reward (₹)",key:"referrerReward"},
            {label:"Referee Discount (₹)",key:"refereeDiscount"},
            {label:"Min Order Value (₹)",key:"minRefereeOrderValue"},
            {label:"Max Rewards per Person",key:"maxRewardsPerReferrer"},
            {label:"Reward Validity (days)",key:"rewardValidity"},
          ].map(({label,key})=>(
            <div key={key}>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>{label}</label>
              <input type="number" value={(prog as any)[key]}
                onChange={e=>setProg(p=>({...p,[key]:Number(e.target.value)}))}
                style={{width:"100%",padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} />
            </div>
          ))}
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>Terms shown to customers</label>
          <textarea value={prog.termsText} onChange={e=>setProg(p=>({...p,termsText:e.target.value}))} rows={2}
            style={{width:"100%",padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}} />
        </div>
        <button onClick={handleSave}
          style={{padding:"11px 28px",background:saved?"#10b981":"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",border:"none",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:14,transition:"background 0.3s"}}>
          {saved?"✓ Saved!":"Save Referral Settings"}
        </button>
      </div>

      {/* Referral records */}
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h4 style={{margin:0,fontSize:15,fontWeight:700,color:"#0f172a"}}>Referral Activity</h4>
          <div style={{display:"flex",gap:6}}>
            {(["all","pending","converted","rewarded"] as const).map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                style={{padding:"5px 12px",borderRadius:20,border:`2px solid ${filter===f?"#6366f1":"#e2e8f0"}`,background:filter===f?"#eff6ff":"white",color:filter===f?"#4338ca":"#64748b",fontWeight:filter===f?700:400,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {filtered.length===0 ? (
          <div style={{textAlign:"center",padding:40,color:"#94a3b8",background:"#f8fafc",borderRadius:12,border:"2px dashed #e2e8f0"}}>
            <div style={{fontSize:32,marginBottom:8}}>🔗</div>
            <div style={{fontWeight:600,marginBottom:4}}>No referrals yet</div>
            <div style={{fontSize:12}}>Customers generate referral codes from their profile page</div>
          </div>
        ) : filtered.map(r=>(
          <div key={r.id} style={{background:"white",border:"1.5px solid #f1f5f9",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,flexShrink:0}}>
              {r.referrerName.charAt(0)}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13,color:"#0f172a"}}>{r.referrerName}</div>
              <div style={{fontSize:11,color:"#94a3b8"}}>Code: <strong style={{fontFamily:"monospace",color:"#6366f1"}}>{r.referralCode}</strong> · {new Date(r.createdAt).toLocaleDateString("en-IN")}</div>
              {r.refereeName&&<div style={{fontSize:11,color:"#64748b",marginTop:1}}>→ {r.refereeName}{r.orderAmount?` · ₹${r.orderAmount.toLocaleString("en-IN")}`:""}</div>}
            </div>
            <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:700,
              background:r.status==="converted"?"#f0fdf4":r.status==="rewarded"?"#eff6ff":r.status==="expired"?"#fef2f2":"#fffbeb",
              color:r.status==="converted"?"#10b981":r.status==="rewarded"?"#6366f1":r.status==="expired"?"#ef4444":"#d97706"}}>
              {r.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PLAN SYNC STATUS TAB ─────────────────────────────────────────────────────
function PlanSyncStatus() {
  const livePrices = planSyncService.getAllPlanPrices();
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  return (
    <div>
      <h3 style={{ margin:"0 0 8px",fontSize:18,fontWeight:700,color:"#0f172a" }}>ðŸ”„ Single Source of Truth â€” Plan Prices</h3>
      <p style={{ margin:"0 0 20px",fontSize:13,color:"#64748b" }}>These prices from the Plan Editor propagate to ALL parts of the system: Customer Buy Page, TSE App, TSM App, and Car Washer screen. Change a price above â€” it updates everywhere instantly.</p>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16 }}>
        {["","Hatchback","SUV / Sedan","Luxury"].map((h,i)=>(
          <div key={i} style={{ padding:"10px 14px",background:i===0?"transparent":"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:10,fontWeight:700,fontSize:13,color:i===0?"#64748b":"white",textAlign:"center" }}>{h}</div>
        ))}
        {livePrices.map(p=>(
          <React.Fragment key={p.id}>
            <div style={{ padding:"12px 14px",background:"linear-gradient(135deg,#f8fafc,white)",borderRadius:10,fontWeight:700,fontSize:14,color:"#0f172a",display:"flex",alignItems:"center",gap:8,border:"1px solid #e2e8f0" }}><span style={{ fontSize:18 }}>{p.icon}</span>{p.name}</div>
            {[p.hatchback,p.suv,p.luxury].map((price,i)=>(
              <div key={i} style={{ padding:"12px 14px",background:"linear-gradient(135deg,#eff6ff,#f5f3ff)",borderRadius:10,textAlign:"center",border:"1px solid #e0e7ff" }}>
                <div style={{ fontSize:20,fontWeight:800,color:"#4338ca" }}>â‚¹{price.toLocaleString("en-IN")}</div>
                <div style={{ fontSize:10,color:"#94a3b8" }}>per month</div>
              </div>
      <h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:700,color:"#0f172a"}}>🔄 Single Source of Truth — Plan Prices</h3>
      <p style={{margin:"0 0 20px",fontSize:13,color:"#64748b"}}>Prices edited above propagate to all parts of the system instantly — Customer Buy Page, TSE App, TSM App, and Car Washer screen.</p>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr>
              {["Plan","Hatchback","SUV / Sedan","Luxury / Large SUV"].map((h,i)=>(
                <th key={h} style={{padding:"10px 14px",background:i===0?"#f8fafc":"linear-gradient(135deg,#1e1b4b,#312e81)",color:i===0?"#64748b":"white",textAlign:i===0?"left":"center",fontWeight:700,borderRadius:i===0?0:0,border:"1px solid #e2e8f0"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {livePrices.map((p,i)=>(
              <tr key={p.id} style={{background:i%2===0?"white":"#f8fafc"}}>
                <td style={{padding:"12px 14px",fontWeight:700,color:"#0f172a",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:20}}>{p.icon}</span>{p.name}
                </td>
                {[p.hatchback,p.suv,p.luxury].map((price,j)=>(
                  <td key={j} style={{padding:"12px 14px",textAlign:"center",border:"1px solid #e2e8f0"}}>
                    <span style={{fontWeight:800,fontSize:15,color:"#4338ca"}}>{inr(price)}</span>
                    <div style={{fontSize:10,color:"#94a3b8"}}>per month</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12 }}>
        {[["Customer Buy Page","/#/buy","These prices show on the customer checkout page when they select a plan"],["TSE App","/#/tse-app","TSE sees these prices when pitching plans to leads during a call"],["TSM App","/#/tsm-app","TSM dashboards and team performance use these base prices"],["Car Washer Screen","/#/washer-core-screens","Service confirmation and job details show plan name and value"]].map(([name,path,desc])=>(
          <div key={name} style={{ background:"white",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start" }}>
            <div style={{ width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:16,flexShrink:0 }}>âœ…</div>
            <div><div style={{ fontWeight:700,fontSize:14,color:"#0f172a" }}>{name}</div><div style={{ fontSize:12,color:"#64748b",marginTop:2 }}>{desc}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginTop:20}}>
        {[
          ["Customer Buy Page","/#/buy","These exact prices show on checkout"],
          ["TSE App","/#/tse-app","TSE sees these when pitching to leads"],
          ["TSM Dashboard","/#/tsm-app","Revenue projections use these prices"],
          ["Car Washer Screen","/#/washer-core-screens","Job details show plan name and value"],
        ].map(([name,path,desc])=>(
          <div key={name} style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:14,flexShrink:0}}>✅</div>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:"#0f172a"}}>{name}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



