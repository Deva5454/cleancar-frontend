// Job Report Tab - Final submission form
import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
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
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  FileText,
  Camera,
  Mic,
  Star,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface WasherJobReportProps {
  job: any;
  onComplete: () => void;
}

export function WasherJobReport({ job, onComplete }: WasherJobReportProps) {
  const [vehicleConditionBefore, setVehicleConditionBefore] = useState("");
  const [vehicleConditionAfter, setVehicleConditionAfter] = useState("");
  const [afterConditionReason, setAfterConditionReason] = useState("");
  
  const [productsUsed, setProductsUsed] = useState<Record<string, boolean>>({
    "shampoo": true,
    "wax": true,
    "interior-cleaner": true,
    "tire-polish": true,
  });
  const [productSkipReasons, setProductSkipReasons] = useState<Record<string, string>>({});

  const [issuesEncountered, setIssuesEncountered] = useState(false);
  const [issueNotes, setIssueNotes] = useState("");
  const [issuePhoto, setIssuePhoto] = useState<string | null>(null);

  const [customerPresent, setCustomerPresent] = useState(false);
  const [customerFeedback, setCustomerFeedback] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const [selfRating, setSelfRating] = useState(0);

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [startTime] = useState(new Date(Date.now() - 45 * 60 * 1000)); // 45 mins ago

  const products = [
    { id: "shampoo", name: "Car Wash Shampoo" },
    { id: "wax", name: "Wax Coating" },
    { id: "interior-cleaner", name: "Interior Cleaner" },
    { id: "tire-polish", name: "Tire Polish" },
  ];

  const handleProductToggle = (productId: string, used: boolean) => {
    setProductsUsed(prev => ({ ...prev, [productId]: used }));
    if (used) {
      setProductSkipReasons(prev => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
    }
  };

  const handleVoiceRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      toast.success("Recording started");
      
      // Simulate recording and transcription
      setTimeout(() => {
        setIsRecording(false);
        setCustomerFeedback("Customer was very happy with the service. Said the car looks brand new.");
        toast.success("Voice note transcribed");
      }, 3000);
    }
  };

  const handleIssuePhotoCapture = () => {
    const simulatedPhoto = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="%23f0f0f0" width="200" height="150"/><text x="50%" y="50%" text-anchor="middle" fill="%23666" font-size="14">ISSUE PHOTO</text></svg>`;
    setIssuePhoto(simulatedPhoto);
    toast.success("Issue photo captured");
  };

  const validateForm = () => {
    if (!vehicleConditionBefore) {
      toast.error("Please select vehicle condition before");
      return false;
    }
    if (!vehicleConditionAfter) {
      toast.error("Please select vehicle condition after");
      return false;
    }
    if (vehicleConditionAfter === "satisfactory" && !afterConditionReason) {
      toast.error("Please provide a reason for satisfactory condition");
      return false;
    }

    // Check for products not used without reason
    const unusedProducts = Object.entries(productsUsed)
      .filter(([_, used]) => !used)
      .map(([id]) => id);
    
    for (const productId of unusedProducts) {
      if (!productSkipReasons[productId]) {
        toast.error("Please provide reason for unused products");
        return false;
      }
    }

    if (customerPresent && customerFeedback.length < 15) {
      toast.error("Please provide customer feedback (minimum 15 characters)");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setSubmitDialogOpen(true);
  };

  const confirmSubmit = () => {
    const endTime = new Date();
    const timeTaken = Math.floor((endTime.getTime() - startTime.getTime()) / 60000); // minutes
    
    toast.success("Job completed successfully!");
    setSubmitDialogOpen(false);
    
    // Show success screen
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <div className="space-y-4 p-4 pb-32">
      {/* Vehicle Condition */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-gray-900">Vehicle Condition</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base">Condition Before Service</Label>
              <Select value={vehicleConditionBefore} onValueChange={setVehicleConditionBefore}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="moderate">Moderate Dust</SelectItem>
                  <SelectItem value="heavy">Heavy Dirt</SelectItem>
                  <SelectItem value="bird-dropping">Bird Dropping</SelectItem>
                  <SelectItem value="tree-sap">Tree Sap</SelectItem>
                  <SelectItem value="multiple">Multiple Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base">Condition After Service</Label>
              <Select value={vehicleConditionAfter} onValueChange={setVehicleConditionAfter}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="satisfactory">Satisfactory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {vehicleConditionAfter === "satisfactory" && (
              <div className="space-y-2">
                <Label className="text-base text-amber-700">Reason for Satisfactory Rating</Label>
                <Textarea
                  value={afterConditionReason}
                  onChange={(e) => setAfterConditionReason(e.target.value)}
                  placeholder="Explain why the result was only satisfactory"
                  className="min-h-20 text-base"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Used */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Products Used</h3>
          <p className="text-sm text-gray-600">Review and confirm products used for this service</p>

          {products.map((product) => (
            <div key={product.id} className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label htmlFor={`product-${product.id}`} className="text-base flex-1">
                  {product.name}
                </Label>
                <Checkbox
                  id={`product-${product.id}`}
                  checked={productsUsed[product.id]}
                  onCheckedChange={(checked) => handleProductToggle(product.id, !!checked)}
                  className="h-6 w-6"
                />
              </div>

              {!productsUsed[product.id] && (
                <div className="ml-4 space-y-2">
                  <Label className="text-sm">Reason for not using</Label>
                  <Select
                    value={productSkipReasons[product.id] || ""}
                    onValueChange={(value) => 
                      setProductSkipReasons(prev => ({ ...prev, [product.id]: value }))
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ran-out">Ran Out</SelectItem>
                      <SelectItem value="not-needed">Product Not Needed for This Vehicle</SelectItem>
                      <SelectItem value="damaged">Product Damaged</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Issues Encountered */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Issues Encountered</h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="issues-toggle" className="text-base">Any issues?</Label>
              <Switch
                id="issues-toggle"
                checked={issuesEncountered}
                onCheckedChange={setIssuesEncountered}
              />
            </div>
          </div>

          {issuesEncountered && (
            <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="space-y-2">
                <Label className="text-base">Describe the issue</Label>
                <Textarea
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="What issue did you encounter? (optional)"
                  className="min-h-24 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base">Photo of Issue (Optional)</Label>
                {!issuePhoto ? (
                  <Button
                    onClick={handleIssuePhotoCapture}
                    variant="outline"
                    className="w-full h-20"
                  >
                    <div className="text-center">
                      <Camera className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-sm">Take Photo</p>
                    </div>
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <img src={issuePhoto} alt="Issue" className="w-full h-32 object-cover rounded" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleIssuePhotoCapture}
                    >
                      Retake
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Feedback */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Customer Presence</h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="customer-present" className="text-base">Customer was present?</Label>
              <Switch
                id="customer-present"
                checked={customerPresent}
                onCheckedChange={setCustomerPresent}
              />
            </div>
          </div>

          {customerPresent && (
            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="space-y-2">
                <Label className="text-base">Customer Verbal Feedback</Label>
                <Textarea
                  value={customerFeedback}
                  onChange={(e) => setCustomerFeedback(e.target.value)}
                  placeholder="What did the customer say about the service? (minimum 15 characters)"
                  className="min-h-24 text-base"
                />
                <p className="text-xs text-gray-600">
                  {customerFeedback.length} / 15 characters minimum
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleVoiceRecord}
                  variant={isRecording ? "default" : "outline"}
                  className={isRecording ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  <Mic className={`w-4 h-4 mr-2 ${isRecording ? "animate-pulse" : ""}`} />
                  {isRecording ? "Recording..." : "Record Voice Note"}
                </Button>
                {isRecording && (
                  <span className="text-sm text-red-600 font-medium">Transcribing...</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Self Assessment */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Self-Assessment</h3>
          <p className="text-sm text-gray-600">How would you rate your own work today? (Optional)</p>
          
          <div className="flex items-center justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setSelfRating(rating)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    rating <= selfRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-center text-gray-500">
            This is for internal use and visible only to your Supervisor
          </p>
        </CardContent>
      </Card>

      {/* Submit Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button
          onClick={handleSubmit}
          className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Submit Job Report
        </Button>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Job Complete!
            </DialogTitle>
            <DialogDescription className="text-base">
              Great work! Here's a summary of your service:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {job.customerFirstName}
              </h3>
              <p className="text-gray-600">{job.packageName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Services Delivered</p>
                <p className="text-2xl font-bold text-teal-600">24</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Time Taken</p>
                <p className="text-2xl font-bold text-teal-600">45 min</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Quality Check completed
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={confirmSubmit}
            className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
