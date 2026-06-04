/**
 * Subscription App - Main Orchestrator
 * UI RESTYLED ONLY — all logic, state, props, and callbacks unchanged
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { PlanSelectionScreen } from "./PlanSelectionScreen";
import AdminPlanManagement from "./AdminPlanManagement";
import { AddonSelector } from "./AddonSelector";
import { ComboOfferCards } from "./ComboOfferCards";
import { User, Shield, Settings } from "lucide-react";
import type { UserRole } from "../../types/subscriptionPlans.types";

export function SubscriptionApp() {
  const [activeView, setActiveView] = useState<"customer" | "admin">("customer");
  const [userRole, setUserRole] = useState<UserRole>("ADMIN");

  return (
    <div className="min-h-screen" style={{ background: "#F8F7FF" }}>
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1a0533", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#AFA9EC", fontSize: 18 }}>✦</span>
              </div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 500, color: "#1a0533", margin: 0 }}>
                  CleanCar 360°
                </h1>
                <p style={{ fontSize: 11, color: "#888", margin: 0 }}>
                  Subscription Management
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge variant="outline" className="text-xs" style={{ borderColor: "#AFA9EC", color: "#534AB7" }}>
                Vehicle Washing Plans
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Demo Mode
              </Badge>
            </div>
          </div>

          {/* View Switcher */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setActiveView("customer")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: "none", cursor: "pointer",
                background: activeView === "customer" ? "#1a0533" : "transparent",
                color: activeView === "customer" ? "#fff" : "#666",
                outline: activeView === "customer" ? "none" : "1px solid #e5e7eb",
              }}
            >
              <User size={14} /> Customer View
            </button>
            <button
              onClick={() => setActiveView("admin")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: "none", cursor: "pointer",
                background: activeView === "admin" ? "#1a0533" : "transparent",
                color: activeView === "admin" ? "#fff" : "#666",
                outline: activeView === "admin" ? "none" : "1px solid #e5e7eb",
              }}
            >
              <Shield size={14} /> Admin Panel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        {activeView === "customer" ? (
          <CustomerView />
        ) : (
          <AdminView userRole={userRole} onRoleChange={setUserRole} />
        )}
      </div>
    </div>
  );
}

// ── CUSTOMER VIEW ─────────────────────────────────────────────────────────────

function CustomerView() {
  const [currentStep, setCurrentStep] = useState<"plans" | "addons" | "combos">("plans");

  const steps = [
    { key: "plans",  label: "Select Plan",    num: 1 },
    { key: "addons", label: "Add-ons",         num: 2 },
    { key: "combos", label: "Combo Offers",    num: 3 },
  ] as const;

  return (
    <div>
      {/* Step Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-center gap-3">
          {steps.map((s, i) => {
            const isDone = steps.findIndex(x => x.key === currentStep) > i;
            const isActive = currentStep === s.key;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep(s.key)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    background: "none", border: "none", cursor: "pointer", opacity: isActive || isDone ? 1 : 0.45,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 15,
                    background: isActive ? "#1a0533" : isDone ? "#1D9E75" : "#E5E7EB",
                    color: isActive || isDone ? "#fff" : "#6B7280",
                    border: isActive ? "2px solid #534AB7" : "none",
                    transition: "all 0.2s",
                  }}>
                    {isDone ? "✓" : s.num}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: isActive ? 500 : 400, color: isActive ? "#1a0533" : "#6B7280" }}>
                    {s.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div style={{ width: 48, height: 2, background: isDone ? "#1D9E75" : "#E5E7EB", borderRadius: 2 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content — logic unchanged */}
      {currentStep === "plans" && <PlanSelectionScreen />}
      {currentStep === "addons" && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AddonSelector selectedPlanTier="SHAMPOO_WASH" />
        </div>
      )}
      {currentStep === "combos" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ComboOfferCards />
        </div>
      )}
    </div>
  );
}

// ── ADMIN VIEW — unchanged logic ──────────────────────────────────────────────

interface AdminViewProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

function AdminView({ userRole, onRoleChange }: AdminViewProps) {
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Settings size={18} style={{ color: "#6B7280" }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Simulate Role:</span>
          <div className="flex gap-2">
            {(["SUPER_ADMIN", "ADMIN", "MANAGER", "VIEWER"] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                  cursor: "pointer", border: "1.5px solid",
                  background: userRole === role ? "#1a0533" : "transparent",
                  color: userRole === role ? "#fff" : "#534AB7",
                  borderColor: userRole === role ? "#1a0533" : "#AFA9EC",
                }}
              >
                {role.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>
      <AdminPlanManagement userRole={userRole} />
    </div>
  );
}
