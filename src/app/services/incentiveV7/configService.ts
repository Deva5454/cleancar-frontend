/**
 * Incentive V7 — versioned configuration.
 * Versions are append-only. The config in force on a date D is the version with the greatest
 * effective_from <= D (or the earliest version if D is before all of them). A new version never
 * rewrites past results: every summary row stores the version it used.
 */
import { DEFAULT_INCENTIVE_CONFIG } from "./defaultConfig";
import { pickVersion } from "./engine";
import { audit, readAll, upsertMany, writeAll } from "./store";
import type { CalendarOverride, ConfigVersionRow, IncentiveConfig, IncentiveMode, V7Settings } from "./types";

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const todayIST = (): string => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

// ── TSM conversion-rate formulas the Super Admin can choose from ─────────────
export const TSM_CONVERSION_FORMULAS: { key: string; label: string; description: string }[] = [
  {
    key: "converted_in_month_over_first_wash_in_month",
    label: "Conversions in the month / customers whose first paid wash was in the month",
    description:
      "Numerator: repeat conversions with a sale date in the month. Denominator: customer-vehicles whose first completed, paid one-time wash falls in the month.",
  },
  {
    key: "converted_in_month_over_window_expiring_in_month",
    label: "Conversions / customers whose 30-day window ended in the month",
    description: "Cohort view: of the customers whose 30-day window ends in the month, the share that converted within it.",
  },
];

// ── versions ─────────────────────────────────────────────────────────────────
export function ensureSeeded(): void {
  if (readAll("INC7_CONFIG_VERSIONS").length > 0) return;
  const cfg = clone(DEFAULT_INCENTIVE_CONFIG);
  const row: ConfigVersionRow = {
    id: "CFG-1", version: 1, effective_from: "2000-01-01", config: { ...cfg, version: 1, effective_from: "2000-01-01" },
    created_by: "SYSTEM", created_at: new Date().toISOString(), reason: "Initial configuration (7 Oct plan)",
  };
  writeAll("INC7_CONFIG_VERSIONS", [row]);
  audit("SYSTEM", "CONFIG_SEED", "config", row.id, "Seeded version 1 from the 7 Oct plan");
}

export function getVersions(): ConfigVersionRow[] {
  ensureSeeded();
  return [...readAll("INC7_CONFIG_VERSIONS")].sort((a, b) => a.version - b.version);
}

export function getActiveRow(date: string = todayIST()): ConfigVersionRow {
  return pickVersion(getVersions(), date);
}
export const getActiveConfig = (date?: string): IncentiveConfig => getActiveRow(date).config;

// ── validation ───────────────────────────────────────────────────────────────
export function validateConfig(c: IncentiveConfig): string[] {
  const e: string[] = [];
  const nn = (v: unknown, label: string) => { if (typeof v !== "number" || !Number.isFinite(v) || v < 0) e.push(`${label} must be a number, zero or more`); };
  const inc = (arr: number[], label: string) => { for (let i = 1; i < arr.length; i++) if (arr[i] <= arr[i - 1]) { e.push(`${label} must be in strictly increasing order`); break; } };

  nn(c.gst_divisor, "GST divisor"); if (c.gst_divisor < 1) e.push("GST divisor must be 1 or more");
  nn(c.calendar.weekly_offs_per_month, "Weekly offs per month");
  const w = c.washer;
  nn(w.sla_minutes, "SLA minutes");
  nn(w.unit_weights.default, "Default unit weight"); nn(w.unit_weights.interior_deep_clean_chemical, "Deep clean unit weight");
  const s = w.full_time.slab;
  nn(s.start_unit, "Slab start unit"); nn(s.rate_per_unit, "Slab rate per unit"); nn(s.bonus_unit, "Slab bonus unit"); nn(s.bonus_amount, "Slab bonus amount");
  if (s.start_unit > s.bonus_unit) e.push("Slab start unit must not be greater than the bonus unit");
  const g = w.full_time.guard;
  if (typeof g.pct_of_ex_gst_revenue !== "number" || g.pct_of_ex_gst_revenue < 0 || g.pct_of_ex_gst_revenue > 1) e.push("Guard percentage must be between 0% and 100%");
  if (g.monthly_cap_per_washer != null) nn(g.monthly_cap_per_washer, "Monthly cap per washer");
  const p = w.part_time;
  nn(p.threshold_cars, "Part-time threshold"); nn(p.rate_per_car, "Part-time rate per car"); nn(p.cap_cars, "Part-time cap");
  if (p.cap_cars < p.threshold_cars) e.push("Part-time cap must not be below the threshold");

  const t = c.tse;
  nn(t.daily_slab.per_car_start, "TSE per-car start"); nn(t.daily_slab.per_car_rate, "TSE per-car rate");
  t.daily_slab.milestones.forEach((m, i) => { nn(m.at, `TSE milestone ${i + 1} wash count`); nn(m.bonus, `TSE milestone ${i + 1} bonus`); });
  inc(t.daily_slab.milestones.map((m) => m.at), "TSE milestones");
  if (t.counted_one_time_wash_types.length === 0) e.push("At least one wash type must count for the TSE");
  nn(t.conversion.window_days, "Conversion window days");
  (Object.keys(t.conversion.matrix) as (keyof typeof t.conversion.matrix)[]).forEach((f) => {
    Object.entries(t.conversion.matrix[f]).forEach(([term, amt]) => nn(amt, `Conversion ${f} / ${term} month`));
  });
  t.conversion.renewals.forEach((r, i) => nn(r, `Renewal ${i + 1}`));
  Object.entries(t.conversion.wash_milestones).forEach(([k, v]) => nn(v, `Wash milestone ${k}`));
  Object.entries(t.conversion.upgrades).forEach(([k, v]) => nn(v, `Upgrade ${k}`));
  const ins = t.instalments;
  const cps = ins.checkpoint_months;
  if (cps.length === 0 || cps.some((k) => !Number.isInteger(k) || k < 1)) e.push("Checkpoint months must be whole numbers, 1 or more");
  inc(cps, "Checkpoint months");
  Object.entries(ins.first_share_by_term).forEach(([term, v]) => { if (typeof v !== "number" || v < 0 || v > 1) e.push(`First instalment share for ${term} months must be between 0% and 100%`); });

  inc(c.tsm.volume_tiers.map((x) => x.washes), "TSM volume tiers");
  c.tsm.volume_tiers.forEach((x, i) => nn(x.bonus, `TSM volume bonus ${i + 1}`));
  inc(c.tsm.conversion_tiers.map((x) => x.rate_pct), "TSM conversion tiers");
  c.tsm.conversion_tiers.forEach((x, i) => nn(x.bonus, `TSM conversion bonus ${i + 1}`));
  if (c.tsm.conversion_rate_definition != null && !TSM_CONVERSION_FORMULAS.some((f) => f.key === c.tsm.conversion_rate_definition)) {
    e.push("TSM conversion-rate definition is not a known formula");
  }
  return e;
}

