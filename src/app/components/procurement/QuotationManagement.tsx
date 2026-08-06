import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Plus, FileText, CheckCircle, Clock, Trash2, Send, Users,
  Star, TrendingDown, Award, AlertTriangle, ReceiptText,
} from "lucide-react";
import { toast } from "sonner";
// ✅ NEW: real Vendor Master + real GST engine — previously this screen's
// supplier list was a 5-item hardcoded local array with no GSTIN/state
// code, so a quote could never carry real GST (no vendor state to
// determine CGST+SGST vs IGST), and a PO raised from a quote had no real
// vendor to link back to.
import { gstComplianceService } from "../../services/gstComplianceService";
import { calculateGST } from "../../services/accountingEntryService";
import { snapshotCurrentTerms } from "../../services/poTermsTemplateService";
import { useCity } from "../../contexts/CityContext";
import { useInventory } from "../../contexts/InventoryContext";
import type { PurchaseOrder } from "../../lib/materialRequisition";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SupplierQuote {
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  // Taxable value only (unitPrice × RFQ quantity) — the historic meaning of
  // this field in the seed data (never included tax). Real GST is now
  // carried separately below rather than folded in silently.
  totalAmount: number;
  deliveryDays: number;
  paymentTerms: string;
  validUntil: string;
  notes?: string;
  rating: number;
  recommended?: boolean;
  // ✅ NEW: real tax on the quote itself — previously a quotation never
  // mentioned tax at all. Computed via the same calculateGST() every real
  // PO in this app uses, from the real vendor's stateCode. Optional so
  // older seed quotes (which predate this) still render without
  // fabricating numbers for them.
  hsnCode?: string;
  gstRate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  grandTotal?: number;
}

interface RFQRecord {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  status: "Pending Quotes" | "Quotes Received" | "Comparison Done" | "PO Raised";
  suppliers: number;
  // ✅ NEW: which real vendors this RFQ actually went to — previously only
  // a count was kept, so there was no way to scope "Record Quote" to the
  // suppliers actually invited (and no way to re-derive it for older
  // seed RFQs, which fall back to "any real vendor").
  invitedSupplierIds?: string[];
  deadline: string;
  quotesReceived?: number;
  createdDate: string;
  category: string;
  specifications?: string;
  quotes?: SupplierQuote[];
  selectedQuote?: string;
}

// ── Seed RFQ data with full quote details ─────────────────────────────────────
const RFQ_SEED: RFQRecord[] = [
  {
    id: "RFQ-2026-008", item: "Car Wash Shampoo 5L", quantity: 100, unit: "Liters",
    status: "Pending Quotes", suppliers: 3, deadline: "Mar 20, 2026",
    createdDate: "Mar 12, 2026", category: "Chemicals",
    specifications: "pH neutral, biodegradable, foam-generating, minimum 5L pack",
    quotes: [],
  },
  {
    id: "RFQ-2026-007", item: "Microfiber Towels", quantity: 200, unit: "Pieces",
    status: "Quotes Received", suppliers: 4, deadline: "Mar 18, 2026", quotesReceived: 4,
    createdDate: "Mar 10, 2026", category: "Consumables",
    specifications: "300 GSM minimum, 40x40 cm, colour-coded (blue for body, yellow for glass)",
    quotes: [
      { supplierId:"SUP-001", supplierName:"CleanPro Supplies Pvt Ltd", unitPrice:42,  totalAmount:8400,  deliveryDays:5,  paymentTerms:"Net 30", validUntil:"Apr 18, 2026", rating:4.5, notes:"Bulk discount of 5% available on 500+ pcs" },
      { supplierId:"SUP-002", supplierName:"AutoCare Enterprises",      unitPrice:38,  totalAmount:7600,  deliveryDays:7,  paymentTerms:"Net 15", validUntil:"Apr 18, 2026", rating:4.2, recommended:true },
      { supplierId:"SUP-004", supplierName:"Eco Wash Solutions",        unitPrice:45,  totalAmount:9000,  deliveryDays:3,  paymentTerms:"Net 30", validUntil:"Apr 15, 2026", rating:3.8, notes:"Premium GSM 350, faster delivery" },
      { supplierId:"SUP-005", supplierName:"ProWash Equipment",         unitPrice:40,  totalAmount:8000,  deliveryDays:6,  paymentTerms:"Net 30", validUntil:"Apr 18, 2026", rating:4.0 },
    ],
  },
  {
    id: "RFQ-2026-006", item: "Foam Guns", quantity: 10, unit: "Pieces",
    status: "Comparison Done", suppliers: 2, deadline: "Mar 15, 2026", quotesReceived: 2,
    createdDate: "Mar 8, 2026", category: "Equipment",
    specifications: "Compatible with 1/4 inch quick connect, adjustable foam ratio",
    selectedQuote: "SUP-003",
    quotes: [
      { supplierId:"SUP-003", supplierName:"Karcher India Pvt Ltd",     unitPrice:1150, totalAmount:11500, deliveryDays:4, paymentTerms:"Net 45", validUntil:"Apr 15, 2026", rating:4.8, recommended:true, notes:"Original Karcher accessory, 1yr warranty" },
      { supplierId:"SUP-005", supplierName:"ProWash Equipment",         unitPrice:980,  totalAmount:9800,  deliveryDays:7, paymentTerms:"Net 30", validUntil:"Apr 12, 2026", rating:3.9, notes:"Compatible clone, 6 month warranty" },
    ],
  },
];

