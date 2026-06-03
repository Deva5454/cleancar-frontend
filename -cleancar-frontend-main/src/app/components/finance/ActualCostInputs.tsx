import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Droplet,
  Wrench,
  Users,
  Building,
  Star,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Info,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { BackButton } from "../ui/back-button";
import {
  CONSUMABLE_ACTUAL_INPUTS,
  EQUIPMENT_ACTUAL_INPUTS,
  SALARY_ACTUAL_INPUTS,
  OVERHEAD_ACTUAL_INPUTS,
  CUSTOM_COST_ELEMENTS,
  getConsumableReasonColor,
  getEquipmentEventColor,
  getSalaryAdjustmentColor,
  calculateCustomElementMonthlyCost,
} from "../../data/actualInputsData";
import { MATERIALS, OVERHEAD_ITEMS } from "../../data/costData";
import { MASTER_INVENTORY } from "../../data/masterData";
import { AddConsumableInputDialog } from "./AddConsumableInputDialog";
import { AddEquipmentInputDialog } from "./AddEquipmentInputDialog";
import { AddSalaryInputDialog } from "./AddSalaryInputDialog";
import { AddOverheadInputDialog } from "./AddOverheadInputDialog";
import { AddCustomCostDialog } from "./AddCustomCostDialog";
import { logger } from "../../services/logger";

// Lookup maps for dynamic data
const WASHER_NAMES: Record<string, string> = {
  "washer-001": "Suresh Kumar",
  "washer-002": "Ramesh Patel",
  "washer-003": "Dinesh Sharma",
  "washer-004": "Vijay Singh",
  "supervisor-001": "Karthik Menon",
};

// Helper functions to get names from IDs
const getMaterialName = (materialId: string) => {
  const material = MATERIALS.find(m => m.id === materialId);
  return material?.name || `Material #${materialId}`;
};

const getEquipmentName = (equipmentId: string) => {
  // Equipment IDs in EQUIPMENT_ACTUAL_INPUTS use format like "eq-fg-001"
  // Map common equipment IDs to inventory items
  const equipmentMap: Record<string, string> = {
    "eq-fg-001": "Foam Gun",
    "eq-mt-001": "Microfiber Towel Set",
    "eq-pw-002": "Pressure Washer",
    "eq-bs-002": "Bucket Set",
    "eq-vc-001": "Vacuum Cleaner",
  };

  return equipmentMap[equipmentId] || `Equipment #${equipmentId}`;
};

const getOverheadCategoryName = (overheadId: string) => {
  const overhead = OVERHEAD_ITEMS.find(o => o.id === overheadId);
  if (overhead) return overhead.name;

  // Fallback for specific IDs not in OVERHEAD_ITEMS
  const overheadMap: Record<string, string> = {
    "oh-001": "Vehicle / Transport",
    "oh-002": "Mobile Data Plan",
    "oh-003": "Uniform",
    "oh-011": "Zone Marketing — Surat",
  };

  return overheadMap[overheadId] || `Overhead #${overheadId}`;
};

const getWasherName = (washerId: string) => {
  return WASHER_NAMES[washerId] || `Washer #${washerId}`;
};

