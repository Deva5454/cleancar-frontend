/**
 * SHDailyActivity.tsx
 *
 * Real Sales Head Daily Report. Reuses SM's proven morning -> field ->
 * evening lock-progression pattern and the same real storage approach
 * (dailyReportService's SH_DAILY_REPORT_${employeeId}_${date} key), but
 * with a field section reflecting Sales Head's actual real work -
 * BTL approvals, coaching sessions, escalations resolved - rather than
 * personal site visits, since Sales Head doesn't do routine field travel
 * the way Sales Manager does.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Star, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { salesManagerService } from "../../services/salesManagerService";
import { salesHeadService } from "../../services/salesHeadService";

interface SHDailyReport {
  date: string;
  employeeId: string;
  morning: {
    locked: boolean;
    priorityForDay: string;
    pendingApprovals: number;
    pendingEscalations: number;
  };
  field: {
    locked: boolean;
    btlApprovalsToday: number;
    coachingSessionsHeld: number;
    escalationsResolved: number;
    notes: string;
  };
  evening: {
    locked: boolean;
    dayRating: 1 | 2 | 3 | 4 | 5;
    biggestWin: string;
    biggestBlock: string;
    tomorrowTop3: string;
    escalationsRaised: number;
    submittedAt?: string;
  };
}

const TODAY = new Date().toISOString().split("T")[0];

function storageKeyFor(employeeId: string): string {
  return `SH_DAILY_REPORT_${employeeId}_${TODAY}`;
}

function loadReport(employeeId: string): SHDailyReport {
  try {
    const s = localStorage.getItem(storageKeyFor(employeeId));
    if (s) {
      const r = JSON.parse(s);
      if (r && typeof r === "object" && r.employeeId) return r as SHDailyReport;
    }
  } catch { /**/ }

  const pendingApprovals = salesManagerService.getLocations().filter(l => l.status === "Pending Approval").length;
  const pendingEscalations = salesHeadService.getAlerts().filter(a => a.actionRequired).length;
  const coachingToday = salesHeadService.getCoachingNotes().filter(n => n.date === TODAY).length;

  return {
    date: TODAY,
    employeeId,
    morning: { locked: false, priorityForDay: "", pendingApprovals, pendingEscalations },
    field: { locked: false, btlApprovalsToday: 0, coachingSessionsHeld: coachingToday, escalationsResolved: 0, notes: "" },
    evening: { locked: false, dayRating: 3, biggestWin: "", biggestBlock: "", tomorrowTop3: "", escalationsRaised: 0 },
  };
}

function saveReport(r: SHDailyReport) {
  try { localStorage.setItem(storageKeyFor(r.employeeId), JSON.stringify(r)); } catch { /**/ }
}

