/**
 * btlAssignmentService.ts
 *
 * Manages BTL (Below-The-Line) assignments — the link between a Sales Manager's
 * approved tie-up location and the Supervisor assigned to execute BTL there.
 *
 * Created when Sales Head approves an SM location submission.
 * Read by the Supervisor app (My BTL Assignments screen + BTL Activity Mode).
 * Read by the SM app (Supervisor Assignment View).
 * Read by the Sales Head for GPS audit and check-in monitoring.
 *
 * Storage: localStorage key "cleancar_btl_assignments"
 */

import { haversineMetres, type GpsCoord } from "../utils/gpsUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssignmentStatus =
  | "Upcoming"
  | "Confirmed"
  | "In Progress"
  | "Completed"
  | "Missed"
  | "Conflict Flagged"
  | "Auto-Closed";

export type LocationStatus =
  | "Active Prospect"
  | "Active"
  | "At Risk"
  | "Inactive"
  | "Pending Approval"
  | "Rejected";

export interface BTLAssignment {
  assignmentId: string;

  // Location details (from SM submission, approved by Sales Head)
  locationId: string;
  locationName: string;
  locationType: "society" | "petrol_pump" | "corporate" | "rwa" | "shop" | "other";
  locationGpsPin: GpsCoord;
  locationAddress: string;
  locationContactName: string;
  locationContactMobile: string;
  locationStatus: LocationStatus;

  // SM who owns this location
  smId: string;
  smName: string;

  // Supervisor assigned to execute BTL here
  supervisorId: string;
  supervisorName: string;

  // Schedule
  scheduledDay: string;       // e.g. "Monday", "Wednesday"
  scheduledTimeSlot: string;  // e.g. "7am–9am", "5am–7am"
  proposedActivityType: string; // e.g. "Stall + QR display"

  // Briefing from SM
  briefingNotes: string;
  briefingUpdatedAt?: string;

  // Status lifecycle
  status: AssignmentStatus;
  confirmedAt?: string;         // When Supervisor confirmed
  conflictFlaggedAt?: string;
  conflictNote?: string;

  // BTL Activity sessions (one per visit)
  sessions: BTLActivitySession[];

  // Meta
  createdAt: string;
  approvedAt: string;           // When Sales Head approved the location
  cityId: string;
}

export interface BTLActivitySession {
  sessionId: string;
  assignmentId: string;

  // GPS validation
  gpsAtStart: GpsCoord;
  gpsDistanceAtStart: number;  // metres from location pin
  gpsValidated: boolean;        // true = within 500m at activation
  gpsAtEnd?: GpsCoord;

  // Timing
  sessionStart: string;         // ISO timestamp
  sessionEnd?: string;

  // Output
  leadsSubmitted: number;
  btlActivityId: string;        // Auto-generated, stored on each lead submitted in this session

  // Status
  status: "Active" | "Completed" | "Auto-Closed";
  autoClosedReason?: string;

  // Attribution (set on every BTL lead submitted in this session)
  smId: string;
  locationId: string;
}

// ─── Alerts emitted to Sales Head ─────────────────────────────────────────────
export interface BTLAlert {
  id: string;
  type:
    | "gps_validation_fail"
    | "supervisor_not_arrived"
    | "location_at_risk"
    | "location_inactive"
    | "session_auto_closed";
  supervisorId: string;
  supervisorName: string;
  locationId: string;
  locationName: string;
  smId: string;
  message: string;
  createdAt: string;
  severity: "High" | "Medium" | "Low";
  read: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "cleancar_btl_assignments";
const ALERT_KEY   = "cleancar_btl_alerts";
const SESSION_KEY = "cleancar_btl_active_session"; // single active session per device

class BTLAssignmentService {

  // ── Read / Write ────────────────────────────────────────────────────────────

  getAll(): BTLAssignment[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch { return []; }
  }

