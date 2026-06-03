import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  MapPin,
  Users,
  User,
  TrendingDown,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  ArrowUpDown,
  ChevronRight,
  Target,
  DollarSign,
  Clock,
  Package,
} from "lucide-react";
import { WASHER_PERFORMANCE_DATA } from "../../data/washerPerformanceData";
import { useCity } from "../../contexts/CityContext";

// Synchronized data for Cost Per Wash Analysis - Doorstep Service Model
// Hierarchy: City → PIN Zones → Supervisors → Washers

const getCostPerWashData = (cityName: string) => {
  // Group by city
  const cities = [
    {
      id: cityName.toLowerCase(),
      name: cityName,
      totalWashes: WASHER_PERFORMANCE_DATA.reduce((sum, w) => sum + w.jobsCompleted, 0),
      totalCost: WASHER_PERFORMANCE_DATA.reduce((sum, w) => sum + (w.jobsCompleted * w.actualCostPerWash), 0),
      costPerWash: 61.04, // Calculated average
      pinZones: 8,
      supervisors: 1,
      washers: WASHER_PERFORMANCE_DATA.length,
      trend: -2.5,
      breakdown: {
        materials: 28.50,
        labor: 22.00,
        overhead: 8.54,
        equipment: 1.00,
        variables: 1.00,
      },
    },
  ];

  // Group by PIN code zones
  const pinZones = [
    {
      id: "395005",
      pinCode: "395005",
      areaName: "Vesu",
      city: cityName,
      totalWashes: WASHER_PERFORMANCE_DATA.filter(w => w.pinCode === "395005").reduce((sum, w) => sum + w.jobsCompleted, 0),
      totalCost: WASHER_PERFORMANCE_DATA.filter(w => w.pinCode === "395005").reduce((sum, w) => sum + (w.jobsCompleted * w.actualCostPerWash), 0),
      costPerWash: 61.04,
      supervisors: 1,
      washers: WASHER_PERFORMANCE_DATA.filter(w => w.pinCode === "395005").length,
      avgWashesPerDay: 18,
      trend: -3.2,
      efficiency: 92,
      breakdown: {
        materials: 28.50,
        labor: 22.00,
        overhead: 8.54,
        equipment: 1.00,
        variables: 1.00,
      },
    },
    {
      id: "395001",
      pinCode: "395001",
      areaName: "Adajan",
      city: cityName,
      totalWashes: WASHER_PERFORMANCE_DATA.filter(w => w.pinCode === "395001").reduce((sum, w) => sum + w.jobsCompleted, 0),
      totalCost: WASHER_PERFORMANCE_DATA.filter(w => w.pinCode === "395001").reduce((sum, w) => sum + (w.jobsCompleted * w.actualCostPerWash), 0),
      costPerWash: 59.20,
      supervisors: 1,
      washers: WASHER_PERFORMANCE_DATA.filter(w => w.pinCode === "395001").length,
      avgWashesPerDay: 21,
      trend: -1.8,
      efficiency: 94,
      breakdown: {
        materials: 27.80,
        labor: 21.50,
        overhead: 8.00,
        equipment: 0.90,
        variables: 1.00,
      },
    },
    {
      id: "395004",
      pinCode: "395004",
      areaName: "Althan",
      city: cityName,
      totalWashes: WASHER_PERFORMANCE_DATA.filter(w => w.pinCode === "395004").reduce((sum, w) => sum + w.jobsCompleted, 0),
      totalCost: WASHER_PERFORMANCE_DATA.filter(w => w.pinCode === "395004").reduce((sum, w) => sum + (w.jobsCompleted * w.actualCostPerWash), 0),
      costPerWash: 58.75,
      supervisors: 1,
      washers: WASHER_PERFORMANCE_DATA.filter(w => w.pinCode === "395004").length,
      avgWashesPerDay: 19,
      trend: -2.1,
      efficiency: 93,
      breakdown: {
        materials: 27.50,
        labor: 21.25,
        overhead: 8.10,
        equipment: 0.90,
        variables: 1.00,
      },
    },
  ];

  // Supervisors data
  const supervisors = [
    {
      id: "supervisor-ramesh",
      name: "Ramesh Patel",
      pinZone: "395005",
      areaName: "Vesu",
      city: cityName,
      totalWashes: WASHER_PERFORMANCE_DATA.reduce((sum, w) => sum + w.jobsCompleted, 0),
      totalCost: WASHER_PERFORMANCE_DATA.reduce((sum, w) => sum + (w.jobsCompleted * w.actualCostPerWash), 0),
      costPerWash: 61.04,
      washers: WASHER_PERFORMANCE_DATA.length,
      avgWashesPerWasher: Math.round(WASHER_PERFORMANCE_DATA.reduce((sum, w) => sum + w.jobsCompleted, 0) / WASHER_PERFORMANCE_DATA.length),
      trend: -2.5,
      efficiency: 92,
      breakdown: {
        materials: 28.50,
        labor: 22.00,
        overhead: 8.54,
        equipment: 1.00,
        variables: 1.00,
      },
    },
  ];

  // Washers - use actual synchronized data
  const washers = WASHER_PERFORMANCE_DATA.map(washer => ({
    id: washer.id,
    name: washer.washerName,
    supervisor: "Ramesh Patel",
    pinZone: washer.pinCode,
    areaName: washer.pinCode === "395005" ? "Vesu" : washer.pinCode === "395001" ? "Adajan" : "Althan",
    city: "Surat",
    totalWashes: washer.jobsCompleted,
    totalCost: washer.jobsCompleted * washer.actualCostPerWash,
    costPerWash: washer.actualCostPerWash,
    standardCost: washer.standardCostPerWash,
    variance: washer.actualCostPerWash - washer.standardCostPerWash,
    variancePercent: washer.variancePercent,
    avgWashesPerDay: Math.round(washer.jobsCompleted / 26), // March has 26 working days
    avgTimePerWash: 32,
    materialEfficiency: 94,
    trend: washer.variancePercent > 0 ? washer.variancePercent : -Math.abs(washer.variancePercent),
    rating: 4.7,
    breakdown: {
      materials: washer.actualMaterialCost,
      labor: washer.actualLaborCost,
      overhead: washer.actualOverheadCost,
      equipment: 1.00,
      variables: 1.00,
    },
  }));

  return { cities, pinZones, supervisors, washers };
};

