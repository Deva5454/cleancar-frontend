import { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { EventTriggerLabel } from "../EventBadge";
import { useCustomers } from "../../../contexts/CustomerContext";
import { useRole } from "../../../contexts/RoleContext";
import { useCity } from "../../../contexts/CityContext";

interface ScheduleDemoPanelProps {
  lead: any;
  onClose: () => void;
  onComplete: () => void;
}

export function ScheduleDemoPanel({
  lead,
  onClose,
  onComplete,
}: ScheduleDemoPanelProps) {
  const { appendLeadActivity, updateLead, customers, updateCustomer } = useCustomers();
  const { currentUser } = useRole();
  const { availableCities } = useCity();
  const leadId = lead.leadId || lead.id;
  const [demoType, setDemoType] = useState("subscription");
  const [demoDate, setDemoDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [demoAddress, setDemoAddress] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [plan, setPlan] = useState(lead.planOfInterest);
  const [instructions, setInstructions] = useState("");
  const [demoCity, setDemoCity] = useState(lead?.address?.city || "Surat");
  const [demoPinCode, setDemoPinCode] = useState(lead?.address?.pinCode || "");

  // Pincode options per city
  const CITY_PINCODES: Record<string, string[]> = {
    "Surat":  ["395001","395002","395003","395004","395005","395006","395007","395008","395009","395010"],
    "Mumbai": ["400001","400002","400003","400004","400005","400006","400007","400008","400009","400010"],
  };
  const availablePins = CITY_PINCODES[demoCity] || [];

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    if (!demoDate || !timeSlot || !supervisor) {
      toast.error("Please fill all required fields");
      return;
    }

    // Check minimum date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const selectedDate = new Date(demoDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < tomorrow) {
      toast.error("Demo date must be tomorrow or later");
      return;
    }

    toast.success("Demo scheduled successfully!");
    toast.info("Operations Manager has been notified");

    updateLead(leadId, {
      stage: "demo_scheduled",
      followUpDate: demoDate,
    });
    appendLeadActivity(leadId, {
      timestamp: new Date().toISOString(),
      type: "demo_scheduled",
      description: `Demo scheduled for ${new Date(demoDate).toLocaleDateString("en-IN")} at ${timeSlot}`,
      performedBy: currentUser?.name || "TSE",
      metadata: { demoDate, demoTimeSlot: timeSlot, address: demoAddress },
    });
    // Sync to CustomerContext status
    const customer = customers.find(c => c.customerId === leadId);
    if (customer) {
      updateCustomer(leadId, { status: "Demo Scheduled" });
    }

    onComplete();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          <h4 className="font-semibold text-gray-900">Schedule Demo</h4>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSchedule} className="space-y-4">
        {/* Demo Type */}
        <div className="space-y-2">
          <Label>Demo Type *</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDemoType("onetime")}
              className={`p-4 border-2 rounded-lg text-left ${
                demoType === "onetime"
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200"
              }`}
            >
              <p className="font-medium text-gray-900">One-Time Service Demo</p>
              <p className="text-xs text-gray-500 mt-1">
                Single wash demonstration
              </p>
            </button>
            <button
              type="button"
              onClick={() => setDemoType("subscription")}
              className={`p-4 border-2 rounded-lg text-left ${
                demoType === "subscription"
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200"
              }`}
            >
              <p className="font-medium text-gray-900">
                Subscription Package Demo
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Full service demonstration
              </p>
            </button>
          </div>
        </div>

        {/* Demo Date */}
        <div className="space-y-2">
          <Label>Demo Date * (Minimum: Tomorrow)</Label>
          <Input
            type="date"
            value={demoDate}
            onChange={(e) => setDemoDate(e.target.value)}
            min={
              new Date(Date.now() + 86400000).toISOString().split("T")[0]
            }
            required
          />
        </div>

        {/* Time Slot */}
        <div className="space-y-2">
          <Label>Time Slot *</Label>
          <Select value={timeSlot} onValueChange={setTimeSlot} required>
            <SelectTrigger>
              <SelectValue placeholder="Select time slot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning (6 AM - 9 AM)</SelectItem>
              <SelectItem value="mid-morning">
                Mid-Morning (9 AM - 12 PM)
              </SelectItem>
              <SelectItem value="afternoon">Afternoon (12 PM - 3 PM)</SelectItem>
              <SelectItem value="evening">Evening (3 PM - 6 PM)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Specific Time Preference */}
        <div className="space-y-2">
          <Label>Specific Time Preference (Optional)</Label>
          <Input type="time" placeholder="e.g., 08:30 AM" />
        </div>

        {/* Plan to Demonstrate */}
        <div className="space-y-2">
          <Label>Plan to Demonstrate</Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CleanCar Basic">CleanCar Basic</SelectItem>
              <SelectItem value="CleanCar Premium">CleanCar Premium</SelectItem>
              <SelectItem value="CleanCar Elite">CleanCar Elite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Service Address */}
        <div className="space-y-2">
          <Label>Service Address</Label>
          <Input defaultValue={lead.area} />
          <Input placeholder="Address Line 1" />
          <div className="grid grid-cols-2 gap-2">
            <Select value={demoCity} onValueChange={(val) => { setDemoCity(val); setDemoPinCode(""); }}>
              <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>
                {availableCities.map(c => (
                  <SelectItem key={c.id} value={c.displayName}>{c.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={demoPinCode} onValueChange={setDemoPinCode}>
              <SelectTrigger><SelectValue placeholder="Select PIN code" /></SelectTrigger>
              <SelectContent>
                {availablePins.map(pin => (
                  <SelectItem key={pin} value={pin}>{pin}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Reg. Number</Label>
            <Input placeholder="GJ-05-AB-1234" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select defaultValue={lead.vehicleCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hatchback">Hatchback</SelectItem>
                <SelectItem value="Sedan">Sedan</SelectItem>
                <SelectItem value="SUV">SUV</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <Input placeholder="White" />
          </div>
        </div>

        {/* Assign to Supervisor */}
        <div className="space-y-2">
          <Label>Assign to Supervisor *</Label>
          <Select value={supervisor} onValueChange={setSupervisor} required>
            <SelectTrigger>
              <SelectValue placeholder="Select supervisor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="suresh">
                Suresh Yadav - Vesu Zone (3 demos today)
              </SelectItem>
              <SelectItem value="ramesh">
                Ramesh Vora - Adajan Zone (2 demos today)
              </SelectItem>
              <SelectItem value="vijay">
                Vijay Singh - Citylight Zone (4 demos today)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            ⚠️ Warning shown if supervisor has 5+ demos on selected date
          </p>
        </div>

        {/* Special Instructions */}
        <div className="space-y-2">
          <Label>Special Instructions (Optional)</Label>
          <Textarea
            placeholder="Any special requirements or notes..."
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            ℹ️ Operations Manager will be automatically notified once demo is confirmed
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <EventTriggerLabel event="DEMO_SCHEDULED" className="justify-center" />
          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Confirm Demo
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
