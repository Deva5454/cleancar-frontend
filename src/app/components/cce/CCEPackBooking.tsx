/**
 * CCEPackBooking — a real screen for booking the next wash of an
 * existing customer's already-paid plan (Pack of 2, Pack of 4, or a
 * Monthly/Quarterly/Annual subscription), for phone-in customers.
 * Previously no staff-facing tool existed for this at all - only the
 * customer's own self-booking in the portal could correctly link a
 * subsequent visit to the subscription.
 *
 * A plan strictly belongs to one specific vehicle - the vehicle is
 * shown, not chosen, taken from the plan's own first real job record.
 *
 * The job created here is marked paymentStatus: "Paid" whenever the
 * plan is genuinely prepaid - a pack with real visits remaining, or a
 * monthly plan with its current cycle paid - using the same shared
 * rule used everywhere else a job can be created against a
 * subscription, so this can never drift out of sync with the rest of
 * the app.
 */

import { useState } from "react";
import { useCustomers } from "../../contexts/CustomerContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import { useJobs } from "../../contexts/JobContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { isPrepaidSubscriptionVisit } from "../../lib/subscriptionPaymentStatus";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Package, Search, Car } from "lucide-react";
import { toast } from "sonner";

// The only real, valid wash-band hours createJob() will accept -
// deliberately built to avoid the same mistake found in the customer
// portal, where a "4:00 PM" slot would throw and a "6:00 PM" slot would
// be silently misread as if it were 6 AM.
const VALID_TIME_SLOTS = ["06:00", "07:00", "08:00"];

const isPack = (sub: any) => sub.visitsTotal !== undefined;

export function CCEPackBooking() {
  const { customers } = useCustomers();
  const { getSubscriptionsByCustomerId } = useCustomerSubscriptions();
  const { createJob, allJobs } = useJobs();
  const { city } = useCity();
  const { currentUser } = useRole();

  const [phoneSearch, setPhoneSearch] = useState("");
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [timeSlot, setTimeSlot] = useState(VALID_TIME_SLOTS[0]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    setSearched(true);
    const match = customers.find((c: any) => c.phone === phoneSearch.trim());
    setFoundCustomer(match || null);
    setSelectedSubId("");
  };

  // Every real subscription type where multiple washes are paid for in
  // advance - a pack (visitsTotal defined) or a Monthly/Quarterly/Annual
  // plan (billingCycle defined). A one-time, non-recurring purchase
  // doesn't belong here, since there's nothing further to book against it.
  const bookableSubscriptions = foundCustomer
    ? getSubscriptionsByCustomerId(foundCustomer.customerId).filter(
        (s: any) => s.visitsTotal !== undefined || !!s.billingCycle
      )
    : [];

  const selectedSub: any = bookableSubscriptions.find((s: any) => s.subscriptionId === selectedSubId);

  // The vehicle a plan belongs to - taken from its own first real job,
  // since that's the actual vehicle captured when it was bought, not
  // guessed from whichever vehicle happens to be on file today.
  const planVehicle = selectedSub
    ? allJobs.find((j: any) => j.subscriptionId === selectedSub.subscriptionId)?.vehicleDetails
    : null;

  const isBookable = selectedSub ? isPrepaidSubscriptionVisit(selectedSub) : false;

  const isSunday = scheduledDate ? new Date(scheduledDate).getDay() === 0 : false;

  const handleBookVisit = () => {
    if (!foundCustomer || !selectedSub || !planVehicle) {
      toast.error("Select a customer and an active, paid plan first");
      return;
    }
    if (!isBookable) {
      toast.error("This plan isn't active or paid, or has no visits remaining");
      return;
    }
    if (isSunday) {
      toast.error("Sunday is a rest day — please pick a different date");
      return;
    }
    try {
      createJob({
        customerId: foundCustomer.customerId,
        subscriptionId: selectedSub.subscriptionId,
        scheduledDate,
        timeSlot,
        status: "Unassigned",
        jobType: "Regular",
        // Real, shared rule - already verified true by isBookable above.
        paymentStatus: "Paid",
        packageName: selectedSub.packageName,
        packageType: selectedSub.packageType,
        vehicleDetails: planVehicle,
        location: {
          addressLine1: foundCustomer.address?.line1 || "",
          area: foundCustomer.address?.area || "",
          city: foundCustomer.address?.city || "",
          pinCode: foundCustomer.address?.pinCode || "",
        },
        serviceDetails: {},
        cityId: city,
        notes: `Visit booked by CCE (${currentUser?.name || "CCE"}) via phone`,
      } as any);
      toast.success(`Wash booked for ${scheduledDate} — visit will count toward this plan`);
      setSelectedSubId("");
    } catch (err: any) {
      toast.error(err?.message || "Could not book this visit — please try a different date or time");
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" /> Book a Plan Visit
        </h1>
        <p className="text-sm text-gray-500">For an existing customer calling to schedule their next wash — pack or monthly plan</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Find Customer</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            placeholder="Customer phone number"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch}><Search className="w-4 h-4 mr-1" /> Search</Button>
        </CardContent>
      </Card>

      {searched && !foundCustomer && (
        <Card className="p-6 text-center text-sm text-gray-500">No customer found with that phone number.</Card>
      )}

      {foundCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{foundCustomer.firstName} {foundCustomer.lastName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      className={`w-full text-left p-3 rounded-lg border ${
                        selectedSubId === sub.subscriptionId ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      } ${!bookable ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{sub.packageName}</p>
                        <Badge variant={bookable ? "default" : "secondary"}>{sub.status}</Badge>
                      </div>
                      {isPack(sub) ? (
                        <p className="text-xs text-gray-500 mt-1">
                          {sub.visitsUsed || 0} of {sub.visitsTotal} visits used · {remaining} remaining · expires {sub.visitsExpiry || "—"}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          {sub.billingCycle} plan · started {sub.startDate || "—"} · renews {sub.renewalDate || "—"} · payment {sub.paymentStatus || "Unknown"}
                        </p>
                      )}
                      {!bookable && (
                        <p className="text-xs text-red-600 mt-1">
                          {sub.status !== "Active"
                            ? "This plan is no longer active"
                            : isPack(sub)
                              ? "No visits remaining on this pack"
                              : "This plan's current cycle isn't marked as paid"}
                        </p>
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
                  {planVehicle ? (
                    <span>{planVehicle.brand} · {planVehicle.category} · {planVehicle.registration}</span>
                  ) : (
                    <span className="text-gray-400">Vehicle details not found for this plan</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
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
                <Button onClick={handleBookVisit} disabled={!planVehicle || isSunday} className="w-full">
                  Book This Visit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CCEPackBooking;
