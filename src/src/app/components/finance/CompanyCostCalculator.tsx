/**
 * Company Cost Calculator - Recharts duplicate key fix applied
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Calculator,
  Package,
  Droplet,
  Users,
  Building,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import {
  getTotalCostPerWash,
  getMonthlyCost,
  WORKING_DAYS_PER_MONTH,
} from "../../data/ebitdaCalculations";

const washers = ["Average", "Ramesh K.", "Suresh P.", "Mahesh S.", "Dinesh M."];
const periods = [
  "This Month",
  "Last Month",
  "Last 3 Months",
  "Last 6 Months",
  "Custom Date Range",
];
const pinCodes = ["All Zones", "395001", "395002", "395003", "395004", "395005"];
const cities = ["All Cities", "Surat", "Navsari"];

export function CompanyCostCalculator() {
  // Use dynamic subscription plans from context
  const { planTypes, vehicleCategories } = usePlanDefinitions();
  const [selectedPackage, setSelectedPackage] = useState("Shampoo Wash");
  const [selectedVehicle, setSelectedVehicle] = useState("Hatchback / Compact Sedan");
  const [withIncentive, setWithIncentive] = useState(false);
  const [selectedWasher, setSelectedWasher] = useState("Average");
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");
  const [selectedPinCode, setSelectedPinCode] = useState("All Zones");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [result, setResult] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const calculateCost = () => {
    // Determine vehicle type from selected category
    const vehicleType = selectedVehicle.includes("2W") ? "2W" : "4W";

    // Get cost breakdown using centralized EBITDA calculation system
    const costBreakdown = getTotalCostPerWash(
      selectedPackage,
      vehicleType,
      withIncentive
    );

    const totalCostPerWash = costBreakdown.total;

    // Build simplified breakdown with 6 cost components
    const labourBreakdown = [
      { name: "Labour Cost", amount: costBreakdown.labour, note: withIncentive ? "With Incentive" : "Base" },
    ];

    const consumablesBreakdown = [
      { name: "Liquid Consumables", amount: costBreakdown.consumables, note: "Shampoo, Wax, etc." },
    ];

    const clothBreakdown = [
      { name: "Cloth & Sponge", amount: costBreakdown.cloth, note: "Microfibre + Sponge" },
    ];

    const equipmentBreakdown = [
      { name: "Equipment Depreciation", amount: costBreakdown.equipment, note: "Spray Gun + Vacuum" },
    ];

    const laundryBreakdown = [
      { name: "Laundry & Sanitization", amount: costBreakdown.laundry, note: "Cloth Cleaning" },
    ];

    const overheadBreakdown = [
      { name: "Fixed Overhead", amount: costBreakdown.fixedOverhead, note: "Office + ERP" },
    ];
    
    const mockResult = {
      package: selectedPackage,
      vehicle: selectedVehicle,
      period: selectedPeriod,
      breakdown: {
        labour: {
          total: costBreakdown.labour,
          items: labourBreakdown,
        },
        consumables: {
          total: costBreakdown.consumables,
          items: consumablesBreakdown,
        },
        cloth: {
          total: costBreakdown.cloth,
          items: clothBreakdown,
        },
        equipment: {
          total: costBreakdown.equipment,
          items: equipmentBreakdown,
        },
        laundry: {
          total: costBreakdown.laundry,
          items: laundryBreakdown,
        },
        overhead: {
          total: costBreakdown.fixedOverhead,
          items: overheadBreakdown,
        },
      },
      totalCostPerWash,
      monthlyWashes: WORKING_DAYS_PER_MONTH,
      totalCostForPeriod: getMonthlyCost(totalCostPerWash),
      trend: [
        { id: "oct", month: "Oct", cost: totalCostPerWash * 1.03 },
        { id: "nov", month: "Nov", cost: totalCostPerWash * 1.02 },
        { id: "dec", month: "Dec", cost: totalCostPerWash * 1.01 },
        { id: "jan", month: "Jan", cost: totalCostPerWash * 1.005 },
        { id: "feb", month: "Feb", cost: totalCostPerWash * 0.99 },
        { id: "mar", month: "Mar", cost: totalCostPerWash },
      ],
      standardCost: totalCostPerWash * 0.97,
      actualCost: totalCostPerWash,
      variance: totalCostPerWash - (totalCostPerWash * 0.97),
      variancePercent: ((totalCostPerWash - (totalCostPerWash * 0.97)) / (totalCostPerWash * 0.97)) * 100,
    };

    setResult(mockResult);
    toast.success("Cost calculated successfully");
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const costTrendDirection =
    result &&
    result.trend[result.trend.length - 1].cost < result.trend[result.trend.length - 3].cost;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Input Panel - Left Side (40%) */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Calculation Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="package">Package</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger id="package" className="mt-1">
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

            <div>
              <Label htmlFor="vehicle">Vehicle Category</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger id="vehicle" className="mt-1">
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

            <div>
              <Label htmlFor="washer">Washer</Label>
              <Select value={selectedWasher} onValueChange={setSelectedWasher}>
                <SelectTrigger id="washer" className="mt-1">
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

            <div>
              <Label htmlFor="period">Time Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger id="period" className="mt-1">
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

            <div>
              <Label htmlFor="pincode">PIN Code Zone</Label>
              <Select value={selectedPinCode} onValueChange={setSelectedPinCode}>
                <SelectTrigger id="pincode" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pinCodes.map((pin) => (
                    <SelectItem key={pin} value={pin}>
                      {pin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger id="city" className="mt-1">
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

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
              <input
                type="checkbox"
                id="withIncentive"
                checked={withIncentive}
                onChange={(e) => setWithIncentive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="withIncentive" className="text-sm cursor-pointer">
                Include Incentive Costs
              </Label>
            </div>

            <Button onClick={calculateCost} className="w-full bg-blue-600 hover:bg-blue-700">
              <Calculator className="w-4 h-4 mr-2" />
              Calculate
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Panel - Right Side (60%) */}
      <div className="lg:col-span-3 space-y-4">
        {result ? (
          <>
            {/* Main Result Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">
                  Cost Per Wash — {result.package} — {result.vehicle} — {result.period}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    ₹{(result?.totalCostPerWash ?? 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Cost to Company (per wash)
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Labour Cost */}
                <div className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSection("labour")}
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Users className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">Labour Cost</div>
                        <div className="text-xs text-gray-500">Per wash / Per month</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ₹{(result?.breakdown?.labour?.total ?? 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹{(result.breakdown.labour.total * result.monthlyWashes).toLocaleString()}
                        </div>
                      </div>
                      {expandedSections.includes("labour") ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  {expandedSections.includes("labour") && (
                    <div className="px-4 pb-4 space-y-2 border-t pt-3 bg-green-50">
                      {result.breakdown.labour.items.map((item: any) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700">
                            {item.name} {item.note && `(${item.note})`}
                          </span>
                          <span className="font-medium">₹{(item?.amount ?? 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Consumable Cost */}
                <div className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSection("consumables")}
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Droplet className="w-5 h-5 text-cyan-600" />
                      <div>
                        <div className="font-medium">Consumable Cost</div>
                        <div className="text-xs text-gray-500">Per wash / Per month</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <div className="font-bold text-cyan-600">
                          ₹{(result?.breakdown?.consumables?.total ?? 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹
                          {(result.breakdown.consumables.total * result.monthlyWashes).toLocaleString()}
                        </div>
                      </div>
                      {expandedSections.includes("consumables") ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  {expandedSections.includes("consumables") && (
                    <div className="px-4 pb-4 space-y-2 border-t pt-3 bg-cyan-50">
                      {result.breakdown.consumables.items.map((item: any) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700">
                            {item.name} {item.note && `(${item.note})`}
                          </span>
                          <span className="font-medium">₹{(item?.amount ?? 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cloth Cost */}
                <div className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSection("cloth")}
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Package className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Cloth & Sponge Cost</div>
                        <div className="text-xs text-gray-500">Per wash / Per month</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <div className="font-bold text-blue-600">
                          ₹{(result?.breakdown?.cloth?.total ?? 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹
                          {(result.breakdown.cloth.total * result.monthlyWashes).toLocaleString()}
                        </div>
                      </div>
                      {expandedSections.includes("cloth") ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  {expandedSections.includes("cloth") && (
                    <div className="px-4 pb-4 space-y-2 border-t pt-3 bg-blue-50">
                      {result.breakdown.cloth.items.map((item: any) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700">
                            {item.name} {item.note && `(${item.note})`}
                          </span>
                          <span className="font-medium">₹{(item?.amount ?? 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Equipment Cost */}
                <div className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSection("equipment")}
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Building className="w-5 h-5 text-indigo-600" />
                      <div>
                        <div className="font-medium">Equipment Depreciation</div>
                        <div className="text-xs text-gray-500">Per wash / Per month</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <div className="font-bold text-indigo-600">
                          ₹{(result?.breakdown?.equipment?.total ?? 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹
                          {(result.breakdown.equipment.total * result.monthlyWashes).toLocaleString()}
                        </div>
                      </div>
                      {expandedSections.includes("equipment") ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  {expandedSections.includes("equipment") && (
                    <div className="px-4 pb-4 space-y-2 border-t pt-3 bg-indigo-50">
                      {result.breakdown.equipment.items.map((item: any) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700">
                            {item.name} {item.note && `(${item.note})`}
                          </span>
                          <span className="font-medium">₹{(item?.amount ?? 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Laundry Cost */}
                <div className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSection("laundry")}
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Droplet className="w-5 h-5 text-teal-600" />
                      <div>
                        <div className="font-medium">Laundry & Sanitization</div>
                        <div className="text-xs text-gray-500">Per wash / Per month</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <div className="font-bold text-teal-600">
                          ₹{(result?.breakdown?.laundry?.total ?? 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹
                          {(result.breakdown.laundry.total * result.monthlyWashes).toLocaleString()}
                        </div>
                      </div>
                      {expandedSections.includes("laundry") ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  {expandedSections.includes("laundry") && (
                    <div className="px-4 pb-4 space-y-2 border-t pt-3 bg-teal-50">
                      {result.breakdown.laundry.items.map((item: any) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700">
                            {item.name} {item.note && `(${item.note})`}
                          </span>
                          <span className="font-medium">₹{(item?.amount ?? 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fixed Overhead */}
                <div className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSection("overhead")}
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Building className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-medium">Fixed Overhead</div>
                        <div className="text-xs text-gray-500">Per wash / Per month</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <div className="font-bold text-purple-600">
                          ₹{(result?.breakdown?.overhead?.total ?? 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹
                          {(result.breakdown.overhead.total * result.monthlyWashes).toLocaleString()}
                        </div>
                      </div>
                      {expandedSections.includes("overhead") ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  {expandedSections.includes("overhead") && (
                    <div className="px-4 pb-4 space-y-2 border-t pt-3 bg-purple-50">
                      {result.breakdown.overhead.items.map((item: any) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700">
                            {item.name} {item.note && `(${item.note})`}
                          </span>
                          <span className="font-medium">₹{(item?.amount ?? 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Summary */}
                <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between">
                  <span className="font-bold text-lg">Total Cost to Company</span>
                  <span className="text-2xl font-bold text-teal-600">
                    ₹{(result?.totalCostPerWash ?? 0).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Period Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-gray-500">Monthly Washes</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(result?.monthlyWashes ?? 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-gray-500">Total Cost for Period</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{(result?.totalCostForPeriod ?? 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cost Trend (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={result.trend}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" />
                    <XAxis
                      key="xaxis"
                      dataKey="id"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const item = result.trend.find((d: any) => d.id === value);
                        return item ? item.month : value;
                      }}
                    />
                    <YAxis key="yaxis" tick={{ fontSize: 12 }} />
                    <Tooltip
                      key="tooltip"
                      labelFormatter={(value) => {
                        const item = result.trend.find((d: any) => d.id === value);
                        return item ? item.month : value;
                      }}
                    />
                    <Legend key="legend" />
                    <Line
                      key="cost-line"
                      type="monotone"
                      dataKey="cost"
                      stroke="#0891B2"
                      strokeWidth={2}
                      name="Cost per Wash (₹)"
                    />
                  </LineChart>
                </ResponsiveContainer>
                {costTrendDirection ? (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="text-xs text-green-800">
                      <strong>Cost efficiency improving</strong> — 3.5% reduction over last 3
                      months
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <strong>Cost per wash has increased</strong> 2.8% in the last 3 months.
                      Review material usage.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actual vs Standard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actual vs Standard Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Standard Cost</div>
                    <div className="text-xl font-bold text-gray-700">
                      ₹{(result?.standardCost ?? 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Actual Cost</div>
                    <div className="text-xl font-bold text-blue-600">
                      ₹{(result?.actualCost ?? 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Variance</div>
                    <div className="flex items-center justify-center gap-2">
                      {result.variance > 0 ? (
                        <TrendingUp className="w-4 h-4 text-red-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-green-600" />
                      )}
                      <div
                        className={`text-xl font-bold ${
                          result.variance > 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {result.variance > 0 ? "+" : ""}₹{(result?.variance ?? 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      ({(result?.variancePercent ?? 0).toFixed(1)}%)
                    </div>
                  </div>
                </div>
                {result.variancePercent > 10 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <strong>Actual cost exceeds standard by {(result?.variancePercent ?? 0).toFixed(1)}%.</strong>{" "}
                      Review washer material usage in this zone/package.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-16 text-center">
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">No Results Yet</p>
              <p className="text-sm text-gray-500">
                Select your filters and click "Calculate" to view cost breakdown
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}