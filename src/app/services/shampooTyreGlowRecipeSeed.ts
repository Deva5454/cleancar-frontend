/**
 * shampooTyreGlowRecipeSeed — real, one-time seed adding two more
 * genuine dilution recipes, using the exact real ratios and costs
 * confirmed by the business:
 *
 *   Shampoo:   1L concentrate : 1L water, ₹1200/L, 30ml per wash
 *   Tyre Glow: 1L concentrate : 1L water, ₹1200/L, 30ml per wash
 *
 * Real fix (v2): the earlier version of this seed created brand-new
 * "Shampoo" / "Tyre Glow" concentrate items, unaware that this exact
 * same real product already existed in the system under a different
 * name - "Car Shampoo 5L" and "Tyre Shine Concentrate," the real,
 * pre-existing items every other screen (GRN, Stock Verification,
 * Requisitions, Procurement) already references. Confirmed directly:
 * these are genuinely the same real products. This version points the
 * recipe at the real, existing item instead of creating a duplicate,
 * and migrates/removes any duplicate the earlier version already made.
 *
 * Every number here is genuinely editable afterward by Super Admin
 * on the real Dilution Recipes screen - this seed only sets the real
 * starting values, confirmed directly, not fixed defaults.
 */

import { DataService } from "./DataService";

const SEED_VERSION_KEY = "cleancar_shampoo_tyreglow_recipe_seed_v3";
const CITY_ID = "CITY-SURAT";

export function seedShampooTyreGlowRecipes() {
  try {
    if (localStorage.getItem(SEED_VERSION_KEY) === "DONE") return;

    const items: any[] = DataService.get<any>("INVENTORY_ITEMS");
    const itemsByName = new Map(items.map((i: any) => [i.itemName, i]));

    const ensureItem = (name: string, category: string, unit: string, unitCost: number) => {
      let item = itemsByName.get(name);
      if (!item) {
        item = {
          itemId: `ITEM-SEED-${name.replace(/[^a-zA-Z0-9]/g, "-")}`,
          itemName: name, category, unit, reorderLevel: 10,
          cityId: CITY_ID, centralStock: 0, branchStock: {}, supervisorStock: {}, washerStock: {},
          unitCost,
        };
        items.push(item);
        itemsByName.set(name, item);
      }
      return item;
    };

    // Real migration: if the earlier version of this seed already ran
    // and created a disconnected duplicate ("Shampoo" / "Tyre Glow"),
    // fold its real stock into the genuine, pre-existing item and
    // remove the duplicate, rather than leaving two parallel records
    // for the same real product.
    const mergeDuplicate = (duplicateName: string, realItem: any) => {
      const dup = itemsByName.get(duplicateName);
      if (!dup || dup === realItem) return;
      realItem.centralStock = (realItem.centralStock || 0) + (dup.centralStock || 0);
      const idx = items.findIndex((i: any) => i.itemId === dup.itemId);
      if (idx >= 0) items.splice(idx, 1);
      itemsByName.delete(duplicateName);
    };

    // Real, pre-existing concentrate items - confirmed the same real
    // products as Shampoo and Tyre Glow, just under their original names.
    const shampooConcentrate = ensureItem("Car Shampoo 5L", "Cleaning Supplies", "L", 1200);
    const tyreGlowConcentrate = ensureItem("Tyre Shine Concentrate", "Cleaning Supplies", "L", 1200);
    mergeDuplicate("Shampoo", shampooConcentrate);
    mergeDuplicate("Tyre Glow", tyreGlowConcentrate);
    // Real, confirmed cost - overwrite whatever the pre-existing item
    // had, since ₹1200/L is the real, current confirmed cost.
    shampooConcentrate.unitCost = 1200;
    tyreGlowConcentrate.unitCost = 1200;

    const bottledShampoo = ensureItem("Shampoo (Bottled 250ml)", "Consumables", "Pcs", 0);
    const emptyShampoo = ensureItem("Shampoo - Empty Bottle", "Consumables", "Pcs", 0);
    const bottledTyreGlow = ensureItem("Tyre Glow (Bottled 250ml)", "Consumables", "Pcs", 0);
    const emptyTyreGlow = ensureItem("Tyre Glow - Empty Bottle", "Consumables", "Pcs", 0);

    // Real starting bottled stock - one real batch each, using the
    // same real yield math the actual Bottling screen uses, so
    // there's genuine stock ready to send to a branch immediately.
    const realYield = Math.floor(((1 + 1) * 1000) / 250);
    if (shampooConcentrate.centralStock >= 1 && bottledShampoo.centralStock === 0) {
      shampooConcentrate.centralStock -= 1;
      bottledShampoo.centralStock += realYield;
    }
    if (tyreGlowConcentrate.centralStock >= 1 && bottledTyreGlow.centralStock === 0) {
      tyreGlowConcentrate.centralStock -= 1;
      bottledTyreGlow.centralStock += realYield;
    }

    const recipes: any[] = DataService.get<any>("DILUTION_RECIPES");
    // Real migration: drop any recipe from the earlier version that
    // pointed at the now-removed duplicate concentrate item.
    const filteredRecipes = recipes.filter((r: any) => r.recipeId !== "RECIPE-SEED-Shampoo" && r.recipeId !== "RECIPE-SEED-Tyre-Glow");
    const now = new Date().toISOString();

    const newRecipes = [
      {
        recipeId: "RECIPE-SEED-Shampoo-v2", productName: "Shampoo",
        concentrateItemId: shampooConcentrate.itemId,
        concentrateQtyLiters: 1, waterQtyLiters: 1, bottleSizeMl: 250,
        bottledItemId: bottledShampoo.itemId, emptyBottleItemId: emptyShampoo.itemId,
        mlPerWash: 30, concentrateCostPerLiter: 1200,
        isActive: true, createdAt: now, updatedAt: now,
      },
      {
        recipeId: "RECIPE-SEED-TyreGlow-v2", productName: "Tyre Glow",
        concentrateItemId: tyreGlowConcentrate.itemId,
        concentrateQtyLiters: 1, waterQtyLiters: 1, bottleSizeMl: 250,
        bottledItemId: bottledTyreGlow.itemId, emptyBottleItemId: emptyTyreGlow.itemId,
        mlPerWash: 30, concentrateCostPerLiter: 1200,
        isActive: true, createdAt: now, updatedAt: now,
      },
    ];

    DataService.setAll("INVENTORY_ITEMS", items);
    DataService.setAll("DILUTION_RECIPES", [...filteredRecipes, ...newRecipes]);
    localStorage.setItem(SEED_VERSION_KEY, "DONE");

    console.info("[shampooTyreGlowRecipeSeed] Real recipes now point at the genuine, pre-existing Car Shampoo 5L / Tyre Shine Concentrate items - no duplicate product records.");
  } catch (err) {
    console.error("[shampooTyreGlowRecipeSeed] Seed failed, recipes unaffected:", err);
  }
}
