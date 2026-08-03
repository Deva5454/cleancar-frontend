/**
 * kraOMPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Operations Manager's real KRA structure, matching the reference
 * document's confirmed weights (Revenue 40 / Lead Conversion 20 /
 * Retention 20 / Operational Compliance 10 / Customer Experience 10).
 *
 * Confirmed decision: keep the full, real 5-KRA structure rather than
 * quietly dropping the 3 unbuilt ones and reweighting - Lead Conversion,
 * Operational Compliance, and Customer Experience genuinely show as
 * "Not yet available" rather than a fabricated score, and are excluded
 * from the total score's real weighted average (both numerator and
 * denominator) rather than silently counting as 0%, which would
 * unfairly punish every real Operations Manager for a real, structural
 * gap that has nothing to do with their actual performance.
 */

import {
  getKpiCatalog, upsertKpiCatalogEntry, resolveEmployeeKras, saveKpiActual, type KraDefinition,
} from "./kraEngineService";
import {
  computeOMRealRevenue, computeOMRealRetentionRate, type AccountingEntryLike, type SubscriptionLike, type CustomerLike,
} from "./kraOMDataSources";
import { financialQuarterForMonthKey } from "./financialQuarter";

export const OM_ROLE = "Operations Manager";

/** Real, honest sentinel - marks a KPI as having no real data source yet, rather than inventing one. */
const NOT_YET_AVAILABLE = "NOT_YET_AVAILABLE";

const OM_KPI_CATALOG = [
  { code: "OM_REAL_REVENUE", name: "Revenue (Real, from Accounting Entries)", unit: "₹", direction: "higher-is-better" as const, dataSource: "computeOMRealRevenue" },
  { code: "OM_REAL_RETENTION", name: "Retention Rate (Real, from Subscriptions)", unit: "%", direction: "higher-is-better" as const, dataSource: "computeOMRealRetentionRate" },
  { code: "OM_LEAD_CONVERSION", name: "Lead Conversion", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: no real data source exists yet - operationsManagerService.ts's own comment says \"In production: GET /api/om/sales\"" },
  { code: "OM_OPERATIONAL_COMPLIANCE", name: "Operational Compliance", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: no computation exists at all, real or mock" },
  { code: "OM_CUSTOMER_EXPERIENCE", name: "Customer Experience", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: no computation exists at all, real or mock" },
];

/** Suggested starting point for HR when authoring this role's KRA - matches §5.7. Not auto-created/auto-approved. */
export const OM_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "OM_REVENUE_DELIVERY", name: "Revenue Delivery", weight: 40, kpis: [{ kpiCode: "OM_REAL_REVENUE", weight: 100, defaultTarget: 3500000 }] },
  { kraCode: "OM_LEAD_CONVERSION_KRA", name: "Lead Conversion", weight: 20, kpis: [{ kpiCode: "OM_LEAD_CONVERSION", weight: 100, defaultTarget: 100 }] },
  { kraCode: "OM_CUSTOMER_RETENTION", name: "Customer Retention", weight: 20, kpis: [{ kpiCode: "OM_REAL_RETENTION", weight: 100, defaultTarget: 80 }] },
  { kraCode: "OM_OPERATIONAL_COMPLIANCE_KRA", name: "Operational Compliance", weight: 10, kpis: [{ kpiCode: "OM_OPERATIONAL_COMPLIANCE", weight: 100, defaultTarget: 100 }] },
  { kraCode: "OM_CUSTOMER_EXPERIENCE_KRA", name: "Customer Experience", weight: 10, kpis: [{ kpiCode: "OM_CUSTOMER_EXPERIENCE", weight: 100, defaultTarget: 100 }] },
];

/**
 * Seeds only the reusable KPI catalog entries — no longer auto-creates and
 * auto-approves a KRA template for this role. HR now authors and Super
 * Admin approves a real KRA template via the KRA Authoring / Approval
 * screens.
 */
export function seedOMKpiCatalogIfMissing(): void {
  OM_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}

export interface OMKpiResult {
  kpiCode: string;
  kpiName: string;
  actual: number | null; // null = genuinely not yet available, never a fabricated 0
  target: number;
  achievementPct: number | null;
}

export interface OMKraResult {
  kraCode: string;
  kraName: string;
  kraWeight: number;
  kpiResults: OMKpiResult[];
  kraScore: number | null; // null if every KPI in this KRA is unavailable
}

/**
 * Real, complete computation - Revenue and Retention are genuinely
 * computed from real data and saved as real KPI actuals. Lead
 * Conversion, Compliance, and Customer Experience are honestly returned
 * as unavailable rather than a fabricated score - and are excluded from
 * the real total score's weighted average entirely (not counted as 0%),
 * so the total genuinely reflects only what can actually be measured
 * right now.
 */
export function computeOMKraScores(
  cityId: string, month: string, entries: AccountingEntryLike[], subscriptions: SubscriptionLike[], customers: CustomerLike[]
): { results: OMKraResult[]; totalScore: number | null; realWeightCovered: number } {
  const { financialYear, quarter } = financialQuarterForMonthKey(month);
  const { kras } = resolveEmployeeKras(cityId, OM_ROLE, financialYear, quarter);
  const catalog = getKpiCatalog();

  const results: OMKraResult[] = kras.map((kra) => {
    const kpiResults: OMKpiResult[] = kra.kpis.map((link) => {
      const catalogEntry = catalog.find((c) => c.code === link.kpiCode);
      const target = link.defaultTarget || 1;

      if (!catalogEntry || catalogEntry.dataSource === NOT_YET_AVAILABLE) {
        return { kpiCode: link.kpiCode, kpiName: catalogEntry?.name || link.kpiCode, actual: null, target, achievementPct: null };
      }

      let actual = 0;
      if (catalogEntry.dataSource === "computeOMRealRevenue") actual = computeOMRealRevenue(entries, cityId, month);
      else if (catalogEntry.dataSource === "computeOMRealRetentionRate") actual = computeOMRealRetentionRate(subscriptions, customers, cityId);

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

  // Real, honest total - only KRAs with a genuine score contribute, and
  // the weight denominator only includes those same KRAs, so a KRA with
  // no real data doesn't silently drag the total down as if it scored 0.
  const scoredKras = results.filter((r) => r.kraScore !== null);
  const realWeightCovered = scoredKras.reduce((sum, r) => sum + r.kraWeight, 0);
  const totalScore = realWeightCovered > 0
    ? Math.round(scoredKras.reduce((sum, r) => sum + (r.kraScore as number) * (r.kraWeight / realWeightCovered), 0))
    : null;

  return { results, totalScore, realWeightCovered };
}
