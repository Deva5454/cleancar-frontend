// PlanInfoModal — shows deliverables for monthly plans, packs, and add-ons
// Triggered by ⓘ button next to plan/pack/addon name on buy page
// All data comes from subscriptionPlans.ts — no backend needed

import React from "react";

/* ── Inline deliverables data (mirrors subscriptionPlans.ts) ─────────────── */

const MONTHLY_PLANS: Record<string, {
  icon: string; name: string; tagline: string;
  daily: string[]; periodic: { freq: string; label: string; items: string[] }[];
  notIncluded: string[];
  accentColor: string;
}> = {
  water: {
    icon: "💧", name: "Express Wash", tagline: "Your car, clean every morning.",
    accentColor: "#6366f1",
    daily: [
      "Full exterior water spray + microfibre dry",
      "Mirrors, door handles, number plate wiped clean",
      "Dedicated named washer — same person every morning",
      "Before-and-after WhatsApp photo sent daily",
    ],
    periodic: [
      { freq: "Weekly · 4×/month",    label: "🛞 Weekly",   items: ["All 4 tyres and rims rinsed + rim wiped"] },
      { freq: "Monthly · 1×/month",   label: "📅 Monthly",  items: ["Underbody flush", "Windshield clean (outside only)", "Shampoo Wash"] },
    ],
    notIncluded: ["Interior cleaning or vacuuming", "Tyre dressing / shine coat", "Dashboard or console wipe", "Hand wax polish", "Engine bay clean"],
  },
  shampoo: {
    icon: "🧴", name: "Smart Wash", tagline: "Clean daily. Protected always.",
    accentColor: "#8b5cf6",
    daily: [
      "Everything in Express Wash — full daily exterior wash",
      "Before-and-after WhatsApp photo sent daily",
      "Dedicated named washer — same person every morning",
    ],
    periodic: [
      { freq: "Weekly · 4×/month",      label: "🛞 Weekly",      items: ["Tyre & rim spray-clean"] },
      { freq: "Fortnightly · 2×/month", label: "🔁 Fortnightly", items: ["Shampoo Wash", "Interior vacuum & mat clean"] },
      { freq: "Monthly · 1×/month",     label: "📅 Monthly",     items: ["Tyre Dressing & Shine Coat (all 4 tyres)", "Car fragrance spray"] },
    ],
    notIncluded: ["Dashboard or console detail", "Hand wax polish", "Engine bay clean"],
  },
  wax: {
    icon: "✨", name: "Elite Wash", tagline: "Showroom condition, every day.",
    accentColor: "#f59e0b",
    daily: [
      "Everything in Smart Wash — full daily exterior wash",
      "Before-and-after WhatsApp photo sent daily",
      "Dedicated named washer — same person every morning",
    ],
    periodic: [
      { freq: "Weekly · 4×/month",      label: "🛞 Weekly",      items: ["Tyre & rim spray-clean", "Shampoo Wash (4× vs Smart Wash's 2×)"] },
      { freq: "Fortnightly · 2×/month", label: "🔁 Fortnightly", items: ["Dashboard & console deep clean", "Interior vacuum & mat clean", "Tyre Dressing & Shine Coat"] },
      { freq: "Monthly · 1×/month",     label: "📅 Monthly",     items: ["Full hand wax polish (outer body only, no glass)", "Engine bay dry blow (strictly no water)", "Premium car fragrance + cabin sanitisation"] },
    ],
    notIncluded: ["Ceramic coating", "Paint correction", "Leather conditioning", "Underbody Anti-Rust"],
  },
};

