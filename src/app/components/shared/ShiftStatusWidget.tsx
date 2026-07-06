/**
 * ShiftStatusWidget — shown to Car Washers and Supervisors.
 * Displays: today's shift, week view, swap request form, absence reporting.
 */
import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
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
  Clock, Calendar, ArrowLeftRight, AlertTriangle, Bell,
  CheckCircle2, XCircle, ChevronRight, Users,
} from "lucide-react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import {
  shiftRosterService, SHIFT_RULES, SHIFT_TEMPLATES,
  type ShiftSlot, type ShiftSwap, type ShiftAbsence,
} from "../../services/shiftRosterService";
import { DataService } from "../../services/DataService";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function getWeekMonday(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function loadTeammates(cityId: string, excludeId: string) {
  try {
    const emps = DataService.get<any>("EMPLOYEES");
    return emps
      .filter((e: any) => ["Car Washer", "Supervisor"].includes(e.role) && (e.id || e.employeeId) !== excludeId &&
        (e.cityId === cityId || e.workLocation === cityId || e.workLocation?.includes("Surat")))
      .map((e: any) => ({ id: e.id || e.employeeId, name: e.fullName || `${e.firstName} ${e.lastName}`, role: e.role }));
  } catch { return []; }
}

export function ShiftStatusWidget({ cityId = "CITY-SURAT" }: { cityId?: string }) {
  const { currentUser, currentRole } = useRole();
  const empId = currentUser?.employeeId ?? currentUser?.id ?? "";

  const [todaySlot, setTodaySlot]     = useState<ShiftSlot | null>(null);
  const [weekSlots, setWeekSlots]     = useState<ShiftSlot[]>([]);
  const [mySwaps, setMySwaps]         = useState<ShiftSwap[]>([]);
  const [myAbsences, setMyAbsences]   = useState<ShiftAbsence[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [checkInResult, setCheckInResult] = useState<ReturnType<typeof shiftRosterService.validateCheckIn> | null>(null);
  const [tab, setTab]                 = useState<"today" | "week" | "swaps" | "absences">("today");
  const [refreshKey, setRefreshKey]   = useState(0);

  // Swap form
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [swapTargetId, setSwapTargetId]     = useState("");
  const [swapMySlotId, setSwapMySlotId]     = useState("");
  const [swapTheirSlotId, setSwapTheirSlotId] = useState("");
  const [swapType, setSwapType]             = useState<ShiftSwap["swapType"]>("Mutual Swap");
  const [swapReason, setSwapReason]         = useState("");

  // Absence form
  const [showAbsenceDialog, setShowAbsenceDialog] = useState(false);
  const [absenceType, setAbsenceType]             = useState<ShiftAbsence["absenceType"]>("Sick");
  const [absenceReason, setAbsenceReason]         = useState("");
  const [absenceProof, setAbsenceProof]           = useState("");
  const [absenceCoverId, setAbsenceCoverId]       = useState("");
  const [absenceCoverName, setAbsenceCoverName]   = useState("");

  // Incoming swap response
  const [pendingSwapRequest, setPendingSwapRequest] = useState<ShiftSwap | null>(null);
  const [rejectReason, setRejectReason]             = useState("");

  useEffect(() => {
    if (!empId) return;
    const slot = shiftRosterService.getTodaySlot(empId, cityId);
    setTodaySlot(slot);
    setWeekSlots(shiftRosterService.getWeekSlots(empId, cityId));
    const allSwaps = shiftRosterService.getSwaps(cityId);
    setMySwaps(allSwaps.filter(s => s.requesterId === empId || s.targetId === empId));
    setMyAbsences(shiftRosterService.getAbsences(cityId).filter(a => a.employeeId === empId));
    setNotifications(shiftRosterService.getNotifications(empId));
    setCheckInResult(shiftRosterService.validateCheckIn(empId, cityId));
    // Check if there's a pending swap request for me to respond to
    const incoming = allSwaps.find(s => s.targetId === empId && s.status === "Pending");
    setPendingSwapRequest(incoming ?? null);
  }, [empId, cityId, refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);
  const teammates = loadTeammates(cityId, empId);
  const unread = notifications.filter(n => !n.read).length;

  const handleRequestSwap = () => {
    if (!swapTargetId || !swapMySlotId || !swapReason.trim()) { toast.error("Fill all required fields"); return; }
    const mySlot    = weekSlots.find(s => s.slotId === swapMySlotId);
    const target    = teammates.find(t => t.id === swapTargetId);
    const theirSlots = shiftRosterService.getWeekSlots(swapTargetId, cityId);
    const theirSlot  = theirSlots.find(s => s.slotId === swapTheirSlotId) ?? theirSlots[0];
    if (!mySlot || !target) { toast.error("Invalid selection"); return; }
    shiftRosterService.requestSwap({
      cityId, requesterId: empId, requesterName: currentUser?.name ?? empId,
      requesterSlotId: mySlot.slotId, requesterDate: mySlot.date, requesterShift: `${mySlot.startTime}–${mySlot.endTime}`,
      targetId: target.id, targetName: target.name,
      targetSlotId: theirSlot?.slotId ?? "", targetDate: theirSlot?.date ?? "", targetShift: theirSlot ? `${theirSlot.startTime}–${theirSlot.endTime}` : "",
      swapType, reason: swapReason,
    });
    toast.success(`Swap request sent to ${target.name}`);
    setShowSwapDialog(false); setSwapTargetId(""); setSwapMySlotId(""); setSwapReason(""); refresh();
  };

  const handleReportAbsence = () => {
    if (!absenceReason.trim()) { toast.error("Enter a reason"); return; }
    if (!todaySlot) { toast.error("No shift found for today"); return; }
    const cover = teammates.find(t => t.id === absenceCoverId);
    shiftRosterService.reportAbsence({
      cityId, employeeId: empId, employeeName: currentUser?.name ?? empId,
      role: currentRole ?? "Car Washer", slotId: todaySlot.slotId,
      date: todaySlot.date, shiftStart: todaySlot.startTime, shiftEnd: todaySlot.endTime,
      absenceType, reason: absenceReason, proofNote: absenceProof || undefined,
      coverEmployeeId: cover?.id, coverEmployeeName: cover?.name,
      supervisorId: todaySlot.supervisorId,
    });
    toast.success("Absence reported — supervisor and HR notified");
    setShowAbsenceDialog(false); setAbsenceReason(""); setAbsenceProof(""); setAbsenceCoverId(""); refresh();
  };

  const handleAcceptSwap = () => {
    if (!pendingSwapRequest) return;
    shiftRosterService.acceptSwap(pendingSwapRequest.swapId, empId);
    toast.success("Swap accepted — waiting for supervisor approval");
    setPendingSwapRequest(null); refresh();
  };

  const handleDeclineSwap = () => {
    if (!pendingSwapRequest || !rejectReason.trim()) { toast.error("Enter a reason"); return; }
    shiftRosterService.rejectSwap(pendingSwapRequest.swapId, empId, rejectReason);
    toast.success("Swap declined");
    setPendingSwapRequest(null); setRejectReason(""); refresh();
  };

  // ── Today shift card ────────────────────────────────────────────────────────
  const shiftColor: Record<string, string> = { Morning:"border-green-300 bg-green-50", Split:"border-blue-300 bg-blue-50", Evening:"border-purple-300 bg-purple-50" };

  return (
    <div className="space-y-4">
      {/* Pending swap request banner */}
      {pendingSwapRequest && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ArrowLeftRight className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-amber-900">Shift Swap Request from {pendingSwapRequest.requesterName}</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  They want {pendingSwapRequest.swapType}: their {pendingSwapRequest.requesterDate} ({pendingSwapRequest.requesterShift}) for your {pendingSwapRequest.targetDate} ({pendingSwapRequest.targetShift})
                </p>
                <p className="text-xs italic text-amber-700 mt-0.5">"{pendingSwapRequest.reason}"</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleAcceptSwap}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Accept
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => {
                    if (!rejectReason) { toast.error("Enter a reason to decline"); return; }
                    handleDeclineSwap();
                  }}>
                    <XCircle className="w-3.5 h-3.5 mr-1" />Decline
                  </Button>
                </div>
                <Input className="mt-2 text-xs" placeholder="Reason for declining (required)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b text-sm">
        {([["today","Today"], ["week","My Week"], ["swaps",`Swaps${mySwaps.length ? ` (${mySwaps.length})` : ""}`], ["absences","Absences"]] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 px-3 font-medium border-b-2 transition-colors ${tab === t ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500"}`}>
            {l}
          </button>
        ))}
        {unread > 0 && (
          <button onClick={() => notifications.forEach(n => shiftRosterService.markRead(n.notifId))}
            className="ml-auto pb-2 px-2 text-xs text-blue-600 flex items-center gap-1">
            <Bell className="w-3.5 h-3.5" />{unread} new
          </button>
        )}
      </div>

      {/* ── TODAY TAB ── */}
      {tab === "today" && (
        <div className="space-y-3">
          {!todaySlot ? (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No roster assigned for this week.</p>
              <p className="text-xs mt-1">Contact your supervisor or HR.</p>
            </div>
          ) : todaySlot.isWeekOff ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border">
              <p className="text-2xl mb-2">🌴</p>
              <p className="font-semibold text-gray-700">Today is your Week Off</p>
              <p className="text-xs text-gray-400 mt-1">{todaySlot.dayOfWeek}</p>
            </div>
          ) : (
            <>
              {/* Shift card */}
              <div className={`rounded-xl border-2 p-4 ${shiftColor[todaySlot.shiftType] ?? "border-gray-200 bg-white"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-bold text-lg text-gray-900">{todaySlot.startTime} – {todaySlot.endTime}</p>
                      <p className="text-xs text-gray-500">{todaySlot.shiftType} Shift · 9 hrs · {SHIFT_RULES.BREAK_MINUTES}min break</p>
                    </div>
                  </div>
                  <Badge className={`text-xs ${todaySlot.shiftType === "Morning" ? "bg-green-100 text-green-800" : todaySlot.shiftType === "Evening" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                    {todaySlot.shiftType}
                  </Badge>
                </div>
                {todaySlot.zone && <p className="text-xs text-gray-500 mb-2">📍 Zone: {todaySlot.zone}</p>}
                {/* Check-in window status */}
                {checkInResult && (
                  <div className={`rounded-lg px-3 py-2 text-xs font-medium ${checkInResult.allowed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {checkInResult.message}
                  </div>
                )}
                {/* Swap indicator */}
                {todaySlot.effectiveEmployeeId && todaySlot.effectiveEmployeeId !== empId && (
                  <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-800">
                    ↔ Swapped — {todaySlot.effectiveEmployeeName} is covering this slot
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowSwapDialog(true)}>
                  <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />Request Swap
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-orange-700 border-orange-300 hover:bg-orange-50" onClick={() => setShowAbsenceDialog(true)}>
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />Report Absence
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── WEEK VIEW ── */}
      {tab === "week" && (
        <div className="space-y-2">
          {weekSlots.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">No roster for this week</p>
          ) : weekSlots.map(slot => (
            <div key={slot.slotId} className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${slot.isWeekOff ? "bg-gray-50 border-gray-200" : slot.isHoliday ? "bg-amber-50 border-amber-200" : shiftColor[slot.shiftType] ?? "bg-white border-gray-200"}`}>
              <div>
                <p className="font-semibold text-gray-900">{slot.dayOfWeek} <span className="font-normal text-gray-400 text-xs">({slot.date})</span></p>
                {slot.isWeekOff ? <p className="text-xs text-gray-400">Week Off 🌴</p> :
                 slot.isHoliday ? <p className="text-xs text-amber-700">Public Holiday</p> :
                 <p className="text-xs text-gray-600">{slot.startTime}–{slot.endTime} · {slot.shiftType}</p>}
                {slot.effectiveEmployeeId && slot.effectiveEmployeeId !== empId && (
                  <p className="text-xs text-orange-600">↔ Covered by {slot.effectiveEmployeeName}</p>
                )}
              </div>
              <Badge variant="outline" className={`text-xs ${slot.isWeekOff ? "text-gray-400" : "text-gray-700"}`}>
                {slot.isWeekOff ? "OFF" : slot.isHoliday ? "Holiday" : slot.shiftType}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* ── SWAPS TAB ── */}
      {tab === "swaps" && (
        <div className="space-y-3">
          <Button size="sm" onClick={() => setShowSwapDialog(true)} className="w-full">
            <ArrowLeftRight className="w-3.5 h-3.5 mr-2" />Request a New Shift Swap
          </Button>
          {mySwaps.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">No swap requests yet</p>
          ) : mySwaps.map(swap => (
            <Card key={swap.swapId} className="border">
              <CardContent className="p-3 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-xs">{swap.swapType}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {swap.requesterId === empId
                        ? `You → ${swap.targetName}: ${swap.requesterDate}`
                        : `${swap.requesterName} → You: ${swap.targetDate}`}
                    </p>
                    <p className="text-xs italic text-gray-400">"{swap.reason}"</p>
                  </div>
                  <Badge className={`text-xs ${swap.status === "Approved by Supervisor" ? "bg-green-100 text-green-800" : swap.status === "Rejected" ? "bg-red-100 text-red-800" : swap.status === "Accepted" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                    {swap.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── ABSENCES TAB ── */}
      {tab === "absences" && (
        <div className="space-y-3">
          <Button size="sm" variant="outline" onClick={() => setShowAbsenceDialog(true)} className="w-full text-orange-700 border-orange-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-2" />Report Absence / Late Arrival
          </Button>
          {myAbsences.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">No absences on record</p>
          ) : myAbsences.map(abs => (
            <Card key={abs.absenceId} className={`border ${abs.status === "Escalated" ? "border-red-300" : "border-gray-200"}`}>
              <CardContent className="p-3 text-sm">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-xs">{abs.absenceType} — {abs.date}</p>
                    <p className="text-xs text-gray-500 italic">"{abs.reason}"</p>
                    {abs.penaltyApplied && <p className="text-xs text-red-600 mt-0.5">⚠ {abs.penaltyMinutes} mins deducted</p>}
                  </div>
                  <Badge className={`text-xs ${abs.status === "Approved" ? "bg-green-100 text-green-800" : abs.status === "Rejected" ? "bg-red-100 text-red-800" : abs.status === "Escalated" ? "bg-red-200 text-red-900" : "bg-amber-100 text-amber-800"}`}>
                    {abs.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── SWAP REQUEST DIALOG ── */}
      <Dialog open={showSwapDialog} onOpenChange={o => { if (!o) setShowSwapDialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Shift Swap</DialogTitle>
            <DialogDescription>Select a colleague and a reason. Both must agree before supervisor approves.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Swap Type</Label>
              <Select value={swapType} onValueChange={v => setSwapType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mutual Swap">Mutual Swap — you take their shift, they take yours</SelectItem>
                  <SelectItem value="Coverage Request">Coverage Request — they cover your shift (you owe them)</SelectItem>
                  <SelectItem value="One-way Shift Handover">One-way Handover — permanently reassign your slot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Your Shift to Swap</Label>
              <Select value={swapMySlotId} onValueChange={setSwapMySlotId}>
                <SelectTrigger><SelectValue placeholder="Select your shift…" /></SelectTrigger>
                <SelectContent>
                  {weekSlots.filter(s => !s.isWeekOff).map(s => (
                    <SelectItem key={s.slotId} value={s.slotId}>{s.dayOfWeek} {s.date} ({s.startTime}–{s.endTime})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Colleague</Label>
              <Select value={swapTargetId} onValueChange={setSwapTargetId}>
                <SelectTrigger><SelectValue placeholder="Select colleague…" /></SelectTrigger>
                <SelectContent>
                  {teammates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason *</Label>
              <Textarea value={swapReason} onChange={e => setSwapReason(e.target.value)} rows={2} placeholder="Why do you need this swap?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSwapDialog(false)}>Cancel</Button>
            <Button onClick={handleRequestSwap} disabled={!swapTargetId || !swapMySlotId || !swapReason.trim()}>
              <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ABSENCE REPORT DIALOG ── */}
      <Dialog open={showAbsenceDialog} onOpenChange={o => { if (!o) setShowAbsenceDialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report Absence</DialogTitle>
            <DialogDescription>Your supervisor and HR will be notified immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Absence Type *</Label>
              <Select value={absenceType} onValueChange={v => setAbsenceType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sick">Sick — Illness / Medical</SelectItem>
                  <SelectItem value="Emergency">Emergency — Family / Urgent</SelectItem>
                  <SelectItem value="Personal">Personal — Other reason</SelectItem>
                  <SelectItem value="Approved Leave">Approved Leave — Already approved by HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason / Description *</Label>
              <Textarea value={absenceReason} onChange={e => setAbsenceReason(e.target.value)} rows={2} placeholder="Describe the reason in brief…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Proof / Document Note (optional)</Label>
              <Input value={absenceProof} onChange={e => setAbsenceProof(e.target.value)} placeholder="e.g. Doctor prescription for 2 days rest" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Arranged Cover (optional but recommended)</Label>
              <Select value={absenceCoverId} onValueChange={id => {
                setAbsenceCoverId(id);
                setAbsenceCoverName(teammates.find(t => t.id === id)?.name ?? "");
              }}>
                <SelectTrigger><SelectValue placeholder="Who will cover your shift?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No cover arranged</SelectItem>
                  {teammates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
              ⚠ Unapproved absences may result in a salary deduction. Approved sick leaves are fully paid.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbsenceDialog(false)}>Cancel</Button>
            <Button onClick={handleReportAbsence} disabled={!absenceReason.trim()}>
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />Report Absence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
