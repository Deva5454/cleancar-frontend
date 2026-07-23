/**
 * EmptyBottleReturnPanel.tsx — real, reusable panel for returning empty
 * bottles back up the exact same chain they came down: Washer →
 * Supervisor → Branch → Kim. Embedded at each real stop, since the same
 * real action (return what's empty) looks the same everywhere it happens.
 */

import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { getDilutionRecipes } from "../../services/dilutionRecipeService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

type StopLocation = "Washer" | "Supervisor" | "Branch";

const NEXT_STOP: Record<StopLocation, { toLocation: "Supervisor" | "Branch" | "Central"; label: string }> = {
  Washer: { toLocation: "Supervisor", label: "your Supervisor" },
  Supervisor: { toLocation: "Branch", label: "the Surat Branch" },
  Branch: { toLocation: "Central", label: "Kim (Main Store)" },
};

export function EmptyBottleReturnPanel({
  currentLocation, currentId, toId, requestedBy,
}: {
  currentLocation: StopLocation;
  currentId: string;
  toId?: string; // real destination ID for Washer→Supervisor and Supervisor→Branch; not needed for →Central
  requestedBy: string;
}) {
  const { inventory, returnEmptyBottles } = useInventory();
  const { city } = useCity();
  const recipes = getDilutionRecipes(city);
  const next = NEXT_STOP[currentLocation];

  const emptyBottleStock = recipes.map((r) => {
    const item = inventory.find((i: any) => i.itemId === r.emptyBottleItemId && i.cityId === city);
    const qty = !item ? 0
      : currentLocation === "Washer" ? (item.washerStock[currentId] || 0)
      : currentLocation === "Supervisor" ? (item.supervisorStock[currentId] || 0)
      : (item.branchStock?.[currentId] || 0);
    return { recipe: r, item, qty };
  }).filter((e) => e.qty > 0);

  const handleReturn = (recipeId: string, itemId: string, qty: number) => {
    const ok = returnEmptyBottles(itemId, qty, currentLocation, currentId, next.toLocation, toId, requestedBy, city);
    if (ok) {
      toast.success(`${qty} empty bottle${qty !== 1 ? "s" : ""} sent to ${next.label}`);
    } else {
      toast.error("Could not return bottles — please try again");
    }
  };

  if (emptyBottleStock.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Empty Bottles to Return</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {emptyBottleStock.map(({ recipe, item, qty }) => (
          <div key={recipe.recipeId} className="flex items-center justify-between bg-white rounded-lg border p-3">
            <div>
              <p className="font-medium text-gray-900">{recipe.productName}</p>
              <p className="text-xs text-gray-500">{qty} empty bottle{qty !== 1 ? "s" : ""} on hand</p>
            </div>
            <Button size="sm" onClick={() => handleReturn(recipe.recipeId, item!.itemId, qty)}>
              Send to {next.label}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default EmptyBottleReturnPanel;
