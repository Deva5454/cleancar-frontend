/**
 * Cost Per Wash Calculator - Customer Price View
 * Customer-facing cost analysis with EBITDA target pricing and price simulation
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Target,
  Package,
  User,
  Calendar,
  MapPin,
  Building,
  Info,
  Save,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  CURRENT_PLAN_VERSION,
  type VehicleCategory,
  type PlanType,
} from "../../data/subscriptionPlans";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import {
  getTotalCostPerWash,
  getMonthlyCost,
  calculateEBITDA as calcEBITDA,
  getPriceForTargetEBITDA,
  WORKING_DAYS_PER_MONTH,
  EBITDA_TARGET,
} from "../../data/ebitdaCalculations";

export function CostPerWashCustomer() {
  // Use dynamic subscription plans from context
  const { planTypes, vehicleCategories } = usePlanDefinitions();

  // Input filters
  const [selectedPackage, setSelectedPackage] = useState<PlanType>("Shampoo Wash");
  const [selectedVehicleCategory, setSelectedVehicleCategory] =
    useState<VehicleCategory>("Hatchback / Compact Sedan");
  const [selectedWasher, setSelectedWasher] = useState<string>("Average");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("This Month");
  const [selectedZones, setSelectedZones] = useState<string[]>(["All Zones"]);
  const [selectedCities, setSelectedCities] = useState<string[]>(["All Cities"]);

  // EBITDA and simulation state
  const [targetEBITDA, setTargetEBITDA] = useState(EBITDA_TARGET * 100); // 35% default
  const [calculated, setCalculated] = useState(false);
  const [withIncentive, setWithIncentive] = useState(false);
  const [simulatedPrice, setSimulatedPrice] = useState<number>(0);
  const [simulatedCategory, setSimulatedCategory] =
    useState<VehicleCategory>("Hatchback / Compact Sedan");

  // Mock data
  const washers = [
    "Average",
    "Rajesh Kumar (WR-001)",
    "Suresh Yadav (WR-002)",
    "Ramesh Singh (WR-003)",
    "Vijay Sharma (WR-004)",
    "Anil Verma (WR-005)",
  ];

  const zones = [
    "All Zones",
    "Adajan (395001)",
    "Althan (395005)",
    "Vesu (395007)",
    "Bandra (400001)",
    "Navrangpura (380001)",
  ];

  const cities = ["All Cities", "Surat", "Mumbai", "Ahmedabad"];

  const periods = [
    "This Month",
    "Last Month",
    "Last 3 Months",
    "Last 6 Months",
    "Custom Date Range",
  ];

  // Determine vehicle type from selected category
  const vehicleType = selectedVehicleCategory.includes("2W") ? "2W" : "4W";

  // Calculate company cost per wash using centralized EBITDA system
  const companyCostBreakdown = getTotalCostPerWash(
    selectedPackage,
    vehicleType,
    withIncentive
  );
  const companyCost = companyCostBreakdown.total;

  // Get washes per month (all subscription plans = 26 washes)
  const washesPerMonth = WORKING_DAYS_PER_MONTH;

  // Calculate required price to achieve target EBITDA
  const monthlyCost = getMonthlyCost(companyCost);
  const requiredMonthlyPrice = getPriceForTargetEBITDA(monthlyCost, targetEBITDA / 100);
  const requiredPricePerWash = requiredMonthlyPrice / washesPerMonth;

  // Get actual vs required comparison for all vehicle categories
  const getComparisonData = () => {
    return vehicleCategories.map((category) => {
      const actualMonthlyPrice =
        CURRENT_PLAN_VERSION.pricingMatrix[category][selectedPackage];
      const actualPricePerWash =
        typeof actualMonthlyPrice === "number"
          ? actualMonthlyPrice / washesPerMonth
          : 0;

      const difference = actualPricePerWash - requiredPricePerWash;
      const actualEBITDA =
        actualPricePerWash > 0
          ? ((actualPricePerWash - companyCost) / actualPricePerWash) * 100
          : 0;

      let status: "above" | "near" | "below" = "above";
      if (actualEBITDA < targetEBITDA - 5) {
        status = "below";
      } else if (actualEBITDA < targetEBITDA) {
        status = "near";
      }

      return {
        category,
        actualMonthlyPrice:
          typeof actualMonthlyPrice === "number" ? actualMonthlyPrice : 0,
        actualPricePerWash,
        requiredPricePerWash,
        difference,
        actualEBITDA,
        targetEBITDA,
        status,
      };
    });
  };

  // Generate recommended actions
  const getRecommendedActions = () => {
    const comparisonData = getComparisonData();
    const belowTarget = comparisonData.filter((d) => d.status === "below");

    if (belowTarget.length > 0) {
      return belowTarget.map((item) => ({
        type: "warning" as const,
        message: `Consider revising pricing for ${item.category} — current EBITDA ${(item?.actualEBITDA ?? 0).toFixed(1)}% is below ${targetEBITDA}% target. Suggested price: ₹${(item.requiredPricePerWash * washesPerMonth).toFixed(0)}/month.`,
      }));
    }

    return [
      {
        type: "success" as const,
        message: `All vehicle categories for ${selectedPackage} are meeting the ${targetEBITDA}% EBITDA target. Current pricing is healthy.`,
      },
    ];
  };

  // Calculate simulation data
  const getSimulationData = () => {
    const currentMonthlyPrice =
      CURRENT_PLAN_VERSION.pricingMatrix[simulatedCategory][selectedPackage];
    const currentPrice =
      typeof currentMonthlyPrice === "number" ? currentMonthlyPrice : 0;

    const newPricePerWash = simulatedPrice / washesPerMonth;
    const newEBITDA =
      simulatedPrice > 0
        ? ((newPricePerWash - companyCost) / newPricePerWash) * 100
        : 0;

    // Mock: 50 active customers in this category + package
    const activeCustomers = 50;
    const currentRevenue = currentPrice * activeCustomers;
    const newRevenue = simulatedPrice * activeCustomers;
    const revenueDifference = newRevenue - currentRevenue;
    const annualImpact = revenueDifference * 12;

    return {
      currentPrice,
      newEBITDA,
      currentRevenue,
      newRevenue,
      revenueDifference,
      annualImpact,
      activeCustomers,
    };
  };

  const handleCalculate = () => {
    setCalculated(true);
    const actualPrice =
      CURRENT_PLAN_VERSION.pricingMatrix[selectedVehicleCategory][
        selectedPackage
      ];
    setSimulatedPrice(typeof actualPrice === "number" ? actualPrice : 0);
    setSimulatedCategory(selectedVehicleCategory);
    toast.success("Customer pricing calculated", {
      description: `Analysis for ${selectedPackage} - ${selectedVehicleCategory}`,
    });
  };

  const handleSaveProposedPrice = () => {
    toast.success("Proposed price saved", {
      description: `Pending approval in Plan Management for ${simulatedCategory}`,
    });
  };

  const comparisonData = getComparisonData();
  const recommendedActions = getRecommendedActions();
  const simulationData = getSimulationData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Input Panel - Left 40% */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calculator className="w-5 h-5" />
              Customer Price Inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Package Selector */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-600" />
                Package
              </Label>
              <Select
                value={selectedPackage}
                onValueChange={(value) => setSelectedPackage(value as PlanType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {planTypes.map((pkg) => (
                    <SelectItem key={pkg} value={pkg}>
                      {pkg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Category Selector */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-purple-600" />
                Vehicle Category
              </Label>
              <Select
                value={selectedVehicleCategory}
                onValueChange={(value) =>
                  setSelectedVehicleCategory(value as VehicleCategory)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vehicleCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Washer Selector */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-green-600" />
                Washer
              </Label>
              <Select value={selectedWasher} onValueChange={setSelectedWasher}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {washers.map((washer) => (
                    <SelectItem key={washer} value={washer}>
                      {washer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Period Selector */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                Time Period
              </Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PIN Code Zone Filter */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-red-600" />
                PIN Code Zone
              </Label>
              <Select
                value={selectedZones[0]}
                onValueChange={(value) => setSelectedZones([value])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City Filter */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-indigo-600" />
                City
              </Label>
              <Select
                value={selectedCities[0]}
                onValueChange={(value) => setSelectedCities([value])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculate Button */}
            <Button
              onClick={handleCalculate}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Calculate Customer Pricing
            </Button>
          </CardContent>
        </Card>

        {/* Filter Info Card */}
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-600 mt-0.5" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Customer Price Analysis:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Shows EBITDA-based pricing for all vehicle categories</li>
                  <li>Editable target EBITDA for instant "what if" analysis</li>
                  <li>Price simulation with revenue impact calculations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Panel - Right 60% */}
      <div className="lg:col-span-3 space-y-4">
        {!calculated ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                No Results Yet
              </h3>
              <p className="text-sm text-gray-400">
                Select your filters and click "Calculate Customer Pricing" to view
                results
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Section 1 - Cost Foundation */}
            <Card className="border-teal-200 bg-teal-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-900">
                  <DollarSign className="w-5 h-5" />
                  Section 1 — Cost Foundation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-sm text-teal-700 mb-2">
                    Total Company Cost per Wash
                  </div>
                  <div className="text-4xl font-bold text-teal-900">
                    ₹{companyCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-teal-600 mt-2">
                    Based on selected package and filters
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2 - EBITDA Target Pricing */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Section 2 — EBITDA Target Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Editable Target EBITDA */}
                <div>
                  <Label className="mb-2 block">
                    Target EBITDA Margin (% - Edit for "What If" Analysis)
                  </Label>
                  <Input
                    type="number"
                    value={targetEBITDA}
                    onChange={(e) => setTargetEBITDA(parseFloat(e.target.value) || 60)}
                    className="text-lg font-bold"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Changing this value instantly recalculates all figures below
                  </p>
                </div>

                {/* Required Pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="text-xs text-blue-600 mb-1">
                        Required Price per Wash
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        ₹{requiredPricePerWash.toFixed(2)}
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        To achieve {targetEBITDA}% EBITDA
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="text-xs text-green-600 mb-1">
                        Required Monthly Price
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        ₹{requiredMonthlyPrice.toFixed(0)}
                      </div>
                      <div className="text-xs text-green-700 mt-1">
                        {washesPerMonth} washes/month
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="text-xs text-purple-600 mb-1">
                        Formula Applied
                      </div>
                      <div className="text-sm font-bold text-purple-900">
                        Cost ÷ (1 − {(targetEBITDA / 100).toFixed(2)})
                      </div>
                      <div className="text-xs text-purple-700 mt-1">
                        = ₹{companyCost.toFixed(2)} ÷{" "}
                        {(1 - targetEBITDA / 100).toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Section 3 - Actual vs Required Comparison */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Section 3 — Actual vs Required Comparison (All Vehicle
                  Categories)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle Category</TableHead>
                        <TableHead className="text-right">
                          Actual Price/Wash
                        </TableHead>
                        <TableHead className="text-right">
                          Required Price/Wash
                        </TableHead>
                        <TableHead className="text-right">Difference</TableHead>
                        <TableHead className="text-right">
                          Actual EBITDA %
                        </TableHead>
                        <TableHead className="text-right">
                          Target EBITDA %
                        </TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonData.map((item) => (
                        <TableRow key={item.category}>
                          <TableCell className="font-medium">
                            {item.category}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{(item?.actualPricePerWash ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{(item?.requiredPricePerWash ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              item.difference >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {item.difference >= 0 ? "+" : ""}₹
                            {(item?.difference ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {(item?.actualEBITDA ?? 0).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {item.targetEBITDA}%
                          </TableCell>
                          <TableCell>
                            {item.status === "above" && (
                              <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                <CheckCircle className="w-3 h-3" />
                                Above Target
                              </Badge>
                            )}
                            {item.status === "near" && (
                              <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                                <AlertCircle className="w-3 h-3" />
                                Near Target
                              </Badge>
                            )}
                            {item.status === "below" && (
                              <Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                                <TrendingDown className="w-3 h-3" />
                                Below Target
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Section 4 - Recommended Actions */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-orange-600" />
                  Section 4 — Recommended Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendedActions.map((action, idx) => (
                  <Card
                    key={idx}
                    className={
                      action.type === "warning"
                        ? "border-amber-200 bg-amber-50"
                        : "border-green-200 bg-green-50"
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        {action.type === "warning" ? (
                          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        )}
                        <p
                          className={`text-sm ${
                            action.type === "warning"
                              ? "text-amber-900"
                              : "text-green-900"
                          }`}
                        >
                          {action.message}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Section 5 - Simulate Price Change */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-green-600" />
                  Section 5 — Simulate Price Change
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="mb-2 block">Vehicle Category</Label>
                    <Select
                      value={simulatedCategory}
                      onValueChange={(value) =>
                        setSimulatedCategory(value as VehicleCategory)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block">New Monthly Price (₹)</Label>
                    <Input
                      type="number"
                      value={simulatedPrice}
                      onChange={(e) =>
                        setSimulatedPrice(parseFloat(e.target.value) || 0)
                      }
                      className="text-lg font-bold"
                      min="0"
                    />
                  </div>
                </div>

                {/* Real-time Simulation Results */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="text-xs text-blue-600 mb-1">
                        New EBITDA Margin
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {(simulationData?.newEBITDA ?? 0).toFixed(1)}%
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        {simulationData.newEBITDA >= targetEBITDA
                          ? "✓ Meets target"
                          : "⚠ Below target"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="text-xs text-purple-600 mb-1">
                        Active Customers
                      </div>
                      <div className="text-2xl font-bold text-purple-900">
                        {simulationData.activeCustomers}
                      </div>
                      <div className="text-xs text-purple-700 mt-1">
                        In this category + package
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <div className="text-xs text-green-600 mb-1">
                          Current Revenue/Month
                        </div>
                        <div className="text-lg font-bold text-green-900">
                          ₹{(simulationData?.currentRevenue ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-green-600 mb-1">
                          New Revenue/Month
                        </div>
                        <div className="text-lg font-bold text-green-900">
                          ₹{(simulationData?.newRevenue ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-green-600 mb-1">
                          Difference
                        </div>
                        <div
                          className={`text-lg font-bold flex items-center gap-1 ${
                            simulationData.revenueDifference >= 0
                              ? "text-green-900"
                              : "text-red-900"
                          }`}
                        >
                          {simulationData.revenueDifference >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {simulationData.revenueDifference >= 0 ? "+" : ""}₹
                          {Math.abs(
                            simulationData.revenueDifference
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="text-xs text-orange-600 mb-1">
                      Annual Revenue Impact
                    </div>
                    <div
                      className={`text-3xl font-bold ${
                        simulationData.annualImpact >= 0
                          ? "text-orange-900"
                          : "text-red-900"
                      }`}
                    >
                      {simulationData.annualImpact >= 0 ? "+" : ""}₹
                      {Math.abs(simulationData.annualImpact).toLocaleString()}
                    </div>
                    <div className="text-xs text-orange-700 mt-1">
                      Based on {simulationData.activeCustomers} customers × 12
                      months
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <Button
                  onClick={handleSaveProposedPrice}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save as Proposed Price
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Saved price will be pending approval in Plan Management. Does not
                  go live until Admin/SA approves and schedules it.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
