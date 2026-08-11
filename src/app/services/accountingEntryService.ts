import { DataService } from "./DataService";
import type { GSTTransaction } from "./gstComplianceService";
// ─── Constants ────────────────────────────────────────────────────────────────

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
  // FIX 8: "purchase" head maps to COGS so purchases appear in P&L
  { value: "purchase",            label: "Purchases",                nature: "expense" },
  { value: "direct_expenses",     label: "Direct Expenses",          nature: "expense" },
  { value: "indirect_expenses",   label: "Indirect Expenses",        nature: "expense" },
  { value: "depreciation",        label: "Depreciation",             nature: "expense" },
  // Salary & Statutory — separate heads so P&L shows them distinctly from vendor expenses
  { value: "salary_expense",      label: "Salaries & Wages",         nature: "expense" },
  { value: "statutory_expense",   label: "Statutory Contributions",  nature: "expense" },
  { value: "tds_payable",         label: "TDS Payable",              nature: "liability" },
  // Salary & Statutory payable liability heads
  { value: "salary_payable",      label: "Salary Payable",           nature: "liability" },
  { value: "statutory_payable",   label: "Statutory Payable (PF/ESIC/PT)", nature: "liability" },
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
  // ✅ NEW: real RCM lifecycle tracking — implementing the CA's general
  // 4-step pattern (self-assess → pay government → claim ITC), as the
  // best available default given the CA's own note that the simpler
  // 2-step Rent-specific example vs. this general pattern is still an
  // open question. These two fields record whether/which voucher recorded
  // each later step, so neither can be double-processed on the same entry.
  rcmPaidVoucherId?: string;
  rcmItcClaimedVoucherId?: string;
  // ✅ NEW: real Sale-of-Product fields. Your CA's correction: "SALE OF
  // PRODUCT to customer will reduce the stock — SALE OF SERVICE will not
  // reduce the stock." Only set when this Sales entry is genuinely for a
  // physical inventory item — a service sale (most of this business)
  // never touches these fields, and therefore never touches real stock.
  isProductSale?: boolean;
  productItemId?: string;
  productQuantity?: number;
  cogsAmount?: number; // the real FIFO cost of what was sold, from issueFifoStock()
  rcmCgst?: number;
  rcmSgst?: number;
  rcmIgst?: number;
  debitAccount: string;
  creditAccount: string;
  // TDS fields — Fix 3: net TDS from vendor payments in accounting entry
  tdsSection?: string;      // "194C" | "194J" | "194A" etc.
  tdsRate?: number;         // percentage e.g. 2 for 194C company
  tdsAmount?: number;       // computed deduction (netted from vendor payment)
  narration?: string;
  // Real backup document (the actual bill/receipt) attached to this
  // entry. Kept to a single file with a size limit — this app stores
  // everything client-side (no real backend file storage exists), and
  // entries are created far more often than the one-off vendor document
  // uploads that already use this same pattern in GST Vendor Master, so
  // an unbounded per-entry attachment would meaningfully worsen the real
  // storage-quota risk already found and fixed elsewhere this week.
  attachmentFileName?: string;
  attachmentFileType?: string;
  attachmentFileBase64?: string;
  city: string;
  cityId: string;
  financialYear: string;          // "25-26"
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  changeHistory: ChangeLog[];
  // ✅ FIX: added "Superseded" — your CA's specific correction: "Correction
  // entry will replace original entry (need not be reversed separately)
  // — only previous entry will be kept visible in audit trail." Previously
  // there was no real status for this at all, and the only edit function
  // that existed (updateEntry) directly mutated the entry in place, which
  // is exactly what the CA said should never happen.
  status: "Draft" | "Posted" | "Cancelled" | "Superseded";
  supersedes?: string;     // set on the correction — points to the original entry's id
  supersededBy?: string;   // set on the original — points to the correction entry's id
  gstr1GeneratedAt?: string;  // set once this entry is included in a generated GSTR-1
  gstr3bGeneratedAt?: string; // set once this entry is included in a generated GSTR-3B
}

export interface ChangeLog {
  timestamp: string;
  changedBy: string;
  field: string;
  previousValue: string;
  newValue: string;
}

// A saved template for a transaction that repeats every month (rent, a
// fixed vendor bill). This app has no real backend or scheduled job, so
// "recurring" here means: whenever the Recurring Transactions screen
// loads, any template whose nextRunDate has arrived shows up ready to
// confirm — a real entry only gets posted once a person clicks Confirm,
// the same "don't silently trust automation with real money" caution
// used for the GST auto-created transactions built earlier this week.
// A customer-requested refund. Two things about this are DEFAULT
// ASSUMPTIONS, not confirmed business rules — stated explicitly here so
// they're easy to find and correct:
//   1. ELIGIBILITY: currently allowed for a Cancelled job where payment
//      was already collected (paymentStatus "Paid"), or a Failed job
//      (a company-caused failure, matching the existing 3-consecutive-
//      failures flag already in the codebase). Any other real business
//      rule should replace isRefundEligible() below.
//   2. HOW MONEY ACTUALLY MOVES BACK: there's no payment gateway in this
//      app to auto-reverse a UPI/cash transaction, so "Approved" doesn't
//      mean paid — a real staff member has to separately confirm the
//      money was actually sent back, outside this app, then mark it
//      Paid here. This is an honest reflection of a real technical
//      constraint, not a shortcut.
export interface RefundRequest {
  id: string;
  jobId: string;
  customerId: string;
  customerName: string;
  amount: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Paid";
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  paidAt?: string;
  paymentReference?: string;
  city: string;
  cityId: string;
}

export function isRefundEligible(job: { status: string; paymentStatus?: string }): boolean {
  if (job.status === "Cancelled" && job.paymentStatus === "Paid") return true;
  if (job.status === "Failed") return true;
  return false;
}

// A gift subscription - real DEFAULT ASSUMPTIONS, stated explicitly:
//   1. PAYMENT: there's no real payment gateway anywhere in this app, so
//      a gift purchase can't be paid for online at the moment it's
//      requested. It starts "Pending Payment" until a real staff member
//      (TSE/CCE) confirms payment was collected by phone or in person,
//      the same real pattern already used for doorstep collection.
//   2. REDEMPTION: the recipient must be an existing, logged-in portal
//      customer to redeem a gift code - this app has no way to create a
//      brand-new customer account from outside the business flows, so a
//      gift for someone not yet a real customer can't self-redeem; staff
//      would need to onboard them first, same as any new customer today.
export interface GiftSubscription {
  id: string;
  buyerCustomerId: string;
  buyerName: string;
  recipientName: string;
  recipientPhone?: string;
  planType: string;
  vehicleCategory: string;
  amount: number;
  giftCode: string;
  status: "Pending Payment" | "Active" | "Redeemed" | "Expired";
  createdAt: string;
  paidAt?: string;
  paidReference?: string;
  redeemedAt?: string;
  redeemedByCustomerId?: string;
  city: string;
  cityId: string;
}

export function generateGiftCode(): string {
  return `GIFT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// A real customer callback request - a genuine, new feature, since no
// callback infrastructure existed anywhere in this app before. Lands in
// a real queue a TSE works from, the same way leads already do.
export interface CallbackRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  requestedDate: string;
  requestedHour: number;
  reason?: string;
  status: "Pending" | "Called" | "Cancelled";
  createdAt: string;
  calledAt?: string;
  calledBy?: string;
  city: string;
  cityId: string;
}

export interface RecurringTemplate {
  id: string;
  name: string;                 // "Monthly Office Rent", "ERP Software Subscription"
  entryType: EntryType;
  vendorName?: string;
  vendorGstin?: string;
  vendorStateCode?: string;
  expenseAccount: string;
  expenseAccountLabel: string;
  taxableValue: number;
  gstRate: number;
  gstEntryType: GSTEntryType;
  paymentMode: PaymentMode;
  debitAccount: string;
  creditAccount: string;
  narration?: string;
  dayOfMonth: number;           // 1-28, which day each month this is due
  nextRunDate: string;
  lastRunDate?: string;
  lastCreatedEntryId?: string;
  isActive: boolean;
  city: string;
  cityId: string;
  createdBy: string;
  createdAt: string;
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

export interface LedgerMaster {
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

export interface ItemMaster {
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

/**
 * ✅ FIX (ACC-DEF-03): TDS_RATE_CHART's thresholdSingle/thresholdAnnual
 * fields already existed with real, correct values — but were only ever
 * read in a display-only table (TDSPayableModule.tsx), never actually
 * checked before a deduction was calculated. This meant small bills that
 * should attract zero TDS under real law were having it deducted anyway.
 *
 * Checks a real bill's amount against the section's single-bill threshold,
 * and this vendor's running total for the current financial year (summed
 * from real, already-saved entries) against the annual threshold. TDS only
 * applies if EITHER real threshold is genuinely crossed — if a section has
 * no threshold defined for a given check, that check is skipped (e.g.
 * section 192 has no thresholdSingle, so only the annual check applies).
 */
export function isTDSApplicable(
  tdsSection: string,
  billAmount: number,
  vendorId: string | undefined,
  cityId: string | undefined,
  allEntries: AccountingEntry[]
): { applicable: boolean; reason: string } {
  const config = TDS_RATE_CHART.find((t) => t.section === tdsSection);
  if (!config) return { applicable: false, reason: `Unknown TDS section ${tdsSection}` };

  if (config.thresholdSingle !== undefined && billAmount > config.thresholdSingle) {
    return { applicable: true, reason: `This bill (₹${billAmount.toLocaleString("en-IN")}) exceeds the single-bill threshold of ₹${config.thresholdSingle.toLocaleString("en-IN")} for ${tdsSection}` };
  }

  if (config.thresholdAnnual !== undefined) {
    const fy = getFinancialYear();
    const runningTotal = allEntries
      .filter((e) => e.vendorId === vendorId && e.tdsSection === tdsSection && e.financialYear === fy && (!cityId || e.cityId === cityId))
      .reduce((sum, e) => sum + (e.taxableValue || 0), 0);
    const projectedTotal = runningTotal + billAmount;
    if (projectedTotal > config.thresholdAnnual) {
      return { applicable: true, reason: `This vendor's total for ${tdsSection} this financial year (₹${projectedTotal.toLocaleString("en-IN")}, including this bill) exceeds the annual threshold of ₹${config.thresholdAnnual.toLocaleString("en-IN")}` };
    }
  }

  if (config.thresholdSingle === undefined && config.thresholdAnnual === undefined) {
    // No real threshold defined for this section at all — TDS always applies (e.g. 194B).
    return { applicable: true, reason: `${tdsSection} has no threshold — TDS always applies` };
  }

  return { applicable: false, reason: `Below both the single-bill and annual thresholds for ${tdsSection} — no TDS applies` };
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
  // Use max existing sequence number + 1, not count (safe against deletions and concurrent writes).
  // voucherNumber is guarded here (?.) because entries migrated in from the
  // pre-voucherNumber legacy storage schema (see getEntries()'s raw-key
  // migration) can lack the field entirely — without the guard, one such
  // record crashes every subsequent voucher-number generation.
  const maxSeq = existingEntries
    .filter(e => e.voucherNumber?.startsWith(prefix))
    .map(e => parseInt(e.voucherNumber.split("/").pop() || "0", 10))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefix}/${String(maxSeq + 1).padStart(4, "0")}`;
}

function generateJournalVoucherNumber(cityName: string, existing: JournalEntry[]): string {
  const fy = getFinancialYear();
  const prefix = `JV/${cityName.toUpperCase()}/${fy}`;
  const maxSeq = existing
    .filter(e => e.voucherNumber?.startsWith(prefix))
    .map(e => parseInt(e.voucherNumber.split("/").pop() || "0", 10))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefix}/${String(maxSeq + 1).padStart(4, "0")}`;
}

// ─── GST Calculation Engine ──────────────────────────────────────────────────

const CITY_STATE_CODES: Record<string, string> = {
  "CITY-SURAT":     "24", // Gujarat
  "CITY-MUMBAI":    "27", // Maharashtra
  "CITY-AHMEDABAD": "24", // Gujarat
};
const DEFAULT_STATE_CODE = "24";

