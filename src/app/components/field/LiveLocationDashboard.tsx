/**
 * LiveLocationDashboard — PagarBook-style field tracker
 * Left: staff ledger | Right: journey timeline + GPS route map
 */

import { useState, useEffect, useMemo } from "react";
import {
  MapPin, Navigation, Clock, Footprints, AlertTriangle,
  RefreshCw, CheckCircle2, XCircle, ChevronRight,
  IndianRupee, Users, Wifi, WifiOff, Calendar,
  TrendingUp, Coffee, Car,
} from "lucide-react";
import { toast } from "sonner";
import {
  fieldTrackingService,
  type LiveLocation,
  type GeoPoint,
  type FieldSession,
} from "../../services/fieldTrackingService";
import { travelReimbursementService } from "../../services/travelReimbursementService";

// ── Surat named location lookup ───────────────────────────────────────────────
const SURAT_ZONES: Array<{ name: string; lat: number; lng: number; radius: number }> = [
  { name: "Head Office, Ring Road",   lat: 21.1702, lng: 72.8311, radius: 0.4 },
  { name: "Adajan Market",            lat: 21.2003, lng: 72.8038, radius: 0.4 },
  { name: "Adajan Patia",             lat: 21.2089, lng: 72.7982, radius: 0.4 },
  { name: "Pal Township",             lat: 21.2058, lng: 72.7871, radius: 0.5 },
  { name: "Vesu Commercial Zone",     lat: 21.1465, lng: 72.7973, radius: 0.5 },
  { name: "Althan",                   lat: 21.1537, lng: 72.8456, radius: 0.5 },
  { name: "Udhna Gate",               lat: 21.1812, lng: 72.8635, radius: 0.4 },
  { name: "Katargam",                 lat: 21.2294, lng: 72.8320, radius: 0.5 },
  { name: "Varachha Road",            lat: 21.2119, lng: 72.8766, radius: 0.5 },
  { name: "Dumas Road",               lat: 21.1102, lng: 72.8388, radius: 0.4 },
  { name: "Citylight Colony",         lat: 21.1583, lng: 72.7865, radius: 0.4 },
  { name: "Athwalines",               lat: 21.1875, lng: 72.8317, radius: 0.4 },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, toRad = (x: number) => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function locationName(lat: number, lng: number): string {
  for (const z of SURAT_ZONES) {
    if (haversineKm(lat, lng, z.lat, z.lng) <= z.radius) return z.name;
  }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt12 = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const durMins = (from: string, to?: string) =>
  Math.round((new Date(to ?? new Date().toISOString()).getTime() - new Date(from).getTime()) / 60000);

const durStr = (mins: number) => {
  const h = Math.floor(Math.abs(mins) / 60), m = Math.abs(mins) % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const kmBetween = (a: GeoPoint, b: GeoPoint) =>
  Math.round(haversineKm(a.lat, a.lng, b.lat, b.lng) * 100) / 100;

const ROLE_COLOR: Record<string, string> = {
  "Sales Head":    "bg-purple-100 text-purple-800",
  "Sales Manager": "bg-blue-100 text-blue-800",
  "Supervisor":    "bg-amber-100 text-amber-800",
};

const staleMin = (iso: string) => Math.round((Date.now() - new Date(iso).getTime()) / 60000);

// ── Journey event detection ───────────────────────────────────────────────────
interface JourneyEvent {
  type:           "checkin" | "drive" | "stop" | "checkout";
  startIdx:       number;
  endIdx:         number;
  startTime:      string;
  endTime?:       string;
  durationMins:   number;
  distanceKm?:    number;
  location?:      string;
  lat:            number;
  lng:            number;
  transportMode?: "walk" | "auto" | "brts" | "bike" | "car";
  avgSpeedKmh?:   number;
}

function inferMode(speedKmh: number): "walk" | "auto" | "brts" | "bike" | "car" {
  if (speedKmh < 5)  return "walk";
  if (speedKmh < 15) return "auto";
  if (speedKmh < 25) return "brts";
  if (speedKmh < 45) return "bike";
  return "car";
}

const MODE_LABEL: Record<string, string> = {
  walk: "Walking",
  auto: "Auto Rickshaw",
  brts: "BRTS / Bus",
  bike: "Two-Wheeler",
  car:  "Car",
};

const MODE_ICON: Record<string, string> = {
  walk: "🚶", auto: "🛺", brts: "🚌", bike: "🏍️", car: "🚗",
};

const MODE_COLOR: Record<string, string> = {
  walk: "text-green-700 bg-green-50 border-green-200",
  auto: "text-yellow-700 bg-yellow-50 border-yellow-200",
  brts: "text-blue-700 bg-blue-50 border-blue-200",
  bike: "text-orange-700 bg-orange-50 border-orange-200",
  car:  "text-purple-700 bg-purple-50 border-purple-200",
};

function buildJourney(session: FieldSession): JourneyEvent[] {
  const trail = session.trail;
  if (!trail.length) return [];

  const events: JourneyEvent[] = [];

  // Check-in event
  events.push({
    type: "checkin",
    startIdx: 0, endIdx: 0,
    startTime: session.checkInTime,
    durationMins: 0,
    location: locationName(trail[0].lat, trail[0].lng),
    lat: trail[0].lat, lng: trail[0].lng,
  });

  if (trail.length < 2) {
    if (session.checkOutTime) {
      events.push({
        type: "checkout", startIdx: 0, endIdx: 0,
        startTime: session.checkOutTime, durationMins: 0,
        location: locationName(trail[0].lat, trail[0].lng),
        lat: trail[0].lat, lng: trail[0].lng,
      });
    }
    return events;
  }

  // Segment trail into drives and stops
  // Stop = moved < 0.05 km over 10+ consecutive minutes
  const STOP_DIST_KM = 0.05;
  const STOP_MIN_SECS = 600; // 10 minutes

  let i = 1;
  let segStart = 0;

  while (i < trail.length) {
    const distFromSeg = kmBetween(trail[segStart], trail[i]);
    const elapsed = (new Date(trail[i].ts).getTime() - new Date(trail[segStart].ts).getTime()) / 1000;

    if (distFromSeg < STOP_DIST_KM && elapsed >= STOP_MIN_SECS) {
      // Detect a stop — first find its end
      let stopEnd = i;
      while (stopEnd < trail.length - 1 &&
             kmBetween(trail[segStart], trail[stopEnd + 1]) < STOP_DIST_KM) {
        stopEnd++;
      }

      // Drive from segStart to segEnd (index before the stop)
      const driveEndIdx = Math.max(segStart, i - 1);
      if (driveEndIdx > segStart) {
        const driveDist = (() => {
          let d = 0;
          for (let x = segStart + 1; x <= driveEndIdx; x++) d += kmBetween(trail[x-1], trail[x]);
          return Math.round(d * 100) / 100;
        })();
        events.push({
          type: "drive",
          startIdx: segStart, endIdx: driveEndIdx,
          startTime: trail[segStart].ts, endTime: trail[driveEndIdx].ts,
          durationMins: Math.round(
            (new Date(trail[driveEndIdx].ts).getTime() - new Date(trail[segStart].ts).getTime()) / 60000
          ),
          distanceKm: driveDist,
          location: locationName(trail[driveEndIdx].lat, trail[driveEndIdx].lng),
          lat: trail[driveEndIdx].lat, lng: trail[driveEndIdx].lng,
          avgSpeedKmh: (() => {
            const mins = Math.round((new Date(trail[driveEndIdx].ts).getTime() - new Date(trail[segStart].ts).getTime()) / 60000);
            return mins > 0 ? Math.round(driveDist / (mins / 60)) : 0;
          })(),
          transportMode: (() => {
            const mins = Math.round((new Date(trail[driveEndIdx].ts).getTime() - new Date(trail[segStart].ts).getTime()) / 60000);
            const spd = mins > 0 ? driveDist / (mins / 60) : 0;
            return inferMode(spd);
          })(),
        });
      }

      // Stop event
      events.push({
        type: "stop",
        startIdx: i, endIdx: stopEnd,
        startTime: trail[i].ts, endTime: trail[stopEnd].ts,
        durationMins: Math.round(
          (new Date(trail[stopEnd].ts).getTime() - new Date(trail[i].ts).getTime()) / 60000
        ),
        location: locationName(trail[i].lat, trail[i].lng),
        lat: trail[i].lat, lng: trail[i].lng,
      });

      segStart = stopEnd;
      i = stopEnd + 1;
    } else {
      i++;
    }
  }

  // Final drive if any trail points remain after last stop
  if (segStart < trail.length - 1) {
    const driveDist = (() => {
      let d = 0;
      for (let x = segStart + 1; x < trail.length; x++) d += kmBetween(trail[x-1], trail[x]);
      return Math.round(d * 100) / 100;
    })();
    if (driveDist > 0.01) {
      const _fdMins = Math.round((new Date(trail[trail.length-1].ts).getTime() - new Date(trail[segStart].ts).getTime()) / 60000);
      const _fdSpd = _fdMins > 0 ? driveDist / (_fdMins/60) : 0;
      events.push({
        type: "drive",
        startIdx: segStart, endIdx: trail.length - 1,
        startTime: trail[segStart].ts, endTime: trail[trail.length - 1].ts,
        durationMins: _fdMins,
        distanceKm: driveDist,
        location: locationName(trail[trail.length - 1].lat, trail[trail.length - 1].lng),
        lat: trail[trail.length - 1].lat, lng: trail[trail.length - 1].lng,
        avgSpeedKmh: Math.round(_fdSpd),
        transportMode: inferMode(_fdSpd),
      });
    }
  }

  // Check-out event
  if (session.checkOutTime) {
    const last = trail[trail.length - 1];
    events.push({
      type: "checkout",
      startIdx: trail.length - 1, endIdx: trail.length - 1,
      startTime: session.checkOutTime, durationMins: 0,
      location: locationName(last.lat, last.lng),
      lat: last.lat, lng: last.lng,
    });
  }

  return events;
}

// ── Route SVG Map ──────────────────────────────────────────────────────────────
function RouteMap({ trail, events }: { trail: GeoPoint[]; events: JourneyEvent[] }) {
  if (trail.length < 2)
    return (
      <div className="h-36 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed">
        GPS trail builds after movement begins
      </div>
    );

  const lats = trail.map(p => p.lat), lngs = trail.map(p => p.lng);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const [W, H, P] = [480, 220, 20];

  const tx = (lng: number) => P + ((lng - minLng) / ((maxLng - minLng) || 0.001)) * (W - P * 2);
  const ty = (lat: number) => H - P - ((lat - minLat) / ((maxLat - minLat) || 0.001)) * (H - P * 2);

  // Build segments colored by type
  const stops = events.filter(e => e.type === "stop");
  const stopIndices = new Set(stops.flatMap(s =>
    Array.from({ length: s.endIdx - s.startIdx + 1 }, (_, i) => s.startIdx + i)
  ));

  const pathD = trail.map((p, i) => `${i === 0 ? "M" : "L"}${tx(p.lng).toFixed(1)},${ty(p.lat).toFixed(1)}`).join(" ");

  return (
    <div className="relative rounded-xl overflow-hidden border bg-slate-50">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Background grid */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={`h${f}`} x1={P} y1={ty(minLat + (maxLat - minLat) * f)} x2={W - P} y2={ty(minLat + (maxLat - minLat) * f)} stroke="#e5e7eb" strokeWidth="0.5" />
        ))}

        {/* Main route path */}
        <path d={pathD} fill="none" stroke="#94a3b8" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" opacity="0.4" strokeDasharray="4 2" />

        {/* Colour segments by transport mode */}
        {trail.slice(1).map((p, i) => {
          const prev = trail[i];
          const isStop = stopIndices.has(i + 1);
          const driveEvent = events.find(e =>
            e.type === "drive" && i + 1 >= e.startIdx && i + 1 <= e.endIdx
          );
          const segColor =
            isStop ? "#f59e0b" :
            driveEvent?.transportMode === "walk" ? "#22c55e" :
            driveEvent?.transportMode === "auto" ? "#eab308" :
            driveEvent?.transportMode === "brts" ? "#3b82f6" :
            driveEvent?.transportMode === "bike" ? "#f97316" :
            driveEvent?.transportMode === "car"  ? "#8b5cf6" :
            "#6366f1";
          return (
            <line key={i}
              x1={tx(prev.lng).toFixed(1)} y1={ty(prev.lat).toFixed(1)}
              x2={tx(p.lng).toFixed(1)}   y2={ty(p.lat).toFixed(1)}
              stroke={segColor}
              strokeWidth="2.5" strokeLinecap="round" opacity="0.9"
            />
          );
        })}

        {/* Stop markers */}
        {stops.map((s, idx) => (
          <g key={`stop-${idx}`}>
            <circle cx={tx(s.lng).toFixed(1)} cy={ty(s.lat).toFixed(1)} r="7"
              fill="white" stroke="#f59e0b" strokeWidth="2" />
            <text x={tx(s.lng)} y={ty(s.lat) + 4} textAnchor="middle"
              fontSize="7" fontWeight="700" fill="#d97706">{idx + 1}</text>
          </g>
        ))}

        {/* Start dot */}
        <circle cx={tx(trail[0].lng).toFixed(1)} cy={ty(trail[0].lat).toFixed(1)}
          r="6" fill="#22c55e" />
        <text x={tx(trail[0].lng)} y={ty(trail[0].lat) + 4}
          textAnchor="middle" fontSize="7" fontWeight="800" fill="white">S</text>

        {/* End dot */}
        <circle cx={tx(trail[trail.length - 1].lng).toFixed(1)} cy={ty(trail[trail.length - 1].lat).toFixed(1)}
          r="6" fill="#ef4444" />
        <text x={tx(trail[trail.length - 1].lng)} y={ty(trail[trail.length - 1].lat) + 4}
          textAnchor="middle" fontSize="7" fontWeight="800" fill="white">E</text>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-3 flex items-center gap-2 flex-wrap text-[9px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-4 h-1 bg-green-500 rounded inline-block" />Walk</span>
        <span className="flex items-center gap-1"><span className="w-4 h-1 bg-yellow-400 rounded inline-block" />Auto</span>
        <span className="flex items-center gap-1"><span className="w-4 h-1 bg-blue-500 rounded inline-block" />BRTS</span>
        <span className="flex items-center gap-1"><span className="w-4 h-1 bg-orange-500 rounded inline-block" />Bike</span>
        <span className="flex items-center gap-1"><span className="w-4 h-1 bg-purple-500 rounded inline-block" />Car</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Start</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />End</span>
      </div>
    </div>
  );
}

// ── Timeline event row ─────────────────────────────────────────────────────────
function TimelineRow({ event, index, isLast }: { event: JourneyEvent; index: number; isLast: boolean }) {
  const cfg = {
    checkin:  { icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, dot: "bg-green-500", bg: "bg-green-50 border-green-200" },
    drive:    { icon: <Car className="w-4 h-4 text-indigo-600" />,         dot: "bg-indigo-500", bg: "bg-indigo-50 border-indigo-200" },
    stop:     { icon: <Coffee className="w-4 h-4 text-amber-600" />,       dot: "bg-amber-400", bg: "bg-amber-50 border-amber-200" },
    checkout: { icon: <XCircle className="w-4 h-4 text-red-500" />,        dot: "bg-red-400",   bg: "bg-red-50 border-red-200" },
  }[event.type];

  return (
    <div className="flex gap-3">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${cfg.dot}`} />
        {!isLast && <div className="w-0.5 bg-gray-200 flex-1 my-1" />}
      </div>

      {/* Event card */}
      <div className={`flex-1 mb-2 rounded-xl border px-3 py-2.5 ${cfg.bg}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {cfg.icon}
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {event.type === "checkin"  ? "Checked In" :
                 event.type === "checkout" ? "Checked Out" :
                 event.type === "drive"    ? `Drive to ${event.location}` :
                 `Halt — ${event.location}`}
              </p>
              {event.location && (event.type === "checkin" || event.type === "checkout") && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />{event.location}
                </p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-semibold text-gray-700">{fmt12(event.startTime)}</p>
            {event.endTime && event.type !== "checkout" && (
              <p className="text-xs text-gray-400">{fmt12(event.endTime)}</p>
            )}
          </div>
        </div>

        {/* Drive stats */}
        {event.type === "drive" && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {event.transportMode && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${MODE_COLOR[event.transportMode]}`}>
                {MODE_ICON[event.transportMode]} {MODE_LABEL[event.transportMode]}
              </span>
            )}
            <span className="text-xs text-indigo-600 flex items-center gap-1">
              <Car className="w-3 h-3" />{event.distanceKm} km
            </span>
            <span className="text-xs text-indigo-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />{durStr(event.durationMins)}
            </span>
            {event.avgSpeedKmh !== undefined && event.avgSpeedKmh > 0 && (
              <span className="text-xs text-indigo-400">~{event.avgSpeedKmh} km/h avg</span>
            )}
          </div>
        )}

        {/* Halt duration */}
        {event.type === "stop" && (
          <div className="flex gap-3 mt-1.5 text-xs text-amber-700">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{durStr(event.durationMins)} halt</span>
            <a href={`https://www.google.com/maps?q=${event.lat},${event.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="text-blue-600 flex items-center gap-1 hover:underline">
              <MapPin className="w-3 h-3" />Open in Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Journey timeline panel ────────────────────────────────────────────────────
function JourneyPanel({ session }: { session: FieldSession }) {
  const events = useMemo(() => buildJourney(session), [session.id]);
  const travel = travelReimbursementService.getTrips().find(t => t.fieldSessionId === session.id);
  const totalMins = session.checkOutTime ? durMins(session.checkInTime, session.checkOutTime) : durMins(session.checkInTime);
  const stops = events.filter(e => e.type === "stop");
  const drives = events.filter(e => e.type === "drive");
  const drivingMins = drives.reduce((s, d) => s + d.durationMins, 0);
  const haltMins = stops.reduce((s, st) => s + st.durationMins, 0);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Day summary strip */}
      <div className="px-4 pt-4 pb-3 border-b bg-white sticky top-0 z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-bold text-gray-900">{session.employeeName}</h2>
            <p className="text-xs text-gray-500">{fmtDate(session.date)} · {session.role}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[session.role] ?? "bg-gray-100 text-gray-700"}`}>
            {session.role}
          </span>
        </div>

        {/* Day Summary card — PagarBook style */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-400">Total Distance</p>
            <p className="font-bold text-gray-900 text-base">{session.totalDistanceKm} km</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2">
            <p className="text-amber-600">Halts</p>
            <p className="font-bold text-amber-900 text-base">{stops.length} · {durStr(haltMins)}</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-2">
            <p className="text-indigo-600">Drives</p>
            <p className="font-bold text-indigo-900 text-base">{drives.length} · {durStr(drivingMins)}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Route map */}
        <RouteMap trail={session.trail} events={events} />

        {/* Travel claim */}
        {travel ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-900">GPS Travel Claim Auto-Submitted</p>
                <p className="text-xs text-green-700">
                  {travel.gpsDistanceKm} km · ₹{travel.ratePerKm}/km · {travel.gpsTrailPoints} pts
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-700">₹{travel.netPayableAmount?.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{travel.status}</p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 border border-dashed rounded-xl p-2.5 flex items-center gap-2">
            <IndianRupee className="w-3.5 h-3.5" />
            {session.checkOutTime
              ? "No travel claim — employee not enrolled for reimbursement"
              : "Travel claim will auto-submit at checkout"}
          </div>
        )}

        {/* Timeline */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Journey Timeline</p>
          {events.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No GPS data recorded yet</p>
          ) : (
            events.map((ev, i) => (
              <TimelineRow key={`${ev.type}-${i}`} event={ev} index={i} isLast={i === events.length - 1} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

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
      className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
        selected ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
      }`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${ROLE_COLOR[role] ?? "bg-gray-100 text-gray-700"}`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
        </div>
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
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl border shadow-sm overflow-hidden">

      {/* ── LEFT: Staff list ────────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col border-r bg-gray-50">

        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-blue-600" />Field Tracker
            </h1>
            <button onClick={doRefresh} className="text-gray-400 hover:text-blue-600 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
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
      <div className="flex-1 flex flex-col min-w-0 bg-white">
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
