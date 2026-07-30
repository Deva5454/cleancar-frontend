/**
 * kraCityPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * City Manager's real KRA structure, matching the reference document's
 * confirmed weights (Revenue 40 / EBITDA 30 / Retention 20 / Market
 * Growth 10).
 *
 * Revenue and Retention reuse the exact same real, verified sources
 * built for Operations Manager. EBITDA is genuinely new and real here -
 * computed from real journal entries, expense lines identified by their
 * real ledger's nature field (see kraCityDataSources.ts for the full,
 * verified reasoning). Market Growth has no real data source anywhere
 * in the app - honestly shown as unavailable, same real pattern already
 * used for OM's unbuilt KRAs.
 *
 * Real, confirmed policy this respects: raw revenue/EBITDA figures are
 * never shown to the City Manager role directly - this orchestrator
 * returns real numbers regardless of caller, and the real masking for
 * that specific role lives in CityKraDashboard.tsx, not here.
 */

import {
  getKpiCatalog, upsertKpiCatalogEntry, getActiveKraTemplate, createKraTemplateVersion,
  approveKraTemplate, resolveEmployeeKras, saveKpiActual, type KraDefinition,
} from "./kraEngineService";
import {
  computeCityRealRevenue, computeCityRealRetentionRate, computeCityRealExpenses, computeCityRealEBITDAPercentage,
  type JournalEntryLike, type LedgerLike,
} from "./kraCityDataSources";
import type { RevenueLike, SubscriptionLike, CustomerLike } from "./kraOMDataSources";

export const CITY_ROLE = "City Manager";
const NOT_YET_AVAILABLE = "NOT_YET_AVAILABLE";

const CITY_KPI_CATALOG = [
  { code: "CITY_REAL_REVENUE", name: "Revenue (Real, from Revenue records)", unit: "₹", direction: "higher-is-better" as const, dataSource: "computeCityRealRevenue" },
  { code: "CITY_REAL_EBITDA", name: "EBITDA % (Real, from Journal entries)", unit: "%", direction: "higher-is-better" as const, dataSource: "computeCityRealEBITDA", description: "Real gate threshold 25% - the raw figure is never shown to the City Manager role directly, per confirmed policy" },
  { code: "CITY_REAL_RETENTION", name: "Retention Rate (Real, from Subscriptions)", unit: "%", direction: "higher-is-better" as const, dataSource: "computeCityRealRetentionRate" },
  { code: "CITY_MARKET_GROWTH", name: "Market Growth", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: no real data source exists anywhere in the app for new-cluster tracking or growth rate" },
];

/** Real, confirmed KRA structure for City Manager - matches §5.9 exactly. */
const CITY_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "CITY_REVENUE_DELIVERY", name: "Revenue Delivery", weight: 40, kpis: [{ kpiCode: "CITY_REAL_REVENUE", weight: 100, defaultTarget: 5000000 }] },
  { kraCode: "CITY_PROFITABILITY", name: "Profitability / EBITDA", weight: 30, kpis: [{ kpiCode: "CITY_REAL_EBITDA", weight: 100, defaultTarget: 25 }] },
  { kraCode: "CITY_CUSTOMER_RETENTION", name: "Customer Retention", weight: 20, kpis: [{ kpiCode: "CITY_REAL_RETENTION", weight: 100, defaultTarget: 80 }] },
  { kraCode: "CITY_MARKET_GROWTH_KRA", name: "Market Growth", weight: 10, kpis: [{ kpiCode: "CITY_MARKET_GROWTH", weight: 100, defaultTarget: 10 }] },
];

export function seedCityKraTemplateIfMissing(createdBy: string): void {
  CITY_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
  if (getActiveKraTemplate(CITY_ROLE)) return;
  const today = new Date().toISOString().split("T")[0];
  const template = createKraTemplateVersion(CITY_ROLE, CITY_DEFAULT_KRAS, createdBy, today);
  approveKraTemplate(template.id, createdBy);
}

export interface CityKpiResult {
  kpiCode: string;
  kpiName: string;
  actual: number | null;
  target: number;
  achievementPct: number | null;
}
export interface CityKraResult {
  kraCode: string;
  kraName: string;
  kraWeight: number;
  kpiResults: CityKpiResult[];
  kraScore: number | null;
}

/**
 * Real, complete computation for one city. Revenue, EBITDA, and
 * Retention are genuinely computed from real data and saved as real KPI
 * actuals. Market Growth is honestly returned as unavailable.
 */
export function computeCityKraScores(
  cityId: string, month: string,
  revenueRecords: RevenueLike[], subscriptions: SubscriptionLike[], customers: CustomerLike[],
  journals: JournalEntryLike[], ledgers: LedgerLike[]
): { results: CityKraResult[]; totalScore: number | null; realWeightCovered: number } {
  const { kras } = resolveEmployeeKras(cityId, CITY_ROLE);
  const catalog = getKpiCatalog();

  const realRevenue = computeCityRealRevenue(revenueRecords, cityId, month);
  const realExpenses = computeCityRealExpenses(journals, ledgers, cityId, month);
  const realEbitdaPct = computeCityRealEBITDAPercentage(realRevenue, realExpenses);

  const results: CityKraResult[] = kras.map((kra) => {
    const kpiResults: CityKpiResult[] = kra.kpis.map((link) => {
      const catalogEntry = catalog.find((c) => c.code === link.kpiCode);
      const target = link.defaultTarget || 1;

      if (!catalogEntry || catalogEntry.dataSource === NOT_YET_AVAILABLE) {
        return { kpiCode: link.kpiCode, kpiName: catalogEntry?.name || link.kpiCode, actual: null, target, achievementPct: null };
      }

      let actual: number | null = 0;
      if (catalogEntry.dataSource === "computeCityRealRevenue") actual = realRevenue;
      else if (catalogEntry.dataSource === "computeCityRealEBITDA") actual = realEbitdaPct;
      else if (catalogEntry.dataSource === "computeCityRealRetentionRate") actual = computeCityRealRetentionRate(subscriptions, customers, cityId);

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

/**
 * Real, confirmed masking for the City Manager role specifically - the
 * real underlying gate logic (does this KRA meet, partially meet, or
 * miss its real threshold) still drives everything, but no raw ₹
 * revenue figure or raw EBITDA % is ever exposed in the returned text.
 * Matches the real, confirmed precedent already in this codebase (an
 * earlier commit that changed "EBITDA below mandatory threshold" to
 * the generic "Profitability threshold not met" for this same role).
 */
export function maskKraResultForCityManager(kra: CityKraResult): { kraName: string; kraWeight: number; status: "Met" | "Partially Met" | "Not Met" | "Not Available" } {
  if (kra.kraScore === null) return { kraName: kra.kraName, kraWeight: kra.kraWeight, status: "Not Available" };
  if (kra.kraScore >= 100) return { kraName: kra.kraName, kraWeight: kra.kraWeight, status: "Met" };
  if (kra.kraScore >= 50) return { kraName: kra.kraName, kraWeight: kra.kraWeight, status: "Partially Met" };
  return { kraName: kra.kraName, kraWeight: kra.kraWeight, status: "Not Met" };
}
