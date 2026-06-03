import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/formatters";
import { toast } from "sonner";
import {
  DollarSign,
  Calendar,
  AlertCircle,
  RefreshCw,
  Filter,
  Download,
  Eye,
  FileText,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BackButton } from "../ui/back-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService } from "../../services/accountingEntryService";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  paymentDate: string;
  paymentMode: string;
  paymentReference: string;
  amount: number;
  city?: string;
  cluster?: string;
  createdAt: string;
  createdBy: string;
  paymentTransactionId?: string;
}

interface PaymentFilters {
  city: string;
  paymentMode: string;
  dateRange: string;
  searchQuery: string;
}

interface PaymentListResponse {
  payments: Payment[];
  totalCount: number;
  totalAmount: number;
  page: number;
  pageSize: number;
}

interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  byMode: {
    mode: string;
    count: number;
    amount: number;
  }[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

// ✅ FIXED: Removed hardcoded mockPayments — real payments come from FinanceContext
const mockPayments: Payment[] = []; // empty — no fake data

// mockSummary removed — summary is now computed from real payment data in loadPayments()

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchPayments(
  filters: PaymentFilters,
  cityId: string
): Promise<PaymentListResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Pull real payment journals: receipts posted as DR Bank/Cash, CR Accounts Receivable
  const allJournals = accountingEntryService.getAllJournals(cityId);
  const allLedgers  = accountingEntryService.getLedgers(cityId);

  const arLedger   = allLedgers.find(l => l.name === "Accounts Receivable");
  const bankLedger = allLedgers.find(l => l.name === "Axis Bank" && l.type === "bank");
  const cashLedger = allLedgers.find(l => l.name === "Petty Cash");

  const paymentJournals = allJournals.filter(jv => {
    if (jv.status !== "Posted") return false;
    const hasARCredit = jv.lines.some(
      l => arLedger && l.accountHead === arLedger.id && l.credit > 0
    );
    return hasARCredit;
  });

  const journalPayments: Payment[] = paymentJournals.map((jv, idx) => {
    const bankLine = jv.lines.find(
      l => (bankLedger && l.accountHead === bankLedger.id) ||
           (cashLedger && l.accountHead === cashLedger.id)
    );
    const mode = bankLine && cashLedger && bankLine.accountHead === cashLedger.id
      ? "CASH" : "BANK_TRANSFER";
    const amount = Math.max(...jv.lines.map(l => l.debit));
    const invoiceMatch = jv.narration.match(/Invoice (INV-[\w-]+)/i);
    const customerMatch = jv.narration.match(/from (.+?) —/i);
    return {
      id: jv.id,
      paymentNumber: `PAY-${String(idx + 1).padStart(4, "0")}`,
      invoiceId: invoiceMatch?.[1] || "",
      invoiceNumber: invoiceMatch?.[1] || "—",
      customerName: customerMatch?.[1] || "—",
      paymentDate: jv.date,
      paymentMode: mode,
      paymentReference: jv.voucherNumber,
      amount,
      city: jv.cityId,
      createdAt: jv.createdAt,
      createdBy: jv.createdBy || "System",
    };
  });

  // Also read seeded payments from localStorage
  const seededKey = `cleancar_${cityId}_payments`;
  const seededRaw: any[] = JSON.parse(localStorage.getItem(seededKey) || "[]");
  const seededPayments: Payment[] = seededRaw.map((p: any) => ({
    id: p.id,
    paymentNumber: p.paymentNumber,
    invoiceId: p.invoiceId || "",
    invoiceNumber: p.invoiceNumber || "—",
    customerName: p.customerName || "—",
    paymentDate: p.paymentDate,
    paymentMode: p.paymentMode || "BANK_TRANSFER",
    paymentReference: p.paymentReference || "",
    amount: p.amount,
    city: p.city || cityId,
    createdAt: p.createdAt,
    createdBy: p.createdBy || "Seed",
  }));

  // Also include payments from web buy-page invoices
  const webInvoices: any[] = (() => {
    try { return JSON.parse(localStorage.getItem("cleancar_web_invoices") || "[]"); }
    catch { return []; }
  })();
  const webPayments: Payment[] = webInvoices.map((wi: any, idx: number) => ({
    id: `WEB-PAY-${wi.invoiceNumber}`,
    paymentNumber: `WEB-${String(idx + 1).padStart(4, "0")}`,
    invoiceId: wi.invoiceNumber,
    invoiceNumber: wi.invoiceNumber,
    customerName: wi.customerName || "Web Customer",
    paymentDate: wi.createdAt?.split("T")[0] || "",
    paymentMode: "UPI" as const,
    paymentReference: `Razorpay — ${wi.invoiceNumber}`,
    amount: wi.grandTotal || wi.subtotal || 0,
    city: wi.cityId || cityId,
    createdAt: wi.createdAt || "",
    createdBy: "Web Buy Page",
  }));

  // Merge, deduplicate
  const journalIds = new Set(journalPayments.map(p => p.id));
  const seededIds  = new Set(seededPayments.map(p => p.id));
  let livePayments: Payment[] = [
    ...journalPayments,
    ...seededPayments.filter(p => !journalIds.has(p.id)),
    ...webPayments.filter(p => !journalIds.has(p.id) && !seededIds.has(p.id)),
  ];

  if (filters.city !== "all") {
    livePayments = livePayments.filter(p => p.city === filters.city || p.city?.includes(filters.city));
  }
  if (filters.paymentMode !== "all") {
    livePayments = livePayments.filter(p => p.paymentMode === filters.paymentMode);
  }
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    livePayments = livePayments.filter(
      p => p.paymentNumber.toLowerCase().includes(q) ||
           p.invoiceNumber.toLowerCase().includes(q) ||
           p.customerName.toLowerCase().includes(q)
    );
  }

  const totalAmount = livePayments.reduce((s, p) => s + p.amount, 0);
  return { payments: livePayments, totalCount: livePayments.length, totalAmount, page: 1, pageSize: 100 };
}

