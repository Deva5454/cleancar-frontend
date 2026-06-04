/**
 * LiveLocationDashboard.tsx
 *
 * Super Admin / Admin view — see live GPS location of every checked-in
 * field employee (Sales Head, Sales Manager, Supervisor) in real time.
 *
 * Updates every 30 seconds via polling fieldTrackingService.getLiveLocations().
 * Shows:
 *   - Who is currently checked in and where
 *   - How long they've been in the field
 *   - Distance covered today
 *   - SVG trail path per employee (expandable)
 *   - Any pending reinstatement requests
 *   - Historical sessions for a date + employee
 */

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  MapPin, Navigation, Clock, Footprints, AlertTriangle,
  RefreshCw, ChevronDown, ChevronRight, Users, CheckCircle2,
  XCircle, Camera,
} from "lucide-react";
import { toast } from "sonner";
import {
  fieldTrackingService,
  type LiveLocation,
  type FieldSession,
} from "../../services/fieldTrackingService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function minsAgo(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / 60000);
}

function rolePill(role: string) {
  const cfg: Record<string, string> = {
    "Sales Head":    "bg-fuchsia-100 text-fuchsia-800",
    "Sales Manager": "bg-cyan-100 text-cyan-800",
    "Supervisor":    "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg[role] ?? "bg-gray-100 text-gray-700"}`}>
      {role}
    </span>
  );
}

// ── Mini Trail SVG ────────────────────────────────────────────────────────────

function MiniTrail({ trail }: { trail: FieldSession["trail"] }) {
  if (trail.length < 2) {
    return <p className="text-xs text-gray-400 text-center py-3">Trail starts after first movement</p>;
  }
  const lats = trail.map(p => p.lat), lngs = trail.map(p => p.lng);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const [W, H, PAD] = [320, 150, 18];
  const tx = (lng: number) => PAD + ((lng - minLng) / (maxLng - minLng || 1)) * (W - 2 * PAD);
  const ty = (lat: number) => H - PAD - ((lat - minLat) / (maxLat - minLat || 1)) * (H - 2 * PAD);
  const d = trail.map((p, i) => `${i === 0 ? "M" : "L"}${tx(p.lng).toFixed(1)},${ty(p.lat).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full border rounded-lg bg-gray-50">
      <path d={d} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {trail.length > 2 && trail.slice(1, -1).map((p, i) => (
        <circle key={i} cx={tx(p.lng)} cy={ty(p.lat)} r="2" fill="#a5b4fc" />
      ))}
      <circle cx={tx(trail[0].lng)} cy={ty(trail[0].lat)} r="5" fill="#22c55e" />
      <circle cx={tx(trail[trail.length - 1].lng)} cy={ty(trail[trail.length - 1].lat)} r="5" fill="#ef4444" />
      <text x="8" y="14" fontSize="9" fill="#22c55e" fontWeight="600">Start</text>
      <text x={W - 28} y="14" fontSize="9" fill="#ef4444" fontWeight="600">Now</text>
    </svg>
  );
}

// ── Live Employee Card ────────────────────────────────────────────────────────

function LiveCard({ loc }: { loc: LiveLocation }) {
  const [expanded, setExpanded] = useState(false);
  const [session, setSession] = useState<FieldSession | null>(null);
  const staleMinutes = minsAgo(loc.lastUpdated);
  const isStale = staleMinutes > 5;

  const loadSession = () => {
    if (expanded) { setExpanded(false); return; }
    const sessions = fieldTrackingService.getSessionsForEmployee(loc.employeeId, 1);
    const active = sessions.find(s => s.id === loc.sessionId);
    setSession(active ?? null);
    setExpanded(true);
  };

  return (
    <Card className={`overflow-hidden border-2 ${isStale ? "border-amber-300" : "border-green-300"}`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={loadSession}
      >
        <div className="flex items-center gap-3">
          {/* Pulsing live dot */}
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isStale ? "bg-amber-100" : "bg-green-100"}`}>
              <MapPin className={`w-5 h-5 ${isStale ? "text-amber-600" : "text-green-600"}`} />
            </div>
            {!isStale && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{loc.employeeName}</p>
              {rolePill(loc.role)}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)} · ±{loc.accuracy}m
            </p>
          </div>
        </div>
        <div className="text-right flex items-center gap-3">
          <div className="hidden sm:block text-xs text-gray-500">
            <p className="font-medium">{formatDuration(loc.elapsedMinutes)} in field</p>
            <p>{loc.totalDistanceKm} km covered</p>
            <p className={isStale ? "text-amber-600 font-medium" : "text-gray-400"}>
              Updated {staleMinutes}m ago
            </p>
          </div>
          {expanded
            ? <ChevronDown className="w-4 h-4 text-gray-400" />
            : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && session && (
        <div className="border-t p-4 bg-gray-50 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 text-xs text-center">
            {[
              { icon: <Clock className="w-3 h-3" />,      label: "Checked In",  val: formatTime(session.checkInTime) },
              { icon: <Footprints className="w-3 h-3" />, label: "Distance",    val: `${session.totalDistanceKm} km` },
              { icon: <Navigation className="w-3 h-3" />, label: "GPS Points",  val: session.trail.length },
              { icon: <MapPin className="w-3 h-3" />,     label: "Accuracy",    val: `±${loc.accuracy}m` },
            ].map(m => (
              <div key={m.label} className="bg-white rounded border p-2">
                <div className="flex justify-center text-gray-500 mb-1">{m.icon}</div>
                <p className="text-gray-400">{m.label}</p>
                <p className="font-semibold text-gray-800">{m.val}</p>
              </div>
            ))}
          </div>

          {/* Trail */}
          <MiniTrail trail={session.trail} />

          {/* Check-in selfie */}
          {session.checkInSelfieBase64 && (
            <div className="flex items-center gap-3">
              <img
                src={session.checkInSelfieBase64}
                alt="Check-in selfie"
                className="w-14 h-14 rounded-lg object-cover border-2 border-gray-200"
              />
              <div className="text-xs text-gray-500">
                <p className="font-medium">Check-in selfie</p>
                <p>{formatTime(session.checkInTime)}</p>
              </div>
            </div>
          )}

          {/* Google Maps deep link */}
          <a
            href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
          >
            <MapPin className="w-3.5 h-3.5" />
            Open in Google Maps
          </a>
        </div>
      )}
    </Card>
  );
}

