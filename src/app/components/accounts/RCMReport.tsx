import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService, settleRCMLiability } from "../../services/accountingEntryService";
import { showExportMenu } from "../../utils/gstExportUtils";
import { Download, AlertCircle, Banknote } from "lucide-react";
import { toast } from "sonner";

export function RCMReport() {
  const { city, cityInfo } = useCity();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showSettleDialog, setShowSettleDialog] = useState(false);
  const [settleAmount, setSettleAmount] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ FIX: `e.date` doesn't exist on a real AccountingEntry — the real
  // field is `entryDate`. This silently made the filter (and therefore
  // this entire report) return nothing, ever, regardless of what RCM
  // activity actually happened.
  const rcmEntries = useMemo(() => {
    const from = dateFrom || "1900-01-01";
    const to = dateTo || "2099-12-31";
    const allEntries = accountingEntryService.getAllEntries(city);
    return allEntries.filter((e) => e.isRCM && e.entryDate >= from && e.entryDate <= to);
  }, [city, dateFrom, dateTo, refreshKey]);

  const thisMonthRCM = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    return rcmEntries.filter((e) => e.entryDate >= monthStart && e.entryDate <= monthEnd);
  }, [rcmEntries]);

  // ✅ FIX: rcmCgst/rcmSgst/rcmIgst are declared on the type but never
  // actually assigned anywhere in the real codebase — always undefined.
  // The real amounts live on the same cgst/sgst/igst fields every other
  // entry uses; RCM entries are no different.
  const totalRCMLiabilityThisMonth = thisMonthRCM.reduce(
    (sum, e) => sum + (e.cgst || 0) + (e.sgst || 0) + (e.igst || 0),
    0
  );

  // ✅ FIX: previously hardcoded to assume every posted RCM entry was
  // already paid, and pending was always exactly 0 — regardless of
  // reality. Now reads the real outstanding balance from the real RCM
  // Output ledgers (the same ones settleRCMLiability() clears).
  const rcmLedgerStatus = useMemo(() => {
    const cgstBal = accountingEntryService.getLedgerBalance("gst_rcm_cgst_output", city);
    const sgstBal = accountingEntryService.getLedgerBalance("gst_rcm_sgst_output", city);
    const igstBal = accountingEntryService.getLedgerBalance("gst_rcm_igst_output", city);
    const outstanding = Math.round((
      (cgstBal.balanceType === "Cr" ? cgstBal.balance : 0) +
      (sgstBal.balanceType === "Cr" ? sgstBal.balance : 0) +
      (igstBal.balanceType === "Cr" ? igstBal.balance : 0)
    ) * 100) / 100;
    return { outstanding };
  }, [city, refreshKey]);

  const totalRCMLiability = rcmEntries.reduce(
    (sum, e) => sum + (e.cgst || 0) + (e.sgst || 0) + (e.igst || 0),
    0
  );
  const pendingRCM = rcmLedgerStatus.outstanding;
  const totalRCMPaid = Math.max(0, Math.round((totalRCMLiability - pendingRCM) * 100) / 100);

  const handleSettle = () => {
    const amount = parseFloat(settleAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount."); return; }
    try {
      settleRCMLiability(city, cityInfo?.name || city, amount, new Date().toISOString().split("T")[0], "Admin");
      toast.success(`₹${amount.toLocaleString("en-IN")} settled and claimed as real Input Tax Credit.`);
      setShowSettleDialog(false);
      setSettleAmount("");
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e.message || "Could not settle — please check the amount.");
    }
  };

  const handleExport = (e: React.MouseEvent) => {
    const data = rcmEntries.map((entry) => ({
      Date: entry.entryDate,
      "Voucher No": entry.voucherNumber,
      Vendor: entry.vendorName || "-",
      GSTIN: entry.vendorGstin || "-",
      "Invoice No": entry.invoiceNumber,
      "Taxable Value": entry.taxableValue,
      "RCM CGST": entry.cgst || 0,
      "RCM SGST": entry.sgst || 0,
      "RCM IGST": entry.igst || 0,
      "Total RCM Liability": (entry.cgst || 0) + (entry.sgst || 0) + (entry.igst || 0),
      Status: entry.status,
    }));
    showExportMenu(data, "rcm-report", e.currentTarget as HTMLElement);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">RCM Report</h1>
          <p className="text-sm text-gray-600">Reverse Charge Mechanism report</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettleDialog(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded text-green-700 hover:bg-green-50 border-green-400"
          >
            <Banknote className="w-4 h-4" />
            Settle Liability
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border rounded text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* ✅ FIX: the previous banner claimed RCM is "automatically added to
          output tax liability" — this is real and materially wrong. RCM is
          a self-assessed liability the business owes DIRECTLY to the
          government; it is only claimable as real Input Tax Credit once
          it is actually paid (the "Settle Liability" action above). */}
      <div className="p-4 bg-blue-50 border border-blue-400 rounded flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-900 font-medium">
            RCM is a self-assessed liability you owe directly to the government — it is not
            automatically part of your output tax, and cannot be claimed as Input Tax Credit
            until it's actually paid.
          </p>
          <p className="text-sm text-blue-800">
            Use "Settle Liability" once you've paid this to the government — this both clears
            the liability and claims the real Input Tax Credit in one step. Verify in GSTR-3B
            Table 3.1(d).
          </p>
        </div>
      </div>

      {showSettleDialog && (
        <div className="p-4 bg-green-50 border border-green-400 rounded space-y-3">
          <p className="text-sm font-medium text-green-900">
            Real outstanding RCM liability for {cityInfo?.name || city}: ₹{pendingRCM.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              placeholder="Amount actually paid to the government"
              className="border rounded px-3 py-2 flex-1"
            />
            <button onClick={handleSettle} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Confirm Payment
            </button>
            <button onClick={() => setShowSettleDialog(false)} className="px-4 py-2 border rounded">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Date Filters */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border-l-4 border-amber-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total RCM Liability This Month</p>
          <p className="text-2xl font-bold text-amber-600">₹{totalRCMLiabilityThisMonth.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Current month</p>
        </div>
        <div className="bg-white border-l-4 border-green-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total RCM Paid</p>
          <p className="text-2xl font-bold text-green-600">₹{totalRCMPaid.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Posted entries</p>
        </div>
        <div className="bg-white border-l-4 border-red-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Pending RCM</p>
          <p className="text-2xl font-bold text-red-600">₹{pendingRCM.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Voucher No</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vendor</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">GSTIN</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Invoice No</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Taxable Value</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">RCM CGST</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">RCM SGST</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">RCM IGST</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total RCM Liability</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rcmEntries.map((entry) => {
              const totalRCM = (entry.cgst || 0) + (entry.sgst || 0) + (entry.igst || 0);
              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{entry.entryDate}</td>
                  <td className="px-4 py-3 text-sm font-mono">{entry.voucherNumber}</td>
                  <td className="px-4 py-3 text-sm">{entry.vendorName || "-"}</td>
                  <td className="px-4 py-3 text-sm font-mono">{entry.vendorGstin || "-"}</td>
                  <td className="px-4 py-3 text-sm">{entry.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{(entry?.taxableValue ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right text-amber-600">₹{(entry.cgst || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right text-amber-600">₹{(entry.sgst || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right text-amber-600">₹{(entry.igst || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-red-600">₹{totalRCM.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.status === "Posted"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {entry.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rcmEntries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No RCM entries found for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RCMReport;
