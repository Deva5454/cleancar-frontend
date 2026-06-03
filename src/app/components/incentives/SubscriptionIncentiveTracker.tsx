/**
 * SubscriptionIncentiveTracker.tsx
 *
 * Role-aware incentive tracker showing every subscription the logged-in
 * employee is part of, with full tranche breakdown:
 *   - PAID      ✅ green — disbursed
 *   - PENDING   🕐 amber — due on date
 *   - FORFEITED ❌ red   — subscriber cancelled
 *
 * Exit payout calculator: shown when a subscription is cancelled,
 * tells ops exactly what must be paid now vs what is forfeited.
 *
 * Roles supported: TSE · SM · SH · TSM · Supervisor
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp,
  TrendingUp, AlertTriangle, IndianRupee, Users, Info,
} from "lucide-react";
import {
  incentiveV6,
  incentiveStructureService,
  type RoleIncentiveSummary,
  type SubscriptionIncentiveRecord,
  type IncentiveTranche,
  type IncentiveRole,
  type ExitPayoutSummary,
  POOL_BY_TERM,
} from "../../services/incentiveStructureV6";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}
const STATUS_CONFIG = {
  PAID:      { label: "Paid",      icon: CheckCircle2, cls: "bg-green-50  border-green-200  text-green-700"  },
  PENDING:   { label: "Pending",   icon: Clock,        cls: "bg-amber-50  border-amber-200  text-amber-700"  },
  FORFEITED: { label: "Forfeited", icon: XCircle,      cls: "bg-red-50    border-red-200    text-red-700"    },
};

// ── Tranche row ───────────────────────────────────────────────────────────────

function TrancheRow({ t, myAmount }: { t: IncentiveTranche; myAmount: number }) {
  const cfg = STATUS_CONFIG[t.status];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${cfg.cls}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="font-medium">{t.checkMonth}</span>
        <span className="text-xs opacity-70">· due {fmtDate(t.dueDate)}</span>
        {t.status === "PAID" && t.paidDate && (
          <span className="text-xs opacity-60">· paid {fmtDate(t.paidDate)}</span>
        )}
        {t.status === "FORFEITED" && t.forfeitedReason === "CANCELLATION" && (
          <span className="text-xs opacity-60">· subscriber cancelled</span>
        )}
      </div>
      <div className="text-right">
        <p className="font-semibold">{fmt(myAmount)}</p>
        <p className="text-xs opacity-60">pool {fmt(t.poolAmount)}</p>
      </div>
    </div>
  );
}

// ── Exit payout panel ─────────────────────────────────────────────────────────

function ExitPayoutPanel({ exit, myRole, myId }: {
  exit: ExitPayoutSummary; myRole: IncentiveRole; myId: string;
}) {
  const myRow = exit.byRole.find(r => r.employeeId === myId);
  return (
    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
      <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4" /> Subscription Cancelled — Exit Payout
      </p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white rounded-lg p-2 border border-red-100 text-center">
          <p className="text-xs text-gray-500">Your amount due</p>
          <p className="font-bold text-green-700">{fmt(myRow?.due ?? 0)}</p>
          <p className="text-xs text-gray-400">must be paid</p>
        </div>
        <div className="bg-white rounded-lg p-2 border border-red-100 text-center">
          <p className="text-xs text-gray-500">Your forfeited</p>
          <p className="font-bold text-red-600">{fmt(myRow?.forfeited ?? 0)}</p>
          <p className="text-xs text-gray-400">future tranches lost</p>
        </div>
      </div>
      <p className="text-xs text-red-700">
        Due = check-months that passed before {fmtDate(exit.exitDate)}.
        Forfeited = check-months not yet reached.
      </p>
    </div>
  );
}

// ── Single subscription card ──────────────────────────────────────────────────

function SubCard({ rec, myId, myRole }: {
  rec: SubscriptionIncentiveRecord;
  myId: string;
  myRole: IncentiveRole;
}) {
  const [open, setOpen] = useState(false);

  const myTranches = rec.tranches.map(t => ({
    t,
    myAmount: t.rolePayouts.find(rp => rp.employeeId === myId)?.amount ?? 0,
  }));

  const paid      = myTranches.filter(x => x.t.status === "PAID").reduce((s, x) => s + x.myAmount, 0);
  const pending   = myTranches.filter(x => x.t.status === "PENDING").reduce((s, x) => s + x.myAmount, 0);
  const forfeited = myTranches.filter(x => x.t.status === "FORFEITED").reduce((s, x) => s + x.myAmount, 0);
  const total     = paid + pending + forfeited;

  const exitSummary = rec.status === "CANCELLED"
    ? incentiveV6.processCancellation(rec.subscriptionId, rec.cancelledDate!)
    : null;

  const planColor = rec.planType === "ELITE_WASH" ? "bg-amber-100 text-amber-800"
    : rec.planType === "SMART_WASH" ? "bg-blue-100 text-blue-800"
    : "bg-gray-100 text-gray-700";

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden
      ${rec.status === "CANCELLED" ? "border-red-200 opacity-80" : "border-gray-200"}`}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="font-semibold text-gray-900 text-sm truncate">{rec.customerName}</p>
              <Badge className={`text-xs ${planColor} border-0`}>{rec.planType}</Badge>
              <Badge variant="outline" className="text-xs">{rec.term}M</Badge>
              {rec.status === "CANCELLED" && (
                <Badge className="text-xs bg-red-100 text-red-700 border-0">Cancelled</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {rec.vehicleCategory} · {fmt(rec.monthlyAmount)}/mo ·
              Source: <span className="font-medium">{rec.source}</span> ·
              Pool: {rec.isZeroPool ? "₹0 (Express Wash H)" : fmt(rec.poolTotal)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          {/* Mini status pills */}
          <div className="hidden sm:flex gap-1.5">
            {paid      > 0 && <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">{fmt(paid)} paid</span>}
            {pending   > 0 && <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">{fmt(pending)} due</span>}
            {forfeited > 0 && <span className="text-xs font-semibold text-red-700   bg-red-50   border border-red-200   px-1.5 py-0.5 rounded">{fmt(forfeited)} forfeited</span>}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Expanded tranche list */}
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
          {/* Calculation explanation */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
            <strong>How calculated:</strong> Pool ₹{rec.poolTotal} (₹150 × {rec.term}÷3) ·
            30/70 rule · Your {myRole} share:{" "}
            {myTranches[0]?.t.rolePayouts.find(rp => rp.employeeId === myId)?.pct ?? 0}% ·
            Activation {fmtDate(rec.activationDate)}
          </div>
          {myTranches.map(({ t, myAmount }) => (
            <TrancheRow key={t.id} t={t} myAmount={myAmount} />
          ))}
          {/* Total row */}
          <div className="flex justify-between pt-2 border-t border-gray-100 text-sm font-semibold">
            <span>Your total</span>
            <span>{fmt(total)}</span>
          </div>
          {/* Exit payout panel if cancelled */}
          {exitSummary && (
            <ExitPayoutPanel exit={exitSummary} myRole={myRole} myId={myId} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SummaryBar({ summary }: { summary: RoleIncentiveSummary }) {
  const total = summary.totalEarned + summary.totalPending + summary.totalForfeited;
  const earnedPct  = total > 0 ? (summary.totalEarned  / total) * 100 : 0;
  const pendingPct = total > 0 ? (summary.totalPending / total) * 100 : 0;

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: "Paid",      amount: summary.totalEarned,    cls: "text-green-700", bg: "bg-green-50  border-green-200", icon: CheckCircle2 },
        { label: "Pending",   amount: summary.totalPending,   cls: "text-amber-700", bg: "bg-amber-50  border-amber-200", icon: Clock        },
        { label: "Forfeited", amount: summary.totalForfeited, cls: "text-red-700",   bg: "bg-red-50    border-red-200",   icon: XCircle      },
      ].map(({ label, amount, cls, bg, icon: Icon }) => (
        <div key={label} className={`rounded-xl border px-3 py-3 ${bg} text-center`}>
          <Icon className={`w-4 h-4 mx-auto mb-1 ${cls}`} />
          <p className={`font-bold text-base ${cls}`}>{fmt(amount)}</p>
          <p className={`text-xs mt-0.5 ${cls} opacity-80`}>{label}</p>
        </div>
      ))}
      {/* Progress bar */}
      <div className="col-span-3 h-2 bg-gray-100 rounded-full overflow-hidden flex">
        <div className="bg-green-500 h-full transition-all" style={{ width: `${earnedPct}%` }} />
        <div className="bg-amber-400 h-full transition-all" style={{ width: `${pendingPct}%` }} />
        <div className="bg-red-300  h-full transition-all" style={{ width: `${100 - earnedPct - pendingPct}%` }} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  employeeId: string;
  role: IncentiveRole;
  employeeName?: string;
  showSHRolling?: boolean;   // for SH role
}

export function SubscriptionIncentiveTracker({
  employeeId, role, employeeName, showSHRolling,
}: Props) {
  const [summary, setSummary] = useState<RoleIncentiveSummary | null>(null);
  const [filter,  setFilter]  = useState<"ALL" | "ACTIVE" | "CANCELLED">("ALL");
  const [shRolling, setSHRolling] = useState<{ total: number } | null>(null);

  useEffect(() => {
    // Auto-process any overdue tranches first
    incentiveV6.autoProcessDueTranches(
      new Date().toISOString().split("T")[0]
    );
    setSummary(incentiveV6.getForEmployee(employeeId, role));
    if (role === "SH" || showSHRolling) {
      const now = new Date();
      setSHRolling(incentiveV6.getSHRolling(
        employeeId,
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      ));
    }
  }, [employeeId, role]);

  const filtered = useMemo(() => {
    if (!summary) return [];
    const seen = new Set<string>();
    return summary.tranches
      .filter(({ record }) => {
        if (filter === "ACTIVE"    && record.status !== "ACTIVE")    return false;
        if (filter === "CANCELLED" && record.status !== "CANCELLED") return false;
        return true;
      })
      .reduce<typeof summary.tranches>((acc, item) => {
        if (!seen.has(item.record.subscriptionId)) {
          seen.add(item.record.subscriptionId);
          acc.push(item);
        }
        return acc;
      }, []);
  }, [summary, filter]);

  if (!summary) return (
    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
      Loading incentive data…
    </div>
  );

  const uniqueRecs = filtered.map(x => x.record);

  return (
    <div className="max-w-2xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl px-5 py-5 mb-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">{role} · Incentive Tracker</p>
            <h2 className="text-xl font-bold mt-0.5">{employeeName || employeeId}</h2>
          </div>
          <IndianRupee className="w-8 h-8 text-yellow-300 opacity-80" />
        </div>
        <p className="text-xs text-slate-300 mt-2">
          30/70 disbursement rule · Split by source (Digital or BTL) · Plan sold does not affect your %
        </p>
        {shRolling && (
          <div className="mt-3 bg-white/10 rounded-lg px-3 py-2 text-sm">
            <span className="text-slate-300">1% rolling this month: </span>
            <span className="font-bold text-yellow-300">{fmt(shRolling.total)}</span>
            <span className="text-slate-400 text-xs ml-1">(all active subs incl. Bulk Deal)</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <SummaryBar summary={summary} />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["ALL", "ACTIVE", "CANCELLED"] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
              ${filter === f ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-600 border-gray-200 hover:border-slate-400"}`}
          >
            {f === "ALL" ? `All (${summary.tranches.reduce((s, x) => s + (s > 0 || true ? 0 : 0), 0) || uniqueRecs.length + 0})` : f}
          </button>
        ))}
      </div>

      {/* Subscription cards */}
      {uniqueRecs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Users className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No subscriptions assigned yet.</p>
          <p className="text-gray-400 text-xs mt-1">Incentive records appear once a subscription is activated with your ID.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {uniqueRecs.map(rec => (
            <SubCard key={rec.id} rec={rec} myId={employeeId} myRole={role} />
          ))}
        </div>
      )}

      {/* Governing rule reminder */}
      <div className="mt-6 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
        <p>
          <strong>Rule 2 — 30/70:</strong> 30% paid at M1 (activation). 70% split across M3 / M6 / M9 / M12 per term.
          Each tranche = ₹105 regardless of term length.
          <strong className="ml-1">Express Wash Hatchback = ₹0 for all roles.</strong>
          Cancelled subscriptions: tranches past due date are paid out; future tranches are forfeited.
        </p>
      </div>
    </div>
  );
}

