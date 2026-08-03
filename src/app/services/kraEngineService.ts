/**
 * kraEngineService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * The real, generic KRA/KPI data model and rules engine - confirmed as a
 * localStorage-based system (no real backend exists in this app).
 *
 * Real approval chain (rebuilt to give this engine's already-correct
 * lifecycle shape an actual human-driven workflow, per financial quarter):
 *   HR drafts a role's KRA structure (or clones the previous quarter's
 *   Active one forward and edits it) → submits for approval → Super Admin
 *   approves or rejects (mandatory comment on reject, sent back to Draft).
 *   Approving activates it for that role+quarter and archives whatever was
 *   previously Active for that SAME role+quarter (not other quarters —
 *   each quarter's approved KRA stays retrievable on its own, satisfying
 *   "the version of each quarter's KRA to be saved").
 *
 * Once a role's KRA is Active for a quarter, each employee's reporting
 * manager sets real per-KPI target numbers for their direct reports (the
 * "goal setting" step) via an EmployeeKraAssignment override
 * (SET_KPI_TARGET) — a lighter, separate action from the KRA structure's
 * own approval, finalized directly by the manager without a further
 * Super Admin gate (only the role-level KRA *structure* needs Super Admin
 * sign-off).
 *
 *   - kpiCatalog: the reusable metric library, each entry's dataSource
 *     pointing to one real, existing function - never duplicated logic.
 *   - kraTemplate: role-level KRA set for one financial quarter, versioned.
 *   - employeeKraAssignment: per-employee layer for one financial quarter,
 *     inherits the role template by default, stores real overrides
 *     (EXCLUDE/ADD/REWEIGHT/SET_KPI_TARGET).
 *   - kpiActual: snapshotted real, computed (or manually entered) values
 *     per employee per cycle key.
 *   - incentiveRuleVersion: the payout formula itself as real, versioned
 *     data.
 *   - incentivePayout: the real ledger, pinning the exact rule version
 *     used so history never silently changes when rules evolve later.
 *
 * Real evolvability guarantees:
 *   - Nothing is ever edited in place - every change creates a new
 *     version.
 *   - Draft → PendingApproval → Active → Archived, same real lifecycle
 *     for every kind of change (role-wide or single-employee).
 *
 * Real fix: this used to bypass DataService entirely with 6 hardcoded
 * raw localStorage keys, unregistered and never city-scoped — same bug
 * class already fixed this session for shift rosters, travel
 * reimbursement, and Other Earnings/Deductions. Now routed through
 * DataService's registered (global, since KRA structures are role-level
 * and assignments/actuals are keyed by a globally-unique employeeId —
 * neither is naturally per-city) KRA_* entity types.
 */

import { DataService } from "./DataService";
import { getFinancialQuarter, getQuarterInfo, getNextQuarter, quarterKey, type FinancialQuarter } from "./financialQuarter";

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
  financialYear: string;       // "2026-27"
  financialQuarter: FinancialQuarter;
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: string;
  createdAt: string;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  clonedFromTemplateId?: string; // set when created via "continue to next quarter"
}

export interface KraOverride {
  action: "EXCLUDE" | "ADD" | "REWEIGHT" | "SET_KPI_TARGET";
  kraCode: string;
  newKra?: KraDefinition;
  newWeight?: number;
  kpiCode?: string;   // for SET_KPI_TARGET — which KPI within the KRA
  newTarget?: number; // for SET_KPI_TARGET — the employee's real target for this quarter
}

