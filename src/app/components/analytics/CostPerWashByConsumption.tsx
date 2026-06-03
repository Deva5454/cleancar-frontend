/**
 * ============================================================================
 * COST BY CONSUMPTION ANALYSIS
 * ============================================================================
 *
 * Hierarchical cost tracking at Washer/Supervisor/City levels.
 *
 * Features:
 * - Washer-level consumption and costs
 * - Supervisor team-level aggregation
 * - City-level cost rollups
 * - Breakdown charts and comparisons
 * - Performance variance tracking
 *
 * PHASE 3: Specialized view in analytics section
 * - Route: /analytics/unit-economics/cost-by-consumption
 * - All calculations use central cost engine
 * - Related: CostPerWashModule (main dashboard)
 *
 * All cost calculations use calculateCostPerWash() from centralCostEngine
 *
 * ============================================================================
 */
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BackButton } from "../ui/back-button";
import { toast } from "sonner";
import {
  Calculator,
  Users,
  Building2,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useCity } from "../../contexts/CityContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useInventory } from "../../contexts/InventoryContext";
import { useJobs } from "../../contexts/JobContext";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { MASTER_EMPLOYEES } from "../../data/employeeData";
import {
  calculateCostPerWash as calculateCostPerWashCentral,
  type CostCalculationInputs,
} from "../../services/centralCostEngine";

const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"];

// Mock consumption data for washers (fallback)
const MOCK_WASHER_CONSUMPTION_DATA = [
  {
    washerId: "CW-101",
    washerName: "Ravi Verma",
    city: "Surat",
    supervisor: "Karthik Iyer",
    totalWashes: 145,
    materialCost: 8520, // Total material cost for the month
    consumablesCost: 2175,
    waterCost: 145,
    fuelCost: 2175, // Transport to customer locations
    overheadAllocation: 3625, // Pro-rata overhead
    equipmentCost: 884, // Pro-rata equipment cost
    period: "March 2026",
  },
  {
    washerId: "CW-102",
    washerName: "Suresh Yadav",
    city: "Surat",
    supervisor: "Karthik Iyer",
    totalWashes: 138,
    materialCost: 8142,
    consumablesCost: 2070,
    waterCost: 138,
    fuelCost: 2070,
    overheadAllocation: 3450,
    equipmentCost: 841,
    period: "March 2026",
  },
  {
    washerId: "CW-103",
    washerName: "Mohan Singh",
    city: "Surat",
    supervisor: "Karthik Iyer",
    totalWashes: 152,
    materialCost: 8968,
    consumablesCost: 2280,
    waterCost: 152,
    fuelCost: 2280,
    overheadAllocation: 3800,
    equipmentCost: 926,
    period: "March 2026",
  },
  {
    washerId: "CW-104",
    washerName: "Anil Kumar",
    city: "Navsari",
    supervisor: "Rakesh Sharma",
    totalWashes: 122,
    materialCost: 7198,
    consumablesCost: 1830,
    waterCost: 122,
    fuelCost: 1830,
    overheadAllocation: 3050,
    equipmentCost: 743,
    period: "March 2026",
  },
  {
    washerId: "CW-105",
    washerName: "Deepak Patel",
    city: "Navsari",
    supervisor: "Rakesh Sharma",
    totalWashes: 118,
    materialCost: 6962,
    consumablesCost: 1770,
    waterCost: 118,
    fuelCost: 1770,
    overheadAllocation: 2950,
    equipmentCost: 719,
    period: "March 2026",
  },
];

