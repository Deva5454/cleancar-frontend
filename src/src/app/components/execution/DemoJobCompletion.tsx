/**
 * Demo Job Completion Component
 * Comprehensive post-job report form for washers
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Card, CardContent } from "../ui/card";
import { CheckCircle, Camera, AlertCircle, Upload } from "lucide-react";
import { useDemos, type DemoWash } from "../../contexts/DemoContext";
import { toast } from "sonner";

interface DemoJobCompletionProps {
  demo: DemoWash;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLAN_SERVICES_MAP: Record<string, string[]> = {
  "Basic": [
    "Exterior water wash using microfiber mitt",
    "Removal of loose dirt mud and dust",
    "Wheel surface cleaning",
    "Tyre basic cleaning",
    "Exterior glass cleaning",
    "Microfiber drying"
  ],
  "Premium": [
    "Exterior water wash",
    "Foam shampoo wash",
    "Removal of traffic film and sticky dirt",
    "Wheel cleaning with shampoo",
    "Tyre cleaning and polish",
    "Exterior plastic trim cleaning",
    "Enhanced exterior finish"
  ],
  "Elite": [
    "Exterior water wash",
    "Foam shampoo wash",
    "Wax paint protection coating",
    "Paint gloss enhancement",
    "Water-repellent protection layer",
    "Premium tyre shine",
    "Exterior trim polish"
  ],
  "Elite Plus": [
    "Water wash",
    "Shampoo wash",
    "Wax protection",
    "Full interior cleaning",
    "Tyre polish",
    "Interior polish",
    "Premium finishing"
  ]
};

const STANDARD_PRODUCTS = [
  "Car Shampoo",
  "Wax Polish",
  "Tyre Shine",
  "Glass Cleaner",
  "Interior Cleaner",
  "Microfiber Cloths"
];

export function DemoJobCompletion({ demo, open, onOpenChange }: DemoJobCompletionProps) {
  const { completeDemo } = useDemos();
  
  const [servicesPerformed, setServicesPerformed] = useState<string[]>([]);
  const [servicesSkipped, setServicesSkipped] = useState("");
  const [vehicleConditionBefore, setVehicleConditionBefore] = useState("");
  const [vehicleConditionAfter, setVehicleConditionAfter] = useState("");
  const [productsUsed, setProductsUsed] = useState<string[]>([]);
  const [issuesEncountered, setIssuesEncountered] = useState("");
  const [hasIssues, setHasIssues] = useState(false);
  const [customerPresent, setCustomerPresent] = useState(false);
  const [customerFeedback, setCustomerFeedback] = useState("");
  const [beforePhoto, setBeforePhoto] = useState<string>("");
  const [afterPhoto, setAfterPhoto] = useState<string>("");

  const planServices = PLAN_SERVICES_MAP[demo.planName] || PLAN_SERVICES_MAP["Premium"];

  const toggleService = (service: string) => {
    setServicesPerformed(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const toggleProduct = (product: string) => {
    setProductsUsed(prev =>
      prev.includes(product)
        ? prev.filter(p => p !== product)
        : [...prev, product]
    );
  };

  const handleSubmit = () => {
    // Validation
    if (servicesPerformed.length === 0) {
      toast.error("Please select at least one service performed");
      return;
    }

    if (servicesPerformed.length < planServices.length && !servicesSkipped) {
      toast.error("Please explain why some services were skipped");
      return;
    }

    if (!vehicleConditionBefore || !vehicleConditionAfter) {
      toast.error("Please select vehicle condition before and after");
      return;
    }

    if (vehicleConditionAfter === "Satisfactory" && !issuesEncountered) {
      toast.error("Please explain why the result is only satisfactory");
      return;
    }

    if (productsUsed.length === 0) {
      toast.error("Please select products used");
      return;
    }

    if (!beforePhoto || !afterPhoto) {
      toast.error("Before and After photos are required");
      return;
    }

    if (customerFeedback.length < 15) {
      toast.error("Customer verbal feedback must be at least 15 characters");
      return;
    }

    // Submit completion
    const reportData = {
      servicesPerformed,
      servicesSkipped,
      vehicleConditionBefore,
      vehicleConditionAfter,
      productsUsed,
      issuesEncountered,
      customerPresentDuringWash: customerPresent,
      customerVerbalFeedback: customerFeedback
    };

    completeDemo(demo.id, "Positive - Excellent Service", reportData);
    
    toast.success("Demo Completed Successfully", {
      description: "Job report submitted. TSE will follow up with customer."
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Demo Job - {demo.customerFirstName}</DialogTitle>
          <DialogDescription>
            Fill out the complete job report. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Services Performed */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Label className="text-base font-semibold">Services Performed *</Label>
              <p className="text-sm text-gray-500">
                Check all services that were completed (based on {demo.planName} plan)
              </p>
              <div className="space-y-2">
                {planServices.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={servicesPerformed.includes(service)}
                      onCheckedChange={() => toggleService(service)}
                    />
                    <label
                      htmlFor={service}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {service}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services Skipped */}
          {servicesPerformed.length < planServices.length && (
            <div className="space-y-2">
              <Label htmlFor="servicesSkipped">
                Services Skipped - Reason Required *
              </Label>
              <Textarea
                id="servicesSkipped"
                value={servicesSkipped}
                onChange={(e) => setServicesSkipped(e.target.value)}
                placeholder="Explain why certain services were not completed..."
                rows={2}
              />
            </div>
          )}

          {/* Vehicle Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Vehicle Condition Before Wash *</Label>
              <Select value={vehicleConditionBefore} onValueChange={setVehicleConditionBefore}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clean">Clean</SelectItem>
                  <SelectItem value="Moderate Dust">Moderate Dust</SelectItem>
                  <SelectItem value="Heavy Dirt">Heavy Dirt</SelectItem>
                  <SelectItem value="Bird Dropping">Bird Dropping</SelectItem>
                  <SelectItem value="Tree Sap">Tree Sap</SelectItem>
                  <SelectItem value="Multiple Issues">Multiple Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Condition After Wash *</Label>
              <Select value={vehicleConditionAfter} onValueChange={setVehicleConditionAfter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Used */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Label className="text-base font-semibold">Products Used *</Label>
              <p className="text-sm text-gray-500">
                Select all products used during this job
              </p>
              <div className="grid grid-cols-2 gap-2">
                {STANDARD_PRODUCTS.map((product) => (
                  <div key={product} className="flex items-center space-x-2">
                    <Checkbox
                      id={product}
                      checked={productsUsed.includes(product)}
                      onCheckedChange={() => toggleProduct(product)}
                    />
                    <label
                      htmlFor={product}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {product}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Issues Encountered */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasIssues"
                checked={hasIssues}
                onCheckedChange={(checked) => setHasIssues(checked as boolean)}
              />
              <label
                htmlFor="hasIssues"
                className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Issues Encountered During Job
              </label>
            </div>
            
            {hasIssues && (
              <div className="space-y-2">
                <Label htmlFor="issuesEncountered">Describe the Issues</Label>
                <Textarea
                  id="issuesEncountered"
                  value={issuesEncountered}
                  onChange={(e) => setIssuesEncountered(e.target.value)}
                  placeholder="e.g., Deep scratch on left door - customer was informed and acknowledged"
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Before Photo *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {beforePhoto ? (
                  <div>
                    <img src={beforePhoto} alt="Before" className="w-full h-32 object-cover rounded mb-2" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBeforePhoto("")}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBeforePhoto("https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=300&fit=crop")}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>After Photo *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {afterPhoto ? (
                  <div>
                    <img src={afterPhoto} alt="After" className="w-full h-32 object-cover rounded mb-2" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAfterPhoto("")}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAfterPhoto("https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&h=300&fit=crop")}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Present */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="customerPresent"
                checked={customerPresent}
                onCheckedChange={(checked) => setCustomerPresent(checked as boolean)}
              />
              <label
                htmlFor="customerPresent"
                className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Customer Present During Wash
              </label>
            </div>
            
            {!customerPresent && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Customer not present - delivery confirmation not available
                </p>
              </div>
            )}
          </div>

          {/* Customer Verbal Feedback */}
          <div className="space-y-2">
            <Label htmlFor="customerFeedback">
              Customer Verbal Feedback * (minimum 15 characters)
            </Label>
            <Textarea
              id="customerFeedback"
              value={customerFeedback}
              onChange={(e) => setCustomerFeedback(e.target.value)}
              placeholder="What did the customer say during or after the demo? e.g., 'Very impressed with the shine. Interested in Elite plan.'"
              rows={3}
            />
            <p className="text-xs text-gray-500">
              {customerFeedback.length}/15 characters minimum
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            Submit Report & Complete Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
