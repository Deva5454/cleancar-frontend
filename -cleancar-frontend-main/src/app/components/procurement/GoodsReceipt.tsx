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
import { Plus, Package, CheckCircle, AlertTriangle, Camera } from "lucide-react";
import { toast } from "sonner";

export function GoodsReceipt() {
  const [showGRNDialog, setShowGRNDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState("");

  const grns = [
    { grnNumber: "GRN-2026-012", poNumber: "PO-2026-0245", supplier: "ChemClean Industries", items: 5, status: "Pending QC", date: "Mar 17, 2026" },
    { grnNumber: "GRN-2026-011", poNumber: "PO-2026-0243", supplier: "ProWash Equipment", items: 2, status: "Completed", date: "Mar 15, 2026", batchesCreated: 2 },
    { grnNumber: "GRN-2026-010", poNumber: "PO-2026-0242", supplier: "ChemClean Industries", items: 7, status: "Completed", date: "Mar 14, 2026", batchesCreated: 7 },
  ];

  const pendingPOs = [
    { poNumber: "PO-2026-0245", supplier: "ChemClean Industries", items: 5 },
    { poNumber: "PO-2026-0246", supplier: "AutoCare Solutions", items: 3 },
    { poNumber: "PO-2026-0247", supplier: "Karcher India Pvt Ltd", items: 2 },
  ];

  const handleCreateGRN = () => {
    setShowGRNDialog(true);
  };

  const handleSubmitGRN = () => {
    toast.success("GRN created successfully");
    setShowGRNDialog(false);
    setSelectedPO("");
  };

  const handleViewGRN = (grnNumber: string) => {
    toast.info(`Opening ${grnNumber} details...`);
  };

  const handleQualityCheck = (grnNumber: string) => {
    toast.info(`Opening quality check for ${grnNumber}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Goods Receipt Notes (GRN)</h2>
          <p className="text-sm text-gray-500 mt-1">Record incoming deliveries with quality checks and batch creation</p>
        </div>
        <Button onClick={handleCreateGRN}>
          <Plus className="w-4 h-4 mr-2" />
          Create GRN
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">1</p>
            <p className="text-xs text-gray-500">Pending QC</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">2</p>
            <p className="text-xs text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">9</p>
            <p className="text-xs text-gray-500">Batches Created</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent GRNs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {grns.map((grn) => (
              <div key={grn.grnNumber} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{grn.grnNumber}</p>
                      <Badge variant={grn.status === "Pending QC" ? "destructive" : "outline"}>
                        {grn.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{grn.supplier}</span>
                      <span>•</span>
                      <span>PO: {grn.poNumber}</span>
                      <span>•</span>
                      <span>{grn.items} items</span>
                      <span>•</span>
                      <span>{grn.date}</span>
                    </div>
                    {grn.batchesCreated && (
                      <p className="text-xs text-green-600 mt-1">✓ {grn.batchesCreated} batches created</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {grn.status === "Pending QC" && (
                    <Button size="sm" variant="default" onClick={() => handleQualityCheck(grn.grnNumber)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Quality Check
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleViewGRN(grn.grnNumber)}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create GRN Dialog */}
      <Dialog open={showGRNDialog} onOpenChange={setShowGRNDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Goods Receipt Note (GRN)</DialogTitle>
            <DialogDescription>
              Record incoming delivery against a Purchase Order with quality verification
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* PO Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Purchase Order Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Select Purchase Order *</Label>
                  <Select value={selectedPO} onValueChange={setSelectedPO}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PO" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingPOs.map((po) => (
                        <SelectItem key={po.poNumber} value={po.poNumber}>
                          {po.poNumber} - {po.supplier} ({po.items} items)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>GRN Date *</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Challan Number</Label>
                  <Input placeholder="Enter challan number" />
                </div>
                <div className="space-y-2">
                  <Label>Transporter Name</Label>
                  <Input placeholder="Enter transporter name" />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Number</Label>
                  <Input placeholder="GJ-XX-XXXX-XXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Input placeholder="Supplier invoice number" />
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Item Receipt Details</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-500 pb-2 border-b">
                      <div>Item Name</div>
                      <div>Ordered Qty</div>
                      <div>Received Qty</div>
                      <div>Quality Status</div>
                      <div>Batch/Serial</div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 items-center">
                      <div className="text-sm">Car Wash Shampoo 5L</div>
                      <div className="text-sm text-gray-600">100 Liters</div>
                      <div>
                        <Input type="number" defaultValue="100" className="h-8" />
                      </div>
                      <div>
                        <Select defaultValue="ok">
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ok">OK - Accept</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="shortfall">Shortfall</SelectItem>
                            <SelectItem value="reject">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Input placeholder="Batch/Serial" className="h-8" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quality Check */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Quality Verification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Overall Quality Status *</Label>
                  <Select defaultValue="approved">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved - All Items OK</SelectItem>
                      <SelectItem value="partial">Partial Acceptance</SelectItem>
                      <SelectItem value="rejected">Rejected - Return to Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Verified By *</Label>
                  <Input placeholder="Enter name" defaultValue="Store Manager" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Quality Remarks</Label>
                  <Textarea rows={3} placeholder="Add any quality observations or remarks..." />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Delivery Photos (Optional)
              </h3>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to capture or upload photos of delivered items</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Add Photos
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea rows={2} placeholder="Add any additional notes about this delivery..." />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowGRNDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitGRN}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Create GRN & Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
