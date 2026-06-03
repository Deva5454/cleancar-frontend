import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { accountingEntryService } from "../../services/accountingEntryService";
import { FileText, Save, CheckCircle, AlertTriangle, Brain, TrendingDown, CheckCircle2 } from "lucide-react";
import { gstComplianceService, type GSTTransaction, COMPANY_GST_CONFIG } from "../../services/gstComplianceService";
import { analyzeTransaction, type ScoringResult, type AICorrection, scoreAfterCorrection } from "../../services/gstAIScoringService";
import { getSubTypesForParent, getSubTypeById } from "../../config/gstTransactionTypes";
import type { TransactionSubType } from "../../config/gstTransactionTypes";
import { TransactionTypeConfigurator } from "./TransactionTypeConfigurator";
import { hasPermission } from "../../utils/permissionEngine";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";

const COMPANY_STATE      = COMPANY_GST_CONFIG.stateName;
const COMPANY_STATE_CODE = COMPANY_GST_CONFIG.stateCode;

export function GSTTransactionEntry() {
  const { currentUser } = useRole();
  const canCreate = hasPermission(currentUser, "accounts", "create");
  const { city, cityInfo } = useCity();

  const [formData, setFormData] = useState<Partial<GSTTransaction & { supplyType?: "INTRA_STATE" | "INTER_STATE" | "EXPORT"; isRCM?: boolean }>>({
    id: crypto.randomUUID(),
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    transactionType: "Sale",
    gstType: "B2B",
    partyId: "",
    partyName: "",
    partyGstin: "",
    partyState: "",
    placeOfSupply: "",
    placeOfSupplyCode: "",
    supplyType: undefined,
    isRCM: false,
    hsnSacCode: "",
    description: "",
    quantity: 1,
    unit: "Nos",
    unitPrice: 0,
    taxableValue: 0,
    gstRate: 18,
    cgst: 0,
    sgst: 0,
    igst: 0,
    cess: 0,
    totalTax: 0,
    invoiceTotal: 0,
    itcEligible: false,
    itcAmount: 0,
    reverseCharge: false,
    status: "Draft",
    validationErrors: [],
    riskScore: 0,
    riskLevel: "Clean",
    createdBy: "Current User",
    createdAt: new Date().toISOString(),
    month: "April",
    year: 2026
  });

  const [showRiskPanel, setShowRiskPanel] = useState(false);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [appliedCorrections, setAppliedCorrections] = useState<Set<number>>(new Set());
  const [selectedSubType, setSelectedSubType] = useState<TransactionSubType | null>(null);
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [availableSubTypes, setAvailableSubTypes] = useState<TransactionSubType[]>([]);

  const parties = useMemo(() => {
    const vendors   = gstComplianceService.getVendors(city);    // pass city filter
    const customers = gstComplianceService.getCustomers(city);  // pass city filter
    return [
      ...vendors.map(v => ({ id: v.id, name: v.name, type: "vendor" as const, gstin: v.gstin, state: v.state, stateCode: v.stateCode })),
      ...customers.map(c => ({ id: c.id, name: c.name, type: "customer" as const, gstin: c.gstin || "", state: c.state || "", stateCode: c.stateCode || "" })),
    ];
  }, [city]);

  useEffect(() => {
    if (formData.quantity && formData.unitPrice) {
      const taxableValue = formData.quantity * formData.unitPrice;
      setFormData(prev => ({ ...prev, taxableValue }));
    }
  }, [formData.quantity, formData.unitPrice]);

  useEffect(() => {
    if (formData.taxableValue && formData.gstRate !== undefined && formData.supplyType) {
      const supplyType = formData.isRCM
        ? (formData.supplyType === "INTER_STATE" ? "RCM_INTER" : "RCM_INTRA")
        : (formData.supplyType as "INTRA_STATE" | "INTER_STATE" | "EXPORT");
      const gst = gstComplianceService.calculateGST(
        formData.taxableValue, formData.gstRate, supplyType
      );
      setFormData(prev => ({
        ...prev,
        cgst: gst.cgst, sgst: gst.sgst, igst: gst.igst,
        totalTax: gst.totalTax, invoiceTotal: gst.invoiceTotal,
        itcAmount: prev.itcEligible ? gst.totalTax : 0
      }));
    }
  }, [formData.taxableValue, formData.gstRate, formData.supplyType, formData.isRCM]);

  useEffect(() => {
    if (formData.invoiceDate) {
      const date = new Date(formData.invoiceDate);
      const month = date.getMonth() + 1; // integer 1–12, locale-independent
      const year = date.getFullYear();
      setFormData(prev => ({ ...prev, month, year }));
    }
  }, [formData.invoiceDate]);

  // Load sub-types when transaction type changes
  useEffect(() => {
    if (formData.transactionType) {
      const subTypes = getSubTypesForParent(formData.transactionType);
      setAvailableSubTypes(subTypes);
      setSelectedSubType(null);  // reset sub-type when parent type changes
      setFormData(prev => ({
        ...prev,
        transactionSubType: undefined,
        transactionCategory: undefined,
        // Reset ITC eligibility based on new type — will be set when sub-type is chosen
      }));
    }
  }, [formData.transactionType]);

  const handleSubTypeSelect = (subTypeId: string) => {
    if (subTypeId === "__configure__") {
      setShowConfigurator(true);
      return;
    }
    const subType = availableSubTypes.find(st => st.id === subTypeId) || null;
    setSelectedSubType(subType);
    if (subType) {
      setFormData(prev => ({
        ...prev,
        transactionSubType: subType.label,
        transactionCategory: subType.id,
        // Auto-set ITC eligibility based on sub-type
        itcEligible: subType.itcEligible,
        itcAmount: subType.itcEligible ? prev.totalTax : 0,
        // Auto-set HSN hint if provided
        hsnSacCode: subType.hsnHint && !prev.hsnSacCode ? subType.hsnHint : prev.hsnSacCode,
      }));
    }
  };

  // Auto-derive supply type when party is selected
  const deriveSupplyType = (partyId: string): "INTRA_STATE" | "INTER_STATE" => {
    const party = parties.find(p => p.id === partyId);
    const partyStateCode  = party?.stateCode || "";
    const companyStateCode = COMPANY_GST_CONFIG.stateCode; // e.g. "24" for Gujarat
    return partyStateCode === companyStateCode ? "INTRA_STATE" : "INTER_STATE";
  };

  const handlePartySelect = (partyId: string) => {
    const party = parties.find(p => p.id === partyId);
    if (party) {
      const isVendor = 'gstin' in party && party.gstin;
      const gstType = isVendor ? gstComplianceService.deriveGSTType(party.gstin) : "B2C";
      const supplyType = party.stateCode === COMPANY_GST_CONFIG.stateCode
        ? "INTRA_STATE" : "INTER_STATE";
      setFormData(prev => ({
        ...prev,
        partyId: party.id,
        partyName: party.name,
        partyGstin: 'gstin' in party ? party.gstin || "" : "",
        partyState: party.state,
        placeOfSupply: party.state,
        placeOfSupplyCode: party.stateCode,
        supplyType,
        gstType
      }));
    }
  };

  const handleAnalyze = () => {
    const result = analyzeTransaction({
      ...formData,
      companyState: COMPANY_STATE
    });
    setScoringResult(result);
    setShowRiskPanel(true);
    setAppliedCorrections(new Set());
  };

  const handleApplyCorrection = (correction: AICorrection, index: number) => {
    let updatedFormData = { ...formData };

    if (correction.issueType === "Wrong GST rate") {
      const newRate = parseInt(correction.suggestedValue.replace('%', ''));
      updatedFormData.gstRate = newRate;
    } else if (correction.issueType === "Wrong tax type — should be CGST/SGST") {
      const halfIgst = formData.igst! / 2;
      updatedFormData = {
        ...updatedFormData,
        cgst: halfIgst,
        sgst: halfIgst,
        igst: 0
      };
    } else if (correction.issueType === "Tax calculation mismatch") {
      const correctTax = parseFloat(correction.suggestedValue.replace('₹', '').replace(',', ''));
      updatedFormData.totalTax = correctTax;
      updatedFormData.invoiceTotal = updatedFormData.taxableValue! + correctTax;
    }

    setFormData(updatedFormData);
    setAppliedCorrections(prev => new Set([...prev, index]));

    if (scoringResult) {
      const newScore = scoreAfterCorrection(scoringResult.totalScore, correction);
      setScoringResult({
        ...scoringResult,
        totalScore: newScore,
        riskLevel: newScore < 30 ? "Clean" : newScore < 60 ? "Medium" : newScore < 80 ? "High" : "Critical"
      });
    }
  };

  const handleDismissCorrection = (index: number) => {
    setAppliedCorrections(prev => new Set([...prev, index]));
  };

  const handleSubmit = (asDraft: boolean) => {
    if (!asDraft && !showRiskPanel) {
      handleAnalyze();
      return;
    }

    const transaction: GSTTransaction = {
      ...formData,
      status: asDraft ? "Draft" : scoringResult?.requiresManagerReview ? "Flagged" : "Validated",
      riskScore: scoringResult?.totalScore || 0,
      riskLevel: scoringResult?.riskLevel || "Clean",
      validationErrors: scoringResult?.corrections.map(c => c.issueType) || [],
      cityId: city,
      city: cityInfo.displayName,
      supplyNature: formData.gstRate === 0 ? "ZeroRated" : "Taxable",
      changeHistory: [{
        timestamp: new Date().toISOString(),
        changedBy: formData.createdBy || "Accountant",
        action: "Submitted",
        newStatus: asDraft ? "Draft" : "Validated",
      }],
    } as GSTTransaction;

    gstComplianceService.saveTransaction(transaction);

    // RCM Journal Entry auto-generation
    if (formData.isRCM && formData.transactionType === "Purchase") {

      // Determine if intra-state or inter-state RCM
      const isIntraState = formData.supplyType === "INTRA_STATE";

      // Get ledger IDs (simplified - in production, fetch from accountingEntryService)
      const expenseLedgerId = formData.transactionCategory || "direct_expenses";
      const expenseLedgerName = formData.transactionSubType || "Direct Expense";
      const inputCGSTLedgerId = "gst_input_cgst";
      const inputSGSTLedgerId = "gst_input_sgst";
      const inputIGSTLedgerId = "gst_input_igst";
      const rcmOutputCGSTId = "rcm_output_cgst";
      const rcmOutputSGSTId = "rcm_output_sgst";
      const rcmOutputIGSTId = "rcm_output_igst";
      const vendorLedgerId = formData.partyId || "vendor_misc";

      const journalLines = [];

      // Expense Ledger Dr
      journalLines.push({
        accountHead: expenseLedgerId,
        accountLabel: expenseLedgerName,
        debit: formData.taxableValue || 0,
        credit: 0
      });

      if (isIntraState) {
        // Intra-state RCM: CGST Input Dr | SGST Input Dr | CGST RCM Output Cr | SGST RCM Output Cr
        journalLines.push(
          { accountHead: inputCGSTLedgerId, accountLabel: "Input CGST", debit: formData.cgst || 0, credit: 0 },
          { accountHead: inputSGSTLedgerId, accountLabel: "Input SGST", debit: formData.sgst || 0, credit: 0 },
          { accountHead: rcmOutputCGSTId, accountLabel: "CGST RCM Output", debit: 0, credit: formData.cgst || 0 },
          { accountHead: rcmOutputSGSTId, accountLabel: "SGST RCM Output", debit: 0, credit: formData.sgst || 0 }
        );
      } else {
        // Inter-state RCM: IGST Input Dr | IGST RCM Output Cr
        journalLines.push(
          { accountHead: inputIGSTLedgerId, accountLabel: "Input IGST", debit: formData.igst || 0, credit: 0 },
          { accountHead: rcmOutputIGSTId, accountLabel: "IGST RCM Output", debit: 0, credit: formData.igst || 0 }
        );
      }

      // Vendor Cr
      journalLines.push({
        accountHead: vendorLedgerId,
        accountLabel: formData.partyName || "Vendor",
        debit: 0,
        credit: formData.taxableValue || 0
      });

      accountingEntryService.createJournal({
        date: formData.invoiceDate || new Date().toISOString().split('T')[0],
        narration: `RCM — ${formData.partyName} — ${formData.invoiceNumber}`,
        lines: journalLines,
        city: cityInfo.displayName,
        cityId: city,
        createdBy: formData.createdBy || "GST Entry",
      }, cityInfo.displayName);
    }

    toast.success(`Transaction ${asDraft ? 'saved as draft' : 'submitted'} successfully!`);
    window.location.reload();
  };

  const taxFormula = useMemo(() => {
    if (!formData.taxableValue || !formData.gstRate) return "";
    const isIntraState = formData.supplyType === "INTRA_STATE";
    if (isIntraState) {
      return `Taxable ₹${formData.taxableValue.toLocaleString()} × ${formData.gstRate}% = ₹${formData.totalTax?.toLocaleString() || 0} split as CGST ₹${formData.cgst?.toLocaleString() || 0} + SGST ₹${formData.sgst?.toLocaleString() || 0}`;
    }
    return `Taxable ₹${formData.taxableValue.toLocaleString()} × ${formData.gstRate}% = IGST ₹${formData.igst?.toLocaleString() || 0}`;
  }, [formData.taxableValue, formData.gstRate, formData.supplyType, formData.totalTax, formData.cgst, formData.sgst, formData.igst]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Clean": return "bg-green-100 text-green-700 border-green-200";
      case "Medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "High": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Critical": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
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
          <div className="p-2 bg-green-100 rounded-lg">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">GST Transaction Entry</h1>
            <p className="text-sm text-gray-600">Record sales and purchase transactions with GST details</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Section A — Invoice Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.invoiceNumber}
                onChange={e => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={formData.invoiceDate}
                onChange={e => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.transactionType}
                onChange={e => setFormData(prev => ({ ...prev, transactionType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="Sale">Sale</option>
                <option value="Purchase">Purchase</option>
                <option value="Expense">Expense</option>
                <option value="Credit Note">Credit Note</option>
                <option value="Debit Note">Debit Note</option>
              </select>
            </div>

            {/* Sub-Type Selector — only shows if sub-types exist for this parent */}
            {availableSubTypes.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Sub-Type <span className="text-red-500">*</span>
                  {selectedSubType && (
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      — {selectedSubType.accountHead}
                    </span>
                  )}
                </label>
                <select
                  value={selectedSubType?.id || ""}
                  onChange={e => handleSubTypeSelect(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select sub-type...</option>
                  {/* Group system defaults and custom types */}
                  <optgroup label="Standard Categories">
                    {availableSubTypes.filter(st => !st.isCustom).map(st => (
                      <option key={st.id} value={st.id}>{st.label}</option>
                    ))}
                  </optgroup>
                  {availableSubTypes.filter(st => st.isCustom).length > 0 && (
                    <optgroup label="Custom Categories">
                      {availableSubTypes.filter(st => st.isCustom).map(st => (
                        <option key={st.id} value={st.id}>{st.label} ★</option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__configure__">+ Configure New Sub-Type...</option>
                </select>

                {/* ITC eligibility indicator — shows after sub-type is selected */}
                {selectedSubType && (
                  <div className={`mt-1 p-2 rounded text-xs flex items-start gap-2 ${
                    selectedSubType.itcEligible
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-amber-50 border border-amber-200 text-amber-800"
                  }`}>
                    <span className="text-base leading-none">
                      {selectedSubType.itcEligible ? "✓" : "⚠"}
                    </span>
                    <span>
                      <strong>ITC: </strong>{selectedSubType.itcRule}
                    </span>
                  </div>
                )}

                {/* Description tooltip */}
                {selectedSubType?.description && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">
                    {selectedSubType.description}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <input
                type="text"
                value={formData.month}
                onChange={e => setFormData(prev => ({ ...prev, month: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Section B — Party Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select {formData.transactionType === "Purchase" ? "Vendor" : "Customer"} <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.partyId}
                onChange={e => handlePartySelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select {formData.transactionType === "Purchase" ? "Vendor" : "Customer"}</option>
                {parties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {('gstin' in p && p.gstin) ? `(${p.gstin})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {formData.partyName && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={formData.partyGstin}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.partyState}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status</label>
                  <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg">
                    Regular Filer ✓
                  </span>
                </div>
                {formData.supplyType && (
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supply Type</label>
                    <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                      formData.supplyType === "INTRA_STATE"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {formData.supplyType === "INTRA_STATE" ? "Intra-State — CGST + SGST" : "Inter-State — IGST only"}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Section C — Supply Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place of Supply</label>
              <input
                type="text"
                value={formData.placeOfSupply}
                onChange={e => setFormData(prev => ({ ...prev, placeOfSupply: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HSN / SAC Code</label>
              <input
                type="text"
                value={formData.hsnSacCode}
                onChange={e => setFormData(prev => ({ ...prev, hsnSacCode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="4/6/8 digits"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="Nos">Nos</option>
                <option value="Kg">Kg</option>
                <option value="Litre">Litre</option>
                <option value="Metre">Metre</option>
                <option value="Set">Set</option>
                <option value="Job">Job</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description of Goods/Services</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={e => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={e => setFormData(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Section D — Tax Calculation</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-sm text-gray-600">Taxable Value</label>
                <p className="text-xl font-semibold text-gray-900">₹{formData.taxableValue?.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">GST Rate</label>
                <select
                  value={formData.gstRate}
                  onChange={e => setFormData(prev => ({ ...prev, gstRate: Number(e.target.value) }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                  <option value={40}>40%</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <label className="text-gray-600">CGST</label>
                <p className="font-semibold text-gray-900">₹{formData.cgst?.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Auto-calculated based on supply type (intra/inter-state)
                </p>
              </div>
              <div>
                <label className="text-gray-600">SGST</label>
                <p className="font-semibold text-gray-900">₹{formData.sgst?.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Auto-calculated based on supply type (intra/inter-state)
                </p>
              </div>
              <div>
                <label className="text-gray-600">IGST</label>
                <p className="font-semibold text-gray-900">₹{formData.igst?.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-gray-600">Total Tax</label>
                <p className="font-semibold text-gray-900">₹{formData.totalTax?.toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-blue-300">
              <p className="text-sm text-blue-900">{taxFormula}</p>
            </div>

            <div className="pt-2">
              <label className="text-sm text-gray-600">Invoice Total</label>
              <p className="text-2xl font-bold text-gray-900">₹{formData.invoiceTotal?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {formData.transactionType === "Purchase" && (
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Section E — ITC Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="itc"
                  checked={formData.itcEligible}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    itcEligible: e.target.checked,
                    itcAmount: e.target.checked ? prev.totalTax || 0 : 0
                  }))}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="itc" className="text-sm text-gray-700">ITC Eligible</label>
              </div>

              {formData.itcEligible && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">ITC Amount</label>
                    <input
                      type="number"
                      value={formData.itcAmount}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rcm"
                      checked={formData.reverseCharge}
                      onChange={e => setFormData(prev => ({ ...prev, reverseCharge: e.target.checked, isRCM: e.target.checked }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor="rcm" className="text-sm text-gray-700">Reverse Charge Mechanism</label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showRiskPanel && scoringResult && (
          <div className="border-t pt-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Brain className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-gray-900">AI Risk Assessment</h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div>
                  <span className="text-sm text-gray-600">Risk Score</span>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold ml-3 ${getRiskColor(scoringResult.riskLevel)}`}>
                    {scoringResult.totalScore}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Risk Level</span>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold ml-3 ${getRiskColor(scoringResult.riskLevel)}`}>
                    {scoringResult.riskLevel}
                  </div>
                </div>
              </div>

              {scoringResult.corrections.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-900">Issues Found:</p>
                  {scoringResult.corrections.map((correction, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{correction.issueType}</h4>
                          <p className="text-sm text-gray-600 mt-1">{correction.explanation}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(correction.confidence)}`}>
                          {correction.confidence}% {correction.confidence > 90 ? "High" : correction.confidence >= 70 ? "Medium" : "Low"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-600">Original:</span>
                          <span className="ml-2 font-medium text-red-600">{correction.originalValue}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Suggested:</span>
                          <span className="ml-2 font-medium text-green-600">{correction.suggestedValue}</span>
                        </div>
                      </div>

                      {!appliedCorrections.has(index) && (
                        <div className="flex gap-2 mt-3">
                          {correction.autoApplicable && correction.confidence > 90 && (
                            <button
                              onClick={() => handleApplyCorrection(correction, index)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Apply Fix
                            </button>
                          )}
                          {correction.autoApplicable && correction.confidence >= 70 && correction.confidence <= 90 && (
                            <button
                              onClick={() => handleApplyCorrection(correction, index)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Apply
                            </button>
                          )}
                          {!correction.autoApplicable && (
                            <button className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs hover:bg-amber-700">
                              Send to Manager
                            </button>
                          )}
                          <button
                            onClick={() => handleDismissCorrection(index)}
                            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}

                      {appliedCorrections.has(index) && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Correction applied</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {scoringResult.requiresManagerReview && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">This transaction requires manager review.</span>
                  </div>
                  <button className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
                    Send to Manager Review
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => handleSubmit(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Save className="w-4 h-4" />
            Save as Draft
          </button>
          {canCreate && (
            <button
              onClick={() => handleSubmit(false)}
              disabled={showRiskPanel && scoringResult?.requiresManagerReview}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              {showRiskPanel ? "Submit for Validation" : "Analyze & Submit"}
            </button>
          )}
        </div>
      </div>

      {/* Transaction Type Configurator Modal */}
      <TransactionTypeConfigurator
        open={showConfigurator}
        parentType={formData.transactionType || "Expense"}
        onClose={() => setShowConfigurator(false)}
        onConfirm={(newSubType) => {
          setAvailableSubTypes(prev => [...prev, newSubType]);
          setSelectedSubType(newSubType);
          setShowConfigurator(false);
          handleSubTypeSelect(newSubType.id);
        }}
      />
    </div>
  );
}
