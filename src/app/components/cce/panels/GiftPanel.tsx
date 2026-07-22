import { useState } from "react";
import { accountingEntryService } from "../../../services/accountingEntryService";
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
import { toast } from "sonner";

export function GiftPanel({ customer, city }: { customer: any; city: string }) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory | "">("");
  const [planType, setPlanType] = useState<PlanType | "">("");

  const price = vehicleCategory && planType ? getSubscriptionPrice(vehicleCategory, planType) : null;

  const handleSubmit = () => {
    if (!recipientName.trim() || !vehicleCategory || !planType) {
      toast.error("Fill in the recipient's name, vehicle type, and plan");
      return;
    }
    if (price === "NA" || price === null) { toast.error("This vehicle/plan combination isn't priced"); return; }
    // Same real gift record type and function already used by the
    // customer portal - a gift purchased over the phone still needs
    // real payment confirmed by staff before the code becomes usable,
    // same as one purchased by the customer themselves.
    const gift = accountingEntryService.requestGift(
      {
        buyerCustomerId: customer.customerId,
        buyerName: `${customer.firstName} ${customer.lastName}`,
        recipientName, recipientPhone: recipientPhone || undefined,
        planType, vehicleCategory, amount: price,
        city, cityId: city,
      },
      city
    );
    toast.success(`Gift request submitted — code ${gift.giftCode} will be active once payment is confirmed`);
    setRecipientName(""); setRecipientPhone(""); setVehicleCategory(""); setPlanType("");
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-gray-500">
          No online payment for a phone order — confirm payment with the customer directly, then Accounts marks it paid at Accounts → Gift Subscriptions before the code works.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Recipient's Name</Label>
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Recipient's Phone (optional)</Label>
            <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
          </div>
          <div>
            <Label>Vehicle Type</Label>
            <Select value={vehicleCategory} onValueChange={(v) => { setVehicleCategory(v as VehicleCategory); setPlanType(""); }}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{VEHICLE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Plan</Label>
            <Select value={planType} onValueChange={(v) => setPlanType(v as PlanType)} disabled={!vehicleCategory}>
              <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
              <SelectContent>
                {PLAN_TYPES.map((pt) => {
                  const p = vehicleCategory ? getSubscriptionPrice(vehicleCategory, pt) : "NA";
                  if (p === "NA") return null;
                  return <SelectItem key={pt} value={pt}>{PLAN_TIER_NAMES[pt] || pt} — ₹{p}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        {price && price !== "NA" && <p className="text-sm font-medium text-gray-900">Amount: ₹{price}</p>}
        <Button onClick={handleSubmit} className="w-full">Submit Gift Request</Button>
      </CardContent>
    </Card>
  );
}
