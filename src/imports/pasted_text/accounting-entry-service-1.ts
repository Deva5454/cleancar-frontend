This is Phase 1 of 3. Build only what is listed. The document describes a double-entry accounting system where every customer is a debtor ledger, Razorpay is a creditor/transit ledger, each subscription package has its own sales ledger, and bank is a separate ledger. All of this must be added on top of the existing accountingEntryService.ts and accounts components.

CHANGE 1 — src/app/services/accountingEntryService.ts
1A — Extend CHART_OF_ACCOUNTS_HEADS to include all heads required by this document. Find the existing array and add these entries at the end:
ts{ value: "debtors",            label: "Debtors (Customers)",  nature: "asset" },
{ value: "creditors",          label: "Creditors",            nature: "liability" },
{ value: "bank",               label: "Bank Account",         nature: "asset" },
{ value: "petty_cash",         label: "Petty Cash",           nature: "asset" },
{ value: "payment_gateway",    label: "Payment Gateway",      nature: "asset" },
{ value: "transaction_charges",label: "Transaction Charges",  nature: "expense" },
{ value: "gst_input",          label: "GST Input (IGST)",     nature: "asset" },
{ value: "sales_subscription", label: "Sales — Subscription", nature: "income" },
1B — Add LedgerMaster interface and service methods. A Ledger Master is a named account (e.g. "Axis Bank", "Customer A1", "Razorpay") mapped to an account head. Add below the existing interfaces:
tsexport interface LedgerMaster {
  id: string;
  name: string;                        // "Axis Bank", "Razorpay", "Customer A1"
  accountHead: string;                 // value from CHART_OF_ACCOUNTS_HEADS
  accountHeadLabel: string;
  nature: "asset" | "liability" | "income" | "expense";
  type: "bank" | "customer" | "vendor" | "payment_gateway" | "sales" | "expense" | "other";
  openingBalance: number;
  openingBalanceType: "Dr" | "Cr";
  gstin?: string;                      // For vendor/customer ledgers
  mobile?: string;
  email?: string;
  city: string;
  cityId: string;
  isSystem: boolean;                   // System ledgers cannot be deleted
  createdAt: string;
  status: "Active" | "Inactive";

  // Subscription-package ledgers only
  packageCode?: string;               // "2W" | "4W" | "2W_WASH_SANITIZE" etc.

  // Customer-debtor ledgers only
  customerId?: string;
  customerName?: string;
  subscriptionPlan?: string;
}

