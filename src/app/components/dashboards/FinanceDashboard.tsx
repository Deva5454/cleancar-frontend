import React from "react";
import { sendRefundProcessed } from "../../services/whatsappService";
// Dashboard for Accounts role
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DollarSign, CheckCircle, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { MASTER_KPI_DATA, MASTER_APPROVALS } from "../../data/masterData";
import { loadCashDeposits } from "../supervisor/CashDepositScreen";
import { toast } from "sonner";
import { getAllActiveBundles } from "../../services/multiMonthBundleService";
import { getMarketingExpenseSummary } from "../../services/complimentary2WService";

export function FinanceDashboard() {
  // Payroll data from centralized source
  const payroll = [
    { id: 1, employee: "Suresh Kumar", role: "Car Washer", baseSalary: 15000, adhocEarnings: 1400, deductions: 400, netSalary: 16000, status: "Approved", month: "Mar 2026" },
    { id: 2, employee: "Ramesh K.", role: "Car Washer", baseSalary: 15000, adhocEarnings: 1000, deductions: 0, netSalary: 16000, status: "Approved", month: "Mar 2026" },
    { id: 3, employee: "Mahesh S.", role: "Car Washer", baseSalary: 15000, adhocEarnings: 600, deductions: 0, netSalary: 15600, status: "Approved", month: "Mar 2026" },
    { id: 4, employee: "Ramesh Patel", role: "Supervisor", baseSalary: 25000, adhocEarnings: 2000, deductions: 500, netSalary: 26500, status: "Pending", month: "Mar 2026" },
  ];

  // Cash deposits â€” merged from MASTER_APPROVALS + live SUPERVISOR_CASH_DEPOSITS
  const [liveDeposits, setLiveDeposits] = React.useState(() => loadCashDeposits());
  const [financeRefunds, setFinanceRefunds] = React.useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("cleancar_finance_refunds") || "[]"); } catch { return []; }
  });
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [bankRef, setBankRef] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [rejectRefundReason, setRejectRefundReason] = React.useState("");
  const [rejectingRefundId, setRejectingRefundId] = React.useState<string | null>(null);

  const refreshRefunds = () => {
    try {
      setFinanceRefunds(JSON.parse(localStorage.getItem("cleancar_finance_refunds") || "[]"));
    } catch {}
  };

  const pendingRefunds = financeRefunds.filter(r => r.financeStatus === "Pending");
  const processedRefunds = financeRefunds.filter(r => r.financeStatus !== "Pending");

  const handleProcessRefund = (req: any) => {
    if (!bankRef.trim() || !bankName.trim()) { alert("Enter bank name and reference number"); return; }
    const now = new Date().toISOString();
    const updated = financeRefunds.map(r => r.id === req.id ? {
      ...r,
      financeStatus: "Processed",
      bankRef,
      bankName,
      processedAt: now,
      processedBy: "Finance",
    } : r);
    localStorage.setItem("cleancar_finance_refunds", JSON.stringify(updated));
    setFinanceRefunds(updated);

    // WA to customer
    try {
      sendRefundProcessed({
        customerPhone: req.customerMobile,
        customerName: req.customerName,
        refId: req.id,
        refundAmount: req.refundAmount,
        bankRef,
        paymentMethod: req.paymentMethod || bankName,
      });
    } catch {}

    // Journal entry
    try {
      const entries = JSON.parse(localStorage.getItem("cleancar_accounting_entries") || "[]");
      entries.unshift({
        id: `JE-REFUND-${Date.now()}`,
        date: now.split("T")[0],
        type: "REFUND_PROCESSED",
        debit: "Customer Advance / Refund Payable",
        credit: "Bank / Cash",
        amount: req.refundAmount,
        narration: `Refund processed for ${req.customerName} (${req.subscriptionId}) â€” Ref: ${req.id} â€” Bank Ref: ${bankRef}`,
        status: "POSTED",
        createdAt: now,
      });
      localStorage.setItem("cleancar_accounting_entries", JSON.stringify(entries));
    } catch {}

    // G3: Store refundCommunicatedAt for 7-day dispute window enforcement
    const updatedWithDate = financeRefunds.map(r => r.id === req.id ? {
      ...r, financeStatus: "Processed", bankRef, bankName,
      processedAt: now, processedBy: "Finance",
      refundCommunicatedAt: now, // G3: dispute window starts here
    } : r);
    localStorage.setItem("cleancar_finance_refunds", JSON.stringify(updatedWithDate));
    setFinanceRefunds(updatedWithDate);

    setProcessingId(null);
    setBankRef("");
    setBankName("");
    alert(`Refund of â‚¹${Math.round(req.refundAmount).toLocaleString("en-IN")} processed. Customer notified via WhatsApp.`);
  };
  React.useEffect(() => {
    const interval = setInterval(() => setLiveDeposits(loadCashDeposits()), 10000);
    return () => clearInterval(interval);
  }, []);

  const cashDeposits = [
    // From MASTER_APPROVALS (seeded demo data)
    ...MASTER_APPROVALS
      .filter(a => a.type === "Cash Collection" && a.status === "Pending")
      .map(a => ({
        id: a.id || String(Math.random()),
        supervisor: a.requesterName,
        amount: a.amount || 0,
        status: a.status,
        bankRefNumber: undefined as string | undefined,
        collectedAt: a.date || new Date().toISOString(),
        isLive: false,
      })),
    // From live CashDepositScreen submissions (COLLECTED + DEPOSITED)
    ...liveDeposits
      .filter(d => d.status === "DEPOSITED" || d.status === "COLLECTED")
      .map(d => ({
        id: d.id,
        supervisor: d.supervisorName,
        amount: d.amount,
        status: d.status === "DEPOSITED" ? "Pending Verification" : "Collected - Not Yet Deposited",
        bankRefNumber: d.bankRefNumber,
        collectedAt: d.collectedAt,
        customerName: d.customerName,
        customerMobile: d.customerMobile,
        subscriptionId: d.subscriptionId,
        notes: d.notes,
        isLive: true,
        canVerify: d.status === "DEPOSITED",
      })),
  ];

  const stats = {
    pendingPayroll: payroll.filter(p => p.status === "Pending").length,
    monthlyPayroll: payroll.reduce((sum, p) => sum + p.netSalary, 0),
    cashPending: cashDeposits.reduce((sum, d) => sum + d.amount, 0),
    vendorPayables: Math.round(MASTER_KPI_DATA.monthlyRevenue * 0.15), // 15% of revenue as vendor payables
    approvedToday: payroll.filter(p => p.status === "Approved").length,
  };

  const handleApprovePayroll = (employeeName: string) => {
    toast.success(`Payroll approved for ${employeeName}`);
  };

  const handleVerifyDeposit = (supervisorName: string, amount: number, depositId?: string) => {
    if (depositId) {
      // Update live deposit status to VERIFIED
      const all = loadCashDeposits();
      const updated = all.map((d: any) => d.id === depositId ? { ...d, status: "VERIFIED" } : d);
      localStorage.setItem("SUPERVISOR_CASH_DEPOSITS", JSON.stringify(updated));
      setLiveDeposits(updated);
    }
    toast.success(`Cash deposit of â‚¹${amount.toLocaleString()} from ${supervisorName} verified`);
  };

  const handleRejectDeposit = (supervisorName: string, amount: number, depositId?: string) => {
    const reason = window.prompt(`Reason for rejecting deposit from ${supervisorName}:`);
    if (!reason) return;
    if (depositId) {
      const all = loadCashDeposits();
      const updated = all.map((d: any) => d.id === depositId ? { ...d, status: "REJECTED", rejectedAt: new Date().toISOString(), rejectionReason: reason } : d);
      localStorage.setItem("SUPERVISOR_CASH_DEPOSITS", JSON.stringify(updated));
      setLiveDeposits(updated);
    }
    toast.error("Deposit rejected: " + reason);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Finance Control Panel</h2>
          <p className="text-sm text-gray-500 mt-1">Manage payments and approvals</p>
        </div>
        <Badge variant="destructive" className="text-lg px-4 py-2">
          {stats.pendingPayroll} Pending Approvals
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-orange-50 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.pendingPayroll}</p>
              <p className="text-xs text-gray-500">Payroll Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">â‚¹{(stats.monthlyPayroll / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Monthly Payroll</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-purple-50 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">â‚¹{(stats.cashPending / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Cash Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-red-50 text-red-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">â‚¹{(stats.vendorPayables / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Vendor Payables</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-green-50 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.approvedToday}</p>
              <p className="text-xs text-gray-500">Approved Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payroll Approvals */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Pending Payroll Approvals</h3>
          <div className="space-y-3">
            {payroll.filter(p => p.status === "Pending").map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{record.employee}</p>
                  <p className="text-sm text-gray-600">{record.role} â€¢ {record.month}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-gray-600">Base: â‚¹{record.baseSalary.toLocaleString()}</span>
                    <span className="text-green-600">+â‚¹{record.adhocEarnings.toLocaleString()}</span>
                    <span className="text-red-600">-â‚¹{record.deductions.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Net Salary</p>
                    <p className="text-xl font-bold">â‚¹{record.netSalary.toLocaleString()}</p>
                  </div>
                  <Button size="sm" onClick={() => handleApprovePayroll(record.employee)}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cash Deposit Verification */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Cash Deposit Verification</h3>
          <div className="space-y-3">
            {cashDeposits.map((deposit, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div>
                  <p className="font-medium">{deposit.supervisor}</p>
                  <p className="text-sm text-gray-600">Cash collection pending deposit</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <p className="text-2xl font-bold">â‚¹{deposit.amount.toLocaleString()}</p>
                  {(deposit as any).bankRefNumber && <p className="text-xs text-gray-500">Ref: {(deposit as any).bankRefNumber}</p>}
                  {(deposit as any).isLive && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Live</span>}
                  <Button size="sm" onClick={() => handleVerifyDeposit(deposit.supervisor, deposit.amount, (deposit as any).isLive ? (deposit as any).id : undefined)}>Verify Deposit</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Refund Processing Queue */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          Refund Processing Queue
          {pendingRefunds.length > 0 && (
            <span className="ml-2 text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{pendingRefunds.length} pending</span>
          )}
        </h3>
        {financeRefunds.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-gray-400 text-sm">No refund requests yet. Approved cancellations from TSM will appear here.</CardContent></Card>
        ) : financeRefunds.map((req: any) => (
          <Card key={req.id} className={`mb-3 border-l-4 ${req.financeStatus === "Pending" ? "border-l-amber-400" : "border-l-green-400"}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{req.customerName}</p>
                  <p className="text-xs text-gray-500">{req.customerMobile} Â· {req.subscriptionId}</p>
                  <p className="text-xs text-gray-400">Ref: {req.id} Â· {req.packageName}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${req.refundAmount > 0 ? "text-green-700" : "text-red-600"}`}>
                    {req.refundAmount > 0 ? `â‚¹${Math.round(req.refundAmount).toLocaleString("en-IN")}` : "No Refund"}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${req.financeStatus === "Pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                    {req.financeStatus}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">Reason: {req.reason} Â· Approved by TSM: {req.tsmProcessedBy}</p>

              {req.financeStatus === "Processed" ? (
                <div className="text-xs bg-green-50 p-2 rounded-lg">
                  <p>âœ… Processed Â· Bank: {req.bankName} Â· Ref: {req.bankRef}</p>
                  <p className="text-gray-400">{new Date(req.processedAt).toLocaleDateString("en-IN")}</p>
                </div>
              ) : req.refundAmount > 0 ? (
                processingId === req.id ? (
                  <div className="space-y-2">
                    {/* C7: Show original payment instrument */}
                  {req.paymentMethod && (
                    <div className="text-xs bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
                      <p className="font-semibold text-blue-800">Original payment instrument:</p>
                      <p className="text-blue-700">{req.paymentMethod}{req.paymentInstrumentHint ? ` â€” ${req.paymentInstrumentHint}` : ""}</p>
                      <p className="text-blue-500 mt-0.5">Refund must be credited to the same instrument per Refund Policy Â§7.</p>
                    </div>
                  )}
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={bankName} onChange={e => setBankName(e.target.value)}>
                      <option value="">Select bank</option>
                      {["HDFC Bank","ICICI Bank","SBI","Axis Bank","Kotak Bank","Yes Bank","Other"].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Bank UTR / Transaction Reference" value={bankRef} onChange={e => setBankRef(e.target.value)} />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setProcessingId(null)} className="flex-1">Cancel</Button>
                      <Button size="sm" onClick={() => handleProcessRefund(req)} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        Confirm Refund Processed
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => { setProcessingId(req.id); setBankRef(""); setBankName(""); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Mark Refund as Processed
                  </Button>
                )
              ) : (
                <div className="text-xs bg-gray-50 p-2 rounded-lg text-gray-500">No refund applicable â€” cancellation fee covers 100%</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* â”€â”€ Multi-Month Bundle Revenue Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {(() => {
        const bundles = getAllActiveBundles();
        if (bundles.length === 0) return null;
        const totalCollected  = bundles.reduce((s, b) => s + b.finalTotalPrice, 0);
        const totalRecognised = bundles.reduce((s, b) => s + b.revenueRecognised, 0);
        const totalDeferred   = bundles.reduce((s, b) => s + b.deferredRevenue, 0);
        const totalVisitsUsed = bundles.reduce((s, b) => s + b.visitsUsed, 0);
        const totalVisits     = bundles.reduce((s, b) => s + b.totalVisits, 0);
        const INR = (n: number) => "â‚¹" + Math.round(n).toLocaleString("en-IN");
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">ðŸ“¦ Multi-Month Bundle Revenue</h3>
              <p className="text-xs text-gray-500 mt-0.5">Revenue recognised per visit completed. Deferred = cash collected but service not yet delivered.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Cash Collected", value: INR(totalCollected), color: "text-blue-700", bg: "bg-blue-50" },
                { label: "Revenue Recognised", value: INR(totalRecognised), color: "text-green-700", bg: "bg-green-50" },
                { label: "Deferred Revenue", value: INR(totalDeferred), color: "text-amber-700", bg: "bg-amber-50" },
                { label: "Visits Used / Total", value: `${totalVisitsUsed} / ${totalVisits}`, color: "text-purple-700", bg: "bg-purple-50" },
              ].map(k => (
                <Card key={k.label}>
                  <CardContent className="p-4 text-center">
                    <div className={`text-xs font-semibold ${k.color} mb-1`}>{k.label}</div>
                    <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {["Bundle ID","Pack","Months","Collected","Recognised","Deferred","Visits","Window End","Status"].map(h => (
                        <th key={h} className="text-left py-2 px-2 text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bundles.map(b => {
                      const activeW = b.windows.find(w => w.status === "ACTIVE");
                      return (
                        <tr key={b.bundleId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2 font-mono text-gray-400">{b.bundleId.slice(0,12)}</td>
                          <td className="py-2 px-2">Pack {b.packSize}</td>
                          <td className="py-2 px-2">{b.bundleMonths}M</td>
                          <td className="py-2 px-2 font-semibold text-blue-700">{INR(b.finalTotalPrice)}</td>
                          <td className="py-2 px-2 font-semibold text-green-700">{INR(b.revenueRecognised)}</td>
                          <td className="py-2 px-2 font-semibold text-amber-700">{INR(b.deferredRevenue)}</td>
                          <td className="py-2 px-2">{b.visitsUsed}/{b.totalVisits}</td>
                          <td className="py-2 px-2 text-gray-500">{activeW?.endDate || b.bundleEndDate || "â€”"}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              b.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                              b.status === "PENDING_FIRST_WASH" ? "bg-amber-100 text-amber-700" :
                              "bg-gray-100 text-gray-500"
                            }`}>{b.status.replace(/_/g," ")}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-gray-400 italic">
              âš ï¸ Revenue recognised when wash is marked Verified by Supervisor. Forfeited visits (window expired, unused) recognised at window expiry.
            </p>
          </div>
        );
      })()}

      {/* â”€â”€ Complimentary 2W Marketing Expense Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {(() => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const summary = getMarketingExpenseSummary(currentMonth);
        const INR = (n: number) => "â‚¹" + Math.round(n).toLocaleString("en-IN");
        // Read journal entries for complimentary washes
        let journalEntries: any[] = [];
        try { journalEntries = JSON.parse(localStorage.getItem("cleancar_journal_entries") || "[]").filter((e: any) => e.referenceType === "Complimentary2W"); } catch {}
        if (summary.totalOffers === 0 && journalEntries.length === 0) return null;
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">ðŸï¸ Complimentary 2W Wash â€” Marketing Expense</h3>
              <p className="text-xs text-gray-500 mt-0.5">Free 2-wheeler washes offered to 4W customers as conversion/retention incentives. Debited to Marketing Expenses.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Offers", value: String(summary.totalOffers), color: "text-blue-700" },
                { label: "Marketing Spend", value: INR(summary.totalCost), color: "text-red-700" },
                { label: "New Conversions", value: String(summary.newConversions), color: "text-green-700" },
                { label: "Retention", value: String(summary.retentions), color: "text-purple-700" },
              ].map(k => (
                <Card key={k.label}>
                  <CardContent className="p-4 text-center">
                    <div className="text-xs font-semibold text-gray-500 mb-1">{k.label}</div>
                    <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {journalEntries.length > 0 && (
              <Card>
                <CardContent className="p-4 overflow-x-auto">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Journal Entries â€” Debit: Marketing Expenses / Credit: Service Rendered</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {["Date","Narration","Debit (Mktg Exp)","Credit (Service)"].map(h => (
                          <th key={h} className="text-left py-2 px-2 text-gray-500 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {journalEntries.slice(0, 20).map((e: any) => (
                        <tr key={e.entryId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2 text-gray-500">{e.entryDate}</td>
                          <td className="py-2 px-2 text-gray-700 max-w-xs truncate">{e.narration}</td>
                          <td className="py-2 px-2 font-semibold text-red-700">{INR(e.lines?.[0]?.debit || 0)}</td>
                          <td className="py-2 px-2 font-semibold text-green-700">{INR(e.lines?.[1]?.credit || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}

    </div>
  );
}
