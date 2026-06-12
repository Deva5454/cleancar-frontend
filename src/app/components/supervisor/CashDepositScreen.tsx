/**
 * CashDepositScreen.tsx
 * Supervisor collects cash from customer for subscription payment
 * and records bank deposit with reference number.
 * Finance team verifies from their dashboard.
 */
import { useState } from "react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DollarSign, Building, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

const CASH_DEPOSITS_KEY = "SUPERVISOR_CASH_DEPOSITS";

export function loadCashDeposits(): CashDeposit[] {
  try { return JSON.parse(localStorage.getItem(CASH_DEPOSITS_KEY) || "[]"); } catch { return []; }
}

export interface CashDeposit {
  id: string;
  supervisorId: string;
  supervisorName: string;
  customerName: string;
  customerMobile: string;
  subscriptionId: string;
  amount: number;
  collectedAt: string;
  depositedAt?: string;
  bankName?: string;
  bankRefNumber?: string;
  status: "COLLECTED" | "DEPOSITED" | "VERIFIED" | "REJECTED";
  notes?: string;
  cityId: string;
}

interface CashDepositScreenProps {
  supervisorId: string;
  supervisorName: string;
  cityId: string;
  onBack: () => void;
}

type Step = "collect" | "deposit" | "history";

export function CashDepositScreen({ supervisorId, supervisorName, cityId, onBack }: CashDepositScreenProps) {
  const [step, setStep] = useState<Step>("collect");
  const [deposits, setDeposits] = useState<CashDeposit[]>(loadCashDeposits);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Collection form
  const [collectForm, setCollectForm] = useState({
    customerName: "",
    customerMobile: "",
    subscriptionId: "",
    amount: "",
    notes: "",
  });

  // Deposit form
  const [depositForm, setDepositForm] = useState({
    depositId: "",
    bankName: "",
    bankRefNumber: "",
  });

  const myDeposits = deposits.filter(d => d.supervisorId === supervisorId);
  const pendingDeposit = myDeposits.filter(d => d.status === "COLLECTED");
  const totalPending = pendingDeposit.reduce((s, d) => s + d.amount, 0);

  const saveDeposits = (updated: CashDeposit[]) => {
    setDeposits(updated);
    localStorage.setItem(CASH_DEPOSITS_KEY, JSON.stringify(updated));

    // Also post a journal entry hint for Finance
    try {
      const entries = JSON.parse(localStorage.getItem("cleancar_accounting_entries") || "[]");
      entries.push({
        id: `JE-CASH-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        type: "CASH_COLLECTION",
        debit: "Cash in Hand - Supervisor",
        credit: "Customer Advance / Subscription",
        amount: updated[updated.length - 1]?.amount || 0,
        narration: `Cash collected by ${supervisorName}`,
        status: "PENDING_VERIFICATION",
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("cleancar_accounting_entries", JSON.stringify(entries));
    } catch {}
  };

  const handleCollect = () => {
    if (!collectForm.customerName || !collectForm.customerMobile || !collectForm.amount) {
      toast.error("Fill in customer name, mobile and amount");
      return;
    }
    if (isNaN(parseFloat(collectForm.amount)) || parseFloat(collectForm.amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const record: CashDeposit = {
      id: `CD-${Date.now()}`,
      supervisorId,
      supervisorName,
      customerName: collectForm.customerName,
      customerMobile: collectForm.customerMobile,
      subscriptionId: collectForm.subscriptionId || "",
      amount: parseFloat(collectForm.amount),
      collectedAt: new Date().toISOString(),
      status: "COLLECTED",
      notes: collectForm.notes,
      cityId,
    };

    saveDeposits([...deposits, record]);
    setCollectForm({ customerName: "", customerMobile: "", subscriptionId: "", amount: "", notes: "" });
    toast.success(`₹${record.amount.toLocaleString("en-IN")} cash collected from ${record.customerName}`);
    setStep("deposit");
  };

  const handleDeposit = () => {
    if (!depositForm.depositId || !depositForm.bankName || !depositForm.bankRefNumber) {
      toast.error("Select a record and fill bank details");
      return;
    }

    const updated = deposits.map(d => d.id === depositForm.depositId ? {
      ...d,
      status: "DEPOSITED" as const,
      depositedAt: new Date().toISOString(),
      bankName: depositForm.bankName,
      bankRefNumber: depositForm.bankRefNumber,
    } : d);

    saveDeposits(updated);
    setDepositForm({ depositId: "", bankName: "", bankRefNumber: "" });
    toast.success("Bank deposit recorded. Finance team will verify shortly.");
  };

  const statusColor = (s: string) => ({
    COLLECTED: "bg-yellow-100 text-yellow-800",
    DEPOSITED: "bg-blue-100 text-blue-800",
    VERIFIED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  }[s] || "bg-gray-100 text-gray-600");

  const statusLabel = (s: string) => ({
    COLLECTED: "Cash in Hand",
    DEPOSITED: "Deposited — Pending Verification",
    VERIFIED: "Verified ✓",
    REJECTED: "Rejected",
  }[s] || s);

  return (
    <div className="space-y-4 p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 text-xl">←</button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cash Deposit</h1>
          <p className="text-xs text-gray-500">Collect from customer → Deposit to bank</p>
        </div>
      </div>

      {/* Summary bar */}
      {totalPending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-800">₹{totalPending.toLocaleString("en-IN")} pending deposit</span>
          </div>
          <span className="text-xs text-yellow-600">{pendingDeposit.length} record{pendingDeposit.length > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(["collect", "deposit", "history"] as Step[]).map(t => (
          <button key={t} onClick={() => setStep(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-md capitalize ${step === t ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>
            {t === "collect" ? "1. Collect" : t === "deposit" ? "2. Deposit" : "History"}
          </button>
        ))}
      </div>

      {/* STEP 1: Collect */}
      {step === "collect" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Record Cash Received from Customer</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Name *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Rajesh Patel" value={collectForm.customerName}
                onChange={e => setCollectForm(f => ({ ...f, customerName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile Number *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="10-digit number" type="tel" value={collectForm.customerMobile}
                onChange={e => setCollectForm(f => ({ ...f, customerMobile: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Subscription ID (optional)</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="SUB-XXXX (leave blank if new customer)" value={collectForm.subscriptionId}
                onChange={e => setCollectForm(f => ({ ...f, subscriptionId: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Amount Collected (₹) *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. 1599" type="number" value={collectForm.amount}
                onChange={e => setCollectForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2}
                placeholder="Plan name, month, any remarks..." value={collectForm.notes}
                onChange={e => setCollectForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button onClick={handleCollect} className="w-full bg-blue-600 hover:bg-blue-700">
              <DollarSign className="w-4 h-4 mr-2" /> Record Cash Collected
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Deposit to Bank */}
      {step === "deposit" && (
        <div className="space-y-3">
          {pendingDeposit.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
              <p className="text-sm font-medium text-green-600">All cash deposited</p>
              <p className="text-xs mt-1">No pending cash in hand</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">Select the cash record you are depositing to the bank:</p>
              {pendingDeposit.map(d => (
                <div key={d.id}
                  onClick={() => setDepositForm(f => ({ ...f, depositId: f.depositId === d.id ? "" : d.id }))}
                  className={`border-2 rounded-xl p-3 cursor-pointer ${depositForm.depositId === d.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold">{d.customerName}</p>
                      <p className="text-xs text-gray-500">{d.customerMobile} · {new Date(d.collectedAt).toLocaleDateString("en-IN")}</p>
                      {d.notes && <p className="text-xs text-gray-400 mt-0.5">{d.notes}</p>}
                    </div>
                    <span className="text-base font-bold text-green-700">₹{d.amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}

              {depositForm.depositId && (
                <Card className="border-2 border-blue-200">
                  <CardHeader><CardTitle className="text-sm">Enter Bank Deposit Details</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Bank Name *</label>
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={depositForm.bankName} onChange={e => setDepositForm(f => ({ ...f, bankName: e.target.value }))}>
                        <option value="">Select bank</option>
                        {["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Bank", "Yes Bank", "Other"].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Transaction / Reference Number *</label>
                      <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="Bank transaction ID or UTR number"
                        value={depositForm.bankRefNumber}
                        onChange={e => setDepositForm(f => ({ ...f, bankRefNumber: e.target.value }))} />
                    </div>
                    <Button onClick={handleDeposit} className="w-full bg-green-600 hover:bg-green-700">
                      <Building className="w-4 h-4 mr-2" /> Confirm Bank Deposit
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* History */}
      {step === "history" && (
        <div className="space-y-2">
          {myDeposits.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No cash deposit records yet</p>
            </div>
          ) : (
            myDeposits.slice().reverse().map(d => (
              <div key={d.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
                  <div>
                    <p className="text-sm font-semibold">{d.customerName}</p>
                    <p className="text-xs text-gray-500">{new Date(d.collectedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">₹{d.amount.toLocaleString("en-IN")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(d.status)}`}>{statusLabel(d.status)}</span>
                    {expandedId === d.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
                {expandedId === d.id && (
                  <div className="px-3 pb-3 bg-gray-50 space-y-1 text-xs text-gray-600 border-t border-gray-100">
                    <p><span className="font-medium">Mobile:</span> {d.customerMobile}</p>
                    {d.subscriptionId && <p><span className="font-medium">Subscription:</span> {d.subscriptionId}</p>}
                    {d.notes && <p><span className="font-medium">Notes:</span> {d.notes}</p>}
                    {d.bankName && <p><span className="font-medium">Bank:</span> {d.bankName}</p>}
                    {d.bankRefNumber && <p><span className="font-medium">Ref:</span> {d.bankRefNumber}</p>}
                    {d.depositedAt && <p><span className="font-medium">Deposited:</span> {new Date(d.depositedAt).toLocaleDateString("en-IN")}</p>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CashDepositScreen;
