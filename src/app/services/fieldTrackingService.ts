/**
 * fieldTrackingService.ts
 *
 * Manages field attendance (check-in / check-out) and GPS trail
 * for Sales Head, Sales Manager, and Supervisor.
 *
 * Rules:
 *   1. Check-in = selfie + GPS captured → attendance starts
 *   2. Location tracked every 2 minutes while checked in
 *   3. If app detects geolocation.watchPosition fires an error code
 *      PERMISSION_DENIED (user revoked from phone settings) → auto check-out
 *      with reason "location_revoked"
 *   4. Network loss / technical error (POSITION_UNAVAILABLE, TIMEOUT) →
 *      silently retry — NOT an auto check-out
 *   5. Reinstatement request required after auto-checkout-on-revoke
 *   6. Manual checkout = user taps Check-Out button → selfie captured
 *   7. Full GPS trail stored as array of { lat, lng, ts, accuracy, speed }
 *   8. Trail exported as JSON / viewable on map
 */

export interface GeoPoint {
  lat: number;
  lng: number;
  ts: string;            // ISO timestamp
  accuracy: number;      // metres
  speed: number | null;  // m/s, null if unavailable
}

export type CheckOutReason =
  | "manual"             // user tapped Check-Out
  | "location_revoked"   // PERMISSION_DENIED fired mid-session
  | "auto_23_59"         // system auto-checkout at 23:59
  | "reinstated";        // admin reinstated after auto-checkout

export type AttendanceRegStatus = "Pending" | "Approved" | "Rejected";

export interface FieldSession {
  id: string;
  employeeId: string;
  employeeName: string;
  role: "Sales Head" | "Sales Manager" | "Supervisor";
  date: string;                // YYYY-MM-DD
  checkInTime: string;         // ISO
  checkInSelfieBase64: string; // data:image/jpeg;base64,...
  checkInLocation: GeoPoint;
  checkOutTime: string | null;
  checkOutSelfieBase64: string | null;
  checkOutReason: CheckOutReason | null;
  trail: GeoPoint[];           // chronological GPS breadcrumbs
  totalDistanceKm: number;     // computed on check-out
  reinstateRequest: {
    submittedAt: string;
    reason: string;
    status: "Pending" | "Approved" | "Rejected";
    reviewedBy?: string;
    reviewedAt?: string;
  } | null;
  // Attendance regularisation — for auto-checkout or missed check-in/out
  attendanceReg: {
    type: "auto_checkout" | "location_revoked" | "missed_checkout";
    submittedAt: string;
    reason: string;
    status: AttendanceRegStatus;
    reviewedBy?: string;
    reviewedAt?: string;
  } | null;
  isAutoCheckout: boolean;  // true if system forced the checkout (23:59 or location_revoked)
  viewOnly: boolean;        // true after checkout — data can only be viewed, not modified
}

export interface TrackingState {
  isCheckedIn: boolean;
  session: FieldSession | null;
  watcherId: number | null;    // GeolocationWatch ID
  locationPermission: PermissionState | "unknown";
  lastError: string | null;
}

