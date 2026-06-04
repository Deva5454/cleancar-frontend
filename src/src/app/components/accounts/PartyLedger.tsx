/**
 * PartyLedger.tsx
 * Route: /accounts/party-ledger?city=surat
 *
 * Three-tab ledger book: Customers · Vendors · Employees
 * Each tab:
 *   - Party list with search + month filter + closing balance
 *   - Click any party → running ledger (Date | Particulars | Voucher | Dr | Cr | Balance)
 *   - Drillable to account head
 *   - Export to CSV
 */

import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import {
  Search, Download, ArrowLeft, ChevronRight,
  Users, Building2, UserCheck, TrendingUp, TrendingDown,
  Calendar, FileText, Filter
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────
interface LedgerLine {
  date: string;
  particulars: string;
  voucherNo: string;
  accountHead: string;
  dr: number;
  cr: number;
  balance: number;
  balanceType: "Dr" | "Cr" | "Nil";
  source: string;
}

interface PartyAccount {
  id: string;
  name: string;
  reference: string;    // phone / GSTIN / employee ID
  subText: string;      // plan / entity type / designation
  openingBalance: number;
  openingType: "Dr" | "Cr";
  lines: LedgerLine[];
  closingBalance: number;
  closingType: "Dr" | "Cr" | "Nil";
}

type TabType = "customers" | "vendors" | "employees";

const MONTHS = [
  "All Months",
  "January 2026", "February 2026", "March 2026", "April 2026",
  "May 2026", "June 2026",
];
const MONTH_RANGES: Record<string, { from: string; to: string }> = {
  "All Months":     { from: "2026-01-01", to: "2099-12-31" },
  "January 2026":   { from: "2026-01-01", to: "2026-01-31" },
  "February 2026":  { from: "2026-02-01", to: "2026-02-28" },
  "March 2026":     { from: "2026-03-01", to: "2026-03-31" },
  "April 2026":     { from: "2026-04-01", to: "2026-04-30" },
  "May 2026":       { from: "2026-05-01", to: "2026-05-31" },
  "June 2026":      { from: "2026-06-01", to: "2026-06-30" },
};

// ── Helpers ───────────────────────────────────────────────────────────────
function safe(key: string): any[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function fmt(n: number) {
  return n === 0 ? "—" : "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtD(iso: string) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso.split("T")[0]; }
}
function runningBalance(lines: Omit<LedgerLine, "balance" | "balanceType">[], openingBal: number, openingType: "Dr" | "Cr"): LedgerLine[] {
  let bal = openingType === "Dr" ? openingBal : -openingBal;
  return lines.map(l => {
    bal += l.dr - l.cr;
    const abs = Math.abs(bal);
    return { ...l, balance: abs, balanceType: bal > 0 ? "Dr" : bal < 0 ? "Cr" : "Nil" };
  });
}
function toCSV(party: PartyAccount) {
  const rows = [
    ["Date", "Particulars", "Voucher No", "Account Head", "Debit", "Credit", "Balance", "Dr/Cr"],
    ["", "Opening Balance", "", "", "", "", party.openingBalance.toFixed(2), party.openingType],
    ...party.lines.map(l => [
      fmtD(l.date), l.particulars, l.voucherNo, l.accountHead,
      l.dr ? l.dr.toFixed(2) : "", l.cr ? l.cr.toFixed(2) : "",
      l.balance.toFixed(2), l.balanceType
    ]),
    ["", "Closing Balance", "", "", "", "", party.closingBalance.toFixed(2), party.closingType],
  ];
  return rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
}

// ── Data builders ─────────────────────────────────────────────────────────
function buildCustomerLedgers(city: string, from: string, to: string): PartyAccount[] {
  const cityKey = city.startsWith("CITY-") ? city : `CITY-${city.toUpperCase()}`;
  const customers: any[] = [...safe(`cleancar_${cityKey}_customers`), ...safe("cleancar_customers")];
  const revenues:  any[] = [...safe(`cleancar_${cityKey}_revenues`),  ...safe("cleancar_revenues")];
  const webInvs:   any[] = safe("cleancar_web_invoices");
  const subs:      any[] = [...safe(`cleancar_${cityKey}_subscriptions`)];

  // Dedupe customers by customerId
  const custMap = new Map<string, any>();
  customers.forEach(c => { if (!custMap.has(c.customerId)) custMap.set(c.customerId, c); });

  return Array.from(custMap.values()).map(cust => {
    const cid = cust.customerId;
    const lines: Omit<LedgerLine, "balance" | "balanceType">[] = [];

    // Revenue → Credit (sales invoice raised)
    revenues
      .filter(r => r.customerId === cid && r.receivedDate >= from && r.receivedDate <= to)
      .forEach(r => {
        const gross = +(r.amount * 1.18).toFixed(2);
        lines.push({
          date: r.receivedDate,
          particulars: `${r.packageName || r.type || "Subscription"} — ${r.invoiceNumber || r.revenueId}`,
          voucherNo: r.invoiceNumber || r.revenueId,
          accountHead: "4000 — Service Revenue",
          dr: 0,
          cr: r.status === "Received" ? gross : 0,
          source: "revenue",
        });
        // Payment received → Debit (clears the balance)
        if (r.status === "Received") {
          lines.push({
            date: r.receivedDate,
            particulars: `Payment received — ${r.paymentMethod || "UPI"} — ${r.invoiceNumber || r.revenueId}`,
            voucherNo: `PAY-${r.revenueId}`,
            accountHead: "1100 — Bank / Razorpay",
            dr: gross,
            cr: 0,
            source: "payment",
          });
        }
      });

    // Web invoices
    webInvs
      .filter(wi => wi.customerId === cid && wi.createdAt && wi.createdAt.split("T")[0] >= from && wi.createdAt.split("T")[0] <= to)
      .forEach(wi => {
        const dt = wi.createdAt.split("T")[0];
        lines.push({
          date: dt,
          particulars: `Web subscription — ${wi.invoiceNumber}`,
          voucherNo: wi.invoiceNumber,
          accountHead: "4010 — Web Subscription Revenue",
          dr: 0,
          cr: wi.grandTotal || wi.subtotal || 0,
          source: "web",
        });
        lines.push({
          date: dt,
          particulars: `Razorpay payment — ${wi.invoiceNumber}`,
          voucherNo: `PAY-${wi.invoiceNumber}`,
          accountHead: "1100 — Bank / Razorpay",
          dr: wi.grandTotal || wi.subtotal || 0,
          cr: 0,
          source: "web-payment",
        });
      });

    lines.sort((a, b) => a.date.localeCompare(b.date));
    const withBal = runningBalance(lines, 0, "Dr");
    const closing = withBal.length > 0 ? withBal[withBal.length - 1] : null;
    const sub = subs.find(s => s.customerId === cid);

    return {
      id: cid,
      name: `${cust.firstName} ${cust.lastName}`.trim() || cid,
      reference: cust.phone || "",
      subText: sub?.packageName || cust.vehicleDetails?.category || "Customer",
      openingBalance: 0,
      openingType: "Dr" as const,
      lines: withBal,
      closingBalance: closing?.balance ?? 0,
      closingType: closing?.balanceType ?? "Nil",
    };
  }).filter(p => p.lines.length > 0 || true); // show all, even zero balance
}

function buildVendorLedgers(city: string, from: string, to: string): PartyAccount[] {
  const cityKey = city.startsWith("CITY-") ? city : `CITY-${city.toUpperCase()}`;
  const entries: any[] = [...safe("cleancar_accounting_entries"), ...safe(`cleancar_${cityKey}_accounting_entries`)];
  const vendors: any[] = [
    ...safe(`cleancar_${cityKey}_gst_vendors`),
    ...safe("cleancar_gst_vendors"),
  ];

  // Group entries by vendorName
  const vendorMap = new Map<string, any[]>();
  entries
    .filter(e => ["Purchase","Expense","PurchaseReturn"].includes(e.entryType) && e.date >= from && e.date <= to)
    .forEach(e => {
      const vname = e.vendorName || e.narration?.split("—")[0]?.trim() || "Unknown Vendor";
      if (!vendorMap.has(vname)) vendorMap.set(vname, []);
      vendorMap.get(vname)!.push(e);
    });

  // Also add vendor master records with no entries (to show in list)
  vendors.forEach(v => {
    if (!vendorMap.has(v.name)) vendorMap.set(v.name, []);
  });

  return Array.from(vendorMap.entries()).map(([vname, es]) => {
    const vmaster = vendors.find(v => v.name === vname);
    const lines: Omit<LedgerLine, "balance" | "balanceType">[] = [];

    es.forEach(e => {
      const taxableVal = e.taxableValue || 0;
      const tdsAmt = e.tdsAmount || 0;
      const netPayable = taxableVal + (e.cgst || 0) + (e.sgst || 0) + (e.igst || 0) - tdsAmt;
      if (e.entryType === "Purchase" || e.entryType === "Expense") {
        // Expense/Purchase → Credit (liability to vendor)
        lines.push({
          date: e.date,
          particulars: e.narration || `${e.entryType} — ${e.invoiceNumber || e.voucherNumber}`,
          voucherNo: e.voucherNumber || e.id,
          accountHead: e.debitAccount ? `${e.debitAccount}` : "6000 — Purchases/Expenses",
          dr: 0,
          cr: netPayable,
          source: "purchase",
        });
        if (tdsAmt > 0) {
          lines.push({
            date: e.date,
            particulars: `TDS deducted u/s ${e.tdsSection || "194C"} — ${e.voucherNumber}`,
            voucherNo: `TDS-${e.voucherNumber}`,
            accountHead: "2210 — TDS Payable",
            dr: tdsAmt,
            cr: 0,
            source: "tds",
          });
        }
      } else if (e.entryType === "PurchaseReturn") {
        lines.push({
          date: e.date,
          particulars: `Purchase Return — ${e.voucherNumber}`,
          voucherNo: e.voucherNumber || e.id,
          accountHead: "6000 — Purchases",
          dr: netPayable,
          cr: 0,
          source: "return",
        });
      }
    });

    lines.sort((a, b) => a.date.localeCompare(b.date));
    const withBal = runningBalance(lines, 0, "Cr");
    const closing = withBal.length > 0 ? withBal[withBal.length - 1] : null;

    return {
      id: vmaster?.id || vname,
      name: vname,
      reference: vmaster?.gstin || "",
      subText: vmaster?.legalEntityType || vmaster?.vendorType || "Vendor",
      openingBalance: 0,
      openingType: "Cr" as const,
      lines: withBal,
      closingBalance: closing?.balance ?? 0,
      closingType: closing?.balanceType ?? "Nil",
    };
  });
}

function buildEmployeeLedgers(city: string, from: string, to: string): PartyAccount[] {
  const cityKey = city.startsWith("CITY-") ? city : `CITY-${city.toUpperCase()}`;
  const payrollRuns: any[] = [
    ...safe(`cleancar_${cityKey}_payroll_runs`),
    ...safe("cleancar_payroll_runs"),
  ];
  const advances: any[] = [
    ...safe(`cleancar_${cityKey}_advances`),
    ...safe("cleancar_advances"),
  ];
  const employees: any[] = safe("EMPLOYEE_DATABASE_RECORDS");

  // Group payroll by employeeId
  const empMap = new Map<string, { emp: any; lines: Omit<LedgerLine,"balance"|"balanceType">[] }>();

  // Init from employee master
  employees
    .filter(e => (e.workLocation || "").includes(city.replace("CITY-","")) || city === "all")
    .forEach(e => {
      empMap.set(e.id, { emp: e, lines: [] });
    });

  payrollRuns
    .filter(r => r.payDate >= from && r.payDate <= to)
    .forEach(r => {
      if (!empMap.has(r.employeeId)) {
        const emp = employees.find(e => e.id === r.employeeId);
        empMap.set(r.employeeId, { emp, lines: [] });
      }
      const rec = empMap.get(r.employeeId)!;
      // Gross salary → Debit (expense/liability)
      if (r.grossSalary) {
        rec.lines.push({
          date: r.payDate,
          particulars: `Salary — ${r.month || r.payDate.slice(0,7)} — ${r.employeeName || r.employeeId}`,
          voucherNo: r.payrollId || `PR-${r.employeeId}-${r.payDate}`,
          accountHead: "6100 — Salaries & Wages",
          dr: r.grossSalary,
          cr: 0,
          source: "salary",
        });
      }
      // Net payment made → Credit
      if (r.netSalary) {
        rec.lines.push({
          date: r.payDate,
          particulars: `Salary paid — ${r.paymentMode || "Bank"} — ${r.payrollId}`,
          voucherNo: `PAY-${r.payrollId}`,
          accountHead: "1100 — Bank",
          dr: 0,
          cr: r.netSalary,
          source: "payment",
        });
      }
      // PF deduction
      if (r.pfDeduction) {
        rec.lines.push({
          date: r.payDate,
          particulars: `PF deducted — ${r.payrollId}`,
          voucherNo: `PF-${r.payrollId}`,
          accountHead: "2200 — PF Payable",
          dr: 0,
          cr: r.pfDeduction,
          source: "pf",
        });
      }
    });

  // Advances
  advances
    .filter(a => a.advanceDate >= from && a.advanceDate <= to)
    .forEach(a => {
      if (!empMap.has(a.employeeId)) return;
      empMap.get(a.employeeId)!.lines.push({
        date: a.advanceDate,
        particulars: `Advance paid — ${a.reason || "Salary advance"}`,
        voucherNo: a.advanceId || `ADV-${a.employeeId}`,
        accountHead: "1300 — Employee Advances",
        dr: a.amount,
        cr: 0,
        source: "advance",
      });
    });

  return Array.from(empMap.entries())
    .filter(([, v]) => v.lines.length > 0)
    .map(([eid, { emp, lines }]) => {
      lines.sort((a, b) => a.date.localeCompare(b.date));
      const withBal = runningBalance(lines, 0, "Dr");
      const closing = withBal.length > 0 ? withBal[withBal.length - 1] : null;
      return {
        id: eid,
        name: emp ? `${emp.fullName || emp.firstName + " " + emp.lastName}`.trim() : eid,
        reference: eid,
        subText: emp?.designation || "Employee",
        openingBalance: 0,
        openingType: "Dr" as const,
        lines: withBal,
        closingBalance: closing?.balance ?? 0,
        closingType: closing?.balanceType ?? "Nil",
      };
    });
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════
export function PartyLedger() {
  const { city } = useCity();
  const [tab, setTab] = useState<TabType>("customers");
  const [selectedMonth, setSelectedMonth] = useState("All Months");
  const [search, setSearch] = useState("");
  const [selectedParty, setSelectedParty] = useState<PartyAccount | null>(null);
  const [accountHeadFilter, setAccountHeadFilter] = useState("All");

  const { from, to } = MONTH_RANGES[selectedMonth] || MONTH_RANGES["All Months"];

  const parties = useMemo<PartyAccount[]>(() => {
    if (tab === "customers") return buildCustomerLedgers(city, from, to);
    if (tab === "vendors")   return buildVendorLedgers(city, from, to);
    return buildEmployeeLedgers(city, from, to);
  }, [tab, city, from, to]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return parties.filter(p =>
      !q || p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q)
    );
  }, [parties, search]);

  // Account heads available in selected party's ledger
  const accountHeads = useMemo(() => {
    if (!selectedParty) return [];
    const heads = new Set(selectedParty.lines.map(l => l.accountHead));
    return ["All", ...Array.from(heads)];
  }, [selectedParty]);

  const visibleLines = useMemo(() => {
    if (!selectedParty) return [];
    if (accountHeadFilter === "All") return selectedParty.lines;
    return selectedParty.lines.filter(l => l.accountHead === accountHeadFilter);
  }, [selectedParty, accountHeadFilter]);

  function handleExport() {
    if (!selectedParty) return;
    const csv = toCSV(selectedParty);
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${selectedParty.name.replace(/\s+/g,"_")}_Ledger_${selectedMonth.replace(" ","_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const TAB_CFG = {
    customers: { label: "Customers",        icon: Users,      color: "text-blue-700",  bg: "bg-blue-50",  border: "border-blue-500" },
    vendors:   { label: "Vendors",           icon: Building2,  color: "text-purple-700",bg: "bg-purple-50",border: "border-purple-500" },
    employees: { label: "Employees",         icon: UserCheck,  color: "text-green-700", bg: "bg-green-50", border: "border-green-500" },
  };

  // Summary stats
  const totalDr  = filtered.reduce((s,p) => s + (p.closingType === "Dr" ? p.closingBalance : 0), 0);
  const totalCr  = filtered.reduce((s,p) => s + (p.closingType === "Cr" ? p.closingBalance : 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Party Ledger</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Account book — Customers · Vendors · Employees
            </p>
          </div>
          {selectedParty && (
            <button onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {(Object.entries(TAB_CFG) as [TabType, typeof TAB_CFG["customers"]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const active = tab === key;
            return (
              <button key={key}
                onClick={() => { setTab(key); setSelectedParty(null); setSearch(""); setAccountHeadFilter("All"); }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                  active ? `${cfg.bg} ${cfg.color} ${cfg.border}` : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                <Icon className="w-4 h-4" />
                {cfg.label}
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${active ? cfg.bg : "bg-gray-100"} ${active ? cfg.color : "text-gray-400"}`}>
                  {parties.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex h-[calc(100vh-160px)]">
        {/* ── LEFT PANEL: Party list ───────────────────────────────────── */}
        <div className={`flex flex-col border-r border-gray-200 bg-white transition-all ${selectedParty ? "w-80 min-w-[20rem]" : "flex-1"}`}>
          {/* Filters */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${TAB_CFG[tab].label.toLowerCase()}…`}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setSelectedParty(null); }}
                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm">
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Summary row */}
          {!selectedParty && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 border-b border-gray-100">
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500"/>Total Dr Balance</p>
                <p className="text-sm font-bold text-green-700">₹{totalDr.toLocaleString("en-IN",{maximumFractionDigits:0})}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500"/>Total Cr Balance</p>
                <p className="text-sm font-bold text-red-700">₹{totalCr.toLocaleString("en-IN",{maximumFractionDigits:0})}</p>
              </div>
            </div>
          )}

          {/* Party rows */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No {TAB_CFG[tab].label.toLowerCase()} found</p>
                {tab === "employees" && <p className="text-xs mt-1">Payroll data needed in seed</p>}
              </div>
            ) : (
              filtered.map(party => {
                const isSelected = selectedParty?.id === party.id;
                return (
                  <button key={party.id} onClick={() => { setSelectedParty(party); setAccountHeadFilter("All"); }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-blue-800" : "text-gray-800"}`}>{party.name}</p>
                      <p className="text-xs text-gray-400 truncate">{party.reference} · {party.subText}</p>
                    </div>
                    <div className="ml-3 text-right shrink-0">
                      <p className={`text-sm font-bold ${party.closingType === "Dr" ? "text-green-700" : party.closingType === "Cr" ? "text-red-600" : "text-gray-400"}`}>
                        {party.closingBalance > 0 ? `₹${party.closingBalance.toLocaleString("en-IN",{maximumFractionDigits:0})}` : "₹0"}
                      </p>
                      <p className="text-xs text-gray-400">{party.closingType === "Nil" ? "Nil" : party.closingType}</p>
                    </div>
                    {selectedParty?.id !== party.id && <ChevronRight className="ml-2 w-4 h-4 text-gray-300 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Ledger detail ───────────────────────────────── */}
        {selectedParty && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Party header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setSelectedParty(null)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedParty.name}</h2>
                  <p className="text-xs text-gray-400">{selectedParty.reference} · {selectedParty.subText}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  {/* Account head drill-down filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select value={accountHeadFilter} onChange={e => setAccountHeadFilter(e.target.value)}
                      className="px-2 py-1.5 border border-gray-200 rounded text-sm min-w-[220px]">
                      {accountHeads.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <button onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded text-sm hover:bg-gray-50">
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                </div>
              </div>

              {/* Opening / Closing balance summary */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label:"Opening Balance", val: selectedParty.openingBalance, type: selectedParty.openingType, bg:"bg-gray-50" },
                  { label:"Total Debits",    val: visibleLines.reduce((s,l)=>s+l.dr,0),    type:"Dr",  bg:"bg-blue-50" },
                  { label:"Total Credits",   val: visibleLines.reduce((s,l)=>s+l.cr,0),    type:"Cr",  bg:"bg-orange-50" },
                  { label:"Closing Balance", val: selectedParty.closingBalance, type: selectedParty.closingType, bg: selectedParty.closingType === "Cr" ? "bg-red-50" : "bg-green-50" },
                ].map(({label, val, type, bg}) => (
                  <div key={label} className={`${bg} rounded-lg p-3`}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className={`text-sm font-bold ${type === "Cr" ? "text-red-700" : "text-green-700"}`}>
                      {fmt(val)} <span className="text-xs font-normal text-gray-400">{type !== "Nil" ? type : ""}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ledger table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-800 text-white">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium w-28">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium">Particulars</th>
                    <th className="text-left px-4 py-3 text-xs font-medium w-36">Voucher No</th>
                    <th className="text-left px-4 py-3 text-xs font-medium w-44">Account Head</th>
                    <th className="text-right px-4 py-3 text-xs font-medium w-28">Debit</th>
                    <th className="text-right px-4 py-3 text-xs font-medium w-28">Credit</th>
                    <th className="text-right px-4 py-3 text-xs font-medium w-32">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening balance row */}
                  <tr className="bg-amber-50 border-b border-amber-100">
                    <td className="px-4 py-2 text-xs text-gray-500">{from !== "2026-01-01" ? fmtD(from) : "Opening"}</td>
                    <td className="px-4 py-2 text-xs font-semibold text-gray-700" colSpan={3}>Opening Balance</td>
                    <td className="px-4 py-2 text-right text-xs text-gray-500">—</td>
                    <td className="px-4 py-2 text-right text-xs text-gray-500">—</td>
                    <td className="px-4 py-2 text-right text-xs font-semibold text-gray-700">
                      {fmt(selectedParty.openingBalance)} <span className="text-gray-400">{selectedParty.openingType !== "Nil" ? selectedParty.openingType : ""}</span>
                    </td>
                  </tr>

                  {visibleLines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                        No transactions found for this period{accountHeadFilter !== "All" ? ` under ${accountHeadFilter}` : ""}
                      </td>
                    </tr>
                  ) : (
                    visibleLines.map((line, i) => (
                      <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                        <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtD(line.date)}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-700">{line.particulars}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-blue-600">{line.voucherNo}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{line.accountHead}</td>
                        <td className="px-4 py-2.5 text-right text-sm font-medium text-blue-700">
                          {line.dr > 0 ? fmt(line.dr) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm font-medium text-orange-600">
                          {line.cr > 0 ? fmt(line.cr) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm font-semibold">
                          <span className={line.balanceType === "Dr" ? "text-green-700" : line.balanceType === "Cr" ? "text-red-600" : "text-gray-400"}>
                            {fmt(line.balance)}
                          </span>
                          <span className="ml-1 text-xs text-gray-400">{line.balanceType !== "Nil" ? line.balanceType : ""}</span>
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Closing balance row */}
                  {visibleLines.length > 0 && (
                    <tr className="bg-gray-800 text-white">
                      <td className="px-4 py-2.5 text-xs">{fmtD(to)}</td>
                      <td className="px-4 py-2.5 text-xs font-bold" colSpan={3}>Closing Balance</td>
                      <td className="px-4 py-2.5 text-right text-sm font-bold">
                        {fmt(visibleLines.reduce((s,l)=>s+l.dr,0))}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-bold">
                        {fmt(visibleLines.reduce((s,l)=>s+l.cr,0))}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-bold">
                        {fmt(selectedParty.closingBalance)}
                        <span className="ml-1 text-xs opacity-70">{selectedParty.closingType !== "Nil" ? selectedParty.closingType : ""}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
