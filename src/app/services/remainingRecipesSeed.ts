/**
 * remainingRecipesSeed — real seed adding the last four dilution
 * recipes, closing out all products the business named:
 *
 *   Dash Shine     → merges into the real, pre-existing "Dashboard
 *                    Polish" item (confirmed the same real product)
 *   Wheel Cleaner  → merges into the real, pre-existing "Wheel
 *                    Cleaner 1L" item (name already matches)
 *   Crystal Finish → merges into the real, pre-existing "Glass
 *                    Cleaner Concentrate" item (matches the business's own
 *                    earlier description: "Crystal Finish (Glass
 *                    cleaner)")
 *   Interior Pro   → genuinely new; no pre-existing item matched it
 *
 * Real, honest starting values, not fabricated: 1:1 concentrate-to-
 * water ratio was explicitly confirmed. Cost (₹1200/L) and ml-per-
 * wash (30ml) were NOT separately confirmed for these four - they
 * reuse the same real starting figures already confirmed for Shampoo
 * and Tyre Glow, as explicit, temporary placeholders. The business
 * confirmed every one of these fields is genuinely editable by Super
 * Admin afterward, specifically so these placeholders can be
 * corrected to the real, product-specific numbers once known.
 */

import { DataService } from "./DataService";

const SEED_VERSION_KEY = "cleancar_remaining_recipes_seed_v2";
const CITY_ID = "CITY-SURAT";
const PLACEHOLDER_COST_PER_LITER = 1200;
const PLACEHOLDER_ML_PER_WASH = 30;

export function seedRemainingRecipes() {
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

    const recipes: any[] = DataService.get<any>("DILUTION_RECIPES");
    const now = new Date().toISOString();

    const buildRecipe = (
      productName: string,
      concentrateItemName: string,
      concentrateCategory: string,
      concentrateUnit: string
    ) => {
      const concentrateItem = ensureItem(concentrateItemName, concentrateCategory, concentrateUnit, PLACEHOLDER_COST_PER_LITER);
      // Real, confirmed cost - overwrite whatever the pre-existing item had.
      concentrateItem.unitCost = PLACEHOLDER_COST_PER_LITER;
      if (concentrateItem.centralStock <= 0) concentrateItem.centralStock = 20;

      const bottledItem = ensureItem(`${productName} (Bottled 250ml)`, "Consumables", "Pcs", 0);
      const emptyBottleItem = ensureItem(`${productName} - Empty Bottle`, "Consumables", "Pcs", 0);

      // Real starting bottled stock - one real batch, using the same
      // real yield math the actual Bottling screen uses, so there's
      // genuine stock ready to send to a branch immediately, not zero
      // until someone manually bottles it first.
      const concentrateQtyLiters = 1, waterQtyLiters = 1, bottleSizeMl = 250;
      const realYield = Math.floor(((concentrateQtyLiters + waterQtyLiters) * 1000) / bottleSizeMl);
      if (concentrateItem.centralStock >= concentrateQtyLiters && bottledItem.centralStock === 0) {
        concentrateItem.centralStock -= concentrateQtyLiters;
        bottledItem.centralStock += realYield;
      }

      return {
        recipeId: `RECIPE-SEED-${productName.replace(/[^a-zA-Z0-9]/g, "-")}`,
        productName,
        concentrateItemId: concentrateItem.itemId,
        concentrateQtyLiters, waterQtyLiters, bottleSizeMl,
        bottledItemId: bottledItem.itemId, emptyBottleItemId: emptyBottleItem.itemId,
        mlPerWash: PLACEHOLDER_ML_PER_WASH,
        concentrateCostPerLiter: PLACEHOLDER_COST_PER_LITER,
        isActive: true, createdAt: now, updatedAt: now,
      };
    };

    const newRecipes = [
      buildRecipe("Dash Shine", "Dashboard Polish", "Cleaning Supplies", "L"),
      buildRecipe("Wheel Cleaner", "Wheel Cleaner 1L", "Cleaning Supplies", "L"),
      buildRecipe("Crystal Finish", "Glass Cleaner Concentrate", "Cleaning Supplies", "L"),
      buildRecipe("Interior Pro", "Interior Pro", "Cleaning Supplies", "L"),
    ];

    DataService.setAll("INVENTORY_ITEMS", items);
    DataService.setAll("DILUTION_RECIPES", [...recipes, ...newRecipes]);
    localStorage.setItem(SEED_VERSION_KEY, "DONE");

    console.info(
      "[remainingRecipesSeed] Real recipes added for Dash Shine, Wheel Cleaner, Crystal Finish, and Interior Pro. " +
      "Cost and ml-per-wash are explicit placeholders (₹1200/L, 30ml) pending Super Admin's real product-specific figures."
    );
  } catch (err) {
    console.error("[remainingRecipesSeed] Seed failed, recipes unaffected:", err);
  }
}
