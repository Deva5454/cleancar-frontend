/**
 * Statutory Challan Service
 *
 * Replaces the previous stub in StatutoryPayablesScreen.tsx, which computed
 * payables from fields that don't exist on PayrollRun (run.deductions?.pf_employee,
 * run.employerPF) and compared run.status against "Disbursed" (capitalized)
 * when the real PayrollStatus values are lowercase — so it always produced
 * zeros. This service aggregates real fields (run.pf, run.esic, run.pt,
 * run.tds, run.month as "YYYY-MM", run.status, run.stateCode) and derives
 * employer-side PF/ESIC using the same rate tables complianceEngine already
 * uses, so the numbers are internally consistent with how payroll itself
 * was computed.
 */

import type { PayrollRun } from "../contexts/PayrollContext";
import { getStateRules, type IndianState } from "./payroll/complianceRules";

export type StatutoryType = "PF" | "ESIC" | "PT" | "TDS" | "LWF";
export type ChallanStatus = "pending" | "paid" | "overdue";

export interface StatutoryPayable {
  statutoryType: StatutoryType;
  month: string; // "YYYY-MM" for PF/ESIC/PT/TDS, "YYYY-H1"/"YYYY-H2" for LWF
  cityId: string;
  employeeContribution: number;
  employerContribution: number;
  totalAmount: number;
  dueDate: string; // ISO date
  status: ChallanStatus;
  employeeCount: number;
  paymentReference?: string;
  paidDate?: string;
  challanNumber?: string;
}

export interface ChallanPaymentRecord {
  key: string; // `${statutoryType}_${month}_${cityId}`
  statutoryType: StatutoryType;
  month: string;
  cityId: string;
  challanNumber: string;
  paymentReference: string;
  paidDate: string;
  paidBy: string;
  amount: number;
  recordedAt: string;
}

export interface LWFEntry {
  id: string;
  period: string; // "YYYY-H1" or "YYYY-H2"
  cityId: string;
  employeeContribution: number;
  employerContribution: number;
  addedBy: string;
  addedAt: string;
}

const PAYMENTS_KEY = "STATUTORY_CHALLAN_PAYMENTS";
const CHALLAN_SEQ_KEY = "STATUTORY_CHALLAN_SEQUENCE";
const LWF_KEY = "STATUTORY_LWF_ENTRIES";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Runs count toward statutory liability once payroll is Approved or Disbursed —
// draft/under_review/rejected runs are not yet a crystallized liability.
const LIABLE_STATUSES = new Set(["approved", "disbursed"]);

function paymentKey(type: StatutoryType, month: string, cityId: string): string {
  return `${type}_${month}_${cityId}`;
}

function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Due dates per the same rules already documented in the UI's Integration Notice. */
function computeDueDate(type: StatutoryType, month: string): string {
  const nextMonth = addMonths(month, 1);
  const [ny, nm] = nextMonth.split("-").map(Number);
  switch (type) {
    case "PF":
    case "ESIC":
      return `${ny}-${String(nm).padStart(2, "0")}-15`;
    case "PT":
    case "TDS":
      return `${ny}-${String(nm).padStart(2, "0")}-07`;
    case "LWF":
      // Half-yearly: Jun 30 / Dec 31 of the same year the period covers
      return month.endsWith("H1") ? `${month.split("-")[0]}-06-30` : `${month.split("-")[0]}-12-31`;
  }
}

