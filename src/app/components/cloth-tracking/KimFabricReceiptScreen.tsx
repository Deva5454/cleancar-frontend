/**
 * KimFabricReceiptScreen.tsx — real receipt entry for fabric cloths
 * arriving at Kim, by color, matching an actual delivery (e.g. from
 * GT Exim Solutions). Creates real, individually barcoded cloths.
 */

import { useState } from "react";
import { clothTrackingService } from "../../services/clothTrackingService";
import type { ClothColor } from "../../types/clothTracking";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Shirt } from "lucide-react";
import { toast } from "sonner";

const COLORS: ClothColor[] = ["Yellow", "Blue", "Black", "Green"];
const COLOR_SWATCH: Record<ClothColor, string> = {
  Yellow: "#facc15", Blue: "#3b82f6", Black: "#1f2937", Green: "#22c55e",
};

export function KimFabricReceiptScreen() {
  const [qtyByColor, setQtyByColor] = useState<Record<string, string>>({});
  const [supplierName, setSupplierName] = useState("");

  const handleReceive = () => {
    const entries = Object.entries(qtyByColor).filter(([, q]) => q && parseInt(q, 10) > 0);
    if (entries.length === 0) {
      toast.error("Enter at least one real quantity");
      return;
    }
    if (!supplierName.trim()) {
      toast.error("Enter the supplier name");
      return;
    }
    let totalCreated = 0;
    entries.forEach(([color, qtyStr]) => {
      const qty = parseInt(qtyStr, 10);
      clothTrackingService.receiveFabricAtKim(color as ClothColor, qty);
      totalCreated += qty;
    });
    toast.success(`${totalCreated} real, individually barcoded cloths received from ${supplierName}`);
    setQtyByColor({});
    setSupplierName("");
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Shirt className="w-5 h-5 text-blue-600" /> Receive Fabric
        </h1>
        <p className="text-sm text-gray-500">Real receipt entry, by color — each cloth gets its own real barcode</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label>Supplier</Label>
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="e.g. GT Exim Solutions" />
          </div>

          <div className="space-y-2">
            <Label>Quantity Received, by Color</Label>
            <div className="grid grid-cols-2 gap-2">
              {COLORS.map((color) => (
                <div key={color} className="flex items-center gap-2 border rounded-lg p-2">
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: COLOR_SWATCH[color] }} />
                  <span className="w-14 text-sm text-gray-700">{color}</span>
                  <Input
                    type="number" min="0" placeholder="0"
                    value={qtyByColor[color] || ""}
                    onChange={(e) => setQtyByColor((prev) => ({ ...prev, [color]: e.target.value }))}
                  />
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

export default KimFabricReceiptScreen;
