/**
 * CustomerPeriodicNotificationScreen.tsx
 *
 * Customer-facing: D-1 periodic service notifications.
 * Customer can CONFIRM or RESCHEDULE each upcoming periodic service.
 *
 * Rules enforced (HR OBB §7 + Bot IVR Flow v3 §4):
 *   - Reschedule only within same billing month
 *   - Request must be ≥4 hours before scheduled service time
 *   - Monthly cap cannot be exceeded
 *   - No carryforward, no reimbursement at end of term
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Calendar, CheckCircle2, RefreshCw, Clock,
  AlertCircle, ChevronRight, Bell, Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  periodicNotificationService,
  type PeriodicNotification,
} from "../../services/periodicNotificationService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });
}
function bandLabel(b: "BAND_A" | "BAND_B") {
  return b === "BAND_A" ? "5:00 AM – 7:00 AM" : "7:00 AM – 9:00 AM";
}
function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function addDays(d: string, n: number) {
  const dt = new Date(d); dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
}

// ── Balance pill ──────────────────────────────────────────────────────────────

function BalancePill({ icon, label, used, cap }: {
  icon: string; label: string; used: number; cap: number;
}) {
  if (cap === 0) return null;
  const rem = cap - used;
  const pct = Math.round((used / cap) * 100);
  const cls = rem === 0
    ? "bg-red-50 border-red-200 text-red-700"
    : rem === 1
    ? "bg-amber-50 border-amber-200 text-amber-700"
    : "bg-green-50 border-green-200 text-green-700";
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${cls}`}>
      <span>{icon} {label}</span>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div className="h-full bg-current rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-semibold text-xs">{rem}/{cap} left</span>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  customerId: string;
  notificationId?: string;
  onDismiss?: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function CustomerPeriodicNotificationScreen({ customerId, notificationId, onDismiss }: Props) {
  const [all, setAll]         = useState<PeriodicNotification[]>([]);
  const [active, setActive]   = useState<PeriodicNotification | null>(null);
  const [step, setStep]       = useState<"VIEW" | "RESCHEDULE" | "DONE">("VIEW");
  const [newDate, setNewDate] = useState("");
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const load = () => {
    periodicNotificationService.checkNoResponseExpiry();
    const pending = periodicNotificationService
      .getForCustomer(customerId)
      .filter(n => n.status === "PENDING" || n.status === "RESCHEDULE_REQUESTED");
    setAll(pending);
    if (notificationId) {
      setActive(pending.find(n => n.id === notificationId) ?? pending[0] ?? null);
    } else {
      setActive(prev => prev ? pending.find(n => n.id === prev.id) ?? pending[0] ?? null : pending[0] ?? null);
    }
  };

  useEffect(() => { load(); }, [customerId, notificationId]); // eslint-disable-line

  // CONFIRM
  const onConfirm = () => {
    if (!active) return;
    periodicNotificationService.confirmService(active.id);
    toast.success("Service confirmed!");
    setDoneMsg(`✅ ${active.serviceName} confirmed for ${fmtDate(active.scheduledDate)}, ${bandLabel(active.timeBand)}. Your washer will arrive in 2 days.`);
    setStep("DONE");
    load();
  };

  // RESCHEDULE submit
  const onReschedule = () => {
    if (!active || !newDate) return;
    setBusy(true); setErr(null);
    const v = periodicNotificationService.validateReschedule(active.id, newDate);
    if (!v.valid) { setErr(v.message); setBusy(false); return; }
    const r = periodicNotificationService.commitReschedule(active.id, newDate);
    setBusy(false);
    if (!r.success) { setErr(r.message); return; }
    toast.success("Rescheduled!");
    setDoneMsg(`✅ ${active.serviceName} rescheduled to ${fmtDate(newDate)}.`);
    setStep("DONE");
    load();
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (all.length === 0 && step !== "DONE") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
        </div>
        <p className="font-semibold text-gray-800 mb-1">No pending notifications</p>
        <p className="text-sm text-gray-500">We'll notify you 48 hours before your next periodic service. You'll have until 24 hours before to confirm or reschedule.</p>
        {onDismiss && <Button variant="outline" className="mt-6" onClick={onDismiss}>Back</Button>}
      </div>
    );
  }

  // ── Done state ─────────────────────────────────────────────────────────────
  if (step === "DONE" && doneMsg) {
    const next = all.find(n => n.id !== active?.id);
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <p className="font-semibold text-gray-800 mb-2">{doneMsg}</p>
        <div className="w-full mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left text-xs text-amber-700">
          <p className="font-semibold mb-0.5">Plan reminder</p>
          <p>Unused periodic services at month end are not carried forward and are not reimbursed at subscription end.</p>
        </div>
        {next && (
          <Button className="mt-5 w-full" onClick={() => { setActive(next); setStep("VIEW"); setDoneMsg(null); setErr(null); }}>
            Next notification <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        )}
        {onDismiss && <Button variant="ghost" className="mt-2 w-full" onClick={onDismiss}>Done</Button>}
      </div>
    );
  }

  if (!active) return null;
  const u = active.monthlyUsage;

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto pb-24">

      {/* Header banner */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-5 py-5 rounded-b-2xl mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-yellow-300" />
          <span className="text-xs font-semibold text-yellow-300 tracking-wide uppercase">48-hour advance notice</span>
        </div>
        <h2 className="text-xl font-bold mb-0.5">Periodic Service in 2 Days</h2>
        <p className="text-sm text-slate-300">Please confirm or reschedule by tomorrow (24 hours before your service).</p>
        {all.length > 1 && (
          <div className="mt-3 flex gap-1.5">
            {all.map(n => (
              <button key={n.id} onClick={() => { setActive(n); setStep("VIEW"); setErr(null); }}
                className={`h-1.5 rounded-full transition-all ${n.id === active.id ? "bg-yellow-300 w-6" : "bg-white/30 w-1.5"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Service card */}
      <Card className="mx-4 mb-3 border-0 shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{active.serviceIcon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="font-semibold text-gray-900 truncate">{active.serviceName}</p>
                <Badge variant="outline" className="text-xs shrink-0">{active.packageType}</Badge>
              </div>
              <p className="text-sm text-gray-500">{active.customerName}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{fmtDate(active.scheduledDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{bandLabel(active.timeBand)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly balance */}
      <Card className="mx-4 mb-3 border-0 shadow-sm">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Monthly balance — after tomorrow&apos;s service
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          <BalancePill icon="🧴" label="Shampoo Wash"    used={u.shampoo.used}  cap={u.shampoo.cap}  />
          <BalancePill icon="🪣" label="Interior Vacuum" used={u.interior.used} cap={u.interior.cap} />
          <BalancePill icon="✨" label="Hand Wax Polish" used={u.wax.used}      cap={u.wax.cap}      />
          <BalancePill icon="🪟" label="Glass Clean"     used={u.glass.used}    cap={u.glass.cap}    />
          <BalancePill icon="🛞" label="Tyre Dressing"   used={u.tyre.used}     cap={u.tyre.cap}     />
        </CardContent>
      </Card>

      {/* Policy notice — no carryforward, no reimbursement */}
      <div className="mx-4 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-1">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <p className="text-xs font-semibold text-amber-800">Periodic Service Policy</p>
        </div>
        <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside ml-1">
          <li>You can use <strong>all</strong> your monthly services within the same month.</li>
          <li>You <strong>cannot</strong> exceed your plan&apos;s monthly limit, even via rescheduling.</li>
          <li>Unused services do <strong>not carry forward</strong> to the next month.</li>
          <li>At the end of your subscription term, unused services are <strong>not reimbursed</strong> and no discount is applied.</li>
        </ul>
      </div>

      {/* Error */}
      {err && (
        <Alert variant="destructive" className="mx-4 mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{err}</AlertDescription>
        </Alert>
      )}

      {/* Reschedule form */}
      {step === "RESCHEDULE" && (
        <Card className="mx-4 mb-4 border-purple-200 shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-purple-700 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Choose new date
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
              <li>New date must be within billing month: <strong>{active.billingMonth}</strong></li>
              <li>Request must be made ≥24 hours before scheduled service time</li>
              <li>Cannot exceed your monthly plan limit (cap enforced automatically)</li>
              <li>Unused services after reschedule are not carried forward or reimbursed</li>
            </ul>
            <Input
              type="date"
              value={newDate}
              min={todayStr()}
              max={`${active.billingMonth}-31`}
              onChange={e => { setNewDate(e.target.value); setErr(null); }}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setStep("VIEW"); setErr(null); }}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-700 hover:bg-purple-800"
                onClick={onReschedule}
                disabled={!newDate || busy}
              >
                {busy ? "Checking…" : "Confirm new date"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      {step === "VIEW" && (
        <div className="mx-4 space-y-2.5">
          <Button
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold h-12"
            onClick={onConfirm}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Confirm — proceed as scheduled
          </Button>
          <Button
            variant="outline"
            className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold h-12"
            onClick={() => { setStep("RESCHEDULE"); setErr(null); setNewDate(addDays(todayStr(), 1)); }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reschedule to another date
          </Button>
<p className="text-center text-xs text-gray-400">No reply by tomorrow (D-1) = auto-confirmed. A second message will be sent.</p>
        </div>
      )}
    </div>
  );
}
