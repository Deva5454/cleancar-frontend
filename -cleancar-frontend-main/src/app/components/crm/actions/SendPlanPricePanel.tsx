import { useState } from "react";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { FileText, Send, X, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { useCustomers } from "../../../contexts/CustomerContext";
import { useRole } from "../../../contexts/RoleContext";

interface SendPlanPricePanelProps {
  lead: any;
  onClose: () => void;
  onComplete: () => void;
}

export function SendPlanPricePanel({
  lead,
  onClose,
  onComplete,
}: SendPlanPricePanelProps) {
  const { appendLeadActivity } = useCustomers();
  const { currentUser } = useRole();
  const leadId = lead.leadId || lead.id;
  const [selectedPlan, setSelectedPlan] = useState(lead.planOfInterest);
  const [vehicleCategory, setVehicleCategory] = useState(lead.vehicleCategory);
  const [channel, setChannel] = useState("both");
  const [priceVersion, setPriceVersion] = useState("current");

  // Plan pricing — from subscriptionPlans.ts CURRENT_PLAN_VERSION (Package Architecture v1.8)
  const planPrices: Record<string, Record<string, number>> = {
    "EXPRESS_WASH": { Hatchback: 1249, SUV: 1499, "Luxury SUV": 1999 },
    "SMART_WASH":   { Hatchback: 1599, SUV: 1999, "Luxury SUV": 2699 },
    "ELITE_WASH":        { Hatchback: 1999, SUV: 2499, "Luxury SUV": 3499 },
  };

  // Display names for plan keys
  const planDisplayNames: Record<string, string> = {
    "EXPRESS_WASH": "Express Wash (Chamakti Subah)",
    "SMART_WASH":   "Smart Wash (Raksha Plan)",
    "ELITE_WASH":        "ELITE (Raja Seva)",
  };

  const currentPrice = planPrices[selectedPlan]?.[vehicleCategory] || 0;
  const oldPrice = 0; // No fake old price — show actual price only

  const planFeatures: Record<string, string[]> = {
    "EXPRESS_WASH": [
      "Daily exterior water wash + microfibre dry (30×/month)",
      "Weekly tyre & rim spray-clean",
      "Monthly underbody flush",
      "Monthly windshield clean (outside)",
      "Monthly shampoo wash",
    ],
    "SMART_WASH": [
      "Everything in Express Wash",
      "Fortnightly shampoo wash (2×/month)",
      "Fortnightly interior vacuum & mat clean (2×/month)",
      "Monthly tyre dressing & shine coat",
      "Monthly car fragrance",
    ],
    "ELITE_WASH": [
      "Everything in Smart Wash",
      "Weekly shampoo wash (4×/month)",
      "Fortnightly dashboard & console deep clean (2×/month)",
      "Fortnightly tyre dressing (2×/month)",
      "Monthly full hand wax polish",
      "Monthly engine bay dry blow (no water)",
      "Monthly premium fragrance + cabin sanitisation",
    ],
  };

  const handleSend = () => {
    const planPrice = planPrices[selectedPlan]?.[vehicleCategory] || 0;
    toast.success(
      channel === "both"
        ? "Plan & Price sent via WhatsApp and Email!"
        : `Plan & Price sent via ${channel === "whatsapp" ? "WhatsApp" : "Email"}!`
    );

    appendLeadActivity(leadId, {
      timestamp: new Date().toISOString(),
      type: "price_sent",
      description: `Plan pricing sent: ${selectedPlan}`,
      performedBy: currentUser?.name || "TSE",
      metadata: { plan: selectedPlan, price: planPrice },
    });
    
    setTimeout(() => {
      const moveStage = confirm("Move lead to 'Proposal Sent' stage?");
      if (moveStage) {
        toast.success("Lead moved to Proposal Sent stage");
      }
    }, 500);

    onComplete();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" />
          <h4 className="font-semibold text-gray-900">Send Plan & Price</h4>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Plan Version Warning */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">
            Previously quoted ₹{oldPrice}/month under Plan V1
          </p>
          <p className="text-sm text-amber-700 mt-1">
            Current price is ₹{currentPrice}/month. Choose which price to send.
          </p>
          <div className="flex gap-3 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="price-version"
                value="current"
                checked={priceVersion === "current"}
                onChange={() => setPriceVersion("current")}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">
                Send Current Plan Price (₹{currentPrice})
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="price-version"
                value="historical"
                checked={priceVersion === "historical"}
                onChange={() => setPriceVersion("historical")}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">
                Send Historical Quote (₹{oldPrice})
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Plan Selector */}
        <div className="space-y-2">
          <Label>Select Plan</Label>
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPRESS_WASH">CleanCar Basic</SelectItem>
              <SelectItem value="SMART_WASH">CleanCar Premium</SelectItem>
              <SelectItem value="ELITE_WASH">CleanCar Elite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Category */}
        <div className="space-y-2">
          <Label>Vehicle Category</Label>
          <Select value={vehicleCategory} onValueChange={setVehicleCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hatchback">Hatchback</SelectItem>
              <SelectItem value="Sedan">Sedan</SelectItem>
              <SelectItem value="SUV">SUV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Monthly Price */}
        <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg">
          <Label className="text-sm text-gray-600">Monthly Price</Label>
          <p className="text-3xl font-bold text-teal-700 mt-1">
            ₹{priceVersion === "current" ? currentPrice : oldPrice}
            <span className="text-sm font-normal text-gray-600">/month</span>
          </p>
        </div>

        {/* Plan Features Preview */}
        <div className="space-y-2">
          <Label>Plan Features</Label>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
            {planFeatures[selectedPlan as keyof typeof planFeatures]?.map(
              (feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Channel Selector */}
        <div className="space-y-2">
          <Label>Send Via</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setChannel("whatsapp")}
              className={`flex-1 p-2 border-2 rounded-lg text-sm font-medium ${
                channel === "whatsapp"
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-gray-200"
              }`}
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setChannel("email")}
              className={`flex-1 p-2 border-2 rounded-lg text-sm font-medium ${
                channel === "email"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setChannel("both")}
              className={`flex-1 p-2 border-2 rounded-lg text-sm font-medium ${
                channel === "both"
                  ? "border-purple-600 bg-purple-50 text-purple-700"
                  : "border-gray-200"
              }`}
            >
              Both
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSend}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Plan & Price
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
