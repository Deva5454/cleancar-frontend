/**
 * washerLocationService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Live GPS tracking for washers.
 *
 * FLOW:
 *   1. Washer checks in → startTracking(washerId, jobId) called
 *   2. navigator.geolocation.watchPosition fires every 30 seconds
 *   3. Each position pushed to Railway: PATCH /api/v1/washers/:id/location
 *   4. Also stored in localStorage for offline resilience
 *   5. If location permission denied or turned off → stopTracking() fires
 *      → auto checkout triggered + alert sent to Supervisor/TSM/Admin/Super Admin
 *   6. Washer job status changes to "In Transit" → tracking link sent to customer
 *
 * TRACKING LINK: https://249carwashing.genxa.in/track/:jobId
 * Opens WasherTrackingPage.tsx — public page, no login required
 */

// Confirmed directly: there is no real Railway backend for this project.
// If VITE_API_URL is still set to it in Vercel, treat that the same as
// not being configured at all, rather than attempting a doomed request.
const CONFIGURED_URL = import.meta.env.VITE_API_URL;
const KNOWN_DEAD_BACKEND = "cleancar-backend-production.up.railway.app";
const BASE = (CONFIGURED_URL && !CONFIGURED_URL.includes(KNOWN_DEAD_BACKEND) ? CONFIGURED_URL : "").replace(/\/$/, "");
const LOCATION_KEY = "cc360_washer_locations";

export interface WasherLocation {
  washerId:  string;
  jobId?:    string;
  lat:       number;
  lng:       number;
  accuracy:  number;
  timestamp: string;
  heading?:  number;
  speed?:    number;
}

export interface TrackingSession {
  washerId:    string;
  jobId?:      string;
  watchId?:    number;
  active:      boolean;
  startedAt:   string;
  lastUpdated?: string;
  stopReason?: "CHECKOUT" | "LOCATION_OFF" | "JOB_COMPLETE";
}

let activeSession: TrackingSession | null = null;
let onLocationOffCallback: ((washerId: string) => void) | null = null;

// ── Start tracking ────────────────────────────────────────────────────────────
export function startTracking(washerId: string, jobId?: string): void {
  if (!("geolocation" in navigator)) {
    console.warn("[WasherLocation] Geolocation not supported");
    return;
  }

  activeSession = {
    washerId,
    jobId,
    active: true,
    startedAt: new Date().toISOString(),
  };

  const watchId = navigator.geolocation.watchPosition(
    (pos) => handlePosition(pos, washerId, jobId),
    (err) => handleLocationError(err, washerId),
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    }
  );

  activeSession.watchId = watchId;
  console.log("[WasherLocation] Tracking started for", washerId);

  // Also push location every 30 seconds as heartbeat
  setInterval(() => {
    if (activeSession?.active) {
      navigator.geolocation.getCurrentPosition(
        (pos) => handlePosition(pos, washerId, jobId),
        (err) => handleLocationError(err, washerId),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, 30000);
}

// ── Stop tracking ─────────────────────────────────────────────────────────────
export function stopTracking(reason: TrackingSession["stopReason"] = "CHECKOUT"): void {
  if (!activeSession) return;
  if (activeSession.watchId !== undefined) {
    navigator.geolocation.clearWatch(activeSession.watchId);
  }
  activeSession.active = false;
  activeSession.stopReason = reason;
  console.log("[WasherLocation] Tracking stopped:", reason);
  activeSession = null;
}

// ── Handle incoming position ──────────────────────────────────────────────────
function handlePosition(pos: GeolocationPosition, washerId: string, jobId?: string): void {
  const loc: WasherLocation = {
    washerId,
    jobId,
    lat:       pos.coords.latitude,
    lng:       pos.coords.longitude,
    accuracy:  pos.coords.accuracy,
    timestamp: new Date().toISOString(),
    heading:   pos.coords.heading ?? undefined,
    speed:     pos.coords.speed ?? undefined,
  };

  // Store locally
  storeLocation(loc);

  // Push to Railway (non-blocking)
  if (BASE) {
    fetch(`${BASE}/jobs/${jobId}/location`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loc),
    }).catch(() => {/* offline — local store handles it */});
  }

  // Fire DOM event for real-time map update
  window.dispatchEvent(new CustomEvent("cc360:washer_location_update", { detail: loc }));

  if (activeSession) activeSession.lastUpdated = loc.timestamp;
}

// ── Handle location error (permission denied / turned off) ───────────────────
function handleLocationError(err: GeolocationPositionError, washerId: string): void {
  console.warn("[WasherLocation] Error:", err.code, err.message);

  if (err.code === GeolocationPositionError.PERMISSION_DENIED ||
      err.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
    // Location turned off → trigger auto-checkout flow
    stopTracking("LOCATION_OFF");

    // Fire event for WasherCheckOut component to handle
    window.dispatchEvent(new CustomEvent("cc360:location_off_auto_checkout", {
      detail: { washerId, reason: "Location permission denied or turned off" }
    }));

    // Notify supervisor chain via tatTrackingService notifications
    notifyLocationOff(washerId);

    if (onLocationOffCallback) onLocationOffCallback(washerId);
  }
}

// ── Notify chain when location is turned off ─────────────────────────────────
function notifyLocationOff(washerId: string): void {
  const now = new Date().toISOString();
  const alertMsg = `⚠️ LOCATION OFF — Auto Checkout\nWasher ID: ${washerId} has been automatically checked out because location was turned off.\nWasher must request supervisor to re-check in.`;

  // Store alert in localStorage for notification bell
  try {
    const alerts = JSON.parse(localStorage.getItem("cc360_location_alerts") || "[]");
    alerts.unshift({ washerId, reason: "LOCATION_OFF", timestamp: now, message: alertMsg });
    localStorage.setItem("cc360_location_alerts", JSON.stringify(alerts.slice(0, 50)));
  } catch {}

  // Fire DOM event for TATNotificationBell and supervisor app
  window.dispatchEvent(new CustomEvent("cc360:washer_location_alert", {
    detail: { washerId, reason: "LOCATION_OFF", timestamp: now, message: alertMsg }
  }));

  // Push to Railway
  if (BASE) {
    fetch(`${BASE}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "LOCATION_OFF_AUTO_CHECKOUT",
        recipientRoles: ["SUPERVISOR", "TSM", "SUPER_ADMIN"],
        washerId,
        message: alertMsg,
        severity: "WARNING",
        createdAt: now,
      }),
    }).catch(() => {});
  }
}

// ── Local storage helpers ─────────────────────────────────────────────────────
function storeLocation(loc: WasherLocation): void {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCATION_KEY) || "{}");
    stored[loc.washerId] = loc;
    localStorage.setItem(LOCATION_KEY, JSON.stringify(stored));
  } catch {}
}

export function getLastLocation(washerId: string): WasherLocation | null {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCATION_KEY) || "{}");
    return stored[washerId] || null;
  } catch { return null; }
}

// ── Get tracking URL for a job ────────────────────────────────────────────────
export function getTrackingUrl(jobId: string): string {
  return `https://249carwashing.genxa.in/track/${jobId}`;
}

// ── Get active session ────────────────────────────────────────────────────────
export function getActiveSession(): TrackingSession | null {
  return activeSession;
}

// ── Register callback for location-off event ─────────────────────────────────
export function onLocationOff(cb: (washerId: string) => void): void {
  onLocationOffCallback = cb;
}
