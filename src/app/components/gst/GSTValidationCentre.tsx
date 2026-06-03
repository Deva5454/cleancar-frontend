import { useState, useMemo } from "react";
import { CheckCircle2, AlertCircle, Send, X, Check, TrendingDown } from "lucide-react";
import { gstComplianceService, type GSTTransaction } from "../../services/gstComplianceService";
import { analyzeTransaction, scoreAfterCorrection, type AICorrection } from "../../services/gstAIScoringService";
import { useCity } from "../../contexts/CityContext";

export function GSTValidationCentre() {
  const { city } = useCity();
  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
  const [transactions, setTransactions] = useState<GSTTransaction[]>(gstComplianceService.getTransactions(city));
  const [selectedTxn, setSelectedTxn] = useState<GSTTransaction | null>(null);

  const pendingTransactions = useMemo(() =>
    transactions.filter(t => t.status === "Flagged" || t.validationErrors.length > 0),
    [transactions]
  );

  const resolvedTransactions = useMemo(() =>
    transactions.filter(t => t.status === "Validated" || t.status === "Approved"),
    [transactions]
  );

  const displayTransactions = activeTab === "pending" ? pendingTransactions : resolvedTransactions;

  const handleApplyCorrection = (txn: GSTTransaction, correction: AICorrection) => {
    let updatedTxn = { ...txn };

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

    gstComplianceService.saveTransaction(updatedTxn);
    setTransactions(gstComplianceService.getTransactions(city));
  };

  const handleAction = (txn: GSTTransaction, action: "reviewed" | "approved" | "manager" | "rejected") => {
    const newStatus = action === "approved" ? "Approved" : action === "manager" ? "Validated" : "Draft";
    const updated = { ...txn, status: newStatus as any };
    gstComplianceService.saveTransaction(updated);
    setTransactions(gstComplianceService.getTransactions(city));
    setSelectedTxn(null);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 90) return "bg-green-100 text-green-700 border-green-200";
    if (confidence >= 70) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence > 90) return "High Confidence";
    if (confidence >= 70) return "Medium";
    return "Low — Manager Required";
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">GST Validation Centre</h1>
            <p className="text-sm text-gray-600">Review and resolve flagged transactions with AI corrections</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-orange-600 text-orange-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Pending Review ({pendingTransactions.length})
        </button>
        <button
          onClick={() => setActiveTab("resolved")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "resolved"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Resolved ({resolvedTransactions.length})
        </button>
      </div>

      <div className="space-y-4">
        {displayTransactions.map(txn => {
          const scoringResult = analyzeTransaction({ ...txn, companyState: "Gujarat" });
          const currentScore = txn.riskScore;

          return (
            <div key={txn.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{txn.invoiceNumber}</h3>
                  <p className="text-sm text-gray-600">
                    {txn.transactionType} | {txn.partyName} | ₹{(txn?.invoiceTotal ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    txn.riskLevel === "Clean" ? "bg-green-100 text-green-700" :
                    txn.riskLevel === "Medium" ? "bg-amber-100 text-amber-700" :
                    txn.riskLevel === "High" ? "bg-orange-100 text-orange-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {txn.riskLevel} Risk
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    Score: {currentScore}
                  </span>
                </div>
              </div>

              {scoringResult.corrections.length > 0 && (
                <div className="space-y-3 mb-4">
                  <p className="text-sm font-medium text-gray-900">AI Correction Suggestions:</p>
                  {scoringResult.corrections.map((correction, idx) => {
                    const scoreAfter = scoreAfterCorrection(currentScore, correction);

                    return (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{correction.issueType}</h4>
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getConfidenceColor(correction.confidence)}`}>
                                {getConfidenceLabel(correction.confidence)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{correction.explanation}</p>
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

                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Confidence:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                              <div
                                className={`h-2 rounded-full ${
                                  correction.confidence > 90 ? "bg-green-500" :
                                  correction.confidence >= 70 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${correction.confidence}%` }}
                              />
                            </div>
                            <span className="font-medium">{correction.confidence}%</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingDown className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">
                              Risk Score: <span className="font-semibold text-red-600">{currentScore}</span> →{" "}
                              <span className="font-semibold text-green-600">{scoreAfter}</span>
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {correction.autoApplicable ? (
                              <button
                                onClick={() => handleApplyCorrection(txn, correction)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                <Check className="w-3 h-3" />
                                Apply Fix
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(txn, "manager")}
                                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
                              >
                                <Send className="w-3 h-3" />
                                Send to Manager
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => handleAction(txn, "reviewed")}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Mark as Reviewed
                </button>
                <button
                  onClick={() => handleAction(txn, "approved")}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  Approve
                </button>
                <button
                  onClick={() => handleAction(txn, "manager")}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 inline mr-1" />
                  Send to Manager
                </button>
                <button
                  onClick={() => handleAction(txn, "rejected")}
                  className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Reject
                </button>
              </div>
            </div>
          );
        })}

        {displayTransactions.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">All Clear!</h3>
            <p className="text-sm text-gray-600">No {activeTab === "pending" ? "pending" : "resolved"} transactions to review</p>
          </div>
        )}
      </div>
    </div>
  );
}
