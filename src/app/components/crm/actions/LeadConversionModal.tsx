/**
 * LeadConversionModal - TSE lead conversion with 3 plan modes:
 *   1. Monthly Subscription — recurring, commitment 1/3/6/12 months
 *   2. Visit Pack — Pack of 2 (valid 20 days) or Pack of 4 (valid 30 days)
 *   3. One-Time Wash — specific date + time, must be within validity window
 *
 * Fixed: SHINE/PROTECT/ELITE plan IDs, GST 18%, addon frequency,
 *        live prices from planSyncService, visit pack validity enforcement
 */

import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "../ui/dialog";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  CheckCircle, XCircle, AlertCircle, Loader2,
  DollarSign, CreditCard, Calendar, Package,
} from "lucide-react";
import { type PaymentDetails, type SubscriptionPlan } from "../../services/leadConversionService";
import { useBusinessFlows } from "../../contexts/AppProvider";
import { useCity } from "../../contexts/CityContext";
import { toast } from "sonner";
import { planSyncService } from "../../services/planSyncService";

// ─── Types ────────────────────────────────────────────────────────────────────
type PlanMode = "monthly" | "pack2" | "pack4" | "onetime";

interface Lead {
  id: string; name: string; mobile: string; email?: string; area: string;
  carType: string; leadSource: string; status: string; notes?: string;
  vehicleCategory?: string;
  vehicleDetails?: { brand?: string; color?: string; registrationNumber?: string };
  planOfInterest?: string;
}

