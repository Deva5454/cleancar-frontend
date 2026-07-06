/**
 * ShiftRosterManager — HR interface to create, edit, publish weekly rosters.
 * Supports: manual slot assignment, CSV upload, swap approval, absence review.
 */
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Calendar, Upload, CheckCircle2, XCircle, AlertTriangle,
  Clock, RefreshCw, Bell, ChevronDown, Users, ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { DataService } from "../../services/DataService";
import {
  shiftRosterService, SHIFT_TEMPLATES, SHIFT_RULES,
  type WeeklyRoster, type ShiftSlot, type ShiftSwap, type ShiftAbsence,
} from "../../services/shiftRosterService";

// ── Helpers ────────────────────────────────────────────────────────────────────
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_LABELS: Record<string, string> = { Mon:"Monday", Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday", Sun:"Sunday" };

function getWeekMonday(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return d.toISOString().slice(0, 10);
}

function loadFieldEmployees(cityId: string) {
  try {
    const employees = DataService.get<any>("EMPLOYEES");
    return employees.filter((e: any) =>
      ["Car Washer", "Supervisor"].includes(e.role) &&
      (e.cityId === cityId || e.workLocation === cityId || e.workLocation?.includes("Surat"))
    ).map((e: any) => ({
      id: e.id || e.employeeId,
      name: e.fullName || (e.firstName + " " + e.lastName),
      role: e.role as "Car Washer" | "Supervisor",
      supervisorId: e.reportingManagerId ?? "",
      zone: e.zone ?? e.area ?? "",
    }));
  } catch { return []; }
}

// ── Shift Cell — editable slot in the roster grid ─────────────────────────────
function ShiftCell({ slot, onUpdate, locked }: { slot: ShiftSlot; onUpdate: (s: Partial<ShiftSlot>) => void; locked: boolean }) {
  if (slot.isWeekOff) return (
    <div className="h-14 flex items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 font-medium">OFF</div>
  );
  if (slot.isHoliday) return (
    <div className="h-14 flex items-center justify-center rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium">Holiday</div>
  );

  const bgMap: Record<string, string> = { Morning:"bg-green-50 border-green-200", Split:"bg-blue-50 border-blue-200", Evening:"bg-purple-50 border-purple-200" };
  const swapped = !!slot.effectiveEmployeeId;

  return (
    <div className={`h-14 rounded-lg border text-xs p-1 ${bgMap[slot.shiftType]} ${swapped ? "ring-2 ring-orange-400" : ""} ${locked ? "opacity-70" : "cursor-pointer hover:shadow-sm"}`}>
      {locked ? (
        <div className="flex flex-col h-full justify-center items-center">
          <span className="font-semibold">{slot.startTime}</span>
          <span className="text-gray-400">{slot.endTime}</span>
          {swapped && <span className="text-orange-600 font-medium truncate w-full text-center">↔ {slot.effectiveEmployeeName?.split(" ")[0]}</span>}
        </div>
      ) : (
        <Select value={slot.shiftType} onValueChange={v => onUpdate({ shiftType: v as any })} disabled={locked}>
          <SelectTrigger className="h-full border-0 bg-transparent text-xs p-0 focus:ring-0">
            <div className="flex flex-col items-start">
              <span className="font-semibold">{slot.startTime}–{slot.endTime}</span>
              <span className="text-gray-500">{slot.shiftType}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SHIFT_TEMPLATES).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
            ))}
            <SelectItem value="_off" className="text-xs text-gray-500">— Week Off —</SelectItem>
            <SelectItem value="_holiday" className="text-xs text-amber-600">— Public Holiday —</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ShiftRosterManager() {
  const { currentUser } = useRole();
  const { city }        = useCity();
  const cityId = "CITY-SURAT";

  const [weekOffset, setWeekOffset] = useState(0);
  const [roster, setRoster]         = useState<WeeklyRoster | null>(null);
  const [swaps, setSwaps]           = useState<ShiftSwap[]>([]);
  const [absences, setAbsences]     = useState<ShiftAbsence[]>([]);
  const [activeTab, setActiveTab]   = useState<"roster" | "swaps" | "absences" | "notifications">("roster");
  const [selectedSwap, setSelectedSwap]     = useState<ShiftSwap | null>(null);
  const [selectedAbsence, setSelectedAbsence] = useState<ShiftAbsence | null>(null);
  const [rejectReason, setRejectReason]     = useState("");
  const [penaltyMins, setPenaltyMins]       = useState("0");
  const [csvText, setCsvText]               = useState("");
  const [showCsvDialog, setShowCsvDialog]   = useState(false);
  const [refreshKey, setRefreshKey]         = useState(0);

  const weekStart = getWeekMonday(weekOffset);

  useEffect(() => {
    let r = shiftRosterService.getRosterForWeek(cityId, weekStart);
    if (!r) {
      const employees = loadFieldEmployees(cityId);
      if (employees.length > 0) r = shiftRosterService.createBlankRoster(cityId, weekStart, employees);
    }
    setRoster(r);
    setSwaps(shiftRosterService.getSwaps(cityId));
    setAbsences(shiftRosterService.getAbsences(cityId));
  }, [weekOffset, refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  // Grouped by employee for the grid
  const employees = useMemo(() => {
    if (!roster) return [];
    const seen = new Set<string>();
    return roster.slots.filter(s => { if (seen.has(s.employeeId)) return false; seen.add(s.employeeId); return true; })
      .map(s => ({ id: s.employeeId, name: s.employeeName, role: s.role }));
  }, [roster]);

  const pendingSwaps    = swaps.filter(s => s.status === "Accepted");
  const pendingAbsences = absences.filter(a => a.status === "Pending" || a.status === "Escalated");
  const noShows         = absences.filter(a => a.absenceType === "No Show");

  // ── CSV Upload ────────────────────────────────────────────────────────────────
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      // Parse CSV: EmployeeId, Mon, Tue, Wed, Thu, Fri, Sat, Sun
      // Each cell: ShiftType (Morning/Split/Evening) or OFF or HOLIDAY
      const lines = text.split("\n").filter(l => l.trim()).slice(1); // skip header
      let updated = 0;
      lines.forEach(line => {
        const [empId, ...days] = line.split(",").map(s => s.trim().replace(/"/g, ""));
        DOW.forEach((dow, i) => {
          const val = days[i] ?? "";
          if (!val) return;
          const slot = roster?.slots.find(s => s.employeeId === empId && s.dayOfWeek === dow);
          if (!slot || !roster) return;
          if (val.toUpperCase() === "OFF") {
            shiftRosterService.updateSlot(roster.rosterId, slot.slotId, { isWeekOff: true });
          } else if (val.toUpperCase() === "HOLIDAY") {
            shiftRosterService.updateSlot(roster.rosterId, slot.slotId, { isHoliday: true });
          } else if (["Morning", "Split", "Evening"].includes(val)) {
            shiftRosterService.updateSlot(roster.rosterId, slot.slotId, { shiftType: val as any, isWeekOff: false, isHoliday: false });
          }
          updated++;
        });
      });
      toast.success(`CSV applied — ${updated} slots updated`);
      refresh();
    };
    reader.readAsText(file);
  };

  const handlePublish = () => {
    if (!roster) return;
    shiftRosterService.publishRoster(roster.rosterId, currentUser?.name ?? "HR");
    toast.success(`Roster published — all employees notified`);
    refresh();
  };

  const handleApproveSwap = () => {
    if (!selectedSwap) return;
    shiftRosterService.supervisorApproveSwap(selectedSwap.swapId, currentUser?.employeeId ?? "", currentUser?.name ?? "HR");
    toast.success("Shift swap approved");
    setSelectedSwap(null); refresh();
  };

  const handleRejectSwap = () => {
    if (!selectedSwap || !rejectReason.trim()) { toast.error("Enter rejection reason"); return; }
    shiftRosterService.supervisorRejectSwap(selectedSwap.swapId, currentUser?.employeeId ?? "", currentUser?.name ?? "HR", rejectReason);
    toast.success("Shift swap rejected");
    setSelectedSwap(null); setRejectReason(""); refresh();
  };

  const handleApproveAbsence = () => {
    if (!selectedAbsence) return;
    shiftRosterService.hrReviewAbsence(selectedAbsence.absenceId, currentUser?.name ?? "HR", "Approved", "Approved by HR", parseInt(penaltyMins) || 0);
    toast.success("Absence approved");
    setSelectedAbsence(null); refresh();
  };

  const handleRejectAbsence = () => {
    if (!selectedAbsence || !rejectReason.trim()) { toast.error("Enter rejection reason"); return; }
    shiftRosterService.hrReviewAbsence(selectedAbsence.absenceId, currentUser?.name ?? "HR", "Rejected", rejectReason);
    toast.success("Absence rejected");
    setSelectedAbsence(null); setRejectReason(""); refresh();
  };

  const statusColor = (s: string) =>
    s === "Published" ? "bg-green-100 text-green-800" :
    s === "Locked"    ? "bg-gray-200 text-gray-700" :
    "bg-yellow-100 text-yellow-800";

  const notifications = shiftRosterService.getNotifications("HR");
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Shift Roster Manager
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Car Washer and Supervisor shifts · 5 AM–10 PM band · 9 hrs/day</p>
        </div>
        <div className="flex items-center gap-2">
          {roster && <Badge className={`text-xs ${statusColor(roster.status)}`}>{roster.status}</Badge>}
          {roster?.status === "Draft" && (
            <>
              <label className="cursor-pointer">
                <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                <Button size="sm" variant="outline"><Upload className="w-3.5 h-3.5 mr-1" />Upload CSV</Button>
              </label>
              <Button size="sm" onClick={handlePublish} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Publish Roster
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Week navigator */}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={() => setWeekOffset(w => w - 1)}>← Prev</Button>
        <span className="text-sm font-semibold text-gray-700">{roster?.weekLabel ?? "—"}</span>
        <Button size="sm" variant="outline" onClick={() => setWeekOffset(w => w + 1)}>Next →</Button>
        {weekOffset !== 0 && <Button size="sm" variant="ghost" onClick={() => setWeekOffset(0)}>This Week</Button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          ["roster", "Roster Grid"],
          ["swaps", `Swap Requests${pendingSwaps.length ? ` (${pendingSwaps.length})` : ""}`],
          ["absences", `Absences${pendingAbsences.length ? ` (${pendingAbsences.length})` : ""}`],
          ["notifications", `Alerts${unread ? ` (${unread})` : ""}`],
        ] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)}
            className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── ROSTER GRID ── */}
      {activeTab === "roster" && roster && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 min-w-[160px]">Employee</th>
                {DOW.map(d => (
                  <th key={d} className="px-2 py-3 font-semibold text-gray-600 min-w-[110px] text-center">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 sticky left-0 bg-white z-10 border-r">
                    <p className="font-semibold text-gray-900">{emp.name}</p>
                    <Badge variant="outline" className={`text-[10px] ${emp.role === "Supervisor" ? "border-purple-300 text-purple-700" : "border-blue-300 text-blue-700"}`}>
                      {emp.role}
                    </Badge>
                  </td>
                  {DOW.map(dow => {
                    const slot = roster.slots.find(s => s.employeeId === emp.id && s.dayOfWeek === dow);
                    if (!slot) return <td key={dow} className="px-2 py-2" />;
                    return (
                      <td key={dow} className="px-2 py-2">
                        <ShiftCell
                          slot={slot}
                          locked={roster.status !== "Draft"}
                          onUpdate={updates => {
                            if (updates.shiftType === "_off" as any) {
                              shiftRosterService.updateSlot(roster.rosterId, slot.slotId, { isWeekOff: true });
                            } else if (updates.shiftType === "_holiday" as any) {
                              shiftRosterService.updateSlot(roster.rosterId, slot.slotId, { isHoliday: true, isWeekOff: false });
                            } else {
                              shiftRosterService.updateSlot(roster.rosterId, slot.slotId, { ...updates, isWeekOff: false, isHoliday: false });
                            }
                            refresh();
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SHIFT KEY ── */}
      {activeTab === "roster" && (
        <div className="flex gap-4 flex-wrap text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-200 rounded inline-block" />Morning 5–2pm</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded inline-block" />Split 9am–6pm</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-100 border border-purple-200 rounded inline-block" />Evening 1–10pm</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded inline-block" />Week Off</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-50 border border-amber-200 rounded inline-block" />Holiday</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-orange-400 rounded inline-block" />Swapped</span>
        </div>
      )}

      {/* ── SWAP REQUESTS ── */}
      {activeTab === "swaps" && (
        <div className="space-y-3">
          {swaps.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No shift swap requests</p>
            </div>
          ) : swaps.map(swap => (
            <Card key={swap.swapId} className={`border ${swap.status === "Accepted" ? "border-amber-200 bg-amber-50" : swap.status === "Approved by Supervisor" ? "border-green-200" : "border-gray-200"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{swap.requesterName} ↔ {swap.targetName}</p>
                      <Badge className={`text-xs ${swap.status === "Accepted" ? "bg-amber-100 text-amber-800" : swap.status === "Approved by Supervisor" ? "bg-green-100 text-green-800" : swap.status === "Rejected" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"}`}>
                        {swap.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{swap.swapType}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {swap.requesterName}: {swap.requesterDate} ({swap.requesterShift})
                      {swap.swapType === "Mutual Swap" ? ` ↔ ${swap.targetName}: ${swap.targetDate} (${swap.targetShift})` : ` — ${swap.targetName} covers`}
                    </p>
                    <p className="text-xs text-gray-500 italic mt-0.5">"{swap.reason}"</p>
                  </div>
                  {swap.status === "Accepted" && (
                    <Button size="sm" onClick={() => setSelectedSwap(swap)}>Review</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── ABSENCES ── */}
      {activeTab === "absences" && (
        <div className="space-y-3">
          {absences.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No absences reported</p>
            </div>
          ) : absences.map(abs => (
            <Card key={abs.absenceId} className={`border ${abs.status === "Escalated" || abs.absenceType === "No Show" ? "border-red-300 bg-red-50" : abs.status === "Pending" ? "border-amber-200 bg-amber-50" : "border-gray-200"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{abs.employeeName}</p>
                      <Badge className={`text-xs ${abs.absenceType === "No Show" ? "bg-red-100 text-red-800" : abs.absenceType === "Sick" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-700"}`}>
                        {abs.absenceType}
                      </Badge>
                      <Badge className={`text-xs ${abs.status === "Escalated" ? "bg-red-200 text-red-900" : abs.status === "Approved" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                        {abs.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{abs.date} · Shift {abs.shiftStart}–{abs.shiftEnd} · {abs.role}</p>
                    <p className="text-xs text-gray-500 italic">"{abs.reason}"</p>
                    {abs.coverArranged && <p className="text-xs text-green-700 mt-0.5">Cover: {abs.coverEmployeeName}</p>}
                    {!abs.coverArranged && abs.status !== "Approved" && (
                      <p className="text-xs text-red-600 mt-0.5">⚠ No cover arranged</p>
                    )}
                  </div>
                  {(abs.status === "Pending" || abs.status === "Escalated") && (
                    <Button size="sm" onClick={() => { setSelectedAbsence(abs); setRejectReason(""); setPenaltyMins("0"); }}>
                      Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeTab === "notifications" && (
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No alerts</p>
            </div>
          ) : notifications.map(n => (
            <div key={n.notifId} className={`flex gap-3 p-3 rounded-xl border text-sm ${n.read ? "bg-white border-gray-100 text-gray-500" : "bg-blue-50 border-blue-200 text-gray-900"}`}>
              <Bell className={`w-4 h-4 shrink-0 mt-0.5 ${n.type === "no_show_alert" ? "text-red-500" : "text-blue-500"}`} />
              <div className="flex-1">
                <p>{n.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString("en-IN")}</p>
              </div>
              {!n.read && <button onClick={() => { shiftRosterService.markRead(n.notifId); refresh(); }} className="text-xs text-blue-600 hover:underline shrink-0">Mark read</button>}
            </div>
          ))}
        </div>
      )}

      {/* ── SWAP REVIEW DIALOG ── */}
      <Dialog open={!!selectedSwap} onOpenChange={o => { if (!o) setSelectedSwap(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Shift Swap</DialogTitle>
            <DialogDescription>{selectedSwap?.requesterName} ↔ {selectedSwap?.targetName}</DialogDescription>
          </DialogHeader>
          {selectedSwap && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Swap type</span><span className="font-medium">{selectedSwap.swapType}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{selectedSwap.requesterName}</span><span>{selectedSwap.requesterDate} ({selectedSwap.requesterShift})</span></div>
                {selectedSwap.swapType === "Mutual Swap" && <div className="flex justify-between"><span className="text-gray-500">{selectedSwap.targetName}</span><span>{selectedSwap.targetDate} ({selectedSwap.targetShift})</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Reason</span><span className="italic">"{selectedSwap.reason}"</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Target accepted</span><span className="text-green-700">✓ {selectedSwap.targetAcceptedAt ? new Date(selectedSwap.targetAcceptedAt).toLocaleString("en-IN") : "Yes"}</span></div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Rejection reason (required only for reject)</Label>
                <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejecting…" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedSwap(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectSwap} disabled={!rejectReason.trim()}>Reject Swap</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApproveSwap}>Approve Swap</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ABSENCE REVIEW DIALOG ── */}
      <Dialog open={!!selectedAbsence} onOpenChange={o => { if (!o) setSelectedAbsence(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Absence</DialogTitle>
            <DialogDescription>{selectedAbsence?.employeeName} · {selectedAbsence?.date}</DialogDescription>
          </DialogHeader>
          {selectedAbsence && (
            <div className="space-y-4">
              <div className={`rounded-lg p-3 text-sm space-y-1 ${selectedAbsence.absenceType === "No Show" ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
                <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{selectedAbsence.absenceType}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Shift</span><span>{selectedAbsence.shiftStart}–{selectedAbsence.shiftEnd}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Reason</span><span className="italic">"{selectedAbsence.reason}"</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Cover</span><span>{selectedAbsence.coverArranged ? selectedAbsence.coverEmployeeName : "Not arranged"}</span></div>
                {selectedAbsence.proofNote && <div className="flex justify-between"><span className="text-gray-500">Proof</span><span>{selectedAbsence.proofNote}</span></div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Salary Deduction (mins)</Label>
                  <Input type="number" value={penaltyMins} onChange={e => setPenaltyMins(e.target.value)} placeholder="0 = no deduction" />
                  <p className="text-xs text-gray-400">Enter 0 for approved sick leave</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Rejection Reason</Label>
                  <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Required if rejecting" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedAbsence(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectAbsence} disabled={!rejectReason.trim()}>Reject</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApproveAbsence}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