class StatutoryChallanService {
  private subscribers: Set<() => void> = new Set();
  subscribe(cb: () => void): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }
  private notify() {
    this.subscribers.forEach((cb) => cb());
  }

  /**
   * Aggregate PF/ESIC/PT/TDS liabilities for a given month from real payroll
   * runs, split by statutory type. One row per type (not per employee) since
   * remittance to the government is done in aggregate per period.
   */
  getPayablesForMonth(payrollRuns: PayrollRun[], month: string, cityId?: string): StatutoryPayable[] {
    const runs = payrollRuns.filter(
      (r) => r.month === month && LIABLE_STATUSES.has(r.status) && (!cityId || cityId === "ALL" || r.cityId === cityId)
    );

    const byCity = new Map<string, PayrollRun[]>();
    runs.forEach((r) => {
      const list = byCity.get(r.cityId) || [];
      list.push(r);
      byCity.set(r.cityId, list);
    });

    const results: StatutoryPayable[] = [];
    byCity.forEach((cityRuns, city) => {
      const state = (cityRuns[0]?.stateCode as IndianState) || "GJ";
      const rules = getStateRules(state);

      const employeePF = cityRuns.reduce((s, r) => s + (r.pf || 0), 0);
      const employeeESIC = cityRuns.reduce((s, r) => s + (r.esic || 0), 0);
      const employeePT = cityRuns.reduce((s, r) => s + (r.pt || 0), 0);
      const employeeTDS = cityRuns.reduce((s, r) => s + (r.tds || 0), 0);

      // Employer PF matches employee PF at the same configured rate (both
      // typically 12%) — derive the ratio from rules rather than hardcoding 1:1.
      const employerPF = rules.pf.employeeRate > 0
        ? employeePF * (rules.pf.employerRate / rules.pf.employeeRate)
        : 0;
      // Employer ESI is a materially higher rate than employee ESI (e.g.
      // 3.25% vs 0.75%) — derive from configured rules, not assumed equal.
      const employerESIC = rules.esi.employeeRate > 0
        ? employeeESIC * (rules.esi.employerRate / rules.esi.employeeRate)
        : 0;

      const entries: Array<[StatutoryType, number, number]> = [
        ["PF", employeePF, employerPF],
        ["ESIC", employeeESIC, employerESIC],
        ["PT", employeePT, 0],   // PT is employee-only, employer just remits
        ["TDS", employeeTDS, 0], // TDS is employee-only, employer just remits
      ];

      entries.forEach(([type, empContribution, erContribution]) => {
        const total = empContribution + erContribution;
        if (total <= 0) return; // nothing to remit for this type this month
        results.push(this.buildPayable(type, month, city, empContribution, erContribution, cityRuns.length));
      });
    });

    return results;
  }

  private buildPayable(
    type: StatutoryType, month: string, cityId: string,
    employeeContribution: number, employerContribution: number, employeeCount: number
  ): StatutoryPayable {
    const dueDate = computeDueDate(type, month);
    const payment = this.getPaymentRecord(type, month, cityId);
    const status: ChallanStatus = payment
      ? "paid"
      : new Date() > new Date(dueDate) ? "overdue" : "pending";

    return {
      statutoryType: type, month, cityId,
      employeeContribution: Math.round(employeeContribution),
      employerContribution: Math.round(employerContribution),
      totalAmount: Math.round(employeeContribution + employerContribution),
      dueDate, status, employeeCount,
      paymentReference: payment?.paymentReference,
      paidDate: payment?.paidDate,
      challanNumber: payment?.challanNumber,
    };
  }

  // ── LWF (not derivable from PayrollRun — HR records it manually per period) ──

  listLWFEntries(): LWFEntry[] {
    return readJSON<LWFEntry[]>(LWF_KEY, []);
  }

  addLWFEntry(input: Omit<LWFEntry, "id" | "addedAt">): LWFEntry {
    const entry: LWFEntry = {
      ...input,
      id: `LWF_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      addedAt: new Date().toISOString(),
    };
    writeJSON(LWF_KEY, [...this.listLWFEntries(), entry]);
    this.notify();
    return entry;
  }

  getLWFPayable(period: string, cityId: string): StatutoryPayable | null {
    const entry = this.listLWFEntries().find((e) => e.period === period && e.cityId === cityId);
    if (!entry) return null;
    return this.buildPayable("LWF", period, cityId, entry.employeeContribution, entry.employerContribution, 0);
  }

  // ── Payments / challan numbering ────────────────────────────────────

  private nextChallanNumber(type: StatutoryType, month: string, cityId: string): string {
    const seq = readJSON<Record<string, number>>(CHALLAN_SEQ_KEY, {});
    const seqKey = `${type}_${cityId}`;
    const next = (seq[seqKey] || 0) + 1;
    seq[seqKey] = next;
    writeJSON(CHALLAN_SEQ_KEY, seq);
    const cityCode = cityId.replace("CITY-", "").slice(0, 3).toUpperCase();
    return `${type}/${month}/${cityCode}/${String(next).padStart(5, "0")}`;
  }

  getPaymentRecord(type: StatutoryType, month: string, cityId: string): ChallanPaymentRecord | undefined {
    const all = readJSON<ChallanPaymentRecord[]>(PAYMENTS_KEY, []);
    return all.find((p) => p.key === paymentKey(type, month, cityId));
  }

  recordPayment(input: {
    statutoryType: StatutoryType; month: string; cityId: string;
    amount: number; paymentReference: string; paidDate: string; paidBy: string;
  }): ChallanPaymentRecord {
    const all = readJSON<ChallanPaymentRecord[]>(PAYMENTS_KEY, []);
    const challanNumber = this.nextChallanNumber(input.statutoryType, input.month, input.cityId);
    const record: ChallanPaymentRecord = {
      key: paymentKey(input.statutoryType, input.month, input.cityId),
      statutoryType: input.statutoryType,
      month: input.month,
      cityId: input.cityId,
      challanNumber,
      paymentReference: input.paymentReference,
      paidDate: input.paidDate,
      paidBy: input.paidBy,
      amount: input.amount,
      recordedAt: new Date().toISOString(),
    };
    writeJSON(PAYMENTS_KEY, [...all.filter((p) => p.key !== record.key), record]);
    this.notify();
    return record;
  }
}

export const statutoryChallanService = new StatutoryChallanService();
