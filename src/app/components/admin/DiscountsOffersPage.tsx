import { useState, useEffect } from "react";
import { planSyncService, type CouponCode, type Promotion, type ReferralProgram } from "../../services/planSyncService";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => `${Date.now()}`;
const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: color + "18", color }}>{label}</span>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{sub}</div>
    </div>
  );
}

// ─── COUPONS TAB ──────────────────────────────────────────────────────────────
function CouponsTab() {
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "", type: "percent" as "percent" | "flat", value: 10,
    minOrderValue: 0, maxUses: 100, validFrom: today(), validTo: "",
    applicablePlans: [] as string[], active: true, description: "", createdBy: "Admin",
  });

  useEffect(() => { setCoupons(planSyncService.getCoupons()); }, []);

  const reload = () => setCoupons(planSyncService.getCoupons());

  const resetForm = () => {
    setForm({ code: "", type: "percent", value: 10, minOrderValue: 0, maxUses: 100, validFrom: today(), validTo: "", applicablePlans: [], active: true, description: "", createdBy: "Admin" });
    setEditId(null);
  };

  const handleSave = () => {
    if (!form.code.trim()) return alert("Coupon code is required");
    if (!form.validTo) return alert("Expiry date is required");
    const upper = form.code.trim().toUpperCase();
    if (editId) {
      planSyncService.updateCoupon(editId, { ...form, code: upper });
    } else {
      const existing = planSyncService.getCoupons().find(c => c.code === upper);
      if (existing) return alert("Coupon code already exists");
      planSyncService.addCoupon({ ...form, code: upper });
    }
    reload();
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (c: CouponCode) => {
    setForm({ code: c.code, type: c.type, value: c.value, minOrderValue: c.minOrderValue, maxUses: c.maxUses, validFrom: c.validFrom, validTo: c.validTo, applicablePlans: c.applicablePlans, active: c.active, description: c.description, createdBy: c.createdBy });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    planSyncService.deleteCoupon(id);
    reload();
  };

  const toggleActive = (c: CouponCode) => {
    planSyncService.updateCoupon(c.id, { active: !c.active });
    reload();
  };

  const isExpired = (validTo: string) => validTo && new Date(validTo) < new Date();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Coupon Codes</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>{coupons.length} total · {coupons.filter(c => c.active).length} active</div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: "10px 20px", background: "#2563EB", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + New Coupon
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>{editId ? "Edit Coupon" : "Create New Coupon"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Coupon Code *</label>
              <input style={inp} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20" />
            </div>
            <div>
              <label style={lbl}>Discount Type</label>
              <select style={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Value {form.type === "percent" ? "(%)" : "(₹)"}</label>
              <input style={inp} type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: +e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Min Order Value (₹)</label>
              <input style={inp} type="number" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: +e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Max Uses (0 = unlimited)</label>
              <input style={inp} type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: +e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Valid From</label>
              <input style={inp} type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Valid To (Expiry) *</label>
              <input style={inp} type="date" value={form.validTo} onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={lbl}>Description</label>
              <input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Internal note about this coupon" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              Active (visible on buy page)
            </label>
            <div style={{ flex: 1 }} />
            <button onClick={() => { resetForm(); setShowForm(false); }} style={{ padding: "9px 18px", border: "1.5px solid #E5E7EB", background: "white", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            <button onClick={handleSave} style={{ padding: "9px 20px", background: "#2563EB", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{editId ? "Update" : "Create"} Coupon</button>
          </div>
        </div>
      )}

      {/* Table */}
      {coupons.length === 0 ? (
        <EmptyState icon="🎟️" title="No coupons yet" sub="Create your first coupon code to offer discounts on the buy page" />
      ) : (
        <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1.5px solid #E5E7EB" }}>
                {["Code", "Discount", "Min Order", "Uses", "Valid Until", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((c, i) => {
                const expired = isExpired(c.validTo);
                const status = !c.active ? "inactive" : expired ? "expired" : "active";
                return (
                  <tr key={c.id} style={{ borderBottom: i < coupons.length - 1 ? "1px solid #F3F4F6" : "none", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 800, color: "#111827", letterSpacing: 1, fontFamily: "monospace", fontSize: 14 }}>{c.code}</div>
                      {c.description && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{c.description}</div>}
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#059669" }}>
                      {c.type === "percent" ? `${c.value}% off` : fmt(c.value) + " off"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6B7280" }}>{c.minOrderValue > 0 ? fmt(c.minOrderValue) : "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6B7280" }}>{c.usedCount} / {c.maxUses === 0 ? "∞" : c.maxUses}</td>
                    <td style={{ padding: "12px 14px", color: expired ? "#EF4444" : "#6B7280" }}>{c.validTo || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge label={status} color={status === "active" ? "#059669" : status === "expired" ? "#EF4444" : "#6B7280"} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => toggleActive(c)} style={{ padding: "5px 10px", border: "1px solid #E5E7EB", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 11, color: "#374151" }}>{c.active ? "Disable" : "Enable"}</button>
                        <button onClick={() => handleEdit(c)} style={{ padding: "5px 10px", border: "1px solid #DBEAFE", borderRadius: 6, background: "#EFF6FF", cursor: "pointer", fontSize: 11, color: "#2563EB" }}>Edit</button>
                        <button onClick={() => handleDelete(c.id)} style={{ padding: "5px 10px", border: "1px solid #FEE2E2", borderRadius: 6, background: "#FEF2F2", cursor: "pointer", fontSize: 11, color: "#EF4444" }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── PROMOTIONS TAB ───────────────────────────────────────────────────────────
function PromotionsTab() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", type: "percent" as "percent" | "flat" | "free_addon" | "bogo",
    value: 10, freeAddonId: "", applicablePlans: [] as string[],
    startDate: today(), endDate: "", active: true, autoApply: false,
    badge: "", createdBy: "Admin",
  });

  const getPromos = (): Promotion[] => {
    try { return JSON.parse(localStorage.getItem("cleancar_promotions") || "[]"); } catch { return []; }
  };
  const savePromos = (p: Promotion[]) => localStorage.setItem("cleancar_promotions", JSON.stringify(p));

  useEffect(() => { setPromos(getPromos()); }, []);
  const reload = () => setPromos(getPromos());

  const resetForm = () => {
    setForm({ name: "", description: "", type: "percent", value: 10, freeAddonId: "", applicablePlans: [], startDate: today(), endDate: "", active: true, autoApply: false, badge: "", createdBy: "Admin" });
    setEditId(null);
  };

  const handleSave = () => {
    if (!form.name.trim()) return alert("Promotion name is required");
    const all = getPromos();
    if (editId) {
      savePromos(all.map(p => p.id === editId ? { ...p, ...form } : p));
    } else {
      savePromos([{ ...form, id: `prm_${uid()}`, createdAt: new Date().toISOString() }, ...all]);
    }
    reload(); resetForm(); setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    savePromos(getPromos().filter(p => p.id !== id));
    reload();
  };

  const toggleActive = (p: Promotion) => {
    savePromos(getPromos().map(x => x.id === p.id ? { ...x, active: !x.active } : x));
    reload();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Promotions</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Auto-apply offers shown on buy page</div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: "10px 20px", background: "#2563EB", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + New Promotion
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>{editId ? "Edit Promotion" : "Create Promotion"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={lbl}>Promotion Name *</label>
              <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Diwali Special Offer" />
            </div>
            <div>
              <label style={lbl}>Badge Text</label>
              <input style={inp} value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="🎄 Diwali Offer" />
            </div>
            <div>
              <label style={lbl}>Discount Type</label>
              <select style={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Value</label>
              <input style={inp} type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: +e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Start Date</label>
              <input style={inp} type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>End Date</label>
              <input style={inp} type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "span 3" }}>
              <label style={lbl}>Description</label>
              <input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Internal description" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              Active
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={form.autoApply} onChange={e => setForm(f => ({ ...f, autoApply: e.target.checked }))} />
              Auto-apply (no code needed)
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => { resetForm(); setShowForm(false); }} style={{ padding: "9px 18px", border: "1.5px solid #E5E7EB", background: "white", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            <button onClick={handleSave} style={{ padding: "9px 20px", background: "#2563EB", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{editId ? "Update" : "Create"}</button>
          </div>
        </div>
      )}

      {promos.length === 0 ? (
        <EmptyState icon="🔥" title="No promotions yet" sub="Create auto-apply promotions that show on the buy page without needing a code" />
      ) : (
        <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1.5px solid #E5E7EB" }}>
                {["Name", "Discount", "Duration", "Auto-Apply", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promos.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < promos.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, color: "#111827" }}>{p.badge} {p.name}</div>
                    {p.description && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{p.description}</div>}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: "#059669" }}>
                    {p.type === "percent" ? `${p.value}% off` : fmt(p.value) + " off"}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#6B7280", fontSize: 12 }}>{p.startDate} → {p.endDate || "No end"}</td>
                  <td style={{ padding: "12px 14px" }}><Badge label={p.autoApply ? "Yes" : "No"} color={p.autoApply ? "#059669" : "#6B7280"} /></td>
                  <td style={{ padding: "12px 14px" }}><Badge label={p.active ? "Active" : "Inactive"} color={p.active ? "#059669" : "#6B7280"} /></td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => toggleActive(p)} style={{ padding: "5px 10px", border: "1px solid #E5E7EB", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 11 }}>{p.active ? "Disable" : "Enable"}</button>
                      <button onClick={() => handleDelete(p.id)} style={{ padding: "5px 10px", border: "1px solid #FEE2E2", borderRadius: 6, background: "#FEF2F2", cursor: "pointer", fontSize: 11, color: "#EF4444" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── REFERRALS TAB (Updated with 400-day vehicle rule + loophole alerts) ─────
function ReferralsTab() {
  const defaultProgram = {
    enabled: true, referrerReward: 200, referrerRewardType: "flat",
    refereeDiscount: 100, refereeDiscountType: "flat", minRefereeOrderValue: 500,
    maxRewardsPerReferrer: 10, rewardValidity: 90,
    vehicleLockoutDays: 400,   // ← NEW: days before same vehicle can be referred again
    phoneLockoutDays: 400,      // ← NEW: days before same phone can use another referral
    requireVehicleNumber: true, // ← NEW: vehicle number mandatory on checkout
    termsText: "Refer a friend and earn ₹200 credit when they subscribe.",
  };

  const getProgram = () => {
    try { return { ...defaultProgram, ...JSON.parse(localStorage.getItem("cleancar_referral_program") || "null") }; }
    catch { return defaultProgram; }
  };

  const [program, setProgram] = useState(getProgram());
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<"settings"|"records"|"loopholes">("settings");

  const getReferrals = () => {
    try { return JSON.parse(localStorage.getItem("cleancar_referrals") || "[]"); } catch { return []; }
  };
  const [referrals] = useState(getReferrals());

  const handleSave = () => {
    localStorage.setItem("cleancar_referral_program", JSON.stringify(program));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Loophole risk analysis ──────────────────────────────────────────────────
  const loopholes = [
    {
      risk: "HIGH",
      icon: "🚗",
      title: "Same vehicle, different phone numbers",
      desc: "A customer cancels, hands the car to a family member, who signs up with a new number using a referral code on the same vehicle.",
      impact: "Free referral discount every time the subscription is re-started under a new account.",
      fix: "Enforced ✅ — vehicle number is locked for 400 days regardless of phone number.",
      fixed: true,
    },
    {
      risk: "HIGH",
      icon: "📱",
      title: "Same phone, multiple vehicles",
      desc: "One person buys subscriptions for multiple vehicles (e.g. family members' cars) and uses a referral code for each.",
      impact: "Each vehicle gets the referee discount. If they're also the referrer, they earn reward credit per vehicle.",
      fix: "Partially mitigated — phone lockout of 400 days applies. But consider limiting referee discount to 1 per phone lifetime.",
      fixed: false,
    },
    {
      risk: "HIGH",
      icon: "🤝",
      title: "TSE self-referral via family members",
      desc: "A TSE shares their own employee ID as a referral code with their own family members who subscribe, earning incentive credit.",
      impact: "TSE earns incentive on fake conversions. Family gets discount. Company loses on both ends.",
      fix: "Add rule: TSE cannot refer customers in their own household (same address). Flag if TSE referral code is used by same pincode 3+ times.",
      fixed: false,
    },
    {
      risk: "HIGH",
      icon: "🔄",
      title: "Cancel and re-subscribe to get referral discount again",
      desc: "Customer subscribes using referral discount, cancels after 1 month, waits, then re-subscribes using a new referral code.",
      impact: "Repeated referral discounts on the same customer who was never truly 'new'.",
      fix: "Enforced ✅ — 400-day lockout on both vehicle and phone prevents this for over a year.",
      fixed: true,
    },
    {
      risk: "MEDIUM",
      icon: "💳",
      title: "Coupon stacking with referral codes",
      desc: "A customer applies both a coupon code (e.g. SAVE20) AND a referral code at checkout, getting double discounts.",
      impact: "Company gives away more discount than intended on a single order.",
      fix: "Add rule: coupon and referral cannot be applied simultaneously. Show message: 'Only one discount can be applied per order.'",
      fixed: false,
    },
    {
      risk: "MEDIUM",
      icon: "📋",
      title: "TSE enters fake vehicle numbers",
      desc: "A TSE creates a referral lead with a random/fake vehicle number (e.g. GJ01XX0000) to bypass the vehicle lockout check.",
      impact: "Vehicle lockout becomes ineffective. Customer gets discount without proper tracking.",
      fix: "Validate vehicle number format via regex (e.g. must match Indian registration format). Cross-check against existing customer database.",
      fixed: false,
    },
    {
      risk: "MEDIUM",
      icon: "⏰",
      title: "Referral code shared publicly on social media",
      desc: "A TSE or customer posts their referral code on WhatsApp groups, Facebook, etc. reaching hundreds of people.",
      impact: "Referral program costs spiral. Originally designed for personal 1-to-1 referrals.",
      fix: "Set max referrals per referrer (already configurable). Also add IP/device fingerprint check — same device cannot be used for multiple referee signups.",
      fixed: false,
    },
    {
      risk: "LOW",
      icon: "🎟️",
      title: "Expired coupons being shared/reused",
      desc: "Old coupon codes circulate in WhatsApp groups even after expiry. If validation is only frontend, the discount may still apply.",
      impact: "Revenue leakage if backend doesn't validate coupon expiry server-side.",
      fix: "Enforce ✅ coupon expiry check on every apply. Also add single-use coupons for high-value offers.",
      fixed: true,
    },
    {
      risk: "LOW",
      icon: "🏠",
      title: "Same address, multiple subscriptions via referrals",
      desc: "A housing society with 100 flats — one resident refers all neighbours. Referrer earns ₹200 × 100 = ₹20,000 in credits.",
      impact: "Technically valid use but creates unexpected liability if reward credits are redeemable.",
      fix: "Set maxRewardsPerReferrer limit (already configurable). For societies, use a separate B2B pricing track.",
      fixed: false,
    },
  ];

  const riskColor = (r: string) => r === "HIGH" ? "#EF4444" : r === "MEDIUM" ? "#F59E0B" : "#6B7280";

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#F3F4F6", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[
          { id: "settings", label: "⚙️ Program Settings" },
          { id: "records", label: "📋 Referral Records" },
          { id: "loopholes", label: "🔐 Security Rules" },
        ].map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id as any)}
            style={{ padding: "8px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: activeSection === s.id ? 700 : 500, background: activeSection === s.id ? "white" : "transparent", color: activeSection === s.id ? "#111827" : "#6B7280", boxShadow: activeSection === s.id ? "0 1px 4px #0001" : "none" }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Program Settings */}
      {activeSection === "settings" && (
        <div style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Referral Program Settings</div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={program.enabled} onChange={e => setProgram((p: any) => ({ ...p, enabled: e.target.checked }))} />
              <span style={{ fontWeight: 700, color: program.enabled ? "#059669" : "#6B7280" }}>{program.enabled ? "Enabled" : "Disabled"}</span>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={lbl}>Referrer Reward (₹)</label><input style={inp} type="number" value={program.referrerReward} onChange={e => setProgram((p: any) => ({ ...p, referrerReward: +e.target.value }))} /></div>
            <div><label style={lbl}>Referee Discount (₹)</label><input style={inp} type="number" value={program.refereeDiscount} onChange={e => setProgram((p: any) => ({ ...p, refereeDiscount: +e.target.value }))} /></div>
            <div><label style={lbl}>Min Referee Order (₹)</label><input style={inp} type="number" value={program.minRefereeOrderValue} onChange={e => setProgram((p: any) => ({ ...p, minRefereeOrderValue: +e.target.value }))} /></div>
            <div><label style={lbl}>Vehicle Lockout (days) 🚗</label><input style={inp} type="number" value={program.vehicleLockoutDays} onChange={e => setProgram((p: any) => ({ ...p, vehicleLockoutDays: +e.target.value }))} /></div>
            <div><label style={lbl}>Phone Lockout (days) 📱</label><input style={inp} type="number" value={program.phoneLockoutDays} onChange={e => setProgram((p: any) => ({ ...p, phoneLockoutDays: +e.target.value }))} /></div>
            <div><label style={lbl}>Max Rewards per Referrer</label><input style={inp} type="number" value={program.maxRewardsPerReferrer} onChange={e => setProgram((p: any) => ({ ...p, maxRewardsPerReferrer: +e.target.value }))} /></div>
            <div><label style={lbl}>Reward Validity (days)</label><input style={inp} type="number" value={program.rewardValidity} onChange={e => setProgram((p: any) => ({ ...p, rewardValidity: +e.target.value }))} /></div>
            <div style={{ gridColumn: "span 2", display: "flex", alignItems: "flex-end", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={program.requireVehicleNumber} onChange={e => setProgram((p: any) => ({ ...p, requireVehicleNumber: e.target.checked }))} />
                Require vehicle number at checkout (recommended ✅)
              </label>
            </div>
            <div style={{ gridColumn: "span 3" }}><label style={lbl}>Terms Text (shown on buy page)</label><input style={inp} value={program.termsText} onChange={e => setProgram((p: any) => ({ ...p, termsText: e.target.value }))} /></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={handleSave} style={{ padding: "10px 24px", background: saved ? "#059669" : "#2563EB", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {saved ? "✓ Saved!" : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {/* Records */}
      {activeSection === "records" && (
        referrals.length === 0 ? (
          <EmptyState icon="🔗" title="No referrals yet" sub="Referral records will appear here when customers use referral codes on the buy page" />
        ) : (
          <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1.5px solid #E5E7EB" }}>
                  {["Referrer", "Code", "Vehicle No.", "Referee Phone", "Order", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r: any, i: number) => (
                  <tr key={r.id} style={{ borderBottom: i < referrals.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600 }}>{r.referrerName}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 700 }}>{r.referrerCode}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12 }}>{r.vehicleNumber || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>{r.refereePhone || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>{r.orderAmount ? "₹" + r.orderAmount.toLocaleString("en-IN") : "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge label={r.status} color={r.status === "rewarded" ? "#059669" : r.status === "converted" ? "#2563EB" : r.status === "rejected" ? "#EF4444" : r.status === "expired" ? "#9CA3AF" : "#F59E0B"} />
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6B7280", fontSize: 12 }}>{r.createdAt?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Loopholes / Security Rules */}
      {activeSection === "loopholes" && (
        <div>
          <div style={{ background: "#FEF3C7", border: "1.5px solid #FCD34D", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13 }}>
            <strong>⚠️ Security Audit</strong> — {loopholes.filter(l => l.fixed).length} of {loopholes.length} rules enforced. Review and fix open vulnerabilities.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loopholes.map((l, i) => (
              <div key={i} style={{ border: `1.5px solid ${l.fixed ? "#D1FAE5" : "#FEE2E2"}`, borderRadius: 12, padding: 18, background: l.fixed ? "#F0FDF4" : "#FFF8F8" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ fontSize: 28 }}>{l.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>{l.title}</span>
                      <Badge label={l.risk + " RISK"} color={riskColor(l.risk)} />
                      {l.fixed && <Badge label="✓ ENFORCED" color="#059669" />}
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>{l.desc}</div>
                    <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 6 }}>
                      <strong>Impact:</strong> {l.impact}
                    </div>
                    <div style={{ fontSize: 12, color: l.fixed ? "#059669" : "#2563EB" }}>
                      <strong>Fix:</strong> {l.fix}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Style helpers ────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 };
const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "white" };

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function DiscountsOffersPage() {
  const [tab, setTab] = useState("coupons");

  const tabs = [
    { id: "coupons", label: "🎟️ Coupons" },
    { id: "promotions", label: "🔥 Promotions" },
    { id: "referrals", label: "🔗 Referrals" },
  ];

  return (
    <div style={{ padding: "0 0 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Discounts and Offers</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>Manage coupons, promotions and referral programs for the buy page</p>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1.5px solid #E5E7EB", display: "flex", marginBottom: 28 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "13px 20px", border: "none", background: "transparent", cursor: "pointer", fontWeight: tab === t.id ? 700 : 500, fontSize: 13, color: tab === t.id ? "#2563EB" : "#6B7280", borderBottom: tab === t.id ? "3px solid #2563EB" : "3px solid transparent", transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1.5px solid #E5E7EB" }}>
        {tab === "coupons" && <CouponsTab />}
        {tab === "promotions" && <PromotionsTab />}
        {tab === "referrals" && <ReferralsTab />}
      </div>
    </div>
  );
}