// ── Haversine distance ────────────────────────────────────────────────────────

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function totalDistance(trail: GeoPoint[]): number {
  let d = 0;
  for (let i = 1; i < trail.length; i++) {
    d += haversineKm(trail[i - 1], trail[i]);
  }
  return Math.round(d * 100) / 100;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

// ── Timing rules ─────────────────────────────────────────────────────────────
export const FIELD_HOURS = {
  CHECK_IN_HOUR:       10,   // Scheduled start: 10:00 AM
  SUGGESTED_CHECKOUT:  19,   // Suggested end: 7:00 PM
  HARD_CHECKOUT_HOUR:  23,   // Auto-checkout at 23:59 if still checked in
  HARD_CHECKOUT_MIN:   59,
} as const;

const SK = {
  SESSIONS:        "field_sessions_v1",
  ACTIVE:          "field_active_session_id",
  WATCHER_FLAG:    "field_watcher_active",
  OFFLINE_QUEUE:   "field_offline_gps_queue",  // buffered GPS points when no network
} as const;

// ── Offline GPS queue (for lifts / basements / no network) ────────────────────
interface OfflineGeoPoint extends GeoPoint {
  sessionId: string;
}

function loadOfflineQueue(): OfflineGeoPoint[] {
  try { return JSON.parse(localStorage.getItem(SK.OFFLINE_QUEUE) || "[]"); } catch { return []; }
}
function saveOfflineQueue(q: OfflineGeoPoint[]): void {
  localStorage.setItem(SK.OFFLINE_QUEUE, JSON.stringify(q));
}

export function loadSessions(): FieldSession[] {
  try { return JSON.parse(localStorage.getItem(SK.SESSIONS) || "[]"); } catch { return []; }
}

function saveSessions(ss: FieldSession[]): void {
  localStorage.setItem(SK.SESSIONS, JSON.stringify(ss));
}

function upsertSession(session: FieldSession): void {
  const all = loadSessions().filter(s => s.id !== session.id);
  saveSessions([...all, session]);
}

// ── Roles that require field tracking ─────────────────────────────────────────

export const FIELD_TRACKING_ROLES = [
  "Car Washer",
  "Operations Manager",
  "Supervisor",
  "Sales Manager",
  "Sales Head",
] as const;

// Role colours for map pins and UI badges
export const ROLE_COLORS: Record<string, { pin: string; badge: string; text: string }> = {
  "Car Washer":         { pin: "#3b82f6", badge: "bg-blue-100",   text: "text-blue-800" },
  "Operations Manager": { pin: "#f59e0b", badge: "bg-amber-100",  text: "text-amber-800" },
  "Supervisor":         { pin: "#ef4444", badge: "bg-red-100",    text: "text-red-800" },
  "Sales Manager":      { pin: "#22c55e", badge: "bg-green-100",  text: "text-green-800" },
  "Sales Head":         { pin: "#0ea5e9", badge: "bg-sky-100",    text: "text-sky-800" },
};

// Shift timing per role — used for auto-prompt and auto-checkout
export const ROLE_SHIFT: Record<string, { startTime: string; endTime: string }> = {
  "Car Washer":         { startTime: "05:00", endTime: "09:00" },
  "Operations Manager": { startTime: "10:00", endTime: "19:00" },
  "Supervisor":         { startTime: "10:00", endTime: "19:00" },
  "Sales Manager":      { startTime: "10:00", endTime: "19:00" },
  "Sales Head":         { startTime: "10:00", endTime: "19:00" },
};

// ── Attendance Status ──────────────────────────────────────────────────────
export type AttendanceStatus = "Present" | "Late" | "Half Day" | "Absent" | "Holiday" | "Weekend";

export interface DailyAttendance {
  date: string;                    // YYYY-MM-DD
  employeeId: string;
  employeeName: string;
  role: string;
  status: AttendanceStatus;
  checkInTime: string | null;      // ISO
  checkOutTime: string | null;     // ISO
  shiftStartTime: string;          // "05:00" or "10:00"
  shiftEndTime: string;            // "09:00" or "19:00"
  lateMinutes: number;             // 0 if on time
  earlyLeaveMinutes: number;       // 0 if full day
  totalHoursWorked: number;        // decimal hours
  requiredHours: number;           // shift duration in hours
  selfieBase64: string;
  gpsLat: number | null;
  gpsLng: number | null;
  sessionId: string | null;
}

/**
 * Calculate attendance status from a FieldSession.
 * Rules:
 *   - No check-in today = Absent
 *   - Check-in within 15 mins of shift start = Present
 *   - Check-in 16-60 mins after shift start = Late
 *   - Check-in > 60 mins after shift start = Half Day
 *   - Worked < 50% of shift duration = Half Day (even if on time)
 */
export function calcAttendance(session: FieldSession | null, date: string, employeeId: string, employeeName: string, role: string): DailyAttendance {
  const roleShift = ROLE_SHIFT[role] || { startTime: "10:00", endTime: "19:00" };
  const [startH, startM] = roleShift.startTime.split(":").map(Number);
  const [endH, endM] = roleShift.endTime.split(":").map(Number);
  const requiredHours = (endH + endM/60) - (startH + startM/60);

  const base: DailyAttendance = {
    date, employeeId, employeeName, role,
    status: "Absent",
    checkInTime: null,
    checkOutTime: null,
    shiftStartTime: roleShift.startTime,
    shiftEndTime: roleShift.endTime,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    totalHoursWorked: 0,
    requiredHours,
    selfieBase64: "",
    gpsLat: null,
    gpsLng: null,
    sessionId: null,
  };

  if (!session) return base;

  const checkIn = new Date(session.checkInTime);
  const shiftStart = new Date(date + "T" + roleShift.startTime + ":00");
  const shiftEnd   = new Date(date + "T" + roleShift.endTime   + ":00");
  const lateMinutes = Math.max(0, Math.round((checkIn.getTime() - shiftStart.getTime()) / 60000));

  let totalHoursWorked = 0;
  let earlyLeaveMinutes = 0;
  let checkOutTime: string | null = null;

  if (session.checkOutTime) {
    const checkOut = new Date(session.checkOutTime);
    checkOutTime = session.checkOutTime;
    totalHoursWorked = Math.max(0, (checkOut.getTime() - checkIn.getTime()) / 3600000);
    earlyLeaveMinutes = Math.max(0, Math.round((shiftEnd.getTime() - checkOut.getTime()) / 60000));
  } else {
    // Still checked in — calculate hours so far
    totalHoursWorked = Math.max(0, (Date.now() - checkIn.getTime()) / 3600000);
  }

  // Determine status
  let status: AttendanceStatus;
  if (lateMinutes <= 15) {
    status = totalHoursWorked >= requiredHours * 0.5 ? "Present" : "Half Day";
  } else if (lateMinutes <= 60) {
    status = totalHoursWorked >= requiredHours * 0.5 ? "Late" : "Half Day";
  } else {
    status = "Half Day";
  }

  return {
    ...base,
    status,
    checkInTime: session.checkInTime,
    checkOutTime,
    lateMinutes,
    earlyLeaveMinutes,
    totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
    selfieBase64: session.checkInSelfieBase64 || "",
    gpsLat: session.checkInLocation?.lat || null,
    gpsLng: session.checkInLocation?.lng || null,
    sessionId: session.id,
  };
}

/**
 * Get attendance records for a date range for all sessions.
 * Returns one DailyAttendance per employee per day.
 */
export function getAttendanceForDateRange(
  employeeIds: string[],
  employeeMap: Record<string, { name: string; role: string }>,
  startDate: string,
  endDate: string
): DailyAttendance[] {
  const sessions = loadSessions();
  const results: DailyAttendance[] = [];
  
  const start = new Date(startDate);
  const end   = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const isWeekend = d.getDay() === 0; // Sunday off
    
    for (const empId of employeeIds) {
      const emp = employeeMap[empId];
      if (!emp) continue;
      
      if (isWeekend) {
        results.push({
          date: dateStr, employeeId: empId, employeeName: emp.name, role: emp.role,
          status: "Weekend", checkInTime: null, checkOutTime: null,
          shiftStartTime: ROLE_SHIFT[emp.role]?.startTime || "10:00",
          shiftEndTime:   ROLE_SHIFT[emp.role]?.endTime   || "19:00",
          lateMinutes: 0, earlyLeaveMinutes: 0, totalHoursWorked: 0,
          requiredHours: 0, selfieBase64: "", gpsLat: null, gpsLng: null, sessionId: null,
        });
        continue;
      }
      
      const session = sessions.find(s => s.employeeId === empId && s.date === dateStr) || null;
      results.push(calcAttendance(session, dateStr, empId, emp.name, emp.role));
    }
  }
  
  return results.sort((a, b) => a.date.localeCompare(b.date));
}