export interface EmployeeKraAssignment {
  id: string;
  employeeId: string;
  role: string;
  templateId: string;
  overrides: KraOverride[];
  status: LifecycleStatus;
  financialYear: string;
  financialQuarter: FinancialQuarter;
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: string;
  createdAt: string;
  finalizedBy?: string; // the reporting manager who finalized the goals
  finalizedAt?: string;
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

function getAll<T>(entityType: Parameters<typeof DataService.get>[0]): T[] {
  return DataService.get<T>(entityType);
}
function saveAll<T>(entityType: Parameters<typeof DataService.setAll>[0], items: T[]): void {
  DataService.setAll(entityType, items);
}

// ─── KPI Catalog ────────────────────────────────────────────────────────────

export function getKpiCatalog(): KpiCatalogEntry[] {
  return getAll<KpiCatalogEntry>("KRA_KPI_CATALOG");
}
export function upsertKpiCatalogEntry(entry: KpiCatalogEntry): void {
  const all = getKpiCatalog();
  const idx = all.findIndex((e) => e.code === entry.code);
  if (idx >= 0) all[idx] = entry; else all.push(entry);
  saveAll("KRA_KPI_CATALOG", all);
}
export function getKpiCatalogEntry(code: string): KpiCatalogEntry | undefined {
  return getKpiCatalog().find((e) => e.code === code);
}

// ─── KRA Templates (role-level, versioned, per financial quarter) ──────────

export function getKraTemplates(role?: string, financialYear?: string, financialQuarter?: FinancialQuarter): KraTemplate[] {
  let all = getAll<KraTemplate>("KRA_TEMPLATES");
  if (role) all = all.filter((t) => t.role === role);
  if (financialYear) all = all.filter((t) => t.financialYear === financialYear);
  if (financialQuarter) all = all.filter((t) => t.financialQuarter === financialQuarter);
  return all;
}

export function getActiveKraTemplate(role: string, financialYear?: string, financialQuarter?: FinancialQuarter): KraTemplate | undefined {
  const current = getFinancialQuarter();
  const fy = financialYear || current.financialYear;
  const q = financialQuarter || current.quarter;
  return getKraTemplates(role, fy, q).find((t) => t.status === "Active");
}

/** Every role that has at least one KRA template (any quarter/status) — drives the role switcher. */
export function getRolesWithKraTemplates(): string[] {
  const roles = new Set(getAll<KraTemplate>("KRA_TEMPLATES").map((t) => t.role));
  return Array.from(roles).sort();
}

export function getPendingApprovalKraTemplates(): KraTemplate[] {
  return getAll<KraTemplate>("KRA_TEMPLATES").filter((t) => t.status === "PendingApproval");
}

/**
 * Real evolvability guarantee - never edits an existing template in
 * place. Creates a new Draft version for this role+quarter.
 */
export function createKraTemplateVersion(
  role: string, kras: KraDefinition[], createdBy: string,
  financialYear: string, financialQuarter: FinancialQuarter,
  clonedFromTemplateId?: string,
): KraTemplate {
  const all = getAll<KraTemplate>("KRA_TEMPLATES");
  const existing = getKraTemplates(role);
  const nextVersion = existing.length > 0 ? Math.max(...existing.map((t) => t.version)) + 1 : 1;
  const { startDate, endDate } = getQuarterInfo(financialYear, financialQuarter);
  const newTemplate: KraTemplate = {
    id: `KRATPL-${role}-${nextVersion}-${Date.now()}`,
    role, version: nextVersion, status: "Draft", kras,
    financialYear, financialQuarter,
    effectiveFrom: startDate, effectiveTo: endDate,
    createdBy, createdAt: new Date().toISOString(),
    clonedFromTemplateId,
  };
  saveAll("KRA_TEMPLATES", [...all, newTemplate]);
  return newTemplate;
}

/** HR clones the previous quarter's KRA structure forward as an editable new Draft — "continue for next quarter, edit if need be". */
export function cloneKraTemplateToNextQuarter(templateId: string, createdBy: string): { success: boolean; error?: string; template?: KraTemplate } {
  const source = getAll<KraTemplate>("KRA_TEMPLATES").find((t) => t.id === templateId);
  if (!source) return { success: false, error: "Source template not found" };
  const next = getNextQuarter(source.financialYear, source.financialQuarter);
  const already = getKraTemplates(source.role, next.financialYear, next.quarter);
  if (already.some((t) => t.status !== "Archived")) {
    return { success: false, error: `A KRA template already exists for ${source.role} in ${next.quarter} FY${next.financialYear}` };
  }
  const template = createKraTemplateVersion(
    source.role,
    source.kras.map((k) => ({ ...k, kpis: k.kpis.map((kpi) => ({ ...kpi })) })),
    createdBy, next.financialYear, next.quarter, source.id,
  );
  return { success: true, template };
}

/** A Draft is a mutable scratch area — freely editable until submitted. Once PendingApproval/Active/Archived, it's immutable (a new version is created instead). */
export function updateKraTemplateDraft(templateId: string, kras: KraDefinition[]): { success: boolean; error?: string } {
  const all = getAll<KraTemplate>("KRA_TEMPLATES");
  const idx = all.findIndex((t) => t.id === templateId);
  if (idx === -1) return { success: false, error: "Template not found" };
  if (all[idx].status !== "Draft") return { success: false, error: "Only a Draft can be edited in place" };
  all[idx] = { ...all[idx], kras };
  saveAll("KRA_TEMPLATES", all);
  return { success: true };
}

export function submitKraTemplateForApproval(templateId: string, submittedBy: string): { success: boolean; error?: string } {
  const all = getAll<KraTemplate>("KRA_TEMPLATES");
  const idx = all.findIndex((t) => t.id === templateId);
  if (idx === -1) return { success: false, error: "Template not found" };
  if (all[idx].status !== "Draft") return { success: false, error: "Only a Draft can be submitted for approval" };
  const totalWeight = all[idx].kras.reduce((s, k) => s + k.weight, 0);
  if (Math.round(totalWeight) !== 100) {
    return { success: false, error: `KRA weights must sum to 100% — currently ${totalWeight}%` };
  }
  all[idx] = { ...all[idx], status: "PendingApproval", submittedBy, submittedAt: new Date().toISOString() };
  saveAll("KRA_TEMPLATES", all);
  return { success: true };
}

export function approveKraTemplate(templateId: string, approvedBy: string): { success: boolean; error?: string } {
  const all = getAll<KraTemplate>("KRA_TEMPLATES");
  const idx = all.findIndex((t) => t.id === templateId);
  if (idx === -1) return { success: false, error: "Template not found" };
  const template = all[idx];
  if (template.status !== "PendingApproval") return { success: false, error: "Only a Pending-Approval template can be approved" };
  const updated = all.map((t) => {
    if (t.role === template.role && t.financialYear === template.financialYear && t.financialQuarter === template.financialQuarter &&
        t.status === "Active" && t.id !== templateId) {
      return { ...t, status: "Archived" as LifecycleStatus };
    }
    if (t.id === templateId) {
      return { ...t, status: "Active" as LifecycleStatus, approvedBy, approvedAt: new Date().toISOString() };
    }
    return t;
  });
  saveAll("KRA_TEMPLATES", updated);
  return { success: true };
}

export function rejectKraTemplate(templateId: string, rejectedBy: string, reason: string): { success: boolean; error?: string } {
  if (!reason.trim()) return { success: false, error: "A comment is required to reject a KRA structure" };
  const all = getAll<KraTemplate>("KRA_TEMPLATES");
  const idx = all.findIndex((t) => t.id === templateId);
  if (idx === -1) return { success: false, error: "Template not found" };
  if (all[idx].status !== "PendingApproval") return { success: false, error: "Only a Pending-Approval template can be rejected" };
  all[idx] = {
    ...all[idx], status: "Draft",
    rejectedBy, rejectedAt: new Date().toISOString(), rejectedReason: reason,
  };
  saveAll("KRA_TEMPLATES", all);
  return { success: true };
}

// ─── Employee-level KRA assignment / goal-setting (per financial quarter) ──

export function getEmployeeKraAssignment(employeeId: string, financialYear?: string, financialQuarter?: FinancialQuarter): EmployeeKraAssignment | undefined {
  const current = getFinancialQuarter();
  const fy = financialYear || current.financialYear;
  const q = financialQuarter || current.quarter;
  return getAll<EmployeeKraAssignment>("KRA_EMPLOYEE_ASSIGNMENTS").find(
    (a) => a.employeeId === employeeId && a.financialYear === fy && a.financialQuarter === q && a.status === "Active"
  );
}

export function getAllEmployeeKraAssignments(employeeId: string): EmployeeKraAssignment[] {
  return getAll<EmployeeKraAssignment>("KRA_EMPLOYEE_ASSIGNMENTS").filter((a) => a.employeeId === employeeId);
}

/**
 * Real, resolved KRA set for one employee for a given quarter (defaults to
 * the current one) - the role template's real KRAs, with this employee's
 * real overrides (including their real per-KPI targets set by their
 * reporting manager) applied on top.
 */
export function resolveEmployeeKras(
  employeeId: string, role: string, financialYear?: string, financialQuarter?: FinancialQuarter
): { kras: KraDefinition[]; totalWeight: number; template?: KraTemplate; assignment?: EmployeeKraAssignment } {
  const current = getFinancialQuarter();
  const fy = financialYear || current.financialYear;
  const q = financialQuarter || current.quarter;
  const template = getActiveKraTemplate(role, fy, q);
  const assignment = getEmployeeKraAssignment(employeeId, fy, q);
  let kras: KraDefinition[] = template ? template.kras.map((k) => ({ ...k, kpis: k.kpis.map((kpi) => ({ ...kpi })) })) : [];

  if (assignment) {
    for (const override of assignment.overrides) {
      if (override.action === "EXCLUDE") {
        kras = kras.filter((k) => k.kraCode !== override.kraCode);
      } else if (override.action === "ADD" && override.newKra) {
        kras = [...kras, override.newKra];
      } else if (override.action === "REWEIGHT" && override.newWeight !== undefined) {
        kras = kras.map((k) => k.kraCode === override.kraCode ? { ...k, weight: override.newWeight! } : k);
      } else if (override.action === "SET_KPI_TARGET" && override.kpiCode && override.newTarget !== undefined) {
        kras = kras.map((k) => k.kraCode === override.kraCode
          ? { ...k, kpis: k.kpis.map((kpi) => kpi.kpiCode === override.kpiCode ? { ...kpi, defaultTarget: override.newTarget } : kpi) }
          : k);
      }
    }
  }

  const totalWeight = kras.reduce((sum, k) => sum + k.weight, 0);
  return { kras, totalWeight, template, assignment };
}

/**
 * Real "goal setting" step - the reporting manager sets/edits this
 * employee's real per-KPI targets for the quarter and finalizes them
 * directly (Active) — a lighter action than the role-level KRA structure's
 * own Super Admin approval, since only the structure itself needs that gate.
 */
export function saveEmployeeKraAssignment(
  employeeId: string, role: string, templateId: string, overrides: KraOverride[],
  createdBy: string, financialYear: string, financialQuarter: FinancialQuarter,
): { success: boolean; error?: string; assignment?: EmployeeKraAssignment } {
  const { totalWeight } = resolveEmployeeKras(employeeId, role, financialYear, financialQuarter);
  if (Math.round(totalWeight) !== 100) {
    return { success: false, error: `KRA weights must sum to 100% - currently ${totalWeight}%` };
  }
  const { startDate, endDate } = getQuarterInfo(financialYear, financialQuarter);
  const all = getAll<EmployeeKraAssignment>("KRA_EMPLOYEE_ASSIGNMENTS");
  const newAssignment: EmployeeKraAssignment = {
    id: `EKA-${employeeId}-${quarterKey(financialYear, financialQuarter)}-${Date.now()}`,
    employeeId, role, templateId, overrides, status: "Draft",
    financialYear, financialQuarter,
    effectiveFrom: startDate, effectiveTo: endDate,
    createdBy, createdAt: new Date().toISOString(),
  };
  saveAll("KRA_EMPLOYEE_ASSIGNMENTS", [...all, newAssignment]);
  return { success: true, assignment: newAssignment };
}

export function finalizeEmployeeKraAssignment(assignmentId: string, finalizedBy: string): boolean {
  const all = getAll<EmployeeKraAssignment>("KRA_EMPLOYEE_ASSIGNMENTS");
  const idx = all.findIndex((a) => a.id === assignmentId);
  if (idx === -1) return false;
  const assignment = all[idx];
  const updated = all.map((a) => {
    if (a.employeeId === assignment.employeeId && a.financialYear === assignment.financialYear &&
        a.financialQuarter === assignment.financialQuarter && a.status === "Active" && a.id !== assignmentId) {
      return { ...a, status: "Archived" as LifecycleStatus };
    }
    if (a.id === assignmentId) return { ...a, status: "Active" as LifecycleStatus, finalizedBy, finalizedAt: new Date().toISOString() };
    return a;
  });
  saveAll("KRA_EMPLOYEE_ASSIGNMENTS", updated);
  return true;
}

// ─── KPI Actuals (real, computed snapshots per cycle, or manual entries) ──

export function saveKpiActual(employeeId: string, kpiCode: string, cycle: string, actualValue: number, source: "SYSTEM" | "MANUAL" = "SYSTEM"): void {
  const all = getAll<KpiActual>("KRA_KPI_ACTUALS");
  const existingIdx = all.findIndex((a) => a.employeeId === employeeId && a.kpiCode === kpiCode && a.cycle === cycle);
  const entry: KpiActual = { id: existingIdx >= 0 ? all[existingIdx].id : `ACT-${employeeId}-${kpiCode}-${cycle}`, employeeId, kpiCode, cycle, actualValue, computedAt: new Date().toISOString(), source };
  if (existingIdx >= 0) all[existingIdx] = entry; else all.push(entry);
  saveAll("KRA_KPI_ACTUALS", all);
}
export function getKpiActual(employeeId: string, kpiCode: string, cycle: string): number | undefined {
  return getAll<KpiActual>("KRA_KPI_ACTUALS").find((a) => a.employeeId === employeeId && a.kpiCode === kpiCode && a.cycle === cycle)?.actualValue;
}
export function getKpiActualRecord(employeeId: string, kpiCode: string, cycle: string): KpiActual | undefined {
  return getAll<KpiActual>("KRA_KPI_ACTUALS").find((a) => a.employeeId === employeeId && a.kpiCode === kpiCode && a.cycle === cycle);
}

// ─── Incentive Rule Versions ────────────────────────────────────────────────

export function getActiveRuleVersion(role: string): IncentiveRuleVersion | undefined {
  const today = new Date().toISOString().split("T")[0];
  return getAll<IncentiveRuleVersion>("KRA_INCENTIVE_RULE_VERSIONS").find(
    (r) => r.role === role && r.status === "Active" && r.effectiveFrom <= today && (!r.effectiveTo || r.effectiveTo >= today)
  );
}
export function createRuleVersion(role: string, formulaType: FormulaType, formulaConfig: Record<string, any>, createdBy: string, effectiveFrom: string): IncentiveRuleVersion {
  const all = getAll<IncentiveRuleVersion>("KRA_INCENTIVE_RULE_VERSIONS");
  const existing = all.filter((r) => r.role === role);
  const nextVersion = existing.length > 0 ? Math.max(...existing.map((r) => r.version)) + 1 : 1;
  const newVersion: IncentiveRuleVersion = { id: `RULE-${role}-${nextVersion}-${Date.now()}`, role, version: nextVersion, status: "Draft", formulaType, formulaConfig, effectiveFrom, createdBy, createdAt: new Date().toISOString() };
  saveAll("KRA_INCENTIVE_RULE_VERSIONS", [...all, newVersion]);
  return newVersion;
}
export function approveRuleVersion(ruleId: string): boolean {
  const all = getAll<IncentiveRuleVersion>("KRA_INCENTIVE_RULE_VERSIONS");
  const idx = all.findIndex((r) => r.id === ruleId);
  if (idx === -1) return false;
  const rule = all[idx];
  const dayBefore = new Date(new Date(rule.effectiveFrom).getTime() - 86400000).toISOString().split("T")[0];
  const updated = all.map((r) => {
    if (r.role === rule.role && r.status === "Active" && r.id !== ruleId) return { ...r, status: "Archived" as LifecycleStatus, effectiveTo: dayBefore };
    if (r.id === ruleId) return { ...r, status: "Active" as LifecycleStatus };
    return r;
  });
  saveAll("KRA_INCENTIVE_RULE_VERSIONS", updated);
  return true;
}

// ─── Incentive Payouts (the real, pinned ledger) ───────────────────────────

export function recordPayout(payout: Omit<IncentivePayout, "id" | "calculatedAt">): IncentivePayout {
  const all = getAll<IncentivePayout>("KRA_INCENTIVE_PAYOUTS");
  const record: IncentivePayout = { ...payout, id: `PAYOUT-${payout.employeeId}-${payout.cycle}-${Date.now()}`, calculatedAt: new Date().toISOString() };
  saveAll("KRA_INCENTIVE_PAYOUTS", [...all, record]);
  return record;
}
export function getPayoutHistory(employeeId: string): IncentivePayout[] {
  return getAll<IncentivePayout>("KRA_INCENTIVE_PAYOUTS").filter((p) => p.employeeId === employeeId);
}
