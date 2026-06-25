import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  CreditCard, CheckCircle, Clock, AlertTriangle,
  IndianRupee, FileText, Building2, ArrowRight, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Payment {
  paymentId:     string;
  supplier:      string;
  supplierGSTIN?: string;
  supplierBank?:  string;
  supplierIfsc?:  string;
  supplierAccNo?: string;
  invoices:      string[];
  amount:        number;
  dueDate:       string;
  status:        "Pending Approval" | "Scheduled" | "Overdue" | "Paid" | "Processing";
  paymentMethod: string;
  daysOverdue?:  number;
  paidDate?:     string;
  utrNumber?:    string;
  approvedBy?:   string;
  notes?:        string;
}

// ── Seed data ─────────────────────────────────────────────────────────────────
const INITIAL_PAYMENTS: Payment[] = [
  {
    paymentId:"PAY-2026-015", supplier:"ChemClean Industries",
    supplierGSTIN:"27AABCC1234A1ZP", supplierBank:"HDFC Bank",
    supplierAccNo:"50100234567890", supplierIfsc:"HDFC0001234",
    invoices:["INV-2603-044"], amount:52000,
    dueDate:"Mar 20, 2026", status:"Scheduled", paymentMethod:"NEFT",
    notes:"Full payment for foam guns and pressure washer nozzles",
  },
  {
    paymentId:"PAY-2026-014", supplier:"ProWash Equipment",
    supplierGSTIN:"27AABCP9876B1ZT", supplierBank:"ICICI Bank",
    supplierAccNo:"123456789012", supplierIfsc:"ICIC0004567",
    invoices:["INV-2603-043"], amount:95000,
    dueDate:"Mar 18, 2026", status:"Pending Approval", paymentMethod:"RTGS",
    notes:"Payment for bulk cleaning chemicals order",
  },
  {
    paymentId:"PAY-2026-013", supplier:"AutoCare Solutions",
    supplierGSTIN:"29AABCA5432C1ZM", supplierBank:"SBI",
    supplierAccNo:"30987654321098", supplierIfsc:"SBIN0005678",
    invoices:["INV-2603-041","INV-2603-042"], amount:127000,
    dueDate:"Mar 15, 2026", status:"Overdue", paymentMethod:"NEFT",
    daysOverdue:2, notes:"Two invoices bundled — microfiber and equipment",
  },
  {
    paymentId:"PAY-2026-012", supplier:"CarCare Supplies",
    supplierGSTIN:"27AABCC9876D1ZK", supplierBank:"Axis Bank",
    supplierAccNo:"915010098765432", supplierIfsc:"UTIB0003456",
    invoices:["INV-2603-040"], amount:42000,
    dueDate:"Mar 10, 2026", status:"Paid", paymentMethod:"NEFT",
    paidDate:"Mar 10, 2026", utrNumber:"NEFT2026031098765",
    approvedBy:"Ramesh Patel (Finance Head)",
  },
];

const loadPayments = (): Payment[] => {
  try {
    const stored = localStorage.getItem("cleancar_supplier_payments");
    const parsed = stored ? JSON.parse(stored) : [];
    if (parsed.length === 0) return INITIAL_PAYMENTS;
    // Merge any new payments (from InvoiceMatching approve) with seed
    const storedIds = new Set(parsed.map((p: any) => p.paymentId));
    return [...parsed, ...INITIAL_PAYMENTS.filter(p => !storedIds.has(p.paymentId))];
  } catch { return INITIAL_PAYMENTS; }
};

