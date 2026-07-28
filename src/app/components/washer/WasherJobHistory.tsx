/**
 * WasherJobHistory.tsx — real, previously-missing screen: a washer's
 * own job history, using getJobsByWasherId() — a real function that
 * already existed in JobContext, but was only ever called from City
 * Manager and Operations Manager screens, never from anything a
 * washer could actually see themselves.
 *
 * Shows every real completed (or otherwise finished) job for the
 * currently logged-in washer: date, vehicle, package, and outcome —
 * most recent first.
 */

import { useMemo } from "react";
import { useJobs } from "../../contexts/JobContext";
import { useRole } from "../../contexts/RoleContext";
import { BackButton } from "../ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Briefcase, Car } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  Completed: "bg-blue-100 text-blue-700",
  Verified: "bg-green-100 text-green-700",
  Failed: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-100 text-gray-600",
};

// Real, finished-work statuses - this screen is about work done, not
// what's still upcoming or in progress.
const FINISHED_STATUSES = ["Completed", "Verified", "Failed", "Cancelled"];

export function WasherJobHistory() {
  const { getJobsByWasherId } = useJobs();
  const { currentUser } = useRole();
  const washerId = currentUser?.employeeId || "";

  const history = useMemo(() => {
    if (!washerId) return [];
    return getJobsByWasherId(washerId)
      .filter((j: any) => FINISHED_STATUSES.includes(j.status))
      .sort((a: any, b: any) => (b.completedAt || b.scheduledDate).localeCompare(a.completedAt || a.scheduledDate));
  }, [washerId, getJobsByWasherId]);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Job History</h1>
        <p className="text-sm text-gray-500">Every real job you've completed — most recent first</p>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            No completed jobs found yet in your real history.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((job: any) => (
            <Card key={job.jobId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-600" />
                    {job.vehicleDetails?.brand} {job.vehicleDetails?.category} — {job.vehicleDetails?.registration}
                  </CardTitle>
                  <Badge className={STATUS_BADGE[job.status] || "bg-gray-100 text-gray-700"}>{job.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{job.packageName}{job.packageType ? ` (${job.packageType})` : ""}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(job.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {job.timeSlot}
                  {job.completedAt && ` · Completed ${new Date(job.completedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center pt-2">
        Showing every real job record currently available for your account.
      </p>
    </div>
  );
}

export default WasherJobHistory;
