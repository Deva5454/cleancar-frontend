/**
 * dilutionRecipeService — real recipes connecting a raw concentrate
 * (received from a supplier) to a finished, bottled product (what
 * actually moves through the Kim → Branch → Supervisor → Washer chain).
 *
 * Genuinely new concept - previously every inventory item was just a
 * name and a quantity, with no way to say "this raw material becomes
 * this different, finished item, at this yield."
 */

import { DataService } from "./DataService";

export interface DilutionRecipe {
  recipeId: string;
  productName: string; // e.g. "Crystal Finish"
  concentrateItemId: string; // the raw, undiluted item received from the supplier
  concentrateQtyLiters: number; // e.g. 1
  waterQtyLiters: number; // e.g. 1.5
  bottleSizeMl: number; // e.g. 250 - real, confirmed
  bottledItemId: string; // the real, finished inventory item this recipe produces
  emptyBottleItemId: string; // the real, separate item tracking empty bottles owed back to Kim
  // Real, SuperAdmin-only setting - how many ml this product uses per
  // wash, always deducted in full regardless of the actual vehicle
  // size, confirmed directly with the business.
  mlPerWash: number;
  concentrateCostPerLiter: number; // for real cost-per-wash calculation
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "DILUTION_RECIPES";

export function getDilutionRecipes(cityId?: string): DilutionRecipe[] {
  return DataService.get<DilutionRecipe>(STORAGE_KEY, cityId);
}

export function getRecipeByBottledItemId(bottledItemId: string, cityId?: string): DilutionRecipe | undefined {
  return getDilutionRecipes(cityId).find((r) => r.bottledItemId === bottledItemId && r.isActive);
}

export function getRecipeByEmptyBottleItemId(emptyBottleItemId: string, cityId?: string): DilutionRecipe | undefined {
  return getDilutionRecipes(cityId).find((r) => r.emptyBottleItemId === emptyBottleItemId);
}

/**
 * Real yield - how many real, sealed bottles one batch of this recipe
 * produces. (concentrate + water) in ml, divided by the real bottle size.
 */
export function calculateYield(recipe: Pick<DilutionRecipe, "concentrateQtyLiters" | "waterQtyLiters" | "bottleSizeMl">): number {
  const totalMl = (recipe.concentrateQtyLiters + recipe.waterQtyLiters) * 1000;
  return Math.floor(totalMl / recipe.bottleSizeMl);
}

/**
 * Real cost per wash - the concentrate's real cost, spread across every
 * real wash the whole batch will ever produce. Water and bottling cost
 * are treated as real, negligible/zero unless a business decision adds
 * them later - not fabricated into this number.
 */
export function calculateCostPerWash(recipe: DilutionRecipe): number {
  const totalConcentrateCost = recipe.concentrateQtyLiters * recipe.concentrateCostPerLiter;
  const yieldBottles = calculateYield(recipe);
  const totalMl = yieldBottles * recipe.bottleSizeMl;
  if (totalMl <= 0 || recipe.mlPerWash <= 0) return 0;
  const totalWashesFromBatch = totalMl / recipe.mlPerWash;
  return Math.round((totalConcentrateCost / totalWashesFromBatch) * 100) / 100;
}

export function saveDilutionRecipe(recipe: Omit<DilutionRecipe, "recipeId" | "createdAt" | "updatedAt"> & { recipeId?: string }, cityId?: string): DilutionRecipe {
  const all = getDilutionRecipes(cityId);
  const now = new Date().toISOString();
  if (recipe.recipeId) {
    const idx = all.findIndex((r) => r.recipeId === recipe.recipeId);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...recipe, updatedAt: now } as DilutionRecipe;
      DataService.setAll(STORAGE_KEY, all, cityId);
      return all[idx];
    }
  }
  const newRecipe: DilutionRecipe = { ...recipe, recipeId: `RECIPE-${Date.now()}`, createdAt: now, updatedAt: now } as DilutionRecipe;
  DataService.setAll(STORAGE_KEY, [...all, newRecipe], cityId);
  return newRecipe;
}

/**
 * Real, SuperAdmin-only update to the fixed ml-per-wash amount for a
 * product - separate from the rest of the recipe, since this is the
 * one figure that's explicitly SuperAdmin-controlled per the real
 * business rule confirmed directly.
 */
export function setMlPerWash(recipeId: string, mlPerWash: number, cityId?: string): boolean {
  const all = getDilutionRecipes(cityId);
  const idx = all.findIndex((r) => r.recipeId === recipeId);
  if (idx < 0) return false;
  all[idx] = { ...all[idx], mlPerWash, updatedAt: new Date().toISOString() };
  DataService.setAll(STORAGE_KEY, all, cityId);
  return true;
}

/**
 * Real, general field update - every real recipe number (concentrate
 * quantity, water quantity, bottle size, concentrate cost, mlPerWash)
 * is genuinely editable by SuperAdmin, confirmed directly as a real
 * requirement, since these figures change over time (supplier price
 * changes, a revised dilution ratio, etc).
 */
export function updateRecipeField(
  recipeId: string,
  field: "concentrateQtyLiters" | "waterQtyLiters" | "bottleSizeMl" | "concentrateCostPerLiter" | "mlPerWash",
  value: number,
  cityId?: string
): boolean {
  const all = getDilutionRecipes(cityId);
  const idx = all.findIndex((r) => r.recipeId === recipeId);
  if (idx < 0 || isNaN(value) || value <= 0) return false;
  all[idx] = { ...all[idx], [field]: value, updatedAt: new Date().toISOString() };
  DataService.setAll(STORAGE_KEY, all, cityId);
  return true;
}
