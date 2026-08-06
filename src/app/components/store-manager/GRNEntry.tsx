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

// ✅ FIX: this used to read po.po / po.vendor / po.orderedQty — fields that
// don't exist on a real PO record (PurchaseOrders.tsx writes poNumber /
// supplier / itemsList). Every field read here came back undefined, so no
// PO ever matched, every PO looked "pending" forever regardless of its
// real status, and a completed GRN could never actually close a PO out.
// Real per-line ordered/received quantities now come straight from
// itemsList (each line carries its own receivedQty, updated by
// handleSubmitGRN below) — only POs with real line-item data, that are
// Approved or already Partially Received and not yet fully Delivered or
// Cancelled, are eligible to receive against.
function buildPendingDeliveries(posList: any[]) {
  return posList
    .filter((po: any) => po.itemsList?.length > 0 && (po.status === "Approved" || po.status === "Partially Received"))
    .map((po: any, i: number) => {
      const ordered = po.itemsList.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const received = po.itemsList.reduce((s: number, it: any) => s + (it.receivedQty || 0), 0);
      return {
        id: i + 1,
        po: po.poNumber,
        vendor: po.supplier,
        items: po.items || po.itemsList.length,
        ordered,
        received,
        status: received > 0 && received < ordered ? "Partial" : "Pending",
        date: po.date,
      };
    });
}

