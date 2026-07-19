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

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../../contexts/CustomerContext";
import { useJobs } from "../../contexts/JobContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import { useCustomerPortalAuth } from "./CustomerPortalAuthContext";
import { RESCHEDULE_POLICY, isReschedulePermitted } from "../../config/reschedulePolicy";
import { Car, Calendar, LogOut, MapPin, RadioTower, X, Clock } from "lucide-react";
import { toast } from "sonner";

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

export function CustomerPortalDashboard() {
  const { loggedInCustomerId, logout } = useCustomerPortalAuth();
  const { customers } = useCustomers();
  const { getJobsByCustomerId, updateJob } = useJobs();
  const { getSubscriptionsByCustomerId } = useCustomerSubscriptions();
  const navigate = useNavigate();

  const [rescheduleJobId, setRescheduleJobId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState("");
  const [cancelJobId, setCancelJobId] = useState<string | null>(null);

  const customer = useMemo(
    () => customers.find((c: any) => c.customerId === loggedInCustomerId),
    [customers, loggedInCustomerId]
  );

  const allJobs = useMemo(
    () => (loggedInCustomerId ? getJobsByCustomerId(loggedInCustomerId) : []),
    [loggedInCustomerId, getJobsByCustomerId]
  );
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
        <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
          <LogOut className="w-5 h-5" />
        </button>
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
          <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
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
          <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Car className="w-4 h-4 text-gray-600" /> Wash History
          </h2>
          {pastJobs.length === 0 ? (
            <div className="bg-white rounded-xl border p-6 text-center text-sm text-gray-400">
              No past washes yet.
            </div>
          ) : (
            <div className="space-y-2">
              {pastJobs.slice(0, 10).map((job: any) => (
                <div key={job.jobId} className="bg-white rounded-xl border p-4">
                  <p className="font-medium text-gray-900 text-sm">{job.packageName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{job.scheduledDate}</p>
                  <p className="text-xs text-gray-400 mt-1">{JOB_STATUS_LABELS[job.status] || job.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Address on file */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
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

    </div>
  );
}

export default CustomerPortalDashboard;
