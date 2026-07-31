/**
 * LiveLocationDashboard — PagarBook-style field tracker
 * Left: staff ledger | Right: journey timeline + GPS route map
 *
 * Real, shared journey view (buildJourney, RouteMap, TimelineRow,
 * JourneyPanel) now lives in JourneyTimeline.tsx, reused by both this
 * live dashboard and the historical/admin view in FieldAttendanceAdmin.tsx.
 */

import { useState, useEffect, useMemo } from "react";
import {
  MapPin, AlertTriangle,
  RefreshCw, ChevronRight,
  Users, Wifi, WifiOff, Calendar,
  TrendingUp, Navigation, CheckCircle2, XCircle, IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import {
  fieldTrackingService,
  type LiveLocation,
  type FieldSession,
} from "../../services/fieldTrackingService";
import { JourneyPanel, ROLE_COLOR, fmt12, fmtDate, durMins, durStr, staleMin } from "./JourneyTimeline";
import { travelReimbursementService } from "../../services/travelReimbursementService";

// ── Staff ledger row ──────────────────────────────────────────────────────────
function StaffRow({ name, role, status, sub, selected, onClick }: {
  name: string; role: string; status: "live" | "stale" | "done";
  sub: string; selected: boolean; onClick: () => void;
}) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const dotColor = status === "live" ? "bg-green-500 animate-pulse" : status === "stale" ? "bg-amber-400" : "bg-gray-300";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 hover:bg-blue-50 active:bg-blue-100 transition-colors ${
        selected ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
      }`}
    >
      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${ROLE_COLOR[role] ?? "bg-gray-100 text-gray-700"}`}>
        {initials}
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${dotColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-500 truncate">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </button>
  );
}