// Mock supervisor teams
const SUPERVISOR_TEAMS = [
  {
    supervisorId: "FS-301",
    supervisorName: "Karthik Iyer",
    city: "Surat",
    teamWashers: ["CW-101", "CW-102", "CW-103"],
    totalWashes: 435, // Sum of team
    totalMaterialCost: 25630,
    totalConsumablesCost: 6525,
    totalWaterCost: 435,
    totalFuelCost: 6525,
    totalOverheadAllocation: 10875,
    totalEquipmentCost: 2651,
    supervisorSalary: 32000,
    period: "March 2026",
  },
  {
    supervisorId: "FS-302",
    supervisorName: "Rakesh Sharma",
    city: "Navsari",
    teamWashers: ["CW-104", "CW-105"],
    totalWashes: 240,
    totalMaterialCost: 14160,
    totalConsumablesCost: 3600,
    totalWaterCost: 240,
    totalFuelCost: 3600,
    totalOverheadAllocation: 6000,
    totalEquipmentCost: 1462,
    supervisorSalary: 30000,
    period: "March 2026",
  },
];

// Mock city-level data
const CITY_CONSUMPTION_DATA = [
  {
    city: "Surat",
    totalWashers: 8,
    totalSupervisors: 2,
    totalWashes: 1248,
    totalMaterialCost: 73632,
    totalConsumablesCost: 18720,
    totalWaterCost: 1248,
    totalFuelCost: 18720,
    totalOverheadAllocation: 31200,
    totalEquipmentCost: 7603,
    totalManpowerCost: 184000, // 8 washers × 15000 + 2 supervisors × 32000
    period: "March 2026",
  },
  {
    city: "Navsari",
    totalWashers: 5,
    totalSupervisors: 1,
    totalWashes: 692,
    totalMaterialCost: 40828,
    totalConsumablesCost: 10380,
    totalWaterCost: 692,
    totalFuelCost: 10380,
    totalOverheadAllocation: 17300,
    totalEquipmentCost: 4215,
    totalManpowerCost: 105000, // 5 washers × 15000 + 1 supervisor × 30000
    period: "March 2026",
  },
];

