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
import { useFinance, type LedgerEntry as RealLedgerEntry } from "../../contexts/FinanceContext";
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

// Derives the account category from the real chart-of-accounts numbering
// convention already used throughout FinanceContext (see LedgerEntry comment
// there): 1000s Assets, 2000s Liabilities, 3000s Equity, 4000s Income, 5000s Expenses.
function categoryFromAccountCode(code: string): LedgerEntry["accountCategory"] {
  const n = parseInt(code, 10);
  if (n >= 1000 && n < 2000) return "Assets";
  if (n >= 2000 && n < 3000) return "Liabilities";
  if (n >= 3000 && n < 4000) return "Equity";
  if (n >= 4000 && n < 5000) return "Income";
  return "Expenses";
}

const SOURCE_LABELS: Record<string, string> = {
  Invoice: "Revenue Engine", Payment: "Payment Engine", Payroll: "Payroll Engine",
  Expense: "Expense Engine", Adjustment: "Adjustment Engine",
};

// Groups the real flat ledger entries (FinanceContext) into the
// transaction-with-paired-entries shape this screen renders. Real entries
// created together share a referenceId (see FinanceContext's ledger-posting
// functions) — that's the natural grouping key; entries with no referenceId
// each stand alone as their own transaction rather than being silently merged.
function groupIntoTransactions(entries: RealLedgerEntry[], cityDisplayName: string): TransactionWithEntries[] {
  const groups = new Map<string, RealLedgerEntry[]>();
  entries.forEach((e, idx) => {
    const key = e.referenceId || `__standalone_${e.ledgerEntryId || idx}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  });

  return Array.from(groups.entries())
    .map(([referenceId, group]): TransactionWithEntries => {
      const first = group[0];
      const totalDebit = group.filter(e => e.entryType === "DEBIT").reduce((s, e) => s + e.amount, 0);
      return {
        transactionId: referenceId,
        transactionDate: first.entryDate,
        transactionType: (first.referenceType || "GENERAL").toUpperCase(),
        referenceId,
        description: first.description,
        totalAmount: totalDebit,
        sourceEngine: first.referenceType ? (SOURCE_LABELS[first.referenceType] || "financeEngine") : "financeEngine",
        postedBy: "System",
        city: cityDisplayName,
        ledgerEntries: group.map((e): LedgerEntry => ({
          id: e.ledgerEntryId,
          accountCode: e.accountCode,
          accountName: e.accountName,
          accountCategory: categoryFromAccountCode(e.accountCode),
          debit: e.entryType === "DEBIT" ? e.amount : 0,
          credit: e.entryType === "CREDIT" ? e.amount : 0,
        })),
        status: "posted",
        postedAt: first.createdAt,
      };
    })
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
}

interface LedgerEntriesViewProps {
  transactionId?: string;
  isDialog?: boolean;
}

export function LedgerEntriesView({
  transactionId,
  isDialog = false
}: LedgerEntriesViewProps) {
  const { city, cityInfo } = useCity();
  const { getLedgerEntriesByCity } = useFinance();
  const realEntries = getLedgerEntriesByCity(city);
  const REAL_TRANSACTIONS = groupIntoTransactions(realEntries, cityInfo.displayName);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithEntries | null>(
    transactionId ? REAL_TRANSACTIONS[0] || null : null
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
            {REAL_TRANSACTIONS.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No ledger entries yet for {cityInfo.displayName}. Entries appear here automatically once invoices, payments, payroll, or expenses are posted.
              </div>
            ) : (
            <div className="space-y-2">
              {REAL_TRANSACTIONS.map((txn) => (
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
            )}
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

export default LedgerEntriesView;