// ── Reinstatement panel ───────────────────────────────────────────────────────
function ReinstatePanel({ onDone }: { onDone: () => void }) {
  const pending = fieldTrackingService.getAllPendingReinstate();
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <h3 className="font-bold text-gray-900">Reinstatement Requests</h3>
      {pending.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm">No pending requests</p>
        </div>
      ) : pending.map(s => (
        <div key={s.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{s.employeeName}</p>
              <p className="text-xs text-gray-500">{s.role} · Auto-checkout {fmt12(s.checkOutTime!)}</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-xs bg-white rounded-lg border px-3 py-2 italic text-gray-700">
            "{s.reinstateRequest?.reason}"
          </p>
          <div className="flex gap-2">
            <button onClick={() => {
              fieldTrackingService.approveReinstateRequest(s.id, "Super Admin");
              toast.success(`${s.employeeName} reinstated`);
              onDone();
            }} className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white text-xs rounded-lg py-2 hover:bg-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" />Approve
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 border border-red-300 text-red-700 text-xs rounded-lg py-2">
              <XCircle className="w-3.5 h-3.5" />Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
type Panel = { mode: "empty" } | { mode: "journey"; session: FieldSession } | { mode: "live"; loc: LiveLocation } | { mode: "reinstate" };

export function LiveLocationDashboard() {
  const [live, setLive]                   = useState<LiveLocation[]>([]);
  const [date, setDate]                   = useState(new Date().toISOString().slice(0, 10));
  const [history, setHistory]             = useState<FieldSession[]>([]);
  const [tab, setTab]                     = useState<"live" | "history">("live");
  const [panel, setPanel]                 = useState<Panel>({ mode: "empty" });
  const [lastRefresh, setLastRefresh]     = useState(new Date());
  const [refreshTick, setRefreshTick]     = useState(0);

  const pendingCount = fieldTrackingService.getAllPendingReinstate().length;
  const autoToday    = travelReimbursementService.getTrips()
    .filter(t => t.autoSubmittedFromFieldTracking && t.tripDate === new Date().toISOString().slice(0, 10)).length;

  const doRefresh = () => {
    setLive(fieldTrackingService.getLiveLocations());
    setHistory(fieldTrackingService.getSessionsForDate(date));
    setLastRefresh(new Date());
    setRefreshTick(k => k + 1);
  };

  useEffect(() => { doRefresh(); const t = setInterval(doRefresh, 30000); return () => clearInterval(t); }, []);
  useEffect(() => { setHistory(fieldTrackingService.getSessionsForDate(date)); }, [date]);

  // When clicking a live employee, get their active session for the journey panel
  const openLive = (loc: LiveLocation) => {
    const sess = fieldTrackingService.getSessionsForEmployee(loc.employeeId, 1)
      .find(s => s.id === loc.sessionId);
    if (sess) setPanel({ mode: "journey", session: sess });
    else setPanel({ mode: "live", loc });
  };

  const stale = live.filter(l => staleMin(l.lastUpdated) > 5).length;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] bg-white rounded-2xl border shadow-sm overflow-hidden">

      {/* ── LEFT: Staff list ────────────────────────────────────────────────── */}
      <div className={`w-full md:w-80 shrink-0 flex-col border-r bg-gray-50 ${
        panel.mode === "empty" ? "flex" : "hidden md:flex"
      }`}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <Navigation className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-base leading-tight">Field Tracker</h1>
                <p className="text-[11px] text-gray-400 leading-tight">Live GPS · Attendance</p>
              </div>
            </div>
            <button onClick={doRefresh} className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {/* Status chips */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />{live.length} Live
            </span>
            {stale > 0 && <span className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium"><WifiOff className="w-3 h-3" />{stale} Stale</span>}
            {pendingCount > 0 && (
              <button onClick={() => setPanel({ mode: "reinstate" })}
                className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium hover:bg-orange-200">
                <AlertTriangle className="w-3 h-3" />{pendingCount}
              </button>
            )}
            {autoToday > 0 && <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium"><IndianRupee className="w-3 h-3" />{autoToday}</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-white">
          {(["live", "history"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setPanel({ mode: "empty" }); }}
              className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
              }`}>
              {t === "live" ? `Live (${live.length})` : "History"}
            </button>
          ))}
        </div>

        {/* Live list */}
        {tab === "live" && (
          <div className="flex-1 overflow-y-auto">
            {live.length === 0 ? (
              <div className="text-center py-10 px-4 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <p className="text-xs">No one is currently in the field</p>
              </div>
            ) : live.map(loc => (
              <StaffRow key={loc.sessionId}
                name={loc.employeeName} role={loc.role}
                status={staleMin(loc.lastUpdated) > 5 ? "stale" : "live"}
                sub={`${loc.totalDistanceKm} km · ${durStr(durMins(
                  fieldTrackingService.getSessionsForEmployee(loc.employeeId, 1)[0]?.checkInTime
                  ?? new Date().toISOString()
                ))} in field`}
                selected={panel.mode === "journey" && (panel as any).session?.employeeId === loc.employeeId}
                onClick={() => openLive(loc)}
              />
            ))}
          </div>
        )}

        {/* History list */}
        {tab === "history" && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="px-3 py-2.5 border-b bg-white">
              <input type="date" value={date} max={new Date().toISOString().slice(0, 10)}
                onChange={e => setDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" />
            </div>
            {history.length === 0 ? (
              <div className="text-center py-10 px-4 text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <p className="text-xs">No sessions for {fmtDate(date)}</p>
              </div>
            ) : history.map(s => (
              <StaffRow key={s.id}
                name={s.employeeName} role={s.role} status="done"
                sub={`${fmt12(s.checkInTime)} → ${s.checkOutTime ? fmt12(s.checkOutTime) : "Active"} · ${s.totalDistanceKm} km`}
                selected={panel.mode === "journey" && (panel as any).session?.id === s.id}
                onClick={() => setPanel({ mode: "journey", session: s })}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-3 py-2 border-t bg-white text-center text-xs text-gray-400">
          {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · refreshes every 30s
        </div>
      </div>

      {/* ── RIGHT: Detail panel ──────────────────────────────────────────────── */}
      <div className={`flex-1 flex-col min-w-0 bg-white ${
        panel.mode === "empty" ? "hidden md:flex" : "flex"
      }`}>
        {panel.mode !== "empty" && (
          <button onClick={() => setPanel({ mode: "empty" })}
            className="md:hidden flex items-center gap-1.5 px-4 py-3 border-b text-sm font-medium text-blue-600 hover:bg-blue-50 shrink-0">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to list
          </button>
        )}
        {panel.mode === "empty" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-300">
              <MapPin className="w-14 h-14 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-400">Select a staff member to see their journey</p>
              <p className="text-xs text-gray-300 mt-1">Timeline · Route map · Halt locations · Travel claim</p>
            </div>
          </div>
        )}
        {panel.mode === "journey" && <JourneyPanel key={(panel as any).session.id} session={(panel as any).session} />}
        {panel.mode === "reinstate" && <ReinstatePanel onDone={() => { doRefresh(); setPanel({ mode: "empty" }); }} />}
      </div>
    </div>
  );
}

export default LiveLocationDashboard;
