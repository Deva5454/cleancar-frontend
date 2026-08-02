import { BackButton } from "../ui/back-button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import { AlertCircle, Upload, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { gstComplianceService } from "../../services/gstComplianceService";
import { DataService } from "../../services/DataService";
import { accountingEntryService } from "../../services/accountingEntryService";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";

// Vendor Payment records live under one DataService key, two shapes:
//  - override records (id = a real gstComplianceService Purchase-transaction id):
//    just carry the status/paymentRef override for an otherwise-derived row.
//  - manual records (manual: true, id = "MANUAL-..."): a full payment request
//    created from the "Prepare Payment" dialog, which has no backing GST
//    transaction, so every display field is stored on the record itself.
interface VendorPaymentRecord {
  id: string;
  status: string;
  paymentRef?: string;
  manual?: boolean;
  vendor?: string;
  invoice?: string;
  amount?: number;
  grn?: string;
  paymentMode?: string;
  date?: string;
}

const readVendorPaymentRecords = (): VendorPaymentRecord[] => {
  try {
    return DataService.get<VendorPaymentRecord>("VENDOR_PAYMENT_STATUS");
  } catch {
    return [];
  }
};

const GRN_LABELS: Record<string, string> = {
  complete: "Complete",
  partial: "Partial",
  pending: "Pending",
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  "bank-transfer": "Bank Transfer",
  upi: "UPI",
  cheque: "Cheque",
  cash: "Cash",
};

