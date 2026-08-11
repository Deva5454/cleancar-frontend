/**
 * TrackedInventoryReceiveStock.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Real receipt of new stock at Kim, once purchased from a supplier.
 * Generates individually barcoded units for any configured item type
 * (bottles, brushes, or anything the Super Admin has added), the same
 * real pattern already proven for cloths.
 */
import { useEffect, useState } from "react";
import { useCity } from "../../contexts/CityContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { trackedInventoryService } from "../../services/trackedInventoryService";
import type { TrackedItemType, TrackedUnit } from "../../types/trackedInventory";

export function TrackedInventoryReceiveStock() {
  const { city } = useCity();
  trackedInventoryService.setCityId(city);

  const [types, setTypes] = useState<TrackedItemType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [lastReceived, setLastReceived] = useState<TrackedUnit[]>([]);

  useEffect(() => {
    const active = trackedInventoryService.getActiveItemTypes().filter(t => !t.isComposite);
    setTypes(active);
    if (active.length > 0) setSelectedTypeId(active[0].id);
  }, [city]);

  const handleReceive = () => {
    if (!selectedTypeId || quantity < 1) {
      toast.error("Select an item type and a real quantity.");
      return;
    }
    const created = trackedInventoryService.receiveUnitsAtKim(selectedTypeId, quantity);
    if (created.length === 0) {
      toast.error("Could not receive stock — check the item type is still active.");
      return;
    }
    setLastReceived(created);
    toast.success(`${created.length} real, barcoded unit${created.length !== 1 ? "s" : ""} received at Kim.`);
    setQuantity(1);
  };

  const selectedType = types.find(t => t.id === selectedTypeId);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-blue-600" /> Receive Stock at Kim
        </h1>
        <p className="text-sm text-gray-500">Real supplier receipt — generates individually barcoded units, ready to move through the chain.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">New Receipt</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Item Type</label>
            <select
              className="border rounded-lg px-2 py-1.5 text-sm w-full"
              value={selectedTypeId}
              onChange={e => setSelectedTypeId(e.target.value)}
            >
              {types.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
              ))}
              {types.length === 0 && <option value="">No item types configured yet</option>}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Quantity Received</label>
            <Input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
          </div>
          {selectedType && (
            <p className="text-xs text-gray-500">
              Barcodes will look like: <code>{selectedType.barcodePrefix}-{"{timestamp}"}-{"{random}"}</code>
            </p>
          )}
          <Button onClick={handleReceive} disabled={types.length === 0} className="w-full">
            Receive {quantity} Unit{quantity !== 1 ? "s" : ""} at Kim
          </Button>
        </CardContent>
      </Card>

      {lastReceived.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Just Received</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {lastReceived.map(u => (
                <div key={u.id} className="border rounded-lg p-2 text-sm flex items-center justify-between">
                  <span className="font-mono text-xs">{u.id}</span>
                  <Badge variant="secondary" className="text-xs">Kim</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TrackedInventoryReceiveStock;
