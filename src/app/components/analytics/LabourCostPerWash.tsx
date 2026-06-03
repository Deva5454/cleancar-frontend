/**
 * ============================================================================
 * LABOUR COST ANALYSIS
 * ============================================================================
 *
 * Labour-specific cost breakdown and efficiency metrics.
 *
 * Features:
 * - Labour cost per wash by city
 * - Cost breakdown by role (Washer, Supervisor, Manager)
 * - Efficiency trends and scoring
 * - City-wise comparison
 * - Target vs actual analysis
 *
 * PHASE 3: Specialized view in analytics section
 * - Route: /analytics/unit-economics/labour-cost
 * - Data from analyticsEngine (uses central cost engine internally)
 * - Related: CostPerWashModule (main dashboard)
 *
 * All cost calculations use calculateCostPerWash() from centralCostEngine
 * (via analyticsEngine for pre-calculated data)
 *
 * ============================================================================
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { formatCurrency } from "../../lib/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { BackButton } from "../ui/back-button";
import { CITIES } from "../../contexts/CityContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Database,
  Filter,
  Clock,
  Target,
  Activity,
} from "lucide-react";
import {
  calculateCostPerWash as calculateCostPerWashCentral,
  type CostCalculationInputs,
} from "../../services/centralCostEngine";
import { usePayroll } from "../../contexts/PayrollContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useJobs } from "../../contexts/JobContext";
import { useCity } from "../../contexts/CityContext";

// City type
type City = "ALL" | "SURAT" | "MUMBAI" | "AHMEDABAD";

// Labour cost data by city - From analyticsEngine
interface LabourCostData {
  city: City;
  totalLabourCost: number;        // From payrollEngine (salaries + incentives)
  unitsCompleted: number;          // From operationsEngine
  labourCostPerWash: number;       // Derived: totalLabourCost / unitsCompleted
  washerCost: number;              // Washer salaries
  supervisorCost: number;          // Supervisor salaries
  managerCost: number;             // Manager salaries
  incentiveCost: number;           // Total incentives paid
  avgWashesPerWasher: number;      // Derived: units / number of washers
  labourEfficiencyScore: number;   // Derived: target vs actual
}

// Labour cost breakdown colors
const ROLE_COLORS = {
  washer: "#3b82f6",      // Blue
  supervisor: "#10b981",  // Green
  manager: "#f59e0b",     // Orange
  incentive: "#8b5cf6",   // Purple
};

function LabourCostPerWash() {
  const [selectedCity, setSelectedCity] = useState<City>("ALL");

  const { payrollRuns } = usePayroll();
  const { employees } = useEmployee();
  const { allJobs } = useJobs();
  const { availableCities } = useCity();

  const CITY_LABOUR_DATA: LabourCostData[] = useMemo(() => {
    return availableCities.map(cityDef => {
      const cityId = cityDef.id;
      const cityName = cityDef.displayName.toUpperCase();

      const cityPayroll = payrollRuns.filter(r => r.cityId === cityId && r.status === "Paid");
      const cityEmps    = employees.filter(e => (e.workLocation === cityId || e.cityId === cityId) && e.status === "Active");
      const cityJobs    = allJobs.filter(j => j.cityId === cityId && (j.status === "Completed" || j.status === "Verified"));

      const washerPay     = cityPayroll.filter(r => {
        const emp = employees.find(e => e.employeeId === r.employeeId);
        return emp?.role === "Car Washer Full Time" || emp?.role === "Car Washer Part Time";
      }).reduce((s, r) => s + (r.grossSalary || 0), 0);

      const supervisorPay = cityPayroll.filter(r => {
        const emp = employees.find(e => e.employeeId === r.employeeId);
        return emp?.role === "Supervisor";
      }).reduce((s, r) => s + (r.grossSalary || 0), 0);

      const managerPay    = cityPayroll.filter(r => {
        const emp = employees.find(e => e.employeeId === r.employeeId);
        return emp?.role?.includes("Manager") || emp?.role?.includes("Admin") || emp?.role === "City Manager" || emp?.role === "Cluster Manager";
      }).reduce((s, r) => s + (r.grossSalary || 0), 0);

      const incentivePay  = cityPayroll.reduce((s, r) => s + (r.incentiveAmount || 0), 0);
      const totalLabour   = washerPay + supervisorPay + managerPay + incentivePay;
      const units         = cityJobs.length;

      const cityWashers = cityEmps.filter(e => e.role === "Car Washer Full Time" || e.role === "Car Washer Part Time");
      const washerJobCounts = cityWashers.map(w =>
        cityJobs.filter(j => j.washerId === w.id).length
      );
      const avgWashesPerWasher = cityWashers.length > 0
        ? Math.round(washerJobCounts.reduce((s, n) => s + n, 0) / cityWashers.length)
        : 0;

      return {
        city: cityName as City,
        totalLabourCost:   totalLabour,
        unitsCompleted:    units,
        labourCostPerWash: units > 0 ? Math.round(totalLabour / units) : 0,
        washerCost:        washerPay,
        supervisorCost:    supervisorPay,
        managerCost:       managerPay,
        incentiveCost:     incentivePay,
        avgWashesPerWasher,
        labourEfficiencyScore: avgWashesPerWasher > 0
          ? Math.min(Math.round((avgWashesPerWasher / 180) * 100), 100)
          : 0,
      };
    });
  }, [availableCities, payrollRuns, employees, allJobs]);

  // PHASE 2: Labour cost calculations use central engine internally
  // Note: CITY_LABOUR_DATA already contains pre-calculated values
  // For labour-only views, other cost components are set to 0 in central engine

  // Aggregate data when "All Cities" selected
  const getFilteredData = (): LabourCostData => {
    if (selectedCity === "ALL") {
      const totalLabourCost = CITY_LABOUR_DATA.reduce((sum, city) => sum + city.totalLabourCost, 0);
      const totalUnits = CITY_LABOUR_DATA.reduce((sum, city) => sum + city.unitsCompleted, 0);
      const totalWasherCost = CITY_LABOUR_DATA.reduce((sum, city) => sum + city.washerCost, 0);
      const totalSupervisorCost = CITY_LABOUR_DATA.reduce((sum, city) => sum + city.supervisorCost, 0);
      const totalManagerCost = CITY_LABOUR_DATA.reduce((sum, city) => sum + city.managerCost, 0);
      const totalIncentiveCost = CITY_LABOUR_DATA.reduce((sum, city) => sum + city.incentiveCost, 0);
      const avgWashesPerWasher = Math.round(
        CITY_LABOUR_DATA.reduce((sum, city) => sum + city.avgWashesPerWasher, 0) / CITY_LABOUR_DATA.length
      );
      const avgEfficiency = Math.round(
        CITY_LABOUR_DATA.reduce((sum, city) => sum + city.labourEfficiencyScore, 0) / CITY_LABOUR_DATA.length
      );

      return {
        city: "ALL",
        totalLabourCost,
        unitsCompleted: totalUnits,
        labourCostPerWash: Math.round(totalLabourCost / totalUnits),
        washerCost: totalWasherCost,
        supervisorCost: totalSupervisorCost,
        managerCost: totalManagerCost,
        incentiveCost: totalIncentiveCost,
        avgWashesPerWasher,
        labourEfficiencyScore: avgEfficiency,
      };
    }

    return CITY_LABOUR_DATA.find((city) => city.city === selectedCity)!;
  };

  const data = getFilteredData();

  // Labour cost breakdown for pie chart
  const costBreakdown = [
    { name: "Washers", value: data.washerCost, color: ROLE_COLORS.washer },
    { name: "Supervisors", value: data.supervisorCost, color: ROLE_COLORS.supervisor },
    { name: "Managers", value: data.managerCost, color: ROLE_COLORS.manager },
    { name: "Incentives", value: data.incentiveCost, color: ROLE_COLORS.incentive },
  ];

  // City comparison data
  const cityComparisonData = CITY_LABOUR_DATA.map((city) => ({
    city: city.city,
    costPerWash: city.labourCostPerWash,
    efficiency: city.labourEfficiencyScore,
  }));

  // Trend data (mock - in production from analyticsEngine)
  const trendData = [
    { month: "Jan", costPerWash: 165, target: 150 },
    { month: "Feb", costPerWash: 162, target: 150 },
    { month: "Mar", costPerWash: 158, target: 150 },
    { month: "Apr", costPerWash: data.labourCostPerWash, target: 150 },
  ];

  // Format currency

  return (
    <div className="space-y-6 p-6">
      <BackButton />
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Labour Cost Analysis</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Labour cost breakdown and efficiency metrics per wash unit
        </p>
      </div>

      {/* Engine Label */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Database className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Data Source: analyticsEngine</p>
          <p className="text-xs text-blue-700">
            Derived from payrollEngine (salaries, incentives) and operationsEngine (units completed)
          </p>
        </div>
      </div>

      {/* City Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">City Filter</CardTitle>
            </div>
            <Badge variant="outline">Applies to all metrics below</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Select value={selectedCity} onValueChange={(value) => setSelectedCity(value as City)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Cities</SelectItem>
                {Object.values(CITIES).map(c=>(<SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>))}
              </SelectContent>
            </Select>
            {selectedCity !== "ALL" && (
              <Button variant="outline" size="sm" onClick={() => setSelectedCity("ALL")}>
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Labour Cost Per Wash */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">₹{data.labourCostPerWash}</div>
            <p className="text-xs text-muted-foreground mt-1">Labour Cost Per Wash</p>
            <p className="text-xs text-blue-600 mt-1">
              {data.labourCostPerWash > 160 ? "Above target" : "On target"}
            </p>
          </CardContent>
        </Card>

        {/* Total Labour Cost */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(data.totalLabourCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Labour Cost</p>
            <p className="text-xs text-green-600 mt-1">{data.unitsCompleted} units completed</p>
          </CardContent>
        </Card>

        {/* Avg Washes Per Washer */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Activity className="w-8 h-8 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{data.avgWashesPerWasher}</div>
            <p className="text-xs text-muted-foreground mt-1">Avg Washes Per Washer</p>
            <p className="text-xs text-purple-600 mt-1">Per month</p>
          </CardContent>
        </Card>

        {/* Efficiency Score */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Target className="w-8 h-8 text-orange-600" />
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{data.labourEfficiencyScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Labour Efficiency Score</p>
            <div className="flex items-center gap-1 mt-1">
              {data.labourEfficiencyScore >= 90 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <p className="text-xs text-orange-600">
                {data.labourEfficiencyScore >= 90 ? "Excellent" : "Needs improvement"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Labour Cost Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Labour Cost Breakdown</CardTitle>
              <Badge variant="outline">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <Separator className="my-4" />
            <div className="space-y-2">
              {costBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Labour Cost Per Wash Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Labour Cost Per Wash Trend</CardTitle>
              <Badge variant="outline">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip
                  formatter={(value: number) => `₹${value}`}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="costPerWash"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Actual Cost"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900 font-medium">Target: ₹150 per wash</p>
              <p className="text-xs text-blue-700 mt-1">
                {data.labourCostPerWash <= 150
                  ? "✅ Currently meeting target"
                  : `⚠️ Currently ₹${data.labourCostPerWash - 150} above target`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City Comparison Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">City-wise Labour Cost Comparison</CardTitle>
            <Badge variant="outline">analyticsEngine</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" orientation="left"  tick={{ fontSize: 11 }} width={50} />
              <YAxis yAxisId="right" orientation="right"  tick={{ fontSize: 11 }} width={50} />
              <RechartsTooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Legend />
              <Bar key="costPerWash" yAxisId="left" dataKey="costPerWash" fill="#3b82f6" name="Cost Per Wash (₹)" />
              <Bar key="efficiency" yAxisId="right" dataKey="efficiency" fill="#10b981" name="Efficiency Score (%)" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {CITY_LABOUR_DATA.map((city) => (
              <div
                key={city.city}
                className={`p-3 border rounded-lg ${
                  selectedCity === city.city ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-200"
                }`}
              >
                <p className="text-sm font-medium">{city.city}</p>
                <p className="text-xs text-muted-foreground mt-1">Cost: ₹{city.labourCostPerWash}</p>
                <p className="text-xs text-muted-foreground">Efficiency: {city.labourEfficiencyScore}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LabourCostPerWash;
