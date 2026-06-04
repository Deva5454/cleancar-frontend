/**
 * FieldCheckIn.tsx
 *
 * Field attendance widget for Sales Manager and Sales Head.
 *
 * Rules implemented:
 *   1. Compulsory selfie + GPS at check-in AND check-out
 *   2. Check-in opens at 10:00 AM. Suggested checkout: 7:00 PM.
 *   3. Auto-checkout fires at 23:59 if user is still checked in
 *      → flagged as auto-checkout, highlighted in red, attendance reg required
 *   4. While checked in: full GPS trail (every 10 m or 2 min, whichever first)
 *   5. GPS unavailable (lift/basement/no network) → points queued offline,
 *      flushed automatically once network/signal returns
 *   6. If user turns off location from phone settings → PERMISSION_DENIED →
 *      auto check-out + reinstatement request required
 *   7. After checkout: VIEW ONLY — no data can be punched in the system
 *   8. Trail visible to Admin / Super Admin only (not the user)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Camera, MapPin, Clock, CheckCircle2, XCircle,
  AlertTriangle, Navigation, RefreshCw, Send,
  Footprints, Shield, Info, WifiOff, Eye, Lock,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import {
  fieldTrackingService,
  FIELD_HOURS,
  type FieldSession,
  type TrackingState,
} from "../../services/fieldTrackingService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(from: string, to?: string): string {
  const ms = (to ? new Date(to) : new Date()).getTime() - new Date(from).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function nowHour(): number { return new Date().getHours(); }
function nowMinute(): number { return new Date().getMinutes(); }

// ── Selfie Capturer ───────────────────────────────────────────────────────────

function SelfieCapturer({
  onCapture, onCancel, label,
}: {
  onCapture: (base64: string) => void;
  onCancel: () => void;
  label: string;
}) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then(s => {
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; }
        setReady(true);
      })
      .catch(() => setError("Camera access denied. Please allow camera access and try again."));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const retake = () => {
    setCaptured(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(s => {
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setReady(true);
      });
  };

  const takeSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth || 320; c.height = v.videoHeight || 240;
    c.getContext("2d")!.drawImage(v, 0, 0);
    const base64 = c.toDataURL("image/jpeg", 0.75);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCaptured(base64);
  };

  if (error) return (
    <div className="text-center p-6 space-y-3">
      <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
      <p className="text-sm text-red-700">{error}</p>
      <Button variant="outline" onClick={onCancel}>Back</Button>
    </div>
  );

  if (captured) return (
    <div className="space-y-4 text-center">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <img src={captured} alt="selfie"
        className="w-44 h-44 rounded-full object-cover border-4 border-green-400 mx-auto shadow" />
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={retake}><Camera className="w-4 h-4 mr-1" />Retake</Button>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => onCapture(captured)}>
          <CheckCircle2 className="w-4 h-4 mr-1" /> Use This
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <div className="relative mx-auto w-52 h-52 rounded-full overflow-hidden border-4 border-blue-400 bg-gray-900 shadow-lg">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={takeSelfie} disabled={!ready} className="gap-2">
          <Camera className="w-4 h-4" /> Take Selfie
        </Button>
      </div>
      <p className="text-xs text-gray-400">
        📍 GPS will be captured automatically with your selfie
      </p>
    </div>
  );
}

// ── Trail Map Preview (SVG path) ─────────────────────────────────────────────

function TrailPreview({ trail }: { trail: FieldSession["trail"] }) {
  if (trail.length < 2) return (
    <div className="flex items-center justify-center h-20 text-xs text-gray-400">
      <Navigation className="w-4 h-4 mr-1" /> Trail appears after first movement
    </div>
  );

  const lats = trail.map(p => p.lat), lngs = trail.map(p => p.lng);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const W = 300, H = 150, PAD = 24;

  const tx = (lng: number) => PAD + ((lng - minLng) / (maxLng - minLng || 0.0001)) * (W - 2 * PAD);
  const ty = (lat: number) => H - PAD - ((lat - minLat) / (maxLat - minLat || 0.0001)) * (H - 2 * PAD);

  const d = trail.map((p, i) => `${i === 0 ? "M" : "L"}${tx(p.lng).toFixed(1)},${ty(p.lat).toFixed(1)}`).join(" ");
  const first = trail[0], last = trail[trail.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full border rounded-lg bg-blue-50">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>
        <path d={d} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          markerMid="url(#arrowhead)" />
        <circle cx={tx(first.lng)} cy={ty(first.lat)} r="6" fill="#22c55e" />
        <circle cx={tx(last.lng)}  cy={ty(last.lat)}  r="6" fill="#ef4444" />
        <text x="10" y="14" fontSize="9" fill="#16a34a" fontWeight="bold">▲ Start</text>
        <text x={W - 38} y="14" fontSize="9" fill="#dc2626" fontWeight="bold">● Now</text>
      </svg>
      <p className="text-xs text-gray-400 mt-1 text-center">
        {trail.length} points · {trail[0]?.ts ? formatTime(trail[0].ts) : ""} → {last.ts ? formatTime(last.ts) : ""}
      </p>
    </div>
  );
}

// ── Attendance Regularisation Form ────────────────────────────────────────────

function AttendanceRegForm({ session, onDone }: { session: FieldSession; onDone: () => void }) {
  const [reason, setReason]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAutoMidnight = session.checkOutReason === "auto_23_59";
  const isRevoked      = session.checkOutReason === "location_revoked";

  const submit = () => {
    if (!reason.trim()) { toast.error("Please enter a reason for regularisation"); return; }
    setSubmitting(true);
    const result = fieldTrackingService.submitAttendanceReg(session.id, reason);
    if (result.ok) {
      toast.success("Attendance regularisation request submitted", {
        description: "Your Admin / Super Admin will review within 24 hours.",
      });
      onDone();
    } else {
      toast.error(result.error || "Submission failed");
    }
    setSubmitting(false);
  };

  return (
    <Card className="p-5 border-2 border-orange-300 bg-orange-50 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-orange-900">Attendance Regularisation Required</p>
          <p className="text-sm text-orange-700 mt-0.5">
            {isAutoMidnight
              ? `Your field attendance was auto-closed at 23:59 because you did not check out before midnight. Your check-out time is recorded as 23:59.`
              : isRevoked
              ? `Your attendance was auto-closed at ${formatTime(session.checkOutTime!)} because location access was turned off on your device.`
              : "Auto-checkout triggered."}
            {" "}Submit a regularisation request to correct your attendance record.
          </p>
        </div>
      </div>

      {/* View-only notice */}
      <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
        <Lock className="w-3.5 h-3.5 shrink-0" />
        <span><strong>View only mode.</strong> No activity can be logged until regularisation is approved.</span>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Reason for regularisation *</Label>
        <Textarea
          rows={3}
          placeholder={isAutoMidnight
            ? "e.g. Was travelling back from outstation visit and could not check out in time..."
            : "e.g. Phone battery saver turned off GPS automatically while at client site..."}
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="bg-white"
        />
        <p className="text-xs text-gray-400">Mention exact location and reason clearly. Admin will verify with GPS trail.</p>
      </div>

      <div className="flex gap-3">
        <Button onClick={submit} disabled={submitting} className="gap-2 bg-orange-600 hover:bg-orange-700">
          {submitting
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</>
            : <><Send className="w-4 h-4" /> Submit Request</>}
        </Button>
        <Button variant="ghost" onClick={onDone}>Dismiss</Button>
      </div>
    </Card>
  );
}