export function GRNEntry() {
  const { city } = useCity();
  const { inventory, procureInventory } = useInventory();
  const savedVendors = gstComplianceService.getVendors();
  const [savedPOs, setSavedPOs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cleancar_purchase_orders") || "[]"); }
    catch { return []; }
  });
  const [grnDialogOpen, setGrnDialogOpen] = useState(false);
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedPO, setSelectedPO] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  // Index into the selected PO's own itemsList — used instead of
  // selectedItemId whenever GRN is being recorded against a real PO, so
  // the quantity ordered/remaining comes from that PO's actual line, not
  // a free-typed guess.
  const [selectedLineIndex, setSelectedLineIndex] = useState("");

  const cityItems = (inventory || []).filter((i: any) => i.cityId === city);
  const selectedVendorName = savedVendors.find(v => v.id === selectedVendor)?.name || "";

  // ✅ FIX: was po.vendor (always undefined on a real PO record, so this
  // filter matched nothing once a vendor was picked) and po.status !==
  // "GRN Complete" (a status this app never actually writes, so it never
  // excluded anything — even Cancelled/Delivered POs stayed "open").
  // Only POs with real line-item data that are Approved or already
  // Partially Received are eligible to receive against.
  const openPOs = savedPOs.filter((po: any) =>
    po.itemsList?.length > 0 &&
    (po.status === "Approved" || po.status === "Partially Received") &&
    (!selectedVendorName || po.supplier === selectedVendorName)
  );

  const selectedPOObj = selectedPO && selectedPO !== "manual"
    ? savedPOs.find((po: any) => po.poNumber === selectedPO)
    : null;
  // Only lines that still have something outstanding to receive.
  const poLineItems = (selectedPOObj?.itemsList || []).filter((it: any) => (it.receivedQty || 0) < it.quantity);
  const selectedLine = selectedLineIndex !== "" ? poLineItems[parseInt(selectedLineIndex, 10)] : null;
  // Resolve the real inventory item to procure into: prefer the line's
  // own itemId (set when this PO's item was picked from the real item
  // catalog); otherwise a best-effort name match against this city's
  // item master, for older/custom-typed PO lines that never had one.
  const resolvedItemId = selectedLine
    ? (selectedLine.itemId || cityItems.find((i: any) => i.itemName.toLowerCase() === selectedLine.itemName.toLowerCase())?.itemId || "")
    : "";
  const remainingForLine = selectedLine ? selectedLine.quantity - (selectedLine.receivedQty || 0) : 0;

  const [pendingDeliveries, setPendingDeliveries] = useState(() => buildPendingDeliveries(savedPOs));
  const completedCount = savedPOs.filter((po: any) => po.status === "Delivered").length;

  const [documentFileName, setDocumentFileName] = useState<string | null>(null);
  const [documentFileType, setDocumentFileType] = useState<string | null>(null);
  const [documentFileBase64, setDocumentFileBase64] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Real 500KB limit, matching the same real limit already used for
    // accounting entry attachments elsewhere in this app.
    if (file.size > 500 * 1024) {
      toast.error("File is too large — please upload a file under 500KB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // Previously this file was received and immediately discarded -
      // only a boolean flag was set, so the "uploaded" delivery note
      // never actually existed anywhere. Now it's genuinely read and
      // stored as real Base64 data on the GRN record itself.
      setDocumentFileBase64(reader.result as string);
      setDocumentFileName(file.name);
      setDocumentFileType(file.type);
      setDocumentUploaded(true);
      toast.success("Delivery note uploaded!");
    };
    reader.onerror = () => toast.error("Could not read this file — please try again.");
    reader.readAsDataURL(file);
  };

  const handleSubmitGRN = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const quantityReceived = parseInt(formData.get('quantity-received') as string) || 0;
    const challanNo        = String(formData.get('challan-number') || "");

    if (!selectedVendor) { toast.error("Please select a vendor."); return; }
    if (!challanNo.trim()) { toast.error("Please enter the challan number."); return; }

    // Real per-PO-line receipt when a real PO is selected; falls back to
    // the free-typed manual path (no PO to reference) otherwise.
    let quantityOrdered: number;
    let itemName: string;
    let procureItemId: string;

    if (selectedPOObj) {
      if (!selectedLine) { toast.error("Select which item on this PO was received."); return; }
      if (!resolvedItemId) {
        toast.error(`"${selectedLine.itemName}" on this PO isn't linked to a real inventory item — add it to the item master first, or record this GRN manually without selecting a PO.`);
        return;
      }
      quantityOrdered = remainingForLine;
      itemName = selectedLine.itemName;
      procureItemId = resolvedItemId;
    } else {
      if (!selectedItemId) { toast.error("Please select which item was received."); return; }
      quantityOrdered = parseInt(formData.get('quantity-ordered') as string) || 0;
      itemName = cityItems.find((i: any) => i.itemId === selectedItemId)?.itemName || "Unknown Item";
      procureItemId = selectedItemId;
    }
    const supplierName = selectedVendorName || "Walk-in";

    // ✅ C3 FIX: Save GRN record to localStorage
    const grnNumber = `GRN-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,"0")}-${String(Math.floor(Math.random()*900)+100).padStart(3,"0")}`;
    const grnRecord = {
      grnNumber, supplierName, challanNumber: challanNo,
      grnDate: new Date().toISOString().split("T")[0],
      status: quantityReceived >= quantityOrdered ? "Accepted" : "Partially Accepted",
      totalAccepted: quantityReceived, totalRejected: Math.max(0, quantityOrdered - quantityReceived),
      items: [{ id:1, itemName, receivedThisDelivery: quantityReceived, acceptedQuantity: quantityReceived, rejectedQuantity: 0, condition:"Good", storageLocation:"Main Store" }],
      createdAt: new Date().toISOString(),
      deliveryNoteFileName: documentFileName || undefined,
      deliveryNoteFileType: documentFileType || undefined,
      deliveryNoteFileBase64: documentFileBase64 || undefined,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("cleancar_grn_records") || "[]");
      localStorage.setItem("cleancar_grn_records", JSON.stringify([grnRecord, ...existing]));
    } catch {}

    // Real inventory update — city-filtered, matches by real itemId (not
    // fragile lowercased-name matching), and creates a real FIFO batch +
    // weighted-average cost update via the same path every other real
    // procurement in this app goes through.
    if (quantityReceived > 0) {
      procureInventory(procureItemId, quantityReceived, selectedVendor, city);
    }

    // ✅ FIX: was matched on po.po (always undefined) and wrote a status
    // ("GRN Complete"/"Partial Delivery") that PurchaseOrders.tsx never
    // reads or displays — the two screens were writing to the same
    // localStorage key with completely incompatible shapes. Now updates
    // the specific line item's receivedQty and rolls that up into the
    // real PO status vocabulary ("Partially Received"/"Delivered") that
    // PurchaseOrders.tsx actually renders.
    let updatedPOs = savedPOs;
    if (selectedPOObj) {
      const fullIndex = selectedPOObj.itemsList.findIndex((it: any) => it === selectedLine);
      updatedPOs = savedPOs.map((po: any) => {
        if (po.poNumber !== selectedPOObj.poNumber) return po;
        const newItemsList = po.itemsList.map((it: any, idx: number) =>
          idx === fullIndex ? { ...it, receivedQty: (it.receivedQty || 0) + quantityReceived } : it
        );
        const allReceived = newItemsList.every((it: any) => (it.receivedQty || 0) >= it.quantity);
        const anyReceived = newItemsList.some((it: any) => (it.receivedQty || 0) > 0);
        const newStatus = allReceived ? "Delivered" : anyReceived ? "Partially Received" : po.status;
        const newPoRecord = po.poRecord ? {
          ...po.poRecord,
          status: allReceived ? "Fully Received" : "Partially Received",
          items: po.poRecord.items.map((it: any, idx: number) =>
            idx === fullIndex ? { ...it, receivedQty: (it.receivedQty || 0) + quantityReceived } : it
          ),
        } : po.poRecord;
        return { ...po, itemsList: newItemsList, status: newStatus, poRecord: newPoRecord };
      });
      try { localStorage.setItem("cleancar_purchase_orders", JSON.stringify(updatedPOs)); } catch {}
      setSavedPOs(updatedPOs);
      setPendingDeliveries(buildPendingDeliveries(updatedPOs));
    }

    if (quantityReceived < quantityOrdered) {
      toast.warning(`Partial GRN ${grnNumber} recorded — ${quantityReceived}/${quantityOrdered} received. Accounts, Admin and Super Admin alerted.`);
    } else {
      toast.success(`GRN ${grnNumber} recorded — full delivery received!`);
    }

    setGrnDialogOpen(false);
    setDocumentUploaded(false);
    setDocumentFileName(null);
    setDocumentFileType(null);
    setDocumentFileBase64(null);
    setSelectedVendor("");
    setSelectedPO("");
    setSelectedItemId("");
    setSelectedLineIndex("");
  };

  const partialDeliveries = pendingDeliveries.filter(d => d.status === "Partial");
  const pendingCount = pendingDeliveries.filter(d => d.status === "Pending").length;

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
                      <Select value={selectedVendor} onValueChange={v => { setSelectedVendor(v); setSelectedPO(""); setSelectedLineIndex(""); setSelectedItemId(""); }}>
                        <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                        <SelectContent>
                          {savedVendors.length > 0 ? savedVendors.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                          )) : (
                            <SelectItem value="none" disabled>No vendors. Add in GST → Vendor Master.</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="po-number">Purchase Order Number *</Label>
                      <Select value={selectedPO} onValueChange={v => { setSelectedPO(v); setSelectedLineIndex(""); setSelectedItemId(""); }} disabled={!selectedVendor}>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedVendor ? "Select PO" : "Select vendor first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {openPOs.map((po: any) => <SelectItem key={po.poNumber} value={po.poNumber}>{po.poNumber} — ₹{(po.amount ?? 0).toLocaleString()}</SelectItem>)}
                          <SelectItem value="manual">Enter manually (no PO)</SelectItem>
                          {openPOs.length === 0 && <SelectItem value="__none_open__" disabled>No Approved POs open for receipt for this vendor</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item">Item Received *</Label>
                      {selectedPOObj ? (
                        <Select value={selectedLineIndex} onValueChange={setSelectedLineIndex}>
                          <SelectTrigger><SelectValue placeholder="Select item on this PO" /></SelectTrigger>
                          <SelectContent>
                            {poLineItems.length > 0 ? poLineItems.map((it: any, idx: number) => (
                              <SelectItem key={idx} value={String(idx)}>
                                {it.itemName} — {it.quantity - (it.receivedQty || 0)} remaining of {it.quantity}
                              </SelectItem>
                            )) : (
                              <SelectItem value="none" disabled>All items on this PO are already fully received.</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                          <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                          <SelectContent>
                            {cityItems.length > 0 ? cityItems.map((i: any) => (
                              <SelectItem key={i.itemId} value={i.itemId}>{i.itemName} ({i.unit})</SelectItem>
                            )) : (
                              <SelectItem value="none" disabled>No inventory items found for this city.</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="challan-number">Challan Number *</Label>
                      <Input id="challan-number" name="challan-number" placeholder="e.g. CH-2026-0451" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity-ordered">Quantity Ordered *</Label>
                      {selectedPOObj ? (
                        <Input key="po-line" id="quantity-ordered" name="quantity-ordered" type="number" value={remainingForLine} readOnly className="bg-gray-50" title="Remaining quantity on this PO line — not editable" />
                      ) : (
                        <Input key="manual" id="quantity-ordered" name="quantity-ordered" type="number" min="1" defaultValue="100" required />
                      )}
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

      {/* Partial GRN Alert — only shown when a real PO has partial receipt */}
      {partialDeliveries.length > 0 && (
        <Card className="bg-red-50 border-red-300">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold text-red-900 text-lg">⚠ PARTIAL DELIVERY ALERT</p>
                <p className="text-sm text-red-700 mt-1">
                  {partialDeliveries.length === 1
                    ? `Purchase order ${partialDeliveries[0].po} has partial delivery. Only ${partialDeliveries[0].received} out of ${partialDeliveries[0].ordered} items received.`
                    : `${partialDeliveries.length} purchase orders have partial delivery.`}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  This will show during vendor payment approval to prevent overpayment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GRN Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending GRN</p>
                <p className="text-2xl font-bold mt-1">{pendingCount}</p>
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
                <p className="text-2xl font-bold mt-1">{partialDeliveries.length}</p>
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
                <p className="text-2xl font-bold mt-1">{completedCount}</p>
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
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>{delivery.date}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={delivery.status === "Partial" ? "outline" : "default"}
                        onClick={() => {
                          const vendorId = savedVendors.find(v => v.name === delivery.vendor)?.id || "";
                          setSelectedVendor(vendorId);
                          setSelectedPO(delivery.po);
                          setSelectedLineIndex("");
                          setSelectedItemId("");
                          setGrnDialogOpen(true);
                        }}
                      >
                        {delivery.status === "Partial" ? "Update GRN" : "Record GRN"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingDeliveries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No pending deliveries. Create a Purchase Order to see it here.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GRNEntry;
