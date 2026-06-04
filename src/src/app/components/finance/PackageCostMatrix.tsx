import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { BackButton } from "../ui/back-button";
import { PieChart, TrendingUp, TrendingDown, Target, Package, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { type VehicleCategory, type PlanType } from "../../data/subscriptionPlans";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import {
  getTotalCostPerWash,
  WORKING_DAYS_PER_MONTH,
  EBITDA_TARGET,
} from "../../data/ebitdaCalculations";
import { ADD_ON_EBITDA_DATA } from "../../data/addOnEBITDA";

interface PackageCostBreakdown {
  package: string;
  materialCost: number;
  consumableCost: number;
  manpowerCost: number;
  overheadCost: number;
  totalCompanyCost: number;
  customerMonthlyPrice: number;
  avgWashesPerMonth: number;
  costPerWashToCustomer: number;
  ebitdaPerWash: number;
  ebitdaPercent: number;
  status: "Above Target" | "Near Target" | "Below Target";
}

export function PackageCostMatrix() {
  const { CURRENT_PLAN_VERSION, VEHICLE_CATEGORIES, PLAN_TYPES, ADD_ON_SERVICES, COMBO_OFFERS } = usePlanDefinitions();

  // Use actual vehicle categories from subscription data - show ALL categories
  const vehicleOptions = VEHICLE_CATEGORIES;

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCategory>("Hatchback / Compact Sedan");
  const [activeTab, setActiveTab] = useState("subscriptions");
  const targetEBITDA = EBITDA_TARGET * 100; // Convert to percentage

  // Get real data from centralized EBITDA calculations
  const getPackageCostBreakdown = (vehicleCategory: VehicleCategory): PackageCostBreakdown[] => {
    const allPackages = PLAN_TYPES.filter(p => !p.includes("One-Time"));
    const vehicleType = vehicleCategory.includes("2W") ? "2W" : "4W";

    // Filter packages to only include those with actual prices for this vehicle category
    const packages = allPackages.filter((pkg) => {
      const priceValue = CURRENT_PLAN_VERSION.pricingMatrix[vehicleCategory]?.[pkg];
      return typeof priceValue === "number" && priceValue > 0;
    });

    return packages.map((pkg) => {
      // Get cost breakdown from centralized system
      const costBreakdown = getTotalCostPerWash(pkg, vehicleType, false);

      const totalCompanyCost = costBreakdown.total;

      // Get customer price from pricing matrix
      const priceValue = CURRENT_PLAN_VERSION.pricingMatrix[vehicleCategory]?.[pkg];
      const customerMonthlyPrice = typeof priceValue === "number" ? priceValue : 0;

      const avgWashesPerMonth = WORKING_DAYS_PER_MONTH;
      const costPerWashToCustomer = customerMonthlyPrice / avgWashesPerMonth;

      const ebitdaPerWash = costPerWashToCustomer - totalCompanyCost;
      const ebitdaPercent = customerMonthlyPrice > 0
        ? (ebitdaPerWash / costPerWashToCustomer) * 100
        : 0;

      let status: "Above Target" | "Near Target" | "Below Target";
      if (ebitdaPercent >= targetEBITDA) {
        status = "Above Target";
      } else if (ebitdaPercent >= targetEBITDA - 5) {
        status = "Near Target";
      } else {
        status = "Below Target";
      }

      return {
        package: pkg,
        materialCost: costBreakdown.cloth,
        consumableCost: costBreakdown.consumables,
        manpowerCost: costBreakdown.labour,
        overheadCost: costBreakdown.equipment + costBreakdown.laundry + costBreakdown.fixedOverhead,
        totalCompanyCost,
        customerMonthlyPrice,
        avgWashesPerMonth,
        costPerWashToCustomer,
        ebitdaPerWash,
        ebitdaPercent,
        status,
      };
    });
  };

  const packageCosts = getPackageCostBreakdown(selectedVehicle);

  const getMarginStatus = (
    actualMargin: number,
    targetMargin: number
  ): { color: string; icon: JSX.Element; label: string } => {
    if (actualMargin >= targetMargin) {
      return {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: <TrendingUp className="w-3 h-3" />,
        label: "Above Target",
      };
    } else if (actualMargin >= targetMargin - 5) {
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: <Target className="w-3 h-3" />,
        label: "Near Target",
      };
    } else {
      return {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: <TrendingDown className="w-3 h-3" />,
        label: "Below Target",
      };
    }
  };

  return (
    <div className="space-y-6">
      <BackButton to="/finance" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PieChart className="w-7 h-7 text-purple-600" />
            Package-Wise Cost Matrix
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Auto-generated cost breakdown and profitability analysis per package
          </p>
        </div>
      </div>

      {/* Vehicle Category Selector */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-purple-900">Vehicle Category</div>
              <div className="text-xs text-purple-700 mt-0.5">
                Select a category to view pricing and profitability
              </div>
            </div>
            <Select 
              value={selectedVehicle} 
              onValueChange={(value) => setSelectedVehicle(value as VehicleCategory)}
            >
              <SelectTrigger className="w-64 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vehicleOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different product types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Subscription Plans
          </TabsTrigger>
          <TabsTrigger value="addons" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Add-On Services
          </TabsTrigger>
          <TabsTrigger value="combos" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Combo Offers
          </TabsTrigger>
        </TabsList>

        {/* Subscription Plans Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost & Profitability Matrix — {selectedVehicle}</CardTitle>
            </CardHeader>
            <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Package</TableHead>
                  <TableHead className="text-right">Material Cost</TableHead>
                  <TableHead className="text-right">Consumable Cost</TableHead>
                  <TableHead className="text-right">Manpower Cost</TableHead>
                  <TableHead className="text-right">Overhead Cost</TableHead>
                  <TableHead className="text-right font-bold">
                    Total Company Cost
                  </TableHead>
                  <TableHead className="text-right">Customer Price/Month</TableHead>
                  <TableHead className="text-right">Washes/Month</TableHead>
                  <TableHead className="text-right">Customer Cost/Wash</TableHead>
                  <TableHead className="text-right">EBITDA/Wash</TableHead>
                  <TableHead className="text-right">EBITDA %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packageCosts.map((pkg) => {
                  const status = getMarginStatus(pkg.ebitdaPercent, targetEBITDA);
                  return (
                    <TableRow key={pkg.package}>
                      <TableCell className="font-bold">{pkg.package}</TableCell>
                      <TableCell className="text-right text-blue-600">
                        ₹{(pkg?.materialCost ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-cyan-600">
                        ₹{(pkg?.consumableCost ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ₹{(pkg?.manpowerCost ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        ₹{(pkg?.overheadCost ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900 bg-gray-50">
                        ₹{(pkg?.totalCompanyCost ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{(pkg?.customerMonthlyPrice ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{pkg.avgWashesPerMonth}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{(pkg?.costPerWashToCustomer ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-700">
                        ₹{(pkg?.ebitdaPerWash ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-bold text-lg ${
                            pkg.ebitdaPercent >= targetEBITDA
                              ? "text-green-600"
                              : pkg.ebitdaPercent >= targetEBITDA - 5
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {(pkg?.ebitdaPercent ?? 0).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
                          {status.icon}
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="text-xs text-green-700 mb-1">Most Profitable</div>
            <div className="font-bold text-lg text-green-900">
              {
                packageCosts.reduce((max, pkg) =>
                  pkg.ebitdaPercent > max.ebitdaPercent ? pkg : max
                ).package
              }
            </div>
            <div className="text-sm text-green-700">
              {packageCosts
                .reduce((max, pkg) =>
                  pkg.ebitdaPercent > max.ebitdaPercent ? pkg : max
                )
                .ebitdaPercent.toFixed(1)}
              % EBITDA
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-xs text-red-700 mb-1">Least Profitable</div>
            <div className="font-bold text-lg text-red-900">
              {
                packageCosts.reduce((min, pkg) =>
                  pkg.ebitdaPercent < min.ebitdaPercent ? pkg : min
                ).package
              }
            </div>
            <div className="text-sm text-red-700">
              {packageCosts
                .reduce((min, pkg) =>
                  pkg.ebitdaPercent < min.ebitdaPercent ? pkg : min
                )
                .ebitdaPercent.toFixed(1)}
              % EBITDA
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="text-xs text-blue-700 mb-1">Avg Company Cost</div>
            <div className="font-bold text-lg text-blue-900">
              ₹
              {(
                packageCosts.reduce((sum, pkg) => sum + pkg.totalCompanyCost, 0) /
                packageCosts.length
              ).toFixed(2)}
            </div>
            <div className="text-sm text-blue-700">per wash</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="text-xs text-purple-700 mb-1">Avg EBITDA Margin</div>
            <div className="font-bold text-lg text-purple-900">
              {(
                packageCosts.reduce((sum, pkg) => sum + pkg.ebitdaPercent, 0) /
                packageCosts.length
              ).toFixed(1)}
              %
            </div>
            <div className="text-sm text-purple-700">
              Target: {targetEBITDA}%
            </div>
          </CardContent>
        </Card>
      </div>

          {/* Info Panel */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-sm text-gray-700">
              <div className="font-semibold text-blue-900 mb-2">
                💡 How to use this matrix:
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  <strong>Real-time sync:</strong> All costs are calculated from Cost Configuration master data
                </li>
                <li>
                  <strong>Customer prices:</strong> Pulled from active subscription plans (V2)
                </li>
                <li>
                  <strong>EBITDA %:</strong> (Customer Price - Company Cost) ÷ Customer Price × 100
                </li>
                <li>
                  <strong>Green status:</strong> Package meets or exceeds {targetEBITDA.toFixed(0)}% target
                </li>
                <li>
                  <strong>Vehicle selector:</strong> See how different categories affect profitability
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add-On Services Tab */}
        <TabsContent value="addons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add-On Services Profitability</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Price (4W)</TableHead>
                    <TableHead className="text-right">Cost (4W)</TableHead>
                    <TableHead className="text-right">EBITDA (4W)</TableHead>
                    <TableHead className="text-right">EBITDA %</TableHead>
                    <TableHead className="text-right">Price (2W)</TableHead>
                    <TableHead className="text-right">EBITDA %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ADD_ON_SERVICES.map((addon) => {
                    const ebitdaData = ADD_ON_EBITDA_DATA.find(e => e.id === addon.id);
                    const margin4W = ebitdaData?.ebitdaPercentage4W
                      ? ebitdaData.ebitdaPercentage4W * 100
                      : addon.estimatedMargin;
                    const margin2W = ebitdaData?.ebitdaPercentage2W
                      ? ebitdaData.ebitdaPercentage2W * 100
                      : addon.estimatedMargin;

                    return (
                      <TableRow key={addon.id}>
                        <TableCell className="font-bold">{addon.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{addon.description}</TableCell>
                        <TableCell className="text-right">
                          {addon.pricing["4W"] === "NA" ? "NA" : `₹${addon.pricing["4W"]}`}
                        </TableCell>
                        <TableCell className="text-right">
                          {ebitdaData?.directCost4W ? `₹${ebitdaData.directCost4W}` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-700">
                          {ebitdaData?.ebitdaAmount4W ? `₹${ebitdaData.ebitdaAmount4W}` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-lg text-green-600">
                            {margin4W.toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {addon.pricing["2W"] === "NA" ? "NA" : `₹${addon.pricing["2W"]}`}
                        </TableCell>
                        <TableCell className="text-right">
                          {addon.pricing["2W"] !== "NA" && (
                            <span className="font-bold text-lg text-green-600">
                              {margin2W.toFixed(0)}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {addon.isActive ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add-ons summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="text-xs text-green-700 mb-1">Active Add-Ons</div>
                <div className="font-bold text-lg text-green-900">
                  {ADD_ON_SERVICES.filter(a => a.isActive).length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="text-xs text-blue-700 mb-1">Avg EBITDA Margin</div>
                <div className="font-bold text-lg text-blue-900">
                  {(ADD_ON_EBITDA_DATA.reduce((sum, item) => sum + item.ebitdaPercentage4W * 100, 0) / ADD_ON_EBITDA_DATA.length).toFixed(0)}%
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="text-xs text-purple-700 mb-1">Margin Range</div>
                <div className="font-bold text-lg text-purple-900">74-80%</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Combo Offers Tab */}
        <TabsContent value="combos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Combo Offers Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Combo Name</TableHead>
                    <TableHead>What's Included</TableHead>
                    <TableHead className="text-right">Normal Price</TableHead>
                    <TableHead className="text-right">Combo Price</TableHead>
                    <TableHead className="text-right">Savings</TableHead>
                    <TableHead className="text-right">Discount %</TableHead>
                    <TableHead>Valid For</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMBO_OFFERS.map((combo) => {
                    const vehicle1 = combo.planCombination.vehicle1;
                    const vehicle2 = combo.planCombination.vehicle2;

                    let description = "";
                    if (combo.id === "combo-003" || combo.id === "combo-004") {
                      description = combo.description;
                    } else if (vehicle2) {
                      description = `${vehicle1.plan} (${vehicle1.category}) + ${vehicle2.plan} (${vehicle2.category})`;
                    } else {
                      description = combo.description;
                    }

                    return (
                      <TableRow key={combo.id}>
                        <TableCell className="font-bold">{combo.name}</TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs">{description}</TableCell>
                        <TableCell className="text-right">₹{(combo?.totalIndividualPrice ?? 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          ₹{(combo?.comboPrice ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ₹{(combo?.savings ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                            {combo.savingsPercentage}% off
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {combo.id === "combo-001" ? "Same address" :
                           combo.id === "combo-002" ? "Same household" :
                           combo.id === "combo-003" ? "Hatchback/Sedan" :
                           combo.id === "combo-004" ? "SUV/MUV" :
                           combo.id === "combo-005" ? "5+ vehicles" :
                           "Corporate fleet"}
                        </TableCell>
                        <TableCell>
                          {combo.isActive ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Combos summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="text-xs text-green-700 mb-1">Active Combos</div>
                <div className="font-bold text-lg text-green-900">
                  {COMBO_OFFERS.filter(c => c.isActive).length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="text-xs text-blue-700 mb-1">Avg Discount</div>
                <div className="font-bold text-lg text-blue-900">
                  {(COMBO_OFFERS.reduce((sum, c) => sum + c.savingsPercentage, 0) / COMBO_OFFERS.length).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="text-xs text-purple-700 mb-1">Total Monthly Value</div>
                <div className="font-bold text-lg text-purple-900">
                  ₹{COMBO_OFFERS.reduce((sum, c) => sum + c.comboPrice, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
