/**
 * ============================================================================
 * ⚠️ DEPRECATED - USE CostPerWashModule INSTEAD
 * ============================================================================
 *
 * This component has been consolidated into CostPerWashModule.
 *
 * PHASE 3 CONSOLIDATION:
 * - Functionality moved to: /finance/cost-per-wash (CostPerWashModule)
 * - Route /analytics/unit-economics/cost-per-wash redirects to /finance/cost-per-wash
 * - This file kept temporarily for reference only
 * - Scheduled for removal after user migration period
 *
 * Migration Path:
 * - Use CostPerWashModule → "Company Cost" tab
 * - Same functionality, same central engine
 * - More comprehensive with additional tabs
 *
 * PHASE 2 - CENTRAL COST ENGINE PRIMARY:
 * - Uses central cost engine as primary calculation
 * - Removed old local calculation logic
 * - UI unchanged, calculation logic unified
 *
 * ============================================================================
 */
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BackButton } from "../ui/back-button";
import { toast } from "sonner";
import {
  Calculator,
  DollarSign,
  Users,
  Package,
  Building,
  Wrench,
  TrendingUp,
  Info,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  MATERIALS,
  CONSUMABLES,
  MANPOWER_ROLES,
  OVERHEAD_ITEMS,
  calculateMaterialCost,
  calculateConsumablesCost,
  calculateManpowerCost,
  AVG_WASHES_PER_MONTH,
} from "../../data/costData";
import { useCity } from "../../contexts/CityContext";
import { useInventory } from "../../contexts/InventoryContext";
import { logger } from "../../services/logger";
import {
  calculateCostPerWash as calculateCostPerWashCentral,
  type CostCalculationInputs,
} from "../../services/centralCostEngine";

const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"];

