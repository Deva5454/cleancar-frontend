/**
 * Add-on Selector Component
 * UI RESTYLED ONLY — all logic, state, hooks, service calls, and props unchanged
 */

import { useState, useEffect } from "react";
import { Check, Info, Sparkles } from "lucide-react";
import { subscriptionPlansService } from "../../services/subscriptionPlansService";
import type { Addon, PlanTierName } from "../../types/subscriptionPlans.types";

// ── Icon colour per add-on category ─────────────────────────────────────────
const ADDON_COLORS: Record<string, { bg: string; icon: string; selBorder: string; selBg: string }> = {
  interior:  { bg: "#EEEDFE", icon: "#534AB7", selBorder: "#534AB7", selBg: "#F5F4FF" },
  exterior:  { bg: "#E1F5EE", icon: "#0F6E56", selBorder: "#1D9E75", selBg: "#F0FDF8" },
  engine:    { bg: "#FAEEDA", icon: "#854F0B", selBorder: "#BA7517", selBg: "#FFFAF0" },
  default:   { bg: "#E6F1FB", icon: "#185FA5", selBorder: "#378ADD", selBg: "#F0F8FF" },
};

function addonColor(name: string) {
  const n = name.toLowerCase();
  if (n.includes("vacuum") || n.includes("interior") || n.includes("dash")) return ADDON_COLORS.interior;
  if (n.includes("tyre") || n.includes("shampoo") || n.includes("wax") || n.includes("exterior") || n.includes("fragrance")) return ADDON_COLORS.exterior;
  if (n.includes("engine")) return ADDON_COLORS.engine;
  return ADDON_COLORS.default;
}

interface AddonSelectorProps {
  selectedPlanTier?: PlanTierName;
  onAddonsChange?: (selectedAddonIds: string[], totalCost: number) => void;
}

export function AddonSelector({ selectedPlanTier, onAddonsChange }: AddonSelectorProps) {
  // ── ALL STATE AND LOGIC IDENTICAL TO ORIGINAL ────────────────────────────
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [recommendedAddons, setRecommendedAddons] = useState<Addon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  useEffect(() => {
    const loadedAddons = subscriptionPlansService.getAddons(false);
    setAllAddons(loadedAddons);
    if (selectedPlanTier) {
      const recommended = subscriptionPlansService.getRecommendedAddons(selectedPlanTier);
      setRecommendedAddons(recommended);
    }
  }, [selectedPlanTier]);

  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) => {
      const newSelection = prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId];
      const totalCost = newSelection.reduce((sum, id) => {
        const addon = allAddons.find((a) => a.id === id);
        return sum + (addon?.price || 0);
      }, 0);
      if (onAddonsChange) onAddonsChange(newSelection, totalCost);
      return newSelection;
    });
  };

  const totalAddonCost = selectedAddonIds.reduce((sum, id) => {
    const addon = allAddons.find((a) => a.id === id);
    return sum + (addon?.price || 0);
  }, 0);

  const recommendedIds = new Set(recommendedAddons.map((a) => a.id));
  // ── END UNCHANGED LOGIC ──────────────────────────────────────────────────

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 500, color: "#1a0533", marginBottom: 6 }}>
          Enhance your plan with add-ons
        </h3>
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          Optional services you can add to your subscription
        </p>
      </div>

      {/* Recommended */}
      {recommendedAddons.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <Sparkles size={16} color="#534AB7" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#3C3489" }}>
              Recommended for your plan
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
            {recommendedAddons.map((addon) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                isSelected={selectedAddonIds.includes(addon.id)}
                onToggle={() => handleToggleAddon(addon.id)}
                isRecommended={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other add-ons */}
      {allAddons.filter((a) => !recommendedIds.has(a.id)).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 12 }}>
            Other add-ons
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
            {allAddons
              .filter((a) => !recommendedIds.has(a.id))
              .map((addon) => (
                <AddonCard
                  key={addon.id}
                  addon={addon}
                  isSelected={selectedAddonIds.includes(addon.id)}
                  onToggle={() => handleToggleAddon(addon.id)}
                  isRecommended={false}
                />
              ))}
          </div>
        </div>
      )}

      {/* Total — logic unchanged */}
      {selectedAddonIds.length > 0 && (
        <div style={{ background: "#E1F5EE", border: "1px solid #9FE1CB", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#085041" }}>Total add-on cost</div>
            <div style={{ fontSize: 12, color: "#0F6E56" }}>
              {selectedAddonIds.length} add-on{selectedAddonIds.length !== 1 ? "s" : ""} selected
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#085041" }}>
            +{subscriptionPlansService.formatPrice(totalAddonCost)}
          </div>
        </div>
      )}

      {/* Info */}
      <div style={{ background: "#F8F7FF", border: "1px solid #D3D1C7", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12 }}>
        <Info size={18} color="#534AB7" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#3C3489", marginBottom: 6 }}>Add-on billing</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              "Per-visit add-ons are charged each time they're performed",
              "Per-month add-ons are a fixed monthly charge",
              "You can add or remove add-ons anytime after subscribing",
            ].map((item) => (
              <li key={item} style={{ fontSize: 12, color: "#534AB7" }}>· {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── ADDON CARD — logic unchanged, only visual ────────────────────────────────

interface AddonCardProps {
  addon: Addon;
  isSelected: boolean;
  onToggle: () => void;
  isRecommended: boolean;
}

function AddonCard({ addon, isSelected, onToggle, isRecommended }: AddonCardProps) {
  const c = addonColor(addon.name);

  return (
    <div
      onClick={onToggle}
      role="button" tabIndex={0}
      aria-label={`${isSelected ? "Deselect" : "Select"} ${addon.name}`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      style={{
        background: isSelected ? c.selBg : "#fff",
        border: `2px solid ${isSelected ? c.selBorder : isRecommended ? c.selBorder + "55" : "#E5E7EB"}`,
        borderRadius: 12, padding: "14px", cursor: "pointer",
        transition: "border-color .15s, background .15s",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* checkbox replacement */}
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
          background: isSelected ? c.selBorder : "#fff",
          border: `2px solid ${isSelected ? c.selBorder : "#D1D5DB"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s",
        }}>
          {isSelected && <Check size={13} color="#fff" />}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1a0533" }}>{addon.name}</div>
              {isRecommended && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#EEEDFE", color: "#534AB7", fontSize: 10, padding: "2px 8px", borderRadius: 20, marginTop: 3, fontWeight: 500 }}>
                  <Sparkles size={9} /> Recommended
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: c.icon }}>
                {subscriptionPlansService.formatPrice(addon.price)}
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                {addon.billingType === "PER_VISIT" ? "per visit" : "per month"}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>{addon.description}</p>
        </div>
      </div>

      {isSelected && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${c.selBorder}33`, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: c.icon, fontWeight: 500 }}>
          <Check size={13} /> Added to your plan
        </div>
      )}
    </div>
  );
}
