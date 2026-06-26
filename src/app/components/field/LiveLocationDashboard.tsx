/**
 * LiveLocationDashboard — PagarBook-style field attendance tracker
 * Clean ledger UI: staff list on left, day detail on right
 */

import { useState, useEffect } from "react";
import {
  MapPin, Navigation, Clock, Footprints, AlertTriangle,
  RefreshCw, CheckCircle2, XCircle, ChevronRight,
  IndianRupee, Users, Wifi, WifiOff, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  fieldTrackingService,
  type LiveLocation,
  type FieldSession,
} from "../../services/fieldTrackingService";
import { travelReimbursementService } from "../../services/travelReimbursementService";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt12 = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

const durMins = (from: string, to?: string) =>
  Math.round((new Date(to ?? new Date().toISOString()).getTime() - new Date(from).getTime()) / 60000);

const durStr = (mins: number) => {
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const staleMin = (iso: string) =>
  Math.round((Date.now() - new Date(iso).getTime()) / 60000);

const ROLE_COLOR: Record<string, string> = {
  "Sales Head":    "bg-purple-100 text-purple-800",
  "Sales Manager": "bg-blue-100 text-blue-800",
  "Supervisor":    "bg-amber-100 text-amber-800",
};

const STATUS_COLOR = {
  present:   "bg-green-500",
  stale:     "bg-amber-400",
  checkedOut:"bg-gray-300",
};

// ── Trail SVG ─────────────────────────────────────────────────────────────────
function TrailMap({ trail }: { trail: FieldSession["trail"] }) {
  if (trail.length < 2)
    return (
      <div className="h-28 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed">
        Trail starts after first movement
      </div>
    );

  const lats = trail.map(p => p.lat), lngs = trail.map(p => p.lng);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const [W, H, P] = [360, 120, 14];
  const tx = (lng: number) => P + ((lng - minLng) / (maxLng - minLng || 1)) * (W - P * 2);
  const ty = (lat: number) => H - P - ((lat - minLat) / (maxLat - minLat || 1)) * (H - P * 2);
  const d = trail.map((p, i) => `${i === 0 ? "M" : "L"}${tx(p.lng).toFixed(1)},${ty(p.lat).toFixed(1)}`).join(" ");

  return (
    <div className="relative rounded-xl overflow-hidden border bg-slate-50">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <path d={d} fill="none" stroke="#6366f1" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        {trail.slice(1, -1).map((p, i) => (
          <circle key={i} cx={tx(p.lng)} cy={ty(p.lat)} r="1.8" fill="#818cf8" opacity="0.5" />
        ))}
        <circle cx={tx(trail[0].lng)} cy={ty(trail[0].lat)} r="5" fill="#22c55e" />
        <circle cx={tx(trail[trail.length - 1].lng)} cy={ty(trail[trail.length - 1].lat)} r="5" fill="#ef4444" />
      </svg>
      <span className="absolute bottom-1.5 left-2.5 text-[9px] font-bold text-green-700">START</span>
      <span className="absolute top-1.5 right-2.5 text-[9px] font-bold text-red-600">
        {trail[trail.length - 1] ? "LAST" : ""}
      </span>
    </div>
  );
}

// ── Attendance dot ────────────────────────────────────────────────────────────
function Dot({ status }: { status: keyof typeof STATUS_COLOR }) {
  return (
    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLOR[status]} ${status === "present" ? "animate-pulse" : ""}`} />
  );
}

// ── Staff row (PagarBook-style ledger row) ────────────────────────────────────
function StaffRow({
  name, role, status, sub, selected, onClick,
}: {
  name: string; role: string; status: "present" | "stale" | "checkedOut";
  sub: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors ${selected ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"}`}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${ROLE_COLOR[role] ?? "bg-gray-100 text-gray-700"}`}>
        {name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Dot status={status} />
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
        </div>
        <p className="text-xs text-gray-500 truncate">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </button>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border p-3 text-center">
      <div className="flex justify-center text-gray-400 mb-1">{icon}</div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-bold text-gray-900 text-sm">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Detail panel for a live employee ─────────────────────────────────────────
function LiveDetail({ loc }: { loc: LiveLocation }) {
  const [session, setSession] = useState<FieldSession | null>(null);
  const stale = staleMin(loc.lastUpdated);

  useEffect(() => {
    const s = fieldTrackingService.getSessionsForEmployee(loc.employeeId, 1)
      .find(s => s.id === loc.sessionId);
    setSession(s ?? null);
  }, [loc.sessionId]);

  const minsInField = durMins(session?.checkInTime ?? new Date().toISOString());
  const travel = travelReimbursementService.getTrips()
    .find(t => t.employeeId === loc.employeeId && t.tripDate === new Date().toISOString().slice(0, 10));

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Name + status header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{loc.employeeName}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[loc.role] ?? "bg-gray-100 text-gray-700"}`}>
              {loc.role}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            {stale <= 5
              ? <><Wifi className="w-3 h-3 text-green-500" />Live · updated {stale}m ago</>
              : <><WifiOff className="w-3 h-3 text-amber-500" />Signal lost · last seen {stale}m ago</>}
          </p>
        </div>
        <a
          href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
          target="_blank" rel="noopener noreferrer"
          className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 flex items-center gap-1"
        >
          <MapPin className="w-3.5 h-3.5" />Maps
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Stat icon={<Clock className="w-3.5 h-3.5" />}     label="Check-in"   value={session ? fmt12(session.checkInTime) : "--"} />
        <Stat icon={<Footprints className="w-3.5 h-3.5" />} label="Distance"  value={`${loc.totalDistanceKm} km`} />
        <Stat icon={<Clock className="w-3.5 h-3.5" />}     label="In field"   value={durStr(minsInField)} />
        <Stat icon={<Navigation className="w-3.5 h-3.5" />} label="GPS pts"   value={session?.trail.length ?? 0} />
      </div>

      {/* Trail */}
      {session && <TrailMap trail={session.trail} />}

      {/* Coordinates */}
      <div className="bg-gray-50 rounded-xl border px-4 py-3 text-xs text-gray-500 font-mono">
        {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)} · ±{loc.accuracy}m accuracy
      </div>

      {/* Travel reimbursement status */}
      {travel ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-900">Travel Claim Auto-Submitted</p>
              <p className="text-xs text-green-700">{loc.totalDistanceKm} km · ₹{travel.ratePerKm}/km · {travel.gpsTrailPoints} GPS pts</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-green-700 text-sm">₹{travel.netPayableAmount?.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{travel.status}</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3 text-xs text-gray-400 flex items-center gap-2">
          <IndianRupee className="w-3.5 h-3.5" />
          Travel claim will auto-submit when this employee checks out
        </div>
      )}
    </div>
  );
}

