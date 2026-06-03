// Break-Even Analysis Dashboard
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { BackButton } from "../ui/back-button";
import {
  Calculator,
  TrendingUp,
  Calendar,
  DollarSign,
  Download,
  Plus,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { useFinance } from "../../contexts/FinanceContext";
import { useCity } from "../../contexts/CityContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { MASTER_STORE_BREAKEVEN, MASTER_BREAKEVEN_TIMELINE } from "../../data/masterData";

// Map stores to cities
const STORE_CITY_MAP: Record<string, string> = {
  "Adajan":      "surat",
  "Vesu":        "surat",
  "Althan":      "surat",
  "Piplod":      "surat",
  "Bandra":      "mumbai",
  "Andheri":     "mumbai",
  "Thane":       "mumbai",
  "Dadar":       "mumbai",
  "Navrangpura": "ahmedabad",
  "Satellite":   "ahmedabad",
  "Vastrapur":   "ahmedabad",
  "Jahangirpura":"ahmedabad",
};

function BreakEvenAnalysis() {
  const [searchParams] = useSearchParams();
  // Use CityContext as primary source of truth for city filtering
  const { city: cityCtxId } = useCity();
  const selectedCity = (cityCtxId?.replace("CITY-", "").toLowerCase()) || searchParams.get("city")?.toLowerCase() || "surat";
  const { currentRole } = useRole();
  const { getRevenueByCity, getPayablesByCity } = useFinance();
  const { availableCities } = useCity();

  // Filter stores by selected city
  const storeBreakEven = useMemo(() => {
    return availableCities.map(cityDef => {
      const cityId = cityDef.id;
      const revenues = getRevenueByCity(cityId).filter(r => r.status === "Received");
      const payables = getPayablesByCity(cityId).filter(p => p.status === "Paid");
      const monthlyRevenue = revenues.reduce((s, r) => s + r.amount, 0);
      const monthlyExpenses = payables.reduce((s, p) => s + p.amount, 0);
      const setupCost = 1500000; // one-time capital — configurable in settings
      const monthlyProfit = monthlyRevenue - monthlyExpenses;
      const breakEvenMonths = monthlyProfit > 0
        ? Math.ceil(setupCost / monthlyProfit)
        : 999;
      return {
        id: cityDef.id,
        store: cityDef.displayName,
        totalInvestment: setupCost,
        monthlyRevenue,
        monthlyExpenses,
        monthlyProfit,
        breakEvenMonths,
        breakEvenDate: new Date(Date.now() + breakEvenMonths * 30 * 86400000)
          .toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        progressToBreakEven: Math.min(
          Math.round((revenues.reduce((s, r) => s + r.amount, 0) / setupCost) * 100),
          100
        ),
        currentMonth: Math.ceil((Date.now() - new Date("2025-01-01").getTime()) / (30 * 86400000)),
        status: monthlyProfit > 0 && breakEvenMonths <= 24 ? "Profitable" : "Pre Break-Even",
      };
    }).filter(store =>
      store.store.toLowerCase().includes(selectedCity) ||
      selectedCity.includes(store.store.toLowerCase())
    );
  }, [selectedCity, availableCities, getRevenueByCity, getPayablesByCity]);

  // Fallback to masterData when no real finance records
  const displayStoreBreakEven = storeBreakEven.some(s => s.monthlyRevenue > 0)
    ? storeBreakEven : MASTER_STORE_BREAKEVEN.filter(store =>
      STORE_CITY_MAP[store.store]?.toLowerCase() === selectedCity
    );

  // Get the first store for the timeline chart
  const primaryStore = displayStoreBreakEven[0];
  const breakEvenTimeline = primaryStore ? MASTER_BREAKEVEN_TIMELINE : [];
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorInputs, setCalculatorInputs] = useState({
    setupCost: "",
    equipmentCost: "",
    marketingCost: "",
    monthlyRevenue: "",
    monthlyExpenses: "",
  });

  const hasAccess = currentRole === "Super Admin" || currentRole === "Admin";

  // Calculate summary statistics from actual data
  const summaryStats = useMemo(() => {
    if (displayStoreBreakEven.length === 0) {
      return {
        avgBreakEven: "0",
        avgInvestment: "0",
        profitableCount: 0,
        totalStores: 0,
        bestPerformer: "N/A",
        bestPerformerMonths: 0,
      };
    }

    const avgBreakEven = displayStoreBreakEven.reduce((sum, store) => sum + store.breakEvenMonths, 0) / displayStoreBreakEven.length;
    const avgInvestment = displayStoreBreakEven.reduce((sum, store) => sum + store.totalInvestment, 0) / displayStoreBreakEven.length;
    const profitableStores = displayStoreBreakEven.filter(store => store.status === "Profitable").length;
    const bestPerformer = displayStoreBreakEven.reduce((best, store) =>
      store.breakEvenMonths < best.breakEvenMonths ? store : best
    , displayStoreBreakEven[0]);

    return {
      avgBreakEven: avgBreakEven.toFixed(1),
      avgInvestment: (avgInvestment / 100000).toFixed(1), // in lakhs
      profitableCount: profitableStores,
      totalStores: displayStoreBreakEven.length,
      bestPerformer: bestPerformer.store,
      bestPerformerMonths: bestPerformer.breakEvenMonths,
    };
  }, [displayStoreBreakEven]);

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg font-semibold">Access Denied</div>
            <p className="text-gray-500 mt-2">
              You don't have permission to access Break-Even Analysis.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateBreakEven = () => {
    const totalInvestment = 
      parseFloat(calculatorInputs.setupCost || "0") +
      parseFloat(calculatorInputs.equipmentCost || "0") +
      parseFloat(calculatorInputs.marketingCost || "0");
    
    const monthlyProfit = 
      parseFloat(calculatorInputs.monthlyRevenue || "0") -
      parseFloat(calculatorInputs.monthlyExpenses || "0");
    
    if (monthlyProfit <= 0) return "N/A";
    
    return (totalInvestment / monthlyProfit).toFixed(1);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Break-Even Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">
            Calculate service zone profitability timeline and payback periods
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Calculate Break-Even
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Break-Even Calculator</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Store Setup Cost</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 2500000"
                    value={calculatorInputs.setupCost}
                    onChange={(e) => setCalculatorInputs({ ...calculatorInputs, setupCost: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Equipment Investment</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 850000"
                    value={calculatorInputs.equipmentCost}
                    onChange={(e) => setCalculatorInputs({ ...calculatorInputs, equipmentCost: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Marketing Launch Cost</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 450000"
                    value={calculatorInputs.marketingCost}
                    onChange={(e) => setCalculatorInputs({ ...calculatorInputs, marketingCost: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Expected Monthly Revenue</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 734700"
                    value={calculatorInputs.monthlyRevenue}
                    onChange={(e) => setCalculatorInputs({ ...calculatorInputs, monthlyRevenue: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Expected Monthly Expenses</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 305115"
                    value={calculatorInputs.monthlyExpenses}
                    onChange={(e) => setCalculatorInputs({ ...calculatorInputs, monthlyExpenses: e.target.value })}
                  />
                </div>
                
                {calculatorInputs.setupCost && calculatorInputs.monthlyRevenue && calculatorInputs.monthlyExpenses && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-sm font-semibold text-gray-700">Calculation Results</div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Investment:</span>
                        <span className="font-medium">
                          ₹{(
                            parseFloat(calculatorInputs.setupCost || "0") +
                            parseFloat(calculatorInputs.equipmentCost || "0") +
                            parseFloat(calculatorInputs.marketingCost || "0")
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Profit:</span>
                        <span className="font-medium">
                          ₹{(
                            parseFloat(calculatorInputs.monthlyRevenue || "0") -
                            parseFloat(calculatorInputs.monthlyExpenses || "0")
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-bold">Break-Even Period:</span>
                        <span className="font-bold text-blue-600 text-lg">
                          {calculateBreakEven()} months
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCalculatorOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => setIsCalculatorOpen(false)}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Avg. Break-Even Period</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {summaryStats.avgBreakEven} months
                </div>
                <div className="text-xs text-gray-600 mt-2">Across all stores</div>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Avg. Investment</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{summaryStats.avgInvestment}L
                </div>
                <div className="text-xs text-gray-600 mt-2">Per store</div>
              </div>
              <div className="p-2 bg-orange-50 rounded">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Profitable Stores</div>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {summaryStats.profitableCount}/{summaryStats.totalStores}
                </div>
                <div className="text-xs text-gray-600 mt-2">Reached break-even</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Best Performer</div>
                <div className="text-xl font-bold text-purple-600 mt-1">
                  {summaryStats.bestPerformer}
                </div>
                <div className="text-xs text-gray-600 mt-2">{summaryStats.bestPerformerMonths} months</div>
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <Calculator className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Break-Even Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            Break-Even Timeline - {primaryStore?.store || "No Store"} ({selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {breakEvenTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={breakEvenTimeline} id="breakeven-timeline-chart">
                <CartesianGrid key="breakeven-grid" strokeDasharray="3 3" />
                <XAxis key="breakeven-xaxis" dataKey="month" tick={{ fontSize: 11 }} label={{ value: "Months", position: "insideBottom", offset: -5 }} />
                <YAxis key="breakeven-yaxis" label={{ value: "Cumulative (₹)", angle: -90, position: "insideLeft" }} />
                <RechartsTooltip key="breakeven-tooltip" />
                <Legend key="breakeven-legend" />
                <ReferenceLine key="breakeven-refline" y={0} stroke="#10b981" strokeDasharray="3 3" label="Break-Even Point" />
                <Line
                  key="breakeven-line"
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Cumulative Cash Flow"
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              <p>No store data available for {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Store Break-Even Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Break-Even Period Comparison ({selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)})</CardTitle>
        </CardHeader>
        <CardContent>
          {displayStoreBreakEven.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={displayStoreBreakEven} id="breakeven-comparison-chart">
                <CartesianGrid key="comparison-grid" strokeDasharray="3 3" />
                <XAxis key="comparison-xaxis" dataKey="store" tick={{ fontSize: 11 }} />
                <YAxis key="comparison-yaxis" label={{ value: "Months", angle: -90, position: "insideLeft" }} />
                <RechartsTooltip key="comparison-tooltip" />
                <Bar key="comparison-bar" dataKey="breakEvenMonths" fill="#8b5cf6" name="Break-Even Period (Months)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p>No store data available for {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Store Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Store Break-Even Analysis Details ({selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)})</CardTitle>
        </CardHeader>
        <CardContent>
          {displayStoreBreakEven.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Store</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">Total Investment</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">Monthly Revenue</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">Monthly Expenses</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">Monthly Profit</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">Break-Even Period</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">Current Month</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStoreBreakEven.map((store) => (
                    <tr key={store.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{store.store}</td>
                      <td className="p-3 text-right">₹{(store.totalInvestment / 100000).toFixed(1)}L</td>
                      <td className="p-3 text-right">₹{(store?.monthlyRevenue ?? 0).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right text-red-600">₹{(store?.monthlyExpenses ?? 0).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-semibold text-green-600">₹{(store?.monthlyProfit ?? 0).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-bold">{store.breakEvenMonths} months</td>
                      <td className="p-3 text-right">{store.currentMonth} months</td>
                      <td className="p-3 text-center">
                        {store.status === "Profitable" ? (
                          <Badge className="bg-green-500">Profitable</Badge>
                        ) : (
                          <Badge className="bg-yellow-500">Pre Break-Even</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <p>No store data available for {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</p>
              <p className="text-sm mt-2">Try selecting a different city or contact your administrator.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BreakEvenAnalysis;