// ── Pending Reinstatements Panel ───────────────────────────────────────────────

function PendingReinstatePanel({ onApproved }: { onApproved: () => void }) {
  const pending = fieldTrackingService.getAllPendingReinstate();
  if (!pending.length) return null;

  return (
    <Card className="p-4 border-2 border-orange-300 bg-orange-50 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        <h3 className="font-semibold text-orange-900">
          {pending.length} Reinstatement Request{pending.length > 1 ? "s" : ""} Pending
        </h3>
      </div>
      {pending.map(s => (
        <div key={s.id} className="bg-white rounded-lg p-3 border border-orange-200 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium text-sm">{s.employeeName}</p>
              <p className="text-xs text-gray-500">{s.date} · Auto-checked-out at {formatTime(s.checkOutTime!)}</p>
            </div>
            {rolePill(s.role)}
          </div>
          <p className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1 italic">
            "{s.reinstateRequest?.reason}"
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 gap-1 text-xs"
              onClick={() => {
                fieldTrackingService.approveReinstateRequest(s.id, "Super Admin");
                toast.success(`Reinstated ${s.employeeName}'s attendance`);
                onApproved();
              }}
            >
              <CheckCircle2 className="w-3 h-3" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="border-red-400 text-red-700 gap-1 text-xs">
              <XCircle className="w-3 h-3" /> Reject
            </Button>
          </div>
        </div>
      ))}
    </Card>
  );
}

// ── Historical Session Browser ─────────────────────────────────────────────────

function HistoricalSessions() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const sessions = fieldTrackingService.getSessionsForDate(date);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        />
        <span className="text-sm text-gray-500">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {sessions.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          No field sessions for {date}
        </p>
      )}

      {sessions.map(s => (
        <Card key={s.id} className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {s.checkInSelfieBase64 && (
                <img src={s.checkInSelfieBase64} alt="selfie"
                  className="w-9 h-9 rounded-full object-cover border" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{s.employeeName}</p>
                  {rolePill(s.role)}
                </div>
                <p className="text-xs text-gray-500">
                  {formatTime(s.checkInTime)}
                  {s.checkOutTime && ` → ${formatTime(s.checkOutTime)}`}
                </p>
              </div>
            </div>
            <div className="text-xs text-right text-gray-500">
              <p>{s.totalDistanceKm} km · {s.trail.length} pts</p>
              {s.checkOutReason === "location_revoked" && (
                <span className="text-orange-600 font-medium">Auto checked-out</span>
              )}
              {s.reinstateRequest && (
                <span className={`ml-1 font-medium ${
                  s.reinstateRequest.status === "Approved" ? "text-green-600" :
                  s.reinstateRequest.status === "Rejected" ? "text-red-600" : "text-orange-600"
                }`}>· {s.reinstateRequest.status}</span>
              )}
            </div>
          </div>
          <MiniTrail trail={s.trail} />
        </Card>
      ))}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export function LiveLocationDashboard() {
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setLiveLocations(fieldTrackingService.getLiveLocations());
    setLastRefresh(new Date());
    setRefreshKey(k => k + 1);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkedInCount = liveLocations.length;
  const staleCount = liveLocations.filter(l => {
    return (Date.now() - new Date(l.lastUpdated).getTime()) > 5 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            Live Field Location
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Sales Head · Sales Manager · Supervisor ·
            Updated {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {checkedInCount > 0 && (
            <Badge className="bg-green-600">{checkedInCount} in field</Badge>
          )}
          {staleCount > 0 && (
            <Badge className="bg-amber-500">{staleCount} stale</Badge>
          )}
          <Button size="sm" variant="outline" className="gap-2" onClick={refresh}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2">
        {([
          { id: "live",    label: `Live (${checkedInCount})`, icon: <MapPin className="w-3.5 h-3.5" /> },
          { id: "history", label: "History",                   icon: <Clock className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <Button
            key={t.id}
            size="sm"
            variant={activeTab === t.id ? "default" : "outline"}
            className="gap-1.5"
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon}{t.label}
          </Button>
        ))}
      </div>

      {/* Pending reinstatements — always visible */}
      <PendingReinstatePanel onApproved={refresh} />

      {/* Live view */}
      {activeTab === "live" && (
        <div className="space-y-3">
          {liveLocations.length === 0 ? (
            <Card className="p-10 text-center text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No one is currently checked in</p>
              <p className="text-sm mt-1">
                Live location appears here when a Sales Head, Sales Manager,
                or Supervisor starts their field day.
              </p>
            </Card>
          ) : (
            liveLocations.map(loc => <LiveCard key={loc.sessionId} loc={loc} />)
          )}
        </div>
      )}

      {/* History view */}
      {activeTab === "history" && <HistoricalSessions />}
    </div>
  );
}