const PACK_INFO: Record<string, {
  icon: string; name: string; validityDays: number; saving: string;
  variants: { id: string; icon: string; label: string; items: string[] }[];
}> = {
  pack2: {
    icon: "📦", name: "Pack of 2", validityDays: 20, saving: "8% off vs one-time",
    variants: [
      { id: "waterWash",  icon: "💧", label: "Water Wash",    items: ["Full exterior pressure rinse", "Microfibre dry", "Tyre & rim spray", "Number plate clean"] },
      { id: "shampoo",    icon: "🧴", label: "Shampoo Wash",  items: ["Full exterior shampoo foam wash", "Glass clean (outside)", "Microfibre dry", "Tyre & rim spray"] },
      { id: "shampooWax", icon: "✨", label: "Shampoo + Wax", items: ["Full shampoo wash", "Hand wax polish (full body)", "Glass clean (outside)", "Microfibre dry"] },
    ],
  },
  pack4: {
    icon: "📦", name: "Pack of 4", validityDays: 30, saving: "15% off vs one-time",
    variants: [
      { id: "waterWash",  icon: "💧", label: "Water Wash",    items: ["Full exterior pressure rinse", "Microfibre dry", "Tyre & rim spray", "Number plate clean"] },
      { id: "shampoo",    icon: "🧴", label: "Shampoo Wash",  items: ["Full exterior shampoo foam wash", "Glass clean (outside)", "Microfibre dry", "Tyre & rim spray"] },
      { id: "shampooWax", icon: "✨", label: "Shampoo + Wax", items: ["Full shampoo wash", "Hand wax polish (full body)", "Glass clean (outside)", "Microfibre dry"] },
    ],
  },
  onetime: {
    icon: "1️⃣", name: "One-Time Wash", validityDays: 10, saving: "Book any day within 10 days",
    variants: [
      { id: "waterWash",  icon: "💧", label: "Water Wash",    items: ["Full exterior pressure rinse", "Microfibre dry", "Tyre & rim spray"] },
      { id: "shampoo",    icon: "🧴", label: "Shampoo Wash",  items: ["Full exterior shampoo foam wash", "Glass clean (outside)", "Microfibre dry"] },
      { id: "shampooWax", icon: "✨", label: "Shampoo + Wax", items: ["Full shampoo wash", "Hand wax polish (full body)", "Glass clean (outside)", "Microfibre dry"] },
    ],
  },
  urgent: {
    icon: "⚡", name: "Urgent Wash", validityDays: 0, saving: "Washer arrives in 1 hour",
    variants: [
      { id: "shampooWax", icon: "✨", label: "Shampoo + Wax", items: ["Full shampoo foam wash", "Full hand wax polish (outer body)", "Glass clean", "Microfibre dry", "⚠️ No reschedule — amount forfeited if car unavailable"] },
    ],
  },
};

const ADDON_INFO: Record<string, {
  icon: string; name: string; steps: string[]; includedIn: string; time: string;
}> = {
  "Interior Deep Vacuum":       { icon: "🪣", name: "Interior Deep Vacuum",       time: "~20 min", includedIn: "Included in Elite Wash (2×/month)", steps: ["Remove floor mats — shake out loose dirt", "Vacuum cabin floor + under seats", "Vacuum front and rear seats", "Vacuum boot / dicky area", "Seat pockets + door pad pockets vacuumed", "Leather/resin seat cover polish applied", "Before + after photo sent on WhatsApp"] },
  "Dashboard & Console Detail": { icon: "🧹", name: "Dashboard & Console Detail", time: "~15 min", includedIn: "Included in Elite Wash (2×/month)", steps: ["Dashboard polished panel by panel", "Console + gear surround + cupholders cleaned", "Door pads wiped + polished all 4 doors", "AC vents blown clean with compressed air", "Before + after photo sent on WhatsApp"] },
  "Tyre Dressing (all 4 tyres)":{ icon: "🛞", name: "Tyre Dressing (all 4 tyres)",time: "~10 min", includedIn: "Included in Smart Wash (1×/month) and Elite Wash (2×/month)", steps: ["Tyre sidewall washed — old product removed", "Shine Protect applied to all 4 tyres with sponge", "Left to set for 2 minutes — not wiped off"] },
  "Full Hand Wax Polish":       { icon: "✨", name: "Full Hand Wax Polish",       time: "~30 min", includedIn: "Included in Elite Wash (1×/month)", steps: ["Shampoo wash done first — car must be clean and dry", "Wax applied panel by panel — never whole car at once", "Each panel buffed with circular motion", "Bonnet and boot done last — reflection check", "No wax on glass — outer body panels only", "Before + after photo sent on WhatsApp"] },
  "Underbody Wash":             { icon: "💧", name: "Underbody Wash",             time: "~10 min", includedIn: "Not included in any plan — add-on only", steps: ["Pressure gun positioned under vehicle — front to rear", "Both sides flushed to remove road grime", "All 4 wheel arches flushed", "Left to drip dry — no cloth under vehicle"] },
  "Engine Bay Wipe-Down":       { icon: "⚙️", name: "Engine Bay Wipe-Down",       time: "~10 min", includedIn: "Included in Elite Wash (1×/month)", steps: ["⚠️ STRICTLY DRY ONLY — no water on engine", "Engine casing surfaces wiped with dry microfibre", "Dust removed from cooling fins with soft brush", "Before + after photo sent on WhatsApp"] },
  "Car Fragrance":              { icon: "🌸", name: "Car Fragrance",              time: "~5 min",  includedIn: "Included in Smart Wash and Elite Wash (1×/month)", steps: ["Interior dry and windows up before applying", "2–3 short bursts — not directly on seats", "Doors closed for 1 minute to let fragrance settle"] },
};

