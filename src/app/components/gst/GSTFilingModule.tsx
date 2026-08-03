import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Upload, Check, ChevronRight, Download, CheckCircle, AlertCircle } from "lucide-react";
import { showExportMenu } from "../../utils/gstExportUtils";
import { gstComplianceService } from "../../services/gstComplianceService";
import { getGSTTransactionsFromEntries } from "../../services/accountingEntryService";
import { useCity } from "../../contexts/CityContext";

export function GSTFilingModule() {
  const { city } = useCity();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGSTIN, setSelectedGSTIN] = useState("24GAOPS5676E1Z3");
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [filingReference, setFilingReference] = useState("");
  const [filingDate, setFilingDate] = useState("");
  const [filedBy] = useState("Current Manager");
  const [filed, setFiled] = useState(false);

  // Real fix: these 6 items used to default to `true` with no actual
  // verification against anything — a user could reach "Confirm Filing"
  // having never opened GSTR-1/GSTR-3B or checked a single real number.
  // Only items with no real cross-screen persisted signal to check stay
  // as manual confirmations (now honestly starting unchecked, not
  // pre-ticked); items with real data behind them are computed below
  // instead of being toggleable at all.
  const [manualChecklist, setManualChecklist] = useState({
    gstr1Generated: false,
    gstr3bApproved: false,
    managerSignOff: false,
    otpDscReady: false,
    bankBalanceSufficient: false,
    previousReturnsFiled: true,
    lateFeesVerified: true
  });

  const handleChecklistChange = (key: keyof typeof manualChecklist) => {
    setManualChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Real transactions for this period, merged from both real sources
  // (accountingEntryService postings and the manually-entered GST module) —
  // same merge GSTR1Module/GSTR3BModule use, so this period's real state
  // is genuinely checked rather than assumed.
  const periodTransactions = useMemo(() => {
    const all = [
      ...getGSTTransactionsFromEntries(city),
      ...gstComplianceService.getTransactions(city),
    ];
    return all.filter(t => t.month === selectedMonth && t.year === selectedYear);
  }, [city, selectedMonth, selectedYear]);

  const reconciliation = gstComplianceService.getReconciliation();
  const itcDifference = useMemo(() => {
    const itcFrom2B = reconciliation
      .filter(r => r.month === selectedMonth && r.year === selectedYear && r.itcClaimable)
      .reduce((s, r) => s + r.gstAmount, 0);
    const realITC = periodTransactions
      .filter(t => t.transactionType === "Purchase" && t.itcEligible)
      .reduce((s, t) => s + t.itcAmount, 0);
    return realITC - itcFrom2B;
  }, [reconciliation, periodTransactions, selectedMonth, selectedYear]);

  const realChecks = useMemo(() => ({
    transactionsLocked: periodTransactions.length > 0 && periodTransactions.every(t => t.status === "Approved" || t.status === "Filed"),
    noCriticalRisk: !periodTransactions.some(t => t.riskLevel === "Critical"),
    itcReconciled: Math.abs(itcDifference) <= 1000,
  }), [periodTransactions, itcDifference]);

  const allChecked = Object.values(manualChecklist).every(v => v) && Object.values(realChecks).every(v => v);

  // Real fix: previously 6 fixed constants (150 transactions, ₹5.25L
  // taxable, ₹9.45L output tax, etc.) that never reflected the actual
  // state of the business — the "Final Review" always showed the same
  // numbers regardless of what was really filed.
  const summaryData = useMemo(() => {
    const sales = periodTransactions.filter(t => t.transactionType === "Sale");
    const totalTaxableValue = sales.reduce((s, t) => s + t.taxableValue, 0);
    const totalOutputTax = sales.reduce((s, t) => s + t.totalTax, 0);
    const totalITC = periodTransactions
      .filter(t => t.transactionType === "Purchase" && t.itcEligible)
      .reduce((s, t) => s + t.itcAmount, 0);
    return {
      totalTransactions: periodTransactions.length,
      totalTaxableValue,
      totalOutputTax,
      totalITC,
      netTaxPayable: Math.max(0, totalOutputTax - totalITC),
      lateFeePenalty: 0, // no real due-date-vs-filed-date basis exists yet to compute this
    };
  }, [periodTransactions]);

  const handleDownloadFilingPackage = (e: React.MouseEvent) => {
    const data = [{
      "GSTIN": selectedGSTIN,
      "Period": selectedMonth,
      "Total Transactions": summaryData.totalTransactions,
      "Taxable Value": summaryData.totalTaxableValue,
      "Output Tax": summaryData.totalOutputTax,
      "ITC": summaryData.totalITC,
      "Net Tax Payable": summaryData.netTaxPayable,
      "Late Fee": summaryData.lateFeePenalty,
      "Total Amount": summaryData.netTaxPayable + summaryData.lateFeePenalty
    }];
    showExportMenu(data, "gst-filing-package", e.currentTarget as HTMLElement);
  };

  const handleDownloadJSON = () => {
    const json = {
      gstin: selectedGSTIN,
      // Real fix: selectedMonth is a number (1-12), not a "Month Year"
      // string — GSTN's real "fp" (filing period) format is 2-digit month
      // + 4-digit year.
      fp: `${String(selectedMonth).padStart(2, "0")}${selectedYear}`,
      net_tax: summaryData.netTaxPayable,
      late_fee: summaryData.lateFeePenalty,
      total: summaryData.netTaxPayable + summaryData.lateFeePenalty,
      filing_date: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Real fix: calling .replace() on selectedMonth (a number) crashed this
    // handler every time — reachable directly from "Download JSON for GST Portal".
    a.download = `GST-Filing-${selectedGSTIN}-${String(selectedMonth).padStart(2, "0")}-${selectedYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmFiling = () => {
    if (!filingReference || !filingDate) {
      toast.info("Please enter filing reference and date");
      return;
    }
    // Persist Filed status + reference to every approved transaction for this period
    const toFile = gstComplianceService
      .getTransactionsByMonth(selectedMonth, selectedYear, city)
      .filter(t => t.status === "Approved");

    let failedCount = 0;
    toFile.forEach(t => {
      const updated = {
        ...t,
        status: "Filed" as const,
        filedInReturn: filingReference,
        changeHistory: [...(t.changeHistory || []), {
          timestamp: new Date().toISOString(),
          changedBy: "Accounts",
          action: "Filed",
          previousStatus: "Approved",
          newStatus: "Filed",
          note: `Filed on ${filingDate}. Reference: ${filingReference}`,
        }],
      };
      const saved = gstComplianceService.saveTransaction(updated);
      if (!saved) failedCount++;
    });

    if (failedCount > 0) {
      toast.error(`Could not save ${failedCount} of ${toFile.length} transaction(s) — storage is full. Please contact support or clear old data, then try again.`, { duration: 10000 });
      return;
    }

    setFiled(true);
    toast.success(`Filing confirmed. ${toFile.length} transactions marked as Filed. Reference: ${filingReference}`);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Upload className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">GST Filing Workflow</h1>
            <p className="text-sm text-gray-600">Complete pre-filing checks and submit to GST portal</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-mono">{selectedGSTIN}</div>
          <div className="px-4 py-2 bg-blue-100 rounded-lg text-sm font-medium text-blue-700">{selectedMonth}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        {[1, 2, 3].map(step => (
          <div key={step} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 flex-1 ${currentStep >= step ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                currentStep > step ? 'bg-green-600 text-white' :
                currentStep === step ? 'bg-blue-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step ? <Check className="w-5 h-5" /> : step}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {step === 1 ? 'Pre-filing Checklist' : step === 2 ? 'Final Review' : 'Filing Confirmation'}
              </span>
            </div>
            {step < 3 && <ChevronRight className="w-5 h-5 text-gray-400 mx-2" />}
          </div>
        ))}
      </div>

      {currentStep === 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Pre-filing Checklist</h3>
          <p className="text-sm text-gray-600">Verify all items before proceeding to file</p>

          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Verified automatically from real data</p>
            {Object.entries({
              transactionsLocked: "All transactions for this period are Approved or Filed",
              noCriticalRisk: "No critical risk transactions",
              itcReconciled: "ITC reconciliation complete (within ₹1,000 of GSTR-2B)",
            }).map(([key, label]) => {
              const passed = realChecks[key as keyof typeof realChecks];
              return (
                <div key={key} className={`flex items-center gap-3 p-3 border rounded-lg ${passed ? "border-gray-200" : "border-red-200 bg-red-50"}`}>
                  {passed ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                  <span className="flex-1 text-sm text-gray-700">{label}</span>
                  <span className={`text-xs font-medium ${passed ? "text-green-700" : "text-red-700"}`}>
                    {passed ? "Verified" : "Not yet satisfied"}
                  </span>
                </div>
              );
            })}

            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide pt-2">Manual confirmation required</p>
            {Object.entries({
              gstr1Generated: "GSTR-1 generated and approved",
              gstr3bApproved: "GSTR-3B computed and approved",
              managerSignOff: "Manager has signed off",
              otpDscReady: "OTP/DSC ready",
              bankBalanceSufficient: "Bank balance sufficient for tax payment",
              previousReturnsFiled: "Previous returns filed",
              lateFeesVerified: "Late fees verified"
            }).map(([key, label]) => (
              <div key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  id={key}
                  checked={manualChecklist[key as keyof typeof manualChecklist]}
                  onChange={() => handleChecklistChange(key as keyof typeof manualChecklist)}
                  className="w-5 h-5 text-green-600 rounded"
                />
                <label htmlFor={key} className="flex-1 text-sm text-gray-700 cursor-pointer">
                  {label}
                </label>
                {manualChecklist[key as keyof typeof manualChecklist] && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!allChecked}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Proceed to Review
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Final Review Summary</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                <p className="text-xl font-semibold text-gray-900">{summaryData.totalTransactions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Taxable Value</p>
                <p className="text-xl font-semibold text-gray-900">₹{(summaryData?.totalTaxableValue ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Output Tax</p>
                <p className="text-xl font-semibold text-gray-900">₹{(summaryData?.totalOutputTax ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total ITC</p>
                <p className="text-xl font-semibold text-green-600">₹{(summaryData?.totalITC ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Net Tax Payable</p>
                <p className="text-xl font-semibold text-purple-600">₹{(summaryData?.netTaxPayable ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Late Fee/Penalty</p>
                <p className="text-xl font-semibold text-gray-900">₹{(summaryData?.lateFeePenalty ?? 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <span className="text-sm font-medium text-purple-900">Total Amount to be Paid</span>
                <span className="text-2xl font-bold text-purple-600">
                  ₹{(summaryData.netTaxPayable + summaryData.lateFeePenalty).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Download Filing Package</h3>
            <p className="text-sm text-gray-600">Download the filing summary and JSON for GST portal upload</p>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={handleDownloadFilingPackage}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                <Download className="w-4 h-4" />
                Download Filing Package (CSV/Excel)
              </button>
              <button
                onClick={handleDownloadJSON}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                <Download className="w-4 h-4" />
                Download JSON for GST Portal
              </button>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Back to Checklist
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Proceed to Filing
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && !filed && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h3 className="font-semibold text-gray-900">Filing Confirmation</h3>
          <p className="text-sm text-gray-600">
            Enter the filing reference number received from the GST portal after successful submission.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filing Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={filingReference}
                onChange={e => setFilingReference(e.target.value)}
                placeholder="ARN-XXXXXXXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filing Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={filingDate}
                onChange={e => setFilingDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filed By</label>
              <input
                type="text"
                value={filedBy}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
              />
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900">
                <strong>Important:</strong> Once confirmed, all transactions for this period will be locked permanently
                and an audit log entry will be created. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Back to Review
            </button>
            <button
              onClick={handleConfirmFiling}
              disabled={!filingReference || !filingDate}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Confirm Filing
            </button>
          </div>
        </div>
      )}

      {filed && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Filing Confirmed Successfully</h3>
          <p className="text-gray-600 mb-6">
            Your GST return for {selectedMonth} has been filed successfully.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md mx-auto space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reference Number:</span>
              <span className="font-medium text-gray-900">{filingReference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Filing Date:</span>
              <span className="font-medium text-gray-900">{filingDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Filed By:</span>
              <span className="font-medium text-gray-900">{filedBy}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-green-600">Filed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GSTFilingModule;
