/**
 * SalesHeadApp.tsx
 *
 * Sales Head (TSM) module — 7-screen app per Sales Head Module v1.1.
 *
 * Screens:
 *   1. Command Dashboard    — team snapshot, unassigned leads, gate status
 *   2. Lead Pipeline        — full pipeline with assignment actions
 *   3. TCE Performance      — per-TCE breakdown + coaching
 *   4. My Closures          — personal pipeline + personal incentive
 *   5. Lead Assignment      — unassigned queue with assign actions
 *   6. Incentive Tracker    — coaching bonus + quality + personal
 *   7. Reports              — daily / weekly / monthly KPIs
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  LayoutDashboard, Users, ListChecks, UserCircle,
  ClipboardList, Award, BarChart3,
  AlertTriangle, Clock, Phone, MessageCircle,
  CheckCircle2, Circle, TrendingUp, TrendingDown,
  RefreshCw, ChevronRight, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import {
  salesHeadService,
  type TCEStatus, type SHLead, type SHAlert, type TCEGateColor,
  type SHIncentiveBreakdown,
} from "../../services/salesHeadService";
import { incentiveVisibilityService } from "../../services/incentiveVisibilityService";
import { IncentiveStatement } from "../shared/IncentiveStatement";
import { useRole } from "../../contexts/RoleContext";
import { SalesHeadManagementView } from "./SalesHeadManagementView";
import { FieldCheckIn } from "../field/FieldCheckIn";
import { FieldAttendanceAdmin } from "../field/FieldAttendanceAdmin";


// ── Helpers ───────────────────────────────────────────────────────────────────

function gateChip(color: TCEGateColor, count: number) {
  const cfg = {
    RED:   "bg-red-100 text-red-700 border-red-300",
    AMBER: "bg-amber-100 text-amber-700 border-amber-300",
    GREEN: "bg-green-100 text-green-700 border-green-300",
    GOLD:  "bg-yellow-100 text-yellow-800 border-yellow-400",
  }[color];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${cfg}`}>
      {count}
    </span>
  );
}

function sourceTag(source: SHLead["source"]) {
  const map: Record<SHLead["source"], string> = {
    "Digital-Inbound":        "bg-blue-100 text-blue-700",
    "SM-Alliance-Supervisor": "bg-purple-100 text-purple-700",
    "SM-Alliance-QR":         "bg-indigo-100 text-indigo-700",
    "SM-Alliance-WhatsApp":   "bg-green-100 text-green-700",
    "Referral":               "bg-orange-100 text-orange-700",
    "SM-Direct":              "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[source]}`}>
      {source}
    </span>
  );
}

// ── Command Dashboard ─────────────────────────────────────────────────────────

function CommandDashboard({ onTabChange }: { onTabChange: (t: string) => void }) {
  const metrics = salesHeadService.getCommandMetrics();
  const alerts  = salesHeadService.getAlerts().filter(a => a.actionRequired);

  return (
    <div className="space-y-6">
      {/* Gate status + personal target */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics.tceStatuses.map(tce => (
          <Card key={tce.id} className="p-4">
            <p className="text-xs text-gray-500 mb-1">{tce.name}</p>
            <div className="flex items-center gap-2">
              {gateChip(tce.gateColor, tce.closuresMTD)}
              <span className="text-xs text-gray-400">/ gate 25</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              SLA {tce.slaCompliancePct}% · Mix {tce.planMixPct}%
            </p>
          </Card>
        ))}
        <Card className="p-4 border-2 border-blue-200 bg-blue-50">
          <p className="text-xs text-gray-500 mb-1">My Closures</p>
          <p className="text-2xl font-bold text-blue-700">{metrics.personalClosuresMTD}</p>
          <p className="text-xs text-gray-400">Target: {metrics.personalTarget}</p>
        </Card>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Unassigned Leads", val: metrics.unassignedLeads, danger: metrics.unassignedLeads > 0, icon: <AlertTriangle className="w-4 h-4" /> },
          { label: "Overdue (>30 min)", val: metrics.overdueLeads, danger: metrics.overdueLeads > 0, icon: <Clock className="w-4 h-4" /> },
          { label: "Team SLA %",  val: `${metrics.slaTeamPct}%`,  danger: metrics.slaTeamPct < 90,  icon: <TrendingUp className="w-4 h-4" /> },
          { label: "Plan Mix %",  val: `${metrics.planMixTeamPct}%`, danger: metrics.planMixTeamPct < 60, icon: <BarChart3 className="w-4 h-4" /> },
        ].map(m => (
          <Card key={m.label} className={`p-4 ${m.danger ? "border-red-200 bg-red-50" : ""}`}>
            <div className={`flex items-center gap-1 text-xs mb-1 ${m.danger ? "text-red-600" : "text-gray-500"}`}>
              {m.icon}{m.label}
            </div>
            <p className={`text-2xl font-bold ${m.danger ? "text-red-700" : "text-gray-900"}`}>{m.val}</p>
          </Card>
        ))}
      </div>

      {/* Quick Access — HR & Personal */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "My Leaves",   to: "/hr/professional-leave", color: "bg-blue-50 border-blue-200 text-blue-700",   icon: "📅" },
          { label: "My Payslip",  to: "/hr/self-service",       color: "bg-green-50 border-green-200 text-green-700", icon: "💳" },
          { label: "My Account",  to: "/my-account",            color: "bg-purple-50 border-purple-200 text-purple-700",icon: "👤" },
        ].map(item => (
          <Link key={item.label} to={item.to}
            className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium ${item.color} hover:opacity-80 transition-opacity`}>
            <span>{item.icon}</span>{item.label}
          </Link>
        ))}
      </div>

      {/* Active alerts */}
      {alerts.length > 0 && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            Action Required ({alerts.length})
          </h3>
          {alerts.map(a => (
            <div key={a.id} className={`flex items-start justify-between gap-3 p-3 rounded-lg text-sm ${
              a.severity === "CRITICAL" ? "bg-red-50 border border-red-200" : "bg-orange-50 border border-orange-200"
            }`}>
              <p className="flex-1 text-gray-800">{a.message}</p>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => {
                  salesHeadService.dismissAlert(a.id);
                  toast.success("Alert dismissed");
                }}>
                  Dismiss
                </Button>
                <Button size="sm" onClick={() => onTabChange("leads")} className="gap-1">
                  Act <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── Lead Pipeline ─────────────────────────────────────────────────────────────

function LeadPipeline() {
  const [leads, setLeads] = useState(() => salesHeadService.getLeads());
  const [filter, setFilter] = useState<"ALL" | "Unassigned" | "Overdue">("ALL");

  const filtered = leads.filter(l => {
    if (filter === "Unassigned") return !l.assignedTo;
    if (filter === "Overdue") return l.ageMinutes > 30 && l.status === "Assigned";
    return true;
  });

  const tces = salesHeadService.getCommandMetrics().tceStatuses;

  const handleAssign = (leadId: string, tceId: string) => {
    salesHeadService.assignLead(leadId, tceId);
    setLeads(salesHeadService.getLeads());
    const tce = tces.find(t => t.id === tceId);
    toast.success(`Lead assigned to ${tce?.name ?? tceId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "Unassigned", "Overdue"] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}>
            {f} {f !== "ALL" && `(${leads.filter(l =>
              f === "Unassigned" ? !l.assignedTo :
              l.ageMinutes > 30 && l.status === "Assigned"
            ).length})`}
          </Button>
        ))}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Customer", "Vehicle", "Source", "Status", "Age", "Assigned To", "Value", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(lead => (
              <tr key={lead.id} className={lead.ageMinutes > 30 && !lead.assignedTo ? "bg-red-50" : "hover:bg-gray-50"}>
                <td className="px-4 py-3">
                  <p className="font-medium">{lead.customerName}</p>
                  <p className="text-xs text-gray-500">{lead.phone}</p>
                </td>
                <td className="px-4 py-3">{lead.vehicleCategory} ({lead.vehicleType})</td>
                <td className="px-4 py-3">{sourceTag(lead.source)}</td>
                <td className="px-4 py-3">
                  <Badge className={
                    lead.status === "Closed Won" ? "bg-green-600" :
                    lead.status === "Negotiation" ? "bg-purple-600" :
                    lead.status === "New" ? "bg-blue-600" : "bg-gray-600"
                  }>{lead.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className={lead.ageMinutes > 30 ? "text-red-600 font-medium" : "text-gray-600"}>
                    {lead.ageMinutes}m
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {lead.assignedTo
                    ? (lead.assignedTo === "SELF" ? "Self" : tces.find(t => t.id === lead.assignedTo)?.name ?? lead.assignedTo)
                    : <span className="text-red-600 font-medium">Unassigned</span>}
                </td>
                <td className="px-4 py-3 font-semibold">₹{(lead.estimatedValue ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  {!lead.assignedTo && (
                    <div className="flex gap-1 flex-wrap">
                      {tces.map(tce => (
                        <Button key={tce.id} size="sm" variant="outline"
                          className="text-xs px-2 py-1 h-auto"
                          onClick={() => handleAssign(lead.id, tce.id)}>
                          {(tce.name || tce.id || "TCE").split(" ")[0]}
                        </Button>
                      ))}
                      <Button size="sm" variant="outline"
                        className="text-xs px-2 py-1 h-auto border-blue-400 text-blue-700"
                        onClick={() => handleAssign(lead.id, "SELF")}>
                        Self
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-10 text-gray-400">No leads match this filter</p>
        )}
      </Card>
    </div>
  );
}

// ── TCE Performance ───────────────────────────────────────────────────────────

function TCEPerformance() {
  const metrics = salesHeadService.getCommandMetrics();
  const notes   = salesHeadService.getCoachingNotes();

  const [showNoteForm, setShowNoteForm] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const handleLogNote = (tce: TCEStatus) => {
    if (!noteText.trim()) return;
    salesHeadService.logCoachingNote({
      tceId: tce.id, tceName: tce.name,
      date: new Date().toISOString().slice(0, 10),
      issue: "See note",
      action: noteText,
      nextCheckDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });
    toast.success(`Coaching note logged for ${tce.name}`);
    setShowNoteForm(null);
    setNoteText("");
  };

  return (
    <div className="space-y-6">
      {/* TCE cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.tceStatuses.map(tce => (
          <Card key={tce.id} className={`p-5 border-2 ${
            tce.gateColor === "RED" ? "border-red-300 bg-red-50" :
            tce.gateColor === "GREEN" || tce.gateColor === "GOLD" ? "border-green-300" : ""
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{tce.name}</p>
                <p className="text-xs text-gray-500">{tce.id}</p>
              </div>
              <div className="flex items-center gap-2">
                {tce.status === "ON_CALL"
                  ? <Phone className="w-4 h-4 text-green-600 animate-pulse" />
                  : tce.status === "ACTIVE"
                  ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                  : <Circle className="w-4 h-4 text-gray-400" />}
                {gateChip(tce.gateColor, tce.closuresMTD)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              {[
                { label: "SLA %", val: `${tce.slaCompliancePct}%`, warn: tce.slaCompliancePct < 90 },
                { label: "Plan Mix %", val: `${tce.planMixPct}%`, warn: tce.planMixPct < 60 },
                { label: "30d Churn", val: tce.churnCount30d, warn: tce.churnCount30d > 2 },
                { label: "Forecast", val: `₹${(tce.incentiveForecast ?? 0).toLocaleString()}` },
              ].map(m => (
                <div key={m.label} className={`p-2 rounded ${m.warn ? "bg-red-100" : "bg-gray-50"}`}>
                  <p className="text-gray-500">{m.label}</p>
                  <p className={`font-semibold ${m.warn ? "text-red-700" : "text-gray-900"}`}>{m.val}</p>
                </div>
              ))}
            </div>

            {showNoteForm === tce.id ? (
              <div className="space-y-2">
                <textarea
                  className="w-full border rounded p-2 text-xs resize-none"
                  rows={3}
                  placeholder="Coaching action taken..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleLogNote(tce)}>Save Note</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNoteForm(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="w-full gap-1"
                onClick={() => setShowNoteForm(tce.id)}>
                <MessageCircle className="w-3 h-3" /> Log Coaching Note
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Coaching history */}
      {notes.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Coaching Log</h3>
          <div className="space-y-3">
            {notes.map(n => (
              <div key={n.id} className="border-l-4 border-purple-400 pl-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{n.tceName}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{n.date}</span>
                </div>
                <p className="text-sm text-gray-700">{n.action}</p>
                <p className="text-xs text-gray-400">Next check: {n.nextCheckDate}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Incentive Tracker ─────────────────────────────────────────────────────────

function IncentiveTracker() {
  const data = salesHeadService.getIncentiveBreakdown();

  const bonusRows = [
    { label: "Coaching Bonus", amount: data.coachingBonus,
      note: data.coachingBonusLevel === 0 ? "Gate not cleared (need all TCEs ≥25)" :
            `Level ${data.coachingBonusLevel} — lowest TCE: ${data.lowestTCECount}` },
    { label: "SLA Compliance Bonus (≥90%)", amount: data.slaBonus,
      note: data.slaBonus > 0 ? "Team SLA ≥90% ✅" : "Team SLA below 90% ❌" },
    { label: "Zero-Churn Bonus",     amount: data.zeroChurnBonus,
      note: data.zeroChurnBonus > 0 ? "No churns this month ✅" : "Churn events logged ❌" },
    { label: "Plan Mix Bonus (≥60%)", amount: data.planMixBonus,
      note: data.planMixBonus > 0 ? "Plan mix ≥60% ✅" : "Plan mix below 60% ❌" },
    { label: "Personal Conversion Incentive", amount: data.personalIncentive,
      note: "Based on personal closures × slab × term" },
  ];

  return (
    <div className="space-y-6">
      {/* Total forecast */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <p className="text-sm text-gray-600 mb-1">Total Incentive Forecast This Month</p>
        <p className="text-4xl font-bold text-purple-700">₹{(data.totalForecast ?? 0).toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-1">Recalculated nightly at midnight</p>
      </Card>

      {/* Bonus breakdown */}
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Breakdown</h3>
        <div className="space-y-3">
          {bonusRows.map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{row.label}</p>
                <p className="text-xs text-gray-500">{row.note}</p>
              </div>
              <p className={`font-bold text-lg ${row.amount > 0 ? "text-green-700" : "text-gray-400"}`}>
                {row.amount > 0 ? `₹${(row.amount ?? 0).toLocaleString()}` : "—"}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Installment calendar */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Installment Calendar</h3>
        <div className="space-y-2">
          {data.installmentCalendar.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-gray-500">Due: {item.dueDate}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">₹{item.amount}</p>
                <Badge variant={item.status === "on_track" ? "default" : "secondary"} className="text-xs">
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── My Closures (Personal Pipeline) ──────────────────────────────────────────

function MyClosures() {
  const metrics = salesHeadService.getCommandMetrics();
  const leads   = salesHeadService.getLeads().filter(l => l.assignedTo === "SELF");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 border-2 border-blue-200 bg-blue-50">
          <p className="text-sm text-gray-600">Personal Closures MTD</p>
          <p className="text-4xl font-bold text-blue-700">{metrics.personalClosuresMTD}</p>
          <p className="text-xs text-gray-500">Target: {metrics.personalTarget} · Above gate</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-600">Personal Incentive Forecast</p>
          <p className="text-4xl font-bold text-green-700">
            ₹{salesHeadService.getIncentiveBreakdown().personalIncentive.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Based on slab × term mix</p>
        </Card>
      </div>

      {leads.length > 0 ? (
        <Card className="p-5">
          <h3 className="font-semibold mb-3">My Active Leads</h3>
          <div className="space-y-2">
            {leads.map(l => (
              <div key={l.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                <div>
                  <p className="font-medium">{l.customerName}</p>
                  <p className="text-xs text-gray-500">{l.phone} · {l.vehicleCategory}</p>
                </div>
                <div className="text-right">
                  <Badge>{l.status}</Badge>
                  <p className="text-xs text-gray-500 mt-1">₹{(l.estimatedValue ?? 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-10 text-center text-gray-400">
          <p>No leads in personal pipeline yet.</p>
          <p className="text-sm mt-1">Assign a lead to yourself from the Lead Pipeline tab.</p>
        </Card>
      )}
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────

function Reports() {
  const m = salesHeadService.getCommandMetrics();
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Today's Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: "Team SLA %",    val: `${m.slaTeamPct}%`, ok: m.slaTeamPct >= 90 },
            { label: "Plan Mix %",    val: `${m.planMixTeamPct}%`, ok: m.planMixTeamPct >= 60 },
            { label: "Team Churn",    val: m.churnTeamCount,  ok: m.churnTeamCount === 0 },
            { label: "My Closures",   val: m.personalClosuresMTD, ok: m.personalClosuresMTD >= 10 },
          ].map(s => (
            <div key={s.label} className={`p-4 rounded-lg border ${s.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.ok ? "text-green-700" : "text-red-700"}`}>{s.val}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">TCE Gate Status — Month to Date</h3>
        <div className="space-y-2">
          {m.tceStatuses.map(tce => (
            <div key={tce.id} className="flex items-center gap-3 p-3 border rounded-lg">
              {gateChip(tce.gateColor, tce.closuresMTD)}
              <div className="flex-1">
                <p className="text-sm font-medium">{tce.name}</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                  <div
                    className={`h-1.5 rounded-full ${
                      tce.gateColor === "RED" ? "bg-red-500" :
                      tce.gateColor === "AMBER" ? "bg-amber-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(100, (tce.closuresMTD / 100) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">{tce.closuresMTD}/100</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => toast.info("EOD report sent to Sales Head")} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Send EOD Report
        </Button>
        <Button variant="outline" onClick={() => toast.info("Export coming soon")}>
          Export Month Report
        </Button>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export function SalesHeadApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { currentUser } = useRole();
  const metrics = salesHeadService.getCommandMetrics();

  // Super Admin can toggle this per role or per employee via /admin/incentive-visibility
  const showIncentiveTab = incentiveVisibilityService.isVisible(
    "Sales Head",
    currentUser?.employeeId
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sales Head App</h1>
          <p className="text-xs text-gray-500">Team coaching · Lead management · Personal closures</p>
        </div>
        <div className="flex items-center gap-2">
          {metrics.alertCount > 0 && (
            <Badge className="bg-red-600 animate-pulse">{metrics.alertCount} alerts</Badge>
          )}
          <Badge variant="outline">Super Admin</Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-9 min-w-max w-full mb-6 overflow-x-auto">
            <TabsTrigger value="dashboard" className="text-xs gap-1">
              <LayoutDashboard className="w-3 h-3 hidden sm:block" />Dashboard
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="text-xs gap-1">
              <ListChecks className="w-3 h-3 hidden sm:block" />Pipeline
            </TabsTrigger>
            <TabsTrigger value="tce" className="text-xs gap-1">
              <Users className="w-3 h-3 hidden sm:block" />TCE View
            </TabsTrigger>
            <TabsTrigger value="personal" className="text-xs gap-1">
              <UserCircle className="w-3 h-3 hidden sm:block" />My Closures
            </TabsTrigger>
            <TabsTrigger value="assign" className="text-xs gap-1">
              <ClipboardList className="w-3 h-3 hidden sm:block" />Assign
            </TabsTrigger>
            {showIncentiveTab && (
              <TabsTrigger value="incentive" className="text-xs gap-1">
                <Award className="w-3 h-3 hidden sm:block" />Incentives
              </TabsTrigger>
            )}
            <TabsTrigger value="reports" className="text-xs gap-1">
              <BarChart3 className="w-3 h-3 hidden sm:block" />Reports
            </TabsTrigger>
            <TabsTrigger value="field" className="text-xs gap-1 border-l-2 border-green-300">
              <MapPin className="w-3 h-3 hidden sm:block" />Field Day
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs gap-1 border-l-2 border-purple-300">
              <Users className="w-3 h-3 hidden sm:block" />Team View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <CommandDashboard onTabChange={setActiveTab} />
          </TabsContent>
          <TabsContent value="pipeline">
            <LeadPipeline />
          </TabsContent>
          <TabsContent value="tce">
            <TCEPerformance />
          </TabsContent>
          <TabsContent value="personal">
            <MyClosures />
          </TabsContent>
          <TabsContent value="assign">
            <LeadPipeline />
          </TabsContent>
          {showIncentiveTab && (
            <TabsContent value="incentive">
              <IncentiveStatement role="Sales Head" />
            </TabsContent>
          )}
          <TabsContent value="reports">
            <Reports />
          </TabsContent>
          <TabsContent value="field">
            <FieldCheckIn />
          </TabsContent>
          <TabsContent value="team">
            <div className="space-y-6">
              <SalesHeadManagementView />
              <div className="border-t pt-6">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />Field Attendance — Team Sessions
                </h2>
                <FieldAttendanceAdmin />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
