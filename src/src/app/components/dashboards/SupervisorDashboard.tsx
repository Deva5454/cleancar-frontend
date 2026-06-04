// Dashboard for Supervisor role
import { useNavigate } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Users, MapPin, ClipboardCheck, DollarSign,
  Package, Camera
} from "lucide-react";
import { toast } from "sonner";
import { WASHER_PERFORMANCE_DATA } from "../../data/washerPerformanceData";
import { MASTER_ATTENDANCE } from "../../data/masterData";
import { BackButton } from "../ui/back-button";

export function SupervisorDashboard() {
  const { currentUser } = useRole();
  const navigate = useNavigate();

  const handleSubmitAudit = () => {
    navigate("/supervisor-app/audit");
    toast.success("Opening Audit screen");
  };

  const handleIssueStock = () => {
    navigate("/supervisor-app/cloth");
    toast.success("Opening Cloth & Inventory");
  };

  const handleCashDeposit = () => {
    navigate("/supervisor-app/issues");
    toast.success("Opening Escalations for Cash Deposit");
  };

  const handleSiteVisit = () => {
    navigate("/supervisor-app/team");
    toast.success("Opening Team Attendance");
  };

  // Use centralized washer performance data for supervisor's team
  const myTeam = WASHER_PERFORMANCE_DATA.slice(0, 5).map((washer) => {
    const attendance = MASTER_ATTENDANCE.find(a => a.employeeName === washer.washerName);
    return {
      name: washer.washerName,
      washesCompleted: washer.totalWashes,
      status: attendance?.status === "Present" ? "Working" : "Absent",
      location: washer.pinCodes[0] || "Vesu, Surat",
    };
  });

  // Stats ONLY for this supervisor's cluster - calculated from centralized data
  const stats = {
    teamSize: myTeam.length,
    presentToday: myTeam.filter(m => m.status === "Working").length,
    totalWashes: myTeam.reduce((sum, m) => sum + (m.washesCompleted || 0), 0),
    cashCollected: 15000,
    stockIssued: 12,
    sitesVisited: 3,
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supervisor Control Panel</h2>
          <p className="text-sm text-gray-500 mt-1">{currentUser.name} • Vesu Cluster (395006) • Showing only your team data</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleSiteVisit}
        >
          <Camera className="w-4 h-4 mr-2" />
          Site Visit
        </Button>
      </div>

      {/* Stats Grid - ONLY MY CLUSTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.teamSize}</p>
              <p className="text-xs text-gray-500">My Team</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-green-50 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.presentToday}</p>
              <p className="text-xs text-gray-500">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-purple-50 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.totalWashes}</p>
              <p className="text-xs text-gray-500">Team Washes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-orange-50 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">₹{(stats.cashCollected / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Cash</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-teal-50 text-teal-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.stockIssued}</p>
              <p className="text-xs text-gray-500">Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.sitesVisited}</p>
              <p className="text-xs text-gray-500">Visits</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-16 cursor-pointer" onClick={handleSubmitAudit}>
              <ClipboardCheck className="w-5 h-5 mr-2" />
              Submit Audit
            </Button>
            <Button variant="outline" className="h-16 cursor-pointer" onClick={handleIssueStock}>
              <Package className="w-5 h-5 mr-2" />
              Issue Stock
            </Button>
            <Button variant="outline" className="h-16 cursor-pointer" onClick={handleCashDeposit}>
              <DollarSign className="w-5 h-5 mr-2" />
              Cash Deposit
            </Button>
            <Button variant="outline" className="h-16 cursor-pointer" onClick={handleSiteVisit}>
              <MapPin className="w-5 h-5 mr-2" />
              Site Visit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">My Team - Today's Performance</h3>
          <div className="space-y-3">
            {myTeam.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                    member.status === "Working" ? "bg-green-500" : "bg-gray-400"
                  }`}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {member.location}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{member.washesCompleted}</p>
                    <p className="text-xs text-gray-500">washes</p>
                  </div>
                  <Badge variant={member.status === "Working" ? "secondary" : "outline"}>
                    {member.status}
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