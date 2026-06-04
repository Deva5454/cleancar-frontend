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
  Droplet,
  AlertCircle,
  User,
} from "lucide-react";
import { type ConsumableConsumptionReason } from "../../data/costData";
import { MATERIALS } from "../../data/costData";

interface AddConsumableInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    washerId: string;
    date: Date;
    materialId: string;
    quantityConsumed: number;
    reason: ConsumableConsumptionReason;
    jobReference?: string;
  }) => void;
}

const WASHERS = [
  { id: "washer-001", name: "Suresh Kumar", city: "Mumbai" },
  { id: "washer-002", name: "Ramesh Patel", city: "Mumbai" },
  { id: "washer-003", name: "Dinesh Sharma", city: "Mumbai" },
  { id: "washer-004", name: "Vijay Singh", city: "Ahmedabad" },
];

const CONSUMPTION_REASONS: ConsumableConsumptionReason[] = [
  "Standard Usage",
  "Additional Usage — Heavily Soiled Vehicle",
  "Product Applied Incorrectly — Wastage",
  "Training Demonstration",
  "Equipment Cleaning",
  "Other",
];

export function AddConsumableInputDialog({
  open,
  onOpenChange,
  onSave,
}: AddConsumableInputDialogProps) {
  const [washerId, setWasherId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [materialId, setMaterialId] = useState("");
  const [quantityConsumed, setQuantityConsumed] = useState("");
  const [reason, setReason] = useState<ConsumableConsumptionReason>(
    "Additional Usage — Heavily Soiled Vehicle"
  );
  const [jobReference, setJobReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMaterial = MATERIALS.find((m) => m.id === materialId);
  const currentUser = "Operations Manager";

  const handleSave = () => {
    // Validation
    if (!washerId) {
      toast.error("Please select a washer");
      return;
    }

    if (!materialId) {
      toast.error("Please select a material");
      return;
    }

    if (!quantityConsumed || parseFloat(quantityConsumed) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      onSave({
        washerId,
        date,
        materialId,
        quantityConsumed: parseFloat(quantityConsumed),
        reason,
        jobReference: jobReference.trim() || undefined,
      });

      // Reset form
      setWasherId("");
      setDate(new Date());
      setMaterialId("");
      setQuantityConsumed("");
      setReason("Additional Usage — Heavily Soiled Vehicle");
      setJobReference("");
      setIsSubmitting(false);
      onOpenChange(false);
    }, 800);
  };

  // Calculate estimated cost based on current price
  const estimatedCost =
    selectedMaterial && quantityConsumed
      ? parseFloat(quantityConsumed) * selectedMaterial.costPerUnit
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-600" />
            Add Consumable Actual Input
          </DialogTitle>
          <DialogDescription>
            Record actual material consumption that differs from standard issuance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Washer Selection */}
          <div className="space-y-2">
            <Label htmlFor="washer" className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              Washer *
            </Label>
            <Select value={washerId} onValueChange={setWasherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select washer" />
              </SelectTrigger>
              <SelectContent>
                {WASHERS.map((washer) => (
                  <SelectItem key={washer.id} value={washer.id}>
                    {washer.name} ({washer.city})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Material */}
            <div className="space-y-2">
              <Label htmlFor="material">Material *</Label>
              <Select value={materialId} onValueChange={setMaterialId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIALS.filter((m) => m.status === "Active").map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.unitOfMeasure})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity Consumed */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity Consumed *
              {selectedMaterial && (
                <span className="text-xs text-gray-500 ml-2">
                  in {selectedMaterial.unitOfMeasure}
                </span>
              )}
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0"
              placeholder="100"
              value={quantityConsumed}
              onChange={(e) => setQuantityConsumed(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as ConsumableConsumptionReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {CONSUMPTION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Reference */}
          <div className="space-y-2">
            <Label htmlFor="jobReference">
              Job Reference (Optional)
              <span className="text-xs text-gray-500 ml-2">
                Link to specific job if applicable
              </span>
            </Label>
            <Input
              id="jobReference"
              placeholder="e.g., JOB-2026-03-15-142"
              value={jobReference}
              onChange={(e) => setJobReference(e.target.value)}
            />
          </div>

          {/* Estimated Cost Preview */}
          {selectedMaterial && quantityConsumed && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">
                Estimated Cost (at current price)
              </div>
              <div className="text-xs text-blue-700 mb-3">
                {quantityConsumed} {selectedMaterial.unitOfMeasure} × ₹
                {(selectedMaterial?.costPerUnit ?? 0).toFixed(2)}/
                {selectedMaterial.unitOfMeasure} ={" "}
                <strong className="text-lg">₹{estimatedCost.toFixed(2)}</strong>
              </div>
              <div className="text-xs text-blue-600 bg-white rounded p-2">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Actual cost will be calculated using FIFO batch cost at time of
                consumption
              </div>
            </div>
          )}

          {/* Recorded By */}
          <div className="space-y-2">
            <Label>Recorded By</Label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="font-medium text-gray-900">{currentUser}</div>
              <div className="text-xs text-gray-600 mt-1">
                Auto-filled from logged-in user
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <strong>Note:</strong> This consumption entry will be added to the
              washer's stock ledger as "Actual Input — Manual" and included in the
              actual consumable cost calculation. It supplements (does not replace)
              the automated issuance-based tracking.
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
            {isSubmitting ? "Saving..." : "Record Consumption"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
