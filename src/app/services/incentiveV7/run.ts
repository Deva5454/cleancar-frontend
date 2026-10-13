/**
 * Incentive V7 — orchestrator. Runs on app load and on an interval. Safe to run repeatedly.
 * mode "legacy": does nothing. "shadow": calculates and stores, never pays. "v7": same, and payroll posting is allowed.
 */
import { computeMonth, computeOwnership, computeTseDays, computeWasherDays } from "./calc";
import { ensureSeeded, getMode, saveSettings } from "./configService";
import { istDate } from "./engine";
import { loadEmployees, loadHolidayDates, loadJobs } from "./facts";
import { instalmentLedgerRows, syncAppliedStatus, syncLedger } from "./ledger";
import { computeSales, evaluateInstalments } from "./sales";
import { isMonthLocked, readAll, upsertMany } from "./store";
import { getActiveConfig } from "./configService";

let running = false;

export function runIncentiveV7(): { ran: boolean; message: string } {
  if (running) return { ran: false, message: "Already running" };
  ensureSeeded();
  if (getMode() === "legacy") return { ran: false, message: "Mode is legacy; V7 is idle" };
  running = true;
  try {
    const today = istDate(new Date().toISOString());
    const currentMonth = today.slice(0, 7);
    const emps = loadEmployees();
    const jobs = loadJobs(getActiveConfig(today), emps);
    const wd = computeWasherDays(emps, jobs, loadHolidayDates());
    const td = computeTseDays(emps, jobs);
    const ow = computeOwnership(emps, jobs);
    const sales = computeSales(emps, jobs, today);
    evaluateInstalments(today);

    const months = new Set<string>([currentMonth]);
    for (const d of readAll("INC7_WASHER_DAYS")) months.add(d.work_date.slice(0, 7));
    for (const d of readAll("INC7_TSE_DAYS")) months.add(d.work_date.slice(0, 7));
    const names = new Map(emps.map((e) => [e.id, e.name] as const));
    const ledgerRows = instalmentLedgerRows(names);
    const processed = new Set<string>();
    for (const m of [...months].sort()) {
      if (isMonthLocked(m)) continue;
      const closed = m < currentMonth;
      const r = computeMonth(emps, m, closed);
      upsertMany("INC7_MONTH_SUMMARIES", r.summaries.map((s) => {
        const prev = readAll("INC7_MONTH_SUMMARIES").find((x) => x.id === s.id);
        return prev && prev.status === "RELEASED" ? prev : s;
      }));
      ledgerRows.push(...r.ledger);
      if (closed) processed.add(m);
    }
    syncLedger(ledgerRows, processed);
    syncAppliedStatus();
    const msg = `${wd} washer-days, ${td} TSE-days, ${ow} new owners, ${sales.created} new sales`;
    saveSettings({ last_run_at: new Date().toISOString(), last_run_summary: msg });
    return { ran: true, message: msg };
  } catch (e) {
    const msg = `V7 run failed: ${(e as Error).message}`;
    saveSettings({ last_run_at: new Date().toISOString(), last_run_summary: msg });
    return { ran: false, message: msg };
  } finally {
    running = false;
  }
}