export interface LedgerBalance {
  ledgerId: string;
  ledgerName: string;
  accountHead: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  balanceType: "Dr" | "Cr";
}
1C — Add Ledger Master CRUD to AccountingEntryService class. Add these methods inside the existing class:
ts  private readonly LEDGER_KEY = "cleancar_ledger_masters";

  getLedgers(cityId?: string): LedgerMaster[] {
    const all: LedgerMaster[] = JSON.parse(localStorage.getItem(this.LEDGER_KEY) || "[]");
    // Ensure system ledgers always exist
    const withSystem = this.ensureSystemLedgers(all, cityId || "CITY-SURAT");
    return cityId ? withSystem.filter(l => l.cityId === cityId || l.isSystem) : withSystem;
  }

  private ensureSystemLedgers(existing: LedgerMaster[], cityId: string): LedgerMaster[] {
    const systemLedgers: Omit<LedgerMaster, "id">[] = [
      { name: "Axis Bank",        accountHead: "bank",               accountHeadLabel: "Bank Account",         nature: "asset",     type: "bank",            openingBalance: 0, openingBalanceType: "Dr", city: "Surat", cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Petty Cash",       accountHead: "petty_cash",         accountHeadLabel: "Petty Cash",           nature: "asset",     type: "other",           openingBalance: 0, openingBalanceType: "Dr", city: "Surat", cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Razorpay",         accountHead: "payment_gateway",    accountHeadLabel: "Payment Gateway",      nature: "asset",     type: "payment_gateway", openingBalance: 0, openingBalanceType: "Dr", city: "Surat", cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Razorpay Charges", accountHead: "creditors",          accountHeadLabel: "Creditors",            nature: "liability", type: "vendor",          openingBalance: 0, openingBalanceType: "Cr", city: "Surat", cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Transaction Charges (Expense)", accountHead: "transaction_charges", accountHeadLabel: "Transaction Charges", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: "Surat", cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "IGST Payable",     accountHead: "gst_input",          accountHeadLabel: "GST Input",            nature: "asset",     type: "other",           openingBalance: 0, openingBalanceType: "Dr", city: "Surat", cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      // Subscription package sales ledgers
      { name: "Sales — 2W (Two Wheeler)", accountHead: "sales_subscription", accountHeadLabel: "Sales — Subscription", nature: "income", type: "sales", packageCode: "2W", openingBalance: 0, openingBalanceType: "Cr", city: "Surat", cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Sales — 4W (Four Wheeler)", accountHead: "sales_subscription", accountHeadLabel: "Sales — Subscription", nature: "income", type: "sales", packageCode: "4W", openingBalance: 0, openingBalanceType: "Cr", city: "Surat", cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Sales — 2W + Wash + Sanitize", accountHead: "sales_subscription", accountHeadLabel: "Sales — Subscription", nature: "income", type: "sales", packageCode: "2W_WASH_SANITIZE", openingBalance: 0, openingBalanceType: "Cr", city: "Surat", cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Sales — 2W + Wash + Wash + Sanitize", accountHead: "sales_subscription", accountHeadLabel: "Sales — Subscription", nature: "income", type: "sales", packageCode: "2W_WASH_WASH_SANITIZE", openingBalance: 0, openingBalanceType: "Cr", city: "Surat", cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
    ];

    let updated = [...existing];
    let changed = false;
    for (const sl of systemLedgers) {
      const exists = existing.find(e => e.name === sl.name && e.cityId === cityId);
      if (!exists) {
        updated.push({ ...sl, id: `SYS-${sl.name.replace(/\s+/g,"-")}-${cityId}` });
        changed = true;
      }
    }
    if (changed) localStorage.setItem(this.LEDGER_KEY, JSON.stringify(updated));
    return updated;
  }

  saveLedger(ledger: LedgerMaster): void {
    const all = this.getLedgers();
    const idx = all.findIndex(l => l.id === ledger.id);
    idx >= 0 ? all.splice(idx, 1, ledger) : all.push(ledger);
    localStorage.setItem(this.LEDGER_KEY, JSON.stringify(all));
  }

  deleteLedger(id: string): boolean {
    const all = this.getLedgers();
    const ledger = all.find(l => l.id === id);
    if (!ledger || ledger.isSystem) return false;
    localStorage.setItem(this.LEDGER_KEY, JSON.stringify(all.filter(l => l.id !== id)));
    return true;
  }

  getLedgersByHead(accountHead: string, cityId?: string): LedgerMaster[] {
    return this.getLedgers(cityId).filter(l => l.accountHead === accountHead);
  }

  getLedgerBalance(ledgerId: string): LedgerBalance {
    const ledger = this.getLedgers().find(l => l.id === ledgerId);
    const entries = this.getEntries().filter(e =>
      e.debitAccount === ledgerId || e.creditAccount === ledgerId
    );
    const totalDebit  = entries.reduce((s,e) => s + (e.debitAccount  === ledgerId ? e.totalBillValue : 0), 0);
    const totalCredit = entries.reduce((s,e) => s + (e.creditAccount === ledgerId ? e.totalBillValue : 0), 0);
    const balance     = totalDebit - totalCredit;
    return {
      ledgerId,
      ledgerName:  ledger?.name || ledgerId,
      accountHead: ledger?.accountHead || "",
      totalDebit, totalCredit,
      balance:     Math.abs(balance),
      balanceType: balance >= 0 ? "Dr" : "Cr",
    };
  }

  // Auto-create customer debtor ledger when a new subscriber is added
  createCustomerLedger(customerId: string, customerName: string,
      subscriptionPlan: string, cityId: string, city: string): LedgerMaster {
    const existing = this.getLedgers(cityId).find(l => l.customerId === customerId);
    if (existing) return existing;
    const ledger: LedgerMaster = {
      id: `CUST-LEDGER-${customerId}`,
      name: customerName,
      accountHead: "debtors",
      accountHeadLabel: "Debtors (Customers)",
      nature: "asset", type: "customer",
      openingBalance: 0, openingBalanceType: "Dr",
      city, cityId, isSystem: false,
      status: "Active", createdAt: new Date().toISOString(),
      customerId, customerName, subscriptionPlan,
    };
    this.saveLedger(ledger);
    return ledger;
  }

NEW FILE — src/app/components/accounts/LedgerMaster.tsx
A full ledger management screen at /accounts/ledger-master.
Header: Title "Ledger Master". Subtitle "Create and manage account ledgers — customers, banks, vendors, sales accounts." City filter from useCity(). Search input.
Summary KPI strip (4 cards): Total Ledgers | Customer Ledgers (Debtors) | Sales Ledgers | Bank & Payment Ledgers.
Account head filter tabs across the top: All | Debtors | Creditors | Bank | Sales | Expenses. Clicking a tab filters the table.
Ledger table columns: Ledger Name | Account Head | Type | Opening Balance | Current Balance (Dr/Cr) | Status | System | Actions (Edit / View / Delete). Delete button disabled for system ledgers with tooltip "System ledger — cannot be deleted." Current Balance in green for Dr assets, red for Cr liabilities.
"+ Create Ledger" button opens a slide-in panel with fields:

Ledger Name (text, required)
Account Head (dropdown from CHART_OF_ACCOUNTS_HEADS + new heads)
Type (Bank / Customer / Vendor / Sales / Expense / Other)
Opening Balance (number) + Opening Balance Type (Dr / Cr toggle)
GSTIN (optional, shows for Vendor/Customer)
Mobile + Email (optional)
On save: call accountingEntryService.saveLedger()

Auto-create notice banner at top of Debtors tab: "Customer ledgers are created automatically when a customer subscribes. You can also create them manually here."

CHANGE 2 — src/app/config/navigationConfig.ts
Add "Ledger Master" nav item inside the Accounts children array, after "Ledger":
ts{ label: "Ledger Master",    path: "/accounts/ledger-master",  icon: Layers,    module: "accounts", match: "prefix" },
{ label: "Razorpay Flow",   path: "/accounts/razorpay-flow",  icon: Zap,       module: "accounts", match: "prefix" },
Add Layers, Zap to the lucide-react import if not already present.

CHANGE 3 — src/app/routes.tsx
Add two new routes:
tsimport { LedgerMaster }    from "./components/accounts/LedgerMaster";
import { RazorpayFlow }    from "./components/accounts/RazorpayFlow";

{ path: "accounts/ledger-master",  element: <LedgerMaster /> },
{ path: "accounts/razorpay-flow",  element: <RazorpayFlow /> },
Do not change any other file in Phase 1.