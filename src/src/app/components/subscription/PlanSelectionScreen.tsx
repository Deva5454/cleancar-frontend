/**
 * Plan Selection Screen - Customer-Facing
 * UI RESTYLED ONLY — all logic, state, hooks, service calls, and types unchanged
 */

import { useState, useEffect } from "react";
import { Car, Bike, Check, Sparkles, Tag, Info } from "lucide-react";
import { subscriptionPlansService } from "../../services/subscriptionPlansService";
import type {
  VehicleCategory, CompletePlan, BillingDurationType, DurationPrice,
} from "../../types/subscriptionPlans.types";
import { PLAN_TIER_COLORS } from "../../constants/subscriptionPlans.constants";
import { logger } from "../../services/logger";

// ── Color map per plan tier (visual only, logic unchanged) ───────────────────
const TIER_ACCENT: Record<string, { bg: string; border: string; text: string; btnBg: string; light: string }> = {
  EXPRESS_WASH:  { bg: "#E6F1FB", border: "#378ADD", text: "#0C447C", btnBg: "#185FA5", light: "#EFF8FF" },
  SHAMPOO_WASH:  { bg: "#EEEDFE", border: "#534AB7", text: "#3C3489", btnBg: "#534AB7", light: "#F5F4FF" },
  ELITE_WASH:    { bg: "#FAEEDA", border: "#BA7517", text: "#633806", btnBg: "#BA7517", light: "#FFF8ED" },
  DEFAULT:       { bg: "#F1EFE8", border: "#5F5E5A", text: "#2C2C2A", btnBg: "#444441", light: "#F8F7F3" },
};

function getTierAccent(tierName: string) {
  return TIER_ACCENT[tierName] || TIER_ACCENT.DEFAULT;
}

// ── Duration pill styles ─────────────────────────────────────────────────────
const DURATION_OPTIONS: { value: BillingDurationType; label: string; badge?: string; badgeColor?: string }[] = [
  { value: "MONTHLY",     label: "Monthly" },
  { value: "QUARTERLY",   label: "Quarterly",   badge: "5% off",      badgeColor: "#1D9E75" },
  { value: "HALF_YEARLY", label: "Half-Yearly", badge: "10% off",     badgeColor: "#1D9E75" },
  { value: "NINE_MONTHS", label: "9 Months",    badge: "12% off",     badgeColor: "#1D9E75" },
  { value: "ANNUAL",      label: "Annual",      badge: "Best value",  badgeColor: "#534AB7" },
];

