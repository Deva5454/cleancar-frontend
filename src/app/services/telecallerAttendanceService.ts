/**
 * Telecaller Attendance — real check-in/check-out presence for TSE/TSM.
 *
 * The weekly Shift Roster (telecallerShiftService) only ever encodes a
 * plan — "this person is scheduled 9-6 today." It has no idea whether
 * they actually showed up. This reads the same real attendance records
 * the rest of the app already writes to (AttendanceContext's
 * ATTENDANCE_RECORDS store — previously only ever populated for Car
 * Washers via WasherAttendanceService), so a lead is only ever offered
 * to someone who is both scheduled AND has genuinely checked in today
 * and not yet checked out.
 *
 * Read-only from here — the actual check-in/check-out action lives in
 * the UI (MyAccountPage) via the real useAttendance() context hook, so
 * every other screen that already reads AttendanceContext stays in sync.
 * This service exists because plain (non-React) code like
 * organizationHierarchyService can't call a React hook.
 */

import { DataService } from "./DataService";
import type { AttendanceRecord } from "../contexts/AttendanceContext";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

class TelecallerAttendanceService {
  private getRecords(cityId: string): AttendanceRecord[] {
    return DataService.get<AttendanceRecord>("ATTENDANCE_RECORDS", cityId);
  }

  getTodayRecord(employeeId: string, cityId: string): AttendanceRecord | undefined {
    const d = todayISO();
    return this.getRecords(cityId).find(r => r.employeeId === employeeId && r.date === d);
  }

  /** Genuinely checked in today and not yet checked out. */
  isCheckedInNow(employeeId: string, cityId: string): boolean {
    const rec = this.getTodayRecord(employeeId, cityId);
    return !!rec?.checkInTime && !rec.checkOutTime;
  }
}

export const telecallerAttendanceService = new TelecallerAttendanceService();