// ── Detail panel for a historical session ────────────────────────────────────
function HistoryDetail({ session }: { session: FieldSession }) {
  const mins = session.checkOutTime
    ? durMins(session.checkInTime, session.checkOutTime)
    : durMins(session.checkInTime);
  const travel = travelReimbursementService.getTrips()
    .find(t => t.fieldSessionId === session.id);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">{session.employeeName}</h2>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[session.role] ?? "bg-gray-100 text-gray-700"}`}>
            {session.role}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{fmtDate(session.date)}</p>
      </div>

      {/* Time + outcome row */}
      <div className="bg-white border rounded-xl">
        {[
          { label: "Check-in",   value: fmt12(session.checkInTime) },
          { label: "Check-out",  value: session.checkOutTime ? fmt12(session.checkOutTime) : "—" },
          { label: "Duration",   value: durStr(mins) },
          { label: "Distance",   value: `${session.totalDistanceKm} km` },
          { label: "GPS points", value: `${session.trail.length} recorded` },
          { label: "Checkout",   value: session.isAutoCheckout ? "Auto (location off)" : "Manual" },
        ].map(({ label, value }, i) => (
          <div key={label} className={`flex justify-between items-center px-4 py-2.5 text-sm ${i !== 0 ? "border-t" : ""}`}>
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Trail */}
      <TrailMap trail={session.trail} />

      {/* Selfies */}
      {(session.checkInSelfieBase64 || session.checkOutSelfieBase64) && (
        <div className="grid grid-cols-2 gap-3">
          {session.checkInSelfieBase64 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Check-in selfie</p>
              <img src={session.checkInSelfieBase64} alt="Check-in"
                className="w-full h-24 object-cover rounded-xl border" />
            </div>
          )}
          {session.checkOutSelfieBase64 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Check-out selfie</p>
              <img src={session.checkOutSelfieBase64} alt="Check-out"
                className="w-full h-24 object-cover rounded-xl border" />
            </div>
          )}
        </div>
      )}

      {/* Travel reimbursement */}
      {travel ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-4 h-4 text-green-600" />
            <p className="text-sm font-semibold text-green-900">GPS Travel Claim</p>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
              travel.status === "Approved" ? "bg-green-100 text-green-800" :
              travel.status === "Rejected" ? "bg-red-100 text-red-800" :
              "bg-amber-100 text-amber-800"
            }`}>{travel.status}</span>
          </div>
          <div className="space-y-1 text-xs text-green-700">
            <div className="flex justify-between"><span>Distance</span><span>{travel.gpsDistanceKm} km (GPS)</span></div>
            <div className="flex justify-between"><span>Rate</span><span>₹{travel.ratePerKm}/km</span></div>
            <div className="flex justify-between font-bold text-sm text-green-900 border-t border-green-200 pt-1 mt-1">
              <span>Reimbursement</span><span>₹{travel.netPayableAmount?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed rounded-xl p-3 text-xs text-gray-400 flex items-center gap-2">
          <IndianRupee className="w-3.5 h-3.5" />
          No travel claim — employee not enrolled or distance zero
        </div>
      )}

      {/* Reinstate request */}
      {session.reinstateRequest && (
        <div className={`rounded-xl border p-3 ${
          session.reinstateRequest.status === "Approved" ? "bg-green-50 border-green-200" :
          session.reinstateRequest.status === "Rejected" ? "bg-red-50 border-red-200" :
          "bg-orange-50 border-orange-200"
        }`}>
          <p className="text-xs font-semibold mb-1">Reinstatement Request — {session.reinstateRequest.status}</p>
          <p className="text-xs text-gray-600 italic">"{session.reinstateRequest.reason}"</p>
        </div>
      )}
    </div>
  );
}

// ── Reinstatement approval list ───────────────────────────────────────────────
function ReinstateApprovals({ onDone }: { onDone: () => void }) {
  const pending = fieldTrackingService.getAllPendingReinstate();
  if (!pending.length)
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
        <div className="text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          No reinstatement requests pending
        </div>
      </div>
    );

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <h3 className="font-semibold text-gray-900">Reinstatement Requests</h3>
      {pending.map(s => (
        <div key={s.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{s.employeeName}</p>
              <p className="text-xs text-gray-500">{s.role} · {s.date}</p>
              <p className="text-xs text-gray-500">Auto-checked-out at {fmt12(s.checkOutTime!)}</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          </div>
          <p className="text-xs bg-white border rounded-lg px-3 py-2 text-gray-700 italic">
            "{s.reinstateRequest?.reason}"
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                fieldTrackingService.approveReinstateRequest(s.id, "Super Admin");
                toast.success(`${s.employeeName}'s attendance reinstated`);
                onDone();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white text-xs font-medium rounded-lg py-2 hover:bg-green-700"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 border border-red-300 text-red-700 text-xs font-medium rounded-lg py-2 hover:bg-red-50"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
type PanelMode = "live_detail" | "history_detail" | "reinstate" | "empty";

export function LiveLocationDashboard() {
  const [liveLocations, setLiveLocations]   = useState<LiveLocation[]>([]);
  const [historyDate, setHistoryDate]        = useState(new Date().toISOString().slice(0, 10));
  const [historySessions, setHistorySessions]= useState<FieldSession[]>([]);
  const [leftTab, setLeftTab]                = useState<"live" | "history">("live");
  const [selectedLoc, setSelectedLoc]        = useState<LiveLocation | null>(null);
  const [selectedSess, setSelectedSess]      = useState<FieldSession | null>(null);
  const [panelMode, setPanelMode]            = useState<PanelMode>("empty");
  const [lastRefresh, setLastRefresh]        = useState(new Date());
  const [refreshKey, setRefreshKey]          = useState(0);

  const pendingCount = fieldTrackingService.getAllPendingReinstate().length;
  const autoTripsToday = travelReimbursementService.getTrips()
    .filter(t => t.autoSubmittedFromFieldTracking && t.tripDate === new Date().toISOString().slice(0, 10)).length;

  const doRefresh = () => {
    const locs = fieldTrackingService.getLiveLocations();
    setLiveLocations(locs);
    setHistorySessions(fieldTrackingService.getSessionsForDate(historyDate));
    setLastRefresh(new Date());
    setRefreshKey(k => k + 1);
  };

  useEffect(() => { doRefresh(); const t = setInterval(doRefresh, 30000); return () => clearInterval(t); }, []);
  useEffect(() => { setHistorySessions(fieldTrackingService.getSessionsForDate(historyDate)); }, [historyDate]);

  const checkedIn = liveLocations.length;
  const stale = liveLocations.filter(l => staleMin(l.lastUpdated) > 5).length;

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl border shadow-sm overflow-hidden">

      {/* ── LEFT PANEL — Staff list ──────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col border-r bg-gray-50">

        {/* Top bar */}
        <div className="px-4 pt-4 pb-2 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-blue-600" /> Field Tracker
            </h1>
            <button onClick={doRefresh} className="text-gray-400 hover:text-gray-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Summary chips */}
          <div className="flex gap-2 text-xs flex-wrap">
            <span className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />{checkedIn} Live
            </span>
            {stale > 0 && (
              <span className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                <WifiOff className="w-3 h-3" />{stale} Stale
              </span>
            )}
            {pendingCount > 0 && (
              <button
                onClick={() => { setPanelMode("reinstate"); setSelectedLoc(null); setSelectedSess(null); }}
                className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium hover:bg-orange-200"
              >
                <AlertTriangle className="w-3 h-3" />{pendingCount} Alert
              </button>
            )}
            {autoTripsToday > 0 && (
              <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                <IndianRupee className="w-3 h-3" />{autoTripsToday} Claims
              </span>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b bg-white">
          {(["live", "history"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setLeftTab(tab); setPanelMode("empty"); setSelectedLoc(null); setSelectedSess(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                leftTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "live" ? `Live (${checkedIn})` : "History"}
            </button>
          ))}
        </div>

        {/* Live list */}
        {leftTab === "live" && (
          <div className="flex-1 overflow-y-auto">
            {liveLocations.length === 0 ? (
              <div className="text-center text-gray-400 py-10 px-4">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <p className="text-xs">No one is currently in the field</p>
              </div>
            ) : (
              liveLocations.map(loc => (
                <StaffRow
                  key={loc.sessionId}
                  name={loc.employeeName}
                  role={loc.role}
                  status={staleMin(loc.lastUpdated) > 5 ? "stale" : "present"}
                  sub={`${loc.totalDistanceKm} km · ${durStr(durMins(
                    fieldTrackingService.getSessionsForEmployee(loc.employeeId, 1)[0]?.checkInTime
                    ?? new Date().toISOString()
                  ))} in field`}
                  selected={panelMode === "live_detail" && selectedLoc?.sessionId === loc.sessionId}
                  onClick={() => { setSelectedLoc(loc); setSelectedSess(null); setPanelMode("live_detail"); }}
                />
              ))
            )}
          </div>
        )}

        {/* History list */}
        {leftTab === "history" && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="px-4 py-3 border-b bg-white">
              <input
                type="date"
                value={historyDate}
                onChange={e => setHistoryDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full border rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {historySessions.length === 0 ? (
              <div className="text-center text-gray-400 py-10 px-4">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <p className="text-xs">No sessions on {fmtDate(historyDate)}</p>
              </div>
            ) : (
              historySessions.map(s => (
                <StaffRow
                  key={s.id}
                  name={s.employeeName}
                  role={s.role}
                  status="checkedOut"
                  sub={`${fmt12(s.checkInTime)} → ${s.checkOutTime ? fmt12(s.checkOutTime) : "Active"} · ${s.totalDistanceKm} km`}
                  selected={panelMode === "history_detail" && selectedSess?.id === s.id}
                  onClick={() => { setSelectedSess(s); setSelectedLoc(null); setPanelMode("history_detail"); }}
                />
              ))
            )}
          </div>
        )}

        {/* Bottom: last updated */}
        <div className="px-4 py-2 border-t bg-white text-xs text-gray-400 text-center">
          Updated {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · auto-refreshes every 30s
        </div>
      </div>

      {/* ── RIGHT PANEL — Detail ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {panelMode === "empty" && (
          <div className="flex-1 flex items-center justify-center text-gray-300">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-400">Select a staff member to view details</p>
            </div>
          </div>
        )}

        {panelMode === "live_detail" && selectedLoc && (
          <LiveDetail key={selectedLoc.sessionId} loc={selectedLoc} />
        )}

        {panelMode === "history_detail" && selectedSess && (
          <HistoryDetail key={selectedSess.id} session={selectedSess} />
        )}

        {panelMode === "reinstate" && (
          <ReinstateApprovals onDone={() => { doRefresh(); setPanelMode("empty"); }} />
        )}
      </div>
    </div>
  );
}

export default LiveLocationDashboard;
