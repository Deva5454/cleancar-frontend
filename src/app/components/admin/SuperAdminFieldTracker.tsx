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
import { fieldTrackingService, ROLE_COLORS, loadSessions, calcAttendance, getAttendanceForDateRange, type LiveLocation, type FieldSession, type DailyAttendance } from "../../services/fieldTrackingService";
import { detectHalts, enrichHalts, type DayTimeline, type Halt, type Drive } from "../../services/haltDetectionService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { MapPin, Navigation, Clock, Footprints, RefreshCw, Play, Pause, Users, AlertTriangle, ChevronDown, ChevronRight, Camera, Lock } from "lucide-react";
import { useRole } from "../../contexts/RoleContext";

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

function SVGTrail({ sessions, selected, highlightLat, highlightLng, highlightType, haltMarkers }: {
  sessions: FieldSession[];
  selected: string | null;
  highlightLat?: number | null;
  highlightLng?: number | null;
  highlightType?: "halt" | "drive" | null;
  haltMarkers?: Array<{ lat: number; lng: number; index: number; durationMins: number }>;
}) {
  const allPts = sessions.flatMap(s => s.trail || []);
  if (allPts.length < 2) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
      <MapPin className="w-8 h-8 mb-2 opacity-30" />
      <p className="text-sm">No trail data for this date</p>
      <p className="text-xs mt-1">Employees check in to start tracking</p>
    </div>
  );

  const PAD = 40, W = 900, H = 500;

  // If there's a highlighted point, center the view around it (zoom in)
  let lats: number[], lngs: number[];
  if (highlightLat && highlightLng) {
    const ZOOM = 0.008; // zoom radius in degrees
    lats = [highlightLat - ZOOM, highlightLat + ZOOM];
    lngs = [highlightLng - ZOOM, highlightLng + ZOOM];
    // Ensure trail points near the highlight are included
    const nearby = allPts.filter(p =>
      Math.abs(p.lat - highlightLat) < ZOOM * 2 &&
      Math.abs(p.lng - highlightLng) < ZOOM * 2
    );
    if (nearby.length > 2) {
      lats = [Math.min(...nearby.map(p => p.lat), highlightLat - ZOOM * 0.5), Math.max(...nearby.map(p => p.lat), highlightLat + ZOOM * 0.5)];
      lngs = [Math.min(...nearby.map(p => p.lng), highlightLng - ZOOM * 0.5), Math.max(...nearby.map(p => p.lng), highlightLng + ZOOM * 0.5)];
    }
  } else {
    lats = allPts.map(p => p.lat);
    lngs = allPts.map(p => p.lng);
  }

  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];

  const tx = (lng: number) => PAD + ((lng - minLng) / (maxLng - minLng || 0.001)) * (W - 2 * PAD);
  const ty = (lat: number) => H - PAD - ((lat - minLat) / (maxLat - minLat || 0.001)) * (H - 2 * PAD);

  const roleColors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#0ea5e9"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full bg-slate-50 rounded-lg">
      {/* Grid lines */}
      {[0.2, 0.4, 0.6, 0.8].map(r => (
        <g key={r}>
          <line x1={PAD} y1={H * r} x2={W - PAD} y2={H * r} stroke="#e2e8f0" strokeWidth="1" />
          <line x1={W * r} y1={PAD} x2={W * r} y2={H - PAD} stroke="#e2e8f0" strokeWidth="1" />
        </g>
      ))}
      <text x={W - 10} y={H - 6} fontSize="9" textAnchor="end" fill="#94a3b8">© OpenStreetMap contributors</text>

      {/* GPS trails */}
      {sessions.map((s, idx) => {
        const trail = s.trail || [];
        if (trail.length < 2) return null;
        const col = ROLE_COLORS[s.role]?.pin || roleColors[idx % roleColors.length];
        const isSelected = selected === s.employeeId;
        const d = trail.map((p, i) => `${i === 0 ? "M" : "L"}${tx(p.lng).toFixed(1)},${ty(p.lat).toFixed(1)}`).join(" ");
        const last = trail[trail.length - 1];
        const first = trail[0];
        return (
          <g key={s.id} opacity={selected && !isSelected ? 0.2 : 1}>
            <path d={d} fill="none" stroke={col} strokeWidth={isSelected ? 3 : 2}
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Start dot */}
            <circle cx={tx(first.lng)} cy={ty(first.lat)} r="6" fill="#22c55e" stroke="white" strokeWidth="2" />
            <text x={tx(first.lng) + 8} y={ty(first.lat) - 6} fontSize="9" fill="#22c55e" fontWeight="bold">START</text>
            {/* Current/last position */}
            <circle cx={tx(last.lng)} cy={ty(last.lat)} r="8" fill={col} stroke="white" strokeWidth="2" />
            <text x={tx(last.lng) + 10} y={ty(last.lat) + 4} fontSize="11" fill={col} fontWeight="bold">
              {s.employeeName.split(" ")[0]}
            </text>
          </g>
        );
      })}

      {/* Always-visible halt number markers */}
      {haltMarkers && haltMarkers.map(h => (
        <g key={h.index}>
          <circle cx={tx(h.lng)} cy={ty(h.lat)} r="10" fill="#f59e0b" stroke="white" strokeWidth="2" opacity="0.85" />
          <text x={tx(h.lng)} y={ty(h.lat) + 4} fontSize="10" textAnchor="middle" fill="white" fontWeight="bold">{h.index + 1}</text>
        </g>
      ))}

      {/* Highlighted point when timeline row clicked */}
      {highlightLat && highlightLng && (
        <g>
          {/* Outer pulse ring */}
          <circle cx={tx(highlightLng)} cy={ty(highlightLat)} r="22" fill={highlightType === "halt" ? "#f59e0b" : "#3b82f6"} opacity="0.15" />
          <circle cx={tx(highlightLng)} cy={ty(highlightLat)} r="15" fill={highlightType === "halt" ? "#f59e0b" : "#3b82f6"} opacity="0.25" />
          {/* Main marker */}
          <circle cx={tx(highlightLng)} cy={ty(highlightLat)} r="9" fill={highlightType === "halt" ? "#f59e0b" : "#3b82f6"} stroke="white" strokeWidth="2.5" />
          <text x={tx(highlightLng)} y={ty(highlightLat) + 4} fontSize="11" textAnchor="middle" fill="white" fontWeight="bold">
            {highlightType === "halt" ? "⏳" : "→"}
          </text>
          {/* Crosshair lines */}
          <line x1={tx(highlightLng) - 18} y1={ty(highlightLat)} x2={tx(highlightLng) - 12} y2={ty(highlightLat)} stroke={highlightType === "halt" ? "#f59e0b" : "#3b82f6"} strokeWidth="1.5" />
          <line x1={tx(highlightLng) + 12} y1={ty(highlightLat)} x2={tx(highlightLng) + 18} y2={ty(highlightLat)} stroke={highlightType === "halt" ? "#f59e0b" : "#3b82f6"} strokeWidth="1.5" />
          <line x1={tx(highlightLng)} y1={ty(highlightLat) - 18} x2={tx(highlightLng)} y2={ty(highlightLat) - 12} stroke={highlightType === "halt" ? "#f59e0b" : "#3b82f6"} strokeWidth="1.5" />
          <line x1={tx(highlightLng)} y1={ty(highlightLat) + 12} x2={tx(highlightLng)} y2={ty(highlightLat) + 18} stroke={highlightType === "halt" ? "#f59e0b" : "#3b82f6"} strokeWidth="1.5" />
        </g>
      )}

      {/* Zoom indicator when zoomed in */}
      {highlightLat && highlightLng && (
        <g>
          <rect x={W - 85} y={8} width={78} height={20} rx="4" fill="white" opacity="0.9" />
          <text x={W - 46} y={22} fontSize="10" textAnchor="middle" fill="#64748b">🔍 Zoomed in</text>
        </g>
      )}
    </svg>
  );
}


