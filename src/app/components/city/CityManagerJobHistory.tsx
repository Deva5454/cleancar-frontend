/**
 * CityManagerJobHistory.tsx — real, previously-missing screen: lets a City
 * Manager browse completed job history across every washer in their city,
 * from the start of real records to date — no cap, since a City Manager
 * legitimately needs the full picture, unlike the washer's own 60-day
 * self-view or even the supervisor's per-team view.
 */

import { useMemo, useState } from "react";
import { useJobs } from "../../contexts/JobContext";
import { useCity } from "../../contexts/CityContext";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
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
const WASHER_ROLES = ["Car Washer Full Time", "Car Washer Part Time", "Car Washer"];

// Same real cityId <-> city-name mapping used across the app (RoleContext.tsx) —
// EmployeeDatabaseRecord.workLocation is stored as a plain city name ("Surat"),
// not the "CITY-SURAT" format cityId uses, so a naive === comparison
// between them always fails (the exact bug already fixed elsewhere this
// session in WasherIssuances/MonthEndVerification/ShortTermAdvanceForm).
const CITY_NAME_FROM_ID: Record<string, string> = {
  "CITY-SURAT": "Surat",
  "CITY-MUMBAI": "Mumbai",
  "CITY-AHMEDABAD": "Ahmedabad",
};

export function CityManagerJobHistory() {
  const { allJobs } = useJobs();
  const { city: cityId } = useCity();

  const cityName = CITY_NAME_FROM_ID[cityId] || cityId;
  // Real seed data isn't consistent on whether workLocation stores the
  // cityId format ("CITY-SURAT") or a plain city name ("Surat") — check
  // both rather than assuming one, so this doesn't silently show zero
  // washers depending on which seeding path populated the record.
  const washers = useMemo(
    () => employeeDatabaseService.getAll().filter(
      (e: any) => WASHER_ROLES.includes(e.designation) && e.status === "Active" &&
        (e.cityId === cityId || e.workLocation === cityId || e.workLocation === cityName)
    ),
    [cityId, cityName]
  );
  const washerNameById = useMemo(() => {
    const map: Record<string, string> = {};
    washers.forEach((w: any) => { map[w.id] = w.fullName; });
    return map;
  }, [washers]);

  const [selectedWasherId, setSelectedWasherId] = useState("all");
  const [preset, setPreset] = useState<DateRangePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const dateRange = useMemo(() => computeDateRange(preset, customFrom, customTo), [preset, customFrom, customTo]);

  const history = useMemo(() => {
    const washerIds = new Set(washers.map((w: any) => w.id));
    return allJobs
      .filter((j: any) => FINISHED_STATUSES.includes(j.status) && j.washerId && washerIds.has(j.washerId))
      .filter((j: any) => selectedWasherId === "all" || j.washerId === selectedWasherId)
      .filter((j: any) => isWithinDateRange(j.completedAt || j.scheduledDate, dateRange))
      .sort((a: any, b: any) => (b.completedAt || b.scheduledDate).localeCompare(a.completedAt || a.scheduledDate));
  }, [allJobs, washers, selectedWasherId, dateRange]);

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Washers — Job History</h1>
        <p className="text-sm text-gray-500">Complete real job history for every washer in {cityName} — from the start of records to date</p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Select value={selectedWasherId} onValueChange={setSelectedWasherId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select washer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Washers ({washers.length})</SelectItem>
              {washers.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.fullName} ({w.id})</SelectItem>)}
            </SelectContent>
          </Select>
          <DateRangeFilterBar
            preset={preset} onPresetChange={setPreset}
            customFrom={customFrom} customTo={customTo}
            onCustomFromChange={setCustomFrom} onCustomToChange={setCustomTo}
          />
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500">{history.length} job{history.length === 1 ? "" : "s"} found</p>

      {washers.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-gray-500">No active washers found for {cityName} yet.</CardContent></Card>
      )}

      {washers.length > 0 && history.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            No completed jobs found for the selected washer/range.
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
                  Washer: {washerNameById[job.washerId] || job.washerId} ·{" "}
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

export default CityManagerJobHistory;
