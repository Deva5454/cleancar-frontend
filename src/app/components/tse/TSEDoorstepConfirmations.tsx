/**
 * TSEDoorstepConfirmations
 * Morning queue for TSE — shows all doorstep-collected jobs from the previous
 * shift that need lead closure (mark as Won) in the CRM.
 */
import { useState, useEffect } from "react";
import { CheckCircle2, Banknote, QrCode, Send, Clock, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { doorstepPaymentService, type DoorstepPayment } from "../../services/doorstepPaymentService";

const MODE_LABEL: Record<string, string> = { UPI: "UPI", Cash: "Cash", Link: "WhatsApp Link" };
const MODE_COLOR: Record<string, string> = {
  UPI:  "bg-blue-100 text-blue-800",
  Cash: "bg-amber-100 text-amber-800",
  Link: "bg-purple-100 text-purple-800",
};

export function TSEDoorstepConfirmations({ cityId = "CITY-SURAT" }: { cityId?: string }) {
  const [pending, setPending] = useState<DoorstepPayment[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    setPending(doorstepPaymentService.getTSEPendingConfirmations(cityId));
  }, [cityId]);

  const handleConfirm = (payment: DoorstepPayment) => {
    setConfirming(payment.paymentId);
    // Mark reconciled — TSE has confirmed the lead as won
    doorstepPaymentService.reconcileRegister(
      `REG-${cityId}-${payment.shiftDate}-${new Date(payment.collectedAt ?? "").getHours() < 14 ? "Morning" : "Evening"}`,
      "TSE"
    );
    toast.success(`${payment.customerName} confirmed — lead marked as Won`);
    setPending(p => p.filter(x => x.paymentId !== payment.paymentId));
    setConfirming(null);
  };

  if (pending.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-gray-200" />
        <p className="text-sm">All doorstep collections confirmed</p>
      </div>
    );
  }

  const totalAmount = pending.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-green-600" />
            Doorstep Collections — Pending Confirmation
          </h3>
          <p className="text-xs text-gray-500">{pending.length} jobs · ₹{totalAmount.toLocaleString()} total collected by field team</p>
        </div>
      </div>

      {pending.map(p => (
        <div key={p.paymentId} className="border rounded-xl p-4 bg-white space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm text-gray-900">{p.customerName}</p>
              <p className="text-xs text-gray-500">{p.shiftDate} · Collected by {p.collectedByName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODE_COLOR[p.mode]}`}>
                  {MODE_LABEL[p.mode]}
                </span>
                {p.utrLast4 && <span className="text-xs text-gray-400">UTR ****{p.utrLast4}</span>}
                {p.mode === "Link" && p.status === "LinkSent" && (
                  <span className="text-xs text-amber-600">⚠ Link sent — confirm if paid</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-700">₹{p.amount.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{p.status}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleConfirm(p)}
              disabled={confirming === p.paymentId}
              className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg py-2 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {p.mode === "Link" && p.status === "LinkSent" ? "Confirm Paid — Mark Won" : "Confirm — Mark Lead Won"}
            </button>
            {p.mode === "Link" && p.status === "LinkSent" && (
              <button
                className="px-3 py-2 border border-amber-300 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-50"
                onClick={() => toast.info("Re-send link — use WhatsApp outbox")}
              >
                Resend Link
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
