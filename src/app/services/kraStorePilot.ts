/**
 * kraStorePilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Store Manager's KRA structure. Scored at the CITY level — the real
 * month-end verification record (kraStoreDataSources.ts) carries a city,
 * not an individual employeeId, and there's one Store Manager per city.
 *
 * Inventory Accuracy and Month-End Compliance are genuinely real, computed
 * from the real verification record MonthEndVerification.tsx persists.
 * GRN Turnaround and Requisition Fulfillment are honestly NOT_YET_AVAILABLE
 * — checked directly and confirmed no real timestamp fields exist for
 * either (see kraStoreDataSources.ts's header).
 */

import {
  getKpiCatalog, upsertKpiCatalogEntry, resolveEmployeeKras, saveKpiActual, type KraDefinition,
} from "./kraEngineService";
import {
  computeStockAccuracyRate, computeMonthEndComplianceRate, readMonthEndVerifications,
  type MonthEndVerificationRecordLike,
} from "./kraStoreDataSources";
export { readMonthEndVerifications };
import { financialQuarterForMonthKey } from "./financialQuarter";

export const STORE_ROLE = "Store Manager";
const NOT_YET_AVAILABLE = "NOT_YET_AVAILABLE";

const STORE_KPI_CATALOG = [
  { code: "STORE_STOCK_ACCURACY", name: "Inventory Accuracy", unit: "%", direction: "higher-is-better" as const, dataSource: "computeStockAccuracyRate", description: "Real, from the month-end physical count vs system-estimated closing stock" },
  { code: "STORE_MONTH_END_COMPLIANCE", name: "Month-End Verification Compliance", unit: "%", direction: "higher-is-better" as const, dataSource: "computeMonthEndComplianceRate", description: "Real, binary — was a month-end verification actually submitted for this city this month" },
  { code: "STORE_GRN_TURNAROUND", name: "GRN Turnaround", unit: "days", direction: "lower-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: PurchaseOrder has no real approval timestamp field (only dateIssued/expectedDelivery)" },
  { code: "STORE_REQUISITION_FULFILLMENT", name: "Requisition Fulfillment Time", unit: "days", direction: "lower-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: MaterialRequisitionForm has no fulfilledAt timestamp" },
];

/** Suggested starting point for HR when authoring this role's KRA — not auto-created/auto-approved. */
export const STORE_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "STORE_INVENTORY_ACCURACY", name: "Inventory Accuracy", weight: 35, kpis: [{ kpiCode: "STORE_STOCK_ACCURACY", weight: 100, defaultTarget: 95 }] },
  { kraCode: "STORE_MONTH_END_COMPLIANCE_KRA", name: "Month-End Compliance", weight: 20, kpis: [{ kpiCode: "STORE_MONTH_END_COMPLIANCE", weight: 100, defaultTarget: 100 }] },
  { kraCode: "STORE_GRN_TURNAROUND_KRA", name: "GRN Turnaround", weight: 25, kpis: [{ kpiCode: "STORE_GRN_TURNAROUND", weight: 100, defaultTarget: 3 }] },
  { kraCode: "STORE_REQUISITION_FULFILLMENT_KRA", name: "Requisition Fulfillment", weight: 20, kpis: [{ kpiCode: "STORE_REQUISITION_FULFILLMENT", weight: 100, defaultTarget: 2 }] },
];

export function seedStoreKpiCatalogIfMissing(): void {
  STORE_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}

export interface StoreKpiResult { kpiCode: string; kpiName: string; actual: number | null; target: number; achievementPct: number | null; }
export interface StoreKraResult { kraCode: string; kraName: string; kraWeight: number; kpiResults: StoreKpiResult[]; kraScore: number | null; }

export function computeStoreKraScores(
  cityId: string, month: string, records: MonthEndVerificationRecordLike[]
): { results: StoreKraResult[]; totalScore: number | null; realWeightCovered: number } {
  const { financialYear, quarter } = financialQuarterForMonthKey(month);
  const { kras } = resolveEmployeeKras(cityId, STORE_ROLE, financialYear, quarter);
  const catalog = getKpiCatalog();

  const results: StoreKraResult[] = kras.map((kra) => {
    const kpiResults: StoreKpiResult[] = kra.kpis.map((link) => {
      const catalogEntry = catalog.find((c) => c.code === link.kpiCode);
      const target = link.defaultTarget || 1;

      if (!catalogEntry || catalogEntry.dataSource === NOT_YET_AVAILABLE) {
        return { kpiCode: link.kpiCode, kpiName: catalogEntry?.name || link.kpiCode, actual: null, target, achievementPct: null };
      }

      let actual: number | null = null;
      if (catalogEntry.dataSource === "computeStockAccuracyRate") actual = computeStockAccuracyRate(records, cityId, month);
      else if (catalogEntry.dataSource === "computeMonthEndComplianceRate") actual = computeMonthEndComplianceRate(records, cityId, month);

      if (actual === null) {
        return { kpiCode: link.kpiCode, kpiName: catalogEntry.name, actual: null, target, achievementPct: null };
      }

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
