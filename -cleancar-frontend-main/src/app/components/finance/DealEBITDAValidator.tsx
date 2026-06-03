import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { type VehicleCategory, type PlanType, type AddOnService } from "../../data/subscriptionPlans";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import {
  getTotalCostPerWash,
  getMonthlyCost,
  calculateEBITDA,
  getEBITDAStatus,
  meetsEBITDAFloor,
  EBITDA_FLOOR,
  isDurationAllowed,
  DURATION_DISCOUNTS,
  getEffectiveMonthlyPrice,
} from "../../data/ebitdaCalculations";
import { getAddOnEBITDAById } from "../../data/addOnEBITDA";
import { AlertCircle, CheckCircle, TrendingUp, Lock, Send } from "lucide-react";

export function DealEBITDAValidator() {
  const { CURRENT_PLAN_VERSION, VEHICLE_CATEGORIES, ADD_ON_SERVICES, formatPrice } = usePlanDefinitions();
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleCategory>("Hatchback / Compact Sedan");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("Shampoo Wash");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string>("Monthly");
  const [withIncentive, setWithIncentive] = useState(false);

  const vehicleType = selectedVehicle.includes("2W") ? "2W" : "4W";

  // Get available plans for selected vehicle
  const availablePlans = Object.entries(
    CURRENT_PLAN_VERSION.pricingMatrix[selectedVehicle]
  )
    .filter(([_, price]) => price !== "NA" && !_.includes("One-Time"))
    .map(([plan, _]) => plan as PlanType);

  // Get plan price
  const basePlanPrice =
    CURRENT_PLAN_VERSION.pricingMatrix[selectedVehicle][selectedPlan];
  if (basePlanPrice === "NA") return null;

  // Get duration discount
  const durationData = DURATION_DISCOUNTS.find((d) => d.duration === selectedDuration);
  const discountPercentage = durationData?.discountPercentage || 0;
  const effectivePlanPrice = getEffectiveMonthlyPrice(
    basePlanPrice as number,
    discountPercentage
  );

  // Calculate base plan costs
  const planCostBreakdown = getTotalCostPerWash(
    selectedPlan,
    vehicleType,
    withIncentive
  );
  const planMonthlyCost = getMonthlyCost(planCostBreakdown.total);

  // Calculate add-on costs and revenue
  let totalAddOnRevenue = 0;
  let totalAddOnCost = 0;

  selectedAddOns.forEach((addonId) => {
    const addonEBITDA = getAddOnEBITDAById(addonId);
    if (addonEBITDA) {
      const price = vehicleType === "4W" ? addonEBITDA.price4W : addonEBITDA.price2W || 0;
      const cost = vehicleType === "4W" ? addonEBITDA.directCost4W : addonEBITDA.directCost2W || 0;
      totalAddOnRevenue += price;
      totalAddOnCost += cost;
    }
  });

  // Calculate deal EBITDA
  const dealRevenue = effectivePlanPrice + totalAddOnRevenue;
  const dealCost = planMonthlyCost + totalAddOnCost;
  const dealEBITDA = calculateEBITDA(dealRevenue, dealCost);
  const dealStatus = getEBITDAStatus(dealEBITDA.ebitdaPercentage);
  const meetsFloor = meetsEBITDAFloor(dealEBITDA.ebitdaPercentage);

  // Check if duration is allowed
  const durationAllowed = isDurationAllowed(
    basePlanPrice as number,
    planMonthlyCost,
    discountPercentage
  );

  // Get available add-ons for this plan
  const availableAddOns = ADD_ON_SERVICES.filter((addon) => {
    const price = vehicleType === "4W" ? addon.pricing["4W"] : addon.pricing["2W"];
    return price !== "NA" && addon.isActive;
  });

  const toggleAddOn = (addonId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deal EBITDA Validator (TSE Tool)</CardTitle>
          <CardDescription>
            Validate if a deal meets the 30% EBITDA floor before sending payment
            link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Deal Configuration */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Vehicle Category
              </label>
              <Select
                value={selectedVehicle}
                onValueChange={(value: any) => {
                  setSelectedVehicle(value);
                  setSelectedPlan(
                    Object.entries(
                      CURRENT_PLAN_VERSION.pricingMatrix[value as VehicleCategory]
                    ).find(([_, price]) => price !== "NA")?.[0] as PlanType || "Shampoo Wash"
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Plan Type</label>
              <Select
                value={selectedPlan}
                onValueChange={(value: any) => setSelectedPlan(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Billing Duration
              </label>
              <Select
                value={selectedDuration}
                onValueChange={setSelectedDuration}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_DISCOUNTS.map((duration) => (
                    <SelectItem key={duration.duration} value={duration.duration}>
                      {duration.duration}{" "}
                      {duration.discountPercentage > 0 &&
                        `(${duration.discountPercentage}% off)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost Scenario Toggle */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              Cost Scenario
            </label>
            <div className="flex gap-2">
              <Button
                variant={!withIncentive ? "default" : "outline"}
                size="sm"
                onClick={() => setWithIncentive(false)}
              >
                BASE (No Incentive)
              </Button>
              <Button
                variant={withIncentive ? "default" : "outline"}
                size="sm"
                onClick={() => setWithIncentive(true)}
              >
                WITH INCENTIVE
              </Button>
            </div>
          </div>

          {/* Add-Ons Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              Select Add-Ons (Optional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableAddOns.map((addon) => {
                const price =
                  vehicleType === "4W"
                    ? addon.pricing["4W"]
                    : addon.pricing["2W"];
                const isSelected = selectedAddOns.includes(addon.id);

                return (
                  <Button
                    key={addon.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleAddOn(addon.id)}
                    className="justify-start text-left"
                  >
                    <div>
                      <div className="font-medium">{addon.name}</div>
                      <div className="text-xs opacity-80">
                        {formatPrice(price as number)}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Deal Summary */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Deal Summary</h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Revenue Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Plan ({selectedPlan}):</span>
                    <span className="font-medium">
                      {formatPrice(basePlanPrice as number)}
                    </span>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Duration Discount ({discountPercentage}%):</span>
                      <span className="font-medium">
                        -{formatPrice((basePlanPrice as number) - effectivePlanPrice)}
                      </span>
                    </div>
                  )}
                  {discountPercentage > 0 && (
                    <div className="flex justify-between">
                      <span>Effective Plan Price:</span>
                      <span className="font-medium">
                        {formatPrice(effectivePlanPrice)}
                      </span>
                    </div>
                  )}
                  {selectedAddOns.length > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Add-Ons ({selectedAddOns.length}):</span>
                      <span className="font-medium">
                        +{formatPrice(totalAddOnRevenue)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total Monthly Revenue:</span>
                    <span className="font-bold text-lg">
                      {formatPrice(dealRevenue)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Plan Cost:</span>
                    <span className="font-medium">
                      {formatPrice(Math.round(planMonthlyCost))}
                    </span>
                  </div>
                  {selectedAddOns.length > 0 && (
                    <div className="flex justify-between">
                      <span>Add-On Direct Costs:</span>
                      <span className="font-medium">
                        {formatPrice(totalAddOnCost)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total Monthly Cost:</span>
                    <span className="font-bold text-lg">
                      {formatPrice(Math.round(dealCost))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* EBITDA Result */}
            <Card
              className={`border-2 ${
                meetsFloor
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {meetsFloor ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                    <CardTitle
                      className={meetsFloor ? "text-green-900" : "text-red-900"}
                    >
                      Deal EBITDA: {dealStatus.emoji}{" "}
                      {(dealEBITDA.ebitdaPercentage * 100).toFixed(1)}%
                    </CardTitle>
                  </div>
                  <Badge
                    variant={meetsFloor ? "default" : "destructive"}
                    className="text-base px-4 py-2"
                  >
                    {meetsFloor ? "✓ APPROVED" : "✗ BLOCKED"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">EBITDA Amount</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(Math.round(dealEBITDA.ebitdaAmount))}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">EBITDA %</div>
                      <div className={`text-xl font-bold ${dealStatus.color}`}>
                        {(dealEBITDA.ebitdaPercentage * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">vs 30% Floor</div>
                      <div
                        className={`text-xl font-bold ${
                          meetsFloor ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {meetsFloor ? "+" : ""}
                        {(
                          (dealEBITDA.ebitdaPercentage - EBITDA_FLOOR) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>

                  {!meetsFloor && (
                    <div className="bg-red-100 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-800 font-medium">
                        ⚠ This deal cannot proceed - EBITDA below 30% floor
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        TSE must escalate to Tele Sales Manager if customer insists.
                        Consider upselling to higher-value plan or reducing duration
                        discount.
                      </p>
                    </div>
                  )}

                  {meetsFloor && dealEBITDA.ebitdaPercentage >= 0.35 && (
                    <div className="bg-green-100 border border-green-200 rounded p-3">
                      <p className="text-sm text-green-800 font-medium">
                        ✅ Excellent deal - above 35% target margin
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        This is a high-quality deal that meets all margin requirements.
                      </p>
                    </div>
                  )}

                  {!durationAllowed && discountPercentage > 0 && (
                    <div className="bg-orange-100 border border-orange-200 rounded p-3">
                      <p className="text-sm text-orange-800 font-medium">
                        ⚠ Duration discount ({discountPercentage}%) takes this plan below
                        30% floor
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        This duration option should be greyed out for this plan. Consider
                        monthly or quarterly billing instead.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <Button
                size="lg"
                disabled={!meetsFloor}
                className="flex-1"
              >
                {meetsFloor ? (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Send Payment Link
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-5 w-5" />
                    Cannot Proceed - Margin Floor Not Met
                  </>
                )}
              </Button>

              {!meetsFloor && (
                <Button variant="outline" size="lg">
                  Escalate to TSM
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
