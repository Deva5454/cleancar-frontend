import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService } from "../../services/accountingEntryService";
import { showExportMenu } from "../../utils/gstExportUtils";
import { Download } from "lucide-react";

type TabType = "B2B" | "B2B Amendment" | "B2C Small" | "Credit Notes" | "HSN Summary" | "Document Summary";

export function GSTR2AReport() {
  const { city } = useCity();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<TabType>("B2B");

  // Get purchase entries for selected period
  const purchaseEntries = useMemo(() => {
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0];
    const purchases = accountingEntryService.getByType("Purchase", city);
    const expenses = accountingEntryService.getByType("Expense", city);
    return [...purchases, ...expenses].filter((e) => e.date >= startDate && e.date <= endDate);
  }, [selectedMonth, selectedYear, city]);

  // B2B data
  const b2bData = useMemo(() => {
    return purchaseEntries
      .filter((e) => e.gstEntryType === "B2B")
      .map((e) => ({
        vendorGstin: e.vendorGstin || "",
        vendorName: e.vendorName || "",
        invoiceNumber: e.invoiceNumber,
        invoiceDate: e.date,
        invoiceValue: e.totalBillValue,
        placeOfSupply: e.vendorStateCode || "",
        reverseCharge: e.isRCM ? "Y" : "N",
        invoiceType: "Regular",
        rate: e.gstRate,
        taxableValue: e.taxableValue,
        igst: e.igst,
        cgst: e.cgst,
        sgst: e.sgst,
        cess: 0,
      }));
  }, [purchaseEntries]);

  // HSN Summary
  const hsnSummary = useMemo(() => {
    const hsnMap: Record<
      string,
      { hsn: string; qty: number; taxableValue: number; igst: number; cgst: number; sgst: number }
    > = {};
    purchaseEntries.forEach((e) => {
      const hsn = e.hsnSacCode || "N/A";
      if (!hsnMap[hsn]) {
        hsnMap[hsn] = { hsn, qty: 0, taxableValue: 0, igst: 0, cgst: 0, sgst: 0 };
      }
      hsnMap[hsn].qty += 1;
      hsnMap[hsn].taxableValue += e.taxableValue;
      hsnMap[hsn].igst += e.igst;
      hsnMap[hsn].cgst += e.cgst;
      hsnMap[hsn].sgst += e.sgst;
    });
    return Object.values(hsnMap);
  }, [purchaseEntries]);

  // Document Summary
  const documentSummary = useMemo(() => {
    return [
      {
        nature: "Invoices",
        srNoFrom: purchaseEntries[0]?.voucherNumber || "-",
        srNoTo: purchaseEntries[purchaseEntries.length - 1]?.voucherNumber || "-",
        total: purchaseEntries.length,
        cancelled: 0,
      },
    ];
  }, [purchaseEntries]);

  const handleExport = (e: React.MouseEvent) => {
    let data: any[] = [];
    if (activeTab === "B2B") {
      data = b2bData;
    } else if (activeTab === "HSN Summary") {
      data = hsnSummary;
    } else if (activeTab === "Document Summary") {
      data = documentSummary;
    }
    showExportMenu(data, `gstr2a-${activeTab.toLowerCase()}`, e.currentTarget as HTMLElement);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">GSTR-2A Report</h1>
          <p className="text-sm text-gray-600">GST Purchase Report in GSTR-2A format</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border rounded text-blue-600 hover:bg-blue-50"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border rounded px-3 py-2"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded px-3 py-2"
          >
            {[2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["B2B", "B2B Amendment", "B2C Small", "Credit Notes", "HSN Summary", "Document Summary"] as TabType[]).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* B2B Tab */}
      {activeTab === "B2B" && (
        <div className="border rounded overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vendor GSTIN</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trade Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Invoice Number</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Invoice Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Invoice Value</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Place of Supply</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reverse Charge</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Invoice Type</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Rate</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Taxable Value</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">IGST</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">CGST</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">SGST</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Cess</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {b2bData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{row.vendorGstin}</td>
                  <td className="px-4 py-3 text-sm">{row.vendorName}</td>
                  <td className="px-4 py-3 text-sm">{row.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm">{row.invoiceDate}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{(row?.invoiceValue ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">{row.placeOfSupply}</td>
                  <td className="px-4 py-3 text-sm">{row.reverseCharge}</td>
                  <td className="px-4 py-3 text-sm">{row.invoiceType}</td>
                  <td className="px-4 py-3 text-sm text-right">{row.rate}%</td>
                  <td className="px-4 py-3 text-sm text-right">₹{(row?.taxableValue ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{(row?.igst ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{(row?.cgst ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{(row?.sgst ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{(row?.cess ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* HSN Summary Tab */}
      {activeTab === "HSN Summary" && (
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">HSN Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">UOM</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total Quantity</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total Taxable Value</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">IGST</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">CGST</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">SGST</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Cess</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hsnSummary.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{row.hsn}</td>
                  <td className="px-4 py-3 text-sm">-</td>
                  <td className="px-4 py-3 text-sm">OTH</td>
                  <td className="px-4 py-3 text-sm text-right">{row.qty}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{(row?.taxableValue ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{(row?.igst ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{(row?.cgst ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{(row?.sgst ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">₹0.00</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Summary Tab */}
      {activeTab === "Document Summary" && (
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nature of Document</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sr. No. From</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sr. No. To</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total No.</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Cancelled</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documentSummary.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{row.nature}</td>
                  <td className="px-4 py-3 text-sm font-mono">{row.srNoFrom}</td>
                  <td className="px-4 py-3 text-sm font-mono">{row.srNoTo}</td>
                  <td className="px-4 py-3 text-sm text-right">{row.total}</td>
                  <td className="px-4 py-3 text-sm text-right">{row.cancelled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Placeholder for other tabs */}
      {(activeTab === "B2B Amendment" || activeTab === "B2C Small" || activeTab === "Credit Notes") && (
        <div className="text-center py-12 text-gray-500">
          <p>No {activeTab} data available for this period</p>
        </div>
      )}
    </div>
  );
}
