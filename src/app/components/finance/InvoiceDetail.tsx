import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { formatCurrency as _formatCurrencyBase } from "../../lib/formatters";
// Invoice amounts must show exact values — never compact (₹3K vs ₹2,950)
const formatCurrency = (amount: number | null | undefined) =>
  _formatCurrencyBase(amount, { compact: false, decimals: 2 });
import {
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  ArrowLeft,
  CreditCard,
  RefreshCw,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Printer,
  Send,
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
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { logger } from "../../services/logger";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface InvoiceLineItem {
  id: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  serviceReference?: string;
}

interface Payment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  paymentMode: string;
  paymentReference: string;
  amount: number;
  createdAt: string;
  createdBy: string;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  serviceId?: string;
  serviceType?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  isInterState: boolean;
  paidAmount: number;
  balanceDue: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  paymentStatus: "PENDING" | "PARTIAL" | "COMPLETED";
  city?: string;
  cluster?: string;
  createdAt: string;
  createdBy: string;
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  revenueTransactionId?: string;
}

interface TimelineEvent {
  id: string;
  type: "created" | "payment" | "refund" | "cancelled";
  date: string;
  description: string;
  amount?: number;
  user?: string;
}

interface RefundFormData {
  amount: string;
  reason: string;
  refundMode: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Build a real InvoiceDetail from all localStorage stores.
 * Lookup order:
 *   1. cleancar_web_invoices          (buy-page purchases — richest data)
 *   2. cleancar_CITY-SURAT_revenues   (seeded subscription & one-time revenues)
 *   3. cleancar_accounting_entries    (accounting entries with GST breakdown)
 *   4. cleancar_CITY-SURAT_subscriptions  (to enrich plan name / vehicle)
 *   5. cleancar_CITY-SURAT_customers      (to enrich customer contact details)
 */
async function fetchInvoiceDetail(invoiceId: string): Promise<InvoiceDetail> {
  await new Promise(resolve => setTimeout(resolve, 400));

  const safe = (key: string) => {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
  };

  const revenues: any[]     = [...safe("cleancar_CITY-SURAT_revenues"), ...safe("cleancar_CITY-MUMBAI_revenues")];
  const webInvoices: any[]  = safe("cleancar_web_invoices");
  const accEntries: any[]   = safe("cleancar_accounting_entries");
  const subscriptions: any[]= [...safe("cleancar_CITY-SURAT_subscriptions"), ...safe("cleancar_CITY-MUMBAI_subscriptions")];
  const customers: any[]    = [...safe("cleancar_CITY-SURAT_customers"), ...safe("cleancar_CITY-MUMBAI_customers")];

  // Helper: find customer record
  const findCustomer = (customerId: string) =>
    customers.find((c: any) => c.customerId === customerId || c.id === customerId);

  // Helper: build line items from plan name
  const lineItemsFromPlan = (planName: string, amount: number, vehicleCategory?: string): InvoiceLineItem[] => {
    const cat = vehicleCategory || "Vehicle";
    const catLabel = cat === "hatchback" ? "Hatchback / Compact Sedan"
      : cat === "suv" ? "SUV / MUV / Sedan"
      : cat === "luxury" ? "Luxury / Large SUV"
      : cat;
    const name = planName?.toUpperCase() || "";

    // ELITE — Raja Seva: daily wash + weekly shampoo + fortnightly dash + monthly wax + engine bay
    if (name.includes("ELITE_WASH") || name.includes("Elite Wash") || name.includes("WAX")) {
      return [
        { id: "li-1", lineNumber: 1, description: `ELITE — Daily Exterior Water Wash (30×) — ${catLabel}`, quantity: 30, unitPrice: +(amount * 0.72 / 30).toFixed(2), lineTotal: +(amount * 0.72).toFixed(2) },
        { id: "li-2", lineNumber: 2, description: "Weekly Shampoo Wash (4×/month)", quantity: 4, unitPrice: +(amount * 0.12 / 4).toFixed(2), lineTotal: +(amount * 0.12).toFixed(2) },
        { id: "li-3", lineNumber: 3, description: "Fortnightly Dashboard & Console Deep Clean (2×/month)", quantity: 2, unitPrice: +(amount * 0.08 / 2).toFixed(2), lineTotal: +(amount * 0.08).toFixed(2) },
        { id: "li-4", lineNumber: 4, description: "Monthly Full Hand Wax Polish (1×/month)", quantity: 1, unitPrice: +(amount * 0.06).toFixed(2), lineTotal: +(amount * 0.06).toFixed(2) },
        { id: "li-5", lineNumber: 5, description: "Monthly Engine Bay Dry Blow (1×/month — no water)", quantity: 1, unitPrice: +(amount * 0.02).toFixed(2), lineTotal: +(amount * 0.02).toFixed(2) },
      ];
    }
    // PROTECT — Raksha Plan: daily wash + fortnightly interior vacuum & shampoo + monthly fragrance & tyre
    if (name.includes("SMART_WASH") || name.includes("Smart Wash") || name.includes("SHAMPOO") || name.includes("STANDARD")) {
      return [
        { id: "li-1", lineNumber: 1, description: `PROTECT — Daily Exterior Water Wash (30×) — ${catLabel}`, quantity: 30, unitPrice: +(amount * 0.75 / 30).toFixed(2), lineTotal: +(amount * 0.75).toFixed(2) },
        { id: "li-2", lineNumber: 2, description: "Fortnightly Interior Vacuum & Mat Clean + Shampoo Wash (2×/month)", quantity: 2, unitPrice: +(amount * 0.16 / 2).toFixed(2), lineTotal: +(amount * 0.16).toFixed(2) },
        { id: "li-3", lineNumber: 3, description: "Monthly Car Fragrance + Tyre Dressing (all 4 tyres)", quantity: 1, unitPrice: +(amount * 0.09).toFixed(2), lineTotal: +(amount * 0.09).toFixed(2) },
      ];
    }
    // SHINE — Chamakti Subah: daily wash + weekly tyre spray + monthly shampoo & underbody
    return [
      { id: "li-1", lineNumber: 1, description: `SHINE — Daily Exterior Water Wash + Microfibre Dry (30×) — ${catLabel}`, quantity: 30, unitPrice: +(amount * 0.82 / 30).toFixed(2), lineTotal: +(amount * 0.82).toFixed(2) },
      { id: "li-2", lineNumber: 2, description: "Weekly Wheel Rim & Tyre Spray (4×/month)", quantity: 4, unitPrice: +(amount * 0.10 / 4).toFixed(2), lineTotal: +(amount * 0.10).toFixed(2) },
      { id: "li-3", lineNumber: 3, description: "Monthly Shampoo Wash + Underbody Flush + Windshield Clean (1×)", quantity: 1, unitPrice: +(amount * 0.08).toFixed(2), lineTotal: +(amount * 0.08).toFixed(2) },
    ];
  };

  // ── 1. Web invoice (buy-page) ────────────────────────────────────────────
  const webInv = webInvoices.find(
    (w: any) => w.invoiceNumber === invoiceId || w.subscriptionId === invoiceId
  );
  if (webInv) {
    const cgst = webInv.cgst || +(webInv.subtotal * 0.09).toFixed(2);
    const sgst = webInv.sgst || +(webInv.subtotal * 0.09).toFixed(2);
    const planName = webInv.items?.[0]?.name || "Car Wash Subscription";
    const lineItems: InvoiceLineItem[] = webInv.items?.map((item: any, idx: number) => ({
      id: `li-${idx+1}`, lineNumber: idx+1,
      description: item.name, quantity: item.qty || 1,
      unitPrice: item.rate || 0, lineTotal: item.amount || 0,
    })) || lineItemsFromPlan(planName, webInv.subtotal, webInv.vehicleCategory);
    return {
      id: webInv.invoiceNumber,
      invoiceNumber: webInv.invoiceNumber,
      customerId: webInv.customerId || "",
      customerName: webInv.customerName || "",
      customerEmail: webInv.customerEmail || "",
      customerPhone: webInv.customerPhone || "",
      customerAddress: webInv.address || "",
      serviceType: "Car Wash Subscription — Web",
      invoiceDate: webInv.invoiceDate || webInv.createdAt?.split("T")[0] || "",
      dueDate: webInv.invoiceDate || webInv.createdAt?.split("T")[0] || "",
      subtotal: webInv.subtotal,
      taxableValue: webInv.subtotal,
      taxAmount: cgst + sgst,
      cgstRate: 9, cgstAmount: cgst,
      sgstRate: 9, sgstAmount: sgst,
      igstRate: 0, igstAmount: 0,
      isInterState: false,
      discountAmount: 0,
      totalAmount: webInv.grandTotal || webInv.subtotal,
      paidAmount: webInv.grandTotal || webInv.subtotal,
      balanceDue: 0,
      status: "PAID",
      paymentStatus: "COMPLETED",
      city: webInv.cityId?.replace("CITY-","") || "Surat",
      cluster: "",
      createdAt: webInv.createdAt || "",
      createdBy: "Web Buy Page",
      revenueTransactionId: webInv.subscriptionId || webInv.invoiceNumber,
      lineItems,
      payments: [{
        id: `PAY-${webInv.invoiceNumber}`,
        paymentNumber: `PAY-${webInv.invoiceNumber}`,
        paymentDate: webInv.createdAt?.split("T")[0] || "",
        paymentMode: webInv.paymentMethod || "Razorpay",
        paymentReference: webInv.invoiceNumber,
        amount: webInv.grandTotal || webInv.subtotal,
        createdAt: webInv.createdAt || "",
        createdBy: "Razorpay Gateway",
      }],
    };
  }

  // ── 2. Revenue record ────────────────────────────────────────────────────
  const rev = revenues.find(
    (r: any) => r.revenueId === invoiceId || r.invoiceNumber === invoiceId
  );
  if (rev) {
    const customer = findCustomer(rev.customerId);
    const sub = subscriptions.find((s: any) => s.subscriptionId === rev.subscriptionId);
    const planName = sub?.packageName || (rev.type === "One-Time" ? "One-Time Wash" : "Car Wash Subscription");
    const vehicleCat = sub?.serviceDetails?.vehicleType || customer?.vehicleDetails?.category || "";
    const taxableVal = rev.amount;
    const cgst = +(taxableVal * 0.09).toFixed(2);
    const sgst = +(taxableVal * 0.09).toFixed(2);
    const grandTotal = +(taxableVal * 1.18).toFixed(2);
    const customerName = customer ? `${customer.firstName} ${customer.lastName}`.trim() : (rev.customerName || "Customer");
    const address = customer?.address ? `${customer.address.line1 || ""}, ${customer.address.area || ""}, ${customer.address.city || ""} - ${customer.address.pinCode || ""}` : "";
    const lineItems = lineItemsFromPlan(planName, taxableVal, vehicleCat);
    const paid = rev.status === "Received";
    return {
      id: rev.revenueId,
      invoiceNumber: rev.invoiceNumber || rev.revenueId,
      customerId: rev.customerId,
      customerName,
      customerEmail: customer?.email || "",
      customerPhone: customer?.phone || "",
      customerAddress: address,
      serviceType: `${planName}${vehicleCat ? " — " + vehicleCat : ""}`,
      invoiceDate: rev.receivedDate || rev.createdAt?.split("T")[0] || "",
      dueDate: rev.receivedDate || rev.createdAt?.split("T")[0] || "",
      subtotal: taxableVal,
      taxableValue: taxableVal,
      taxAmount: cgst + sgst,
      cgstRate: 9, cgstAmount: cgst,
      sgstRate: 9, sgstAmount: sgst,
      igstRate: 0, igstAmount: 0,
      isInterState: false,
      discountAmount: 0,
      totalAmount: grandTotal,
      paidAmount: paid ? grandTotal : 0,
      balanceDue: paid ? 0 : grandTotal,
      status: paid ? "PAID" : "UNPAID",
      paymentStatus: paid ? "COMPLETED" : "PENDING",
      city: rev.cityId?.replace("CITY-","") || "Surat",
      cluster: "",
      createdAt: rev.createdAt || rev.receivedDate + "T00:00:00Z",
      createdBy: "System",
      revenueTransactionId: rev.revenueId,
      lineItems,
      payments: paid ? [{
        id: `PAY-${rev.revenueId}`,
        paymentNumber: `PAY-${rev.invoiceNumber || rev.revenueId}`,
        paymentDate: rev.receivedDate || rev.createdAt?.split("T")[0] || "",
        paymentMode: rev.paymentMethod || "UPI",
        paymentReference: rev.invoiceNumber || rev.revenueId,
        amount: grandTotal,
        createdAt: rev.createdAt || "",
        createdBy: "System",
      }] : [],
    };
  }

  // ── 3. Accounting entry ──────────────────────────────────────────────────
  const entry = accEntries.find(
    (e: any) => e.id === invoiceId || e.invoiceNumber === invoiceId || e.voucherNumber === invoiceId
  );
  if (entry) {
    const taxableVal = entry.taxableValue || entry.totalBillValue || 0;
    const cgst = entry.cgst || +(taxableVal * 0.09).toFixed(2);
    const sgst = entry.sgst || +(taxableVal * 0.09).toFixed(2);
    const grandTotal = entry.totalBillValue || +(taxableVal * 1.18).toFixed(2);
    const planName = entry.narration?.includes("renewal") ? "Subscription Renewal"
      : entry.narration?.includes("One-time") ? "One-Time Wash"
      : entry.narration?.includes("ubscription") ? "Car Wash Subscription"
      : entry.narration || entry.entryType;
    const lineItems: InvoiceLineItem[] = [{
      id: "li-1", lineNumber: 1,
      description: planName,
      quantity: 1,
      unitPrice: taxableVal,
      lineTotal: taxableVal,
      serviceReference: entry.invoiceNumber || entry.voucherNumber,
    }];
    return {
      id: entry.id,
      invoiceNumber: entry.invoiceNumber || entry.voucherNumber || entry.id,
      customerId: entry.customerId || "",
      customerName: entry.vendorName || entry.customerName || "Customer",
      customerEmail: "",
      customerPhone: "",
      customerAddress: entry.city ? `${entry.city}, Gujarat` : "",
      serviceType: planName,
      invoiceDate: entry.date,
      dueDate: entry.date,
      subtotal: taxableVal,
      taxableValue: taxableVal,
      taxAmount: cgst + sgst,
      cgstRate: entry.gstRate ? entry.gstRate / 2 : 9,
      cgstAmount: cgst,
      sgstRate: entry.gstRate ? entry.gstRate / 2 : 9,
      sgstAmount: sgst,
      igstRate: 0, igstAmount: 0,
      isInterState: false,
      discountAmount: 0,
      totalAmount: grandTotal,
      paidAmount: entry.status === "Posted" ? grandTotal : 0,
      balanceDue: entry.status === "Posted" ? 0 : grandTotal,
      status: entry.status === "Posted" ? "PAID" : "UNPAID",
      paymentStatus: entry.status === "Posted" ? "COMPLETED" : "PENDING",
      city: entry.city || "Surat",
      cluster: "",
      createdAt: entry.createdAt || entry.date + "T00:00:00Z",
      createdBy: entry.createdBy || "System",
      revenueTransactionId: entry.id,
      lineItems,
      payments: entry.status === "Posted" ? [{
        id: `PAY-${entry.id}`,
        paymentNumber: `PAY-${entry.voucherNumber || entry.id}`,
        paymentDate: entry.date,
        paymentMode: entry.paymentMode || "Bank",
        paymentReference: entry.voucherNumber || entry.id,
        amount: grandTotal,
        createdAt: entry.createdAt || entry.date + "T00:00:00Z",
        createdBy: entry.createdBy || "System",
      }] : [],
    };
  }

  // ── 4. Not found ─────────────────────────────────────────────────────────
  throw new Error(`Invoice "${invoiceId}" not found. It may have been created before the current session or under a different city.`);
}

async function recordPayment(
  invoiceId: string,
  paymentData: any
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  logger.log("Payment recorded:", { invoiceId, paymentData });
}

async function processRefund(
  invoiceId: string,
  refundData: RefundFormData
): Promise<void> {
  // In production: Replace with real API call
  // const response = await fetch('/api/refunds', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     invoiceId,
  //     amount: parseFloat(refundData.amount),
  //     reason: refundData.reason,
  //     refundMode: refundData.refundMode,
  //   }),
  // });
  // if (!response.ok) throw new Error('Failed to process refund');

  await new Promise((resolve) => setTimeout(resolve, 800));
  logger.log("Refund processed:", { invoiceId, refundData });
}

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

function getStatusBadge(status: InvoiceDetail["status"]) {
  const statusConfig = {
    UNPAID: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    PARTIAL: { color: "bg-blue-100 text-blue-800", icon: AlertCircle },
    PAID: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    OVERDUE: { color: "bg-red-100 text-red-800", icon: AlertCircle },
    CANCELLED: { color: "bg-gray-100 text-gray-800", icon: XCircle },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge className={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
}

function generateTimeline(invoice: InvoiceDetail): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Invoice created
  events.push({
    id: "event_created",
    type: "created",
    date: invoice.createdAt,
    description: `Invoice ${invoice.invoiceNumber} created`,
    amount: invoice.totalAmount,
    user: invoice.createdBy,
  });

  // Payments
  invoice.payments.forEach((payment) => {
    events.push({
      id: payment.id,
      type: "payment",
      date: payment.createdAt,
      description: `Payment received via ${payment.paymentMode}`,
      amount: payment.amount,
      user: payment.createdBy,
    });
  });

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InvoiceDetail() {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment drawer state
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMode: "CASH",
    paymentReference: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Refund drawer state
  const [isRefundDrawerOpen, setIsRefundDrawerOpen] = useState(false);
  const [refundForm, setRefundForm] = useState<RefundFormData>({
    amount: "",
    reason: "",
    refundMode: "CASH",
  });
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  const { id: invoiceId = "inv_001" } = useParams<{ id: string }>();

  useEffect(() => {
    loadInvoiceDetail();
  }, []);

  async function loadInvoiceDetail() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchInvoiceDetail(invoiceId);
      setInvoice(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load invoice details"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleRecordPaymentClick() {
    if (!invoice) return;
    setPaymentForm({
      amount: invoice.balanceDue.toString(),
      paymentMode: "CASH",
      paymentReference: "",
      paymentDate: new Date().toISOString().split("T")[0],
    });
    setIsPaymentDrawerOpen(true);
  }

  async function handleSubmitPayment() {
    if (!invoice) return;

    const paymentAmount = parseFloat(paymentForm.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.info("Please enter a valid payment amount");
      return;
    }

    if (paymentAmount > invoice.balanceDue) {
      toast.info("Payment amount cannot exceed outstanding balance");
      return;
    }

    setIsSubmittingPayment(true);

    try {
      await recordPayment(invoice.id, paymentForm);
      setIsPaymentDrawerOpen(false);
      loadInvoiceDetail();
      toast.success("Payment recorded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  function handleIssueRefundClick() {
    if (!invoice) return;
    setRefundForm({
      amount: invoice.paidAmount.toString(),
      reason: "",
      refundMode: "CASH",
    });
    setIsRefundDrawerOpen(true);
  }

  async function handleSubmitRefund() {
    if (!invoice) return;

    const refundAmount = parseFloat(refundForm.amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      toast.info("Please enter a valid refund amount");
      return;
    }

    if (refundAmount > invoice.paidAmount) {
      toast.info("Refund amount cannot exceed paid amount");
      return;
    }

    if (!refundForm.reason.trim()) {
      toast.error("Please provide a reason for refund");
      return;
    }

    setIsSubmittingRefund(true);

    try {
      await processRefund(invoice.id, refundForm);
      setIsRefundDrawerOpen(false);
      loadInvoiceDetail();
      toast.success("Refund processed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process refund");
    } finally {
      setIsSubmittingRefund(false);
    }
  }

  // ============================================================================
  // RENDER: LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ============================================================================
  // RENDER: ERROR STATE
  // ============================================================================

  if (error || !invoice) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Invoice</AlertTitle>
          <AlertDescription>
            {error || "Invoice not found"}
            <Button
              variant="outline"
              size="sm"
              onClick={loadInvoiceDetail}
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

  const timeline = generateTimeline(invoice);

  // ============================================================================
  // RENDER: MAIN UI
  // ============================================================================

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/finance/invoices" />
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-gray-600">Invoice Details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm">
            <Send className="w-4 h-4 mr-2" />
            Email
          </Button>
        </div>
      </div>

      {/* Status and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              {getStatusBadge(invoice.status)}
              <Separator orientation="vertical" className="h-6" />
              <div className="text-sm">
                <span className="text-gray-600">Due Date: </span>
                <span className="font-semibold">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                <Button onClick={handleRecordPaymentClick}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              )}
              {invoice.paidAmount > 0 && invoice.status !== "CANCELLED" && (
                <Button variant="outline" onClick={handleIssueRefundClick}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Issue Refund
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer and Invoice Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Name</div>
              <div className="font-semibold">{invoice.customerName}</div>
            </div>
            {invoice.customerEmail && (
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div>{invoice.customerEmail}</div>
              </div>
            )}
            {invoice.customerPhone && (
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div>{invoice.customerPhone}</div>
              </div>
            )}
            {invoice.customerAddress && (
              <div>
                <div className="text-sm text-gray-600">Address</div>
                <div>{invoice.customerAddress}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="text-sm text-gray-600">Invoice Date</div>
                <div className="font-semibold">{formatDate(invoice.invoiceDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Due Date</div>
                <div className="font-semibold">{formatDate(invoice.dueDate)}</div>
              </div>
            </div>
            {invoice.serviceType && (
              <div>
                <div className="text-sm text-gray-600">Service Type</div>
                <div>{invoice.serviceType}</div>
              </div>
            )}
            {invoice.city && (
              <div>
                <div className="text-sm text-gray-600">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </div>
                <div>
                  {invoice.city}
                  {invoice.cluster && ` - ${invoice.cluster}`}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.lineNumber}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.serviceReference || "—"}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.lineTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          {/* Totals */}
          <div className="space-y-2 max-w-sm ml-auto">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>- {formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Taxable Value:</span>
                  <span>{formatCurrency(invoice.taxableValue || invoice.subtotal)}</span>
                </div>
                {!invoice.isInterState ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">CGST @ {invoice.cgstRate || 9}%:</span>
                      <span>{formatCurrency(invoice.cgstAmount || invoice.taxAmount / 2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SGST @ {invoice.sgstRate || 9}%:</span>
                      <span>{formatCurrency(invoice.sgstAmount || invoice.taxAmount / 2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IGST @ {invoice.igstRate || 18}%:</span>
                    <span>{formatCurrency(invoice.igstAmount || invoice.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span className="text-gray-700">Total Tax:</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
            {invoice.paidAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Paid Amount:</span>
                <span>- {formatCurrency(invoice.paidAmount)}</span>
              </div>
            )}
            {invoice.balanceDue > 0 && (
              <div className="flex justify-between text-xl font-bold text-blue-600">
                <span>Balance Due:</span>
                <span>{formatCurrency(invoice.balanceDue)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.paymentNumber}
                    </TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.paymentMode}</Badge>
                    </TableCell>
                    <TableCell>{payment.paymentReference || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      event.type === "created"
                        ? "bg-blue-100 text-blue-600"
                        : event.type === "payment"
                        ? "bg-green-100 text-green-600"
                        : event.type === "refund"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {event.type === "created" && <FileText className="w-5 h-5" />}
                    {event.type === "payment" && <DollarSign className="w-5 h-5" />}
                    {event.type === "refund" && <RefreshCw className="w-5 h-5" />}
                    {event.type === "cancelled" && <XCircle className="w-5 h-5" />}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="absolute top-10 left-5 w-0.5 h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="font-semibold">{event.description}</div>
                  <div className="text-sm text-gray-600">
                    {formatDateTime(event.date)}
                    {event.user && ` • ${event.user}`}
                  </div>
                  {event.amount !== undefined && (
                    <div className="text-sm font-semibold mt-1">
                      {formatCurrency(event.amount)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Recording Drawer */}
      <Sheet open={isPaymentDrawerOpen} onOpenChange={setIsPaymentDrawerOpen}>
        <SheetContent className="w-full sm:w-[500px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Record Payment</SheetTitle>
            <SheetDescription>
              Record payment for invoice {invoice.invoiceNumber}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span>{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Amount:</span>
                    <span>{formatCurrency(invoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Outstanding:</span>
                    <span className="font-semibold text-lg text-blue-600">
                      {formatCurrency(invoice.balanceDue)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <Label>Payment Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum: {formatCurrency(invoice.balanceDue)}
                </p>
              </div>

              <div>
                <Label>Payment Mode *</Label>
                <Select
                  value={paymentForm.paymentMode}
                  onValueChange={(value) =>
                    setPaymentForm({ ...paymentForm, paymentMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Payment Reference</Label>
                <Input
                  placeholder="Transaction ID, Cheque #, etc."
                  value={paymentForm.paymentReference}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentReference: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Payment Date *</Label>
                <Input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitPayment}
                disabled={isSubmittingPayment}
                className="flex-1"
              >
                {isSubmittingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Record Payment
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsPaymentDrawerOpen(false)}
                disabled={isSubmittingPayment}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Refund Drawer */}
      <Sheet open={isRefundDrawerOpen} onOpenChange={setIsRefundDrawerOpen}>
        <SheetContent className="w-full sm:w-[500px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Issue Refund</SheetTitle>
            <SheetDescription>
              Process refund for invoice {invoice.invoiceNumber}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Refund Information</AlertTitle>
              <AlertDescription>
                Refunds will reverse the original revenue transaction and update the
                invoice status. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Paid:</span>
                    <span>{formatCurrency(invoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Transaction:</span>
                    <span className="font-mono text-sm">
                      {invoice.revenueTransactionId || "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <Label>Refund Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={refundForm.amount}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, amount: e.target.value })
                  }
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum: {formatCurrency(invoice.paidAmount)}
                </p>
              </div>

              <div>
                <Label>Refund Mode *</Label>
                <Select
                  value={refundForm.refundMode}
                  onValueChange={(value) =>
                    setRefundForm({ ...refundForm, refundMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card Reversal</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Reason for Refund *</Label>
                <Textarea
                  placeholder="Explain why this refund is being issued..."
                  value={refundForm.reason}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, reason: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitRefund}
                disabled={isSubmittingRefund}
                variant="destructive"
                className="flex-1"
              >
                {isSubmittingRefund ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Process Refund
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsRefundDrawerOpen(false)}
                disabled={isSubmittingRefund}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
