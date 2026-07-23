/**
 * KimBottlingScreen.tsx — the real Kim-side action: concentrate received
 * from a supplier is mixed with water and packed into real, sealed
 * bottles, using a real dilution recipe set up by SuperAdmin.
 */

import { useState } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { getDilutionRecipes, calculateYield, type DilutionRecipe } from "../../services/dilutionRecipeService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Beaker } from "lucide-react";
import { toast } from "sonner";

export function KimBottlingScreen() {
  const { inventory, performBottling } = useInventory();
  const { city } = useCity();
  const recipes = getDilutionRecipes(city).filter((r) => r.isActive);

  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [batches, setBatches] = useState("1");

  const selectedRecipe: DilutionRecipe | undefined = recipes.find((r) => r.recipeId === selectedRecipeId);
  const concentrateItem = selectedRecipe ? inventory.find((i: any) => i.itemId === selectedRecipe.concentrateItemId) : null;
  const bottledItem = selectedRecipe ? inventory.find((i: any) => i.itemId === selectedRecipe.bottledItemId) : null;

  const batchCount = parseInt(batches, 10) || 0;
  const yieldPerBatch = selectedRecipe ? calculateYield(selectedRecipe) : 0;
  const totalYield = yieldPerBatch * batchCount;
  const concentrateNeeded = selectedRecipe ? selectedRecipe.concentrateQtyLiters * batchCount : 0;

  const handleBottle = () => {
    if (!selectedRecipe || batchCount <= 0) {
      toast.error("Select a recipe and a valid batch count");
      return;
    }
    const ok = performBottling(
      { concentrateItemId: selectedRecipe.concentrateItemId, concentrateQtyLiters: selectedRecipe.concentrateQtyLiters, bottledItemId: selectedRecipe.bottledItemId, bottleSizeMl: selectedRecipe.bottleSizeMl, waterQtyLiters: selectedRecipe.waterQtyLiters },
      batchCount, city
    );
    if (ok) {
      toast.success(`${totalYield} bottles of ${selectedRecipe.productName} produced`);
      setBatches("1");
    } else {
      toast.error("Could not bottle — check real concentrate stock is sufficient");
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Beaker className="w-5 h-5 text-blue-600" /> Bottling
        </h1>
        <p className="text-sm text-gray-500">Mix concentrate with water and pack into real, sealed bottles</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {recipes.length === 0 ? (
            <p className="text-sm text-gray-400">No active recipes — set one up first.</p>
          ) : (
            <>
              <div>
                <Label>Product</Label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={selectedRecipeId} onChange={(e) => setSelectedRecipeId(e.target.value)}>
                  <option value="">Select product</option>
                  {recipes.map((r) => <option key={r.recipeId} value={r.recipeId}>{r.productName}</option>)}
                </select>
              </div>
              {selectedRecipe && (
                <>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                    <p>Real concentrate on hand: {concentrateItem?.centralStock ?? 0}L of {concentrateItem?.itemName}</p>
                    <p>Real bottled stock on hand: {bottledItem?.centralStock ?? 0} bottles</p>
                    <p className="mt-1 text-xs text-gray-500">Recipe: {selectedRecipe.concentrateQtyLiters}L concentrate + {selectedRecipe.waterQtyLiters}L water → {yieldPerBatch} bottles of {selectedRecipe.bottleSizeMl}ml, per batch</p>
                  </div>
                  <div>
                    <Label>Number of Batches</Label>
                    <Input type="number" min="1" value={batches} onChange={(e) => setBatches(e.target.value)} />
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <p>This will use <strong>{concentrateNeeded}L</strong> of concentrate and produce <strong>{totalYield}</strong> real bottles.</p>
                  </div>
                  <Button onClick={handleBottle} className="w-full" disabled={!concentrateItem || batchCount <= 0 || concentrateItem.centralStock < concentrateNeeded}>
                    Bottle Now
                  </Button>
                  {concentrateItem && concentrateItem.centralStock < concentrateNeeded && (
                    <p className="text-xs text-red-600">Not enough concentrate for this many batches.</p>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default KimBottlingScreen;
