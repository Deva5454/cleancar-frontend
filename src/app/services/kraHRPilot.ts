/**
 * kraHRPilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * HR's KRA structure — taken directly from the user-supplied sample Goal
 * Sheet (Time to Fill, Cost per Hire, Training Hours, Employee Engagement,
 * Onboarding), used as HR's starter set per the confirmed decision.
 *
 * No recruitment/LMS/engagement-survey tool exists anywhere in this app,
 * so every KPI is honestly NOT_YET_AVAILABLE — catalog and default
 * structure seeded so HR/Super Admin have real, named KPIs to author
 * from; every quarter's actual is entered manually.
 */

import { getKpiCatalog, upsertKpiCatalogEntry, type KraDefinition } from "./kraEngineService";

export const HR_ROLE = "HR";
const NOT_YET_AVAILABLE = "NOT_YET_AVAILABLE";

const HR_KPI_CATALOG = [
  { code: "HR_TIME_TO_FILL", name: "Time to Fill", unit: "days", direction: "lower-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: no recruitment/ATS tool exists anywhere in this app" },
  { code: "HR_COST_PER_HIRE", name: "Cost per Hire", unit: "₹", direction: "lower-is-better" as const, dataSource: NOT_YET_AVAILABLE },
  { code: "HR_TRAINING_HOURS", name: "Training Hours per Employee", unit: "hours", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: no LMS/training-tracking tool exists anywhere in this app" },
  { code: "HR_EMPLOYEE_ENGAGEMENT", name: "Employee Engagement Score", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE, description: "Confirmed: no engagement-survey tool exists anywhere in this app" },
  { code: "HR_ONBOARDING_COMPLETION", name: "New Hire Onboarding Completion", unit: "%", direction: "higher-is-better" as const, dataSource: NOT_YET_AVAILABLE },
];

/** Suggested starting point for HR when authoring this role's own KRA — taken from the sample Goal Sheet. Not auto-created/auto-approved. */
export const HR_DEFAULT_KRAS: KraDefinition[] = [
  { kraCode: "HR_RECRUITMENT_SPEED", name: "Recruitment Speed", weight: 20, kpis: [{ kpiCode: "HR_TIME_TO_FILL", weight: 100, defaultTarget: 30 }] },
  { kraCode: "HR_RECRUITMENT_COST", name: "Recruitment Cost Efficiency", weight: 20, kpis: [{ kpiCode: "HR_COST_PER_HIRE", weight: 100, defaultTarget: 15000 }] },
  { kraCode: "HR_TRAINING_KRA", name: "Training & Development", weight: 20, kpis: [{ kpiCode: "HR_TRAINING_HOURS", weight: 100, defaultTarget: 20 }] },
  { kraCode: "HR_ENGAGEMENT_KRA", name: "Employee Engagement", weight: 20, kpis: [{ kpiCode: "HR_EMPLOYEE_ENGAGEMENT", weight: 100, defaultTarget: 80 }] },
  { kraCode: "HR_ONBOARDING_KRA", name: "Onboarding Quality", weight: 20, kpis: [{ kpiCode: "HR_ONBOARDING_COMPLETION", weight: 100, defaultTarget: 95 }] },
];

export function seedHRKpiCatalogIfMissing(): void {
  HR_KPI_CATALOG.forEach((entry) => {
    if (!getKpiCatalog().find((e) => e.code === entry.code)) upsertKpiCatalogEntry(entry);
  });
}
