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
import { useJobs } from "../../contexts/JobContext";
import { useCustomerPortalAuth } from "./CustomerPortalAuthContext";
import {
  PLAN_TYPES,
  PLAN_TIER_NAMES,
  getSubscriptionPrice,
  CURRENT_PLAN_VERSION,
  type VehicleCategory,
  type PlanType,
} from "../../data/subscriptionPlans";
import { detectVehicleCategory } from "./carModelLookup";
import { ChevronLeft, Check } from "lucide-react";
import { toast } from "sonner";

const TIME_SLOTS = ["6:00 AM - 8:00 AM", "8:00 AM - 10:00 AM", "4:00 PM - 6:00 PM", "6:00 PM - 8:00 PM"];

export function CustomerPortalBooking() {
  const { loggedInCustomerId } = useCustomerPortalAuth();
  const { customers } = useCustomers();
  const { createJob } = useJobs();
  const navigate = useNavigate();

  const customer = useMemo(
    () => customers.find((c: any) => c.customerId === loggedInCustomerId),
    [customers, loggedInCustomerId]
  );

  const [step, setStep] = useState(1);
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory | "">("");
  const [modelInput, setModelInput] = useState("");
  const [plan, setPlan] = useState<PlanType | "">("");
  const [regNumber, setRegNumber] = useState(customer?.vehicleDetails?.registrationNumber || "");
  const [vehicleBrand, setVehicleBrand] = useState(customer?.vehicleDetails?.brand || "");
  const [vehicleColor, setVehicleColor] = useState(customer?.vehicleDetails?.color || "");
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [submitting, setSubmitting] = useState(false);

  const priceForSelected = vehicleCategory && plan ? getSubscriptionPrice(vehicleCategory, plan) : null;

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
    const job = createJob({
      customerId: customer.customerId,
      scheduledDate,
      timeSlot,
      status: "Unassigned",
      jobType: "Regular",
      paymentStatus: "Pending",
      packageName: `${PLAN_TIER_NAMES[plan] || plan}`,
      packageType: plan,
      vehicleDetails: {
        category: vehicleCategory,
        color: vehicleColor,
        brand: vehicleBrand,
        registration: regNumber,
      },
      location: {
        addressLine1: customer.address?.line1 || "",
        area: customer.address?.area || "",
        city: customer.address?.city || "",
        pinCode: customer.address?.pinCode || "",
      },
      serviceDetails: {},
    } as any);
    setTimeout(() => {
      toast.success("Booking confirmed! You'll get a real notification once a team member is assigned.");
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

        {/* Step 2: Vehicle details */}
        {step === 2 && (
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
              onClick={() => setStep(3)}
              disabled={!regNumber || !vehicleBrand}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Schedule + confirm */}
        {step === 3 && (
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

            {/* Summary */}
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Booking Summary</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{PLAN_TIER_NAMES[plan as string] || plan} — {vehicleCategory}</p>
                <p>{vehicleBrand}, {vehicleColor} · {regNumber}</p>
                <p>{scheduledDate} · {timeSlot}</p>
                <p className="font-bold text-gray-900 pt-2 border-t mt-2">₹{priceForSelected}/month</p>
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
              <Check className="w-4 h-4" /> {submitting ? "Confirming..." : "Confirm Booking"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default CustomerPortalBooking;
