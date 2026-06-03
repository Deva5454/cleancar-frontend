/**
 * Attendance Calculator Utilities (MC-10)
 *
 * Handles:
 * - Work hours calculation
 * - Late detection
 * - Overtime calculation
 * - Shift-based attendance processing
 */

import { AttendanceRecord } from "../contexts/AttendanceContext";
import { Shift } from "../types/hr-types";

/**
 * Parse time string (HH:MM or HH:MM:SS) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const parts = time.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Convert minutes to HH:MM format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Calculate time difference between two time strings
 * @param startTime - Start time (HH:MM or HH:MM:SS)
 * @param endTime - End time (HH:MM or HH:MM:SS)
 * @returns Difference in minutes
 */
export function getTimeDiff(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  // Handle overnight shifts (end < start)
  if (end < start) {
    return 24 * 60 - start + end;
  }

  return end - start;
}

/**
 * Calculate total work minutes from check-in to check-out
 */
export function calculateWorkMinutes(record: AttendanceRecord): number {
  if (!record.checkInTime || !record.checkOutTime) {
    return 0;
  }

  return getTimeDiff(record.checkInTime, record.checkOutTime);
}

/**
 * Check if employee is late and calculate late minutes
 * @param record - Attendance record
 * @param shift - Employee's shift
 * @returns Late minutes (0 if on time or within grace period)
 */
export function calculateLateMinutes(record: AttendanceRecord, shift: Shift): number {
  if (!record.checkInTime) {
    return 0;
  }

  const checkInMinutes = timeToMinutes(record.checkInTime);
  const shiftStartMinutes = timeToMinutes(shift.startTime);

  // Calculate how late the employee is
  let lateBy = checkInMinutes - shiftStartMinutes;

  // Handle early check-ins (negative lateness)
  if (lateBy < 0) {
    return 0;
  }

  // Apply grace period
  if (lateBy <= shift.graceMinutes) {
    return 0;
  }

  return lateBy - shift.graceMinutes;
}

/**
 * Calculate overtime minutes
 * @param record - Attendance record
 * @param shift - Employee's shift
 * @returns Overtime minutes (0 if no overtime)
 */
export function calculateOvertimeMinutes(record: AttendanceRecord, shift: Shift): number {
  if (!record.checkInTime || !record.checkOutTime) {
    return 0;
  }

  const workMinutes = calculateWorkMinutes(record);
  const shiftDuration = getTimeDiff(shift.startTime, shift.endTime);

  // Calculate extra minutes worked
  const extraMinutes = workMinutes - shiftDuration;

  // Only count as overtime if exceeds threshold
  if (extraMinutes > shift.overtimeThresholdMinutes) {
    return extraMinutes - shift.overtimeThresholdMinutes;
  }

  return 0;
}

/**
 * Determine attendance status based on shift and timing
 */
export function determineAttendanceStatus(
  record: AttendanceRecord,
  shift: Shift
): "Present" | "Late" | "Half Day" | "Absent" {
  // If no check-in, mark as absent
  if (!record.checkInTime) {
    return "Absent";
  }

  const lateMinutes = calculateLateMinutes(record, shift);
  const workMinutes = calculateWorkMinutes(record);
  const shiftDuration = getTimeDiff(shift.startTime, shift.endTime);

  // If late by more than 30 minutes
  if (lateMinutes > 30) {
    return "Late";
  }

  // If worked less than 50% of shift duration
  if (workMinutes < shiftDuration * 0.5) {
    return "Half Day";
  }

  return "Present";
}

/**
 * Enrich attendance record with calculated work metrics
 * @param record - Attendance record to enrich
 * @param shift - Employee's shift
 * @returns Enriched record with workMinutes, lateMinutes, overtimeMinutes
 */
export function enrichAttendanceRecord(
  record: AttendanceRecord,
  shift: Shift
): AttendanceRecord {
  const workMinutes = calculateWorkMinutes(record);
  const lateMinutes = calculateLateMinutes(record, shift);
  const overtimeMinutes = calculateOvertimeMinutes(record, shift);
  const status = determineAttendanceStatus(record, shift);

  return {
    ...record,
    workMinutes,
    lateMinutes,
    overtimeMinutes,
    status,
    hoursWorked: workMinutes / 60, // Convert to hours
  };
}

/**
 * Calculate payroll-ready work summary for a month
 */
export interface MonthlyWorkSummary {
  totalWorkMinutes: number;
  totalLateMinutes: number;
  totalOvertimeMinutes: number;
  totalWorkDays: number;
  totalLateDays: number;
  totalHalfDays: number;
  totalAbsentDays: number;
}

export function calculateMonthlyWorkSummary(
  records: AttendanceRecord[]
): MonthlyWorkSummary {
  return records.reduce(
    (summary, record) => ({
      totalWorkMinutes: summary.totalWorkMinutes + (record.workMinutes || 0),
      totalLateMinutes: summary.totalLateMinutes + (record.lateMinutes || 0),
      totalOvertimeMinutes: summary.totalOvertimeMinutes + (record.overtimeMinutes || 0),
      totalWorkDays:
        summary.totalWorkDays +
        (record.status === "Present" || record.status === "Late" ? 1 : 0),
      totalLateDays: summary.totalLateDays + (record.status === "Late" ? 1 : 0),
      totalHalfDays: summary.totalHalfDays + (record.status === "Half Day" ? 1 : 0),
      totalAbsentDays: summary.totalAbsentDays + (record.status === "Absent" ? 1 : 0),
    }),
    {
      totalWorkMinutes: 0,
      totalLateMinutes: 0,
      totalOvertimeMinutes: 0,
      totalWorkDays: 0,
      totalLateDays: 0,
      totalHalfDays: 0,
      totalAbsentDays: 0,
    }
  );
}
