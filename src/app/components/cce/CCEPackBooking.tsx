/**
 * CCEPackBooking — a real screen for booking the next visit of an
 * existing customer's pack (Pack of 2 / Pack of 4), for phone-in
 * customers. Previously no staff-facing tool existed for this at all -
 * only the customer's own self-booking in the portal could correctly
 * link a subsequent pack visit to the subscription.
 *
 * A pack strictly belongs to one specific vehicle - the vehicle is
 * shown, not chosen, taken from the pack's own first real job record.
 *
 * The job created here is marked paymentStatus: "Paid" from the start,
 * since the customer already paid for every visit when they bought the
 * pack - fixing the real gap where a pack-linked booking would
 * otherwise show as "Pending" and risk being charged again at the door.
 */

import { useState } from "react";
import { useCustomers } from "../../contexts/CustomerContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import { useJobs } from "../../contexts/JobContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
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

  const packSubscriptions = foundCustomer
    ? getSubscriptionsByCustomerId(foundCustomer.customerId).filter(
        (s: any) => (s.frequency === "Pack of 2" || s.frequency === "Pack of 4") && s.visitsTotal !== undefined
      )
    : [];

  const selectedSub: any = packSubscriptions.find((s: any) => s.subscriptionId === selectedSubId);

  // The vehicle a pack belongs to - taken from its own first real job,
  // since that's the actual vehicle captured when the pack was bought,
  // not guessed from whichever vehicle happens to be on file today.
  const packVehicle = selectedSub
    ? allJobs.find((j: any) => j.subscriptionId === selectedSub.subscriptionId)?.vehicleDetails
    : null;

  const visitsRemaining = selectedSub ? Math.max(0, (selectedSub.visitsTotal || 0) - (selectedSub.visitsUsed || 0)) : 0;
  const isBookable = selectedSub && selectedSub.status === "Active" && visitsRemaining > 0;

  const isSunday = scheduledDate ? new Date(scheduledDate).getDay() === 0 : false;

  const handleBookVisit = () => {
    if (!foundCustomer || !selectedSub || !packVehicle) {
      toast.error("Select a customer and an active pack first");
      return;
    }
    if (!isBookable) {
      toast.error("This pack has no visits remaining, or isn't active");
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
        // Already paid for as part of the pack purchase - the real fix
        // for the gap where a pack-linked booking would otherwise show
        // as Pending and risk being charged again at the door.
        paymentStatus: "Paid",
        packageName: selectedSub.packageName,
        packageType: selectedSub.packageType,
        vehicleDetails: packVehicle,
        location: {
          addressLine1: foundCustomer.address?.line1 || "",
          area: foundCustomer.address?.area || "",
          city: foundCustomer.address?.city || "",
          pinCode: foundCustomer.address?.pinCode || "",
        },
        serviceDetails: {},
        cityId: city,
        notes: `Pack visit booked by CCE (${currentUser?.name || "CCE"}) via phone`,
      } as any);
      toast.success(`Wash booked for ${scheduledDate} — visit will count toward this pack`);
      setSelectedSubId("");
    } catch (err: any) {
      toast.error(err?.message || "Could not book this visit — please try a different date or time");
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" /> Book a Pack Visit
        </h1>
        <p className="text-sm text-gray-500">For an existing customer calling to schedule their next pack wash</p>
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
            {packSubscriptions.length === 0 ? (
              <p className="text-sm text-gray-400">This customer has no pack subscriptions.</p>
            ) : (
              <div className="space-y-2">
                {packSubscriptions.map((sub: any) => {
                  const remaining = Math.max(0, (sub.visitsTotal || 0) - (sub.visitsUsed || 0));
                  const bookable = sub.status === "Active" && remaining > 0;
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
                      <p className="text-xs text-gray-500 mt-1">
                        {sub.visitsUsed || 0} of {sub.visitsTotal} visits used · {remaining} remaining · expires {sub.visitsExpiry || "—"}
                      </p>
                      {!bookable && (
                        <p className="text-xs text-red-600 mt-1">
                          {sub.status !== "Active" ? "This pack is no longer active" : "No visits remaining on this pack"}
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
                  {packVehicle ? (
                    <span>{packVehicle.brand} · {packVehicle.category} · {packVehicle.registration}</span>
                  ) : (
                    <span className="text-gray-400">Vehicle details not found for this pack</span>
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
                <Button onClick={handleBookVisit} disabled={!packVehicle || isSunday} className="w-full">
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
