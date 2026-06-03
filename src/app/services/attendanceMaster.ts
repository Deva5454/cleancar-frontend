/**
 * Attendance Master - Unified Attendance Structure
 *
 * Single source of truth for attendance data
 * Replaces scattered ATTENDANCE and ATTENDANCE_RECORDS with unified structure
 */

import { DataService } from "./DataService";
import { logger } from "./logger";

// ========== TYPES ==========

export type AttendanceStatus = "Present" | "Absent" | "Late" | "Half Day" | "Leave" | "Week Off";
export type FraudFlag = "NONE" | "GPS_MISMATCH" | "TIME_ANOMALY" | "DUPLICATE" | "MULTI_DEVICE";

/**
 * Unified Attendance Master Record
 * All attendance tracking should reference employeeId from EmployeeMaster
 */
export interface AttendanceMaster {
  // Core Identity
  attendanceId: string;         // Primary key
  employeeId: string;           // FK to EmployeeMaster

  // Location Context
  cityId: string;               // Multi-city isolation

  // Date & Time
  date: string;                 // YYYY-MM-DD
  checkInTime?: string;         // HH:MM:SS
  checkOutTime?: string;        // HH:MM:SS

  // Status
  status: AttendanceStatus;

  // Work Tracking
  hoursWorked?: number;
  workMinutes?: number;
  overtimeMinutes?: number;
  lateMinutes?: number;

  // Location Tracking
  checkInLocation?: {
    latitude: number;
    longitude: number;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
  };

  // Fraud Detection (MC-09)
  gpsLat?: number;
  gpsLng?: number;
  deviceId?: string;
  flag: FraudFlag;
  flagReason?: string;

  // Shift Information (MC-10)
  shiftId?: string;
  expectedCheckIn?: string;     // HH:MM:SS
  expectedCheckOut?: string;    // HH:MM:SS

  // Metadata
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Monthly Attendance Summary
 */
export interface MonthlyAttendanceSummary {
  employeeId: string;
  month: string;                // YYYY-MM
  cityId: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
  weekOffDays: number;
  totalHoursWorked: number;
  totalOvertimeMinutes: number;
  attendancePercentage: number;
  fraudFlags: number;           // Count of flagged records
}

/**
 * Legacy attendance record for backward compatibility
 */
export interface LegacyAttendanceRecord {
  attendanceId: string;
  employeeId: string;
  cityId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  hoursWorked?: number;
  lateMinutes?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  gpsLat?: number;
  gpsLng?: number;
  deviceId?: string;
  flag?: FraudFlag;
  flagReason?: string;
  workMinutes?: number;
  overtimeMinutes?: number;
  createdAt: string;
  updatedAt?: string;
}

// ========== SERVICE ==========

class AttendanceMasterService {
  private readonly STORAGE_KEY = "ATTENDANCE_MASTER";

  /**
   * Get all attendance records
   */
  getAll(): AttendanceMaster[] {
    return DataService.get<AttendanceMaster>(this.STORAGE_KEY);
  }

  /**
   * Get attendance by ID
   */
  getById(attendanceId: string): AttendanceMaster | null {
    const records = this.getAll();
    return records.find(rec => rec.attendanceId === attendanceId) || null;
  }

  /**
   * Get attendance by employee
   */
  getByEmployee(employeeId: string): AttendanceMaster[] {
    return this.getAll().filter(rec => rec.employeeId === employeeId);
  }

  /**
   * Get attendance for specific date
   */
  getByDate(date: string): AttendanceMaster[] {
    return this.getAll().filter(rec => rec.date === date);
  }

  /**
   * Get attendance by city
   */
  getByCity(cityId: string): AttendanceMaster[] {
    return this.getAll().filter(rec => rec.cityId === cityId);
  }

  /**
   * Get attendance for date range
   */
  getByDateRange(employeeId: string, startDate: string, endDate: string): AttendanceMaster[] {
    return this.getAll().filter(rec =>
      rec.employeeId === employeeId &&
      rec.date >= startDate &&
      rec.date <= endDate
    );
  }

  /**
   * Get attendance for month
   */
  getByMonth(employeeId: string, month: string): AttendanceMaster[] {
    return this.getAll().filter(rec =>
      rec.employeeId === employeeId &&
      rec.date.startsWith(month)
    );
  }

  /**
   * Get flagged attendance records
   */
  getFlagged(cityId?: string): AttendanceMaster[] {
    const records = this.getAll().filter(rec => rec.flag !== "NONE");
    if (cityId) {
      return records.filter(rec => rec.cityId === cityId);
    }
    return records;
  }

  /**
   * Create attendance record
   */
  create(data: Omit<AttendanceMaster, "attendanceId" | "createdAt">): AttendanceMaster {
    const now = new Date().toISOString();
    const newRecord: AttendanceMaster = {
      ...data,
      flag: data.flag || "NONE",
      attendanceId: this.generateAttendanceId(),
      createdAt: now,
    };

    const records = this.getAll();
    DataService.setAll(this.STORAGE_KEY, [...records, newRecord]);

    logger.log("AttendanceMaster: Created record", { attendanceId: newRecord.attendanceId });
    return newRecord;
  }

