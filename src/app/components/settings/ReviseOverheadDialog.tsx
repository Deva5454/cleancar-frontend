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
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Save,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { type OverheadRevisionReason } from "../../data/costData";
import {
  OVERHEAD_ITEMS_DYNAMIC,
  getCurrentOverheadAmount,
} from "../../data/overheadDynamicData";

interface ReviseOverheadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overheadId: string;
  onSave: (revision: {
    effectiveDate: Date;
    newAmount: number;
    reason: OverheadRevisionReason;
    notes?: string;
  }) => void;
}

const REVISION_REASONS: OverheadRevisionReason[] = [
  "Price Increase from Vendor",
  "Price Decrease from Vendor",
  "Usage Pattern Change",
  "New Service Provider",
  "Regulatory Change",
  "Business Decision",
  "Other",
];

export function ReviseOverheadDialog({
  open,
  onOpenChange,
  overheadId,
  onSave,
}: ReviseOverheadDialogProps) {
  const overhead = OVERHEAD_ITEMS_DYNAMIC.find((oh) => oh.id === overheadId);
  const currentAmount = getCurrentOverheadAmount(overheadId);

  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date());
  const [newAmount, setNewAmount] = useState("");
  const [reason, setReason] = useState<OverheadRevisionReason>(
    "Price Increase from Vendor"
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!overhead) {
    return null;
  }

  const handleSave = () => {
    // Validation
    if (!newAmount || parseFloat(newAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(newAmount) === currentAmount) {
      toast.error("New amount must be different from current amount");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      onSave({
        effectiveDate,
        newAmount: parseFloat(newAmount),
        reason,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setEffectiveDate(new Date());
      setNewAmount("");
      setReason("Price Increase from Vendor");
      setNotes("");
      setIsSubmitting(false);
      onOpenChange(false);
    }, 800);
  };

  const amountChange = newAmount ? parseFloat(newAmount) - currentAmount : 0;
  const amountChangePercent =
    currentAmount > 0 ? (amountChange / currentAmount) * 100 : 0;

  // Get amount label based on cost type
  const getAmountLabel = () => {
    if (overhead.costType === "Fixed Monthly Amount") return "Monthly Amount (₹)";
    if (overhead.costType === "Per Washer Per Month")
      return "Per Washer Amount (₹/month)";
    if (overhead.costType === "Per Zone Per Month") return "Per Zone Amount (₹/month)";
    if (overhead.costType === "Per Wash Direct") return "Per Wash Amount (₹)";
    return "Amount (₹)";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Revise Overhead Amount
          </DialogTitle>
          <DialogDescription>
            Update the cost amount for <strong>{overhead.itemName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Amount Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">Current Amount</div>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{currentAmount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {overhead.costType}
                </div>
              </div>
              {newAmount && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Change</div>
                  <div
                    className={`text-xl font-bold flex items-center gap-1 justify-end ${
                      amountChange > 0
                        ? "text-red-600"
                        : amountChange < 0
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {amountChange > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : amountChange < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : null}
                    {amountChange > 0 ? "+" : ""}
                    {amountChangePercent.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {amountChange > 0 ? "+" : ""}₹{amountChange.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            {amountChange !== 0 && newAmount && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="text-xs text-gray-600">
                  {amountChange > 0 ? (
                    <span className="text-red-700">
                      ⚠️ <strong>Cost increase</strong> — Will raise per-wash
                      overhead allocation
                    </span>
                  ) : (
                    <span className="text-green-700">
                      ✓ <strong>Cost reduction</strong> — Will lower per-wash
                      overhead allocation
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

          {/* New Amount */}
          <div className="space-y-2">
            <Label htmlFor="newAmount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              {getAmountLabel()} *
            </Label>
            <Input
              id="newAmount"
              type="number"
              step={overhead.costType === "Per Wash Direct" ? "0.01" : "1"}
              min="0"
              placeholder={currentAmount.toString()}
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change *</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as OverheadRevisionReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {REVISION_REASONS.map((r) => (
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
                Explain the reason for this revision
              </span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Impact Preview */}
          {newAmount && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">
                Updated Per-Wash Allocation (Example)
              </div>
              <div className="text-xs text-blue-700">
                {overhead.costType === "Fixed Monthly Amount" && (
                  <>
                    ₹{parseFloat(newAmount).toLocaleString()} ÷ 520 avg washes/month
                    ={" "}
                    <strong>
                      ₹{(parseFloat(newAmount) / 520).toFixed(2)}/wash
                    </strong>{" "}
                    (was ₹{(currentAmount / 520).toFixed(2)})
                  </>
                )}
                {overhead.costType === "Per Washer Per Month" && (
                  <>
                    ₹{parseFloat(newAmount).toLocaleString()} ÷ 546 washes/month ={" "}
                    <strong>
                      ₹{(parseFloat(newAmount) / 546).toFixed(2)}/wash
                    </strong>{" "}
                    (was ₹{(currentAmount / 546).toFixed(2)})
                  </>
                )}
                {overhead.costType === "Per Wash Direct" && (
                  <>
                    <strong>₹{parseFloat(newAmount).toFixed(2)}/wash</strong> (was
                    ₹{currentAmount.toFixed(2)})
                  </>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <strong>Important:</strong> This revision will be tracked in the
              overhead history. Cost per wash calculations will automatically use
              the historically correct amount for each time period.
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
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : "Revise Amount"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
