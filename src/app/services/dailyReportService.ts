/**
 * dailyReportService.ts
 *
 * Read-only access to daily reports submitted by field roles (Sales
 * Manager today; extensible to other roles once they submit reports in
 * the same shape). Reuses the exact real storage key pattern already
 * built in SMDailyActivity.tsx (SM_DAILY_REPORT_${employeeId}_${date}),
 * rather than a second, separate storage mechanism.
 */

export interface DailyReportSummary {
  employeeId: string;
  date: string;
  submitted: boolean;
  morningLocked: boolean;
  fieldLocked: boolean;
  eveningLocked: boolean;
  priorityForDay: string;
  // Sales Manager's own real fields
  totalLeads?: number;
  totalConversions?: number;
  totalKm?: number;
  // Sales Head's own real fields
  btlApprovalsToday?: number;
  coachingSessionsHeld?: number;
  escalationsResolved?: number;
  fieldNotes?: string;
  // Shared evening section, both roles
  dayRating?: 1 | 2 | 3 | 4 | 5;
  biggestWin: string;
  biggestBlock: string;
  tomorrowTop3: string;
  escalationsRaised: number;
  submittedAt?: string;
}

const TODAY = new Date().toISOString().split("T")[0];

export type DailyReportType = "SM_DAILY_REPORT" | "SH_DAILY_REPORT";

function storageKeyFor(reportType: DailyReportType, employeeId: string, date: string): string {
  return `${reportType}_${employeeId}_${date}`;
}

/**
 * Read-only fetch of one employee's report for a given date. Returns null
 * if they genuinely haven't submitted anything yet - never fabricates a
 * placeholder report the way the submission screen's own loadReport()
 * does (that's the right behavior for someone about to fill a report in,
 * wrong for someone just viewing whether it was submitted).
 */
function getReport(reportType: DailyReportType, employeeId: string, date: string = TODAY): DailyReportSummary | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(reportType, employeeId, date));
    if (!raw) return null;
    const r = JSON.parse(raw);
    if (!r || typeof r !== "object") return null;
    return {
      employeeId,
      date: r.date || date,
      submitted: !!r.evening?.locked,
      morningLocked: !!r.morning?.locked,
      fieldLocked: !!r.field?.locked,
      eveningLocked: !!r.evening?.locked,
      priorityForDay: r.morning?.priorityForDay || "",
      totalLeads: r.field?.totalLeads,
      totalConversions: r.field?.totalConversions,
      totalKm: r.field?.totalKm,
      btlApprovalsToday: r.field?.btlApprovalsToday,
      coachingSessionsHeld: r.field?.coachingSessionsHeld,
      escalationsResolved: r.field?.escalationsResolved,
      fieldNotes: r.field?.notes,
      dayRating: r.evening?.dayRating,
      biggestWin: r.evening?.biggestWin || "",
      biggestBlock: r.evening?.biggestBlock || "",
      tomorrowTop3: r.evening?.tomorrowTop3 || "",
      escalationsRaised: r.evening?.escalationsRaised || 0,
      submittedAt: r.evening?.submittedAt,
    };
  } catch {
    return null;
  }
}

/** Reports for a whole team, for a given date - null entries mean genuinely not submitted. */
function getReportsForEmployees(reportType: DailyReportType, employeeIds: string[], date: string = TODAY): Record<string, DailyReportSummary | null> {
  const out: Record<string, DailyReportSummary | null> = {};
  for (const id of employeeIds) out[id] = getReport(reportType, id, date);
  return out;
}

export interface RollupResult {
  employeeId: string;
  workingDays: number;
  submittedDays: number;
  missedDates: string[];
}

/**
 * Real submission consistency over the last N real calendar days,
 * excluding weekends by default (a missed Sunday isn't a genuine gap for
 * roles that don't work that day). Reads the same real, per-day storage
 * keys as getReport() - no separate rollup storage, so this can never
 * drift out of sync with the real, individual daily records.
 */
function getRollup(
  reportType: DailyReportType,
  employeeId: string,
  days: number = 7,
  excludeWeekends: boolean = true
): RollupResult {
  const dates: string[] = [];
  const cursor = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    if (excludeWeekends && (d.getDay() === 0 || d.getDay() === 6)) continue;
    dates.push(d.toISOString().split("T")[0]);
  }

  const missedDates: string[] = [];
  let submittedDays = 0;
  for (const date of dates) {
    const r = getReport(reportType, employeeId, date);
    if (r?.submitted) submittedDays++;
    else missedDates.push(date);
  }

  return { employeeId, workingDays: dates.length, submittedDays, missedDates };
}

function getRollupForEmployees(
  reportType: DailyReportType,
  employeeIds: string[],
  days: number = 7,
  excludeWeekends: boolean = true
): RollupResult[] {
  return employeeIds.map(id => getRollup(reportType, id, days, excludeWeekends));
}

export const dailyReportService = { getReport, getReportsForEmployees, getRollup, getRollupForEmployees, TODAY };
