/**
 * GeneralProcurement.tsx — real receipt-entry screen at Kim (Main
 * Store) for any inventory item, not just uniforms.
 *
 * ✅ FIX: previously, procureInventory() — the one function that
 * genuinely increases centralStock from an outside supplier — was
 * only ever called from KimUniformReceiptScreen.tsx. Every other
 * screen that looked like general procurement (GoodsReceipt.tsx,
 * StoreRequisitions.tsx, InvoiceMatching.tsx) was demo/mock UI with
 * hardcoded sample data, never touching real inventory. This screen
 * follows the exact same real pattern as the uniform receipt screen,
 * generalized to any existing item — or a brand-new one, created here
 * the same way KimUniformReceiptScreen creates a new size on the fly.
 */

import { useState, useEffect } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { PackagePlus, PackageCheck } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Cleaning Supplies", "Equipment", "Consumables", "Tools", "Pressure Washer Parts"] as const;
const UNITS = ["L", "Kg", "Pcs", "Box"] as const;

export function GeneralProcurement() {
  const { inventory, addInventoryItem, procureInventory, stockTransactions, updateInventoryItem } = useInventory();
  const { city } = useCity();

  const cityItems = inventory
    .filter((i: any) => i.cityId === city)
    .sort((a: any, b: any) => a.itemName.localeCompare(b.itemName));

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [itemId, setItemId] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newCategory, setNewCategory] = useState<typeof CATEGORIES[number]>("Cleaning Supplies");
  const [newUnit, setNewUnit] = useState<typeof UNITS[number]>("Pcs");
  const [newReorderLevel, setNewReorderLevel] = useState("10");
  const [newUnitCost, setNewUnitCost] = useState("");
  const [newGstRate, setNewGstRate] = useState("18");
  const [newHsnCode, setNewHsnCode] = useState("");
  const [existingItemRate, setExistingItemRate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplierName, setSupplierName] = useState("");

  const selectedItem = cityItems.find((i: any) => i.itemId === itemId);
  // Real item-master GST correction — most items in this app were
  // seeded before gstRate/hsnCode existed, so this is the one place to
  // set/fix them for an item already on file, not just at creation.
  const [editGstRate, setEditGstRate] = useState("");
  const [editHsnCode, setEditHsnCode] = useState("");

  useEffect(() => {
    setEditGstRate(selectedItem?.gstRate != null ? String(selectedItem.gstRate) : "18");
    setEditHsnCode(selectedItem?.hsnCode || "");
  }, [selectedItem?.itemId]);

  const handleUpdateGstMaster = () => {
    if (!selectedItem) return;
    const rate = parseFloat(editGstRate);
    if (!Number.isFinite(rate) || rate < 0) {
      toast.error("Enter a real, non-negative GST rate");
      return;
    }
    updateInventoryItem(selectedItem.itemId, city, { gstRate: rate, hsnCode: editHsnCode.trim() || undefined });
    toast.success(`GST master updated for ${selectedItem.itemName} — Purchase Orders for this item now map to ${rate}% / HSN ${editHsnCode.trim() || "—"}`);
  };

  const recentReceipts = stockTransactions
    .filter((t: any) => t.cityId === city && t.type === "Procurement")
    .sort((a: any, b: any) => new Date(b.completedAt || b.createdAt || 0).getTime() - new Date(a.completedAt || a.createdAt || 0).getTime())
    .slice(0, 8);

  const handleReceive = () => {
    if (!supplierName.trim()) {
      toast.error("Enter the supplier name");
      return;
    }
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      toast.error("Enter a real quantity received");
      return;
    }

    let targetItemId = itemId;
    let targetItemName = selectedItem?.itemName || "";

    if (mode === "new") {
      if (!newItemName.trim()) {
        toast.error("Enter the new item's name");
        return;
      }
      const alreadyExists = cityItems.some((i: any) => i.itemName.toLowerCase() === newItemName.trim().toLowerCase());
      if (alreadyExists) {
        toast.error(`"${newItemName.trim()}" already exists — switch to "Existing item" and select it instead`);
        return;
      }
      const created = addInventoryItem({
        itemName: newItemName.trim(),
        category: newCategory,
        unit: newUnit,
        reorderLevel: parseInt(newReorderLevel, 10) || 0,
        unitCost: parseFloat(newUnitCost) || 0,
        gstRate: parseFloat(newGstRate) || 0,
        hsnCode: newHsnCode.trim() || undefined,
        centralStock: 0,
        branchStock: {},
        supervisorStock: {},
        washerStock: {},
      } as any, city);
      targetItemId = created.itemId;
      targetItemName = created.itemName;
    } else if (!itemId) {
      toast.error("Select an item");
      return;
    } else if (!existingItemRate || parseFloat(existingItemRate) <= 0) {
      toast.error("Enter this delivery's real rate — needed for accurate FIFO stock costing");
      return;
    }

    const realRate = mode === "existing" ? parseFloat(existingItemRate) : parseFloat(newUnitCost) || 0;
    procureInventory(targetItemId, qty, supplierName.trim(), city, realRate);
    toast.success(`Received ${qty} ${targetItemName} from ${supplierName.trim()} — real central stock updated`);
    setQuantity("");
    setExistingItemRate("");
    setNewItemName("");
    setNewUnitCost("");
    if (mode === "new") setItemId(targetItemId);
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-blue-600" /> Receive Stock (General Procurement)
        </h1>
        <p className="text-sm text-gray-500">Real receipt entry at Kim (Main Store) — for any item, not just uniforms</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === "existing" ? "default" : "outline"} size="sm" onClick={() => setMode("existing")}>Existing Item</Button>
            <Button variant={mode === "new" ? "default" : "outline"} size="sm" onClick={() => setMode("new")}>New Item</Button>
          </div>

          {mode === "existing" ? (
            <div className="space-y-3">
              <div>
                <Label>Item</Label>
                <Select value={itemId} onValueChange={setItemId}>
                  <SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger>
                  <SelectContent>
                    {cityItems.map((i: any) => (
                      <SelectItem key={i.itemId} value={i.itemId}>
                        {i.itemName} ({i.category}) — on hand: {i.centralStock ?? 0}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedItem && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current real central stock: <strong>{selectedItem.centralStock ?? 0} {selectedItem.unit}</strong>
                    {selectedItem.unitCost ? <> · last recorded rate: <strong>₹{selectedItem.unitCost}</strong></> : null}
                  </p>
                )}
              </div>
              {selectedItem && (
                <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
                  <Label className="text-xs text-gray-500">Item-Master GST (real source Purchase Orders map this item's tax rate from)</Label>
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div>
                      <Label className="text-xs">GST Rate (%)</Label>
                      <Input type="number" min="0" step="0.01" value={editGstRate} onChange={(e) => setEditGstRate(e.target.value)} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs">HSN Code</Label>
                      <Input value={editHsnCode} onChange={(e) => setEditHsnCode(e.target.value)} className="h-8" placeholder="e.g. 3402" />
                    </div>
                    <Button size="sm" variant="outline" onClick={handleUpdateGstMaster}>Update</Button>
                  </div>
                </div>
              )}
              {/* ✅ FIX: real rate capture for existing items — previously
                  this flow never asked for a rate at all, meaning every
                  re-procurement of an existing item had no real FIFO batch
                  cost recorded. Defaults to blank so the person actively
                  confirms this delivery's real price, rather than silently
                  assuming it matches last time. */}
              <div>
                <Label>This Delivery's Rate (per {selectedItem?.unit || "unit"}) *</Label>
                <Input
                  type="number" min="0" step="0.01"
                  value={existingItemRate}
                  onChange={(e) => setExistingItemRate(e.target.value)}
                  placeholder={selectedItem?.unitCost ? String(selectedItem.unitCost) : "0.00"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Real, this-delivery price — kept as its own FIFO batch, not blended into one average.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
              <div>
                <Label>New Item Name</Label>
                <Input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Dashboard Polish 1L" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={newCategory} onValueChange={(v) => setNewCategory(v as typeof CATEGORIES[number])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={newUnit} onValueChange={(v) => setNewUnit(v as typeof UNITS[number])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Reorder Level</Label>
                  <Input type="number" min="0" value={newReorderLevel} onChange={(e) => setNewReorderLevel(e.target.value)} />
                </div>
                <div>
                  <Label>Unit Cost (₹, optional)</Label>
                  <Input type="number" min="0" value={newUnitCost} onChange={(e) => setNewUnitCost(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>GST Rate (%)</Label>
                  <Input type="number" min="0" step="0.01" value={newGstRate} onChange={(e) => setNewGstRate(e.target.value)} />
                </div>
                <div>
                  <Label>HSN Code</Label>
                  <Input value={newHsnCode} onChange={(e) => setNewHsnCode(e.target.value)} placeholder="e.g. 3402" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Real item-master GST — every future Purchase Order for this item maps its tax rate from here, instead of being re-typed each time.</p>
            </div>
          )}

          <div>
            <Label>Supplier</Label>
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Supplier name" />
          </div>

          <div>
            <Label>Quantity Received</Label>
            <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
          </div>

          <Button onClick={handleReceive} className="w-full">Record Receipt</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-gray-600" /> Recent Receipts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentReceipts.length === 0 ? (
            <p className="text-sm text-gray-400">No receipts recorded yet for this city.</p>
          ) : (
            recentReceipts.map((t: any) => {
              const item = inventory.find((i: any) => i.itemId === t.itemId);
              return (
                <div key={t.transactionId} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                  <span className="text-gray-900">{item?.itemName || t.itemId}</span>
                  <span className="text-gray-500">+{t.quantity} {item?.unit || ""}</span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GeneralProcurement;
