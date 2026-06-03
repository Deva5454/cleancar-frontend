import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useCity } from "../../../contexts/CityContext";
import { useCustomers } from "../../../contexts/CustomerContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Button } from "../../ui/button";
import { Phone, Mail, Check, MapPin } from "lucide-react";
import { toast } from "sonner";

interface LeadOverviewTabProps {
  lead: any;
}

export function LeadOverviewTab({ lead }: LeadOverviewTabProps) {
  const { availableCities } = useCity();
  const { updateLead } = useCustomers();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [leadCity, setLeadCity] = useState(lead?.address?.city || "Surat");
  const [leadPinCode, setLeadPinCode] = useState(lead?.address?.pinCode || "");

  // Pincode options per city
  const CITY_PINCODES: Record<string, string[]> = {
    "Surat":  ["395001","395002","395003","395004","395005","395006","395007","395008","395009","395010"],
    "Mumbai": ["400001","400002","400003","400004","400005","400006","400007","400008","400009","400010"],
  };
  const availablePins = CITY_PINCODES[leadCity] || [];

  const PIN_TO_AREA: Record<string, string> = {
    "395001": "Adajan", "395002": "Varachha", "395003": "Katargam",
    "395005": "Althan", "395006": "Dumas", "395007": "Vesu",
    "400001": "Bandra", "400002": "Andheri", "400003": "Dadar",
    "400004": "Thane", "400005": "Borivali",
  };

  const handleFieldSave = (field: string, value: string) => {
    toast.success("Field updated successfully", {
      icon: <Check className="w-4 h-4 text-green-600" />,
    });
    setIsEditing(null);
  };

  return (
    <div className="space-y-6">
      {/* Customer Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="flex items-center gap-2">
                {isEditing === "name" ? (
                  <>
                    <Input
                      defaultValue={lead.customerName}
                      onBlur={(e) => handleFieldSave("name", e.target.value)}
                      autoFocus
                    />
                  </>
                ) : (
                  <p
                    className="flex-1 p-2 border border-transparent hover:border-gray-300 rounded cursor-pointer"
                    onClick={() => setIsEditing("name")}
                  >
                    {lead.customerName}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <div className="flex items-center gap-2">
                <p className="flex-1 p-2 border border-transparent">
                  {lead.mobile}
                </p>
                <Button size="sm" variant="outline">
                  <Phone className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <p className="flex-1 p-2 border border-transparent hover:border-gray-300 rounded cursor-pointer">
                  {lead.email}
                </p>
                <Button size="sm" variant="outline">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date of Birth (Optional)</Label>
              <Input type="date" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input placeholder="GJ-05-AB-1234" />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Category</Label>
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
              <Label>Vehicle Color</Label>
              <Input placeholder="White" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Vehicle Brand</Label>
            <Input placeholder="Maruti Suzuki" />
          </div>
        </CardContent>
      </Card>

      {/* Lead Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Lead Source</Label>
              <Select defaultValue="website">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="walkin">Walk-in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lead Stage</Label>
              <Select defaultValue={lead.stage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
                  <SelectItem value="Demo Done">Demo Done</SelectItem>
                  <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lead Temperature</Label>
              <div className="flex gap-2">
                {["Hot", "Warm", "Cold"].map((temp) => (
                  <button
                    key={temp}
                    className={`flex-1 p-2 border-2 rounded-lg text-sm font-medium ${
                      lead.temperature === temp
                        ? temp === "Hot"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : temp === "Warm"
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200"
                    }`}
                  >
                    {temp}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {["High", "Medium", "Low"].map((priority) => (
                  <button
                    key={priority}
                    className={`flex-1 p-2 border-2 rounded-lg text-sm font-medium ${
                      lead.priority === priority
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-200"
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Plan of Interest</Label>
              <Select defaultValue={lead.planOfInterest}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CleanCar Basic">CleanCar Basic</SelectItem>
                  <SelectItem value="CleanCar Premium">
                    CleanCar Premium
                  </SelectItem>
                  <SelectItem value="CleanCar Elite">CleanCar Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Service Location */}
          <div className="space-y-3 pt-4 border-t">
            <Label>Service Location</Label>
            <div className="space-y-2">
              <Input placeholder="Address Line 1" />
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={leadPinCode}
                  onValueChange={(val) => {
                    setLeadPinCode(val);
                    updateLead(lead.leadId, { address: { ...lead.address, pinCode: val, area: PIN_TO_AREA[val] || "" } });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select PIN code" /></SelectTrigger>
                  <SelectContent>
                    {availablePins.map(pin => (
                      <SelectItem key={pin} value={pin}>{pin} — {PIN_TO_AREA[pin] || "Area"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={PIN_TO_AREA[leadPinCode] || lead.area || ""}
                  readOnly
                  className="bg-gray-50"
                  placeholder="Auto-filled from PIN code"
                />
                <Input value={leadCity} readOnly className="bg-gray-50" placeholder="City" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-Up Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Follow-Up Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Next Follow-Up Date & Time</Label>
              <Input
                type="datetime-local"
                defaultValue="2026-03-17T10:00"
              />
            </div>
            <div className="space-y-2">
              <Label>Follow-Up Type</Label>
              <Select defaultValue="call">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="demo-checkin">Demo Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Note to Self</Label>
            <Input placeholder="Follow-up reminder notes..." />
          </div>
        </CardContent>
      </Card>

      {/* Lead Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">4 min</p>
              <p className="text-xs text-gray-600 mt-1">
                Lead Response Time
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">8</p>
              <p className="text-xs text-gray-600 mt-1">Total Call Attempts</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">5</p>
              <p className="text-xs text-gray-600 mt-1">Connected Calls</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">4.2 min</p>
              <p className="text-xs text-gray-600 mt-1">Avg Talk Duration</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">12</p>
              <p className="text-xs text-gray-600 mt-1">Messages Sent</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">7 days</p>
              <p className="text-xs text-gray-600 mt-1">Days in Stage</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
