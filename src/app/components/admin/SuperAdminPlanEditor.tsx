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

// ─── Small reusable field components ─────────────────────────────────────────
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
        <span style={{ color: "#6B7280", fontSize: 18 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ padding: "20px" }}>{children}</div>}
    </div>
  );
};

// ─── AddModelRow: small inline form to add a new car model ───────────────────
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
    toast.success(`Added "${clean}" → ${categories.find(c => c.id === cat)?.label}`);
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function SuperAdminPlanEditor() {
  const { currentRole } = useRole();
  const [cfg, setCfg] = useState<PlanPageConfig>(loadConfig);
  const [activeTab, setActiveTab] = useState<"editor" | "preview" | "coupons" | "promotions" | "referral" | "sync">("editor");
  const [isDirty, setIsDirty] = useState(false);

  // Guard: Super Admin only
  if (currentRole !== "Super Admin") {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
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

  const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

  const CATEGORIES = cfg.vehicleCategories;

  // ── Helpers for list editing ──────────────────────────────────────────────
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
            <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Super Admin · Customer-facing plan purchase page</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isDirty && <span style={{ fontSize: 12, color: "#F59E0B", background: "#FEF3C7", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>● Unsaved changes</span>}
          <a href="/buy" target="_blank" rel="noreferrer"
            style={{ padding: "8px 16px", background: "#F3F4F6", color: "#374151", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1.5px solid #E5E7EB" }}>
            👁 Preview Page
          </a>
          <button onClick={handleReset}
            style={{ padding: "8px 14px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Reset
          </button>
          <button onClick={handleSave}
            style={{ padding: "9px 22px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            💾 Save & Publish
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 24px 60px" }}>

        {/* ── §1 BRAND ─────────────────────────────────────────────────── */}
        <Section title="Brand & Contact" icon="🏢">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <Field label="Brand Name" value={cfg.brand.name} onChange={v => update(c => ({ ...c, brand: { ...c.brand, name: v } }))} />
            <Field label="Phone (displayed in nav)" value={cfg.brand.phone} onChange={v => update(c => ({ ...c, brand: { ...c.brand, phone: v } }))} />
            <Field label="WhatsApp Number (digits only, no +)" value={cfg.brand.whatsappNumber} onChange={v => update(c => ({ ...c, brand: { ...c.brand, whatsappNumber: v } }))} hint="e.g. 918238705601" />
            <Field label="Tagline (meta)" value={cfg.brand.tagline} onChange={v => update(c => ({ ...c, brand: { ...c.brand, tagline: v } }))} />
          </div>
        </Section>

        {/* ── §2 HERO ─────────────────────────────────────────────────── */}
        <Section title="Hero Section" icon="🎯">
          <Field label="Badge Text (top pill)" value={cfg.hero.badge} onChange={v => update(c => ({ ...c, hero: { ...c.hero, badge: v } }))} hint="e.g. 🚗 Surat's #1 Daily Car Wash Service" />
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
                  style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>✕</button>
              </div>
            ))}
            <button onClick={() => update(c => ({ ...c, trustItems: [...c.trustItems, "🚀 New trust item"] }))}
              style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Item</button>
          </div>
        </Section>

        {/* ── §3 PINCODES ─────────────────────────────────────────────── */}
        <Section title="Serviceable Pincodes" icon="📍">
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>These appear as clickable chips and determine if a customer sees "✅ Serviceable" or "⚠️ Waitlist".</p>
          {cfg.serviceablePincodes.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={p.code} maxLength={6} onChange={e => update(c => ({ ...c, serviceablePincodes: c.serviceablePincodes.map((pp, j) => j === i ? { ...pp, code: e.target.value.replace(/\D/g,"").slice(0,6) } : pp) }))}
                style={{ width: 100, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontFamily: "inherit", letterSpacing: 2, fontWeight: 700 }} placeholder="395007" />
              <input value={p.label} onChange={e => update(c => ({ ...c, serviceablePincodes: c.serviceablePincodes.map((pp, j) => j === i ? { ...pp, label: e.target.value } : pp) }))}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }} placeholder="Vesu / Pal" />
              <button onClick={() => update(c => ({ ...c, serviceablePincodes: c.serviceablePincodes.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, serviceablePincodes: [...c.serviceablePincodes, { code: "", label: "" }] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Pincode</button>
        </Section>

        {/* ── §3.5 VEHICLE CATEGORIES ──────────────────────────────────── */}
        <Section title="Vehicle Categories" icon="🚗">
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>
            These are the 3 tiers customers choose from on the buy page. Each category has its own pricing column in the plan table.
          </p>
          <div style={{ background: "#FEF9C3", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#92400E" }}>
            ⚠️ <strong>Important:</strong> If you add or remove a category, go to <strong>§4 Monthly Plan Prices</strong> and set prices for the new category. Car models in §12 assigned to a deleted category will fall back to the first category.
          </div>

          {cfg.vehicleCategories.map((cat, i) => (
            <div key={cat.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 2fr auto", gap: 10, marginBottom: 10, alignItems: "center" }}>
              {/* Emoji icon */}
              <input
                value={cat.icon}
                onChange={e => update(c => ({ ...c, vehicleCategories: c.vehicleCategories.map((cc, j) => j !== i ? cc : { ...cc, icon: e.target.value }) }))}
                style={{ padding: "8px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 22, textAlign: "center", fontFamily: "inherit" }}
                placeholder="🚗"
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
                  title="Category ID — used in car model map"
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
              {/* Delete — only if more than 1 category */}
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
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={() => update(c => ({
              ...c,
              vehicleCategories: [...c.vehicleCategories, { id: `cat${Date.now()}`, label: "New Category", icon: "🚘" }],
              monthlyPlans: c.monthlyPlans.map(p => ({ ...p, prices: { ...p.prices, [`cat${Date.now()}`]: 0 } })),
            }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, marginTop: 6 }}>
            + Add Category
          </button>
        </Section>

        {/* ── §4 MONTHLY PLAN PRICES ──────────────────────────────────── */}
        <Section title="Monthly Plan Prices" icon="💰">
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
                          <span style={{ position: "absolute", left: 10, color: "#6B7280", fontWeight: 600, fontSize: 13 }}>₹</span>
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

        {/* ── §5 PLAN FEATURES ─────────────────────────────────────────── */}
        <Section title="Monthly Plan Features & Names" icon="📋">
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
                    style={{ padding: "6px 10px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 7, cursor: "pointer", fontSize: 13 }}>✕</button>
                </div>
              ))}
              <button onClick={() => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, features: [...p.features, { text: "New feature", included: true }] }) }))}
                style={{ padding: "6px 12px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600, marginTop: 6 }}>+ Feature</button>
            </div>
          ))}
        </Section>

        {/* ── §6 PACKS ─────────────────────────────────────────────────── */}
        <Section title="Repeat / One-Time Packs" icon="🎟️">
          {cfg.packs.map((pack, i) => (
            <div key={pack.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 1fr auto", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <input value={pack.name} onChange={e => update(c => ({ ...c, packs: c.packs.map((p, j) => j !== i ? p : { ...p, name: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="Pack name" />
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: 10, color: "#6B7280", fontSize: 13 }}>₹</span>
                <input type="number" value={pack.price} onChange={e => update(c => ({ ...c, packs: c.packs.map((p, j) => j !== i ? p : { ...p, price: parseInt(e.target.value) || 0 }) }))}
                  style={{ width: "100%", padding: "8px 8px 8px 22px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontWeight: 700 }} />
              </div>
              <input value={pack.perLabel} onChange={e => update(c => ({ ...c, packs: c.packs.map((p, j) => j !== i ? p : { ...p, perLabel: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="e.g. 2× per month · ₹186/wash" />
              <input value={pack.discount} onChange={e => update(c => ({ ...c, packs: c.packs.map((p, j) => j !== i ? p : { ...p, discount: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="7% off" />
              <button onClick={() => update(c => ({ ...c, packs: c.packs.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, packs: [...c.packs, { id: `pack-${Date.now()}`, name: "New Pack", icon: "📦", price: 0, perLabel: "", discount: "" }] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Pack</button>
        </Section>

        {/* ── §7 COMMITMENTS ───────────────────────────────────────────── */}
        <Section title="Commitment / Loyalty Options" icon="🤝">
          {cfg.commitments.map((c, i) => (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 3fr auto", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <input value={c.term} onChange={e => update(cfg => ({ ...cfg, commitments: cfg.commitments.map((cc, j) => j !== i ? cc : { ...cc, term: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="e.g. 3 Months" />
              <input value={c.discountLabel} onChange={e => update(cfg => ({ ...cfg, commitments: cfg.commitments.map((cc, j) => j !== i ? cc : { ...cc, discountLabel: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="5% off" />
              <input value={c.perk} onChange={e => update(cfg => ({ ...cfg, commitments: cfg.commitments.map((cc, j) => j !== i ? cc : { ...cc, perk: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="Perk description" />
              <button onClick={() => update(cfg => ({ ...cfg, commitments: cfg.commitments.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, commitments: [...c.commitments, { id: `commit-${Date.now()}`, term: "New Option", discountLabel: "0%", perk: "" }] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Option</button>
        </Section>

        {/* ── §8 ADD-ONS ───────────────────────────────────────────────── */}
        <Section title="Add-ons" icon="➕">
          {cfg.addons.map((addon, i) => (
            <div key={addon.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, marginBottom: 10, alignItems: "center" }}>
                <input value={addon.name} onChange={e => update(c => ({ ...c, addons: c.addons.map((a, j) => j !== i ? a : { ...a, name: e.target.value }) }))}
                  style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="Add-on name" />
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: 10, color: "#6B7280", fontSize: 13 }}>₹</span>
                  <input type="number" value={addon.price} onChange={e => update(c => ({ ...c, addons: c.addons.map((a, j) => j !== i ? a : { ...a, price: parseInt(e.target.value) || 0 }) }))}
                    style={{ width: "100%", padding: "8px 8px 8px 22px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontWeight: 700 }} />
                </div>
                <input value={addon.unit} onChange={e => update(c => ({ ...c, addons: c.addons.map((a, j) => j !== i ? a : { ...a, unit: e.target.value }) }))}
                  style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="per visit" />
                <button onClick={() => update(c => ({ ...c, addons: c.addons.filter((_, j) => j !== i) }))}
                  style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
              </div>
              <input value={addon.description} onChange={e => update(c => ({ ...c, addons: c.addons.map((a, j) => j !== i ? a : { ...a, description: e.target.value }) }))}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="Short description" />
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, addons: [...c.addons, { id: `addon-${Date.now()}`, name: "New Add-on", price: 0, unit: "per visit", description: "" }] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Add-on</button>
        </Section>

        {/* ── §9 TIME SLOTS ────────────────────────────────────────────── */}
        <Section title="Preferred Time Slots" icon="⏰">
          {cfg.timeSlots.map((slot, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={slot} onChange={e => update(c => ({ ...c, timeSlots: updateStringList(c.timeSlots, i, e.target.value) }))}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
              <button onClick={() => update(c => ({ ...c, timeSlots: c.timeSlots.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, timeSlots: [...c.timeSlots, "New slot"] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Slot</button>
        </Section>

        {/* ── §10 POST-PAYMENT STEPS ───────────────────────────────────── */}
        <Section title="Post-Payment Steps (shown on success page)" icon="✅">
          {cfg.postPaymentSteps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#2196F3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
              <input value={step} onChange={e => update(c => ({ ...c, postPaymentSteps: updateStringList(c.postPaymentSteps, i, e.target.value) }))}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
              <button onClick={() => update(c => ({ ...c, postPaymentSteps: c.postPaymentSteps.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, postPaymentSteps: [...c.postPaymentSteps, "New step"] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Step</button>
        </Section>

        {/* ── §11 TRUST STRIP ─────────────────────────────────────────── */}
        <Section title="Trust Strip (bottom bar)" icon="🔵">
          {cfg.trustStrip.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={item} onChange={e => update(c => ({ ...c, trustStrip: updateStringList(c.trustStrip, i, e.target.value) }))}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
              <button onClick={() => update(c => ({ ...c, trustStrip: c.trustStrip.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, trustStrip: [...c.trustStrip, "🌟 New trust item"] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Item</button>
        </Section>

        {/* ── §12 CAR MODEL MAP ────────────────────────────────────────── */}
        <Section title="Car Model → Category Mapping" icon="🚗">
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>
            Each row is a <strong>keyword</strong> (matched against what the customer types) mapped to a <strong>vehicle category</strong>.
            Matching is case-insensitive and partial — e.g. keyword <code style={{ background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>swift</code> will match "Maruti Swift", "Swift Dzire", etc.
          </p>
          <p style={{ fontSize: 12, color: "#F59E0B", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px", marginBottom: 16 }}>
            ⚠️ Keep keywords <strong>short and unique</strong>. Avoid generic words like "car" or "new" — they'll match everything.
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
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Add new model row */}
          <div style={{ marginTop: 14, padding: "14px 16px", background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#166534", marginBottom: 10 }}>➕ Add New Car Model</p>
            <AddModelRow
              categories={cfg.vehicleCategories}
              onAdd={(kw, cat) => update(c => ({ ...c, carModelMap: { ...c.carModelMap, [kw]: cat } }))}
            />
          </div>

          {/* Bulk add hint */}
          <div style={{ marginTop: 12, fontSize: 12, color: "#6B7280" }}>
            💡 <strong>Tip:</strong> Add the main model name only — e.g. <code style={{ background: "#F3F4F6", padding: "1px 4px", borderRadius: 3 }}>creta</code> not "Hyundai Creta 2024 Facelift". The match is partial so it covers all variants.
          </div>
        </Section>

        {/* SAVE BAR */}
        <div style={{ position: "sticky", bottom: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          {isDirty && (
            <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "14px 24px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>You have unsaved changes</span>
              <button onClick={handleSave}
                style={{ padding: "10px 28px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                💾 Save & Publish Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* COUPONS TAB */}
      {activeTab === "coupons" && (
        <div style={{ padding: "24px" }}>
          <CouponManagementTab monthlyPlans={[{id:"water",name:"Express Wash"},{id:"shampoo",name:"Smart Wash"},{id:"wax",name:"Elite Wash"}]} />
        </div>
      )}

      {/* PROMOTIONS TAB */}
      {activeTab === "promotions" && (
        <div style={{ padding: "24px" }}>
          <PromotionsTab monthlyPlans={[{id:"water",name:"Express Wash"},{id:"shampoo",name:"Smart Wash"},{id:"wax",name:"Elite Wash"}]} />
        </div>
      )}

      {/* REFERRAL TAB */}
      {activeTab === "referral" && (
        <div style={{ padding: "24px" }}>
          <ReferralTab />
        </div>
      )}

      {/* PLAN SYNC STATUS TAB */}
      {activeTab === "sync" && (
        <div style={{ padding: "24px" }}>
          <PlanSyncStatus />
        </div>
      )}


    </div>
  );
}

// ─── INJECTED TAB COMPONENTS ─────────────────────────────────────────────────
// Coupon, Promotion, Referral, PlanSync tabs
import type { CouponCode, Promotion, ReferralProgram, ReferralRecord } from "../../services/planSyncService";

function CouponManagementTab({ monthlyPlans }: { monthlyPlans: { id: string; name: string }[] }) {
  const [coupons, setCoupons] = React.useState<CouponCode[]>(() => planSyncService.getCoupons());
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ code:"", type:"percent" as "percent"|"flat", value:10, minOrderValue:0, maxUses:0, validFrom:"", validTo:"", applicablePlans:[] as string[], active:true, description:"", createdBy:"Admin" });
  const today = new Date().toISOString().slice(0,10);
  const reload = () => setCoupons(planSyncService.getCoupons());

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div><h3 style={{ margin:0, fontSize:18, fontWeight:700, color:"#0f172a" }}>🎟️ Coupon Codes</h3><p style={{ margin:"4px 0 0", fontSize:13, color:"#64748b" }}>{coupons.length} coupons · {coupons.filter(c=>c.active).length} active</p></div>
        <button onClick={()=>setShowForm(!showForm)} style={{ padding:"10px 20px", background:"linear-gradient(135deg,#10b981,#059669)", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" }}>+ New Coupon</button>
      </div>
      {showForm && (
        <div style={{ background:"#f0fdf4", borderRadius:14, padding:20, marginBottom:20, border:"2px solid #86efac" }}>
          <h4 style={{ margin:"0 0 14px", color:"#065f46" }}>Create Coupon</h4>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
            {[["Code *","code","SAVE20","text"],["Description","description","e.g. Welcome offer","text"],["Min Order ₹","minOrderValue","500","number"],["Max Uses (0=∞)","maxUses","100","number"],["Valid From","validFrom","","date"],["Valid To","validTo","","date"]] .map(([lbl,k,ph,tp]: any)=>(
              <div key={k}><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>{lbl}</label>
              <input type={tp} value={(form as any)[k]} onChange={e=>setForm(p=>({...p,[k]:tp==="number"?Number(e.target.value):e.target.value}))} placeholder={ph} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #d1fae5",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>
            ))}
          </div>
          <div style={{ display:"flex",gap:10,marginBottom:10 }}>
            <div style={{ flex:1 }}><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>Type</label><select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value as any}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #d1fae5",borderRadius:8,fontSize:13,fontFamily:"inherit" }}><option value="percent">% off</option><option value="flat">₹ flat off</option></select></div>
            <div style={{ flex:1 }}><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>Value</label><input type="number" value={form.value} onChange={e=>setForm(p=>({...p,value:Number(e.target.value)}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #d1fae5",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>{ if(!form.code.trim()){toast.error("Code required");return;} planSyncService.addCoupon({...form,code:form.code.toUpperCase()}); toast.success("Coupon created"); setShowForm(false); reload(); }} style={{ padding:"10px 24px",background:"#10b981",color:"white",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13 }}>Create</button>
            <button onClick={()=>setShowForm(false)} style={{ padding:"10px 18px",background:"#f1f5f9",color:"#475569",border:"none",borderRadius:8,cursor:"pointer",fontSize:13 }}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display:"grid",gap:8 }}>
        {coupons.length===0&&<div style={{ textAlign:"center",padding:40,color:"#94a3b8",background:"#f8fafc",borderRadius:12,fontSize:14 }}>No coupons yet. Create your first one above.</div>}
        {coupons.map(c=>{ const exp=c.validTo&&today>c.validTo; return(
          <div key={c.id} style={{ background:"white",border:`2px solid ${c.active&&!exp?"#d1fae5":"#f1f5f9"}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ padding:"7px 14px",background:`linear-gradient(135deg,${c.active&&!exp?"#10b981":"#94a3b8"},${c.active&&!exp?"#059669":"#cbd5e1"})`,color:"white",borderRadius:10,fontWeight:800,fontSize:14,letterSpacing:1,minWidth:100,textAlign:"center",fontFamily:"monospace" }}>{c.code}</div>
            <div style={{ flex:1 }}><div style={{ fontWeight:700,color:"#0f172a",fontSize:14 }}>{c.type==="percent"?`${c.value}% off`:`₹${c.value} off`}{c.description&&<span style={{ fontWeight:400,color:"#64748b",marginLeft:8 }}>· {c.description}</span>}</div><div style={{ fontSize:12,color:"#94a3b8",marginTop:2 }}>{c.maxUses>0?`${c.usedCount}/${c.maxUses} used`:`${c.usedCount} used`}{c.validTo&&` · Expires ${c.validTo}`}{c.minOrderValue>0&&` · Min ₹${c.minOrderValue}`}</div></div>
            <div style={{ display:"flex",gap:8,flexShrink:0 }}>
              {exp&&<span style={{ fontSize:11,background:"#fef2f2",color:"#ef4444",padding:"3px 8px",borderRadius:6,fontWeight:600 }}>EXPIRED</span>}
              {!exp&&c.active&&<span style={{ fontSize:11,background:"#f0fdf4",color:"#10b981",padding:"3px 8px",borderRadius:6,fontWeight:600 }}>ACTIVE</span>}
              <button onClick={()=>{planSyncService.updateCoupon(c.id,{active:!c.active});reload();}} style={{ padding:"5px 12px",background:c.active?"#fef2f2":"#f0fdf4",color:c.active?"#ef4444":"#10b981",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600 }}>{c.active?"Disable":"Enable"}</button>
              <button onClick={()=>{planSyncService.deleteCoupon(c.id);reload();}} style={{ padding:"5px 10px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer",fontSize:12 }}>🗑</button>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function PromotionsTab({ monthlyPlans }: { monthlyPlans: { id: string; name: string }[] }) {
  const [promos, setPromos] = React.useState<Promotion[]>(() => planSyncService.getPromotions());
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ name:"",description:"",type:"percent" as any,value:10,applicablePlans:[] as string[],startDate:"",endDate:"",active:true,autoApply:false,badge:"🎉",createdBy:"Admin" });
  const today = new Date().toISOString().slice(0,10);
  const reload = () => setPromos(planSyncService.getPromotions());
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div><h3 style={{ margin:0,fontSize:18,fontWeight:700,color:"#0f172a" }}>🔥 Offers & Promotions</h3><p style={{ margin:"4px 0 0",fontSize:13,color:"#64748b" }}>{promos.filter(p=>p.active&&today>=p.startDate&&today<=p.endDate).length} currently live</p></div>
        <button onClick={()=>setShowForm(!showForm)} style={{ padding:"10px 20px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"white",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer" }}>+ New Promotion</button>
      </div>
      {showForm&&(
        <div style={{ background:"#fffbeb",borderRadius:14,padding:20,marginBottom:20,border:"2px solid #fcd34d" }}>
          <h4 style={{ margin:"0 0 12px",color:"#92400e" }}>Create Promotion</h4>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
            {[["Name *","name","Diwali Special"],["Badge","badge","🎄"],["Description","description","Shown on buy page"],["Type — Value (e.g. 20 for 20%/₹200)","","",""]] .slice(0,3).map(([lbl,k,ph]: any)=>(<div key={k}><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>{lbl}</label><input value={(form as any)[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>))}
            <div><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>Type</label><select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit" }}><option value="percent">% Discount</option><option value="flat">₹ Flat Off</option><option value="bogo">Buy 1 Get 1</option></select></div>
            <div><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>Value</label><input type="number" value={form.value} onChange={e=>setForm(p=>({...p,value:Number(e.target.value)}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>
            <div><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>Start</label><input type="date" value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>
            <div><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>End</label><input type="date" value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #fde68a",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>
          </div>
          <div style={{ display:"flex",gap:20,marginBottom:10 }}>
            <label style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,fontWeight:600 }}><input type="checkbox" checked={form.autoApply} onChange={e=>setForm(p=>({...p,autoApply:e.target.checked}))} />Auto-apply (banner on buy page)</label>
            <label style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,fontWeight:600 }}><input type="checkbox" checked={form.active} onChange={e=>setForm(p=>({...p,active:e.target.checked}))} />Active</label>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>{ if(!form.name.trim()){toast.error("Name required");return;} planSyncService.addPromotion(form); toast.success("Promotion created"); setShowForm(false); reload(); }} style={{ padding:"10px 24px",background:"#f59e0b",color:"white",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13 }}>Create</button>
            <button onClick={()=>setShowForm(false)} style={{ padding:"10px 18px",background:"#f1f5f9",color:"#475569",border:"none",borderRadius:8,cursor:"pointer",fontSize:13 }}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display:"grid",gap:8 }}>
        {promos.length===0&&<div style={{ textAlign:"center",padding:40,color:"#94a3b8",background:"#f8fafc",borderRadius:12,fontSize:14 }}>No promotions yet.</div>}
        {promos.map(p=>{ const live=p.active&&today>=p.startDate&&today<=p.endDate; return(
          <div key={p.id} style={{ background:"white",border:`2px solid ${live?"#fcd34d":"#f1f5f9"}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ fontSize:28,flexShrink:0 }}>{p.badge}</div>
            <div style={{ flex:1 }}><div style={{ fontWeight:700,color:"#0f172a",fontSize:14 }}>{p.name}</div><div style={{ fontSize:12,color:"#64748b",marginTop:2 }}>{p.description}</div><div style={{ fontSize:11,color:"#94a3b8",marginTop:2 }}>{p.type==="percent"?`${p.value}% off`:p.type==="flat"?`₹${p.value} off`:"Buy 1 Get 1"} · {p.startDate} → {p.endDate}{p.autoApply?" · Auto-apply":""}</div></div>
            <div style={{ display:"flex",gap:8,flexShrink:0 }}>
              {live&&<span style={{ fontSize:11,background:"#fffbeb",color:"#d97706",padding:"3px 8px",borderRadius:6,fontWeight:600 }}>🔥 LIVE</span>}
              <button onClick={()=>{planSyncService.updatePromotion(p.id,{active:!p.active});reload();}} style={{ padding:"5px 12px",background:p.active?"#fef2f2":"#f0fdf4",color:p.active?"#ef4444":"#10b981",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600 }}>{p.active?"Pause":"Resume"}</button>
              <button onClick={()=>{planSyncService.deletePromotion(p.id);reload();}} style={{ padding:"5px 10px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer",fontSize:12 }}>🗑</button>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function ReferralTab() {
  const [prog, setProg] = React.useState<ReferralProgram>(() => planSyncService.getReferralProgram());
  const [records] = React.useState<ReferralRecord[]>(() => planSyncService.getReferralRecords());
  const stats = { total:records.length, converted:records.filter(r=>r.status==="converted").length, discounts:records.reduce((s,r)=>s+r.refereeDiscountAmount,0) };
  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24 }}>
        {[["🔗","Total Referrals",stats.total,"#6366f1","#eff6ff"],["✅","Converted",stats.converted,"#10b981","#f0fdf4"],["🎁","Discounts Given",`₹${stats.discounts.toLocaleString("en-IN")}` ,"#f59e0b","#fffbeb"]].map(([icon,lbl,val,color,bg]: any)=>(
          <div key={lbl} style={{ background:bg,borderRadius:12,padding:"16px 18px",border:`1px solid ${color}30` }}><div style={{ fontSize:24,marginBottom:4 }}>{icon}</div><div style={{ fontSize:22,fontWeight:800,color }}>{val}</div><div style={{ fontSize:12,color:"#64748b" }}>{lbl}</div></div>
        ))}
      </div>
      <div style={{ background:"white",border:"2px solid #e0e7ff",borderRadius:14,padding:20,marginBottom:20 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h4 style={{ margin:0,fontSize:16,fontWeight:700 }}>📣 Referral Program</h4>
          <div onClick={()=>setProg(p=>({...p,enabled:!p.enabled}))} style={{ width:44,height:24,borderRadius:12,background:prog.enabled?"#10b981":"#e2e8f0",position:"relative",transition:"background 0.2s",cursor:"pointer" }}>
            <div style={{ width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:prog.enabled?22:3,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
          </div>
        </div>
        <div style={{ background:"linear-gradient(135deg,#eff6ff,#f5f3ff)",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:13,color:"#4338ca",lineHeight:1.6 }}>
          👤 <strong>Referrer</strong> earns <strong>₹{prog.referrerReward}</strong> when friend subscribes &nbsp;·&nbsp;
          🎁 <strong>Referee</strong> gets <strong>₹{prog.refereeDiscount} off</strong> first order
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
          {[["Referrer Reward ₹","referrerReward"],["Referee Discount ₹","refereeDiscount"],["Min Order ₹","minRefereeOrderValue"],["Max Rewards/Person","maxRewardsPerReferrer"],["Validity (days)","rewardValidity"]].map(([lbl,k]: any)=>(
            <div key={k}><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>{lbl}</label><input type="number" value={(prog as any)[k]} onChange={e=>setProg(p=>({...p,[k]:Number(e.target.value)}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none" }} /></div>
          ))}
        </div>
        <div style={{ marginTop:10 }}><label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 }}>Terms shown to customers</label><textarea value={prog.termsText} onChange={e=>setProg(p=>({...p,termsText:e.target.value}))} rows={2} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical" }} /></div>
        <button onClick={()=>{planSyncService.saveReferralProgram(prog);toast.success("Saved");}} style={{ marginTop:12,padding:"10px 24px",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13 }}>Save Settings</button>
      </div>
      {records.length===0&&<div style={{ textAlign:"center",padding:32,color:"#94a3b8",background:"#f8fafc",borderRadius:12 }}>No referrals yet. Customers will generate codes from their profile.</div>}
    </div>
  );
}

function PlanSyncStatus() {
  const livePrices = planSyncService.getAllPlanPrices();
  return (
    <div>
      <h3 style={{ margin:"0 0 8px",fontSize:18,fontWeight:700,color:"#0f172a" }}>🔄 Single Source of Truth — Plan Prices</h3>
      <p style={{ margin:"0 0 20px",fontSize:13,color:"#64748b" }}>These prices from the Plan Editor propagate to ALL parts of the system: Customer Buy Page, TSE App, TSM App, and Car Washer screen. Change a price above — it updates everywhere instantly.</p>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16 }}>
        {["","Hatchback","SUV / Sedan","Luxury"].map((h,i)=>(
          <div key={i} style={{ padding:"10px 14px",background:i===0?"transparent":"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:10,fontWeight:700,fontSize:13,color:i===0?"#64748b":"white",textAlign:"center" }}>{h}</div>
        ))}
        {livePrices.map(p=>(
          <React.Fragment key={p.id}>
            <div style={{ padding:"12px 14px",background:"linear-gradient(135deg,#f8fafc,white)",borderRadius:10,fontWeight:700,fontSize:14,color:"#0f172a",display:"flex",alignItems:"center",gap:8,border:"1px solid #e2e8f0" }}><span style={{ fontSize:18 }}>{p.icon}</span>{p.name}</div>
            {[p.hatchback,p.suv,p.luxury].map((price,i)=>(
              <div key={i} style={{ padding:"12px 14px",background:"linear-gradient(135deg,#eff6ff,#f5f3ff)",borderRadius:10,textAlign:"center",border:"1px solid #e0e7ff" }}>
                <div style={{ fontSize:20,fontWeight:800,color:"#4338ca" }}>₹{price.toLocaleString("en-IN")}</div>
                <div style={{ fontSize:10,color:"#94a3b8" }}>per month</div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12 }}>
        {[["Customer Buy Page","/#/buy","These prices show on the customer checkout page when they select a plan"],["TSE App","/#/tse-app","TSE sees these prices when pitching plans to leads during a call"],["TSM App","/#/tsm-app","TSM dashboards and team performance use these base prices"],["Car Washer Screen","/#/washer-core-screens","Service confirmation and job details show plan name and value"]].map(([name,path,desc])=>(
          <div key={name} style={{ background:"white",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start" }}>
            <div style={{ width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:16,flexShrink:0 }}>✅</div>
            <div><div style={{ fontWeight:700,fontSize:14,color:"#0f172a" }}>{name}</div><div style={{ fontSize:12,color:"#64748b",marginTop:2 }}>{desc}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
