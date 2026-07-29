/**
 * holidayPayService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real, confirmed policy: working on a real public holiday pays 2x the
 * real per-day rate (gross ÷ the genuine number of real working days in
 * that specific month - not a fixed 26). If that same holiday also
 * happened to be a day this employee was genuinely scheduled off per
 * the real duty roster, they additionally earn one real comp-off day,
 * which expires 90 days after being earned if unused.
 *
 * There is no fixed "weekly off day" per employee - confirmed, real
 * availability comes entirely from the real duty roster
 * (shiftRosterService), which marks each real day, per employee, as
 * scheduled on duty or off. Whoever the roster has on duty that day is
 * who's expected to work it.
 */

import { shiftRosterService } from "./shiftRosterService";

export interface CompOffCredit {
  id: string;
  employeeId: string;
  employeeName: string;
  earnedForDate: string; // the real holiday date that earned this
  earnedAt: string;
  expiresAt: string; // earnedAt + 90 real days
  status: "Available" | "Used" | "Expired";
  usedForDate?: string;
  usedAt?: string;
}

const COMP_OFF_KEY = "cleancar_comp_off_credits";
const COMP_OFF_VALIDITY_DAYS = 90;

/**
 * Real, genuine working-days calculation - the actual days in the given
 * month, minus real Sundays, minus every real public holiday in that
 * month from the real, shared holiday calendar. Replaces a fixed 26
 * that didn't reflect the real month at all.
 */
export function getRealWorkingDaysInMonth(
  year: number,
  month: number, // 1-12
  publicHolidayDates: string[]
): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dateStr = date.toISOString().split("T")[0];
    const isSunday = date.getDay() === 0;
    const isHoliday = publicHolidayDates.includes(dateStr);
    if (!isSunday && !isHoliday) workingDays++;
  }
  return workingDays;
}

/**
 * Real check - was this specific employee genuinely scheduled off duty
 * on this specific date, per the real duty roster? Returns null if no
 * real roster data exists for that date at all (honest - can't confirm
 * either way).
 */
function wasScheduledOffPerRoster(employeeId: string, date: string, cityId: string): boolean | null {
  const allRosters = shiftRosterService.getRosters(cityId);
  for (const roster of allRosters) {
    const slot = roster.slots.find((s) => s.employeeId === employeeId && s.date === date);
    if (slot) return slot.isWeekOff;
  }
  return null;
}

/**
 * Real, per-employee holiday-pay check for one specific real public
 * holiday date within a payroll period. Determines whether they
 * genuinely worked it (from real attendance), and whether it also
 * earns a real comp-off (worked despite being genuinely rostered off).
 */
export function checkHolidayWork(
  employeeId: string,
  employeeName: string,
  holidayDate: string,
  cityId: string,
  attendanceRecordsForDate: any[] // real records for this employee+date
): { workedOnHoliday: boolean; earnsCompOff: boolean } {
  const record = attendanceRecordsForDate.find((r) => r.employeeId === employeeId && r.date === holidayDate);
  const workedOnHoliday = !!record && ["Present", "Late", "Half Day"].includes(record.status);

  if (!workedOnHoliday) return { workedOnHoliday: false, earnsCompOff: false };

  const scheduledOff = wasScheduledOffPerRoster(employeeId, holidayDate, cityId);
  const earnsCompOff = scheduledOff === true;

  return { workedOnHoliday, earnsCompOff };
}

export function grantCompOff(employeeId: string, employeeName: string, earnedForDate: string): CompOffCredit {
  const now = new Date();
  const expires = new Date(now.getTime() + COMP_OFF_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
  const credit: CompOffCredit = {
    id: `COMPOFF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    employeeId,
    employeeName,
    earnedForDate,
    earnedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    status: "Available",
  };
  const all = getAllCompOffCredits();
  localStorage.setItem(COMP_OFF_KEY, JSON.stringify([credit, ...all]));
  return credit;
}

export function getAllCompOffCredits(): CompOffCredit[] {
  try {
    return JSON.parse(localStorage.getItem(COMP_OFF_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Real, genuine expiry check - marks any credit past its real 90-day
 * window as Expired. Idempotent and safe to call repeatedly.
 */
export function expireStaleCompOffCredits(): number {
  const all = getAllCompOffCredits();
  const now = new Date().toISOString();
  let expiredCount = 0;
  const updated = all.map((c) => {
    if (c.status === "Available" && c.expiresAt < now) {
      expiredCount++;
      return { ...c, status: "Expired" as const };
    }
    return c;
  });
  if (expiredCount > 0) localStorage.setItem(COMP_OFF_KEY, JSON.stringify(updated));
  return expiredCount;
}

export function getEmployeeCompOffBalance(employeeId: string): CompOffCredit[] {
  expireStaleCompOffCredits();
  return getAllCompOffCredits().filter((c) => c.employeeId === employeeId && c.status === "Available");
}

export function useCompOff(creditId: string, forDate: string): boolean {
  const all = getAllCompOffCredits();
  const idx = all.findIndex((c) => c.id === creditId && c.status === "Available");
  if (idx === -1) return false;
  all[idx] = { ...all[idx], status: "Used", usedForDate: forDate, usedAt: new Date().toISOString() };
  localStorage.setItem(COMP_OFF_KEY, JSON.stringify(all));
  return true;
}