export function VendorPayment() {
  const { city, cityInfo } = useCity();
  const { currentRole } = useRole();
  const savedVendors = gstComplianceService.getVendors();
  const getVendorName = (vendorId: string) =>
    savedVendors.find(v => v.id === vendorId)?.name || vendorId;
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [documentUploaded, setDocumentUploaded] = useState(false);

  // Fix 15: merge payment status from DataService so paid status survives reload
  const [payments, setPayments] = useState(() => {
    const allRecords = readVendorPaymentRecords();
    const overridesById = Object.fromEntries(
      allRecords.filter(r => !r.manual).map(r => [r.id, r])
    );
    const derived = gstComplianceService.getVendors().flatMap(v =>
      gstComplianceService.getTransactions()
        .filter(t => t.partyId === v.id && t.transactionType === "Purchase")
        .map(t => ({
          id: t.id,
          vendor: v.name,
          invoice: t.invoiceNumber,
          amount: t.invoiceTotal,
          grn: "Complete",
          status: overridesById[t.id]?.status || "Pending Approval",
          paymentRef: overridesById[t.id]?.paymentRef,
          date: t.invoiceDate,
          paymentMode: "Bank Transfer",
        }))
    );
    const manual = allRecords.filter(r => r.manual).map(r => ({
      id: r.id,
      vendor: r.vendor || "",
      invoice: r.invoice || "",
      amount: r.amount || 0,
      grn: r.grn || "Complete",
      status: r.status,
      paymentRef: r.paymentRef,
      date: r.date || "",
      paymentMode: r.paymentMode || "Bank Transfer",
    }));
    return [...derived, ...manual];
  });

  // Shared persistence for status transitions (Approve/Reject/Mark Paid) —
  // updates the stored record in place if one exists (preserving a manual
  // record's full field set), otherwise adds a minimal override record for
  // a derived (GST-transaction-backed) row.
  const updatePaymentStatus = (payment: any, status: string, paymentRef?: string) => {
    const all = readVendorPaymentRecords();
    const idx = all.findIndex(r => r.id === payment.id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], status, ...(paymentRef ? { paymentRef } : {}) };
    } else {
      all.push({ id: payment.id, status, paymentRef });
    }
    DataService.setAll("VENDOR_PAYMENT_STATUS", all);
    setPayments(prev => prev.map(p =>
      p.id === payment.id ? { ...p, status, ...(paymentRef ? { paymentRef } : {}) } : p
    ));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentUploaded(true);
      toast.success("Document uploaded successfully!");
    }
  };

  const handleSubmitPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!documentUploaded) {
      toast.error("Please upload supporting document!");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const vendorId = String(formData.get("vendor-name") || "");
    const invoice = String(formData.get("invoice") || "").trim();
    const amount = parseFloat(String(formData.get("amount") || ""));
    const grnRaw = String(formData.get("grn-status") || "");
    const paymentModeRaw = String(formData.get("payment-mode") || "");
    const date = String(formData.get("payment-date") || "");

    if (!vendorId || vendorId === "none" || !invoice || !amount || amount <= 0 || !grnRaw || !paymentModeRaw || !date) {
      toast.error("Please fill in all required fields!");
      return;
    }

    const record: VendorPaymentRecord = {
      id: `MANUAL-${Date.now()}`,
      status: "Pending Approval",
      manual: true,
      vendor: getVendorName(vendorId),
      invoice,
      amount,
      grn: GRN_LABELS[grnRaw] || grnRaw,
      paymentMode: PAYMENT_MODE_LABELS[paymentModeRaw] || paymentModeRaw,
      date,
    };
    DataService.setAll("VENDOR_PAYMENT_STATUS", [...readVendorPaymentRecords(), record]);
    setPayments(prev => [...prev, record as any]);

    toast.success("Payment request submitted for Super Admin approval!");
    setPaymentDialogOpen(false);
    setDocumentUploaded(false);
  };

  const handleApprove = (payment: any) => {
    updatePaymentStatus(payment, "Approved");
    toast.success(`Payment to ${payment.vendor} approved.`);
  };

  const handleReject = (payment: any) => {
    updatePaymentStatus(payment, "Rejected");
    toast.warning(`Payment to ${payment.vendor} rejected.`);
  };

  const handleMarkPaid = (payment: any, paymentRef: string) => {
    // Fix 15: persist payment status to DataService so it survives reload
    updatePaymentStatus(payment, "Paid", paymentRef);

    // Post journal entry: DR Creditors, CR Bank
    const creditorLedger = accountingEntryService.getLedgers(city)
      .find(l => l.name === payment.vendor);
    const bankLedger = accountingEntryService.getLedgers(city)
      .find(l => l.name === "Axis Bank" && l.type === "bank");

    if (creditorLedger && bankLedger) {
      accountingEntryService.createJournal({
        date: new Date().toISOString().split("T")[0],
        narration: `Payment to ${payment.vendor} — Ref: ${paymentRef}`,
        lines: [
          { accountHead: creditorLedger.id, accountLabel: creditorLedger.name, debit: payment.amount, credit: 0 },
          { accountHead: bankLedger.id,     accountLabel: bankLedger.name,     debit: 0, credit: payment.amount },
        ],
        city: cityInfo.displayName,
        cityId: city,
        createdBy: "Accounts",
      }, cityInfo.displayName);
      toast.success(`Payment of ₹${(payment?.amount ?? 0).toLocaleString()} posted to ledger. Voucher generated.`);
    } else {
      toast.warning("Payment recorded but ledger entry skipped — creditor or bank ledger not found.");
    }
  };

  const pendingCount = payments.filter(p => p.status === "Pending Approval").length;
  const approvedCount = payments.filter(p => p.status === "Approved").length;
  const paidCount = payments.filter(p => p.status === "Paid").length;
  const rejectedCount = payments.filter(p => p.status === "Rejected").length;
  const partialGrnPending = payments.filter(p => p.grn === "Partial" && p.status !== "Paid").length;

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Payment Processing</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vendor payments with approval workflow</p>
        </div>
        <div className="flex gap-2">
          <Link to="/accounts">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Prepare Payment</Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Prepare Vendor Payment</DialogTitle>
                <DialogDescription>
                  Payment will be sent to Super Admin for approval before execution
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitPayment}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendor-name">Vendor Name *</Label>
                      <Select name="vendor-name" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedVendors.length > 0 ? savedVendors.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name} {v.gstin?"("+v.gstin+")":""}</SelectItem>
                          )) : (
                            <SelectItem value="none" disabled>No vendors. Add in GST → Vendor Master.</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoice">Invoice Reference *</Label>
                      <Input id="invoice" name="invoice" placeholder="INV-2026-XXX" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₹) *</Label>
                      <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grn-status">GRN Status *</Label>
                      <Select name="grn-status" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select GRN status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="complete">Complete</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-mode">Payment Mode *</Label>
                      <Select name="payment-mode" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-date">Payment Date *</Label>
                      <Input id="payment-date" name="payment-date" type="date" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" placeholder="Additional payment notes..." rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document">Document Attachment *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        id="document"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        required
                      />
                      <label htmlFor="document" className="cursor-pointer flex flex-col items-center">
                        {documentUploaded ? (
                          <>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <p className="text-sm text-green-600 mt-2">Document Uploaded</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400" />
                            <p className="text-sm text-gray-600 mt-2">Click to upload invoice/receipt</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit for Approval</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Important Notice */}
      <Card className="bg-blue-50 border-blue-300">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Payment Approval Required</p>
              <p className="text-sm text-blue-700 mt-1">
                All payment disbursements must be approved by Super Admin before execution. Accounts Executive role is for execution only.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold mt-1">{pendingCount}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold mt-1">{approvedCount}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Paid</p>
                <p className="text-2xl font-bold mt-1">{paidCount}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold mt-1">{rejectedCount}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Invoice Ref</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>GRN Status</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.vendor}</TableCell>
                  <TableCell>{payment.invoice}</TableCell>
                  <TableCell>₹{(payment?.amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>
                    {payment.grn === "Partial" ? (
                      <div className="flex items-center gap-1">
                        <Badge variant="destructive">Partial</Badge>
                        <AlertCircle className="w-4 h-4 text-red-600" title="Partial Delivery Alert" />
                      </div>
                    ) : (
                      <Badge variant="secondary">{payment.grn}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{payment.paymentMode}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        payment.status === "Paid" ? "secondary" :
                        payment.status === "Approved" ? "default" :
                        payment.status === "Rejected" ? "destructive" : "outline"
                      }
                    >
                      {payment.status === "Paid" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {payment.status === "Approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {payment.status === "Rejected" && <XCircle className="w-3 h-3 mr-1" />}
                      {payment.status === "Pending Approval" && <Clock className="w-3 h-3 mr-1" />}
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.status === "Approved" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleMarkPaid(payment, payment.invoice)}
                      >
                        Execute Payment
                      </Button>
                    )}
                    {payment.status === "Pending Approval" && (
                      currentRole === "Super Admin" ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => handleApprove(payment)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(payment)}>
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Awaiting Super Admin approval</span>
                      )
                    )}
                    {payment.status === "Rejected" && (
                      <span className="text-sm text-red-600">Rejected</span>
                    )}
                    {payment.status === "Paid" && (
                      <Button size="sm" variant="ghost">View Receipt</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Partial GRN Alert — only shown when a real unpaid payment request has partial GRN status */}
      {partialGrnPending > 0 && (
        <Card className="bg-red-50 border-red-300">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold text-red-900 text-lg">⚠ PARTIAL DELIVERY ALERT</p>
                <p className="text-sm text-red-700 mt-1">
                  {partialGrnPending} payment request{partialGrnPending > 1 ? "s" : ""} {partialGrnPending > 1 ? "have" : "has"} partial GRN status. Goods not fully received from vendor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VendorPayment;