export function PlanSelectionScreen() {
  // ── ALL STATE AND LOGIC IDENTICAL TO ORIGINAL ────────────────────────────
  const [vehicleType, setVehicleType] = useState<"4W" | "2W">("4W");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<BillingDurationType>("MONTHLY");
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [plans, setPlans] = useState<CompletePlan[]>([]);

  useEffect(() => {
    const loadedCategories = subscriptionPlansService.getVehicleCategories(vehicleType);
    setCategories(loadedCategories);
    if (loadedCategories.length > 0) setSelectedCategory(loadedCategories[0].id);
  }, [vehicleType]);

  useEffect(() => {
    if (selectedCategory) {
      const loadedPlans = subscriptionPlansService.getCompletePlansByCategory(selectedCategory);
      setPlans(loadedPlans);
    }
  }, [selectedCategory]);

  const selectedCategoryData = categories.find((cat) => cat.id === selectedCategory);
  // ── END UNCHANGED LOGIC ──────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FF", paddingBottom: 48 }}>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{ background: "#1a0533", padding: "40px 24px 32px", textAlign: "center", marginBottom: 0 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.1)", border: "0.5px solid rgba(255,255,255,.2)", color: "#C0DD97", fontSize: 12, padding: "4px 14px", borderRadius: 20, marginBottom: 12 }}>
            <span>✦</span> 12,000+ happy cars in Surat
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 500, color: "#fff", marginBottom: 8, lineHeight: 1.25 }}>
            Choose your washing plan
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.6)", marginBottom: 0 }}>
            Professional doorstep vehicle washing · Daily service · Monthly billing
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* ── VEHICLE TYPE TOGGLE ────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "28px 0 24px" }}>
          {(["4W", "2W"] as const).map((vt) => (
            <button
              key={vt}
              onClick={() => setVehicleType(vt)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 28px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: "pointer", border: "2px solid",
                background: vehicleType === vt ? "#1a0533" : "#fff",
                color: vehicleType === vt ? "#fff" : "#1a0533",
                borderColor: vehicleType === vt ? "#1a0533" : "#D3D1C7",
                transition: "all .15s",
              }}
            >
              {vt === "4W" ? <Car size={16} /> : <Bike size={16} />}
              {vt === "4W" ? "4-Wheeler" : "2-Wheeler"}
            </button>
          ))}
        </div>

        {/* ── VEHICLE CATEGORY CARDS ─────────────────────────────────────── */}
        {categories.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
              Select your vehicle size
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              {categories.map((category, idx) => {
                const colors = [
                  { bg: "#EEEDFE", border: "#534AB7", text: "#3C3489", eg: "#7F77DD", carFill: "#AFA9EC", carBody: "#CECBF6", wheel: "#534AB7" },
                  { bg: "#E1F5EE", border: "#1D9E75", text: "#085041", eg: "#0F6E56", carFill: "#5DCAA5", carBody: "#9FE1CB", wheel: "#0F6E56" },
                  { bg: "#FAEEDA", border: "#BA7517", text: "#633806", eg: "#854F0B", carFill: "#EF9F27", carBody: "#FAC775", wheel: "#854F0B" },
                ][idx % 3];
                const isSel = selectedCategory === category.id;
                return (
                  <div
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    role="button" tabIndex={0}
                    aria-label={`Select ${category.displayName}`}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedCategory(category.id); } }}
                    style={{
                      background: isSel ? colors.bg : "#fff",
                      border: `2px solid ${isSel ? colors.border : "#E5E7EB"}`,
                      borderRadius: 14, overflow: "hidden", cursor: "pointer",
                      transition: "border-color .15s, background .15s",
                    }}
                  >
                    {/* car illustration */}
                    <div style={{ height: 80, background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="110" height="60" viewBox="0 0 110 60">
                        <rect width="110" height="60" fill={colors.bg} />
                        <rect x="12" y="28" width="86" height="22" rx="4" fill={colors.carFill} />
                        <rect x="22" y="16" width="60" height="18" rx="3" fill={colors.carBody} />
                        <rect x="27" y="19" width="24" height="12" rx="2" fill="#fff" opacity=".55" />
                        <rect x="56" y="19" width="22" height="12" rx="2" fill="#fff" opacity=".55" />
                        <ellipse cx="32" cy="52" rx="10" ry="10" fill={colors.wheel} />
                        <ellipse cx="32" cy="52" rx="5" ry="5" fill={colors.carFill} />
                        <ellipse cx="80" cy="52" rx="10" ry="10" fill={colors.wheel} />
                        <ellipse cx="80" cy="52" rx="5" ry="5" fill={colors.carFill} />
                        {idx === 2 && <><rect x="12" y="33" width="4" height="8" rx="1" fill="#D85A30" /><rect x="94" y="33" width="4" height="8" rx="1" fill="#D85A30" /></>}
                      </svg>
                    </div>
                    <div style={{ padding: "10px 14px 12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1a0533", marginBottom: 3 }}>
                        {category.displayName}
                      </div>
                      <div style={{ fontSize: 11, color: colors.eg }}>
                        e.g. {category.examples.slice(0, 3).join(", ")}
                      </div>
                    </div>
                    {isSel && (
                      <div style={{ background: colors.border, height: 3, width: "100%" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BILLING DURATION PILLS ─────────────────────────────────────── */}
        {plans.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
              Billing duration
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DURATION_OPTIONS.map((d) => {
                const isOn = selectedDuration === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDuration(d.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: isOn ? 500 : 400,
                      cursor: "pointer", border: `2px solid ${isOn ? "#1a0533" : "#E5E7EB"}`,
                      background: isOn ? "#1a0533" : "#fff",
                      color: isOn ? "#fff" : "#374151",
                      transition: "all .15s",
                    }}
                  >
                    {d.label}
                    {d.badge && (
                      <span style={{ background: d.badgeColor, color: "#fff", fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 500 }}>
                        {d.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PLAN CARDS GRID ────────────────────────────────────────────── */}
        {plans.length > 0 && selectedCategoryData && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 500, color: "#1a0533", marginBottom: 4 }}>
                Plans for {selectedCategoryData.displayName}
              </h2>
              <p style={{ fontSize: 13, color: "#6B7280" }}>
                All plans include {plans[0].tier.washesPerMonth} washes per month (Mon–Sat)
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, alignItems: "start" }}>
              {plans.map((plan) => {
                const selectedPrice = plan.prices.find((p) => p.duration === selectedDuration);
                if (!selectedPrice) return null;

                const accent = getTierAccent(plan.tier.name);

                return (
                  <div
                    key={plan.tier.id}
                    style={{
                      background: "#fff",
                      border: `2px solid ${accent.border}`,
                      borderRadius: 16,
                      overflow: "hidden",
                    }}
                  >
                    {/* colour top bar */}
                    <div style={{ background: accent.bg, padding: "18px 18px 14px", borderBottom: `1px solid ${accent.border}20` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 500, color: accent.text, marginBottom: 4 }}>
                            {plan.tier.displayName}
                          </div>
                          <div style={{ fontSize: 26, fontWeight: 500, color: "#1a0533", lineHeight: 1 }}>
                            {subscriptionPlansService.formatPrice(selectedPrice.totalAmount)}
                          </div>
                          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
                            {selectedPrice.label} billing
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {selectedPrice.amountSaved > 0 && (
                            <span style={{ background: "#E1F5EE", color: "#0F6E56", fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 500, display: "block", marginBottom: 4 }}>
                              Save {subscriptionPlansService.formatPrice(selectedPrice.amountSaved)}
                            </span>
                          )}
                          {selectedPrice.isBestValue && (
                            <span style={{ background: "#EEEDFE", color: "#534AB7", fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
                              <Sparkles size={10} /> Best value
                            </span>
                          )}
                        </div>
                      </div>

                      {/* effective monthly */}
                      <div style={{ marginTop: 12, background: "#fff", borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Effective monthly</div>
                          <div style={{ fontSize: 16, fontWeight: 500, color: "#1a0533" }}>
                            {subscriptionPlansService.formatPrice(selectedPrice.effectiveMonthlyPrice)}/mo
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Per wash</div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: accent.text }}>
                            {subscriptionPlansService.formatPrice(plan.tier.costPerWash)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* features */}
                    <div style={{ padding: "14px 18px 8px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                        {plan.features
                          .sort((a, b) => {
                            const freqOrder = { EVERY_WASH: 0, WEEKLY: 1, MONTHLY: 2 };
                            return freqOrder[a.frequency] - freqOrder[b.frequency];
                          })
                          .slice(0, 8)
                          .map((feature) => (
                            <div key={feature.id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <div style={{ width: 18, height: 18, borderRadius: 5, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                <Check size={11} color="#0F6E56" />
                              </div>
                              <span style={{ fontSize: 13, color: "#374151" }}>{feature.featureName}</span>
                            </div>
                          ))}
                        {plan.features.length > 8 && (
                          <div style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>
                            + {plan.features.length - 8} more features
                          </div>
                        )}
                      </div>

                      {/* CTA — logic unchanged */}
                      <button
                        style={{
                          width: "100%", padding: "12px", borderRadius: 10,
                          background: accent.btnBg, color: "#fff", border: "none",
                          fontSize: 14, fontWeight: 500, cursor: "pointer",
                          marginBottom: 14, transition: "opacity .15s",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = ".85")}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                        onClick={() => {
                          logger.log("Selected plan:", plan.tier.id, selectedDuration);
                        }}
                      >
                        Select {plan.tier.displayName}
                      </button>

                      {/* Recommended Add-ons — logic unchanged */}
                      {plan.addons.length > 0 && (
                        <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 12, marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6B7280", marginBottom: 8 }}>
                            <Tag size={12} /> Popular add-ons
                          </div>
                          {plan.addons.slice(0, 3).map((addon) => (
                            <div key={addon.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#374151", padding: "4px 0" }}>
                              <span>{addon.name}</span>
                              <span style={{ fontWeight: 500, color: accent.text }}>
                                +{subscriptionPlansService.formatPrice(addon.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── INFO BANNER — logic unchanged ─────────────────────────────── */}
        <div style={{ background: "#E6F1FB", border: "1px solid #B5D4F4", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14 }}>
          <Info size={20} color="#185FA5" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0C447C", marginBottom: 8 }}>
              How it works
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                "Daily doorstep service (Mon–Sat) = ~26 washes per month",
                "Choose longer billing duration for bigger savings",
                "All prices include service, materials, and GST",
                "Add-ons can be added anytime after subscription",
              ].map((item) => (
                <li key={item} style={{ fontSize: 13, color: "#185FA5", display: "flex", gap: 7, alignItems: "flex-start" }}>
                  <span style={{ color: "#1D9E75", fontWeight: 500 }}>✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
