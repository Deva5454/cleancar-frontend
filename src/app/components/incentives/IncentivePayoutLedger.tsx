/**
 * IncentivePayoutLedger.tsx
 * 
 * Shows TSE and TSM exactly how their incentive is calculated
 * and tracks month-on-month payment status (M1/M3/M6/M9/M12).
 *
 * Architecture:
 *  - Reads from incentiveV6.getForEmployee(empId, role)
 *  - Groups tranches by calendar month
 *  - Shows pool formula, 30/70 split, per-subscription breakdown
 *  - Color-coded status: PAID (green) / PENDING (amber) / FORFEITED (red)
 */

import { useState, useEffect, useMemo } from "react";
import {
  incentiveV6,
  POOL_BY_TERM,
  POOL_SPLIT_PCT,
  TSE,
  TSM_PERSONAL_3M,
} from "../../services/incentiveStructureV6";
import type {
  RoleIncentiveSummary,
  IncentiveRole,
  SubscriptionIncentiveRecord,
  IncentiveTranche,
} from "../../services/incentiveStructureV6";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  ChevronDown, ChevronRight, Info, IndianRupee,
  CheckCircle2, Clock, XCircle, TrendingUp, Users, Zap
} from "lucide-react";

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  employeeId: string;
  role: "TSE" | "TSM";
  employeeName?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const fmtMonth = (iso: string) => {
  const [y, m] = iso.split("-");
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleString("en-IN", {
    month: "short", year: "2-digit",
  });
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  PAID:      { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: <CheckCircle2 size={13}/>, label: "Paid" },
  PENDING:   { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   icon: <Clock size={13}/>,        label: "Pending" },
  FORFEITED: { bg: "bg-red-50 border-red-200",         text: "text-red-700",     icon: <XCircle size={13}/>,      label: "Forfeited" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  );
}

// ── Formula Tooltip ────────────────────────────────────────────────────────────