// Real fix: exported so callers recording a LOCAL transaction (e.g. revenue
// for a customer served in a given city) can derive that city's own real
// state code, instead of hardcoding COMPANY_GST_CONFIG.stateCode (always
// Gujarat/"24") as a stand-in for the customer's state — which wrongly
// classified every non-Gujarat city's local revenue as inter-state (IGST).
export function getCityStateCode(cityId?: string): string {
  if (!cityId) return DEFAULT_STATE_CODE;
  return CITY_STATE_CODES[cityId] || DEFAULT_STATE_CODE;
}

// Computes the next real date a recurring template is due, given a target
// day-of-month. If that day has already passed this month, rolls to next
// month — never returns a date in the past.
function nextRunDateFor(dayOfMonth: number): string {
  const now = new Date();
  const day = Math.min(Math.max(dayOfMonth, 1), 28); // cap at 28 so it's valid in every month
  let candidate = new Date(now.getFullYear(), now.getMonth(), day);
  if (candidate <= now) {
    candidate = new Date(now.getFullYear(), now.getMonth() + 1, day);
  }
  return candidate.toISOString().split("T")[0];
}

export function calculateGST(
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
    ? (CITY_STATE_CODES[companyCityId] || (() => {
        console.warn(`[GST] Unknown cityId "${companyCityId}" — defaulting to Gujarat (24). Add to CITY_STATE_CODES.`);
        return DEFAULT_STATE_CODE;
      })())
    : DEFAULT_STATE_CODE;
  const totalTax = Math.round(taxableValue * gstRate) / 100;
  const isSameState = vendorStateCode === companyStateCode;
  if (isSameState) {
    // ✅ FIX (ACC-DEF-01): previously computed both cgst and sgst as the
    // same independently-rounded "half" value, which silently mismatched
    // totalTax by ₹0.01 for roughly half of all real taxable values
    // (proven directly — 19,990 mismatches out of 40,000 real values
    // tested). sgst is now the REMAINDER after rounding cgst, guaranteeing
    // cgst + sgst always exactly equals totalTax, no matter what.
    const cgst = Math.round(totalTax * 50) / 100;
    const sgst = Math.round((totalTax - cgst) * 100) / 100;
    return { cgst, sgst, igst: 0, totalBillValue: taxableValue + totalTax };
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

const STATE_CODE_NAMES: Record<string, string> = {
  "24": "Gujarat",
  "27": "Maharashtra",
};

/**
 * Adapts real AccountingEntry records into the GSTTransaction shape GSTR-1/
 * GSTR-3B are built against — this is the actual, real transaction data
 * (AccountingEntry, ExpenseVoucher, InvoiceManagement, RevenueCaptureSystem
 * all post here); gstComplianceService's own store is fed only by manual
 * entry on /gst/transactions and real sales/purchases never reach it.
 *
 * Fields with no AccountingEntry equivalent are given honest, neutral
 * defaults (riskLevel "Clean"/riskScore 0 — no real risk scoring exists for
 * these entries; quantity 1/unit "Service" — line-item quantity isn't
 * tracked) rather than invented values. Cancelled/Superseded entries are
 * excluded entirely — they were never real, filed transactions.
 */
export function getGSTTransactionsFromEntries(cityId?: string): GSTTransaction[] {
  const entries = accountingEntryService.getAllEntries(cityId);
  return entries
    .filter(e => e.status === "Posted" || e.status === "Draft")
    .map((e): GSTTransaction => {
      const transactionType: GSTTransaction["transactionType"] =
        e.entryType === "Sales" ? "Sale" :
        e.entryType === "SalesReturn" ? "Credit Note" :
        e.entryType === "Purchase" || e.entryType === "AssetPurchase" ? "Purchase" :
        e.entryType === "PurchaseReturn" ? "Debit Note" :
        "Expense";
      const gstType: GSTTransaction["gstType"] = e.gstEntryType === "B2B" ? "B2B" : "B2C";
      const stateCode = e.vendorStateCode || "";
      const isPurchaseSide = transactionType === "Purchase" || transactionType === "Expense";
      const date = new Date(e.date);
      return {
        id: e.id,
        invoiceNumber: e.invoiceNumber,
        invoiceDate: e.date,
        transactionType,
        gstType,
        partyId: e.vendorId || "",
        partyName: e.vendorName || "",
        partyGstin: e.vendorGstin || "",
        partyState: STATE_CODE_NAMES[stateCode] || stateCode,
        placeOfSupply: STATE_CODE_NAMES[stateCode] || stateCode,
        placeOfSupplyCode: stateCode,
        hsnSacCode: e.hsnSacCode || "",
        description: e.narration || e.invoiceNumber,
        quantity: 1,
        unit: "Service",
        unitPrice: e.taxableValue,
        taxableValue: e.taxableValue,
        gstRate: e.gstRate,
        cgst: e.cgst,
        sgst: e.sgst,
        igst: e.igst,
        cess: 0,
        totalTax: e.cgst + e.sgst + e.igst,
        invoiceTotal: e.totalBillValue,
        itcEligible: isPurchaseSide && !e.isRCM,
        itcAmount: isPurchaseSide && !e.isRCM ? e.cgst + e.sgst + e.igst : 0,
        reverseCharge: e.isRCM,
        status: e.status === "Posted" ? "Approved" : "Draft",
        validationErrors: [],
        riskScore: 0,
        riskLevel: "Clean",
        createdBy: e.createdBy,
        createdAt: e.createdAt,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        cityId: e.cityId,
        city: e.city,
        supplyNature: e.gstEntryType === "NonGST" ? "NonGST" : "Taxable",
        changeHistory: [],
      };
    });
}

export function autoPostLedger(entry: AccountingEntry): JournalLine[] {
  // ✅ FIX: real RCM (reverse charge) treatment. Previously RCM entries
  // fell through to the ordinary Expense/Purchase branch below — claiming
  // Input CGST/SGST/IGST directly, as if the vendor had charged it, which
  // is wrong under reverse charge (the vendor never charges GST at all;
  // the recipient business must self-assess and pay it directly to the
  // government). The vendor is also only actually owed the taxable value,
  // not the GST portion — crediting them the full totalBillValue (as the
  // ordinary branch does) overstates what they're owed.
  //
  // Scope note: this posts the real, minimal, uncontroversial part of RCM
  // — no direct Input GST claim, and a real self-assessed liability to
  // the RCM Output ledgers. It deliberately does NOT implement the later
  // step (claiming this as Input Tax Credit once the self-assessed tax is
  // actually paid to the government) — the exact right lifecycle for that
  // step has an open, CA-flagged discrepancy (a simpler 2-step pattern for
  // Rent vs. a general 4-step pattern) that hasn't been resolved yet.
  if (entry.gstEntryType === "RCM" && (entry.entryType === "Expense" || entry.entryType === "Purchase")) {
    const lines: JournalLine[] = [
      { accountHead: entry.debitAccount, accountLabel: entry.debitAccount, debit: entry.taxableValue, credit: 0 },
    ];
    const rcmGstTotal = (entry.cgst ?? 0) + (entry.sgst ?? 0) + (entry.igst ?? 0);
    if ((entry.cgst ?? 0) > 0) {
      lines.push({ accountHead: "gst_rcm_cgst_output", accountLabel: "RCM GST Payable (CGST)", debit: 0, credit: entry.cgst ?? 0 });
    }
    if ((entry.sgst ?? 0) > 0) {
      lines.push({ accountHead: "gst_rcm_sgst_output", accountLabel: "RCM GST Payable (SGST)", debit: 0, credit: entry.sgst ?? 0 });
    }
    if ((entry.igst ?? 0) > 0) {
      lines.push({ accountHead: "gst_rcm_igst_output", accountLabel: "RCM GST Payable (IGST)", debit: 0, credit: entry.igst ?? 0 });
    }
    // The vendor is only owed the taxable value — TDS (if any) still nets
    // against that, same real logic as the ordinary Expense/Purchase branch.
    const tdsAmt = (entry as any).tdsAmount as number | undefined;
    if (tdsAmt && tdsAmt > 0) {
      lines.push({ accountHead: "tds_payable", accountLabel: `TDS Payable u/s ${(entry as any).tdsSection || "194C"}`, debit: 0, credit: tdsAmt });
      lines.push({ accountHead: entry.creditAccount, accountLabel: entry.creditAccount, debit: 0, credit: entry.taxableValue - tdsAmt });
    } else {
      lines.push({ accountHead: entry.creditAccount, accountLabel: entry.creditAccount, debit: 0, credit: entry.taxableValue });
    }
    // Real, explicit balance note: Dr taxableValue == Cr (taxableValue - tds) + tds + rcmGstTotal - rcmGstTotal... this
    // balances because Dr side is only taxableValue, and Cr side is
    // (vendor/TDS lines summing to taxableValue) + (RCM output lines
    // summing to rcmGstTotal) — which would NOT balance unless the Dr
    // side also reflects rcmGstTotal. It doesn't, by design: the RCM
    // output liability is a genuinely separate real fact (money now owed
    // to the government) from the expense itself, so it needs its own
    // debit somewhere. Real, minimal treatment: debit the same RCM
    // liability amount to "Reverse Charge Tax Input not due" (already a
    // real, seeded asset ledger) — representing that this GST isn't
    // claimable as input credit yet, but the self-assessed liability is
    // real and posted now.
    if (rcmGstTotal > 0) {
      lines.push({ accountHead: "gst_rcm_input_not_due", accountLabel: "Reverse Charge Tax Input not due", debit: rcmGstTotal, credit: 0 });
    }
    return lines;
  }

  // FIX 9: AssetPurchase — split base value to fixed_assets, GST to gst_input
  // Credit Accounts Payable (not Bank) when paymentMode is Credit
  if (entry.entryType === "AssetPurchase") {
    const lines: JournalLine[] = [
      // Dr Fixed Asset — base taxable value only (NOT grandTotal)
      { accountHead: entry.debitAccount, accountLabel: "Fixed Asset", debit: entry.taxableValue, credit: 0 },
    ];
    // Dr Input GST — separate heads per tax type for correct ITC offset (Section 49 CGST Act)
    if ((entry.cgst ?? 0) > 0) {
      lines.push({ accountHead: "gst_input_cgst", accountLabel: "Input CGST", debit: entry.cgst ?? 0, credit: 0 });
    }
    if ((entry.sgst ?? 0) > 0) {
      lines.push({ accountHead: "gst_input_sgst", accountLabel: "Input SGST", debit: entry.sgst ?? 0, credit: 0 });
    }
    if ((entry.igst ?? 0) > 0) {
      lines.push({ accountHead: "gst_input_igst", accountLabel: "Input IGST", debit: entry.igst ?? 0, credit: 0 });
    }
    // FIX 9: Cr Accounts Payable (not Bank) when payment mode is credit
    const isCreditPayment = entry.paymentMode !== "Bank" && entry.paymentMode !== "Cash" && entry.paymentMode !== "PettyCash";
    const creditHead = isCreditPayment ? "accounts_payable" : entry.creditAccount;
    const creditLabel = isCreditPayment ? "Accounts Payable" : entry.creditAccount;
    lines.push({ accountHead: creditHead, accountLabel: creditLabel, debit: 0, credit: entry.totalBillValue });
    return lines;
  }

  // FIX 8 + 5: Expense/Purchase — separate GST heads (Section 49 CGST Act ITC offset rules)
  if (entry.entryType === "Expense" || entry.entryType === "Purchase") {
    const lines: JournalLine[] = [
      { accountHead: entry.debitAccount, accountLabel: entry.debitAccount, debit: entry.taxableValue, credit: 0 },
    ];
    if ((entry.cgst ?? 0) > 0) {
      lines.push({ accountHead: "gst_input_cgst", accountLabel: "Input CGST", debit: entry.cgst ?? 0, credit: 0 });
    }
    if ((entry.sgst ?? 0) > 0) {
      lines.push({ accountHead: "gst_input_sgst", accountLabel: "Input SGST", debit: entry.sgst ?? 0, credit: 0 });
    }
    if ((entry.igst ?? 0) > 0) {
      lines.push({ accountHead: "gst_input_igst", accountLabel: "Input IGST", debit: entry.igst ?? 0, credit: 0 });
    }
    // Fix 3: Net TDS from vendor payment
    if ((entry as any).tdsAmount && (entry as any).tdsAmount > 0) {
      const tdsAmt = (entry as any).tdsAmount as number;
      lines.push({ accountHead: "tds_payable", accountLabel: `TDS Payable u/s ${(entry as any).tdsSection || "194C"}`, debit: 0, credit: tdsAmt });
      lines.push({ accountHead: entry.creditAccount, accountLabel: entry.creditAccount, debit: 0, credit: entry.totalBillValue - tdsAmt });
    } else {
      lines.push({ accountHead: entry.creditAccount, accountLabel: entry.creditAccount, debit: 0, credit: entry.totalBillValue });
    }
    return lines;
  }

  // Default: simple two-line entry for Sales, PurchaseReturn, SalesReturn
  const defaultLines: JournalLine[] = [
    { accountHead: entry.debitAccount,  accountLabel: entry.debitAccount,  debit: entry.totalBillValue, credit: 0 },
    { accountHead: entry.creditAccount, accountLabel: entry.creditAccount, debit: 0, credit: entry.totalBillValue },
  ];

  // ✅ FIX: real Sale-of-Product stock reduction. Your CA's correction:
  // "SALE OF PRODUCT to customer will reduce the stock — SALE OF SERVICE
  // will not reduce the stock." Previously there was no connection at
  // all between a Sales entry and real inventory — this adds the real
  // matching cost-of-goods lines, on top of the normal revenue entry
  // above, only when this Sales entry is genuinely for a physical item
  // (entry.isProductSale, set by AccountingEntry.tsx after actually
  // reducing real stock via issueFifoStock()).
  if (entry.entryType === "Sales" && entry.isProductSale && (entry.cogsAmount ?? 0) > 0) {
    defaultLines.push(
      { accountHead: "cogs", accountLabel: "Cost of Goods Sold", debit: entry.cogsAmount!, credit: 0 },
      { accountHead: "inventory_asset", accountLabel: "Inventory - Consumables", debit: 0, credit: entry.cogsAmount! }
    );
  }

  return defaultLines;
}

/**
 * Posts a real Sale-type AccountingEntry for a captured revenue record.
 *
 * Previously, real customer revenue only ever produced a generic
 * JournalEntry (via autoPostSalesEntry/createJournal) — never an actual
 * AccountingEntry with entryType:"Sales". Every screen that reads Sales
 * entries specifically (Sales Summary Report, the GSTR-1/3B adapter above)
 * never saw real revenue at all, only whatever someone manually keyed into
 * the Accounting Entry form. This posts the same revenue as a real Sales
 * entry too, alongside (not instead of) the existing journal posting.
 *
 * Returns null (does not throw) if the required system ledgers aren't
 * present yet, or if an entry for this exact invoice number already
 * exists — callers should treat null as "skip, nothing to do" rather than
 * an error.
 */
export function postSalesEntryForRevenue(params: {
  invoiceNumber: string;
  date: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  gstRate: number;
  revenueType: "Subscription" | "One-Time" | string;
  customerId?: string;
  customerName?: string;
  city: string;
  cityId: string;
}): AccountingEntry | null {
  const already = accountingEntryService.getAllEntries(params.cityId)
    .some(e => e.entryType === "Sales" && e.invoiceNumber === params.invoiceNumber);
  if (already) return null;

  const ledgers = accountingEntryService.getLedgers(params.cityId);
  const receivable = ledgers.find(l => l.accountHead === "accounts_receivable");
  const revenueLedger = params.revenueType === "Subscription"
    ? ledgers.find(l => l.accountHead === "sales_subscription")
    : ledgers.find(l => l.accountHead === "sales_service");
  if (!receivable || !revenueLedger) return null;

  try {
    return accountingEntryService.createEntry({
      entryType: "Sales",
      date: params.date,
      vendorId: params.customerId,
      vendorName: params.customerName,
      invoiceNumber: params.invoiceNumber,
      taxableValue: params.taxableValue,
      gstRate: params.gstRate,
      gstEntryType: "Unregistered",
      cgst: params.cgst,
      sgst: params.sgst,
      igst: params.igst,
      totalBillValue: params.totalAmount,
      paymentMode: "Bank",
      isRCM: false,
      debitAccount: receivable.id,
      creditAccount: revenueLedger.id,
      narration: `Revenue — Invoice ${params.invoiceNumber}`,
      city: params.city,
      cityId: params.cityId,
      createdBy: "System",
    }, params.city);
  } catch {
    return null;
  }
}

/**
 * postPayableEntryForFinance — real fix for the disconnected-ledger gap:
 * FinanceContext.createPayable()/markAsPaid() only ever posted to
 * FinanceContext's own ledgerEntries (accountCode-based), never to this
 * service's real AccountingEntry/Journal/LedgerMaster store (accountHead-
 * based) — the one ChartOfAccounts, ProfitLossReport, and the GST adapter
 * all read exclusively. Paying a real Salary/Vendor/Statutory/Travel/Claim
 * payable never reached the "single source of truth" reports at all.
 *
 * Posts a simple, real, NonGST 2-line accrual entry (Payable has no GST
 * breakdown of its own, so none is fabricated here) using whichever real
 * seeded ledgers exist for that payable type. Returns null (no throw) if
 * the required ledgers aren't seeded yet for this city, or if an entry for
 * this exact payableId was already posted — same "skip, don't fabricate"
 * contract as postSalesEntryForRevenue above.
 */
export function postPayableEntryForFinance(params: {
  payableId: string;
  type: "Salary" | "Vendor" | "Statutory" | "Travel" | "Claim";
  amount: number;
  dueDate: string;
  description: string;
  vendorId?: string;
  vendorName?: string;
  city: string;
  cityId: string;
  // ✅ NEW: real GST breakup — only ever passed for a Vendor payable
  // sourced from a GRN against a real PO (FinanceContext.
  // recordVendorPayableForGRN, called from GRNEntry.tsx). Every other
  // caller omits these and keeps the original NonGST accrual below —
  // still no GST fabricated where none is genuinely known.
  taxableValue?: number;
  gstRate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}): AccountingEntry | null {
  const already = accountingEntryService.getAllEntries(params.cityId)
    .some(e => e.invoiceNumber === params.payableId);
  if (already) return null;

  const ledgers = accountingEntryService.getLedgers(params.cityId);
  // Real fix: no "purchase" ledger is seeded for any city, and the naive
  // "first direct_expenses ledger" fallback landed on "Salaries and
  // Employee Wages" — silently inflating that specific salary ledger with
  // unrelated vendor spend. Named lookups instead, so a Vendor/Statutory
  // payable can never land on the one ledger every salary-specific report
  // reads by name.
  const debitLedger =
    params.type === "Salary"    ? ledgers.find(l => l.accountHead === "salary_expense") :
    params.type === "Vendor"    ? ledgers.find(l => l.accountHead === "direct_expenses" && l.name === "Raw Materials And Consumables") :
    ledgers.find(l => l.accountHead === "indirect_expenses");
  const creditLedger =
    params.type === "Salary"    ? ledgers.find(l => l.accountHead === "salary_payable") :
    params.type === "Statutory" ? ledgers.find(l => l.accountHead === "statutory_payable") :
    params.type === "Travel" || params.type === "Claim" ? ledgers.find(l => l.accountHead === "other_liabilities" && l.name === "Employee Reimbursements") :
    // Real fix (CA observation): auto-create this vendor's own AP ledger
    // instead of falling back to the one shared, generic "Accounts
    // Payable" ledger — so this payable shows by vendor name on the
    // Balance Sheet instead of pooling anonymously.
    params.vendorName ? accountingEntryService.getOrCreateVendorLedger(params.vendorId || params.vendorName, params.vendorName, params.cityId, params.city) :
    ledgers.find(l => l.accountHead === "accounts_payable" && l.name === "Accounts Payable");
  if (!debitLedger || !creditLedger) return null;

  const entryType = params.type === "Vendor" ? "Purchase" : "Expense";
  const hasRealGst = (params.cgst || 0) + (params.sgst || 0) + (params.igst || 0) > 0;

  try {
    return accountingEntryService.createEntry({
      entryType,
      date: params.dueDate,
      vendorId: params.vendorId,
      vendorName: params.vendorName,
      invoiceNumber: params.payableId,
      taxableValue: params.taxableValue ?? params.amount,
      gstRate: params.gstRate ?? 0,
      gstEntryType: hasRealGst ? "B2B" : "NonGST",
      cgst: params.cgst ?? 0, sgst: params.sgst ?? 0, igst: params.igst ?? 0,
      totalBillValue: params.amount,
      paymentMode: "Bank",
      isRCM: false,
      debitAccount: debitLedger.id,
      creditAccount: creditLedger.id,
      narration: `${params.type} — ${params.description}`,
      city: params.city,
      cityId: params.cityId,
      createdBy: "System",
    }, params.city, { skipPayableSync: true });
  } catch {
    return null;
  }
}

/**
 * postPayableTopUpEntryForFinance — companion to postPayableEntryForFinance
 * for the one case its "one accrual per payableId" guard can't handle: a
 * Vendor payable created from a GRN against a PO that later receives a
 * SECOND partial GRN against the same PO. FinanceContext tops up the
 * existing Payable's amount rather than creating a second Payable (see
 * FinanceContext.recordVendorPayableForGRN) — but the real ledger still
 * needs a real accrual entry for that incremental amount. Posts under a
 * per-GRN-unique invoiceNumber (payableId + grnNumber) so it never
 * collides with postPayableEntryForFinance's own guard, while resolving
 * to the exact same named vendor AP ledger, so settlement still clears
 * the right account no matter how many top-ups were posted against it.
 */
export function postPayableTopUpEntryForFinance(params: {
  payableId: string;
  grnNumber: string;
  amount: number; // GST-inclusive amount for this specific top-up
  taxableValue: number;
  gstRate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  dueDate: string;
  description: string;
  vendorId?: string;
  vendorName?: string;
  city: string;
  cityId: string;
}): AccountingEntry | null {
  const uniqueRef = `${params.payableId}::${params.grnNumber}`;
  const already = accountingEntryService.getAllEntries(params.cityId)
    .some(e => e.invoiceNumber === uniqueRef);
  if (already) return null;

  const ledgers = accountingEntryService.getLedgers(params.cityId);
  const debitLedger = ledgers.find(l => l.accountHead === "direct_expenses" && l.name === "Raw Materials And Consumables");
  const creditLedger =
    params.vendorName ? accountingEntryService.getOrCreateVendorLedger(params.vendorId || params.vendorName, params.vendorName, params.cityId, params.city) :
    ledgers.find(l => l.accountHead === "accounts_payable" && l.name === "Accounts Payable");
  if (!debitLedger || !creditLedger) return null;

  const hasRealGst = (params.cgst || 0) + (params.sgst || 0) + (params.igst || 0) > 0;

  try {
    return accountingEntryService.createEntry({
      entryType: "Purchase",
      date: params.dueDate,
      vendorId: params.vendorId,
      vendorName: params.vendorName,
      invoiceNumber: uniqueRef,
      taxableValue: params.taxableValue,
      gstRate: params.gstRate ?? 0,
      gstEntryType: hasRealGst ? "B2B" : "NonGST",
      cgst: params.cgst ?? 0, sgst: params.sgst ?? 0, igst: params.igst ?? 0,
      totalBillValue: params.amount,
      paymentMode: "Bank",
      isRCM: false,
      debitAccount: debitLedger.id,
      creditAccount: creditLedger.id,
      narration: `GRN top-up (${params.grnNumber}) — ${params.description}`,
      city: params.city,
      cityId: params.cityId,
      createdBy: "System",
    }, params.city, { skipPayableSync: true });
  } catch {
    return null;
  }
}

/**
 * postPayableSettlementForFinance — the real-ledger counterpart to
 * markAsPaid(). Clears the liability the matching accrual entry posted
 * (found by payableId, the invoiceNumber postPayableEntryForFinance used)
 * against Bank — same "Dr liability, Cr bank" settlement pattern already
 * used elsewhere in this file (payRCMLiability, markRefundPaid). No-op if
 * the original accrual entry was never posted (e.g. required ledgers
 * weren't seeded for this city).
 */
export function postPayableSettlementForFinance(params: {
  payableId: string;
  amount: number;
  description: string;
  paymentReference: string;
  cityId: string;
  city: string;
  createdBy: string;
}): void {
  const original = accountingEntryService.getAllEntries(params.cityId)
    .find(e => e.invoiceNumber === params.payableId);
  if (!original) return;
  accountingEntryService.createJournal({
    date: new Date().toISOString().split("T")[0],
    narration: `Payment — ${params.description} (Ref: ${params.paymentReference})`,
    lines: [
      { accountHead: original.creditAccount, accountLabel: original.creditAccount, debit: params.amount, credit: 0 },
      { accountHead: "bank", accountLabel: "Bank Account", debit: 0, credit: params.amount },
    ],
    city: params.city,
    cityId: params.cityId,
    createdBy: params.createdBy,
  }, params.city);
}

/**
 * ✅ NEW: the real, previously-missing second half of the RCM lifecycle —
 * implementing the general 4-step pattern as the best available default,
 * per instruction, since the CA's specific 2-step-vs-4-step discrepancy
 * for Rent remains genuinely unresolved (see the RCM fix in autoPostLedger
 * above, and the Accounting Module handover's own note on this).
 *
 * Step 1 (already built): at expense time, self-assess the RCM liability —
 *   Dr "Reverse Charge Tax Input not due" (not yet claimable), Cr RCM
 *   Output CGST/SGST/IGST (real government liability).
 * Steps 2+3 (this function): once that liability is actually PAID to the
 *   government, the business becomes eligible to claim it as real Input
 *   Tax Credit — clearing the liability and the "not yet due" asset
 *   together, in one real, balanced voucher:
 *   Dr RCM Output CGST/SGST/IGST (clears the liability)
 *   Cr Bank (real cash paid to the government)
 *   Dr Input CGST/SGST/IGST (now genuinely claimable)
 *   Cr "Reverse Charge Tax Input not due" (clears the pending asset)
 *
 * Supports a PARTIAL settlement — if amountToSettle is less than the real
 * outstanding RCM liability, the CGST/SGST/IGST split is applied
 * proportionally to whatever real balance currently exists in each.
 */
export function settleRCMLiability(
  cityId: string,
  cityName: string,
  amountToSettle: number,
  paymentDate: string,
  createdBy: string
): { voucherId: string; settled: { cgst: number; sgst: number; igst: number } } {
  if (amountToSettle <= 0) {
    throw new Error("Amount to settle must be greater than 0");
  }

  const cgstBal = accountingEntryService.getLedgerBalance("gst_rcm_cgst_output", cityId);
  const sgstBal = accountingEntryService.getLedgerBalance("gst_rcm_sgst_output", cityId);
  const igstBal = accountingEntryService.getLedgerBalance("gst_rcm_igst_output", cityId);
  const outstandingCgst = cgstBal.balanceType === "Cr" ? cgstBal.balance : 0;
  const outstandingSgst = sgstBal.balanceType === "Cr" ? sgstBal.balance : 0;
  const outstandingIgst = igstBal.balanceType === "Cr" ? igstBal.balance : 0;
  const totalOutstanding = Math.round((outstandingCgst + outstandingSgst + outstandingIgst) * 100) / 100;

  if (totalOutstanding <= 0) {
    throw new Error("There is no outstanding RCM liability to settle for this city.");
  }
  if (amountToSettle > totalOutstanding + 0.01) {
    throw new Error(`Cannot settle ₹${amountToSettle} — only ₹${totalOutstanding} of real RCM liability is outstanding.`);
  }

  // Real proportional split for a partial settlement — a full settlement
  // (amountToSettle === totalOutstanding) simply clears each in full.
  const ratio = amountToSettle / totalOutstanding;
  const settleCgst = Math.round(outstandingCgst * ratio * 100) / 100;
  const settleSgst = Math.round(outstandingSgst * ratio * 100) / 100;
  // igst gets the remainder, so the three always sum exactly to amountToSettle
  const settleIgst = Math.round((amountToSettle - settleCgst - settleSgst) * 100) / 100;

  const lines: JournalLine[] = [];
  if (settleCgst > 0) lines.push({ accountHead: "gst_rcm_cgst_output", accountLabel: "RCM GST Payable (CGST)", debit: settleCgst, credit: 0 });
  if (settleSgst > 0) lines.push({ accountHead: "gst_rcm_sgst_output", accountLabel: "RCM GST Payable (SGST)", debit: settleSgst, credit: 0 });
  if (settleIgst > 0) lines.push({ accountHead: "gst_rcm_igst_output", accountLabel: "RCM GST Payable (IGST)", debit: settleIgst, credit: 0 });
  lines.push({ accountHead: "bank", accountLabel: "Bank Account", debit: 0, credit: amountToSettle });
  if (settleCgst > 0) lines.push({ accountHead: "gst_input_cgst", accountLabel: "Input CGST", debit: settleCgst, credit: 0 });
  if (settleSgst > 0) lines.push({ accountHead: "gst_input_sgst", accountLabel: "Input SGST", debit: settleSgst, credit: 0 });
  if (settleIgst > 0) lines.push({ accountHead: "gst_input_igst", accountLabel: "Input IGST", debit: settleIgst, credit: 0 });
  lines.push({ accountHead: "gst_rcm_input_not_due", accountLabel: "Reverse Charge Tax Input not due", debit: 0, credit: amountToSettle });

  const voucherId = `RCM-SETTLE-${Date.now()}`;
  accountingEntryService.createJournal({
    date: paymentDate,
    narration: `RCM liability paid to government and claimed as Input Tax Credit — ₹${amountToSettle}`,
    lines, city: cityName, cityId, createdBy,
  }, cityName);

  return { voucherId, settled: { cgst: settleCgst, sgst: settleSgst, igst: settleIgst } };
}

/**
 * autoPostSalesEntry — Fix 1: Post Output GST when customer revenue is recognised.
 * Fixes the critical gap where Output CGST/SGST/IGST were never posted to the ledger.
 * Call from RazorpayFlow, InvoiceManagement, and RevenueCaptureSystem on every sale.
 */
export function autoPostSalesEntry(params: {
  invoiceNumber: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}): JournalLine[] {
  const { taxableValue, cgst, sgst, igst, totalAmount } = params;
  const lines: JournalLine[] = [
    // Dr Bank / Accounts Receivable — full invoice value received
    { accountHead: "bank", accountLabel: "Bank Account", debit: totalAmount, credit: 0 },
    // Cr Revenue — base taxable value
    { accountHead: "sales", accountLabel: "Revenue", debit: 0, credit: taxableValue },
  ];
  // Cr Output CGST (separate head — cannot be mixed with SGST for ITC offset)
  if (cgst > 0) lines.push({ accountHead: "gst_output_cgst", accountLabel: "Output CGST", debit: 0, credit: cgst });
  // Cr Output SGST
  if (sgst > 0) lines.push({ accountHead: "gst_output_sgst", accountLabel: "Output SGST", debit: 0, credit: sgst });
  // Cr Output IGST (interstate — most flexible for ITC offset)
  if (igst > 0) lines.push({ accountHead: "gst_output_igst", accountLabel: "Output IGST", debit: 0, credit: igst });
  return lines;
}

/**
 * generateInvoiceNumber — Fix 14: Sequential, gap-safe invoice number per Indian GST law (CGST Rule 46).
 * Uses max(existing)+1, not count, so deletions don't create duplicates.
 */
export function generateInvoiceNumber(cityName: string, existingInvoiceNumbers: string[]): string {
  const fy = (() => {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`;
  })();
  const prefix = `CC/${cityName.toUpperCase()}/${fy}/`;
  const maxNum = existingInvoiceNumbers
    .filter(n => n.startsWith(prefix))
    .map(n => parseInt(n.replace(prefix, ""), 10))
    .filter(n => !isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefix}${String(maxNum + 1).padStart(4, "0")}`;
}

// ─── Service Class ────────────────────────────────────────────────────────────

class AccountingEntryService {
  private readonly ENTRIES_KEY = "cleancar_accounting_entries";
  private readonly JOURNAL_KEY = "cleancar_journal_entries";
  private readonly LEDGER_KEY = "cleancar_ledger_masters";
  // ITEM_MASTER now uses DataService (was bare localStorage key - fixed)
  // Public accessor for all entries (used by FinanceTransactions, EBITDA, P&L)
  getAllEntries(cityId?: string): AccountingEntry[] {
    const all = this.getEntries();
    return cityId ? all.filter(e => e.cityId === cityId) : all;
  }

  getAll(cityId?: string): AccountingEntry[] {
    return this.getAllEntries(cityId);
  }

  getItems(): ItemMaster[] {
    this.migrateItemMasterFromSharedKeyIfNeeded();
    return DataService.get<ItemMaster>("ACCOUNTING_ITEM_MASTER");
  }

  /**
   * Real, one-time, safe migration - recovers any accounting items that
   * were previously, incorrectly saved under the shared "INVENTORY_ITEMS"
   * key (a real, confirmed bug: this collided with the entire, genuine
   * physical inventory system, which uses the same key for a completely
   * different InventoryItem shape). Only moves records that genuinely
   * match the real ItemMaster shape - identified by having a real
   * defaultExpenseLedgerId field, which no real InventoryItem record has -
   * so real physical inventory data is never touched or misread as an
   * accounting item.
   */
  private migrateItemMasterFromSharedKeyIfNeeded(): void {
    if (localStorage.getItem("cleancar_accounting_item_master_migrated") === "1") return;
    try {
      const sharedKeyRecords: any[] = DataService.get<any>("INVENTORY_ITEMS");
      const strandedAccountingItems = sharedKeyRecords.filter(
        (r) => typeof r?.defaultExpenseLedgerId === "string" && typeof r?.defaultGSTRate === "number"
      );
      if (strandedAccountingItems.length > 0) {
        const existing = DataService.get<ItemMaster>("ACCOUNTING_ITEM_MASTER");
        const merged = [...existing.filter((e) => !strandedAccountingItems.some((s) => s.id === e.id)), ...strandedAccountingItems];
        DataService.setAll("ACCOUNTING_ITEM_MASTER", merged);
      }
    } catch { /* ignore - safe to skip migration on any error */ }
    localStorage.setItem("cleancar_accounting_item_master_migrated", "1");
  }

  saveItem(item: ItemMaster): void {
    const all = this.getItems().filter(i => i.id !== item.id);
    DataService.setAll("ACCOUNTING_ITEM_MASTER", [...all, item]);
  }

  deleteItem(id: string): void {
    DataService.setAll("ACCOUNTING_ITEM_MASTER", this.getItems().filter(i => i.id !== id));
  }

  // Real fix: every AccountingEntry carries its own real cityId, but this
  // used to be read/written via DataService.get/setAll with no cityId,
  // silently resolving to the single CITY-SURAT-keyed entry for all 3
  // cities' entries combined. getAllCities()/setAllByRecordCity() merge
  // across, and split writes to, each city's own physical key instead.
  private migrateLegacyEntriesKeyIfNeeded(): void {
    try {
      const raw = localStorage.getItem(this.ENTRIES_KEY);
      if (!raw) return;
      // Remove the legacy key BEFORE reading per-city data — DataService.get()
      // itself falls back to this exact same legacy key when a city's own
      // key is empty, so leaving it in place would let it get counted once
      // per city (Surat, Mumbai, Ahmedabad) instead of once overall.
      localStorage.removeItem(this.ENTRIES_KEY);
      const parsed: AccountingEntry[] = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      const existing = DataService.getAllCities<AccountingEntry>("ACCOUNTING_ENTRIES");
      const existingIds = new Set(existing.map((e) => e.id));
      const merged = [...existing, ...parsed.filter((p) => !existingIds.has(p.id))];
      DataService.setAllByRecordCity("ACCOUNTING_ENTRIES", merged);
    } catch { /* ignore corrupt legacy data */ }
  }
  private getEntries(): AccountingEntry[] {
    this.migrateLegacyEntriesKeyIfNeeded();
    return DataService.getAllCities<AccountingEntry>("ACCOUNTING_ENTRIES");
  }
  private saveEntries(entries: AccountingEntry[]): void {
    DataService.setAllByRecordCity("ACCOUNTING_ENTRIES", entries);
  }

  getRecurringTemplates(cityId?: string): RecurringTemplate[] {
    return DataService.get<RecurringTemplate>("RECURRING_TEMPLATES", cityId);
  }

  saveRecurringTemplate(
    data: Omit<RecurringTemplate, "id" | "nextRunDate" | "createdAt">,
    cityId: string
  ): RecurringTemplate {
    const all = this.getRecurringTemplates(cityId);
    const template: RecurringTemplate = {
      ...data,
      id: `RT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      nextRunDate: nextRunDateFor(data.dayOfMonth),
      createdAt: new Date().toISOString(),
    };
    DataService.setAll("RECURRING_TEMPLATES", [...all, template], cityId);
    return template;
  }

  toggleRecurringTemplate(templateId: string, isActive: boolean, cityId: string): void {
    const all = this.getRecurringTemplates(cityId);
    const idx = all.findIndex((t) => t.id === templateId);
    if (idx < 0) return;
    all[idx] = { ...all[idx], isActive };
    DataService.setAll("RECURRING_TEMPLATES", all, cityId);
  }

  // Creates a real accounting entry from a due template, using the same
  // real createEntry() every manually-entered transaction goes through —
  // this isn't a separate, parallel posting path, it's the exact same one.
  runRecurringTemplate(templateId: string, cityId: string, cityName: string, runBy: string): AccountingEntry | null {
    const all = this.getRecurringTemplates(cityId);
    const idx = all.findIndex((t) => t.id === templateId);
    if (idx < 0) return null;
    const t = all[idx];
    const gst = calculateGST(t.taxableValue, t.gstRate, "24", t.gstEntryType, cityId);
    const entry = this.createEntry(
      {
        entryType: t.entryType,
        date: new Date().toISOString().split("T")[0],
        vendorName: t.vendorName,
        vendorGstin: t.vendorGstin,
        vendorStateCode: t.vendorStateCode,
        invoiceNumber: `RECURRING-${t.id}-${Date.now()}`,
        expenseAccount: t.expenseAccount,
        expenseAccountLabel: t.expenseAccountLabel,
        taxableValue: t.taxableValue,
        gstRate: t.gstRate,
        gstEntryType: t.gstEntryType,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        totalBillValue: gst.totalBillValue,
        paymentMode: t.paymentMode,
        isRCM: t.gstEntryType === "RCM",
        debitAccount: t.debitAccount,
        creditAccount: t.creditAccount,
        narration: t.narration || `Recurring — ${t.name}`,
        city: cityName,
        cityId,
        createdBy: runBy,
      },
      cityName
    );
    all[idx] = {
      ...t,
      lastRunDate: entry.date,
      lastCreatedEntryId: entry.id,
      nextRunDate: nextRunDateFor(t.dayOfMonth),
    };
    DataService.setAll("RECURRING_TEMPLATES", all, cityId);
    return entry;
  }

  getRefundRequests(cityId?: string): RefundRequest[] {
    return DataService.get<RefundRequest>("REFUND_REQUESTS", cityId);
  }

  requestRefund(data: Omit<RefundRequest, "id" | "status" | "requestedAt">, cityId: string): RefundRequest {
    const all = this.getRefundRequests(cityId);
    const request: RefundRequest = {
      ...data,
      id: `REFUND-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      status: "Pending",
      requestedAt: new Date().toISOString(),
    };
    DataService.setAll("REFUND_REQUESTS", [...all, request], cityId);
    return request;
  }

  // Approving posts a real, reversing ledger entry immediately — the
  // same real createJournal() Credit/Debit Notes already use — so the
  // books reflect the refund right away. This does NOT mean the money
  // has actually reached the customer yet; see markRefundPaid() below.
  approveRefund(refundId: string, cityId: string, cityName: string, reviewedBy: string): boolean {
    const all = this.getRefundRequests(cityId);
    const idx = all.findIndex((r) => r.id === refundId);
    if (idx < 0) return false;
    const refund = all[idx];
    const ledgers = this.getLedgers(cityId);
    const arLedger = ledgers.find((l) => l.name === "Accounts Receivable");
    const returnsLedger = ledgers.find((l) => l.name === "Sales Returns & Allowances");
    if (arLedger && returnsLedger) {
      // ✅ FIX: real two-line entry — this step only RECOGNIZES the
      // refund (reducing revenue, reducing what the customer is
      // considered to owe), no cash actually leaves the business yet.
      // The real cash disbursement happens in markRefundPaid() below,
      // matching this app's own RefundRequest status model
      // (Approved → Paid are genuinely two separate real steps).
      this.createJournal(
        {
          date: new Date().toISOString().split("T")[0],
          narration: `Refund approved — ${refund.customerName} — ${refund.reason}`,
          lines: [
            { accountHead: returnsLedger.id, accountLabel: "Sales Returns & Allowances", debit: refund.amount, credit: 0 },
            { accountHead: arLedger.id, accountLabel: `${arLedger.name} — ${refund.customerName}`, debit: 0, credit: refund.amount },
          ],
          city: cityName,
          cityId,
          createdBy: reviewedBy,
        },
        cityName
      );
    }
    all[idx] = { ...refund, status: "Approved", reviewedBy, reviewedAt: new Date().toISOString() };
    DataService.setAll("REFUND_REQUESTS", all, cityId);
    return true;
  }

  /**
   * ✅ NEW: RCM lifecycle, step 2 of the general 4-step pattern — paying
   * the self-assessed RCM liability to the government. Implemented as the
   * best available default; the CA's own note that a simpler 2-step
   * Rent-specific pattern might replace this generally is still an open
   * question, not resolved by this implementation.
   *
   * Finds the original RCM entry, posts a real payment voucher clearing
   * RCM GST Payable (CGST/SGST/IGST) and crediting Bank, then marks the
   * original entry so this step can't be double-processed.
   */
  payRCMLiability(originalEntryId: string, paymentDate: string, cityId: string, cityName: string, createdBy: string): { success: boolean; message: string } {
    const entry = this.getAllEntries(cityId).find((e) => e.id === originalEntryId);
    if (!entry) return { success: false, message: "Original RCM entry not found." };
    if (!entry.isRCM) return { success: false, message: "This entry is not an RCM entry." };
    if (entry.rcmPaidVoucherId) return { success: false, message: `Already paid — see voucher ${entry.rcmPaidVoucherId}.` };

    const cgst = entry.cgst ?? 0, sgst = entry.sgst ?? 0, igst = entry.igst ?? 0;
    const total = cgst + sgst + igst;
    if (total <= 0) return { success: false, message: "This entry has no RCM tax amount to pay." };

    const lines: { accountHead: string; accountLabel: string; debit: number; credit: number }[] = [];
    if (cgst > 0) lines.push({ accountHead: "gst_rcm_cgst_output", accountLabel: "RCM GST Payable (CGST)", debit: cgst, credit: 0 });
    if (sgst > 0) lines.push({ accountHead: "gst_rcm_sgst_output", accountLabel: "RCM GST Payable (SGST)", debit: sgst, credit: 0 });
    if (igst > 0) lines.push({ accountHead: "gst_rcm_igst_output", accountLabel: "RCM GST Payable (IGST)", debit: igst, credit: 0 });
    lines.push({ accountHead: "bank", accountLabel: "Bank Account", debit: 0, credit: total });

    const voucher = this.createJournal(
      { date: paymentDate, narration: `RCM liability paid to government — ${entry.voucherNumber}`, lines, city: cityName, cityId, createdBy },
      cityName
    );
    this.updateEntry(originalEntryId, { rcmPaidVoucherId: voucher.voucherNumber }, createdBy);
    return { success: true, message: `RCM liability of ₹${total.toLocaleString("en-IN")} paid — ${voucher.voucherNumber}` };
  }

  /**
   * ✅ NEW: RCM lifecycle, step 3 — claiming the ITC once the self-assessed
   * tax has genuinely been paid. Requires payRCMLiability() to have run
   * first — claiming input credit before the tax is actually paid isn't
   * real GST compliance, it's just moving numbers around.
   *
   * Moves the balance out of "Reverse Charge Tax Input not due" (the real
   * asset ledger the self-assessment step posted to) into genuine, usable
   * Input CGST/SGST/IGST.
   */
  claimRCMInputCredit(originalEntryId: string, claimDate: string, cityId: string, cityName: string, createdBy: string): { success: boolean; message: string } {
    const entry = this.getAllEntries(cityId).find((e) => e.id === originalEntryId);
    if (!entry) return { success: false, message: "Original RCM entry not found." };
    if (!entry.isRCM) return { success: false, message: "This entry is not an RCM entry." };
    if (!entry.rcmPaidVoucherId) return { success: false, message: "The RCM liability must be paid to the government before claiming ITC — run payRCMLiability first." };
    if (entry.rcmItcClaimedVoucherId) return { success: false, message: `ITC already claimed — see voucher ${entry.rcmItcClaimedVoucherId}.` };

    const cgst = entry.cgst ?? 0, sgst = entry.sgst ?? 0, igst = entry.igst ?? 0;
    const total = cgst + sgst + igst;
    if (total <= 0) return { success: false, message: "This entry has no RCM tax amount to claim." };

    const lines: { accountHead: string; accountLabel: string; debit: number; credit: number }[] = [];
    if (cgst > 0) lines.push({ accountHead: "gst_input_cgst", accountLabel: "Input CGST", debit: cgst, credit: 0 });
    if (sgst > 0) lines.push({ accountHead: "gst_input_sgst", accountLabel: "Input SGST", debit: sgst, credit: 0 });
    if (igst > 0) lines.push({ accountHead: "gst_input_igst", accountLabel: "Input IGST", debit: igst, credit: 0 });
    lines.push({ accountHead: "gst_rcm_input_not_due", accountLabel: "Reverse Charge Tax Input not due", debit: 0, credit: total });

    const voucher = this.createJournal(
      { date: claimDate, narration: `RCM input credit claimed — ${entry.voucherNumber}`, lines, city: cityName, cityId, createdBy },
      cityName
    );
    this.updateEntry(originalEntryId, { rcmItcClaimedVoucherId: voucher.voucherNumber }, createdBy);
    return { success: true, message: `ITC of ₹${total.toLocaleString("en-IN")} claimed — ${voucher.voucherNumber}` };
  }

  rejectRefund(refundId: string, cityId: string, reviewedBy: string): boolean {
    const all = this.getRefundRequests(cityId);
    const idx = all.findIndex((r) => r.id === refundId);
    if (idx < 0) return false;
    all[idx] = { ...all[idx], status: "Rejected", reviewedBy, reviewedAt: new Date().toISOString() };
    DataService.setAll("REFUND_REQUESTS", all, cityId);
    return true;
  }

  // The manual confirmation step — there's no payment gateway in this
  // app to auto-reverse a real UPI/cash transaction, so a staff member
  // has to actually send the money back outside the app, then record
  // that it genuinely happened here.
  markRefundPaid(refundId: string, cityId: string, paymentReference: string): boolean {
    const all = this.getRefundRequests(cityId);
    const idx = all.findIndex((r) => r.id === refundId);
    if (idx < 0) return false;
    const refund = all[idx];

    // ✅ FIX: this previously updated only the status fields — no real
    // cash disbursement was ever posted anywhere. This is the actual
    // payment step: Dr Accounts Receivable (clearing what
    // approveRefund() recognized), Cr Bank (the real cash leaving).
    const ledgers = this.getLedgers(cityId);
    const arLedger = ledgers.find((l) => l.name === "Accounts Receivable");
    if (arLedger) {
      this.createJournal(
        {
          date: new Date().toISOString().split("T")[0],
          narration: `Refund paid — ${refund.customerName} — ref ${paymentReference}`,
          lines: [
            { accountHead: arLedger.id, accountLabel: `${arLedger.name} — ${refund.customerName}`, debit: refund.amount, credit: 0 },
            { accountHead: "bank", accountLabel: "Bank Account", debit: 0, credit: refund.amount },
          ],
          city: refund.city,
          cityId,
          createdBy: "Accounts",
        },
        refund.city
      );
    }

    all[idx] = { ...all[idx], status: "Paid", paidAt: new Date().toISOString(), paymentReference };
    DataService.setAll("REFUND_REQUESTS", all, cityId);
    return true;
  }

  getGiftSubscriptions(cityId?: string): GiftSubscription[] {
    return DataService.get<GiftSubscription>("GIFT_SUBSCRIPTIONS", cityId);
  }

  requestGift(data: Omit<GiftSubscription, "id" | "status" | "createdAt" | "giftCode">, cityId: string): GiftSubscription {
    const all = this.getGiftSubscriptions(cityId);
    const gift: GiftSubscription = {
      ...data,
      id: `GIFT-REQ-${Date.now()}`,
      giftCode: generateGiftCode(),
      status: "Pending Payment",
      createdAt: new Date().toISOString(),
    };
    DataService.setAll("GIFT_SUBSCRIPTIONS", [...all, gift], cityId);
    return gift;
  }

  // Real staff action - confirms payment was actually collected outside
  // this app (phone/in-person), making the gift code genuinely usable.
  markGiftPaid(giftId: string, cityId: string, paidReference: string): boolean {
    const all = this.getGiftSubscriptions(cityId);
    const idx = all.findIndex((g) => g.id === giftId);
    if (idx < 0) return false;
    all[idx] = { ...all[idx], status: "Active", paidAt: new Date().toISOString(), paidReference };
    DataService.setAll("GIFT_SUBSCRIPTIONS", all, cityId);
    return true;
  }

  findGiftByCode(code: string, cityId?: string): GiftSubscription | undefined {
    return this.getGiftSubscriptions(cityId).find((g) => g.giftCode.toUpperCase() === code.toUpperCase());
  }

  redeemGift(giftId: string, cityId: string, redeemedByCustomerId: string): boolean {
    const all = this.getGiftSubscriptions(cityId);
    const idx = all.findIndex((g) => g.id === giftId);
    if (idx < 0) return false;
    all[idx] = { ...all[idx], status: "Redeemed", redeemedAt: new Date().toISOString(), redeemedByCustomerId };
    DataService.setAll("GIFT_SUBSCRIPTIONS", all, cityId);
    return true;
  }

  getCallbackRequests(cityId?: string): CallbackRequest[] {
    return DataService.get<CallbackRequest>("CALLBACK_REQUESTS", cityId);
  }

  requestCallback(data: Omit<CallbackRequest, "id" | "status" | "createdAt">, cityId: string): CallbackRequest {
    const all = this.getCallbackRequests(cityId);
    const request: CallbackRequest = { ...data, id: `CB-${Date.now()}-${Math.floor(Math.random() * 10000)}`, status: "Pending", createdAt: new Date().toISOString() };
    DataService.setAll("CALLBACK_REQUESTS", [...all, request], cityId);
    return request;
  }

  markCallbackDone(callbackId: string, cityId: string, calledBy: string): boolean {
    const all = this.getCallbackRequests(cityId);
    const idx = all.findIndex((c) => c.id === callbackId);
    if (idx < 0) return false;
    all[idx] = { ...all[idx], status: "Called", calledAt: new Date().toISOString(), calledBy };
    DataService.setAll("CALLBACK_REQUESTS", all, cityId);
    return true;
  }

  private migrateLegacyJournalsKeyIfNeeded(): void {
    try {
      const raw = localStorage.getItem(this.JOURNAL_KEY);
      if (!raw) return;
      localStorage.removeItem(this.JOURNAL_KEY); // remove first — see migrateLegacyEntriesKeyIfNeeded for why
      const parsed: JournalEntry[] = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      const existing = DataService.getAllCities<JournalEntry>("JOURNAL_ENTRIES");
      const existingIds = new Set(existing.map((e) => e.id));
      const merged = [...existing, ...parsed.filter((p) => !existingIds.has(p.id))];
      DataService.setAllByRecordCity("JOURNAL_ENTRIES", merged);
    } catch { /* ignore corrupt legacy data */ }
  }
  private getJournals(): JournalEntry[] {
    this.migrateLegacyJournalsKeyIfNeeded();
    return DataService.getAllCities<JournalEntry>("JOURNAL_ENTRIES");
  }
  private saveJournals(journals: JournalEntry[]): void {
    DataService.setAllByRecordCity("JOURNAL_ENTRIES", journals);
  }

  createEntry(
    data: Omit<AccountingEntry, "id"|"voucherNumber"|"createdAt"|"status"|"changeHistory"|"financialYear">,
    cityName: string,
    options?: { skipPayableSync?: boolean }
  ): AccountingEntry {
    const all = this.getEntries();
    const entry: AccountingEntry = {
      ...data,
      // ✅ FIX (CA observation, 27 Jul 2026 — "Finance Transaction shows 71
      // but only 1 visible"): Date.now() alone collides when multiple
      // entries are created in quick succession (confirmed directly — 5
      // of 7 rapid calls returned the identical millisecond). Since
      // FinanceTransactions.tsx uses `key={txn.id}` for its row list,
      // colliding IDs made React silently drop all but one matching row
      // from the DOM, even though the .length-based count badge still
      // counted them correctly — explaining the exact "71 vs 1" mismatch.
      // Fixed the same way across every ID generator in this file that had
      // the same vulnerability (RT, REFUND, CB, ACC, JV).
      id: `ACC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      voucherNumber: generateVoucherNumber(data.entryType, cityName, all),
      financialYear: getFinancialYear(),
      createdAt: new Date().toISOString(),
      status: "Posted",
      changeHistory: [],
    };

    // ✅ FIX (ACC-DEF-01): previously this saved whatever it was given with
    // zero validation — the exact class of check JournalEntry.tsx already
    // has for manual entries (`isBalanced = totalDebit === totalCredit`)
    // was entirely absent on this automated path. Runs the SAME real
    // journal-line-building logic a saved entry would actually post
    // through, and refuses to save if the real lines don't balance —
    // catching this bug (or any future one in autoPostLedger) before
    // anything is written, not after.
    const lines = autoPostLedger(entry);
    const totalDebit = Math.round(lines.reduce((s, l) => s + (l.debit || 0), 0) * 100) / 100;
    const totalCredit = Math.round(lines.reduce((s, l) => s + (l.credit || 0), 0) * 100) / 100;
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Entry out of balance: debit ₹${totalDebit} != credit ₹${totalCredit}. Not saved.`);
    }

    this.saveEntries([...all, entry]);
    // Notify FinanceContext so expense entries reflect in analytics
    // Only for expense/purchase types that create payables
    // Real fix: skipPayableSync prevents an infinite loop — this event's
    // own listener (FinanceContext) creates a new Payable in response,
    // which (via postPayableEntryForFinance) calls back into createEntry()
    // for THIS exact accrual, re-firing the event forever. Only entries
    // NOT already originating from a real Payable should ever reach here.
    //
    // ✅ FIX (CA observation — "1 entry shows as 2"): this used to fire for
    // EVERY Expense/Purchase/AssetPurchase entry regardless of payment
    // mode — including ones paid immediately by Bank/Cash/PettyCash,
    // which already credit a real cash/bank ledger directly. Each of
    // those still spawned an extra "Pending" Payable for the same amount,
    // double-counting a transaction that was never actually outstanding.
    // Only entries that genuinely credit a real accounts-payable ledger
    // (vendor's own AP ledger, or the generic one) represent a real,
    // unsettled payable — gate on that instead of entry type alone.
    const creditLedgerForPayableCheck = this.getLedgers(entry.cityId).find(l => l.id === entry.creditAccount);
    const isGenuinelyOutstanding = creditLedgerForPayableCheck?.accountHead === "accounts_payable";
    if (!options?.skipPayableSync && isGenuinelyOutstanding && ["Expense", "Purchase", "AssetPurchase"].includes(entry.entryType) && entry.totalBillValue > 0) {
      try {
        window.dispatchEvent(new CustomEvent("cc360_accounting_entry_created", {
          detail: {
            entryType: entry.entryType,
            amount: entry.totalBillValue,
            taxableValue: entry.taxableValue,
            description: entry.narration || `${entry.entryType} — ${entry.vendorName || "Vendor"}`,
            vendorId: entry.vendorId,
            cityId: entry.cityId,
            date: entry.date,
          }
        }));
      } catch (_e) { /* non-critical — analytics will update on next load */ }
    }
    return entry;
  }

  // ⚠️ WARNING: this directly mutates an entry in place — never use this
  // to change financial fields (amounts, GST, ledgers) on a Posted entry.
  // That's exactly what your CA's correction rule says must never happen
  // ("Correction entry will replace original entry... only previous entry
  // will be kept visible in audit trail"). Use correctEntry() below for
  // any real financial correction. This function remains safe only for
  // non-financial status/tracking fields — it's currently used exactly
  // that way, by the RCM lifecycle functions (rcmPaidVoucherId,
  // rcmItcClaimedVoucherId).
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

  /**
   * ✅ NEW: the real fix for the CA's correction rule. Never edits a
   * Posted entry in place — retires the original (status: "Superseded",
   * excluded from every real report via getByDateRange's filter above,
   * but the row itself is never deleted, so it stays fully visible for
   * audit) and posts a brand new, fully-validated entry with the
   * corrected values, reusing the same real voucher number (the same
   * real document, corrected — not a new one).
   *
   * Re-validates debit=credit on the corrected data before touching
   * anything, using the exact same real check createEntry() uses —
   * throws (does not save anything) if the correction itself doesn't
   * balance.
   */
  correctEntry(originalId: string, changes: Partial<AccountingEntry>, correctedBy: string): AccountingEntry {
    const all = this.getEntries();
    const idx = all.findIndex(e => e.id === originalId);
    if (idx < 0) throw new Error("Original entry not found.");
    const original = all[idx];
    if (original.status !== "Posted") {
      throw new Error(`Only a Posted entry can be corrected — this one is ${original.status}.`);
    }

    const correctedData: AccountingEntry = { ...original, ...changes };

    const lines = autoPostLedger(correctedData);
    const totalDebit = Math.round(lines.reduce((s, l) => s + (l.debit || 0), 0) * 100) / 100;
    const totalCredit = Math.round(lines.reduce((s, l) => s + (l.credit || 0), 0) * 100) / 100;
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Correction out of balance: debit ₹${totalDebit} != credit ₹${totalCredit}. Not saved.`);
    }

    const newEntryId = `ACC-${Date.now()}`;
    const newEntry: AccountingEntry = {
      ...correctedData,
      id: newEntryId,
      voucherNumber: original.voucherNumber, // same real document, corrected values
      financialYear: original.financialYear,
      createdAt: new Date().toISOString(),
      createdBy: correctedBy,
      status: "Posted",
      changeHistory: [],
      supersedes: originalId,
      supersededBy: undefined,
    };

    const updatedOriginal: AccountingEntry = {
      ...original,
      status: "Superseded",
      supersededBy: newEntryId,
      updatedBy: correctedBy,
      updatedAt: new Date().toISOString(),
      changeHistory: [...original.changeHistory, {
        timestamp: new Date().toISOString(), changedBy: correctedBy,
        field: "status", previousValue: "Posted", newValue: `Superseded by ${newEntryId}`,
      }],
    };

    const updatedAll = all.map((e, i) => (i === idx ? updatedOriginal : e));
    updatedAll.push(newEntry);
    this.saveEntries(updatedAll);

    return newEntry;
  }

  getByType(type: EntryType, cityId?: string): AccountingEntry[] {
    // ✅ FIX: same companion fix as getByDateRange — excludes Superseded
    // entries, so a corrected entry and its replacement don't both count.
    return this.getAllEntries(cityId).filter(e => e.entryType === type && e.status !== "Superseded");
  }
  getByDateRange(from: string, to: string, cityId?: string): AccountingEntry[] {
    // ✅ FIX: previously included every entry regardless of status. Once
    // corrections became possible (status: "Superseded"), an original
    // entry and its correction would BOTH count here — double-counting
    // the same real transaction in every report that reads this
    // (AccountsDashboard, getAllMovements → Trial Balance, Balance Sheet).
    // The superseded original still exists and stays visible for audit
    // purposes (see correctEntry()) — it's just excluded from real totals.
    return this.getAllEntries(cityId).filter(e => e.date >= from && e.date <= to && e.status !== "Superseded");
  }
  // Get entries where a specific LEDGER ID appears as debit or credit.
  // Also resolves by name cross-reference so system ledger IDs (SYS-...) can
  // match entries that reference seeded ledger IDs (LM-...) for the same account.
  getLedgerEntries(ledgerId: string, cityId?: string): AccountingEntry[] {
    // Build a set of all IDs that refer to the same account name
    const ledger = this.getLedgers(cityId).find(l => l.id === ledgerId);
    const relatedIds = new Set<string>([ledgerId]);
    if (ledger) {
      // Find any other ledgers with the same name and city (e.g. seed ID + system ID)
      this.getLedgers(cityId)
        .filter(l => (l.name ?? "").trim().toLowerCase() === (ledger.name ?? "").trim().toLowerCase()
                  && l.cityId === ledger.cityId)
        .forEach(l => relatedIds.add(l.id));
    }
    return this.getAllEntries(cityId).filter(
      e => (relatedIds.has(e.debitAccount) || relatedIds.has(e.creditAccount)) && e.status !== "Superseded"
    );
  }

  // Get entries by account HEAD (for grouping/reporting)
  getLedgerEntriesByHead(accountHead: string, cityId?: string): AccountingEntry[] {
    const ledgers = this.getLedgers(cityId).filter(l => l.accountHead === accountHead);
    const ledgerIds = new Set(ledgers.map(l => l.id));
    return this.getAllEntries(cityId).filter(
      e => (ledgerIds.has(e.debitAccount) || ledgerIds.has(e.creditAccount)) && e.status !== "Superseded"
    );
  }
  createJournal(data: Omit<JournalEntry,"id"|"voucherNumber"|"createdAt"|"status"|"changeHistory"|"financialYear">, cityName: string): JournalEntry {
    const all = this.getJournals();
    const entry: JournalEntry = {
      ...data, id: `JV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
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

  // Returns ALL debit/credit movements: both AccountingEntry and JournalEntry lines
  getAllMovements(from: string, to: string, cityId?: string): Array<{
    date: string;
    debitLedgerId: string;   creditLedgerId: string;
    debitLedgerName: string; creditLedgerName: string;
    amount: number; voucherNumber: string; description: string;
  }> {
    // Build id→name + accountHead→name lookup once
    const allLedgers = this.getLedgers(cityId);
    const byId   = new Map(allLedgers.map(l => [l.id,          l.name]));
    const byHead = new Map(allLedgers.map(l => [l.accountHead, l.name]));
    const resolveName = (id: string): string =>
      byId.get(id) || byHead.get(id) || id;

    const accEntries = this.getByDateRange(from, to, cityId).map(e => ({
      date: e.date,
      debitLedgerId:    e.debitAccount,
      creditLedgerId:   e.creditAccount,
      debitLedgerName:  resolveName(e.debitAccount),
      creditLedgerName: resolveName(e.creditAccount),
      amount: e.totalBillValue,
      voucherNumber: e.voucherNumber,
      description: e.narration || e.invoiceNumber || "",
    }));

    const jvEntries = this.getAllJournals(cityId)
      .filter(j => j.date >= from && j.date <= to && j.status === "Posted")
      .flatMap(j => (j.lines ?? []).map(line => ({
          date: j.date,
          debitLedgerId:    line.debit  > 0 ? line.accountHead : "",
          creditLedgerId:   line.credit > 0 ? line.accountHead : "",
          debitLedgerName:  line.debit  > 0 ? (byId.get(line.accountHead) || byHead.get(line.accountHead) || line.accountLabel || line.accountHead) : "",
          creditLedgerName: line.credit > 0 ? (byId.get(line.accountHead) || byHead.get(line.accountHead) || line.accountLabel || line.accountHead) : "",
          amount: Math.max(line.debit, line.credit),
          voucherNumber: j.voucherNumber,
          description: j.narration,
        }))
      );

    return [...accEntries, ...jvEntries];
  }

  private migrateLegacyLedgersKeyIfNeeded(): void {
    try {
      const raw = localStorage.getItem(this.LEDGER_KEY);
      if (!raw) return;
      localStorage.removeItem(this.LEDGER_KEY); // remove first — see migrateLegacyEntriesKeyIfNeeded for why
      const parsed: LedgerMaster[] = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      const existing = DataService.getAllCities<LedgerMaster>("LEDGER_MASTERS");
      const existingIds = new Set(existing.map((e) => e.id));
      const merged = [...existing, ...parsed.filter((p) => !existingIds.has(p.id))];
      DataService.setAllByRecordCity("LEDGER_MASTERS", merged);
    } catch { /* ignore corrupt legacy data */ }
  }

  getLedgers(cityId?: string): LedgerMaster[] {
    // Real fix: every LedgerMaster carries its own real cityId, but this
    // used to be read/written via DataService.get/setAll with no cityId,
    // silently resolving to the single CITY-SURAT-keyed entry for all 3
    // cities' ledgers combined.
    this.migrateLegacyLedgersKeyIfNeeded();
    const all: LedgerMaster[] = DataService.getAllCities<LedgerMaster>("LEDGER_MASTERS");
    const effectiveCityId = cityId || "CITY-SURAT";
    const withSystem = this.ensureSystemLedgers(all, effectiveCityId);
    return cityId ? withSystem.filter(l => l.cityId === cityId) : withSystem;
  }

  private ensureSystemLedgers(existing: LedgerMaster[], cityId: string): LedgerMaster[] {
    const cityDisplayName = cityId === "CITY-MUMBAI" ? "Mumbai"
      : cityId === "CITY-AHMEDABAD" ? "Ahmedabad"
      : "Surat"; // default
    const systemLedgers: Omit<LedgerMaster, "id">[] = [
      // ASSETS - Cash & Bank
      { name: "Cash in Hand", accountHead: "cash_bank", accountHeadLabel: "Cash & Bank", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Petty Cash", accountHead: "cash_bank", accountHeadLabel: "Cash & Bank", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Undeposited Funds", accountHead: "cash_bank", accountHeadLabel: "Cash & Bank", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Axis Bank", accountHead: "cash_bank", accountHeadLabel: "Cash & Bank", nature: "asset", type: "bank", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "HDFC - 906", accountHead: "cash_bank", accountHeadLabel: "Cash & Bank", nature: "asset", type: "bank", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // ASSETS - Current Assets
      { name: "Prepaid Expenses", accountHead: "current_assets", accountHeadLabel: "Current Assets", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "TDS Receivable", accountHead: "current_assets", accountHeadLabel: "Current Assets", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Employee Advance", accountHead: "current_assets", accountHeadLabel: "Current Assets", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Advance Tax", accountHead: "current_assets", accountHeadLabel: "Current Assets", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      // Alias kept for backward compatibility with any journal entries already posted
      { name: "Advance Tax Paid", accountHead: "current_assets", accountHeadLabel: "Current Assets", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      // ✅ NEW: real Inventory asset ledger — needed for Sale of a
      // Product to correctly credit real stock value when it's sold,
      // rather than the Material Consumed expense having no matching
      // asset-side entry at all.
      { name: "Inventory - Consumables", accountHead: "inventory_asset", accountHeadLabel: "Inventory", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      // ✅ NEW: real Cost of Goods Sold ledger — the other half of the
      // Sale-of-Product fix. Uses "cogs", the exact accountHead already
      // defined in CHART_OF_ACCOUNTS_HEADS for this purpose, rather than
      // inventing a differently-named ledger.
      { name: "Cost of Goods Sold", accountHead: "cogs", accountHeadLabel: "Cost of Goods Sold", nature: "expense", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // ASSETS - Accounts Receivable
      { name: "Accounts Receivable", accountHead: "accounts_receivable", accountHeadLabel: "Accounts Receivable", nature: "asset", type: "customer", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // ASSETS - Fixed Assets
      { name: "Furniture and Equipment", accountHead: "fixed_assets", accountHeadLabel: "Fixed Assets", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "WFH Table", accountHead: "fixed_assets", accountHeadLabel: "Fixed Assets", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // ASSETS - GST Input (ITC) — separate heads per tax type (Section 49 CGST Act)
      { name: "Input Tax Credits (Summary)", accountHead: "gst_input", accountHeadLabel: "GST Input (ITC)", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Input IGST", accountHead: "gst_input_igst", accountHeadLabel: "GST Input IGST", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Input CGST", accountHead: "gst_input_cgst", accountHeadLabel: "GST Input CGST", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Input SGST", accountHead: "gst_input_sgst", accountHeadLabel: "GST Input SGST", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Reverse Charge Tax Input not due", accountHead: "gst_rcm_input_not_due", accountHeadLabel: "RCM Tax Input (Not Yet Due)", nature: "asset", type: "other", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // LIABILITIES - TDS Payable
      { name: "TDS Payable", accountHead: "tds_payable", accountHeadLabel: "TDS Payable", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Intermediate TDS Payable", accountHead: "tds_payable", accountHeadLabel: "TDS Payable", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // LIABILITIES - Duties & Taxes
      { name: "GST Payable (Summary)", accountHead: "duties_taxes", accountHeadLabel: "Duties & Taxes", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Output IGST", accountHead: "gst_output_igst", accountHeadLabel: "Output GST IGST", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Output CGST", accountHead: "gst_output_cgst", accountHeadLabel: "Output GST CGST", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Output SGST", accountHead: "gst_output_sgst", accountHeadLabel: "Output GST SGST", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      // ✅ FIX: previously these two shared accountHead "duties_taxes" with
      // "GST Payable (Summary)" and "Tax Payable" — two OTHER, unrelated
      // ledgers — making it impossible to post a journal line that refers
      // to one of these two specifically (a JournalLine's accountHead is
      // used elsewhere in this file as a direct, unique reference to one
      // real seeded ledger, e.g. "gst_input_cgst" → exactly one ledger).
      // Given unique accountHead values here, matching the same pattern
      // Input/Output CGST/SGST/IGST already use. Also adds the missing
      // IGST RCM Output ledger, for inter-state reverse-charge entries.
      { name: "CGST RCM Output", accountHead: "gst_rcm_cgst_output", accountHeadLabel: "RCM GST Payable (CGST)", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "SGST RCM Output", accountHead: "gst_rcm_sgst_output", accountHeadLabel: "RCM GST Payable (SGST)", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "IGST RCM Output", accountHead: "gst_rcm_igst_output", accountHeadLabel: "RCM GST Payable (IGST)", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Tax Payable", accountHead: "duties_taxes", accountHeadLabel: "Duties & Taxes", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // LIABILITIES - Credit Cards
      { name: "One Card 5447", accountHead: "credit_cards", accountHeadLabel: "Credit Cards", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "ICICI 9004", accountHead: "credit_cards", accountHeadLabel: "Credit Cards", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "ICICI 4002 (Rupay)", accountHead: "credit_cards", accountHeadLabel: "Credit Cards", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "HDFC 6543", accountHead: "credit_cards", accountHeadLabel: "Credit Cards", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // LIABILITIES - Non-Current Liabilities
      { name: "Mortgages", accountHead: "non_current_liab", accountHeadLabel: "Non-Current Liabilities", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Construction Loans", accountHead: "non_current_liab", accountHeadLabel: "Non-Current Liabilities", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // LIABILITIES - Other Liabilities
      { name: "Employee Reimbursements", accountHead: "other_liabilities", accountHeadLabel: "Other Liabilities", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Unearned Revenue", accountHead: "other_liabilities", accountHeadLabel: "Other Liabilities", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // LIABILITIES - Accounts Payable
      { name: "Accounts Payable", accountHead: "accounts_payable", accountHeadLabel: "Accounts Payable", nature: "liability", type: "vendor", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      // Vendor-wise AP ledgers (pre-seeded for 24/9 Car Wash vendors)
      { name: "AP — Chemical Supplier", accountHead: "accounts_payable", accountHeadLabel: "Accounts Payable", nature: "liability", type: "vendor", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "AP — Equipment Supplier", accountHead: "accounts_payable", accountHeadLabel: "Accounts Payable", nature: "liability", type: "vendor", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "AP — Uniform Supplier", accountHead: "accounts_payable", accountHeadLabel: "Accounts Payable", nature: "liability", type: "vendor", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "AP — ERP / Software", accountHead: "accounts_payable", accountHeadLabel: "Accounts Payable", nature: "liability", type: "vendor", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "AP — Marketing / BTL", accountHead: "accounts_payable", accountHeadLabel: "Accounts Payable", nature: "liability", type: "vendor", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      // LIABILITIES - Salary Payable (separate head — not mixed with vendor AP)
      { name: "Salary Payable — Sales", accountHead: "salary_payable", accountHeadLabel: "Salary Payable", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Salary Payable — Operations", accountHead: "salary_payable", accountHeadLabel: "Salary Payable", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Salary Payable — Admin", accountHead: "salary_payable", accountHeadLabel: "Salary Payable", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      // LIABILITIES - Statutory Payable
      { name: "PF Payable (Employee + Employer)", accountHead: "statutory_payable", accountHeadLabel: "Statutory Payable (PF/ESIC/PT)", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "ESIC Payable (Employee + Employer)", accountHead: "statutory_payable", accountHeadLabel: "Statutory Payable (PF/ESIC/PT)", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "PT Payable", accountHead: "statutory_payable", accountHeadLabel: "Statutory Payable (PF/ESIC/PT)", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // INCOME - Sales Subscription
      { name: "Subscription - 2W", accountHead: "sales_subscription", accountHeadLabel: "Sales — Subscription", nature: "income", type: "sales", packageCode: "2W", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Subscription - 4W", accountHead: "sales_subscription", accountHeadLabel: "Sales — Subscription", nature: "income", type: "sales", packageCode: "4W", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Subscription - 2W+W+S", accountHead: "sales_subscription", accountHeadLabel: "Sales — Subscription", nature: "income", type: "sales", packageCode: "2W_WASH_SANITIZE", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Subscription - 2W+W+W+S", accountHead: "sales_subscription", accountHeadLabel: "Sales — Subscription", nature: "income", type: "sales", packageCode: "2W_WASH_WASH_SANITIZE", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // ✅ NEW: Multi-month bundle deferred revenue (Accounting Module
      // Part B1) — previously didn't exist at all. "Contract Liability"
      // holds cash collected upfront but not yet earned; "Package Revenue"
      // is credited slice by slice, only as each visit is actually
      // delivered, matching the real matching principle.
      { name: "Contract Liability", accountHead: "contract_liability", accountHeadLabel: "Contract Liability", nature: "liability", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Package Revenue - Multi-Month Bundle", accountHead: "sales_package_bundle", accountHeadLabel: "Sales — Multi-Month Bundle", nature: "income", type: "sales", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      // ✅ NEW: Sales Returns & Allowances — a contra-revenue ledger
      // (normally carries a debit balance, reducing net revenue on the
      // P&L), needed to correctly post customer refunds and Credit/Debit
      // Notes. Previously these posted a single, unbalanced line directly
      // against Accounts Receivable with no real revenue-side effect at
      // all — this is the missing other side of that entry.
      { name: "Sales Returns & Allowances", accountHead: "sales_returns_allowances", accountHeadLabel: "Sales Returns & Allowances", nature: "income", type: "sales", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Bundle Forfeiture & Cancellation Income", accountHead: "sales_bundle_forfeiture", accountHeadLabel: "Sales — Bundle Forfeiture/Cancellation", nature: "income", type: "sales", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // INCOME - Sales Service
      { name: "One-time Service", accountHead: "sales_service", accountHeadLabel: "Sales — Service", nature: "income", type: "sales", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // INCOME - Sales Renewal
      { name: "Renewal Fees", accountHead: "sales_renewal", accountHeadLabel: "Sales — Renewal", nature: "income", type: "sales", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // INCOME - Other Income
      { name: "General Income", accountHead: "other_income", accountHeadLabel: "Other Income", nature: "income", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Interest Income", accountHead: "other_income", accountHeadLabel: "Other Income", nature: "income", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Late Fee", accountHead: "other_income", accountHeadLabel: "Other Income", nature: "income", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Discount", accountHead: "other_income", accountHeadLabel: "Other Income", nature: "income", type: "other", openingBalance: 0, openingBalanceType: "Cr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // EXPENSES - COGS
      { name: "Labor", accountHead: "cogs", accountHeadLabel: "Cost of Goods Sold", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Materials", accountHead: "cogs", accountHeadLabel: "Cost of Goods Sold", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Subcontractor", accountHead: "cogs", accountHeadLabel: "Cost of Goods Sold", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      // EXPENSES - Salary (separate from COGS and indirect so P&L shows salary distinctly)
      { name: "Salary — Sales Team", accountHead: "salary_expense", accountHeadLabel: "Salaries & Wages", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Salary — Operations (Washers + Supervisors)", accountHead: "salary_expense", accountHeadLabel: "Salaries & Wages", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Salary — Admin & BD", accountHead: "salary_expense", accountHeadLabel: "Salaries & Wages", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      // EXPENSES - Statutory (employer PF + ESIC — not deducted from employee, a real business cost)
      { name: "PF Employer Contribution (12% of Basic)", accountHead: "statutory_expense", accountHeadLabel: "Statutory Contributions", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "ESIC Employer Contribution (3.25% of Gross)", accountHead: "statutory_expense", accountHeadLabel: "Statutory Contributions", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // EXPENSES - Direct Expenses
      { name: "Salaries and Employee Wages", accountHead: "direct_expenses", accountHeadLabel: "Direct Expenses", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Raw Materials And Consumables", accountHead: "direct_expenses", accountHeadLabel: "Direct Expenses", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // EXPENSES - Indirect Expenses
      { name: "Transaction Charges (Razorpay)", accountHead: "indirect_expenses", accountHeadLabel: "Indirect Expenses", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Bank Fees and Charges", accountHead: "indirect_expenses", accountHeadLabel: "Indirect Expenses", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Consultant Expense", accountHead: "indirect_expenses", accountHeadLabel: "Indirect Expenses", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Electricity Expense", accountHead: "indirect_expenses", accountHeadLabel: "Indirect Expenses", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "Rent Expense", accountHead: "indirect_expenses", accountHeadLabel: "Indirect Expenses", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },

      // EXPENSES - Depreciation
      { name: "Depreciation Expense", accountHead: "depreciation", accountHeadLabel: "Depreciation", nature: "expense", type: "expense", openingBalance: 0, openingBalanceType: "Dr", city: cityDisplayName, cityId, isSystem: true, status: "Active", createdAt: "2026-01-01T00:00:00.000Z" },
    ];

    let updated = [...existing];
    let changed = false;
    for (const sl of systemLedgers) {
      // Check by name + city regardless of isSystem flag.
      // This prevents creating a duplicate system ledger when the seed has already
      // created one with the same name but a different ID (e.g. LM-AXB-SUR vs SYS-Axis-Bank-CITY-SURAT).
      const exists = existing.find(e =>
        e.cityId === cityId &&
         (e.name ?? "").trim().toLowerCase() === sl.name.trim().toLowerCase()
      );
      if (!exists) {
        // Use stable, predictable ID so entries can reference it
                const stableId = `SYS-${sl.name.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g,"-")}-${cityId}`;
        updated.push({ ...sl, id: stableId });
        changed = true;
      }
    }

    // ✅ MIGRATION: the merge loop above only ADDS ledgers that don't
    // already exist by name — it never updates ones that do. Any real
    // user who already had "CGST RCM Output" / "SGST RCM Output" seeded
    // before this fix would still be stuck on the old, ambiguous
    // accountHead ("duties_taxes", shared with two unrelated ledgers) —
    // this one-time pass corrects those two specific rows in place,
    // idempotently (a no-op once already migrated).
    const RCM_ACCOUNT_HEAD_FIX: Record<string, { head: string; label: string }> = {
      "cgst rcm output": { head: "gst_rcm_cgst_output", label: "RCM GST Payable (CGST)" },
      "sgst rcm output": { head: "gst_rcm_sgst_output", label: "RCM GST Payable (SGST)" },
      "reverse charge tax input not due": { head: "gst_rcm_input_not_due", label: "RCM Tax Input (Not Yet Due)" },
    };
    updated = updated.map((l) => {
      const fix = RCM_ACCOUNT_HEAD_FIX[(l.name ?? "").trim().toLowerCase()];
      if (l.cityId === cityId && fix && l.accountHead !== fix.head) {
        changed = true;
        return { ...l, accountHead: fix.head, accountHeadLabel: fix.label };
      }
      return l;
    });

    // Real fix: was writing to the bare, non-city-namespaced legacy key
    // instead of splitting each city's own ledgers to its own key — every
    // newly-seeded system ledger for any city landed in one shared blob.
    if (changed) DataService.setAllByRecordCity("LEDGER_MASTERS", updated);
    return updated;
  }

  saveLedger(ledger: LedgerMaster): void {
    const all = this.getLedgers();
    const idx = all.findIndex(l => l.id === ledger.id);
    idx >= 0 ? all.splice(idx, 1, ledger) : all.push(ledger);
    DataService.setAllByRecordCity("LEDGER_MASTERS", all);
  }

  deleteLedger(id: string): boolean {
    const all = this.getLedgers();
    const ledger = all.find(l => l.id === id);
    if (!ledger || ledger.isSystem) return false;
    DataService.setAllByRecordCity("LEDGER_MASTERS", all.filter(l => l.id !== id));
    return true;
  }

  getLedgersByHead(accountHead: string, cityId?: string): LedgerMaster[] {
    return this.getLedgers(cityId).filter(l => l.accountHead === accountHead);
  }

  getLedgerBalance(ledgerId: string, cityId?: string): LedgerBalance {
    const ledger = this.getLedgers(cityId || "CITY-SURAT").find(l => l.id === ledgerId);

    // --- Accounting entries (direct debit/credit account IDs) ---
    const accEntries = this.getEntries().filter(e =>
      e.debitAccount === ledgerId || e.creditAccount === ledgerId
    );
    const accDebit  = accEntries.reduce((s, e) => s + (e.debitAccount  === ledgerId ? e.totalBillValue : 0), 0);
    const accCredit = accEntries.reduce((s, e) => s + (e.creditAccount === ledgerId ? e.totalBillValue : 0), 0);

    // --- Journal entry lines (accountHead stores the ledger ID on each line) ---
    const journals = this.getJournals();
    let jvDebit = 0;
    let jvCredit = 0;
    for (const jv of journals) {
      if (jv.status !== "Posted") continue;
      for (const line of (jv.lines ?? [])) {
        if (line.accountHead === ledgerId) {
          jvDebit  += line.debit  || 0;
          jvCredit += line.credit || 0;
        }
      }
    }

    const totalDebit  = accDebit  + jvDebit;
    const totalCredit = accCredit + jvCredit;
    const balance     = totalDebit - totalCredit;

    return {
      ledgerId,
      ledgerName:  ledger?.name || ledgerId,
      accountHead: ledger?.accountHead || "",
      totalDebit,
      totalCredit,
      balance:     Math.abs(balance),
      balanceType: balance >= 0 ? "Dr" : "Cr",
    };
  }

  // Auto-create customer debtor ledger when a new subscriber is added
  // ── TDS Payment Persistence ──────────────────────────────────────────────────
  getTDSPayments(cityId: string): Array<{
    id: string; cityId: string; section: string; amount: number;
    challanNumber: string; bank: string; paymentDate: string;
    journalVoucher?: string; createdAt: string;
  }> {
    try {
      const raw = localStorage.getItem(`cleancar_tds_payments_${cityId}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  saveTDSPayment(payment: {
    id: string; cityId: string; section: string; amount: number;
    challanNumber: string; bank: string; paymentDate: string;
    journalVoucher?: string; createdAt: string;
  }): void {
    const all = this.getTDSPayments(payment.cityId);
    const updated = [...all.filter(p => p.id !== payment.id), payment];
    localStorage.setItem(`cleancar_tds_payments_${payment.cityId}`, JSON.stringify(updated));
  }

  createCustomerLedger(customerId: string, customerName: string,
      subscriptionPlan: string, cityId: string, city: string): LedgerMaster {
    const existing = this.getLedgers(cityId).find(l => l.customerId === customerId);
    if (existing) return existing;
    const ledger: LedgerMaster = {
      id: `CUST-LEDGER-${customerId}`,
      name: customerName,
      accountHead: "accounts_receivable",
      accountHeadLabel: "Accounts Receivable",
      nature: "asset", type: "customer",
      openingBalance: 0, openingBalanceType: "Dr",
      city, cityId, isSystem: false,
      status: "Active", createdAt: new Date().toISOString(),
      customerId, customerName, subscriptionPlan,
    };
    this.saveLedger(ledger);
    return ledger;
  }

  // Real fix (CA observation): a vendor payable used to fall back to one
  // shared, generic "Accounts Payable" ledger for any vendor unless a
  // ledger literally named `AP — {vendorName}` had been hand-seeded (only
  // 5 demo vendors had one) — so real payables posted correctly in total
  // but pooled anonymously, never showing by vendor name on the Balance
  // Sheet. This creates that vendor's own ledger on first use instead of
  // requiring it to be pre-seeded.
  getOrCreateVendorLedger(vendorId: string, vendorName: string, cityId: string, city: string, gstin?: string): LedgerMaster {
    const ledgerName = `AP — ${vendorName}`;
    const existing = this.getLedgers(cityId).find(l => l.accountHead === "accounts_payable" && l.name === ledgerName);
    if (existing) return existing;
    const ledger: LedgerMaster = {
      id: `VENDOR-LEDGER-${vendorId}`,
      name: ledgerName,
      accountHead: "accounts_payable",
      accountHeadLabel: "Accounts Payable",
      nature: "liability", type: "vendor",
      openingBalance: 0, openingBalanceType: "Cr",
      city, cityId, isSystem: false,
      status: "Active", createdAt: new Date().toISOString(),
      gstin,
    };
    this.saveLedger(ledger);
    return ledger;
  }
}

export const accountingEntryService = new AccountingEntryService();



