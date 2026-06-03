/**
 * BTLAssignmentsScreen.tsx
 *
 * "My BTL Assignments" screen for the Supervisor app.
 *
 * Shows all SM-assigned BTL locations for this Supervisor:
 *  - Location name, SM name, address, contact person, schedule
 *  - Check-in status (Upcoming / Arrived on time / Arrived late / Not arrived / Completed)
 *  - Briefing notes from SM
 *  - Confirm schedule / Flag conflict actions
 *  - Start BTL Activity Mode → GPS validated (500m) → leads auto-attributed to SM + location
 *  - End Activity button when in session
 *  - Per-session history (leads submitted, timestamps)
 *
 * Defined by: Sales Manager Module v2.0 §14
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  btlAssignmentService,
  type BTLAssignment,
  type BTLActivitySession,
} from "../../services/btlAssignmentService";
import { getCurrentGps } from "../../utils/gpsUtils";

interface BTLAssignmentsScreenProps {
  supervisorId: string;
  supervisorName: string;
}

const STATUS_COLOR: Record<string, string> = {
  "Upcoming":        "bg-gray-100 text-gray-700",
  "Confirmed":       "bg-blue-100 text-blue-700",
  "In Progress":     "bg-amber-100 text-amber-800",
  "Completed":       "bg-green-100 text-green-700",
  "Missed":          "bg-red-100 text-red-700",
  "Conflict Flagged":"bg-orange-100 text-orange-700",
  "Auto-Closed":     "bg-gray-200 text-gray-600",
  "Arrived on time": "bg-green-100 text-green-700",
  "Arrived late":    "bg-yellow-100 text-yellow-700",
  "Not arrived":     "bg-red-100 text-red-700",
};

function Badge({ label }: { label: string }) {
  const cls = STATUS_COLOR[label] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export function BTLAssignmentsScreen({ supervisorId, supervisorName }: BTLAssignmentsScreenProps) {
  const [assignments, setAssignments] = useState<BTLAssignment[]>([]);
  const [activeSession, setActiveSession] = useState<BTLActivitySession | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [conflictNote, setConflictNote] = useState<Record<string, string>>({});
  const [showConflictInput, setShowConflictInput] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");

  const reload = useCallback(() => {
    setAssignments(btlAssignmentService.getBySupervisor(supervisorId));
    setActiveSession(btlAssignmentService.getActiveSession());
  }, [supervisorId]);

  useEffect(() => { reload(); }, [reload]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = assignments.filter(a => {
    if (filter === "active")    return ["Upcoming","Confirmed","In Progress","Conflict Flagged"].includes(a.status);
    if (filter === "completed") return ["Completed","Missed","Auto-Closed"].includes(a.status);
    return true;
  });

  // ── Confirm schedule ────────────────────────────────────────────────────────
  const handleConfirm = (assignmentId: string) => {
    btlAssignmentService.confirmSchedule(assignmentId);
    toast.success("Schedule confirmed");
    reload();
  };

  // ── Flag conflict ───────────────────────────────────────────────────────────
  const handleFlagConflict = (assignmentId: string) => {
    const note = conflictNote[assignmentId]?.trim();
    if (!note) { toast.error("Please describe the conflict"); return; }
    btlAssignmentService.flagConflict(assignmentId, note);
    toast.success("Conflict flagged — Sales Head has been notified");
    setShowConflictInput(null);
    setConflictNote(p => ({ ...p, [assignmentId]: "" }));
    reload();
  };

  // ── Start BTL Activity ──────────────────────────────────────────────────────
  const handleStartActivity = async (assignmentId: string) => {
    setStarting(assignmentId);
    try {
      let gps = { lat: 21.1702, lng: 72.8311 }; // fallback for dev/demo
      try {
        gps = await getCurrentGps();
      } catch {
        // In production GPS must work. For dev, use simulated coords.
        toast("Using simulated GPS for demo — real device GPS required in production", { icon: "ℹ️" });
      }

      const { session, assignment } = await btlAssignmentService.startActivity(assignmentId, gps);
      setActiveSession(session);
      toast.success(
        `BTL Activity Mode started at ${assignment.locationName}. ` +
        `GPS validated ✓ (${Math.round(session.gpsDistanceAtStart)}m from pin). ` +
        `All leads will be tagged to this location.`
      );
      reload();
    } catch (err: any) {
      toast.error(err.message || "Could not start BTL Activity Mode");
    } finally {
      setStarting(null);
    }
  };

  // ── End BTL Activity ────────────────────────────────────────────────────────
  const handleEndActivity = async () => {
    if (!activeSession) return;
    setEnding(true);
    try {
      let gps: { lat: number; lng: number } | undefined;
      try { gps = await getCurrentGps(); } catch {}
      const closed = btlAssignmentService.endActivity(activeSession.sessionId, gps);
      if (closed) {
        toast.success(
          `BTL Activity ended. ${closed.leadsSubmitted} lead${closed.leadsSubmitted !== 1 ? "s" : ""} submitted this session.`
        );
      }
      setActiveSession(null);
      reload();
    } finally {
      setEnding(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-indigo-700 text-white px-4 pt-4 pb-6">
        <h1 className="text-xl font-bold">My BTL Assignments</h1>
        <p className="text-sm text-indigo-200 mt-1">SM-assigned tie-up locations for BTL activity</p>
      </div>

      {/* Active session banner */}
      {activeSession && (
        <div className="mx-4 mt-4 rounded-xl bg-amber-50 border-2 border-amber-400 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-amber-900 text-sm">🔴 BTL Activity Mode ACTIVE</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Session: {activeSession.sessionId}<br />
                Location ID: {activeSession.locationId}<br />
                SM ID: {activeSession.smId}<br />
                Leads submitted this session: <strong>{activeSession.leadsSubmitted}</strong><br />
                Started: {new Date(activeSession.sessionStart).toLocaleTimeString()}
              </p>
              <p className="text-xs text-amber-600 mt-1 font-medium">
                All leads you capture now are auto-tagged to this location and SM.
              </p>
            </div>
            <button
              disabled={ending}
              onClick={handleEndActivity}
              className="shrink-0 bg-amber-600 text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {ending ? "Ending…" : "End Activity"}
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 mt-4">
        {(["active", "completed", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
              filter === f ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border"
            }`}>
            {f === "active" ? "Active / Upcoming" : f === "completed" ? "Past" : "All"}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} assignments</span>
      </div>

      {/* List */}
      <div className="px-4 mt-3 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📍</p>
            <p className="font-semibold">No assignments found</p>
            <p className="text-sm mt-1">Sales Head assigns you to locations when an SM's tie-up is approved.</p>
          </div>
        )}

        {filtered.map(a => {
          const isExpanded     = expandedId === a.assignmentId;
          const checkInStatus  = btlAssignmentService.getCheckInStatus(a);
          const isMyActive     = activeSession?.assignmentId === a.assignmentId;
          const canStart       = !activeSession && ["Upcoming","Confirmed"].includes(a.status);

          return (
            <div key={a.assignmentId}
              className={`bg-white rounded-xl border-2 ${isMyActive ? "border-amber-400" : "border-gray-200"} overflow-hidden`}>

              {/* Card header */}
              <button className="w-full text-left p-4"
                onClick={() => setExpandedId(isExpanded ? null : a.assignmentId)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{a.locationName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.locationType.replace("_"," ")} · {a.locationAddress}</p>
                    <p className="text-xs text-indigo-600 mt-0.5">SM: {a.smName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge label={a.status} />
                    <Badge label={checkInStatus} />
                  </div>
                </div>

                {/* Schedule pill */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    📅 {a.scheduledDay} · {a.scheduledTimeSlot}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {a.proposedActivityType}
                  </span>
                  {a.sessions.length > 0 && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                      {a.sessions.length} session{a.sessions.length !== 1 ? "s" : ""} done
                    </span>
                  )}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-3">

                  {/* Contact */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Location Contact</p>
                    <p className="text-sm font-semibold text-gray-900">{a.locationContactName}</p>
                    <a href={`tel:${a.locationContactMobile}`}
                      className="text-sm text-indigo-600 font-medium">
                      📞 {a.locationContactMobile}
                    </a>
                  </div>

                  {/* Briefing notes */}
                  {a.briefingNotes && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
                        📋 Briefing from {a.smName}
                        {a.briefingUpdatedAt && (
                          <span className="font-normal ml-1 text-blue-400">
                            (updated {new Date(a.briefingUpdatedAt).toLocaleDateString()})
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">{a.briefingNotes}</p>
                    </div>
                  )}

                  {/* Start BTL Activity button */}
                  {canStart && !isMyActive && (
                    <button
                      disabled={starting === a.assignmentId}
                      onClick={() => handleStartActivity(a.assignmentId)}
                      className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-60 text-sm"
                    >
                      {starting === a.assignmentId
                        ? "Validating GPS…"
                        : "▶  Start BTL Activity Mode"}
                    </button>
                  )}

                  {isMyActive && (
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold text-amber-800">🔴 Session active — use End Activity button above</p>
                    </div>
                  )}

                  {/* Confirm / Conflict actions */}
                  {["Upcoming"].includes(a.status) && (
                    <div className="flex gap-2">
                      <button onClick={() => handleConfirm(a.assignmentId)}
                        className="flex-1 bg-green-600 text-white text-sm font-semibold py-2 rounded-lg">
                        ✓ Confirm Schedule
                      </button>
                      <button onClick={() => setShowConflictInput(a.assignmentId)}
                        className="flex-1 border border-orange-400 text-orange-700 text-sm font-semibold py-2 rounded-lg">
                        ⚠ Flag Conflict
                      </button>
                    </div>
                  )}

                  {showConflictInput === a.assignmentId && (
                    <div className="space-y-2">
                      <textarea
                        value={conflictNote[a.assignmentId] || ""}
                        onChange={e => setConflictNote(p => ({ ...p, [a.assignmentId]: e.target.value }))}
                        placeholder="Describe the scheduling conflict…"
                        rows={3}
                        className="w-full border border-orange-300 rounded-lg p-2 text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleFlagConflict(a.assignmentId)}
                          className="flex-1 bg-orange-600 text-white text-sm font-semibold py-2 rounded-lg">
                          Submit Conflict Note
                        </button>
                        <button onClick={() => setShowConflictInput(null)}
                          className="flex-1 border text-gray-600 text-sm py-2 rounded-lg">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Session history */}
                  {a.sessions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Session History</p>
                      {a.sessions.map((s, i) => (
                        <div key={s.sessionId}
                          className="bg-gray-50 rounded-lg p-3 mb-2 text-xs space-y-0.5">
                          <p className="font-semibold text-gray-700">Session {i + 1} · {s.status}</p>
                          <p className="text-gray-500">
                            Start: {new Date(s.sessionStart).toLocaleString()}<br />
                            {s.sessionEnd && `End: ${new Date(s.sessionEnd).toLocaleString()}`}
                          </p>
                          <p className="text-gray-700">
                            Leads submitted: <strong>{s.leadsSubmitted}</strong><br />
                            GPS at start: {Math.round(s.gpsDistanceAtStart)}m from pin ·{" "}
                            <span className={s.gpsValidated ? "text-green-600" : "text-red-600"}>
                              {s.gpsValidated ? "✓ Validated" : "✗ Outside 500m"}
                            </span>
                          </p>
                          {s.autoClosedReason && (
                            <p className="text-orange-600 font-medium">Auto-closed: {s.autoClosedReason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