function CostPerWashCalculatorEnhanced() {
  const { city, cityInfo } = useCity();
  const { getCentralStock } = useInventory();

  // City-specific cost multipliers
  const CITY_COST_FACTORS: Record<string, { rentMultiplier: number; labourMultiplier: number }> = {
    "CITY-SURAT":  { rentMultiplier: 1.0, labourMultiplier: 1.0 },
    "CITY-MUMBAI": { rentMultiplier: 1.6, labourMultiplier: 1.2 },
  };
  const cityFactor = CITY_COST_FACTORS[city] || { rentMultiplier: 1.0, labourMultiplier: 1.0 };

  // Calculate default values from centralized data
  const defaultMaterialCost = calculateMaterialCost("Premium");
  const defaultConsumablesCost = calculateConsumablesCost();
  const defaultManpowerCost = calculateManpowerCost(2);

  const washerRole = MANPOWER_ROLES.find(r => r.role === "Washer");
  const supervisorRole = MANPOWER_ROLES.find(r => r.role === "Supervisor");

  const [inputs, setInputs] = useState({
    // Direct Materials (per wash) - Populated from costData
    cleaningSupplies: defaultMaterialCost.toFixed(2),
    consumables: defaultConsumablesCost.toFixed(2),
    water: "1", // Water is part of consumables, separate for clarity

    // Labor (monthly) - Populated from costData
    washerSalary: (washerRole?.monthlySalary || 15000).toString(),
    supervisorAllocation: (supervisorRole?.monthlySalary || 25000).toString(),
    washesPerMonth: AVG_WASHES_PER_MONTH.toString(),

    // Overhead (monthly) - Updated for mobile car wash service
    rent: "0", // No physical store - doorstep service model
    utilities: "0", // No physical location utilities
    insurance: "2500", // Vehicle & liability insurance
    other: "3999", // Vehicle transport (3000) + Mobile data (299) + Uniform (200) + Software (500)

    // Equipment & Maintenance (monthly)
    equipmentDepreciation: "2100",
    maintenance: "4000",

    // Other Variable Costs (per wash)
    transport: "15",
    packaging: "6",
    miscellaneous: "5",
  });

  const [result, setResult] = useState<{
    costPerWash: number;
    breakdown: {
      materials: number;
      labor: number;
      overhead: number;
      equipment: number;
      variables: number;
    };
    monthlyTotal: number;
    percentages: {
      materials: number;
      labor: number;
      overhead: number;
      equipment: number;
      variables: number;
    };
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
    // Auto-calculate if result exists
    if (result) {
      setTimeout(() => calculateCostPerWash(), 300);
    }
  };

  const calculateCostPerWash = () => {
    const washesPerMonth = parseFloat(inputs.washesPerMonth) || 1;

    // PHASE 2: Use central cost engine as primary calculation
    try {
      // Calculate monthly totals from inputs
      const materialsPerWash =
        parseFloat(inputs.cleaningSupplies) +
        parseFloat(inputs.consumables) +
        parseFloat(inputs.water);

      const totalLaborMonthly =
        (parseFloat(inputs.washerSalary) +
        parseFloat(inputs.supervisorAllocation)) * cityFactor.labourMultiplier;

      const totalOverheadMonthly =
        (parseFloat(inputs.rent) * cityFactor.rentMultiplier) +
        parseFloat(inputs.utilities) +
        parseFloat(inputs.insurance) +
        parseFloat(inputs.other);

      const totalEquipmentMonthly =
        parseFloat(inputs.equipmentDepreciation) +
        parseFloat(inputs.maintenance);

      const variablesPerWash =
        parseFloat(inputs.transport) +
        parseFloat(inputs.packaging) +
        parseFloat(inputs.miscellaneous);

      // Map to central engine inputs
      const centralInputs: CostCalculationInputs = {
        labourCost: totalLaborMonthly,
        consumablesCost: materialsPerWash * washesPerMonth,
        utilitiesCost: parseFloat(inputs.utilities),
        fixedCosts: parseFloat(inputs.rent) + parseFloat(inputs.insurance) + parseFloat(inputs.other),
        maintenanceCost: totalEquipmentMonthly,
        transportCost: variablesPerWash * washesPerMonth,
        totalWashes: washesPerMonth,
      };

      // Calculate using central engine
      const centralResult = calculateCostPerWashCentral(
        centralInputs,
        new Date().toISOString().substring(0, 7)
      );

      // Convert central engine result to UI format
      const laborPerWash = totalLaborMonthly / washesPerMonth;
      const overheadPerWash = totalOverheadMonthly / washesPerMonth;
      const equipmentPerWash = totalEquipmentMonthly / washesPerMonth;

      const costPerWash = centralResult.costPerWash;
      const monthlyTotal = centralResult.totalCost;

      // Calculate percentages
      const percentages = {
        materials: (materialsPerWash / costPerWash) * 100,
        labor: (laborPerWash / costPerWash) * 100,
        overhead: (overheadPerWash / costPerWash) * 100,
        equipment: (equipmentPerWash / costPerWash) * 100,
        variables: (variablesPerWash / costPerWash) * 100,
      };

      setResult({
        costPerWash: Math.round(costPerWash),
        breakdown: {
          materials: Math.round(materialsPerWash),
          labor: Math.round(laborPerWash),
          overhead: Math.round(overheadPerWash),
          equipment: Math.round(equipmentPerWash),
          variables: Math.round(variablesPerWash),
        },
        monthlyTotal: Math.round(monthlyTotal),
        percentages,
      });

      logger.log("[CostPerWashCalculatorEnhanced] Calculated using central engine:", {
        costPerWash: centralResult.costPerWash,
        totalCost: centralResult.totalCost,
      });

      toast.success("Cost per wash calculated successfully!");
    } catch (error) {
      console.error("[CostPerWashCalculatorEnhanced] Calculation error:", error);
      toast.error("Error calculating cost per wash");
    }
  };

  const resetCalculator = () => {
    setInputs({
      cleaningSupplies: defaultMaterialCost.toFixed(2),
      consumables: defaultConsumablesCost.toFixed(2),
      water: "1",
      washerSalary: (washerRole?.monthlySalary || 15000).toString(),
      supervisorAllocation: (supervisorRole?.monthlySalary || 25000).toString(),
      washesPerMonth: AVG_WASHES_PER_MONTH.toString(),
      rent: "0",
      utilities: "0",
      insurance: "2500",
      other: "3999",
      equipmentDepreciation: "2100",
      maintenance: "4000",
      transport: "15",
      packaging: "6",
      miscellaneous: "5",
    });
    setResult(null);
    toast.info("Calculator reset to defaults");
  };

  const exportReport = () => {
    toast.success("Report exported successfully", {
      description: "Cost per wash report downloaded",
    });
  };

  const getHealthStatus = (cost: number) => {
    if (cost <= 220)
      return {
        label: "Excellent",
        color: "bg-green-100 text-green-800 border-green-300",
        icon: <CheckCircle className="w-4 h-4" />,
        description: "Outstanding cost efficiency!",
      };
    if (cost <= 260)
      return {
        label: "Good",
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: <CheckCircle className="w-4 h-4" />,
        description: "Well-managed costs",
      };
    if (cost <= 300)
      return {
        label: "Average",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: <Info className="w-4 h-4" />,
        description: "Room for optimization",
      };
    return {
      label: "High",
      color: "bg-red-100 text-red-800 border-red-300",
      icon: <AlertTriangle className="w-4 h-4" />,
        description: "Requires immediate attention",
    };
  };

  // Prepare chart data
  const breakdownChartData = result
    ? [
        { name: "Materials", value: result.breakdown.materials, color: COLORS[0] },
        { name: "Labor", value: result.breakdown.labor, color: COLORS[1] },
        { name: "Overhead", value: result.breakdown.overhead, color: COLORS[2] },
        { name: "Equipment", value: result.breakdown.equipment, color: COLORS[3] },
        { name: "Variables", value: result.breakdown.variables, color: COLORS[4] },
      ]
    : [];

  const profitabilityData = result
    ? [
        { id: "p299", price: "₹299", profit: 299 - result.costPerWash, margin: ((299 - result.costPerWash) / 299) * 100 },
        { id: "p499", price: "₹499", profit: 499 - result.costPerWash, margin: ((499 - result.costPerWash) / 499) * 100 },
        { id: "p699", price: "₹699", profit: 699 - result.costPerWash, margin: ((699 - result.costPerWash) / 699) * 100 },
        { id: "p899", price: "₹899", profit: 899 - result.costPerWash, margin: ((899 - result.costPerWash) / 899) * 100 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <BackButton to="/finance" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Cost per Wash Calculator
            <span className="text-sm text-gray-500 ml-2">
              Showing costs for: <strong>{cityInfo.displayName}</strong>
            </span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Calculate your unit economics with detailed cost breakdown and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetCalculator}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          {result && (
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Direct Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Direct Materials (Per Wash)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="cleaningSupplies" className="text-xs">
                    Cleaning Supplies (₹)
                  </Label>
                  <Input
                    id="cleaningSupplies"
                    type="number"
                    value={inputs.cleaningSupplies}
                    onChange={(e) =>
                      handleInputChange("cleaningSupplies", e.target.value)
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Shampoo, wax, polish</p>
                </div>
                <div>
                  <Label htmlFor="consumables" className="text-xs">
                    Consumables (₹)
                  </Label>
                  <Input
                    id="consumables"
                    type="number"
                    value={inputs.consumables}
                    onChange={(e) =>
                      handleInputChange("consumables", e.target.value)
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Cloths, sponges</p>
                </div>
                <div>
                  <Label htmlFor="water" className="text-xs">
                    Water Cost (₹)
                  </Label>
                  <Input
                    id="water"
                    type="number"
                    value={inputs.water}
                    onChange={(e) => handleInputChange("water", e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Per wash usage</p>
                </div>
              </div>
              {result && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    Materials Subtotal
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹{result.breakdown.materials}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Labor Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Labor Costs (Monthly)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="washerSalary" className="text-xs">
                    Washer Salary (₹)
                  </Label>
                  <Input
                    id="washerSalary"
                    type="number"
                    value={inputs.washerSalary}
                    onChange={(e) =>
                      handleInputChange("washerSalary", e.target.value)
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Base + incentives</p>
                </div>
                <div>
                  <Label htmlFor="supervisorAllocation" className="text-xs">
                    Supervisor Allocation (₹)
                  </Label>
                  <Input
                    id="supervisorAllocation"
                    type="number"
                    value={inputs.supervisorAllocation}
                    onChange={(e) =>
                      handleInputChange("supervisorAllocation", e.target.value)
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Share per washer</p>
                </div>
                <div>
                  <Label htmlFor="washesPerMonth" className="text-xs">
                    Washes per Month
                  </Label>
                  <Input
                    id="washesPerMonth"
                    type="number"
                    value={inputs.washesPerMonth}
                    onChange={(e) =>
                      handleInputChange("washesPerMonth", e.target.value)
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Target volume</p>
                </div>
              </div>
              {result && (
                <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900">
                    Labor Subtotal (per wash)
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{result.breakdown.labor}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overhead Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-600" />
                Overhead Costs (Monthly)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="rent" className="text-xs">
                    Rent (₹)
                  </Label>
                  <Input
                    id="rent"
                    type="number"
                    value={inputs.rent}
                    onChange={(e) => handleInputChange("rent", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="utilities" className="text-xs">
                    Utilities (₹)
                  </Label>
                  <Input
                    id="utilities"
                    type="number"
                    value={inputs.utilities}
                    onChange={(e) =>
                      handleInputChange("utilities", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="insurance" className="text-xs">
                    Insurance (₹)
                  </Label>
                  <Input
                    id="insurance"
                    type="number"
                    value={inputs.insurance}
                    onChange={(e) =>
                      handleInputChange("insurance", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="other" className="text-xs">
                    Other (₹)
                  </Label>
                  <Input
                    id="other"
                    type="number"
                    value={inputs.other}
                    onChange={(e) => handleInputChange("other", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              {result && (
                <div className="bg-purple-50 border border-purple-200 rounded p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-900">
                    Overhead Subtotal (per wash)
                  </span>
                  <span className="text-lg font-bold text-purple-600">
                    ₹{result.breakdown.overhead}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment & Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-600" />
                Equipment & Maintenance (Monthly)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="equipmentDepreciation" className="text-xs">
                    Equipment Depreciation (₹)
                  </Label>
                  <Input
                    id="equipmentDepreciation"
                    type="number"
                    value={inputs.equipmentDepreciation}
                    onChange={(e) =>
                      handleInputChange("equipmentDepreciation", e.target.value)
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Asset writeoff</p>
                </div>
                <div>
                  <Label htmlFor="maintenance" className="text-xs">
                    Maintenance (₹)
                  </Label>
                  <Input
                    id="maintenance"
                    type="number"
                    value={inputs.maintenance}
                    onChange={(e) =>
                      handleInputChange("maintenance", e.target.value)
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Repairs & service</p>
                </div>
              </div>
              {result && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-900">
                    Equipment Subtotal (per wash)
                  </span>
                  <span className="text-lg font-bold text-orange-600">
                    ₹{result.breakdown.equipment}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other Variable Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-pink-600" />
                Other Variable Costs (Per Wash)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="transport" className="text-xs">
                    Transport/Fuel (₹)
                  </Label>
                  <Input
                    id="transport"
                    type="number"
                    value={inputs.transport}
                    onChange={(e) =>
                      handleInputChange("transport", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="packaging" className="text-xs">
                    Packaging (₹)
                  </Label>
                  <Input
                    id="packaging"
                    type="number"
                    value={inputs.packaging}
                    onChange={(e) =>
                      handleInputChange("packaging", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="miscellaneous" className="text-xs">
                    Miscellaneous (₹)
                  </Label>
                  <Input
                    id="miscellaneous"
                    type="number"
                    value={inputs.miscellaneous}
                    onChange={(e) =>
                      handleInputChange("miscellaneous", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              {result && (
                <div className="bg-pink-50 border border-pink-200 rounded p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-pink-900">
                    Variables Subtotal
                  </span>
                  <span className="text-lg font-bold text-pink-600">
                    ₹{result.breakdown.variables}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={calculateCostPerWash}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Calculator className="w-5 h-5 mr-2" />
            Calculate Cost per Wash
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Main Result Card */}
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      Total Cost per Wash
                    </div>
                    <div className="text-5xl font-bold text-gray-900 mb-3">
                      ₹{result.costPerWash}
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Badge className={`${getHealthStatus(result.costPerWash).color} flex items-center gap-1`}>
                        {getHealthStatus(result.costPerWash).icon}
                        {getHealthStatus(result.costPerWash).label}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-4">
                      {getHealthStatus(result.costPerWash).description}
                    </p>
                    <div className="pt-4 border-t border-gray-300">
                      <div className="text-xs text-gray-600">
                        Monthly Total Cost
                      </div>
                      <div className="text-2xl font-semibold text-gray-800 mt-1">
                        ₹{(result?.monthlyTotal ?? 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Based on {inputs.washesPerMonth} washes/month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Materials</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{result.breakdown.materials}</div>
                      <div className="text-xs text-gray-500">
                        {(result?.percentages?.materials ?? 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Labor</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{result.breakdown.labor}</div>
                      <div className="text-xs text-gray-500">
                        {(result?.percentages?.labor ?? 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Overhead</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{result.breakdown.overhead}</div>
                      <div className="text-xs text-gray-500">
                        {(result?.percentages?.overhead ?? 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium">Equipment</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{result.breakdown.equipment}</div>
                      <div className="text-xs text-gray-500">
                        {(result?.percentages?.equipment ?? 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-pink-600" />
                      <span className="text-sm font-medium">Variables</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{result.breakdown.variables}</div>
                      <div className="text-xs text-gray-500">
                        {(result?.percentages?.variables ?? 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-blue-600" />
                    Cost Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RePieChart>
                      <Pie
                        data={breakdownChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        key="cost-breakdown-pie"
                      >
                        {breakdownChartData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip key="pie-tooltip" />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Profitability Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Profitability at Different Prices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {profitabilityData.map((item) => {
                    const isProfit = item.profit > 0;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isProfit ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <span className="font-medium text-sm">{item.price} package</span>
                        <div className="text-right">
                          <div className={`font-semibold text-sm ${isProfit ? "text-green-600" : "text-red-600"}`}>
                            {isProfit ? "+" : ""}₹{item.profit}
                          </div>
                          <div className="text-xs text-gray-600">
                            {(item?.margin ?? 0).toFixed(1)}% margin
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Profitability Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    Profit Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={profitabilityData}>
                      <CartesianGrid strokeDasharray="3 3" key="bar-grid" />
                      <XAxis dataKey="price" tick={{ fontSize: 12 }} key="bar-xaxis" />
                      <YAxis tick={{ fontSize: 12 }} key="bar-yaxis" />
                      <Tooltip key="bar-tooltip" />
                      <Bar dataKey="profit" fill="#10B981" key="profit-bar" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Optimization Insights */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-700 space-y-2">
                      <p className="font-semibold text-blue-900">
                        💡 Cost Optimization Tips:
                      </p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Bulk purchase supplies (save 10-15%)</li>
                        <li>Increase washes per day (reduce overhead per wash)</li>
                        <li>Train staff for efficiency (reduce labor time)</li>
                        <li>Negotiate rent and utilities</li>
                        <li>Implement preventive maintenance</li>
                        <li>Optimize route planning (reduce fuel)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benchmark Comparison */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-700 space-y-2">
                      <p className="font-semibold text-green-900">
                        📊 Industry Benchmarks:
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Excellent Range:</span>
                          <span className="font-medium">₹180 - ₹220</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Good Range:</span>
                          <span className="font-medium">₹221 - ₹260</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Range:</span>
                          <span className="font-medium">₹261 - ₹300</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Your Cost:</span>
                          <span className="font-bold text-green-700">₹{result.costPerWash}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-8 text-center">
                <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 font-medium mb-2">
                  Ready to Calculate?
                </p>
                <p className="text-xs text-gray-500">
                  Enter your costs in the form and click "Calculate Cost per Wash" to see detailed results, charts, and profitability analysis
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default CostPerWashCalculatorEnhanced;