/**
 * CustomerPortalDashboard — the real "My Bookings" home screen.
 * Every figure here is pulled from the same real Job and
 * CustomerSubscription records the business side already uses —
 * getJobsByCustomerId() and getSubscriptionsByCustomerId(), not a
 * separate customer-facing dataset that could ever disagree with what
 * staff see internally.
 *
 * Reschedule is a real REQUEST, not direct self-service — validated
 * against a real, adjustable policy (reschedulePolicy.ts), and only
 * takes effect once a staff member approves it (Operations Manager app,
 * Reschedule Requests tab). Cancellation stays direct self-service,
 * since that's a one-way action the customer can safely make themselves.
 */

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../../contexts/CustomerContext";
import { useJobs } from "../../contexts/JobContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import { useCustomerPortalAuth } from "./CustomerPortalAuthContext";
import { useCity } from "../../contexts/CityContext";
import { RESCHEDULE_POLICY, isReschedulePermitted } from "../../config/reschedulePolicy";
import { accountingEntryService, isRefundEligible, type RefundRequest } from "../../services/accountingEntryService";
import { getSubscriptionPrice, type VehicleCategory, type PlanType } from "../../data/subscriptionPlans";
import { Car, Calendar, LogOut, MapPin, RadioTower, X, Clock, Menu, Wallet, User, Star, Tag, Bell } from "lucide-react";
import { toast } from "sonner";
import { seedPortalTestData, seedSampleOffers } from "../../services/portalTestDataSeed";
import { planSyncService } from "../../services/planSyncService";

const JOB_STATUS_LABELS: Record<string, string> = {
  Unassigned: "Scheduled",
  Assigned: "Team assigned",
  Acknowledged: "Team assigned",
  "In Progress": "Wash in progress",
  Completed: "Completed",
  Verified: "Completed",
  Failed: "Not completed",
  Cancelled: "Cancelled",
};

const STATUS_STAGES = ["Unassigned", "Assigned", "In Progress", "Completed"] as const;
const STAGE_LABELS: Record<string, string> = {
  Unassigned: "Scheduled",
  Assigned: "Team Assigned",
  "In Progress": "In Progress",
  Completed: "Completed",
};

