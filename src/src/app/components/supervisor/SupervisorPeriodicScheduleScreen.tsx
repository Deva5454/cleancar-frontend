/**
 * SupervisorPeriodicScheduleScreen.tsx
 *
 * Supervisor view for managing periodic service schedules.
 *
 * What the supervisor can do:
 *   - See all customers with periodic services due in the next 7 days
 *   - See each customer's monthly cap and how many are used/remaining
 *   - Reschedule a specific occurrence to a different date in the same billing month
 *   - Cannot reschedule an already-completed occurrence
 *   - Cannot reschedule to a date that would exceed the monthly cap
 *
 * Rules enforced by periodicScheduleService:
 *   - New date must be in the same billing month
 *   - Monthly cap cannot be exceeded (customer does not get an extra service)
 *   - Already-completed services cannot be moved
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import {
  CalendarDays, ChevronRight, RefreshCw, AlertCircle,
  CheckCircle2, Clock, User, Repeat2, Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  periodicScheduleService,
  PERIODIC_SERVICE_META,
  type PeriodicOccurrence,
  type MonthlyUsage,
} from "../../services/periodicScheduleService";
import { mockWasherDataService } from "../../services/mockWasherDataService";
import { useRole } from "../../contexts/RoleContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CustomerRow {
  customerId: string;
  customerName: string;
  packageType: string;
  occurrences: PeriodicOccurrence[];
  monthlyUsage: MonthlyUsage;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PKG_COLORS: Record<string, string> = {
  SHINE:    "bg-blue-50 text-blue-700 border-blue-200",
  PROTECT:  "bg-purple-50 text-purple-700 border-purple-200",
  ELITE:    "bg-green-50 text-green-700 border-green-200",
  ELITE_2W: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled:    "bg-teal-50 text-teal-700 border-teal-200",
  completed:    "bg-green-50 text-green-700 border-green-200",
  rescheduled:  "bg-purple-50 text-purple-700 border-purple-200",
  skipped:      "bg-gray-50 text-gray-500 border-gray-200",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", weekday: "short",
  });
}

function usageBar(used: number, cap: number): string {
  if (cap === 0) return "";
  return `${used}/${cap}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SupervisorPeriodicScheduleScreen() {
  const { currentUser } = useRole();
  const supervisorId = currentUser?.employeeId ?? "SUP-UNKNOWN";

  const [rows, setRows]           = useState<CustomerRow[]>([]);
  const [lookAheadDays, setLookAheadDays] = useState(7);
  const [loading, setLoading]     = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    customerId: string;
    customerName: string;
    occ: PeriodicOccurrence;
    usage: MonthlyUsage;
  } | null>(null);
  const [newDate, setNewDate]     = useState("");
  const [reason, setReason]       = useState("");
  const [rescheduleError, setRescheduleError] = useState("");

  // ── Seed + load ─────────────────────────────────────────────────────────────

  const loadRows = useCallback(() => {
    setLoading(true);
    try {
      // Seed all today's jobs into periodicScheduleService if not already done
      const jobs = mockWasherDataService.getTodayJobs();
      periodicScheduleService.seedFromJobs(
        jobs.map(j => ({
          id: j.id,
          customerFirstName: j.customerFirstName,
          packageType: j.packageType,
          subscriptionStartDate: j.subscriptionStartDate,
        }))
      );

      const upcoming = periodicScheduleService.getAllCustomersUpcoming(lookAheadDays);
      setRows(upcoming.filter(r => r.occurrences.length > 0));
    } finally {
      setLoading(false);
    }
  }, [lookAheadDays]);

  useEffect(() => { loadRows(); }, [loadRows]);

  // ── Reschedule flow ──────────────────────────────────────────────────────────

  function openReschedule(row: CustomerRow, occ: PeriodicOccurrence) {
    setRescheduleTarget({
      customerId:   row.customerId,
      customerName: row.customerName,
      occ,
      usage: row.monthlyUsage,
    });
    setNewDate(occ.scheduledDate);
    setReason("");
    setRescheduleError("");
  }

  function confirmReschedule() {
    if (!rescheduleTarget) return;
    if (!newDate) { setRescheduleError("Please select a new date."); return; }
    if (!reason.trim()) { setRescheduleError("Reason is required."); return; }

    const result = periodicScheduleService.reschedule(
      rescheduleTarget.customerId,
      rescheduleTarget.occ.id,
      newDate,
      supervisorId,
      reason,
    );

    if (result.success) {
      toast.success(result.message);
      setRescheduleTarget(null);
      loadRows();
    } else {
      setRescheduleError(result.message);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const totalDue = rows.reduce((s, r) => s + r.occurrences.length, 0);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-600" />
            Periodic Service Schedule
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Next {lookAheadDays} days · {totalDue} service{totalDue !== 1 ? "s" : ""} due ·
            Tap any service to reschedule within the month
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRows} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Look-ahead selector */}
      <div className="flex gap-2">
        {[3, 7, 14].map(d => (
          <button
            key={d}
            onClick={() => setLookAheadDays(d)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              lookAheadDays === d
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {/* Rules callout */}
      <Alert className="border-amber-200 bg-amber-50 py-2">
        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
        <AlertDescription className="text-xs text-amber-800">
          <strong>Cap rule:</strong> You can move a service to a different day in the same month —
          but the customer cannot receive an additional service beyond their plan's monthly allowance.
          Completed services cannot be rescheduled.
        </AlertDescription>
      </Alert>

      {/* Customer rows */}
      {rows.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">
          No periodic services due in the next {lookAheadDays} days.
        </div>
      ) : (
        rows.map(row => (
          <Card key={row.customerId} className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800">{row.customerName}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PKG_COLORS[row.packageType] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {row.packageType}
                  </span>
                </div>
                {/* Monthly usage badges */}
                <div className="flex gap-1">
                  {(Object.entries(row.monthlyUsage) as [string, { used: number; cap: number }][])
                    .filter(([, v]) => v.cap > 0)
                    .map(([svc, v]) => (
                      <span key={svc} className={`text-xs px-1.5 py-0.5 rounded border ${
                        v.used >= v.cap ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-gray-500 border-gray-200"
                      }`}>
                        {PERIODIC_SERVICE_META[svc as keyof typeof PERIODIC_SERVICE_META]?.icon}
                        {" "}{usageBar(v.used, v.cap)}
                        {v.used >= v.cap && " 🔒"}
                      </span>
                    ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-gray-100">
              {row.occurrences.map(occ => {
                const meta      = PERIODIC_SERVICE_META[occ.serviceType];
                const isLocked  = occ.status === "completed";
                const capEntry  = row.monthlyUsage[occ.serviceType as keyof MonthlyUsage];
                const capFull   = capEntry && capEntry.used >= capEntry.cap && occ.status !== "completed";

                return (
                  <div key={occ.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{meta.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-800">{meta.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[occ.status] ?? ""}`}>
                            {occ.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDate(occ.scheduledDate)}
                          </span>
                          {occ.status === "rescheduled" && (
                            <span className="text-xs text-purple-600">
                              (was {formatDate(occ.originalDate)})
                            </span>
                          )}
                          {occ.rescheduleReason && (
                            <span className="text-xs text-gray-400 italic">
                              · {occ.rescheduleReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLocked ? (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Done
                        </div>
                      ) : capFull ? (
                        <div className="flex items-center gap-1 text-xs text-red-500">
                          <Lock className="w-3.5 h-3.5" />
                          Cap full
                        </div>
                      ) : (
                        <Button
                          variant="outline" size="sm"
                          className="h-7 text-xs gap-1 text-purple-700 border-purple-200 hover:bg-purple-50"
                          onClick={() => openReschedule(row, occ)}
                        >
                          <Repeat2 className="w-3 h-3" />
                          Reschedule
                        </Button>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}

      {/* Reschedule dialog */}
      <Dialog
        open={!!rescheduleTarget}
        onOpenChange={v => { if (!v) setRescheduleTarget(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat2 className="w-4 h-4 text-purple-600" />
              Reschedule Service
            </DialogTitle>
            <DialogDescription>
              {rescheduleTarget && (
                <>
                  {PERIODIC_SERVICE_META[rescheduleTarget.occ.serviceType]?.icon}{" "}
                  <strong>{PERIODIC_SERVICE_META[rescheduleTarget.occ.serviceType]?.name}</strong>{" "}
                  for <strong>{rescheduleTarget.customerName}</strong>
                  <br />
                  Currently: {formatDate(rescheduleTarget.occ.scheduledDate)} ·
                  Billing month: {rescheduleTarget.occ.billingMonth}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {rescheduleTarget && (
            <div className="space-y-4 py-1">

              {/* Monthly cap warning */}
              {(() => {
                const svc   = rescheduleTarget.occ.serviceType as keyof MonthlyUsage;
                const entry = rescheduleTarget.usage[svc];
                if (!entry || entry.cap === 0) return null;
                const remaining = entry.cap - entry.used;
                return (
                  <div className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-2 ${
                    remaining <= 1
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-teal-50 border-teal-200 text-teal-800"
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Monthly allowance: <strong>{entry.used} used / {entry.cap} max</strong>.
                    Rescheduling moves this occurrence — it does not add an extra service.
                  </div>
                );
              })()}

              {/* New date picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">New date</label>
                <Input
                  type="date"
                  value={newDate}
                  min={`${rescheduleTarget.occ.billingMonth}-01`}
                  max={`${rescheduleTarget.occ.billingMonth}-31`}
                  onChange={e => { setNewDate(e.target.value); setRescheduleError(""); }}
                  className="text-sm"
                />
                <p className="text-xs text-gray-400">
                  Must be within billing month {rescheduleTarget.occ.billingMonth}
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Reason (required)</label>
                <Input
                  placeholder="e.g. Customer requested, washer unavailable…"
                  value={reason}
                  onChange={e => { setReason(e.target.value); setRescheduleError(""); }}
                  className="text-sm"
                />
              </div>

              {/* Error */}
              {rescheduleError && (
                <Alert className="border-red-200 bg-red-50 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                  <AlertDescription className="text-xs text-red-700">
                    {rescheduleError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>Cancel</Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={confirmReschedule}
            >
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
