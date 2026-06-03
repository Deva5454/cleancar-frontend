/**
 * Cost Per Wash Calculator - Company Cost View
 * Calculates actual company cost per wash with material, consumable, manpower, and overhead breakdown
 * Tracks actual vs standard costs with trend analysis
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
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
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Package,
  Users,
  Wrench,
  Building,
  DollarSign,
  Calendar,
  MapPin,
  User,
  BarChart3,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  MATERIALS,
  CONSUMABLES,
  MANPOWER_ROLES,
  OVERHEAD_ITEMS,
  AVG_WASHES_PER_MONTH,
  type Material,
} from "../../data/costData";
import {
  CURRENT_PLAN_VERSION,
  type VehicleCategory,
  type PlanType,
} from "../../data/subscriptionPlans";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";

interface CostBreakdown {
  materialCost: number;
  consumableCost: number;
  manpowerCost: number;
  overheadCost: number;
  totalCost: number;
}

interface MaterialBreakdown {
  material: Material;
  quantityUsed: number;
  costPerUnit: number;
  totalCost: number;
}

export function CostPerWashCompany() {
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

  // UI state
  const [calculated, setCalculated] = useState(false);
  const [expandedMaterials, setExpandedMaterials] = useState(false);
  const [expandedConsumables, setExpandedConsumables] = useState(false);
  const [expandedManpower, setExpandedManpower] = useState(false);
  const [expandedOverhead, setExpandedOverhead] = useState(false);

  // Mock data for washers, zones, cities
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

  // Calculate material cost based on package
  const calculateMaterialCost = (): {
    total: number;
    breakdown: MaterialBreakdown[];
  } => {
    const activeMaterials = MATERIALS.filter((m) => m.status === "Active");
    const breakdown: MaterialBreakdown[] = [];
    let total = 0;

    activeMaterials.forEach((material) => {
      const mapping = material.usageMapping.find((m) =>
        m.package.includes(selectedPackage)
      );
      if (mapping) {
        const cost = material.costPerUnit * mapping.quantityPerWash;
        total += cost;
        breakdown.push({
          material,
          quantityUsed: mapping.quantityPerWash,
          costPerUnit: material.costPerUnit,
          totalCost: cost,
        });
      }
    });

    return { total, breakdown };
  };

  // Calculate consumable cost
  const calculateConsumableCost = () => {
    return CONSUMABLES.filter((c) => c.status === "Active").reduce(
      (sum, c) => sum + c.costPerUnit * c.avgUsagePerWash,
      0
    );
  };

  // Calculate manpower cost based on package complexity
  const calculateManpowerCost = () => {
    const washer = MANPOWER_ROLES.find((r) => r.role === "Washer");
    const supervisor = MANPOWER_ROLES.find((r) => r.role === "Supervisor");

    if (!washer || !supervisor) return { washerCost: 0, supervisorCost: 0, total: 0 };

    let washesPerHour = 2; // Default for Water Wash / Shampoo Wash

    if (selectedPackage === "Shampoo+Wax") {
      washesPerHour = 1.5; // Interior + wax more time-consuming
    } else if (selectedPackage === "Shampoo+Polish") {
      washesPerHour = 1.5; // 2-wheeler detailed polish work
    }

    const washerCost =
      washer.monthlySalary /
      (washer.workingDaysPerMonth * washer.workingHoursPerDay * washesPerHour);

    const supervisorCost = supervisor.monthlySalary / AVG_WASHES_PER_MONTH;

    return {
      washerCost,
      supervisorCost,
      total: washerCost + supervisorCost,
    };
  };

  // Calculate overhead cost
  const calculateOverheadCost = () => {
    return (
      OVERHEAD_ITEMS.filter((o) => !o.excludeFromCalculation).reduce(
        (sum, o) => sum + o.monthlyCost,
        0
      ) / AVG_WASHES_PER_MONTH
    );
  };


  // Mock data for trend chart (last 6 months)
  const getTrendData = () => {
    const months = [
      { id: "oct-2025", label: "Oct 2025" },
      { id: "nov-2025", label: "Nov 2025" },
      { id: "dec-2025", label: "Dec 2025" },
      { id: "jan-2026", label: "Jan 2026" },
      { id: "feb-2026", label: "Feb 2026" },
      { id: "mar-2026", label: "Mar 2026" }
    ];
    const baseCost = getCostBreakdown().totalCost;

    return months.map((month, index) => ({
      id: month.id,
      month: month.label,
      cost: baseCost * (0.92 + index * 0.015), // Slight upward trend
      standard: baseCost,
    }));
  };

  // Calculate cost trend
  const calculateCostTrend = () => {
    const trendData = getTrendData();
    const recentCost = trendData[trendData.length - 1].cost;
    const threeMonthsAgoCost = trendData[trendData.length - 4].cost;
    const percentChange =
      ((recentCost - threeMonthsAgoCost) / threeMonthsAgoCost) * 100;

    return {
      isIncreasing: percentChange > 0,
      percentChange: Math.abs(percentChange),
    };
  };

  // Mock monthly washes count
  const getMonthlyWashes = () => {
    if (selectedPeriod === "This Month") return 156;
    if (selectedPeriod === "Last Month") return 148;
    if (selectedPeriod === "Last 3 Months") return 445;
    if (selectedPeriod === "Last 6 Months") return 892;
    return 156;
  };

  // Calculate actual vs standard variance
  const getActualVsStandard = () => {
    const standard = getCostBreakdown().totalCost;
    const actual = standard * 1.08; // Mock: 8% higher than standard
    const variance = actual - standard;
    const variancePercent = (variance / standard) * 100;

    return {
      standard,
      actual,
      variance,
      variancePercent,
      isOverStandard: variance > 0,
      exceedsThreshold: Math.abs(variancePercent) > 10,
    };
  };

  const handleCalculate = () => {
    setCalculated(true);
    toast.success("Cost breakdown calculated", {
      description: `Analysis for ${selectedPackage} - ${selectedVehicleCategory}`,
    });
  };

  const breakdown = getCostBreakdown();
  const monthlyWashes = getMonthlyWashes();
  const totalCostForPeriod = breakdown.totalCost * monthlyWashes;
  const trendData = getTrendData();
  const costTrend = calculateCostTrend();
  const actualVsStandard = getActualVsStandard();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Input Panel - Left 40% */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calculator className="w-5 h-5" />
              Cost Calculator Inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Package Selector */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-600" />
                Package
              </Label>
              <Select value={selectedPackage} onValueChange={(value) => setSelectedPackage(value as PlanType)}>
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

            {/* Incentive Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Include Incentive Costs</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={withIncentive}
                  onChange={(e) => setWithIncentive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Calculate Button */}
            <Button
              onClick={handleCalculate}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Calculate Cost Breakdown
            </Button>
          </CardContent>
        </Card>

        {/* Filter Info Card */}
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-600 mt-0.5" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Filter Dependencies:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Selecting a washer filters PIN codes to that washer's zones</li>
                  <li>Selecting a PIN code filters washers assigned to that zone</li>
                  <li>All filters work together to refine cost analysis</li>
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
                Select your filters and click "Calculate Cost Breakdown" to view
                results
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Main Breakdown Card */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">
                  Cost Per Wash — {selectedPackage} — {selectedVehicleCategory} —{" "}
                  {selectedPeriod}
                </CardTitle>
                <div className="text-xs text-gray-500">
                  {selectedWasher} • {selectedZones[0]} • {selectedCities[0]}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cost Breakdown Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cost Component</TableHead>
                      <TableHead className="text-right">Per Wash</TableHead>
                      <TableHead className="text-right">Per Month</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Labour Cost */}
                    <TableRow>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Labour Cost
                      </TableCell>
                      <TableCell className="text-right text-blue-600 font-medium">
                        ₹{(breakdown?.labour ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        ₹{(breakdown.labour * monthlyWashes).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">
                          {withIncentive ? "With Incentive" : "Base"}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Consumables Cost */}
                    <TableRow>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-purple-600" />
                        Consumables
                      </TableCell>
                      <TableCell className="text-right text-purple-600 font-medium">
                        ₹{(breakdown?.consumables ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        ₹{(breakdown.consumables * monthlyWashes).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">Liquids</span>
                      </TableCell>
                    </TableRow>

                    {/* Cloth Cost */}
                    <TableRow>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Package className="w-4 h-4 text-green-600" />
                        Cloth & Sponge
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        ₹{(breakdown?.cloth ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ₹{(breakdown.cloth * monthlyWashes).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">Microfibre</span>
                      </TableCell>
                    </TableRow>

                    {/* Equipment Cost */}
                    <TableRow>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-amber-600" />
                        Equipment
                      </TableCell>
                      <TableCell className="text-right text-amber-600 font-medium">
                        ₹{(breakdown?.equipment ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-amber-600">
                        ₹{(breakdown.equipment * monthlyWashes).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">Depreciation</span>
                      </TableCell>
                    </TableRow>

                    {/* Laundry Cost */}
                    <TableRow>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-600" />
                        Laundry
                      </TableCell>
                      <TableCell className="text-right text-indigo-600 font-medium">
                        ₹{(breakdown?.laundry ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-indigo-600">
                        ₹{(breakdown.laundry * monthlyWashes).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">Sanitization</span>
                      </TableCell>
                    </TableRow>

                    {/* Fixed Overhead */}
                    <TableRow>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Building className="w-4 h-4 text-orange-600" />
                        Fixed Overhead
                      </TableCell>
                      <TableCell className="text-right text-orange-600 font-medium">
                        ₹{(breakdown?.fixedOverhead ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        ₹{(breakdown.fixedOverhead * monthlyWashes).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">Office+ERP</span>
                      </TableCell>
                    </TableRow>

                    {/* Total Cost */}
                    <TableRow className="bg-teal-50 border-t-2 border-teal-600">
                      <TableCell className="font-bold text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-teal-600" />
                        Total Cost to Company
                      </TableCell>
                      <TableCell className="text-right font-bold text-xl text-teal-600">
                        ₹{(breakdown?.totalCost ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg text-teal-600">
                        ₹{(breakdown.totalCost * monthlyWashes).toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="text-xs text-blue-600 mb-1">
                        Monthly Washes
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {monthlyWashes}
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        {selectedPeriod}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="text-xs text-green-600 mb-1">
                        Total Cost for Period
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        ₹{totalCostForPeriod.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-700 mt-1">
                        All washes combined
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Cost Trend Chart */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Cost Trend Analysis (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" />
                    <XAxis
                      key="xaxis"
                      dataKey="id"
                      tickFormatter={(value) => {
                        const item = trendData.find((d) => d.id === value);
                        return item ? item.month : value;
                      }}
                    />
                    <YAxis key="yaxis" tick={{ fontSize: 11 }} width={50} />
                    <Tooltip
                      key="tooltip"
                      formatter={(value: number) => `₹${value.toFixed(2)}`}
                      labelFormatter={(value) => {
                        const item = trendData.find((d) => d.id === value);
                        return item ? item.month : value;
                      }}
                    />
                    <Legend key="legend" />
                    <Line
                      key="cost-line"
                      type="monotone"
                      dataKey="cost"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Actual Cost"
                      dot={{ fill: "#3b82f6" }}
                    />
                    <Line
                      key="standard-line"
                      type="monotone"
                      dataKey="standard"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Standard Cost"
                      dot={{ fill: "#10b981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Trend Alert Banner */}
                {costTrend.isIncreasing ? (
                  <Card className="border-amber-200 bg-amber-50 mt-4">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <div>
                          <div className="font-medium text-amber-900">
                            Cost Increasing Trend Detected
                          </div>
                          <div className="text-sm text-amber-700">
                            Cost per wash has increased {(costTrend?.percentChange ?? 0).toFixed(1)}% in
                            the last 3 months. Review material usage and efficiency.
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-green-200 bg-green-50 mt-4">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-900">
                            Cost Efficiency Improving
                          </div>
                          <div className="text-sm text-green-700">
                            {(costTrend?.percentChange ?? 0).toFixed(1)}% reduction over last 3 months.
                            Great work!
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Actual vs Standard Comparison */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Actual vs Standard Cost Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="text-xs text-blue-600 mb-1">
                        Standard Cost
                      </div>
                      <div className="text-xl font-bold text-blue-900">
                        ₹{(actualVsStandard?.standard ?? 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        From Package Matrix
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="text-xs text-purple-600 mb-1">
                        Actual Cost
                      </div>
                      <div className="text-xl font-bold text-purple-900">
                        ₹{(actualVsStandard?.actual ?? 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-purple-700 mt-1">
                        From Job Records
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className={
                      actualVsStandard.isOverStandard
                        ? "border-red-200 bg-red-50"
                        : "border-green-200 bg-green-50"
                    }
                  >
                    <CardContent className="p-4">
                      <div
                        className={`text-xs mb-1 ${
                          actualVsStandard.isOverStandard
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        Variance
                      </div>
                      <div
                        className={`text-xl font-bold flex items-center gap-1 ${
                          actualVsStandard.isOverStandard
                            ? "text-red-900"
                            : "text-green-900"
                        }`}
                      >
                        {actualVsStandard.isOverStandard ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                        {actualVsStandard.isOverStandard ? "+" : ""}₹
                        {(actualVsStandard?.variance ?? 0).toFixed(2)}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          actualVsStandard.isOverStandard
                            ? "text-red-700"
                            : "text-green-700"
                        }`}
                      >
                        {actualVsStandard.isOverStandard ? "+" : ""}
                        {(actualVsStandard?.variancePercent ?? 0).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Variance Warning */}
                {actualVsStandard.exceedsThreshold && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <div>
                          <div className="font-medium text-amber-900">
                            High Variance Alert
                          </div>
                          <div className="text-sm text-amber-700">
                            Actual cost exceeds standard by{" "}
                            {(actualVsStandard?.variancePercent ?? 0).toFixed(1)}%. Review washer
                            material usage in {selectedZones[0]} for {selectedPackage}{" "}
                            package.
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
