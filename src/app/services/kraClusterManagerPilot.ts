/**
 * kraClusterManagerPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Cluster Manager's KRA structure — weights confirmed in
 * INCENTIVE_KRA_KPI_MASTER_REFERENCE.docx §5.8 (Revenue Delivery 35 /
 * Customer Retention 20 / Lead Conversion 15 / OM Team Performance 15 /
 * Operational Compliance 10 / Customer Experience 5).
 *
 * Checked directly: clusterManagerService.ts's dashboard methods are
 * fully hardcoded (getClusterRevenue() literally comments
 * "// In production: GET /api/cm/revenue" above a fixed ₹10,856,000
 * figure — no computation exists at all). A real Cluster Manager pilot
 * could in principle aggregate kraOMDataSources.ts's already-real
 * per-city Revenue/Retention across the cities in a cluster, but no
 * cluster→cities mapping exists anywhere in orgResolution.ts or
 * organizationHierarchy.ts to do that aggregation correctly — inventing
 * one here would be a structural decision beyond this KRA build's scope.
 * Every KPI is honestly NOT_YET_AVAILABLE — catalog and default structure
 * seeded for HR to author from; every quarter's actual is entered
 * manually.
 */

import { getKpiCatalog, upsertKpiCatalogEntry, type KraDefinition } from "./kraEngineService";

export const CLUSTER_MANAGER_ROLE = "Cluster Manager";
const NOT_YET_AVAILABLE = "NOT_YET_AVAILABLE";

const CLUSTER_MANAGER_KPI_CATALOG = [
  { code: "CM_REVENUE_DELIVERY", name: "Revenue Delivery", unit: "₹", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: clusterManagerService.ts's getClusterRevenue() is fully hardcoded — no cluster→cities mapping exists to aggregate OM's real per-city revenue" },
  { code: "CM_CUSTOMER_RETENTION", name: "Customer Retention", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "CM_LEAD_CONVERSION", name: "Lead Conversion", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "CM_OM_TEAM_PERFORMANCE", name: "OM Team Performance", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "CM_OPERATIONAL_COMPLIANCE", name: "Operational Compliance", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "CM_CUSTOMER_EXPERIENCE", name: "Customer Experience", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
];

/** Suggested starting point for HR when authoring this role's KRA for the first time — matches the master reference §5.8. Not auto-created/auto-approved. */
export const CLUSTER_MANAGER_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "CM_REVENUE_DELIVERY_KRA", name: "Revenue Delivery", weight: 35, kpis: [{ kpiCode: "CM_REVENUE_DELIVERY", weight: 100, defaultTarget: 10000000 }] },
  { kraCode: "CM_CUSTOMER_RETENTION_KRA", name: "Customer Retention", weight: 20, kpis: [{ kpiCode: "CM_CUSTOMER_RETENTION", weight: 100, defaultTarget: 80 }] },
  { kraCode: "CM_LEAD_CONVERSION_KRA", name: "Lead Conversion", weight: 15, kpis: [{ kpiCode: "CM_LEAD_CONVERSION", weight: 100, defaultTarget: 40 }] },
  { kraCode: "CM_OM_TEAM_PERFORMANCE_KRA", name: "OM Team Performance", weight: 15, kpis: [{ kpiCode: "CM_OM_TEAM_PERFORMANCE", weight: 100, defaultTarget: 90 }] },
  { kraCode: "CM_OPERATIONAL_COMPLIANCE_KRA", name: "Operational Compliance", weight: 10, kpis: [{ kpiCode: "CM_OPERATIONAL_COMPLIANCE", weight: 100, defaultTarget: 100 }] },
  { kraCode: "CM_CUSTOMER_EXPERIENCE_KRA", name: "Customer Experience", weight: 5, kpis: [{ kpiCode: "CM_CUSTOMER_EXPERIENCE", weight: 100, defaultTarget: 100 }] },
];

export function seedClusterManagerKpiCatalogIfMissing(): void {
  CLUSTER_MANAGER_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}
