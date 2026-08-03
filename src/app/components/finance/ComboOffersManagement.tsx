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

  const avgHatchbackPrice = activeOffers.length > 0
    ? activeOffers.reduce((sum, offer) => sum + offer.hatchbackPrice, 0) / activeOffers.length
    : 0;
  const avgSuvPrice = activeOffers.length > 0
    ? activeOffers.reduce((sum, offer) => sum + offer.suvPrice, 0) / activeOffers.length
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
                <CardDescription>Avg Hatchback Price</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {formatPrice(avgHatchbackPrice)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Avg SUV Price</CardDescription>
                <CardTitle className="text-2xl text-blue-600">
                  {formatPrice(avgSuvPrice)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Bundle Types</CardDescription>
                <CardTitle className="text-2xl">
                  {new Set(activeOffers.map((o) => getOfferTypeBadge(o.name).label)).size}
                </CardTitle>
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
                      <TableHead>Hatchback Price</TableHead>
                      <TableHead>SUV Price</TableHead>
                      <TableHead>Saving</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {activeOffers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
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
                          {formatPrice(offer.hatchbackPrice)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(offer.suvPrice)}
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">
                            {offer.saving}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 w-fit"
                          >
                            Active
                          </Badge>
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
                        {offer.saving}
                      </Badge>
                    </div>
                    <CardDescription>{offer.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Pricing by vehicle tier */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium">Hatchback</div>
                        <div className="text-sm font-semibold">
                          {formatPrice(offer.hatchbackPrice)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium">SUV</div>
                        <div className="text-sm font-semibold">
                          {formatPrice(offer.suvPrice)}
                        </div>
                      </div>

                      {/* Pricing Summary */}
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">When to push:</span>
                        </div>
                        <p className="text-xs text-gray-500">{offer.whenToPush}</p>
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
