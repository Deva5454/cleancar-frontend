import { BackButton } from "../ui/back-button";
/**
 * Ledger Entries View - Double-Entry Bookkeeping Display
 *
 * Shows detailed debit/credit entries for a transaction
 * Generic structure - NO hardcoded revenue/expense logic
 * All data comes from financeEngine
 *
 * @component
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useCity } from "../../contexts/CityContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  BookOpen,
  ArrowRight,
  Calendar,
  Hash,
  FileText,
  Database,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

// Generic Ledger Entry structure
interface LedgerEntry {
  id: string;
  accountCode: string;
  accountName: string;
  accountCategory: "Assets" | "Liabilities" | "Equity" | "Income" | "Expenses";
  debit: number;
  credit: number;
}

// Transaction with Ledger Entries
interface TransactionWithEntries {
  // Transaction metadata
  transactionId: string;
  transactionDate: string;
  transactionType: string;
  referenceId: string;
  description: string;
  totalAmount: number;

  // Source information (where it came from)
  sourceEngine: string;
  postedBy: string;

  // Location/org information
  city?: string;
  cluster?: string;

  // Ledger entries (double-entry bookkeeping)
  ledgerEntries: LedgerEntry[];

  // Status
  status: "posted" | "pending" | "reversed";

  // Audit trail
  postedAt: string;
  notes?: string;
}

// Mock transaction data - In production, this comes from financeEngine
const getMockTransaction = (cityName: string): TransactionWithEntries => ({
  transactionId: "TXN-2026-04-001",
  transactionDate: "2026-04-20",
  transactionType: "REVENUE",
  referenceId: "UNIT-395001-2026-04-20-001",
  description: "Car wash service revenue - 4W Premium Package",
  totalAmount: 499,
  sourceEngine: "operationsEngine",
  postedBy: "System Auto-Post",
  city: cityName,
  cluster: "Adajan",
  status: "posted",
  postedAt: "2026-04-20 14:35:22",
  notes: "Auto-posted from completed unit. Customer: CUST-1023. Washer: CW-395001-001 (Rajesh Kumar).",
  ledgerEntries: [
    {
      id: "LE-001-DR",
      accountCode: "1200",
      accountName: "Accounts Receivable",
      accountCategory: "Assets",
      debit: 499,
      credit: 0,
    },
    {
      id: "LE-001-CR",
      accountCode: "4000",
      accountName: "Service Revenue",
      accountCategory: "Income",
      debit: 0,
      credit: 499,
    },
  ],
});

const getMockSalaryTransaction = (cityName: string): TransactionWithEntries => ({
  transactionId: "TXN-2026-04-002",
  transactionDate: "2026-04-20",
  transactionType: "SALARY",
  referenceId: "PAYROLL-FEB-2026-WASHERS",
  description: "February 2026 Payroll - Car Washers",
  totalAmount: 285000,
  sourceEngine: "payrollEngine",
  postedBy: "Payroll Processing Engine",
  city: cityName,
  status: "posted",
  postedAt: "2026-04-20 16:12:45",
  notes: "Auto-posted from payroll processing. Total employees: 15. Snapshot ID: SNAP-2026-04-001.",
  ledgerEntries: [
    {
      id: "LE-002-DR-1",
      accountCode: "5200",
      accountName: "Wage Expense",
      accountCategory: "Expenses",
      debit: 285000,
      credit: 0,
    },
    {
      id: "LE-002-CR-1",
      accountCode: "2100",
      accountName: "Salary Payable",
      accountCategory: "Liabilities",
      debit: 0,
      credit: 285000,
    },
  ],
});

const getMockExpenseTransaction = (cityName: string): TransactionWithEntries => ({
  transactionId: "TXN-2026-04-003",
  transactionDate: "2026-04-19",
  transactionType: "EXPENSE",
  referenceId: "PO-2026-045",
  description: "Cleaning supplies purchase - CleanPro Supplies",
  totalAmount: 17700,
  sourceEngine: "manualEntry",
  postedBy: "Accounts Manager - Sarah",
  city: cityName,
  status: "posted",
  postedAt: "2026-04-19 11:28:15",
  notes: "Invoice: INV-CP-2026-045. GST: 18%. Base: ₹15,000 + GST: ₹2,700 = ₹17,700.",
  ledgerEntries: [
    {
      id: "LE-003-DR-1",
      accountCode: "5100",
      accountName: "Materials Expense",
      accountCategory: "Expenses",
      debit: 15000,
      credit: 0,
    },
    {
      id: "LE-003-DR-2",
      accountCode: "1310",
      accountName: "GST Input Credit",
      accountCategory: "Assets",
      debit: 2700,
      credit: 0,
    },
    {
      id: "LE-003-CR-1",
      accountCode: "2000",
      accountName: "Accounts Payable",
      accountCategory: "Liabilities",
      debit: 0,
      credit: 17700,
    },
  ],
});

const getAllMockTransactions = (cityName: string) => [
  getMockTransaction(cityName),
  getMockSalaryTransaction(cityName),
  getMockExpenseTransaction(cityName),
];

interface LedgerEntriesViewProps {
  transactionId?: string;
  isDialog?: boolean;
}

export function LedgerEntriesView({
  transactionId,
  isDialog = false
}: LedgerEntriesViewProps) {
  const { city, cityInfo } = useCity();
  const ALL_MOCK_TRANSACTIONS = getAllMockTransactions(cityInfo.displayName);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithEntries | null>(
    transactionId ? ALL_MOCK_TRANSACTIONS[0] : null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // In production: fetch from financeEngine based on transactionId
  const transaction = selectedTransaction;

  // Calculate totals
  const totalDebit = transaction?.ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0) || 0;
  const totalCredit = transaction?.ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0) || 0;
  const isBalanced = totalDebit === totalCredit;

  // Open transaction detail
  const viewTransactionDetail = (txn: TransactionWithEntries) => {
    setSelectedTransaction(txn);
    setIsDetailDialogOpen(true);
  };

  // Main content
  const renderLedgerView = () => {
    if (!transaction) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Transaction Selected</h3>
            <p className="text-sm text-gray-500">
              Select a transaction from the list to view its ledger entries
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Transaction Header */}
        <Card>
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  Ledger Entries - {transaction.transactionId}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
              </div>
              <Badge
                variant={
                  transaction.status === "posted"
                    ? "default"
                    : transaction.status === "pending"
                    ? "secondary"
                    : "destructive"
                }
              >
                {transaction.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Transaction Date</span>
                </div>
                <p className="font-semibold text-gray-900">{transaction.transactionDate}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Hash className="w-4 h-4" />
                  <span>Reference ID</span>
                </div>
                <p className="font-mono text-sm font-semibold text-gray-900">{transaction.referenceId}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Database className="w-4 h-4" />
                  <span>Source Engine</span>
                </div>
                <Badge variant="outline" className="font-mono">
                  {transaction.sourceEngine}
                </Badge>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <FileText className="w-4 h-4" />
                  <span>Type</span>
                </div>
                <Badge>{transaction.transactionType}</Badge>
              </div>
              {transaction.city && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>City</span>
                  </div>
                  <p className="font-semibold text-gray-900">{transaction.city}</p>
                </div>
              )}
              {transaction.cluster && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>Cluster</span>
                  </div>
                  <p className="font-semibold text-gray-900">{transaction.cluster}</p>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <User className="w-4 h-4" />
                  <span>Posted By</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{transaction.postedBy}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Posted At</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{transaction.postedAt}</p>
              </div>
            </div>
            {transaction.notes && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Notes:</span> {transaction.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engine Label */}
        <Alert className="border-blue-200 bg-blue-50">
          <Database className="w-4 h-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Data Source: financeEngine</AlertTitle>
          <AlertDescription className="text-blue-700 text-sm">
            All ledger entries and amounts are calculated and posted by <strong>financeEngine</strong>.
            This view is read-only and displays the double-entry bookkeeping records.
          </AlertDescription>
        </Alert>

        {/* Ledger Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Double-Entry Ledger
              </span>
              {isBalanced ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Balanced
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Balanced
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-[700px] sm:min-w-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-32">Account Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead className="w-32">Category</TableHead>
                        <TableHead className="text-right w-40">Debit (Dr)</TableHead>
                        <TableHead className="text-right w-40">Credit (Cr)</TableHead>
                      </TableRow>
                    </TableHeader>
                <TableBody>
                  {transaction.ledgerEntries.map((entry, index) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">
                        <code className="bg-gray-100 px-2 py-1 rounded">{entry.accountCode}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.debit > 0 && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <span className="text-xs font-semibold">Dr</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          )}
                          {entry.credit > 0 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <ArrowRight className="w-4 h-4" />
                              <span className="text-xs font-semibold">Cr</span>
                            </div>
                          )}
                          <span className="font-medium">{entry.accountName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            entry.accountCategory === "Assets"
                              ? "border-blue-300 text-blue-700"
                              : entry.accountCategory === "Liabilities"
                              ? "border-red-300 text-red-700"
                              : entry.accountCategory === "Equity"
                              ? "border-purple-300 text-purple-700"
                              : entry.accountCategory === "Income"
                              ? "border-green-300 text-green-700"
                              : "border-orange-300 text-orange-700"
                          }
                        >
                          {entry.accountCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.debit > 0 ? (
                          <span className="font-mono font-semibold text-blue-700">
                            ₹{entry.debit.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit > 0 ? (
                          <span className="font-mono font-semibold text-green-700">
                            ₹{entry.credit.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                    <TableCell colSpan={3} className="text-right text-gray-900">
                      Total
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-blue-900">
                        ₹{totalDebit.toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-green-900">
                        ₹{totalCredit.toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
                </div>
              </div>
            </div>

            {/* Balance Verification */}
            <div className={`mt-4 p-4 border-2 rounded-lg ${
              isBalanced
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {isBalanced ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {isBalanced
                      ? "✓ Double-Entry Balanced"
                      : "✗ Double-Entry Not Balanced"}
                  </p>
                  <p className="text-sm text-gray-700">
                    {isBalanced
                      ? `Total Debit (₹${totalDebit.toLocaleString("en-IN")}) = Total Credit (₹${totalCredit.toLocaleString("en-IN")})`
                      : `Total Debit (₹${totalDebit.toLocaleString("en-IN")}) ≠ Total Credit (₹${totalCredit.toLocaleString("en-IN")})`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // If used as standalone page
  if (!isDialog) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction Ledger Entries</h1>
            <p className="text-sm text-gray-600 mt-1">
              Double-entry bookkeeping view with debit and credit entries
            </p>
          </div>
        </div>

        {/* Transaction List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ALL_MOCK_TRANSACTIONS.map((txn) => (
                <div
                  key={txn.transactionId}
                  onClick={() => viewTransactionDetail(txn)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {txn.transactionId}
                        </span>
                        <Badge>{txn.transactionType}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {txn.sourceEngine}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{txn.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {txn.transactionDate}
                        </span>
                        {txn.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {txn.city}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ₹{txn.totalAmount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {txn.ledgerEntries.length} entries
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {renderLedgerView()}
      </div>
    );
  }

  // If used as dialog
  return (
    <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
      <BackButton />
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Ledger Entries</DialogTitle>
          <DialogDescription>
            Double-entry bookkeeping view showing all debit and credit entries
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {renderLedgerView()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