  /**
   * Update attendance record
   */
  update(attendanceId: string, updates: Partial<Omit<AttendanceMaster, "attendanceId" | "createdAt">>): AttendanceMaster | null {
    const records = this.getAll();
    const index = records.findIndex(rec => rec.attendanceId === attendanceId);

    if (index === -1) {
      logger.error("AttendanceMaster: Record not found", { attendanceId });
      return null;
    }

    const updatedRecord: AttendanceMaster = {
      ...records[index],
      ...updates,
      attendanceId, // Prevent ID change
      createdAt: records[index].createdAt, // Preserve creation time
      updatedAt: new Date().toISOString(),
    };

    records[index] = updatedRecord;
    DataService.setAll(this.STORAGE_KEY, records);

    logger.log("AttendanceMaster: Updated record", { attendanceId });
    return updatedRecord;
  }

  /**
   * Delete attendance record
   */
  delete(attendanceId: string): void {
    const records = this.getAll();
    const filtered = records.filter(rec => rec.attendanceId !== attendanceId);
    DataService.setAll(this.STORAGE_KEY, filtered);
    logger.log("AttendanceMaster: Deleted record", { attendanceId });
  }

  /**
   * Get monthly summary for employee
   */
  getMonthlyAttendanceSummary(employeeId: string, month: string, cityId: string): MonthlyAttendanceSummary {
    const records = this.getByMonth(employeeId, month);

    const summary: MonthlyAttendanceSummary = {
      employeeId,
      month,
      cityId,
      totalDays: records.length,
      presentDays: records.filter(r => r.status === "Present").length,
      absentDays: records.filter(r => r.status === "Absent").length,
      lateDays: records.filter(r => r.status === "Late").length,
      halfDays: records.filter(r => r.status === "Half Day").length,
      leaveDays: records.filter(r => r.status === "Leave").length,
      weekOffDays: records.filter(r => r.status === "Week Off").length,
      totalHoursWorked: records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0),
      totalOvertimeMinutes: records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0),
      attendancePercentage: records.length > 0
        ? (records.filter(r => r.status === "Present" || r.status === "Late").length / records.length) * 100
        : 0,
      fraudFlags: records.filter(r => r.flag !== "NONE").length,
    };

    return summary;
  }

  /**
   * Generate unique attendance ID
   */
  private generateAttendanceId(): string {
    const timestamp = Date.now();
    const random = (0.91).toString(36).substr(2, 6).toUpperCase();
    return `ATT-${timestamp}-${random}`;
  }

  /**
   * Bulk import attendance records
   */
  bulkImport(records: Omit<AttendanceMaster, "attendanceId" | "createdAt">[]): AttendanceMaster[] {
    const created = records.map(data => {
      const now = new Date().toISOString();
      return {
        ...data,
        flag: data.flag || "NONE" as FraudFlag,
        attendanceId: this.generateAttendanceId(),
        createdAt: now,
      };
    });

    const existing = this.getAll();
    DataService.setAll(this.STORAGE_KEY, [...existing, ...created]);

    logger.log("AttendanceMaster: Bulk import complete", { count: created.length });
    return created;
  }
}

// ========== ADAPTER LAYER ==========

/**
 * Adapter to convert legacy attendance format to AttendanceMaster
 */
export class AttendanceAdapter {
  /**
   * Convert legacy attendance to AttendanceMaster
   */
  static toMaster(legacy: LegacyAttendanceRecord): AttendanceMaster {
    return {
      attendanceId: legacy.attendanceId,
      employeeId: legacy.employeeId,
      cityId: legacy.cityId,
      date: legacy.date,
      checkInTime: legacy.checkInTime,
      checkOutTime: legacy.checkOutTime,
      status: legacy.status,
      hoursWorked: legacy.hoursWorked,
      workMinutes: legacy.workMinutes,
      overtimeMinutes: legacy.overtimeMinutes,
      lateMinutes: legacy.lateMinutes,
      checkInLocation: legacy.location,
      gpsLat: legacy.gpsLat,
      gpsLng: legacy.gpsLng,
      deviceId: legacy.deviceId,
      flag: legacy.flag || "NONE",
      flagReason: legacy.flagReason,
      createdAt: legacy.createdAt,
      updatedAt: legacy.updatedAt,
    };
  }

  /**
   * Convert AttendanceMaster to legacy format
   */
  static toLegacy(master: AttendanceMaster): LegacyAttendanceRecord {
    return {
      attendanceId: master.attendanceId,
      employeeId: master.employeeId,
      cityId: master.cityId,
      date: master.date,
      checkInTime: master.checkInTime,
      checkOutTime: master.checkOutTime,
      status: master.status,
      hoursWorked: master.hoursWorked,
      lateMinutes: master.lateMinutes,
      location: master.checkInLocation,
      gpsLat: master.gpsLat,
      gpsLng: master.gpsLng,
      deviceId: master.deviceId,
      flag: master.flag,
      flagReason: master.flagReason,
      workMinutes: master.workMinutes,
      overtimeMinutes: master.overtimeMinutes,
      createdAt: master.createdAt,
      updatedAt: master.updatedAt,
    };
  }

  /**
   * Batch convert legacy to master
   */
  static batchToMaster(legacy: LegacyAttendanceRecord[]): AttendanceMaster[] {
    return legacy.map(rec => this.toMaster(rec));
  }

  /**
   * Batch convert master to legacy
   */
  static batchToLegacy(masters: AttendanceMaster[]): LegacyAttendanceRecord[] {
    return masters.map(rec => this.toLegacy(rec));
  }
}

// ========== EXPORT ==========

export const attendanceMasterService = new AttendanceMasterService();

// Alias for backward compatibility
export const attendanceMaster = attendanceMasterService;