// ── View-Only Overlay ────────────────────────────────────────────────────────

function ViewOnlyBanner() {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-300 rounded-lg text-sm text-red-800 font-medium">
      <Eye className="w-4 h-4 shrink-0" />
      <span>
        <strong>View Only</strong> — You are checked out. No attendance data can be modified.
        Check in tomorrow to start a new field day.
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function FieldCheckIn() {
  const { currentUser, currentRole } = useRole();
  const [state, setState]     = useState<TrackingState>(() => fieldTrackingService.getState());
  const [uiStep, setUiStep]   = useState<"idle" | "selfie-in" | "selfie-out" | "reg">("idle");
  const [elapsed, setElapsed] = useState("");
  const [showTrail, setShowTrail]   = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);

  // ── Subscribe to service state changes ──
  useEffect(() => {
    return fieldTrackingService.subscribe(s => {
      setState(s);
      if (!s.isCheckedIn && s.session) {
        const reason = s.session.checkOutReason;
        if (reason === "location_revoked") {
          if (!s.session.attendanceReg?.submittedAt) setUiStep("reg");
          toast.error("Location access revoked — attendance auto-closed", {
            description: "Submit an attendance regularisation request.",
            duration: 10000,
          });
        } else if (reason === "auto_23_59") {
          if (!s.session.attendanceReg?.submittedAt) setUiStep("reg");
          toast.warning("Auto check-out at 23:59 — regularisation required", {
            description: "You were checked out automatically as you did not check out before midnight.",
            duration: 10000,
          });
        }
      }
    });
  }, []);

  // ── Live timer ──
  useEffect(() => {
    if (!state.isCheckedIn || !state.session) return;
    const t = setInterval(() => setElapsed(formatDuration(state.session!.checkInTime)), 10000);
    setElapsed(formatDuration(state.session.checkInTime));
    return () => clearInterval(t);
  }, [state.isCheckedIn, state.session]);

  // ── Auto-checkout check (every minute) + offline queue flush ──
  useEffect(() => {
    const t = setInterval(() => {
      fieldTrackingService.checkAutoCheckout();
      // Flush offline GPS queue on every tick (network may have returned)
      fieldTrackingService.flushOfflineQueue();
      // Count pending offline points
      try {
        const q = JSON.parse(localStorage.getItem("field_offline_gps_queue") || "[]");
        setOfflineCount(q.length);
      } catch { /* */ }
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // ── Online event → flush queue immediately ──
  useEffect(() => {
    const flush = () => {
      fieldTrackingService.flushOfflineQueue();
      setOfflineCount(0);
    };
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  // ── Handlers ──
  const handleCheckIn = async (selfieBase64: string) => {
    setUiStep("idle");
    const result = await fieldTrackingService.checkIn({
      employeeId:   currentUser?.employeeId || "EMP-SM-001",
      employeeName: currentUser?.name       || currentRole,
      role: currentRole as "Sales Head" | "Sales Manager",
      selfieBase64,
    });
    if (result.ok) {
      toast.success("Field day started — location tracking active", {
        description: "Your GPS trail is being recorded.",
        duration: 5000,
      });
    } else {
      toast.error(result.error || "Check-in failed");
    }
  };

  const handleCheckOut = async (selfieBase64: string) => {
    setUiStep("idle");
    const result = await fieldTrackingService.checkOut(selfieBase64);
    if (result.ok) {
      toast.success("Field day ended", {
        description: `${state.session ? formatDuration(state.session.checkInTime) : ""} · ${state.session?.totalDistanceKm ?? 0} km covered`,
      });
    }
  };

  const session = state.session;
  const today   = new Date().toISOString().slice(0, 10);
  const hour    = nowHour();

  // ── Selfie screens ──
  if (uiStep === "selfie-in") return (
    <Card className="p-6">
      <SelfieCapturer label="Check-In Selfie — with live location" onCapture={handleCheckIn} onCancel={() => setUiStep("idle")} />
    </Card>
  );

  if (uiStep === "selfie-out") return (
    <Card className="p-6">
      <SelfieCapturer label="Check-Out Selfie — with live location" onCapture={handleCheckOut} onCancel={() => setUiStep("idle")} />
    </Card>
  );

  // ── Regularisation screen ──
  if (uiStep === "reg" && session?.isAutoCheckout && !session.attendanceReg?.submittedAt) {
    return <AttendanceRegForm session={session} onDone={() => setUiStep("idle")} />;
  }

  // ── CHECKED IN ──
  if (state.isCheckedIn && session) {
    const isLate7PM     = hour >= FIELD_HOURS.SUGGESTED_CHECKOUT;
    const isNearMidnight = hour >= 22;

    return (
      <div className="space-y-4">
        {/* Active session banner */}
        <Card className={`p-5 border-2 ${isNearMidnight ? "border-red-400 bg-red-50" : "border-green-300 bg-green-50"}`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-400 shrink-0">
                {session.checkInSelfieBase64
                  ? <img src={session.checkInSelfieBase64} alt="selfie" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-green-200 flex items-center justify-center"><Camera className="w-5 h-5 text-green-700" /></div>}
              </div>
              <div>
                <p className="font-semibold text-green-900">Field Day Active</p>
                <p className="text-sm text-green-700">
                  Checked in {formatTime(session.checkInTime)} · {elapsed} elapsed
                </p>
                <p className="text-xs text-gray-500">
                  📍 {session.checkInLocation
                    ? formatCoords(session.checkInLocation.lat, session.checkInLocation.lng)
                    : "Location pending"}
                </p>
              </div>
            </div>
            <Badge className={`${isNearMidnight ? "bg-red-600 animate-pulse" : "bg-green-600 animate-pulse"} shrink-0`}>
              ● Live
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { icon: <Footprints className="w-3.5 h-3.5" />, label: "Distance",    val: `${session.totalDistanceKm} km` },
              { icon: <Navigation className="w-3.5 h-3.5" />, label: "GPS Points",  val: session.trail.length },
              { icon: <MapPin      className="w-3.5 h-3.5" />, label: "Accuracy",   val: `~${session.trail.at(-1)?.accuracy ?? "—"}m` },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-lg p-2 text-center border">
                <div className="flex justify-center text-green-600 mb-0.5">{m.icon}</div>
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className="font-bold text-xs">{m.val}</p>
              </div>
            ))}
          </div>

          {/* Offline queue badge */}
          {offlineCount > 0 && (
            <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-800">
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              {offlineCount} GPS point{offlineCount > 1 ? "s" : ""} queued offline (lift/basement) — will sync when network returns
            </div>
          )}
        </Card>

        {/* 7 PM reminder */}
        {isLate7PM && (
          <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
            isNearMidnight
              ? "bg-red-50 border-red-300 text-red-800"
              : "bg-amber-50 border-amber-300 text-amber-800"
          }`}>
            <Clock className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {isNearMidnight
                ? <><strong>⚠️ After 23:59, you will be auto-checked out.</strong> Please check out now to avoid an attendance regularisation request.</>
                : <><strong>Suggested check-out time is 7:00 PM.</strong> Please end your field day when done.</>}
            </div>
          </div>
        )}

        {/* Location trail */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" /> GPS Trail (Admin view only)
            </p>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowTrail(v => !v)}>
              {showTrail ? "Hide" : "View"}
            </Button>
          </div>
          {showTrail && <TrailPreview trail={session.trail} />}
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Trail data is visible to Admin and Super Admin only
          </p>
        </Card>

        {/* GPS offline info */}
        <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            In lifts or basements with no GPS signal, points are queued and synced automatically when signal returns.
            Network loss does <strong>not</strong> trigger auto-checkout — only turning off location access does.
          </span>
        </div>

        {/* Check-out button */}
        <Button
          onClick={() => setUiStep("selfie-out")}
          variant="outline"
          className="w-full border-2 border-red-300 text-red-700 hover:bg-red-50 gap-2 py-6 text-base font-semibold"
        >
          <XCircle className="w-5 h-5" /> End Field Day
        </Button>

        {state.lastError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />{state.lastError}
          </div>
        )}
      </div>
    );
  }

  // ── CHECKED OUT ──
  if (!state.isCheckedIn && session && session.date === today) {
    const durationStr = formatDuration(session.checkInTime, session.checkOutTime ?? undefined);
    const needsReg    = session.isAutoCheckout && !session.attendanceReg?.submittedAt;
    const regStatus   = session.attendanceReg?.status;

    return (
      <div className="space-y-4">
        <ViewOnlyBanner />

        {/* Auto-checkout alert */}
        {session.isAutoCheckout && (
          <div className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
            regStatus === "Approved" ? "border-green-300 bg-green-50"
            : regStatus === "Rejected" ? "border-red-300 bg-red-50"
            : "border-orange-300 bg-orange-50"
          }`}>
            <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${
              regStatus === "Approved" ? "text-green-600" : regStatus === "Rejected" ? "text-red-600" : "text-orange-600"
            }`} />
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {session.checkOutReason === "auto_23_59"
                  ? "Auto check-out at 23:59"
                  : "Auto check-out — Location revoked"}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Check-out time recorded: {session.checkOutTime ? formatTime(session.checkOutTime) : "—"}
              </p>
              {regStatus && (
                <Badge className={`mt-2 text-xs ${
                  regStatus === "Approved" ? "bg-green-600"
                  : regStatus === "Rejected" ? "bg-red-600"
                  : "bg-orange-500"
                }`}>
                  Regularisation: {regStatus}
                  {session.attendanceReg?.reviewedBy && ` — by ${session.attendanceReg.reviewedBy}`}
                </Badge>
              )}
              {needsReg && (
                <Button size="sm" variant="outline" className="mt-2 text-xs h-7 border-orange-400 text-orange-700"
                  onClick={() => setUiStep("reg")}>
                  Submit Regularisation Request
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        <Card className="p-5 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-semibold">Field Day Complete</p>
              <p className="text-xs text-gray-500">{session.date}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Check-In",   val: formatTime(session.checkInTime) },
              { label: "Check-Out",  val: session.checkOutTime ? formatTime(session.checkOutTime) : "—" },
              { label: "Duration",   val: durationStr },
              { label: "Distance",   val: `${session.totalDistanceKm} km` },
            ].map(m => (
              <div key={m.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className="font-bold text-sm">{m.val}</p>
              </div>
            ))}
          </div>

          {/* Selfie comparison */}
          {(session.checkInSelfieBase64 || session.checkOutSelfieBase64) && (
            <div className="flex gap-3 mt-4 justify-center">
              {session.checkInSelfieBase64 && (
                <div className="text-center">
                  <img src={session.checkInSelfieBase64} alt="check-in"
                    className="w-16 h-16 rounded-full border-2 border-green-400 object-cover mx-auto" />
                  <p className="text-xs text-gray-400 mt-1">Check-In</p>
                </div>
              )}
              {session.checkOutSelfieBase64 && (
                <div className="text-center">
                  <img src={session.checkOutSelfieBase64} alt="check-out"
                    className="w-16 h-16 rounded-full border-2 border-red-400 object-cover mx-auto" />
                  <p className="text-xs text-gray-400 mt-1">Check-Out</p>
                </div>
              )}
            </div>
          )}

          {/* Trail */}
          <Button variant="ghost" size="sm" className="w-full mt-3 text-xs"
            onClick={() => setShowTrail(v => !v)}>
            {showTrail ? "Hide" : "View"} GPS Trail
          </Button>
          {showTrail && <TrailPreview trail={session.trail} />}
          <p className="text-xs text-gray-400 text-center mt-1 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> GPS trail visible to Admin / Super Admin only
          </p>
        </Card>

        <p className="text-center text-xs text-gray-400">
          Field day complete for {today}. Check in tomorrow to start a new day.
        </p>
      </div>
    );
  }

  // ── NOT CHECKED IN ──
  const beforeTime = hour < FIELD_HOURS.CHECK_IN_HOUR;

  return (
    <div className="space-y-5">
      <Card className="p-6 text-center space-y-4 border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">Not Checked In</p>
          {beforeTime ? (
            <p className="text-sm text-amber-600 mt-1 font-medium">
              ⏰ Check-in opens at {FIELD_HOURS.CHECK_IN_HOUR}:00 AM
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">
              Start your field day to begin location tracking and attendance.
            </p>
          )}
        </div>
        <Button
          className="w-full bg-green-600 hover:bg-green-700 gap-2 py-5 text-base font-semibold"
          onClick={() => setUiStep("selfie-in")}
        >
          <Camera className="w-5 h-5" /> Start Field Day
        </Button>
      </Card>

      <Card className="p-4 space-y-2.5">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" /> Field Day Rules
        </p>
        {[
          { icon: "📸", text: "Selfie + GPS location required at check-in and check-out" },
          { icon: "🕙", text: `Scheduled check-in: ${FIELD_HOURS.CHECK_IN_HOUR}:00 AM · Suggested check-out: ${FIELD_HOURS.SUGGESTED_CHECKOUT}:00 PM` },
          { icon: "🕛", text: "If not checked out by midnight, auto-checkout triggers at 23:59 — attendance regularisation required" },
          { icon: "📍", text: "GPS trail recorded throughout the day — visible to Admin / Super Admin only" },
          { icon: "📶", text: "No GPS in lifts or basements? Points queued offline and synced when signal returns" },
          { icon: "🔒", text: "Turning off phone location triggers auto-checkout — submit regularisation with reason" },
          { icon: "👁️", text: "After checkout: view-only mode. No data can be punched until next check-in" },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
            <span className="text-base shrink-0">{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
