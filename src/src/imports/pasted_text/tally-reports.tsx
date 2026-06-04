Priority 5 & 6: Tally-Format P&L + Balance Sheet (Points 1 & 2)

This is Phase 3 of 5. Rebuild ProfitLossReport and BalanceSheet to Tally vertical format with collapsible groups.

CHANGE 1 — src/app/components/finance/reports/ProfitLossReport.tsx — Tally vertical format
Completely replace the existing mock-data P&L with a live Tally-format report.
Add imports:
tsimport { accountingEntryService } from "../../../services/accountingEntryService";
import { useCity } from "../../../contexts/CityContext";
Report structure — derive from real ledger entries:
ts  const movements = accountingEntryService.getAllMovements(fromDate, toDate, city);
  const ledgers   = accountingEntryService.getLedgers(city);

  // Build P&L groups
  const INCOME_GROUPS = [
    { key: "sales",       label: "Sales",        heads: ["sales_subscription","sales_service","sales_renewal"] },
    { key: "other_income",label: "Other Income",  heads: ["other_income"] },
  ];
  const EXPENSE_GROUPS = [
    { key: "cogs",        label: "Cost of Goods Sold", heads: ["cogs"] },
    { key: "direct",      label: "Direct Expenses",    heads: ["direct_expenses"] },
    { key: "indirect",    label: "Indirect Expenses",  heads: ["indirect_expenses"] },
    { key: "depreciation",label: "Depreciation",       heads: ["depreciation"] },
  ];

  // For each group, sum all ledger movements in that account head
  const groupTotals = (groups: typeof INCOME_GROUPS) =>
    groups.map(g => {
      const groupLedgers = ledgers.filter(l => g.heads.includes(l.accountHead));
      const ledgerRows = groupLedgers.map(ldr => {
        const cr = movements.filter(m => m.creditLedgerId === ldr.id).reduce((s,m)=>s+m.amount,0);
        const dr = movements.filter(m => m.debitLedgerId  === ldr.id).reduce((s,m)=>s+m.amount,0);
        return { name: ldr.name, amount: cr - dr };
      }).filter(r => r.amount !== 0);
      const total = ledgerRows.reduce((s,r)=>s+r.amount,0);
      return { ...g, ledgerRows, total };
    });
Render in Tally vertical format with collapsible group rows:
tsx  <div className="font-mono text-sm bg-white border rounded-xl p-6">
    <div className="text-center font-bold text-base mb-1">PROFIT & LOSS ACCOUNT</div>
    <div className="text-center text-gray-500 text-xs mb-4">
      For the period: {fromDate} to {toDate}
    </div>
    <div className="border-t-2 border-gray-800 pt-3">
      {/* INCOME section */}
      <div className="flex justify-between font-bold text-gray-700 mb-2">
        <span>INCOME</span><span>₹</span>
      </div>
      {incomeGroups.map(group => (
        <div key={group.key}>
          <button className="w-full flex justify-between hover:bg-gray-50 px-1 py-0.5"
            onClick={() => toggleGroup(group.key)}>
            <span className="font-medium">{group.label}</span>
            <span>₹{group.total.toLocaleString("en-IN")}</span>
          </button>
          {expandedGroups.has(group.key) && group.ledgerRows.map(row => (
            <div key={row.name} className="flex justify-between pl-6 text-gray-600 text-xs py-0.5">
              <span>{row.name}</span>
              <span>₹{row.amount.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      ))}
      {/* Gross Income */}
      <div className="border-t mt-2 pt-1 flex justify-between font-bold">
        <span>GROSS INCOME</span>
        <span>₹{grossIncome.toLocaleString("en-IN")}</span>
      </div>

      {/* EXPENDITURE section — same pattern */}
      ...

      {/* Net Profit/Loss */}
      <div className={`border-t-2 mt-2 pt-2 flex justify-between text-base font-bold ${
        netProfit >= 0 ? "text-green-700" : "text-red-700"
      }`}>
        <span>{netProfit >= 0 ? "NET PROFIT" : "NET LOSS"}</span>
        <span>₹{Math.abs(netProfit).toLocaleString("en-IN")}</span>
      </div>
    </div>
  </div>
Controls above the report:

Period: Monthly / Quarterly / Yearly / Custom (date range pickers)
City filter
Comparison toggle (shows previous period column alongside current)
Export PDF button | Export Excel button


CHANGE 2 — src/app/components/accounts/BalanceSheet.tsx — Tally two-column format
Rebuild to show the exact two-column Tally layout from the spec (Liabilities on left, Assets on right).
Left column — Liabilities:
Capital & Reserves     X,XX,XXX
  Capital Stock         XX,XXX
  Retained Earnings     XX,XXX

Current Liabilities    X,XX,XXX
  Accounts Payable      XX,XXX
  TDS Payable            X,XXX
  GST Payable            X,XXX
  Output IGST            X,XXX
  Output CGST            X,XXX
  Output SGST            X,XXX

Credit Cards           X,XX,XXX
  One Card 5447         XX,XXX
  ICICI 9004             X,XXX

TOTAL LIABILITIES      X,XX,XXX
Right column — Assets:
Fixed Assets           X,XX,XXX
  Furniture & Equip.    XX,XXX
  WFH Table              X,XXX

Cash & Bank            X,XX,XXX
  Axis Bank             XX,XXX
  Petty Cash             X,XXX
  Razorpay               X,XXX

Accounts Receivable    X,XX,XXX
  [Each customer debtor ledger]

Other Current Assets   X,XX,XXX
  Input IGST             X,XXX
  TDS Receivable         X,XXX
  Advance Tax            X,XXX

TOTAL ASSETS           X,XX,XXX
Same collapsible group pattern as P&L. Balance validation banner at bottom — green if Assets = Liabilities, red if not with difference shown.
Do not change any other file in Phase 3.