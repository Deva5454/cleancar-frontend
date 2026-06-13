/**
 * TSEComplimentary2W.tsx
 * TSE screen to offer a complimentary 2-wheeler wash to a customer
 * Used at: New subscription conversion + Retention/renewal
 */
import { useState } from "react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { createOffer, getTseCapStatus, TwoWheelerType } from "../../services/complimentary2WService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Bike, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface TSEComplimentary2WProps {
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicle4WReg: string;
  linkedSubscriptionId?: string;
  reasonCode: "NEW_CONVERSION_INCENTIVE" | "RETENTION_INCENTIVE";
  onDone: () => void;
  onCancel: () => void;
}

const TWO_WHEELER_TYPES: TwoWheelerType[] = ["Scooter", "Commuter Bike", "Sports Bike"];

export function TSEComplimentary2W({
  customerId, customerName, customerPhone, vehicle4WReg,
  linkedSubscriptionId, reasonCode, onDone, onCancel
}: TSEComplimentary2WProps) {
  const { currentUser } = useRole() as any;
  const { city } = useCity() as any;

  const capStatus = getTseCapStatus(currentUser?.employeeId || "");
  const [vehicle2WReg, setVehicle2WReg] = useState("");
  const [vehicle2WType, setVehicle2WType] = useState<TwoWheelerType>("Scooter");
  const [vehicle2WBrand, setVehicle2WBrand] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!vehicle2WReg.trim()) { toast.error("Enter 2-wheeler registration number"); return; }
    if (!vehicle2WBrand.trim()) { toast.error("Enter brand/model"); return; }

    // Guard: ensure the linked 4W subscription is actually Active
    if (linkedSubscriptionId) {
      try {
        const subs: any[] = JSON.parse(localStorage.getItem("cleancar_subscriptions") || "[]");
        const sub = subs.find((s: any) => s.subscriptionId === linkedSubscriptionId);
        if (sub && sub.status !== "Active") {
          toast.error(`Cannot offer complimentary wash — the linked 4W subscription is "${sub.status}", not Active.`);
          return;
        }
      } catch {}
    }

    setSubmitting(true);
    const result = createOffer({
      customerId, customerName, customerPhone,
      vehicle4WReg,
      vehicle2WReg: vehicle2WReg.toUpperCase(),
      vehicle2WType,
      vehicle2WBrand,
      vehicle2WModel: "",
      reasonCode,
      offeredByTseId: currentUser?.employeeId || "",
      offeredByTseName: currentUser?.name || "TSE",
      linkedSubscriptionId,
      cityId: city || "CITY-SURAT",
    });

    setSubmitting(false);
    if (result.success) {
      toast.success("Complimentary 2W offer submitted. Pending TSM approval.");
      onDone();
    } else {
      toast.error(result.error || "Could not create offer");
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3 mb-2">
        <Bike className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-lg font-bold text-gray-900">Offer Complimentary 2W Wash</h2>
          <p className="text-xs text-gray-500">
            {reasonCode === "NEW_CONVERSION_INCENTIVE" ? "New subscription incentive" : "Retention incentive"} · Requires TSM approval
          </p>
        </div>
      </div>

      {/* Cap status */}
      <div className={`p-3 rounded-xl border ${capStatus.remaining > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {capStatus.remaining > 0
              ? <CheckCircle className="w-4 h-4 text-green-600" />
              : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span className="text-sm font-semibold">
              {capStatus.remaining > 0 ? `${capStatus.remaining} offers remaining this month` : "Monthly cap reached"}
            </span>
          </div>
          <Badge className={capStatus.remaining > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {capStatus.used}/{capStatus.cap} used
          </Badge>
        </div>
      </div>

      {capStatus.remaining === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Cap reached for this month</p>
          <p className="text-xs mt-1">Resets on the 1st of next month</p>
          <Button variant="outline" onClick={onCancel} className="mt-4">Back</Button>
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-sm">2-Wheeler Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
              Customer: <strong>{customerName}</strong> · 4W: <strong>{vehicle4WReg}</strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">2W Registration Number *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
                placeholder="GJ05XX1234"
                value={vehicle2WReg}
                onChange={e => setVehicle2WReg(e.target.value.toUpperCase())}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Type *</label>
              <div className="flex gap-2">
                {TWO_WHEELER_TYPES.map(t => (
                  <button key={t}
                    onClick={() => setVehicle2WType(t)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border ${vehicle2WType === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Brand / Model *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Honda Activa, Bajaj Pulsar"
                value={vehicle2WBrand}
                onChange={e => setVehicle2WBrand(e.target.value)}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <strong>Note:</strong> This offer requires TSM approval. Customer will be informed once approved. Valid 30 days from approval.
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Bike className="w-4 h-4 mr-2" />
                {submitting ? "Submitting..." : "Submit for Approval"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TSEComplimentary2W;
