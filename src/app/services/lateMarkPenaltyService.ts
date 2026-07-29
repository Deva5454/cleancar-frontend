/**
 * lateMarkPenaltyService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real, confirmed policy: 3 real late marks in a calendar month is a
 * genuine 0.5-day penalty deduction - applied as a real penalty against
 * the employee's PL balance, not tied to any specific calendar date as
 * if it were a day of leave taken. The moment this triggers, it's
 * flagged for real HR and manager visibility - never a silent deduction.
 *
 * This is a genuine, idempotent scan against real, live attendance data
 * (AttendanceContext's own records - the confirmed real source, not the
 * disconnected ATTENDANCE_MASTER store) - not something wired into every
 * possible place a Late status might get set, since that's fragile.
 * Running this scan is safe to call repeatedly; it never double-applies
 * a penalty for the same employee in the same month.
 */

import { leaveBalanceService } from "./leaveBalanceService";
import { employeeDatabaseService } from "./employeeDatabaseService";

export interface LateMarkFlag {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  lateCount: number;
  penaltyDays: number;
  reportingManagerId?: string;
  flaggedAt: string;
  acknowledgedByHR: boolean;
  acknowledgedByManager: boolean;
}

const FLAGS_KEY = "cleancar_late_mark_flags";
const LATE_MARK_THRESHOLD = 3;
const PENALTY_DAYS = 0.5;

export function getLateMarkFlags(cityId?: string): LateMarkFlag[] {
  try {
    const all = JSON.parse(localStorage.getItem(FLAGS_KEY) || "[]");
    return all;
  } catch {
    return [];
  }
}

function saveFlags(flags: LateMarkFlag[]): void {
  localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
}

/**
 * Real, idempotent scan - given a real, live list of attendance records
 * (passed in from the component using AttendanceContext's real data),
 * counts genuine Late marks per employee for the given month, and
 * applies the real 0.5-day penalty exactly once per employee per month
 * the moment the count reaches the real threshold.
 */
export function scanAndFlagLateMarks(attendanceRecords: any[], month: string): { newFlags: number } {
  const existingFlags = getLateMarkFlags();
  const alreadyFlaggedThisMonth = new Set(
    existingFlags.filter((f) => f.month === month).map((f) => f.employeeId)
  );

  const lateByEmployee = new Map<string, number>();
  attendanceRecords
    .filter((r) => r.date.startsWith(month) && r.status === "Late")
    .forEach((r) => {
      lateByEmployee.set(r.employeeId, (lateByEmployee.get(r.employeeId) || 0) + 1);
    });

  const employees = employeeDatabaseService.getAll();
  let newFlags = 0;
  const flagsToAdd: LateMarkFlag[] = [];

  lateByEmployee.forEach((count, employeeId) => {
    if (count < LATE_MARK_THRESHOLD) return;
    if (alreadyFlaggedThisMonth.has(employeeId)) return;

    const emp = employees.find((e: any) => e.id === employeeId);

    // Real penalty - a genuine deduction against PL balance, applied as
    // a penalty, not recorded against any specific calendar date.
    leaveBalanceService.deductLeave(
      employeeId,
      "PL",
      PENALTY_DAYS,
      `Attendance penalty: ${count} late marks in ${month}`
    );

    flagsToAdd.push({
      id: `LMF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      employeeId,
      employeeName: emp?.fullName || employeeId,
      month,
      lateCount: count,
      penaltyDays: PENALTY_DAYS,
      reportingManagerId: emp?.reportingManagerId,
      flaggedAt: new Date().toISOString(),
      acknowledgedByHR: false,
      acknowledgedByManager: false,
    });
    newFlags++;
  });

  if (flagsToAdd.length > 0) {
    saveFlags([...flagsToAdd, ...existingFlags]);
  }

  return { newFlags };
}

export function getFlagsForManager(managerId: string): LateMarkFlag[] {
  return getLateMarkFlags().filter((f) => f.reportingManagerId === managerId);
}

export function acknowledgeFlagByHR(flagId: string): void {
  const all = getLateMarkFlags();
  saveFlags(all.map((f) => f.id === flagId ? { ...f, acknowledgedByHR: true } : f));
}

export function acknowledgeFlagByManager(flagId: string): void {
  const all = getLateMarkFlags();
  saveFlags(all.map((f) => f.id === flagId ? { ...f, acknowledgedByManager: true } : f));
}