export function SupplierPayments() {
  const navigate = useNavigate();
  const [payments, setPayments]       = useState<Payment[]>(loadPayments);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);
  const [payDialog, setPayDialog]     = useState<Payment | null>(null);
  const [utrNumber, setUtrNumber]     = useState("");
  const [payDate, setPayDate]         = useState(new Date().toISOString().split("T")[0]);
  const [payNotes, setPayNotes]       = useState("");
  const [payMethod, setPayMethod]     = useState("");

  const persist = (updated: Payment[]) => {
    try { localStorage.setItem("cleancar_supplier_payments", JSON.stringify(updated)); } catch {}
    setPayments(updated);
  };

  // ── Approve ─────────────────────────────────────────────────────────────────
  const handleApprove = (payment: Payment) => {
    const updated = payments.map(p =>
      p.paymentId === payment.paymentId
        ? { ...p, status:"Scheduled" as const, approvedBy:"Procurement Manager" }
        : p
    );
    persist(updated);
    toast.success(`${payment.paymentId} approved — scheduled for payment`);
  };

  // ── Pay Now — opens dialog, then routes to Finance ───────────────────────
  const handleOpenPayDialog = (payment: Payment) => {
    setPayDialog(payment);
    setUtrNumber("");
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayNotes("");
    setPayMethod(payment.paymentMethod);
  };

  const handleConfirmPayment = () => {
    if (!utrNumber.trim()) { toast.error("Enter UTR / transaction reference number"); return; }
    if (!payDate) { toast.error("Enter payment date"); return; }
    if (!payDialog) return;

    const updated = payments.map(p =>
      p.paymentId === payDialog.paymentId
        ? { ...p, status:"Paid" as const, paidDate: new Date(payDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}), utrNumber, approvedBy:"Procurement Manager", notes: payNotes || p.notes }
        : p
    );
    persist(updated);

    // Write to finance ledger
    try {
      const ledger = JSON.parse(localStorage.getItem("cleancar_finance_transactions") || "[]");
      ledger.unshift({
        id: `TXN-${Date.now()}`,
        type: "Payment",
        description: `Supplier payment — ${payDialog.supplier}`,
        paymentId: payDialog.paymentId,
        invoices: payDialog.invoices,
        amount: -payDialog.amount,
        date: payDate,
        utrNumber,
        paymentMethod: payMethod || payDialog.paymentMethod,
        category: "Procurement",
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("cleancar_finance_transactions", JSON.stringify(ledger));
    } catch {}

    toast.success(`Payment recorded — ₹${payDialog.amount.toLocaleString()} to ${payDialog.supplier}`, {
      description: `UTR: ${utrNumber} · Transaction posted to Finance ledger`,
    });
    setPayDialog(null);
    // Route to Finance for reconciliation
    navigate("/finance");
  };

  // ── Stats (live) ──────────────────────────────────────────────────────────
  const pending  = payments.filter(p => p.status === "Pending Approval").length;
  const scheduled= payments.filter(p => p.status === "Scheduled").length;
  const overdue  = payments.filter(p => p.status === "Overdue").length;
  const paid     = payments.filter(p => p.status === "Paid").length;
  const totalAmt = payments.reduce((s, p) => s + p.amount, 0);

  const statusVariant = (s: string): "destructive"|"default"|"outline"|"secondary" =>
    s === "Pending Approval" || s === "Overdue" ? "destructive" :
    s === "Scheduled" ? "default" :
    s === "Paid" ? "outline" : "secondary";

  const cardColor = (s: string) =>
    s === "Overdue" ? "border-red-300 bg-red-50" :
    s === "Scheduled" ? "border-blue-200" :
    s === "Paid" ? "border-green-200 bg-green-50" : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Supplier Payments</h2>
        <p className="text-sm text-gray-500 mt-1">Track payment obligations, record payments, and manage supplier outstanding balances</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label:"Pending Approval", val:pending,   color:"text-orange-600" },
          { label:"Scheduled",        val:scheduled, color:"text-blue-600" },
          { label:"Overdue",          val:overdue,   color:"text-red-600" },
          { label:"Paid",             val:paid,      color:"text-green-600" },
          { label:"Total Amount",     val:`₹${(totalAmt/1000).toFixed(0)}K`, color:"text-purple-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment list */}
      <Card>
        <CardHeader><CardTitle className="text-base">Payment Schedule</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.map(payment => (
              <div key={payment.paymentId} className={`flex items-center justify-between p-4 border rounded-lg ${cardColor(payment.status)}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <CreditCard className={`w-5 h-5 shrink-0 ${payment.status === "Overdue" ? "text-red-600" : payment.status === "Paid" ? "text-green-600" : "text-blue-600"}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{payment.paymentId}</p>
                      <Badge variant={statusVariant(payment.status)}>{payment.status}</Badge>
                      <Badge variant="secondary">{payment.paymentMethod}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 flex-wrap">
                      <span>{payment.supplier}</span><span>·</span>
                      <span>{payment.invoices.length} invoice{payment.invoices.length>1?"s":""}</span><span>·</span>
                      <span>Due: {payment.dueDate}</span>
                      {payment.daysOverdue && <span className="text-red-600 font-medium">· {payment.daysOverdue} days overdue</span>}
                      {payment.paidDate && <span className="text-green-600">· Paid: {payment.paidDate}</span>}
                      {payment.utrNumber && <span className="text-gray-400 font-mono text-xs">· {payment.utrNumber}</span>}
                    </div>
                  </div>
                  <p className="font-bold text-lg mr-4 shrink-0">₹{payment.amount.toLocaleString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {payment.status === "Pending Approval" && (
                    <Button size="sm" onClick={() => handleApprove(payment)}>
                      <CheckCircle className="w-4 h-4 mr-1"/>Approve
                    </Button>
                  )}
                  {(payment.status === "Scheduled" || payment.status === "Overdue") && (
                    <Button size="sm" variant={payment.status === "Overdue" ? "destructive" : "default"}
                      onClick={() => handleOpenPayDialog(payment)}>
                      <CreditCard className="w-4 h-4 mr-1"/>Pay Now
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setViewPayment(payment)}>View</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── VIEW PAYMENT DIALOG ──────────────────────────────────────────────── */}
      <Dialog open={!!viewPayment} onOpenChange={o => { if (!o) setViewPayment(null); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details — {viewPayment?.paymentId}</DialogTitle>
            <DialogDescription>{viewPayment?.supplier} · Due: {viewPayment?.dueDate}</DialogDescription>
          </DialogHeader>
          {viewPayment && (
            <div className="space-y-5">
              {/* Status bar */}
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant(viewPayment.status)} className="text-sm px-3 py-1">{viewPayment.status}</Badge>
                <Badge variant="secondary">{viewPayment.paymentMethod}</Badge>
                {viewPayment.daysOverdue && <span className="text-xs text-red-600 font-medium">⚠ {viewPayment.daysOverdue} days overdue</span>}
              </div>

              {/* Supplier bank details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-blue-900 mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5"/>Supplier Bank Details
                </p>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                  <span className="text-blue-700">Supplier</span><span className="font-medium">{viewPayment.supplier}</span>
                  <span className="text-blue-700">GSTIN</span><span className="font-mono">{viewPayment.supplierGSTIN}</span>
                  <span className="text-blue-700">Bank</span><span className="font-medium">{viewPayment.supplierBank}</span>
                  <span className="text-blue-700">Account No.</span><span className="font-mono">{viewPayment.supplierAccNo}</span>
                  <span className="text-blue-700">IFSC Code</span><span className="font-mono">{viewPayment.supplierIfsc}</span>
                </div>
              </div>

              {/* Payment info */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Invoices</span><span className="font-medium">{viewPayment.invoices.join(", ")}</span></div>
                <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Due Date</span><span className={`font-medium ${viewPayment.status === "Overdue" ? "text-red-600" : ""}`}>{viewPayment.dueDate}</span></div>
                <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Payment Method</span><span>{viewPayment.paymentMethod}</span></div>
                {viewPayment.approvedBy && <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Approved By</span><span>{viewPayment.approvedBy}</span></div>}
                {viewPayment.paidDate  && <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Paid On</span><span className="text-green-700 font-medium">{viewPayment.paidDate}</span></div>}
                {viewPayment.utrNumber && <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">UTR / Ref No.</span><span className="font-mono text-xs">{viewPayment.utrNumber}</span></div>}
                {viewPayment.notes     && <div className="flex justify-between pt-1"><span className="text-gray-500">Notes</span><span className="text-gray-700 text-right max-w-xs">{viewPayment.notes}</span></div>}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-gray-500"/><span className="text-sm font-medium">Total Amount</span></div>
                <p className="text-2xl font-bold text-gray-900">₹{viewPayment.amount.toLocaleString()}</p>
              </div>

              {viewPayment.status === "Paid" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 shrink-0"/>Payment completed — transaction posted to Finance ledger
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewPayment(null)}>Close</Button>
            {(viewPayment?.status === "Scheduled" || viewPayment?.status === "Overdue") && (
              <Button onClick={() => { handleOpenPayDialog(viewPayment!); setViewPayment(null); }}>
                <CreditCard className="w-4 h-4 mr-2"/>Pay Now
              </Button>
            )}
            {viewPayment?.status === "Paid" && (
              <Button variant="outline" onClick={() => navigate("/finance")}>
                <ExternalLink className="w-4 h-4 mr-2"/>View in Finance
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PAY NOW DIALOG ───────────────────────────────────────────────────── */}
      <Dialog open={!!payDialog} onOpenChange={o => { if (!o) setPayDialog(null); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Payment — {payDialog?.paymentId}</DialogTitle>
            <DialogDescription>
              {payDialog?.supplier} · ₹{payDialog?.amount.toLocaleString()} · Due: {payDialog?.dueDate}
            </DialogDescription>
          </DialogHeader>
          {payDialog && (
            <div className="space-y-5">
              {/* Supplier bank details for reference */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5"/>Pay To
                </p>
                <div className="grid grid-cols-2 gap-y-1 text-xs text-blue-800">
                  <span>Bank</span><span className="font-medium">{payDialog.supplierBank}</span>
                  <span>Account No.</span><span className="font-mono">{payDialog.supplierAccNo}</span>
                  <span>IFSC</span><span className="font-mono">{payDialog.supplierIfsc}</span>
                </div>
              </div>

              {/* Amount (read-only) */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-gray-700">Amount to Pay</span>
                <p className="text-2xl font-bold text-gray-900">₹{payDialog.amount.toLocaleString()}</p>
              </div>

              {/* Payment fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment Method</Label>
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEFT">NEFT</SelectItem>
                        <SelectItem value="RTGS">RTGS</SelectItem>
                        <SelectItem value="IMPS">IMPS</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment Date *</Label>
                    <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}/>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">UTR / Transaction Reference Number *</Label>
                  <Input value={utrNumber} onChange={e => setUtrNumber(e.target.value)}
                    placeholder={`e.g. ${payMethod === "RTGS" ? "RTGS" : "NEFT"}${new Date().getFullYear()}${String(Math.floor(Math.random()*100000000)).padStart(8,"0")}`}/>
                  <p className="text-xs text-gray-400">This will be used for reconciliation in the Finance ledger</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes (optional)</Label>
                  <Textarea value={payNotes} onChange={e => setPayNotes(e.target.value)} rows={2}
                    placeholder="Any notes about this payment…"/>
                </div>
              </div>

              {/* After payment info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2 text-xs text-yellow-800">
                <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5"/>
                <span>After confirming, you will be redirected to the <strong>Finance module</strong> for ledger reconciliation. The transaction will be posted automatically.</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>Cancel</Button>
            <Button onClick={handleConfirmPayment}
              disabled={!utrNumber.trim() || !payDate}
              className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2"/>Confirm Payment & Go to Finance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
