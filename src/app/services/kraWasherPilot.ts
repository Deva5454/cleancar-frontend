/**
 * kraWasherPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * The real, confirmed pilot role. Seeds Washer's real KRA template
 * (matching §5.1 of the reference document) and the real KPI catalog
 * entries backing it, each pointing to a real, confirmed data source in
 * kraDataSources.ts rather than an invented or duplicated calculation.
 *
 * Then provides the real orchestrator that computes a washer's actual
 * KRA scores for a given cycle from real, live app data, saves each
 * real KPI actual for audit, and returns the resolved total score.
 */

import {
  getKpiCatalog, upsertKpiCatalogEntry, resolveEmployeeKras, saveKpiActual, type KraDefinition,
} from "./kraEngineService";
import {
  computeWasherProductivityUnits, computeWasherAddonCount, computeWasherAttendanceRate,
  computeWasherOnTimeRate, getWasherAuditScore, type JobLike, type AttendanceLike,
} from "./kraDataSources";
import { financialQuarterForMonthKey } from "./financialQuarter";

export const WASHER_ROLE = "Car Washer";

const WASHER_KPI_CATALOG = [
  { code: "WASHER_PRODUCTIVITY_UNITS", name: "Daily Productivity Units", unit: "units", direction: "higher-is-better" as const, dataSource: "computeWasherProductivityUnits", description: "4W=1.0 / 2W=0.4 / Add-on=0.5 weighted units this cycle" },
  { code: "WASHER_ADDON_COUNT", name: "Add-on Deliveries", unit: "count", direction: "higher-is-better" as const, dataSource: "computeWasherAddonCount" },
  { code: "WASHER_ATTENDANCE_RATE", name: "Attendance Rate", unit: "%", direction: "higher-is-better" as const, dataSource: "computeWasherAttendanceRate" },
  { code: "WASHER_ONTIME_RATE", name: "On-Time Check-In Rate", unit: "%", direction: "higher-is-better" as const, dataSource: "computeWasherOnTimeRate" },
  { code: "WASHER_AUDIT_SCORE", name: "Supervisor Audit Score", unit: "%", direction: "higher-is-better" as const, dataSource: "getWasherAuditScore", description: "Real, confirmed limitation: only updates when a supervisor audit is submitted while IncentiveContext is mounted - see kraDataSources.ts" },
];

/**
 * Real, confirmed KRA structure for Washer - matches §5.1 exactly:
 * Daily Productivity 50 / Service Add-on Delivery 20 /
 * Attendance & Discipline 20 / Quality & Compliance 10.
 */
export const WASHER_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "WASHER_DAILY_PRODUCTIVITY", name: "Daily Productivity", weight: 50, kpis: [{ kpiCode: "WASHER_PRODUCTIVITY_UNITS", weight: 100, defaultTarget: 25 * 26 }] },
  { kraCode: "WASHER_ADDON_DELIVERY", name: "Service Add-on Delivery", weight: 20, kpis: [{ kpiCode: "WASHER_ADDON_COUNT", weight: 100, defaultTarget: 10 }] },
  { kraCode: "WASHER_ATTENDANCE_DISCIPLINE", name: "Attendance & Discipline", weight: 20, kpis: [
    { kpiCode: "WASHER_ATTENDANCE_RATE", weight: 60, defaultTarget: 95 },
    { kpiCode: "WASHER_ONTIME_RATE", weight: 40, defaultTarget: 90 },
  ] },
  { kraCode: "WASHER_QUALITY_COMPLIANCE", name: "Quality & Compliance", weight: 10, kpis: [{ kpiCode: "WASHER_AUDIT_SCORE", weight: 100, defaultTarget: 85 }] },
];

/**
 * Seeds only the reusable KPI catalog entries — no longer auto-creates and
 * auto-approves a KRA template for this role (that made "approved by
 * Super Admin" fiction). HR now authors and Super Admin approves a real
 * KRA template via the KRA Authoring / Approval screens.
 */
export function seedWasherKpiCatalogIfMissing(): void {
  WASHER_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}

const KPI_COMPUTE_FN: Record<string, (jobs: JobLike[], attendance: AttendanceLike[], incentives: any[], employeeId: string, month: string) => number> = {
  computeWasherProductivityUnits: (jobs, _a, _i, employeeId, month) => computeWasherProductivityUnits(jobs, employeeId, month),
  computeWasherAddonCount: (jobs, _a, _i, employeeId, month) => computeWasherAddonCount(jobs, employeeId, month),
  computeWasherAttendanceRate: (_j, attendance, _i, employeeId, month) => computeWasherAttendanceRate(attendance, employeeId, month),
  computeWasherOnTimeRate: (_j, attendance, _i, employeeId, month) => computeWasherOnTimeRate(attendance, employeeId, month),
  getWasherAuditScore: (_j, _a, incentives, employeeId) => getWasherAuditScore(incentives, employeeId),
};

export interface WasherKraResult {
  kraCode: string;
  kraName: string;
  kraWeight: number;
  kpiResults: { kpiCode: string; kpiName: string; actual: number; target: number; achievementPct: number }[];
  kraScore: number; // 0-100, weighted average of its KPIs' achievement
}

/**
 * Real, complete computation - resolves this washer's actual KRA set
 * (template + any real employee-level overrides), computes every real
 * KPI actual from the real, live data passed in, saves each one for
 * audit via saveKpiActual, and returns the full real breakdown plus a
 * real total score.
 */
export function computeWasherKraScores(
  employeeId: string, month: string, jobs: JobLike[], attendance: AttendanceLike[], employeeIncentives: any[]
): { results: WasherKraResult[]; totalScore: number } {
  const { financialYear, quarter } = financialQuarterForMonthKey(month);
  const { kras } = resolveEmployeeKras(employeeId, WASHER_ROLE, financialYear, quarter);
  const catalog = getKpiCatalog();

  const results: WasherKraResult[] = kras.map((kra) => {
    const kpiResults = kra.kpis.map((link) => {
      const catalogEntry = catalog.find((c) => c.code === link.kpiCode);
      const computeFn = catalogEntry ? KPI_COMPUTE_FN[catalogEntry.dataSource] : undefined;
      const actual = computeFn ? computeFn(jobs, attendance, employeeIncentives, employeeId, month) : 0;
      saveKpiActual(employeeId, link.kpiCode, month, actual, "SYSTEM");
      const target = link.defaultTarget || 1;
      const achievementPct = Math.min(150, Math.round((actual / target) * 100)); // real cap at 150% - avoids one outlier KPI dominating the KRA score
      return { kpiCode: link.kpiCode, kpiName: catalogEntry?.name || link.kpiCode, actual, target, achievementPct };
    });
    const kraScore = kpiResults.reduce((sum, r, idx) => sum + r.achievementPct * (kra.kpis[idx].weight / 100), 0);
    return { kraCode: kra.kraCode, kraName: kra.name, kraWeight: kra.weight, kpiResults, kraScore: Math.round(kraScore) };
  });

  const totalScore = Math.round(results.reduce((sum, r) => sum + r.kraScore * (r.kraWeight / 100), 0));
  return { results, totalScore };
}
