Critical Data Integrity (Auto-Ledger, Scoped EBITDA, P&L Real Data)

This is Phase 1 of 3. Fix only the 3 critical gaps. Do not touch reports, invoice management, or multi-city comparison in this phase.

CHANGE 1 — src/app/contexts/FinanceContext.tsx
1A — Auto-post ledger entry when revenue is recorded. Find:
ts  const recordRevenue = (revenueData: Omit<Revenue, "revenueId" | "createdAt">): Revenue => {
    const newRevenue: Revenue = {
      ...revenueData,
      revenueId: `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setRevenues((prev) => [...prev, newRevenue]);
    return newRevenue;
  };
Replace with:
ts  const recordRevenue = (revenueData: Omit<Revenue, "revenueId" | "createdAt">): Revenue => {
    const newRevenue: Revenue = {
      ...revenueData,
      revenueId: `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setRevenues((prev) => [...prev, newRevenue]);

    // Auto-post double-entry ledger entries
    const entryBase = {
      entryDate: revenueData.receivedDate,
      description: `Revenue — ${revenueData.type} (${revenueData.invoiceNumber || newRevenue.revenueId})`,
      referenceType: "Invoice" as const,
      referenceId: newRevenue.revenueId,
      cityId: revenueData.cityId,
      serviceType: revenueData.type,
      createdAt: new Date().toISOString(),
    };
    setLedgerEntries(prev => [...prev,
      // DR Bank/Receivable (Account 1100)
      { ...entryBase, ledgerEntryId: `LED-${Date.now()}-DR`, accountCode: "1100", accountName: "Accounts Receivable", entryType: "DEBIT" as const, amount: revenueData.amount },
      // CR Revenue (Account 4100)
      { ...entryBase, ledgerEntryId: `LED-${Date.now() + 1}-CR`, accountCode: "4100", accountName: "Service Revenue", entryType: "CREDIT" as const, amount: revenueData.amount },
    ]);

    return newRevenue;
  };
1B — Auto-post ledger entry when a payable is created. Find:
ts  const createPayable = (
    payableData: Omit<Payable, "payableId" | "createdAt" | "updatedAt">
  ): Payable => {
    const newPayable: Payable = {
      ...payableData,
      payableId: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPayables((prev) => [...prev, newPayable]);
    return newPayable;
  };
Replace with:
ts  const createPayable = (
    payableData: Omit<Payable, "payableId" | "createdAt" | "updatedAt">
  ): Payable => {
    const newPayable: Payable = {
      ...payableData,
      payableId: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPayables((prev) => [...prev, newPayable]);

    // Auto-post accrual ledger entries
    const expenseAccountCode = payableData.type === "Salary" ? "5100"
      : payableData.type === "Statutory" ? "5200"
      : "5300";
    const expenseAccountName = payableData.type === "Salary" ? "Salaries & Wages"
      : payableData.type === "Statutory" ? "Statutory Contributions"
      : "Vendor Expenses";
    const entryBase = {
      entryDate: payableData.dueDate,
      description: `${payableData.type} Payable — ${payableData.description}`,
      referenceType: "Expense" as const,
      referenceId: newPayable.payableId,
      cityId: payableData.cityId,
      createdAt: new Date().toISOString(),
    };
    setLedgerEntries(prev => [...prev,
      // DR Expense (Account 5xxx)
      { ...entryBase, ledgerEntryId: `LED-${Date.now()}-DR`, accountCode: expenseAccountCode, accountName: expenseAccountName, entryType: "DEBIT" as const, amount: payableData.amount },
      // CR Payable Liability (Account 2000)
      { ...entryBase, ledgerEntryId: `LED-${Date.now() + 1}-CR`, accountCode: "2000", accountName: "Accounts Payable", entryType: "CREDIT" as const, amount: payableData.amount },
    ]);

    return newPayable;
  };
1C — Auto-post settlement entry when a payable is marked paid. Find:
ts  const markAsPaid = (
    payableId: string,
    paymentReference: string,
    paymentMethod: Payable["paymentMethod"]
  ) => {
    updatePayable(payableId, {
      status: "Paid",
      paidAt: new Date().toISOString(),
      paymentReference,
      paymentMethod,
    });
  };
Replace with:
ts  const markAsPaid = (
    payableId: string,
    paymentReference: string,
    paymentMethod: Payable["paymentMethod"]
  ) => {
    const payable = payables.find(p => p.payableId === payableId);
    updatePayable(payableId, {
      status: "Paid",
      paidAt: new Date().toISOString(),
      paymentReference,
      paymentMethod,
    });
    // Settlement entry: DR Payable (clears liability), CR Bank
    if (payable) {
      const today = new Date().toISOString().split("T")[0];
      const entryBase = {
        entryDate: today,
        description: `Payment — ${payable.description} (Ref: ${paymentReference})`,
        referenceType: "Payment" as const,
        referenceId: payableId,
        cityId: payable.cityId,
        createdAt: new Date().toISOString(),
      };
      setLedgerEntries(prev => [...prev,
        { ...entryBase, ledgerEntryId: `LED-${Date.now()}-DR`, accountCode: "2000", accountName: "Accounts Payable", entryType: "DEBIT" as const, amount: payable.amount },
        { ...entryBase, ledgerEntryId: `LED-${Date.now() + 1}-CR`, accountCode: "1000", accountName: "Bank Account", entryType: "CREDIT" as const, amount: payable.amount },
      ]);
    }
  };
1D — Fix calculateEBITDA and getCityFinancialSnapshot to scope by month. Find:
ts  const calculateEBITDA = (cityId: string): number => {
    const cityRevenues = getRevenueByCity(cityId);
    const cityPayables = getPayablesByCity(cityId);

    const totalRevenue = cityRevenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = cityPayables.reduce((sum, p) => sum + p.amount, 0);

    return totalRevenue - totalExpenses;
  };
Replace with:
ts  const calculateEBITDA = (cityId: string, month?: string): number => {
    const cityRevenues = getRevenueByCity(cityId)
      .filter(r => r.status === "Received" && (!month || r.receivedDate.startsWith(month)));
    const cityPayables = getPayablesByCity(cityId)
      .filter(p => p.status === "Paid" && (!month || p.paidAt?.startsWith(month)));

    const totalRevenue = cityRevenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = cityPayables.reduce((sum, p) => sum + p.amount, 0);
    return totalRevenue - totalExpenses;
  };
Update calculateMargin and getCityFinancialSnapshot to also pass month through. Add month?: string parameter to both. Update the interface declaration at the top: calculateEBITDA: (cityId: string, month?: string) => number;
1E — Fix getTotalMRR to accept city filter. Find:
ts  const getTotalMRR = (month: string): number => {
    return mrrData
      .filter((m) => m.month === month && m.status === "Active")
      .reduce((sum, m) => sum + m.revenue, 0);
  };
Replace with:
ts  const getTotalMRR = (month: string, cityId?: string): number => {
    return mrrData
      .filter((m) => m.month === month && m.status === "Active" && (!cityId || m.cityId === cityId))
      .reduce((sum, m) => sum + m.revenue, 0);
  };
Update interface: getTotalMRR: (month: string, cityId?: string) => number;

CHANGE 2 — src/app/components/finance/reports/ProfitLossReport.tsx
Replace the mock data state with live ledger data. Find:
ts  const [revenue, setRevenue] = useState<PLCategory[]>(mockRevenue);
  const [expenses, setExpenses] = useState<PLCategory[]>(mockExpenses);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>(mockMonthlyTrend);
Replace with:
ts  const { getLedgerEntriesByCity, getRevenueByCity, getPayablesByCity } = useFinance();
  const { city } = useCity();
Then update the useEffect that loads data. Find the block that calls setRevenue(mockRevenue) and replace with:
ts      // Build P&L from real ledger entries
      const cityLedger = getLedgerEntriesByCity(city);

      // Group revenue accounts (4000–4999 CREDIT)
      const revenueMap: Record<string, number> = {};
      cityLedger
        .filter(e => e.accountCode >= "4000" && e.accountCode <= "4999" && e.entryType === "CREDIT")
        .forEach(e => { revenueMap[e.accountName] = (revenueMap[e.accountName] || 0) + e.amount; });
      const totalRev = Object.values(revenueMap).reduce((s, v) => s + v, 0) || 1;
      const liveRevenue: PLCategory[] = Object.entries(revenueMap).map(([category, amount]) => ({
        category, account: "4100", amount,
        percentage: Math.round((amount / totalRev) * 1000) / 10,
      }));

      // Group expense accounts (5000–5999 DEBIT)
      const expenseMap: Record<string, number> = {};
      cityLedger
        .filter(e => e.accountCode >= "5000" && e.accountCode <= "5999" && e.entryType === "DEBIT")
        .forEach(e => { expenseMap[e.accountName] = (expenseMap[e.accountName] || 0) + e.amount; });
      const totalExp = Object.values(expenseMap).reduce((s, v) => s + v, 0) || 1;
      const liveExpenses: PLCategory[] = Object.entries(expenseMap).map(([category, amount]) => ({
        category, account: "5100", amount,
        percentage: Math.round((amount / totalExp) * 1000) / 10,
      }));

      // Monthly trend from revenue records
      const revenueByMonth: Record<string, { revenue: number; expenses: number }> = {};
      getRevenueByCity(city).filter(r => r.status === "Received").forEach(r => {
        const m = r.receivedDate.slice(0, 7);
        if (!revenueByMonth[m]) revenueByMonth[m] = { revenue: 0, expenses: 0 };
        revenueByMonth[m].revenue += r.amount;
      });
      getPayablesByCity(city).filter(p => p.status === "Paid" && p.paidAt).forEach(p => {
        const m = p.paidAt!.slice(0, 7);
        if (!revenueByMonth[m]) revenueByMonth[m] = { revenue: 0, expenses: 0 };
        revenueByMonth[m].expenses += p.amount;
      });
      const liveTrend: MonthlyTrend[] = Object.entries(revenueByMonth)
        .sort(([a],[b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month: new Date(month + "-01").toLocaleString("en-IN", { month: "short" }),
          revenue: data.revenue, expenses: data.expenses,
          profit: data.revenue - data.expenses,
        }));

      setRevenue(liveRevenue.length > 0 ? liveRevenue : mockRevenue);
      setExpenses(liveExpenses.length > 0 ? liveExpenses : mockExpenses);
      setMonthlyTrend(liveTrend.length > 0 ? liveTrend : mockMonthlyTrend);
Add imports at the top: import { useFinance } from "../../../contexts/FinanceContext"; and import { useCity } from "../../../contexts/CityContext";

CHANGE 3 — src/app/components/finance/reports/CashFlowReport.tsx
Same pattern as ProfitLossReport. Replace mock state initialization:
ts  const [cashFlowByActivity, setCashFlowByActivity] = useState<CashFlowCategory[]>(mockCashFlowByActivity);
Add useFinance() and useCity() imports. In the useEffect, replace setCashFlowByActivity(mockCashFlowByActivity) with live derivation:
ts  const { getRevenueByCity, getPayablesByCity } = useFinance();
  const { city } = useCity();
  // Operating: received revenues
  const operating = getRevenueByCity(city)
    .filter(r => r.status === "Received")
    .reduce((s, r) => s + r.amount, 0);
  // Expenses paid
  const expenses = getPayablesByCity(city)
    .filter(p => p.status === "Paid")
    .reduce((s, p) => s + p.amount, 0);
  const liveActivity: CashFlowCategory[] = [
    { activity: "Operating Activities", inflow: operating, outflow: expenses, net: operating - expenses },
  ];
  setCashFlowByActivity(liveActivity.length > 0 ? liveActivity : mockCashFlowByActivity);
Do not change any other file in Phase 1.