    if (!bankLedger) {
      toast.error("Axis Bank ledger not found"); return;
    }
    accountingEntryService.createJournal({
      date: new Date().toISOString().split("T")[0],
      narration: `Payment — ${payable.creditorName} — against ${payable.voucherNumber}`,
      lines: [
        { accountHead: payable.creditorId, accountLabel: payable.creditorName, debit: payable.amountDue, credit: 0 },
        { accountHead: bankLedger.id,      accountLabel: "Axis Bank",           debit: 0, credit: payable.amountDue },
      ],
      city, cityId, createdBy: currentUser?.name || "Accounts",
    }, city);
    toast.success(`Payment of ₹${payable.amountDue.toLocaleString()} recorded for ${payable.creditorName}`);
    setRefresh(r => r + 1);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Payables Dashboard</h1>
        <div className="text-sm text-gray-500">
          Total Outstanding: <span className="font-bold text-red-700">₹{totalOutstanding.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {overduePayables.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">
            <strong>{overduePayables.length} overdue payable{overduePayables.length > 1 ? "s" : ""}</strong> totalling ₹{overduePayables.reduce((s,p) => s + p.amountDue, 0).toLocaleString("en-IN")} — pay immediately.
          </span>
        </div>
      )}

      {payables.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No outstanding payables.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3 font-medium">Creditor Name</th>
                <th className="p-3 font-medium">Invoice Date</th>
                <th className="p-3 font-medium">Due Date</th>
                <th className="p-3 font-medium text-right">Amount Due</th>
                <th className="p-3 font-medium">Days Overdue</th>
                <th className="p-3 font-medium">Ref</th>
                <th className="p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {payables.map((p, i) => (
                <tr key={`${p.journalId}-${i}`} className={`border-b ${p.isOverdue ? "bg-red-50" : "hover:bg-gray-50"}`}>
                  <td className="p-3 font-medium">{p.creditorName}</td>
                  <td className="p-3 text-gray-500">{p.invoiceDate}</td>
                  <td className="p-3">
                    {p.dueDate ? (
                      <span className={p.isOverdue ? "text-red-600 font-medium" : ""}>{p.dueDate}</span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="p-3 text-right font-semibold">₹{p.amountDue.toLocaleString("en-IN")}</td>
                  <td className="p-3">
                    {p.daysOverdue > 0 ? (
                      <Badge className="bg-red-100 text-red-700">{p.daysOverdue}d overdue</Badge>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="p-3 font-mono text-xs text-gray-500">{p.voucherNumber}</td>
                  <td className="p-3">
                    <Button size="sm" variant="outline"
                      className="text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => handlePayNow(p)}>
                      Pay Now
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
Add to navigationConfig.ts under Accounts children:
ts{ label: "Payables", path: "/accounts/payables", icon: CreditCard, module: "accounts", match: "prefix" },
Add to routes.tsx:
tsconst PayablesDashboard = lazy(() => import("./components/accounts/PayablesDashboard"));
{ path: "accounts/payables", element: <Suspense fallback={<PageLoader />}><PayablesDashboard /></Suspense> },

CHANGE 3 — src/app/components/accounts/AccountsDashboard.tsx — Add advance tax widget (Gap 13)
Add import at the top:
tsconst ADVANCE_TAX_KEY = "ADVANCE_TAX_PAYMENTS";
Inside AccountsDashboard, add a computed value for next due instalment:
ts  const nextAdvanceTaxDue = useMemo(() => {
    const fy = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const paidMap: Record<string, boolean> = (() => {
      try { return JSON.parse(localStorage.getItem(ADVANCE_TAX_KEY) || "{}"); } catch { return {}; }
    })();
    const schedule = [
      { no: "1st", date: `${fy}-06-15`, label: `15 Jun ${fy}`,       pct: 0.15 },
      { no: "2nd", date: `${fy}-09-15`, label: `15 Sep ${fy}`,       pct: 0.45 },
      { no: "3rd", date: `${fy}-12-15`, label: `15 Dec ${fy}`,       pct: 0.75 },
      { no: "4th", date: `${fy + 1}-03-15`, label: `15 Mar ${fy+1}`, pct: 1.00 },
    ];
    return schedule.find(s =>
      !paidMap[`${fy}-${s.no}`] &&
      s.date >= new Date().toISOString().split("T")[0]
    ) || null;
  }, []);
Find the KPI cards row and add this widget at the end of the grid:
tsx  {nextAdvanceTaxDue && (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 cursor-pointer hover:shadow-md"
      onClick={() => navigate("/accounts/advance-tax")}>
      <p className="text-xs font-medium text-orange-800 mb-1">Next Advance Tax Due</p>
      <p className="text-xl font-bold text-orange-900">
        {nextAdvanceTaxDue.label}
      </p>
      <p className="text-xs text-orange-600 mt-1">
        {nextAdvanceTaxDue.pct * 100}% cumulative — click to pay
      </p>
    </div>
  )}
Do not change any other file in Phase 2.