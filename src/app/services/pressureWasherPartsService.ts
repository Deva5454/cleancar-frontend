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
 */

import { DataService } from "./DataService";

const CATALOG_KEY = "cleancar_pressure_washer_part_catalog";
const PART_CATEGORY = "Pressure Washer Parts";
const MACHINE_ITEM_NAME = "Pressure Washing Machine";

// Real, confirmed starter parts - Kim Store Manager / Super Admin can
// add more via addPartToCatalog().
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

/**
 * Real, previously-missing provision - Kim Store Manager or Super
 * Admin can add a new real part type to the catalog. Also ensures a
 * real, genuine inventory item exists for it, starting at zero real
 * central stock until Kim actually receives some.
 */
export function addPartToCatalog(partName: string, cityId: string): void {
  const catalog = getPartCatalog();
  if (catalog.includes(partName)) return;
  const updated = [...catalog, partName];
  localStorage.setItem(CATALOG_KEY, JSON.stringify(updated));

  const items: any[] = DataService.get<any>("INVENTORY_ITEMS");
  const exists = items.some((i: any) => i.itemName === partName && i.cityId === cityId);
  if (!exists) {
    const now = new Date().toISOString();
    items.push({
      itemId: `PWP-${partName.replace(/[^a-zA-Z0-9]/g, "-")}-${cityId}`,
      itemName: partName,
      category: PART_CATEGORY,
      unit: "Pcs",
      centralStock: 0,
      reorderLevel: 4,
      unitCost: 0,
      cityId,
      supervisorStock: {},
      washerStock: {},
      createdAt: now,
      updatedAt: now,
    });
    DataService.setAll("INVENTORY_ITEMS", items);
  }
}

/**
 * Real check - given current central stock of every real catalog
 * part, how many complete machines could genuinely be assembled right
 * now.
 */
export function getAssemblableCount(cityId: string): number {
  const items: any[] = DataService.get<any>("INVENTORY_ITEMS");
  const catalog = getPartCatalog();
  if (catalog.length === 0) return 0;
  return Math.min(...catalog.map((partName) => {
    const item = items.find((i: any) => i.itemName === partName && i.cityId === cityId);
    return item?.centralStock || 0;
  }));
}

/**
 * Real assembly - consumes one real unit of every catalog part from
 * real central stock, and produces one real Pressure Washing Machine
 * unit. Refuses if any single real part is short, rather than
 * partially consuming parts for a machine that can't actually be
 * completed.
 */
export function assembleMachines(quantity: number, cityId: string): boolean {
  if (quantity <= 0) return false;
  const items: any[] = DataService.get<any>("INVENTORY_ITEMS");
  const catalog = getPartCatalog();
  if (catalog.length === 0) return false;

  for (const partName of catalog) {
    const item = items.find((i: any) => i.itemName === partName && i.cityId === cityId);
    if (!item || (item.centralStock || 0) < quantity) return false;
  }

  catalog.forEach((partName) => {
    const item = items.find((i: any) => i.itemName === partName && i.cityId === cityId);
    item.centralStock -= quantity;
  });

  const machine = items.find((i: any) => i.itemName === MACHINE_ITEM_NAME && i.cityId === cityId);
  if (machine) {
    machine.centralStock = (machine.centralStock || 0) + quantity;
  } else {
    items.push({
      itemId: `PWM-${cityId}`,
      itemName: MACHINE_ITEM_NAME,
      category: "Equipment",
      unit: "Pcs",
      centralStock: quantity,
      reorderLevel: 2,
      unitCost: 0,
      cityId,
      supervisorStock: {},
      washerStock: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  DataService.setAll("INVENTORY_ITEMS", items);
  return true;
}
