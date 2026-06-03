This is Phase 2 of 3. All Phase 1 files must exist first.

NEW FILE 4 — src/app/components/accounts/AccountsDashboard.tsx
Build a real-time financial dashboard at /accounts/dashboard.
Header: City filter (dropdown from CityContext). Date range filter (quick options: Today / This Week / This Month / This FY / Custom). Title "Accounts Dashboard." Subtitle shows selected period.
KPI cards row 1 (green family): Total Sales Today | Total Sales This Month — read from accountingEntryService.getByType("Sales") summing totalBillValue.
KPI cards row 2 (red family): Total Expenses Today | Total Expenses This Month — from getByType("Expense") + getByType("Purchase").
KPI cards row 3 (amber/purple):

GST Payable (Output Tax) — sum of cgst+sgst+igst from Sales entries
GST Input Credit — sum of cgst+sgst+igst from Purchase/Expense entries where not RCM
Net GST Payable — Output minus Input. Red if positive (you owe), green if negative (credit).
TDS Payable — static placeholder card with "₹0 — Configure TDS in settings" in grey
Advance Tax — static placeholder card

KPI cards row 4 (blue family):

Net Profit (Live) — (Sales + Direct Income) minus (Purchase + Direct Expense + Indirect Expense) — derived from all posted entries
Cash Balance — sum of entries where creditAccount = "Cash Account"
Bank Balance — sum of entries where creditAccount = "Bank Account"

Each card: white background, coloured left border, label small grey, value large bold, small subtitle showing the calculation basis.

NEW FILE 5 — src/app/components/accounts/AccountingTransactionList.tsx
The master transaction register — every saved entry appears here immediately after save.
Filter bar: Date From + Date To | Entry Type (All / Expense / Purchase / PurchaseReturn / Sales / SalesReturn / AssetPurchase) | GST Type | Payment Mode | Vendor search | Voucher number search | Amount range (min-max).
Table columns: Voucher No (monospace, blue link) | Date | Entry Type (badge) | Vendor/Customer | Invoice No | Taxable Value | CGST | SGST | IGST | Total | Payment Mode | Status | Actions (View / Edit / Audit Trail).
Data source: accountingEntryService.getAllEntries(city) — filtered by current city from useCity(). Re-fetches every time the component mounts (fixes the "transactions not visible" bug — always reads fresh from service, no stale state).
Export button: "Export" with dropdown — CSV | Excel | PDF. Uses downloadCSV() from gstExportUtils.ts.
Bulk upload button: "Upload CSV" opens a modal. Modal shows: (1) download template button, (2) file upload area, (3) after upload: validation table showing each row with a Pass/Fail status, (4) "Import Valid Rows Only" button. Required CSV columns: Vendor | GSTIN | Amount | GSTRate | Date | Type | InvoiceNo.
Clicking Voucher No opens a slide-over panel showing full entry details + auto-ledger posting + change history (audit trail).

NEW FILE 6 — src/app/components/accounts/AccountsLedger.tsx
Account-wise passbook in ledger format at /accounts/ledger.
Account selector: Dropdown of all accounts from Chart of Accounts + payment accounts (Bank, Cash, Petty Cash). Date range filter.
Passbook table: Columns: Date | Voucher No | Description | Debit (₹) | Credit (₹) | Closing Balance (₹). Opening balance row at top (bold, blue background). Running balance calculated row by row. Closing balance row at bottom (bold, green background). Debit amounts in red text. Credit amounts in green text.
Export: CSV and PDF via showExportMenu.

NEW FILE 7 — src/app/components/accounts/TrialBalance.tsx
Six-column trial balance at /accounts/trial-balance.
Period selector: Financial Year dropdown + As on Date.
Table — 6 columns per account:
Account | Opening Dr | Opening Cr | Transaction Dr | Transaction Cr | Closing Dr | Closing Cr
Group rows by account head category (Fixed Assets / Current Asset / etc.) with subtotal rows. Grand total row at bottom — must balance: Total Closing Dr = Total Closing Cr.
Imbalance warning: if totals don't match, show red banner: "Trial Balance is out of balance by ₹[X]. Check entries in [period]."
Export via showExportMenu.

CHANGE 1 — src/app/components/gst/GSTVendorMaster.tsx — Fix state field + vendor type
Fix 1 — State field: Find the state input field:
tsonChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
Replace the entire state input <Input> with a <Select> using GST_STATE_OPTIONS from accountingEntryService.ts:
tsximport { GST_STATE_OPTIONS } from "../../services/accountingEntryService";
// Replace the Input with:
<Select value={formData.stateCode} onValueChange={(val) =>
  setFormData(prev => ({ ...prev, stateCode: val, state: GST_STATES[val] || "" }))
}>
  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
  <SelectContent>
    {GST_STATE_OPTIONS.map(opt => (
      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
Fix 2 — Vendor type: Find the existing GST type dropdown in the vendor form. Replace its options with:
tsx<SelectItem value="GSTRegistered">GST Registered</SelectItem>
<SelectItem value="NonRegistered">Non-Registered</SelectItem>
<SelectItem value="SEZ">SEZ</SelectItem>
<SelectItem value="Import">Import</SelectItem>

CHANGE 2 — src/app/components/gst/GSTCustomerMaster.tsx — Fix state field
Same state field fix as GSTVendorMaster. Replace the state text input with the GST_STATE_OPTIONS dropdown. Auto-fill state when GSTIN is entered.

Do not create or modify any other file in Phase 2.