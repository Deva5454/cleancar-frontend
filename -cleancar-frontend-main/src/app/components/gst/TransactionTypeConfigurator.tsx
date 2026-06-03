/**
 * Transaction Type Configurator
 *
 * Modal for creating custom GST transaction sub-types.
 * Allows users to define custom categories with ITC rules and accounting mappings.
 */

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { DataService } from "../../services/DataService";
import type { TransactionSubType } from "../../config/gstTransactionTypes";

interface TransactionTypeConfiguratorProps {
  open: boolean;
  parentType: string; // "Purchase" | "Expense" | "Sale" | "Credit Note" | "Debit Note"
  onClose: () => void;
  onConfirm: (newSubType: TransactionSubType) => void;
}

type ITCEligibility = "eligible" | "blocked" | "evaluate";

export function TransactionTypeConfigurator({
  open,
  parentType,
  onClose,
  onConfirm,
}: TransactionTypeConfiguratorProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    itcEligibility: "evaluate" as ITCEligibility,
    accountHead: "",
    hsnHint: "",
  });

  const [errors, setErrors] = useState({
    name: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (field === "name" && errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const handleITCChange = (value: ITCEligibility) => {
    setFormData((prev) => ({ ...prev, itcEligibility: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setErrors({ name: "Sub-type name is required" });
      return false;
    }
    return true;
  };

  const handleConfirm = () => {
    if (!validateForm()) return;

    // Build ITC rule text based on selection
    let itcRule = "";
    if (formData.itcEligibility === "eligible") {
      itcRule = "Custom — user defined as eligible";
    } else if (formData.itcEligibility === "blocked") {
      itcRule = "Custom — user defined as blocked (verify with CA)";
    } else {
      itcRule = "Custom — evaluate case by case with CA";
    }

    // Create new sub-type object
    const newSubType: TransactionSubType = {
      id: `CUSTOM_${Date.now()}`,
      parentType: parentType,
      label: formData.name.trim(),
      description: formData.description.trim() || "",
      itcEligible: formData.itcEligibility === "eligible",
      itcRule: itcRule,
      hsnHint: formData.hsnHint.trim() || undefined,
      accountHead: formData.accountHead.trim() || "Miscellaneous",
      isCustom: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: "current_user", // TODO: Replace with actual user context
    };

    // Save to DataService
    DataService.insert("CUSTOM_TRANSACTION_SUB_TYPES", newSubType);

    // Notify parent and close
    onConfirm(newSubType);
    toast.success(`'${formData.name}' added to ${parentType} sub-types`);

    // Reset form and close
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      itcEligibility: "evaluate",
      accountHead: "",
      hsnHint: "",
    });
    setErrors({ name: "" });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Get parent type badge color
  const getParentTypeBadgeColor = () => {
    switch (parentType) {
      case "Purchase":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "Expense":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "Sale":
        return "bg-green-100 text-green-700 border-green-300";
      case "Credit Note":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "Debit Note":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getITCDisplayText = () => {
    switch (formData.itcEligibility) {
      case "eligible":
        return "Fully Eligible";
      case "blocked":
        return "Blocked";
      case "evaluate":
        return "Evaluate Case by Case";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Configure Custom Transaction Type</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-600">For:</span>
            <Badge variant="outline" className={getParentTypeBadgeColor()}>
              {parentType}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* SECTION 1: Form Fields */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="space-y-4">
            {/* Sub-Type Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Sub-Type Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value.slice(0, 40))}
                placeholder='e.g. "Water Bill" or "Security Deposit"'
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              <p className="text-xs text-gray-500 mt-1">{formData.name.length}/40 characters</p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                rows={2}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Brief description of what expense/purchase this covers"
              />
            </div>

            {/* ITC Eligibility */}
            <div>
              <Label className="text-sm font-medium mb-3 block">ITC Eligibility</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="itc"
                    checked={formData.itcEligibility === "eligible"}
                    onChange={() => handleITCChange("eligible")}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Fully Eligible</div>
                    <div className="text-xs text-gray-500">ITC can be claimed in full</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="itc"
                    checked={formData.itcEligibility === "blocked"}
                    onChange={() => handleITCChange("blocked")}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Blocked</div>
                    <div className="text-xs text-gray-500">
                      Section 17(5) — ITC not allowed
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="itc"
                    checked={formData.itcEligibility === "evaluate"}
                    onChange={() => handleITCChange("evaluate")}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Evaluate Case by Case</div>
                    <div className="text-xs text-gray-500">Check with CA before claiming</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Accounting Head */}
            <div>
              <Label htmlFor="accountHead" className="text-sm font-medium">
                Accounting Head
              </Label>
              <Input
                id="accountHead"
                value={formData.accountHead}
                onChange={(e) => handleInputChange("accountHead", e.target.value)}
                placeholder="e.g. Utilities, Office Expenses, Fixed Assets"
              />
              <p className="text-xs text-gray-500 mt-1">
                This maps to your Tally/accounting system account head
              </p>
            </div>

            {/* HSN/SAC Code Hint */}
            <div>
              <Label htmlFor="hsnHint" className="text-sm font-medium">
                HSN/SAC Code Hint
              </Label>
              <Input
                id="hsnHint"
                value={formData.hsnHint}
                onChange={(e) => handleInputChange("hsnHint", e.target.value)}
                placeholder="e.g. 9972 or 8471"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional — helps pre-fill HSN/SAC field in the transaction form
              </p>
            </div>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* SECTION 2: Preview & Notice */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="space-y-4 pt-4 border-t">
            {/* Preview Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">
                Preview of new sub-type
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="font-medium text-blue-900 w-32">Name:</span>
                  <span className="text-blue-700">
                    {formData.name || <span className="italic text-blue-400">Not entered</span>}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-blue-900 w-32">Parent:</span>
                  <span className="text-blue-700">{parentType}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-blue-900 w-32">ITC:</span>
                  <span className="text-blue-700">{getITCDisplayText()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-blue-900 w-32">Account Head:</span>
                  <span className="text-blue-700">
                    {formData.accountHead || <span className="italic text-blue-400">Not entered</span>}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-blue-900 w-32">Status:</span>
                  <span className="text-blue-700">Will be added as Custom</span>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900 mb-1">Important</h4>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Custom sub-types are saved to your local configuration. Once confirmed, this
                    sub-type will appear in the Transaction Type dropdown for all future entries.
                    Please consult your CA before enabling ITC on custom categories. Custom
                    sub-types can be deactivated at any time from Settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
            Confirm & Add to System
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
