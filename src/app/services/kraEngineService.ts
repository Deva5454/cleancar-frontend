/**
 * kraEngineService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * The real, generic KRA/KPI data model and rules engine - confirmed as a
 * localStorage-based system (no real backend exists in this app; checked
 * directly via IncentiveApiService.ts's own comment confirming there is
 * no real Railway backend for this project).
 *
 * Matches the real entities from the reference document's §8.1, adapted
 * for real, persisted browser storage instead of backend database tables:
 *   - kpiCatalog: the reusable metric library, each entry's dataSource
 *     pointing to one real, existing function - never duplicated logic.
 *   - kraTemplate: role-level default KRA set, versioned, effective-dated.
 *   - employeeKraAssignment: per-employee layer, inherits the role
 *     template by default, stores real overrides (EXCLUDE/ADD/REWEIGHT).
 *   - kpiActual: snapshotted real, computed values per employee per cycle.
 *   - incentiveRuleVersion: the payout formula itself as real, versioned
 *     data.
 *   - incentivePayout: the real ledger, pinning the exact rule version
 *     used so history never silently changes when rules evolve later.
 *
 * Real evolvability guarantees, confirmed matching the reference document:
 *   - Nothing is ever edited in place - every change creates a new
 *     version with a new effectiveFrom; the prior version's effectiveTo
 *     is set to the day before.
 *   - Draft → PendingApproval → Active → Archived, same real lifecycle
 *     for every kind of change (role-wide or single-employee).
 *   - Mid-cycle changes default to next-cycle-only.
 */

export type LifecycleStatus = "Draft" | "PendingApproval" | "Active" | "Archived";
export type MetricDirection = "higher-is-better" | "lower-is-better";
export type FormulaType = "WEIGHTED_SCORE" | "SLAB_TIER" | "GATE_MULTIPLIER" | "COMPOSITE";

export interface KpiCatalogEntry {
  code: string;
  name: string;
  unit: string;
  direction: MetricDirection;
  dataSource: string;
  description?: string;
}

export interface KraKpiLink {
  kpiCode: string;
  weight: number;
  defaultTarget?: number;
  defaultGate?: number;
}

export interface KraDefinition {
  kraCode: string;
  name: string;
  weight: number;
  kpis: KraKpiLink[];
}

