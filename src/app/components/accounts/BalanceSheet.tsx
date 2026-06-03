import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService, CHART_OF_ACCOUNTS_HEADS } from "../../services/accountingEntryService";
import { Download, AlertCircle, CheckCircle2, ChevronRight, ChevronDown } from "lucide-react";

export function BalanceSheet() {
  const { city } = useCity();
  const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split("T")[0]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  // Get all ledger balances as of the selected date
  // AC1 FIX: getLedgerBalance() reads all-time data — doesn't respect asOnDate.
  // Recomputed from movements up to asOnDate so the date picker actually works.
  const ledgerBalances = useMemo(() => {
    const allLedgers = accountingEntryService.getLedgers(city);
    // Pre-period movements (carry-forward opening balance before FY start)
    const fyYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const fyStart = `${fyYear}-04-01`;
    const openingMovements = accountingEntryService.getAllMovements("1900-01-01", fyStart, city);
    const periodMovements  = accountingEntryService.getAllMovements(fyStart, asOnDate, city);

    return allLedgers.map(ledger => {
      // Start from opening balance
      let dr = ledger.openingBalanceType === "Dr" ? ledger.openingBalance : 0;
      let cr = ledger.openingBalanceType === "Cr" ? ledger.openingBalance : 0;

      // Add opening carry-forward
      openingMovements.forEach(mov => {
        if (mov.debitLedgerId  === ledger.id) dr += mov.amount;
        if (mov.creditLedgerId === ledger.id) cr += mov.amount;
      });
      // Add period movements
      periodMovements.forEach(mov => {
        if (mov.debitLedgerId  === ledger.id) dr += mov.amount;
        if (mov.creditLedgerId === ledger.id) cr += mov.amount;
      });

      const netBalance = dr - cr;
      return {
        ...accountingEntryService.getLedgerBalance(ledger.id), // keep shape
        balance: Math.abs(netBalance),
        balanceType: netBalance >= 0 ? "Dr" : "Cr",
        accountHead: ledger.accountHead,
        accountHeadLabel: ledger.accountHeadLabel,
      };
    });
  }, [city, asOnDate]);

  // Group ledgers by account head
  const ledgersByHead = useMemo(() => {
    const grouped: Record<string, typeof ledgerBalances> = {};
    ledgerBalances.forEach(bal => {
      if (!grouped[bal.accountHead]) {
        grouped[bal.accountHead] = [];
      }
      grouped[bal.accountHead].push(bal);
    });
    return grouped;
  }, [ledgerBalances]);

  // Calculate Liabilities
  const liabilities = useMemo(() => {
    const liabilityHeads = CHART_OF_ACCOUNTS_HEADS.filter(h => h.nature === "liability");
    const sections: Array<{ head: string; headLabel: string; ledgers: typeof ledgerBalances; subtotal: number }> = [];
    let total = 0;

    liabilityHeads.forEach(head => {
      const ledgers = ledgersByHead[head.value] || [];
      const ledgersWithBalance = ledgers.filter(l => Math.abs(l.balance) > 0.01);
      if (ledgersWithBalance.length === 0) return;

      const subtotal = ledgersWithBalance.reduce((sum, l) => {
        const amount = l.balanceType === "Cr" ? l.balance : -l.balance;
        return sum + amount;
      }, 0);
      total += subtotal;
      sections.push({ head: head.value, headLabel: head.label, ledgers: ledgersWithBalance, subtotal });
    });

    return { sections, total };
  }, [ledgersByHead]);

  // Calculate Assets
  const assets = useMemo(() => {
    const assetHeads = CHART_OF_ACCOUNTS_HEADS.filter(h => h.nature === "asset");
    const sections: Array<{ head: string; headLabel: string; ledgers: typeof ledgerBalances; subtotal: number }> = [];
    let total = 0;

    assetHeads.forEach(head => {
      const ledgers = ledgersByHead[head.value] || [];
      const ledgersWithBalance = ledgers.filter(l => Math.abs(l.balance) > 0.01);
      if (ledgersWithBalance.length === 0) return;

      const subtotal = ledgersWithBalance.reduce((sum, l) => {
        const amount = l.balanceType === "Dr" ? l.balance : -l.balance;
        return sum + amount;
      }, 0);
      total += subtotal;
      sections.push({ head: head.value, headLabel: head.label, ledgers: ledgersWithBalance, subtotal });
    });

    return { sections, total };
  }, [ledgersByHead]);

  // Calculate Profit & Loss
  const profitLoss = useMemo(() => {
    const movements = accountingEntryService.getAllMovements(
      `${new Date().getFullYear() - (new Date().getMonth() < 3 ? 1 : 0)}-04-01`,
      asOnDate,
      city
    );
    // Income: credit movements to income ledgers
    const incomeLedgerIds = new Set(
      accountingEntryService.getLedgers(city)
        .filter(l => l.nature === "income")
        .map(l => l.id)
    );
    // Expense: debit movements to expense ledgers
    const expenseLedgerIds = new Set(
      accountingEntryService.getLedgers(city)
        .filter(l => l.nature === "expense")
        .map(l => l.id)
    );
    const totalIncome = movements
      .filter(m => incomeLedgerIds.has(m.creditLedgerId))
      .reduce((s, m) => s + m.amount, 0);
    const totalExpenses = movements
      .filter(m => expenseLedgerIds.has(m.debitLedgerId))
      .reduce((s, m) => s + m.amount, 0);
    return { totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses };
  }, [city, asOnDate]);

  const totalLiabilitiesAndCapital = liabilities.total + profitLoss.netProfit;
  const imbalance = assets.total - totalLiabilitiesAndCapital;
  const isBalanced = Math.abs(imbalance) < 0.01;

  const exportCSV = () => {
    const rows: string[][] = [
      ["BALANCE SHEET", `As on ${asOnDate}`],
      [""],
      ["LIABILITIES", "Amount (₹)", "ASSETS", "Amount (₹)"],
    ];

    // Build rows side by side
    const leftRows: string[][] = [];
    liabilities.sections.forEach(section => {
      leftRows.push([section.headLabel.toUpperCase(), ""]);
      section.ledgers.forEach(ledger => {
        leftRows.push([`  ${ledger.ledgerName}`, (ledger.balanceType === "Cr" ? ledger.balance : -ledger.balance).toFixed(2)]);
      });
      leftRows.push([`Subtotal`, (section?.subtotal ?? 0).toFixed(2)]);
    });
    leftRows.push(["PROFIT & LOSS", ""]);
    leftRows.push([`  Net Profit`, (profitLoss?.netProfit ?? 0).toFixed(2)]);
    leftRows.push(["TOTAL LIABILITIES", totalLiabilitiesAndCapital.toFixed(2)]);

    const rightRows: string[][] = [];
    assets.sections.forEach(section => {
      rightRows.push([section.headLabel.toUpperCase(), ""]);
      section.ledgers.forEach(ledger => {
        rightRows.push([`  ${ledger.ledgerName}`, (ledger.balanceType === "Dr" ? ledger.balance : -ledger.balance).toFixed(2)]);
      });
      rightRows.push([`Subtotal`, (section?.subtotal ?? 0).toFixed(2)]);
    });
    rightRows.push(["TOTAL ASSETS", (assets?.total ?? 0).toFixed(2)]);

    for (let i = 0; i < Math.max(leftRows.length, rightRows.length); i++) {
      const left = leftRows[i] || ["", ""];
      const right = rightRows[i] || ["", ""];
      rows.push([left[0], left[1], right[0], right[1]]);
    }

    const csv = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `balance-sheet-${asOnDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Balance Sheet</h1>
          <p className="text-sm text-gray-600">Tally-format two-column report</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Date Selector */}
      <div className="p-4 bg-gray-50 rounded">
        <label className="block text-sm font-medium mb-1">As on Date</label>
        <input
          type="date"
          value={asOnDate}
          onChange={(e) => setAsOnDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Two-Column Tally Format Balance Sheet */}
      <div className="font-mono text-sm bg-white border-2 border-gray-800 rounded-xl overflow-hidden">
        <div className="text-center font-bold text-base py-3 border-b-2 border-gray-800">
          BALANCE SHEET
          <div className="text-xs text-gray-500 mt-1">As on {asOnDate}</div>
        </div>

        <div className="grid grid-cols-2 divide-x-2 divide-gray-800">
          {/* LEFT COLUMN - LIABILITIES */}
          <div className="p-4">
            <div className="font-bold text-gray-700 mb-3">LIABILITIES</div>

            {liabilities.sections.map(section => (
              <div key={section.head} className="mb-3">
                <button
                  className="w-full flex items-center justify-between hover:bg-gray-50 px-1 py-0.5 rounded"
                  onClick={() => toggleGroup(`liab-${section.head}`)}
                >
                  <span className="flex items-center gap-1 font-medium">
                    {expandedGroups.has(`liab-${section.head}`) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    {section.headLabel}
                  </span>
                  <span>₹{section.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </button>
                {expandedGroups.has(`liab-${section.head}`) && section.ledgers.map(ledger => (
                  <div key={ledger.ledgerId} className="flex justify-between pl-6 text-gray-600 text-xs py-0.5">
                    <span>{ledger.ledgerName}</span>
                    <span>₹{(ledger.balanceType === "Cr" ? ledger.balance : -ledger.balance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            ))}

            {/* Profit & Loss */}
            {profitLoss.netProfit !== 0 && (
              <div className="mb-3">
                <button
                  className="w-full flex items-center justify-between hover:bg-gray-50 px-1 py-0.5 rounded"
                  onClick={() => toggleGroup('profit-loss')}
                >
                  <span className="flex items-center gap-1 font-medium">
                    {expandedGroups.has('profit-loss') ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    Profit & Loss
                  </span>
                  <span className={profitLoss.netProfit >= 0 ? "text-green-700" : "text-red-700"}>
                    ₹{profitLoss.netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </button>
                {expandedGroups.has('profit-loss') && (
                  <>
                    <div className="flex justify-between pl-6 text-gray-600 text-xs py-0.5">
                      <span>Total Income</span>
                      <span>₹{profitLoss.totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-6 text-gray-600 text-xs py-0.5">
                      <span>Less: Expenses</span>
                      <span>₹{profitLoss.totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Total Liabilities */}
            <div className="border-t-2 border-gray-800 pt-2 mt-4 flex justify-between font-bold">
              <span>TOTAL LIABILITIES</span>
              <span>₹{totalLiabilitiesAndCapital.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* RIGHT COLUMN - ASSETS */}
          <div className="p-4">
            <div className="font-bold text-gray-700 mb-3">ASSETS</div>

            {assets.sections.map(section => (
              <div key={section.head} className="mb-3">
                <button
                  className="w-full flex items-center justify-between hover:bg-gray-50 px-1 py-0.5 rounded"
                  onClick={() => toggleGroup(`asset-${section.head}`)}
                >
                  <span className="flex items-center gap-1 font-medium">
                    {expandedGroups.has(`asset-${section.head}`) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    {section.headLabel}
                  </span>
                  <span>₹{section.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </button>
                {expandedGroups.has(`asset-${section.head}`) && section.ledgers.map(ledger => (
                  <div key={ledger.ledgerId} className="flex justify-between pl-6 text-gray-600 text-xs py-0.5">
                    <span>{ledger.ledgerName}</span>
                    <span>₹{(ledger.balanceType === "Dr" ? ledger.balance : -ledger.balance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            ))}

            {/* Total Assets */}
            <div className="border-t-2 border-gray-800 pt-2 mt-4 flex justify-between font-bold">
              <span>TOTAL ASSETS</span>
              <span>₹{assets.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Validation Banner */}
      <div className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
        isBalanced
          ? "bg-green-50 border-green-400 text-green-900"
          : "bg-red-50 border-red-400 text-red-900"
      }`}>
        {isBalanced ? (
          <CheckCircle2 className="w-5 h-5 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 mt-0.5" />
        )}
        <div>
          {isBalanced ? (
            <>
              <p className="font-bold">✓ Balance Sheet is balanced</p>
              <p className="text-sm mt-1">Assets = Liabilities (₹{assets.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</p>
            </>
          ) : (
            <>
              <p className="font-bold">⚠ Balance Sheet is out of balance</p>
              <p className="text-sm mt-1">
                Difference: ₹{Math.abs(imbalance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {imbalance > 0 ? " (Assets exceed Liabilities)" : " (Liabilities exceed Assets)"}
              </p>
              <p className="text-sm mt-1">Assets: ₹{assets.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Liabilities: ₹{totalLiabilitiesAndCapital.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
