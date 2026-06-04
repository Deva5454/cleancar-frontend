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
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Save,
  Building,
  DollarSign,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  type OverheadCostType,
  type OverheadAllocationMethod,
  type OverheadApplicability,
} from "../../data/costData";

interface AddOverheadItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (overhead: {
    itemName: string;
    description: string;
    costType: OverheadCostType;
    amount: number;
    allocationMethod: OverheadAllocationMethod;
    effectiveDate: Date;
    applicability: OverheadApplicability;
    specificZone?: string;
    specificWashers?: string[];
  }) => void;
}

const COST_TYPES: OverheadCostType[] = [
  "Fixed Monthly Amount",
  "Per Washer Per Month",
  "Per Zone Per Month",
  "Per Wash Direct",
];

const ZONES = ["Surat", "Mumbai", "Ahmedabad"];

export function AddOverheadItemDialog({
  open,
  onOpenChange,
  onSave,
}: AddOverheadItemDialogProps) {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [costType, setCostType] = useState<OverheadCostType>("Fixed Monthly Amount");
  const [amount, setAmount] = useState("");
  const [allocationMethod, setAllocationMethod] =
    useState<OverheadAllocationMethod>("Divide by Total Company Washes");
  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date());
  const [applicability, setApplicability] = useState<OverheadApplicability>("All Washers");
  const [specificZone, setSpecificZone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update allocation method when cost type changes
  const handleCostTypeChange = (newCostType: OverheadCostType) => {
    setCostType(newCostType);
    
    // Auto-set appropriate allocation method
    if (newCostType === "Fixed Monthly Amount") {
      setAllocationMethod("Divide by Total Company Washes");
    } else if (newCostType === "Per Washer Per Month") {
      setAllocationMethod("Divide by Washer Washes");
    } else if (newCostType === "Per Zone Per Month") {
      setAllocationMethod("Divide by Zone Washes");
    } else if (newCostType === "Per Wash Direct") {
      setAllocationMethod("Direct per Wash");
    }
  };

  const handleSave = () => {
    // Validation
    if (!itemName.trim()) {
      toast.error("Please enter item name");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter description");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (applicability === "Specific Zone" && !specificZone) {
      toast.error("Please select a zone");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      onSave({
        itemName: itemName.trim(),
        description: description.trim(),
        costType,
        amount: parseFloat(amount),
        allocationMethod,
        effectiveDate,
        applicability,
        specificZone: applicability === "Specific Zone" ? specificZone : undefined,
      });

      // Reset form
      setItemName("");
      setDescription("");
      setCostType("Fixed Monthly Amount");
      setAmount("");
      setAllocationMethod("Divide by Total Company Washes");
      setEffectiveDate(new Date());
      setApplicability("All Washers");
      setSpecificZone("");
      setIsSubmitting(false);
      onOpenChange(false);
    }, 800);
  };

  // Get allocation method options based on cost type
  const getAllocationMethodOptions = (): OverheadAllocationMethod[] => {
    if (costType === "Fixed Monthly Amount") {
      return ["Divide by Total Company Washes", "Divide by Zone Washes"];
    } else if (costType === "Per Washer Per Month") {
      return ["Divide by Washer Washes"];
    } else if (costType === "Per Zone Per Month") {
      return ["Divide by Zone Washes"];
    } else if (costType === "Per Wash Direct") {
      return ["Direct per Wash"];
    }
    return [];
  };

  const allocationOptions = getAllocationMethodOptions();

  // Get amount label based on cost type
  const getAmountLabel = () => {
    if (costType === "Fixed Monthly Amount") return "Monthly Amount (₹)";
    if (costType === "Per Washer Per Month") return "Per Washer Amount (₹/month)";
    if (costType === "Per Zone Per Month") return "Per Zone Amount (₹/month)";
    if (costType === "Per Wash Direct") return "Per Wash Amount (₹)";
    return "Amount (₹)";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-green-600" />
            Add Overhead Item
          </DialogTitle>
          <DialogDescription>
            Create a new overhead cost item with allocation settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="itemName" className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              Item Name *
            </Label>
            <Input
              id="itemName"
              placeholder="e.g., Safety Equipment, Training Programs, etc."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description *
              <span className="text-xs text-gray-500 ml-2">
                What this cost covers
              </span>
            </Label>
            <Textarea
              id="description"
              placeholder="Explain what this overhead item covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Cost Type */}
            <div className="space-y-2">
              <Label htmlFor="costType">Cost Type *</Label>
              <Select
                value={costType}
                onValueChange={(value: OverheadCostType) =>
                  handleCostTypeChange(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cost type" />
                </SelectTrigger>
                <SelectContent>
                  {COST_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                {getAmountLabel()} *
              </Label>
              <Input
                id="amount"
                type="number"
                step={costType === "Per Wash Direct" ? "0.01" : "1"}
                min="0"
                placeholder={costType === "Per Wash Direct" ? "1.20" : "3200"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
          </div>

          {/* Allocation Method */}
          <div className="space-y-2">
            <Label htmlFor="allocationMethod">Allocation Method *</Label>
            <Select
              value={allocationMethod}
              onValueChange={(value: OverheadAllocationMethod) =>
                setAllocationMethod(value)
              }
              disabled={allocationOptions.length === 1}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select allocation method" />
              </SelectTrigger>
              <SelectContent>
                {allocationOptions.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500 mt-1">
              {costType === "Fixed Monthly Amount" &&
                "Company-wide costs divided by total or zone washes"}
              {costType === "Per Washer Per Month" &&
                "Per-washer costs divided by that washer's monthly washes"}
              {costType === "Per Zone Per Month" &&
                "Zone-level costs divided by zone washes"}
              {costType === "Per Wash Direct" &&
                "Direct usage-based charge per wash (no allocation)"}
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
          </div>

          {/* Applicability */}
          <div className="space-y-3">
            <Label>Applicable To *</Label>
            <RadioGroup
              value={applicability}
              onValueChange={(value: OverheadApplicability) =>
                setApplicability(value)
              }
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <RadioGroupItem value="All Washers" id="all-washers" />
                  <div className="flex-1">
                    <label
                      htmlFor="all-washers"
                      className="text-sm font-medium cursor-pointer"
                    >
                      All Washers
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      This overhead applies to all washers across the company
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <RadioGroupItem value="Specific Zone" id="specific-zone" />
                  <div className="flex-1">
                    <label
                      htmlFor="specific-zone"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Specific Zone
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Zone-specific overhead (e.g., zone marketing, local taxes)
                    </p>
                    {applicability === "Specific Zone" && (
                      <div className="mt-2">
                        <Select value={specificZone} onValueChange={setSpecificZone}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {ZONES.map((zone) => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <RadioGroupItem value="Specific Washers" id="specific-washers" />
                  <div className="flex-1">
                    <label
                      htmlFor="specific-washers"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Specific Washers
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Overhead for selected individual washers
                    </p>
                    {applicability === "Specific Washers" && (
                      <div className="mt-2 text-xs text-gray-500 italic">
                        Washer selection will be available after saving
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Preview Calculation */}
          {amount && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">
                Example Per-Wash Allocation
              </div>
              <div className="text-xs text-blue-700">
                {costType === "Fixed Monthly Amount" && (
                  <>
                    ₹{parseFloat(amount).toLocaleString()} ÷ 520 avg washes/month ={" "}
                    <strong>₹{(parseFloat(amount) / 520).toFixed(2)}/wash</strong>
                  </>
                )}
                {costType === "Per Washer Per Month" && (
                  <>
                    ₹{parseFloat(amount).toLocaleString()} ÷ 21 washes/day × 26 days ={" "}
                    <strong>₹{(parseFloat(amount) / 546).toFixed(2)}/wash</strong> (per
                    washer)
                  </>
                )}
                {costType === "Per Zone Per Month" && (
                  <>
                    ₹{parseFloat(amount).toLocaleString()} ÷ zone washes ={" "}
                    <strong>varies by zone</strong>
                  </>
                )}
                {costType === "Per Wash Direct" && (
                  <>
                    <strong>₹{parseFloat(amount).toFixed(2)}/wash</strong> (direct
                    charge, no allocation)
                  </>
                )}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600">
              <strong>Note:</strong> This overhead item will appear in the Cost Per
              Wash breakdown as "Overhead Allocation" with individual line items. The
              amount can be revised later with full revision history tracking.
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
            className="bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : "Add Overhead Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
