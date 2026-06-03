// Dashboard for Car Washer role
import { useRole } from "../../contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Clock, CheckCircle, DollarSign, Award,
  Camera, MapPin, Car
} from "lucide-react";
import { toast } from "sonner";
import { WASHER_PERFORMANCE_DATA } from "../../data/washerPerformanceData";
import { MASTER_WASH_RECORDS } from "../../data/masterData";
import { BackButton } from "../ui/back-button";

export function WasherDashboard() {
  const { currentUser } = useRole();
  const navigate = useNavigate();

  const handleCheckOut = () => {
    toast.success("Check-out recorded successfully!");
  };

  const handleStartNewWash = () => {
    navigate("/car-washer");
  };

  const handleReportIssue = () => {
    navigate("/complaints");
  };

  // Get current washer's data from centralized performance data
  const currentWasherName = currentUser.name;
  const washerPerformance = WASHER_PERFORMANCE_DATA.find(w => w.washerName === currentWasherName) || WASHER_PERFORMANCE_DATA[0];

  // Data filtered to ONLY this car washer - from centralized data
  const todayData = {
    checkInTime: "04:02 AM",
    washesCompleted: washerPerformance.totalWashes || 0,
    targetWashes: washerPerformance.idealWashes || 0,
    adhocEarnings: washerPerformance.details?.incentives || 0,
    avgTimePerWash: washerPerformance.avgDurationMinutes || 0,
    qualityScore: washerPerformance.qualityScore || 0,
  };

  // ONLY this washer's washes - filter from master wash records
  const todayWashes = MASTER_WASH_RECORDS
    .filter(wash => wash.washerName === currentWasherName)
    .slice(0, 3)
    .map((wash, index) => ({
      id: index + 1,
      carNo: wash.carNo,
      customer: wash.customerName,
      time: wash.scheduledTime,
      status: wash.status,
      photos: wash.photosTaken,
    }));

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Work Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Welcome, {currentUser.name} • Track your daily performance and earnings</p>
        </div>
        <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={handleCheckOut}>
          <Clock className="w-5 h-5 mr-2" />
          Check Out
        </Button>
      </div>

      {/* Today's Stats - ONLY MY DATA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">My Washes Today</p>
                <p className="text-3xl font-bold mt-2">{todayData.washesCompleted}/{todayData.targetWashes}</p>
                <p className="text-xs text-gray-500 mt-1">{todayData.targetWashes > 0 ? Math.round((todayData.washesCompleted / todayData.targetWashes) * 100) : 0}% of my target</p>
              </div>
              <div className="bg-blue-100 text-blue-600 p-4 rounded-lg">
                <Car className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">My Adhoc Earnings</p>
                <p className="text-3xl font-bold mt-2">₹{todayData.adhocEarnings}</p>
                <p className="text-xs text-gray-500 mt-1">My extra income today</p>
              </div>
              <div className="bg-green-100 text-green-600 p-4 rounded-lg">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">My Quality Score</p>
                <p className="text-3xl font-bold mt-2">{todayData.qualityScore}/10</p>
                <p className="text-xs text-gray-500 mt-1">My weekly average</p>
              </div>
              <div className="bg-purple-100 text-purple-600 p-4 rounded-lg">
                <Award className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button className="h-20 flex flex-col gap-2" onClick={handleStartNewWash}>
              <Camera className="w-6 h-6" />
              <span>Start New Wash</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={handleReportIssue}>
              <MapPin className="w-6 h-6" />
              <span>Report Issue</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule - ONLY MY WASHES */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">My Wash Schedule Today</h3>
          <p className="text-xs text-gray-500 mb-3">Showing only my assigned washes</p>
          <div className="space-y-3">
            {todayWashes.map((wash) => (
              <div key={wash.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    wash.status === "Completed" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                  }`}>
                    {wash.status === "Completed" ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-medium">{wash.carNo}</p>
                    <p className="text-sm text-gray-600">{wash.customer} • {wash.time}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {wash.photos && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      Photos
                    </Badge>
                  )}
                  <Badge variant={wash.status === "Completed" ? "secondary" : "default"}>
                    {wash.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}