export function ActualCostInputs() {
  const [showAddConsumable, setShowAddConsumable] = useState(false);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showAddSalary, setShowAddSalary] = useState(false);
  const [showAddOverhead, setShowAddOverhead] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);

  const handleAddConsumable = (data: any) => {
    logger.log("Add consumable input:", data);
    toast.success("Consumable actual input recorded");
  };

  const handleAddEquipment = (data: any) => {
    logger.log("Add equipment input:", data);
    toast.success("Equipment actual cost recorded");
  };

  const handleAddSalary = (data: any) => {
    logger.log("Add salary input:", data);
    toast.success("Salary adjustment recorded");
  };

  const handleAddOverhead = (data: any) => {
    logger.log("Add overhead input:", data);
    toast.success("Overhead actual cost recorded");
  };

  const handleAddCustom = (data: any) => {
    logger.log("Add custom cost:", data);
    toast.success("Custom cost element added");
  };

  return (
    <div className="space-y-6">
      <BackButton to="/finance/cost-per-wash" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-600" />
            Actual Cost Inputs
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manual input layer for recording actual costs that differ from standard calculations
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-2">
              <div>
                <strong>About Actual Cost Inputs:</strong>
              </div>
              <p>
                This module allows you to record actual consumed quantities and costs that differ from standard estimates. 
                These inputs supplement (not replace) automated tracking and enable "Actual vs Standard" comparisons across 
                all cost per wash screens.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                <li>Consumables: Extra usage not captured in standard issuance</li>
                <li>Equipment: Repairs, replacements, or premature wear events</li>
                <li>Salary: Overtime, bonuses, allowances, and deductions</li>
                <li>Overhead: Actual costs differing from standard allocations</li>
                <li>Custom: Business-specific costs not in standard components</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for 5 Sections */}
      <Tabs defaultValue="consumables" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-4xl">
          <TabsTrigger value="consumables" className="flex items-center gap-2">
            <Droplet className="w-4 h-4" />
            Consumables
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Salary
          </TabsTrigger>
          <TabsTrigger value="overhead" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Overhead
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Custom
          </TabsTrigger>
        </TabsList>

        {/* Section 1: Consumable Actual Input */}
        <TabsContent value="consumables" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-blue-600" />
                  Consumable Actual Inputs
                </CardTitle>
                <Button
                  onClick={() => setShowAddConsumable(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Consumption Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Washer</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Batch Cost</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Job Ref</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {CONSUMABLE_ACTUAL_INPUTS.map((input) => (
                      <TableRow key={input.id}>
                        <TableCell className="font-medium">
                          {format(new Date(input.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getWasherName(input.washerId)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getMaterialName(input.materialId)}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-gray-900">
                            {input.quantityConsumed} {input.unit}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          ₹{(input?.batchCostPerUnit ?? 0).toFixed(2)}/{input.unit}
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          ₹{(input?.totalCost ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getConsumableReasonColor(input.reason)}
                          >
                            {input.reason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {input.jobReference || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {/* TODO: Implement edit handler — hidden until backend is wired */}
                            {/* TODO: Implement delete handler — hidden until backend is wired */}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">
                    Total Actual Consumable Cost (March 2026):
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    ₹{CONSUMABLE_ACTUAL_INPUTS.reduce((sum, i) => sum + i.totalCost, 0).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-blue-700 mt-2">
                  {CONSUMABLE_ACTUAL_INPUTS.length} consumption entries recorded
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section 2: Equipment Wear Actual Input */}
        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-600" />
                  Equipment Actual Inputs
                </CardTitle>
                <Button
                  onClick={() => setShowAddEquipment(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Equipment Cost Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Washer</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Cost Incurred</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {EQUIPMENT_ACTUAL_INPUTS.map((input) => (
                      <TableRow key={input.id}>
                        <TableCell className="font-medium">
                          {format(new Date(input.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getWasherName(input.washerId)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getEquipmentName(input.equipmentId)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getEquipmentEventColor(input.eventType)}
                          >
                            {input.eventType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-orange-600">
                          ₹{(input?.actualCostIncurred ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs">
                          {input.description}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {input.reference || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {/* TODO: Implement edit handler — hidden until backend is wired */}
                            {/* TODO: Implement delete handler — hidden until backend is wired */}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-orange-900">
                    Total Actual Equipment Cost (March 2026):
                  </span>
                  <span className="text-xl font-bold text-orange-600">
                    ₹{EQUIPMENT_ACTUAL_INPUTS.reduce((sum, i) => sum + i.actualCostIncurred, 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-orange-700 mt-2">
                  {EQUIPMENT_ACTUAL_INPUTS.length} equipment events recorded
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section 3: Salary Actual Input */}
        <TabsContent value="salary" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Salary Actual Inputs
                </CardTitle>
                <Button
                  onClick={() => setShowAddSalary(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Salary Adjustment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Adjustment Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SALARY_ACTUAL_INPUTS.map((input) => (
                      <TableRow key={input.id}>
                        <TableCell className="font-medium">
                          {format(new Date(input.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getWasherName(input.employeeId)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getSalaryAdjustmentColor(input.adjustmentType)}
                          >
                            {input.adjustmentType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`font-bold text-lg ${
                              input.amount >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {input.amount >= 0 ? "+" : ""}₹{(input?.amount ?? 0).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs">
                          {input.reason}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {input.reference || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {/* TODO: Implement edit handler — hidden until backend is wired */}
                            {/* TODO: Implement delete handler — hidden until backend is wired */}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-900 mb-1">
                    Total Additions
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    +₹
                    {SALARY_ACTUAL_INPUTS.filter((i) => i.amount > 0)
                      .reduce((sum, i) => sum + i.amount, 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm font-medium text-red-900 mb-1">
                    Total Deductions
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    -₹
                    {Math.abs(
                      SALARY_ACTUAL_INPUTS.filter((i) => i.amount < 0).reduce(
                        (sum, i) => sum + i.amount,
                        0
                      )
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section 4: Overhead Actual Input */}
        <TabsContent value="overhead" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Overhead Actual Inputs
                </CardTitle>
                <Button
                  onClick={() => setShowAddOverhead(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Overhead Event
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Overhead Category</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Actual Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {OVERHEAD_ACTUAL_INPUTS.map((input) => (
                      <TableRow key={input.id}>
                        <TableCell className="font-medium">
                          {format(new Date(input.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getOverheadCategoryName(input.overheadCategoryId)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {input.scope}: {input.scopeId || "Company"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          ₹{(input?.actualAmount ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs">
                          {input.description}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {input.reference || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {/* TODO: Implement edit handler — hidden until backend is wired */}
                            {/* TODO: Implement delete handler — hidden until backend is wired */}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">
                    Total Overhead Actual Cost (March 2026):
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    ₹{OVERHEAD_ACTUAL_INPUTS.reduce((sum, i) => sum + i.actualAmount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-blue-700 mt-2">
                  {OVERHEAD_ACTUAL_INPUTS.length} overhead events recorded
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section 5: Custom Cost Element */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Custom Cost Elements
                </CardTitle>
                <Button
                  onClick={() => setShowAddCustom(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Cost Element
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Cost Name</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Amortization</TableHead>
                      <TableHead>Monthly Cost</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {CUSTOM_COST_ELEMENTS.map((element) => {
                      const monthlyCost = calculateCustomElementMonthlyCost(element);
                      
                      return (
                        <TableRow key={element.id}>
                          <TableCell className="font-medium">
                            {element.costName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {element.scope}
                              {element.scopeId && `: ${element.scopeId}`}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-gray-900">
                            ₹{(element?.amount ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {element.amortizationMethod === "One-Time in this period" ? (
                              <Badge className="bg-purple-100 text-purple-800">
                                One-Time
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800">
                                {element.amortizationMonths} months
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-yellow-600">
                            ₹{monthlyCost.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {format(new Date(element.effectivePeriodStart), "MMM yyyy")} -{" "}
                            {format(new Date(element.effectivePeriodEnd), "MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {/* TODO: Implement edit handler — hidden until backend is wired */}
                              {/* TODO: Implement delete handler — hidden until backend is wired */}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-yellow-900">
                    Total Custom Cost Elements:
                  </span>
                  <span className="text-xl font-bold text-yellow-600">
                    {CUSTOM_COST_ELEMENTS.length} elements
                  </span>
                </div>
                <div className="text-xs text-yellow-700 mt-2">
                  Combined monthly cost impact: ₹
                  {CUSTOM_COST_ELEMENTS.reduce(
                    (sum, e) => sum + calculateCustomElementMonthlyCost(e),
                    0
                  ).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddConsumableInputDialog
        open={showAddConsumable}
        onOpenChange={setShowAddConsumable}
        onSave={handleAddConsumable}
      />
      
      <AddEquipmentInputDialog
        open={showAddEquipment}
        onOpenChange={setShowAddEquipment}
        onSave={handleAddEquipment}
      />
      
      <AddSalaryInputDialog
        open={showAddSalary}
        onOpenChange={setShowAddSalary}
        onSave={handleAddSalary}
      />
      
      <AddOverheadInputDialog
        open={showAddOverhead}
        onOpenChange={setShowAddOverhead}
        onSave={handleAddOverhead}
      />
      
      <AddCustomCostDialog
        open={showAddCustom}
        onOpenChange={setShowAddCustom}
        onSave={handleAddCustom}
      />
    </div>
  );
}