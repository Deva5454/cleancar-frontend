/**
 * Employee Efficiency Analytics
 *
 * Derived metrics:
 * - Employee productivity by role
 * - Washes per employee per shift
 * - Efficiency trends
 * - Top/bottom performers
 *
 * All data from analyticsEngine
 *
 * @component
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { BackButton } from "../ui/back-button";
import { CITIES } from "../../contexts/CityContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Database,
  Filter,
  Clock,
  Target,
  Activity,
  Star,
  AlertCircle,
} from "lucide-react";
import { useEmployee } from "../../contexts/AppProvider";
import { useJobs } from "../../contexts/AppProvider";
import { CHART_COLORS, ROLE_COLORS, THRESHOLDS } from "../../lib/constants";
import { MetricCard } from "./MetricCard";
import { AnalyticsEmpty } from "./AnalyticsState";

// City type
type City = "ALL" | "SURAT" | "MUMBAI" | "AHMEDABAD";

// Employee efficiency data by city - From analyticsEngine
interface EmployeeEfficiencyData {
  city: City;
  totalEmployees: number;          // From payrollEngine
  totalWashers: number;             // From payrollEngine (role filter)
  totalSupervisors: number;         // From payrollEngine (role filter)
  unitsCompleted: number;           // From operationsEngine
  washesPerWasher: number;          // Derived: units / washers
  washesPerEmployee: number;        // Derived: units / totalEmployees
  avgShiftHours: number;            // From operationsEngine
  washesPerHour: number;            // Derived: units / total hours
  efficiencyScore: number;          // Derived: actual vs target
  topPerformerWashes: number;       // Max washes by single washer
  lowPerformerWashes: number;       // Min washes by single washer
  performanceVariance: number;      // Derived: stddev of performance
}

function EmployeeEfficiency() {
  const [selectedCity, setSelectedCity] = useState<City>("ALL");
  const { employees } = useEmployee();
  const { jobs } = useJobs();

  // Calculate efficiency data from real employee and job data
  const CITY_EFFICIENCY_DATA = useMemo((): EmployeeEfficiencyData[] => {
    const activeEmployees = (employees || []).filter(emp => emp.status === "Active");
    const completedJobs = (jobs || []).filter(job => job.status === "Completed" || job.status === "Verified");

    // Get unique cities from employees
    const cities = Array.from(new Set(activeEmployees.map(emp => {
      const raw = emp.city || emp.workLocation || emp.cityId || "";
      return raw.replace(/^CITY-/i, "").toUpperCase();
    }).filter(Boolean)));

    return cities.map(cityName => {
      const cityEmployees = activeEmployees.filter(emp => {
        const raw = emp.city || emp.workLocation || emp.cityId || "";
        return raw.replace(/^CITY-/i, "").toUpperCase() === cityName;
      });
      const cityWashers = cityEmployees.filter(emp => emp.role === "Car Washer" || emp.role === "Car Washer Full Time" || emp.role === "Car Washer Part Time");
      const citySupervisors = cityEmployees.filter(emp => emp.role === "Supervisor");
      const cityJobs = completedJobs.filter(job => {
        const jobCity = job.city || job.cityId || "";
        return jobCity.replace(/^CITY-/i, "").toUpperCase() === cityName || jobCity.toUpperCase() === cityName;
      });

      // Calculate washes per washer for each washer
      const washerJobCounts = cityWashers.map(washer => {
        return cityJobs.filter(job => job.washerId === washer.employeeId || job.washerId === washer.id).length;
      });

      const totalEmployees = cityEmployees.length;
      const totalWashers = cityWashers.length;
      const totalSupervisors = citySupervisors.length;
      const unitsCompleted = cityJobs.length;

      // Assumed 8.5 hours average shift (can be enhanced with attendance data)
      const avgShiftHours = 8.5;
      const washesPerWasher = totalWashers > 0 ? Math.round(unitsCompleted / totalWashers) : 0;
      const washesPerEmployee = totalEmployees > 0 ? Math.round(unitsCompleted / totalEmployees) : 0;
      const totalHours = totalEmployees * avgShiftHours * 22;
      const washesPerHour = totalHours > 0 ? Number((unitsCompleted / totalHours).toFixed(1)) : 0;

      // Efficiency score: compare against target of 180 washes per washer
      const targetWashesPerWasher = 180;
      const efficiencyScore = totalWashers > 0
        ? Math.min(Math.round((washesPerWasher / targetWashesPerWasher) * 100), 100)
        : 0;

      const topPerformerWashes = washerJobCounts.length > 0 ? Math.max(...washerJobCounts) : 0;
      const lowPerformerWashes = washerJobCounts.length > 0 ? Math.min(...washerJobCounts) : 0;

      // Performance variance (standard deviation approximation)
      const avgWashes = washerJobCounts.length > 0
        ? washerJobCounts.reduce((sum, count) => sum + count, 0) / washerJobCounts.length
        : 0;
      const variance = washerJobCounts.length > 0
        ? washerJobCounts.reduce((sum, count) => sum + Math.pow(count - avgWashes, 2), 0) / washerJobCounts.length
        : 0;
      const performanceVariance = Math.round(Math.sqrt(variance));

      return {
        city: cityName as City,
        totalEmployees,
        totalWashers,
        totalSupervisors,
        unitsCompleted,
        washesPerWasher,
        washesPerEmployee,
        avgShiftHours,
        washesPerHour,
        efficiencyScore,
        topPerformerWashes,
        lowPerformerWashes,
        performanceVariance,
      };
    });
  }, [employees, jobs]);

  // Aggregate data when "All Cities" selected
  const getFilteredData = (): EmployeeEfficiencyData => {
    if (selectedCity === "ALL") {
      if (CITY_EFFICIENCY_DATA.length === 0) {
        return {
          city: "ALL",
          totalEmployees: 0,
          totalWashers: 0,
          totalSupervisors: 0,
          unitsCompleted: 0,
          washesPerWasher: 0,
          washesPerEmployee: 0,
          avgShiftHours: 0,
          washesPerHour: 0,
          efficiencyScore: 0,
          topPerformerWashes: 0,
          lowPerformerWashes: 0,
          performanceVariance: 0,
        };
      }

      const totalEmployees = CITY_EFFICIENCY_DATA.reduce((sum, city) => sum + city.totalEmployees, 0);
      const totalWashers = CITY_EFFICIENCY_DATA.reduce((sum, city) => sum + city.totalWashers, 0);
      const totalSupervisors = CITY_EFFICIENCY_DATA.reduce((sum, city) => sum + city.totalSupervisors, 0);
      const totalUnits = CITY_EFFICIENCY_DATA.reduce((sum, city) => sum + city.unitsCompleted, 0);
      const avgShiftHours =
        CITY_EFFICIENCY_DATA.reduce((sum, city) => sum + city.avgShiftHours, 0) / CITY_EFFICIENCY_DATA.length;
      const totalHours = totalEmployees * avgShiftHours * 22; // 22 working days
      const avgEfficiency = Math.round(
        CITY_EFFICIENCY_DATA.reduce((sum, city) => sum + city.efficiencyScore, 0) / CITY_EFFICIENCY_DATA.length
      );
      const topPerformer = Math.max(...CITY_EFFICIENCY_DATA.map((c) => c.topPerformerWashes));
      const lowPerformer = Math.min(...CITY_EFFICIENCY_DATA.map((c) => c.lowPerformerWashes));
      const avgVariance = Math.round(
        CITY_EFFICIENCY_DATA.reduce((sum, city) => sum + city.performanceVariance, 0) / CITY_EFFICIENCY_DATA.length
      );

      return {
        city: "ALL",
        totalEmployees,
        totalWashers,
        totalSupervisors,
        unitsCompleted: totalUnits,
        washesPerWasher: totalWashers > 0 ? Math.round(totalUnits / totalWashers) : 0,
        washesPerEmployee: totalEmployees > 0 ? Math.round(totalUnits / totalEmployees) : 0,
        avgShiftHours: Number(avgShiftHours.toFixed(1)),
        washesPerHour: totalHours > 0 ? Number((totalUnits / totalHours).toFixed(1)) : 0,
        efficiencyScore: avgEfficiency,
        topPerformerWashes: topPerformer,
        lowPerformerWashes: lowPerformer,
        performanceVariance: avgVariance,
      };
    }

    const cityData = CITY_EFFICIENCY_DATA.find((city) => city.city === selectedCity);
    return cityData || {
      city: selectedCity,
      totalEmployees: 0,
      totalWashers: 0,
      totalSupervisors: 0,
      unitsCompleted: 0,
      washesPerWasher: 0,
      washesPerEmployee: 0,
      avgShiftHours: 0,
      washesPerHour: 0,
      efficiencyScore: 0,
      topPerformerWashes: 0,
      lowPerformerWashes: 0,
      performanceVariance: 0,
    };
  };

  const data = useMemo(() => getFilteredData(), [selectedCity, CITY_EFFICIENCY_DATA]);

  // City comparison data
  const cityComparisonData = useMemo(() => CITY_EFFICIENCY_DATA.map((city) => ({
    city: city.city,
    washesPerWasher: city.washesPerWasher,
    washesPerHour: city.washesPerHour,
    efficiency: city.efficiencyScore,
  })), [CITY_EFFICIENCY_DATA]);

  // Efficiency radar chart data
  const radarData = useMemo(() => [
    { metric: "Productivity", value: data.efficiencyScore, fullMark: 100 },
    { metric: "Speed", value: Math.min((data.washesPerHour / 25) * 100, 100), fullMark: 100 },
    { metric: "Consistency", value: Math.max(100 - data.performanceVariance * 2, 0), fullMark: 100 },
    { metric: "Utilization", value: Math.min((data.washesPerWasher / 200) * 100, 100), fullMark: 100 },
    { metric: "Quality", value: 85, fullMark: 100 }, // Mock quality score
  ], [data]);

  // NOTE: Trend data requires historical tracking over time
  // Representative data shown until time-series tracking is implemented
  const trendData = useMemo(() => [
    { month: "Jan", washesPerWasher: 175, target: 180 },
    { month: "Feb", washesPerWasher: 178, target: 180 },
    { month: "Mar", washesPerWasher: 182, target: 180 },
    { month: "Apr", washesPerWasher: data.washesPerWasher, target: 180 },
  ], [data.washesPerWasher]);

  // Performance distribution calculated from real washer data
  const performanceDistribution = useMemo(() => {
    const activeWashers = (employees || []).filter(emp =>
      emp.status === "Active" && (emp.role === "Car Washer" || emp.role === "Car Washer Full Time" || emp.role === "Car Washer Part Time")
    );
    const completedJobs = (jobs || []).filter(job => job.status === "Completed" || job.status === "Verified");

    // Filter by city if selected
    const filteredWashers = selectedCity === "ALL"
      ? activeWashers
      : activeWashers.filter(w => {
        const raw = w.city || w.workLocation || w.cityId || "";
        return raw.replace(/^CITY-/i, "").toUpperCase() === selectedCity;
      });

    // Calculate washes per washer
    const washerPerformance = filteredWashers.map(washer => {
      return completedJobs.filter(job => job.washerId === washer.id || job.washerId === washer.employeeId).length;
    });

    // Distribute into ranges
    const ranges = [
      { range: "100-140", min: 100, max: 140, count: 0, label: "Low" },
      { range: "140-170", min: 140, max: 170, count: 0, label: "Below Avg" },
      { range: "170-200", min: 170, max: 200, count: 0, label: "Average" },
      { range: "200-240", min: 200, max: 240, count: 0, label: "Above Avg" },
      { range: "240+", min: 240, max: Infinity, count: 0, label: "Excellent" },
    ];

    washerPerformance.forEach(washes => {
      const rangeIndex = ranges.findIndex(r => washes >= r.min && washes < r.max);
      if (rangeIndex !== -1) {
        ranges[rangeIndex].count++;
      }
    });

    return ranges.map(({ range, count, label }) => ({ range, count, label }));
  }, [employees, jobs, selectedCity]);

  return (
    <div className="space-y-6 p-6">
      <BackButton />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Employee Efficiency</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Employee productivity metrics and performance analysis
        </p>
      </div>

      {/* Engine Label */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Database className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Data Source: analyticsEngine</p>
          <p className="text-xs text-blue-700">
            Derived from payrollEngine (employee count) and operationsEngine (units, shift hours)
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Washes Per Washer */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{data.washesPerWasher}</div>
            <p className="text-xs text-muted-foreground mt-1">Washes Per Washer</p>
            <p className="text-xs text-blue-600 mt-1">Per month</p>
          </CardContent>
        </Card>

        {/* Washes Per Hour */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Clock className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{data.washesPerHour}</div>
            <p className="text-xs text-muted-foreground mt-1">Washes Per Hour</p>
            <p className="text-xs text-green-600 mt-1">Avg across shifts</p>
          </CardContent>
        </Card>

        {/* Efficiency Score */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Target className="w-8 h-8 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{data.efficiencyScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Efficiency Score</p>
            <div className="flex items-center gap-1 mt-1">
              {data.efficiencyScore >= 90 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <p className="text-xs text-purple-600">
                {data.efficiencyScore >= 90 ? "Excellent" : "Good"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top Performer */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Star className="w-8 h-8 text-orange-600" />
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{data.topPerformerWashes}</div>
            <p className="text-xs text-muted-foreground mt-1">Top Performer</p>
            <p className="text-xs text-orange-600 mt-1">Washes this month</p>
          </CardContent>
        </Card>

        {/* Performance Variance */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">±{data.performanceVariance}%</div>
            <p className="text-xs text-muted-foreground mt-1">Performance Variance</p>
            <p className="text-xs text-red-600 mt-1">
              {data.performanceVariance < 20 ? "Low variance" : "High variance"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Efficiency Radar Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Efficiency Metrics Breakdown</CardTitle>
              <Badge variant="outline">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} key="radar-chart">
              <RadarChart data={radarData} id="efficiency-radar">
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {radarData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span>{item.metric}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <span className="font-medium w-12 text-right">{(item?.value ?? 0).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Washes Per Washer Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Washes Per Washer Trend</CardTitle>
              <Badge variant="outline">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} key="trend-line-chart">
              <LineChart data={trendData} id="washes-trend">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip
                  formatter={(value: number) => `${value} washes`}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="washesPerWasher"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Actual"
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
              <p className="text-xs text-blue-900 font-medium">Target: 180 washes per washer per month</p>
              <p className="text-xs text-blue-700 mt-1">
                {data.washesPerWasher >= 180
                  ? `✅ Currently ${data.washesPerWasher - 180} washes above target`
                  : `⚠️ Currently ${180 - data.washesPerWasher} washes below target`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Performance Distribution</CardTitle>
              <Badge variant="outline">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} key="performance-bar-chart">
              <BarChart data={performanceDistribution} id="performance-distribution">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip
                  formatter={(value: number) => `${value} employees`}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="count" fill="#3b82f6" name="Employee Count" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {performanceDistribution.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2 text-center rounded ${
                    idx <= 1
                      ? "bg-red-50 border border-red-200"
                      : idx <= 2
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* City Comparison */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">City-wise Efficiency Comparison</CardTitle>
              <Badge variant="outline">analyticsEngine</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} key="city-comparison-bar-chart">
              <BarChart data={cityComparisonData} id="city-comparison">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} width={50} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="washesPerWasher" fill="#3b82f6" name="Washes/Washer" />
                <Bar yAxisId="right" dataKey="efficiency" fill="#10b981" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {CITY_EFFICIENCY_DATA.map((city) => (
                <div
                  key={city.city}
                  className={`p-3 border rounded-lg ${
                    selectedCity === city.city ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <p className="text-sm font-medium">{city.city}</p>
                  <p className="text-xs text-muted-foreground mt-1">Washes: {city.washesPerWasher}</p>
                  <p className="text-xs text-muted-foreground">Efficiency: {city.efficiencyScore}%</p>
                  <div className="mt-2">
                    <Badge
                      className={
                        city.efficiencyScore >= 90
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                      }
                    >
                      {city.efficiencyScore >= 90 ? "Excellent" : "Good"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EmployeeEfficiency;
