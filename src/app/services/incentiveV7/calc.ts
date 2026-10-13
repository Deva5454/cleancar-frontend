/**
 * Incentive V7 — daily and monthly calculation for washers, TSE and TSM.
 * Reads facts (facts.ts), applies the engine (engine.ts) with the config version in force on each date,
 * and stores summaries. Everything here is idempotent: running it twice gives the same result.
 */
import { getActiveRow, getActiveConfig, getCalendarOverride } from "./configService";
import {
  addDays, applyGuard, applyMonthlyCap, daysInMonth, partTimeAcrossVersions, exGstRevenue, fullTimeSlab,
  tseDaily, tsmConversionBonus, tsmVolumeBonus, washerUnits, workingDaysInMonth,
} from "./engine";
import type { EmployeeFact, JobFact } from "./facts";
import { isMonthLocked, readAll, upsertMany } from "./store";
import type { IncentiveConfig, IncentiveRole, LedgerRow, MonthSummary, TseDay, WasherDay } from "./types";

const countsFor = (j: JobFact, cfg: IncentiveConfig): boolean =>
  (j.kind === "SUB" || j.kind === "ONE_TIME") && j.paid && (j.sla_ok ?? cfg.washer.sla_unknown_counts_as_met);

export const lastDayOfMonth = (month: string): string => {
  const [y, m] = month.split("-").map(Number);
  return `${month}-${String(daysInMonth(y, m)).padStart(2, "0")}`;
};
export const nextMonth = (month: string): string => {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

// ── washer days ──────────────────────────────────────────────────────────────

/** Pure: build the day row for one washer and date from that day's jobs. */
export function buildWasherDay(
  washer: EmployeeFact, date: string, jobs: JobFact[], isHoliday: boolean, cfg: IncentiveConfig, configVersion: number,
): WasherDay {
  const counted = jobs.filter((j) => countsFor(j, cfg));
  const contributing = counted.filter((j) => !(isHoliday && !cfg.washer.holiday_units_count_toward_slab));
  const units = washerUnits(counted.map((j) => ({ weight_type: j.weight_type, counts: true, is_holiday: isHoliday })), cfg);
  const revenue = contributing.reduce((a, j) => a + exGstRevenue(j.amount_incl_gst, cfg), 0);
  const type = washer.role === "PT_WASHER" ? "PART_TIME" : "FULL_TIME";
  let slab = 0, limit: number | null = null, amount = 0, limited = false;
  if (type === "FULL_TIME") {
    slab = fullTimeSlab(units, cfg);
    const g = applyGuard(slab, revenue, cfg);
    amount = g.paid; limit = g.limit; limited = g.limited;
  }
  return {
    id: `${washer.id}|${date}`, washer_id: washer.id, city_id: washer.city_id, work_date: date, employment_type: type,
    is_holiday: isHoliday, units, cars: contributing.length, ex_gst_revenue: Math.round(revenue * 100) / 100,
    slab_amount: slab, guard_limit: limit, amount, guard_limited: limited, config_version: configVersion,
    calculated_at: new Date().toISOString(),
  };
}

export function computeWasherDays(emps: EmployeeFact[], jobs: JobFact[], holidays: Set<string>): number {
  const washers = new Map(emps.filter((e) => e.role === "FT_WASHER" || e.role === "PT_WASHER").map((e) => [e.id, e] as const));
  const groups = new Map<string, JobFact[]>();
  for (const j of jobs) {
    if (!j.washer_id || !washers.has(j.washer_id)) continue;
    if (isMonthLocked(j.work_date.slice(0, 7))) continue;
    const k = `${j.washer_id}|${j.work_date}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(j);
  }
  const rows: WasherDay[] = [];
  for (const [k, js] of groups) {
    const [wid, date] = k.split("|");
    const row = getActiveRow(date);
    rows.push(buildWasherDay(washers.get(wid)!, date, js, holidays.has(date), row.config, row.version));
  }
  upsertMany("INC7_WASHER_DAYS", rows);
  return rows.length;
}

// ── TSE days ─────────────────────────────────────────────────────────────────

export function buildTseDay(tse: EmployeeFact, date: string, jobs: JobFact[], cfg: IncentiveConfig, configVersion: number): TseDay {
  const oneTime = jobs.filter((j) => j.kind === "ONE_TIME" && j.paid);
  const counted = oneTime.filter((j) => cfg.tse.counted_one_time_wash_types.includes(j.wash_type)).length;
  return {
    id: `${tse.id}|${date}`, tse_id: tse.id, city_id: tse.city_id, work_date: date,
    counted_washes: counted, all_one_time: oneTime.length, amount: tseDaily(counted, cfg),
    config_version: configVersion, calculated_at: new Date().toISOString(),
  };
}

export function computeTseDays(emps: EmployeeFact[], jobs: JobFact[]): number {
  const tses = new Map(emps.filter((e) => e.role === "TSE").map((e) => [e.id, e] as const));
  const groups = new Map<string, JobFact[]>();
  for (const j of jobs) {
    if (j.kind !== "ONE_TIME" || !j.tse_id || !tses.has(j.tse_id)) continue;
    if (isMonthLocked(j.work_date.slice(0, 7))) continue;
    const k = `${j.tse_id}|${j.work_date}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(j);
  }
  const rows: TseDay[] = [];
  for (const [k, js] of groups) {
    const [tid, date] = k.split("|");
    const row = getActiveRow(date);
    rows.push(buildTseDay(tses.get(tid)!, date, js, row.config, row.version));
  }
  upsertMany("INC7_TSE_DAYS", rows);
  return rows.length;
}

// ── ownership (Primary TSE Owner) ────────────────────────────────────────────

export function computeOwnership(emps: EmployeeFact[], jobs: JobFact[]): number {
  const tses = new Set(emps.filter((e) => e.role === "TSE").map((e) => e.id));
  const existing = new Set(readAll("INC7_OWNERSHIP").map((o) => `${o.customer_id}|${o.vehicle_id}`));
  const first = new Map<string, JobFact>();
  for (const j of jobs) {
    if (j.kind !== "ONE_TIME" || !j.paid) continue;
    const k = `${j.customer_id}|${j.vehicle_id}`;
    const cur = first.get(k);
    if (!cur || j.work_date < cur.work_date) first.set(k, j);
  }
  const rows = [];
  for (const [k, j] of first) {
    if (existing.has(k) || !j.tse_id || !tses.has(j.tse_id)) continue;
    const cfg = getActiveConfig(j.work_date);
    rows.push({
      id: `OWN-${k}`, customer_id: j.customer_id, vehicle_id: j.vehicle_id, city_id: j.city_id,
      primary_tse_id: j.tse_id, first_paid_one_time_wash_date: j.work_date, first_paid_job_id: j.job_id,
      conversion_window_end: addDays(j.work_date, cfg.tse.conversion.window_days), created_at: new Date().toISOString(),
    });
  }
  upsertMany("INC7_OWNERSHIP", rows);
  return rows.length;
}

// ── month summaries and ledger ───────────────────────────────────────────────

function monthDayRows<T extends { work_date: string }>(rows: T[], month: string): T[] {
  return rows.filter((r) => r.work_date.startsWith(month)).sort((a, b) => a.work_date.localeCompare(b.work_date));
}

/** TSM conversion rate for the month using the formula the Super Admin picked. null when not configured. */
export function tsmConversionRate(tsmTeamIds: Set<string>, month: string, formula: string | null): number | null {
  if (!formula) return null;
  const owners = readAll("INC7_OWNERSHIP").filter((o) => tsmTeamIds.has(o.primary_tse_id));
  const conversions = readAll("INC7_SALES").filter((s) => s.classification === "REPEAT_CONVERSION" && tsmTeamIds.has(s.tse_id));
  let num = 0, den = 0;
  if (formula === "converted_in_month_over_first_wash_in_month") {
    den = owners.filter((o) => o.first_paid_one_time_wash_date.startsWith(month)).length;
    num = conversions.filter((s) => s.sale_date.startsWith(month)).length;
  } else if (formula === "converted_in_month_over_window_expiring_in_month") {
    const cohort = owners.filter((o) => o.conversion_window_end.startsWith(month));
    den = cohort.length;
    num = cohort.filter((o) => conversions.some((s) => s.customer_id === o.customer_id && s.vehicle_id === o.vehicle_id)).length;
  } else return null;
  return den === 0 ? null : Math.round((num / den) * 10000) / 100;
}

export interface MonthResult { summaries: MonthSummary[]; ledger: Omit<LedgerRow, "id" | "created_at">[] }

export function computeMonth(emps: EmployeeFact[], month: string, closed: boolean): MonthResult {
  const cfg = getActiveConfig(lastDayOfMonth(month));
  const [y, m] = month.split("-").map(Number);
  const workingDays = workingDaysInMonth(cfg, y, m, getCalendarOverride(month));
  const nowIso = new Date().toISOString();
  const status: MonthSummary["status"] = closed ? "ELIGIBLE" : "OPEN";
  const summaries: MonthSummary[] = [];
  const ledger: MonthResult["ledger"] = [];
  const byId = new Map(emps.map((e) => [e.id, e] as const));

  // washers
  const washerDays = readAll("INC7_WASHER_DAYS");
  const washerIds = new Set(washerDays.filter((d) => d.work_date.startsWith(month)).map((d) => d.washer_id));
  for (const wid of washerIds) {
    const emp = byId.get(wid);
    const rows = monthDayRows(washerDays.filter((d) => d.washer_id === wid), month);
    const ftRows = rows.filter((r) => r.employment_type === "FULL_TIME" && (r.units > 0 || r.amount > 0)).slice(0, workingDays);
    const ptRows = rows.filter((r) => r.employment_type === "PART_TIME" && r.cars > 0).slice(0, workingDays);
    const ftGross = ftRows.reduce((a, r) => a + r.amount, 0);
    const ftCapped = applyMonthlyCap(ftGross, cfg);
    const cars = ptRows.reduce((a, r) => a + r.cars, 0);
    const pt = partTimeAcrossVersions(ptRows, cfg, (d) => getActiveConfig(d).washer.part_time.rate_per_car);
    const role: IncentiveRole = rows[rows.length - 1].employment_type === "PART_TIME" ? "PT_WASHER" : "FT_WASHER";
    const total = ftCapped + pt;
    summaries.push({
      id: `${role}|${wid}|${month}`, employee_id: wid, employee_name: emp?.name ?? wid, city_id: rows[0].city_id, role, month,
      days_counted: ftRows.length + ptRows.length, cars_counted: cars, gross_amount: ftGross + pt, capped_amount: total, status, updated_at: nowIso,
    });
    if (closed && total > 0) {
      ledger.push({ city_id: rows[0].city_id, employee_id: wid, employee_name: emp?.name ?? wid, role, component: "WASHER_MONTH", payroll_month: month, amount: total, source_id: `${role}|${wid}|${month}`, status: "ELIGIBLE", idempotency_key: `WASHER-${wid}-${month}` });
    }
  }

  // TSE one-time
  const tseDays = readAll("INC7_TSE_DAYS");
  const tseIds = new Set(tseDays.filter((d) => d.work_date.startsWith(month)).map((d) => d.tse_id));
  for (const tid of tseIds) {
    const emp = byId.get(tid);
    const rows = monthDayRows(tseDays.filter((d) => d.tse_id === tid), month);
    const total = rows.reduce((a, r) => a + r.amount, 0);
    summaries.push({
      id: `TSE|${tid}|${month}`, employee_id: tid, employee_name: emp?.name ?? tid, city_id: rows[0].city_id, role: "TSE", month,
      days_counted: rows.length, gross_amount: total, capped_amount: total, status, updated_at: nowIso,
    });
    if (closed && total > 0) {
      ledger.push({ city_id: rows[0].city_id, employee_id: tid, employee_name: emp?.name ?? tid, role: "TSE", component: "TSE_ONE_TIME_MONTH", payroll_month: month, amount: total, source_id: `TSE|${tid}|${month}`, status: "ELIGIBLE", idempotency_key: `TSEOT-${tid}-${month}` });
    }
  }

  // TSM
  for (const tsm of emps.filter((e) => e.role === "TSM")) {
    const team = new Set(emps.filter((e) => e.role === "TSE" && e.reportingManagerId && tsm.aliases.includes(e.reportingManagerId)).map((e) => e.id));
    if (team.size === 0) continue;
    const teamWashes = tseDays.filter((d) => team.has(d.tse_id) && d.work_date.startsWith(month)).reduce((a, d) => a + d.all_one_time, 0);
    const rate = tsmConversionRate(team, month, cfg.tsm.conversion_rate_definition);
    const vol = tsmVolumeBonus(teamWashes, cfg);
    const conv = tsmConversionBonus(rate, cfg);
    summaries.push({
      id: `TSM|${tsm.id}|${month}`, employee_id: tsm.id, employee_name: tsm.name, city_id: tsm.city_id, role: "TSM", month,
      team_washes: teamWashes, conversion_rate: rate, volume_bonus: vol, conversion_bonus: conv, gross_amount: vol + conv, capped_amount: vol + conv, status, updated_at: nowIso,
    });
    if (closed && vol > 0) ledger.push({ city_id: tsm.city_id, employee_id: tsm.id, employee_name: tsm.name, role: "TSM", component: "TSM_VOLUME", payroll_month: month, amount: vol, source_id: `TSM|${tsm.id}|${month}`, status: "ELIGIBLE", idempotency_key: `TSMV-${tsm.id}-${month}` });
    if (closed && conv > 0) ledger.push({ city_id: tsm.city_id, employee_id: tsm.id, employee_name: tsm.name, role: "TSM", component: "TSM_CONVERSION", payroll_month: month, amount: conv, source_id: `TSM|${tsm.id}|${month}`, status: "ELIGIBLE", idempotency_key: `TSMC-${tsm.id}-${month}` });
  }
  return { summaries, ledger };
}
