import { useState } from "react";
import {
  VEHICLE_CATEGORIES, PLAN_TYPES, PLAN_TIER_NAMES, getSubscriptionPrice,
  type VehicleCategory, type PlanType,
} from "../../../data/subscriptionPlans";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";
import { toast } from "sonner";

const LAPSED_STATUSES = ["Expired", "Exhausted", "Cancelled"];
const VALID_TIME_SLOTS = ["06:00", "07:00", "08:00"];

export function RenewPlanPanel({ customer, subscriptions, jobs, createSubscription, createJob, city, currentUser }: {
  customer: any; subscriptions: any[]; jobs: any[]; createSubscription: (s: any) => any;
  createJob: (job: any) => any; city: string; currentUser: any;
}) {
  const lapsedSubs = subscriptions.filter((s: any) => LAPSED_STATUSES.includes(s.status));

  const [selectedLapsedId, setSelectedLapsedId] = useState("");
  const [renewalKind, setRenewalKind] = useState<"pack2" | "pack4" | "monthly">("monthly");
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory | "">("");
  const [planType, setPlanType] = useState<PlanType | "">("");
  const [brand, setBrand] = useState("");
  const [reg, setReg] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [timeSlot, setTimeSlot] = useState(VALID_TIME_SLOTS[0]);

  const price = vehicleCategory && planType ? getSubscriptionPrice(vehicleCategory, planType) : null;
  const isSunday = scheduledDate ? new Date(scheduledDate).getDay() === 0 : false;

  const handleRenew = () => {
    if (!vehicleCategory || !planType || !brand || !reg) {
      toast.error("Fill in the vehicle and plan details");
      return;
    }
    if (isSunday) { toast.error("Sunday is a rest day — please pick a different date"); return; }
    if (price === "NA" || price === null) { toast.error("This vehicle/plan combination isn't priced"); return; }

    const isPack = renewalKind === "pack2" || renewalKind === "pack4";
    const startDate = new Date();
    const renewalDate = new Date(startDate);
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    const subPayload: any = {
      customerId: customer.customerId,
      packageType: planType,
      packageName: `${PLAN_TIER_NAMES[planType] || planType}${isPack ? ` (${renewalKind === "pack2" ? "Pack of 2" : "Pack of 4"})` : ""}`,
      frequency: renewalKind === "pack2" ? "Pack of 2" : renewalKind === "pack4" ? "Pack of 4" : "Weekly",
      status: "Active",
      startDate: startDate.toISOString().split("T")[0],
      renewalDate: renewalDate.toISOString().split("T")[0],
      pricing: { basePrice: price, discount: 0, finalPrice: price, currency: "INR" },
      priceLocked: price,
      serviceDetails: { vehicleType: vehicleCategory },
      billingCycle: "Monthly",
      paymentStatus: "Paid",
    };
    if (isPack) {
      const visitsTotal = renewalKind === "pack2" ? 2 : 4;
      const days = renewalKind === "pack2" ? 20 : 30;
      subPayload.visitsTotal = visitsTotal;
      subPayload.visitsUsed = 0;
      subPayload.visitsExpiry = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    }

    try {
      const sub = createSubscription(subPayload);
      createJob({
        customerId: customer.customerId,
        subscriptionId: sub.subscriptionId,
        scheduledDate, timeSlot, status: "Unassigned", jobType: "Regular",
        paymentStatus: "Paid",
        packageName: subPayload.packageName, packageType: planType,
        vehicleDetails: { category: vehicleCategory, brand, color: "", registration: reg },
        location: {
          addressLine1: customer.address?.line1 || "", area: customer.address?.area || "",
          city: customer.address?.city || "", pinCode: customer.address?.pinCode || "",
        },
        serviceDetails: {}, cityId: city,
        notes: `Plan renewed by CCE (${currentUser?.name || "CCE"}) via phone`,
      } as any);
      toast.success(`${subPayload.packageName} renewed — first wash booked for ${scheduledDate}`);
      setVehicleCategory(""); setPlanType(""); setBrand(""); setReg("");
    } catch (err: any) {
      toast.error(err?.message || "Could not renew this plan");
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {lapsedSubs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">This customer has no lapsed plans to renew.</p>
        ) : (
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Their previous plan(s)</Label>
            {lapsedSubs.map((sub: any) => (
              <div key={sub.subscriptionId} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                <span>{sub.packageName}</span>
                <Badge variant="secondary">{sub.status}</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4 space-y-3">
          <Label>Renew As</Label>
          <div className="flex gap-2">
            <Button variant={renewalKind === "monthly" ? "default" : "outline"} size="sm" onClick={() => setRenewalKind("monthly")}>Monthly</Button>
            <Button variant={renewalKind === "pack2" ? "default" : "outline"} size="sm" onClick={() => setRenewalKind("pack2")}>Pack of 2</Button>
            <Button variant={renewalKind === "pack4" ? "default" : "outline"} size="sm" onClick={() => setRenewalKind("pack4")}>Pack of 4</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Vehicle Category</Label>
              <Select value={vehicleCategory} onValueChange={(v) => { setVehicleCategory(v as VehicleCategory); setPlanType(""); }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{VEHICLE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan Tier</Label>
              <Select value={planType} onValueChange={(v) => setPlanType(v as PlanType)} disabled={!vehicleCategory}>
                <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                <SelectContent>
                  {PLAN_TYPES.filter((pt) => !pt.startsWith("One-Time")).map((pt) => {
                    const p = vehicleCategory ? getSubscriptionPrice(vehicleCategory, pt) : "NA";
                    if (p === "NA") return null;
                    return <SelectItem key={pt} value={pt}>{PLAN_TIER_NAMES[pt] || pt} — ₹{p}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehicle Brand/Model</Label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Maruti Swift" />
            </div>
            <div>
              <Label>Registration Number</Label>
              <Input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="GJ-05-XX-1234" />
            </div>
          </div>
          {price && price !== "NA" && <p className="text-sm font-medium text-gray-900">Price: ₹{price}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Wash Date</Label>
              <Input type="date" value={scheduledDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setScheduledDate(e.target.value)} />
              {isSunday && <p className="text-xs text-red-600 mt-1">Sunday is a rest day</p>}
            </div>
            <div>
              <Label>Time</Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VALID_TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleRenew} disabled={isSunday} className="w-full">Renew Plan</Button>
        </div>
      </CardContent>
    </Card>
  );
}