export type FieldTrackingRole = typeof FIELD_TRACKING_ROLES[number];

export function isFieldTrackingRole(role: string): role is FieldTrackingRole {
  return FIELD_TRACKING_ROLES.includes(role as FieldTrackingRole);
}

// ── Live location snapshot (for Super Admin view) ──────────────────────────────

export interface LiveLocation {
  employeeId: string;
  employeeName: string;
  role: string;
  lat: number;
  lng: number;
  accuracy: number;
  lastUpdated: string;       // ISO
  sessionId: string;
  isCheckedIn: boolean;
  totalDistanceKm: number;
  elapsedMinutes: number;
}


// ── Service class ─────────────────────────────────────────────────────────────

class FieldTrackingService {
  private state: TrackingState = {
    isCheckedIn: false,
    session: null,
    watcherId: null,
    locationPermission: "unknown",
    lastError: null,
  };

  private listeners: Array<(state: TrackingState) => void> = [];

  constructor() {
    this._rehydrate();
  }

  /** Reload any active session from storage on page load */
  private _rehydrate() {
    const activeId = localStorage.getItem(SK.ACTIVE);
    if (!activeId) return;
    const session = loadSessions().find(s => s.id === activeId && !s.checkOutTime);
    if (session) {
      this.state.isCheckedIn = true;
      this.state.session = session;
    }
  }

  private _emit() {
    const snapshot = { ...this.state };
    this.listeners.forEach(fn => fn(snapshot));
  }

