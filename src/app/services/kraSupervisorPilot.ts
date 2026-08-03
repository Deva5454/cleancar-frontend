/**
 * kraSupervisorPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Supervisor's real KRA structure, matching IncentiveConfiguration.tsx's
 * SupervisorIncentiveRules KPI weights exactly (Conversion 40 / Retention 30 /
 * Audit Compliance 20 / Customer Complaints 10 — same split
 * supervisorIncentiveService.ts's KPI_WEIGHTS already uses for the real-money
 * incentive calculation).
 *
 * Retention and Conversion reuse the same real subscription-derived
 * functions supervisorIncentiveService.ts already computes real money from
 * (getRealRetentionRate / getRealConversionRate), rather than a second,
 * duplicated calculation. Audit Compliance and Customer Complaints are
 * honestly marked as having no real data source — confirmed directly from
 * supervisorIncentiveService.ts's own inline comments ("mock: audit
 * compliance (needs field data)", "mock: complaints (needs CCE data)") —
 * rather than inventing one, following the same pattern kraOMPilot.ts uses
 * for Operations Manager's still-unbuilt KPIs.
 */

import {
  getKpiCatalog, upsertKpiCatalogEntry, resolveEmployeeKras, saveKpiActual, type KraDefinition,
} from "./kraEngineService";
import { getRealRetentionRate, getRealConversionRate } from "./supervisorIncentiveService";

export const SUPERVISOR_ROLE = "Supervisor";

/** Real, honest sentinel - marks a KPI as having no real data source yet, rather than inventing one. */
const NOT_YET_AVAILABLE = "NOT_YET_AVAILABLE";

const SUPERVISOR_KPI_CATALOG = [
  { code: "SUP_CONVERSION_RATE", name: "BTL Conversion Rate", unit: "%", direction: "higher-is-better" as const, dataSource: "computeSupervisorConversionRate", description: "Real, from buy-page subscriptions attributed to this supervisor" },
  { code: "SUP_RETENTION_RATE", name: "Customer Retention Rate", unit: "%", direction: "higher-is-better" as const, dataSource: "computeSupervisorRetentionRate", description: "Real, from buy-page subscriptions attributed to this supervisor" },
  { code: "SUP_AUDIT_COMPLIANCE", name: "Audit Compliance", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: no real per-supervisor audit log exists yet — QAAuditDrawer.tsx hardcodes auditedBy to \"QA Manager\"" },
  { code: "SUP_COMPLAINT_SLA", name: "Customer Complaint SLA", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: no real complaint-tracking data source with supervisor attribution exists yet" },
];

/**
 * Real, confirmed KRA structure for Supervisor - matches
 * IncentiveConfiguration.tsx's SupervisorIncentiveRules KPI weights exactly.
 */
/** Suggested starting point for HR when authoring this role's KRA for the first time — matches IncentiveConfiguration.tsx's real weights, but is not auto-created/auto-approved. */
export const SUPERVISOR_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "SUP_CONVERSION", name: "BTL Conversion", weight: 40, kpis: [{ kpiCode: "SUP_CONVERSION_RATE", weight: 100, defaultTarget: 30 }] },
  { kraCode: "SUP_RETENTION", name: "Customer Retention", weight: 30, kpis: [{ kpiCode: "SUP_RETENTION_RATE", weight: 100, defaultTarget: 80 }] },
  { kraCode: "SUP_AUDIT", name: "Audit Compliance", weight: 20, kpis: [{ kpiCode: "SUP_AUDIT_COMPLIANCE", weight: 100, defaultTarget: 100 }] },
  { kraCode: "SUP_COMPLAINTS", name: "Customer Complaint SLA", weight: 10, kpis: [{ kpiCode: "SUP_COMPLAINT_SLA", weight: 100, defaultTarget: 100 }] },
];

/**
 * Seeds only the reusable KPI catalog entries — no longer auto-creates and
 * auto-approves a KRA template for this role. Real fix: that used to mean
 * "approved by Super Admin" was fiction (the code approved its own draft
 * the instant the dashboard first mounted). HR now authors and Super Admin
 * approves a real KRA template via the KRA Authoring / Approval screens.
 */
export function seedSupervisorKpiCatalogIfMissing(): void {
  SUPERVISOR_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}

function computeSupervisorConversionRate(supervisorId: string): number {
  return Math.round(getRealConversionRate(supervisorId) * 100);
}

function computeSupervisorRetentionRate(supervisorId: string): number {
  return Math.round(getRealRetentionRate(supervisorId) * 100);
}

export interface SupervisorKpiResult {
  kpiCode: string;
  kpiName: string;
  actual: number | null; // null = genuinely not yet available, never a fabricated 0
  target: number;
  achievementPct: number | null;
}

export interface SupervisorKraResult {
  kraCode: string;
  kraName: string;
  kraWeight: number;
  kpiResults: SupervisorKpiResult[];
  kraScore: number | null; // null if every KPI in this KRA is unavailable
}

/**
 * Real, complete computation - Conversion and Retention are genuinely
 * computed from real subscription data. Audit Compliance and Customer
 * Complaint SLA are honestly returned as unavailable rather than a
 * fabricated score, and are excluded from the total score's weighted
 * average entirely (not counted as 0%), matching kraOMPilot.ts's approach.
 */
export function computeSupervisorKraScores(
  supervisorId: string, month: string
): { results: SupervisorKraResult[]; totalScore: number | null; realWeightCovered: number } {
  const { kras } = resolveEmployeeKras(supervisorId, SUPERVISOR_ROLE);
  const catalog = getKpiCatalog();

  const results: SupervisorKraResult[] = kras.map((kra) => {
    const kpiResults: SupervisorKpiResult[] = kra.kpis.map((link) => {
      const catalogEntry = catalog.find((c) => c.code === link.kpiCode);
      const target = link.defaultTarget || 1;

      if (!catalogEntry || catalogEntry.dataSource === NOT_YET_AVAILABLE) {
        return { kpiCode: link.kpiCode, kpiName: catalogEntry?.name || link.kpiCode, actual: null, target, achievementPct: null };
      }

      let actual = 0;
      if (catalogEntry.dataSource === "computeSupervisorConversionRate") actual = computeSupervisorConversionRate(supervisorId);
      else if (catalogEntry.dataSource === "computeSupervisorRetentionRate") actual = computeSupervisorRetentionRate(supervisorId);

      saveKpiActual(supervisorId, link.kpiCode, month, actual, "SYSTEM");
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
