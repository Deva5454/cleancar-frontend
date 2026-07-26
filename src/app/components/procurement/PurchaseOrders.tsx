import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, Trash2, ShoppingCart, Download } from "lucide-react";
import { toast } from "sonner";
// ✅ NEW: real vendor master (already exists, was just never wired into this
// screen — previously a 4-item hardcoded suppliers array with no
// GSTIN/address/PAN captured anywhere).
import { gstComplianceService, COMPANY_GST_CONFIG } from "../../services/gstComplianceService";
import { calculateGST } from "../../services/accountingEntryService";
import { snapshotCurrentTerms } from "../../services/poTermsTemplateService";
import { downloadPurchaseOrderPDF } from "./PurchaseOrderPDF";
import type { PurchaseOrder } from "../../lib/materialRequisition";

interface PurchaseOrdersProps {
  prefillFromMR?: { mrRef?: string; items?: any[]; urgency?: string } | null;
  onPrefillConsumed?: () => void;
}

const PO_SEED = [
  { poNumber:"PO-2026-0245", supplier:"ChemClean Industries", amount:125000, status:"Pending Approval", date:"Mar 17, 2026", items:5, createdAt:"2026-03-17T09:00:00Z" },
  { poNumber:"PO-2026-0244", supplier:"AutoCare Solutions",   amount:68500,  status:"Approved",         date:"Mar 16, 2026", items:3, createdAt:"2026-03-16T10:00:00Z" },
  { poNumber:"PO-2026-0243", supplier:"ProWash Equipment",    amount:52000,  status:"Delivered",        date:"Mar 15, 2026", items:2, createdAt:"2026-03-15T11:00:00Z" },
  { poNumber:"PO-2026-0242", supplier:"ChemClean Industries", amount:95000,  status:"In Transit",       date:"Mar 14, 2026", items:7, createdAt:"2026-03-14T08:00:00Z" },
  { poNumber:"PO-2026-0241", supplier:"CarCare Supplies",     amount:42000,  status:"Approved",         date:"Mar 13, 2026", items:4, createdAt:"2026-03-13T09:00:00Z" },
];

function loadPOs(): any[] {
  try {
    const stored = localStorage.getItem("cleancar_purchase_orders");
    const parsed = stored ? JSON.parse(stored) : [];
    if (parsed.length === 0) {
      localStorage.setItem("cleancar_purchase_orders", JSON.stringify(PO_SEED));
      return PO_SEED;
    }
    return parsed;
  } catch { return PO_SEED; }
}

