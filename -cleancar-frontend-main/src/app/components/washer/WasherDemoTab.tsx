// Demo Tab - Demo Request Handling for Washers
import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Camera, MapPin, Car, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function WasherDemoTab() {
  const [demoRequests, setDemoRequests] = useState([
    {
      id: "DEMO001",
      customerFirstName: "Sneha",
      area: "Vesu",
      pinCode: "395007",
      vehicleCategory: "Mid/Large SUV",
      vehicleColor: "Silver",
      packageName: "Premium Wash",
      timeSlot: "10:00 - 10:30",
      demoType: "Subscription Demo",
      status: "Pending",
      specialInstructions: "Show interior cleaning features",
    },
  ]);

  const handleAcceptDemo = (demoId: string) => {
    setDemoRequests(prev => prev.filter(demo => demo.id !== demoId));
    toast.success("Demo accepted! Check your Today tab for details.");
  };

  const handleDeclineDemo = (demoId: string) => {
    setDemoRequests(prev => prev.filter(demo => demo.id !== demoId));
    toast.error("Demo declined");
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Demo Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Accept or decline demo assignments
        </p>
      </div>

      {/* Alert Banner */}
      {demoRequests.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <p className="font-medium text-amber-900">
              {demoRequests.length} demo request{demoRequests.length !== 1 ? 's' : ''} awaiting your response
            </p>
          </div>
        </div>
      )}

      {/* Demo Request Cards */}
      <div className="space-y-3">
        {demoRequests.map((demo) => (
          <Card key={demo.id} className="border-2 border-amber-300 bg-amber-50">
            <CardContent className="p-4 space-y-3">
              {/* Demo Request Header */}
              <div className="bg-amber-200 -mx-4 -mt-4 px-4 py-2 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-800" />
                  <span className="font-bold text-amber-900">
                    Demo Request
                  </span>
                  <Badge className="bg-teal-600 text-white ml-auto">
                    {demo.demoType}
                  </Badge>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-2 pt-2">
                <p className="text-xl font-bold text-gray-900">
                  {demo.customerFirstName}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {demo.area} • {demo.pinCode}
                  </span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    Full address will be revealed on accept
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Car className="w-4 h-4" />
                  <span className="font-medium">
                    {demo.vehicleCategory} · {demo.vehicleColor}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{demo.timeSlot}</span>
                </div>
                <div className="bg-teal-50 rounded px-2 py-1.5 inline-block">
                  <p className="text-sm font-semibold text-teal-700">
                    {demo.packageName}
                  </p>
                </div>
                {demo.specialInstructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs text-blue-800">
                      <strong>Instructions:</strong> {demo.specialInstructions}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => handleAcceptDemo(demo.id)}
                  className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  Accept Demo
                </Button>
                <Button
                  onClick={() => handleDeclineDemo(demo.id)}
                  variant="outline"
                  className="w-full h-12 border-2 border-red-300 text-red-700 hover:bg-red-50"
                >
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {demoRequests.length === 0 && (
        <div className="text-center py-12">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No demo requests at the moment</p>
          <p className="text-sm text-gray-400 mt-1">
            You'll be notified when a new demo is assigned
          </p>
        </div>
      )}
    </div>
  );
}
