import { BackButton } from "../ui/back-button";
/**
 * Finance Transactions - Transaction-based model
 *
 * Types: Revenue, Expense, Refund, Salary
 * Source Tags: operationsEngine, payrollEngine, subscriptionEngine, manualEntry
 * NO UI CALCULATIONS - All from financeEngine
 *
 * @component
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useCity } from "../../contexts/CityContext";
import { useFinanceForCurrentUser } from "../../hooks/useFinanceForCurrentUser";
import { useRole } from "../../contexts/RoleContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wallet,
  Database,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  Tag,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  Banknote,
} from "lucide-react";

// Transaction Types
type TransactionType = "REVENUE" | "EXPENSE" | "REFUND" | "SALARY";

// Source Tags - Where the transaction came from
type TransactionSource =
  | "operationsEngine"      // From completed units
  | "payrollEngine"         // From salary/incentive processing
  | "subscriptionEngine"    // From subscription payments
  | "manualEntry"          // Manually entered by finance team
  | "refundEngine"         // From refund processing
  | "expenseEngine";       // From expense tracking

// Transaction Status
type TransactionStatus = "POSTED" | "PENDING" | "REVERSED";

// Transaction Record
interface FinanceTransaction {
  id: string;
  date: string;
  type: TransactionType;
  source: TransactionSource;
  description: string;
  referenceId: string; // Link to source record (UNIT-001, PAYROLL-FEB-2026, etc.)
  amount: number; // Calculated by financeEngine
  accountDebit: string;
  accountCredit: string;
  status: TransactionStatus;
  city: string;
  cluster?: string;
  postedBy: string;
  notes?: string;
}

// Transaction Type Configuration
interface TransactionTypeConfig {
  type: TransactionType;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

const TRANSACTION_TYPES: TransactionTypeConfig[] = [
  {
    type: "REVENUE",
    label: "Revenue",
    icon: ArrowUpCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
  },
  {
    type: "EXPENSE",
    label: "Expense",
    icon: ArrowDownCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
  },
  {
    type: "REFUND",
    label: "Refund",
    icon: RotateCcw,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
  },
  {
    type: "SALARY",
    label: "Salary",
    icon: Banknote,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
  },
];

// Source Tag Configuration
interface SourceConfig {
  source: TransactionSource;
  label: string;
  color: string;
}

const SOURCE_TAGS: SourceConfig[] = [
  { source: "operationsEngine", label: "Operations", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { source: "payrollEngine", label: "Payroll", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { source: "subscriptionEngine", label: "Subscriptions", color: "bg-green-100 text-green-700 border-green-200" },
  { source: "manualEntry", label: "Manual", color: "bg-gray-100 text-gray-700 border-gray-200" },
  { source: "refundEngine", label: "Refunds", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { source: "expenseEngine", label: "Expenses", color: "bg-red-100 text-red-700 border-red-200" },
];

// Mock Transactions - In production, these come from financeEngine
const getMockTransactions = (cityName: string): FinanceTransaction[] => [
  {
    id: "TXN-001",
    date: "2026-04-20",
    type: "REVENUE",
    source: "operationsEngine",
    description: "Car wash service revenue - 4W Premium",
    referenceId: "UNIT-001",
    amount: 499, // From financeEngine
    accountDebit: "1200 - Accounts Receivable",
    accountCredit: "4000 - Service Revenue",
    status: "POSTED",
    city: cityName,
    cluster: "Central",
    postedBy: "operationsEngine",
    notes: "Auto-posted from completed unit",
  },
  {
    id: "TXN-002",
    date: "2026-04-20",
    type: "REVENUE",
    source: "subscriptionEngine",
    description: "Monthly subscription - Gold Plan",
    referenceId: "SUB-CUST-101-APR",
    amount: 2999, // From financeEngine
    accountDebit: "1100 - Bank Account",
    accountCredit: "4010 - Subscription Revenue",
    status: "POSTED",
    city: cityName,
    cluster: "Central",
    postedBy: "subscriptionEngine",
    notes: "Auto-collected via payment gateway",
  },
  {
    id: "TXN-003",
    date: "2026-04-20",
    type: "EXPENSE",
    source: "manualEntry",
    description: "Cleaning supplies — materials consumed",
    referenceId: "PO-2026-045",
    amount: 15000,
    accountDebit: "5100 - Materials / COGS",
    accountCredit: "2000 - Accounts Payable",
    status: "POSTED",
    city: cityName,
    postedBy: "Finance Team",
    notes: "Vendor: CleanPro Supplies — Material consumption entry",
  },
  {
    id: "TXN-004A",
    date: "2026-04-20",
    type: "SALARY",
    source: "payrollEngine",
    description: "Feb 2026 — Ravi Kumar Sharma (Supervisor)",
    referenceId: "PAYROLL-FEB-2026-EMP001",
    amount: 28000,
    accountDebit: "5200 - Wage Expense",
    accountCredit: "2100 - Salary Payable / Ravi Kumar",
    status: "POSTED",
    city: cityName,
    postedBy: "payrollEngine",
    notes: "Salary Dr to Ravi Kumar Sharma",
  },
  {
    id: "TXN-004B",
    date: "2026-04-20",
    type: "SALARY",
    source: "payrollEngine",
    description: "Feb 2026 — Suresh Yadav (Car Washer)",
    referenceId: "PAYROLL-FEB-2026-EMP002",
    amount: 18000,
    accountDebit: "5200 - Wage Expense",
    accountCredit: "2100 - Salary Payable / Suresh Yadav",
    status: "POSTED",
    city: cityName,
    postedBy: "payrollEngine",
    notes: "Salary Dr to Suresh Yadav",
  },
  {
    id: "TXN-004C",
    date: "2026-04-20",
    type: "SALARY",
    source: "payrollEngine",
    description: "Feb 2026 — Anita Joshi (Accounts)",
    referenceId: "PAYROLL-FEB-2026-EMP003",
    amount: 32000,
    accountDebit: "5200 - Wage Expense",
    accountCredit: "2100 - Salary Payable / Anita Joshi",
    status: "POSTED",
    city: cityName,
    postedBy: "payrollEngine",
    notes: "Salary Dr to Anita Joshi",
  },
  {
    id: "TXN-004D",
    date: "2026-04-20",
    type: "SALARY",
    source: "payrollEngine",
    description: "Feb 2026 — Mohan Singh (Operations Manager)",
    referenceId: "PAYROLL-FEB-2026-EMP004",
    amount: 48000,
    accountDebit: "5200 - Wage Expense",
    accountCredit: "2100 - Salary Payable / Mohan Singh",
    status: "POSTED",
    city: cityName,
    postedBy: "payrollEngine",
    notes: "Salary Dr to Mohan Singh",
  },
  {
    id: "TXN-004E",
    date: "2026-04-20",
    type: "SALARY",
    source: "payrollEngine",
    description: "Feb 2026 — Priya Patel (HR Manager)",
    referenceId: "PAYROLL-FEB-2026-EMP005",
    amount: 35000,
    accountDebit: "5200 - Wage Expense",
    accountCredit: "2100 - Salary Payable / Priya Patel",
    status: "POSTED",
    city: cityName,
    postedBy: "payrollEngine",
    notes: "Salary Dr to Priya Patel",
  },
  {
    id: "TXN-004F",
    date: "2026-04-20",
    type: "SALARY",
    source: "payrollEngine",
    description: "Feb 2026 — PF Employer Contribution (All staff)",
    referenceId: "PAYROLL-FEB-2026-PF-EMPLOYER",
    amount: 15400,
    accountDebit: "5210 - PF Expense",
    accountCredit: "2110 - PF Payable",
    status: "POSTED",
    city: cityName,
    postedBy: "payrollEngine",
    notes: "12% employer PF on eligible wages",
  },
  {
    id: "TXN-004G",
    date: "2026-04-20",
    type: "SALARY",
    source: "payrollEngine",
    description: "Feb 2026 — ESI Employer Contribution",
    referenceId: "PAYROLL-FEB-2026-ESI",
    amount: 7200,
    accountDebit: "5211 - ESI Expense",
    accountCredit: "2111 - ESI Payable",
    status: "POSTED",
    city: cityName,
    postedBy: "payrollEngine",
    notes: "3.25% employer ESI",
  },
  {
    id: "TXN-005",
    date: "2026-04-19",
    type: "REFUND",
    source: "refundEngine",
    description: "Customer refund - Service quality issue",
    referenceId: "REFUND-CUST-102",
    amount: 499, // From financeEngine
    accountDebit: "4000 - Service Revenue", // Reverses revenue
    accountCredit: "1100 - Bank Account",
    status: "POSTED",
    city: cityName,
    cluster: "Central",
    postedBy: "refundEngine",
    notes: "Approved by City Manager",
  },
  {
    id: "TXN-006",
    date: "2026-04-19",
    type: "REVENUE",
    source: "operationsEngine",
    description: "Car wash service revenue - 2W Basic",
    referenceId: "UNIT-002",
    amount: 99, // From financeEngine
    accountDebit: "1200 - Accounts Receivable",
    accountCredit: "4000 - Service Revenue",
    status: "POSTED",
    city: cityName,
    cluster: "Central",
    postedBy: "operationsEngine",
  },
  // TXN-007 moved to SALARY tab as TXN-004F

  {
    id: "TXN-008",
    date: "2026-04-18",
    type: "REFUND",
    source: "refundEngine",
    description: "Subscription cancellation refund - Pro-rata",
    referenceId: "REFUND-SUB-CUST-103",
    amount: 1500, // From financeEngine (pro-rated calculation)
    accountDebit: "4010 - Subscription Revenue", // Reverses revenue
    accountCredit: "1100 - Bank Account",
    status: "POSTED",
    city: cityName,
    cluster: "East",
    postedBy: "refundEngine",
    notes: "Pro-rata refund for 15 days remaining",
  },
  {
    id: "TXN-009",
    date: "2026-04-18",
    type: "EXPENSE",
    source: "expenseEngine",
    description: "Vehicle maintenance - Supervisor bike",
    referenceId: "EXPENSE-SUP-001-APR",
    amount: 3500, // From financeEngine
    accountDebit: "5300 - Vehicle Maintenance",
    accountCredit: "1100 - Bank Account",
    status: "POSTED",
    city: cityName,
    postedBy: "Supervisor - Suresh",
    notes: "Approved expense claim",
  },
  {
    id: "TXN-010",
    date: "2026-04-17",
    type: "SALARY",
    source: "payrollEngine",
    description: "February 2026 Payroll - Operations Managers",
    referenceId: "PAYROLL-FEB-2026-OM",
    amount: 144000, // From financeEngine
    accountDebit: "5200 - Wage Expense",
    accountCredit: "2100 - Salary Payable",
    status: "POSTED",
    city: cityName,
    postedBy: "payrollEngine",
    notes: "3 OMs @ ₹48,000 each",
  },
];

export function FinanceTransactions() {
  const { city, cityInfo } = useCity();
  const { currentRole } = useRole();
  const { getRevenues, getPayables, canSeeAllCities } = useFinanceForCurrentUser();

  // ── Build real transactions from seeded data ──────────────────────────────
  // Derives transactions from accounting entries + revenue records so no mock
  // data is ever shown. Falls back to getMockTransactions only if both stores
  // are completely empty (first-run before seed runs).
  function buildLiveTransactions(cityName: string): FinanceTransaction[] {
    // 1. Accounting entries (sales, purchases, expenses, journals)
    const entries: any[] = (() => {
      try { return JSON.parse(localStorage.getItem("cleancar_accounting_entries") || "[]"); }
      catch { return []; }
    })();
    const cityEntries = entries.filter((e: any) =>
      e.cityId === city || e.city?.toLowerCase() === cityName.toLowerCase()
    );

    const fromEntries: FinanceTransaction[] = cityEntries.map((e: any) => {
      const type: TransactionType =
        e.entryType === "Sales"        ? "REVENUE"
        : e.entryType === "Purchase"   ? "EXPENSE"
        : e.entryType === "Expense"    ? "EXPENSE"
        : e.entryType === "SalesReturn"? "REFUND"
        : e.entryType === "CreditNote" ? "REFUND"
        : "REVENUE";
      const source: TransactionSource =
        e.createdBy === "Seed"         ? "subscriptionEngine"
        : e.entryType?.includes("Sal") ? "subscriptionEngine"
        : e.entryType?.includes("Pay") ? "payrollEngine"
        : "manualEntry";
      return {
        id: e.id,
        date: e.date,
        type,
        source,
        description: e.narration || e.description || e.entryType,
        referenceId: e.invoiceNumber || e.voucherNumber || e.id,
        amount: e.taxableValue || e.totalBillValue || 0,
        accountDebit: e.debitAccount || "",
        accountCredit: e.creditAccount || "",
        status: (e.status === "Posted" || e.status === "POSTED") ? "POSTED" : "PENDING",
        city: cityName,
        cluster: "",
        postedBy: e.createdBy || "System",
        notes: e.narration || "",
      };
    });

    // 2. Revenue records (subscription + one-time + web)
    const revenues: any[] = (() => {
      try {
        const key = `cleancar_CITY-${city.replace("CITY-","")}_revenues`;
        const cityKey = `cleancar_${city}_revenues`;
        return JSON.parse(localStorage.getItem(cityKey) || localStorage.getItem(key) || "[]");
      } catch { return []; }
    })();
    const revenueIds = new Set(fromEntries.map(e => e.referenceId));
    const fromRevenues: FinanceTransaction[] = revenues
      .filter((r: any) => !revenueIds.has(r.invoiceNumber))
      .map((r: any) => ({
        id: r.revenueId,
        date: r.receivedDate || r.createdAt?.split("T")[0],
        type: "REVENUE" as TransactionType,
        source: "subscriptionEngine" as TransactionSource,
        description: r.type === "One-Time" ? "One-time wash revenue" : "Subscription revenue",
        referenceId: r.invoiceNumber,
        amount: r.amount,
        accountDebit: "1100 - Bank / Razorpay",
        accountCredit: "4000 - Service Revenue",
        status: "POSTED" as const,
        city: cityName,
        cluster: "",
        postedBy: "System",
        notes: `${r.paymentMethod || ""} — ${r.type}`,
      }));

    // 3. Web invoices (buy page)
    const webInvoices: any[] = (() => {
      try { return JSON.parse(localStorage.getItem("cleancar_web_invoices") || "[]"); }
      catch { return []; }
    })();
    const webRevenueIds = new Set([...fromEntries, ...fromRevenues].map(e => e.referenceId));
    const fromWeb: FinanceTransaction[] = webInvoices
      .filter((wi: any) => !webRevenueIds.has(wi.invoiceNumber))
      .map((wi: any) => ({
        id: wi.invoiceNumber,
        date: wi.createdAt?.split("T")[0] || wi.invoiceDate,
        type: "REVENUE" as TransactionType,
        source: "subscriptionEngine" as TransactionSource,
        description: `Web subscription — ${wi.customerName}`,
        referenceId: wi.invoiceNumber,
        amount: wi.grandTotal || wi.subtotal || 0,
        accountDebit: "1100 - Razorpay",
        accountCredit: "4010 - Subscription Revenue",
        status: "POSTED" as const,
        city: cityName,
        cluster: "",
        postedBy: "Web Buy Page",
        notes: `${wi.items?.[0]?.name || ""} — ${wi.paymentMethod || ""}`,
      }));

    const all = [...fromEntries, ...fromRevenues, ...fromWeb];
    // Sort newest first
    all.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    // Fall back to mock only if completely empty
    if (all.length === 0) return getMockTransactions(cityName);
    return all;
  }

  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() => buildLiveTransactions(cityInfo.displayName));

  // Reload when city changes
  useEffect(() => {
    setTransactions(buildLiveTransactions(cityInfo.displayName));
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps
  const [typeFilter, setTypeFilter] = useState<TransactionType | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<TransactionSource | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "ALL">("ALL");

  // Calculate stats - All from financeEngine (showing the concept)
  const totalRevenue = transactions
    .filter(t => t.type === "REVENUE" && t.status === "POSTED")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => (t.type === "EXPENSE" || t.type === "SALARY") && t.status === "POSTED")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = transactions
    .filter(t => t.type === "REFUND" && t.status === "POSTED")
    .reduce((sum, t) => sum + t.amount, 0);

  const netRevenue = totalRevenue - totalRefunds; // CRITICAL: Revenue - Refunds
  const netIncome = netRevenue - totalExpenses;

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    const typeMatch = typeFilter === "ALL" || txn.type === typeFilter;
    const sourceMatch = sourceFilter === "ALL" || txn.source === sourceFilter;
    const statusMatch = statusFilter === "ALL" || txn.status === statusFilter;
    return typeMatch && sourceMatch && statusMatch;
  });

  // Get transaction type config
  const getTypeConfig = (type: TransactionType): TransactionTypeConfig => {
    return TRANSACTION_TYPES.find(t => t.type === type)!;
  };

  // Get source config
  const getSourceConfig = (source: TransactionSource): SourceConfig => {
    return SOURCE_TAGS.find(s => s.source === source)!;
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton />
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finance Transactions</h1>
            <p className="text-gray-600 mt-2">
              Transaction-based accounting (Revenue, Expense, Refund, Salary)
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
            <Database className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Transaction Model</span>
          </Badge>
        </div>

        {/* Engine Label */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Database className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">Source of Truth: financeEngine</p>
            <p className="text-xs text-blue-700">
              All amounts calculated by <span className="font-semibold">financeEngine</span>.
              Transactions auto-posted from operationsEngine, payrollEngine, subscriptionEngine, refundEngine.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-900">
                  ₹{(totalRevenue / 1000).toFixed(1)}K
                </p>
              </div>
              <ArrowUpCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
            <p className="text-xs text-green-600 mt-2">From financeEngine</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 mb-1">Total Refunds</p>
                <p className="text-3xl font-bold text-orange-900">
                  ₹{(totalRefunds / 1000).toFixed(1)}K
                </p>
              </div>
              <RotateCcw className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
            <p className="text-xs text-orange-600 mt-2">Reverses revenue</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">Net Revenue</p>
                <p className="text-3xl font-bold text-blue-900">
                  ₹{(netRevenue / 1000).toFixed(1)}K
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
            <p className="text-xs text-blue-600 mt-2">Revenue - Refunds</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 mb-1">Total Expenses</p>
                <p className="text-3xl font-bold text-red-900">
                  ₹{(totalExpenses / 1000).toFixed(1)}K
                </p>
              </div>
              <ArrowDownCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
            <p className="text-xs text-red-600 mt-2">Expense + Salary</p>
          </CardContent>
        </Card>

        <Card className={`${netIncome >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${netIncome >= 0 ? "text-green-700" : "text-red-700"} mb-1`}>
                  Net Income
                </p>
                <p className={`text-3xl font-bold ${netIncome >= 0 ? "text-green-900" : "text-red-900"}`}>
                  ₹{(netIncome / 1000).toFixed(1)}K
                </p>
              </div>
              {netIncome >= 0 ? (
                <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
              ) : (
                <TrendingDown className="w-12 h-12 text-red-600 opacity-20" />
              )}
            </div>
            <p className={`text-xs ${netIncome >= 0 ? "text-green-600" : "text-red-600"} mt-2`}>
              Net Rev - Expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Refund Clarity */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="w-4 h-4 text-orange-600" />
        <AlertTitle className="text-orange-900">Revenue vs Refund Distinction</AlertTitle>
        <AlertDescription className="text-orange-700 text-sm">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>REVENUE</strong> (Green ↑): Money received from services/subscriptions. Increases total revenue.</li>
            <li><strong>REFUND</strong> (Orange ↻): Money returned to customers. <strong>REVERSES revenue</strong> - reduces total revenue.</li>
            <li><strong>Net Revenue</strong> = Total Revenue - Total Refunds (the actual money we keep)</li>
            <li>Both transactions have <strong>source tags</strong> showing which engine posted them</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Transaction Type Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {TRANSACTION_TYPES.map((config) => {
              const Icon = config.icon;
              const count = transactions.filter(t => t.type === config.type && t.status === "POSTED").length;
              const isSelected = typeFilter === config.type;

              return (
                <div
                  key={config.type}
                  onClick={() => setTypeFilter(isSelected ? "ALL" : config.type)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? `${config.bgColor} ${config.borderColor} shadow-md`
                      : "border-gray-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-6 h-6 ${config.color}`} />
                    <Badge className="text-xs" variant={isSelected ? "default" : "outline"}>
                      {count} txns
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-1">{config.label}</h3>
                  <p className="text-xs text-gray-600">
                    {config.type === "REVENUE" && "Money received"}
                    {config.type === "EXPENSE" && "Money spent"}
                    {config.type === "REFUND" && "Money returned"}
                    {config.type === "SALARY" && "Payroll expense"}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Source Tag Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant={sourceFilter === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setSourceFilter("ALL")}
            >
              <Eye className="w-4 h-4 mr-2" />
              All Sources
            </Button>
            {SOURCE_TAGS.map((source) => {
              const count = transactions.filter(t => t.source === source.source).length;
              return (
                <Button
                  key={source.source}
                  variant={sourceFilter === source.source ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSourceFilter(source.source)}
                  className={sourceFilter === source.source ? source.color : ""}
                >
                  <Tag className="w-4 h-4 mr-2" />
                  {source.label} ({count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Ledger ({filteredTransactions.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {(typeFilter !== "ALL" || sourceFilter !== "ALL") && (
                <Badge variant="outline">
                  Filtered
                  {typeFilter !== "ALL" && `: ${typeFilter}`}
                  {sourceFilter !== "ALL" && ` from ${sourceFilter}`}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <Database className="w-3 h-3 mr-1" />
                financeEngine
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {typeFilter === "SALARY" && (
            <div className="mb-3 space-y-2">
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800">Employee-wise Salary Entries</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Each row = one employee or statutory component (Dr Wage Expense / Cr Salary Payable).
                    Verified by HR → auto-posted via payrollEngine.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-amber-800">Payroll → Finance Auto-Post</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Once HR Manager verifies payroll, salary journal entries are automatically posted here.
                    Go to <strong>Payroll → Review & Approval</strong> to process.
                  </p>
                </div>
                <a
                  href="#/payroll/review-approval"
                  className="ml-4 flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Open Payroll ↗
                </a>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Accounts</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((txn) => {
                  const typeConfig = getTypeConfig(txn.type);
                  const sourceConfig = getSourceConfig(txn.source);
                  const TypeIcon = typeConfig.icon;

                  return (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{txn.date}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{txn.id}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${typeConfig.bgColor} ${typeConfig.borderColor} border`}>
                          <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                          <span className={`text-xs font-medium ${typeConfig.textColor}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${sourceConfig.color}`}>
                          <Tag className="w-3 h-3 mr-1" />
                          {sourceConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{txn.description}</p>
                          {txn.notes && (
                            <p className="text-xs text-gray-500 mt-1">{txn.notes}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{txn.referenceId}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-mono font-bold ${
                            txn.type === "REVENUE" ? "text-green-600" :
                            txn.type === "REFUND" ? "text-orange-600" :
                            "text-red-600"
                          }`}>
                            {txn.type === "REVENUE" ? "+" : "-"}₹{txn.amount.toLocaleString("en-IN")}
                          </span>
                          <span className="text-xs text-gray-500">financeEngine</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <p className="text-gray-600">
                            <span className="font-medium">Dr:</span> {txn.accountDebit}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Cr:</span> {txn.accountCredit}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {txn.status === "POSTED" && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Posted
                          </Badge>
                        )}
                        {txn.status === "PENDING" && (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {txn.status === "REVERSED" && (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Reversed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Database className="w-4 h-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Transaction Model - No UI Calculations</AlertTitle>
        <AlertDescription className="text-blue-700 text-sm">
          All transaction amounts are calculated by <strong>financeEngine</strong> and posted automatically from source engines:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>operationsEngine</strong> → Posts REVENUE transactions when units are completed</li>
            <li><strong>subscriptionEngine</strong> → Posts REVENUE transactions when subscriptions are paid</li>
            <li><strong>payrollEngine</strong> → Posts SALARY and EXPENSE transactions (wages, PF, ESI)</li>
            <li><strong>refundEngine</strong> → Posts REFUND transactions that reverse revenue</li>
            <li><strong>expenseEngine</strong> → Posts EXPENSE transactions from approved expense claims</li>
            <li><strong>manualEntry</strong> → Finance team posts EXPENSE transactions manually</li>
          </ul>
          <p className="mt-2 font-medium">The UI only displays transactions - no calculations are performed here.</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
