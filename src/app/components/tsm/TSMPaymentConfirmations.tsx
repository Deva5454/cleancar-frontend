/**
 * TSM Payment Confirmations
 *
 * A TSE books a one-time/walk-in job with payment due at the door (see
 * TeleSalesExecutiveApp.tsx's handleCRMSubmit). The washer collects the
 * payment. This screen is where a TSM reviews that collection and confirms
 * it — only on TSM confirmation does the lead actually become "Converted"
 * and count as a real customer, not just when the washer collects the cash.
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { doorstepPaymentService, type DoorstepPayment } from "../../services/doorstepPaymentService";
import { useCustomers } from "../../contexts/CustomerContext";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { useEvents } from "../../contexts/EventSystem";
import { toast } from "sonner";

export function TSMPaymentConfirmations() {
  const { currentUser } = useRole();
  const { emit } = useEvents();
  const { city } = useCity();
  const { leads, updateLead } = useCustomers();
  const [pending, setPending] = useState<DoorstepPayment[]>([]);

  const reload = () => setPending(doorstepPaymentService.getTSEPendingConfirmations(city));
  useEffect(() => { reload(); }, [city]);

  const handleConfirm = (payment: DoorstepPayment) => {
    // Find the lead this payment's job came from — matched via the note
    // left on the lead when it was booked (see handleCRMSubmit), since the
    // job itself doesn't carry a leadId back-reference.
    const relatedLead = leads.find((l: any) =>
      l.status === "Payment Pending" && (l.notes || "").includes(payment.jobId)
    );

    doorstepPaymentService.reconcileRegister(
      `REG-${city}-${payment.shiftDate}-${new Date(payment.collectedAt ?? "").getHours() < 14 ? "Morning" : "Evening"}`,
      currentUser?.name || "TSM"
    );

    if (relatedLead) {
      updateLead(relatedLead.leadId, {
        status: "Converted",
        notes: `${relatedLead.notes || ""} — Payment confirmed by ${currentUser?.name || "TSM"} on ${new Date().toLocaleDateString("en-IN")}.`,
      } as any);
      emit("LEAD_CONVERTED", {
        leadId: relatedLead.leadId,
        customerId: payment.customerId,
        tseName: relatedLead.assignedTo,
        cityId: city,
        pincode: relatedLead.address?.pinCode,
      }, "TSMPaymentConfirmations");
      toast.success(`${payment.customerName} — payment confirmed, lead converted to customer.`);
    } else {
      // Payment confirmed either way — the money collection itself doesn't
      // depend on finding the originating lead, but flag it so it can be
      // manually reconciled rather than silently lost.
      toast.warning(`${payment.customerName} — payment confirmed, but couldn't find the matching lead to auto-convert. Check manually.`);
    }
    setPending(p => p.filter(x => x.paymentId !== payment.paymentId));
  };

  const totalAmount = pending.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payment Confirmations</h2>
          <p className="text-sm text-gray-500 mt-1">
            Confirm doorstep collections from washers — this is the step that finalizes the lead as a converted customer.
          </p>
        </div>
        {pending.length > 0 && (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-sm px-3 py-1">
            {pending.length} pending · ₹{totalAmount.toLocaleString()}
          </Badge>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">✓</span>
          </div>
          <p className="text-gray-600 font-medium">No pending payment confirmations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => (
            <Card key={p.paymentId} className="border-amber-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.customerName}</CardTitle>
                  <Badge variant="outline">{p.mode}</Badge>
                </div>
                <p className="text-xs text-gray-500">
                  Collected by {p.collectedByName} · {p.collectedAt && new Date(p.collectedAt).toLocaleString("en-IN")}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-bold text-gray-900">₹{p.amount.toLocaleString()}</p>
                {p.mode === "UPI" && p.utrLast4 && (
                  <p className="text-sm text-gray-600">UTR ending ****{p.utrLast4}</p>
                )}
                {p.mode === "Cash" && (
                  <p className="text-sm text-gray-600">
                    Cash received ₹{p.cashAmount} {p.changeGiven ? `· ₹${p.changeGiven} change given` : ""}
                  </p>
                )}
                <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full" onClick={() => handleConfirm(p)}>
                  Confirm — Convert Lead to Customer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default TSMPaymentConfirmations;