// ── publish ──────────────────────────────────────────────────────────────────
export function publishConfig(
  config: IncentiveConfig, effectiveFrom: string, actor: string, reason: string,
): { ok: true; row: ConfigVersionRow } | { ok: false; errors: string[] } {
  const errors = validateConfig(config);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) errors.push("Effective-from date is required");
  else if (effectiveFrom < todayIST()) errors.push("Effective-from date cannot be in the past");
  if (!reason.trim()) errors.push("A reason is required");
  if (errors.length) return { ok: false, errors };
  const versions = getVersions();
  const next = versions[versions.length - 1].version + 1;
  const row: ConfigVersionRow = {
    id: `CFG-${next}`, version: next, effective_from: effectiveFrom,
    config: { ...clone(config), version: next, effective_from: effectiveFrom },
    created_by: actor, created_at: new Date().toISOString(), reason: reason.trim(),
  };
  upsertMany("INC7_CONFIG_VERSIONS", [row]);
  audit(actor, "CONFIG_PUBLISH", "config", row.id, `v${next} from ${effectiveFrom}: ${reason.trim()}`);
  return { ok: true, row };
}

/** HR toggle: counts holiday units toward the full-time daily slab. Creates a new version changing only that field. */
export function setHolidayUnitsToggle(value: boolean, effectiveFrom: string, actor: string) {
  const cfg = clone(getActiveConfig(effectiveFrom));
  cfg.washer.holiday_units_count_toward_slab = value;
  const r = publishConfig(cfg, effectiveFrom, actor, `HR toggle: holiday units count toward daily slab = ${value ? "Applicable" : "Not Applicable"}`);
  if (r.ok) audit(actor, "HOLIDAY_TOGGLE", "config", r.row.id, String(value));
  return r;
}

/** Super Admin selects the TSM conversion-rate formula, or null (conversion bonus stays 0). */
export function setTsmConversionFormula(key: string | null, effectiveFrom: string, actor: string) {
  const cfg = clone(getActiveConfig(effectiveFrom));
  cfg.tsm.conversion_rate_definition = key;
  return publishConfig(cfg, effectiveFrom, actor, key ? `Super Admin set TSM conversion formula: ${key}` : "Super Admin cleared TSM conversion formula (bonus = 0)");
}

// ── settings / mode ──────────────────────────────────────────────────────────
export function getSettings(): V7Settings {
  return readAll("INC7_SETTINGS")[0] ?? { id: "settings", mode: "shadow" };
}
export function saveSettings(patch: Partial<V7Settings>): V7Settings {
  const next = { ...getSettings(), ...patch, id: "settings" as const };
  writeAll("INC7_SETTINGS", [next]);
  return next;
}
export const getMode = (): IncentiveMode => getSettings().mode;
export function setMode(mode: IncentiveMode, actor: string): void {
  const prev = getMode();
  saveSettings({ mode });
  audit(actor, "MODE_CHANGE", "settings", "mode", `${prev} -> ${mode}`);
}

// ── HR calendar override ─────────────────────────────────────────────────────
export function getCalendarOverride(month: string): number | null {
  return readAll("INC7_CALENDAR").find((c) => c.month === month)?.working_days ?? null;
}
export function setCalendarOverride(month: string, workingDays: number | null, actor: string): void {
  const row: CalendarOverride = { id: month, month, working_days: workingDays };
  upsertMany("INC7_CALENDAR", [row]);
  audit(actor, "CALENDAR_OVERRIDE", "calendar", month, String(workingDays));
}
