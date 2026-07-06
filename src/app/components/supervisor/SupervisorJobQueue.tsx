/**
 * SupervisorJobQueue
 * Shown to the on-duty supervisor.
 * - Lists all unassigned jobs for today routed to them
 * - Shows eligible washers per job (shift-aware, 30-min cutoff)
 * - One-tap assign
 * - Warns when assigning to a washer with < 30 min left
 * - New washer joining / replacement workflow
 */
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Clock, CheckCircle2, AlertTriangle, Users, MapPin,
  Car, UserPlus, RefreshCw, ChevronRight, XCircle, UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { useJobs } from "../../contexts/JobContext";
import {
  jobRoutingService,
  type EligibleWasher,
  type DutyStatus,
} from "../../services/jobRoutingService";
import { shiftRosterService } from "../../services/shiftRosterService";
import { DataService } from "../../services/DataService";

const CITY_ID = "CITY-SURAT";

function getEmployees() {
  try {
    return DataService.get<any>("EMPLOYEES")
      .filter((e: any) => ["Car Washer", "Car Washer Full Time", "Car Washer Part Time", "Supervisor"].includes(e.role));
  } catch { return []; }
}

function timeLabel(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ── Washer card in assign panel ────────────────────────────────────────────────
function WasherCard({ w, onAssign, jobTime }: { w: EligibleWasher; onAssign: () => void; jobTime: string }) {
  const urgent = w.minutesRemaining < 60;
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${urgent ? "border-orange-300 bg-orange-50" : "border-green-200 bg-green-50"}`}>
      <div>
        <p className="font-semibold text-sm text-gray-900">{w.employeeName}</p>
        <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Until {timeLabel(w.shiftEnd)}</span>
          <span>·</span>
          <span>{w.minutesRemaining}m left</span>
          <span>·</span>
          <span>{w.currentJobCount} job{w.currentJobCount !== 1 ? "s" : ""} today</span>
          {w.zone && <><span>·</span><span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{w.zone}</span></>}
        </div>
        {urgent && <p className="text-xs text-orange-700 font-medium mt-0.5">⚠ Shift ends soon</p>}
      </div>
      <Button size="sm" onClick={onAssign} className={urgent ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}>
        Assign
      </Button>
    </div>
  );
}

export function SupervisorJobQueue() {
  const { currentUser, currentRole } = useRole();
  const { jobs, assignJobToWasher }  = useJobs();

  const supId   = currentUser?.employeeId ?? currentUser?.id ?? "";
  const today   = new Date().toISOString().slice(0, 10);
  const [refreshKey, setRefreshKey]     = useState(0);
  const [selectedJob, setSelectedJob]   = useState<any>(null);
  const [routing, setRouting]           = useState<ReturnType<typeof jobRoutingService.routeJob> | null>(null);
  const [showOnboard, setShowOnboard]   = useState(false);
  const [showReplace, setShowReplace]   = useState(false);
  const [dutyStatuses, setDutyStatuses] = useState<DutyStatus[]>([]);

  // Onboard form
  const [onboardName, setOnboardName]   = useState("");
  const [onboardId, setOnboardId]       = useState("");
  const [onboardRole, setOnboardRole]   = useState<"Car Washer" | "Supervisor">("Car Washer");
  const [onboardShift, setOnboardShift] = useState<"Morning" | "Split" | "Evening">("Morning");
  const [onboardDayOff, setOnboardDayOff] = useState<any>("Sun");

  // Replace form
  const [outgoingId, setOutgoingId]     = useState("");
  const [replaceId, setReplaceId]       = useState("");
  const [replaceName, setReplaceName]   = useState("");
  const [replaceShift, setReplaceShift] = useState<"Morning" | "Split" | "Evening">("Morning");
  const [replaceDayOff, setReplaceDayOff] = useState<any>("Sun");

  useEffect(() => {
    const emps = getEmployees();
    const statuses = emps
      .filter((e: any) => ["Car Washer", "Car Washer Full Time", "Car Washer Part Time"].includes(e.role))
      .map((e: any) => jobRoutingService.getDutyStatus(e.id ?? e.employeeId, CITY_ID));
    setDutyStatuses(statuses);
  }, [refreshKey]);

  // Jobs routed to this supervisor — unassigned today
  const myUnassigned = useMemo(() =>
    jobs.filter(j => j.scheduledDate === today && j.status === "Unassigned" &&
      (!j.supervisorId || j.supervisorId === supId) && j.cityId === CITY_ID),
    [jobs, today, supId]);

  const onDutyWashers  = dutyStatuses.filter(d => d.isOnDuty);
  const absentWashers  = dutyStatuses.filter(d => d.isAbsent);
  const offDayWashers  = dutyStatuses.filter(d => d.isWeekOff);

  const handleOpenAssign = (job: any) => {
    setSelectedJob(job);
    const result = jobRoutingService.routeJob(CITY_ID, job.timeSlot, job.location?.area);
    setRouting(result);
  };

  const handleAssign = async (washerId: string, washerName: string) => {
    if (!selectedJob) return;
    const check = jobRoutingService.isWasherEligibleForJob(washerId, CITY_ID, selectedJob.timeSlot);
    if (!check.eligible) {
      toast.error(check.reason);
      return;
    }
    if (check.minutesRemaining < 60) {
      toast.warning(`${washerName}'s shift ends in ${check.minutesRemaining} min — assigning anyway`, { duration: 3000 });
    }
    await assignJobToWasher(selectedJob.jobId, washerId, washerName);
    toast.success(`Job assigned to ${washerName}`);
    setSelectedJob(null); setRouting(null);
  };

  const handleOnboard = () => {
    if (!onboardName.trim() || !onboardId.trim()) { toast.error("Enter name and employee ID"); return; }
    jobRoutingService.onboardEmployee({
      cityId: CITY_ID, employeeId: onboardId, employeeName: onboardName,
      role: onboardRole, supervisorId: supId, joiningDate: today,
      defaultShift: onboardShift, weekOffDay: onboardDayOff,
    });
    toast.success(`${onboardName} added to roster — ${onboardShift} shift`);
    setShowOnboard(false); setOnboardName(""); setOnboardId(""); setRefreshKey(k => k + 1);
  };

  const handleReplace = () => {
    if (!outgoingId || !replaceId.trim() || !replaceName.trim()) { toast.error("Fill all fields"); return; }
    jobRoutingService.replaceEmployee({
      cityId: CITY_ID, outgoingId, incomingId: replaceId, incomingName: replaceName,
      incomingRole: "Car Washer", effectiveDate: today, supervisorId: supId,
      defaultShift: replaceShift, weekOffDay: replaceDayOff,
    });
    toast.success(`${replaceName} now covers all future shifts of the replaced washer`);
    setShowReplace(false); setOutgoingId(""); setReplaceId(""); setReplaceName(""); setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />Job Queue
          </h2>
          <p className="text-xs text-gray-500">Assign unassigned jobs to on-duty washers only</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setRefreshKey(k => k + 1)}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowReplace(true)}>
            <UserCheck className="w-3.5 h-3.5 mr-1" />Replace Washer
          </Button>
          <Button size="sm" onClick={() => setShowOnboard(true)}>
            <UserPlus className="w-3.5 h-3.5 mr-1" />New Joiner
          </Button>
        </div>
      </div>

      {/* Duty overview strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{onDutyWashers.length}</p>
            <p className="text-xs text-green-600">On Duty Now</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{absentWashers.length}</p>
            <p className="text-xs text-red-600">Absent Today</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-500">{offDayWashers.length}</p>
            <p className="text-xs text-gray-500">Week Off</p>
          </CardContent>
        </Card>
      </div>

      {/* Washer duty board */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />Washer Duty Board
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {dutyStatuses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No roster data. Ask HR to publish roster.</p>
            ) : dutyStatuses.map(d => (
              <div key={d.employeeId} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border ${
                d.isOnDuty ? "border-green-200 bg-green-50" :
                d.isAbsent ? "border-red-200 bg-red-50" :
                "border-gray-100 bg-gray-50"
              }`}>
                <div>
                  <p className="font-medium text-gray-900">{d.employeeName}</p>
                  <p className="text-xs text-gray-500">
                    {d.isWeekOff ? "Week Off 🌴" :
                     d.isAbsent  ? `Absent — ${d.absenceType}${d.coverBy ? ` · Cover: ${d.coverBy}` : ""}` :
                     d.isOnDuty  ? `${d.shiftStart}–${d.shiftEnd} · ${d.minutesUntilShiftEnd}m remaining` :
                     d.shiftStart ? `Shift: ${d.shiftStart}–${d.shiftEnd} (not started)` : "No shift"}
                  </p>
                </div>
                <Badge className={`text-xs ${d.isOnDuty ? "bg-green-100 text-green-800" : d.isAbsent ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}`}>
                  {d.isOnDuty ? "On Duty" : d.isAbsent ? "Absent" : d.isWeekOff ? "Off" : "Off Shift"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unassigned jobs */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Unassigned Jobs Today {myUnassigned.length > 0 && <span className="text-red-600">({myUnassigned.length})</span>}
        </p>
        {myUnassigned.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">All jobs assigned for today</p>
          </div>
        ) : myUnassigned.map(job => (
          <Card key={job.jobId} className="mb-3 border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{job.customerName ?? job.customerId}</p>
                    <Badge className="text-xs bg-amber-100 text-amber-800">Unassigned</Badge>
                    <Badge variant="outline" className="text-xs">{job.packageName}</Badge>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.timeSlot}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location?.area}</span>
                    <span className="flex items-center gap-1"><Car className="w-3 h-3" />{job.vehicleDetails?.brand} {job.vehicleDetails?.registration}</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleOpenAssign(job)}>
                  Assign <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── ASSIGN DIALOG ── */}
      <Dialog open={!!selectedJob} onOpenChange={o => { if (!o) { setSelectedJob(null); setRouting(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Job</DialogTitle>
            <DialogDescription>
              {selectedJob?.customerName ?? selectedJob?.customerId} · {selectedJob?.timeSlot} · {selectedJob?.location?.area}
            </DialogDescription>
          </DialogHeader>
          {routing && (
            <div className="space-y-4">
              {/* Routing note */}
              <div className={`rounded-lg p-3 text-xs ${routing.supervisorOnDuty ? "bg-blue-50 border border-blue-200 text-blue-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                {routing.routingNote}
              </div>

              {/* Eligible washers */}
              {routing.eligibleWashers.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Eligible Washers ({routing.eligibleWashers.length})</p>
                  <div className="space-y-2">
                    {routing.eligibleWashers.map(w => (
                      <WasherCard key={w.employeeId} w={w} jobTime={selectedJob?.timeSlot ?? ""} onAssign={() => handleAssign(w.employeeId, w.employeeName)} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-red-500" />
                  <p className="text-sm font-medium text-red-800">No washers eligible for this time slot</p>
                  <p className="text-xs text-red-600 mt-0.5">All washers are absent, off-duty, or shift ends too soon</p>
                </div>
              )}

              {/* Ineligible - collapsed */}
              {routing.ineligibleWashers.length > 0 && (
                <details className="cursor-pointer">
                  <summary className="text-xs text-gray-500 hover:text-gray-700">
                    {routing.ineligibleWashers.length} washer(s) not eligible — expand to see why
                  </summary>
                  <div className="mt-2 space-y-1">
                    {routing.ineligibleWashers.map(w => (
                      <div key={w.employeeId} className="flex justify-between text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded">
                        <span>{w.employeeName}</span>
                        <span className="text-red-500">{w.reason}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedJob(null); setRouting(null); }}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── NEW JOINER DIALOG ── */}
      <Dialog open={showOnboard} onOpenChange={o => { if (!o) setShowOnboard(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Joiner to Roster</DialogTitle>
            <DialogDescription>Employee will be added to this week's roster immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Employee ID *</Label>
              <Input value={onboardId} onChange={e => setOnboardId(e.target.value)} placeholder="EDB-CW-SUR…" />
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Full Name *</Label>
              <Input value={onboardName} onChange={e => setOnboardName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Role</Label>
                <Select value={onboardRole} onValueChange={v => setOnboardRole(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car Washer">Car Washer</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Default Shift</Label>
                <Select value={onboardShift} onValueChange={v => setOnboardShift(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning 5–2pm</SelectItem>
                    <SelectItem value="Split">Split 9am–6pm</SelectItem>
                    <SelectItem value="Evening">Evening 1–10pm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Week Off Day</Label>
              <Select value={onboardDayOff} onValueChange={setOnboardDayOff}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
              HR will be notified. Employee can start checking in from today.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOnboard(false)}>Cancel</Button>
            <Button onClick={handleOnboard} disabled={!onboardName.trim() || !onboardId.trim()}>
              <UserPlus className="w-3.5 h-3.5 mr-1" />Add to Roster
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── REPLACE WASHER DIALOG ── */}
      <Dialog open={showReplace} onOpenChange={o => { if (!o) setShowReplace(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Replace Washer</DialogTitle>
            <DialogDescription>All future shifts of the outgoing washer will be transferred to the new washer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Outgoing Washer *</Label>
              <Select value={outgoingId} onValueChange={setOutgoingId}>
                <SelectTrigger><SelectValue placeholder="Select washer leaving…" /></SelectTrigger>
                <SelectContent>
                  {dutyStatuses.map(d => <SelectItem key={d.employeeId} value={d.employeeId}>{d.employeeName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">New Washer Employee ID *</Label>
              <Input value={replaceId} onChange={e => setReplaceId(e.target.value)} placeholder="EDB-CW-SUR-NEW" />
            </div>
            <div className="space-y-1.5"><Label className="text-xs">New Washer Full Name *</Label>
              <Input value={replaceName} onChange={e => setReplaceName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Shift</Label>
                <Select value={replaceShift} onValueChange={v => setReplaceShift(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Split">Split</SelectItem>
                    <SelectItem value="Evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Week Off</Label>
                <Select value={replaceDayOff} onValueChange={setReplaceDayOff}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplace(false)}>Cancel</Button>
            <Button onClick={handleReplace} disabled={!outgoingId || !replaceId.trim() || !replaceName.trim()}>
              <UserCheck className="w-3.5 h-3.5 mr-1" />Confirm Replacement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
