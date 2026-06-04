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
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export function PurchaseOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showPODialog, setShowPODialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [poItems, setPOItems] = useState([
    { id: 1, itemName: "", quantity: 0, unit: "Pieces", rate: 0, amount: 0 }
  ]);

  const purchaseOrders = [
    { poNumber: "PO-2026-0245", supplier: "ChemClean Industries", amount: 125000, status: "Pending Approval", date: "Mar 17, 2026", items: 5 },
    { poNumber: "PO-2026-0244", supplier: "AutoCare Solutions", amount: 68500, status: "Approved", date: "Mar 16, 2026", items: 3 },
    { poNumber: "PO-2026-0243", supplier: "ProWash Equipment", amount: 52000, status: "Delivered", date: "Mar 15, 2026", items: 2 },
    { poNumber: "PO-2026-0242", supplier: "ChemClean Industries", amount: 95000, status: "In Transit", date: "Mar 14, 2026", items: 7 },
    { poNumber: "PO-2026-0241", supplier: "CarCare Supplies", amount: 42000, status: "Approved", date: "Mar 13, 2026", items: 4 },
  ];

  const suppliers = [
    { id: "SUP-001", name: "CleanPro Supplies Pvt Ltd" },
    { id: "SUP-002", name: "AutoCare Enterprises" },
    { id: "SUP-003", name: "Karcher India Pvt Ltd" },
    { id: "SUP-004", name: "Eco Wash Solutions" },
  ];

  const filteredOrders = purchaseOrders.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePO = () => {
    setShowPODialog(true);
  };

  const handleAddItem = () => {
    setPOItems([...poItems, { id: Date.now(), itemName: "", quantity: 0, unit: "Pieces", rate: 0, amount: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    setPOItems(poItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: number, field: string, value: any) => {
    setPOItems(poItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmitPO = () => {
    toast.success("Purchase Order created and sent for approval");
    setShowPODialog(false);
    setSelectedSupplier("");
    setPOItems([{ id: 1, itemName: "", quantity: 0, unit: "Pieces", rate: 0, amount: 0 }]);
  };

  const handleViewPO = (poNumber: string) => {
    toast.info(`Opening ${poNumber} details...`);
  };

  const totalAmount = poItems.reduce((sum, item) => sum + item.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending Approval": return "destructive";
      case "Approved": return "default";
      case "In Transit": return "secondary";
      case "Delivered": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending Approval": return <Clock className="w-4 h-4" />;
      case "Approved": return <CheckCircle className="w-4 h-4" />;
      case "Delivered": return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Purchase Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Create, approve, and manage purchase orders</p>
        </div>
        <Button onClick={handleCreatePO}>
          <Plus className="w-4 h-4 mr-2" />
          Create PO
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by PO number or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">1</p>
            <p className="text-xs text-gray-500">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">2</p>
            <p className="text-xs text-gray-500">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">1</p>
            <p className="text-xs text-gray-500">In Transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">1</p>
            <p className="text-xs text-gray-500">Delivered</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.map((po) => (
              <div key={po.poNumber} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4 flex-1">
                  {getStatusIcon(po.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{po.poNumber}</p>
                      <Badge variant={getStatusColor(po.status)}>{po.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{po.supplier}</span>
                      <span>•</span>
                      <span>{po.items} items</span>
                      <span>•</span>
                      <span>{po.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{po.amount.toLocaleString()}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleViewPO(po.poNumber)}>
                  <FileText className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create PO Dialog */}
      <Dialog open={showPODialog} onOpenChange={setShowPODialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order for material procurement from suppliers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Basic Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>PO Date *</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Required By *</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms *</Label>
                  <Select defaultValue="net30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net7">Net 7 Days</SelectItem>
                      <SelectItem value="net15">Net 15 Days</SelectItem>
                      <SelectItem value="net30">Net 30 Days</SelectItem>
                      <SelectItem value="advance50">50% Advance, 50% on Delivery</SelectItem>
                      <SelectItem value="advance100">100% Advance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Delivery Location *</Label>
                  <Select defaultValue="central">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="central">Central Store - Surat</SelectItem>
                      <SelectItem value="branch1">Branch Store - Mumbai</SelectItem>
                      <SelectItem value="branch2">Branch Store - Ahmedabad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Items</h3>
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
                      <div className="col-span-4">Item Name / Description</div>
                      <div className="col-span-2">Quantity</div>
                      <div className="col-span-2">Unit</div>
                      <div className="col-span-2">Rate (₹)</div>
                      <div className="col-span-2">Amount (₹)</div>
                    </div>

                    {/* Items */}
                    {poItems.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-4">
                          <Input
                            placeholder="Enter item name"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(item.id, "itemName", e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.quantity || ""}
                            onChange={(e) => handleItemChange(item.id, "quantity", parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-2">
                          <Select value={item.unit} onValueChange={(value) => handleItemChange(item.id, "unit", value)}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pieces">Pieces</SelectItem>
                              <SelectItem value="Liters">Liters</SelectItem>
                              <SelectItem value="Kilograms">Kilograms</SelectItem>
                              <SelectItem value="Boxes">Boxes</SelectItem>
                              <SelectItem value="Sets">Sets</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={item.rate || ""}
                            onChange={(e) => handleItemChange(item.id, "rate", parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            value={item.amount.toFixed(2)}
                            readOnly
                            className="h-9 bg-gray-50"
                          />
                        </div>
                        <div className="col-span-1">
                          {poItems.length > 1 && (
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

                    {/* Total */}
                    <div className="grid grid-cols-12 gap-2 pt-3 border-t">
                      <div className="col-span-10 text-right font-semibold">
                        Total Amount:
                      </div>
                      <div className="col-span-2 font-bold text-lg">
                        ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Additional Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Freight Terms</Label>
                  <Select defaultValue="supplier">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Supplier Pays Freight</SelectItem>
                      <SelectItem value="buyer">Buyer Pays Freight</SelectItem>
                      <SelectItem value="included">Freight Included in Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input placeholder="Requisition or Quote reference" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Special Instructions</Label>
                  <Textarea rows={2} placeholder="Add any special delivery instructions, quality requirements, or other notes for the supplier..." />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Internal Notes (Not visible to supplier)</Label>
                  <Textarea rows={2} placeholder="Add internal notes about this PO..." />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPODialog(false)}>
              Cancel
            </Button>
            <Button variant="secondary">
              Save as Draft
            </Button>
            <Button onClick={handleSubmitPO}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Create PO & Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
