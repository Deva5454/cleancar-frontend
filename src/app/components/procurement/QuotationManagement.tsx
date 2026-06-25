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
  Star, TrendingDown, Award, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SupplierQuote {
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  totalAmount: number;
  deliveryDays: number;
  paymentTerms: string;
  validUntil: string;
  notes?: string;
  rating: number;
  recommended?: boolean;
}

interface RFQRecord {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  status: "Pending Quotes" | "Quotes Received" | "Comparison Done" | "PO Raised";
  suppliers: number;
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
export function QuotationManagement() {
  const [rfqs, setRfqs]                   = useState<RFQRecord[]>(loadRFQs);
  const [showRFQDialog, setShowRFQDialog] = useState(false);
  const [viewRFQ, setViewRFQ]             = useState<RFQRecord | null>(null);
  const [compareRFQ, setCompareRFQ]       = useState<RFQRecord | null>(null);

  // Create RFQ form state
  const [rfqItems, setRFQItems]           = useState([{ id:1, itemName:"", quantity:0, unit:"Pieces", specifications:"" }]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [rfqDeadline, setRfqDeadline]     = useState("");
  const [rfqCategory, setRfqCategory]     = useState("");

  const suppliers = [
    { id:"SUP-001", name:"CleanPro Supplies Pvt Ltd", category:"Chemicals" },
    { id:"SUP-002", name:"AutoCare Enterprises",      category:"Consumables" },
    { id:"SUP-003", name:"Karcher India Pvt Ltd",     category:"Equipment" },
    { id:"SUP-004", name:"Eco Wash Solutions",        category:"Chemicals" },
    { id:"SUP-005", name:"ProWash Equipment",         category:"Equipment" },
  ];

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

  const handleRaisePO = (rfq: RFQRecord, quote: SupplierQuote) => {
    const updated = rfqs.map(r => r.id === rfq.id ? { ...r, status:"PO Raised" as const, selectedQuote: quote.supplierId } : r);
    setRfqs(updated);
    try {
      const pos = JSON.parse(localStorage.getItem("cleancar_purchase_orders") || "[]");
      const poId = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
      pos.unshift({ poNumber:poId, supplier:quote.supplierName, amount:quote.totalAmount, status:"Pending Approval", date: new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}), items:1, rfqRef:rfq.id, createdAt:new Date().toISOString() });
      localStorage.setItem("cleancar_purchase_orders", JSON.stringify(pos));
    } catch {}
    toast.success(`PO created from quote by ${quote.supplierName}`, { description: `₹${quote.totalAmount.toLocaleString()} · ${quote.deliveryDays} days delivery` });
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
                            <p className="font-bold text-gray-900">₹{q.totalAmount.toLocaleString()}</p>
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
              {/* Summary insight */}
              {(() => {
                const quotes = compareRFQ.quotes!;
                const cheapest = [...quotes].sort((a,b) => a.totalAmount - b.totalAmount)[0];
                const fastest  = [...quotes].sort((a,b) => a.deliveryDays - b.deliveryDays)[0];
                const bestRated= [...quotes].sort((a,b) => b.rating - a.rating)[0];
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <TrendingDown className="w-5 h-5 text-green-600 mx-auto mb-1"/>
                      <p className="text-xs text-gray-500">Lowest Price</p>
                      <p className="font-semibold text-sm">{cheapest.supplierName.split(" ")[0]}</p>
                      <p className="text-green-700 font-bold">₹{cheapest.totalAmount.toLocaleString()}</p>
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
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 border-b">Total (₹)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 border-b">Delivery</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 border-b">Payment</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 border-b">Rating</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 border-b">Valid Till</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {compareRFQ.quotes!
                      .sort((a, b) => a.totalAmount - b.totalAmount)
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
                            <td className="px-4 py-3 text-right">
                              <p className={`font-bold ${isCheapest ? "text-green-700" : "text-gray-900"}`}>₹{q.totalAmount.toLocaleString()}</p>
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
                {suppliers.map(s => (
                  <div key={s.id} onClick={() => toggleSupplier(s.id)}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${selectedSuppliers.includes(s.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="checkbox" readOnly checked={selectedSuppliers.includes(s.id)} className="w-4 h-4"/>
                    <div><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-gray-500">{s.category}</p></div>
                  </div>
                ))}
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
    </div>
  );
}
