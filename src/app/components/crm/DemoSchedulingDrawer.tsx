/**
 * Demo Scheduling Drawer - Part 1: TSE Demo Scheduling
 * Comprehensive demo scheduling with demo types, deadline rules, and one-time demo limit enforcement
 */

import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { useDemos } from "../../contexts/DemoContext";
import { Calendar, Clock, User, MapPin, AlertCircle, AlertTriangle, Car, Check, CheckCircle } from "lucide-react";
import { logger } from "../../services/logger";

interface DemoSchedulingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  leadData?: {
    id: string;
    name: string;
    mobile: string;
    area: string;
    address?: string;
    vehicleCategory: string;
    planOfInterest: string;
  };
}

const TIME_SLOTS = [
  { value: "Morning 7–9 AM", label: "Morning 7–9 AM" },
  { value: "Mid-Morning 9–11 AM", label: "Mid-Morning 9–11 AM" },
  { value: "Afternoon 11 AM–1 PM", label: "Afternoon 11 AM–1 PM" },
  { value: "Evening 4–7 PM", label: "Evening 4–7 PM" },
];

const SUPERVISORS = [
  { name: "Ramesh Vora", zone: "Zone A - Adajan", id: "SUP001" },
  { name: "Suresh Yadav", zone: "Zone B - Vesu", id: "SUP002" },
];

