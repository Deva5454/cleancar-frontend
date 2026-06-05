/**
 * TATNotificationBell.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable notification bell for all roles (TSM, Supervisor, OM, Super Admin)
 * Shows unread count + dropdown of TAT notifications
 *
 * Usage:
 *   <TATNotificationBell role="TSM" employeeId={tsmId} />
 *   <TATNotificationBell role="SUPERVISOR" employeeId={supervisorId} />
 *   <TATNotificationBell role="OM" />
 *   <TATNotificationBell role="SUPER_ADMIN" />
 */

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, AlertCircle, AlertTriangle, X, Clock } from "lucide-react";
import { Badge } from "../ui/badge";
import { tatTrackingService, type TATNotification } from "../../services/tatTrackingService";

interface TATNotificationBellProps {
  role: "SUPERVISOR" | "TSM" | "OM" | "SUPER_ADMIN";
  employeeId?: string;
}

export function TATNotificationBell({ role, employeeId }: TATNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<TATNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = () => {
    const n = tatTrackingService.getNotificationsForRole(role, employeeId);
    setNotifs(n.slice(0, 20).reverse()); // newest first
    setUnread(tatTrackingService.getUnreadCount(role, employeeId));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // refresh every 15s
    // Also listen for real-time events
    const handler = () => load();
    window.addEventListener("cc360:new_booking", handler);
    return () => { clearInterval(interval); window.removeEventListener("cc360:new_booking", handler); };
  }, [role, employeeId]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) {
      tatTrackingService.markAllRead(role);
      setTimeout(load, 100);
    }
  };

  const severityIcon = (s: TATNotification["severity"]) => {
    if (s === "CRITICAL") return <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />;
    if (s === "WARNING")  return <AlertCircle   className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
    return <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
  };

  const typeLabel = (t: TATNotification["type"]) => {
    if (t === "NEW_BOOKING")  return "New Booking";
    if (t === "ESCALATION")   return "Escalation";
    if (t === "TAT_BREACH")   return "TAT Breach";
    if (t === "ASSIGNED")     return "Washer Assigned";
    if (t === "COMPLETED")    return "Wash Completed";
    return "Alert";
  };

  const bgForSeverity = (s: TATNotification["severity"], read: boolean) => {
    if (read) return "bg-white";
    if (s === "CRITICAL") return "bg-red-50";
    if (s === "WARNING")  return "bg-amber-50";
    return "bg-blue-50";
  };

  const pendingCount = tatTrackingService.getPendingCount();
  const breachedCount = tatTrackingService.getBreachedCount();

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="TAT Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div>
              <span className="font-semibold text-gray-900 text-sm">TAT Notifications</span>
              <div className="flex items-center gap-3 mt-0.5">
                {pendingCount > 0 && (
                  <span className="text-xs text-amber-700 font-medium">{pendingCount} pending assignment</span>
                )}
                {breachedCount > 0 && (
                  <span className="text-xs text-red-700 font-medium">{breachedCount} breached</span>
                )}
              </div>
            </div>
            <button onClick={() => setOpen(false)}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifs.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            )}
            {notifs.map(n => (
              <div key={n.id} className={`p-3 ${bgForSeverity(n.severity, n.read)}`}>
                <div className="flex items-start gap-2">
                  {severityIcon(n.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-900 truncate">{n.title}</span>
                      <Badge variant="outline" className={`text-xs shrink-0 ${
                        n.severity === "CRITICAL" ? "border-red-400 text-red-700" :
                        n.severity === "WARNING"  ? "border-amber-400 text-amber-700" :
                        "border-blue-300 text-blue-700"
                      }`}>
                        {typeLabel(n.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {n.actionRequired && n.actionLabel && (
                        <span className="ml-auto text-xs font-medium text-blue-600 cursor-pointer hover:underline">
                          {n.actionLabel} →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-4 py-2 border-t bg-gray-50 text-center">
              <button
                onClick={() => { tatTrackingService.markAllRead(role); load(); }}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Compact pending banner for dashboards ────────────────────────────────────
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
