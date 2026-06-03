import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  DollarSign,
  Lightbulb,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { type VehicleCategory, type PlanType, CURRENT_PLAN_VERSION } from "../../data/subscriptionPlans";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import {
  getTotalCostPerWash,
  getMonthlyCost,
  calculateEBITDA as calcEBITDA,
  getPriceForTargetEBITDA,
  WORKING_DAYS_PER_MONTH,
  EBITDA_ASPIRATIONAL,
} from "../../data/ebitdaCalculations";

interface VehiclePricing {
  category: string;
  actualPricePerWash: number;
  requiredPricePerWash: number;
  difference: number;
  actualEBITDA: number;
  targetEBITDA: number;
  status: "Above Target" | "Near Target" | "Below Target";
}

export function CustomerPriceCalculator() {
  // Use dynamic subscription plans from context
  const { planTypes, vehicleCategories } = usePlanDefinitions();

  const [selectedPackage, setSelectedPackage] = useState("Shampoo Wash");
  const [targetEBITDA, setTargetEBITDA] = useState(EBITDA_ASPIRATIONAL * 100); // 60% default
  const [withIncentive, setWithIncentive] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Simulation state
  const [simNewPrice, setSimNewPrice] = useState("");
  const [simVehicleCategory, setSimVehicleCategory] = useState("Hatchback / Compact Sedan");

  const calculatePrice = () => {
    // Assume 4W for average calculation (can be made configurable)
    const vehicleType = "4W";

    // Use centralized EBITDA calculation system
    const costBreakdown = getTotalCostPerWash(
      selectedPackage,
      vehicleType,
      withIncentive
    );
    const companyCostPerWash = costBreakdown.total;
    const monthlyCost = getMonthlyCost(companyCostPerWash);
    const requiredMonthlyPrice = getPriceForTargetEBITDA(monthlyCost, targetEBITDA / 100);
    const requiredPriceForTarget = requiredMonthlyPrice / WORKING_DAYS_PER_MONTH;

    const avgWashesPerMonth = WORKING_DAYS_PER_MONTH;

    const vehiclePricing: VehiclePricing[] = vehicleCategories.map((category) => {
      const monthlyPrice = CURRENT_PLAN_VERSION.pricingMatrix[category][selectedPackage];
      const actualPrice = typeof monthlyPrice === "number" ? monthlyPrice : 0;
      const pricePerWash = actualPrice / WORKING_DAYS_PER_MONTH;

      const ebitdaCalc = calcEBITDA(actualPrice, monthlyCost);
      const ebitdaPercent = ebitdaCalc.ebitdaPercentage * 100; // Convert to percentage

      let status: "Above Target" | "Near Target" | "Below Target";
      if (ebitdaPercent >= targetEBITDA) {
        status = "Above Target";
      } else if (ebitdaPercent >= targetEBITDA - 5) {
        status = "Near Target";
      } else {
        status = "Below Target";
      }

      return {
        category,
        actualPricePerWash: pricePerWash,
        requiredPricePerWash: requiredPriceForTarget,
        difference: pricePerWash - requiredPriceForTarget,
        actualEBITDA: ebitdaPercent,
        targetEBITDA: targetEBITDA,
        status,
      };
    });

    setResult({
      companyCostPerWash,
      requiredPricePerWash: requiredPriceForTarget,
      requiredMonthlyPrice,
      vehiclePricing,
      avgWashesPerMonth,
    });

    toast.success("Pricing analysis completed");
  };

  const simulateNewPrice = () => {
    if (!simNewPrice || !result) return;

    const newMonthlyPrice = parseFloat(simNewPrice);
    const newPricePerWash = newMonthlyPrice / result.avgWashesPerMonth;
    const newEBITDA =
      ((newPricePerWash - result.companyCostPerWash) / newPricePerWash) * 100;

    // Assuming 150 active customers for this package+vehicle combo
    const activeCustomers = 150;
    const currentMonthlyRevenue = 1499 * activeCustomers; // Example current price
    const newMonthlyRevenue = newMonthlyPrice * activeCustomers;
    const revenueImpact = newMonthlyRevenue - currentMonthlyRevenue;
    const annualImpact = revenueImpact * 12;

    toast.success(
      <div className="text-xs">
        <div className="font-bold mb-1">Simulation Results:</div>
        <div>New EBITDA: {newEBITDA.toFixed(1)}%</div>
        <div>Revenue Impact: ₹{revenueImpact.toLocaleString()}/month</div>
        <div>Annual Impact: ₹{annualImpact.toLocaleString()}</div>
      </div>,
      { duration: 5000 }
    );
  };

  const saveProposedPrice = () => {
    toast.success("Proposed price saved", {
      description: "Pending admin approval in Plan Management",
    });
  };

  const getRecommendation = () => {
    if (!result) return "";

    const belowTarget = result.vehiclePricing.filter(
      (v: VehiclePricing) => v.status === "Below Target"
    );
    const aboveTarget = result.vehiclePricing.filter(
      (v: VehiclePricing) => v.status === "Above Target"
    );

    if (belowTarget.length > 0) {
      const worst = belowTarget.reduce((min: VehiclePricing, v: VehiclePricing) =>
        v.actualEBITDA < min.actualEBITDA ? v : min
      );
      return `Consider revising pricing for ${worst.category} — current EBITDA ${worst.actualEBITDA.toFixed(
        1
      )}% is below ${targetEBITDA}% target. Suggested price: ₹${(
        worst.requiredPricePerWash * result.avgWashesPerMonth
      ).toFixed(0)}/month.`;
    }

    if (aboveTarget.length === result.vehiclePricing.length) {
      return `All vehicle categories for ${selectedPackage} are meeting the ${targetEBITDA}% EBITDA target. Current pricing is healthy.`;
    }

    return "Pricing analysis shows mixed results across vehicle categories.";
  };

  return (
    <div className="space-y-6">
      {/* Input Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <Label htmlFor="pkg-select">Package</Label>
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger id="pkg-select" className="mt-1">
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Label htmlFor="ebitda-target">Target EBITDA Margin (%)</Label>
            <Input
              id="ebitda-target"
              type="number"
              value={targetEBITDA}
              onChange={(e) => setTargetEBITDA(parseFloat(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Change to see instant "what-if" analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-end">
            <Button
              onClick={calculatePrice}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Pricing
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <>
          {/* Section 1: Cost Foundation */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm text-blue-900">
                Cost Foundation (from Company Cost)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-xs text-blue-700 mb-1">
                  Total Company Cost per Wash
                </div>
                <div className="text-4xl font-bold text-blue-900">
                  ₹{(result?.companyCostPerWash ?? 0).toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: EBITDA Target Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                EBITDA Target Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-2">Target EBITDA Margin</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {targetEBITDA}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-2">
                    Required Price per Wash
                  </div>
                  <div className="text-3xl font-bold text-teal-600">
                    ₹{(result?.requiredPricePerWash ?? 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-2">
                    Required Monthly Price
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    ₹{(result?.requiredMonthlyPrice ?? 0).toFixed(0)}
                  </div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-600 text-center">
                Formula: Required Price = Company Cost ÷ (1 - {targetEBITDA / 100}) = ₹
                {(result?.companyCostPerWash ?? 0).toFixed(2)} ÷ {1 - targetEBITDA / 100} = ₹
                {(result?.requiredPricePerWash ?? 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Actual vs Required Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Actual vs Required Comparison by Vehicle Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Category</TableHead>
                    <TableHead className="text-right">Actual Price/Wash</TableHead>
                    <TableHead className="text-right">Required Price/Wash</TableHead>
                    <TableHead className="text-right">Difference</TableHead>
                    <TableHead className="text-right">Actual EBITDA %</TableHead>
                    <TableHead className="text-right">Target EBITDA %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.vehiclePricing.map((v: VehiclePricing) => (
                    <TableRow key={v.category}>
                      <TableCell className="font-medium">{v.category}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{(v?.actualPricePerWash ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{(v?.requiredPricePerWash ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold ${
                            v.difference > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {v.difference > 0 ? "+" : ""}₹{(v?.difference ?? 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-bold text-lg ${
                            v.actualEBITDA >= targetEBITDA
                              ? "text-green-600"
                              : v.actualEBITDA >= targetEBITDA - 5
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {(v?.actualEBITDA ?? 0).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {v.targetEBITDA}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            v.status === "Above Target"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : v.status === "Near Target"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : "bg-red-100 text-red-800 border-red-300"
                          }
                        >
                          {v.status === "Above Target" && (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          )}
                          {v.status === "Below Target" && (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {v.status === "Near Target" && (
                            <Target className="w-3 h-3 mr-1" />
                          )}
                          {v.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Section 4: Recommended Action */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-sm text-amber-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Recommended Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-800">{getRecommendation()}</p>
            </CardContent>
          </Card>

          {/* Section 5: Simulate Price Change */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-sm text-purple-900">
                Simulate Price Change
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="sim-price">New Monthly Price (₹)</Label>
                  <Input
                    id="sim-price"
                    type="number"
                    value={simNewPrice}
                    onChange={(e) => setSimNewPrice(e.target.value)}
                    placeholder="e.g. 1799"
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="sim-vehicle">Vehicle Category</Label>
                  <Select
                    value={simVehicleCategory}
                    onValueChange={setSimVehicleCategory}
                  >
                    <SelectTrigger id="sim-vehicle" className="mt-1 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={simulateNewPrice}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Simulate
                  </Button>
                  <Button
                    onClick={saveProposedPrice}
                    variant="outline"
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Proposed
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-white border border-purple-300 rounded text-xs text-gray-700">
                <strong>How it works:</strong> Enter a new monthly price to instantly see
                the impact on EBITDA margin, monthly revenue, and annual revenue. Save as
                "Proposed Price" to submit for approval through Plan Management.
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!result && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-16 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">No Analysis Yet</p>
            <p className="text-sm text-gray-500">
              Select package, set EBITDA target, and click "Calculate Pricing"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}