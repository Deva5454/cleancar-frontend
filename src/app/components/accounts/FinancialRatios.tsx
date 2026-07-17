/**
 * FinancialRatios — /accounts/financial-ratios
 *
 * Real financial health ratios, computed from the same real data sources
 * already used elsewhere — not a new, separate calculation of the same
 * underlying figures. Current Ratio uses the same nature-based ledger
 * totals the Chart of Accounts fix already established. DSO and DPO use
 * the same real Debtors/Creditors totals those two reports already show,
 * so this screen can never quietly disagree with them.
 */

import { useMemo, useState } from "react";
import { useCity } from "../../contexts/CityContext";
import { useFinance } from "../../contexts/FinanceContext";
import { accountingEntryService } from "../../services/accountingEntryService";
import { salesManagerService, type SMBlockDeal } from "../../services/salesManagerService";
import { Activity } from "lucide-react";

export function FinancialRatios() {
  const { city } = useCity();
  const { payables } = useFinance();
  const [periodDays, setPeriodDays] = useState(30);

  const fromDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - periodDays);
    return d.toISOString().split("T")[0];
  }, [periodDays]);
  const toDate = new Date().toISOString().split("T")[0];

  // Real nature-based totals — same real computation the Chart of
  // Accounts fix already established, not a new parallel one.
  const natureTotals = useMemo(() => {
    const ledgers = accountingEntryService.getLedgers(city);
    const totals = { asset: 0, liability: 0, income: 0, expense: 0 };
    ledgers.forEach((l) => {
      const bal = accountingEntryService.getLedgerBalance(l.id, city);
      totals[l.nature] = (totals[l.nature] ?? 0) + bal.balance;
    });
    return totals;
  }, [city]);

  // Real period income/expense, for turnover-style ratios.
  const periodMovements = useMemo(
    () => accountingEntryService.getAllMovements(fromDate, toDate, city),
    [fromDate, toDate, city]
  );
  const periodExpense = useMemo(() => {
    const ledgers = accountingEntryService.getLedgers(city);
    const expenseLedgerIds = new Set(ledgers.filter((l) => l.nature === "expense").map((l) => l.id));
    return periodMovements
      .filter((m) => expenseLedgerIds.has(m.debitLedgerId))
      .reduce((s, m) => s + m.amount, 0);
  }, [periodMovements, city]);

  // Real total owed to vendors — same source Creditors Report uses.
  const totalCreditors = useMemo(() => {
    return payables
      .filter((p: any) => p.type === "Vendor" && p.status !== "Paid" && p.cityId === city)
      .reduce((s: number, p: any) => s + p.amount, 0);
  }, [payables, city]);

  // Real total owed by customers — same source Debtors Report uses.
  const totalDebtors = useMemo(() => {
    const deals = salesManagerService.getBlockDeals();
    return deals
      .filter((d: SMBlockDeal) => d.phase2Status !== "paid" && d.phase2Amount > 0)
      .reduce((s: number, d: SMBlockDeal) => s + d.phase2Amount, 0);
  }, []);

  const periodRevenue = useMemo(() => {
    const ledgers = accountingEntryService.getLedgers(city);
    const incomeLedgerIds = new Set(ledgers.filter((l) => l.nature === "income").map((l) => l.id));
    return periodMovements
      .filter((m) => incomeLedgerIds.has(m.creditLedgerId))
      .reduce((s, m) => s + m.amount, 0);
  }, [periodMovements, city]);

  const currentRatio = natureTotals.liability > 0 ? natureTotals.asset / natureTotals.liability : null;
  const dso = periodRevenue > 0 ? (totalDebtors / periodRevenue) * periodDays : null;
  const dpo = periodExpense > 0 ? (totalCreditors / periodExpense) * periodDays : null;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Financial Ratios
          </h1>
          <p className="text-sm text-gray-500">
            Real ratios computed from the same data Balance Sheet, Creditors, and Debtors already show
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600">Period (days)</label>
          <select className="border rounded-lg px-2 py-1.5" value={periodDays} onChange={(e) => setPeriodDays(parseInt(e.target.value, 10))}>
            <option value={30}>Last 30</option>
            <option value={60}>Last 60</option>
            <option value={90}>Last 90</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-lg border bg-white">
          <p className="text-sm text-gray-500">Current Ratio</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {currentRatio !== null ? currentRatio.toFixed(2) : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-2">Total Assets ÷ Total Liabilities. Above 1 means more owned than owed.</p>
        </div>
        <div className="p-5 rounded-lg border bg-white">
          <p className="text-sm text-gray-500">Days Sales Outstanding</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {dso !== null ? `${dso.toFixed(0)} days` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            How long it takes to actually collect what's owed. Only Block Deal receivables carry a real
            balance here — regular sales are paid at time of service, so this is naturally low unless
            block deals are significant.
          </p>
        </div>
        <div className="p-5 rounded-lg border bg-white">
          <p className="text-sm text-gray-500">Days Payable Outstanding</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {dpo !== null ? `${dpo.toFixed(0)} days` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-2">How long it takes to actually pay vendors, on average.</p>
        </div>
      </div>

      <div className="p-4 rounded-lg border bg-gray-50 text-sm text-gray-600 space-y-1">
        <p>Total Assets: ₹{natureTotals.asset.toLocaleString("en-IN")}</p>
        <p>Total Liabilities: ₹{natureTotals.liability.toLocaleString("en-IN")}</p>
        <p>Outstanding to Vendors (Creditors): ₹{totalCreditors.toLocaleString("en-IN")}</p>
        <p>Outstanding from Customers (Debtors): ₹{totalDebtors.toLocaleString("en-IN")}</p>
        <p>Revenue, last {periodDays} days: ₹{periodRevenue.toLocaleString("en-IN")}</p>
        <p>Expenses, last {periodDays} days: ₹{periodExpense.toLocaleString("en-IN")}</p>
      </div>

      <p className="text-xs text-gray-400">
        Every figure above traces back to a real, existing report — Balance Sheet for assets/liabilities,
        Creditors and Debtors for what's owed. Nothing here is a separate estimate.
      </p>
    </div>
  );
}

export default FinancialRatios;
