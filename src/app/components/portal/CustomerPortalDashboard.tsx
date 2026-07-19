/**
 * CustomerPortalDashboard — the real "My Bookings" home screen.
 * Every figure here is pulled from the same real Job and
 * CustomerSubscription records the business side already uses —
 * getJobsByCustomerId() and getSubscriptionsByCustomerId(), not a
 * separate customer-facing dataset that could ever disagree with what
 * staff see internally.
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../../contexts/CustomerContext";
import { useJobs } from "../../contexts/JobContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import { useCustomerPortalAuth } from "./CustomerPortalAuthContext";
import { Car, Calendar, LogOut, MapPin, RadioTower } from "lucide-react";

const JOB_STATUS_LABELS: Record<string, string> = {
  Unassigned: "Scheduled",
  Assigned: "Team assigned",
  Acknowledged: "Team assigned",
  "In Progress": "Wash in progress",
  Completed: "Completed",
  Verified: "Completed",
  Failed: "Not completed",
};

export function CustomerPortalDashboard() {
  const { loggedInCustomerId, logout } = useCustomerPortalAuth();
  const { customers } = useCustomers();
  const { getJobsByCustomerId } = useJobs();
  const { getSubscriptionsByCustomerId } = useCustomerSubscriptions();
  const navigate = useNavigate();

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
    .filter((j: any) => j.scheduledDate >= today && j.status !== "Completed" && j.status !== "Verified" && j.status !== "Failed")
    .sort((a: any, b: any) => a.scheduledDate.localeCompare(b.scheduledDate));
  const pastJobs = allJobs
    .filter((j: any) => j.status === "Completed" || j.status === "Verified" || j.scheduledDate < today)
    .sort((a: any, b: any) => b.scheduledDate.localeCompare(a.scheduledDate));

  const subscriptions = useMemo(
    () => (loggedInCustomerId ? getSubscriptionsByCustomerId(loggedInCustomerId) : []),
    [loggedInCustomerId, getSubscriptionsByCustomerId]
  );
  const activeSubscription = subscriptions.find((s: any) => s.status === "Active");

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
                <div key={job.jobId} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{job.packageName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{job.scheduledDate} · {job.timeSlot}</p>
                    <p className="text-xs text-blue-600 mt-1">{JOB_STATUS_LABELS[job.status] || job.status}</p>
                  </div>
                  {(job.status === "Assigned" || job.status === "Acknowledged" || job.status === "In Progress") && (
                    <a href={`/track/${job.jobId}`} className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 rounded-full px-3 py-1.5">
                      <RadioTower className="w-3 h-3" /> Track
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
}

export default CustomerPortalDashboard;
