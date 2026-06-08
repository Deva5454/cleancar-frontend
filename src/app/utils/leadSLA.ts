/**
 * Lead SLA Calculator — business-hours aware
 *
 * Rules:
 * - SLA clock starts when lead is ASSIGNED to a TSE (not when created)
 * - Unassigned pool leads have no SLA clock yet — they show "Pending Assignment"
 * - SLA only ticks during business hours: Mon–Sat 09:00–19:00
 * - Sunday is a full off day — SLA paused
 * - Public holidays (from HR) — SLA paused
 * - SLA target: 2 business hours from assignment to first contact
 *
 * Overnight leads collected outside business hours:
 * - TSM assigns them at 9am → SLA starts then
 * - They do NOT show "SLA Breached" just because they were created at midnight
 */

import { DataService } from "../services/DataService";

// Business hours config (matches payrollConstants GHOSTING_RULES)
const BIZ_START = 9;  // 09:00
const BIZ_END   = 19; // 19:00
const SLA_TARGET_HOURS = 2; // 2 business hours from assignment

/**
 * Get public holidays from HR DataService as Set of "YYYY-MM-DD" strings
 */
function getHolidaySet(): Set<string> {
  try {
    const holidays = DataService.get<any>("PUBLIC_HOLIDAYS");
    return new Set(holidays.map((h: any) => h.date?.slice(0, 10)).filter(Boolean));
  } catch {
    return new Set();
  }
}

/**
 * Check if a given date is a working day (Mon–Sat, not a public holiday)
 */
function isWorkingDay(date: Date, holidays: Set<string>): boolean {
  const dow = date.getDay(); // 0=Sun
  if (dow === 0) return false; // Sunday always off
  const iso = date.toISOString().slice(0, 10);
  if (holidays.has(iso)) return false;
  return true;
}

/**
 * Calculate how many business hours have elapsed between two timestamps.
 * Only counts time during Mon–Sat 09:00–19:00, skipping Sundays and holidays.
 */
export function businessHoursBetween(from: Date, to: Date): number {
  if (to <= from) return 0;
  const holidays = getHolidaySet();
  let elapsed = 0;
  const cursor = new Date(from);

  while (cursor < to) {
    const endOfSlot = new Date(cursor);
    endOfSlot.setMinutes(cursor.getMinutes() + 1); // 1-min resolution
    if (endOfSlot > to) endOfSlot.setTime(to.getTime());

    const day = cursor.getDay();
    const hour = cursor.getHours() + cursor.getMinutes() / 60;

    if (
      day !== 0 && // not Sunday
      hour >= BIZ_START &&
      hour < BIZ_END &&
      isWorkingDay(cursor, holidays)
    ) {
      elapsed += (endOfSlot.getTime() - cursor.getTime()) / 3600000;
    }

    cursor.setTime(endOfSlot.getTime());
  }

  return elapsed;
}

/**
 * Get the next business-hours moment from a given time.
 * If called at 11pm Saturday, returns 9am Monday (or after holiday).
 */
function nextBusinessMoment(from: Date, holidays: Set<string>): Date {
  const d = new Date(from);
  // Advance past off days
  for (let i = 0; i < 14; i++) {
    if (d.getDay() === 0 || holidays.has(d.toISOString().slice(0, 10))) {
      d.setDate(d.getDate() + 1);
      d.setHours(BIZ_START, 0, 0, 0);
      continue;
    }
    const h = d.getHours() + d.getMinutes() / 60;
    if (h < BIZ_START) { d.setHours(BIZ_START, 0, 0, 0); }
    else if (h >= BIZ_END) {
      d.setDate(d.getDate() + 1);
      d.setHours(BIZ_START, 0, 0, 0);
      continue;
    }
    break;
  }
  return d;
}

export interface SLAResult {
  /** "unassigned" | "within" | "at_risk" | "breached" */
  status: "unassigned" | "within" | "at_risk" | "breached";
  /** Business hours elapsed since assignment */
  businessHoursElapsed: number;
  /** Business hours remaining before breach (negative = already breached) */
  businessHoursRemaining: number;
  /** Human-readable label */
  label: string;
  /** CSS classes for badge */
  badgeClass: string;
  /** Whether SLA clock is running (false = unassigned or outside biz hours) */
  isActive: boolean;
}

