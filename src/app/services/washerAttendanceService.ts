/**
 * Washer Attendance Service (Enhanced with MC-09 + MC-10)
 * FLOW 3: Washer Check-In/Out → HR Attendance Records
 *
 * MC-09: Fraud Detection - GPS validation, device tracking, anomaly detection
 * MC-10: Shift Management - Work hours, late detection, overtime calculation
 *
 * CRITICAL: AttendanceContext is the ONLY source of attendance for payroll
 */

import type { AttendanceRecord } from "../contexts/AttendanceContext";
import type { Shift } from "../types/hr-types";
import { detectFraud, getCurrentLocation, getDeviceId } from "../utils/attendanceFraudEngine";
import { enrichAttendanceRecord, calculateWorkMinutes, calculateLateMinutes, calculateOvertimeMinutes } from "../utils/attendanceCalculator";

export interface WasherCheckInData {
  employeeId: string; // GLOBAL IDENTITY (washerId = employeeId)
  cityId: string; // City scope for multi-city isolation
  date: string; // "2026-04-22"
  checkInTime: string; // "09:15:00"
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface WasherCheckOutData {
  employeeId: string;
  date: string;
  checkOutTime: string; // "18:30:00"
}

export interface AttendanceResult {
  success: boolean;
  attendanceRecord?: AttendanceRecord;
  error?: string;
  duplicate?: boolean;
  fraudFlag?: string;
  fraudReason?: string;
}

/**
 * FLOW 3: WASHER ATTENDANCE (Enhanced)
 *
 * When washer checks in/out:
 * 1. Capture GPS coordinates and device ID (MC-09)
 * 2. Validate no duplicate attendance for same day
 * 3. Run fraud detection (GPS, time, device checks) - ONLY FLAG, NEVER BLOCK
 * 4. Create/update attendance record in AttendanceContext
 * 5. Apply shift-based calculations (late, overtime) (MC-10)
 * 6. Emit WASHER_CHECKIN / WASHER_CHECKOUT event
 *
 * CRITICAL RULES:
 * - Fraud detection ONLY flags records, never blocks operations
 * - AttendanceContext is the ONLY attendance source for payroll
 * - All calculations use employee's assigned shift
 * - GPS and device data captured for audit trail
 */
export class WasherAttendanceService {
  /**
   * Handle washer check-in with fraud detection and shift validation
   */
  static async checkIn(
    checkInData: WasherCheckInData,
    contexts: {
      addAttendanceRecord: (record: Omit<AttendanceRecord, "attendanceId" | "createdAt">) => AttendanceRecord;
      getAttendanceForDate: (date: string) => AttendanceRecord[];
      attendanceRecords: AttendanceRecord[];
      emit: (event: string, data: any, source?: string) => void;
    },
    employee: {
      employeeId: string;
      shiftId?: string;
      workLocation?: {
        lat: number;
        lng: number;
        radius: number;
      };
    },
    shift?: Shift | null
  ): Promise<AttendanceResult> {
    try {
      // CRITICAL: Check for duplicate attendance
      const existingAttendance = contexts.getAttendanceForDate(checkInData.date);
      const alreadyCheckedIn = existingAttendance.find(
        (a) => a.employeeId === checkInData.employeeId
      );

      if (alreadyCheckedIn) {
        console.warn(
          `[WASHER_CHECKIN] Duplicate check-in prevented for employee ${checkInData.employeeId} on ${checkInData.date}`
        );
        return {
          success: false,
          duplicate: true,
          error: "Already checked in for this date",
        };
      }

      // MC-09: Capture GPS and device ID
      let gpsLat: number | undefined;
      let gpsLng: number | undefined;
      let deviceId: string | undefined;

      try {
        const position = await getCurrentLocation();
        gpsLat = position.latitude;
        gpsLng = position.longitude;
        deviceId = getDeviceId();
      } catch (gpsError) {
        console.warn("[WASHER_CHECKIN] GPS capture failed (non-blocking):", gpsError);
        // Continue without GPS - fraud detection will skip GPS checks
      }

      // Calculate late minutes using shift (MC-10)
      let lateMinutes = 0;
      let status: "Present" | "Late" | "Half Day" | "Leave" | "Week Off" | "Absent" = "Present";

      if (shift) {
        // Create temporary record for calculation
        const tempRecord: AttendanceRecord = {
          attendanceId: "temp",
          employeeId: checkInData.employeeId,
          cityId: checkInData.cityId,
          date: checkInData.date,
          checkInTime: checkInData.checkInTime,
          status: "Present",
          createdAt: new Date().toISOString(),
        };

        lateMinutes = calculateLateMinutes(tempRecord, shift);
        status = lateMinutes > 0 ? "Late" : "Present";
      }

      // Create base attendance record
      const baseRecord: Omit<AttendanceRecord, "attendanceId" | "createdAt"> = {
        employeeId: checkInData.employeeId,
        cityId: checkInData.cityId,
        date: checkInData.date,
        checkInTime: checkInData.checkInTime,
        status,
        lateMinutes,
        location: checkInData.location,
        gpsLat,
        gpsLng,
        deviceId,
        flag: "NONE",
      };

      // MC-09: Run fraud detection (ONLY FLAG, NEVER BLOCK)
      const fraudCheck = detectFraud(
        { ...baseRecord, attendanceId: "temp", createdAt: new Date().toISOString() },
        employee,
        contexts.attendanceRecords
      );

      if (fraudCheck) {
        baseRecord.flag = fraudCheck.flag;
        baseRecord.flagReason = fraudCheck.reason;
        console.warn(
          `[WASHER_CHECKIN] Fraud flag: ${fraudCheck.flag} - ${fraudCheck.reason}`
        );
      }

      // Create attendance record
      const attendanceRecord = contexts.addAttendanceRecord(baseRecord);

      console.log(
        `[WASHER_CHECKIN] Employee ${checkInData.employeeId} checked in at ${checkInData.checkInTime}` +
        `${lateMinutes > 0 ? ` (${lateMinutes} min late)` : ""}` +
        `${fraudCheck ? ` [${fraudCheck.flag}]` : ""}`
      );

      // Emit event for other modules
      contexts.emit(
        "WASHER_CHECKIN",
        {
          employeeId: checkInData.employeeId,
          cityId: checkInData.cityId,
          date: checkInData.date,
          checkInTime: checkInData.checkInTime,
          status: attendanceRecord.status,
          lateMinutes: attendanceRecord.lateMinutes,
          location: checkInData.location,
          flag: attendanceRecord.flag,
          flagReason: attendanceRecord.flagReason,
        },
        "WasherAttendanceService"
      );

      return {
        success: true,
        attendanceRecord,
        fraudFlag: fraudCheck?.flag,
        fraudReason: fraudCheck?.reason,
      };
    } catch (error) {
      console.error("[WASHER_CHECKIN] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle washer check-out with shift-based calculations
   */
  static checkOut(
    checkOutData: WasherCheckOutData,
    contexts: {
      attendanceRecords: AttendanceRecord[];
      getAttendanceForDate: (date: string) => AttendanceRecord[];
      updateAttendance: (attendanceId: string, updates: Partial<AttendanceRecord>) => AttendanceRecord | null;
      emit: (event: string, data: any, source?: string) => void;
    },
    shift?: Shift | null
  ): AttendanceResult {
    try {
      // Find existing attendance record for today
      const todayAttendance = contexts.getAttendanceForDate(checkOutData.date);
      const attendanceRecord = todayAttendance.find(
        (a) => a.employeeId === checkOutData.employeeId
      );

      if (!attendanceRecord) {
        console.error(
          `[WASHER_CHECKOUT] No check-in found for employee ${checkOutData.employeeId} on ${checkOutData.date}`
        );
        return {
          success: false,
          error: "No check-in record found for this date",
        };
      }

      if (attendanceRecord.checkOutTime) {
        console.warn(
          `[WASHER_CHECKOUT] Already checked out at ${attendanceRecord.checkOutTime}`
        );
        return {
          success: false,
          error: "Already checked out for this date",
        };
      }

      // MC-10: Calculate work metrics using shift
      const updatedRecord: AttendanceRecord = {
        ...attendanceRecord,
        checkOutTime: checkOutData.checkOutTime,
      };

      const workMinutes = calculateWorkMinutes(updatedRecord);
      const hoursWorked = workMinutes / 60;

      let overtimeMinutes = 0;
      if (shift) {
        overtimeMinutes = calculateOvertimeMinutes(updatedRecord, shift);
      }

      // Update attendance record in AttendanceContext (single source of truth)
      const finalRecord = contexts.updateAttendance(attendanceRecord.attendanceId, {
        checkOutTime: checkOutData.checkOutTime,
        workMinutes,
        hoursWorked,
        overtimeMinutes,
      });

      if (!finalRecord) {
        console.error(
          `[WASHER_CHECKOUT] Failed to update attendance record ${attendanceRecord.attendanceId}`
        );
        return {
          success: false,
          error: "Failed to update attendance record",
        };
      }

      console.log(
        `[WASHER_CHECKOUT] Employee ${checkOutData.employeeId} checked out at ${checkOutData.checkOutTime}` +
        ` (${hoursWorked.toFixed(2)} hours worked${overtimeMinutes > 0 ? `, ${overtimeMinutes} min OT` : ""})`
      );

      // Emit event
      contexts.emit(
        "WASHER_CHECKOUT",
        {
          employeeId: checkOutData.employeeId,
          date: checkOutData.date,
          checkOutTime: checkOutData.checkOutTime,
          hoursWorked,
          workMinutes,
          overtimeMinutes,
          attendanceId: attendanceRecord.attendanceId,
        },
        "WasherAttendanceService"
      );

      return {
        success: true,
        attendanceRecord: finalRecord,
      };
    } catch (error) {
      console.error("[WASHER_CHECKOUT] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get attendance summary for employee for a date range
   */
  static getAttendanceSummary(
    employeeId: string,
    startDate: string,
    endDate: string,
    contexts: {
      getAttendanceByEmployee: (employeeId: string) => AttendanceRecord[];
    }
  ): {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalHoursWorked: number;
    totalLateMinutes: number;
    totalOvertimeMinutes: number;
    flaggedDays: number;
  } {
    const allAttendance = contexts.getAttendanceByEmployee(employeeId);
    const periodAttendance = allAttendance.filter(
      (a) => a.date >= startDate && a.date <= endDate
    );

    const presentDays = periodAttendance.filter(
      (a) => a.status === "Present" || a.status === "Late"
    ).length;
    const lateDays = periodAttendance.filter((a) => a.status === "Late").length;
    const totalHoursWorked = periodAttendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
    const totalLateMinutes = periodAttendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);
    const totalOvertimeMinutes = periodAttendance.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0);
    const flaggedDays = periodAttendance.filter((a) => a.flag && a.flag !== "NONE").length;

    // Calculate total working days in period
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const absentDays = totalDays - presentDays;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      totalHoursWorked,
      totalLateMinutes,
      totalOvertimeMinutes,
      flaggedDays,
    };
  }
}
