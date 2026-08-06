/**
 * kraSalesHeadPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sales Head's KRA structure — weights confirmed in
 * INCENTIVE_KRA_KPI_MASTER_REFERENCE.docx §5.5 (Team Coaching & Uplift 25 /
 * Team Quality & Retention 25 / Personal Conversion Volume 35 / Portfolio
 * Growth 15).
 *
 * Checked directly: salesHeadService.ts reads seeded localStorage
 * (seedTCEStatuses, seedLeads) and a single global counter
 * (sh_personal_closures_count), not a specific employeeId's real data.
 * Every KPI is honestly NOT_YET_AVAILABLE — catalog and default structure
 * seeded for HR to author from; every quarter's actual is entered
 * manually.
 */

import { getKpiCatalog, upsertKpiCatalogEntry, type KraDefinition } from "./kraEngineService";

export const SALES_HEAD_ROLE = "Sales Head";
const NOT_YET_AVAILABLE = "NOT_YET_AVAILABLE";

const SALES_HEAD_KPI_CATALOG = [
  { code: "SH_TEAM_COACHING", name: "Team Coaching & Uplift", unit: "count/month", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: salesHeadService.ts's TCE closure counts come from seeded localStorage, not real per-TCE data" },
  { code: "SH_TEAM_QUALITY_RETENTION", name: "Team Quality & Retention", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "SH_PERSONAL_CONVERSION", name: "Personal Conversion Volume", unit: "count/month", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: sourced from a single global localStorage counter (sh_personal_closures_count), not scoped to a specific employeeId" },
  { code: "SH_PORTFOLIO_GROWTH", name: "Portfolio Growth", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
];

/** Suggested starting point for HR when authoring this role's KRA for the first time — matches the master reference §5.5. Not auto-created/auto-approved. */
export const SALES_HEAD_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "SH_TEAM_COACHING_KRA", name: "Team Coaching & Uplift", weight: 25, kpis: [{ kpiCode: "SH_TEAM_COACHING", weight: 100, defaultTarget: 25 }] },
  { kraCode: "SH_TEAM_QUALITY_KRA", name: "Team Quality & Retention", weight: 25, kpis: [{ kpiCode: "SH_TEAM_QUALITY_RETENTION", weight: 100, defaultTarget: 90 }] },
  { kraCode: "SH_PERSONAL_CONVERSION_KRA", name: "Personal Conversion Volume", weight: 35, kpis: [{ kpiCode: "SH_PERSONAL_CONVERSION", weight: 100, defaultTarget: 25 }] },
  { kraCode: "SH_PORTFOLIO_GROWTH_KRA", name: "Portfolio Growth", weight: 15, kpis: [{ kpiCode: "SH_PORTFOLIO_GROWTH", weight: 100, defaultTarget: 10 }] },
];

export function seedSalesHeadKpiCatalogIfMissing(): void {
  SALES_HEAD_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}