  subscribe(fn: (state: TrackingState) => void): () => void {
    this.listeners.push(fn);
    fn({ ...this.state }); // immediate call
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  getState(): TrackingState { return { ...this.state }; }

  // ── Check-In ───────────────────────────────────────────────────────────────

  async checkIn(params: {
    employeeId: string;
    employeeName: string;
    role: string;
    selfieBase64: string;
    shiftStartTime?: string;  // e.g. "05:00" — overrides FIELD_HOURS.CHECK_IN_HOUR
    shiftEndTime?: string;    // e.g. "09:00" — overrides FIELD_HOURS.SUGGESTED_CHECKOUT
  }): Promise<{ ok: boolean; error?: string }> {

    if (this.state.isCheckedIn) return { ok: false, error: "Already checked in" };

    // Capture current GPS
    let geoPoint: GeoPoint;
    try {
      geoPoint = await this._getCurrentPosition();
    } catch (e: any) {
      return { ok: false, error: e.message };
    }

    const now = new Date().toISOString();
    const roleShift = ROLE_SHIFT[params.role] || { startTime: "10:00", endTime: "19:00" };
    const session: FieldSession = {
      id: `FS-${Date.now()}`,
      employeeId: params.employeeId,
      employeeName: params.employeeName,
      role: params.role,
      date: now.slice(0, 10),
      shiftStartTime: params.shiftStartTime || roleShift.startTime,
      shiftEndTime: params.shiftEndTime || roleShift.endTime,
      checkInTime: now,
      checkInSelfieBase64: params.selfieBase64,
      checkInLocation: geoPoint,
      checkOutTime: null,
      checkOutSelfieBase64: null,
      checkOutReason: null,
      trail: [geoPoint],
      totalDistanceKm: 0,
      reinstateRequest: null,
      attendanceReg: null,
      isAutoCheckout: false,
      viewOnly: false,
    };

    upsertSession(session);
    localStorage.setItem(SK.ACTIVE, session.id);

    this.state.isCheckedIn = true;
    this.state.session = session;
    this.state.lastError = null;

    this._startWatcher();
    this._emit();
    return { ok: true };
  }

  // ── Manual Check-Out ───────────────────────────────────────────────────────

  async checkOut(selfieBase64: string): Promise<{ ok: boolean; error?: string }> {
    if (!this.state.isCheckedIn || !this.state.session) {
      return { ok: false, error: "Not checked in" };
    }
    let geoPoint: GeoPoint | null = null;
    try { geoPoint = await this._getCurrentPosition(); } catch {}

    return this._finaliseSession("manual", selfieBase64, geoPoint);
  }

  // ── Auto Check-Out (location revoked) ─────────────────────────────────────

  private _autoCheckOut(reason: "location_revoked") {
    if (!this.state.isCheckedIn || !this.state.session) return;
    this._finaliseSession(reason, null, null);
  }

  private _finaliseSession(
    reason: CheckOutReason,
    selfieBase64: string | null,
    finalGeo: GeoPoint | null
  ): { ok: boolean } {
    this._stopWatcher();
    const s = this.state.session!;
    const trail = finalGeo ? [...s.trail, finalGeo] : s.trail;

    const isAuto = reason === "location_revoked" || reason === "auto_23_59";
    const updated: FieldSession = {
      ...s,
      checkOutTime: new Date().toISOString(),
      checkOutSelfieBase64: selfieBase64,
      checkOutReason: reason,
      trail,
      totalDistanceKm: totalDistance(trail),
      isAutoCheckout: isAuto,
      viewOnly: true,
      // Pre-populate attendanceReg for auto-checkouts
      attendanceReg: isAuto && !s.attendanceReg ? {
        type: reason === "auto_23_59" ? "auto_checkout" : "location_revoked",
        submittedAt: "",   // user must submit
        reason: "",
        status: "Pending",
      } : s.attendanceReg,
    };

    upsertSession(updated);
    localStorage.removeItem(SK.ACTIVE);

    this.state.isCheckedIn = false;
    this.state.session = updated;
    this.state.watcherId = null;
    this._emit();
    return { ok: true };
  }

  // ── GPS Watcher ────────────────────────────────────────────────────────────

  private _startWatcher() {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => this._onPosition(pos),
      (err) => this._onWatchError(err),
      {
        enableHighAccuracy: true,
        maximumAge: 15000,        // accept 15s old position
        timeout: 30000,
      }
    );

    this.state.watcherId = id;
    localStorage.setItem(SK.WATCHER_FLAG, "1");
  }

