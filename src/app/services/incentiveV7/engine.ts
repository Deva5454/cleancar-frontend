/**
 * Incentive V7 — pure calculation engine (TypeScript port of incentive-handover/reference/engine.mjs).
 * No storage, no clock, no network. Every function is deterministic and covered by the shared test vectors.
 * Money is whole rupees. Dates are "YYYY-MM-DD" (IST). Months are "YYYY-MM".
 */
import type { Family, IncentiveConfig, Instalment } from "./types";

// ── dates ────────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
export const parseDate = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
export const fmtDate = (dt: Date): string => `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
export const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Add k calendar months, clamping to the last day of the target month. */
export function addMonths(dateStr: string, k: number): string {
  const dt = parseDate(dateStr);
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth();
  const d = dt.getUTCDate();
  const total = m + k;
  const ty = y + Math.floor(total / 12);
  const tm = ((total % 12) + 12) % 12;
  const td = Math.min(d, daysInMonth(ty, tm + 1));
  return fmtDate(new Date(Date.UTC(ty, tm, td)));
}
export const addDays = (dateStr: string, n: number): string => {
  const dt = parseDate(dateStr);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fmtDate(dt);
};
export const diffDays = (a: string, b: string): number => Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
export const monthOf = (dateStr: string): string => dateStr.slice(0, 7);

/** IST calendar date of an ISO timestamp. */
export function istDate(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso.slice(0, 10);
  return fmtDate(new Date(t + 330 * 60000));
}
/** Minutes since midnight IST of an ISO timestamp. */
export function istMinutes(iso: string): number {
  const t = new Date(iso).getTime() + 330 * 60000;
  const d = new Date(t);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

// ── calendar ─────────────────────────────────────────────────────────────────
export function workingDaysInMonth(cfg: IncentiveConfig, year: number, month: number, override: number | null = null): number {
  if (override != null) return override;
  return daysInMonth(year, month) - cfg.calendar.weekly_offs_per_month;
}

// ── washers ──────────────────────────────────────────────────────────────────
export interface WasherJobFact {
  weight_type: string;
  counts: boolean;
  is_holiday: boolean;
}

export function washerUnits(jobs: WasherJobFact[], cfg: IncentiveConfig): number {
  let units = 0;
  for (const j of jobs) {
    if (!j.counts) continue;
    if (j.is_holiday && !cfg.washer.holiday_units_count_toward_slab) continue;
    units += cfg.washer.unit_weights[j.weight_type] ?? cfg.washer.unit_weights.default;
  }
  return units;
}

export function fullTimeSlab(units: number, cfg: IncentiveConfig): number {
  const s = cfg.washer.full_time.slab;
  if (units < s.start_unit) return 0;
  let pay = s.rate_per_unit * units;
  if (units >= s.bonus_unit) pay += s.bonus_amount;
  return pay;
}

export function applyGuard(slabAmount: number, exGstRevenue: number, cfg: IncentiveConfig) {
  const g = cfg.washer.full_time.guard;
  if (!g.enabled) return { paid: slabAmount, slab: slabAmount, limit: null as number | null, limited: false };
  const limit = Math.floor(g.pct_of_ex_gst_revenue * exGstRevenue);
  const paid = Math.min(slabAmount, limit);
  return { paid, slab: slabAmount, limit: limit as number | null, limited: paid < slabAmount };
}

export const exGstRevenue = (amountInclGst: number, cfg: IncentiveConfig): number => amountInclGst / cfg.gst_divisor;

export function applyMonthlyCap(monthTotal: number, cfg: IncentiveConfig): number {
  const cap = cfg.washer.full_time.guard.monthly_cap_per_washer;
  return cap == null ? monthTotal : Math.min(monthTotal, cap);
}

export function partTimeMonthly(carsCounted: number, cfg: IncentiveConfig): number {
  const p = cfg.washer.part_time;
  if (carsCounted < p.threshold_cars) return 0;
  return p.rate_per_car * Math.min(carsCounted, p.cap_cars);
}

/**
 * Part-time pay when the rule changes inside the month.
 * Qualification (threshold) and the car cap come from the version in force on the last day of the month;
 * each car is paid at the rate of the version in force on the day it was washed (first cars count first).
 */
export function partTimeAcrossVersions(
  rows: { work_date: string; cars: number }[], cfgEnd: IncentiveConfig, rateFor: (date: string) => number,
): number {
  const p = cfgEnd.washer.part_time;
  const total = rows.reduce((a, r) => a + r.cars, 0);
  if (total < p.threshold_cars) return 0;
  let left = p.cap_cars, amount = 0;
  for (const r of [...rows].sort((a, b) => a.work_date.localeCompare(b.work_date))) {
    const take = Math.min(r.cars, left);
    left -= take;
    amount += take * rateFor(r.work_date);
  }
  return amount;
}

/** The version in force on a date: greatest effective_from <= date (ties: highest version). Before all: the earliest. */
export function pickVersion<T extends { version: number; effective_from: string }>(versions: T[], date: string): T {
  const eligible = versions.filter((v) => v.effective_from <= date);
  if (eligible.length === 0) return [...versions].sort((a, b) => a.version - b.version)[0];
  return eligible.reduce((best, v) =>
    v.effective_from > best.effective_from || (v.effective_from === best.effective_from && v.version > best.version) ? v : best);
}

// ── TSE / TSM ────────────────────────────────────────────────────────────────
export function tseDaily(countedWashes: number, cfg: IncentiveConfig): number {
  const s = cfg.tse.daily_slab;
  let pay = s.per_car_rate * Math.max(0, countedWashes - (s.per_car_start - 1));
  for (const m of s.milestones) if (countedWashes >= m.at) pay += m.bonus;
  return pay;
}

export function tsmVolumeBonus(teamWashes: number, cfg: IncentiveConfig): number {
  let bonus = 0;
  for (const t of cfg.tsm.volume_tiers) if (teamWashes >= t.washes) bonus = t.bonus;
  return bonus;
}

export function tsmConversionBonus(ratePct: number | null, cfg: IncentiveConfig): number {
  if (ratePct == null || cfg.tsm.conversion_rate_definition == null) return 0;
  let bonus = 0;
  for (const t of cfg.tsm.conversion_tiers) if (ratePct >= t.rate_pct) bonus = t.bonus;
  return bonus;
}

// ── conversion sales ─────────────────────────────────────────────────────────
const RANK: Record<Family, number> = { PACK2: 1, PACK4: 2, DAILY_SUB: 3 };

export interface ClassifyCtx {
  saleDate: string;
  family: Family;
  firstPaidOneTimeWashDate: string | null;
  hasPriorConversion: boolean;
  activeFamily: Family | null;
}
export type Classification = "UPGRADE" | "RENEWAL" | "REPEAT_CONVERSION" | "PACKAGE_NO_INCENTIVE";

export function classifySale(ctx: ClassifyCtx, cfg: IncentiveConfig): Classification {
  if (ctx.activeFamily && RANK[ctx.family] > RANK[ctx.activeFamily]) return "UPGRADE";
  if (ctx.hasPriorConversion) return "RENEWAL";
  if (ctx.firstPaidOneTimeWashDate) {
    const days = diffDays(ctx.firstPaidOneTimeWashDate, ctx.saleDate);
    if (days >= 0 && days <= cfg.tse.conversion.window_days) return "REPEAT_CONVERSION";
  }
  return "PACKAGE_NO_INCENTIVE";
}

export const conversionWindowEnd = (firstWash: string, cfg: IncentiveConfig): string => addDays(firstWash, cfg.tse.conversion.window_days);

export function incentiveTotal(
  p: { klass: string; family?: Family; termMonths?: number; renewalNumber?: number; upgradeKey?: string },
  cfg: IncentiveConfig,
): number {
  const c = cfg.tse.conversion;
  if (p.klass === "REPEAT_CONVERSION") return (p.family && c.matrix[p.family]?.[String(p.termMonths)]) || 0;
  if (p.klass === "RENEWAL") return c.renewals[Math.min(p.renewalNumber ?? 1, c.renewals.length) - 1] ?? 0;
  if (p.klass === "UPGRADE") return (p.upgradeKey && c.upgrades[p.upgradeKey]) || 0;
  return 0;
}

export type ScheduleRow = Pick<Instalment, "seq" | "checkpoint_month" | "due_date" | "payroll_month" | "amount" | "status">;

export function instalmentSchedule(p: { total: number; termMonths: number; planStart: string }, cfg: IncentiveConfig): ScheduleRow[] {
  const ins = cfg.tse.instalments;
  const cps = ins.checkpoint_months.filter((k) => k <= p.termMonths);
  if (!cps.includes(p.termMonths)) cps.push(p.termMonths);
  const firstShare = ins.first_share_by_term[String(p.termMonths)] ?? 1 / cps.length;
  const shares = cps.map((_, i) => (i === 0 ? firstShare : cps.length > 1 ? (1 - firstShare) / (cps.length - 1) : 0));
  const amounts = shares.map((s) => Math.round(p.total * s));
  const diff = p.total - amounts.reduce((a, b) => a + b, 0);
  amounts[amounts.length - 1] += diff;
  return cps.map((k, i) => {
    const due = addDays(addMonths(p.planStart, k), -1);
    return { seq: i + 1, checkpoint_month: k, due_date: due, payroll_month: monthOf(due), amount: amounts[i], status: "PENDING" as const };
  });
}

export interface InstalmentFacts { cancelledOn: string | null; refundedOn: string | null; paymentReceived: boolean }

export function evaluateInstalment(
  inst: { status: string; due_date: string },
  facts: InstalmentFacts,
  today: string,
): { status: "PENDING" | "ELIGIBLE" | "RELEASED" | "FORFEITED"; reason?: "CANCEL_BEFORE_DUE" | "REFUND_BEFORE_DUE" } {
  if (inst.status === "RELEASED" || inst.status === "FORFEITED") return { status: inst.status };
  const ended = [facts.cancelledOn, facts.refundedOn].filter(Boolean).sort() as string[];
  const endedOn = ended[0] ?? null;
  if (endedOn && endedOn <= inst.due_date) {
    return { status: "FORFEITED", reason: facts.refundedOn && endedOn === facts.refundedOn ? "REFUND_BEFORE_DUE" : "CANCEL_BEFORE_DUE" };
  }
  if (today > inst.due_date && facts.paymentReceived) return { status: "ELIGIBLE" };
  return { status: "PENDING" };
}

export function saleStatus(instalments: { status: string }[]): "PENDING" | "PARTIALLY_RELEASED" | "RELEASED" | "CANCELLED" {
  const st = instalments.map((i) => i.status);
  if (st.length === 0) return "PENDING";
  if (st.every((s) => s === "FORFEITED")) return "CANCELLED";
  if (st.every((s) => s === "RELEASED" || s === "FORFEITED")) return st.some((s) => s === "RELEASED") ? "RELEASED" : "CANCELLED";
  if (st.some((s) => s === "RELEASED")) return "PARTIALLY_RELEASED";
  return "PENDING";
}

/** Instalments whose payroll month is later than the month of the last working day are forfeited. */
export function exitForfeits<T extends { status: string; payroll_month: string }>(instalments: T[], lastWorkingDay: string): boolean[] {
  const last = monthOf(lastWorkingDay);
  return instalments.map((i) => !(i.status === "RELEASED" || i.status === "FORFEITED") && i.payroll_month > last);
}

export function provisionEntries(event: "SALE" | "RELEASE" | "FORFEIT", amount: number) {
  switch (event) {
    case "SALE": return { debit_account: "INCENTIVE_EXPENSE", credit_account: "INCENTIVE_PROVISION", amount };
    case "RELEASE": return { debit_account: "INCENTIVE_PROVISION", credit_account: "PAYROLL_PAYABLE", amount };
    case "FORFEIT": return { debit_account: "INCENTIVE_PROVISION", credit_account: "INCENTIVE_EXPENSE", amount };
  }
}
