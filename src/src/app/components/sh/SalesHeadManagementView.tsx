/**
 * SalesHeadManagementView.tsx
 *
 * 8th tab inside SalesHeadApp — "Team View"
 *
 * Management Visibility Layer per Sales Head Module v1.1 Section 12:
 *   ┌─ TSM Pipeline summary (Kiran's team)
 *   │    └─ TSM's TCEs — individual performance + health
 *   ├─ SM Summaries (all SMs reporting to this SH)
 *   │    └─ Locations, gate status, incentive forecast
 *   ├─ All TCEs table (SH-direct + TSM-managed)
 *   ├─ Tranche Liability Calendar (all pending M3/M6/M12 across team)
 *   └─ Incentive Cost Forecast (SH + TSM + SMs + TCEs)
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Users, TrendingUp, MapPin, AlertTriangle, CheckCircle2,
  XCircle, Clock, ChevronDown, ChevronRight, BarChart3,
  DollarSign, Calendar, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { salesHeadService, type ReporteesSummary } from "../../services/salesHeadService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function healthBadge(h: "GREEN" | "AMBER" | "RED") {
  const cfg = { GREEN: "bg-green-100 text-green-800", AMBER: "bg-amber-100 text-amber-800", RED: "bg-red-100 text-red-800" }[h];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg}`}>{h}</span>;
}

function pct(n: number, total: number) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

// ── TSM Summary Card ──────────────────────────────────────────────────────────

function TSMCard({ tsm }: { tsm: ReporteesSummary["tsmSummary"] }) {
  const [expanded, setExpanded] = useState(false);
  const revPct = pct(tsm.revenueMTD, tsm.revenueTarget);

  return (
    <Card className="p-5 border-2 border-blue-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{tsm.name}</p>
              <p className="text-xs text-gray-500">Tele Sales Manager · {tsm.tseCount} TCEs</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600">TSM</Badge>
          <span className="text-sm font-bold text-green-700">₹{(tsm.incentiveForecast / 1000).toFixed(0)}K forecast</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        {[
          { label: "New Leads",    val: tsm.leadsNew },
          { label: "Conversions", val: tsm.leadsConverted },
          { label: "Conv. Rate",  val: `${tsm.conversionRatePct}%`, warn: tsm.conversionRatePct < 35 },
          { label: "Revenue MTD", val: `₹${(tsm.revenueMTD / 100000).toFixed(1)}L`,
            warn: revPct < 85 },
        ].map(m => (
          <div key={m.label} className={`p-2 rounded text-center ${m.warn ? "bg-red-50" : "bg-gray-50"}`}>
            <p className="text-xs text-gray-500">{m.label}</p>
            <p className={`font-bold text-sm ${m.warn ? "text-red-700" : "text-gray-900"}`}>{m.val}</p>
          </div>
        ))}
      </div>

      {/* Revenue progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Revenue vs Target</span><span>{revPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${revPct >= 90 ? "bg-green-500" : revPct >= 70 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${Math.min(100, revPct)}%` }}
          />
        </div>
      </div>

      {/* SLA Breaches */}
      {tsm.slaBreaches > 0 && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 rounded px-2 py-1 mb-3">
          <AlertTriangle className="w-3 h-3" /> {tsm.slaBreaches} SLA breaches today
        </div>
      )}

      {/* TCE Drill-down toggle */}
      <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setExpanded(e => !e)}>
        {expanded ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
        {expanded ? "Hide" : "View"} TCE performance ({tsm.tseCount} TCEs)
      </Button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t pt-3">
          {tsm.tsePerformance.map(tse => (
            <div key={tse.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                {healthBadge(tse.health)}
                <span className="font-medium">{tse.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span><strong>{tse.closuresMTD}</strong> closes</span>
                <span>SLA {tse.slaCompliancePct}%</span>
                <span>Mix {tse.planMixPct}%</span>
                <span className="font-semibold text-green-700">₹{(tse.incentiveForecast ?? 0).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── SM Summary Cards ───────────────────────────────────────────────────────────

function SMCards({ sms }: { sms: ReporteesSummary["smSummaries"] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sms.map(sm => (
        <Card key={sm.id} className="p-5 border-2 border-purple-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <p className="font-semibold">{sm.name}</p>
                <p className="text-xs text-gray-500">Sales Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={sm.gateCleared ? "bg-green-600" : "bg-red-500"}>
                Gate {sm.gateCleared ? "✅" : "❌"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "Locations", val: sm.activeLocations, warn: sm.activeLocations < 5 },
              { label: "Leads MTD", val: sm.leadsMTD, warn: sm.leadsMTD < 30 },
              { label: "Conversions", val: sm.conversionsMTD, warn: sm.conversionsMTD < 5 },
            ].map(m => (
              <div key={m.label} className={`p-2 rounded text-center text-xs ${m.warn ? "bg-red-50" : "bg-gray-50"}`}>
                <p className="text-gray-500">{m.label}</p>
                <p className={`font-bold ${m.warn ? "text-red-700" : "text-gray-900"}`}>{m.val}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {sm.atRiskLocations > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                {sm.atRiskLocations} At Risk
              </span>
            )}
            {sm.inactiveLocations > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                {sm.inactiveLocations} Inactive
              </span>
            )}
            {sm.pendingApprovals > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                {sm.pendingApprovals} Pending Approval
              </span>
            )}
            {sm.blockDealsActive > 0 && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                {sm.blockDealsActive} Block Deal Active
              </span>
            )}
          </div>

          <div className="mt-2 pt-2 border-t flex justify-between text-xs">
            <span className="text-gray-500">Incentive Forecast</span>
            <span className="font-bold text-green-700">₹{(sm.incentiveForecast ?? 0).toLocaleString()}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── All TCEs Table ─────────────────────────────────────────────────────────────

function AllTCEsTable({ tces }: { tces: ReporteesSummary["allTCEs"] }) {
  return (
    <Card className="overflow-x-auto p-0">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          All TCEs — Full Team View
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          SH-Direct = your 3 TCEs · TSM = Kiran's team
        </p>
      </div>
      <table className="w-full min-w-[750px] text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {["Health", "Name", "Team", "Closures", "SLA %", "Plan Mix %", "Churn 30d", "Forecast"].map(h => (
              <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tces.sort((a, b) => b.closuresMTD - a.closuresMTD).map(tce => (
            <tr key={tce.id} className={`hover:bg-gray-50 ${tce.health === "RED" ? "bg-red-50" : ""}`}>
              <td className="px-4 py-2">{healthBadge(tce.health)}</td>
              <td className="px-4 py-2 font-medium">{tce.name}</td>
              <td className="px-4 py-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  tce.teamOwner === "SH-Direct" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                }`}>{tce.teamOwner}</span>
              </td>
              <td className="px-4 py-2 font-semibold">{tce.closuresMTD}</td>
              <td className="px-4 py-2">
                <span className={tce.slaCompliancePct < 90 ? "text-red-600 font-medium" : "text-gray-700"}>
                  {tce.slaCompliancePct}%
                </span>
              </td>
              <td className="px-4 py-2">
                <span className={tce.planMixPct < 60 ? "text-amber-600" : "text-gray-700"}>
                  {tce.planMixPct}%
                </span>
              </td>
              <td className="px-4 py-2">
                <span className={tce.churnCount30d > 2 ? "text-red-600 font-medium" : "text-gray-700"}>
                  {tce.churnCount30d}
                </span>
              </td>
              <td className="px-4 py-2 font-semibold text-green-700">
                ₹{(tce.incentiveForecast ?? 0).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ── Tranche Liability Calendar ─────────────────────────────────────────────────

function TrancheLiability({ items }: { items: ReporteesSummary["trancheLiability"] }) {
  const total = items.filter(t => t.status !== "forfeited").reduce((s, t) => s + t.amount, 0);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-600" />
          Installment Tranche Liability
        </h3>
        <span className="text-sm font-bold text-purple-700">
          Total: ₹{total.toLocaleString()} pending
        </span>
      </div>
      <div className="space-y-2">
        {items.map(t => (
          <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg text-sm border ${
            t.status === "at_risk" ? "bg-red-50 border-red-200" :
            t.status === "forfeited" ? "bg-gray-50 border-gray-200 opacity-60" :
            "bg-green-50 border-green-200"
          }`}>
            <div>
              <p className="font-medium text-gray-900">{t.ownerName}</p>
              <p className="text-xs text-gray-500">{t.label} · Due {t.dueDate}</p>
            </div>
            <div className="text-right flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                t.status === "at_risk" ? "bg-red-100 text-red-700" :
                t.status === "forfeited" ? "bg-gray-200 text-gray-600" :
                "bg-green-100 text-green-700"
              }`}>
                {t.subscriptionActive ? "Active ✓" : "Churned ⚠"}
              </span>
              <p className="font-bold text-gray-900">₹{(t.amount ?? 0).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Incentive Cost Summary ─────────────────────────────────────────────────────

function IncentiveCostSummary({ summary }: { summary: ReporteesSummary }) {
  const rows = [
    { label: "Sales Head (You)",      amount: summary.shPersonalForecast ?? 0, color: "text-blue-700",   bg: "bg-blue-50"   },
    { label: "TSM — Kiran Desai",     amount: summary.tsmForecast ?? 0,        color: "text-indigo-700", bg: "bg-indigo-50" },
    { label: "Sales Managers (×2)",   amount: summary.smsTotalForecast ?? 0,   color: "text-purple-700", bg: "bg-purple-50" },
    { label: "All TCEs (6 total)",    amount: summary.tcesForecast ?? 0,       color: "text-teal-700",   bg: "bg-teal-50"   },
  ];

  return (
    <Card className="p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-600" />
        Team Incentive Cost Forecast — This Month
      </h3>
      <div className="space-y-2 mb-4">
        {rows.map(r => (
          <div key={r.label} className={`flex items-center justify-between p-3 rounded-lg ${r.bg}`}>
            <p className="text-sm font-medium text-gray-900">{r.label}</p>
            <p className={`font-bold ${r.color}`}>₹{(r.amount ?? 0).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl text-white">
        <p className="font-semibold">Total Team Incentive Liability</p>
        <p className="text-2xl font-bold text-green-400">
          ₹{(summary.totalTeamIncentiveForecast ?? 0).toLocaleString()}
        </p>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        This is the projected payroll incentive cost for all reportees this month.
        Recalculated nightly. Does not include fixed salaries.
      </p>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function SalesHeadManagementView() {
  const [activeSection, setActiveSection] = useState<
    "overview" | "tsm" | "sms" | "tces" | "tranches" | "cost"
  >("overview");

  const summary = salesHeadService.getReporteesSummary();

  const sections = [
    { id: "overview", label: "Overview",        icon: <Activity className="w-3 h-3" /> },
    { id: "tsm",      label: "TSM + TCEs",       icon: <Users className="w-3 h-3" /> },
    { id: "sms",      label: "Sales Managers",   icon: <MapPin className="w-3 h-3" /> },
    { id: "tces",     label: "All TCEs",         icon: <BarChart3 className="w-3 h-3" /> },
    { id: "tranches", label: "Tranche Calendar", icon: <Calendar className="w-3 h-3" /> },
    { id: "cost",     label: "Incentive Cost",   icon: <DollarSign className="w-3 h-3" /> },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Sub-nav */}
      <div className="flex gap-2 flex-wrap">
        {sections.map(s => (
          <Button
            key={s.id}
            size="sm"
            variant={activeSection === s.id ? "default" : "outline"}
            className="gap-1.5 text-xs"
            onClick={() => setActiveSection(s.id)}
          >
            {s.icon}{s.label}
          </Button>
        ))}
      </div>

      {/* Overview */}
      {activeSection === "overview" && (
        <div className="space-y-4">
          {/* Summary stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total TCEs",      val: summary.allTCEs.length,
                sub: `${summary.allTCEs.filter(t => t.health === "GREEN").length} healthy` },
              { label: "SM Locations",    val: summary.smSummaries.reduce((s,m)=>s+m.activeLocations,0),
                sub: `${summary.smSummaries.reduce((s,m)=>s+m.atRiskLocations,0)} at risk` },
              { label: "Team Incentive",  val: `₹${(summary.totalTeamIncentiveForecast/1000).toFixed(0)}K`,
                sub: "total forecast" },
              { label: "At-Risk Tranches", val: summary.trancheLiability.filter(t=>t.status==="at_risk").length,
                sub: "churned subs" },
            ].map(m => (
              <Card key={m.label} className="p-4 text-center">
                <p className="text-xs text-gray-500">{m.label}</p>
                <p className="text-2xl font-bold text-gray-900 my-1">{m.val}</p>
                <p className="text-xs text-gray-400">{m.sub}</p>
              </Card>
            ))}
          </div>
          {/* Quick alerts */}
          {summary.smSummaries.some(sm => !sm.gateCleared) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {summary.smSummaries.filter(sm => !sm.gateCleared).map(sm => sm.name).join(", ")} — gate not cleared. Per-conversion fee not payable.
            </div>
          )}
          {summary.allTCEs.filter(t=>t.health==="RED").length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {summary.allTCEs.filter(t=>t.health==="RED").map(t=>t.name).join(", ")} — RED health. Coaching intervention required.
            </div>
          )}
          <TSMCard tsm={summary.tsmSummary} />
        </div>
      )}

      {activeSection === "tsm"      && <TSMCard tsm={summary.tsmSummary} />}
      {activeSection === "sms"      && <SMCards sms={summary.smSummaries} />}
      {activeSection === "tces"     && <AllTCEsTable tces={summary.allTCEs} />}
      {activeSection === "tranches" && <TrancheLiability items={summary.trancheLiability} />}
      {activeSection === "cost"     && <IncentiveCostSummary summary={summary} />}
    </div>
  );
}
