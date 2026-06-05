import { incentiveStructureService } from "../../services/incentiveStructureService";
/**
 * LeadConversionModal - Payment-driven lead conversion
 * Fixed: correct plan IDs (SHINE/PROTECT/ELITE), commitment months,
 *        GST calculation, add-ons with frequency, live prices from planSyncService
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, AlertCircle, Loader2, DollarSign, CreditCard } from "lucide-react";
import { type PaymentDetails, type SubscriptionPlan } from "../../services/leadConversionService";
import { useBusinessFlows } from "../../contexts/AppProvider";
import { useCity } from "../../contexts/CityContext";
import { toast } from "sonner";
import { planSyncService } from "../../services/planSyncService";

interface Lead {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  area: string;
  carType: string;
  leadSource: string;
  status: string;
  notes?: string;
  vehicleCategory?: string;
  vehicleDetails?: { brand?: string; color?: string; registrationNumber?: string };
  planOfInterest?: string;
}

interface LeadConversionModalProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ─── Plan definitions — read live from planSyncService ────────────────────────
const PLAN_OPTIONS = [
  { value: "SHINE",   label: "Express Wash",  buyId: "water"   },
  { value: "PROTECT", label: "Smart Wash",    buyId: "shampoo" },
  { value: "ELITE",   label: "Elite Wash",    buyId: "wax"     },
];

const COMMITMENT_OPTIONS = [
  { months: 1,  label: "1 Month (No lock-in)",  discountPct: 0  },
  { months: 3,  label: "3 Months (5% off)",      discountPct: 5  },
  { months: 6,  label: "6 Months (10% off)",     discountPct: 10 },
  { months: 12, label: "12 Months (18% off)",    discountPct: 18 },
];

const VEHICLE_OPTIONS = [
  { value: "hatchback", label: "Hatchback" },
  { value: "suv",       label: "SUV / Sedan" },
  { value: "luxury",    label: "Luxury SUV" },
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
  { value: 1, label: "1×/month" },
  { value: 2, label: "2×/month" },
  { value: 4, label: "4×/month (recommended)" },
  { value: 8, label: "8×/month" },
];

// ─── Helper: get live plan price from planSyncService ─────────────────────────
function getLivePlanPrice(tierId: string, vehicleCat: string): number {
  try {
    const plans = planSyncService.getAllPlanPrices();
    const plan = plans.find(p => p.tierId === tierId);
    if (!plan) return 0;
    if (vehicleCat === "suv") return plan.suv;
    if (vehicleCat === "luxury") return plan.luxury;
    return plan.hatchback;
  } catch {
    // Fallback prices if planSyncService unavailable
    const fallback: Record<string, Record<string, number>> = {
      SHINE:   { hatchback: 1249, suv: 1499, luxury: 1999 },
      PROTECT: { hatchback: 1599, suv: 1999, luxury: 2699 },
      ELITE:   { hatchback: 1999, suv: 2499, luxury: 3499 },
    };
    return fallback[tierId]?.[vehicleCat] ?? 1599;
  }
}

export function LeadConversionModal({ lead, open, onOpenChange, onSuccess }: LeadConversionModalProps) {
  const { convertLeadWithPayment } = useBusinessFlows();
  const { cityInfo } = useCity();

  // ── Detect vehicle category from lead ──────────────────────────────────────
  const detectVehicleCat = (): string => {
    const cat = (lead?.vehicleCategory || lead?.carType || "").toLowerCase();
    if (cat.includes("luxury") || cat.includes("fortuner") || cat.includes("xuv700")) return "luxury";
    if (cat.includes("suv") || cat.includes("sedan") || cat.includes("muv")) return "suv";
    return "hatchback";
  };

  // ── Form state ──────────────────────────────────────────────────────────────
  const [paymentStatus, setPaymentStatus] = useState<"Pending" | "Paid" | "Failed">("Pending");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card" | "Net Banking" | "Cheque">("UPI");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");

  const [selectedPlan, setSelectedPlan] = useState<string>("PROTECT");
  const [vehicleCat, setVehicleCat] = useState<string>(detectVehicleCat());
  const [commitMonths, setCommitMonths] = useState<number>(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  // Add-ons
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [addonFreqPerMonth, setAddonFreqPerMonth] = useState<number>(4);

  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ── Price calculations ──────────────────────────────────────────────────────
  const monthlyPrice = getLivePlanPrice(selectedPlan, vehicleCat);
  const commitment = COMMITMENT_OPTIONS.find(c => c.months === commitMonths) || COMMITMENT_OPTIONS[1];
  const baseTotal = monthlyPrice * commitMonths;
  const commitDiscount = Math.round(baseTotal * commitment.discountPct / 100);

  // Add-on total
  const addonMonthlyTotal = selectedAddons.reduce((sum, id) => {
    const addon = ADDON_OPTIONS.find(a => a.id === id);
    return sum + (addon?.price || 0);
  }, 0);
  const addonGrandTotal = addonMonthlyTotal * addonFreqPerMonth * commitMonths;

  const subtotalBeforeGST = baseTotal - commitDiscount + addonGrandTotal;
  const gstAmount = Math.round(subtotalBeforeGST * 0.18);
  const grandTotal = subtotalBeforeGST + gstAmount;

  // ── Validation ──────────────────────────────────────────────────────────────
  const isPaymentValid = paymentStatus === "Paid" && parseFloat(paymentAmount) >= grandTotal;
  const isSubscriptionValid = selectedPlan && vehicleCat && commitMonths && startDate;
  const canConvert = isPaymentValid && isSubscriptionValid;

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleConfirmConversion = async () => {
    setIsConverting(true);
    setConversionError(null);

    try {
      const paymentDetails: PaymentDetails = {
        paymentMethod,
        transactionId: transactionId || undefined,
        amount: parseFloat(paymentAmount),
        paymentDate,
        status: paymentStatus,
        notes: paymentNotes || undefined,
      };

      const billingCycle = commitMonths === 1 ? "Monthly"
        : commitMonths === 3 ? "Quarterly"
        : commitMonths === 12 ? "Annual"
        : "Monthly";

      const addOnsForRecord = selectedAddons.map(id => {
        const addon = ADDON_OPTIONS.find(a => a.id === id);
        return {
          name: addon?.label || id,
          price: addon?.price || 0,
          frequency: `${addonFreqPerMonth}x/month`,
          totalForPeriod: (addon?.price || 0) * addonFreqPerMonth * commitMonths,
        };
      });

      const subscriptionPlan: SubscriptionPlan = {
        packageType: selectedPlan,           // ← SHINE / PROTECT / ELITE
        packageName: PLAN_OPTIONS.find(p => p.value === selectedPlan)?.label || selectedPlan,
        frequency: "Daily",                  // ← Always daily wash
        commitmentMonths: commitMonths,
        pricing: {
          basePrice: baseTotal,
          discount: commitDiscount,
          addonTotal: addonGrandTotal,
          subtotal: subtotalBeforeGST,
          gst: gstAmount,
          finalPrice: grandTotal,
          currency: "INR",
        },
        billingCycle,
        startDate,
        addOns: addOnsForRecord,
        addonFrequencyPerMonth: addonFreqPerMonth,
        vehicleCategory: vehicleCat,
      };

      const leadData = {
        leadId: lead.id,
        firstName: lead.name.split(" ")[0] || lead.name,
        lastName: lead.name.split(" ").slice(1).join(" ") || "",
        email: lead.email || `${lead.mobile}@customer.com`,
        phone: lead.mobile,
        address: {
          line1: "",
          area: lead.area,
          city: cityInfo?.displayName || "Surat",
          pinCode: "",
        },
        vehicleDetails: {
          category: vehicleCat,
          brand: lead.vehicleDetails?.brand || "",
          color: lead.vehicleDetails?.color || "",
          registrationNumber: lead.vehicleDetails?.registrationNumber || "",
        },
        leadSource: lead.leadSource,
        status: "Demo Completed" as const,
      };

      const result = convertLeadWithPayment(leadData, {
        leadId: lead.id,
        paymentDetails,
        subscriptionPlan,
      });

      if (result.success) {
        toast.success("Lead Converted Successfully!", {
          description: `Customer created with ${result.jobsGenerated?.length || 0} jobs scheduled`,
          duration: 5000,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(result.error || "Conversion failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setConversionError(errorMessage);
      toast.error("Conversion Failed", { description: errorMessage, duration: 6000 });
    } finally {
      setIsConverting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convert Lead to Customer</DialogTitle>
            <DialogDescription>
              Complete payment and subscription details to convert {lead.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Vehicle Details Warning */}
            {!lead.vehicleDetails?.registrationNumber && (
              <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                ⚠️ Vehicle registration not captured. The washer will not have vehicle identification.
              </div>
            )}

            {/* ── Subscription Plan ─────────────────────────────────────── */}
            <Card className="p-4 border-2 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Subscription Details</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Plan *</Label>
                    <Select value={selectedPlan} onValueChange={v => setSelectedPlan(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLAN_OPTIONS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vehicle Type *</Label>
                    <Select value={vehicleCat} onValueChange={v => setVehicleCat(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VEHICLE_OPTIONS.map(v => (
                          <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Commitment Period *</Label>
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
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-white rounded-lg border p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plan ({commitMonths} mo × ₹{monthlyPrice}/mo)</span>
                    <span>₹{baseTotal.toLocaleString("en-IN")}</span>
                  </div>
                  {commitDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Commitment discount ({commitment.discountPct}%)</span>
                      <span>-₹{commitDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {addonGrandTotal > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Add-ons ({addonFreqPerMonth}×/mo × {commitMonths} mo)</span>
                      <span>+₹{addonGrandTotal.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-gray-500">Subtotal</span>
                    <span>₹{subtotalBeforeGST.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>GST (18%)</span>
                    <span>₹{gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-1">
                    <span>Grand Total (incl. GST)</span>
                    <span className="text-purple-700">₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* ── Add-ons ───────────────────────────────────────────────── */}
            <Card className="p-4 border-2 border-orange-200 bg-orange-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">✨ Add-ons (Optional)</h3>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Frequency:</Label>
                  <Select value={String(addonFreqPerMonth)} onValueChange={v => setAddonFreqPerMonth(Number(v))}>
                    <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ADDON_FREQ_OPTIONS.map(f => (
                        <SelectItem key={f.value} value={String(f.value)}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ADDON_OPTIONS.map(addon => {
                  const selected = selectedAddons.includes(addon.id);
                  const addonTotal = addon.price * addonFreqPerMonth * commitMonths;
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer text-sm transition-all ${selected ? "border-orange-400 bg-orange-100" : "border-gray-200 bg-white hover:border-orange-300"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={selected ? "font-semibold" : ""}>{addon.label}</span>
                        <input type="checkbox" checked={selected} readOnly className="ml-1" />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ₹{addon.price}/visit
                        {selected && <span className="text-orange-600 font-medium ml-1">= ₹{addonTotal.toLocaleString("en-IN")} total</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* ── Payment ───────────────────────────────────────────────── */}
            <Card className="p-4 border-2 border-purple-200 bg-purple-50">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Payment Details (Required)</h3>
                <Badge variant="outline" className="ml-auto text-purple-700 border-purple-400">
                  Expected: ₹{grandTotal.toLocaleString("en-IN")} incl. GST
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Payment Status *</Label>
                    <Select value={paymentStatus} onValueChange={v => setPaymentStatus(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Net Banking">Net Banking</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Amount Received (₹ incl. GST) *</Label>
                    <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder={String(grandTotal)} />
                    {paymentAmount && parseFloat(paymentAmount) < grandTotal && (
                      <p className="text-xs text-red-500 mt-1">Amount is less than grand total ₹{grandTotal.toLocaleString("en-IN")}</p>
                    )}
                  </div>
                  <div>
                    <Label>Payment Date *</Label>
                    <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Transaction ID (Optional)</Label>
                  <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="TXN123456" />
                </div>

                {paymentStatus !== "Paid" && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">Payment Required</p>
                      <p className="text-xs text-red-700">Payment status must be "Paid" before conversion</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* ── Status ───────────────────────────────────────────────── */}
            {conversionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Conversion Error</p>
                  <p className="text-xs text-red-700">{conversionError}</p>
                  <p className="text-xs text-red-600 mt-1">No data was saved. Lead remains unchanged.</p>
                </div>
              </div>
            )}

            {canConvert && (
              <div className="p-3 bg-green-50 border border-green-200 rounded flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Ready to Convert</p>
                  <p className="text-xs text-green-700">All details complete. Payment of ₹{paymentAmount} verified.</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConverting}>Cancel</Button>
            <Button onClick={() => setShowConfirmation(true)} disabled={!canConvert || isConverting} className="bg-green-600 hover:bg-green-700">
              {isConverting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : <><CheckCircle className="w-4 h-4 mr-2" />Convert Lead</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Lead Conversion</DialogTitle>
            <DialogDescription>This will create customer, subscription, and jobs. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">Customer</p><p className="font-semibold">{lead.name}</p></div>
              <div><p className="text-gray-500">Plan</p><p className="font-semibold">{PLAN_OPTIONS.find(p => p.value === selectedPlan)?.label}</p></div>
              <div><p className="text-gray-500">Vehicle</p><p className="font-semibold capitalize">{vehicleCat}</p></div>
              <div><p className="text-gray-500">Commitment</p><p className="font-semibold">{commitMonths} months</p></div>
              <div><p className="text-gray-500">Add-ons</p><p className="font-semibold">{selectedAddons.length} selected</p></div>
              <div><p className="text-gray-500">Payment</p><p className="font-semibold text-green-600">₹{paymentAmount}</p></div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs space-y-1">
              <div className="flex justify-between"><span>Base ({commitMonths} mo)</span><span>₹{baseTotal.toLocaleString("en-IN")}</span></div>
              {commitDiscount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({commitment.discountPct}%)</span><span>-₹{commitDiscount.toLocaleString("en-IN")}</span></div>}
              {addonGrandTotal > 0 && <div className="flex justify-between"><span>Add-ons</span><span>₹{addonGrandTotal.toLocaleString("en-IN")}</span></div>}
              <div className="flex justify-between"><span>GST (18%)</span><span>₹{gstAmount.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Grand Total</span><span>₹{grandTotal.toLocaleString("en-IN")}</span></div>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={isConverting}>Cancel</Button>
            <Button onClick={handleConfirmConversion} disabled={isConverting} className="bg-green-600 hover:bg-green-700">
              {isConverting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Converting...</> : "Confirm Conversion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