// ✅ FIX: real sequential PO numbering, replacing `PO-${year}-${random4digit}`
// — a random number could collide or look inconsistent. Mirrors the same
// safe "max existing sequence + 1" pattern already used correctly by the
// real accounting engine's generateVoucherNumber(), rather than a simple
// count (which breaks if a PO is ever deleted).
function getFinancialYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${String(year).slice(-2)}${String(year + 1).slice(-2)}`;
}

function generatePONumber(existing: any[]): string {
  const fy = getFinancialYear();
  const prefix = `CCW-PO${fy}`;
  const maxSeq = existing
    .map((po) => po.poNumber || "")
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10) || 0)
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
}

export function PurchaseOrders({ prefillFromMR, onPrefillConsumed }: PurchaseOrdersProps = {}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPODialog, setShowPODialog] = useState(false);
  const [viewPO, setViewPO] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("central");
  const [poItems, setPOItems] = useState([
    { id: 1, itemName: "", quantity: 0, unit: "Pieces", rate: 0, amount: 0, hsnCode: "", gstRate: 18, discountPct: 0 }
  ]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>(loadPOs);

  // Open dialog pre-filled when navigated from MR Convert to PO
  useEffect(() => {
    if (prefillFromMR) {
      const items = (prefillFromMR.items ?? []).map((item: any, i: number) => ({
        id: i + 1,
        itemName: item.itemName ?? item.name ?? "",
        quantity: item.qtyRequired ?? item.quantity ?? 0,
        unit: item.unit ?? "Pieces",
        rate: 0,
        amount: 0,
      }));
      if (items.length > 0) setPOItems(items);
      setShowPODialog(true);
      onPrefillConsumed?.();
    }
  }, [prefillFromMR]);

  // ✅ FIX: previously a hardcoded 4-item array with no real address/GSTIN/
  // PAN — now pulls from the real Vendor Master (gstComplianceService),
  // the same one the Suppliers tab already manages.
  const vendors = gstComplianceService.getVendors();

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
    if (!selectedSupplier) { toast.error("Select a supplier"); return; }
    const vendor = vendors.find(v => v.id === selectedSupplier);
    if (!vendor) { toast.error("Selected supplier could not be found in the Vendor Master."); return; }

    const poNumber = generatePONumber(purchaseOrders);
    const validItems = poItems.filter(i => i.itemName && i.quantity > 0);
    if (validItems.length === 0) { toast.error("Add at least one item with a quantity."); return; }

    // ✅ FIX: real per-item GST, computed the same way the accounting
    // engine computes it everywhere else in this app — not a flat,
    // uncomputed `gst` total.
    const cityIdForGst = deliveryLocation === "branch1" ? "CITY-MUMBAI" : deliveryLocation === "branch2" ? "CITY-AHMEDABAD" : "CITY-SURAT";
    const realItems = validItems.map((item) => {
      const discountAmt = item.amount * ((item.discountPct || 0) / 100);
      const taxableValue = Math.round((item.amount - discountAmt) * 100) / 100;
      const gst = calculateGST(taxableValue, item.gstRate || 18, vendor.stateCode, "B2B", cityIdForGst);
      return {
        itemName: item.itemName, quantity: item.quantity, unit: item.unit, rate: item.rate, amount: item.amount,
        hsnCode: item.hsnCode, gstRate: item.gstRate, discountPct: item.discountPct,
        taxableValue, cgst: gst.cgst, sgst: gst.sgst, igst: gst.igst,
        netAmount: Math.round((taxableValue + gst.cgst + gst.sgst + gst.igst) * 100) / 100,
      };
    });
    const totalTaxable = realItems.reduce((s, i) => s + i.taxableValue, 0);
    const cgstTotal = realItems.reduce((s, i) => s + i.cgst, 0);
    const sgstTotal = realItems.reduce((s, i) => s + i.sgst, 0);
    const igstTotal = realItems.reduce((s, i) => s + i.igst, 0);
    const grandTotal = Math.round((totalTaxable + cgstTotal + sgstTotal + igstTotal) * 100) / 100;

    // ✅ FIX: the real, editable terms template is snapshotted into this PO
    // right now — not referenced live. See poTermsTemplateService.ts.
    const termsSnapshot = snapshotCurrentTerms();

    // ✅ FIX: real delivery address, matching whichever location was
    // actually selected on the form — previously this was captured in
    // local state but never stored on the PO record, so the PDF always
    // fell back to a fixed default string no matter what was selected.
    const DELIVERY_ADDRESSES: Record<string, string> = {
      central: "Central Store, Vesu, Surat, Gujarat",
      branch1: "Branch Store, Mumbai, Maharashtra",
      branch2: "Branch Store, Ahmedabad, Gujarat",
    };
    const deliveryAddress = DELIVERY_ADDRESSES[deliveryLocation] || DELIVERY_ADDRESSES.central;

    const poRecord: PurchaseOrder = {
      poNumber, vendorId: vendor.id, vendorName: vendor.name,
      vendorGstin: vendor.gstin, vendorPan: vendor.pan, vendorAddress: vendor.address,
      vendorStateCode: vendor.stateCode, vendorContactName: vendor.contactPerson,
      vendorContactPhone: vendor.contactPhone, vendorContactEmail: vendor.contactEmail,
      dateIssued: new Date(poDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).split("/").join("-"),
      expectedDelivery: deliveryDate ? new Date(deliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).split("/").join("-") : "—",
      deliveryAddress,
      status: "Issued",
      items: realItems,
      totalAmount: validItems.reduce((s, i) => s + i.amount, 0),
      gst: Math.round((cgstTotal + sgstTotal + igstTotal) * 100) / 100,
      cgstTotal, sgstTotal, igstTotal, grandTotal,
      approvedBy: "",
      termsSnapshot,
    };

    const newPO = {
      poNumber, supplier: vendor.name,
      amount: grandTotal,
      status: "Pending Approval",
      date: new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }),
      items: validItems.length,
      itemsList: validItems,
      createdAt: new Date().toISOString(),
      poRecord,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("cleancar_purchase_orders") || "[]");
      localStorage.setItem("cleancar_purchase_orders", JSON.stringify([newPO, ...existing]));
    } catch {}
    setPurchaseOrders(prev => [newPO, ...prev]);
    toast.success(`${poNumber} created and sent for approval`);
    setShowPODialog(false);
    setSelectedSupplier("");
    setDeliveryDate("");
    setPOItems([{ id: 1, itemName: "", quantity: 0, unit: "Pieces", rate: 0, amount: 0, hsnCode: "", gstRate: 18, discountPct: 0 }]);
  };

  const handleDownloadPDF = async (po: any) => {
    if (!po.poRecord) {
      toast.error("This PO was created before PDF generation was added and doesn't have the detail needed to print — this applies to new POs going forward.");
      return;
    }
    try {
      await downloadPurchaseOrderPDF({
        po: po.poRecord,
        deliveryAddress: po.poRecord.deliveryAddress,
        createdByName: "Store Manager",
        authorisedByName: "Owner",
      });
      toast.success(`${po.poNumber}.pdf downloaded`);
    } catch (e) {
      toast.error("Could not generate the PDF — please try again.");
    }
  };

  const handleAttachPODocument = (poNumber: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("File is too large — please upload a file under 500KB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const updated = purchaseOrders.map(p => p.poNumber === poNumber
        ? { ...p, attachmentFileName: file.name, attachmentFileType: file.type, attachmentFileBase64: reader.result as string }
        : p
      );
      setPurchaseOrders(updated);
      try { localStorage.setItem("cleancar_purchase_orders", JSON.stringify(updated)); } catch {}
      toast.success("Document attached to " + poNumber);
    };
    reader.onerror = () => toast.error("Could not read this file — please try again.");
    reader.readAsDataURL(file);
  };

  const handleApprovePO = (po: any) => {
    const updated = purchaseOrders.map(p => p.poNumber === po.poNumber ? { ...p, status: "Approved", approvedBy: "Procurement Manager", approvedAt: new Date().toISOString() } : p);
    setPurchaseOrders(updated);
    try { localStorage.setItem("cleancar_purchase_orders", JSON.stringify(updated)); } catch {}
    toast.success(`${po.poNumber} approved`);
  };

  const handleViewPO = (poNumber: string) => {
    const po = purchaseOrders.find(p => p.poNumber === poNumber);
    setViewPO(po ?? null);
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
            <p className="text-2xl font-bold text-orange-600">{purchaseOrders.filter(po => po.status === "Pending Approval").length}</p>
            <p className="text-xs text-gray-500">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{purchaseOrders.filter(po => po.status === "Approved").length}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{purchaseOrders.filter(po => po.status === "In Transit").length}</p>
            <p className="text-xs text-gray-500">In Transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{purchaseOrders.filter(po => po.status === "Delivered").length}</p>
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
                <div className="flex gap-2 items-center">
                  {po.status === "Pending Approval" && (
                    <Button size="sm" onClick={() => handleApprovePO(po)} className="bg-green-600 hover:bg-green-700">
                      Approve
                    </Button>
                  )}
                  {po.attachmentFileBase64 ? (
                    <a href={po.attachmentFileBase64} download={po.attachmentFileName} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline px-1">
                      View Copy
                    </a>
                  ) : (
                    <label className="text-xs text-gray-500 underline cursor-pointer px-1">
                      Attach Copy
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleAttachPODocument(po.poNumber, e)} />
                    </label>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleViewPO(po.poNumber)}>
                    <FileText className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(po)}>
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                </div>
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
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>PO Date *</Label>
                  <Input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Required By *</Label>
                  <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
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
                  <Select value={deliveryLocation} onValueChange={setDeliveryLocation}>
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
                        {/* ✅ NEW: HSN code, GST rate, and discount — needed for real GST computation and the PO PDF's tax breakup */}
                        <div className="col-span-4">
                          <Input
                            placeholder="HSN code"
                            value={item.hsnCode}
                            onChange={(e) => handleItemChange(item.id, "hsnCode", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="GST %"
                            value={item.gstRate ?? 18}
                            onChange={(e) => handleItemChange(item.id, "gstRate", parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="Disc %"
                            value={item.discountPct ?? 0}
                            onChange={(e) => handleItemChange(item.id, "discountPct", parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-2" />
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

      {/* ── VIEW PO DIALOG ── */}
      <Dialog open={!!viewPO} onOpenChange={o => { if (!o) setViewPO(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Purchase Order — {viewPO?.poNumber}</DialogTitle>
            <DialogDescription>{viewPO?.supplier} · {viewPO?.date}</DialogDescription>
          </DialogHeader>
          {viewPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4 text-sm">
                <div><p className="text-xs text-gray-400">Supplier</p><p className="font-medium">{viewPO.supplier}</p></div>
                <div><p className="text-xs text-gray-400">Status</p><Badge variant={getStatusColor(viewPO.status) as any}>{viewPO.status}</Badge></div>
                <div><p className="text-xs text-gray-400">Date</p><p>{viewPO.date}</p></div>
                <div><p className="text-xs text-gray-400">Items</p><p>{viewPO.items} line item{viewPO.items !== 1 ? "s" : ""}</p></div>
                {viewPO.approvedBy && <div className="col-span-2"><p className="text-xs text-gray-400">Approved By</p><p className="text-green-700 font-medium">{viewPO.approvedBy}</p></div>}
              </div>
              {viewPO.itemsList && viewPO.itemsList.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Line Items</p>
                  <table className="w-full text-xs border-collapse">
                    <thead><tr className="bg-gray-50"><th className="text-left px-2 py-1.5 border-b">Item</th><th className="text-right px-2 py-1.5 border-b">Qty</th><th className="text-right px-2 py-1.5 border-b">Rate</th><th className="text-right px-2 py-1.5 border-b">Amount</th></tr></thead>
                    <tbody className="divide-y">{viewPO.itemsList.map((item: any, i: number) => (
                      <tr key={i}><td className="px-2 py-1.5">{item.itemName}</td><td className="px-2 py-1.5 text-right">{item.quantity} {item.unit}</td><td className="px-2 py-1.5 text-right">₹{item.rate}</td><td className="px-2 py-1.5 text-right font-medium">₹{item.amount.toLocaleString()}</td></tr>
                    ))}</tbody>
                    <tfoot><tr className="border-t-2"><td className="px-2 py-1.5 font-bold" colSpan={3}>Total</td><td className="px-2 py-1.5 text-right font-bold">₹{viewPO.amount.toLocaleString()}</td></tr></tfoot>
                  </table>
                </div>
              )}
              {!viewPO.itemsList && <div className="text-center py-4 text-sm text-gray-400">No line item detail available</div>}
              <div className="flex items-center justify-between bg-gray-50 rounded px-4 py-3">
                <span className="font-medium text-sm">Total Amount</span>
                <span className="text-xl font-bold">₹{viewPO.amount.toLocaleString()}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPO(null)}>Close</Button>
            {viewPO?.status === "Pending Approval" && (
              <Button onClick={() => { handleApprovePO(viewPO); setViewPO(null); }} className="bg-green-600 hover:bg-green-700">Approve PO</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
