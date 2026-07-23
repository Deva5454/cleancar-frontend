/**
 * SuperAdminDilutionRecipes.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Super Admin screen: real dilution recipes connecting a raw concentrate
 * to a finished, bottled product - and the one SuperAdmin-only setting
 * this whole flow depends on, mlPerWash, confirmed directly with the
 * business as always deducted in full regardless of vehicle size.
 */

import { useState } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import {
  getDilutionRecipes, saveDilutionRecipe, setMlPerWash, calculateYield, calculateCostPerWash,
  type DilutionRecipe,
} from "../../services/dilutionRecipeService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Beaker, Plus, Lock } from "lucide-react";
import { toast } from "sonner";

export function SuperAdminDilutionRecipes() {
  const { currentRole } = useRole();
  const { inventory, addInventoryItem } = useInventory();
  const { city } = useCity();
  const [recipes, setRecipes] = useState<DilutionRecipe[]>(() => getDilutionRecipes(city));
  const [showNew, setShowNew] = useState(false);
  const [productName, setProductName] = useState("");
  const [concentrateItemId, setConcentrateItemId] = useState("");
  const [concentrateQty, setConcentrateQty] = useState("");
  const [waterQty, setWaterQty] = useState("");
  const [bottleSizeMl, setBottleSizeMl] = useState("250");
  const [mlPerWash, setMlPerWashInput] = useState("");
  const [concentrateCost, setConcentrateCost] = useState("");

  // Real access restriction - previously this screen had none at all,
  // even though mlPerWash is explicitly a SuperAdmin-only setting per
  // the confirmed business rule. A Kim store manager (or anyone else
  // with the URL) could reach this and change the fixed per-wash
  // consumption amount, which was never the intent. Placed after every
  // hook above, so hook count never changes between renders.
  if (currentRole !== "Super Admin") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 p-6 bg-white border rounded-lg shadow-sm max-w-md">
          <Lock className="w-6 h-6 text-gray-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">Restricted</p>
            <p className="text-sm text-gray-500">Dilution Recipes is available to Super Admin only.</p>
          </div>
        </div>
      </div>
    );
  }

  const refresh = () => setRecipes(getDilutionRecipes(city));

  const handleCreateRecipe = () => {
    if (!productName.trim() || !concentrateItemId || !concentrateQty || !waterQty || !bottleSizeMl || !mlPerWash || !concentrateCost) {
      toast.error("Fill in every field");
      return;
    }
    if (parseFloat(concentrateQty) <= 0 || parseFloat(waterQty) < 0 || parseFloat(bottleSizeMl) <= 0 || parseFloat(mlPerWash) <= 0 || parseFloat(concentrateCost) <= 0) {
      toast.error("Enter real, positive values — 0 isn't valid here");
      return;
    }
    // Real fix: addInventoryItem() generates its own real itemId
    // internally and ignores any predicted one - so the recipe must
    // reference whichever real item already exists, or the real ID
    // actually returned by addInventoryItem, not a guessed string.
    const existingBottled = inventory.find((i: any) => i.itemName === `${productName} (Bottled ${bottleSizeMl}ml)` && i.cityId === city);
    const existingEmpty = inventory.find((i: any) => i.itemName === `${productName} - Empty Bottle` && i.cityId === city);

    const bottledItem = existingBottled || addInventoryItem({
      itemName: `${productName} (Bottled ${bottleSizeMl}ml)`,
      category: "Consumables", unit: "Pcs", reorderLevel: 10,
      centralStock: 0, branchStock: {}, supervisorStock: {}, washerStock: {},
      unitCost: 0,
    } as any, city);
    const emptyBottleItem = existingEmpty || addInventoryItem({
      itemName: `${productName} - Empty Bottle`,
      category: "Consumables", unit: "Pcs", reorderLevel: 0,
      centralStock: 0, branchStock: {}, supervisorStock: {}, washerStock: {},
      unitCost: 0,
    } as any, city);

    saveDilutionRecipe({
      productName, concentrateItemId,
      concentrateQtyLiters: parseFloat(concentrateQty), waterQtyLiters: parseFloat(waterQty),
      bottleSizeMl: parseFloat(bottleSizeMl), bottledItemId: bottledItem.itemId, emptyBottleItemId: emptyBottleItem.itemId,
      mlPerWash: parseFloat(mlPerWash), concentrateCostPerLiter: parseFloat(concentrateCost),
      isActive: true,
    }, city);

    toast.success(`Recipe for ${productName} created`);
    setShowNew(false);
    setProductName(""); setConcentrateItemId(""); setConcentrateQty(""); setWaterQty("");
    setBottleSizeMl("250"); setMlPerWashInput(""); setConcentrateCost("");
    refresh();
  };

  const handleUpdateMlPerWash = (recipeId: string, value: string) => {
    const ml = parseFloat(value);
    if (isNaN(ml) || ml <= 0) return;
    setMlPerWash(recipeId, ml, city);
    refresh();
  };

  const concentrateItems = inventory.filter((i: any) => i.cityId === city && i.category !== "Equipment");

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-blue-600" /> Dilution Recipes
          </h1>
          <p className="text-sm text-gray-500">Real recipes connecting a raw concentrate to a finished, bottled product</p>
        </div>
        <Button onClick={() => setShowNew(!showNew)}><Plus className="w-4 h-4 mr-1" /> New Recipe</Button>
      </div>

      {showNew && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Recipe</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Product Name</Label>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Crystal Finish" />
              </div>
              <div className="col-span-2">
                <Label>Concentrate Item (received from supplier)</Label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={concentrateItemId} onChange={(e) => setConcentrateItemId(e.target.value)}>
                  <option value="">Select item</option>
                  {concentrateItems.map((i: any) => <option key={i.itemId} value={i.itemId}>{i.itemName}</option>)}
                </select>
              </div>
              <div>
                <Label>Concentrate (Liters)</Label>
                <Input type="number" value={concentrateQty} onChange={(e) => setConcentrateQty(e.target.value)} placeholder="1" />
              </div>
              <div>
                <Label>Water (Liters)</Label>
                <Input type="number" value={waterQty} onChange={(e) => setWaterQty(e.target.value)} placeholder="1.5" />
              </div>
              <div>
                <Label>Bottle Size (ml)</Label>
                <Input type="number" value={bottleSizeMl} onChange={(e) => setBottleSizeMl(e.target.value)} placeholder="250" />
              </div>
              <div>
                <Label>ml Used Per Wash (fixed)</Label>
                <Input type="number" value={mlPerWash} onChange={(e) => setMlPerWashInput(e.target.value)} placeholder="25" />
              </div>
              <div className="col-span-2">
                <Label>Concentrate Cost (₹ per Liter)</Label>
                <Input type="number" value={concentrateCost} onChange={(e) => setConcentrateCost(e.target.value)} placeholder="500" />
              </div>
            </div>
            {concentrateQty && waterQty && bottleSizeMl && (
              <p className="text-sm text-gray-600">
                Real yield: {calculateYield({ concentrateQtyLiters: parseFloat(concentrateQty) || 0, waterQtyLiters: parseFloat(waterQty) || 0, bottleSizeMl: parseFloat(bottleSizeMl) || 250 })} bottles per batch
              </p>
            )}
            <Button onClick={handleCreateRecipe} className="w-full">Create Recipe</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Active Recipes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {recipes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No recipes yet.</p>
          ) : (
            recipes.map((r) => (
              <div key={r.recipeId} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{r.productName}</p>
                  <Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {r.concentrateQtyLiters}L concentrate + {r.waterQtyLiters}L water → {calculateYield(r)} bottles of {r.bottleSizeMl}ml
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">ml per wash:</Label>
                    <Input type="number" defaultValue={r.mlPerWash} className="w-20 h-8 text-sm" onBlur={(e) => handleUpdateMlPerWash(r.recipeId, e.target.value)} />
                  </div>
                  <p className="text-xs text-gray-600">Real cost per wash: ₹{calculateCostPerWash(r)}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SuperAdminDilutionRecipes;
