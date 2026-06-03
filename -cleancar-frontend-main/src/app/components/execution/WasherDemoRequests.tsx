/**
 * Washer Demo Requests - Part 3
 * Demo request cards with Accept/Decline workflow and limited customer data visibility
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  MapPin,
  Clock,
  Car,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  CheckCheck,
  FileText,
} from "lucide-react";
import { useDemos } from "../../contexts/DemoContext";
import { useRole } from "../../contexts/RoleContext";
import { toast } from "sonner";
import { logger } from "../../services/logger";

export function WasherDemoRequests() {
  const { demos, acknowledgeDemo, startDemo, completeDemo } = useDemos();
  const { currentUser } = useRole();
  const [showDeclineModal, setShowDeclineModal] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declineNotes, setDeclineNotes] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState({
    servicesPerformed: [] as string[],
    servicesSkipped: "",
    vehicleConditionBefore: "",
    vehicleConditionAfter: "",
    productsUsed: [] as string[],
    issuesEncountered: "",
    customerPresent: false,
    customerFeedback: "",
  });

  // Filter demos assigned to current washer (using currentUser from RoleContext)
  const washerName = currentUser.name;
  const myDemos = demos.filter((demo) => demo.washerName === washerName);

  const pendingDemos = myDemos.filter((d) => d.acknowledgmentStatus === "Pending");
  const acceptedDemos = myDemos.filter((d) => d.acknowledgmentStatus === "Accepted" && !d.demoCompleted);
  const completedDemos = myDemos.filter((d) => d.demoCompleted);

  const handleAccept = (demoId: string) => {
    const demo = demos.find((d) => d.id === demoId);
    acknowledgeDemo(demoId, "Accepted");

    toast.success("Demo Accepted", {
      description: `You have accepted the demo for ${demo?.customerFirstName}. Full address is now visible.`,
    });

    // Simulate notifications
    logger.log(`✅ Notification to Supervisor: Washer ${washerName} has accepted the demo for ${demo?.customerFirstName} on ${demo?.demoDate}.`);
    logger.log(`✅ Notification to TSE: Washer acknowledged — demo confirmed for ${demo?.customerName}.`);
  };

  const handleDeclineSubmit = () => {
    if (!declineReason) {
      toast.error("Please select a decline reason");
      return;
    }

    const demo = demos.find((d) => d.id === showDeclineModal);
    acknowledgeDemo(showDeclineModal!, "Declined", declineReason, declineNotes);

    toast.info("Demo Declined", {
      description: `You have declined the demo for ${demo?.customerFirstName}. Supervisor will reassign.`,
    });

    // Simulate urgent notification to supervisor
    logger.log(`🚨 URGENT Notification to Supervisor: Washer ${washerName} declined the demo for ${demo?.customerFirstName}. Reason: ${declineReason}. Please assign another washer immediately.`);
    logger.log(`✅ Notification to Operations Manager: Washer ${washerName} declined demo for ${demo?.customerName}. Reason: ${declineReason}.`);

    setShowDeclineModal(null);
    setDeclineReason("");
    setDeclineNotes("");
  };

  const handleStartDemo = (demoId: string) => {
    const demo = demos.find((d) => d.id === demoId);
    startDemo(demoId);

    toast.success("Demo Started", {
      description: `Demo for ${demo?.customerFirstName} is now in progress.`,
    });

    // Simulate notifications
    logger.log(`✅ Notification to Supervisor & TSE: ${demo?.customerFirstName}'s demo has started at ${new Date().toLocaleTimeString()}.`);
  };

  const handleCompleteDemo = () => {
    if (!completionData.vehicleConditionAfter) {
      toast.error("Please fill all required fields");
      return;
    }

    const demo = demos.find((d) => d.id === showCompletionModal);
    const outcome = "Completed - Pending Follow-up"; // TSE will mark conversion

    completeDemo(showCompletionModal!, outcome, {
      servicesPerformed: completionData.servicesPerformed,
      servicesSkipped: completionData.servicesSkipped,
      vehicleConditionBefore: completionData.vehicleConditionBefore,
      vehicleConditionAfter: completionData.vehicleConditionAfter,
      productsUsed: completionData.productsUsed,
      issuesEncountered: completionData.issuesEncountered,
      customerPresentDuringWash: completionData.customerPresent,
      customerVerbalFeedback: completionData.customerFeedback,
    });

    toast.success("Demo Completed", {
      description: `Demo for ${demo?.customerFirstName} has been completed successfully.`,
    });

    // Simulate notifications
    logger.log(`✅ Notification to TSE: Demo completed for ${demo?.customerName}. Customer feedback: "${completionData.customerFeedback}". Please follow up within 2 hours.`);
    logger.log(`✅ Notification to Supervisor & OM: Demo job completed by ${washerName} for ${demo?.customerFirstName}.`);

    // Reset form
    setCompletionData({
      servicesPerformed: [],
      servicesSkipped: "",
      vehicleConditionBefore: "",
      vehicleConditionAfter: "",
      productsUsed: [],
      issuesEncountered: "",
      customerPresent: false,
      customerFeedback: "",
    });
    setShowCompletionModal(null);
  };

  const canStartDemo = (demo: any) => {
    // Can start 30 minutes before demo time slot
    const demoDateTime = new Date(demo.demoDate);
    const slotStart = demo.demoTimeSlot.includes("7–9") ? 7 :
                     demo.demoTimeSlot.includes("9–11") ? 9 :
                     demo.demoTimeSlot.includes("11 AM–1 PM") ? 11 : 16;
    demoDateTime.setHours(slotStart - 0.5, 0, 0, 0);
    
    return new Date() >= demoDateTime;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">My Demo Requests</h2>
        <p className="text-sm text-gray-500 mt-1">Accept, execute, and complete demo wash assignments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-700 font-medium">Pending Response</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">{pendingDemos.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-medium">Accepted</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{acceptedDemos.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700 font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{completedDemos.length}</p>
              </div>
              <CheckCheck className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Demo Requests */}
      {pendingDemos.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Pending Demo Requests ({pendingDemos.length})
          </h3>
          {pendingDemos.map((demo) => (
            <Card key={demo.id} className="border-2 border-orange-300 bg-orange-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {demo.customerFirstName}
                      <Badge
                        variant="outline"
                        className={`ml-2 ${
                          demo.demoType === "One-Time Service Demo"
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-teal-100 text-teal-700 border-teal-300"
                        }`}
                      >
                        {demo.demoType === "One-Time Service Demo" ? "One-Time Demo" : "Subscription Demo"}
                      </Badge>
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Action Required
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Limited Customer Details - Before Acknowledgment */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Date & Time</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="font-medium">{new Date(demo.demoDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs">{demo.demoTimeSlot}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs">Location (Limited)</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="font-medium">{demo.area}</span>
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      PIN: {demo.pinCode}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs">Vehicle</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Car className="w-3 h-3 text-gray-400" />
                      <span className="font-medium">{demo.vehicleCategory}</span>
                    </div>
                    {demo.vehicleColor && <p className="text-xs text-gray-600 mt-0.5">{demo.vehicleColor}</p>}
                    <p className="text-xs text-gray-600">{demo.vehicleRegistrationNumber}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs">Plan</p>
                    <p className="font-medium mt-1">{demo.planName}</p>
                  </div>
                </div>

                {demo.specialInstructions && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-900 mb-1">Special Instructions</p>
                    <p className="text-sm text-amber-800">{demo.specialInstructions}</p>
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Once you accept this demo, the full service address will be revealed and the job will be locked to you.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => handleAccept(demo.id)} className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Demo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeclineModal(demo.id)}
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Accepted Demos */}
      {acceptedDemos.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            Accepted Demos ({acceptedDemos.length})
          </h3>
          {acceptedDemos.map((demo) => (
            <Card key={demo.id} className="border-2 border-blue-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {demo.customerFirstName}
                    <Badge
                      variant="outline"
                      className={`ml-2 ${
                        demo.demoType === "One-Time Service Demo"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-teal-100 text-teal-700"
                      }`}
                    >
                      {demo.demoType === "One-Time Service Demo" ? "One-Time Demo" : "Subscription Demo"}
                    </Badge>
                  </CardTitle>
                  <Badge
                    variant="default"
                    className={
                      demo.assignmentStatus === "In Progress"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }
                  >
                    {demo.assignmentStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Full Customer Details - After Acknowledgment */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Date & Time</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="font-medium">{new Date(demo.demoDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs">{demo.demoTimeSlot}</span>
                    </div>
                    {demo.specificTimePreference && (
                      <p className="text-xs text-amber-700 mt-1">⏰ {demo.specificTimePreference}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs">Full Service Address</p>
                    <div className="flex items-start gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{demo.addressLine1}</p>
                        <p className="text-xs text-gray-600">
                          {demo.area}, {demo.city} - {demo.pinCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs">Vehicle</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Car className="w-3 h-3 text-gray-400" />
                      <span className="font-medium">{demo.vehicleCategory}</span>
                    </div>
                    {demo.vehicleColor && <p className="text-xs text-gray-600 mt-0.5">{demo.vehicleColor}</p>}
                    <p className="text-xs text-gray-600">{demo.vehicleRegistrationNumber}</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Plan to Demonstrate</p>
                  <p className="font-medium mt-1">{demo.planName}</p>
                </div>

                {demo.specialInstructions && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-900 mb-1">Special Instructions</p>
                    <p className="text-sm text-amber-800">{demo.specialInstructions}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {demo.assignmentStatus === "Acknowledged by Washer" && (
                    <>
                      {canStartDemo(demo) ? (
                        <Button onClick={() => handleStartDemo(demo.id)} className="flex-1 bg-purple-600 hover:bg-purple-700">
                          <Play className="w-4 h-4 mr-2" />
                          Start Demo
                        </Button>
                      ) : (
                        <Button disabled className="flex-1">
                          <Clock className="w-4 h-4 mr-2" />
                          Available 30min before slot
                        </Button>
                      )}
                    </>
                  )}
                  {demo.assignmentStatus === "In Progress" && (
                    <Button onClick={() => setShowCompletionModal(demo.id)} className="flex-1 bg-green-600 hover:bg-green-700">
                      <CheckCheck className="w-4 h-4 mr-2" />
                      Complete Demo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Demos */}
      {completedDemos.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CheckCheck className="w-5 h-5 text-green-600" />
            Completed Demos ({completedDemos.length})
          </h3>
          {completedDemos.slice(0, 3).map((demo) => (
            <Card key={demo.id} className="bg-green-50/30 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {demo.customerFirstName} • {demo.vehicleCategory}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Completed on {demo.demoCompletedAt} • Outcome: {demo.demoOutcome}
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                Decline Demo Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="declineReason">Decline Reason *</Label>
                <Select value={declineReason} onValueChange={setDeclineReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vehicle type not in my expertise">Vehicle type not in my expertise</SelectItem>
                    <SelectItem value="Location not reachable">Location not reachable</SelectItem>
                    <SelectItem value="Personal emergency">Personal emergency</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="declineNotes">Additional Notes *</Label>
                <Textarea
                  id="declineNotes"
                  placeholder="Please provide details..."
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowDeclineModal(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleDeclineSubmit} className="flex-1 bg-red-600 hover:bg-red-700">
                  Confirm Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (() => {
        const demo = demos.find((d) => d.id === showCompletionModal);
        const PLAN_SERVICES = ["Exterior Wash", "Interior Cleaning", "Wax Finish", "Tire Shine", "Dashboard Polish"];
        const PRODUCTS = ["Car Shampoo", "Wax Polish", "Interior Cleaner", "Tire Black", "Glass Cleaner"];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <Card className="max-w-2xl w-full my-8">
              <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Complete Demo Report — {demo?.customerFirstName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label>Vehicle Condition Before Wash *</Label>
                    <Select
                      value={completionData.vehicleConditionBefore}
                      onValueChange={(val) => setCompletionData({ ...completionData, vehicleConditionBefore: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Clean">Clean</SelectItem>
                        <SelectItem value="Moderate Dust">Moderate Dust</SelectItem>
                        <SelectItem value="Heavy Dirt">Heavy Dirt</SelectItem>
                        <SelectItem value="Bird Dropping">Bird Dropping</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Vehicle Condition After Wash *</Label>
                    <Select
                      value={completionData.vehicleConditionAfter}
                      onValueChange={(val) => setCompletionData({ ...completionData, vehicleConditionAfter: val })}
                    >
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

                <div>
                  <Label>Services Performed (based on {demo?.planName})</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {PLAN_SERVICES.map((service) => (
                      <label key={service} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={completionData.servicesPerformed.includes(service)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCompletionData({
                                ...completionData,
                                servicesPerformed: [...completionData.servicesPerformed, service],
                              });
                            } else {
                              setCompletionData({
                                ...completionData,
                                servicesPerformed: completionData.servicesPerformed.filter((s) => s !== service),
                              });
                            }
                          }}
                        />
                        {service}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Products Used</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {PRODUCTS.map((product) => (
                      <label key={product} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={completionData.productsUsed.includes(product)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCompletionData({
                                ...completionData,
                                productsUsed: [...completionData.productsUsed, product],
                              });
                            } else {
                              setCompletionData({
                                ...completionData,
                                productsUsed: completionData.productsUsed.filter((p) => p !== product),
                              });
                            }
                          }}
                        />
                        {product}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Customer Present During Wash?</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={completionData.customerPresent === true}
                        onChange={() => setCompletionData({ ...completionData, customerPresent: true })}
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={completionData.customerPresent === false}
                        onChange={() => setCompletionData({ ...completionData, customerPresent: false })}
                      />
                      No
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Customer Verbal Feedback (Important for TSE follow-up)</Label>
                  <Textarea
                    placeholder="What did the customer say during or after the demo?"
                    value={completionData.customerFeedback}
                    onChange={(e) => setCompletionData({ ...completionData, customerFeedback: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Any Issues Encountered?</Label>
                  <Textarea
                    placeholder="e.g., heavy scratch on left door — customer informed"
                    value={completionData.issuesEncountered}
                    onChange={(e) => setCompletionData({ ...completionData, issuesEncountered: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowCompletionModal(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleCompleteDemo} className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Report & Complete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}