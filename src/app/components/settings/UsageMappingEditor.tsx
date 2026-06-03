import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
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
import { Plus, Trash2, Save, Settings } from "lucide-react";
import { toast } from "sonner";
import { type Material } from "../../data/costData";

const PLAN_TYPES = [
  "Basic",
  "Premium",
  "Elite",
  "Interior",
  "Elite Plus",
  "One-Time Non-Member",
  "One-Time Member",
] as const;

interface UsageMappingEditorProps {
  material: Material;
  onMappingChange: (newMapping: { package: string; quantityPerWash: number }[]) => void;
}

export function UsageMappingEditor({
  material,
  onMappingChange,
}: UsageMappingEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mappings, setMappings] = useState(material.usageMapping);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);

  const handleAddMapping = () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }

    if (quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    // Check if mapping already exists
    const existingIndex = mappings.findIndex((m) => m.package === selectedPlan);
    
    if (existingIndex >= 0) {
      // Update existing mapping
      const newMappings = [...mappings];
      newMappings[existingIndex] = {
        package: selectedPlan,
        quantityPerWash: quantity,
      };
      setMappings(newMappings);
      toast.success("Mapping updated");
    } else {
      // Add new mapping
      setMappings([
        ...mappings,
        {
          package: selectedPlan,
          quantityPerWash: quantity,
        },
      ]);
      toast.success("Mapping added");
    }

    // Reset form
    setSelectedPlan("");
    setQuantity(0);
  };

  const handleRemoveMapping = (packageName: string) => {
    setMappings(mappings.filter((m) => m.package !== packageName));
    toast.info("Mapping removed");
  };

  const handleUpdateQuantity = (packageName: string, newQuantity: number) => {
    setMappings(
      mappings.map((m) =>
        m.package === packageName
          ? { ...m, quantityPerWash: newQuantity }
          : m
      )
    );
  };

  const handleSave = () => {
    onMappingChange(mappings);
    setIsOpen(false);
    toast.success("Usage mappings saved successfully");
  };

  const handleCancel = () => {
    setMappings(material.usageMapping);
    setIsOpen(false);
  };

  // Get available plans (not yet mapped)
  const availablePlans = PLAN_TYPES.filter(
    (plan) => !mappings.some((m) => m.package === plan) || selectedPlan === plan
  );

  return (
    <>
      {/* Inline Display */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap gap-1 max-w-xs">
          {material.usageMapping.length > 0 ? (
            material.usageMapping.map((mapping, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-xs"
              >
                {mapping.package}: {mapping.quantityPerWash}
                {material.unitOfMeasure}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-gray-400">No mappings</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-blue-600 hover:text-blue-700 text-xs h-auto py-1"
        >
          <Settings className="w-3 h-3 mr-1" />
          Edit Mappings
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit Usage Mapping - {material.name}
              <Badge variant="outline" className="ml-2">
                {material.unitOfMeasure}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Define how much of this material is used per wash for each plan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Add/Update Mapping Form */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3">
                Add or Update Plan Mapping
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Plan</label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                  >
                    <option value="">-- Select Plan --</option>
                    {PLAN_TYPES.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Quantity per Wash ({material.unitOfMeasure})
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    placeholder="0.0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">&nbsp;</label>
                  <Button
                    onClick={handleAddMapping}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {mappings.some((m) => m.package === selectedPlan)
                      ? "Update"
                      : "Add"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Current Mappings Table */}
            <div>
              <h3 className="font-medium mb-3">
                Current Mappings ({mappings.length})
              </h3>
              {mappings.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-500">
                    No usage mappings defined yet. Add mappings using the form
                    above.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan Name</TableHead>
                        <TableHead>
                          Quantity per Wash ({material.unitOfMeasure})
                        </TableHead>
                        <TableHead>Cost per Wash</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings
                        .sort((a, b) => a.package.localeCompare(b.package))
                        .map((mapping) => {
                          const costPerWash =
                            mapping.quantityPerWash * material.costPerUnit;
                          return (
                            <TableRow key={mapping.package}>
                              <TableCell className="font-medium">
                                {mapping.package}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={mapping.quantityPerWash}
                                  onChange={(e) =>
                                    handleUpdateQuantity(
                                      mapping.package,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-32"
                                  min="0"
                                  step="0.01"
                                />
                              </TableCell>
                              <TableCell className="font-medium text-blue-600">
                                ₹{costPerWash.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveMapping(mapping.package)
                                  }
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Summary */}
            {mappings.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-900">
                      Material: {material.name}
                    </div>
                    <div className="text-sm text-green-700">
                      Cost per {material.unitOfMeasure}: ₹
                      {material.costPerUnit.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-700">
                      Total Plans Mapped
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {mappings.length} / {PLAN_TYPES.length}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Mappings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}