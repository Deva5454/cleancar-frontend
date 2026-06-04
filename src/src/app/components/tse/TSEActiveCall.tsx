/**
 * TSE Active Call Screen
 * In-call workspace with lead context, sales process guide, and pricing engine
 *
 * Layout: 3-column design
 * - Left: Lead details + call history
 * - Center: 5-step sales process guide + call timer
 * - Right: Pricing engine with EBITDA calculator
 *
 * @component
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Phone,
  PhoneOff,
  Clock,
  User,
  MapPin,
  Tag,
  CheckCircle2,
  Circle,
  AlertTriangle,
  TrendingUp,
  Link as LinkIcon,
  History,
} from "lucide-react";
import { teleSalesExecutiveService } from "../../services/teleSalesExecutiveService";
import type {
  TSELead,
  CallHistory,
  PricingCalculation,
  AddOnOption,
  BundleOption,
  SalesProcessStep,
} from "../../types/teleSalesExecutive.types";
import {
  ADD_ON_OPTIONS,
  EBITDA_FLOOR,
  SCRIPTS,
  QUICK_TAGS,
} from "../../constants/teleSalesExecutive.constants";
import { SALES_PROCESS_STEPS } from "../../types/teleSalesExecutive.types";

interface TSEActiveCallProps {
  lead: TSELead;
  onEndCall: (notes: string, tags: string[], pricingData: PricingCalculation) => void;
  onCancel: () => void;
}

export function TSEActiveCall({ lead, onEndCall, onCancel }: TSEActiveCallProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [salesSteps, setSalesSteps] = useState<SalesProcessStep[]>(
    (SALES_PROCESS_STEPS || []).map((s) => ({ ...s, completed: false }))
  );

  // Available plans from plan management system
  const availablePlans = teleSalesExecutiveService.getAvailablePlansForLead(lead) || [];
  const recommendedPlan = teleSalesExecutiveService.getRecommendedPlanForLead(lead);
  const [selectedPlan, setSelectedPlan] = useState(recommendedPlan);

  // C1+C3 FIX: clear bundle and add-ons when plan changes
  const handlePlanChange = (plan: typeof recommendedPlan) => {
    setSelectedPlan(plan);
    setSelectedBundle(undefined);
    setSelectedAddOns([]);
  };

  // Pricing state
  const [basePlanPrice, setBasePlanPrice] = useState(
    selectedPlan?.baseMonthlyPrice || lead.estimatedValue
  );
  // Multiple add-ons allowed (up to 3 per subscription)
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnOption[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<BundleOption | undefined>();
  const [pricingCalculation, setPricingCalculation] = useState<PricingCalculation>(
    teleSalesExecutiveService.calculatePricingForLead(lead)
  );

  // Call history
  const [callHistory] = useState<CallHistory[]>([]);

  // Call timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate pricing when plan, add-on, or bundle changes
  useEffect(() => {
    const currentPrice = selectedPlan?.baseMonthlyPrice || lead.estimatedValue;
    // Pass first selected add-on to pricing (service calculates primary add-on discount)
    const primaryAddOn = selectedAddOns.length > 0 ? selectedAddOns[0] : undefined;
    const newPricing = teleSalesExecutiveService.calculateFinalPricing(
      currentPrice,
      primaryAddOn,
      selectedBundle,
      selectedPlan || undefined
    );
    setPricingCalculation(newPricing);
    setBasePlanPrice(currentPrice);
  }, [lead, selectedPlan, selectedAddOns, selectedBundle]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleStep = (stepNumber: number) => {
    setSalesSteps((prev) =>
      prev.map((s) =>
        s.stepNumber === stepNumber ? { ...s, completed: !s.completed } : s
      )
    );
    setCurrentStep(stepNumber);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddOnSelect = (addOn: AddOnOption) => {
    // C6 FIX: selecting add-on clears bundle (can't have both simultaneously)
    setSelectedBundle(undefined);
    // Toggle add-on in/out of selectedAddOns array (max 3)
    setSelectedAddOns((prev) => {
      const exists = prev.some((a) => a.id === addOn.id);
      if (exists) return prev.filter((a) => a.id !== addOn.id);
      if (prev.length >= 3) return prev;
      return [...prev, addOn];
    });
  };

  const handleBundleSelect = (bundle: BundleOption) => {
    if (selectedBundle?.tier === bundle.tier) {
      setSelectedBundle(undefined);
    } else {
      setSelectedBundle(bundle);
      setSelectedAddOns([]);  // Clear all add-ons if bundle selected
    }
  };

  // Issue 8 FIX: get vehicle-aware add-on price (SUV/Luxury pay more)
  const getAddOnPrice = (addOn: AddOnOption): number => {
    const cat = lead.vehicleCategory?.toUpperCase() ?? "H";
    // Use prices object if available, otherwise fall back to perceivedValue
    const p = (addOn as any).prices;
    if (!p) return addOn.perceivedValue;
    if (cat.includes("LUXURY") || cat.includes("LUX"))    return p.Lux ?? addOn.perceivedValue;
    if (cat.includes("SUV") || cat.includes("MUV") || cat.includes("SEDAN")) return p.SUV ?? addOn.perceivedValue;
    return p.H ?? addOn.perceivedValue;
  };

  // C2 FIX: generatePaymentLink was previously just a toast with no actual call
  const generatePaymentLink = () => {
    if (!pricingCalculation.paymentLinkEnabled) return;
    const result = teleSalesExecutiveService.sendPaymentLink(
      lead.id,
      pricingCalculation.finalPrice
    );
    if (result.success) {
      toast.success(`Payment link sent! Link ID: ${result.linkId}`, {
        description: `₹${pricingCalculation.finalPrice.toLocaleString()} — valid for 24 hours. Follow up if unpaid after 12h.`,
      });
    } else {
      toast.error("Failed to send payment link. Try again.");
    }
  };

  const handleEndCall = () => {
    onEndCall(notes, selectedTags, pricingCalculation);
  };

  const getEBITDAColor = (ebitda: number) => {
    if (ebitda >= EBITDA_FLOOR.SAFE_PERCENT) return "text-green-700";
    if (ebitda >= EBITDA_FLOOR.WARNING_PERCENT) return "text-yellow-700";
    return "text-red-700";
  };

  const getEBITDABgColor = (ebitda: number) => {
    if (ebitda >= EBITDA_FLOOR.SAFE_PERCENT) return "bg-green-50";
    if (ebitda >= EBITDA_FLOOR.WARNING_PERCENT) return "bg-yellow-50";
    return "bg-red-50";
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header - Call Timer */}
      <Card className="p-4 bg-blue-50 border-blue-300">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <Phone className="w-5 h-5 text-blue-700" />
            <div>
              <div className="font-semibold text-gray-900">Call in Progress</div>
              <div className="text-sm text-gray-600">
                {lead.customerName} - {lead.phone}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-2xl font-mono font-bold text-gray-900">
                {formatDuration(callDuration)}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEndCall}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content - 3 Columns */}
      <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* LEFT COLUMN - Lead Details */}
        <div className="col-span-3 space-y-4 overflow-y-auto">
          <Card className="p-4">
            <div className="text-sm font-semibold text-gray-900 mb-3">
              Lead Details
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-gray-600">Customer</div>
                  <div className="font-medium text-gray-900">{lead.customerName}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-gray-600">Phone</div>
                  <div className="font-medium text-gray-900">{lead.phone}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-gray-600">Vehicle</div>
                  <div className="font-medium text-gray-900">
                    {lead.vehicleCategory || lead.vehicleType}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-gray-600">Source</div>
                  <Badge variant="outline">{lead.source}</Badge>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <History className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-gray-600">Attempts</div>
                  <div className="font-medium text-gray-900">
                    {lead.attemptCount}/15
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Call History */}
          <Card className="p-4">
            <div className="text-sm font-semibold text-gray-900 mb-3">
              Call History
            </div>
            {callHistory.length === 0 ? (
              <div className="text-sm text-gray-500">No previous calls</div>
            ) : (
              <div className="space-y-2">
                {callHistory.map((call) => (
                  <div
                    key={call.id}
                    className="text-xs p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{call.outcome}</span>
                      <span className="text-gray-600">
                        {Math.floor(call.duration / 60)}m {call.duration % 60}s
                      </span>
                    </div>
                    {call.notes && (
                      <div className="text-gray-600 mt-1">{call.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* CENTER COLUMN - Sales Process */}
        <div className="col-span-5 space-y-4 overflow-y-auto">
          <Card className="p-4">
            <div className="text-sm font-semibold text-gray-900 mb-4">
              5-Step Sales Process
            </div>
            <div className="space-y-3">
              {salesSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    currentStep === step.stepNumber
                      ? "border-blue-500 bg-blue-50"
                      : step.completed
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 bg-white"
                  }`}
                  onClick={() => toggleStep(step.stepNumber)}
                >
                  <div className="flex items-start gap-3">
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        Step {step.stepNumber}: {step.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {step.description}
                      </div>
                      {currentStep === step.stepNumber && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 italic border-l-2 border-blue-500">
                          <strong>Script:</strong> {step.scriptSuggestion}
                        </div>
                      )}
                      <div className="text-xs text-orange-700 mt-1 font-medium">
                        ⚠️ {step.keyRule}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes Section */}
          <Card className="p-4">
            <div className="text-sm font-semibold text-gray-900 mb-3">
              Call Notes
            </div>
            <Textarea
              placeholder="Enter call notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mb-3"
            />
            <div className="text-xs text-gray-600 mb-2">Quick Tags:</div>
            <div className="flex flex-wrap gap-2">
              {(QUICK_TAGS || []).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN - Pricing Engine */}
        <div className="col-span-4 space-y-4 overflow-y-auto">
          {/* Plan Selection - From Plan Management System */}
          {availablePlans.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                📋 Available Plans (From Plan Management)
              </div>
              <div className="text-xs text-gray-600 mb-3">
                Select which plan to offer this customer
              </div>
              <div className="space-y-2">
                {availablePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedPlan?.id === plan.id
                        ? "border-blue-600 bg-white shadow-md"
                        : "border-gray-300 bg-white hover:border-blue-400"
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm">
                          {plan.displayName}
                          {selectedPlan?.id === plan.id && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 inline ml-2" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {plan.washesPerMonth} washes/month
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ₹{plan.baseMonthlyPrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹{Math.round(plan.baseMonthlyPrice / 26)}/wash
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-white rounded text-xs text-gray-700">
                💡 <strong>Tip:</strong> Start with highest-value plan, demonstrate value
                first
              </div>
            </Card>
          )}

          {/* C3 FIX: Plan selector — TSE was locked to recommended plan with no way to change */}
          {availablePlans.length > 1 && (
            <Card className="p-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">Select Plan</div>
              <div className="flex flex-col gap-1">
                {availablePlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handlePlanChange(plan)}
                    className={`px-3 py-2 rounded-lg border-2 cursor-pointer text-sm transition-colors ${
                      selectedPlan?.id === plan.id
                        ? "border-blue-500 bg-blue-50 font-semibold"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>{plan.displayName ?? plan.tierName}</span>
                      <span className="font-bold">₹{plan.baseMonthlyPrice.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Selected Plan Display */}
          <Card className="p-4">
            <div className="text-sm font-semibold text-gray-900 mb-3">
              Selected Package
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-300">
              <div className="text-2xl font-bold text-gray-900">
                ₹{pricingCalculation.basePlan.monthlyPrice.toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {pricingCalculation.basePlan.name}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                ₹{pricingCalculation.basePlan.costPerWash} per wash ×{" "}
                {pricingCalculation.basePlan.washesPerMonth} washes/month
              </div>
            </div>
            {selectedAddOns.length > 0 && (
              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                <div className="text-xs font-semibold text-green-800 mb-1">
                  Add-Ons Selected ({selectedAddOns.length}):
                </div>
                {selectedAddOns.map((a) => (
                  <div key={a.id} className="flex justify-between text-xs text-green-700">
                    <span>{a.name}</span>
  <span>+₹{getAddOnPrice(a)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold text-green-900 mt-1 border-t border-green-200 pt-1">
                  <span>Total with Add-Ons</span>
                  <span>₹{(pricingCalculation.basePlan.monthlyPrice + selectedAddOns.reduce((s, a) => s + getAddOnPrice(a), 0)).toLocaleString()}  /* Issue 8+9 FIX */</span>
                </div>
              </div>
            )}
            <div className="text-xs text-gray-600 mt-2 italic">
              {/* C7 FIX: dynamic script with real values instead of unsubstituted placeholders */}
              💡 &ldquo;For your {lead.vehicleCategory?.toLowerCase() ?? "vehicle"}, our{" "}
              {pricingCalculation.basePlan.name} is{" "}
              ₹{pricingCalculation.basePlan.monthlyPrice.toLocaleString()}/month — that&apos;s{" "}
              ₹{pricingCalculation.basePlan.costPerWash}/wash, {pricingCalculation.basePlan.washesPerMonth} washes/month.&rdquo;
            </div>
          </Card>

          {/* Add-On Options */}
          <Card className="p-4">
            <div className="text-sm font-semibold text-gray-900 mb-2">
              Add-On Options
            </div>
            <div className="text-xs text-green-700 mb-3 font-medium">
              ✅ Select up to 3 add-ons per subscription ({selectedAddOns.length}/3 selected)
            </div>
            <div className="space-y-2">
              {(ADD_ON_OPTIONS || []).map((addOn) => (
                <div
                  key={addOn.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedAddOns.some((a) => a.id === addOn.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() => handleAddOnSelect(addOn)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {addOn.name}
                      </div>
                      <div className="text-xs text-gray-600">{addOn.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {/* Issue 8 FIX: vehicle-aware price */}
                        ₹{getAddOnPrice(addOn)}
                      </div>
                      {selectedAddOns.some((a) => a.id === addOn.id) && (
                        <Badge className="bg-blue-600 text-xs">ADDED</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Margin: {addOn.marginPercent}%
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-600 mt-2 italic">
              💡 {SCRIPTS.ADD_ON_OFFER}
            </div>
          </Card>

          {/* Bundle Builder — Issue 9 NOTE: bundle price = plan price × discount.
               Add-ons are shown separately above and added to final total. */}
          {/* Bundle Builder */}
          <Card className="p-4">
            <div className="text-sm font-semibold text-gray-900 mb-3">
              Bundle Builder
            </div>
            {(teleSalesExecutiveService
              .calculateBundleOptions(lead.vehicleCategory || "SEDAN", basePlanPrice) || []
              ).map((bundle) => (
                <div
                  key={bundle.tier}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors mb-2 ${
                    selectedBundle?.tier === bundle.tier
                      ? "border-blue-500 bg-blue-50"
                      : bundle.ebitdaStatus === "BLOCKED"
                      ? "border-red-300 bg-red-50 opacity-50 cursor-not-allowed"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() =>
                    bundle.ebitdaStatus !== "BLOCKED" && handleBundleSelect(bundle)
                  }
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {bundle.label}{" "}
                        {bundle.tier === "MID" && <span className="text-yellow-500">⭐</span>}
                        {bundle.tier === "LOW" && <span className="text-red-500">⚠️</span>}
                      </div>
                      <div className="text-xs text-gray-600">{bundle.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ₹{bundle.price.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 line-through">
                        ₹{bundle.normalPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-700">Save ₹{bundle.savings}</span>
                    <span className="text-gray-600">
                      Incentive: {bundle.incentiveMultiplier}%
                    </span>
                  </div>
                  {bundle.ebitdaStatus === "BLOCKED" && (
                    <div className="mt-2 text-xs text-red-700 font-medium">
                      🔴 EBITDA below 30% floor - BLOCKED
                    </div>
                  )}
                </div>
              ))}
          </Card>

          {/* Final Pricing & EBITDA */}
          <Card className={`p-4 ${getEBITDABgColor(pricingCalculation.finalEBITDA)}`}>
            <div className="text-sm font-semibold text-gray-900 mb-3">
              Final Pricing
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Final Price:</span>
                <span className="text-2xl font-bold text-gray-900">
                  ₹{pricingCalculation.finalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">EBITDA:</span>
                <div className="flex items-center gap-2">
                  <TrendingUp
                    className={`w-4 h-4 ${getEBITDAColor(
                      pricingCalculation.finalEBITDA
                    )}`}
                  />
                  <span
                    className={`text-xl font-bold ${getEBITDAColor(
                      pricingCalculation.finalEBITDA
                    )}`}
                  >
                    {pricingCalculation.finalEBITDA.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Deal Type:</span>
                <Badge>{pricingCalculation.dealType}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Your Multiplier:</span>
                <span className="font-semibold text-gray-900">
                  {pricingCalculation.incentiveMultiplier}%
                </span>
              </div>
            </div>

            {pricingCalculation.finalEBITDA < EBITDA_FLOOR.MINIMUM_PERCENT && (
              <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                EBITDA below 30% floor. Payment link blocked.
              </div>
            )}

            <Button
              className="w-full mt-4 gap-2"
              disabled={!pricingCalculation.paymentLinkEnabled}
              onClick={generatePaymentLink}
            >
              <LinkIcon className="w-4 h-4" />
              Generate Payment Link
            </Button>

            {pricingCalculation.paymentLinkEnabled && (
              <div className="text-xs text-gray-600 mt-2 italic">
                💡 {SCRIPTS.PAYMENT_LINK}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