function CostPerWashByConsumption() {
  const { city, cityInfo } = useCity();
  const { employees } = useEmployee();
  const { inventory, stockTransactions } = useInventory();
  const { allJobs } = useJobs();

  const WASHER_CONSUMPTION_DATA = useMemo(() => {
    const cityWashers = employees.filter(e =>
      e.designation === "Car Washer" && e.status === "Active" &&
      (e.workLocation === city || e.cityId === city)
    );
    return cityWashers.map(w => {
      const washerJobs = allJobs.filter(j =>
        j.washerId === w.id && (j.status === "Completed" || j.status === "Verified")
      );
      const issuances = stockTransactions.filter(t =>
        t.toId === w.id && t.type === "Issue" && t.status === "Completed"
      );
      const materialCost = issuances.reduce((s, t) => {
        const item = inventory.find(i => i.itemId === t.itemId);
        return s + t.quantity * (item?.unitCost || 0);
      }, 0);
      const supervisorEmp = employees.find(e => e.id === w.reportingManager || e.fullName === w.reportingManager);
      return {
        washerId: w.id,
        washerName: w.fullName,
        city: cityInfo.displayName,
        supervisor: supervisorEmp?.fullName || w.reportingManager || "Unknown",
        totalWashes: washerJobs.length,
        materialCost,
        consumablesCost: Math.round(materialCost * 0.25),
        waterCost: washerJobs.length,
        fuelCost: Math.round(washerJobs.length * 15),
        overheadAllocation: Math.round(washerJobs.length * 25),
        equipmentCost: Math.round(washerJobs.length * 6),
        period: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }),
      };
    });
  }, [city, employees, allJobs, inventory, stockTransactions, cityInfo.displayName]);

  // Fallback to mock if no real data
  const displayWasherData = WASHER_CONSUMPTION_DATA.length > 0
    ? WASHER_CONSUMPTION_DATA : MOCK_WASHER_CONSUMPTION_DATA;

  const [selectedLevel, setSelectedLevel] = useState<"washer" | "supervisor" | "city">("washer");
  const [selectedWasher, setSelectedWasher] = useState(displayWasherData[0].washerId);
  const [selectedSupervisor, setSelectedSupervisor] = useState(SUPERVISOR_TEAMS[0].supervisorId);
  const [selectedCity, setSelectedCity] = useState(() => cityInfo.displayName);

  // Calculate washer cost per wash using central engine
  const calculateWasherCost = (washerId: string) => {
    const washer = displayWasherData.find((w) => w.washerId === washerId);
    if (!washer) return null;

    // Map washer data to central engine inputs
    const inputs: CostCalculationInputs = {
      labourCost: 0, // Labour tracked separately at supervisor/city level
      consumablesCost: washer.materialCost + washer.consumablesCost,
      utilitiesCost: washer.waterCost,
      fixedCosts: washer.overheadAllocation,
      maintenanceCost: washer.equipmentCost,
      transportCost: washer.fuelCost,
      totalWashes: washer.totalWashes,
    };

    // Calculate using central engine
    const result = calculateCostPerWashCentral(inputs);

    return {
      washer,
      totalCost: result.totalCost,
      costPerWash: Math.round(result.costPerWash),
      breakdown: {
        materials: Math.round((washer.materialCost / washer.totalWashes) * 100) / 100,
        consumables: Math.round((washer.consumablesCost / washer.totalWashes) * 100) / 100,
        water: Math.round((washer.waterCost / washer.totalWashes) * 100) / 100,
        fuel: Math.round((washer.fuelCost / washer.totalWashes) * 100) / 100,
        overhead: Math.round((washer.overheadAllocation / washer.totalWashes) * 100) / 100,
        equipment: Math.round((washer.equipmentCost / washer.totalWashes) * 100) / 100,
      },
    };
  };

  // Calculate supervisor team cost per wash using central engine
  const calculateSupervisorCost = (supervisorId: string) => {
    const team = SUPERVISOR_TEAMS.find((t) => t.supervisorId === supervisorId);
    if (!team) return null;

    // Map team data to central engine inputs
    const inputs: CostCalculationInputs = {
      labourCost: team.supervisorSalary,
      consumablesCost: team.totalMaterialCost + team.totalConsumablesCost,
      utilitiesCost: team.totalWaterCost,
      fixedCosts: team.totalOverheadAllocation,
      maintenanceCost: team.totalEquipmentCost,
      transportCost: team.totalFuelCost,
      totalWashes: team.totalWashes,
    };

    // Calculate using central engine
    const result = calculateCostPerWashCentral(inputs);

    return {
      team,
      totalCost: result.totalCost,
      costPerWash: Math.round(result.costPerWash),
      breakdown: {
        materials: Math.round((team.totalMaterialCost / team.totalWashes) * 100) / 100,
        consumables: Math.round((team.totalConsumablesCost / team.totalWashes) * 100) / 100,
        water: Math.round((team.totalWaterCost / team.totalWashes) * 100) / 100,
        fuel: Math.round((team.totalFuelCost / team.totalWashes) * 100) / 100,
        overhead: Math.round((team.totalOverheadAllocation / team.totalWashes) * 100) / 100,
        equipment: Math.round((team.totalEquipmentCost / team.totalWashes) * 100) / 100,
        supervision: Math.round((team.supervisorSalary / team.totalWashes) * 100) / 100,
      },
    };
  };

  // Calculate city cost per wash using central engine
  const calculateCityCost = (city: string) => {
    const cityData = CITY_CONSUMPTION_DATA.find((c) => c.city === city);
    if (!cityData) return null;

    // Map city data to central engine inputs
    const inputs: CostCalculationInputs = {
      labourCost: cityData.totalManpowerCost,
      consumablesCost: cityData.totalMaterialCost + cityData.totalConsumablesCost,
      utilitiesCost: cityData.totalWaterCost,
      fixedCosts: cityData.totalOverheadAllocation,
      maintenanceCost: cityData.totalEquipmentCost,
      transportCost: cityData.totalFuelCost,
      totalWashes: cityData.totalWashes,
    };

    // Calculate using central engine
    const result = calculateCostPerWashCentral(inputs);

    return {
      cityData,
      totalCost: result.totalCost,
      costPerWash: Math.round(result.costPerWash),
      breakdown: {
        materials: Math.round((cityData.totalMaterialCost / cityData.totalWashes) * 100) / 100,
        consumables: Math.round((cityData.totalConsumablesCost / cityData.totalWashes) * 100) / 100,
        water: Math.round((cityData.totalWaterCost / cityData.totalWashes) * 100) / 100,
        fuel: Math.round((cityData.totalFuelCost / cityData.totalWashes) * 100) / 100,
        overhead: Math.round((cityData.totalOverheadAllocation / cityData.totalWashes) * 100) / 100,
        equipment: Math.round((cityData.totalEquipmentCost / cityData.totalWashes) * 100) / 100,
        manpower: Math.round((cityData.totalManpowerCost / cityData.totalWashes) * 100) / 100,
      },
    };
  };

  const washerResult = selectedLevel === "washer" ? calculateWasherCost(selectedWasher) : null;
  const supervisorResult = selectedLevel === "supervisor" ? calculateSupervisorCost(selectedSupervisor) : null;
  const cityResult = selectedLevel === "city" ? calculateCityCost(selectedCity) : null;

  const getHealthStatus = (cost: number) => {
    if (cost <= 180)
      return {
        label: "Excellent",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle2 className="w-4 h-4" />,
      };
    if (cost <= 220)
      return {
        label: "Good",
        color: "bg-blue-100 text-blue-800",
        icon: <CheckCircle2 className="w-4 h-4" />,
      };
    if (cost <= 260)
      return {
        label: "Average",
        color: "bg-yellow-100 text-yellow-800",
        icon: <AlertCircle className="w-4 h-4" />,
      };
    return {
      label: "High",
      color: "bg-red-100 text-red-800",
      icon: <AlertCircle className="w-4 h-4" />,
    };
  };

  return (
    <div className="space-y-6">
      <BackButton to="/analytics" />

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="w-7 h-7 text-blue-600" />
          Cost per Wash Calculator - By Consumption
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Calculate actual cost per wash based on real consumption data at Washer, Supervisor Team, and City levels
        </p>
      </div>

      {/* Level Selection Tabs */}
      <Tabs value={selectedLevel} onValueChange={(value: any) => setSelectedLevel(value)} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="washer" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Washer Level
          </TabsTrigger>
          <TabsTrigger value="supervisor" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Supervisor Team
          </TabsTrigger>
          <TabsTrigger value="city" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            City Level
          </TabsTrigger>
        </TabsList>

        {/* Washer Level */}
        <TabsContent value="washer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Washer Selection */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Select Washer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {displayWasherData.map((washer) => (
                  <Button
                    key={washer.washerId}
                    variant={selectedWasher === washer.washerId ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedWasher(washer.washerId)}
                  >
                    <div className="text-left">
                      <div className="font-semibold">{washer.washerName}</div>
                      <div className="text-xs opacity-80">
                        {washer.washerId} • {washer.city}
                      </div>
                      <div className="text-xs opacity-70">{washer.totalWashes} washes</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-2 space-y-6">
              {washerResult && (
                <>
                  {/* Main Result */}
                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">Cost per Wash</div>
                        <div className="text-5xl font-bold text-gray-900 mb-3">
                          ₹{washerResult.costPerWash}
                        </div>
                        <Badge className={`${getHealthStatus(washerResult.costPerWash).color} flex items-center gap-1 justify-center`}>
                          {getHealthStatus(washerResult.costPerWash).icon}
                          {getHealthStatus(washerResult.costPerWash).label}
                        </Badge>
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <div className="text-xs text-gray-600">Total Washes</div>
                              <div className="text-xl font-semibold text-gray-800">
                                {washerResult.washer.totalWashes}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Total Cost</div>
                              <div className="text-xl font-semibold text-gray-800">
                                ₹{(washerResult?.totalCost ?? 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cost Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cost Breakdown (Per Wash)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Materials</span>
                        </div>
                        <span className="font-semibold">₹{(washerResult?.breakdown?.materials ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Consumables</span>
                        </div>
                        <span className="font-semibold">₹{(washerResult?.breakdown?.consumables ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-cyan-600" />
                          <span className="text-sm font-medium">Water</span>
                        </div>
                        <span className="font-semibold">₹{(washerResult?.breakdown?.water ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">Fuel/Transport</span>
                        </div>
                        <span className="font-semibold">₹{(washerResult?.breakdown?.fuel ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Overhead (Allocated)</span>
                        </div>
                        <span className="font-semibold">₹{(washerResult?.breakdown?.overhead ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium">Equipment</span>
                        </div>
                        <span className="font-semibold">₹{(washerResult?.breakdown?.equipment ?? 0).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Washer Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Washer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Name:</span>
                          <span className="ml-2 font-semibold">{washerResult.washer.washerName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">ID:</span>
                          <span className="ml-2 font-semibold">{washerResult.washer.washerId}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">City:</span>
                          <span className="ml-2 font-semibold">{washerResult.washer.city}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Supervisor:</span>
                          <span className="ml-2 font-semibold">{washerResult.washer.supervisor}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Period:</span>
                          <span className="ml-2 font-semibold">{washerResult.washer.period}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Supervisor Team Level */}
        <TabsContent value="supervisor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Supervisor Selection */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Select Supervisor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {SUPERVISOR_TEAMS.map((team) => (
                  <Button
                    key={team.supervisorId}
                    variant={selectedSupervisor === team.supervisorId ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedSupervisor(team.supervisorId)}
                  >
                    <div className="text-left">
                      <div className="font-semibold">{team.supervisorName}</div>
                      <div className="text-xs opacity-80">
                        {team.supervisorId} • {team.city}
                      </div>
                      <div className="text-xs opacity-70">
                        {team.teamWashers.length} washers • {team.totalWashes} washes
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-2 space-y-6">
              {supervisorResult && (
                <>
                  {/* Main Result */}
                  <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">Team Cost per Wash</div>
                        <div className="text-5xl font-bold text-gray-900 mb-3">
                          ₹{supervisorResult.costPerWash}
                        </div>
                        <Badge className={`${getHealthStatus(supervisorResult.costPerWash).color} flex items-center gap-1 justify-center`}>
                          {getHealthStatus(supervisorResult.costPerWash).icon}
                          {getHealthStatus(supervisorResult.costPerWash).label}
                        </Badge>
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <div className="text-xs text-gray-600">Team Size</div>
                              <div className="text-xl font-semibold text-gray-800">
                                {supervisorResult.team.teamWashers.length}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Total Washes</div>
                              <div className="text-xl font-semibold text-gray-800">
                                {supervisorResult.team.totalWashes}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Total Cost</div>
                              <div className="text-xl font-semibold text-gray-800">
                                ₹{(supervisorResult?.totalCost ?? 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cost Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Team Cost Breakdown (Per Wash)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Materials</span>
                        </div>
                        <span className="font-semibold">₹{(supervisorResult?.breakdown?.materials ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Consumables</span>
                        </div>
                        <span className="font-semibold">₹{(supervisorResult?.breakdown?.consumables ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-cyan-600" />
                          <span className="text-sm font-medium">Water</span>
                        </div>
                        <span className="font-semibold">₹{(supervisorResult?.breakdown?.water ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">Fuel/Transport</span>
                        </div>
                        <span className="font-semibold">₹{(supervisorResult?.breakdown?.fuel ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Overhead (Allocated)</span>
                        </div>
                        <span className="font-semibold">₹{(supervisorResult?.breakdown?.overhead ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium">Equipment</span>
                        </div>
                        <span className="font-semibold">₹{(supervisorResult?.breakdown?.equipment ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border-2 border-pink-200">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-pink-600" />
                          <span className="text-sm font-medium">Supervision Cost</span>
                        </div>
                        <span className="font-semibold">₹{(supervisorResult?.breakdown?.supervision ?? 0).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Team Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Supervisor:</span>
                            <span className="ml-2 font-semibold">{supervisorResult.team.supervisorName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">ID:</span>
                            <span className="ml-2 font-semibold">{supervisorResult.team.supervisorId}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">City:</span>
                            <span className="ml-2 font-semibold">{supervisorResult.team.city}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Period:</span>
                            <span className="ml-2 font-semibold">{supervisorResult.team.period}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Team Members:</div>
                          <div className="flex flex-wrap gap-2">
                            {supervisorResult.team.teamWashers.map((washerId) => {
                              const washer = displayWasherData.find((w) => w.washerId === washerId);
                              return (
                                <Badge key={washerId} variant="outline">
                                  {washer?.washerName || washerId}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* City Level */}
        <TabsContent value="city" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* City Selection */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Select City</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {CITY_CONSUMPTION_DATA.map((city) => (
                  <Button
                    key={city.city}
                    variant={selectedCity === city.city ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCity(city.city)}
                  >
                    <div className="text-left">
                      <div className="font-semibold">{city.city}</div>
                      <div className="text-xs opacity-80">
                        {city.totalWashers} washers • {city.totalSupervisors} supervisors
                      </div>
                      <div className="text-xs opacity-70">{city.totalWashes} washes</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-2 space-y-6">
              {cityResult && (
                <>
                  {/* Main Result */}
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">City Cost per Wash</div>
                        <div className="text-5xl font-bold text-gray-900 mb-3">
                          ₹{cityResult.costPerWash}
                        </div>
                        <Badge className={`${getHealthStatus(cityResult.costPerWash).color} flex items-center gap-1 justify-center`}>
                          {getHealthStatus(cityResult.costPerWash).icon}
                          {getHealthStatus(cityResult.costPerWash).label}
                        </Badge>
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <div className="text-xs text-gray-600">Total Staff</div>
                              <div className="text-xl font-semibold text-gray-800">
                                {cityResult.cityData.totalWashers + cityResult.cityData.totalSupervisors}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Total Washes</div>
                              <div className="text-xl font-semibold text-gray-800">
                                {cityResult.cityData.totalWashes}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Total Cost</div>
                              <div className="text-xl font-semibold text-gray-800">
                                ₹{(cityResult?.totalCost ?? 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cost Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">City Cost Breakdown (Per Wash)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Materials</span>
                        </div>
                        <span className="font-semibold">₹{(cityResult?.breakdown?.materials ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Consumables</span>
                        </div>
                        <span className="font-semibold">₹{(cityResult?.breakdown?.consumables ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-cyan-600" />
                          <span className="text-sm font-medium">Water</span>
                        </div>
                        <span className="font-semibold">₹{(cityResult?.breakdown?.water ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">Fuel/Transport</span>
                        </div>
                        <span className="font-semibold">₹{(cityResult?.breakdown?.fuel ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Overhead (Allocated)</span>
                        </div>
                        <span className="font-semibold">₹{(cityResult?.breakdown?.overhead ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium">Equipment</span>
                        </div>
                        <span className="font-semibold">₹{(cityResult?.breakdown?.equipment ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border-2 border-pink-200">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-pink-600" />
                          <span className="text-sm font-medium">Manpower Cost</span>
                        </div>
                        <span className="font-semibold">₹{(cityResult?.breakdown?.manpower ?? 0).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* City Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">City Operations Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">City:</span>
                          <span className="ml-2 font-semibold">{cityResult.cityData.city}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Period:</span>
                          <span className="ml-2 font-semibold">{cityResult.cityData.period}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Washers:</span>
                          <span className="ml-2 font-semibold">{cityResult.cityData.totalWashers}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Supervisors:</span>
                          <span className="ml-2 font-semibold">{cityResult.cityData.totalSupervisors}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Washes/Washer:</span>
                          <span className="ml-2 font-semibold">
                            {Math.round(cityResult.cityData.totalWashes / cityResult.cityData.totalWashers)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Efficiency:</span>
                          <Badge className="ml-2 bg-green-100 text-green-800">
                            {Math.round(cityResult.cityData.totalWashes / cityResult.cityData.totalWashers) >= 150 ? "High" : "Medium"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CostPerWashByConsumption;
