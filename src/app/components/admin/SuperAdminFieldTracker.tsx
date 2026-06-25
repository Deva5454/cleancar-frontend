/**
 * SuperAdminFieldTracker.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Super Admin screen: Live tracking + timeline for all 5 field roles.
 * Map: OpenStreetMap via Leaflet (zero cost, no API key).
 * Timeline: left panel exactly matching reference design.
 *
 * Roles tracked: Car Washer, Operations Manager, Supervisor, Sales Manager, Sales Head
 * Data source: field_sessions_v1 (localStorage) via fieldTrackingService
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { fieldTrackingService, ROLE_COLORS, type LiveLocation, type FieldSession } from "../../services/fieldTrackingService";
import { detectHalts, enrichHalts, type DayTimeline, type Halt, type Drive } from "../../services/haltDetectionService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { MapPin, Navigation, Clock, Footprints, RefreshCw, Play, Pause, Users, AlertTriangle, ChevronDown, ChevronRight, Camera } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtDist(km: number) { return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(2)}km`; }
function minsAgo(iso: string) { return Math.round((Date.now() - new Date(iso).getTime()) / 60000); }
function today() { return new Date().toISOString().slice(0, 10); }

// ── SVG Trail Map (OpenStreetMap-style placeholder until Leaflet loads) ────────

function SVGTrail({ sessions, selected }: { sessions: FieldSession[]; selected: string | null }) {
  const allPts = sessions.flatMap(s => s.trail || []);
  if (allPts.length < 2) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
      <MapPin className="w-8 h-8 mb-2 opacity-30" />
      <p className="text-sm">No trail data for this date</p>
      <p className="text-xs mt-1">Employees check in to start tracking</p>
    </div>
  );

  const lats = allPts.map(p => p.lat), lngs = allPts.map(p => p.lng);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const PAD = 40, W = 900, H = 500;
  const tx = (lng: number) => PAD + ((lng - minLng) / (maxLng - minLng || 0.001)) * (W - 2 * PAD);
  const ty = (lat: number) => H - PAD - ((lat - minLat) / (maxLat - minLat || 0.001)) * (H - 2 * PAD);

  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#0ea5e9"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full bg-slate-50 rounded-lg">
      {/* Grid lines */}
      {[0.2, 0.4, 0.6, 0.8].map(r => (
        <g key={r}>
          <line x1={PAD} y1={H * r} x2={W - PAD} y2={H * r} stroke="#e2e8f0" strokeWidth="1" />
          <line x1={W * r} y1={PAD} x2={W * r} y2={H - PAD} stroke="#e2e8f0" strokeWidth="1" />
        </g>
      ))}
      {/* OSM attribution */}
      <text x={W - 10} y={H - 6} fontSize="9" textAnchor="end" fill="#94a3b8">© OpenStreetMap contributors</text>

      {sessions.map((s, idx) => {
        const trail = s.trail || [];
        if (trail.length < 2) return null;
        const col = ROLE_COLORS[s.role]?.pin || colors[idx % colors.length];
        const isSelected = selected === s.employeeId;
        const d = trail.map((p, i) => `${i === 0 ? "M" : "L"}${tx(p.lng).toFixed(1)},${ty(p.lat).toFixed(1)}`).join(" ");
        const last = trail[trail.length - 1];
        return (
          <g key={s.id} opacity={selected && !isSelected ? 0.3 : 1}>
            <path d={d} fill="none" stroke={col} strokeWidth={isSelected ? 3 : 2}
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Start dot */}
            <circle cx={tx(trail[0].lng)} cy={ty(trail[0].lat)} r="6" fill="#22c55e" stroke="white" strokeWidth="2" />
            {/* Current/last position */}
            <circle cx={tx(last.lng)} cy={ty(last.lat)} r="8" fill={col} stroke="white" strokeWidth="2" />
            <text x={tx(last.lng) + 10} y={ty(last.lat) + 4} fontSize="11" fill={col} fontWeight="bold">
              {s.employeeName.split(" ")[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Timeline Event Row ────────────────────────────────────────────────────────

function TimelineRow({
  time, type, label, durationMins, distanceKm, address, onClick, active
}: {
  time: string; type: string; label: string;
  durationMins?: number; distanceKm?: number;
  address?: string; onClick?: () => void; active?: boolean;
}) {
  const isHalt  = type === "halt";
  const isDrive = type === "drive";
  const isStart = type === "start";
  const isEnd   = type === "end";

  const iconBg    = isHalt ? "#fef3c7" : isDrive ? "#eff6ff" : isStart ? "#f0fdf4" : "#fff1f2";
  const iconBdr   = isHalt ? "#f59e0b" : isDrive ? "#3b82f6" : isStart ? "#22c55e" : "#ef4444";
  const iconLabel = isHalt ? "⏳" : isDrive ? "◎" : isStart ? "▶" : "■";
  const durColor  = isHalt ? "#d97706" : isDrive ? "#3b82f6" : "#64748b";

  return (
    <div
      className={`flex gap-3 px-4 py-2 cursor-pointer transition-colors ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}
      onClick={onClick}
    >
      {/* Time */}
      <div className="w-14 text-xs text-slate-400 pt-1 shrink-0 font-mono">{fmtTime(time)}</div>

      {/* Icon + connector */}
      <div className="flex flex-col items-center">
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: iconBg, border: `2px solid ${iconBdr}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, flexShrink: 0,
        }}>{iconLabel}</div>
        {!isEnd && <div style={{ width: 2, flex: 1, background: "#e2e8f0", minHeight: 16 }} />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-3">
        <div className="flex justify-between items-start">
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          {durationMins !== undefined && (
            <span style={{ color: durColor }} className="text-xs font-bold ml-2 shrink-0">
              {fmtDuration(durationMins)}
              {distanceKm !== undefined && ` · ${fmtDist(distanceKm)}`}
            </span>
          )}
        </div>
        {address && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{address}</p>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SuperAdminFieldTracker() {
  const [selectedEmp, setSelectedEmp]     = useState<string>("all");
  const [selectedDate, setSelectedDate]   = useState(today());
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([]);
  const [allSessions, setAllSessions]     = useState<FieldSession[]>([]);
  const [timeline, setTimeline]           = useState<DayTimeline | null>(null);
  const [activeTab, setActiveTab]         = useState<"live" | "timeline" | "dashboard">("live");
  const [loading, setLoading]             = useState(false);
  const [activeEvent, setActiveEvent]     = useState<number | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    setLiveLocations(fieldTrackingService.getLiveLocations());
    const sessions = fieldTrackingService.getSessionsForDate(selectedDate);
    setAllSessions(sessions);
  }, [selectedDate]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (selectedEmp === "all" || !allSessions.length) { setTimeline(null); return; }
    const session = allSessions.find(s => s.employeeId === selectedEmp);
    if (!session || !session.trail?.length) { setTimeline(null); return; }
    setLoading(true);
    const tl = detectHalts(session.trail);
    setTimeline(tl);
    enrichHalts(tl).then(enriched => { setTimeline({ ...enriched }); setLoading(false); });
  }, [selectedEmp, allSessions]);

  const selectedSessions = selectedEmp === "all"
    ? allSessions
    : allSessions.filter(s => s.employeeId === selectedEmp);

  const selectedSession = allSessions.find(s => s.employeeId === selectedEmp) || null;

  // ── Tab: Live Tracking ────────────────────────────────────────────────────

  const LiveTab = () => (
    <div className="flex h-[calc(100vh-140px)]">
      {/* Left: employee cards */}
      <div className="w-80 shrink-0 border-r overflow-y-auto bg-white">
        <div className="p-3 border-b">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Live — {liveLocations.length} checked in
          </div>
          <button
            onClick={() => setSelectedEmp("all")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium mb-1 ${selectedEmp === "all" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"}`}
          >
            All Employees ({liveLocations.length})
          </button>
        </div>
        {liveLocations.length === 0 && (
          <div className="p-6 text-center text-slate-400 text-sm">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No employees currently checked in
          </div>
        )}
        {liveLocations.map(loc => {
          const color = ROLE_COLORS[loc.role] || { pin: "#64748b", badge: "bg-slate-100", text: "text-slate-800" };
          const ago = minsAgo(loc.lastUpdated);
          return (
            <div
              key={loc.employeeId}
              className={`p-3 border-b cursor-pointer transition-colors ${selectedEmp === loc.employeeId ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-slate-50"}`}
              style={{ borderLeft: selectedEmp === loc.employeeId ? `4px solid ${color.pin}` : "4px solid transparent" }}
              onClick={() => setSelectedEmp(loc.employeeId)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-slate-900">{loc.employeeName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color.badge} ${color.text}`}>{loc.role}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDuration(loc.elapsedMinutes)}</span>
                <span className="flex items-center gap-1"><Footprints className="w-3 h-3" />{fmtDist(loc.totalDistanceKm)}</span>
                <span className={`flex items-center gap-1 ${ago > 5 ? "text-red-500" : "text-green-600"}`}>
                  <Navigation className="w-3 h-3" />{ago}m ago
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {/* Right: SVG map */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 p-2">
          <SVGTrail sessions={selectedSessions} selected={selectedEmp === "all" ? null : selectedEmp} />
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button size="sm" variant="outline" onClick={refresh} className="bg-white shadow-sm">
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
        </div>
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs">
          <div className="font-semibold text-slate-700 mb-2">Legend</div>
          {Object.entries(ROLE_COLORS).map(([role, col]) => (
            <div key={role} className="flex items-center gap-2 mb-1">
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.pin }} />
              <span className="text-slate-600">{role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Tab: Timeline ──────────────────────────────────────────────────────────

  const TimelineTab = () => (
    <div className="flex h-[calc(100vh-140px)]">
      {/* Left: timeline */}
      <div className="w-96 shrink-0 border-r overflow-y-auto bg-white">
        {/* Selectors */}
        <div className="p-3 border-b space-y-2 sticky top-0 bg-white z-10">
          <select
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedEmp}
            onChange={e => setSelectedEmp(e.target.value)}
          >
            <option value="all">— Select employee —</option>
            {allSessions.map(s => (
              <option key={s.employeeId} value={s.employeeId}>
                {s.employeeName} ({s.role})
              </option>
            ))}
          </select>
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Summary row */}
        {timeline && (
          <div className="px-4 py-2 bg-slate-50 border-b text-xs text-slate-500 flex items-center justify-between">
            <span>{selectedDate}</span>
            <span>{fmtDist(timeline.totalDistanceKm)} · {fmtDuration(timeline.totalHaltMins + timeline.totalDriveMins)}</span>
          </div>
        )}

        {/* Timeline events */}
        {selectedSession && (
          <>
            <TimelineRow time={selectedSession.checkInTime} type="start" label="Tracking Started" />
            {loading && (
              <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> Building timeline…
              </div>
            )}
            {timeline?.events.map((ev, i) => (
              <TimelineRow
                key={i}
                time={ev.startTime}
                type={ev.type}
                label={ev.type === "halt" ? "Stop" : "Drive"}
                durationMins={ev.durationMins}
                distanceKm={ev.type === "drive" ? (ev as Drive).distanceKm : undefined}
                address={ev.type === "halt" ? (ev as Halt).address : undefined}
                onClick={() => setActiveEvent(i)}
                active={activeEvent === i}
              />
            ))}
            {selectedSession.checkOutTime && (
              <TimelineRow time={selectedSession.checkOutTime} type="end" label="Check-Out" />
            )}
          </>
        )}
        {!selectedSession && selectedEmp !== "all" && (
          <div className="p-6 text-center text-slate-400 text-sm">No session found for this date</div>
        )}
        {selectedEmp === "all" && (
          <div className="p-6 text-center text-slate-400 text-sm">Select an employee to view their timeline</div>
        )}
      </div>

      {/* Right: map */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 p-2">
          <SVGTrail sessions={selectedSessions} selected={selectedEmp === "all" ? null : selectedEmp} />
        </div>
        {timeline && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs space-y-1">
            <div className="font-semibold text-slate-700 mb-1">Day Summary</div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-500">Total distance</span>
              <span className="font-bold">{fmtDist(timeline.totalDistanceKm)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-500">Halts</span>
              <span className="font-bold text-amber-600">{timeline.totalHalts} · {fmtDuration(timeline.totalHaltMins)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-500">Drives</span>
              <span className="font-bold text-blue-600">{timeline.totalDrives} · {fmtDuration(timeline.totalDriveMins)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Tab: Dashboard ────────────────────────────────────────────────────────

  const DashboardTab = () => {
    const todaySessions = fieldTrackingService.getSessionsForDate(today());
    return (
      <div className="p-6 overflow-y-auto h-[calc(100vh-140px)]">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {["Car Washer", "Operations Manager", "Supervisor", "Sales Manager", "Sales Head"].map(role => {
            const roleSessions = todaySessions.filter(s => s.role === role);
            const active = roleSessions.filter(s => !s.checkOutTime).length;
            const color = ROLE_COLORS[role] || { pin: "#64748b", badge: "bg-slate-100", text: "text-slate-800" };
            return (
              <div key={role} className="bg-white rounded-xl border p-4" style={{ borderTop: `4px solid ${color.pin}` }}>
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2 ${color.badge} ${color.text}`}>{role}</div>
                <div className="text-2xl font-black text-slate-900">{active}</div>
                <div className="text-xs text-slate-500">{active === 1 ? "person" : "people"} in field</div>
                <div className="text-xs text-slate-400 mt-1">{roleSessions.length} sessions today</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {todaySessions.map(s => {
            const color = ROLE_COLORS[s.role] || { pin: "#64748b", badge: "bg-slate-100", text: "text-slate-800" };
            const isActive = !s.checkOutTime;
            const expanded = expandedCards.has(s.id);
            return (
              <div key={s.id} className="bg-white rounded-xl border overflow-hidden"
                style={{ borderLeft: `4px solid ${color.pin}` }}>
                <div className="p-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900">{s.employeeName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color.badge} ${color.text}`}>{s.role}</span>
                      {isActive
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">In Field</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">Checked Out</span>
                      }
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />In: {fmtTime(s.checkInTime)}</span>
                      {s.checkOutTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Out: {fmtTime(s.checkOutTime)}</span>}
                      <span className="flex items-center gap-1"><Footprints className="w-3 h-3" />{fmtDist(s.totalDistanceKm)}</span>
                      <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />{s.trail?.length || 0} pts</span>
                    </div>
                  </div>
                  <button
                    className="ml-2 text-slate-400 hover:text-slate-600"
                    onClick={() => setExpandedCards(prev => {
                      const n = new Set(prev);
                      n.has(s.id) ? n.delete(s.id) : n.add(s.id);
                      return n;
                    })}
                  >
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
                {expanded && s.trail && s.trail.length > 1 && (
                  <div className="border-t p-3" style={{ height: 160 }}>
                    <SVGTrail sessions={[s]} selected={s.employeeId} />
                  </div>
                )}
                {expanded && s.checkInSelfieBase64 && (
                  <div className="border-t p-3 flex gap-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Camera className="w-3 h-3" />Check-In Selfie</div>
                      <img src={s.checkInSelfieBase64} alt="Check-in" className="w-20 h-20 rounded-lg object-cover border" />
                    </div>
                    {s.checkOutSelfieBase64 && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Camera className="w-3 h-3" />Check-Out Selfie</div>
                        <img src={s.checkOutSelfieBase64} alt="Check-out" className="w-20 h-20 rounded-lg object-cover border" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {todaySessions.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No field sessions recorded for today</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Field Team Tracker</h1>
            <p className="text-xs text-slate-500">Live GPS · Timeline · Halt Detection</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {liveLocations.length} in field
          </Badge>
          <Button size="sm" variant="outline" onClick={refresh}>
            <RefreshCw className="w-3 h-3 mr-1" />Refresh
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b px-6 flex gap-0 shrink-0">
        {(["live", "timeline", "dashboard"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
              activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "live" ? "Live Tracking" : tab === "timeline" ? "Timeline" : "Dashboard"}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "live"      && <LiveTab />}
      {activeTab === "timeline"  && <TimelineTab />}
      {activeTab === "dashboard" && <DashboardTab />}
    </div>
  );
}

export default SuperAdminFieldTracker;
