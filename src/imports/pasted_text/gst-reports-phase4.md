Priority 7, 8, 9: Party-wise Filter + RCM Output/ITC + GSTR-3B (Points 7, 10, 11)

This is Phase 4 of 5.

CHANGE 1 — src/app/components/accounts/SalesSummaryReport.tsx — Add party-wise filter
Add these filter fields above the existing date range filter:
tsx  {/* Party / Customer filter */}
  <div>
    <label className="block text-xs font-medium mb-1">Party Name</label>
    <input type="text" placeholder="Search customer..."
      value={partySearch} onChange={e => setPartySearch(e.target.value)}
      className="w-full border rounded px-3 py-1.5 text-sm" />
    {/* Dropdown results from customer ledger master */}
    {partyResults.length > 0 && (
      <div className="absolute border bg-white rounded shadow-lg z-10 max-h-40 overflow-y-auto w-64">
        {partyResults.map(p => (
          <div key={p.id} className="px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
            onClick={() => { setSelectedParty(p); setPartySearch(p.name); setPartyResults([]); }}>
            {p.name}
          </div>
        ))}
      </div>
    )}
  </div>
  {/* Package type multi-select */}
  <div>
    <label className="block text-xs font-medium mb-1">Package Type</label>
    <div className="flex flex-wrap gap-1">
      {["2W","4W","2W+W+S","2W+W+W+S","Renewal"].map(pkg => (
        <button key={pkg}
          onClick={() => togglePackage(pkg)}
          className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
            selectedPackages.includes(pkg) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"
          }`}>{pkg}</button>
      ))}
    </div>
  </div>
When a party is selected, show a party-wise summary block below the table:
tsx  {selectedParty && (
    <div className="border rounded-xl p-4 bg-gray-50">
      <div className="font-semibold mb-2">Party: {selectedParty.name}</div>
      <div className="font-mono text-sm">
        {partyEntries.map(e => (
          <div key={e.id} className="flex justify-between py-0.5">
            <span className="text-gray-500">{e.date}</span>
            <span>{e.invoiceNumber}</span>
            <span>{e.packageName}</span>
            <span>₹{e.amount.toLocaleString("en-IN")}</span>
          </div>
        ))}
        <div className="border-t mt-2 pt-1 grid grid-cols-3 text-xs">
          <span>Total: ₹{partyTotal.toLocaleString()}</span>
          <span>Received: ₹{partyReceived.toLocaleString()}</span>
          <span className="text-red-600">Outstanding: ₹{(partyTotal-partyReceived).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )}
Apply same party-wise filter to PurchaseSummaryReport.tsx — shows all purchases from selected supplier with due dates and payment status.

CHANGE 2 — src/app/components/gst/GSTR3BModule.tsx — Full spec-compliant format
Rebuild to match the exact government GSTR-3B format from the spec.
Table 3.1 — Details of Outward Supplies (columns: Nature of Supply | Txbl. Value | IGST | CGST | State/UT Tax | Cess):
Row (a): Outward taxable supplies (other than zero rated, nil rated, exempt) — auto from transactions tagged supplyNature === "Taxable"
Row (b): Zero rated outward supplies — from supplyNature === "ZeroRated"
Row (c): Nil rated, exempt — from supplyNature === "NilRated" || "Exempt"
Row (d): Inward supplies liable to Reverse Charge — from RCM-tagged purchase transactions
Row (e): Non-GST outward supplies — from supplyNature === "NonGST"
Table 3.1.1 — E-Commerce Operator Supplies u/s 9(5) — two rows both showing dashes/zeros (not applicable for CleanCar).
Table 3.2 — Inter-State Supplies (state-wise breakdown for inter-state B2C):

Auto-populated from transactions where supplyType === "INTER_STATE" and customer has no GSTIN

Table 4 — Eligible ITC (matches spec rows A1 through A5 and B reversal):

A(5) "All other ITC" — from purchase transaction itcEligible === true
A(4) "Self-assessed tax on RCM" — from RCM transactions after payment tagged
B "ITC Reversed" — manual entry field
C "Net ITC" — calculated

Add RCM row to Output Tax Summary within Table 3.1(d) populated from purchase transactions tagged isRCM: true.
Add RCM section to ITC Register (new sub-section after regular ITC):
RCM ITC (paid & eligible)   IGST    CGST    SGST
                             X,XXX   X,XXX   X,XXX
Note: "Reverse Charge Tax Input not due" transfers to "Input Tax Credits" upon payment
Period selector: Month dropdown + Year — refreshes all table data.
Export PDF and Export Excel buttons at top right.
Comparison column toggle — shows previous month alongside current.

CHANGE 3 — src/app/components/gst/GSTTransactionEntry.tsx — Add RCM journal entry auto-generation
When formData.isRCM === true and the voucher is saved, auto-post the RCM journal entry using the pattern from the spec:
ts  // RCM Journal Entry (Intra-state example)
  // Expense Ledger Dr | CGST Input Dr | SGST Input Dr | CGST RCM Output Cr | SGST RCM Output Cr | Vendor Cr
  if (formData.isRCM) {
    accountingEntryService.createJournal({
      date: formData.invoiceDate,
      narration: `RCM — ${formData.partyName} — ${formData.invoiceNumber}`,
      lines: [
        { accountHead: expenseLedgerId,    accountLabel: expenseLedgerName,  debit: formData.taxableValue, credit: 0 },
        { accountHead: inputCGSTLedgerId,  accountLabel: "Input CGST",       debit: formData.cgst,         credit: 0 },
        { accountHead: inputSGSTLedgerId,  accountLabel: "Input SGST",       debit: formData.sgst,         credit: 0 },
        { accountHead: rcmOutputCGSTId,    accountLabel: "CGST RCM Output",  debit: 0, credit: formData.cgst },
        { accountHead: rcmOutputSGSTId,    accountLabel: "SGST RCM Output",  debit: 0, credit: formData.sgst },
        { accountHead: vendorLedgerId,     accountLabel: formData.partyName, debit: 0, credit: formData.taxableValue },
      ],
      city: cityInfo.displayName, cityId: city, createdBy: "GST Entry",
    }, cityInfo.displayName);
  }
Do not change any other file in Phase 4.