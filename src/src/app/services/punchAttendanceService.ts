/**
 * Punch Attendance Service
 *
 * Single source of truth for all employee punch-in/punch-out operations.
 * Handles both OFFICE mode (browser, IP validation) and FIELD mode (mobile, GPS + selfie).
 *
 * CRITICAL RULES:
 * - GPS mismatch flags but does NOT block (same as washerAttendanceService)
 * - Duplicate prevention: one punch-in and one punch-out per employee per day
 * - Late minutes calculated against shift start time (09:00 default)
 * - All punches saved to DataService ATTENDANCE_RECORDS
 */

import { DataService } from "./DataService";
import { logger } from "./logger";

// ========== TYPES ==========

export type PunchMode = "OFFICE" | "FIELD";
export type PunchType = "PUNCH_IN" | "PUNCH_OUT";
export type PunchStatus = "SUCCESS" | "LATE" | "FLAGGED" | "BLOCKED";

export interface OfficeLocation {
  cityId: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number; // geofence radius for field
  allowedIPRanges: string[]; // for office punch validation
}

export interface PunchRecord {
  punchId: string;
  employeeId: string;
  employeeName: string;
  role: string;
  cityId: string;
  date: string; // YYYY-MM-DD
  punchType: PunchType;
  punchTime: string; // HH:MM:SS
  punchMode: PunchMode;
  // GPS (field only)
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracyMeters?: number;
  distanceFromOfficeMeters?: number;
  withinGeofence?: boolean;
  // Selfie (field only)
  selfieUrl?: string;
  // Office punch
  deviceFingerprint?: string;
  // Status
  status: PunchStatus;
  lateMinutes?: number;
  flag?: "NONE" | "GPS_MISMATCH" | "OUTSIDE_GEOFENCE" | "DUPLICATE" | "SUSPICIOUS_LOCATION";
  flagReason?: string;
  // Audit
  createdAt: string;
}

export interface PunchRequest {
  employeeId: string;
  employeeName: string;
  role: string;
  cityId: string;
  punchType: PunchType;
  punchMode: PunchMode;
  // Field punch only
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracyMeters?: number;
  selfieUrl?: string;
  // Office punch only
  deviceFingerprint?: string;
}

export interface PunchResult {
  success: boolean;
  punchRecord?: PunchRecord;
  status?: PunchStatus;
  message: string;
  lateMinutes?: number;
  flag?: string;
}

// ========== OFFICE LOCATIONS CONFIG ==========

export const OFFICE_LOCATIONS: Record<string, OfficeLocation> = {
  "CITY-SURAT": {
    cityId: "CITY-SURAT",
    name: "CleanCar 360 Surat Office",
    lat: 21.1702,
    lng: 72.8311,
    radiusMeters: 150,
    allowedIPRanges: ["192.168.1.", "10.0.0."],
  },
  "CITY-MUMBAI": {
    cityId: "CITY-MUMBAI",
    name: "CleanCar 360 Mumbai Office",
    lat: 19.076,
    lng: 72.8777,
    radiusMeters: 150,
    allowedIPRanges: ["192.168.2.", "10.0.1."],
  },
  "CITY-AHMEDABAD": {
    cityId: "CITY-AHMEDABAD",
    name: "CleanCar 360 Ahmedabad Office",
    lat: 23.0225,
    lng: 72.5714,
    radiusMeters: 150,
    allowedIPRanges: ["192.168.3.", "10.0.2."],
  },
};

// ========== HELPER FUNCTIONS ==========

/**
 * Haversine distance calculation
 * Returns distance in meters between two GPS coordinates
 */
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Get current time in HH:MM:SS format
 */
function getCurrentTime(): string {
  const now = new Date();
  return now.toTimeString().split(" ")[0];
}

/**
 * Calculate minutes difference between two HH:MM:SS times
 */
function getMinutesDifference(time1: string, time2: string): number {
  const [h1, m1, s1] = time1.split(":").map(Number);
  const [h2, m2, s2] = time2.split(":").map(Number);
  const totalMinutes1 = h1 * 60 + m1 + s1 / 60;
  const totalMinutes2 = h2 * 60 + m2 + s2 / 60;
  return Math.round(totalMinutes2 - totalMinutes1);
}

/**
 * Check if employee is late based on shift start time
 * Default shift start: 09:00:00
 */