function JobStatusStrip({ status }: { status: string }) {
  // Acknowledged and Assigned share the same real stage in this strip -
  // both mean "a real team member is on this job," just at different
  // real sub-states the customer doesn't need to distinguish visually.
  const normalized = status === "Acknowledged" ? "Assigned" : status === "Verified" ? "Completed" : status;
  const currentIndex = STATUS_STAGES.indexOf(normalized as typeof STATUS_STAGES[number]);
  if (currentIndex < 0) return null; // Failed/Cancelled jobs don't show this strip

  return (
    <div className="flex items-center mt-3">
      {STATUS_STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full ${i <= currentIndex ? "bg-blue-600" : "bg-gray-200"}`} />
            <span className={`text-[10px] mt-1 whitespace-nowrap ${i <= currentIndex ? "text-blue-700 font-medium" : "text-gray-400"}`}>
              {STAGE_LABELS[stage]}
            </span>
          </div>
          {i < STATUS_STAGES.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 ${i < currentIndex ? "bg-blue-600" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function CustomerPortalDashboard() {
  const { loggedInCustomerId, logout } = useCustomerPortalAuth();
  const { customers } = useCustomers();
  const { getJobsByCustomerId, updateJob, createJob } = useJobs();
  const { getSubscriptionsByCustomerId } = useCustomerSubscriptions();
  const navigate = useNavigate();

  const [rescheduleJobId, setRescheduleJobId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState("");
  const [cancelJobId, setCancelJobId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [lastViewedNotifAt, setLastViewedNotifAt] = useState(() => localStorage.getItem("cc360_portal_notif_last_viewed") || "");
  const [ratingJobId, setRatingJobId] = useState<string | null>(null);
  const [selectedStars, setSelectedStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const { city, cityInfo } = useCity();
  const [refundJobId, setRefundJobId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const refreshRefunds = () => setRefundRequests(accountingEntryService.getRefundRequests(city).filter((r) => r.customerId === loggedInCustomerId));

  const customer = useMemo(
    () => customers.find((c: any) => c.customerId === loggedInCustomerId),
    [customers, loggedInCustomerId]
  );

  const allJobs = useMemo(
    () => (loggedInCustomerId ? getJobsByCustomerId(loggedInCustomerId) : []),
    [loggedInCustomerId, getJobsByCustomerId]
  );

  // Real notification feed - derived from the customer's actual current
  // job and refund state, using the real timestamps already on those
  // records (updatedAt, reviewedAt, paidAt). Not a separate event log
  // that could miss an update - this reflects whatever is genuinely
  // true right now, every time it's computed.
  const notifications = useMemo(() => {
    const items: Array<{ id: string; text: string; time: string; type: "info" | "success" | "warning" }> = [];
    allJobs.forEach((j: any) => {
      if (j.status === "Assigned" || j.status === "Acknowledged") {
        items.push({ id: `${j.jobId}-assigned`, text: `A team member was assigned to your ${j.packageName}`, time: j.updatedAt, type: "info" });
      }
      if ((j.status === "Completed" || j.status === "Verified") && !j.customerRating) {
        items.push({ id: `${j.jobId}-rate`, text: `Your ${j.packageName} is complete — rate your experience`, time: j.updatedAt, type: "info" });
      }
      if (j.customerRating) {
        items.push({ id: `${j.jobId}-rated`, text: `Thanks for rating your ${j.packageName} ${j.customerRating} stars`, time: j.customerRatingSubmittedAt || j.updatedAt, type: "success" });
      }
      if (j.rescheduleRequestStatus === "approved") {
        items.push({ id: `${j.jobId}-resched-ok`, text: `Your reschedule request was approved — now ${j.scheduledDate}`, time: j.updatedAt, type: "success" });
      }
      if (j.rescheduleRequestStatus === "rejected") {
        items.push({ id: `${j.jobId}-resched-no`, text: `Your reschedule request wasn't approved`, time: j.updatedAt, type: "warning" });
      }
      if (j.status === "Cancelled") {
        items.push({ id: `${j.jobId}-cancelled`, text: `Your ${j.packageName} booking was cancelled`, time: j.cancelledAt || j.updatedAt, type: "info" });
      }
    });
    refundRequests.forEach((r) => {
      if (r.status === "Approved") items.push({ id: `${r.id}-approved`, text: `Your refund of ₹${r.amount.toLocaleString("en-IN")} was approved`, time: r.reviewedAt || r.requestedAt, type: "success" });
      if (r.status === "Rejected") items.push({ id: `${r.id}-rejected`, text: `Your refund request wasn't approved`, time: r.reviewedAt || r.requestedAt, type: "warning" });
      if (r.status === "Paid") items.push({ id: `${r.id}-paid`, text: `Your refund of ₹${r.amount.toLocaleString("en-IN")} has been paid`, time: r.paidAt || r.requestedAt, type: "success" });
    });
    return items
      .filter((n) => n.time)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 20);
  }, [allJobs, refundRequests]);

  const today = new Date().toISOString().split("T")[0];
  const upcomingJobs = allJobs
    .filter((j: any) => j.scheduledDate >= today && j.status !== "Completed" && j.status !== "Verified" && j.status !== "Failed" && j.status !== "Cancelled")
    .sort((a: any, b: any) => a.scheduledDate.localeCompare(b.scheduledDate));
  const pastJobs = allJobs
    .filter((j: any) => j.status === "Completed" || j.status === "Verified" || j.status === "Cancelled" || j.scheduledDate < today)
    .sort((a: any, b: any) => b.scheduledDate.localeCompare(a.scheduledDate));

  const subscriptions = useMemo(
    () => (loggedInCustomerId ? getSubscriptionsByCustomerId(loggedInCustomerId) : []),
    [loggedInCustomerId, getSubscriptionsByCustomerId]
  );
  const activeSubscription = subscriptions.find((s: any) => s.status === "Active");

  const activePromotions = useMemo(
    () => planSyncService.getPromotions().filter((p) => p.active && p.startDate <= today && p.endDate >= today),
    [today]
  );
  const activeCoupons = useMemo(
    () => planSyncService.getCoupons().filter((c) => c.active && c.validFrom <= today && c.validTo >= today && c.usedCount < c.maxUses),
    [today]
  );

  const openReschedule = (job: any) => {
    if (job.rescheduleRequestStatus === "pending") {
      toast.info("A reschedule request for this booking is already pending approval.");
      return;
    }
    const check = isReschedulePermitted(job.scheduledDate, job.timeSlot, job.rescheduleCount || 0);
    if (!check.allowed) {
      toast.error(check.reason);
      return;
    }
    setRescheduleJobId(job.jobId);
    setNewDate(job.scheduledDate);
    setNewSlot(job.timeSlot);
  };

  const submitRescheduleRequest = () => {
    if (!rescheduleJobId || !newDate || !newSlot) return;
    updateJob(rescheduleJobId, {
      rescheduleRequestStatus: "pending",
      rescheduleRequestedDate: newDate,
      rescheduleRequestedSlot: newSlot,
    });
    toast.success("Reschedule request submitted — you'll be notified once it's reviewed.");
    setRescheduleJobId(null);
  };

  const openCancel = (job: any) => {
    if (job.scheduledDate <= today) {
      toast.error("This wash is scheduled for today and can no longer be cancelled here — please contact support.");
      return;
    }
    setCancelJobId(job.jobId);
  };

  const confirmCancel = () => {
    if (!cancelJobId) return;
    updateJob(cancelJobId, { status: "Cancelled", cancellationReason: "Cancelled by customer via portal", cancelledAt: new Date().toISOString() });
    toast.success("Wash cancelled.");
    setCancelJobId(null);
  };

  useEffect(() => {
    if (loggedInCustomerId) refreshRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInCustomerId, city]);

  useEffect(() => {
    if (customers.length === 0) return;
    try {
      const result = seedPortalTestData({ customers, createJob, updateJob });
      if (result.seeded) {
        const msg = result.failures > 0
          ? `Test data seeded — ${result.count} added, ${result.failures} skipped (see console).`
          : `Test data seeded — ${result.count} sample jobs added for feature testing.`;
        toast.info(msg);
      }
    } catch (err) {
      // Defense in depth - even if something inside the seed function
      // itself throws unexpectedly, this must never crash the real
      // customer's dashboard.
      console.error("[portalTestDataSeed] Seeding failed entirely, dashboard unaffected:", err);
    }
    try {
      seedSampleOffers(planSyncService);
    } catch (err) {
      console.error("[portalTestDataSeed] Offers seeding failed, dashboard unaffected:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers.length]);

  const openRefundRequest = (job: any) => {
    setRefundJobId(job.jobId);
    setRefundReason("");
  };

  const submitRefundRequest = () => {
    if (!refundJobId || !customer) return;
    const job = allJobs.find((j: any) => j.jobId === refundJobId);
    if (!job) return;
    const category = job.vehicleDetails?.category as VehicleCategory | undefined;
    const planType = job.packageType as PlanType | undefined;
    const realAmount = category && planType ? getSubscriptionPrice(category, planType) : "NA";
    accountingEntryService.requestRefund(
      {
        jobId: job.jobId,
        customerId: customer.customerId,
        customerName: `${customer.firstName} ${customer.lastName}`,
        amount: typeof realAmount === "number" ? realAmount : 0,
        reason: refundReason || "Requested via customer portal",
        city: cityInfo.displayName,
        cityId: city,
      },
      city
    );
    if (realAmount === "NA") {
      toast.info("Request submitted — the amount will need to be confirmed manually during review.");
    } else {
      toast.success("Refund request submitted — you'll be notified once it's reviewed.");
    }
    setRefundJobId(null);
    refreshRefunds();
  };

  const openRatingPrompt = (job: any) => {
    setRatingJobId(job.jobId);
    setSelectedStars(0);
    setRatingComment("");
  };

  const submitRating = () => {
    if (!ratingJobId || selectedStars === 0) {
      toast.error("Please select a star rating");
      return;
    }
    updateJob(ratingJobId, {
      customerRating: selectedStars,
      customerRatingComment: ratingComment || undefined,
      customerRatingSubmittedAt: new Date().toISOString(),
    });
    toast.success("Thanks for your feedback!");
    setRatingJobId(null);
  };

  const unreadCount = lastViewedNotifAt
    ? notifications.filter((n) => new Date(n.time).getTime() > new Date(lastViewedNotifAt).getTime()).length
    : notifications.length;

  const openNotifications = () => {
    setNotifPanelOpen(true);
    const now = new Date().toISOString();
    localStorage.setItem("cc360_portal_notif_last_viewed", now);
    setLastViewedNotifAt(now);
  };

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/portal/login");
  };

  if (!loggedInCustomerId || !customer) {
    navigate("/portal/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {customer.firstName?.[0] || "?"}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{customer.firstName} {customer.lastName}</p>
            <p className="text-xs text-gray-500">{customer.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openNotifications} className="relative text-gray-500 hover:text-gray-700 p-1">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => setMenuOpen(true)} className="text-gray-500 hover:text-gray-700 p-1">
            <Menu className="w-6 h-6" />
          </button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-5">

        <button
          onClick={() => navigate("/portal/book")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 flex items-center justify-between"
        >
          <div className="text-left">
            <p className="font-semibold">Book a Wash</p>
            <p className="text-sm opacity-90 mt-0.5">Choose a plan and schedule your next wash</p>
          </div>
          <Car className="w-8 h-8 opacity-90" />
        </button>

        {/* Active Offers - real data, business-managed */}
        {(activePromotions.length > 0 || activeCoupons.length > 0) && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4 text-orange-600" /> Offers For You
            </h2>
            <div className="space-y-2">
              {activePromotions.map((promo) => (
                <div key={promo.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-orange-900">{promo.badge || promo.name}</p>
                  <p className="text-xs text-orange-700 mt-0.5">{promo.description}</p>
                  {!promo.autoApply && <p className="text-xs text-orange-600 mt-1">Applied automatically at checkout</p>}
                </div>
              ))}
              {activeCoupons.map((coupon) => (
                <div key={coupon.id} className="bg-white border border-dashed border-orange-300 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900 tracking-wide">{coupon.code}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{coupon.description}</p>
                  </div>
                  <p className="text-sm font-semibold text-orange-700">
                    {coupon.type === "percent" ? `${coupon.value}% off` : `₹${coupon.value} off`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active subscription card */}
        {activeSubscription && (
          <div className="bg-blue-600 text-white rounded-2xl p-5">
            <p className="text-xs opacity-80">Active Plan</p>
            <p className="text-lg font-bold mt-1">{activeSubscription.packageName}</p>
            <p className="text-sm opacity-90 mt-1">{activeSubscription.frequency}</p>
            {activeSubscription.renewalDate && (
              <p className="text-xs opacity-75 mt-3">Renews {activeSubscription.renewalDate}</p>
            )}
          </div>
        )}

        {/* Upcoming bookings */}
        <div>
          <h2 id="upcoming-section" className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" /> Upcoming
          </h2>
          {upcomingJobs.length === 0 ? (
            <div className="bg-white rounded-xl border p-6 text-center text-sm text-gray-400">
              No upcoming washes scheduled.
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingJobs.map((job: any) => (
                <div key={job.jobId} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{job.packageName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{job.scheduledDate} · {job.timeSlot}</p>
                      <p className="text-xs text-blue-600 mt-1">{JOB_STATUS_LABELS[job.status] || job.status}</p>
                      {job.paymentStatus === "Pending" && (
                        <p className="text-xs text-amber-700 mt-0.5">₹ Pay at doorstep</p>
                      )}
                    </div>
                    {(job.status === "Assigned" || job.status === "Acknowledged" || job.status === "In Progress") && (
                      <a href={`/track/${job.jobId}`} className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 rounded-full px-3 py-1.5">
                        <RadioTower className="w-3 h-3" /> Track
                      </a>
                    )}
                  </div>

                  <JobStatusStrip status={job.status} />

                  {job.rescheduleRequestStatus === "pending" && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
                      <Clock className="w-3 h-3" /> Reschedule to {job.rescheduleRequestedDate} ({job.rescheduleRequestedSlot}) pending approval
                    </div>
                  )}
                  {job.rescheduleRequestStatus === "rejected" && (
                    <div className="text-xs text-red-600 mt-2">Your last reschedule request wasn't approved. Please contact support or try a different time.</div>
                  )}

                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <button onClick={() => openReschedule(job)} className="text-xs text-gray-600 border rounded-lg px-3 py-1.5">
                      Request Reschedule
                    </button>
                    <button onClick={() => openCancel(job)} className="text-xs text-red-600 border border-red-200 rounded-lg px-3 py-1.5">
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Reschedule requests need at least {RESCHEDULE_POLICY.minHoursBeforeSlot} hours' notice and are reviewed before they're confirmed.
            Cancellation is available up until the day before your scheduled wash.
          </p>
        </div>

        {/* Wash history */}
        <div>
          <h2 id="history-section" className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Car className="w-4 h-4 text-gray-600" /> Wash History
          </h2>
          {pastJobs.length === 0 ? (
            <div className="bg-white rounded-xl border p-6 text-center text-sm text-gray-400">
              No past washes yet.
            </div>
          ) : (
            <div className="space-y-2">
              {pastJobs.slice(0, 10).map((job: any) => {
                const existingRefund = refundRequests.find((r) => r.jobId === job.jobId);
                const isCompleted = job.status === "Completed" || job.status === "Verified";
                return (
                  <div key={job.jobId} className="bg-white rounded-xl border p-4">
                    <p className="font-medium text-gray-900 text-sm">{job.packageName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{job.scheduledDate}</p>
                    <p className="text-xs text-gray-400 mt-1">{JOB_STATUS_LABELS[job.status] || job.status}</p>

                    {isCompleted && (
                      job.customerRating ? (
                        <div className="flex items-center gap-0.5 mt-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`w-3.5 h-3.5 ${n <= job.customerRating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                          ))}
                        </div>
                      ) : (
                        <button onClick={() => openRatingPrompt(job)} className="flex items-center gap-1 text-xs text-amber-700 border border-amber-200 rounded-lg px-3 py-1.5 mt-2">
                          <Star className="w-3.5 h-3.5" /> Rate this wash
                        </button>
                      )
                    )}

                    {existingRefund ? (
                      <p className={`text-xs mt-2 ${existingRefund.status === "Paid" ? "text-green-600" : existingRefund.status === "Rejected" ? "text-red-600" : "text-amber-600"}`}>
                        Refund {existingRefund.status.toLowerCase()}
                      </p>
                    ) : isRefundEligible(job) ? (
                      <button onClick={() => openRefundRequest(job)} className="text-xs text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 mt-2">
                        Request Refund
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Address on file */}
        <div className="bg-white rounded-xl border p-4">
          <h2 id="address-section" className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-600" /> Saved Address
          </h2>
          <p className="text-sm text-gray-600">
            {customer.address?.line1}{customer.address?.line2 ? `, ${customer.address.line2}` : ""}
          </p>
          <p className="text-sm text-gray-600">{customer.address?.area}, {customer.address?.city} {customer.address?.pinCode}</p>
        </div>

      </div>

      {/* Reschedule request modal */}
      {rescheduleJobId && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-20 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Request a Reschedule</h3>
              <button onClick={() => setRescheduleJobId(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3">This is a request — the new date is confirmed once approved.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Preferred New Date</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                  min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Preferred Time Slot</label>
                <select value={newSlot} onChange={(e) => setNewSlot(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="6:00 AM - 8:00 AM">6:00 AM - 8:00 AM</option>
                  <option value="8:00 AM - 10:00 AM">8:00 AM - 10:00 AM</option>
                  <option value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</option>
                  <option value="6:00 PM - 8:00 PM">6:00 PM - 8:00 PM</option>
                </select>
              </div>
            </div>
            <button onClick={submitRescheduleRequest} className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mt-4">
              Submit Request
            </button>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelJobId && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-20 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Cancel this wash?</h3>
            <p className="text-sm text-gray-500 mb-4">This can't be undone. You can always book again from your dashboard.</p>
            <div className="flex gap-2">
              <button onClick={() => setCancelJobId(null)} className="flex-1 border rounded-xl py-3 font-medium text-gray-700">
                Keep it
              </button>
              <button onClick={confirmCancel} className="flex-1 bg-red-600 text-white rounded-xl py-3 font-medium">
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation menu panel */}
      {menuOpen && (
        <div className="fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Menu</h3>
              <button onClick={() => setMenuOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => { setMenuOpen(false); setAccountPanelOpen(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
              >
                <User className="w-4 h-4 text-gray-500" /> My Account
              </button>
              <button
                onClick={() => { setMenuOpen(false); navigate("/portal/book"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
              >
                <Car className="w-4 h-4 text-gray-500" /> Book a Wash
              </button>
              <button
                onClick={() => scrollToSection("upcoming-section")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
              >
                <Calendar className="w-4 h-4 text-gray-500" /> Upcoming Washes
              </button>
              <button
                onClick={() => scrollToSection("history-section")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
              >
                <Clock className="w-4 h-4 text-gray-500" /> Wash History &amp; Refunds
              </button>
              <button
                onClick={() => scrollToSection("address-section")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
              >
                <MapPin className="w-4 h-4 text-gray-500" /> Saved Address
              </button>
              <div className="border-t my-3" />
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-sm text-red-600"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Notification panel */}
      {notifPanelOpen && (
        <div className="fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setNotifPanelOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button onClick={() => setNotifPanelOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-8">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg text-sm ${
                      n.type === "success" ? "bg-green-50 text-green-800" :
                      n.type === "warning" ? "bg-amber-50 text-amber-800" :
                      "bg-blue-50 text-blue-800"
                    }`}
                  >
                    <p>{n.text}</p>
                    <p className="text-xs opacity-60 mt-1">{new Date(n.time).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating modal */}
      {ratingJobId && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">How was your wash?</h3>
              <button onClick={() => setRatingJobId(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setSelectedStars(n)}>
                  <Star className={`w-9 h-9 ${n <= selectedStars ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Tell us more (optional)"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
            />
            <button onClick={submitRating} className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mt-4">
              Submit
            </button>
          </div>
        </div>
      )}

      {/* My Account panel */}
      {accountPanelOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">My Account</h3>
              <button onClick={() => setAccountPanelOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {customer.firstName?.[0] || "?"}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{customer.firstName} {customer.lastName}</p>
                {customer.createdAt && (
                  <p className="text-xs text-gray-400">Member since {new Date(customer.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-900 font-medium">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-900 font-medium">{customer.email}</span>
                </div>
              )}
              {customer.vehicleDetails && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Vehicle</span>
                  <span className="text-gray-900 font-medium text-right">
                    {customer.vehicleDetails.brand} · {customer.vehicleDetails.color}
                    <br />
                    <span className="text-xs text-gray-500">{customer.vehicleDetails.registrationNumber}</span>
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Address</span>
                <span className="text-gray-900 font-medium text-right">
                  {customer.address?.line1}
                  {customer.address?.line2 ? `, ${customer.address.line2}` : ""}
                  <br />
                  {customer.address?.area}, {customer.address?.city} {customer.address?.pinCode}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund request modal */}
      {refundJobId && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-20 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Request a Refund</h3>
              <button onClick={() => setRefundJobId(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3">A team member will review this request. You'll see the real status here once it's decided.</p>
            <label className="text-xs text-gray-500 mb-1 block">Reason (optional)</label>
            <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Tell us what happened" />
            <button onClick={submitRefundRequest} className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mt-4">
              Submit Request
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default CustomerPortalDashboard;
