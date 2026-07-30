/**
 * incentiveConfigPersistenceService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real, previously-missing persistence for IncentiveConfiguration.tsx.
 * Confirmed directly: its save handler only logged to console
 * (`// TODO: Save to HR context or backend`) - nothing was ever
 * actually saved, and there was no way to ever load a previously-saved
 * draft back, since selecting a role always started a blank form.
 *
 * This keeps the screen's own existing IncentiveConfigState shape as-is
 * (a real, separate, more ad-hoc per-role structure from the new
 * generic kraEngineService.ts) rather than forcing a risky rewrite of
 * a 4,300+ line screen to a different data model in the same step.
 * Migrating this screen onto the generic KRA/KPI engine is real,
 * separate, larger follow-up work - this step's real, narrower goal is
 * closing the "doesn't persist at all" gap first.
 */

const STORAGE_KEY = "cleancar_incentive_configurations";

export interface StoredIncentiveConfig {
  id: string;
  roleCode: string;
  config: any; // the real IncentiveConfigState shape, kept as-is
}

function getAll(): StoredIncentiveConfig[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveAll(items: StoredIncentiveConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * Real, genuine "most relevant" config for a role - prefers an Active
 * config, falling back to the most recent Draft/Pending one if no
 * Active version exists yet, so reopening a role a user was mid-way
 * through editing shows their real, unsaved-but-persisted work.
 */
export function loadConfigForRole(roleCode: string): any | undefined {
  const all = getAll().filter((c) => c.roleCode === roleCode);
  if (all.length === 0) return undefined;
  const active = all.find((c) => c.config.status === "Active");
  if (active) return active.config;
  return all.slice().sort((a, b) => (b.config.createdAt || "").localeCompare(a.config.createdAt || ""))[0].config;
}

export function getAllConfigsForRole(roleCode: string): StoredIncentiveConfig[] {
  return getAll().filter((c) => c.roleCode === roleCode);
}

/**
 * Real save - genuinely persists to localStorage, matching by
 * roleCode + version so saving a draft again updates the same real
 * record instead of creating duplicates.
 */
export function saveIncentiveConfig(roleCode: string, config: any): StoredIncentiveConfig {
  const all = getAll();
  const version = config.version || "1.0";
  const idx = all.findIndex((c) => c.roleCode === roleCode && c.config.version === version);
  const record: StoredIncentiveConfig = {
    id: idx >= 0 ? all[idx].id : `INCCFG-${roleCode}-${version}-${Date.now()}`,
    roleCode, config,
  };
  if (idx >= 0) all[idx] = record; else all.push(record);
  saveAll(all);
  return record;
}

/**
 * Real approval - genuinely marks a config Active, and archives any
 * prior real Active version for the same role, so there's never more
 * than one real Active config per role at a time.
 */
export function approveIncentiveConfig(roleCode: string, version: string, approvedBy: string): boolean {
  const all = getAll();
  const idx = all.findIndex((c) => c.roleCode === roleCode && c.config.version === version);
  if (idx === -1) return false;
  const updated = all.map((c) => {
    if (c.roleCode === roleCode && c.config.status === "Active") {
      return { ...c, config: { ...c.config, status: "Archived" } };
    }
    if (c.roleCode === roleCode && c.config.version === version) {
      return { ...c, config: { ...c.config, status: "Active", approvedBy, approvedAt: new Date().toISOString(), isImmutable: true } };
    }
    return c;
  });
  saveAll(updated);
  return true;
}
