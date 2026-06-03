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
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Package,
  Calendar as CalendarIcon,
  AlertCircle,
  Save,
  User,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { type UsageRateChangeReason } from "../../data/costData";

interface UpdateStandardUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string;
  materialName: string;
  unitOfMeasure: string;
  usageMapping: { package: string; quantityPerWash: number }[];
  onSave: (update: {
    packageName: string;
    effectiveDate: Date;
    newStandardQuantity: number;
    reason: UsageRateChangeReason;
    notes?: string;
  }) => void;
}

const USAGE_RATE_CHANGE_REASONS: UsageRateChangeReason[] = [
  "Optimized for Quality",
  "Supplier Product Strength Change",
  "Quality Complaint Investigation",
  "Seasonal Adjustment",
  "Cost Reduction Initiative",
  "Other",
];

export function UpdateStandardUsageDialog({
  open,
  onOpenChange,
  materialId,
  materialName,
  unitOfMeasure,
  usageMapping,
  onSave,
}: UpdateStandardUsageDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>(
    usageMapping[0]?.package || ""
  );
  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date());
  const [newStandardQuantity, setNewStandardQuantity] = useState<string>("");
  const [reason, setReason] = useState<UsageRateChangeReason>("Optimized for Quality");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock user - in production this would come from auth context
  const currentUser = "Rajesh Kumar (SA)";

  const currentMapping = usageMapping.find((m) => m.package === selectedPackage);
  const currentQuantity = currentMapping?.quantityPerWash || 0;

  const handleSave = () => {
    // Validation
    if (!selectedPackage) {
      toast.error("Please select a package");
      return;
    }

    if (!newStandardQuantity || parseFloat(newStandardQuantity) <= 0) {
      toast.error("Please enter a valid standard quantity");
      return;
    }

    if (!effectiveDate) {
      toast.error("Please select an effective date");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      onSave({
        packageName: selectedPackage,
        effectiveDate,
        newStandardQuantity: parseFloat(newStandardQuantity),
        reason,
        notes: notes.trim() || undefined,
      });

      toast.success("Standard usage rate updated successfully", {
        description: `${materialName} — ${selectedPackage}: ${newStandardQuantity} ${unitOfMeasure}`,
      });

      // Reset form
      setSelectedPackage(usageMapping[0]?.package || "");
      setEffectiveDate(new Date());
      setNewStandardQuantity("");
      setReason("Optimized for Quality");
      setNotes("");
      setIsSubmitting(false);
      onOpenChange(false);
    }, 800);
  };

  const quantityChange = newStandardQuantity
    ? parseFloat(newStandardQuantity) - currentQuantity
    : 0;
  const quantityChangePercent =
    currentQuantity > 0 ? (quantityChange / currentQuantity) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Update Standard Usage Rate
          </DialogTitle>
          <DialogDescription>
            Update the standard quantity per wash for <strong>{materialName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Package Selection */}
          <div className="space-y-2">
            <Label htmlFor="package">Select Package *</Label>
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger>
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                {usageMapping.map((mapping) => (
                  <SelectItem key={mapping.package} value={mapping.package}>
                    {mapping.package} — Current: {mapping.quantityPerWash} {unitOfMeasure}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Quantity Display */}
          {selectedPackage && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    Current Standard Quantity
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {currentQuantity} {unitOfMeasure}
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      per wash
                    </span>
                  </div>
                </div>
                {newStandardQuantity && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Change Impact</div>
                    <div
                      className={`text-xl font-bold flex items-center gap-1 ${
                        quantityChange > 0
                          ? "text-red-600"
                          : quantityChange < 0
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {quantityChange > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : quantityChange < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : null}
                      {quantityChange > 0 ? "+" : ""}
                      {quantityChangePercent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">
                      {quantityChange > 0 ? "+" : ""}
                      {quantityChange.toFixed(1)} {unitOfMeasure}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="text-xs text-gray-600">
                  {quantityChange > 0 ? (
                    <span className="text-red-700">
                      ⚠️ <strong>Cost will increase</strong> — More material used per wash
                    </span>
                  ) : quantityChange < 0 ? (
                    <span className="text-green-700">
                      ✓ <strong>Cost will decrease</strong> — Less material used per wash
                    </span>
                  ) : (
                    <span className="text-gray-500">No change in cost</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Effective Date */}
          <div className="space-y-2">
            <Label htmlFor="effectiveDate" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              Effective From Date *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {effectiveDate ? (
                    format(effectiveDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={effectiveDate}
                  onSelect={(date) => date && setEffectiveDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* New Standard Quantity */}
          <div className="space-y-2">
            <Label htmlFor="newStandardQuantity" className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              New Standard Quantity *
            </Label>
            <div className="relative">
              <Input
                id="newStandardQuantity"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={newStandardQuantity}
                onChange={(e) => setNewStandardQuantity(e.target.value)}
                className="text-lg font-semibold"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {unitOfMeasure} per wash
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change *</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as UsageRateChangeReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {USAGE_RATE_CHANGE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes (Optional)
              <span className="text-xs text-gray-500 ml-2">
                Explain the rationale for this change
              </span>
            </Label>
            <Textarea
              id="notes"
              placeholder="e.g., 'Reduced quantity after testing showed no quality impact' or 'Increased due to customer feedback'"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Approved By */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              Approved By
            </Label>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <Badge className="bg-purple-600 text-white">{currentUser}</Badge>
              <div className="text-xs text-gray-600 mt-2">
                Your name will be automatically recorded as the approver
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-orange-800">
              <strong>Important:</strong> This will update the "ideal cost per wash"
              calculations for <strong>{selectedPackage}</strong> package from the
              effective date onwards. Historical ideal costs will use the standard that
              was active during that time period.
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : "Update Standard Usage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
