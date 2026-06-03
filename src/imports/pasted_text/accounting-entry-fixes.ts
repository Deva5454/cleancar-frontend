 Critical: Ledger Entry Key Fix + debitAccount Normalization + Dashboard Cash

This is Phase 1 of 3. Fix only the 3 critical gaps.

CHANGE 1 — src/app/services/accountingEntryService.ts
1A — Fix getLedgerEntries to match by ledger ID, not account head. Find:
ts  getLedgerEntries(accountHead: string, cityId?: string): AccountingEntry[] {
    return this.getAllEntries(cityId).filter(
      e => e.debitAccount === accountHead || e.creditAccount === accountHead
    );
  }
Replace with:
ts  // Get entries where a specific LEDGER ID appears as debit or credit
  getLedgerEntries(ledgerId: string, cityId?: string): AccountingEntry[] {
    return this.getAllEntries(cityId).filter(
      e => e.debitAccount === ledgerId || e.creditAccount === ledgerId
    );
  }

  // Get entries by account HEAD (for grouping/reporting)
  getLedgerEntriesByHead(accountHead: string, cityId?: string): AccountingEntry[] {
    const ledgers = this.getLedgers(cityId).filter(l => l.accountHead === accountHead);
    const ledgerIds = new Set(ledgers.map(l => l.id));
    return this.getAllEntries(cityId).filter(
      e => ledgerIds.has(e.debitAccount) || ledgerIds.has(e.creditAccount)
    );
  }
1B — Fix duplicate voucher numbers by using a persistent counter. Find:
tsfunction generateVoucherNumber(
  entryType: EntryType, cityName: string, existingEntries: AccountingEntry[]
): string {
  const fy = getFinancialYear();
  const prefix = `${ENTRY_TYPE_CODES[entryType]}/${cityName.toUpperCase()}/${fy}`;
  const existing = existingEntries.filter(
    e => e.voucherNumber.startsWith(prefix)
  ).length;
  return `${prefix}/${String(existing + 1).padStart(4, "0")}`;
}

