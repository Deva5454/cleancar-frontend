/**
 * PressureWasherAssembly.tsx — real assembly screen at Kim. Shows
 * exactly how many complete machines the current real part stock
 * could produce, lets Store Manager assemble that many, and provides
 * a real, working way for Store Manager or Super Admin to add a new
 * part type to the catalog going forward.
 */

import { useState } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import {
  getPartCatalog, addPartToCatalog, getAssemblableCount, assembleMachines,
} from "../../services/pressureWasherPartsService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Wrench, Plus } from "lucide-react";
import { toast } from "sonner";

export function PressureWasherAssembly() {
  const { inventory } = useInventory();
  const { city } = useCity();
  const { currentRole } = useRole();
  const [refreshTick, setRefreshTick] = useState(0);
  const [assembleQty, setAssembleQty] = useState("1");
  const [newPartName, setNewPartName] = useState("");

  const catalog = getPartCatalog();
  const assemblable = getAssemblableCount(city);
  const canManageCatalog = ["Store Manager", "Super Admin"].includes(currentRole);

  const partStockRows = catalog.map((partName) => {
    const item = inventory.find((i: any) => i.itemName === partName && i.cityId === city);
    return { partName, centralStock: item?.centralStock || 0 };
  });

  const handleAssemble = () => {
    const qty = parseInt(assembleQty, 10);
    if (!qty || qty <= 0) {
      toast.error("Enter a real quantity to assemble");
      return;
    }
    if (qty > assemblable) {
      toast.error(`Only ${assemblable} complete machine(s) can genuinely be assembled with current real part stock`);
      return;
    }
    const ok = assembleMachines(qty, city);
    if (ok) {
      toast.success(`Assembled ${qty} real Pressure Washing Machine(s)`);
      setRefreshTick((t) => t + 1);
      setAssembleQty("1");
    } else {
      toast.error("Assembly failed — insufficient real part stock");
    }
  };

  const handleAddPart = () => {
    if (!newPartName.trim()) {
      toast.error("Enter a real part name");
      return;
    }
    addPartToCatalog(newPartName.trim(), city);
    toast.success(`${newPartName.trim()} added to the real part catalog — receive real stock for it like any other item`);
    setNewPartName("");
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" /> Pressure Washer Assembly
          </CardTitle>
          <p className="text-xs text-gray-500">A machine is a real assembly of every part below — one of each is consumed per unit assembled</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {partStockRows.map((row) => (
              <div key={row.partName} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span className="font-medium text-gray-900">{row.partName}</span>
                <span className="text-gray-600">{row.centralStock} in real central stock</span>
              </div>
            ))}
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <span className="font-medium">Real assemblable right now: </span>
            <span className="font-bold text-blue-700">{assemblable}</span> complete machine(s)
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" min="1" max={assemblable} value={assembleQty} onChange={(e) => setAssembleQty(e.target.value)} className="w-24" />
            <Button onClick={handleAssemble} disabled={assemblable === 0}>Assemble</Button>
          </div>
        </CardContent>
      </Card>

      {canManageCatalog && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-5 h-5 text-gray-600" /> Add a New Part Type
            </CardTitle>
            <p className="text-xs text-gray-500">Store Manager or Super Admin only — new parts start at zero real stock until Kim actually receives some</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="new-part">Part Name</Label>
                <Input id="new-part" value={newPartName} onChange={(e) => setNewPartName(e.target.value)} placeholder="e.g. Trigger Handle" />
              </div>
              <Button onClick={handleAddPart} className="mt-6">Add to Catalog</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PressureWasherAssembly;
