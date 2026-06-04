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
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import { TrendingDown, Gift, Users, Building2 } from "lucide-react";

export function ComboOffersManagement() {
  const { getActiveComboOffers, formatPrice } = usePlanDefinitions();
  const activeOffers = getActiveComboOffers();

  const getOfferTypeIcon = (name: string) => {
    if (name.includes("Bundle")) return <Gift className="h-4 w-4" />;
    if (name.includes("Society")) return <Building2 className="h-4 w-4" />;
    if (name.includes("Fleet")) return <Users className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const getOfferTypeBadge = (name: string) => {
    if (name.includes("Bundle")) return { label: "Bundle", color: "bg-purple-100 text-purple-800" };
    if (name.includes("Society")) return { label: "Society", color: "bg-blue-100 text-blue-800" };
    if (name.includes("Fleet")) return { label: "Fleet", color: "bg-green-100 text-green-800" };
    return { label: "Premium Pack", color: "bg-orange-100 text-orange-800" };
  };

  const totalSavings = activeOffers.reduce((sum, offer) => sum + offer.savings, 0);
  const avgSavingsPercent = activeOffers.length > 0
    ? activeOffers.reduce((sum, offer) => sum + offer.savingsPercentage, 0) / activeOffers.length
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Combo Offers & Bundle Packages</CardTitle>
          <CardDescription>
            Special pricing for multi-vehicle subscriptions and premium care
            packages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active Combo Offers</CardDescription>
                <CardTitle className="text-2xl">{activeOffers.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Max Savings</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {formatPrice(totalSavings)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Avg Discount %</CardDescription>
                <CardTitle className="text-2xl text-blue-600">
                  {avgSavingsPercent.toFixed(1)}%
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Bundle Types</CardDescription>
                <CardTitle className="text-2xl">4</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Combo Offers Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-[900px] sm:min-w-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Individual Price</TableHead>
                      <TableHead>Combo Price</TableHead>
                      <TableHead>Savings</TableHead>
                      <TableHead>Discount %</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {activeOffers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No combo offers found
                    </TableCell>
                  </TableRow>
                ) : (
                  activeOffers.map((offer) => {
                    const offerType = getOfferTypeBadge(offer.name);
                    return (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getOfferTypeIcon(offer.name)}
                            {offer.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${offerType.color}`}>
                            {offerType.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-gray-600">
                          {offer.description}
                        </TableCell>
                        <TableCell>
                          {formatPrice(offer.totalIndividualPrice)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(offer.comboPrice)}
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">
                            {formatPrice(offer.savings)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {(offer?.savingsPercentage ?? 0).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 w-fit"
                            >
                              Active
                            </Badge>
                            {offer.validUntil && (
                              <span className="text-xs text-gray-500">
                                Until {new Date(offer.validUntil).toLocaleDateString()}
                              </span>
                            )}
                          </div>
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

          {/* Combo Details */}
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-lg">Combo Package Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {activeOffers.map((offer) => (
                <Card key={offer.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{offer.name}</CardTitle>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700"
                      >
                        Save {(offer?.savingsPercentage ?? 0).toFixed(1)}%
                      </Badge>
                    </div>
                    <CardDescription>{offer.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Vehicle 1 */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm font-medium">
                            {offer.planCombination.vehicle1.category}
                          </div>
                          <div className="text-xs text-gray-600">
                            {offer.planCombination.vehicle1.plan}
                          </div>
                        </div>
                        <div className="text-sm font-semibold">
                          {formatPrice(
                            offer.planCombination.vehicle1.individualPrice
                          )}
                        </div>
                      </div>

                      {/* Vehicle 2 (if exists) */}
                      {offer.planCombination.vehicle2 && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium">
                              {offer.planCombination.vehicle2.category}
                            </div>
                            <div className="text-xs text-gray-600">
                              {offer.planCombination.vehicle2.plan}
                            </div>
                          </div>
                          <div className="text-sm font-semibold">
                            {formatPrice(
                              offer.planCombination.vehicle2.individualPrice
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pricing Summary */}
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Individual Total:
                          </span>
                          <span className="line-through text-gray-500">
                            {formatPrice(offer.totalIndividualPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between text-base font-semibold">
                          <span>Combo Price:</span>
                          <span className="text-blue-600">
                            {formatPrice(offer.comboPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">You Save:</span>
                          <span className="text-green-600 font-medium">
                            {formatPrice(offer.savings)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
