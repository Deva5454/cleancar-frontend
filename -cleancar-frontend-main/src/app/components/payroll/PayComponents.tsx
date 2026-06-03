import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { GripVertical, Edit, Plus, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { PayComponent, DEFAULT_PAY_COMPONENTS } from "./payroll-types";

export function PayComponents() {
  const [components, setComponents] = useState<PayComponent[]>(DEFAULT_PAY_COMPONENTS);
  const [editingComponent, setEditingComponent] = useState<PayComponent | null>(null);
  const [showImpactWarning, setShowImpactWarning] = useState(false);
  const [draggedItem, setDraggedItem] = useState<PayComponent | null>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponent, setNewComponent] = useState<PayComponent | null>(null);

  const handleDragStart = (component: PayComponent) => {
    setDraggedItem(component);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetComponent: PayComponent) => {
    if (!draggedItem) return;

    const newComponents = [...components];
    const draggedIndex = newComponents.findIndex((c) => c.id === draggedItem.id);
    const targetIndex = newComponents.findIndex((c) => c.id === targetComponent.id);

    newComponents.splice(draggedIndex, 1);
    newComponents.splice(targetIndex, 0, draggedItem);

    // Update order numbers
    newComponents.forEach((comp, index) => {
      comp.order = index + 1;
    });

    setComponents(newComponents);
    setDraggedItem(null);
    toast.success("Component order updated");
  };

  const handleEdit = (component: PayComponent) => {
    setEditingComponent({ ...component });
  };

  const handleSaveEdit = () => {
    if (!editingComponent) return;

    setShowImpactWarning(true);
  };

  const confirmSaveEdit = () => {
    if (!editingComponent) return;

    const updatedComponents = components.map((c) =>
      c.id === editingComponent.id ? editingComponent : c
    );
    setComponents(updatedComponents);
    setEditingComponent(null);
    setShowImpactWarning(false);
    toast.success("Pay component updated successfully");
  };

  const updateEditingField = <K extends keyof PayComponent>(
    field: K,
    value: PayComponent[K]
  ) => {
    if (!editingComponent) return;
    setEditingComponent({ ...editingComponent, [field]: value });
  };

  const updateComplianceToggle = (key: keyof PayComponent["compliance"]) => {
    if (!editingComponent) return;
    setEditingComponent({
      ...editingComponent,
      compliance: {
        ...editingComponent.compliance,
        [key]: !editingComponent.compliance[key],
      },
    });
  };

  const updateOperationsToggle = (key: keyof PayComponent["operations"]) => {
    if (!editingComponent) return;
    setEditingComponent({
      ...editingComponent,
      operations: {
        ...editingComponent.operations,
        [key]: !editingComponent.operations[key],
      },
    });
  };

  const handleAddComponent = () => {
    const maxOrder = Math.max(...components.map(c => c.order), 0);
    setNewComponent({
      id: `custom-${Date.now()}`,
      name: "",
      compliance: { pf: false, esic: false, pt: false },
      operations: { ot: false, bonus: false, leave: false, gratuity: false, minWage: false, adjustment: false },
      tds: "100% Taxable",
      sourceType: "Manual",
      payType: "Earning",
      status: "Active",
      order: maxOrder + 1,
      affectedEmployees: 0,
      affectedStructures: 0,
    });
    setShowAddComponent(true);
  };

  const handleSaveNewComponent = () => {
    if (!newComponent || !newComponent.name.trim()) {
      toast.error("Component name is required");
      return;
    }
    setComponents([...components, newComponent]);
    setNewComponent(null);
    setShowAddComponent(false);
    toast.success("Component added successfully");
  };

  const updateNewComponentField = <K extends keyof PayComponent>(
    field: K,
    value: PayComponent[K]
  ) => {
    if (!newComponent) return;
    setNewComponent({ ...newComponent, [field]: value });
  };

  const updateNewComplianceToggle = (key: keyof PayComponent["compliance"]) => {
    if (!newComponent) return;
    setNewComponent({
      ...newComponent,
      compliance: {
        ...newComponent.compliance,
        [key]: !newComponent.compliance[key],
      },
    });
  };

  const updateNewOperationsToggle = (key: keyof PayComponent["operations"]) => {
    if (!newComponent) return;
    setNewComponent({
      ...newComponent,
      operations: {
        ...newComponent.operations,
        [key]: !newComponent.operations[key],
      },
    });
  };

  // Group components by type
  const earningsComponents = components.filter(c => c.payType === "Earning");
  const deductionComponents = components.filter(c => c.payType === "Deduction");
  const employerContributions = components.filter(c => c.payType === "Employer Contribution");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pay Components</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage salary components, compliance settings, and tax configurations
          </p>
        </div>
        <Button size="sm" onClick={handleAddComponent}>
          <Plus className="w-4 h-4 mr-2" />
          Add Component
        </Button>
      </div>

      {/* Earnings Components */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Earnings ({earningsComponents.length})
        </h3>
        <div className="space-y-3">
          {earningsComponents.map((component) => (
            <Card
              key={component.id}
              draggable
              onDragStart={() => handleDragStart(component)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(component)}
              className="cursor-move hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center mt-1">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{component.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={component.status === "Active" ? "default" : "secondary"}
                          className={
                            component.status === "Active"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }
                        >
                          {component.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(component)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {component.compliance.pf && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">PF</Badge>
                      )}
                      {component.compliance.esic && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">ESIC</Badge>
                      )}
                      {component.compliance.pt && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">PT</Badge>
                      )}
                      {component.operations.ot && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">OT</Badge>
                      )}
                      {component.operations.bonus && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Bonus</Badge>
                      )}
                      {component.operations.leave && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Leave</Badge>
                      )}
                      {component.operations.gratuity && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Gratuity</Badge>
                      )}
                      {component.operations.minWage && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Min Wage</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Tax:</span>
                        <Badge
                          variant="outline"
                          className={
                            component.tds === "100% Taxable"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : component.tds === "Conditional"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }
                        >
                          {component.tds}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Source:</span>
                        <span>{component.sourceType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Type:</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {component.payType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Employer Contributions */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Employer Contributions ({employerContributions.length})
        </h3>
        <div className="space-y-3">
          {employerContributions.map((component) => (
            <Card
              key={component.id}
              draggable
              onDragStart={() => handleDragStart(component)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(component)}
              className="cursor-move hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center mt-1">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{component.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={component.status === "Active" ? "default" : "secondary"}
                          className={
                            component.status === "Active"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }
                        >
                          {component.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(component)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {component.compliance.pf && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">PF</Badge>
                      )}
                      {component.compliance.esic && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">ESIC</Badge>
                      )}
                      {component.operations.gratuity && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Gratuity</Badge>
                      )}
                      {component.operations.bonus && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Bonus</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Source:</span>
                        <span>{component.sourceType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Type:</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {component.payType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Employee Deductions */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          Employee Deductions ({deductionComponents.length})
        </h3>
        <div className="space-y-3">
          {deductionComponents.map((component) => (
            <Card
              key={component.id}
              draggable
              onDragStart={() => handleDragStart(component)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(component)}
              className="cursor-move hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center mt-1">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{component.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={component.status === "Active" ? "default" : "secondary"}
                          className={
                            component.status === "Active"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }
                        >
                          {component.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(component)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {component.compliance.pf && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">PF</Badge>
                      )}
                      {component.compliance.esic && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">ESIC</Badge>
                      )}
                      {component.compliance.pt && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">PT</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Tax:</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {component.tds}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Source:</span>
                        <span>{component.sourceType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Type:</span>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {component.payType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Drawer */}
      <Sheet open={!!editingComponent} onOpenChange={() => setEditingComponent(null)}>
        <SheetContent className="w-full sm:w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Pay Component</SheetTitle>
            <SheetDescription>
              Update component settings and configurations
            </SheetDescription>
          </SheetHeader>

          {editingComponent && (
            <div className="space-y-6 mt-6">
              {/* Component Name */}
              <div className="space-y-2">
                <Label>Component Name</Label>
                <Input
                  value={editingComponent.name}
                  onChange={(e) => updateEditingField("name", e.target.value)}
                />
              </div>

              {/* Compliance Toggles */}
              <div className="space-y-3">
                <Label>Compliance Settings</Label>
                <div className="space-y-2">
                  <div
                    onClick={() => updateComplianceToggle("pf")}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      editingComponent.compliance.pf
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Include in PF Calculation</span>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors ${
                          editingComponent.compliance.pf ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            editingComponent.compliance.pf ? "translate-x-5" : "translate-x-0.5"
                          } mt-0.5`}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => updateComplianceToggle("esic")}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      editingComponent.compliance.esic
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Include in ESIC Calculation</span>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors ${
                          editingComponent.compliance.esic ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            editingComponent.compliance.esic ? "translate-x-5" : "translate-x-0.5"
                          } mt-0.5`}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => updateComplianceToggle("pt")}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      editingComponent.compliance.pt
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Include in PT Calculation</span>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors ${
                          editingComponent.compliance.pt ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            editingComponent.compliance.pt ? "translate-x-5" : "translate-x-0.5"
                          } mt-0.5`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operations Toggles */}
              <div className="space-y-3">
                <Label>Operations Settings</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries({
                    ot: "Overtime",
                    bonus: "Bonus",
                    leave: "Leave",
                    gratuity: "Gratuity",
                    minWage: "Min Wage",
                    adjustment: "Adjustment",
                  }).map(([key, label]) => (
                    <div
                      key={key}
                      onClick={() => updateOperationsToggle(key as keyof PayComponent["operations"])}
                      className={`p-2 rounded-lg border cursor-pointer text-center text-sm transition-colors ${
                        editingComponent.operations[key as keyof PayComponent["operations"]]
                          ? "bg-purple-50 border-purple-200 text-purple-700"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* TDS Selection */}
              <div className="space-y-3">
                <Label>Tax Treatment (TDS)</Label>
                <div className="space-y-2">
                  {["100% Taxable", "Conditional", "Non-Taxable"].map((option) => (
                    <div
                      key={option}
                      onClick={() => updateEditingField("tds", option as PayComponent["tds"])}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        editingComponent.tds === option
                          ? "bg-blue-50 border-blue-300 border-2"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            editingComponent.tds === option
                              ? "border-blue-600"
                              : "border-gray-300"
                          }`}
                        >
                          {editingComponent.tds === option && (
                            <div className="w-3 h-3 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <span className="font-medium">{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingComponent.status}
                  onValueChange={(value) =>
                    updateEditingField("status", value as "Active" | "Inactive")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source Type */}
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select
                  value={editingComponent.sourceType}
                  onValueChange={(value) =>
                    updateEditingField("sourceType", value as PayComponent["sourceType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="System">System</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Formula">Formula</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pay Type */}
              <div className="space-y-2">
                <Label>Pay Type</Label>
                <Select
                  value={editingComponent.payType}
                  onValueChange={(value) =>
                    updateEditingField("payType", value as PayComponent["payType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Earning">Earning</SelectItem>
                    <SelectItem value="Deduction">Deduction</SelectItem>
                    <SelectItem value="Employer Contribution">Employer Contribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveEdit} className="flex-1">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingComponent(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add New Component Drawer */}
      <Sheet open={showAddComponent} onOpenChange={() => setShowAddComponent(false)}>
        <SheetContent className="w-full sm:w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add New Pay Component</SheetTitle>
            <SheetDescription>
              Create a custom pay component for your organization
            </SheetDescription>
          </SheetHeader>

          {newComponent && (
            <div className="space-y-6 mt-6">
              {/* Component Name */}
              <div className="space-y-2">
                <Label>Component Name <span className="text-red-500">*</span></Label>
                <Input
                  value={newComponent.name}
                  onChange={(e) => updateNewComponentField("name", e.target.value)}
                  placeholder="e.g., Special Allowance"
                />
              </div>

              {/* Pay Type */}
              <div className="space-y-2">
                <Label>Pay Type <span className="text-red-500">*</span></Label>
                <Select
                  value={newComponent.payType}
                  onValueChange={(value) =>
                    updateNewComponentField("payType", value as PayComponent["payType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Earning">Earning</SelectItem>
                    <SelectItem value="Deduction">Deduction</SelectItem>
                    <SelectItem value="Employer Contribution">Employer Contribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Compliance Toggles */}
              <div className="space-y-3">
                <Label>Compliance Settings</Label>
                <div className="space-y-2">
                  <div
                    onClick={() => updateNewComplianceToggle("pf")}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      newComponent.compliance.pf
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Include in PF Calculation</span>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors ${
                          newComponent.compliance.pf ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            newComponent.compliance.pf ? "translate-x-5" : "translate-x-0.5"
                          } mt-0.5`}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => updateNewComplianceToggle("esic")}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      newComponent.compliance.esic
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Include in ESIC Calculation</span>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors ${
                          newComponent.compliance.esic ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            newComponent.compliance.esic ? "translate-x-5" : "translate-x-0.5"
                          } mt-0.5`}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => updateNewComplianceToggle("pt")}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      newComponent.compliance.pt
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Include in PT Calculation</span>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors ${
                          newComponent.compliance.pt ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            newComponent.compliance.pt ? "translate-x-5" : "translate-x-0.5"
                          } mt-0.5`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operations Toggles */}
              <div className="space-y-3">
                <Label>Operations Settings</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries({
                    ot: "Overtime",
                    bonus: "Bonus",
                    leave: "Leave",
                    gratuity: "Gratuity",
                    minWage: "Min Wage",
                    adjustment: "Adjustment",
                  }).map(([key, label]) => (
                    <div
                      key={key}
                      onClick={() => updateNewOperationsToggle(key as keyof PayComponent["operations"])}
                      className={`p-2 rounded-lg border cursor-pointer text-center text-sm transition-colors ${
                        newComponent.operations[key as keyof PayComponent["operations"]]
                          ? "bg-purple-50 border-purple-200 text-purple-700"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* TDS Selection */}
              <div className="space-y-3">
                <Label>Tax Treatment (TDS)</Label>
                <div className="space-y-2">
                  {["100% Taxable", "Conditional", "Non-Taxable"].map((option) => (
                    <div
                      key={option}
                      onClick={() => updateNewComponentField("tds", option as PayComponent["tds"])}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        newComponent.tds === option
                          ? "bg-blue-50 border-blue-300 border-2"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            newComponent.tds === option
                              ? "border-blue-600"
                              : "border-gray-300"
                          }`}
                        >
                          {newComponent.tds === option && (
                            <div className="w-3 h-3 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <span className="font-medium">{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Type */}
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select
                  value={newComponent.sourceType}
                  onValueChange={(value) =>
                    updateNewComponentField("sourceType", value as PayComponent["sourceType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="System">System</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Formula">Formula</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveNewComponent} className="flex-1">
                  Add Component
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddComponent(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Impact Warning Modal */}
      <Dialog open={showImpactWarning} onOpenChange={setShowImpactWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Confirm Changes
            </DialogTitle>
            <DialogDescription>
              This change will have the following impact:
            </DialogDescription>
          </DialogHeader>

          {editingComponent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Affected Employees</span>
                <span className="text-2xl font-bold text-blue-600">
                  {editingComponent.affectedEmployees}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Affected Salary Structures</span>
                <span className="text-2xl font-bold text-purple-600">
                  {editingComponent.affectedStructures}
                </span>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> Changes will be applied to all future salary calculations.
                  Already processed payrolls will not be affected.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowImpactWarning(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSaveEdit}>Confirm & Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