export function SHDailyActivity() {
  const { currentUser } = useRole();
  const employeeId = currentUser?.employeeId || "";
  const [report, setReport] = useState<SHDailyReport>(() => loadReport(employeeId));

  const update = (next: SHDailyReport) => {
    setReport(next);
    saveReport(next);
  };

  const lockMorning = () => {
    update({ ...report, morning: { ...report.morning, locked: true } });
    toast.success("Morning priorities locked in.");
  };

  const lockField = () => {
    update({ ...report, field: { ...report.field, locked: true } });
    toast.success("Today's activity locked in.");
  };

  const submitEvening = () => {
    update({ ...report, evening: { ...report.evening, locked: true, submittedAt: new Date().toISOString() } });
    toast.success("Daily report submitted.");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">My Daily Report</h2>
        <p className="text-sm text-gray-500">{TODAY}</p>
      </div>

      {/* Real, confirmed addition - same self-reminder pattern as SM's report */}
      {new Date().getHours() >= 17 && !report.morning.locked && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800">
          <Star className="w-3.5 h-3.5 shrink-0"/>
          <strong>It's after 5 PM and today's report hasn't been started yet.</strong> Lock in your morning priorities to get going.
        </div>
      )}

      {/* Morning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Morning — Today's Priorities</span>
            {report.morning.locked && <Badge variant="default"><Lock className="w-3 h-3 mr-1" />Locked</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 bg-amber-50 rounded border border-amber-200">
              <span className="text-gray-500">Pending BTL Approvals:</span> <span className="font-medium">{report.morning.pendingApprovals}</span>
            </div>
            <div className="p-2 bg-red-50 rounded border border-red-200">
              <span className="text-gray-500">Open Escalations:</span> <span className="font-medium">{report.morning.pendingEscalations}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Priority for the day</label>
            <Textarea
              value={report.morning.priorityForDay}
              disabled={report.morning.locked}
              onChange={e => update({ ...report, morning: { ...report.morning, priorityForDay: e.target.value } })}
              placeholder="What's the single most important thing today?"
              rows={2}
            />
          </div>
          {!report.morning.locked && (
            <Button size="sm" onClick={lockMorning}>Lock In Morning Priorities</Button>
          )}
        </CardContent>
      </Card>

      {/* Field — real Sales Head work */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Today's Activity</span>
            {report.field.locked && <Badge variant="default"><Lock className="w-3 h-3 mr-1" />Locked</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">BTL Approvals Made</label>
              <Input type="number" min={0} value={report.field.btlApprovalsToday} disabled={report.field.locked}
                onChange={e => update({ ...report, field: { ...report.field, btlApprovalsToday: Number(e.target.value) } })} />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Coaching Sessions Held</label>
              <Input type="number" min={0} value={report.field.coachingSessionsHeld} disabled={report.field.locked}
                onChange={e => update({ ...report, field: { ...report.field, coachingSessionsHeld: Number(e.target.value) } })} />
              <p className="text-[10px] text-gray-400 mt-0.5">Pre-filled from today's real coaching notes — adjust if needed.</p>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Escalations Resolved</label>
              <Input type="number" min={0} value={report.field.escalationsResolved} disabled={report.field.locked}
                onChange={e => update({ ...report, field: { ...report.field, escalationsResolved: Number(e.target.value) } })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Notes</label>
            <Textarea
              value={report.field.notes}
              disabled={report.field.locked}
              onChange={e => update({ ...report, field: { ...report.field, notes: e.target.value } })}
              placeholder="Anything else worth recording about today"
              rows={2}
            />
          </div>
          {!report.field.locked && (
            <Button size="sm" disabled={!report.morning.locked} onClick={lockField}>
              Lock In Today's Activity
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Evening */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Evening — Wrap Up</span>
            {report.evening.locked && <Badge variant="default"><CheckCircle2 className="w-3 h-3 mr-1" />Submitted</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Day rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} disabled={report.evening.locked}
                  onClick={() => update({ ...report, evening: { ...report.evening, dayRating: n as 1|2|3|4|5 } })}>
                  <Star className={`w-6 h-6 ${n <= report.evening.dayRating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Biggest win today</label>
            <Textarea value={report.evening.biggestWin} disabled={report.evening.locked} rows={2}
              onChange={e => update({ ...report, evening: { ...report.evening, biggestWin: e.target.value } })} />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Biggest blocker</label>
            <Textarea value={report.evening.biggestBlock} disabled={report.evening.locked} rows={2}
              onChange={e => update({ ...report, evening: { ...report.evening, biggestBlock: e.target.value } })} />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Tomorrow's top 3</label>
            <Textarea value={report.evening.tomorrowTop3} disabled={report.evening.locked} rows={2}
              onChange={e => update({ ...report, evening: { ...report.evening, tomorrowTop3: e.target.value } })} />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">New escalations raised today</label>
            <Input type="number" min={0} value={report.evening.escalationsRaised} disabled={report.evening.locked}
              onChange={e => update({ ...report, evening: { ...report.evening, escalationsRaised: Number(e.target.value) } })} />
          </div>
          {!report.evening.locked && (
            <Button size="sm" disabled={!report.field.locked} onClick={submitEvening}>
              Submit Daily Report
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
