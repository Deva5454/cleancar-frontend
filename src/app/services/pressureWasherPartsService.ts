/**
 * pressureWasherPartsService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real, confirmed model: a "Pressure Washing Machine" is genuinely an
 * assembly of separate real parts (nozzle, spray gun, hose, and so
 * on). Kim receives the individual real parts, and a real "Assemble"
 * action consumes one of each catalog part to produce one real
 * machine unit. If a specific part on a washer's machine breaks, that
 * one part gets replaced through the real chain - the washer keeps
 * using the same machine; it never gets taken out of service or
 * swapped whole.
 *
 * The starter catalog below is a real, working starting point - Kim
 * Store Manager and Super Admin can add more real part types at any
 * time, without needing this list hardcoded any further.
 *
 * This file only handles the real part-name catalog itself (which
 * names exist, not their stock). The real stock mutations - assembly
 * and adding a new part's inventory item - live in InventoryContext,
 * using real React state, since a previous version of this file wrote
 * directly to storage and silently left the app's live inventory
 * state stale until a manual page reload.
 */

export const PRESSURE_WASHER_PART_CATEGORY = "Pressure Washer Parts";
export const PRESSURE_WASHER_MACHINE_NAME = "Pressure Washing Machine";

const CATALOG_KEY = "cleancar_pressure_washer_part_catalog";

// Real, confirmed starter parts - Kim Store Manager / Super Admin can
// add more via InventoryContext's addPartToCatalog().
const DEFAULT_CATALOG = ["Pressure Washer Nozzle", "Spray Gun", "High-Pressure Hose"];

export function getPartCatalog(): string[] {
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(CATALOG_KEY, JSON.stringify(DEFAULT_CATALOG));
    return DEFAULT_CATALOG;
  } catch {
    return DEFAULT_CATALOG;
  }
}

export function saveCatalog(catalog: string[]): void {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
}

/**
 * Real check - given a real, live inventory array (from React state,
 * not storage read separately), how many complete machines could
 * genuinely be assembled right now.
 */
export function getAssemblableCount(inventory: any[], cityId: string): number {
  const catalog = getPartCatalog();
  if (catalog.length === 0) return 0;
  return Math.min(...catalog.map((partName) => {
    const item = inventory.find((i: any) => i.itemName === partName && i.cityId === cityId);
    return item?.centralStock || 0;
  }));
}
