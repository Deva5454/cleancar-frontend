import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Calendar, Camera } from "lucide-react";
import { toast } from "sonner";
import { logger } from "../../services/logger";

interface GRNCreationDialogProps {
  open: boolean;
  onClose: () => void;
  linkedPO?: any;
}

export function GRNCreationDialog({ open, onClose, linkedPO }: GRNCreationDialogProps) {
  const [grnDate, setGrnDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    logger.log("GRNCreationDialog - open:", open, "linkedPO:", linkedPO);
  }, [open, linkedPO]);
  const [challanNumber, setChallanNumber] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [deliveryPerson, setDeliveryPerson] = useState("");

  const [items, setItems] = useState(
    linkedPO
      ? [
          {
            id: 1,
            itemName: "Car Wash Shampoo 5L",
            poQuantity: 100,
            previouslyReceived: 0,
            receivedThisDelivery: 100,
            condition: "Good",
            acceptedQuantity: 100,
            rejectedQuantity: 0,
            storageLocation: "Main Store Shelf 1",
          },
          {
            id: 2,
            itemName: "Microfiber Towel Premium",
            poQuantity: 200,
            previouslyReceived: 0,
            receivedThisDelivery: 200,
            condition: "Good",
            acceptedQuantity: 200,
            rejectedQuantity: 0,
            storageLocation: "Main Store Shelf 2",
          },
        ]
      : []
  );

  const handleConditionChange = (id: number, condition: string) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          // If condition is not "Good", might have rejections
          const accepted = condition === "Good" ? item.receivedThisDelivery : Math.floor(item.receivedThisDelivery * 0.9);
          return {
            ...item,
            condition,
            acceptedQuantity: accepted,
            rejectedQuantity: item.receivedThisDelivery - accepted,
          };
        }
        return item;
      })
    );
  };

  const handleSubmit = () => {
    if (!challanNumber) {
      toast.error("Please enter Delivery Challan Number");
      return;
    }

    const grnNumber = `GRN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(
      Math.floor(Math.random() * 1000)
    ).padStart(3, "0")}`;

    const totalAccepted = items.reduce((sum, item) => sum + item.acceptedQuantity, 0);
    const totalRejected = items.reduce((sum, item) => sum + item.rejectedQuantity, 0);
    const batchesCreated = items.filter((item) => item.acceptedQuantity > 0).length;

    toast.success("GRN created successfully", {
      description: `${grnNumber} — ${totalAccepted} units accepted, ${totalRejected} rejected. ${batchesCreated} batches created.`,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      logger.log("Dialog onOpenChange:", isOpen);
      if (!isOpen) {
        onClose();
      }
    }}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Goods Receipt Note (GRN)</DialogTitle>
          <DialogDescription>
            {linkedPO ? `Linked to ${linkedPO.poNumber} — ${linkedPO.supplierName}` : "Create new GRN"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
            <div className="space-y-2">
              <Label className="text-xs">GRN Date</Label>
              <Input type="date" value={grnDate} onChange={(e) => setGrnDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Delivery Challan Number *</Label>
              <Input value={challanNumber} onChange={(e) => setChallanNumber(e.target.value)} placeholder="DC-2026-XXX" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Supplier</Label>
              <Input value={linkedPO?.supplierName || ""} disabled className="bg-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Delivery Person</Label>
              <Input value={deliveryPerson} onChange={(e) => setDeliveryPerson(e.target.value)} placeholder="Optional" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Vehicle Number</Label>
              <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="GJ-XX-XXXX" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Received By</Label>
              <Input value="Suresh Bhai (Store Manager)" disabled className="bg-white" />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <h3 className="font-medium">Receipt Items</h3>

            {items.map((item) => (
              <div key={item.id} className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-xs text-gray-500">
                      PO Qty: {item.poQuantity} | Previously Received: {item.previouslyReceived}
                    </p>
                  </div>
                  <Badge variant={item.condition === "Good" ? "default" : "destructive"}>{item.condition}</Badge>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Qty Received</Label>
                    <Input
                      type="number"
                      className="font-medium"
                      value={item.receivedThisDelivery}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setItems(
                          items.map((i) =>
                            i.id === item.id
                              ? { ...i, receivedThisDelivery: val, acceptedQuantity: val, rejectedQuantity: 0 }
                              : i
                          )
                        );
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Condition</Label>
                    <Select value={item.condition} onValueChange={(val) => handleConditionChange(item.id, val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Damaged">Damaged</SelectItem>
                        <SelectItem value="Short Expiry">Short Expiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Accepted Qty</Label>
                    <Input type="number" className="font-medium text-green-600" value={item.acceptedQuantity} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Rejected Qty</Label>
                    <Input
                      type="number"
                      className="font-medium text-red-600"
                      value={item.rejectedQuantity}
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Storage Location</Label>
                    <Input value={item.storageLocation} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, storageLocation: e.target.value} : i))} />
                  </div>
                </div>

                {/* Batch Details */}
                {item.acceptedQuantity > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                    <p className="text-xs font-medium text-blue-900">Batch Details</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-blue-900">Batch Number</Label>
                        <Input
                          className="text-xs"
                          value={`BATCH-${item.itemName.substring(0, 4).toUpperCase()}-${grnDate.replace(/-/g, "")}-001`}
                          readOnly
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-blue-900">Mfg Date</Label>
                        <Input type="date" className="text-xs" defaultValue={grnDate} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-blue-900">Expiry Date</Label>
                        <Input type="date" className="text-xs" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo Capture */}
                <Button variant="outline" size="sm" className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  {item.condition !== "Good" ? "Add Photos (Required)" : "Add Photos (Optional)"}
                </Button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="font-medium mb-3">GRN Summary</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Items</p>
                <p className="font-bold text-lg">{items.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Units Received</p>
                <p className="font-bold text-lg">{items.reduce((sum, i) => sum + i.receivedThisDelivery, 0)}</p>
              </div>
              <div>
                <p className="text-gray-600">Units Accepted</p>
                <p className="font-bold text-lg text-green-600">{items.reduce((sum, i) => sum + i.acceptedQuantity, 0)}</p>
              </div>
              <div>
                <p className="text-gray-600">Units Rejected</p>
                <p className="font-bold text-lg text-red-600">{items.reduce((sum, i) => sum + i.rejectedQuantity, 0)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Save GRN
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
