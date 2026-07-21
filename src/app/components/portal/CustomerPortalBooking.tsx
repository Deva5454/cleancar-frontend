/**
 * CustomerPortalBooking — real booking flow.
 * Every package and price shown here comes from the same real pricing
 * data (subscriptionPlans.ts) the business side already manages —
 * CURRENT_PLAN_VERSION.pricingMatrix and .deliverables — not separate,
 * hardcoded numbers that could drift from what's actually charged.
 * Confirming creates a real Job via the same real createJob() function
 * used everywhere else in the app.
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../../contexts/CustomerContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import { useJobs } from "../../contexts/JobContext";
import { useCustomerPortalAuth } from "./CustomerPortalAuthContext";
import {
  PLAN_TYPES,
  PLAN_TIER_NAMES,
  getSubscriptionPrice,
  CURRENT_PLAN_VERSION,
  ADD_ON_SERVICES,
  getAddonPrice,
  VEHICLE_CATEGORIES,
  type VehicleCategory,
  type PlanType,
} from "../../data/subscriptionPlans";
import { detectVehicleCategory } from "./carModelLookup";
import { planSyncService } from "../../services/planSyncService";
import { ChevronLeft, Check, Car } from "lucide-react";
import { toast } from "sonner";

const TIME_SLOTS = ["6:00 AM - 8:00 AM", "8:00 AM - 10:00 AM", "4:00 PM - 6:00 PM", "6:00 PM - 8:00 PM"];

export function CustomerPortalBooking() {
  const { loggedInCustomerId } = useCustomerPortalAuth();
  const { customers, updateCustomer } = useCustomers();
  const { getSubscriptionsByCustomerId } = useCustomerSubscriptions();
  const { createJob } = useJobs();
  const navigate = useNavigate();

  const customer = useMemo(
    () => customers.find((c: any) => c.customerId === loggedInCustomerId),
    [customers, loggedInCustomerId]
  );

  // Real saved vehicles - uses the real savedVehicles list if the
  // customer has one, otherwise falls back to their single legacy
  // vehicleDetails so existing customers still get a real prefill
  // instead of an empty list.
  const savedVehicleList = useMemo(() => {
    if (!customer) return [];
    if (customer.savedVehicles && customer.savedVehicles.length > 0) return customer.savedVehicles;
    if (customer.vehicleDetails) {
      return [{ id: "legacy", ...customer.vehicleDetails }];
    }
    return [];
  }, [customer]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  const [step, setStep] = useState(1);
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory | "">("");
  const [modelInput, setModelInput] = useState("");
  const [plan, setPlan] = useState<PlanType | "">("");
  const [regNumber, setRegNumber] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isNewVehicle, setIsNewVehicle] = useState(savedVehicleList.length === 0);
  // Real service address for this booking - defaults to the saved
  // profile address, but editable per-booking without changing the
  // customer's saved profile.
  const [serviceAddressLine1, setServiceAddressLine1] = useState(customer?.address?.line1 || "");
  const [serviceArea, setServiceArea] = useState(customer?.address?.area || "");
  const [servicePinCode, setServicePinCode] = useState(customer?.address?.pinCode || "");
  const [editingAddress, setEditingAddress] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<{ code: string; discount: number; kind: "coupon" | "referral" } | null>(null);
  const [vehicleQueue, setVehicleQueue] = useState<Array<{
    vehicleCategory: VehicleCategory; modelInput: string; plan: PlanType;
    regNumber: string; vehicleBrand: string; vehicleColor: string; selectedAddons: string[];
  }>>([]);

  const selectSavedVehicle = (v: { id: string; category: string; brand: string; color: string; registrationNumber: string }) => {
    setSelectedVehicleId(v.id);
    setIsNewVehicle(false);
    // The category on file might be real (from a booking made through
    // this same picker) or legacy free-text (e.g. "Sedan" from an older
    // part of the app, not one of the real pricing categories). Only
    // trust it directly if it's a real, valid category; otherwise fall
    // back to detecting it from the brand name, the same real detection
    // used for a brand-new vehicle.
    const validCategory = VEHICLE_CATEGORIES.includes(v.category as VehicleCategory)
      ? (v.category as VehicleCategory)
      : (detectVehicleCategory(v.brand) || "");
    setVehicleCategory(validCategory);
    setVehicleBrand(v.brand);
    setVehicleColor(v.color);
    setRegNumber(v.registrationNumber);
    setModelInput(v.brand);
    setPlan("");
    if (!validCategory) {
      toast.error("We couldn't confirm this vehicle's category — please re-check the model below.");
    }
  };

  const startNewVehicle = () => {
    setSelectedVehicleId("");
    setIsNewVehicle(true);
    setVehicleCategory(""); setVehicleBrand(""); setVehicleColor(""); setRegNumber(""); setModelInput(""); setPlan("");
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };
  const addonsTotal = vehicleCategory
    ? selectedAddons.reduce((sum, id) => {
        const price = getAddonPrice(id, vehicleCategory);
        return sum + (typeof price === "number" ? price : 0);
      }, 0)
    : 0;

  const priceForSelected = vehicleCategory && plan ? getSubscriptionPrice(vehicleCategory, plan) : null;

  const priceForVehicle = (category: VehicleCategory, planType: PlanType, addons: string[]) => {
    const base = getSubscriptionPrice(category, planType);
    const baseNum = typeof base === "number" ? base : 0;
    const addonsSum = addons.reduce((sum, id) => {
      const p = getAddonPrice(id, category);
      return sum + (typeof p === "number" ? p : 0);
    }, 0);
    return baseNum + addonsSum;
  };

  const grandTotal =
    vehicleQueue.reduce((sum, v) => sum + priceForVehicle(v.vehicleCategory, v.plan, v.selectedAddons), 0) +
    (vehicleCategory && plan ? priceForVehicle(vehicleCategory, plan, selectedAddons) : 0);

  const finalTotal = appliedCode ? Math.max(0, grandTotal - appliedCode.discount) : grandTotal;

  const applyCode = () => {
    const code = codeInput.trim();
    if (!code) return;
    const today = new Date().toISOString().split("T")[0];

    // Try a real coupon first
    const coupon = planSyncService.getCoupons().find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (coupon) {
      if (!coupon.active) { toast.error("This coupon is no longer active"); return; }
      if (coupon.validFrom > today || coupon.validTo < today) { toast.error("This coupon has expired"); return; }
      if (coupon.usedCount >= coupon.maxUses) { toast.error("This coupon has reached its usage limit"); return; }
      if (grandTotal < coupon.minOrderValue) { toast.error(`This coupon needs a minimum order of ₹${coupon.minOrderValue}`); return; }
      const discount = coupon.type === "percent" ? Math.round(grandTotal * coupon.value / 100) : coupon.value;
      setAppliedCode({ code: coupon.code, discount, kind: "coupon" });
      toast.success(`Coupon applied — ₹${discount} off`);
      return;
    }

    // Try a real referral code
    const referral = planSyncService.validateReferralCode(code, grandTotal);
    if (referral.valid) {
      setAppliedCode({ code, discount: referral.discount, kind: "referral" });
      toast.success(`Referral code applied — ₹${referral.discount} off`);
      return;
    }

    toast.error(referral.error || "This code isn't valid or has already been used");
  };

  const resetVehicleFields = () => {
    setModelInput(""); setVehicleCategory(""); setPlan(""); setSelectedAddons([]);
    setRegNumber(""); setVehicleBrand(""); setVehicleColor("");
    setSelectedVehicleId(""); setIsNewVehicle(savedVehicleList.length === 0);
  };

  const addAnotherVehicle = () => {
    if (!vehicleCategory || !plan || !regNumber || !vehicleBrand) return;
    setVehicleQueue((prev) => [...prev, { vehicleCategory, modelInput, plan, regNumber, vehicleBrand, vehicleColor, selectedAddons }]);
    resetVehicleFields();
    setStep(1);
    toast.success("Vehicle added — configure the next one.");
  };

  const removeQueuedVehicle = (index: number) => {
    setVehicleQueue((prev) => prev.filter((_, i) => i !== index));
  };

  if (!loggedInCustomerId || !customer) {
    navigate("/portal/login");
    return null;
  }

  const handleConfirm = () => {
    if (!vehicleCategory || !plan || !regNumber || !vehicleBrand) {
      toast.error("Please complete all vehicle details before confirming");
      return;
    }
    setSubmitting(true);

    const allVehicles = [
      ...vehicleQueue,
      { vehicleCategory, modelInput, plan, regNumber, vehicleBrand, vehicleColor, selectedAddons },
    ];

    // Find a real active subscription with a matching plan type, to link
    // this job to it for real wash-count tracking. A booking that
    // doesn't match any active subscription's plan is a real standalone
    // booking, correctly left unlinked.
    const activeSubs = customer ? getSubscriptionsByCustomerId(customer.customerId).filter((s: any) => s.status === "Active") : [];

    // Distribute the applied discount proportionally across vehicles, by
    // each vehicle's real share of the pre-discount total - so a
    // multi-vehicle booking with one code applied still shows an honest,
    // itemized discount per job, not the whole discount dumped on one.
    const preDiscountTotal = allVehicles.reduce((sum, v) => sum + priceForVehicle(v.vehicleCategory, v.plan, v.selectedAddons), 0);

    allVehicles.forEach((v) => {
      const vehiclePrice = priceForVehicle(v.vehicleCategory, v.plan, v.selectedAddons);
      const vehicleDiscount = appliedCode && preDiscountTotal > 0
        ? Math.round((vehiclePrice / preDiscountTotal) * appliedCode.discount)
        : 0;
      const matchingSub = activeSubs.find((s: any) => s.packageType === v.plan);

      createJob({
        customerId: customer.customerId,
        subscriptionId: matchingSub?.subscriptionId,
        scheduledDate,
        timeSlot,
        status: "Unassigned",
        jobType: "Regular",
        paymentStatus: "Pending",
        packageName: `${PLAN_TIER_NAMES[v.plan] || v.plan}`,
        packageType: v.plan,
        discountCode: appliedCode?.code,
        discountAmount: vehicleDiscount || undefined,
        finalAmount: vehiclePrice - vehicleDiscount,
        vehicleDetails: {
          category: v.vehicleCategory,
          color: v.vehicleColor,
          brand: v.vehicleBrand,
          registration: v.regNumber,
        },
        location: {
          addressLine1: serviceAddressLine1,
          area: serviceArea,
          city: customer.address?.city || "",
          pinCode: servicePinCode,
        },
        serviceDetails: {
          addons: v.selectedAddons.map((id) => {
            const addon = ADD_ON_SERVICES.find((a) => a.id === id);
            const price = getAddonPrice(id, v.vehicleCategory);
            return { id, name: addon?.name || id, price: typeof price === "number" ? price : 0 };
          }),
        },
      } as any);
    });

    // Save any genuinely new vehicle used in this booking to the
    // customer's real saved vehicles list, so it's available to pick
    // from directly next time, instead of retyping it again.
    const alreadySaved = new Set(savedVehicleList.map((v: any) => v.registrationNumber));
    const newVehiclesToSave = allVehicles
      .filter((v) => !alreadySaved.has(v.regNumber))
      .map((v) => ({
        id: `VEH-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        category: v.vehicleCategory,
        brand: v.vehicleBrand,
        color: v.vehicleColor,
        registrationNumber: v.regNumber,
      }));
    if (newVehiclesToSave.length > 0) {
      updateCustomer(customer.customerId, {
        savedVehicles: [...savedVehicleList, ...newVehiclesToSave],
      });
    }

    // Actually redeem the code that was applied - a coupon's usage count
    // genuinely increments, or a referral genuinely converts, using the
    // real functions the business side's own systems already rely on.
    if (appliedCode) {
      if (appliedCode.kind === "coupon") {
        planSyncService.redeemCoupon(appliedCode.code);
      } else {
        planSyncService.convertReferral(appliedCode.code, customer.customerId, `${customer.firstName} ${customer.lastName}`, grandTotal);
      }
    }

    setTimeout(() => {
      toast.success(
        allVehicles.length > 1
          ? `${allVehicles.length} bookings confirmed! You'll get a real notification once each is assigned.`
          : "Booking confirmed! You'll get a real notification once a team member is assigned."
      );
      navigate("/portal/dashboard");
    }, 400);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate("/portal/dashboard")} className="text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-gray-900">Book a Wash</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto">

        {/* Step 1: Car model (auto-detects category) + plan */}
        {step === 1 && (
          <div className="space-y-5">
            {vehicleQueue.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-medium text-blue-800">Vehicles in this booking ({vehicleQueue.length})</p>
                {vehicleQueue.map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-blue-700">
                    <span>{v.vehicleBrand} ({v.vehicleCategory}) — {PLAN_TIER_NAMES[v.plan] || v.plan}</span>
                    <button onClick={() => removeQueuedVehicle(i)} className="text-red-600">Remove</button>
                  </div>
                ))}
              </div>
            )}
            {savedVehicleList.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Choose your vehicle</p>
                <div className="space-y-2">
                  {savedVehicleList.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => selectSavedVehicle(v)}
                      className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 ${selectedVehicleId === v.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
                    >
                      <Car className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{v.brand} · {v.color}</p>
                        <p className="text-xs text-gray-500">{v.registrationNumber} · {v.category}</p>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={startNewVehicle}
                    className={`w-full text-left p-3 rounded-xl border text-sm ${isNewVehicle ? "border-blue-500 bg-blue-50 text-blue-700" : "border-dashed border-gray-300 text-gray-600"}`}
                  >
                    + Add a different vehicle
                  </button>
                </div>
              </div>
            )}
            {isNewVehicle && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">What car do you drive?</p>
              <input
                value={modelInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setModelInput(val);
                  const detected = detectVehicleCategory(val);
                  setVehicleCategory(detected || "");
                  setPlan("");
                }}
                placeholder="e.g. Hyundai Creta, Maruti Swift"
                className="w-full border rounded-xl px-4 py-3 text-base"
              />
              {modelInput.trim() && (
                vehicleCategory ? (
                  <p className="text-xs text-green-700 mt-2">✓ Recognized as {vehicleCategory}</p>
                ) : (
                  <p className="text-xs text-amber-700 mt-2">
                    We couldn't recognize this model — please check the spelling, or try including the brand name (e.g. "Maruti Swift" instead of just "Swift").
                  </p>
                )
              )}
            </div>
            )}

            {vehicleCategory && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Choose a Plan</p>
                <div className="space-y-2">
                  {PLAN_TYPES.map((pt) => {
                    const price = getSubscriptionPrice(vehicleCategory, pt);
                    if (price === "NA") return null;
                    const deliverable = CURRENT_PLAN_VERSION.deliverables[pt];
                    return (
                      <button
                        key={pt}
                        onClick={() => setPlan(pt)}
                        className={`w-full text-left p-4 rounded-xl border ${plan === pt ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900 text-sm">{PLAN_TIER_NAMES[pt] || pt}</p>
                          <p className="font-bold text-gray-900 text-sm">₹{price}<span className="text-xs font-normal text-gray-500">/mo</span></p>
                        </div>
                        {deliverable?.tagline && <p className="text-xs text-gray-500 mt-1">{deliverable.tagline}</p>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => { if (!vehicleBrand) setVehicleBrand(modelInput); setStep(2); }}
              disabled={!vehicleCategory || !plan}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Add-ons - real add-on catalog, real per-vehicle pricing */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Add extras to this wash?</p>
              <p className="text-xs text-gray-400 mt-0.5">Optional — skip if you'd just like the base plan.</p>
            </div>
            <div className="space-y-2">
              {ADD_ON_SERVICES.filter((a) => a.isActive).map((addon) => {
                const price = vehicleCategory ? getAddonPrice(addon.id, vehicleCategory) : "NA";
                if (price === "NA") return null;
                const recommended = plan ? addon.bestPairedWith.includes(plan as PlanType) : false;
                const isSelected = selectedAddons.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`w-full text-left p-4 rounded-xl border ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="text-lg leading-none">{addon.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {addon.name}
                            {recommended && <span className="text-xs text-blue-600 font-normal ml-2">Recommended for your plan</span>}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{addon.description}</p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-900 text-sm whitespace-nowrap">+₹{price}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {addonsTotal > 0 && (
              <p className="text-sm text-gray-600 text-right">Add-ons total: <span className="font-bold text-gray-900">₹{addonsTotal}</span></p>
            )}
            <button
              onClick={() => setStep(3)}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium"
            >
              {selectedAddons.length > 0 ? "Continue" : "Skip"}
            </button>
          </div>
        )}

        {/* Step 3: Vehicle details */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Vehicle Details</p>
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Registration Number</label>
                <input value={regNumber} onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. GJ05AB1234" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Brand / Model</label>
                <input value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Hyundai Creta" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Color</label>
                <input value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. White" />
              </div>
            </div>
            <button
              onClick={() => setStep(4)}
              disabled={!regNumber || !vehicleBrand}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium disabled:opacity-40"
            >
              Continue to Schedule
            </button>
            <button
              onClick={addAnotherVehicle}
              disabled={!regNumber || !vehicleBrand}
              className="w-full border border-blue-200 text-blue-700 rounded-xl py-3 font-medium disabled:opacity-40"
            >
              + Add Another Vehicle
            </button>
          </div>
        )}

        {/* Step 4: Schedule + confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">When should we come?</p>
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time Slot</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button key={slot} onClick={() => setTimeSlot(slot)}
                      className={`text-xs p-2 rounded-lg border ${timeSlot === slot ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location for this wash - real, always shown, even for a single vehicle */}
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-700">Wash Location</p>
                {!editingAddress && (
                  <button onClick={() => setEditingAddress(true)} className="text-xs text-blue-600">Change for this booking</button>
                )}
              </div>
              {!editingAddress ? (
                <p className="text-sm text-gray-600">
                  {serviceAddressLine1}, {serviceArea} {servicePinCode}
                </p>
              ) : (
                <div className="space-y-2 mt-2">
                  <input value={serviceAddressLine1} onChange={(e) => setServiceAddressLine1(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Address line" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Area" />
                    <input value={servicePinCode} onChange={(e) => setServicePinCode(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Pin code" />
                  </div>
                  <button onClick={() => setEditingAddress(false)} className="text-xs text-blue-600">Done</button>
                  <p className="text-xs text-gray-400">This only changes the address for this booking — your saved profile address stays the same.</p>
                </div>
              )}
            </div>

            {/* Coupon or referral code - real validation against both real systems */}
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Have a coupon or referral code?</p>
              {!appliedCode ? (
                <div className="flex gap-2">
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm tracking-wide"
                  />
                  <button onClick={applyCode} className="bg-gray-900 text-white rounded-lg px-4 text-sm font-medium">Apply</button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">{appliedCode.code}</span> applied — ₹{appliedCode.discount} off
                  </p>
                  <button onClick={() => { setAppliedCode(null); setCodeInput(""); }} className="text-xs text-red-600">Remove</button>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Booking Summary {vehicleQueue.length > 0 && `(${vehicleQueue.length + 1} vehicles)`}
              </p>
              <div className="text-sm text-gray-600 space-y-3">
                {vehicleQueue.map((v, i) => (
                  <div key={i} className="pb-2 border-b">
                    <p>{PLAN_TIER_NAMES[v.plan] || v.plan} — {v.vehicleCategory}</p>
                    <p className="text-xs">{v.vehicleBrand}, {v.vehicleColor} · {v.regNumber}</p>
                    <p className="text-xs font-semibold text-gray-900">₹{priceForVehicle(v.vehicleCategory, v.plan, v.selectedAddons)}</p>
                  </div>
                ))}
                <div>
                  <p>{PLAN_TIER_NAMES[plan as string] || plan} — {vehicleCategory}</p>
                  <p className="text-xs">{vehicleBrand}, {vehicleColor} · {regNumber}</p>
                  {selectedAddons.length > 0 && (
                    <div className="pt-1">
                      {selectedAddons.map((id) => {
                        const addon = ADD_ON_SERVICES.find((a) => a.id === id);
                        const price = vehicleCategory ? getAddonPrice(id, vehicleCategory) : "NA";
                        if (!addon || price === "NA") return null;
                        return <p key={id} className="text-xs">+ {addon.name} — ₹{price}</p>;
                      })}
                    </div>
                  )}
                </div>
                <p>{scheduledDate} · {timeSlot} <span className="text-xs">(same time for all vehicles)</span></p>
                {appliedCode && (
                  <div className="flex justify-between text-green-700">
                    <span>Code {appliedCode.code}</span>
                    <span>-₹{appliedCode.discount}</span>
                  </div>
                )}
                <p className="font-bold text-gray-900 pt-2 border-t mt-2">
                  ₹{finalTotal}
                  <span className="text-xs font-normal text-gray-500">/month total</span>
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
              <span className="text-amber-600 text-base leading-none mt-0.5">₹</span>
              <div>
                <p className="text-sm font-medium text-amber-800">Payment collected at your doorstep</p>
                <p className="text-xs text-amber-700 mt-0.5">Pay by cash, UPI, or a payment link when the team arrives — no advance payment needed to confirm this booking.</p>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full bg-green-600 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Check className="w-4 h-4" /> {submitting ? "Confirming..." : vehicleQueue.length > 0 ? `Confirm ${vehicleQueue.length + 1} Bookings` : "Confirm Booking"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default CustomerPortalBooking;