export function DemoSchedulingDrawer({ isOpen, onClose, leadData }: DemoSchedulingDrawerProps) {
  const { addDemo, checkPreviousDemos, requestTLApproval } = useDemos();

  const [demoType, setDemoType] = useState<"One-Time Service Demo" | "Subscription Package Demo">("One-Time Service Demo");
  const [demoDate, setDemoDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [specificTime, setSpecificTime] = useState("");
  const [plan, setPlan] = useState(leadData?.planOfInterest || "");
  const [addressLine1, setAddressLine1] = useState(leadData?.address || "");
  const [area, setArea] = useState(leadData?.area || "");
  const [city, setCity] = useState("Surat");
  const [pinCode, setPinCode] = useState("");
  const [vehicleRegNo, setVehicleRegNo] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState(leadData?.vehicleCategory || "");
  const [vehicleColor, setVehicleColor] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [supervisor, setSupervisor] = useState("");

  const [showTLApprovalDialog, setShowTLApprovalDialog] = useState(false);
  const [pendingDemoData, setPendingDemoData] = useState<any>(null);

  if (!isOpen) return null;

  const calculateDeadline = (date: string, slot: string, type: "One-Time Service Demo" | "Subscription Package Demo"): string => {
    const demoDateTime = new Date(date);
    
    if (type === "One-Time Service Demo") {
      // 3 hours before slot start time
      const slotStart = slot.includes("7–9") ? 7 : 
                       slot.includes("9–11") ? 9 :
                       slot.includes("11 AM–1 PM") ? 11 : 16; // Evening 4-7 PM
      demoDateTime.setHours(slotStart - 3, 0, 0, 0);
    } else {
      // 6 AM on demo day for Subscription
      demoDateTime.setHours(6, 0, 0, 0);
    }
    
    return demoDateTime.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Same-day demos not allowed
    const today = new Date();
    const selectedDate = new Date(demoDate);
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate <= today) {
      toast.error("Same-day demos cannot be scheduled. Please select a future date.");
      return;
    }

    // Check for previous demos
    if (leadData?.mobile) {
      const previousDemos = checkPreviousDemos(leadData.mobile);
      if (previousDemos.length > 0) {
        // Show TL approval dialog
        setPendingDemoData({
          customerName: leadData.name,
          customerFirstName: leadData.name.split(' ')[0],
          mobile: leadData.mobile,
          email: "",
          addressLine1,
          area,
          city,
          pinCode,
          vehicleCategory,
          vehicleColor,
          vehicleRegistrationNumber: vehicleRegNo,
          demoType,
          demoDate,
          demoTimeSlot: timeSlot,
          specificTimePreference: specificTime,
          planName: plan,
          planPrice: 0, // Placeholder, actual price should be fetched from plan data
          planOfInterest: plan,
          specialInstructions,
          assignedSupervisor: supervisor,
          assignedSupervisorZone: SUPERVISORS.find(s => s.name === supervisor)?.zone,
          assignmentDeadline: calculateDeadline(demoDate, timeSlot, demoType),
          previousDemoDate: previousDemos[0].demoDate,
        });
        setShowTLApprovalDialog(true);
        return;
      }
    }

    // Create demo
    createDemo();
  };

  const createDemo = () => {
    const selectedSupervisor = SUPERVISORS.find(s => s.name === supervisor);
    const firstName = leadData?.name.split(' ')[0] || "Customer";

    const newDemo = {
      id: `DW${String(Math.floor(Math.random() * 10000)).padStart(3, '0')}`,
      leadId: leadData?.id || `LD${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      
      customerName: leadData?.name || "",
      customerFirstName: firstName,
      mobile: leadData?.mobile || "",
      email: "",
      
      addressLine1,
      area,
      city,
      pinCode,
      
      vehicleCategory,
      vehicleColor,
      vehicleRegistrationNumber: vehicleRegNo,
      
      demoType,
      demoDate,
      demoTimeSlot: timeSlot,
      specificTimePreference: specificTime,
      
      planName: plan,
      planPrice: 0, // Placeholder, actual price should be fetched from plan data
      planOfInterest: plan,
      
      specialInstructions,
      
      tseScheduled: true,
      tseScheduledBy: "Neha Singh (TSE)",
      tseScheduledAt: new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
      
      assignedSupervisor: supervisor,
      assignedSupervisorZone: selectedSupervisor?.zone,
      supervisorDemosOnDate: 0,
      
      washerAssigned: false,
      washerName: null,
      washerAssignedAt: null,
      washerAssignedBy: null,
      
      assignmentDeadline: calculateDeadline(demoDate, timeSlot, demoType),
      assignmentDeadlinePassed: false,
      
      acknowledgmentStatus: "Pending" as const,
      acknowledgedAt: null,
      
      demoCompleted: false,
      demoCompletedAt: null,
      demoOutcome: null,
      jobStartedAt: null,
      customerPresentDuringWash: false,
      status: "Pending Washer Assignment",
      assignmentStatus: "Pending" as const,
      
      isPreviousDemo: false,
      tlApprovalRequired: false,
      
      notificationsSent: ["supervisor", "operations_manager"],
      timelineEntries: [
        {
          timestamp: new Date().toISOString(),
          actor: "Neha Singh (TSE)",
          action: `Demo scheduled and assigned to ${supervisor}`
        }
      ]
    };

    addDemo(newDemo);

    // Success notifications
    const deadlineText = demoType === "One-Time Service Demo" 
      ? "minimum 3 hours before demo time" 
      : "by 6:00 AM on demo day";

    toast.success("Demo Scheduled Successfully", {
      description: `Assigned to ${supervisor}. Washer must be assigned ${deadlineText}.`
    });

    // Simulate notifications
    logger.log(`✅ Notification to ${supervisor}: New demo assigned. Type: ${demoType}. Customer: ${leadData?.name}, Date: ${demoDate}, Time: ${timeSlot}. Please assign washer ${deadlineText}.`);
    logger.log(`✅ Notification to Operations Manager: Demo scheduled for ${leadData?.name} on ${demoDate} at ${timeSlot}. Supervisor: ${supervisor}. Washer assignment pending.`);

    // Send notification
    toast.success("Demo scheduled successfully", {
      description: `${newDemo.demoType} demo for ${newDemo.customerName} on ${newDemo.demoDate}`
    });

    onClose();
  };

  const handleTLApprovalRequest = () => {
    // In a real system, this would send approval request to Team Lead
    toast.info("TL Approval Requested", {
      description: "Your request has been sent to the Team Lead for approval."
    });
    setShowTLApprovalDialog(false);
    onClose();
  };

  // Check supervisor workload
  const getSupervisorDemosCount = (supervisorName: string) => {
    // Mock data - in real system, query from demos context
    return Math.floor(Math.random() * 4);
  };

  return (
    <>
      {/* Main Drawer */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full max-w-2xl">
          {/* Header */}
          <SheetHeader>
            <SheetTitle className="text-xl font-bold">Schedule Demo Wash</SheetTitle>
            <p className="text-sm text-blue-100 mt-1">
              {leadData?.name ? `Lead: ${leadData.name}` : "New Demo"}
            </p>
          </SheetHeader>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            {/* Demo Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Demo Type *</Label>
              <RadioGroup value={demoType} onValueChange={(val) => setDemoType(val as "One-Time Service Demo" | "Subscription Package Demo")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className={`cursor-pointer transition-all ${demoType === "One-Time Service Demo" ? "border-2 border-blue-600 bg-blue-50" : "border-2 border-gray-200 hover:border-blue-300"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="One-Time Service Demo" id="one-time" className="mt-1" />
                        <label htmlFor="one-time" className="cursor-pointer flex-1">
                          <p className="font-semibold text-sm">One-Time Service Demo</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Single wash demo for new customer
                          </p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            Washer must be assigned minimum 3 hours before demo time
                          </Badge>
                        </label>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer transition-all ${demoType === "Subscription Package Demo" ? "border-2 border-teal-600 bg-teal-50" : "border-2 border-gray-200 hover:border-teal-300"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="Subscription Package Demo" id="subscription" className="mt-1" />
                        <label htmlFor="subscription" className="cursor-pointer flex-1">
                          <p className="font-semibold text-sm">Subscription Package Demo</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Monthly plan demo for prospective subscriber
                          </p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            Washer must be assigned by 6:00 AM on demo day
                          </Badge>
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </RadioGroup>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="demoDate">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Demo Date *
                </Label>
                <Input
                  id="demoDate"
                  type="date"
                  value={demoDate}
                  onChange={(e) => setDemoDate(e.target.value)}
                  required
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeSlot">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time Slot *
                </Label>
                <Select value={timeSlot} onValueChange={setTimeSlot} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specificTime">Specific Time Preference (Optional)</Label>
              <Input
                id="specificTime"
                placeholder="e.g., 8:00 AM sharp, customer prefers morning"
                value={specificTime}
                onChange={(e) => setSpecificTime(e.target.value)}
              />
            </div>

            {/* Plan Selection */}
            <div className="space-y-2">
              <Label htmlFor="plan">Plan to Demonstrate *</Label>
              <Select value={plan} onValueChange={setPlan} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="plan1" value="Plan A">
                    Plan A - ₹1000/month
                  </SelectItem>
                  <SelectItem key="plan2" value="Plan B">
                    Plan B - ₹1500/month
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Address */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                <MapPin className="w-4 h-4 inline mr-1" />
                Service Address
              </Label>
              
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  placeholder="Flat/House No., Building Name"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Area *</Label>
                  <Select value={area} onValueChange={setArea} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Adajan">Adajan</SelectItem>
                      <SelectItem value="Vesu">Vesu</SelectItem>
                      <SelectItem value="Pal">Pal</SelectItem>
                      <SelectItem value="City Light">City Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pinCode">PIN Code *</Label>
                <Input
                  id="pinCode"
                  placeholder="395009"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                <Car className="w-4 h-4 inline mr-1" />
                Vehicle Details
              </Label>

              <div className="space-y-2">
                <Label htmlFor="vehicleRegNo">Vehicle Registration Number *</Label>
                <Input
                  id="vehicleRegNo"
                  placeholder="GJ05AB1234"
                  value={vehicleRegNo}
                  onChange={(e) => setVehicleRegNo(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleCategory">Vehicle Category *</Label>
                  <Select value={vehicleCategory} onValueChange={setVehicleCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sedan">Sedan</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="Hatchback">Hatchback</SelectItem>
                      <SelectItem value="MPV">MPV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleColor">Vehicle Color (Optional)</Label>
                  <Input
                    id="vehicleColor"
                    placeholder="White, Black, Silver..."
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions for Washer (Optional)</Label>
              <Textarea
                id="specialInstructions"
                placeholder="e.g., white SUV parked in basement, call customer on arrival, focus on wax finish..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
              />
            </div>

            {/* Supervisor Assignment */}
            <div className="space-y-2">
              <Label htmlFor="supervisor">Assign to Supervisor *</Label>
              <Select value={supervisor} onValueChange={setSupervisor} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {SUPERVISORS.map((sup) => {
                    const demosCount = getSupervisorDemosCount(sup.name);
                    return (
                      <SelectItem key={sup.id} value={sup.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{sup.name} — {sup.zone}</span>
                          {demosCount > 0 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {demosCount} demos on this date
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                Operations Manager will be notified automatically
              </p>
            </div>

            {/* Warning for supervisor workload */}
            {supervisor && getSupervisorDemosCount(supervisor) >= 5 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">High Workload Warning</p>
                  <p className="text-xs text-amber-800 mt-1">
                    This supervisor has {getSupervisorDemosCount(supervisor)} demos on {demoDate}. 
                    Consider assigning to another supervisor.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Demo
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* TL Approval Dialog */}
      {showTLApprovalDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Second Demo Requires Approval</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    This customer has already received a free demo on{" "}
                    <strong>{pendingDemoData?.previousDemoDate}</strong>. 
                    A second demo requires Team Lead approval.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowTLApprovalDialog(false);
                    setPendingDemoData(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleTLApprovalRequest}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Request TL Approval
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}