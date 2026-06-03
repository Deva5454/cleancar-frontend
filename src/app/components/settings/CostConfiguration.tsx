import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import {
  Settings,
  Package,
  Droplet,
  Users,
  Building,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Clock,
  Eye,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "../ui/back-button";
import {
  MATERIALS,
  CONSUMABLES,
  MANPOWER_ROLES,
  TARGET_EBITDA_MARGIN,
  AVG_WASHES_PER_MONTH,
  type Material,
  type Consumable,
  type ManpowerRole,
} from "../../data/costData";
import { CURRENT_PLAN_VERSION, type VehicleCategory, type PlanType } from "../../data/subscriptionPlans";
import { MaterialDetailView } from "./MaterialDetailView";
import { getPriceHistory, getScheduledPriceChanges } from "../../data/materialHistoryData";
import { EquipmentCostParameters } from "./EquipmentCostParameters";
import { SalaryHistoryManagement } from "./SalaryHistoryManagement";
import { OverheadManagement } from "./OverheadManagement";
import { UsageMappingEditor } from "./UsageMappingEditor";

export function CostConfiguration() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [targetEBITDA, setTargetEBITDA] = useState(TARGET_EBITDA_MARGIN);

  // State initialized from centralized data
  const [materials, setMaterials] = useState<Material[]>(MATERIALS);
  const [consumables, setConsumables] = useState<Consumable[]>(CONSUMABLES);
  const [manpower, setManpower] = useState<ManpowerRole[]>(MANPOWER_ROLES);

  // Material detail view state
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showMaterialDetail, setShowMaterialDetail] = useState(false);

  // Edit state
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(
    null
  );
  const [editingConsumableId, setEditingConsumableId] = useState<string | null>(
    null
  );
  const [editingManpowerId, setEditingManpowerId] = useState<string | null>(
    null
  );

  // Add modal states
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddConsumable, setShowAddConsumable] = useState(false);

  // New item data
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    name: "",
    unitOfMeasure: "ml",
    costPerUnit: 0,
    shelfLife: 30,
    supplier: "",
    status: "Active",
    usageMapping: [],
  });

  const [newConsumable, setNewConsumable] = useState<Partial<Consumable>>({
    name: "",
    unitOfMeasure: "unit",
    costPerUnit: 0,
    avgUsagePerWash: 0,
    status: "Active",
  });

  // Get scheduled price changes count
  const scheduledChangesCount = getScheduledPriceChanges().length;

  const recalculateAll = () => {
    setLastUpdated(new Date());
    toast.success("All costs recalculated successfully", {
      description: `Updated at ${new Date().toLocaleTimeString()}`,
    });
  };

  const viewMaterialDetail = (material: Material) => {
    setSelectedMaterial(material);
    setShowMaterialDetail(true);
  };

  // Material functions
  const updateMaterialField = (id: string, field: keyof Material, value: any) => {
    setMaterials(
      materials.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const saveMaterial = (id: string) => {
    setEditingMaterialId(null);
    recalculateAll();
    toast.success("Material updated successfully");
  };

  const deleteMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
    toast.success("Material deleted");
  };

  const toggleMaterialStatus = (id: string) => {
    setMaterials(
      materials.map((m) =>
        m.id === id
          ? { ...m, status: m.status === "Active" ? "Inactive" : "Active" }
          : m
      )
    );
    toast.info("Material status updated");
  };

  // Consumable functions
  const updateConsumableField = (id: string, field: keyof Consumable, value: any) => {
    setConsumables(
      consumables.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const saveConsumable = (id: string) => {
    setEditingConsumableId(null);
    recalculateAll();
    toast.success("Consumable updated successfully");
  };

  const deleteConsumable = (id: string) => {
    setConsumables(consumables.filter((c) => c.id !== id));
    toast.success("Consumable deleted");
  };

  const toggleConsumableStatus = (id: string) => {
    setConsumables(
      consumables.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" }
          : c
      )
    );
    toast.info("Consumable status updated");
  };

  // Manpower functions
  const updateManpowerField = (id: string, field: keyof ManpowerRole, value: any) => {
    setManpower(
      manpower.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const saveManpower = (id: string) => {
    setEditingManpowerId(null);
    recalculateAll();
    toast.success("Manpower role updated successfully");
  };

  const deleteManpower = (id: string) => {
    setManpower(manpower.filter((m) => m.id !== id));
    toast.success("Role deleted");
  };

  // Add Material function
  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.supplier) {
      toast.error("Please fill in all required fields");
      return;
    }

    const material: Material = {
      id: `mat-${Date.now()}`,
      name: newMaterial.name,
      unitOfMeasure: newMaterial.unitOfMeasure || "ml",
      costPerUnit: newMaterial.costPerUnit || 0,
      shelfLife: newMaterial.shelfLife || 30,
      supplier: newMaterial.supplier,
      status: newMaterial.status || "Active",
      usageMapping: newMaterial.usageMapping || [],
    };

    setMaterials([...materials, material]);
    setShowAddMaterial(false);
    setNewMaterial({
      name: "",
      unitOfMeasure: "ml",
      costPerUnit: 0,
      shelfLife: 30,
      supplier: "",
      status: "Active",
      usageMapping: [],
    });
    toast.success("Material added successfully");
    recalculateAll();
  };

  // Add Consumable function
  const addConsumable = () => {
    if (!newConsumable.name) {
      toast.error("Please enter consumable name");
      return;
    }

    const consumable: Consumable = {
      id: `con-${Date.now()}`,
      name: newConsumable.name,
      unitOfMeasure: newConsumable.unitOfMeasure || "unit",
      costPerUnit: newConsumable.costPerUnit || 0,
      avgUsagePerWash: newConsumable.avgUsagePerWash || 0,
      status: newConsumable.status || "Active",
    };

    setConsumables([...consumables, consumable]);
    setShowAddConsumable(false);
    setNewConsumable({
      name: "",
      unitOfMeasure: "unit",
      costPerUnit: 0,
      avgUsagePerWash: 0,
      status: "Active",
    });
    toast.success("Consumable added successfully");
    recalculateAll();
  };

  // Edit Material function
  const editMaterial = (material: Material) => {
    setEditingMaterialId(material.id);
  };

  // Edit Consumable function
  const editConsumable = (consumable: Consumable) => {
    setEditingConsumableId(consumable.id);
  };

  // Calculate costs
  const consumablesCostPerWash = consumables
    .filter(c => c.status === "Active")
    .reduce((sum, c) => sum + (c.costPerUnit * c.avgUsagePerWash), 0);

  return (
    <div className="space-y-6">
      <BackButton to="/finance" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" />
            Cost Configuration
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Master data setup for all cost calculations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500">Last Updated</div>
            <div className="text-sm font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
          <Button
            onClick={recalculateAll}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalculate All
          </Button>
        </div>
      </div>

      {/* Target EBITDA */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">
                  Target EBITDA Margin
                </div>
                <div className="text-xs text-blue-700">
                  Global target for all packages and calculators
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={targetEBITDA}
                onChange={(e) => setTargetEBITDA(parseFloat(e.target.value))}
                className="w-20 text-center font-bold text-lg bg-white"
              />
              <span className="font-bold text-lg text-blue-900">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Price Changes Notification */}
      {scheduledChangesCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <div className="font-medium text-yellow-900">
                  {scheduledChangesCount} Scheduled Price {scheduledChangesCount === 1 ? "Change" : "Changes"}
                </div>
                <div className="text-xs text-yellow-700">
                  Future-dated price entries that will automatically activate on their effective dates
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                onClick={() => toast.info("View scheduled changes in material details")}
              >
                <History className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="consumables" className="flex items-center gap-2">
            <Droplet className="w-4 h-4" />
            Consumables
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="manpower" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Manpower
          </TabsTrigger>
          <TabsTrigger value="overhead" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Overhead
          </TabsTrigger>
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cleaning Materials</CardTitle>
                <Button
                  onClick={() => setShowAddMaterial(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Material
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Cost/Unit (₹)</TableHead>
                      <TableHead>Shelf Life (days)</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Usage Mapping</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">
                          {editingMaterialId === material.id ? (
                            <Input
                              value={material.name}
                              onChange={(e) =>
                                updateMaterialField(material.id, "name", e.target.value)
                              }
                              className="w-full"
                            />
                          ) : (
                            material.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingMaterialId === material.id ? (
                            <Input
                              value={material.unitOfMeasure}
                              onChange={(e) =>
                                updateMaterialField(material.id, "unitOfMeasure", e.target.value)
                              }
                              className="w-20"
                            />
                          ) : (
                            material.unitOfMeasure
                          )}
                        </TableCell>
                        <TableCell>
                          {editingMaterialId === material.id ? (
                            <Input
                              type="number"
                              value={material.costPerUnit || 0}
                              onChange={(e) =>
                                updateMaterialField(material.id, "costPerUnit", parseFloat(e.target.value) || 0)
                              }
                              className="w-24"
                            />
                          ) : (
                            `₹${material.costPerUnit.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>
                          {editingMaterialId === material.id ? (
                            <Input
                              type="number"
                              value={material.shelfLife || 0}
                              onChange={(e) =>
                                updateMaterialField(material.id, "shelfLife", parseInt(e.target.value) || 0)
                              }
                              className="w-20"
                            />
                          ) : (
                            material.shelfLife
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {editingMaterialId === material.id ? (
                            <Input
                              value={material.supplier}
                              onChange={(e) =>
                                updateMaterialField(material.id, "supplier", e.target.value)
                              }
                              className="w-full"
                            />
                          ) : (
                            material.supplier
                          )}
                        </TableCell>
                        <TableCell>
                          <UsageMappingEditor
                            material={material}
                            onMappingChange={(newMapping) =>
                              updateMaterialField(material.id, "usageMapping", newMapping)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              material.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {material.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingMaterialId === material.id ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => saveMaterial(material.id)}
                                className="text-green-600"
                              >
                                Save
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editMaterial(material)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMaterial(material.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewMaterialDetail(material)}
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consumables Tab */}
        <TabsContent value="consumables" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Consumables per Wash</CardTitle>
                <Button
                  onClick={() => setShowAddConsumable(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Consumable
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consumable Name</TableHead>
                    <TableHead>Unit of Measure</TableHead>
                    <TableHead>Cost per Unit (₹)</TableHead>
                    <TableHead>Avg Usage per Wash</TableHead>
                    <TableHead>Cost per Wash (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumables.map((consumable) => {
                    const costPerWash =
                      consumable.costPerUnit * consumable.avgUsagePerWash;
                    return (
                      <TableRow key={consumable.id}>
                        <TableCell className="font-medium">
                          {editingConsumableId === consumable.id ? (
                            <Input
                              value={consumable.name}
                              onChange={(e) =>
                                updateConsumableField(consumable.id, "name", e.target.value)
                              }
                              className="w-full"
                            />
                          ) : (
                            consumable.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingConsumableId === consumable.id ? (
                            <Input
                              value={consumable.unitOfMeasure}
                              onChange={(e) =>
                                updateConsumableField(consumable.id, "unitOfMeasure", e.target.value)
                              }
                              className="w-20"
                            />
                          ) : (
                            consumable.unitOfMeasure
                          )}
                        </TableCell>
                        <TableCell>
                          {editingConsumableId === consumable.id ? (
                            <Input
                              type="number"
                              value={consumable.costPerUnit || 0}
                              onChange={(e) =>
                                updateConsumableField(consumable.id, "costPerUnit", parseFloat(e.target.value) || 0)
                              }
                              className="w-24"
                            />
                          ) : (
                            `₹${consumable.costPerUnit.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>
                          {editingConsumableId === consumable.id ? (
                            <Input
                              type="number"
                              value={consumable.avgUsagePerWash || 0}
                              onChange={(e) =>
                                updateConsumableField(consumable.id, "avgUsagePerWash", parseFloat(e.target.value) || 0)
                              }
                              className="w-24"
                            />
                          ) : (
                            consumable.avgUsagePerWash
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          ₹{costPerWash.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              consumable.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {consumable.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingConsumableId === consumable.id ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => saveConsumable(consumable.id)}
                                className="text-green-600"
                              >
                                Save
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editConsumable(consumable)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteConsumable(consumable.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">
                    Total Consumables Cost per Wash:
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    ₹{consumablesCostPerWash.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <EquipmentCostParameters />
        </TabsContent>

        {/* Manpower Tab */}
        <TabsContent value="manpower" className="space-y-4">
          <SalaryHistoryManagement />
        </TabsContent>

        {/* Overhead Tab */}
        <TabsContent value="overhead" className="space-y-4">
          <OverheadManagement />
        </TabsContent>
      </Tabs>

      {/* Material Detail View */}
      {showMaterialDetail && selectedMaterial && (
        <MaterialDetailView
          material={selectedMaterial}
          open={showMaterialDetail}
          onOpenChange={setShowMaterialDetail}
        />
      )}

      {/* Add Material Dialog */}
      <Dialog open={showAddMaterial} onOpenChange={setShowAddMaterial}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Material Name *</label>
              <Input
                value={newMaterial.name}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, name: e.target.value })
                }
                placeholder="Enter material name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit of Measure</label>
                <Input
                  value={newMaterial.unitOfMeasure}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      unitOfMeasure: e.target.value,
                    })
                  }
                  placeholder="ml, L, kg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost per Unit (₹)</label>
                <Input
                  type="number"
                  value={newMaterial.costPerUnit}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      costPerUnit: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Shelf Life (days)</label>
                <Input
                  type="number"
                  value={newMaterial.shelfLife}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      shelfLife: parseInt(e.target.value) || 30,
                    })
                  }
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={newMaterial.status}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      status: e.target.value as "Active" | "Inactive",
                    })
                  }
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Supplier *</label>
              <Input
                value={newMaterial.supplier}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, supplier: e.target.value })
                }
                placeholder="Enter supplier name"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMaterial(false);
                setNewMaterial({
                  name: "",
                  unitOfMeasure: "ml",
                  costPerUnit: 0,
                  shelfLife: 30,
                  supplier: "",
                  status: "Active",
                  usageMapping: [],
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={addMaterial}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Consumable Dialog */}
      <Dialog open={showAddConsumable} onOpenChange={setShowAddConsumable}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Consumable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Consumable Name *</label>
              <Input
                value={newConsumable.name}
                onChange={(e) =>
                  setNewConsumable({ ...newConsumable, name: e.target.value })
                }
                placeholder="Enter consumable name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit of Measure</label>
                <Input
                  value={newConsumable.unitOfMeasure}
                  onChange={(e) =>
                    setNewConsumable({
                      ...newConsumable,
                      unitOfMeasure: e.target.value,
                    })
                  }
                  placeholder="unit, piece, L"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost per Unit (₹)</label>
                <Input
                  type="number"
                  value={newConsumable.costPerUnit}
                  onChange={(e) =>
                    setNewConsumable({
                      ...newConsumable,
                      costPerUnit: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Avg Usage per Wash
                </label>
                <Input
                  type="number"
                  value={newConsumable.avgUsagePerWash}
                  onChange={(e) =>
                    setNewConsumable({
                      ...newConsumable,
                      avgUsagePerWash: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={newConsumable.status}
                  onChange={(e) =>
                    setNewConsumable({
                      ...newConsumable,
                      status: e.target.value as "Active" | "Inactive",
                    })
                  }
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddConsumable(false);
                setNewConsumable({
                  name: "",
                  unitOfMeasure: "unit",
                  costPerUnit: 0,
                  avgUsagePerWash: 0,
                  status: "Active",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={addConsumable}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Consumable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}