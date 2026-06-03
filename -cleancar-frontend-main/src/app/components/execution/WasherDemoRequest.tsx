/**
 * Washer Demo Request Component
 * Implements strict data visibility rules and accept/decline workflow
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
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
import { AlertCircle, Calendar, Car, Clock, MapPin, FileText, CheckCircle, XCircle } from "lucide-react";
import { useDemos, type DemoWash } from "../../contexts/DemoContext";
import { toast } from "sonner";

interface WasherDemoRequestProps {
  demo: DemoWash;
  washerName: string;
}

export function WasherDemoRequest({ demo, washerName }: WasherDemoRequestProps) {
  const { acknowledgeDemo } = useDemos();
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineNotes, setDeclineNotes] = useState("");
  
  const isAccepted = demo.acknowledgmentStatus === "Accepted";
  const isDeclined = demo.acknowledgmentStatus === "Declined";
  const isPending = demo.acknowledgmentStatus === "Pending";

  const handleAccept = () => {
    acknowledgeDemo(demo.id, "Accepted");
    setAcceptDialogOpen(false);
    toast.success("Demo Accepted", {
      description: "Full address revealed. You can now view complete service details."
    });
  };

  const handleDecline = () => {
    if (!declineReason || declineNotes.length < 10) {
      toast.error("Please provide a reason and notes (minimum 10 characters)");
      return;
    }
    
    acknowledgeDemo(demo.id, "Declined", declineReason, declineNotes);
    setDeclineDialogOpen(false);
    toast.info("Demo Declined", {
      description: "Supervisor has been notified for reassignment."
    });
  };

  return (
    <>
      <Card className={`border-2 ${
        demo.demoType === "One-Time Service Demo" 
          ? "border-amber-300 bg-amber-50" 
          : "border-teal-300 bg-teal-50"
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">
              {isPending && "🔔 New Demo Request"}
              {isAccepted && "✅ Demo Accepted"}
              {isDeclined && "❌ Demo Declined"}
            </CardTitle>
            <Badge 
              variant={demo.demoType === "One-Time Service Demo" ? "default" : "secondary"}
              className={demo.demoType === "One-Time Service Demo" 
                ? "bg-amber-500 text-white" 
                : "bg-teal-600 text-white"
              }
            >
              {demo.demoType === "One-Time Service Demo" ? "One-Time Demo" : "Subscription Demo"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Customer Info - First Name Only */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <AlertCircle className="w-4 h-4" />
              Customer Details
            </div>
            <div className="bg-white rounded-lg p-3 space-y-1">
              <p className="text-sm">
                <span className="text-gray-500">Name:</span>{" "}
                <span className="font-semibold">{demo.customerFirstName}</span>
              </p>
            </div>
          </div>

          {/* Location - Before Accept: Area + PIN only */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <MapPin className="w-4 h-4" />
              Service Location
            </div>
            <div className="bg-white rounded-lg p-3 space-y-1">
              {!isAccepted ? (
                <>
                  <p className="text-sm">
                    <span className="text-gray-500">Area:</span>{" "}
                    <span className="font-medium">{demo.area}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">PIN Code:</span>{" "}
                    <span className="font-medium">{demo.pinCode}</span>
                  </p>
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                    <AlertCircle className="w-3 h-3" />
                    Full address will be revealed after you accept
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm">
                    <span className="text-gray-500">Address:</span>{" "}
                    <span className="font-medium">{demo.addressLine1}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Area:</span>{" "}
                    <span className="font-medium">{demo.area}, {demo.city}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">PIN Code:</span>{" "}
                    <span className="font-medium">{demo.pinCode}</span>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Demo Schedule */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Calendar className="w-4 h-4" />
              Demo Schedule
            </div>
            <div className="bg-white rounded-lg p-3 space-y-1">
              <p className="text-sm">
                <span className="text-gray-500">Date:</span>{" "}
                <span className="font-medium">{demo.demoDate}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Time Slot:</span>{" "}
                <span className="font-medium">{demo.demoTimeSlot}</span>
              </p>
              {demo.specificTimePreference && (
                <p className="text-sm">
                  <span className="text-gray-500">Specific Time:</span>{" "}
                  <span className="font-medium">{demo.specificTimePreference}</span>
                </p>
              )}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Car className="w-4 h-4" />
              Vehicle Details
            </div>
            <div className="bg-white rounded-lg p-3 space-y-1">
              <p className="text-sm">
                <span className="text-gray-500">Category:</span>{" "}
                <span className="font-medium">{demo.vehicleCategory}</span>
              </p>
              {demo.vehicleColor && (
                <p className="text-sm">
                  <span className="text-gray-500">Color:</span>{" "}
                  <span className="font-medium">{demo.vehicleColor}</span>
                </p>
              )}
              <p className="text-sm">
                <span className="text-gray-500">Registration:</span>{" "}
                <span className="font-medium">{demo.vehicleRegistrationNumber}</span>
              </p>
            </div>
          </div>

          {/* Plan to Demonstrate - NO PRICE */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="w-4 h-4" />
              Plan to Demonstrate
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-600">{demo.planName}</p>
            </div>
          </div>

          {/* Special Instructions */}
          {demo.specialInstructions && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4" />
                Special Instructions
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">{demo.specialInstructions}</p>
              </div>
            </div>
          )}

          {/* Action Buttons - Only if Pending */}
          {isPending && (
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => setDeclineDialogOpen(true)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => setAcceptDialogOpen(true)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept
              </Button>
            </div>
          )}

          {/* Status Messages */}
          {isAccepted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                You accepted this demo on {demo.acknowledgedAt}
              </p>
            </div>
          )}

          {isDeclined && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                You declined this demo. Supervisor notified for reassignment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accept Confirmation Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Demo Acceptance</DialogTitle>
            <DialogDescription>
              By accepting, you confirm your availability for this demo. The full service address will be revealed, 
              and this job will be locked to you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold">Demo Summary:</p>
              <p className="text-sm">Customer: {demo.customerFirstName}</p>
              <p className="text-sm">Date: {demo.demoDate}</p>
              <p className="text-sm">Time: {demo.demoTimeSlot}</p>
              <p className="text-sm">Location: {demo.area}, PIN {demo.pinCode}</p>
              <p className="text-sm">Vehicle: {demo.vehicleCategory} ({demo.vehicleColor})</p>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAccept} className="bg-teal-600 hover:bg-teal-700">
              Confirm Acceptance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Reason Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Demo Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining. This will help the supervisor reassign appropriately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="declineReason">Decline Reason *</Label>
              <Select value={declineReason} onValueChange={setDeclineReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vehicle type outside my expertise">Vehicle type outside my expertise</SelectItem>
                  <SelectItem value="Location not reachable">Location not reachable</SelectItem>
                  <SelectItem value="Slot conflict">Slot conflict</SelectItem>
                  <SelectItem value="Personal emergency">Personal emergency</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="declineNotes">Notes (minimum 10 characters) *</Label>
              <Textarea
                id="declineNotes"
                value={declineNotes}
                onChange={(e) => setDeclineNotes(e.target.value)}
                placeholder="Provide additional details..."
                rows={3}
              />
              <p className="text-xs text-gray-500">
                {declineNotes.length}/10 characters minimum
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDecline} 
              className="bg-red-600 hover:bg-red-700"
              disabled={!declineReason || declineNotes.length < 10}
            >
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}