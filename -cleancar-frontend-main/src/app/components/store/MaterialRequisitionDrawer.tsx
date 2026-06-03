import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Textarea } from "../ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MaterialRequisitionDrawerProps {
  open: boolean;
  onClose: () => void;
  prefilledItem?: any;
}

export function MaterialRequisitionDrawer({ open, onClose, prefilledItem }: MaterialRequisitionDrawerProps) {
  const [urgency, setUrgency] = useState("Routine");
  const [requiredByDate, setRequiredByDate] = useState("");
  const [items, setItems] = useState(
    prefilledItem
      ? [
          {
            id: 1,
            itemType: "Material",
            itemName: prefilledItem.itemName,
            quantityRequired: prefilledItem.deficit || 0,
            currentStock: prefilledItem.currentStock,
            reason: `Reorder alert - stock at ${prefilledItem.currentStock} ${prefilledItem.unit}`,
          },
        ]
      : [{ id: 1, itemType: "Material", itemName: "", quantityRequired: 0, currentStock: 0, reason: "" }]
  );

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now(), itemType: "Material", itemName: "", quantityRequired: 0, currentStock: 0, reason: "" },
    ]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = () => {
    // Validate
    if (!requiredByDate) {
      toast.error("Please select Required By Date");
      return;
    }

    if (items.some((item) => !item.itemName || item.quantityRequired <= 0)) {
      toast.error("Please fill all item details");
      return;
    }

    // Generate MR number
    const mrNumber = `MR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(
      Math.floor(Math.random() * 1000)
    ).padStart(3, "0")}`;

    toast.success("Material Requisition created successfully", {
      description: `${mrNumber} submitted for approval. Items: ${items.length}`,
    });

    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Raise Material Requisition</SheetTitle>
          <SheetDescription>Request materials for central store replenishment</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Header Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Routine">Routine</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Required By Date</Label>
              <Input type="date" value={requiredByDate} onChange={(e) => setRequiredByDate(e.target.value)} />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Item Type</Label>
                    <Select value={item.itemType} onValueChange={(val) => updateItem(item.id, "itemType", val)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Material">Material</SelectItem>
                        <SelectItem value="Consumable">Consumable</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Item Name</Label>
                    <Select value={item.itemName} onValueChange={(val) => updateItem(item.id, "itemName", val)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select item..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Car Wash Shampoo 5L">Car Wash Shampoo 5L</SelectItem>
                        <SelectItem value="Microfiber Towel Premium">Microfiber Towel Premium</SelectItem>
                        <SelectItem value="Wheel Cleaner 1L">Wheel Cleaner 1L</SelectItem>
                        <SelectItem value="Foam Gun">Foam Gun</SelectItem>
                        <SelectItem value="Safety Gloves">Safety Gloves</SelectItem>
                        <SelectItem value="Wax Coating 1L">Wax Coating 1L</SelectItem>
                        <SelectItem value="Interior Cleaner 5L">Interior Cleaner 5L</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Quantity Required</Label>
                    <Input
                      type="number"
                      className="text-sm"
                      value={item.quantityRequired}
                      onChange={(e) => updateItem(item.id, "quantityRequired", parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Current Stock</Label>
                    <Input
                      type="number"
                      className="text-sm bg-gray-100"
                      value={item.currentStock}
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label className="text-xs">Reason for this Item</Label>
                    <Input
                      className="text-sm"
                      placeholder="Optional"
                      value={item.reason}
                      onChange={(e) => updateItem(item.id, "reason", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Submit Requisition
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
