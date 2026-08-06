/**
 * kraProcurementPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Procurement Manager's KRA structure. Scored at the CITY level, same
 * reasoning as Accounts/Store — real Payable records carry a cityId, not
 * an individual employeeId.
 *
 * Vendor Payment TAT reuses the exact same real Payment Timeliness
 * computation Accounts uses (kraAccountsDataSources.ts) — same underlying
 * Payable records, not a duplicated calculation. PO Cycle Time, Vendor
 * On-Time Delivery, RFQ→PO Conversion, and Cost Savings are honestly
 * NOT_YET_AVAILABLE — checked directly: PurchaseOrder
 * (materialRequisition.ts) has no real approval timestamp, on-time
 * delivery in SupplierDetail.tsx is derived from `rating * 20` (not real
 * expected-vs-actual delivery dates), RFQ records have no conversion
 * rollup, and cost-savings figures in every procurement dashboard are
 * hardcoded mock numbers.
 */

import {
  getKpiCatalog, upsertKpiCatalogEntry, resolveEmployeeKras, saveKpiActual, type KraDefinition,
} from "./kraEngineService";
import { computePaymentTimelinessRate, type PayableLike } from "./kraAccountsDataSources";
import { financialQuarterForMonthKey } from "./financialQuarter";

export const PROCUREMENT_ROLE = "Procurement Manager";
const NOT_YET_AVAILABLE = "NOT_YET_AVAILABLE";

const PROCUREMENT_KPI_CATALOG = [
  { code: "PROC_VENDOR_PAYMENT_TAT", name: "Vendor Payment TAT", unit: "%", direction: "higher-is-better" as const, dataSource: "computePaymentTimelinessRate", description: "Real, shares the same Payable-based computation as Accounts' Payment Timeliness" },
  { code: "PROC_PO_CYCLE_TIME", name: "PO Cycle Time", unit: "days", direction: "lower-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: PurchaseOrder has no real approval timestamp field" },
  { code: "PROC_VENDOR_ONTIME_DELIVERY", name: "Vendor On-Time Delivery", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: SupplierDetail.tsx derives this from rating*20, not real expected-vs-actual delivery dates" },
  { code: "PROC_RFQ_CONVERSION", name: "RFQ→PO Conversion", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: no conversion-rate rollup function exists yet" },
  { code: "PROC_COST_SAVINGS", name: "Cost Savings", unit: "₹", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: every procurement dashboard's savings figure is a hardcoded mock number" },
];

/** Suggested starting point for HR when authoring this role's KRA — not auto-created/auto-approved. */
export const PROCUREMENT_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "PROC_PO_CYCLE_TIME_KRA", name: "PO Cycle Time", weight: 25, kpis: [{ kpiCode: "PROC_PO_CYCLE_TIME", weight: 100, defaultTarget: 3 }] },
  { kraCode: "PROC_VENDOR_PAYMENT_TAT_KRA", name: "Vendor Payment TAT", weight: 20, kpis: [{ kpiCode: "PROC_VENDOR_PAYMENT_TAT", weight: 100, defaultTarget: 95 }] },
  { kraCode: "PROC_VENDOR_ONTIME_DELIVERY_KRA", name: "Vendor On-Time Delivery", weight: 25, kpis: [{ kpiCode: "PROC_VENDOR_ONTIME_DELIVERY", weight: 100, defaultTarget: 95 }] },
  { kraCode: "PROC_RFQ_CONVERSION_KRA", name: "RFQ→PO Conversion", weight: 15, kpis: [{ kpiCode: "PROC_RFQ_CONVERSION", weight: 100, defaultTarget: 70 }] },
  { kraCode: "PROC_COST_SAVINGS_KRA", name: "Cost Savings", weight: 15, kpis: [{ kpiCode: "PROC_COST_SAVINGS", weight: 100, defaultTarget: 100000 }] },
];

export function seedProcurementKpiCatalogIfMissing(): void {
  PROCUREMENT_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}

export interface ProcurementKpiResult { kpiCode: string; kpiName: string; actual: number | null; target: number; achievementPct: number | null; }
export interface ProcurementKraResult { kraCode: string; kraName: string; kraWeight: number; kpiResults: ProcurementKpiResult[]; kraScore: number | null; }

export function computeProcurementKraScores(
  cityId: string, month: string, payables: PayableLike[]
): { results: ProcurementKraResult[]; totalScore: number | null; realWeightCovered: number } {
  const { financialYear, quarter } = financialQuarterForMonthKey(month);
  const { kras } = resolveEmployeeKras(cityId, PROCUREMENT_ROLE, financialYear, quarter);
  const catalog = getKpiCatalog();

  const results: ProcurementKraResult[] = kras.map((kra) => {
    const kpiResults: ProcurementKpiResult[] = kra.kpis.map((link) => {
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
