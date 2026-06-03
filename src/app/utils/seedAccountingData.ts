/**
 * seedAccountingData — 3-Month Historic Finance, Accounts & GST Data
 *
 * Covers Feb, Mar, Apr 2026 for Surat (primary) + Mumbai.
 *
 * Writes directly to the raw localStorage keys that accountingEntryService reads:
 *   cleancar_accounting_entries  → AccountingEntry[]
 *   cleancar_journal_entries     → JournalEntry[]
 *   cleancar_ledger_masters      → LedgerMaster[]  (with opening balances)
 *
 * Entry types covered:
 *   Sales       → Subscription revenue + one-time washes (GST 18%)
 *   Expense     → Chemicals, uniforms, rent, electricity, salaries
 *   Purchase    → Inventory procurement with GST ITC
 *   AssetPurchase → Pressure washer purchase
 *   Journals    → Razorpay settlement, salary disbursal, TDS payment,
 *                 advance tax instalment, PF/ESIC challan
 *
 * GST scenarios:
 *   B2B         → Registered vendor purchases (ITC claimable)
 *   Unregistered → Small vendors (no ITC)
 *   RCM         → Rent paid to unregistered landlord (reverse charge)
 *   NonGST      → Salary, PF, PT
 */

const ACC_SEED_FLAG = "ACC_SEED_V2";
const ENTRIES_KEY   = "cleancar_accounting_entries";
const JOURNAL_KEY   = "cleancar_journal_entries";
const LEDGER_KEY    = "cleancar_ledger_masters";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const gst18 = (taxable: number) => ({
  taxableValue: taxable,
  gstRate: 18,
  cgst: Math.round(taxable * 0.09),
  sgst: Math.round(taxable * 0.09),
  igst: 0,
  totalBillValue: taxable + Math.round(taxable * 0.18),
});
const gst5 = (taxable: number) => ({
  taxableValue: taxable,
  gstRate: 5,
  cgst: Math.round(taxable * 0.025),
  sgst: Math.round(taxable * 0.025),
  igst: 0,
  totalBillValue: taxable + Math.round(taxable * 0.05),
});
const noGst = (amount: number) => ({
  taxableValue: amount, gstRate: 0, cgst: 0, sgst: 0, igst: 0, totalBillValue: amount,
});

let entrySeq = 1;
const vc = (type: string, city: string, seq: number) => {
  const t = type === "Sales" ? "SAL"
    : type === "Purchase" ? "PUR"
    : type === "AssetPurchase" ? "AST"
    : "EXP";
  return `${t}/SURAT/25-26/${String(seq).padStart(4,"0")}`;
};
let jvSeq = 1;
const jvNo = () => `JV/SURAT/25-26/${String(jvSeq++).padStart(4,"0")}`;

const NOW = "2026-05-01T00:00:00.000Z";
const FY  = "25-26";

