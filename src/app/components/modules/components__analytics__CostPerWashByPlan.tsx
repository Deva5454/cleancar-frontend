/**
 * ============================================================================
 * COST BY PLAN ANALYSIS
 * ============================================================================
 *
 * Plan-specific cost comparison with ideal vs actual consumption tracking.
 *
 * Features:
 * - Ideal vs Actual consumption by plan type
 * - Plan-by-plan cost comparison
 * - Variance tracking and alerts
 * - Profitability analysis per plan
 * - Auto-calculated overheads
 *
 * PHASE 3: Specialized view in analytics section
 * - Route: /analytics/unit-economics/cost-by-plan
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { BackButton } from "../ui/back-button";
import { toast } from "sonner";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Package,
  Users,
  Building,
  Wrench,
  DollarSign,
  RefreshCw,
  Info,
  Zap,
} from "lucide-react";
import {
  MATERIALS,
  CONSUMABLES,
  MANPOWER_ROLES,
  OVERHEAD_ITEMS,
  calculateMaterialCost,
  calculateConsumablesCost,
  calculateManpowerCost,
  calculateOverheadCost,
  AVG_WASHES_PER_MONTH,
} from "../../data/costData";
import { PLAN_TYPES, VEHICLE_CATEGORIES, type PlanType } from "../../data/subscriptionPlans";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import {
  calculateCostPerWash as calculateCostPerWashCentral,
  type CostCalculationInputs,
} from "../../services/centralCostEngine";

interface ConsumptionData {
  planType: PlanType;
  idealMaterialCost: number;
  actualMaterialCost: number;
  idealConsumablesCost: number;
  actualConsumablesCost: number;
  manpowerCost: number;
  overheadCost: number;
  totalIdealCost: number;
  totalActualCost: number;
  variance: number;
  variancePercentage: number;
  customerPrice: number;
  profitIdeal: number;
  profitActual: number;
  marginIdeal: number;
  marginActual: number;
}

function CostPerWashByPlan() {
  const { getPlanPrice, vehicleCategories } = usePlanDefinitions();
  const { getCentralStock } = useInventory();
  const { city } = useCity();
  const [selectedVehicle, setSelectedVehicle] = useState<string>(vehicleCategories[0]);

  // Override MATERIALS costs with real inventory unit costs
  const realMaterialCosts = useMemo(() => {
    const items = getCentralStock(city);
    const costMap: Record<string, number> = {};
    items.forEach(item => {
      costMap[item.itemName] = item.unitCost;
    });
    return costMap;
  }, [city, getCentralStock]);

  // Consumption multipliers (1.0 = ideal, >1.0 = overconsumption)
  const [consumptionMultipliers, setConsumptionMultipliers] = useState<Record<PlanType, number>>({
    "Water Wash": 1.0,
    "Water + Shampoo + Wax": 1.15,
    "Water + Shampoo + Wax": 1.2,
    "Interior": 1.1,
    "Elite Plus": 1.25,
    "One-Time Non-Member": 1.0,
    "One-Time Member": 1.0,
  });

  const calculateCostsForPlan = (planType: PlanType): ConsumptionData => {
    // PHASE 2: Use central cost engine for calculations

    // Get base costs from centralized data
    let idealMaterialCost = calculateMaterialCost(planType);

    // Override with real inventory prices where available
    const adjustedCost = MATERIALS.reduce((total, mat) => {
      const realCost = realMaterialCosts[mat.name];
      const unitCost = realCost !== undefined ? realCost / (mat.quantityPerWash * 100) : mat.costPerWash;
      return total + unitCost;
    }, 0);
    if (adjustedCost > 0) {
      idealMaterialCost = adjustedCost;
    }

    const idealConsumablesCost = calculateConsumablesCost();

    // Actual costs based on washer consumption
    const multiplier = consumptionMultipliers[planType];
    const actualMaterialCost = idealMaterialCost * multiplier;
    const actualConsumablesCost = idealConsumablesCost * multiplier;

    // Manpower cost (varies by package complexity)
    let washesPerHour = 2;
    if (planType === "Water + Shampoo + Wax" || planType === "Interior") washesPerHour = 1.5;
    if (planType === "Elite Plus") washesPerHour = 1;
    const manpowerCost = calculateManpowerCost(washesPerHour);

    // Auto-calculated overhead cost
    const overheadCost = calculateOverheadCost();

    // Calculate ideal cost using central engine (1 wash)
    const idealInputs: CostCalculationInputs = {
      labourCost: manpowerCost,
      consumablesCost: idealMaterialCost + idealConsumablesCost,
      utilitiesCost: 0,
      fixedCosts: overheadCost,
      maintenanceCost: 0,
      transportCost: 0,
      totalWashes: 1,
    };
    const idealResult = calculateCostPerWashCentral(idealInputs);
    const totalIdealCost = idealResult.costPerWash;

    // Calculate actual cost using central engine (1 wash)
    const actualInputs: CostCalculationInputs = {
      labourCost: manpowerCost,
      consumablesCost: actualMaterialCost + actualConsumablesCost,
      utilitiesCost: 0,
      fixedCosts: overheadCost,
      maintenanceCost: 0,
      transportCost: 0,
      totalWashes: 1,
    };
    const actualResult = calculateCostPerWashCentral(actualInputs);
    const totalActualCost = actualResult.costPerWash;

    // Variance
    const variance = totalActualCost - totalIdealCost;
    const variancePercentage = totalIdealCost > 0 ? ((variance / totalIdealCost) * 100) : 0;

    // Customer price (using first vehicle category for base calculation)
    const priceResult = getPlanPrice(selectedVehicle as any, planType);
    const customerPrice = typeof priceResult === 'number' ? priceResult : 0;

    // Profitability
    const profitIdeal = customerPrice - totalIdealCost;
    const profitActual = customerPrice - totalActualCost;
    const marginIdeal = customerPrice > 0 ? (profitIdeal / customerPrice) * 100 : 0;
    const marginActual = customerPrice > 0 ? (profitActual / customerPrice) * 100 : 0;

    return {
      planType,
      idealMaterialCost,
      actualMaterialCost,
      idealConsumablesCost,
      actualConsumablesCost,
      manpowerCost,
      overheadCost,
      totalIdealCost,
      totalActualCost,
      variance,
      variancePercentage,
      customerPrice,
      profitIdeal,
      profitActual,
      marginIdeal,
      marginActual,
    };
  };

  // Calculate for all plans (memoized to avoid unnecessary recalculations)
  const allPlanCosts: ConsumptionData[] = useMemo(
    () => PLAN_TYPES.map(plan => calculateCostsForPlan(plan)),
    [consumptionMultipliers, selectedVehicle]
  );

  const handleConsumptionChange = (plan: PlanType, value: string) => {
    const numValue = parseFloat(value) || 1.0;
    setConsumptionMultipliers(prev => ({
      ...prev,
      [plan]: Math.max(0.5, Math.min(2.0, numValue)) // Limit between 50% and 200%
    }));
  };

  const resetToIdeal = () => {
    setConsumptionMultipliers({
      "Water Wash": 1.0,
      "Water + Shampoo + Wax": 1.0,
      "Water + Shampoo + Wax": 1.0,
      "Interior": 1.0,
      "Elite Plus": 1.0,
      "One-Time Non-Member": 1.0,
      "One-Time Member": 1.0,
    });
    toast.success("Reset to ideal consumption levels");
  };

  // Auto-calculated overhead breakdown
  const totalOverheadMonthly = OVERHEAD_ITEMS
    .filter(o => !o.excludeFromCalculation)
    .reduce((sum, o) => sum + o.monthlyCost, 0);
  const overheadPerWash = totalOverheadMonthly / AVG_WASHES_PER_MONTH;

  // Total labor monthly
  const washerRole = MANPOWER_ROLES.find(r => r.role === "Washer");
  const supervisorRole = MANPOWER_ROLES.find(r => r.role === "Supervisor");
  const totalLaborMonthly = (washerRole?.monthlySalary || 0) + (supervisorRole?.monthlySalary || 0);

  const getVarianceStatus = (variance: number) => {
    if (variance <= 0) return { color: "text-green-600 bg-green-50", icon: <CheckCircle className="w-4 h-4" />, label: "At/Below Target" };
    if (variance <= 10) return { color: "text-yellow-600 bg-yellow-50", icon: <Info className="w-4 h-4" />, label: "Slight Overuse" };
    if (variance <= 25) return { color: "text-orange-600 bg-orange-50", icon: <AlertTriangle className="w-4 h-4" />, label: "Moderate Overuse" };
    return { color: "text-red-600 bg-red-50", icon: <AlertTriangle className="w-4 h-4" />, label: "High Overuse" };
  };

  return (
    <div className="space-y-6">
      <BackButton to="/analytics/unit-economics" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cost by Plan</h2>
          <p className="text-sm text-gray-500 mt-1">
            Actual vs Ideal consumption tracking for each subscription plan
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetToIdeal}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Ideal
        </Button>
      </div>

      {/* Auto-Calculated Overhead Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Auto-Calculated Overheads (From Centralized Data)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-gray-600">Total Overhead/Month</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">₹{totalOverheadMonthly.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">{OVERHEAD_ITEMS.filter(o => !o.excludeFromCalculation).length} items included</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-gray-600">Per Wash Overhead</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">₹{overheadPerWash.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Based on {AVG_WASHES_PER_MONTH} washes/month</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-600">Total Labor/Month</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">₹{totalLaborMonthly.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Washer + Supervisor</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-gray-600">Active Materials</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{MATERIALS.filter(m => m.status === "Active").length}</div>
              <div className="text-xs text-gray-500 mt-1">{CONSUMABLES.filter(c => c.status === "Active").length} consumables</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Category Selector */}
      <Card>
        <CardContent className="p-4">
          <Label className="text-sm font-medium mb-2 block">Vehicle Category (for pricing)</Label>
          <select
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
          >
            {vehicleCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Plan-wise Cost Analysis */}
      <div className="grid grid-cols-1 gap-6">
        {allPlanCosts.map((data) => {
          const varianceStatus = getVarianceStatus(data.variancePercentage);
          const isOverConsuming = data.variance > 0;
          
          return (
            <Card key={data.planType} className={`border-2 ${isOverConsuming ? 'border-orange-200' : 'border-green-200'}`}>
              <CardHeader className={isOverConsuming ? 'bg-orange-50' : 'bg-green-50'}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {data.planType}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Badge className={`${varianceStatus.color} flex items-center gap-1 px-3 py-1`}>
                      {varianceStatus.icon}
                      {varianceStatus.label}
                    </Badge>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">Customer Price</div>
                      <div className="text-lg font-bold text-gray-900">₹{data.customerPrice}</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Consumption Control */}
                  <div className="md:col-span-1">
                    <Label className="text-xs text-gray-600 mb-2 block">Actual Consumption Level</Label>
                    <div className="space-y-2">
                      <Input
                        type="number"
                        step="0.05"
                        min="0.5"
                        max="2.0"
                        value={consumptionMultipliers[data.planType]}
                        onChange={(e) => handleConsumptionChange(data.planType, e.target.value)}
                        className="text-center font-bold"
                      />
                      <div className="text-xs text-center space-y-1">
                        <div className={consumptionMultipliers[data.planType] === 1.0 ? "text-green-600 font-semibold" : "text-gray-500"}>
                          1.0 = Ideal
                        </div>
                        <div className="text-gray-400">
                          {(consumptionMultipliers[data.planType] * 100).toFixed(0)}% of ideal
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="md:col-span-4 space-y-4">
                    {/* Materials */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Package className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-semibold text-sm">Materials Cost</div>
                          <div className="text-xs text-gray-600">Auto-calculated from usage mapping</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Ideal</div>
                          <div className="font-semibold text-green-600">₹{(data?.idealMaterialCost ?? 0).toFixed(2)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Actual</div>
                          <div className="font-semibold text-orange-600">₹{(data?.actualMaterialCost ?? 0).toFixed(2)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Variance</div>
                          <div className={`font-bold ${data.actualMaterialCost > data.idealMaterialCost ? 'text-red-600' : 'text-green-600'}`}>
                            {data.actualMaterialCost > data.idealMaterialCost ? '+' : ''}
                            ₹{(data.actualMaterialCost - data.idealMaterialCost).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Consumables */}
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Wrench className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="font-semibold text-sm">Consumables Cost</div>
                          <div className="text-xs text-gray-600">Cloths, sponges, towels</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Ideal</div>
                          <div className="font-semibold text-green-600">₹{(data?.idealConsumablesCost ?? 0).toFixed(2)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Actual</div>
                          <div className="font-semibold text-orange-600">₹{(data?.actualConsumablesCost ?? 0).toFixed(2)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Variance</div>
                          <div className={`font-bold ${data.actualConsumablesCost > data.idealConsumablesCost ? 'text-red-600' : 'text-green-600'}`}>
                            {data.actualConsumablesCost > data.idealConsumablesCost ? '+' : ''}
                            ₹{(data.actualConsumablesCost - data.idealConsumablesCost).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manpower - Fixed */}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Users className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-semibold text-sm">Manpower Cost (Fixed)</div>
                          <div className="text-xs text-gray-600">Auto-calculated from roles</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Per Wash</div>
                        <div className="font-semibold text-gray-900">₹{(data?.manpowerCost ?? 0).toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Overhead - Fixed */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Building className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="font-semibold text-sm">Overhead Cost (Fixed)</div>
                          <div className="text-xs text-gray-600">Auto-calculated from overhead items</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Per Wash</div>
                        <div className="font-semibold text-gray-900">₹{(data?.overheadCost ?? 0).toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Total Cost & Profitability */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-gray-200">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300">
                        <div className="text-xs text-gray-600 mb-1">Ideal Total Cost</div>
                        <div className="text-2xl font-bold text-gray-900">₹{(data?.totalIdealCost ?? 0).toFixed(2)}</div>
                        <div className="text-xs text-green-700 mt-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Profit: ₹{(data?.profitIdeal ?? 0).toFixed(2)} ({(data?.marginIdeal ?? 0).toFixed(1)}%)
                        </div>
                      </div>
                      
                      <div className={`rounded-lg p-4 border-2 ${isOverConsuming ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'}`}>
                        <div className="text-xs text-gray-600 mb-1">Actual Total Cost</div>
                        <div className="text-2xl font-bold text-gray-900">₹{(data?.totalActualCost ?? 0).toFixed(2)}</div>
                        <div className={`text-xs mt-2 flex items-center gap-1 ${data.profitActual > 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {data.profitActual > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          Profit: ₹{(data?.profitActual ?? 0).toFixed(2)} ({(data?.marginActual ?? 0).toFixed(1)}%)
                        </div>
                      </div>
                      
                      <div className={`rounded-lg p-4 border-2 ${isOverConsuming ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300'}`}>
                        <div className="text-xs text-gray-600 mb-1">Cost Variance</div>
                        <div className={`text-2xl font-bold ${isOverConsuming ? 'text-red-600' : 'text-green-600'}`}>
                          {isOverConsuming ? '+' : ''}₹{(data?.variance ?? 0).toFixed(2)}
                        </div>
                        <div className={`text-xs mt-2 flex items-center gap-1 ${isOverConsuming ? 'text-red-700' : 'text-green-700'}`}>
                          {isOverConsuming ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {isOverConsuming ? '+' : ''}{(data?.variancePercentage ?? 0).toFixed(1)}% vs ideal
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            How This Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Ideal Costs:</strong> Auto-calculated from centralized material usage mappings in costData.ts
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Actual Costs:</strong> Based on washer's actual consumption level (1.0 = ideal, 1.2 = 20% overconsumption)
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>All Overheads:</strong> Auto-populated from {OVERHEAD_ITEMS.length} overhead items and pro-rated across {AVG_WASHES_PER_MONTH} washes/month
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Variance Tracking:</strong> Red indicates overconsumption reducing profitability, green indicates efficient usage
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CostPerWashByPlan;
