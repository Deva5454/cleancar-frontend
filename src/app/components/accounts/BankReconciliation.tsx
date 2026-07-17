/**
 * BankReconciliation — /accounts/bank-reconciliation
 *
 * Real reconciliation between what's recorded in the books and what a
 * real bank statement shows. Built on getAllMovements() — the one real
 * function that already combines both AccountingEntry and JournalEntry
 * postings, so this genuinely sees every real bank-related transaction,
 * not just one entry type.
 *
 * No real sample bank statement was available while building this, so
 * rather than guess a fixed column layout (which would likely be wrong
 * for whatever the actual bank export looks like), the CSV import asks
 * the person to map their file's real columns to Date/Description/
 * Debit/Credit once — a one-time few-second step, safer than silently
 * guessing and matching the wrong numbers.
 *
 * Bank selection is dynamic — any real ledger with accountHead ===
 * "cash_bank" shows up here, not just Axis Bank, so this is already
 * ready for more bank accounts later without any code changes.
 */

import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService } from "../../services/accountingEntryService";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Landmark, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface StatementLine {
  date: string;
  description: string;
  amount: number; // positive = credit (money in), negative = debit (money out)
  matched: boolean;
}

interface BookMovement {
  date: string;
  description: string;
  voucherNumber: string;
  amount: number; // positive = credit (money in), negative = debit (money out)
  matched: boolean;
}