/* ── Modal component ────────────────────────────────────────────────────────── */

interface PlanInfoModalProps {
  planId: string | null;        // monthly plan id: "water" | "shampoo" | "wax"
  packId: string | null;        // pack id: "pack2" | "pack4" | "onetime" | "urgent"
  addonName: string | null;     // addon name string
  onClose: () => void;
  onSelect?: () => void;        // optional — if provided, show "Select this plan" CTA
}

export function PlanInfoModal({ planId, packId, addonName, onClose, onSelect }: PlanInfoModalProps) {
  const [activeVariant, setActiveVariant] = React.useState<string>("shampoo");

  // Determine what to show
  const monthlyPlan = planId ? MONTHLY_PLANS[planId] : null;
  const packInfo    = packId ? PACK_INFO[packId] : null;
  const addonInfo   = addonName ? ADDON_INFO[addonName] : null;

  if (!monthlyPlan && !packInfo && !addonInfo) return null;

  const accent = monthlyPlan?.accentColor ?? (packInfo ? "#6366f1" : "#10b981");

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0",
        fontFamily: "'Sora', 'Inter', sans-serif",
      }}
    >
      {/* Sheet slides up from bottom */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: "24px 24px 0 0",
          width: "100%", maxWidth: 520,
          maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
          padding: "0 0 env(safe-area-inset-bottom,0)",
        }}
      >
        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e2e8f0" }} />
        </div>

        {/* Header */}
        <div style={{
          padding: "16px 24px 20px",
          borderBottom: "1px solid #f1f5f9",
          background: `linear-gradient(135deg, ${accent}10, white)`,
          position: "sticky", top: 0, zIndex: 1,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
                border: `2px solid ${accent}33`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
              }}>
                {monthlyPlan?.icon ?? packInfo?.icon ?? addonInfo?.icon}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", fontFamily: "'Playfair Display', serif" }}>
                  {monthlyPlan?.name ?? packInfo?.name ?? addonInfo?.name}
                </div>
                {(monthlyPlan?.tagline || packInfo?.saving || addonInfo?.time) && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    {monthlyPlan?.tagline ?? (packInfo ? `📅 Valid ${packInfo.validityDays > 0 ? `${packInfo.validityDays} days` : "same day"} · ${packInfo.saving}` : `⏱ Approx ${addonInfo?.time}`)}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "#f1f5f9", border: "none",
                fontSize: 16, cursor: "pointer", color: "#64748b",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>

          {/* ── MONTHLY PLAN CONTENT ─────────────────────────── */}
          {monthlyPlan && (
            <>
              {/* Daily */}
              <SectionTitle icon="☀️" label="Every Single Day · 30×/month" color={accent} />
              <ItemList items={monthlyPlan.daily} included accent={accent} />

              {/* Periodic */}
              {monthlyPlan.periodic.map(period => (
                <React.Fragment key={period.freq}>
                  <SectionTitle icon={period.label.split(" ")[0]} label={period.freq} color={accent} />
                  <ItemList items={period.items} included accent={accent} />
                </React.Fragment>
              ))}

              {/* Not included */}
              <SectionTitle icon="✖️" label="Not Included in this Plan" color="#94a3b8" />
              <ItemList items={monthlyPlan.notIncluded} included={false} accent="#94a3b8" />

              {/* Upgrade nudge for Express and Smart */}
              {(planId === "water") && (
                <div style={{ marginTop: 16, padding: "12px 14px", background: "#f5f3ff", borderRadius: 12, border: "1px solid #ddd6fe" }}>
                  <div style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>
                    💡 Upgrade to Smart Wash (+₹350/mo) and get shampoo 2×/month, interior vacuum, tyre dressing, and fragrance.
                  </div>
                </div>
              )}
              {(planId === "shampoo") && (
                <div style={{ marginTop: 16, padding: "12px 14px", background: "#fffbeb", borderRadius: 12, border: "1px solid #fde68a" }}>
                  <div style={{ fontSize: 12, color: "#b45309", fontWeight: 600 }}>
                    💡 Upgrade to Elite Wash (+₹400/mo) and get weekly shampoo, wax, dashboard clean, and engine bay service.
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── PACK CONTENT ─────────────────────────────────── */}
          {packInfo && (
            <>
              {/* Variant selector */}
              {packInfo.variants.length > 1 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Choose wash type to see what's included:</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {packInfo.variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setActiveVariant(v.id)}
                        style={{
                          flex: 1, padding: "8px 4px", borderRadius: 10,
                          border: `2px solid ${activeVariant === v.id ? accent : "#e2e8f0"}`,
                          background: activeVariant === v.id ? `${accent}11` : "white",
                          color: activeVariant === v.id ? accent : "#64748b",
                          fontWeight: activeVariant === v.id ? 700 : 500,
                          fontSize: 12, cursor: "pointer",
                        }}
                      >
                        {v.icon} {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Items for selected variant */}
              {packInfo.variants.filter(v => packInfo.variants.length === 1 || v.id === activeVariant).map(v => (
                <React.Fragment key={v.id}>
                  <SectionTitle icon={v.icon} label={`${v.label} — What's included`} color={accent} />
                  <ItemList items={v.items} included accent={accent} />
                </React.Fragment>
              ))}

              {/* Validity + rules */}
              <div style={{ marginTop: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  {packId !== "urgent" && <>📅 <strong>Valid {packInfo.validityDays} days</strong> from first wash date. Max 3 reschedules.<br /></>}
                  {packId === "urgent" && <>⚡ <strong>Washer arrives within 1 hour.</strong> Same day only. No reschedule.<br /></>}
                  {(packId === "onetime") && <>🚫 No reschedule for one-time — amount forfeited if car unavailable.</>}
                </div>
              </div>
            </>
          )}

          {/* ── ADDON CONTENT ─────────────────────────────────── */}
          {addonInfo && (
            <>
              <SectionTitle icon="✅" label="What we do — step by step" color={accent} />
              <ItemList items={addonInfo.steps} included accent={accent} />

              <div style={{ marginTop: 16, padding: "12px 14px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>
                  ℹ️ {addonInfo.includedIn}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer CTA */}
        {onSelect && (
          <div style={{ padding: "12px 24px 24px", borderTop: "1px solid #f1f5f9" }}>
            <button
              onClick={() => { onSelect(); onClose(); }}
              style={{
                width: "100%", padding: "14px",
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                color: "white", border: "none", borderRadius: 14,
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: `0 4px 14px ${accent}40`,
              }}
            >
              Select this plan →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Small reusable pieces ──────────────────────────────────────────────────── */

function SectionTitle({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 16 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `${color}30` }} />
    </div>
  );
}

function ItemList({ items, included, accent }: { items: string[]; included: boolean; accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 4 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
            background: included ? `linear-gradient(135deg, ${accent}, ${accent}99)` : "#f1f5f9",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 9, color: included ? "white" : "#94a3b8", fontWeight: 800 }}>
              {included ? "✓" : "✕"}
            </span>
          </div>
          <span style={{ fontSize: 13, color: included ? "#1e293b" : "#94a3b8", lineHeight: 1.45 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Info button (the ⓘ trigger) ────────────────────────────────────────────── */

export function InfoBtn({ onClick, color = "#6366f1" }: { onClick: (e: React.MouseEvent) => void; color?: string }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(e); }}
      title="What's included"
      style={{
        width: 18, height: 18, borderRadius: "50%",
        border: `1.5px solid ${color}60`,
        background: `${color}0d`,
        color,
        fontSize: 10, fontWeight: 800, cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        lineHeight: 1, padding: 0, flexShrink: 0,
        transition: "all 0.15s",
        verticalAlign: "middle", marginLeft: 4,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = `${color}22`;
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.15)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = `${color}0d`;
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
    >
      i
    </button>
  );
}
