import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { AlertCircle, ShoppingCart, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { gstComplianceService } from "../../services/gstComplianceService";

export function PurchaseOrderCreation() {
  const savedVendors = gstComplianceService.getVendors();
  const [selectedVendor, setSelectedVendor] = useState("");
  const [poItems, setPoItems] = useState([
    { id: 1, product: "", quantity: 0, unit: "", price: 0 }
  ]);

  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    const stored = localStorage.getItem("cleancar_purchase_orders");
    return stored ? JSON.parse(stored) : [];
  });

  const addItem = () => {
    setPoItems([...poItems, { id: Date.now(), product: "", quantity: 0, unit: "", price: 0 }]);
  };

  const removeItem = (id: number) => {
    setPoItems(poItems.filter(item => item.id !== id));
  };

  const handleSubmitPO = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newPO = {
      id: Date.now(),
      po: `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3,"0")}`,
      vendor: savedVendors.find(v => v.id === selectedVendor)?.legalName || selectedVendor,
      items: poItems.length,
      amount: poItems.reduce((s, i) => s + i.price * i.quantity, 0),
      status: "Pending Procurement Review",
      date: new Date().toISOString().split("T")[0],
    };
    const updated = [...purchaseOrders, newPO];
    setPurchaseOrders(updated);
    localStorage.setItem("cleancar_purchase_orders", JSON.stringify(updated));
    toast.success("Purchase Order created successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Order Creation</h1>
          <p className="text-sm text-gray-500 mt-1">Create purchase orders for inventory replenishment</p>
        </div>
        <Link to="/store-manager">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Workflow Info */}
      <Card className="bg-blue-50 border-blue-300">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Purchase Order Workflow</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-700">
                <Badge variant="outline" className="bg-white">Store Manager</Badge>
                <span>→</span>
                <Badge variant="outline" className="bg-white">Procurement Manager</Badge>
                <span>→</span>
                <Badge variant="outline" className="bg-white">Admin/Super Admin</Badge>
                <span>→</span>
                <Badge variant="outline" className="bg-white">Vendor (Email/WhatsApp)</Badge>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Note: Store Manager cannot send PO directly to vendor. Requires Procurement Manager and Admin approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create PO Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create New Purchase Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPO} className="space-y-6">
            {/* Vendor Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Select Vendor *</Label>
                <Select name="vendor" required value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose vendor from list" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedVendors.length > 0 ? savedVendors.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.legalName} {v.gstin?"("+v.gstin+")":""}</SelectItem>
                    )) : (
                      <SelectItem value="none" disabled>No vendors. Add in GST → Vendor Master.</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Vendor not in list? <Link to="/store-manager/vendor-request" className="text-blue-600 hover:underline">Request to Purchase Team</Link>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-date">Expected Delivery Date *</Label>
                <Input id="delivery-date" name="delivery-date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-location">Delivery Location</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse-1">Main Warehouse</SelectItem>
                    <SelectItem value="395005">395005 — Adajan Service Zone</SelectItem>
                    <SelectItem value="395006">395006 — Vesu Service Zone</SelectItem>
                    <SelectItem value="395009">395009 — Jahangirpura Service Zone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select name="priority">
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
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

            {/* Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Purchase Order Items *</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {poItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-4 space-y-2">
                    <Input placeholder="Product name" required />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Input type="number" min="1" placeholder="Qty" required />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Select required>
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="ltr">Liters</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Input type="number" min="0" step="0.01" placeholder="Price per unit" required />
                  </div>
                  <div className="col-span-1">
                    {poItems.length > 1 && (
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Special Instructions</Label>
              <Textarea 
                id="notes" 
                name="notes"
                placeholder="Any special requirements or notes for the vendor..." 
                rows={3}
              />
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <Label htmlFor="payment-terms">Payment Terms</Label>
              <Select name="payment-terms">
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">Advance Payment</SelectItem>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                  <SelectItem value="net30">Net 30 Days</SelectItem>
                  <SelectItem value="net60">Net 60 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Create PO & Send to Purchase Manager
              </Button>
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Purchase Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchase Orders History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.po}</TableCell>
                    <TableCell>{po.vendor}</TableCell>
                    <TableCell>{po.items} items</TableCell>
                    <TableCell>₹{po.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        po.status === "Sent to Vendor" ? "secondary" :
                        po.status === "Pending Admin Approval" ? "default" : "outline"
                      }>
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{po.date}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">View Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}