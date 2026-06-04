Payables, Subscription → MRR, Overdue Auto-Update, City Filter on Payable Methods)

This is Phase 2 of 3. All Phase 1 changes must be applied first.

CHANGE 1 — src/app/contexts/FinanceContext.tsx — Fix payable type-filter methods + overdue auto-update + alert auto-run
1A — Add city parameter to all 5 payable filter methods. Find each and add cityId?: string:
ts  const getSalaryPayables = (cityId?: string): Payable[] =>
    payables.filter(p => p.type === "Salary" && (!cityId || p.cityId === cityId));

  const getVendorPayables = (cityId?: string): Payable[] =>
    payables.filter(p => p.type === "Vendor" && (!cityId || p.cityId === cityId));

  const getStatutoryPayables = (cityId?: string): Payable[] =>
    payables.filter(p => p.type === "Statutory" && (!cityId || p.cityId === cityId));

  const getPendingPayables = (cityId?: string): Payable[] =>
    payables.filter(p => ["Pending","Approved"].includes(p.status) && (!cityId || p.cityId === cityId));

  const getOverduePayables = (cityId?: string): Payable[] => {
    const today = new Date().toISOString().split("T")[0];
    return payables.filter(p => p.status !== "Paid" && p.dueDate < today && (!cityId || p.cityId === cityId));
  };
Update the interface declarations for all 5 methods to include cityId?: string.
1B — Auto-update overdue status on mount. Add this useEffect inside FinanceProvider after the existing persistence useEffect blocks:
ts  // Auto-update Overdue status for past-due unpaid payables
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const toUpdate = payables.filter(
      p => p.status === "Pending" && p.dueDate < today
    );
    if (toUpdate.length > 0) {
      setPayables(prev => prev.map(p =>
        p.status === "Pending" && p.dueDate < today
          ? { ...p, status: "Overdue" as const, updatedAt: new Date().toISOString() }
          : p
      ));
    }
  }, []); // Run on mount only
1C — Auto-run alert engine when data changes. Add this useEffect:
ts  // Auto-run alert engine when financial data changes
  useEffect(() => {
    const cities = [...new Set([...revenues.map(r => r.cityId), ...payables.map(p => p.cityId)])];
    cities.forEach(cityId => {
      if (cityId) runAlertEngine(cityId);
    });
  }, [revenues.length, payables.length, budgets.length]);

CHANGE 2 — src/app/contexts/PayrollContext.tsx — Auto-create salary payables on payroll approval
Find the function that approves a payroll run (look for status: "Approved" being set on a payroll run or the function approvePayrollRun / processPayroll). After the payroll run is saved as approved, add:
tsimport { useFinance } from "./FinanceContext";

// Inside the approve function, after setting payroll status to Approved:
// Create one Salary Payable per employee in the payroll run
if (payrollRun.employees && createPayable) {
  payrollRun.employees.forEach((emp: any) => {
    createPayable({
      type: "Salary",
      employeeId: emp.employeeId,
      payrollId: payrollRun.id,
      amount: emp.netSalary || emp.netPay || 0,
      dueDate: payrollRun.paymentDate || payrollRun.month + "-28",
      status: "Pending",
      description: `Salary — ${emp.employeeName || emp.employeeId} — ${payrollRun.month}`,
      cityId: payrollRun.cityId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
}
To access createPayable from FinanceContext inside PayrollContext, use useFinance() at the top of the provider function — this works because FinanceProvider wraps PayrollProvider in AppProvider.

CHANGE 3 — src/app/contexts/CustomerSubscriptionContext.tsx — Auto-create MRR entry on subscription activation
Find the function that activates or creates a subscription. After saving the subscription, add:
ts// Auto-create MRR entry in FinanceContext when subscription goes Active
if (subscription.status === "Active" && addMRREntry) {
  const monthKey = new Date().toISOString().slice(0, 7); // "2026-04"
  addMRREntry({
    month: monthKey,
    subscriptionId: subscription.subscriptionId,
    customerId: subscription.customerId,
    revenue: subscription.monthlyAmount || subscription.price || 0,
    status: "Active",
    cityId: subscription.cityId,
  });
}
Find the function that cancels or churns a subscription. After status is set to Cancelled/Churned, add:
tsremoveMRREntry(subscription.subscriptionId);
Import useFinance and destructure addMRREntry, removeMRREntry inside the provider.

CHANGE 4 — src/app/components/finance/FinanceAnalyticsDashboard.tsx — Replace mock data with real context
Find the hardcoded transactions array (the one with TXN-001 through TXN-005). Delete it entirely.
Find fetchFinanceSummary function and its mock call. Replace the useMemo or state that drives the dashboard KPIs with:
ts  const { getRevenueByCity, getPayablesByCity, getMRRByCity,
          calculateEBITDA, getActiveAlerts, getTotalMRR } = useFinance();
  const { city } = useCity();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const cityRevenues  = getRevenueByCity(city).filter(r => r.status === "Received" && r.receivedDate.startsWith(currentMonth));
  const cityPayables  = getPayablesByCity(city);
  const totalRevenue  = cityRevenues.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = cityPayables.filter(p => p.status === "Paid" && p.paidAt?.startsWith(currentMonth)).reduce((s, p) => s + p.amount, 0);
  const ebitda        = calculateEBITDA(city, currentMonth);
  const mrr           = getTotalMRR(currentMonth, city);
  const activeAlerts  = getActiveAlerts(city);
  const overdueCount  = cityPayables.filter(p => p.status === "Overdue").length;
Replace all template/mock references in the JSX with these live variables.
Do not change any other file in Phase 2.