// fetchPaymentSummary removed — summary computed inline in loadPayments() from real data

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaymentModeBadge(mode: string) {
  const modeConfig: Record<
    string,
    { color: string; label: string }
  > = {
    CASH: { color: "bg-green-100 text-green-800", label: "Cash" },
    CARD: { color: "bg-blue-100 text-blue-800", label: "Card" },
    UPI: { color: "bg-purple-100 text-purple-800", label: "UPI" },
    BANK_TRANSFER: { color: "bg-orange-100 text-orange-800", label: "Bank Transfer" },
    CHEQUE: { color: "bg-yellow-100 text-yellow-800", label: "Cheque" },
  };

  const config = modeConfig[mode] || {
    color: "bg-gray-100 text-gray-800",
    label: mode,
  };

  return <Badge className={config.color}>{config.label}</Badge>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PaymentManagement() {
  const { city } = useCity();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [showMakeForm, setShowMakeForm] = useState(false);
  const [receiveForm, setReceiveForm] = useState({ partyName: "", amount: "", mode: "CASH", reference: "", date: new Date().toISOString().split("T")[0], narration: "" });
  const [makeForm, setMakeForm] = useState({ partyName: "", amount: "", mode: "BANK_TRANSFER", reference: "", date: new Date().toISOString().split("T")[0], narration: "" });
  const [isSaving, setIsSaving] = useState(false);

  async function handleReceivePayment() {
    if (!receiveForm.partyName || !receiveForm.amount) { toast.error("Party name and amount are required"); return; }
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 300));
    const newPay: Payment = {
      id: `PAY-${Date.now()}`,
      paymentNumber: `RCV-${String(payments.length + 1).padStart(4,"0")}`,
      invoiceId: "",
      invoiceNumber: receiveForm.reference || "—",
      customerName: receiveForm.partyName,
      paymentDate: receiveForm.date,
      paymentMode: receiveForm.mode,
      paymentReference: receiveForm.reference,
      amount: parseFloat(receiveForm.amount),
      city,
      createdAt: new Date().toISOString(),
      createdBy: "Finance",
    };
    setPayments(prev => [newPay, ...prev]);
    setShowReceiveForm(false);
    setReceiveForm({ partyName: "", amount: "", mode: "CASH", reference: "", date: new Date().toISOString().split("T")[0], narration: "" });
    setIsSaving(false);
    toast.success(`Payment of ₹${receiveForm.amount} received from ${receiveForm.partyName}`);
  }

  async function handleMakePayment() {
    if (!makeForm.partyName || !makeForm.amount) { toast.error("Party name and amount are required"); return; }
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 300));
    const newPay: Payment = {
      id: `PAY-${Date.now()}`,
      paymentNumber: `PMT-${String(payments.length + 1).padStart(4,"0")}`,
      invoiceId: "",
      invoiceNumber: makeForm.reference || "—",
      customerName: makeForm.partyName,
      paymentDate: makeForm.date,
      paymentMode: makeForm.mode,
      paymentReference: makeForm.reference,
      amount: -parseFloat(makeForm.amount),
      city,
      createdAt: new Date().toISOString(),
      createdBy: "Finance",
    };
    setPayments(prev => [newPay, ...prev]);
    setShowMakeForm(false);
    setMakeForm({ partyName: "", amount: "", mode: "BANK_TRANSFER", reference: "", date: new Date().toISOString().split("T")[0], narration: "" });
    setIsSaving(false);
    toast.success(`Payment of ₹${makeForm.amount} made to ${makeForm.partyName}`);
  }

  const [filters, setFilters] = useState<PaymentFilters>({
    city: "all",
    paymentMode: "all",
    dateRange: "all",
    searchQuery: "",
  });

  useEffect(() => {
    loadPayments();
  }, [filters, city]);

  async function loadPayments() {
    setIsLoading(true);
    setError(null);

    try {
      const paymentsData = await fetchPayments(filters, city);
      setPayments(paymentsData.payments);

      // Compute summary from actual payments
      const byModeMap: Record<string, { count: number; amount: number }> = {};
      paymentsData.payments.forEach(p => {
        const m = p.paymentMode;
        if (!byModeMap[m]) byModeMap[m] = { count: 0, amount: 0 };
        byModeMap[m].count++;
        byModeMap[m].amount += Math.abs(p.amount);
      });
      setSummary({
        totalPayments: paymentsData.payments.length,
        totalAmount: paymentsData.payments.reduce((s, p) => s + Math.abs(p.amount), 0),
        byMode: Object.entries(byModeMap).map(([mode, v]) => ({ mode, ...v })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFilterChange(key: keyof PaymentFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleViewInvoice(invoiceId: string) {
    navigate(`/finance/invoices/${invoiceId}`);
  }

  function resetFilters() {
    setFilters({
      city: "all",
      paymentMode: "all",
      dateRange: "all",
      searchQuery: "",
    });
  }

  // ============================================================================
  // RENDER: ERROR STATE
  // ============================================================================

  if (error && !isLoading) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Payments</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={loadPayments}
              className="ml-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================================
  // RENDER: MAIN UI
  // ============================================================================

  return (
    <>
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/finance" />
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Payment Management</h1>
          <p className="text-gray-600">View, receive, and make payment transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowReceiveForm(true)} className="bg-green-600 hover:bg-green-700">
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            Receive Payment
          </Button>
          <Button onClick={() => setShowMakeForm(true)} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
            <ArrowUpCircle className="w-4 h-4 mr-2" />
            Make Payment
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Payments */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{summary.totalPayments}</p>
                  )}
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* Total Amount */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount Collected</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-32 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary.totalAmount)}
                    </p>
                  )}
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Mode Summary */}
          {summary.byMode.slice(0, 2).map((mode) => (
            <Card key={mode.mode}>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-gray-600">{mode.mode}</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24 mt-1" />
                  ) : (
                    <>
                      <p className="text-lg font-bold">
                        {formatCurrency(mode.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{mode.count} transactions</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* City Filter */}
            <div>
              <Label>City</Label>
              <Select
                value={filters.city}
                onValueChange={(value) => handleFilterChange("city", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="Surat">Surat</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Ahmedabad">Ahmedabad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Mode Filter */}
            <div>
              <Label>Payment Mode</Label>
              <Select
                value={filters.paymentMode}
                onValueChange={(value) =>
                  handleFilterChange("paymentMode", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div>
              <Label>Date Range</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) =>
                  handleFilterChange("dateRange", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Payment # or Invoice #"
                value={filters.searchQuery}
                onChange={(e) =>
                  handleFilterChange("searchQuery", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Payment Transactions ({payments.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No payments found</p>
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.paymentNumber}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleViewInvoice(payment.invoiceId)}
                        className="text-blue-600 hover:underline"
                      >
                        {payment.invoiceNumber}
                      </button>
                    </TableCell>
                    <TableCell>{payment.customerName}</TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>{getPaymentModeBadge(payment.paymentMode)}</TableCell>
                    <TableCell>
                      {payment.paymentReference || (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>{payment.city || "—"}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {payment.createdBy}
                      </span>
                      <div className="text-xs text-gray-400">
                        {formatDateTime(payment.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInvoice(payment.invoiceId)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Mode Breakdown */}
      {summary && summary.byMode.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Mode Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {summary.byMode.map((mode) => (
                <div key={mode.mode} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{mode.mode}</span>
                    {getPaymentModeBadge(mode.mode)}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(mode.amount)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {mode.count} transaction{mode.count !== 1 ? "s" : ""}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg: {formatCurrency(mode.amount / mode.count)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>

    {/* Receive Payment Sheet */}
    <Sheet open={showReceiveForm} onOpenChange={setShowReceiveForm}>
      <SheetContent className="w-full sm:w-[480px]">
        <SheetHeader>
          <SheetTitle className="text-green-700">Receive Payment</SheetTitle>
          <SheetDescription>Record an incoming payment from a customer or party</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div><Label>Party / Customer Name *</Label><Input value={receiveForm.partyName} onChange={e => setReceiveForm({...receiveForm, partyName: e.target.value})} placeholder="Customer or company name" /></div>
          <div><Label>Amount (₹) *</Label><Input type="number" value={receiveForm.amount} onChange={e => setReceiveForm({...receiveForm, amount: e.target.value})} placeholder="0.00" /></div>
          <div><Label>Payment Mode</Label>
            <select className="w-full border rounded px-3 py-2 mt-1" value={receiveForm.mode} onChange={e => setReceiveForm({...receiveForm, mode: e.target.value})}>
              {["CASH","UPI","CARD","BANK_TRANSFER","CHEQUE"].map(m => <option key={m} value={m}>{m.replace("_"," ")}</option>)}
            </select>
          </div>
          <div><Label>Reference / Invoice No.</Label><Input value={receiveForm.reference} onChange={e => setReceiveForm({...receiveForm, reference: e.target.value})} placeholder="INV-001 or transaction ID" /></div>
          <div><Label>Date</Label><Input type="date" value={receiveForm.date} onChange={e => setReceiveForm({...receiveForm, date: e.target.value})} /></div>
          <div><Label>Narration</Label><Input value={receiveForm.narration} onChange={e => setReceiveForm({...receiveForm, narration: e.target.value})} placeholder="Optional note" /></div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleReceivePayment} disabled={isSaving} className="flex-1 bg-green-600 hover:bg-green-700">
              {isSaving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><ArrowDownCircle className="w-4 h-4 mr-2" />Confirm Receipt</>}
            </Button>
            <Button variant="outline" onClick={() => setShowReceiveForm(false)}>Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    {/* Make Payment Sheet */}
    <Sheet open={showMakeForm} onOpenChange={setShowMakeForm}>
      <SheetContent className="w-full sm:w-[480px]">
        <SheetHeader>
          <SheetTitle className="text-orange-700">Make Payment</SheetTitle>
          <SheetDescription>Record an outgoing payment to a vendor or party</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div><Label>Party / Vendor Name *</Label><Input value={makeForm.partyName} onChange={e => setMakeForm({...makeForm, partyName: e.target.value})} placeholder="Vendor or company name" /></div>
          <div><Label>Amount (₹) *</Label><Input type="number" value={makeForm.amount} onChange={e => setMakeForm({...makeForm, amount: e.target.value})} placeholder="0.00" /></div>
          <div><Label>Payment Mode</Label>
            <select className="w-full border rounded px-3 py-2 mt-1" value={makeForm.mode} onChange={e => setMakeForm({...makeForm, mode: e.target.value})}>
              {["BANK_TRANSFER","CHEQUE","CASH","UPI","NEFT","RTGS"].map(m => <option key={m} value={m}>{m.replace("_"," ")}</option>)}
            </select>
          </div>
          <div><Label>Reference / Bill No.</Label><Input value={makeForm.reference} onChange={e => setMakeForm({...makeForm, reference: e.target.value})} placeholder="Bill no or UTR" /></div>
          <div><Label>Date</Label><Input type="date" value={makeForm.date} onChange={e => setMakeForm({...makeForm, date: e.target.value})} /></div>
          <div><Label>Narration</Label><Input value={makeForm.narration} onChange={e => setMakeForm({...makeForm, narration: e.target.value})} placeholder="Purpose of payment" /></div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleMakePayment} disabled={isSaving} className="flex-1 bg-orange-600 hover:bg-orange-700">
              {isSaving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><ArrowUpCircle className="w-4 h-4 mr-2" />Confirm Payment</>}
            </Button>
            <Button variant="outline" onClick={() => setShowMakeForm(false)}>Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