type ViewLevel = "city" | "pinZone" | "supervisor" | "washer";

export function CostPerWashReport() {
  const { city, cityInfo } = useCity();
  const mockData = getCostPerWashData(cityInfo.displayName);
  const [viewLevel, setViewLevel] = useState<ViewLevel>("city");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedPinZone, setSelectedPinZone] = useState<string>("all");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("costPerWash");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [period, setPeriod] = useState<string>("current-month");

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getCostHealthColor = (cost: number) => {
    if (cost <= 220) return "text-green-600 bg-green-50";
    if (cost <= 260) return "text-blue-600 bg-blue-50";
    if (cost <= 300) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getTrendIcon = (trend: number) => {
    if (trend < 0) {
      return <TrendingDown className="w-4 h-4 text-green-600" />;
    }
    return <TrendingUp className="w-4 h-4 text-red-600" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend < 0) return "text-green-600";
    return "text-red-600";
  };

  // Filter data based on selections
  const getFilteredData = () => {
    switch (viewLevel) {
      case "city":
        return mockData.cities;
      case "pinZone":
        return selectedCity === "all"
          ? mockData.pinZones
          : mockData.pinZones.filter((s) => s.city === selectedCity);
      case "supervisor":
        let sups = mockData.supervisors;
        if (selectedCity !== "all") {
          sups = sups.filter((s) => s.city === selectedCity);
        }
        if (selectedPinZone !== "all") {
          sups = sups.filter((s) => s.pinZone === selectedPinZone);
        }
        return sups;
      case "washer":
        let washers = mockData.washers;
        if (selectedCity !== "all") {
          washers = washers.filter((w) => w.city === selectedCity);
        }
        if (selectedPinZone !== "all") {
          washers = washers.filter((w) => w.pinZone === selectedPinZone);
        }
        if (selectedSupervisor !== "all") {
          washers = washers.filter((w) => w.supervisor === selectedSupervisor);
        }
        return washers;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cost per Wash Analysis Report
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Hierarchical cost breakdown across cities, PIN zones, supervisors, and
            washers
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters & Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* View Level */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                View Level
              </label>
              <Select
                value={viewLevel}
                onValueChange={(value) => setViewLevel(value as ViewLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="city">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      City Level
                    </div>
                  </SelectItem>
                  <SelectItem value="pinZone">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      PIN Zone Level
                    </div>
                  </SelectItem>
                  <SelectItem value="supervisor">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Supervisor Level
                    </div>
                  </SelectItem>
                  <SelectItem value="washer">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Washer Level
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                City
              </label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value={cityInfo.displayName}>{cityInfo.displayName}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PIN Zone Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                PIN Zone
              </label>
              <Select
                value={selectedPinZone}
                onValueChange={setSelectedPinZone}
                disabled={viewLevel === "city"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All PIN Zones</SelectItem>
                  {mockData.pinZones
                    .filter(
                      (s) =>
                        selectedCity === "all" || s.city === selectedCity
                    )
                    .map((pinZone) => (
                      <SelectItem key={pinZone.id} value={pinZone.areaName}>
                        {pinZone.areaName} ({pinZone.pinCode})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supervisor Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Supervisor
              </label>
              <Select
                value={selectedSupervisor}
                onValueChange={setSelectedSupervisor}
                disabled={viewLevel !== "washer"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Supervisors</SelectItem>
                  {mockData.supervisors
                    .filter(
                      (s) =>
                        (selectedCity === "all" || s.city === selectedCity) &&
                        (selectedPinZone === "all" || s.pinZone === selectedPinZone)
                    )
                    .map((sup) => (
                      <SelectItem key={sup.id} value={sup.name}>
                        {sup.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                <Calendar className="w-3 h-3 inline mr-1" />
                Period
              </label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Current Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Washes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {getFilteredData()
                    .reduce((sum, item: any) => sum + item.totalWashes, 0)
                    .toLocaleString()}
                </p>
              </div>
              <Target className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹
                  {(
                    getFilteredData().reduce(
                      (sum, item: any) => sum + item.totalCost,
                      0
                    ) / 100000
                  ).toFixed(2)}
                  L
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Cost per Wash</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹
                  {Math.round(
                    getFilteredData().reduce(
                      (sum, item: any) => sum + item.totalCost,
                      0
                    ) /
                      getFilteredData().reduce(
                        (sum, item: any) => sum + item.totalWashes,
                        0
                      )
                  )}
                </p>
              </div>
              <Package className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Efficiency Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {viewLevel === "washer" || viewLevel === "supervisor"
                    ? Math.round(
                        getFilteredData().reduce(
                          (sum, item: any) => sum + (item.efficiency || 90),
                          0
                        ) / getFilteredData().length
                      )
                    : "N/A"}
                  {(viewLevel === "washer" || viewLevel === "supervisor") &&
                    "%"}
                </p>
              </div>
              <Clock className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {viewLevel === "city" && (
                <>
                  <MapPin className="w-5 h-5 inline mr-2" />
                  City Level Analysis
                </>
              )}
              {viewLevel === "pinZone" && (
                <>
                  <MapPin className="w-5 h-5 inline mr-2" />
                  PIN Zone Level Analysis
                </>
              )}
              {viewLevel === "supervisor" && (
                <>
                  <Users className="w-5 h-5 inline mr-2" />
                  Supervisor Level Analysis
                </>
              )}
              {viewLevel === "washer" && (
                <>
                  <User className="w-5 h-5 inline mr-2" />
                  Washer Level Analysis
                </>
              )}
            </span>
            <Badge variant="outline">
              {getFilteredData().length} {viewLevel}(s)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    {viewLevel === "city" && "City"}
                    {viewLevel === "pinZone" && "PIN Zone"}
                    {viewLevel === "supervisor" && "Supervisor"}
                    {viewLevel === "washer" && "Washer"}
                  </th>
                  {viewLevel !== "city" && (
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Location
                    </th>
                  )}
                  <th
                    className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("totalWashes")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Total Washes
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("costPerWash")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Cost/Wash
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Total Cost
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Trend
                  </th>
                  {(viewLevel === "supervisor" || viewLevel === "washer") && (
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Efficiency
                    </th>
                  )}
                  {viewLevel === "washer" && (
                    <>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                        Avg/Day
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                        Avg Time
                      </th>
                    </>
                  )}
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Cost Breakdown
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {viewLevel === "city" &&
                  (mockData.cities as any[]).map((city) => (
                    <tr key={city.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <MapPin className="w-8 h-8 text-blue-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {city.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {city.pinZones} PIN zones • {city.supervisors}{" "}
                              supervisors • {city.washers} washers
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        {city.totalWashes.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          className={`${getCostHealthColor(
                            city.costPerWash
                          )} font-semibold`}
                        >
                          ₹{city.costPerWash}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                        ₹{(city.totalCost / 100000).toFixed(2)}L
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(city.trend)}
                          <span
                            className={`text-sm font-medium ${getTrendColor(
                              city.trend
                            )}`}
                          >
                            {Math.abs(city.trend)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-600">Mat</span>
                              <span className="font-medium">
                                ₹{city.breakdown.materials}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-600">Lab</span>
                              <span className="font-medium">
                                ₹{city.breakdown.labor}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Ovr</span>
                              <span className="font-medium">
                                ₹{city.breakdown.overhead}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}

                {viewLevel === "pinZone" &&
                  getFilteredData().map((pinZone: any) => (
                    <tr key={pinZone.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <MapPin className="w-8 h-8 text-purple-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {pinZone.areaName} ({pinZone.pinCode})
                            </div>
                            <div className="text-xs text-gray-500">
                              {pinZone.supervisors} supervisors • {pinZone.washers}{" "}
                              washers
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {pinZone.city}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        {pinZone.totalWashes.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          className={`${getCostHealthColor(
                            pinZone.costPerWash
                          )} font-semibold`}
                        >
                          ₹{pinZone.costPerWash}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                        ₹{(pinZone.totalCost / 100000).toFixed(2)}L
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(pinZone.trend)}
                          <span
                            className={`text-sm font-medium ${getTrendColor(
                              pinZone.trend
                            )}`}
                          >
                            {Math.abs(pinZone.trend)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-600">Mat</span>
                              <span className="font-medium">
                                ₹{pinZone.breakdown.materials}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-600">Lab</span>
                              <span className="font-medium">
                                ₹{pinZone.breakdown.labor}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Ovr</span>
                              <span className="font-medium">
                                ₹{pinZone.breakdown.overhead}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}

                {viewLevel === "supervisor" &&
                  getFilteredData().map((sup: any) => (
                    <tr key={sup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <Users className="w-8 h-8 text-green-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {sup.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {sup.washers} washers •{" "}
                              {sup.avgWashesPerWasher.toFixed(0)} avg/washer
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{sup.areaName} ({sup.pinZone})</div>
                        <div className="text-xs text-gray-500">{sup.city}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        {sup.totalWashes.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          className={`${getCostHealthColor(
                            sup.costPerWash
                          )} font-semibold`}
                        >
                          ₹{sup.costPerWash}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                        ₹{(sup.totalCost / 100000).toFixed(2)}L
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(sup.trend)}
                          <span
                            className={`text-sm font-medium ${getTrendColor(
                              sup.trend
                            )}`}
                          >
                            {Math.abs(sup.trend)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          className={
                            sup.efficiency >= 90
                              ? "bg-green-100 text-green-800"
                              : sup.efficiency >= 85
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {sup.efficiency}%
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-600">Mat</span>
                              <span className="font-medium">
                                ₹{sup.breakdown.materials}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-600">Lab</span>
                              <span className="font-medium">
                                ₹{sup.breakdown.labor}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Ovr</span>
                              <span className="font-medium">
                                ₹{sup.breakdown.overhead}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}

                {viewLevel === "washer" &&
                  getFilteredData().map((washer: any) => (
                    <tr key={washer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <User className="w-8 h-8 text-orange-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {washer.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Rating: {washer.rating}/5.0
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {washer.areaName} ({washer.pinZone})
                        </div>
                        <div className="text-xs text-gray-500">
                          Sup: {washer.supervisor}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        {washer.totalWashes.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          className={`${getCostHealthColor(
                            washer.costPerWash
                          )} font-semibold`}
                        >
                          ₹{washer.costPerWash}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                        ₹{(washer.totalCost / 1000).toFixed(1)}K
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(washer.trend)}
                          <span
                            className={`text-sm font-medium ${getTrendColor(
                              washer.trend
                            )}`}
                          >
                            {Math.abs(washer.trend)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          className={
                            washer.materialEfficiency >= 95
                              ? "bg-green-100 text-green-800"
                              : washer.materialEfficiency >= 90
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {washer.materialEfficiency}%
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        {washer.avgWashesPerDay}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        {washer.avgTimePerWash}m
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-600">Mat</span>
                              <span className="font-medium">
                                ₹{washer.breakdown.materials}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-600">Lab</span>
                              <span className="font-medium">
                                ₹{washer.breakdown.labor}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Ovr</span>
                              <span className="font-medium">
                                ₹{washer.breakdown.overhead}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-green-600" />
              Top Performers (Lowest Cost)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getFilteredData()
                .sort((a: any, b: any) => a.costPerWash - b.costPerWash)
                .slice(0, 3)
                .map((item: any, index: number) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                        {viewLevel !== "city" && (
                          <div className="text-xs text-gray-500">
                            {item.store || item.city}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ₹{item.costPerWash}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.totalWashes} washes
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Needs Attention (Highest Cost)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getFilteredData()
                .sort((a: any, b: any) => b.costPerWash - a.costPerWash)
                .slice(0, 3)
                .map((item: any, index: number) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                        {viewLevel !== "city" && (
                          <div className="text-xs text-gray-500">
                            {item.store || item.city}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        ₹{item.costPerWash}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.totalWashes} washes
                      </div>
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