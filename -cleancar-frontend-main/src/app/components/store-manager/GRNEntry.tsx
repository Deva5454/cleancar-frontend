import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import { AlertCircle, Upload, CheckCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { gstComplianceService } from "../../services/gstComplianceService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";

export function GRNEntry() {
  const { city } = useCity();
  const savedVendors = gstComplianceService.getVendors();
  const savedPOs = JSON.parse(localStorage.getItem("cleancar_purchase_orders") || "[]");
  const [grnDialogOpen, setGrnDialogOpen] = useState(false);
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedPO, setSelectedPO] = useState("");

  // Derive vendors from SupplierMaster (or stockTransactions for now)
  const vendors = [
    { id: "V001", name: "Shreeji Chemicals" },
    { id: "V002", name: "Rajkot Equipment Traders" },
    { id: "V003", name: "Mumbai Wash Supplies" },
  ]; // → Replace with supplierMasterService.getSuppliers(city) when available

  const openPOs = [
    { id: "PO-2026-001", vendor: "V001", description: "Chemicals supply — March" },
    { id: "PO-2026-002", vendor: "V001", description: "Equipment parts" },
  ].filter(po => !selectedVendor || po.vendor === selectedVendor);

  const [pendingDeliveries, setPendingDeliveries] = useState(() => {
    return savedPOs.length > 0
      ? savedPOs.filter((po: any) => po.status !== "GRN Complete").map((po: any, i: number) => ({
          id: i + 1,
          po: po.po,
          vendor: po.vendor,
          items: po.items || 0,
          ordered: po.amount || 0,
          received: 0,
          status: "Pending",
          date: po.date,
        }))
      : [
          { id: 1, po: "PO-2026-001", vendor: "ABC Supplies", items: 15, ordered: 150, received: 0, status: "Pending", date: "2026-03-01" },
          { id: 2, po: "PO-2026-002", vendor: "XYZ Services", items: 8, ordered: 80, received: 50, status: "Partial", date: "2026-03-05" },
        ];
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentUploaded(true);
      toast.success("Delivery note uploaded!");
    }
  };

  const handleSubmitGRN = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const quantityReceived = parseInt(formData.get('quantity-received') as string);
    const quantityOrdered = parseInt(formData.get('quantity-ordered') as string);

    if (quantityReceived < quantityOrdered) {
      toast.warning("Partial GRN recorded - Alert sent to Accounts, Admin, and Super Admin!");
    } else {
      toast.success("GRN recorded successfully - Full delivery received!");
    }

    setGrnDialogOpen(false);
    setDocumentUploaded(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GRN Entry (Goods Receipt Note)</h1>
          <p className="text-sm text-gray-500 mt-1">Record received goods and verify quantities</p>
        </div>
        <div className="flex gap-2">
          <Link to="/store-manager">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
          <Dialog open={grnDialogOpen} onOpenChange={setGrnDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Package className="w-4 h-4 mr-2" />
                Record GRN
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record Goods Receipt Note (GRN)</DialogTitle>
                <DialogDescription>
                  Enter details of received goods. System will alert if quantity is less than ordered.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitGRN}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendor">Vendor Name *</Label>
                      <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                        <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                        <SelectContent>
                          {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="po-number">Purchase Order Number *</Label>
                      <Select value={selectedPO} onValueChange={setSelectedPO} disabled={!selectedVendor}>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedVendor ? "Select PO" : "Select vendor first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {openPOs.map(po => <SelectItem key={po.id} value={po.id}>{po.id} — {po.description}</SelectItem>)}
                          <SelectItem value="manual">Enter manually (no PO)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity-ordered">Quantity Ordered *</Label>
                      <Input id="quantity-ordered" name="quantity-ordered" type="number" min="1" defaultValue="100" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity-received">Quantity Received *</Label>
                      <Input id="quantity-received" name="quantity-received" type="number" min="0" placeholder="Enter received quantity" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery-date">Delivery Date *</Label>
                      <Input id="delivery-date" name="delivery-date" type="date" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery-person">Delivery Person</Label>
                      <Input id="delivery-person" name="delivery-person" placeholder="Name of delivery person" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery-note">Delivery Note / Remarks</Label>
                    <Textarea id="delivery-note" name="delivery-note" placeholder="Any remarks about the delivery..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receipt">Upload Receipt / Delivery Note *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        id="receipt"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        required
                      />
                      <label htmlFor="receipt" className="cursor-pointer flex flex-col items-center">
                        {documentUploaded ? (
                          <>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <p className="text-sm text-green-600 mt-2">Document Uploaded</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400" />
                            <p className="text-sm text-gray-600 mt-2">Click to upload delivery note</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setGrnDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Record GRN</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Partial GRN Alert */}
      <Card className="bg-red-50 border-red-300">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 text-lg">⚠ PARTIAL DELIVERY ALERT</p>
              <p className="text-sm text-red-700 mt-1">
                1 purchase order has partial delivery. Only 50 out of 80 items received.
              </p>
              <p className="text-sm text-red-700 mt-1 font-medium">
                Notifications sent to: Accounts, Admin, Super Admin
              </p>
              <p className="text-xs text-red-600 mt-2">
                This alert will appear during vendor payment approval to prevent overpayment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRN Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending GRN</p>
                <p className="text-2xl font-bold mt-1">1</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Partial Deliveries</p>
                <p className="text-2xl font-bold mt-1">1</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold mt-1">1</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchase Orders - Delivery Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Quantity Ordered</TableHead>
                  <TableHead>Quantity Received</TableHead>
                  <TableHead>GRN Status</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">{delivery.po}</TableCell>
                    <TableCell>{delivery.vendor}</TableCell>
                    <TableCell>{delivery.items} items</TableCell>
                    <TableCell>{delivery.ordered}</TableCell>
                    <TableCell>{delivery.received}</TableCell>
                    <TableCell>
                      {delivery.status === "Partial" ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="destructive">Partial</Badge>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                      ) : delivery.status === "Complete" ? (
                        <Badge variant="secondary">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>{delivery.date}</TableCell>
                    <TableCell>
                      {delivery.status === "Pending" && (
                        <Button size="sm" onClick={() => setGrnDialogOpen(true)}>
                          Record GRN
                        </Button>
                      )}
                      {delivery.status === "Partial" && (
                        <Button size="sm" variant="outline">
                          Update GRN
                        </Button>
                      )}
                      {delivery.status === "Complete" && (
                        <Button size="sm" variant="ghost">
                          View Details
                        </Button>
                      )}
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