// ── Main Component ────────────────────────────────────────────────────────────


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
  const iconBg  = isHalt ? "#fef3c7" : isDrive ? "#eff6ff" : isStart ? "#f0fdf4" : "#fff1f2";
  const iconBdr = isHalt ? "#f59e0b" : isDrive ? "#3b82f6" : isStart ? "#22c55e" : "#ef4444";
  const iconLbl = isHalt ? "⏳" : isDrive ? "◎" : isStart ? "▶" : "■";
  const durCol  = isHalt ? "#d97706" : isDrive ? "#3b82f6" : "#64748b";
  return (
    <div
      className={`flex gap-3 px-4 py-2 cursor-pointer transition-colors ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}
      onClick={onClick}
    >
      <div className="w-14 text-xs text-slate-400 pt-1 shrink-0 font-mono">{new Date(time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
      <div className="flex flex-col items-center">
        <div style={{width:20,height:20,borderRadius:"50%",background:iconBg,border:`2px solid ${iconBdr}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0}}>{iconLbl}</div>
        {!isEnd && <div style={{width:2,flex:1,background:"#e2e8f0",minHeight:16}}/>}
      </div>
      <div className="flex-1 pb-3">
        <div className="flex justify-between items-start">
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          {durationMins !== undefined && (
            <span style={{color:durCol}} className="text-xs font-bold ml-2 shrink-0">
              {Math.floor(durationMins/60)>0?`${Math.floor(durationMins/60)}h `:""}{durationMins%60}m
              {distanceKm !== undefined && ` · ${distanceKm<1?Math.round(distanceKm*1000)+"m":distanceKm.toFixed(2)+"km"}`}
            </span>
          )}
        </div>
        {address && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{address}</p>}
      </div>
    </div>
  );
}

