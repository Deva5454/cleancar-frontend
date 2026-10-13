/**
 * Incentive V7 — ledger (single source of payable truth) and payroll adapter.
 * Ledger rows are idempotent by key. RELEASED rows are never altered; corrections would be new rows.
 */
import { otherAdjustmentsService } from "../otherAdjustmentsService";
import { getMode } from "./configService";
import { provisionEntries } from "./engine";
import { audit, isMonthLocked, readAll, upsertMany, writeAll } from "./store";
import type { LedgerRow, ProvisionEntry } from "./types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const payrollLabel = (m: string): string => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

export const INCENTIVE_CATEGORIES = [
  "Incentive - Washer", "Incentive - TSE one-time", "Incentive - TSE conversion", "Incentive - TSM",
];
const categoryFor = (c: LedgerRow["component"]): string =>
  c === "WASHER_MONTH" ? INCENTIVE_CATEGORIES[0] : c === "TSE_ONE_TIME_MONTH" ? INCENTIVE_CATEGORIES[1] : c === "TSE_INSTALMENT" ? INCENTIVE_CATEGORIES[2] : INCENTIVE_CATEGORIES[3];

export function syncLedger(rows: Omit<LedgerRow, "id" | "created_at">[], processedMonths: Set<string>): void {
  const existing = new Map(readAll("INC7_LEDGER").map((r) => [r.idempotency_key, r] as const));
  const keys = new Set(rows.map((r) => r.idempotency_key));
  const out: LedgerRow[] = [];
  const nowIso = new Date().toISOString();
  for (const r of rows) {
    const cur = existing.get(r.idempotency_key);
    if (!cur) out.push({ ...r, id: r.idempotency_key, created_at: nowIso });
    else if (cur.status === "ELIGIBLE" && (cur.amount !== r.amount || cur.payroll_month !== r.payroll_month)) out.push({ ...cur, amount: r.amount, payroll_month: r.payroll_month });
  }
  // eligible month-based rows that no longer qualify are reversed (instalments are handled by their own status)
  for (const cur of existing.values()) {
    if (cur.status === "ELIGIBLE" && cur.component !== "TSE_INSTALMENT" && processedMonths.has(cur.payroll_month) && !keys.has(cur.idempotency_key)) {
      out.push({ ...cur, status: "REVERSED" });
    }
  }
  upsertMany("INC7_LEDGER", out);
}

/** Ledger rows for ELIGIBLE instalments (released ones already have their row). */
export function instalmentLedgerRows(names: Map<string, string>): Omit<LedgerRow, "id" | "created_at">[] {
  const sales = new Map(readAll("INC7_SALES").map((s) => [s.id, s] as const));
  return readAll("INC7_INSTALMENTS").filter((i) => i.status === "ELIGIBLE" && i.amount > 0).map((i) => ({
    city_id: i.city_id, employee_id: i.tse_id, employee_name: names.get(i.tse_id) ?? i.tse_id, role: "TSE" as const,
    component: "TSE_INSTALMENT" as const, payroll_month: i.payroll_month, amount: i.amount, source_id: i.id,
    status: "ELIGIBLE" as const, idempotency_key: `INST-${i.id}`,
    ...(sales.get(i.sale_id) ? {} : {}),
  }));
}

/** Creates Approved "OtherEarning" adjustments for a payroll month. Only in v7 mode. Idempotent. */
export function postToPayroll(month: string, actor: string): { posted: number; total: number; skipped?: string } {
  if (getMode() !== "v7") return { posted: 0, total: 0, skipped: "Mode is not 'v7' (legacy or shadow): nothing is posted to payroll." };
  const ledger = readAll("INC7_LEDGER");
  const todo = ledger.filter((r) => r.status === "ELIGIBLE" && r.payroll_month === month && r.amount > 0);
  const insts = new Map(readAll("INC7_INSTALMENTS").map((i) => [i.id, i] as const));
  const sales = new Map(readAll("INC7_SALES").map((s) => [s.id, s] as const));
  const nowIso = new Date().toISOString();
  const provNew: ProvisionEntry[] = [];
  const done: LedgerRow[] = [];
  let total = 0;
  for (const r of todo) {
    const rec = otherAdjustmentsService.create({
      type: "OtherEarning", employeeId: r.employee_id, employeeName: r.employee_name, employeeRole: r.role, city: r.city_id,
      amount: r.amount, reason: `Incentive V7 ${r.component} ${month}`, category: categoryFor(r.component),
      payrollMonth: payrollLabel(month), payrollYear: Number(month.slice(0, 4)), createdBy: actor,
    });
    otherAdjustmentsService.approve(rec.id, actor);
    done.push({ ...r, status: "RELEASED", adjustment_id: rec.id, released_at: nowIso });
    total += r.amount;
    if (r.component === "TSE_INSTALMENT") {
      const inst = insts.get(r.source_id);
      const sale = inst && sales.get(inst.sale_id);
      if (inst && sale) {
        insts.set(inst.id, { ...inst, status: "RELEASED", ledger_id: r.id, updated_at: nowIso });
        const p = provisionEntries("RELEASE", inst.amount);
        provNew.push({ id: `PROV-RELEASE-${inst.id}`, city_id: inst.city_id, event: "RELEASE", sale_id: sale.id, instalment_id: inst.id, ...p, posting_date: nowIso.slice(0, 10), created_at: nowIso });
      }
    }
  }
  upsertMany("INC7_LEDGER", done);
  writeAll("INC7_INSTALMENTS", [...insts.values()]);
  upsertMany("INC7_PROVISION", provNew);
  // month summaries follow
  const sums = readAll("INC7_MONTH_SUMMARIES").map((s) => (s.month === month && s.status === "ELIGIBLE" ? { ...s, status: "RELEASED" as const } : s));
  writeAll("INC7_MONTH_SUMMARIES", sums);
  audit(actor, "PAYROLL_POST", "ledger", month, `${done.length} rows, ₹${total}`);
  return { posted: done.length, total };
}

/** Record the payroll run id on released rows once payroll has applied the adjustments. */
export function syncAppliedStatus(): void {
  const applied = new Map(otherAdjustmentsService.getAllEarnings().filter((a) => a.status === "Applied").map((a) => [a.id, a.appliedInPayrollRunId] as const));
  const upd = readAll("INC7_LEDGER").filter((r) => r.status === "RELEASED" && !r.payroll_run_id && r.adjustment_id && applied.get(r.adjustment_id)).map((r) => ({ ...r, payroll_run_id: applied.get(r.adjustment_id!) }));
  upsertMany("INC7_LEDGER", upd);
}

/** Freeze a month and drop its day rows when old, so localStorage stays small. */
export function lockMonth(month: string, actor: string): void {
  if (isMonthLocked(month)) return;
  upsertMany("INC7_MONTH_LOCKS", [{ id: month, month, locked_by: actor, locked_at: new Date().toISOString() }]);
  audit(actor, "LOCK_MONTH", "month", month);
  const cutoff = (() => { const d = new Date(); d.setUTCMonth(d.getUTCMonth() - 3); return d.toISOString().slice(0, 7); })();
  const locked = new Set(readAll("INC7_MONTH_LOCKS").map((l) => l.month));
  writeAll("INC7_WASHER_DAYS", readAll("INC7_WASHER_DAYS").filter((d) => !(locked.has(d.work_date.slice(0, 7)) && d.work_date.slice(0, 7) < cutoff)));
  writeAll("INC7_TSE_DAYS", readAll("INC7_TSE_DAYS").filter((d) => !(locked.has(d.work_date.slice(0, 7)) && d.work_date.slice(0, 7) < cutoff)));
}
