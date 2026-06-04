import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import {
  Plus,
  Save,
  Wrench,
  Package,
  DollarSign,
  Percent,
  Calendar,
} from "lucide-react";

interface AddEquipmentCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (category: {
    categoryName: string;
    subCategory: string;
    defaultUsefulLifeMonths: number;
    defaultResidualValuePercent: number;
    averagePurchaseCost: number;
  }) => void;
}

export function AddEquipmentCategoryDialog({
  open,
  onOpenChange,
  onSave,
}: AddEquipmentCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [defaultUsefulLifeMonths, setDefaultUsefulLifeMonths] = useState("");
  const [defaultResidualValuePercent, setDefaultResidualValuePercent] = useState("");
  const [averagePurchaseCost, setAveragePurchaseCost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = () => {
    // Validation
    if (!categoryName.trim()) {
      toast.error("Please enter category name");
      return;
    }

    if (!subCategory.trim()) {
      toast.error("Please enter sub-category");
      return;
    }

    if (!defaultUsefulLifeMonths || parseFloat(defaultUsefulLifeMonths) <= 0) {
      toast.error("Please enter a valid useful life");
      return;
    }

    if (
      !defaultResidualValuePercent ||
      parseFloat(defaultResidualValuePercent) < 0 ||
      parseFloat(defaultResidualValuePercent) > 100
    ) {
      toast.error("Residual value must be between 0 and 100%");
      return;
    }

    if (!averagePurchaseCost || parseFloat(averagePurchaseCost) <= 0) {
      toast.error("Please enter a valid average purchase cost");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      onSave({
        categoryName: categoryName.trim(),
        subCategory: subCategory.trim(),
        defaultUsefulLifeMonths: parseFloat(defaultUsefulLifeMonths),
        defaultResidualValuePercent: parseFloat(defaultResidualValuePercent),
        averagePurchaseCost: parseFloat(averagePurchaseCost),
      });

      // Reset form
      setCategoryName("");
      setSubCategory("");
      setDefaultUsefulLifeMonths("");
      setDefaultResidualValuePercent("");
      setAveragePurchaseCost("");
      setIsSubmitting(false);
      onOpenChange(false);
    }, 800);
  };

  // Calculate monthly depreciation estimate
  const monthlyDepreciation =
    averagePurchaseCost && defaultUsefulLifeMonths && defaultResidualValuePercent
      ? (parseFloat(averagePurchaseCost) *
          (1 - parseFloat(defaultResidualValuePercent) / 100)) /
        parseFloat(defaultUsefulLifeMonths)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Add Equipment Category
          </DialogTitle>
          <DialogDescription>
            Create a new equipment category with default parameters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="categoryName" className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-gray-500" />
              Category Name *
            </Label>
            <Input
              id="categoryName"
              placeholder="e.g., Spray Nozzle, Hose Reel, etc."
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>

          {/* Sub-Category */}
          <div className="space-y-2">
            <Label htmlFor="subCategory" className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              Sub-Category *
            </Label>
            <Input
              id="subCategory"
              placeholder="e.g., Washing Equipment, Storage Equipment, etc."
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Default Useful Life */}
            <div className="space-y-2">
              <Label htmlFor="defaultUsefulLifeMonths" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Default Useful Life (months) *
              </Label>
              <Input
                id="defaultUsefulLifeMonths"
                type="number"
                min="1"
                step="1"
                placeholder="24"
                value={defaultUsefulLifeMonths}
                onChange={(e) => setDefaultUsefulLifeMonths(e.target.value)}
              />
            </div>

            {/* Residual Value */}
            <div className="space-y-2">
              <Label
                htmlFor="defaultResidualValuePercent"
                className="flex items-center gap-2"
              >
                <Percent className="w-4 h-4 text-gray-500" />
                Residual Value (%) *
              </Label>
              <Input
                id="defaultResidualValuePercent"
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="10"
                value={defaultResidualValuePercent}
                onChange={(e) => setDefaultResidualValuePercent(e.target.value)}
              />
            </div>
          </div>

          {/* Average Purchase Cost */}
          <div className="space-y-2">
            <Label htmlFor="averagePurchaseCost" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              Average Purchase Cost (₹) *
            </Label>
            <Input
              id="averagePurchaseCost"
              type="number"
              min="0"
              step="100"
              placeholder="2500"
              value={averagePurchaseCost}
              onChange={(e) => setAveragePurchaseCost(e.target.value)}
              className="text-lg font-semibold"
            />
            <div className="text-xs text-gray-500">
              Used for planning before actual equipment is purchased
            </div>
          </div>

          {/* Calculation Preview */}
          {monthlyDepreciation > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">
                Estimated Monthly Depreciation
              </div>
              <div className="text-2xl font-bold text-blue-600">
                ₹{monthlyDepreciation.toFixed(2)}
                <span className="text-sm font-normal text-blue-700 ml-2">
                  per month
                </span>
              </div>
              <div className="text-xs text-blue-700 mt-2">
                Based on purchase cost ₹{parseFloat(averagePurchaseCost).toLocaleString()},
                useful life {defaultUsefulLifeMonths} months, and residual value{" "}
                {defaultResidualValuePercent}%
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
            <strong>Note:</strong> Once created, this category will be available for
            equipment assignment. The default useful life and residual value can be
            overridden for individual equipment items. You can update the useful life
            later using the "Update Useful Life" function.
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : "Add Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
