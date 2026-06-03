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
  DollarSign,
  Calendar as CalendarIcon,
  AlertCircle,
  Save,
  Clock,
  User,
} from "lucide-react";
import { type PriceChangeReason } from "../../data/costData";

interface ManualPriceEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string;
  materialName: string;
  currentPrice: number;
  unitOfMeasure: string;
  onSave: (entry: {
    effectiveDate: Date;
    newCostPerUnit: number;
    reason: PriceChangeReason;
    reference?: string;
    notes?: string;
  }) => void;
}

const PRICE_CHANGE_REASONS: PriceChangeReason[] = [
  "Supplier Price Revision",
  "Market Rate Change",
  "New Supplier",
  "Bulk Discount Negotiated",
  "Other",
];

export function ManualPriceEntryDialog({
  open,
  onOpenChange,
  materialId,
  materialName,
  currentPrice,
  unitOfMeasure,
  onSave,
}: ManualPriceEntryDialogProps) {
  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date());
  const [newCostPerUnit, setNewCostPerUnit] = useState<string>("");
  const [reason, setReason] = useState<PriceChangeReason>("Supplier Price Revision");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock user - in production this would come from auth context
  const currentUser = "Rajesh Kumar (SA)";

  const handleSave = () => {
    // Validation
    if (!newCostPerUnit || parseFloat(newCostPerUnit) <= 0) {
      toast.error("Please enter a valid cost per unit");
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
        effectiveDate,
        newCostPerUnit: parseFloat(newCostPerUnit),
        reason,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      const isFuture = effectiveDate > new Date();
      
      toast.success(
        isFuture
          ? "Scheduled price change created successfully"
          : "Manual price entry added successfully",
        {
          description: isFuture
            ? `Will be activated on ${format(effectiveDate, "dd MMM yyyy")}`
            : "Price is now active in the system",
        }
      );

      // Reset form
      setEffectiveDate(new Date());
      setNewCostPerUnit("");
      setReason("Supplier Price Revision");
      setReference("");
      setNotes("");
      setIsSubmitting(false);
      onOpenChange(false);
    }, 800);
  };

  const priceChange = newCostPerUnit
    ? parseFloat(newCostPerUnit) - currentPrice
    : 0;
  const priceChangePercent = currentPrice > 0 
    ? (priceChange / currentPrice) * 100 
    : 0;
  const isFutureDate = effectiveDate > new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Manual Price Entry
          </DialogTitle>
          <DialogDescription>
            Record a price change for <strong>{materialName}</strong> without a GRN
            batch receipt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Price Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">Current Active Price</div>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{currentPrice.toFixed(2)}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    / {unitOfMeasure}
                  </span>
                </div>
              </div>
              {newCostPerUnit && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Price Impact</div>
                  <div
                    className={`text-xl font-bold ${
                      priceChange > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {priceChange > 0 ? "+" : ""}
                    {priceChangePercent.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {priceChange > 0 ? "+" : ""}₹{priceChange.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
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
            {isFutureDate && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <strong>Scheduled Price Change:</strong> This will be automatically
                  activated on {format(effectiveDate, "dd MMM yyyy")}. The current
                  price will remain active until then.
                </div>
              </div>
            )}
          </div>

          {/* New Cost Per Unit */}
          <div className="space-y-2">
            <Label htmlFor="newCostPerUnit" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              New Cost per Unit (₹) *
            </Label>
            <div className="relative">
              <Input
                id="newCostPerUnit"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newCostPerUnit}
                onChange={(e) => setNewCostPerUnit(e.target.value)}
                className="text-lg font-semibold"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                / {unitOfMeasure}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Price Change *</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as PriceChangeReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_CHANGE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">
              Reference (Optional)
              <span className="text-xs text-gray-500 ml-2">
                Supplier communication, contract number, etc.
              </span>
            </Label>
            <Input
              id="reference"
              placeholder="e.g., Email dated 2026-03-15, Contract CNT-2026-04"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes (Optional)
              <span className="text-xs text-gray-500 ml-2">
                Additional context or explanation
              </span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant notes or context for this price change..."
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Badge className="bg-blue-600 text-white">{currentUser}</Badge>
              <div className="text-xs text-gray-600 mt-2">
                Your name will be automatically recorded as the approver
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-orange-800">
              <strong>Important:</strong> This price change will be used by the cost
              calculation engine for all transactions from the effective date onwards.
              Historical calculations will continue to use the price that was active on
              their transaction date.
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
            {isSubmitting ? "Saving..." : "Save Price Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
