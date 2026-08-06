/**
 * kraSalesManagerPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sales Manager's KRA structure — weights confirmed in
 * INCENTIVE_KRA_KPI_MASTER_REFERENCE.docx §5.6 (Territory Expansion 25 /
 * Lead Generation 20 / Conversion Delivery 30 / Alliance & Corporate
 * Growth 25).
 *
 * Checked directly: salesManagerService.ts reads seeded localStorage
 * (seedLocations, seedBlockDeals), not a specific employeeId's real data.
 * Every KPI is honestly NOT_YET_AVAILABLE — catalog and default structure
 * seeded for HR to author from; every quarter's actual is entered
 * manually.
 */

import { getKpiCatalog, upsertKpiCatalogEntry, type KraDefinition } from "./kraEngineService";

export const SALES_MANAGER_ROLE = "Sales Manager";
const NOT_YET_AVAILABLE = "NOT_YET_AVAILABLE";

const SALES_MANAGER_KPI_CATALOG = [
  { code: "SM_TERRITORY_EXPANSION", name: "Territory Expansion", unit: "locations", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: salesManagerService.ts's location data is seeded localStorage, not real per-employee data" },
  { code: "SM_LEAD_GENERATION", name: "Lead Generation", unit: "leads/month", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "SM_CONVERSION_DELIVERY", name: "Conversion Delivery", unit: "count/month", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "SM_ALLIANCE_GROWTH", name: "Alliance & Corporate Growth", unit: "milestones", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: Block Deal data is seeded localStorage (seedBlockDeals), not real" },
];

/** Suggested starting point for HR when authoring this role's KRA for the first time — matches the master reference §5.6. Not auto-created/auto-approved. */
export const SALES_MANAGER_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "SM_TERRITORY_EXPANSION_KRA", name: "Territory Expansion", weight: 25, kpis: [{ kpiCode: "SM_TERRITORY_EXPANSION", weight: 100, defaultTarget: 5 }] },
  { kraCode: "SM_LEAD_GENERATION_KRA", name: "Lead Generation", weight: 20, kpis: [{ kpiCode: "SM_LEAD_GENERATION", weight: 100, defaultTarget: 30 }] },
  { kraCode: "SM_CONVERSION_DELIVERY_KRA", name: "Conversion Delivery", weight: 30, kpis: [{ kpiCode: "SM_CONVERSION_DELIVERY", weight: 100, defaultTarget: 5 }] },
  { kraCode: "SM_ALLIANCE_GROWTH_KRA", name: "Alliance & Corporate Growth", weight: 25, kpis: [{ kpiCode: "SM_ALLIANCE_GROWTH", weight: 100, defaultTarget: 5 }] },
];

export function seedSalesManagerKpiCatalogIfMissing(): void {
  SALES_MANAGER_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}
