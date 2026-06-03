import { useState, useEffect, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import {
  accountingEntryService,
  type AccountingEntry,
  type EntryType,
  type GSTEntryType,
  type PaymentMode,
  CHART_OF_ACCOUNTS_HEADS,
} from "../../services/accountingEntryService";
import { Download, Upload, Eye, Edit, FileText, X, RefreshCw } from "lucide-react";

const ENTRY_TYPE_COLORS: Record<EntryType, string> = {
  Expense: "bg-red-100 text-red-800",
  Purchase: "bg-orange-100 text-orange-800",
  PurchaseReturn: "bg-green-100 text-green-800",
  Sales: "bg-blue-100 text-blue-800",
  SalesReturn: "bg-purple-100 text-purple-800",
  AssetPurchase: "bg-gray-100 text-gray-800",
};

export function AccountingTransactionList() {
  const { city } = useCity();
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState<EntryType | "All">("All");
  const [gstTypeFilter, setGstTypeFilter] = useState<GSTEntryType | "All">("All");
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentMode | "All">("All");
  const [vendorSearch, setVendorSearch] = useState("");
  const [voucherSearch, setVoucherSearch] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // Detail panel
  const [selectedEntry, setSelectedEntry] = useState<AccountingEntry | null>(null);

  // Fetch entries on mount (always fresh from service)
  useEffect(() => {
    const allEntries = accountingEntryService.getAllEntries(city);
    setEntries(allEntries);
  }, [city, refreshKey]); // re-fetch when city changes or refresh triggered

  // Refresh when component gains focus (user navigated back from AccountingEntry)
  useEffect(() => {
    const handleFocus = () => setRefreshKey(k => k + 1);
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (dateFrom && entry.date < dateFrom) return false;
      if (dateTo && entry.date > dateTo) return false;
      if (entryTypeFilter !== "All" && entry.entryType !== entryTypeFilter) return false;
      if (gstTypeFilter !== "All" && entry.gstEntryType !== gstTypeFilter) return false;
      if (paymentModeFilter !== "All" && entry.paymentMode !== paymentModeFilter) return false;
      if (vendorSearch && !entry.vendorName?.toLowerCase().includes(vendorSearch.toLowerCase())) return false;
      if (voucherSearch && !entry.voucherNumber.toLowerCase().includes(voucherSearch.toLowerCase())) return false;
      if (minAmount && entry.totalBillValue < parseFloat(minAmount)) return false;
      if (maxAmount && entry.totalBillValue > parseFloat(maxAmount)) return false;
      return true;
    });
  }, [entries, dateFrom, dateTo, entryTypeFilter, gstTypeFilter, paymentModeFilter, vendorSearch, voucherSearch, minAmount, maxAmount]);

  const exportCSV = () => {
    const headers = [
      "Voucher No",
      "Date",
      "Entry Type",
      "Vendor/Customer",
      "Invoice No",
      "Taxable Value",
      "CGST",
      "SGST",
      "IGST",
      "Total",
      "Payment Mode",
      "Status",
    ];
    const rows = filteredEntries.map((e) => [
      e.voucherNumber,
      e.date,
      e.entryType,
      e.vendorName || "",
      e.invoiceNumber,
      e.taxableValue,
      e.cgst,
      e.sgst,
      e.igst,
      e.totalBillValue,
      e.paymentMode,
      e.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transaction List</h1>
          <p className="text-sm text-gray-600">Master transaction register</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border rounded text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
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
        <div>
          <label className="block text-sm font-medium mb-1">Entry Type</label>
          <select
            value={entryTypeFilter}
            onChange={(e) => setEntryTypeFilter(e.target.value as EntryType | "All")}
            className="w-full border rounded px-3 py-2"
          >
            <option value="All">All</option>
            <option value="Expense">Expense</option>
            <option value="Purchase">Purchase</option>
            <option value="PurchaseReturn">Purchase Return</option>
            <option value="Sales">Sales</option>
            <option value="SalesReturn">Sales Return</option>
            <option value="AssetPurchase">Asset Purchase</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Payment Mode</label>
          <select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value as PaymentMode | "All")}
            className="w-full border rounded px-3 py-2"
          >
            <option value="All">All</option>
            <option value="Bank">Bank</option>
            <option value="Cash">Cash</option>
            <option value="PettyCash">Petty Cash</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vendor Search</label>
          <input
            type="text"
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            placeholder="Search vendor..."
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Voucher Number</label>
          <input
            type="text"
            value={voucherSearch}
            onChange={(e) => setVoucherSearch(e.target.value)}
            placeholder="Search voucher..."
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Min Amount</label>
          <input
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="₹0"
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Amount</label>
          <input
            type="number"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            placeholder="₹999999"
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredEntries.length} of {entries.length} transactions
      </div>

      {/* Table */}
      <div className="border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Voucher No</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Entry Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vendor/Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Invoice No</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Taxable Value</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">CGST</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">SGST</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">IGST</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Payment</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedEntry(entry)}
                    className="font-mono text-sm text-blue-600 hover:underline"
                  >
                    {entry.voucherNumber}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm">{entry.date}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${ENTRY_TYPE_COLORS[entry.entryType]}`}>
                    {entry.entryType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{entry.vendorName || "-"}</td>
                <td className="px-4 py-3 text-sm">{entry.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-right">₹{(entry?.taxableValue ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{(entry?.cgst ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{(entry?.sgst ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{(entry?.igst ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">₹{(entry?.totalBillValue ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{entry.paymentMode}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      entry.status === "Posted"
                        ? "bg-green-100 text-green-800"
                        : entry.status === "Draft"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {entry.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setSelectedEntry(entry)}
                    className="text-blue-600 hover:text-blue-800"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
          <div className="bg-white w-1/2 h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Entry Details</h2>
              <button onClick={() => setSelectedEntry(null)} className="text-gray-600 hover:text-gray-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Voucher Number</p>
                  <p className="font-mono font-medium">{selectedEntry.voucherNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{selectedEntry.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Entry Type</p>
                  <p className="font-medium">{selectedEntry.entryType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium">{selectedEntry.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendor/Customer</p>
                  <p className="font-medium">{selectedEntry.vendorName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">GSTIN</p>
                  <p className="font-mono">{selectedEntry.vendorGstin || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-medium">{selectedEntry.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Mode</p>
                  <p className="font-medium">{selectedEntry.paymentMode}</p>
                </div>
              </div>

              <hr />

              <div>
                <h3 className="font-semibold mb-2">Amounts</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Taxable Value</p>
                    <p className="font-medium">₹{(selectedEntry?.taxableValue ?? 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">GST Rate</p>
                    <p className="font-medium">{selectedEntry.gstRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CGST</p>
                    <p className="font-medium">₹{(selectedEntry?.cgst ?? 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">SGST</p>
                    <p className="font-medium">₹{(selectedEntry?.sgst ?? 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">IGST</p>
                    <p className="font-medium">₹{(selectedEntry?.igst ?? 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Bill Value</p>
                    <p className="text-lg font-bold text-blue-600">₹{(selectedEntry?.totalBillValue ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <hr />

              <div>
                <h3 className="font-semibold mb-2">Ledger Posting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Debit Account</p>
                    <p className="font-medium">{selectedEntry.debitAccount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Credit Account</p>
                    <p className="font-medium">{selectedEntry.creditAccount}</p>
                  </div>
                </div>
              </div>

              {selectedEntry.narration && (
                <>
                  <hr />
                  <div>
                    <p className="text-sm text-gray-600">Narration</p>
                    <p className="font-medium">{selectedEntry.narration}</p>
                  </div>
                </>
              )}

              <hr />

              <div>
                <h3 className="font-semibold mb-3">Audit Trail</h3>

                {/* Created Info Badge */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-medium text-blue-900">
                    Created by {selectedEntry.createdBy}
                  </p>
                  <p className="text-xs text-blue-700">
                    {new Date(selectedEntry.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Change Timeline */}
                {selectedEntry.changeHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No edits — original entry.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedEntry.changeHistory.map((change, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-gray-900">{change.field}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(change.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium text-red-600">Before:</span>{" "}
                            <span className="text-red-700">{change.previousValue || "(empty)"}</span>
                          </p>
                          <p className="text-sm">
                            <span className="font-medium text-green-600">After:</span>{" "}
                            <span className="text-green-700">{change.newValue || "(empty)"}</span>
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          Changed by <span className="font-medium">{change.changedBy}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedEntry.updatedAt && (
                  <p className="text-xs text-gray-500 mt-3">
                    Last updated at {new Date(selectedEntry.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
