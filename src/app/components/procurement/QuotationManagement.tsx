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
import { Plus, FileText, CheckCircle, Clock, Trash2, Send, Users } from "lucide-react";
import { toast } from "sonner";

export function QuotationManagement() {
  const [showRFQDialog, setShowRFQDialog] = useState(false);
  const [rfqItems, setRFQItems] = useState([
    { id: 1, itemName: "", quantity: 0, unit: "Pieces", specifications: "" }
  ]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

  const rfqs = [
    { id: "RFQ-2026-008", item: "Car Wash Shampoo 5L", quantity: 100, status: "Pending Quotes", suppliers: 3, deadline: "Mar 20, 2026" },
    { id: "RFQ-2026-007", item: "Microfiber Towels", quantity: 200, status: "Quotes Received", suppliers: 4, deadline: "Mar 18, 2026", quotesReceived: 4 },
    { id: "RFQ-2026-006", item: "Foam Guns", quantity: 10, status: "Comparison Done", suppliers: 2, deadline: "Mar 15, 2026", quotesReceived: 2 },
  ];

  const suppliers = [
    { id: "SUP-001", name: "CleanPro Supplies Pvt Ltd", category: "Chemicals" },
    { id: "SUP-002", name: "AutoCare Enterprises", category: "Consumables" },
    { id: "SUP-003", name: "Karcher India Pvt Ltd", category: "Equipment" },
    { id: "SUP-004", name: "Eco Wash Solutions", category: "Chemicals" },
    { id: "SUP-005", name: "ProWash Equipment", category: "Equipment" },
  ];

  const handleCreateRFQ = () => {
    setShowRFQDialog(true);
  };

  const handleAddItem = () => {
    setRFQItems([...rfqItems, { id: Date.now(), itemName: "", quantity: 0, unit: "Pieces", specifications: "" }]);
  };

  const handleRemoveItem = (id: number) => {
    setRFQItems(rfqItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: number, field: string, value: any) => {
    setRFQItems(rfqItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const toggleSupplier = (supplierId: string) => {
    if (selectedSuppliers.includes(supplierId)) {
      setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplierId));
    } else {
      setSelectedSuppliers([...selectedSuppliers, supplierId]);
    }
  };

  const handleSubmitRFQ = () => {
    toast.success(`RFQ sent to ${selectedSuppliers.length} suppliers`);
    setShowRFQDialog(false);
    setRFQItems([{ id: 1, itemName: "", quantity: 0, unit: "Pieces", specifications: "" }]);
    setSelectedSuppliers([]);
  };

  const handleViewRFQ = (id: string) => {
    toast.info(`Opening ${id} details...`);
  };

  const handleCompareQuotes = (id: string) => {
    toast.info(`Opening quote comparison for ${id}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Quotation Management</h2>
          <p className="text-sm text-gray-500 mt-1">Request for Quotation (RFQ) workflow and supplier comparison</p>
        </div>
        <Button onClick={handleCreateRFQ}>
          <Plus className="w-4 h-4 mr-2" />
          Create RFQ
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">1</p>
            <p className="text-xs text-gray-500">Pending Quotes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">1</p>
            <p className="text-xs text-gray-500">Quotes Received</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">1</p>
            <p className="text-xs text-gray-500">Comparison Done</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{rfq.id}</p>
                    <Badge variant={rfq.status === "Pending Quotes" ? "destructive" : rfq.status === "Quotes Received" ? "default" : "outline"}>
                      {rfq.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{rfq.item} • Qty: {rfq.quantity}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{rfq.suppliers} suppliers invited</span>
                    {rfq.quotesReceived && <span>{rfq.quotesReceived} quotes received</span>}
                    <span>Deadline: {rfq.deadline}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {rfq.status === "Quotes Received" && (
                    <Button size="sm" variant="default" onClick={() => handleCompareQuotes(rfq.id)}>
                      Compare Quotes
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleViewRFQ(rfq.id)}>
                    <FileText className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create RFQ Dialog */}
      <Dialog open={showRFQDialog} onOpenChange={setShowRFQDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Request for Quotation (RFQ)</DialogTitle>
            <DialogDescription>
              Send RFQ to multiple suppliers to receive competitive quotes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">RFQ Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>RFQ Date *</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Quote Submission Deadline *</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chemicals">Chemicals</SelectItem>
                      <SelectItem value="consumables">Consumables</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="protective">Protective Gear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Items Required</h3>
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
                      <div className="col-span-2">Quantity</div>
                      <div className="col-span-1">Unit</div>
                      <div className="col-span-5">Specifications</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Items */}
                    {rfqItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-3">
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
                        <div className="col-span-1">
                          <Select value={item.unit} onValueChange={(value) => handleItemChange(item.id, "unit", value)}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pieces">Pcs</SelectItem>
                              <SelectItem value="Liters">L</SelectItem>
                              <SelectItem value="Kilograms">Kg</SelectItem>
                              <SelectItem value="Boxes">Box</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-5">
                          <Input
                            placeholder="Technical specs, brand, quality requirements..."
                            value={item.specifications}
                            onChange={(e) => handleItemChange(item.id, "specifications", e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-1">
                          {rfqItems.length > 1 && (
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

            {/* Supplier Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Select Suppliers ({selectedSuppliers.length} selected)
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedSuppliers(suppliers.map(s => s.id))}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedSuppliers([])}>
                    Clear All
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {suppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSuppliers.includes(supplier.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => toggleSupplier(supplier.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.includes(supplier.id)}
                          onChange={() => {}}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{supplier.name}</p>
                          <p className="text-xs text-gray-500">{supplier.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Terms & Conditions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net7">Net 7 Days</SelectItem>
                      <SelectItem value="net15">Net 15 Days</SelectItem>
                      <SelectItem value="net30">Net 30 Days</SelectItem>
                      <SelectItem value="advance">Advance Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quote Validity Period</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="45">45 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Special Instructions for Suppliers</Label>
                  <Textarea rows={3} placeholder="Add any special requirements, quality standards, delivery expectations, or other instructions..." />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRFQDialog(false)}>
              Cancel
            </Button>
            <Button variant="secondary">
              Save as Draft
            </Button>
            <Button onClick={handleSubmitRFQ} disabled={selectedSuppliers.length === 0}>
              <Send className="w-4 h-4 mr-2" />
              Send RFQ to {selectedSuppliers.length} Supplier{selectedSuppliers.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
