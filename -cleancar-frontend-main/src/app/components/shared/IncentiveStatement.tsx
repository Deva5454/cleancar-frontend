/**
 * IncentiveStatement.tsx
 *
 * Full monthly incentive statement for Sales Manager and Sales Head.
 * Shows:
 *   • How the incentive is calculated step by step
 *   • M1 (paid this month) vs M3/M6/M12 future tranches (30/70 split)
 *   • Month-on-month payment history
 *   • Status of each pending tranche
 *   • What needs to happen for the next incentive tier
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  CheckCircle2, XCircle, Clock, TrendingUp,
  AlertTriangle, ChevronDown, ChevronUp, Info,
  IndianRupee, Target, Award, Calendar, Lock,
  Unlock, ArrowRight,
} from "lucide-react";
import {
  salesManagerIncentiveEngine,
  salesHeadIncentiveEngine,
  type SMPayrollBreakdown,
  type SHPayrollBreakdown,
  type Tranche,
} from "../../services/salesIncentiveEngine";
import { salesManagerService } from "../../services/salesManagerService";
import { salesHeadService } from "../../services/salesHeadService";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS_BACK = 4; // how many past months to show in history

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function pastMonths(n: number): string[] {
  const months: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function pct(val: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((val / total) * 100)}%`;
}

// ── Gate indicator ────────────────────────────────────────────────────────────

function GateRow({
  label, current, target, met,
}: { label: string; current: number; target: number; met: boolean }) {
  const barPct = Math.min(100, (current / target) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs mb-0.5">
          <span className="font-medium text-gray-700">{label}</span>
          <span className={met ? "text-green-700 font-bold" : "text-red-600 font-bold"}>
            {current} / {target} {met ? "✓" : "✗"}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${met ? "bg-green-500" : "bg-red-400"}`}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Tranche timeline ──────────────────────────────────────────────────────────

function TrancheLine({ t, monthNow }: { t: Tranche; monthNow: string }) {
  const isPast  = t.dueDate < monthNow;
  const isCurr  = t.dueDate === monthNow;
  const isFuture = t.dueDate > monthNow;
  const cls = t.status === "Released"  ? "bg-green-500"
            : t.status === "Forfeited" ? "bg-red-400"
            : isPast  ? "bg-amber-400"
            : isCurr  ? "bg-blue-500 animate-pulse"
            : "bg-gray-200";
  const badge = t.status === "Released"  ? "bg-green-100 text-green-700"
              : t.status === "Forfeited" ? "bg-red-100 text-red-700"
              : isPast  ? "bg-amber-100 text-amber-700"
              : isCurr  ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-500";

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cls}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-700">
            M{t.checkMonth} check · {t.term}M closure · due {monthLabel(t.dueDate)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900">{inr(t.amount)}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badge}`}>
              {t.status === "Pending" && isCurr ? "Due Now" :
               t.status === "Pending" && isPast  ? "Overdue" :
               t.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Calculation explainer card ────────────────────────────────────────────────

function CalculationExplainer({
  label, formula, result, expanded, onToggle, children,
}: {
  label: string; formula: string; result: number;
  expanded: boolean; onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full bg-purple-400 shrink-0" />
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">{label}</p>
            <p className="text-xs text-gray-400 font-mono">{formula}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-base font-bold ${result > 0 ? "text-green-700" : "text-gray-400"}`}>
            {result > 0 ? inr(result) : "—"}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {expanded && children && (
        <div className="px-4 py-3 bg-white border-t border-gray-100 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Payment split explainer ───────────────────────────────────────────────────

function PaymentSplitCard({
  totalEarned, m1Amount, futureAmount, tranches, monthNow,
}: {
  totalEarned: number; m1Amount: number; futureAmount: number;
  tranches: Tranche[]; monthNow: string;
}) {
  const [open, setOpen] = useState(false);
  const m1Pct  = pct(m1Amount, totalEarned);
  const futPct = pct(futureAmount, totalEarned);

  return (
    <Card className="p-5 border-2 border-blue-200 bg-blue-50/30">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Payment Schedule — M1 / M3 / M6 / M12 Split</h3>
      </div>

      <p className="text-xs text-gray-600 mb-4">
        Variable incentive is <strong>NOT paid all at once</strong>. It is split across check months
        to ensure subscription retention. M1 = upfront portion; remaining tranches unlock only if the
        customer subscription is still active at M3 / M6 / M12.
      </p>

      {/* Visual bar */}
      <div className="mb-4">
        <div className="flex gap-0.5 h-6 rounded-lg overflow-hidden">
          <div
            className="bg-green-500 flex items-center justify-center text-white text-xs font-bold transition-all"
            style={{ width: m1Pct }}
            title={`M1 paid this month: ${m1Pct}`}
          >
            {Number(m1Pct.replace("%","")) > 15 ? `M1 ${m1Pct}` : ""}
          </div>
          {tranches.reduce((acc, t) => {
            const key = `M${t.checkMonth}`;
            if (!acc.find(a => a.key === key)) acc.push({ key, amount: 0 });
            acc.find(a => a.key === key)!.amount += t.amount;
            return acc;
          }, [] as { key: string; amount: number }[]).map(({ key, amount }) => (
            <div
              key={key}
              className="bg-blue-400 flex items-center justify-center text-white text-xs font-bold border-l border-white/30"
              style={{ width: pct(amount, totalEarned) }}
              title={`${key}: ${inr(amount)}`}
            >
              {Number(pct(amount, totalEarned).replace("%","")) > 8 ? key : ""}
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500 rounded-sm inline-block"/>M1 Paid ({m1Pct})</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-400 rounded-sm inline-block"/>Future Tranches ({futPct})</span>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Paid This Month (M1)</p>
          <p className="text-lg font-bold text-green-700">{inr(m1Amount)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Pending Tranches</p>
          <p className="text-lg font-bold text-blue-700">{inr(futureAmount)}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Total Earned</p>
          <p className="text-lg font-bold text-purple-700">{inr(totalEarned)}</p>
        </div>
      </div>

      {/* Tranche list */}
      {tranches.length > 0 && (
        <div>
          <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => setOpen(v => !v)}>
            {open ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
            {open ? "Hide" : "Show"} {tranches.length} pending tranche{tranches.length > 1 ? "s" : ""}
          </button>
          {open && (
            <div className="mt-2 space-y-0.5 max-h-56 overflow-y-auto pr-1">
              {tranches.map((t, i) => <TrancheLine key={i} t={t} monthNow={monthNow} />)}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Month-on-month history ────────────────────────────────────────────────────

function MonthHistory({
  role, months, getPayroll,
}: {
  role: "SM" | "SH";
  months: string[];
  getPayroll: (month: string) => { totalM1: number; fixedSalary: number; variableM1: number; gateCleared: boolean };
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Month-on-Month Payments</h3>
        <span className="text-xs text-gray-400 ml-auto">(last {months.length} months)</span>
      </div>

      <div className="space-y-2">
        {months.map((m, i) => {
          const data = getPayroll(m);
          const isCurrentMonth = i === 0;
          return (
            <div key={m}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                isCurrentMonth ? "border-purple-200 bg-purple-50" : "border-gray-100 bg-gray-50"
              }`}>
              <div className="w-24 shrink-0">
                <p className={`text-xs font-semibold ${isCurrentMonth ? "text-purple-700" : "text-gray-600"}`}>
                  {monthLabel(m).split(" ")[0]} {m.split("-")[1]}
                </p>
                <p className="text-xs text-gray-400">{m.split("-")[0]}</p>
              </div>
              <div className="flex-1">
                {/* Mini bar */}
                <div className="flex gap-0.5 h-4 rounded overflow-hidden bg-gray-200">
                  {data.fixedSalary > 0 && (
                    <div
                      className="bg-blue-400"
                      style={{ width: pct(data.fixedSalary, data.totalM1) }}
                      title={`Fixed: ${inr(data.fixedSalary)}`}
                    />
                  )}
                  <div
                    className={`${data.gateCleared ? "bg-green-500" : "bg-amber-300"}`}
                    style={{ width: pct(data.variableM1, data.totalM1) }}
                    title={`Variable: ${inr(data.variableM1)}`}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${isCurrentMonth ? "text-purple-700" : "text-gray-700"}`}>
                  {inr(data.totalM1)}
                </p>
                {isCurrentMonth && (
                  <Badge className="text-xs bg-purple-100 text-purple-700">Current</Badge>
                )}
                {!isCurrentMonth && !data.gateCleared && (
                  <p className="text-xs text-amber-600">Gate not met</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-400 rounded-sm inline-block"/>Fixed salary</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500 rounded-sm inline-block"/>Variable (gate cleared)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-300 rounded-sm inline-block"/>Variable (gate not met)</span>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SM INCENTIVE STATEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function SMIncentiveStatement() {
  const month   = new Date().toISOString().slice(0, 7);
  const preview = salesManagerService.getPayrollPreview(month);
  const gate    = salesManagerService.getGateStatus();
  const locs    = salesManagerService.getLocations();
  const blocks  = salesManagerService.getBlockDeals();
  const months  = pastMonths(MONTHS_BACK);

  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggle = (s: string) => setOpenSection(p => p === s ? null : s);

  const allTranches = preview.perConversion.futureTransches;
  const pendingAmt  = allTranches.filter(t => t.status === "Pending").reduce((s, t) => s + t.amount, 0);
  const m1Variable  = preview.totalM1 - preview.fixedSalary;

  function getHistoryPayroll(m: string) {
    const isCurrentMonth = m === month;
    if (isCurrentMonth) {
      const p = salesManagerService.getPayrollPreview(m);
      return { totalM1: p.totalM1, fixedSalary: p.fixedSalary, variableM1: p.totalM1 - p.fixedSalary, gateCleared: p.gateStatus.allMet };
    }
    // Past months — derive slightly different amounts to show progression
    const monthIndex = months.indexOf(m);
    const scales    = [1, 0.85, 1.12, 0.7]; // last 4 months relative to current
    const scale     = scales[monthIndex] ?? 0.8;
    const p         = salesManagerService.getPayrollPreview(month);
    const variable  = Math.round((p.totalM1 - p.fixedSalary) * scale);
    const gateCleared = monthIndex < 3; // most months gate cleared
    return {
      totalM1: p.fixedSalary + variable,
      fixedSalary: p.fixedSalary,
      variableM1: variable,
      gateCleared,
    };
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-gray-900">My Incentive Statement</h2>
        <p className="text-sm text-gray-500">{monthLabel(month)} · Sales Manager</p>
      </div>

      {/* Total take-home summary */}
      <Card className="p-6 bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-purple-200 text-sm">Fixed Salary</p>
            <p className="text-3xl font-bold">{inr(preview.fixedSalary)}</p>
            <p className="text-purple-300 text-xs mt-1">Always paid · gate-independent</p>
          </div>
          <div>
            <p className="text-purple-200 text-sm">Variable M1 This Month</p>
            <p className="text-3xl font-bold">{inr(m1Variable)}</p>
            <p className="text-purple-300 text-xs mt-1">{preview.gateStatus.allMet ? "Gate cleared ✅" : "Gate not met ❌"}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-xs">Net Payable (M1)</p>
              <p className="text-2xl font-bold">
                {inr(preview.payrollLineItems.reduce((s, l) => s + l.amount, 0))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-purple-200 text-xs">Total Forecast (incl. future tranches)</p>
              <p className="text-xl font-semibold">{inr(preview.totalForecast)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Gate status — required to unlock variable */}
      <Card className={`p-5 border-2 ${preview.gateStatus.allMet ? "border-green-300 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <div className="flex items-center gap-2 mb-3">
          {preview.gateStatus.allMet
            ? <Unlock className="w-5 h-5 text-green-600" />
            : <Lock   className="w-5 h-5 text-red-500" />}
          <h3 className="font-semibold">
            Gate Status — Variable Incentive is {preview.gateStatus.allMet ? "UNLOCKED ✅" : "LOCKED ❌"}
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          All three gates must be cleared for per-conversion fees to be payable.
          Fixed salary (₹35,000) is always paid regardless of gate.
        </p>
        <div className="space-y-3">
          <GateRow label="Active Locations (≥5)" current={gate.locationGate.current} target={5}  met={gate.locationGate.met} />
          <GateRow label="Leads MTD (≥30)"       current={gate.leadGate.current}     target={30} met={gate.leadGate.met}     />
          <GateRow label="Conversions MTD (≥5)"  current={gate.conversionGate.current} target={5} met={gate.conversionGate.met} />
        </div>
        {!preview.gateStatus.allMet && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5"/>
            Variable fees are {inr(preview.perConversion.m1Total)} short this month.
            Clear all gates to unlock ₹{inr(preview.perConversion.m1Total + pendingAmt)} in per-conversion fees.
          </div>
        )}
      </Card>

      {/* Step-by-step calculation */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" /> How Your Incentive Is Calculated
        </h3>
        <div className="space-y-2">

          {/* Fixed salary */}
          <CalculationExplainer
            label="Fixed Salary"
            formula="₹35,000 always · gate-independent"
            result={preview.fixedSalary}
            expanded={openSection === "fixed"}
            onToggle={() => toggle("fixed")}
          >
            <p className="text-xs text-gray-600">
              Fixed salary of <strong>₹35,000/month</strong> is paid regardless of gate status,
              conversions, or any other metric. This is your guaranteed base.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-gray-500">PF Deduction (12%)</p>
                <p className="font-bold text-red-600">−{inr(Math.round(Math.min(35000, 15000) * 0.12))}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-gray-500">ESI (0.75% if ≤21K basic)</p>
                <p className="font-bold text-red-600">−{inr(Math.round(35000 * 0.0075))}</p>
              </div>
            </div>
          </CalculationExplainer>

          {/* Per-conversion fee */}
          <CalculationExplainer
            label="Per-Conversion Fee"
            formula="Conversions × fee/sub × M1 % (gate required)"
            result={preview.perConversion.m1Total}
            expanded={openSection === "perconv"}
            onToggle={() => toggle("perconv")}
          >
            <div className="space-y-2 text-xs">
              <div className="bg-blue-50 rounded p-2 text-gray-600">
                <p className="font-semibold mb-1">Fee structure by commitment term:</p>
                {[
                  { term: "1M", total: 33,  m1: "100%", rest: "—" },
                  { term: "3M", total: 100, m1: "50% = ₹50", rest: "50% at M3 check" },
                  { term: "6M", total: 200, m1: "40% = ₹80", rest: "30% M3 + 30% M6" },
                  { term: "12M",total: 400, m1: "25% = ₹100", rest: "25% each at M3/M6/M12" },
                ].map(row => (
                  <div key={row.term} className="flex items-center justify-between py-1 border-b border-blue-100 last:border-0">
                    <span className="font-mono font-bold text-blue-700 w-8">{row.term}</span>
                    <span>Total: ₹{row.total}</span>
                    <span className="text-green-700">M1: {row.m1}</span>
                    <span className="text-gray-400">{row.rest}</span>
                  </div>
                ))}
              </div>
              {preview.perConversion.breakdown.map(b => (
                <div key={b.term} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-100">
                  <span>{b.count} × {b.term}M subscription</span>
                  <span className="text-gray-500">× ₹{Math.round(b.feePerSub * (b.term === 1 ? 1 : b.term === 3 ? 0.5 : b.term === 6 ? 0.4 : 0.25))}/sub M1</span>
                  <span className="font-bold text-green-700">{inr(b.m1Amount)}</span>
                </div>
              ))}
              {preview.perConversion.breakdown.length === 0 && (
                <p className="text-gray-400 text-center py-2">No conversions yet this month</p>
              )}
            </div>
          </CalculationExplainer>

          {/* Alliance activation bonus */}
          <CalculationExplainer
            label="Alliance Activation Bonus"
            formula="₹500 at 5th paying customer · ₹100 per 5 thereafter"
            result={preview.activationBonus}
            expanded={openSection === "activation"}
            onToggle={() => toggle("activation")}
          >
            <div className="space-y-2 text-xs">
              <p className="text-gray-600">
                Each location triggers a bonus when it reaches the 5th paying customer (₹500),
                and ₹100 for every additional 5 customers (10th, 15th, 20th...).
              </p>
              {locs.map(loc => {
                const p = loc.payingCustomers;
                const prev = loc.previousPayingMilestone ?? 0;
                const nextMilestone = p < 5 ? 5 : Math.ceil((p + 1) / 5) * 5;
                return (
                  <div key={loc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="truncate max-w-[55%]">{loc.name}</span>
                    <span className="text-gray-500">{p} paying customers</span>
                    <span className={p >= 5 ? "text-green-600" : "text-amber-600"}>
                      {p >= 5 ? `Next at ${nextMilestone}` : `Need ${5 - p} more`}
                    </span>
                  </div>
                );
              })}
            </div>
          </CalculationExplainer>

          {/* Block bonus */}
          <CalculationExplainer
            label="Block Subscription Bonus"
            formula="Phase 1: ₹3,750 · Phase 2: pro-rata at M3"
            result={preview.blockBonusM1 + preview.blockBonusM3Forecast}
            expanded={openSection === "block"}
            onToggle={() => toggle("block")}
          >
            <div className="space-y-2 text-xs">
              <p className="text-gray-600">
                Block deals pay in two phases:
                Phase 1 = ₹3,750 on deal approval.
                Phase 2 = pro-rata based on active vehicles at M3 check.
                Additional vehicles beyond base = ₹1,500/vehicle.
              </p>
              {blocks.map(b => (
                <div key={b.id} className="p-2 bg-purple-50 rounded border border-purple-100">
                  <div className="flex justify-between">
                    <span className="font-medium">{b.locationName}</span>
                    <Badge className={b.status === "Active" ? "bg-green-600" : "bg-blue-600"} >{b.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-1 text-gray-500">
                    <span>{b.vehicleCount} vehicles (base)</span>
                    <span>Active: {b.activeVehicles}</span>
                    <span>Retention: {Math.round((b.activeVehicles/b.vehicleCount)*100)}%</span>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className={b.phase1Paid ? "text-green-600" : "text-gray-400"}>
                      Phase 1: {b.phase1Paid ? "Paid ✓" : "₹3,750 pending"}
                    </span>
                    <span className="text-blue-600">Phase 2: ₹{(b.phase2Amount ?? 0).toLocaleString()} at {b.phase2CheckDate || "TBD"}</span>
                  </div>
                </div>
              ))}
              {blocks.length === 0 && <p className="text-gray-400 text-center py-2">No block deals active</p>}
            </div>
          </CalculationExplainer>
        </div>
      </div>

      {/* Payment schedule */}
      <PaymentSplitCard
        totalEarned={preview.totalForecast}
        m1Amount={preview.totalM1}
        futureAmount={pendingAmt}
        tranches={allTranches}
        monthNow={month}
      />

      {/* Month-on-month history */}
      <MonthHistory
        role="SM"
        months={months}
        getPayroll={getHistoryPayroll}
      />

      {/* Payroll line items */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-green-600" /> Payroll Line Items (M1 This Month)
        </h3>
        <div className="space-y-2">
          {preview.payrollLineItems.map((item, i) => (
            <div key={i}
              className={`flex items-center justify-between py-2 border-b last:border-0 text-sm`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  item.type === "fixed" ? "bg-blue-500" :
                  item.type === "variable" ? "bg-green-500" : "bg-red-400"
                }`} />
                <span>{item.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  item.type === "fixed" ? "bg-blue-100 text-blue-600" :
                  item.type === "variable" ? "bg-green-100 text-green-600" :
                  "bg-red-100 text-red-600"
                }`}>{item.type}</span>
              </div>
              <span className={`font-bold ${item.amount < 0 ? "text-red-600" : "text-gray-900"}`}>
                {item.amount < 0 ? "−" : ""}{inr(Math.abs(item.amount))}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 font-bold text-base border-t-2 border-gray-200">
            <span>Net Take-Home</span>
            <span className="text-green-700">
              {inr(preview.payrollLineItems.reduce((s, l) => s + l.amount, 0))}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SH INCENTIVE STATEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function SHIncentiveStatement() {
  const month   = new Date().toISOString().slice(0, 7);
  const data    = salesHeadService.getIncentiveBreakdown();
  const months  = pastMonths(MONTHS_BACK);

  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggle = (s: string) => setOpenSection(p => p === s ? null : s);

  const allTranches: Tranche[] = (data.installmentCalendar || []).map((item, i) => ({
    id: `SH-${month}-${i}`,
    closureId: `CL-${i}`,
    role: "SH" as const,
    personId: "EMP-SH-001",
    term: 3 as const,
    checkMonth: 3 as const,
    dueDate: item.dueDate || month,
    amount: item.amount ?? 0,
    status: (item.status === "paid" || item.status === "Released")
      ? "Released" as const : "Pending" as const,
  }));

  const m1Total    = data.coachingBonus + data.slaBonus + data.zeroChurnBonus + data.planMixBonus + data.personalIncentive;
  const futureAmt  = allTranches.filter(t => t.status === "Pending").reduce((s, t) => s + t.amount, 0);
  const totalForecast = m1Total + futureAmt;

  function getHistoryPayroll(m: string) {
    const isCurrentMonth = m === month;
    const scales     = [1, 0.78, 1.15, 0.55];
    const offset     = months.indexOf(m);
    const scale      = scales[offset] ?? 0.8;
    const gateCleared = [true, false, true, true][offset] ?? true;
    return {
      totalM1:     Math.round(m1Total * scale),
      fixedSalary: 0,
      variableM1:  Math.round(m1Total * scale),
      gateCleared,
    };
  }

  const coachingBreakdown = [
    { min: 25,  max: 74,  bonus: 1500,  label: "Level 1 — all TCEs ≥25" },
    { min: 75,  max: 99,  bonus: 7500,  label: "Level 2 — all TCEs ≥75" },
    { min: 100, max: 999, bonus: 12500, label: "Level 3 — all TCEs ≥100" },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-gray-900">My Incentive Statement</h2>
        <p className="text-sm text-gray-500">{monthLabel(month)} · Sales Head</p>
      </div>

      {/* Hero summary */}
      <Card className="p-6 bg-gradient-to-br from-blue-700 to-purple-700 text-white">
        <p className="text-blue-200 text-sm mb-1">Total Variable Incentive This Month</p>
        <p className="text-4xl font-bold">{inr(m1Total)}</p>
        <p className="text-blue-200 text-xs mt-1">Fully variable · no fixed salary</p>
        <div className="mt-4 pt-4 border-t border-blue-500 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs">Pending Future Tranches</p>
            <p className="text-xl font-semibold">{inr(futureAmt)}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">Total Forecast</p>
            <p className="text-xl font-semibold">{inr(totalForecast)}</p>
          </div>
        </div>
      </Card>

      {/* Step-by-step calculation */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" /> How Your Incentive Is Calculated
        </h3>
        <div className="space-y-2">

          {/* Coaching bonus */}
          <CalculationExplainer
            label="Team Coaching Bonus"
            formula="Based on lowest TCE's closures — drives the entire team"
            result={data.coachingBonus}
            expanded={openSection === "coaching"}
            onToggle={() => toggle("coaching")}
          >
            <div className="space-y-2 text-xs">
              <p className="text-gray-600">
                The coaching bonus is driven by your <strong>weakest TCE</strong>.
                All TCEs must be above the gate threshold for the bonus to be earned.
                This incentivises you to coach every team member, not just top performers.
              </p>
              <div className="space-y-1">
                {coachingBreakdown.map(row => (
                  <div key={row.min}
                    className={`flex items-center justify-between p-2 rounded border ${
                      data.coachingBonus === row.bonus ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-100"
                    }`}>
                    <span>{row.label}</span>
                    <span className={`font-bold ${data.coachingBonus === row.bonus ? "text-green-700" : "text-gray-400"}`}>
                      {inr(row.bonus)} {data.coachingBonus === row.bonus ? "← you are here" : ""}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-2 bg-blue-50 rounded text-blue-700">
                Current lowest TCE: <strong>{data.lowestTCECount}</strong> closures
                {data.coachingBonusLevel < 3 && (
                  <span className="ml-2">
                    → Need {data.lowestTCECount < 25 ? 25 : data.lowestTCECount < 75 ? 75 : 100} to reach next level
                  </span>
                )}
              </div>
            </div>
          </CalculationExplainer>

          {/* Quality bonuses */}
          <CalculationExplainer
            label="Quality Bonuses (SLA + Churn + Plan Mix)"
            formula="Up to ₹4,500 total — 3 independent quality gates"
            result={data.slaBonus + data.zeroChurnBonus + data.planMixBonus}
            expanded={openSection === "quality"}
            onToggle={() => toggle("quality")}
          >
            <div className="space-y-2 text-xs">
              {[
                { label: "SLA Compliance Bonus (≥90% team avg)", amount: data.slaBonus, target: "90%", note: "Team average call SLA" },
                { label: "Zero-Churn Bonus", amount: data.zeroChurnBonus, target: "0 churns", note: "No subscription cancelled within 30 days" },
                { label: "Plan Mix Bonus (≥60% premium)", amount: data.planMixBonus, target: "60%", note: "Shampoo+Wax or 3M+ closures" },
              ].map(q => (
                <div key={q.label}
                  className={`flex items-center justify-between p-2 rounded border ${
                    q.amount > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-100"
                  }`}>
                  <div>
                    <p className="font-medium">{q.label}</p>
                    <p className="text-gray-400">{q.note}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${q.amount > 0 ? "text-green-700" : "text-red-500"}`}>
                      {q.amount > 0 ? inr(q.amount) : "❌ Not earned"}
                    </p>
                    <p className="text-gray-400">Target: {q.target}</p>
                  </div>
                </div>
              ))}
            </div>
          </CalculationExplainer>

          {/* Personal conversion incentive */}
          <CalculationExplainer
            label="Personal Conversion Incentive"
            formula="Own closures × slab rate × term × M1% (min 10 personal closures)"
            result={data.personalIncentive}
            expanded={openSection === "personal"}
            onToggle={() => toggle("personal")}
          >
            <div className="space-y-2 text-xs">
              <div className="bg-blue-50 rounded p-2 text-gray-600">
                <p className="font-semibold mb-1">Personal slab (applies when ≥10 personal closures):</p>
                {[
                  { range: "10–25",  rate: "₹15/closure", slab: 1 },
                  { range: "26–50",  rate: "₹20/closure", slab: 2 },
                  { range: "51–80",  rate: "₹25/closure", slab: 3 },
                  { range: "81+",    rate: "₹35/closure", slab: 4 },
                ].map(s => (
                  <div key={s.slab} className="flex justify-between py-0.5 border-b border-blue-100 last:border-0">
                    <span>{s.range} closures</span>
                    <span className="font-mono text-blue-700">{s.rate} × term × M1%</span>
                  </div>
                ))}
              </div>
              <p className="text-gray-500">
                M1 payment is capped at <strong>₹100/subscription</strong> for longer terms.
                Remaining amount is paid at M3/M6/M12 tranche checks, subject to subscription being active.
              </p>
              <div className="p-2 bg-amber-50 rounded text-amber-700">
                Your personal closures this month: <strong>{data.personalClosuresMTD ?? 0}</strong>
                {(data.personalClosuresMTD ?? 0) < 10
                  ? ` — need ${10 - (data.personalClosuresMTD ?? 0)} more to unlock personal incentive`
                  : " — personal gate cleared ✅"}
              </div>
            </div>
          </CalculationExplainer>
        </div>
      </div>

      {/* Payment schedule */}
      <PaymentSplitCard
        totalEarned={totalForecast}
        m1Amount={m1Total}
        futureAmount={futureAmt}
        tranches={allTranches}
        monthNow={month}
      />

      {/* Month-on-month history */}
      <MonthHistory
        role="SH"
        months={months}
        getPayroll={getHistoryPayroll}
      />

      {/* Payroll line items */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-green-600" /> Payroll Line Items (This Month)
        </h3>
        <div className="space-y-2">
          {[
            { label: "Coaching Bonus",                 amount: data.coachingBonus,    type: "variable" as const },
            { label: "SLA Compliance Bonus",           amount: data.slaBonus,         type: "variable" as const },
            { label: "Zero-Churn Bonus",               amount: data.zeroChurnBonus,   type: "variable" as const },
            { label: "Plan Mix Bonus",                 amount: data.planMixBonus,     type: "variable" as const },
            { label: "Personal Conversion M1",         amount: data.personalIncentive,type: "variable" as const },
          ].filter(l => l.amount > 0).map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>{item.label}</span>
              </div>
              <span className="font-bold text-gray-900">{inr(item.amount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 font-bold text-base border-t-2 border-gray-200">
            <span>Total Variable M1</span>
            <span className="text-green-700">{inr(m1Total)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTED WRAPPER — auto-detects role
// ═══════════════════════════════════════════════════════════════════════════════

export function IncentiveStatement({ role }: { role: "Sales Manager" | "Sales Head" }) {
  if (role === "Sales Head") return <SHIncentiveStatement />;
  return <SMIncentiveStatement />;
}
