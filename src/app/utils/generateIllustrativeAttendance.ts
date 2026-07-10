/**
 * Illustrative Attendance Generator
 *
 * Used when an employee has no real attendance records in ATTENDANCE_RECORDS
 * (the real store — see HRDataContext.getAttendanceByEmployeeId — which is
 * never actually populated for real employees anywhere in the app today).
 * Generates a plausible day-by-day month: mostly Present, Sundays as
 * Weekly Off, and a small number of late-arrival / half-day / leave days,
 * using a deterministic seed (from the employee ID) so the same employee
 * always gets the same illustrative pattern rather than re-randomizing on
 * every render. This is clearly surfaced as illustrative in the UI, not
 * presented as real attendance.
 */
export interface DailyAttendanceRow {
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  lateMinutes?: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateIllustrativeMonth(employeeId: string, year: number, month: number): DailyAttendanceRow[] {
  const rand = seededRandom(hashString(employeeId) + year * 100 + month);
  const daysInMonth = new Date(year, month, 0).getDate();
  const rows: DailyAttendanceRow[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = new Date(date).getDay(); // 0 = Sunday

    if (dow === 0) {
      rows.push({ date, status: "WOFF" });
      continue;
    }

    const roll = rand();
    if (roll < 0.82) {
      // Present, occasionally a few minutes late
      const late = rand() < 0.15 ? Math.round(rand() * 20) + 1 : 0;
      const inHour = late > 0 ? 9 : 8;
      const inMin = late > 0 ? late : Math.round(rand() * 45);
      rows.push({
        date, status: "P",
        checkIn: `${String(inHour).padStart(2, "0")}:${String(inMin).padStart(2, "0")} AM`,
        checkOut: "06:00 PM",
        lateMinutes: late || undefined,
      });
    } else if (roll < 0.90) {
      rows.push({ date, status: "CSL" }); // casual/sick leave
    } else if (roll < 0.95) {
      rows.push({ date, status: "H", checkIn: "09:00 AM", checkOut: "01:00 PM" }); // half day
    } else {
      rows.push({ date, status: "A" }); // absent
    }
  }
  return rows;
}
