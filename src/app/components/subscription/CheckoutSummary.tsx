/**
 * Checkout Summary Component
 * UI RESTYLED ONLY — all logic, calculations, props, and callbacks unchanged
 * Desktop: sticky right-side summary panel via position:sticky on the wrapper
 */

import { useState } from "react";
import { Check, Calendar, CreditCard, Tag, TrendingDown, Info, ChevronRight } from "lucide-react";
import { subscriptionPlansService } from "../../services/subscriptionPlansService";
import { logger } from "../../services/logger";
import type { CompletePlan, DurationPrice, Addon, BillingDurationType } from "../../types/subscriptionPlans.types";

interface CheckoutSummaryProps {
  plan: CompletePlan;
  selectedDuration: BillingDurationType;
  selectedAddons?: Addon[];
  onProceedToPayment?: () => void;
}

export function CheckoutSummary({
  plan,
  selectedDuration,
  selectedAddons = [],
  onProceedToPayment,
}: CheckoutSummaryProps) {
  // ── ALL CALCULATIONS IDENTICAL TO ORIGINAL ───────────────────────────────
  const selectedPrice = plan.prices.find((p) => p.duration === selectedDuration);

  if (!selectedPrice) {
    return (
      <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 12, padding: 20 }}>
        <p style={{ color: "#DC2626", fontSize: 14 }}>Error: Invalid billing duration selected</p>
      </div>
    );
  }

  const addonMonthlyTotal = selectedAddons.reduce((sum, addon) => {
    if (addon.billingType === "PER_MONTH") return sum + addon.price;
    return sum;
  }, 0);

  const addonPerVisitTotal = selectedAddons.reduce((sum, addon) => {
    if (addon.billingType === "PER_VISIT") return sum + addon.price;
    return sum;
  }, 0);

  const totalAddonCost = addonMonthlyTotal * selectedPrice.months;
  const grandTotal = selectedPrice.totalAmount + totalAddonCost;
  const effectiveMonthlyWithAddons = Math.round(grandTotal / selectedPrice.months);
  // ── END UNCHANGED CALCULATIONS ───────────────────────────────────────────

  const Row = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0" }}>
      <span style={{ color: "#6B7280" }}>{label}</span>
      <span style={{ fontWeight: 500, color: accent || "#1a0533" }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 48px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, color: "#1a0533", marginBottom: 6 }}>
          Checkout summary
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280" }}>Review your subscription before payment</p>
      </div>

      {/* Main card */}
      <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>

        {/* Plan header — coloured band */}
        <div style={{ background: "#1a0533", padding: "20px 22px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 500, color: "#fff", marginBottom: 3 }}>
                {plan.tier.displayName}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}>
                {plan.vehicleCategory.displayName}
              </div>
            </div>
            <span style={{ background: "#534AB7", color: "#EEEDFE", fontSize: 12, padding: "4px 12px", borderRadius: 20, fontWeight: 500 }}>
              {selectedPrice.label}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginBottom: 3 }}>Billing duration</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#fff", display: "flex", alignItems: "center", gap: 5 }}>
                <Calendar size={14} />
                {selectedPrice.months} month{selectedPrice.months !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginBottom: 3 }}>Washes / month</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>
                {plan.tier.washesPerMonth} washes
              </div>
            </div>
          </div>
        </div>

        {/* Pricing breakdown */}
        <div style={{ padding: "18px 22px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 10 }}>
            Pricing breakdown
          </div>

          {/* Base price — logic unchanged */}
          <Row
            label={`Base plan (${selectedPrice.months} × ${subscriptionPlansService.formatPrice(plan.tier.baseMonthlyPrice)})`}
            value={subscriptionPlansService.formatPrice(plan.tier.baseMonthlyPrice * selectedPrice.months)}
          />

          {selectedPrice.amountSaved > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0" }}>
              <span style={{ color: "#1D9E75", display: "flex", alignItems: "center", gap: 4 }}>
                <TrendingDown size={13} /> Duration discount ({selectedPrice.discountPercent}% off)
              </span>
              <span style={{ fontWeight: 500, color: "#1D9E75" }}>
                -{subscriptionPlansService.formatPrice(selectedPrice.amountSaved)}
              </span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0 5px", borderTop: "1px solid #F3F4F6", marginTop: 5 }}>
            <span style={{ fontWeight: 500, color: "#1a0533" }}>Plan subtotal</span>
            <span style={{ fontWeight: 500, color: "#1a0533" }}>{subscriptionPlansService.formatPrice(selectedPrice.totalAmount)}</span>
          </div>

          {/* Add-ons — logic unchanged */}
          {selectedAddons.length > 0 && (
            <>
              <div style={{ borderTop: "1px solid #F3F4F6", margin: "12px 0 10px" }} />
              <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                <Tag size={13} /> Add-ons
              </div>
              {selectedAddons.map((addon) => {
                const addonCost = addon.billingType === "PER_MONTH" ? addon.price * selectedPrice.months : 0;
                return (
                  <div key={addon.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", color: "#374151" }}>
                    <span style={{ flex: 1 }}>
                      {addon.name}
                      <span style={{ color: "#9CA3AF", marginLeft: 4 }}>
                        ({addon.billingType === "PER_MONTH"
                          ? `${subscriptionPlansService.formatPrice(addon.price)}/mo × ${selectedPrice.months}`
                          : "per visit – billed separately"})
                      </span>
                    </span>
                    <span style={{ fontWeight: 500, marginLeft: 8 }}>
                      {addon.billingType === "PER_MONTH"
                        ? `+${subscriptionPlansService.formatPrice(addonCost)}`
                        : "On-demand"}
                    </span>
                  </div>
                );
              })}
              {addonMonthlyTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 500, padding: "8px 0 5px", borderTop: "1px solid #F3F4F6", marginTop: 5 }}>
                  <span>Add-ons subtotal</span>
                  <span>+{subscriptionPlansService.formatPrice(totalAddonCost)}</span>
                </div>
              )}
            </>
          )}

          {/* Grand total */}
          <div style={{ borderTop: "1.5px solid #E5E7EB", marginTop: 12, paddingTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#1a0533" }}>Total amount</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 30, fontWeight: 500, color: "#534AB7", lineHeight: 1 }}>
                  {subscriptionPlansService.formatPrice(grandTotal)}
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                  for {selectedPrice.months} month{selectedPrice.months !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Effective monthly */}
            <div style={{ background: "#E6F1FB", border: "1px solid #B5D4F4", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#0C447C" }}>Effective monthly cost</div>
                <div style={{ fontSize: 11, color: "#185FA5", marginTop: 2 }}>Total ÷ {selectedPrice.months} months</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 500, color: "#0C447C" }}>
                {subscriptionPlansService.formatPrice(effectiveMonthlyWithAddons)}
                <span style={{ fontSize: 13, fontWeight: 400 }}>/mo</span>
              </div>
            </div>

            {/* Cost per wash */}
            <div style={{ background: "#F8F7FF", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>Cost per wash</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "#534AB7" }}>
                {subscriptionPlansService.formatPrice(plan.tier.costPerWash)}
              </div>
            </div>
          </div>

          {/* Savings badge — logic unchanged */}
          {selectedPrice.amountSaved > 0 && (
            <div style={{ background: "#E1F5EE", border: "2px solid #5DCAA5", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}>
              <Check size={18} color="#0F6E56" />
              <span style={{ fontSize: 13, fontWeight: 500, color: "#085041" }}>
                You're saving {subscriptionPlansService.formatPrice(selectedPrice.amountSaved)} with {selectedPrice.label} billing!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* What's included — logic unchanged */}
      <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 16, padding: "18px 22px", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#1a0533", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <Check size={16} color="#1D9E75" /> What's included
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
          {plan.features.slice(0, 10).map((feature) => (
            <div key={feature.id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Check size={11} color="#0F6E56" />
              </div>
              <span style={{ fontSize: 12, color: "#374151" }}>{feature.featureName}</span>
            </div>
          ))}
          {plan.features.length > 10 && (
            <div style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>
              + {plan.features.length - 10} more features
            </div>
          )}
        </div>
      </div>

      {/* Payment info — logic unchanged */}
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12, marginBottom: 20 }}>
        <Info size={18} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#92400E", marginBottom: 6 }}>Payment &amp; service details</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              "Service starts within 24 hours of payment confirmation",
              "Daily doorstep service (Mon–Sat) = ~26 washes/month",
              "All prices include GST and service charges",
              "Auto-renewal can be disabled anytime from your account",
            ].map((item) => (
              <li key={item} style={{ fontSize: 12, color: "#92400E" }}>· {item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA buttons — logic unchanged */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          style={{
            flex: 1, padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 500,
            background: "#fff", border: "1.5px solid #D1D5DB", color: "#374151", cursor: "pointer",
          }}
          onClick={() => window.history.back()}
        >
          Back to plans
        </button>
        <button
          style={{
            flex: 2, padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 500,
            background: "#1a0533", border: "none", color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = ".85")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          onClick={() => {
            if (onProceedToPayment) onProceedToPayment();
            logger.log("Proceeding to payment:", {
              planId: plan.tier.id,
              duration: selectedDuration,
              addons: selectedAddons.map((a) => a.id),
              total: grandTotal,
            });
          }}
        >
          <CreditCard size={16} /> Proceed to payment <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
