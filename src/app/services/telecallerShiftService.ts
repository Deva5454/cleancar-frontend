/**
 * Telecaller Shift Roster — real weekly on-duty schedule for TSE/TSM.
 *
 * Previously nothing modeled this at all: lead auto-assignment ran
 * unconditionally 24/7 against a hardcoded fake TSE list, with no concept
 * of who's actually on shift right now. This is generic and data-driven —
 * a real weekly pattern configured per real employee (see Shift Roster tab
 * in the TSM app), not hardcoded to any specific person's hours — so any
 * real staffing arrangement (split Sunday shifts, an evening-only slot,
 * different weekly-offs per person) is just data entered once.
 *
 * An employee with no configured shift falls back to the company's
 * existing default business hours (Mon–Sat 09:00–19:00, Sunday off — the
 * same window leadSLA.ts already assumes company-wide), so a newly added
 * telecaller works correctly before anyone has explicitly set their hours.
 */

import { DataService } from "./DataService";

/**
 * Which roles get a real weekly shift + check-in presence tracked at all.
 * The underlying service/storage below is already generic — keyed purely
 * by employeeId, no role logic baked in — so extending shift-aware
 * presence to another role (e.g. Supervisor, CCE) is just adding it here;
 * every consumer (Shift Roster admin screen, the Check In/Out card on My
 * Account) reads this single list instead of its own hardcoded check.
 *
 * Lead-assignment eligibility (organizationHierarchyService.ts,
 * LeadAssignmentEngine.tsx) deliberately stays narrower than this list —
 * only TSE actually handle leads, so those two intentionally hardcode
 * "TSE" rather than reading this broader list.
 */
export const SHIFT_TRACKED_ROLES = ["TSE", "TSM"] as const;

export function isShiftTrackedRole(employee: { role?: string; designation?: string }): boolean {
  return SHIFT_TRACKED_ROLES.includes(employee.role as any) ||
    SHIFT_TRACKED_ROLES.includes(employee.designation as any);
}

export interface DayShift {
  isWeekOff: boolean;
  startTime: string; // "HH:MM", 24h
  endTime: string;   // "HH:MM", 24h
}

// Keyed 0=Sunday .. 6=Saturday, matching Date.getDay().
export type WeeklyShift = [DayShift, DayShift, DayShift, DayShift, DayShift, DayShift, DayShift];

export interface TelecallerShiftRecord {
  employeeId: string;
  weekly: WeeklyShift;
  updatedAt: string;
  updatedBy?: string;
}

const DEFAULT_WORKDAY: DayShift = { isWeekOff: false, startTime: "09:00", endTime: "19:00" };
const DEFAULT_OFF: DayShift = { isWeekOff: true, startTime: "09:00", endTime: "19:00" };

// Mon–Sat 09:00–19:00, Sunday off — matches leadSLA.ts's existing
// company-wide business-hours assumption.
export const DEFAULT_WEEKLY_SHIFT: WeeklyShift = [
  DEFAULT_OFF,      // Sun
  DEFAULT_WORKDAY,  // Mon
  DEFAULT_WORKDAY,  // Tue
  DEFAULT_WORKDAY,  // Wed
  DEFAULT_WORKDAY,  // Thu
  DEFAULT_WORKDAY,  // Fri
  DEFAULT_WORKDAY,  // Sat
];

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

class TelecallerShiftService {
  getAllRecords(): TelecallerShiftRecord[] {
    return DataService.get<TelecallerShiftRecord>("TELECALLER_SHIFTS");
  }

  getShift(employeeId: string): WeeklyShift {
    const record = this.getAllRecords().find((r) => r.employeeId === employeeId);
    return record ? record.weekly : DEFAULT_WEEKLY_SHIFT;
  }

  hasCustomShift(employeeId: string): boolean {
    return this.getAllRecords().some((r) => r.employeeId === employeeId);
  }

  setShift(employeeId: string, weekly: WeeklyShift, updatedBy?: string): void {
    const records = this.getAllRecords();
    const idx = records.findIndex((r) => r.employeeId === employeeId);
    const next: TelecallerShiftRecord = {
      employeeId,
      weekly,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    if (idx >= 0) records[idx] = next;
    else records.push(next);
    DataService.setAll("TELECALLER_SHIFTS", records);
  }

  /** Is this employee on shift right now (real day-of-week + time-of-day check)? */
  isOnDutyNow(employeeId: string, at: Date = new Date()): boolean {
    const weekly = this.getShift(employeeId);
    const day = weekly[at.getDay()];
    if (day.isWeekOff) return false;
    const nowMinutes = at.getHours() * 60 + at.getMinutes();
    const start = parseTimeToMinutes(day.startTime);
    const end = parseTimeToMinutes(day.endTime);
    if (end <= start) return false; // malformed window, never on duty
    return nowMinutes >= start && nowMinutes < end;
  }

  /** Human-readable summary of today's window, for status displays. */
  describeToday(employeeId: string, at: Date = new Date()): string {
    const day = this.getShift(employeeId)[at.getDay()];
    if (day.isWeekOff) return "Week off today";
    return `${day.startTime}–${day.endTime} today`;
  }
}

export const telecallerShiftService = new TelecallerShiftService();