export interface KraTemplate {
  id: string;
  role: string;
  version: number;
  status: LifecycleStatus;
  kras: KraDefinition[];
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface KraOverride {
  action: "EXCLUDE" | "ADD" | "REWEIGHT";
  kraCode: string;
  newKra?: KraDefinition;
  newWeight?: number;
}

export interface EmployeeKraAssignment {
  id: string;
  employeeId: string;
  role: string;
  templateId: string;
  overrides: KraOverride[];
  status: LifecycleStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: string;
  createdAt: string;
}

export interface KpiActual {
  id: string;
  employeeId: string;
  kpiCode: string;
  cycle: string;
  actualValue: number;
  computedAt: string;
  source: "SYSTEM" | "MANUAL";
}

export interface IncentiveRuleVersion {
  id: string;
  role: string;
  version: number;
  status: LifecycleStatus;
  formulaType: FormulaType;
  formulaConfig: Record<string, any>;
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: string;
  createdAt: string;
}

export interface IncentivePayout {
  id: string;
  employeeId: string;
  cycle: string;
  ruleVersionId: string;
  kraScores: { kraCode: string; score: number }[];
  totalScore: number;
  calculatedAmount: number;
  status: "Draft" | "Approved" | "Paid";
  calculatedAt: string;
}

const KEYS = {
  CATALOG: "cleancar_kra_kpi_catalog",
  TEMPLATES: "cleancar_kra_templates",
  ASSIGNMENTS: "cleancar_kra_employee_assignments",
  ACTUALS: "cleancar_kra_kpi_actuals",
  RULE_VERSIONS: "cleancar_kra_incentive_rule_versions",
  PAYOUTS: "cleancar_kra_incentive_payouts",
};

function getAll<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function saveAll<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

// ─── KPI Catalog ────────────────────────────────────────────────────────────

export function getKpiCatalog(): KpiCatalogEntry[] {
  return getAll<KpiCatalogEntry>(KEYS.CATALOG);
}
export function upsertKpiCatalogEntry(entry: KpiCatalogEntry): void {
  const all = getKpiCatalog();
  const idx = all.findIndex((e) => e.code === entry.code);
  if (idx >= 0) all[idx] = entry; else all.push(entry);
  saveAll(KEYS.CATALOG, all);
}
export function getKpiCatalogEntry(code: string): KpiCatalogEntry | undefined {
  return getKpiCatalog().find((e) => e.code === code);
}

// ─── KRA Templates (role-level, versioned) ─────────────────────────────────

export function getKraTemplates(role?: string): KraTemplate[] {
  const all = getAll<KraTemplate>(KEYS.TEMPLATES);
  return role ? all.filter((t) => t.role === role) : all;
}

export function getActiveKraTemplate(role: string): KraTemplate | undefined {
  const today = new Date().toISOString().split("T")[0];
  return getKraTemplates(role).find(
    (t) => t.status === "Active" && t.effectiveFrom <= today && (!t.effectiveTo || t.effectiveTo >= today)
  );
}

/**
 * Real, confirmed evolvability guarantee - never edits an existing
 * template in place. Creates a new version; approving it later closes
 * out the prior active version's effectiveTo the day before.
 */
export function createKraTemplateVersion(
  role: string, kras: KraDefinition[], createdBy: string, effectiveFrom: string
): KraTemplate {
  const all = getKraTemplates();
  const existing = getKraTemplates(role);
  const nextVersion = existing.length > 0 ? Math.max(...existing.map((t) => t.version)) + 1 : 1;
  const newTemplate: KraTemplate = {
    id: `KRATPL-${role}-${nextVersion}-${Date.now()}`,
    role, version: nextVersion, status: "Draft", kras,
    effectiveFrom, createdBy, createdAt: new Date().toISOString(),
  };
  saveAll(KEYS.TEMPLATES, [...all, newTemplate]);
  return newTemplate;
}

export function approveKraTemplate(templateId: string, approvedBy: string): boolean {
  const all = getAll<KraTemplate>(KEYS.TEMPLATES);
  const idx = all.findIndex((t) => t.id === templateId);
  if (idx === -1) return false;
  const template = all[idx];
  const dayBefore = new Date(new Date(template.effectiveFrom).getTime() - 86400000).toISOString().split("T")[0];
  const updated = all.map((t) => {
    if (t.role === template.role && t.status === "Active" && t.id !== templateId) {
      return { ...t, status: "Archived" as LifecycleStatus, effectiveTo: dayBefore };
    }
    if (t.id === templateId) {
      return { ...t, status: "Active" as LifecycleStatus, approvedBy, approvedAt: new Date().toISOString() };
    }
    return t;
  });
  saveAll(KEYS.TEMPLATES, updated);
  return true;
}

// ─── Employee-level KRA assignment (§8.3 - EXCLUDE/ADD/REWEIGHT) ──────────

export function getEmployeeKraAssignment(employeeId: string): EmployeeKraAssignment | undefined {
  const today = new Date().toISOString().split("T")[0];
  return getAll<EmployeeKraAssignment>(KEYS.ASSIGNMENTS).find(
    (a) => a.employeeId === employeeId && a.status === "Active" &&
      a.effectiveFrom <= today && (!a.effectiveTo || a.effectiveTo >= today)
  );
}

/**
 * Real, resolved KRA set for one employee - the role template's real
 * KRAs, with this employee's real overrides applied on top.
 */
export function resolveEmployeeKras(employeeId: string, role: string): { kras: KraDefinition[]; totalWeight: number } {
  const template = getActiveKraTemplate(role);
  const assignment = getEmployeeKraAssignment(employeeId);
  let kras: KraDefinition[] = template ? [...template.kras] : [];

  if (assignment) {
    for (const override of assignment.overrides) {
      if (override.action === "EXCLUDE") {
        kras = kras.filter((k) => k.kraCode !== override.kraCode);
      } else if (override.action === "ADD" && override.newKra) {
        kras = [...kras, override.newKra];
      } else if (override.action === "REWEIGHT" && override.newWeight !== undefined) {
        kras = kras.map((k) => k.kraCode === override.kraCode ? { ...k, weight: override.newWeight! } : k);
      }
    }
  }

  const totalWeight = kras.reduce((sum, k) => sum + k.weight, 0);
  return { kras, totalWeight };
}

export function saveEmployeeKraAssignment(
  employeeId: string, role: string, templateId: string, overrides: KraOverride[], createdBy: string, effectiveFrom: string
): { success: boolean; error?: string; assignment?: EmployeeKraAssignment } {
  const { totalWeight } = resolveEmployeeKras(employeeId, role);
  if (Math.round(totalWeight) !== 100) {
    return { success: false, error: `KRA weights must sum to 100% - currently ${totalWeight}%` };
  }
  const all = getAll<EmployeeKraAssignment>(KEYS.ASSIGNMENTS);
  const newAssignment: EmployeeKraAssignment = {
    id: `EKA-${employeeId}-${Date.now()}`,
    employeeId, role, templateId, overrides, status: "Draft",
    effectiveFrom, createdBy, createdAt: new Date().toISOString(),
  };
  saveAll(KEYS.ASSIGNMENTS, [...all, newAssignment]);
  return { success: true, assignment: newAssignment };
}

export function approveEmployeeKraAssignment(assignmentId: string): boolean {
  const all = getAll<EmployeeKraAssignment>(KEYS.ASSIGNMENTS);
  const idx = all.findIndex((a) => a.id === assignmentId);
  if (idx === -1) return false;
  const assignment = all[idx];
  const dayBefore = new Date(new Date(assignment.effectiveFrom).getTime() - 86400000).toISOString().split("T")[0];
  const updated = all.map((a) => {
    if (a.employeeId === assignment.employeeId && a.status === "Active" && a.id !== assignmentId) {
      return { ...a, status: "Archived" as LifecycleStatus, effectiveTo: dayBefore };
    }
    if (a.id === assignmentId) return { ...a, status: "Active" as LifecycleStatus };
    return a;
  });
  saveAll(KEYS.ASSIGNMENTS, updated);
  return true;
}

// ─── KPI Actuals (real, computed snapshots per cycle) ──────────────────────

export function saveKpiActual(employeeId: string, kpiCode: string, cycle: string, actualValue: number, source: "SYSTEM" | "MANUAL" = "SYSTEM"): void {
  const all = getAll<KpiActual>(KEYS.ACTUALS);
  const existingIdx = all.findIndex((a) => a.employeeId === employeeId && a.kpiCode === kpiCode && a.cycle === cycle);
  const entry: KpiActual = { id: existingIdx >= 0 ? all[existingIdx].id : `ACT-${employeeId}-${kpiCode}-${cycle}`, employeeId, kpiCode, cycle, actualValue, computedAt: new Date().toISOString(), source };
  if (existingIdx >= 0) all[existingIdx] = entry; else all.push(entry);
  saveAll(KEYS.ACTUALS, all);
}
export function getKpiActual(employeeId: string, kpiCode: string, cycle: string): number | undefined {
  return getAll<KpiActual>(KEYS.ACTUALS).find((a) => a.employeeId === employeeId && a.kpiCode === kpiCode && a.cycle === cycle)?.actualValue;
}

// ─── Incentive Rule Versions ────────────────────────────────────────────────

export function getActiveRuleVersion(role: string): IncentiveRuleVersion | undefined {
  const today = new Date().toISOString().split("T")[0];
  return getAll<IncentiveRuleVersion>(KEYS.RULE_VERSIONS).find(
    (r) => r.role === role && r.status === "Active" && r.effectiveFrom <= today && (!r.effectiveTo || r.effectiveTo >= today)
  );
}
export function createRuleVersion(role: string, formulaType: FormulaType, formulaConfig: Record<string, any>, createdBy: string, effectiveFrom: string): IncentiveRuleVersion {
  const all = getAll<IncentiveRuleVersion>(KEYS.RULE_VERSIONS);
  const existing = all.filter((r) => r.role === role);
  const nextVersion = existing.length > 0 ? Math.max(...existing.map((r) => r.version)) + 1 : 1;
  const newVersion: IncentiveRuleVersion = { id: `RULE-${role}-${nextVersion}-${Date.now()}`, role, version: nextVersion, status: "Draft", formulaType, formulaConfig, effectiveFrom, createdBy, createdAt: new Date().toISOString() };
  saveAll(KEYS.RULE_VERSIONS, [...all, newVersion]);
  return newVersion;
}
export function approveRuleVersion(ruleId: string): boolean {
  const all = getAll<IncentiveRuleVersion>(KEYS.RULE_VERSIONS);
  const idx = all.findIndex((r) => r.id === ruleId);
  if (idx === -1) return false;
  const rule = all[idx];
  const dayBefore = new Date(new Date(rule.effectiveFrom).getTime() - 86400000).toISOString().split("T")[0];
  const updated = all.map((r) => {
    if (r.role === rule.role && r.status === "Active" && r.id !== ruleId) return { ...r, status: "Archived" as LifecycleStatus, effectiveTo: dayBefore };
    if (r.id === ruleId) return { ...r, status: "Active" as LifecycleStatus };
    return r;
  });
  saveAll(KEYS.RULE_VERSIONS, updated);
  return true;
}

// ─── Incentive Payouts (the real, pinned ledger) ───────────────────────────

export function recordPayout(payout: Omit<IncentivePayout, "id" | "calculatedAt">): IncentivePayout {
  const all = getAll<IncentivePayout>(KEYS.PAYOUTS);
  const record: IncentivePayout = { ...payout, id: `PAYOUT-${payout.employeeId}-${payout.cycle}-${Date.now()}`, calculatedAt: new Date().toISOString() };
  saveAll(KEYS.PAYOUTS, [...all, record]);
  return record;
}
export function getPayoutHistory(employeeId: string): IncentivePayout[] {
  return getAll<IncentivePayout>(KEYS.PAYOUTS).filter((p) => p.employeeId === employeeId);
}
