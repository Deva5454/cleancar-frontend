/**
 * TDSPayableModule — /accounts/tds-payable
 *
 * BUGS FIXED:
 * T1  — CRASH: movement.creditLedgerName / debitLedgerName don't exist on getAllMovements()
 *        return type. Fixed: resolve names from ledger lookup map keyed by ledger id.
 * T2  — window.location.reload() after payment → infinite buffering/SPA reload loop.
 *        Fixed: update local React state instead.
 * T3  — isPaid never persisted. tdsBySection.isPaid was always false after any reload.
 *        Fixed: paid records stored in DataService under "ADVANCE_MANAGEMENT" (TDS_PAID sub-key),
 *        loaded on mount and on city change.
 * T4  — bankLedgers called outside useMemo → getLedgers() called on every render.
 *        Fixed: memoised with [city] dependency.
 * T5  — tdsBySection recomputed O(n×journals) on every keystroke in payment form.
 *        Fixed: bankLedgers memo, stable dependencies.
 * T6  — Section parsed from creditLedgerName (undefined field).
 *        Fixed: creditLedgerId → ledgerMap lookup → .name.match(/194[A-Z]+/).
 * T7  — deducteeName from debitLedgerName (undefined). Fixed: debitLedgerId → ledgerMap.
 * T8  — Payment journal used tdsLedger.accountHead as accountHead; JournalLine needs the ID.
 *        Fixed: use tdsLedger.id for accountHead in journal lines.
 */

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService, TDS_RATE_CHART } from "../../services/accountingEntryService";
import { DataService } from "../../services/DataService";
import { Download, AlertTriangle, CheckCircle } from "lucide-react";

// ── Persistence key for paid TDS records ────────────────────────────────────
const TDS_PAID_KEY = "ADVANCE_MANAGEMENT" as const;

interface TDSPaidRecord {
  id: string;
  cityId: string;
  section: string;
  month: string;        // "YYYY-MM"
  amount: number;
  challanNumber: string;
  bank: string;
  paidDate: string;
  journalId?: string;
  createdAt: string;
}

type TabType = "Rate Chart" | "TDS Payable" | "Monthly Report";

// ── Month label helpers ──────────────────────────────────────────────────────
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function entryMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

function getDueDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const m = d.getMonth();
  const y = d.getFullYear();
  if (m === 2) return `30 Apr ${y}`;          // March → 30 April
  const dueM = (m + 1) % 12;
  const dueY = m === 11 ? y + 1 : y;
  return `7 ${MONTH_NAMES[dueM]} ${dueY}`;
}

