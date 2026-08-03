/**
 * financialQuarter.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Indian financial year quarter helper (FY runs April → March):
 *   Q1 = Apr-Jun, Q2 = Jul-Sep, Q3 = Oct-Dec, Q4 = Jan-Mar.
 * Reuses the "YYYY-YY" financial-year string format already established by
 * performanceManagementService.ts (e.g. "2026-27") rather than inventing a
 * new convention. No equivalent quarter helper existed anywhere in this
 * codebase before — built fresh for the quarterly KRA/goal-setting cycle.
 */

export type FinancialQuarter = "Q1" | "Q2" | "Q3" | "Q4";

export interface QuarterInfo {
  quarter: FinancialQuarter;
  financialYear: string; // "2026-27"
  startDate: string;     // YYYY-MM-DD
  endDate: string;       // YYYY-MM-DD
  label: string;         // "Q1 FY2026-27"
}

const QUARTER_ORDER: FinancialQuarter[] = ["Q1", "Q2", "Q3", "Q4"];
const QUARTER_START_MONTH: Record<FinancialQuarter, number> = { Q1: 3, Q2: 6, Q3: 9, Q4: 0 }; // 0-indexed calendar month

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function getFinancialYear(date: Date): string {
  const y = date.getFullYear();
  const fyStartYear = date.getMonth() >= 3 ? y : y - 1; // April (index 3) starts the FY
  return `${fyStartYear}-${String((fyStartYear + 1) % 100).padStart(2, "0")}`;
}

/** Quarter + date-range info for a given financial year + quarter (Q4's calendar year is FY start + 1). */
export function getQuarterInfo(financialYear: string, quarter: FinancialQuarter): QuarterInfo {
  const fyStartYear = Number(financialYear.split("-")[0]);
  const startMonth = QUARTER_START_MONTH[quarter];
  const startYear = quarter === "Q4" ? fyStartYear + 1 : fyStartYear;
  const start = new Date(startYear, startMonth, 1);
  const end = new Date(startYear, startMonth + 3, 0); // last day of the 3rd month
  return {
    quarter, financialYear,
    startDate: toISODate(start), endDate: toISODate(end),
    label: `${quarter} FY${financialYear}`,
  };
}

/** The quarter (and its date range) that the given date falls in. Defaults to today. */
export function getFinancialQuarter(date: Date = new Date()): QuarterInfo {
  const m = date.getMonth();
  let quarter: FinancialQuarter;
  if (m >= 3 && m <= 5) quarter = "Q1";
  else if (m >= 6 && m <= 8) quarter = "Q2";
  else if (m >= 9 && m <= 11) quarter = "Q3";
  else quarter = "Q4";
  return getQuarterInfo(getFinancialYear(date), quarter);
}

/** The quarter immediately following the given one — rolls Q4 into Q1 of the next FY. */
export function getNextQuarter(financialYear: string, quarter: FinancialQuarter): { financialYear: string; quarter: FinancialQuarter } {
  const idx = QUARTER_ORDER.indexOf(quarter);
  if (idx < QUARTER_ORDER.length - 1) return { financialYear, quarter: QUARTER_ORDER[idx + 1] };
  const fyStartYear = Number(financialYear.split("-")[0]);
  return { financialYear: `${fyStartYear + 1}-${String((fyStartYear + 2) % 100).padStart(2, "0")}`, quarter: "Q1" };
}

/** Stable string key for tying a KRA template/assignment/cycle/actual to a specific quarter. */
export function quarterKey(financialYear: string, quarter: FinancialQuarter): string {
  return `${quarter}-FY${financialYear}`;
}

export function listQuartersForYear(financialYear: string): QuarterInfo[] {
  return QUARTER_ORDER.map((q) => getQuarterInfo(financialYear, q));
}

/** All quarters up to and including the current one, most recent first — for a "financial year" picker. */
export function listPastAndCurrentQuarters(count: number = 8): QuarterInfo[] {
  const out: QuarterInfo[] = [];
  let current = getFinancialQuarter();
  for (let i = 0; i < count; i++) {
    out.push(getQuarterInfo(current.financialYear, current.quarter));
    const idx = QUARTER_ORDER.indexOf(current.quarter);
    if (idx > 0) {
      current = { financialYear: current.financialYear, quarter: QUARTER_ORDER[idx - 1] } as any;
    } else {
      const fyStartYear = Number(current.financialYear.split("-")[0]);
      current = { financialYear: `${fyStartYear - 1}-${String(fyStartYear % 100).padStart(2, "0")}`, quarter: "Q4" } as any;
    }
  }
  return out;
}
