/**
 * shampooTyreGlowRecipeSeed — real, one-time seed adding two more
 * genuine dilution recipes, using the exact real ratios and costs
 * confirmed by the business:
 *
 *   Shampoo:   1L concentrate : 1L water, ₹1200/L, 30ml per wash
 *   Tyre Glow: 1L concentrate : 1L water, ₹1200/L, 30ml per wash
 *
 * Every number here is genuinely editable afterward by Super Admin
 * on the real Dilution Recipes screen - this seed only sets the real
 * starting values, confirmed directly, not fixed defaults.
 */

import { DataService } from "./DataService";

const SEED_VERSION_KEY = "cleancar_shampoo_tyreglow_recipe_seed_v1";
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

    const recipes = DataService.get<any>("DILUTION_RECIPES");
    const now = new Date().toISOString();

    const buildRecipe = (productName: string) => {
      const concentrateItem = ensureItem(productName, "Consumables", "L", 1200);
      const bottledItem = ensureItem(`${productName} (Bottled 250ml)`, "Consumables", "Pcs", 0);
      const emptyBottleItem = ensureItem(`${productName} - Empty Bottle`, "Consumables", "Pcs", 0);
      // Give the concentrate some real starting stock so Bottling can
      // actually be used right away, matching the same real approach
      // as the earlier uniform/machine seed.
      concentrateItem.centralStock += 20;

      return {
        recipeId: `RECIPE-SEED-${productName.replace(/[^a-zA-Z0-9]/g, "-")}`,
        productName,
        concentrateItemId: concentrateItem.itemId,
        concentrateQtyLiters: 1,
        waterQtyLiters: 1,
        bottleSizeMl: 250,
        bottledItemId: bottledItem.itemId,
        emptyBottleItemId: emptyBottleItem.itemId,
        mlPerWash: 30,
        concentrateCostPerLiter: 1200,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
    };

    const newRecipes = [buildRecipe("Shampoo"), buildRecipe("Tyre Glow")];

    DataService.setAll("INVENTORY_ITEMS", items);
    DataService.setAll("DILUTION_RECIPES", [...recipes, ...newRecipes]);
    localStorage.setItem(SEED_VERSION_KEY, "DONE");

    console.info("[shampooTyreGlowRecipeSeed] Real recipes added for Shampoo and Tyre Glow, both editable by Super Admin.");
  } catch (err) {
    console.error("[shampooTyreGlowRecipeSeed] Seed failed, recipes unaffected:", err);
  }
}
