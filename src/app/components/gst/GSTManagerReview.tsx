import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ClipboardCheck, Check, AlertTriangle, X, Brain } from "lucide-react";
import { gstComplianceService, type GSTTransaction } from "../../services/gstComplianceService";
import { analyzeTransaction, scoreAfterCorrection, type AICorrection } from "../../services/gstAIScoringService";
import { useCity } from "../../contexts/CityContext";

export function GSTManagerReview() {
  const { city } = useCity();
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "overridden" | "ai-history">("pending");
  const [transactions, setTransactions] = useState<GSTTransaction[]>(gstComplianceService.getTransactions(city));
  const [selectedTxn, setSelectedTxn] = useState<GSTTransaction | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [selectedCorrection, setSelectedCorrection] = useState<{ txn: GSTTransaction; correction: AICorrection; index: number } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const pendingApproval = useMemo(() =>
    transactions.filter(t => t.status === "Validated"),
    [transactions]
  );

  const approved = useMemo(() =>
    transactions.filter(t => t.status === "Approved"),
    [transactions]
  );

  const overridden = useMemo(() =>
    transactions.filter(t => t.approvedBy && t.status === "Approved"),
    [transactions]
  );

  const aiCorrectionHistory = useMemo(() => {
    const history: { txn: GSTTransaction; corrections: AICorrection[] }[] = [];
    transactions.forEach(txn => {
      const scoringResult = analyzeTransaction({ ...txn, companyState: "Gujarat" });
      const lowConfOrHighValue = scoringResult.corrections.filter(
        c => c.confidence < 70 || !c.autoApplicable
      );
      if (lowConfOrHighValue.length > 0) {
        history.push({ txn, corrections: lowConfOrHighValue });
      }
    });
    return history;
  }, [transactions]);

  const displayTransactions = activeTab === "pending" ? pendingApproval : activeTab === "approved" ? approved : overridden;

  const handleApprove = (txn: GSTTransaction) => {
    const updated: GSTTransaction = {
      ...txn,
      status: "Approved",
      approvedBy: "Manager",
      approvedAt: new Date().toISOString()
    };
    gstComplianceService.saveTransaction(updated);
    gstComplianceService.appendChangeLog(txn.id, {
      timestamp: new Date().toISOString(),
      changedBy: "Manager",
      action: "Approved",
      previousStatus: txn.status,
      newStatus: "Approved",
    });
    setTransactions(gstComplianceService.getTransactions(city));
    setSelectedTxn(null);
  };

  const handleOverride = () => {
    if (!selectedTxn || overrideReason.length < 20) {
      toast.error("Override reason must be at least 20 characters");
      return;
    }
    const updated: GSTTransaction = {
      ...selectedTxn,
      status: "Approved",
      approvedBy: "Manager (Override)",
      approvedAt: new Date().toISOString(),
      validationErrors: [...selectedTxn.validationErrors, `Override: ${overrideReason}`]
    };
    gstComplianceService.saveTransaction(updated);
    gstComplianceService.appendChangeLog(selectedTxn.id, {
      timestamp: new Date().toISOString(),
      changedBy: "Manager",
      action: "Override",
      previousStatus: selectedTxn.status,
      newStatus: "Approved",
      note: overrideReason,
    });
    setTransactions(gstComplianceService.getTransactions(city));
    setSelectedTxn(null);
    setOverrideReason("");
  };

  const handleReject = (txn: GSTTransaction) => {
    const updated: GSTTransaction = {
      ...txn,
      status: "Draft"
    };
    gstComplianceService.saveTransaction(updated);
    setTransactions(gstComplianceService.getTransactions(city));
  };

  const handleApproveCorrection = () => {
    if (!selectedCorrection) return;

    let updatedTxn = { ...selectedCorrection.txn };
    const correction = selectedCorrection.correction;

    if (correction.issueType === "Wrong GST rate") {
      const newRate = parseInt(correction.suggestedValue.replace('%', ''));
      updatedTxn.gstRate = newRate;
      const gst = gstComplianceService.calculateGST(
        updatedTxn.taxableValue,
        newRate,
        updatedTxn.placeOfSupply,
        "Gujarat"
      );
      updatedTxn = {
        ...updatedTxn,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        totalTax: gst.totalTax,
        invoiceTotal: updatedTxn.taxableValue + gst.totalTax
      };
    } else if (correction.issueType === "Wrong tax type — should be CGST/SGST") {
      const halfIgst = updatedTxn.igst / 2;
      updatedTxn = {
        ...updatedTxn,
        cgst: halfIgst,
        sgst: halfIgst,
        igst: 0
      };
    } else if (correction.issueType === "Tax calculation mismatch") {
      const correctTax = parseFloat(correction.suggestedValue.replace('₹', '').replace(',', ''));
      updatedTxn.totalTax = correctTax;
      updatedTxn.invoiceTotal = updatedTxn.taxableValue + correctTax;
    }

    const newScore = scoreAfterCorrection(updatedTxn.riskScore, correction);
    updatedTxn.riskScore = newScore;
    updatedTxn.riskLevel = newScore < 30 ? "Clean" : newScore < 60 ? "Medium" : newScore < 80 ? "High" : "Critical";
    updatedTxn.approvedBy = "Manager";
    updatedTxn.approvedAt = new Date().toISOString();

    gstComplianceService.saveTransaction(updatedTxn);
    setTransactions(gstComplianceService.getTransactions(city));
    setSelectedCorrection(null);
  };

  const handleRejectCorrection = () => {
    if (!selectedCorrection || rejectionReason.length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }
    setSelectedCorrection(null);
    setRejectionReason("");
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 90) return "bg-green-100 text-green-700";
    if (confidence >= 70) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ClipboardCheck className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">GST Manager Review</h1>
            <p className="text-sm text-gray-600">Approve, override, or reject transactions and AI corrections</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "pending"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Pending Approval ({pendingApproval.length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "approved"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Approved ({approved.length})
        </button>
        <button
          onClick={() => setActiveTab("overridden")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "overridden"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Overridden ({overridden.length})
        </button>
        <button
          onClick={() => setActiveTab("ai-history")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "ai-history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Brain className="w-4 h-4 inline mr-1" />
          AI Correction History ({aiCorrectionHistory.length})
        </button>
      </div>

      {activeTab !== "ai-history" ? (
        <div className="space-y-4">
          {displayTransactions.map(txn => (
            <div key={txn.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{txn.invoiceNumber}</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">Date: {txn.invoiceDate}</p>
                    <p className="text-gray-600">Type: {txn.transactionType}</p>
                    <p className="text-gray-600">Party: {txn.partyName}</p>
                    <p className="text-gray-600">GSTIN: {txn.partyGstin}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Financial Details</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxable Value:</span>
                      <span className="font-medium">₹{(txn?.taxableValue ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST ({txn.gstRate}%):</span>
                      <span className="font-medium">₹{(txn?.totalTax ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="font-medium text-gray-900">Invoice Total:</span>
                      <span className="font-semibold text-gray-900">₹{(txn?.invoiceTotal ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {txn.validationErrors.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900 mb-1">Validation Issues:</p>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {txn.validationErrors.map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === "pending" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(txn)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setSelectedTxn(txn)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Override with Reason
                  </button>
                  <button
                    onClick={() => handleReject(txn)}
                    className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Approved by {txn.approvedBy} on {txn.approvedAt ? new Date(txn.approvedAt).toLocaleDateString() : "N/A"}</span>
                </div>
              )}
            </div>
          ))}

          {displayTransactions.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <ClipboardCheck className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">All Done!</h3>
              <p className="text-sm text-gray-600">No {activeTab === "pending" ? "pending" : activeTab} transactions</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {aiCorrectionHistory.map(({ txn, corrections }) => (
            <div key={txn.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900">{txn.invoiceNumber}</h3>
                <p className="text-sm text-gray-600">
                  {txn.transactionType} | {txn.partyName} | ₹{(txn?.invoiceTotal ?? 0).toLocaleString()}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-900">AI Corrections Requiring Manager Review:</p>
                {corrections.map((correction, idx) => (
                  <div key={idx} className="border border-purple-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{correction.issueType}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(correction.confidence)}`}>
                            {correction.confidence}% Confidence
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{correction.explanation}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="bg-white rounded-lg p-3 border border-red-200">
                        <p className="text-xs text-gray-600 mb-1">Original Value</p>
                        <p className="font-medium text-red-600">{correction.originalValue}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <p className="text-xs text-gray-600 mb-1">Suggested Value</p>
                        <p className="font-medium text-green-600">{correction.suggestedValue}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedCorrection({ txn, correction, index: idx })}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Approve Fix
                      </button>
                      <button
                        onClick={() => setSelectedCorrection({ txn, correction, index: idx })}
                        className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {aiCorrectionHistory.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Brain className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">No AI Corrections Pending</h3>
              <p className="text-sm text-gray-600">All AI corrections are auto-applicable or have been reviewed</p>
            </div>
          )}
        </div>
      )}

      {selectedTxn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Override Transaction</h2>
              <button onClick={() => setSelectedTxn(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-900 mb-1">Transaction Details</p>
                <p className="text-sm text-amber-800">{selectedTxn.invoiceNumber} | {selectedTxn.partyName} | ₹{(selectedTxn?.invoiceTotal ?? 0).toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Override Reason <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(minimum 20 characters)</span>
                </label>
                <textarea
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={4}
                  placeholder="Explain why you're overriding the validation rules..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {overrideReason.length}/20 characters
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedTxn(null);
                    setOverrideReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOverride}
                  disabled={overrideReason.length < 20}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Confirm Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCorrection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Review AI Correction</h2>
              <button onClick={() => setSelectedCorrection(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Correction Details</p>
                <p className="text-sm text-blue-800">{selectedCorrection.correction.issueType}</p>
                <p className="text-sm text-blue-700 mt-2">{selectedCorrection.correction.explanation}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Original Value</p>
                  <p className="font-medium text-red-600">{selectedCorrection.correction.originalValue}</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Suggested Value</p>
                  <p className="font-medium text-green-600">{selectedCorrection.correction.suggestedValue}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (if rejecting)
                  <span className="text-xs text-gray-500 ml-2">(minimum 10 characters)</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                  placeholder="Explain why this correction is being rejected..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedCorrection(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectCorrection}
                  disabled={rejectionReason.length < 10}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Reject Correction
                </button>
                <button
                  onClick={handleApproveCorrection}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Approve & Apply Fix
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
