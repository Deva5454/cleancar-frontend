/**
 * kraTSEPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TSE's KRA structure — weights and targets confirmed in
 * INCENTIVE_KRA_KPI_MASTER_REFERENCE.docx §5.3 (Call Productivity 25 /
 * Conversion Performance 35 / SLA & Responsiveness 20 / CRM & Compliance
 * 10 / Renewal & Retention 10).
 *
 * Checked directly before building anything: teleSalesExecutiveService.ts
 * is a singleton, session-implicit service (its real-ish getTodayStats()
 * reads a shared _leadsCache, not a specific employeeId) — there is no
 * genuine, per-employee-scoped real data source here, unlike Washer/
 * Supervisor. Every KPI is honestly NOT_YET_AVAILABLE — only the catalog
 * and default structure are seeded, so HR has real, confirmed weights and
 * targets to author from; every quarter's actual is entered manually via
 * KraManualActualsModule.tsx, same as any other role with no real formula.
 * No compute orchestrator exists here — the generic per-employee scoring
 * path already in KraScorecardHub.tsx handles this role.
 */

import { getKpiCatalog, upsertKpiCatalogEntry, type KraDefinition } from "./kraEngineService";

export const TSE_ROLE = "TSE";
const NOT_YET_AVAILABLE = "NOT_YET_AVAILABLE";

const TSE_KPI_CATALOG = [
  { code: "TSE_CALL_PRODUCTIVITY", name: "Call Productivity", unit: "calls/month", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: teleSalesExecutiveService.ts's callsMadeToday reads a shared session cache, not a specific employee's real call log" },
  { code: "TSE_CONVERSION_PERFORMANCE", name: "Conversion Performance", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "TSE_SLA_RESPONSIVENESS", name: "SLA & Responsiveness", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "TSE_CRM_COMPLIANCE", name: "CRM & Compliance", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "TSE_RENEWAL_RETENTION", name: "Renewal & Retention", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
];

/** Suggested starting point for HR when authoring this role's KRA for the first time — matches the master reference §5.3. Not auto-created/auto-approved. */
export const TSE_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "TSE_CALL_PRODUCTIVITY_KRA", name: "Call Productivity", weight: 25, kpis: [{ kpiCode: "TSE_CALL_PRODUCTIVITY", weight: 100, defaultTarget: 2600 }] },
  { kraCode: "TSE_CONVERSION_KRA", name: "Conversion Performance", weight: 35, kpis: [{ kpiCode: "TSE_CONVERSION_PERFORMANCE", weight: 100, defaultTarget: 18 }] },
  { kraCode: "TSE_SLA_KRA", name: "SLA & Responsiveness", weight: 20, kpis: [{ kpiCode: "TSE_SLA_RESPONSIVENESS", weight: 100, defaultTarget: 100 }] },
  { kraCode: "TSE_CRM_KRA", name: "CRM & Compliance", weight: 10, kpis: [{ kpiCode: "TSE_CRM_COMPLIANCE", weight: 100, defaultTarget: 100 }] },
  { kraCode: "TSE_RENEWAL_KRA", name: "Renewal & Retention", weight: 10, kpis: [{ kpiCode: "TSE_RENEWAL_RETENTION", weight: 100, defaultTarget: 80 }] },
];

export function seedTSEKpiCatalogIfMissing(): void {
  TSE_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}
