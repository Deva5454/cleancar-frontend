import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService, type LedgerMaster } from "../../services/accountingEntryService";
import { showExportMenu } from "../../utils/gstExportUtils";
import { Download } from "lucide-react";

type TabType = "Sales" | "Sales Returns / Credit Notes";

export function SalesSummaryReport() {
  const { city } = useCity();
  const [activeTab, setActiveTab] = useState<TabType>("Sales");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [partySearch, setPartySearch] = useState("");
  const [selectedParty, setSelectedParty] = useState<LedgerMaster | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  // Get customer ledgers for search
  const partyResults = useMemo(() => {
    if (!partySearch || partySearch.length < 2) return [];
    const customers = accountingEntryService.getLedgers(city).filter(l =>
      l.type === "customer" && l.name.toLowerCase().includes(partySearch.toLowerCase())
    );
    return customers.slice(0, 10); // Limit to 10 results
  }, [partySearch, city]);

  const togglePackage = (pkg: string) => {
    setSelectedPackages(prev =>
      prev.includes(pkg) ? prev.filter(p => p !== pkg) : [...prev, pkg]
    );
  };

  // Get sales entries
  const sales = useMemo(() => {
    const from = dateFrom || "1900-01-01";
    const to = dateTo || "2099-12-31";
    let salesEntries = accountingEntryService.getByType("Sales", city);
    salesEntries = salesEntries.filter((e) => e.date >= from && e.date <= to);

    // Filter by selected party
    if (selectedParty) {
      salesEntries = salesEntries.filter(e => e.vendorId === selectedParty.id || e.vendorName === selectedParty.name);
    }

    // Filter by selected packages
    if (selectedPackages.length > 0) {
      salesEntries = salesEntries.filter(e => {
        const pkgCode = e.expenseAccount || "";
        return selectedPackages.some(p => pkgCode.includes(p));
      });
    }

    return salesEntries;
  }, [city, dateFrom, dateTo, selectedParty, selectedPackages]);

  // Get sales returns
  const salesReturns = useMemo(() => {
    const from = dateFrom || "1900-01-01";
    const to = dateTo || "2099-12-31";
    const returnEntries = accountingEntryService.getByType("SalesReturn", city);
    return returnEntries.filter((e) => e.date >= from && e.date <= to);
  }, [city, dateFrom, dateTo]);

  // Filter by tab
  const filteredEntries = useMemo(() => {
    return activeTab === "Sales" ? sales : salesReturns;
  }, [activeTab, sales, salesReturns]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredEntries.reduce(
      (acc, e) => ({
        taxable: acc.taxable + e.taxableValue,
        cgst: acc.cgst + e.cgst,
        sgst: acc.sgst + e.sgst,
        igst: acc.igst + e.igst,
        total: acc.total + e.totalBillValue,
      }),
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );
  }, [filteredEntries]);

  // KPI calculations
  const totalSales = sales.reduce((sum, s) => sum + s.totalBillValue, 0);
  const totalReturns = salesReturns.reduce((sum, s) => sum + s.totalBillValue, 0);
  const netSales = totalSales - totalReturns;
  const totalOutputTax = sales.reduce((sum, s) => sum + s.cgst + s.sgst + s.igst, 0);

  // Party-wise summary
  const partyEntries = useMemo(() => {
    if (!selectedParty) return [];
    return filteredEntries.map(e => ({
      id: e.id,
      date: e.date,
      invoiceNumber: e.invoiceNumber,
      packageName: e.expenseAccountLabel || "-",
      amount: e.totalBillValue,
    }));
  }, [selectedParty, filteredEntries]);

  const partyTotal = partyEntries.reduce((sum, e) => sum + e.amount, 0);
  const partyReceived = partyTotal; // Simplified - in production, check payment records
  const partyOutstanding = partyTotal - partyReceived;

  const handleExport = (e: React.MouseEvent) => {
    const data = filteredEntries.map((entry) => ({
      Date: entry.date,
      "Voucher No": entry.voucherNumber,
      "Customer": entry.vendorName || "-",
      "Invoice No": entry.invoiceNumber,
      "Taxable Value": entry.taxableValue,
      CGST: entry.cgst,
      SGST: entry.sgst,
      IGST: entry.igst,
      Total: entry.totalBillValue,
      "Entry Type": entry.entryType,
      "Payment Mode": entry.paymentMode,
    }));
    showExportMenu(data, `sales-summary-${activeTab.toLowerCase()}`, e.currentTarget as HTMLElement);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Summary Report</h1>
          <p className="text-sm text-gray-600">Consolidated sales report</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
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
          <label className="block text-xs font-medium mb-1">Party Name</label>
          <input
            type="text"
            placeholder="Search customer..."
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
        <div>
          <label className="block text-xs font-medium mb-1">Package Type</label>
          <div className="flex flex-wrap gap-1">
            {["2W", "4W", "2W+W+S", "2W+W+W+S", "Renewal"].map((pkg) => (
              <button
                key={pkg}
                onClick={() => togglePackage(pkg)}
                className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  selectedPackages.includes(pkg)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {pkg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border-l-4 border-green-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Sales</p>
          <p className="text-2xl font-bold text-green-600">₹{totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-red-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Returns</p>
          <p className="text-2xl font-bold text-red-600">₹{totalReturns.toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-blue-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Net Sales</p>
          <p className="text-2xl font-bold text-blue-600">₹{netSales.toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-purple-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Output Tax</p>
          <p className="text-2xl font-bold text-purple-600">₹{totalOutputTax.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["Sales", "Sales Returns / Credit Notes"] as TabType[]).map((tab) => (
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer</th>
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
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{entry.date}</td>
                <td className="px-4 py-3 text-sm font-mono">{entry.voucherNumber}</td>
                <td className="px-4 py-3 text-sm">{entry.vendorName || "-"}</td>
                <td className="px-4 py-3 text-sm">{entry.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-right">₹{(entry?.taxableValue ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{(entry?.cgst ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{(entry?.sgst ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{(entry?.igst ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">₹{(entry?.totalBillValue ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{entry.entryType}</td>
                <td className="px-4 py-3 text-sm">{entry.paymentMode}</td>
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
          <div className="font-semibold mb-2">Party: {selectedParty.name}</div>
          <div className="font-mono text-sm space-y-1">
            {partyEntries.map((e) => (
              <div key={e.id} className="flex justify-between py-0.5">
                <span className="text-gray-500">{e.date}</span>
                <span>{e.invoiceNumber}</span>
                <span>{e.packageName}</span>
                <span>₹{e.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-1 grid grid-cols-3 text-xs">
              <span>Total: ₹{partyTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span>Received: ₹{partyReceived.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-red-600">
                Outstanding: ₹{partyOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
