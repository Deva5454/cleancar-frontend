import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import {
  accountingEntryService,
  CHART_OF_ACCOUNTS_HEADS,
  type JournalLine,
} from "../../services/accountingEntryService";
import { X } from "lucide-react";

export function JournalEntry() {
  const { currentUser } = useRole();
  const { city, cityInfo } = useCity();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { accountHead: "", accountLabel: "", debit: 0, credit: 0 },
    { accountHead: "", accountLabel: "", debit: 0, credit: 0 },
  ]);
  const [voucherPreview, setVoucherPreview] = useState("");
  const [ledgerSearches, setLedgerSearches] = useState<Record<number, string>>({});

  // All ledgers grouped by account head — for the ledger picker
  const allLedgers = useMemo(() => accountingEntryService.getLedgers(city), [city]);

  // Calculate totals
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit > 0 && totalCredit > 0 && totalDebit === totalCredit;

  // Generate voucher preview — mirrors generateJournalVoucherNumber() in accountingEntryService
  useEffect(() => {
    const allJournals = accountingEntryService.getAllJournals(city);
    const fy = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const fyStr = `${String(fy).slice(-2)}-${String(fy + 1).slice(-2)}`;
    const cityName = cityInfo.displayName.toUpperCase();
    const prefix = `JV/${cityName}/${fyStr}`;
    const maxSeq = allJournals
      .filter(j => j.voucherNumber.startsWith(prefix))
      .map(j => parseInt(j.voucherNumber.split("/").pop() || "0", 10))
      .reduce((max, n) => Math.max(max, n), 0);
    setVoucherPreview(`${prefix}/${String(maxSeq + 1).padStart(4, "0")}`);
  }, [city, cityInfo]);

  const addLine = () => {
    setLines([...lines, { accountHead: "", accountLabel: "", debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      toast.error("At least 2 lines are required for a journal entry.");
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof JournalLine, value: string | number) => {
    const updated = [...lines];
    if (field === "accountHead") {
      updated[index].accountHead = value as string;
      // value is now a ledger ID — look up the ledger name
      const ledger = allLedgers.find(l => l.id === value);
      updated[index].accountLabel = ledger?.name ||
        CHART_OF_ACCOUNTS_HEADS.find((h) => h.value === value)?.label || "";
    } else if (field === "debit" || field === "credit") {
      updated[index][field] = parseFloat(value as string) || 0;
    } else {
      updated[index][field] = value as string;
    }
    setLines(updated);
  };

  const handleSubmit = () => {
    if (!narration.trim()) {
      toast.error("Narration is required.");
      return;
    }
    if (!isBalanced) {
      toast.info("Journal entry must be balanced before posting.");
      return;
    }
    if (lines.some((l) => !l.accountHead)) {
      toast.info("All lines must have an account head selected.");
      return;
    }

    const entry = accountingEntryService.createJournal(
      {
        date,
        narration,
        lines,
        city: cityInfo.displayName,
        cityId: city,
        createdBy: currentUser.name,
      },
      cityInfo.displayName
    );

    toast.info(`Journal entry saved: ${entry.voucherNumber}`);
    resetForm();
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setNarration("");
    setLines([
      { accountHead: "", accountLabel: "", debit: 0, credit: 0 },
      { accountHead: "", accountLabel: "", debit: 0, credit: 0 },
    ]);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Journal Entry</h1>
        <p className="text-sm text-gray-600">
          Manual debit-credit adjustments, salary entries, and invoice-wise settlements.
        </p>
      </div>

      {/* Voucher Strip */}
      <div className="p-4 bg-gray-100 rounded space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Voucher Number</label>
            <input
              type="text"
              value={voucherPreview}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-200 font-mono text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Narration *</label>
            <input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Brief description of journal entry"
            />
          </div>
        </div>
      </div>

      {/* Journal Lines Table */}
      <div className="space-y-4">
        <h3 className="font-semibold">Journal Lines</h3>
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ledger Account</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Debit (₹)</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Credit (₹)</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Invoice Reference (optional)
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lines.map((line, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 min-w-[240px]">
                    <input
                      className="w-full border rounded px-2 py-1 text-sm mb-1"
                      placeholder="Search ledger..."
                      value={ledgerSearches[index] || ""}
                      onChange={e => setLedgerSearches(prev => ({ ...prev, [index]: e.target.value }))}
                    />
                    <select
                      value={line.accountHead}
                      onChange={(e) => updateLine(index, "accountHead", e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                      size={4}
                    >
                      <option value="">— Select Ledger —</option>
                      {CHART_OF_ACCOUNTS_HEADS.map((head) => {
                        const ledgers = allLedgers
                          .filter(l => l.accountHead === head.value)
                          .filter(l => !ledgerSearches[index] || l.name.toLowerCase().includes(ledgerSearches[index].toLowerCase()));
                        if (ledgers.length === 0) return null;
                        return (
                          <optgroup key={head.value} label={`${head.nature.toUpperCase()} › ${head.label}`}>
                            {ledgers.map(ledger => (
                              <option key={ledger.id} value={ledger.id}>
                                {ledger.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                    {line.accountHead && line.accountLabel && (
                      <p className="text-xs text-blue-600 mt-0.5">✓ {line.accountLabel}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={line.debit || ""}
                      onChange={(e) => updateLine(index, "debit", e.target.value)}
                      className="w-full border rounded px-3 py-2 text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={line.credit || ""}
                      onChange={(e) => updateLine(index, "credit", e.target.value)}
                      className="w-full border rounded px-3 py-2 text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={line.invoiceReference || ""}
                      onChange={(e) => updateLine(index, "invoiceReference", e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Optional"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeLine(index)}
                      className="text-red-600 hover:text-red-800"
                      disabled={lines.length <= 2}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addLine} className="px-4 py-2 border rounded text-blue-600 hover:bg-blue-50">
          + Add Line
        </button>
      </div>

      {/* Totals */}
      <div className="flex justify-end gap-8 p-4 bg-gray-50 rounded">
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Debit</p>
          <p className="text-xl font-bold">₹{totalDebit.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Credit</p>
          <p className="text-xl font-bold">₹{totalCredit.toFixed(2)}</p>
        </div>
        <div className="text-right">
          {isBalanced ? (
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-xl font-bold text-green-600">Balanced ✓</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600">Unbalanced by</p>
              <p className="text-xl font-bold text-red-600">₹{difference.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!isBalanced}
        className={`w-full py-3 rounded font-medium ${
          isBalanced
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isBalanced ? "Save & Post Journal Entry" : "Balance Required to Save"}
      </button>
    </div>
  );
}
