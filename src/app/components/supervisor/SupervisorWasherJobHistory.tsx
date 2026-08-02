/**
 * SupervisorWasherJobHistory.tsx — real, previously-missing screen: lets a
 * supervisor pick any washer on their real team (the same pincode-matched
 * team SupervisorContext already computes) and browse that washer's real,
 * complete job history — no 60-day cap, since a supervisor legitimately
 * needs to look further back than their washer's own self-view does.
 */

import { useEffect, useMemo, useState } from "react";
import { useJobs } from "../../contexts/JobContext";
import { useSupervisor } from "../../contexts/SupervisorContext";
import { BackButton } from "../ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Briefcase, Car } from "lucide-react";
import { DateRangeFilterBar, computeDateRange, isWithinDateRange, type DateRangePreset } from "../shared/DateRangeFilterBar";

const STATUS_BADGE: Record<string, string> = {
  Completed: "bg-blue-100 text-blue-700",
  Verified: "bg-green-100 text-green-700",
  Failed: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-100 text-gray-600",
};

const FINISHED_STATUSES = ["Completed", "Verified", "Failed", "Cancelled"];

export function SupervisorWasherJobHistory() {
  const { getJobsByWasherId } = useJobs();
  const { team } = useSupervisor();

  const [selectedWasherId, setSelectedWasherId] = useState(team[0]?.id || "");
  const [preset, setPreset] = useState<DateRangePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Real fix: SupervisorContext's team loads asynchronously after mount, so
  // team[0]?.id was always empty at the moment useState's initial value was
  // captured. Pick a default once the real team actually arrives.
  useEffect(() => {
    if (!selectedWasherId && team.length > 0) setSelectedWasherId(team[0].id);
  }, [team, selectedWasherId]);

  const dateRange = useMemo(() => computeDateRange(preset, customFrom, customTo), [preset, customFrom, customTo]);

  const history = useMemo(() => {
    if (!selectedWasherId) return [];
    return getJobsByWasherId(selectedWasherId)
      .filter((j: any) => FINISHED_STATUSES.includes(j.status))
      .filter((j: any) => isWithinDateRange(j.completedAt || j.scheduledDate, dateRange))
      .sort((a: any, b: any) => (b.completedAt || b.scheduledDate).localeCompare(a.completedAt || a.scheduledDate));
  }, [selectedWasherId, getJobsByWasherId, dateRange]);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Washer Job History</h1>
        <p className="text-sm text-gray-500">Complete real job history for any washer on your team</p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Select value={selectedWasherId} onValueChange={setSelectedWasherId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select washer" /></SelectTrigger>
            <SelectContent>
              {team.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name} ({w.id})</SelectItem>)}
            </SelectContent>
          </Select>
          <DateRangeFilterBar
            preset={preset} onPresetChange={setPreset}
            customFrom={customFrom} customTo={customTo}
            onCustomFromChange={setCustomFrom} onCustomToChange={setCustomTo}
          />
        </CardContent>
      </Card>

      {team.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-gray-500">No washers found on your team yet.</CardContent></Card>
      )}

      {team.length > 0 && history.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            No completed jobs found for this washer in the selected range.
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
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
    </div>
  );
}

export default SupervisorWasherJobHistory;
