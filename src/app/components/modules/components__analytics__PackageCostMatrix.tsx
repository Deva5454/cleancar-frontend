/**
 * Package-Wise Cost Matrix
 * Auto-calculates material, consumable, manpower, and overhead costs per package
 * Shows EBITDA margins and profitability analysis
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BackButton } from "../ui/back-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Calculator,
  Package,
  Edit2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Users,
  Wrench,
  Building,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  MATERIALS,
  CONSUMABLES,
  MANPOWER_ROLES,
  OVERHEAD_ITEMS,
  TARGET_EBITDA_MARGIN,
  AVG_WASHES_PER_MONTH,
  type Material,
} from "../../data/costData";
import {
  CURRENT_PLAN_VERSION,
  type VehicleCategory,
  type PlanType,
} from "../../data/subscriptionPlans";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";

interface PackageCostData {
  packageName: PlanType;
  materialCost: number;
  consumableCost: number;
  manpowerCost: number;
  overheadCost: number;
  totalCostToCompany: number;
  customerPricePerMonth: number;
  washesPerMonth: number;
  costPerWashToCustomer: number;
  ebitdaMargin: number;
  ebitdaPercentage: number;
  marginStatus: "good" | "warning" | "poor";
}

export function PackageCostMatrix() {
  const { getPlanPrice, vehicleCategories } = usePlanDefinitions();
  const [selectedVehicleCategory, setSelectedVehicleCategory] =
    useState<VehicleCategory>("Hatchback / Compact Sedan");
  const [targetEBITDA, setTargetEBITDA] = useState(TARGET_EBITDA_MARGIN);
  const [editingPackage, setEditingPackage] = useState<PlanType | null>(null);
  const [materialUsages, setMaterialUsages] = useState<
    Record<string, { material: Material; quantity: number }>
  >({});
  
  // State for editable costs per package
  const [editableCosts, setEditableCosts] = useState<
    Record<PlanType, {
      materialCost: number;
      consumableCost: number;
      manpowerCost: number;
      overheadCost: number;
    }>
  >({} as any);
  
  const [editingCell, setEditingCell] = useState<{
    package: PlanType;
    field: 'materialCost' | 'consumableCost' | 'manpowerCost' | 'overheadCost';
  } | null>(null);

  // Calculate consumables cost per wash (same for all packages)
  const consumablesCostPerWash = CONSUMABLES.filter(
    (c) => c.status === "Active"
  ).reduce((sum, c) => sum + c.costPerUnit * c.avgUsagePerWash, 0);

  // Calculate overhead cost per wash (uniform across packages)
  const overheadCostPerWash =
    OVERHEAD_ITEMS.filter((o) => !o.excludeFromCalculation).reduce(
      (sum, o) => sum + o.monthlyCost,
      0
    ) / AVG_WASHES_PER_MONTH;

  // Calculate material cost for a specific package
  const calculateMaterialCost = (packageName: PlanType): number => {
    const activeMaterials = MATERIALS.filter((m) => m.status === "Active");
    let totalCost = 0;

    activeMaterials.forEach((material) => {
      const mapping = material.usageMapping.find((m) =>
        m.package.includes(packageName)
      );
      if (mapping) {
        totalCost += material.costPerUnit * mapping.quantityPerWash;
      }
    });

    return totalCost;
  };

  // Calculate manpower cost based on package complexity
  const calculateManpowerCost = (packageName: PlanType): number => {
    const washer = MANPOWER_ROLES.find((r) => r.role === "Washer");
    const supervisor = MANPOWER_ROLES.find((r) => r.role === "Supervisor");

    if (!washer || !supervisor) return 0;

    let washesPerHour = 2; // Default for Basic/Premium

    // Adjust based on package complexity
    if (packageName === "Water + Shampoo + Wax" || packageName === "Water + Shampoo + Wax" || packageName === "One-Time Member") {
      washesPerHour = 1.5;
    } else if (packageName === "Water + Shampoo + Wax") {
      washesPerHour = 1;
    }

    const washerCost =
      washer.monthlySalary /
      (washer.workingDaysPerMonth * washer.workingHoursPerDay * washesPerHour);

    const supervisorAllocation = supervisor.monthlySalary / AVG_WASHES_PER_MONTH;

    return washerCost + supervisorAllocation;
  };

  // Get washes per month based on plan frequency
  const getWashesPerMonth = (packageName: PlanType): number => {
    if (packageName === "One-Time Non-Member" || packageName === "One-Time Member") {
      return 1;
    }
    // Assuming daily service for subscription plans
    return 26; // Working days per month
  };

  // Calculate package cost data
  const calculatePackageCosts = (): PackageCostData[] => {
    const packages: PlanType[] = [
      "Water Wash",
      "Water + Shampoo + Wax",
      "Water + Shampoo + Wax",
      "Water + Shampoo + Wax",
      "Water + Shampoo + Wax",
      "One-Time Non-Member",
    ];

    return packages.map((packageName) => {
      const materialCost = calculateMaterialCost(packageName);
      const consumableCost = consumablesCostPerWash;
      const manpowerCost = calculateManpowerCost(packageName);
      const overheadCost = overheadCostPerWash;
      const totalCostToCompany =
        materialCost + consumableCost + manpowerCost + overheadCost;

      const customerPricePerMonth = getPlanPrice(packageName, selectedVehicleCategory as VehicleCategory) || 0;
      const washesPerMonth = getWashesPerMonth(packageName);
      const costPerWashToCustomer =
        typeof customerPricePerMonth === "number"
          ? customerPricePerMonth / washesPerMonth
          : 0;

      const ebitdaMargin = costPerWashToCustomer - totalCostToCompany;
      const ebitdaPercentage =
        costPerWashToCustomer > 0
          ? (ebitdaMargin / costPerWashToCustomer) * 100
          : 0;

      // Determine margin status
      let marginStatus: "good" | "warning" | "poor" = "good";
      if (ebitdaPercentage < targetEBITDA - 5) {
        marginStatus = "poor";
      } else if (ebitdaPercentage < targetEBITDA) {
        marginStatus = "warning";
      }

      return {
        packageName,
        materialCost,
        consumableCost,
        manpowerCost,
        overheadCost,
        totalCostToCompany,
        customerPricePerMonth:
          typeof customerPricePerMonth === "number"
            ? customerPricePerMonth
            : 0,
        washesPerMonth,
        costPerWashToCustomer,
        ebitdaMargin,
        ebitdaPercentage,
        marginStatus,
      };
    });
  };

  const packageCosts = calculatePackageCosts();
  
  // Initialize editable costs from calculated costs
  const getEditableCost = (pkg: PackageCostData, field: 'materialCost' | 'consumableCost' | 'manpowerCost' | 'overheadCost'): number => {
    if (editableCosts[pkg.packageName]?.[field] !== undefined) {
      return editableCosts[pkg.packageName][field];
    }
    return pkg[field];
  };
  
  const handleCostEdit = (pkg: PlanType, field: 'materialCost' | 'consumableCost' | 'manpowerCost' | 'overheadCost', value: number) => {
    setEditableCosts(prev => ({
      ...prev,
      [pkg]: {
        ...prev[pkg],
        [field]: value
      }
    }));
  };
  
  const handleCostBlur = () => {
    setEditingCell(null);
    toast.success("Cost updated", {
      description: "EBITDA calculations will update automatically"
    });
  };
  
  // Recalculate package costs with editable values
  const packageCostsWithEdits = packageCosts.map(pkg => {
    const materialCost = getEditableCost(pkg, 'materialCost');
    const consumableCost = getEditableCost(pkg, 'consumableCost');
    const manpowerCost = getEditableCost(pkg, 'manpowerCost');
    const overheadCost = getEditableCost(pkg, 'overheadCost');
    
    const totalCostToCompany = materialCost + consumableCost + manpowerCost + overheadCost;
    const ebitdaMargin = pkg.costPerWashToCustomer - totalCostToCompany;
    const ebitdaPercentage = pkg.costPerWashToCustomer > 0 
      ? (ebitdaMargin / pkg.costPerWashToCustomer) * 100 
      : 0;
    
    let marginStatus: "good" | "warning" | "poor" = "good";
    if (ebitdaPercentage < targetEBITDA - 5) {
      marginStatus = "poor";
    } else if (ebitdaPercentage < targetEBITDA) {
      marginStatus = "warning";
    }
    
    return {
      ...pkg,
      materialCost,
      consumableCost,
      manpowerCost,
      overheadCost,
      totalCostToCompany,
      ebitdaMargin,
      ebitdaPercentage,
      marginStatus
    };
  });

  const handleEditMaterialUsage = (packageName: PlanType) => {
    // Load current material mappings for this package
    const activeMaterials = MATERIALS.filter((m) => m.status === "Active");
    const usages: Record<string, { material: Material; quantity: number }> =
      {};

    activeMaterials.forEach((material) => {
      const mapping = material.usageMapping.find((m) =>
        m.package.includes(packageName)
      );
      if (mapping) {
        usages[material.id] = {
          material,
          quantity: mapping.quantityPerWash,
        };
      }
    });

    setMaterialUsages(usages);
    setEditingPackage(packageName);
  };

  const saveMaterialUsage = () => {
    // In a real app, this would update the backend
    toast.success("Material usage updated", {
      description: "Package cost matrix will recalculate automatically",
    });
    setEditingPackage(null);
  };

  const getMarginBadge = (status: "good" | "warning" | "poor") => {
    if (status === "good") {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Good
        </Badge>
      );
    } else if (status === "warning") {
      return (
        <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Warning
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          Poor
        </Badge>
      );
    }
  };

  const vehicleCategories: VehicleCategory[] = [
    "2W - Scooter",
    "2W - Standard Bike",
    "2W - Premium Bike",
    "Hatchback",
    "Compact Sedan (<4m)",
    "Mid-Size Sedan (>4m)",
    "Compact SUV (<4m)",
    "Mid/Large SUV",
    "MPV (6-7 Seater)",
    "Jeeps / Off-Roaders",
    "Coupes / Convertibles (Luxury)",
  ];

  return (
    <div className="space-y-6">
      <BackButton to="/analytics" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-blue-600" />
            Package Cost Matrix
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Auto-calculated cost breakdown and EBITDA margins per package
          </p>
        </div>
      </div>

      {/* Vehicle Category Selector */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">
                  Vehicle Category Selector
                </div>
                <div className="text-xs text-blue-700">
                  Select category to view pricing and margins for that segment
                </div>
              </div>
            </div>
            <Select
              value={selectedVehicleCategory}
              onValueChange={(value) =>
                setSelectedVehicleCategory(value as VehicleCategory)
              }
            >
              <SelectTrigger className="w-64 bg-white">
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
        </CardContent>
      </Card>

      {/* Target EBITDA Info */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">
                  Target EBITDA Margin
                </div>
                <div className="text-xs text-green-700">
                  Green badge when ≥ target, Amber within 5% below, Red &gt; 5%
                  below
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {targetEBITDA}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Matrix Table */}
      <Card>
        <CardHeader>
          <CardTitle>Package Cost Breakdown & Profitability</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Editable Info Banner */}
          <Card className="border-indigo-200 bg-indigo-50 mb-4">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                <div className="text-sm text-indigo-900">
                  <strong>Click any cost cell</strong> (Material, Consumable, Manpower, Overhead) to edit values. Total Cost and EBITDA will recalculate automatically.
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Package</TableHead>
                  <TableHead className="text-right">
                    <div className="flex flex-col items-end">
                      <Package className="w-4 h-4 text-blue-600 mb-1" />
                      <span>Material Cost</span>
                      <span className="text-xs text-gray-500">(₹/wash)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex flex-col items-end">
                      <Wrench className="w-4 h-4 text-purple-600 mb-1" />
                      <span>Consumable</span>
                      <span className="text-xs text-gray-500">(₹/wash)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex flex-col items-end">
                      <Users className="w-4 h-4 text-green-600 mb-1" />
                      <span>Manpower</span>
                      <span className="text-xs text-gray-500">(₹/wash)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex flex-col items-end">
                      <Building className="w-4 h-4 text-orange-600 mb-1" />
                      <span>Overhead</span>
                      <span className="text-xs text-gray-500">(₹/wash)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-bold">
                    <div className="flex flex-col items-end">
                      <DollarSign className="w-4 h-4 text-red-600 mb-1" />
                      <span>Total Cost</span>
                      <span className="text-xs text-gray-500">(₹/wash)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex flex-col items-end">
                      <span>Customer Price</span>
                      <span className="text-xs text-gray-500">(₹/month)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex flex-col items-end">
                      <span>Washes</span>
                      <span className="text-xs text-gray-500">/month</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex flex-col items-end">
                      <span>Price/Wash</span>
                      <span className="text-xs text-gray-500">(₹)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-bold">
                    <div className="flex flex-col items-end">
                      <TrendingUp className="w-4 h-4 text-green-600 mb-1" />
                      <span>EBITDA</span>
                      <span className="text-xs text-gray-500">(₹ & %)</span>
                    </div>
                  </TableHead>
                  <TableHead>Margin Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packageCostsWithEdits.map((pkg) => (
                  <TableRow key={pkg.packageName}>
                    <TableCell className="font-medium">
                      {pkg.packageName}
                    </TableCell>
                    
                    {/* Material Cost - Editable */}
                    <TableCell className="text-right text-blue-600">
                      {editingCell?.package === pkg.packageName && editingCell?.field === 'materialCost' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={pkg.materialCost}
                          onChange={(e) => handleCostEdit(pkg.packageName, 'materialCost', parseFloat(e.target.value) || 0)}
                          onBlur={handleCostBlur}
                          autoFocus
                          className="w-24 h-8 text-right"
                        />
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                          onClick={() => setEditingCell({ package: pkg.packageName, field: 'materialCost' })}
                          title="Click to edit"
                        >
                          ₹{(pkg?.materialCost ?? 0).toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    
                    {/* Consumable Cost - Editable */}
                    <TableCell className="text-right text-purple-600">
                      {editingCell?.package === pkg.packageName && editingCell?.field === 'consumableCost' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={pkg.consumableCost}
                          onChange={(e) => handleCostEdit(pkg.packageName, 'consumableCost', parseFloat(e.target.value) || 0)}
                          onBlur={handleCostBlur}
                          autoFocus
                          className="w-24 h-8 text-right"
                        />
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                          onClick={() => setEditingCell({ package: pkg.packageName, field: 'consumableCost' })}
                          title="Click to edit"
                        >
                          ₹{(pkg?.consumableCost ?? 0).toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    
                    {/* Manpower Cost - Editable */}
                    <TableCell className="text-right text-green-600">
                      {editingCell?.package === pkg.packageName && editingCell?.field === 'manpowerCost' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={pkg.manpowerCost}
                          onChange={(e) => handleCostEdit(pkg.packageName, 'manpowerCost', parseFloat(e.target.value) || 0)}
                          onBlur={handleCostBlur}
                          autoFocus
                          className="w-24 h-8 text-right"
                        />
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors"
                          onClick={() => setEditingCell({ package: pkg.packageName, field: 'manpowerCost' })}
                          title="Click to edit"
                        >
                          ₹{(pkg?.manpowerCost ?? 0).toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    
                    {/* Overhead Cost - Editable */}
                    <TableCell className="text-right text-orange-600">
                      {editingCell?.package === pkg.packageName && editingCell?.field === 'overheadCost' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={pkg.overheadCost}
                          onChange={(e) => handleCostEdit(pkg.packageName, 'overheadCost', parseFloat(e.target.value) || 0)}
                          onBlur={handleCostBlur}
                          autoFocus
                          className="w-24 h-8 text-right"
                        />
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                          onClick={() => setEditingCell({ package: pkg.packageName, field: 'overheadCost' })}
                          title="Click to edit"
                        >
                          ₹{(pkg?.overheadCost ?? 0).toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-right font-bold text-red-600">
                      ₹{(pkg?.totalCostToCompany ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(pkg?.customerPricePerMonth ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {pkg.washesPerMonth}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{(pkg?.costPerWashToCustomer ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-green-600">
                          ₹{(pkg?.ebitdaMargin ?? 0).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-600">
                          ({(pkg?.ebitdaPercentage ?? 0).toFixed(1)}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getMarginBadge(pkg.marginStatus)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMaterialUsage(pkg.packageName)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit Usage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="text-xs text-blue-600 mb-1">
                  Avg Material Cost
                </div>
                <div className="text-lg font-bold text-blue-900">
                  ₹
                  {(
                    packageCosts.reduce((sum, p) => sum + p.materialCost, 0) /
                    packageCosts.length
                  ).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="text-xs text-green-600 mb-1">
                  Avg Total Cost
                </div>
                <div className="text-lg font-bold text-green-900">
                  ₹
                  {(
                    packageCosts.reduce(
                      (sum, p) => sum + p.totalCostToCompany,
                      0
                    ) / packageCosts.length
                  ).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="text-xs text-purple-600 mb-1">
                  Avg EBITDA Margin
                </div>
                <div className="text-lg font-bold text-purple-900">
                  {(
                    packageCosts.reduce(
                      (sum, p) => sum + p.ebitdaPercentage,
                      0
                    ) / packageCosts.length
                  ).toFixed(1)}
                  %
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="text-xs text-orange-600 mb-1">
                  Packages Below Target
                </div>
                <div className="text-lg font-bold text-orange-900">
                  {packageCosts.filter((p) => p.marginStatus !== "good").length}{" "}
                  / {packageCosts.length}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Edit Material Usage Modal */}
      <Dialog
        open={editingPackage !== null}
        onOpenChange={(open) => !open && setEditingPackage(null)}
      >
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Material Usage - {editingPackage}
            </DialogTitle>
            <DialogDescription>
              Adjust material quantities per wash to simulate cost scenarios.
              Changes update the matrix in real-time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(materialUsages).map(([id, { material, quantity }]) => (
              <div
                key={id}
                className="grid grid-cols-3 gap-4 items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <div className="font-medium">{material.name}</div>
                  <div className="text-xs text-gray-500">
                    ₹{(material?.costPerUnit ?? 0).toFixed(2)}/{material.unitOfMeasure}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Quantity per Wash</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setMaterialUsages({
                        ...materialUsages,
                        [id]: {
                          ...materialUsages[id],
                          quantity: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Cost per Wash</div>
                  <div className="text-lg font-bold text-blue-600">
                    ₹{(material.costPerUnit * quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingPackage(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={saveMaterialUsage}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}