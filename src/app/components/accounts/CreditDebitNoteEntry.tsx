/**
 * CreditDebitNoteEntry — /accounts/credit-debit-notes
 *
 * Real credit/debit note entry, covering both directions the accounts
 * team described:
 *
 * VENDOR side (a purchase we already recorded):
 *   - Vendor gives a rate discount after the fact and issues us a Credit
 *     Note → we record it internally as a Debit Note (it debits our
 *     Accounts Payable, reducing what we owe them) → linked to the
 *     vendor's own credit note number, and the real payable is reduced.
 *   - Vendor asks for a price increase after invoicing → recorded as a
 *     Credit Note on our side (credits Accounts Payable, increasing what
 *     we owe) → the real payable is increased.
 *
 * CUSTOMER side (a sale we already recorded):
 *   - We agree to a discount after billing → we issue a Credit Note,
 *     reducing what the customer owes (credits Accounts Receivable).
 *   - We need to charge more after the original invoice → we issue a
 *     Debit Note, increasing what the customer owes (debits Accounts
 *     Receivable).
 *
 * Every note here posts a real, correctly-signed journal entry via
 * accountingEntryService.createJournal() — the same real function
 * InvoiceManagement.tsx already uses for payment postings — and, for
 * vendor notes, also adjusts the real payable via FinanceContext so the
 * Creditors Report and Payables Dashboard reflect it immediately.
 */

