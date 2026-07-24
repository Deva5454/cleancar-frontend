/**
 * EquipmentRepairQueue.tsx — real screen at Kim showing every real
 * equipment item currently under repair, with a genuine "Mark
 * Repaired" action that returns it to real, usable central stock.
 */

import { useState } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Wrench } from "lucide-react";
import { toast } from "sonner";

export function EquipmentRepairQueue() {
  const { inventory, markEquipmentRepaired } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const [refreshTick, setRefreshTick] = useState(0);

  const underRepair = inventory.filter((i: any) => i.cityId === city && (i.underRepairStock || 0) > 0);

  const handleMarkRepaired = (itemId: string, qty: number, name: string) => {
    const ok = markEquipmentRepaired(itemId, qty, currentUser?.name || "Store Manager", city);
    if (ok) {
      toast.success(`${name} marked repaired — back in real, usable central stock`);
      setRefreshTick((t) => t + 1);
    } else {
      toast.error("Could not mark this repaired — real data mismatch, please refresh");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-600" /> Equipment Repair Queue
        </CardTitle>
        <p className="text-xs text-gray-500">Real equipment currently at Kim, sent back broken by a supervisor, awaiting repair</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {underRepair.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing currently under repair.</p>
        ) : (
          underRepair.map((i: any) => (
            <div key={i.itemId} className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="font-medium text-gray-900">{i.itemName}</p>
                <p className="text-xs text-gray-500">{i.underRepairStock} unit(s) under repair</p>
              </div>
              <Button size="sm" onClick={() => handleMarkRepaired(i.itemId, i.underRepairStock, i.itemName)}>Mark Repaired</Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default EquipmentRepairQueue;
