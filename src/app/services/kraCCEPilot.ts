/**
 * kraCCEPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CCE's real KRA structure, scored at the CITY level (not per-employee —
 * see kraCCEDataSources.ts for exactly why). Third pilot built on the
 * real complaint data confirmed in kraCCEDataSources.ts, following the
 * suggested order (CCE → Cluster Manager → Store/Procurement → Accounts)
 * given after the KRA rebuild: real formula where genuinely measurable,
 * NOT_YET_AVAILABLE sentinel for anything that isn't, saveKpiActual(...,
 * "SYSTEM") for audit — same pattern as kraWasherPilot.ts/
 * kraSupervisorPilot.ts/kraOMPilot.ts/kraCityPilot.ts.
 */

import {
  getKpiCatalog, upsertKpiCatalogEntry, resolveEmployeeKras, saveKpiActual, type KraDefinition,
} from "./kraEngineService";
import {
  computeCCEResolutionRate, computeCCECsatScore, computeCCESlaComplianceRate, type CCEComplaintLike,
} from "./kraCCEDataSources";
export type { CCEComplaintLike };
import { financialQuarterForMonthKey } from "./financialQuarter";

export const CCE_ROLE = "CCE";

const CCE_KPI_CATALOG = [
  { code: "CCE_RESOLUTION_RATE", name: "Complaint Resolution Rate", unit: "%", direction: "higher-is-better" as const, dataSource: "computeCCEResolutionRate", description: "Real, from cleancar_complaints — share of the month's complaints reaching Resolved/Closed" },
  { code: "CCE_CSAT_SCORE", name: "Customer Satisfaction (CSAT)", unit: "/5", direction: "higher-is-better" as const, dataSource: "computeCCECsatScore", description: "Real, average customer rating (1-5) on closed complaints this month" },
  { code: "CCE_SLA_COMPLIANCE", name: "SLA Compliance Rate", unit: "%", direction: "higher-is-better" as const, dataSource: "computeCCESlaComplianceRate", description: "Real, share of this month's resolved complaints closed within their priority's target hours (High 24h / Medium 72h / Low 168h)" },
];

/** Suggested starting point for HR when authoring this role's KRA for the first time — not auto-created/auto-approved. */
export const CCE_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "CCE_RESOLUTION", name: "Resolution Delivery", weight: 40, kpis: [{ kpiCode: "CCE_RESOLUTION_RATE", weight: 100, defaultTarget: 90 }] },
  { kraCode: "CCE_SATISFACTION", name: "Customer Satisfaction", weight: 35, kpis: [{ kpiCode: "CCE_CSAT_SCORE", weight: 100, defaultTarget: 4.2 }] },
  { kraCode: "CCE_SLA", name: "SLA Compliance", weight: 25, kpis: [{ kpiCode: "CCE_SLA_COMPLIANCE", weight: 100, defaultTarget: 85 }] },
];

/**
 * Seeds only the reusable KPI catalog entries — no template auto-approval,
 * same pattern as every other pilot. HR authors and Super Admin approves
 * a real KRA template via the KRA Authoring / Approval screens.
 */
export function seedCCEKpiCatalogIfMissing(): void {
  CCE_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}

export interface CCEKpiResult {
  kpiCode: string;
  kpiName: string;
  actual: number | null;
  target: number;
  achievementPct: number | null;
}
export interface CCEKraResult {
  kraCode: string;
  kraName: string;
  kraWeight: number;
  kpiResults: CCEKpiResult[];
  kraScore: number | null;
}

/**
 * Real, complete computation for one city — all 3 KPIs are genuinely
 * computed from the real cleancar_complaints records and saved as real
 * KPI actuals. No NOT_YET_AVAILABLE KPIs in this pilot's default
 * structure (unlike OM/Supervisor/City) since all 3 chosen metrics are
 * honestly measurable from what's confirmed real today.
 */
export function computeCCEKraScores(
  cityId: string, month: string, complaints: CCEComplaintLike[]
): { results: CCEKraResult[]; totalScore: number | null; realWeightCovered: number } {
  const { financialYear, quarter } = financialQuarterForMonthKey(month);
  const { kras } = resolveEmployeeKras(cityId, CCE_ROLE, financialYear, quarter);
  const catalog = getKpiCatalog();

  const results: CCEKraResult[] = kras.map((kra) => {
    const kpiResults: CCEKpiResult[] = kra.kpis.map((link) => {
      const catalogEntry = catalog.find((c) => c.code === link.kpiCode);
      const target = link.defaultTarget || 1;

      if (!catalogEntry || catalogEntry.dataSource === "NOT_YET_AVAILABLE") {
        return { kpiCode: link.kpiCode, kpiName: catalogEntry?.name || link.kpiCode, actual: null, target, achievementPct: null };
      }

      let actual = 0;
      if (catalogEntry.dataSource === "computeCCEResolutionRate") actual = computeCCEResolutionRate(complaints, cityId, month);
      else if (catalogEntry.dataSource === "computeCCECsatScore") actual = computeCCECsatScore(complaints, cityId, month);
      else if (catalogEntry.dataSource === "computeCCESlaComplianceRate") actual = computeCCESlaComplianceRate(complaints, cityId, month);

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