function FormulaCard({ role }: { role: "TSE" | "TSM" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
          <Info size={15} /> How your incentive is calculated
        </div>
        {open ? <ChevronDown size={15} className="text-blue-600"/> : <ChevronRight size={15} className="text-blue-600"/>}
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-sm text-blue-900">
          {/* Pool formula */}
          <div>
            <div className="font-semibold mb-1">1. Pool per subscription</div>
            <div className="bg-white rounded-lg p-3 border border-blue-100 font-mono text-xs space-y-1">
              <div>Pool = ₹150 × (plan_months ÷ 3)</div>
              <div className="text-blue-500">  1M → ₹50 &nbsp;&nbsp; 3M → ₹150 &nbsp;&nbsp; 6M → ₹300 &nbsp;&nbsp; 12M → ₹600</div>
              <div className="mt-1 text-red-600">⚠ Express Wash (Hatchback) = ₹0 pool for all roles</div>
            </div>
          </div>

          {/* Your share */}
          <div>
            <div className="font-semibold mb-1">2. {role === "TSE" ? "Your" : "Your"} share of pool</div>
            <div className="bg-white rounded-lg p-3 border border-blue-100 text-xs space-y-1">
              {role === "TSE" ? (
                <>
                  <div>Digital/TSE-sourced: <strong>20%</strong> of pool = ₹{(150*0.20).toFixed(0)} per 3M sub</div>
                  <div>BTL-sourced: <strong>20%</strong> of pool = ₹{(150*0.20).toFixed(0)} per 3M sub</div>
                  <div className="text-amber-700">Gate condition: ≥10 closures this month to unlock variable pay</div>
                </>
              ) : (
                <>
                  <div>Personal conversions only: <strong>13%</strong> of pool = ₹{TSM_PERSONAL_3M.toFixed(2)} per 3M sub</div>
                  <div>Team pool (via DIGITAL subs): TSM also earns <strong>7.5%</strong> per sub your TSEs close</div>
                  <div className="text-amber-700">Team conversion bonus: ₹5k – ₹20k/month based on team closures</div>
                </>
              )}
            </div>
          </div>

          {/* 30/70 split */}
          <div>
            <div className="font-semibold mb-1">3. When you get paid — the 30/70 rule</div>
            <div className="bg-white rounded-lg p-3 border border-blue-100 text-xs space-y-2">
              <div className="flex gap-3">
                <div className="flex-1 bg-blue-50 rounded p-2">
                  <div className="font-semibold text-blue-800">Month 1 (M1)</div>
                  <div className="text-blue-700">30% of your total pool</div>
                  <div className="text-blue-500">Paid when subscription activates</div>
                </div>
                <div className="flex-1 bg-green-50 rounded p-2">
                  <div className="font-semibold text-green-800">Remaining months</div>
                  <div className="text-green-700">70% split equally across M3/M6/M9/M12</div>
                  <div className="text-green-500">Each tranche = ₹105 (for 3M sub)</div>
                </div>
              </div>
              <div className="border-t border-blue-100 pt-2">
                <div className="font-semibold mb-1">Example: 3M subscription, you earn ₹30 (20% of ₹150 pool)</div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-blue-100 px-2 py-1 rounded">M1: ₹9 (30%)</span>
                  <span className="bg-green-100 px-2 py-1 rounded">M3: ₹21 (70%)</span>
                </div>
              </div>
              <div className="border-t border-blue-100 pt-2">
                <div className="font-semibold mb-1">Example: 12M subscription, you earn ₹120 (20% of ₹600 pool)</div>
                <div className="flex gap-2 text-xs flex-wrap">
                  <span className="bg-blue-100 px-2 py-1 rounded">M1: ₹36</span>
                  <span className="bg-green-100 px-2 py-1 rounded">M3: ₹21</span>
                  <span className="bg-green-100 px-2 py-1 rounded">M6: ₹21</span>
                  <span className="bg-green-100 px-2 py-1 rounded">M9: ₹21</span>
                  <span className="bg-green-100 px-2 py-1 rounded">M12: ₹21</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-blue-600 bg-white rounded p-2 border border-blue-100">
            💡 Pending tranches are forfeited only if the customer cancels before that check-month.
            If they stay, you get paid even if you've left the team.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Monthly Summary Row ────────────────────────────────────────────────────────

interface MonthGroup {
  label: string;          // e.g. "May 2026"
  month: string;          // YYYY-MM
  earned: number;
  pending: number;
  forfeited: number;
  tranches: { record: SubscriptionIncentiveRecord; tranche: IncentiveTranche; myAmount: number }[];
}

function MonthRow({ group, role }: { group: MonthGroup; role: "TSE" | "TSM" }) {
  const [expanded, setExpanded] = useState(false);
  const total = group.earned + group.pending;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-2">
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-24 text-sm font-semibold text-gray-800">{group.label}</div>

        <div className="flex-1 flex items-center gap-2">
          {/* mini bar */}
          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden max-w-[120px]">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: total > 0 ? `${(group.earned / total) * 100}%` : "0%" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-right">
          {group.earned > 0 && (
            <span className="text-xs text-emerald-700 font-medium">{fmt(group.earned)} paid</span>
          )}
          {group.pending > 0 && (
            <span className="text-xs text-amber-600 font-medium">{fmt(group.pending)} pending</span>
          )}
          {group.forfeited > 0 && (
            <span className="text-xs text-red-500 font-medium">{fmt(group.forfeited)} forfeited</span>
          )}
        </div>

        <div className="text-sm font-bold text-gray-900 w-20 text-right">
          {fmt(group.earned + group.pending)}
        </div>

        <div className="text-gray-400 ml-2">
          {expanded ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}
        </div>
      </button>

      {/* Expanded subscription rows */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="px-4 py-2 grid grid-cols-[1fr_80px_80px_80px_100px] gap-2 text-xs font-medium text-gray-500 border-b border-gray-200">
            <span>Customer / Plan</span>
            <span className="text-center">Tranche</span>
            <span className="text-center">Pool</span>
            <span className="text-center">Your share</span>
            <span className="text-right">Status</span>
          </div>
          {group.tranches.map(({ record, tranche, myAmount }) => {
            const pct = record.isZeroPool ? 0 :
              (POOL_SPLIT_PCT[record.source]?.[role as IncentiveRole] ?? 0);
            return (
              <div
                key={tranche.id}
                className="px-4 py-2.5 grid grid-cols-[1fr_80px_80px_80px_100px] gap-2 items-center text-xs border-b border-gray-100 last:border-0 hover:bg-white transition-colors"
              >
                {/* Customer */}
                <div>
                  <div className="font-medium text-gray-800">{record.customerName}</div>
                  <div className="text-gray-500 mt-0.5">
                    {record.planType.replace("_", " ")} · {record.vehicleCategory.split(" /")[0]} · {record.term}M
                    <span className="ml-1.5 opacity-60">{record.source}</span>
                  </div>
                </div>
                {/* Tranche */}
                <div className="text-center font-mono text-gray-600">
                  {tranche.checkMonth}
                  <div className="text-gray-400 text-[10px]">{fmtMonth(tranche.dueDate)}</div>
                </div>
                {/* Pool amount */}
                <div className="text-center text-gray-600">
                  {record.isZeroPool ? (
                    <span className="text-red-400">₹0 rule</span>
                  ) : (
                    <>
                      {fmt(tranche.poolAmount)}
                      <div className="text-[10px] text-gray-400">
                        {tranche.checkMonth === "M1" ? "30%" : "70%÷n"}
                      </div>
                    </>
                  )}
                </div>
                {/* Your share */}
                <div className="text-center font-semibold text-gray-800">
                  {record.isZeroPool ? (
                    <span className="text-red-400">₹0</span>
                  ) : (
                    <>
                      {fmt(myAmount)}
                      <div className="text-[10px] text-gray-400">{pct}%</div>
                    </>
                  )}
                </div>
                {/* Status */}
                <div className="text-right">
                  <StatusBadge status={tranche.status} />
                  {tranche.paidDate && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Paid {fmtMonth(tranche.paidDate)}
                    </div>
                  )}
                  {tranche.forfeitedReason && (
                    <div className="text-[10px] text-red-400 mt-0.5">
                      {tranche.forfeitedReason.replace(/_/g, " ").toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function IncentivePayoutLedger({ employeeId, role, employeeName }: Props) {
  const [summary, setSummary] = useState<RoleIncentiveSummary | null>(null);
  const [loading, setLoading]  = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "PAID" | "FORFEITED">("ALL");

  useEffect(() => {
    setLoading(true);
    // Auto-process any due tranches first
    incentiveV6.autoProcessDueTranches(new Date().toISOString().split("T")[0]);
    const data = incentiveV6.getForEmployee(employeeId, role as any);
    setSummary(data);
    setLoading(false);
  }, [employeeId, role]);

  // Group tranches by the due-date calendar month
  const monthGroups = useMemo<MonthGroup[]>(() => {
    if (!summary) return [];
    const map = new Map<string, MonthGroup>();

    summary.tranches.forEach(({ record, tranche, myPayout }) => {
      const key = tranche.dueDate.slice(0, 7); // YYYY-MM
      if (!map.has(key)) {
        map.set(key, {
          label: new Date(key + "-01").toLocaleString("en-IN", { month: "long", year: "numeric" }),
          month: key,
          earned: 0, pending: 0, forfeited: 0,
          tranches: [],
        });
      }
      const g = map.get(key)!;
      g.tranches.push({ record, tranche, myAmount: myPayout.amount });
      if (myPayout.status === "PAID")      g.earned    += myPayout.amount;
      if (myPayout.status === "PENDING")   g.pending   += myPayout.amount;
      if (myPayout.status === "FORFEITED") g.forfeited += myPayout.amount;
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [summary]);

  const filtered = useMemo(() => {
    if (filterStatus === "ALL") return monthGroups;
    return monthGroups.filter(g =>
      g.tranches.some(({ tranche }) => tranche.status === filterStatus)
    );
  }, [monthGroups, filterStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading incentive ledger…
      </div>
    );
  }

  if (!summary || summary.tranches.length === 0) {
    return (
      <div className="space-y-4">
        <FormulaCard role={role} />
        <div className="text-center py-12 text-gray-400">
          <IndianRupee className="mx-auto mb-3 opacity-30" size={36} />
          <div className="text-sm">No incentive records yet.</div>
          <div className="text-xs mt-1">Records appear when subscriptions are activated.</div>
        </div>
      </div>
    );
  }

  const totalPaid     = summary.totalEarned;
  const totalPending  = summary.totalPending;
  const totalForfeited= summary.totalForfeited;
  const grandTotal    = totalPaid + totalPending;

  return (
    <div className="space-y-5">
      {/* ── Formula explainer ────────────────────────────────────────────── */}
      <FormulaCard role={role} />

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span className="text-xs text-emerald-700 font-medium">Total Paid</span>
          </div>
          <div className="text-2xl font-bold text-emerald-800">{fmt(totalPaid)}</div>
          <div className="text-xs text-emerald-600 mt-1">
            {summary.tranches.filter(t => t.myPayout.status === "PAID").length} tranches
          </div>
        </Card>

        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-amber-600" />
            <span className="text-xs text-amber-700 font-medium">Pending</span>
          </div>
          <div className="text-2xl font-bold text-amber-800">{fmt(totalPending)}</div>
          <div className="text-xs text-amber-600 mt-1">
            {summary.tranches.filter(t => t.myPayout.status === "PENDING").length} tranches upcoming
          </div>
        </Card>

        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-gray-600" />
            <span className="text-xs text-gray-600 font-medium">Lifetime Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{fmt(grandTotal)}</div>
          {totalForfeited > 0 && (
            <div className="text-xs text-red-500 mt-1">{fmt(totalForfeited)} forfeited</div>
          )}
        </Card>
      </div>

      {/* ── Visual payout timeline ────────────────────────────────────────── */}
      {monthGroups.length > 1 && (
        <Card className="p-4">
          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            Month-on-month breakdown
          </div>
          <div className="flex items-end gap-1.5 h-20">
            {monthGroups.map(g => {
              const total = g.earned + g.pending + g.forfeited;
              const maxVal = Math.max(...monthGroups.map(x => x.earned + x.pending + x.forfeited), 1);
              const pct = (total / maxVal) * 100;
              return (
                <div key={g.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm relative overflow-hidden min-h-[4px]"
                    style={{ height: `${Math.max(pct * 0.72, 4)}px` }}
                  >
                    <div className="absolute bottom-0 left-0 right-0 bg-emerald-400"
                      style={{ height: total > 0 ? `${(g.earned / total) * 100}%` : "0%" }} />
                    <div className="absolute left-0 right-0 bg-amber-300"
                      style={{
                        bottom: total > 0 ? `${(g.earned / total) * 100}%` : "0%",
                        height: total > 0 ? `${(g.pending / total) * 100}%` : "100%",
                      }} />
                    {g.forfeited > 0 && (
                      <div className="absolute top-0 left-0 right-0 bg-red-300"
                        style={{ height: `${(g.forfeited / total) * 100}%` }} />
                    )}
                  </div>
                  <div className="text-[9px] text-gray-400 text-center leading-tight">
                    {g.label.split(" ")[0].slice(0,3)}<br/>{g.label.split(" ")[1]}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block"/> Paid</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-300 inline-block"/> Pending</span>
            {totalForfeited > 0 && (
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-300 inline-block"/> Forfeited</span>
            )}
          </div>
        </Card>
      )}

      {/* ── Filter pills ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "PENDING", "PAID", "FORFEITED"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filterStatus === s
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {s === "ALL" ? `All months (${monthGroups.length})` : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* ── Month-by-month rows ───────────────────────────────────────────── */}
      <div>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No records match this filter.
          </div>
        ) : (
          filtered.map(g => <MonthRow key={g.month} group={g} role={role} />)
        )}
      </div>

      {/* SH rolling reward for TSM only — if present */}
      {role === "TSM" && summary.shRollingMonthly && summary.shRollingMonthly > 0 && (
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-2 text-purple-800">
            <Zap size={14} className="text-purple-600" />
            <span className="text-sm font-semibold">SH Rolling Reward (1% per active sub)</span>
            <span className="ml-auto text-lg font-bold">{fmt(summary.shRollingMonthly)}/month</span>
          </div>
          <div className="text-xs text-purple-600 mt-1">
            This is separate from the pool — paid monthly on total active subscription value.
          </div>
        </Card>
      )}
    </div>
  );
}

export default IncentivePayoutLedger;
