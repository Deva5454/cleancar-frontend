import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService, CHART_OF_ACCOUNTS_HEADS, type LedgerMaster } from "../../services/accountingEntryService";
import { Download, Search } from "lucide-react";

export function AccountsLedger() {
  const { city } = useCity();
  const [selectedHead, setSelectedHead] = useState("");
  const [selectedLedgerId, setSelectedLedgerId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Get ledgers for selected account head
  const ledgersForHead = useMemo(() => {
    if (!selectedHead) return [];
    return accountingEntryService.getLedgersByHead(selectedHead, city);
  }, [selectedHead, city]);

  // Get selected ledger details
  const selectedLedger = useMemo(() => {
    if (!selectedLedgerId) return null;
    return accountingEntryService.getLedgers(city).find(l => l.id === selectedLedgerId);
  }, [selectedLedgerId, city]);

  // Get ledger entries for selected ledger — uses name cross-reference so
  // SYS-... IDs and LM-... IDs for the same account both show the same entries
  const ledgerEntries = useMemo(() => {
    if (!selectedLedgerId) return [];
    const from = dateFrom || "1900-01-01";
    const to = dateTo || "2099-12-31";
    return accountingEntryService
      .getLedgerEntries(selectedLedgerId, city)
      .filter(e => e.date >= from && e.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedLedgerId, dateFrom, dateTo, city]);

  // Calculate running balance
  const ledgerWithBalance = useMemo(() => {
    const openingBal = selectedLedger?.openingBalance || 0;
    const openingType = selectedLedger?.openingBalanceType || "Dr";
    let runningBalance = openingType === "Dr" ? openingBal : -openingBal;

    return ledgerEntries.map((entry) => {
      const isDebit = entry.debitAccount === selectedLedgerId;
      // FIX: totalBillValue is the GST-inclusive amount; fall back to taxableValue
      // for entries that only have taxableValue (e.g. RCM, non-GST entries)
      const amount = (entry.totalBillValue && entry.totalBillValue > 0)
        ? entry.totalBillValue
        : (entry.taxableValue || 0);
      runningBalance += isDebit ? amount : -amount;
      return {
        ...entry,
        debit: isDebit ? amount : 0,
        credit: isDebit ? 0 : amount,
        balance: runningBalance,
      };
    });
  }, [ledgerEntries, selectedLedgerId, selectedLedger]);

  const openingBalance = selectedLedger?.openingBalance || 0;
  const openingBalanceType = selectedLedger?.openingBalanceType || "Dr";
  const closingBalance = ledgerWithBalance.length > 0 ? ledgerWithBalance[ledgerWithBalance.length - 1].balance : (openingBalanceType === "Dr" ? openingBalance : -openingBalance);
  const totalDebit = ledgerWithBalance.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = ledgerWithBalance.reduce((sum, e) => sum + e.credit, 0);

  // Get ledger balance info — pass city so it doesn't mix Mumbai/Surat ledgers
  const ledgerBalance = useMemo(() => {
    if (!selectedLedgerId) return null;
    return accountingEntryService.getLedgerBalance(selectedLedgerId, city);
  }, [selectedLedgerId, city]);

  // Quick search: find customer ledgers
  const handleCustomerSearch = (searchTerm: string) => {
    setCustomerSearch(searchTerm);
    if (!searchTerm.trim()) return;

    const allLedgers = accountingEntryService.getLedgers(city);
    const customerLedger = allLedgers.find(
      l => l.type === "customer" && l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (customerLedger) {
      setSelectedHead(customerLedger.accountHead);
      setSelectedLedgerId(customerLedger.id);
    }
  };

  const exportCSV = () => {
    const ledgerName = selectedLedger?.name || selectedLedgerId;
    const headers = ["Date", "Voucher No", "Description", "Debit", "Credit", "Balance"];
    const rows = ledgerWithBalance.map((e) => [
      e.date,
      e.voucherNumber,
      e.narration || e.invoiceNumber || "-",
      (e?.debit ?? 0).toFixed(2),
      (e?.credit ?? 0).toFixed(2),
      (e?.balance ?? 0).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${ledgerName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ledger</h1>
          <p className="text-sm text-gray-600">Account-wise passbook in ledger format</p>
        </div>
        {selectedLedgerId && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border rounded text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Customer Quick Search */}
      <div className="p-4 bg-blue-50 rounded border border-blue-200">
        <label className="block text-sm font-medium mb-2">Customer Ledger Quick Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => handleCustomerSearch(e.target.value)}
            placeholder="Type customer name to find their debtor ledger..."
            className="w-full border rounded px-10 py-2"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Account Head</label>
          <select
            value={selectedHead}
            onChange={(e) => {
              setSelectedHead(e.target.value);
              setSelectedLedgerId("");
            }}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Account Head</option>
            {["asset", "liability", "income", "expense"].map((nature) => (
              <optgroup key={nature} label={nature.toUpperCase()}>
                {CHART_OF_ACCOUNTS_HEADS.filter((h) => h.nature === nature).map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ledger</label>
          <select
            value={selectedLedgerId}
            onChange={(e) => setSelectedLedgerId(e.target.value)}
            className="w-full border rounded px-3 py-2"
            disabled={!selectedHead}
          >
            <option value="">Select Ledger</option>
            {ledgersForHead.map((ledger) => (
              <option key={ledger.id} value={ledger.id}>
                {ledger.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Ledger Identity Card */}
      {selectedLedger && ledgerBalance && (
        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-gray-500">Ledger Name</p>
              <p className="font-semibold">{selectedLedger.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Account Head</p>
              <p className="font-semibold">{selectedLedger.accountHeadLabel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="font-semibold capitalize">{selectedLedger.type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current Balance</p>
              <p className={`font-semibold ${ledgerBalance.balanceType === "Dr" ? "text-red-600" : "text-green-600"}`}>
                ₹{(ledgerBalance?.balance ?? 0).toFixed(2)} {ledgerBalance.balanceType}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Opening Balance</p>
              <p className={`font-semibold ${openingBalanceType === "Dr" ? "text-red-600" : "text-green-600"}`}>
                ₹{openingBalance.toFixed(2)} {openingBalanceType}
              </p>
            </div>
          </div>
        </div>
      )}

      {!selectedLedgerId ? (
        <div className="text-center py-12 text-gray-500">
          <p>Select an account head and ledger to view passbook</p>
        </div>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Voucher No</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Debit (₹)</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Credit (₹)</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Closing Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr className="bg-blue-50 font-bold">
                <td className="px-4 py-3" colSpan={3}>
                  Opening Balance
                </td>
                <td className="px-4 py-3 text-right text-red-600">
                  {openingBalanceType === "Dr" ? `₹${openingBalance.toFixed(2)}` : "-"}
                </td>
                <td className="px-4 py-3 text-right text-green-600">
                  {openingBalanceType === "Cr" ? `₹${openingBalance.toFixed(2)}` : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  ₹{(openingBalanceType === "Dr" ? openingBalance : -openingBalance).toFixed(2)}
                </td>
              </tr>

              {/* Transactions */}
              {ledgerWithBalance.map((entry, idx) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{entry.date}</td>
                  <td className="px-4 py-3 text-sm font-mono">{entry.voucherNumber}</td>
                  <td className="px-4 py-3 text-sm">{entry.narration || entry.invoiceNumber || "-"}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">
                    {entry.debit > 0 ? `₹${(entry?.debit ?? 0).toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">
                    {entry.credit > 0 ? `₹${(entry?.credit ?? 0).toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">₹{(entry?.balance ?? 0).toFixed(2)}</td>
                </tr>
              ))}

              {/* Closing Balance */}
              <tr className="bg-green-50 font-bold">
                <td className="px-4 py-3" colSpan={3}>
                  Closing Balance
                </td>
                <td className="px-4 py-3 text-right text-red-600">₹{totalDebit.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-green-600">₹{totalCredit.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  ₹{Math.abs(closingBalance).toFixed(2)}&nbsp;
                  <span className="text-xs text-gray-500">{closingBalance >= 0 ? "Dr" : "Cr"}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {ledgerWithBalance.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions found for this account in the selected period</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