// ── Export exit calculator as standalone ──────────────────────────────────────

export function ExitPayoutCalculator({ subscriptionId }: { subscriptionId: string }) {
  const today  = new Date().toISOString().split("T")[0];
  const result = incentiveV6.processCancellation(subscriptionId, today);
  if (!result) return <p className="text-sm text-gray-500">Subscription not found.</p>;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="font-semibold text-red-800 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> Exit Payout — {subscriptionId}
      </p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-green-200 text-center">
          <p className="text-xs text-gray-500 mb-1">Total Due (must pay)</p>
          <p className="text-xl font-bold text-green-700">{fmt(result.totalDue)}</p>
          <p className="text-xs text-gray-400">{result.dueToBePaid.length} tranche(s)</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-red-200 text-center">
          <p className="text-xs text-gray-500 mb-1">Total Forfeited</p>
          <p className="text-xl font-bold text-red-600">{fmt(result.totalForfeited)}</p>
          <p className="text-xs text-gray-400">{result.toBeForfeited.length} tranche(s)</p>
        </div>
      </div>
      <p className="text-xs font-semibold text-gray-700 mb-2">Per-role breakdown:</p>
      <div className="space-y-1.5">
        {result.byRole.map(r => (
          <div key={r.employeeId} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
            <span className="font-medium">{r.role} ({r.employeeId})</span>
            <span className="text-green-700 font-semibold">Pay: {fmt(r.due)}</span>
            <span className="text-red-600">Forfeit: {fmt(r.forfeited)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