// ─── LEDGER MASTERS (with opening balances for dashboard KPIs) ────────────────
// These extend the system ledgers that ensureSystemLedgers() auto-creates.
// We set meaningful opening balances so the balance sheet looks real.
const SEED_LEDGERS: any[] = [
  // ── ASSETS ──────────────────────────────────────────────────────────────────
  { id:"LM-AXB-SUR",    name:"Axis Bank",           accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"bank",            openingBalance:320000, openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CASH-SUR",   name:"Petty Cash",           accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"other",           openingBalance:25000,  openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RZP-SUR",    name:"Razorpay",             accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"payment_gateway", openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-DEBTOR-SUR", name:"Customer Debtors",     accountHead:"accounts_receivable", accountHeadLabel:"Accounts Receivable",  nature:"asset",     type:"customer",        openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-ITC-SUR",    name:"Input Tax Credits",    accountHead:"gst_input",           accountHeadLabel:"GST Input (ITC)",      nature:"asset",     type:"other",           openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-ADVTAX-SUR", name:"Advance Tax",          accountHead:"current_assets",      accountHeadLabel:"Current Assets",       nature:"asset",     type:"other",           openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  // ── LIABILITIES ─────────────────────────────────────────────────────────────
  { id:"LM-TDS194C-SUR",name:"TDS Payable 194C",     accountHead:"tds_payable",         accountHeadLabel:"TDS Payable",          nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-TDS194J-SUR",name:"TDS Payable 194J",     accountHead:"tds_payable",         accountHeadLabel:"TDS Payable",          nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-GSTOUT-SUR", name:"GST Payable",          accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-OCGST-SUR",  name:"Output CGST",          accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-OSGST-SUR",  name:"Output SGST",          accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-SALARY-SUR", name:"Salary Payable",       accountHead:"other_liabilities",   accountHeadLabel:"Other Liabilities",    nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-PF-SUR",     name:"PF Payable",           accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-ESIC-SUR",   name:"ESIC Payable",         accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RZPCHG-SUR", name:"Razorpay Charges",     accountHead:"indirect_expenses",   accountHeadLabel:"Indirect Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  // ── INCOME ──────────────────────────────────────────────────────────────────
  { id:"LM-SUBREV-SUR", name:"Subscription - 4W",    accountHead:"sales_subscription",  accountHeadLabel:"Sales — Subscription", nature:"income",    type:"sales",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z", packageCode:"4W" },
  { id:"LM-OT-SUR",     name:"One-time Service",     accountHead:"sales_service",       accountHeadLabel:"Sales — Service",      nature:"income",    type:"sales",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RENEW-SUR",  name:"Renewal Fees",         accountHead:"sales_renewal",       accountHeadLabel:"Sales — Renewal",      nature:"income",    type:"sales",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  // ── EXPENSE ─────────────────────────────────────────────────────────────────
  { id:"LM-LABOR-SUR",  name:"Salaries and Employee Wages", accountHead:"direct_expenses", accountHeadLabel:"Direct Expenses",   nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CHEM-SUR",   name:"Raw Materials And Consumables", accountHead:"direct_expenses",accountHeadLabel:"Direct Expenses",  nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RENT-SUR",   name:"Rent Expense",         accountHead:"indirect_expenses",   accountHeadLabel:"Indirect Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-ELEC-SUR",   name:"Electricity Expense",  accountHead:"indirect_expenses",   accountHeadLabel:"Indirect Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CONS-SUR",   name:"Consultant Expense",   accountHead:"indirect_expenses",   accountHeadLabel:"Indirect Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  // ── VENDORS ─────────────────────────────────────────────────────────────────
  { id:"LM-SHREEJI",    name:"Shreeji Chemicals",    accountHead:"accounts_payable",    accountHeadLabel:"Accounts Payable",     nature:"liability", type:"vendor",          openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z", gstin:"24AABCS1234C1Z5" },
  { id:"LM-RAJKOT",     name:"Rajkot Equipment Traders", accountHead:"accounts_payable",accountHeadLabel:"Accounts Payable",     nature:"liability", type:"vendor",          openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z", gstin:"24AABCR5678D1Z2" },
  { id:"LM-LANDLORD",   name:"Proprietor (Landlord)", accountHead:"accounts_payable",   accountHeadLabel:"Accounts Payable",     nature:"liability", type:"vendor",          openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  // ── MUMBAI ──────────────────────────────────────────────────────────────────
  { id:"LM-AXB-MUM",    name:"Axis Bank",            accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"bank",            openingBalance:280000, openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CASH-MUM",   name:"Petty Cash",           accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"other",           openingBalance:20000,  openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-SUBREV-MUM", name:"Subscription - 4W",    accountHead:"sales_subscription",  accountHeadLabel:"Sales — Subscription", nature:"income",    type:"sales",           openingBalance:0,      openingBalanceType:"Cr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z", packageCode:"4W" },
  { id:"LM-LABOR-MUM",  name:"Salaries and Employee Wages", accountHead:"direct_expenses",accountHeadLabel:"Direct Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CHEM-MUM",   name:"Raw Materials And Consumables", accountHead:"direct_expenses",accountHeadLabel:"Direct Expenses",  nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
];

// ─── ACCOUNTING ENTRIES (3 months × both cities) ─────────────────────────────

function makeEntry(overrides: any, seq: number): any {
  const gstData = overrides.gstCalc || noGst(overrides.taxableValue || 0);
  return {
    id: `ACC-SEED-${String(seq).padStart(5,"0")}`,
    voucherNumber: vc(overrides.entryType, overrides.city, seq),
    entryType: overrides.entryType,
    date: overrides.date,
    vendorName:   overrides.vendorName   || undefined,
    vendorGstin:  overrides.vendorGstin  || undefined,
    vendorStateCode: overrides.stateCode || "24",
    invoiceNumber:   overrides.invoiceNumber || `INV-SEED-${seq}`,
    hsnSacCode:      overrides.hsnSacCode    || "998519",
    expenseAccount:      overrides.expenseAccount      || undefined,
    expenseAccountLabel: overrides.expenseAccountLabel || undefined,
    taxableValue:  gstData.taxableValue,
    gstRate:       gstData.gstRate,
    gstEntryType:  overrides.gstEntryType || "B2B",
    cgst:          gstData.cgst,
    sgst:          gstData.sgst,
    igst:          gstData.igst,
    totalBillValue: gstData.totalBillValue,
    paymentMode:   overrides.paymentMode || "Bank",
    isRCM:         overrides.isRCM       || false,
    rcmCgst:       overrides.rcmCgst     || undefined,
    rcmSgst:       overrides.rcmSgst     || undefined,
    debitAccount:  overrides.debitAccount,
    creditAccount: overrides.creditAccount,
    narration:     overrides.narration   || "",
    city:          overrides.city        || "Surat",
    cityId:        overrides.cityId      || "CITY-SURAT",
    financialYear: FY,
    createdBy:     "Seed",
    createdAt:     overrides.date + "T10:00:00.000Z",
    status:        "Posted",
    changeHistory: [],
  };
}

const ENTRIES: any[] = [];
let seq = 1;

// ── Monthly subscription revenue (Razorpay → Bank settled via JV) ────────────
// Each month: ~87 active subs × avg ₹1150 = ₹1,00,050. Booking entries
// show gross with GST 18%. Razorpay collects → settles to bank.
for (const m of [2, 3, 4]) {
  const ms = String(m).padStart(2,"0");
  // SURAT — 12 individual sales entries (representative sample)
  const subAmounts = [1150,1150,1499,1150,1999,1150,1150,1499,1150,1499,1150,1999];
  subAmounts.forEach((base, i) => {
    const g = gst18(base);
    ENTRIES.push(makeEntry({
      entryType: "Sales", date: `2026-${ms}-01`,
      gstCalc: g, gstEntryType: "B2B",
      debitAccount:  "LM-RZP-SUR",    // Razorpay collects
      creditAccount: "LM-SUBREV-SUR", // Subscription revenue
      invoiceNumber: `SUB-SUR-${m}-${String(i+1).padStart(3,"0")}`,
      narration: `Subscription — ${["Water Wash","Shampoo Wash","Shampoo+Wax"][i%3]} — ${["Hatchback","SUV","Sedan"][i%3]}`,
      city:"Surat", cityId:"CITY-SURAT",
    }, seq++));
  });

  // SURAT — One-time washes (5 per month)
  const otAmounts = [499, 699, 499, 699, 499];
  otAmounts.forEach((base, i) => {
    const day = 5 + i * 4;
    const g = gst18(base);
    ENTRIES.push(makeEntry({
      entryType:"Sales", date:`2026-${ms}-${String(day).padStart(2,"0")}`,
      gstCalc:g, gstEntryType:"Unregistered",
      debitAccount:"LM-CASH-SUR", creditAccount:"LM-OT-SUR",
      invoiceNumber:`OT-SUR-${m}-${i+1}`,
      narration:"One-time wash — walk-in customer",
      paymentMode:"Cash", city:"Surat", cityId:"CITY-SURAT",
    }, seq++));
  });

  // SURAT — Renewals (3 per month, small discount)
  [1299, 1499, 999].forEach((base, i) => {
    const day = 2 + i * 7;
    const g = gst18(base);
    ENTRIES.push(makeEntry({
      entryType:"Sales", date:`2026-${ms}-${String(day).padStart(2,"0")}`,
      gstCalc:g, gstEntryType:"B2B",
      debitAccount:"LM-RZP-SUR", creditAccount:"LM-RENEW-SUR",
      invoiceNumber:`REN-SUR-${m}-${i+1}`,
      narration:"Subscription renewal",
      city:"Surat", cityId:"CITY-SURAT",
    }, seq++));
  });

  // SURAT — Chemical purchase from Shreeji Chemicals (B2B, ITC claimable)
  const chemAmt = [18500, 21000, 19500][m-2];
  ENTRIES.push(makeEntry({
    entryType:"Purchase", date:`2026-${ms}-10`,
    gstCalc: gst18(chemAmt), gstEntryType:"B2B",
    vendorName:"Shreeji Chemicals", vendorGstin:"24AABCS1234C1Z5", stateCode:"24",
    debitAccount:"LM-CHEM-SUR", creditAccount:"LM-SHREEJI",
    invoiceNumber:`SHREEJI-${m}-001`, hsnSacCode:"34022000",
    expenseAccount:"direct_expenses", expenseAccountLabel:"Direct Expenses",
    narration:"Car shampoo, tyre shine, dashboard polish",
    city:"Surat", cityId:"CITY-SURAT",
  }, seq++));

  // SURAT — Equipment purchase from Rajkot Equipment Traders (B2B, ITC)
  if (m === 2 || m === 4) {
    const eqAmt = m === 2 ? 12000 : 8500;
    ENTRIES.push(makeEntry({
      entryType:"Purchase", date:`2026-${ms}-15`,
      gstCalc: gst18(eqAmt), gstEntryType:"B2B",
      vendorName:"Rajkot Equipment Traders", vendorGstin:"24AABCR5678D1Z2", stateCode:"24",
      debitAccount:"LM-CHEM-SUR", creditAccount:"LM-RAJKOT",
      invoiceNumber:`RAJKOT-${m}-001`, hsnSacCode:"84248990",
      expenseAccount:"direct_expenses", expenseAccountLabel:"Direct Expenses",
      narration:"Pressure washer nozzles + microfiber cloths",
      city:"Surat", cityId:"CITY-SURAT",
    }, seq++));
  }

  // SURAT — Uniform purchase (Unregistered vendor, no ITC)
  ENTRIES.push(makeEntry({
    entryType:"Purchase", date:`2026-${ms}-08`,
    gstCalc: noGst(8450), gstEntryType:"Unregistered",
    vendorName:"Ashok Garments", stateCode:"24",
    debitAccount:"LM-CHEM-SUR", creditAccount:"LM-AXB-SUR",
    invoiceNumber:`UNIFORM-${m}-001`, hsnSacCode:"62114900",
    expenseAccount:"direct_expenses", expenseAccountLabel:"Direct Expenses",
    narration:"Washer uniforms — 13 sets",
    paymentMode:"Bank", city:"Surat", cityId:"CITY-SURAT",
  }, seq++));

  // SURAT — Rent Expense (RCM — unregistered landlord)
  // RCM: tenant pays GST to government on behalf of landlord
  const rentBase = 35000;
  const rcmCgst  = Math.round(rentBase * 0.09);
  const rcmSgst  = Math.round(rentBase * 0.09);
  ENTRIES.push(makeEntry({
    entryType:"Expense", date:`2026-${ms}-01`,
    gstCalc: { taxableValue:rentBase, gstRate:18, cgst:rcmCgst, sgst:rcmSgst, igst:0,
               totalBillValue: rentBase },  // Cash paid = only taxable; RCM tax paid separately
    gstEntryType:"RCM",
    isRCM:true, rcmCgst, rcmSgst,
    vendorName:"Proprietor (Landlord)", stateCode:"24",
    debitAccount:"LM-RENT-SUR", creditAccount:"LM-LANDLORD",
    invoiceNumber:`RENT-${m}`, hsnSacCode:"997211",
    expenseAccount:"indirect_expenses", expenseAccountLabel:"Indirect Expenses",
    narration:"Office/depot rent — RCM applicable",
    city:"Surat", cityId:"CITY-SURAT",
  }, seq++));

  // SURAT — Electricity (NonGST)
  ENTRIES.push(makeEntry({
    entryType:"Expense", date:`2026-${ms}-18`,
    gstCalc: noGst([4200,4600,5100][m-2]),
    gstEntryType:"NonGST",
    vendorName:"DGVCL", stateCode:"24",
    debitAccount:"LM-ELEC-SUR", creditAccount:"LM-AXB-SUR",
    invoiceNumber:`ELEC-${m}`, hsnSacCode:"",
    expenseAccount:"indirect_expenses", expenseAccountLabel:"Indirect Expenses",
    narration:"Electricity bill — depot + office",
    paymentMode:"Bank", city:"Surat", cityId:"CITY-SURAT",
  }, seq++));

  // SURAT — Professional fee to consultant (B2B, 194J TDS applicable)
  if (m === 3) {
    const consFee = 25000;
    ENTRIES.push(makeEntry({
      entryType:"Expense", date:`2026-${ms}-20`,
      gstCalc: gst18(consFee), gstEntryType:"B2B",
      vendorName:"Tech Solutions LLP", vendorGstin:"24AABCT9876E1Z9", stateCode:"24",
      debitAccount:"LM-CONS-SUR", creditAccount:"LM-AXB-SUR",
      invoiceNumber:"TECH-MAR-001", hsnSacCode:"998314",
      expenseAccount:"indirect_expenses", expenseAccountLabel:"Indirect Expenses",
      narration:"IT consulting — mobile app development",
      paymentMode:"Bank", city:"Surat", cityId:"CITY-SURAT",
    }, seq++));
  }

  // SURAT — Asset purchase: Pressure washer machine (Apr only)
  if (m === 4) {
    ENTRIES.push(makeEntry({
      entryType:"AssetPurchase", date:"2026-04-10",
      gstCalc: gst18(45000), gstEntryType:"B2B",
      vendorName:"Clean Tech India", vendorGstin:"24AABCC4321F1Z3", stateCode:"24",
      debitAccount:"LM-AXB-SUR", creditAccount:"LM-SHREEJI",  // debit = asset, credit = payable
      invoiceNumber:"ASSET-APR-001", hsnSacCode:"84248990",
      expenseAccount:"fixed_assets", expenseAccountLabel:"Fixed Assets",
      narration:"Honda GX160 pressure washer — 2 units",
      paymentMode:"Bank", city:"Surat", cityId:"CITY-SURAT",
    }, seq++));
  }

  // MUMBAI — Monthly sales (simpler set)
  [1280, 1280, 1690, 1280, 1280].forEach((base, i) => {
    const g = gst18(base);
    ENTRIES.push(makeEntry({
      entryType:"Sales", date:`2026-${ms}-01`,
      gstCalc:g, gstEntryType:"B2B",
      debitAccount:"LM-RZP-MUM", creditAccount:"LM-SUBREV-MUM",
      invoiceNumber:`SUB-MUM-${m}-${i+1}`,
      narration:`Subscription Mumbai — ${["Water Wash","Shampoo Wash"][i%2]}`,
      city:"Mumbai", cityId:"CITY-MUMBAI",
    }, seq++));
  });

  // MUMBAI — Chemical purchase
  ENTRIES.push(makeEntry({
    entryType:"Purchase", date:`2026-${ms}-12`,
    gstCalc: gst18([22000,25000,21000][m-2]), gstEntryType:"B2B",
    vendorName:"Mumbai Wash Supplies", vendorGstin:"27AABCM5432G1Z1", stateCode:"27",
    debitAccount:"LM-CHEM-MUM", creditAccount:"LM-AXB-MUM",
    invoiceNumber:`MWS-${m}-001`, hsnSacCode:"34022000",
    expenseAccount:"direct_expenses", expenseAccountLabel:"Direct Expenses",
    narration:"Chemicals supply — Mumbai depot",
    paymentMode:"Bank", city:"Mumbai", cityId:"CITY-MUMBAI",
  }, seq++));
}

// ─── JOURNAL ENTRIES (month-end closings, salary, TDS, Razorpay settlement) ──

const JOURNALS: any[] = [];

for (const m of [2, 3, 4]) {
  const ms     = String(m).padStart(2,"0");
  const mEnd   = m === 2 ? "28" : m === 3 ? "31" : "30";
  const mLabel = ["","","Feb","Mar","Apr"][m];

  // ── JV1: Salary disbursal (month-end) ───────────────────────────────────────
  // Gross salary Surat ≈ ₹5.5L/month across 35 employees
  const grossSalary = 550000;
  const pfEmp       = 28000;
  const esic        = 8500;
  const pt          = 3600;
  const tds         = 4200;
  const netPay      = grossSalary - pfEmp - esic - pt - tds;
  JOURNALS.push({
    id: `JV-SEED-SAL-${m}`,
    voucherNumber: jvNo(),
    date: `2026-${ms}-${mEnd}`,
    narration: `Salary disbursal — Surat — ${mLabel} 2026`,
    lines: [
      { accountHead:"LM-LABOR-SUR",  accountLabel:"Salaries and Employee Wages", debit:grossSalary, credit:0 },
      { accountHead:"LM-AXB-SUR",    accountLabel:"Axis Bank",                   debit:0,           credit:netPay },
      { accountHead:"LM-PF-SUR",     accountLabel:"PF Payable",                  debit:0,           credit:pfEmp },
      { accountHead:"LM-ESIC-SUR",   accountLabel:"ESIC Payable",                debit:0,           credit:esic },
      { accountHead:"LM-TDS194C-SUR",accountLabel:"TDS Payable 194C",            debit:0,           credit:tds },
      { accountHead:"LM-SALARY-SUR", accountLabel:"Salary Payable",              debit:0,           credit:pt },
    ],
    city:"Surat", cityId:"CITY-SURAT",
    financialYear:FY, createdBy:"Seed",
    createdAt:`2026-${ms}-${mEnd}T18:00:00.000Z`,
    status:"Posted", changeHistory:[],
  });

  // ── JV2: PF + ESIC challan payment (7th of next month) ─────────────────────
  const nextM  = m === 4 ? 5 : m + 1;
  const nextMs = String(nextM).padStart(2,"0");
  JOURNALS.push({
    id: `JV-SEED-PF-${m}`,
    voucherNumber: jvNo(),
    date: `2026-${nextMs}-07`,
    narration: `PF + ESIC challan — ${mLabel} 2026`,
    lines: [
      { accountHead:"LM-PF-SUR",   accountLabel:"PF Payable",    debit:28000+28000, credit:0 },  // emp + employer share
      { accountHead:"LM-ESIC-SUR", accountLabel:"ESIC Payable",  debit:8500+3250,   credit:0 },
      { accountHead:"LM-AXB-SUR",  accountLabel:"Axis Bank",     debit:0,           credit:67750 },
    ],
    city:"Surat", cityId:"CITY-SURAT",
    financialYear:FY, createdBy:"Seed",
    createdAt:`2026-${nextMs}-07T11:00:00.000Z`,
    status:"Posted", changeHistory:[],
  });

  // ── JV3: TDS deposit (7th of next month) ────────────────────────────────────
  JOURNALS.push({
    id: `JV-SEED-TDS-${m}`,
    voucherNumber: jvNo(),
    date: `2026-${nextMs}-06`,
    narration: `TDS challan — ${mLabel} 2026 — Section 194C`,
    lines: [
      { accountHead:"LM-TDS194C-SUR", accountLabel:"TDS Payable 194C", debit:4200, credit:0 },
      { accountHead:"LM-AXB-SUR",     accountLabel:"Axis Bank",        debit:0,    credit:4200 },
    ],
    city:"Surat", cityId:"CITY-SURAT",
    financialYear:FY, createdBy:"Seed",
    createdAt:`2026-${nextMs}-06T10:00:00.000Z`,
    status:"Posted", changeHistory:[],
  });

  // ── JV4: Razorpay settlement to bank (happens ~T+2 days) ────────────────────
  // Razorpay collected ~₹1,15,000 + ₹20,700 GST = ₹1,35,700 gross
  // Net after 2% fee = ₹1,32,986
  const rzpGross   = [135700, 140200, 148500][m-2];
  const rzpFee     = Math.round(rzpGross * 0.02);
  const rzpNet     = rzpGross - rzpFee;
  JOURNALS.push({
    id: `JV-SEED-RZP-${m}`,
    voucherNumber: jvNo(),
    date: `2026-${ms}-03`,
    narration: `Razorpay settlement — ${mLabel} 2026`,
    lines: [
      { accountHead:"LM-AXB-SUR",    accountLabel:"Axis Bank",        debit:rzpNet,   credit:0 },
      { accountHead:"LM-RZPCHG-SUR", accountLabel:"Razorpay Charges", debit:rzpFee,   credit:0 },
      { accountHead:"LM-RZP-SUR",    accountLabel:"Razorpay",         debit:0,        credit:rzpGross },
    ],
    city:"Surat", cityId:"CITY-SURAT",
    financialYear:FY, createdBy:"Seed",
    createdAt:`2026-${ms}-03T14:00:00.000Z`,
    status:"Posted", changeHistory:[],
  });

  // ── JV5: GST payment (20th of next month) ───────────────────────────────────
  // Approx GST payable after ITC: Output ~₹20,700 - Input ~₹8,100 = ₹12,600
  const gstPay = [12600, 13400, 14200][m-2];
  JOURNALS.push({
    id: `JV-SEED-GST-${m}`,
    voucherNumber: jvNo(),
    date: `2026-${nextMs}-20`,
    narration: `GST payment — ${mLabel} 2026 — CGST + SGST`,
    lines: [
      { accountHead:"LM-OCGST-SUR", accountLabel:"Output CGST",   debit: Math.round(gstPay/2), credit:0 },
      { accountHead:"LM-OSGST-SUR", accountLabel:"Output SGST",   debit: Math.round(gstPay/2), credit:0 },
      { accountHead:"LM-AXB-SUR",   accountLabel:"Axis Bank",     debit:0,                      credit:gstPay },
    ],
    city:"Surat", cityId:"CITY-SURAT",
    financialYear:FY, createdBy:"Seed",
    createdAt:`2026-${nextMs}-20T12:00:00.000Z`,
    status:"Posted", changeHistory:[],
  });

  // ── JV6: Mumbai salary disbursal ────────────────────────────────────────────
  const mumGross = 480000;
  const mumPf    = 24000;
  const mumNet   = mumGross - mumPf - 7200 - 3200 - 3600;
  JOURNALS.push({
    id: `JV-SEED-MUM-SAL-${m}`,
    voucherNumber: jvNo(),
    date: `2026-${ms}-${mEnd}`,
    narration: `Salary disbursal — Mumbai — ${mLabel} 2026`,
    lines: [
      { accountHead:"LM-LABOR-MUM", accountLabel:"Salaries and Employee Wages", debit:mumGross, credit:0 },
      { accountHead:"LM-AXB-MUM",  accountLabel:"Axis Bank",                    debit:0,        credit:mumNet },
      { accountHead:"LM-AXB-MUM",  accountLabel:"Axis Bank (PF/ESIC)",          debit:0,        credit:mumGross-mumNet },
    ],
    city:"Mumbai", cityId:"CITY-MUMBAI",
    financialYear:FY, createdBy:"Seed",
    createdAt:`2026-${ms}-${mEnd}T18:30:00.000Z`,
    status:"Posted", changeHistory:[],
  });
}

// Advance Tax instalment (Jun 2026 isn't in our 3-month window, but
// the Mar instalment (15%) would have been paid — record it as of 15 Mar)
JOURNALS.push({
  id: "JV-SEED-AT-1",
  voucherNumber: jvNo(),
  date: "2026-03-15",
  narration: "Advance Tax — Instalment 1 (15%) FY 25-26",
  lines: [
    { accountHead:"LM-ADVTAX-SUR", accountLabel:"Advance Tax",  debit:18500, credit:0 },
    { accountHead:"LM-AXB-SUR",    accountLabel:"Axis Bank",    debit:0,     credit:18500 },
  ],
  city:"Surat", cityId:"CITY-SURAT",
  financialYear:FY, createdBy:"Seed",
  createdAt:"2026-03-15T11:00:00.000Z",
  status:"Posted", changeHistory:[],
});

// ─── SEEDER FUNCTION ─────────────────────────────────────────────────────────

export function seedAccountingData(): void {
  try {
    if (localStorage.getItem(ACC_SEED_FLAG)) return;

    // Merge ledgers with any already-existing ones (don't overwrite user entries)
    const existingLedgers: any[] = JSON.parse(
      localStorage.getItem(LEDGER_KEY) || "[]"
    );
    const existingLedgerIds = new Set(existingLedgers.map((l: any) => l.id));
    const newLedgers = SEED_LEDGERS.filter(l => !existingLedgerIds.has(l.id));
    localStorage.setItem(
      LEDGER_KEY,
      JSON.stringify([...existingLedgers, ...newLedgers])
    );

    // Merge accounting entries
    const existingEntries: any[] = JSON.parse(
      localStorage.getItem(ENTRIES_KEY) || "[]"
    );
    const existingEntryIds = new Set(existingEntries.map((e: any) => e.id));
    const newEntries = ENTRIES.filter(e => !existingEntryIds.has(e.id));
    localStorage.setItem(
      ENTRIES_KEY,
      JSON.stringify([...existingEntries, ...newEntries])
    );

    // Merge journal entries
    const existingJournals: any[] = JSON.parse(
      localStorage.getItem(JOURNAL_KEY) || "[]"
    );
    const existingJvIds = new Set(existingJournals.map((j: any) => j.id));
    const newJournals = JOURNALS.filter(j => !existingJvIds.has(j.id));
    localStorage.setItem(
      JOURNAL_KEY,
      JSON.stringify([...existingJournals, ...newJournals])
    );

    localStorage.setItem(ACC_SEED_FLAG, "true");

    console.log(
      `[AccountingSeed] ✅ V2 seeded:\n` +
      `  ${newLedgers.length} ledger masters\n` +
      `  ${newEntries.length} accounting entries\n` +
      `    (${newEntries.filter(e=>e.entryType==="Sales").length} Sales, ` +
      `${newEntries.filter(e=>e.entryType==="Purchase").length} Purchase, ` +
      `${newEntries.filter(e=>e.entryType==="Expense").length} Expense, ` +
      `${newEntries.filter(e=>e.entryType==="AssetPurchase").length} AssetPurchase)\n` +
      `  ${newJournals.length} journal entries\n` +
      `    (salary, PF/ESIC, TDS, Razorpay settlement, GST payment, advance tax)`
    );
  } catch (err) {
    console.error("[AccountingSeed] Seed failed:", err);
  }
}
