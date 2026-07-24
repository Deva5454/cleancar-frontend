/**
 * EquipmentSerialRegistry.tsx — real, per-serial view of every tracked
 * equipment unit: where it is right now, and its full real history
 * (created → issued → sent for repair → repaired → reissued, etc).
 *
 * This is the real answer to "is the machine that came back from
 * repair the same one that went in" — each unit has its own real
 * serial and a real, permanent history log, not just an aggregate
 * count. Units are created at the two real points equipment actually
 * comes into existence (assembly and procurement of an Equipment-
 * category item), so equipment stock that existed before this
 * registry was built won't retroactively have a serial — everything
 * created going forward will.
 */

import { useState } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Tag, ChevronDown, ChevronUp } from "lucide-react";

const LOCATION_COLORS: Record<string, string> = {
  Central: "bg-teal-100 text-teal-700 border-teal-300",
  Branch: "bg-blue-100 text-blue-700 border-blue-300",
  Supervisor: "bg-purple-100 text-purple-700 border-purple-300",
  Washer: "bg-green-100 text-green-700 border-green-300",
  UnderRepair: "bg-red-100 text-red-700 border-red-300",
};

export function EquipmentSerialRegistry() {
  const { inventory, getEquipmentUnits } = useInventory();
  const { city } = useCity();

  const equipmentItems = inventory.filter((i: any) => i.cityId === city && i.category === "Equipment");
  const [itemFilter, setItemFilter] = useState<string>("all");
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  const units = getEquipmentUnits(city, itemFilter === "all" ? undefined : itemFilter)
    .sort((a: any, b: any) => a.unitId.localeCompare(b.unitId));

  const counts = units.reduce((acc: Record<string, number>, u: any) => {
    acc[u.location] = (acc[u.location] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-600" /> Equipment Serial Registry
        </h1>
        <p className="text-sm text-gray-500">Real, per-unit tracking — every unit created since this registry was built</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-5 gap-2 text-center">
            {["Central", "Branch", "Supervisor", "Washer", "UnderRepair"].map((loc) => (
              <div key={loc} className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">{loc === "UnderRepair" ? "Under Repair" : loc}</p>
                <p className="text-xl font-bold text-gray-900">{counts[loc] || 0}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <Select value={itemFilter} onValueChange={setItemFilter}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Filter by item" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment Items</SelectItem>
            {equipmentItems.map((i: any) => (
              <SelectItem key={i.itemId} value={i.itemId}>{i.itemName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Units ({units.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {units.length === 0 ? (
            <p className="text-sm text-gray-400">
              No serial-tracked units yet — units are created when equipment is assembled or procured. Equipment
              stock that existed before this registry was built won't retroactively have a serial.
            </p>
          ) : (
            units.map((unit: any) => {
              const item = inventory.find((i: any) => i.itemId === unit.itemId);
              const isExpanded = expandedUnit === unit.unitId;
              return (
                <div key={unit.unitId} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                    onClick={() => setExpandedUnit(isExpanded ? null : unit.unitId)}
                  >
                    <div>
                      <p className="font-mono font-semibold text-sm text-gray-900">{unit.unitId}</p>
                      <p className="text-xs text-gray-500">{item?.itemName || unit.itemId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={LOCATION_COLORS[unit.location] || ""}>
                        {unit.location === "UnderRepair" ? "Under Repair" : unit.location}
                        {unit.locationId ? ` — ${unit.locationId}` : ""}
                      </Badge>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Real History</p>
                      <div className="space-y-2">
                        {unit.history.map((h: any, idx: number) => (
                          <div key={idx} className="text-xs border-l-2 border-blue-300 pl-2">
                            <p className="font-medium text-gray-900">{h.event}</p>
                            <p className="text-gray-500">
                              {h.fromLocation ? `${h.fromLocation}${h.fromId ? ` (${h.fromId})` : ""} → ` : ""}
                              {h.toLocation}{h.toId ? ` (${h.toId})` : ""}
                            </p>
                            <p className="text-gray-400">{new Date(h.at).toLocaleString()} — {h.by}{h.notes ? ` — ${h.notes}` : ""}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EquipmentSerialRegistry;
