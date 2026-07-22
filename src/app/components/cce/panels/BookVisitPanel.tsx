import { useState } from "react";
import { isPrepaidSubscriptionVisit } from "../../../lib/subscriptionPaymentStatus";
import {
  VEHICLE_CATEGORIES, PLAN_TIER_NAMES, getSubscriptionPrice,
  type VehicleCategory, type PlanType,
} from "../../../data/subscriptionPlans";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";
import { Car } from "lucide-react";
import { toast } from "sonner";

const VALID_TIME_SLOTS = ["06:00", "07:00", "08:00"];
const ONE_TIME_PLAN_TYPES: PlanType[] = ["One-Time Member", "One-Time Non-Member"];
const isPack = (sub: any) => sub.visitsTotal !== undefined;

export function BookVisitPanel({ customer, subscriptions, jobs, createJob, city, currentUser }: {
  customer: any; subscriptions: any[]; jobs: any[]; createJob: (job: any) => any; city: string; currentUser: any;
}) {
  const [mode, setMode] = useState<"PLAN" | "ONE_TIME">("PLAN");

  // ── Against an existing Pack/Monthly plan ──────────────────────────────
  const bookableSubscriptions = subscriptions.filter((s: any) => s.visitsTotal !== undefined || !!s.billingCycle);
  const [selectedSubId, setSelectedSubId] = useState("");
  const selectedSub: any = bookableSubscriptions.find((s: any) => s.subscriptionId === selectedSubId);
  const planVehicle = selectedSub
    ? jobs.find((j: any) => j.subscriptionId === selectedSub.subscriptionId)?.vehicleDetails
    : null;
  const isPlanBookable = selectedSub ? isPrepaidSubscriptionVisit(selectedSub) : false;

  // ── A fresh, standalone one-time wash ───────────────────────────────────
  // Deliberately NOT locked to one vehicle or one service, unlike a Pack -
  // a repeat one-time customer can bring a different car or ask for a
  // different wash tier than last time.
  const [oneTimeVehicleCategory, setOneTimeVehicleCategory] = useState<VehicleCategory | "">("");
  const [oneTimePlanType, setOneTimePlanType] = useState<PlanType | "">("");
  const [oneTimeBrand, setOneTimeBrand] = useState("");
  const [oneTimeReg, setOneTimeReg] = useState("");

  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [timeSlot, setTimeSlot] = useState(VALID_TIME_SLOTS[0]);
  const isSunday = scheduledDate ? new Date(scheduledDate).getDay() === 0 : false;

  const oneTimePrice = oneTimeVehicleCategory && oneTimePlanType
    ? getSubscriptionPrice(oneTimeVehicleCategory, oneTimePlanType)
    : null;

  const handleBookPlanVisit = () => {
    if (!selectedSub || !planVehicle) { toast.error("Select an active, paid plan first"); return; }
    if (!isPlanBookable) { toast.error("This plan isn't active or paid, or has no visits remaining"); return; }
    if (isSunday) { toast.error("Sunday is a rest day — please pick a different date"); return; }
    try {
      createJob({
        customerId: customer.customerId, subscriptionId: selectedSub.subscriptionId,
        scheduledDate, timeSlot, status: "Unassigned", jobType: "Regular",
        paymentStatus: "Paid",
        packageName: selectedSub.packageName, packageType: selectedSub.packageType,
        vehicleDetails: planVehicle,
        location: {
          addressLine1: customer.address?.line1 || "", area: customer.address?.area || "",
          city: customer.address?.city || "", pinCode: customer.address?.pinCode || "",
        },
        serviceDetails: {}, cityId: city,
        notes: `Visit booked by CCE (${currentUser?.name || "CCE"}) via phone`,
      } as any);
      toast.success(`Wash booked for ${scheduledDate} — visit will count toward this plan`);
      setSelectedSubId("");
    } catch (err: any) {
      toast.error(err?.message || "Could not book this visit — please try a different date or time");
    }
  };

  const handleBookOneTime = () => {
    if (!oneTimeVehicleCategory || !oneTimePlanType || !oneTimeBrand || !oneTimeReg) {
      toast.error("Fill in the vehicle and service details");
      return;
    }
    if (isSunday) { toast.error("Sunday is a rest day — please pick a different date"); return; }
    if (oneTimePrice === "NA") { toast.error("This vehicle/service combination isn't priced — pick a different one"); return; }
    try {
      createJob({
        customerId: customer.customerId,
        scheduledDate, timeSlot, status: "Unassigned", jobType: "Regular",
        // A repeat one-time wash isn't prepaid - collected at the door,
        // same as any other one-time booking.
        paymentStatus: "Pending",
        packageName: PLAN_TIER_NAMES[oneTimePlanType] || oneTimePlanType,
        packageType: oneTimePlanType,
        finalAmount: oneTimePrice,
        vehicleDetails: {
          category: oneTimeVehicleCategory, brand: oneTimeBrand, color: "", registration: oneTimeReg,
        },
        location: {
          addressLine1: customer.address?.line1 || "", area: customer.address?.area || "",
          city: customer.address?.city || "", pinCode: customer.address?.pinCode || "",
        },
        serviceDetails: {}, cityId: city,
        notes: `Repeat one-time wash booked by CCE (${currentUser?.name || "CCE"}) via phone`,
      } as any);
      toast.success(`One-time wash booked for ${scheduledDate}`);
      setOneTimeVehicleCategory(""); setOneTimePlanType(""); setOneTimeBrand(""); setOneTimeReg("");
    } catch (err: any) {
      toast.error(err?.message || "Could not book this visit — please try a different date or time");
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2">
          <Button variant={mode === "PLAN" ? "default" : "outline"} size="sm" onClick={() => setMode("PLAN")}>Against a Plan</Button>
          <Button variant={mode === "ONE_TIME" ? "default" : "outline"} size="sm" onClick={() => setMode("ONE_TIME")}>One-Time Wash</Button>
        </div>

        {mode === "PLAN" && (
          <div className="space-y-4">
            {bookableSubscriptions.length === 0 ? (
              <p className="text-sm text-gray-400">This customer has no pack or monthly plan subscriptions.</p>
            ) : (
              <div className="space-y-2">
                {bookableSubscriptions.map((sub: any) => {
                  const bookable = isPrepaidSubscriptionVisit(sub);
                  const remaining = isPack(sub) ? Math.max(0, (sub.visitsTotal || 0) - (sub.visitsUsed || 0)) : null;
                  return (
                    <button
                      key={sub.subscriptionId}
                      onClick={() => bookable && setSelectedSubId(sub.subscriptionId)}
                      disabled={!bookable}
                      className={`w-full text-left p-3 rounded-lg border ${selectedSubId === sub.subscriptionId ? "border-blue-500 bg-blue-50" : "border-gray-200"} ${!bookable ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{sub.packageName}</p>
                        <Badge variant={bookable ? "default" : "secondary"}>{sub.status}</Badge>
                      </div>
                      {isPack(sub) ? (
                        <p className="text-xs text-gray-500 mt-1">{sub.visitsUsed || 0} of {sub.visitsTotal} visits used · {remaining} remaining · expires {sub.visitsExpiry || "—"}</p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">{sub.billingCycle} plan · started {sub.startDate || "—"} · renews {sub.renewalDate || "—"} · payment {sub.paymentStatus || "Unknown"}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedSub && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                  <Car className="w-4 h-4 text-gray-400" />
                  {planVehicle ? <span>{planVehicle.brand} · {planVehicle.category} · {planVehicle.registration}</span> : <span className="text-gray-400">Vehicle details not found for this plan</span>}
                </div>
                <DateTimePicker scheduledDate={scheduledDate} setScheduledDate={setScheduledDate} timeSlot={timeSlot} setTimeSlot={setTimeSlot} isSunday={isSunday} />
                <Button onClick={handleBookPlanVisit} disabled={!planVehicle || isSunday} className="w-full">Book This Visit</Button>
              </div>
            )}
          </div>
        )}

        {mode === "ONE_TIME" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Vehicle and service can be different from last time — a one-time wash isn't locked to a single car.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vehicle Category</Label>
                <Select value={oneTimeVehicleCategory} onValueChange={(v) => { setOneTimeVehicleCategory(v as VehicleCategory); setOneTimePlanType(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service</Label>
                <Select value={oneTimePlanType} onValueChange={(v) => setOneTimePlanType(v as PlanType)} disabled={!oneTimeVehicleCategory}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {ONE_TIME_PLAN_TYPES.map((pt) => {
                      const price = oneTimeVehicleCategory ? getSubscriptionPrice(oneTimeVehicleCategory, pt) : "NA";
                      if (price === "NA") return null;
                      return <SelectItem key={pt} value={pt}>{PLAN_TIER_NAMES[pt] || pt} — ₹{price}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vehicle Brand/Model</Label>
                <Input value={oneTimeBrand} onChange={(e) => setOneTimeBrand(e.target.value)} placeholder="e.g. Maruti Swift" />
              </div>
              <div>
                <Label>Registration Number</Label>
                <Input value={oneTimeReg} onChange={(e) => setOneTimeReg(e.target.value)} placeholder="GJ-05-XX-1234" />
              </div>
            </div>
            {oneTimePrice && oneTimePrice !== "NA" && (
              <p className="text-sm font-medium text-gray-900">Amount to collect at the door: ₹{oneTimePrice}</p>
            )}
            <DateTimePicker scheduledDate={scheduledDate} setScheduledDate={setScheduledDate} timeSlot={timeSlot} setTimeSlot={setTimeSlot} isSunday={isSunday} />
            <Button onClick={handleBookOneTime} disabled={isSunday} className="w-full">Book One-Time Wash</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DateTimePicker({ scheduledDate, setScheduledDate, timeSlot, setTimeSlot, isSunday }: {
  scheduledDate: string; setScheduledDate: (v: string) => void; timeSlot: string; setTimeSlot: (v: string) => void; isSunday: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>Date</Label>
        <Input type="date" value={scheduledDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setScheduledDate(e.target.value)} />
        {isSunday && <p className="text-xs text-red-600 mt-1">Sunday is a rest day — no washes are scheduled</p>}
      </div>
      <div>
        <Label>Time</Label>
        <Select value={timeSlot} onValueChange={setTimeSlot}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {VALID_TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
