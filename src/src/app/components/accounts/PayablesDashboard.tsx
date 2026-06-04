/**
 * PayablesDashboard — /accounts/payables
 *
 * FIXES APPLIED (v13 → v13-fixed):
 * BUG 1  — Was reading raw journal lines from accountingEntryService.getAllJournals().
 *           Now reads from FinanceContext.payables[] — the single authoritative source.
 * BUG 2  — Removed accountingEntryService dependency entirely. No localStorage reads on
 *           every render. Infinite buffering loop eliminated.
 * BUG 3  — handlePayNow no longer hardcodes "Axis Bank". Payment method selector shown.
 *           markAsPaid() from FinanceContext used for correct settlement ledger entry.
 * BUG 4  — Removed local Payable interface. Uses FinanceContext Payable type directly.
 * BUG 5  — City filter applied via cityId from useCity().
 * BUG 6  — Only Pending / Approved / Overdue payables shown. Paid excluded.
 * BUG 7  — Empty state has "Record Expense" shortcut. Header has the same button.
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCity } from "../../contexts/CityContext";
import { useFinance, type Payable } from "../../contexts/FinanceContext";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  AlertCircle, CheckCircle, Plus, CreditCard,
  Clock, Building2, User, FileText,
} from "lucide-react";
import { toast } from "sonner";

const PAYMENT_METHODS: Payable["paymentMethod"][] = [
  "Bank Transfer", "UPI", "Cheque", "Cash",
];

function typeIcon(type: Payable["type"]) {
  if (type === "Salary")    return <User     className="w-3.5 h-3.5" />;
  if (type === "Statutory") return <FileText  className="w-3.5 h-3.5" />;
  return                           <Building2 className="w-3.5 h-3.5" />;
}
function typeBadgeClass(type: Payable["type"]) {
  if (type === "Salary")    return "bg-blue-50 text-blue-700";
  if (type === "Statutory") return "bg-purple-50 text-purple-700";
  return "bg-orange-50 text-orange-700";
}
function statusBadgeClass(status: Payable["status"]) {
  if (status === "Overdue")  return "bg-red-100 text-red-700";
  if (status === "Approved") return "bg-green-100 text-green-700";
  return "bg-yellow-50 text-yellow-700";
}
function formatDate(d: string): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
}
function daysUntilDue(dueDate: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(dueDate); due.setHours(0,0,0,0);
  return Math.floor((due.getTime() - today.getTime()) / 86400000);
}

export default function PayablesDashboard() {
  const navigate = useNavigate();
  const { cityId } = useCity();
  const { payables, markAsPaid, approvePayable } = useFinance();

  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Overdue" | "Approved">("All");
  const [typeFilter,   setTypeFilter]   = useState<"All" | Payable["type"]>("All");
  const [payDialog,    setPayDialog]    = useState<Payable | null>(null);
  const [payMethod,    setPayMethod]    = useState<Payable["paymentMethod"]>("Bank Transfer");
  const [payRef,       setPayRef]       = useState("");
  const [paying,       setPaying]       = useState(false);

  // Stable derived slice — no side-effects, no localStorage reads
  const activePayables = useMemo(() => {
    return payables
      .filter(p => {
        if (p.cityId !== cityId)   return false;   // city isolation
        if (p.status === "Paid")   return false;   // hide settled
        if (typeFilter   !== "All" && p.type   !== typeFilter)   return false;
        if (statusFilter !== "All" && p.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const aOrd = a.status === "Overdue" ? 0 : a.status === "Approved" ? 1 : 2;
        const bOrd = b.status === "Overdue" ? 0 : b.status === "Approved" ? 1 : 2;
        if (aOrd !== bOrd) return aOrd - bOrd;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [payables, cityId, typeFilter, statusFilter]);

  const overdueList  = useMemo(() => activePayables.filter(p => p.status === "Overdue"),  [activePayables]);
  const pendingList  = useMemo(() => activePayables.filter(p => p.status === "Pending"),  [activePayables]);
  const approvedList = useMemo(() => activePayables.filter(p => p.status === "Approved"), [activePayables]);
  const totalOutstanding = useMemo(() => activePayables.reduce((s,p) => s+p.amount, 0), [activePayables]);
  const totalOverdue     = useMemo(() => overdueList.reduce((s,p) => s+p.amount, 0),     [overdueList]);

  const openPayDialog = (p: Payable) => { setPayDialog(p); setPayMethod("Bank Transfer"); setPayRef(""); };

  const handleConfirmPayment = async () => {
    if (!payDialog) return;
    if (!payRef.trim()) { toast.error("Enter a payment reference (UTR / cheque number)"); return; }
    setPaying(true);
    try {
      markAsPaid(payDialog.payableId, payRef.trim(), payMethod);
      toast.success(`₹${payDialog.amount.toLocaleString("en-IN")} marked as paid — ${payDialog.description}`);
      setPayDialog(null);
    } catch (err) {
      toast.error("Payment recording failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const handleApprove = (p: Payable) => {
    approvePayable(p.payableId, "Accounts Manager");
    toast.success(`${p.description} approved for payment`);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payables</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Outstanding:{" "}
            <span className="font-semibold text-red-700">
              ₹{totalOutstanding.toLocaleString("en-IN")}
            </span>
            {overdueList.length > 0 && (
              <span className="ml-2 text-red-600">
                · Overdue: ₹{totalOverdue.toLocaleString("en-IN")}
              </span>
            )}
          </p>
        </div>
        <Button size="sm" className="flex items-center gap-1.5"
          onClick={() => navigate("/accounts/expense-entry")}>
          <Plus className="w-4 h-4" /> Record Expense
        </Button>
      </div>

      {/* Overdue alert */}
      {overdueList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">
            <strong>{overdueList.length} overdue payable{overdueList.length > 1 ? "s" : ""}</strong>{" "}
            totalling ₹{totalOverdue.toLocaleString("en-IN")} — pay immediately.
          </span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: "Overdue"  as const, list: overdueList,  color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200" },
          { label: "Pending"  as const, list: pendingList,  color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
          { label: "Approved" as const, list: approvedList, color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
        ]).map(({ label, list, color, bg, border }) => (
          <button key={label}
            onClick={() => setStatusFilter(statusFilter === label ? "All" : label)}
            className={`rounded-lg border p-3 text-left transition-all ${bg} ${border}
              ${statusFilter === label ? "ring-2 ring-offset-1 ring-gray-400" : "hover:brightness-95"}`}>
            <p className={`text-xs font-medium ${color}`}>{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{list.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              ₹{list.reduce((s,p)=>s+p.amount,0).toLocaleString("en-IN")}
            </p>
          </button>
        ))}
      </div>

      {/* Type filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Type:</span>
        {(["All", "Vendor", "Salary", "Statutory"] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              typeFilter === t
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
            {t}
          </button>
        ))}
        {(statusFilter !== "All" || typeFilter !== "All") && (
          <button onClick={() => { setStatusFilter("All"); setTypeFilter("All"); }}
            className="text-xs px-2.5 py-1 text-gray-400 hover:text-gray-700">
            Clear filters
          </button>
        )}
      </div>

      {/* Empty state */}
      {activePayables.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No outstanding payables</p>
          <p className="text-sm mt-1">
            {statusFilter !== "All" || typeFilter !== "All"
              ? "Try clearing the filters"
              : "Payables are created when expenses or payroll are approved"}
          </p>
          <Button size="sm" variant="outline" className="mt-4"
            onClick={() => navigate("/accounts/expense-entry")}>
            <Plus className="w-4 h-4 mr-1" /> Record an expense
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Due Date</th>
                <th className="p-3 font-medium text-right">Amount</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activePayables.map(p => {
                const days   = daysUntilDue(p.dueDate);
                const isOver = p.status === "Overdue" || days < 0;
                return (
                  <tr key={p.payableId}
                    className={`border-b last:border-0 transition-colors ${
                      isOver ? "bg-red-50/60" : "hover:bg-gray-50"}`}>
                    <td className="p-3">
                      <p className="font-medium text-gray-900 leading-tight">{p.description}</p>
                      {p.vendorName    && <p className="text-xs text-gray-400 mt-0.5">{p.vendorName}</p>}
                      {p.invoiceNumber && <p className="text-xs text-gray-400 font-mono">{p.invoiceNumber}</p>}
                      {p.statutoryType && <p className="text-xs text-purple-500 mt-0.5">{p.statutoryType}</p>}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${typeBadgeClass(p.type)}`}>
                        {typeIcon(p.type)}{p.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className={isOver ? "text-red-600 font-medium" : "text-gray-700"}>
                        {formatDate(p.dueDate)}
                      </p>
                      {isOver ? (
                        <p className="text-xs text-red-500 mt-0.5">{Math.abs(days)}d overdue</p>
                      ) : days <= 7 ? (
                        <p className="text-xs text-amber-500 mt-0.5 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {days === 0 ? "Due today" : `${days}d left`}
                        </p>
                      ) : null}
                    </td>
                    <td className="p-3 text-right font-semibold text-gray-900">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3">
                      <Badge className={`text-xs ${statusBadgeClass(p.status)}`}>{p.status}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {p.status === "Pending" && (
                          <Button size="sm" variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs"
                            onClick={() => handleApprove(p)}>
                            Approve
                          </Button>
                        )}
                        {(p.status === "Approved" || p.status === "Overdue") && (
                          <Button size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs flex items-center gap-1"
                            onClick={() => openPayDialog(p)}>
                            <CreditCard className="w-3.5 h-3.5" /> Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pay Now dialog */}
      {payDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Record Payment</h2>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="font-medium text-gray-800">{payDialog.description}</p>
              {payDialog.vendorName && <p className="text-sm text-gray-500">{payDialog.vendorName}</p>}
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{payDialog.amount.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-gray-400">Due: {formatDate(payDialog.dueDate)}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Payment method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                      payMethod === m
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Payment reference <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1">(UTR / cheque no. / UPI ref)</span>
              </label>
              <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)}
                placeholder="e.g. UTR0000123456"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1"
                onClick={() => setPayDialog(null)} disabled={paying}>
                Cancel
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleConfirmPayment} disabled={paying || !payRef.trim()}>
                {paying ? "Recording…" : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
