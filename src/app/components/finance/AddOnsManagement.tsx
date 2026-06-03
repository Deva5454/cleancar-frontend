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
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { type PlanType } from "../../data/subscriptionPlans";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import { Sparkles, Shield, Wrench } from "lucide-react";

export function AddOnsManagement() {
  const { ADD_ON_SERVICES, getAddOnsByCategory, formatPrice } = usePlanDefinitions();
  const [filterCategory, setFilterCategory] = useState<
    "All" | "Cleaning" | "Protection" | "Maintenance"
  >("All");
  const [filterPlan, setFilterPlan] = useState<PlanType | "All">("All");

  const filteredAddOns =
    filterCategory === "All"
      ? ADD_ON_SERVICES.filter((addon) => addon.isActive)
      : getAddOnsByCategory(filterCategory);

  const displayedAddOns =
    filterPlan === "All"
      ? filteredAddOns
      : filteredAddOns.filter((addon) =>
          addon.bestPairedWith.includes(filterPlan)
        );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Cleaning":
        return <Sparkles className="h-4 w-4" />;
      case "Protection":
        return <Shield className="h-4 w-4" />;
      case "Maintenance":
        return <Wrench className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Cleaning":
        return "bg-blue-100 text-blue-800";
      case "Protection":
        return "bg-green-100 text-green-800";
      case "Maintenance":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add-On Services Management</CardTitle>
          <CardDescription>
            Manage optional add-on services that customers can purchase
            alongside their subscription plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">
                Filter by Category
              </label>
              <Select
                value={filterCategory}
                onValueChange={(value: any) => setFilterCategory(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="Cleaning">Cleaning</SelectItem>
                  <SelectItem value="Protection">Protection</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">
                Best Paired With
              </label>
              <Select
                value={filterPlan}
                onValueChange={(value: any) => setFilterPlan(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Plans</SelectItem>
                  <SelectItem value="Water Wash">Water Wash</SelectItem>
                  <SelectItem value="Shampoo Wash">Shampoo Wash</SelectItem>
                  <SelectItem value="Shampoo+Wax">Shampoo+Wax</SelectItem>
                  <SelectItem value="Shampoo+Polish">Shampoo+Polish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add-Ons Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-[900px] sm:min-w-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead>4W Price</TableHead>
                      <TableHead>2W Price</TableHead>
                      <TableHead>Margin %</TableHead>
                      <TableHead>Best Paired With</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {displayedAddOns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No add-on services found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedAddOns.map((addon) => (
                    <TableRow key={addon.id}>
                      <TableCell className="font-medium">
                        {addon.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getCategoryColor(addon.category)} flex items-center gap-1 w-fit`}
                        >
                          {getCategoryIcon(addon.category)}
                          {addon.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs text-sm text-gray-600">
                        {addon.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{addon.billing}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatPrice(addon.pricing["4W"])}
                      </TableCell>
                      <TableCell>
                        {formatPrice(addon.pricing["2W"])}
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">
                          {addon.estimatedMargin}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {addon.bestPairedWith.map((plan) => (
                            <Badge
                              key={plan}
                              variant="secondary"
                              className="text-xs"
                            >
                              {plan}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Add-Ons</CardDescription>
                <CardTitle className="text-2xl">
                  {ADD_ON_SERVICES.filter((a) => a.isActive).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Cleaning Services</CardDescription>
                <CardTitle className="text-2xl">
                  {getAddOnsByCategory("Cleaning").length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Protection Services</CardDescription>
                <CardTitle className="text-2xl">
                  {getAddOnsByCategory("Protection").length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Maintenance Services</CardDescription>
                <CardTitle className="text-2xl">
                  {getAddOnsByCategory("Maintenance").length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
