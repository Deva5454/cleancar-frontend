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

// ─── REFERRALS TAB ────────────────────────────────────────────────────────────
function ReferralsTab() {
  const defaultProgram: ReferralProgram = {
    enabled: true, referrerReward: 200, referrerRewardType: "flat",
    refereeDiscount: 100, refereeDiscountType: "flat", minRefereeOrderValue: 500,
    maxRewardsPerReferrer: 10, rewardValidity: 90, termsText: "Refer a friend and earn ₹200 credit when they subscribe.",
  };

  const getProgram = (): ReferralProgram => {
    try { return JSON.parse(localStorage.getItem("cleancar_referral_program") || "null") || defaultProgram; } catch { return defaultProgram; }
  };

  const [program, setProgram] = useState<ReferralProgram>(getProgram);
  const [saved, setSaved] = useState(false);

  const getReferrals = () => {
    try { return JSON.parse(localStorage.getItem("cleancar_referrals") || "[]"); } catch { return []; }
  };
  const [referrals] = useState(getReferrals());

  const handleSave = () => {
    localStorage.setItem("cleancar_referral_program", JSON.stringify(program));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      {/* Program Settings */}
      <div style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Referral Program Settings</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={program.enabled} onChange={e => setProgram(p => ({ ...p, enabled: e.target.checked }))} />
            <span style={{ fontWeight: 700, color: program.enabled ? "#059669" : "#6B7280" }}>{program.enabled ? "Enabled" : "Disabled"}</span>
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Referrer Reward (₹)</label>
            <input style={inp} type="number" value={program.referrerReward} onChange={e => setProgram(p => ({ ...p, referrerReward: +e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Referee Discount (₹)</label>
            <input style={inp} type="number" value={program.refereeDiscount} onChange={e => setProgram(p => ({ ...p, refereeDiscount: +e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Min Referee Order (₹)</label>
            <input style={inp} type="number" value={program.minRefereeOrderValue} onChange={e => setProgram(p => ({ ...p, minRefereeOrderValue: +e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Max Rewards per Referrer (0=∞)</label>
            <input style={inp} type="number" value={program.maxRewardsPerReferrer} onChange={e => setProgram(p => ({ ...p, maxRewardsPerReferrer: +e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Reward Validity (days)</label>
            <input style={inp} type="number" value={program.rewardValidity} onChange={e => setProgram(p => ({ ...p, rewardValidity: +e.target.value }))} />
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <label style={lbl}>Terms Text (shown on buy page)</label>
            <input style={inp} value={program.termsText} onChange={e => setProgram(p => ({ ...p, termsText: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={handleSave} style={{ padding: "10px 24px", background: saved ? "#059669" : "#2563EB", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "background 0.2s" }}>
            {saved ? "✓ Saved!" : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Referral Records */}
      <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Referral History ({referrals.length})</div>
      {referrals.length === 0 ? (
        <EmptyState icon="🔗" title="No referrals yet" sub="Referral records appear here when customers use referral codes on the buy page" />
      ) : (
        <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1.5px solid #E5E7EB" }}>
                {["Referrer", "Code", "Referee", "Order", "Status", "Date"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referrals.map((r: any, i: number) => (
                <tr key={r.id} style={{ borderBottom: i < referrals.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>{r.referrerName}</td>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 700 }}>{r.referralCode}</td>
                  <td style={{ padding: "12px 14px" }}>{r.refereeName || "—"}</td>
                  <td style={{ padding: "12px 14px" }}>{r.orderAmount ? fmt(r.orderAmount) : "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <Badge label={r.status} color={r.status === "rewarded" ? "#059669" : r.status === "converted" ? "#2563EB" : r.status === "expired" ? "#EF4444" : "#F59E0B"} />
                  </td>
                  <td style={{ padding: "12px 14px", color: "#6B7280", fontSize: 12 }}>{r.createdAt?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
