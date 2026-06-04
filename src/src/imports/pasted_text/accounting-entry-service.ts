This is Phase 1 of 3. Build only what is listed. Do not modify any existing component except the two nav changes at the end.

NEW FILE 1 — src/app/services/accountingEntryService.ts
This is the single source of truth for all accounting entries. Every component reads and writes through this service.
ts// ─── Constants ────────────────────────────────────────────────────────────────

export const GST_STATES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
  "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam",
  "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
  "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra",
  "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh (New)", "38": "Ladakh",
};

export const GST_STATE_OPTIONS = Object.entries(GST_STATES).map(([code, name]) => ({
  value: code,
  label: `${code} - ${name}`,
  code,
  name,
}));

export const CHART_OF_ACCOUNTS_HEADS = [
  { value: "fixed_assets",       label: "Fixed Assets",        nature: "asset" },
  { value: "current_asset",      label: "Current Asset",       nature: "asset" },
  { value: "loan_advance",       label: "Loan & Advance",      nature: "asset" },
  { value: "cash_bank",          label: "Cash & Bank",         nature: "asset" },
  { value: "capital",            label: "Capital",             nature: "liability" },
  { value: "secured_loan",       label: "Secured Loan",        nature: "liability" },
  { value: "unsecured_loan",     label: "Unsecured Loan",      nature: "liability" },
  { value: "current_liabilities",label: "Current Liabilities", nature: "liability" },
  { value: "sales",              label: "Sales",               nature: "income" },
  { value: "direct_income",      label: "Direct Income",       nature: "income" },
  { value: "indirect_income",    label: "Indirect Income",     nature: "income" },
  { value: "purchase",           label: "Purchase",            nature: "expense" },
  { value: "direct_expense",     label: "Direct Expense",      nature: "expense" },
  { value: "indirect_expenses",  label: "Indirect Expenses",   nature: "expense" },
] as const;

export type EntryType =
  | "Expense" | "Purchase" | "PurchaseReturn"
  | "Sales" | "SalesReturn" | "AssetPurchase";

export type GSTEntryType = "B2B" | "Unregistered" | "RCM" | "NonGST";

export type PaymentMode = "Bank" | "Cash" | "PettyCash";

export type VendorType = "GSTRegistered" | "NonRegistered" | "SEZ" | "Import";

export interface AccountingEntry {
  id: string;
  voucherNumber: string;          // Auto-generated e.g. EXP/SURAT/25-26/0001
  entryType: EntryType;
  date: string;
  vendorId?: string;
  vendorName?: string;
  vendorGstin?: string;
  vendorStateCode?: string;
  invoiceNumber: string;
  hsnSacCode?: string;
  expenseAccount?: string;        // Chart of accounts head
  expenseAccountLabel?: string;
  taxableValue: number;
  gstRate: number;                // 0, 5, 12, 18, 28
  gstEntryType: GSTEntryType;
  cgst: number;
  sgst: number;
  igst: number;
  totalBillValue: number;
  paymentMode: PaymentMode;
  pettyCashBranch?: string;       // Only if paymentMode = PettyCash
  isRCM: boolean;
  rcmCgst?: number;
  rcmSgst?: number;
  rcmIgst?: number;
  debitAccount: string;
  creditAccount: string;
  narration?: string;
  city: string;
  cityId: string;
  financialYear: string;          // "25-26"
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  changeHistory: ChangeLog[];
  status: "Draft" | "Posted" | "Cancelled";
}

export interface ChangeLog {
  timestamp: string;
  changedBy: string;
  field: string;
  previousValue: string;
  newValue: string;
}

export interface JournalEntry {
  id: string;
  voucherNumber: string;          // JV/CITY/FY/NNNN
  date: string;
  narration: string;
  lines: JournalLine[];
  city: string;
  cityId: string;
  financialYear: string;
  createdBy: string;
  createdAt: string;
  status: "Draft" | "Posted";
  changeHistory: ChangeLog[];
}

export interface JournalLine {
  accountHead: string;
  accountLabel: string;
  debit: number;
  credit: number;
  invoiceReference?: string;      // For adjustment against open invoice
}

// ─── Voucher Number Generator ────────────────────────────────────────────────

const ENTRY_TYPE_CODES: Record<EntryType, string> = {
  Expense: "EXP", Purchase: "PUR", PurchaseReturn: "PRN",
  Sales: "SAL", SalesReturn: "SRN", AssetPurchase: "AST",
};

function getFinancialYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`;
}

function generateVoucherNumber(
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

// ─── GST Calculation Engine ──────────────────────────────────────────────────

const COMPANY_STATE_CODE = "24"; // Gujarat — update this for each deployment city

export function calculateGST(
  taxableValue: number,
  gstRate: number,
  vendorStateCode: string,
  gstEntryType: GSTEntryType
): { cgst: number; sgst: number; igst: number; totalBillValue: number } {
  if (gstEntryType === "NonGST" || gstRate === 0) {
    return { cgst: 0, sgst: 0, igst: 0, totalBillValue: taxableValue };
  }
  const totalTax = Math.round(taxableValue * gstRate) / 100;
  const isSameState = vendorStateCode === COMPANY_STATE_CODE;
  if (isSameState) {
    const half = Math.round(totalTax * 50) / 100;
    return { cgst: half, sgst: half, igst: 0, totalBillValue: taxableValue + totalTax };
  }
  return { cgst: 0, sgst: 0, igst: totalTax, totalBillValue: taxableValue + totalTax };
}

export function validateGSTIN(gstin: string): { valid: boolean; stateCode: string; error?: string } {
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!pattern.test(gstin.trim().toUpperCase()))
    return { valid: false, stateCode: "", error: "Invalid GSTIN format" };
  const stateCode = gstin.substring(0, 2);
  return { valid: true, stateCode };
}

export function autoPostLedger(entry: AccountingEntry): JournalLine[] {
  return [
    { accountHead: entry.debitAccount,  accountLabel: entry.debitAccount,  debit: entry.totalBillValue, credit: 0 },
    { accountHead: entry.creditAccount, accountLabel: entry.creditAccount, debit: 0, credit: entry.totalBillValue },
  ];
}

// ─── Service Class ────────────────────────────────────────────────────────────

class AccountingEntryService {
  private readonly ENTRIES_KEY = "cleancar_accounting_entries";
  private readonly JOURNAL_KEY = "cleancar_journal_entries";

  private getEntries(): AccountingEntry[] {
    try { return JSON.parse(localStorage.getItem(this.ENTRIES_KEY) || "[]"); }
    catch { return []; }
  }
  private saveEntries(entries: AccountingEntry[]): void {
    localStorage.setItem(this.ENTRIES_KEY, JSON.stringify(entries));
  }
  private getJournals(): JournalEntry[] {
    try { return JSON.parse(localStorage.getItem(this.JOURNAL_KEY) || "[]"); }
    catch { return []; }
  }
  private saveJournals(journals: JournalEntry[]): void {
    localStorage.setItem(this.JOURNAL_KEY, JSON.stringify(journals));
  }

  createEntry(
    data: Omit<AccountingEntry, "id"|"voucherNumber"|"createdAt"|"status"|"changeHistory"|"financialYear">,
    cityName: string
  ): AccountingEntry {
    const all = this.getEntries();
    const entry: AccountingEntry = {
      ...data,
      id: `ACC-${Date.now()}`,
      voucherNumber: generateVoucherNumber(data.entryType, cityName, all),
      financialYear: getFinancialYear(),
      createdAt: new Date().toISOString(),
      status: "Posted",
      changeHistory: [],
    };
    this.saveEntries([...all, entry]);
    return entry;
  }

  updateEntry(id: string, changes: Partial<AccountingEntry>, changedBy: string): AccountingEntry | null {
    const all = this.getEntries();
    const idx = all.findIndex(e => e.id === id);
    if (idx < 0) return null;
    const old = all[idx];
    const log: ChangeLog[] = Object.keys(changes)
      .filter(k => (old as any)[k] !== (changes as any)[k])
      .map(field => ({
        timestamp: new Date().toISOString(), changedBy, field,
        previousValue: String((old as any)[field] ?? ""),
        newValue: String((changes as any)[field] ?? ""),
      }));
    const updated = { ...old, ...changes, updatedBy: changedBy, updatedAt: new Date().toISOString(), changeHistory: [...old.changeHistory, ...log] };
    all.splice(idx, 1, updated);
    this.saveEntries(all);
    return updated;
  }

  getAllEntries(cityId?: string): AccountingEntry[] {
    const all = this.getEntries();
    return cityId ? all.filter(e => e.cityId === cityId) : all;
  }
  getByType(type: EntryType, cityId?: string): AccountingEntry[] {
    return this.getAllEntries(cityId).filter(e => e.entryType === type);
  }
  getByDateRange(from: string, to: string, cityId?: string): AccountingEntry[] {
    return this.getAllEntries(cityId).filter(e => e.date >= from && e.date <= to);
  }
  getLedgerEntries(accountHead: string, cityId?: string): AccountingEntry[] {
    return this.getAllEntries(cityId).filter(
      e => e.debitAccount === accountHead || e.creditAccount === accountHead
    );
  }
  createJournal(data: Omit<JournalEntry,"id"|"voucherNumber"|"createdAt"|"status"|"changeHistory"|"financialYear">, cityName: string): JournalEntry {
    const all = this.getJournals();
    const entry: JournalEntry = {
      ...data, id: `JV-${Date.now()}`,
      voucherNumber: generateJournalVoucherNumber(cityName, all),
      financialYear: getFinancialYear(),
      createdAt: new Date().toISOString(),
      status: "Posted",
      changeHistory: [],
    };
    this.saveJournals([...all, entry]);
    return entry;
  }
  getAllJournals(cityId?: string): JournalEntry[] {
    const all = this.getJournals();
    return cityId ? all.filter(j => j.cityId === cityId) : all;
  }
}

export const accountingEntryService = new AccountingEntryService();

NEW FILE 2 — src/app/components/accounts/AccountingEntry.tsx
This replaces both ExpenseEntry.tsx and GSTTransactionEntry.tsx for accounting purposes. It is a single unified screen with tabs for each entry type.
Build this component with the following structure:
Page header: Title "Accounting Entry". Subtitle "All business transactions — expenses, purchases, sales, assets." On the right: a Quick Entry Mode toggle switch with label "Quick Mode."
Six tabs across the top: Expense | Purchase | Purchase Return | Sales | Sales Return | Asset Purchase. Active tab highlighted in blue. Each tab renders the same form layout below with the tab type pre-selected.
Quick Entry Mode (when toggle is ON): Show only 5 fields: Vendor (dropdown from gstComplianceService vendors), Amount (taxable value), GST Rate (dropdown), Payment Mode (Bank/Cash/Petty Cash), and Date. System auto-fills all other fields. Submit button: "Save Entry." Below the form show a live preview card: "Voucher: [auto-generated] | Total: ₹[calculated]."
Full Entry Form (when Quick Mode is OFF): Organised in 4 sections:
Section 1 — Voucher Details (grey background strip):

Voucher Number: auto-generated, read-only, monospace font, grey background — format EXP/SURAT/25-26/0001
Date: date picker, defaults to today
Financial Year: auto-derived, read-only

Section 2 — Party & Invoice:

Vendor/Customer: searchable dropdown. Shows name + GSTIN + state. "Add New" link at bottom of dropdown.
GSTIN: auto-filled when vendor selected, read-only. If no vendor selected: text input with inline validation. On blur: validate format, show green check or red error "Invalid GSTIN format." Auto-extract state code from first 2 chars.
Vendor/Customer State: dropdown using GST_STATE_OPTIONS format "24 - Gujarat". Auto-fills from GSTIN validation. Read-only if GSTIN filled, editable if GSTIN is blank.
Invoice / Reference Number: text input
HSN / SAC Code: text input, 4/6/8 digit validation

Section 3 — GST & Amount (blue-tinted background):

GST Entry Type: dropdown — B2B Registered | Unregistered | RCM (Reverse Charge) | Non-GST Expense. When "Non-GST Expense" selected: hide all GST fields below. When "RCM" selected: show amber banner "RCM selected — tax will be auto-posted as payable in your output liability."
Expense / Account Head: dropdown from CHART_OF_ACCOUNTS_HEADS with all 14 options grouped by nature (Asset / Liability / Income / Expense). No free text allowed.
Taxable Value: number input with ₹ prefix. On change: auto-calculate all GST fields.
GST Rate: dropdown — 0% / 5% / 12% / 18% / 28%. On change: auto-calculate.
CGST: auto-calculated, read-only, amber background. Shows "0" when IGST applies.
SGST: auto-calculated, read-only, amber background. Shows "0" when IGST applies.
IGST: auto-calculated, read-only, amber background. Shows "0" when CGST+SGST applies.
Total Bill Value: auto-calculated, bold, blue text. Read-only.
GST logic rule shown below the fields: "State 24 (Gujarat) → CGST + SGST | Other states → IGST" in small grey italic text.

Section 4 — Payment & Posting:

Payment Mode: segmented button — Bank | Cash | Petty Cash. When "Petty Cash" selected: show a "Branch" text input below.
Debit Account: auto-filled based on account head selected, but editable dropdown from Chart of Accounts.
Credit Account: auto-filled based on payment mode (Bank → Bank Account, Cash → Cash Account, Petty Cash → Petty Cash Account), editable.
Narration: textarea, 200 char limit.

Form footer: Full-width "Save & Post Entry" primary blue button. On save: call accountingEntryService.createEntry(), show green success toast with the generated voucher number: "Entry saved: EXP/SURAT/25-26/0001", reset form keeping the tab and date intact.
GST Validation before save: Before submission, check: (1) if GSTIN entered, validate format. (2) If state code in GSTIN doesn't match selected state — show blocking error "State code mismatch: GSTIN starts with [XX] but selected state is [YY - Name]." (3) If taxable value > 0 and GST rate > 0 and all tax fields are 0 — show error "GST calculation error. Please re-enter taxable value."

NEW FILE 3 — src/app/components/accounts/JournalEntry.tsx
Build a clean DR/CR journal entry screen.
Header: Title "Journal Entry." Subtitle "Manual debit-credit adjustments, salary entries, and invoice-wise settlements."
Voucher strip: Voucher Number (auto-generated JV/SURAT/25-26/0001, read-only). Date picker. Narration (text input, required).
Journal Lines table: Columns: Account Head | Debit (₹) | Credit (₹) | Invoice Reference (optional) | Remove. Start with 2 rows. "+ Add Line" button below. Validation: total debits must equal total credits — show live running totals below the table in bold. If unbalanced show red: "Unbalanced by ₹[X]." If balanced show green: "Balanced ✓."
Account Head: dropdown from CHART_OF_ACCOUNTS_HEADS — no free text.
Invoice Reference: when an expense/purchase account is selected, show a small "Adjust against open invoice" link. Clicking it opens a mini-popup listing open transactions for that account with their amounts and dates.
Save button: Disabled until balanced. Calls accountingEntryService.createJournal().

CHANGE 1 — src/app/config/navigationConfig.ts — Restructure Accounts nav
Find the entire Accounts nav section (starting with label: "Accounts", around line 224). Replace it with:
ts  {
    label: "Accounts",
    path: "/accounts",
    icon: BookOpen,
    module: "accounts",
    match: "prefix",
    description: "Accounting entries, ledger, and reports",
    children: [
      { label: "Dashboard",          path: "/accounts/dashboard",        icon: LayoutDashboard, module: "accounts", match: "exact" },
      { label: "Accounting Entry",   path: "/accounts/accounting-entry", icon: FileText,        module: "accounts", match: "prefix" },
      { label: "Journal Entry",      path: "/accounts/journal-entry",    icon: BookOpen,        module: "accounts", match: "prefix" },
      { label: "Transaction List",   path: "/accounts/transactions",     icon: List,            module: "accounts", match: "prefix" },
      { label: "Ledger",             path: "/accounts/ledger",           icon: BookUser,        module: "accounts", match: "prefix" },
      { label: "Trial Balance",      path: "/accounts/trial-balance",    icon: Scale,           module: "accounts", match: "prefix" },
      { label: "Vendor Master",      path: "/gst/vendors",               icon: Building2,       module: "accounts", match: "prefix" },
      { label: "Vendor Payment",     path: "/accounts/vendor-payment",   icon: Building,        module: "accounts", match: "prefix" },
      { label: "Payroll Processing", path: "/accounts/payroll-processing",icon: Calculator,     module: "accounts", match: "prefix" },
    ]
  },
Add these missing icons to the navigationConfig imports if not already present: BookOpen, List, Scale, LayoutDashboard.

CHANGE 2 — src/app/routes.tsx — Add new routes
Add these routes alongside the existing accounts routes (after line 342):
ts{ path: "accounts/accounting-entry", element: <AccountingEntry /> },
{ path: "accounts/journal-entry",    element: <JournalEntry /> },
{ path: "accounts/dashboard",        element: <AccountsDashboard /> },
{ path: "accounts/transactions",     element: <AccountingTransactionList /> },
{ path: "accounts/ledger",           element: <AccountsLedger /> },
{ path: "accounts/trial-balance",    element: <TrialBalance /> },
Add corresponding imports at the top of routes.tsx:
tsimport { AccountingEntry }           from "./components/accounts/AccountingEntry";
import { JournalEntry }              from "./components/accounts/JournalEntry";
import { AccountsDashboard }         from "./components/accounts/AccountsDashboard";
import { AccountingTransactionList } from "./components/accounts/AccountingTransactionList";
import { AccountsLedger }            from "./components/accounts/AccountsLedger";
import { TrialBalance }              from "./components/accounts/TrialBalance";
Do not delete any existing route. Do not modify any existing component in Phase 1.