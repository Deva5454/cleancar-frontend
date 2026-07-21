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
  FileText, CheckCircle, XCircle, AlertTriangle, Package, ShoppingCart, IndianRupee,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
interface InvoiceLine { description: string; qty: number; unit: string; unitPrice: number; total: number; }
interface MatchLine   { field: string; po: string; grn: string; invoice: string; match: boolean; }
interface Invoice {
  invoiceNumber: string; poNumber: string; grnNumber: string;
  supplier: string; amount: number; status: string; date: string;
  matchType?: string; issue?: string;
  // Extended data for dialogs
  supplierGSTIN?: string; supplierAddress?: string;
  invoiceDate?: string; dueDate?: string; paymentTerms?: string;
  lines?: InvoiceLine[];
  matchLines?: MatchLine[];
  discrepancyDetails?: string;
  // Real invoice document attachment - previously no invoice could
  // carry a real copy of the actual vendor invoice document.
  invoiceFileName?: string;
  invoiceFileType?: string;
  invoiceFileBase64?: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────
const INITIAL_INVOICES: Invoice[] = [
  {
    invoiceNumber: "INV-2603-045", poNumber: "PO-2026-0245", grnNumber: "GRN-2026-012",
    supplier: "ChemClean Industries", amount: 125000, status: "Pending Match",
    date: "Mar 17, 2026", invoiceDate: "2026-03-17", dueDate: "2026-04-17",
    paymentTerms: "Net 30", supplierGSTIN: "27AABCC1234A1ZP",
    supplierAddress: "Plot 45, GIDC Industrial Estate, Surat - 395010",
    lines: [
      { description:"Car Wash Shampoo 5L",     qty:100, unit:"L",   unitPrice:450, total:45000 },
      { description:"Foam Gun Professional",    qty:10,  unit:"Pcs", unitPrice:2800, total:28000 },
      { description:"Wheel Cleaner 1L",         qty:60,  unit:"L",   unitPrice:280, total:16800 },
      { description:"Interior Cleaner 5L",      qty:20,  unit:"L",   unitPrice:750, total:15000 },
      { description:"GST 18%",                  qty:1,   unit:"",    unitPrice:0,   total:20200 },
    ],
    matchLines: [
      { field:"Supplier",     po:"ChemClean Industries",    grn:"ChemClean Industries",    invoice:"ChemClean Industries",    match:true  },
      { field:"Total Amount", po:"₹1,04,800",               grn:"₹1,04,800",               invoice:"₹1,25,000",               match:false },
      { field:"Item Count",   po:"5 items",                 grn:"5 items",                 invoice:"5 items",                 match:true  },
      { field:"GSTIN",        po:"27AABCC1234A1ZP",         grn:"—",                       invoice:"27AABCC1234A1ZP",         match:true  },
    ],
  },
  {
    invoiceNumber: "INV-2603-044", poNumber: "PO-2026-0243", grnNumber: "GRN-2026-011",
    supplier: "ProWash Equipment", amount: 52000, status: "Matched", date: "Mar 15, 2026",
    matchType: "3-Way Match", invoiceDate: "2026-03-15", dueDate: "2026-04-15",
    paymentTerms: "Net 30", supplierGSTIN: "27AABCP9876B1ZT",
    supplierAddress: "Unit 12, Industrial Park, Pune - 411001",
    lines: [
      { description:"Pressure Washer Nozzle K5", qty:10, unit:"Pcs", unitPrice:3800, total:38000 },
      { description:"Hose Connector Set",        qty:10, unit:"Pcs", unitPrice:600,  total:6000  },
      { description:"GST 18%",                   qty:1,  unit:"",    unitPrice:0,    total:7920  },
    ],
    matchLines: [
      { field:"Supplier",     po:"ProWash Equipment", grn:"ProWash Equipment", invoice:"ProWash Equipment", match:true },
      { field:"Total Amount", po:"₹44,000",           grn:"₹44,000",           invoice:"₹52,000",           match:true },
      { field:"Item Count",   po:"2 items",           grn:"2 items",           invoice:"2 items",           match:true },
      { field:"GSTIN",        po:"27AABCP9876B1ZT",   grn:"—",                 invoice:"27AABCP9876B1ZT",   match:true },
    ],
  },
  {
    invoiceNumber: "INV-2603-043", poNumber: "PO-2026-0242", grnNumber: "GRN-2026-010",
    supplier: "ChemClean Industries", amount: 95000, status: "Discrepancy",
    date: "Mar 14, 2026", issue: "Qty mismatch",
    discrepancyDetails: "Invoice claims 150 units of Car Wash Shampoo delivered, but GRN GRN-2026-010 records only 120 units accepted. Difference of 30 units (₹13,500) unresolved.",
    invoiceDate: "2026-03-14", dueDate: "2026-04-14",
    paymentTerms: "Net 30", supplierGSTIN: "27AABCC1234A1ZP",
    supplierAddress: "Plot 45, GIDC Industrial Estate, Surat - 395010",
    lines: [
      { description:"Car Wash Shampoo 5L (Invoice)",  qty:150, unit:"L", unitPrice:450, total:67500 },
      { description:"Microfiber Towel Premium",        qty:200, unit:"Pcs", unitPrice:80, total:16000 },
      { description:"GST 18%",                         qty:1,   unit:"",   unitPrice:0,  total:15030 },
    ],
    matchLines: [
      { field:"Supplier",          po:"ChemClean Industries", grn:"ChemClean Industries", invoice:"ChemClean Industries", match:true  },
      { field:"Shampoo Qty",       po:"150 L",                grn:"120 L (accepted)",     invoice:"150 L",               match:false },
      { field:"Microfiber Qty",    po:"200 Pcs",              grn:"200 Pcs",              invoice:"200 Pcs",             match:true  },
      { field:"Total Amount",      po:"₹95,000",              grn:"₹81,500 (partial)",    invoice:"₹95,000",             match:false },
    ],
  },
];

export function InvoiceMatching() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const stored = localStorage.getItem("cleancar_invoices");
      if (stored) return JSON.parse(stored);
      localStorage.setItem("cleancar_invoices", JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });
  // Real invoice recording dialog - previously there was no way to
  // record a new invoice at all, only match pre-seeded demo ones.
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false);
  const [newInvoiceNumber, setNewInvoiceNumber] = useState("");
  const [newPoNumber, setNewPoNumber] = useState("");
  const [newGrnNumber, setNewGrnNumber] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newInvoiceFileName, setNewInvoiceFileName] = useState<string | null>(null);
  const [newInvoiceFileType, setNewInvoiceFileType] = useState<string | null>(null);
  const [newInvoiceFileBase64, setNewInvoiceFileBase64] = useState<string | null>(null);

  const persistInvoices = (updated: Invoice[]) => {
    setInvoices(updated);
    try { localStorage.setItem("cleancar_invoices", JSON.stringify(updated)); } catch {}
  };

  const handleNewInvoiceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("File is too large — please upload a file under 500KB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewInvoiceFileBase64(reader.result as string);
      setNewInvoiceFileName(file.name);
      setNewInvoiceFileType(file.type);
      toast.success("Invoice document attached");
    };
    reader.onerror = () => toast.error("Could not read this file — please try again.");
    reader.readAsDataURL(file);
  };

  const handleRecordInvoice = () => {
    if (!newInvoiceNumber.trim() || !newSupplier.trim() || !newAmount.trim()) {
      toast.error("Enter the invoice number, supplier, and amount");
      return;
    }
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const newInvoice: Invoice = {
      invoiceNumber: newInvoiceNumber.trim(),
      poNumber: newPoNumber.trim() || "—",
      grnNumber: newGrnNumber.trim() || "—",
      supplier: newSupplier.trim(),
      amount,
      status: "Pending Match",
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      invoiceDate: new Date().toISOString().split("T")[0],
      invoiceFileName: newInvoiceFileName || undefined,
      invoiceFileType: newInvoiceFileType || undefined,
      invoiceFileBase64: newInvoiceFileBase64 || undefined,
    };
    persistInvoices([newInvoice, ...invoices]);
    toast.success(`Invoice ${newInvoice.invoiceNumber} recorded`);
    setAddInvoiceOpen(false);
    setNewInvoiceNumber(""); setNewPoNumber(""); setNewGrnNumber(""); setNewSupplier(""); setNewAmount("");
    setNewInvoiceFileName(null); setNewInvoiceFileType(null); setNewInvoiceFileBase64(null);
  };

  const [viewInvoice, setViewInvoice]   = useState<Invoice | null>(null);
  const [matchInvoice, setMatchInvoice] = useState<Invoice | null>(null);
  const [resolveInv, setResolveInv]     = useState<Invoice | null>(null);
  const [resolution, setResolution]     = useState("");
  const [resolutionType, setResolutionType] = useState("");

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleConfirmMatch = (inv: Invoice) => {
    persistInvoices(invoices.map(i =>
      i.invoiceNumber === inv.invoiceNumber
        ? { ...i, status:"Matched", matchType:"3-Way Match" }
        : i
    ));
    // Push to payment queue
    try {
      const payments = JSON.parse(localStorage.getItem("cleancar_supplier_payments") || "[]");
      payments.unshift({
        paymentId: `PAY-${Date.now()}`, supplier: inv.supplier,
        invoices: [inv.invoiceNumber], amount: inv.amount,
        dueDate: inv.dueDate ?? "TBD", status: "Pending Approval",
        paymentMethod: "NEFT", createdAt: new Date().toISOString(),
      });
      localStorage.setItem("cleancar_supplier_payments", JSON.stringify(payments));
    } catch {}
    toast.success(`${inv.invoiceNumber} matched ✓ — added to payment queue`);
    setMatchInvoice(null);
  };

  const handleResolveSubmit = (inv: Invoice) => {
    if (!resolutionType || !resolution.trim()) {
      toast.error("Select resolution type and enter details");
      return;
    }
    const newStatus = resolutionType === "accept-partial" ? "Matched" :
                      resolutionType === "reject"         ? "Rejected" : "Matched";
    persistInvoices(invoices.map(i =>
      i.invoiceNumber === inv.invoiceNumber
        ? { ...i, status: newStatus, matchType: newStatus === "Matched" ? "Partial Match" : undefined, issue: undefined }
        : i
    ));
    toast.success(`Discrepancy on ${inv.invoiceNumber} resolved`);
    setResolveInv(null);
    setResolution("");
    setResolutionType("");
  };

  // ── Stats (live) ─────────────────────────────────────────────────────────────
  const pending    = invoices.filter(i => i.status === "Pending Match").length;
  const matched    = invoices.filter(i => i.status === "Matched").length;
  const discrepancy= invoices.filter(i => i.status === "Discrepancy").length;
  const totalAmt   = invoices.reduce((s, i) => s + i.amount, 0);

  const statusVariant = (s: string) =>
    s === "Pending Match" ? "destructive" : s === "Discrepancy" ? "destructive" : "outline";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Invoice Matching</h2>
          <p className="text-sm text-gray-500 mt-1">3-way match between PO, GRN, and supplier invoices for payment approval</p>
        </div>
        <Button onClick={() => setAddInvoiceOpen(true)}>Record Invoice</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{pending}</p><p className="text-xs text-gray-500">Pending Match</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{matched}</p><p className="text-xs text-gray-500">Matched</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{discrepancy}</p><p className="text-xs text-gray-500">Discrepancy</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">₹{(totalAmt/1000).toFixed(0)}K</p><p className="text-xs text-gray-500">Total Amount</p></CardContent></Card>
      </div>

      {/* Invoice list */}
      <Card>
        <CardHeader><CardTitle className="text-base">Supplier Invoices</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map(inv => (
              <div key={inv.invoiceNumber} className={`flex items-center justify-between p-4 border rounded-lg ${inv.status === "Discrepancy" ? "border-red-300 bg-red-50" : inv.status === "Matched" ? "border-green-200" : ""}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <FileText className={`w-5 h-5 shrink-0 ${inv.status === "Discrepancy" ? "text-red-600" : inv.status === "Matched" ? "text-green-600" : "text-blue-600"}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{inv.invoiceNumber}</p>
                      <Badge variant={statusVariant(inv.status) as any}>{inv.status}</Badge>
                      {inv.matchType && <Badge variant="secondary">{inv.matchType}</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 flex-wrap">
                      <span>{inv.supplier}</span>
                      <span>·</span><span>PO: {inv.poNumber}</span>
                      <span>·</span><span>GRN: {inv.grnNumber}</span>
                      <span>·</span><span>{inv.date}</span>
                    </div>
                    {inv.issue && <p className="text-xs text-red-600 mt-1">⚠ {inv.issue}</p>}
                    {inv.invoiceFileBase64 && (
                      <a href={inv.invoiceFileBase64} download={inv.invoiceFileName} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-1 inline-block">
                        View attached invoice
                      </a>
                    )}
                  </div>
                  <p className="font-bold text-lg mr-4 shrink-0">₹{inv.amount.toLocaleString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {inv.status === "Pending Match" && (
                    <Button size="sm" onClick={() => setMatchInvoice(inv)}>
                      <CheckCircle className="w-4 h-4 mr-1"/>Match
                    </Button>
                  )}
                  {inv.status === "Discrepancy" && (
                    <Button size="sm" variant="destructive" onClick={() => { setResolveInv(inv); setResolution(""); setResolutionType(""); }}>
                      <AlertTriangle className="w-4 h-4 mr-1"/>Resolve
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setViewInvoice(inv)}>View</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── VIEW DIALOG ──────────────────────────────────────────────────────── */}
      <Dialog open={!!viewInvoice} onOpenChange={o => { if (!o) setViewInvoice(null); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice — {viewInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>{viewInvoice?.supplier} · {viewInvoice?.date}</DialogDescription>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-5">
              {/* Header */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
                <div><p className="text-xs text-gray-400">Supplier</p><p className="font-medium">{viewInvoice.supplier}</p><p className="text-xs text-gray-400 mt-0.5">{viewInvoice.supplierAddress}</p></div>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-xs text-gray-400">GSTIN</span><span className="text-xs font-mono">{viewInvoice.supplierGSTIN}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-gray-400">Invoice Date</span><span className="text-xs">{viewInvoice.invoiceDate}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-gray-400">Due Date</span><span className="text-xs font-medium text-orange-700">{viewInvoice.dueDate}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-gray-400">Payment Terms</span><span className="text-xs">{viewInvoice.paymentTerms}</span></div>
                </div>
                <div><p className="text-xs text-gray-400">PO Reference</p><p className="font-medium text-blue-700">{viewInvoice.poNumber}</p></div>
                <div><p className="text-xs text-gray-400">GRN Reference</p><p className="font-medium text-blue-700">{viewInvoice.grnNumber}</p></div>
              </div>

              {/* Line items */}
              {viewInvoice.lines && (
                <div>
                  <p className="text-sm font-semibold mb-2">Invoice Line Items</p>
                  <table className="w-full text-sm border-collapse">
                    <thead><tr className="bg-gray-50"><th className="text-left px-3 py-2 text-xs text-gray-500 border-b">Description</th><th className="text-right px-3 py-2 text-xs text-gray-500 border-b">Qty</th><th className="text-right px-3 py-2 text-xs text-gray-500 border-b">Unit Price</th><th className="text-right px-3 py-2 text-xs text-gray-500 border-b">Total</th></tr></thead>
                    <tbody className="divide-y">
                      {viewInvoice.lines.map((l, i) => (
                        <tr key={i} className={l.description.includes("GST") ? "bg-gray-50 font-medium" : ""}>
                          <td className="px-3 py-2">{l.description}</td>
                          <td className="px-3 py-2 text-right">{l.qty > 0 ? `${l.qty} ${l.unit}` : "—"}</td>
                          <td className="px-3 py-2 text-right">{l.unitPrice > 0 ? `₹${l.unitPrice}` : "—"}</td>
                          <td className="px-3 py-2 text-right font-medium">₹{l.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="border-t-2 bg-gray-50"><td className="px-3 py-2 font-bold" colSpan={3}>Total</td><td className="px-3 py-2 text-right font-bold text-lg">₹{viewInvoice.amount.toLocaleString()}</td></tr></tfoot>
                  </table>
                </div>
              )}

              {/* 3-way match preview */}
              {viewInvoice.matchLines && (
                <div>
                  <p className="text-sm font-semibold mb-2">3-Way Match Preview</p>
                  <table className="w-full text-xs border-collapse">
                    <thead><tr className="bg-gray-50"><th className="text-left px-3 py-2 border-b font-semibold text-gray-500">Field</th><th className="text-left px-3 py-2 border-b font-semibold text-blue-600"><ShoppingCart className="w-3.5 h-3.5 inline mr-1"/>PO</th><th className="text-left px-3 py-2 border-b font-semibold text-purple-600"><Package className="w-3.5 h-3.5 inline mr-1"/>GRN</th><th className="text-left px-3 py-2 border-b font-semibold text-green-600"><IndianRupee className="w-3.5 h-3.5 inline mr-1"/>Invoice</th><th className="text-center px-3 py-2 border-b font-semibold text-gray-500">Match</th></tr></thead>
                    <tbody className="divide-y">
                      {viewInvoice.matchLines.map((l, i) => (
                        <tr key={i} className={!l.match ? "bg-red-50" : ""}>
                          <td className="px-3 py-2 font-medium">{l.field}</td>
                          <td className="px-3 py-2 text-gray-700">{l.po}</td>
                          <td className="px-3 py-2 text-gray-700">{l.grn}</td>
                          <td className="px-3 py-2 text-gray-700">{l.invoice}</td>
                          <td className="px-3 py-2 text-center">{l.match ? <CheckCircle className="w-4 h-4 text-green-600 inline"/> : <XCircle className="w-4 h-4 text-red-600 inline"/>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewInvoice.discrepancyDetails && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-800 mb-1">Discrepancy Details</p>
                  <p className="text-xs text-red-700">{viewInvoice.discrepancyDetails}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewInvoice(null)}>Close</Button>
            {viewInvoice?.status === "Pending Match" && (
              <Button onClick={() => { setViewInvoice(null); setMatchInvoice(viewInvoice); }}>
                <CheckCircle className="w-4 h-4 mr-2"/>Proceed to Match
              </Button>
            )}
            {viewInvoice?.status === "Discrepancy" && (
              <Button variant="destructive" onClick={() => { setViewInvoice(null); setResolveInv(viewInvoice); setResolution(""); setResolutionType(""); }}>
                <AlertTriangle className="w-4 h-4 mr-2"/>Resolve Discrepancy
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MATCH DIALOG ─────────────────────────────────────────────────────── */}
      <Dialog open={!!matchInvoice} onOpenChange={o => { if (!o) setMatchInvoice(null); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>3-Way Invoice Match — {matchInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>Verify PO · GRN · Invoice before approving for payment</DialogDescription>
          </DialogHeader>
          {matchInvoice && (
            <div className="space-y-5">
              {/* 3 document summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label:"Purchase Order", ref:matchInvoice.poNumber, icon:<ShoppingCart className="w-4 h-4 text-blue-600"/>, color:"border-blue-200 bg-blue-50" },
                  { label:"Goods Receipt",  ref:matchInvoice.grnNumber, icon:<Package className="w-4 h-4 text-purple-600"/>, color:"border-purple-200 bg-purple-50" },
                  { label:"Invoice",        ref:matchInvoice.invoiceNumber, icon:<IndianRupee className="w-4 h-4 text-green-600"/>, color:"border-green-200 bg-green-50" },
                ].map(d => (
                  <div key={d.ref} className={`border rounded-lg p-3 ${d.color}`}>
                    <div className="flex items-center gap-2 mb-1">{d.icon}<p className="text-xs font-semibold text-gray-700">{d.label}</p></div>
                    <p className="text-sm font-bold text-gray-900">{d.ref}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{matchInvoice.supplier}</p>
                  </div>
                ))}
              </div>

              {/* Match result table */}
              {matchInvoice.matchLines && (
                <div>
                  <p className="text-sm font-semibold mb-2">Verification Results</p>
                  <div className="space-y-1.5">
                    {matchInvoice.matchLines.map((l, i) => (
                      <div key={i} className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${l.match ? "bg-green-50 border-green-200" : "bg-red-50 border-red-300"}`}>
                        <span className="font-medium text-gray-700 w-32">{l.field}</span>
                        <div className="flex gap-6 text-xs text-gray-600 flex-1 justify-center">
                          <span className="text-blue-700">PO: {l.po}</span>
                          <span className="text-purple-700">GRN: {l.grn}</span>
                          <span className="text-green-700">Inv: {l.invoice}</span>
                        </div>
                        {l.match
                          ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0"/>
                          : <XCircle    className="w-5 h-5 text-red-600 shrink-0"/>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount summary */}
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div><p className="text-xs text-gray-500">Invoice Total</p><p className="text-2xl font-bold text-gray-900">₹{matchInvoice.amount.toLocaleString()}</p></div>
                <div className="text-right"><p className="text-xs text-gray-500">Due Date</p><p className="font-medium text-orange-700">{matchInvoice.dueDate}</p><p className="text-xs text-gray-400">{matchInvoice.paymentTerms}</p></div>
              </div>

              {matchInvoice.matchLines?.every(l => l.match) ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 shrink-0"/>All checks passed — invoice is ready for payment approval.
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-sm text-orange-800">
                  <AlertTriangle className="w-4 h-4 shrink-0"/>Some mismatches detected. Proceed only if you have verified and accepted these differences.
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatchInvoice(null)}>Cancel</Button>
            <Button onClick={() => matchInvoice && handleConfirmMatch(matchInvoice)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2"/>Confirm Match & Approve for Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── RESOLVE DISCREPANCY DIALOG ───────────────────────────────────────── */}
      <Dialog open={!!resolveInv} onOpenChange={o => { if (!o) { setResolveInv(null); setResolution(""); setResolutionType(""); } }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resolve Discrepancy — {resolveInv?.invoiceNumber}</DialogTitle>
            <DialogDescription>{resolveInv?.supplier} · {resolveInv?.issue}</DialogDescription>
          </DialogHeader>
          {resolveInv && (
            <div className="space-y-5">
              {/* Discrepancy detail */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-900 mb-2">Reported Issue: {resolveInv.issue}</p>
                {resolveInv.discrepancyDetails && <p className="text-sm text-red-800">{resolveInv.discrepancyDetails}</p>}
                {resolveInv.matchLines?.filter(l => !l.match).map((l, i) => (
                  <div key={i} className="mt-2 text-xs text-red-700 border-t border-red-200 pt-2">
                    <span className="font-medium">{l.field}:</span> PO says {l.po} · GRN says {l.grn} · Invoice says {l.invoice}
                  </div>
                ))}
              </div>

              {/* Resolution type */}
              <div className="space-y-2">
                <Label>Resolution Action *</Label>
                <Select value={resolutionType} onValueChange={setResolutionType}>
                  <SelectTrigger><SelectValue placeholder="Select resolution…"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accept-partial">Accept Partial — pay for GRN quantity only</SelectItem>
                    <SelectItem value="request-credit-note">Request Credit Note from Supplier</SelectItem>
                    <SelectItem value="recount-grn">Request GRN Recount / Amendment</SelectItem>
                    <SelectItem value="reject">Reject Invoice — return to supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {resolutionType === "accept-partial" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                  Payment will be approved for GRN-verified quantities only. A debit note will be raised for the difference.
                </div>
              )}
              {resolutionType === "request-credit-note" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  Supplier will be notified to issue a credit note. Invoice will remain on hold until credit note is received.
                </div>
              )}
              {resolutionType === "reject" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                  Invoice will be fully rejected. Supplier must resubmit a corrected invoice.
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Resolution Notes *</Label>
                <Textarea
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  rows={3}
                  placeholder="Explain the resolution — what was communicated to the supplier, any agreed adjustments…"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResolveInv(null); setResolution(""); setResolutionType(""); }}>Cancel</Button>
            <Button onClick={() => resolveInv && handleResolveSubmit(resolveInv)}
              variant={resolutionType === "reject" ? "destructive" : "default"}
              disabled={!resolutionType || !resolution.trim()}>
              {resolutionType === "reject" ? "Reject Invoice" : "Apply Resolution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Invoice — real creation flow, previously didn't exist */}
      <Dialog open={addInvoiceOpen} onOpenChange={setAddInvoiceOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Invoice</DialogTitle>
            <DialogDescription>Enter the real details from the vendor's invoice, and attach a copy if you have one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Invoice Number</Label>
                <Input value={newInvoiceNumber} onChange={(e) => setNewInvoiceNumber(e.target.value)} placeholder="INV-2026-001" />
              </div>
              <div>
                <Label>Supplier</Label>
                <Input value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} placeholder="Supplier name" />
              </div>
              <div>
                <Label>PO Number (optional)</Label>
                <Input value={newPoNumber} onChange={(e) => setNewPoNumber(e.target.value)} placeholder="PO-2026-0001" />
              </div>
              <div>
                <Label>GRN Number (optional)</Label>
                <Input value={newGrnNumber} onChange={(e) => setNewGrnNumber(e.target.value)} placeholder="GRN-2026-001" />
              </div>
              <div className="col-span-2">
                <Label>Amount (₹)</Label>
                <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div>
              <Label>Invoice Document</Label>
              <label className="mt-1 flex items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <input type="file" className="hidden" onChange={handleNewInvoiceFile} accept="image/*,.pdf" />
                <div className="text-center">
                  <FileText className="w-6 h-6 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600 mt-1">{newInvoiceFileName || "Click to attach the real invoice document"}</p>
                </div>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddInvoiceOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordInvoice}>Record Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
