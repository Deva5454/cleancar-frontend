import { useState, useMemo } from "react";
import { FileBarChart, Download } from "lucide-react";
import { gstComplianceService } from "../../services/gstComplianceService";
import { showExportMenu } from "../../utils/gstExportUtils";
import { useCity } from "../../contexts/CityContext";

export function GSTReports() {
  const { city } = useCity();
  const [activeTab, setActiveTab] = useState<"register" | "output" | "itc" | "recon" | "risk" | "audit">("register");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRisk, setFilterRisk] = useState("");

  const transactions = gstComplianceService.getTransactions(city);
  const reconciliation = gstComplianceService.getReconciliation();

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchMonth = !filterMonth || t.month === filterMonth;
      const matchType = !filterType || t.transactionType === filterType;
      const matchStatus = !filterStatus || t.status === filterStatus;
      const matchRisk = !filterRisk || t.riskLevel === filterRisk;
      return matchMonth && matchType && matchStatus && matchRisk;
    });
  }, [transactions, filterMonth, filterType, filterStatus, filterRisk]);

  const outputTaxSummary = useMemo(() => {
    const sales = transactions.filter(t => t.transactionType === "Sale");
    const byType = {
      B2B: sales.filter(t => t.gstType === "B2B"),
      B2C: sales.filter(t => t.gstType === "B2C"),
      EXPORT: sales.filter(t => t.gstType === "EXPORT")
    };

    return {
      B2B: {
        count: byType.B2B.length,
        taxable: byType.B2B.reduce((s, t) => s + t.taxableValue, 0),
        cgst: byType.B2B.reduce((s, t) => s + t.cgst, 0),
        sgst: byType.B2B.reduce((s, t) => s + t.sgst, 0),
        igst: byType.B2B.reduce((s, t) => s + t.igst, 0),
        cess: byType.B2B.reduce((s, t) => s + t.cess, 0)
      },
      B2C: {
        count: byType.B2C.length,
        taxable: byType.B2C.reduce((s, t) => s + t.taxableValue, 0),
        cgst: byType.B2C.reduce((s, t) => s + t.cgst, 0),
        sgst: byType.B2C.reduce((s, t) => s + t.sgst, 0),
        igst: byType.B2C.reduce((s, t) => s + t.igst, 0),
        cess: byType.B2C.reduce((s, t) => s + t.cess, 0)
      },
      EXPORT: {
        count: byType.EXPORT.length,
        taxable: byType.EXPORT.reduce((s, t) => s + t.taxableValue, 0),
        cgst: byType.EXPORT.reduce((s, t) => s + t.cgst, 0),
        sgst: byType.EXPORT.reduce((s, t) => s + t.sgst, 0),
        igst: byType.EXPORT.reduce((s, t) => s + t.igst, 0),
        cess: byType.EXPORT.reduce((s, t) => s + t.cess, 0)
      }
    };
  }, [transactions]);

  const itcTransactions = useMemo(() =>
    transactions.filter(t => t.transactionType === "Purchase" && t.itcEligible),
    [transactions]
  );

  const riskSortedTransactions = useMemo(() =>
    [...transactions].sort((a, b) => b.riskScore - a.riskScore),
    [transactions]
  );

  const handleExport = (e: React.MouseEvent, tabName: string, data: any[]) => {
    showExportMenu(data, `gst-${tabName}-report`, e.currentTarget as HTMLElement);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FileBarChart className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">GST Reports</h1>
            <p className="text-sm text-gray-600">Comprehensive GST compliance reporting</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab("register")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "register" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600"
          }`}
        >
          Transaction Register
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "output" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600"
          }`}
        >
          Output Tax Summary
        </button>
        <button
          onClick={() => setActiveTab("itc")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "itc" ? "border-green-600 text-green-600" : "border-transparent text-gray-600"
          }`}
        >
          ITC Register
        </button>
        <button
          onClick={() => setActiveTab("recon")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "recon" ? "border-teal-600 text-teal-600" : "border-transparent text-gray-600"
          }`}
        >
          Reconciliation Report
        </button>
        <button
          onClick={() => setActiveTab("risk")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "risk" ? "border-orange-600 text-orange-600" : "border-transparent text-gray-600"
          }`}
        >
          Risk Report
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "audit" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-600"
          }`}
        >
          Audit Log
        </button>
      </div>

      {activeTab === "register" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Months</option>
                <option value="April">April</option>
                <option value="March">March</option>
                <option value="February">February</option>
              </select>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <option value="Sale">Sale</option>
                <option value="Purchase">Purchase</option>
                <option value="Credit Note">Credit Note</option>
                <option value="Debit Note">Debit Note</option>
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Validated">Validated</option>
                <option value="Approved">Approved</option>
                <option value="Filed">Filed</option>
              </select>
              <select
                value={filterRisk}
                onChange={e => setFilterRisk(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Risk Levels</option>
                <option value="Clean">Clean</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <button
              onClick={(e) => {
                const data = filteredTransactions.map(t => ({
                  "Invoice No": t.invoiceNumber,
                  Date: t.invoiceDate,
                  Type: t.transactionType,
                  Party: t.partyName,
                  GSTIN: t.partyGstin,
                  "Taxable Value": t.taxableValue,
                  "GST Rate": t.gstRate,
                  CGST: t.cgst,
                  SGST: t.sgst,
                  IGST: t.igst,
                  "Total Tax": t.totalTax,
                  Total: t.invoiceTotal,
                  Status: t.status,
                  "Risk Level": t.riskLevel
                }));
                handleExport(e, "transaction-register", data);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                  <th className="pb-3 font-medium">Invoice No</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Party</th>
                  <th className="pb-3 font-medium">Taxable</th>
                  <th className="pb-3 font-medium">CGST</th>
                  <th className="pb-3 font-medium">SGST</th>
                  <th className="pb-3 font-medium">IGST</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(txn => (
                  <tr key={txn.id} className="border-b border-gray-100 text-sm">
                    <td className="py-3 font-medium text-gray-900">{txn.invoiceNumber}</td>
                    <td className="py-3 text-gray-700">{txn.invoiceDate}</td>
                    <td className="py-3 text-gray-700">{txn.transactionType}</td>
                    <td className="py-3 text-gray-700">{txn.partyName}</td>
                    <td className="py-3 text-gray-900">₹{(txn?.taxableValue ?? 0).toLocaleString()}</td>
                    <td className="py-3 text-gray-700">₹{(txn?.cgst ?? 0).toLocaleString()}</td>
                    <td className="py-3 text-gray-700">₹{(txn?.sgst ?? 0).toLocaleString()}</td>
                    <td className="py-3 text-gray-700">₹{(txn?.igst ?? 0).toLocaleString()}</td>
                    <td className="py-3 font-medium text-gray-900">₹{(txn?.invoiceTotal ?? 0).toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        txn.status === "Filed" ? "bg-purple-100 text-purple-700" :
                        txn.status === "Approved" ? "bg-green-100 text-green-700" :
                        txn.status === "Validated" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "output" && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Output Tax Summary by Type</h3>
              <button
                onClick={(e) => {
                  const data = [
                    { Type: "B2B", Count: outputTaxSummary.B2B.count, Taxable: outputTaxSummary.B2B.taxable, CGST: outputTaxSummary.B2B.cgst, SGST: outputTaxSummary.B2B.sgst, IGST: outputTaxSummary.B2B.igst, Cess: outputTaxSummary.B2B.cess },
                    { Type: "B2C", Count: outputTaxSummary.B2C.count, Taxable: outputTaxSummary.B2C.taxable, CGST: outputTaxSummary.B2C.cgst, SGST: outputTaxSummary.B2C.sgst, IGST: outputTaxSummary.B2C.igst, Cess: outputTaxSummary.B2C.cess },
                    { Type: "Export", Count: outputTaxSummary.EXPORT.count, Taxable: outputTaxSummary.EXPORT.taxable, CGST: outputTaxSummary.EXPORT.cgst, SGST: outputTaxSummary.EXPORT.sgst, IGST: outputTaxSummary.EXPORT.igst, Cess: outputTaxSummary.EXPORT.cess }
                  ];
                  handleExport(e, "output-tax-summary", data);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Count</th>
                    <th className="pb-3 font-medium">Taxable Value</th>
                    <th className="pb-3 font-medium">CGST</th>
                    <th className="pb-3 font-medium">SGST</th>
                    <th className="pb-3 font-medium">IGST</th>
                    <th className="pb-3 font-medium">Cess</th>
                    <th className="pb-3 font-medium">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(outputTaxSummary).map(([type, data]) => (
                    <tr key={type} className="border-b border-gray-100 text-sm">
                      <td className="py-3 font-medium text-gray-900">{type}</td>
                      <td className="py-3 text-gray-700">{data.count}</td>
                      <td className="py-3 text-gray-900">₹{(data?.taxable ?? 0).toLocaleString()}</td>
                      <td className="py-3 text-gray-700">₹{(data?.cgst ?? 0).toLocaleString()}</td>
                      <td className="py-3 text-gray-700">₹{(data?.sgst ?? 0).toLocaleString()}</td>
                      <td className="py-3 text-gray-700">₹{(data?.igst ?? 0).toLocaleString()}</td>
                      <td className="py-3 text-gray-700">₹{(data?.cess ?? 0).toLocaleString()}</td>
                      <td className="py-3 font-medium text-gray-900">₹{(data.cgst + data.sgst + data.igst + data.cess).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "itc" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">ITC Register</h3>
            <button
              onClick={(e) => {
                const data = itcTransactions.map(t => ({
                  Vendor: t.partyName,
                  GSTIN: t.partyGstin,
                  Invoice: t.invoiceNumber,
                  Date: t.invoiceDate,
                  "Taxable Value": t.taxableValue,
                  "ITC Amount": t.itcAmount,
                  Status: t.status,
                  "2B Match": "Matched"
                }));
                handleExport(e, "itc-register", data);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                  <th className="pb-3 font-medium">Vendor</th>
                  <th className="pb-3 font-medium">GSTIN</th>
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Taxable Value</th>
                  <th className="pb-3 font-medium">ITC Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">2B Match</th>
                </tr>
              </thead>
              <tbody>
                {itcTransactions.map(txn => (
                  <tr key={txn.id} className="border-b border-gray-100 text-sm">
                    <td className="py-3 font-medium text-gray-900">{txn.partyName}</td>
                    <td className="py-3 text-gray-700 font-mono text-xs">{txn.partyGstin}</td>
                    <td className="py-3 text-gray-700">{txn.invoiceNumber}</td>
                    <td className="py-3 text-gray-900">₹{(txn?.taxableValue ?? 0).toLocaleString()}</td>
                    <td className="py-3 font-medium text-green-600">₹{(txn?.itcAmount ?? 0).toLocaleString()}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                        Matched
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "recon" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Reconciliation Summary</h3>
            <button
              onClick={(e) => {
                const data = reconciliation.map(r => ({
                  Vendor: r.vendorName,
                  GSTIN: r.vendorGstin,
                  Invoice: r.invoiceNumber,
                  "System Amount": r.inSystemBooks ? r.taxableValue : 0,
                  "2B Amount": r.inGSTR2B ? r.taxableValue : 0,
                  Difference: r.differenceAmount,
                  "Match Status": r.matchStatus
                }));
                handleExport(e, "reconciliation", data);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                  <th className="pb-3 font-medium">Vendor</th>
                  <th className="pb-3 font-medium">GSTIN</th>
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">System Amount</th>
                  <th className="pb-3 font-medium">2B Amount</th>
                  <th className="pb-3 font-medium">Difference</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {reconciliation.map(rec => (
                  <tr key={rec.id} className="border-b border-gray-100 text-sm">
                    <td className="py-3 font-medium text-gray-900">{rec.vendorName}</td>
                    <td className="py-3 text-gray-700 font-mono text-xs">{rec.vendorGstin}</td>
                    <td className="py-3 text-gray-700">{rec.invoiceNumber}</td>
                    <td className="py-3 text-gray-900">₹{rec.inSystemBooks ? (rec?.taxableValue ?? 0).toLocaleString() : 0}</td>
                    <td className="py-3 text-gray-900">₹{rec.inGSTR2B ? (rec?.taxableValue ?? 0).toLocaleString() : 0}</td>
                    <td className="py-3 text-gray-900">₹{(rec?.differenceAmount ?? 0).toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.matchStatus === "Matched" ? "bg-green-100 text-green-700" :
                        rec.matchStatus === "In Books Only" ? "bg-blue-100 text-blue-700" :
                        rec.matchStatus === "In 2B Only" ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {rec.matchStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "risk" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Risk Report (Sorted by Risk Score)</h3>
            <button
              onClick={(e) => {
                const data = riskSortedTransactions.map(t => ({
                  Invoice: t.invoiceNumber,
                  Party: t.partyName,
                  "Risk Score": t.riskScore,
                  "Risk Level": t.riskLevel,
                  "Issues Count": t.validationErrors.length,
                  Status: t.status,
                  Amount: t.invoiceTotal
                }));
                handleExport(e, "risk-report", data);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Party</th>
                  <th className="pb-3 font-medium">Risk Score</th>
                  <th className="pb-3 font-medium">Risk Level</th>
                  <th className="pb-3 font-medium">Issues Count</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {riskSortedTransactions.map(txn => (
                  <tr key={txn.id} className="border-b border-gray-100 text-sm">
                    <td className="py-3 font-medium text-gray-900">{txn.invoiceNumber}</td>
                    <td className="py-3 text-gray-700">{txn.partyName}</td>
                    <td className="py-3 font-semibold text-gray-900">{txn.riskScore}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        txn.riskLevel === "Clean" ? "bg-green-100 text-green-700" :
                        txn.riskLevel === "Medium" ? "bg-amber-100 text-amber-700" :
                        txn.riskLevel === "High" ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {txn.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 text-gray-700">{txn.validationErrors.length}</td>
                    <td className="py-3 text-gray-700">{txn.status}</td>
                    <td className="py-3 text-gray-900">₹{(txn?.invoiceTotal ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Audit Log</h3>
            <button
              onClick={(e) => {
                const data = transactions.flatMap(txn => [
                  { Timestamp: txn.createdAt, Action: "Transaction Created", User: txn.createdBy,
                    Invoice: txn.invoiceNumber, Details: `${txn.transactionType} for ${txn.partyName}` },
                  ...(txn.changeHistory || []).map(log => ({
                    Timestamp: log.timestamp, Action: log.action, User: log.changedBy,
                    Invoice: txn.invoiceNumber, Details: log.note || log.action,
                  })),
                ]).sort((a, b) => b.Timestamp.localeCompare(a.Timestamp));
                handleExport(e, "gst-audit-log", data);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                  <th className="pb-3 font-medium">Timestamp</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {transactions
                  .flatMap(txn =>
                    [
                      // Always include the creation event
                      { txnId: txn.id, invoice: txn.invoiceNumber, ts: txn.createdAt,
                        action: "Transaction Created", user: txn.createdBy,
                        detail: `${txn.transactionType} — ${txn.partyName} — ₹${txn.invoiceTotal?.toLocaleString()}` },
                      // Expand all changeHistory entries
                      ...(txn.changeHistory || []).map(log => ({
                        txnId: txn.id, invoice: txn.invoiceNumber, ts: log.timestamp,
                        action: log.action, user: log.changedBy,
                        detail: log.note || (log.newStatus ? `Status → ${log.newStatus}` : log.action),
                      })),
                    ]
                  )
                  .sort((a, b) => b.ts.localeCompare(a.ts))
                  .slice(0, 100)
                  .map((entry, i) => (
                    <tr key={i} className="border-b border-gray-100 text-sm">
                      <td className="py-3 text-gray-700">{new Date(entry.ts).toLocaleString("en-IN")}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          entry.action === "Filed" ? "bg-purple-100 text-purple-700"
                          : entry.action === "Approved" ? "bg-green-100 text-green-700"
                          : entry.action.includes("AI") ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                        }`}>{entry.action}</span>
                      </td>
                      <td className="py-3 text-gray-700">{entry.user}</td>
                      <td className="py-3 font-mono text-xs text-gray-600">{entry.invoice}</td>
                      <td className="py-3 text-gray-600">{entry.detail}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
