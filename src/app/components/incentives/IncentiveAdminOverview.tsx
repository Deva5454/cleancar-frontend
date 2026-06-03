/**
 * IncentiveAdminOverview.tsx
 *
 * Finance/Operations view — all subscription incentive records,
 * pending payouts, and exit calculations across all roles.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  CheckCircle2, Clock, XCircle, Search, IndianRupee, TrendingUp,
  AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  incentiveV6,
  incentiveStructureService,
  type SubscriptionIncentiveRecord,
  type ExitPayoutSummary,
} from "../../services/incentiveStructureV6";

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  );
}

function RecordRow({ rec }: { rec: SubscriptionIncentiveRecord }) {
  const [open, setOpen] = useState(false);
  const paid      = rec.tranches.filter(t => t.status === "PAID").reduce((s, t) => s + t.poolAmount, 0);
  const pending   = rec.tranches.filter(t => t.status === "PENDING").reduce((s, t) => s + t.poolAmount, 0);
  const forfeited = rec.tranches.filter(t => t.status === "FORFEITED").reduce((s, t) => s + t.poolAmount, 0);

  return (
    <div className={`border rounded-xl mb-2 bg-white overflow-hidden
      ${rec.status === "CANCELLED" ? "border-red-200" : "border-gray-200"}`}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0 text-left">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900">{rec.customerName}</span>
              <Badge variant="outline" className="text-xs">{rec.planType}</Badge>
              <Badge variant="outline" className="text-xs">{rec.vehicleCategory.split("/")[0].trim()}</Badge>
              <Badge variant="outline" className="text-xs">{rec.term}M · {rec.source}</Badge>
              {rec.status === "CANCELLED" && (
                <Badge className="text-xs bg-red-100 text-red-700 border-0">Cancelled</Badge>
              )}
              {rec.isZeroPool && (
                <Badge className="text-xs bg-gray-100 text-gray-600 border-0">Zero Pool</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {rec.subscriptionId} · Activation {fmtDate(rec.activationDate)} · Pool {fmt(rec.poolTotal)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <div className="hidden md:flex gap-1.5">
            {paid > 0 && <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{fmt(paid)}</span>}
            {pending > 0 && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{fmt(pending)}</span>}
            {forfeited > 0 && <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">{fmt(forfeited)}</span>}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          {/* Tranche table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="text-left py-1 font-medium">Tranche</th>
                <th className="text-right py-1 font-medium">Due date</th>
                <th className="text-right py-1 font-medium">Pool amt</th>
                <th className="text-right py-1 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rec.tranches.map(t => (
                <tr key={t.id} className="border-b border-gray-50">
                  <td className="py-1.5 font-semibold text-gray-800">{t.checkMonth}</td>
                  <td className="py-1.5 text-right text-gray-600">{fmtDate(t.dueDate)}</td>
                  <td className="py-1.5 text-right font-medium">{fmt(t.poolAmount)}</td>
                  <td className="py-1.5 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                      ${t.status === "PAID" ? "bg-green-100 text-green-700" :
                        t.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Role payouts for M1 tranche */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Role payouts (all tranches):</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-2 py-1.5 font-medium text-gray-600 border border-gray-200">Role</th>
                    <th className="text-left px-2 py-1.5 font-medium text-gray-600 border border-gray-200">Employee</th>
                    <th className="text-right px-2 py-1.5 font-medium text-gray-600 border border-gray-200">Paid</th>
                    <th className="text-right px-2 py-1.5 font-medium text-gray-600 border border-gray-200">Pending</th>
                    <th className="text-right px-2 py-1.5 font-medium text-gray-600 border border-gray-200">Forfeited</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Aggregate across all tranches per role
                    const roleMap: Record<string, { role: string; name: string; paid: number; pending: number; forfeited: number }> = {};
                    rec.tranches.forEach(t => {
                      t.rolePayouts.forEach(rp => {
                        if (!roleMap[rp.employeeId]) {
                          roleMap[rp.employeeId] = { role: rp.role, name: rp.employeeName, paid: 0, pending: 0, forfeited: 0 };
                        }
                        if (rp.status === "PAID")      roleMap[rp.employeeId].paid      += rp.amount;
                        if (rp.status === "PENDING")   roleMap[rp.employeeId].pending   += rp.amount;
                        if (rp.status === "FORFEITED") roleMap[rp.employeeId].forfeited += rp.amount;
                      });
                    });
                    return Object.values(roleMap).map((r, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-2 py-1.5 border border-gray-200 font-semibold">{r.role}</td>
                        <td className="px-2 py-1.5 border border-gray-200 text-gray-600">{r.name}</td>
                        <td className="px-2 py-1.5 border border-gray-200 text-right text-green-700">{fmt(r.paid)}</td>
                        <td className="px-2 py-1.5 border border-gray-200 text-right text-amber-700">{fmt(r.pending)}</td>
                        <td className="px-2 py-1.5 border border-gray-200 text-right text-red-600">{fmt(r.forfeited)}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function IncentiveAdminOverview() {
  const [records, setRecords]   = useState<SubscriptionIncentiveRecord[]>([]);
  const [search,  setSearch]    = useState("");
  const [filter,  setFilter]    = useState<"ALL" | "ACTIVE" | "CANCELLED" | "PENDING_PAYOUT">("ALL");

  useEffect(() => {
    incentiveV6.autoProcessDueTranches(
      new Date().toISOString().split("T")[0]
    );
    setRecords(incentiveV6.getAll());
  }, []);

  const stats = incentiveV6.getStats();

  const filtered = records.filter(r => {
    if (filter === "ACTIVE"    && r.status !== "ACTIVE")    return false;
    if (filter === "CANCELLED" && r.status !== "CANCELLED") return false;
    if (filter === "PENDING_PAYOUT") {
      return r.tranches.some(t => t.status === "PENDING");
    }
    if (search) {
      const q = search.toLowerCase();
      return r.customerName.toLowerCase().includes(q) ||
        r.subscriptionId.toLowerCase().includes(q) ||
        r.planType.toLowerCase().includes(q);
    }
    return true;
  }).filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.customerName.toLowerCase().includes(q) ||
      r.subscriptionId.toLowerCase().includes(q) ||
      r.planType.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      {/* Title */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Incentive Ledger</h1>
        <p className="text-sm text-gray-500 mt-0.5">Incentive Structure v6 · 30/70 Rule · All roles · All subscriptions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Pool Value"  value={fmt(stats.totalPoolValue)}   sub={`${stats.totalRecords} subs`}      color="bg-slate-50 border-slate-200 text-slate-800" />
        <StatCard label="Paid to Date"      value={fmt(stats.paidToDate)}        sub="disbursed"                          color="bg-green-50 border-green-200 text-green-800" />
        <StatCard label="Pending Payouts"   value={fmt(stats.pendingPayouts)}     sub="future tranches"                    color="bg-amber-50 border-amber-200 text-amber-800" />
        <StatCard label="Forfeited"         value={fmt(stats.forfeitedAmount)}    sub={`${stats.cancelled} cancelled`}    color="bg-red-50   border-red-200   text-red-800"   />
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search customer / sub ID / plan…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {(["ALL","ACTIVE","CANCELLED","PENDING_PAYOUT"] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
              ${filter === f ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-600 border-gray-200 hover:border-slate-400"}`}
          >{f.replace("_"," ")}</button>
        ))}
      </div>

      {/* Records */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No records match. Subscriptions with assigned roles will appear here on activation.
        </div>
      ) : (
        filtered.map(rec => <RecordRow key={rec.id} rec={rec} />)
      )}

      <p className="text-center text-xs text-gray-400 mt-6">
        {records.length} total records · {stats.active} active · {stats.cancelled} cancelled
      </p>
    </div>
  );
}
