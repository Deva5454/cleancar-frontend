/**
 * FieldAttendanceAdmin.tsx
 *
 * Sales Head / HR / Super Admin view:
 *   - All field sessions for the team
 *   - Pending reinstatement requests (approve / reject)
 *   - Full GPS trail viewer per session
 *   - Selfie audit (check-in + check-out photos)
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  MapPin, Camera, CheckCircle2, XCircle, AlertTriangle,
  Clock, Footprints, Navigation, ChevronDown, ChevronRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  fieldTrackingService,
  type FieldSession,
} from "../../services/fieldTrackingService";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(from: string, to?: string | null) {
  const ms = (to ? new Date(to) : new Date()).getTime() - new Date(from).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Trail Preview (reused from FieldCheckIn) ──────────────────────────────────

function TrailPreview({ trail }: { trail: FieldSession["trail"] }) {
  if (trail.length < 2) return <p className="text-xs text-gray-400 text-center py-4">Trail unavailable</p>;
  const lats = trail.map(p => p.lat), lngs = trail.map(p => p.lng);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const [W, H, PAD] = [300, 160, 20];
  const tx = (lng: number) => PAD + ((lng - minLng) / (maxLng - minLng || 1)) * (W - 2 * PAD);
  const ty = (lat: number) => H - PAD - ((lat - minLat) / (maxLat - minLat || 1)) * (H - 2 * PAD);
  const d = trail.map((p, i) => `${i === 0 ? "M" : "L"}${tx(p.lng).toFixed(1)},${ty(p.lat).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full border rounded-lg bg-gray-50">
      <path d={d} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={tx(trail[0].lng)} cy={ty(trail[0].lat)} r="5" fill="#22c55e" />
      <circle cx={tx(trail[trail.length-1].lng)} cy={ty(trail[trail.length-1].lat)} r="5" fill="#ef4444" />
      <text x="8" y="14" fontSize="9" fill="#22c55e">Start</text>
      <text x={W - 28} y="14" fontSize="9" fill="#ef4444">End</text>
    </svg>
  );
}

// ── Session Row ───────────────────────────────────────────────────────────────

function SessionRow({ session, reviewerName }: { session: FieldSession; reviewerName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const statusColor = session.checkOutReason === "location_revoked"
    ? "bg-orange-100 text-orange-800"
    : session.checkOutTime
    ? "bg-gray-100 text-gray-700"
    : "bg-green-100 text-green-800";

  const statusLabel = !session.checkOutTime
    ? "Active"
    : session.checkOutReason === "location_revoked"
    ? "Auto Checked-Out"
    : "Complete";

  const approve = () => {
    setProcessing(true);
    fieldTrackingService.approveReinstateRequest(session.id, reviewerName);
    toast.success(`Reinstatement approved for ${session.employeeName}`);
    setProcessing(false);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          {session.checkInSelfieBase64 ? (
            <img src={session.checkInSelfieBase64} alt="selfie"
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Camera className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{session.employeeName}</p>
            <p className="text-xs text-gray-500">
              {session.date} · {formatTime(session.checkInTime)}
              {session.checkOutTime && ` → ${formatTime(session.checkOutTime)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-gray-500 hidden sm:block">
            <p>{session.totalDistanceKm} km · {session.trail.length} pts</p>
            {session.checkOutTime && <p>{formatDuration(session.checkInTime, session.checkOutTime)}</p>}
          </div>
          <Badge className={statusColor}>{statusLabel}</Badge>
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t p-4 bg-gray-50 space-y-4">
          {/* Selfie audit */}
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Check-In Selfie</p>
              {session.checkInSelfieBase64
                ? <img src={session.checkInSelfieBase64} alt="check-in" className="w-20 h-20 rounded-lg object-cover border" />
                : <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center"><Camera className="w-6 h-6 text-gray-400" /></div>
              }
              <p className="text-xs text-gray-400 mt-1">{formatTime(session.checkInTime)}</p>
            </div>
            {session.checkOutSelfieBase64 && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Check-Out Selfie</p>
                <img src={session.checkOutSelfieBase64} alt="check-out" className="w-20 h-20 rounded-lg object-cover border" />
                <p className="text-xs text-gray-400 mt-1">{session.checkOutTime ? formatTime(session.checkOutTime) : ""}</p>
              </div>
            )}
          </div>

          {/* Location info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { label: "Check-In GPS", val: `${session.checkInLocation.lat.toFixed(4)}, ${session.checkInLocation.lng.toFixed(4)}` },
              { label: "GPS Points",   val: session.trail.length },
              { label: "Distance",     val: `${session.totalDistanceKm} km` },
              { label: "Duration",     val: formatDuration(session.checkInTime, session.checkOutTime) },
            ].map(m => (
              <div key={m.label} className="bg-white p-2 rounded border text-center">
                <p className="text-gray-400">{m.label}</p>
                <p className="font-medium text-gray-800">{m.val}</p>
              </div>
            ))}
          </div>

          {/* Trail */}
          <TrailPreview trail={session.trail} />

          {/* Reinstatement review */}
          {session.reinstateRequest && (
            <div className={`p-3 rounded-lg border text-sm space-y-2 ${
              session.reinstateRequest.status === "Pending"
                ? "bg-orange-50 border-orange-200"
                : session.reinstateRequest.status === "Approved"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center justify-between">
                <p className="font-medium">Reinstatement Request</p>
                <Badge className={
                  session.reinstateRequest.status === "Pending" ? "bg-orange-500" :
                  session.reinstateRequest.status === "Approved" ? "bg-green-600" : "bg-red-600"
                }>{session.reinstateRequest.status}</Badge>
              </div>
              <p className="text-gray-700">"{session.reinstateRequest.reason}"</p>
              {session.reinstateRequest.status === "Pending" && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1"
                    onClick={approve} disabled={processing}>
                    <CheckCircle2 className="w-3 h-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-400 text-red-700 hover:bg-red-50 gap-1">
                    <XCircle className="w-3 h-3" /> Reject
                  </Button>
                </div>
              )}
              {session.reinstateRequest.reviewedBy && (
                <p className="text-xs text-gray-400">
                  Reviewed by {session.reinstateRequest.reviewedBy} · {session.reinstateRequest.reviewedAt?.slice(0,10)}
                </p>
              )}
            </div>
          )}

          {/* Auto-checkout but no reinstate request yet */}
          {session.checkOutReason === "location_revoked" && !session.reinstateRequest && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Awaiting employee reinstatement request submission.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function FieldAttendanceAdmin() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const sessions = fieldTrackingService.getSessionsForDate(date);
  const pending = fieldTrackingService.getAllPendingReinstate();

  return (
    <div className="space-y-5">
      {/* Pending reinstatement alert */}
      {pending.length > 0 && (
        <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-orange-900">{pending.length} Reinstatement Request{pending.length > 1 ? "s" : ""} Pending</p>
            <p className="text-sm text-orange-700 mt-0.5">
              {pending.map(s => s.employeeName).join(", ")} — review below or select their session date.
            </p>
          </div>
        </div>
      )}

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Field Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        />
        <span className="text-sm text-gray-500">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Session list */}
      {sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions
            .sort((a, b) => b.checkInTime.localeCompare(a.checkInTime))
            .map(s => (
              <SessionRow key={s.id} session={s} reviewerName="Sales Head" />
            ))}
        </div>
      ) : (
        <Card className="p-10 text-center text-gray-400">
          <Navigation className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>No field sessions for {date}</p>
          <p className="text-sm mt-1">Check-ins will appear here once Sales Head or Sales Manager checks in.</p>
        </Card>
      )}
    </div>
  );
}
