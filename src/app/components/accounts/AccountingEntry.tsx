import { BackButton } from "../ui/back-button";
import { useState, useEffect } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import {
  accountingEntryService,
  validateGSTIN,
  GST_STATE_OPTIONS,
  CHART_OF_ACCOUNTS_HEADS,
  type EntryType,
  type GSTEntryType,
  type PaymentMode,
} from "../../services/accountingEntryService";
import { gstComplianceService, COMPANY_GST_CONFIG } from "../../services/gstComplianceService";
import { toast } from "sonner";

const ENTRY_TYPES: EntryType[] = ["Expense", "Purchase", "PurchaseReturn", "Sales", "SalesReturn", "AssetPurchase"];

const GST_ENTRY_TYPES: { value: GSTEntryType; label: string }[] = [
  { value: "B2B", label: "B2B Registered" },
  { value: "Unregistered", label: "Unregistered" },
  { value: "RCM", label: "RCM (Reverse Charge)" },
  { value: "NonGST", label: "Non-GST Expense" },
];

const GST_RATES = [
  { value: 0, label: "0%" },
  { value: 5, label: "5%" },
  { value: 12, label: "12%" },
  { value: 18, label: "18%" },
  { value: 28, label: "28%" },
];

const PAYMENT_MODES: PaymentMode[] = ["Bank", "Cash", "PettyCash"];

