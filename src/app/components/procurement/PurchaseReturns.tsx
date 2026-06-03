import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, TrendingDown, CheckCircle, Truck, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function PurchaseReturns() {
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState("");
  const [returnItems, setReturnItems] = useState([
    { id: 1, itemName: "", receivedQty: 0, returnQty: 0, reason: "", condition: "" }
  ]);

  const returns = [
    { returnNumber: "RET-2026-003", grnNumber: "GRN-2026-012", supplier: "ChemClean Industries", items: 2, reason: "Damaged in Transit", status: "Pending Pickup", date: "Mar 17, 2026", amount: 8500 },
    { returnNumber: "RET-2026-002", grnNumber: "GRN-2026-010", supplier: "ChemClean Industries", items: 1, reason: "Wrong Item Delivered", status: "Picked Up", date: "Mar 15, 2026", amount: 12000 },
    { returnNumber: "RET-2026-001", grnNumber: "GRN-2026-008", supplier: "AutoCare Solutions", items: 3, reason: "Quality Issue", status: "Debit Note Issued", date: "Mar 12, 2026", amount: 15000 },
  ];

  const recentGRNs = [
    { grnNumber: "GRN-2026-012", supplier: "ChemClean Industries", date: "Mar 17, 2026", items: 5 },
    { grnNumber: "GRN-2026-011", supplier: "ProWash Equipment", date: "Mar 15, 2026", items: 2 },
    { grnNumber: "GRN-2026-010", supplier: "ChemClean Industries", date: "Mar 14, 2026", items: 7 },
  ];

  const handleCreateReturn = () => {
    setShowReturnDialog(true);
  };

  const handleAddItem = () => {
    setReturnItems([...returnItems, { id: Date.now(), itemName: "", receivedQty: 0, returnQty: 0, reason: "", condition: "" }]);
  };

  const handleRemoveItem = (id: number) => {
    setReturnItems(returnItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: number, field: string, value: any) => {
    setReturnItems(returnItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmitReturn = () => {
    toast.success("Purchase return created successfully");
    setShowReturnDialog(false);
    setSelectedGRN("");
    setReturnItems([{ id: 1, itemName: "", receivedQty: 0, returnQty: 0, reason: "", condition: "" }]);
  };

  const handleViewReturn = (returnNumber: string) => {
    toast.info(`Opening ${returnNumber} details...`);
  };

  const handleIssueDebitNote = (returnNumber: string) => {
    toast.success(`Debit note issued for ${returnNumber}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Purchase Returns</h2>
          <p className="text-sm text-gray-500 mt-1">Handle rejected or defective items returned to suppliers with debit notes</p>
        </div>
        <Button onClick={handleCreateReturn}>
          <Plus className="w-4 h-4 mr-2" />
          Create Return
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">1</p>
            <p className="text-xs text-gray-500">Pending Pickup</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">1</p>
            <p className="text-xs text-gray-500">Picked Up</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">1</p>
            <p className="text-xs text-gray-500">Debit Note Issued</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">₹35.5K</p>
            <p className="text-xs text-gray-500">Total Value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {returns.map((ret) => (
              <div key={ret.returnNumber} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{ret.returnNumber}</p>
                      <Badge variant={
                        ret.status === "Pending Pickup" ? "destructive" :
                        ret.status === "Picked Up" ? "default" :
                        "outline"
                      }>
                        {ret.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{ret.supplier}</span>
                      <span>•</span>
                      <span>GRN: {ret.grnNumber}</span>
                      <span>•</span>
                      <span>{ret.items} items</span>
                      <span>•</span>
                      <span>{ret.date}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Reason: {ret.reason}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-bold text-lg text-red-600">₹{ret.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {ret.status === "Picked Up" && (
                    <Button size="sm" variant="default" onClick={() => handleIssueDebitNote(ret.returnNumber)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Issue DN
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleViewReturn(ret.returnNumber)}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Return</DialogTitle>
            <DialogDescription>
              Create return documentation for rejected or defective items to be sent back to supplier
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Return Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Select GRN *</Label>
                  <Select value={selectedGRN} onValueChange={setSelectedGRN}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select GRN" />
                    </SelectTrigger>
                    <SelectContent>
                      {recentGRNs.map((grn) => (
                        <SelectItem key={grn.grnNumber} value={grn.grnNumber}>
                          {grn.grnNumber} - {grn.supplier} ({grn.items} items)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Return Date *</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Return Type *</Label>
                  <Select defaultValue="full">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Return - Entire GRN</SelectItem>
                      <SelectItem value="partial">Partial Return - Selected Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primary Reason *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damaged">Damaged in Transit</SelectItem>
                      <SelectItem value="defective">Defective Items</SelectItem>
                      <SelectItem value="wrong">Wrong Item Delivered</SelectItem>
                      <SelectItem value="quality">Quality Issue</SelectItem>
                      <SelectItem value="expired">Expired/Near Expiry</SelectItem>
                      <SelectItem value="excess">Excess Quantity</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expected Pickup Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Supplier Notification Status</Label>
                  <Select defaultValue="pending">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Not Yet Notified</SelectItem>
                      <SelectItem value="notified">Supplier Notified</SelectItem>
                      <SelectItem value="acknowledged">Supplier Acknowledged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Items to Return */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Items to Return</h3>
                <Button size="sm" variant="outline" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-2 border-b">
                      <div className="col-span-3">Item Name</div>
                      <div className="col-span-1">Received</div>
                      <div className="col-span-1">Return Qty</div>
                      <div className="col-span-3">Reason</div>
                      <div className="col-span-3">Condition</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Items */}
                    {returnItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-3">
                          <Input
                            placeholder="Enter item name"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(item.id, "itemName", e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.receivedQty || ""}
                            onChange={(e) => handleItemChange(item.id, "receivedQty", parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.returnQty || ""}
                            onChange={(e) => handleItemChange(item.id, "returnQty", parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-3">
                          <Select value={item.reason} onValueChange={(value) => handleItemChange(item.id, "reason", value)}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="damaged">Damaged</SelectItem>
                              <SelectItem value="defective">Defective</SelectItem>
                              <SelectItem value="wrong">Wrong Item</SelectItem>
                              <SelectItem value="quality">Quality Issue</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Physical condition details"
                            value={item.condition}
                            onChange={(e) => handleItemChange(item.id, "condition", e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-1">
                          {returnItems.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-9 w-9 p-0"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documentation */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Documentation & Evidence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Quality Inspection Report</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Inspection Completed</SelectItem>
                      <SelectItem value="pending">Pending Inspection</SelectItem>
                      <SelectItem value="na">Not Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Debit Note Required</Label>
                  <Select defaultValue="yes">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes - Issue Debit Note</SelectItem>
                      <SelectItem value="no">No - Credit Adjustment Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Photos */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Defect/Damage Photos
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Upload photos showing defects, damage, or wrong items</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Upload Photos
                  </Button>
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-2">
                <Label>Detailed Description of Issues *</Label>
                <Textarea rows={3} placeholder="Provide detailed explanation of defects, damage, or issues that led to this return..." />
              </div>
            </div>

            {/* Logistics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Return Logistics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Pickup Arrangement</Label>
                  <Select defaultValue="supplier">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Supplier Arranges Pickup</SelectItem>
                      <SelectItem value="buyer">We Will Ship to Supplier</SelectItem>
                      <SelectItem value="pending">To Be Decided</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Return Freight Cost</Label>
                  <Select defaultValue="supplier">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Supplier Bears Cost</SelectItem>
                      <SelectItem value="buyer">We Bear Cost</SelectItem>
                      <SelectItem value="shared">Shared Cost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Return Shipping Address</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select address" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier1">Supplier Warehouse - Mumbai</SelectItem>
                      <SelectItem value="supplier2">Supplier Factory - Surat</SelectItem>
                      <SelectItem value="custom">Custom Address</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="space-y-2">
              <Label>Internal Notes (Not visible to supplier)</Label>
              <Textarea rows={2} placeholder="Add any internal notes about this return..." />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              Cancel
            </Button>
            <Button variant="secondary">
              Save as Draft
            </Button>
            <Button onClick={handleSubmitReturn}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Create Return & Notify Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