function generateJournalVoucherNumber(cityName: string, existing: JournalEntry[]): string {
  const fy = getFinancialYear();
  const prefix = `JV/${cityName.toUpperCase()}/${fy}`;
  return `${prefix}/${String(existing.length + 1).padStart(4, "0")}`;
}
Replace with:
tsfunction generateVoucherNumber(
  entryType: EntryType, cityName: string, existingEntries: AccountingEntry[]
): string {
  const fy = getFinancialYear();
  const prefix = `${ENTRY_TYPE_CODES[entryType]}/${cityName.toUpperCase()}/${fy}`;
  // Use max existing sequence number + 1, not count (safe against deletions and concurrent writes)
  const maxSeq = existingEntries
    .filter(e => e.voucherNumber.startsWith(prefix))
    .map(e => parseInt(e.voucherNumber.split("/").pop() || "0", 10))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefix}/${String(maxSeq + 1).padStart(4, "0")}`;
}

function generateJournalVoucherNumber(cityName: string, existing: JournalEntry[]): string {
  const fy = getFinancialYear();
  const prefix = `JV/${cityName.toUpperCase()}/${fy}`;
  const maxSeq = existing
    .filter(e => e.voucherNumber.startsWith(prefix))
    .map(e => parseInt(e.voucherNumber.split("/").pop() || "0", 10))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefix}/${String(maxSeq + 1).padStart(4, "0")}`;
}
1C — Fix ensureSystemLedgers hardcoded city: "Surat". Find the systemLedgers array inside ensureSystemLedgers. Every entry has city: "Surat". Replace city: "Surat" with a dynamic value in all entries:
Add at the top of the function:
ts  private ensureSystemLedgers(existing: LedgerMaster[], cityId: string): LedgerMaster[] {
    const cityDisplayName = cityId === "CITY-MUMBAI" ? "Mumbai"
      : cityId === "CITY-AHMEDABAD" ? "Ahmedabad"
      : "Surat"; // default
Then replace all city: "Surat" in the array with city: cityDisplayName.
1D — Fix COMPANY_STATE_CODE to be city-aware. Replace:
tsconst COMPANY_STATE_CODE = "24"; // Gujarat — update this for each deployment city
With:
tsconst CITY_STATE_CODES: Record<string, string> = {
  "CITY-SURAT":     "24", // Gujarat
  "CITY-MUMBAI":    "27", // Maharashtra
  "CITY-AHMEDABAD": "24", // Gujarat
};
const DEFAULT_STATE_CODE = "24";
Then update calculateGST to accept an optional companyCityId:
tsexport function calculateGST(
  taxableValue: number,
  gstRate: number,
  vendorStateCode: string,
  gstEntryType: GSTEntryType,
  companyCityId?: string
): { cgst: number; sgst: number; igst: number; totalBillValue: number } {
  if (gstEntryType === "NonGST" || gstRate === 0) {
    return { cgst: 0, sgst: 0, igst: 0, totalBillValue: taxableValue };
  }
  const companyStateCode = companyCityId
    ? (CITY_STATE_CODES[companyCityId] || DEFAULT_STATE_CODE)
    : DEFAULT_STATE_CODE;
  const totalTax = Math.round(taxableValue * gstRate) / 100;
  const isSameState = vendorStateCode === companyStateCode;
  if (isSameState) {
    const half = Math.round(totalTax * 50) / 100;
    return { cgst: half, sgst: half, igst: 0, totalBillValue: taxableValue + totalTax };
  }
  return { cgst: 0, sgst: 0, igst: totalTax, totalBillValue: taxableValue + totalTax };
}

CHANGE 2 — src/app/components/accounts/AccountingEntry.tsx
2A — Fix debitAccount to always store a ledger ID, never an account head string. Find:
ts  useEffect(() => {
    if (expenseAccount) {
      setDebitAccount(expenseAccount);
    }
  }, [expenseAccount]);
Replace with:
ts  useEffect(() => {
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
2B — Replace all alert() calls with toast. Add import { toast } from "sonner"; if not already present. Find and replace:

alert("Please fix GSTIN errors before submitting."); → toast.error("Please fix GSTIN errors before submitting."); return;
alert(\State code mismatch: GSTIN starts with ${gstinStateCode}...`);→toast.error(`State code mismatch: ...`); return;`
alert("GST calculation error. Please re-enter taxable value."); → toast.error("GST calculation error. Please re-enter taxable value."); return;
alert("Invoice number is required."); → toast.error("Invoice number is required."); return;
alert(\Entry saved: ${entry.voucherNumber}`);→toast.success(`Entry saved: ${entry.voucherNumber}`);`

2C — Pass cityId to calculateGST. Find:
ts      const result = calculateGST(taxableValue, gstRate, vendorStateCode, gstEntryType);
Replace with:
ts      const result = calculateGST(taxableValue, gstRate, vendorStateCode, gstEntryType, city);

CHANGE 3 — src/app/components/accounts/AccountsDashboard.tsx
Fix cash and bank balance calculation to use ledger IDs. Find:
ts  const cashBalance = entries
    .filter((e) => e.creditAccount === "cash_bank" && e.paymentMode === "Cash")
    .reduce((sum, e) => sum + e.totalBillValue, 0);

  const bankBalance = entries
    .filter((e) => e.creditAccount === "cash_bank" && e.paymentMode === "Bank")
    .reduce((sum, e) => sum + e.totalBillValue, 0);
Replace with:
ts  const pettyCashLedger = accountingEntryService.getLedgers(selectedCity)
    .find(l => l.name === "Petty Cash" && l.type === "other");
  const bankLedger = accountingEntryService.getLedgers(selectedCity)
    .find(l => l.name === "Axis Bank" && l.type === "bank");

  const cashBalance = pettyCashLedger
    ? (() => {
        const bal = accountingEntryService.getLedgerBalance(pettyCashLedger.id);
        return bal.balanceType === "Dr" ? bal.balance : -bal.balance;
      })()
    : 0;

  const bankBalance = bankLedger
    ? (() => {
        const bal = accountingEntryService.getLedgerBalance(bankLedger.id);
        return bal.balanceType === "Dr" ? bal.balance : -bal.balance;
      })()
    : 0;
Do not change any other file in Phase 1.