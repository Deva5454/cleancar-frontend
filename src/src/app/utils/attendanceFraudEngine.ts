/**
 * Attendance Fraud Detection Engine (MC-09)
 *
 * Detects suspicious attendance patterns:
 * - GPS_MISMATCH: Check-in outside work location
 * - TIME_ANOMALY: Impossible time gaps
 * - MULTI_DEVICE: Multiple devices same day
 * - DUPLICATE: Duplicate check-ins
 *
 * IMPORTANT: This engine ONLY flags records, never blocks them
 */

import { AttendanceRecord } from "../contexts/AttendanceContext";

interface Employee {
  workLocation?: {
    lat: number;
    lng: number;
    radius: number;
  };
}

interface FraudCheckResult {
  flag: "GPS_MISMATCH" | "TIME_ANOMALY" | "DUPLICATE" | "MULTI_DEVICE";
  reason: string;
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * @returns Distance in meters
 */
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if check-in location is within allowed work zone
 */
export function checkGPS(
  record: AttendanceRecord,
  employee: Employee
): FraudCheckResult | null {
  // Skip if no GPS data or no work location defined
  if (!record.gpsLat || !record.gpsLng || !employee.workLocation) {
    return null;
  }

  const distance = getDistance(
    record.gpsLat,
    record.gpsLng,
    employee.workLocation.lat,
    employee.workLocation.lng
  );

  if (distance > employee.workLocation.radius) {
    return {
      flag: "GPS_MISMATCH",
      reason: `Check-in ${Math.round(distance)}m away from work location (allowed: ${employee.workLocation.radius}m)`,
    };
  }

  return null;
}

/**
 * Check for impossible time gaps between consecutive check-ins
 */
export function checkTimeAnomaly(
  record: AttendanceRecord,
  previousRecord?: AttendanceRecord
): FraudCheckResult | null {
  if (!previousRecord || !previousRecord.checkOutTime || !record.checkInTime) {
    return null;
  }

  // Parse times
  const prevCheckOut = new Date(`${previousRecord.date}T${previousRecord.checkOutTime}`);
  const currentCheckIn = new Date(`${record.date}T${record.checkInTime}`);

  // Calculate time difference in hours
  const diffHours = (currentCheckIn.getTime() - prevCheckOut.getTime()) / (1000 * 60 * 60);

  // Flag if less than 2 hours between checkout and next checkin
  if (diffHours < 2 && diffHours > 0) {
    return {
      flag: "TIME_ANOMALY",
      reason: `Only ${diffHours.toFixed(1)} hours between previous checkout and current checkin (minimum: 2 hours)`,
    };
  }

  return null;
}

/**
 * Check for multiple devices used on same day (buddy punching indicator)
 */
export function checkDevice(
  record: AttendanceRecord,
  pastRecords: AttendanceRecord[]
): FraudCheckResult | null {
  if (!record.deviceId) {
    return null;
  }

  // Find all records for same employee on same date
  const sameDayRecords = pastRecords.filter(
    (r) =>
      r.employeeId === record.employeeId &&
      r.date === record.date &&
      r.attendanceId !== record.attendanceId // Exclude current record
  );

  // Check if a different device was used
  const differentDevice = sameDayRecords.find(
    (r) => r.deviceId && r.deviceId !== record.deviceId
  );

  if (differentDevice) {
    return {
      flag: "MULTI_DEVICE",
      reason: `Multiple devices detected on ${record.date} (current: ${record.deviceId.slice(0, 8)}..., previous: ${differentDevice.deviceId?.slice(0, 8)}...)`,
    };
  }

  return null;
}

/**
 * Check for duplicate check-ins on same day
 */
export function checkDuplicate(
  record: AttendanceRecord,
  pastRecords: AttendanceRecord[]
): FraudCheckResult | null {
  // Find existing check-ins for same employee on same date
  const duplicates = pastRecords.filter(
    (r) =>
      r.employeeId === record.employeeId &&
      r.date === record.date &&
      r.checkInTime &&
      r.attendanceId !== record.attendanceId // Exclude current record
  );

  if (duplicates.length > 0) {
    return {
      flag: "DUPLICATE",
      reason: `Duplicate check-in detected for ${record.date} (${duplicates.length} existing record${duplicates.length > 1 ? "s" : ""})`,
    };
  }

  return null;
}

/**
 * Main fraud detection function - runs all checks
 * @returns First detected fraud issue or null if clean
 */
export function detectFraud(
  record: AttendanceRecord,
  employee: Employee,
  pastRecords: AttendanceRecord[]
): FraudCheckResult | null {
  // Run all checks in priority order
  const gpsCheck = checkGPS(record, employee);
  if (gpsCheck) return gpsCheck;

  const duplicateCheck = checkDuplicate(record, pastRecords);
  if (duplicateCheck) return duplicateCheck;

  const deviceCheck = checkDevice(record, pastRecords);
  if (deviceCheck) return deviceCheck;

  // Find previous record for time anomaly check
  const employeeRecords = pastRecords
    .filter((r) => r.employeeId === record.employeeId)
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (b.checkOutTime || "").localeCompare(a.checkOutTime || "");
    });

  const previousRecord = employeeRecords[0];
  const timeCheck = checkTimeAnomaly(record, previousRecord);
  if (timeCheck) return timeCheck;

  return null;
}

/**
 * Get browser device ID (fingerprint)
 * Uses navigator properties to create a consistent device identifier
 */
export function getDeviceId(): string {
  // Try to get from localStorage first
  const storedId = localStorage.getItem("cleancar_device_id");
  if (storedId) return storedId;

  // Generate new device ID
  const deviceId = generateDeviceFingerprint();
  localStorage.setItem("cleancar_device_id", deviceId);
  return deviceId;
}

/**
 * Generate device fingerprint from browser properties
 */
function generateDeviceFingerprint(): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const txt = "CleanCar";

  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillText(txt, 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join("###");

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return `DEV-${Math.abs(hash).toString(36)}`;
}

/**
 * Get current GPS location from browser
 */
export function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