export function BankReconciliation() {
  const { city } = useCity();

  const bankLedgers = useMemo(
    () => accountingEntryService.getLedgers(city).filter((l) => l.accountHead === "cash_bank"),
    [city]
  );
  const [selectedBankId, setSelectedBankId] = useState(bankLedgers[0]?.id || "");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Raw CSV state, pending column mapping
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [dateCol, setDateCol] = useState("");
  const [descCol, setDescCol] = useState("");
  const [debitCol, setDebitCol] = useState("");
  const [creditCol, setCreditCol] = useState("");

  const [statementLines, setStatementLines] = useState<StatementLine[] | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) { toast.error("This file doesn't look like a real statement export."); return; }
        const headers = lines[0].split(",").map((h) => h.trim());
        const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
        setRawHeaders(headers);
        setRawRows(rows);
        setStatementLines(null);
        toast.info("File loaded — map the real columns below before importing.");
      } catch {
        toast.error("Could not read this file — please check it's a real CSV export.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!dateCol || !descCol || (!debitCol && !creditCol)) {
      toast.error("Map at least Date, Description, and one of Debit/Credit before importing.");
      return;
    }
    const dateIdx = rawHeaders.indexOf(dateCol);
    const descIdx = rawHeaders.indexOf(descCol);
    const debitIdx = debitCol ? rawHeaders.indexOf(debitCol) : -1;
    const creditIdx = creditCol ? rawHeaders.indexOf(creditCol) : -1;

    const parsed: StatementLine[] = rawRows
      .map((row) => {
        const debit = debitIdx >= 0 ? parseFloat((row[debitIdx] || "0").replace(/,/g, "")) || 0 : 0;
        const credit = creditIdx >= 0 ? parseFloat((row[creditIdx] || "0").replace(/,/g, "")) || 0 : 0;
        return {
          date: row[dateIdx] || "",
          description: row[descIdx] || "",
          amount: credit - debit,
          matched: false,
        };
      })
      .filter((l) => l.date && l.amount !== 0);

    setStatementLines(parsed);
    toast.success(`${parsed.length} real statement lines imported.`);
  };

  // Real book-side movements for the selected bank and date range,
  // pulled from the one function that already covers both entry types.
  const bookMovements = useMemo<BookMovement[]>(() => {
    if (!selectedBankId) return [];
    const all = accountingEntryService.getAllMovements(fromDate, toDate, city);
    return all
      .filter((m) => m.debitLedgerId === selectedBankId || m.creditLedgerId === selectedBankId)
      .map((m) => ({
        date: m.date,
        description: m.description,
        voucherNumber: m.voucherNumber,
        // Money coming INTO the bank = bank ledger debited; money OUT = bank ledger credited
        amount: m.debitLedgerId === selectedBankId ? m.amount : -m.amount,
        matched: false,
      }));
  }, [selectedBankId, fromDate, toDate, city]);

  // Real matching: same date, same amount (within a paisa of rounding).
  const { matchedBook, matchedStatement, bookOnly, statementOnly } = useMemo(() => {
    if (!statementLines) {
      return { matchedBook: [], matchedStatement: [], bookOnly: bookMovements, statementOnly: [] as StatementLine[] };
    }
    const usedStatement = new Set<number>();
    const mBook: BookMovement[] = [];
    const bOnly: BookMovement[] = [];

    bookMovements.forEach((bm) => {
      const idx = statementLines.findIndex(
        (sl, i) => !usedStatement.has(i) && sl.date === bm.date && Math.abs(sl.amount - bm.amount) < 0.01
      );
      if (idx >= 0) {
        usedStatement.add(idx);
        mBook.push({ ...bm, matched: true });
      } else {
        bOnly.push(bm);
      }
    });

    const mStatement = statementLines.filter((_, i) => usedStatement.has(i)).map((s) => ({ ...s, matched: true }));
    const sOnly = statementLines.filter((_, i) => !usedStatement.has(i));

    return { matchedBook: mBook, matchedStatement: mStatement, bookOnly: bOnly, statementOnly: sOnly };
  }, [statementLines, bookMovements]);

  const bookBalance = bookMovements.reduce((s, m) => s + m.amount, 0);
  const statementBalance = (statementLines || []).reduce((s, l) => s + l.amount, 0);
  const difference = statementLines ? statementBalance - bookBalance : null;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-blue-600" />
          Bank Reconciliation
        </h1>
        <p className="text-sm text-gray-500">
          Compare what's recorded in the books against a real bank statement
        </p>
      </div>

      {/* Bank + date range */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="mb-1 block">Bank Account</Label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}>
            {bankLedgers.length === 0 && <option value="">No bank ledgers found</option>}
            {bankLedgers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <Label className="mb-1 block">From</Label>
          <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={fromDate}
            onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1 block">To</Label>
          <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={toDate}
            onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      {/* CSV upload */}
      <div className="border rounded-lg p-4 space-y-3">
        <Label className="block">Upload Real Bank Statement (CSV)</Label>
        <input type="file" accept=".csv" onChange={handleFileUpload} className="text-sm" />

        {rawHeaders.length > 0 && (
          <div className="mt-3 space-y-3 border-t pt-3">
            <p className="text-sm text-gray-600">
              Match this file's real columns — every bank formats these differently, so nothing is assumed.
            </p>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Date column *</Label>
                <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={dateCol} onChange={(e) => setDateCol(e.target.value)}>
                  <option value="">Select...</option>
                  {rawHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Description column *</Label>
                <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={descCol} onChange={(e) => setDescCol(e.target.value)}>
                  <option value="">Select...</option>
                  {rawHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Debit column</Label>
                <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={debitCol} onChange={(e) => setDebitCol(e.target.value)}>
                  <option value="">None</option>
                  {rawHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Credit column</Label>
                <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={creditCol} onChange={(e) => setCreditCol(e.target.value)}>
                  <option value="">None</option>
                  {rawHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <Button size="sm" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-1" /> Import & Match
            </Button>
          </div>
        )}
      </div>

      {statementLines && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border bg-gray-50">
              <p className="text-xs text-gray-500">Book Balance (this period)</p>
              <p className="text-lg font-bold">₹{bookBalance.toLocaleString("en-IN")}</p>
            </div>
            <div className="p-4 rounded-lg border bg-gray-50">
              <p className="text-xs text-gray-500">Statement Balance (this period)</p>
              <p className="text-lg font-bold">₹{statementBalance.toLocaleString("en-IN")}</p>
            </div>
            <div className={`p-4 rounded-lg border ${Math.abs(difference || 0) < 0.01 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <p className="text-xs text-gray-500">Difference</p>
              <p className={`text-lg font-bold ${Math.abs(difference || 0) < 0.01 ? "text-green-700" : "text-red-700"}`}>
                {Math.abs(difference || 0) < 0.01 ? (
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Reconciled</span>
                ) : (
                  `₹${(difference || 0).toLocaleString("en-IN")}`
                )}
              </p>
            </div>
          </div>

          {/* In bank statement only */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              In Bank Statement Only ({statementOnly.length})
            </h3>
            <p className="text-xs text-gray-400 mb-2">The bank shows this, but it isn't recorded in the books — usually a missed entry or an unrecorded bank charge.</p>
            {statementOnly.length === 0 ? (
              <p className="text-sm text-gray-400">Nothing here — every statement line matches a real book entry.</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {statementOnly.map((l, i) => (
                  <div key={i} className="flex justify-between px-3 py-2 border-b last:border-0 text-sm bg-amber-50">
                    <span>{l.date} — {l.description}</span>
                    <span className="font-medium">₹{l.amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* In books only */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              In Books Only ({bookOnly.length})
            </h3>
            <p className="text-xs text-gray-400 mb-2">Recorded in the books, but hasn't shown up on the bank statement yet — often just timing (a cheque still clearing).</p>
            {bookOnly.length === 0 ? (
              <p className="text-sm text-gray-400">Nothing here — every book entry matches a real statement line.</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {bookOnly.map((m, i) => (
                  <div key={i} className="flex justify-between px-3 py-2 border-b last:border-0 text-sm bg-blue-50">
                    <span>{m.date} — {m.description} ({m.voucherNumber})</span>
                    <span className="font-medium">₹{m.amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matched, collapsed summary */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Matched ({matchedBook.length})
            </h3>
            <p className="text-xs text-gray-400">Same date, same amount, on both sides — no action needed.</p>
          </div>
        </>
      )}

      <p className="text-xs text-gray-400 border-t pt-3">
        Matching is by exact date and amount — deliberately not a fuzzy match, since a false match on real
        money is worse than asking a person to resolve something uncertain by hand.
      </p>
    </div>
  );
}

export default BankReconciliation;