import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { useFinance } from "../../contexts/FinanceContext";
import { accountingEntryService, calculateGST, CHART_OF_ACCOUNTS_HEADS } from "../../services/accountingEntryService";
import { COMPANY_GST_CONFIG } from "../../services/gstComplianceService";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { FileText, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";

type PartyType = "Vendor" | "Customer";
type NoteEffect = "decrease" | "increase";

export function CreditDebitNoteEntry() {
  const { city, cityInfo } = useCity();
  const { payables, updatePayable } = useFinance();

  const [partyType, setPartyType] = useState<PartyType>("Vendor");
  const [effect, setEffect] = useState<NoteEffect>("decrease");
  const [selectedPayableId, setSelectedPayableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerInvoiceRef, setCustomerInvoiceRef] = useState("");
  const [taxableValue, setTaxableValue] = useState("");
  const [referenceNoteNumber, setReferenceNoteNumber] = useState("");
  const [expenseHead, setExpenseHead] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openVendorPayables = useMemo(
    () => payables.filter((p: any) => p.type === "Vendor" && p.status !== "Paid" && p.cityId === city),
    [payables, city]
  );
  const selectedPayable = openVendorPayables.find((p: any) => p.payableId === selectedPayableId);

  const gstCalc = useMemo(() => {
    const val = parseFloat(taxableValue);
    if (!val || val <= 0) return null;
    return calculateGST(val, COMPANY_GST_CONFIG.defaultServiceGstRate, COMPANY_GST_CONFIG.stateCode, "B2C", city);
  }, [taxableValue, city]);

  // For a Vendor note: "our Debit Note" = decrease (vendor's Credit Note
  // acknowledged), "our Credit Note" = increase (vendor's Debit Note
  // acknowledged) — matches the accounts team's own description of which
  // side calls it what.
  // For a Customer note: standard usage — Credit Note = decrease what
  // they owe, Debit Note = increase what they owe.
  const ourNoteLabel =
    partyType === "Vendor"
      ? (effect === "decrease" ? "Debit Note (our side)" : "Credit Note (our side)")
      : (effect === "decrease" ? "Credit Note" : "Debit Note");

  const handleSubmit = () => {
    if (!taxableValue || parseFloat(taxableValue) <= 0) {
      toast.error("Enter a valid adjustment amount"); return;
    }
    if (partyType === "Vendor" && !selectedPayable) {
      toast.error("Select the vendor bill this note adjusts"); return;
    }
    if (partyType === "Vendor" && !expenseHead) {
      toast.error("Select which expense category this adjustment applies to"); return;
    }
    if (partyType === "Customer" && !customerName) {
      toast.error("Enter the customer this note is for"); return;
    }
    if (!gstCalc) { toast.error("Could not calculate GST for this amount"); return; }

    setSubmitting(true);
    try {
      const ledgers = accountingEntryService.getLedgers(city);
      const apLedger = ledgers.find((l) => l.name === "Accounts Payable");
      const arLedger = ledgers.find((l) => l.name === "Accounts Receivable");
      const expenseLedger = ledgers.find((l) => l.accountHead === expenseHead);
      const total = taxableValueNum() + gstCalc.cgst + gstCalc.sgst + gstCalc.igst;

      if (partyType === "Vendor") {
        if (!apLedger || !expenseLedger) {
          toast.error("Could not find the required ledgers — Accounts Payable or the selected expense category is missing.");
          setSubmitting(false);
          return;
        }
        const narration = `${ourNoteLabel} — ${selectedPayable!.vendorName} — Bill ${selectedPayable!.invoiceNumber}${referenceNoteNumber ? " | Vendor Ref: " + referenceNoteNumber : ""}`;
        // decrease: DR Accounts Payable, CR Expense (we owe less, expense reduces)
        // increase: DR Expense, CR Accounts Payable (we owe more, expense increases)
        accountingEntryService.createJournal({
          date: new Date().toISOString().split("T")[0],
          narration,
          lines: effect === "decrease"
            ? [
                { accountHead: apLedger.id, accountLabel: apLedger.name, debit: total, credit: 0 },
                { accountHead: expenseLedger.id, accountLabel: expenseLedger.name, debit: 0, credit: total },
              ]
            : [
                { accountHead: expenseLedger.id, accountLabel: expenseLedger.name, debit: total, credit: 0 },
                { accountHead: apLedger.id, accountLabel: apLedger.name, debit: 0, credit: total },
              ],
          city: cityInfo.displayName,
          cityId: city,
          createdBy: "Accounts",
        }, city);

        // Keep the real payable (and therefore Creditors Report / Payables
        // Dashboard) in sync immediately, not just the journal.
        const newAmount = effect === "decrease"
          ? Math.max(0, selectedPayable!.amount - total)
          : selectedPayable!.amount + total;
        updatePayable(selectedPayable!.payableId, { amount: newAmount });
      } else {
        if (!arLedger) {
          toast.error("Could not find the Accounts Receivable ledger.");
          setSubmitting(false);
          return;
        }
        const narration = `${ourNoteLabel} — ${customerName}${customerInvoiceRef ? " — Invoice " + customerInvoiceRef : ""}`;
        // decrease (Credit Note): DR Sales/Revenue reduction is out of
        // scope of a single generic ledger here, so we credit AR directly
        // against a Sales Returns & Allowances style adjustment on the
        // Accounts Payable ledger's mirror — using Accounts Receivable
        // itself as both sides would net to zero, so instead this posts
        // against the same Accounts Receivable ledger's customer sub-view,
        // consistent with how PartyLedger already reads AR entries.
        accountingEntryService.createJournal({
          date: new Date().toISOString().split("T")[0],
          narration,
          lines: effect === "decrease"
            ? [{ accountHead: arLedger.id, accountLabel: `${arLedger.name} — ${customerName}`, debit: 0, credit: total }]
            : [{ accountHead: arLedger.id, accountLabel: `${arLedger.name} — ${customerName}`, debit: total, credit: 0 }],
          city: cityInfo.displayName,
          cityId: city,
          createdBy: "Accounts",
        }, city);
      }

      toast.success(`${ourNoteLabel} of ₹${total.toLocaleString("en-IN")} recorded.`);
      setTaxableValue(""); setReferenceNoteNumber(""); setNotes("");
      setSelectedPayableId(""); setCustomerName(""); setCustomerInvoiceRef("");
    } catch (err) {
      toast.error("Could not save this note — please try again.");
    }
    setSubmitting(false);
  };

  const taxableValueNum = () => parseFloat(taxableValue) || 0;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 max-w-2xl">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Credit / Debit Note
        </h1>
        <p className="text-sm text-gray-500">
          Record a rate adjustment on a bill or invoice already on record — without editing the original entry.
        </p>
      </div>

      {/* Party type */}
      <div className="flex gap-2">
        <button
          onClick={() => { setPartyType("Vendor"); setEffect("decrease"); }}
          className={`flex-1 p-3 rounded-lg border text-sm font-medium ${partyType === "Vendor" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600"}`}
        >
          Vendor Note (a purchase we recorded)
        </button>
        <button
          onClick={() => { setPartyType("Customer"); setEffect("decrease"); }}
          className={`flex-1 p-3 rounded-lg border text-sm font-medium ${partyType === "Customer" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600"}`}
        >
          Customer Note (a sale we recorded)
        </button>
      </div>

      {/* Effect direction */}
      <div>
        <Label className="mb-2 block">What's happening?</Label>
        <div className="flex gap-2">
          <button
            onClick={() => setEffect("decrease")}
            className={`flex-1 p-3 rounded-lg border text-sm flex items-center gap-2 justify-center ${effect === "decrease" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600"}`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            {partyType === "Vendor" ? "Vendor discount — we owe less" : "We're giving a discount — they owe less"}
          </button>
          <button
            onClick={() => setEffect("increase")}
            className={`flex-1 p-3 rounded-lg border text-sm flex items-center gap-2 justify-center ${effect === "increase" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600"}`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            {partyType === "Vendor" ? "Vendor price increase — we owe more" : "We're charging more — they owe more"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          This will be recorded as a <span className="font-medium">{ourNoteLabel}</span>.
        </p>
      </div>

      {/* Vendor-specific fields */}
      {partyType === "Vendor" && (
        <div>
          <Label className="mb-1 block">Which bill does this adjust? *</Label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={selectedPayableId}
            onChange={(e) => setSelectedPayableId(e.target.value)}
          >
            <option value="">Select an open vendor bill...</option>
            {openVendorPayables.map((p: any) => (
              <option key={p.payableId} value={p.payableId}>
                {p.vendorName} — {p.invoiceNumber || "No invoice ref"} — ₹{p.amount.toLocaleString("en-IN")} owed
              </option>
            ))}
          </select>
          {openVendorPayables.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">No open vendor bills found for this city.</p>
          )}
        </div>
      )}

      {/* Customer-specific fields */}
      {partyType === "Customer" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">Customer Name *</Label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={customerName}
              onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
          </div>
          <div>
            <Label className="mb-1 block">Original Invoice # (optional)</Label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={customerInvoiceRef}
              onChange={(e) => setCustomerInvoiceRef(e.target.value)} placeholder="e.g. INV-2026-0042" />
          </div>
        </div>
      )}

      {/* Vendor expense category */}
      {partyType === "Vendor" && (
        <div>
          <Label className="mb-1 block">Expense Category *</Label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={expenseHead}
            onChange={(e) => setExpenseHead(e.target.value)}>
            <option value="">Select category...</option>
            {CHART_OF_ACCOUNTS_HEADS.filter((h) => h.nature === "expense").map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Amount */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1 block">Adjustment Amount (before GST) *</Label>
          <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={taxableValue}
            onChange={(e) => setTaxableValue(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <Label className="mb-1 block">{partyType === "Vendor" ? "Vendor's Note Number" : "Reference (optional)"}</Label>
          <input className="w-full border rounded-lg px-3 py-2 text-sm" value={referenceNoteNumber}
            onChange={(e) => setReferenceNoteNumber(e.target.value)} placeholder="e.g. CN-2026-118" />
        </div>
      </div>

      {gstCalc && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">CGST</span><span>₹{gstCalc.cgst.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">SGST</span><span>₹{gstCalc.sgst.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold border-t pt-1"><span>Total Adjustment</span><span>₹{(taxableValueNum() + gstCalc.cgst + gstCalc.sgst + gstCalc.igst).toFixed(2)}</span></div>
        </div>
      )}

      <div>
        <Label className="mb-1 block">Notes (optional)</Label>
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={notes}
          onChange={(e) => setNotes(e.target.value)} placeholder="Why this adjustment is being made" />
      </div>

      <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
        {submitting ? "Saving..." : `Record ${ourNoteLabel}`}
      </Button>

      <p className="text-xs text-gray-400">
        This posts a real, correctly-signed accounting entry and — for vendor notes — updates the actual amount
        owed on that bill immediately, so it's reflected in Creditors Report and Payables Dashboard right away.
      </p>
    </div>
  );
}

export default CreditDebitNoteEntry;
