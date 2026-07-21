/**
 * GiftSubscriptions — /accounts/gift-subscriptions
 *
 * Real gift-a-wash requests, submitted through the customer portal.
 * There's no payment gateway in this app, so a gift starts "Pending
 * Payment" until a real staff member confirms the buyer actually paid
 * (by phone or in person) - only then does the gift code become usable.
 */

import { useState } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService, type GiftSubscription } from "../../services/accountingEntryService";
import { PLAN_TIER_NAMES } from "../../data/subscriptionPlans";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Gift } from "lucide-react";
import { toast } from "sonner";

export function GiftSubscriptions() {
  const { city } = useCity();
  const [gifts, setGifts] = useState<GiftSubscription[]>(() => accountingEntryService.getGiftSubscriptions(city));
  const [payRefId, setPayRefId] = useState<string | null>(null);
  const [payReference, setPayReference] = useState("");

  const refresh = () => setGifts(accountingEntryService.getGiftSubscriptions(city));

  const pending = gifts.filter((g) => g.status === "Pending Payment");
  const active = gifts.filter((g) => g.status === "Active");
  const redeemed = gifts.filter((g) => g.status === "Redeemed");

  const handleConfirmPayment = () => {
    if (!payRefId || !payReference.trim()) { toast.error("Enter a real payment reference before confirming"); return; }
    const success = accountingEntryService.markGiftPaid(payRefId, city, payReference.trim());
    if (!success) { toast.error("Could not update — please try again."); return; }
    toast.success("Payment confirmed — the gift code is now active.");
    setPayRefId(null);
    setPayReference("");
    refresh();
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-600" />
          Gift Subscriptions
        </h1>
        <p className="text-sm text-gray-500">Real gift-a-wash requests from the customer portal</p>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Awaiting Payment Confirmation ({pending.length})</h3>
        {pending.length === 0 ? (
          <Card className="p-6 text-center text-sm text-gray-500">Nothing waiting right now.</Card>
        ) : (
          <div className="space-y-2">
            {pending.map((g) => (
              <Card key={g.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{g.buyerName} → {g.recipientName}</p>
                    <p className="text-sm text-gray-500">{PLAN_TIER_NAMES[g.planType] || g.planType} — ₹{g.amount.toLocaleString("en-IN")}</p>
                    {g.recipientPhone && <p className="text-xs text-gray-400">Recipient: {g.recipientPhone}</p>}
                  </div>
                  {payRefId !== g.id && (
                    <Button size="sm" onClick={() => { setPayRefId(g.id); setPayReference(""); }}>Confirm Payment</Button>
                  )}
                </div>
                {payRefId === g.id && (
                  <div className="flex gap-2 items-center mt-3 pt-3 border-t">
                    <input
                      className="border rounded-lg px-2 py-1.5 text-sm flex-1"
                      placeholder="Real payment reference"
                      value={payReference}
                      onChange={(e) => setPayReference(e.target.value)}
                    />
                    <Button size="sm" onClick={handleConfirmPayment}>Confirm</Button>
                    <Button size="sm" variant="outline" onClick={() => setPayRefId(null)}>Cancel</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Active — Not Yet Redeemed ({active.length})</h3>
        {active.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing here yet.</p>
        ) : (
          <div className="space-y-2">
            {active.map((g) => (
              <Card key={g.id} className="p-3 flex items-center justify-between text-sm">
                <span>{g.recipientName} — {g.giftCode}</span>
                <span className="text-green-600">Ready to redeem</span>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Redeemed ({redeemed.length})</h3>
        {redeemed.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing here yet.</p>
        ) : (
          <div className="space-y-2">
            {redeemed.map((g) => (
              <Card key={g.id} className="p-3 text-sm text-gray-600">
                {g.recipientName} redeemed {g.giftCode} on {g.redeemedAt ? new Date(g.redeemedAt).toLocaleDateString() : "—"}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GiftSubscriptions;