  private save(list: BTLAssignment[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  getById(assignmentId: string): BTLAssignment | null {
    return this.getAll().find(a => a.assignmentId === assignmentId) || null;
  }

  /** All assignments for a given Supervisor */
  getBySupervisor(supervisorId: string): BTLAssignment[] {
    return this.getAll().filter(a => a.supervisorId === supervisorId);
  }

  /** All assignments for a given SM location */
  getByLocation(locationId: string): BTLAssignment[] {
    return this.getAll().filter(a => a.locationId === locationId);
  }

  /** Upcoming + In Progress assignments for a Supervisor */
  getActiveForSupervisor(supervisorId: string): BTLAssignment[] {
    return this.getBySupervisor(supervisorId).filter(a =>
      ["Upcoming", "Confirmed", "In Progress"].includes(a.status)
    );
  }

  createAssignment(assignment: Omit<BTLAssignment, "assignmentId" | "sessions" | "createdAt">): BTLAssignment {
    const full: BTLAssignment = {
      ...assignment,
      assignmentId: `BTLASS-${Date.now()}`,
      sessions: [],
      createdAt: new Date().toISOString(),
    };
    const list = this.getAll();
    list.unshift(full);
    this.save(list);
    return full;
  }

  private updateAssignment(assignmentId: string, patch: Partial<BTLAssignment>) {
    const list = this.getAll().map(a =>
      a.assignmentId === assignmentId ? { ...a, ...patch } : a
    );
    this.save(list);
  }

  // ── Supervisor actions ──────────────────────────────────────────────────────

  confirmSchedule(assignmentId: string): void {
    this.updateAssignment(assignmentId, {
      status: "Confirmed",
      confirmedAt: new Date().toISOString(),
    });
  }

  flagConflict(assignmentId: string, note: string): void {
    this.updateAssignment(assignmentId, {
      status: "Conflict Flagged",
      conflictFlaggedAt: new Date().toISOString(),
      conflictNote: note,
    });
    const a = this.getById(assignmentId);
    if (a) {
      this.emitAlert({
        type: "supervisor_not_arrived",
        supervisorId: a.supervisorId,
        supervisorName: a.supervisorName,
        locationId: a.locationId,
        locationName: a.locationName,
        smId: a.smId,
        message: `Supervisor ${a.supervisorName} flagged a scheduling conflict for ${a.locationName}. Reason: ${note}`,
        severity: "Medium",
      });
    }
  }

  updateBriefing(assignmentId: string, notes: string): void {
    this.updateAssignment(assignmentId, {
      briefingNotes: notes,
      briefingUpdatedAt: new Date().toISOString(),
    });
  }

  // ── BTL Activity Mode ───────────────────────────────────────────────────────

  /** Start BTL Activity Mode for an assignment.
   * Validates GPS. Returns session or throws with user-facing message. */
  async startActivity(
    assignmentId: string,
    supervisorGps: GpsCoord
  ): Promise<{ session: BTLActivitySession; assignment: BTLAssignment }> {
    // Block if another session is already active
    const existingActive = this.getActiveSession();
    if (existingActive && existingActive.assignmentId !== assignmentId) {
      throw new Error(
        "You already have an active BTL session running. Please end it before starting a new one."
      );
    }

    const assignment = this.getById(assignmentId);
    if (!assignment) throw new Error("Assignment not found.");

    const distanceM = haversineMetres(supervisorGps, assignment.locationGpsPin);
    const validated  = distanceM <= 500;

    if (!validated) {
      // Emit alert to Sales Head
      this.emitAlert({
        type: "gps_validation_fail",
        supervisorId: assignment.supervisorId,
        supervisorName: assignment.supervisorName,
        locationId: assignment.locationId,
        locationName: assignment.locationName,
        smId: assignment.smId,
        message: `GPS mismatch: ${assignment.supervisorName} attempted to start BTL at ${assignment.locationName} but is ${Math.round(distanceM)}m away (limit 500m). Verify lead before assigning.`,
        severity: "High",
      });
      throw new Error(
        `You are ${Math.round(distanceM)} m away from ${assignment.locationName}. ` +
        `You must be within 500 m to start BTL Activity Mode. ` +
        `Please move closer to the location.`
      );
    }

    const session: BTLActivitySession = {
      sessionId:            `SES-${Date.now()}`,
      assignmentId,
      gpsAtStart:           supervisorGps,
      gpsDistanceAtStart:   distanceM,
      gpsValidated:         true,
      sessionStart:         new Date().toISOString(),
      leadsSubmitted:       0,
      btlActivityId:        `BTL-ACT-${Date.now()}`,
      status:               "Active",
      smId:                 assignment.smId,
      locationId:           assignment.locationId,
    };

    // Persist as active session
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Update assignment status
    this.updateAssignment(assignmentId, { status: "In Progress" });

    return { session, assignment };
  }

  /** End BTL Activity Mode */
  endActivity(sessionId: string, finalGps?: GpsCoord): BTLActivitySession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session: BTLActivitySession = JSON.parse(raw);
    if (session.sessionId !== sessionId) return null;

    const closed: BTLActivitySession = {
      ...session,
      gpsAtEnd:    finalGps,
      sessionEnd:  new Date().toISOString(),
      status:      "Completed",
    };

    // Save session into assignment record
    const list = this.getAll().map(a => {
      if (a.assignmentId !== closed.assignmentId) return a;
      return {
        ...a,
        status: "Completed" as AssignmentStatus,
        sessions: [...a.sessions, closed],
      };
    });
    this.save(list);
    localStorage.removeItem(SESSION_KEY);
    return closed;
  }

  /** Auto-close if Supervisor starts new assignment without ending old one */
  autoCloseSession(reason: string): void {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session: BTLActivitySession = JSON.parse(raw);
    const closed: BTLActivitySession = {
      ...session,
      sessionEnd:       new Date().toISOString(),
      status:           "Auto-Closed",
      autoClosedReason: reason,
    };
    const list = this.getAll().map(a => {
      if (a.assignmentId !== closed.assignmentId) return a;
      return { ...a, sessions: [...a.sessions, closed] };
    });
    this.save(list);
    localStorage.removeItem(SESSION_KEY);

    // Alert Sales Head
    const a = this.getById(session.assignmentId);
    if (a) {
      this.emitAlert({
        type: "session_auto_closed",
        supervisorId: a.supervisorId,
        supervisorName: a.supervisorName,
        locationId: a.locationId,
        locationName: a.locationName,
        smId: a.smId,
        message: `BTL session at ${a.locationName} was auto-closed: ${reason}`,
        severity: "Low",
      });
    }
  }

  getActiveSession(): BTLActivitySession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  incrementLeadCount(sessionId: string): void {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session: BTLActivitySession = JSON.parse(raw);
    if (session.sessionId !== sessionId) return;
    session.leadsSubmitted += 1;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  // ── Check-in status computation ─────────────────────────────────────────────

  getCheckInStatus(assignment: BTLAssignment):
    "Upcoming" | "Arrived on time" | "Arrived late" | "Not arrived" | "Completed" | "Missed" {
    if (assignment.status === "Completed") return "Completed";
    if (assignment.status === "Missed")    return "Missed";

    const lastSession = assignment.sessions[assignment.sessions.length - 1];
    if (!lastSession) {
      // Check if overdue
      const now = new Date();
      const scheduled = this.parseScheduledTime(assignment);
      if (!scheduled) return "Upcoming";
      const minutesLate = (now.getTime() - scheduled.getTime()) / 60000;
      if (minutesLate > 60)  return "Missed";
      if (minutesLate > 0)   return "Not arrived";
      return "Upcoming";
    }

    const scheduled = this.parseScheduledTime(assignment);
    if (!scheduled) return "Completed";
    const started   = new Date(lastSession.sessionStart);
    const minutesLate = (started.getTime() - scheduled.getTime()) / 60000;
    if (minutesLate <= 15) return "Arrived on time";
    return "Arrived late";
  }

  private parseScheduledTime(a: BTLAssignment): Date | null {
    try {
      const now = new Date();
      const hourMatch = a.scheduledTimeSlot.match(/(\d+)(am|pm)/i);
      if (!hourMatch) return null;
      let hour = parseInt(hourMatch[1]);
      if (hourMatch[2].toLowerCase() === "pm" && hour !== 12) hour += 12;
      const d = new Date(now);
      d.setHours(hour, 0, 0, 0);
      return d;
    } catch { return null; }
  }

  // ── Alerts ──────────────────────────────────────────────────────────────────

  private emitAlert(alert: Omit<BTLAlert, "id" | "createdAt" | "read">) {
    const full: BTLAlert = {
      ...alert,
      id:        `BTLALERT-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read:      false,
    };
    try {
      const existing: BTLAlert[] = JSON.parse(localStorage.getItem(ALERT_KEY) || "[]");
      existing.unshift(full);
      localStorage.setItem(ALERT_KEY, JSON.stringify(existing.slice(0, 200)));
    } catch {}
  }

  getAlerts(smId?: string, supervisorId?: string): BTLAlert[] {
    try {
      const all: BTLAlert[] = JSON.parse(localStorage.getItem(ALERT_KEY) || "[]");
      return all.filter(a =>
        (!smId         || a.smId         === smId) &&
        (!supervisorId || a.supervisorId === supervisorId)
      );
    } catch { return []; }
  }

  markAlertRead(alertId: string) {
    try {
      const alerts: BTLAlert[] = JSON.parse(localStorage.getItem(ALERT_KEY) || "[]");
      localStorage.setItem(ALERT_KEY, JSON.stringify(
        alerts.map(a => a.id === alertId ? { ...a, read: true } : a)
      ));
    } catch {}
  }

  // ── Location status helpers (for SM module) ──────────────────────────────────

  updateLocationStatus(locationId: string, status: LocationStatus) {
    const list = this.getAll().map(a =>
      a.locationId === locationId ? { ...a, locationStatus: status } : a
    );
    this.save(list);

    if (status === "At Risk" || status === "Inactive") {
      const assignment = this.getAll().find(a => a.locationId === locationId);
      if (assignment) {
        this.emitAlert({
          type: status === "At Risk" ? "location_at_risk" : "location_inactive",
          supervisorId: assignment.supervisorId,
          supervisorName: assignment.supervisorName,
          locationId,
          locationName: assignment.locationName,
          smId: assignment.smId,
          message: status === "At Risk"
            ? `Location ${assignment.locationName} is At Risk — fewer than 5 leads this month. SM re-engagement required.`
            : `Location ${assignment.locationName} is Inactive — 0 leads this month. Urgent SM action required.`,
          severity: status === "Inactive" ? "High" : "Medium",
        });
      }
    }
  }
}

export const btlAssignmentService = new BTLAssignmentService();