export function AccountingEntry() {
  const { currentUser } = useRole();
  const { city, cityInfo } = useCity();
  const [activeTab, setActiveTab] = useState<EntryType>("Expense");
  const [quickMode, setQuickMode] = useState(false);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedPackageCode, setSelectedPackageCode] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorGstin, setVendorGstin] = useState("");
  const [vendorStateCode, setVendorStateCode] = useState("");
  const [gstinError, setGstinError] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [hsnSacCode, setHsnSacCode] = useState("");
  const [gstEntryType, setGstEntryType] = useState<GSTEntryType>("B2B");
  const [expenseAccount, setExpenseAccount] = useState("");
  const [taxableValue, setTaxableValue] = useState(0);
  const [gstRate, setGstRate] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [igst, setIgst] = useState(0);
  const [totalBillValue, setTotalBillValue] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Bank");
  const [pettyCashBranch, setPettyCashBranch] = useState("");
  const [debitAccount, setDebitAccount] = useState("");
  const [creditAccount, setCreditAccount] = useState("");
  const [narration, setNarration] = useState("");
  const [voucherPreview, setVoucherPreview] = useState("");
  const [debitSearch, setDebitSearch] = useState("");
  const [creditSearch, setCreditSearch] = useState("");

  // Auto-calculate GST when taxable value, rate, or vendor state changes
  // Uses gstComplianceService (single GST engine for whole app — component-level rounding)
  useEffect(() => {
    if (taxableValue > 0 && vendorStateCode && gstEntryType !== "NonGST") {
      const companyStateCode = COMPANY_GST_CONFIG.stateCode; // "24" Gujarat
      const isIntra = vendorStateCode === companyStateCode;
      const supplyType = gstEntryType === "RCM"
        ? (isIntra ? "RCM_INTRA" : "RCM_INTER")
        : (isIntra ? "INTRA_STATE" : "INTER_STATE");
      const result = gstComplianceService.calculateGST(taxableValue, gstRate, supplyType);
      setCgst(result.cgst);
      setSgst(result.sgst);
      setIgst(result.igst);
      setTotalBillValue(result.invoiceTotal);
    } else {
      setCgst(0);
      setSgst(0);
      setIgst(0);
      setTotalBillValue(taxableValue);
    }
  }, [taxableValue, gstRate, vendorStateCode, gstEntryType, city]);

  // Auto-fill vendor details when vendor is selected
  useEffect(() => {
    if (selectedVendorId) {
      if (selectedVendorId.startsWith("LM-")) {
        // Vendor from LedgerMaster
        const ledgerId = selectedVendorId.replace("LM-", "");
        const ledger = accountingEntryService.getLedgers(city).find(l => l.id === ledgerId);
        if (ledger) {
          setVendorName(ledger.name);
          setVendorGstin(ledger.gstin || "");
          setVendorStateCode(ledger.gstin?.substring(0, 2) || "24");
          setCreditAccount(ledger.id);
        }
      } else {
        const vendors = gstComplianceService.getVendors();
        const vendor = vendors.find(v => v.id === selectedVendorId);
        if (vendor) {
          setVendorName(vendor.name);
          setVendorGstin(vendor.gstin);
          setVendorStateCode(vendor.stateCode);

          // Find vendor's ledger and auto-populate credit account
          const allLedgers = accountingEntryService.getLedgers(city);
          const vendorLedger = allLedgers.find(l => l.gstin === vendor.gstin && l.type === "vendor");
          if (vendorLedger) {
            setCreditAccount(vendorLedger.id);
          }
        }
      }
    }
  }, [selectedVendorId, city]);

  // Auto-fill credit account when package is selected (for Sales entries)
  useEffect(() => {
    if (activeTab === "Sales" && selectedPackageCode) {
      const allLedgers = accountingEntryService.getLedgers(city);
      const packageLedger = allLedgers.find(l => l.packageCode === selectedPackageCode && l.type === "sales");
      if (packageLedger) {
        setCreditAccount(packageLedger.id);
      }
    }
  }, [activeTab, selectedPackageCode, city]);

  // Auto-fill debit/credit accounts based on payment mode and expense account
  useEffect(() => {
    if (expenseAccount) {
      // Always resolve to ledger ID — find or create a ledger for this account head
      const allLedgers = accountingEntryService.getLedgers(city);
      const matching = allLedgers.find(l => l.accountHead === expenseAccount);
      if (matching) {
        setDebitAccount(matching.id);
      } else {
        // Fallback: use account head as debit if no ledger exists for it
        setDebitAccount(expenseAccount);
      }
    }
  }, [expenseAccount, city]);

  // Auto-fill credit account based on payment mode using actual ledger IDs
  useEffect(() => {
    const allLedgers = accountingEntryService.getLedgers(city);

    if (paymentMode === "Bank") {
      const bankLedger = allLedgers.find(l => l.name === "Axis Bank" && l.type === "bank");
      if (bankLedger) setCreditAccount(bankLedger.id);
    } else if (paymentMode === "Cash") {
      const cashLedger = allLedgers.find(l => l.name === "Cash in Hand");
      if (cashLedger) setCreditAccount(cashLedger.id);
    } else if (paymentMode === "PettyCash") {
      const cashLedger = allLedgers.find(l => l.name === "Petty Cash");
      if (cashLedger) setCreditAccount(cashLedger.id);
    }
  }, [paymentMode, city]);

  // Generate voucher preview — mirrors generateVoucherNumber() in accountingEntryService
  // Uses maxSeq + 1 (not count + 1) so it stays correct after deletions
  useEffect(() => {
    const allEntries = accountingEntryService.getAllEntries(city);
    const fy = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const fyStr = `${String(fy).slice(-2)}-${String(fy + 1).slice(-2)}`;
    const cityName = cityInfo.displayName.toUpperCase();
    const typeCode = activeTab === "Expense" ? "EXP" : activeTab === "Purchase" ? "PUR" : activeTab === "PurchaseReturn" ? "PRN" : activeTab === "Sales" ? "SAL" : activeTab === "SalesReturn" ? "SRN" : "AST";
    const prefix = `${typeCode}/${cityName}/${fyStr}`;
    const maxSeq = allEntries
      .filter(e => e.voucherNumber.startsWith(prefix))
      .map(e => parseInt(e.voucherNumber.split("/").pop() || "0", 10))
      .reduce((max, n) => Math.max(max, n), 0);
    setVoucherPreview(`${prefix}/${String(maxSeq + 1).padStart(4, "0")}`);
  }, [activeTab, city, cityInfo]);

  const handleGstinBlur = () => {
    if (!vendorGstin.trim()) {
      setGstinError("");
      return;
    }
    const validation = validateGSTIN(vendorGstin);
    if (!validation.valid) {
      setGstinError(validation.error || "Invalid GSTIN");
    } else {
      setGstinError("");
      setVendorStateCode(validation.stateCode);
    }
  };

  const handleSubmit = () => {
    // Validation
    if (vendorGstin && gstinError) {
      toast.error("Please fix GSTIN errors before submitting.");
      return;
    }
    if (vendorGstin && vendorStateCode) {
      const gstinStateCode = vendorGstin.substring(0, 2);
      if (gstinStateCode !== vendorStateCode) {
        const selectedStateName = GST_STATE_OPTIONS.find(s => s.code === vendorStateCode)?.name || vendorStateCode;
        toast.error(`State code mismatch: GSTIN starts with ${gstinStateCode} but selected state is ${vendorStateCode} - ${selectedStateName}`);
        return;
      }
    }
    if (taxableValue > 0 && gstRate > 0 && cgst === 0 && sgst === 0 && igst === 0) {
      toast.error("GST calculation error. Please re-enter taxable value.");
      return;
    }
    if (!invoiceNumber.trim()) {
      toast.error("Invoice number is required.");
      return;
    }

    // Create entry
    const entry = accountingEntryService.createEntry(
      {
        entryType: activeTab,
        date,
        vendorName,
        vendorGstin,
        vendorStateCode,
        invoiceNumber,
        hsnSacCode,
        expenseAccount,
        expenseAccountLabel: CHART_OF_ACCOUNTS_HEADS.find(h => h.value === expenseAccount)?.label,
        taxableValue,
        gstRate,
        gstEntryType,
        cgst,
        sgst,
        igst,
        totalBillValue,
        paymentMode,
        pettyCashBranch: paymentMode === "PettyCash" ? pettyCashBranch : undefined,
        isRCM: gstEntryType === "RCM",
        rcmCgst: gstEntryType === "RCM" ? cgst : undefined,
        rcmSgst: gstEntryType === "RCM" ? sgst : undefined,
        rcmIgst: gstEntryType === "RCM" ? igst : undefined,
        debitAccount,
        creditAccount,
        narration,
        city: cityInfo.displayName,
        cityId: city,
        createdBy: currentUser.name,
      },
      cityInfo.displayName
    );

    toast.success(`Entry saved: ${entry.voucherNumber}`);
    resetForm();
  };

  const resetForm = () => {
    setSelectedVendorId("");
    setSelectedPackageCode("");
    setVendorName("");
    setVendorGstin("");
    setVendorStateCode("");
    setGstinError("");
    setInvoiceNumber("");
    setHsnSacCode("");
    setGstEntryType("B2B");
    setExpenseAccount("");
    setTaxableValue(0);
    setGstRate(0);
    setCgst(0);
    setSgst(0);
    setIgst(0);
    setTotalBillValue(0);
    setPaymentMode("Bank");
    setPettyCashBranch("");
    setDebitAccount("");
    setCreditAccount("");
    setNarration("");
  };

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounting Entry</h1>
          <p className="text-sm text-gray-600">All business transactions — expenses, purchases, sales, assets.</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm font-medium">Quick Mode</span>
          <input
            type="checkbox"
            checked={quickMode}
            onChange={(e) => setQuickMode(e.target.checked)}
            className="w-10 h-5 bg-gray-300 rounded-full appearance-none cursor-pointer checked:bg-blue-600 relative before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-5"
          />
        </label>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {ENTRY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === type
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Quick Shortcuts */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-gray-500 self-center">Quick Add:</span>
        <a href="/accounts/ledger-master?new=vendor" className="text-xs px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100">+ New Vendor</a>
        <a href="/accounts/ledger-master?new=expense" className="text-xs px-2 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded hover:bg-purple-100">+ New Expense Ledger</a>
        <a href="/accounts/ledger-master?new=asset" className="text-xs px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded hover:bg-amber-100">+ New Asset Ledger</a>
      </div>

      {/* Quick Mode */}
      {quickMode && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vendor</label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter vendor name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Invoice / Ref No. *</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="INV-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount (Taxable Value)</label>
              <input
                type="number"
                value={taxableValue || ""}
                onChange={(e) => setTaxableValue(parseFloat(e.target.value) || 0)}
                className="w-full border rounded px-3 py-2"
                placeholder="₹0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GST Rate</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(parseInt(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                {GST_RATES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Mode</label>
              <div className="flex gap-2">
                {PAYMENT_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`flex-1 px-3 py-2 border rounded ${
                      paymentMode === mode
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700"
          >
            Save Entry
          </button>
          <div className="p-4 bg-gray-50 rounded border">
            <p className="text-sm font-medium text-gray-700">
              Voucher: <span className="font-mono">{voucherPreview}</span> | Total: ₹
              {totalBillValue.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Full Form */}
      {!quickMode && (
        <div className="space-y-6">
          {/* Section 1: Voucher Details */}
          <div className="p-4 bg-gray-100 rounded space-y-4">
            <h3 className="font-semibold">Voucher Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Serial Number
                  <span className="ml-1 text-xs text-gray-500 font-normal">(Auto-generated)</span>
                </label>
                <input
                  type="text"
                  value={voucherPreview}
                  disabled
                  className="w-full border rounded px-3 py-2 bg-gray-200 font-mono text-gray-700"
                  title="System generated entry number — cannot be edited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Vendor Invoice Number *
                  <span className="ml-1 text-xs text-blue-600 font-normal">(Enter vendor's bill no.)</span>
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full border rounded px-3 py-2 font-medium"
                  placeholder="e.g. BILL/2025-26/0042"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Financial Year</label>
                <input
                  type="text"
                  value={(() => {
                    const now = new Date();
                    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
                    return `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`;
                  })()}
                  disabled
                  className="w-full border rounded px-3 py-2 bg-gray-200 text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Party & Invoice */}
          <div className="space-y-4">
            <h3 className="font-semibold">Party & Invoice</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Vendor Dropdown */}
              {(activeTab === "Expense" || activeTab === "Purchase" || activeTab === "AssetPurchase" || activeTab === "PurchaseReturn") && (
                <div>
                  <label className="block text-sm font-medium mb-1">Select Vendor</label>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Vendor</option>
                    {/* GST vendors from gstComplianceService */}
                    {gstComplianceService.getVendors().map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name} — {vendor.gstin || "Non-GST"}
                      </option>
                    ))}
                    {/* Vendor ledgers added via Ledger Master */}
                    {accountingEntryService.getLedgers(city)
                      .filter(l => (l.type === "vendor" || l.accountHead === "accounts_payable") && !l.isSystem)
                      .map((l) => (
                        <option key={`LM-${l.id}`} value={`LM-${l.id}`}>
                          {l.name} {l.gstin ? `— ${l.gstin}` : "— Non-GST"}
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}

              {/* Package Dropdown for Sales */}
              {activeTab === "Sales" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Subscription Package</label>
                  <select
                    value={selectedPackageCode}
                    onChange={(e) => setSelectedPackageCode(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Package</option>
                    {accountingEntryService.getLedgers(city)
                      .filter(l => l.type === "sales" && l.packageCode)
                      .map((ledger) => (
                        <option key={ledger.id} value={ledger.packageCode}>
                          {ledger.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Vendor/Customer</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter vendor/customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GSTIN</label>
                <input
                  type="text"
                  value={vendorGstin}
                  onChange={(e) => setVendorGstin(e.target.value.toUpperCase())}
                  onBlur={handleGstinBlur}
                  className={`w-full border rounded px-3 py-2 ${gstinError ? "border-red-500" : ""}`}
                  placeholder="24XXXXX0000X1ZX"
                />
                {gstinError && <p className="text-xs text-red-600 mt-1">{gstinError}</p>}
                {!gstinError && vendorGstin && <p className="text-xs text-green-600 mt-1">✓ Valid GSTIN</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vendor/Customer State</label>
                <select
                  value={vendorStateCode}
                  onChange={(e) => setVendorStateCode(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  disabled={!!vendorGstin}
                >
                  <option value="">Select State</option>
                  {GST_STATE_OPTIONS.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HSN / SAC Code</label>
                <input
                  type="text"
                  value={hsnSacCode}
                  onChange={(e) => setHsnSacCode(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="9963"
                />
              </div>
            </div>
          </div>

          {/* Section 3: GST & Amount */}
          <div className="p-4 bg-blue-50 rounded space-y-4">
            <h3 className="font-semibold">GST & Amount</h3>
            {gstEntryType === "RCM" && (
              <div className="p-3 bg-amber-100 border border-amber-400 rounded text-sm text-amber-900">
                RCM selected — tax will be auto-posted as payable in your output liability.
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">GST Entry Type</label>
                <select
                  value={gstEntryType}
                  onChange={(e) => setGstEntryType(e.target.value as GSTEntryType)}
                  className="w-full border rounded px-3 py-2"
                >
                  {GST_ENTRY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expense / Account Head</label>
                <select
                  value={expenseAccount}
                  onChange={(e) => setExpenseAccount(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Account Head</option>
                  {["asset", "liability", "income", "expense"].map((nature) => (
                    <optgroup key={nature} label={nature.toUpperCase()}>
                      {CHART_OF_ACCOUNTS_HEADS.filter((h) => h.nature === nature).map((h) => (
                        <option key={h.value} value={h.value}>
                          {h.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              {gstEntryType !== "NonGST" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Taxable Value</label>
                    <input
                      type="number"
                      value={taxableValue || ""}
                      onChange={(e) => setTaxableValue(parseFloat(e.target.value) || 0)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="₹0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">GST Rate</label>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(parseInt(e.target.value))}
                      className="w-full border rounded px-3 py-2"
                    >
                      {GST_RATES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CGST</label>
                    <input
                      type="number"
                      value={cgst}
                      disabled
                      className="w-full border rounded px-3 py-2 bg-amber-100 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SGST</label>
                    <input
                      type="number"
                      value={sgst}
                      disabled
                      className="w-full border rounded px-3 py-2 bg-amber-100 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">IGST</label>
                    <input
                      type="number"
                      value={igst}
                      disabled
                      className="w-full border rounded px-3 py-2 bg-amber-100 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Bill Value</label>
                    <input
                      type="number"
                      value={totalBillValue}
                      disabled
                      className="w-full border rounded px-3 py-2 bg-white text-blue-700 font-bold"
                    />
                  </div>
                </>
              )}
              {gstEntryType === "NonGST" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Total Amount</label>
                  <input
                    type="number"
                    value={taxableValue || ""}
                    onChange={(e) => setTaxableValue(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="₹0.00"
                  />
                </div>
              )}
            </div>
            {gstEntryType !== "NonGST" && (
              <p className="text-xs italic text-gray-600">
                State 24 (Gujarat) → CGST + SGST | Other states → IGST
              </p>
            )}
          </div>

          {/* Section 4: Payment & Posting */}
          <div className="space-y-4">
            <h3 className="font-semibold">Payment & Posting</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Payment Mode</label>
                <div className="flex gap-2">
                  {PAYMENT_MODES.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`flex-1 px-3 py-2 border rounded ${
                        paymentMode === mode
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              {paymentMode === "PettyCash" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Branch</label>
                  <input
                    type="text"
                    value={pettyCashBranch}
                    onChange={(e) => setPettyCashBranch(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Branch name"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Debit Account</label>
                <input
                  className="w-full border rounded px-3 py-1.5 text-sm mb-1"
                  placeholder="Type to search ledger..."
                  value={debitSearch}
                  onChange={e => setDebitSearch(e.target.value)}
                />
                <select
                  value={debitAccount}
                  onChange={e => setDebitAccount(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm bg-white"
                >
                  <option value="">— Select Debit Account —</option>
                  {CHART_OF_ACCOUNTS_HEADS.map(head => {
                    const ledgers = accountingEntryService.getLedgersByHead(head.value, city)
                      .filter(l => !debitSearch || l.name.toLowerCase().includes(debitSearch.toLowerCase()));
                    if (ledgers.length === 0) return null;
                    return (
                      <optgroup key={head.value} label={`${head.label} (${head.nature})`}>
                        {ledgers.map(ledger => {
                          const bal = accountingEntryService.getLedgerBalance(ledger.id);
                          return (
                            <option key={ledger.id} value={ledger.id}>
                              {ledger.name} — ₹{(bal?.balance ?? 0).toLocaleString()} {bal.balanceType}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}
                </select>
                {debitAccount && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    ✓ Debit: {accountingEntryService.getLedgers(city).find(l => l.id === debitAccount)?.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Credit Account</label>
                <input
                  className="w-full border rounded px-3 py-1.5 text-sm mb-1"
                  placeholder="Type to search ledger..."
                  value={creditSearch}
                  onChange={e => setCreditSearch(e.target.value)}
                />
                <select
                  value={creditAccount}
                  onChange={e => setCreditAccount(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm bg-white"
                >
                  <option value="">— Select Credit Account —</option>
                  {CHART_OF_ACCOUNTS_HEADS.map(head => {
                    const ledgers = accountingEntryService.getLedgersByHead(head.value, city)
                      .filter(l => !creditSearch || l.name.toLowerCase().includes(creditSearch.toLowerCase()));
                    if (ledgers.length === 0) return null;
                    return (
                      <optgroup key={head.value} label={`${head.label} (${head.nature})`}>
                        {ledgers.map(ledger => {
                          const bal = accountingEntryService.getLedgerBalance(ledger.id);
                          return (
                            <option key={ledger.id} value={ledger.id}>
                              {ledger.name} — ₹{(bal?.balance ?? 0).toLocaleString()} {bal.balanceType}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}
                </select>
                {creditAccount && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    ✓ Credit: {accountingEntryService.getLedgers(city).find(l => l.id === creditAccount)?.name}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Narration</label>
                <textarea
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  maxLength={200}
                  className="w-full border rounded px-3 py-2 h-20"
                  placeholder="Brief description of the transaction"
                />
                <p className="text-xs text-gray-500 mt-1">{narration.length}/200</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700"
          >
            Save & Post Entry
          </button>
        </div>
      )}
    </div>
  );
}
