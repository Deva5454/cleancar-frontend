import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { BackButton } from "../ui/back-button";
import {
  Calculator,
  DollarSign,
  Users,
  Package,
  Building,
  Wrench,
  TrendingUp,
  Info,
} from "lucide-react";
import { OVERHEAD_ITEMS, MANPOWER_ROLES, AVG_WASHES_PER_MONTH } from "../../data/costData";

export function CostPerWashCalculator() {
  // Calculate initial overhead values from costData
  const initialOverheadValues: Record<string, string> = {};
  OVERHEAD_ITEMS.forEach((item) => {
    initialOverheadValues[`overhead_${item.id}`] = item.monthlyCost.toString();
  });

  const washerRole = MANPOWER_ROLES.find(r => r.role === "Washer");
  const supervisorRole = MANPOWER_ROLES.find(r => r.role === "Supervisor");

  const [inputs, setInputs] = useState({
    // Direct Materials (per wash)
    cleaningSupplies: "65",
    consumables: "11",
    water: "12",
    
    // Labor (monthly) - Auto-populated from costData
    washerSalary: (washerRole?.monthlySalary || 18000).toString(),
    supervisorAllocation: (supervisorRole?.monthlySalary || 25000).toString(),
    washesPerMonth: AVG_WASHES_PER_MONTH.toString(),
    
    // Overhead (monthly) - Auto-populated from costData with editable fields
    ...initialOverheadValues,
    
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
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const calculateCostPerWash = () => {
    const washesPerMonth = parseFloat(inputs.washesPerMonth) || 1;

    // Direct materials per wash
    const materialsPerWash =
      parseFloat(inputs.cleaningSupplies) +
      parseFloat(inputs.consumables) +
      parseFloat(inputs.water);

    // Labor cost per wash
    const totalLaborMonthly =
      parseFloat(inputs.washerSalary) +
      parseFloat(inputs.supervisorAllocation);
    const laborPerWash = totalLaborMonthly / washesPerMonth;

    // Overhead per wash - Calculate from all overhead items
    let totalOverheadMonthly = 0;
    OVERHEAD_ITEMS.forEach((item) => {
      const value = parseFloat(inputs[`overhead_${item.id}`]) || 0;
      totalOverheadMonthly += value;
    });
    const overheadPerWash = totalOverheadMonthly / washesPerMonth;

    // Equipment per wash
    const totalEquipmentMonthly =
      parseFloat(inputs.equipmentDepreciation) +
      parseFloat(inputs.maintenance);
    const equipmentPerWash = totalEquipmentMonthly / washesPerMonth;

    // Other variables per wash
    const variablesPerWash =
      parseFloat(inputs.transport) +
      parseFloat(inputs.packaging) +
      parseFloat(inputs.miscellaneous);

    // Total cost per wash
    const costPerWash =
      materialsPerWash +
      laborPerWash +
      overheadPerWash +
      equipmentPerWash +
      variablesPerWash;

    // Monthly total
    const monthlyTotal = costPerWash * washesPerMonth;

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
    });
  };

  const getHealthStatus = (cost: number) => {
    if (cost <= 220) return { label: "Excellent", color: "bg-green-100 text-green-800 border-green-300" };
    if (cost <= 260) return { label: "Good", color: "bg-blue-100 text-blue-800 border-blue-300" };
    if (cost <= 300) return { label: "Average", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    return { label: "High", color: "bg-red-100 text-red-800 border-red-300" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cost per Wash Calculator</h2>
        <p className="text-sm text-gray-500 mt-1">
          Calculate your unit economics by entering your actual costs
        </p>
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
                </div>
                <div>
                  <Label htmlFor="water" className="text-xs">
                    Water Cost (₹)
                  </Label>
                  <Input
                    id="water"
                    type="number"
                    value={inputs.water}
                    onChange={(e) =>
                      handleInputChange("water", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overhead Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-600" />
                Overhead Costs (Monthly)
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Auto-populated from cost data. Values are editable for scenario analysis.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {OVERHEAD_ITEMS.map((item) => {
                  const costPerWash = (item.monthlyCost / (parseFloat(inputs.washesPerMonth) || AVG_WASHES_PER_MONTH)).toFixed(2);
                  return (
                    <div key={item.id}>
                      <Label htmlFor={`overhead_${item.id}`} className="text-xs flex items-center justify-between">
                        <span>{item.name}</span>
                        <span className="text-gray-400 font-normal">₹{costPerWash}/wash</span>
                      </Label>
                      <Input
                        id={`overhead_${item.id}`}
                        type="number"
                        value={inputs[`overhead_${item.id}`]}
                        onChange={(e) =>
                          handleInputChange(`overhead_${item.id}`, e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  );
                })}
              </div>
              
              {/* Total Overhead Summary */}
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-purple-900">Total Monthly Overhead:</span>
                  <span className="font-bold text-purple-600">
                    ₹{OVERHEAD_ITEMS.reduce((sum, item) => sum + (parseFloat(inputs[`overhead_${item.id}`]) || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-purple-700 mt-1">
                  <span>Per Wash Cost:</span>
                  <span className="font-semibold">
                    ₹{(OVERHEAD_ITEMS.reduce((sum, item) => sum + (parseFloat(inputs[`overhead_${item.id}`]) || 0), 0) / (parseFloat(inputs.washesPerMonth) || AVG_WASHES_PER_MONTH)).toFixed(2)}
                  </span>
                </div>
              </div>
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
                </div>
              </div>
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
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-2">
                      Cost per Wash
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-3">
                      ₹{result.costPerWash}
                    </div>
                    <Badge className={getHealthStatus(result.costPerWash).color}>
                      {getHealthStatus(result.costPerWash).label}
                    </Badge>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Monthly Total Cost
                      </div>
                      <div className="text-xl font-semibold text-gray-700 mt-1">
                        ₹{(result?.monthlyTotal ?? 0).toLocaleString()}
                      </div>
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
                    <span className="font-semibold">₹{result.breakdown.materials}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Labor</span>
                    </div>
                    <span className="font-semibold">₹{result.breakdown.labor}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Overhead</span>
                    </div>
                    <span className="font-semibold">₹{result.breakdown.overhead}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium">Equipment</span>
                    </div>
                    <span className="font-semibold">₹{result.breakdown.equipment}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-pink-600" />
                      <span className="text-sm font-medium">Variables</span>
                    </div>
                    <span className="font-semibold">₹{result.breakdown.variables}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Insights */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-700 space-y-2">
                      <p className="font-semibold text-blue-900">
                        Cost Optimization Tips:
                      </p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Bulk purchase supplies (save 10-15%)</li>
                        <li>Increase washes per day (reduce overhead per wash)</li>
                        <li>Train staff for efficiency (reduce labor time)</li>
                        <li>Negotiate rent and utilities</li>
                      </ul>
                    </div>
                  </div>
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
                <CardContent className="space-y-2 text-xs">
                  {[299, 499, 699, 899].map((price) => {
                    const profit = price - result.costPerWash;
                    const margin = ((profit / price) * 100).toFixed(1);
                    return (
                      <div
                        key={price}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="font-medium">₹{price} wash</span>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            +₹{profit}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {margin}% margin
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-6 text-center">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Enter your costs and click "Calculate" to see results
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}