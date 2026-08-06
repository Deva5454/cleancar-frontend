import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  CreditCard, CheckCircle,
  IndianRupee, Building2, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
// ✅ FIX: previously a disconnected local mock array (INITIAL_PAYMENTS)
// merged with a localStorage key FinanceContext never read — this screen
// could never actually show a payable created anywhere else (GRN receipt,
// Invoice Matching, Payables Dashboard) and paying here never really
// settled anything real. Now reads/acts on the same real Payable data
// every other Accounts screen uses, filtered to type "Vendor" — the
// procurement-side lens on it, with real vendor bank details.
import { useFinance, type Payable } from "../../contexts/FinanceContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { gstComplianceService } from "../../services/gstComplianceService";

export function SupplierPayments() {
  const navigate = useNavigate();
  const { city } = useCity();
  const { currentUser } = useRole();
  const { payables, approvePayable, markAsPaid } = useFinance();
  const vendors = gstComplianceService.getVendors();

  // Matches PayablesDashboard.tsx's own convention: this is a "what's
  // still owed" schedule, not a full history — fully paid payables are
  // excluded once settled (still visible via SupplierDetail's payment
  // history tab or PayablesDashboard).
  const vendorPayments = payables.filter((p: Payable) => p.type === "Vendor" && p.cityId === city && p.status !== "Paid");
  const bankDetailsFor = (p: Payable) => vendors.find(v => v.id === p.vendorId);
  const remainingBalance = (p: Payable) => Math.round((p.amount - (p.paidAmount || 0)) * 100) / 100;

  const [viewPayment, setViewPayment] = useState<Payable | null>(null);
  const [payDialog, setPayDialog]     = useState<Payable | null>(null);
  const [utrNumber, setUtrNumber]     = useState("");
  const [payMethod, setPayMethod]     = useState<Payable["paymentMethod"]>("Bank Transfer");
  const [payMode, setPayMode]         = useState<"full" | "partial">("full");
  const [payAmountStr, setPayAmountStr] = useState("");

  // ── Approve ─────────────────────────────────────────────────────────────────
  const handleApprove = (payment: Payable) => {
    approvePayable(payment.payableId, currentUser?.name || "Procurement Manager");
    toast.success(`${payment.description} approved — scheduled for payment`);
  };

  // ── Pay Now — real settlement via FinanceContext.markAsPaid ──────────────
  const handleOpenPayDialog = (payment: Payable) => {
    setPayDialog(payment);
    setUtrNumber("");
    setPayMethod("Bank Transfer");
    setPayMode("full");
    setPayAmountStr(String(remainingBalance(payment)));
  };

  const handleConfirmPayment = () => {
    if (!utrNumber.trim()) { toast.error("Enter UTR / transaction reference number"); return; }
    if (!payDialog) return;
    const remaining = remainingBalance(payDialog);
    const payAmount = payMode === "partial" ? (parseFloat(payAmountStr) || 0) : remaining;
    if (payAmount <= 0) { toast.error("Enter a payment amount greater than ₹0"); return; }
    if (payAmount > remaining + 0.01) { toast.error(`Cannot pay more than the remaining balance of ₹${remaining.toLocaleString("en-IN")}`); return; }

    markAsPaid(payDialog.payableId, utrNumber.trim(), payMethod, payAmount);

    const isFull = payAmount >= remaining - 0.01;
    toast.success(`₹${payAmount.toLocaleString("en-IN")} ${isFull ? "paid" : "paid (partial)"} to ${payDialog.vendorName || payDialog.description}`, {
      description: `UTR: ${utrNumber} · Posted to the real Finance ledger`,
    });
    setPayDialog(null);
  };

  // ── Stats (live, real) ────────────────────────────────────────────────────
  const pending  = vendorPayments.filter((p: Payable) => p.status === "Pending").length;
  const approved = vendorPayments.filter((p: Payable) => p.status === "Approved").length;
  const overdue  = vendorPayments.filter((p: Payable) => p.status === "Overdue").length;
  const partial  = vendorPayments.filter((p: Payable) => p.status === "Partially Paid").length;
  const totalAmt = vendorPayments.reduce((s: number, p: Payable) => s + remainingBalance(p), 0);

  const statusVariant = (s: Payable["status"]): "destructive"|"default"|"outline"|"secondary" =>
    s === "Pending" || s === "Overdue" ? "destructive" :
    s === "Approved" ? "default" :
    s === "Partially Paid" ? "secondary" :
    "outline";

  const cardColor = (s: Payable["status"]) =>
    s === "Overdue" ? "border-red-300 bg-red-50" :
    s === "Approved" ? "border-blue-200" :
    s === "Partially Paid" ? "border-blue-200 bg-blue-50" :
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
          { label:"Pending",          val:pending,  color:"text-orange-600" },
          { label:"Approved",         val:approved, color:"text-blue-600" },
          { label:"Overdue",          val:overdue,  color:"text-red-600" },
          { label:"Partially Paid",   val:partial,  color:"text-blue-600" },
          { label:"Outstanding",      val:`₹${(totalAmt/1000).toFixed(0)}K`, color:"text-purple-600" },
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
            {vendorPayments.map((payment: Payable) => {
              const remaining = remainingBalance(payment);
              return (
              <div key={payment.payableId} className={`flex items-center justify-between p-4 border rounded-lg ${cardColor(payment.status)}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <CreditCard className={`w-5 h-5 shrink-0 ${payment.status === "Overdue" ? "text-red-600" : payment.status === "Paid" ? "text-green-600" : "text-blue-600"}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{payment.description}</p>
                      <Badge variant={statusVariant(payment.status)}>{payment.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 flex-wrap">
                      <span>{payment.vendorName || "—"}</span><span>·</span>
                      {payment.invoiceNumber && <><span>Inv: {payment.invoiceNumber}</span><span>·</span></>}
                      {payment.poNumber && <><span>PO: {payment.poNumber}</span><span>·</span></>}
                      <span>Due: {payment.dueDate}</span>
                      {payment.paidAt && payment.status !== "Partially Paid" && <span className="text-green-600">· Paid: {new Date(payment.paidAt).toLocaleDateString("en-IN")}</span>}
                      {payment.paymentReference && <span className="text-gray-400 font-mono text-xs">· {payment.paymentReference}</span>}
                    </div>
                  </div>
                  <div className="text-right mr-4 shrink-0">
                    <p className="font-bold text-lg">₹{remaining.toLocaleString()}</p>
                    {payment.status === "Partially Paid" && <p className="text-xs text-gray-400">of ₹{payment.amount.toLocaleString()}</p>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {payment.status === "Pending" && (
                    <Button size="sm" onClick={() => handleApprove(payment)}>
                      <CheckCircle className="w-4 h-4 mr-1"/>Approve
                    </Button>
                  )}
                  {(payment.status === "Approved" || payment.status === "Overdue" || payment.status === "Partially Paid") && (
                    <Button size="sm" variant={payment.status === "Overdue" ? "destructive" : "default"}
                      onClick={() => handleOpenPayDialog(payment)}>
                      <CreditCard className="w-4 h-4 mr-1"/>Pay Now
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setViewPayment(payment)}>View</Button>
                </div>
              </div>
              );
            })}
            {vendorPayments.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No supplier payments yet — these appear once a GRN is received against a PO, or an invoice is matched.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── VIEW PAYMENT DIALOG ──────────────────────────────────────────────── */}
      <Dialog open={!!viewPayment} onOpenChange={o => { if (!o) setViewPayment(null); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details — {viewPayment?.description}</DialogTitle>
            <DialogDescription>{viewPayment?.vendorName} · Due: {viewPayment?.dueDate}</DialogDescription>
          </DialogHeader>
          {viewPayment && (() => {
            const bank = bankDetailsFor(viewPayment);
            const remaining = remainingBalance(viewPayment);
            return (
            <div className="space-y-5">
              {/* Status bar */}
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant(viewPayment.status)} className="text-sm px-3 py-1">{viewPayment.status}</Badge>
              </div>

              {/* Real supplier bank details from the Vendor Master */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-blue-900 mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5"/>Supplier Bank Details
                </p>
                {bank ? (
                  <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                    <span className="text-blue-700">Supplier</span><span className="font-medium">{bank.name}</span>
                    <span className="text-blue-700">GSTIN</span><span className="font-mono">{bank.gstin}</span>
                    <span className="text-blue-700">Account No.</span><span className="font-mono">{bank.bankAccountNumber || "Not on file"}</span>
                    <span className="text-blue-700">IFSC Code</span><span className="font-mono">{bank.ifscCode || "Not on file"}</span>
                  </div>
                ) : (
                  <p className="text-xs text-blue-700">{viewPayment.vendorName || "No linked vendor"} — not in the Vendor Master, so no bank details on file.</p>
                )}
              </div>

              {/* Payment info */}
              <div className="space-y-1.5 text-sm">
                {viewPayment.invoiceNumber && <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Invoice</span><span className="font-medium">{viewPayment.invoiceNumber}</span></div>}
                {viewPayment.poNumber && <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">PO Reference</span><span className="font-medium">{viewPayment.poNumber}</span></div>}
                <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Due Date</span><span className={`font-medium ${viewPayment.status === "Overdue" ? "text-red-600" : ""}`}>{viewPayment.dueDate}</span></div>
                {viewPayment.approvedBy && <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Approved By</span><span>{viewPayment.approvedBy}</span></div>}
                {(viewPayment.paidAmount || 0) > 0 && <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Paid On</span><span className="text-green-700 font-medium">{viewPayment.paidAt ? new Date(viewPayment.paidAt).toLocaleDateString("en-IN") : "—"}</span></div>}
                {viewPayment.paymentReference && <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">UTR / Ref No.</span><span className="font-mono text-xs">{viewPayment.paymentReference}</span></div>}
                {viewPayment.paymentHistory && viewPayment.paymentHistory.length > 1 && (
                  <div className="pt-1">
                    <span className="text-gray-500 text-xs">Payment history</span>
                    {viewPayment.paymentHistory.map((h, i) => (
                      <div key={i} className="flex justify-between text-xs mt-1">
                        <span className="font-mono text-gray-400">{h.reference}</span>
                        <span>₹{h.amount.toLocaleString()} · {new Date(h.paidAt).toLocaleDateString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-gray-500"/><span className="text-sm font-medium">{viewPayment.status === "Partially Paid" ? "Remaining Balance" : "Total Amount"}</span></div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">₹{remaining.toLocaleString()}</p>
                  {viewPayment.status === "Partially Paid" && <p className="text-xs text-gray-400">of ₹{viewPayment.amount.toLocaleString()}</p>}
                </div>
              </div>

              {viewPayment.status === "Paid" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 shrink-0"/>Payment completed — posted to the real Finance ledger
                </div>
              )}
            </div>
            );
          })()}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewPayment(null)}>Close</Button>
            {viewPayment && (viewPayment.status === "Approved" || viewPayment.status === "Overdue" || viewPayment.status === "Partially Paid") && (
              <Button onClick={() => { handleOpenPayDialog(viewPayment); setViewPayment(null); }}>
                <CreditCard className="w-4 h-4 mr-2"/>Pay Now
              </Button>
            )}
            {viewPayment?.status === "Paid" && (
              <Button variant="outline" onClick={() => navigate("/accounts/payables")}>
                <ExternalLink className="w-4 h-4 mr-2"/>View in Payables
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PAY NOW DIALOG ───────────────────────────────────────────────────── */}
      <Dialog open={!!payDialog} onOpenChange={o => { if (!o) setPayDialog(null); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Payment — {payDialog?.description}</DialogTitle>
            <DialogDescription>
              {payDialog?.vendorName} · Due: {payDialog?.dueDate}
            </DialogDescription>
          </DialogHeader>
          {payDialog && (() => {
            const bank = bankDetailsFor(payDialog);
            const remaining = remainingBalance(payDialog);
            return (
            <div className="space-y-5">
              {/* Real supplier bank details from the Vendor Master */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5"/>Pay To
                </p>
                {bank ? (
                  <div className="grid grid-cols-2 gap-y-1 text-xs text-blue-800">
                    <span>Account No.</span><span className="font-mono">{bank.bankAccountNumber || "Not on file"}</span>
                    <span>IFSC</span><span className="font-mono">{bank.ifscCode || "Not on file"}</span>
                  </div>
                ) : (
                  <p className="text-xs text-blue-800">{payDialog.vendorName || "No linked vendor"} — not in the Vendor Master, so no bank details on file.</p>
                )}
              </div>

              {/* Remaining balance */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-gray-700">Remaining Balance</span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">₹{remaining.toLocaleString()}</p>
                  {(payDialog.paidAmount || 0) > 0 && <p className="text-xs text-gray-400">of ₹{payDialog.amount.toLocaleString()}</p>}
                </div>
              </div>

              {/* Full / partial */}
              <div>
                <Label className="text-xs mb-1.5 block">Payment Amount</Label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button type="button" onClick={() => { setPayMode("full"); setPayAmountStr(String(remaining)); }}
                    className={`text-sm px-3 py-2 rounded-lg border transition-colors ${payMode === "full" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"}`}>
                    Pay in full
                  </button>
                  <button type="button" onClick={() => setPayMode("partial")}
                    className={`text-sm px-3 py-2 rounded-lg border transition-colors ${payMode === "partial" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"}`}>
                    Pay partial amount
                  </button>
                </div>
                {payMode === "partial" && (
                  <Input type="number" min="0" max={remaining} value={payAmountStr} onChange={e => setPayAmountStr(e.target.value)}
                    placeholder={`Up to ₹${remaining.toLocaleString()}`} />
                )}
              </div>

              {/* Payment fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Method</Label>
                  <Select value={payMethod} onValueChange={v => setPayMethod(v as Payable["paymentMethod"])}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">UTR / Transaction Reference Number *</Label>
                  <Input value={utrNumber} onChange={e => setUtrNumber(e.target.value)}
                    placeholder="e.g. UTR0000123456"/>
                </div>
              </div>
            </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>Cancel</Button>
            <Button onClick={handleConfirmPayment}
              disabled={!utrNumber.trim() || (payMode === "partial" && (!parseFloat(payAmountStr) || parseFloat(payAmountStr) <= 0))}
              className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2"/>Confirm Payment & Go to Finance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
