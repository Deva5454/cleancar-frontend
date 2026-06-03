import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  ONE_TIME_WASH_PRICING,
  getAllOneTimeWashOptions,
  formatPrice,
  type VehicleCategory,
  VEHICLE_CATEGORIES,
} from "../../data/subscriptionPlans";
import { Droplet, Sparkles, Star } from "lucide-react";

export function OneTimeWashPricing() {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCategory | "All">(
    "All"
  );

  const displayedPricing =
    selectedVehicle === "All"
      ? ONE_TIME_WASH_PRICING
      : getAllOneTimeWashOptions(selectedVehicle);

  const getWashTypeIcon = (washType: string) => {
    switch (washType) {
      case "EXPRESS_WASH":
        return <Droplet className="h-4 w-4" />;
      case "ELITE_WASH":
        return <Sparkles className="h-4 w-4" />;
      case "Elite":
        return <Star className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getWashTypeBadge = (washType: string) => {
    switch (washType) {
      case "EXPRESS_WASH":
        return "bg-blue-100 text-blue-800";
      case "ELITE_WASH":
        return "bg-purple-100 text-purple-800";
      case "Elite":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Group pricing by vehicle category
  const groupedPricing = displayedPricing.reduce((acc, pricing) => {
    if (!acc[pricing.vehicleCategory]) {
      acc[pricing.vehicleCategory] = [];
    }
    acc[pricing.vehicleCategory].push(pricing);
    return acc;
  }, {} as Record<string, typeof ONE_TIME_WASH_PRICING>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>One-Time Wash Pricing</CardTitle>
          <CardDescription>
            Walk-in and member pricing for single wash services without
            subscription commitment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="mb-6">
            <div className="w-64">
              <label className="text-sm font-medium mb-2 block">
                Filter by Vehicle Category
              </label>
              <Select
                value={selectedVehicle}
                onValueChange={(value: any) => setSelectedVehicle(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {VEHICLE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-[800px] sm:min-w-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Category</TableHead>
                      <TableHead>Wash Type</TableHead>
                      <TableHead>Member Price</TableHead>
                      <TableHead>Non-Member Price</TableHead>
                      <TableHead>Member Discount</TableHead>
                      <TableHead>Subscription Savings</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {displayedPricing.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No pricing data found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedPricing.map((pricing, index) => {
                    const memberDiscount =
                      ((pricing.nonMemberPrice - pricing.memberPrice) /
                        pricing.nonMemberPrice) *
                      100;

                    return (
                      <TableRow key={`${pricing.vehicleCategory}-${pricing.washType}-${index}`}>
                        <TableCell className="font-medium">
                          {pricing.vehicleCategory}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getWashTypeBadge(pricing.washType)} flex items-center gap-1 w-fit`}
                          >
                            {getWashTypeIcon(pricing.washType)}
                            {pricing.washType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatPrice(pricing.memberPrice)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(pricing.nonMemberPrice)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {memberDiscount.toFixed(0)}% off
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-600">
                            vs subscription: ↑ {((pricing.memberPrice / 26) * 100).toFixed(0)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
              </div>
            </div>
          </div>

          {/* Vehicle Category Cards */}
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-lg">Pricing by Vehicle Category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {Object.entries(groupedPricing).map(([category, pricingList]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-base">{category}</CardTitle>
                    <CardDescription>
                      {pricingList.length} wash type options
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pricingList.map((pricing, idx) => (
                        <div
                          key={`${category}-${pricing.washType}-${idx}`}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            {getWashTypeIcon(pricing.washType)}
                            <div>
                              <div className="text-sm font-medium">
                                {pricing.washType} Wash
                              </div>
                              <div className="text-xs text-gray-600">
                                Member saves{" "}
                                {formatPrice(
                                  pricing.nonMemberPrice - pricing.memberPrice
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-green-600">
                              {formatPrice(pricing.memberPrice)}
                            </div>
                            <div className="text-xs text-gray-500 line-through">
                              {formatPrice(pricing.nonMemberPrice)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Pricing Options</CardDescription>
                <CardTitle className="text-2xl">
                  {ONE_TIME_WASH_PRICING.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Vehicle Categories</CardDescription>
                <CardTitle className="text-2xl">
                  {Object.keys(groupedPricing).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Wash Types</CardDescription>
                <CardTitle className="text-2xl">3</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Avg Member Discount</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {(
                    ONE_TIME_WASH_PRICING.reduce(
                      (sum, p) =>
                        sum +
                        ((p.nonMemberPrice - p.memberPrice) /
                          p.nonMemberPrice) *
                          100,
                      0
                    ) / ONE_TIME_WASH_PRICING.length
                  ).toFixed(0)}
                  %
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
