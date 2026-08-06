/**
 * kraAccountsPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Accounts' KRA structure. Scored at the CITY level, same reasoning as
 * OM/City Manager/CCE — Payable records carry a real cityId, not an
 * individual employeeId, and there's typically one Accounts owner per
 * city rather than a reliable per-person attribution.
 *
 * Payment Timeliness is genuinely real, computed from real Payable
 * records (kraAccountsDataSources.ts). GST Filing Timeliness, Book-Closure
 * Timeliness, and Ledger Accuracy are honestly NOT_YET_AVAILABLE — checked
 * directly and confirmed no real data source exists for any of them yet
 * (see kraAccountsDataSources.ts's header for what was checked).
 */

import {
  getKpiCatalog, upsertKpiCatalogEntry, resolveEmployeeKras, saveKpiActual, type KraDefinition,
} from "./kraEngineService";
import { computePaymentTimelinessRate, type PayableLike } from "./kraAccountsDataSources";
import { financialQuarterForMonthKey } from "./financialQuarter";

export const ACCOUNTS_ROLE = "Accounts";
const NOT_YET_AVAILABLE = "NOT_YET_AVAILABLE";

const ACCOUNTS_KPI_CATALOG = [
  { code: "ACC_PAYMENT_TIMELINESS", name: "Payment Timeliness", unit: "%", direction: "higher-is-better" as const, dataSource: "computePaymentTimelinessRate", description: "Real, share of this month's paid/partially-paid payables settled on or before their due date" },
  { code: "ACC_GST_FILING_TIMELINESS", name: "GST Filing Timeliness", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: GSTFilingModule.tsx stores a real filing date but no due-date field to compare it against yet" },
  { code: "ACC_BOOK_CLOSURE", name: "Book-Closure Timeliness", unit: "days", direction: "lower-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: no month-close timestamp exists anywhere in accountingEntryService.ts" },
  { code: "ACC_LEDGER_ACCURACY", name: "Ledger Accuracy", unit: "count", direction: "lower-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: no discrepancy/audit-flag service exists yet" },
];

/** Suggested starting point for HR when authoring this role's KRA — not auto-created/auto-approved. */
export const ACCOUNTS_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "ACC_PAYABLES_DISCIPLINE", name: "Payables Discipline", weight: 30, kpis: [{ kpiCode: "ACC_PAYMENT_TIMELINESS", weight: 100, defaultTarget: 95 }] },
  { kraCode: "ACC_GST_COMPLIANCE", name: "GST Compliance", weight: 30, kpis: [{ kpiCode: "ACC_GST_FILING_TIMELINESS", weight: 100, defaultTarget: 100 }] },
  { kraCode: "ACC_BOOK_CLOSURE_KRA", name: "Book-Closure Timeliness", weight: 20, kpis: [{ kpiCode: "ACC_BOOK_CLOSURE", weight: 100, defaultTarget: 5 }] },
  { kraCode: "ACC_LEDGER_ACCURACY_KRA", name: "Ledger Accuracy", weight: 20, kpis: [{ kpiCode: "ACC_LEDGER_ACCURACY", weight: 100, defaultTarget: 0 }] },
];

export function seedAccountsKpiCatalogIfMissing(): void {
  ACCOUNTS_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}

export interface AccountsKpiResult { kpiCode: string; kpiName: string; actual: number | null; target: number; achievementPct: number | null; }
export interface AccountsKraResult { kraCode: string; kraName: string; kraWeight: number; kpiResults: AccountsKpiResult[]; kraScore: number | null; }

export function computeAccountsKraScores(
  cityId: string, month: string, payables: PayableLike[]
): { results: AccountsKraResult[]; totalScore: number | null; realWeightCovered: number } {
  const { financialYear, quarter } = financialQuarterForMonthKey(month);
  const { kras } = resolveEmployeeKras(cityId, ACCOUNTS_ROLE, financialYear, quarter);
  const catalog = getKpiCatalog();

  const results: AccountsKraResult[] = kras.map((kra) => {
    const kpiResults: AccountsKpiResult[] = kra.kpis.map((link) => {
      const catalogEntry = catalog.find((c) => c.code === link.kpiCode);
      const target = link.defaultTarget || 1;

      if (!catalogEntry || catalogEntry.dataSource === NOT_YET_AVAILABLE) {
        return { kpiCode: link.kpiCode, kpiName: catalogEntry?.name || link.kpiCode, actual: null, target, achievementPct: null };
      }

      const actual = computePaymentTimelinessRate(payables, cityId, month);
      saveKpiActual(cityId, link.kpiCode, month, actual, "SYSTEM");
      const achievementPct = Math.min(150, Math.round((actual / target) * 100));
      return { kpiCode: link.kpiCode, kpiName: catalogEntry.name, actual, target, achievementPct };
    });

    const availableKpis = kpiResults.filter((r) => r.achievementPct !== null);
    const kraScore = availableKpis.length > 0
      ? Math.round(availableKpis.reduce((sum, r) => sum + (r.achievementPct as number), 0) / availableKpis.length)
      : null;

    return { kraCode: kra.kraCode, kraName: kra.name, kraWeight: kra.weight, kpiResults, kraScore };
  });

  const scoredKras = results.filter((r) => r.kraScore !== null);
  const realWeightCovered = scoredKras.reduce((sum, r) => sum + r.kraWeight, 0);
  const totalScore = realWeightCovered > 0
    ? Math.round(scoredKras.reduce((sum, r) => sum + (r.kraScore as number) * (r.kraWeight / realWeightCovered), 0))
    : null;

  return { results, totalScore, realWeightCovered };
}