function isDue(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr);
  const m = d.getMonth();
  const y = d.getFullYear();
  const due = m === 2
    ? new Date(y, 3, 30)
    : new Date(m === 11 ? y + 1 : y, (m + 1) % 12, 7);
  return today > due;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function TDSPayableModule() {
  const { city, cityInfo } = useCity();
  const [activeTab, setActiveTab] = useState<TabType>("TDS Payable");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear());
  const [paymentModal, setPaymentModal] = useState<{
    section: string; amount: number; month: string;
  } | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    bank: "", challanNumber: "", paymentDate: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  // ── T3 FIX: load paid records from DataService ───────────────────────────
  const [paidRecords, setPaidRecords] = useState<TDSPaidRecord[]>(() =>
    DataService.get<TDSPaidRecord>(TDS_PAID_KEY).filter(
      r => (r as any).__type === "TDS_PAID" && r.cityId === city
    )
  );

  // Reload when city changes
  useMemo(() => {
    setPaidRecords(
      DataService.get<TDSPaidRecord>(TDS_PAID_KEY).filter(
        r => (r as any).__type === "TDS_PAID" && r.cityId === city
      )
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  // ── T4 FIX: bankLedgers memoised ────────────────────────────────────────
  const bankLedgers = useMemo(
    () => accountingEntryService.getLedgers(city).filter(l => l.accountHead === "cash_bank"),
    [city]
  );

  // ── T1/T6/T7 FIX: build a ledger id → name lookup map once ──────────────
  const ledgerMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    accountingEntryService.getLedgers(city).forEach(l => { map[l.id] = l.name; });
    return map;
  }, [city]);

  // ── TDS entries from journals ────────────────────────────────────────────
  const tdsEntries = useMemo(() => {
    const allMovements = accountingEntryService.getAllMovements(
      "2025-04-01", "2027-03-31", city
    );
    const tdsLedgers = accountingEntryService
      .getLedgers(city)
      .filter(l => l.accountHead === "tds_payable");
    const tdsIds = new Set(tdsLedgers.map(l => l.id));
    return allMovements.filter(m => tdsIds.has(m.creditLedgerId));
  }, [city, ledgerMap]);    // ledgerMap included so map is ready when entries process

  // ── T5/T6/T7 FIX: section grouping with name resolution ─────────────────
  const tdsBySection = useMemo(() => {
    type SectionData = {
      section: string; nature: string;
      entries: Array<{ date: string; deducteeName: string; invoiceRef: string; taxableAmount: number; tdsAmount: number; }>;
      totalTDS: number; paidMonths: Set<string>;
    };
    const grouped: Record<string, SectionData> = {};

    tdsEntries.forEach(movement => {
      // T6 FIX: resolve name via ledger map
      const creditName = ledgerMap[movement.creditLedgerId] || "";
      const sectionMatch = creditName.match(/194[A-Z]?/);
      const section = sectionMatch ? sectionMatch[0] : "Other";

      if (!grouped[section]) {
        const rateInfo = TDS_RATE_CHART.find(r => r.section === section);
        grouped[section] = {
          section, nature: rateInfo?.nature || "Unknown",
          entries: [], totalTDS: 0, paidMonths: new Set(),
        };
      }

      // T7 FIX: resolve deductee name via ledger map
      const deducteeName = ledgerMap[movement.debitLedgerId] || movement.description || "Unknown";

      grouped[section].entries.push({
        date: movement.date,
        deducteeName,
        invoiceRef: movement.description || movement.voucherNumber || "-",
        taxableAmount: movement.amount * 10,
        tdsAmount: movement.amount,
      });
      grouped[section].totalTDS += movement.amount;
    });

    // Overlay paid status from DataService records (T3 FIX)
    paidRecords.forEach(pr => {
      if (grouped[pr.section]) {
        grouped[pr.section].paidMonths.add(pr.month);
      }
    });

    return grouped;
  }, [tdsEntries, ledgerMap, paidRecords]);

  // ── Overdue sections ─────────────────────────────────────────────────────
  const overdueSections = useMemo(() => {
    return Object.entries(tdsBySection)
      .filter(([, data]) => {
        const latest = data.entries[data.entries.length - 1];
        if (!latest || data.totalTDS === 0) return false;
        const month = entryMonthKey(latest.date);
        if (data.paidMonths.has(month)) return false;
        return isDue(latest.date);
      })
      .map(([section]) => section);
  }, [tdsBySection]);

  // ── Monthly report ───────────────────────────────────────────────────────
  const monthlyReport = useMemo(() => {
    const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2,"0")}`;
    return Object.entries(tdsBySection).map(([section, data]) => {
      const monthEntries = data.entries.filter(e => entryMonthKey(e.date) === currentMonthKey);
      const isPaid = data.paidMonths.has(currentMonthKey);
      const paidRec = paidRecords.find(p => p.section === section && p.month === currentMonthKey);
      return {
        section, nature: data.nature,
        deducteeCount: new Set(monthEntries.map(e => e.deducteeName)).size,
        taxableAmount: monthEntries.reduce((s, e) => s + e.taxableAmount, 0),
        tdsAmount:     monthEntries.reduce((s, e) => s + e.tdsAmount,     0),
        status: isPaid ? "Paid" : "Pending",
        challanNumber: paidRec?.challanNumber || "-",
      };
    });
  }, [tdsBySection, selectedMonth, selectedYear, paidRecords]);

  // ── Due date for a section ───────────────────────────────────────────────
  const getDueDate = useCallback((section: string): string => {
    const entries = tdsBySection[section]?.entries || [];
    if (!entries.length) return "-";
    return getDueDateLabel(entries[entries.length - 1].date);
  }, [tdsBySection]);

  // ── Payment handler (T2/T3/T8 FIX) ─────────────────────────────────────
  const handlePayNow = (section: string, amount: number) => {
    const latest = tdsBySection[section]?.entries[tdsBySection[section].entries.length - 1];
    const month = latest ? entryMonthKey(latest.date) : entryMonthKey(new Date().toISOString());
    setPaymentModal({ section, amount, month });
    setPaymentForm({ bank: "", challanNumber: "", paymentDate: new Date().toISOString().split("T")[0] });
  };

  const handleConfirmPayment = useCallback(async () => {
    if (!paymentModal || saving) return;
    if (!paymentForm.bank) { toast.error("Select a bank account"); return; }
    if (!paymentForm.challanNumber) { toast.error("Enter challan number"); return; }

    setSaving(true);
    try {
      // T8 FIX: use ledger.id (not accountHead) for JournalLine accountHead
      const tdsLedger = accountingEntryService
        .getLedgers(city)
        .find(l => l.name.includes(paymentModal.section) && l.accountHead === "tds_payable");
      const bankLedger = accountingEntryService
        .getLedgers(city)
        .find(l => l.name === paymentForm.bank);

      if (!tdsLedger) { toast.error(`TDS ledger for section ${paymentModal.section} not found`); return; }
      if (!bankLedger) { toast.error(`Bank ledger '${paymentForm.bank}' not found`); return; }

      const journal = accountingEntryService.createJournal(
        {
          date: paymentForm.paymentDate,
          narration: `TDS Payment — Section ${paymentModal.section} — Challan ${paymentForm.challanNumber}`,
          lines: [
            // T8 FIX: use .id not .accountHead
            { accountHead: tdsLedger.id,  accountLabel: tdsLedger.name,  debit: paymentModal.amount, credit: 0 },
            { accountHead: bankLedger.id, accountLabel: bankLedger.name, debit: 0, credit: paymentModal.amount },
          ],
          city: cityInfo.displayName, cityId: city,
          createdBy: "TDS Module",
        },
        cityInfo.displayName
      );

      // T3 FIX: persist paid record
      const record: TDSPaidRecord = {
        id: `TDS-${city}-${paymentModal.section}-${paymentModal.month}-${Date.now()}`,
        __type: "TDS_PAID",
        cityId: city,
        section: paymentModal.section,
        month: paymentModal.month,
        amount: paymentModal.amount,
        challanNumber: paymentForm.challanNumber,
        bank: paymentForm.bank,
        paidDate: paymentForm.paymentDate,
        journalId: journal.id,
        createdAt: new Date().toISOString(),
      } as any;
      DataService.insert(TDS_PAID_KEY, record);

      // T2 FIX: update local state instead of window.location.reload()
      setPaidRecords(prev => [...prev, record as TDSPaidRecord]);

      toast.success(`TDS Section ${paymentModal.section} payment recorded ✓`);
      setPaymentModal(null);
      setPaymentForm({ bank: "", challanNumber: "", paymentDate: new Date().toISOString().split("T")[0] });
    } catch (e) {
      toast.error("Payment recording failed. Please try again.");
      console.error("[TDS] payment error:", e);
    } finally {
      setSaving(false);
    }
  }, [paymentModal, paymentForm, city, cityInfo, saving]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">TDS Payable</h1>
          <p className="text-sm text-gray-600">Tax Deducted at Source — {cityInfo.displayName}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded text-blue-600 hover:bg-blue-50">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Overdue Alert */}
      {overdueSections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">TDS overdue for sections:</p>
            <p className="text-sm text-red-700">
              {overdueSections.join(", ")} — deposit immediately to avoid penalties
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["Rate Chart", "TDS Payable", "Monthly Report"] as TabType[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Rate Chart Tab */}
      {activeTab === "Rate Chart" && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
            <strong>Note:</strong> TDS must be deposited by the 7th of the following month
            (except March — due 30th April).
          </div>
          <div className="border rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Section","Nature of Payment","Rate (Individual)","Rate (Company)","Threshold (Single)","Threshold (Annual)"]
                    .map(h => <th key={h} className="px-4 py-3 text-left text-sm font-medium text-gray-700">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y">
                {TDS_RATE_CHART.map(rate => (
                  <tr key={rate.section} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{rate.section}</td>
                    <td className="px-4 py-3 text-sm">{rate.nature}</td>
                    <td className="px-4 py-3 text-sm text-right">{rate.rateIndividual}%</td>
                    <td className="px-4 py-3 text-sm text-right">{rate.rateCompany}%</td>
                    <td className="px-4 py-3 text-sm text-right">₹{(rate?.thresholdSingle ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right">₹{(rate?.thresholdAnnual ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TDS Payable Tab */}
      {activeTab === "TDS Payable" && (
        <div className="space-y-6">
          {Object.entries(tdsBySection).map(([section, data]) => {
            const latestEntry = data.entries[data.entries.length - 1];
            const currentMonth = latestEntry ? entryMonthKey(latestEntry.date) : "";
            const isPaidThisMonth = currentMonth ? data.paidMonths.has(currentMonth) : false;
            const paidRec = paidRecords.find(p => p.section === section && p.month === currentMonth);
            return (
              <div key={section} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Section {section} — {data.nature}
                  </h3>
                  <span className="text-xl font-bold text-gray-900">
                    Total: ₹{data.totalTDS.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="space-y-1 font-mono text-sm mb-3">
                  {data.entries.map((entry, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-gray-700 gap-4 flex-wrap">
                      <span className="text-gray-500">{entry.date}</span>
                      <span>{entry.deducteeName}</span>
                      <span className="text-gray-500">{entry.invoiceRef}</span>
                      <span>
                        ₹{entry.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        {" "}(TDS: ₹{entry.tdsAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Due: {getDueDate(section)}</span>
                  {isPaidThisMonth ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Paid — {paidRec?.challanNumber}
                    </span>
                  ) : data.totalTDS > 0 ? (
                    <button onClick={() => handlePayNow(section, data.totalTDS)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                      Pay Now
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
          {Object.keys(tdsBySection).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No TDS entries found for {cityInfo.displayName}
            </div>
          )}
        </div>
      )}

      {/* Monthly Report Tab */}
      {activeTab === "Monthly Report" && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                className="border rounded px-3 py-2">
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                className="border rounded px-3 py-2">
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="border rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Section","Nature","Deductees","Taxable Amount","TDS Amount","Status","Challan No"]
                    .map(h => <th key={h} className="px-4 py-3 text-left text-sm font-medium text-gray-700">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthlyReport.filter(r => r.tdsAmount > 0).map(report => (
                  <tr key={report.section} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{report.section}</td>
                    <td className="px-4 py-3 text-sm">{report.nature}</td>
                    <td className="px-4 py-3 text-sm text-right">{report.deducteeCount}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      ₹{report.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      ₹{report.tdsAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        report.status === "Paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      }`}>{report.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{report.challanNumber}</td>
                  </tr>
                ))}
                {monthlyReport.every(r => r.tdsAmount === 0) && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No TDS entries for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold">Pay TDS — Section {paymentModal.section}</h3>
            <div className="p-3 bg-blue-50 rounded flex justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="font-bold text-blue-700">
                ₹{paymentModal.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Account *</label>
              <select value={paymentForm.bank}
                onChange={e => setPaymentForm(p => ({ ...p, bank: e.target.value }))}
                className="w-full border rounded px-3 py-2">
                <option value="">Select Bank</option>
                {bankLedgers.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
              {bankLedgers.length === 0 && (
                <p className="text-xs text-red-600 mt-1">No bank ledgers found.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Challan Number *</label>
              <input type="text" value={paymentForm.challanNumber}
                onChange={e => setPaymentForm(p => ({ ...p, challanNumber: e.target.value }))}
                placeholder="e.g. OLTAS/NSDL challan number"
                className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Date</label>
              <input type="date" value={paymentForm.paymentDate}
                onChange={e => setPaymentForm(p => ({ ...p, paymentDate: e.target.value }))}
                className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setPaymentModal(null)} disabled={saving}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleConfirmPayment}
                disabled={saving || !paymentForm.bank || !paymentForm.challanNumber}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
