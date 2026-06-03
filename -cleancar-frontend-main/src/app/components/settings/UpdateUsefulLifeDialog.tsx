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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  AlertCircle,
  Save,
  TrendingUp,
  TrendingDown,
  Wrench,
} from "lucide-react";
import { type EquipmentUsefulLifeReason } from "../../data/costData";
import { getEquipmentCategory, getCurrentUsefulLife } from "../../data/equipmentSalaryHistoryData";

interface UpdateUsefulLifeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  onSave: (update: {
    effectiveDate: Date;
    newUsefulLifeMonths: number;
    applyTo: "New Equipment Only" | "All Active Equipment";
    reason: EquipmentUsefulLifeReason;
    notes?: string;
  }) => void;
}

const USEFUL_LIFE_REASONS: EquipmentUsefulLifeReason[] = [
  "Durability Improvement Observed",
  "Quality Degradation Observed",
  "Supplier Product Change",
  "Maintenance Practice Change",
  "Other",
];

export function UpdateUsefulLifeDialog({
  open,
  onOpenChange,
  categoryId,
  onSave,
}: UpdateUsefulLifeDialogProps) {
  const category = getEquipmentCategory(categoryId);
  const currentUsefulLife = getCurrentUsefulLife(categoryId);

  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date());
  const [newUsefulLifeMonths, setNewUsefulLifeMonths] = useState<string>("");
  const [applyTo, setApplyTo] = useState<"New Equipment Only" | "All Active Equipment">(
    "New Equipment Only"
  );
  const [reason, setReason] = useState<EquipmentUsefulLifeReason>(
    "Durability Improvement Observed"
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock user
  const currentUser = "Rajesh Kumar (SA)";

  if (!category) {
    return null;
  }

  const handleSave = () => {
    // Validation
    const newLifeValue = parseFloat(newUsefulLifeMonths);
    if (!newUsefulLifeMonths || newLifeValue <= 0) {
      toast.error("Please enter a valid useful life in months");
      return;
    }

    if (newLifeValue === currentUsefulLife) {
      toast.error("New useful life must be different from current value");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      onSave({
        effectiveDate,
        newUsefulLifeMonths: newLifeValue,
        applyTo,
        reason,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setEffectiveDate(new Date());
      setNewUsefulLifeMonths("");
      setApplyTo("New Equipment Only");
      setReason("Durability Improvement Observed");
      setNotes("");
      setIsSubmitting(false);
      onOpenChange(false);
    }, 800);
  };

  const lifeChange = newUsefulLifeMonths
    ? parseFloat(newUsefulLifeMonths) - currentUsefulLife
    : 0;
  const lifeChangePercent =
    currentUsefulLife > 0 ? (lifeChange / currentUsefulLife) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" />
            Update Equipment Useful Life
          </DialogTitle>
          <DialogDescription>
            Update the useful life for <strong>{category.categoryName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Useful Life Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Current Useful Life
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentUsefulLife} months
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {category.subCategory}
                </div>
              </div>
              {newUsefulLifeMonths && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Change Impact</div>
                  <div
                    className={`text-xl font-bold flex items-center gap-1 justify-end ${
                      lifeChange > 0
                        ? "text-green-600"
                        : lifeChange < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {lifeChange > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : lifeChange < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : null}
                    {lifeChange > 0 ? "+" : ""}
                    {lifeChangePercent.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {lifeChange > 0 ? "+" : ""}
                    {lifeChange} months
                  </div>
                </div>
              )}
            </div>
            {lifeChange !== 0 && newUsefulLifeMonths && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="text-xs text-gray-600">
                  {lifeChange > 0 ? (
                    <span className="text-green-700">
                      ✓ <strong>Lower depreciation cost per month</strong> — Equipment
                      lasting longer
                    </span>
                  ) : (
                    <span className="text-red-700">
                      ⚠️ <strong>Higher depreciation cost per month</strong> — Equipment
                      wearing faster
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

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

          {/* New Useful Life */}
          <div className="space-y-2">
            <Label htmlFor="newUsefulLifeMonths" className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-gray-500" />
              New Useful Life (months) *
            </Label>
            <Input
              id="newUsefulLifeMonths"
              type="number"
              min="1"
              step="1"
              placeholder="24"
              value={newUsefulLifeMonths}
              onChange={(e) => setNewUsefulLifeMonths(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>

          {/* Apply To */}
          <div className="space-y-3">
            <Label>Apply To *</Label>
            <RadioGroup value={applyTo} onValueChange={(value: any) => setApplyTo(value)}>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <RadioGroupItem value="New Equipment Only" id="new-only" />
                  <div className="flex-1">
                    <label
                      htmlFor="new-only"
                      className="text-sm font-medium cursor-pointer"
                    >
                      New Equipment Only
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Changes apply only to equipment purchased after the effective
                      date. Existing equipment depreciation continues unchanged.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <RadioGroupItem value="All Active Equipment" id="all-active" />
                  <div className="flex-1">
                    <label
                      htmlFor="all-active"
                      className="text-sm font-medium cursor-pointer"
                    >
                      All Active Equipment
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Existing equipment recalculates remaining depreciation from
                      effective date using new useful life. Sunk depreciation already
                      charged is NOT reversed.
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change *</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as EquipmentUsefulLifeReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {USEFUL_LIFE_REASONS.map((r) => (
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
              placeholder="e.g., 'Field data shows foam guns lasting 30+ months with proper maintenance'"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Approved By */}
          <div className="space-y-2">
            <Label>Approved By (Admin/SA Only)</Label>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <Badge className="bg-orange-600 text-white">{currentUser}</Badge>
              <div className="text-xs text-gray-600 mt-2">
                Only Admin and SA roles can approve equipment parameter changes
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <strong>Important:</strong> This change affects depreciation calculations
              for cost per wash. Historical calculations will continue to use the useful
              life that was active during that period.
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
            className="bg-orange-600 hover:bg-orange-700"
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : "Update Useful Life"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
