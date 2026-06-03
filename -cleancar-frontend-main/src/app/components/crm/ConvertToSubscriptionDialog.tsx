// Convert Lead to Subscription Dialog
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { CheckCircle } from "lucide-react";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import type { VehicleCategory, PlanType } from "../../data/subscriptionPlans";

interface ConvertToSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadData?: {
    id: string;
    name: string;
    phone: string;
    carType?: string;
  };
  onConvert: (data: {
    vehicleCategory: VehicleCategory;
    planType: PlanType;
    price: number;
    startDate: string;
  }) => void;
}

export function ConvertToSubscriptionDialog({
  open,
  onOpenChange,
  leadData,
  onConvert,
}: ConvertToSubscriptionDialogProps) {
  const { vehicleCategories, planTypes, getPlanPrice, getPlanDeliverables } = usePlanDefinitions();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCategory | "">("");
  const [selectedPlan, setSelectedPlan] = useState<PlanType | "">("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const currentPrice =
    selectedVehicle && selectedPlan ? getPlanPrice(selectedVehicle, selectedPlan) : "NA";
  const planDetails = selectedPlan ? getPlanDeliverables(selectedPlan) : null;

  const handleConvert = () => {
    if (selectedVehicle && selectedPlan && currentPrice !== "NA") {
      onConvert({
        vehicleCategory: selectedVehicle,
        planType: selectedPlan,
        price: currentPrice as number,
        startDate,
      });
      // Reset form
      setSelectedVehicle("");
      setSelectedPlan("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead to Subscription</DialogTitle>
          <DialogDescription>
            Create a subscription plan for {leadData?.name}. Select vehicle category and plan type to
            see pricing and deliverables.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Customer Name</p>
              <p className="font-medium">{leadData?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{leadData?.phone}</p>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleCategory">Vehicle Category *</Label>
              <Select
                value={selectedVehicle}
                onValueChange={(value) => setSelectedVehicle(value as VehicleCategory)}
              >
                <SelectTrigger id="vehicleCategory">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planType">Plan Type *</Label>
              <Select
                value={selectedPlan}
                onValueChange={(value) => setSelectedPlan(value as PlanType)}
                disabled={!selectedVehicle}
              >
                <SelectTrigger id="planType">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {planTypes.map((plan) => {
                    const price = selectedVehicle ? getPlanPrice(selectedVehicle, plan) : "NA";
                    return (
                      <SelectItem key={plan} value={plan} disabled={price === "NA"}>
                        {plan} {price !== "NA" && `- ₹${price}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Subscription Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Pricing Display */}
          {currentPrice !== "NA" && (
            <div className="p-6 bg-green-50 border-2 border-green-300 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-green-700 font-medium">Selected Plan Pricing</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    ₹{currentPrice}/month
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {selectedVehicle} • {selectedPlan}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              {/* Plan Deliverables */}
              {planDetails && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="font-semibold text-green-900 mb-2">{planDetails.planName}</p>
                  <p className="text-sm text-green-700 mb-3">{planDetails.tagline}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs font-medium text-green-800 mb-2">✓ Included</p>
                      <ul className="space-y-1">
                        {planDetails.included.slice(0, 4).map((item, i) => (
                          <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                            <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {planDetails.notIncluded && planDetails.notIncluded.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-green-800 mb-2">✗ Not Included</p>
                        <ul className="space-y-1">
                          {planDetails.notIncluded.slice(0, 3).map((item, i) => (
                            <li key={i} className="text-xs text-green-600">
                              <span className="text-red-500">✗</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 p-2 bg-white rounded border border-green-200">
                    <p className="text-xs text-green-800">
                      <strong>Best For:</strong> {planDetails.bestFor}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={!selectedVehicle || !selectedPlan || currentPrice === "NA"}
          >
            Convert to Subscription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
