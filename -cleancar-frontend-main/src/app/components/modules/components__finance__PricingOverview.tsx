import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { getPricingSummary, getPlanPrice, getOneTimeWashPrice, type VehicleCategory } from "../../data/subscriptionPlans";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import {
  Car,
  Bike,
  Sparkles,
  Gift,
  Droplet,
  Star,
  TrendingDown,
} from "lucide-react";

export function PricingOverview() {
  const { VEHICLE_CATEGORIES, ADD_ON_SERVICES, COMBO_OFFERS } = usePlanDefinitions();
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleCategory>("Hatchback / Compact Sedan");

  const pricingSummary = getPricingSummary(selectedVehicle);
  const is4W = !selectedVehicle.includes("2W");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Complete Pricing Overview</CardTitle>
          <CardDescription>
            View all subscription plans, add-ons, combo offers, and one-time
            wash pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Vehicle Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              Select Vehicle Category
            </label>
            <Select
              value={selectedVehicle}
              onValueChange={(value: any) => setSelectedVehicle(value)}
            >
              <SelectTrigger className="w-80">
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

          <Tabs defaultValue="subscriptions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="subscriptions">
                Subscription Plans
              </TabsTrigger>
              <TabsTrigger value="onetime">One-Time Wash</TabsTrigger>
              <TabsTrigger value="addons">Add-Ons</TabsTrigger>
              <TabsTrigger value="combos">Combo Offers</TabsTrigger>
            </TabsList>

            {/* Subscription Plans */}
            <TabsContent value="subscriptions">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {PLAN_TYPES.filter(
                  (plan) => !plan.includes("One-Time")
                ).map((plan) => {
                  const price = getPlanPrice(
                    CURRENT_PLAN_VERSION,
                    selectedVehicle,
                    plan
                  );
                  const deliverables =
                    CURRENT_PLAN_VERSION.deliverables[plan];

                  if (price === "NA") return null;

                  return (
                    <Card key={plan} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{plan}</CardTitle>
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700"
                          >
                            Monthly
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {deliverables.tagline}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <div className="text-3xl font-bold text-blue-600">
                            {formatPrice(price as number)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {formatPrice(
                              Math.round((price as number) / 26)
                            )}{" "}
                            per wash (26 washes/month)
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="text-xs font-semibold text-gray-700 mb-2">
                              Included:
                            </div>
                            <ul className="space-y-1">
                              {deliverables.included
                                .slice(0, 3)
                                .map((item, idx) => (
                                  <li
                                    key={idx}
                                    className="text-xs text-gray-600 flex items-start gap-1"
                                  >
                                    <span className="text-green-600 mt-0.5">
                                      ✓
                                    </span>
                                    {item}
                                  </li>
                                ))}
                              {deliverables.included.length > 3 && (
                                <li className="text-xs text-blue-600">
                                  +{deliverables.included.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>

                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <strong>Best for:</strong> {deliverables.bestFor}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* One-Time Wash */}
            <TabsContent value="onetime">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {["Water Wash", "Water + Shampoo + Wax", "Water + Shampoo + Wax"].map((washType) => {
                  const memberPrice = getOneTimeWashPrice(
                    selectedVehicle,
                    washType as "Water Wash" | "Water + Shampoo + Wax" | "Water + Shampoo + Wax",
                    true
                  );
                  const nonMemberPrice = getOneTimeWashPrice(
                    selectedVehicle,
                    washType as "Water Wash" | "Water + Shampoo + Wax" | "Water + Shampoo + Wax",
                    false
                  );

                  const getIcon = () => {
                    switch (washType) {
                      case "Water Wash":
                        return <Droplet className="h-6 w-6 text-blue-600" />;
                      case "Water + Shampoo + Wax":
                        return <Sparkles className="h-6 w-6 text-purple-600" />;
                      case "Water + Shampoo + Wax":
                        return <Star className="h-6 w-6 text-amber-600" />;
                    }
                  };

                  return (
                    <Card key={washType} className="border-2">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          {getIcon()}
                          <CardTitle className="text-lg">
                            {washType} Wash
                          </CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                          Single service without subscription
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">
                              Member Price
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                              {formatPrice(memberPrice)}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-600 mb-1">
                              Non-Member Price
                            </div>
                            <div className="text-xl font-semibold">
                              {formatPrice(nonMemberPrice)}
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 w-full justify-center"
                          >
                            Save{" "}
                            {(
                              ((nonMemberPrice - memberPrice) /
                                nonMemberPrice) *
                              100
                            ).toFixed(0)}
                            % as member
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Add-Ons */}
            <TabsContent value="addons">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {ADD_ON_SERVICES.filter((addon) => addon.isActive).map(
                  (addon) => {
                    const price = is4W
                      ? addon.pricing["4W"]
                      : addon.pricing["2W"];

                    if (price === "NA") return null;

                    return (
                      <Card key={addon.id} className="border-2">
                        <CardHeader>
                          <CardTitle className="text-base">
                            {addon.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {addon.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <div className="text-2xl font-bold text-blue-600">
                                {formatPrice(price as number)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {addon.billing}
                              </div>
                            </div>

                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700"
                            >
                              {addon.category}
                            </Badge>

                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              <strong>Pairs well with:</strong>{" "}
                              {addon.bestPairedWith.slice(0, 2).join(", ")}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                )}
              </div>
            </TabsContent>

            {/* Combo Offers */}
            <TabsContent value="combos">
              <div className="space-y-4">
                {COMBO_OFFERS.filter((combo) => combo.isActive).map(
                  (combo) => (
                    <Card key={combo.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-purple-600" />
                            <CardTitle className="text-base">
                              {combo.name}
                            </CardTitle>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Save {(combo?.savingsPercentage ?? 0).toFixed(1)}%
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {combo.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="text-sm">
                              <span className="text-gray-600">
                                Individual Total:{" "}
                              </span>
                              <span className="line-through text-gray-500">
                                {formatPrice(combo.totalIndividualPrice)}
                              </span>
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              Combo Price: {formatPrice(combo.comboPrice)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {formatPrice(combo.savings)}
                            </div>
                            <div className="text-xs text-gray-600">
                              Total Savings
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Available Plans</CardDescription>
                <CardTitle className="text-2xl">
                  {
                    pricingSummary.subscriptionPrices.filter(
                      (p) => p.price !== "NA"
                    ).length
                  }
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>One-Time Options</CardDescription>
                <CardTitle className="text-2xl">
                  {pricingSummary.oneTimeWashes.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Available Add-Ons</CardDescription>
                <CardTitle className="text-2xl">
                  {
                    ADD_ON_SERVICES.filter((a) =>
                      is4W
                        ? a.pricing["4W"] !== "NA"
                        : a.pricing["2W"] !== "NA"
                    ).length
                  }
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active Combo Offers</CardDescription>
                <CardTitle className="text-2xl">
                  {COMBO_OFFERS.filter((c) => c.isActive).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
