/**
 * TATNotificationBell.tsx — REVISED
 * ─────────────────────────────────────────────────────────────────────────────
 * Notification bell for all roles with:
 *   ✅ Unique alert sound on new actionRequired notification
 *   ✅ Acknowledge button on each actionRequired card
 *   ✅ Separate unacknowledged badge (orange) vs unread count (blue)
 *   ✅ Acknowledged notifications show a green tick
 *
 * Usage:
 *   <TATNotificationBell role="TSM" employeeId="EDB-TSM-SUR1" />
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCircle, AlertCircle, AlertTriangle, X, Clock, CheckCheck } from "lucide-react";
import { Badge } from "../ui/badge";
import { tatTrackingService, type TATNotification } from "../../services/tatTrackingService";
import { useRole } from "../../contexts/RoleContext";

// ── Alert sound (Web Audio API — no external assets needed) ──────────────────
function playAlertSound(severity: TATNotification["severity"]) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (severity === "CRITICAL") {
      // Three urgent beeps
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      osc.start(ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.stop(ctx.currentTime + 0.15);
      setTimeout(() => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.value = 1100;
        g2.gain.setValueAtTime(0.4, ctx.currentTime);
        o2.start(); g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        o2.stop(ctx.currentTime + 0.2);
      }, 200);
      setTimeout(() => {
        const o3 = ctx.createOscillator();
        const g3 = ctx.createGain();
        o3.connect(g3); g3.connect(ctx.destination);
        o3.frequency.value = 1320;
        g3.gain.setValueAtTime(0.5, ctx.currentTime);
        o3.start(); g3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        o3.stop(ctx.currentTime + 0.25);
      }, 450);
    } else if (severity === "WARNING") {
      // Two medium beeps
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.start(ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.stop(ctx.currentTime + 0.18);
      setTimeout(() => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.value = 880;
        g2.gain.setValueAtTime(0.3, ctx.currentTime);
        o2.start(); g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        o2.stop(ctx.currentTime + 0.18);
      }, 250);
    } else {
      // Single soft chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start(ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (_) {
    // AudioContext blocked by browser policy — user must interact first
  }
}

interface Props {
  role: "SUPERVISOR" | "TSM" | "OM" | "SUPER_ADMIN";
  employeeId?: string;
}

export function TATNotificationBell({ role, employeeId }: Props) {
  const { currentUser } = useRole();
  const empId = employeeId || currentUser?.employeeId || "";

  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<TATNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [unacknowledged, setUnacknowledged] = useState(0);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const prevUnackRef = useRef(0);
  const audioUnlocked = useRef(false);

  // Unlock AudioContext on first user gesture
  useEffect(() => {
    const unlock = () => { audioUnlocked.current = true; };
    document.addEventListener("click", unlock, { once: true });
    return () => document.removeEventListener("click", unlock);
  }, []);

  const load = useCallback(() => {
    const n = tatTrackingService.getNotificationsForRole(role, empId);
    const sorted = n.slice(0, 25).reverse();
    setNotifs(sorted);
    const ur = tatTrackingService.getUnreadCount(role, empId);
    const ua = tatTrackingService.getUnacknowledgedActionCount(role, empId);
    setUnread(ur);

    // Play sound if new actionRequired notifications arrived
    if (ua > prevUnackRef.current && audioUnlocked.current) {
      const newest = sorted.find(x => x.actionRequired && !x.acknowledged);
      if (newest) playAlertSound(newest.severity);
    }
    prevUnackRef.current = ua;
    setUnacknowledged(ua);
  }, [role, empId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    const events = ["cc360:new_booking", "cc360:notification_acknowledged"];
    events.forEach(e => window.addEventListener(e, load));
    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, load));
    };
  }, [load]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) {
      tatTrackingService.markAllRead(role);
      setTimeout(load, 100);
    }
  };

  const handleAcknowledge = (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAcknowledging(notifId);
    setTimeout(() => {
      tatTrackingService.acknowledgeNotification(notifId, empId);
      setAcknowledging(null);
      load();
    }, 300);
  };

  const severityIcon = (s: TATNotification["severity"]) => {
    if (s === "CRITICAL") return <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />;
    if (s === "WARNING")  return <AlertCircle   className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
    return <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
  };

  const typeLabel = (t: TATNotification["type"]) => ({
    NEW_BOOKING:  "New Booking",
    ESCALATION:   "Escalation",
    TAT_BREACH:   "TAT Breach",
    ASSIGNED:     "Washer Assigned",
    COMPLETED:    "Wash Completed",
    PENDING_ASSIGN: "Pending Assign",
  }[t] || "Alert");

  const cardBg = (n: TATNotification) => {
    if (n.acknowledged) return "bg-gray-50";
    if (!n.read) {
      if (n.severity === "CRITICAL") return "bg-red-50";
      if (n.severity === "WARNING")  return "bg-amber-50";
      return "bg-blue-50";
    }
    return "bg-white";
  };

  // Total badge: unacknowledged (orange) takes priority over unread (blue)
  const badgeCount = unacknowledged > 0 ? unacknowledged : unread;
  const badgeColor = unacknowledged > 0 ? "bg-orange-500" : "bg-blue-500";

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className={`relative p-2 rounded-full transition-all ${
          unacknowledged > 0
            ? "text-orange-600 bg-orange-50 hover:bg-orange-100 animate-pulse"
            : unread > 0
            ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        aria-label={`Notifications${badgeCount > 0 ? ` (${badgeCount} unread)` : ""}`}
      >
        <Bell className="w-5 h-5" />
        {badgeCount > 0 && (
          <span className={`absolute -top-1 -right-1 ${badgeColor} text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1`}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unacknowledged > 0 && (
                <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0 animate-pulse">
                  {unacknowledged} need action
                </Badge>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
            {notifs.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : notifs.map(n => (
              <div key={n.id} className={`px-4 py-3 transition-colors ${cardBg(n)}`}>
                <div className="flex items-start gap-3">
                  {severityIcon(n.severity)}
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`text-sm font-semibold ${n.acknowledged ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        {n.title}
                      </span>
                      <Badge variant="outline" className={`text-xs px-1.5 py-0 ${
                        n.severity === "CRITICAL" ? "border-red-400 text-red-700" :
                        n.severity === "WARNING"  ? "border-amber-400 text-amber-700" :
                                                    "border-blue-300 text-blue-700"
                      }`}>
                        {typeLabel(n.type)}
                      </Badge>
                      {n.acknowledged && (
                        <span className="flex items-center gap-0.5 text-xs text-green-600">
                          <CheckCheck className="w-3 h-3" /> Acknowledged
                        </span>
                      )}
                    </div>

                    {/* Message */}
                    <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-line line-clamp-3">{n.message}</p>

                    {/* Footer row: time + acknowledge button */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>

                      {/* ACKNOWLEDGE BUTTON — only if actionRequired and not yet acknowledged */}
                      {n.actionRequired && !n.acknowledged && (
                        <button
                          onClick={(e) => handleAcknowledge(n.id, e)}
                          disabled={acknowledging === n.id}
                          className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            acknowledging === n.id
                              ? "bg-gray-200 text-gray-400 cursor-wait"
                              : n.severity === "CRITICAL"
                              ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                              : n.severity === "WARNING"
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          }`}
                        >
                          {acknowledging === n.id ? (
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Acknowledging…
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <CheckCheck className="w-3 h-3" />
                              Acknowledge
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {unacknowledged > 0 ? `${unacknowledged} action${unacknowledged > 1 ? "s" : ""} pending` : "All caught up"}
              </span>
              <button
                onClick={() => { tatTrackingService.markAllRead(role); load(); }}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Compact pending banner ────────────────────────────────────────────────────
export function TATSummaryBanner() {
  const [pending, setPending] = useState(0);
  const [breached, setBreached] = useState(0);

  useEffect(() => {
    const update = () => {
      setPending(tatTrackingService.getPendingCount());
      setBreached(tatTrackingService.getBreachedCount());
      tatTrackingService.checkBreaches();
    };
    update();
    const interval = setInterval(update, 60000);
    window.addEventListener("cc360:new_booking", update);
    return () => { clearInterval(interval); window.removeEventListener("cc360:new_booking", update); };
  }, []);

  if (pending === 0 && breached === 0) return null;

  return (
    <div className={`flex items-center gap-4 px-4 py-2 rounded-lg text-sm font-medium ${
      breached > 0 ? "bg-red-50 border border-red-200 text-red-800"
                   : "bg-amber-50 border border-amber-200 text-amber-800"
    }`}>
      {breached > 0 && (
        <span className="flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {breached} TAT Breach{breached > 1 ? "es" : ""} — Immediate action required
        </span>
      )}
      {pending > 0 && (
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {pending} booking{pending > 1 ? "s" : ""} pending washer assignment
        </span>
      )}
    </div>
  );
}
