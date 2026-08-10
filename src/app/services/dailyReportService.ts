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
  totalLeads: number;
  totalConversions: number;
  totalKm: number;
  dayRating?: 1 | 2 | 3 | 4 | 5;
  biggestWin: string;
  biggestBlock: string;
  tomorrowTop3: string;
  escalationsRaised: number;
  submittedAt?: string;
}

const TODAY = new Date().toISOString().split("T")[0];

function storageKeyFor(employeeId: string, date: string): string {
  return `SM_DAILY_REPORT_${employeeId}_${date}`;
}

/**
 * Read-only fetch of one employee's report for a given date. Returns null
 * if they genuinely haven't submitted anything yet - never fabricates a
 * placeholder report the way the submission screen's own loadReport()
 * does (that's the right behavior for someone about to fill a report in,
 * wrong for someone just viewing whether it was submitted).
 */
function getReport(employeeId: string, date: string = TODAY): DailyReportSummary | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(employeeId, date));
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
      totalLeads: r.field?.totalLeads || 0,
      totalConversions: r.field?.totalConversions || 0,
      totalKm: r.field?.totalKm || 0,
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
function getReportsForEmployees(employeeIds: string[], date: string = TODAY): Record<string, DailyReportSummary | null> {
  const out: Record<string, DailyReportSummary | null> = {};
  for (const id of employeeIds) out[id] = getReport(id, date);
  return out;
}

export const dailyReportService = { getReport, getReportsForEmployees, TODAY };
