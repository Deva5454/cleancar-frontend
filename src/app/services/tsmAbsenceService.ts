/**
 * tsmAbsenceService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages TSM absence state.
 *
 * Two sources:
 *  1. Attendance system: if TSM has no check-in by 10:30 AM, marked auto-absent
 *  2. Manual toggle: Super Admin / Admin can mark TSM absent/present at any time
 *
 * When TSM is absent:
 *  - All new booking notifications that would go to TSM → redirected to Admin/Super Admin
 *  - TSM app shows "You are marked absent today" banner
 *  - Assignments owned by Admin/Super Admin for the full day
 */

const KEY = "cc360_tsm_absence";

export interface TSMAbsenceRecord {
  tsmId:      string;
  tsmName:    string;
  date:       string;          // YYYY-MM-DD
  absent:     boolean;
  reason:     "AUTO_ATTENDANCE" | "MANUAL_TOGGLE";
  markedBy?:  string;          // employeeId who toggled
  markedAt:   string;          // ISO
}

function readRecords(): TSMAbsenceRecord[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function writeRecords(r: TSMAbsenceRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(r));
}

export const tsmAbsenceService = {
  /** Mark TSM absent/present manually (Super Admin / Admin) */
  setAbsence(tsmId: string, tsmName: string, absent: boolean, markedBy: string): void {
    const today = new Date().toISOString().slice(0, 10);
    const records = readRecords();
    const idx = records.findIndex(r => r.tsmId === tsmId && r.date === today);
    const record: TSMAbsenceRecord = {
      tsmId, tsmName, date: today, absent,
      reason: "MANUAL_TOGGLE", markedBy,
      markedAt: new Date().toISOString(),
    };
    if (idx >= 0) records[idx] = record;
    else records.push(record);
    writeRecords(records);
    window.dispatchEvent(new CustomEvent("cc360:tsm_absence_changed", { detail: record }));
  },

  /** Auto-mark absent from attendance (called if no check-in by 10:30 AM) */
  autoMarkAbsent(tsmId: string, tsmName: string): void {
    const today = new Date().toISOString().slice(0, 10);
    const records = readRecords();
    const alreadyManual = records.find(r => r.tsmId === tsmId && r.date === today && r.reason === "MANUAL_TOGGLE");
    if (alreadyManual) return; // manual override takes priority
    const idx = records.findIndex(r => r.tsmId === tsmId && r.date === today);
    const record: TSMAbsenceRecord = {
      tsmId, tsmName, date: today, absent: true,
      reason: "AUTO_ATTENDANCE", markedAt: new Date().toISOString(),
    };
    if (idx >= 0) records[idx] = record;
    else records.push(record);
    writeRecords(records);
    window.dispatchEvent(new CustomEvent("cc360:tsm_absence_changed", { detail: record }));
  },

  /** Check if a TSM is absent today */
  isAbsentToday(tsmId: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    const record = readRecords().find(r => r.tsmId === tsmId && r.date === today);
    return record?.absent ?? false;
  },

  /** Get absence record for today */
  getTodayRecord(tsmId: string): TSMAbsenceRecord | null {
    const today = new Date().toISOString().slice(0, 10);
    return readRecords().find(r => r.tsmId === tsmId && r.date === today) ?? null;
  },

  /** Get all TSMs absent today (for Admin/Super Admin dashboard) */
  getAllAbsentToday(): TSMAbsenceRecord[] {
    const today = new Date().toISOString().slice(0, 10);
    return readRecords().filter(r => r.date === today && r.absent);
  },
};
