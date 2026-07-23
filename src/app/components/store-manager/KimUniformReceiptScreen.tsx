/**
 * KimUniformReceiptScreen.tsx — real, reusable receipt-entry screen for
 * uniform stock (T-shirts, Shirts) arriving at Kim, by real size. Each
 * size is tracked as its own real inventory item, matching the same
 * real pattern already used for the dilution/bottling chain, so every
 * size can move through Kim → Branch → Supervisor → Washer/TSE and be
 * traced individually - not lumped into one undifferentiated count.
 */

import { useState } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Shirt } from "lucide-react";
import { toast } from "sonner";

const SIZES = ["S", "M", "L", "XL"];

type GarmentType = "Uniform T-Shirt" | "Uniform Shirt";

export function KimUniformReceiptScreen() {
  const { inventory, addInventoryItem, procureInventory } = useInventory();
  const { city } = useCity();

  const [garmentType, setGarmentType] = useState<GarmentType>("Uniform T-Shirt");
  const [qtyBySize, setQtyBySize] = useState<Record<string, string>>({});
  const [supplierName, setSupplierName] = useState("");

  const ensureItem = (name: string) => {
    const existing = inventory.find((i: any) => i.itemName === name && i.cityId === city);
    if (existing) return existing;
    return addInventoryItem({
      itemName: name, category: "Consumables", unit: "Pcs", reorderLevel: 10,
      centralStock: 0, branchStock: {}, supervisorStock: {}, washerStock: {},
      unitCost: garmentType === "Uniform T-Shirt" ? 180 : 350,
    } as any, city);
  };

  const currentStockBySize = SIZES.reduce((acc, sz) => {
    const item = inventory.find((i: any) => i.itemName === `${garmentType} - ${sz}` && i.cityId === city);
    acc[sz] = item?.centralStock ?? 0;
    return acc;
  }, {} as Record<string, number>);

  const handleReceive = () => {
    const entries = Object.entries(qtyBySize).filter(([, q]) => q && parseInt(q, 10) > 0);
    if (entries.length === 0) {
      toast.error("Enter at least one real quantity");
      return;
    }
    if (!supplierName.trim()) {
      toast.error("Enter the supplier name");
      return;
    }
    let totalReceived = 0;
    entries.forEach(([size, qtyStr]) => {
      const qty = parseInt(qtyStr, 10);
      const item = ensureItem(`${garmentType} - ${size}`);
      procureInventory(item.itemId, qty, supplierName.trim(), city);
      totalReceived += qty;
    });
    toast.success(`Received ${totalReceived} ${garmentType.toLowerCase()}${totalReceived !== 1 ? "s" : ""} — real stock updated`);
    setQtyBySize({});
    setSupplierName("");
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Shirt className="w-5 h-5 text-blue-600" /> Receive Uniform Stock
        </h1>
        <p className="text-sm text-gray-500">Real receipt entry, by size, at Kim (Main Store)</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2">
            <Button variant={garmentType === "Uniform T-Shirt" ? "default" : "outline"} size="sm" onClick={() => { setGarmentType("Uniform T-Shirt"); setQtyBySize({}); }}>T-Shirts</Button>
            <Button variant={garmentType === "Uniform Shirt" ? "default" : "outline"} size="sm" onClick={() => { setGarmentType("Uniform Shirt"); setQtyBySize({}); }}>Shirts</Button>
          </div>

          <div>
            <Label>Supplier</Label>
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Supplier name" />
          </div>

          <div className="space-y-2">
            <Label>Quantity Received, by Size</Label>
            <div className="grid grid-cols-2 gap-2">
              {SIZES.map((sz) => (
                <div key={sz} className="flex items-center gap-2 border rounded-lg p-2">
                  <span className="w-8 text-center font-medium text-sm text-gray-700">{sz}</span>
                  <Input
                    type="number" min="0" placeholder="0"
                    value={qtyBySize[sz] || ""}
                    onChange={(e) => setQtyBySize((prev) => ({ ...prev, [sz]: e.target.value }))}
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">on hand: {currentStockBySize[sz]}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleReceive} className="w-full">Record Receipt</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default KimUniformReceiptScreen;
