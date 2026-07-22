/**
 * CCECustomerService — the real, comprehensive tool for everything an
 * existing customer might call about, covering all 5 real scenarios
 * traced through the app (previously none of these had any staff-side
 * tool at all):
 *
 *   1. Book a Visit    — against a Pack/Monthly plan (paid), OR a fresh
 *                         standalone One-Time wash (freely chosen vehicle
 *                         and service, unlike a Pack visit which is
 *                         locked to one vehicle).
 *   2. Reschedule/Cancel — a real, direct staff action on an upcoming job.
 *   3. Renew a Plan     — for a customer whose Pack/Plan has lapsed.
 *   4. Gift a Wash      — same real gift-purchase flow as the portal.
 *   5. Free Redo        — a genuine free re-wash, correctly marked paid
 *                          with no charge, for a service-quality issue.
 *
 * One real customer search, shared across all five real actions below.
 */

import { useState, useMemo } from "react";
import { useCustomers } from "../../contexts/CustomerContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import { useJobs } from "../../contexts/JobContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Package, Search, CalendarClock, RefreshCcw, Gift, Sparkles } from "lucide-react";
import { BookVisitPanel } from "./panels/BookVisitPanel";
import { RescheduleCancelPanel } from "./panels/RescheduleCancelPanel";
import { RenewPlanPanel } from "./panels/RenewPlanPanel";
import { GiftPanel } from "./panels/GiftPanel";
import { FreeRedoPanel } from "./panels/FreeRedoPanel";

type ActionTab = "BOOK" | "RESCHEDULE" | "RENEW" | "GIFT" | "REDO";

export function CCECustomerService() {
  const { customers } = useCustomers();
  const { getSubscriptionsByCustomerId, createSubscription } = useCustomerSubscriptions();
  const { createJob, updateJob, allJobs } = useJobs();
  const { city } = useCity();
  const { currentUser } = useRole();

  const [phoneSearch, setPhoneSearch] = useState("");
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<ActionTab>("BOOK");

  const handleSearch = () => {
    setSearched(true);
    const match = customers.find((c: any) => c.phone === phoneSearch.trim());
    setFoundCustomer(match || null);
  };

  const customerJobs = useMemo(
    () => (foundCustomer ? allJobs.filter((j: any) => j.customerId === foundCustomer.customerId) : []),
    [allJobs, foundCustomer]
  );
  const customerSubs = useMemo(
    () => (foundCustomer ? getSubscriptionsByCustomerId(foundCustomer.customerId) : []),
    [foundCustomer, getSubscriptionsByCustomerId]
  );

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" /> Customer Service
        </h1>
        <p className="text-sm text-gray-500">For an existing customer calling about a wash — book, reschedule, renew, gift, or a free redo</p>
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
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">{foundCustomer.firstName} {foundCustomer.lastName}</CardTitle></CardHeader>
          </Card>

          <div className="flex flex-wrap gap-2">
            {([
              ["BOOK", "Book a Visit", Package],
              ["RESCHEDULE", "Reschedule / Cancel", CalendarClock],
              ["RENEW", "Renew a Plan", RefreshCcw],
              ["GIFT", "Gift a Wash", Gift],
              ["REDO", "Free Redo", Sparkles],
            ] as const).map(([key, label, Icon]) => (
              <Button key={key} variant={activeTab === key ? "default" : "outline"} size="sm" onClick={() => setActiveTab(key)}>
                <Icon className="w-4 h-4 mr-1.5" /> {label}
              </Button>
            ))}
          </div>

          {activeTab === "BOOK" && (
            <BookVisitPanel
              customer={foundCustomer} subscriptions={customerSubs} jobs={allJobs}
              createJob={createJob} city={city} currentUser={currentUser}
            />
          )}
          {activeTab === "RESCHEDULE" && (
            <RescheduleCancelPanel jobs={customerJobs} updateJob={updateJob} currentUser={currentUser} />
          )}
          {activeTab === "RENEW" && (
            <RenewPlanPanel
              customer={foundCustomer} subscriptions={customerSubs} jobs={customerJobs}
              createSubscription={createSubscription} createJob={createJob} city={city} currentUser={currentUser}
            />
          )}
          {activeTab === "GIFT" && (
            <GiftPanel customer={foundCustomer} city={city} />
          )}
          {activeTab === "REDO" && (
            <FreeRedoPanel customer={foundCustomer} jobs={customerJobs} createJob={createJob} city={city} currentUser={currentUser} />
          )}
        </>
      )}
    </div>
  );
}

export default CCECustomerService;
