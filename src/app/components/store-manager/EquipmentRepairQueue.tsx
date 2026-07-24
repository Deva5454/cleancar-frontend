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
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Wrench } from "lucide-react";
import { toast } from "sonner";

export function EquipmentRepairQueue() {
  const { inventory, markEquipmentRepaired, consumePressureWasherPart } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const [refreshTick, setRefreshTick] = useState(0);

  const underRepair = inventory.filter((i: any) => i.cityId === city && (i.underRepairStock || 0) > 0);
  // ✅ FIX: previously there was no way to record which real spare part
  // (nozzle, spray gun, hose) a repair actually used — spare-parts
  // stock was completely disconnected from real repairs. Optional here
  // because not every repair uses a part (e.g. a loose fitting just
  // needs tightening), but when one is picked, it's a real deduction.
  const spareParts = inventory.filter((i: any) => i.cityId === city && i.category === "Pressure Washer Parts");
  const [partUsed, setPartUsed] = useState<Record<string, string>>({});
  const [partQty, setPartQty] = useState<Record<string, string>>({});

  const handleMarkRepaired = (itemId: string, qty: number, name: string) => {
    const ok = markEquipmentRepaired(itemId, qty, currentUser?.name || "Store Manager", city);
    if (!ok) {
      toast.error("Could not mark this repaired — real data mismatch, please refresh");
      return;
    }

    const selectedPartId = partUsed[itemId];
    const selectedQtyRaw = partQty[itemId];
    if (selectedPartId && selectedQtyRaw) {
      const selectedQty = parseInt(selectedQtyRaw, 10);
      if (selectedQty > 0) {
        const partOk = consumePressureWasherPart(selectedPartId, selectedQty, currentUser?.name || "Store Manager", city);
        const partName = spareParts.find((p: any) => p.itemId === selectedPartId)?.itemName || "part";
        if (partOk) {
          toast.success(`${name} marked repaired — ${selectedQty} ${partName} deducted from real spare stock`);
        } else {
          toast.error(`${name} marked repaired, but couldn't deduct ${partName} — check real spare stock and adjust manually if needed`);
        }
        setPartUsed((prev) => ({ ...prev, [itemId]: "" }));
        setPartQty((prev) => ({ ...prev, [itemId]: "" }));
        setRefreshTick((t) => t + 1);
        return;
      }
    }

    toast.success(`${name} marked repaired — back in real, usable central stock`);
    setRefreshTick((t) => t + 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-600" /> Equipment Repair Queue
        </CardTitle>
        <p className="text-xs text-gray-500">Real equipment currently at Kim, sent back broken by a supervisor, awaiting repair</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {underRepair.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing currently under repair.</p>
        ) : (
          underRepair.map((i: any) => (
            <div key={i.itemId} className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{i.itemName}</p>
                  <p className="text-xs text-gray-500">{i.underRepairStock} unit(s) under repair</p>
                </div>
                <Button size="sm" onClick={() => handleMarkRepaired(i.itemId, i.underRepairStock, i.itemName)}>Mark Repaired</Button>
              </div>

              {spareParts.length > 0 && (
                <div className="pt-2 border-t">
                  <Label className="text-xs text-gray-500">Real spare part used for this repair (optional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Select
                      value={partUsed[i.itemId] || ""}
                      onValueChange={(v) => setPartUsed((prev) => ({ ...prev, [i.itemId]: v }))}
                    >
                      <SelectTrigger className="flex-1"><SelectValue placeholder="No part used" /></SelectTrigger>
                      <SelectContent>
                        {spareParts.map((p: any) => (
                          <SelectItem key={p.itemId} value={p.itemId}>
                            {p.itemName} (on hand: {p.centralStock || 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number" min="1" placeholder="Qty"
                      className="w-20"
                      value={partQty[i.itemId] || ""}
                      onChange={(e) => setPartQty((prev) => ({ ...prev, [i.itemId]: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default EquipmentRepairQueue;
