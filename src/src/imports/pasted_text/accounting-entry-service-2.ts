Priority 3 & 4: Ledger Master + Expense Voucher with Item Master (Points 3 & 6)

This is Phase 2 of 5. Build the complete Chart of Accounts from the spec and the Expense Voucher with Item Master.

CHANGE 1 — src/app/services/accountingEntryService.ts — Extend CHART_OF_ACCOUNTS_HEADS and seed all ledgers
1A — Replace CHART_OF_ACCOUNTS_HEADS with the full spec list. Find the existing array and replace entirely:
tsexport const CHART_OF_ACCOUNTS_HEADS = [
  // ASSETS
  { value: "fixed_assets",        label: "Fixed Assets",             nature: "asset" },
  { value: "cash_bank",           label: "Cash & Bank",              nature: "asset" },
  { value: "current_assets",      label: "Current Assets",           nature: "asset" },
  { value: "accounts_receivable", label: "Accounts Receivable",      nature: "asset" },
  { value: "gst_input",           label: "GST Input (ITC)",          nature: "asset" },
  // LIABILITIES
  { value: "equity",              label: "Capital & Equity",         nature: "liability" },
  { value: "duties_taxes",        label: "Duties & Taxes",           nature: "liability" },
  { value: "credit_cards",        label: "Credit Cards",             nature: "liability" },
  { value: "non_current_liab",    label: "Non-Current Liabilities",  nature: "liability" },
  { value: "other_liabilities",   label: "Other Liabilities",        nature: "liability" },
  { value: "accounts_payable",    label: "Accounts Payable",         nature: "liability" },
  // INCOME
  { value: "sales_subscription",  label: "Sales — Subscription",     nature: "income" },
  { value: "sales_service",       label: "Sales — Service",          nature: "income" },
  { value: "sales_renewal",       label: "Sales — Renewal",          nature: "income" },
  { value: "other_income",        label: "Other Income",             nature: "income" },
  // EXPENSES
  { value: "cogs",                label: "Cost of Goods Sold",       nature: "expense" },
  { value: "direct_expenses",     label: "Direct Expenses",          nature: "expense" },
  { value: "indirect_expenses",   label: "Indirect Expenses",        nature: "expense" },
  { value: "depreciation",        label: "Depreciation",             nature: "expense" },
  { value: "tds_payable",         label: "TDS Payable",              nature: "liability" },
] as const;
1B — Add ItemMaster interface and service to accountingEntryService.ts:
tsexport interface ItemMaster {
  id: string;
  itemName: string;
  hsnCode: string;
  defaultExpenseLedgerId: string;
  defaultExpenseLedgerName: string;
  defaultGSTRate: 0 | 5 | 12 | 18 | 28 | 40;
  unitOfMeasure?: string;
  description?: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface TDSConfig {
  section: string;       // "194J", "194C", etc.
  nature: string;        // "Professional Fees", "Contractor"
  rateIndividual: number;
  rateCompany: number;
  thresholdSingle?: number;
  thresholdAnnual?: number;
}

export const TDS_RATE_CHART: TDSConfig[] = [
  { section: "192",  nature: "Salary",                   rateIndividual: 0,   rateCompany: 0,   thresholdAnnual: 250000 },
  { section: "194A", nature: "Interest Payment",         rateIndividual: 10,  rateCompany: 10,  thresholdAnnual: 10000 },
  { section: "194C", nature: "Contractor",               rateIndividual: 1,   rateCompany: 2,   thresholdSingle: 30000, thresholdAnnual: 100000 },
  { section: "194I", nature: "Rent (Land/Building)",     rateIndividual: 10,  rateCompany: 10,  thresholdSingle: 50000, thresholdAnnual: 600000 },
  { section: "194I(a)", nature: "Rent (Plant/Machinery)",rateIndividual: 2,   rateCompany: 2,   thresholdSingle: 50000, thresholdAnnual: 600000 },
  { section: "194J", nature: "Professional Fees",        rateIndividual: 10,  rateCompany: 10,  thresholdSingle: 50000 },
  { section: "194J(b)", nature: "Technical Fees",        rateIndividual: 2,   rateCompany: 2,   thresholdSingle: 50000 },
  { section: "194H", nature: "Commission/Brokerage",     rateIndividual: 2,   rateCompany: 2,   thresholdAnnual: 20000 },
  { section: "194Q", nature: "Purchase of Goods",        rateIndividual: 0.1, rateCompany: 0.1, thresholdAnnual: 5000000 },
  { section: "194B", nature: "Lottery/Gambling",         rateIndividual: 30,  rateCompany: 30,  thresholdSingle: 10000 },
];
Add Item Master CRUD methods inside the class:
ts  private readonly ITEM_KEY = "ITEM_MASTER";

  getItems(): ItemMaster[] {
    return JSON.parse(localStorage.getItem(this.ITEM_KEY) || "[]");
  }

  saveItem(item: ItemMaster): void {
    const all = this.getItems().filter(i => i.id !== item.id);
    localStorage.setItem(this.ITEM_KEY, JSON.stringify([...all, item]));
  }

  deleteItem(id: string): void {
    localStorage.setItem(this.ITEM_KEY, JSON.stringify(this.getItems().filter(i => i.id !== id)));
  }
1C — Seed all 60+ ledgers from the spec in ensureSystemLedgers. Add these to the systemLedgers array (replace the existing partial list with the full list from the spec document, Section 3.1):
Assets to add: "Prepaid Expenses", "TDS Receivable", "Employee Advance", "Reverse Charge Tax Input not due", "Input Tax Credits", "Input IGST", "Input CGST", "Input SGST", "Advance Tax", "Undeposited Funds", "Petty Cash", "Axis Bank", "HDFC - 906", "Accounts Receivable", "Furniture and Equipment", "WFH Table"
Liabilities to add: "TDS Payable", "Intermediate TDS Payable", "Employee Reimbursements", "GST Payable", "Output IGST", "Output CGST", "Output SGST", "Unearned Revenue", "Tax Payable", "One Card 5447", "ICICI 9004", "ICICI 4002 (Rupay)", "HDFC 6543", "Accounts Payable", "Mortgages", "Construction Loans", "CGST RCM Output", "SGST RCM Output"
Income: "Subscription - 2W", "Subscription - 4W", "Subscription - 2W+W+S", "Subscription - 2W+W+W+S", "One-time Service", "Renewal Fees", "General Income", "Interest Income", "Late Fee", "Discount"
Expenses: Every expense ledger listed in Section 3.1 of the spec including "Labor", "Materials", "Subcontractor", "Salaries and Employee Wages", "Raw Materials And Consumables", "Depreciation Expense", "Transaction Charges (Razorpay)", "Bank Fees and Charges", etc.
Map each ledger to the correct accountHead value from the updated CHART_OF_ACCOUNTS_HEADS.

NEW FILE — src/app/components/accounts/ItemMaster.tsx
Item Master CRUD screen at /accounts/item-master. Follows the exact same layout pattern as LedgerMaster.tsx.
Header: Title "Item Master". Subtitle "Manage items with HSN codes for expense vouchers."
KPI strip (3 cards): Total Items | Active | HSN Codes Mapped.
Table columns: Item Name | HSN Code | Default Expense Ledger | GST Rate | UOM | Status | Actions (Edit / Delete).
"+ Add Item" button opens a slide-in panel with fields:

Item Name (text, required)
HSN Code (text, 6 digits, required)
Default Expense Ledger (searchable select from accountingEntryService.getLedgersByHead for expense heads)
Default GST Rate (select: 0% / 5% / 12% / 18% / 28% / 40%)
Unit of Measure (text, optional — e.g. Litre, Kg, Piece, Box)
Description (text, optional)

On save: call accountingEntryService.saveItem().
Pre-seed these items on mount if empty:
tsconst SEED_ITEMS: Omit<ItemMaster, "id"|"createdAt">[] = [
  { itemName: "Car Wash Shampoo 5L",  hsnCode: "340290", defaultExpenseLedgerName: "Raw Materials And Consumables", defaultGSTRate: 18, unitOfMeasure: "Litre",  status: "Active", defaultExpenseLedgerId: "" },
  { itemName: "Microfiber Cloth",      hsnCode: "630790", defaultExpenseLedgerName: "Raw Materials And Consumables", defaultGSTRate: 5,  unitOfMeasure: "Piece",  status: "Active", defaultExpenseLedgerId: "" },
  { itemName: "Tyre Shine 500ml",      hsnCode: "340290", defaultExpenseLedgerName: "Raw Materials And Consumables", defaultGSTRate: 18, unitOfMeasure: "Bottle", status: "Active", defaultExpenseLedgerId: "" },
  { itemName: "Professional Fees",     hsnCode: "999299", defaultExpenseLedgerName: "Consultant Expense",           defaultGSTRate: 18, unitOfMeasure: "Service",status: "Active", defaultExpenseLedgerId: "" },
  { itemName: "Office Electricity",    hsnCode: "271600", defaultExpenseLedgerName: "Electricity Expense",          defaultGSTRate: 18, unitOfMeasure: "Unit",   status: "Active", defaultExpenseLedgerId: "" },
  { itemName: "Rent - Office Space",   hsnCode: "997212", defaultExpenseLedgerName: "Rent Expense",                 defaultGSTRate: 18, unitOfMeasure: "Month",  status: "Active", defaultExpenseLedgerId: "" },
];

NEW FILE — src/app/components/accounts/ExpenseVoucher.tsx
Full expense voucher screen replacing ExpenseEntry.tsx. At /accounts/expense-voucher.
Header: "Expense Voucher" with voucher number auto-generated (format: EXP/SUR/25-26/0001).
Form fields in this exact order:

Date — date picker, defaults to today
Vendor — searchable select from accountingEntryService.getLedgersByHead("accounts_payable") + getLedgersByHead("other_liabilities")
Item — searchable select from accountingEntryService.getItems(). On selection auto-fills: Expense Ledger, HSN Code, GST Rate
HSN Code — read-only, auto-filled from item
Expense Ledger — auto-filled from item, editable select
Quantity — number input
Unit Price (₹) — number input
Total Amount — read-only, Qty × Unit Price
GST Rate — auto-filled from item, editable select (0/5/12/18/28/40%)
Supply Type — auto-derived from vendor state (Intra / Inter)
CGST Amount — read-only, auto-calculated
SGST Amount — read-only, auto-calculated
IGST Amount — read-only, auto-calculated
Grand Total — read-only, Amount + GST
TDS Section — dropdown from TDS_RATE_CHART (appears if expense head is eligible). Show: "194J — Professional Fees (10%)"
TDS Amount — read-only, auto-calculated: TotalAmount × rate/100
Payment Mode — select: Cash / Bank / Credit (Partial) / Credit (Full)
Amount Paid Now — number input (appears for Cash/Bank/Partial). Pre-fills to Grand Total for Cash/Bank.
Creditor Ledger — select (appears only for Credit/Partial modes)
Due Date — date picker (appears only if balance pending)
Narration — text input, optional

Auto journal entry preview panel (shows live as fields are filled):
For Full Cash/Bank payment:
[Expense Ledger]    Dr   ₹[amount]
Input CGST          Dr   ₹[cgst]
Input SGST          Dr   ₹[sgst]
    To [Vendor]     Cr   ₹[grand total]
── 2nd entry (auto-posted) ──
[Vendor]            Dr   ₹[grand total]
    To Axis Bank    Cr   ₹[grand total]
For Credit (Full):
[Expense Ledger]    Dr   ₹[amount]
Input CGST          Dr   ₹[cgst]
Input SGST          Dr   ₹[sgst]
    To [Vendor]     Cr   ₹[grand total]
(Due: [due date] — recorded on creditor ledger)
For Partial:
[Expense Ledger]    Dr   ₹[amount]
Input CGST          Dr   ₹[cgst]
Input SGST          Dr   ₹[sgst]
    To Axis Bank    Cr   ₹[paid now]
    To [Vendor]     Cr   ₹[balance]
If TDS applicable:
[Expense Ledger]    Dr   ₹[amount]
    To [Vendor]     Cr   ₹[amount - TDS]
    To TDS Payable (194J)  Cr  ₹[TDS amount]
On Submit: Call accountingEntryService.createJournal() for the correct journal entries based on payment mode. For TDS, post a second journal entry. Show voucher number in success toast.
Add nav entry in navigationConfig.ts under Accounts children:
ts{ label: "Expense Voucher", path: "/accounts/expense-voucher", icon: Receipt, module: "accounts", match: "prefix" },
{ label: "Item Master",     path: "/accounts/item-master",     icon: Package,  module: "accounts", match: "prefix" },
Add routes in routes.tsx:
tsimport { ExpenseVoucher } from "./components/accounts/ExpenseVoucher";
import { ItemMaster }     from "./components/accounts/ItemMaster";
{ path: "accounts/expense-voucher", element: <ExpenseVoucher /> },
{ path: "accounts/item-master",     element: <ItemMaster /> },
Do not change any other file in Phase 2.