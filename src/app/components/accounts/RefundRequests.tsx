/**
 * RefundRequests — /accounts/refund-requests
 *
 * Real customer refund requests, submitted through the customer portal.
 * Approving posts a real, reversing ledger entry via the same real
 * createJournal() Credit/Debit Notes already use. Approved does NOT mean
 * paid — there's no payment gateway in this app to auto-reverse a real
 * UPI/cash transaction, so a separate, honest "Mark as Paid" step exists
 * for a staff member to confirm the money actually went back, once it
 * genuinely has.
 */

import { useState } from "react";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { accountingEntryService, type RefundRequest } from "../../services/accountingEntryService";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Wallet } from "lucide-react";
import { toast } from "sonner";

export function RefundRequests() {
  const { city, cityInfo } = useCity();
  const { currentUser } = useRole();
  const [requests, setRequests] = useState<RefundRequest[]>(() => accountingEntryService.getRefundRequests(city));
  const [payRefId, setPayRefId] = useState<string | null>(null);
  const [payReference, setPayReference] = useState("");

  const refresh = () => setRequests(accountingEntryService.getRefundRequests(city));

  const pending = requests.filter((r) => r.status === "Pending");
  const approved = requests.filter((r) => r.status === "Approved");
  const resolved = requests.filter((r) => r.status === "Rejected" || r.status === "Paid");

  const handleApprove = (r: RefundRequest) => {
    const success = accountingEntryService.approveRefund(r.id, city, cityInfo.displayName, currentUser?.name || "Accounts");
    if (!success) { toast.error("Could not approve — please try again."); return; }
    toast.success(`Approved — ₹${r.amount.toLocaleString("en-IN")} for ${r.customerName}. Real ledger entry posted.`);
    refresh();
  };

  const handleReject = (r: RefundRequest) => {
    const success = accountingEntryService.rejectRefund(r.id, city, currentUser?.name || "Accounts");
    if (!success) { toast.error("Could not reject — please try again."); return; }
    toast.info(`Rejected — ${r.customerName}'s request`);
    refresh();
  };

  const handleMarkPaid = () => {
    if (!payRefId || !payReference.trim()) { toast.error("Enter a real payment reference before confirming"); return; }
    const success = accountingEntryService.markRefundPaid(payRefId, city, payReference.trim());
    if (!success) { toast.error("Could not update — please try again."); return; }
    toast.success("Marked as paid.");
    setPayRefId(null);
    setPayReference("");
    refresh();
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-purple-600" />
          Refund Requests
        </h1>
        <p className="text-sm text-gray-500">Real requests submitted through the customer portal</p>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Pending Review ({pending.length})</h3>
        {pending.length === 0 ? (
          <Card className="p-6 text-center text-sm text-gray-500">Nothing waiting right now.</Card>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <Card key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{r.customerName} — ₹{r.amount.toLocaleString("en-IN")}</p>
                  <p className="text-sm text-gray-500">{r.reason}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Requested {new Date(r.requestedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(r)}>Approve</Button>
                  <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => handleReject(r)}>Reject</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Approved — Awaiting Real Payment ({approved.length})</h3>
        <p className="text-xs text-gray-400 mb-2">Approved means the ledger has been adjusted — it doesn't mean the money has reached the customer yet. Confirm once it genuinely has.</p>
        {approved.length === 0 ? (
          <Card className="p-6 text-center text-sm text-gray-500">Nothing here.</Card>
        ) : (
          <div className="space-y-2">
            {approved.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{r.customerName} — ₹{r.amount.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-gray-500">Approved by {r.reviewedBy}</p>
                  </div>
                  {payRefId !== r.id && (
                    <Button size="sm" onClick={() => { setPayRefId(r.id); setPayReference(""); }}>Mark as Paid</Button>
                  )}
                </div>
                {payRefId === r.id && (
                  <div className="flex gap-2 items-center mt-3 pt-3 border-t">
                    <input
                      className="border rounded-lg px-2 py-1.5 text-sm flex-1"
                      placeholder="Real payment reference (UPI ref, cash voucher no.)"
                      value={payReference}
                      onChange={(e) => setPayReference(e.target.value)}
                    />
                    <Button size="sm" onClick={handleMarkPaid}>Confirm</Button>
                    <Button size="sm" variant="outline" onClick={() => setPayRefId(null)}>Cancel</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Resolved ({resolved.length})</h3>
        {resolved.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing here yet.</p>
        ) : (
          <div className="space-y-2">
            {resolved.map((r) => (
              <Card key={r.id} className="p-3 flex items-center justify-between text-sm">
                <span>{r.customerName} — ₹{r.amount.toLocaleString("en-IN")}</span>
                <span className={r.status === "Paid" ? "text-green-600" : "text-red-600"}>{r.status}</span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RefundRequests;
