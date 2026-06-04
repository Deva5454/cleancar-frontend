import { SubscriptionIncentiveTracker } from "../incentives/SubscriptionIncentiveTracker"
import { incentiveV6 } from "../../services/incentiveStructureV6";
/**
 * IncentiveTrackerScreen.tsx
 * Supervisor Incentive Tracker — v3.0
 *
 * Shows the full incentive breakdown:
 *  - KPI score + gate status (does KPI ≥70 unlock BTL earnings?)
 *  - Churn multiplier on BTL lead bonus
 *  - Per-component earned amounts
 *  - Alerts for low KPI, churn, audit gaps
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Lock, Unlock, ChevronDown, ChevronUp } from "lucide-react";
import type { IncentiveDashboard } from "../../services/supervisorIncentiveService";

export interface IncentiveTrackerScreenProps {
  dashboard: IncentiveDashboard;
}

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function KPIBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-bold text-gray-800">{score}/{max}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function IncentiveTrackerScreenLegacy({ dashboard }: IncentiveTrackerScreenProps) {
  const [showLeads, setShowLeads]  = useState(false);
  const [showConv,  setShowConv]   = useState(false);

  const {
    kpiScore, churnMultiplier, opsKPIBonus, leadBonus,
    conversionBonus, milestones, attendance, totals, alerts, monthYear,
  } = dashboard;

  const gateUnlocked = kpiScore.btlUnlocked;
  const churnColor = {
    green: "text-green-700 bg-green-50 border-green-200",
    gray:  "text-gray-700 bg-gray-50 border-gray-200",
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    red:   "text-red-700 bg-red-50 border-red-200",
  }[churnMultiplier.color];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="bg-emerald-700 text-white p-4">
        <h1 className="text-xl font-bold">Incentive Tracker</h1>
        <p className="text-sm text-emerald-200">{monthYear}</p>

        {/* Total take-home */}
        <div className="mt-3 bg-white/10 rounded-xl p-4 text-center">
          <p className="text-xs text-emerald-200">Estimated Total Take-Home</p>
          <p className="text-4xl font-bold">{fmt(totals.totalTakeHome)}</p>
          <p className="text-xs text-emerald-200 mt-1">
            Fixed {fmt(totals.fixedNet)} + Variable {fmt(totals.totalVariable)}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* ── ALERTS ─────────────────────────────────────────────────────── */}
        {alerts.map((a, i) => (
          <div key={i} className={`rounded-xl border p-3 flex gap-2 items-start ${
            a.severity === "CRITICAL"
              ? "bg-red-50 border-red-300 text-red-800"
              : "bg-amber-50 border-amber-300 text-amber-800"
          }`}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm">{a.message}</p>
          </div>
        ))}

        {/* ── KPI SCORE + GATE ────────────────────────────────────────────── */}
        <Card className={`border-2 ${gateUnlocked ? "border-green-400" : "border-red-400"}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">KPI Score — Operations Gate</CardTitle>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                gateUnlocked ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {gateUnlocked
                  ? <><Unlock className="w-3.5 h-3.5" /> BTL Unlocked</>
                  : <><Lock className="w-3.5 h-3.5" /> BTL Locked</>}
              </div>
            </div>
            <p className="text-xs text-gray-500">Score must be ≥70 to earn BTL Lead & Conversion Bonus</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-5xl font-bold ${gateUnlocked ? "text-green-700" : "text-red-600"}`}>
                {kpiScore.total}
              </div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded-full relative">
                  <div className={`h-3 rounded-full ${gateUnlocked ? "bg-green-500" : "bg-red-400"}`}
                    style={{ width: `${kpiScore.total}%` }} />
                  {/* 70 gate marker */}
                  <div className="absolute top-0 h-3 w-0.5 bg-gray-900" style={{ left: "70%" }} />
                  <span className="absolute -bottom-4 text-xs text-gray-500 font-medium" style={{ left: "68%" }}>70</span>
                </div>
              </div>
              <span className="text-sm text-gray-500">/100</span>
            </div>
            <div className="mt-6 space-y-0">
              <KPIBar label={`Washer Retention (target ≥80%)`} score={kpiScore.washerRetention}   max={30} color="bg-blue-500" />
              <KPIBar label={`Audit Compliance (target ≥4/day)`} score={kpiScore.auditCompliance} max={20} color="bg-purple-500" />
              <KPIBar label={`Complaint SLA (<24h resolution)`}  score={kpiScore.complaintSLA}    max={10} color="bg-orange-500" />
              <KPIBar label={`BTL Conversion Rate (target ≥30%)`}score={kpiScore.btlConversionRate} max={40} color="bg-teal-500" />
            </div>
          </CardContent>
        </Card>

        {/* ── OPS KPI BONUS ───────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">A — KPI Operations Bonus</p>
                <p className="text-xs text-gray-500">{opsKPIBonus.band.replace("_", " ")} — KPI {opsKPIBonus.kpiScore}/100</p>
              </div>
              <p className="text-xl font-bold text-emerald-700">{fmt(opsKPIBonus.bonus)}</p>
            </div>
            <div className="mt-2 text-xs text-gray-400 grid grid-cols-5 gap-1">
              {[{r:"90–100",b:3000},{r:"80–89",b:2200},{r:"70–79",b:1400},{r:"60–69",b:700},{r:"<60",b:0}].map(band => (
                <div key={band.r} className={`text-center p-1 rounded ${opsKPIBonus.kpiScore >= parseInt(band.r) ? "bg-emerald-50 text-emerald-700 font-bold" : ""}`}>
                  <p>{band.r}</p><p className="font-semibold">₹{band.b}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── CHURN MULTIPLIER ─────────────────────────────────────────────── */}
        <div className={`rounded-xl border-2 p-3 ${churnColor}`}>
          <p className="font-semibold text-sm">B — Churn Multiplier on BTL Lead Bonus</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs">{churnMultiplier.label}</p>
            <span className="text-2xl font-bold">{churnMultiplier.multiplier}×</span>
          </div>
          <p className="text-xs mt-1 opacity-75">Churn rate: {churnMultiplier.churnRate}%</p>
        </div>

        {/* ── BTL LEAD BONUS ───────────────────────────────────────────────── */}
        <Card className={!gateUnlocked ? "opacity-60" : ""}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">C — BTL Lead Bonus</p>
                  {!gateUnlocked && <Lock className="w-3.5 h-3.5 text-red-500" />}
                </div>
                <p className="text-xs text-gray-500">{leadBonus.qualifiedLeads} qualified of {leadBonus.totalLeads} total leads</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-700">{fmt(leadBonus.finalLeadBonus)}</p>
                {leadBonus.churnMultiplier !== 1 && (
                  <p className="text-xs text-gray-400">Raw: {fmt(leadBonus.rawLeadBonus)} × {leadBonus.churnMultiplier}</p>
                )}
              </div>
            </div>
            {!gateUnlocked && (
              <p className="text-xs text-red-600 font-medium bg-red-50 rounded p-2">
                🔒 Withheld — KPI score must reach 70 to unlock this bonus
              </p>
            )}
            <button className="text-xs text-blue-600 mt-2" onClick={() => setShowLeads(!showLeads)}>
              {showLeads ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />}
              {" "}Lead slab breakdown
            </button>
            {showLeads && (
              <div className="mt-2 text-xs space-y-1">
                {[
                  { label:"1–100 @ ₹5", count: leadBonus.slab1Leads, rate: 5 },
                  { label:"101–200 @ ₹7", count: leadBonus.slab2Leads, rate: 7 },
                  { label:"201–400 @ ₹8", count: leadBonus.slab3Leads, rate: 8 },
                  { label:"401+ @ ₹10", count: leadBonus.slab4Leads, rate: 10 },
                ].filter(s => s.count > 0).map(s => (
                  <div key={s.label} className="flex justify-between text-gray-600">
                    <span>{s.label} — {s.count} leads</span>
                    <span className="font-medium">₹{(s.count * s.rate).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── CONVERSION BONUS ─────────────────────────────────────────────── */}
        <Card className={!gateUnlocked ? "opacity-60" : ""}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">D — Conversion Bonus</p>
                  {!gateUnlocked && <Lock className="w-3.5 h-3.5 text-red-500" />}
                </div>
                <p className="text-xs text-gray-500">8% of plan · 60-day hold · min ₹15 max ₹250</p>
              </div>
              <p className="text-xl font-bold text-emerald-700">{fmt(conversionBonus.totalEligible)}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
              <div className="bg-green-50 rounded p-1.5">
                <p className="text-green-700 font-bold">{fmt(conversionBonus.totalEligible)}</p>
                <p className="text-green-600">Paid</p>
              </div>
              <div className="bg-blue-50 rounded p-1.5">
                <p className="text-blue-700 font-bold">{fmt(conversionBonus.totalPending)}</p>
                <p className="text-blue-600">In hold</p>
              </div>
              <div className="bg-gray-50 rounded p-1.5">
                <p className="text-gray-700 font-bold">{fmt(conversionBonus.totalForfeited)}</p>
                <p className="text-gray-500">Forfeited</p>
              </div>
            </div>
            {!gateUnlocked && (
              <p className="text-xs text-red-600 font-medium bg-red-50 rounded p-2">
                🔒 Withheld — KPI must be ≥70 in the month the lead was submitted
              </p>
            )}
            <button className="text-xs text-blue-600 mt-1" onClick={() => setShowConv(!showConv)}>
              {showConv ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />}
              {" "}View all conversions
            </button>
            {showConv && (
              <div className="mt-2 space-y-1.5">
                {conversionBonus.conversions.map(c => (
                  <div key={c.leadId} className="flex justify-between items-center text-xs border rounded p-1.5">
                    <div>
                      <p className="font-medium text-gray-800">{c.customerName}</p>
                      <p className="text-gray-400">{c.planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{fmt(c.cappedBonus)}</p>
                      <Badge className={`text-xs ${
                        c.status === "PAID"         ? "bg-green-100 text-green-700" :
                        c.status === "HOLD_ACTIVE"  ? "bg-blue-100 text-blue-700" :
                        c.status === "GATE_BLOCKED" ? "bg-red-100 text-red-700" :
                        c.status === "FORFEITED"    ? "bg-gray-100 text-gray-500" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>{c.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── MILESTONES ───────────────────────────────────────────────────── */}
        {milestones.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="font-semibold text-gray-800 mb-2">E — Location Milestones</p>
              {milestones.map((m, i) => (
                <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0">
                  <div>
                    <p className="font-medium">{m.locationName}</p>
                    <p className="text-xs text-gray-500">{m.milestone} milestone</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-700">{fmt(m.payout)}</p>
                    <p className="text-xs text-gray-400">{m.paid ? "Paid" : "Pending"}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── ATTENDANCE ───────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-gray-800">F — Attendance & Punctuality</p>
              <p className="text-xl font-bold text-emerald-700">{fmt(attendance.total)}</p>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5">
                  {attendance.ownAttendance
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  Own attendance (zero unexcused)
                </span>
                <span className="font-medium">{fmt(attendance.attendancePayout)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5">
                  {attendance.btlPunctuality
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  BTL sessions on time (within 15 min)
                </span>
                <span className="font-medium">{fmt(attendance.punctualityPayout)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SUMMARY FOOTER ───────────────────────────────────────────────── */}
        <Card className="border-2 border-emerald-300">
          <CardContent className="p-4 space-y-1.5">
            <p className="font-bold text-gray-800 text-sm mb-2">Monthly Earnings Summary</p>
            {[
              { label: "Fixed Net Salary", amount: totals.fixedNet, fixed: true },
              { label: "A — KPI Operations Bonus", amount: totals.opsKPI },
              { label: `C — BTL Lead Bonus ${!gateUnlocked ? "(LOCKED)" : `× ${churnMultiplier.multiplier}`}`, amount: totals.btlLeads, locked: !gateUnlocked },
              { label: `D — Conversion Bonus ${!gateUnlocked ? "(LOCKED)" : "(60d hold)"}`, amount: totals.btlConversions, locked: !gateUnlocked },
              { label: "E — Location Milestones", amount: totals.milestones },
              { label: "F — Attendance & Punctuality", amount: totals.attendance },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between text-sm ${row.locked ? "opacity-50" : ""}`}>
                <span className={`${row.fixed ? "font-semibold" : "text-gray-600"}`}>{row.label}</span>
                <span className={`font-semibold ${row.fixed ? "text-gray-800" : "text-emerald-700"}`}>
                  {fmt(row.amount)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total Take-Home</span>
              <span className="text-emerald-700 text-lg">{fmt(totals.totalTakeHome)}</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export function IncentiveTrackerScreen({ supervisorId, name }: { supervisorId?: string; name?: string }) {
  const id = supervisorId || "EDB-SUP-SUR1";
  return (
    <SubscriptionIncentiveTracker
      employeeId={id}
      role="SUPERVISOR"
      employeeName={name || id}
    />
  );
}
