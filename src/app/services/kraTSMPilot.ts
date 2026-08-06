/**
 * kraTSMPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TSM's KRA structure — weights and targets confirmed in
 * INCENTIVE_KRA_KPI_MASTER_REFERENCE.docx §5.4 (Team Conversion Volume 30 /
 * Renewal Rate Management 25 / Team Revenue Delivery 20 / Customer
 * Satisfaction 15 / Team CRM & Compliance Oversight 10).
 *
 * Checked directly before building anything: teleSalesManagerService.ts's
 * dashboard methods are substantially hardcoded (getTSEPerformanceCards()
 * returns a fully fake team roster; getCommandMetrics() blends a real
 * revenue figure with a fake ₹4,850,000 fallback whenever the real one
 * isn't available — the same fake-fallback pattern already fixed
 * elsewhere in this codebase). Wiring any of it as a real SYSTEM data
 * source would mean showing fabricated numbers as real. Every KPI is
 * honestly NOT_YET_AVAILABLE — catalog and default structure seeded for
 * HR to author from; every quarter's actual is entered manually.
 */

import { getKpiCatalog, upsertKpiCatalogEntry, type KraDefinition } from "./kraEngineService";

export const TSM_ROLE = "TSM";
const NOT_YET_AVAILABLE = "NOT_YET_AVAILABLE";

const TSM_KPI_CATALOG = [
  { code: "TSM_TEAM_CONVERSION_VOLUME", name: "Team Conversion Volume", unit: "count/month", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: teleSalesManagerService.ts's own team figures are hardcoded (getTSEPerformanceCards is a fake roster)" },
  { code: "TSM_RENEWAL_RATE", name: "Renewal Rate Management", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "TSM_TEAM_REVENUE", name: "Team Revenue Delivery", unit: "₹", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: getCommandMetrics() falls back to a hardcoded ₹4,850,000 whenever the real revenue figure isn't available" },
  { code: "TSM_CSAT", name: "Customer Satisfaction", unit: "/5", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "TSM_CRM_OVERSIGHT", name: "Team CRM & Compliance Oversight", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
];

/** Suggested starting point for HR when authoring this role's KRA for the first time — matches the master reference §5.4. Not auto-created/auto-approved. */
export const TSM_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "TSM_TEAM_CONVERSION_KRA", name: "Team Conversion Volume", weight: 30, kpis: [{ kpiCode: "TSM_TEAM_CONVERSION_VOLUME", weight: 100, defaultTarget: 125 }] },
  { kraCode: "TSM_RENEWAL_KRA", name: "Renewal Rate Management", weight: 25, kpis: [{ kpiCode: "TSM_RENEWAL_RATE", weight: 100, defaultTarget: 85 }] },
  { kraCode: "TSM_TEAM_REVENUE_KRA", name: "Team Revenue Delivery", weight: 20, kpis: [{ kpiCode: "TSM_TEAM_REVENUE", weight: 100, defaultTarget: 1500000 }] },
  { kraCode: "TSM_CSAT_KRA", name: "Customer Satisfaction", weight: 15, kpis: [{ kpiCode: "TSM_CSAT", weight: 100, defaultTarget: 4.0 }] },
  { kraCode: "TSM_CRM_OVERSIGHT_KRA", name: "Team CRM & Compliance Oversight", weight: 10, kpis: [{ kpiCode: "TSM_CRM_OVERSIGHT", weight: 100, defaultTarget: 100 }] },
];

export function seedTSMKpiCatalogIfMissing(): void {
  TSM_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}
