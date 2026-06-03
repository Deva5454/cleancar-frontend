import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService, type LedgerMaster } from "../../services/accountingEntryService";
import { showExportMenu } from "../../utils/gstExportUtils";
import { Download } from "lucide-react";

type TabType = "All Purchases" | "GST Purchases" | "Non-GST" | "RCM" | "Asset Purchases";

export function PurchaseSummaryReport() {
  const { city } = useCity();
  const [activeTab, setActiveTab] = useState<TabType>("All Purchases");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [partySearch, setPartySearch] = useState("");
  const [selectedParty, setSelectedParty] = useState<LedgerMaster | null>(null);

  // Get vendor ledgers for search
  const partyResults = useMemo(() => {
    if (!partySearch || partySearch.length < 2) return [];
    const vendors = accountingEntryService.getLedgers(city).filter(l =>
      l.type === "vendor" && l.name.toLowerCase().includes(partySearch.toLowerCase())
    );
    return vendors.slice(0, 10); // Limit to 10 results
  }, [partySearch, city]);

  // Get purchase entries
  const purchases = useMemo(() => {
    const from = dateFrom || "1900-01-01";
    const to = dateTo || "2099-12-31";
    const purchaseEntries = accountingEntryService.getByType("Purchase", city);
    const expenseEntries = accountingEntryService.getByType("Expense", city);
    const assetEntries = accountingEntryService.getByType("AssetPurchase", city);
    let allEntries = [...purchaseEntries, ...expenseEntries, ...assetEntries].filter((e) => e.date >= from && e.date <= to);

    // Filter by selected party
    if (selectedParty) {
      allEntries = allEntries.filter(e => e.vendorId === selectedParty.id || e.vendorName === selectedParty.name);
    }

    return allEntries;
  }, [city, dateFrom, dateTo, selectedParty]);

  // Filter by tab
  const filteredPurchases = useMemo(() => {
    if (activeTab === "All Purchases") return purchases;
    if (activeTab === "GST Purchases")
      return purchases.filter((p) => p.gstEntryType === "B2B" || p.gstEntryType === "Unregistered");
    if (activeTab === "Non-GST") return purchases.filter((p) => p.gstEntryType === "NonGST");
    if (activeTab === "RCM") return purchases.filter((p) => p.isRCM);
    if (activeTab === "Asset Purchases") return purchases.filter((p) => p.entryType === "AssetPurchase");
    return purchases;
  }, [purchases, activeTab]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredPurchases.reduce(
      (acc, p) => ({
        taxable: acc.taxable + p.taxableValue,
        cgst: acc.cgst + p.cgst,
        sgst: acc.sgst + p.sgst,
        igst: acc.igst + p.igst,
        total: acc.total + p.totalBillValue,
      }),
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );
  }, [filteredPurchases]);

  // Party-wise summary
  const partyEntries = useMemo(() => {
    if (!selectedParty) return [];
    return filteredPurchases.map(e => ({
      id: e.id,
      date: e.date,
      invoiceNumber: e.invoiceNumber,
      dueDate: e.date, // Simplified - in production, calculate from payment terms
      amount: e.totalBillValue,
      paymentStatus: e.status === "Posted" ? "Paid" : "Pending",
    }));
  }, [selectedParty, filteredPurchases]);

  const partyTotal = partyEntries.reduce((sum, e) => sum + e.amount, 0);
  const partyPaid = partyEntries.filter(e => e.paymentStatus === "Paid").reduce((sum, e) => sum + e.amount, 0);
  const partyPending = partyTotal - partyPaid;

  const handleExport = (e: React.MouseEvent) => {
    const data = filteredPurchases.map((p) => ({
      Date: p.date,
      "Voucher No": p.voucherNumber,
      Vendor: p.vendorName || "-",
      "Invoice No": p.invoiceNumber,
      "Taxable Value": p.taxableValue,
      CGST: p.cgst,
      SGST: p.sgst,
      IGST: p.igst,
      Total: p.totalBillValue,
      "Entry Type": p.entryType,
      "Payment Mode": p.paymentMode,
    }));
    showExportMenu(data, `purchase-summary-${activeTab.toLowerCase()}`, e.currentTarget as HTMLElement);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Summary Report</h1>
          <p className="text-sm text-gray-600">Consolidated purchase report</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border rounded text-blue-600 hover:bg-blue-50"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
        <div>
          <label className="block text-xs font-medium mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div className="relative">
          <label className="block text-xs font-medium mb-1">Vendor / Supplier</label>
          <input
            type="text"
            placeholder="Search vendor..."
            value={partySearch}
            onChange={(e) => setPartySearch(e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm"
          />
          {partyResults.length > 0 && (
            <div className="absolute border bg-white rounded shadow-lg z-10 max-h-40 overflow-y-auto w-full mt-1">
              {partyResults.map((p) => (
                <div
                  key={p.id}
                  className="px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
                  onClick={() => {
                    setSelectedParty(p);
                    setPartySearch(p.name);
                  }}
                >
                  {p.name}
                </div>
              ))}
            </div>
          )}
          {selectedParty && (
            <button
              onClick={() => {
                setSelectedParty(null);
                setPartySearch("");
              }}
              className="absolute right-2 top-7 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white border-l-4 border-blue-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Taxable</p>
          <p className="text-2xl font-bold text-gray-900">₹{(totals?.taxable ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-amber-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total CGST</p>
          <p className="text-2xl font-bold text-gray-900">₹{(totals?.cgst ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-amber-600 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total SGST</p>
          <p className="text-2xl font-bold text-gray-900">₹{(totals?.sgst ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-purple-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total IGST</p>
          <p className="text-2xl font-bold text-gray-900">₹{(totals?.igst ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-green-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">₹{(totals?.total ?? 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["All Purchases", "GST Purchases", "Non-GST", "RCM", "Asset Purchases"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Voucher No</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vendor</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Invoice No</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Taxable Value</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">CGST</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">SGST</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">IGST</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Entry Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Payment Mode</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPurchases.map((purchase) => (
              <tr key={purchase.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{purchase.date}</td>
                <td className="px-4 py-3 text-sm font-mono">{purchase.voucherNumber}</td>
                <td className="px-4 py-3 text-sm">{purchase.vendorName || "-"}</td>
                <td className="px-4 py-3 text-sm">{purchase.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-right">₹{(purchase?.taxableValue ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{(purchase?.cgst ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{(purchase?.sgst ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{(purchase?.igst ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">₹{(purchase?.totalBillValue ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{purchase.entryType}</td>
                <td className="px-4 py-3 text-sm">{purchase.paymentMode}</td>
              </tr>
            ))}
            {/* Footer Totals */}
            <tr className="bg-gray-100 font-bold">
              <td className="px-4 py-3" colSpan={4}>
                TOTAL
              </td>
              <td className="px-4 py-3 text-sm text-right">₹{(totals?.taxable ?? 0).toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-right">₹{(totals?.cgst ?? 0).toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-right">₹{(totals?.sgst ?? 0).toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-right">₹{(totals?.igst ?? 0).toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-right">₹{(totals?.total ?? 0).toFixed(2)}</td>
              <td className="px-4 py-3" colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Party-wise Summary */}
      {selectedParty && partyEntries.length > 0 && (
        <div className="border rounded-xl p-4 bg-gray-50">
          <div className="font-semibold mb-2">Supplier: {selectedParty.name}</div>
          <div className="font-mono text-sm space-y-1">
            {partyEntries.map((e) => (
              <div key={e.id} className="flex justify-between py-0.5">
                <span className="text-gray-500">{e.date}</span>
                <span>{e.invoiceNumber}</span>
                <span>Due: {e.dueDate}</span>
                <span className={e.paymentStatus === "Paid" ? "text-green-600" : "text-orange-600"}>
                  {e.paymentStatus}
                </span>
                <span>₹{e.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-1 grid grid-cols-3 text-xs">
              <span>Total: ₹{partyTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span>Paid: ₹{partyPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-red-600">
                Pending: ₹{partyPending.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