export function SuperAdminFieldTracker() {
  const { currentRole } = useRole();
  const hasAccess = currentRole === "Super Admin" || currentRole === "Operations Manager";
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
          <SVGTrail
              sessions={selectedSessions}
              selected={selectedEmp === "all" ? null : selectedEmp}
              highlightLat={activeEvent !== null ? (() => {
                const ev = timeline?.events[activeEvent];
                if (!ev) return null;
                if (ev.type === "halt") return (ev as any).lat;
                // For drives: show midpoint of drive segment
                const s = selectedSession?.trail || [];
                const driveStart = s.findIndex(p => p.ts >= ev.startTime);
                const driveEnd = s.findIndex(p => p.ts >= ev.endTime);
                if (driveStart >= 0 && driveEnd > driveStart) {
                  const mid = Math.floor((driveStart + driveEnd) / 2);
                  return s[mid]?.lat || null;
                }
                return null;
              })() : null}
              highlightLng={activeEvent !== null ? (() => {
                const ev = timeline?.events[activeEvent];
                if (!ev) return null;
                if (ev.type === "halt") return (ev as any).lng;
                const s = selectedSession?.trail || [];
                const driveStart = s.findIndex(p => p.ts >= ev.startTime);
                const driveEnd = s.findIndex(p => p.ts >= ev.endTime);
                if (driveStart >= 0 && driveEnd > driveStart) {
                  const mid = Math.floor((driveStart + driveEnd) / 2);
                  return s[mid]?.lng || null;
                }
                return null;
              })() : null}
              highlightType={activeEvent !== null ? timeline?.events[activeEvent]?.type as "halt"|"drive" : null}
              haltMarkers={timeline?.events
                .map((ev, i) => ev.type === "halt" ? { lat: (ev as any).lat, lng: (ev as any).lng, index: i, durationMins: (ev as any).durationMins } : null)
                .filter(Boolean) as any}
            />
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
          <div className="border-b">
            <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
              <span className="font-medium">{selectedDate}</span>
              <span>{fmtDist(timeline.totalDistanceKm)} · {fmtDuration(timeline.totalHaltMins + timeline.totalDriveMins)}</span>
            </div>
            <div className="grid grid-cols-3 divide-x text-center py-2 bg-white">
              <div className="px-2">
                <div className="text-base font-black text-blue-600">{timeline.totalDrives}</div>
                <div className="text-[10px] text-slate-400">Drives</div>
                <div className="text-xs font-medium">{fmtDist(timeline.totalDistanceKm)}</div>
              </div>
              <div className="px-2">
                <div className="text-base font-black text-amber-600">{timeline.totalHalts}</div>
                <div className="text-[10px] text-slate-400">Stops</div>
                <div className="text-xs font-medium">{fmtDuration(timeline.totalHaltMins)}</div>
              </div>
              <div className="px-2">
                <div className="text-base font-black text-slate-700">{fmtDuration(timeline.totalDriveMins)}</div>
                <div className="text-[10px] text-slate-400">Moving</div>
                <div className="text-xs font-medium text-green-600">
                  {selectedSession?.checkOutTime ? "Done" : "Active"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline events */}
        {selectedSession && (
          <>
            <TimelineRow time={selectedSession.checkInTime} type="start" label="Tracking Started" />
            {loading && (
              <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2 bg-blue-50">
                <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                <div>
                  <div className="text-blue-600 font-medium">Building timeline…</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Fetching stop addresses from OpenStreetMap</div>
                </div>
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
                onClick={() => setActiveEvent(activeEvent === i ? null : i)}
                active={activeEvent === i}
              />
            ))}
            {selectedSession.checkOutTime && (
              <TimelineRow time={selectedSession.checkOutTime} type="end" label="Check-Out" />
            )}
            {/* Selected stop detail */}
            {activeEvent !== null && timeline?.events[activeEvent]?.type === "halt" && (() => {
              const halt = timeline.events[activeEvent] as any;
              return (
                <div className="mx-3 mb-3 mt-1 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-amber-800">⏳ Stop Details</span>
                    <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-semibold">{halt.durationMins} mins</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-amber-700">Started</span>
                      <span className="font-mono font-semibold">{fmtTime(halt.startTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Ended</span>
                      <span className="font-mono font-semibold">{fmtTime(halt.endTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Duration</span>
                      <span className="font-semibold">{fmtDuration(halt.durationMins)}</span>
                    </div>
                    {halt.address && (
                      <div className="pt-1 border-t border-amber-200">
                        <div className="text-amber-700 mb-0.5">Location</div>
                        <div className="text-amber-900 font-medium leading-relaxed">{halt.address}</div>
                      </div>
                    )}
                    <div className="pt-1 border-t border-amber-200">
                      <a
                        href={`https://www.google.com/maps?q=${halt.lat},${halt.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
                      >
                        📍 Open in Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              );
            })()}
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

  // ── Tab: Attendance ──────────────────────────────────────────────────────
  const AttendanceTab = () => {
    const [attDate, setAttDate] = useState(today());
    const [attRecords, setAttRecords] = useState<DailyAttendance[]>([]);
    const [viewMode, setViewMode] = useState<"day" | "week">("day");

    useEffect(() => {
      const sessions = loadSessions();
      const empMap: Record<string, { name: string; role: string }> = {};
      sessions.forEach(s => { empMap[s.employeeId] = { name: s.employeeName, role: s.role }; });
      const empIds = Object.keys(empMap);

      if (viewMode === "day") {
        const records = empIds.map(id => {
          const session = sessions.find(s => s.employeeId === id && s.date === attDate) || null;
          return calcAttendance(session, attDate, id, empMap[id].name, empMap[id].role);
        });
        setAttRecords(records);
      } else {
        // Week view
        const end = attDate;
        const startD = new Date(attDate);
        startD.setDate(startD.getDate() - 6);
        const start = startD.toISOString().slice(0, 10);
        setAttRecords(getAttendanceForDateRange(empIds, empMap, start, end));
      }
    }, [attDate, viewMode]);

    const statusColor: Record<string, string> = {
      Present:  "bg-green-100 text-green-800",
      Late:     "bg-yellow-100 text-yellow-800",
      "Half Day": "bg-orange-100 text-orange-800",
      Absent:   "bg-red-100 text-red-800",
      Weekend:  "bg-slate-100 text-slate-400",
      Holiday:  "bg-purple-100 text-purple-800",
    };

    const summary = {
      Present:  attRecords.filter(r => r.status === "Present").length,
      Late:     attRecords.filter(r => r.status === "Late").length,
      "Half Day": attRecords.filter(r => r.status === "Half Day").length,
      Absent:   attRecords.filter(r => r.status === "Absent").length,
    };

    return (
      <div className="p-6 overflow-y-auto h-[calc(100vh-140px)]">
        {/* Controls */}
        <div className="flex items-center gap-3 mb-6">
          <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex rounded-lg border overflow-hidden">
            <button onClick={() => setViewMode("day")}
              className={`px-4 py-2 text-sm font-medium ${viewMode === "day" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
              Day
            </button>
            <button onClick={() => setViewMode("week")}
              className={`px-4 py-2 text-sm font-medium ${viewMode === "week" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
              Week
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {viewMode === "day" && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Object.entries(summary).map(([status, count]) => (
              <div key={status} className={`rounded-xl p-4 border ${statusColor[status]?.split(" ")[0] || "bg-slate-50"}`}>
                <div className="text-2xl font-black">{count}</div>
                <div className="text-sm font-semibold">{status}</div>
              </div>
            ))}
          </div>
        )}

        {/* Day view — one row per employee */}
        {viewMode === "day" && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {["Employee", "Role", "Status", "Check-In", "Check-Out", "Late", "Hours Worked", "GPS"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attRecords.map((r, i) => (
                  <tr key={r.employeeId} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.employeeName}</td>
                    <td className="px-4 py-3">
                      <span style={{background: ROLE_COLORS[r.role]?.pin + "22", color: ROLE_COLORS[r.role]?.pin}}
                        className="px-2 py-0.5 rounded-full text-xs font-medium">{r.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor[r.status] || "bg-slate-100"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.checkInTime ? (
                        <span className={r.lateMinutes > 0 ? "text-red-600" : "text-green-600"}>
                          {fmtTime(r.checkInTime)}
                          {r.lateMinutes > 0 && <span className="ml-1 text-red-500">(+{r.lateMinutes}m late)</span>}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.checkOutTime ? (
                        <span className={r.earlyLeaveMinutes > 30 ? "text-orange-600" : "text-slate-600"}>
                          {fmtTime(r.checkOutTime)}
                          {r.earlyLeaveMinutes > 30 && <span className="ml-1">(-{r.earlyLeaveMinutes}m early)</span>}
                        </span>
                      ) : r.status !== "Absent" && r.status !== "Weekend"
                        ? <span className="text-blue-500 text-xs">In field</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.lateMinutes > 0
                        ? <span className="text-red-600 font-semibold">{r.lateMinutes}m</span>
                        : <span className="text-green-600">On time</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.totalHoursWorked > 0
                        ? <span className={r.totalHoursWorked < r.requiredHours * 0.5 ? "text-red-600" : "text-slate-700"}>
                            {r.totalHoursWorked.toFixed(1)}h / {r.requiredHours}h
                          </span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.gpsLat ? (
                        <a href={`https://www.google.com/maps?q=${r.gpsLat},${r.gpsLng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-blue-500 hover:underline">
                          📍 Map
                        </a>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
                {attRecords.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No attendance data for this date</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Week view — calendar grid */}
        {viewMode === "week" && (() => {
          const employees = [...new Set(attRecords.map(r => r.employeeId))];
          const dates = [...new Set(attRecords.map(r => r.date))].sort();
          return (
            <div className="bg-white rounded-xl border overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Employee</th>
                    {dates.map(d => (
                      <th key={d} className="px-3 py-3 text-center text-xs font-semibold text-slate-500">
                        {new Date(d+"T12:00:00").toLocaleDateString("en-IN", {weekday:"short", day:"numeric", month:"short"})}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((empId, i) => {
                    const empRecs = attRecords.filter(r => r.employeeId === empId);
                    const first = empRecs[0];
                    return (
                      <tr key={empId} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{first?.employeeName}</div>
                          <div className="text-xs text-slate-400">{first?.role}</div>
                        </td>
                        {dates.map(d => {
                          const rec = empRecs.find(r => r.date === d);
                          if (!rec) return <td key={d} className="px-3 py-3 text-center"><span className="text-slate-200">—</span></td>;
                          return (
                            <td key={d} className="px-3 py-3 text-center">
                              <div className={`inline-flex flex-col items-center px-2 py-1 rounded-lg text-xs font-bold ${statusColor[rec.status] || "bg-slate-100"}`}>
                                <span>{rec.status === "Present" ? "P" : rec.status === "Late" ? "L" : rec.status === "Half Day" ? "H" : rec.status === "Absent" ? "A" : rec.status === "Weekend" ? "—" : "H"}</span>
                                {rec.checkInTime && rec.status !== "Weekend" && (
                                  <span className="font-normal text-[10px] mt-0.5">{fmtTime(rec.checkInTime)}</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-xs text-slate-500">
          {[["P","Present","bg-green-100 text-green-800"],["L","Late","bg-yellow-100 text-yellow-800"],["H","Half Day","bg-orange-100 text-orange-800"],["A","Absent","bg-red-100 text-red-800"]].map(([code,label,cls])=>(
            <div key={code} className="flex items-center gap-1">
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${cls}`}>{code}</span>
              <span>{label}</span>
            </div>
          ))}
          <span className="ml-2 text-slate-400">Grace period: 15 mins | Late: 16-60 mins | Half Day: &gt;60 mins late or &lt;50% hours</span>
        </div>
      </div>
    );
  };

  if (!hasAccess) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 p-6 bg-white border rounded-lg shadow-sm max-w-md">
          <Lock className="w-6 h-6 text-gray-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">Restricted</p>
            <p className="text-sm text-gray-500">Field Tracker is available to Super Admin and Operations Manager only.</p>
          </div>
        </div>
      </div>
    );
  }

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

      {liveLocations.length === 0 && allSessions.length === 0 && (
        <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          No field sessions on file yet — this screen reads real GPS/session data from fieldTrackingService, but nothing in the field-facing apps currently writes to it. Once a real location-tracking flow starts logging sessions, they'll appear here automatically.
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white border-b px-6 flex gap-0 shrink-0">
        {(["live", "timeline", "attendance", "dashboard"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
              activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "live" ? "Live Tracking" : tab === "timeline" ? "Timeline" : tab === "attendance" ? "Attendance" : "Dashboard"}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "live"       && <LiveTab />}
      {activeTab === "timeline"   && <TimelineTab />}
      {activeTab === "attendance" && <AttendanceTab />}
      {activeTab === "dashboard"  && <DashboardTab />}
    </div>
  );
}

export default SuperAdminFieldTracker;