function calculateLateMinutes(punchTime: string, shiftStartTime: string = "09:00:00"): number {
  const lateMinutes = getMinutesDifference(shiftStartTime, punchTime);
  return lateMinutes > 0 ? lateMinutes : 0;
}

// ========== SERVICE CLASS ==========

class PunchAttendanceServiceClass {
  /**
   * Record a punch (punch-in or punch-out)
   */
  async recordPunch(request: PunchRequest): Promise<PunchResult> {
    try {
      const today = getTodayDate();
      const currentTime = getCurrentTime();

      // Validate request
      if (!request.employeeId || !request.cityId || !request.punchType || !request.punchMode) {
        return {
          success: false,
          message: "Invalid punch request: missing required fields",
        };
      }

      // Check for duplicate punch
      const existingPunches = DataService.get<PunchRecord>("ATTENDANCE_RECORDS").filter(
        (p) =>
          p.employeeId === request.employeeId &&
          p.date === today &&
          p.punchType === request.punchType
      );

      if (existingPunches.length > 0) {
        return {
          success: false,
          message: `Duplicate ${request.punchType}: Already recorded at ${existingPunches[0].punchTime}`,
          flag: "DUPLICATE",
        };
      }

      // Get office location
      const officeLocation = OFFICE_LOCATIONS[request.cityId];
      if (!officeLocation) {
        return {
          success: false,
          message: `Office location not found for city: ${request.cityId}`,
        };
      }

      // Initialize punch record
      let status: PunchStatus = "SUCCESS";
      let flag: PunchRecord["flag"] = "NONE";
      let flagReason: string | undefined;
      let distanceFromOffice: number | undefined;
      let withinGeofence: boolean | undefined;
      let lateMinutes: number | undefined;

      // FIELD mode validation
      if (request.punchMode === "FIELD") {
        if (!request.gpsLat || !request.gpsLng) {
          return {
            success: false,
            message: "GPS coordinates required for field punch",
          };
        }

        // Calculate distance from office
        distanceFromOffice = getDistance(
          request.gpsLat,
          request.gpsLng,
          officeLocation.lat,
          officeLocation.lng
        );

        withinGeofence = distanceFromOffice <= officeLocation.radiusMeters;

        // FLAG (but don't block) if outside geofence
        if (!withinGeofence) {
          flag = "OUTSIDE_GEOFENCE";
          flagReason = `Location ${Math.round(distanceFromOffice)}m from office (limit: ${
            officeLocation.radiusMeters
          }m)`;
          status = "FLAGGED";
          logger.log(
            `[PunchAttendance] 🚩 GPS mismatch for ${request.employeeName}: ${flagReason}`
          );
        }

        // Selfie validation (optional warning)
        if (!request.selfieUrl) {
          logger.log(`[PunchAttendance] ⚠️ No selfie provided for field punch: ${request.employeeName}`);
        }
      }

      // Calculate late minutes for PUNCH_IN only
      if (request.punchType === "PUNCH_IN") {
        lateMinutes = calculateLateMinutes(currentTime);
        if (lateMinutes > 0) {
          status = status === "FLAGGED" ? "FLAGGED" : "LATE";
        }
      }

      // Create punch record
      const punchRecord: PunchRecord = {
        punchId: `PUNCH-${Date.now()}-${request.employeeId}`,
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        role: request.role,
        cityId: request.cityId,
        date: today,
        punchType: request.punchType,
        punchTime: currentTime,
        punchMode: request.punchMode,
        // GPS data (field only)
        gpsLat: request.gpsLat,
        gpsLng: request.gpsLng,
        gpsAccuracyMeters: request.gpsAccuracyMeters,
        distanceFromOfficeMeters: distanceFromOffice,
        withinGeofence: withinGeofence,
        // Selfie (field only)
        selfieUrl: request.selfieUrl,
        // Office data
        deviceFingerprint: request.deviceFingerprint,
        // Status
        status,
        lateMinutes: lateMinutes && lateMinutes > 0 ? lateMinutes : undefined,
        flag,
        flagReason,
        // Audit
        createdAt: new Date().toISOString(),
      };

      // Save to DataService
      DataService.insert("ATTENDANCE_RECORDS", punchRecord);

      logger.log(
        `[PunchAttendance] ✅ ${request.punchType} recorded: ${request.employeeName} at ${currentTime} (${status})`
      );

      return {
        success: true,
        punchRecord,
        status,
        message: this.formatSuccessMessage(punchRecord),
        lateMinutes,
        flag: flag !== "NONE" ? flag : undefined,
      };
    } catch (error) {
      logger.log(`[PunchAttendance] ❌ Error recording punch:`, error);
      return {
        success: false,
        message: `Failed to record punch: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Get today's punch status for an employee
   */
  getTodayPunchStatus(employeeId: string): {
    punchedIn: boolean;
    punchInTime?: string;
    punchedOut: boolean;
    punchOutTime?: string;
    totalMinutes?: number;
  } {
    const today = getTodayDate();
    const todayPunches = DataService.get<PunchRecord>("ATTENDANCE_RECORDS").filter(
      (p) => p.employeeId === employeeId && p.date === today
    );

    const punchIn = todayPunches.find((p) => p.punchType === "PUNCH_IN");
    const punchOut = todayPunches.find((p) => p.punchType === "PUNCH_OUT");

    let totalMinutes: number | undefined;
    if (punchIn && punchOut) {
      totalMinutes = getMinutesDifference(punchIn.punchTime, punchOut.punchTime);
    }

    return {
      punchedIn: !!punchIn,
      punchInTime: punchIn?.punchTime,
      punchedOut: !!punchOut,
      punchOutTime: punchOut?.punchTime,
      totalMinutes,
    };
  }

  /**
   * Get punch history for an employee within date range
   */
  getPunchHistory(employeeId: string, fromDate: string, toDate: string): PunchRecord[] {
    const allPunches = DataService.get<PunchRecord>("ATTENDANCE_RECORDS");

    return allPunches
      .filter(
        (p) =>
          p.employeeId === employeeId && p.date >= fromDate && p.date <= toDate
      )
      .sort((a, b) => {
        // Sort by date descending, then by punchTime
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return b.punchTime.localeCompare(a.punchTime);
      });
  }

  /**
   * Format success message based on punch record
   */
  private formatSuccessMessage(record: PunchRecord): string {
    const action = record.punchType === "PUNCH_IN" ? "Punched in" : "Punched out";
    const time = record.punchTime;
    const mode = record.punchMode === "OFFICE" ? "Office" : "Field";

    let message = `${action} at ${time} (${mode})`;

    if (record.lateMinutes && record.lateMinutes > 0) {
      message += ` - Late by ${record.lateMinutes} min`;
    }

    if (record.flag && record.flag !== "NONE") {
      message += ` - Flagged: ${record.flagReason}`;
    }

    return message;
  }

  /**
   * Get all punches for today (for admin dashboards)
   */
  getTodayPunches(): PunchRecord[] {
    const today = getTodayDate();
    return DataService.get<PunchRecord>("ATTENDANCE_RECORDS")
      .filter((p) => p.date === today)
      .sort((a, b) => b.punchTime.localeCompare(a.punchTime));
  }

  /**
   * Get punch statistics for a date range
   */
  getPunchStatistics(fromDate: string, toDate: string) {
    const punches = DataService.get<PunchRecord>("ATTENDANCE_RECORDS").filter(
      (p) => p.date >= fromDate && p.date <= toDate
    );

    const totalPunches = punches.length;
    const totalPunchIns = punches.filter((p) => p.punchType === "PUNCH_IN").length;
    const totalPunchOuts = punches.filter((p) => p.punchType === "PUNCH_OUT").length;
    const latePunches = punches.filter(
      (p) => p.punchType === "PUNCH_IN" && p.lateMinutes && p.lateMinutes > 0
    ).length;
    const flaggedPunches = punches.filter((p) => p.flag && p.flag !== "NONE").length;
    const officePunches = punches.filter((p) => p.punchMode === "OFFICE").length;
    const fieldPunches = punches.filter((p) => p.punchMode === "FIELD").length;

    return {
      totalPunches,
      totalPunchIns,
      totalPunchOuts,
      latePunches,
      flaggedPunches,
      officePunches,
      fieldPunches,
      latePercentage: totalPunchIns > 0 ? Math.round((latePunches / totalPunchIns) * 100) : 0,
      flaggedPercentage:
        totalPunches > 0 ? Math.round((flaggedPunches / totalPunches) * 100) : 0,
    };
  }
}

// ========== SINGLETON EXPORT ==========

export const punchAttendanceService = new PunchAttendanceServiceClass();