const loadRFQs = (): RFQRecord[] => {
  try {
    const stored = localStorage.getItem("cleancar_rfq_records");
    const parsed = stored ? JSON.parse(stored) : [];
    // Merge stored new RFQs with our seed (which has full quote data)
    const storedIds = new Set(parsed.map((r: any) => r.id));
    const merged = [
      ...parsed,
      ...RFQ_SEED.filter(r => !storedIds.has(r.id)),
    ];
    return merged;
  } catch { return RFQ_SEED; }
};

// ── Component ─────────────────────────────────────────────────────────────────
// Real delivery-location -> cityId mapping, matching PurchaseOrders.tsx —
// a PO raised from a quote defaults to Central Store delivery (no
// location picker in this compare-quotes flow yet).
const RFQ_DELIVERY_CITY = "CITY-SURAT";
const RFQ_DELIVERY_ADDRESS = "Central Store, Vesu, Surat, Gujarat";

export function QuotationManagement() {
  const { city } = useCity();
  const { inventory } = useInventory();
  const [rfqs, setRfqs]                   = useState<RFQRecord[]>(loadRFQs);
  const [showRFQDialog, setShowRFQDialog] = useState(false);
  const [viewRFQ, setViewRFQ]             = useState<RFQRecord | null>(null);
  const [compareRFQ, setCompareRFQ]       = useState<RFQRecord | null>(null);
  const [quoteRFQ, setQuoteRFQ]           = useState<RFQRecord | null>(null);

  // Create RFQ form state
  const [rfqItems, setRFQItems]           = useState([{ id:1, itemName:"", quantity:0, unit:"Pieces", specifications:"" }]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [rfqDeadline, setRfqDeadline]     = useState("");
  const [rfqCategory, setRfqCategory]     = useState("");

  // Record Quote form state
  const [quoteVendorId, setQuoteVendorId]         = useState("");
  const [quoteUnitPrice, setQuoteUnitPrice]       = useState("");
  const [quoteDeliveryDays, setQuoteDeliveryDays] = useState("");
  const [quotePaymentTerms, setQuotePaymentTerms] = useState("Net 30");
  const [quoteValidUntil, setQuoteValidUntil]     = useState("");
  const [quoteNotes, setQuoteNotes]               = useState("");
  const [quoteGstRate, setQuoteGstRate]           = useState("18");
  const [quoteHsnCode, setQuoteHsnCode]           = useState("");

  // ✅ FIX: was a 5-item hardcoded local array with no GSTIN/state code —
  // now the real Vendor Master, the same one PurchaseOrders.tsx already
  // uses. Needed for real per-vendor GST (CGST+SGST vs IGST depends on
  // the vendor's real state) and so a PO raised from a quote links to a
  // real vendor instead of a free-typed name string.
  const suppliers = gstComplianceService.getVendors();

  // Real item-master match for this RFQ — when the RFQ's item name is
  // already a real catalog item, its GST rate/HSN are mapped in
  // automatically on Record Quote, the same way PurchaseOrders.tsx maps
  // a catalog item's GST instead of leaving it free-typed per quote.
  const matchCatalogItem = (itemName: string) =>
    inventory.find((i: any) => i.cityId === RFQ_DELIVERY_CITY && i.itemName.toLowerCase() === itemName.toLowerCase());

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddItem = () =>
    setRFQItems([...rfqItems, { id:Date.now(), itemName:"", quantity:0, unit:"Pieces", specifications:"" }]);
  const handleRemoveItem = (id: number) =>
    setRFQItems(rfqItems.filter(i => i.id !== id));
  const handleItemChange = (id: number, field: string, value: any) =>
    setRFQItems(rfqItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  const toggleSupplier = (id: string) =>
    setSelectedSuppliers(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleSubmitRFQ = () => {
    if (selectedSuppliers.length === 0) { toast.error("Select at least one supplier"); return; }
    if (!rfqItems[0].itemName) { toast.error("Enter at least one item"); return; }
    const rfqId = `RFQ-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100)}`;
    const newRFQ: RFQRecord = {
      id: rfqId,
      item: rfqItems.map(i => i.itemName).filter(Boolean).join(", "),
      quantity: rfqItems[0].quantity,
      unit: rfqItems[0].unit,
      status: "Pending Quotes",
      suppliers: selectedSuppliers.length,
      invitedSupplierIds: selectedSuppliers,
      deadline: rfqDeadline || "TBD",
      createdDate: new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }),
      category: rfqCategory,
      specifications: rfqItems[0].specifications,
      quotes: [],
    };
    const updated = [newRFQ, ...rfqs];
    setRfqs(updated);
    try {
      const existing = JSON.parse(localStorage.getItem("cleancar_rfq_records") || "[]");
      localStorage.setItem("cleancar_rfq_records", JSON.stringify([newRFQ, ...existing]));
    } catch {}
    toast.success(`${rfqId} sent to ${selectedSuppliers.length} supplier${selectedSuppliers.length !== 1 ? "s" : ""}`);
    setShowRFQDialog(false);
    setRFQItems([{ id:1, itemName:"", quantity:0, unit:"Pieces", specifications:"" }]);
    setSelectedSuppliers([]);
  };

  // ✅ NEW: previously there was no way to actually record a quote a
  // supplier sent back — only hardcoded seed data ever had quotes at all,
  // so a real RFQ created in this screen could never move past "Pending
  // Quotes." Real vendor, real per-quote GST (computed from the vendor's
  // real state code, the same way every PO in this app computes it).
  const openRecordQuote = (rfq: RFQRecord) => {
    setQuoteRFQ(rfq);
    setQuoteVendorId("");
    setQuoteUnitPrice("");
    setQuoteDeliveryDays("");
    setQuotePaymentTerms("Net 30");
    setQuoteValidUntil("");
    setQuoteNotes("");
    const catalogItem = matchCatalogItem(rfq.item);
    setQuoteGstRate(catalogItem?.gstRate != null ? String(catalogItem.gstRate) : "18");
    setQuoteHsnCode(catalogItem?.hsnCode || "");
  };

  const handleSubmitQuote = () => {
    if (!quoteRFQ) return;
    if (!quoteVendorId) { toast.error("Select which supplier this quote is from"); return; }
    const vendor = suppliers.find(v => v.id === quoteVendorId);
    if (!vendor) { toast.error("Selected supplier could not be found in the Vendor Master."); return; }
    const unitPrice = parseFloat(quoteUnitPrice) || 0;
    if (unitPrice <= 0) { toast.error("Enter a unit price"); return; }
    if (!quoteValidUntil) { toast.error("Enter a validity date"); return; }

    // ✅ FIX: real GST, computed the same way every PO in this app
    // computes it — from the real vendor's state code, not fabricated or
    // silently omitted like every quote before this.
    const taxableValue = Math.round(unitPrice * quoteRFQ.quantity * 100) / 100;
    const gstRate = parseFloat(quoteGstRate) || 0;
    const gst = calculateGST(taxableValue, gstRate, vendor.stateCode, "B2B", RFQ_DELIVERY_CITY);
    const grandTotal = Math.round((taxableValue + gst.cgst + gst.sgst + gst.igst) * 100) / 100;

    const newQuote: SupplierQuote = {
      supplierId: vendor.id, supplierName: vendor.name,
      unitPrice, totalAmount: taxableValue,
      deliveryDays: parseInt(quoteDeliveryDays) || 0,
      paymentTerms: quotePaymentTerms,
      validUntil: new Date(quoteValidUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      notes: quoteNotes.trim() || undefined,
      // No real quote-rating mechanism exists yet — a flat, clearly
      // neutral default rather than inventing per-vendor praise.
      rating: 4.0,
      hsnCode: quoteHsnCode.trim() || undefined,
      gstRate, cgst: gst.cgst, sgst: gst.sgst, igst: gst.igst, grandTotal,
    };

    const updated = rfqs.map(r => {
      if (r.id !== quoteRFQ.id) return r;
      const quotes = [...(r.quotes || []), newQuote];
      return { ...r, quotes, quotesReceived: quotes.length, status: "Quotes Received" as const };
    });
    setRfqs(updated);
    try { localStorage.setItem("cleancar_rfq_records", JSON.stringify(updated)); } catch {}
    toast.success(`Quote recorded from ${vendor.name} — ₹${grandTotal.toLocaleString("en-IN")} incl. GST`);
    setQuoteRFQ(null);
  };

  // ✅ FIX: previously built a completely different, ad-hoc PO shape —
  // random PO-YYYY-NNNN numbering (not the real CCW-PO{FY}{seq} scheme),
  // a free-typed supplier name string (no real vendorId), no itemsList,
  // no GST at all. That PO was a dead end: PurchaseOrders.tsx couldn't
  // show its GST breakup, it could never be cancelled (no real status
  // vocabulary), and GRNEntry.tsx couldn't receive against it (no
  // itemsList). Now builds the exact same real PO shape
  // PurchaseOrders.tsx's own handleSubmitPO produces, carrying the
  // quote's real GST straight through — a full citizen of the existing
  // PO cancel / GRN receipt / Accounts payable pipeline.
  const handleRaisePO = (rfq: RFQRecord, quote: SupplierQuote) => {
    const vendor = suppliers.find(v => v.id === quote.supplierId);
    if (!vendor) { toast.error("This quote's supplier could not be found in the Vendor Master."); return; }

    let existingPOs: any[] = [];
    try { existingPOs = JSON.parse(localStorage.getItem("cleancar_purchase_orders") || "[]"); } catch {}

    // Same sequential CCW-PO{FY}{seq} numbering PurchaseOrders.tsx uses —
    // was previously a random PO-YYYY-NNNN, a different, inconsistent
    // scheme from every other PO in this app.
    const now = new Date();
    const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fy = `${String(fyYear).slice(-2)}${String(fyYear + 1).slice(-2)}`;
    const prefix = `CCW-PO${fy}`;
    const maxSeq = existingPOs
      .map((po: any) => po.poNumber || "")
      .filter((n: string) => n.startsWith(prefix))
      .map((n: string) => parseInt(n.slice(prefix.length), 10) || 0)
      .reduce((max: number, n: number) => Math.max(max, n), 0);
    const poNumber = `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;

    // Recompute GST fresh at PO-raise time (rather than trusting the
    // quote's snapshot) using the same real vendor + delivery-city
    // inputs, so it always agrees with how every other PO's GST is
    // computed — the quote's own figures were already real, this just
    // guards against them going stale between quoting and raising.
    const gstRate = quote.gstRate ?? 18;
    const taxableValue = quote.totalAmount;
    const gst = calculateGST(taxableValue, gstRate, vendor.stateCode, "B2B", RFQ_DELIVERY_CITY);
    const netAmount = Math.round((taxableValue + gst.cgst + gst.sgst + gst.igst) * 100) / 100;

    const realItem = {
      itemId: matchCatalogItem(rfq.item)?.itemId || "",
      itemName: rfq.item, quantity: rfq.quantity, unit: rfq.unit,
      rate: quote.unitPrice, amount: taxableValue,
      hsnCode: quote.hsnCode || "", gstRate, discountPct: 0,
      taxableValue, cgst: gst.cgst, sgst: gst.sgst, igst: gst.igst, netAmount,
      receivedQty: 0,
    };

    const termsSnapshot = snapshotCurrentTerms();
    const poRecord: PurchaseOrder = {
      poNumber, vendorId: vendor.id, vendorName: vendor.name,
      vendorGstin: vendor.gstin, vendorPan: vendor.pan, vendorAddress: vendor.address,
      vendorStateCode: vendor.stateCode, vendorContactName: vendor.contactPerson,
      vendorContactPhone: vendor.contactPhone, vendorContactEmail: vendor.contactEmail,
      dateIssued: now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).split("/").join("-"),
      expectedDelivery: "—",
      deliveryAddress: RFQ_DELIVERY_ADDRESS,
      status: "Issued",
      items: [realItem],
      totalAmount: taxableValue,
      gst: Math.round((gst.cgst + gst.sgst + gst.igst) * 100) / 100,
      cgstTotal: gst.cgst, sgstTotal: gst.sgst, igstTotal: gst.igst, grandTotal: netAmount,
      approvedBy: "",
      termsSnapshot,
      remarks: `Raised from RFQ ${rfq.id}, quote from ${vendor.name}.`,
    };

    const newPO = {
      poNumber, supplier: vendor.name,
      amount: netAmount,
      status: "Pending Approval",
      date: now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      items: 1,
      itemsList: [realItem],
      rfqRef: rfq.id,
      createdAt: now.toISOString(),
      poRecord,
    };

    try {
      localStorage.setItem("cleancar_purchase_orders", JSON.stringify([newPO, ...existingPOs]));
    } catch {}

    const updated = rfqs.map(r => r.id === rfq.id ? { ...r, status: "PO Raised" as const, selectedQuote: quote.supplierId } : r);
    setRfqs(updated);
    try { localStorage.setItem("cleancar_rfq_records", JSON.stringify(updated)); } catch {}

    toast.success(`${poNumber} created from quote by ${vendor.name}`, { description: `₹${netAmount.toLocaleString("en-IN")} incl. GST · ${quote.deliveryDays} days delivery` });
    setCompareRFQ(null);
  };

  // ── Derived stats ────────────────────────────────────────────────────────────
  const pending    = rfqs.filter(r => r.status === "Pending Quotes").length;
  const received   = rfqs.filter(r => r.status === "Quotes Received").length;
  const compared   = rfqs.filter(r => r.status === "Comparison Done" || r.status === "PO Raised").length;

  const statusColor = (s: string) =>
    s === "Pending Quotes"  ? "destructive" :
    s === "Quotes Received" ? "default" :
    s === "PO Raised"       ? "outline" : "secondary";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Quotation Management</h2>
          <p className="text-sm text-gray-500 mt-1">Request for Quotation (RFQ) workflow and supplier comparison</p>
        </div>
        <Button onClick={() => setShowRFQDialog(true)}>
          <Plus className="w-4 h-4 mr-2"/>Create RFQ
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{pending}</p><p className="text-xs text-gray-500">Pending Quotes</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{received}</p><p className="text-xs text-gray-500">Quotes Received</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{compared}</p><p className="text-xs text-gray-500">Comparison Done</p></CardContent></Card>
      </div>

      {/* RFQ List */}
      <Card>
        <CardHeader><CardTitle className="text-base">Active RFQs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rfqs.map(rfq => (
              <div key={rfq.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{rfq.id}</p>
                    <Badge variant={statusColor(rfq.status) as any}>{rfq.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{rfq.item} · Qty: {rfq.quantity} {rfq.unit}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{rfq.suppliers} suppliers invited</span>
                    {rfq.quotesReceived != null && <span>· {rfq.quotesReceived} quotes received</span>}
                    <span>· Deadline: {rfq.deadline}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {rfq.status !== "PO Raised" && (
                    <Button size="sm" variant="outline" onClick={() => openRecordQuote(rfq)}>
                      <ReceiptText className="w-4 h-4 mr-1"/>Record Quote
                    </Button>
                  )}
                  {(rfq.status === "Quotes Received" || rfq.status === "Comparison Done") && (
                    <Button size="sm" onClick={() => setCompareRFQ(rfq)}>Compare Quotes</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setViewRFQ(rfq)}>
                    <FileText className="w-4 h-4 mr-1"/>View
                  </Button>
                </div>
              </div>
            ))}
            {rfqs.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No RFQs yet — click Create RFQ to start</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── VIEW RFQ DIALOG ─────────────────────────────────────────────────── */}
      <Dialog open={!!viewRFQ} onOpenChange={o => { if (!o) setViewRFQ(null); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>RFQ Details — {viewRFQ?.id}</DialogTitle>
            <DialogDescription>
              {viewRFQ?.item} · {viewRFQ?.quantity} {viewRFQ?.unit} · Deadline: {viewRFQ?.deadline}
            </DialogDescription>
          </DialogHeader>
          {viewRFQ && (
            <div className="space-y-5">
              {/* RFQ info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
                <div><p className="text-xs text-gray-500">Category</p><p className="font-medium">{viewRFQ.category}</p></div>
                <div><p className="text-xs text-gray-500">Created</p><p className="font-medium">{viewRFQ.createdDate}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><Badge variant={statusColor(viewRFQ.status) as any}>{viewRFQ.status}</Badge></div>
                <div><p className="text-xs text-gray-500">Suppliers Invited</p><p className="font-medium">{viewRFQ.suppliers}</p></div>
                {viewRFQ.specifications && (
                  <div className="col-span-2"><p className="text-xs text-gray-500">Specifications</p><p className="text-sm mt-0.5">{viewRFQ.specifications}</p></div>
                )}
              </div>

              {/* Quotes received */}
              {viewRFQ.quotes && viewRFQ.quotes.length > 0 ? (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">{viewRFQ.quotes.length} Quote{viewRFQ.quotes.length !== 1 ? "s" : ""} Received</p>
                  <div className="space-y-2">
                    {viewRFQ.quotes.map(q => (
                      <div key={q.supplierId} className={`border rounded-lg p-3 ${viewRFQ.selectedQuote === q.supplierId ? "border-green-400 bg-green-50" : q.recommended ? "border-blue-300 bg-blue-50" : ""}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{q.supplierName}</p>
                              {q.recommended && <Badge className="bg-blue-100 text-blue-800 text-xs">Recommended</Badge>}
                              {viewRFQ.selectedQuote === q.supplierId && <Badge className="bg-green-100 text-green-800 text-xs">✓ Selected</Badge>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>₹{q.unitPrice}/unit</span>
                              <span>·</span>
                              <span>{q.deliveryDays} days delivery</span>
                              <span>·</span>
                              <span>{q.paymentTerms}</span>
                            </div>
                            {q.notes && <p className="text-xs text-gray-400 mt-1 italic">{q.notes}</p>}
                          </div>
                          <div className="text-right">
                            {q.grandTotal != null ? (
                              <>
                                <p className="font-bold text-gray-900">₹{q.grandTotal.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">₹{q.totalAmount.toLocaleString()} + {q.gstRate}% GST (₹{((q.cgst||0)+(q.sgst||0)+(q.igst||0)).toLocaleString()})</p>
                              </>
                            ) : (
                              <>
                                <p className="font-bold text-gray-900">₹{q.totalAmount.toLocaleString()}</p>
                                <p className="text-xs text-amber-600">Pre-dates real GST tracking</p>
                              </>
                            )}
                            <p className="text-xs text-gray-400">Valid till {q.validUntil}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed rounded-lg">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2"/>
                  <p className="text-sm text-gray-500">Awaiting quotes from {viewRFQ.suppliers} suppliers</p>
                  <p className="text-xs text-gray-400 mt-1">Deadline: {viewRFQ.deadline}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRFQ(null)}>Close</Button>
            {viewRFQ?.status === "Quotes Received" && (
              <Button onClick={() => { setViewRFQ(null); setCompareRFQ(viewRFQ); }}>
                Compare Quotes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── COMPARE QUOTES DIALOG ───────────────────────────────────────────── */}
      <Dialog open={!!compareRFQ} onOpenChange={o => { if (!o) setCompareRFQ(null); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Quotes — {compareRFQ?.id}</DialogTitle>
            <DialogDescription>
              {compareRFQ?.item} · {compareRFQ?.quantity} {compareRFQ?.unit}
            </DialogDescription>
          </DialogHeader>
          {compareRFQ && compareRFQ.quotes && compareRFQ.quotes.length > 0 && (
            <div className="space-y-5">
              {/* Summary insight — real GST-inclusive total (what the vendor
                  actually gets paid), not the pre-tax figure, drives
                  "lowest price" here — two quotes with the same taxable
                  value but different GST rates can rank differently once
                  tax is real. */}
              {(() => {
                const quotes = compareRFQ.quotes!;
                const effTotal = (q: SupplierQuote) => q.grandTotal ?? q.totalAmount;
                const cheapest = [...quotes].sort((a,b) => effTotal(a) - effTotal(b))[0];
                const fastest  = [...quotes].sort((a,b) => a.deliveryDays - b.deliveryDays)[0];
                const bestRated= [...quotes].sort((a,b) => b.rating - a.rating)[0];
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <TrendingDown className="w-5 h-5 text-green-600 mx-auto mb-1"/>
                      <p className="text-xs text-gray-500">Lowest Price {cheapest.grandTotal != null && "(incl. GST)"}</p>
                      <p className="font-semibold text-sm">{cheapest.supplierName.split(" ")[0]}</p>
                      <p className="text-green-700 font-bold">₹{effTotal(cheapest).toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1"/>
                      <p className="text-xs text-gray-500">Fastest Delivery</p>
                      <p className="font-semibold text-sm">{fastest.supplierName.split(" ")[0]}</p>
                      <p className="text-blue-700 font-bold">{fastest.deliveryDays} days</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                      <Star className="w-5 h-5 text-yellow-600 mx-auto mb-1"/>
                      <p className="text-xs text-gray-500">Highest Rated</p>
                      <p className="font-semibold text-sm">{bestRated.supplierName.split(" ")[0]}</p>
                      <p className="text-yellow-700 font-bold">{bestRated.rating} ⭐</p>
                    </div>
                  </div>
                );
              })()}

              {/* Comparison table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 border-b">Supplier</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 border-b">Unit Price</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 border-b">Taxable (₹)</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 border-b">GST</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 border-b">Total incl. GST (₹)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 border-b">Delivery</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 border-b">Payment</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 border-b">Rating</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 border-b">Valid Till</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {compareRFQ.quotes!
                      .slice()
                      .sort((a, b) => (a.grandTotal ?? a.totalAmount) - (b.grandTotal ?? b.totalAmount))
                      .map((q, idx) => {
                        const isSelected = compareRFQ.selectedQuote === q.supplierId;
                        const isCheapest = idx === 0;
                        return (
                          <tr key={q.supplierId} className={`${isSelected ? "bg-green-50" : q.recommended ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-medium">{q.supplierName}</p>
                                  {q.notes && <p className="text-xs text-gray-400">{q.notes}</p>}
                                </div>
                                <div className="flex gap-1">
                                  {isCheapest && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Lowest</span>}
                                  {q.recommended && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Recommended</span>}
                                  {isSelected && <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-medium">✓ Selected</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">₹{q.unitPrice}</td>
                            <td className="px-4 py-3 text-right text-gray-600">₹{q.totalAmount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {q.grandTotal != null ? (
                                <>
                                  <span>{q.gstRate}%</span>
                                  <p className="text-xs text-gray-400">₹{((q.cgst||0)+(q.sgst||0)+(q.igst||0)).toLocaleString()}</p>
                                </>
                              ) : <span className="text-xs text-amber-600">No GST on record</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className={`font-bold ${isCheapest ? "text-green-700" : "text-gray-900"}`}>₹{(q.grandTotal ?? q.totalAmount).toLocaleString()}</p>
                              {isCheapest && <p className="text-xs text-green-600">Lowest bid</p>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-medium ${q.deliveryDays <= 5 ? "text-green-700" : q.deliveryDays <= 7 ? "text-blue-700" : "text-gray-600"}`}>
                                {q.deliveryDays} days
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-gray-600">{q.paymentTerms}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-semibold ${q.rating >= 4.5 ? "text-green-700" : q.rating >= 4.0 ? "text-blue-700" : "text-gray-600"}`}>
                                {q.rating} ⭐
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-gray-500">{q.validUntil}</td>
                            <td className="px-4 py-3 text-center">
                              {isSelected ? (
                                <span className="text-xs text-green-600 font-medium">PO Raised</span>
                              ) : (
                                <Button size="sm" onClick={() => handleRaisePO(compareRFQ, q)}
                                  className="bg-green-600 hover:bg-green-700 text-xs">
                                  <Award className="w-3.5 h-3.5 mr-1"/>Select & Raise PO
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {compareRFQ.selectedQuote && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 shrink-0"/>
                  Quote selected and PO raised. Check Purchase Orders tab to track approval.
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompareRFQ(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CREATE RFQ DIALOG ───────────────────────────────────────────────── */}
      <Dialog open={showRFQDialog} onOpenChange={o => { if (!o) setShowRFQDialog(false); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Request for Quotation (RFQ)</DialogTitle>
            <DialogDescription>Send RFQ to multiple suppliers to receive competitive quotes</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">RFQ Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>RFQ Date *</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Quote Submission Deadline *</Label>
                  <Input type="date" value={rfqDeadline} onChange={e => setRfqDeadline(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={rfqCategory} onValueChange={setRfqCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chemicals">Chemicals</SelectItem>
                      <SelectItem value="Consumables">Consumables</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Protective Gear">Protective Gear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Items Required</h3>
                <Button size="sm" variant="outline" onClick={handleAddItem}><Plus className="w-4 h-4 mr-1"/>Add Item</Button>
              </div>
              <div className="space-y-3">
                {rfqItems.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-start border rounded-lg p-3 bg-gray-50">
                    <div className="col-span-3 space-y-1"><Label className="text-xs">Item Name</Label><Input placeholder="Item name" value={item.itemName} onChange={e => handleItemChange(item.id, "itemName", e.target.value)} className="h-8 text-sm"/></div>
                    <div className="col-span-2 space-y-1"><Label className="text-xs">Qty</Label><Input type="number" value={item.quantity||""} onChange={e => handleItemChange(item.id, "quantity", parseFloat(e.target.value)||0)} className="h-8 text-sm"/></div>
                    <div className="col-span-1 space-y-1"><Label className="text-xs">Unit</Label>
                      <Select value={item.unit} onValueChange={v => handleItemChange(item.id, "unit", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="Pieces">Pcs</SelectItem><SelectItem value="Liters">L</SelectItem><SelectItem value="Kilograms">Kg</SelectItem><SelectItem value="Boxes">Box</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-5 space-y-1"><Label className="text-xs">Specifications</Label><Input placeholder="Quality, brand, standards…" value={item.specifications} onChange={e => handleItemChange(item.id, "specifications", e.target.value)} className="h-8 text-sm"/></div>
                    <div className="col-span-1 flex items-end pb-0.5">
                      {rfqItems.length > 1 && <Button size="sm" variant="ghost" onClick={() => handleRemoveItem(item.id)} className="h-8 w-8 p-0"><Trash2 className="w-4 h-4 text-red-500"/></Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suppliers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5"/>{selectedSuppliers.length} supplier{selectedSuppliers.length !== 1 ? "s" : ""} selected</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedSuppliers(suppliers.map(s => s.id))}>Select All</Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedSuppliers([])}>Clear</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {suppliers.length > 0 ? suppliers.map(s => (
                  <div key={s.id} onClick={() => toggleSupplier(s.id)}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${selectedSuppliers.includes(s.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="checkbox" readOnly checked={selectedSuppliers.includes(s.id)} className="w-4 h-4"/>
                    <div><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-gray-500">{s.vendorType} · {s.state}</p></div>
                  </div>
                )) : (
                  <p className="col-span-2 text-sm text-gray-400 py-4 text-center">No vendors in the Vendor Master yet. Add one in GST → Vendor Master.</p>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Terms & Instructions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Payment Terms</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select terms"/></SelectTrigger><SelectContent><SelectItem value="net30">Net 30 Days</SelectItem><SelectItem value="net15">Net 15 Days</SelectItem><SelectItem value="advance">Advance</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Quote Validity</Label>
                  <Select defaultValue="30"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="15">15 Days</SelectItem><SelectItem value="30">30 Days</SelectItem><SelectItem value="45">45 Days</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Special Instructions</Label><Textarea rows={2} placeholder="Delivery requirements, quality standards…"/></div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRFQDialog(false)}>Cancel</Button>
            <Button variant="secondary">Save as Draft</Button>
            <Button onClick={handleSubmitRFQ} disabled={selectedSuppliers.length === 0}>
              <Send className="w-4 h-4 mr-2"/>Send RFQ to {selectedSuppliers.length} Supplier{selectedSuppliers.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── RECORD QUOTE DIALOG ─────────────────────────────────────────────── */}
      <Dialog open={!!quoteRFQ} onOpenChange={o => { if (!o) setQuoteRFQ(null); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Quote — {quoteRFQ?.id}</DialogTitle>
            <DialogDescription>
              {quoteRFQ?.item} · Qty: {quoteRFQ?.quantity} {quoteRFQ?.unit}
            </DialogDescription>
          </DialogHeader>
          {quoteRFQ && (() => {
            const eligibleVendors = quoteRFQ.invitedSupplierIds?.length
              ? suppliers.filter(v => quoteRFQ.invitedSupplierIds!.includes(v.id))
              : suppliers;
            const unitPriceNum = parseFloat(quoteUnitPrice) || 0;
            const taxablePreview = Math.round(unitPriceNum * quoteRFQ.quantity * 100) / 100;
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select value={quoteVendorId} onValueChange={setQuoteVendorId}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {eligibleVendors.length > 0 ? eligibleVendors.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      )) : (
                        <SelectItem value="none" disabled>No vendors available for this RFQ.</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Unit Price (₹) *</Label>
                    <Input type="number" min="0" value={quoteUnitPrice} onChange={e => setQuoteUnitPrice(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery (days)</Label>
                    <Input type="number" min="0" value={quoteDeliveryDays} onChange={e => setQuoteDeliveryDays(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>HSN Code</Label>
                    <Input value={quoteHsnCode} onChange={e => setQuoteHsnCode(e.target.value)} placeholder="e.g. 3402" />
                  </div>
                  <div className="space-y-2">
                    <Label>GST Rate (%) *</Label>
                    <Input type="number" min="0" value={quoteGstRate} onChange={e => setQuoteGstRate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select value={quotePaymentTerms} onValueChange={setQuotePaymentTerms}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Net 7">Net 7 Days</SelectItem>
                        <SelectItem value="Net 15">Net 15 Days</SelectItem>
                        <SelectItem value="Net 30">Net 30 Days</SelectItem>
                        <SelectItem value="Net 45">Net 45 Days</SelectItem>
                        <SelectItem value="Advance">Advance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until *</Label>
                    <Input type="date" value={quoteValidUntil} onChange={e => setQuoteValidUntil(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea rows={2} value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} placeholder="Bulk discount, warranty, delivery conditions…" />
                </div>
                {unitPriceNum > 0 && (() => {
                  const vendor = suppliers.find(v => v.id === quoteVendorId);
                  const rate = parseFloat(quoteGstRate) || 0;
                  if (!vendor) return (
                    <p className="text-xs text-gray-400 bg-gray-50 rounded p-2">Select a supplier to see the real GST breakup (CGST+SGST vs IGST depends on the vendor's state).</p>
                  );
                  const gst = calculateGST(taxablePreview, rate, vendor.stateCode, "B2B", RFQ_DELIVERY_CITY);
                  const grand = Math.round((taxablePreview + gst.cgst + gst.sgst + gst.igst) * 100) / 100;
                  return (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-gray-500">Taxable value</span><span>₹{taxablePreview.toLocaleString("en-IN")}</span></div>
                      {gst.igst > 0 ? (
                        <div className="flex justify-between"><span className="text-gray-500">IGST ({rate}%)</span><span>₹{gst.igst.toLocaleString("en-IN")}</span></div>
                      ) : (
                        <>
                          <div className="flex justify-between"><span className="text-gray-500">CGST ({(rate/2)}%)</span><span>₹{gst.cgst.toLocaleString("en-IN")}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">SGST ({(rate/2)}%)</span><span>₹{gst.sgst.toLocaleString("en-IN")}</span></div>
                        </>
                      )}
                      <div className="flex justify-between font-bold pt-1 border-t"><span>Total incl. GST</span><span>₹{grand.toLocaleString("en-IN")}</span></div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteRFQ(null)}>Cancel</Button>
            <Button onClick={handleSubmitQuote}>
              <ReceiptText className="w-4 h-4 mr-2" />Record Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