  private _stopWatcher() {
    if (this.state.watcherId !== null) {
      navigator.geolocation?.clearWatch(this.state.watcherId);
      this.state.watcherId = null;
    }
    localStorage.removeItem(SK.WATCHER_FLAG);
  }

  private _onPosition(pos: GeolocationPosition) {
    if (!this.state.isCheckedIn || !this.state.session) return;

    const pt: GeoPoint = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      ts: new Date(pos.timestamp).toISOString(),
      accuracy: Math.round(pos.coords.accuracy),
      speed: pos.coords.speed,
    };

    // Only append if moved ≥10m or last point is >2 minutes old
    const trail = this.state.session.trail;
    const last = trail[trail.length - 1];
    const timeDiff = (new Date(pt.ts).getTime() - new Date(last.ts).getTime()) / 1000;
    const dist = haversineKm(last, pt) * 1000; // metres

    if (dist >= 10 || timeDiff >= 120) {
      const updatedTrail = [...trail, pt];
      const updatedSession: FieldSession = {
        ...this.state.session,
        trail: updatedTrail,
        totalDistanceKm: totalDistance(updatedTrail),
      };
      upsertSession(updatedSession);
      this.state.session = updatedSession;
      this._emit();
    }
  }

  private _onWatchError(err: GeolocationPositionError) {
    if (err.code === err.PERMISSION_DENIED) {
      // User revoked location from phone settings → auto check-out
      this.state.lastError = "Location access revoked — auto check-out triggered";
      this._emit();
      this._autoCheckOut("location_revoked");
    }
    // POSITION_UNAVAILABLE (code 2) or TIMEOUT (code 3) = network/technical issue
    // → silently ignore, watcher continues, no auto check-out
    else {
      this.state.lastError = `GPS error (code ${err.code}) — retrying`;
      this._emit();
    }
  }

  // ── Reinstatement ──────────────────────────────────────────────────────────

  // ── Offline GPS sync — flush queued points into session ──────────────────
  flushOfflineQueue(): void {
    const queue = loadOfflineQueue();
    if (queue.length === 0) return;
    const sessions = loadSessions();
    for (const pt of queue) {
      const idx = sessions.findIndex(s => s.id === pt.sessionId);
      if (idx === -1) continue;
      const trail = sessions[idx].trail;
      const { sessionId: _sid, ...geoPoint } = pt;
      // Insert in chronological order
      const insertAt = trail.findIndex(t => t.ts > geoPoint.ts);
      if (insertAt === -1) {
        trail.push(geoPoint);
      } else {
        trail.splice(insertAt, 0, geoPoint);
      }
      sessions[idx].totalDistanceKm = totalDistance(trail);
    }
    saveSessions(sessions);
    saveOfflineQueue([]);
    // Update in-memory session if it's the active one
    const activeId = localStorage.getItem(SK.ACTIVE);
    if (activeId && this.state.session?.id === activeId) {
      const updated = sessions.find(s => s.id === activeId);
      if (updated) {
        this.state.session = updated;
        this._emit();
      }
    }
  }

  /** Queue a GPS point for offline sync (lift / basement / no network) */
  queueOfflinePoint(pt: GeoPoint): void {
    if (!this.state.session) return;
    const queue = loadOfflineQueue();
    queue.push({ ...pt, sessionId: this.state.session.id });
    saveOfflineQueue(queue);
  }

  /** Check if auto-checkout at 23:59 is needed — call periodically from UI */
  checkAutoCheckout(): void {
    if (!this.state.isCheckedIn || !this.state.session) return;
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    if (h >= FIELD_HOURS.HARD_CHECKOUT_HOUR && m >= FIELD_HOURS.HARD_CHECKOUT_MIN) {
      this._finaliseSession("auto_23_59", null, null);
    }
  }

  /** Submit attendance regularisation request (after auto-checkout) */
  submitAttendanceReg(sessionId: string, reason: string): { ok: boolean; error?: string } {
    const sessions = loadSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return { ok: false, error: "Session not found" };
    const s = sessions[idx];
    if (!s.isAutoCheckout) return { ok: false, error: "Regularisation only needed for auto-checkout sessions" };
    sessions[idx].attendanceReg = {
      type: s.checkOutReason === "auto_23_59" ? "auto_checkout" : "location_revoked",
      submittedAt: new Date().toISOString(),
      reason,
      status: "Pending",
    };
    saveSessions(sessions);
    // Update in-memory
    if (this.state.session?.id === sessionId) {
      this.state.session = sessions[idx];
      this._emit();
    }
    return { ok: true };
  }

  /** Admin: approve/reject attendance reg */
  reviewAttendanceReg(sessionId: string, status: AttendanceRegStatus, reviewer: string): { ok: boolean } {
    const sessions = loadSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return { ok: false };
    if (sessions[idx].attendanceReg) {
      sessions[idx].attendanceReg!.status = status;
      sessions[idx].attendanceReg!.reviewedBy = reviewer;
      sessions[idx].attendanceReg!.reviewedAt = new Date().toISOString();
    }
    saveSessions(sessions);
    return { ok: true };
  }

  submitReinstateRequest(sessionId: string, reason: string): { ok: boolean; error?: string } {
    const sessions = loadSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return { ok: false, error: "Session not found" };
    if (sessions[idx].checkOutReason !== "location_revoked") {
      return { ok: false, error: "Reinstatement only needed for auto-checkout sessions" };
    }
    sessions[idx].reinstateRequest = {
      submittedAt: new Date().toISOString(),
      reason,
      status: "Pending",
    };
    saveSessions(sessions);
    return { ok: true };
  }

  approveReinstateRequest(sessionId: string, reviewerName: string): { ok: boolean } {
    const sessions = loadSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return { ok: false };
    if (sessions[idx].reinstateRequest) {
      sessions[idx].reinstateRequest!.status = "Approved";
      sessions[idx].reinstateRequest!.reviewedBy = reviewerName;
      sessions[idx].reinstateRequest!.reviewedAt = new Date().toISOString();
      sessions[idx].checkOutReason = "reinstated";
    }
    saveSessions(sessions);
    return { ok: true };
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  getSessionsForDate(date: string): FieldSession[] {
    return loadSessions().filter(s => s.date === date);
  }

  getSessionsForEmployee(employeeId: string, limit = 30): FieldSession[] {
    return loadSessions()
      .filter(s => s.employeeId === employeeId)
      .sort((a, b) => b.checkInTime.localeCompare(a.checkInTime))
      .slice(0, limit);
  }

  getAllPendingReinstate(): FieldSession[] {
    return loadSessions().filter(
      s => s.reinstateRequest?.status === "Pending"
    );
  }

  private async _getCurrentPosition(): Promise<GeoPoint> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported on this device"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          ts: new Date(pos.timestamp).toISOString(),
          accuracy: Math.round(pos.coords.accuracy),
          speed: pos.coords.speed,
        }),
        (err) => {
          const msg = err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please enable location access to check in."
            : "Could not get current location. Please try again.";
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  // ── Live location query (Super Admin) ─────────────────────────────────────

  /** Returns last known location for every active field session */
  getLiveLocations(): LiveLocation[] {
    const sessions = loadSessions();
    const active = sessions.filter(s => !s.checkOutTime);
    return active.map(s => {
      const last = s.trail[s.trail.length - 1] ?? s.checkInLocation;
      const elapsedMs = Date.now() - new Date(s.checkInTime).getTime();
      return {
        employeeId:     s.employeeId,
        employeeName:   s.employeeName,
        role:           s.role,
        lat:            last.lat,
        lng:            last.lng,
        accuracy:       last.accuracy,
        lastUpdated:    last.ts,
        sessionId:      s.id,
        isCheckedIn:    true,
        totalDistanceKm: s.totalDistanceKm,
        elapsedMinutes: Math.round(elapsedMs / 60000),
      };
    });
  }

  /** Last known location for a specific employee (including completed sessions today) */
  getLastKnownLocation(employeeId: string): LiveLocation | null {
    const today = new Date().toISOString().slice(0, 10);
    const sessions = this.getSessionsForEmployee(employeeId, 5)
      .filter(s => s.date === today);
    if (!sessions.length) return null;
    const s = sessions[0];
    const last = s.trail[s.trail.length - 1] ?? s.checkInLocation;
    return {
      employeeId: s.employeeId,
      employeeName: s.employeeName,
      role: s.role,
      lat: last.lat,
      lng: last.lng,
      accuracy: last.accuracy,
      lastUpdated: last.ts,
      sessionId: s.id,
      isCheckedIn: !s.checkOutTime,
      totalDistanceKm: s.totalDistanceKm,
      elapsedMinutes: Math.round(
        (new Date(s.checkOutTime ?? new Date()).getTime() - new Date(s.checkInTime).getTime()) / 60000
      ),
    };
  }

}

export const fieldTrackingService = new FieldTrackingService();
