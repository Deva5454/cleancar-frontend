// Run: npm run test:incentive   (bundles with esbuild, runs on node)
import { readFileSync } from "node:fs";
import * as E from "../../src/app/services/incentiveV7/engine";
import { DEFAULT_INCENTIVE_CONFIG } from "../../src/app/services/incentiveV7/defaultConfig";

const cfg: any = structuredClone(DEFAULT_INCENTIVE_CONFIG);
const V: any = JSON.parse(readFileSync("tests/incentiveV7/test-vectors.json", "utf8"));
let pass = 0, fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : (fail++, console.log(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`));
};
V.fullTimeSlab.forEach((t: any) => eq(`fullTimeSlab(${t.units})`, E.fullTimeSlab(t.units, cfg), t.expect));
V.guard.forEach((t: any) => { const r: any = E.applyGuard(t.slab, t.exGstRevenue, cfg); eq(`guard.paid ${t.slab}`, r.paid, t.expectPaid); eq(`guard.limited`, r.limited, t.expectLimited); });
V.partTime.forEach((t: any) => eq(`partTime(${t.cars})`, E.partTimeMonthly(t.cars, cfg), t.expect));
V.tseDaily.forEach((t: any) => eq(`tseDaily(${t.washes})`, E.tseDaily(t.washes, cfg), t.expect));
V.tsmVolume.forEach((t: any) => eq(`tsmVolume(${t.washes})`, E.tsmVolumeBonus(t.washes, cfg), t.expect));
V.tsmConversion_definitionNull.forEach((t: any) => eq(`tsmConv null (${t.ratePct})`, E.tsmConversionBonus(t.ratePct, cfg), t.expect));
const cfgSet = structuredClone(cfg); cfgSet.tsm.conversion_rate_definition = "converted_in_month_over_first_wash_in_month";
V.tsmConversion_definitionSet.forEach((t: any) => eq(`tsmConv set (${t.ratePct})`, E.tsmConversionBonus(t.ratePct, cfgSet), t.expect));
V.instalments.forEach((t: any) => {
  const s = E.instalmentSchedule({ total: t.total, termMonths: t.term, planStart: t.planStart }, cfg);
  if (t.expectAmounts) eq(`inst ${t.family}/${t.term} amounts`, s.map((x) => x.amount), t.expectAmounts);
  if (t.expectDue) eq(`inst ${t.family}/${t.term} due`, s.map((x) => x.due_date), t.expectDue);
  if (t.expectPayrollMonths) eq(`inst payroll months`, s.map((x) => x.payroll_month), t.expectPayrollMonths);
  eq(`inst sum`, s.reduce((a, b) => a + b.amount, 0), t.total);
});
V.classify.forEach((t: any, i: number) => eq(`classify[${i}]`, E.classifySale(t.ctx, cfg), t.expect));
V.incentiveTotal.forEach((t: any, i: number) => eq(`incentiveTotal[${i}]`, E.incentiveTotal(t, cfg), t.expect));
V.evaluateInstalment.forEach((t: any, i: number) => eq(`evalInst[${i}]`, E.evaluateInstalment(t.inst, t.facts, t.today).status, t.expect));
V.exit.forEach((t: any, i: number) => eq(`exit[${i}]`, E.exitForfeits(t.payrollMonths.map((m: string) => ({ status: "PENDING", payroll_month: m })), t.lastWorkingDay), t.expectForfeited));
V.workingDays.forEach((t: any) => eq(`workingDays ${t.year}-${t.month}`, E.workingDaysInMonth(cfg, t.year, t.month), t.expect));
const hj = [...Array(10)].map(() => ({ weight_type: "default", counts: true, is_holiday: true })) as any;
eq("holiday ON", E.washerUnits(hj, cfg), 10);
const off = structuredClone(cfg); off.washer.holiday_units_count_toward_slab = false;
eq("holiday OFF", E.washerUnits(hj, off), 0);
eq("deep clean = 2", E.washerUnits([{ weight_type: "interior_deep_clean_chemical", counts: true, is_holiday: false }, { weight_type: "default", counts: true, is_holiday: false }] as any, cfg), 3);
eq("uncounted", E.washerUnits([{ weight_type: "default", counts: false, is_holiday: false }] as any, cfg), 0);
eq("sale partial", E.saleStatus([{ status: "RELEASED" }, { status: "PENDING" }]), "PARTIALLY_RELEASED");
eq("sale cancelled", E.saleStatus([{ status: "FORFEITED" }, { status: "FORFEITED" }]), "CANCELLED");
eq("sale released", E.saleStatus([{ status: "RELEASED" }, { status: "RELEASED" }]), "RELEASED");
// ── version cut-over: change effective 15 Aug => 14 Aug old, 15 Aug new ──
const vs = [{ version: 1, effective_from: "2000-01-01" }, { version: 2, effective_from: "2026-08-15" }, { version: 3, effective_from: "2026-08-15" }, { version: 4, effective_from: "2026-09-01" }];
eq("14 Aug -> v1", E.pickVersion(vs, "2026-08-14").version, 1);
eq("15 Aug start -> v3 (latest for that date)", E.pickVersion(vs, "2026-08-15").version, 3);
eq("31 Aug -> v3", E.pickVersion(vs, "2026-08-31").version, 3);
eq("1 Sep -> v4", E.pickVersion(vs, "2026-09-01").version, 4);
// same day, two regimes: 6 units under old and new slab
const newCfg: any = structuredClone(cfg); newCfg.washer.full_time.slab.rate_per_unit = 60;
eq("old regime 14 Aug (6 units)", E.fullTimeSlab(6, cfg), 300);
eq("new regime 15 Aug (6 units)", E.fullTimeSlab(6, newCfg), 360);
// part-time spanning a rate change: 200 cars at 10, then 150 cars at 12
const ptRows = [{ work_date: "2026-08-10", cars: 200 }, { work_date: "2026-08-20", cars: 150 }];
eq("part-time across versions", E.partTimeAcrossVersions(ptRows, cfg, (d) => (d < "2026-08-15" ? 10 : 12)), 3800);
eq("part-time single version equals monthly", E.partTimeAcrossVersions(ptRows, cfg, () => 10), E.partTimeMonthly(350, cfg));
eq("part-time below threshold", E.partTimeAcrossVersions([{ work_date: "2026-08-10", cars: 299 }], cfg, () => 10), 0);
eq("part-time cap applies in order", E.partTimeAcrossVersions([{ work_date: "2026-08-10", cars: 450 }, { work_date: "2026-08-20", cars: 100 }], cfg, (d) => (d < "2026-08-15" ? 10 : 12)), 450 * 10 + 50 * 12);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
