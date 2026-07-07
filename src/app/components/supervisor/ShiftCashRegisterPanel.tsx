/**
 * ShiftCashRegisterPanel
 * Supervisor's end-of-shift cash reconciliation.
 * Shows all doorstep collections by their team during this shift.
 */
import { useState, useEffect } from "react";
import {
  Banknote, QrCode, Send, CheckCircle2,
  IndianRupee, Clock, User, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import {
  doorstepPaymentService,
  type ShiftCashRegister,
  type DoorstepPayment,
} from "../../services/doorstepPaymentService";

const MODE_ICON: Record<string, any> = {
  UPI:  <QrCode   className="w-3.5 h-3.5 text-blue-600"  />,
  Cash: <Banknote className="w-3.5 h-3.5 text-amber-600" />,
  Link: <Send     className="w-3.5 h-3.5 text-purple-600"/>,
};
const MODE_COLOR: Record<string, string> = {
  UPI:  "bg-blue-50 text-blue-800 border-blue-200",
  Cash: "bg-amber-50 text-amber-800 border-amber-200",
  Link: "bg-purple-50 text-purple-800 border-purple-200",
};

export function ShiftCashRegisterPanel() {
  const { currentUser } = useRole();
  const supId   = currentUser?.employeeId ?? currentUser?.id ?? "";
  const supName = currentUser?.name ?? "Supervisor";

  const hour      = new Date().getHours();
  const shiftType = hour < 14 ? "Morning" : "Evening";
  const today     = new Date().toISOString().slice(0, 10);
  const cityId    = "CITY-SURAT";

  const [register, setRegister] = useState<ShiftCashRegister | null>(null);
  const [depositRef, setDepositRef] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const reg = doorstepPaymentService.getTodayRegister(cityId, supId, shiftType);
    setRegister(reg);
  }, [supId, refreshKey]);

  const handleSubmit = () => {
    if (!register) return;
    if (!depositRef.trim()) { toast.error("Enter deposit reference (NEFT UTR or cash receipt number)"); return; }
    doorstepPaymentService.submitRegister(register.registerId, depositRef, supName);
    toast.success(`Shift register submitted. Total: ₹${register.grandTotal}`);
    setRefreshKey(k => k + 1);
  };

  if (!register || register.collections.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <IndianRupee className="w-8 h-8 mx-auto mb-2 text-gray-200" />
        <p className="text-sm">No doorstep collections this shift yet</p>
        <p className="text-xs mt-1">Collections appear here as your washers collect payments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Cash", value: register.totalCash, color: "amber", icon: <Banknote className="w-4 h-4" /> },
          { label: "UPI",  value: register.totalUPI,  color: "blue",  icon: <QrCode   className="w-4 h-4" /> },
          { label: "Link", value: register.totalLink, color: "purple",icon: <Send      className="w-4 h-4" /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-xl p-3 text-center`}>
            <div className={`flex justify-center text-${color}-500 mb-1`}>{icon}</div>
            <p className={`text-lg font-bold text-${color}-800`}>₹{value.toLocaleString()}</p>
            <p className={`text-xs text-${color}-600`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Grand total */}
      <div className="bg-gray-900 text-white rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-semibold">Total Shift Collection</span>
        <span className="text-2xl font-bold">₹{register.grandTotal.toLocaleString()}</span>
      </div>

      {/* Collection list */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {register.collections.length} collection{register.collections.length !== 1 ? "s" : ""}
        </p>
        <div className="space-y-2">
          {register.collections.map(c => (
            <div key={c.paymentId} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm ${MODE_COLOR[c.mode] ?? "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center gap-2">
                {MODE_ICON[c.mode]}
                <div>
                  <p className="font-medium text-gray-900">{c.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {c.collectedByName} · {c.collectedAt ? new Date(c.collectedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                    {c.mode === "UPI" && c.utrLast4 ? ` · UTR ****${c.utrLast4}` : ""}
                    {c.mode === "Cash" && c.changeGiven ? ` · Change ₹${c.changeGiven}` : ""}
                    {c.mode === "Link" && c.status === "LinkSent" ? " · Awaiting payment" : ""}
                  </p>
                </div>
              </div>
              <span className="font-bold">₹{c.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit register */}
      {register.status === "Open" ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 font-medium">Deposit cash to office / bank and enter reference:</p>
          <input
            value={depositRef} onChange={e => setDepositRef(e.target.value)}
            placeholder="NEFT UTR or Cash receipt number"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button onClick={handleSubmit} disabled={!depositRef.trim()}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3">
            <CheckCircle2 className="w-4 h-4" />Submit Shift Register
          </button>
          <p className="text-xs text-gray-400 text-center">
            UPI amounts are already in the business account. Only cash needs physical deposit.
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-900">Register Submitted</p>
            <p className="text-xs text-green-700">Ref: {register.depositRef} · ₹{register.grandTotal.toLocaleString()} total</p>
          </div>
        </div>
      )}
    </div>
  );
}