interface LeadConversionModalProps {
  lead: Lead; open: boolean;
  onOpenChange: (open: boolean) => void; onSuccess: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAN_OPTIONS = [
  { value: "SHINE",   label: "Express Wash", buyId: "water"   },
  { value: "PROTECT", label: "Smart Wash",   buyId: "shampoo" },
  { value: "ELITE",   label: "Elite Wash",   buyId: "wax"     },
];

const COMMITMENT_OPTIONS = [
  { months: 1,  label: "1 Month — No lock-in",  discountPct: 0  },
  { months: 3,  label: "3 Months — 5% off",     discountPct: 5  },
  { months: 6,  label: "6 Months — 10% off",    discountPct: 10 },
  { months: 12, label: "12 Months — 18% off",   discountPct: 18 },
];

const VEHICLE_OPTIONS = [
  { value: "hatchback", label: "Hatchback"   },
  { value: "suv",       label: "SUV / Sedan" },
  { value: "luxury",    label: "Luxury SUV"  },
];

const ADDON_OPTIONS = [
  { id: "vacuum",    label: "Interior Deep Vacuum",  price: 199 },
  { id: "dashboard", label: "Dashboard & Console",   price: 149 },
  { id: "tyre",      label: "Tyre Dressing (all 4)", price: 99  },
  { id: "wax",       label: "Full Hand Wax Polish",  price: 199 },
  { id: "underbody", label: "Underbody Wash",         price: 199 },
  { id: "engine",    label: "Engine Bay Wipe-Down",  price: 99  },
  { id: "fragrance", label: "Car Fragrance",          price: 49  },
];

const ADDON_FREQ_OPTIONS = [
  { value: 1, label: "1×/month"                },
  { value: 2, label: "2×/month"                },
  { value: 4, label: "4×/month (recommended)"  },
  { value: 8, label: "8×/month"                },
];

// Pack validity: Pack of 2 = 20 days, Pack of 4 = 30 days
const PACK_VALIDITY: Record<string, number> = { pack2: 20, pack4: 30 };

// Pack prices (same as buy page)
const PACK_PRICES: Record<string, Record<string, number>> = {
  SHINE:   { pack2: 2298, pack4: 4296 }, // 1249 × 2 × 0.92, etc — buy page uses fixed pack prices
  PROTECT: { pack2: 2938, pack4: 5436 },
  ELITE:   { pack2: 3678, pack4: 6796 },
};

const ONE_TIME_PRICES: Record<string, number> = {
  SHINE: 499, PROTECT: 699, ELITE: 999,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLivePlanPrice(tierId: string, vehicleCat: string): number {
  try {
    const plans = planSyncService.getAllPlanPrices();
    const plan = plans.find(p => p.tierId === tierId);
    if (!plan) throw new Error("not found");
    if (vehicleCat === "suv") return plan.suv;
    if (vehicleCat === "luxury") return plan.luxury;
    return plan.hatchback;
  } catch {
    const fallback: Record<string, Record<string, number>> = {
      SHINE:   { hatchback: 1249, suv: 1499, luxury: 1999 },
      PROTECT: { hatchback: 1599, suv: 1999, luxury: 2699 },
      ELITE:   { hatchback: 1999, suv: 2499, luxury: 3499 },
    };
    return fallback[tierId]?.[vehicleCat] ?? 1599;
  }
}

function getMaxDate(validityDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + validityDays);
  return d.toISOString().split("T")[0];
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function detectVehicleCat(lead: Lead): string {
  const cat = (lead?.vehicleCategory || lead?.carType || "").toLowerCase();
  if (cat.includes("luxury") || cat.includes("fortuner") || cat.includes("xuv700")) return "luxury";
  if (cat.includes("suv") || cat.includes("sedan") || cat.includes("muv")) return "suv";
  return "hatchback";
}

// ─── Component ────────────────────────────────────────────────────────────────
export function LeadConversionModal({
  lead, open, onOpenChange, onSuccess,
}: LeadConversionModalProps) {
  const { convertLeadWithPayment } = useBusinessFlows();
  const { cityInfo } = useCity();

  // ── Plan mode ──────────────────────────────────────────────────────────────
  const [planMode, setPlanMode] = useState<PlanMode>("monthly");

  // ── Monthly subscription state ─────────────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState("PROTECT");
  const [vehicleCat, setVehicleCat] = useState(detectVehicleCat(lead));
  const [commitMonths, setCommitMonths] = useState(3);
  const [startDate, setStartDate] = useState(getTodayStr());

  // ── Visit pack state ───────────────────────────────────────────────────────
  const [packPlan, setPackPlan] = useState("PROTECT");
  const [packVehicle, setPackVehicle] = useState(detectVehicleCat(lead));

  // ── One-time wash state ────────────────────────────────────────────────────
  const [otPlan, setOtPlan] = useState("PROTECT");
  const [otVehicle, setOtVehicle] = useState(detectVehicleCat(lead));
  const [otDate, setOtDate] = useState("");
  const [otTime, setOtTime] = useState("");

  // ── Add-ons ────────────────────────────────────────────────────────────────
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [addonFreqPerMonth, setAddonFreqPerMonth] = useState(4);

  // ── Payment ────────────────────────────────────────────────────────────────
  const [paymentStatus, setPaymentStatus] = useState<"Pending"|"Paid"|"Failed">("Pending");
  const [paymentMethod, setPaymentMethod] = useState<"Cash"|"UPI"|"Card"|"Net Banking"|"Cheque">("UPI");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState(getTodayStr());

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ── Price calculations ─────────────────────────────────────────────────────
  const pricing = useMemo(() => {
    const addonPerVisitTotal = selectedAddons.reduce((sum, id) => {
      return sum + (ADDON_OPTIONS.find(a => a.id === id)?.price || 0);
    }, 0);

    if (planMode === "monthly") {
      const monthly = getLivePlanPrice(selectedPlan, vehicleCat);
      const commitment = COMMITMENT_OPTIONS.find(c => c.months === commitMonths)!;
      const base = monthly * commitMonths;
      const discount = Math.round(base * commitment.discountPct / 100);
      const addonTotal = addonPerVisitTotal * addonFreqPerMonth * commitMonths;
      const subtotal = base - discount + addonTotal;
      const gst = Math.round(subtotal * 0.18);
      return {
        label: `${commitMonths}-Month Subscription`,
        base, discount, addonTotal, subtotal, gst,
        grand: subtotal + gst,
        addonNote: `${addonFreqPerMonth}×/mo × ${commitMonths}mo`,
      };
    }

    if (planMode === "pack2" || planMode === "pack4") {
      const visits = planMode === "pack2" ? 2 : 4;
      const validity = PACK_VALIDITY[planMode];
      const packBase = PACK_PRICES[packPlan]?.[planMode] ?? getLivePlanPrice(packPlan, packVehicle) * visits * 0.92;
      const addonTotal = addonPerVisitTotal * visits; // per visit × visits in pack
      const subtotal = packBase + addonTotal;
      const gst = Math.round(subtotal * 0.18);
      return {
        label: `Pack of ${visits} Washes (${validity} days valid)`,
        base: packBase, discount: 0, addonTotal, subtotal, gst,
        grand: subtotal + gst,
        addonNote: `${visits} visits in pack`,
      };
    }

    // One-time
    const otBase = ONE_TIME_PRICES[otPlan] ?? 699;
    const addonTotal = addonPerVisitTotal; // per visit only
    const subtotal = otBase + addonTotal;
    const gst = Math.round(subtotal * 0.18);
    return {
      label: "One-Time Wash",
      base: otBase, discount: 0, addonTotal, subtotal, gst,
      grand: subtotal + gst,
      addonNote: "per visit",
    };
  }, [planMode, selectedPlan, vehicleCat, commitMonths, packPlan, packVehicle,
      otPlan, otVehicle, selectedAddons, addonFreqPerMonth]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const otDateValid = useMemo(() => {
    if (planMode !== "onetime") return true;
    if (!otDate || !otTime) return false;
    const selected = new Date(otDate);
    const today = new Date(); today.setHours(0,0,0,0);
    const maxD = new Date(); maxD.setDate(maxD.getDate() + 7); // 7-day booking window
    return selected >= today && selected <= maxD;
  }, [planMode, otDate, otTime]);

  const isPaymentValid = paymentStatus === "Paid" &&
    parseFloat(paymentAmount || "0") >= pricing.grand;

  const isSubscriptionValid =
    (planMode === "monthly" && selectedPlan && vehicleCat && commitMonths && startDate) ||
    (planMode === "pack2" || planMode === "pack4") ||
    (planMode === "onetime" && otDateValid);

  const canConvert = isPaymentValid && isSubscriptionValid;

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  // ── Conversion handler ─────────────────────────────────────────────────────
  const handleConfirmConversion = async () => {
    setIsConverting(true);
    setConversionError(null);
    try {
      const paymentDetails: PaymentDetails = {
        paymentMethod, transactionId: transactionId || undefined,
        amount: parseFloat(paymentAmount), paymentDate, status: paymentStatus,
      };

      const activePlan = planMode === "monthly" ? selectedPlan
        : planMode === "pack2" || planMode === "pack4" ? packPlan
        : otPlan;

      const activeVehicle = planMode === "monthly" ? vehicleCat
        : planMode === "pack2" || planMode === "pack4" ? packVehicle
        : otVehicle;

      const addOnsForRecord = selectedAddons.map(id => {
        const addon = ADDON_OPTIONS.find(a => a.id === id);
        const visits = planMode === "monthly" ? addonFreqPerMonth
          : planMode === "pack2" ? 2 : planMode === "pack4" ? 4 : 1;
        return {
          name: addon?.label || id,
          price: addon?.price || 0,
          frequency: pricing.addonNote,
          totalForPeriod: (addon?.price || 0) * visits * (planMode === "monthly" ? commitMonths : 1),
        };
      });

      const frequency =
        planMode === "monthly" ? "Daily" :
        planMode === "pack2" ? "Pack of 2" :
        planMode === "pack4" ? "Pack of 4" : "One-Time";

      const subscriptionPlan: SubscriptionPlan = {
        packageType: activePlan,
        packageName: PLAN_OPTIONS.find(p => p.value === activePlan)?.label || activePlan,
        frequency,
        commitmentMonths: planMode === "monthly" ? commitMonths : 0,
        validityDays: planMode === "pack2" ? 20 : planMode === "pack4" ? 30 : 7,
        scheduledDate: planMode === "onetime" ? otDate : undefined,
        scheduledTime: planMode === "onetime" ? otTime : undefined,
        pricing: {
          basePrice: pricing.base,
          discount: pricing.discount,
          addonTotal: pricing.addonTotal,
          subtotal: pricing.subtotal,
          gst: pricing.gst,
          finalPrice: pricing.grand,
          currency: "INR",
        },
        billingCycle: planMode === "monthly"
          ? commitMonths === 1 ? "Monthly" : commitMonths === 3 ? "Quarterly" : "Annual"
          : "One-Time",
        startDate: planMode === "onetime" ? otDate : startDate,
        addOns: addOnsForRecord,
        addonFrequencyPerMonth: planMode === "monthly" ? addonFreqPerMonth : undefined,
        vehicleCategory: activeVehicle,
      };

      const result = convertLeadWithPayment(
        {
          leadId: lead.id,
          firstName: lead.name.split(" ")[0] || lead.name,
          lastName: lead.name.split(" ").slice(1).join(" ") || "",
          email: lead.email || `${lead.mobile}@customer.com`,
          phone: lead.mobile,
          address: { line1: "", area: lead.area, city: cityInfo?.displayName || "Surat", pinCode: "" },
          vehicleDetails: {
            category: activeVehicle,
            brand: lead.vehicleDetails?.brand || "",
            color: lead.vehicleDetails?.color || "",
            registrationNumber: lead.vehicleDetails?.registrationNumber || "",
          },
          leadSource: lead.leadSource, status: "Demo Completed" as const,
        },
        { leadId: lead.id, paymentDetails, subscriptionPlan }
      );

      if (result.success) {
        toast.success("Lead Converted!", {
          description: `${frequency} — ₹${pricing.grand.toLocaleString("en-IN")} incl. GST`,
          duration: 5000,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(result.error || "Conversion failed");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setConversionError(msg);
      toast.error("Conversion Failed", { description: msg });
    } finally {
      setIsConverting(false);
      setShowConfirmation(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convert Lead — {lead.name}</DialogTitle>
            <DialogDescription>Choose plan type, fill details, confirm payment</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">

            {/* ── Plan Mode Selector ─────────────────────────────────── */}
            <Card className="p-4 border-2 border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-3">Plan Type</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "monthly", label: "Monthly", icon: "🔄", desc: "Recurring subscription" },
                  { id: "pack2",   label: "Pack of 2", icon: "📦", desc: "Valid 20 days" },
                  { id: "pack4",   label: "Pack of 4", icon: "📦", desc: "Valid 30 days" },
                  { id: "onetime", label: "One-Time", icon: "1️⃣", desc: "Specific date + time" },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setPlanMode(mode.id as PlanMode)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      planMode === mode.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-lg">{mode.icon}</div>
                    <div className="text-xs font-semibold mt-1">{mode.label}</div>
                    <div className="text-xs text-gray-500">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* ── Monthly Subscription ───────────────────────────────── */}
            {planMode === "monthly" && (
              <Card className="p-4 border-2 border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Monthly Subscription</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Plan *</Label>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLAN_OPTIONS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vehicle *</Label>
                    <Select value={vehicleCat} onValueChange={setVehicleCat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VEHICLE_OPTIONS.map(v => (
                          <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Commitment *</Label>
                    <Select value={String(commitMonths)} onValueChange={v => setCommitMonths(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMMITMENT_OPTIONS.map(c => (
                          <SelectItem key={c.months} value={String(c.months)}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Date *</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                      min={getTodayStr()} />
                  </div>
                </div>
              </Card>
            )}

            {/* ── Visit Pack ─────────────────────────────────────────── */}
            {(planMode === "pack2" || planMode === "pack4") && (
              <Card className="p-4 border-2 border-orange-200 bg-orange-50">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold">
                    Pack of {planMode === "pack2" ? 2 : 4} — Valid {PACK_VALIDITY[planMode]} days from today
                  </span>
                  <Badge className="bg-orange-600 text-white text-xs ml-auto">
                    Expires {new Date(getMaxDate(PACK_VALIDITY[planMode])).toLocaleDateString("en-IN")}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Plan *</Label>
                    <Select value={packPlan} onValueChange={setPackPlan}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLAN_OPTIONS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vehicle *</Label>
                    <Select value={packVehicle} onValueChange={setPackVehicle}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VEHICLE_OPTIONS.map(v => (
                          <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-2 text-xs text-orange-700 bg-orange-100 rounded p-2">
                  ℹ️ Add-ons apply per visit — {planMode === "pack2" ? 2 : 4} visits total
                </div>
              </Card>
            )}

            {/* ── One-Time Wash ──────────────────────────────────────── */}
            {planMode === "onetime" && (
              <Card className="p-4 border-2 border-teal-200 bg-teal-50">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-semibold">One-Time Wash — Book specific date + time</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Plan *</Label>
                    <Select value={otPlan} onValueChange={setOtPlan}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLAN_OPTIONS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vehicle *</Label>
                    <Select value={otVehicle} onValueChange={setOtVehicle}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VEHICLE_OPTIONS.map(v => (
                          <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date * (within 7 days)</Label>
                    <Input type="date" value={otDate} onChange={e => setOtDate(e.target.value)}
                      min={getTodayStr()} max={getMaxDate(7)} />
                    {otDate && new Date(otDate) > new Date(getMaxDate(7)) && (
                      <p className="text-xs text-red-500 mt-1">Must be within 7 days</p>
                    )}
                  </div>
                  <div>
                    <Label>Preferred Time *</Label>
                    <Select value={otTime} onValueChange={setOtTime}>
                      <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                      <SelectContent>
                        {["05:00","06:00","07:00","08:00","09:00","10:00","11:00",
                          "12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"].map(t => {
                          const h = parseInt(t);
                          const label = h < 12 ? `${t} AM` : h === 12 ? "12:00 PM" : `${h-12}:00 PM`;
                          return <SelectItem key={t} value={t}>{label}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {otDate && otTime && otDateValid && (
                  <div className="mt-2 text-xs text-teal-700 bg-teal-100 rounded p-2">
                    ✅ Wash scheduled: {new Date(otDate).toLocaleDateString("en-IN", {
                      weekday: "long", day: "numeric", month: "long"
                    })} at {parseInt(otTime) < 12 ? otTime + " AM" : parseInt(otTime) === 12 ? "12 PM" : `${parseInt(otTime)-12}:00 PM`}
                  </div>
                )}
              </Card>
            )}

            {/* ── Add-ons ────────────────────────────────────────────── */}
            <Card className="p-4 border-2 border-green-200 bg-green-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900">✨ Add-ons (Optional)</span>
                {planMode === "monthly" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Frequency:</span>
                    <Select value={String(addonFreqPerMonth)} onValueChange={v => setAddonFreqPerMonth(Number(v))}>
                      <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ADDON_FREQ_OPTIONS.map(f => (
                          <SelectItem key={f.value} value={String(f.value)}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {(planMode === "pack2" || planMode === "pack4") && (
                  <span className="text-xs text-gray-500">
                    Per visit × {planMode === "pack2" ? 2 : 4} visits
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ADDON_OPTIONS.map(addon => {
                  const selected = selectedAddons.includes(addon.id);
                  const visits = planMode === "monthly" ? addonFreqPerMonth
                    : planMode === "pack2" ? 2 : planMode === "pack4" ? 4 : 1;
                  const months = planMode === "monthly" ? commitMonths : 1;
                  const total = addon.price * visits * months;
                  return (
                    <div key={addon.id} onClick={() => toggleAddon(addon.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer text-sm transition-all ${
                        selected ? "border-green-400 bg-green-100" : "border-gray-200 bg-white hover:border-green-300"
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className={selected ? "font-semibold" : ""}>{addon.label}</span>
                        <input type="checkbox" checked={selected} readOnly className="ml-1" />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ₹{addon.price}/visit
                        {selected && <span className="text-green-600 font-medium ml-1">= ₹{total.toLocaleString("en-IN")} total</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* ── Price Summary ─────────────────────────────────────── */}
            <Card className="p-4 border-2 border-purple-200 bg-purple-50">
              <div className="text-sm font-semibold text-gray-900 mb-2">💰 Price Summary</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{pricing.label}</span>
                  <span>₹{pricing.base.toLocaleString("en-IN")}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Commitment discount</span>
                    <span>-₹{pricing.discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {pricing.addonTotal > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Add-ons ({pricing.addonNote})</span>
                    <span>+₹{pricing.addonTotal.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{pricing.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>GST (18%)</span>
                  <span>₹{pricing.gst.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Grand Total (incl. GST)</span>
                  <span className="text-purple-700">₹{pricing.grand.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </Card>

            {/* ── Payment ───────────────────────────────────────────── */}
            <Card className="p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-900">Payment</span>
                <Badge variant="outline" className="ml-auto text-purple-700 border-purple-400 text-xs">
                  Expected: ₹{pricing.grand.toLocaleString("en-IN")}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status *</Label>
                  <Select value={paymentStatus} onValueChange={v => setPaymentStatus(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">✅ Paid</SelectItem>
                      <SelectItem value="Failed">❌ Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Method *</Label>
                  <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Cash","UPI","Card","Net Banking","Cheque"].map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount Received (₹ incl. GST) *</Label>
                  <Input type="number" value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    placeholder={String(pricing.grand)} />
                  {paymentAmount && parseFloat(paymentAmount) < pricing.grand && (
                    <p className="text-xs text-red-500 mt-1">
                      Less than grand total ₹{pricing.grand.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Transaction ID (Optional)</Label>
                  <Input value={transactionId} onChange={e => setTransactionId(e.target.value)}
                    placeholder="UPI Ref / TXN ID" />
                </div>
              </div>
              {paymentStatus !== "Paid" && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  ⚠️ Payment must be marked as Paid before converting
                </div>
              )}
            </Card>

            {conversionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {conversionError}
              </div>
            )}

            {canConvert && (
              <div className="p-3 bg-green-50 border border-green-200 rounded flex gap-2 text-sm text-green-700">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                Ready to convert — ₹{paymentAmount} received
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConverting}>
              Cancel
            </Button>
            <Button onClick={() => setShowConfirmation(true)} disabled={!canConvert || isConverting}
              className="bg-green-600 hover:bg-green-700">
              {isConverting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                : <><CheckCircle className="w-4 h-4 mr-2" />Convert Lead</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Conversion</DialogTitle>
            <DialogDescription>This creates customer, subscription, and jobs. Cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-gray-500">Customer</p><p className="font-semibold">{lead.name}</p></div>
              <div><p className="text-gray-500">Plan Type</p><p className="font-semibold">{pricing.label}</p></div>
              <div><p className="text-gray-500">Add-ons</p><p className="font-semibold">{selectedAddons.length} selected</p></div>
              <div><p className="text-gray-500">Payment</p><p className="font-semibold text-green-600">₹{paymentAmount}</p></div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded p-3 space-y-1 text-xs">
              <div className="flex justify-between"><span>Base</span><span>₹{pricing.base.toLocaleString("en-IN")}</span></div>
              {pricing.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{pricing.discount.toLocaleString("en-IN")}</span></div>}
              {pricing.addonTotal > 0 && <div className="flex justify-between"><span>Add-ons</span><span>₹{pricing.addonTotal.toLocaleString("en-IN")}</span></div>}
              <div className="flex justify-between"><span>GST (18%)</span><span>₹{pricing.gst.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Grand Total</span><span>₹{pricing.grand.toLocaleString("en-IN")}</span></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={isConverting}>Back</Button>
            <Button onClick={handleConfirmConversion} disabled={isConverting} className="bg-green-600 hover:bg-green-700">
              {isConverting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Converting...</> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