/**
 * Calculate SLA status for a lead.
 *
 * @param createdAt  - when the lead was created (collection time)
 * @param assignedAt - when it was assigned to a TSE (SLA clock starts here)
 * @param now        - current time (defaults to Date.now())
 */
export function calcLeadSLA(
  createdAt: string,
  assignedAt: string | undefined | null,
  now: Date = new Date()
): SLAResult {
  // Unassigned = no SLA clock
  if (!assignedAt) {
    return {
      status: "unassigned",
      businessHoursElapsed: 0,
      businessHoursRemaining: SLA_TARGET_HOURS,
      label: "Pending Assignment",
      badgeClass: "bg-gray-100 text-gray-600",
      isActive: false,
    };
  }

  const assigned = new Date(assignedAt);

  // Snap assignment time to next business moment
  // (if TSM assigns at 11pm, SLA clock effectively starts 9am next working day)
  const holidays = getHolidaySet();
  const slaStart = nextBusinessMoment(assigned, holidays);

  const elapsed = businessHoursBetween(slaStart, now);
  const remaining = SLA_TARGET_HOURS - elapsed;

  if (remaining > 1) {
    return {
      status: "within",
      businessHoursElapsed: elapsed,
      businessHoursRemaining: remaining,
      label: `${remaining.toFixed(1)}h remaining`,
      badgeClass: "bg-green-100 text-green-700",
      isActive: true,
    };
  } else if (remaining > 0) {
    return {
      status: "at_risk",
      businessHoursElapsed: elapsed,
      businessHoursRemaining: remaining,
      label: `At Risk — ${Math.round(remaining * 60)}m left`,
      badgeClass: "bg-orange-100 text-orange-700",
      isActive: true,
    };
  } else {
    return {
      status: "breached",
      businessHoursElapsed: elapsed,
      businessHoursRemaining: remaining,
      label: `Breached ${Math.abs(remaining).toFixed(1)}h ago`,
      badgeClass: "bg-red-100 text-red-700",
      isActive: true,
    };
  }
}

/**
 * Pool SLA — for unassigned overnight leads:
 * Shows time since lead was collected, but does NOT call it "breached".
 * Instead: "Collected Xh ago — needs assignment"
 */
export function calcPoolSLA(createdAt: string, now: Date = new Date()): {
  label: string;
  badgeClass: string;
  hoursOld: number;
  isUrgent: boolean;
} {
  const created = new Date(createdAt);
  const hoursOld = (now.getTime() - created.getTime()) / 3600000;

  // Pool urgency is based on CALENDAR hours (not business hours)
  // so TSM feels urgency to assign — but it's "needs assignment" not "breached"
  if (hoursOld > 12) {
    return {
      label: `Collected ${Math.round(hoursOld)}h ago — assign now`,
      badgeClass: "bg-red-100 text-red-700",
      hoursOld,
      isUrgent: true,
    };
  } else if (hoursOld > 6) {
    return {
      label: `Collected ${Math.round(hoursOld)}h ago`,
      badgeClass: "bg-orange-100 text-orange-700",
      hoursOld,
      isUrgent: false,
    };
  } else {
    return {
      label: `Collected ${Math.round(hoursOld)}h ago`,
      badgeClass: "bg-blue-100 text-blue-700",
      hoursOld,
      isUrgent: false,
    };
  }
}

/**
 * Check if right now is within business hours (for deciding if leads should be
 * distributed immediately or queued for next business day).
 */
export function isBusinessHoursNow(): boolean {
  const now = new Date();
  const holidays = getHolidaySet();
  if (!isWorkingDay(now, holidays)) return false;
  const h = now.getHours() + now.getMinutes() / 60;
  return h >= BIZ_START && h < BIZ_END;
}

export const SLA_CONFIG = {
  TARGET_HOURS: SLA_TARGET_HOURS,
  BIZ_START,
  BIZ_END,
  WORKING_DAYS: "Mon–Sat 09:00–19:00",
};
