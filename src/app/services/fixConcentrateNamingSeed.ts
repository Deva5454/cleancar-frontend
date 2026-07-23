/**
 * fixConcentrateNamingSeed — real, one-time rename fixing a genuine
 * naming inconsistency: two concentrate items were named "...500ml"
 * even though they're tracked in litres as bulk raw material, not a
 * fixed bottle size. Confirmed directly: the only real bottle size
 * anywhere in this system is 250ml. "500ml" in an item's name was
 * misleading and never meant a real, different bottle size existed.
 *
 * A standalone migration, deliberately independent of the recipe
 * seeds' own version flags, since those may have already run and
 * marked themselves done before this naming issue was caught -
 * renaming needs to happen regardless of that state.
 */

import { DataService } from "./DataService";

const SEED_VERSION_KEY = "cleancar_fix_concentrate_naming_v1";

const RENAMES: Record<string, string> = {
  "Tyre Shine 500ml": "Tyre Shine Concentrate",
  "Glass Cleaner 500ml": "Glass Cleaner Concentrate",
};

export function fixConcentrateNaming() {
  try {
    if (localStorage.getItem(SEED_VERSION_KEY) === "DONE") return;

    const items: any[] = DataService.get<any>("INVENTORY_ITEMS");
    let changed = false;

    items.forEach((item: any) => {
      const newName = RENAMES[item.itemName];
      if (newName) {
        item.itemName = newName;
        item.updatedAt = new Date().toISOString();
        changed = true;
      }
    });

    if (changed) {
      DataService.setAll("INVENTORY_ITEMS", items);
      console.info("[fixConcentrateNamingSeed] Renamed misleading '...500ml' concentrate item names - only 250ml bottles are real anywhere in this system.");
    }

    localStorage.setItem(SEED_VERSION_KEY, "DONE");
  } catch (err) {
    console.error("[fixConcentrateNamingSeed] Rename failed, items unaffected:", err);
  }
}
